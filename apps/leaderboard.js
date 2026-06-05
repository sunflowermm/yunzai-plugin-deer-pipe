import puppeteer from "../../../lib/puppeteer/puppeteer.js";
import Leaderboard from "../model/leaderboard.js";
import {
    buildRankData,
    enrichRankWithMembers,
    getRankBarWidth,
    getRankMedal,
    getRankTitle,
} from "../utils/leaderboard.js";
import { formatRankEmpty } from "../utils/messages.js";
import { loadDeerData } from "../utils/store.js";
export class LeaderboardApp extends plugin {
    constructor() {
        super({
            name: "🦌管排行榜",
            dsc: "一个🦌管排行榜",
            event: "message",
            priority: 5000,
            rule: [
                {
                    reg: "^(🦌|鹿|戒🦌|戒鹿)榜$",
                    fnc: "leaderboard",
                },
                {
                    reg: "^(🦌|鹿|戒🦌|戒鹿)年榜$",
                    fnc: "yearLeaderboard",
                }
            ]
        })
    }

    async renderLeaderboard(e, scope) {
        const curGroup = e.group || Bot?.pickGroup(e.group_id);
        const membersMap = await curGroup?.getMemberMap();
        let [members, deerData] = await Promise.all([
            membersMap,
            loadDeerData(),
        ]);
        if (deerData == null) return;

        members = Array.from(members.keys());
        const isWithdrawal = e.msg.includes("戒");
        const date = new Date();
        const rankData = buildRankData(deerData, members, {
            scope,
            date,
            order: isWithdrawal ? 'asc' : 'desc',
        });

        if (rankData.length === 0) {
            e.reply(formatRankEmpty(scope), true);
            return;
        }

        const maxSum = Math.max(...rankData.map(r => r.sum), 1);
        const rankDataWithMembers = await enrichRankWithMembers(rankData, membersMap);
        const enriched = rankDataWithMembers.map(item => ({
            ...item,
            medal: getRankMedal(item.order),
            barWidth: getRankBarWidth(item.sum, maxSum),
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
}
