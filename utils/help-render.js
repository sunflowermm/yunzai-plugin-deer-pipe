import { HELP_SECTION_ART } from '../constants/deer-assets.js';
import { escapeXml, truncText, textCentered, textEmoji, TXT, TXT_SOFT, TXT_PLAIN, svgTextStyled } from './svg-base.js';
import { HELP_EASTER_FOOTNOTES } from '../constants/eco.js';
import {
    HELP_FOOTER,
    HELP_PAGES,
    HELP_SECTIONS,
    HELP_TAGLINE,
} from '../constants/help-catalog.js';
import { pickRandom } from '../constants/game.js';
import {
    loadBrandLogo,
    loadCatalogArt,
    loadSectionArt,
    stickerOverlay,
} from './sticker-compose.js';
import { compositeToPng } from './render-pipeline.js';

const IMG_W = 720;
const PAD = 20;
const CMD_X = PAD + 6;
const CMD_MAX = 28;
const DESC_MAX = 52;
const LINE_H = 32;
const ITEM_PAD = 8;
const ITEM_H = 56;
const SECTION_GAP = 12;
const HEADER_H = 188;
const SECTION_ICON = 28;

function truncCmd(text) {
    return truncText(text, CMD_MAX);
}

function truncDesc(text) {
    return truncText(text, DESC_MAX);
}

function itemBlockHeight() {
    return ITEM_PAD + ITEM_H;
}

function sectionsForPage(pageDef) {
    return pageDef.sectionKeys.map((key) => HELP_SECTIONS[key]).filter(Boolean);
}

function estimatePageHeight(pageDef) {
    let h = HEADER_H + PAD;
    for (const sec of sectionsForPage(pageDef)) {
        h += LINE_H + 6;
        h += sec.items.length * itemBlockHeight();
        h += SECTION_GAP;
    }
    return h + 72;
}

async function loadSectionIcon(sectionKey) {
    const artKey = HELP_SECTION_ART[sectionKey];
    if (!artKey) return null;
    if (artKey === 'catalog') return loadCatalogArt(SECTION_ICON);
    return loadSectionArt(artKey, SECTION_ICON);
}

function buildPageSvg(pageDef, imgH, pageIndex, totalPages) {
    const sections = pageDef.sectionKeys.map((key) => ({ key, ...HELP_SECTIONS[key] })).filter((s) => s.title);
    let y = HEADER_H + PAD;
    const blocks = [];
    blocks.push(`
        ${textCentered(IMG_W / 2, 34, escapeXml(HELP_TAGLINE), TXT, { size: 28, fill: '#ff6b35', weight: 'bold' })}
        ${textCentered(IMG_W / 2, 62, escapeXml(pageDef.title), TXT, { size: 20, fill: '#5c3d2e', weight: 'bold' })}
        ${textCentered(IMG_W / 2, 88, escapeXml(pageDef.subtitle), TXT_SOFT, { size: 15, fill: '#8b5a3c' })}
        ${textCentered(IMG_W / 2, 118, truncText(pickRandom(HELP_EASTER_FOOTNOTES) || '', 52), TXT_SOFT, { size: 13, fill: '#a07050' })}
    `);
    for (const sec of sections) {
        y += LINE_H;
        const titleX = HELP_SECTION_ART[sec.key] ? PAD + SECTION_ICON + 8 : PAD + 28;
        blocks.push(`
            ${HELP_SECTION_ART[sec.key] ? '' : textEmoji(PAD, y, sec.emoji, { size: 20 })}
            <text ${TXT} x="${titleX}" y="${y}" font-size="20" fill="#5c3d2e" font-weight="bold">${escapeXml(sec.title)}</text>
        `);
        y += 6;
        for (const item of sec.items) {
            y += ITEM_PAD;
            const tag = item.tag ? ` [${item.tag}]` : '';
            blocks.push(`
                <text ${TXT_PLAIN} x="${CMD_X}" y="${y + 16}" font-size="15" fill="#3d2914" font-weight="bold">${truncCmd(item.cmd)}${escapeXml(tag)}</text>
                <text ${TXT_PLAIN} x="${CMD_X}" y="${y + 34}" font-size="14" fill="#6b4a32">${truncDesc(item.desc)}</text>
                <text ${TXT_PLAIN} x="${CMD_X}" y="${y + 50}" font-size="12" fill="#a07050">└ ${truncText(item.quota, 54)}</text>
            `);
            y += ITEM_H;
        }
        y += SECTION_GAP;
    }

    const foot = `${HELP_FOOTER} · ${pageIndex + 1}/${totalPages}`;
    blocks.push(textCentered(IMG_W / 2, imgH - 28, escapeXml(foot), TXT_SOFT, { size: 13, fill: '#b8956a' }));
    const body = `
        <rect width="${IMG_W}" height="${imgH}" fill="url(#bg${pageIndex})" rx="16"/>
        <rect x="8" y="8" width="${IMG_W - 16}" height="${imgH - 16}" fill="none" stroke="#ff9a56" stroke-width="3" rx="14" stroke-dasharray="8 6"/>
        ${blocks.join('\n')}
    `;
    return svgTextStyled(body, IMG_W, imgH, `
        <linearGradient id="bg${pageIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#fff5eb"/>
            <stop offset="50%" style="stop-color:#ffe4cc"/>
            <stop offset="100%" style="stop-color:#ffd4b8"/>
        </linearGradient>
    `);
}

async function composePage(pageDef, pageIndex, totalPages) {
    const imgH = estimatePageHeight(pageDef);
    const [deerBig, deerSmall, brandLogo, ...sectionIcons] = await Promise.all([
        loadBrandLogo(pageIndex === 0 ? 40 : 32),
        loadBrandLogo(26),
        loadBrandLogo(22),
        ...pageDef.sectionKeys.map((key) => loadSectionIcon(key)),
    ]);

    const layers = [
        { input: buildPageSvg(pageDef, imgH, pageIndex, totalPages), top: 0, left: 0 },
    ];
    if (deerBig) layers.push({ input: deerBig, top: 12, left: IMG_W - (pageIndex === 0 ? 96 : 88) });
    if (deerSmall) layers.push({ input: deerSmall, top: imgH - 88, left: PAD + 4 });
    if (brandLogo) layers.push({ input: brandLogo, top: 14, left: PAD + 4 });

    let y = HEADER_H + PAD;
    for (let i = 0; i < pageDef.sectionKeys.length; i += 1) {
        y += LINE_H;
        const icon = sectionIcons[i];
        if (icon) {
            const overlay = stickerOverlay(icon, y - SECTION_ICON + 4, PAD);
            if (overlay) layers.push(overlay);
        }
        const sec = HELP_SECTIONS[pageDef.sectionKeys[i]];
        y += 6 + sec.items.length * itemBlockHeight() + SECTION_GAP;
    }

    return compositeToPng(IMG_W, imgH, layers, { r: 255, g: 245, b: 235, alpha: 1 });
}

/** 生成双页鹿帮助图 */
export async function generateHelpImages() {
    const total = HELP_PAGES.length;
    const buffers = [];
    for (let i = 0; i < total; i += 1) {
        buffers.push(await composePage(HELP_PAGES[i], i, total));
    }
    return buffers;
}
