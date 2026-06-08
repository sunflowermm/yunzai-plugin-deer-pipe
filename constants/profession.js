/** 职业配额与玩法修正（独立于 game.js 全局常量） */

/** 未转职时不生效任何职业 */
export const DEFAULT_PROFESSION_ID = 'ranger';

export const PROFESSION_HELP_RANGE = [2, 14];
export const PROFESSION_WITHDRAW_RANGE = [1, 10];

/**
 * 每日必须先「转职」再玩；选定后当日锁定，0 点重置
 * @typedef {object} ProfessionDef
 */

/** @type {Record<string, ProfessionDef>} */
export const PROFESSIONS = {
    ranger: {
        id: 'ranger',
        name: '巡游鹿',
        emoji: '🦌',
        tagline: '天象联动：晴/虹类正向天象效果 ×1.2',
        helpQuota: 7,
        helpWithdrawQuota: 5,
        safeBonus: 0,
        helpFailDelta: -0.01,
        helpWithdrawFailDelta: -0.01,
        deathDelta: -0.01,
        stealDelta: 0.05,
        curseApplyBonus: 0.06,
        blessApplyBonus: 0.05,
        weatherPositiveAmp: 1.2,
        synergyTip: '偷鹿 +5% · 鹿咒/鹿福成功率略升 · 天象增益放大',
    },
    medic: {
        id: 'medic',
        name: '鹿医师',
        emoji: '💊',
        tagline: '救场专精：帮鹿/救活失手大减，成功可撕咒贴福',
        helpQuota: 14,
        helpWithdrawQuota: 1,
        safeBonus: 0,
        helpFailDelta: -0.05,
        helpWithdrawFailDelta: 0,
        reviveFailDelta: -0.08,
        helpCurseCleanseChance: 0.30,
        helpBlessChance: 0.15,
        synergyTip: '帮鹿成功 30% 撕 1 层咒 · 15% 贴 1 层鹿福 · 救活失手 -8%',
    },
    ascetic: {
        id: 'ascetic',
        name: '戒灵师',
        emoji: '📘',
        tagline: '帮戒专精：失手大减，戒鹿区目标额外 -1',
        helpQuota: 2,
        helpWithdrawQuota: 10,
        safeBonus: 0,
        helpFailDelta: 0,
        helpWithdrawFailDelta: -0.12,
        withdrawExtraChance: 0.25,
        withdrawExtraAmount: 1,
        selfWithdrawBonus: 1,
        selfWithdrawBonusChance: 0.30,
        synergyTip: '目标已在戒鹿区（次数<0）帮戒必再 -1 · 自戒 30% 再 -1',
    },
    grinder: {
        id: 'grinder',
        name: '卷王鹿',
        emoji: '🔥',
        tagline: '自🦌安全区 +2，超限步步低，安全🦌 20% 连击 +1',
        helpQuota: 3,
        helpWithdrawQuota: 1,
        safeBonus: 2,
        helpFailDelta: 0,
        helpWithdrawFailDelta: 0,
        deathDelta: -0.03,
        overlimitStepReduce: 0.01,
        safeLuDoubleChance: 0.20,
        synergyTip: '安全区前 5 次零鹿死 · 超限递增 -1%/步 · 安全自🦌可连击',
    },
};

/** 转职指令别名 → id */
export const PROFESSION_ALIASES = {
    巡游: 'ranger',
    巡游鹿: 'ranger',
    默认: 'ranger',
    鹿医: 'medic',
    鹿医师: 'medic',
    医师: 'medic',
    医生: 'medic',
    戒师: 'ascetic',
    戒灵师: 'ascetic',
    帮戒: 'ascetic',
    卷王: 'grinder',
    卷王鹿: 'grinder',
    自鹿: 'grinder',
};

function formatProfessionPerk(p) {
    const parts = [];
    if (p.safeBonus) parts.push(`安全+${p.safeBonus}`);
    if (p.helpFailDelta) parts.push(`帮鹿失手${Math.round(p.helpFailDelta * 100)}%`);
    if (p.helpWithdrawFailDelta) parts.push(`帮戒失手${Math.round(p.helpWithdrawFailDelta * 100)}%`);
    if (p.reviveFailDelta) parts.push(`救活失手${Math.round(p.reviveFailDelta * 100)}%`);
    if (p.weatherPositiveAmp && p.weatherPositiveAmp !== 1) parts.push(`天象×${p.weatherPositiveAmp}`);
    if (p.helpCurseCleanseChance) parts.push(`帮鹿${Math.round(p.helpCurseCleanseChance * 100)}%撕咒`);
    if (p.withdrawExtraChance) parts.push(`帮戒${Math.round(p.withdrawExtraChance * 100)}%再-1`);
    if (p.safeLuDoubleChance) parts.push(`安全🦌${Math.round(p.safeLuDoubleChance * 100)}%连击`);
    return parts.length ? ` · ${parts.join(' · ')}` : '';
}

export const PROFESSION_LIST_TEXT = Object.values(PROFESSIONS)
    .map((p) => `${p.emoji} ${p.name}：帮鹿 ${p.helpQuota} · 帮戒 ${p.helpWithdrawQuota}${formatProfessionPerk(p)}`)
    .join('\n');

export const PROFESSION_SYNERGY_TEXT = Object.values(PROFESSIONS)
    .map((p) => `${p.emoji} ${p.synergyTip || p.tagline}`)
    .join('\n');

export function getProfessionDef(id) {
    return PROFESSIONS[id] || PROFESSIONS[DEFAULT_PROFESSION_ID];
}

export function resolveProfessionId(token) {
    const raw = String(token ?? '').trim().replace(/\s+/g, '');
    if (!raw) return null;
    if (PROFESSIONS[raw]) return raw;
    const lower = raw.toLowerCase();
    if (PROFESSIONS[lower]) return lower;
    return PROFESSION_ALIASES[raw] || PROFESSION_ALIASES[lower] || null;
}

/** 各职业每日 1 次专属技（须先转职） */
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
        desc: '不占帮鹿配额 · 零失手帮 +1 或救活',
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
};

export function getProfessionSkill(professionId) {
    return PROFESSION_SKILLS[professionId] || null;
}
