import { DEATH_REASON, META_PREFIX, MEIJIA_TEAM_SYNC_MAX } from '../constants/game.js';
import {
    EXTRA_DEER,
    getExtraDeerDef,
    isExtraDeerId,
    YUMUMU_IMPOTENCE_CHANCE,
    YUMUMU_IMPOTENCE_HELP_FAIL,
    YUMUMU_LU_BAN_MS,
} from '../constants/extra-deer.js';
import { getDayProfessionId } from './profession.js';

export {
    isExtraDeerId,
    getExtraDeerDef,
    resolveExtraDeerId,
    buildExtraDeerMods,
    resolveExtraDeerQuotas,
} from '../constants/extra-deer.js';

export function luBanUntilKey(day) {
    return `${META_PREFIX.LU_BAN_UNTIL}${day}`;
}

export function meijiaTeamKey(day) {
    return `${META_PREFIX.MEIJIA_TEAM}${day}`;
}

export function meijiaTeamSyncKey(day) {
    return `${META_PREFIX.MEIJIA_TEAM_SYNC}${day}`;
}

export function getMeijiaTeamSyncCount(monthData, day) {
    const raw = monthData?.[meijiaTeamSyncKey(day)];
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function bumpMeijiaTeamSyncCount(monthData, day) {
    const key = meijiaTeamSyncKey(day);
    const next = getMeijiaTeamSyncCount(monthData, day) + 1;
    monthData[key] = next;
    return next;
}

export function clearMeijiaTeamSyncCount(monthData, day) {
    if (monthData) delete monthData[meijiaTeamSyncKey(day)];
}

export function impotenceKey(day) {
    return `${META_PREFIX.IMPOTENCE}${day}`;
}

export function yujieDaipaiKey(day) {
    return `${META_PREFIX.YUJIE_DAIPAI}${day}`;
}

export function hasYujieImperialGuarantee(monthData, day) {
    return !!monthData?.[yujieDaipaiKey(day)];
}

export function applyYujieImperialGuarantee(monthData, day) {
    monthData[yujieDaipaiKey(day)] = 1;
}

export function clearYujieImperialGuarantee(monthData, day) {
    if (monthData) delete monthData[yujieDaipaiKey(day)];
}

export function getMeijiaTeamPartnerId(monthData, day) {
    const raw = monthData?.[meijiaTeamKey(day)];
    return raw != null && raw !== '' ? String(raw) : null;
}

export function clearMeijiaTeamLink(monthData, partnerMonth, day) {
    if (monthData) {
        delete monthData[meijiaTeamKey(day)];
        clearMeijiaTeamSyncCount(monthData, day);
    }
    if (partnerMonth) delete partnerMonth[meijiaTeamKey(day)];
}

export function setMeijiaTeamLink(meijiaMonth, partnerMonth, meijiaId, partnerId, day) {
    meijiaMonth[meijiaTeamKey(day)] = String(partnerId);
    partnerMonth[meijiaTeamKey(day)] = String(meijiaId);
}

export function isLuBanned(monthData, day, now = Date.now()) {
    const until = monthData?.[luBanUntilKey(day)];
    return typeof until === 'number' && until > now;
}

export function getLuBanRemainingMs(monthData, day, now = Date.now()) {
    const until = monthData?.[luBanUntilKey(day)];
    if (typeof until !== 'number' || until <= now) return 0;
    return until - now;
}

export function applyLuBan(targetMonth, day, durationMs = YUMUMU_LU_BAN_MS) {
    targetMonth[luBanUntilKey(day)] = Date.now() + durationMs;
}

export function clearLuBan(monthData, day) {
    if (monthData) delete monthData[luBanUntilKey(day)];
}

export function hasImpotence(monthData, day) {
    return !!monthData?.[impotenceKey(day)];
}

export function applyImpotence(targetMonth, day) {
    targetMonth[impotenceKey(day)] = 1;
}

export function consumeImpotence(monthData, day) {
    if (!monthData?.[impotenceKey(day)]) return false;
    delete monthData[impotenceKey(day)];
    return true;
}

export function getImpotenceHelpFailBonus(monthData, day) {
    if (!hasImpotence(monthData, day)) return 0;
    return YUMUMU_IMPOTENCE_HELP_FAIL;
}

export function rejectIfLuBanned(monthData, day) {
    if (!isLuBanned(monthData, day)) return null;
    const leftMin = Math.max(1, Math.ceil(getLuBanRemainingMs(monthData, day) / 60000));
    return { ok: false, type: 'lu_banned', leftMin };
}

function readDayDeath(monthData, day) {
    const raw = monthData?.[day] ?? monthData?.[String(day)];
    if (raw == null) return false;
    if (typeof raw === 'number') return false;
    return !!raw.d;
}

/** 王美嘉不可戒鹿（自戒 / 被帮戒） */
export function rejectIfMeijiaWithdrawal(monthData, day) {
    if (getDayProfessionId(monthData, day) !== 'meijia') return null;
    return { ok: false, type: 'meijia_no_withdraw' };
}

/** 王美嘉组队搭档：王美嘉存活时禁自鹿，王美嘉鹿死后方可自鹿 */
export function rejectIfMeijiaTeamPartnerLu(deerData, userId, date, day, {
    getUserRecord,
    getMonthData,
}) {
    const monthData = getMonthData(getUserRecord(deerData, userId), date);
    if (!monthData) return null;
    const partnerId = getMeijiaTeamPartnerId(monthData, day);
    if (!partnerId) return null;
    if (getDayProfessionId(monthData, day) === 'meijia') return null;
    const meijiaMonth = getMonthData(getUserRecord(deerData, partnerId), date);
    if (!readDayDeath(meijiaMonth, day)) {
        return { ok: false, type: 'team_partner_no_lu', meijiaId: String(partnerId) };
    }
    return null;
}

export function syncMeijiaTeamLu(deerData, userId, date, day, {
    getUserRecord,
    ensureMonthData,
    ensureDayEntry,
    getMonthData,
    preLuCount,
}) {
    const monthData = getMonthData(getUserRecord(deerData, userId), date);
    if (getDayProfessionId(monthData, day) !== 'meijia') return null;
    if (typeof preLuCount === 'number' && preLuCount < 0) return null;
    const partnerId = getMeijiaTeamPartnerId(monthData, day);
    if (!partnerId || String(partnerId) === String(userId)) return null;
    if (getMeijiaTeamSyncCount(monthData, day) >= MEIJIA_TEAM_SYNC_MAX) return null;
    const partnerMonth = ensureMonthData(deerData, partnerId, date);
    const partnerEntry = ensureDayEntry(partnerMonth, day);
    if (partnerEntry.d) return null;
    partnerEntry.c += 1;
    partnerEntry.a += 1;
    const syncCount = bumpMeijiaTeamSyncCount(monthData, day);
    return {
        partnerId,
        partnerCount: partnerEntry.c,
        syncCount,
        syncMax: MEIJIA_TEAM_SYNC_MAX,
    };
}

export function resolveMeijiaTeamOnDeath(deerData, deadUserId, date, day, {
    getUserRecord,
    getMonthData,
    ensureMonthData,
    ensureDayEntry,
    applyDeathFn,
    killerId = null,
}) {
    const myMonth = getMonthData(getUserRecord(deerData, deadUserId), date);
    if (!myMonth) return null;
    const partnerId = getMeijiaTeamPartnerId(myMonth, day);
    if (!partnerId) return null;

    const partnerMonth = ensureMonthData(deerData, partnerId, date);
    const partnerEntry = ensureDayEntry(partnerMonth, day);
    let wipe = null;
    if (!partnerEntry.d) {
        const snap = applyDeathFn(partnerEntry, {
            reason: DEATH_REASON.MEIJIA_TEAM,
            killerId: killerId ?? deadUserId,
        });
        wipe = {
            partnerId: String(partnerId),
            partnerSnap: snap,
            partnerCount: partnerEntry.c,
        };
    }
    clearMeijiaTeamLink(myMonth, partnerMonth, day);
    return { ...(wipe || { partnerId: String(partnerId) }), dissolved: true };
}

export function applyYumumuHelpSynergy(helperMonth, targetMonth, day, result) {
    if (getDayProfessionId(helperMonth, day) !== 'yumumu') return;
    if (result?.type !== 'help' && result?.type !== 'revive') return;
    const chance = YUMUMU_IMPOTENCE_CHANCE;
    if (Math.random() >= chance) return;
    applyImpotence(targetMonth, day);
    result.yumumuImpotence = true;
}

export function rejectIfWrongExtraDeer(monthData, day, expectedId) {
    const id = getDayProfessionId(monthData, day);
    if (!id) return { ok: false, type: 'profession_required' };
    if (id !== expectedId) {
        const skill = EXTRA_DEER[expectedId];
        const current = isExtraDeerId(id) ? getExtraDeerDef(id) : null;
        return {
            ok: false,
            type: 'job_skill_wrong_profession',
            expected: skill?.name || expectedId,
            current: current?.name || id,
        };
    }
    return null;
}
