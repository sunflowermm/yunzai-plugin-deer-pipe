import { QQ_AVATAR } from '../constants/game.js';
import {
    getDayEntry,
    getDayRankInGroup,
    getMonthKey,
    getMonthData,
    getUserRecord,
    isDeadOnDay,
    sumMonthNet,
    sumYearNet,
} from './data.js';

function compareRank(a, b, order) {
    const diff = order === 'asc' ? a.sum - b.sum : b.sum - a.sum;
    return diff !== 0 ? diff : String(a.id).localeCompare(String(b.id));
}

export function buildRankData(deerData, members, { scope = 'month', date = new Date(), order = 'desc', withdrawal = false } = {}) {
    const monthKey = getMonthKey(date);
    const year = date.getFullYear();
    const upToDay = date.getDate();

    if (scope === 'day') {
        if (withdrawal) {
            const wd = members.map(id => {
                const uid = String(id);
                if (isDeadOnDay(deerData, uid, date, upToDay)) return null;
                const entry = getDayEntry(getMonthData(getUserRecord(deerData, uid), date), upToDay);
                if (!entry || entry.d) return null;
                if (entry.c >= 0) return null;
                return { id: uid, sum: entry.c };
            }).filter(Boolean);
            wd.sort((a, b) => compareRank(a, b, 'asc'));
            return wd;
        }

        const list = getDayRankInGroup(deerData, members, date);
        if (order === 'asc') list.sort((a, b) => compareRank(a, b, 'asc'));
        return list;
    }

    const rankData = members.map(deer => {
        const uid = String(deer);
        if (isDeadOnDay(deerData, uid, date, upToDay)) return null;

        const userRecord = getUserRecord(deerData, uid);
        if (!userRecord) return null;

        let sum = 0;
        let hasActivity = false;

        if (scope === 'year') {
            const ranked = sumYearNet(userRecord, year, date);
            sum = ranked.sum;
            hasActivity = ranked.hasActivity;
        } else {
            const monthData = userRecord[monthKey];
            const ranked = sumMonthNet(monthData, { upToDay });
            sum = ranked.sum;
            hasActivity = ranked.hasActivity;
        }

        if (withdrawal) {
            if (sum >= 0) return null;
            return { id: uid, sum };
        }

        if (sum <= 0 || !hasActivity) return null;
        return { id: uid, sum };
    }).filter(Boolean);

    rankData.sort((a, b) => compareRank(a, b, order));
    return rankData;
}

export async function enrichRankWithMembers(rankData, membersMap) {
    return Promise.all(rankData.map(async (item, index) => {
        const groupInfo = membersMap.get(parseInt(item.id));
        return {
            ...item,
            user_id: item.id,
            avatar: QQ_AVATAR(item.id),
            card: groupInfo?.card || groupInfo?.nickname || item.id,
            order: index + 1,
        };
    }));
}

export function getRankTitle(scope, isWithdrawal, date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const action = isWithdrawal ? '戒鹿' : '鹿管';
    if (scope === 'year') return `${year}年${action}年榜`;
    if (scope === 'day') return isWithdrawal ? `${month}月${day}日戒鹿日榜` : `${month}月${day}日鹿日榜`;
    return isWithdrawal ? `${month}月${action}月榜` : `${month}月${action}月榜`;
}

export function getRankMedal(order) {
    if (order === 1) return '🥇';
    if (order === 2) return '🥈';
    if (order === 3) return '🥉';
    if (order <= 10) return '🏅';
    return '🦌';
}

export function getRankBarWidth(sum, maxSum) {
    const abs = Math.abs(sum);
    const maxAbs = Math.abs(maxSum) || 1;
    if (!abs) return 0;
    return Math.max(8, Math.round((abs / maxAbs) * 100));
}

export function getRankScopeKey(scope, isWithdrawal) {
    if (scope === 'day') return isWithdrawal ? 'day_wd' : 'day';
    return scope;
}
