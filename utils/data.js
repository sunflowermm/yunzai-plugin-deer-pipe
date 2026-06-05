/** 签到数据读写、游戏逻辑与格式迁移 */

import {
    DAILY_HELP_QUOTA,
    DAILY_SAFE_LIMIT,
    DEATH_REASON,
    HELP_KILL_CHANCE,
    OVERLIMIT_DEATH_CHANCE_BASE,
    OVERLIMIT_DEATH_CHANCE_STEP,
    calcOverlimitDeathChance,
    formatChancePercent,
} from '../constants/game.js';
import { getDeathReasonText } from '../constants/game.js';

const MONTH_KEY_RE = /^\d{4}-\d{2}$/;
const DAY_KEY_RE = /^\d{1,2}$/;

/** 单日: c=有效次数 a=尝试 d=鹿死 snap=快照 dc=鹿死次数 dr=死因 dk=凶手 helped revived helpBy */
export function createDayEntry(count = 0) {
    return { c: count, a: count, d: 0, snap: 0, dc: 0, dr: '', dk: '', helped: 0, revived: 0, helpBy: {} };
}

export function normalizeDayEntry(raw) {
    if (raw == null) return null;
    if (typeof raw === 'number') {
        const n = Math.max(0, raw);
        return { c: n, a: n, d: 0, snap: 0, dc: 0, dr: '', dk: '', helped: 0, revived: 0, helpBy: {} };
    }
    if (typeof raw === 'object') {
        return {
            c: raw.c ?? 0,
            a: raw.a ?? raw.c ?? 0,
            d: raw.d ? 1 : 0,
            snap: raw.snap ?? 0,
            dc: raw.dc ?? 0,
            dr: raw.dr ?? '',
            dk: raw.dk ?? '',
            helped: raw.helped ?? 0,
            revived: raw.revived ?? 0,
            helpBy: raw.helpBy ?? {},
        };
    }
    return null;
}

export function getEffectiveCount(raw) {
    const entry = normalizeDayEntry(raw);
    if (!entry || entry.d) return 0;
    return entry.c;
}

export function getDaySnap(raw) {
    const entry = normalizeDayEntry(raw);
    if (!entry?.d) return 0;
    return entry.snap ?? 0;
}

export function getDeathReason(raw) {
    const entry = normalizeDayEntry(raw);
    if (!entry?.d) return '';
    return entry.dr || DEATH_REASON.SELF;
}

export function isDayDead(raw) {
    const entry = normalizeDayEntry(raw);
    return !!entry?.d;
}

export function getDeathKillerId(raw) {
    const entry = normalizeDayEntry(raw);
    return entry?.dk || '';
}

export function getDayEntry(monthData, day) {
    if (!monthData) return null;
    return normalizeDayEntry(monthData[String(day)]);
}

export function ensureDayEntry(monthData, day) {
    const dayKey = String(day);
    if (!monthData[dayKey]) monthData[dayKey] = createDayEntry(0);
    else monthData[dayKey] = normalizeDayEntry(monthData[dayKey]);
    return monthData[dayKey];
}

export function getMonthKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

export function parseMonthInput(text, defaultDate = new Date()) {
    const trimmed = text.trim();
    const full = trimmed.match(/^(\d{4})-(\d{1,2})$/);
    if (full) {
        const year = parseInt(full[1], 10);
        const month = parseInt(full[2], 10);
        if (month >= 1 && month <= 12) return new Date(year, month - 1, 1);
    }
    const monthOnly = trimmed.match(/^(\d{1,2})$/);
    if (monthOnly) {
        const month = parseInt(monthOnly[1], 10);
        if (month >= 1 && month <= 12) {
            return new Date(defaultDate.getFullYear(), month - 1, 1);
        }
    }
    return null;
}

function inferYearFromMonth(lastSignMonth, now = new Date()) {
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();
    return lastSignMonth > curMonth ? curYear - 1 : curYear;
}

function isMonthKey(key) {
    return MONTH_KEY_RE.test(key);
}

function isDayKey(key) {
    return DAY_KEY_RE.test(key);
}

/** 帮🦌者当日配额存储键（挂在帮🦌者自己的月数据上） */
function helperQuotaKey(day) {
    return `_hq_${day}`;
}

export function getHelperQuota(monthData, day) {
    if (!monthData) return { used: 0, to: {} };
    const key = helperQuotaKey(day);
    if (!monthData[key]) monthData[key] = { used: 0, to: {} };
    return monthData[key];
}

export function getHelperQuotaLeft(monthData, day) {
    return Math.max(0, DAILY_HELP_QUOTA - getHelperQuota(monthData, day).used);
}

function consumeHelperQuota(helperMonthData, day, targetId) {
    const q = getHelperQuota(helperMonthData, day);
    q.used += 1;
    const t = String(targetId);
    q.to[t] = (q.to[t] || 0) + 1;
    return {
        helpQuotaUsed: q.used,
        helpQuotaLeft: Math.max(0, DAILY_HELP_QUOTA - q.used),
    };
}

function attachQuota(result, quota) {
    return { ...result, ...quota };
}

function migrateMonthDays(monthData) {
    const out = {};
    for (const [k, v] of Object.entries(monthData)) {
        if (isDayKey(k)) out[k] = normalizeDayEntry(v);
        else if (k.startsWith('_hq_')) out[k] = v;
    }
    return out;
}

export function migrateUserRecord(userRecord, now = new Date()) {
    if (!userRecord || typeof userRecord !== 'object') return {};

    if (Object.keys(userRecord).some(isMonthKey)) {
        const cleaned = {};
        for (const [k, v] of Object.entries(userRecord)) {
            if (isMonthKey(k) && v && typeof v === 'object') cleaned[k] = migrateMonthDays(v);
        }
        return cleaned;
    }

    const monthData = {};
    for (const [k, v] of Object.entries(userRecord)) {
        if (isDayKey(k)) monthData[k] = normalizeDayEntry(v);
    }
    if (!Object.keys(monthData).length) return {};

    let year = now.getFullYear();
    if (userRecord.lastSignMonth !== undefined) {
        year = inferYearFromMonth(userRecord.lastSignMonth, now);
    }
    const month = String(userRecord.lastSignMonth ?? (now.getMonth() + 1)).padStart(2, '0');
    return { [`${year}-${month}`]: monthData };
}

export function migrateAllData(deerData, now = new Date()) {
    if (!deerData || typeof deerData !== 'object') return false;
    let changed = false;

    for (const userId of Object.keys(deerData)) {
        const raw = deerData[userId];
        if (!raw || typeof raw !== 'object') continue;

        const needsMigrate = raw.lastSignMonth !== undefined
            || Object.keys(raw).some(k => isDayKey(k))
            || Object.values(raw).some(v => typeof v === 'number');

        if (needsMigrate || !Object.keys(raw).some(isMonthKey)) {
            const migrated = migrateUserRecord(raw, now);
            if (JSON.stringify(raw) !== JSON.stringify(migrated)) {
                deerData[userId] = migrated;
                changed = true;
            }
        } else {
            for (const monthKey of Object.keys(raw)) {
                if (!isMonthKey(monthKey)) continue;
                const migratedMonth = migrateMonthDays(raw[monthKey]);
                if (JSON.stringify(raw[monthKey]) !== JSON.stringify(migratedMonth)) {
                    raw[monthKey] = migratedMonth;
                    changed = true;
                }
            }
        }
    }
    return changed;
}

export function getUserRecord(deerData, userId) {
    return deerData?.[userId] || deerData?.[String(userId)] || null;
}

export function getMonthData(userRecord, date) {
    if (!userRecord) return null;
    return userRecord[getMonthKey(date)] || null;
}

export function ensureMonthData(deerData, userId, date) {
    const uid = String(userId);
    if (!deerData[uid]) deerData[uid] = {};
    const monthKey = getMonthKey(date);
    if (!deerData[uid][monthKey]) deerData[uid][monthKey] = {};
    return deerData[uid][monthKey];
}

export function getDayCount(userRecord, date, day) {
    return getEffectiveCount(getDayEntry(getMonthData(userRecord, date), day));
}

export function sumMonthData(monthData) {
    if (!monthData) return 0;
    return Object.keys(monthData)
        .filter(isDayKey)
        .reduce((acc, k) => acc + getEffectiveCount(monthData[k]), 0);
}

export function sumYearData(userRecord, year) {
    if (!userRecord) return 0;
    const prefix = `${year}-`;
    return Object.entries(userRecord)
        .filter(([k]) => k.startsWith(prefix))
        .reduce((acc, [, monthData]) => acc + sumMonthData(monthData), 0);
}

export function getYearMonths(userRecord, year) {
    if (!userRecord) return {};
    const prefix = `${year}-`;
    const result = {};
    for (const [k, v] of Object.entries(userRecord)) {
        if (k.startsWith(prefix)) result[k] = v;
    }
    return result;
}

export function hasMonthData(userRecord, date) {
    const month = getMonthData(userRecord, date);
    if (!month) return false;
    return Object.keys(month).some(k => isDayKey(k) && (getEffectiveCount(month[k]) > 0 || isDayDead(month[k])));
}

export function hasYearData(userRecord, year) {
    return sumYearData(userRecord, year) > 0;
}

export function calcStreak(monthData, upToDay) {
    if (!monthData) return 0;
    let streak = 0;
    for (let d = upToDay; d >= 1; d--) {
        if (getEffectiveCount(monthData[String(d)]) > 0) streak++;
        else break;
    }
    return streak;
}

export function calcMonthStats(monthData, upToDay) {
    if (!monthData) {
        return { total: 0, maxDay: 0, maxCount: 0, activeDays: 0, streak: 0, deathDays: 0 };
    }
    let total = 0;
    let maxDay = 0;
    let maxCount = 0;
    let activeDays = 0;
    let deathDays = 0;

    for (const [k, v] of Object.entries(monthData)) {
        if (!isDayKey(k)) continue;
        const day = parseInt(k, 10);
        if (day > upToDay) continue;
        if (isDayDead(v)) { deathDays++; continue; }
        const count = getEffectiveCount(v);
        if (count <= 0) continue;
        total += count;
        activeDays++;
        if (count > maxCount) {
            maxCount = count;
            maxDay = day;
        }
    }

    return {
        total,
        maxDay,
        maxCount,
        activeDays,
        streak: calcStreak(monthData, upToDay),
        deathDays,
    };
}

export function calcYearStats(userRecord, year, now = new Date()) {
    const months = getYearMonths(userRecord, year);
    let total = 0;
    let activeDays = 0;
    let maxMonth = 0;
    let maxMonthCount = 0;
    let deathDays = 0;

    for (const [monthKey, monthData] of Object.entries(months)) {
        const monthTotal = sumMonthData(monthData);
        total += monthTotal;
        activeDays += Object.keys(monthData).filter(k => isDayKey(k) && getEffectiveCount(monthData[k]) > 0).length;
        deathDays += Object.keys(monthData).filter(k => isDayKey(k) && isDayDead(monthData[k])).length;
        if (monthTotal > maxMonthCount) {
            maxMonthCount = monthTotal;
            maxMonth = parseInt(monthKey.split('-')[1], 10);
        }
    }

    return { total, activeDays, maxMonth, maxMonthCount, deathDays };
}

/** 今日状态摘要 */
export function getTodayStatus(monthData, day) {
    const entry = getDayEntry(monthData, day) || createDayEntry(0);
    const dead = !!entry.d;
    const safeLeft = Math.max(0, DAILY_SAFE_LIMIT - entry.c);
    const inRiskZone = entry.c >= DAILY_SAFE_LIMIT && !dead;
    const nextDeathChance = dead ? 0 : calcOverlimitDeathChance(entry.c);
    return {
        entry,
        count: dead ? 0 : entry.c,
        lostCount: dead ? (entry.snap ?? 0) : 0,
        attempts: entry.a,
        dead,
        safeLeft: dead ? 0 : safeLeft,
        inRiskZone,
        nextDeathChance,
        riskPercent: formatChancePercent(nextDeathChance),
        deathChanceStep: Math.round(OVERLIMIT_DEATH_CHANCE_STEP * 100),
        helpKillPercent: Math.round(HELP_KILL_CHANCE * 100),
        canLu: !dead,
        canHelp: !dead,
        deathReason: dead ? (entry.dr || DEATH_REASON.SELF) : '',
        deathReasonText: dead ? getDeathReasonText(entry.dr || DEATH_REASON.SELF) : '',
        killerId: dead ? (entry.dk || '') : '',
        helperHelpUsed: getHelperQuota(monthData, day).used,
        helperHelpLeft: getHelperQuotaLeft(monthData, day),
    };
}

function rollChance(rate) {
    return Math.random() < rate;
}

/** 施加鹿死状态 */
export function applyDeath(entry, { reason = DEATH_REASON.SELF, killerId = null } = {}) {
    entry.snap = entry.c;
    entry.c = 0;
    entry.d = 1;
    entry.dc += 1;
    entry.dr = reason;
    entry.dk = killerId ? String(killerId) : '';
    return entry.snap;
}

function rollHelpKill() {
    return rollChance(HELP_KILL_CHANCE);
}

/**
 * 自己🦌
 * @returns {{ ok: boolean, type?: string, message?: string, entry?: object }}
 */
export function performLu(deerData, userId, date, day) {
    const monthData = ensureMonthData(deerData, userId, date);
    const entry = ensureDayEntry(monthData, day);

    if (entry.d) {
        return { ok: false, type: 'dead', entry, snap: entry.snap, lostCount: entry.snap };
    }

    entry.a += 1;

    if (entry.c < DAILY_SAFE_LIMIT) {
        entry.c += 1;
        return { ok: true, type: 'safe', entry, count: entry.c, safeLeft: DAILY_SAFE_LIMIT - entry.c };
    }

    const deathChance = calcOverlimitDeathChance(entry.c);
    if (rollChance(deathChance)) {
        const snap = applyDeath(entry, { reason: DEATH_REASON.SELF });
        return { ok: true, type: 'death', entry, snap, deathChance };
    }

    entry.c += 1;
    return {
        ok: true,
        type: 'risky',
        entry,
        count: entry.c,
        deathChance,
        nextDeathChance: calcOverlimitDeathChance(entry.c),
    };
}

/**
 * 帮🦌 / 救活 / 拉下马
 * 帮🦌者每日共 DAILY_HELP_QUOTA 次，可全部用于同一人
 */
export function performHelpLu(deerData, helperId, targetId, date, day) {
    const helperMonth = ensureMonthData(deerData, helperId, date);
    const helperEntry = getDayEntry(helperMonth, day);
    if (helperEntry?.d) {
        return { ok: false, type: 'helper_dead' };
    }

    const quotaLeft = getHelperQuotaLeft(helperMonth, day);
    if (quotaLeft <= 0) {
        return {
            ok: false,
            type: 'help_quota',
            helpQuotaUsed: DAILY_HELP_QUOTA,
            helpQuotaLeft: 0,
        };
    }

    const monthData = ensureMonthData(deerData, targetId, date);
    const entry = ensureDayEntry(monthData, day);
    const helpKey = String(helperId);
    let result;

    if (entry.d) {
        entry.d = 0;
        entry.c = entry.snap || 0;
        entry.snap = 0;
        entry.dr = '';
        entry.dk = '';
        entry.revived += 1;
        if (!entry.helpBy) entry.helpBy = {};
        entry.helpBy[helpKey] = (entry.helpBy[helpKey] || 0) + 1;
        result = { ok: true, type: 'revive', entry, count: entry.c };
    } else {
        if (!entry.helpBy) entry.helpBy = {};
        entry.helpBy[helpKey] = (entry.helpBy[helpKey] || 0) + 1;
        entry.a += 1;

        if (entry.c > 0 && rollHelpKill()) {
            const reason = entry.c >= DAILY_SAFE_LIMIT ? DEATH_REASON.PULL : DEATH_REASON.HELP;
            const snap = applyDeath(entry, { reason, killerId: helperId });
            result = {
                ok: true,
                type: reason === DEATH_REASON.PULL ? 'help_pull' : 'help_kill',
                entry,
                snap,
                helpKillChance: HELP_KILL_CHANCE,
            };
        } else if (entry.c >= DAILY_SAFE_LIMIT) {
            result = {
                ok: true,
                type: 'help_miss',
                entry,
                count: entry.c,
                helpKillChance: HELP_KILL_CHANCE,
            };
        } else {
            entry.c += 1;
            entry.helped += 1;
            result = { ok: true, type: 'help', entry, count: entry.c };
        }
    }

    const quota = consumeHelperQuota(helperMonth, day, targetId);
    return attachQuota(result, quota);
}

/** 戒🦌 */
export function performWithdrawal(deerData, userId, date, day, { pastDay = false } = {}) {
    const monthData = ensureMonthData(deerData, userId, date);
    const entry = ensureDayEntry(monthData, day);

    if (entry.d) {
        return { ok: false, type: 'withdrawal_dead' };
    }

    if (entry.c <= 0) {
        return { ok: false, type: 'empty' };
    }

    entry.c -= 1;
    if (!pastDay) entry.a += 1;
    return { ok: true, type: 'withdrawal', entry, count: entry.c };
}

export {
    DAILY_SAFE_LIMIT,
    DAILY_HELP_QUOTA,
    OVERLIMIT_DEATH_CHANCE_BASE,
    OVERLIMIT_DEATH_CHANCE_STEP,
    HELP_KILL_CHANCE,
    DEATH_REASON,
    calcOverlimitDeathChance,
};
