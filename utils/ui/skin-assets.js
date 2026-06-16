import sharp from 'sharp';
import { FileUtils } from '../../../../lib/utils/file-utils.js';
import { ASSET_ROOT } from '../../constants/deer-assets.js';
import { getUiSkinPack } from '../../constants/ui-skin-registry.js';
import { loadSticker, stickerOverlay } from '../sticker-compose.js';

export function uiSkinComponentRel(skinId, componentKey) {
    const pack = getUiSkinPack(skinId);
    return pack.components?.[componentKey] || null;
}

export function uiSkinComponentPath(skinId, componentKey) {
    const rel = uiSkinComponentRel(skinId, componentKey);
    return rel ? `${ASSET_ROOT}/${rel}` : null;
}

export function uiSkinComponentExists(skinId, componentKey) {
    const abs = uiSkinComponentPath(skinId, componentKey);
    return !!(abs && FileUtils.existsSync(abs));
}

function pngDataUrl(buf) {
    return `data:image/png;base64,${buf.toString('base64')}`;
}

function chromeLayout(uiSkinId) {
    const pack = getUiSkinPack(uiSkinId);
    return {
        ribbonHeight: pack.chrome?.ribbonHeight ?? 28,
        cornerSize: pack.chrome?.cornerSize ?? 36,
        headerTextShift: pack.chrome?.headerTextShift ?? 22,
    };
}

/** 有顶栏丝带资源时，标题区整体下移像素 */
export function statusHeaderOffset(uiSkinId) {
    return uiSkinComponentExists(uiSkinId, 'headerRibbon')
        ? chromeLayout(uiSkinId).headerTextShift
        : 0;
}

async function dimAlpha(buf, factor = 0.22) {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 3; i < data.length; i += 4) {
        data[i] = Math.round(data[i] * factor);
    }
    return sharp(data, {
        raw: { width: info.width, height: info.height, channels: 4 },
    }).png().toBuffer();
}

export async function loadUiSkinComponent(skinId, componentKey, size, opts = {}) {
    const rel = uiSkinComponentRel(skinId, componentKey);
    if (!rel) return null;
    const abs = `${ASSET_ROOT}/${rel}`;
    if (!FileUtils.existsSync(abs)) return null;
    if (opts.banner) {
        return loadBanner(abs, opts.width ?? size, opts.height ?? size);
    }
    return loadSticker(abs, size, {
        borderWidth: 0,
        shadow: opts.shadow !== false,
        ...opts,
    });
}

/** 裁左上角饰纹；右角用水平翻转（资源应无角色、仅角饰） */
async function loadCornerAccent(skinId, cornerSize) {
    const abs = uiSkinComponentPath(skinId, 'frameCorner');
    if (!abs || !FileUtils.existsSync(abs)) return null;
    try {
        const accent = await sharp(abs)
            .trim()
            .resize(cornerSize, cornerSize, {
                fit: 'inside',
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .png()
            .toBuffer();
        const accentMeta = await sharp(accent).metadata();
        const aw = accentMeta.width || cornerSize;
        const ah = accentMeta.height || cornerSize;
        return {
            left: accent,
            right: await sharp(accent).flop().png().toBuffer(),
            width: aw,
            height: ah,
        };
    } catch {
        return null;
    }
}

async function loadRibbonStrip(skinId, width, ribbonHeight) {
    const ribbonPath = uiSkinComponentPath(skinId, 'headerRibbon');
    if (!ribbonPath || !FileUtils.existsSync(ribbonPath)) return null;
    try {
        const trimmed = await sharp(ribbonPath).trim().png().toBuffer();
        return sharp(trimmed)
            .resize(width, ribbonHeight, { fit: 'cover', position: 'north' })
            .png()
            .toBuffer();
    } catch {
        return null;
    }
}

/**
 * 嵌入 SVG 的顶栏装饰（在文字下层，不遮挡标题）
 * @returns {Promise<string>}
 */
export async function buildChromeSvgFragment(uiSkinId, width) {
    const { ribbonHeight, cornerSize } = chromeLayout(uiSkinId);
    const parts = [];

    const ribbonPath = uiSkinComponentPath(uiSkinId, 'headerRibbon');
    if (ribbonPath && FileUtils.existsSync(ribbonPath)) {
        const buf = await loadRibbonStrip(uiSkinId, width, ribbonHeight);
        if (buf) {
            const href = pngDataUrl(buf);
            parts.push(
                `<image href="${href}" x="0" y="0" width="${width}" height="${ribbonHeight}" preserveAspectRatio="xMidYMin meet" opacity="0.88"/>`,
            );
        }
    }

    const accent = await loadCornerAccent(uiSkinId, cornerSize);
    if (accent) {
        const pad = 8;
        parts.push(
            `<image href="${pngDataUrl(accent.left)}" x="${pad}" y="${pad}" width="${accent.width}" height="${accent.height}" opacity="0.9"/>`,
            `<image href="${pngDataUrl(accent.right)}" x="${width - accent.width - pad}" y="${pad}" width="${accent.width}" height="${accent.height}" opacity="0.9"/>`,
        );
    }

    return parts.join('\n');
}

/** 月历水印（低透明度居中） */
export async function composeCalendarWatermark(skinId, width, height) {
    const wmSize = Math.min(240, Math.round(width * 0.34));
    let buf = await loadUiSkinComponent(skinId, 'calendarWatermark', wmSize, { shadow: false });
    if (!buf) return null;
    buf = await dimAlpha(buf, 0.2);
    return stickerOverlay(buf, Math.round((height - wmSize) / 2), Math.round((width - wmSize) / 2));
}
