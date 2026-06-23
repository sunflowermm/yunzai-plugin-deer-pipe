/**
 * 持久化层：经 global.redis 读写，数据不落盘到插件目录
 */
import { REDIS_YUNZAI_DEER_PIPE, REDIS_YUNZAI_DEER_PIPE_FRIENDS } from '../constants/core.js';
import { packFriends, unpackFriends } from './friends.js';
import { ensureHelpLogLoaded, flushHelpLogIfDirty } from './help-log.js';

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

export async function loadDeerData() {
    await ensureHelpLogLoaded();
    return (await redisGetJson(REDIS_YUNZAI_DEER_PIPE)) ?? {};
}

export async function saveDeerData(deerData) {
    await redisSetJson(REDIS_YUNZAI_DEER_PIPE, deerData);
    await flushHelpLogIfDirty();
}

export async function loadFriends() {
    const raw = (await redisGetJson(REDIS_YUNZAI_DEER_PIPE_FRIENDS)) ?? {};
    return unpackFriends(raw);
}

export async function saveFriends(friends) {
    await redisSetJson(REDIS_YUNZAI_DEER_PIPE_FRIENDS, packFriends(friends));
}
