import fs from 'fs';
import sharp from 'sharp';
import { DEERPIPE_IMG } from '../constants/core.js';
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
const LINE_H = 32;
const ITEM_EXTRA = 22;
const SECTION_GAP = 10;
const HEADER_H = 188;

function escapeXml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
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
        <text x="${IMG_W / 2}" y="34" font-size="28" font-family="MiSans,sans-serif" fill="#ff6b35" text-anchor="middle" font-weight="bold">${escapeXml(HELP_TAGLINE)}</text>
        <text x="${IMG_W / 2}" y="62" font-size="20" font-family="MiSans,sans-serif" fill="#5c3d2e" text-anchor="middle" font-weight="bold">${escapeXml(pageDef.title)}</text>
        <text x="${IMG_W / 2}" y="88" font-size="15" font-family="MiSans,sans-serif" fill="#8b5a3c" text-anchor="middle">${escapeXml(pageDef.subtitle)}</text>
        <text x="${PAD}" y="118" font-size="13" font-family="MiSans,sans-serif" fill="#a07050">${escapeXml(pickRandom(HELP_EASTER_FOOTNOTES) || '')}</text>
    `);

    for (const sec of sections) {
        y += LINE_H;
        blocks.push(`
            <text x="${PAD}" y="${y}" font-size="20" font-family="MiSans,sans-serif" fill="#5c3d2e" font-weight="bold">${sec.emoji} ${escapeXml(sec.title)}</text>
        `);
        y += 6;
        for (const item of sec.items) {
            y += LINE_H;
            const tag = item.tag ? ` [${item.tag}]` : '';
            blocks.push(`
                <text x="${PAD + 6}" y="${y}" font-size="16" font-family="MiSans,sans-serif" fill="#3d2914" font-weight="bold">${escapeXml(item.cmd)}${escapeXml(tag)}</text>
                <text x="${PAD + 210}" y="${y}" font-size="15" font-family="MiSans,sans-serif" fill="#6b4a32">${escapeXml(item.desc)}</text>
                <text x="${PAD + 6}" y="${y + 16}" font-size="13" font-family="MiSans,sans-serif" fill="#a07050">└ ${escapeXml(item.quota)}</text>
            `);
            y += ITEM_EXTRA - 10;
        }
        y += SECTION_GAP;
    }

    const foot = `${HELP_FOOTER} · ${pageIndex + 1}/${totalPages}`;
    blocks.push(`
        <text x="${IMG_W / 2}" y="${imgH - 28}" font-size="13" font-family="MiSans,sans-serif" fill="#b8956a" text-anchor="middle">${escapeXml(foot)}</text>
    `);

    return Buffer.from(`
        <svg width="${IMG_W}" height="${imgH}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bg${pageIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#fff5eb"/>
                    <stop offset="50%" style="stop-color:#ffe4cc"/>
                    <stop offset="100%" style="stop-color:#ffd4b8"/>
                </linearGradient>
            </defs>
            <rect width="${IMG_W}" height="${imgH}" fill="url(#bg${pageIndex})" rx="16"/>
            <rect x="8" y="8" width="${IMG_W - 16}" height="${imgH - 16}" fill="none" stroke="#ff9a56" stroke-width="3" rx="14" stroke-dasharray="8 6"/>
            ${blocks.join('\n')}
        </svg>
    `);
}

async function composePage(pageDef, pageIndex, totalPages) {
    const imgH = estimatePageHeight(pageDef);
    const deerBuf = fs.readFileSync(DEERPIPE_IMG);
    const deerBig = await sharp(deerBuf)
        .resize(pageIndex === 0 ? 150 : 120, pageIndex === 0 ? 124 : 99)
        .rotate(pageIndex === 0 ? -8 : 10, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    const deerSmall = await sharp(deerBuf)
        .resize(64, 52)
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

/** @deprecated 单页兼容 */
export async function generateHelpImage() {
    const [first] = await generateHelpImages();
    return first;
}
