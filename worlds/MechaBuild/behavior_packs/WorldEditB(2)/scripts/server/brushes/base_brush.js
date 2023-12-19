import { RawText } from "./../../library/Minecraft.js";
import config from "config.js";
export const brushTypes = new Map();
/**
 * This class is the base for all brush types available in WorldEdit.
 */
export class Brush {
    delete() {
        return;
    }
    assertSizeInRange(size) {
        if (size > config.maxBrushRadius) {
            throw RawText.translate("commands.wedit:brush.tooLarge").with(config.maxBrushRadius.toString());
        }
    }
    toJSON() {
        return { id: this.id };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    static parseJSON(json) {
        return [];
    }
}
