import {
    EXTRA_DEER,
    EXTRA_DEER_IDS,
    EXTRA_DEER_SKILLS,
    getExtraDeerDef,
    formatExtraDeerQuotaBrief,
} from '../constants/extra-deer.js';
import { resolveExtraDeerPortraitSkin } from './extra-deer.js';
import {
    buildCenteredEmojiTitleRaster,
    emojiSvgImage,
} from './emoji-compose.js';
import {
    loadExtraDeerArt,
    loadExtraDeerSkillArt,
    loadBrandLogo,
    stickerOverlay,
} from './sticker-compose.js';
import { resolveSurfaceTheme, resolveDecorationProfile, UI_SURFACES } from './ui/theme.js';
import { buildSkinCardDecorations } from './ui/components.js';
import { statusHeaderOffset } from './ui/skin-assets.js';
import { renderSkinnedCardStacked } from './ui/shell.js';
import {
    buildFooterBar,
    buildMultilineText,
    buildSectionTitle,
    buildSideArtCell,
    DEFAULT_CARD_W,
    deerTextForSvg,
    escapeXml,
    hashSeed,
    textCentered,
    wrapTextLines,
    TXT,
    TXT_SOFT,
} from './svg-base.js';

const CARD_W = DEFAULT_CARD_W;
const CX = CARD_W / 2;
const CELL_W = 324;
const THUMB = 84;
const GAP = 14;
const PAD_X = 20;
const SKILL_ICON = 40;

async function buildExtraDeerGrid(theme, topY, thumbs, portraitSkin) {
    const ids = EXTRA_DEER_IDS;
    const rowHeights = [];
    for (const id of ids) {
        const d = getExtraDeerDef(id);
        const measure = buildSideArtCell({
            x: 0,
            y: 0,
            cellW: CELL_W,
            artSize: THUMB,
            theme,
            title: d.name,
            subtitle: deerTextForSvg(d.synergyTip),
            meta: formatExtraDeerQuotaBrief(id),
            badgeText: `转职${d.name.replace(/鹿$/, '')}`,
            badgeKind: 'accent',
            titleSize: 17,
            subSize: 12,
            metaSize: 11,
            subtitleMaxLines: 2,
            metaMaxLines: 2,
        });
        rowHeights.push(measure.cellH + GAP);
    }
    const rowTops = [topY];
    for (let r = 1; r < ids.length; r += 1) {
        rowTops[r] = rowTops[r - 1] + rowHeights[r - 1];
    }
    const cellParts = [];
    for (let i = 0; i < ids.length; i += 1) {
        const id = ids[i];
        const d = getExtraDeerDef(id);
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = PAD_X + col * (CELL_W + GAP);
        const y = rowTops[row];
        const cell = buildSideArtCell({
            x,
            y,
            cellW: CELL_W,
            artSize: THUMB,
            theme,
            title: d.name,
            subtitle: deerTextForSvg(d.synergyTip),
            meta: formatExtraDeerQuotaBrief(id),
            badgeText: `转职${d.name.replace(/鹿$/, '')}`,
            badgeKind: 'accent',
            titleSize: 17,
            subSize: 12,
            metaSize: 11,
            subtitleMaxLines: 2,
            metaMaxLines: 2,
        });
        const emojiArt = !thumbs[i] && d.emoji
            ? await emojiSvgImage(cell.artLeft + THUMB / 2, cell.artTop + THUMB / 2 + 4, d.emoji, 16)
            : '';
        cellParts.push({ svg: cell.svg + emojiArt, cell, thumb: thumbs[i] });
    }
    const totalH = rowHeights.reduce((sum, h) => sum + h, 0);
    return { svg: cellParts.map((c) => c.svg).join(''), cellParts, height: totalH };
}

async function buildExtraSkillGrid(theme, topY, skillIcons) {
    const ids = EXTRA_DEER_IDS;
    let svg = buildSectionTitle(CX, topY, '番外专属技 · 1次/日', theme);
    const gridTop = topY + 24;
    const cellParts = [];
    for (let i = 0; i < ids.length; i += 1) {
        const id = ids[i];
        const skill = EXTRA_DEER_SKILLS[id];
        const d = EXTRA_DEER[id];
        const col = i % 2;
        const x = PAD_X + col * (CELL_W + GAP);
        const y = gridTop;
        const cell = buildSideArtCell({
            x,
            y,
            cellW: CELL_W,
            artSize: SKILL_ICON,
            artPad: 6,
            theme,
            title: `${skill.name} · ${d.name}`,
            subtitle: deerTextForSvg(`${skill.cmd} · ${skill.desc}`),
            titleSize: 14,
            subSize: 11,
            subtitleMaxLines: 4,
        });
        const emojiArt = !skillIcons[i] && d.emoji
            ? await emojiSvgImage(cell.artLeft + SKILL_ICON / 2, cell.artTop + SKILL_ICON / 2 + 2, d.emoji, 14)
            : '';
        cellParts.push({ svg: cell.svg + emojiArt, cell, icon: skillIcons[i] });
    }
    const maxCellH = Math.max(...cellParts.map((c) => c.cell.cellH));
    return {
        svg: svg + cellParts.map((c) => c.svg).join(''),
        height: 24 + maxCellH + 8,
        cellParts,
    };
}

export async function generateExtraDeerCatalogImage(opts = {}) {
    const uiSkinId = opts.skinCtx?.ui || 'default';
    const portraitSkin = resolveExtraDeerPortraitSkin(opts.date || new Date());
    const theme = resolveSurfaceTheme(uiSkinId, UI_SURFACES.PROFESSION_CATALOG);
    const decoProfile = resolveDecorationProfile(uiSkinId);
    const headerShift = statusHeaderOffset(uiSkinId);

    const [brandLogo, ...thumbs] = await Promise.all([
        loadBrandLogo(),
        ...EXTRA_DEER_IDS.map((id) => loadExtraDeerArt(id, THUMB, portraitSkin)),
    ]);
    const skillIcons = await Promise.all(EXTRA_DEER_IDS.map((id) => loadExtraDeerSkillArt(id, SKILL_ICON)));

    const title = await buildCenteredEmojiTitleRaster(CX, 36 + headerShift, '✨', '番外 · 隐藏鹿', {
        emojiSize: 24, titleSize: 22, style: TXT, fill: theme.title,
    });

    const introY = 64 + headerShift;
    const gridTop = introY + 28;
    const profGrid = await buildExtraDeerGrid(theme, gridTop, thumbs, portraitSkin);
    const skillsTop = gridTop + profGrid.height + 16;
    const skillsBlock = await buildExtraSkillGrid(theme, skillsTop, skillIcons);
    const footerReserve = 52;
    const H = skillsTop + skillsBlock.height + footerReserve;

    const seed = hashSeed('extra-deer-catalog', uiSkinId, portraitSkin);
    const backgroundSvg = `
        <rect width="${CARD_W}" height="${H}" rx="16" fill="url(#cardBg)"/>
        ${buildSkinCardDecorations(CARD_W, H, theme, seed, decoProfile)}
    `;
    const contentSvg = `
        ${title.svg}
        ${textCentered(CX, introY, '不在八职业表内 · 转职王美嘉 / 转职雨木木 · 下方为天赋与专属技', TXT_SOFT, { size: 12, fill: theme.muted })}
        ${profGrid.svg}
        ${skillsBlock.svg}
        ${buildFooterBar(CARD_W, H - 26, '番外鹿与八职业互斥转职 · 当日锁定', theme, 46)}
    `;

    const overlays = [...title.overlays];
    profGrid.cellParts.forEach((part) => {
        if (!part.thumb) return;
        overlays.push(stickerOverlay(part.thumb, part.cell.artTop, part.cell.artLeft));
    });
    skillsBlock.cellParts.forEach((part) => {
        if (!part.icon) return;
        overlays.push(stickerOverlay(part.icon, part.cell.artTop, part.cell.artLeft));
    });
    if (brandLogo) overlays.push(stickerOverlay(brandLogo, H - 40, 22));

    return renderSkinnedCardStacked({
        width: CARD_W,
        height: H,
        backgroundSvg,
        contentSvg,
        uiSkinId,
        theme,
        themeKey: 'profession',
        overlays: overlays.filter(Boolean),
        opts: { stickerSeed: seed },
    });
}
