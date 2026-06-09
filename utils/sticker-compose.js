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

/** trim 后 contain 居中到方形画布（RGBA 贴图） */
async function composeAlphaArt(filePath, size, { fitScale = 0.92 } = {}) {
    const trimmed = await sharp(filePath).trim().png().toBuffer();
    const inner = Math.max(1, Math.round(size * fitScale));
    const resized = await sharp(trimmed)
        .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    const rMeta = await sharp(resized).metadata();
    const rw = rMeta.width || inner;
    const rh = rMeta.height || inner;
    const left = Math.round((size - rw) / 2);
    const top = Math.round((size - rh) / 2);
    return sharp({
        create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
        .composite([{ input: resized, top, left }])
        .png()
        .toBuffer();
}

function wrapWithFrame(content, size, { radius, border, borderWidth, shadow }) {
    if (!borderWidth && !shadow) return content;
    const pad = borderWidth + (shadow ? 4 : 0);
    const outer = size + pad * 2;
    const shadowSvg = shadow
        ? `<ellipse cx="${outer / 2}" cy="${outer - 4}" rx="${size * 0.38}" ry="6" fill="rgba(0,0,0,0.28)"/>`
        : '';
    const frame = Buffer.from(
        `<svg width="${outer}" height="${outer}">
            ${shadowSvg}
            <rect x="${pad}" y="${pad}" width="${size}" height="${size}" rx="${radius}" ry="${radius}"
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
    const radius = opts.radius ?? Math.round(size * 0.14);
    const border = opts.border ?? 'rgba(255,179,71,0.85)';
    const borderWidth = opts.borderWidth ?? 3;
    const shadow = opts.shadow !== false;
    try {
        let content = await composeAlphaArt(filePath, size, { fitScale: opts.fitScale ?? 0.92 });
        if (borderWidth === 0 && !shadow) return content;
        return wrapWithFrame(content, size, { radius, border, borderWidth, shadow });
    } catch {
        return null;
    }
}

export async function loadBanner(filePath, width, height) {
    if (!FileUtils.existsSync(filePath)) return null;
    try {
        const trimmed = await sharp(filePath).trim().png().toBuffer();
        return sharp(trimmed)
            .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
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
        const w = Math.max(1, Math.round((meta.width / meta.height) * height));
        return sharp(filePath)
            .resize(w, height, { fit: 'inside' })
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
        fitScale: 0.88,
        borderWidth: 0,
        shadow: false,
    });
}

export async function loadSectionArt(sectionKey, size = 34) {
    return loadSticker(sectionArtPath(sectionKey), size, {
        fitScale: 0.85,
        borderWidth: 0,
        shadow: false,
    });
}

export async function loadCatalogThumb(professionId, size) {
    return loadProfessionArt(professionId, size, {
        fitScale: 0.92,
        borderWidth: 0,
        shadow: false,
    });
}

export async function loadCatalogArt(size = 68) {
    return loadSticker(PROFESSION_CATALOG_ART, size, { radius: 14, borderWidth: 2, fitScale: 0.9 });
}

export async function loadBrandLogo(height = 34) {
    return loadLogo(DEERPIPE_LOGO, height);
}

export async function loadCheckMark(size = 36) {
    return loadSticker(CHECK_MARK, size, { fitScale: 0.95, borderWidth: 0, shadow: false });
}

export async function loadCalendarDeerMark(size = 48) {
    return loadLogo(DEERPIPE_LOGO, Math.round(size * 0.82));
}

export function buildPortraitGlowSvg(cx, cy, size, color = 'rgba(255,179,71,0.35)') {
    const r = Math.round(size * 0.55);
    return `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${Math.round(r * 0.88)}" fill="${color}"/>`;
}

export function stickerOverlay(buffer, top, left) {
    if (!buffer) return null;
    return { input: buffer, top: Math.round(top), left: Math.round(left) };
}
