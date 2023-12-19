import { Vector, regionTransformedBounds } from "./../../library/Minecraft.js";
import { brushTypes, Brush } from "./base_brush.js";
import { world } from "@minecraft/server";
import { importStructure } from "server/commands/structure/import.js";
/**
 * Pastes structures on use
 */
export class StructureBrush extends Brush {
    /**
      * @param struct The structure being used
      * @param mask Determines what blocks in the world can get replaced by the structure
      */
    constructor(struct, mask) {
        super();
        this.id = "structure_brush";
        this.randomTransform = true;
        this.lastTransform = [0, new Vector(1, 1, 1)];
        if (Array.isArray(struct) && typeof struct[0] == "string") {
            this.imports = struct;
            struct = this.imports.map(name => {
                return importStructure(name, world.getPlayers()[0]).buffer;
            });
        }
        struct = struct;
        this.structs = Array.isArray(struct) ? struct : [struct];
        this.mask = mask;
        this.updateStructIdx();
        for (const struct of this.structs) {
            struct.ref();
        }
    }
    resize() {
        throw "commands.generic.wedit:noSize";
    }
    getSize() {
        return -1;
    }
    getMask() {
        return this.mask;
    }
    paintWith() {
        throw "commands.generic.wedit:noMaterial";
    }
    *apply(loc, session) {
        const history = session.getHistory();
        const record = history.record();
        try {
            const struct = this.structs[this.structIdx];
            const regionSize = struct.getSize();
            let start = loc.offset(-regionSize.x / 2, 1, -regionSize.z / 2).ceil();
            let end = start.add(regionSize).sub(1);
            const options = { mask: this.mask };
            if (this.randomTransform) {
                const newTransform = this.lastTransform.slice();
                while (newTransform[0] == this.lastTransform[0] && newTransform[1].equals(this.lastTransform[1])) {
                    newTransform[0] = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
                    newTransform[1] = new Vector(Math.random() > 0.5 ? 1 : -1, 1, Math.random() > 0.5 ? 1 : -1);
                }
                options.rotation = new Vector(0, newTransform[0], 0);
                options.flip = newTransform[1];
                this.lastTransform = newTransform;
                [start, end] = regionTransformedBounds(start, end, start.lerp(end, 0.5), options.rotation, options.flip);
            }
            history.addUndoStructure(record, start, end);
            yield* struct.loadProgressive(start, session.getPlayer().dimension, options);
            history.addRedoStructure(record, start, end);
            history.commit(record);
        }
        catch {
            history.cancel(record);
        }
        this.updateStructIdx();
    }
    updateOutline(selection, loc) {
        const point = loc.offset(-this.size.x / 2, 1, -this.size.z / 2).ceil();
        selection.mode = "cuboid";
        selection.set(0, point);
        selection.set(1, point.add(this.size.sub(1)));
    }
    delete() {
        for (const struct of this.structs) {
            struct.deref();
        }
    }
    updateStructIdx() {
        this.structIdx = Math.floor(Math.random() * this.structs.length);
        this.size = this.structs[this.structIdx].getSize();
        if (this.randomTransform) {
            this.size = new Vector(Math.max(this.size.x, this.size.z), this.size.y, Math.max(this.size.x, this.size.z));
        }
    }
}
brushTypes.set("structure_brush", StructureBrush);
