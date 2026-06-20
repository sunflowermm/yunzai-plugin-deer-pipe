import { QQ_AVATAR } from '../constants/game.js';
import { BALANCED_FORMULA_HINT } from '../constants/balanced-score.js';
import {
    getDayBalancedRankInGroup,
    getDayEntry,
    getDayRankInGroup,
    getMonthKey,
    getMonthData,
    getPeakDayCount,
    getUserRecord,
    isDeadOnDay,
    sumChaosActions,
    sumChaosActionsForDay,
    sumMonthActiveAttempts,
    sumMonthBalancedScore,
    sumMonthNet,
    sumYearBalancedScore,
    sumYearNet,
} from './data.js';
import { aggregateHelperScores } from './help-log.js';

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

/** @param {'heal'|'withdraw'|'revive'} metric */
export async function buildHelpRankData(members, { metric = 'heal', scope = 'month', date = new Date() } = {}) {
    const memberSet = new Set(members.map((id) => String(id)));
    const all = await aggregateHelperScores({ metric, scope, date });
    return all.filter((item) => memberSet.has(String(item.id)));
}

export function buildPeakRankData(deerData, members, { scope = 'month', date = new Date() } = {}) {
    const upToDay = date.getDate();
    const year = date.getFullYear();
    const monthKey = getMonthKey(date);
    const list = members.map((id) => {
        const uid = String(id);
        const userRecord = getUserRecord(deerData, uid);
        if (!userRecord) return null;
        const { peak, hasActivity } = getPeakDayCount(userRecord, date, scope);
        if (!hasActivity || peak <= 0) return null;
        return { id: uid, sum: peak };
    }).filter(Boolean);
    list.sort((a, b) => compareRank(a, b, 'desc'));
    return list;
}

export function buildChaosRankData(deerData, members, { scope = 'month', date = new Date() } = {}) {
    const upToDay = date.getDate();
    const year = date.getFullYear();
    const monthKey = getMonthKey(date);
    const list = members.map((id) => {
        const uid = String(id);
        const userRecord = getUserRecord(deerData, uid);
        if (!userRecord) return null;
        let sum = 0;
        if (scope === 'year') {
            for (const [mk, monthData] of Object.entries(userRecord)) {
                if (!/^\d{4}-\d{2}$/.test(mk)) continue;
                const m = parseInt(mk.split('-')[1], 10);
                if (parseInt(mk.split('-')[0], 10) !== year) continue;
                const capDay = m === date.getMonth() + 1 ? upToDay : 31;
                sum += sumChaosActions(monthData, capDay);
            }
        } else if (scope === 'day') {
            sum = sumChaosActionsForDay(getMonthData(userRecord, date), upToDay);
        } else {
            sum = sumChaosActions(userRecord[monthKey], upToDay);
        }
        if (sum <= 0) return null;
        return { id: uid, sum };
    }).filter(Boolean);
    list.sort((a, b) => compareRank(a, b, 'desc'));
    return list;
}

/** 综合榜 / 鹿王榜（与册封同算法） */
export function buildBalancedRankData(deerData, members, { scope = 'month', date = new Date() } = {}) {
    const upToDay = date.getDate();
    const year = date.getFullYear();
    const monthKey = getMonthKey(date);
    if (scope === 'day') {
        return getDayBalancedRankInGroup(deerData, members, date);
    }
    const list = members.map((id) => {
        const uid = String(id);
        const userRecord = getUserRecord(deerData, uid);
        if (!userRecord) return null;
        let sum = 0;
        let hasActivity = false;
        if (scope === 'year') {
            const ranked = sumYearBalancedScore(userRecord, year, date, uid);
            sum = ranked.sum;
            hasActivity = ranked.hasActivity;
        } else {
            const ranked = sumMonthBalancedScore(userRecord[monthKey], upToDay, { userId: uid, date });
            sum = ranked.sum;
            hasActivity = ranked.hasActivity;
        }
        if (!hasActivity || sum <= 0) return null;
        return { id: uid, sum };
    }).filter(Boolean);
    list.sort((a, b) => compareRank(a, b, 'desc'));
    return list;
}

/** 活跃榜：玩法尝试次数 entry.a 合计 */
export function buildActiveRankData(deerData, members, { scope = 'month', date = new Date() } = {}) {
    const upToDay = date.getDate();
    const year = date.getFullYear();
    const monthKey = getMonthKey(date);
    const list = members.map((id) => {
        const uid = String(id);
        const userRecord = getUserRecord(deerData, uid);
        if (!userRecord) return null;
        let sum = 0;
        if (scope === 'day') {
            const entry = getDayEntry(getMonthData(userRecord, date), upToDay);
            if (!entry) return null;
            sum = entry.a || 0;
        } else if (scope === 'year') {
            for (const [mk, monthData] of Object.entries(userRecord)) {
                if (!/^\d{4}-\d{2}$/.test(mk)) continue;
                if (parseInt(mk.split('-')[0], 10) !== year) continue;
                const m = parseInt(mk.split('-')[1], 10);
                const cap = m === date.getMonth() + 1 ? upToDay : 31;
                sum += sumMonthActiveAttempts(monthData, cap);
            }
        } else {
            sum = sumMonthActiveAttempts(userRecord[monthKey], upToDay);
        }
        if (sum <= 0) return null;
        return { id: uid, sum };
    }).filter(Boolean);
    list.sort((a, b) => compareRank(a, b, 'desc'));
    return list;
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

/** @param {'heal'|'withdraw'|'revive'|'peak'|'chaos'|'balanced'|'active'} board */
export function getSpecialRankTitle(board, scope, date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const names = {
        heal: '奶鹿',
        withdraw: '戒师互助',
        revive: '救活',
        peak: '卷王',
        chaos: '恶趣',
        balanced: '综合',
        active: '活跃',
    };
    const name = names[board] || '排行';
    if (scope === 'year') return `${year}年${name}年榜`;
    if (scope === 'day') return `${month}月${day}日${name}日榜`;
    return `${month}月${name}月榜`;
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

/** @param {'heal'|'withdraw'|'revive'|'peak'|'chaos'|'balanced'|'active'} board */
export function getSpecialRankScopeKey(board, scope) {
    if (scope === 'day') return `day_${board}`;
    if (scope === 'year') return `year_${board}`;
    return `month_${board}`;
}

/** 榜单数值单位 */
export function getSpecialRankUnit(board) {
    if (board === 'balanced') return '分';
    return '次';
}

/** @param {'heal'|'withdraw'|'revive'|'peak'|'chaos'|'balanced'|'active'} board */
export function getSpecialRankFooter(board) {
    const footers = {
        heal: '帮🦌 + 救活×2 + 妙手技 · 永久日志 · 仅计成功',
        withdraw: '帮戒 + 清规技×2 · 永久日志 · 仅计成功',
        revive: '救活 + 妙手愈鹿 · 永久日志',
        peak: '单日最高🦌绩 · 卷王鹿主场',
        chaos: '偷咒献祭倒贴溅碰瓷擂台同归等玩法次数合计',
        balanced: BALANCED_FORMULA_HINT,
        active: '各玩法尝试次数 entry.a 合计',
    };
    return footers[board] || 'yunzai-plugin-deer-pipe';
}
