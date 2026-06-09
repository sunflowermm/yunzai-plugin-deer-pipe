import { screenshot } from '../utils/deer-screenshot.js';

import Leaderboard from "../model/leaderboard.js";

import {
    buildActiveRankData,
    buildBalancedRankData,
    buildChaosRankData,
    buildHelpRankData,
    buildPeakRankData,
    buildRankData,
    enrichRankWithMembers,
    getRankBarWidth,
    getRankMedal,
    getRankScopeKey,
    getRankTitle,
    getSpecialRankFooter,
    getSpecialRankScopeKey,
    getSpecialRankTitle,
    getSpecialRankUnit,
} from "../utils/leaderboard.js";

import { formatRankEmpty } from "../utils/messages.js";

import { REG } from "../constants/commands.js";
import { loadDeerData } from "../utils/store.js";

export class LeaderboardApp extends plugin {
    constructor() {
        super({
            name: "🦌管排行榜",
            dsc: "一个🦌管排行榜",
            event: "message",
            priority: 5000,
            bypassThrottle: true,
            rule: [
                { reg: REG.rankHealDay, fnc: "healDayLeaderboard" },
                { reg: REG.rankHealYear, fnc: "healYearLeaderboard" },
                { reg: REG.rankHeal, fnc: "healLeaderboard" },
                { reg: REG.rankWithdrawHelpDay, fnc: "withdrawHelpDayLeaderboard" },
                { reg: REG.rankWithdrawHelpYear, fnc: "withdrawHelpYearLeaderboard" },
                { reg: REG.rankWithdrawHelp, fnc: "withdrawHelpLeaderboard" },
                { reg: REG.rankPeakDay, fnc: "peakDayLeaderboard" },
                { reg: REG.rankPeakYear, fnc: "peakYearLeaderboard" },
                { reg: REG.rankPeak, fnc: "peakLeaderboard" },
                { reg: REG.rankChaosDay, fnc: "chaosDayLeaderboard" },
                { reg: REG.rankChaosYear, fnc: "chaosYearLeaderboard" },
                { reg: REG.rankChaos, fnc: "chaosLeaderboard" },
                { reg: REG.rankBalancedDay, fnc: "balancedDayLeaderboard" },
                { reg: REG.rankBalancedYear, fnc: "balancedYearLeaderboard" },
                { reg: REG.rankBalanced, fnc: "balancedLeaderboard" },
                { reg: REG.rankActiveDay, fnc: "activeDayLeaderboard" },
                { reg: REG.rankActiveYear, fnc: "activeYearLeaderboard" },
                { reg: REG.rankActive, fnc: "activeLeaderboard" },
                { reg: REG.rankReviveDay, fnc: "reviveDayLeaderboard" },
                { reg: REG.rankReviveYear, fnc: "reviveYearLeaderboard" },
                { reg: REG.rankRevive, fnc: "reviveLeaderboard" },
                { reg: REG.rankYear, fnc: "yearLeaderboard" },
                { reg: REG.rankDay, fnc: "dayLeaderboard" },
                { reg: REG.rank, fnc: "leaderboard" },
            ],
        });
    }

    async renderLeaderboard(e, scope) {
        const curGroup = e.group || Bot?.pickGroup(e.group_id);
        const membersMap = await curGroup?.getMemberMap();
        let [members, deerData] = await Promise.all([
            membersMap,
            loadDeerData(),
        ]);
        if (deerData == null || !membersMap) {
            e.reply(scope === 'day' ? '请在群内查看排行榜' : '暂无数据', true);
            return;
        }

        members = Array.from(members.keys());
        const isWithdrawal = e.msg.includes("戒") && !e.msg.includes("戒师");
        const date = new Date();
        const rankData = buildRankData(deerData, members, {
            scope,
            date,
            order: isWithdrawal ? 'asc' : 'desc',
            withdrawal: isWithdrawal,
        });
        const scopeKey = getRankScopeKey(scope, isWithdrawal);
        if (rankData.length === 0) {
            e.reply(formatRankEmpty(scopeKey), true);
            return;
        }

        const maxSum = Math.max(...rankData.map(r => Math.abs(r.sum)), 1);
        const rankDataWithMembers = await enrichRankWithMembers(rankData, membersMap);
        const enriched = rankDataWithMembers.map(item => ({
            ...item,
            medal: getRankMedal(item.order),
            barWidth: getRankBarWidth(item.sum, maxSum),
            sumDisplay: `${item.sum}次`,
        }));
        const data = await new Leaderboard(e).getData(enriched, {
            title: getRankTitle(scope, isWithdrawal, date),
            scope,
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            isWithdrawal,
            totalCount: enriched.reduce((a, b) => a + b.sum, 0),
            rankFooter: 'yunzai-plugin-deer-pipe · 上榜合计为净值之和',
            sumUnit: '次',
        });
        const img = await screenshot('yunzai-plugin-deer-pipe/leaderboard/leaderboard', data);
        e.reply(img);
    }

    async renderSpecialLeaderboard(e, { board, scope, metric = board }) {
        const curGroup = e.group || Bot?.pickGroup(e.group_id);
        const membersMap = await curGroup?.getMemberMap();
        let [members, deerData] = await Promise.all([
            membersMap,
            loadDeerData(),
        ]);
        if (deerData == null || !membersMap) {
            e.reply(scope === 'day' ? '请在群内查看排行榜' : '暂无数据', true);
            return;
        }

        members = Array.from(members.keys());
        const date = new Date();
        let rankData;
        if (board === 'heal' || board === 'withdraw' || board === 'revive') {
            rankData = await buildHelpRankData(members, { metric, scope, date });
        } else if (board === 'peak') {
            rankData = buildPeakRankData(deerData, members, { scope, date });
        } else if (board === 'balanced') {
            rankData = buildBalancedRankData(deerData, members, { scope, date });
        } else if (board === 'active') {
            rankData = buildActiveRankData(deerData, members, { scope, date });
        } else {
            rankData = buildChaosRankData(deerData, members, { scope, date });
        }

        const scopeKey = getSpecialRankScopeKey(board, scope);
        if (rankData.length === 0) {
            e.reply(formatRankEmpty(scopeKey), true);
            return;
        }

        const maxSum = Math.max(...rankData.map(r => Math.abs(r.sum)), 1);
        const rankDataWithMembers = await enrichRankWithMembers(rankData, membersMap);
        const unit = getSpecialRankUnit(board);
        const enriched = rankDataWithMembers.map(item => ({
            ...item,
            medal: getRankMedal(item.order),
            barWidth: getRankBarWidth(item.sum, maxSum),
            sumDisplay: `${item.sum}${unit}`,
        }));
        const data = await new Leaderboard(e).getData(enriched, {
            title: getSpecialRankTitle(board, scope, date),
            scope,
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            isWithdrawal: false,
            totalCount: enriched.reduce((a, b) => a + b.sum, 0),
            rankFooter: getSpecialRankFooter(board),
            sumUnit: unit,
        });
        const img = await screenshot('yunzai-plugin-deer-pipe/leaderboard/leaderboard', data);
        e.reply(img);
    }

    async leaderboard(e) {
        await this.renderLeaderboard(e, 'month');
    }

    async yearLeaderboard(e) {
        await this.renderLeaderboard(e, 'year');
    }

    async dayLeaderboard(e) {
        await this.renderLeaderboard(e, 'day');
    }

    async healLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'heal', scope: 'month', metric: 'heal' });
    }

    async healDayLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'heal', scope: 'day', metric: 'heal' });
    }

    async healYearLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'heal', scope: 'year', metric: 'heal' });
    }

    async withdrawHelpLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'withdraw', scope: 'month', metric: 'withdraw' });
    }

    async withdrawHelpDayLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'withdraw', scope: 'day', metric: 'withdraw' });
    }

    async withdrawHelpYearLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'withdraw', scope: 'year', metric: 'withdraw' });
    }

    async peakLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'peak', scope: 'month' });
    }

    async peakDayLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'peak', scope: 'day' });
    }

    async peakYearLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'peak', scope: 'year' });
    }

    async chaosLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'chaos', scope: 'month' });
    }

    async chaosDayLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'chaos', scope: 'day' });
    }

    async chaosYearLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'chaos', scope: 'year' });
    }

    async balancedLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'balanced', scope: 'month' });
    }

    async balancedDayLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'balanced', scope: 'day' });
    }

    async balancedYearLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'balanced', scope: 'year' });
    }

    async activeLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'active', scope: 'month' });
    }

    async activeDayLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'active', scope: 'day' });
    }

    async activeYearLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'active', scope: 'year' });
    }

    async reviveLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'revive', scope: 'month', metric: 'revive' });
    }

    async reviveDayLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'revive', scope: 'day', metric: 'revive' });
    }

    async reviveYearLeaderboard(e) {
        await this.renderSpecialLeaderboard(e, { board: 'revive', scope: 'year', metric: 'revive' });
    }
}
