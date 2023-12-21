import { world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { isEmptyOrSpaces, showErrorToOP, viewObj } from "./libs/utils";
import { Network } from "./libs/voice-net";
export function VoicePageAdmin(player) {
    const bodyText = `§bStatus Server: ${Network.IsConnected ? "§aTersambung" : "§cNonaktif"} 
§bProximity Suara: ${Network.ProximityEnabled ? "§2Nyala" : "§cMati"}
§bEfek Suara: ${Network.VoiceEffectEnabled ? "§2Nyala" : "§cMati"}
§bJarak Proximity Suara: §e${Network.ProximityDistance ?? 0}
§bProximity Chat: ${world.getDynamicProperty("textProximityChat") ? "§2Nyala" : "§cMati"}
§bJarak Proximity Chat: §e${world.getDynamicProperty("textProximityDistance") ?? 1}
§bAlamat Server Proximity: §e${Network.IP ?? "-"}:${Network.Port}
-----------------------------
`;
    const VoicePage = new ActionFormData()
        .title("$aPanel Admin Pengaturan Voice World")
        .body(bodyText)
        .button("Pengaturan Server Eksternal", "textures/ui/book_edit_default.png")
        .button("Pengaturan Server Internal", "textures/ui/editIcon.png")
        .button("Pengaturan Koneksi Server Otomatis", "textures/ui/servers.png")
        .button("Pengaturan Koneksi Client", "textures/ui/icon_alex.png")
        .button("Sambungkan Voice Server", "textures/ui/player_offline_icon.png")
        .button("Sambungkan Voice Client", "textures/ui/player_online_icon.png");
    VoicePage.show(player).then((result) => {
        switch (result.selection) {
            case 0:
                externalSettings(player);
                break;
            case 1:
                internalSettings(player);
                break;
            case 2:
                autoConnectSettings(player);
                break;
            case 3:
                clientSettings(player);
                break;
            case 4:
                autoConnect(player);
                break;
            case 5:
                connectClient(player);
                break;
            default:
                break;
        }
    });
}
export function VoicePageUser(player) {
    const VoicePage = new ActionFormData()
        .title("Panel Pengaturan Voice World")
        .button("Sambungkan Voice Client", "textures/ui/player_online_icon.png")
        .button("Pengaturan Koneksi", "textures/ui/book_edit_default.png");
    VoicePage.show(player).then((result) => {
        switch (result.selection) {
            case 0:
                connectClient(player);
                break;
            case 1:
                clientSettings(player);
                break;
            default:
                break;
        }
    });
}
function clientSettings(player) {
    var ServerKey = "";
    if (player.getTags().join("|").includes("voice_key:")) {
        const KEY_OBJ = player.getTags().filter((v) => v.includes("voice_key:"))[0];
        ServerKey = KEY_OBJ.replace(/voice_key:/, "");
    }
    new ModalFormData()
        .title("Pengaturan koneksi voice")
        .textField("Kunci client", "abc123", ServerKey)
        .show(player)
        .then((results) => {
        if (results.canceled)
            return;
        const [Key] = results.formValues;
        if (isEmptyOrSpaces(Key)) {
            player.sendMessage("§r§l§e[§bVOICE§e]§r §cGagal. Kunci tidak boleh kosong!");
            return;
        }
        try {
            const keys = player.getTags().filter((v) => v.includes("voice_key:"));
            for (const row_key of keys) {
                player.removeTag(`voice_key:${row_key.replace("voice_key:", "")}`);
            }
            player.addTag(`voice_key:${Key}`);
            player.sendMessage("§r§l§e[§bVOICE§e]§r §2Berhasil menyimpan kunci client!");
        }
        catch (ex) {
            player.sendMessage("§r§l§e[§bVOICE§e]§r §cGagal menyimpan kunci client!");
            showErrorToOP(viewObj(ex));
        }
    });
}
function internalSettings(player) {
    new ModalFormData()
        .title("Pengaturan Server Internal")
        .toggle("Broadcast pemain tersambung", Boolean(world.getDynamicProperty("sendBindedMessage")))
        .toggle("Nyalakan Proximity Pesan Teks", Boolean(world.getDynamicProperty("textProximityChat")))
        .slider("Jarak Proximity Pesan Teks", 1, 60, 1, Number(world.getDynamicProperty("textProximityDistance") ?? 1))
        .show(player)
        .then((results) => {
        if (results.canceled)
            return;
        const [BB, TPC, TPCD] = results.formValues;
        world.setDynamicProperty("sendBindedMessage", BB);
        world.setDynamicProperty("textProximityChat", TPC);
        world.setDynamicProperty("textProximityDistance", TPCD);
        player.sendMessage("§r§l§e[§bVOICE§e]§r §2Berhasil menyimpan pengaturan internal server!");
    });
}
function externalSettings(player) {
    Network.ShowSettings(player);
}
function autoConnectSettings(player) {
    const IP = world.getDynamicProperty("autoConnectIP");
    var Port = world.getDynamicProperty("autoConnectPort");
    const ServerKey = world.getDynamicProperty("autoConnectServerKey");
    new ModalFormData()
        .title("Pengaturan Koneksi Otomatis")
        .textField("Alamat IP", "127.0.0.1", IP)
        .textField("Port", "9051", Port ? Port.toString() : "")
        .textField("Kunci Server", "abc123", ServerKey)
        .show(player)
        .then((results) => {
        if (results.canceled)
            return;
        const [IP, Port, Key] = results.formValues;
        const portNum = Number.parseInt(Port);
        if (isEmptyOrSpaces(IP) || isEmptyOrSpaces(Key) || isNaN(portNum) || portNum < 1025 || portNum > 65535) {
            player.sendMessage("§r§l§e[§bVOICE§e]§r §cGagal. IP atau Kunci tidak boleh kosong! Nomor Port harus diantara 1025-65535");
            return;
        }
        try {
            world.setDynamicProperty("autoConnectIP", IP);
            world.setDynamicProperty("autoConnectPort", portNum);
            world.setDynamicProperty("autoConnectServerKey", Key);
            player.sendMessage("§r§l§e[§bVOICE§e]§r §2Berhasil menyimpan pengaturan koneksi otomatis server!");
        }
        catch (ex) {
            showErrorToOP("Voice AutoConnect Settings Error: " + viewObj(ex));
            player.sendMessage("§r§l§e[§bVOICE§e]§r §cTerdapat kesalahan, silahkan hubungi admin.");
        }
    });
}
function connectServer(params) {
    Network.Connect(params.IP, params.PORT, params.Key, params.source);
}
function connectClient(player) {
    var ServerKey = "";
    if (player.getTags().join("|").includes("voice_key:")) {
        const KEY_OBJ = player.getTags().filter((v) => v.includes("voice_key:"))[0];
        ServerKey = KEY_OBJ.replace(/voice_key:/, "");
    }
    if (isEmptyOrSpaces(ServerKey)) {
        player.sendMessage("§r§l§e[§bVOICE§e]§r §cGagal. Kunci client belum dipasang di pengaturan koneksi!");
        return;
    }
    Network.RequestBinding(ServerKey, player);
}
function autoConnect(player) {
    const IP = world.getDynamicProperty("autoConnectIP");
    const Port = Number(world.getDynamicProperty("autoConnectPort"));
    const ServerKey = world.getDynamicProperty("autoConnectServerKey");
    if (isEmptyOrSpaces(IP) || isEmptyOrSpaces(ServerKey) || Port === null) {
        player.sendMessage("§r§l§e[§bVOICE§e]§r §cGagal koneksi otomatis. Pengaturan koneksi otomatis belum di persiapkan!");
        return;
    }
    Network.Connect(IP, Port, ServerKey, player);
}
//# sourceMappingURL=voice.js.map