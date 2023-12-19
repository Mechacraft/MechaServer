import { assertCanBuildWithin } from "./../modules/assert.js";
import { Mask } from "./../modules/mask.js";
import { contentLog, iterateChunk, regionIterateBlocks, regionVolume, Vector } from "./../../library/Minecraft.js";
import { getWorldHeightLimits } from "../util.js";
/**
 * A base shape class for generating blocks in a variety of formations.
 */
export class Shape {
    constructor() {
        /**
          * Whether the shape is being used in a brush.
          * Shapes used in a brush may handle history recording differently from other cases.
          */
        this.usedInBrush = false;
    }
    /**
     * Returns blocks that are in the shape.
     */
    *getBlocks(loc, options) {
        const range = this.getRegion(loc);
        this.genVars = {};
        this.prepGeneration(this.genVars, options);
        for (const block of regionIterateBlocks(...range)) {
            if (this.inShape(Vector.sub(block, loc).floor(), this.genVars)) {
                yield block;
            }
        }
    }
    inShapeHollow(relLoc, genVars) {
        const block = this.inShape(relLoc, genVars);
        if (genVars.hollow && block) {
            let neighbourCount = 0;
            for (const offset of [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]]) {
                neighbourCount += this.inShape(relLoc.add(offset), genVars) ? 1 : 0;
            }
            return neighbourCount == 6 ? false : block;
        }
        else {
            return block;
        }
    }
    /**
    * Generates a block formation at a certain location.
    * @param loc The location the shape will be generated at
    * @param pattern The pattern that the shape will be made with
    * @param mask The mask to decide where the shape will generate blocks
    * @param session The session that's using this shape
    * @param options A group of options that can change how the shape is generated
    */
    *generate(loc, pattern, mask, session, options) {
        const [min, max] = this.getRegion(loc);
        const player = session.getPlayer();
        const dimension = player.dimension;
        const [minY, maxY] = getWorldHeightLimits(dimension);
        min.y = Math.max(minY, min.y);
        max.y = Math.min(maxY, max.y);
        const canGenerate = max.y >= min.y;
        pattern.setContext(session, [min, max]);
        assertCanBuildWithin(player, min, max);
        const blocksAffected = [];
        mask = mask ?? new Mask();
        const history = (options?.recordHistory ?? true) ? session.getHistory() : null;
        const record = history?.record(this.usedInBrush);
        try {
            let count = 0;
            if (canGenerate) {
                this.genVars = {};
                this.prepGeneration(this.genVars, options);
                // TODO: Localize
                let activeMask = mask;
                const globalMask = (options?.ignoreGlobalMask ?? false) ? new Mask() : session.globalMask;
                activeMask = !activeMask ? globalMask : (globalMask ? mask.intersect(globalMask) : activeMask);
                const patternInFill = pattern.getBlockFill();
                // eslint-disable-next-line no-constant-condition
                if (this.genVars.isSolidCuboid && patternInFill && (!activeMask || activeMask.empty())) {
                    contentLog.debug("Using fillBlocks() method.");
                    const size = Vector.sub(max, min).add(1);
                    const fillMax = 32;
                    history?.addUndoStructure(record, min, max, "any");
                    yield "Calculating shape...";
                    yield "Generating blocks...";
                    for (let z = 0; z < size.z; z += fillMax) {
                        for (let y = 0; y < size.y; y += fillMax) {
                            for (let x = 0; x < size.x; x += fillMax) {
                                const subStart = Vector.add(min, [x, y, z]);
                                const subEnd = Vector.min(new Vector(x, y, z).add(fillMax), size).add(min).sub(Vector.ONE);
                                dimension.fillBlocks(subStart.floor(), subEnd.floor(), patternInFill);
                                const subSize = subEnd.sub(subStart).add(1);
                                count += subSize.x * subSize.y * subSize.z;
                                yield count / (size.x * size.y * size.z);
                            }
                        }
                    }
                    history?.addRedoStructure(record, min, max, "any");
                }
                else {
                    let progress = 0;
                    const volume = regionVolume(min, max);
                    const inShapeFunc = this.customHollow ? "inShape" : "inShapeHollow";
                    yield "Calculating shape...";
                    for (const blockLoc of regionIterateBlocks(min, max)) {
                        if (iterateChunk())
                            yield progress / volume;
                        progress++;
                        if (this[inShapeFunc](Vector.sub(blockLoc, loc).floor(), this.genVars)) {
                            const block = dimension.getBlock(blockLoc);
                            if (!activeMask.empty() && !activeMask.matchesBlock(block))
                                continue;
                            blocksAffected.push(block);
                        }
                    }
                    progress = 0;
                    yield "Generating blocks...";
                    history?.addUndoStructure(record, min, max, blocksAffected);
                    for (const block of blocksAffected) {
                        if (pattern.setBlock(block))
                            count++;
                        if (iterateChunk())
                            yield progress / blocksAffected.length;
                        progress++;
                    }
                    history?.addRedoStructure(record, min, max, blocksAffected);
                }
            }
            history?.commit(record);
            return count;
        }
        catch (e) {
            history?.cancel(record);
            throw e;
        }
    }
}
