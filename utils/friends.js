const FRIENDS_VERSION = 2;

/**
 * 鹿友关系（单向）：
 * friends[helperId] = [targetId, ...]  → helper 可以帮 target 🦌 / 救活
 */

export function migrateFriendsData(friends) {
    if (!friends || typeof friends !== 'object') return { data: {}, changed: false };

    if (friends._version === FRIENDS_VERSION) {
        const { _version, ...rest } = friends;
        return { data: rest, changed: false };
    }

    const inverted = {};
    for (const [targetId, helpers] of Object.entries(friends)) {
        if (targetId === '_version' || !Array.isArray(helpers)) continue;
        for (const helperId of helpers) {
            const h = String(helperId);
            if (!inverted[h]) inverted[h] = [];
            const t = String(targetId);
            if (!inverted[h].includes(t)) inverted[h].push(t);
        }
    }
    return { data: inverted, changed: true };
}

export function packFriends(data) {
    return { _version: FRIENDS_VERSION, ...data };
}

export function canHelpFriend(friends, helperId, targetId) {
    const list = friends?.[String(helperId)] || [];
    return list.map(String).includes(String(targetId));
}

export function addFriendTarget(friends, helperId, targetId) {
    const h = String(helperId);
    const t = String(targetId);
    if (!friends[h]) friends[h] = [];
    if (friends[h].map(String).includes(t)) return false;
    friends[h].push(t);
    return true;
}

export function removeFriendTarget(friends, helperId, targetId) {
    const h = String(helperId);
    const t = String(targetId);
    if (!friends[h]) return false;
    const before = friends[h].length;
    friends[h] = friends[h].filter(id => String(id) !== t);
    return friends[h].length < before;
}

export function getHelpTargets(friends, helperId) {
    return friends?.[String(helperId)] || [];
}
