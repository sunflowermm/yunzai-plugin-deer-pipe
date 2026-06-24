import { PROFESSION_CATALOG_ART } from '../constants/deer-assets.js';
import {
    PROFESSIONS,
    PROFESSION_SKILLS,
    getProfessionDef,
} from '../constants/profession.js';
import {
    getExtraDeerDef,
    getExtraDeerSkill,
    isExtraDeerId,
    listExtraDeerQuotaGroups,
} from '../constants/extra-deer.js';
import { PROFESSION_ART_FLAVOR, PROFESSION_PLAY_HINTS } from '../constants/profession-flavor.js';
import { formatTalentDetailParts } from '../constants/talent-text.js';
import {
    buildCatalogCellCopy,
    buildSkillDetailCell,
    buildTalentDetailBlock,
    measureTalentDetailBlock,
    sideArtCellTextMaxW,
} from './profession-detail-render.js';
import {
    listProfessionQuotaGroups,
} from '../constants/profession-quotas.js';
import {
    buildCenteredEmojiTitleRaster,
    emojiStickerOverlay,
    emojiSvgImage,
} from './emoji-compose.js';
import {
    buildPortraitGlowSvg,
    loadBanner,
    loadBrandLogo,
    loadCatalogThumb,
    loadExtraDeerArt,
    loadProfessionArt,
    loadSectionArt,
    loadSkillArt,
    scatterDeerMarkOverlays,
    stickerOverlay,
} from './sticker-compose.js';
import { resolveProfessionArtSkin } from './skin.js';
import { resolveSurfaceTheme, resolveDecorationProfile, UI_SURFACES } from './ui/theme.js';
import { buildSkinCardDecorations } from './ui/components.js';
import { statusHeaderOffset } from './ui/skin-assets.js';
import { renderSkinnedCard, renderSkinnedCardStacked } from './ui/shell.js';
import {
    buildFooterBar,
    buildMultilineText,
    buildMultilineTextCentered,
    buildRibbonBadge,
    buildSectionTitle,
    buildSectionTitleRow,
    buildSideArtCell,
    DEFAULT_CARD_W,
    deerTextForSvg,
    hashSeed,
    textCentered,
    wrapTextLines,
    TXT,
    TXT_SOFT,
} from './svg-base.js';

const CARD_W = DEFAULT_CARD_W;
const CX = CARD_W / 2;
const PORTRAIT_SIZE = 220;
const PORTRAIT_PAD = 10;
const SECTION_ICON = 34;
const SECTION_PAD = 24;
const QUOTA_TEXT_MAX_W = CARD_W - SECTION_PAD - SECTION_ICON - 10 - 24;
const QUOTA_LINE_H = 16;
const QUOTA_SECTION_TITLE = '今日玩法';
const TALENT_CARD_MAX_W = CARD_W - 48;
const PLAY_HINT_LINE_H = 15;

const CATALOG_COLS = 2;
const CATALOG_PAD_X = 20;
const CATALOG_GAP = 14;
const CATALOG_CELL_W = 324;
const CATALOG_THUMB = 84;
const CATALOG_BANNER_TOP = 32;
const CATALOG_BANNER_H = 76;

const SKILL_CELL_W = 324;
const SKILL_THUMB = 40;
const CATALOG_TEXT_MAX_W = sideArtCellTextMaxW(CATALOG_CELL_W, CATALOG_THUMB, 10, `转职`);
const SKILL_TEXT_MAX_LINES = 48;

async function cellArtEmojiImg(artLeft, artTop, artSize, emoji) {
    const cx = artLeft + artSize / 2;
    const cy = artTop + artSize / 2 + Math.round(artSize * 0.1);
    return emojiSvgImage(cx, cy, emoji, Math.round(artSize * 0.52));
}

async function buildLimitQuotaBlock(professionId, theme, topY) {
    const groups = isExtraDeerId(professionId)
        ? listExtraDeerQuotaGroups(professionId)
        : listProfessionQuotaGroups(professionId);
    let y = topY;
    let svg = textCentered(CX, y, QUOTA_SECTION_TITLE, TXT_SOFT, { size: 13, fill: theme.muted, weight: 'bold' });
    y += 24;
    const overlays = [];
    for (const g of groups) {
        const header = buildSectionTitleRow(y, g.title, theme, {
            padLeft: SECTION_PAD, iconSize: SECTION_ICON, fill: theme.accent,
        });
        const icon = await loadSectionArt(g.sectionKey, SECTION_ICON);
        if (icon) {
            overlays.push(stickerOverlay(icon, header.slot.top, header.slot.left));
        }
        svg += header.svg;
        y += 22;
        const line = g.rows.map((r) => `${r.label}×${r.max}`).join(' · ');
        const lines = wrapTextLines(line, QUOTA_TEXT_MAX_W, 12, 8);
        svg += buildMultilineText(header.slot.textX, y, lines, {
            fontSize: 12,
            lineHeight: QUOTA_LINE_H,
            fill: theme.sub,
        });
        y += 10 + lines.length * QUOTA_LINE_H + 16;
    }
    return { svg, height: y - topY, overlays };
}

async function buildSkillRow(professionId, skillY, theme, portraitSkinId = undefined) {
    const extra = isExtraDeerId(professionId);
    const skill = extra ? getExtraDeerSkill(professionId) : PROFESSION_SKILLS[professionId];
    return buildSkillDetailCell({
        professionId,
        skill,
        theme,
        topY: skillY,
        width: CARD_W,
        portraitSkinId,
        cellW: 400,
    });
}

export async function generateProfessionCard(professionId, opts = {}) {
    const extra = isExtraDeerId(professionId);
    const prof = extra ? getExtraDeerDef(professionId) : getProfessionDef(professionId);
    const uiSkinId = opts.skinCtx?.ui || 'default';
    const portraitId = opts.skinCtx?.portrait ?? 'default';
    const theme = resolveSurfaceTheme(uiSkinId, UI_SURFACES.PROFESSION);
    const decoProfile = resolveDecorationProfile(uiSkinId);
    const flavor = PROFESSION_ART_FLAVOR[professionId] || prof.tagline;
    const seed = hashSeed('prof-card', professionId, uiSkinId, portraitId);
    const artSkinId = portraitId !== 'default' ? portraitId : undefined;

    const headerShift = statusHeaderOffset(uiSkinId);
    const headerH = 76 + headerShift;
    const illuH = PORTRAIT_SIZE + PORTRAIT_PAD * 2;
    const titleY = 40 + headerShift;
    const badgeY = 64 + headerShift;
    const illuTop = headerH + 8;
    const illuCy = illuTop + illuH / 2;

    const talentTop = illuTop + illuH + 10;
    const talentParts = formatTalentDetailParts(prof);
    const talentBlockH = measureTalentDetailBlock(talentParts, CARD_W);
    const quotaTop = talentTop + talentBlockH + 8;

    const quotaBlock = await buildLimitQuotaBlock(professionId, theme, quotaTop);

    const skillY = quotaTop + quotaBlock.height + 20;
    const skillBlock = await buildSkillRow(professionId, skillY, theme, portraitId);
    const playHint = PROFESSION_PLAY_HINTS[professionId] || '';
    const hintLines = playHint
        ? wrapTextLines(deerTextForSvg(playHint), TALENT_CARD_MAX_W, 11, 4)
        : [];
    const hintTop = skillY + skillBlock.height + 10;
    const hintBlockH = hintLines.length ? 20 + hintLines.length * PLAY_HINT_LINE_H + 8 : 0;
    const footerY = hintTop + hintBlockH + 12;
    const H = footerY + 56;

    const [portrait, titleBlock] = await Promise.all([
        extra
            ? loadExtraDeerArt(professionId, PORTRAIT_SIZE, artSkinId, { shadow: true })
            : loadProfessionArt(professionId, PORTRAIT_SIZE, { borderWidth: 0, shadow: true, skinId: artSkinId }),
        buildCenteredEmojiTitleRaster(CX, titleY, prof.emoji, `${prof.name} · ${extra ? '番外' : '职业'}卡`, {
            emojiSize: 28, titleSize: 24, style: TXT, fill: theme.title,
        }),
    ]);

    const portraitOverlays = [];
    let portraitEmojiSvg = '';
    if (!portrait) {
        const emojiSize = Math.round(PORTRAIT_SIZE * 0.52);
        const overlay = await emojiStickerOverlay(prof.emoji, illuCy - emojiSize / 2, CX - emojiSize / 2, emojiSize);
        if (overlay) portraitOverlays.push(overlay);
        else portraitEmojiSvg = await emojiSvgImage(CX, illuCy, prof.emoji, emojiSize);
    }

    const talentDetailBlock = buildTalentDetailBlock(talentParts, theme, talentTop, CARD_W);

    const inner = `
        <rect width="${CARD_W}" height="${H}" rx="16" fill="url(#cardBg)"/>
        ${buildSkinCardDecorations(CARD_W, H, theme, seed, decoProfile)}
        ${titleBlock.svg}
        ${buildRibbonBadge(CX, badgeY, extra ? '番外 · 转职锁定至次日0点' : '转职锁定至次日0点', extra ? 'accent' : 'neutral')}
        ${portrait ? buildPortraitGlowSvg(CX, illuCy, PORTRAIT_SIZE) : ''}
        ${portraitEmojiSvg}
        ${talentDetailBlock.svg}
        ${quotaBlock.svg}
        ${skillBlock.svg}
        ${hintLines.length ? textCentered(CX, hintTop, '玩法建议', TXT_SOFT, { size: 12, fill: theme.muted, weight: 'bold' }) : ''}
        ${hintLines.length ? buildMultilineTextCentered(CX, hintTop + 18, hintLines, { fontSize: 11, lineHeight: PLAY_HINT_LINE_H, fill: theme.line }) : ''}
        ${buildFooterBar(CARD_W, footerY, flavor, theme, 52)}
    `;

    const overlays = [
        ...titleBlock.overlays,
        ...quotaBlock.overlays,
        ...skillBlock.overlays,
        ...portraitOverlays,
    ];
    if (portrait) {
        const pad = 4;
        overlays.push(stickerOverlay(portrait, illuTop + PORTRAIT_PAD - pad, Math.round(CX - PORTRAIT_SIZE / 2 - pad)));
    }
    return renderSkinnedCard({
        width: CARD_W,
        height: H,
        innerSvg: inner,
        uiSkinId,
        surface: UI_SURFACES.PROFESSION,
        theme,
        themeKey: 'profession',
        overlays: overlays.filter(Boolean),
        opts: { stickerSeed: seed },
    });
}

async function buildSkillsGrid(theme, topY, userRecord = null) {
    const ids = Object.keys(PROFESSION_SKILLS);
    let svg = buildSectionTitle(CX, topY, '专属技 · 1次/日', theme);
    const gridTop = topY + 24;
    const skillIcons = await Promise.all(
        ids.map((id) => loadSkillArt(id, SKILL_THUMB, resolveProfessionArtSkin(userRecord, id))),
    );
    const rowCount = Math.ceil(ids.length / CATALOG_COLS);
    const rowHeights = new Array(rowCount).fill(0);

    for (let i = 0; i < ids.length; i += 1) {
        const skill = PROFESSION_SKILLS[ids[i]];
        const row = Math.floor(i / CATALOG_COLS);
        const measure = buildSideArtCell({
            x: 0,
            y: 0,
            cellW: SKILL_CELL_W,
            artSize: SKILL_THUMB,
            artPad: 6,
            theme,
            title: skill.name,
            subtitle: deerTextForSvg(`${skill.cmd} · ${skill.desc}`),
            titleSize: 14,
            subSize: 10,
            subtitleMaxLines: SKILL_TEXT_MAX_LINES,
        });
        rowHeights[row] = Math.max(rowHeights[row], measure.cellH + 10);
    }

    const rowTops = [gridTop];
    for (let r = 1; r < rowCount; r += 1) {
        rowTops[r] = rowTops[r - 1] + rowHeights[r - 1];
    }

    const cellParts = [];
    for (let i = 0; i < ids.length; i += 1) {
        const id = ids[i];
        const skill = PROFESSION_SKILLS[id];
        const prof = PROFESSIONS[id];
        const col = i % CATALOG_COLS;
        const row = Math.floor(i / CATALOG_COLS);
        const x = CATALOG_PAD_X + col * (SKILL_CELL_W + CATALOG_GAP);
        const y = rowTops[row];
        const cell = buildSideArtCell({
            x,
            y,
            cellW: SKILL_CELL_W,
            artSize: SKILL_THUMB,
            artPad: 6,
            theme,
            title: skill.name,
            subtitle: deerTextForSvg(`${skill.cmd} · ${skill.desc}`),
            titleSize: 14,
            subSize: 10,
            badgeText: prof?.name?.replace(/鹿$/, '') || '',
            badgeKind: 'neutral',
            subtitleMaxLines: SKILL_TEXT_MAX_LINES,
        });
        const emojiArt = !skillIcons[i] && prof?.emoji
            ? await cellArtEmojiImg(cell.artLeft, cell.artTop, cell.artSize, prof.emoji)
            : '';
        cellParts.push({ svg: cell.svg + emojiArt, cell, icon: skillIcons[i] });
    }

    const overlays = cellParts
        .filter((c) => c.icon)
        .map((c) => stickerOverlay(c.icon, c.cell.artTop, c.cell.artLeft));

    const totalH = rowHeights.reduce((sum, h) => sum + h, 0);
    return {
        svg: svg + cellParts.map((c) => c.svg).join(''),
        height: 24 + totalH + 8,
        overlays,
    };
}

async function buildProfessionCatalogGrid(theme, topY, ids, thumbs) {
    const rowCount = Math.ceil(ids.length / CATALOG_COLS);
    const rowHeights = new Array(rowCount).fill(0);
    const badgeFor = (name) => `转职${name.replace(/鹿$/, '')}`;

    for (let i = 0; i < ids.length; i += 1) {
        const p = PROFESSIONS[ids[i]];
        const copy = buildCatalogCellCopy(ids[i], CATALOG_TEXT_MAX_W);
        const row = Math.floor(i / CATALOG_COLS);
        const measure = buildSideArtCell({
            x: 0,
            y: 0,
            cellW: CATALOG_CELL_W,
            artSize: CATALOG_THUMB,
            theme,
            title: p.name,
            subtitleLines: copy.subtitleLines,
            meta: copy.meta,
            badgeText: badgeFor(p.name),
            badgeKind: p.easterEgg ? 'accent' : 'neutral',
            titleSize: 17,
            subSize: 10,
            metaSize: 10,
            metaMaxLines: 2,
        });
        rowHeights[row] = Math.max(rowHeights[row], measure.cellH + CATALOG_GAP);
    }

    const rowTops = [topY];
    for (let r = 1; r < rowCount; r += 1) {
        rowTops[r] = rowTops[r - 1] + rowHeights[r - 1];
    }

    const cellParts = [];
    for (let i = 0; i < ids.length; i += 1) {
        const id = ids[i];
        const p = PROFESSIONS[id];
        const col = i % CATALOG_COLS;
        const row = Math.floor(i / CATALOG_COLS);
        const x = CATALOG_PAD_X + col * (CATALOG_CELL_W + CATALOG_GAP);
        const y = rowTops[row];
        const copy = buildCatalogCellCopy(id, CATALOG_TEXT_MAX_W);
        const cell = buildSideArtCell({
            x,
            y,
            cellW: CATALOG_CELL_W,
            artSize: CATALOG_THUMB,
            theme,
            title: p.name,
            subtitleLines: copy.subtitleLines,
            meta: copy.meta,
            badgeText: badgeFor(p.name),
            badgeKind: p.easterEgg ? 'accent' : 'neutral',
            titleSize: 17,
            subSize: 10,
            metaSize: 10,
            metaMaxLines: 2,
        });
        const emojiArt = !thumbs[i] && p.emoji
            ? await cellArtEmojiImg(cell.artLeft, cell.artTop, cell.artSize, p.emoji)
            : '';
        cellParts.push({ svg: cell.svg + emojiArt, cell, id, thumb: thumbs[i] });
    }

    const totalH = rowHeights.reduce((sum, h) => sum + h, 0);
    return {
        svg: cellParts.map((c) => c.svg).join(''),
        cellParts,
        height: totalH,
    };
}

/** 职业一览：配额/联动/专属技均渲染进图 */
export async function generateProfessionCatalogImage(opts = {}) {
    const uiSkinId = opts.skinCtx?.ui || 'default';
    const userRecord = opts.userRecord ?? null;
    const theme = resolveSurfaceTheme(uiSkinId, UI_SURFACES.PROFESSION_CATALOG);
    const decoProfile = resolveDecorationProfile(uiSkinId);
    const ids = Object.keys(PROFESSIONS);
    const headerEnd = CATALOG_BANNER_TOP + CATALOG_BANNER_H;
    const hasStatus = opts.snapshot && !opts.snapshot.professionRequired;
    const sectionTop = headerEnd + (hasStatus ? 54 : 36);

    const headerShift = statusHeaderOffset(uiSkinId);
    const [banner, brandLogo, ...thumbs] = await Promise.all([
        loadBanner(PROFESSION_CATALOG_ART, CARD_W - 48, CATALOG_BANNER_H),
        loadBrandLogo(),
        ...ids.map((id) => loadCatalogThumb(
            id,
            CATALOG_THUMB,
            resolveProfessionArtSkin(userRecord, id),
        )),
    ]);

    const gridTop = sectionTop + 22;
    const profGrid = await buildProfessionCatalogGrid(theme, gridTop, ids, thumbs);
    const skillsTop = gridTop + profGrid.height + 20;
    const skillsBlock = await buildSkillsGrid(theme, skillsTop, userRecord);
    const footerReserve = 56;
    const H = skillsTop + skillsBlock.height + footerReserve;

    const headerOverlays = [];
    let headerSvg = '';
    if (!banner) {
        const title = await buildCenteredEmojiTitleRaster(CX, 40 + headerShift, '🦌', '鹿林八职业', {
            emojiSize: 26, titleSize: 24, style: TXT, fill: theme.title,
        });
        headerSvg = title.svg;
        headerOverlays.push(...title.overlays);
    }

    let statusSvg = '';
    const statusOverlays = [];
    if (hasStatus) {
        const { profession, help, withdraw } = opts.snapshot;
        const statusY = headerEnd + 14;
        const statusTitle = await buildCenteredEmojiTitleRaster(
            CX, statusY, profession.emoji, `${profession.name} · 今日互助`, {
                emojiSize: 16, titleSize: 14, style: TXT, fill: theme.title,
            },
        );
        statusSvg = `
            ${statusTitle.svg}
            ${textCentered(CX, statusY + 18, `帮鹿 ${help.left}/${help.max} · 帮戒 ${withdraw.left}/${withdraw.max}`, TXT_SOFT, { size: 12, fill: theme.sub })}
        `;
        statusOverlays.push(...statusTitle.overlays);
    }

    const catalogSeed = hashSeed(
        'prof-catalog',
        uiSkinId,
        ...ids.map((id) => resolveProfessionArtSkin(userRecord, id) || 'default'),
    );
    const backgroundSvg = `
        <rect width="${CARD_W}" height="${H}" rx="16" fill="url(#cardBg)"/>
        ${buildSkinCardDecorations(CARD_W, H, theme, catalogSeed, decoProfile)}
    `;
    const contentSvg = `
        ${headerSvg}
        ${statusSvg || textCentered(CX, headerEnd + 14, '转职+职业名 · 当日锁定 · 次日0点重置', TXT_SOFT, { size: 13, fill: theme.muted })}
        ${buildSectionTitle(CX, sectionTop, '八职业 · 天赋详解', theme)}
        ${profGrid.svg}
        ${skillsBlock.svg}
        ${buildFooterBar(CARD_W, H - 28, '没转职=没配额：先转职，再开鹿', theme, 48)}
    `;

    const gapTop = skillsTop + skillsBlock.height + 8;
    const gapH = H - footerReserve - gapTop;
    const deerFill = gapH >= 48
        ? await scatterDeerMarkOverlays(CARD_W - 48, gapH, gapTop, 24, {
            count: Math.min(10, Math.max(4, Math.floor(gapH / 44))),
            seed: hashSeed('prof-catalog-fill'),
            markHeight: 48,
            opacity: 0.16,
        })
        : { overlays: [], placedRects: [] };

    const overlays = [...headerOverlays, ...statusOverlays, ...skillsBlock.overlays, ...deerFill.overlays];
    if (banner) overlays.push(stickerOverlay(banner, CATALOG_BANNER_TOP, 24));
    profGrid.cellParts.forEach((part) => {
        if (!part.thumb) return;
        overlays.push(stickerOverlay(part.thumb, part.cell.artTop, part.cell.artLeft));
    });
    if (brandLogo) overlays.push(stickerOverlay(brandLogo, H - 42, 22));

    return renderSkinnedCardStacked({
        width: CARD_W,
        height: H,
        backgroundSvg,
        contentSvg,
        uiSkinId,
        theme,
        themeKey: 'profession',
        overlays: overlays.filter(Boolean),
        opts: {
            stickerSeed: catalogSeed,
            stickerProfile: { occupiedRects: deerFill.placedRects },
        },
    });
}
