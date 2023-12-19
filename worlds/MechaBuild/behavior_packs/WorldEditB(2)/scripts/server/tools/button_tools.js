import { regionSize, regionTransformedBounds, Server, Vector } from "./../../library/Minecraft.js";
import { Tool } from "./base_tool.js";
import { Tools } from "./tool_manager.js";
import { PlayerUtil } from "./../modules/player_util.js";
import { Selection } from "./../modules/selection.js";
class CommandButton extends Tool {
    constructor() {
        super(...arguments);
        this.use = function (self, player, session) {
            if (typeof self.command == "string") {
                Server.command.callCommand(player, self.command);
            }
            else {
                Server.command.callCommand(player, self.command[0], self.command.slice(1));
            }
        };
    }
}
class CutTool extends CommandButton {
    constructor() {
        super(...arguments);
        this.command = "cut";
        this.permission = "worldedit.clipboard.cut";
    }
}
Tools.register(CutTool, "cut", "wedit:cut_button");
class CopyTool extends CommandButton {
    constructor() {
        super(...arguments);
        this.command = "copy";
        this.permission = "worldedit.clipboard.copy";
    }
}
Tools.register(CopyTool, "copy", "wedit:copy_button");
class PasteTool extends CommandButton {
    constructor() {
        super(...arguments);
        this.command = ["paste", "-s"];
        this.permission = "worldedit.clipboard.paste";
        this.outlines = new Map();
        this.use = function (self, player, session) {
            Server.command.callCommand(player, self.command[0], self.command.slice(1));
        };
        this.tick = function* (self, player, session, tick) {
            if (!session.clipboard || !session.drawOutlines) {
                return;
            }
            if (!self.outlines.has(session)) {
                const selection = new Selection(player);
                selection.mode = "cuboid";
                self.outlines.set(session, selection);
            }
            const rotation = session.clipboardTransform.rotation;
            const flip = session.clipboardTransform.flip;
            const bounds = regionTransformedBounds(Vector.ZERO.floor(), session.clipboard.getSize().offset(-1, -1, -1), Vector.ZERO, rotation, flip);
            const size = Vector.from(regionSize(bounds[0], bounds[1]));
            const loc = PlayerUtil.getBlockLocation(player);
            const pasteStart = Vector.add(loc, session.clipboardTransform.relative).sub(size.mul(0.5).sub(1));
            const pasteEnd = pasteStart.add(Vector.sub(size, Vector.ONE)).floor();
            const selection = self.outlines.get(session);
            selection.set(0, pasteStart.floor());
            selection.set(1, pasteEnd);
            selection.draw();
            yield;
        };
    }
}
Tools.register(PasteTool, "paste", "wedit:paste_button");
class UndoTool extends CommandButton {
    constructor() {
        super(...arguments);
        this.command = "undo";
        this.permission = "worldedit.history.undo";
    }
}
Tools.register(UndoTool, "undo", "wedit:undo_button");
class RedoTool extends CommandButton {
    constructor() {
        super(...arguments);
        this.command = "redo";
        this.permission = "worldedit.history.redo";
    }
}
Tools.register(RedoTool, "redo", "wedit:redo_button");
class RotateCWTool extends Tool {
    constructor() {
        super(...arguments);
        this.permission = "worldedit.region.rotate";
        this.use = function (self, player, session) {
            const args = ["90", "-sw"];
            if (player.isSneaking) {
                args.push("-o");
            }
            Server.command.callCommand(player, "rotate", args);
        };
    }
}
Tools.register(RotateCWTool, "rotate_cw", "wedit:rotate_cw_button");
class RotateCCWTool extends Tool {
    constructor() {
        super(...arguments);
        this.permission = "worldedit.region.rotate";
        this.use = function (self, player, session) {
            const args = ["-90", "-sw"];
            if (player.isSneaking) {
                args.push("-o");
            }
            Server.command.callCommand(player, "rotate", args);
        };
    }
}
Tools.register(RotateCCWTool, "rotate_ccw", "wedit:rotate_ccw_button");
class FlipTool extends Tool {
    constructor() {
        super(...arguments);
        this.permission = "worldedit.region.flip";
        this.use = function (self, player, session) {
            const args = ["-sw"];
            if (player.isSneaking) {
                args.push("-o");
            }
            Server.command.callCommand(player, "flip", args);
        };
    }
}
Tools.register(FlipTool, "flip", "wedit:flip_button");
class SpawnGlassTool extends Tool {
    constructor() {
        super(...arguments);
        this.use = function (self, player) {
            Server.queueCommand("setblock ~~~ glass", player);
        };
    }
}
Tools.register(SpawnGlassTool, "spawn_glass", "wedit:spawn_glass");
class SelectionFillTool extends Tool {
    constructor() {
        super(...arguments);
        this.permission = "worldedit.region.replace";
        this.use = function (self, player, session) {
            if (session.globalMask.empty()) {
                Server.command.callCommand(player, "set", ["air"]);
            }
            else {
                Server.command.callCommand(player, "replace", ["air", "air"]);
            }
        };
    }
}
Tools.register(SelectionFillTool, "selection_fill", "wedit:selection_fill");
class SelectionWallTool extends CommandButton {
    constructor() {
        super(...arguments);
        this.permission = "worldedit.region.walls";
        this.command = ["walls", "air"];
    }
}
Tools.register(SelectionWallTool, "selection_wall", "wedit:selection_wall");
class SelectionOutlineTool extends CommandButton {
    constructor() {
        super(...arguments);
        this.permission = "worldedit.region.faces";
        this.command = ["faces", "air"];
    }
}
Tools.register(SelectionOutlineTool, "selection_outline", "wedit:selection_outline");
class DrawLineTool extends CommandButton {
    constructor() {
        super(...arguments);
        this.permission = "worldedit.region.line";
        this.command = ["line", "air"];
    }
}
Tools.register(DrawLineTool, "draw_line", "wedit:draw_line");
class ConfigTool extends Tool {
    constructor() {
        super(...arguments);
        this.use = function (self, player, session) {
            session.enterSettings();
        };
    }
}
Tools.register(ConfigTool, "config", "wedit:config_button");
