import fs from 'fs';
import sharp from 'sharp';
import { DEERPIPE_IMG } from '../constants/core.js';
import { escapeXml, truncText, textCentered, textEmoji, TXT, TXT_SOFT, svgTextStyled } from './svg-base.js';
import { HELP_EASTER_FOOTNOTES } from '../constants/eco.js';
import {
    HELP_FOOTER,
    HELP_PAGES,
    HELP_SECTIONS,
    HELP_TAGLINE,
} from '../constants/help-catalog.js';
import { pickRandom } from '../constants/game.js';

const IMG_W = 720;
const PAD = 20;
const DESC_X = PAD + 208;
const DESC_MAX = 34;
const LINE_H = 32;
const ITEM_EXTRA = 24;
const SECTION_GAP = 10;
const HEADER_H = 188;

let deerBaseBuf = null;

async function loadDeerAsset() {
    if (deerBaseBuf) return deerBaseBuf;
    deerBaseBuf = await sharp(fs.readFileSync(DEERPIPE_IMG))
        .ensureAlpha()
        .trim({ threshold: 12 })
        .png()
        .toBuffer();
    return deerBaseBuf;
}

function truncDesc(text) {
    return truncText(text, DESC_MAX);
}

function sectionsForPage(pageDef) {
    return pageDef.sectionKeys.map((key) => HELP_SECTIONS[key]).filter(Boolean);
}

function estimatePageHeight(pageDef) {
    let h = HEADER_H + PAD;
    for (const sec of sectionsForPage(pageDef)) {
        h += LINE_H + 6;
        h += sec.items.length * (LINE_H + ITEM_EXTRA);
        h += SECTION_GAP;
    }
    return h + 72;
}

function buildPageSvg(pageDef, imgH, pageIndex, totalPages) {
    const sections = sectionsForPage(pageDef);
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
        blocks.push(`
            ${textEmoji(PAD, y, sec.emoji, { size: 20 })}
            <text ${TXT} x="${PAD + 28}" y="${y}" font-size="20" fill="#5c3d2e" font-weight="bold">${escapeXml(sec.title)}</text>
        `);
        y += 6;
        for (const item of sec.items) {
            y += LINE_H;
            const tag = item.tag ? ` [${item.tag}]` : '';
            blocks.push(`
                <text ${TXT} x="${PAD + 6}" y="${y}" font-size="16" fill="#3d2914" font-weight="bold">${escapeXml(item.cmd)}${escapeXml(tag)}</text>
                <text ${TXT_SOFT} x="${DESC_X}" y="${y}" font-size="15" fill="#6b4a32">${truncDesc(item.desc)}</text>
                <text ${TXT_SOFT} x="${PAD + 6}" y="${y + 18}" font-size="13" fill="#a07050">└ ${truncText(item.quota, 42)}</text>
            `);
            y += ITEM_EXTRA;
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
    const deerSrc = await loadDeerAsset();
    const deerBig = await sharp(deerSrc)
        .resize(pageIndex === 0 ? 150 : 120, pageIndex === 0 ? 124 : 99, { fit: 'inside' })
        .rotate(pageIndex === 0 ? -8 : 10, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    const deerSmall = await sharp(deerSrc)
        .resize(64, 52, { fit: 'inside' })
        .rotate(-12, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    return sharp({
        create: {
            width: IMG_W,
            height: imgH,
            channels: 4,
            background: { r: 255, g: 245, b: 235, alpha: 1 },
        },
    })
        .composite([
            { input: buildPageSvg(pageDef, imgH, pageIndex, totalPages), top: 0, left: 0 },
            { input: deerBig, top: 72, left: IMG_W - (pageIndex === 0 ? 190 : 165) },
            { input: deerSmall, top: imgH - 88, left: PAD + 4 },
        ])
        .png()
        .toBuffer();
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
