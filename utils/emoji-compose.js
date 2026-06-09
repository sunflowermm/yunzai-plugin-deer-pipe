/**
 * Emoji 栅格化（Twemoji PNG）— sharp/librsvg 无系统彩色 emoji 字体时避免黑块
 */
import sharp from 'sharp';
import { stickerOverlay } from './render-pipeline.js';
import { escapeXml, estimateTextWidth, textCenteredEmoji, TXT } from './svg-base.js';

const INLINE_EMOJI_RE = /(\p{Extended_Pictographic}(?:\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F)?)*)/gu;

/** 单行混排：中文走 DeerFont，emoji 走 Twemoji 栅格 */
export async function buildInlineEmojiText(x, y, text, {
    style = TXT,
    fontSize = 14,
    fill = '#3d2914',
    weight = '',
    emojiScale = 1.12,
} = {}) {
    const s = String(text ?? '');
    if (!s) return '';
    const parts = [];
    let last = 0;
    for (const m of s.matchAll(INLINE_EMOJI_RE)) {
        const idx = m.index ?? 0;
        if (idx > last) parts.push({ t: 'text', v: s.slice(last, idx) });
        parts.push({ t: 'emoji', v: m[0] });
        last = idx + m[0].length;
    }
    if (last < s.length) parts.push({ t: 'text', v: s.slice(last) });
    if (!parts.some((p) => p.t === 'emoji')) {
        const w = weight ? ` font-weight="${weight}"` : '';
        return `<text ${style} x="${x}" y="${y}" font-size="${fontSize}" fill="${fill}"${w}>${escapeXml(s)}</text>`;
    }
    const emojiSize = Math.round(fontSize * emojiScale);
    const emojiCy = y - Math.round(fontSize * 0.3);
    let cx = x;
    let out = '';
    for (const p of parts) {
        if (p.t === 'text' && p.v) {
            const w = weight ? ` font-weight="${weight}"` : '';
            out += `<text ${style} x="${cx}" y="${y}" font-size="${fontSize}" fill="${fill}"${w}>${escapeXml(p.v)}</text>`;
            cx += estimateTextWidth(p.v, fontSize);
        } else if (p.t === 'emoji') {
            out += await emojiSvgImage(cx + emojiSize / 2, emojiCy, p.v, emojiSize);
            cx += emojiSize + 3;
        }
    }
    return out;
}

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
    let code = emojiCodepoints(emoji);
    if (!code) return null;
    const tryFetch = async (c) => {
        const res = await fetch(`${TWEMOJI_BASE}/${c}.png`);
        if (!res.ok) return null;
        return Buffer.from(await res.arrayBuffer());
    };
    let buf = await tryFetch(code);
    if (!buf && code.includes('-fe0f')) {
        buf = await tryFetch(code.replace(/-fe0f/g, ''));
    }
    return buf;
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
    style = TXT,
    fill = '',
    weight = 'bold',
} = {}) {
    const titleStr = String(title ?? '');
    const titleW = estimateTextWidth(titleStr, titleSize);
    const gap = 6;
    const totalW = (emoji ? emojiSize + gap : 0) + titleW;
    const startX = cx - totalW / 2;
    let prefix = '';
    if (emoji) {
        const emojiTop = y - Math.round(emojiSize * 0.82);
        const buf = await loadEmojiRaster(emoji, emojiSize);
        if (buf) {
            const b64 = buf.toString('base64');
            prefix = `<image x="${Math.round(startX)}" y="${emojiTop}" width="${emojiSize}" height="${emojiSize}" href="data:image/png;base64,${b64}"/>`;
        } else {
            prefix = await emojiSvgImage(startX + emojiSize / 2, y - Math.round(emojiSize * 0.12), emoji, emojiSize);
        }
    }
    const textX = startX + (emoji ? emojiSize + gap : 0);
    const fillAttr = fill ? ` fill="${fill}"` : '';
    const weightAttr = weight ? ` font-weight="${weight}"` : '';
    const svg = `${prefix}<text x="${Math.round(textX)}" y="${y}" font-size="${titleSize}" ${style}${fillAttr}${weightAttr}>${titleStr.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
    return { svg, overlays: [] };
}
