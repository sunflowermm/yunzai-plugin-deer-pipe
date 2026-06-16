/**
 * UI 皮肤散布贴图：AI 生图 PNG，半透明随机铺满背景（仅避让鹿标/关键占位）
 */

import sharp from 'sharp';
import { FileUtils } from '../../../../lib/utils/file-utils.js';
import { getUiSkinPack } from '../../constants/ui-skin-registry.js';
import { loadEmojiRaster } from '../emoji-compose.js';
import { px, stickerOverlay } from '../render-pipeline.js';
import { hashSeed } from '../svg-base.js';
import { uiSkinComponentPath } from './skin-assets.js';

export function resolveSkinStickerProfile(uiSkinId) {
    const pack = getUiSkinPack(uiSkinId);
    const fallback = getUiSkinPack('default').sticker || {};
    return { ...fallback, ...(pack.sticker || {}) };
}

function createRng(seed) {
    let s = (seed >>> 0) || 1;
    return () => {
        s = Math.imul(s ^ (s >>> 15), 1 | s);
        return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
    };
}

function expandRect(rect, pad) {
    return {
        left: rect.left - pad,
        top: rect.top - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
    };
}

function rectsOverlap(a, b) {
    return a.left < b.left + b.width
        && a.left + a.width > b.left
        && a.top < b.top + b.height
        && a.top + a.height > b.top;
}

function overlapsAny(rect, rects) {
    return rects.some((r) => rectsOverlap(rect, r));
}

/** 从 overlay 层推算占位矩形（避让鹿标等） */
export async function overlayPlacedRect(overlay, pad = 6) {
    if (!overlay?.input) return null;
    try {
        const meta = await sharp(overlay.input).metadata();
        const w = meta.width || 0;
        const h = meta.height || 0;
        if (!w || !h) return null;
        return expandRect({
            left: overlay.left ?? 0,
            top: overlay.top ?? 0,
            width: w,
            height: h,
        }, pad);
    } catch {
        return null;
    }
}

function buildPlacementZones(regionW, regionH, regionTop, regionLeft, profile) {
    if (profile.placement === 'edge') {
        const gutter = profile.edgeGutter ?? 0.14;
        const gw = Math.max(32, Math.round(regionW * gutter));
        const zones = [
            { left: regionLeft, top: regionTop, width: gw, height: regionH },
            { left: regionLeft + regionW - gw, top: regionTop, width: gw, height: regionH },
        ];
        const bottomRatio = profile.bottomBandRatio ?? 0.18;
        const bottomH = Math.round(regionH * bottomRatio);
        if (bottomH >= 32 && regionW > gw * 2 + 40) {
            zones.push({
                left: regionLeft + gw,
                top: regionTop + regionH - bottomH,
                width: regionW - gw * 2,
                height: bottomH,
            });
        }
        return zones.filter((z) => z.width >= 24 && z.height >= 24);
    }
    return [{ left: regionLeft, top: regionTop, width: regionW, height: regionH }];
}

async function applyOpacity(buf, opacity) {
    const op = Math.max(0, Math.min(1, opacity));
    if (op >= 0.99) return buf;
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 3; i < data.length; i += 4) {
        data[i] = Math.round(data[i] * op);
    }
    return sharp(data, {
        raw: { width: info.width, height: info.height, channels: 4 },
    }).png().toBuffer();
}

export async function loadSkinSticker(uiSkinId, size, opts = {}) {
    const box = px(size);
    const abs = uiSkinComponentPath(uiSkinId, 'skinSticker');
    let buf = null;
    if (abs && FileUtils.existsSync(abs)) {
        try {
            const trimmed = await sharp(abs).trim().png().toBuffer();
            buf = await sharp(trimmed)
                .resize(box, box, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .png()
                .toBuffer();
        } catch { /* fall through */ }
    }
    if (!buf) {
        const fallbackEmoji = { default: '❤️', duanwu: '🫔' }[uiSkinId];
        if (fallbackEmoji) buf = await loadEmojiRaster(fallbackEmoji, box);
    }
    if (!buf) return null;
    if (opts.opacity == null) return buf;
    return applyOpacity(buf, opts.opacity);
}

async function resizeSticker(baseBuf, size) {
    const box = px(size);
    return sharp(baseBuf)
        .resize(box, box, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
}

export async function scatterSkinStickers(uiSkinId, regionW, regionH, regionTop, regionLeft, opts = {}) {
    const profile = resolveSkinStickerProfile(uiSkinId);
    if (profile.enabled === false) return [];

    const count = opts.count ?? profile.count ?? 10;
    const baseSize = px(opts.size ?? profile.size ?? 40);
    const opacity = opts.opacity ?? profile.opacity ?? 0.2;
    const variation = opts.sizeVariation ?? profile.sizeVariation ?? 0.32;
    const minGap = opts.minGap ?? profile.minGap ?? 10;
    const maxAttempts = opts.maxAttempts ?? count * 80;
    const seed = opts.seed ?? hashSeed('skin-sticker', uiSkinId, regionW, regionH);
    const rng = createRng(seed);

    const zones = buildPlacementZones(regionW, regionH, regionTop, regionLeft, {
        ...profile,
        placement: opts.placement ?? profile.placement,
        edgeGutter: opts.edgeGutter ?? profile.edgeGutter,
        bottomBandRatio: opts.bottomBandRatio ?? profile.bottomBandRatio,
    });
    if (!zones.length) return [];

    const baseMark = await loadSkinSticker(uiSkinId, Math.round(baseSize * (1 + variation * 0.5)), { opacity });
    if (!baseMark) return [];

    const pad = profile.excludePad ?? 8;
    const exclude = [
        ...(opts.excludeRects ?? profile.excludeRects ?? []),
        ...(opts.occupiedRects ?? profile.occupiedRects ?? []),
    ].map((r) => expandRect(r, pad));

    const placed = [];
    const overlays = [];

    for (let n = 0; n < count; n += 1) {
        const scale = 1 - variation * 0.5 + rng() * variation;
        const size = Math.max(24, Math.round(baseSize * scale));
        let accepted = null;

        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            const zone = zones[Math.floor(rng() * zones.length)];
            const mw = Math.min(size, zone.width - 4);
            const mh = Math.min(size, zone.height - 4);
            if (mw < 20 || mh < 20) continue;

            const left = px(zone.left + 2 + rng() * (zone.width - mw - 4));
            const top = px(zone.top + 2 + rng() * (zone.height - mh - 4));
            const candidate = { left, top, width: mw, height: mh };

            if (overlapsAny(candidate, exclude)) continue;
            if (placed.some((p) => rectsOverlap(candidate, expandRect(p, minGap)))) continue;

            accepted = { left, top, width: mw, height: mh };
            break;
        }
        if (!accepted) continue;

        placed.push(accepted);
        const mark = await resizeSticker(baseMark, accepted.width);
        const o = stickerOverlay(mark, accepted.top, accepted.left);
        if (o) overlays.push(o);
    }
    return overlays;
}

export async function scatterSkinStickersForCard(uiSkinId, width, height, seed, profileOverride = {}) {
    const profile = { ...resolveSkinStickerProfile(uiSkinId), ...profileOverride };
    const marginTop = profile.marginTop ?? 64;
    const marginBottom = profile.marginBottom ?? 32;
    const marginLeft = profile.marginLeft ?? 8;
    const marginRight = profile.marginRight ?? 8;
    const regionH = height - marginTop - marginBottom;
    const regionW = width - marginLeft - marginRight;
    if (regionH < 36 || regionW < 64) return [];

    const defaultExclude = profile.placement === 'edge' ? [{
        left: Math.round(width * (profile.centerExcludeX ?? 0.1)),
        top: marginTop,
        width: Math.round(width * (profile.centerExcludeW ?? 0.8)),
        height: regionH,
    }] : [];

    const excludeRects = profile.excludeRects ?? defaultExclude;

    return scatterSkinStickers(uiSkinId, regionW, regionH, marginTop, marginLeft, {
        count: profile.count,
        size: profile.size,
        opacity: profile.opacity,
        sizeVariation: profile.sizeVariation,
        minGap: profile.minGap,
        placement: profile.placement,
        seed,
        excludeRects,
        occupiedRects: profile.occupiedRects,
        edgeGutter: profile.edgeGutter,
        bottomBandRatio: profile.bottomBandRatio,
    });
}
