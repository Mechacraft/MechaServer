import { Server, Vector, RawText } from "./../../library/Minecraft.js";
import { canPlaceBlock } from "../util.js";
class UnloadedChunksError extends Error {
    constructor() {
        super(...arguments);
        this.name = "UnloadedChunksError";
    }
}
function assertPermission(player, perm) {
    if (!Server.player.hasPermission(player, perm)) {
        throw "commands.generic.wedit:noPermission";
    }
}
function assertCanBuildWithin(player, min, max) {
    const minChunk = Vector.from(min).mul(1 / 16).floor().mul(16);
    const maxChunk = Vector.from(max).mul(1 / 16).ceil().mul(16);
    for (let z = minChunk.z; z < maxChunk.z; z += 16)
        for (let x = minChunk.x; x < maxChunk.x; x += 16) {
            if (!canPlaceBlock(new Vector(x, 0, z), player.dimension)) {
                throw new UnloadedChunksError("commands.generic.wedit:outsideWorld");
            }
        }
}
function assertClipboard(session) {
    if (!session.clipboard) {
        throw RawText.translate("commands.generic.wedit:noClipboard");
    }
}
function assertSelection(session) {
    if (!session.selection.isValid()) {
        throw RawText.translate("commands.generic.wedit:noSelection");
    }
}
function assertCuboidSelection(session) {
    if (!session.selection.isValid() || !session.selection.isCuboid()) {
        throw RawText.translate("commands.generic.wedit:noCuboidSelection");
    }
}
function assertHistoryNotRecording(history) {
    if (history.isRecording()) {
        throw RawText.translate("worldedit.error.stillRecording");
    }
}
export { UnloadedChunksError, assertCanBuildWithin, assertClipboard, assertCuboidSelection, assertHistoryNotRecording, assertPermission, assertSelection };
