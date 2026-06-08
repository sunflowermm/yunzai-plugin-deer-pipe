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

/**
 * 同步写入内存缓存；saveDeerData 时 flush 到 Redis
 * @param {'help_lu'|'help_withdraw'} kind
 */
export function recordHelpAction(kind, helperId, targetId, date = new Date()) {
    if (!helperId || !targetId) return;
    if (!cache) {
        logger.warn('[deer-pipe] help-log 未预加载，跳过帮鹿记录（请先 loadDeerData）');
        return;
    }
    const dayKey = formatDayKey(date);
    const bucket = ensureDayBucket(dayKey);
    bumpMap(bucket.helpers, helperId, 'to', targetId);
    bumpMap(bucket.helped, targetId, 'from', helperId);
    if (kind === 'help_withdraw') {
        bucket.helpers[String(helperId)].withdraw = (bucket.helpers[String(helperId)].withdraw || 0) + 1;
        bucket.helped[String(targetId)].withdraw = (bucket.helped[String(targetId)].withdraw || 0) + 1;
    } else {
        bucket.helpers[String(helperId)].helpLu = (bucket.helpers[String(helperId)].helpLu || 0) + 1;
        bucket.helped[String(targetId)].helpLu = (bucket.helped[String(targetId)].helpLu || 0) + 1;
    }
    dirty = true;
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
