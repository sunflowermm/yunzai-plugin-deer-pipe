/**
 * 鹿车待发车 session（群/私聊:帮鹿位 → 邀请数据）
 * 确认由 plugin setContext('deerCartDepart') + deerCartDepart 处理，不走裸「发车」规则
 */
import { DEER_CART_DEPART_TIMEOUT_SEC } from '../constants/game.js';

/** @typedef {{
 *   driverId: string,
 *   driverName: string,
 *   helperId: string,
 *   date: Date,
 *   day: number,
 *   pluginName?: string,
 *   selfId?: string|number,
 *   timer?: ReturnType<typeof setTimeout>,
 * }} DeerCartSession */
/** @type {Map<string, DeerCartSession>} */
const deerCartSessions = new Map();

export function deerCartSessionKey(scopeId, targetId) {
    return `${scopeId}:${targetId}`;
}

/** @param {{ group_id?: string|number, user_id: string|number }} e */
export function findDeerCartSessionForTarget(e) {
    if (!e?.user_id) return null;
    const scopeId = e.group_id || 'pm';
    return deerCartSessions.get(deerCartSessionKey(scopeId, e.user_id)) || null;
}

export function isDeerCartTargetBusy(scopeId, targetId) {
    return deerCartSessions.has(deerCartSessionKey(scopeId, targetId));
}

/**
 * @param {string|number} scopeId
 * @param {string|number} targetId
 * @param {Omit<DeerCartSession, 'timer'>} data
 * @param {{ onExpire?: (scopeId: string|number, targetId: string|number) => void }} [hooks]
 */
export function armDeerCartSession(scopeId, targetId, data, hooks = {}) {
    clearDeerCartSession(scopeId, targetId);
    const key = deerCartSessionKey(scopeId, targetId);
    const timer = setTimeout(() => {
        deerCartSessions.delete(key);
        hooks.onExpire?.(scopeId, targetId);
    }, DEER_CART_DEPART_TIMEOUT_SEC * 1000);
    deerCartSessions.set(key, { ...data, timer });
}

export function clearDeerCartSession(scopeId, targetId) {
    const key = deerCartSessionKey(scopeId, targetId);
    const session = deerCartSessions.get(key);
    if (session?.timer) clearTimeout(session.timer);
    deerCartSessions.delete(key);
}
