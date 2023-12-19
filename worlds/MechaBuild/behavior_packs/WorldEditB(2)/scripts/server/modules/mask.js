import { Vector } from "./../../library/Minecraft.js";
import { Token } from "./extern/tokenizr.js";
import { tokenize, throwTokenError, mergeTokens, parseBlock, processOps, parseBlockStates, blockPermutation2ParsedBlock } from "./block_parsing.js";
export class Mask {
    constructor(mask = "") {
        this.stringObj = "";
        if (mask) {
            const obj = Mask.parseArgs([mask]).result;
            this.condition = obj.condition;
            this.stringObj = obj.stringObj;
        }
    }
    /**
     * Tests if this mask matches a block
     * @param block
     * @returns True if the block matches; false otherwise
     */
    matchesBlock(block) {
        if (this.empty()) {
            return true;
        }
        return this.condition.matchesBlock(block);
    }
    clear() {
        this.condition = null;
        this.stringObj = "";
    }
    empty() {
        return this.condition == null;
    }
    addBlock(permutation) {
        if (this.condition == null) {
            this.condition = new ChainMask(null);
        }
        const block = blockPermutation2ParsedBlock(permutation);
        this.condition.nodes.push(new BlockMask(null, block));
        if (this.stringObj)
            this.stringObj += ",";
        this.stringObj += block.id.replace("minecraft:", "");
        if (block.states.size)
            this.stringObj += `[${[...block.states].map(([key, value]) => `${key}=${value}`).join(",")}]`;
    }
    intersect(mask) {
        let node;
        if (!mask.condition) {
            node = this.condition;
        }
        else if (!this.condition) {
            node = mask.condition;
        }
        else {
            node = new IntersectMask(null);
            node.nodes = [this.condition, mask.condition];
        }
        const intersect = new Mask();
        intersect.condition = node;
        return intersect;
    }
    getBlockSummary() {
        if (!this.condition || !(this.condition instanceof ChainMask)) {
            return "";
        }
        let text = "";
        let i = 0;
        for (const mask of this.condition.nodes) {
            let sub = mask.block.id.replace("minecraft:", "");
            for (const state of mask.block.states) {
                const val = state[1];
                if (typeof val == "string" && val != "x" && val != "y" && val != "z") {
                    sub += `(${val})`;
                    break;
                }
            }
            text += sub;
            if (i < this.condition.nodes.length - 1)
                text += ", ";
            i++;
        }
        return text;
    }
    getSource() {
        return this.stringObj;
    }
    static parseArgs(args, index = 0) {
        const input = args[index];
        if (!input) {
            return { result: new Mask(), argIndex: index + 1 };
        }
        const tokens = tokenize(input);
        let token;
        function processTokens(inBracket) {
            const ops = [];
            const out = [];
            const start = tokens.curr();
            function nodeToken() {
                return mergeTokens(token, tokens.curr(), input);
            }
            // eslint-disable-next-line no-cond-assign
            while (token = tokens.next()) {
                if (token.type == "id") {
                    out.push(new BlockMask(nodeToken(), parseBlock(tokens, input, false, true)));
                }
                else if (token.value == ",") {
                    processOps(out, ops, new ChainMask(token));
                }
                else if (token.type == "space") {
                    processOps(out, ops, new IntersectMask(token));
                }
                else if (token.value == "!") {
                    processOps(out, ops, new NegateMask(token));
                }
                else if (token.type == "bracket") {
                    if (token.value == "<") {
                        processOps(out, ops, new OffsetMask(token, 0, 1, 0));
                    }
                    else if (token.value == ">") {
                        processOps(out, ops, new OffsetMask(token, 0, -1, 0));
                    }
                    else if (token.value == "(") {
                        out.push(processTokens(true));
                    }
                    else if (token.value == ")") {
                        if (!inBracket) {
                            throwTokenError(token);
                        }
                        else {
                            processOps(out, ops);
                            break;
                        }
                    }
                    else {
                        throwTokenError(token);
                    }
                }
                else if (token.value == "#") {
                    const t = tokens.next();
                    if (t.value == "existing") {
                        out.push(new ExistingMask(nodeToken()));
                    }
                    else if (t.value == "surface" || t.value == "exposed") {
                        out.push(new SurfaceMask(nodeToken()));
                    }
                    else if (t.value == "#") {
                        const id = tokens.next();
                        if (id.type != "id") {
                            throwTokenError(id);
                        }
                        out.push(new TagMask(nodeToken(), id.value));
                    }
                    else {
                        throwTokenError(t);
                    }
                }
                else if (token.value == "%") {
                    const num = tokens.next();
                    if (num.type != "number") {
                        throwTokenError(num);
                    }
                    out.push(new PercentMask(nodeToken(), num.value / 100));
                }
                else if (token.value == "^") {
                    let states;
                    let strict = false;
                    let t = tokens.next();
                    if (t.value == "=") {
                        strict = true;
                        t = tokens.next();
                        if (t.value != "[") {
                            throwTokenError(t);
                        }
                        states = parseBlockStates(tokens);
                    }
                    else if (t.value == "[") {
                        states = parseBlockStates(tokens);
                    }
                    else {
                        throwTokenError(t);
                    }
                    out.push(new StateMask(nodeToken(), states, strict));
                }
                else if (token.type == "EOF") {
                    if (inBracket) {
                        throwTokenError(token);
                    }
                    else {
                        processOps(out, ops);
                    }
                }
                else {
                    throwTokenError(token);
                }
            }
            if (out.length > 1) {
                throwTokenError(out.slice(-1)[0].token);
            }
            else if (!out.length) {
                throwTokenError(start);
            }
            else if (ops.length) {
                const op = ops.slice(-1)[0];
                throwTokenError(op instanceof Token ? op : op.token);
            }
            return out[0];
        }
        let out;
        try {
            out = processTokens(false);
            out.postProcess();
        }
        catch (error) {
            if (error.pos != undefined) {
                const err = {
                    isSyntaxError: true,
                    idx: index,
                    start: error.pos,
                    end: error.pos + 1,
                    stack: error.stack
                };
                throw err;
            }
            throw error;
        }
        const mask = new Mask();
        mask.stringObj = args[index];
        mask.condition = out;
        return { result: mask, argIndex: index + 1 };
    }
    static clone(original) {
        const mask = new Mask();
        mask.condition = original.condition;
        mask.stringObj = original.stringObj;
        return mask;
    }
    toString() {
        return `[mask: ${this.stringObj}]`;
    }
}
class MaskNode {
    constructor(token) {
        this.token = token;
        this.nodes = [];
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    postProcess() { }
}
class BlockMask extends MaskNode {
    constructor(token, block) {
        super(token);
        this.block = block;
        this.prec = -1;
        this.opCount = 0;
        this.states = Object.fromEntries(block.states?.entries() ?? []);
    }
    matchesBlock(block) {
        return block.permutation.matches(this.block.id, this.states);
    }
}
class StateMask extends MaskNode {
    constructor(token, states, strict) {
        super(token);
        this.states = states;
        this.strict = strict;
        this.prec = -1;
        this.opCount = 0;
    }
    matchesBlock(block) {
        const props = block.permutation.getAllStates();
        let states_passed = 0;
        for (const [state, val] of this.states.entries()) {
            if (this.strict && state in props && val == props[state]) {
                states_passed++;
            }
            else if (!this.strict && (!(state in props) || val == props[state])) {
                states_passed++;
            }
        }
        return states_passed == this.states.size;
    }
}
class SurfaceMask extends MaskNode {
    constructor() {
        super(...arguments);
        this.prec = -1;
        this.opCount = 0;
    }
    matchesBlock(block) {
        const loc = Vector.from(block.location);
        const dim = block.dimension;
        const isEmpty = (loc) => {
            return dim.getBlock(loc).isAir;
        };
        return !isEmpty(loc) && (isEmpty(loc.offset(0, 1, 0)) || isEmpty(loc.offset(0, -1, 0)) ||
            isEmpty(loc.offset(-1, 0, 0)) || isEmpty(loc.offset(1, 0, 0)) ||
            isEmpty(loc.offset(0, 0, -1)) || isEmpty(loc.offset(0, 0, 1)));
    }
}
class ExistingMask extends MaskNode {
    constructor() {
        super(...arguments);
        this.prec = -1;
        this.opCount = 0;
    }
    matchesBlock(block) {
        return !block.isAir;
    }
}
class TagMask extends MaskNode {
    constructor(token, tag) {
        super(token);
        this.tag = tag;
        this.prec = -1;
        this.opCount = 0;
    }
    matchesBlock(block) {
        return block.hasTag(this.tag);
    }
}
class PercentMask extends MaskNode {
    constructor(token, percent) {
        super(token);
        this.percent = percent;
        this.prec = -1;
        this.opCount = 0;
    }
    matchesBlock() {
        return Math.random() < this.percent;
    }
}
class ChainMask extends MaskNode {
    constructor() {
        super(...arguments);
        this.prec = 3;
        this.opCount = 2;
    }
    matchesBlock(block) {
        for (const mask of this.nodes) {
            if (mask.matchesBlock(block))
                return true;
        }
        return false;
    }
    postProcess() {
        super.postProcess();
        const masks = this.nodes;
        this.nodes = [];
        while (masks.length) {
            const mask = masks.shift();
            if (mask instanceof ChainMask) {
                const sub = mask.nodes.reverse();
                for (const child of sub) {
                    masks.unshift(child);
                }
            }
            else {
                this.nodes.push(mask);
                mask.postProcess();
            }
        }
    }
}
class IntersectMask extends MaskNode {
    constructor() {
        super(...arguments);
        this.prec = 1;
        this.opCount = 2;
    }
    matchesBlock(block) {
        for (const mask of this.nodes) {
            if (!mask.matchesBlock(block))
                return false;
        }
        return true;
    }
    postProcess() {
        super.postProcess();
        const masks = this.nodes;
        this.nodes = [];
        while (masks.length) {
            const mask = masks.shift();
            if (mask instanceof IntersectMask) {
                const sub = mask.nodes.reverse();
                for (const child of sub) {
                    masks.unshift(child);
                }
            }
            else {
                this.nodes.push(mask);
                mask.postProcess();
            }
        }
    }
}
class NegateMask extends MaskNode {
    constructor() {
        super(...arguments);
        this.prec = 2;
        this.opCount = 1;
    }
    matchesBlock(block) {
        return !this.nodes[0].matchesBlock(block);
    }
}
// Overlay and Underlay
class OffsetMask extends MaskNode {
    constructor(token, x, y, z) {
        super(token);
        this.x = x;
        this.y = y;
        this.z = z;
        this.prec = 2;
        this.opCount = 1;
    }
    matchesBlock(block) {
        const loc = block.location;
        return this.nodes[0].matchesBlock(block.dimension.getBlock({
            x: loc.x + this.x,
            y: loc.y + this.y,
            z: loc.z + this.z
        }));
    }
    postProcess() {
        while (this.nodes[0] instanceof OffsetMask) {
            this.x += this.nodes[0].x;
            this.y += this.nodes[0].y;
            this.z += this.nodes[0].z;
            this.nodes = this.nodes[0].nodes;
        }
    }
}
