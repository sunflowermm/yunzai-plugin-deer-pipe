import { DEATH_REASON, META_PREFIX } from '../constants/game.js';
import {
    EXTRA_DEER,
    getExtraDeerDef,
    isExtraDeerId,
    YUMUMU_IMPOTENCE_CHANCE,
    YUMUMU_IMPOTENCE_HELP_FAIL,
    YUMUMU_LU_BAN_MS,
} from '../constants/extra-deer.js';
import { isFestivalActive } from '../constants/skins.js';
import { getDayProfessionId } from './profession.js';

export {
    isExtraDeerId,
    getExtraDeerDef,
    resolveExtraDeerId,
    buildExtraDeerMods,
    resolveExtraDeerQuotas,
} from '../constants/extra-deer.js';

export function meijiaTeamKey(day) {
    return `${META_PREFIX.MEIJIA_TEAM}${day}`;
}

export function luBanUntilKey(day) {
    return `${META_PREFIX.LU_BAN_UNTIL}${day}`;
}

export function impotenceKey(day) {
    return `${META_PREFIX.IMPOTENCE}${day}`;
}

export function getMeijiaTeamPartnerId(monthData, day) {
    const raw = monthData?.[meijiaTeamKey(day)];
    return raw != null && raw !== '' ? String(raw) : null;
}

export function clearMeijiaTeamLink(monthData, partnerMonth, day) {
    if (monthData) delete monthData[meijiaTeamKey(day)];
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

export function syncMeijiaTeamLu(deerData, userId, date, day, {
    getUserRecord,
    ensureMonthData,
    ensureDayEntry,
    getMonthData,
}) {
    const monthData = getMonthData(getUserRecord(deerData, userId), date);
    if (getDayProfessionId(monthData, day) !== 'meijia') return null;
    const partnerId = getMeijiaTeamPartnerId(monthData, day);
    if (!partnerId || String(partnerId) === String(userId)) return null;
    const partnerMonth = ensureMonthData(deerData, partnerId, date);
    const partnerEntry = ensureDayEntry(partnerMonth, day);
    if (partnerEntry.d) return null;
    partnerEntry.c += 1;
    partnerEntry.a += 1;
    return { partnerId, partnerCount: partnerEntry.c };
}

/** 组队一方鹿死：搭档双亡 → 双向解除绑定 */
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
    if (result?.type !== 'help') return;
    const chance = getExtraDeerDef('yumumu')?.impotenceChance ?? YUMUMU_IMPOTENCE_CHANCE;
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

export function resolveExtraDeerPortraitSkin(date = new Date()) {
    return isFestivalActive('duanwu', date) ? 'duanwu' : 'default';
}
