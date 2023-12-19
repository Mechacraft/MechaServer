import { Vector } from "./../../../library/Minecraft.js";
import { locToString, stringToLoc } from "../../util.js";
const offsets = [
    new Vector(-1, 0, 0),
    new Vector(1, 0, 0),
    new Vector(0, -1, 0),
    new Vector(0, 1, 0),
    new Vector(0, 0, -1),
    new Vector(0, 0, 1)
];
export function* floodFill(start, size, spread) {
    const initialCtx = {
        pos: Vector.ZERO,
        worldPos: Vector.from(start)
    };
    if (!spread({ ...initialCtx }, Vector.ZERO)) {
        return [];
    }
    const queue = [[Vector.from(start), initialCtx]];
    const result = new Map();
    function isInside(loc) {
        if (result.has(locToString(loc)) || Vector.sub(loc, start).length > size + 0.5) {
            return false;
        }
        return true;
    }
    function addNeighbor(block, offset, ctx) {
        const neighbor = block.offset(offset.x, offset.y, offset.z);
        ctx.pos = neighbor.offset(-start.x, -start.y, -start.z);
        ctx.worldPos = neighbor;
        queue.push([neighbor, ctx]);
    }
    while (queue.length) {
        const [block, ctx] = queue.shift();
        if (isInside(block)) {
            result.set(locToString(block), true);
            for (const offset of offsets) {
                const newCtx = { ...ctx };
                if (spread(newCtx, offset)) {
                    addNeighbor(block, offset, newCtx);
                }
            }
        }
        yield;
    }
    return Array.from(result.keys()).map(str => stringToLoc(str));
}
