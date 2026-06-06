/** 签到数据读写、游戏逻辑与格式迁移 */

import {
    DAILY_HELP_QUOTA,
    DAILY_HELP_WITHDRAW_QUOTA,
    DAILY_SAFE_LIMIT,
    DEATH_REASON,
    HELP_KILL_CHANCE,
    HELP_WITHDRAW_FAIL_CHANCE,
    IMPERIAL_LOSE_DEDUCT,
    IMPERIAL_WIN_DEDUCT,
    IMPERIAL_KING_WIN_BONUS,
    META_PREFIX,
    OVERLIMIT_DEATH_CHANCE_BASE,
    OVERLIMIT_DEATH_CHANCE_STEP,
    TOGETHER_FALL_COST,
    calcOverlimitDeathChance,
    formatChancePercent,
    isPrivileged,
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

/** 当日是否有记录（含鹿死、负数、尝试） */
export function hasDayRecord(raw) {
    const entry = normalizeDayEntry(raw);
    if (!entry) return false;
    if (entry.d) return true;
    return entry.a > 0 || entry.c !== 0;
}

/** 指定日是否鹿死（用于排行榜排除） */
export function isDeadOnDay(deerData, userId, date, day) {
    const entry = getDayEntry(getMonthData(getUserRecord(deerData, userId), date), day);
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
    return `${META_PREFIX.HELP}${day}`;
}

function helperWithdrawQuotaKey(day) {
    return `${META_PREFIX.HELP_WITHDRAW}${day}`;
}

function togetherUsedKey(day) {
    return `${META_PREFIX.TOGETHER}${day}`;
}

function imperialUsedKey(day) {
    return `${META_PREFIX.IMPERIAL}${day}`;
}

function isMetaKey(k) {
    return k.startsWith('_');
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

export function getHelperWithdrawQuota(monthData, day) {
    if (!monthData) return { used: 0, to: {} };
    const key = helperWithdrawQuotaKey(day);
    if (!monthData[key]) monthData[key] = { used: 0, to: {} };
    return monthData[key];
}

export function getHelperWithdrawQuotaLeft(monthData, day) {
    return Math.max(0, DAILY_HELP_WITHDRAW_QUOTA - getHelperWithdrawQuota(monthData, day).used);
}

function consumeHelperWithdrawQuota(helperMonthData, day, targetId) {
    const q = getHelperWithdrawQuota(helperMonthData, day);
    q.used += 1;
    const t = String(targetId);
    q.to[t] = (q.to[t] || 0) + 1;
    return {
        helpWithdrawUsed: q.used,
        helpWithdrawLeft: Math.max(0, DAILY_HELP_WITHDRAW_QUOTA - q.used),
    };
}

export function resetDailyHelperQuotas(monthData, day) {
    if (!monthData) return;
    delete monthData[helperQuotaKey(day)];
    delete monthData[helperWithdrawQuotaKey(day)];
}

/** 清空指定日期的签到记录与当日玩法元数据（配额/同归/皇城鹿等） */
export function resetUserDayState(monthData, day) {
    if (!monthData) return;
    delete monthData[String(day)];
    delete monthData[helperQuotaKey(day)];
    delete monthData[helperWithdrawQuotaKey(day)];
    delete monthData[togetherUsedKey(day)];
    delete monthData[imperialUsedKey(day)];
}

export function clearImperialUsedForAll(deerData, date, day) {
    const monthKey = getMonthKey(date);
    const key = imperialUsedKey(day);
    let cleared = 0;
    for (const userRecord of Object.values(deerData || {})) {
        if (!userRecord || typeof userRecord !== 'object') continue;
        const monthData = userRecord[monthKey];
        if (!monthData?.[key]) continue;
        delete monthData[key];
        cleared += 1;
    }
    return cleared;
}

export function hasUsedTogether(monthData, day) {
    return !!monthData?.[togetherUsedKey(day)];
}

export function hasUsedImperial(monthData, day) {
    return !!monthData?.[imperialUsedKey(day)];
}

/** 原始次数（含负数；鹿死返回 null） */
export function getRawDayCount(raw) {
    const entry = normalizeDayEntry(raw);
    if (!entry || entry.d) return null;
    return entry.c;
}

export function adjustDayCount(entry, delta) {
    entry.c = (entry.c ?? 0) + delta;
    return entry.c;
}

export function sumMonthDataForRank(monthData, { withdrawal = false, upToDay = 31 } = {}) {
    if (!monthData) return { sum: 0, hasActivity: false };
    let sum = 0;
    let hasActivity = false;
    for (const [k, v] of Object.entries(monthData)) {
        if (!isDayKey(k)) continue;
        const day = parseInt(k, 10);
        if (day > upToDay) continue;
        if (isDayDead(v)) continue;
        const c = getRawDayCount(v);
        if (c === null) continue;
        hasActivity = true;
        if (!withdrawal && c <= 0) continue;
        sum += c;
    }
    return { sum, hasActivity };
}

export function sumYearDataForRank(userRecord, year, date = new Date(), { withdrawal = false } = {}) {
    if (!userRecord) return { sum: 0, hasActivity: false };
    const upToMonth = date.getMonth() + 1;
    let sum = 0;
    let hasActivity = false;
    for (const [monthKey, monthData] of Object.entries(getYearMonths(userRecord, year))) {
        const m = parseInt(monthKey.split('-')[1], 10);
        const capDay = m === upToMonth ? date.getDate() : 31;
        const ranked = sumMonthDataForRank(monthData, { withdrawal, upToDay: capDay });
        sum += ranked.sum;
        hasActivity = hasActivity || ranked.hasActivity;
    }
    return { sum, hasActivity };
}

export function isUserDeadToday(deerData, userId, date, day) {
    const entry = getDayEntry(getMonthData(getUserRecord(deerData, userId), date), day);
    return !!entry?.d;
}

/** 发起互助/特殊玩法前：操作者须存活 */
export function rejectIfActorDead(deerData, userId, date, day) {
    if (isUserDeadToday(deerData, userId, date, day)) {
        return { ok: false, type: 'actor_dead' };
    }
    return null;
}

/** 皇城鹿宣战校验（不含标记消耗） */
export function validateImperialStart(deerData, userId, date, day, members) {
    const dead = rejectIfActorDead(deerData, userId, date, day);
    if (dead) return dead;

    const userMonth = getMonthData(getUserRecord(deerData, userId), date);
    if (hasUsedImperial(userMonth, day)) {
        return { ok: false, type: 'imperial_used' };
    }

    const rank = getDayRankInGroup(deerData, members, date);
    if (!rank.length) {
        return { ok: false, type: 'imperial_no_king' };
    }

    const king = rank[0];
    if (String(king.id) === String(userId)) {
        return { ok: false, type: 'imperial_is_king' };
    }

    return { ok: true, king };
}

export function getDayRankInGroup(deerData, members, date = new Date()) {
    const day = date.getDate();
    const list = members.map(id => {
        const uid = String(id);
        const entry = getDayEntry(getMonthData(getUserRecord(deerData, uid), date), day);
        if (!entry || entry.d) return null;
        const c = entry.c;
        if (c <= 0) return null;
        return { id: uid, sum: c };
    }).filter(Boolean);
    list.sort((a, b) => b.sum - a.sum || a.id.localeCompare(b.id));
    return list;
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
        else if (isMetaKey(k)) out[k] = v;
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
        .reduce((acc, k) => {
            const c = getRawDayCount(monthData[k]);
            return c === null ? acc : acc + c;
        }, 0);
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
    return Object.keys(month).some(k => isDayKey(k) && hasDayRecord(month[k]));
}

export function hasYearData(userRecord, year) {
    if (!userRecord) return false;
    const prefix = `${year}-`;
    for (const [k, monthData] of Object.entries(userRecord)) {
        if (!k.startsWith(prefix) || !monthData) continue;
        if (Object.keys(monthData).some(dk => isDayKey(dk) && hasDayRecord(monthData[dk]))) {
            return true;
        }
    }
    return false;
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
        const c = getRawDayCount(v);
        if (c === null) continue;
        total += c;
        if (c !== 0) activeDays++;
        if (c > maxCount) {
            maxCount = c;
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
        activeDays += Object.keys(monthData).filter(k => {
            if (!isDayKey(k)) return false;
            if (isDayDead(monthData[k])) return true;
            const c = getRawDayCount(monthData[k]);
            return c !== null && c !== 0;
        }).length;
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
        helpWithdrawFailPercent: Math.round(HELP_WITHDRAW_FAIL_CHANCE * 100),
        canLu: !dead,
        canHelp: !dead,
        deathReason: dead ? (entry.dr || DEATH_REASON.SELF) : '',
        deathReasonText: dead ? getDeathReasonText(entry.dr || DEATH_REASON.SELF) : '',
        killerId: dead ? (entry.dk || '') : '',
        helperHelpUsed: getHelperQuota(monthData, day).used,
        helperHelpLeft: getHelperQuotaLeft(monthData, day),
        helperWithdrawUsed: getHelperWithdrawQuota(monthData, day).used,
        helperWithdrawLeft: getHelperWithdrawQuotaLeft(monthData, day),
        togetherUsed: hasUsedTogether(monthData, day),
        imperialUsed: hasUsedImperial(monthData, day),
        canUseSpecial: !dead,
        canHelpOthers: !dead,
        canTogether: !dead && !hasUsedTogether(monthData, day),
        canImperial: !dead && !hasUsedImperial(monthData, day),
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

function rollHelpWithdrawFail() {
    return rollChance(HELP_WITHDRAW_FAIL_CHANCE);
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
    const dead = rejectIfActorDead(deerData, helperId, date, day);
    if (dead) return dead;

    const helperMonth = ensureMonthData(deerData, helperId, date);

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

/** 戒🦌（次数可为负，0 也可继续戒） */
export function performWithdrawal(deerData, userId, date, day, { pastDay = false } = {}) {
    const monthData = ensureMonthData(deerData, userId, date);
    const entry = ensureDayEntry(monthData, day);

    if (entry.d) {
        return { ok: false, type: 'withdrawal_dead' };
    }

    entry.c -= 1;
    if (!pastDay) entry.a += 1;
    return { ok: true, type: 'withdrawal', entry, count: entry.c };
}

/** 同归鹿尽：双方各 -5，发起者每日一次，次数可负；鹿死者不可发起或成为目标 */
export function performTogetherFall(deerData, userId, targetId, date, day) {
    if (String(userId) === String(targetId)) {
        return { ok: false, type: 'together_self' };
    }

    const actorDead = rejectIfActorDead(deerData, userId, date, day);
    if (actorDead) return actorDead;

    const initiatorMonth = ensureMonthData(deerData, userId, date);
    if (hasUsedTogether(initiatorMonth, day)) {
        return { ok: false, type: 'together_used' };
    }

    const selfEntry = ensureDayEntry(initiatorMonth, day);
    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);

    if (targetEntry.d) {
        return { ok: false, type: 'target_dead' };
    }

    adjustDayCount(selfEntry, -TOGETHER_FALL_COST);
    adjustDayCount(targetEntry, -TOGETHER_FALL_COST);
    selfEntry.a += 1;
    targetEntry.a += 1;
    initiatorMonth[togetherUsedKey(day)] = 1;

    return {
        ok: true,
        type: 'together_fall',
        selfCount: selfEntry.c,
        targetCount: targetEntry.c,
        cost: TOGETHER_FALL_COST,
    };
}

/** 帮戒🦌：帮🦌友 -1，每日 3 次，可负 */
export function performHelpWithdrawal(deerData, helperId, targetId, date, day) {
    const dead = rejectIfActorDead(deerData, helperId, date, day);
    if (dead) return dead;

    const helperMonth = ensureMonthData(deerData, helperId, date);

    const quotaLeft = getHelperWithdrawQuotaLeft(helperMonth, day);
    if (quotaLeft <= 0) {
        return {
            ok: false,
            type: 'help_withdraw_quota',
            helpWithdrawUsed: DAILY_HELP_WITHDRAW_QUOTA,
            helpWithdrawLeft: 0,
        };
    }

    const targetMonth = ensureMonthData(deerData, targetId, date);
    const entry = ensureDayEntry(targetMonth, day);
    if (entry.d) {
        return { ok: false, type: 'target_dead' };
    }

    entry.a += 1;

    if (rollHelpWithdrawFail()) {
        const quota = consumeHelperWithdrawQuota(helperMonth, day, targetId);
        return {
            ok: true,
            type: 'help_withdraw_fail',
            entry,
            count: entry.c,
            failChance: HELP_WITHDRAW_FAIL_CHANCE,
            ...quota,
        };
    }

    adjustDayCount(entry, -1);
    const quota = consumeHelperWithdrawQuota(helperMonth, day, targetId);
    return {
        ok: true,
        type: 'help_withdraw',
        entry,
        count: entry.c,
        ...quota,
    };
}

/** 特权：回鹿返照（清空今日全部次数与玩法状态） */
export function performPrivilegeRevive(deerData, userId, date, day) {
    if (!isPrivileged(userId)) {
        return { ok: false, type: 'privilege_only' };
    }
    const monthData = ensureMonthData(deerData, userId, date);
    const entry = getDayEntry(monthData, day);
    const wasDead = !!entry?.d;

    resetUserDayState(monthData, day);

    return {
        ok: true,
        type: 'privilege_revive',
        count: 0,
        wasDead,
    };
}

/** 特权：皇城清算（全员当日皇城鹿已用标记重置） */
export function performImperialClearance(deerData, operatorId, date, day) {
    if (!isPrivileged(operatorId)) {
        return { ok: false, type: 'privilege_only' };
    }
    const cleared = clearImperialUsedForAll(deerData, date, day);
    return {
        ok: true,
        type: 'imperial_clearance',
        cleared,
        day,
    };
}

/** 标记今日已使用皇城鹿 */
export function markImperialUsed(deerData, userId, date, day) {
    const monthData = ensureMonthData(deerData, userId, date);
    if (hasUsedImperial(monthData, day)) return false;
    monthData[imperialUsedKey(day)] = 1;
    return true;
}

/** 皇城鹿 PK 结算（不含标记，标记在宣战时完成） */
export function settleImperialPk(deerData, challengerId, kingId, date, day, { win }) {
    const dead = rejectIfActorDead(deerData, challengerId, date, day);
    if (dead) return dead;

    const kingEntry = ensureDayEntry(ensureMonthData(deerData, kingId, date), day);
    const challengerEntry = ensureDayEntry(ensureMonthData(deerData, challengerId, date), day);

    if (win) {
        if (!kingEntry.d) {
            adjustDayCount(kingEntry, -IMPERIAL_WIN_DEDUCT);
            kingEntry.a += 1;
        }
        challengerEntry.a += 1;
        return {
            ok: true,
            type: 'imperial_win',
            kingCount: kingEntry.d ? 0 : kingEntry.c,
            challengerCount: challengerEntry.d ? 0 : challengerEntry.c,
            deduct: IMPERIAL_WIN_DEDUCT,
            kingId,
        };
    }

    if (!challengerEntry.d) {
        adjustDayCount(challengerEntry, -IMPERIAL_LOSE_DEDUCT);
        challengerEntry.a += 1;
    }
    if (!kingEntry.d) {
        adjustDayCount(kingEntry, IMPERIAL_KING_WIN_BONUS);
        kingEntry.a += 1;
    }
    return {
        ok: true,
        type: 'imperial_lose',
        kingCount: kingEntry.d ? 0 : kingEntry.c,
        challengerCount: challengerEntry.d ? 0 : challengerEntry.c,
        deduct: IMPERIAL_LOSE_DEDUCT,
        kingBonus: kingEntry.d ? 0 : IMPERIAL_KING_WIN_BONUS,
        kingId,
    };
}

export {
    DAILY_SAFE_LIMIT,
    DAILY_HELP_QUOTA,
    DAILY_HELP_WITHDRAW_QUOTA,
    OVERLIMIT_DEATH_CHANCE_BASE,
    OVERLIMIT_DEATH_CHANCE_STEP,
    HELP_KILL_CHANCE,
    DEATH_REASON,
    calcOverlimitDeathChance,
    TOGETHER_FALL_COST,
    IMPERIAL_WIN_DEDUCT,
    IMPERIAL_LOSE_DEDUCT,
    IMPERIAL_KING_WIN_BONUS,
};
