/**
 * 帮鹿/帮戒永久日志（独立于当日配额 meta 与 entry.helpBy，清算/清空不删）
 */
import { REDIS_YUNZAI_DEER_PIPE_HELP_LOG } from '../constants/core.js';

let cache = null;
let dirty = false;

function formatDayKey(date) {
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function padMonth(n) {
    return String(n).padStart(2, '0');
}

function getDayKeysForScope(scope, date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    if (scope === 'day') return [formatDayKey(d)];
    if (scope === 'year') {
        const year = d.getFullYear();
        const endMonth = d.getMonth() + 1;
        const endDay = d.getDate();
        const keys = [];
        for (let m = 1; m <= endMonth; m++) {
            const daysInMonth = m === endMonth ? endDay : new Date(year, m, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                keys.push(`${year}-${padMonth(m)}-${padMonth(day)}`);
            }
        }
        return keys;
    }
    const year = d.getFullYear();
    const month = padMonth(d.getMonth() + 1);
    const endDay = d.getDate();
    const keys = [];
    for (let day = 1; day <= endDay; day++) {
        keys.push(`${year}-${month}-${padMonth(day)}`);
    }
    return keys;
}

function emptyHelperStats() {
    return { helpLu: 0, revive: 0, withdraw: 0, medicSkill: 0, asceticSkill: 0 };
}

function scoreHealStats(stats) {
    return (stats.helpLu || 0) + (stats.revive || 0) * 2 + (stats.medicSkill || 0);
}

function scoreWithdrawStats(stats) {
    return (stats.withdraw || 0) + (stats.asceticSkill || 0) * 2;
}

function scoreReviveStats(stats) {
    return (stats.revive || 0) + (stats.medicSkill || 0);
}

async function redisGetJson(key) {
    const raw = await redis.get(key);
    if (raw == null) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

async function redisSetJson(key, value) {
    await redis.set(key, JSON.stringify(value));
}

export async function ensureHelpLogLoaded() {
    if (cache) return cache;
    cache = (await redisGetJson(REDIS_YUNZAI_DEER_PIPE_HELP_LOG)) ?? {};
    return cache;
}

export async function flushHelpLogIfDirty() {
    if (!dirty || !cache) return;
    await redisSetJson(REDIS_YUNZAI_DEER_PIPE_HELP_LOG, cache);
    dirty = false;
}

function ensureDayBucket(dayKey) {
    if (!cache[dayKey]) {
        cache[dayKey] = { helpers: {}, helped: {} };
    }
    return cache[dayKey];
}

function bumpMap(map, id, subKey, subId) {
    const key = String(id);
    if (!map[key]) map[key] = { total: 0, to: {}, from: {} };
    map[key].total += 1;
    if (subKey && subId != null) {
        const sk = String(subId);
        map[key][subKey][sk] = (map[key][subKey][sk] || 0) + 1;
    }
}

function ensureHelperStats(bucket, helperId) {
    const key = String(helperId);
    if (!bucket.helpers[key]) {
        bucket.helpers[key] = { total: 0, to: {}, from: {}, ...emptyHelperStats() };
    }
    return bucket.helpers[key];
}

function ensureHelpedStats(bucket, targetId) {
    const key = String(targetId);
    if (!bucket.helped[key]) {
        bucket.helped[key] = { total: 0, to: {}, from: {}, ...emptyHelperStats() };
    }
    return bucket.helped[key];
}

export function recordHelpAction(kind, helperId, targetId, date = new Date(), opts = {}) {
    if (!helperId || !targetId) return;
    if (opts.success === false) return;
    if (!cache) {
        logger.warn('[deer-pipe] help-log 未预加载，跳过帮鹿记录（请先 loadDeerData）');
        return;
    }
    const dayKey = formatDayKey(date);
    const bucket = ensureDayBucket(dayKey);
    bumpMap(bucket.helpers, helperId, 'to', targetId);
    bumpMap(bucket.helped, targetId, 'from', helperId);

    const helper = ensureHelperStats(bucket, helperId);
    const helped = ensureHelpedStats(bucket, targetId);

    if (kind === 'help_withdraw') {
        if (opts.withdrawSkill) {
            helper.asceticSkill = (helper.asceticSkill || 0) + 1;
            helped.asceticSkill = (helped.asceticSkill || 0) + 1;
        } else {
            helper.withdraw = (helper.withdraw || 0) + 1;
            helped.withdraw = (helped.withdraw || 0) + 1;
        }
    } else if (opts.revive) {
        helper.revive = (helper.revive || 0) + 1;
        helped.revive = (helped.revive || 0) + 1;
    } else if (opts.skill) {
        helper.medicSkill = (helper.medicSkill || 0) + 1;
        helped.medicSkill = (helped.medicSkill || 0) + 1;
    } else {
        helper.helpLu = (helper.helpLu || 0) + 1;
        helped.helpLu = (helped.helpLu || 0) + 1;
    }
    dirty = true;
}

/** @param {'heal'|'withdraw'|'revive'} metric */
export async function aggregateHelperScores({ metric = 'heal', scope = 'month', date = new Date() } = {}) {
    await ensureHelpLogLoaded();
    const scoreFn = metric === 'withdraw'
        ? scoreWithdrawStats
        : (metric === 'revive' ? scoreReviveStats : scoreHealStats);
    const dayKeys = getDayKeysForScope(scope, date);
    const totals = {};
    for (const dayKey of dayKeys) {
        const bucket = cache[dayKey];
        if (!bucket?.helpers) continue;
        for (const [uid, stats] of Object.entries(bucket.helpers)) {
            if (!totals[uid]) totals[uid] = emptyHelperStats();
            for (const k of Object.keys(emptyHelperStats())) {
                totals[uid][k] += stats[k] || 0;
            }
        }
    }
    const ranked = Object.entries(totals)
        .map(([id, stats]) => ({ id, sum: scoreFn(stats), stats }))
        .filter((item) => item.sum > 0);
    ranked.sort((a, b) => b.sum - a.sum || String(a.id).localeCompare(String(b.id)));
    return ranked;
}

export async function getHelpLogForDay(date = new Date()) {
    await ensureHelpLogLoaded();
    const dayKey = formatDayKey(date);
    return cache[dayKey] || { helpers: {}, helped: {} };
}

export async function getHelpLogDayKeys(limit = 31) {
    await ensureHelpLogLoaded();
    return Object.keys(cache).sort().slice(-limit);
}
