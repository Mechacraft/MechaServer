import { Vector } from "./../../library/Minecraft.js";
import { brushTypes, Brush } from "./base_brush.js";
import { CylinderShape } from "../shapes/cylinder.js";
import { Pattern } from "./../modules/pattern.js";
/**
 * This brush creates cylinder shaped patterns in the world.
 */
export class CylinderBrush extends Brush {
    /**
      * @param radius The radius of the cylinders
      * @param height The height of the cylinders
      * @param pattern The pattern the cylinders will be made of
      * @param hollow Whether the cylinders will be made hollow
      */
    constructor(radius, height, pattern, hollow) {
        super();
        this.id = "cylinder_brush";
        this.assertSizeInRange(radius);
        this.shape = new CylinderShape(height, radius);
        this.shape.usedInBrush = true;
        this.height = height;
        this.pattern = pattern;
        this.hollow = hollow;
        this.radius = radius;
    }
    resize(value) {
        this.assertSizeInRange(value);
        this.shape = new CylinderShape(this.height, value);
        this.shape.usedInBrush = true;
        this.radius = value;
    }
    getSize() {
        return this.radius;
    }
    getHeight() {
        return this.height;
    }
    isHollow() {
        return this.hollow;
    }
    paintWith(value) {
        this.pattern = value;
    }
    getPattern() {
        return this.pattern;
    }
    *apply(loc, session, mask) {
        yield* this.shape.generate(loc, this.pattern, mask, session, { "hollow": this.hollow });
    }
    updateOutline(selection, loc) {
        const region = this.shape.getRegion(loc);
        selection.mode = "cylinder";
        selection.set(0, new Vector(loc.x, region[0].y, loc.z));
        selection.set(1, new Vector(loc.x + this.radius, region[1].y, loc.z));
    }
    toJSON() {
        return {
            id: this.id,
            radius: this.radius,
            height: this.height,
            pattern: this.pattern.getSource(),
            hollow: this.hollow
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static parseJSON(json) {
        return [json.radius, json.height, new Pattern(json.pattern), json.hollow];
    }
}
brushTypes.set("cylinder_brush", CylinderBrush);
