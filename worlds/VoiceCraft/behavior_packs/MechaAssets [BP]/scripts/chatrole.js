import { viewObj, getPlayers, getPlayersRole } from "./libs/utils";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import MechAPI from "./libs/mechapi";
import { formatGuild, getGuildTag } from "./guild";
export const ROLE = {
    OPERATOR: {
        DISPLAY: "OP",
        COLOR: "§c",
        FORMAT: "§l",
    },
    MODERATOR: {
        DISPLAY: "MOD",
        COLOR: "§b",
        FORMAT: "§l",
    },
    BUILDER: {
        DISPLAY: "BUILD",
        COLOR: "§a",
        FORMAT: "§l",
    },
    STAFF: {
        DISPLAY: "STAFF",
        COLOR: "§e",
        FORMAT: "§l",
    },
    VIP: {
        DISPLAY: "VIP",
        COLOR: "§d",
        FORMAT: "§l",
    },
    USER: {
        DISPLAY: "TAMU",
        COLOR: "§7",
        FORMAT: "§l",
    },
};
export function formatRole(player, role) {
    var format = "";
    const guildName = getGuildTag(player);
    const d = ROLE[role].DISPLAY;
    const c = ROLE[role].COLOR;
    const f = ROLE[role].FORMAT;
    if (guildName) {
        format = formatGuild(guildName);
        if (role != "USER") {
            format += `§r ${f}§f[${c}${d}§f]§r`;
        }
    }
    else {
        format = `${f}§f[${c}${d}§f]§r`;
    }
    return format;
}
export function checkRole(player) {
    if (player.getTags().join("|").includes("role:")) {
        return player
            .getTags()
            .filter((v) => v.includes("role:"))[0]
            .replace("role:", "");
    }
    else {
        return "USER";
    }
}
export function changeRole(player, role, notify = false) {
    // Remove old role
    if (player.getTags().join("|").includes("role:")) {
        let tagRole = player.getTags().filter((v) => v.includes("role:"))[0];
        player.removeTag(tagRole);
    }
    // Add new role
    const roleFormat = formatRole(player, role);
    player.addTag(`role:${role}`);
    if (notify) {
        for (let op of getPlayersRole(["OPERATOR"])) {
            op.sendMessage(`§r§l§e[§bROLE§e]§r §aRole §c${player.nameTag}§a telah diubah menjadi ${roleFormat}`);
        }
    }
    // Apply To Server
    MechAPI.changeRole(player, role);
}
export function ChatRolePlayerManager(player, admin) {
    try {
        const playerRole = checkRole(player);
        const chatFormat = formatRole(player, playerRole);
        const roleOptions = Object.keys(ROLE);
        let chats = new ModalFormData()
            .title(`Ubah Role ${player.nameTag}`)
            .dropdown(`§6-------------------------------\n\nInfomasi Pengguna:\n§fID §c: §a${player.id}\n§fNama §c: §a${player.nameTag}\n§fFormat §c: §b${chatFormat}\n\n§6-------------------------------\n\n§6Role:`, roleOptions, roleOptions.indexOf(playerRole));
        chats.show(admin).then(async (res) => {
            let values = res.formValues;
            let role = roleOptions[values[0]];
            changeRole(player, role, true);
        });
    }
    catch (error) {
        admin.sendMessage(viewObj(error));
    }
}
export function ChatManageForm(player) {
    try {
        let form = new ActionFormData();
        form.title(`§l§cChatRole §2Manager`);
        form.body(`§6Pilih player untuk mengedit tampilan chat`);
        let players = getPlayers();
        for (let targetPlayer of players) {
            const isOp = targetPlayer.isOp() || targetPlayer.hasTag("admin") || targetPlayer.hasTag("worldedit");
            form.button(targetPlayer.nameTag, isOp ? "textures/ui/op" : "textures/ui/permissions_member_star");
        }
        form.show(player).then((result) => {
            if (result.canceled)
                return;
            if (result.selection < players.length) {
                ChatRolePlayerManager(players[result.selection], player);
            }
            else {
                player.sendMessage("§l§6[ROLE] §r§cPlayer tidak valid!");
            }
        });
    }
    catch (error) {
        player.sendMessage(viewObj(error));
    }
}
//# sourceMappingURL=chatrole.js.map