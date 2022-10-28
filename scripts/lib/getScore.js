import { world } from "@minecraft/server";

function getScore(name, objectName){
    let scoreboard = world.scoreboard;
    let ScoreboardObjective = scoreboard.getObjective(objectName);
    let participants;
    let participant;
    let score;
    try {
        participants = scoreboard.getParticipants();
        participant = participants.filter(participant => participant.displayName == name);
        score = ScoreboardObjective.getScore(participant[0]);
    } catch {}
    if (typeof name === "object" && name.nameTag.length) score = ScoreboardObjective.getScore(name.scoreboard);
    return score;
}

export default getScore;