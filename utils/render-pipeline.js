import sharp from 'sharp';

/** 贴图在槽位内的缩放比（1 = 铺满槽位，整数像素对齐） */
export const ART_FIT_SCALE = 1;

/** SVG 栅格 DPI（与 svg width/height 像素 1:1） */
export const SVG_RASTER_DPI = 72;

export const PNG_OUT = Object.freeze({ compressionLevel: 6 });

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
    const base = sharp({
        create: { width: w, height: h, channels: 4, background },
    });
    if (!valid.length) return base.png(PNG_OUT).toBuffer();
    return base.composite(valid).png(PNG_OUT).toBuffer();
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
