import { world, system, Vector } from "@minecraft/server";
import { MenuForm } from "./menu";
import { checkRole, formatRole } from "./chatrole";
import { commands, prefix } from "./commands";
import { showScoreboard, giftPlayer, messageInfo } from "./scoreboard";
import { showErrorToOP, viewObj } from "./libs/utils";
import { Network } from "./libs/voice-net";
import MechAPI from "./libs/mechapi";
world.afterEvents.itemUse.subscribe(async (eventData) => {
    let item = eventData.itemStack;
    let player = eventData.source;
    try {
        if (item.typeId == "ms:menu_ui") {
            await MenuForm(player);
        }
    }
    catch (e) {
        showErrorToOP("Item Use Error: " + viewObj(e));
        player.sendMessage("§r§l§e[§bMECHA§e]§r §cTerdapat kesalahan, silahkan hubungi admin.");
    }
});
world.beforeEvents.chatSend.subscribe(async (msg) => {
    const message = msg.message;
    const player = msg.sender;
    try {
        const cmd = message.toLowerCase().split(/ +/g)[0] || "";
        if (cmd.startsWith(prefix)) {
            msg.cancel = true;
            commands(msg);
        }
        else {
            if (world.getDynamicProperty("textProximityChat")) {
                msg.setTargets(world
                    .getAllPlayers()
                    .filter((x) => x.dimension.id === msg.sender.dimension.id &&
                    Vector.distance(x.location, msg.sender.location) <=
                        Number(world.getDynamicProperty("textProximityDistance"))));
                msg.sendToTargets = true;
            }
            const playerRole = checkRole(player);
            const roleFormat = formatRole(player, playerRole);
            msg.cancel = true;
            const chatFormat = `${roleFormat} §3${player.name}§c: §r${message}`;
            player.runCommandAsync(`tellraw @a {"rawtext":[{"text":"${chatFormat}"}]}`);
        }
    }
    catch (e) {
        showErrorToOP("chatSend Error: " + viewObj(e));
        player.sendMessage("§r§l§e[§bMECHA§e]§r §cTerdapat kesalahan, silahkan hubungi admin.");
    }
});
world.afterEvents.entityDie.subscribe((ev) => {
    try {
        if (ev.deadEntity.typeId == "minecraft:player") {
            Network.DeadPlayers.push(ev.deadEntity.id);
        }
    }
    catch (e) {
        showErrorToOP("Entity Die Error: " + viewObj(e));
    }
});
world.afterEvents.playerSpawn.subscribe(async (ev) => {
    let player = ev.player;
    try {
        if (ev.initialSpawn) {
            player.sendMessage(`Halo §6${player.nameTag}§f Selamat datang di §aMecha§cCraft §f Gunakan perintah §b!menu §funtuk mendapatkan menu ui.`);
            MechAPI.registerUser(player);
        }
        if (ev.initialSpawn && Network.IsConnected) {
            var hasTag = ev.player.getTags().find((x) => x.includes("VCAutoBind:"));
            if (hasTag) {
                var key = hasTag.replace("VCAutoBind:", "");
                ev.player.sendMessage(`§2Koneksi Otomasi Nyala. §eMenyambung dengan kunci: ${key}`);
                Network.RequestBinding(key, ev.player);
            }
        }
        for (let i = 0; i < Network.DeadPlayers.length; i++) {
            if (Network.DeadPlayers[i] == ev.player.id) {
                Network.DeadPlayers.splice(i, 1);
            }
        }
    }
    catch (e) {
        showErrorToOP("Player Spawn Error: " + viewObj(e));
    }
});
var tickIndex = 0;
system.runInterval(() => {
    try {
        tickIndex++;
        if (tickIndex === 1) {
            world.getDimension("overworld").runCommandAsync("say §aMecha Asset Active");
            MechAPI.getConfig({});
        }
        for (let player of world.getPlayers()) {
            const playerRole = checkRole(player);
            const roleFormat = formatRole(player, playerRole);
            const nametagFormat = `${roleFormat} §3${player.name}`;
            player.nameTag = nametagFormat;
            if (tickIndex % 4 == 0) {
                showScoreboard(player, world.getTimeOfDay());
            }
            if (tickIndex % 10000 == 0) {
                messageInfo(player);
            }
            if (world.getTimeOfDay() == 0) {
                giftPlayer(player);
            }
        }
    }
    catch (e) {
        showErrorToOP(e);
    }
}, 2);
//# sourceMappingURL=main.js.map