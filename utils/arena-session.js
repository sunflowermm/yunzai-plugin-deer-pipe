/**
 * 擂台鹿待应战 session（群:被挑战者 → 战书数据）
 * 应战由 plugin setContext('arenaRespond') + arenaRespond 处理，不走裸 ^冲$ 规则
 */
import { ARENA_PK_TIMEOUT_SEC } from '../constants/game.js';

/** @typedef {{
 *   challengerId: string,
 *   challengerName: string,
 *   targetId: string,
 *   targetName: string,
 *   date: Date,
 *   day: number,
 *   timer?: ReturnType<typeof setTimeout>,
 * }} ArenaSession */

/** @type {Map<string, ArenaSession>} */
const arenaChallengeSessions = new Map();

export function arenaSessionKey(groupId, targetId) {
    return `${groupId}:${targetId}`;
}

/** @param {{ group_id: string|number, user_id: string|number }} e */
export function findArenaSessionForTarget(e) {
    if (!e?.group_id || !e?.user_id) return null;
    return arenaChallengeSessions.get(arenaSessionKey(e.group_id, e.user_id)) || null;
}

export function hasArenaSessionsInGroup(groupId) {
    const prefix = `${groupId}:`;
    for (const key of arenaChallengeSessions.keys()) {
        if (key.startsWith(prefix)) return true;
    }
    return false;
}

export function isArenaTargetBusy(groupId, targetId) {
    return arenaChallengeSessions.has(arenaSessionKey(groupId, targetId));
}

/**
 * @param {string|number} groupId
 * @param {string|number} targetId
 * @param {Omit<ArenaSession, 'timer'>} data
 * @param {{ onExpire?: (groupId: string|number) => void }} [hooks]
 */
export function armArenaSession(groupId, targetId, data, hooks = {}) {
    clearArenaSession(groupId, targetId);
    const key = arenaSessionKey(groupId, targetId);
    const timer = setTimeout(() => {
        arenaChallengeSessions.delete(key);
        hooks.onExpire?.(groupId);
    }, ARENA_PK_TIMEOUT_SEC * 1000);
    arenaChallengeSessions.set(key, { ...data, timer });
}

export function clearArenaSession(groupId, targetId) {
    const key = arenaSessionKey(groupId, targetId);
    const session = arenaChallengeSessions.get(key);
    if (session?.timer) clearTimeout(session.timer);
    arenaChallengeSessions.delete(key);
}

export function clearAllArenaSessions() {
    for (const session of arenaChallengeSessions.values()) {
        if (session?.timer) clearTimeout(session.timer);
    }
    arenaChallengeSessions.clear();
}
