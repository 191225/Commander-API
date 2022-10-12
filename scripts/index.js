/**
 * 
 * ░█████╗░░█████╗░███╗░░░███╗███╗░░░███╗░█████╗░███╗░░██╗██████╗░███████╗██████╗░  ░█████╗░██████╗░██╗
 * ██╔══██╗██╔══██╗████╗░████║████╗░████║██╔══██╗████╗░██║██╔══██╗██╔════╝██╔══██╗  ██╔══██╗██╔══██╗██║
 * ██║░░╚═╝██║░░██║██╔████╔██║██╔████╔██║███████║██╔██╗██║██║░░██║█████╗░░██████╔╝  ███████║██████╔╝██║
 * ██║░░██╗██║░░██║██║╚██╔╝██║██║╚██╔╝██║██╔══██║██║╚████║██║░░██║██╔══╝░░██╔══██╗  ██╔══██║██╔═══╝░██║
 * ╚█████╔╝╚█████╔╝██║░╚═╝░██║██║░╚═╝░██║██║░░██║██║░╚███║██████╔╝███████╗██║░░██║  ██║░░██║██║░░░░░██║
 * ░╚════╝░░╚════╝░╚═╝░░░░░╚═╝╚═╝░░░░░╚═╝╚═╝░░╚═╝╚═╝░░╚══╝╚═════╝░╚══════╝╚═╝░░╚═╝  ╚═╝░░╚═╝╚═╝░░░░░╚═╝
 * 
 * @LICENSE GNU General Public License v3.0
 * @AUTHORS Nano, arutaka
 * @LINK https://github.com/191225/Commander-API
 */

import * as Minecraft from "mojang-minecraft";
import * as MinecraftUI from "mojang-minecraft-ui";
import tickEvent from "./lib/TickEvent";
import getScore from "./lib/getScore";

const world = Minecraft.world;

world.events.tick.subscribe(({currentTick, deltaTime}) => {
    for(let player of world.getPlayers()) {
        player.getTags().forEach((t) => {
            if (t.startsWith("rename:")) {
                player.rename = t.replace("rename:", "");
                player.removeTag(t);
            }
            if (t.startsWith("resetName")) {
                player.resetName = true;
                player.removeTag(t);
            }
            if (t.startsWith("setItem:")) {
                player.setItemJson = t.replace("setItem:", "").replace(/'/g, '\"').replace(/`/g, "\"");
                player.removeTag(t);
            }
            if (t.startsWith("form:")) {
                player.formJson = t.replace("form:","").replace(/'/g, "\"").replace(/`/g, "\"");
                player.removeTag(t);
            }
            if (t.startsWith("run:")) {
                player.run = t.replace("run:","").replace(/'/g, "\"").replace(/`/g, "\"");
                player.removeTag(t);
            }
            if (t.startsWith("tell:")) {
                player.Tell = t.replace("tell:","").replace(/'/g, "\"").replace(/`/g, "\"");
                player.removeTag(t);
            }
            if (t.startsWith("kick:")) {
                player.kick = t.replace("kick:","").replace(/'/g, "\"").replace(/`/g, "\"");
                player.removeTag(t);
            }
        })

        // tshoot
        if (player.hasTag("Capi:system_tshoot")) {
            player.getTags().forEach((t) => player.removeTag(t));
        }

        // Rename
        if (player.rename) {
            player.nameTag = setVariable(player, player.rename);
            player.rename = false;
        }

        // Reset name
        if (player.resetName) {
            player.nameTag = player.name;
            player.resetName = false;
        }

        // Set slot
        try {
            const setSlot = getScore(player, "Capi:setSlot");
            if (setSlot > -1) {
                player.selectedSlot = setSlot;
                player.runCommandAsync(`scoreboard players reset @s Capi:setSlot`);
            }
        } catch {}

        // Set item
        let container = player.getComponent('inventory').container;
        if (player.setItemJson) {
            const Data = JSON.parse(player.setItemJson);
            if (!Data.item) return;
            let amount = 1;
            let data = 0;
            let slot = 0;
            let itemName = Data.item.replace("minecraft:", "");
            if (Data.amount) amount = Data.amount;
            if (Data.data) data = Data.data;
            if (Data.slot) slot = Data.slot;
            let item = new Minecraft.ItemStack(Minecraft.MinecraftItemTypes[itemName], amount, data);
            if (Data.name) item.nameTag = setVariable(player, Data.name);
            if (Data.lore) {
                for (let v in Data.lore) Data.lore[v] = setVariable(player, Data.lore[v]);
                item.setLore(setVariable(player, Data.lore));
            }
            if (Data.enchants) {
                const enchantments = item.getComponent("enchantments").enchantments;
                for (let i = 0; i < Data.enchants.length; i++) {
                    if (!Data.enchants[i].name) return;
                    let enchantsName = Data.enchants[i].name;
                    let enchantsLevel = 1;
                    if (Data.enchants[i].level) enchantsLevel = Data.enchants[i].level;
                    enchantments.addEnchantment(new Minecraft.Enchantment(Minecraft.MinecraftEnchantmentTypes[enchantsName], enchantsLevel));
                }
                item.getComponent("enchantments").enchantments = enchantments;
            }
            
            if (typeof Data.slot == "number") container.setItem(Data.slot, item);
                else container.addItem(item);
            player.setItemJson = false;
        }

        // Show form
        if (player.formJson) {
            const Data = JSON.parse(player.formJson);
            if (!Data.buttons) throw TypeError(`The button has not been passed. A button must be passed to display the form.`);
            
            const Form = new MinecraftUI.ActionFormData();
            if (Data.title) Form.title(String(setVariable(player, Data.title)));
            if (Data.body) Form.body(String(setVariable(player, Data.body)));
           
            Data.buttons.forEach(b => {
                if (!b.text) throw TypeError(`The button text is not passed.`);
                if (b.textures) Form.button(String(setVariable(player, b.text)), String(b.textures));
                    else Form.button(String(setVariable(player, b.text)));
            });

            Form.show(player).then(response => player.addTag((Data.buttons[response.selection].tag)));
            player.formJson = false;
        }

        // Run command
        if (player.run) {
            const Data = JSON.parse(player.run);
            Data.forEach(c => player.runCommandAsync(String(setVariable(player, c))));
            player.run = false;
        }

        // Tell
        if (player.Tell) {
            player.tell(String(setVariable(player, player.Tell)));
            player.Tell = false;
        }

        // Kick
        if (player.kick) {
            player.runCommandAsync(`kick "${player.name}" ${setVariable(player, player.kick)}`);
            player.kick = false;
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

        // timestamp
        player.runCommandAsync(`scoreboard players set @s Capi:timestamp ${Math.floor( Date.now() / 1000 )}`);
        
        
    }
});

world.events.beforeChat.subscribe(chat => {
    const player = chat.sender;
    let msg = chat.message;
    player.getTags().forEach((t) => {
        t = t.replace(/"/g, "");
        if (t.startsWith("chat:")) player.removeTag(t);
    })
    player.addTag(`chat:${msg.replace(/"/g, "")}`);
    player.runCommandAsync(`scoreboard players set @s Capi:chatLength ${msg.length}`);
    player.runCommandAsync(`scoreboard players add @s Capi:chatCount 1`);
});

world.events.itemUse.subscribe(itemUse => {
    const player = itemUse.source;
    const item = itemUse.item;
    const details = {
        id: item.id,
        name: item.nameTag,
        amount: item.amount,
        data: item.data,
        lore: item.getLore()
    }
    player.getTags().forEach((t) => {
        if (t.startsWith("itemUse:") || t.startsWith("itemUseD:")) player.removeTag(t);
    });
    player.addTag(`itemUse:${item.id}`);
    player.addTag(`itemUseD:${JSON.stringify(details)}`);
});

world.events.blockPlace.subscribe(blockPlace => {
    const player = blockPlace.player;
    const block = blockPlace.block;
    player.getTags().forEach((t) => {
        if (t.startsWith("blockPlace:")) player.removeTag(t);
    });
    player.addTag(`blockPlace:${block.id}`);
    player.runCommandAsync(`scoreboard players set @s Capi:blockPlaceX ${block.x}`);
    player.runCommandAsync(`scoreboard players set @s Capi:blockPlaceY ${block.y}`);
    player.runCommandAsync(`scoreboard players set @s Capi:blockPlaceZ ${block.z}`);
});

function setVariable(player, source) {
    const dataLength = [...source].filter(t => t === "{").length;
    for (let i = 0; i < dataLength; i++) {
        source = source.replace("{name}", player.name);
        source = source.replace("{nl}", `\n`);
        try {
            const score = source.split("{score:")[1].split("}")[0];
            if (score) source = source.replace(`{score:${score}}`, getScore(player, score));
        } catch {}
        try {
            const tag = source.split("{tag:")[1].split("}")[0];
            const hasTag = player.getTags().find(t => t.startsWith(tag));
            if (tag) source = source.replace(`{tag:${tag}}`, hasTag.split(":")[1]);
        } catch {}
    }
    return source;
}