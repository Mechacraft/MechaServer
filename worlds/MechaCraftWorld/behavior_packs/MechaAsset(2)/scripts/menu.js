import { ActionFormData } from "@minecraft/server-ui";
import { ShopUI } from "./shop";
import { TpaForm } from "./tpa";
import { ChatManageForm, checkRole } from "./chatrole";
import { RunningTextForm, ScoreboardManager, NotesManager } from "./scoreboard";
import { WaypointForm } from "./waypoint";
import { VoicePageAdmin, VoicePageUser } from "./voice";
import { ServerMenu } from "./server";
import MechAPI from "./libs/mechapi";
import { getPlayersRole } from "./libs/utils";
import { GuildMenu } from "./guild";
import { WarpForm, WarpList } from "./warp";
export async function MenuForm(player) {
    const resp = await MechAPI.getUser(player);
    const userRole = checkRole(player);
    if (!resp.status) {
        if (resp.no_player) {
            player.sendMessage("§r§l§e[§bGUILD§e]§r §aAkun telah dibuat, silahkan coba lagi.");
            return;
        }
        if (!["USER", "VIP"].includes(userRole)) {
            let form = new ActionFormData()
                .body(`\n           §¶[  §l§cMecha§aCraft §6Menu §r ]
                
§cServer tidak tersambung. Harap siapkan server mecha terlebih dahulu!\n
`)
                .button("Pengaturan Server", "textures/ui/settings_glyph_color_2x");
            form.show(player).then((result) => {
                if (!result.canceled) {
                    if (result.selection == 0) {
                        ServerMenu(player);
                    }
                }
            });
        }
        else {
            new ActionFormData()
                .body(`\n           §¶[  §l§cMecha§aCraft §6Menu §r ]
                
§cServer mecha belum disiapkan. Silahkan hubungi admin!\n
`)
                .button("Notify Admin", "textures/items/lantern")
                .show(player)
                .then((result) => {
                if (!result.canceled) {
                    if (result.selection == 0) {
                        let adminCount = 0;
                        for (let op of getPlayersRole(["OPERATOR", "ADMIN", "MODERATOR", "BUILDER", "STAFF"])) {
                            adminCount += 1;
                            op.sendMessage(`§r§l§e[§bNOTIFY§e]§r §6Untuk para admin harap persiapkan server mecha agar dapat berjalan.`);
                        }
                        if (adminCount > 0) {
                            player.sendMessage(`§r§l§e[§bNOTIFY§e]§r §aBerhasil notify ke §c${adminCount} §aadmin.`);
                        }
                        else {
                            player.sendMessage(`§r§l§e[§bNOTIFY§e]§r §6Tidak ada admin yang aktif, silahkan kontak melalui whatsapp 6285559038021`);
                        }
                    }
                }
            });
        }
        return;
    }
    let user = resp.result;
    let form = new ActionFormData();
    form.body(`\n           §¶[  §l§cMecha§aCraft §6Menu §r ]
        
    §fNameTag §c: §b${player.nameTag}
    §fUang    §c: §a${user.money}\n
`);
    form.button("Toko", "textures/ui/Scaffolding");
    form.button("Guild", "textures/ui/icon_multiplayer");
    form.button("Warp Antar Dunia", "textures/ui/icon_best3");
    form.button("Teleportasi ke Pemain", "textures/ui/warning_alex");
    form.button("Pengaturan Voice", "textures/ui/sound_glyph_color_2x");
    form.button("Waypoint", "textures/ui/world_glyph_color");
    form.button("Papan Info", "textures/ui/storageIconColor");
    // MENU ROLES
    if (["OPERATOR", "ADMIN"].includes(userRole)) {
        form.button("Pengaturan Server", "textures/ui/settings_glyph_color_2x");
        form.button("Ubah Role", "textures/ui/multiplayer_glyph_color");
        form.button("Catatan Server", "textures/ui/tiny_agnes");
        form.button("Pesan Berjalan", "textures/ui/comment");
    }
    else if (userRole == "MODERATOR") {
        form.button("Pengaturan Server", "textures/ui/settings_glyph_color_2x");
        form.button("Catatan Server", "textures/ui/tiny_agnes");
        form.button("Pesan Berjalan", "textures/ui/comment");
    }
    else if (["STAFF", "BUILDER"].includes(userRole)) {
        form.button("Pengaturan Server", "textures/ui/settings_glyph_color_2x");
    }
    form.show(player).then((result) => {
        if (!result.canceled) {
            if (["OPERATOR", "ADMIN"].includes(userRole)) {
                switch (result.selection) {
                    case 0:
                        ShopUI(player);
                        break;
                    case 1:
                        GuildMenu(player);
                        break;
                    case 2:
                        WarpForm(player);
                        break;
                    case 3:
                        TpaForm(player);
                        break;
                    case 4:
                        VoicePageAdmin(player);
                        break;
                    case 5:
                        WaypointForm(player);
                        break;
                    case 6:
                        ScoreboardManager(player);
                        break;
                    case 7:
                        ServerMenu(player);
                        break;
                    case 8:
                        ChatManageForm(player);
                        break;
                    case 9:
                        NotesManager(player);
                        break;
                    case 10:
                        RunningTextForm(player);
                        break;
                    default:
                        break;
                }
            }
            else if (userRole == "MODERATOR") {
                switch (result.selection) {
                    case 0:
                        ShopUI(player);
                        break;
                    case 1:
                        GuildMenu(player);
                        break;
                    case 2:
                        WarpList(player);
                        break;
                    case 3:
                        TpaForm(player);
                        break;
                    case 4:
                        VoicePageUser(player);
                        break;
                    case 5:
                        WaypointForm(player);
                        break;
                    case 6:
                        ScoreboardManager(player);
                        break;
                    case 7:
                        ServerMenu(player);
                        break;
                    case 8:
                        NotesManager(player);
                        break;
                    case 9:
                        RunningTextForm(player);
                        break;
                    default:
                        break;
                }
            }
            else if (["STAFF", "BUILDER"].includes(userRole)) {
                switch (result.selection) {
                    case 0:
                        ShopUI(player);
                        break;
                    case 1:
                        GuildMenu(player);
                        break;
                    case 2:
                        WarpList(player);
                        break;
                    case 3:
                        TpaForm(player);
                        break;
                    case 4:
                        VoicePageUser(player);
                        break;
                    case 5:
                        WaypointForm(player);
                        break;
                    case 6:
                        ScoreboardManager(player);
                        break;
                    case 7:
                        ServerMenu(player);
                        break;
                    default:
                        break;
                }
            }
            else {
                switch (result.selection) {
                    case 0:
                        ShopUI(player);
                        break;
                    case 1:
                        GuildMenu(player);
                        break;
                    case 2:
                        WarpList(player);
                        break;
                    case 3:
                        TpaForm(player);
                        break;
                    case 4:
                        VoicePageUser(player);
                        break;
                    case 5:
                        WaypointForm(player);
                        break;
                    case 6:
                        ScoreboardManager(player);
                        break;
                    default:
                        break;
                }
            }
        }
    });
}
//# sourceMappingURL=menu.js.map