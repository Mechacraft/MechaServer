import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";
import { showErrorToOP, viewObj } from "./libs/utils";
import MechAPI from "./libs/mechapi";
// Functions
export async function addWaypoint(player, name, isPublic) {
    return await MechAPI.addWaypoint(player, name, isPublic);
}
// Forms
export function WaypointForm(player) {
    let form = new ActionFormData();
    form.title(`§l§cMecha §2Waypoint`);
    form.body(`§6Teleportasi cepat menggunakan waypoint`);
    form.button("Tambah Waypoint", "textures/ui/village_hero_effect");
    form.button("Waypoint Saya", "textures/ui/warning_alex");
    form.button("Waypoint Publik", "textures/ui/world_glyph_color_2x.png");
    form.show(player).then((result) => {
        if (!result.canceled) {
            if (result.selection == 0)
                WaypointAddForm(player);
            if (result.selection == 1)
                WaypointSection(player);
            if (result.selection == 2)
                WaypointPublic(player);
        }
    });
}
export function WaypointAddForm(player) {
    let form = new ModalFormData()
        .title(`Tambah Waypoint`)
        .textField(`§6Nama Waypoint:`, "Masukan nama ...")
        .toggle(`§6Set untuk publik`, true);
    form.show(player).then(async (result) => {
        if (!result.canceled) {
            const [name, is_public] = result.formValues;
            let resp = await addWaypoint(player, name, is_public);
            if (resp.status) {
                player.sendMessage(`§r§l§e[§bWAYPOINT§e]§r §aBerhasil menambah waypoint §c${name} §apada §e${resp.message}`);
                player.playSound("random.toast");
            }
            else {
                player.sendMessage(`§r§l§e[§bWAYPOINT§e]§r §c${resp.message}`);
                player.playSound("note.bass");
            }
        }
    });
}
export function WaypointPublicSettings(player, waypointId, currentSetting) {
    let form = new ModalFormData();
    form.title(`§l§cPengaturan §2Waypoint`);
    form.toggle("§6Perlihatkan waypoint saya oleh §f(§aHanya Saya§f/§cSemua§f)", currentSetting);
    form.show(player).then(async (result) => {
        if (!result.canceled) {
            let aksesWp = result.formValues[0];
            const resp = await MechAPI.changePublicWaypoint(player, waypointId, aksesWp);
            if (resp.status) {
                player.sendMessage(`§r§l§e[§bWAYPOINT§e]§r §eWaypoint di set untuk ${aksesWp ? "§cSemua" : "§aHanya Saya"}`);
                player.playSound("random.toast");
            }
            else {
                player.sendMessage(`§r§l§e[§bWAYPOINT§e]§r §c${resp.message}`);
                player.playSound("note.bass");
            }
        }
    });
}
export function WaypointDelete(player, waypointId, waypointName) {
    new MessageFormData()
        .title(`§l§1Waypoint Delete`)
        .body(`§rApakah kamu yakin ingin menghapus waypoint §c§l${waypointName}§r?`)
        .button1("§l§cTidak!")
        .button2("§l§2Ya.")
        .show(player)
        .then(async (result) => {
        if (result.canceled || !result.selection) {
            return;
        }
        const resp = await MechAPI.deleteWaypoint(player, waypointId);
        if (resp.status) {
            player.sendMessage("§r§l§e[§bWAYPOINT§e]§r §aWaypoint Berhasil dihapus");
            player.playSound("random.toast");
        }
        else {
            player.sendMessage(`§r§l§e[§bWAYPOINT§e]§r §c${resp.message}`);
            player.playSound("note.bass");
        }
    });
}
export async function WaypointPublic(player) {
    try {
        let resp = await MechAPI.publicWaypoint(player);
        if (resp.status) {
            const waypoints = resp.result;
            if (waypoints.length > 0) {
                let form = new ActionFormData();
                form.title(`§l§cMecha §2Public Waypoint`);
                form.body(`§bPilih Teleportasi Waypoint`);
                for (let wpObj of waypoints) {
                    var x = Math.round(wpObj.x);
                    var y = Math.round(wpObj.y);
                    var z = Math.round(wpObj.z);
                    form.button(`§9${wpObj.name}§7 (§2${wpObj.User.name}§7)\n§l§6${x} ${y} ${z}`);
                }
                form.show(player).then(async (result) => {
                    if (!result.canceled) {
                        let wayObj = waypoints[result.selection];
                        var x = Math.round(wayObj.x);
                        var y = Math.round(wayObj.y);
                        var z = Math.round(wayObj.z);
                        player.runCommandAsync(`execute in ${wayObj.dimension} run tp @s ${x} ${y} ${z}`);
                        player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§r§l§e[§bWAYPOINT§e]§r §aKamu telah diteleportasi ke §c${wayObj.name}"}]}`);
                    }
                });
            }
            else {
                player.runCommandAsync("playsound note.bass @s");
                player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§r§l§e[§bWAYPOINT§e]§r §cMaaf, Waypoint belum tersedia, silahkan tambah terlebih dahulu."}]}`);
            }
        }
        else {
            player.sendMessage(`§r§l§e[§bWAYPOINT§e]§r §c${resp.message}`);
            player.playSound("note.bass");
        }
    }
    catch (error) {
        showErrorToOP("Waypoint Error: " + viewObj(error));
        player.sendMessage("§r§l§e[§bWAYPOINT§e]§r §cTerdapat kesalahan, silahkan hubungi admin.");
    }
}
export async function WaypointSection(player) {
    try {
        let resp = await MechAPI.selfWaypoint(player);
        if (resp.status) {
            const waypoints = resp.result;
            if (waypoints.length > 0) {
                let form = new ActionFormData();
                form.title(`§l§cMy §2Waypoint`);
                form.body(`§bPilih Teleportasi Waypoint`);
                for (let wpObj of waypoints) {
                    var x = Math.round(wpObj.x);
                    var y = Math.round(wpObj.y);
                    var z = Math.round(wpObj.z);
                    form.button(`§9${wpObj.name}\n§l§6${x} ${y} ${z}`);
                }
                form.show(player).then(async (result) => {
                    if (!result.canceled) {
                        let wayObj = waypoints[result.selection];
                        var x = Math.round(wayObj.x);
                        var y = Math.round(wayObj.y);
                        var z = Math.round(wayObj.z);
                        new ActionFormData()
                            .title(`§l§cWaypoint §2` + wayObj.name)
                            .body(`§aNama §c: §r${wayObj.name}\n§aCoor §c: ${x} ${y} ${z}`)
                            .button("§2Teleportasi")
                            .button("§6Ubah Publik")
                            .button("§4Hapus")
                            .show(player)
                            .then((result) => {
                            if (result.canceled)
                                return;
                            switch (result.selection) {
                                case 0:
                                    player.runCommandAsync(`execute in ${wayObj.dimension} run tp @s ${x} ${y} ${z}`);
                                    player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§r§l§e[§bWAYPOINT§e]§r §aKamu telah diteleportasi ke §c${wayObj.name}"}]}`);
                                    break;
                                case 1:
                                    WaypointPublicSettings(player, wayObj.id, wayObj.isPublic);
                                    break;
                                case 2:
                                    WaypointDelete(player, wayObj.id, wayObj.name);
                                    break;
                                default:
                                    break;
                            }
                        });
                    }
                });
            }
            else {
                player.runCommandAsync("playsound note.bass @s");
                player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§r§l§e[§bWAYPOINT§e]§r §cMaaf, Waypoint belum tersedia, silahkan tambah terlebih dahulu."}]}`);
            }
        }
        else {
            player.sendMessage(`§r§l§e[§bWAYPOINT§e]§r §c${resp.message}`);
            player.playSound("note.bass");
        }
    }
    catch (error) {
        showErrorToOP("Waypoint Error: " + viewObj(error));
        player.sendMessage("§r§l§e[§bWAYPOINT§e]§r §cTerdapat kesalahan, silahkan hubungi admin.");
    }
}
//# sourceMappingURL=waypoint.js.map