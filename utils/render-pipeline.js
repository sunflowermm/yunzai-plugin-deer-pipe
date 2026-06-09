import sharp from 'sharp';
import { Resvg } from '@resvg/resvg-js';
import { DEER_FONT, DEER_FONT_FAMILY } from '../constants/core.js';

/** 贴图在槽位内缩放（略小于 1 加快 trim/resize，肉眼差异小） */
export const ART_FIT_SCALE = 0.88;

/** SVG 栅格 DPI（与 width/height 1:1，72 为快出图基准） */
export const SVG_RASTER_DPI = 72;

export const PNG_OUT = Object.freeze({ compressionLevel: 3 });

function isSvgBuffer(buf) {
    if (!Buffer.isBuffer(buf)) return false;
    return buf.subarray(0, Math.min(buf.length, 256)).toString('utf8').includes('<svg');
}

/** librsvg/sharp 不支持 SVG 内嵌字体；用 resvg 加载 Genshin.ttf */
export function rasterizeDeerSvg(svgInput) {
    const svgStr = Buffer.isBuffer(svgInput) ? svgInput.toString('utf8') : String(svgInput);
    const resvg = new Resvg(svgStr, {
        font: {
            fontFiles: [DEER_FONT],
            loadSystemFonts: false,
            defaultFontFamily: DEER_FONT_FAMILY,
        },
    });
    return resvg.render().asPng();
}

async function normalizeLayerInput(input) {
    if (isSvgBuffer(input)) return rasterizeDeerSvg(input);
    return input;
}

/** 坐标/尺寸取整，避免 subpixel 叠图错位 */
export function px(n) {
    return Math.round(Number(n) || 0);
}

/**
 * 多层合成输出 PNG（所有 deer-pipe 渲染统一入口）
 * @param {number} width
 * @param {number} height
 * @param {Array<{input: Buffer, top?: number, left?: number}>} layers
 * @param {{ r: number, g: number, b: number, alpha: number }} [background]
 */
export async function compositeToPng(width, height, layers, background = { r: 255, g: 245, b: 235, alpha: 1 }) {
    const w = px(width);
    const h = px(height);
    const valid = (layers || []).filter((l) => l?.input);
    const normalized = await Promise.all(valid.map(async (l) => ({
        ...l,
        input: await normalizeLayerInput(l.input),
    })));
    const base = sharp({
        create: { width: w, height: h, channels: 4, background },
    });
    if (!normalized.length) return base.png(PNG_OUT).toBuffer();
    return base.composite(normalized).png(PNG_OUT).toBuffer();
}

/** sharp composite 图层（整数 top/left） */
export function stickerOverlay(buffer, top, left) {
    if (!buffer) return null;
    return { input: buffer, top: px(top), left: px(left) };
}

/** 带 frame 的贴图外框尺寸（与 wrapWithFrame 一致） */
export function stickerOuterSize(size, { borderWidth = 0, shadow = false } = {}) {
    const pad = px(borderWidth) + (shadow ? 4 : 0);
    return px(size) + pad * 2;
}

export async function encodePngBuffer(image) {
    return sharp(image).png(PNG_OUT).toBuffer();
}
