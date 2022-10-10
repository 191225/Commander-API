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
            try {
                const score = player.rename.split("{score:")[1].split("}")[0];
                if (score) player.rename = player.rename.replace(`{score:${score}}`, getScore(player, score));
            } catch {}
            player.nameTag = player.rename;
            player.rename = false;
        }

        // Reset name
        if (player.resetName) {
            player.nameTag = player.name;
            player.resetName = false;
        }

        // Set health on scoreboard
        player.health = player.getComponent("minecraft:health").current;
        try {
            player.runCommandAsync(`scoreboard players set @s Capi:health ${player.health}`);
        } catch {}
    }
})