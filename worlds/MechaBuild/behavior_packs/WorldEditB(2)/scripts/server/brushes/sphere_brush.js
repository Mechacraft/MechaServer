import { brushTypes, Brush } from "./base_brush.js";
import { SphereShape } from "../shapes/sphere.js";
import { Pattern } from "./../modules/pattern.js";
/**
 * This brush creates sphere shaped patterns in the world.
 */
export class SphereBrush extends Brush {
    /**
      * @param radius The radius of the spheres
      * @param pattern The pattern the spheres will be made of
      * @param hollow Whether the spheres will be made hollow
      */
    constructor(radius, pattern, hollow) {
        super();
        this.id = "sphere_brush";
        this.assertSizeInRange(radius);
        this.shape = new SphereShape(radius);
        this.shape.usedInBrush = true;
        this.pattern = pattern;
        this.hollow = hollow;
        this.radius = radius;
    }
    resize(value) {
        this.assertSizeInRange(value);
        this.shape = new SphereShape(value);
        this.shape.usedInBrush = true;
        this.radius = value;
    }
    getSize() {
        return this.radius;
    }
    paintWith(value) {
        this.pattern = value;
    }
    getPattern() {
        return this.pattern;
    }
    isHollow() {
        return this.hollow;
    }
    *apply(loc, session, mask) {
        yield* this.shape.generate(loc, this.pattern, mask, session, { "hollow": this.hollow });
    }
    updateOutline(selection, loc) {
        selection.mode = "sphere";
        selection.set(0, loc);
        selection.set(1, loc.offset(0, 0, this.radius));
    }
    toJSON() {
        return {
            id: this.id,
            radius: this.radius,
            pattern: this.pattern.getSource(),
            hollow: this.hollow
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static parseJSON(json) {
        return [json.radius, new Pattern(json.pattern), json.hollow];
    }
}
brushTypes.set("sphere_brush", SphereBrush);
