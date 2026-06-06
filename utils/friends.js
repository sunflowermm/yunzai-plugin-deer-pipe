import { QQ_AVATAR } from '../constants/game.js';

const FRIENDS_VERSION = 3;

/**
 * 鹿友关系（一次添加、双向结缘）：
 * A 添加 B 后，A、B 互相出现在对方名单中，且双方均可帮🦌/帮戒🦌/救活对方
 * friends[userId] = [friendId, ...]
 */

export function migrateFriendsData(friends) {
    if (!friends || typeof friends !== 'object') return { data: {}, changed: false };

    let data = { ...friends };
    let changed = false;

    if (data._version !== 2 && data._version !== FRIENDS_VERSION) {
        const inverted = {};
        for (const [targetId, helpers] of Object.entries(data)) {
            if (targetId === '_version' || !Array.isArray(helpers)) continue;
            for (const helperId of helpers) {
                const h = String(helperId);
                if (!inverted[h]) inverted[h] = [];
                const t = String(targetId);
                if (!inverted[h].includes(t)) inverted[h].push(t);
            }
        }
        data = inverted;
        changed = true;
    } else if (data._version === FRIENDS_VERSION) {
        const { _version, ...rest } = data;
        return { data: rest, changed: false };
    } else {
        const { _version, ...rest } = data;
        data = rest;
    }

    for (const [userId, list] of Object.entries(data)) {
        if (!Array.isArray(list)) continue;
        for (const friendId of list) {
            const f = String(friendId);
            if (!data[f]) data[f] = [];
            if (!data[f].map(String).includes(String(userId))) {
                data[f].push(String(userId));
                changed = true;
            }
        }
    }

    return { data, changed: changed || friends._version !== FRIENDS_VERSION };
}

export function packFriends(data) {
    return { _version: FRIENDS_VERSION, ...data };
}

export function areFriends(friends, userId, targetId) {
    const list = friends?.[String(userId)] || [];
    return list.map(String).includes(String(targetId));
}

export function canHelpFriend(friends, helperId, targetId) {
    return areFriends(friends, helperId, targetId);
}

/** 一次添加，双向结缘 */
export function addFriendBond(friends, userId, targetId) {
    const a = String(userId);
    const b = String(targetId);
    const hadBond = areFriends(friends, a, b);
    if (hadBond) return false;

    if (!friends[a]) friends[a] = [];
    if (!friends[b]) friends[b] = [];
    if (!friends[a].map(String).includes(b)) friends[a].push(b);
    if (!friends[b].map(String).includes(a)) friends[b].push(a);
    return true;
}

/** 绝交时解除双向关系 */
export function removeFriendBond(friends, userId, targetId) {
    const a = String(userId);
    const b = String(targetId);
    if (!areFriends(friends, a, b)) return false;

    if (friends[a]) {
        friends[a] = friends[a].filter(id => String(id) !== b);
        if (!friends[a].length) delete friends[a];
    }
    if (friends[b]) {
        friends[b] = friends[b].filter(id => String(id) !== a);
        if (!friends[b].length) delete friends[b];
    }
    return true;
}

export function getHelpTargets(friends, helperId) {
    return friends?.[String(helperId)] || [];
}

export function buildFriendCards(friends, userId, membersMap) {
    return getHelpTargets(friends, userId)
        .filter(id => membersMap.get(parseInt(id)) !== undefined)
        .map(id => {
            const info = membersMap.get(parseInt(id));
            return {
                user_id: id,
                nickname: info?.card || info?.nickname || id,
                avatar: QQ_AVATAR(id),
                badge: '互 🦌',
            };
        });
}

/** @deprecated 兼容旧引用 */
export const addFriendTarget = addFriendBond;
export const removeFriendTarget = removeFriendBond;
