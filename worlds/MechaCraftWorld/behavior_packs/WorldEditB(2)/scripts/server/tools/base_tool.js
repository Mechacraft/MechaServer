import { system } from "@minecraft/server";
import { Server, Thread } from "./../../library/Minecraft.js";
import { print, printerr } from "../util.js";
import { RawText } from "./../../library/Minecraft.js";
export var ToolAction;
(function (ToolAction) {
    ToolAction["USE"] = "use";
    ToolAction["USE_ON"] = "useOn";
    ToolAction["BREAK"] = "break";
    ToolAction["HIT"] = "hit";
})(ToolAction || (ToolAction = {}));
/**
 * The base tool class for handling tools that WorldEdit builders may use.
 */
export class Tool {
    constructor() {
        /**
         * Whether there should be some delay between item use to avoid rapid fire.
         */
        this.noDelay = false;
        this.useOnTick = 0;
        this.lastUse = system.currentTick;
    }
    log(message) {
        print(message, this.currentPlayer, true);
    }
    process(session, tick, action, loc) {
        const player = session.getPlayer();
        if (!this[action])
            return false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onFail = (e) => {
            printerr(e.message ? RawText.text(`${e.name}: `).append("translate", e.message) : e, player, true);
            if (e.stack) {
                printerr(e.stack, player, false);
            }
        };
        new Thread().start(function* (self, player, session, action, loc) {
            self.currentPlayer = player;
            session.usingItem = true;
            try {
                if (!Server.player.hasPermission(player, self.permission)) {
                    throw "worldedit.tool.noPerm";
                }
                if (system.currentTick - self.lastUse > 4 || self.noDelay) {
                    self.lastUse = system.currentTick;
                    if (!(action == ToolAction.USE && self.useOnTick == tick)) {
                        if (action == ToolAction.USE_ON)
                            self.useOnTick = tick;
                        const func = self[action];
                        if (func.constructor.name == "GeneratorFunction") {
                            yield* func(self, player, session, loc);
                        }
                        else {
                            func(self, player, session, loc);
                        }
                    }
                }
            }
            catch (e) {
                onFail(e);
            }
            finally {
                session.usingItem = false;
            }
            self.currentPlayer = null;
        }, this, player, session, action, loc);
        return true;
    }
    delete() {
        return;
    }
    toJSON() {
        return { type: this.type };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    static parseJSON(json) {
        return [];
    }
}
