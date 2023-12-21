import { Server } from "./../../../library/Minecraft.js";
import { registerCommand } from "../register_commands.js";
import { RawText } from "./../../../library/Minecraft.js";
import config from "config.js";
const registerInformation = {
    name: "wand",
    permission: "worldedit.wand",
    description: "commands.wedit:wand.description"
};
registerCommand(registerInformation, function (session, builder) {
    let item = config.wandItem;
    const boundItems = session.getTools("selection_wand");
    if (boundItems.length && !boundItems.includes(item)) {
        item = boundItems[0];
    }
    Server.runCommand(`give @s ${item}`, builder);
    session.bindTool("selection_wand", item);
    return RawText.translate("commands.wedit:wand.explain");
});
