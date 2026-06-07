import { ERROR_MESSAGES, UI_MESSAGES } from '../constants/game.js';
import { REG, parseViewMonthToken } from '../constants/commands.js';
import {
    getMonthData,
    getTodayStatus,
    getUserRecord,
    hasMonthData,
    performHelpLu,
    performLu,
    performWithdrawal,
} from '../utils/data.js';
import { canHelpFriend } from '../utils/friends.js';
import { generateImage } from '../utils/core.js';
import { replyDeerPanel } from '../utils/panel.js';
import {
    formatActionMessage,
    formatErrorMessage,
    formatStatusMessage,
    formatViewEmpty,
} from '../utils/messages.js';
import { getMemberName, resolveHelpTargetId } from '../utils/plugin-common.js';
import { loadDeerData, loadFriends, saveDeerData } from '../utils/store.js';

export class DeerPipe extends plugin {
    constructor() {
        super({
            name: '🦌管',
            dsc: '鹿/🦌 签到与互助',
            event: 'message',
            priority: 5000,
            bypassThrottle: true,
            rule: [
                { reg: REG.lu, fnc: 'lu' },
                { reg: REG.withdraw, fnc: 'withdrawalLu' },
                { reg: REG.view, fnc: 'viewLu' },
                { reg: REG.status, fnc: 'luStatus' },
                { reg: REG.help, fnc: 'helpLu' },
            ],
        });
    }

    async lu() {
        const { user_id, card, nickname } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performLu(deerData, user_id, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);
        const text = formatActionMessage(result);
        await replyDeerPanel(this.e, {
            date, name: card || nickname, userId: user_id, deerData, text, dayOverride: day,
        });
    }

    async withdrawalLu() {
        let day = /\d+/.exec(this.e.msg.trim())?.[0];
        const date = new Date();
        const nowDay = date.getDate();
        day = day ? parseInt(day, 10) : nowDay;
        if (day > nowDay || day === 0) return;

        const { user_id, card, nickname } = this.e.sender;
        const deerData = await loadDeerData();
        const result = performWithdrawal(deerData, user_id, date, day, { pastDay: day !== nowDay });
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);
        const text = formatActionMessage(result);
        await replyDeerPanel(this.e, {
            date, name: card || nickname, userId: user_id, deerData, text, dayOverride: day,
        });
    }

    async viewLu() {
        let user;
        let isAt = false;
        if (this.e.at) {
            user = (await (this.e.group || Bot?.pickGroup(this.e.group_id))?.getMemberMap())
                .get(parseInt(this.e.at, 10));
            isAt = true;
        } else {
            user = this.e.sender;
        }

        const { user_id, card, nickname } = user;
        const viewDate = parseViewMonthToken(this.e.msg);
        const deerData = await loadDeerData();
        const userRecord = getUserRecord(deerData, user_id);

        if (!hasMonthData(userRecord, viewDate)) {
            const label = `${viewDate.getFullYear()}年${viewDate.getMonth() + 1}月`;
            await this.reply(formatViewEmpty(label, isAt), true);
            return;
        }

        const monthData = getMonthData(userRecord, viewDate);
        const raw = await generateImage(viewDate, card || nickname, monthData, {
            highlightDay: viewDate.getDate(),
        });
        await this.reply([UI_MESSAGES.view_panel, segment.image(raw)], true);
    }

    async luStatus() {
        const { card, nickname, user_id } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const status = getTodayStatus(getMonthData(getUserRecord(deerData, user_id), date), day);
        if (status.killerId) {
            status.killedByName = await getMemberName(this.e, status.killerId);
        }
        await this.reply(formatStatusMessage(card || nickname, status), true);
    }

    async helpLu() {
        const { user_id, card, nickname } = this.e.sender;
        const targetId = await resolveHelpTargetId(this.e);

        if (!targetId) {
            await this.reply(ERROR_MESSAGES.no_target, true);
            return;
        }

        const friends = await loadFriends();
        if (!canHelpFriend(friends, user_id, targetId)) {
            await this.reply(ERROR_MESSAGES.not_friend, true);
            return;
        }

        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performHelpLu(deerData, user_id, targetId, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);

        const targetName = await getMemberName(this.e, targetId);
        const text = formatActionMessage(result, {
            helperName: card || nickname,
            targetName,
        });
        await replyDeerPanel(this.e, {
            date, name: targetName, userId: targetId, deerData, text, dayOverride: day,
        });
    }
}
