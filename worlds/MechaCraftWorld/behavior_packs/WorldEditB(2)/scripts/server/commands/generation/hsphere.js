import { getCommandFunc, registerCommand } from "../register_commands.js";
const registerInformation = {
    name: "hsphere",
    permission: "worldedit.generation.sphere",
    description: "commands.wedit:hsphere.description",
    usage: [
        {
            flag: "r"
        }, {
            name: "pattern",
            type: "Pattern"
        }, {
            subName: "_x",
            args: [
                {
                    name: "radii",
                    type: "float",
                    range: [0.01, null]
                }
            ]
        }, {
            subName: "_xy",
            args: [
                {
                    name: "radiiXZ",
                    type: "float",
                    range: [0.01, null]
                }, {
                    name: "radiiY",
                    type: "float",
                    range: [0.01, null]
                }
            ]
        }, {
            subName: "_xyz",
            args: [
                {
                    name: "radiiX",
                    type: "float",
                    range: [0.01, null]
                }, {
                    name: "radiiY",
                    type: "float",
                    range: [0.01, null]
                }, {
                    name: "radiiZ",
                    type: "float",
                    range: [0.01, null]
                }
            ]
        }
    ]
};
registerCommand(registerInformation, function* (session, builder, args) {
    args.set("h", true);
    return yield* getCommandFunc("sphere")(session, builder, args);
});