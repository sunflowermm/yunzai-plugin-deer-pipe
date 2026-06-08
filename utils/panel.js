import { UI_MESSAGES } from '../constants/game.js';
import { getMonthData, getUserRecord, isDayDead } from './data.js';
import { generateImage, generateStatusImage } from './core.js';
import { generatePlayfulCard } from './card-render.js';

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

/**
 * 恶趣味/互动：结构化卡片 + 可选月历面板
 */
export async function replyPlayfulResult(e, {
    text,
    result,
    helperName,
    targetName,
    extraLines = [],
    date,
    name,
    userId,
    deerData,
    dayOverride = null,
    withPanel = false,
}) {
    const card = await generatePlayfulCard({
        result,
        helperName,
        targetName,
        headline: text?.split('\n')[0] || '',
        extraLines,
    });
    const parts = [segment.image(card)];
    if (text) parts.unshift(text);

    if (withPanel && userId && deerData && date) {
        const monthData = getMonthData(getUserRecord(deerData, userId), date);
        const highlightDay = dayOverride ?? date.getDate();
        const entry = monthData?.[String(highlightDay)];
        const raw = await generateImage(date, name, monthData, {
            highlightDay,
            forceDeadBanner: isDayDead(entry),
        });
        parts.push(segment.image(raw));
    }

    await e.reply(parts, true);
}

export async function replyWeatherCard(e, { caption, imageBuffer }) {
    const parts = caption ? [caption, segment.image(imageBuffer)] : [segment.image(imageBuffer)];
    await e.reply(parts, true);
}
