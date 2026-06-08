import sharp from 'sharp';
import { pathToFileURL } from 'node:url';
import { MISANS_FONT } from '../constants/core.js';
import { QQ_AVATAR } from '../constants/game.js';

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
    pvp: {
        bgStops: '<stop offset="0%" style="stop-color:#2a1810"/><stop offset="100%" style="stop-color:#1a0c08"/>',
        title: '#fff5eb',
        sub: '#ffe0c8',
        line: '#fffaf5',
        muted: '#ffcc99',
        accent: '#ff7043',
        panel: 'rgba(0,0,0,0.42)',
        highlight: 'rgba(255,112,67,0.2)',
    },
    help: {
        bgStops: '<stop offset="0%" style="stop-color:#1a2838"/><stop offset="100%" style="stop-color:#0f1828"/>',
        title: '#e8f4ff',
        sub: '#c8e0ff',
        line: '#f5faff',
        muted: '#88c8ff',
        accent: '#5dade2',
        panel: 'rgba(0,0,0,0.38)',
        highlight: 'rgba(93,173,226,0.18)',
    },
};

/** 稳定 hash，用于装饰粒子伪随机 */
export function hashSeed(...parts) {
    let h = 2166136261;
    for (const p of parts) {
        for (const c of String(p ?? '')) {
            h = Math.imul(h ^ c.charCodeAt(0), 16777619);
        }
    }
    return h >>> 0;
}

function seededRandom(seed) {
    let s = seed >>> 0;
    return () => {
        s = Math.imul(s ^ (s >>> 15), 1 | s);
        s ^= s + Math.imul(s ^ (s >>> 7), 61 | s);
        return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
    };
}

/** 卡片额外 SVG 滤镜/渐变 */
export function cardSvgExtraDefs(theme) {
    return `
        <linearGradient id="accentGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:${theme.accent};stop-opacity:0.15"/>
            <stop offset="50%" style="stop-color:${theme.accent};stop-opacity:0.45"/>
            <stop offset="100%" style="stop-color:${theme.accent};stop-opacity:0.15"/>
        </linearGradient>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.8" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
    `;
}

/** 虚线边框 + 背景光点 */
export function buildCardDecorations(w, h, theme, seed = 1) {
    const rng = seededRandom(seed);
    let dots = '';
    for (let i = 0; i < 16; i++) {
        const x = Math.floor(rng() * (w - 48)) + 24;
        const y = Math.floor(rng() * (h - 48)) + 24;
        const r = (1.2 + rng() * 2.8).toFixed(1);
        const op = (0.1 + rng() * 0.28).toFixed(2);
        dots += `<circle cx="${x}" cy="${y}" r="${r}" fill="${theme.accent}" opacity="${op}"/>`;
    }
    return `
        <rect x="5" y="5" width="${w - 10}" height="${h - 10}" rx="18" fill="none" stroke="${theme.accent}" stroke-width="2.5" stroke-dasharray="9 7" opacity="0.8"/>
        <rect x="11" y="11" width="${w - 22}" height="${h - 22}" rx="14" fill="none" stroke="${theme.highlight || theme.accent}" stroke-width="1" opacity="0.35"/>
        <rect x="18" y="18" width="${w - 36}" height="4" rx="2" fill="url(#accentGlow)" opacity="0.85"/>
        ${dots}
    `;
}

/** 对决中央 VS 徽章 */
export function buildVsBadge(cx, cy, theme, label = 'VS') {
    return `
        <circle cx="${cx}" cy="${cy}" r="24" fill="${theme.accent}" opacity="0.95"/>
        <circle cx="${cx}" cy="${cy}" r="28" fill="none" stroke="${theme.title}" stroke-width="2" opacity="0.45"/>
        <text filter="url(#txtShadow)" x="${cx}" y="${cy + 6}" font-size="15" font-family="MiSans,sans-serif" fill="#fff" text-anchor="middle" font-weight="bold">${escapeXml(label)}</text>
    `;
}

/** 角标丝带：胜/败/得手等 */
export function buildRibbonBadge(cx, y, text, kind = 'win') {
    const palette = {
        win: { bg: '#ffd700', fg: '#3d2a00' },
        lose: { bg: '#6b7280', fg: '#f9fafb' },
        fail: { bg: '#ef4444', fg: '#fff' },
        invite: { bg: '#ff7043', fg: '#fff' },
        neutral: { bg: '#68d391', fg: '#0f2918' },
        curse: { bg: '#a855f7', fg: '#fff' },
    };
    const { bg, fg } = palette[kind] || palette.neutral;
    const w = Math.max(48, String(text).length * 14 + 18);
    return `
        <rect x="${cx - w / 2}" y="${y}" width="${w}" height="24" rx="12" fill="${bg}" opacity="0.95"/>
        <text filter="url(#txtShadow)" x="${cx}" y="${y + 17}" font-size="13" font-family="MiSans,sans-serif" fill="${fg}" text-anchor="middle" font-weight="bold">${escapeXml(text)}</text>
    `;
}

/** 统计 chip（圆角条） */
export function buildStatChip(x, y, label, value, color, theme) {
    return `
        <rect x="${x}" y="${y - 18}" width="152" height="32" rx="9" fill="${theme.panel}" stroke="${color}" stroke-width="1.2" opacity="0.92"/>
        <text filter="url(#txtShadow)" x="${x + 10}" y="${y + 2}" font-size="12" font-family="MiSans,sans-serif" fill="${theme.muted}">${escapeXml(label)}</text>
        <text filter="url(#txtShadow)" x="${x + 142}" y="${y + 2}" font-size="14" font-family="MiSans,sans-serif" fill="${color}" text-anchor="end" font-weight="bold">${escapeXml(String(value))}</text>
    `;
}

/** 迷你进度条（次数/配额可视化） */
export function buildMiniBar(x, y, width, ratio, color, bg = 'rgba(255,255,255,0.12)') {
    const r = Math.max(0, Math.min(1, Number(ratio) || 0));
    const fillW = Math.max(0, Math.round(width * r));
    return `
        <rect x="${x}" y="${y}" width="${width}" height="5" rx="2.5" fill="${bg}"/>
        <rect x="${x}" y="${y}" width="${fillW}" height="5" rx="2.5" fill="${color}"/>
    `;
}

/** 对决闪电装饰（VS 两侧） */
export function buildDuelSpark(cx, cy, theme) {
    const c = theme.accent;
    return `
        <path d="M${cx - 58} ${cy + 4} L${cx - 38} ${cy - 6} L${cx - 42} ${cy + 2} L${cx - 22} ${cy - 10} L${cx - 28} ${cy + 6} L${cx - 8} ${cy - 4}" fill="none" stroke="${c}" stroke-width="1.8" opacity="0.45"/>
        <path d="M${cx + 58} ${cy + 4} L${cx + 38} ${cy - 6} L${cx + 42} ${cy + 2} L${cx + 22} ${cy - 10} L${cx + 28} ${cy + 6} L${cx + 8} ${cy - 4}" fill="none" stroke="${c}" stroke-width="1.8" opacity="0.45"/>
    `;
}

/** 拉取 QQ 头像并裁成圆形 PNG，可选彩色光环 */
export async function fetchCircleAvatar(userId, size = 68, ringColor = null) {
    if (!userId) return null;
    try {
        const res = await fetch(QQ_AVATAR(userId, 640));
        if (!res.ok) return null;
        const input = Buffer.from(await res.arrayBuffer());
        const r = Math.floor(size / 2);
        const mask = Buffer.from(
            `<svg width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/></svg>`,
        );
        const avatar = await sharp(input)
            .resize(size, size, { fit: 'cover' })
            .composite([{ input: mask, blend: 'dest-in' }])
            .png()
            .toBuffer();
        if (!ringColor) return avatar;
        const pad = 6;
        const outer = size + pad * 2;
        const ringSvg = Buffer.from(
            `<svg width="${outer}" height="${outer}">
                <circle cx="${outer / 2}" cy="${outer / 2}" r="${size / 2 + 3}" fill="none" stroke="${ringColor}" stroke-width="4"/>
            </svg>`,
        );
        return sharp(ringSvg)
            .composite([{ input: avatar, top: pad, left: pad }])
            .png()
            .toBuffer();
    } catch {
        return null;
    }
}

export async function renderStyledCard(width, height, innerSvg, themeKey = 'mischief', overlays = []) {
    const theme = CARD_THEMES[themeKey] || CARD_THEMES.mischief;
    const svg = svgTextStyled(
        innerSvg,
        width,
        height,
        `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">${theme.bgStops}</linearGradient>${cardSvgExtraDefs(theme)}`,
    );
    const layers = [{ input: svg, top: 0, left: 0 }, ...overlays];
    return sharp({
        create: { width, height, channels: 4, background: { r: 255, g: 245, b: 235, alpha: 1 } },
    })
        .composite(layers)
        .png()
        .toBuffer();
}
