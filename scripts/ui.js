import * as Minecraft from "mojang-minecraft";
import { ActionFormData, MessageFormData, ModalFormData } from "mojang-minecraft-ui";
import tickEvent from "./lib/TickEvent";
import getScore from "./lib/getScore";
import { Database, ExtendedDatabase } from "./lib/Database";
import { setVariable } from "./util";
import Config from "./config";


export function Menu(player) {
    player.removeTag("Capi:open_config_gui");
    const Menu = new ActionFormData()
    .title("§lCommander API")
    .button("§lプレイヤー退出メッセージ")
    .button("§l§c閉じる")
    .show(player).then(response => {
        if (response.selection === 0) LeaveMsg(player);
    });
}

const MenuBack = (player) => Menu(player);

function LeaveMsg(player) {
    const Menu = new ActionFormData()
    .title("§lCommander API")
    .body(`ステータス: ${Config.get("LeaveMsgEnabled") ? "有効" : "無効"}\nメッセージ: "${Config.get("LeaveMsg")}"`)
    .button("§l設定する");
    if (Config.get("LeaveMsgEnabled")) Menu.button("§l§c無効にする");
        else Menu.button("§l§2有効にする");

    Menu.button("§l戻る")
    .button("§l§c閉じる")
    .show(player).then(response => {
        if (response.selection === 0) LeaveMsgConfig(player);
        if (response.selection === 1) {
            if (Config.get("LeaveMsgEnabled")) Config.set("LeaveMsgEnabled", false);
                else Config.set("LeaveMsgEnabled", true);
                LeaveMsgBack(player);
        }
        if (response.selection === 2) MenuBack(player);
    });
}

function LeaveMsgConfig(player) {
    const Menu = new ModalFormData()
    .title("§lCommander API")
    .textField("メッセージ", "(例) {name} がサーバーから抜けた！")
    .show(player).then(response => {
        Config.set("LeaveMsg", String(response.formValues[0]));
        LeaveMsgBack(player);
    });
}

const LeaveMsgBack = (player) => LeaveMsg(player);