import { assertHistoryNotRecording } from "./../../modules/assert.js";
import { RawText } from "./../../../library/Minecraft.js";
import { registerCommand } from "../register_commands.js";
const registerInformation = {
    name: "undo",
    permission: "worldedit.history.undo",
    description: "commands.wedit:undo.description",
    usage: [
        {
            name: "times",
            type: "int",
            range: [1, null],
            default: 1
        }
    ]
};
registerCommand(registerInformation, function (session, builder, args) {
    const times = args.get("times");
    const history = session.getHistory();
    let i;
    assertHistoryNotRecording(history);
    for (i = 0; i < times; i++) {
        if (history.undo(session)) {
            break;
        }
    }
    return RawText.translate(i == 0 ? "commands.wedit:undo.none" : "commands.wedit:undo.explain").with(`${i}`);
});
