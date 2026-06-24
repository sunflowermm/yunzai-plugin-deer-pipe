/** 签到数据读写与游戏逻辑 */

import {
    ARENA_STAKE,
    CURSE_ASCENDED_STACKS,
    CURSE_DEATH_BONUS,
    CURSE_MAX_ROUNDS,
    CURSE_MAX_STACKS,
    DAILY_ARENA_QUOTA,
    BORROW_MIN_TARGET_COUNT,
    BUMPER_WIN_CHANCE,
    BUMPER_DRAW_CHANCE,
    BUMPER_FAIL_PENALTY,
    BUMPER_CURSE_ON_WIN_CHANCE,
    VENGEANCE_CURSE_CHANCE,
    VENGEANCE_DEDUCT_CHANCE,
    VENGEANCE_SUBSTITUTE_CURSE_CHANCE,
    REVIVE_LOTTERY_FULL_CHANCE,
    REVIVE_LOTTERY_WEAK_CHANCE,
    REVIVE_LOTTERY_WEAK_COUNT,
    GHOST_HOWL_KILLER_CURSE_CHANCE,
    BLESS_DEATH_REDUCE,
    BLESS_MAX_STACKS,
    BLESS_MAX_ROUNDS,
    DAILY_HELP_QUOTA,
    DAILY_HELP_WITHDRAW_QUOTA,
    DAILY_IMPERIAL_QUOTA,
    DAILY_SAFE_LIMIT,
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
    HELP_WITHDRAW_FAIL_CHANCE,
    IMPERIAL_LOSE_DEDUCT,
    IMPERIAL_WIN_DEDUCT,
    IMPERIAL_KING_WIN_BONUS,
    META_PREFIX,
    PATROL_WEATHER_AMP,
    GRINDER_SKILL_LU_GAIN,
    GRINDER_SKILL_ARENA_BONUS,
    RANGER_SKILL_LOTTERY_BONUS,
    ASCETIC_SKILL_WITHDRAW,
    CURSER_SKILL_CURSE_LAYERS,
    BLESSER_SKILL_BLESS_LAYERS,
    ROGUE_NIGHT_RAID_CHANCE,
    SUNFLOWER_FACING_URGE_STACKS,
    SUNFLOWER_FACING_BLESS_LAYERS,
    SUNFLOWER_FACING_COUNT_GAIN,
    MEDIC_SKILL_HELP_QUOTA_BONUS,
    GRINDER_RUSH_DEATH_MULT,
    RANGER_SKILL_LOTTERY_LUCK,
    OVERLIMIT_DEATH_CHANCE_BASE,
    OVERLIMIT_DEATH_CHANCE_STEP,
    TOGETHER_FALL_COST,
    calcOverlimitDeathChance,
    formatChancePercent,
    CART_SESSION_MAX_ROUNDS,
    isPrivileged,
    getDeathReasonText,
} from '../constants/game.js';

import { recordHelpAction, peekHelperStats } from './help-log.js';
import { isUserProfileKey } from './skin.js';
import {
    calcDayBalancedScore,
    computeBalancedScore,
    formatBalancedBreakdown,
} from './balanced-score.js';
import { getProfessionQuotaLimit, QUOTA, helpQuotaBonusKey, grantJobSkillQuotaBonus, jobSkillQuotaBonusKey, formatProfessionQuotaSummary } from './profession-quota.js';
import { YUMUMU_BIND_MINUTES, formatExtraDeerQuotaBrief, isYumumuBindAfterCutoff, YUJIE_IMPERIAL_WIN_BONUS } from '../constants/extra-deer.js';
import {
    getProfessionDef,
    getProfessionMods,
    getHelpQuotaLimit,
    getHelpWithdrawQuotaLimit,
    getDayProfessionId,
    hasDayProfession,
    setDayProfession,
    scaleWeatherForProfession,
    jobMetaKey,
    resolveProfessionId,
    weatherForAction,
    hasUsedJobSkill,
    markJobSkillUsed,
    setPatrolBuff,
    hasPatrolBuff,
    setPatrolLotteryLuck,
    consumePatrolLotteryLuck,
    getJobSkillSnapshot,
    rejectIfWrongProfession,
    patrolBuffKey,
    jobSkillUsedKey,
} from './profession.js';
import {
    applyLuBan,
    applyYumumuHelpSynergy,
    clearLuBan,
    clearYujieImperialGuarantee,
    consumeImpotence,
    getExtraDeerDef,
    hasYujieImperialGuarantee,
    applyYujieImperialGuarantee,
    getImpotenceHelpFailBonus,
    getMeijiaTeamPartnerId,
    impotenceKey,
    isExtraDeerId,
    isLuBanned,
    luBanUntilKey,
    meijiaTeamKey,
    rejectIfLuBanned,
    rejectIfMeijiaTeamPartnerLu,
    rejectIfMeijiaWithdrawal,
    rejectIfWrongExtraDeer,
    resolveExtraDeerId,
    resolveMeijiaTeamOnDeath,
    setMeijiaTeamLink,
    syncMeijiaTeamLu,
    buildExtraDeerMods,
} from './extra-deer.js';
import {
    activateDeerCart,
    clearDeerCartInvite,
    clearDeerCartPair,
    deerCartInviteKey,
    deerCartPartnerKey,
    deerCartRoleKey,
    getDeerCartInvite,
    getDeerCartPartnerId,
    getDeerCartRole,
    isInDeerCart,
    rejectIfCartHelpWrongTarget,
    rejectIfCartDriverLu,
    rejectIfCartHelperLu,
    resolveDeerCartOnDriverDeath,
    setDeerCartInvite,
} from './deer-cart.js';

const MONTH_KEY_RE = /^\d{4}-\d{2}$/;
const DAY_KEY_RE = /^\d{1,2}$/;

/** 单日: c/a/d/snap/dc/dr/dk/... cur/curR 咒 ble/bleR 福 */
export function createDayEntry(count = 0) {
    return {
        c: count, a: count, d: 0, snap: 0, dc: 0, dr: '', dk: '',
        helped: 0, revived: 0, helpBy: {}, cur: 0, curR: 0, ble: 0, bleR: 0,
    };
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
            ble: raw.ble ?? 0,
            bleR: raw.bleR ?? (raw.ble ? BLESS_MAX_ROUNDS : 0),
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

/** 指定日是否鹿死 */
export function isDeadOnDay(deerData, userId, date, day) {
    const entry = getDayEntry(getMonthData(getUserRecord(deerData, userId), date), day);
    return !!entry?.d;
}

export function getDayRankCount(entry) {
    if (!entry) return null;
    if (entry.d) return entry.snap ?? 0;
    return entry.c ?? 0;
}

export function getStealableCount(entry) {
    if (!entry) return 0;
    if (entry.d) return Math.max(0, entry.snap ?? 0);
    return entry.c ?? 0;
}

function adjustStealableCount(entry, delta) {
    if (entry.d) {
        entry.snap = (entry.snap ?? 0) + delta;
        return entry.snap;
    }
    return adjustDayCount(entry, delta);
}

function entryForBalancedRank(entry) {
    if (!entry?.d) return entry;
    const snap = entry.snap ?? 0;
    if (snap <= 0) return null;
    return {
        ...entry,
        d: 0,
        c: snap,
        cur: 0,
        curR: 0,
        ble: 0,
        bleR: 0,
    };
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

function blessUsedKey(day) {
    return `${META_PREFIX.BLESS}${day}`;
}

function cleanseBlessUsedKey(day) {
    return `${META_PREFIX.CLEANSE_BLESS}${day}`;
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

export function getUrgeBuffStacks(monthData, day) {
    const raw = monthData?.[urgeBuffKey(day)];
    if (typeof raw === 'number' && raw > 0) return Math.floor(raw);
    return raw ? 1 : 0;
}

function addUrgeBuffStack(monthData, day, layers = 1) {
    const next = getUrgeBuffStacks(monthData, day) + layers;
    monthData[urgeBuffKey(day)] = next;
    return next;
}

/** 自🦌存活时兑现催更符：+N 并清空叠层，返回 N（0=无符） */
function consumeUrgeBuffOnLu(monthData, day, entry) {
    const urgeStacks = getUrgeBuffStacks(monthData, day);
    if (urgeStacks <= 0) return 0;
    entry.c += urgeStacks;
    delete monthData[urgeBuffKey(day)];
    return urgeStacks;
}

function applyUrgeProfessionConsumeBonus(entry, profMods, urgeBonus) {
    const extra = profMods?.urgeBuffConsumeBonus || 0;
    if (urgeBonus <= 0 || extra <= 0) return urgeBonus;
    entry.c += extra;
    return urgeBonus + extra;
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

function spectralCurseUsedKey(day) {
    return `${META_PREFIX.SPECTRAL_CURSE}${day}`;
}

function vengeanceUsedKey(day) {
    return `${META_PREFIX.VENGEANCE}${day}`;
}

function dreamUsedKey(day) {
    return `${META_PREFIX.DREAM}${day}`;
}

function reviveLotteryUsedKey(day) {
    return `${META_PREFIX.REVIVE_LOT}${day}`;
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

/** 玩法配额 used/max/left */
function playQuotaSlice(monthData, day, quotaId, usedKeyFn) {
    const max = getProfessionQuotaLimit(monthData, day, quotaId);
    const used = readDailyUsed(monthData, day, usedKeyFn);
    return { used, max, left: Math.max(0, max - used) };
}

/** 玩法配额：0 禁用 / 用尽 */
function rejectIfPlayQuotaBlocked(monthData, day, quotaId, usedKeyFn, prefix) {
    const max = getProfessionQuotaLimit(monthData, day, quotaId);
    if (max <= 0) {
        return { ok: false, type: `${prefix}_disabled`, [`${prefix}Max`]: 0 };
    }
    const used = readDailyUsed(monthData, day, usedKeyFn);
    if (used >= max) {
        return {
            ok: false,
            type: `${prefix}_used`,
            [`${prefix}Used`]: used,
            [`${prefix}Max`]: max,
            [`${prefix}Left`]: 0,
        };
    }
    return null;
}

/** 当日全玩法配额快照（鹿配额 / 鹿况） */
export function getPlayQuotaSnapshot(monthData, day) {
    if (!hasDayProfession(monthData, day)) {
        return { professionRequired: true, play: {}, help: null, withdraw: null };
    }
    const profession = getProfessionMods(monthData, day);
    const helpMax = getHelpQuotaLimit(monthData, day);
    const withdrawMax = getHelpWithdrawQuotaLimit(monthData, day);
    const helpUsed = getHelperQuota(monthData, day).used;
    const withdrawUsed = getHelperWithdrawQuota(monthData, day).used;
    const play = {
        steal: playQuotaSlice(monthData, day, QUOTA.steal, stealUsedKey),
        curse: playQuotaSlice(monthData, day, QUOTA.curse, curseUsedKey),
        bless: playQuotaSlice(monthData, day, QUOTA.bless, blessUsedKey),
        cleanseCurse: playQuotaSlice(monthData, day, QUOTA.cleanseCurse, cleanseUsedKey),
        cleanseBless: playQuotaSlice(monthData, day, QUOTA.cleanseBless, cleanseBlessUsedKey),
        arena: playQuotaSlice(monthData, day, QUOTA.arena, arenaUsedKey),
        imperial: playQuotaSlice(monthData, day, QUOTA.imperial, imperialUsedKey),
        sacrifice: playQuotaSlice(monthData, day, QUOTA.sacrifice, sacrificeUsedKey),
        fakeWithdraw: playQuotaSlice(monthData, day, QUOTA.fakeWithdraw, fakeWithdrawUsedKey),
        urge: playQuotaSlice(monthData, day, QUOTA.urge, urgeUsedKey),
        howl: playQuotaSlice(monthData, day, QUOTA.howl, howlUsedKey),
        greed: playQuotaSlice(monthData, day, QUOTA.greed, greedUsedKey),
        groupSplash: playQuotaSlice(monthData, day, QUOTA.groupSplash, groupSplashUsedKey),
        borrow: playQuotaSlice(monthData, day, QUOTA.borrow, borrowUsedKey),
        bumper: playQuotaSlice(monthData, day, QUOTA.bumper, bumperUsedKey),
        lottery: playQuotaSlice(monthData, day, QUOTA.lottery, lotteryUsedKey),
        spectralCurse: playQuotaSlice(monthData, day, QUOTA.spectralCurse, spectralCurseUsedKey),
        vengeance: playQuotaSlice(monthData, day, QUOTA.vengeance, vengeanceUsedKey),
        dream: playQuotaSlice(monthData, day, QUOTA.dream, dreamUsedKey),
        reviveLottery: playQuotaSlice(monthData, day, QUOTA.reviveLottery, reviveLotteryUsedKey),
        together: playQuotaSlice(monthData, day, QUOTA.together, togetherUsedKey),
    };
    return {
        professionRequired: false,
        profession,
        help: { used: helpUsed, max: helpMax, left: Math.max(0, helpMax - helpUsed) },
        withdraw: { used: withdrawUsed, max: withdrawMax, left: Math.max(0, withdrawMax - withdrawUsed) },
        play,
        summary: isExtraDeerId(profession.id)
            ? formatExtraDeerQuotaBrief(profession.id)
            : formatProfessionQuotaSummary(profession.id, 'full'),
    };
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
    const limit = getHelpQuotaLimit(monthData, day);
    return Math.max(0, limit - getHelperQuota(monthData, day).used);
}

export function getHelperWithdrawQuota(monthData, day) {
    if (!monthData) return { used: 0, to: {} };
    const key = helperWithdrawQuotaKey(day);
    if (!monthData[key]) monthData[key] = { used: 0, to: {} };
    return monthData[key];
}

export function getHelperWithdrawQuotaLeft(monthData, day) {
    const limit = getHelpWithdrawQuotaLimit(monthData, day);
    return Math.max(0, limit - getHelperWithdrawQuota(monthData, day).used);
}

/** 当日互助配额快照（职业上限 + 已用/剩余） */
export function getHelperQuotaSnapshot(monthData, day) {
    const snap = getPlayQuotaSnapshot(monthData, day);
    if (snap.professionRequired) {
        return {
            professionRequired: true,
            profession: null,
            locked: false,
            help: { used: 0, max: 0, left: 0 },
            withdraw: { used: 0, max: 0, left: 0 },
        };
    }
    return {
        professionRequired: false,
        profession: snap.profession,
        locked: true,
        help: snap.help,
        withdraw: snap.withdraw,
        playSummary: snap.summary,
    };
}

function consumeHelperWithdrawQuota(helperMonthData, day, targetId) {
    const limit = getHelpWithdrawQuotaLimit(helperMonthData, day);
    const q = getHelperWithdrawQuota(helperMonthData, day);
    q.used += 1;
    const t = String(targetId);
    q.to[t] = (q.to[t] || 0) + 1;
    return {
        helpWithdrawUsed: q.used,
        helpWithdrawLeft: Math.max(0, limit - q.used),
        helpWithdrawMax: limit,
    };
}

export function resetDailyHelperQuotas(monthData, day) {
    if (!monthData) return;
    delete monthData[helperQuotaKey(day)];
    delete monthData[helperWithdrawQuotaKey(day)];
    delete monthData[helpQuotaBonusKey(day)];
}

/** 清空指定日期的玩法元数据（保留当日🦌绩 entry） */
export function resetUserDayMeta(monthData, day) {
    if (!monthData) return;
    delete monthData[helperQuotaKey(day)];
    delete monthData[helperWithdrawQuotaKey(day)];
    delete monthData[helpQuotaBonusKey(day)];
    delete monthData[jobMetaKey(day)];
    delete monthData[jobSkillUsedKey(day)];
    delete monthData[patrolBuffKey(day)];
    delete monthData[`${META_PREFIX.PATROL_LOTTERY_LUCK}${day}`];
    delete monthData[`${META_PREFIX.GRINDER_RUSH_SHIELD}${day}`];
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
    delete monthData[spectralCurseUsedKey(day)];
    delete monthData[vengeanceUsedKey(day)];
    delete monthData[dreamUsedKey(day)];
    delete monthData[reviveLotteryUsedKey(day)];
    delete monthData[blessUsedKey(day)];
    delete monthData[cleanseBlessUsedKey(day)];
    delete monthData[deerCartInviteKey(day)];
    delete monthData[deerCartPartnerKey(day)];
    delete monthData[deerCartRoleKey(day)];
    delete monthData[meijiaTeamKey(day)];
    delete monthData[luBanUntilKey(day)];
    delete monthData[impotenceKey(day)];
    for (const quotaId of Object.values(QUOTA)) {
        delete monthData[jobSkillQuotaBonusKey(day, quotaId)];
    }
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
    spectralCurseUsedKey,
    vengeanceUsedKey,
    dreamUsedKey,
    reviveLotteryUsedKey,
    blessUsedKey,
    cleanseBlessUsedKey,
    jobSkillUsedKey,
    patrolBuffKey,
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

export function getTogetherUsedCount(monthData, day) {
    return readDailyUsed(monthData, day, togetherUsedKey);
}

export function getTogetherQuotaLeft(monthData, day) {
    return Math.max(0, getProfessionQuotaLimit(monthData, day, QUOTA.together) - getTogetherUsedCount(monthData, day));
}

export function hasUsedTogether(monthData, day) {
    const limit = getProfessionQuotaLimit(monthData, day, QUOTA.together);
    if (limit <= 0) return true;
    return getTogetherUsedCount(monthData, day) >= limit;
}

export function getImperialUsedCount(monthData, day) {
    return readDailyUsed(monthData, day, imperialUsedKey);
}

export function getImperialQuotaLeft(monthData, day) {
    return Math.max(0, getProfessionQuotaLimit(monthData, day, QUOTA.imperial) - getImperialUsedCount(monthData, day));
}

export function hasUsedImperial(monthData, day) {
    return getImperialUsedCount(monthData, day) >= getProfessionQuotaLimit(monthData, day, QUOTA.imperial);
}

export function getArenaUsedCount(monthData, day) {
    return readDailyUsed(monthData, day, arenaUsedKey);
}

export function getArenaQuotaLeft(monthData, day) {
    return Math.max(0, getProfessionQuotaLimit(monthData, day, QUOTA.arena) - getArenaUsedCount(monthData, day));
}

export function hasUsedArena(monthData, day) {
    return getArenaUsedCount(monthData, day) >= getProfessionQuotaLimit(monthData, day, QUOTA.arena);
}

function consumeDailyQuota(monthData, day, keyFn, limit) {
    const key = keyFn(day);
    const used = readDailyUsed(monthData, day, keyFn);
    if (used >= limit) return null;
    monthData[key] = used + 1;
    return { used: used + 1, left: Math.max(0, limit - used - 1) };
}

/** 回退已消耗的每日次数键（mark 失败回滚用） */
function refundDailyQuota(monthData, day, keyFn) {
    if (!monthData) return false;
    const key = keyFn(day);
    const used = readDailyUsed(monthData, day, keyFn);
    if (used <= 0) return false;
    if (used <= 1) delete monthData[key];
    else monthData[key] = used - 1;
    return true;
}

export function refundImperialUsed(deerData, userId, date, day) {
    const monthData = ensureMonthData(deerData, userId, date);
    return refundDailyQuota(monthData, day, imperialUsedKey);
}

function refundArenaUsed(deerData, userId, date, day) {
    const monthData = ensureMonthData(deerData, userId, date);
    return refundDailyQuota(monthData, day, arenaUsedKey);
}

/** 原始次数（含负数；鹿死返回 null） */
export function getRawDayCount(raw) {
    const entry = normalizeDayEntry(raw);
    if (!entry || entry.d) return null;
    return entry.c;
}

export function adjustDayCount(entry, delta) {
    if (entry?.d) return entry.snap ?? 0;
    entry.c = (entry.c ?? 0) + delta;
    return entry.c;
}

export function sumMonthNet(monthData, { upToDay = 31 } = {}) {
    if (!monthData) return { sum: 0, hasActivity: false };
    let sum = 0;
    let hasActivity = false;
    for (const [k, v] of Object.entries(monthData)) {
        if (!isDayKey(k)) continue;
        const day = parseInt(k, 10);
        if (day > upToDay) continue;
        const entry = normalizeDayEntry(v);
        if (!entry) continue;
        if (entry.d) {
            const snap = entry.snap ?? 0;
            if (snap !== 0) hasActivity = true;
            sum += snap;
            continue;
        }
        const c = entry.c ?? 0;
        if (c !== 0) hasActivity = true;
        sum += c;
    }
    return { sum, hasActivity };
}

export function sumYearNet(userRecord, year, date = new Date()) {
    if (!userRecord) return { sum: 0, hasActivity: false };
    const upToMonth = date.getMonth() + 1;
    let sum = 0;
    let hasActivity = false;
    for (const [monthKey, monthData] of Object.entries(getYearMonths(userRecord, year))) {
        const m = parseInt(monthKey.split('-')[1], 10);
        const capDay = m === upToMonth ? date.getDate() : 31;
        const ranked = sumMonthNet(monthData, { upToDay: capDay });
        sum += ranked.sum;
        hasActivity = hasActivity || ranked.hasActivity;
    }
    return { sum, hasActivity };
}

const CHAOS_USED_KEYS = [
    stealUsedKey,
    curseUsedKey,
    sacrificeUsedKey,
    greedUsedKey,
    groupSplashUsedKey,
    bumperUsedKey,
    arenaUsedKey,
    togetherUsedKey,
];

function getPeakDayCountInMonth(monthData, upToDay) {
    let peak = 0;
    let hasActivity = false;
    for (let d = 1; d <= upToDay; d++) {
        const entry = getDayEntry(monthData, d);
        if (!entry) continue;
        const val = getDayRankCount(entry);
        if (val == null || val <= 0) continue;
        if (val > peak) peak = val;
        hasActivity = true;
    }
    return { peak, hasActivity };
}

/** 互害恶趣味：偷咒献祭倒贴溅碰瓷擂台同归等玩法次数合计 */
export function sumChaosActions(monthData, upToDay = 31) {
    if (!monthData) return 0;
    let sum = 0;
    for (let d = 1; d <= upToDay; d++) {
        sum += sumChaosActionsForDay(monthData, d);
    }
    return sum;
}

export function sumChaosActionsForDay(monthData, day) {
    if (!monthData || day < 1) return 0;
    let sum = 0;
    for (const keyFn of CHAOS_USED_KEYS) {
        sum += readDailyUsed(monthData, day, keyFn);
    }
    return sum;
}

/** 单日/月/年最高🦌绩（卷王榜） */
export function getPeakDayCount(userRecord, date = new Date(), scope = 'month') {
    if (!userRecord) return { peak: 0, hasActivity: false };
    if (scope === 'day') {
        const day = date.getDate();
        const entry = getDayEntry(getMonthData(userRecord, date), day);
        const val = getDayRankCount(entry);
        if (val == null || val <= 0) return { peak: 0, hasActivity: false };
        return { peak: val, hasActivity: true };
    }
    if (scope === 'year') {
        const year = date.getFullYear();
        let peak = 0;
        let hasActivity = false;
        for (const [monthKey, monthData] of Object.entries(getYearMonths(userRecord, year))) {
            const m = parseInt(monthKey.split('-')[1], 10);
            const capDay = m === date.getMonth() + 1 ? date.getDate() : 31;
            const p = getPeakDayCountInMonth(monthData, capDay);
            if (p.peak > peak) peak = p.peak;
            hasActivity = hasActivity || p.hasActivity;
        }
        return { peak, hasActivity };
    }
    return getPeakDayCountInMonth(getMonthData(userRecord, date), date.getDate());
}

export function getMonthNetCount(userRecord, date, upToDay = null) {
    const monthData = getMonthData(userRecord, date);
    const cap = upToDay ?? date.getDate();
    return sumMonthNet(monthData, { upToDay: cap }).sum;
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

/** 玩法前：须当日已转职 */
export function rejectIfNoProfession(deerData, userId, date, day) {
    const monthData = getMonthData(getUserRecord(deerData, userId), date);
    if (hasDayProfession(monthData, day)) return null;
    return { ok: false, type: 'profession_required' };
}

function rejectUnlessPlayReady(deerData, userId, date, day) {
    return rejectIfNoProfession(deerData, userId, date, day)
        || rejectIfActorDead(deerData, userId, date, day);
}

function rejectUnlessGhostReady(deerData, userId, date, day) {
    return rejectIfNoProfession(deerData, userId, date, day)
        || rejectUnlessActorDead(deerData, userId, date, day);
}

function applyMedicHelpSynergy(entry, helperProf, result, { skill = false } = {}) {
    if (!helperProf || !entry) return;
    if (skill) {
        if (getActiveCurseStacks(entry) > 0) {
            clearCurse(entry);
            result.medicCleanse = true;
        }
        applyBlessStacks(entry, 1);
        result.medicBless = true;
        return;
    }
    if (helperProf.helpCurseCleanseChance > 0 && getActiveCurseStacks(entry) > 0
        && rollChance(helperProf.helpCurseCleanseChance)) {
        stripOneCurseStack(entry);
        result.medicCleanse = true;
    }
    if (helperProf.helpBlessChance > 0 && rollChance(helperProf.helpBlessChance)) {
        applyBlessStacks(entry, 1);
        result.medicBless = true;
    }
}

/** 死亡生态：操作者须鹿死 */
export function rejectUnlessActorDead(deerData, userId, date, day) {
    if (!isUserDeadToday(deerData, userId, date, day)) {
        return { ok: false, type: 'alive_only' };
    }
    return null;
}

/** 皇城鹿宣战校验（不含标记消耗） */
export function validateImperialStart(deerData, userId, date, day, members) {
    const prof = rejectIfNoProfession(deerData, userId, date, day);
    if (prof) return prof;
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

    const rank = getDayBalancedRankInGroup(deerData, members, date);
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
        const c = getDayRankCount(entry);
        if (c == null || c <= 0) return null;
        return { id: uid, sum: c, dead: !!entry?.d };
    }).filter(Boolean);
    list.sort((a, b) => b.sum - a.sum || a.id.localeCompare(b.id));
    return list;
}

/** 单日综合分上下文（职业安全线 + 互害次数 + 咒福 + 施助日志） */
function resolveBalancedDayContext(monthData, day, entry, opts = {}) {
    const prof = getProfessionMods(monthData, day);
    let helperStats = null;
    if (opts.userId != null && opts.date instanceof Date) {
        const dayDate = new Date(opts.date.getFullYear(), opts.date.getMonth(), day);
        helperStats = peekHelperStats(opts.userId, dayDate);
    }
    return {
        safeLimit: DAILY_SAFE_LIMIT + (prof?.safeBonus || 0),
        chaosActions: sumChaosActionsForDay(monthData, day),
        curse: getCurseInfo(entry),
        bless: getBlessInfo(entry),
        helperStats,
    };
}

/** 综合分 + 分项（鹿况展示） */
export function getDayBalancedDetail(monthData, day, entry, opts = {}) {
    if (!entry) return { score: 0, parts: null, breakdown: '暂无' };
    const ctx = resolveBalancedDayContext(monthData, day, entry, opts);
    const { score, parts } = computeBalancedScore(entry, ctx);
    return { score, parts, breakdown: formatBalancedBreakdown(parts) };
}

/** 日榜综合分排序（鹿王册封用） */
export function getDayBalancedRankInGroup(deerData, members, date = new Date()) {
    const day = date.getDate();
    const list = members.map((id) => {
        const uid = String(id);
        const monthData = getMonthData(getUserRecord(deerData, uid), date);
        const entry = getDayEntry(monthData, day);
        const rankEntry = entryForBalancedRank(entry);
        if (!rankEntry) return null;
        const sum = calcDayBalancedScore(rankEntry, resolveBalancedDayContext(monthData, day, rankEntry, { userId: uid, date }));
        if (sum <= 0) return null;
        return { id: uid, sum, dead: !!entry?.d };
    }).filter(Boolean);
    list.sort((a, b) => b.sum - a.sum || a.id.localeCompare(b.id));
    return list;
}

export function sumMonthBalancedScore(monthData, upToDay = 31, opts = {}) {
    if (!monthData) return { sum: 0, hasActivity: false };
    let sum = 0;
    let hasActivity = false;
    const baseDate = opts.date instanceof Date ? opts.date : null;
    for (let d = 1; d <= upToDay; d++) {
        const entry = getDayEntry(monthData, d);
        const rankEntry = entryForBalancedRank(entry);
        if (!rankEntry) continue;
        const dayOpts = opts.userId != null && baseDate
            ? { userId: opts.userId, date: baseDate }
            : {};
        const s = calcDayBalancedScore(rankEntry, resolveBalancedDayContext(monthData, d, rankEntry, dayOpts));
        if (s > 0) hasActivity = true;
        sum += s;
    }
    return { sum: Math.round(sum * 10) / 10, hasActivity };
}

export function sumYearBalancedScore(userRecord, year, date = new Date(), userId = null) {
    if (!userRecord) return { sum: 0, hasActivity: false };
    const upToMonth = date.getMonth() + 1;
    let sum = 0;
    let hasActivity = false;
    for (const [monthKey, monthData] of Object.entries(userRecord)) {
        if (!/^\d{4}-\d{2}$/.test(monthKey)) continue;
        if (parseInt(monthKey.split('-')[0], 10) !== year) continue;
        const m = parseInt(monthKey.split('-')[1], 10);
        const capDay = m === upToMonth ? date.getDate() : 31;
        const monthDate = new Date(year, m - 1, 1);
        const ranked = sumMonthBalancedScore(monthData, capDay, { userId, date: monthDate });
        sum += ranked.sum;
        hasActivity = hasActivity || ranked.hasActivity;
    }
    return { sum: Math.round(sum * 10) / 10, hasActivity };
}

export function sumMonthActiveAttempts(monthData, upToDay = 31) {
    if (!monthData) return 0;
    let sum = 0;
    for (let d = 1; d <= upToDay; d++) {
        const entry = getDayEntry(monthData, d);
        if (!entry) continue;
        sum += entry.a || 0;
    }
    return sum;
}

/** 群鹿溅目标：综合日榜 Top N（排除施术者，与鹿王同算法；鹿死者不可被溅） */
export function pickSplashTargetsFromDayRank(deerData, members, casterId, date, topN = GROUP_SPLASH_TOP_N) {
    return getDayBalancedRankInGroup(deerData, members, date)
        .filter((r) => String(r.id) !== String(casterId) && !r.dead)
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

export function getActiveBlessStacks(entry) {
    if (!entry?.ble || !entry?.bleR) return 0;
    return entry.ble;
}

export function getBlessInfo(entry) {
    const stacks = getActiveBlessStacks(entry);
    const rounds = stacks > 0 ? (entry.bleR || 0) : 0;
    const active = stacks > 0 && rounds > 0;
    return {
        stacks,
        rounds,
        active,
        deathReduce: active ? BLESS_DEATH_REDUCE * stacks : 0,
    };
}

export function applyBlessStacks(entry, layers = 1) {
    entry.ble = Math.min(BLESS_MAX_STACKS, (entry.ble || 0) + layers);
    entry.bleR = BLESS_MAX_ROUNDS;
    return entry.ble;
}

export function clearBless(entry) {
    entry.ble = 0;
    entry.bleR = 0;
}

export function consumeBlessRound(entry) {
    if (!entry?.ble || !entry?.bleR) return getBlessInfo(entry);
    entry.bleR -= 1;
    if (entry.bleR <= 0) clearBless(entry);
    return getBlessInfo(entry);
}

function clampDeathChance(v) {
    return Math.min(1, Math.max(0, v));
}

function resolvePlayModifiers(entry, weatherEffects = null, professionMods = null) {
    const curse = getCurseInfo(entry);
    const bless = getBlessInfo(entry);
    const wx = scaleWeatherForProfession(weatherEffects || {}, professionMods);
    const prof = professionMods || {};
    return {
        curse,
        bless,
        wx,
        prof,
        safeLimit: Math.max(1, DAILY_SAFE_LIMIT + (wx.safeBonus || 0) + (prof.safeBonus || 0)),
        deathDelta: (wx.deathDelta || 0) + (prof.deathDelta || 0) - (bless.deathReduce || 0) + (curse.deathBonus || 0),
        stealDelta: (wx.stealDelta || 0) + (prof.stealDelta || 0),
        helpFailDelta: (wx.helpFailDelta || 0) + (prof.helpFailDelta || 0),
        lotteryLuckDelta: (wx.lotteryLuckDelta || 0) + (prof.lotteryLuckDelta || 0),
        overlimitStepReduce: prof.overlimitStepReduce || 0,
        overlimitDeathCap: prof.overlimitDeathCap ?? null,
    };
}

function applyOverlimitDeathCap(deathChance, profMods) {
    const cap = profMods?.overlimitDeathCap;
    if (cap == null) return deathChance;
    return Math.min(deathChance, cap);
}

/** 自🦌超限区：当前 entry 状态下再🦌一次的鹿死概率（含天象/职业/咒福） */
function computeSelfLuDeathChance(entry, weatherEffects = null, professionMods = null) {
    const mods = resolvePlayModifiers(entry, weatherEffects, professionMods);
    const { safeLimit, overlimitStepReduce, deathDelta } = mods;
    if ((entry?.c ?? 0) < safeLimit) return 0;
    return applyOverlimitDeathCap(
        clampDeathChance(
            calcOverlimitDeathChance(entry.c, safeLimit, overlimitStepReduce) + deathDelta,
        ),
        professionMods,
    );
}

function wxOf(gameContext) {
    return gameContext?.weatherEffects || {};
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
    const limit = getHelpQuotaLimit(helperMonthData, day);
    const q = getHelperQuota(helperMonthData, day);
    q.used += 1;
    const t = String(targetId);
    q.to[t] = (q.to[t] || 0) + 1;
    return {
        helpQuotaUsed: q.used,
        helpQuotaLeft: Math.max(0, limit - q.used),
        helpQuotaMax: limit,
    };
}

function refundHelperQuota(helperMonthData, day, targetId) {
    const limit = getHelpQuotaLimit(helperMonthData, day);
    const q = getHelperQuota(helperMonthData, day);
    if (q.used <= 0) {
        return {
            helpQuotaUsed: q.used,
            helpQuotaLeft: Math.max(0, limit - q.used),
            helpQuotaMax: limit,
        };
    }
    q.used -= 1;
    const t = String(targetId);
    if (q.to[t]) {
        q.to[t] -= 1;
        if (q.to[t] <= 0) delete q.to[t];
    }
    return {
        helpQuotaUsed: q.used,
        helpQuotaLeft: Math.max(0, limit - q.used),
        helpQuotaMax: limit,
    };
}

function refundHelperWithdrawQuota(helperMonthData, day, targetId) {
    const limit = getHelpWithdrawQuotaLimit(helperMonthData, day);
    const q = getHelperWithdrawQuota(helperMonthData, day);
    if (q.used <= 0) {
        return {
            helpWithdrawUsed: q.used,
            helpWithdrawLeft: Math.max(0, limit - q.used),
            helpWithdrawMax: limit,
        };
    }
    q.used -= 1;
    const t = String(targetId);
    if (q.to[t]) {
        q.to[t] -= 1;
        if (q.to[t] <= 0) delete q.to[t];
    }
    return {
        helpWithdrawUsed: q.used,
        helpWithdrawLeft: Math.max(0, limit - q.used),
        helpWithdrawMax: limit,
    };
}

function refundPlayQuotaUsed(monthData, day, usedKey) {
    const used = readDailyUsed(monthData, day, usedKey);
    if (used <= 0) return false;
    monthData[usedKey(day)] = used - 1;
    return true;
}

function grinderRushShieldKey(day) {
    return `${META_PREFIX.GRINDER_RUSH_SHIELD}${day}`;
}

function setGrinderRushShield(monthData, day) {
    monthData[grinderRushShieldKey(day)] = GRINDER_RUSH_DEATH_MULT;
}

function consumeGrinderRushShield(monthData, day) {
    const mult = monthData?.[grinderRushShieldKey(day)];
    if (mult) delete monthData[grinderRushShieldKey(day)];
    return typeof mult === 'number' ? mult : 1;
}

function attachQuota(result, quota) {
    return { ...result, ...quota };
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

export function sumMonthData(monthData, upToDay = 31) {
    return sumMonthNet(monthData, { upToDay }).sum;
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
    const { sum: total } = sumMonthNet(monthData, { upToDay });
    let maxDay = 0;
    let maxCount = 0;
    let activeDays = 0;
    let deathDays = 0;
    for (const [k, v] of Object.entries(monthData)) {
        if (!isDayKey(k)) continue;
        const day = parseInt(k, 10);
        if (day > upToDay) continue;
        if (isDayDead(v)) {
            deathDays++;
            continue;
        }
        const c = getRawDayCount(v);
        if (c === null) continue;
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
    const upToMonth = now.getMonth() + 1;
    const { sum: total } = sumYearNet(userRecord, year, now);
    let activeDays = 0;
    let maxMonth = 0;
    let maxMonthCount = 0;
    let deathDays = 0;
    for (const [monthKey, monthData] of Object.entries(months)) {
        const m = parseInt(monthKey.split('-')[1], 10);
        const capDay = m === upToMonth ? now.getDate() : 31;
        const monthTotal = sumMonthNet(monthData, { upToDay: capDay }).sum;
        const ms = calcMonthStats(monthData, capDay);
        activeDays += ms.activeDays;
        deathDays += ms.deathDays;
        if (monthTotal > maxMonthCount) {
            maxMonthCount = monthTotal;
            maxMonth = m;
        }
    }

    return { total, activeDays, maxMonth, maxMonthCount, deathDays };
}

/** 今日状态摘要 */
export function getTodayStatus(monthData, day, { weather = null, weatherEffects = null } = {}) {
    const entry = getDayEntry(monthData, day) || createDayEntry(0);
    const dead = !!entry.d;
    const chosen = hasDayProfession(monthData, day);
    const profession = chosen ? getProfessionMods(monthData, day) : null;
    if (!chosen) {
        return {
            entry,
            count: dead ? 0 : entry.c,
            dead,
            professionRequired: true,
            professionName: '未转职',
            professionEmoji: '🎭',
            professionTagline: '请先转职再使用玩法',
            professionLocked: false,
            helpQuotaMax: 0,
            helpWithdrawQuotaMax: 0,
            helperHelpUsed: 0,
            helperHelpLeft: 0,
            helperWithdrawUsed: 0,
            helperWithdrawLeft: 0,
            canLu: false,
            canHelp: false,
            attempts: entry.a,
            safeLimit: DAILY_SAFE_LIMIT,
            safeLeft: 0,
            inRiskZone: false,
            inWithdrawalZone: !dead && entry.c < 0,
            weather,
        };
    }
    const mods = resolvePlayModifiers(entry, weatherEffects, profession);
    const safeLimit = mods.safeLimit;
    const count = dead ? 0 : entry.c;
    const inWithdrawalZone = !dead && count < 0;
    const safeLeft = dead || inWithdrawalZone ? 0 : Math.max(0, safeLimit - count);
    const recoveryNeeded = inWithdrawalZone ? safeLimit - count : 0;
    const inRiskZone = !dead && count >= safeLimit;
    const monthNet = sumMonthNet(monthData, { upToDay: day }).sum;
    const nextDeathChance = dead ? 0 : computeSelfLuDeathChance(entry, weatherEffects, profession);
    const bi = getBlessInfo(entry);
    const balanced = getDayBalancedDetail(monthData, day, entry);
    const pq = getPlayQuotaSnapshot(monthData, day);
    const p = pq.play || {};
    return {
        entry,
        count,
        inWithdrawalZone,
        recoveryNeeded,
        monthNet,
        lostCount: dead ? (entry.snap ?? 0) : 0,
        attempts: entry.a,
        dead,
        safeLeft: dead ? 0 : safeLeft,
        safeLimit,
        inRiskZone,
        nextDeathChance,
        riskPercent: formatChancePercent(nextDeathChance),
        deathChanceStep: Math.round(OVERLIMIT_DEATH_CHANCE_STEP * 100),
        helpKillPercent: Math.round((HELP_FAIL_CHANCE + mods.helpFailDelta) * 100),
        helpWithdrawFailPercent: Math.round(
            (HELP_WITHDRAW_FAIL_CHANCE
                + (weatherEffects?.helpWithdrawFailDelta || 0)
                + (profession.helpWithdrawFailDelta || 0)) * 100,
        ),
        canLu: !dead,
        canHelp: !dead,
        deathReason: dead ? (entry.dr || DEATH_REASON.SELF) : '',
        deathReasonText: dead ? getDeathReasonText(entry.dr || DEATH_REASON.SELF) : '',
        killerId: dead ? (entry.dk || '') : '',
        professionId: profession.id,
        professionName: profession.name,
        professionEmoji: profession.emoji,
        professionTagline: profession.tagline,
        professionLocked: true,
        professionRequired: false,
        helpQuotaMax: getHelpQuotaLimit(monthData, day),
        helpWithdrawQuotaMax: getHelpWithdrawQuotaLimit(monthData, day),
        helperHelpUsed: getHelperQuota(monthData, day).used,
        helperHelpLeft: getHelperQuotaLeft(monthData, day),
        helperWithdrawUsed: getHelperWithdrawQuota(monthData, day).used,
        helperWithdrawLeft: getHelperWithdrawQuotaLeft(monthData, day),
        togetherUsed: p.together?.used ?? 0,
        togetherMax: p.together?.max ?? 0,
        togetherLeft: p.together?.left ?? 0,
        imperialUsed: p.imperial?.used ?? 0,
        imperialMax: p.imperial?.max ?? 0,
        imperialLeft: p.imperial?.left ?? 0,
        arenaUsed: p.arena?.used ?? 0,
        arenaMax: p.arena?.max ?? 0,
        arenaLeft: p.arena?.left ?? 0,
        stealUsed: p.steal?.used ?? 0,
        stealMax: p.steal?.max ?? 0,
        curseUsed: p.curse?.used ?? 0,
        curseMax: p.curse?.max ?? 0,
        blessUsed: p.bless?.used ?? 0,
        blessMax: p.bless?.max ?? 0,
        sacrificeUsed: p.sacrifice?.used ?? 0,
        sacrificeMax: p.sacrifice?.max ?? 0,
        fakeWithdrawUsed: p.fakeWithdraw?.used ?? 0,
        fakeWithdrawMax: p.fakeWithdraw?.max ?? 0,
        urgeUsed: p.urge?.used ?? 0,
        urgeMax: p.urge?.max ?? 0,
        howlUsed: p.howl?.used ?? 0,
        howlMax: p.howl?.max ?? 0,
        greedUsed: p.greed?.used ?? 0,
        greedMax: p.greed?.max ?? 0,
        groupSplashUsed: p.groupSplash?.used ?? 0,
        groupSplashMax: p.groupSplash?.max ?? 0,
        cleanseUsed: p.cleanseCurse?.used ?? 0,
        cleanseMax: p.cleanseCurse?.max ?? 0,
        cleanseBlessUsed: p.cleanseBless?.used ?? 0,
        cleanseBlessMax: p.cleanseBless?.max ?? 0,
        borrowUsed: p.borrow?.used ?? 0,
        borrowMax: p.borrow?.max ?? 0,
        bumperUsed: p.bumper?.used ?? 0,
        bumperMax: p.bumper?.max ?? 0,
        lotteryUsed: p.lottery?.used ?? 0,
        lotteryMax: p.lottery?.max ?? 0,
        spectralCurseUsed: p.spectralCurse?.used ?? 0,
        spectralCurseMax: p.spectralCurse?.max ?? 0,
        vengeanceUsed: p.vengeance?.used ?? 0,
        vengeanceMax: p.vengeance?.max ?? 0,
        dreamUsed: p.dream?.used ?? 0,
        dreamMax: p.dream?.max ?? 0,
        reviveLotteryUsed: p.reviveLottery?.used ?? 0,
        reviveLotteryMax: p.reviveLottery?.max ?? 0,
        playQuotaSummary: pq.summary || '',
        weather,
        weatherEffects: weatherEffects || null,
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
        ...(() => ({
            blessed: bi.active,
            blessStacks: bi.stacks,
            blessRounds: bi.rounds,
            blessReducePct: Math.round(bi.deathReduce * 100),
        }))(),
        urgeBuff: getUrgeBuffStacks(monthData, day),
        ...(() => {
            const js = getJobSkillSnapshot(monthData, day);
            return {
                jobSkillUsed: js.used,
                jobSkillCanUse: js.canUse && !dead,
                jobSkillName: js.skill?.name || '',
                jobSkillCmd: js.skill?.cmd || '',
                jobSkillDesc: js.skill?.desc || '',
                patrolBuffPending: js.patrolPending,
            };
        })(),
        canUseSpecial: !dead,
        canUseDeathEcology: dead,
        canHelpOthers: !dead,
        canTogether: !dead && (p.together?.left ?? 0) > 0,
        canImperial: !dead && (p.imperial?.left ?? 0) > 0,
        canArena: !dead && (p.arena?.left ?? 0) > 0,
        balancedScore: balanced.score,
        balancedBreakdown: balanced.breakdown,
        balancedParts: balanced.parts,
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

function rollHelpFail(extra = 0) {
    return rollChance(clampDeathChance(HELP_FAIL_CHANCE + extra));
}

function rollHelpWithdrawFail(extra = 0) {
    return rollChance(clampDeathChance(HELP_WITHDRAW_FAIL_CHANCE + extra));
}

function resolvePlayDef(id) {
    return isExtraDeerId(id) ? buildExtraDeerMods(getExtraDeerDef(id)) : getProfessionDef(id);
}

function mergeDeerCartDeathResult(result, cart) {
    if (!cart) return;
    if (cart.dissolved) {
        result.deerCartEnded = cart;
        delete result.deerCartAwaitHelp;
    } else {
        result.deerCartAwaitHelp = cart;
    }
}

/** 连鹿为同步批次；Redis 里残留的 _dc_/_dcr_ 在邀请/手动玩法前清掉 */
function reconcileStaleDeerCart(deerData, userId, date, day) {
    const monthData = getMonthData(getUserRecord(deerData, userId), date);
    if (!monthData || !isInDeerCart(monthData, day)) return;
    const partnerId = getDeerCartPartnerId(monthData, day);
    const partnerMonth = partnerId
        ? getMonthData(getUserRecord(deerData, partnerId), date)
        : null;
    clearDeerCartPair(monthData, partnerMonth, day);
}

function applyDeerCartOnDriverDeath(deerData, driverId, date, day, result) {
    mergeDeerCartDeathResult(result, resolveDeerCartOnDriverDeath(deerData, driverId, date, day, {
        getUserRecord,
        getMonthData,
        ensureMonthData,
        getHelperQuotaLeft,
    }));
    return result;
}

function resolvePlayDeathEffects(deerData, deadUserId, date, day, result, killerId = null) {
    const team = resolveMeijiaTeamOnDeath(deerData, deadUserId, date, day, {
        getUserRecord,
        getMonthData,
        ensureMonthData,
        ensureDayEntry,
        applyDeathFn: applyDeath,
        killerId,
    });
    if (team) {
        if (team.partnerSnap != null) {
            result.meijiaTeamWipe = team;
            applyDeerCartOnDriverDeath(deerData, team.partnerId, date, day, result);
        } else if (team.dissolved) {
            result.meijiaTeamDissolved = team;
        }
    }
    applyDeerCartOnDriverDeath(deerData, deadUserId, date, day, result);
    const deadMonth = getMonthData(getUserRecord(deerData, deadUserId), date);
    if (deadMonth) clearLuBan(deadMonth, day);
    return result;
}

function finalizeLuResult(deerData, userId, date, day, result) {
    if (!result?.ok) return result;
    if (String(result.type || '').startsWith('death')) {
        return resolvePlayDeathEffects(deerData, userId, date, day, result);
    }
    const teamLu = syncMeijiaTeamLu(deerData, userId, date, day, {
        getUserRecord,
        ensureMonthData,
        ensureDayEntry,
        getMonthData,
        preLuCount: result.preLuCount,
    });
    if (teamLu) result.meijiaTeamLu = teamLu;
    return result;
}

/**
 * 自己🦌
 * @param {object} [gameContext] weatherEffects 等
 */
export function performLu(deerData, userId, date, day, gameContext = {}, opts = {}) {
    const blocked = rejectUnlessPlayReady(deerData, userId, date, day);
    if (blocked) return blocked;
    const monthData = ensureMonthData(deerData, userId, date);
    const inLuSession = !!(opts.cartSession || opts.soloSession);
    if (!inLuSession) {
        reconcileStaleDeerCart(deerData, userId, date, day);
    }
    const cartBlock = rejectIfCartHelperLu(monthData, day);
    if (cartBlock) return cartBlock;
    if (!inLuSession) {
        const cartDriverBlock = rejectIfCartDriverLu(monthData, day);
        if (cartDriverBlock) return cartDriverBlock;
    }
    const teamBlock = rejectIfMeijiaTeamPartnerLu(deerData, userId, date, day, {
        getUserRecord,
        getMonthData,
    });
    if (teamBlock) return teamBlock;
    const luBan = rejectIfLuBanned(monthData, day);
    if (luBan) return luBan;
    const entry = ensureDayEntry(monthData, day);
    if (entry.d) {
        return { ok: false, type: 'dead', entry, snap: entry.snap, lostCount: entry.snap };
    }

    entry.a += 1;
    const profMods = getProfessionMods(monthData, day);
    const { wx, patrolConsumed } = weatherForAction(gameContext, monthData, day);
    const mods = resolvePlayModifiers(entry, wx, profMods);
    const curseBefore = mods.curse;
    const blessBefore = mods.bless;
    const hadActiveCurse = curseBefore.active;
    const hadActiveBless = blessBefore.active;
    const hadUrgeBuff = getUrgeBuffStacks(monthData, day) > 0;
    const safeLimit = mods.safeLimit;
    let urgeBonus = 0;
    let grinderBonus = 0;
    if (entry.c < safeLimit) {
        const preLuCount = entry.c;
        entry.c += 1;
        if (profMods?.safeLuDoubleChance && rollChance(profMods.safeLuDoubleChance)) {
            entry.c += 1;
            grinderBonus = 1;
        }
        if (hadUrgeBuff) {
            urgeBonus = consumeUrgeBuffOnLu(monthData, day, entry);
            urgeBonus = applyUrgeProfessionConsumeBonus(entry, profMods, urgeBonus);
        }
        if (hadActiveCurse) consumeCurseRound(entry);
        if (hadActiveBless) consumeBlessRound(entry);
        const curseAfter = getCurseInfo(entry);
        const blessAfter = getBlessInfo(entry);
        return finalizeLuResult(deerData, userId, date, day, {
            ok: true,
            type: urgeBonus ? 'safe_urged' : (grinderBonus ? 'safe_grinder' : 'safe'),
            entry,
            count: entry.c,
            preLuCount,
            safeLeft: entry.c < 0 ? 0 : Math.max(0, safeLimit - entry.c),
            safeLimit,
            urgeBonus,
            grinderBonus,
            hadCurse: hadActiveCurse,
            hadBless: hadActiveBless,
            curseStacks: curseBefore.stacks,
            blessStacks: blessBefore.stacks,
            curseRoundsLeft: curseAfter.rounds,
            blessRoundsLeft: blessAfter.rounds,
            curseBonus: curseBefore.deathBonus,
            blessReduce: blessBefore.deathReduce,
            weatherTip: gameContext.weatherEffects?.tip || '',
            weatherPatrolConsumed: patrolConsumed,
        });
    }

    let deathChance = clampDeathChance(
        calcOverlimitDeathChance(entry.c, safeLimit, mods.overlimitStepReduce) + mods.deathDelta,
    );
    deathChance = applyOverlimitDeathCap(deathChance, profMods);
    const grinderShield = consumeGrinderRushShield(monthData, day);
    if (grinderShield < 1) {
        deathChance = clampDeathChance(deathChance * grinderShield);
    }
    const preLuCount = entry.c;
    if (rollChance(deathChance)) {
        const snap = applyDeath(entry, { reason: DEATH_REASON.SELF });
        if (hadActiveCurse) consumeCurseRound(entry);
        if (hadActiveBless) consumeBlessRound(entry);
        let type = 'death';
        if (hadActiveCurse && hadActiveBless) type = 'death_mixed';
        else if (hadActiveCurse) type = 'death_cursed';
        else if (hadActiveBless) type = 'death_blessed';
        return finalizeLuResult(deerData, userId, date, day, {
            ok: true,
            type,
            entry,
            snap,
            preLuCount,
            deathChance,
            hadCurse: hadActiveCurse,
            hadBless: hadActiveBless,
            curseStacks: curseBefore.stacks,
            blessStacks: blessBefore.stacks,
            curseBonus: curseBefore.deathBonus,
            blessReduce: blessBefore.deathReduce,
            weatherTip: gameContext.weatherEffects?.tip || '',
            weatherPatrolConsumed: patrolConsumed,
        });
    }

    entry.c += 1;
    if (hadUrgeBuff) {
        urgeBonus = consumeUrgeBuffOnLu(monthData, day, entry);
        urgeBonus = applyUrgeProfessionConsumeBonus(entry, profMods, urgeBonus);
    }
    if (hadActiveCurse) consumeCurseRound(entry);
    if (hadActiveBless) consumeBlessRound(entry);
    const curseAfter = getCurseInfo(entry);
    const blessAfter = getBlessInfo(entry);
    let type = urgeBonus ? 'risky_urged' : 'risky';
    if (hadActiveCurse && hadActiveBless) type = urgeBonus ? 'risky_urged_mixed' : 'risky_mixed';
    else if (hadActiveCurse) type = urgeBonus ? 'risky_urged_cursed' : 'risky_cursed';
    else if (hadActiveBless) type = urgeBonus ? 'risky_urged_blessed' : 'risky_blessed';
    return finalizeLuResult(deerData, userId, date, day, {
        ok: true,
        type,
        entry,
        count: entry.c,
        preLuCount,
        urgeBonus,
        deathChance,
        nextDeathChance: computeSelfLuDeathChance(entry, wx, profMods),
        hadCurse: hadActiveCurse,
        hadBless: hadActiveBless,
        curseStacks: curseBefore.stacks,
        blessStacks: blessBefore.stacks,
        curseRoundsLeft: curseAfter.rounds,
        blessRoundsLeft: blessAfter.rounds,
        curseBonus: curseBefore.deathBonus,
        blessReduce: blessBefore.deathReduce,
        weatherTip: gameContext.weatherEffects?.tip || '',
        weatherPatrolConsumed: patrolConsumed,
    });
}

/** 单人连鹿：反复 performLu 直至鹿死或达单趟上限 */
export function runSoloLuSession(deerData, userId, date, day, gameContext = {}) {
    const monthData = ensureMonthData(deerData, userId, date);
    const cartRole = getDeerCartRole(monthData, day);
    if (cartRole === 'helper') {
        return { ok: false, type: 'cart_helper_no_lu' };
    }
    if (cartRole === 'driver') {
        return { ok: false, type: 'cart_driver_no_lu' };
    }

    const results = [];
    for (let i = 0; i < CART_SESSION_MAX_ROUNDS; i++) {
        const entry = ensureDayEntry(ensureMonthData(deerData, userId, date), day);
        if (entry.d) break;

        const luResult = performLu(deerData, userId, date, day, gameContext, { soloSession: true });
        results.push(luResult);
        if (!luResult.ok) {
            return {
                ok: false,
                lu: luResult,
                results,
                count: results.length,
                userId: String(userId),
            };
        }
        if (luResult.entry?.d || String(luResult.type || '').startsWith('death')) break;
    }

    return {
        ok: true,
        results,
        count: results.length,
        userId: String(userId),
        maxRoundsHit: results.length >= CART_SESSION_MAX_ROUNDS
            && !String(results[results.length - 1]?.type || '').startsWith('death'),
    };
}

const CHAIN_PLAY_MAX = 64;

/** 活人配额连玩：须转职、存活；鹿车发车位须等自动连鹿 */
function rejectIfAliveQuotaChainStart(deerData, userId, date, day) {
    const blocked = rejectUnlessPlayReady(deerData, userId, date, day);
    if (blocked) return blocked;
    const monthData = ensureMonthData(deerData, userId, date);
    reconcileStaleDeerCart(deerData, userId, date, day);
    return rejectIfCartDriverLu(monthData, day);
}

/** 亡魂对目标连玩：须转职 + 鹿死 */
function rejectIfGhostTargetChainStart(deerData, ghostId, date, day) {
    return rejectUnlessGhostReady(deerData, ghostId, date, day);
}

function runQuotaChain(runOnce, { stopIf = null, leftKey = null } = {}) {
    const results = [];
    for (let i = 0; i < CHAIN_PLAY_MAX; i++) {
        const r = runOnce();
        if (!r.ok) {
            if (results.length) break;
            return { ok: false, result: r, results, count: 0 };
        }
        results.push(r);
        if (stopIf?.(r)) break;
        if (leftKey != null && (r[leftKey] ?? 0) <= 0) break;
    }
    return { ok: results.length > 0, results, count: results.length };
}

function runAliveTargetChain(deerData, actorId, targetId, date, day, performFn, leftKey, gameContext = {}) {
    const preflight = rejectIfAliveQuotaChainStart(deerData, actorId, date, day);
    if (preflight) return { ok: false, result: preflight, results: [], count: 0 };
    const session = runQuotaChain(
        () => performFn(deerData, actorId, targetId, date, day, gameContext),
        { leftKey },
    );
    return { ...session, userId: String(actorId), targetId: String(targetId) };
}

function runAliveSelfChain(deerData, userId, date, day, performFn, leftKey, gameContext = {}, chainOpts = {}) {
    const preflight = rejectIfAliveQuotaChainStart(deerData, userId, date, day);
    if (preflight) return { ok: false, result: preflight, results: [], count: 0 };
    const session = runQuotaChain(
        () => performFn(deerData, userId, date, day, gameContext),
        { leftKey, ...chainOpts },
    );
    return { ...session, userId: String(userId) };
}

function runGhostTargetChain(deerData, ghostId, targetId, date, day, performFn, leftKey) {
    const preflight = rejectIfGhostTargetChainStart(deerData, ghostId, date, day);
    if (preflight) return { ok: false, result: preflight, results: [], count: 0 };
    const session = runQuotaChain(
        () => performFn(deerData, ghostId, targetId, date, day),
        { leftKey },
    );
    return { ...session, userId: String(ghostId), targetId: String(targetId) };
}

/** 连催鹿：叠催更符至配额用尽（无@自催） */
export function runUrgeChainSession(deerData, userId, targetId, date, day) {
    return runAliveTargetChain(deerData, userId, targetId, date, day, performUrgeDeer, 'urgeLeft');
}

/** 连抽鹿签：耗尽抽签配额 */
export function runLotteryChainSession(deerData, userId, date, day, gameContext = {}) {
    return runAliveSelfChain(deerData, userId, date, day, performDeerLottery, 'lotteryLeft', gameContext);
}

/** 连还阳签：还阳成功或配额用尽 */
export function runReviveLotteryChainSession(deerData, userId, date, day) {
    const preflight = rejectUnlessGhostReady(deerData, userId, date, day);
    if (preflight) return { ok: false, result: preflight, results: [], count: 0 };
    const session = runQuotaChain(
        () => performReviveLottery(deerData, userId, date, day),
        {
            leftKey: 'reviveLotteryLeft',
            stopIf: (r) => r.type === 'revive_lottery_full' || r.type === 'revive_lottery_weak',
        },
    );
    const last = session.results?.[session.results.length - 1];
    const revived = last?.type === 'revive_lottery_full' || last?.type === 'revive_lottery_weak';
    return { ...session, userId: String(userId), revived };
}

/** 连鹿鸣：活人须带咒，逐次吉兆震咒至清；鹿死鸣魂至配额用尽 */
export function runHowlChainSession(deerData, userId, date, day, gameContext = {}) {
    const profBlock = rejectIfNoProfession(deerData, userId, date, day);
    if (profBlock) return { ok: false, result: profBlock, results: [], count: 0 };
    const monthData = ensureMonthData(deerData, userId, date);
    reconcileStaleDeerCart(deerData, userId, date, day);
    const entry = ensureDayEntry(monthData, day);
    const isGhost = !!entry.d;
    if (isGhost) {
        const ghostBlock = rejectUnlessActorDead(deerData, userId, date, day);
        if (ghostBlock) return { ok: false, result: ghostBlock, results: [], count: 0 };
    } else {
        const cartBlock = rejectIfCartDriverLu(monthData, day);
        if (cartBlock) return { ok: false, result: cartBlock, results: [], count: 0 };
        const deadBlock = rejectIfActorDead(deerData, userId, date, day);
        if (deadBlock) return { ok: false, result: deadBlock, results: [], count: 0 };
        if (!getCurseInfo(entry).active) {
            return { ok: false, result: { ok: false, type: 'howl_chain_no_curse' }, results: [], count: 0 };
        }
    }
    const session = runQuotaChain(
        () => performDeerHowl(deerData, userId, date, day, gameContext),
        {
            leftKey: 'howlLeft',
            stopIf: () => {
                if (isGhost) return false;
                const live = ensureDayEntry(ensureMonthData(deerData, userId, date), day);
                return !getCurseInfo(live).active;
            },
        },
    );
    const liveAfter = ensureDayEntry(ensureMonthData(deerData, userId, date), day);
    return {
        ...session,
        userId: String(userId),
        curseCleared: !isGhost && !getCurseInfo(liveAfter).active,
    };
}

/** 连诈戒：耗尽诈戒配额 */
export function runFakeWithdrawChainSession(deerData, userId, date, day) {
    return runAliveSelfChain(deerData, userId, date, day, performFakeWithdrawal, 'fakeWithdrawLeft');
}

/** 连鹿福：叠层/续回合至配额用尽（满层只续 bleR） */
export function runBlessChainSession(deerData, casterId, targetId, date, day) {
    return runAliveTargetChain(deerData, casterId, targetId, date, day, performBlessDeer, 'blessLeft');
}

/** 连鹿咒：叠层/续回合至配额用尽（满层只续 curR） */
export function runCurseChainSession(deerData, casterId, targetId, date, day, gameContext = {}) {
    return runAliveTargetChain(deerData, casterId, targetId, date, day, performCurseDeer, 'curseLeft', gameContext);
}

/** 连冥咒：亡魂叠咒至配额用尽 */
export function runSpectralCurseChainSession(deerData, ghostId, targetId, date, day) {
    return runGhostTargetChain(deerData, ghostId, targetId, date, day, performSpectralCurse, 'spectralCurseLeft');
}

/** 连托梦：亡魂对🦌友托梦至配额用尽 */
export function runDreamChainSession(deerData, ghostId, targetId, date, day) {
    return runGhostTargetChain(deerData, ghostId, targetId, date, day, performDreamDeer, 'dreamLeft');
}

/** 鹿车发车后自动连鹿：发车人 performLu，鹿死则帮鹿位 performHelpLu，直至帮鹿用尽散车（结束必散车） */
export function runDeerCartSession(deerData, driverId, helperId, date, day, gameContext = {}) {
    const rounds = [];
    try {
        for (let i = 0; i < CART_SESSION_MAX_ROUNDS; i++) {
            const driverMonth = ensureMonthData(deerData, driverId, date);
            if (getDeerCartRole(driverMonth, day) !== 'driver') break;

            const driverEntry = ensureDayEntry(driverMonth, day);
            if (driverEntry.d) break;

            const luResult = performLu(deerData, driverId, date, day, gameContext, { cartSession: true });
            const round = { lu: luResult, helps: [] };
            rounds.push(round);
            if (!luResult.ok) {
                return {
                    ok: false,
                    lu: luResult,
                    rounds,
                    roundCount: rounds.length,
                    driverId: String(driverId),
                    helperId: String(helperId),
                };
            }

            let driverAfter = ensureDayEntry(driverMonth, day);
            if (!driverAfter.d) continue;

            const helperMonth = ensureMonthData(deerData, helperId, date);
            if (ensureDayEntry(helperMonth, day).d) break;

            while (getHelperQuotaLeft(helperMonth, day) > 0) {
                driverAfter = ensureDayEntry(ensureMonthData(deerData, driverId, date), day);
                if (!driverAfter.d) break;

                const helpResult = performHelpLu(deerData, helperId, driverId, date, day, gameContext);
                round.helps.push(helpResult);
                if (!helpResult.ok) break;

                driverAfter = ensureDayEntry(ensureMonthData(deerData, driverId, date), day);
                if (!driverAfter.d) break;
            }

            if (ensureDayEntry(ensureMonthData(deerData, driverId, date), day).d) break;
        }

        return {
            ok: true,
            rounds,
            roundCount: rounds.length,
            driverId: String(driverId),
            helperId: String(helperId),
            maxRoundsHit: rounds.length >= CART_SESSION_MAX_ROUNDS,
        };
    } finally {
        const driverMonth = ensureMonthData(deerData, driverId, date);
        const helperMonth = ensureMonthData(deerData, helperId, date);
        if (isInDeerCart(driverMonth, day) || isInDeerCart(helperMonth, day)) {
            clearDeerCartPair(driverMonth, helperMonth, day);
        }
    }
}

/** 当日转职（首次选定后锁定至次日 0 点；鹿死亦可转职以启用冥界玩法） */
export function performSetProfession(deerData, userId, professionToken, date, day) {
    const id = resolveProfessionId(professionToken) || resolveExtraDeerId(professionToken);
    if (!id) {
        return { ok: false, type: 'profession_unknown', token: professionToken };
    }
    const monthData = ensureMonthData(deerData, userId, date);
    const locked = hasDayProfession(monthData, day);
    const currentId = locked ? getDayProfessionId(monthData, day) : null;
    const next = resolvePlayDef(id);
    if (locked && id !== currentId) {
        const current = resolvePlayDef(currentId);
        return { ok: false, type: 'profession_locked', profession: current };
    }
    if (!locked) {
        setDayProfession(monthData, day, id);
        return {
            ok: true,
            type: 'profession_set',
            profession: next,
            changed: true,
            quota: getHelperQuotaSnapshot(monthData, day),
        };
    }
    return {
        ok: true,
        type: 'profession_same',
        profession: next,
        changed: false,
        quota: getHelperQuotaSnapshot(monthData, day),
    };
}

/** 查询今日职业专属技状态 */
export function performJobSkillInfo(deerData, userId, date, day) {
    const monthData = ensureMonthData(deerData, userId, date);
    const snap = getJobSkillSnapshot(monthData, day);
    const entry = getDayEntry(monthData, day);
    const balanced = entry && !entry.d
        ? getDayBalancedDetail(monthData, day, entry)
        : { score: 0, breakdown: '暂无' };
    return {
        ok: true,
        type: 'job_skill_info',
        ...snap,
        balancedScore: balanced.score,
        balancedBreakdown: balanced.breakdown,
    };
}

/** 巡游鹿专属：鹿巡 — 下一次玩法消费天象正向 ×1.35 */
export function performRangerPatrol(deerData, userId, date, day) {
    const blocked = rejectUnlessPlayReady(deerData, userId, date, day);
    if (blocked) return blocked;
    const wrong = rejectIfWrongProfession(deerData, userId, date, day, 'ranger');
    if (wrong) return wrong;
    const monthData = ensureMonthData(deerData, userId, date);
    if (hasUsedJobSkill(monthData, day)) {
        return { ok: false, type: 'job_skill_used' };
    }
    if (hasPatrolBuff(monthData, day)) {
        return { ok: false, type: 'patrol_buff_pending' };
    }
    markJobSkillUsed(monthData, day);
    setPatrolBuff(monthData, day);
    setPatrolLotteryLuck(monthData, day);
    grantJobSkillQuotaBonus(monthData, day, QUOTA.lottery, RANGER_SKILL_LOTTERY_BONUS);
    return {
        ok: true,
        type: 'job_skill_patrol',
        amp: PATROL_WEATHER_AMP,
        lotteryQuotaBonus: RANGER_SKILL_LOTTERY_BONUS,
        lotteryLuckBonus: RANGER_SKILL_LOTTERY_LUCK,
    };
}

/** 卷王鹿专属：卷王冲 — 强制安全自🦌 +2 */
export function performGrinderRush(deerData, userId, date, day, gameContext = {}) {
    const blocked = rejectUnlessPlayReady(deerData, userId, date, day);
    if (blocked) return blocked;
    const wrong = rejectIfWrongProfession(deerData, userId, date, day, 'grinder');
    if (wrong) return wrong;
    const monthData = ensureMonthData(deerData, userId, date);
    if (hasUsedJobSkill(monthData, day)) {
        return { ok: false, type: 'job_skill_used' };
    }
    const entry = ensureDayEntry(monthData, day);
    if (entry.d) {
        return { ok: false, type: 'dead', entry, snap: entry.snap, lostCount: entry.snap };
    }
    markJobSkillUsed(monthData, day);
    const profMods = getProfessionMods(monthData, day);
    const { wx, patrolConsumed } = weatherForAction(gameContext, monthData, day);
    const mods = resolvePlayModifiers(entry, wx, profMods);
    const curseBefore = mods.curse;
    const blessBefore = mods.bless;
    const hadActiveCurse = curseBefore.active;
    const hadActiveBless = blessBefore.active;
    entry.a += GRINDER_SKILL_LU_GAIN;
    entry.c += GRINDER_SKILL_LU_GAIN;
    if (hadActiveCurse) consumeCurseRound(entry);
    if (hadActiveBless) consumeBlessRound(entry);
    setGrinderRushShield(monthData, day);
    grantJobSkillQuotaBonus(monthData, day, QUOTA.arena, GRINDER_SKILL_ARENA_BONUS);
    return {
        ok: true,
        type: 'job_skill_grinder_rush',
        entry,
        count: entry.c,
        gain: GRINDER_SKILL_LU_GAIN,
        safeLimit: mods.safeLimit,
        arenaQuotaBonus: GRINDER_SKILL_ARENA_BONUS,
        rushShieldMult: GRINDER_RUSH_DEATH_MULT,
        weatherTip: gameContext.weatherEffects?.tip || '',
        weatherPatrolConsumed: patrolConsumed,
    };
}

/** 鹿医师专属：愈鹿 — 不占帮鹿配额、零失手帮 +1 或救活 */
export function performMedicHealSkill(deerData, helperId, targetId, date, day, gameContext = {}) {
    const blocked = rejectUnlessPlayReady(deerData, helperId, date, day);
    if (blocked) return blocked;
    const wrong = rejectIfWrongProfession(deerData, helperId, date, day, 'medic');
    if (wrong) return wrong;
    const helperMonth = ensureMonthData(deerData, helperId, date);
    if (hasUsedJobSkill(helperMonth, day)) {
        return { ok: false, type: 'job_skill_used' };
    }
    const helperProf = getProfessionMods(helperMonth, day);
    const { wx, patrolConsumed } = weatherForAction(gameContext, helperMonth, day);
    const targetMonth = ensureMonthData(deerData, targetId, date);
    const entry = ensureDayEntry(targetMonth, day);
    const targetMods = resolvePlayModifiers(entry, wx);
    const helpKey = String(helperId);
    markJobSkillUsed(helperMonth, day);
    helperMonth[helpQuotaBonusKey(day)] = (helperMonth[helpQuotaBonusKey(day)] || 0) + MEDIC_SKILL_HELP_QUOTA_BONUS;
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
        result = {
            ok: true,
            type: 'job_skill_medic_revive',
            entry,
            count: entry.c,
            safeLimit: targetMods.safeLimit,
            weatherPatrolConsumed: patrolConsumed,
        };
    } else {
        if (!entry.helpBy) entry.helpBy = {};
        entry.helpBy[helpKey] = (entry.helpBy[helpKey] || 0) + 1;
        entry.a += 1;
        entry.c += 1;
        entry.helped += 1;
        if (getCurseInfo(entry).active) {
            entry.curR = Math.max(0, (entry.curR || 0) - 1);
            if (entry.curR <= 0) clearCurse(entry);
        }
        result = {
            ok: true,
            type: 'job_skill_medic_help',
            entry,
            count: entry.c,
            safeLimit: targetMods.safeLimit,
            weatherPatrolConsumed: patrolConsumed,
        };
    }
    applyMedicHelpSynergy(entry, helperProf, result, { skill: true });
    result.skillHelpQuotaBonus = MEDIC_SKILL_HELP_QUOTA_BONUS;
    recordHelpAction('help_lu', helperId, targetId, date, {
        revive: result.type === 'job_skill_medic_revive',
        skill: true,
    });
    return result;
}

/** 戒灵师专属：清规 — 不占帮戒配额、零失手 -2 */
export function performAsceticCleanseSkill(deerData, helperId, targetId, date, day) {
    const blocked = rejectUnlessPlayReady(deerData, helperId, date, day);
    if (blocked) return blocked;
    const wrong = rejectIfWrongProfession(deerData, helperId, date, day, 'ascetic');
    if (wrong) return wrong;
    const helperMonth = ensureMonthData(deerData, helperId, date);
    if (hasUsedJobSkill(helperMonth, day)) {
        return { ok: false, type: 'job_skill_used' };
    }
    const targetMonth = ensureMonthData(deerData, targetId, date);
    const entry = ensureDayEntry(targetMonth, day);
    if (entry.d) {
        return { ok: false, type: 'target_dead' };
    }
    markJobSkillUsed(helperMonth, day);
    entry.a += 1;
    adjustDayCount(entry, -ASCETIC_SKILL_WITHDRAW);
    grantJobSkillQuotaBonus(helperMonth, day, QUOTA.helpWithdraw, 1);
    recordHelpAction('help_withdraw', helperId, targetId, date, { withdrawSkill: true });
    return {
        ok: true,
        type: 'job_skill_ascetic_cleanse',
        entry,
        count: entry.c,
        withdrawAmount: ASCETIC_SKILL_WITHDRAW,
        helpWithdrawQuotaBonus: 1,
    };
}

/** 叠咒鹿专属：咒缚 — 不占鹿咒配额、叠 1 层咒 */
export function performCurserBindSkill(deerData, userId, targetId, date, day) {
    const blocked = rejectUnlessPlayReady(deerData, userId, date, day);
    if (blocked) return blocked;
    const wrong = rejectIfWrongProfession(deerData, userId, date, day, 'curser');
    if (wrong) return wrong;
    const monthData = ensureMonthData(deerData, userId, date);
    if (hasUsedJobSkill(monthData, day)) {
        return { ok: false, type: 'job_skill_used' };
    }
    const targetMonth = ensureMonthData(deerData, targetId, date);
    const entry = ensureDayEntry(targetMonth, day);
    if (entry.d) return { ok: false, type: 'target_dead' };
    markJobSkillUsed(monthData, day);
    entry.a += 1;
    const stacksBefore = getActiveCurseStacks(entry);
    let stacks;
    if (stacksBefore >= CURSE_MAX_STACKS) {
        entry.curR = CURSE_MAX_ROUNDS;
        stacks = stacksBefore;
    } else {
        stacks = applyCurseStacks(entry, CURSER_SKILL_CURSE_LAYERS);
        if (stacksBefore > 0 && stacks <= stacksBefore) {
            entry.curR = CURSE_MAX_ROUNDS;
        }
    }
    grantJobSkillQuotaBonus(monthData, day, QUOTA.curse, 1);
    return {
        ok: true,
        type: 'job_skill_curser_bind',
        entry,
        count: entry.c,
        curseStacks: stacks,
        curseRefreshed: stacksBefore >= CURSE_MAX_STACKS || (stacksBefore > 0 && stacks <= stacksBefore),
        curseQuotaBonus: 1,
    };
}

/** 向日葵鹿专属：向阳 — 不占催鹿/鹿福配额，催更 + 双福 + 咒回合削减 */
export function performSunflowerFacingSkill(deerData, helperId, targetId, date, day) {
    const blocked = rejectUnlessPlayReady(deerData, helperId, date, day);
    if (blocked) return blocked;
    const wrong = rejectIfWrongProfession(deerData, helperId, date, day, 'sunflower');
    if (wrong) return wrong;
    const helperMonth = ensureMonthData(deerData, helperId, date);
    if (hasUsedJobSkill(helperMonth, day)) {
        return { ok: false, type: 'job_skill_used' };
    }
    const targetMonth = ensureMonthData(deerData, targetId, date);
    const entry = ensureDayEntry(targetMonth, day);
    if (entry.d) return { ok: false, type: 'target_dead' };
    markJobSkillUsed(helperMonth, day);
    entry.a += 1;
    addUrgeBuffStack(targetMonth, day, SUNFLOWER_FACING_URGE_STACKS);
    const blessStacks = applyBlessStacks(entry, SUNFLOWER_FACING_BLESS_LAYERS);
    let curseCleared = 0;
    if (getCurseInfo(entry).active) {
        curseCleared = getActiveCurseStacks(entry);
        clearCurse(entry);
    }
    adjustDayCount(entry, SUNFLOWER_FACING_COUNT_GAIN);
    grantJobSkillQuotaBonus(helperMonth, day, QUOTA.urge, 1);
    grantJobSkillQuotaBonus(helperMonth, day, QUOTA.bless, 1);
    recordHelpAction('help_lu', helperId, targetId, date, { sunflowerSkill: true });
    return {
        ok: true,
        type: 'job_skill_sunflower_facing',
        entry,
        count: entry.c,
        blessStacks,
        blessLayers: SUNFLOWER_FACING_BLESS_LAYERS,
        urgeStacks: SUNFLOWER_FACING_URGE_STACKS,
        countGain: SUNFLOWER_FACING_COUNT_GAIN,
        curseCleared,
        urged: true,
        urgeQuotaBonus: 1,
        blessQuotaBonus: 1,
    };
}

/** 福鹿使专属：广福 — 不占鹿福配额、贴 1 层福 */
export function performBlesserGrantSkill(deerData, userId, targetId, date, day) {
    const blocked = rejectUnlessPlayReady(deerData, userId, date, day);
    if (blocked) return blocked;
    const wrong = rejectIfWrongProfession(deerData, userId, date, day, 'blesser');
    if (wrong) return wrong;
    const monthData = ensureMonthData(deerData, userId, date);
    if (hasUsedJobSkill(monthData, day)) {
        return { ok: false, type: 'job_skill_used' };
    }
    const targetMonth = ensureMonthData(deerData, targetId, date);
    const entry = ensureDayEntry(targetMonth, day);
    if (entry.d) return { ok: false, type: 'target_dead' };
    markJobSkillUsed(monthData, day);
    entry.a += 1;
    let curseStripped = 0;
    if (getActiveCurseStacks(entry) > 0) {
        stripOneCurseStack(entry);
        curseStripped = 1;
    }
    const stacks = applyBlessStacks(entry, BLESSER_SKILL_BLESS_LAYERS);
    grantJobSkillQuotaBonus(monthData, day, QUOTA.bless, 1);
    return {
        ok: true,
        type: 'job_skill_blesser_grant',
        entry,
        count: entry.c,
        blessStacks: stacks,
        blessLayers: BLESSER_SKILL_BLESS_LAYERS,
        curseStripped,
        blessQuotaBonus: 1,
    };
}

/** 窃光鹿专属：夜袭 — 不占偷鹿配额、高成功率偷 1 */
export function performRogueNightRaidSkill(deerData, thiefId, targetId, date, day) {
    if (String(thiefId) === String(targetId)) {
        return { ok: false, type: 'steal_self' };
    }
    const blocked = rejectUnlessPlayReady(deerData, thiefId, date, day);
    if (blocked) return blocked;
    const wrong = rejectIfWrongProfession(deerData, thiefId, date, day, 'rogue');
    if (wrong) return wrong;
    const thiefMonth = ensureMonthData(deerData, thiefId, date);
    if (hasUsedJobSkill(thiefMonth, day)) {
        return { ok: false, type: 'job_skill_used' };
    }
    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (getStealableCount(targetEntry) <= 0) {
        return { ok: false, type: targetEntry.d ? 'steal_target_dead' : 'steal_empty' };
    }
    markJobSkillUsed(thiefMonth, day);
    const thiefEntry = ensureDayEntry(thiefMonth, day);
    thiefEntry.a += 1;
    const nightChance = ROGUE_NIGHT_RAID_CHANCE;
    grantJobSkillQuotaBonus(thiefMonth, day, QUOTA.steal, 1);
    if (rollChance(nightChance)) {
        adjustStealableCount(targetEntry, -1);
        adjustDayCount(thiefEntry, 1);
        if (getActiveCurseStacks(targetEntry) > 0) {
            stripOneCurseStack(targetEntry);
        }
        return {
            ok: true,
            type: 'job_skill_rogue_raid_success',
            thiefCount: thiefEntry.c,
            targetCount: getStealableCount(targetEntry),
            stolenFromSnap: !!targetEntry.d,
            nightChance,
            stealQuotaBonus: 1,
        };
    }
    return {
        ok: true,
        type: 'job_skill_rogue_raid_fail',
        thiefCount: thiefEntry.c,
        targetCount: getStealableCount(targetEntry),
        stolenFromSnap: !!targetEntry.d,
        nightChance,
        stealQuotaBonus: 1,
        noSelfPenalty: true,
    };
}

/** 王美嘉专属：组队@ */
export function performMeijiaTeamSkill(deerData, meijiaId, targetId, date, day) {
    if (String(meijiaId) === String(targetId)) {
        return { ok: false, type: 'team_self' };
    }
    const blocked = rejectUnlessPlayReady(deerData, meijiaId, date, day);
    if (blocked) return blocked;
    const meijiaMonth = ensureMonthData(deerData, meijiaId, date);
    const wrong = rejectIfWrongExtraDeer(meijiaMonth, day, 'meijia');
    if (wrong) return wrong;
    const meijiaEntry = ensureDayEntry(meijiaMonth, day);
    if (meijiaEntry.c < 0) {
        return { ok: false, type: 'team_meijia_negative' };
    }
    if (hasUsedJobSkill(meijiaMonth, day)) {
        return { ok: false, type: 'job_skill_used' };
    }
    const targetMonth = ensureMonthData(deerData, targetId, date);
    const targetEntry = ensureDayEntry(targetMonth, day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };
    const existing = getMeijiaTeamPartnerId(meijiaMonth, day);
    if (existing) {
        return { ok: false, type: 'team_already', partnerId: existing };
    }
    const targetPartner = getMeijiaTeamPartnerId(targetMonth, day);
    if (targetPartner && String(targetPartner) !== String(meijiaId)) {
        return { ok: false, type: 'team_partner_taken', partnerId: targetPartner };
    }
    markJobSkillUsed(meijiaMonth, day);
    setMeijiaTeamLink(meijiaMonth, targetMonth, meijiaId, targetId, day);
    return {
        ok: true,
        type: 'job_skill_meijia_team',
        partnerId: String(targetId),
        targetCount: targetEntry.c,
    };
}

export function performDeerCartInvite(deerData, driverId, helperId, date, day) {
    if (String(driverId) === String(helperId)) {
        return { ok: false, type: 'cart_self' };
    }
    reconcileStaleDeerCart(deerData, driverId, date, day);
    reconcileStaleDeerCart(deerData, helperId, date, day);
    const blocked = rejectUnlessPlayReady(deerData, driverId, date, day);
    if (blocked) return blocked;
    const driverMonth = ensureMonthData(deerData, driverId, date);
    if (isInDeerCart(driverMonth, day)) {
        return { ok: false, type: 'cart_already' };
    }
    const helperMonth = ensureMonthData(deerData, helperId, date);
    if (isInDeerCart(helperMonth, day)) {
        return { ok: false, type: 'cart_partner_busy' };
    }
    const helperEntry = ensureDayEntry(helperMonth, day);
    if (helperEntry.d) return { ok: false, type: 'target_dead' };
    const pendingInvite = getDeerCartInvite(helperMonth, day);
    if (pendingInvite && String(pendingInvite) !== String(driverId)) {
        return { ok: false, type: 'cart_partner_busy' };
    }
    setDeerCartInvite(helperMonth, driverId, day);
    return {
        ok: true,
        type: 'deer_cart_invite',
        helperId: String(helperId),
    };
}

export function performDeerCartDepart(deerData, helperId, date, day) {
    const blocked = rejectUnlessPlayReady(deerData, helperId, date, day);
    if (blocked) return blocked;
    const helperMonth = ensureMonthData(deerData, helperId, date);
    const driverId = getDeerCartInvite(helperMonth, day);
    if (!driverId) {
        return { ok: false, type: 'cart_no_invite' };
    }
    if (isInDeerCart(helperMonth, day)) {
        clearDeerCartInvite(helperMonth, day);
        return { ok: false, type: 'cart_already' };
    }
    const driverMonth = ensureMonthData(deerData, driverId, date);
    if (isInDeerCart(driverMonth, day)) {
        clearDeerCartInvite(helperMonth, day);
        return { ok: false, type: 'cart_partner_busy' };
    }
    const driverEntry = ensureDayEntry(driverMonth, day);
    if (driverEntry.d) {
        clearDeerCartInvite(helperMonth, day);
        return { ok: false, type: 'cart_driver_dead' };
    }
    activateDeerCart(driverMonth, helperMonth, driverId, helperId, day);
    return {
        ok: true,
        type: 'deer_cart_depart',
        driverId: String(driverId),
        helperId: String(helperId),
    };
}

/** 雨木木鹿专属：束缚 — 55 分钟禁自鹿，晚上11点（23:00）前可用 */
export function performYumumuBindSkill(deerData, yumumuId, targetId, date, day) {
    if (String(yumumuId) === String(targetId)) {
        return { ok: false, type: 'bind_self' };
    }
    if (isYumumuBindAfterCutoff(date)) {
        return { ok: false, type: 'bind_after_cutoff' };
    }
    const blocked = rejectUnlessPlayReady(deerData, yumumuId, date, day);
    if (blocked) return blocked;
    const yumumuMonth = ensureMonthData(deerData, yumumuId, date);
    const wrong = rejectIfWrongExtraDeer(yumumuMonth, day, 'yumumu');
    if (wrong) return wrong;
    if (hasUsedJobSkill(yumumuMonth, day)) {
        return { ok: false, type: 'job_skill_used' };
    }
    const targetMonth = ensureMonthData(deerData, targetId, date);
    const targetEntry = ensureDayEntry(targetMonth, day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };
    if (isLuBanned(targetMonth, day)) {
        return { ok: false, type: 'bind_already' };
    }
    markJobSkillUsed(yumumuMonth, day);
    applyLuBan(targetMonth, day);
    return {
        ok: true,
        type: 'job_skill_yumumu_bind',
        targetId: String(targetId),
        banMinutes: YUMUMU_BIND_MINUTES,
        targetCount: targetEntry.c,
    };
}

/** 语姐鹿专属：带派 — 下一次皇城鹿掷骰必胜 */
function beginExtraDeerSelfSkill(deerData, userId, date, day, extraId) {
    const blocked = rejectUnlessPlayReady(deerData, userId, date, day);
    if (blocked) return blocked;
    const monthData = ensureMonthData(deerData, userId, date);
    const wrong = rejectIfWrongExtraDeer(monthData, day, extraId);
    if (wrong) return wrong;
    if (hasUsedJobSkill(monthData, day)) {
        return { ok: false, type: 'job_skill_used' };
    }
    markJobSkillUsed(monthData, day);
    return { ok: true, monthData };
}

function normalizeSignOutcome(entry, outcome) {
    if (entry?.d) return 'blank';
    if (outcome === 'cleanse' && !getActiveCurseStacks(entry)) {
        return 'blank';
    }
    return outcome;
}

function applySignOutcome(monthData, day, entry, outcome) {
    if (entry?.d) return;
    switch (outcome) {
        case 'plus':
        case 'plus1':
            adjustDayCount(entry, 1);
            break;
        case 'plus2':
            adjustDayCount(entry, 2);
            break;
        case 'minus':
        case 'minus1':
            adjustDayCount(entry, -1);
            break;
        case 'minus2':
            adjustDayCount(entry, -2);
            break;
        case 'urge':
            addUrgeBuffStack(monthData, day, 1);
            break;
        case 'curse':
            applyCurseStacks(entry, 1);
            break;
        case 'cleanse':
            stripOneCurseStack(entry);
            break;
        case 'bless':
            applyBlessStacks(entry, 1);
            break;
        default:
            break;
    }
}

export function performYujieDaipaiSkill(deerData, userId, date, day) {
    const ready = beginExtraDeerSelfSkill(deerData, userId, date, day, 'yujie');
    if (!ready.ok) return ready;
    applyYujieImperialGuarantee(ready.monthData, day);
    return {
        ok: true,
        type: 'job_skill_yujie_daipai',
    };
}

const XUYUEZHEN_CHAOS_OUTCOMES = Object.freeze([
    'plus2', 'minus2', 'plus1', 'minus1', 'curse', 'cleanse', 'urge', 'bless', 'blank',
]);

/** 许月珍鹿专属：操你血妈 — 随机触发签运类效果 */
export function performXuyuezhenChaosSkill(deerData, userId, date, day) {
    const ready = beginExtraDeerSelfSkill(deerData, userId, date, day, 'xuyuezhen');
    if (!ready.ok) return ready;
    const monthData = ready.monthData;
    const entry = ensureDayEntry(monthData, day);
    entry.a += 1;

    let outcome = XUYUEZHEN_CHAOS_OUTCOMES[Math.floor(Math.random() * XUYUEZHEN_CHAOS_OUTCOMES.length)];
    outcome = normalizeSignOutcome(entry, outcome);
    applySignOutcome(monthData, day, entry, outcome);

    const ci = getCurseInfo(entry);
    const bi = getBlessInfo(entry);
    return {
        ok: true,
        type: 'job_skill_xuyuezhen_chaos',
        outcome,
        count: entry.c,
        curseStacks: ci.stacks,
        curseRounds: ci.rounds,
        blessStacks: bi.stacks,
        blessRounds: bi.rounds,
    };
}

/** 皇城鹿猜大小：语姐天赋 +20% 必胜 / 带派蓄势 100% 必胜 */
export function resolveImperialChallengerWin(deerData, challengerId, date, day, choice, side) {
    const monthData = ensureMonthData(deerData, challengerId, date);
    if (hasYujieImperialGuarantee(monthData, day)) {
        clearYujieImperialGuarantee(monthData, day);
        return { win: true, yujieDaipai: true };
    }
    let win = choice === side;
    if (!win && getDayProfessionId(monthData, day) === 'yujie' && rollChance(YUJIE_IMPERIAL_WIN_BONUS)) {
        return { win: true, yujieBonus: true };
    }
    return { win };
}

/**
 * 帮🦌 / 救活 / 拉下马
 */
export function performHelpLu(deerData, helperId, targetId, date, day, gameContext = {}) {
    const blocked = rejectUnlessPlayReady(deerData, helperId, date, day);
    if (blocked) return blocked;
    const helperMonth = ensureMonthData(deerData, helperId, date);
    let cartWrongTarget = rejectIfCartHelpWrongTarget(helperMonth, day, targetId);
    if (cartWrongTarget) {
        reconcileStaleDeerCart(deerData, helperId, date, day);
        cartWrongTarget = rejectIfCartHelpWrongTarget(helperMonth, day, targetId);
        if (cartWrongTarget) return cartWrongTarget;
    }
    const helpLimit = getHelpQuotaLimit(helperMonth, day);
    const quotaLeft = getHelperQuotaLeft(helperMonth, day);
    if (quotaLeft <= 0) {
        return {
            ok: false,
            type: 'help_quota',
            helpQuotaUsed: helpLimit,
            helpQuotaLeft: 0,
            helpQuotaMax: helpLimit,
        };
    }

    const helperProf = getProfessionMods(helperMonth, day);
    const { wx, patrolConsumed } = weatherForAction(gameContext, helperMonth, day);
    const helperWx = scaleWeatherForProfession(wx, helperProf);
    const monthData = ensureMonthData(deerData, targetId, date);
    const entry = ensureDayEntry(monthData, day);
    const targetMods = resolvePlayModifiers(entry, wx);
    const impBonus = getImpotenceHelpFailBonus(monthData, day);
    const helpFailChance = clampDeathChance(
        HELP_FAIL_CHANCE + targetMods.helpFailDelta + (helperProf?.helpFailDelta || 0) + impBonus,
    );
    const helpKey = String(helperId);
    let result;
    if (entry.d) {
        const reviveFail = clampDeathChance(
            HELP_FAIL_CHANCE + targetMods.helpFailDelta + (helperProf?.helpFailDelta || 0)
                + (helperWx.reviveFailDelta || 0) + (helperProf?.reviveFailDelta || 0),
        );
        if (rollChance(reviveFail)) {
            const quota = consumeHelperQuota(helperMonth, day, targetId);
            return attachQuota({
                ok: true,
                type: 'help_revive_fail',
                entry,
                failChance: reviveFail,
            }, quota);
        }
        entry.d = 0;
        entry.c = entry.snap || 0;
        entry.snap = 0;
        entry.dr = '';
        entry.dk = '';
        entry.revived += 1;
        if (!entry.helpBy) entry.helpBy = {};
        entry.helpBy[helpKey] = (entry.helpBy[helpKey] || 0) + 1;
        result = { ok: true, type: 'revive', entry, count: entry.c, safeLimit: targetMods.safeLimit };
    } else {
        if (!entry.helpBy) entry.helpBy = {};
        entry.helpBy[helpKey] = (entry.helpBy[helpKey] || 0) + 1;
        entry.a += 1;
        if (entry.c > 0 && rollChance(helpFailChance)) {
            if (impBonus > 0) consumeImpotence(monthData, day);
            const reason = entry.c >= targetMods.safeLimit ? DEATH_REASON.PULL : DEATH_REASON.HELP;
            const snap = applyDeath(entry, { reason, killerId: helperId });
            result = {
                ok: true,
                type: reason === DEATH_REASON.PULL ? 'help_pull' : 'help_kill',
                entry,
                snap,
                helpKillChance: helpFailChance,
                safeLimit: targetMods.safeLimit,
                impotenceTriggered: impBonus > 0,
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
            result = {
                ok: true,
                type: 'help',
                entry,
                count: entry.c,
                curseSoothe,
                helpKillChance: helpFailChance,
                safeLimit: targetMods.safeLimit,
                weatherPatrolConsumed: patrolConsumed,
            };
        }
    }

    if (result?.ok && (result.type === 'help' || result.type === 'revive')) {
        applyMedicHelpSynergy(entry, helperProf, result);
        applyYumumuHelpSynergy(helperMonth, monthData, day, result);
        if (helperProf?.id === 'medic' && helperProf.helpQuotaBonusChance
            && rollChance(helperProf.helpQuotaBonusChance)) {
            helperMonth[helpQuotaBonusKey(day)] = (helperMonth[helpQuotaBonusKey(day)] || 0) + 1;
            result.helpQuotaBonus = true;
        }
    }

    const quota = consumeHelperQuota(helperMonth, day, targetId);
    if (result?.ok && (result.type === 'help' || result.type === 'revive')
        && helperProf?.helpQuotaSaveChance && rollChance(helperProf.helpQuotaSaveChance)) {
        Object.assign(quota, refundHelperQuota(helperMonth, day, targetId));
        result.helpQuotaSaved = true;
    }
    if (result?.ok && (result.type === 'help' || result.type === 'revive')) {
        recordHelpAction('help_lu', helperId, targetId, date, {
            revive: result.type === 'revive',
        });
    }
    if (entry.d) {
        resolvePlayDeathEffects(deerData, targetId, date, day, result, helperId);
    }
    return attachQuota(result, quota);
}

/** 戒🦌（次数可为负，0 也可继续戒） */
export function performWithdrawal(deerData, userId, date, day, { pastDay = false } = {}) {
    if (!pastDay) {
        const blocked = rejectUnlessPlayReady(deerData, userId, date, day);
        if (blocked) return blocked;
    }
    const monthData = ensureMonthData(deerData, userId, date);
    const withdrawBlock = rejectIfMeijiaWithdrawal(monthData, day);
    if (withdrawBlock) return withdrawBlock;
    const entry = ensureDayEntry(monthData, day);
    if (entry.d) {
        return { ok: false, type: 'withdrawal_dead' };
    }

    const prof = pastDay ? null : getProfessionMods(monthData, day);
    entry.c -= 1;
    let asceticBonus = 0;
    if (!pastDay && prof?.selfWithdrawBonus && prof.selfWithdrawBonusChance
        && rollChance(prof.selfWithdrawBonusChance)) {
        entry.c -= prof.selfWithdrawBonus;
        asceticBonus = prof.selfWithdrawBonus;
    }
    if (!pastDay) entry.a += 1;
    return {
        ok: true,
        type: asceticBonus ? 'withdrawal_ascetic' : 'withdrawal',
        entry,
        count: entry.c,
        asceticBonus,
    };
}

/** 同归鹿尽：双方各 -5，发起者每日一次，次数可负；鹿死者不可发起或成为目标 */
export function performTogetherFall(deerData, userId, targetId, date, day) {
    if (String(userId) === String(targetId)) {
        return { ok: false, type: 'together_self' };
    }

    const actorDead = rejectUnlessPlayReady(deerData, userId, date, day);
    if (actorDead) return actorDead;
    const initiatorMonth = ensureMonthData(deerData, userId, date);
    const togetherMax = getProfessionQuotaLimit(initiatorMonth, day, QUOTA.together);
    if (togetherMax <= 0) {
        return { ok: false, type: 'together_disabled' };
    }
    const togetherUsed = getTogetherUsedCount(initiatorMonth, day);
    if (togetherUsed >= togetherMax) {
        return { ok: false, type: 'together_used', togetherUsed, togetherMax };
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
    initiatorMonth[togetherUsedKey(day)] = togetherUsed + 1;
    return {
        ok: true,
        type: 'together_fall',
        togetherUsed: togetherUsed + 1,
        togetherMax,
        togetherLeft: Math.max(0, togetherMax - togetherUsed - 1),
        selfCount: selfEntry.c,
        targetCount: targetEntry.c,
        cost: TOGETHER_FALL_COST,
    };
}

/** 帮戒🦌：帮🦌友 -1，每日 3 次，可负 */
export function performHelpWithdrawal(deerData, helperId, targetId, date, day, gameContext = {}) {
    const blocked = rejectUnlessPlayReady(deerData, helperId, date, day);
    if (blocked) return blocked;
    const helperMonth = ensureMonthData(deerData, helperId, date);
    const helperProf = getProfessionMods(helperMonth, day);
    const { wx } = weatherForAction(gameContext, helperMonth, day);
    const helperWx = scaleWeatherForProfession(wx, helperProf);
    const withdrawFailExtra = (helperWx.helpWithdrawFailDelta || 0) + (helperProf?.helpWithdrawFailDelta || 0);
    const withdrawFail = clampDeathChance(HELP_WITHDRAW_FAIL_CHANCE + withdrawFailExtra);
    const withdrawLimit = getHelpWithdrawQuotaLimit(helperMonth, day);
    const quotaLeft = getHelperWithdrawQuotaLeft(helperMonth, day);
    if (quotaLeft <= 0) {
        return {
            ok: false,
            type: 'help_withdraw_quota',
            helpWithdrawUsed: withdrawLimit,
            helpWithdrawLeft: 0,
            helpWithdrawMax: withdrawLimit,
        };
    }

    const targetMonth = ensureMonthData(deerData, targetId, date);
    const targetWithdrawBlock = rejectIfMeijiaWithdrawal(targetMonth, day);
    if (targetWithdrawBlock) return targetWithdrawBlock;
    const entry = ensureDayEntry(targetMonth, day);
    if (entry.d) {
        return { ok: false, type: 'target_dead' };
    }

    entry.a += 1;
    const inWithdrawalZone = entry.c < 0;
    if (rollHelpWithdrawFail(withdrawFailExtra)) {
        const quota = consumeHelperWithdrawQuota(helperMonth, day, targetId);
        return {
            ok: true,
            type: 'help_withdraw_fail',
            entry,
            count: entry.c,
            failChance: withdrawFail,
            ...quota,
        };
    }

    adjustDayCount(entry, -1);
    let withdrawExtra = 0;
    if (inWithdrawalZone) {
        withdrawExtra += 1;
        if (helperProf?.asceticZoneBonus) withdrawExtra += helperProf.asceticZoneBonus;
    }
    if (helperProf?.withdrawExtraChance && rollChance(helperProf.withdrawExtraChance)) {
        withdrawExtra += helperProf.withdrawExtraAmount || 1;
    }
    if (withdrawExtra > 0) adjustDayCount(entry, -withdrawExtra);
    const quota = consumeHelperWithdrawQuota(helperMonth, day, targetId);
    let helpWithdrawSaved = false;
    if (helperProf?.helpWithdrawSaveChance && rollChance(helperProf.helpWithdrawSaveChance)) {
        Object.assign(quota, refundHelperWithdrawQuota(helperMonth, day, targetId));
        helpWithdrawSaved = true;
    }
    recordHelpAction('help_withdraw', helperId, targetId, date);
    return {
        ok: true,
        type: withdrawExtra ? 'help_withdraw_extra' : 'help_withdraw',
        entry,
        count: entry.c,
        withdrawExtra,
        helpWithdrawSaved,
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
    const quota = consumeDailyQuota(monthData, day, imperialUsedKey, getProfessionQuotaLimit(monthData, day, QUOTA.imperial));
    return quota != null;
}

/** 标记今日已使用一次擂台鹿 */
export function markArenaUsed(deerData, userId, date, day) {
    const monthData = ensureMonthData(deerData, userId, date);
    const quota = consumeDailyQuota(monthData, day, arenaUsedKey, getProfessionQuotaLimit(monthData, day, QUOTA.arena));
    return quota != null;
}

/** 擂台鹿开战校验（不含消耗配额） */
export function validateArenaStart(deerData, challengerId, targetId, date, day) {
    if (String(challengerId) === String(targetId)) {
        return { ok: false, type: 'arena_self' };
    }

    const actorDead = rejectUnlessPlayReady(deerData, challengerId, date, day);
    if (actorDead) return actorDead;
    const targetDead = isUserDeadToday(deerData, targetId, date, day);
    if (targetDead) {
        return { ok: false, type: 'arena_target_dead' };
    }
    const targetProf = rejectIfNoProfession(deerData, targetId, date, day);
    if (targetProf) return targetProf;

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
        refundArenaUsed(deerData, challengerId, date, day);
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

/** 偷鹿：35% 得手 / 反噬 / 空手（含天气修正） */
export function performStealDeer(deerData, thiefId, targetId, date, day, gameContext = {}) {
    if (String(thiefId) === String(targetId)) {
        return { ok: false, type: 'steal_self' };
    }
    const actorDead = rejectUnlessPlayReady(deerData, thiefId, date, day);
    if (actorDead) return actorDead;
    const thiefMonth = ensureMonthData(deerData, thiefId, date);
    const quotaBlock = rejectIfPlayQuotaBlocked(thiefMonth, day, QUOTA.steal, stealUsedKey, 'steal');
    if (quotaBlock) return quotaBlock;
    const used = readDailyUsed(thiefMonth, day, stealUsedKey);

    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (getStealableCount(targetEntry) <= 0) {
        return { ok: false, type: targetEntry.d ? 'steal_target_dead' : 'steal_empty' };
    }
    thiefMonth[stealUsedKey(day)] = used + 1;
    const thiefEntry = ensureDayEntry(thiefMonth, day);
    thiefEntry.a += 1;
    const curseStacks = getActiveCurseStacks(targetEntry);
    const thiefProf = getProfessionMods(thiefMonth, day);
    const { wx } = weatherForAction(gameContext, thiefMonth, day);
    const scaledWx = scaleWeatherForProfession(wx, thiefProf);
    const stealBonus = curseStacks * STEAL_CURSE_BONUS_PER_STACK + (scaledWx.stealDelta || 0);
    const successCap = Math.min(0.95, Math.max(0.05, STEAL_SUCCESS_CHANCE + stealBonus));
    const backfireCap = successCap + Math.max(0.05, STEAL_BACKFIRE_CHANCE + (scaledWx.stealBackfireDelta || 0));
    const roll = Math.random();
    const snapNote = { stolenFromSnap: !!targetEntry.d };
    if (roll < successCap) {
        adjustStealableCount(targetEntry, -1);
        adjustDayCount(thiefEntry, 1);
        let stealUsedCount = used + 1;
        let stealQuotaSaved = false;
        if (thiefProf?.stealQuotaSaveChance && rollChance(thiefProf.stealQuotaSaveChance)) {
            refundPlayQuotaUsed(thiefMonth, day, stealUsedKey);
            stealUsedCount = used;
            stealQuotaSaved = true;
        }
        return {
            ok: true,
            type: 'steal_success',
            thiefCount: thiefEntry.c,
            targetCount: getStealableCount(targetEntry),
            stealUsed: stealUsedCount,
            stealLeft: getProfessionQuotaLimit(thiefMonth, day, QUOTA.steal) - stealUsedCount,
            stealMax: getProfessionQuotaLimit(thiefMonth, day, QUOTA.steal),
            curseStacks,
            stealBonus,
            stealQuotaSaved,
            ...snapNote,
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
            targetCount: getStealableCount(targetEntry),
            stealUsed: used + 1,
            stealLeft: getProfessionQuotaLimit(thiefMonth, day, QUOTA.steal) - used - 1,
            stealMax: getProfessionQuotaLimit(thiefMonth, day, QUOTA.steal),
            curseStacks,
            stealBonus,
            curseBackfire,
            ...snapNote,
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
        targetCount: getStealableCount(targetEntry),
        stealUsed: used + 1,
        stealLeft: getProfessionQuotaLimit(thiefMonth, day, QUOTA.steal) - used - 1,
        stealMax: getProfessionQuotaLimit(thiefMonth, day, QUOTA.steal),
        curseStacks,
        stealBonus,
        curseBackfire,
    };
}

/** 鹿咒：叠层 + 三回合内每层 +10% 鹿死 */
export function performCurseDeer(deerData, casterId, targetId, date, day, gameContext = {}) {
    if (String(casterId) === String(targetId)) {
        return { ok: false, type: 'curse_self' };
    }
    const actorDead = rejectUnlessPlayReady(deerData, casterId, date, day);
    if (actorDead) return actorDead;
    const casterMonth = ensureMonthData(deerData, casterId, date);
    const quotaBlock = rejectIfPlayQuotaBlocked(casterMonth, day, QUOTA.curse, curseUsedKey, 'curse');
    if (quotaBlock) return quotaBlock;
    const used = readDailyUsed(casterMonth, day, curseUsedKey);
    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };
    casterMonth[curseUsedKey(day)] = used + 1;
    let stacks = applyCurseStacks(targetEntry, 1);
    const casterProf = getProfessionMods(casterMonth, day);
    const { wx } = weatherForAction(gameContext, casterMonth, day);
    const scaledWx = scaleWeatherForProfession(wx, casterProf);
    if ((scaledWx.curseExtraChance || 0) > 0 && rollChance(scaledWx.curseExtraChance)) {
        stacks = applyCurseStacks(targetEntry, 1);
    }
    if ((casterProf?.curseApplyBonus || 0) > 0 && rollChance(casterProf.curseApplyBonus)) {
        stacks = applyCurseStacks(targetEntry, 1);
    }

    let curseUsedCount = used + 1;
    let curseQuotaSaved = false;
    if (casterProf?.curseQuotaSaveChance && rollChance(casterProf.curseQuotaSaveChance)) {
        refundPlayQuotaUsed(casterMonth, day, curseUsedKey);
        curseUsedCount = used;
        curseQuotaSaved = true;
    }

    return {
        ok: true,
        type: 'curse',
        curseUsed: curseUsedCount,
        curseLeft: getProfessionQuotaLimit(casterMonth, day, QUOTA.curse) - curseUsedCount,
        curseMax: getProfessionQuotaLimit(casterMonth, day, QUOTA.curse),
        curseStacks: stacks,
        curseRounds: targetEntry.curR,
        bonus: CURSE_DEATH_BONUS,
        ascended: stacks >= CURSE_ASCENDED_STACKS,
        curseQuotaSaved,
    };
}

/** 解鹿咒：🦌友互助清除全部咒印 */
export function performCleanseCurse(deerData, helperId, targetId, date, day) {
    if (String(helperId) === String(targetId)) {
        return { ok: false, type: 'curse_self' };
    }
    const actorDead = rejectUnlessPlayReady(deerData, helperId, date, day);
    if (actorDead) return actorDead;
    const helperMonth = ensureMonthData(deerData, helperId, date);
    const quotaBlock = rejectIfPlayQuotaBlocked(helperMonth, day, QUOTA.cleanseCurse, cleanseUsedKey, 'cleanse');
    if (quotaBlock) return quotaBlock;
    const used = readDailyUsed(helperMonth, day, cleanseUsedKey);
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
        cleanseLeft: getProfessionQuotaLimit(helperMonth, day, QUOTA.cleanseCurse) - used - 1,
        cleanseMax: getProfessionQuotaLimit(helperMonth, day, QUOTA.cleanseCurse),
        clearedStacks,
    };
}

/** 鹿福：正面咒，叠层减鹿死 */
export function performBlessDeer(deerData, casterId, targetId, date, day) {
    if (String(casterId) === String(targetId)) {
        return { ok: false, type: 'bless_self' };
    }
    const actorDead = rejectUnlessPlayReady(deerData, casterId, date, day);
    if (actorDead) return actorDead;
    const casterMonth = ensureMonthData(deerData, casterId, date);
    const quotaBlock = rejectIfPlayQuotaBlocked(casterMonth, day, QUOTA.bless, blessUsedKey, 'bless');
    if (quotaBlock) return quotaBlock;
    const used = readDailyUsed(casterMonth, day, blessUsedKey);
    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };
    casterMonth[blessUsedKey(day)] = used + 1;
    const casterProf = getProfessionMods(casterMonth, day);
    let stacks = applyBlessStacks(targetEntry, 1);
    if ((casterProf?.blessApplyBonus || 0) > 0 && rollChance(casterProf.blessApplyBonus)) {
        stacks = applyBlessStacks(targetEntry, 1);
    }
    return {
        ok: true,
        type: 'bless',
        blessUsed: used + 1,
        blessLeft: getProfessionQuotaLimit(casterMonth, day, QUOTA.bless) - used - 1,
        blessMax: getProfessionQuotaLimit(casterMonth, day, QUOTA.bless),
        blessStacks: stacks,
        blessRounds: targetEntry.bleR,
        reduce: BLESS_DEATH_REDUCE,
    };
}

/** 解鹿福：🦌友清除全部福咒 */
export function performCleanseBless(deerData, helperId, targetId, date, day) {
    if (String(helperId) === String(targetId)) {
        return { ok: false, type: 'bless_self' };
    }
    const actorDead = rejectUnlessPlayReady(deerData, helperId, date, day);
    if (actorDead) return actorDead;
    const helperMonth = ensureMonthData(deerData, helperId, date);
    const quotaBlock = rejectIfPlayQuotaBlocked(helperMonth, day, QUOTA.cleanseBless, cleanseBlessUsedKey, 'cleanseBless');
    if (quotaBlock) return quotaBlock;
    const used = readDailyUsed(helperMonth, day, cleanseBlessUsedKey);
    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };
    if (!getBlessInfo(targetEntry).active) {
        return { ok: false, type: 'cleanse_no_bless' };
    }

    const clearedStacks = getActiveBlessStacks(targetEntry);
    clearBless(targetEntry);
    helperMonth[cleanseBlessUsedKey(day)] = used + 1;
    return {
        ok: true,
        type: 'cleanse_bless',
        cleanseBlessUsed: used + 1,
        cleanseBlessLeft: getProfessionQuotaLimit(helperMonth, day, QUOTA.cleanseBless) - used - 1,
        cleanseBlessMax: getProfessionQuotaLimit(helperMonth, day, QUOTA.cleanseBless),
        clearedStacks,
    };
}

/** 献祭鹿：施术者 -2，目标 +2 */
export function performSacrificeDeer(deerData, userId, targetId, date, day) {
    if (String(userId) === String(targetId)) {
        return { ok: false, type: 'sacrifice_self' };
    }
    const actorDead = rejectUnlessPlayReady(deerData, userId, date, day);
    if (actorDead) return actorDead;
    const selfMonth = ensureMonthData(deerData, userId, date);
    const sacrificeBlock = rejectIfPlayQuotaBlocked(selfMonth, day, QUOTA.sacrifice, sacrificeUsedKey, 'sacrifice');
    if (sacrificeBlock) return sacrificeBlock;
    const sacrificeUsed = readDailyUsed(selfMonth, day, sacrificeUsedKey);

    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };
    selfMonth[sacrificeUsedKey(day)] = sacrificeUsed + 1;
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
    const actorDead = rejectUnlessPlayReady(deerData, userId, date, day);
    if (actorDead) return actorDead;
    const monthData = ensureMonthData(deerData, userId, date);
    const quotaBlock = rejectIfPlayQuotaBlocked(monthData, day, QUOTA.fakeWithdraw, fakeWithdrawUsedKey, 'fakeWithdraw');
    if (quotaBlock) return quotaBlock;
    const used = readDailyUsed(monthData, day, fakeWithdrawUsedKey);
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
        fakeWithdrawLeft: getProfessionQuotaLimit(monthData, day, QUOTA.fakeWithdraw) - used - 1,
        fakeWithdrawMax: getProfessionQuotaLimit(monthData, day, QUOTA.fakeWithdraw),
    };
}

/** 催鹿：叠催更符（任意次数均可，可与鹿福共存）；带咒则咒回合 -1 */
export function performUrgeDeer(deerData, userId, targetId, date, day) {
    const actorDead = rejectUnlessPlayReady(deerData, userId, date, day);
    if (actorDead) return actorDead;
    const selfMonth = ensureMonthData(deerData, userId, date);
    const quotaBlock = rejectIfPlayQuotaBlocked(selfMonth, day, QUOTA.urge, urgeUsedKey, 'urge');
    if (quotaBlock) return quotaBlock;
    const used = readDailyUsed(selfMonth, day, urgeUsedKey);
    const targetMonth = ensureMonthData(deerData, targetId, date);
    const targetEntry = ensureDayEntry(targetMonth, day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };
    selfMonth[urgeUsedKey(day)] = used + 1;
    const actorProf = getProfessionMods(selfMonth, day);
    const urgeLayers = 1 + (actorProf?.urgeCastStackBonus || 0);
    const buffStacks = addUrgeBuffStack(targetMonth, day, urgeLayers);
    let curseUrged = false;
    if (getCurseInfo(targetEntry).active) {
        targetEntry.curR = Math.max(0, (targetEntry.curR || 0) - 1);
        if (targetEntry.curR <= 0) clearCurse(targetEntry);
        curseUrged = true;
    }

    return {
        ok: true,
        type: 'urge',
        selfTarget: String(userId) === String(targetId),
        buffStacks,
        buffApplied: true,
        curseUrged,
        targetCount: targetEntry.c,
        blessStacks: getActiveBlessStacks(targetEntry),
        curseRounds: getCurseRoundsLeft(targetEntry),
        curseStacks: getActiveCurseStacks(targetEntry),
        urgeUsed: used + 1,
        urgeLeft: getProfessionQuotaLimit(selfMonth, day, QUOTA.urge) - used - 1,
        urgeMax: getProfessionQuotaLimit(selfMonth, day, QUOTA.urge),
    };
}

/** 鹿鸣：恶趣味喊话，小概率 ±1 */
export function performDeerHowl(deerData, userId, date, day, gameContext = {}) {
    const monthData = ensureMonthData(deerData, userId, date);
    const entry = ensureDayEntry(monthData, day);
    const quotaBlock = rejectIfPlayQuotaBlocked(monthData, day, QUOTA.howl, howlUsedKey, 'howl');
    if (quotaBlock) return quotaBlock;
    const used = readDailyUsed(monthData, day, howlUsedKey);
    if (entry.d) {
        const ghostBlocked = rejectUnlessGhostReady(deerData, userId, date, day);
        if (ghostBlocked) return ghostBlocked;
        monthData[howlUsedKey(day)] = used + 1;
        let ghostEffect = 'none';
        const killerId = entry.dk || '';
        if (killerId) {
            const killerMonth = getMonthData(getUserRecord(deerData, killerId), date);
            if (killerMonth) {
                const killerEntry = ensureDayEntry(killerMonth, day);
                if (!killerEntry.d && rollChance(GHOST_HOWL_KILLER_CURSE_CHANCE)) {
                    applyCurseStacks(killerEntry, 1);
                    ghostEffect = 'haunt_killer';
                }
            }
        }
        return {
            ok: true,
            type: ghostEffect === 'haunt_killer' ? 'howl_dead_haunt' : 'howl_dead',
            count: 0,
            lostCount: entry.snap ?? 0,
            howlUsed: used + 1,
            howlLeft: getProfessionQuotaLimit(monthData, day, QUOTA.howl) - used - 1,
            howlMax: getProfessionQuotaLimit(monthData, day, QUOTA.howl),
            ghostEffect,
            killerId,
            curseStacks: killerId && ghostEffect === 'haunt_killer'
                ? getActiveCurseStacks(ensureDayEntry(getMonthData(getUserRecord(deerData, killerId), date), day))
                : 0,
        };
    }

    const blocked = rejectUnlessPlayReady(deerData, userId, date, day);
    if (blocked) return blocked;
    monthData[howlUsedKey(day)] = used + 1;

    let howlEffect = 'none';
    let curseDispelled = 0;
    const prof = getProfessionMods(monthData, day);
    const { wx } = weatherForAction(gameContext, monthData, day);
    const scaledWx = scaleWeatherForProfession(wx, prof);
    const trapChance = clampDeathChance(HOWL_TRAP_CHANCE + (scaledWx.howlTrapDelta || 0));
    const bonusChance = clampDeathChance(HOWL_BONUS_CHANCE + (scaledWx.howlBonusDelta || 0));
    if (getCurseInfo(entry).active) {
        entry.cur = Math.max(0, entry.cur - 1);
        if (entry.cur <= 0) clearCurse(entry);
        else entry.curR = CURSE_MAX_ROUNDS;
        curseDispelled = 1;
        howlEffect = 'cleanse';
    } else if (rollChance(trapChance)) {
        adjustDayCount(entry, -1);
        howlEffect = 'trap';
    } else if (rollChance(bonusChance)) {
        entry.c += 1;
        howlEffect = 'bonus';
    }

    const ci = getCurseInfo(entry);
    return {
        ok: true,
        type: 'howl',
        count: entry.c,
        howlEffect,
        curseDispelled,
        curseStacks: ci.stacks,
        curseRounds: ci.rounds,
        howlUsed: used + 1,
        howlLeft: getProfessionQuotaLimit(monthData, day, QUOTA.howl) - used - 1,
        howlMax: getProfessionQuotaLimit(monthData, day, QUOTA.howl),
    };
}

/** 倒贴鹿：50% 你 +1 对方 -1，失败你 -2 */
export function performGreedDeer(deerData, userId, targetId, date, day, gameContext = {}) {
    if (String(userId) === String(targetId)) {
        return { ok: false, type: 'greed_self' };
    }
    const actorDead = rejectUnlessPlayReady(deerData, userId, date, day);
    if (actorDead) return actorDead;
    const selfMonth = ensureMonthData(deerData, userId, date);
    const greedBlock = rejectIfPlayQuotaBlocked(selfMonth, day, QUOTA.greed, greedUsedKey, 'greed');
    if (greedBlock) return greedBlock;
    const greedUsed = readDailyUsed(selfMonth, day, greedUsedKey);

    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };
    selfMonth[greedUsedKey(day)] = greedUsed + 1;
    const selfEntry = ensureDayEntry(selfMonth, day);
    selfEntry.a += 1;
    const prof = getProfessionMods(selfMonth, day);
    const { wx } = weatherForAction(gameContext, selfMonth, day);
    const scaledWx = scaleWeatherForProfession(wx, prof);
    const greedChance = clampDeathChance(GREED_SUCCESS_CHANCE + (scaledWx.greedSuccessDelta || 0));
    if (rollChance(greedChance)) {
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
export function performGroupSplash(deerData, casterId, memberIds, date, day, gameContext = {}) {
    const actorDead = rejectUnlessPlayReady(deerData, casterId, date, day);
    if (actorDead) return actorDead;
    const targets = pickSplashTargetsFromDayRank(deerData, memberIds, casterId, date, GROUP_SPLASH_TOP_N);
    if (!targets.length) {
        return { ok: false, type: 'splash_no_rank' };
    }

    const casterMonth = ensureMonthData(deerData, casterId, date);
    const quotaBlock = rejectIfPlayQuotaBlocked(casterMonth, day, QUOTA.groupSplash, groupSplashUsedKey, 'groupSplash');
    if (quotaBlock) return quotaBlock;
    const used = readDailyUsed(casterMonth, day, groupSplashUsedKey);
    const victims = [];
    const { wx } = weatherForAction(gameContext, casterMonth, day);
    const prof = getProfessionMods(casterMonth, day);
    const scaledWx = scaleWeatherForProfession(wx, prof);
    const splashDamage = Math.max(1, GROUP_SPLASH_DAMAGE + (scaledWx.splashDamageBonus || 0));
    const splashCurseChance = clampDeathChance(GROUP_SPLASH_CURSE_CHANCE + (scaledWx.splashCurseDelta || 0));
    for (const uid of targets) {
        const entry = getDayEntry(getMonthData(getUserRecord(deerData, uid), date), day);
        if (entry?.d) continue;
        const targetMonth = ensureMonthData(deerData, uid, date);
        const targetEntry = ensureDayEntry(targetMonth, day);
        const hadCurse = getCurseInfo(targetEntry).active;
        adjustDayCount(targetEntry, -splashDamage);
        let burst = false;
        if (hadCurse) {
            adjustDayCount(targetEntry, -GROUP_SPLASH_CURSE_BURST_DAMAGE);
            burst = true;
        }
        targetEntry.a += 1;
        let cursed = false;
        if (rollChance(splashCurseChance)) {
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
        damage: splashDamage,
        burstDamage: GROUP_SPLASH_CURSE_BURST_DAMAGE,
        casterCount: casterEntry.c,
        splashUsed: used + 1,
        splashLeft: getProfessionQuotaLimit(casterMonth, day, QUOTA.groupSplash) - used - 1,
        splashMax: getProfessionQuotaLimit(casterMonth, day, QUOTA.groupSplash),
    };
}

/** 借鹿：🦌友周转 1 次，目标需≥2，顺带撕 1 层咒 */
export function performBorrowDeer(deerData, borrowerId, targetId, date, day) {
    if (String(borrowerId) === String(targetId)) {
        return { ok: false, type: 'borrow_self' };
    }
    const actorDead = rejectUnlessPlayReady(deerData, borrowerId, date, day);
    if (actorDead) return actorDead;
    const borrowerMonth = ensureMonthData(deerData, borrowerId, date);
    const quotaBlock = rejectIfPlayQuotaBlocked(borrowerMonth, day, QUOTA.borrow, borrowUsedKey, 'borrow');
    if (quotaBlock) return quotaBlock;
    const used = readDailyUsed(borrowerMonth, day, borrowUsedKey);
    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };
    const targetMonthNet = getMonthNetCount(getUserRecord(deerData, targetId), date, day);
    if (targetMonthNet < BORROW_MIN_TARGET_COUNT) {
        return { ok: false, type: 'borrow_poor', min: BORROW_MIN_TARGET_COUNT, monthNet: targetMonthNet };
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
        targetMonthNet: getMonthNetCount(getUserRecord(deerData, targetId), date, day),
        curseStripped,
        borrowUsed: used + 1,
        borrowLeft: getProfessionQuotaLimit(borrowerMonth, day, QUOTA.borrow) - used - 1,
        borrowMax: getProfessionQuotaLimit(borrowerMonth, day, QUOTA.borrow),
    };
}

/** 碰瓷鹿：38% 你+1ta-1 / 32% 双-1 / 30% 你只-2，碰瓷成功小概率叠咒 */
export function performBumperDeer(deerData, actorId, targetId, date, day, gameContext = {}) {
    if (String(actorId) === String(targetId)) {
        return { ok: false, type: 'bumper_self' };
    }
    const actorDead = rejectUnlessPlayReady(deerData, actorId, date, day);
    if (actorDead) return actorDead;
    const actorMonth = ensureMonthData(deerData, actorId, date);
    const quotaBlock = rejectIfPlayQuotaBlocked(actorMonth, day, QUOTA.bumper, bumperUsedKey, 'bumper');
    if (quotaBlock) return quotaBlock;
    const used = readDailyUsed(actorMonth, day, bumperUsedKey);
    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };
    actorMonth[bumperUsedKey(day)] = used + 1;
    const actorEntry = ensureDayEntry(actorMonth, day);
    actorEntry.a += 1;
    targetEntry.a += 1;
    const prof = getProfessionMods(actorMonth, day);
    const { wx } = weatherForAction(gameContext, actorMonth, day);
    const scaledWx = scaleWeatherForProfession(wx, prof);
    const winChance = clampDeathChance(BUMPER_WIN_CHANCE + (scaledWx.bumperWinDelta || 0));
    const roll = Math.random();
    if (roll < winChance) {
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
            bumperLeft: getProfessionQuotaLimit(actorMonth, day, QUOTA.bumper) - used - 1,
            bumperMax: getProfessionQuotaLimit(actorMonth, day, QUOTA.bumper),
        };
    }
    if (roll < winChance + BUMPER_DRAW_CHANCE) {
        adjustDayCount(actorEntry, -1);
        adjustDayCount(targetEntry, -1);
        return {
            ok: true,
            type: 'bumper_draw',
            selfCount: actorEntry.c,
            targetCount: targetEntry.c,
            bumperUsed: used + 1,
            bumperLeft: getProfessionQuotaLimit(actorMonth, day, QUOTA.bumper) - used - 1,
            bumperMax: getProfessionQuotaLimit(actorMonth, day, QUOTA.bumper),
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
        bumperLeft: getProfessionQuotaLimit(actorMonth, day, QUOTA.bumper) - used - 1,
        bumperMax: getProfessionQuotaLimit(actorMonth, day, QUOTA.bumper),
    };
}

/** 抽鹿签：单人每日运势（+1/-1/催更符/自咒/撕咒/空签） */
export function performDeerLottery(deerData, userId, date, day, gameContext = {}) {
    const actorDead = rejectUnlessPlayReady(deerData, userId, date, day);
    if (actorDead) return actorDead;
    const monthData = ensureMonthData(deerData, userId, date);
    const quotaBlock = rejectIfPlayQuotaBlocked(monthData, day, QUOTA.lottery, lotteryUsedKey, 'lottery');
    if (quotaBlock) return quotaBlock;
    const used = readDailyUsed(monthData, day, lotteryUsedKey);
    monthData[lotteryUsedKey(day)] = used + 1;
    const entry = ensureDayEntry(monthData, day);
    entry.a += 1;
    const prof = getProfessionMods(monthData, day);
    const { wx } = weatherForAction(gameContext, monthData, day);
    const scaledWx = scaleWeatherForProfession(wx, prof);
    const patrolLuck = consumePatrolLotteryLuck(monthData, day);
    let roll = Math.random() - (scaledWx.lotteryLuckDelta || 0) - patrolLuck;
    roll = Math.max(0, Math.min(0.999, roll));
    let outcome;
    if (roll < 0.28) outcome = 'plus';
    else if (roll < 0.48) outcome = 'minus';
    else if (roll < 0.63) outcome = 'urge';
    else if (roll < 0.73) outcome = 'curse';
    else if (roll < 0.85) outcome = 'cleanse';
    else outcome = 'blank';
    outcome = normalizeSignOutcome(entry, outcome);

    applySignOutcome(monthData, day, entry, outcome);

    const ci = getCurseInfo(entry);
    const buffStacks = outcome === 'urge' ? getUrgeBuffStacks(monthData, day) : 0;
    return {
        ok: true,
        type: 'lottery',
        outcome,
        count: entry.c,
        buffStacks,
        curseStacks: ci.stacks,
        curseRounds: ci.rounds,
        lotteryUsed: used + 1,
        lotteryLeft: getProfessionQuotaLimit(monthData, day, QUOTA.lottery) - used - 1,
        lotteryMax: getProfessionQuotaLimit(monthData, day, QUOTA.lottery),
    };
}

/** 冥咒：鹿死专属，对活人叠咒 */
export function performSpectralCurse(deerData, ghostId, targetId, date, day) {
    if (String(ghostId) === String(targetId)) {
        return { ok: false, type: 'spectral_curse_self' };
    }
    const mustDead = rejectUnlessGhostReady(deerData, ghostId, date, day);
    if (mustDead) return mustDead;
    const ghostMonth = ensureMonthData(deerData, ghostId, date);
    const quotaBlock = rejectIfPlayQuotaBlocked(ghostMonth, day, QUOTA.spectralCurse, spectralCurseUsedKey, 'spectralCurse');
    if (quotaBlock) return quotaBlock;
    const used = readDailyUsed(ghostMonth, day, spectralCurseUsedKey);
    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };
    ghostMonth[spectralCurseUsedKey(day)] = used + 1;
    const stacks = applyCurseStacks(targetEntry, 1);
    return {
        ok: true,
        type: 'spectral_curse',
        spectralCurseUsed: used + 1,
        spectralCurseLeft: getProfessionQuotaLimit(ghostMonth, day, QUOTA.spectralCurse) - used - 1,
        spectralCurseMax: getProfessionQuotaLimit(ghostMonth, day, QUOTA.spectralCurse),
        curseStacks: stacks,
        curseRounds: targetEntry.curR,
        ascended: stacks >= CURSE_ASCENDED_STACKS,
    };
}

/** 索命鹿：鹿死专属，有凶手必须@凶手 */
export function performVengeanceDeer(deerData, ghostId, targetId, date, day) {
    if (String(ghostId) === String(targetId)) {
        return { ok: false, type: 'vengeance_self' };
    }
    const mustDead = rejectUnlessGhostReady(deerData, ghostId, date, day);
    if (mustDead) return mustDead;
    const ghostEntry = ensureDayEntry(ensureMonthData(deerData, ghostId, date), day);
    const killerId = ghostEntry.dk || '';
    const hasKiller = !!killerId;
    if (hasKiller && String(killerId) !== String(targetId)) {
        return { ok: false, type: 'vengeance_not_killer', killerId };
    }

    const ghostMonth = ensureMonthData(deerData, ghostId, date);
    const quotaBlock = rejectIfPlayQuotaBlocked(ghostMonth, day, QUOTA.vengeance, vengeanceUsedKey, 'vengeance');
    if (quotaBlock) return quotaBlock;
    const used = readDailyUsed(ghostMonth, day, vengeanceUsedKey);
    const targetEntry = ensureDayEntry(ensureMonthData(deerData, targetId, date), day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };
    ghostMonth[vengeanceUsedKey(day)] = used + 1;
    if (hasKiller) {
        const roll = Math.random();
        if (roll < VENGEANCE_CURSE_CHANCE) {
            const stacks = applyCurseStacks(targetEntry, 1);
            return {
                ok: true,
                type: 'vengeance_curse',
                mode: 'killer',
                curseStacks: stacks,
                targetCount: targetEntry.c,
                vengeanceUsed: used + 1,
                vengeanceLeft: getProfessionQuotaLimit(ghostMonth, day, QUOTA.vengeance) - used - 1,
                vengeanceMax: getProfessionQuotaLimit(ghostMonth, day, QUOTA.vengeance),
            };
        }
        if (roll < VENGEANCE_CURSE_CHANCE + VENGEANCE_DEDUCT_CHANCE) {
            adjustDayCount(targetEntry, -1);
            targetEntry.a += 1;
            return {
                ok: true,
                type: 'vengeance_deduct',
                mode: 'killer',
                targetCount: targetEntry.c,
                vengeanceUsed: used + 1,
                vengeanceLeft: getProfessionQuotaLimit(ghostMonth, day, QUOTA.vengeance) - used - 1,
                vengeanceMax: getProfessionQuotaLimit(ghostMonth, day, QUOTA.vengeance),
            };
        }
        return {
            ok: true,
            type: 'vengeance_fail',
            mode: 'killer',
            vengeanceUsed: used + 1,
            vengeanceLeft: getProfessionQuotaLimit(ghostMonth, day, QUOTA.vengeance) - used - 1,
            vengeanceMax: getProfessionQuotaLimit(ghostMonth, day, QUOTA.vengeance),
        };
    }

    if (rollChance(VENGEANCE_SUBSTITUTE_CURSE_CHANCE)) {
        const stacks = applyCurseStacks(targetEntry, 1);
        return {
            ok: true,
            type: 'vengeance_substitute',
            mode: 'substitute',
            curseStacks: stacks,
            targetCount: targetEntry.c,
            vengeanceUsed: used + 1,
            vengeanceLeft: getProfessionQuotaLimit(ghostMonth, day, QUOTA.vengeance) - used - 1,
            vengeanceMax: getProfessionQuotaLimit(ghostMonth, day, QUOTA.vengeance),
        };
    }
    return {
        ok: true,
        type: 'vengeance_fail',
        mode: 'substitute',
        vengeanceUsed: used + 1,
        vengeanceLeft: getProfessionQuotaLimit(ghostMonth, day, QUOTA.vengeance) - used - 1,
        vengeanceMax: getProfessionQuotaLimit(ghostMonth, day, QUOTA.vengeance),
    };
}

/** 托梦鹿：鹿死专属，🦌友互助（催更符或缓咒） */
export function performDreamDeer(deerData, ghostId, targetId, date, day) {
    if (String(ghostId) === String(targetId)) {
        return { ok: false, type: 'dream_self' };
    }
    const mustDead = rejectUnlessGhostReady(deerData, ghostId, date, day);
    if (mustDead) return mustDead;
    const ghostMonth = ensureMonthData(deerData, ghostId, date);
    const quotaBlock = rejectIfPlayQuotaBlocked(ghostMonth, day, QUOTA.dream, dreamUsedKey, 'dream');
    if (quotaBlock) return quotaBlock;
    const used = readDailyUsed(ghostMonth, day, dreamUsedKey);
    const targetMonth = ensureMonthData(deerData, targetId, date);
    const targetEntry = ensureDayEntry(targetMonth, day);
    if (targetEntry.d) return { ok: false, type: 'target_dead' };
    ghostMonth[dreamUsedKey(day)] = used + 1;
    let dreamEffect = 'urge';
    if (getCurseInfo(targetEntry).active) {
        targetEntry.curR = Math.max(0, (targetEntry.curR || 0) - 1);
        if (targetEntry.curR <= 0) clearCurse(targetEntry);
        dreamEffect = 'soothe';
    } else {
        addUrgeBuffStack(targetMonth, day, 1);
    }

    return {
        ok: true,
        type: 'dream',
        dreamEffect,
        targetCount: targetEntry.c,
        curseRounds: getCurseRoundsLeft(targetEntry),
        curseStacks: getActiveCurseStacks(targetEntry),
        dreamUsed: used + 1,
        dreamLeft: getProfessionQuotaLimit(ghostMonth, day, QUOTA.dream) - used - 1,
        dreamMax: getProfessionQuotaLimit(ghostMonth, day, QUOTA.dream),
    };
}

/** 还阳签：鹿死专属，小概率自救还阳 */
export function performReviveLottery(deerData, userId, date, day) {
    const mustDead = rejectUnlessGhostReady(deerData, userId, date, day);
    if (mustDead) return mustDead;
    const monthData = ensureMonthData(deerData, userId, date);
    const quotaBlock = rejectIfPlayQuotaBlocked(monthData, day, QUOTA.reviveLottery, reviveLotteryUsedKey, 'reviveLottery');
    if (quotaBlock) return quotaBlock;
    const used = readDailyUsed(monthData, day, reviveLotteryUsedKey);
    monthData[reviveLotteryUsedKey(day)] = used + 1;
    const reviveMax = getProfessionQuotaLimit(monthData, day, QUOTA.reviveLottery);
    const reviveLeft = Math.max(0, reviveMax - used - 1);
    const entry = ensureDayEntry(monthData, day);
    const snap = entry.snap ?? 0;
    const roll = Math.random();
    if (roll < REVIVE_LOTTERY_FULL_CHANCE) {
        reviveDayEntry(entry);
        entry.revived += 1;
        return {
            ok: true,
            type: 'revive_lottery_full',
            count: entry.c,
            restored: snap,
            reviveLotteryUsed: used + 1,
            reviveLotteryLeft: reviveLeft,
            reviveLotteryMax: reviveMax,
        };
    }
    if (roll < REVIVE_LOTTERY_FULL_CHANCE + REVIVE_LOTTERY_WEAK_CHANCE) {
        entry.d = 0;
        entry.c = REVIVE_LOTTERY_WEAK_COUNT;
        entry.snap = 0;
        entry.dr = '';
        entry.dk = '';
        entry.revived += 1;
        return {
            ok: true,
            type: 'revive_lottery_weak',
            count: entry.c,
            reviveLotteryUsed: used + 1,
            reviveLotteryLeft: reviveLeft,
            reviveLotteryMax: reviveMax,
        };
    }
    return {
        ok: true,
        type: 'revive_lottery_blank',
        lostCount: snap,
        reviveLotteryUsed: used + 1,
        reviveLotteryLeft: reviveLeft,
        reviveLotteryMax: reviveMax,
    };
}

/** 鹿碑：鹿死专属，查看死因档案（无需转职） */
export function performTombstone(deerData, userId, date, day) {
    const mustDead = rejectUnlessActorDead(deerData, userId, date, day);
    if (mustDead) return mustDead;
    const entry = ensureDayEntry(ensureMonthData(deerData, userId, date), day);
    return {
        ok: true,
        type: 'tombstone',
        lostCount: entry.snap ?? 0,
        deathReason: entry.dr || DEATH_REASON.SELF,
        killerId: entry.dk || '',
        deathCount: entry.dc ?? 0,
        attempts: entry.a ?? 0,
        helped: entry.helped ?? 0,
        revived: entry.revived ?? 0,
    };
}

/** 擂台拒战：应战者 -1 次 */
export function performArenaDecline(deerData, targetId, date, day, penalty = 1) {
    const targetProf = rejectIfNoProfession(deerData, targetId, date, day);
    if (targetProf) return targetProf;
    const targetDead = rejectIfActorDead(deerData, targetId, date, day);
    if (targetDead) return targetDead;
    const targetMonth = ensureMonthData(deerData, targetId, date);
    const entry = ensureDayEntry(targetMonth, day);
    adjustDayCount(entry, -penalty);
    entry.a += 1;
    return {
        ok: true,
        type: 'arena_decline',
        count: entry.c,
        penalty,
    };
}

/** 皇城鹿 PK 结算（宣战时已 mark；失败/超时需 refundImperialUsed） */
export function settleImperialPk(deerData, challengerId, kingId, date, day, { win }) {
    const dead = rejectUnlessPlayReady(deerData, challengerId, date, day);
    if (dead) return dead;
    const kingEntry = ensureDayEntry(ensureMonthData(deerData, kingId, date), day);
    const challengerEntry = ensureDayEntry(ensureMonthData(deerData, challengerId, date), day);
    if (win && kingEntry.d) {
        return { ok: false, type: 'imperial_king_dead' };
    }
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
    DEATH_REASON,
    calcOverlimitDeathChance,
    TOGETHER_FALL_COST,
    ARENA_STAKE,
    IMPERIAL_WIN_DEDUCT,
    IMPERIAL_LOSE_DEDUCT,
    IMPERIAL_KING_WIN_BONUS,
};
