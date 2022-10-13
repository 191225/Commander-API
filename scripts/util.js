import getScore from "./lib/getScore";

export function setVariable(player, source) {
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
            if (tag) source = source.replace(`{tag:${tag}}`, hasTag.slice(tag.length + 1));
        } catch {}
    }
    return source;
}

export const setScore = (player, object, score) => player.runCommandAsync(`scoreboard players set @s Capi:${object} ${score}`);