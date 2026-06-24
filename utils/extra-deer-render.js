import {
    EXTRA_DEER,
    EXTRA_DEER_IDS,
    getExtraDeerDef,
    getExtraDeerSkill,
    formatExtraDeerQuotaBrief,
} from '../constants/extra-deer.js';
import { formatTalentDetailParts } from '../constants/talent-text.js';
import {
    expandTalentTextLines,
    sideArtCellTextMaxW,
} from './profession-detail-render.js';
import { resolveProfessionArtSkin } from './skin.js';
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
    buildSectionTitle,
    buildSideArtCell,
    DEFAULT_CARD_W,
    deerTextForSvg,
    hashSeed,
    textCentered,
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
const GRID_COLS = 2;
const EXTRA_TEXT_MAX_W = sideArtCellTextMaxW(CELL_W, THUMB, 10, '转职');

async function buildExtraDeerGrid(theme, topY, thumbs) {
    const ids = EXTRA_DEER_IDS;
    const rowCount = Math.ceil(ids.length / GRID_COLS);
    const rowHeights = new Array(rowCount).fill(0);

    for (let i = 0; i < ids.length; i += 1) {
        const id = ids[i];
        const d = getExtraDeerDef(id);
        const row = Math.floor(i / GRID_COLS);
        const subtitleLines = expandTalentTextLines(formatTalentDetailParts(d), EXTRA_TEXT_MAX_W, 10, 2);
        const measure = buildSideArtCell({
            x: 0,
            y: 0,
            cellW: CELL_W,
            artSize: THUMB,
            theme,
            title: d.name,
            subtitleLines,
            meta: formatExtraDeerQuotaBrief(id),
            badgeText: `转职${d.name.replace(/鹿$/, '')}`,
            badgeKind: 'accent',
            titleSize: 17,
            subSize: 10,
            metaSize: 10,
            metaMaxLines: 1,
        });
        rowHeights[row] = Math.max(rowHeights[row], measure.cellH + GAP);
    }

    const rowTops = [topY];
    for (let r = 1; r < rowCount; r += 1) {
        rowTops[r] = rowTops[r - 1] + rowHeights[r - 1];
    }

    const cellParts = [];
    for (let i = 0; i < ids.length; i += 1) {
        const id = ids[i];
        const d = getExtraDeerDef(id);
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        const x = PAD_X + col * (CELL_W + GAP);
        const y = rowTops[row];
        const subtitleLines = expandTalentTextLines(formatTalentDetailParts(d), EXTRA_TEXT_MAX_W, 10, 2);
        const cell = buildSideArtCell({
            x,
            y,
            cellW: CELL_W,
            artSize: THUMB,
            theme,
            title: d.name,
            subtitleLines,
            meta: formatExtraDeerQuotaBrief(id),
            badgeText: `转职${d.name.replace(/鹿$/, '')}`,
            badgeKind: 'accent',
            titleSize: 17,
            subSize: 10,
            metaSize: 10,
            metaMaxLines: 1,
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
    const ids = EXTRA_DEER_IDS.filter((id) => getExtraDeerSkill(id));
    if (!ids.length) return { svg: '', height: 0, cellParts: [] };
    let svg = buildSectionTitle(CX, topY, '番外专属技 · 1次/日', theme);
    const gridTop = topY + 24;
    const rowCount = Math.ceil(ids.length / GRID_COLS);
    const rowHeights = new Array(rowCount).fill(0);

    for (let i = 0; i < ids.length; i += 1) {
        const id = ids[i];
        const skill = getExtraDeerSkill(id);
        const d = EXTRA_DEER[id];
        const row = Math.floor(i / GRID_COLS);
        const measure = buildSideArtCell({
            x: 0,
            y: 0,
            cellW: CELL_W,
            artSize: SKILL_ICON,
            artPad: 6,
            theme,
            title: `${skill.name} · ${d.name}`,
            subtitle: deerTextForSvg(skill.desc),
            titleSize: 14,
            subSize: 10,
            subtitleMaxLines: 48,
        });
        rowHeights[row] = Math.max(rowHeights[row], measure.cellH + GAP);
    }

    const rowTops = [gridTop];
    for (let r = 1; r < rowCount; r += 1) {
        rowTops[r] = rowTops[r - 1] + rowHeights[r - 1];
    }

    const cellParts = [];
    for (let i = 0; i < ids.length; i += 1) {
        const id = ids[i];
        const skill = getExtraDeerSkill(id);
        const d = EXTRA_DEER[id];
        const col = i % GRID_COLS;
        const row = Math.floor(i / GRID_COLS);
        const x = PAD_X + col * (CELL_W + GAP);
        const y = rowTops[row];
        const cell = buildSideArtCell({
            x,
            y,
            cellW: CELL_W,
            artSize: SKILL_ICON,
            artPad: 6,
            theme,
            title: `${skill.name} · ${d.name}`,
            subtitle: deerTextForSvg(skill.desc),
            titleSize: 14,
            subSize: 10,
            subtitleMaxLines: 48,
        });
        const iconIdx = EXTRA_DEER_IDS.indexOf(id);
        const icon = iconIdx >= 0 ? skillIcons[iconIdx] : null;
        const emojiArt = !icon && d.emoji
            ? await emojiSvgImage(cell.artLeft + SKILL_ICON / 2, cell.artTop + SKILL_ICON / 2 + 2, d.emoji, 14)
            : '';
        cellParts.push({ svg: cell.svg + emojiArt, cell, icon });
    }
    const totalH = rowHeights.reduce((sum, h) => sum + h, 0);
    return {
        svg: svg + cellParts.map((c) => c.svg).join(''),
        height: 24 + totalH + 8,
        cellParts,
    };
}

export async function generateExtraDeerCatalogImage(opts = {}) {
    const uiSkinId = opts.skinCtx?.ui || 'default';
    const userRecord = opts.userRecord ?? null;
    const theme = resolveSurfaceTheme(uiSkinId, UI_SURFACES.PROFESSION_CATALOG);
    const decoProfile = resolveDecorationProfile(uiSkinId);
    const headerShift = statusHeaderOffset(uiSkinId);

    const [brandLogo, ...thumbs] = await Promise.all([
        loadBrandLogo(),
        ...EXTRA_DEER_IDS.map((id) => loadExtraDeerArt(
            id,
            THUMB,
            resolveProfessionArtSkin(userRecord, id),
        )),
    ]);
    const skillIcons = await Promise.all(EXTRA_DEER_IDS.map((id) => loadExtraDeerSkillArt(id, SKILL_ICON)));

    const title = await buildCenteredEmojiTitleRaster(CX, 36 + headerShift, '✨', '番外 · 隐藏鹿', {
        emojiSize: 24, titleSize: 22, style: TXT, fill: theme.title,
    });

    const introY = 64 + headerShift;
    const gridTop = introY + 28;
    const profGrid = await buildExtraDeerGrid(theme, gridTop, thumbs);
    const skillsTop = gridTop + profGrid.height + 16;
    const skillsBlock = await buildExtraSkillGrid(theme, skillsTop, skillIcons);
    const footerReserve = 52;
    const H = skillsTop + skillsBlock.height + footerReserve;

    const seed = hashSeed(
        'extra-deer-catalog',
        uiSkinId,
        ...EXTRA_DEER_IDS.map((id) => resolveProfessionArtSkin(userRecord, id) || 'default'),
    );
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
