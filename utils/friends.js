import { QQ_AVATAR } from '../constants/game.js';

const FRIENDS_VERSION = 3;

/** 鹿友关系（一次添加、双向结缘）：friends[userId] = [friendId, ...] */

export function unpackFriends(raw) {
    if (!raw || typeof raw !== 'object') return {};
    const { _version, ...rest } = raw;
    return rest;
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

