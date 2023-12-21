import { viewObj, isPlayerExist, getPlayer, showErrorToOP, print } from "./libs/utils";
import MechaAPI from "./libs/mechapi";
// import * as rank from "../chatrank/index";
MechaAPI;
export function showHelp(cmd) {
    return `
${cmd ? `§o§cGagal ekseskusi perintah §b${cmd}§r\n` : ""}
§a§lPerintah yang tersedia :§r

§6.menu §c- §o§eMinta item Menu GUI§r
§6.shop §c- §o§eMinta item Shop GUI§r
§6.vshop §c- §o§eBuka virtual Shop GUI (Khusus Enchant)§r
§6.tpa §c- §o§eMinta item Teleport GUI§r
§6.tparequest <username> §c- §o§ePermintaan teleportasi ke player§r
§6.tpaaccept <username> §c- §o§eTerima permintaan teleport§r
§6.tpadeny <username> §c- §o§eTolak permintaan teleport§r`;
}
export const prefix = "!";
export const commands = async (msg) => {
    var player = msg.sender;
    try {
        const cmd = msg.message.toLowerCase().split(/ +/g)[0] || "";
        const args = msg.message.split(/ +/g);
        const isOp = player.isOp() || player.hasTag("admin") || player.hasTag("admin") || player.hasTag("worldedit");
        switch (cmd) {
            case prefix + "help":
                print(player, showHelp(null));
                break;
            case prefix + "eval":
                if (!isOp)
                    return player.sendMessage("§r§l§c[§eEVAL§c]§r §cOP ONLY");
                try {
                    let evalResult = eval(args.slice(1).join(" "));
                    player.sendMessage(viewObj(evalResult));
                }
                catch (error) {
                    player.sendMessage(viewObj(error));
                }
                break;
            case prefix + "menu":
                player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§l§6[MECHA] §r§bBerhasil memberikan Menu GUI"}]}`);
                player.runCommandAsync("give @s ms:menu_ui");
                break;
            case prefix + "lca":
                player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§l§6[MECHA] §r§bBerhasil memberikan Land Claim GUI"}]}`);
                player.runCommandAsync("give @s ms:lca_ui");
                break;
            case prefix + "shop":
                player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§l§6[MECHA] §r§bBerhasil memberikan Shop GUI"}]}`);
                player.runCommandAsync("give @s ms:shop_ui");
                break;
            case prefix + "vshop":
                player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§l§6[MECHA] §r§evshop untuk sementara tidak bisa digunakan."}]}`);
                // player.runCommandAsync(
                //     `tellraw @s {"rawtext":[{"text":"§l§6[MECHA] §r§bBerhasil membuka Shop GUI, tutup chat dalam §c2§b detik atau sesi langsung berakhir."}]}`
                // );
                // player.addTag("shop_ui");
                break;
            case prefix + "tpa":
                player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§l§6[MECHA] §r§bBerhasil memberikan TPA GUI"}]}`);
                player.runCommandAsync("give @s ms:tpa_ui");
                break;
            case prefix + "tparequest":
                if (args.length < 2)
                    return player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"\n§l§bPenggunaan : \n§r§6.tparequest username"}]}`);
                const playerReq = args.slice(1).join(" ");
                if (!isPlayerExist(playerReq)) {
                    player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§l§6[TPA] §r§cTidak dapat menemukan player dengan nama §b${playerReq}"}]}`);
                }
                else {
                    if (player.name == getPlayer(playerReq).name)
                        return player.sendMessage("§l§6[TPA] §r§cTidak bisa TP ke diri sendiri!");
                    getPlayer(playerReq).addTag("tpa_ui");
                    getPlayer(playerReq).addTag("tpa:" + player.nameTag.replace(/ /g, "_"));
                    player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§l§6[TPA] §r§7Kamu telah mengirim permintaan TP ke §2${playerReq}§6, mohon tunggu untuk disetujui.."}]}`);
                }
                break;
            case prefix + "tpaaccept":
                if (args.length < 2)
                    return player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"\n§l§bPenggunaan : \n§r§6.tpadeny username"}]}`);
                const playerAcc = args.slice(1).join(" ");
                if (!isPlayerExist(playerAcc)) {
                    player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§l§6[TPA] §r§cTidak dapat menemukan player dengan nama §b${playerAcc}"}]}`);
                }
                else if (!player.hasTag("tpa:" + args.slice(1).join("_"))) {
                    player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§l§6[TPA] §r§b${playerAcc} §ctidak sedang meminta request!"}]}`);
                }
                else {
                    player.runCommandAsync(`tp "${playerAcc}" @s`);
                    player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§l§6[TPA] §aBerhasil teleport."}]}`);
                    player.runCommandAsync(`tellraw "${playerAcc}" {"rawtext":[{"text":"§l§6[TPA] §aDiterima, sedang teleportasi..."}]}`);
                    player.removeTag("tpa:" + args.slice(1).join("_"));
                }
                break;
            case prefix + "tpadeny":
                if (args.length < 2)
                    return player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"\n§l§bPenggunaan : \n§r§6.tpadeny username"}]}`);
                const playerDeny = args.slice(1).join(" ");
                if (!isPlayerExist(playerDeny)) {
                    player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§l§6[TPA] §r§cTidak dapat menemukan player dengan nama §b${playerDeny}"}]}`);
                }
                else if (!player.hasTag("tpa:" + args.slice(1).join("_"))) {
                    player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§l§6[TPA] §r§b${playerDeny} §ctidak sedang meminta request!"}]}`);
                }
                else {
                    player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§l§6[TPA] §cPermintaan ditolak."}]}`);
                    player.runCommandAsync(`tellraw "${playerDeny}" {"rawtext":[{"text":"§l§6[TPA] §cMaaf, ${player.nameTag} telah menolak permintaanmu!"}]}`);
                    player.removeTag("tpa:" + args.slice(1).join("_"));
                }
                break;
            default:
                if (cmd.startsWith(prefix)) {
                    player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"${showHelp(cmd)}"}]}`);
                }
                break;
        }
    }
    catch (error) {
        showErrorToOP("Command Error: " + viewObj(error));
        player.sendMessage("§r§l§e[§bMECHA§e]§r §cTerdapat kesalahan, silahkan hubungi admin.");
    }
};
//# sourceMappingURL=commands.js.map