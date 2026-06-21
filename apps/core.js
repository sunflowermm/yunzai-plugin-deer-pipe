import { ERROR_MESSAGES, UI_MESSAGES, DEER_CART_DEPART_TIMEOUT_SEC } from '../constants/game.js';
import { getProfessionDef, resolveProfessionId } from '../constants/profession.js';
import { getExtraDeerDef, isExtraDeerId, resolveExtraDeerId } from '../constants/extra-deer.js';
import { REG, cleanCommandMsg, formatMonthLabel, parseViewMonthToken } from '../constants/commands.js';
import {
    getHelperQuotaSnapshot,
    getMonthData,
    getTodayStatus,
    getUserRecord,
    hasMonthData,
    ensureMonthData,
    performHelpLu,
    performLu,
    runDeerCartSession,
    runSoloLuSession,
    performSetProfession,
    performWithdrawal,
    performJobSkillInfo,
    performRangerPatrol,
    performGrinderRush,
    performMedicHealSkill,
    performAsceticCleanseSkill,
    performCurserBindSkill,
    performBlesserGrantSkill,
    performSunflowerFacingSkill,
    performRogueNightRaidSkill,
    performMeijiaTeamSkill,
    performDeerCartInvite,
    performDeerCartDepart,
    performYumumuBindSkill,
    performYujieDaipaiSkill,
    resolveImperialChallengerWin,
} from '../utils/data.js';
import { canHelpFriend } from '../utils/friends.js';
import { generateImage } from '../utils/core.js';
import { loadGameContext } from '../utils/context.js';
import {
    replyDeerPanel,
    replyInteractionResult,
    replyProfessionCatalog,
    replyProfessionCard,
    replyCartSession,
    replySoloLuSession,
    replyStatusPanel,
    skinCtxForSender,
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
import {
    armDeerCartSession,
    clearDeerCartSession,
    findDeerCartSessionForTarget,
    isDeerCartTargetBusy,
} from '../utils/deer-cart-session.js';
import { loadDeerData, loadFriends, saveDeerData } from '../utils/store.js';
import { bumpFestivalPortraitProgress, appendUnlockNotices } from '../utils/portrait-unlock.js';
import { needsLiveProfessionCatalogForPortraits } from '../utils/skin.js';
import plugin from '../../../lib/plugins/plugin.js';

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
                { reg: REG.soloLu, fnc: 'soloLu' },
                { reg: REG.withdraw, fnc: 'withdrawalLu' },
                { reg: REG.view, fnc: 'viewLu' },
                { reg: REG.status, fnc: 'luStatus' },
                { reg: REG.help, fnc: 'helpLu' },
                { reg: REG.profession, fnc: 'professionInfo' },
                { reg: REG.professionCard, fnc: 'viewProfessionCard' },
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
                { reg: REG.sunflowerFacingSkill, fnc: 'sunflowerFacingSkill' },
                { reg: REG.rogueNightRaidSkill, fnc: 'rogueNightRaidSkill' },
                { reg: REG.deerCart, fnc: 'deerCart' },
                { reg: REG.meijiaTeamSkill, fnc: 'meijiaTeamSkill' },
                { reg: REG.yumumuBindSkill, fnc: 'yumumuBindSkill' },
                { reg: REG.yujieDaipaiSkill, fnc: 'yujieDaipaiSkill' },
            ],
        });
    }

    async lu() {
        const { user_id, card, nickname } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const ctx = await loadGameContext(date);
        const driverName = card || nickname;

        const result = performLu(deerData, user_id, date, day, ctx);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        const notices = bumpFestivalPortraitProgress(getUserRecord(deerData, user_id), date, 'lu');
        await saveDeerData(deerData);
        const text = appendUnlockNotices(formatActionMessage(result), notices);
        await replyDeerPanel(this.e, {
            date, name: driverName, userId: user_id, deerData, text, dayOverride: day,
        });
    }

    async soloLu() {
        const { user_id, card, nickname } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const ctx = await loadGameContext(date);
        const playerName = card || nickname;

        const session = runSoloLuSession(deerData, user_id, date, day, ctx);
        if (!session.ok) {
            await saveDeerData(deerData);
            await this.reply(formatErrorMessage(session.lu || session), true);
            return;
        }

        let notices = [];
        for (const lu of session.results) {
            if (lu?.ok) {
                notices = notices.concat(
                    bumpFestivalPortraitProgress(getUserRecord(deerData, user_id), date, 'lu'),
                );
            }
        }
        await saveDeerData(deerData);
        const unlockLines = appendUnlockNotices('', notices).split('\n').filter(Boolean);

        await replySoloLuSession(this.e, {
            playerName,
            session,
            caption: '连鹿！自动连🦌至死（详情见聊天记录）',
            extraLines: unlockLines,
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
        const skinCtx = skinCtxForSender(deerData, subject.userId, viewDate);
        const raw = await generateImage(viewDate, subject.name, monthData, {
            highlightDay: viewDate.getDate(),
            skinCtx,
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
            userRecord: getUserRecord(deerData, subject.userId),
        });
    }

    async professionInfo() {
        const { user_id } = this.e.sender;
        const date = new Date();
        const deerData = await loadDeerData();
        const userRecord = getUserRecord(deerData, user_id);
        const monthData = getMonthData(userRecord, date);
        const snapshot = getHelperQuotaSnapshot(monthData, date.getDate());
        const portraitLive = needsLiveProfessionCatalogForPortraits(userRecord);
        await replyProfessionCatalog(this.e, {
            snapshot: portraitLive && !snapshot.professionRequired ? snapshot : undefined,
            userRecord,
            date,
            preamble: formatHelperQuotaReply(snapshot),
        });
    }

    /** 静态职业卡（预渲染图，任意时间可查看） */
    async viewProfessionCard() {
        const msg = cleanCommandMsg(this.e.msg);
        const match = msg.match(/^(?:看)?(?:🦌|鹿)职业(?:卡)?(.+)$/);
        const token = match?.[1]?.trim() ?? '';
        const professionId = resolveProfessionId(token) || resolveExtraDeerId(token);
        if (!professionId) {
            await this.reply(ERROR_MESSAGES.profession_unknown(token), true);
            return;
        }
        const prof = isExtraDeerId(professionId) ? getExtraDeerDef(professionId) : getProfessionDef(professionId);
        const deerData = await loadDeerData();
        const userRecord = getUserRecord(deerData, this.e.sender.user_id);
        await replyProfessionCard(this.e, {
            professionId,
            userRecord,
            date: new Date(),
            text: `${prof.emoji} ${prof.name} · 发送「转职${token}」可锁定今日职业`,
        });
    }

    async helperQuotaInfo() {
        await this.luStatus();
    }

    async helpLuQuotaInfo() {
        const text = await this.buildQuotaReplyText('help');
        await this.reply(text, true);
    }

    async helpWithdrawQuotaInfo() {
        const text = await this.buildQuotaReplyText('withdraw');
        await this.reply(text, true);
    }

    async buildQuotaReplyText(mode) {
        const { user_id } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const monthData = getMonthData(getUserRecord(await loadDeerData(), user_id), date);
        const snapshot = getHelperQuotaSnapshot(monthData, day);
        return formatHelperQuotaReply(snapshot, mode);
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
        const userRecord = getUserRecord(deerData, user_id);
        if (result.changed && result.profession?.id) {
            const p = result.profession;
            await replyProfessionCard(this.e, {
                professionId: p.id,
                text: `${p.emoji} 转职成功：${p.name}（今日已锁定）`,
                userRecord,
                date,
                textFirst: true,
            });
        } else if (result.profession?.id) {
            await replyProfessionCard(this.e, {
                professionId: result.profession.id,
                text: formatActionMessage(result),
                userRecord,
                date,
            });
        } else {
            await this.reply(formatActionMessage(result), true);
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
        const unlocks = bumpFestivalPortraitProgress(getUserRecord(deerData, user_id), date, 'help_lu');
        await saveDeerData(deerData);
        const targetName = await getMemberName(this.e, targetId);
        const text = appendUnlockNotices(formatActionMessage(result, {
            helperName: card || nickname,
            targetName,
        }), unlocks);
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

    async _runTargetSkill(performFn, { needFriend = true, textOnly = false } = {}) {
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
        if (textOnly) {
            await this.reply(text, true);
            return;
        }
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

    async sunflowerFacingSkill() {
        await this._runTargetSkill(performSunflowerFacingSkill);
    }

    async rogueNightRaidSkill() {
        await this._runTargetSkill(performRogueNightRaidSkill, { needFriend: false });
    }

    async deerCart() {
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
        const scopeId = this.e.group_id || 'pm';
        if (isDeerCartTargetBusy(scopeId, targetId)) {
            await this.reply(formatErrorMessage({ type: 'cart_busy' }), true);
            return;
        }
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performDeerCartInvite(deerData, user_id, targetId, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);
        const targetName = await getMemberName(this.e, targetId);
        const driverName = card || nickname;
        const pluginName = this.name;
        const selfId = this.e.self_id;
        armDeerCartSession(scopeId, targetId, {
            driverId: user_id,
            driverName,
            helperId: targetId,
            date,
            day,
            pluginName,
            selfId,
        }, {
            onExpire: () => {
                plugin.finishUserContext(pluginName, selfId, targetId, 'deerCartDepart');
            },
        });
        plugin.bindUserContext(
            pluginName,
            selfId,
            targetId,
            'deerCartDepart',
            this.e,
            DEER_CART_DEPART_TIMEOUT_SEC,
        );
        const text = formatActionMessage(result, {
            helperName: driverName,
            targetName,
        });
        await this.reply([
            text,
            `\n${targetName} 请在 ${DEER_CART_DEPART_TIMEOUT_SEC} 秒内回复「发车」确认上车`,
        ], true);
    }

    /**
     * 用户级上下文：仅被 @ 的帮鹿位回复「发车」（handleContext 优先于 rule）
     */
    async deerCartDepart() {
        const session = findDeerCartSessionForTarget(this.e);
        if (!session) {
            plugin.finishUserContext(this.name, this.e.self_id, this.e.user_id, 'deerCartDepart');
            return false;
        }

        const msg = String(this.e.msg ?? '').trim();
        if (!msg.includes('发车')) {
            await this.reply(`请回复「发车」确认上车（${DEER_CART_DEPART_TIMEOUT_SEC}s 内有效）`, true);
            return true;
        }

        const scopeId = this.e.group_id || 'pm';
        const date = new Date();
        const day = date.getDate();
        const { user_id, card, nickname } = this.e.sender;
        const deerData = await loadDeerData();
        const depart = performDeerCartDepart(deerData, user_id, date, day);
        if (!depart.ok) {
            if (depart.type === 'cart_no_invite') {
                plugin.finishUserContext(this.name, this.e.self_id, this.e.user_id, 'deerCartDepart');
                clearDeerCartSession(scopeId, this.e.user_id);
                return false;
            }
            let errText = formatErrorMessage(depart);
            if (depart.type === 'profession_required') {
                errText += `\n转职完成后请再次回复「发车」（${DEER_CART_DEPART_TIMEOUT_SEC}s 内仍有效）`;
            }
            await this.reply(errText, true);
            if (depart.type !== 'profession_required') {
                plugin.finishUserContext(this.name, this.e.self_id, this.e.user_id, 'deerCartDepart');
                clearDeerCartSession(scopeId, this.e.user_id);
            }
            await saveDeerData(deerData);
            return true;
        }

        plugin.finishUserContext(this.name, this.e.self_id, this.e.user_id, 'deerCartDepart');
        clearDeerCartSession(scopeId, this.e.user_id);
        await saveDeerData(deerData);

        const ctx = await loadGameContext(date);
        const cartSession = runDeerCartSession(
            deerData,
            depart.driverId,
            depart.helperId,
            date,
            day,
            ctx,
        );
        if (!cartSession.ok) {
            await saveDeerData(deerData);
            await this.reply(formatErrorMessage(cartSession.lu || cartSession), true);
            return true;
        }

        let notices = [];
        for (const round of cartSession.rounds) {
            notices = notices.concat(
                bumpFestivalPortraitProgress(getUserRecord(deerData, depart.driverId), date, 'lu'),
            );
            const helps = round.helps?.length ? round.helps : (round.help ? [round.help] : []);
            for (const help of helps) {
                if (help?.ok) {
                    notices = notices.concat(
                        bumpFestivalPortraitProgress(getUserRecord(deerData, depart.helperId), date, 'help_lu'),
                    );
                }
            }
        }
        await saveDeerData(deerData);

        const driverName = await getMemberName(this.e, depart.driverId);
        const helperName = card || nickname;
        const departLine = formatActionMessage(depart, { helperName, targetName: driverName });
        const unlockLines = appendUnlockNotices('', notices).split('\n').filter(Boolean);

        await replyCartSession(this.e, {
            caption: departLine,
            session: cartSession,
            driverName,
            helperName,
            extraLines: unlockLines,
        });
        return true;
    }

    async meijiaTeamSkill() {
        await this._runTargetSkill(performMeijiaTeamSkill);
    }

    async yumumuBindSkill() {
        await this._runTargetSkill(performYumumuBindSkill);
    }

    async yujieDaipaiSkill() {
        const { user_id, card, nickname } = this.e.sender;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performYujieDaipaiSkill(deerData, user_id, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }
        await saveDeerData(deerData);
        const text = formatActionMessage(result, { helperName: card || nickname });
        await replyInteractionResult(this.e, {
            date,
            name: card || nickname,
            userId: user_id,
            deerData,
            text,
            result,
            helperName: card || nickname,
            helperId: user_id,
            dayOverride: day,
            withPanel: true,
        });
    }
}
