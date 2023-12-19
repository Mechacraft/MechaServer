import { Server, Vector, regionIterateBlocks } from "./../../library/Minecraft.js";
import { brushTypes, Brush } from "./base_brush.js";
import { BlockPermutation } from "@minecraft/server";
import { directionVectors } from "./../modules/directions.js";
import { getWorldHeightLimits } from "server/util.js";
class ErosionPreset {
    constructor(erodeThres, erodeIter, fillThres, fillIter) {
        this.erodeThreshold = erodeThres;
        this.erodeIterations = erodeIter;
        this.fillThreshold = fillThres;
        this.fillIterations = fillIter;
    }
}
export var ErosionType;
(function (ErosionType) {
    ErosionType[ErosionType["DEFAULT"] = 0] = "DEFAULT";
    ErosionType[ErosionType["LIFT"] = 1] = "LIFT";
    ErosionType[ErosionType["FILL"] = 2] = "FILL";
    ErosionType[ErosionType["MELT"] = 3] = "MELT";
    ErosionType[ErosionType["SMOOTH"] = 4] = "SMOOTH";
})(ErosionType || (ErosionType = {}));
const fluids = {
    "minecraft:air": BlockPermutation.resolve("air"),
    "minecraft:water": BlockPermutation.resolve("water"),
    "minecraft:lava": BlockPermutation.resolve("lava")
};
/**
 * Shapes terrain in various ways
 */
export class ErosionBrush extends Brush {
    /**
      * @param radius The radius of the spheres
      * @param type The type of erosion brush
      */
    constructor(radius, type) {
        super();
        this.id = "erosion_brush";
        this.assertSizeInRange(radius);
        this.radius = radius;
        this.preset = erosionTypes.get(type);
        this.type = type;
    }
    resize(value) {
        this.assertSizeInRange(value);
        this.radius = value;
    }
    getSize() {
        return this.radius;
    }
    getType() {
        return this.type;
    }
    paintWith() {
        throw "commands.generic.wedit:noMaterial";
    }
    *apply(loc, session, mask) {
        const range = [loc.sub(this.radius), loc.add(this.radius)];
        const [minY, maxY] = getWorldHeightLimits(session.getPlayer().dimension);
        const activeMask = !mask ? session.globalMask : session.globalMask ? mask.intersect(session.globalMask) : mask;
        range[0].y = Math.max(minY, range[0].y);
        range[1].y = Math.min(maxY, range[1].y);
        const history = session.getHistory();
        const record = history.record();
        const blockChanges = history.collectBlockChanges(record);
        try {
            for (let i = 0; i < this.preset.erodeIterations; i++) {
                yield* this.processErosion(range, this.preset.erodeThreshold, blockChanges, activeMask);
            }
            for (let i = 0; i < this.preset.fillIterations; i++) {
                yield* this.processFill(range, this.preset.fillThreshold, blockChanges, activeMask);
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
        selection.mode = "sphere";
        selection.set(0, loc);
        selection.set(1, loc.offset(0, 0, this.radius));
    }
    *processErosion(range, threshold, blockChanges, mask) {
        const centre = Vector.add(...range).mul(0.5);
        const r2 = (this.radius + 0.5) * (this.radius + 0.5);
        const isAirOrFluid = Server.block.isAirOrFluid;
        for (const loc of regionIterateBlocks(...range)) {
            if (centre.sub(loc).lengthSqr > r2 || isAirOrFluid(blockChanges.getBlockPerm(loc)) || (mask && !mask.matchesBlock(blockChanges.dimension.getBlock(loc)))) {
                continue;
            }
            let count = 0;
            const fluidTypes = [];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [_, dir] of directionVectors) {
                const block = blockChanges.getBlockPerm(Vector.add(loc, dir));
                if (isAirOrFluid(block)) {
                    count++;
                    let foundType = false;
                    for (let i = 0; i < fluidTypes.length; i++) {
                        if (fluidTypes[i][0] == block.type.id) {
                            fluidTypes[i][1]++;
                            foundType = true;
                            break;
                        }
                    }
                    if (!foundType) {
                        fluidTypes.push([block.type.id, 1]);
                    }
                }
            }
            if (count >= threshold) {
                let maxCount = 0;
                let maxBlock;
                for (const [block, times] of fluidTypes) {
                    if (times > maxCount) {
                        maxCount = times;
                        maxBlock = block;
                    }
                }
                blockChanges.setBlock(loc, fluids[maxBlock]);
            }
            yield 0;
        }
        blockChanges.applyIteration();
    }
    *processFill(range, threshold, blockChanges, mask) {
        const centre = Vector.add(...range).mul(0.5);
        const r2 = (this.radius + 0.5) * (this.radius + 0.5);
        const isAirOrFluid = Server.block.isAirOrFluid;
        for (const loc of regionIterateBlocks(...range)) {
            if (centre.sub(loc).lengthSqr > r2 || !isAirOrFluid(blockChanges.getBlockPerm(loc))) {
                continue;
            }
            let count = 0;
            const blockTypes = [];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [_, dir] of directionVectors) {
                const block = blockChanges.getBlockPerm(Vector.add(loc, dir));
                if (!isAirOrFluid(block) && (!mask || mask.matchesBlock(blockChanges.dimension.getBlock(Vector.add(loc, dir))))) {
                    count++;
                    let foundType = false;
                    for (let i = 0; i < blockTypes.length; i++) {
                        if (blockTypes[i][0].matches(block.type.id, block.getAllStates())) {
                            blockTypes[i][1]++;
                            foundType = true;
                            break;
                        }
                    }
                    if (!foundType) {
                        blockTypes.push([block, 1]);
                    }
                }
            }
            if (count >= threshold) {
                let maxCount = 0;
                let maxBlock;
                for (const [block, times] of blockTypes) {
                    if (times > maxCount) {
                        maxCount = times;
                        maxBlock = block;
                    }
                }
                blockChanges.setBlock(loc, maxBlock);
            }
            yield 0;
        }
        blockChanges.applyIteration();
    }
    toJSON() {
        return {
            id: this.id,
            radius: this.radius,
            type: this.type
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static parseJSON(json) {
        return [json.radius, json.type];
    }
}
brushTypes.set("erosion_brush", ErosionBrush);
const erosionTypes = new Map([
    [ErosionType.DEFAULT, new ErosionPreset(1, 1, 6, 0)],
    [ErosionType.LIFT, new ErosionPreset(6, 0, 1, 1)],
    [ErosionType.FILL, new ErosionPreset(5, 1, 2, 1)],
    [ErosionType.MELT, new ErosionPreset(2, 1, 5, 1)],
    [ErosionType.SMOOTH, new ErosionPreset(3, 1, 3, 1)]
]);
