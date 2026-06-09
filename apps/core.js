import { ERROR_MESSAGES, UI_MESSAGES } from '../constants/game.js';
import { REG, cleanCommandMsg, formatMonthLabel, parseViewMonthToken } from '../constants/commands.js';
import { PROFESSION_LIST_TEXT, PROFESSION_SYNERGY_TEXT } from '../constants/profession.js';
import {
    getHelperQuotaSnapshot,
    getMonthData,
    getTodayStatus,
    getUserRecord,
    hasMonthData,
    performHelpLu,
    performLu,
    performSetProfession,
    performWithdrawal,
    performJobSkillInfo,
    performRangerPatrol,
    performGrinderRush,
    performMedicHealSkill,
    performAsceticCleanseSkill,
    performCurserBindSkill,
    performBlesserGrantSkill,
    performRogueNightRaidSkill,
} from '../utils/data.js';
import { canHelpFriend } from '../utils/friends.js';
import { generateImage } from '../utils/core.js';
import { loadGameContext } from '../utils/context.js';
import {
    replyDeerPanel,
    replyInteractionResult,
    replyProfessionCatalog,
    replyProfessionCard,
    replyStatusPanel,
    replyUserProfessionPanel,
} from '../utils/panel.js';
import {
    formatActionMessage,
    formatErrorMessage,
    formatHelperQuotaReply,
    formatViewEmpty,
} from '../utils/messages.js';
import {
    getMemberName,
    resolveHelpTargetId,
    resolveSubjectUser,
    resolveMedicSkillTargetId,
    resolveAsceticSkillTargetId,
    resolveTargetId,
} from '../utils/plugin-common.js';
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
                { reg: REG.profession, fnc: 'professionInfo' },
                { reg: REG.transferProfession, fnc: 'transferProfession' },
                { reg: REG.helperQuota, fnc: 'helperQuotaInfo' },
                { reg: REG.helpQuotaQuery, fnc: 'helpLuQuotaInfo' },
                { reg: REG.helpWithdrawQuotaQuery, fnc: 'helpWithdrawQuotaInfo' },
                { reg: REG.jobSkillInfo, fnc: 'jobSkillInfo' },
                { reg: REG.rangerPatrol, fnc: 'rangerPatrol' },
                { reg: REG.medicHealSkill, fnc: 'medicHealSkill' },
                { reg: REG.medicHealSkillAlt, fnc: 'medicHealSkill' },
                { reg: REG.asceticCleanseSkill, fnc: 'asceticCleanseSkill' },
                { reg: REG.grinderRush, fnc: 'grinderRush' },
                { reg: REG.curserBindSkill, fnc: 'curserBindSkill' },
                { reg: REG.blesserGrantSkill, fnc: 'blesserGrantSkill' },
                { reg: REG.rogueNightRaidSkill, fnc: 'rogueNightRaidSkill' },
            ],
        });
    }

    async lu() {
        const { user_id, card, nickname } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const ctx = await loadGameContext(date);
        const result = performLu(deerData, user_id, date, day, ctx);
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
        const subject = await resolveSubjectUser(this.e);
        const viewDate = parseViewMonthToken(this.e.msg);
        const deerData = await loadDeerData();
        const userRecord = getUserRecord(deerData, subject.userId);
        if (!hasMonthData(userRecord, viewDate)) {
            await this.reply(formatViewEmpty(formatMonthLabel(viewDate), subject.isAt), true);
            return;
        }

        const monthData = getMonthData(userRecord, viewDate);
        const raw = await generateImage(viewDate, subject.name, monthData, {
            highlightDay: viewDate.getDate(),
        });
        await this.reply([UI_MESSAGES.view_panel, segment.image(raw)], true);
    }

    async luStatus() {
        const subject = await resolveSubjectUser(this.e);
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const ctx = await loadGameContext(date);
        const status = getTodayStatus(
            getMonthData(getUserRecord(deerData, subject.userId), date),
            day,
            { weather: ctx.weatherState, weatherEffects: ctx.weatherEffects },
        );
        if (status.killerId) {
            status.killedByName = await getMemberName(this.e, status.killerId);
        }
        await replyStatusPanel(this.e, {
            date,
            name: subject.name,
            status,
            isAt: subject.isAt,
        });
    }

    async professionInfo() {
        const text = await this.buildQuotaReplyText('all', true);
        await replyProfessionCatalog(this.e, { text });
    }

    async helperQuotaInfo() {
        const { user_id } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const monthData = getMonthData(getUserRecord(await loadDeerData(), user_id), date);
        const text = await this.buildQuotaReplyText('all', false);
        await replyUserProfessionPanel(this.e, { monthData, day, text });
    }

    async helpLuQuotaInfo() {
        const text = await this.buildQuotaReplyText('help', false);
        await this.reply(text, true);
    }

    async helpWithdrawQuotaInfo() {
        const text = await this.buildQuotaReplyText('withdraw', false);
        await this.reply(text, true);
    }

    async buildQuotaReplyText(mode, withCatalog) {
        const { user_id } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const monthData = getMonthData(getUserRecord(await loadDeerData(), user_id), date);
        const snapshot = getHelperQuotaSnapshot(monthData, day);
        const lines = [formatHelperQuotaReply(snapshot, mode)];
        if (withCatalog) {
            lines.push('——', PROFESSION_LIST_TEXT, '——', '联动', PROFESSION_SYNERGY_TEXT);
            lines.push('——', '专属技（1次/日）', '鹿技 · 鹿巡 · 愈鹿@ · 清规@ · 卷王冲');
        }
        return lines.join('\n');
    }

    async transferProfession() {
        const msg = cleanCommandMsg(this.e.msg);
        const token = msg.replace(/^转职(?:🦌|鹿)?/, '').trim();
        if (!token) {
            await this.professionInfo();
            return;
        }
        const { user_id } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performSetProfession(deerData, user_id, token, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);
        const text = formatActionMessage(result);
        const monthData = getMonthData(getUserRecord(deerData, user_id), date);
        if (result.changed && result.profession?.id) {
            await replyProfessionCard(this.e, {
                professionId: result.profession.id,
                text,
                monthData,
                day,
            });
        } else {
            await replyUserProfessionPanel(this.e, { monthData, day, text });
        }
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
        const ctx = await loadGameContext(date);
        const result = performHelpLu(deerData, user_id, targetId, date, day, ctx);
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

    async jobSkillInfo() {
        const { user_id } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performJobSkillInfo(deerData, user_id, date, day);
        await this.reply(formatActionMessage(result), true);
    }

    async rangerPatrol() {
        const { user_id, card, nickname } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performRangerPatrol(deerData, user_id, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);
        await this.reply(formatActionMessage(result), true);
    }

    async grinderRush() {
        const { user_id, card, nickname } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const ctx = await loadGameContext(date);
        const result = performGrinderRush(deerData, user_id, date, day, ctx);
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

    async medicHealSkill() {
        const { user_id, card, nickname } = this.e.sender;
        const targetId = await resolveMedicSkillTargetId(this.e);
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
        const result = performMedicHealSkill(deerData, user_id, targetId, date, day, ctx);
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

    async asceticCleanseSkill() {
        const { user_id, card, nickname } = this.e.sender;
        const targetId = await resolveAsceticSkillTargetId(this.e);
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
        const result = performAsceticCleanseSkill(deerData, user_id, targetId, date, day);
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

    async _runTargetSkill(performFn, { needFriend = true } = {}) {
        const { user_id, card, nickname } = this.e.sender;
        const targetId = await resolveTargetId(this.e);
        if (!targetId) {
            await this.reply(ERROR_MESSAGES.no_target, true);
            return;
        }
        if (needFriend) {
            const friends = await loadFriends();
            if (!canHelpFriend(friends, user_id, targetId)) {
                await this.reply(ERROR_MESSAGES.not_friend, true);
                return;
            }
        }
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performFn(deerData, user_id, targetId, date, day);
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

    async curserBindSkill() {
        await this._runTargetSkill(performCurserBindSkill);
    }

    async blesserGrantSkill() {
        await this._runTargetSkill(performBlesserGrantSkill);
    }

    async rogueNightRaidSkill() {
        await this._runTargetSkill(performRogueNightRaidSkill, { needFriend: false });
    }
}
