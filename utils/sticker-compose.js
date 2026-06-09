import sharp from 'sharp';
import { FileUtils } from '../../../lib/utils/file-utils.js';
import {
    CHECK_MARK,
    DEERPIPE_LOGO,
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
    if (!FileUtils.existsSync(filePath)) return null;
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
    return loadSticker(professionArtPath(professionId), size, opts);
}

export async function loadSkillArt(professionId, size = 44) {
    return loadSticker(skillArtPath(professionId), size, {
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

export async function loadCatalogThumb(professionId, size) {
    return loadProfessionArt(professionId, size, { borderWidth: 0, shadow: false });
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

export function buildPortraitGlowSvg(cx, cy, size, color = 'rgba(255,179,71,0.35)') {
    const r = px(size * 0.55);
    return `<ellipse cx="${px(cx)}" cy="${px(cy)}" rx="${r}" ry="${px(r * 0.88)}" fill="${color}"/>`;
}
