/** 签到数据读写、游戏逻辑与格式迁移 */

import {
    ARENA_STAKE,
    CURSE_ASCENDED_STACKS,
    CURSE_DEATH_BONUS,
    CURSE_MAX_ROUNDS,
    CURSE_MAX_STACKS,
    DAILY_ARENA_QUOTA,
    DAILY_BORROW_QUOTA,
    BORROW_MIN_TARGET_COUNT,
    DAILY_BUMPER_QUOTA,
    BUMPER_WIN_CHANCE,
    BUMPER_DRAW_CHANCE,
    BUMPER_FAIL_PENALTY,
    BUMPER_CURSE_ON_WIN_CHANCE,
    DAILY_LOTTERY_QUOTA,
    DAILY_CLEANSE_CURSE_QUOTA,
    DAILY_CURSE_QUOTA,
    DAILY_FAKE_WITHDRAW_QUOTA,
    DAILY_GREED_QUOTA,
    DAILY_GROUP_SPLASH_QUOTA,
    DAILY_HELP_QUOTA,
    DAILY_HELP_WITHDRAW_QUOTA,
    DAILY_HOWL_QUOTA,
    DAILY_IMPERIAL_QUOTA,
    DAILY_SACRIFICE_QUOTA,
    DAILY_SAFE_LIMIT,
    DAILY_STEAL_QUOTA,
    DAILY_URGE_QUOTA,
    GREED_FAIL_PENALTY,
    GREED_SUCCESS_CHANCE,
    GROUP_SPLASH_CURSE_BURST_DAMAGE,
    GROUP_SPLASH_CURSE_CHANCE,
    GROUP_SPLASH_DAMAGE,
    GROUP_SPLASH_RECOIL,
    GROUP_SPLASH_TOP_N,
    HOWL_BONUS_CHANCE,
    HOWL_TRAP_CHANCE,
    SACRIFICE_TRANSFER,
    STEAL_BACKFIRE_CHANCE,
    STEAL_CURSE_BACKFIRE_CHANCE,
    STEAL_CURSE_BONUS_PER_STACK,
    STEAL_SUCCESS_CHANCE,
    DEATH_REASON,
    HELP_FAIL_CHANCE,
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

/** 单日: c=有效次数 a=尝试 d=鹿死 snap=快照 dc=鹿死次数 dr=死因 dk=凶手 helped revived helpBy cur=咒层 curR=咒剩余回合 */
export function createDayEntry(count = 0) {
    return { c: count, a: count, d: 0, snap: 0, dc: 0, dr: '', dk: '', helped: 0, revived: 0, helpBy: {}, cur: 0, curR: 0 };
}

export function normalizeDayEntry(raw) {
    if (raw == null) return null;
    if (typeof raw === 'number') {
        const n = Math.max(0, raw);
        return { c: n, a: n, d: 0, snap: 0, dc: 0, dr: '', dk: '', helped: 0, revived: 0, helpBy: {}, cur: 0, curR: 0 };
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
            cur: raw.cur ?? 0,
            curR: raw.curR ?? (raw.cur ? CURSE_MAX_ROUNDS : 0),
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

function arenaUsedKey(day) {
    return `${META_PREFIX.ARENA}${day}`;
}

function stealUsedKey(day) {
    return `${META_PREFIX.STEAL}${day}`;
}

function curseUsedKey(day) {
    return `${META_PREFIX.CURSE}${day}`;
}

function cleanseUsedKey(day) {
    return `${META_PREFIX.CLEANSE}${day}`;
}

function sacrificeUsedKey(day) {
    return `${META_PREFIX.SACRIFICE}${day}`;
}

function fakeWithdrawUsedKey(day) {
    return `${META_PREFIX.FAKE_WD}${day}`;
}

function urgeUsedKey(day) {
    return `${META_PREFIX.URGE}${day}`;
}

function howlUsedKey(day) {
    return `${META_PREFIX.HOWL}${day}`;
}

function greedUsedKey(day) {
    return `${META_PREFIX.GREED}${day}`;
}

function urgeBuffKey(day) {
    return `${META_PREFIX.URGE_BUFF}${day}`;
}

function groupSplashUsedKey(day) {
    return `${META_PREFIX.GROUP_SPLASH}${day}`;
}

function borrowUsedKey(day) {
    return `${META_PREFIX.BORROW}${day}`;
}

function bumperUsedKey(day) {
    return `${META_PREFIX.BUMPER}${day}`;
}

function lotteryUsedKey(day) {
    return `${META_PREFIX.LOTTERY}${day}`;
}

function stripOneCurseStack(entry) {
    if (!getActiveCurseStacks(entry)) return 0;
    entry.cur = Math.max(0, entry.cur - 1);
    if (entry.cur <= 0) clearCurse(entry);
    else entry.curR = CURSE_MAX_ROUNDS;
    return 1;
}

function readDailyUsed(monthData, day, key) {
    const v = monthData?.[key(day)];
    if (!v) return 0;
    return typeof v === 'number' ? v : 1;
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

/** 清空指定日期的玩法元数据（保留当日🦌绩 entry） */
export function resetUserDayMeta(monthData, day) {
    if (!monthData) return;
    delete monthData[helperQuotaKey(day)];
    delete monthData[helperWithdrawQuotaKey(day)];
    delete monthData[togetherUsedKey(day)];
    delete monthData[imperialUsedKey(day)];
    delete monthData[arenaUsedKey(day)];
    delete monthData[stealUsedKey(day)];
    delete monthData[curseUsedKey(day)];
    delete monthData[sacrificeUsedKey(day)];
    delete monthData[fakeWithdrawUsedKey(day)];
    delete monthData[urgeUsedKey(day)];
    delete monthData[howlUsedKey(day)];
    delete monthData[greedUsedKey(day)];
    delete monthData[urgeBuffKey(day)];
    delete monthData[groupSplashUsedKey(day)];
    delete monthData[cleanseUsedKey(day)];
    delete monthData[borrowUsedKey(day)];
    delete monthData[bumperUsedKey(day)];
    delete monthData[lotteryUsedKey(day)];
}

const PLAYFUL_META_KEYS = [
    togetherUsedKey,
    arenaUsedKey,
    stealUsedKey,
    curseUsedKey,
    sacrificeUsedKey,
    fakeWithdrawUsedKey,
    urgeUsedKey,
    howlUsedKey,
    greedUsedKey,
    urgeBuffKey,
    groupSplashUsedKey,
    cleanseUsedKey,
    borrowUsedKey,
    bumperUsedKey,
    lotteryUsedKey,
];

function rejectUnlessPrivileged(operatorId) {
    if (!isPrivileged(operatorId)) return { ok: false, type: 'privilege_only' };
    return null;
}

/** 批量删除指定玩法元数据键，返回有改动的用户数 */
function clearMetaKeysForAll(deerData, date, day, ...keyFns) {
    const monthKey = getMonthKey(date);
    const keys = keyFns.map((fn) => fn(day));
    let cleared = 0;
    for (const userRecord of Object.values(deerData || {})) {
        if (!userRecord || typeof userRecord !== 'object') continue;
        const monthData = userRecord[monthKey];
        if (!monthData) continue;
        let touched = false;
        for (const k of keys) {
            if (monthData[k] != null) {
                delete monthData[k];
                touched = true;
            }
        }
        if (touched) cleared += 1;
    }
    return cleared;
}

/** 解除单日 entry 鹿死（写回 ensureDayEntry 后的对象） */
function reviveDayEntry(entry) {
    if (!entry?.d) return false;
    entry.d = 0;
    entry.c = entry.snap || 0;
    entry.snap = 0;
    entry.dr = '';
    entry.dk = '';
    entry.cur = 0;
    entry.curR = 0;
    return true;
}

/** 全员当日鹿死还阳 */
function reviveAllDeadForDay(deerData, date, day) {
    const monthKey = getMonthKey(date);
    const dayKey = String(day);
    let revived = 0;
    for (const userRecord of Object.values(deerData || {})) {
        if (!userRecord || typeof userRecord !== 'object') continue;
        const monthData = userRecord[monthKey];
        if (!monthData?.[dayKey]) continue;
        if (reviveDayEntry(ensureDayEntry(monthData, day))) revived += 1;
    }
    return revived;
}

/** 全员当日玩法元数据重置（保留🦌绩 entry） */
function resetAllUsersDayMeta(deerData, date, day) {
    const monthKey = getMonthKey(date);
    let count = 0;
    for (const userRecord of Object.values(deerData || {})) {
        if (!userRecord || typeof userRecord !== 'object') continue;
        const monthData = userRecord[monthKey];
        if (!monthData) continue;
        resetUserDayMeta(monthData, day);
        count += 1;
    }
    return count;
}

/** 清空指定日期的签到记录与当日玩法元数据 */
export function resetUserDayState(monthData, day) {
    if (!monthData) return;
    delete monthData[String(day)];
    resetUserDayMeta(monthData, day);
}

export function clearImperialUsedForAll(deerData, date, day) {
    return clearMetaKeysForAll(deerData, date, day, imperialUsedKey);
}

/** 全员当日帮🦌/帮戒🦌配额重置 */
export function clearHelperQuotasForAll(deerData, date, day) {
    return clearMetaKeysForAll(deerData, date, day, helperQuotaKey, helperWithdrawQuotaKey);
}

/** 全员当日恶趣味/擂台/同归玩法次数重置 */
export function clearPlayfulMetaForAll(deerData, date, day) {
    return clearMetaKeysForAll(deerData, date, day, ...PLAYFUL_META_KEYS);
}

export function hasUsedTogether(monthData, day) {
    return !!monthData?.[togetherUsedKey(day)];
}

export function getImperialUsedCount(monthData, day) {
    return readDailyUsed(monthData, day, imperialUsedKey);
}

export function getImperialQuotaLeft(monthData, day) {
    return Math.max(0, DAILY_IMPERIAL_QUOTA - getImperialUsedCount(monthData, day));
}

export function hasUsedImperial(monthData, day) {
    return getImperialUsedCount(monthData, day) >= DAILY_IMPERIAL_QUOTA;
}

export function getArenaUsedCount(monthData, day) {
    return readDailyUsed(monthData, day, arenaUsedKey);
}

export function getArenaQuotaLeft(monthData, day) {
    return Math.max(0, DAILY_ARENA_QUOTA - getArenaUsedCount(monthData, day));
}

export function hasUsedArena(monthData, day) {
    return getArenaUsedCount(monthData, day) >= DAILY_ARENA_QUOTA;
}

function consumeDailyQuota(monthData, day, keyFn, limit) {
    const key = keyFn(day);
    const used = readDailyUsed(monthData, day, keyFn);
    if (used >= limit) return null;
    monthData[key] = used + 1;
    return { used: used + 1, left: Math.max(0, limit - used - 1) };
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
        return {
            ok: false,
            type: 'imperial_used',
            imperialUsed: getImperialUsedCount(userMonth, day),
            imperialLeft: 0,
        };
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

/** 群鹿溅目标：日榜 Top N（排除施术者） */
export function pickSplashTargetsFromDayRank(deerData, members, casterId, date, topN = GROUP_SPLASH_TOP_N) {
    return getDayRankInGroup(deerData, members, date)
        .filter((r) => String(r.id) !== String(casterId))
        .slice(0, topN)
        .map((r) => r.id);
}

/** 当前生效中的鹿咒层数（需层数与回合均 >0） */
export function getActiveCurseStacks(entry) {
    if (!entry?.cur || !entry?.curR) return 0;
    return entry.cur;
}

export function getCurseRoundsLeft(entry) {
    if (!entry?.cur || !entry?.curR) return 0;
    return entry.curR;
}

export function getCurseInfo(entry) {
    const stacks = getActiveCurseStacks(entry);
    const rounds = getCurseRoundsLeft(entry);
    const active = stacks > 0 && rounds > 0;
    return {
        stacks,
        rounds,
        active,
        deathBonus: active ? CURSE_DEATH_BONUS * stacks : 0,
        ascended: active && stacks >= CURSE_ASCENDED_STACKS,
    };
}

/** 叠加鹿咒层数并刷新为 CURSE_MAX_ROUNDS 回合 */
export function applyCurseStacks(entry, layers = 1) {
    entry.cur = Math.min(CURSE_MAX_STACKS, (entry.cur || 0) + layers);
    entry.curR = CURSE_MAX_ROUNDS;
    return entry.cur;
}

/** 清除目标全部咒印 */
export function clearCurse(entry) {
    entry.cur = 0;
    entry.curR = 0;
}

/** 自🦌一次消耗一回合咒效 */
export function consumeCurseRound(entry) {
    if (!entry?.cur || !entry?.curR) return { active: false, stacks: 0, rounds: 0 };
    entry.curR -= 1;
    if (entry.curR <= 0) {
        entry.cur = 0;
        entry.curR = 0;
    }
    return getCurseInfo(entry);
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
        helpKillPercent: Math.round(HELP_FAIL_CHANCE * 100),
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
        imperialUsed: getImperialUsedCount(monthData, day),
        imperialLeft: getImperialQuotaLeft(monthData, day),
        arenaUsed: getArenaUsedCount(monthData, day),
        arenaLeft: getArenaQuotaLeft(monthData, day),
        stealUsed: readDailyUsed(monthData, day, stealUsedKey),
        curseUsed: readDailyUsed(monthData, day, curseUsedKey),
        sacrificeUsed: readDailyUsed(monthData, day, sacrificeUsedKey),
        fakeWithdrawUsed: readDailyUsed(monthData, day, fakeWithdrawUsedKey),
        urgeUsed: readDailyUsed(monthData, day, urgeUsedKey),
        howlUsed: readDailyUsed(monthData, day, howlUsedKey),
        greedUsed: readDailyUsed(monthData, day, greedUsedKey),
        groupSplashUsed: readDailyUsed(monthData, day, groupSplashUsedKey),
        cleanseUsed: readDailyUsed(monthData, day, cleanseUsedKey),
        borrowUsed: readDailyUsed(monthData, day, borrowUsedKey),
        bumperUsed: readDailyUsed(monthData, day, bumperUsedKey),
        lotteryUsed: readDailyUsed(monthData, day, lotteryUsedKey),
        ...(() => {
            const ci = getCurseInfo(entry);
            return {
                cursed: ci.active,
                curseStacks: ci.stacks,
                curseRounds: ci.rounds,
                curseBonusPct: Math.round(ci.deathBonus * 100),
                curseAscended: ci.ascended,
            };
        })(),
        urgeBuff: !!monthData?.[urgeBuffKey(day)],
        canUseSpecial: !dead,
        canHelpOthers: !dead,
        canTogether: !dead && !hasUsedTogether(monthData, day),
        canImperial: !dead && getImperialQuotaLeft(monthData, day) > 0,
        canArena: !dead && getArenaQuotaLeft(monthData, day) > 0,
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

function rollHelpFail() {
    return rollChance(HELP_FAIL_CHANCE);
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
    const curseBefore = getCurseInfo(entry);
    const hadActiveCurse = curseBefore.active;
    const hadUrgeBuff = !!monthData[urgeBuffKey(day)];
    let urgeBonus = 0;

    if (entry.c < DAILY_SAFE_LIMIT) {
        entry.c += 1;
        if (hadUrgeBuff) {
            entry.c += 1;
            urgeBonus = 1;
            delete monthData[urgeBuffKey(day)];
        }
        if (hadActiveCurse) consumeCurseRound(entry);
        const curseAfter = getCurseInfo(entry);
        return {
            ok: true,
            type: urgeBonus ? 'safe_urged' : 'safe',
            entry,
            count: entry.c,
            safeLeft: DAILY_SAFE_LIMIT - entry.c,
            urgeBonus,
            hadCurse: hadActiveCurse,
            curseStacks: curseBefore.stacks,
            curseRoundsLeft: curseAfter.rounds,
            curseBonus: curseBefore.deathBonus,
        };
    }

    let deathChance = calcOverlimitDeathChance(entry.c);
    if (hadActiveCurse) {
        deathChance = Math.min(1, deathChance + curseBefore.deathBonus);
    }
    if (rollChance(deathChance)) {
        const snap = applyDeath(entry, { reason: DEATH_REASON.SELF });
        if (hadActiveCurse) consumeCurseRound(entry);
        return {
            ok: true,
            type: hadActiveCurse ? 'death_cursed' : 'death',
            entry,
            snap,
            deathChance,
            hadCurse: hadActiveCurse,
            curseStacks: curseBefore.stacks,
            curseBonus: curseBefore.deathBonus,
        };
    }

    entry.c += 1;
    if (hadActiveCurse) consumeCurseRound(entry);
    const curseAfter = getCurseInfo(entry);
    return {
        ok: true,
        type: hadActiveCurse ? 'risky_cursed' : 'risky',
        entry,
        count: entry.c,
        deathChance,
        nextDeathChance: calcOverlimitDeathChance(entry.c),
        hadCurse: hadActiveCurse,
        curseStacks: curseBefore.stacks,
        curseRoundsLeft: curseAfter.rounds,
        curseBonus: curseBefore.deathBonus,
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
        if (rollHelpFail()) {
            const quota = consumeHelperQuota(helperMonth, day, targetId);
            return attachQuota({
                ok: true,
                type: 'help_revive_fail',
                entry,
                failChance: HELP_FAIL_CHANCE,
            }, quota);
        }
        entry.d = 0;
        entry.c = entry.snap || 0;
        entry.snap = 0;
        entry.dr = '';
        entry.dk = '';
        clearCurse(entry);
        entry.revived += 1;
        if (!entry.helpBy) entry.helpBy = {};
        entry.helpBy[helpKey] = (entry.helpBy[helpKey] || 0) + 1;
        result = { ok: true, type: 'revive', entry, count: entry.c };
    } else {
        if (!entry.helpBy) entry.helpBy = {};
        entry.helpBy[helpKey] = (entry.helpBy[helpKey] || 0) + 1;
        entry.a += 1;

        if (entry.c > 0 && rollHelpFail()) {
            const reason = entry.c >= DAILY_SAFE_LIMIT ? DEATH_REASON.PULL : DEATH_REASON.HELP;
            const snap = applyDeath(entry, { reason, killerId: helperId });
            result = {
                ok: true,
                type: reason === DEATH_REASON.PULL ? 'help_pull' : 'help_kill',
                entry,
                snap,
                helpKillChance: HELP_FAIL_CHANCE,
            };
        } else if (entry.c >= DAILY_SAFE_LIMIT) {
            result = {
                ok: true,
                type: 'help_miss',
                entry,
                count: entry.c,
                helpKillChance: HELP_FAIL_CHANCE,
            };
        } else {
            entry.c += 1;
            entry.helped += 1;
            let curseSoothe = false;
            if (getCurseInfo(entry).active) {
                entry.curR = Math.max(0, (entry.curR || 0) - 1);
                if (entry.curR <= 0) clearCurse(entry);
                curseSoothe = true;
            }
            result = { ok: true, type: 'help', entry, count: entry.c, curseSoothe };
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

/** 特权：回鹿返照（保留🦌绩，解除鹿死并重置玩法元数据） */
export function performPrivilegeRevive(deerData, userId, date, day) {
    const deny = rejectUnlessPrivileged(userId);
    if (deny) return deny;

    const monthData = ensureMonthData(deerData, userId, date);
    const entry = ensureDayEntry(monthData, day);
    const wasDead = reviveDayEntry(entry);
    resetUserDayMeta(monthData, day);

    return {
        ok: true,
        type: 'privilege_revive',
        count: entry.c,
        wasDead,
    };
}

/** 特权：皇城清算（全员当日皇城鹿次数重置） */
export function performImperialClearance(deerData, operatorId, date, day) {
    const deny = rejectUnlessPrivileged(operatorId);
    if (deny) return deny;
    return {
        ok: true,
        type: 'imperial_clearance',
        cleared: clearImperialUsedForAll(deerData, date, day),
        day,
    };
}

/** 特权：鹿清算（全员当日帮🦌/帮戒🦌配额重置） */
export function performHelpQuotaClearance(deerData, operatorId, date, day) {
    const deny = rejectUnlessPrivileged(operatorId);
    if (deny) return deny;
    return {
        ok: true,
        type: 'help_quota_clearance',
        cleared: clearHelperQuotasForAll(deerData, date, day),
        day,
    };
}

/** 特权：恶趣清算（全员恶趣味/擂台/同归次数重置） */
export function performPlayfulClearance(deerData, operatorId, date, day) {
    const deny = rejectUnlessPrivileged(operatorId);
    if (deny) return deny;
    return {
        ok: true,
        type: 'playful_clearance',
        cleared: clearPlayfulMetaForAll(deerData, date, day),
        day,
    };
}

/** 特权：大赦众生（全员鹿死还阳 + 全员玩法次数重置） */
export function performAmnestyAll(deerData, operatorId, date, day) {
    const deny = rejectUnlessPrivileged(operatorId);
    if (deny) return deny;
    const revived = reviveAllDeadForDay(deerData, date, day);
    const metaReset = resetAllUsersDayMeta(deerData, date, day);
    return {
        ok: true,
        type: 'amnesty_all',
        revived,
        metaReset,
        day,
    };
}

/** 标记今日已使用一次皇城鹿 */
export function markImperialUsed(deerData, userId, date, day) {
    const monthData = ensureMonthData(deerData, userId, date);
    const quota = consumeDailyQuota(monthData, day, imperialUsedKey, DAILY_IMPERIAL_QUOTA);
    return quota != null;
}

/** 标记今日已使用一次擂台鹿 */
export function markArenaUsed(deerData, userId, date, day) {
    const monthData = ensureMonthData(deerData, userId, date);
    const quota = consumeDailyQuota(monthData, day, arenaUsedKey, DAILY_ARENA_QUOTA);
    return quota != null;
}

/** 擂台鹿开战校验（不含消耗配额） */
export function validateArenaStart(deerData, challengerId, targetId, date, day) {
    if (String(challengerId) === String(targetId)) {
        return { ok: false, type: 'arena_self' };
    }

    const actorDead = rejectIfActorDead(deerData, challengerId, date, day);
    if (actorDead) return actorDead;

    const targetDead = isUserDeadToday(deerData, targetId, date, day);
    if (targetDead) {
        return { ok: false, type: 'arena_target_dead' };
    }

    const challengerMonth = getMonthData(getUserRecord(deerData, challengerId), date);
    if (hasUsedArena(challengerMonth, day)) {
        return {
            ok: false,
            type: 'arena_used',
            arenaUsed: getArenaUsedCount(challengerMonth, day),
            arenaLeft: 0,
        };
    }

    const targetMonth = getMonthData(getUserRecord(deerData, targetId), date);
    if (hasUsedArena(targetMonth, day)) {
        return {
            ok: false,
            type: 'arena_used',
            arenaUsed: getArenaUsedCount(targetMonth, day),
            arenaLeft: 0,
            forTarget: true,
        };
    }

    return { ok: true };
}

/** 擂台鹿结算：50% 胜负，败者 -ARENA_STAKE、胜者 +ARENA_STAKE */
export function settleArenaPk(deerData, challengerId, targetId, date, day) {
    const check = validateArenaStart(deerData, challengerId, targetId, date, day);
    if (!check.ok) return check;

    if (!markArenaUsed(deerData, challengerId, date, day)) {
        return { ok: false, type: 'arena_used' };
    }
    if (!markArenaUsed(deerData, targetId, date, day)) {
        return { ok: false, type: 'arena_used', forTarget: true };
    }

    const challengerEntry = ensureDayEntry(ensureMonthData(deerData, challengerId, date), day);
    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    const challengerWins = Math.random() < 0.5;
    const winnerId = challengerWins ? challengerId : targetId;
    const loserId = challengerWins ? targetId : challengerId;
    const winnerEntry = challengerWins ? challengerEntry : targetEntry;
    const loserEntry = challengerWins ? targetEntry : challengerEntry;

    adjustDayCount(loserEntry, -ARENA_STAKE);
    adjustDayCount(winnerEntry, ARENA_STAKE);
    loserEntry.a += 1;
    winnerEntry.a += 1;

    return {
        ok: true,
        type: challengerWins ? 'arena_win_challenger' : 'arena_win_target',
        winnerId: String(winnerId),
        loserId: String(loserId),
        stake: ARENA_STAKE,
        challengerCount: challengerEntry.d ? 0 : challengerEntry.c,
        targetCount: targetEntry.d ? 0 : targetEntry.c,
        challengerWins,
    };
}

/** 偷鹿：35% 得手 / 25% 反噬 / 40% 空手 */
export function performStealDeer(deerData, thiefId, targetId, date, day) {
    if (String(thiefId) === String(targetId)) {
        return { ok: false, type: 'steal_self' };
    }
    const actorDead = rejectIfActorDead(deerData, thiefId, date, day);
    if (actorDead) return actorDead;

    const thiefMonth = ensureMonthData(deerData, thiefId, date);
    const used = readDailyUsed(thiefMonth, day, stealUsedKey);
    if (used >= DAILY_STEAL_QUOTA) {
        return { ok: false, type: 'steal_used', stealUsed: used, stealLeft: 0 };
    }

    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (targetEntry.d) return { ok: false, type: 'steal_target_dead' };
    if (targetEntry.c <= 0) return { ok: false, type: 'steal_empty' };

    thiefMonth[stealUsedKey(day)] = used + 1;
    const thiefEntry = ensureDayEntry(thiefMonth, day);
    thiefEntry.a += 1;

    const curseStacks = getActiveCurseStacks(targetEntry);
    const stealBonus = curseStacks * STEAL_CURSE_BONUS_PER_STACK;
    const successCap = Math.min(0.95, STEAL_SUCCESS_CHANCE + stealBonus);
    const backfireCap = successCap + STEAL_BACKFIRE_CHANCE;

    const roll = Math.random();
    if (roll < successCap) {
        adjustDayCount(targetEntry, -1);
        adjustDayCount(thiefEntry, 1);
        return {
            ok: true,
            type: 'steal_success',
            thiefCount: thiefEntry.c,
            targetCount: targetEntry.c,
            stealUsed: used + 1,
            stealLeft: DAILY_STEAL_QUOTA - used - 1,
            curseStacks,
            stealBonus,
        };
    }
    if (roll < backfireCap) {
        adjustDayCount(thiefEntry, -1);
        let curseBackfire = false;
        if (curseStacks > 0 && rollChance(STEAL_CURSE_BACKFIRE_CHANCE)) {
            applyCurseStacks(thiefEntry, 1);
            curseBackfire = true;
        }
        return {
            ok: true,
            type: curseBackfire ? 'steal_curse_backfire' : 'steal_backfire',
            thiefCount: thiefEntry.c,
            targetCount: targetEntry.c,
            stealUsed: used + 1,
            stealLeft: DAILY_STEAL_QUOTA - used - 1,
            curseStacks,
            stealBonus,
            curseBackfire,
        };
    }
    let curseBackfire = false;
    if (curseStacks > 0 && rollChance(STEAL_CURSE_BACKFIRE_CHANCE * 0.6)) {
        applyCurseStacks(thiefEntry, 1);
        curseBackfire = true;
    }
    return {
        ok: true,
        type: curseBackfire ? 'steal_curse_fail' : 'steal_fail',
        thiefCount: thiefEntry.c,
        targetCount: targetEntry.c,
        stealUsed: used + 1,
        stealLeft: DAILY_STEAL_QUOTA - used - 1,
        curseStacks,
        stealBonus,
        curseBackfire,
    };
}

/** 鹿咒：叠层 + 三回合内每层 +10% 鹿死 */
export function performCurseDeer(deerData, casterId, targetId, date, day) {
    if (String(casterId) === String(targetId)) {
        return { ok: false, type: 'curse_self' };
    }
    const actorDead = rejectIfActorDead(deerData, casterId, date, day);
    if (actorDead) return actorDead;

    const casterMonth = ensureMonthData(deerData, casterId, date);
    const used = readDailyUsed(casterMonth, day, curseUsedKey);
    if (used >= DAILY_CURSE_QUOTA) {
        return { ok: false, type: 'curse_used', curseUsed: used, curseLeft: 0 };
    }

    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };

    casterMonth[curseUsedKey(day)] = used + 1;
    const stacks = applyCurseStacks(targetEntry, 1);

    return {
        ok: true,
        type: 'curse',
        curseUsed: used + 1,
        curseLeft: DAILY_CURSE_QUOTA - used - 1,
        curseStacks: stacks,
        curseRounds: targetEntry.curR,
        bonus: CURSE_DEATH_BONUS,
        ascended: stacks >= CURSE_ASCENDED_STACKS,
    };
}

/** 解鹿咒：🦌友互助清除全部咒印 */
export function performCleanseCurse(deerData, helperId, targetId, date, day) {
    if (String(helperId) === String(targetId)) {
        return { ok: false, type: 'curse_self' };
    }
    const actorDead = rejectIfActorDead(deerData, helperId, date, day);
    if (actorDead) return actorDead;

    const helperMonth = ensureMonthData(deerData, helperId, date);
    const used = readDailyUsed(helperMonth, day, cleanseUsedKey);
    if (used >= DAILY_CLEANSE_CURSE_QUOTA) {
        return { ok: false, type: 'cleanse_used', cleanseUsed: used, cleanseLeft: 0 };
    }

    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };
    if (!getCurseInfo(targetEntry).active) {
        return { ok: false, type: 'cleanse_no_curse' };
    }

    const clearedStacks = getActiveCurseStacks(targetEntry);
    clearCurse(targetEntry);
    helperMonth[cleanseUsedKey(day)] = used + 1;

    return {
        ok: true,
        type: 'cleanse_curse',
        cleanseUsed: used + 1,
        cleanseLeft: DAILY_CLEANSE_CURSE_QUOTA - used - 1,
        clearedStacks,
    };
}

/** 献祭鹿：施术者 -2，目标 +2 */
export function performSacrificeDeer(deerData, userId, targetId, date, day) {
    if (String(userId) === String(targetId)) {
        return { ok: false, type: 'sacrifice_self' };
    }
    const actorDead = rejectIfActorDead(deerData, userId, date, day);
    if (actorDead) return actorDead;

    const selfMonth = ensureMonthData(deerData, userId, date);
    if (readDailyUsed(selfMonth, day, sacrificeUsedKey) >= DAILY_SACRIFICE_QUOTA) {
        return { ok: false, type: 'sacrifice_used' };
    }

    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };

    selfMonth[sacrificeUsedKey(day)] = 1;
    const selfEntry = ensureDayEntry(selfMonth, day);
    adjustDayCount(selfEntry, -SACRIFICE_TRANSFER);
    adjustDayCount(targetEntry, SACRIFICE_TRANSFER);
    selfEntry.a += 1;
    targetEntry.a += 1;

    let cursePurged = 0;
    if (getActiveCurseStacks(targetEntry) > 0) {
        targetEntry.cur = Math.max(0, targetEntry.cur - 1);
        if (targetEntry.cur <= 0) clearCurse(targetEntry);
        else targetEntry.curR = CURSE_MAX_ROUNDS;
        cursePurged = 1;
    }

    return {
        ok: true,
        type: 'sacrifice',
        selfCount: selfEntry.c,
        targetCount: targetEntry.c,
        transfer: SACRIFICE_TRANSFER,
        cursePurged,
    };
}

/** 诈戒：文案像戒🦌，实际 +1 */
export function performFakeWithdrawal(deerData, userId, date, day) {
    const actorDead = rejectIfActorDead(deerData, userId, date, day);
    if (actorDead) return actorDead;

    const monthData = ensureMonthData(deerData, userId, date);
    const used = readDailyUsed(monthData, day, fakeWithdrawUsedKey);
    if (used >= DAILY_FAKE_WITHDRAW_QUOTA) {
        return { ok: false, type: 'fake_withdraw_used', fakeWithdrawUsed: used, fakeWithdrawLeft: 0 };
    }

    monthData[fakeWithdrawUsedKey(day)] = used + 1;
    const entry = ensureDayEntry(monthData, day);
    entry.c += 1;
    entry.a += 1;
    const fakeCount = entry.c - 1;

    return {
        ok: true,
        type: 'fake_withdraw',
        entry,
        count: entry.c,
        fakeCount,
        fakeWithdrawUsed: used + 1,
        fakeWithdrawLeft: DAILY_FAKE_WITHDRAW_QUOTA - used - 1,
    };
}

/** 催鹿：目标今日 0 次则叠 urge buff（下次安全🦌 +1） */
export function performUrgeDeer(deerData, userId, targetId, date, day) {
    if (String(userId) === String(targetId)) {
        return { ok: false, type: 'urge_self' };
    }
    const actorDead = rejectIfActorDead(deerData, userId, date, day);
    if (actorDead) return actorDead;

    const selfMonth = ensureMonthData(deerData, userId, date);
    const used = readDailyUsed(selfMonth, day, urgeUsedKey);
    if (used >= DAILY_URGE_QUOTA) {
        return { ok: false, type: 'urge_used', urgeUsed: used, urgeLeft: 0 };
    }

    const targetMonth = ensureMonthData(deerData, targetId, date);
    const targetEntry = ensureDayEntry(targetMonth, day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };

    selfMonth[urgeUsedKey(day)] = used + 1;
    const targetWasZero = targetEntry.c <= 0 && !targetEntry.d;
    let curseUrged = false;
    if (targetWasZero) {
        targetMonth[urgeBuffKey(day)] = 1;
    }
    if (getCurseInfo(targetEntry).active) {
        targetEntry.curR = Math.max(0, (targetEntry.curR || 0) - 1);
        if (targetEntry.curR <= 0) clearCurse(targetEntry);
        curseUrged = true;
    }

    return {
        ok: true,
        type: 'urge',
        urgeUsed: used + 1,
        urgeLeft: DAILY_URGE_QUOTA - used - 1,
        buffApplied: targetWasZero,
        curseUrged,
        targetCount: targetEntry.c,
        curseRounds: getCurseRoundsLeft(targetEntry),
        curseStacks: getActiveCurseStacks(targetEntry),
    };
}

/** 鹿鸣：恶趣味喊话，小概率 ±1 */
export function performDeerHowl(deerData, userId, date, day) {
    const monthData = ensureMonthData(deerData, userId, date);
    const entry = ensureDayEntry(monthData, day);
    const used = readDailyUsed(monthData, day, howlUsedKey);
    if (used >= DAILY_HOWL_QUOTA) {
        return { ok: false, type: 'howl_used', howlUsed: used, howlLeft: 0 };
    }

    monthData[howlUsedKey(day)] = used + 1;

    if (entry.d) {
        return {
            ok: true,
            type: 'howl_dead',
            count: 0,
            howlUsed: used + 1,
            howlLeft: DAILY_HOWL_QUOTA - used - 1,
        };
    }

    let howlEffect = 'none';
    let curseDispelled = 0;
    if (rollChance(HOWL_TRAP_CHANCE)) {
        adjustDayCount(entry, -1);
        howlEffect = 'trap';
    } else if (rollChance(HOWL_BONUS_CHANCE)) {
        entry.c += 1;
        howlEffect = 'bonus';
        if (getCurseInfo(entry).active) {
            entry.cur = Math.max(0, entry.cur - 1);
            if (entry.cur <= 0) clearCurse(entry);
            else entry.curR = CURSE_MAX_ROUNDS;
            curseDispelled = 1;
            howlEffect = 'bonus_cleanse';
        }
    }

    return {
        ok: true,
        type: 'howl',
        count: entry.c,
        howlEffect,
        curseDispelled,
        howlUsed: used + 1,
        howlLeft: DAILY_HOWL_QUOTA - used - 1,
    };
}

/** 倒贴鹿：50% 你 +1 对方 -1，失败你 -2 */
export function performGreedDeer(deerData, userId, targetId, date, day) {
    if (String(userId) === String(targetId)) {
        return { ok: false, type: 'greed_self' };
    }
    const actorDead = rejectIfActorDead(deerData, userId, date, day);
    if (actorDead) return actorDead;

    const selfMonth = ensureMonthData(deerData, userId, date);
    if (readDailyUsed(selfMonth, day, greedUsedKey) >= DAILY_GREED_QUOTA) {
        return { ok: false, type: 'greed_used' };
    }

    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };

    selfMonth[greedUsedKey(day)] = 1;
    const selfEntry = ensureDayEntry(selfMonth, day);
    selfEntry.a += 1;

    if (rollChance(GREED_SUCCESS_CHANCE)) {
        adjustDayCount(selfEntry, 1);
        adjustDayCount(targetEntry, -1);
        let curseStripped = 0;
        if (getActiveCurseStacks(targetEntry) > 0) {
            targetEntry.cur = Math.max(0, targetEntry.cur - 1);
            if (targetEntry.cur <= 0) clearCurse(targetEntry);
            curseStripped = 1;
        }
        return {
            ok: true,
            type: 'greed_success',
            selfCount: selfEntry.c,
            targetCount: targetEntry.c,
            curseStripped,
        };
    }

    adjustDayCount(selfEntry, -GREED_FAIL_PENALTY);
    return {
        ok: true,
        type: 'greed_fail',
        selfCount: selfEntry.c,
        targetCount: targetEntry.c,
        penalty: GREED_FAIL_PENALTY,
    };
}

/** 群鹿溅：日榜 Top5 各 -1，带咒者额外引爆，20% 叠咒，施术者反噬 -2 */
export function performGroupSplash(deerData, casterId, memberIds, date, day) {
    const actorDead = rejectIfActorDead(deerData, casterId, date, day);
    if (actorDead) return actorDead;

    const targets = pickSplashTargetsFromDayRank(deerData, memberIds, casterId, date, GROUP_SPLASH_TOP_N);
    if (!targets.length) {
        return { ok: false, type: 'splash_no_rank' };
    }

    const casterMonth = ensureMonthData(deerData, casterId, date);
    const used = readDailyUsed(casterMonth, day, groupSplashUsedKey);
    if (used >= DAILY_GROUP_SPLASH_QUOTA) {
        return {
            ok: false,
            type: 'splash_used',
            splashUsed: used,
            splashLeft: 0,
        };
    }

    const victims = [];
    for (const uid of targets) {
        const entry = getDayEntry(getMonthData(getUserRecord(deerData, uid), date), day);
        if (entry?.d) continue;

        const targetMonth = ensureMonthData(deerData, uid, date);
        const targetEntry = ensureDayEntry(targetMonth, day);
        const hadCurse = getCurseInfo(targetEntry).active;
        adjustDayCount(targetEntry, -GROUP_SPLASH_DAMAGE);
        let burst = false;
        if (hadCurse) {
            adjustDayCount(targetEntry, -GROUP_SPLASH_CURSE_BURST_DAMAGE);
            burst = true;
        }
        targetEntry.a += 1;
        let cursed = false;
        if (rollChance(GROUP_SPLASH_CURSE_CHANCE)) {
            applyCurseStacks(targetEntry, 1);
            cursed = true;
        }
        victims.push({
            id: uid,
            count: targetEntry.c,
            cursed,
            burst,
            stacks: getActiveCurseStacks(targetEntry),
        });
    }

    if (!victims.length) {
        return { ok: false, type: 'splash_no_victims' };
    }

    casterMonth[groupSplashUsedKey(day)] = used + 1;
    const casterEntry = ensureDayEntry(casterMonth, day);
    adjustDayCount(casterEntry, -GROUP_SPLASH_RECOIL);
    casterEntry.a += 1;

    return {
        ok: true,
        type: 'group_splash',
        victims,
        targetCount: targets.length,
        totalHit: victims.length,
        burstCount: victims.filter((v) => v.burst).length,
        cursedCount: victims.filter((v) => v.cursed).length,
        recoil: GROUP_SPLASH_RECOIL,
        damage: GROUP_SPLASH_DAMAGE,
        burstDamage: GROUP_SPLASH_CURSE_BURST_DAMAGE,
        casterCount: casterEntry.c,
        splashUsed: used + 1,
        splashLeft: DAILY_GROUP_SPLASH_QUOTA - used - 1,
    };
}

/** 借鹿：🦌友周转 1 次，目标需≥2，顺带撕 1 层咒 */
export function performBorrowDeer(deerData, borrowerId, targetId, date, day) {
    if (String(borrowerId) === String(targetId)) {
        return { ok: false, type: 'borrow_self' };
    }
    const actorDead = rejectIfActorDead(deerData, borrowerId, date, day);
    if (actorDead) return actorDead;

    const borrowerMonth = ensureMonthData(deerData, borrowerId, date);
    const used = readDailyUsed(borrowerMonth, day, borrowUsedKey);
    if (used >= DAILY_BORROW_QUOTA) {
        return { ok: false, type: 'borrow_used', borrowUsed: used, borrowLeft: 0 };
    }

    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };
    if (targetEntry.c < BORROW_MIN_TARGET_COUNT) {
        return { ok: false, type: 'borrow_poor', min: BORROW_MIN_TARGET_COUNT };
    }

    borrowerMonth[borrowUsedKey(day)] = used + 1;
    const borrowerEntry = ensureDayEntry(borrowerMonth, day);
    adjustDayCount(targetEntry, -1);
    adjustDayCount(borrowerEntry, 1);
    targetEntry.a += 1;
    borrowerEntry.a += 1;
    const curseStripped = stripOneCurseStack(targetEntry);

    return {
        ok: true,
        type: 'borrow',
        selfCount: borrowerEntry.c,
        targetCount: targetEntry.c,
        curseStripped,
        borrowUsed: used + 1,
        borrowLeft: DAILY_BORROW_QUOTA - used - 1,
    };
}

/** 碰瓷鹿：38% 你+1ta-1 / 32% 双-1 / 30% 你只-2，碰瓷成功小概率叠咒 */
export function performBumperDeer(deerData, actorId, targetId, date, day) {
    if (String(actorId) === String(targetId)) {
        return { ok: false, type: 'bumper_self' };
    }
    const actorDead = rejectIfActorDead(deerData, actorId, date, day);
    if (actorDead) return actorDead;

    const actorMonth = ensureMonthData(deerData, actorId, date);
    const used = readDailyUsed(actorMonth, day, bumperUsedKey);
    if (used >= DAILY_BUMPER_QUOTA) {
        return { ok: false, type: 'bumper_used', bumperUsed: used, bumperLeft: 0 };
    }

    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };

    actorMonth[bumperUsedKey(day)] = used + 1;
    const actorEntry = ensureDayEntry(actorMonth, day);
    actorEntry.a += 1;
    targetEntry.a += 1;

    const roll = Math.random();
    if (roll < BUMPER_WIN_CHANCE) {
        adjustDayCount(actorEntry, 1);
        adjustDayCount(targetEntry, -1);
        let curseApplied = false;
        if (rollChance(BUMPER_CURSE_ON_WIN_CHANCE)) {
            applyCurseStacks(targetEntry, 1);
            curseApplied = true;
        }
        return {
            ok: true,
            type: 'bumper_win',
            selfCount: actorEntry.c,
            targetCount: targetEntry.c,
            curseApplied,
            bumperUsed: used + 1,
            bumperLeft: DAILY_BUMPER_QUOTA - used - 1,
        };
    }
    if (roll < BUMPER_WIN_CHANCE + BUMPER_DRAW_CHANCE) {
        adjustDayCount(actorEntry, -1);
        adjustDayCount(targetEntry, -1);
        return {
            ok: true,
            type: 'bumper_draw',
            selfCount: actorEntry.c,
            targetCount: targetEntry.c,
            bumperUsed: used + 1,
            bumperLeft: DAILY_BUMPER_QUOTA - used - 1,
        };
    }
    adjustDayCount(actorEntry, -BUMPER_FAIL_PENALTY);
    return {
        ok: true,
        type: 'bumper_fail',
        selfCount: actorEntry.c,
        targetCount: targetEntry.c,
        penalty: BUMPER_FAIL_PENALTY,
        bumperUsed: used + 1,
        bumperLeft: DAILY_BUMPER_QUOTA - used - 1,
    };
}

/** 抽鹿签：单人每日运势（+1/-1/催更符/自咒/撕咒/空签） */
export function performDeerLottery(deerData, userId, date, day) {
    const actorDead = rejectIfActorDead(deerData, userId, date, day);
    if (actorDead) return actorDead;

    const monthData = ensureMonthData(deerData, userId, date);
    const used = readDailyUsed(monthData, day, lotteryUsedKey);
    if (used >= DAILY_LOTTERY_QUOTA) {
        return { ok: false, type: 'lottery_used', lotteryUsed: used, lotteryLeft: 0 };
    }

    monthData[lotteryUsedKey(day)] = used + 1;
    const entry = ensureDayEntry(monthData, day);
    entry.a += 1;

    const roll = Math.random();
    let outcome;
    if (roll < 0.28) outcome = 'plus';
    else if (roll < 0.48) outcome = 'minus';
    else if (roll < 0.63) outcome = 'urge';
    else if (roll < 0.73) outcome = 'curse';
    else if (roll < 0.85) outcome = 'cleanse';
    else outcome = 'blank';

    if (outcome === 'cleanse' && !getActiveCurseStacks(entry)) {
        outcome = roll < 0.5 ? 'plus' : 'blank';
    }
    if (outcome === 'urge' && entry.c > 0) {
        outcome = 'plus';
    }

    switch (outcome) {
        case 'plus':
            adjustDayCount(entry, 1);
            break;
        case 'minus':
            adjustDayCount(entry, -1);
            break;
        case 'urge':
            monthData[urgeBuffKey(day)] = 1;
            break;
        case 'curse':
            applyCurseStacks(entry, 1);
            break;
        case 'cleanse':
            stripOneCurseStack(entry);
            break;
        default:
            break;
    }

    const ci = getCurseInfo(entry);
    return {
        ok: true,
        type: 'lottery',
        outcome,
        count: entry.c,
        curseStacks: ci.stacks,
        curseRounds: ci.rounds,
        lotteryUsed: used + 1,
        lotteryLeft: DAILY_LOTTERY_QUOTA - used - 1,
    };
}

/** 擂台拒战：应战者 -1 次 */
export function performArenaDecline(deerData, targetId, date, day, penalty = 1) {
    const targetMonth = ensureMonthData(deerData, targetId, date);
    const entry = ensureDayEntry(targetMonth, day);
    if (!entry.d) {
        adjustDayCount(entry, -penalty);
        entry.a += 1;
    }
    return {
        ok: true,
        type: 'arena_decline',
        count: entry.d ? 0 : entry.c,
        penalty,
    };
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
    DAILY_IMPERIAL_QUOTA,
    DAILY_ARENA_QUOTA,
    OVERLIMIT_DEATH_CHANCE_BASE,
    OVERLIMIT_DEATH_CHANCE_STEP,
    HELP_FAIL_CHANCE,
    HELP_KILL_CHANCE,
    DEATH_REASON,
    calcOverlimitDeathChance,
    TOGETHER_FALL_COST,
    ARENA_STAKE,
    IMPERIAL_WIN_DEDUCT,
    IMPERIAL_LOSE_DEDUCT,
    IMPERIAL_KING_WIN_BONUS,
};
