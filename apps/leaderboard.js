import puppeteer from "../../../lib/puppeteer/puppeteer.js";

import Leaderboard from "../model/leaderboard.js";

import {

    buildRankData,

    enrichRankWithMembers,

    getRankBarWidth,

    getRankMedal,

    getRankScopeKey,

    getRankTitle,

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
            rule: [
                { reg: REG.rank, fnc: "leaderboard" },
                { reg: REG.rankYear, fnc: "yearLeaderboard" },
                { reg: REG.rankDay, fnc: "dayLeaderboard" },
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

        const isWithdrawal = e.msg.includes("戒");

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

            sumDisplay: item.sum,

        }));



        const data = await new Leaderboard(e).getData(enriched, {

            title: getRankTitle(scope, isWithdrawal, date),

            scope,

            year: date.getFullYear(),

            month: date.getMonth() + 1,

            isWithdrawal,

            totalCount: enriched.reduce((a, b) => a + b.sum, 0),

        });

        const img = await puppeteer.screenshot("leaderboard", data);

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

}

