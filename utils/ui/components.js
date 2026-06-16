/**
 * UI 皮肤可复用 SVG 组件 — 供鹿况/月历/职业/帮助等 surface 共用
 */

import {
    buildCenteredPanel,
    buildFooterBar,
    buildMultilineText,
    buildSectionTitleRow,
    cardSvgExtraDefs,
    escapeXml,
    hashSeed,
    textCentered,
    textCenteredEmoji,
    truncText,
    TXT,
    TXT_SOFT,
} from '../svg-base.js';
import { resolveDecorationProfile } from './theme.js';

function seededRandom(seed) {
    let s = seed >>> 0;
    return () => {
        s = Math.imul(s ^ (s >>> 15), 1 | s);
        s ^= s + Math.imul(s ^ (s >>> 7), 61 | s);
        return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
    };
}

/** 虚线边框 + 光点（支持皮肤 decoration profile） */
export function buildSkinCardDecorations(w, h, theme, seed = 1, profile = {}) {
    const dotCount = profile.dotCount ?? 16;
    const dashPattern = profile.dashPattern ?? '9 7';
    const outerRx = profile.cornerRadius ?? 18;
    const innerRx = Math.max(10, outerRx - 4);
    const rng = seededRandom(seed);
    let dots = '';
    for (let i = 0; i < dotCount; i += 1) {
        const x = Math.floor(rng() * (w - 48)) + 24;
        const y = Math.floor(rng() * (h - 48)) + 24;
        const r = (1.2 + rng() * 2.8).toFixed(1);
        const op = (0.1 + rng() * 0.28).toFixed(2);
        dots += `<circle cx="${x}" cy="${y}" r="${r}" fill="${theme.accent}" opacity="${op}"/>`;
    }
    return `
        <rect x="5" y="5" width="${w - 10}" height="${h - 10}" rx="${outerRx}" fill="none" stroke="${theme.accent}" stroke-width="2.5" stroke-dasharray="${dashPattern}" opacity="0.8"/>
        <rect x="11" y="11" width="${w - 22}" height="${h - 22}" rx="${innerRx}" fill="none" stroke="${theme.highlight || theme.accent}" stroke-width="1" opacity="0.35"/>
        <rect x="18" y="18" width="${w - 36}" height="4" rx="2" fill="url(#accentGlow)" opacity="0.85"/>
        ${dots}
    `;
}

export function buildStatusPanelShell({ width, height, theme, uiSkinId, seed, innerSvg }) {
    const profile = resolveDecorationProfile(uiSkinId);
    return `
        <rect width="${width}" height="${height}" rx="16" fill="url(#sbg)"/>
        ${buildSkinCardDecorations(width, height, theme, seed, profile)}
        ${innerSvg}
    `;
}

/** 鹿况顶栏：标题 + 昵称 + tagline（y0 随皮肤 chrome 下移） */
export function buildStatusHeader({ cx, theme, name, tagline, y0 = 44 }) {
    return `
        ${textCentered(cx, y0, '今日鹿况', TXT, { size: 28, fill: theme.title, weight: 'bold' })}
        ${textCentered(cx, y0 + 28, truncText(name, 18), TXT, { size: 20, fill: theme.sub })}
        ${textCentered(cx, y0 + 50, escapeXml(tagline), TXT_SOFT, { size: 13, fill: theme.muted, italic: true })}
    `;
}

/** 天象条 */
export function buildWeatherPanel({ width, top, height, theme, weatherLines, weatherEmojiSvg, textX }) {
    return `
        ${buildCenteredPanel(width / 2, top, width - 32, height, theme)}
        ${weatherEmojiSvg}
        ${buildMultilineText(textX, top + 22, weatherLines, { fontSize: 13, lineHeight: 17, fill: theme.line })}
    `;
}

/** 心情 + 计数区 */
export function buildStatusStatBlock({ cx, statTop, theme, moodEmoji, countText, attemptsLine, riskLine, auraLine, balancedLine = '' }) {
    const baseY = statTop + (balancedLine ? 134 : 114);
    return `
        ${textCenteredEmoji(cx, statTop + 28, moodEmoji, { size: 36 })}
        ${textCentered(cx, statTop + 68, escapeXml(countText), TXT, { size: 30, fill: theme.title, weight: 'bold' })}
        ${textCentered(cx, statTop + 94, escapeXml(attemptsLine), TXT_SOFT, { size: 15, fill: theme.sub })}
        ${balancedLine}
        ${textCentered(cx, baseY, truncText(riskLine, 52), TXT_SOFT, { size: 14, fill: theme.line })}
        ${textCentered(cx, baseY + 24, escapeXml(auraLine), TXT_SOFT, { size: 14, fill: theme.auraFill || theme.line })}
    `;
}

/** 左对齐节标题（返回 svg + icon slot） */
export function buildSectionHeader(y, title, theme, opts = {}) {
    return buildSectionTitleRow(y, title, theme, {
        padLeft: opts.padLeft ?? 24,
        iconSize: opts.iconSize ?? 30,
        fontSize: opts.fontSize ?? 14,
        fill: opts.fill ?? theme.muted,
    });
}

export function buildPanelFooter(width, y, text, theme, maxLen = 56) {
    return buildFooterBar(width, y, text, theme, maxLen);
}

/** 月历整页背景 SVG */
export function buildCalendarBackgroundSvg({ width, height, gradientStops }) {
    return `
        <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                ${gradientStops}
            </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bg)"/>
    `;
}

/** 帮助页背景（渐变 defs 由 svgTextStyled 注入，id=helpBg） */
export function buildHelpPageBackgroundSvg(width, height, theme) {
    return `
        <rect width="${width}" height="${height}" fill="url(#helpBg)" rx="16"/>
        ${buildSkinCardDecorations(width, height, theme, hashSeed('help-page'), { dotCount: 12, dashPattern: '8 6' })}
    `;
}

/** 帮助页顶栏文字色取自 theme */
export function helpPageTitleColors(theme) {
    return {
        tagline: theme.accent || '#ff6b35',
        title: theme.title || '#5c3d2e',
        subtitle: theme.sub || '#8b5a3c',
        muted: theme.muted || '#a07050',
        cmd: theme.line || '#3d2818',
        desc: theme.sub || '#6b4423',
    };
}
