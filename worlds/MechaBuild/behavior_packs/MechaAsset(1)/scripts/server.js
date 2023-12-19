import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { isEmptyOrSpaces, showErrorToOP, viewObj } from "./libs/utils";
import MechAPI from "./libs/mechapi";
export function ServerMenu(player) {
    const config = MechAPI.getConfig(player, true);
    new ActionFormData()
        .title(`§l§cMecha §2Server Menu`)
        .body(`§b------ §6[ Informasi Server ] §b------
            
§fAlamat IP   §c: §a${config.host ?? "-"}
§fPort         §c: §a${config.port ?? "-"}
§fKunci Auth §c: §a${config.auth ?? "-"}
§b-------------------------------`)
        .button("Tes Server")
        .button("Ubah Pengaturan")
        .show(player)
        .then((result) => {
        if (!result.canceled) {
            switch (result.selection) {
                case 0:
                    MechAPI.testServer(player);
                    break;
                case 1:
                    ServerSettings(player);
                    break;
                default:
                    break;
            }
        }
    });
}
export function ServerSettings(player) {
    const config = MechAPI.getConfig(player, true);
    new ModalFormData()
        .title("Pengaturan Server Mecha")
        .textField("Alamat IP", "127.0.0.1", config.host)
        .textField("Port", "9052", config.port)
        .textField("Auth", "mechxxxx", config.auth)
        .show(player)
        .then((results) => {
        if (results.canceled)
            return;
        const [IP, PORT, AUTH] = results.formValues;
        const portNum = Number.parseInt(PORT);
        if (isEmptyOrSpaces(IP) ||
            isEmptyOrSpaces(PORT) ||
            isEmptyOrSpaces(AUTH) ||
            isNaN(portNum) ||
            portNum < 1025 ||
            portNum > 65535) {
            player.sendMessage("§r§l§e[§bSERVER§e]§r §cGagal. IP Port dan Auth tidak boleh kosong! Nomor Port harus diantara 1025-65535");
            return;
        }
        try {
            MechAPI.setConfig(AUTH, IP, PORT);
            player.sendMessage("§r§l§e[§bSERVER§e]§r §aBerhasil menyimpan pengaturan server mecha!");
        }
        catch (ex) {
            showErrorToOP("Server Setting Error: " + viewObj(ex));
            player.sendMessage("§r§l§e[§bMECHA§e]§r §cTerdapat kesalahan, silahkan hubungi operator.");
        }
    });
}
//# sourceMappingURL=server.js.map