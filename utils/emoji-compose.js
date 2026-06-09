/**
 * Emoji 栅格化（Twemoji PNG）— sharp/librsvg 无系统彩色 emoji 字体时避免黑块
 */
import sharp from 'sharp';
import { stickerOverlay } from './render-pipeline.js';
import { textCenteredEmoji } from './svg-base.js';

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72';
const rasterCache = new Map();

function emojiCodepoints(emoji) {
    const codes = [];
    for (const symbol of String(emoji ?? '')) {
        const cp = symbol.codePointAt(0);
        if (cp) codes.push(cp.toString(16).toLowerCase());
    }
    return codes.join('-');
}

async function fetchTwemojiBuffer(emoji) {
    const code = emojiCodepoints(emoji);
    if (!code) return null;
    const url = `${TWEMOJI_BASE}/${code}.png`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
}

/** @returns {Promise<Buffer|null>} 透明底 PNG */
export async function loadEmojiRaster(emoji, size) {
    const key = `${emoji}|${Math.round(size)}`;
    if (rasterCache.has(key)) return rasterCache.get(key);
    try {
        const raw = await fetchTwemojiBuffer(emoji);
        if (!raw) {
            rasterCache.set(key, null);
            return null;
        }
        const box = Math.max(8, Math.round(size));
        const out = await sharp(raw)
            .resize(box, box, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
        rasterCache.set(key, out);
        return out;
    } catch {
        rasterCache.set(key, null);
        return null;
    }
}

/** 嵌入 SVG 的 raster emoji（<image data:...>） */
export async function emojiSvgImage(cx, cy, emoji, size) {
    const buf = await loadEmojiRaster(emoji, size);
    if (!buf) return textCenteredEmoji(cx, cy, emoji, { size: Math.round(size) });
    const b64 = buf.toString('base64');
    const s = Math.round(size);
    const x = Math.round(cx - s / 2);
    const y = Math.round(cy - s / 2);
    return `<image x="${x}" y="${y}" width="${s}" height="${s}" href="data:image/png;base64,${b64}"/>`;
}

/** sharp composite 图层 */
export async function emojiStickerOverlay(emoji, top, left, size) {
    const buf = await loadEmojiRaster(emoji, size);
    return buf ? stickerOverlay(buf, top, left) : null;
}

/**
 * 居中：emoji 图 + 标题文字（emoji 用栅格图，文字仍走 DeerFont）
 * @returns {{ svg: string, overlays: Array }}
 */
export async function buildCenteredEmojiTitleRaster(cx, y, emoji, title, {
    emojiSize = 18,
    titleSize = 14,
    style = '',
    fill = '',
    weight = 'bold',
} = {}) {
    const titleStr = String(title ?? '');
    const approxTitleW = titleStr.length * titleSize * 0.52;
    const gap = 6;
    const totalW = (emoji ? emojiSize + gap : 0) + approxTitleW;
    const startX = cx - totalW / 2;
    const overlays = [];
    let prefix = '';
    if (emoji) {
        const overlay = await emojiStickerOverlay(emoji, y - emojiSize + 2, startX, emojiSize);
        if (overlay) overlays.push(overlay);
        else prefix = await emojiSvgImage(startX + emojiSize / 2, y - emojiSize * 0.15, emoji, emojiSize);
    }
    const textX = startX + (emoji ? emojiSize + gap : 0);
    const fillAttr = fill ? ` fill="${fill}"` : '';
    const weightAttr = weight ? ` font-weight="${weight}"` : '';
    const svg = `${prefix}<text x="${Math.round(textX)}" y="${y}" font-size="${titleSize}" ${style}${fillAttr}${weightAttr}>${titleStr.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
    return { svg, overlays };
}
