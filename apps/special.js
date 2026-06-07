import {
    markImperialUsed,
    performHelpWithdrawal,
    performHelpQuotaClearance,
    performImperialClearance,
    performPrivilegeRevive,
    performTogetherFall,
    performArenaDecline,
    settleArenaPk,
    settleImperialPk,
    validateArenaStart,
    validateImperialStart,
} from '../utils/data.js';
import { canHelpFriend } from '../utils/friends.js';
import {
    ARENA_CHALLENGE_MESSAGES,
    ARENA_DECLINE_MESSAGES,
    ARENA_PK_TIMEOUT_SEC,
    DAILY_IMPERIAL_QUOTA,
    ERROR_MESSAGES,
    IMPERIAL_CHOICE_PROMPTS,
    IMPERIAL_PK_HINTS,
    IMPERIAL_START_MESSAGES,
    IMPERIAL_TIMEOUT_MESSAGES,
    isPrivileged,
    rollDiceBigSmall,
    pickRandom,
} from '../constants/game.js';
import { formatActionMessage, formatErrorMessage } from '../utils/messages.js';
import { getMemberName, resolveTargetId } from '../utils/plugin-common.js';
import { replyDeerPanel } from '../utils/panel.js';
import { REG } from '../constants/commands.js';
import { loadDeerData, loadFriends, saveDeerData } from '../utils/store.js';

/**
 * 皇城鹿：setContext + imperialPkSessions（同一用户猜大小，符合 plugin 基类上下文）
 * 擂台鹿：arenaChallengeSessions（被挑战者应战，无法对他人 setContext，故用群级 Map）
 */
const imperialPkSessions = new Map();
const arenaChallengeSessions = new Map();
const IMPERIAL_PK_TIMEOUT_SEC = 90;

function imperialSessionKey(e) {
    return `${e.group_id}:${e.user_id}`;
}

function arenaSessionKey(groupId, targetId) {
    return `${groupId}:${targetId}`;
}

function clearImperialSession(e) {
    const key = imperialSessionKey(e);
    const session = imperialPkSessions.get(key);
    if (session?.timer) clearTimeout(session.timer);
    imperialPkSessions.delete(key);
}

function clearArenaSession(groupId, targetId) {
    const key = arenaSessionKey(groupId, targetId);
    const session = arenaChallengeSessions.get(key);
    if (session?.timer) clearTimeout(session.timer);
    arenaChallengeSessions.delete(key);
}

function clearAllArenaSessions() {
    for (const session of arenaChallengeSessions.values()) {
        if (session?.timer) clearTimeout(session.timer);
    }
    arenaChallengeSessions.clear();
}

function clearAllImperialSessions() {
    for (const session of imperialPkSessions.values()) {
        if (session?.timer) clearTimeout(session.timer);
    }
    imperialPkSessions.clear();
}

function armImperialSession(e, data) {
    clearImperialSession(e);
    const key = imperialSessionKey(e);
    const timer = setTimeout(() => {
        imperialPkSessions.delete(key);
    }, IMPERIAL_PK_TIMEOUT_SEC * 1000);
    imperialPkSessions.set(key, { ...data, timer });
}

function armArenaSession(groupId, targetId, data) {
    clearArenaSession(groupId, targetId);
    const key = arenaSessionKey(groupId, targetId);
    const timer = setTimeout(() => {
        arenaChallengeSessions.delete(key);
    }, ARENA_PK_TIMEOUT_SEC * 1000);
    arenaChallengeSessions.set(key, { ...data, timer });
}

function findArenaSessionForTarget(e) {
    return arenaChallengeSessions.get(arenaSessionKey(e.group_id, e.user_id)) || null;
}

export class DeerSpecial extends plugin {
    constructor() {
        super({
            name: '🦌管扩展',
            dsc: '同归鹿尽、帮戒鹿、擂台鹿、皇城鹿、特权回鹿返照/皇城清算/鹿清算',
            event: 'message',
            priority: 5001,
            rule: [
                { reg: REG.together, fnc: 'togetherFall' },
                { reg: REG.helpWithdraw, fnc: 'helpWithdraw' },
                { reg: REG.privilegeRevive, fnc: 'privilegeRevive' },
                { reg: REG.imperialClearance, fnc: 'imperialClearance' },
                { reg: REG.deerClearance, fnc: 'helpQuotaClearance' },
                { reg: REG.arena, fnc: 'arenaChallenge' },
                { reg: REG.arenaAccept, fnc: 'arenaAccept' },
                { reg: REG.arenaDecline, fnc: 'arenaDecline' },
                { reg: REG.imperial, fnc: 'imperialStart' },
            ],
        });
    }

    async togetherFall() {
        const { user_id } = this.e.sender;
        const targetId = await resolveTargetId(this.e);
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
        const result = performTogetherFall(deerData, user_id, targetId, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);

        const targetName = await getMemberName(this.e, targetId);
        const text = formatActionMessage(result, {
            helperName: this.e.sender.card || this.e.sender.nickname,
            targetName,
        });
        await replyDeerPanel(this.e, {
            date,
            name: this.e.sender.card || this.e.sender.nickname,
            userId: user_id,
            deerData,
            text,
            dayOverride: day,
        });
    }

    async helpWithdraw() {
        const { user_id, card, nickname } = this.e.sender;
        const targetId = await resolveTargetId(this.e);
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
        const result = performHelpWithdrawal(deerData, user_id, targetId, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);

        const targetName = await getMemberName(this.e, targetId);
        const text = formatActionMessage(result, { helperName: card || nickname, targetName });
        await replyDeerPanel(this.e, {
            date,
            name: targetName,
            userId: targetId,
            deerData,
            text,
            dayOverride: day,
        });
    }

    /** 特权：回鹿返照（仅 PRIVILEGED_QQ） */
    async privilegeRevive() {
        const { user_id, card, nickname } = this.e.sender;
        if (!isPrivileged(user_id)) {
            await this.reply(formatErrorMessage({ type: 'privilege_only' }), true);
            return;
        }

        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performPrivilegeRevive(deerData, user_id, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);
        await this.reply(formatActionMessage(result, { helperName: card || nickname }), true);
    }

    /** 特权：鹿清算（仅 PRIVILEGED_QQ，全员当日帮🦌/帮戒🦌配额重置） */
    async helpQuotaClearance() {
        const { user_id, card, nickname } = this.e.sender;
        if (!isPrivileged(user_id)) {
            await this.reply(formatErrorMessage({ type: 'privilege_only' }), true);
            return;
        }

        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performHelpQuotaClearance(deerData, user_id, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);
        await this.reply(formatActionMessage(result, { helperName: card || nickname }), true);
    }

    /** 特权：皇城清算（仅 PRIVILEGED_QQ，全员当日皇城鹿机会重置） */
    async imperialClearance() {
        const { user_id, card, nickname } = this.e.sender;
        if (!isPrivileged(user_id)) {
            await this.reply(formatErrorMessage({ type: 'privilege_only' }), true);
            return;
        }

        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performImperialClearance(deerData, user_id, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);

        clearAllImperialSessions();
        clearAllArenaSessions();

        await this.reply(formatActionMessage(result, { helperName: card || nickname }), true);
    }

    async arenaChallenge() {
        if (!this.e.isGroup) {
            await this.reply(ERROR_MESSAGES.arena_need_group, true);
            return;
        }

        const { user_id, card, nickname } = this.e.sender;
        const targetId = await resolveTargetId(this.e);
        if (!targetId) {
            await this.reply(ERROR_MESSAGES.no_target, true);
            return;
        }

        if (findArenaSessionForTarget({ group_id: this.e.group_id, user_id: targetId })) {
            await this.reply(formatErrorMessage({ type: 'arena_busy' }), true);
            return;
        }

        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const check = validateArenaStart(deerData, user_id, targetId, date, day);
        if (!check.ok) {
            await this.reply(formatErrorMessage(check), true);
            return;
        }

        const challengerName = card || nickname;
        const targetName = await getMemberName(this.e, targetId);

        armArenaSession(this.e.group_id, targetId, {
            challengerId: user_id,
            challengerName,
            targetId,
            targetName,
            date,
            day,
        });

        await this.reply([
            pickRandom(ARENA_CHALLENGE_MESSAGES),
            `\n${challengerName} → ${targetName}`,
            `${targetName} 请在 ${ARENA_PK_TIMEOUT_SEC} 秒内回复「冲」应战，或「拒」认怂（-1 次）！`,
            `规则：50% 胜负 · 败者 -5 次、胜者 +5 次 · 双方各计 1 次擂台`,
        ].join('\n'), true);
    }

    async arenaDecline() {
        if (!this.e.isGroup) {
            await this.reply(ERROR_MESSAGES.arena_need_group, true);
            return;
        }

        const session = findArenaSessionForTarget(this.e);
        if (!session) {
            await this.reply(formatErrorMessage({ type: 'arena_no_pending' }), true);
            return;
        }

        clearArenaSession(this.e.group_id, this.e.user_id);

        const deerData = await loadDeerData();
        const result = performArenaDecline(deerData, this.e.user_id, session.date, session.day);
        await saveDeerData(deerData);

        const accepterName = this.e.sender.card || this.e.sender.nickname;
        await this.reply([
            pickRandom(ARENA_DECLINE_MESSAGES),
            `${accepterName} 拒战 · 现 ${result.count} 次`,
            `${session.challengerName} 的战书已撕，可重新下帖`,
        ].join('\n'), true);
    }

    async arenaAccept() {
        if (!this.e.isGroup) {
            await this.reply(ERROR_MESSAGES.arena_need_group, true);
            return;
        }

        const session = findArenaSessionForTarget(this.e);
        if (!session) {
            await this.reply(formatErrorMessage({ type: 'arena_no_pending' }), true);
            return;
        }

        clearArenaSession(this.e.group_id, this.e.user_id);

        const deerData = await loadDeerData();
        const result = settleArenaPk(
            deerData,
            session.challengerId,
            session.targetId,
            session.date,
            session.day,
        );
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);

        const accepterName = this.e.sender.card || this.e.sender.nickname;
        const text = formatActionMessage(result, {
            helperName: session.challengerName,
            targetName: session.targetName || accepterName,
            accepterName,
        });
        await replyDeerPanel(this.e, {
            date: session.date,
            name: accepterName,
            userId: this.e.user_id,
            deerData,
            text,
            dayOverride: session.day,
        });
    }

    async imperialStart() {
        if (!this.e.isGroup) {
            await this.reply(ERROR_MESSAGES.imperial_need_group, true);
            return;
        }

        const { user_id } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const members = Array.from((await this.e.group.getMemberMap()).keys());
        const check = validateImperialStart(deerData, user_id, date, day, members);
        if (!check.ok) {
            await this.reply(formatErrorMessage(check), true);
            return;
        }

        const king = check.king;
        if (!markImperialUsed(deerData, user_id, date, day)) {
            await this.reply(formatErrorMessage({ type: 'imperial_used' }), true);
            return;
        }
        await saveDeerData(deerData);

        const kingName = await getMemberName(this.e, king.id);

        this.finish('imperialPkChoice', true);
        this.finish('imperialPkChoice', false);

        armImperialSession(this.e, {
            kingId: king.id,
            kingName,
            kingCount: king.sum,
            date,
            day,
        });

        this.setContext(
            'imperialPkChoice',
            false,
            IMPERIAL_PK_TIMEOUT_SEC,
            pickRandom(IMPERIAL_TIMEOUT_MESSAGES),
        );

        await this.reply([
            pickRandom(IMPERIAL_START_MESSAGES),
            pickRandom(IMPERIAL_PK_HINTS),
            `\n今日鹿王：${kingName}（${king.sum} 次）`,
            `请 ${IMPERIAL_PK_TIMEOUT_SEC} 秒内回复「大」或「小」掷骰决战！`,
            `赢：鹿王 -5 次 · 输：你 -3 次、鹿王 +3 次 · 今日皇城 ${DAILY_IMPERIAL_QUOTA} 次/人`,
        ].join('\n'), true);
    }

    /**
     * 上下文：皇城鹿猜大小（仅宣战者本人触发，见 setContext isGroup=false）
     * @returns {'continue'|void}
     */
    async imperialPkChoice() {
        const key = imperialSessionKey(this.e);
        const session = imperialPkSessions.get(key);

        if (!session) {
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
        await replyDeerPanel(this.e, {
            date: session.date,
            name: this.e.sender.card || this.e.sender.nickname,
            userId: this.e.user_id,
            deerData,
            text: `🎲 骰子：${dice}（${side}）· 你选：${choice}\n${text}`,
            dayOverride: session.day,
        });
    }
}
