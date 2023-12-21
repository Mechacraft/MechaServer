/* eslint-disable @typescript-eslint/ban-types */
import { ItemLockMode, ItemStack, system } from "@minecraft/server";
import { Server } from "./../../library/Minecraft.js";
import { PlayerUtil } from "./player_util.js";
import { print } from "server/util.js";
class HotbarUIForm {
    constructor(form) {
        this.form = form;
        this.items = [];
        this.tick = form.tick;
        this.entered = form.entered;
        this.exiting = form.exiting;
        this.cancel = form.cancel;
    }
    build(ctx, player) {
        const resEl = (element) => {
            return element instanceof Function ? element(ctx, player) : element;
        };
        this.items = [];
        this.title = resEl(this.form.title);
        const formItems = resEl(this.form.items);
        for (let i = 0; i < 8; i++) {
            const itemData = formItems[i] ?? { item: "wedit:blank" };
            this.items.push({
                name: resEl(itemData.item),
                data: resEl(itemData.dataValue ?? 0),
                action: itemData.action
            });
        }
        this.items.push({ name: "wedit:cancel_button", data: 0, action: (ctx, player) => {
                ctx.goto(null);
                this.cancel(ctx, player);
            } });
        return null;
    }
    enter(player, ctx) {
        PlayerUtil.stashHotbar(player);
        this.build(ctx, player);
        const title = this.title;
        const items = this.items;
        print(title, player);
        const inventory = Server.player.getInventory(player);
        for (let i = 0; i < items.length; i++) {
            const item = new ItemStack(items[i].name);
            item.lockMode = ItemLockMode.slot;
            inventory.setItem(i, item);
        }
        const itemUseBefore = (ev) => {
            if (ev.source != player)
                return;
            ev.cancel = true;
            const slot = player.selectedSlot;
            if (items[slot].name == "wedit:blank")
                return;
            system.run(() => items[slot].action?.(ctx, player));
        };
        Server.prependListener("itemUseBefore", itemUseBefore);
        const tick = () => {
            this.tick?.(ctx, player);
        };
        Server.prependListener("tick", tick);
        const eventCtx = ctx;
        eventCtx.setData("__useEvent__", itemUseBefore);
        eventCtx.setData("__tickEvent__", tick);
        this.entered?.(ctx, player);
    }
    exit(player, ctx) {
        this.exiting?.(ctx, player);
        const eventCtx = ctx;
        Server.off("itemUseBefore", eventCtx.getData("__useEvent__"));
        Server.off("tick", eventCtx.getData("__tickEvent__"));
        PlayerUtil.restoreHotbar(player);
    }
}
class HotbarContext {
    constructor(player, base) {
        this.player = player;
        this.stack = [];
        this.data = {};
        this.base = base;
    }
    getData(key) {
        return this.base?.getData(key) ?? this.data[key];
    }
    setData(key, value) {
        this.base?.setData(key, value);
        this.data[key] = value;
    }
    goto(menu) {
        if (menu) {
            this.stack.push(menu);
        }
        try {
            this.currentForm = HotbarUI.goto(menu, this.player, this);
        }
        catch (e) {
            if (!this.currentForm && this.base) {
                this.base.goto(menu);
            }
            else {
                throw e;
            }
        }
    }
    returnto(menu) {
        let popped;
        // eslint-disable-next-line no-cond-assign
        while (popped = this.stack.pop()) {
            if (popped == menu) {
                this.goto(menu);
                return;
            }
        }
        this.goto(null);
        this.base?.returnto(menu);
    }
}
class HotbarUIBuilder {
    constructor() {
        this.forms = new Map();
        this.active = new Map();
    }
    /**
     * Register a Hotbar UI Form to be displayed to users.
     * @param name The name of the UI form
     * @param form The layout of the UI form
     */
    register(name, form) {
        this.forms.set(name, new HotbarUIForm(form));
    }
    /**
     * Displays a UI form registered as `name` to `player`.
     * @param name The name of the UI form
     * @param player The player the UI form must be shown to
     * @param data Context data to be made available to the UI form's elements
     * @returns True if another form is already being displayed. Otherwise false.
     */
    show(name, player, data) {
        if (this.displayingUI(player)) {
            return true;
        }
        const ctx = new HotbarContext(player);
        Object.entries(data).forEach(e => ctx.setData(e[0], e[1]));
        ctx.goto(name);
        return false;
    }
    /**
     * Go from one UI form to another.
     * @internal
     * @param name The name of the UI form to go to
     * @param player The player to display the UI form to
     * @param ctx The context to be passed to the UI form
     */
    goto(name, player, ctx) {
        if (!(ctx instanceof HotbarContext)) {
            ctx = new HotbarContext(player, ctx);
        }
        if (this.active.has(player)) {
            this.active.get(player).exit(player, ctx);
            this.active.delete(player);
        }
        if (!name) {
            return;
        }
        else if (this.forms.has(name)) {
            const form = this.forms.get(name);
            this.active.set(player, form);
            form.enter(player, ctx);
            return form;
        }
        else {
            throw new TypeError(`Menu "${name}" has not been registered!`);
        }
    }
    /**
     * @param player The player being tested
     * @param ui The name of the UI to test for, if you want to be specific
     * @returns Whether the UI, or any at all is being displayed.
     */
    displayingUI(player, ui) {
        if (this.active.has(player)) {
            if (ui) {
                const form = this.active.get(player);
                for (const registered of this.forms.values()) {
                    if (registered == form) {
                        return true;
                    }
                }
                return false;
            }
            return true;
        }
        return false;
    }
}
export const HotbarUI = new HotbarUIBuilder();
