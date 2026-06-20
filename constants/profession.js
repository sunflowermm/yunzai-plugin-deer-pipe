/** 职业配额与玩法加成（独立于 game.js 全局常量） */

import { resolveProfessionQuotas, formatProfessionQuotaSummary } from './profession-quotas.js';
import { formatTalentCatalogLine, formatTalentPerkBrief, formatTalentTagline } from './talent-text.js';

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
        safeBonus: 0,
        helpFailDelta: -0.03,
        helpWithdrawFailDelta: -0.03,
        deathDelta: -0.02,
        stealDelta: 0.08,
        curseApplyBonus: 0.10,
        blessApplyBonus: 0.08,
        lotteryLuckDelta: 0.07,
        weatherPositiveAmp: 1.30,
    },
    medic: {
        id: 'medic',
        name: '鹿医师',
        emoji: '💊',
        safeBonus: 0,
        helpFailDelta: -0.06,
        helpWithdrawFailDelta: 0,
        deathDelta: -0.02,
        reviveFailDelta: -0.10,
        helpCurseCleanseChance: 0.35,
        helpBlessChance: 0.18,
        helpQuotaBonusChance: 0.12,
    },
    ascetic: {
        id: 'ascetic',
        name: '戒灵师',
        emoji: '📘',
        safeBonus: 0,
        helpFailDelta: 0,
        helpWithdrawFailDelta: -0.18,
        deathDelta: -0.015,
        withdrawExtraChance: 0.38,
        withdrawExtraAmount: 1,
        asceticZoneBonus: 1,
        selfWithdrawBonus: 1,
        selfWithdrawBonusChance: 0.40,
    },
    grinder: {
        id: 'grinder',
        name: '卷王鹿',
        emoji: '🔥',
        safeBonus: 3,
        helpFailDelta: 0,
        helpWithdrawFailDelta: 0,
        deathDelta: -0.02,
        overlimitStepReduce: 0.006,
        overlimitDeathCap: 0.60,
        safeLuDoubleChance: 0.20,
    },
    curser: {
        id: 'curser',
        name: '叠咒鹿',
        emoji: '☠️',
        safeBonus: 0,
        curseApplyBonus: 0.15,
        deathDelta: 0.02,
        helpFailDelta: 0.015,
    },
    blesser: {
        id: 'blesser',
        name: '福鹿使',
        emoji: '✨',
        safeBonus: 2,
        blessApplyBonus: 0.12,
        deathDelta: -0.03,
        helpBlessChance: 0.26,
        helpCurseCleanseChance: 0.28,
    },
    rogue: {
        id: 'rogue',
        name: '窃光鹿',
        emoji: '🥷',
        safeBonus: 0,
        stealDelta: 0.12,
        deathDelta: -0.02,
    },
    sunflower: {
        id: 'sunflower',
        name: '向日葵鹿',
        emoji: '🌻',
        easterEgg: true,
        safeBonus: 3,
        helpFailDelta: -0.06,
        deathDelta: -0.045,
        reviveFailDelta: -0.06,
        weatherPositiveAmp: 1.32,
        blessApplyBonus: 0.14,
        helpBlessChance: 0.24,
        helpCurseCleanseChance: 0.22,
        lotteryLuckDelta: 0.12,
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
    return formatTalentPerkBrief(p, 4);
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

export const PROFESSION_SYNERGY_TEXT = Object.keys(PROFESSIONS)
    .map((id) => {
        const p = getProfessionDef(id);
        return `${p.emoji} ${p.synergyTip}`;
    })
    .join('\n');

export function getProfessionDef(id) {
    const base = PROFESSIONS[id] || PROFESSIONS[DEFAULT_PROFESSION_ID];
    const q = resolveProfessionQuotas(base.id);
    const merged = {
        ...base,
        helpQuota: q.help,
        helpWithdrawQuota: q.helpWithdraw,
    };
    return {
        ...merged,
        tagline: formatTalentTagline(merged, 99),
        synergyTip: formatTalentCatalogLine(merged, formatProfessionQuotaSummary(base.id, 'brief')),
    };
}

export { formatProfessionQuotaSummary };

/** 剥离首尾鹿/🦌，兼容「转职向日葵🦌」「转职🦌医师」等写法 */
export function normalizeProfessionToken(token) {
    let raw = String(token ?? '').trim().replace(/\s+/g, '');
    if (!raw) return '';
    raw = raw.replace(/^(?:🦌|鹿)+/, '');
    raw = raw.replace(/(?:🦌|鹿)+$/, '');
    return raw;
}

export function resolveProfessionId(token) {
    const raw = normalizeProfessionToken(token);
    if (!raw) return null;
    if (PROFESSIONS[raw]) return raw;
    const lower = raw.toLowerCase();
    if (PROFESSIONS[lower]) return lower;
    if (PROFESSION_ALIASES[raw]) return PROFESSION_ALIASES[raw];
    if (PROFESSION_ALIASES[lower]) return PROFESSION_ALIASES[lower];
    for (const p of Object.values(PROFESSIONS)) {
        if (raw === p.name || raw === normalizeProfessionToken(p.name)) return p.id;
    }
    return null;
}

export const PROFESSION_SKILLS = {
    ranger: {
        id: 'ranger',
        name: '天象巡游',
        cmd: '鹿巡',
        desc: '下一次玩法天象正向修正再 ×1.35（与天赋 ×1.25 叠加）· 1 次/日',
    },
    medic: {
        id: 'medic',
        name: '妙手愈鹿',
        cmd: '愈鹿@ / 鹿愈@',
        desc: '不占帮鹿配额 · 0% 失手 · 帮 +1 或救活 · 1 次/日',
    },
    ascetic: {
        id: 'ascetic',
        name: '清规戒律',
        cmd: '清规@',
        desc: '不占帮戒配额 · 0% 失手 · 帮戒 -2 次 · 1 次/日',
    },
    grinder: {
        id: 'grinder',
        name: '卷王冲锋',
        cmd: '卷王冲 / 卷冲',
        desc: '强制安全自鹿 +2 次（不计超限鹿死）· 1 次/日',
    },
    curser: {
        id: 'curser',
        name: '咒缚',
        cmd: '咒缚@',
        desc: '不占鹿咒配额 · 0% 失手 · 叠 1 层咒 · 1 次/日',
    },
    blesser: {
        id: 'blesser',
        name: '广福',
        cmd: '广福@',
        desc: '不占鹿福配额 · 0% 失手 · 贴 1 层福 · 1 次/日',
    },
    rogue: {
        id: 'rogue',
        name: '夜袭',
        cmd: '夜袭@',
        desc: '不占偷鹿配额 · 高成功率偷 1 次 · 1 次/日',
    },
    sunflower: {
        id: 'sunflower',
        name: '向阳',
        cmd: '向阳@',
        desc: '不占催鹿/鹿福配额 · 催更 +1 · 贴 2 层福 · 咒回合 -2 · 1 次/日',
    },
};

export function getProfessionSkill(professionId) {
    return PROFESSION_SKILLS[professionId] || null;
}
