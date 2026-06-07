import {
    getUserRecord,
    hasMonthData,
    hasYearData,
    parseMonthInput,
} from "../utils/data.js";
import { generateImage, generateYearImage } from "../utils/core.js";
import { REG } from "../constants/commands.js";
import { loadDeerData } from "../utils/store.js";

export class CalendarApp extends plugin {
    constructor() {
        super({
            name: "🦌历",
            dsc: "查看年度/历史🦌历",
            event: "message",
            priority: 5000,
            bypassThrottle: true,
            rule: [
                { reg: REG.calendarYear, fnc: "yearCalendar" },
                { reg: REG.calendarView, fnc: "viewYearCalendar" },
                { reg: REG.calendarMonth, fnc: "monthCalendar" },
            ],
        });
    }

    resolveTargetUser(e) {
        if (e.at) {
            return { userId: e.at, isAt: true };
        }
        return { userId: e.sender.user_id, isAt: false };
    }

    async getUserDisplayName(e, userId) {
        const curGroup = e.group || Bot?.pickGroup(e.group_id);
        const membersMap = await curGroup?.getMemberMap();
        const info = membersMap?.get(parseInt(userId));
        return info?.card || info?.nickname || String(userId);
    }

    async yearCalendar(e) {
        const { userId } = this.resolveTargetUser(e);
        const name = await this.getUserDisplayName(e, userId);
        const deerData = await loadDeerData();
        const userRecord = getUserRecord(deerData, userId);
        const now = new Date();

        if (!hasYearData(userRecord, now.getFullYear())) {
            e.reply("你今年还没有🦌过呢，先来一发🦌吧~", true);
            return;
        }

        const raw = await generateYearImage(now, name, userRecord);
        await e.reply(["📅 你的年度🦌历：", segment.image(raw)], true);
    }

    async viewYearCalendar(e) {
        let user, isAt = false;
        if (e.at) {
            const curGroup = e.group || Bot?.pickGroup(e.group_id);
            const membersMap = await curGroup?.getMemberMap();
            user = membersMap.get(parseInt(e.at));
            isAt = true;
        } else {
            user = e.sender;
        }

        const { user_id, card, nickname } = user;
        const deerData = await loadDeerData();
        const userRecord = getUserRecord(deerData, user_id);
        const now = new Date();

        if (!hasYearData(userRecord, now.getFullYear())) {
            e.reply(isAt ? "ta今年还没有🦌过呢~" : "你今年还没有🦌过呢~", true);
            return;
        }

        const raw = await generateYearImage(now, card || nickname, userRecord);
        await e.reply(["📅 🦌历如下：", segment.image(raw)], true);
    }

    async monthCalendar(e) {
        const match = e.msg.match(/(🦌|鹿)历(\d{4}-\d{1,2}|\d{1,2})$/);
        const parsed = parseMonthInput(match[2]);
        if (!parsed) {
            e.reply("日期格式不对，试试 `🦌历6` 或 `🦌历2025-06`", true);
            return;
        }

        const { userId } = this.resolveTargetUser(e);
        const name = await this.getUserDisplayName(e, userId);
        const deerData = await loadDeerData();
        const userRecord = getUserRecord(deerData, userId);

        if (!hasMonthData(userRecord, parsed)) {
            e.reply(`${parsed.getFullYear()}年${parsed.getMonth() + 1}月还没有🦌记录~`, true);
            return;
        }

        const monthData = userRecord[`${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`];
        const raw = await generateImage(parsed, name, monthData);
        await e.reply([`${parsed.getFullYear()}年${parsed.getMonth() + 1}月🦌历：`, segment.image(raw)], true);
    }
}
