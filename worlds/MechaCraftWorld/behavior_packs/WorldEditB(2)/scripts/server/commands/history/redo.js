import { assertHistoryNotRecording } from "./../../modules/assert.js";
import { RawText } from "./../../../library/Minecraft.js";
import { registerCommand } from "../register_commands.js";
const registerInformation = {
    name: "redo",
    permission: "worldedit.history.redo",
    description: "commands.wedit:redo.description",
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
        if (history.redo(session)) {
            break;
        }
    }
    return RawText.translate(i == 0 ? "commands.wedit:redo.none" : "commands.wedit:redo.explain").with(`${i}`);
});
