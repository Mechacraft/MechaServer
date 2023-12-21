import { BlockPermutation } from "@minecraft/server";
import { Vector, Server } from "./../../library/Minecraft.js";
import { wrap } from "server/util.js";
import { Token } from "./extern/tokenizr.js";
import { tokenize, throwTokenError, mergeTokens, parseBlock, parseBlockStates, processOps, parseNumberList, blockPermutation2ParsedBlock, parsedBlock2BlockPermutation } from "./block_parsing.js";
import { Cardinal } from "./directions.js";
export class Pattern {
    constructor(pattern = "") {
        this.stringObj = "";
        this.context = {};
        if (pattern) {
            const obj = Pattern.parseArgs([pattern]).result;
            this.block = obj.block;
            this.stringObj = obj.stringObj;
        }
    }
    setContext(session, range) {
        this.context.session = session;
        this.context.range = [Vector.from(range[0]), Vector.from(range[1])];
        try {
            const item = Server.player.getHeldItem(session.getPlayer());
            this.context.hand = Server.block.itemToPermutation(item);
        }
        catch {
            this.context.hand = BlockPermutation.resolve("minecraft:air");
        }
    }
    /**
     * Replaces a block with this pattern
     * @param block
     * @returns True if the block changed; false otherwise
     */
    setBlock(block) {
        try {
            const oldBlock = block.permutation;
            block.setPermutation(this.block.getPermutation(block, this.context));
            return !oldBlock.matches(block.typeId);
        }
        catch (err) {
            //contentLog.error(err);
            return false;
        }
    }
    getRootNode() {
        return this.block;
    }
    clear() {
        this.block = null;
        this.stringObj = "";
    }
    empty() {
        return this.block == null;
    }
    addBlock(permutation) {
        if (this.block == null) {
            this.block = new ChainPattern(null);
        }
        const block = blockPermutation2ParsedBlock(permutation);
        this.block.nodes.push(new BlockPattern(null, block));
        if (this.stringObj)
            this.stringObj += ",";
        this.stringObj += block.id.replace("minecraft:", "");
        if (block.states.size)
            this.stringObj += `[${[...block.states].map(([key, value]) => `${key}=${value}`).join(",")}]`;
    }
    getBlockSummary() {
        let text = "";
        const blockMap = new Map();
        for (const pattern of this.block.nodes) {
            let sub = pattern.block.id.replace("minecraft:", "");
            for (const state of pattern.block.states) {
                const val = state[1];
                if (typeof val == "string" && val != "x" && val != "y" && val != "z") {
                    sub += `(${val})`;
                    break;
                }
            }
            if (blockMap.has(sub)) {
                blockMap.set(sub, blockMap.get(sub) + 1);
            }
            else {
                blockMap.set(sub, 1);
            }
        }
        let i = 0;
        for (const block of blockMap) {
            if (block[1] > 1) {
                text += `${block[1]}x ${block[0]}`;
            }
            else {
                text += block[0];
            }
            if (i < blockMap.size - 1)
                text += ", ";
            i++;
        }
        return text;
    }
    getSource() {
        return this.stringObj;
    }
    getBlockFill() {
        if (this.block instanceof BlockPattern) {
            return parsedBlock2BlockPermutation(this.block.block);
        }
        else if (this.block instanceof ChainPattern && this.block.nodes.length == 1 && this.block.nodes[0] instanceof BlockPattern) {
            return parsedBlock2BlockPermutation(this.block.nodes[0].block);
        }
    }
    static parseArgs(args, index = 0) {
        const input = args[index];
        if (!input) {
            return { result: new Pattern(), argIndex: index + 1 };
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
                    out.push(new BlockPattern(nodeToken(), parseBlock(tokens, input, false)));
                }
                else if (token.type == "number") {
                    const num = token;
                    const t = tokens.next();
                    if (t.value == "%") {
                        processOps(out, ops, new PercentPattern(nodeToken(), num.value));
                    }
                    else {
                        throwTokenError(t);
                    }
                }
                else if (token.value == ",") {
                    processOps(out, ops, new ChainPattern(token));
                }
                else if (token.value == "^") {
                    const t = tokens.next();
                    if (t.type == "id") {
                        out.push(new TypePattern(nodeToken(), parseBlock(tokens, input, true)));
                    }
                    else if (t.value == "[") {
                        out.push(new StatePattern(nodeToken(), parseBlockStates(tokens)));
                    }
                    else {
                        throwTokenError(t);
                    }
                }
                else if (token.value == "*") {
                    const t = tokens.next();
                    if (t.type != "id") {
                        throwTokenError(t);
                    }
                    out.push(new RandStatePattern(nodeToken(), parseBlock(tokens, input, true)));
                }
                else if (token.value == "$") {
                    const t = tokens.next();
                    let cardinal = new Cardinal(Cardinal.Dir.UP);
                    if (t.type != "id") {
                        throwTokenError(t);
                    }
                    if (tokens.peek().value == ".") {
                        tokens.next();
                        const d = tokens.next();
                        cardinal = Cardinal.parseArgs([d.value]).result;
                    }
                    out.push(new GradientPattern(nodeToken(), t.value, cardinal));
                }
                else if (token.value == "#") {
                    const t = tokens.next();
                    if (t.value == "clipboard") {
                        let offset = Vector.ZERO;
                        if (tokens.peek()?.value == "@") {
                            tokens.next();
                            if (tokens.next().value != "[") {
                                throwTokenError(tokens.curr());
                            }
                            const array = parseNumberList(tokens, 3);
                            offset = Vector.from(array);
                        }
                        out.push(new ClipboardPattern(nodeToken(), offset.floor()));
                    }
                    else if (t.value == "hand") {
                        out.push(new HandPattern(nodeToken()));
                    }
                    else {
                        throwTokenError(t);
                    }
                }
                else if (token.type == "bracket") {
                    if (token.value == "(") {
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
        const pattern = new Pattern();
        pattern.stringObj = args[index];
        pattern.block = out;
        return { result: pattern, argIndex: index + 1 };
    }
    static clone(original) {
        const pattern = new Pattern();
        pattern.block = original.block;
        pattern.stringObj = original.stringObj;
        return pattern;
    }
    toString() {
        return `[pattern: ${this.stringObj}]`;
    }
}
class PatternNode {
    constructor(token) {
        this.token = token;
        this.nodes = [];
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    postProcess() { }
}
class BlockPattern extends PatternNode {
    constructor(token, block) {
        super(token);
        this.block = block;
        this.prec = -1;
        this.opCount = 0;
        this.permutation = parsedBlock2BlockPermutation(block);
    }
    getPermutation() {
        return this.permutation;
    }
}
class TypePattern extends PatternNode {
    constructor(token, type) {
        super(token);
        this.type = type;
        this.prec = -1;
        this.opCount = 0;
        this.permutation = BlockPermutation.resolve(type);
        this.props = this.permutation.getAllStates();
    }
    getPermutation(block) {
        let permutation = this.permutation;
        Object.entries(block.permutation.getAllStates()).forEach(([state, val]) => {
            if (state in this.props)
                permutation = permutation.withState(state, val);
        });
        return permutation;
    }
}
class StatePattern extends PatternNode {
    constructor(token, states) {
        super(token);
        this.states = states;
        this.prec = -1;
        this.opCount = 0;
    }
    getPermutation(block) {
        let permutation = block.permutation;
        const props = permutation.getAllStates();
        this.states.forEach((val, state) => {
            if (state in props)
                permutation = permutation.withState(state, val);
        });
        return permutation;
    }
}
class RandStatePattern extends PatternNode {
    constructor(token, block) {
        super(token);
        this.block = block;
        this.prec = -1;
        this.opCount = 0;
        this.permutations = Array.from(Server.block.iteratePermutations(this.block));
    }
    getPermutation() {
        return this.permutations[Math.floor(Math.random() * this.permutations.length)];
    }
}
class ClipboardPattern extends PatternNode {
    constructor(token, offset) {
        super(token);
        this.offset = offset;
        this.prec = -1;
        this.opCount = 0;
    }
    getPermutation(block, context) {
        const clipboard = context.session?.clipboard;
        if (clipboard?.isAccurate) {
            const size = clipboard.getSize();
            const offset = Vector.sub(block.location, this.offset);
            const sampledLoc = new Vector(wrap(size.x, offset.x), wrap(size.y, offset.y), wrap(size.z, offset.z));
            return clipboard.getBlock(sampledLoc);
        }
    }
}
class HandPattern extends PatternNode {
    constructor(token) {
        super(token);
        this.prec = -1;
        this.opCount = 0;
    }
    getPermutation(_, context) {
        return context.hand;
    }
}
class GradientPattern extends PatternNode {
    constructor(token, gradientId, cardinal) {
        super(token);
        this.gradientId = gradientId;
        this.cardinal = cardinal;
        this.prec = -1;
        this.opCount = 0;
        const dir = cardinal.getDirection();
        const absDir = [Math.abs(dir.x), Math.abs(dir.y), Math.abs(dir.z)];
        if (absDir[0] > absDir[1] && absDir[0] > absDir[2]) {
            this.axis = "x";
        }
        else if (absDir[1] > absDir[0] && absDir[1] > absDir[2]) {
            this.axis = "y";
        }
        else {
            this.axis = "z";
        }
        this.invertCoords = dir[this.axis] < 0;
    }
    getPermutation(block, context) {
        const gradient = context.session.getGradient(this.gradientId);
        if (gradient) {
            const unitCoords = Vector.sub(block.location, context.range[0]).div(context.range[1].sub(context.range[0]).max([1, 1, 1]));
            const patternLength = gradient.patterns.length;
            const direction = this.invertCoords ? 1.0 - unitCoords[this.axis] : unitCoords[this.axis];
            const index = Math.floor(direction * (patternLength - gradient.dither) + Math.random() * gradient.dither);
            return gradient.patterns[Math.min(Math.max(index, 0), patternLength - 1)].getRootNode().getPermutation(block, context);
        }
    }
}
class PercentPattern extends PatternNode {
    constructor(token, percent) {
        super(token);
        this.percent = percent;
        this.prec = 2;
        this.opCount = 1;
    }
    getPermutation() {
        return null;
    }
}
class ChainPattern extends PatternNode {
    constructor() {
        super(...arguments);
        this.prec = 1;
        this.opCount = 2;
        this.evenDistribution = true;
        this.cumWeights = [];
    }
    getPermutation(block, context) {
        if (this.nodes.length == 1) {
            return this.nodes[0].getPermutation(block, context);
        }
        else if (this.evenDistribution) {
            return this.nodes[Math.floor(Math.random() * this.nodes.length)].getPermutation(block, context);
        }
        else {
            const rand = Math.random() * this.weightTotal;
            for (let i = 0; i < this.nodes.length; i++) {
                if (this.cumWeights[i] >= rand) {
                    return this.nodes[i].getPermutation(block, context);
                }
            }
        }
    }
    postProcess() {
        super.postProcess();
        const defaultPercent = 100 / this.nodes.length;
        let totalPercent = 0;
        const patterns = this.nodes;
        const weights = [];
        this.nodes = [];
        while (patterns.length) {
            const pattern = patterns.shift();
            if (pattern instanceof ChainPattern) {
                const sub = pattern.nodes.reverse();
                for (const child of sub) {
                    patterns.unshift(child);
                }
            }
            else if (pattern instanceof PercentPattern) {
                this.evenDistribution = false;
                this.nodes.push(pattern.nodes[0]);
                weights.push(pattern.percent);
                pattern.nodes[0].postProcess();
                totalPercent += pattern.percent;
            }
            else {
                this.nodes.push(pattern);
                weights.push(defaultPercent);
                pattern.postProcess();
                totalPercent += defaultPercent;
            }
        }
        weights.map(value => {
            // printDebug(value / totalPercent);
            return value / totalPercent;
        });
        if (!this.evenDistribution) {
            for (let i = 0; i < weights.length; i += 1) {
                this.cumWeights.push(weights[i] + (this.cumWeights[i - 1] || 0));
            }
            this.weightTotal = this.cumWeights[this.cumWeights.length - 1];
        }
    }
}
