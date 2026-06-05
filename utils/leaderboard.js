import { QQ_AVATAR } from '../constants/game.js';
import {
    getMonthKey,
    getUserRecord,
    sumMonthData,
    sumYearData,
} from './data.js';

export function buildRankData(deerData, members, { scope = 'month', date = new Date(), order = 'desc' } = {}) {
    const monthKey = getMonthKey(date);
    const year = date.getFullYear();

    const rankData = Object.keys(deerData)
        .filter(deer => members.includes(parseInt(deer)))
        .map(deer => {
            const userRecord = getUserRecord(deerData, deer);
            if (!userRecord) return null;

            let sum = 0;
            if (scope === 'year') {
                sum = sumYearData(userRecord, year);
            } else {
                const monthData = userRecord[monthKey];
                sum = sumMonthData(monthData);
            }
            if (sum <= 0) return null;
            return { id: deer, sum };
        })
        .filter(Boolean);

    rankData.sort((a, b) => order === 'asc' ? a.sum - b.sum : b.sum - a.sum);
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
    const action = isWithdrawal ? '戒鹿' : '鹿管';
    if (scope === 'year') return `${year}年${action}年榜`;
    return `${month}月${action}月榜`;
}

export function getRankMedal(order) {
    if (order === 1) return '🥇';
    if (order === 2) return '🥈';
    if (order === 3) return '🥉';
    if (order <= 10) return '🏅';
    return '🦌';
}

export function getRankBarWidth(sum, maxSum) {
    if (!maxSum) return 0;
    return Math.max(8, Math.round((sum / maxSum) * 100));
}
