import { ActionFormData, ModalFormData, MessageFormData, FormCancelationReason } from "@minecraft/server-ui";
import { getActivePlayers, getPlayerByName, getPlayersRole, getServerPlayer, isPlayerAdmin, showErrorToOP, viewObj, } from "./libs/utils";
import MechAPI from "./libs/mechapi";
export async function TpaForm(player) {
    let form = new ActionFormData();
    let mecha = await getServerPlayer(player);
    form.title(`§l§cMecha §2TPA`);
    form.body(`§6Teleportasi ke Pemain`);
    form.button("Cari Pemain", "textures/ui/icon_steve.png");
    form.button("TPA Tertunda", "textures/ui/timer.png");
    form.button("Setelan saya", "textures/ui/icon_setting.png");
    form.show(player).then((result) => {
        if (!result.canceled) {
            if (result.selection == 0)
                TpaSearch(player);
            if (result.selection == 1)
                TpaPending(player);
            if (result.selection == 2)
                TPAPublicSettings(player, mecha.canTpa);
        }
    });
}
export async function TpaSearch(player) {
    try {
        let form = new ActionFormData();
        form.title(`§l§cPlayer §2Teleport`);
        form.body(`§6Pilih player untuk target teleportasi.`);
        let players = await getActivePlayers(player);
        if (players.mecha.length == 0) {
            player.sendMessage(`§r§l§e[§bTPA§e]§r §cGagal mendapatkan player aktif, silahkan hubungi admin.`);
            player.playSound("note.bass");
            return;
        }
        if (players.mecha.filter((v) => v.canTpa).length == 0) {
            player.sendMessage(`§r§l§e[§bTPA§e]§r §6Player yang tersedia untuk TPA tidak ditemukan.`);
            player.playSound("note.bass");
            return;
        }
        for (let i = 0; i < players.mecha.length; i++) {
            const targetPlayer = players.player[i];
            const mechaPlayer = players.mecha[i];
            if (mechaPlayer.canTpa) {
                const isOp = isPlayerAdmin(targetPlayer);
                const playerLocation = Object.values(targetPlayer.location)
                    .map((v) => Math.round(v))
                    .join(", ");
                const isThisPlayer = targetPlayer.name == player.name;
                form.button(`${isThisPlayer ? "§lKAMU" : targetPlayer.nameTag}\n§6${playerLocation}`, isThisPlayer
                    ? "textures/ui/icon_deals.png"
                    : isOp
                        ? "textures/ui/op"
                        : "textures/ui/permissions_member_star");
            }
        }
        form.show(player).then(async (result) => {
            if (result.canceled)
                return;
            const targetPlayer = players.player[result.selection];
            if (player.name == targetPlayer.name) {
                player.sendMessage("§l§6[TPA] §r§cTidak bisa TP ke diri sendiri!");
                player.playSound("note.bass");
                return;
            }
            const resp = await MechAPI.requestTpa(player, targetPlayer);
            if (resp.status) {
                player.sendMessage(`§l§6[TPA] §r§7Kamu telah mengirim permintaan TP ke §2${targetPlayer.name}§7, mohon tunggu untuk disetujui.`);
                player.playSound("random.toast");
                TpaUI(player, targetPlayer);
            }
            else {
                player.sendMessage(`§r§l§e[§bTPA§e]§r §c${resp.message}`);
                player.playSound("note.bass");
            }
        });
    }
    catch (error) {
        player.sendMessage(`§r§l§e[§bTPA§e]§r §cGagal mendapatkan player aktif, silahkan hubungi admin.`);
        player.playSound("note.bass");
        showErrorToOP(viewObj(error));
    }
}
export async function TpaPending(player) {
    try {
        let form = new ActionFormData();
        form.title(`§l§cPlayer §2Teleport`);
        form.body(`§6Pilih player untuk target teleportasi.`);
        let resp = await MechAPI.getListTpa(player);
        if (!resp.status) {
            player.sendMessage(`§r§l§e[§bTPA§e]§r §c${resp.message}`);
            player.playSound("note.bass");
        }
        if (resp.result.length == 0) {
            player.sendMessage(`§r§l§e[§bTPA§e]§r §6Permintaan TPA masih kosong.`);
            player.playSound("note.bass");
            return;
        }
        const listTpa = resp.result;
        for (let tpa of listTpa) {
            if (tpa.fromName == player.name) {
                form.button(tpa.targetName, "textures/ui/dressing_room_capes");
            }
            else if (tpa.targetName == player.name) {
                form.button(tpa.fromName, "textures/ui/dressing_room_animation");
            }
        }
        form.show(player).then((result) => {
            if (result.canceled)
                return;
            const tpaRequest = listTpa[result.selection];
            const fromPlayer = getPlayerByName(tpaRequest.fromName);
            const targetPlayer = getPlayerByName(tpaRequest.targetName);
            if (tpaRequest.fromName == player.name) {
                // User Request
                if (!targetPlayer) {
                    player.sendMessage(`§r§l§e[§bTPA§e]§r §6Tidak bisa membuka permintaan. Pemain §a${tpaRequest.targetName} §6sedang nonaktif.`);
                    return;
                }
            }
            else if (tpaRequest.targetName == player.name) {
                // Target Request
                if (!fromPlayer) {
                    player.sendMessage(`§r§l§e[§bTPA§e]§r §6Tidak bisa membuka permintaan. Pemain §a${tpaRequest.fromName} §6sedang nonaktif.`);
                    return;
                }
            }
            TpaUI(fromPlayer, targetPlayer);
        });
    }
    catch (error) {
        player.sendMessage(`§r§l§e[§bTPA§e]§r §cGagal mendapatkan player aktif, silahkan hubungi admin.`);
        player.playSound("note.bass");
        showErrorToOP(viewObj(error));
    }
}
export function TPAPublicSettings(player, currentSetting) {
    let form = new ModalFormData();
    form.title(`§l§cPengaturan §2Privasi TPA`);
    form.toggle("§6Perlihatkan saya di list cari TPA §f(§cTidak§f/§aYa§f)", currentSetting);
    form.show(player).then(async (result) => {
        if (!result.canceled) {
            let canTpa = result.formValues[0];
            const resp = await MechAPI.changePublicTpa(player, canTpa);
            if (resp.status) {
                player.sendMessage(`§r§l§e[§bTPA§e]§r §eTPA di set untuk ${canTpa ? "§aPublik" : "§cPrivat"}`);
                player.playSound("random.toast");
            }
            else {
                player.sendMessage(`§r§l§e[§bTPA§e]§r §c${resp.message}`);
                player.playSound("note.bass");
            }
        }
    });
}
export async function TpaUI(fromPlayer, player) {
    const resp = await MechAPI.getRequestTpa(fromPlayer, player);
    if (!resp.status) {
        player.sendMessage(`§r§l§e[§bTPA§e]§r §c${resp.message}`);
        player.playSound("note.bass");
    }
    for (let op of getPlayersRole(["OPERATOR"])) {
        op.sendMessage(fromPlayer.name + " Meminta TP ke " + player.nameTag);
    }
    new MessageFormData()
        .title(`§l§1Teleport Request`)
        .body(`§r§lKamu mendapat permintaan teleport dari §6${fromPlayer.nameTag}§r§l untuk pergi ke lokasimu, apakah kamu ingin menerimanya?`)
        .button1("§l§cTidak, Biarkan saja.")
        .button2("§l§2Ya, tentu saja!")
        .show(player)
        .then((result) => {
        if (result.canceled && result.cancelationReason == FormCancelationReason.UserBusy) {
            // Sibuk
            player.sendMessage(`§l§6[TPA] §r§7Kamu mendapat permintaan teleport dari ${fromPlayer.nameTag}§7, silahkan cek menu TPA Tertunda untuk menerima atau menolak.`);
            return;
        }
        if (result.selection == 0) {
            // Tolak
            MechAPI.removeTpa(fromPlayer, player);
            player.sendMessage("§l§6[TPA] §cPermintaan ditolak.");
            player.playSound("note.bass");
            fromPlayer.sendMessage(`§l§6[TPA] §cMaaf, ${player.nameTag} telah menolak permintaanmu!`);
            fromPlayer.playSound("note.bass");
        }
        else if (result.selection == 1) {
            // Terima
            MechAPI.removeTpa(fromPlayer, player);
            player.removeTag("tpa:" + fromPlayer);
            player.runCommandAsync(`tp "${fromPlayer.name}" @s`);
            player.sendMessage(`§l§6[TPA] §b${fromPlayer.name} §aBerhasil di teleportasi.`);
            fromPlayer.sendMessage(`§l§6[TPA] §aDiterima, berhasil teleportasi.`);
            player.playSound("horn.call.1");
        }
    });
}
//# sourceMappingURL=tpa.js.map