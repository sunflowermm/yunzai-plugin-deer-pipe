import { HELP_SECTION_ART } from '../constants/deer-assets.js';
import {
    escapeXml, truncText, textCentered, estimateTextWidth, TXT, TXT_SOFT, TXT_PLAIN, svgTextStyled, hashSeed,
} from './svg-base.js';
import { HELP_EASTER_FOOTNOTES } from '../constants/eco.js';
import {
    HELP_FOOTER,
    HELP_PAGES,
    HELP_SECTIONS,
    HELP_TAGLINE,
} from '../constants/help-catalog.js';
import { pickRandom } from '../constants/game.js';
import { buildInlineEmojiText } from './emoji-compose.js';
import {
    loadBrandLogo,
    loadCatalogArt,
    loadSectionArt,
    scatterDeerMarkOverlays,
    stickerOverlay,
} from './sticker-compose.js';
import { compositeToPng } from './render-pipeline.js';
import { UI_SURFACES, resolveSurfaceTheme } from './ui/theme.js';
import { buildHelpPageBackgroundSvg, helpPageTitleColors } from './ui/components.js';
import {
    buildChromeSvgFragment,
    statusHeaderOffset,
} from './ui/skin-assets.js';

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

async function buildPageContent(pageDef, imgH, pageIndex, totalPages, uiSkinId, theme, colors, headerShift = 0) {
    const sections = pageDef.sectionKeys.map((key) => ({ key, ...HELP_SECTIONS[key] })).filter((s) => s.title);
    let y = HEADER_H + PAD;
    const blocks = [];
    const yTag = 34 + headerShift;
    const yTitle = 62 + headerShift;
    const ySub = 88 + headerShift;
    const yFoot = 118 + headerShift;
    blocks.push(`
        ${textCentered(IMG_W / 2, yTag, escapeXml(HELP_TAGLINE), TXT, { size: 28, fill: colors.tagline, weight: 'bold' })}
        ${await buildInlineEmojiText(IMG_W / 2 - estimateTitleHalf(pageDef.title, 20), yTitle, pageDef.title, { style: TXT, fontSize: 20, fill: colors.title, weight: 'bold' })}
        ${await buildInlineEmojiText(IMG_W / 2 - estimateTitleHalf(pageDef.subtitle, 15), ySub, pageDef.subtitle, { style: TXT_SOFT, fontSize: 15, fill: colors.subtitle })}
        ${textCentered(IMG_W / 2, yFoot, truncText(pickRandom(HELP_EASTER_FOOTNOTES) || '', 52), TXT_SOFT, { size: 13, fill: colors.muted })}
    `);
    for (const sec of sections) {
        y += LINE_H;
        const titleX = HELP_SECTION_ART[sec.key] ? PAD + SECTION_ICON + 8 : PAD + 28;
        if (!HELP_SECTION_ART[sec.key]) {
            blocks.push(await buildInlineEmojiText(PAD, y, `${sec.emoji} ${sec.title}`, {
                style: TXT, fontSize: 20, fill: colors.title, weight: 'bold',
            }));
        } else {
            blocks.push(`<text ${TXT} x="${titleX}" y="${y}" font-size="20" fill="${colors.title}" font-weight="bold">${escapeXml(sec.title)}</text>`);
        }
        y += 6;
        for (const item of sec.items) {
            y += ITEM_PAD;
            const tag = item.tag ? ` [${item.tag}]` : '';
            blocks.push(await buildInlineEmojiText(CMD_X, y + 16, `${truncCmd(item.cmd)}${tag}`, {
                style: TXT_PLAIN, fontSize: 15, fill: colors.cmd, weight: 'bold',
            }));
            blocks.push(await buildInlineEmojiText(CMD_X, y + 34, truncDesc(item.desc), {
                style: TXT_PLAIN, fontSize: 14, fill: colors.desc,
            }));
            blocks.push(await buildInlineEmojiText(CMD_X, y + 50, `└ ${truncText(item.quota, 54)}`, {
                style: TXT_PLAIN, fontSize: 12, fill: colors.muted,
            }));
            y += ITEM_H;
        }
        y += SECTION_GAP;
    }

    const foot = `${HELP_FOOTER} · ${pageIndex + 1}/${totalPages}`;
    blocks.push(textCentered(IMG_W / 2, imgH - 28, escapeXml(foot), TXT_SOFT, { size: 13, fill: colors.muted }));
    const chromeSvg = await buildChromeSvgFragment(uiSkinId, IMG_W);
    const body = `
        ${buildHelpPageBackgroundSvg(IMG_W, imgH, theme)}
        ${chromeSvg}
        <rect x="8" y="8" width="${IMG_W - 16}" height="${imgH - 16}" fill="none" stroke="${theme.accent}" stroke-width="3" rx="14" stroke-dasharray="8 6"/>
        ${blocks.join('\n')}
    `;
    return svgTextStyled(body, IMG_W, imgH, `<linearGradient id="helpBg" x1="0%" y1="0%" x2="100%" y2="100%">${theme.bgStops}</linearGradient>`);
}

function estimateTitleHalf(text, fontSize) {
    const s = String(text ?? '');
    const plain = s.replace(/\p{Extended_Pictographic}/gu, '');
    const emojiCount = (s.match(/\p{Extended_Pictographic}/gu) || []).length;
    const emojiW = emojiCount * Math.round(fontSize * 1.12 + 3);
    return (estimateTextWidth(plain, fontSize) + emojiW) / 2;
}

async function composePage(pageDef, pageIndex, totalPages, uiSkinId, theme, colors) {
    const imgH = estimatePageHeight(pageDef);
    const headerShift = statusHeaderOffset(uiSkinId);
    const contentEndY = imgH - 72;
    const [deerBig, deerSmall, brandLogo, ...sectionIcons] = await Promise.all([
        loadBrandLogo(pageIndex === 0 ? 40 : 32),
        loadBrandLogo(26),
        loadBrandLogo(22),
        ...pageDef.sectionKeys.map((key) => loadSectionIcon(key)),
    ]);

    const sideDeer = [
        ...(await scatterDeerMarkOverlays(52, contentEndY - HEADER_H, HEADER_H, IMG_W - 60, {
            count: 4,
            seed: hashSeed('help-side-r', pageIndex, uiSkinId),
            markHeight: 40,
            opacity: 0.12,
        })),
        ...(await scatterDeerMarkOverlays(48, contentEndY - HEADER_H, HEADER_H + 40, 4, {
            count: 3,
            seed: hashSeed('help-side-l', pageIndex, uiSkinId),
            markHeight: 36,
            opacity: 0.1,
        })),
    ];
    const bottomDeer = await scatterDeerMarkOverlays(IMG_W - 80, 56, contentEndY, 40, {
        count: 5,
        seed: hashSeed('help-bottom', pageIndex, uiSkinId),
        markHeight: 40,
        opacity: 0.18,
    });

    const layers = [
        { input: await buildPageContent(pageDef, imgH, pageIndex, totalPages, uiSkinId, theme, colors, headerShift), top: 0, left: 0 },
        ...sideDeer,
        ...bottomDeer,
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

/** 生成双页鹿帮助图 @param {{ skinCtx?: object }} [opts] */
export async function generateHelpImages(opts = {}) {
    const uiSkinId = opts.skinCtx?.ui || 'default';
    const theme = resolveSurfaceTheme(uiSkinId, UI_SURFACES.HELP);
    const colors = helpPageTitleColors(theme);
    const total = HELP_PAGES.length;
    const buffers = [];
    for (let i = 0; i < total; i += 1) {
        buffers.push(await composePage(HELP_PAGES[i], i, total, uiSkinId, theme, colors));
    }
    return buffers;
}
