import {
    markImperialUsed,
    performHelpWithdrawal,
    performPrivilegeRevive,
    performTogetherFall,
    settleImperialPk,
    validateImperialStart,
} from '../utils/data.js';
import { canHelpFriend } from '../utils/friends.js';
import {
    ERROR_MESSAGES,
    IMPERIAL_CHOICE_PROMPTS,
    IMPERIAL_PK_HINTS,
    IMPERIAL_START_MESSAGES,
    IMPERIAL_TIMEOUT_MESSAGES,
    rollDiceBigSmall,
    pickRandom,
} from '../constants/game.js';
import { formatActionMessage, formatErrorMessage } from '../utils/messages.js';
import { loadDeerData, loadFriends, saveDeerData } from '../utils/store.js';

/** 皇城鹿待选 session（群:用户 → 决斗信息，与 setContext 用户级上下文配套） */
const imperialPkSessions = new Map();
const IMPERIAL_PK_TIMEOUT_SEC = 90;

function sessionKey(e) {
    return `${e.group_id}:${e.user_id}`;
}

function clearImperialSession(e) {
    const key = sessionKey(e);
    const session = imperialPkSessions.get(key);
    if (session?.timer) clearTimeout(session.timer);
    imperialPkSessions.delete(key);
}

/** 绑定用户级 session，超时与 setContext 同步清理 */
function armImperialSession(e, data) {
    clearImperialSession(e);
    const key = sessionKey(e);
    const timer = setTimeout(() => {
        imperialPkSessions.delete(key);
    }, IMPERIAL_PK_TIMEOUT_SEC * 1000);
    imperialPkSessions.set(key, { ...data, timer });
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
                { reg: '^回(鹿返照|🦌返照)$', fnc: 'privilegeRevive' },
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
        const membersMap = await e.group.getMemberMap();
        const members = Array.from(membersMap.keys());
        const check = validateImperialStart(deerData, user_id, date, day, members);
        if (!check.ok) {
            e.reply(formatErrorMessage(check), true);
            return;
        }

        const king = check.king;
        if (!markImperialUsed(deerData, user_id, date, day)) {
            e.reply(formatErrorMessage({ type: 'imperial_used' }), true);
            return;
        }
        await saveDeerData(deerData);

        const kingName = await this.getMemberName(e, king.id);

        // 清理旧版群级上下文（isGroup=true）及当前用户 session，避免互相抢占
        this.finish('imperialPkChoice', true);
        this.finish('imperialPkChoice', false);

        armImperialSession(e, {
            kingId: king.id,
            kingName,
            kingCount: king.sum,
            date,
            day,
        });

        // 用户级上下文：每人独立，群内他人发言不会触发/清除
        this.setContext(
            'imperialPkChoice',
            false,
            IMPERIAL_PK_TIMEOUT_SEC,
            pickRandom(IMPERIAL_TIMEOUT_MESSAGES),
        );

        await e.reply([
            pickRandom(IMPERIAL_START_MESSAGES),
            pickRandom(IMPERIAL_PK_HINTS),
            `\n今日鹿王：${kingName}（${king.sum} 次）`,
            `请 ${IMPERIAL_PK_TIMEOUT_SEC} 秒内回复「大」或「小」掷骰决战！`,
            '赢：鹿王今日 -5 次 · 输：你今日 -3 次',
        ].join('\n'), true);
    }

    /**
     * 上下文：皇城鹿猜大小（仅宣战者本人触发，见 setContext isGroup=false）
     * @returns {'continue'|void}
     */
    async imperialPkChoice() {
        const key = sessionKey(this.e);
        const session = imperialPkSessions.get(key);

        if (!session) {
            // session 已过期或未宣战：结束残留上下文，不拦截他人消息
            this.finish('imperialPkChoice', false);
            return 'continue';
        }

        const choice = this.e.msg.trim();
        if (!/^(大|小)$/.test(choice)) {
            await this.reply(pickRandom(IMPERIAL_CHOICE_PROMPTS), true);
            return 'continue';
        }

        clearImperialSession(this.e);
        this.finish('imperialPkChoice', false);

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
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
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
