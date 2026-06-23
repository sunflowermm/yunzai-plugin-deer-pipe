import { pickRandom } from '../constants/game.js';
import { CARD_FLAVOR } from '../constants/eco.js';
import {
    buildCenteredEmojiTitle,
    buildCenteredPanel,
    buildFooterBar,
    buildRibbonBadge,
    buildStatGrid,
    escapeXml,
    fetchCircleAvatar,
    hashSeed,
    labelValueGridRowCount,
    statGridHeight,
    textCentered,
    textCenteredEmoji,
    truncText,
    TXT,
    TXT_SOFT,
    DEFAULT_CARD_W,
} from './svg-base.js';
import { UI_SURFACES, resolveSurfaceTheme } from './ui/theme.js';
import { buildSurfaceDecorations, renderSkinnedCard } from './ui/shell.js';
import { resolveSkinContext } from './skin.js';

const CARD_W = DEFAULT_CARD_W;
const CX = CARD_W / 2;

/** 王座光晕 + 侧柱 + 顶饰（纯 SVG） */
function buildKingRegalia(w, h, theme, seed) {
    const s = hashSeed('king-regalia', seed);
    let sparks = '';
    for (let i = 0; i < 12; i += 1) {
        const x = 40 + ((s + i * 97) % (w - 80));
        const y = 90 + ((s + i * 53) % Math.max(40, h - 160));
        const r = 1.5 + (i % 3);
        sparks += `<circle cx="${x}" cy="${y}" r="${r}" fill="${theme.accent}" opacity="${0.15 + (i % 4) * 0.08}"/>`;
    }
    return `
        <defs>
            <radialGradient id="kingHalo" cx="50%" cy="42%" r="55%">
                <stop offset="0%" style="stop-color:#ffd700;stop-opacity:0.35"/>
                <stop offset="70%" style="stop-color:#ffb300;stop-opacity:0.08"/>
                <stop offset="100%" style="stop-color:#000;stop-opacity:0"/>
            </radialGradient>
            <linearGradient id="kingPillar" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#8b6914"/>
                <stop offset="50%" style="stop-color:#ffd700"/>
                <stop offset="100%" style="stop-color:#8b6914"/>
            </linearGradient>
            <linearGradient id="kingVeil" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#000;stop-opacity:0.05"/>
                <stop offset="100%" style="stop-color:#000;stop-opacity:0.28"/>
            </linearGradient>
        </defs>
        <ellipse cx="${CX}" cy="168" rx="138" ry="100" fill="url(#kingHalo)"/>
        <rect x="18" y="96" width="28" height="${h - 110}" rx="6" fill="url(#kingPillar)" opacity="0.55"/>
        <rect x="${w - 46}" y="96" width="28" height="${h - 110}" rx="6" fill="url(#kingPillar)" opacity="0.55"/>
        <path d="M${CX - 90} 96 L${CX} 72 L${CX + 90} 96" fill="none" stroke="#ffd700" stroke-width="2" opacity="0.7"/>
        ${sparks}
        ${textCenteredEmoji(52, h - 36, '🦌', { size: 28 })}
        ${textCenteredEmoji(w - 52, h - 36, '🦌', { size: 28 })}
        ${textCenteredEmoji(52, 36, '👑', { size: 22 })}
        ${textCenteredEmoji(w - 52, 36, '👑', { size: 22 })}
    `;
}

function buildCrownSvg(cx, y) {
    return `
        <path d="M${cx - 52} ${y + 8} L${cx - 38} ${y - 16} L${cx - 18} ${y + 4} L${cx} ${y - 22} L${cx + 18} ${y + 4} L${cx + 38} ${y - 16} L${cx + 52} ${y + 8} Z"
            fill="rgba(255,215,0,0.15)" stroke="#ffd700" stroke-width="2.5" opacity="0.9"/>
        ${textCenteredEmoji(cx, y - 2, '👑', { size: 36 })}
    `;
}

/** 日度鹿王加冕卡（SVG 自绘 + QQ 头像） */
export async function generateDailyKingImage({
    date = new Date(),
    kingName = '神秘鹿友',
    kingId = '',
    count = 0,
    rankTop = [],
    dateLabel = '',
    groupLabel = '',
    skinCtx = null,
}) {
    const uiSkinId = skinCtx?.ui || resolveSkinContext(null, date).ui;
    const kingTheme = resolveSurfaceTheme(uiSkinId, UI_SURFACES.KING);
    const avatarSize = 96;
    const avatar = await fetchCircleAvatar(kingId, avatarSize, '#ffd700');
    const statRows = [
        { label: '综合得分', value: `${count} 分`, color: '#ffd700' },
        { label: '鹿王 QQ', value: kingId || '—', color: '#ffe8a0' },
    ];
    if (rankTop[1]) {
        statRows.push({ label: '榜二', value: `${truncText(rankTop[1].name, 8)} · ${rankTop[1].count}分`, color: '#c0c0c0' });
    }
    if (rankTop[2]) {
        statRows.push({ label: '榜三', value: `${truncText(rankTop[2].name, 8)} · ${rankTop[2].count}分`, color: '#cd7f32' });
    }

    const statTop = 248;
    const statH = statGridHeight(labelValueGridRowCount(statRows.length, 2), 48, 34);
    const flavorY = statTop + statH + 36;
    const H = flavorY + 44;
    const flavor = pickRandom(CARD_FLAVOR.king || CARD_FLAVOR.default);
    const titleLine = dateLabel || `${date.getMonth() + 1}月${date.getDate()}日`;
    const subtitle = groupLabel ? truncText(groupLabel, 28) : '综合日榜第一 · 今日鹿王';
    const decoSeed = hashSeed(kingId, dateLabel, count, uiSkinId);

    const inner = `
        ${buildKingRegalia(CARD_W, H, kingTheme, decoSeed)}
        ${buildSurfaceDecorations(CARD_W, H, kingTheme, uiSkinId, decoSeed)}
        <rect x="0" y="0" width="${CARD_W}" height="${H}" fill="url(#kingVeil)" rx="16"/>
        ${buildCenteredEmojiTitle(CX, 40, '👑', '日度鹿王 · 加冕典礼', { emojiSize: 28, titleSize: 26, style: TXT, fill: kingTheme.title })}
        ${textCentered(CX, 68, escapeXml(titleLine), TXT_SOFT, { size: 15, fill: kingTheme.sub, italic: true })}
        ${buildRibbonBadge(CX, 82, '鹿王册封', 'win')}
        ${buildCenteredPanel(CX, 118, CARD_W - 48, 118, kingTheme)}
        ${buildCrownSvg(CX, 152)}
        ${textCentered(CX, 198, escapeXml(truncText(kingName, 16)), TXT, { size: 24, fill: kingTheme.title, weight: 'bold' })}
        ${textCentered(CX, 222, escapeXml(subtitle), TXT_SOFT, { size: 13, fill: kingTheme.muted })}
        ${buildStatGrid(statRows, kingTheme, statTop, CARD_W, 2, 48, null)}
        ${buildFooterBar(CARD_W, flavorY, flavor, kingTheme, 52)}
    `;

    const overlays = avatar ? [{ input: avatar, top: 132, left: CX - avatarSize / 2 }] : [];
    return renderSkinnedCard({
        width: CARD_W,
        height: H,
        innerSvg: inner,
        uiSkinId,
        surface: UI_SURFACES.KING,
        theme: kingTheme,
        themeKey: 'king',
        overlays,
    });
}
