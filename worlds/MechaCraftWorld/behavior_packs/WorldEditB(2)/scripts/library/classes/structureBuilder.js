/* eslint-disable no-empty */
import { regionSize, regionTransformedBounds, Vector } from "../utils/index.js";
import { world } from "@minecraft/server";
import { Server } from "./../Minecraft.js";
class StructureManager {
    constructor() {
        this.MAX_SIZE = new Vector(64, 256, 64);
        this.structures = new Map();
    }
    save(name, start, end, dim, options = {}) {
        const min = Vector.min(start, end);
        const max = Vector.max(start, end);
        const size = Vector.from(regionSize(start, end));
        const includeEntities = options.includeEntities ?? false;
        const includeBlocks = options.includeBlocks ?? true;
        const saveTo = (options.saveToDisk ?? false) ? "disk" : "memory";
        if (this.beyondMaxSize(size)) {
            let error = false;
            const subStructs = this.getSubStructs(start, end);
            for (const sub of subStructs) {
                const subStart = min.add(sub.start);
                const subEnd = min.add(sub.end);
                const subName = name + sub.name;
                error = Server.runCommand(`structure save ${subName} ${subStart.print()} ${subEnd.print()} ${includeEntities} ${saveTo} ${includeBlocks}`, dim).error || error;
                if (error)
                    break;
            }
            if (error) {
                for (const sub of subStructs) {
                    Server.queueCommand(`structure delete ${name + sub.name}`, dim);
                }
                return true;
            }
            else {
                this.structures.set(name, {
                    subRegions: subStructs,
                    size: size
                });
                return false;
            }
        }
        else {
            const startStr = min.print();
            const endStr = max.print();
            if (Server.runCommand(`structure save ${name} ${startStr} ${endStr} ${includeEntities} ${saveTo} ${includeBlocks}`, dim).error) {
                return true;
            }
            else {
                this.structures.set(name, { size });
                return false;
            }
        }
    }
    load(name, location, dim, options = {}) {
        const loadPos = Vector.from(location);
        let rot = (options.rotation ?? 0);
        rot = rot >= 0 ? rot % 360 : (rot % 360 + 360) % 360;
        const flip = options.flip ?? "none";
        const struct = this.structures.get(name);
        if (struct?.subRegions || this.beyondMaxSize(options.importedSize ?? Vector.ZERO)) {
            const size = options.importedSize ?? struct.size;
            const rotation = new Vector(0, options.rotation ?? 0, 0);
            const flip = options.flip ?? "none";
            const dir_sc = Vector.ONE;
            if (flip.includes("x"))
                dir_sc.z *= -1;
            if (flip.includes("z"))
                dir_sc.x *= -1;
            const bounds = regionTransformedBounds(Vector.ZERO, size.sub(1).floor(), Vector.ZERO, rotation, dir_sc);
            let error = false;
            const subStructs = options.importedSize ?
                this.getSubStructs(location, Vector.add(location, options.importedSize).floor()) :
                struct.subRegions;
            for (const sub of subStructs) {
                const subBounds = regionTransformedBounds(sub.start.floor(), sub.end.floor(), Vector.ZERO, rotation, dir_sc);
                const subLoad = Vector.sub(subBounds[0], bounds[0]).add(loadPos);
                error = Server.runCommand(`structure load ${name + sub.name} ${subLoad.print()} ${rot}_degrees ${flip}`, dim).error || error;
                if (error)
                    break;
            }
            return error;
        }
        else {
            return Server.runCommand(`structure load ${name} ${loadPos.print()} ${rot}_degrees ${flip}`, dim).error;
        }
    }
    has(name) {
        return this.structures.has(name);
    }
    delete(name) {
        const struct = this.structures.get(name);
        const dim = world.getDimension("overworld");
        if (struct) {
            if (struct.subRegions) {
                let error = false;
                for (const sub of struct.subRegions) {
                    error = Server.runCommand(`structure delete ${name}${sub.name}`, dim).error || error;
                    if (error)
                        return true;
                }
            }
            else {
                if (Server.runCommand(`structure delete ${name}`, dim).error) {
                    return true;
                }
            }
            this.structures.delete(name);
            return false;
        }
        return true;
    }
    getSize(name) {
        return this.structures.get(name).size.floor();
    }
    beyondMaxSize(size) {
        return size.x > this.MAX_SIZE.x || size.y > this.MAX_SIZE.y || size.z > this.MAX_SIZE.z;
    }
    getSubStructs(start, end) {
        const size = regionSize(start, end);
        const subStructs = [];
        for (let z = 0; z < size.z; z += this.MAX_SIZE.z)
            for (let y = 0; y < size.y; y += this.MAX_SIZE.y)
                for (let x = 0; x < size.x; x += this.MAX_SIZE.x) {
                    const subStart = new Vector(x, y, z);
                    const subEnd = Vector.min(subStart.add(this.MAX_SIZE).sub(1), size.add([-1, -1, -1]));
                    const subName = `_${x / this.MAX_SIZE.x}_${y / this.MAX_SIZE.y}_${z / this.MAX_SIZE.z}`;
                    subStructs.push({
                        name: subName,
                        start: subStart,
                        end: subEnd
                    });
                }
        return subStructs;
    }
}
export const Structure = new StructureManager();
