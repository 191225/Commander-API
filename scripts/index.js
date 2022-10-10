import * as Minecraft from "mojang-minecraft";
import * as MinecraftUI from "mojang-minecraft-ui";
import tickEvent from "./lib/TickEvent";
import getScore from "./lib/getScore";

const world = Minecraft.world;

world.events.tick.subscribe(({currentTick, deltaTime}) => {
    for(let player of world.getPlayers()) {
        player.getTags().forEach((t) => {
            t = t.replace(/"/g, "");
            if (t.startsWith("rename:")) {
                player.rename = t.replace("rename:", "");
                player.removeTag(t);
            }
            if (t.startsWith("resetName")) {
                player.resetName = true;
                player.removeTag(t);
            }
        })

        // Rename
        if (player.rename) {
            player.rename = player.rename.replace("{name}", player.name);
            for (let i = 0; i < 5; i++) {
                try {
                    const score = player.rename.split("{score:")[1].split("}")[0];
                    if (score) player.rename = player.rename.replace(`{score:${score}}`, getScore(player, score));
                } catch {}
            }
            
            player.nameTag = player.rename;
            player.rename = false;
        }

        // Reset name
        if (player.resetName) {
            player.nameTag = player.name;
            player.resetName = false;
        }

        // Set scoreboard
        // health
        player.health = player.getComponent("minecraft:health").current;
        try {
            player.runCommandAsync(`scoreboard players set @s Capi:health ${player.health}`);
        } catch {}

        // pos
        player.runCommandAsync(`scoreboard players set @s Capi:x ${player.location.x.toFixed(0)}`);
        player.runCommandAsync(`scoreboard players set @s Capi:y ${player.location.y.toFixed(0)}`);
        player.runCommandAsync(`scoreboard players set @s Capi:z ${player.location.z.toFixed(0)}`);

        // rotation
        player.runCommandAsync(`scoreboard players set @s Capi:rx ${player.rotation.x.toFixed(0)}`);
        player.runCommandAsync(`scoreboard players set @s Capi:ry ${player.rotation.y.toFixed(0)}`);

        // selected slot
        player.runCommandAsync(`scoreboard players set @s Capi:slot ${player.selectedSlot}`);
    }
})