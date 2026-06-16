import { generateImage, generateYearImage } from "../utils/core.js";
import { cleanCommandMsg, REG } from "../constants/commands.js";
import { resolveSubjectUser } from "../utils/plugin-common.js";
import { loadDeerData } from "../utils/store.js";
import { getUserRecord, hasMonthData, hasYearData, parseMonthInput } from "../utils/data.js";
import { skinCtxForSender } from "../utils/panel.js";

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

    async yearCalendar(e) {
        const subject = await resolveSubjectUser(e);
        const { userId, name } = subject;
        const deerData = await loadDeerData();
        const userRecord = getUserRecord(deerData, userId);
        const now = new Date();
        if (!hasYearData(userRecord, now.getFullYear())) {
            e.reply("你今年还没有🦌过呢，先来一发🦌吧~", true);
            return;
        }

        const skinCtx = skinCtxForSender(deerData, userId, now);
        const raw = await generateYearImage(now, name, userRecord, { skinCtx });
        await e.reply(["📅 你的年度🦌历：", segment.image(raw)], true);
    }

    async viewYearCalendar(e) {
        const subject = await resolveSubjectUser(e);
        const deerData = await loadDeerData();
        const userRecord = getUserRecord(deerData, subject.userId);
        const now = new Date();
        if (!hasYearData(userRecord, now.getFullYear())) {
            e.reply(subject.isAt ? "ta今年还没有🦌过呢~" : "你今年还没有🦌过呢~", true);
            return;
        }

        const skinCtx = skinCtxForSender(deerData, subject.userId, now);
        const raw = await generateYearImage(now, subject.name, userRecord, { skinCtx });
        await e.reply(["📅 🦌历如下：", segment.image(raw)], true);
    }

    async monthCalendar(e) {
        const cleaned = cleanCommandMsg(e.msg);
        const match = cleaned.match(/(🦌|鹿)历(\d{4}-\d{1,2}|\d{1,2})$/);
        const parsed = match ? parseMonthInput(match[2]) : null;
        if (!parsed) {
            e.reply("日期格式不对，试试 `🦌历6` 或 `🦌历2025-06`", true);
            return;
        }

        const subject = await resolveSubjectUser(e);
        const { userId, name } = subject;
        const deerData = await loadDeerData();
        const userRecord = getUserRecord(deerData, userId);
        if (!hasMonthData(userRecord, parsed)) {
            e.reply(`${parsed.getFullYear()}年${parsed.getMonth() + 1}月还没有🦌记录~`, true);
            return;
        }

        const monthData = userRecord[`${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`];
        const skinCtx = skinCtxForSender(deerData, userId, parsed);
        const raw = await generateImage(parsed, name, monthData, { skinCtx });
        await e.reply([`${parsed.getFullYear()}年${parsed.getMonth() + 1}月🦌历：`, segment.image(raw)], true);
    }
}
