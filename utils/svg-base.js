import sharp from 'sharp';
import { DEER_FONT_FAMILY } from '../constants/core.js';
import { QQ_AVATAR } from '../constants/game.js';
import { compositeToPng, px, rasterizeDeerSvg } from './render-pipeline.js';

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

function charWidth(ch, fontSize) {
    const code = ch.codePointAt(0) ?? 0;
    if (code <= 0x7f) return fontSize * 0.52;
    if (code <= 0xff) return fontSize * 0.58;
    return fontSize * 0.98;
}

function lineWidth(text, fontSize) {
    return [...String(text)].reduce((w, ch) => w + charWidth(ch, fontSize), 0);
}

/** 估算 DeerFont 文本像素宽度（居中标题 / emoji 混排） */
export function estimateTextWidth(text, fontSize) {
    return lineWidth(text, fontSize);
}

function wrapLongSegment(segment, maxWidthPx, fontSize) {
    const out = [];
    let line = '';
    let w = 0;
    for (const ch of segment) {
        const cw = charWidth(ch, fontSize);
        if (line && w + cw > maxWidthPx) {
            out.push(line);
            line = ch;
            w = cw;
        } else {
            line += ch;
            w += cw;
        }
    }
    if (line) out.push(line);
    return out;
}

/** 按像素宽度换行（优先在 · 处断行） */
export function wrapTextLines(text, maxWidthPx, fontSize, maxLines = 2) {
    const s = String(text ?? '').trim();
    if (!s || maxWidthPx <= 0 || maxLines < 1) return [];
    const parts = s.split(/\s*·\s*/);
    const lines = [];
    let current = '';
    let currentW = 0;
    const sep = ' · ';
    const sepW = lineWidth(sep, fontSize);

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const segments = lineWidth(part, fontSize) > maxWidthPx
            ? wrapLongSegment(part, maxWidthPx, fontSize)
            : [part];
        for (const segment of segments) {
            const segW = lineWidth(segment, fontSize);
            const addSep = current.length > 0;
            const needed = (addSep ? sepW : 0) + segW;
            if (current && currentW + needed > maxWidthPx && lines.length < maxLines - 1) {
                lines.push(current);
                current = segment;
                currentW = segW;
            } else {
                current = addSep ? `${current}${sep}${segment}` : segment;
                currentW = lineWidth(current, fontSize);
            }
        }
    }
    if (current) lines.push(current);
    if (lines.length > maxLines) {
        const kept = lines.slice(0, maxLines);
        const last = kept[maxLines - 1];
        const maxChars = Math.max(4, Math.floor(maxWidthPx / fontSize));
        if ([...last].length > maxChars) {
            kept[maxLines - 1] = `${[...last].slice(0, maxChars).join('')}…`;
        }
        return kept;
    }
    return lines;
}

/** 左对齐多行 SVG 文本 */
export function buildMultilineText(x, startY, lines, {
    style = TXT_SOFT,
    fontSize = 12,
    lineHeight = 15,
    fill = '#000',
    weight = '',
} = {}) {
    if (!lines?.length) return '';
    const weightAttr = weight ? ` font-weight="${weight}"` : '';
    const tspans = lines.map((line, i) =>
        `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`,
    ).join('');
    return `<text ${style} x="${x}" y="${startY}" font-size="${fontSize}" fill="${fill}"${weightAttr}>${tspans}</text>`;
}

function svgFontFace() {
    return `@font-face{font-family:'${DEER_FONT_FAMILY}';src:local('${DEER_FONT_FAMILY}');font-weight:normal;font-style:normal;}`;
}

export const SVG_FONT = `font-family="${DEER_FONT_FAMILY},sans-serif"`;
/** 标题级阴影（略轻，减轻重影） */
export const TXT = `${SVG_FONT} filter="url(#txtShadow)"`;
/** 正文 / chip 轻阴影 */
export const TXT_SOFT = `${SVG_FONT} filter="url(#txtSoft)"`;
/** 无阴影（emoji、高对比小字） */
export const TXT_PLAIN = SVG_FONT;
/** emoji 专用（勿用 DeerFont，否则 sharp 渲染为黑块） */
export const TXT_EMOJI = 'font-family="Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif"';

const SVG_FILTER_DEFS = `
    <filter id="txtShadow" x="-4%" y="-4%" width="108%" height="108%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#000" flood-opacity="0.42"/>
    </filter>
    <filter id="txtSoft" x="-2%" y="-2%" width="104%" height="104%">
        <feDropShadow dx="0" dy="0.6" stdDeviation="0.5" flood-color="#000" flood-opacity="0.22"/>
    </filter>
`;

/** 带 DeerFont + 文字阴影的 SVG 包装 */
export function svgTextStyled(content, width, height, extra = '') {
    return Buffer.from(
        `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                ${SVG_FILTER_DEFS}
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
    king: {
        bgStops: '<stop offset="0%" style="stop-color:#4a3200"/><stop offset="45%" style="stop-color:#2a1808"/><stop offset="100%" style="stop-color:#1a0f00"/>',
        title: '#ffd700',
        sub: '#ffe8a0',
        line: '#fff8e8',
        muted: '#d4af37',
        accent: '#ffb300',
        panel: 'rgba(0,0,0,0.55)',
        highlight: 'rgba(255,215,0,0.22)',
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
    profession: {
        bgStops: '<stop offset="0%" style="stop-color:#3d2810"/><stop offset="55%" style="stop-color:#2a1808"/><stop offset="100%" style="stop-color:#1a0f00"/>',
        title: '#fff3d6',
        sub: '#ffe0a8',
        line: '#fffaf0',
        muted: '#e8c878',
        accent: '#ffb347',
        panel: 'rgba(0,0,0,0.48)',
        highlight: 'rgba(255,179,71,0.22)',
        barBg: 'rgba(255,255,255,0.12)',
    },
    /** 端午粽香 UI 皮肤（鹿况/月历/职业卡叠色） */
    duanwu: {
        bgStops: '<stop offset="0%" style="stop-color:#1a3d28"/><stop offset="45%" style="stop-color:#0f2818"/><stop offset="100%" style="stop-color:#081a10"/>',
        title: '#e8fff0',
        sub: '#b8e8c8',
        line: '#f0fff5',
        muted: '#7ec89a',
        accent: '#4caf50',
        panel: 'rgba(0,0,0,0.42)',
        highlight: 'rgba(76,175,80,0.22)',
        barBg: 'rgba(255,255,255,0.1)',
    },
};

/** 鹿况面板主题（由状态推导，复用 CARD_THEMES 配色） */
export function statusPanelTheme(status) {
    const { dead, cursed, blessed, inRiskZone, inWithdrawalZone } = status;
    if (dead) {
        return {
            ...CARD_THEMES.fail,
            barBg: '#4a2828',
        };
    }
    if (cursed) {
        return { ...CARD_THEMES.curse, barBg: '#3d2a55' };
    }
    if (blessed) {
        return { ...CARD_THEMES.bless, barBg: '#2a4030' };
    }
    if (inRiskZone) {
        return {
            bgStops: '<stop offset="0%" style="stop-color:#3d2818"/><stop offset="100%" style="stop-color:#2a1508"/>',
            title: '#fff5eb',
            sub: '#ffe0c8',
            line: '#fffaf5',
            muted: '#ffcc99',
            accent: '#ff9a56',
            barBg: '#5c4030',
            panel: 'rgba(0,0,0,0.35)',
            highlight: 'rgba(255,154,86,0.18)',
        };
    }
    if (inWithdrawalZone) {
        return {
            bgStops: '<stop offset="0%" style="stop-color:#e8f4fc"/><stop offset="100%" style="stop-color:#d0e8f8"/>',
            title: '#1a5276',
            sub: '#2874a6',
            line: '#154360',
            muted: '#5dade2',
            accent: '#3498db',
            barBg: '#aed6f1',
            panel: 'rgba(255,255,255,0.55)',
            highlight: 'rgba(52,152,219,0.15)',
        };
    }
    return {
        ...CARD_THEMES.mischief,
        barBg: '#e8d5c4',
    };
}

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

/** 卡片额外 SVG 渐变（供 renderStyledCard / 鹿况图复用） */
export function cardSvgExtraDefs(theme) {
    return `
        <linearGradient id="accentGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:${theme.accent};stop-opacity:0.15"/>
            <stop offset="50%" style="stop-color:${theme.accent};stop-opacity:0.45"/>
            <stop offset="100%" style="stop-color:${theme.accent};stop-opacity:0.15"/>
        </linearGradient>
    `;
}

export const STAT_CHIP_W = 152;
export const STAT_CHIP_GAP = 16;
export const DEFAULT_CARD_W = 700;
export const STAT_COLS = 2;

/** 一行等宽元素水平居中的起始 X */
export function centerRowStart(itemCount, itemW, gap, canvasW) {
    const n = Math.max(1, itemCount);
    const rowWidth = n * itemW + (n - 1) * gap;
    return (canvasW - rowWidth) / 2;
}

/** 仅匹配「N 次」的次数比例（避免误匹配百分比等） */
export function parseDayCountRatio(value, limit = 8) {
    const m = String(value).trim().match(/^(-?\d+)\s*次$/);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    return Math.min(1, Math.abs(n) / Math.max(1, limit));
}

/** 3 项时「上 1 下 2」，其余按 cols 分行 */
export function packStatGroups(items, cols = STAT_COLS) {
    if (items.length === 3) {
        return [items.slice(0, 1), items.slice(1, 3)];
    }
    const groups = [];
    for (let i = 0; i < items.length; i += cols) {
        groups.push(items.slice(i, i + cols));
    }
    return groups;
}

export function statGridRowCount(items, cols = STAT_COLS) {
    return packStatGroups(items, cols).length;
}

/** 居中 stat chip 网格（3 项：首行 1 居中，次行 2 并排） */
export function buildStatGrid(rows, theme, statsTop, canvasW = DEFAULT_CARD_W, {
    cols = STAT_COLS,
    gapY = 48,
    countRatio = parseDayCountRatio,
} = {}) {
    const groups = packStatGroups(rows, cols);
    let grid = '';
    groups.forEach((group, rowIdx) => {
        const startX = centerRowStart(group.length, STAT_CHIP_W, STAT_CHIP_GAP, canvasW);
        const y = statsTop + rowIdx * gapY;
        group.forEach((row, col) => {
            const x = startX + col * (STAT_CHIP_W + STAT_CHIP_GAP);
            grid += buildStatChip(x, y, row.label, row.value, row.color || theme.line, theme);
            const ratio = countRatio?.(row.value);
            if (ratio != null) {
                grid += buildMiniBar(x + 10, y + 16, STAT_CHIP_W - 20, ratio, row.color || theme.accent);
            }
        });
    });
    return grid;
}

/** 居中文本块（单行） */
export function textCentered(cx, y, content, style, { size = 14, fill, weight, italic } = {}) {
    const attrs = [
        weight ? `font-weight="${weight}"` : '',
        italic ? 'font-style="italic"' : '',
        fill != null && fill !== '' ? `fill="${fill}"` : '',
    ].filter(Boolean).join(' ');
    return `<text ${style} x="${cx}" y="${y}" font-size="${size}" text-anchor="middle" ${attrs}>${content}</text>`;
}

/** 底部居中脚注条 */
export function buildFooterBar(canvasW, y, text, theme, maxLen = 48) {
    return `
        <rect x="20" y="${y - 6}" width="${canvasW - 40}" height="28" rx="8" fill="${theme.highlight || theme.panel}" opacity="0.55"/>
        ${textCentered(canvasW / 2, y + 12, truncText(text, maxLen), TXT_SOFT, { size: 12, fill: theme.muted, italic: true })}
    `;
}

export const QUOTA_BAR_W = 128;
const QUOTA_LABEL_W = 36;
const QUOTA_COUNT_W = 36;
const QUOTA_INNER_GAP = 8;

/** 配额条整行宽度（与 buildQuotaBarRow 一致） */
export function quotaRowWidth(barW = QUOTA_BAR_W) {
    return QUOTA_LABEL_W + QUOTA_INNER_GAP + barW + QUOTA_INNER_GAP + QUOTA_COUNT_W;
}

/** 左对齐分区行：图标槽 + 标题/正文起始 x（职业卡、鹿况等） */
export function sectionLeftIconSlot(titleBaselineY, iconSize, padLeft = 24, fontSize = 14) {
    const iconCy = titleBaselineY - Math.round(fontSize * 0.38);
    const left = px(padLeft);
    const top = px(iconCy - iconSize / 2);
    const textX = padLeft + iconSize + 10;
    return { left, top, textX, titleBaselineY };
}

/** 左对齐节标题行（SVG 部分；贴图由调用方 stickerOverlay） */
export function buildSectionTitleRow(titleBaselineY, title, theme, {
    padLeft = 24,
    iconSize = 34,
    fontSize = 13,
    fill = null,
} = {}) {
    const slot = sectionLeftIconSlot(titleBaselineY, iconSize, padLeft, fontSize);
    const color = fill || theme.accent;
    const svg = `<text ${TXT_SOFT} x="${slot.textX}" y="${titleBaselineY}" font-size="${fontSize}" fill="${color}" font-weight="bold">${escapeXml(title)}</text>`;
    return { svg, slot };
}

/** 水平居中面板 */
export function buildCenteredPanel(cx, top, width, height, theme) {
    return `<rect x="${cx - width / 2}" y="${top}" width="${width}" height="${height}" rx="10" fill="${theme.panel}" stroke="${theme.accent}" stroke-width="1"/>`;
}

/** 单行配额条（标签 + 进度 + 计数），以 cx 为中心 */
export function buildQuotaBarRow(cx, y, label, used, total, barColor, theme, barW = QUOTA_BAR_W) {
    const t = Math.max(1, total);
    const u = Math.min(Math.max(0, used), t);
    const fill = Math.round((u / t) * barW);
    const rowW = QUOTA_LABEL_W + QUOTA_INNER_GAP + barW + QUOTA_INNER_GAP + QUOTA_COUNT_W;
    const x0 = cx - rowW / 2;
    const barX = x0 + QUOTA_LABEL_W + QUOTA_INNER_GAP;
    const countX = barX + barW + QUOTA_INNER_GAP + QUOTA_COUNT_W;
    return `
        <text ${TXT_SOFT} x="${x0 + QUOTA_LABEL_W / 2}" y="${y + 12}" font-size="13" fill="${theme.muted}" text-anchor="middle">${escapeXml(label)}</text>
        <rect x="${barX}" y="${y}" width="${barW}" height="14" rx="7" fill="${theme.barBg}"/>
        <rect x="${barX}" y="${y}" width="${fill}" height="14" rx="7" fill="${barColor}"/>
        <text ${TXT_SOFT} x="${countX}" y="${y + 12}" font-size="13" fill="${theme.line}" text-anchor="end">${u}/${t}</text>
    `;
}

/** 多行配额条，逐行居中（避免并排重叠） */
export function buildQuotaBarStack(cx, topY, items, theme, rowGap = 24) {
    return items.map((item, i) => buildQuotaBarRow(
        cx,
        topY + i * rowGap,
        item.label,
        item.used,
        item.total,
        item.color,
        theme,
        item.barW,
    )).join('');
}

/** 标签 + 高亮值网格，每行按列数居中 */
export function buildLabelValueGrid(items, theme, topY, canvasW, {
    cols = 4,
    colW = 158,
    gapX = 14,
    gapY = 36,
} = {}) {
    let out = '';
    for (let i = 0; i < items.length; i += cols) {
        const group = items.slice(i, i + cols);
        const rowW = group.length * colW + (group.length - 1) * gapX;
        const startX = (canvasW - rowW) / 2;
        const rowIdx = Math.floor(i / cols);
        const y = topY + rowIdx * gapY;
        group.forEach((item, colIdx) => {
            const cx = startX + colIdx * (colW + gapX) + colW / 2;
            const label = escapeXml(String(item.label ?? item[0] ?? ''));
            const value = escapeXml(String(item.value ?? item[1] ?? ''));
            const color = item.color ?? item[2] ?? theme.accent;
            out += `<text ${TXT_SOFT} x="${cx}" y="${y}" font-size="15" fill="${theme.line}" text-anchor="middle">${label} <tspan fill="${color}" font-weight="bold">${value}</tspan></text>`;
        });
    }
    return out;
}

export function labelValueGridRowCount(count, cols = 4) {
    return Math.ceil(Math.max(0, count) / cols);
}

/** 节标题（居中） */
export function buildSectionTitle(cx, y, text, theme) {
    return textCentered(cx, y, escapeXml(text), TXT_SOFT, { size: 14, fill: theme.muted, weight: 'bold' });
}

/** 单行 emoji（勿用 DeerFont） */
export function textEmoji(x, y, emoji, { size = 20, anchor = 'start' } = {}) {
    return `<text ${TXT_EMOJI} x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}">${escapeXml(String(emoji ?? ''))}</text>`;
}

/** 居中 emoji */
export function textCenteredEmoji(cx, y, emoji, { size = 24 } = {}) {
    return textEmoji(cx, y, emoji, { size, anchor: 'middle' });
}

/** 居中：emoji + 标题（鹿王册封等轻量场景；复杂标题请用 emoji-compose） */
export function buildCenteredEmojiTitle(cx, y, emoji, title, { emojiSize = 18, titleSize = 14, style = TXT, fill, weight = 'bold' } = {}) {
    const fillAttr = fill ? ` fill="${fill}"` : '';
    const weightAttr = weight ? ` font-weight="${weight}"` : '';
    return `<text x="${cx}" y="${y}" font-size="${titleSize}" text-anchor="middle" ${style}${fillAttr}${weightAttr}>
        <tspan ${TXT_EMOJI} font-size="${emojiSize}">${escapeXml(String(emoji ?? ''))}</tspan>
        <tspan> ${escapeXml(String(title ?? ''))}</tspan>
    </text>`;
}

/** stat 网格占用高度（含 chip 本体） */
export function statGridHeight(rowCount, gapY = 48, chipH = 34) {
    const rows = Math.max(0, rowCount);
    if (!rows) return 0;
    return (rows - 1) * gapY + chipH + 8;
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
        <text ${TXT_PLAIN} x="${cx}" y="${cy + 6}" font-size="15" fill="#fff" text-anchor="middle" font-weight="bold">${escapeXml(label)}</text>
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
        accent: { bg: '#f6c90e', fg: '#3d2a00' },
        curse: { bg: '#a855f7', fg: '#fff' },
    };
    const { bg, fg } = palette[kind] || palette.neutral;
    const w = Math.max(48, String(text).length * 14 + 18);
    return `
        <rect x="${cx - w / 2}" y="${y}" width="${w}" height="24" rx="12" fill="${bg}" opacity="0.95"/>
        <text ${TXT_PLAIN} x="${cx}" y="${y + 17}" font-size="13" fill="${fg}" text-anchor="middle" font-weight="bold">${escapeXml(text)}</text>
    `;
}

/**
 * 左贴图槽 + 右文案（SVG 与 sharp overlay 共用整数坐标，避免字图重叠）
 * @returns {{ svg: string, artLeft: number, artTop: number, artSize: number }}
 */
export function buildSideArtCell({
    x, y, cellW, cellH: cellHIn, artSize, artPad = 10, theme,
    title, subtitle = '', meta = '', badgeText = '', badgeKind = 'neutral',
    titleSize = 17, subSize = 12, metaSize = 11,
    subtitleMaxLines = 3, metaMaxLines = 2,
}) {
    const artLeft = px(x + artPad);
    const textLeft = artLeft + artSize + 12;
    const textPadRight = badgeText ? 58 : 8;
    const textMaxW = cellW - (textLeft - x) - textPadRight;
    const subLineH = subSize + 4;
    const metaLineH = metaSize + 3;
    const subLines = subtitle ? wrapTextLines(subtitle, textMaxW, subSize, subtitleMaxLines) : [];
    const metaLines = meta ? wrapTextLines(meta, textMaxW, metaSize, metaMaxLines) : [];
    const padTop = 12;
    const titleY = y + padTop + titleSize;
    const subStartY = titleY + titleSize + 6;
    const metaGap = subLines.length && metaLines.length ? 8 : 0;
    const metaStartY = subStartY + subLines.length * subLineH + metaGap;
    const textBlockH = padTop + titleSize + (subStartY - titleY) + subLines.length * subLineH + metaGap
        + metaLines.length * metaLineH + 18;
    const cellH = cellHIn ?? Math.max(artSize + artPad * 2, textBlockH);
    const artTop = px(y + Math.round((cellH - artSize) / 2));
    const badgeCx = x + cellW - 56;
    const badgeY = y + cellH - 30;
    const svg = `
        <rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="12" fill="${theme.panel}" stroke="${theme.accent}" stroke-width="1.2"/>
        <rect x="${artLeft}" y="${artTop}" width="${artSize}" height="${artSize}" rx="10" fill="${theme.highlight}" opacity="0.28"/>
        <text ${TXT} x="${textLeft}" y="${titleY}" font-size="${titleSize}" fill="${theme.title}" font-weight="bold">${escapeXml(title)}</text>
        ${subLines.length ? buildMultilineText(textLeft, subStartY, subLines, { fontSize: subSize, lineHeight: subLineH, fill: theme.muted }) : ''}
        ${metaLines.length ? buildMultilineText(textLeft, metaStartY, metaLines, { fontSize: metaSize, lineHeight: metaLineH, fill: theme.sub }) : ''}
        ${badgeText ? buildRibbonBadge(badgeCx, badgeY, badgeText, badgeKind) : ''}
    `;
    return { svg, artLeft, artTop, artSize, cellH };
}

/** 统计 chip（圆角条，值侧截断防溢出） */
export function buildStatChip(x, y, label, value, color, theme) {
    const val = truncText(String(value ?? ''), 10);
    return `
        <rect x="${x}" y="${y - 18}" width="${STAT_CHIP_W}" height="34" rx="9" fill="${theme.panel}" stroke="${color}" stroke-width="1.2" opacity="0.92"/>
        <text ${TXT_SOFT} x="${x + 10}" y="${y + 1}" font-size="11" fill="${theme.muted}">${escapeXml(label)}</text>
        <text ${TXT_SOFT} x="${x + STAT_CHIP_W - 10}" y="${y + 1}" font-size="13" fill="${color}" text-anchor="end" font-weight="bold">${val}</text>
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

export async function renderStyledCard(width, height, innerSvg, themeKey = 'mischief', overlays = [], themeOverride = null) {
    const theme = themeOverride || CARD_THEMES[themeKey] || CARD_THEMES.mischief;
    const w = px(width);
    const h = px(height);
    const svg = svgTextStyled(
        innerSvg,
        w,
        h,
        `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">${theme.bgStops}</linearGradient>${cardSvgExtraDefs(theme)}`,
    );
    const svgLayer = rasterizeDeerSvg(svg);
    return compositeToPng(w, h, [{ input: svgLayer, top: 0, left: 0 }, ...overlays]);
}
