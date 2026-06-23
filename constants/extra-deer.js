/** 番外鹿：不在 PROFESSIONS 八职业表内，独立转职与玩法 */

import { QUOTA, QUOTA_GROUPS, QUOTA_LABELS } from './profession-quotas.js';
import { formatTalentCatalogLine, formatTalentPerkBrief, formatTalentTagline } from './talent-text.js';
import {
    YUMUMU_BIND_MINUTES,
    YUMUMU_IMPOTENCE_CHANCE,
    YUMUMU_IMPOTENCE_HELP_FAIL,
    formatYumumuBindCutoffHint,
    EXTRA_DEER_TRANSFER_HINT,
    YUMUMU_BIND_CUTOFF_HOUR,
    YUMUMU_BIND_CUTOFF_LABEL,
    YUMUMU_LU_BAN_MS,
    YUJIE_IMPERIAL_WIN_BONUS,
    isYumumuBindAfterCutoff,
    XUYUEZHEN_CHAOS_OUTCOME_LABELS,
} from './extra-deer-meta.js';

export {
    EXTRA_DEER_TRANSFER_HINT,
    YUMUMU_BIND_CUTOFF_HOUR,
    YUMUMU_BIND_CUTOFF_LABEL,
    YUMUMU_BIND_MINUTES,
    YUMUMU_IMPOTENCE_CHANCE,
    YUMUMU_IMPOTENCE_HELP_FAIL,
    YUMUMU_LU_BAN_MS,
    YUJIE_IMPERIAL_WIN_BONUS,
    isYumumuBindAfterCutoff,
    formatYumumuBindCutoffHint,
    XUYUEZHEN_CHAOS_OUTCOME_LABELS,
};

export const EXTRA_DEER_IDS = Object.freeze(['meijia', 'yumumu', 'yujie', 'xuyuezhen']);

/** 天赋数值（tagline/synergyTip 由 talent-text 生成） */
export const EXTRA_DEER = {
    meijia: {
        id: 'meijia',
        name: '王美嘉鹿',
        emoji: '👑',
        helpFailDelta: -0.05,
        deathDelta: -0.03,
        safeBonus: 1,
    },
    yumumu: {
        id: 'yumumu',
        name: '雨木木鹿',
        emoji: '🌧️',
        helpFailDelta: -0.04,
    },
    yujie: {
        id: 'yujie',
        name: '语姐鹿',
        emoji: '👣',
        deathDelta: -0.02,
        imperialWinBonus: 0.20,
    },
    xuyuezhen: {
        id: 'xuyuezhen',
        name: '许月珍鹿',
        emoji: '🦖',
        lotteryLuckDelta: 0.10,
        helpFailDelta: 0.03,
    },
};

export const EXTRA_DEER_SKILLS = {
    meijia: {
        id: 'meijia',
        name: '组队',
        cmd: '组队@',
        desc: '绑定 1 名鹿友：王美嘉自鹿 +1 时搭档同步 +1（每日上限 5 次 · 净值≥0 才同步）· 任一方鹿死双亡 · 王美嘉不可戒鹿 · 1 次/日',
    },
    yumumu: {
        id: 'yumumu',
        name: '束缚',
        cmd: '束缚@',
        desc: '',
    },
    yujie: {
        id: 'yujie',
        name: '带派',
        cmd: '带派',
        desc: '脚丫子蓄势：下一次皇城鹿掷骰必胜 · 天赋皇城胜势 +20% · 1 次/日',
    },
    xuyuezhen: {
        id: 'xuyuezhen',
        name: '操你血妈',
        cmd: '操你血妈',
        desc: '绿恐龙暴走：随机 ±2/±1/咒/福/催更/空签 · 抽鹿签吉兆 +10% · 1 次/日',
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
    语姐: 'yujie',
    语姐鹿: 'yujie',
    许月珍: 'xuyuezhen',
    许月珍鹿: 'xuyuezhen',
    月珍: 'xuyuezhen',
    月珍鹿: 'xuyuezhen',
};

/** 番外鹿通用基底：未在 overrides 单列的玩法继承此表，避免 0 次封印 */
export const EXTRA_DEER_COMMON_QUOTAS = {
    [QUOTA.help]: 6,
    [QUOTA.helpWithdraw]: 2,
    [QUOTA.steal]: 2,
    [QUOTA.curse]: 2,
    [QUOTA.bless]: 2,
    [QUOTA.cleanseCurse]: 2,
    [QUOTA.cleanseBless]: 1,
    [QUOTA.arena]: 2,
    [QUOTA.imperial]: 2,
    [QUOTA.lottery]: 2,
    [QUOTA.urge]: 4,
    [QUOTA.borrow]: 2,
    [QUOTA.bumper]: 2,
    [QUOTA.fakeWithdraw]: 2,
    [QUOTA.howl]: 2,
    [QUOTA.greed]: 1,
    [QUOTA.groupSplash]: 1,
    [QUOTA.sacrifice]: 1,
    [QUOTA.dream]: 1,
    [QUOTA.spectralCurse]: 1,
    [QUOTA.vengeance]: 1,
    [QUOTA.reviveLottery]: 1,
    [QUOTA.together]: 1,
};

/** 相对 common 的专精覆盖（只写与基底不同的项） */
export const EXTRA_DEER_QUOTA_OVERRIDES = {
    meijia: {
        [QUOTA.steal]: 1,
        [QUOTA.cleanseCurse]: 1,
        [QUOTA.lottery]: 1,
    },
    yumumu: {
        [QUOTA.help]: 18,
        [QUOTA.helpWithdraw]: 3,
    },
    yujie: {
        [QUOTA.help]: 8,
        [QUOTA.urge]: 8,
        [QUOTA.imperial]: 4,
    },
    xuyuezhen: {
        [QUOTA.lottery]: 4,
        [QUOTA.cleanseCurse]: 1,
    },
};

export function isExtraDeerId(id) {
    return !!id && EXTRA_DEER_IDS.includes(String(id));
}

export function getExtraDeerDef(id) {
    const base = EXTRA_DEER[id];
    if (!base) return null;
    const q = resolveExtraDeerQuotas(id);
    const merged = {
        ...base,
        helpQuota: q[QUOTA.help],
        helpWithdrawQuota: q[QUOTA.helpWithdraw],
    };
    if (id === 'yumumu') {
        merged.impotenceChance = YUMUMU_IMPOTENCE_CHANCE;
        merged.impotenceHelpFailBonus = YUMUMU_IMPOTENCE_HELP_FAIL;
    }
    return {
        ...merged,
        tagline: formatTalentTagline(merged, 99),
        synergyTip: formatTalentCatalogLine(merged, formatExtraDeerQuotaBrief(id)),
    };
}

export function getExtraDeerSkill(id) {
    const base = EXTRA_DEER_SKILLS[id];
    if (!base) return null;
    if (id === 'yumumu') {
        return {
            ...base,
            desc: `目标 ${YUMUMU_BIND_MINUTES} 分钟禁自鹿（仍可被帮鹿）· 仅 ${formatYumumuBindCutoffHint()}可用 · 1 次/日`,
        };
    }
    return base;
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
    return { ...EXTRA_DEER_COMMON_QUOTAS, ...(EXTRA_DEER_QUOTA_OVERRIDES[id] || {}) };
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
    const full = getExtraDeerDef(def?.id) || def;
    if (!full) return null;
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
        imperialWinBonus: full.imperialWinBonus || 0,
        lotteryLuckDelta: full.lotteryLuckDelta || 0,
        extraDeer: true,
    };
}

/** 群播 / 说明：番外鹿一行摘要（配额 + 天赋 + 专属技） */
export function formatExtraDeerListText() {
    return EXTRA_DEER_IDS.map((id) => {
        const p = getExtraDeerDef(id);
        const skill = EXTRA_DEER_SKILLS[id];
        const perk = formatTalentPerkBrief(p, 3);
        const skillTxt = skill ? ` · ${skill.cmd}` : '';
        return `${p.emoji} ${p.name}：${formatExtraDeerQuotaBrief(id)}${perk}${skillTxt}`;
    }).join('\n');
}
