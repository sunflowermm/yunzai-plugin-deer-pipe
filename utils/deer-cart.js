import { META_PREFIX } from '../constants/game.js';

export function deerCartInviteKey(day) {
    return `${META_PREFIX.DEER_CART_INVITE}${day}`;
}

export function deerCartPartnerKey(day) {
    return `${META_PREFIX.DEER_CART}${day}`;
}

export function deerCartRoleKey(day) {
    return `${META_PREFIX.DEER_CART_ROLE}${day}`;
}

export function getDeerCartInvite(monthData, day) {
    const raw = monthData?.[deerCartInviteKey(day)];
    return raw != null && raw !== '' ? String(raw) : null;
}

export function setDeerCartInvite(helperMonth, driverId, day) {
    helperMonth[deerCartInviteKey(day)] = String(driverId);
}

export function clearDeerCartInvite(monthData, day) {
    if (monthData) delete monthData[deerCartInviteKey(day)];
}

export function getDeerCartPartnerId(monthData, day) {
    const raw = monthData?.[deerCartPartnerKey(day)];
    return raw != null && raw !== '' ? String(raw) : null;
}

export function getDeerCartRole(monthData, day) {
    const raw = monthData?.[deerCartRoleKey(day)];
    return raw === 'driver' || raw === 'helper' ? raw : null;
}

export function isInDeerCart(monthData, day) {
    return !!getDeerCartPartnerId(monthData, day);
}

export function activateDeerCart(driverMonth, helperMonth, driverId, helperId, day) {
    clearDeerCartInvite(helperMonth, day);
    driverMonth[deerCartPartnerKey(day)] = String(helperId);
    driverMonth[deerCartRoleKey(day)] = 'driver';
    helperMonth[deerCartPartnerKey(day)] = String(driverId);
    helperMonth[deerCartRoleKey(day)] = 'helper';
}

export function clearDeerCartPair(driverMonth, helperMonth, day) {
    if (driverMonth) {
        delete driverMonth[deerCartPartnerKey(day)];
        delete driverMonth[deerCartRoleKey(day)];
    }
    if (helperMonth) {
        delete helperMonth[deerCartPartnerKey(day)];
        delete helperMonth[deerCartRoleKey(day)];
        clearDeerCartInvite(helperMonth, day);
    }
}

export function rejectIfCartHelperLu(monthData, day) {
    if (getDeerCartRole(monthData, day) !== 'helper') return null;
    return { ok: false, type: 'cart_helper_no_lu' };
}

/** 发车位已上车：连鹿由「发车」后自动模拟，勿手打刷屏 */
export function rejectIfCartDriverLu(monthData, day) {
    if (getDeerCartRole(monthData, day) !== 'driver') return null;
    return { ok: false, type: 'cart_driver_no_lu' };
}

export function rejectIfCartHelpWrongTarget(helperMonth, day, targetId) {
    if (getDeerCartRole(helperMonth, day) !== 'helper') return null;
    const driverId = getDeerCartPartnerId(helperMonth, day);
    if (driverId && String(driverId) !== String(targetId)) {
        return { ok: false, type: 'cart_help_wrong_target', driverId };
    }
    return null;
}

/** 发车人鹿死：帮鹿位无次数可救则清 _dc_/_dcr_ */
export function resolveDeerCartOnDriverDeath(deerData, driverId, date, day, {
    getUserRecord,
    getMonthData,
    ensureMonthData,
    getHelperQuotaLeft,
}) {
    const driverMonth = getMonthData(getUserRecord(deerData, driverId), date);
    if (!driverMonth || getDeerCartRole(driverMonth, day) !== 'driver') return null;
    const helperId = getDeerCartPartnerId(driverMonth, day);
    if (!helperId) return null;

    const helperMonth = ensureMonthData(deerData, helperId, date);
    const helpQuotaLeft = getHelperQuotaLeft(helperMonth, day);
    if (helpQuotaLeft > 0) {
        return { helperId: String(helperId), helpQuotaLeft, dissolved: false };
    }
    clearDeerCartPair(driverMonth, helperMonth, day);
    return { helperId: String(helperId), helpQuotaLeft: 0, dissolved: true };
}
