import { world } from "@minecraft/server";
import { contentLog, Server, sleep, Thread, Vector, Database } from "./../../library/Minecraft.js";
import { ToolAction } from "./base_tool.js";
import { getSession, hasSession } from "../sessions.js";
class ToolBuilder {
    constructor() {
        this.tools = new Map();
        this.bindings = new Map();
        this.databases = new Map();
        this.fixedBindings = new Map();
        this.conditionalBindings = new Map();
        this.disabled = [];
        this.currentTick = 0;
        Server.on("itemUseBefore", ev => {
            if (ev.source.typeId != "minecraft:player" || !ev.itemStack)
                return;
            this.onItemUse(ev.itemStack, ev.source, ev);
        });
        Server.on("itemUseOnBefore", ev => {
            if (ev.source.typeId != "minecraft:player" || !ev.itemStack)
                return;
            this.onItemUse(ev.itemStack, ev.source, ev, Vector.from(ev.block));
        });
        Server.on("blockBreak", ev => {
            if (!ev.itemStack)
                return;
            this.onBlockBreak(ev.itemStack, ev.player, ev, Vector.from(ev.block));
        });
        Server.on("blockHit", ev => {
            if (ev.damagingEntity.typeId != "minecraft:player")
                return;
            const item = Server.player.getHeldItem(ev.damagingEntity);
            if (!item)
                return;
            this.onBlockHit(item, ev.damagingEntity, ev, Vector.from(ev.hitBlock));
        });
        Server.on("tick", ev => {
            this.currentTick = ev.currentTick;
        });
        new Thread().start(function* (self) {
            while (true) {
                for (const player of world.getPlayers()) {
                    try {
                        const item = Server.player.getHeldItem(player);
                        if (!item)
                            continue;
                        yield* self.onItemTick(item, player, self.currentTick);
                    }
                    catch (err) {
                        contentLog.error(err);
                    }
                }
                yield sleep(1);
            }
        }, this);
    }
    register(toolClass, name, item, condition) {
        this.tools.set(name, toolClass);
        if (typeof item == "string") {
            this.fixedBindings.set(item, new toolClass());
        }
        else if (condition && Array.isArray(item)) {
            const tool = { condition, tool: new toolClass() };
            for (const key of item) {
                this.conditionalBindings.set(key, tool);
            }
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bind(toolId, itemId, playerId, ...args) {
        this.unbind(itemId, playerId);
        if (itemId) {
            const tool = new (this.tools.get(toolId))(...args);
            tool.type = toolId;
            this.createPlayerBindingMap(playerId);
            this.bindings.get(playerId).get(itemId)?.delete();
            this.bindings.get(playerId).set(itemId, tool);
            this.databases.get(playerId).set(itemId, tool);
            this.databases.get(playerId).save();
            return tool;
        }
        else {
            throw "worldedit.tool.noItem";
        }
    }
    unbind(itemId, playerId) {
        if (itemId) {
            if (this.fixedBindings.has(itemId)) {
                throw "worldedit.tool.fixedBind";
            }
            this.createPlayerBindingMap(playerId);
            this.bindings.get(playerId).get(itemId)?.delete();
            this.bindings.get(playerId).delete(itemId);
            this.databases.get(playerId).delete(itemId);
            this.databases.get(playerId).save();
        }
        else {
            throw "worldedit.tool.noItem";
        }
    }
    deleteBindings(playerId) {
        this.bindings.get(playerId).forEach(v => v.delete());
        this.bindings.delete(playerId);
        this.databases.delete(playerId);
        this.setDisabled(playerId, false);
    }
    hasBinding(itemId, playerId) {
        if (itemId) {
            return this.bindings.get(playerId)?.has(itemId) || this.fixedBindings.has(itemId);
        }
        else {
            return false;
        }
    }
    getBindingType(itemId, playerId) {
        if (itemId) {
            const tool = this.bindings.get(playerId)?.get(itemId) || this.fixedBindings.get(itemId);
            return tool?.type ?? "";
        }
        else {
            return "";
        }
    }
    getBoundItems(playerId, type) {
        this.createPlayerBindingMap(playerId);
        const tools = this.bindings.get(playerId);
        return tools ? Array.from(tools.entries())
            .filter(binding => !type || (typeof type == "string" ? binding[1].type == type : type.test(binding[1].type)))
            .map(binding => binding[0]) : [];
    }
    setProperty(itemId, playerId, prop, value) {
        if (itemId) {
            const tool = this.bindings.get(playerId).get(itemId);
            if (tool && prop in tool) {
                tool[prop] = value;
                this.databases.get(playerId).set(itemId, tool);
                this.databases.get(playerId).save();
                return true;
            }
        }
        return false;
    }
    getProperty(itemId, playerId, prop) {
        if (itemId) {
            const tool = this.bindings.get(playerId).get(itemId);
            if (tool && prop in tool) {
                return tool[prop];
            }
        }
        return null;
    }
    hasProperty(itemId, playerId, prop) {
        if (itemId) {
            const tool = this.bindings.get(playerId).get(itemId);
            if (tool && prop in tool) {
                return true;
            }
        }
        return false;
    }
    setDisabled(playerId, disabled) {
        if (disabled && !this.disabled.includes(playerId)) {
            this.disabled.push(playerId);
        }
        else if (!disabled && this.disabled.includes(playerId)) {
            this.disabled.splice(this.disabled.indexOf(playerId), 1);
        }
    }
    *onItemTick(item, player, tick) {
        if (this.disabled.includes(player.id) || !hasSession(player.id)) {
            return;
        }
        const key = item.typeId;
        let tool;
        if (this.bindings.get(player.id)?.has(key)) {
            tool = this.bindings.get(player.id).get(key);
        }
        else if (this.fixedBindings.has(key)) {
            tool = this.fixedBindings.get(key);
        }
        else {
            return;
        }
        const gen = tool.tick?.(tool, player, getSession(player), tick);
        if (gen)
            yield* gen;
    }
    onItemUse(item, player, ev, loc) {
        if (this.disabled.includes(player.id) || !hasSession(player.id)) {
            return;
        }
        const key = item.typeId;
        let tool;
        if (this.bindings.get(player.id)?.has(key)) {
            tool = this.bindings.get(player.id).get(key);
        }
        else if (this.fixedBindings.has(key)) {
            tool = this.fixedBindings.get(key);
        }
        else if (this.conditionalBindings.get(key)?.condition(player, getSession(player))) {
            tool = this.conditionalBindings.get(key).tool;
        }
        else {
            return;
        }
        if (tool.process(getSession(player), this.currentTick, loc ? ToolAction.USE_ON : ToolAction.USE, loc)) {
            ev.cancel = true;
        }
    }
    onBlockBreak(item, player, ev, loc) {
        if (this.disabled.includes(player.id)) {
            return;
        }
        const key = item.typeId;
        let tool;
        if (this.bindings.get(player.id)?.has(key)) {
            tool = this.bindings.get(player.id).get(key);
        }
        else if (this.fixedBindings.has(key)) {
            tool = this.fixedBindings.get(key);
        }
        else if (this.conditionalBindings.get(key)?.condition(player, getSession(player))) {
            tool = this.conditionalBindings.get(key).tool;
        }
        else {
            return;
        }
        if (tool.process(getSession(player), this.currentTick, ToolAction.BREAK, loc)) {
            ev.cancel = true;
        }
    }
    onBlockHit(item, player, ev, loc) {
        if (this.disabled.includes(player.id)) {
            return;
        }
        const key = item.typeId;
        let tool;
        if (this.bindings.get(player.id)?.has(key)) {
            tool = this.bindings.get(player.id).get(key);
        }
        else if (this.fixedBindings.has(key)) {
            tool = this.fixedBindings.get(key);
        }
        else if (this.conditionalBindings.get(key)?.condition(player, getSession(player))) {
            tool = this.conditionalBindings.get(key).tool;
        }
        else {
            return;
        }
        tool.process(getSession(player), this.currentTick, ToolAction.HIT, loc);
    }
    createPlayerBindingMap(playerId) {
        if (this.bindings.has(playerId))
            return;
        this.bindings.set(playerId, new Map());
        const database = new Database(`wedit:tools,${playerId}`);
        this.databases.set(playerId, database);
        database.load();
        for (const itemId of database.keys()) {
            const json = database.get(itemId);
            try {
                const toolClass = this.tools.get(json.type);
                const tool = new toolClass(...toolClass.parseJSON(json));
                tool.type = json.type;
                this.bindings.get(playerId).set(itemId, tool);
            }
            catch (err) {
                contentLog.error(`Failed to load tool from '${JSON.stringify(json)}' for '${itemId}': ${err}`);
            }
        }
    }
}
export const Tools = new ToolBuilder();
