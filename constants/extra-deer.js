/** 番外鹿：不在 PROFESSIONS 八职业表内，独立转职与玩法 */

import { QUOTA, QUOTA_GROUPS, QUOTA_LABELS } from './profession-quotas.js';
import { formatTalentCatalogLine, formatTalentTagline } from './talent-text.js';

export const EXTRA_DEER_IDS = Object.freeze(['meijia', 'yumumu']);

/** 天赋数值（tagline/synergyTip 由 talent-text 生成） */
export const EXTRA_DEER = {
    meijia: {
        id: 'meijia',
        name: '王美嘉鹿',
        emoji: '👑',
        helpQuota: 8,
        helpWithdrawQuota: 2,
        helpFailDelta: -0.04,
        deathDelta: -0.025,
        safeBonus: 1,
    },
    yumumu: {
        id: 'yumumu',
        name: '雨木木鹿',
        emoji: '🌧️',
        helpQuota: 12,
        helpWithdrawQuota: 3,
        helpFailDelta: -0.04,
        impotenceChance: 0.20,
        impotenceHelpFailBonus: 0.08,
    },
};

export const EXTRA_DEER_SKILLS = {
    meijia: {
        id: 'meijia',
        name: '组队',
        cmd: '组队@',
        desc: '绑定 1 名鹿友：王美嘉自鹿 +1 时搭档同步 +1 · 任一方鹿死则双亡并解除绑定 · 1 次/日',
    },
    yumumu: {
        id: 'yumumu',
        name: '束缚',
        cmd: '束缚@',
        desc: '目标 60 分钟禁自鹿（仍可被帮鹿）· 1 次/日',
    },
};

export const EXTRA_DEER_ALIASES = {
    王美嘉: 'meijia',
    王美嘉鹿: 'meijia',
    美嘉: 'meijia',
    美嘉鹿: 'meijia',
    雨木木: 'yumumu',
    雨木木鹿: 'yumumu',
    木木: 'yumumu',
    木木鹿: 'yumumu',
};

export const EXTRA_DEER_QUOTA_TABLE = {
    meijia: {
        [QUOTA.help]: 8,
        [QUOTA.helpWithdraw]: 2,
        [QUOTA.steal]: 1,
        [QUOTA.arena]: 2,
        [QUOTA.bless]: 2,
        [QUOTA.cleanseCurse]: 1,
        [QUOTA.urge]: 4,
        [QUOTA.lottery]: 1,
    },
    yumumu: {
        [QUOTA.help]: 12,
        [QUOTA.helpWithdraw]: 3,
        [QUOTA.curse]: 2,
        [QUOTA.bless]: 2,
        [QUOTA.cleanseCurse]: 2,
        [QUOTA.cleanseBless]: 1,
        [QUOTA.urge]: 4,
        [QUOTA.lottery]: 2,
    },
};

export const YUMUMU_LU_BAN_MS = 60 * 60 * 1000;
export const YUMUMU_IMPOTENCE_CHANCE = 0.20;
export const YUMUMU_IMPOTENCE_HELP_FAIL = 0.08;

export function isExtraDeerId(id) {
    return !!id && EXTRA_DEER_IDS.includes(String(id));
}

export function getExtraDeerDef(id) {
    const base = EXTRA_DEER[id];
    if (!base) return null;
    return {
        ...base,
        tagline: formatTalentTagline(base, 99),
        synergyTip: formatTalentCatalogLine(base, formatExtraDeerQuotaBrief(id)),
    };
}

export function getExtraDeerSkill(id) {
    return EXTRA_DEER_SKILLS[id] || null;
}

export function resolveExtraDeerId(token) {
    const raw = String(token ?? '').trim().replace(/\s+/g, '');
    if (!raw) return null;
    if (EXTRA_DEER[raw]) return raw;
    const lower = raw.toLowerCase();
    if (EXTRA_DEER[lower]) return lower;
    if (EXTRA_DEER_ALIASES[raw]) return EXTRA_DEER_ALIASES[raw];
    if (EXTRA_DEER_ALIASES[lower]) return EXTRA_DEER_ALIASES[lower];
    for (const d of Object.values(EXTRA_DEER)) {
        if (raw === d.name || raw === d.name.replace(/鹿$/, '')) return d.id;
    }
    return null;
}

export function resolveExtraDeerQuotas(id) {
    return EXTRA_DEER_QUOTA_TABLE[id] || {};
}

export function listExtraDeerQuotaGroups(id) {
    const q = resolveExtraDeerQuotas(id);
    return QUOTA_GROUPS.map((g) => ({
        title: g.title,
        sectionKey: g.sectionKey,
        rows: g.ids
            .filter((quotaId) => (q[quotaId] ?? 0) > 0)
            .map((quotaId) => ({
                id: quotaId,
                label: QUOTA_LABELS[quotaId] || quotaId,
                max: q[quotaId],
            })),
    })).filter((g) => g.rows.length > 0);
}

export function formatExtraDeerQuotaBrief(id) {
    const q = resolveExtraDeerQuotas(id);
    const help = q[QUOTA.help] ?? 0;
    const hw = q[QUOTA.helpWithdraw] ?? 0;
    return `帮鹿${help} · 帮戒${hw}`;
}

export function buildExtraDeerMods(def) {
    if (!def) return null;
    const full = getExtraDeerDef(def.id) || def;
    return {
        id: full.id,
        name: full.name,
        emoji: full.emoji,
        tagline: full.tagline,
        synergyTip: full.synergyTip,
        helpQuota: full.helpQuota,
        helpWithdrawQuota: full.helpWithdrawQuota,
        helpFailDelta: full.helpFailDelta || 0,
        deathDelta: full.deathDelta || 0,
        safeBonus: full.safeBonus || 0,
        impotenceChance: full.impotenceChance || 0,
        impotenceHelpFailBonus: full.impotenceHelpFailBonus || 0,
        extraDeer: true,
    };
}

export function resolvePlayProfession(id) {
    if (!id) return null;
    if (isExtraDeerId(id)) return buildExtraDeerMods(getExtraDeerDef(id));
    return null;
}
