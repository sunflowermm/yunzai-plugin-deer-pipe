import { ERROR_MESSAGES, UI_MESSAGES } from "../constants/game.js";
import {
    getMonthData,
    getTodayStatus,
    getUserRecord,
    hasMonthData,
    performHelpLu,
    performLu,
    performWithdrawal,
} from "../utils/data.js";
import { canHelpFriend } from "../utils/friends.js";
import { generateImage } from "../utils/core.js";
import {
    formatActionMessage,
    formatErrorMessage,
    formatStatusMessage,
    formatViewEmpty,
} from "../utils/messages.js";
import { loadDeerData, loadFriends, saveDeerData } from "../utils/store.js";

export class DeerPipe extends plugin {
    constructor() {
        super({
            name: "🦌管",
            dsc: "一个🦌管签到插件，发送🦌以进行签到",
            event: "message",
            priority: 5000,
            rule: [
                { reg: "^(🦌|鹿)$", fnc: "lu" },
                { reg: "^戒(🦌|鹿)[0-9]*$", fnc: "withdrawalLu" },
                { reg: "^看(🦌|鹿)(\\d{4}-\\d{1,2}|\\d{1,2})?$", fnc: "viewLu" },
                { reg: "^(🦌|鹿)况$", fnc: "luStatus" },
                { reg: "^帮(🦌|鹿)", fnc: "helpLu" },
            ]
        })
    }

    parseViewDate(msg) {
        const match = msg.match(/看(🦌|鹿)(\d{4}-\d{1,2}|\d{1,2})?$/);
        if (!match?.[2]) return new Date();
        const part = match[2];
        if (/^\d{4}-\d{1,2}$/.test(part)) {
            const [y, m] = part.split('-').map(Number);
            return new Date(y, m - 1, 1);
        }
        return new Date(new Date().getFullYear(), parseInt(part, 10) - 1, 1);
    }

    async getMemberName(e, userId) {
        const info = (await (e.group || Bot?.pickGroup(e.group_id))?.getMemberMap())?.get(parseInt(userId));
        return info?.card || info?.nickname || String(userId);
    }

    async replyWithPanel(e, date, name, userId, deerData, text, dayOverride = null) {
        const monthData = getMonthData(getUserRecord(deerData, userId), date);
        const highlightDay = dayOverride ?? date.getDate();
        const entry = monthData?.[String(highlightDay)];
        const raw = await generateImage(date, name, monthData, {
            highlightDay,
            forceDeadBanner: entry?.d === 1,
        });
        await e.reply([text, segment.image(raw)], true);
    }

    async lu(e) {
        const { user_id, card, nickname } = e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performLu(deerData, user_id, date, day);
        await saveDeerData(deerData);
        const text = formatActionMessage(result);
        await this.replyWithPanel(e, date, card || nickname, user_id, deerData, text, day);
    }

    async withdrawalLu(e) {
        let day = /\d+/.exec(e.msg.trim())?.[0];
        const date = new Date();
        const nowDay = date.getDate();
        day = day ? parseInt(day) : nowDay;
        if (day > nowDay || day === 0) return;

        const { user_id, card, nickname } = e.sender;
        const deerData = await loadDeerData();
        const result = performWithdrawal(deerData, user_id, date, day, { pastDay: day !== nowDay });
        if (result.ok) await saveDeerData(deerData);

        if (!result.ok) {
            await e.reply(formatErrorMessage(result), true);
            return;
        }
        const text = formatActionMessage(result);
        await this.replyWithPanel(e, date, card || nickname, user_id, deerData, text, day);
    }

    async viewLu(e) {
        let user, isAt = false;
        if (e.at) {
            user = (await (e.group || Bot?.pickGroup(e.group_id))?.getMemberMap()).get(parseInt(e.at));
            isAt = true;
        } else {
            user = e.sender;
        }

        const { user_id, card, nickname } = user;
        const viewDate = this.parseViewDate(e.msg);
        const deerData = await loadDeerData();
        const userRecord = getUserRecord(deerData, user_id);

        if (!hasMonthData(userRecord, viewDate)) {
            const label = `${viewDate.getFullYear()}年${viewDate.getMonth() + 1}月`;
            e.reply(formatViewEmpty(label, isAt), true);
            return;
        }

        const monthData = getMonthData(userRecord, viewDate);
        const raw = await generateImage(viewDate, card || nickname, monthData, { highlightDay: viewDate.getDate() });
        await e.reply([UI_MESSAGES.view_panel, segment.image(raw)], true);
    }

    async luStatus(e) {
        const { card, nickname, user_id } = e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const status = getTodayStatus(getMonthData(getUserRecord(deerData, user_id), date), day);
        if (status.killerId) {
            status.killedByName = await this.getMemberName(e, status.killerId);
        }
        await e.reply(formatStatusMessage(card || nickname, status), true);
    }

    async helpLu(e) {
        const { user_id, card, nickname } = e.sender;
        const targetId = e.at
            || (e?.reply_id !== undefined ? (await e.getReply()).user_id : e.msg.replace(/帮(🦌|鹿)/g, "").trim());

        if (!targetId) {
            e.reply(ERROR_MESSAGES.no_target, true);
            return;
        }

        const friends = await loadFriends();
        if (!canHelpFriend(friends, user_id, targetId)) {
            e.reply(ERROR_MESSAGES.not_friend, true);
            return;
        }

        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performHelpLu(deerData, user_id, targetId, date, day);
        if (!result.ok) {
            e.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);

        const text = formatActionMessage(result, {
            helperName: card || nickname,
            targetName: await this.getMemberName(e, targetId),
        });
        await this.replyWithPanel(e, date, await this.getMemberName(e, targetId), targetId, deerData, text, day);
    }
}
