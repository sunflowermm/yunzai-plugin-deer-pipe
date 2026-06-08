import {
    markImperialUsed,
    performHelpWithdrawal,
    performHelpQuotaClearance,
    performImperialClearance,
    performPlayfulClearance,
    performAmnestyAll,
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
    ARENA_CHOICE_PROMPTS,
    ARENA_DECLINE_MESSAGES,
    ARENA_PK_TIMEOUT_SEC,
    ARENA_STAKE,
    DAILY_IMPERIAL_QUOTA,
    ERROR_MESSAGES,
    IMPERIAL_CHOICE_PROMPTS,
    IMPERIAL_PK_HINTS,
    IMPERIAL_START_MESSAGES,
    IMPERIAL_TIMEOUT_MESSAGES,
    rollDiceBigSmall,
    pickRandom,
} from '../constants/game.js';
import { isDeerPrivileged } from '../utils/privilege.js';

import { formatActionMessage, formatErrorMessage } from '../utils/messages.js';

import { getMemberName, resolveTargetId } from '../utils/plugin-common.js';

import { replyInteractionResult } from '../utils/panel.js';
import { generateInteractionCard } from '../utils/card-render.js';

import { REG } from '../constants/commands.js';

import {
    armArenaSession,
    clearAllArenaSessions,
    clearArenaSession,
    findArenaSessionForTarget,
    isArenaTargetBusy,
    listArenaSessions,
} from '../utils/arena-session.js';

import { loadDeerData, loadFriends, saveDeerData } from '../utils/store.js';

import { loadGameContext } from '../utils/context.js';

import plugin from '../../../lib/plugins/plugin.js';

/**
 * 皇城鹿：setContext('imperialPkChoice') — 宣战者本人猜大小（用户级上下文）
 * 擂台鹿：bindUserContext(被挑战者) + arenaRespond — 仅被点名者监听冲/拒
 * loader 在 processRules 之前调用 handleContext，与本体 plugin 行为一致
 */
const imperialPkSessions = new Map();

const IMPERIAL_PK_TIMEOUT_SEC = 90;

function imperialSessionKey(e) {
    return `${e.group_id}:${e.user_id}`;
}

function clearImperialSession(e) {
    const key = imperialSessionKey(e);
    const session = imperialPkSessions.get(key);
    if (session?.timer) clearTimeout(session.timer);
    imperialPkSessions.delete(key);
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

export class DeerSpecial extends plugin {
    constructor() {
        super({
            name: '🦌管扩展',
            dsc: '同归鹿尽、帮戒鹿、擂台鹿、皇城鹿、鹿使后门（返照/清算/大赦）',
            event: 'message',
            priority: 5001,
            bypassThrottle: true,
            rule: [
                { reg: REG.together, fnc: 'togetherFall' },
                { reg: REG.helpWithdraw, fnc: 'helpWithdraw' },
                { reg: REG.privilegeRevive, fnc: 'privilegeRevive' },
                { reg: REG.imperialClearance, fnc: 'imperialClearance' },
                { reg: REG.deerClearance, fnc: 'helpQuotaClearance' },
                { reg: REG.playfulClearance, fnc: 'playfulClearance' },
                { reg: REG.amnestyAll, fnc: 'amnestyAll' },
                { reg: REG.arena, fnc: 'arenaChallenge' },
                { reg: REG.imperial, fnc: 'imperialStart' },
            ],
        });
    }

    clearArenaUserContexts() {
        const sessions = listArenaSessions();
        for (const s of sessions) {
            plugin.finishUserContext(
                s.pluginName || this.name,
                s.selfId ?? this.e.self_id,
                s.targetId,
                'arenaRespond',
            );
        }
        clearAllArenaSessions();
    }
    /** 特权指令统一入口 */
    async runPrivilege(performFn, afterSave) {
        const { user_id, card, nickname } = this.e.sender;
        if (!isDeerPrivileged(user_id)) {
            await this.reply(formatErrorMessage({ type: 'privilege_only' }), true);
            return;
        }

        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performFn(deerData, user_id, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }

        await saveDeerData(deerData);
        afterSave?.();
        await this.reply(formatActionMessage(result, { helperName: card || nickname }), true);
    }

    async privilegeRevive() {
        await this.runPrivilege(performPrivilegeRevive);
    }

    async helpQuotaClearance() {
        await this.runPrivilege(performHelpQuotaClearance);
    }

    async imperialClearance() {
        await this.runPrivilege(performImperialClearance, () => {
            clearAllImperialSessions();
            this.clearArenaUserContexts();
        });
    }

    async playfulClearance() {
        await this.runPrivilege(performPlayfulClearance, () => {
            this.clearArenaUserContexts();
        });
    }

    async amnestyAll() {
        await this.runPrivilege(performAmnestyAll, () => {
            clearAllImperialSessions();
            this.clearArenaUserContexts();
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
        await replyInteractionResult(this.e, {
            date,
            name: this.e.sender.card || this.e.sender.nickname,
            userId: user_id,
            deerData,
            text,
            result,
            helperName: this.e.sender.card || this.e.sender.nickname,
            targetName,
            helperId: user_id,
            targetId,
            dayOverride: day,
            withPanel: true,
            duel: true,
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
        const ctx = await loadGameContext(date);
        const result = performHelpWithdrawal(deerData, user_id, targetId, date, day, ctx);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }

        await saveDeerData(deerData);
        const targetName = await getMemberName(this.e, targetId);
        const text = formatActionMessage(result, { helperName: card || nickname, targetName });
        await replyInteractionResult(this.e, {
            date,
            name: targetName,
            userId: targetId,
            deerData,
            text,
            result,
            helperName: card || nickname,
            targetName,
            helperId: user_id,
            targetId,
            dayOverride: day,
            withPanel: true,
            duel: true,
        });
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

        if (isArenaTargetBusy(this.e.group_id, targetId)) {
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
        const pluginName = this.name;
        const selfId = this.e.self_id;
        armArenaSession(this.e.group_id, targetId, {
            challengerId: user_id,
            challengerName,
            targetId,
            targetName,
            date,
            day,
            pluginName,
            selfId,
        }, {
            onExpire: () => {
                plugin.finishUserContext(pluginName, selfId, targetId, 'arenaRespond');
            },
        });
        plugin.bindUserContext(
            pluginName,
            selfId,
            targetId,
            'arenaRespond',
            this.e,
            ARENA_PK_TIMEOUT_SEC,
        );
        const inviteCard = await generateInteractionCard({
            result: { type: 'arena_invite' },
            helperName: challengerName,
            targetName,
            helperId: user_id,
            targetId,
            duel: true,
            subtitle: `${ARENA_PK_TIMEOUT_SEC}s 内「冲」/「拒」`,
        });
        await this.reply([
            pickRandom(ARENA_CHALLENGE_MESSAGES),
            `\n${challengerName} → ${targetName}`,
            `${targetName} 请在 ${ARENA_PK_TIMEOUT_SEC} 秒内回复「冲」应战，或「拒」认怂（-1 次）！`,
            `规则：50% 胜负 · 败者 -${ARENA_STAKE} 次、胜者 +${ARENA_STAKE} 次 · 双方各计 1 次擂台`,
            segment.image(inviteCard),
        ], true);
    }
    /**
     * 用户级上下文：仅被挑战者回复冲/拒（handleContext 优先于 rule，且跳过群 CD）
     */
    async arenaRespond() {
        const session = findArenaSessionForTarget(this.e);
        if (!session) {
            plugin.finishUserContext(this.name, this.e.self_id, this.e.user_id, 'arenaRespond');
            return false;
        }

        const msg = this.e.msg?.trim();
        if (msg === '冲') {
            plugin.finishUserContext(this.name, this.e.self_id, this.e.user_id, 'arenaRespond');
            await this.settleArenaAccept(session);
            return true;
        }
        if (msg === '拒') {
            plugin.finishUserContext(this.name, this.e.self_id, this.e.user_id, 'arenaRespond');
            await this.settleArenaDecline(session);
            return true;
        }

        await this.reply(pickRandom(ARENA_CHOICE_PROMPTS), true);
        return true;
    }

    async settleArenaAccept(session) {
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
        await replyInteractionResult(this.e, {
            date: session.date,
            name: accepterName,
            userId: this.e.user_id,
            deerData,
            text,
            result,
            helperName: session.challengerName,
            targetName: session.targetName || accepterName,
            helperId: session.challengerId,
            targetId: session.targetId,
            dayOverride: session.day,
            withPanel: true,
            duel: true,
        });
    }

    async settleArenaDecline(session) {
        clearArenaSession(this.e.group_id, this.e.user_id);
        const deerData = await loadDeerData();
        const result = performArenaDecline(deerData, this.e.user_id, session.date, session.day);
        await saveDeerData(deerData);
        const accepterName = this.e.sender.card || this.e.sender.nickname;
        await replyInteractionResult(this.e, {
            text: [
                pickRandom(ARENA_DECLINE_MESSAGES),
                `${accepterName} 拒战 · 现 ${result.count} 次`,
                `${session.challengerName} 的战书已撕，可重新下帖`,
            ].join('\n'),
            result,
            helperName: session.challengerName,
            targetName: accepterName,
            helperId: session.challengerId,
            targetId: this.e.user_id,
            duel: true,
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
        const inviteCard = await generateInteractionCard({
            result: { type: 'imperial_invite', kingCount: king.sum },
            helperName: this.e.sender.card || this.e.sender.nickname,
            targetName: kingName,
            helperId: user_id,
            targetId: king.id,
            duel: true,
            subtitle: `${IMPERIAL_PK_TIMEOUT_SEC}s 内猜「大」/「小」`,
        });
        await this.reply([
            pickRandom(IMPERIAL_START_MESSAGES),
            pickRandom(IMPERIAL_PK_HINTS),
            `\n今日鹿王：${kingName}（${king.sum} 次）`,
            `请 ${IMPERIAL_PK_TIMEOUT_SEC} 秒内回复「大」或「小」掷骰决战！`,
            `赢：鹿王 -5 次 · 输：你 -3 次、鹿王 +3 次 · 今日皇城 ${DAILY_IMPERIAL_QUOTA} 次/人`,
            segment.image(inviteCard),
        ], true);
    }
    /**
     * 用户级上下文：皇城鹿猜大小（仅宣战者本人）
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
        await replyInteractionResult(this.e, {
            date: session.date,
            name: this.e.sender.card || this.e.sender.nickname,
            userId: this.e.user_id,
            deerData,
            text: `🎲 骰子：${dice}（${side}）· 你选：${choice}\n${text}`,
            result,
            helperName: this.e.sender.card || this.e.sender.nickname,
            targetName: session.kingName,
            helperId: this.e.user_id,
            targetId: session.kingId,
            extraLines: [`骰子 ${dice} · 开 ${side} · 你选 ${choice}`],
            dayOverride: session.day,
            withPanel: true,
            duel: true,
        });
    }

}
