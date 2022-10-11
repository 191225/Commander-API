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
                player.setItemJson = t.replace("setItem:", "").replace(/'/g, '\"').replace(/`/g, '\"');
                player.removeTag(t);
            }
            if (t.startsWith("form:")) {
                player.formJson = t.replace("form:","").replace(/'/g, "\"").replace(/`/g, '\"');
                player.removeTag(t);
            }
        })

        // Rename
        if (player.rename) {
            const dataLength = [...player.rename].filter(t => t === "{").length;
            for (let i = 0; i < dataLength; i++) {
                player.rename = player.rename.replace("{name}", player.name);
                try {
                    const score = player.rename.split("{score:")[1].split("}")[0];
                    if (score) player.rename = player.rename.replace(`{score:${score}}`, getScore(player, score));
                } catch {}
                try {
                    const tag = player.rename.split("{tag:")[1].split("}")[0];
                    const hasTag = player.getTags().find(t => t.startsWith(tag));
                    if (tag) player.rename = player.rename.replace(`{tag:${tag}}`, hasTag.split(":")[1]);
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

        // Set slot
        try {
            const setSlot = getScore(player, "Capi:setSlot");
            if (setSlot > -1) {
                player.selectedSlot = setSlot;
                player.runCommandAsync(`scoreboard players reset @s Capi:setSlot`);
            }
        } catch {}

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
            if (Data.name) {
                const dataLength = [...Data.name].filter(t => t === "{").length;
                for (let i = 0; i < dataLength; i++) {
                    Data.name = Data.name.replace("{name}", player.name);
                    try {
                        const score = Data.name.split("{score:")[1].split("}")[0];
                        if (score) Data.name = Data.name.replace(`{score:${score}}`, getScore(player, score));
                    } catch {}
                    try {
                        const tag = Data.name.split("{tag:")[1].split("}")[0];
                        const hasTag = player.getTags().find(t => t.startsWith(tag));
                        if (tag) Data.name = Data.name.replace(`{tag:${tag}}`, hasTag.split(":")[1]);
                    } catch {}
                }
                item.nameTag = Data.name;
            }
            if (Data.lore) item.setLore(Data.lore);
            if (Data.enchants) {
                player.tell("hi")
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
            
            player.tell(String(Data));
            if (typeof Data.slot == "number") container.setItem(Data.slot, item);
                else container.addItem(item);
            player.setItemJson = false;
        }

        // Form
        if (player.formJson) {
            const Data = JSON.parse(player.formJson);
            if (!Data.buttons) throw TypeError(`The button has not been passed. A button must be passed to display the form.`);
            
            const Form = new MinecraftUI.ActionFormData();
            if (Data.title) Form.title(String(Data.title));
            if (Data.body) Form.body(String(Data.body));
           
            Data.buttons.forEach(b => {
                player.tell(String(JSON.stringify(b)))
                if (!b.text) throw TypeError(`The button text is not passed.`);
                if (b.textures) Form.button(String(b.text), String(b.textures));
                    else Form.button(String(b.text));
            });

            Form.show(player).then(response => player.addTag(Data.buttons[response.selection].tag ));
            player.formJson = false;
        }
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
});

world.events.itemUse.subscribe(itemUse => {
    const player = itemUse.source;
    const item = itemUse.item;
});