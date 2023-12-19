import { world } from "@minecraft/server";
import * as mcnet from "@minecraft/server-net";
import { isEmptyOrSpaces, serialize, showErrorToOP, viewObj } from "./utils";
import { MessageFormData } from "@minecraft/server-ui";
import { changeRole } from "../chatrole";
import { removeGuildTag } from "../guild";
class MechAPI {
    static setConfig(auth, host, port) {
        world.setDynamicProperty("mechaServerAuth", auth);
        world.setDynamicProperty("mechaServerHost", host);
        world.setDynamicProperty("mechaServerPort", port);
    }
    static getConfig(player, ignore = false) {
        const host = world.getDynamicProperty("mechaServerHost")?.toString();
        const port = world.getDynamicProperty("mechaServerPort")?.toString();
        const auth = world.getDynamicProperty("mechaServerAuth")?.toString();
        const defaultHost = "127.0.0.1";
        const defaultPort = "9052";
        const defaultAuth = "mechacraft@2024";
        if (isEmptyOrSpaces(host)) {
            world.setDynamicProperty("mechaServerHost", defaultHost);
        }
        if (isEmptyOrSpaces(port)) {
            world.setDynamicProperty("mechaServerPort", defaultPort);
        }
        if (isEmptyOrSpaces(auth)) {
            world.setDynamicProperty("mechaServerAuth", defaultAuth);
        }
        return {
            auth,
            host,
            port,
            baseurl: `http://${host}:${port}`,
        };
    }
    static async getRequest(player, endpoint = "") {
        return new Promise((resolve, reject) => {
            const config = this.getConfig(player);
            const req = new mcnet.HttpRequest(config.baseurl + endpoint);
            req.method = mcnet.HttpRequestMethod.Get;
            req.headers = [
                new mcnet.HttpHeader("Content-Type", "application/json"),
                new mcnet.HttpHeader("auth", config.auth),
            ];
            mcnet.http.request(req).then(resolve).catch(reject);
        });
    }
    static async postRequest(player, endpoint = "", data = {}) {
        return new Promise((resolve, reject) => {
            const config = this.getConfig(player);
            const req = new mcnet.HttpRequest(config.baseurl + endpoint);
            req.body = JSON.stringify(data);
            req.method = mcnet.HttpRequestMethod.Post;
            req.headers = [
                new mcnet.HttpHeader("Content-Type", "application/json"),
                new mcnet.HttpHeader("auth", config.auth),
            ];
            mcnet.http.request(req).then(resolve).catch(reject);
        });
    }
    static async putRequest(player, endpoint = "", data = {}) {
        return new Promise((resolve, reject) => {
            const config = this.getConfig(player);
            const req = new mcnet.HttpRequest(config.baseurl + endpoint);
            req.body = JSON.stringify(data);
            req.method = mcnet.HttpRequestMethod.Put;
            req.headers = [
                new mcnet.HttpHeader("Content-Type", "application/json"),
                new mcnet.HttpHeader("auth", config.auth),
            ];
            mcnet.http.request(req).then(resolve).catch(reject);
        });
    }
    static async deleteRequest(player, endpoint = "", data = {}) {
        return new Promise((resolve, reject) => {
            const config = this.getConfig(player);
            const req = new mcnet.HttpRequest(config.baseurl + endpoint);
            req.body = JSON.stringify(data);
            req.method = mcnet.HttpRequestMethod.Delete;
            req.headers = [
                new mcnet.HttpHeader("Content-Type", "application/json"),
                new mcnet.HttpHeader("auth", config.auth),
            ];
            mcnet.http.request(req).then(resolve).catch(reject);
        });
    }
    static async testServer(player) {
        this.getRequest(player)
            .then((response) => {
            new MessageFormData()
                .title(`§l§1Server Test`)
                .body(viewObj(response))
                .button1("§l§2Done")
                .button2("§l§cClose")
                .show(player);
        })
            .catch((err) => {
            new MessageFormData()
                .title(`§l§1Server Test §l§cFailed`)
                .body(viewObj(JSON.parse(err)))
                .button1("§l§2Done")
                .button2("§l§cClose")
                .show(player);
        });
    }
    // USERS
    static async getUsers(player) {
        const response = await this.getRequest(player, "/api/v1/users");
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal mendapatkan player" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mendapatkan player" };
        }
    }
    static async getUser(player) {
        const response = await this.getRequest(player, "/api/v1/user/" + player.id);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal mendapatkan player" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mendapatkan player" };
        }
    }
    static registerUser(player) {
        const data = { xuid: player.id, name: player.name };
        this.postRequest(player, "/api/v1/user", data)
            .then((response) => {
            if (response.status == 200) {
                const resp = JSON.parse(response.body);
                changeRole(player, resp.result.role);
                if (!resp.result.guildId)
                    removeGuildTag(player);
            }
            else {
                showErrorToOP("Galat:" + viewObj(response));
            }
        })
            .catch((e) => {
            showErrorToOP(viewObj(e));
        });
    }
    static changeRole(player, role) {
        const data = { xuid: player.id, role };
        this.putRequest(player, "/api/v1/user", data)
            .then((response) => {
            if (response.status == 200) {
                const resp = JSON.parse(response.body);
            }
            else {
                showErrorToOP("Galat:" + viewObj(response));
            }
        })
            .catch((e) => {
            showErrorToOP(viewObj(e));
        });
    }
    // WAYPOINTS
    static async publicWaypoint(player) {
        const response = await this.getRequest(player, "/api/v1/waypoints");
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal mendapatkan waypoint" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mendapatkan waypoint" };
        }
    }
    static async selfWaypoint(player) {
        const response = await this.getRequest(player, "/api/v1/waypoint/" + player.id);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal mendapatkan waypoint" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mendapatkan waypoint" };
        }
    }
    static async addWaypoint(player, name, isPublic) {
        let dimension = player.dimension.id.replace("minecraft:", "");
        const x = player.location.x;
        const y = player.location.y;
        const z = player.location.z;
        const data = {
            ownerId: player.id,
            name,
            x,
            y,
            z,
            dimension,
            isPublic,
        };
        const response = await this.postRequest(player, "/api/v1/waypoint", data);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, message: `${Math.round(x)} ${Math.round(y)} ${Math.round(z)}` };
            }
            else if (resp.code == 1001) {
                return { status: false, message: "Waypoint dengan nama " + name + " sudah ada." };
            }
            else {
                return { status: false, message: "Gagal menambah waypoint" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal menambah waypoint" };
        }
    }
    static async changePublicWaypoint(player, waypointId, isPublic) {
        const data = { id: waypointId, isPublic };
        const response = await this.putRequest(player, "/api/v1/waypoint", data);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal mengubah waypoint" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mengubah waypoint" };
        }
    }
    static async deleteWaypoint(player, waypointId) {
        const response = await this.deleteRequest(player, "/api/v1/waypoint/" + waypointId);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal menghapus waypoint" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal menghapus waypoint" };
        }
    }
    // TPA
    static async changePublicTpa(player, canTpa) {
        const data = { xuid: player.id, canTpa };
        const response = await this.putRequest(player, "/api/v1/user", data);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal mengubah status TPA" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mengubah status TPA" };
        }
    }
    static async requestTpa(fromPlayer, targetPlayer) {
        const data = {
            fromName: fromPlayer.name,
            targetName: targetPlayer.name,
        };
        const response = await this.postRequest(fromPlayer, "/api/v1/tpa", data);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal membuat permintaan TPA" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal membuat permintaan TPA" };
        }
    }
    static async removeTpa(fromPlayer, targetPlayer) {
        const data = {
            fromName: fromPlayer.name,
            targetName: targetPlayer.name,
        };
        const response = await this.deleteRequest(fromPlayer, "/api/v1/tpa", data);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal menghapus permintaan TPA" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal menghapus permintaan TPA" };
        }
    }
    static async getRequestTpa(fromPlayer, targetPlayer) {
        const params = serialize({
            fromName: fromPlayer.name,
            targetName: targetPlayer.name,
        });
        const response = await this.getRequest(fromPlayer, "/api/v1/tpa/request?" + params);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal mengambil data permintaan TPA" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mengambil data permintaan TPA" };
        }
    }
    static async getListTpa(player) {
        const params = serialize({ name: player.name });
        const response = await this.getRequest(player, "/api/v1/tpa/list?" + params);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal mengambil data TPA" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mengambil data TPA" };
        }
    }
    // SHOP
    static async getShopCategory(player) {
        const response = await this.getRequest(player, "/api/v1/shop/category");
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal mengambil data kategori toko" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mengambil data kategori toko" };
        }
    }
    static async getShopItems(player, categoryID) {
        const params = serialize({ category: categoryID });
        const response = await this.getRequest(player, "/api/v1/shop/items?" + params);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal mengambil data item toko" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mengambil data item toko" };
        }
    }
    static async getShopItem(player, itemID) {
        const response = await this.getRequest(player, "/api/v1/shop/item/" + itemID);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal mengambil data item toko" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mengambil data item toko" };
        }
    }
    static async getExpItem(player) {
        const response = await this.getRequest(player, "/api/v1/shop/item/exp");
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal mengambil data item toko" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mengambil data item toko" };
        }
    }
    static async buyItem(player, itemID, qty) {
        const data = {
            xuid: player.id,
            itemId: itemID,
            qty: Number(qty),
        };
        const response = await this.postRequest(player, "/api/v1/shop/buy", data);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else if (resp.code == 1002) {
                return { status: false, message: "Item tidak ada" };
            }
            else if (resp.code == 1003) {
                return { status: false, message: "Uang tidak cukup", not_enough_money: true };
            }
            else {
                return { status: false, message: "Gagal mengambil data item toko" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mengambil data item toko" };
        }
    }
    static async sellItem(player, itemID, qty) {
        const data = {
            xuid: player.id,
            itemId: itemID,
            qty: Number(qty),
        };
        const response = await this.postRequest(player, "/api/v1/shop/sell", data);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else if (resp.code == 1002) {
                return { status: false, message: "Item tidak ada" };
            }
            else if (resp.code == 1003) {
                return { status: false, message: "Uang tidak cukup", not_sell: true };
            }
            else {
                return { status: false, message: "Gagal mengambil data item toko" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mengambil data item toko" };
        }
    }
    static async transfer(player, targetPlayerID, amount) {
        const data = {
            xuid: player.id,
            targetXuid: targetPlayerID,
            amount: Number(amount),
        };
        const response = await this.postRequest(player, "/api/v1/transaction/transfer", data);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else if (resp.code == 1002) {
                return { status: false, message: "Target pemain tidak ada" };
            }
            else if (resp.code == 1003) {
                return { status: false, message: "Uang tidak cukup", not_enough_money: true };
            }
            else {
                return { status: false, message: "Gagal transfer uang" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal transfer uang" };
        }
    }
    // GUILD
    static async getGuildMemberCost(player) {
        const response = await this.getRequest(player, "/api/v1/guild/cost_member");
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal mengambil data biaya member" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mengambil data biaya member" };
        }
    }
    static async getPublicGuilds(player) {
        const response = await this.getRequest(player, "/api/v1/guilds");
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal mengambil data guild publik" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mengambil data guild publik" };
        }
    }
    static async getGuild(player, guildId) {
        const response = await this.getRequest(player, "/api/v1/guild/" + guildId);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal mengambil data guild" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mengambil data guild" };
        }
    }
    static async createGuild(player, name, description, maxMember, isPublic) {
        const data = {
            xuid: player.id,
            name,
            description,
            maxMember: Number(maxMember),
            isPublic,
        };
        const response = await this.postRequest(player, "/api/v1/guild/create", data);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else if (resp.code == 1001) {
                return { status: false, message: "Uang tidak cukup", not_enough_money: true };
            }
            else if (resp.code == 1002) {
                return { status: false, message: "Kamu masih mempunyai guild" };
            }
            else if (resp.code == 1003) {
                return { status: false, message: "Nama guild '" + name + "' sudah ada." };
            }
            else if (resp.code == 1004) {
                return { status: false, message: "Nama guild maksimal 15 karakter." };
            }
            else {
                return { status: false, message: "Gagal membuat guild" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal membuat guild" };
        }
    }
    static async updateGuild(player, name, description, maxMember, isPublic) {
        const data = {
            xuid: player.id,
            name,
            description,
            maxMember: Number(maxMember),
            isPublic,
        };
        const response = await this.putRequest(player, "/api/v1/guild", data);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else if (resp.code == 1001) {
                return { status: false, message: "User tidak tersedia" };
            }
            else if (resp.code == 1002) {
                return { status: false, message: "Kamu tidak mempunyai guild" };
            }
            else if (resp.code == 1003) {
                return { status: false, message: "Kamu tidak mempunyai akses untuk mengubah guild" };
            }
            else if (resp.code == 1004) {
                return { status: false, message: "Uang tidak cukup", not_enough_money: true };
            }
            else if (resp.code == 1005) {
                return { status: false, message: "Gagal mengubah jumlah member", failed_update_member: true };
            }
            else if (resp.code == 1006) {
                return { status: false, message: "Nama guild maksimal 15 karakter." };
            }
            else {
                return { status: false, message: "Gagal mengubah guild" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal mengubah guild" };
        }
    }
    static async promoteMemberGuild(player, guild, member, role) {
        const data = {
            xuid: member.xuid,
            guildId: guild.guildId,
            role,
        };
        const response = await this.postRequest(player, "/api/v1/guild/promote", data);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else if (resp.code == 1002) {
                return { status: false, message: "Role LEADER tidak bisa diubah!" };
            }
            else {
                return { status: false, message: "Gagal promosi guild" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal promosi guild" };
        }
    }
    static async joinGuild(player, guildId) {
        const data = {
            xuid: player.id,
            guildId: Number(guildId),
        };
        const response = await this.postRequest(player, "/api/v1/guild/join", data);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else if (resp.code == 1001) {
                return { status: false, message: "Kamu masih memiliki guild" };
            }
            else if (resp.code == 1002) {
                return { status: false, message: "Tidak bisa bergabung, guild ini sudah penuh." };
            }
            else {
                return { status: false, message: "Gagal memasuki guild" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal memasuki guild" };
        }
    }
    static async leaveGuild(player, guildId) {
        const data = {
            xuid: player.xuid,
            guildId: Number(guildId),
        };
        const response = await this.postRequest(player, "/api/v1/guild/leave", data);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else if (resp.code == 1001) {
                return { status: false, message: "User tidak tersedia" };
            }
            else if (resp.code == 1002) {
                return { status: false, message: "Gagal keluar. Kamu tidak memiliki guild." };
            }
            else if (resp.code == 1003) {
                return { status: false, message: "Pemilik tidak bisa keluar guild, tapi bisa menghapusnya." };
            }
            else {
                return { status: false, message: "Gagal keluar guild" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal keluar guild" };
        }
    }
    static async deleteGuild(player) {
        const data = {
            xuid: player.id,
        };
        const response = await this.deleteRequest(player, "/api/v1/guild/delete", data);
        if (response.status == 200) {
            const resp = JSON.parse(response.body);
            if (resp.code == 200) {
                return { status: true, result: resp.result };
            }
            else {
                return { status: false, message: "Gagal menghapus guild" };
            }
        }
        else {
            showErrorToOP("Galat:" + viewObj(response));
            return { status: false, message: "Gagal menghapus guild" };
        }
    }
}
export default MechAPI;
//# sourceMappingURL=mechapi.js.map