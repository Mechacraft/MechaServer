import { Tool } from "./base_tool.js";
import { Tools } from "./tool_manager.js";
import { Pattern } from "./../modules/pattern.js";
class BlockReplacerTool extends Tool {
    constructor(pattern) {
        super();
        this.noDelay = true;
        this.permission = "worldedit.repl";
        this.useOn = function (self, player, session, loc) {
            if (player.isSneaking) {
                self.break(self, player, session, loc);
            }
            else {
                self.pattern.setBlock(player.dimension.getBlock(loc));
            }
        };
        this.break = function (self, player, session, loc) {
            const pattern = new Pattern();
            pattern.addBlock(player.dimension.getBlock(loc).permutation);
            session.setToolProperty(null, "pattern", pattern);
        };
        this.pattern = pattern;
    }
    toJSON() {
        return {
            type: this.type,
            pattern: this.pattern.getSource()
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static parseJSON(json) {
        return [new Pattern(json.pattern)];
    }
}
Tools.register(BlockReplacerTool, "replacer_wand");
