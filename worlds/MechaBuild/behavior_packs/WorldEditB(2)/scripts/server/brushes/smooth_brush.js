import { brushTypes, Brush } from "./base_brush.js";
import { CuboidShape } from "../shapes/cuboid.js";
import { Mask } from "./../modules/mask.js";
import { smooth } from "../commands/region/smooth_func.js";
/**
 * This smooths the terrain in the world.
 */
export class SmoothBrush extends Brush {
    /**
      * @param radius The radius of the smoothing area
      * @param iterations The number of times the area is smoothed
      * @param mask determine what blocks affect the height map
      */
    constructor(radius, iterations, mask) {
        super();
        this.id = "smooth_brush";
        this.assertSizeInRange(radius);
        this.shape = new CuboidShape(radius * 2 + 1, radius * 2 + 1, radius * 2 + 1);
        this.size = radius;
        this.iterations = iterations;
        this.mask = mask;
    }
    resize(value) {
        this.assertSizeInRange(value);
        this.shape = new CuboidShape(value * 2 + 1, value * 2 + 1, value * 2 + 1);
        this.size = value;
        this.shape.usedInBrush = true;
    }
    getSize() {
        return this.size;
    }
    getIterations() {
        return this.iterations;
    }
    getHeightMask() {
        return this.mask;
    }
    paintWith() {
        throw "commands.generic.wedit:noMaterial";
    }
    *apply(loc, session, mask) {
        const point = loc.offset(-this.size, -this.size, -this.size);
        yield* smooth(session, this.iterations, this.shape, point, this.mask, mask);
    }
    updateOutline(selection, loc) {
        const point = loc.offset(-this.size, -this.size, -this.size);
        selection.mode = "cuboid";
        selection.set(0, point);
        selection.set(1, point.offset(this.size * 2 + 1, this.size * 2 + 1, this.size * 2 + 1));
    }
    toJSON() {
        return {
            id: this.id,
            radius: this.size,
            iterations: this.iterations,
            mask: this.mask.getSource()
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static parseJSON(json) {
        return [json.radius, json.iterations, new Mask(json.mask)];
    }
}
brushTypes.set("smooth_brush", SmoothBrush);
