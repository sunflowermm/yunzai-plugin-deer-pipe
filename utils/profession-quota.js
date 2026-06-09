import { META_PREFIX } from '../constants/game.js';
import { QUOTA, resolveProfessionQuotas } from '../constants/profession-quotas.js';
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

/** 当日某玩法次数上限（须已转职；未转职返回 0） */
export function getProfessionQuotaLimit(monthData, day, quotaId) {
    const profId = getDayProfessionId(monthData, day);
    if (!profId) return 0;
    const limits = resolveProfessionQuotas(profId);
    let limit = limits[quotaId] ?? 0;
    if (quotaId === QUOTA.help && monthData) {
        limit += monthData[helpQuotaBonusKey(day)] || 0;
    }
    return Math.max(0, limit);
}

/** 当日全部玩法配额上限（须已转职） */
export function getProfessionQuotaMap(monthData, day) {
    const profId = getDayProfessionId(monthData, day);
    if (!profId) return null;
    const map = resolveProfessionQuotas(profId);
    const out = { ...map };
    if (monthData && out[QUOTA.help] != null) {
        out[QUOTA.help] += monthData[helpQuotaBonusKey(day)] || 0;
    }
    return out;
}
