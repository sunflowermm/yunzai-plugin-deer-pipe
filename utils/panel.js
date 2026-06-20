import { UI_MESSAGES } from '../constants/game.js';
import { getMonthData, getUserRecord, isDayDead } from './data.js';
import { generateImage, generateStatusImage } from './core.js';
import { generateInteractionCard } from './card-render.js';
import {
    resolveExtraDeerCatalogImage,
    resolveProfessionCatalogImage,
    resolveProfessionCard,
} from './prebuilt-images.js';
import { resolveSkinContext } from './skin.js';

/** 从 deerData + userId 解析出图皮肤（避免各 app 漏 import getUserRecord） */
export function skinCtxForSender(deerData, userId, date = new Date(), professionId = null) {
    return resolveSkinContext(getUserRecord(deerData, userId), date, professionId);
}

export async function replyStatusPanel(e, { date, name, status, isAt = false, userRecord = null }) {
    const skinCtx = resolveSkinContext(userRecord, date, status.professionId);
    const raw = await generateStatusImage(date, name, status, skinCtx);
    await e.reply([UI_MESSAGES.status_panel(isAt), segment.image(raw)], true);
}

export async function replyDeerPanel(e, { date, name, userId, deerData, text, dayOverride = null }) {
    const userRecord = getUserRecord(deerData, userId);
    const monthData = getMonthData(userRecord, date);
    const highlightDay = dayOverride ?? date.getDate();
    const entry = monthData?.[String(highlightDay)];
    const skinCtx = resolveSkinContext(userRecord, date);
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
            ? skinCtxForSender(deerData, userId, date)
            : resolveSkinContext(null, date),
    });
    const parts = [segment.image(card)];
    if (text) parts.unshift(text);
    if (withPanel && userId && deerData && date) {
        const userRecord = getUserRecord(deerData, userId);
        const monthData = getMonthData(userRecord, date);
        const highlightDay = dayOverride ?? date.getDate();
        const entry = monthData?.[String(highlightDay)];
        const skinCtx = resolveSkinContext(userRecord, date);
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

/** 职业一览图（八职业预渲染 + 番外预渲染） */
export async function replyProfessionCatalog(e, {
    snapshot,
    userRecord = null,
    date = new Date(),
    /** 已转职时先回配额文字，再读预渲染图（避免顶栏快照拖慢整图） */
    preamble = '',
} = {}) {
    const skinCtx = resolveSkinContext(userRecord, date);
    const imagesPromise = Promise.all([
        resolveProfessionCatalogImage({ skinCtx, date, userRecord, ...(snapshot ? { snapshot } : {}) }),
        resolveExtraDeerCatalogImage({ skinCtx, date, userRecord }),
    ]);
    if (preamble) {
        await e.reply(preamble, true);
    }
    const [mainRaw, extraRaw] = await imagesPromise;
    await e.reply([segment.image(mainRaw), segment.image(extraRaw)], true);
}

/** 单职业卡（预渲染 · 非默认立绘皮肤时 live） */
export async function replyProfessionCard(e, {
    professionId,
    text,
    userRecord = null,
    date = new Date(),
    /** 先回文字再出图，缩短首条消息等待（上传 PNG 往往占大头） */
    textFirst = false,
} = {}) {
    const skinCtx = resolveSkinContext(userRecord, date, professionId);
    if (textFirst && text) {
        await e.reply(text, true);
        const raw = await resolveProfessionCard(professionId, { skinCtx, date });
        await e.reply(segment.image(raw), true);
        return;
    }
    const raw = await resolveProfessionCard(professionId, { skinCtx, date });
    const parts = text ? [text, segment.image(raw)] : [segment.image(raw)];
    await e.reply(parts, true);
}
