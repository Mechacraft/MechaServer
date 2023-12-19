import { Server, Thread, Timer, RawText, contentLog } from "./../../library/Minecraft.js";
import { getSession, hasSession } from "../sessions.js";
import { print, printerr } from "../util.js";
import { UnloadedChunksError } from "./../modules/assert.js";
const commandList = new Map();
const sawOutsideWorldErr = [];
export function registerCommand(registerInformation, callback) {
    commandList.set(registerInformation.name, [registerInformation, callback]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Server.command.register(registerInformation, (player, msg, args) => {
        if (!hasSession(player.id)) {
            return undefined;
        }
        const toActionBar = getSession(player).usingItem;
        args.set("_using_item", getSession(player).usingItem);
        const thread = new Thread();
        thread.start(function* (msg, player, args) {
            const timer = new Timer();
            try {
                timer.start();
                contentLog.log(`Processing command '${msg}' for '${player.name}'`);
                let result;
                if (callback.constructor.name == "GeneratorFunction") {
                    result = yield* callback(getSession(player), player, args);
                }
                else {
                    result = callback(getSession(player), player, args);
                }
                const time = timer.end();
                contentLog.log(`Time taken to execute: ${time}ms (${time / 1000.0} secs)`);
                if (result)
                    print(result, player, toActionBar);
            }
            catch (e) {
                const errMsg = e.message ? RawText.text(`${e.name}: `).append("translate", e.message) : e;
                contentLog.error(`Command '${msg}' failed for '${player.name}' with msg: ${errMsg}`);
                printerr(errMsg, player, toActionBar);
                if (e instanceof UnloadedChunksError) {
                    if (!sawOutsideWorldErr.includes(player)) {
                        sawOutsideWorldErr.push(player);
                        print("commands.generic.wedit:outsideWorld.detail", player, false);
                    }
                }
                else if (e.stack) {
                    printerr(e.stack, player, false);
                }
            }
        }, msg, player, args);
        return thread;
    });
}
export function getCommandFunc(command) {
    return commandList.get(command)[1];
}
export function getCommandInfo(command) {
    return commandList.get(command)[0];
}
