import sharp from 'sharp';
import { pathToFileURL } from 'node:url';
import { MISANS_FONT } from '../constants/core.js';

export function escapeXml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function truncText(text, max = 16) {
    const s = String(text ?? '');
    return escapeXml(s.length > max ? `${s.slice(0, max)}…` : s);
}

function svgFontFace() {
    const uri = pathToFileURL(MISANS_FONT).href;
    return `@font-face{font-family:'MiSans';src:url('${uri}') format('truetype');}`;
}

/** 带 MiSans + 文字阴影的 SVG 包装 */
export function svgTextStyled(content, width, height, extra = '') {
    return Buffer.from(
        `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="txtShadow" x="-8%" y="-8%" width="116%" height="116%">
                    <feDropShadow dx="0" dy="1.2" stdDeviation="2.2" flood-color="#000" flood-opacity="0.75"/>
                </filter>
                <style>${svgFontFace()}</style>
                ${extra}
            </defs>
            ${content}
        </svg>`,
    );
}

/** 轻量 SVG（无字体嵌入，用于小格子） */
export function svgTextPlain(content, width, height, extra = '') {
    return Buffer.from(
        `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${extra}${content}</svg>`,
    );
}

export const CARD_THEMES = {
    weather: {
        bgStops: '<stop offset="0%" style="stop-color:#e8f4ff"/><stop offset="100%" style="stop-color:#d0e8ff"/>',
        title: '#1a3a5c',
        sub: '#2c5282',
        line: '#1a202c',
        muted: '#4a5568',
        accent: '#3182ce',
        panel: 'rgba(255,255,255,0.72)',
        highlight: 'rgba(49,130,206,0.18)',
    },
    mischief: {
        bgStops: '<stop offset="0%" style="stop-color:#fff5eb"/><stop offset="100%" style="stop-color:#ffd4b8"/>',
        title: '#3d2818',
        sub: '#5c3d2e',
        line: '#2a1a10',
        muted: '#7a4e32',
        accent: '#e67e22',
        panel: 'rgba(255,255,255,0.55)',
        highlight: 'rgba(230,126,34,0.15)',
    },
    curse: {
        bgStops: '<stop offset="0%" style="stop-color:#1f1230"/><stop offset="100%" style="stop-color:#120a1c"/>',
        title: '#f5ebff',
        sub: '#e8d4ff',
        line: '#faf5ff',
        muted: '#d4b8ff',
        accent: '#c39bff',
        panel: 'rgba(0,0,0,0.42)',
        highlight: 'rgba(195,155,255,0.2)',
    },
    bless: {
        bgStops: '<stop offset="0%" style="stop-color:#1a2818"/><stop offset="100%" style="stop-color:#0f1a0d"/>',
        title: '#f0fff0',
        sub: '#d8ffd8',
        line: '#f5fff5',
        muted: '#b8f0b8',
        accent: '#7dffb0',
        panel: 'rgba(0,0,0,0.35)',
        highlight: 'rgba(125,255,176,0.15)',
    },
    steal: {
        bgStops: '<stop offset="0%" style="stop-color:#2a1218"/><stop offset="100%" style="stop-color:#1a080c"/>',
        title: '#ffe8ec',
        sub: '#ffc8d0',
        line: '#fff5f7',
        muted: '#ffb0bc',
        accent: '#ff6b81',
        panel: 'rgba(0,0,0,0.45)',
        highlight: 'rgba(255,107,129,0.2)',
    },
    splash: {
        bgStops: '<stop offset="0%" style="stop-color:#0f2828"/><stop offset="100%" style="stop-color:#082020"/>',
        title: '#e0fffa',
        sub: '#b8f5ec',
        line: '#f0fffd',
        muted: '#88ddd0',
        accent: '#38b2ac',
        panel: 'rgba(0,0,0,0.4)',
        highlight: 'rgba(56,178,172,0.2)',
    },
    lottery: {
        bgStops: '<stop offset="0%" style="stop-color:#2a2410"/><stop offset="100%" style="stop-color:#1a1408"/>',
        title: '#fff8e0',
        sub: '#ffeaa0',
        line: '#fffef5',
        muted: '#ffd970',
        accent: '#f6c90e',
        panel: 'rgba(0,0,0,0.38)',
        highlight: 'rgba(246,201,14,0.18)',
    },
    howl: {
        bgStops: '<stop offset="0%" style="stop-color:#142818"/><stop offset="100%" style="stop-color:#0a1a10"/>',
        title: '#e8ffe8',
        sub: '#c8f0c8',
        line: '#f5fff5',
        muted: '#98d898',
        accent: '#68d391',
        panel: 'rgba(0,0,0,0.38)',
        highlight: 'rgba(104,211,145,0.18)',
    },
    fail: {
        bgStops: '<stop offset="0%" style="stop-color:#2a2a2a"/><stop offset="100%" style="stop-color:#1a1a1a"/>',
        title: '#f0f0f0',
        sub: '#cccccc',
        line: '#fafafa',
        muted: '#aaaaaa',
        accent: '#888888',
        panel: 'rgba(0,0,0,0.5)',
        highlight: 'rgba(136,136,136,0.15)',
    },
};

export async function renderStyledCard(width, height, innerSvg, themeKey = 'mischief') {
    const theme = CARD_THEMES[themeKey] || CARD_THEMES.mischief;
    const svg = svgTextStyled(
        innerSvg,
        width,
        height,
        `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">${theme.bgStops}</linearGradient>`,
    );
    return sharp({
        create: { width, height, channels: 4, background: { r: 255, g: 245, b: 235, alpha: 1 } },
    })
        .composite([{ input: svg, top: 0, left: 0 }])
        .png()
        .toBuffer();
}
