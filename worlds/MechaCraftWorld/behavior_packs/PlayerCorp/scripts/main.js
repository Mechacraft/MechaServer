import { world, system, Player  } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui"
const DimensionNames = {
	"minecraft:overworld": "§aOverworld",
	"minecraft:nether": "§cNether",
	"minecraft:the_end": "§5End"
};

//system.beforeEvents.watchdogTerminate.subscribe((data) => data.cancel = true);
system.runInterval(
	() => {		const players = world.getAllPlayers();
		for (let i = 0; i < players.length; i++) {
			const player = players[i];
			let playerHealth = player.getComponent( "minecraft:health" ).currentValue;
			const isDead = player.hasTag( "dead" );
			if (playerHealth > 0 && isDead) {
				player.removeTag( "dead" );
				return;
			};
			
			if (playerHealth == 0 && !isDead) {
				const dName = DimensionNames[player.dimension.id];
				player.addTag( "dead" );
				
				const entity = player.dimension.spawnEntity("better_on_bedrock:player_corpse", player.location);
				entity.nameTag = ( "Corpse of " + player.name );
				entity.runCommand( `tp @e[type=item, r=6] @s` );
				player.sendMessage({
					rawtext: [
						{
							translate: "status.playerDied",
							with: [
								player.nameTag,
								Math.round(player.location.x).toString(),
								Math.round(player.location.y).toString(),
								Math.round(player.location.z).toString(),
								dName,
							],
						},
					],
				});
			};
		};
	},
);
world.afterEvents.entityHitEntity.subscribe(
	({ damagingEntity, hitEntity }) => {
		if (
			!(damagingEntity instanceof Player)
			|| hitEntity?.typeId != "better_on_bedrock:player_corpse"
			|| (hitEntity && hitEntity?.hasTag( "dusted" ))
		) return;
		
		new ActionFormData()
		.title( "Dust?" )
		.body( "Dusting the corpse will delete all items inside it. To recover your items, open the corpse's inventory." )
		.button( "Dust It!" )
		.button( "Keep Corpse" )
		.show(damagingEntity).then(
			({ selection }) => {
				switch(selection) {
					case 0: // Dust
						hitEntity.triggerEvent( "entity_transform" );
						hitEntity.addTag( "dusted" );
						hitEntity.runCommandAsync( "loot spawn ~0.5 ~ ~0.5 loot decayed_bone.loottable" );
					break;
					case 1: // Spare
					break;
				};
			},
		);
	},
);