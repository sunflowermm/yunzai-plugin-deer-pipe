import {
    performDreamDeer,
    performReviveLottery,
    performSpectralCurse,
    performTombstone,
    performVengeanceDeer,
    runDreamChainSession,
    runReviveLotteryChainSession,
    runSpectralCurseChainSession,
} from '../utils/data.js';
import { canHelpFriend } from '../utils/friends.js';
import { ERROR_MESSAGES } from '../constants/game.js';
import { formatActionMessage, formatErrorMessage } from '../utils/messages.js';
import { REG } from '../constants/commands.js';
import { getMemberName, resolveTargetId } from '../utils/plugin-common.js';
import { handleQuotaChainPlay } from '../utils/play-chain.js';
import { replyDeerPanel, replyInteractionResult } from '../utils/panel.js';
import { loadDeerData, loadFriends, saveDeerData } from '../utils/store.js';

export class DeerUndead extends plugin {
    constructor() {
        super({
            name: '🦌管冥界',
            dsc: '鹿死死亡生态：冥咒/索命/托梦/还阳签/鹿碑',
            event: 'message',
            priority: 5003,
            bypassThrottle: true,
            rule: [
                { reg: REG.spectralCurse, fnc: 'spectralCurse' },
                { reg: REG.vengeance, fnc: 'vengeanceDeer' },
                { reg: REG.dreamDeer, fnc: 'dreamDeer' },
                { reg: REG.reviveLottery, fnc: 'reviveLottery' },
                { reg: REG.chainReviveLottery, fnc: 'chainReviveLottery' },
                { reg: REG.chainSpectralCurse, fnc: 'chainSpectralCurse' },
                { reg: REG.chainDream, fnc: 'chainDream' },
                { reg: REG.tombstone, fnc: 'tombstone' },
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

    async runGhostTargetAction(fn, { needFriend = false, panelTarget = true } = {}) {
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
            await replyInteractionResult(this.e, {
                date,
                name: targetName,
                userId: panelTarget ? targetId : user_id,
                deerData,
                text,
                result,
                helperName,
                targetName,
                helperId: user_id,
                targetId,
                dayOverride: day,
                withPanel: panelTarget,
                duel: !!targetId,
            });
        } else {
            await replyInteractionResult(this.e, {
                text,
                result,
                helperName,
                targetName,
                helperId: user_id,
                targetId,
                duel: !!targetId,
            });
        }
    }

    async spectralCurse() {
        await this.runGhostTargetAction(performSpectralCurse, { panelTarget: false });
    }

    async vengeanceDeer() {
        await this.runGhostTargetAction(performVengeanceDeer, { panelTarget: false });
    }

    async dreamDeer() {
        await this.runGhostTargetAction(performDreamDeer, { needFriend: true, panelTarget: false });
    }

    async reviveLottery() {
        const { user_id, card, nickname } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performReviveLottery(deerData, user_id, date, day);
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
            text: formatActionMessage(result, { helperName: card || nickname }),
            dayOverride: day,
        });
    }

    async chainReviveLottery() {
        await handleQuotaChainPlay(this.e, {
            kind: 'reviveLottery',
            caption: '连还阳签！抽至还阳或配额用尽（详情见聊天记录）',
            forwardTitle: '🪷 连还阳签记录',
            endHint: '…还阳成功或配额耗尽',
            runSession: (deerData, userId, date, day) => runReviveLotteryChainSession(
                deerData, userId, date, day,
            ),
            afterSuccess: async ({ deerData, session, date, day, helperName, userId }) => {
                if (!session.revived) return;
                const last = session.results?.[session.results.length - 1];
                if (!last) return;
                await replyDeerPanel(this.e, {
                    date,
                    name: helperName,
                    userId,
                    deerData,
                    text: formatActionMessage(last, { helperName }),
                    dayOverride: day,
                });
            },
        });
    }

    async chainSpectralCurse() {
        const { user_id } = this.e.sender;
        const targetId = await resolveTargetId(this.e);
        if (!targetId) {
            await this.reply(ERROR_MESSAGES.no_target, true);
            return;
        }
        const targetName = await getMemberName(this.e, targetId);
        await handleQuotaChainPlay(this.e, {
            kind: 'spectralCurse',
            caption: '连冥咒！叠层/续回合至配额用尽（详情见聊天记录）',
            forwardTitle: '👻 连冥咒记录',
            messageCtx: { targetName },
            runSession: (deerData, ghostId, date, day) => runSpectralCurseChainSession(
                deerData, ghostId, targetId, date, day,
            ),
        });
    }

    async chainDream() {
        const { user_id } = this.e.sender;
        const targetId = await resolveTargetId(this.e);
        if (!targetId) {
            await this.reply(ERROR_MESSAGES.no_target, true);
            return;
        }
        if (!(await this.requireFriend(user_id, targetId))) return;
        const targetName = await getMemberName(this.e, targetId);
        await handleQuotaChainPlay(this.e, {
            kind: 'dream',
            caption: '连托梦！缓咒/贴催更符至配额用尽（详情见聊天记录）',
            forwardTitle: '💤 连托梦记录',
            messageCtx: { targetName },
            runSession: (deerData, ghostId, date, day) => runDreamChainSession(
                deerData, ghostId, targetId, date, day,
            ),
        });
    }

    async tombstone() {
        const { user_id, card, nickname } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performTombstone(deerData, user_id, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        let killerName = '';
        if (result.killerId) {
            killerName = await getMemberName(this.e, result.killerId);
        }
        await this.reply(
            formatActionMessage(result, { helperName: card || nickname, targetName: killerName }),
            true,
        );
    }
}
