import { Server, Vector, setTickTimeout, contentLog } from "./../library/Minecraft.js";
import { Tools } from "./tools/tool_manager.js";
import { History } from "./modules/history.js";
import { Mask } from "./modules/mask.js";
import { Pattern } from "./modules/pattern.js";
import { PlayerUtil } from "./modules/player_util.js";
import { RegionBuffer } from "./modules/region_buffer.js";
import { Selection } from "./modules/selection.js";
import config from "config.js";
const playerSessions = new Map();
const pendingDeletion = new Map();
Server.on("playerChangeDimension", ev => {
    playerSessions.get(ev.player.id)?.selection.clear();
});
/**
 * Represents a WorldEdit user's current session with the addon.
 * It manages their selections, operation history, and other things related to WorldEdit per player.
 */
export class PlayerSession {
    constructor(player) {
        /**
         * Is true while a WorldEdit command is being called from an item; false otherwise.
         * @readonly
         */
        this.usingItem = false;
        /**
         * A pattern created by the pattern picker
         * It's used by custom commands that are called from items.
         */
        this.globalPattern = new Pattern();
        /**
         * A global mask created by the mask picker and ;gmask.
         * It's used by various commands and operation that are affected by masks such as the ;cyl command and brushes in combination of their own masks.
         */
        this.globalMask = new Mask();
        /**
         * Whether the copy and cut items should include entities in the clipboard.
         */
        this.includeEntities = false;
        /**
         * Whether the copy and cut items should include air in the clipboard.
         */
        this.includeAir = false;
        /**
         * Whether the session should run in performance mode.
         */
        this.performanceMode = false;
        /**
         * The amount of blocks that can be changed in one operation.
         */
        this.changeLimit = config.defaultChangeLimit == -1 ? Infinity : config.defaultChangeLimit;
        /**
         * The transformation properties currently on the clipboard
         */
        this.clipboardTransform = {
            relative: Vector.ZERO,
            rotation: Vector.ZERO,
            flip: Vector.ONE
        };
        this.superPickaxe = {
            enabled: false,
            mode: "single",
            range: 0
        };
        this.regions = new Map();
        this.gradients = new Map();
        this.placementMode = "player";
        this.player = player;
        this.playerId = player.id;
        this.history = new History(this);
        this.selection = new Selection(player);
        this.drawOutlines = config.drawOutlines;
        if (!this.getTools().length) {
            this.bindTool("selection_wand", config.wandItem);
            this.bindTool("navigation_wand", config.navWandItem);
        }
        if (PlayerUtil.isHotbarStashed(player)) {
            PlayerUtil.restoreHotbar(player);
        }
        for (const tag of player.getTags()) {
            if (tag.startsWith("wedit:defaultTag_")) {
                this.selection.mode = tag.split("_", 2)[1];
            }
        }
    }
    set drawOutlines(val) {
        this._drawOutlines = val;
        this.selection.visible = val;
    }
    get drawOutlines() {
        return this._drawOutlines;
    }
    /**
     * @return The player that this session handles
     */
    getPlayer() {
        return this.player;
    }
    /**
     * @return The history handler that this session uses
     */
    getHistory() {
        return this.history;
    }
    /**
     * @internal
     */
    reassignPlayer(player) {
        this.player = player;
        this.playerId = player.id;
        this.selection = new Selection(player);
    }
    /**
     * Toggles the placement position between the player and first selection position
     */
    togglePlacementPosition() {
        this.placementMode = this.placementMode == "player" ? "selection" : "player";
    }
    /**
     * Get the position the player may use while excuting a command, such as ;fill and ;sphere
     * @returns placement position
     */
    getPlacementPosition() {
        if (this.placementMode == "player") {
            return Vector.from(this.player.location).floor();
        }
        else {
            const point = this.selection.points[0];
            if (!point)
                throw "";
            return point;
        }
    }
    /**
     * Binds a new tool to this session.
     * @param tool The id of the tool being made
     * @param item The id of the item to bind to (null defaults to held item)
     * @param args Optional parameters the tool uses during its construction.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bindTool(tool, item, ...args) {
        if (!item) {
            item = Server.player.getHeldItem(this.player)?.typeId;
        }
        return Tools.bind(tool, item, this.playerId, ...args);
    }
    /**
     * Tests for a property of a tool in the session's player's main hand.
     * @param item The id of the item with the tool to test (null defaults to held item)
     * @param property The name of the tool's property
     */
    hasToolProperty(item, property) {
        if (!item) {
            item = Server.player.getHeldItem(this.player)?.typeId;
        }
        return Tools.hasProperty(item, this.playerId, property);
    }
    /**
     * Sets a property of a tool in the session's player's main hand.
     * @param item The id of the item with the tool to set the property of (null defaults to held item)
     * @param property The name of the tool's property
     * @param value The new value of the tool's property
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setToolProperty(item, property, value) {
        if (!item) {
            item = Server.player.getHeldItem(this.player)?.typeId;
        }
        return Tools.setProperty(item, this.playerId, property, value);
    }
    /**
     * @param item The id of the item to test (null defaults to held item)
     * @returns Whether the session has a tool binded to the player's hand.
     */
    hasTool(item) {
        if (!item) {
            item = Server.player.getHeldItem(this.player)?.typeId;
        }
        return Tools.hasBinding(item, this.playerId);
    }
    /**
     * @param item The id of the item to unbind from (null defaults to held item)
     * Unbinds a tool from this session's player's hand.
     */
    unbindTool(item) {
        if (!item) {
            item = Server.player.getHeldItem(this.player)?.typeId;
        }
        return Tools.unbind(item, this.playerId);
    }
    /**
     * @param type The name of the tool to filter by
     * @returns The ids of the items that are bound to a tool
     */
    getTools(type) {
        return Tools.getBoundItems(this.playerId, type);
    }
    /**
     * Triggers the hotbar setting menu to appear.
     */
    enterSettings() {
        Server.uiForms.show("$configMenu", this.player, {
            session: this
        });
        // this.settingsHotbar = new SettingsHotbar(this);
    }
    createRegion(isAccurate) {
        const buffer = new RegionBuffer(isAccurate && !config.performanceMode && !this.performanceMode);
        this.regions.set(buffer.id, buffer);
        return buffer;
    }
    deleteRegion(buffer) {
        buffer.deref();
        this.regions.delete(buffer.id);
    }
    createGradient(id, dither, patterns) {
        this.gradients.set(id, { dither, patterns });
    }
    getGradient(id) {
        return this.gradients.get(id);
    }
    delete() {
        for (const region of this.regions.values()) {
            region.deref();
        }
        this.regions.clear();
        Tools.deleteBindings(this.playerId);
        this.history.delete();
        this.history = null;
    }
    onTick() {
        // Draw Selection
        this.selection?.draw();
    }
}
export function getSession(player) {
    const id = player.id;
    if (!playerSessions.has(id)) {
        let session;
        if (pendingDeletion.has(id)) {
            session = pendingDeletion.get(id)[1];
            session.reassignPlayer(player);
            pendingDeletion.delete(id);
        }
        playerSessions.set(id, session ?? new PlayerSession(player));
        contentLog.debug(playerSessions.get(id)?.getPlayer()?.name + ` (${id})`);
        contentLog.debug(`new Session?: ${!session}`);
    }
    return playerSessions.get(id);
}
export function removeSession(playerId) {
    if (!playerSessions.has(playerId))
        return;
    playerSessions.get(playerId).selection.clear();
    playerSessions.get(playerId).globalPattern.clear();
    pendingDeletion.set(playerId, [config.ticksToDeleteSession, playerSessions.get(playerId)]);
    playerSessions.delete(playerId);
}
export function hasSession(playerId) {
    return playerSessions.has(playerId);
}
// Delayed a tick so that it's processed before other listeners
setTickTimeout(() => {
    Server.prependListener("tick", () => {
        for (const player of pendingDeletion.keys()) {
            const session = pendingDeletion.get(player);
            session[0]--;
            if (session[0] < 0) {
                session[1].delete();
                pendingDeletion.delete(player);
                contentLog.log(`session for player ${player} has been deleted.`);
            }
        }
        for (const session of playerSessions.values()) {
            session.onTick();
        }
    });
}, 1);
