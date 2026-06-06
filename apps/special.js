import {
    getDayRankInGroup,
    getMonthData,
    getUserRecord,
    hasUsedImperial,
    markImperialUsed,
    performHelpWithdrawal,
    performPrivilegeRevive,
    performTogetherFall,
    settleImperialPk,
} from '../utils/data.js';
import { canHelpFriend } from '../utils/friends.js';
import {
    ERROR_MESSAGES,
    IMPERIAL_START_MESSAGES,
    rollDiceBigSmall,
    pickRandom,
} from '../constants/game.js';
import { formatActionMessage, formatErrorMessage } from '../utils/messages.js';
import { loadDeerData, loadFriends, saveDeerData } from '../utils/store.js';

/** 皇城鹿待选上下文（群:用户 → 决斗信息） */
const imperialPkSessions = new Map();

function sessionKey(e) {
    return `${e.group_id}:${e.user_id}`;
}

export class DeerSpecial extends plugin {
    constructor() {
        super({
            name: '🦌管扩展',
            dsc: '同归鹿尽、帮戒鹿、皇城鹿、特权回鹿返照',
            event: 'message',
            priority: 5001,
            rule: [
                { reg: '^同归鹿尽', fnc: 'togetherFall' },
                { reg: '^帮戒(🦌|鹿)', fnc: 'helpWithdraw' },
                { reg: '^回鹿返照$', fnc: 'privilegeRevive' },
                { reg: '^(皇城鹿|皇城🦌|皇城)$', fnc: 'imperialStart' },
            ],
        });
    }

    async resolveTargetId(e) {
        if (e.at) return e.at;
        if (e?.reply_id !== undefined) return (await e.getReply()).user_id;
        return e.msg.replace(/^(同归鹿尽|帮戒(🦌|鹿))/g, '').trim() || null;
    }

    async getMemberName(e, userId) {
        const info = (await (e.group || Bot?.pickGroup(e.group_id))?.getMemberMap())?.get(parseInt(userId));
        return info?.card || info?.nickname || String(userId);
    }

    async togetherFall(e) {
        const { user_id } = e.sender;
        const targetId = await this.resolveTargetId(e);
        if (!targetId) {
            e.reply(ERROR_MESSAGES.no_target, true);
            return;
        }

        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performTogetherFall(deerData, user_id, targetId, date, day);
        if (!result.ok) {
            e.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);

        const targetName = await this.getMemberName(e, targetId);
        e.reply(formatActionMessage(result, {
            helperName: e.sender.card || e.sender.nickname,
            targetName,
        }), true);
    }

    async helpWithdraw(e) {
        const { user_id, card, nickname } = e.sender;
        const targetId = await this.resolveTargetId(e);
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
        const result = performHelpWithdrawal(deerData, user_id, targetId, date, day);
        if (!result.ok) {
            e.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);

        e.reply(formatActionMessage(result, {
            helperName: card || nickname,
            targetName: await this.getMemberName(e, targetId),
        }), true);
    }

    async privilegeRevive(e) {
        const { user_id, card, nickname } = e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performPrivilegeRevive(deerData, user_id, date, day);
        if (!result.ok) {
            e.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);
        e.reply(formatActionMessage(result, { helperName: card || nickname }), true);
    }

    async imperialStart(e) {
        if (!e.isGroup) {
            e.reply(ERROR_MESSAGES.imperial_need_group, true);
            return;
        }

        const { user_id } = e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const userMonth = getMonthData(getUserRecord(deerData, user_id), date);
        if (hasUsedImperial(userMonth, day)) {
            e.reply(formatErrorMessage({ type: 'imperial_used' }), true);
            return;
        }

        const membersMap = await e.group.getMemberMap();
        const members = Array.from(membersMap.keys());
        const rank = getDayRankInGroup(deerData, members, date);
        if (!rank.length) {
            e.reply(formatErrorMessage({ type: 'imperial_no_king' }), true);
            return;
        }

        const king = rank[0];
        if (String(king.id) === String(user_id)) {
            e.reply(formatErrorMessage({ type: 'imperial_is_king' }), true);
            return;
        }

        if (!markImperialUsed(deerData, user_id, date, day)) {
            e.reply(formatErrorMessage({ type: 'imperial_used' }), true);
            return;
        }
        await saveDeerData(deerData);

        const kingName = await this.getMemberName(e, king.id);
        imperialPkSessions.set(sessionKey(e), {
            kingId: king.id,
            kingName,
            kingCount: king.sum,
            date,
            day,
        });

        this.setContext('imperialPkChoice', true, 90, '皇城鹿决斗超时，今日机会已消耗');
        await e.reply([
            pickRandom(IMPERIAL_START_MESSAGES),
            `\n今日鹿王：${kingName}（${king.sum} 次）`,
            '请 90 秒内回复「大」或「小」掷骰决战！',
            '赢：鹿王今日 -5 次 · 输：你今日 -3 次',
        ].join('\n'), true);
    }

    /** 上下文：皇城鹿猜大小 */
    async imperialPkChoice() {
        const key = sessionKey(this.e);
        const session = imperialPkSessions.get(key);
        if (!session) {
            this.finish('imperialPkChoice', true);
            return;
        }

        const choice = this.e.msg.trim();
        if (!/^(大|小)$/.test(choice)) {
            await this.reply('请回复「大」或「小」', true);
            return 'continue';
        }

        imperialPkSessions.delete(key);
        this.finish('imperialPkChoice', true);

        const deerData = await loadDeerData();
        const { dice, side } = rollDiceBigSmall();
        const win = choice === side;
        const result = settleImperialPk(
            deerData,
            this.e.user_id,
            session.kingId,
            session.date,
            session.day,
            { win },
        );
        await saveDeerData(deerData);

        const text = formatActionMessage(result, {
            helperName: this.e.sender.card || this.e.sender.nickname,
            targetName: session.kingName,
            dice,
            diceSide: side,
            choice,
        });
        await this.reply(`🎲 骰子：${dice}（${side}）· 你选：${choice}\n${text}`, true);
    }
}
