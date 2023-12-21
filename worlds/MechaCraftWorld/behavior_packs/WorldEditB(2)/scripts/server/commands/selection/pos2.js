import { printLocation } from "../../util.js";
import { registerCommand } from "../register_commands.js";
import { RawText, CommandPosition, Vector } from "./../../../library/Minecraft.js";
const registerInformation = {
    name: "pos2",
    permission: "worldedit.selection.pos",
    description: "commands.wedit:pos2.description",
    usage: [
        {
            name: "coordinates",
            type: "xyz",
            default: new CommandPosition()
        }
    ],
    aliases: ["2"]
};
export function setPos2(selection, loc) {
    const prevPoints = selection.points;
    selection.set(1, Vector.from(loc));
    if (selection.points.some((loc, idx) => !loc || !prevPoints[idx] || !loc.equals(prevPoints[idx]))) {
        let translate;
        const blockCount = selection.getBlockCount();
        if (!blockCount && selection.isCuboid()) {
            translate = `worldedit.selection.${selection.mode}.secondary`;
        }
        else {
            translate = `worldedit.selection.${selection.mode}.secondaryArea`;
        }
        let sub = [printLocation(selection.points[1])];
        if (selection.mode == "sphere") {
            sub = [`${Math.round(Vector.sub(selection.points[1], selection.points[0]).length)}`];
        }
        else if (selection.mode == "cylinder") {
            const vec = Vector.sub(selection.points[1], selection.points[0]);
            sub = [
                `${Math.round(vec.mul([1, 0, 1]).length)}`,
                `${Math.abs(vec.y) + 1}`
            ];
        }
        let result = RawText.translate(translate);
        for (const s of sub) {
            result = result.with(s);
        }
        return result.with(`${blockCount}`);
    }
    return "";
}
registerCommand(registerInformation, function (session, builder, args) {
    return setPos2(session.selection, args.get("coordinates").relativeTo(builder, true));
});
