import { Tool } from "./base_tool.js";
import { Tools } from "./tool_manager.js";
import { Server } from "./../../library/Minecraft.js";
class SelectionTool extends Tool {
    constructor() {
        super(...arguments);
        this.permission = "worldedit.selection.pos";
        this.useOn = function (self, player, session, loc) {
            Server.command.callCommand(player, "pos2", [`${loc.x}`, `${loc.y}`, `${loc.z}`]);
        };
        this.break = function (self, player, session, loc) {
            Server.command.callCommand(player, "pos1", [`${loc.x}`, `${loc.y}`, `${loc.z}`]);
        };
    }
}
Tools.register(SelectionTool, "selection_wand");
class FarSelectionTool extends Tool {
    constructor() {
        super(...arguments);
        this.permission = "worldedit.selection.hpos";
        this.use = function (self, player) {
            Server.command.callCommand(player, player.isSneaking ? "hpos1" : "hpos2");
        };
        this.break = function (self, player) {
            Server.command.callCommand(player, "hpos1");
        };
    }
}
Tools.register(FarSelectionTool, "far_selection_wand");
