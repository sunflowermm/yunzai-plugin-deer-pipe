import fs from 'fs';
import sharp from 'sharp';
import { DEERPIPE_IMG } from '../constants/core.js';
import { HELP_CATALOG, HELP_FOOTER, HELP_TAGLINE } from '../constants/help-catalog.js';

const IMG_W = 720;
const PAD = 20;
const LINE_H = 34;
const SECTION_GAP = 12;
const HEADER_H = 200;

function escapeXml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function estimateHeight() {
    let h = HEADER_H + PAD;
    for (const sec of HELP_CATALOG) {
        h += LINE_H + 8;
        h += sec.items.length * (LINE_H + 10);
        h += SECTION_GAP;
    }
    return h + 56;
}

function buildTextSvg(imgH) {
    let y = HEADER_H + PAD;
    const blocks = [];

    blocks.push(`
        <text x="${IMG_W / 2}" y="36" font-size="32" font-family="MiSans" fill="#ff6b35" text-anchor="middle" font-weight="bold">${escapeXml(HELP_TAGLINE)}</text>
        <text x="${IMG_W / 2}" y="68" font-size="18" font-family="MiSans" fill="#8b5a3c" text-anchor="middle">发送「鹿帮助」· 图中鹿管对本次社死概不负责</text>
    `);

    for (const sec of HELP_CATALOG) {
        y += LINE_H;
        blocks.push(`
            <text x="${PAD}" y="${y}" font-size="22" font-family="MiSans" fill="#5c3d2e" font-weight="bold">${sec.emoji} ${escapeXml(sec.title)}</text>
        `);
        y += 8;
        for (const item of sec.items) {
            y += LINE_H;
            const tag = item.tag ? ` [${item.tag}]` : '';
            blocks.push(`
                <text x="${PAD + 8}" y="${y}" font-size="17" font-family="MiSans" fill="#3d2914" font-weight="bold">${escapeXml(item.cmd)}${escapeXml(tag)}</text>
                <text x="${PAD + 220}" y="${y}" font-size="16" font-family="MiSans" fill="#6b4a32">${escapeXml(item.desc)}</text>
                <text x="${PAD + 8}" y="${y + 18}" font-size="14" font-family="MiSans" fill="#a07050">└ ${escapeXml(item.quota)}</text>
            `);
            y += 10;
        }
        y += SECTION_GAP;
    }

    blocks.push(`
        <text x="${IMG_W / 2}" y="${imgH - 24}" font-size="14" font-family="MiSans" fill="#b8956a" text-anchor="middle">${escapeXml(HELP_FOOTER)}</text>
    `);

    return Buffer.from(`
        <svg width="${IMG_W}" height="${imgH}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#fff5eb"/>
                    <stop offset="50%" style="stop-color:#ffe4cc"/>
                    <stop offset="100%" style="stop-color:#ffd4b8"/>
                </linearGradient>
            </defs>
            <rect width="${IMG_W}" height="${imgH}" fill="url(#bg)" rx="16"/>
            <rect x="8" y="8" width="${IMG_W - 16}" height="${imgH - 16}" fill="none" stroke="#ff9a56" stroke-width="3" rx="14" stroke-dasharray="8 6"/>
            ${blocks.join('\n')}
        </svg>
    `);
}

/** 生成搞笑鹿帮助长图（含鹿管本体） */
export async function generateHelpImage() {
    const imgH = estimateHeight();
    const deerBuf = fs.readFileSync(DEERPIPE_IMG);
    const deerBig = await sharp(deerBuf).resize(160, 132).rotate(-8, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    const deerSmall = await sharp(deerBuf).resize(72, 59).rotate(12, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

    const base = sharp({
        create: {
            width: IMG_W,
            height: imgH,
            channels: 4,
            background: { r: 255, g: 245, b: 235, alpha: 1 },
        },
    });

    return base
        .composite([
            { input: buildTextSvg(imgH), top: 0, left: 0 },
            { input: deerBig, top: 78, left: IMG_W - 200 },
            { input: deerSmall, top: imgH - 100, left: IMG_W - 100 },
        ])
        .png()
        .toBuffer();
}
