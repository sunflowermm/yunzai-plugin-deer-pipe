import { UI_MESSAGES } from '../constants/game.js';
import { getMonthData, getUserRecord, isDayDead } from './data.js';
import { generateImage, generateStatusImage } from './core.js';
import { generateInteractionCard } from './card-render.js';
import { generateUserProfessionPanel } from './profession-render.js';
import {
    resolveProfessionCatalogImage,
    resolveProfessionCard,
} from './prebuilt-images.js';
import { resolveSkinContext } from './skin.js';

function skinCtxForUser(userRecord, date, professionId = null) {
    return resolveSkinContext(userRecord, date, professionId);
}

export async function replyStatusPanel(e, { date, name, status, isAt = false, userRecord = null }) {
    const skinCtx = skinCtxForUser(userRecord, date, status.professionId);
    const raw = await generateStatusImage(date, name, status, skinCtx);
    await e.reply([UI_MESSAGES.status_panel(isAt), segment.image(raw)], true);
}

export async function replyDeerPanel(e, { date, name, userId, deerData, text, dayOverride = null }) {
    const userRecord = getUserRecord(deerData, userId);
    const monthData = getMonthData(userRecord, date);
    const highlightDay = dayOverride ?? date.getDate();
    const entry = monthData?.[String(highlightDay)];
    const skinCtx = skinCtxForUser(userRecord, date);
    const raw = await generateImage(date, name, monthData, {
        highlightDay,
        forceDeadBanner: entry?.d === 1,
        skinCtx,
    });
    await e.reply([text, segment.image(raw)], true);
}

/**
 * 互动 / PK / 恶趣味：结构化卡片（可选双头像）+ 可选月历面板
 */
export async function replyInteractionResult(e, {
    text,
    result,
    helperName,
    targetName,
    helperId,
    targetId,
    extraLines = [],
    subtitle = '',
    date,
    name,
    userId,
    deerData,
    dayOverride = null,
    withPanel = false,
    duel = false,
}) {
    const card = await generateInteractionCard({
        result,
        helperName,
        targetName,
        helperId,
        targetId,
        headline: text?.split('\n')[0] || '',
        extraLines,
        duel,
        subtitle,
        skinCtx: userId && deerData && date
            ? skinCtxForUser(getUserRecord(deerData, userId), date)
            : resolveSkinContext(null, date),
    });
    const parts = [segment.image(card)];
    if (text) parts.unshift(text);
    if (withPanel && userId && deerData && date) {
        const userRecord = getUserRecord(deerData, userId);
        const monthData = getMonthData(userRecord, date);
        const highlightDay = dayOverride ?? date.getDate();
        const entry = monthData?.[String(highlightDay)];
        const skinCtx = skinCtxForUser(userRecord, date);
        const raw = await generateImage(date, name, monthData, {
            highlightDay,
            forceDeadBanner: isDayDead(entry),
            skinCtx,
        });
        parts.push(segment.image(raw));
    }

    await e.reply(parts, true);
}

export async function replyWeatherCard(e, { caption, imageBuffer }) {
    const parts = caption ? [caption, segment.image(imageBuffer)] : [segment.image(imageBuffer)];
    await e.reply(parts, true);
}

/** 职业一览图（配额/联动/专属技已渲染进图） */
export async function replyProfessionCatalog(e, { snapshot, userRecord = null, date = new Date() } = {}) {
    const skinCtx = skinCtxForUser(userRecord, date);
    const raw = await resolveProfessionCatalogImage({ snapshot, skinCtx });
    await e.reply([segment.image(raw)], true);
}

/** 用户当日职业配额面板（含已用，纯图） */
export async function replyUserProfessionPanel(e, { monthData, day, text, userRecord = null, date = new Date() }) {
    const skinCtx = skinCtxForUser(userRecord, date);
    const raw = await generateUserProfessionPanel(monthData, day, { skinCtx });
    const parts = text ? [text, segment.image(raw)] : [segment.image(raw)];
    await e.reply(parts, true);
}

/** 单职业专精卡（转职成功等） */
export async function replyProfessionCard(e, { professionId, text, monthData = null, day = null, userRecord = null, date = new Date() }) {
    const skinCtx = skinCtxForUser(userRecord, date, professionId);
    const raw = (monthData != null && day != null)
        ? await generateUserProfessionPanel(monthData, day, { skinCtx })
        : await resolveProfessionCard(professionId, { skinCtx });
    const parts = text ? [text, segment.image(raw)] : [segment.image(raw)];
    await e.reply(parts, true);
}
