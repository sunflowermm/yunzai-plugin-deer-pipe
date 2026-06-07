import {
    performCurseDeer,
    performDeerHowl,
    performFakeWithdrawal,
    performGreedDeer,
    performGroupSplash,
    performSacrificeDeer,
    performStealDeer,
    performUrgeDeer,
} from '../utils/data.js';
import { canHelpFriend } from '../utils/friends.js';
import { ERROR_MESSAGES } from '../constants/game.js';
import { formatActionMessage, formatErrorMessage } from '../utils/messages.js';
import { REG } from '../constants/commands.js';
import { getMemberName, resolveTargetId } from '../utils/plugin-common.js';
import { replyDeerPanel } from '../utils/panel.js';
import { loadDeerData, loadFriends, saveDeerData } from '../utils/store.js';

export class DeerPlayful extends plugin {
    constructor() {
        super({
            name: '🦌管恶趣味',
            dsc: '偷/咒/献祭/诈戒/催/鸣/倒贴/群溅（鹿与🦌等价）',
            event: 'message',
            priority: 5002,
            bypassThrottle: true,
            rule: [
                { reg: REG.steal, fnc: 'stealDeer' },
                { reg: REG.curse, fnc: 'curseDeer' },
                { reg: REG.sacrifice, fnc: 'sacrificeDeer' },
                { reg: REG.fakeWithdraw, fnc: 'fakeWithdraw' },
                { reg: REG.urge, fnc: 'urgeDeer' },
                { reg: REG.howl, fnc: 'deerHowl' },
                { reg: REG.greed, fnc: 'greedDeer' },
                { reg: REG.groupSplash, fnc: 'groupSplash' },
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

    async runTargetAction(fn, { needFriend = true, panelTarget = true } = {}) {
        const { user_id, card, nickname } = this.e.sender;
        const targetId = await resolveTargetId(this.e);
        if (!targetId) {
            await this.reply(ERROR_MESSAGES.no_target, true);
            return;
        }
        if (needFriend && !(await this.requireFriend(user_id, targetId))) return;

        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = fn(deerData, user_id, targetId, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);

        const helperName = card || nickname;
        const targetName = await getMemberName(this.e, targetId);
        const text = formatActionMessage(result, { helperName, targetName });

        if (panelTarget) {
            await replyDeerPanel(this.e, {
                date,
                name: targetName,
                userId: targetId,
                deerData,
                text,
                dayOverride: day,
            });
        } else {
            await this.reply(text, true);
        }
    }

    async stealDeer() {
        await this.runTargetAction(performStealDeer);
    }

    async curseDeer() {
        await this.runTargetAction(performCurseDeer, { panelTarget: false });
    }

    async sacrificeDeer() {
        await this.runTargetAction(performSacrificeDeer);
    }

    async urgeDeer() {
        await this.runTargetAction(performUrgeDeer, { panelTarget: false });
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
        await replyDeerPanel(this.e, {
            date,
            name: card || nickname,
            userId: user_id,
            deerData,
            text: formatActionMessage(result),
            dayOverride: day,
        });
    }

    async deerHowl() {
        const { user_id, card, nickname } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performDeerHowl(deerData, user_id, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);
        await this.reply(formatActionMessage(result, { helperName: card || nickname }), true);
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
        const result = performGroupSplash(deerData, user_id, members, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);

        const victimLines = await Promise.all(
            result.victims.slice(0, 8).map(async (v) => {
                const name = await getMemberName(this.e, v.id);
                const curse = v.cursed ? '☠️咒' : '';
                return `${name} ${v.count}次${curse}`;
            }),
        );
        const more = result.victims.length > 8 ? `\n…另有 ${result.victims.length - 8} 人溅到` : '';

        await this.reply([
            formatActionMessage(result, { helperName: card || nickname }),
            victimLines.join(' · ') + more,
        ].join('\n'), true);
    }
}
