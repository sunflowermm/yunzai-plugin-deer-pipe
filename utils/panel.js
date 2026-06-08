import { UI_MESSAGES } from '../constants/game.js';
import { getMonthData, getUserRecord } from './data.js';
import { generateImage, generateStatusImage } from './core.js';

export async function replyStatusPanel(e, { date, name, status, isAt = false }) {
    const raw = await generateStatusImage(date, name, status);
    await e.reply([UI_MESSAGES.status_panel(isAt), segment.image(raw)], true);
}

export async function replyDeerPanel(e, { date, name, userId, deerData, text, dayOverride = null }) {
    const monthData = getMonthData(getUserRecord(deerData, userId), date);
    const highlightDay = dayOverride ?? date.getDate();
    const entry = monthData?.[String(highlightDay)];
    const raw = await generateImage(date, name, monthData, {
        highlightDay,
        forceDeadBanner: entry?.d === 1,
    });
    await e.reply([text, segment.image(raw)], true);
}
