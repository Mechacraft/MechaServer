import { world } from "@minecraft/server";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import MechAPI from "./libs/mechapi";
import { getPlayerByName, showErrorToOP, viewObj } from "./libs/utils";
export const GUILD_ROLE = ["LEADER", "MODERATOR", "MEMBER"];
export function formatGuild(guildname) {
    return `§l§f[§r${guildname}§l§f]§r`;
}
export function getGuildTag(player) {
    var guildTag = null;
    var mcPlayer = player;
    if (typeof player.getTags != "function") {
        mcPlayer = getPlayerByName(player.name);
    }
    if (mcPlayer.getTags().join("|").includes("guild:")) {
        let tagGuild = mcPlayer.getTags().filter((v) => v.includes("guild:"))[0];
        guildTag = tagGuild.replace("guild:", "");
    }
    return guildTag;
}
export function removeGuildTag(player) {
    var mcPlayer = player;
    if (typeof player.getTags != "function") {
        mcPlayer = getPlayerByName(player.name);
    }
    if (mcPlayer.getTags().join("|").includes("guild:")) {
        let tagGuild = mcPlayer.getTags().filter((v) => v.includes("guild:"))[0];
        mcPlayer.removeTag(tagGuild);
    }
}
export function setGuildTag(player, guildName) {
    removeGuildTag(player);
    // Add new guild
    player.addTag(`guild:${guildName}`);
    return formatGuild(guildName);
}
export function getGuildPlayers(guildName) {
    var players = [];
    for (let player of world.getPlayers()) {
        if (player
            .getTags()
            .join("|")
            .includes("guild:" + guildName)) {
            players.push(player);
        }
    }
    return players;
}
export async function GuildMenu(player) {
    const resp = await MechAPI.getUser(player);
    if (!resp.status) {
        player.sendMessage(`§r§l§e[§bGUILD§e]§r §c${resp.message}`);
        player.playSound("note.bass");
        return;
    }
    const user = resp.result;
    if (user.guild) {
        const resp_guild = await MechAPI.getGuild(player, user.guildId);
        if (!resp_guild.status) {
            player.sendMessage(`§r§l§e[§bGUILD§e]§r §c${resp_guild.message}`);
            player.playSound("note.bass");
            return;
        }
        const guildRole = user.guildMember.memberRole;
        const guild = resp_guild.result;
        const guildText = `
    §fGuild        §c: §f${user?.guild ? user.guild.name : "-"}§r
    §fTotal Member §c: §b${guild.members.length}§f/§b${guild.maxMembers}
    §fRole kamu    §c: §d${guildRole}
    §fDeskripsi    §c: §a${guild.description ?? "-"}

    `;
        let form = new ActionFormData();
        form.body(`\n               §¶[ §l§cGuild §6Menu §r ]\n${guildText}`);
        form.button("Member Guild", "textures/ui/multiplayer_glyph_color");
        if (["LEADER", "OFFICER"].includes(guildRole)) {
            form.button("Pengaturan Guild", "textures/ui/gear");
        }
        if (guildRole == "LEADER") {
            form.button("Hapus Guild", "textures/ui/realms_red_x");
        }
        form.show(player).then((result) => {
            if (result.canceled)
                return;
            if (result.selection == 0)
                GuildMember(player, guild, guild.members, guildRole);
            if (result.selection == 1)
                GuildSettings(player, user);
            if (result.selection == 2)
                GuildDelete(player, guild);
        });
    }
    else {
        const guildText = `\n§6Kamu belum memiliki guild. Silahkan buat atau bergabung pada guild yang tersedia!\n\n`;
        let form = new ActionFormData();
        form.body(`\n               §¶[ §l§cGuild §6Menu §r ]\n${guildText}`);
        form.button("Buat Guild", "textures/ui/xbox_dpad");
        form.button("Cari Guild", "textures/ui/glyph_realms");
        form.show(player).then((result) => {
            if (!result.canceled) {
                if (result.selection == 0)
                    GuildCreate(player, user);
                if (result.selection == 1)
                    GuildSearch(player);
            }
        });
    }
}
export async function GuildCreate(player, user) {
    const resp = await MechAPI.getGuildMemberCost(player);
    if (!resp.status) {
        player.sendMessage(`§r§l§e[§bGUILD§e]§r §c${resp.message}`);
        player.playSound("note.bass");
        return;
    }
    const cost_member = resp.result.cost_member;
    let modal = new ModalFormData();
    modal.title("§l§cBuat §6Guild");
    modal.textField(`§a-------------------------------

§6Informasi Pemain:
§fNama: §b${player.nameTag}
§fUang: §a${user.money}

§3Note:\n§6Pembuatan guild akan dikenakan biaya §a${cost_member} §6untuk setiap membernya.

§a-------------------------------

§fNama:`, "Masukan nama guild ...");
    modal.textField("§fDeskripsi:", "Masukan deskripsi guild ...");
    modal.textField("§fMaks member:", "Masukan angka maksimal member", "10");
    modal.toggle("§fGuild publik", true);
    modal.show(player).then(async (res) => {
        if (res.canceled)
            return;
        if (!res.formValues[0]) {
            player.sendMessage(`§r§l§e[§bGUILD§e]§r §cNama guild tidak valid!`);
            player.playSound(`note.bass`);
            return;
        }
        const namaGuild = res.formValues[0];
        if (!res.formValues[1]) {
            player.sendMessage(`§r§l§e[§bGUILD§e]§r §cDeskripsi guild tidak valid!`);
            player.playSound(`note.bass`);
            return;
        }
        const deskripsiGuild = res.formValues[1];
        if (!res.formValues[2]) {
            player.sendMessage(`§r§l§e[§bGUILD§e]§r §cMasukan maksimal member!`);
            player.playSound(`note.bass`);
            return;
        }
        if (isNaN(res.formValues[2])) {
            player.sendMessage(`§r§l§e[§bGUILD§e]§r §cKamu hanya bisa memasukan level memakai angka`);
            player.playSound(`note.bass`);
            return;
        }
        let maksMember = res.formValues[2];
        const guildPublik = res.formValues[3];
        let guild_cost = maksMember * cost_member;
        if (user.money < guild_cost) {
            player.sendMessage(`§r§l§e[§bGUILD§e]§r §cUang anda saat ini §a${user.money} §ctidak cukup untuk membuat guild dengan §b${maksMember} member §cdan total biaya §a${guild_cost}`);
            player.playSound(`note.bass`);
            return;
        }
        const resp_create = await MechAPI.createGuild(player, namaGuild, deskripsiGuild, maksMember, guildPublik);
        if (!resp_create.status) {
            if (resp_create.not_enough_money) {
                player.sendMessage(`§r§l§e[§bGUILD§e]§r §cUang anda saat ini §a${user.money} §ctidak cukup untuk membuat guild dengan §b${maksMember} member §cdan total biaya §a${guild_cost}`);
            }
            else {
                player.sendMessage(`§r§l§e[§bGUILD§e]§r §c${resp_create.message}`);
            }
            player.playSound("note.bass");
            return;
        }
        setGuildTag(player, namaGuild);
        player.sendMessage(`§r§l§e[§bGUILD§e]§r §aKamu berhasil membuat guild §b${namaGuild} §adengan maksimal member §c${maksMember}`);
        player.playSound("random.levelup");
    });
}
export async function GuildSearch(player) {
    try {
        const resp = await MechAPI.getPublicGuilds(player);
        if (!resp.status) {
            player.sendMessage(`§r§l§e[§bGUILD§e]§r §c${resp.message}`);
            player.playSound("note.bass");
            return;
        }
        let form = new ActionFormData();
        form.title(`§l§cGuild §2Publik`);
        form.body(`§6Pilih guild untuk bergabung.`);
        const guilds = resp.result;
        if (guilds.length == 0) {
            player.sendMessage(`§r§l§e[§bTPA§e]§r §6Tidak ada guild publik yang tersedia untuk saat ini.`);
            player.playSound("note.bass");
            return;
        }
        for (const guild of guilds) {
            form.button(`${guild.name}§r\n${guild.description}`);
        }
        form.show(player).then(async (result) => {
            if (result.canceled)
                return;
            const guild = guilds[result.selection];
            const resp_join = await MechAPI.joinGuild(player, guild.guildId);
            if (!resp_join.status) {
                player.sendMessage(`§r§l§e[§bGUILD§e]§r §c${resp_join.message}`);
                player.playSound("note.bass");
                return;
            }
            setGuildTag(player, guild.name);
            player.sendMessage(`§r§l§e[§bGUILD§e]§r §aBerhasil memasuki guild §f${guild.name}`);
            player.playSound("horn.call.1");
            const guildPlayers = getGuildPlayers(guild.name);
            for (const guildPlayer of guildPlayers) {
                if (guildPlayer.name != player.name) {
                    guildPlayer.sendMessage(`§r§l§e[§bGUILD§e]§r §o§c${player.name} §atelah memasuki guild`);
                    guildPlayer.playSound("horn.call.1");
                }
            }
        });
    }
    catch (error) {
        player.sendMessage(`§r§l§e[§bGUILD§e]§r §cGagal mendapatkan player aktif, silahkan hubungi admin.`);
        player.playSound("note.bass");
        showErrorToOP(viewObj(error));
    }
}
export async function GuildMember(player, guild, members, guildRole) {
    try {
        let form = new ActionFormData();
        form.title(`§l§cMember Guild §r${guild.name}`);
        if (members.length == 0) {
            player.sendMessage(`§r§l§e[§bGUILD§e]§r §6Tidak ada member disini.`);
            player.playSound("note.bass");
            return;
        }
        for (const member of members) {
            const isGuildOFFICER = ["LEADER", "OFFICER"].includes(member.memberRole);
            form.button(member.member.name, isGuildOFFICER ? "textures/ui/op" : "textures/ui/permissions_member_star");
        }
        form.show(player).then(async (result) => {
            if (result.canceled)
                return;
            const member = members[result.selection];
            MemberSettings(player, guild, member, guildRole);
        });
    }
    catch (error) {
        player.sendMessage(`§r§l§e[§bGUILD§e]§r §cGagal mendapatkan player aktif, silahkan hubungi admin.`);
        player.playSound("note.bass");
        showErrorToOP(viewObj(error));
    }
}
export async function MemberSettings(player, guild, member, guildRole) {
    let form = new ActionFormData();
    form.body(`\n               §¶[ §l§cMember §6Profile §r ]
    
    §fNama: §b${member.member.name}
    §fRole: §d${member.memberRole}
  `);
    if (guildRole != "MEMBER") {
        form.button("Promote member", "textures/ui/accessibility_glyph_color");
        form.button("Tendang dari guild", "textures/ui/realms_red_x");
        form.show(player).then((result) => {
            if (result.canceled)
                return;
            if (result.selection == 0)
                MemberPromote(player, guild, member);
            if (result.selection == 1)
                MemberKick(player, guild, member);
        });
    }
    else {
        form.button("Tutup");
        form.show(player);
    }
}
export async function MemberPromote(player, guild, member) {
    let form = new ModalFormData();
    const guildRole = ["OFFICER", "MEMBER"];
    const indexRole = guildRole.findIndex((v) => v == member.memberRole);
    form.dropdown(`\n               §¶[ §l§cMember §6Promote §r ]
  
  §fNama: §b${member.member.name}
  §fRole: §d${member.memberRole}
`, guildRole, indexRole == -1 ? 0 : indexRole);
    form.show(player).then(async (result) => {
        if (result.canceled)
            return;
        let values = result.formValues;
        let role = guildRole[values[0]];
        const resp_promote = await MechAPI.promoteMemberGuild(player, guild, member.member, role);
        if (!resp_promote.status) {
            player.sendMessage(`§r§l§e[§bGUILD§e]§r §c${resp_promote.message}`);
            player.playSound("note.bass");
            return;
        }
        const guildPlayers = getGuildPlayers(guild.name);
        const memberPlayer = getPlayerByName(member.member.name);
        if (role == "OFFICER") {
            if (memberPlayer) {
                memberPlayer.sendMessage(`§r§l§e[§bGUILD§e]§r §aSelamat kamu telah dipromosikan menjadi §d${role}`);
                memberPlayer.playSound("horn.call.1");
            }
            for (const guildPlayer of guildPlayers) {
                if (guildPlayer.name != member.member.name) {
                    guildPlayer.sendMessage(`§r§l§e[§bGUILD§e]§r §o§c${member.member.name} §atelah dipromosikan menjadi §d${role}`);
                }
            }
        }
        else if (role == "MEMBER") {
            if (memberPlayer) {
                memberPlayer.sendMessage(`§r§l§e[§bGUILD§e]§r §aKamu telah diturunkan menjadi §d${role}`);
                memberPlayer.playSound("random.pop2");
            }
            for (const guildPlayer of guildPlayers) {
                if (guildPlayer.name != member.member.name) {
                    guildPlayer.sendMessage(`§r§l§e[§bGUILD§e]§r §o§c${member.member.name} §atelah diturunkan menjadi §d${role}`);
                }
            }
        }
    });
}
export function MemberKick(player, guild, member) {
    new MessageFormData()
        .body(`\n               §¶[ §l§cMember §6Kick ]
  
    §fNama: §b${member.member.name}
    §fRole: §d${member.memberRole}

§6Yakin kick member ini dari guild?
`)
        .button1("§l§cTidak, Biarkan saja.")
        .button2("§l§2Ya, tendang!")
        .show(player)
        .then(async (result) => {
        if (result.canceled)
            return;
        if (result.selection == 1) {
            // Terima
            const resp_leave = await MechAPI.leaveGuild(member.member, guild.guildId);
            if (!resp_leave.status) {
                player.sendMessage(`§r§l§e[§bGUILD§e]§r §c${resp_leave.message}`);
                player.playSound("note.bass");
                return;
            }
            const guildPlayers = getGuildPlayers(guild.name);
            for (const guildPlayer of guildPlayers) {
                if (guildPlayer.name != member.member.name) {
                    guildPlayer.sendMessage(`§r§l§e[§bGUILD§e]§r §o§c${member.member.name} §atelah di kick dari guild`);
                }
            }
            const kickPlayer = getPlayerByName(member.member.name);
            if (kickPlayer) {
                removeGuildTag(kickPlayer);
                kickPlayer.sendMessage(`§r§l§e[§bGUILD§e]§r §6Anda telah dikeluarkan dari guild §r${guild.name}`);
                kickPlayer.playSound("horn.call.7");
            }
            player.sendMessage(`§r§l§e[§bGUILD§e]§r §b${member.member.name} §aBerhasil dikeluarkan.`);
            player.playSound("horn.call.7");
        }
    });
}
export async function GuildSettings(player, user) {
    const resp = await MechAPI.getGuildMemberCost(player);
    if (!resp.status) {
        player.sendMessage(`§r§l§e[§bGUILD§e]§r §c${resp.message}`);
        player.playSound("note.bass");
        return;
    }
    const cost_member = resp.result.cost_member;
    const resp_guild = await MechAPI.getGuild(player, user.guildId);
    if (!resp_guild.status) {
        player.sendMessage(`§r§l§e[§bGUILD§e]§r §c${resp_guild.message}`);
        player.playSound("note.bass");
        return;
    }
    const guild = resp_guild.result;
    let modal = new ModalFormData();
    modal.title("§l§cPengaturan §6Guild");
    modal.textField(`§a-------------------------------

§6Informasi Pemain:
§fNama: §b${player.nameTag}
§fUang: §a${user.money}
§fRole: §d${user.guildMember.memberRole}

§6Informasi Guild:
§fNama: §b${guild.name}§r
§fMember: §a${guild.members.length}§f/§a${guild.maxMembers}

§3Note:
§f- §6Peningkatan guild akan dikenakan biaya §a${cost_member} §6untuk setiap membernya.
§f- §6Penurunan jumlah anggota akan ada cashback sebesar §e50 persen

§a-------------------------------

§fNama:`, "Masukan nama guild ...", guild.name);
    modal.textField("§fDeskripsi:", "Masukan deskripsi guild ...", guild.description);
    modal.textField(`§fMaks member:`, "Masukan angka maksimal member", guild.maxMembers.toString());
    modal.toggle("§fGuild publik", guild.isPublic);
    modal.show(player).then(async (res) => {
        if (res.canceled)
            return;
        if (!res.formValues[0]) {
            player.sendMessage(`§r§l§e[§bGUILD§e]§r §cNama guild tidak valid!`);
            player.playSound(`note.bass`);
            return;
        }
        const namaGuild = res.formValues[0];
        if (!res.formValues[1]) {
            player.sendMessage(`§r§l§e[§bGUILD§e]§r §cDeskripsi guild tidak valid!`);
            player.playSound(`note.bass`);
            return;
        }
        const deskripsiGuild = res.formValues[1];
        if (!res.formValues[2]) {
            player.sendMessage(`§r§l§e[§bGUILD§e]§r §cMasukan maksimal member!`);
            player.playSound(`note.bass`);
            return;
        }
        if (isNaN(res.formValues[2])) {
            player.sendMessage(`§r§l§e[§bGUILD§e]§r §cKamu hanya bisa memasukan level memakai angka`);
            player.playSound(`note.bass`);
            return;
        }
        let maksMember = res.formValues[2];
        const guildPublik = res.formValues[3];
        let guild_cost = maksMember * cost_member;
        if (user.money < guild_cost) {
            player.sendMessage(`§r§l§e[§bGUILD§e]§r §cUang anda saat ini §a${user.money} §ctidak cukup untuk membuat guild dengan §b${maksMember} member §cdan total biaya §a${guild_cost}`);
            player.playSound(`note.bass`);
            return;
        }
        const resp_update = await MechAPI.updateGuild(player, namaGuild, deskripsiGuild, maksMember, guildPublik);
        if (!resp_update.status) {
            if (resp_update.not_enough_money) {
                player.sendMessage(`§r§l§e[§bGUILD§e]§r §cUang anda saat ini §a${user.money} §ctidak cukup untuk meningkatkan guild ke §b${maksMember} member §cdan total biaya §a${guild_cost}`);
            }
            else if (resp_update.failed_update_member) {
                player.sendMessage(`§r§l§e[§bGUILD§e]§r §cGagal mengubah jumlah maksimal member. Total member saat ini §e${guild.members.length} §cdan kamu meminta perubahan jumlah member ke §e${maksMember}`);
            }
            else {
                player.sendMessage(`§r§l§e[§bGUILD§e]§r §c${resp_update.message}`);
            }
            player.playSound("note.bass");
            return;
        }
        player.sendMessage(`§r§l§e[§bGUILD§e]§r §aKamu berhasil mengubah identitas guild §b${namaGuild}`);
        player.playSound("random.levelup");
    });
}
export async function GuildDelete(player, guild) {
    new MessageFormData()
        .body(`\n               §¶[ §l§cGuild §6Delete §f]
  
§6Yakin kick menghapus guild ${guild.name}? 
§cIni akan mengeluarkan semua member\nmenghapus guild secara permanen\ndan uang tidak akan dikembalikan.
`)
        .button1("§l§cTidak.")
        .button2("§l§2Ya, hapus!")
        .show(player)
        .then(async (result) => {
        if (result.canceled)
            return;
        if (result.selection == 1) {
            // Terima
            const guildPlayers = getGuildPlayers(guild.name);
            const resp_delete = await MechAPI.deleteGuild(player);
            if (!resp_delete.status) {
                player.sendMessage(`§r§l§e[§bGUILD§e]§r §c${resp_delete.message}`);
                player.playSound("note.bass");
                return;
            }
            player.sendMessage(`§r§l§e[§bGUILD§e]§r §o§aMember telah dikeluarkan dan guild berhasil dihapus.`);
            player.playSound("horn.call.7");
            for (const guildPlayer of guildPlayers) {
                if (guildPlayer.name != player.name) {
                    guildPlayer.sendMessage(`§r§l§e[§bGUILD§e]§r §o§6Kamu telah dikeluarkan dari guild, karena guild §f${guild.name}§r §6telah dihapus.`);
                    guildPlayer.playSound("horn.call.7");
                }
                removeGuildTag(guildPlayer);
            }
        }
    });
}
//# sourceMappingURL=guild.js.map