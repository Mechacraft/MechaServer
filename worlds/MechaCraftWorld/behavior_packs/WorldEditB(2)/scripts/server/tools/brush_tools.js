import { Tool } from "./base_tool.js";
import { Tools } from "./tool_manager.js";
import { brushTypes } from "../brushes/base_brush.js";
import { Mask } from "./../modules/mask.js";
import { PlayerUtil } from "./../modules/player_util.js";
import { Selection } from "./../modules/selection.js";
class BrushTool extends Tool {
    constructor(brush, mask, traceMask) {
        super();
        this.range = null;
        this.mask = null;
        this.traceMask = null;
        this.permission = "worldedit.brush";
        this.outlines = new Map();
        this.prevTick = 0;
        this.ticksToUpdate = 0;
        this.use = function* (self, player, session) {
            const hit = PlayerUtil.traceForBlock(player, self.range, self.traceMask);
            if (!hit) {
                throw "commands.wedit:jumpto.none";
            }
            yield* self.brush.apply(hit, session, self.mask);
        };
        this.tick = function* (self, player, session, tick) {
            this.ticksToUpdate -= tick - this.prevTick;
            this.prevTick = tick;
            if (this.ticksToUpdate > 0 || !session.drawOutlines)
                return;
            this.ticksToUpdate = 3;
            const hit = PlayerUtil.traceForBlock(player, self.range, self.traceMask);
            yield;
            if (hit) {
                if (!self.outlines.has(session)) {
                    const selection = new Selection(player);
                    self.outlines.set(session, { selection, lastHit: hit });
                }
                const { selection, lastHit } = self.outlines.get(session);
                self.brush.updateOutline(selection, hit);
                if (lastHit && !lastHit.equals(hit)) {
                    selection.forceDraw();
                }
                else {
                    selection.draw();
                }
                self.outlines.get(session).lastHit = hit;
                yield;
            }
        };
        this.brush = brush;
        this.mask = mask;
        this.traceMask = traceMask;
    }
    set size(value) {
        this.brush.resize(value);
    }
    set material(value) {
        this.brush.paintWith(value);
    }
    delete() {
        super.delete();
        this.brush.delete();
    }
    toJSON() {
        // persistent structure brush not supported
        if (this.brush.id === "structure_brush")
            return undefined;
        return {
            type: this.type,
            brush: this.brush,
            mask: this.mask?.getSource() ?? null,
            traceMask: this.traceMask?.getSource() ?? null
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static parseJSON(json) {
        const brushClass = brushTypes.get(json.brush.id);
        const brush = new brushClass(...brushClass.parseJSON(json.brush));
        return [brush, json.mask ? new Mask(json.mask) : null, json.traceMask ? new Mask(json.traceMask) : null];
    }
}
Tools.register(BrushTool, "brush");
