import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { showErrorToOP, viewObj, } from "./libs/utils";
import MechAPI from "./libs/mechapi";
export async function WarpForm(player) {
    let form = new ActionFormData();
    form.title(`§l§cMecha §2Warp`);
    form.button("Tambah TP Point", "textures/ui/color_plus");
    form.button("Lihat Tempat", "textures/ui/glyph_world_template");
    form.button("Edit Tempat", "textures/ui/pencil_edit_icon");
    form.show(player).then((result) => {
        if (!result.canceled) {
            if (result.selection == 0)
                WarpCreate(player);
            if (result.selection == 1)
                WarpList(player);
            if (result.selection == 2)
                WarpUpdateList(player);
        }
    });
}
export function WarpCreate(player) {
    let form = new ModalFormData()
        .title(`Tambah Warp`)
        .textField(`§6Nama:`, "Masukan nama ...")
        .textField(`§6Texture:`, "Masukan texture ...")
        .textField(`§6Gamemode:`, "Masukan gamemode (creative/survival/adventure)", "survival")
        .toggle(`§6Aktifkan`, true);
    form.show(player).then(async (result) => {
        if (!result.canceled) {
            const [name, texture, gamemode, active] = result.formValues;
            if (!["a", "c", "d", "s", "adventure", "creative", "default", "spectator", "survival"].includes(gamemode)) {
                player.sendMessage(`§r§l§e[§bWARP§e]§r §cGamemode §6${gamemode} §ctidak valid.`);
                player.playSound("note.bass");
                return;
            }
            let resp = await MechAPI.setWarpPoint(player, name, texture ?? "", gamemode, active);
            if (!resp.status) {
                player.sendMessage(`§r§l§e[§bWARP§e]§r §c${resp.message}`);
                player.playSound("note.bass");
                return;
            }
            player.sendMessage(`§r§l§e[§bWARP§e]§r §aBerhasil menambah warp §c${name}`);
            player.playSound("random.toast");
        }
    });
}
export async function WarpList(player) {
    try {
        let form = new ActionFormData();
        form.title(`§l§4Warp§2Point`);
        form.body(`§6Pilih tempat untuk teleportasi.`);
        let resp = await MechAPI.getWarpPoint(player);
        if (!resp.status) {
            player.sendMessage(`§r§l§e[§bWARP§e]§r §c${resp.message}`);
            player.playSound("note.bass");
            return;
        }
        const warp_list = resp.result;
        if (warp_list.length == 0) {
            player.sendMessage(`§r§l§e[§bWARP§e]§r §6Warp belum tersedia untuk saat ini.`);
            player.playSound("note.bass");
            return;
        }
        for (const warp of warp_list) {
            form.button(warp.name, warp.texture);
        }
        form.show(player).then(async (result) => {
            if (result.canceled)
                return;
            const targetWarp = warp_list[result.selection];
            player.runCommandAsync(`tp @s ${targetWarp.x} ${targetWarp.y} ${targetWarp.z}`);
            player.runCommandAsync(`gamemode ${targetWarp.gamemode}`);
            player.sendMessage(`§r§l§e[§bWARP§e]§r §aBerhasil di teleportasi ke §c${targetWarp.name}.`);
            player.playSound("horn.call.1");
        });
    }
    catch (error) {
        player.sendMessage(`§r§l§e[§bWARP§e]§r §cGagal mendapatkan daftar warp, silahkan hubungi admin.`);
        player.playSound("note.bass");
        showErrorToOP(viewObj(error));
    }
}
export async function WarpUpdateList(player) {
    try {
        let form = new ActionFormData();
        form.title(`§l§4Warp§2Point`);
        form.body(`§6Pilih tempat untuk mengubah.`);
        let resp = await MechAPI.getWarpPoint(player);
        if (!resp.status) {
            player.sendMessage(`§r§l§e[§bWARP§e]§r §c${resp.message}`);
            player.playSound("note.bass");
            return;
        }
        const warp_list = resp.result;
        if (warp_list.length == 0) {
            player.sendMessage(`§r§l§e[§bWARP§e]§r §6Warp belum tersedia untuk saat ini.`);
            player.playSound("note.bass");
            return;
        }
        for (const warp of warp_list) {
            form.button(warp.name, warp.texture);
        }
        form.show(player).then(async (result) => {
            if (result.canceled)
                return;
            const targetWarp = warp_list[result.selection];
            WarpUpdate(player, targetWarp);
        });
    }
    catch (error) {
        player.sendMessage(`§r§l§e[§bWARP§e]§r §cGagal mendapatkan daftar warp, silahkan hubungi admin.`);
        player.playSound("note.bass");
        showErrorToOP(viewObj(error));
    }
}
export function WarpUpdate(player, warp) {
    let form = new ModalFormData()
        .title(`Tambah Warp`)
        .textField(`§6Nama:`, "Masukan nama ...", warp.name)
        .textField(`§6Texture:`, "Masukan texture ...", warp.texture)
        .textField(`§6Gamemode:`, "Masukan gamemode (creative/survival/adventure)", warp.gamemode)
        .toggle(`§6Set ulang posisi`, false)
        .toggle(`§6Aktifkan`, warp.active);
    form.show(player).then(async (result) => {
        if (!result.canceled) {
            const [name, texture, gamemode, is_update_coor, active] = result.formValues;
            if (!["a", "c", "d", "s", "adventure", "creative", "default", "spectator", "survival"].includes(gamemode)) {
                player.sendMessage(`§r§l§e[§bWARP§e]§r §cGamemode §6${gamemode} §ctidak valid.`);
                player.playSound("note.bass");
                return;
            }
            let resp = await MechAPI.updateWarpPoint(player, warp.id, name, texture ?? "", gamemode, is_update_coor, active);
            if (!resp.status) {
                player.sendMessage(`§r§l§e[§bWARP§e]§r §c${resp.message}`);
                player.playSound("note.bass");
                return;
            }
            player.sendMessage(`§r§l§e[§bWARP§e]§r §aBerhasil mengubah warp §c${name}`);
            player.playSound("random.toast");
        }
    });
}
//# sourceMappingURL=warp.js.map