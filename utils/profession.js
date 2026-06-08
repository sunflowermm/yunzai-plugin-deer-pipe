import { META_PREFIX, PATROL_WEATHER_AMP } from '../constants/game.js';
import {
    getProfessionDef,
    getProfessionSkill,
    resolveProfessionId,
} from '../constants/profession.js';

export {
    resolveProfessionId,
    getProfessionDef,
    getProfessionSkill,
    PROFESSION_LIST_TEXT,
    PROFESSION_SYNERGY_TEXT,
    PROFESSION_SKILLS,
} from '../constants/profession.js';
export function jobMetaKey(day) {
    return `${META_PREFIX.JOB}${day}`;
}

export function jobSkillUsedKey(day) {
    return `${META_PREFIX.JOB_SKILL}${day}`;
}

export function patrolBuffKey(day) {
    return `${META_PREFIX.PATROL_BUFF}${day}`;
}

export function hasUsedJobSkill(monthData, day) {
    return !!monthData?.[jobSkillUsedKey(day)];
}

export function markJobSkillUsed(monthData, day) {
    if (!monthData) return;
    monthData[jobSkillUsedKey(day)] = 1;
}

export function hasPatrolBuff(monthData, day) {
    return !!monthData?.[patrolBuffKey(day)];
}

export function setPatrolBuff(monthData, day) {
    if (!monthData) return;
    monthData[patrolBuffKey(day)] = 1;
}

/** 放大天象正向修正（巡游专属技 pending 消费） */
export function amplifyPositiveWeather(wx, amp = PATROL_WEATHER_AMP) {
    const base = wx && typeof wx === 'object' ? { ...wx } : {};
    if (!amp || amp === 1) return base;
    if (base.safeBonus > 0) base.safeBonus *= amp;
    if (base.deathDelta < 0) base.deathDelta *= amp;
    if (base.helpFailDelta < 0) base.helpFailDelta *= amp;
    if (base.helpWithdrawFailDelta < 0) base.helpWithdrawFailDelta *= amp;
    if (base.reviveFailDelta < 0) base.reviveFailDelta *= amp;
    if (base.stealDelta > 0) base.stealDelta *= amp;
    if (base.lotteryLuckDelta > 0) base.lotteryLuckDelta *= amp;
    return base;
}

/**
 * 玩法前解析天象：消费巡游 pending buff，再由 resolvePlayModifiers 叠职业 amp
 * @returns {{ wx: object, patrolConsumed: boolean }}
 */
export function weatherForAction(gameContext, monthData, day) {
    let wx = gameContext?.weatherEffects && typeof gameContext.weatherEffects === 'object'
        ? { ...gameContext.weatherEffects }
        : {};
    let patrolConsumed = false;
    if (monthData && hasPatrolBuff(monthData, day)) {
        delete monthData[patrolBuffKey(day)];
        wx = amplifyPositiveWeather(wx);
        patrolConsumed = true;
    }
    return { wx, patrolConsumed };
}

export function getJobSkillSnapshot(monthData, day) {
    const id = getDayProfessionId(monthData, day);
    if (!id) {
        return {
            professionRequired: true,
            used: false,
            canUse: false,
            patrolPending: false,
            skill: null,
        };
    }
    const used = hasUsedJobSkill(monthData, day);
    return {
        professionRequired: false,
        used,
        canUse: !used,
        patrolPending: hasPatrolBuff(monthData, day),
        skill: getProfessionSkill(id),
        professionId: id,
    };
}

export function rejectIfWrongProfession(deerData, userId, date, day, expectedId) {
    const monthData = getMonthDataFromDeer(deerData, userId, date);
    const id = getDayProfessionId(monthData, day);
    if (!id) return { ok: false, type: 'profession_required' };
    if (id !== expectedId) {
        const skill = getProfessionSkill(expectedId);
        const current = getProfessionDef(id);
        return {
            ok: false,
            type: 'job_skill_wrong_profession',
            expected: skill?.name || expectedId,
            current: current.name,
        };
    }
    return null;
}

function getMonthDataFromDeer(deerData, userId, date) {
    const uid = String(userId);
    const record = deerData?.[uid];
    if (!record) return null;
    const d = date instanceof Date ? date : new Date(date);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return record[monthKey] || null;
}

export function hasDayProfession(monthData, day) {
    return monthData?.[jobMetaKey(day)] != null;
}

export function getDayProfessionId(monthData, day) {
    const raw = monthData?.[jobMetaKey(day)];
    if (raw == null || raw === '') return null;
    return getProfessionDef(String(raw)).id;
}

/** 将职业 mods 从 def 展开（仅已转职时调用） */
export function buildProfessionMods(def) {
    if (!def) return null;
    return {
        id: def.id,
        name: def.name,
        emoji: def.emoji,
        tagline: def.tagline,
        synergyTip: def.synergyTip,
        helpQuota: def.helpQuota,
        helpWithdrawQuota: def.helpWithdrawQuota,
        safeBonus: def.safeBonus || 0,
        helpFailDelta: def.helpFailDelta || 0,
        helpWithdrawFailDelta: def.helpWithdrawFailDelta || 0,
        deathDelta: def.deathDelta || 0,
        stealDelta: def.stealDelta || 0,
        curseApplyBonus: def.curseApplyBonus || 0,
        blessApplyBonus: def.blessApplyBonus || 0,
        reviveFailDelta: def.reviveFailDelta || 0,
        helpCurseCleanseChance: def.helpCurseCleanseChance || 0,
        helpBlessChance: def.helpBlessChance || 0,
        withdrawExtraChance: def.withdrawExtraChance || 0,
        withdrawExtraAmount: def.withdrawExtraAmount || 1,
        selfWithdrawBonus: def.selfWithdrawBonus || 0,
        selfWithdrawBonusChance: def.selfWithdrawBonusChance || 0,
        overlimitStepReduce: def.overlimitStepReduce || 0,
        safeLuDoubleChance: def.safeLuDoubleChance || 0,
        weatherPositiveAmp: def.weatherPositiveAmp || 1,
    };
}

/** 未转职返回 null */
export function getProfessionMods(monthData, day) {
    const id = getDayProfessionId(monthData, day);
    if (!id) return null;
    return buildProfessionMods(getProfessionDef(id));
}

export function getHelpQuotaLimit(monthData, day) {
    const mods = getProfessionMods(monthData, day);
    return mods ? mods.helpQuota : 0;
}

export function getHelpWithdrawQuotaLimit(monthData, day) {
    const mods = getProfessionMods(monthData, day);
    return mods ? mods.helpWithdrawQuota : 0;
}

export function setDayProfession(monthData, day, professionId) {
    if (!monthData) return;
    monthData[jobMetaKey(day)] = getProfessionDef(professionId).id;
}

/** 巡游鹿：放大天象正向修正 */
export function scaleWeatherForProfession(wx, prof) {
    const base = wx && typeof wx === 'object' ? { ...wx } : {};
    const amp = prof?.weatherPositiveAmp;
    if (!amp || amp === 1) return base;
    if (base.safeBonus > 0) base.safeBonus *= amp;
    if (base.deathDelta < 0) base.deathDelta *= amp;
    if (base.helpFailDelta < 0) base.helpFailDelta *= amp;
    if (base.helpWithdrawFailDelta < 0) base.helpWithdrawFailDelta *= amp;
    if (base.reviveFailDelta < 0) base.reviveFailDelta *= amp;
    if (base.stealDelta > 0) base.stealDelta *= amp;
    if (base.lotteryLuckDelta > 0) base.lotteryLuckDelta *= amp;
    return base;
}
