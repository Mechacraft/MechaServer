import { BlockPermutation, BlockStates } from "@minecraft/server";
export class BlockBuilder {
    /**
     * Converts block data value to block states.
     * @param block the block identifier
     * @param data the data value
     * @returns an object with block state properties and corresponding values
     */
    dataValueToStates(block, data) {
        const props = BlockPermutation.resolve(block).getAllStates();
        for (const state in props) {
            const { validValues } = BlockStates.get(state);
            props[state] = validValues[data % validValues.length];
            data /= validValues.length;
        }
        return props;
    }
    dataValueToPermutation(block, data) {
        return BlockPermutation.resolve(block, this.dataValueToStates(block, data));
    }
    statesToDataValue(props) {
        let data = 0;
        let factor = 1;
        for (const state in props) {
            const { validValues } = BlockStates.get(state);
            data += validValues.indexOf(props[state]) * factor;
            factor *= validValues.length;
        }
        return data;
    }
    *iteratePermutations(block) {
        let permutation = BlockPermutation.resolve(block);
        const props = Object.keys(permutation.getAllStates());
        if (props.length == 0) {
            yield permutation;
            return;
        }
        yield* recurseStates(props.length);
        function* recurseStates(i) {
            const state = props[--i];
            for (const val of Array.from(BlockStates.get(state).validValues)) {
                permutation = permutation.withState(state, val);
                if (permutation.getState(state) != val)
                    return;
                if (i == 0) {
                    yield permutation;
                }
                else {
                    yield* recurseStates(i);
                }
            }
        }
    }
    itemToPermutation(item) {
        const block = item.typeId;
        for (const permutation of this.iteratePermutations(block)) {
            if (permutation.getItemStack().isStackableWith(item)) {
                if (permutation.getState("persistent_bit") != undefined) {
                    return permutation.withState("persistent_bit", true);
                }
                return permutation;
            }
        }
        return BlockPermutation.resolve(block);
    }
    isAirOrFluid(block) {
        if (!block)
            return true;
        const type = block.type.id;
        return type == "minecraft:air" || type == "minecraft:water" || type == "minecraft:lava";
    }
}
export const Block = new BlockBuilder();
