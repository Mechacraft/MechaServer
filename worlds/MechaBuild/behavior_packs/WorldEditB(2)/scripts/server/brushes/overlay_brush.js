import { Server, Vector, regionIterateBlocks } from "./../../library/Minecraft.js";
import { brushTypes, Brush } from "./base_brush.js";
import { Mask } from "./../modules/mask.js";
import { getWorldHeightLimits } from "server/util.js";
import { Pattern } from "./../modules/pattern.js";
/**
 * overlays terrain with blocks
 */
export class OverlayBrush extends Brush {
    /**
      * @param radius The radius of the brush (no limit to depth)
      * @param depth How far down the overlay will penetrate a surface
      * @param pattern The type of block(s) to overlay with
      * @param surfaceMask What is considered a surface
      */
    constructor(radius, depth, pattern, surfaceMask) {
        super();
        this.id = "overlay_brush";
        this.assertSizeInRange(radius);
        this.pattern = pattern;
        this.radius = radius;
        this.depth = depth;
        this.surfaceMask = surfaceMask ?? new Mask();
    }
    resize(value) {
        this.assertSizeInRange(value);
        this.radius = value;
    }
    getSize() {
        return this.radius;
    }
    getDepth() {
        return this.depth;
    }
    paintWith(value) {
        this.pattern = value;
    }
    getPattern() {
        return this.pattern;
    }
    *apply(hit, session, mask) {
        const range = [hit.offset(-this.radius, 1, -this.radius), hit.offset(this.radius, 1, this.radius)];
        const minY = getWorldHeightLimits(session.getPlayer().dimension)[0];
        const activeMask = !mask ? session.globalMask : session.globalMask ? mask.intersect(session.globalMask) : mask;
        const isAirOrFluid = Server.block.isAirOrFluid;
        const r2 = Math.pow(this.radius + 0.5, 2);
        const history = session.getHistory();
        const record = history.record();
        const blockChanges = history.collectBlockChanges(record);
        try {
            for (const loc of regionIterateBlocks(...range)) {
                if (hit.sub(loc).lengthSqr > r2 || !isAirOrFluid(blockChanges.getBlockPerm(loc))) {
                    continue;
                }
                const trace = Vector.sub(loc, [0, 1, 0]);
                while (trace.y >= minY) {
                    const block = blockChanges.getBlock(trace);
                    if (!isAirOrFluid(block.permutation) && this.surfaceMask.matchesBlock(block)) {
                        for (let i = 0; i < Math.abs(this.depth); i++) {
                            const block = blockChanges.getBlock(trace.offset(0, this.depth > 0 ? -i : (i + 1), 0));
                            if (!activeMask || activeMask.matchesBlock(block)) {
                                this.pattern.setBlock(block);
                            }
                        }
                        break;
                    }
                    trace.y--;
                }
                yield;
            }
            yield* blockChanges.flush();
            history.commit(record);
        }
        catch (e) {
            history.cancel(record);
            throw e;
        }
    }
    updateOutline(selection, loc) {
        selection.mode = "cylinder";
        selection.set(0, loc);
        selection.set(1, loc.offset(0, 0, this.radius));
    }
    toJSON() {
        return {
            id: this.id,
            radius: this.radius,
            depth: this.depth,
            pattern: this.pattern.getSource(),
            surfaceMask: this.surfaceMask.getSource()
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static parseJSON(json) {
        return [json.radius, json.depth, new Pattern(json.pattern), new Mask(json.mask)];
    }
}
brushTypes.set("overlay_brush", OverlayBrush);
