import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { getPlayerByName, showErrorToOP, viewObj } from "./libs/utils";
import MechAPI from "./libs/mechapi";
export async function ShopUI(player) {
    const shopui = new ActionFormData();
    shopui.title(`§l§cMecha §bOfficial §6Shop`);
    const resp = await MechAPI.getShopCategory(player);
    if (!resp.status) {
        player.sendMessage(`§r§l§e[§SHOP§e]§r §c${resp.message}`);
        player.playSound("note.bass");
    }
    const categories = resp.result;
    if (categories.length == 0) {
        player.sendMessage(`§r§l§e[§SHOP§e]§r §6Toko ini belum mempunyai barang yang dijual, silahkan hubungi admin.`);
        player.playSound("note.bass");
    }
    for (const category of categories) {
        shopui.button(category.name, category.texture);
    }
    shopui.show(player).then((result) => {
        if (result.canceled)
            return;
        const category = categories[result.selection];
        if (["ITEM", "ENCHANT"].includes(category.type)) {
            shopItem(player, category.categoryID);
        }
        else if (category.type == "TRANSFER") {
            Transfer(player);
        }
        else if (category.type == "EXP") {
            EXP(player, { itemId: category.categoryID });
        }
    });
}
export async function itemCatalog(player, itemID) {
    const resp_user = await MechAPI.getUser(player);
    if (!resp_user.status) {
        player.sendMessage(`§r§l§e[§MECHA§e]§r §c${resp_user.message}`);
        player.playSound("note.bass");
        return;
    }
    const resp_item = await MechAPI.getShopItem(player, itemID);
    if (!resp_item.status) {
        player.sendMessage(`§r§l§e[§SHOP§e]§r §c${resp_item.message}`);
        player.playSound("note.bass");
        return;
    }
    const user = resp_user.result;
    const item = resp_item.result;
    const isSellExist = item.sell > 0;
    let modal = new ModalFormData();
    modal.title(`${item.name}`);
    modal.textField(`§a-------------------------------\n\n§6Informasi Pemain:\n§fNama: §b${player.nameTag}\n§fUang: §b${user.money}\n\n§6Informasi barang:\n§fBeli  x1 §b${item.name} §f= §a${item.cost}\n§fJual x1 §b${item.name} §f= §a${item.sell}\n\n§a-------------------------------\n\n§fJumlah:`, `Jumlah yang ingin dibeli ${isSellExist ? "atau dijual" : ""}`);
    if (isSellExist) {
        modal.toggle("§f(§cJual§f/§aBeli§f)", true);
    }
    modal.show(player).then(async (res) => {
        if (res.canceled)
            return;
        if (!res.formValues[0])
            return ((await player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§cMasukan jumlah item yang akan dibeli ${isSellExist ? "atau dijual" : ""}"}]}`)) && player.runCommandAsync(`playsound note.bass @s`));
        let qty = res.formValues[0];
        if (isNaN(qty))
            return ((await player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§cKamu hanya bisa memasukan jumlah item memakai angka"}]}`)) && player.runCommandAsync(`playsound note.bass @s`));
        let dataCost = item.cost * qty;
        if ((isSellExist && res.formValues[1]) || !isSellExist) {
            const resp_buy = await MechAPI.buyItem(player, item.itemId, qty);
            if (!resp_buy.status) {
                if (resp_buy.not_enough_money) {
                    player.sendMessage(`§r§l§c[§bSHOP§c]§r §cUang kamu saat ini §e${user.money} tidak cukup untuk membeli, butuh §e${dataCost}`);
                }
                else {
                    player.sendMessage(`§r§l§e[§SHOP§e]§r §c${resp_buy.message}`);
                }
                player.playSound("note.bass");
                return;
            }
            player.runCommandAsync(`give @s ${item.item} ${qty} ${item.data}`);
            player.sendMessage(`§r§l§c[§bSHOP§c]§r §aKamu berhasil membeli §cx${qty} §b${item.name} §aDengan total: §e${dataCost}`);
            player.playSound("random.levelup");
        }
        else {
            let dataSell = item.sell * qty;
            let action = await player.runCommandAsync(`clear @s[hasitem={item=${item.item},quantity=${qty}..}] ${item.item} ${item.data} ${qty}`);
            if (action.successCount == 0) {
                player.sendMessage(`§r§l§c[§bSHOP§c]§r §cKamu tidak bisa menjual §ex${qty} §b${item.name} §cKarena tidak cukup atau barang tidak ada.`);
                player.playSound(`note.bass`);
                return;
            }
            const resp_sell = await MechAPI.sellItem(player, item.itemId, qty);
            if (!resp_sell.status) {
                if (resp_sell.not_sell) {
                    player.sendMessage(`§r§l§c[§bSHOP§c]§r §cBarang ini tidak untuk dijual`);
                }
                else {
                    player.sendMessage(`§r§l§e[§SHOP§e]§r §c${resp_sell.message}`);
                }
                player.playSound("note.bass");
                return;
            }
            player.sendMessage(`§r§l§c[§bSHOP§c]§r §aKamu berhasil menjual §cx${qty} §b${item.name} §aDengan total: §e${dataSell}`);
            player.playSound(`random.levelup`);
        }
    });
}
export async function enchantCatalog(player, itemID) {
    const resp_user = await MechAPI.getUser(player);
    if (!resp_user.status) {
        player.sendMessage(`§r§l§e[§MECHA§e]§r §c${resp_user.message}`);
        player.playSound("note.bass");
        return;
    }
    const resp_item = await MechAPI.getShopItem(player, itemID);
    if (!resp_item.status) {
        player.sendMessage(`§r§l§e[§SHOP§e]§r §c${resp_item.message}`);
        player.playSound("note.bass");
        return;
    }
    const user = resp_user.result;
    const item = resp_item.result;
    let modal = new ModalFormData();
    modal.title(`${item.name}`);
    modal.textField(`§a-------------------------------\n\n§6Informasi Pemain:\n§fNama: §b${player.nameTag}\n§fUang: §b${user.money}\n\nNote:\n§6Pastikan anda telah memegang item\n\n§a-------------------------------\n\n§fLevel (max: ${item.maxLevel})`, `Masukan level enchant`);
    modal.show(player).then(async (res) => {
        if (res.canceled)
            return;
        // const inven = getPlayerInventory(player);
        // player.sendMessage(viewObj(inven));
        // return;
        if (!res.formValues[0]) {
            player.sendMessage(`§r§l§c[§bSHOP§c]§r  §cMasukan level enchant`);
            player.playSound(`note.bass`);
            return;
        }
        let level = res.formValues[0];
        if (isNaN(level)) {
            player.sendMessage(`§r§l§c[§bSHOP§c]§r §cKamu hanya bisa memasukan level memakai angka`);
            player.playSound(`note.bass`);
            return;
        }
        if (level > item.maxLevel) {
            player.sendMessage(`§r§l§c[§bSHOP§c]§r §cLevel maksimal adalah §a${item.maxLevel}.`);
            player.playSound(`note.bass`);
            return;
        }
        let dataCost = item.cost * level;
        const resp_buy = await MechAPI.buyItem(player, item.itemId, level);
        if (!resp_buy.status) {
            if (resp_buy.not_enough_money) {
                player.sendMessage(`§r§l§c[§bSHOP§c]§r §cUang kamu saat ini §e${user.money} tidak cukup untuk membeli, butuh §e${dataCost}`);
            }
            else {
                player.sendMessage(`§r§l§e[§SHOP§e]§r §c${resp_buy.message}`);
            }
            player.playSound("note.bass");
            return;
        }
        /* TODO:
        - [ ] Get Inventory
        - [ ] Use select Item
        - [ ] Enchant to used item (compatible needed)
        */
        const result = await player.runCommandAsync(`enchant @s ${item.enchant} ${level}`);
        player.sendMessage(viewObj(result));
        player.sendMessage(`§r§l§c[§bSHOP§c]§r §aKamu berhasil membeli enchant §b${item.name} §alevel §c${level} §aDengan total: §e${dataCost}`);
        player.playSound("random.levelup");
    });
}
export async function shopItem(player, categoryID) {
    const itemui = new ActionFormData();
    itemui.title(`§l§cMecha §bOfficial §6Shop`);
    const resp = await MechAPI.getShopItems(player, categoryID);
    if (!resp.status) {
        player.sendMessage(`§r§l§e[§SHOP§e]§r §c${resp.message}`);
        player.playSound("note.bass");
    }
    const items = resp.result;
    if (items.length == 0) {
        player.sendMessage(`§r§l§e[§SHOP§e]§r §6Barang untuk kategori ini tidak tersedia`);
        player.playSound("note.bass");
    }
    for (const item of items) {
        itemui.button(item.name, item.texture);
    }
    itemui.show(player).then((result) => {
        if (result.canceled)
            return;
        const item = items[result.selection];
        if (!item.enchant) {
            itemCatalog(player, item.itemId);
        }
        else {
            enchantCatalog(player, item.itemId);
        }
    });
}
export async function Transfer(player) {
    const resp_user = await MechAPI.getUser(player);
    if (!resp_user.status) {
        player.sendMessage(`§r§l§e[§MECHA§e]§r §c${resp_user.message}`);
        player.playSound("note.bass");
        return;
    }
    const resp_users = await MechAPI.getUsers(player);
    if (!resp_user.status) {
        player.sendMessage(`§r§l§e[§MECHA§e]§r §c${resp_user.message}`);
        player.playSound("note.bass");
        return;
    }
    const user = resp_user.result;
    const users = resp_users.result;
    let brick = new ModalFormData()
        .title(`Transfer Uang`)
        .textField(`§a-------------------------------\n\n§6Informasi Pemain:\n§fNama: §b${player.nameTag}\n§fUang: §a${user.money}\n\n§a-------------------------------\n\n§6Nama Pemain:`, `Masukan tujuan nama transfer`)
        .textField("§6Jumlah:", "Jumlah uang yang akan di transfer");
    brick.show(player).then(async (res) => {
        if (res.canceled)
            return;
        if (!res.formValues[0])
            return ((await player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§r§l§c[§bTRANSFER§c]§r §cMasukan nama tujuan!"}]}`)) && player.runCommandAsync(`playsound note.bass @s`));
        if (!res.formValues[1])
            return ((await player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§r§l§c[§bTRANSFER§c]§r §cMasukan jumlah uang yang akan ditransfer"}]}`)) && player.runCommandAsync(`playsound note.bass @s`));
        let amount = res.formValues[1];
        if (isNaN(amount))
            return ((await player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§r§l§c[§bTRANSFER§c]§r §cHanya bisa input angka!"}]}`)) && player.runCommandAsync(`playsound note.bass @s`));
        let playerName = res.formValues[0];
        const targetUser = users.filter((v) => v.name == playerName)[0];
        if (!targetUser) {
            player.sendMessage(`§r§l§c[§bTRANSFER§c]§r §cPemain dengan nama §e${playerName} §ctidak ditemukan.`);
            player.playSound("note.bass");
            return;
        }
        const resp_sell = await MechAPI.transfer(player, targetUser.name, amount);
        if (!resp_sell.status) {
            if (resp_sell.not_enough_money) {
                player.sendMessage(`§r§l§c[§bTRANSFER§c]§r §cUang kamu saat ini §e${user.money} tidak cukup untuk transfer.`);
            }
            else {
                player.sendMessage(`§r§l§e[§TRANSFER§e]§r §c${resp_sell.message}`);
            }
            player.playSound("note.bass");
            return;
        }
        player.sendMessage(`§r§l§c[§bTRANSFER§c]§r §aBerhasil transfer ke §e${playerName} §asebanyak §e${amount}`);
        player.playSound(`random.toast`);
        const targetPlayer = getPlayerByName(targetUser.name);
        if (targetPlayer) {
            targetPlayer.sendMessage(`§r§l§c[§bTRANSFER§c]§r §aAnda telah ditransfer oleh §e${player.nameTag} §asebanyak §e${amount}`);
            targetPlayer.playSound(`random.toast`);
        }
    });
}
export async function EXP(player, item) {
    const resp_user = await MechAPI.getUser(player);
    if (!resp_user.status) {
        player.sendMessage(`§r§l§e[§MECHA§e]§r §c${resp_user.message}`);
        player.playSound("note.bass");
        return;
    }
    const user = resp_user.result;
    const resp_exp = await MechAPI.getExpItem(player);
    if (!resp_exp.status) {
        player.sendMessage(`§r§l§e[§MECHA§e]§r §c${resp_exp.message}`);
        player.playSound("note.bass");
        return;
    }
    const exp = resp_exp.result;
    let buyCost = exp.cost;
    let brick = new ModalFormData()
        .title(`Beli Level Exp`)
        .textField(`§6-------------------------------\n\nInformasi Pemain:\nNama: §b${player.nameTag}\n§6Uang: §b${user.money}\n\n§6Item Information:\n§6Buy x1 §bEXP Level §6= §c${buyCost}\n\n§6-------------------------------\n\n§6Jumlah EXP:`, `Masukan jumlah Exp Level`);
    brick.show(player).then(async (res) => {
        if (!res.formValues[0]) {
            player.sendMessage(`§r§l§c[§bSHOP§c]§r §cMasukan username tujuan!`);
            player.playSound(`note.bass`);
            return;
        }
        if (!res.formValues[0]) {
            player.sendMessage(`§r§l§c[§bSHOP§c]§r §cMasukan jumlah uang yang akan ditransfer`);
            player.playSound(`note.bass`);
            return;
        }
        let qty = res.formValues[0];
        if (isNaN(qty)) {
            player.sendMessage(`§r§l§c[§bSHOP§c]§r §cHanya bisa input angka!`);
            player.playSound(`note.bass`);
        }
        let level = Number(res.formValues[0]);
        let dataCost = level * buyCost;
        try {
            const resp_buy = await MechAPI.buyItem(player, exp.itemId, qty);
            if (!resp_buy.status) {
                if (resp_buy.not_enough_money) {
                    player.sendMessage(`§r§l§c[§bSHOP§c]§r §cUang kamu saat ini §e${user.money} tidak cukup untuk membeli, butuh §e${dataCost}`);
                }
                else {
                    player.sendMessage(`§r§l§e[§SHOP§e]§r §c${resp_buy.message}`);
                }
                player.playSound("note.bass");
                return;
            }
            player.runCommandAsync(`xp ${level}L @s`);
            player.sendMessage(`§r§l§c[§bSHOP§c]§r §aKamu berhasil membeli §eEXP Level §aDengan total: §e${dataCost}`);
            player.playSound(`random.levelup`);
        }
        catch (e) {
            player.sendMessage(`§r§l§c[§bSHOP§c]§r §cTerjadi kesalahan silahkan hubungi admin.`);
            player.playSound(`note.bass`);
            showErrorToOP(e);
        }
    });
}
//# sourceMappingURL=shop.js.map