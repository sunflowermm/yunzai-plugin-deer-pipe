/** 职业配额与玩法加成（独立于 game.js 全局常量） */

import { resolveProfessionQuotas, formatProfessionQuotaSummary } from './profession-quotas.js';

export { QUOTA, BASE_QUOTAS, PROFESSION_QUOTA_TABLE } from './profession-quotas.js';

export const DEFAULT_PROFESSION_ID = 'ranger';

export const PROFESSION_HELP_RANGE = [2, 14];
export const PROFESSION_WITHDRAW_RANGE = [1, 10];

/** @type {Record<string, object>} */
export const PROFESSIONS = {
    ranger: {
        id: 'ranger',
        name: '巡游鹿',
        emoji: '🦌',
        tagline: '天象联动 · 偷咒签运略升 · 玩法次数均衡',
        safeBonus: 0,
        helpFailDelta: -0.02,
        helpWithdrawFailDelta: -0.02,
        deathDelta: -0.015,
        stealDelta: 0.06,
        curseApplyBonus: 0.08,
        blessApplyBonus: 0.06,
        lotteryLuckDelta: 0.05,
        weatherPositiveAmp: 1.25,
        synergyTip: '偷鹿+6% · 天象×1.25 · 签运/群游配额多 · 均衡探索',
    },
    medic: {
        id: 'medic',
        name: '鹿医师',
        emoji: '💊',
        tagline: '救场专精：帮鹿失手大减，成功 12% 当日帮鹿次数+1',
        safeBonus: 0,
        helpFailDelta: -0.06,
        helpWithdrawFailDelta: 0,
        deathDelta: -0.02,
        reviveFailDelta: -0.10,
        helpCurseCleanseChance: 0.35,
        helpBlessChance: 0.18,
        helpQuotaBonusChance: 0.12,
        synergyTip: '帮鹿14 · 禁偷咒 · 还阳/托梦多 · 12%帮鹿次数+1',
    },
    ascetic: {
        id: 'ascetic',
        name: '戒灵师',
        emoji: '📘',
        tagline: '帮戒专精：戒鹿区目标额外 -1，自戒再 -1 概率升',
        safeBonus: 0,
        helpFailDelta: 0,
        helpWithdrawFailDelta: -0.15,
        deathDelta: -0.01,
        withdrawExtraChance: 0.30,
        withdrawExtraAmount: 1,
        asceticZoneBonus: 1,
        selfWithdrawBonus: 1,
        selfWithdrawBonusChance: 0.35,
        synergyTip: '帮戒10 · 诈戒5 · 催鹿6 · 禁偷/互害',
    },
    grinder: {
        id: 'grinder',
        name: '卷王鹿',
        emoji: '🔥',
        tagline: '安全区 +3，超限鹿死封顶 60%，擂台次数多',
        safeBonus: 3,
        helpFailDelta: 0,
        helpWithdrawFailDelta: 0,
        deathDelta: -0.02,
        overlimitStepReduce: 0.006,
        overlimitDeathCap: 0.60,
        safeLuDoubleChance: 0.20,
        synergyTip: '安全+3 · 擂台8 · 皇城3 · 碰瓷4 · 同归2',
    },
    curser: {
        id: 'curser',
        name: '叠咒鹿',
        emoji: '☠️',
        tagline: '叠咒/冥咒/索命次数多，互害专精',
        safeBonus: 0,
        curseApplyBonus: 0.12,
        deathDelta: 0.025,
        helpFailDelta: 0.02,
        synergyTip: '鹿咒7 · 冥咒4 · 索命4 · 群溅3 · 禁福',
    },
    blesser: {
        id: 'blesser',
        name: '福鹿使',
        emoji: '✨',
        tagline: '鹿福/解咒/解福次数多，互助偏正面',
        safeBonus: 1,
        blessApplyBonus: 0.10,
        deathDelta: -0.025,
        helpBlessChance: 0.22,
        helpCurseCleanseChance: 0.25,
        synergyTip: '鹿福6 · 解福4 · 解咒4 · 帮鹿11 · 禁偷咒',
    },
    rogue: {
        id: 'rogue',
        name: '窃光鹿',
        emoji: '🥷',
        tagline: '偷鹿/碰瓷/诈戒次数多，窃掠专精',
        safeBonus: 0,
        stealDelta: 0.10,
        deathDelta: -0.015,
        synergyTip: '偷鹿7 · 碰瓷5 · 诈戒5 · 倒贴3 · 皇城3',
    },
    sunflower: {
        id: 'sunflower',
        name: '向日葵鹿',
        emoji: '🌻',
        easterEgg: true,
        tagline: '向光生长：天象/催福/签运专精',
        safeBonus: 2,
        helpFailDelta: -0.05,
        deathDelta: -0.04,
        reviveFailDelta: -0.06,
        weatherPositiveAmp: 1.28,
        blessApplyBonus: 0.12,
        helpBlessChance: 0.22,
        helpCurseCleanseChance: 0.20,
        lotteryLuckDelta: 0.10,
        synergyTip: '鹿福6 · 催鹿7 · 签运+10% · 天象×1.28',
    },
};

/** 转职指令别名 → id（须与职业名一致，无歧义简称） */
export const PROFESSION_ALIASES = {
    巡游: 'ranger',
    巡游鹿: 'ranger',
    默认: 'ranger',
    鹿医师: 'medic',
    医师: 'medic',
    戒师: 'ascetic',
    戒灵师: 'ascetic',
    卷王: 'grinder',
    卷王鹿: 'grinder',
    叠咒鹿: 'curser',
    叠咒: 'curser',
    咒师: 'curser',
    福鹿使: 'blesser',
    福使: 'blesser',
    赐福鹿: 'blesser',
    窃光鹿: 'rogue',
    窃贼鹿: 'rogue',
    窃光: 'rogue',
    向日葵: 'sunflower',
    向日葵鹿: 'sunflower',
    向光鹿: 'sunflower',
    葵鹿: 'sunflower',
};

function formatProfessionPerk(p) {
    const parts = [];
    if (p.safeBonus) parts.push(`安全+${p.safeBonus}`);
    if (p.helpFailDelta) parts.push(`帮鹿失手${Math.round(p.helpFailDelta * 100)}%`);
    if (p.helpWithdrawFailDelta) parts.push(`帮戒失手${Math.round(p.helpWithdrawFailDelta * 100)}%`);
    if (p.reviveFailDelta) parts.push(`救活失手${Math.round(p.reviveFailDelta * 100)}%`);
    if (p.weatherPositiveAmp && p.weatherPositiveAmp !== 1) parts.push(`天象×${p.weatherPositiveAmp}`);
    if (p.helpCurseCleanseChance) parts.push(`${Math.round(p.helpCurseCleanseChance * 100)}%撕咒`);
    if (p.helpQuotaBonusChance) parts.push(`${Math.round(p.helpQuotaBonusChance * 100)}%帮鹿次数+1`);
    if (p.withdrawExtraChance) parts.push(`帮戒${Math.round(p.withdrawExtraChance * 100)}%再-1`);
    if (p.asceticZoneBonus) parts.push(`戒区再-${p.asceticZoneBonus}`);
    if (p.safeLuDoubleChance) parts.push(`安全🦌${Math.round(p.safeLuDoubleChance * 100)}%连击`);
    if (p.overlimitDeathCap) parts.push(`超限鹿死≤${Math.round(p.overlimitDeathCap * 100)}%`);
    if (p.lotteryLuckDelta) parts.push(`签运+${Math.round(p.lotteryLuckDelta * 100)}%`);
    if (p.stealDelta) parts.push(`偷鹿+${Math.round(p.stealDelta * 100)}%`);
    if (p.curseApplyBonus) parts.push(`叠咒+${Math.round(p.curseApplyBonus * 100)}%`);
    if (p.blessApplyBonus) parts.push(`鹿福+${Math.round(p.blessApplyBonus * 100)}%`);
    return parts.length ? ` · ${parts.join(' · ')}` : '';
}

/** 转职提示（8 职业，多处文案统一引用） */
export const TRANSFER_PROFESSION_HINT =
    '转职鹿医师 / 转职戒师 / 转职卷王 / 转职巡游鹿 / 转职叠咒鹿 / 转职福鹿使 / 转职窃光鹿 / 转职向日葵（或「鹿职业」查看）';

export const PROFESSION_LIST_TEXT = Object.keys(PROFESSIONS)
    .map((id) => {
        const p = getProfessionDef(id);
        return `${p.emoji} ${p.name}：${formatProfessionQuotaSummary(id, 'brief')}${formatProfessionPerk(p)}`;
    })
    .join('\n');

export const PROFESSION_SYNERGY_TEXT = Object.values(PROFESSIONS)
    .map((p) => `${p.emoji} ${p.synergyTip || p.tagline}`)
    .join('\n');

export function getProfessionDef(id) {
    const base = PROFESSIONS[id] || PROFESSIONS[DEFAULT_PROFESSION_ID];
    const q = resolveProfessionQuotas(base.id);
    return {
        ...base,
        helpQuota: q.help,
        helpWithdrawQuota: q.helpWithdraw,
    };
}

export { formatProfessionQuotaSummary };

export function resolveProfessionId(token) {
    const raw = String(token ?? '').trim().replace(/\s+/g, '');
    if (!raw) return null;
    if (PROFESSIONS[raw]) return raw;
    const lower = raw.toLowerCase();
    if (PROFESSIONS[lower]) return lower;
    return PROFESSION_ALIASES[raw] || PROFESSION_ALIASES[lower] || null;
}

export const PROFESSION_SKILLS = {
    ranger: {
        id: 'ranger',
        name: '天象巡游',
        cmd: '鹿巡',
        desc: '下一次玩法天象正向修正再 ×1.35（与巡游被动叠加）',
    },
    medic: {
        id: 'medic',
        name: '妙手愈鹿',
        cmd: '愈鹿@ / 鹿愈@',
        desc: '不占帮鹿配额 · 零失手帮 +1 或救活（须鹿医师）',
    },
    ascetic: {
        id: 'ascetic',
        name: '清规戒律',
        cmd: '清规@',
        desc: '不占帮戒配额 · 零失手帮 -2',
    },
    grinder: {
        id: 'grinder',
        name: '卷王冲锋',
        cmd: '卷王冲 / 卷冲',
        desc: '强制安全自🦌 +2（不计超限鹿死）',
    },
    curser: {
        id: 'curser',
        name: '咒缚',
        cmd: '咒缚@',
        desc: '不占鹿咒配额 · 零失手叠 1 层咒',
    },
    blesser: {
        id: 'blesser',
        name: '广福',
        cmd: '广福@',
        desc: '不占鹿福配额 · 零失手贴 1 层福',
    },
    rogue: {
        id: 'rogue',
        name: '夜袭',
        cmd: '夜袭@',
        desc: '不占偷鹿配额 · 高成功率偷 1 次',
    },
    sunflower: {
        id: 'sunflower',
        name: '向阳',
        cmd: '向阳@',
        desc: '不占催鹿/鹿福配额 · 催更+1 · 贴 2 层福 · 咒回合-2（须向日葵鹿）',
    },
};

export function getProfessionSkill(professionId) {
    return PROFESSION_SKILLS[professionId] || null;
}
