import { getMonthData, getUserRecord } from './data.js';
import { generateImage } from './core.js';

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
