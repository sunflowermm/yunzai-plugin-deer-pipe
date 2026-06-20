import sharp from 'sharp';
import { FileUtils } from '../../../lib/utils/file-utils.js';
import {
    CHECK_MARK,
    DEERPIPE_LOGO,
    extraDeerArtPath,
    extraDeerSkillArtPath,
    professionArtPath,
    PROFESSION_CATALOG_ART,
    sectionArtPath,
    skillArtPath,
} from '../constants/deer-assets.js';
import { ART_FIT_SCALE, px, stickerOverlay } from './render-pipeline.js';

export { stickerOverlay };

/** trim 后 contain 居中到方形画布（RGBA 贴图） */
async function composeAlphaArt(filePath, size, { fitScale = ART_FIT_SCALE } = {}) {
    const box = px(size);
    const trimmed = await sharp(filePath).trim().png().toBuffer();
    const inner = Math.max(1, px(box * fitScale));
    const resized = await sharp(trimmed)
        .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    const rMeta = await sharp(resized).metadata();
    const rw = rMeta.width || inner;
    const rh = rMeta.height || inner;
    const left = px((box - rw) / 2);
    const top = px((box - rh) / 2);
    return sharp({
        create: { width: box, height: box, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
        .composite([{ input: resized, top, left }])
        .png()
        .toBuffer();
}

function wrapWithFrame(content, size, { radius, border, borderWidth, shadow }) {
    if (!borderWidth && !shadow) return content;
    const box = px(size);
    const pad = px(borderWidth) + (shadow ? 4 : 0);
    const outer = box + pad * 2;
    const shadowSvg = shadow
        ? `<ellipse cx="${outer / 2}" cy="${outer - 4}" rx="${box * 0.38}" ry="6" fill="rgba(0,0,0,0.28)"/>`
        : '';
    const frame = Buffer.from(
        `<svg width="${outer}" height="${outer}">
            ${shadowSvg}
            <rect x="${pad}" y="${pad}" width="${box}" height="${box}" rx="${radius}" ry="${radius}"
                fill="none" stroke="${border}" stroke-width="${borderWidth}"/>
        </svg>`,
    );
    return sharp(frame)
        .composite([{ input: content, top: pad, left: pad }])
        .png()
        .toBuffer();
}

export async function loadSticker(filePath, size, opts = {}) {
    if (!filePath || !FileUtils.existsSync(filePath)) return null;
    const box = px(size);
    const radius = opts.radius ?? px(box * 0.14);
    const border = opts.border ?? 'rgba(255,179,71,0.85)';
    const borderWidth = opts.borderWidth ?? 3;
    const shadow = opts.shadow !== false;
    const fitScale = opts.fitScale ?? ART_FIT_SCALE;
    try {
        let content = await composeAlphaArt(filePath, box, { fitScale });
        if (borderWidth === 0 && !shadow) return content;
        return wrapWithFrame(content, box, { radius, border, borderWidth, shadow });
    } catch {
        return null;
    }
}

export async function loadBanner(filePath, width, height) {
    if (!FileUtils.existsSync(filePath)) return null;
    try {
        const trimmed = await sharp(filePath).trim().png().toBuffer();
        return sharp(trimmed)
            .resize(px(width), px(height), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
    } catch {
        return null;
    }
}

export async function loadLogo(filePath, height) {
    if (!FileUtils.existsSync(filePath)) return null;
    try {
        const meta = await sharp(filePath).metadata();
        const h = px(height);
        const w = Math.max(1, px((meta.width / meta.height) * h));
        return sharp(filePath)
            .resize(w, h, { fit: 'inside' })
            .png()
            .toBuffer();
    } catch {
        return null;
    }
}

export async function loadProfessionArt(professionId, size, opts = {}) {
    const skinId = opts.skinId;
    const { skinId: _, ...stickerOpts } = opts;
    return loadSticker(professionArtPath(professionId, skinId), size, stickerOpts);
}

export async function loadSkillArt(professionId, size = 44, skinId = undefined) {
    return loadSticker(skillArtPath(professionId, skinId), size, {
        borderWidth: 0,
        shadow: false,
    });
}

export async function loadSectionArt(sectionKey, size = 34) {
    return loadSticker(sectionArtPath(sectionKey), size, {
        borderWidth: 0,
        shadow: false,
    });
}

export async function loadCatalogThumb(professionId, size, skinId = undefined) {
    return loadProfessionArt(professionId, size, { borderWidth: 0, shadow: false, skinId });
}

export async function loadExtraDeerArt(extraId, size, skinId = undefined, opts = {}) {
    return loadSticker(extraDeerArtPath(extraId, skinId), size, {
        borderWidth: 0,
        shadow: opts.shadow !== false,
        ...opts,
    });
}

export async function loadExtraDeerSkillArt(extraId, size = 44) {
    return loadSticker(extraDeerSkillArtPath(extraId), size, {
        borderWidth: 0,
        shadow: false,
    });
}

export async function loadCatalogArt(size = 68) {
    return loadSticker(PROFESSION_CATALOG_ART, size, { radius: 14, borderWidth: 2 });
}

export async function loadBrandLogo(height = 34) {
    return loadLogo(DEERPIPE_LOGO, height);
}

export async function loadCheckMark(size = 36) {
    return loadSticker(CHECK_MARK, size, { borderWidth: 0, shadow: false });
}

export async function loadCalendarDeerMark(size = 48) {
    return loadLogo(DEERPIPE_LOGO, size);
}

/** 半透明鹿标（铺底装饰） */
export async function loadFadedDeerMark(height, opacity = 0.22) {
    const raw = await loadLogo(DEERPIPE_LOGO, height);
    if (!raw) return null;
    try {
        const meta = await sharp(raw).metadata();
        const w = meta.width || height;
        const h = meta.height || height;
        const alpha = Math.max(0, Math.min(255, Math.round(opacity * 255)));
        const alphaBuf = Buffer.alloc(w * h, alpha);
        return sharp(raw)
            .ensureAlpha()
            .joinChannel(alphaBuf, { raw: { width: w, height: h, channels: 1 } })
            .png()
            .toBuffer();
    } catch {
        return raw;
    }
}

/**
 * 在矩形区域内随机散布半透明鹿标（与皮肤贴图共用避让逻辑）
 * @returns {Promise<{ overlays: Array<{input: Buffer, top: number, left: number}>, placedRects: Array<{left,top,width,height}> }>}
 */
export async function scatterDeerMarkOverlays(regionW, regionH, regionTop, regionLeft, opts = {}) {
    const count = opts.count ?? 8;
    const seed = opts.seed ?? 1;
    const baseHeight = opts.markHeight ?? 52;
    const opacity = opts.opacity ?? 0.2;
    const variation = opts.sizeVariation ?? 0.32;
    const minGap = opts.minGap ?? 10;
    const pad = opts.excludePad ?? 6;
    const maxAttempts = opts.maxAttempts ?? count * 80;

    if (regionW < baseHeight || regionH < baseHeight) {
        return { overlays: [], placedRects: [] };
    }

    let s = seed >>> 0;
    const rng = () => {
        s = Math.imul(s ^ (s >>> 15), 1 | s);
        return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
    };

    const expandRect = (rect, gap) => ({
        left: rect.left - gap,
        top: rect.top - gap,
        width: rect.width + gap * 2,
        height: rect.height + gap * 2,
    });
    const rectsOverlap = (a, b) => a.left < b.left + b.width
        && a.left + a.width > b.left
        && a.top < b.top + b.height
        && a.top + a.height > b.top;
    const overlapsAny = (rect, rects) => rects.some((r) => rectsOverlap(rect, r));

    const exclude = [
        ...(opts.excludeRects ?? []),
        ...(opts.occupiedRects ?? []),
    ].map((r) => expandRect(r, pad));

    const placed = [];
    const overlays = [];

    for (let n = 0; n < count; n += 1) {
        const scale = 1 - variation * 0.5 + rng() * variation;
        const markHeight = Math.max(28, Math.round(baseHeight * scale));
        const mark = await loadFadedDeerMark(markHeight, opacity);
        if (!mark) continue;
        const meta = await sharp(mark).metadata();
        const mw = meta.width || markHeight;
        const mh = meta.height || markHeight;
        if (mw > regionW - 4 || mh > regionH - 4) continue;

        let accepted = null;
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            const left = px(regionLeft + 2 + rng() * (regionW - mw - 4));
            const top = px(regionTop + 2 + rng() * (regionH - mh - 4));
            const candidate = { left, top, width: mw, height: mh };
            if (overlapsAny(candidate, exclude)) continue;
            if (placed.some((p) => rectsOverlap(candidate, expandRect(p, minGap)))) continue;
            accepted = { left, top, width: mw, height: mh, mark };
            break;
        }
        if (!accepted) continue;

        placed.push({ left: accepted.left, top: accepted.top, width: mw, height: mh });
        const o = stickerOverlay(accepted.mark, accepted.top, accepted.left);
        if (o) overlays.push(o);
    }

    const placedRects = placed.map(({ left, top, width, height }) => ({ left, top, width, height }));
    return { overlays, placedRects };
}

/** 整卡散布鹿标（帮助页等全幅背景） */
export async function scatterDeerMarkForCard(width, height, seed, opts = {}) {
    const marginTop = opts.marginTop ?? 12;
    const marginBottom = opts.marginBottom ?? 12;
    const marginLeft = opts.marginLeft ?? 8;
    const marginRight = opts.marginRight ?? 8;
    const regionW = width - marginLeft - marginRight;
    const regionH = height - marginTop - marginBottom;
    if (regionW < 48 || regionH < 48) return { overlays: [], placedRects: [] };
    return scatterDeerMarkOverlays(regionW, regionH, marginTop, marginLeft, { seed, ...opts });
}

export function buildPortraitGlowSvg(cx, cy, size, color = 'rgba(255,179,71,0.35)') {
    const r = px(size * 0.55);
    return `<ellipse cx="${px(cx)}" cy="${px(cy)}" rx="${r}" ry="${px(r * 0.88)}" fill="${color}"/>`;
}
