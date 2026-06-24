import { META_PREFIX } from '../constants/game.js';
import { QUOTA, resolveProfessionQuotas } from '../constants/profession-quotas.js';
import { resolveExtraDeerQuotas, isExtraDeerId } from '../constants/extra-deer.js';
import { getDayProfessionId } from './profession.js';

export {
    QUOTA,
    BASE_QUOTAS,
    QUOTA_LABELS,
    PROFESSION_QUOTA_TABLE,
    formatProfessionQuotaSummary,
    QUOTA_GROUPS,
    QUOTA_CHIP_COLORS,
    quotaChipColor,
    listProfessionQuotaRows,
    listProfessionQuotaGroups,
    buildUsageBarSections,
} from '../constants/profession-quotas.js';

export function helpQuotaBonusKey(day) {
    return `${META_PREFIX.HELP_BONUS}${day}`;
}

export function jobSkillQuotaBonusKey(day, quotaId) {
    return `${META_PREFIX.JOB_SKILL_QUOTA}${quotaId}_${day}`;
}

export function grantJobSkillQuotaBonus(monthData, day, quotaId, amount = 1) {
    if (!monthData || amount <= 0) return 0;
    const key = jobSkillQuotaBonusKey(day, quotaId);
    monthData[key] = (monthData[key] || 0) + amount;
    return monthData[key];
}

function readJobSkillQuotaBonus(monthData, day, quotaId) {
    return monthData?.[jobSkillQuotaBonusKey(day, quotaId)] || 0;
}

/** 当日某玩法次数上限（须已转职；未转职返回 0） */
export function getProfessionQuotaLimit(monthData, day, quotaId) {
    const profId = getDayProfessionId(monthData, day);
    if (!profId) return 0;
    const limits = isExtraDeerId(profId)
        ? resolveExtraDeerQuotas(profId)
        : resolveProfessionQuotas(profId);
    let limit = limits[quotaId] ?? 0;
    if (monthData) {
        if (quotaId === QUOTA.help) {
            limit += monthData[helpQuotaBonusKey(day)] || 0;
        }
        limit += readJobSkillQuotaBonus(monthData, day, quotaId);
    }
    return Math.max(0, limit);
}

/** 当日全部玩法配额上限（须已转职） */
export function getProfessionQuotaMap(monthData, day) {
    const profId = getDayProfessionId(monthData, day);
    if (!profId) return null;
    const map = isExtraDeerId(profId)
        ? { ...resolveExtraDeerQuotas(profId) }
        : resolveProfessionQuotas(profId);
    const out = { ...map };
    if (monthData) {
        if (out[QUOTA.help] != null) {
            out[QUOTA.help] += monthData[helpQuotaBonusKey(day)] || 0;
        }
        for (const id of Object.values(QUOTA)) {
            if (out[id] != null) {
                out[id] += readJobSkillQuotaBonus(monthData, day, id);
            }
        }
    }
    return out;
}
