import {
    performBorrowDeer,
    performBumperDeer,
    performCleanseCurse,
    performCurseDeer,
    performDeerHowl,
    performDeerLottery,
    performFakeWithdrawal,
    performGreedDeer,
    performGroupSplash,
    performSacrificeDeer,
    performStealDeer,
    performUrgeDeer,
    runCurseChainSession,
    runFakeWithdrawChainSession,
    runHowlChainSession,
    runLotteryChainSession,
    runUrgeChainSession,
} from '../utils/data.js';
import { canHelpFriend } from '../utils/friends.js';
import { ERROR_MESSAGES } from '../constants/game.js';
import { formatActionMessage, formatErrorMessage } from '../utils/messages.js';
import { REG } from '../constants/commands.js';
import { getMemberName, resolveTargetId } from '../utils/plugin-common.js';
import { loadGameContext } from '../utils/context.js';
import { handleQuotaChainPlay } from '../utils/play-chain.js';
import { replyInteractionResult } from '../utils/panel.js';
import { loadDeerData, loadFriends, saveDeerData } from '../utils/store.js';

export class DeerPlayful extends plugin {
    constructor() {
        super({
            name: '🦌管恶趣味',
            dsc: '偷/咒/借/碰瓷/鹿签/献祭/诈戒/催/鸣/倒贴/群溅（鹿与🦌等价）',
            event: 'message',
            priority: 5002,
            bypassThrottle: true,
            rule: [
                { reg: REG.steal, fnc: 'stealDeer' },
                { reg: REG.curse, fnc: 'curseDeer' },
                { reg: REG.cleanseCurse, fnc: 'cleanseCurse' },
                { reg: REG.sacrifice, fnc: 'sacrificeDeer' },
                { reg: REG.fakeWithdraw, fnc: 'fakeWithdraw' },
                { reg: REG.urge, fnc: 'urgeDeer' },
                { reg: REG.howl, fnc: 'deerHowl' },
                { reg: REG.greed, fnc: 'greedDeer' },
                { reg: REG.groupSplash, fnc: 'groupSplash' },
                { reg: REG.borrow, fnc: 'borrowDeer' },
                { reg: REG.bumper, fnc: 'bumperDeer' },
                { reg: REG.lottery, fnc: 'deerLottery' },
                { reg: REG.chainUrge, fnc: 'chainUrge' },
                { reg: REG.chainLottery, fnc: 'chainLottery' },
                { reg: REG.chainHowl, fnc: 'chainHowl' },
                { reg: REG.chainFakeWithdraw, fnc: 'chainFakeWithdraw' },
                { reg: REG.chainCurse, fnc: 'chainCurse' },
            ],
        });
    }

    async requireFriend(userId, targetId) {
        const friends = await loadFriends();
        if (!canHelpFriend(friends, userId, targetId)) {
            await this.reply(ERROR_MESSAGES.not_friend, true);
            return false;
        }
        return true;
    }

    async runTargetAction(fn, { needFriend = true, withPanel = true, selfIfNoTarget = false } = {}) {
        const { user_id, card, nickname } = this.e.sender;
        let targetId = await resolveTargetId(this.e);
        if (!targetId) {
            if (selfIfNoTarget) targetId = user_id;
            else {
                await this.reply(ERROR_MESSAGES.no_target, true);
                return;
            }
        }
        if (needFriend && String(targetId) !== String(user_id) && !(await this.requireFriend(user_id, targetId))) return;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const ctx = await loadGameContext(date);
        const result = fn(deerData, user_id, targetId, date, day, ctx);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);
        const helperName = card || nickname;
        const targetName = await getMemberName(this.e, targetId);
        const text = formatActionMessage(result, { helperName, targetName });
        await replyInteractionResult(this.e, {
            text,
            result,
            helperName,
            targetName,
            helperId: user_id,
            targetId,
            date,
            name: withPanel ? targetName : helperName,
            userId: withPanel ? targetId : user_id,
            deerData,
            dayOverride: day,
            withPanel,
            duel: true,
        });
    }

    async stealDeer() {
        await this.runTargetAction(performStealDeer);
    }

    async curseDeer() {
        await this.runTargetAction(performCurseDeer, { withPanel: false });
    }

    async cleanseCurse() {
        await this.runTargetAction(performCleanseCurse, { withPanel: false });
    }

    async sacrificeDeer() {
        await this.runTargetAction(performSacrificeDeer);
    }

    async urgeDeer() {
        await this.runTargetAction(performUrgeDeer, { withPanel: false, selfIfNoTarget: true });
    }

    async greedDeer() {
        await this.runTargetAction(performGreedDeer);
    }

    async fakeWithdraw() {
        const { user_id, card, nickname } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performFakeWithdrawal(deerData, user_id, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);
        const helperName = card || nickname;
        const text = formatActionMessage(result);
        await replyInteractionResult(this.e, {
            text,
            result,
            helperName,
            date,
            name: helperName,
            userId: user_id,
            deerData,
            dayOverride: day,
            withPanel: true,
        });
    }

    async deerHowl() {
        const { user_id, card, nickname } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const ctx = await loadGameContext(date);
        const result = performDeerHowl(deerData, user_id, date, day, ctx);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);
        const helperName = card || nickname;
        const text = formatActionMessage(result, { helperName });
        await replyInteractionResult(this.e, {
            text,
            result,
            helperName,
            date,
            name: helperName,
            userId: user_id,
            deerData,
            dayOverride: day,
            withPanel: false,
        });
    }

    async borrowDeer() {
        await this.runTargetAction(performBorrowDeer);
    }

    async bumperDeer() {
        await this.runTargetAction(performBumperDeer, { needFriend: false });
    }

    async deerLottery() {
        const { user_id, card, nickname } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const ctx = await loadGameContext(date);
        const result = performDeerLottery(deerData, user_id, date, day, ctx);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);
        const helperName = card || nickname;
        const text = formatActionMessage(result, { helperName });
        await replyInteractionResult(this.e, {
            text,
            result,
            helperName,
            date,
            name: helperName,
            userId: user_id,
            deerData,
            dayOverride: day,
            withPanel: true,
        });
    }

    async groupSplash() {
        if (!this.e.isGroup) {
            await this.reply(ERROR_MESSAGES.splash_need_group, true);
            return;
        }

        const { user_id, card, nickname } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const members = Array.from((await this.e.group.getMemberMap()).keys());
        const deerData = await loadDeerData();
        const ctx = await loadGameContext(date);
        const result = performGroupSplash(deerData, user_id, members, date, day, ctx);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);
        const victimLines = await Promise.all(
            result.victims.map(async (v) => {
                const name = await getMemberName(this.e, v.id);
                const tags = [
                    v.cursed ? `☠️${v.stacks}层` : '',
                    v.burst ? '💥爆' : '',
                ].filter(Boolean).join('');
                return `${name} ${v.count}次${tags ? ` ${tags}` : ''}`;
            }),
        );
        const helperName = card || nickname;
        const text = formatActionMessage(result, { helperName });
        await replyInteractionResult(this.e, {
            text,
            result,
            helperName,
            extraLines: victimLines,
            date,
            name: helperName,
            userId: user_id,
            deerData,
            dayOverride: day,
            withPanel: false,
        });
    }

    async runTargetChainCommand(kind, {
        runSession,
        caption,
        forwardTitle,
        needFriend = true,
        selfIfNoTarget = false,
    }) {
        const { user_id } = this.e.sender;
        let targetId = await resolveTargetId(this.e);
        if (!targetId) {
            if (selfIfNoTarget) targetId = user_id;
            else {
                await this.reply(ERROR_MESSAGES.no_target, true);
                return;
            }
        }
        if (needFriend && String(targetId) !== String(user_id) && !(await this.requireFriend(user_id, targetId))) return;
        const targetName = await getMemberName(this.e, targetId);
        await handleQuotaChainPlay(this.e, {
            kind,
            caption,
            forwardTitle,
            messageCtx: { targetName },
            runSession: (deerData, userId, date, day, ctx) => runSession(
                deerData, userId, targetId, date, day, ctx,
            ),
        });
    }

    async chainUrge() {
        await this.runTargetChainCommand('urge', {
            caption: '连催鹿！叠催更符至配额用尽（详情见聊天记录）',
            forwardTitle: '⏰ 连催鹿记录',
            needFriend: true,
            selfIfNoTarget: true,
            runSession: (deerData, userId, targetId, date, day) => runUrgeChainSession(
                deerData, userId, targetId, date, day,
            ),
        });
    }

    async chainLottery() {
        await handleQuotaChainPlay(this.e, {
            kind: 'lottery',
            caption: '连抽鹿签！自动抽至配额用尽（详情见聊天记录）',
            forwardTitle: '🎴 连抽鹿签记录',
            runSession: (deerData, userId, date, day, ctx) => runLotteryChainSession(
                deerData, userId, date, day, ctx,
            ),
        });
    }

    async chainHowl() {
        await handleQuotaChainPlay(this.e, {
            kind: 'howl',
            caption: '连鹿鸣！带咒时逐次震咒至清（详情见聊天记录）',
            forwardTitle: '📣 连鹿鸣记录',
            endHint: '…咒已清或配额耗尽',
            runSession: (deerData, userId, date, day, ctx) => runHowlChainSession(
                deerData, userId, date, day, ctx,
            ),
        });
    }

    async chainFakeWithdraw() {
        await handleQuotaChainPlay(this.e, {
            kind: 'fakeWithdraw',
            caption: '连诈戒！嘴上戒🦌至配额用尽（详情见聊天记录）',
            forwardTitle: '🎭 连诈戒记录',
            runSession: (deerData, userId, date, day) => runFakeWithdrawChainSession(
                deerData, userId, date, day,
            ),
        });
    }

    async chainCurse() {
        await this.runTargetChainCommand('curse', {
            caption: '连鹿咒！叠层/续回合至配额用尽（详情见聊天记录）',
            forwardTitle: '☠️ 连鹿咒记录',
            needFriend: true,
            runSession: (deerData, userId, targetId, date, day, ctx) => runCurseChainSession(
                deerData, userId, targetId, date, day, ctx,
            ),
        });
    }
}
