import sharp from 'sharp';
import { FileUtils } from '../../../../lib/utils/file-utils.js';
import { ASSET_ROOT } from '../../constants/deer-assets.js';
import { getUiSkinPack } from '../../constants/ui-skin-registry.js';
import { loadSticker, stickerOverlay } from '../sticker-compose.js';
import { scatterSkinStickersForCard } from './skin-stickers.js';
import { hashSeed } from '../svg-base.js';

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

/** @typedef {{ ribbonMaxHeight: number, cornerWidth: number, cornerHeight: number, cornerPad: number, headerTextShift: number }} ChromeLayout */

function chromeLayout(uiSkinId, cardWidth = 520) {
    const pack = getUiSkinPack(uiSkinId);
    const chrome = pack.chrome || {};
    const cornerWidth = chrome.cornerWidth
        ?? Math.min(120, Math.round(cardWidth * 0.22));
    const cornerHeight = chrome.cornerHeight
        ?? Math.round(cornerWidth * 0.68);
    return {
        ribbonMaxHeight: chrome.ribbonMaxHeight ?? chrome.ribbonHeight ?? 52,
        ribbonMaxWidth: chrome.ribbonMaxWidth ?? 0,
        ribbonScale: chrome.ribbonScale ?? 1,
        ribbonTopOffset: chrome.ribbonTopOffset ?? 0,
        ribbonPairPull: chrome.ribbonPairPull,
        ribbonPairFactor: chrome.ribbonPairFactor,
        ribbonHalfInset: chrome.ribbonHalfInset ?? 4,
        cornerWidth,
        cornerHeight,
        cornerPad: chrome.cornerPad ?? 0,
        cornerPairPull: chrome.cornerPairPull ?? 0,
        headerTextShift: chrome.headerTextShift ?? 32,
    };
}

/** 有顶栏丝带资源时，标题区整体下移像素 */
export function statusHeaderOffset(uiSkinId, cardWidth = 520) {
    return uiSkinComponentExists(uiSkinId, 'headerRibbon')
        ? chromeLayout(uiSkinId, cardWidth).headerTextShift
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
        const w = opts.width ?? size;
        const h = opts.height ?? size;
        try {
            const trimmed = await sharp(abs).trim().png().toBuffer();
            return sharp(trimmed)
                .resize(w, h, { fit: 'cover', position: 'north' })
                .png()
                .toBuffer();
        } catch {
            return null;
        }
    }
    return loadSticker(abs, size, {
        borderWidth: 0,
        shadow: opts.shadow !== false,
        ...opts,
    });
}

/**
 * 单张角饰 → 四角对称变体（TL 原图 / TR 水平镜像 / BL 垂直镜像 / BR 对角镜像）
 * @returns {Promise<{ tl: Buffer, tr: Buffer, bl: Buffer, br: Buffer, width: number, height: number } | null>}
 */
async function loadCornerQuartet(skinId, cornerWidth, cornerHeight) {
    const abs = uiSkinComponentPath(skinId, 'frameCorner');
    if (!abs || !FileUtils.existsSync(abs)) return null;
    try {
        const tl = await sharp(abs)
            .trim()
            .resize(cornerWidth, cornerHeight, {
                fit: 'inside',
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .png()
            .toBuffer();
        const meta = await sharp(tl).metadata();
        const width = meta.width || cornerWidth;
        const height = meta.height || cornerHeight;
        const tr = await sharp(tl).flop().png().toBuffer();
        const bl = await sharp(tl).flip().png().toBuffer();
        const br = await sharp(tl).flip().flop().png().toBuffer();
        return { tl, tr, bl, br, width, height };
    } catch {
        return null;
    }
}

const RIBBON_ALPHA_THRESH = 48;

/** 按列 alpha 找左右装饰簇（宽图中间留白、两侧簇，勿用几何中线切半） */
async function findRibbonClusterBoxes(ribbonPath, alphaThresh = RIBBON_ALPHA_THRESH) {
    const { data, info } = await sharp(ribbonPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const w = info.width || 0;
    const h = info.height || 0;
    if (!w || !h) return null;

    const activeCols = [];
    for (let x = 0; x < w; x += 1) {
        let maxA = 0;
        for (let y = 0; y < h; y += 1) {
            const a = data[(y * w + x) * 4 + 3];
            if (a > maxA) maxA = a;
        }
        if (maxA >= alphaThresh) activeCols.push(x);
    }
    if (!activeCols.length) return null;

    const mid = Math.floor(w / 2);
    const leftCols = activeCols.filter((x) => x < mid);
    const rightCols = activeCols.filter((x) => x >= mid);
    if (!leftCols.length || !rightCols.length) return null;

    const boxForCols = (cols) => {
        const left = cols[0];
        const right = cols[cols.length - 1];
        let top = h;
        let bottom = 0;
        for (let y = 0; y < h; y += 1) {
            for (let x = left; x <= right; x += 1) {
                if (data[(y * w + x) * 4 + 3] >= alphaThresh) {
                    if (y < top) top = y;
                    if (y > bottom) bottom = y;
                }
            }
        }
        if (bottom < top) return null;
        return {
            left,
            top,
            width: right - left + 1,
            height: bottom - top + 1,
        };
    };

    const leftBox = boxForCols(leftCols);
    const rightBox = boxForCols(rightCols);
    if (!leftBox || !rightBox) return null;
    return { leftBox, rightBox };
}

async function extractRibbonCluster(ribbonPath, box) {
    const raw = await sharp(ribbonPath).extract(box).png().toBuffer();
    try {
        return await sharp(raw).trim({ threshold: RIBBON_ALPHA_THRESH }).png().toBuffer();
    } catch {
        return raw;
    }
}

/** 顶栏丝带：透明底长条图拆左右装饰簇 */
async function splitRibbonClusters(ribbonPath) {
    const boxes = await findRibbonClusterBoxes(ribbonPath);
    if (!boxes) return null;
    const [leftRaw, rightRaw] = await Promise.all([
        extractRibbonCluster(ribbonPath, boxes.leftBox),
        extractRibbonCluster(ribbonPath, boxes.rightBox),
    ]);
    return { leftRaw, rightRaw };
}

/**
 * 顶栏丝带左右簇叠层（下移 + 向中间收拢，不挡标题）
 * @returns {Promise<Array<{ input: Buffer, top: number, left: number }>>}
 */
async function loadRibbonPairLayers(skinId, cardWidth, layout) {
    const ribbonPath = uiSkinComponentPath(skinId, 'headerRibbon');
    if (!ribbonPath || !FileUtils.existsSync(ribbonPath)) return [];
    const { ribbonMaxHeight, ribbonMaxWidth, ribbonPairPull, ribbonPairFactor, ribbonHalfInset } = layout;
    try {
        const halves = await splitRibbonClusters(ribbonPath);
        if (!halves) return [];
        const { leftRaw, rightRaw } = halves;

        const maxH = Math.round(ribbonMaxHeight * (layout.ribbonScale ?? 1));
        const resizeHalf = (buf) => {
            const resizeOpts = { height: maxH, fit: 'inside' };
            if (ribbonMaxWidth > 0) resizeOpts.width = ribbonMaxWidth;
            return sharp(buf).resize(resizeOpts).png().toBuffer();
        };

        const [leftBuf, rightBuf] = await Promise.all([resizeHalf(leftRaw), resizeHalf(rightRaw)]);
        const [lMeta, rMeta] = await Promise.all([
            sharp(leftBuf).metadata(),
            sharp(rightBuf).metadata(),
        ]);
        const lw = lMeta.width || 0;
        const rw = rMeta.width || 0;
        if (!lw || !rw) return [];

        const factorPull = ribbonPairFactor != null
            ? Math.round(cardWidth * ribbonPairFactor)
            : Math.round(cardWidth * 0.1);
        const pull = Math.max(ribbonHalfInset, ribbonPairPull ?? factorPull);
        const ribbonTop = layout.ribbonTopOffset ?? 0;
        return [
            { input: leftBuf, top: ribbonTop, left: pull },
            { input: rightBuf, top: ribbonTop, left: cardWidth - rw - pull },
        ];
    } catch {
        return [];
    }
}

/**
 * 皮肤 chrome PNG：四角对称角饰 + 顶栏丝带（作为背景装饰，由 appendUiPresentationLayers 插在内容层之下）
 */
export async function composeChromeOverlays(uiSkinId, width, height = 0) {
    const layout = chromeLayout(uiSkinId, width);
    const { cornerWidth, cornerHeight, cornerPad, cornerPairPull } = layout;
    const layers = [];

    const corners = await loadCornerQuartet(uiSkinId, cornerWidth, cornerHeight);
    if (corners) {
        const { tl, tr, bl, br, width: aw, height: ah } = corners;
        const cx = cornerPad + cornerPairPull;
        layers.push(
            { input: tl, top: cornerPad, left: cx },
            { input: tr, top: cornerPad, left: width - aw - cx },
        );
        if (height > 0) {
            const bottomTop = height - ah - cornerPad;
            layers.push(
                { input: bl, top: bottomTop, left: cx },
                { input: br, top: bottomTop, left: width - aw - cx },
            );
        }
    }

    const ribbonLayers = await loadRibbonPairLayers(uiSkinId, width, layout);
    layers.push(...ribbonLayers);

    return layers;
}

/** 内容层之上叠贴图；chrome 默认插在背景层之后（不挡标题字） */
export async function appendUiPresentationLayers(layers, uiSkinId, width, height = 0, opts = {}) {
    const chrome = await composeChromeOverlays(uiSkinId, width, height);
    let stickers = [];
    if (opts.stickers !== false && height > 0) {
        const stickerSeed = opts.stickerSeed ?? hashSeed('ui-present', uiSkinId, width, height);
        stickers = await scatterSkinStickersForCard(uiSkinId, width, height, stickerSeed, opts.stickerProfile);
    }
    const insertAfter = opts.chromeInsertAfter ?? 0;
    if (insertAfter > 0 && layers.length > insertAfter) {
        return [
            ...layers.slice(0, insertAfter),
            ...chrome,
            ...layers.slice(insertAfter),
            ...stickers,
        ];
    }
    return [...layers, ...stickers, ...chrome];
}

/** 月历水印（低透明度居中） */
export async function composeCalendarWatermark(skinId, width, height) {
    const wmSize = Math.min(240, Math.round(width * 0.34));
    let buf = await loadUiSkinComponent(skinId, 'calendarWatermark', wmSize, { shadow: false });
    if (!buf) return null;
    buf = await dimAlpha(buf, 0.2);
    return stickerOverlay(buf, Math.round((height - wmSize) / 2), Math.round((width - wmSize) / 2));
}
