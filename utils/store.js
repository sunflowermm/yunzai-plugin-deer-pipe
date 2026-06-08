/**
 * 持久化层：经 global.redis 读写，数据不落盘到插件目录
 */
import { REDIS_YUNZAI_DEER_PIPE, REDIS_YUNZAI_DEER_PIPE_FRIENDS } from '../constants/core.js';
import { migrateAllData } from './data.js';
import { migrateFriendsData, packFriends } from './friends.js';

/** 旧版 Redis 键，加载时自动迁移 */
const LEGACY_REDIS_SIGN = 'Yz:deer_pipe:core:sign';
const LEGACY_REDIS_FRIENDS = 'Yz:deer_pipe:core:friends';

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

async function loadJsonWithLegacy(key, legacyKey) {
    let data = await redisGetJson(key);
    if (data != null) return data;
    const legacy = await redisGetJson(legacyKey);
    if (legacy == null) return null;
    await redisSetJson(key, legacy);
    await redis.del(legacyKey);
    return legacy;
}

export async function loadDeerData() {
    let deerData = (await loadJsonWithLegacy(REDIS_YUNZAI_DEER_PIPE, LEGACY_REDIS_SIGN)) ?? {};
    if (migrateAllData(deerData)) {
        await redisSetJson(REDIS_YUNZAI_DEER_PIPE, deerData);
    }
    return deerData;
}

export async function saveDeerData(deerData) {
    await redisSetJson(REDIS_YUNZAI_DEER_PIPE, deerData);
}

export async function loadFriends() {
    let raw = (await loadJsonWithLegacy(REDIS_YUNZAI_DEER_PIPE_FRIENDS, LEGACY_REDIS_FRIENDS)) ?? {};
    const { data, changed } = migrateFriendsData(raw);
    if (changed) {
        await redisSetJson(REDIS_YUNZAI_DEER_PIPE_FRIENDS, packFriends(data));
    }
    return data;
}

export async function saveFriends(friends) {
    await redisSetJson(REDIS_YUNZAI_DEER_PIPE_FRIENDS, packFriends(friends));
}
