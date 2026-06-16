import { PROFESSION_CATALOG_ART } from '../constants/deer-assets.js';
import {
    PROFESSIONS,
    PROFESSION_SKILLS,
    formatProfessionQuotaSummary,
    getProfessionDef,
} from '../constants/profession.js';
import { PROFESSION_ART_FLAVOR } from '../constants/profession-flavor.js';
import {
    buildUsageBarSections,
    listProfessionQuotaGroups,
} from '../constants/profession-quotas.js';
import { getPlayQuotaSnapshot } from './data.js';
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
    loadProfessionArt,
    loadSectionArt,
    loadSkillArt,
    scatterDeerMarkOverlays,
    stickerOverlay,
} from './sticker-compose.js';
import { resolveCardTheme } from './skin.js';
import {
    buildFooterBar,
    buildMultilineText,
    buildQuotaBarStack,
    buildRibbonBadge,
    buildSectionTitle,
    buildSectionTitleRow,
    buildSideArtCell,
    buildCardDecorations,
    CARD_THEMES,
    DEFAULT_CARD_W,
    escapeXml,
    hashSeed,
    quotaRowWidth,
    renderStyledCard,
    textCentered,
    wrapTextLines,
    TXT,
    TXT_SOFT,
} from './svg-base.js';

const CARD_W = DEFAULT_CARD_W;
const CX = CARD_W / 2;
const PORTRAIT_SIZE = 220;
const PORTRAIT_PAD = 10;
const SKILL_ICON = 44;
const SECTION_ICON = 34;
const SECTION_PAD = 24;
const QUOTA_TEXT_MAX_W = CARD_W - SECTION_PAD - SECTION_ICON - 10 - 24;
const QUOTA_LINE_H = 16;
const QUOTA_SECTION_TITLE = '今日玩法';

const CATALOG_COLS = 2;
const CATALOG_PAD_X = 20;
const CATALOG_GAP = 14;
const CATALOG_CELL_W = 324;
const CATALOG_THUMB = 84;
const CATALOG_BANNER_TOP = 32;
const CATALOG_BANNER_H = 76;

const SKILL_CELL_W = 324;
const SKILL_THUMB = 40;

async function cellArtEmojiImg(artLeft, artTop, artSize, emoji) {
    const cx = artLeft + artSize / 2;
    const cy = artTop + artSize / 2 + Math.round(artSize * 0.1);
    return emojiSvgImage(cx, cy, emoji, Math.round(artSize * 0.52));
}

async function buildLimitQuotaBlock(professionId, theme, topY) {
    const groups = listProfessionQuotaGroups(professionId);
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

async function buildUsageQuotaBlock(snapshot, theme, topY) {
    const sections = buildUsageBarSections(snapshot);
    let y = topY;
    let svg = textCentered(CX, y, `${QUOTA_SECTION_TITLE} · 已用/上限`, TXT_SOFT, { size: 13, fill: theme.muted, weight: 'bold' });
    y += 24;
    const overlays = [];
    const rowGap = 24;
    const sectionGap = 14;
    for (const sec of sections) {
        const header = buildSectionTitleRow(y, sec.title, theme, {
            padLeft: SECTION_PAD, iconSize: SECTION_ICON, fill: theme.accent,
        });
        const icon = await loadSectionArt(sec.sectionKey, SECTION_ICON);
        if (icon) {
            overlays.push(stickerOverlay(icon, header.slot.top, header.slot.left));
        }
        svg += header.svg;
        y += 20;
        const barCx = header.slot.textX + quotaRowWidth() / 2;
        svg += buildQuotaBarStack(barCx, y, sec.items, theme, rowGap);
        y += sec.items.length * rowGap + sectionGap;
    }
    return { svg, height: y - topY, overlays };
}

async function buildSkillRow(professionId, skillY, theme, portraitSkinId = undefined) {
    const skill = PROFESSION_SKILLS[professionId];
    if (!skill) return { svg: '', height: 0, overlays: [] };

    const cellW = 400;
    const cell = buildSideArtCell({
        x: CX - cellW / 2,
        y: skillY,
        cellW,
        artSize: SKILL_ICON,
        artPad: 8,
        theme,
        title: `专属技 · ${skill.name}`,
        subtitle: `${skill.cmd} · ${skill.desc}`,
        titleSize: 14,
        subSize: 11,
        subtitleMaxLines: 4,
    });
    const skinId = portraitSkinId && portraitSkinId !== 'default' ? portraitSkinId : undefined;
    const skillIcon = await loadSkillArt(professionId, SKILL_ICON, skinId);
    const prof = PROFESSIONS[professionId];
    const emojiArt = !skillIcon && prof?.emoji
        ? await cellArtEmojiImg(cell.artLeft, cell.artTop, cell.artSize, prof.emoji)
        : '';
    const overlays = [];
    if (skillIcon) {
        overlays.push(stickerOverlay(skillIcon, cell.artTop, cell.artLeft));
    }
    return { svg: cell.svg + emojiArt, height: cell.cellH + 12, overlays };
}

export async function generateProfessionCard(professionId, opts = {}) {
    const prof = getProfessionDef(professionId);
    const uiSkinId = opts.skinCtx?.ui;
    const portraitSkinId = opts.skinCtx?.portrait
        ?? (opts.portraitSkinId);
    const theme = uiSkinId ? resolveCardTheme(uiSkinId, 'profession') : CARD_THEMES.profession;
    const flavor = PROFESSION_ART_FLAVOR[professionId] || prof.tagline;
    const seed = hashSeed('prof-card', professionId, uiSkinId, portraitSkinId);
    const artSkinId = portraitSkinId && portraitSkinId !== 'default' ? portraitSkinId : undefined;

    const headerH = 76;
    const illuH = PORTRAIT_SIZE + PORTRAIT_PAD * 2;
    const illuTop = headerH + 12;
    const illuCy = illuTop + illuH / 2;
    const quotaTop = illuTop + illuH + 16;

    const quotaBlock = (opts.showUsage && opts.snapshot)
        ? await buildUsageQuotaBlock(opts.snapshot, theme, quotaTop)
        : await buildLimitQuotaBlock(professionId, theme, quotaTop);

    const skillY = quotaTop + quotaBlock.height + 20;
    const skillBlock = await buildSkillRow(professionId, skillY, theme, portraitSkinId);
    const footerY = skillY + skillBlock.height + 12;
    const H = footerY + 56;

    const [portrait, brandLogo, titleBlock] = await Promise.all([
        loadProfessionArt(professionId, PORTRAIT_SIZE, { borderWidth: 0, shadow: true, skinId: artSkinId }),
        loadBrandLogo(),
        buildCenteredEmojiTitleRaster(CX, 38, prof.emoji, `${prof.name} · 职业专精`, {
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

    const inner = `
        <rect width="${CARD_W}" height="${H}" rx="16" fill="url(#cardBg)"/>
        ${buildCardDecorations(CARD_W, H, theme, seed)}
        ${titleBlock.svg}
        ${textCentered(CX, 62, escapeXml(prof.tagline.length > 42 ? `${prof.tagline.slice(0, 42)}…` : prof.tagline), TXT_SOFT, { size: 13, fill: theme.muted, italic: true })}
        ${buildRibbonBadge(CX, 72, '转职锁定至次日0点', 'neutral')}
        ${portrait ? buildPortraitGlowSvg(CX, illuCy, PORTRAIT_SIZE) : ''}
        ${portraitEmojiSvg}
        ${quotaBlock.svg}
        ${skillBlock.svg}
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
    if (brandLogo) {
        overlays.push(stickerOverlay(brandLogo, footerY + 6, 22));
    }
    return renderStyledCard(CARD_W, H, inner, 'profession', overlays.filter(Boolean));
}

const SYNERGY_TEXT_MAX_W = CATALOG_CELL_W - 34;
const SYNERGY_LINE_H = 14;
const SYNERGY_BLOCK_LINES = 2;
const SYNERGY_ROW_H = SYNERGY_LINE_H * SYNERGY_BLOCK_LINES + 8;

async function buildSynergyGrid(theme, topY) {
    const ids = Object.keys(PROFESSIONS);
    const rows = Math.ceil(ids.length / CATALOG_COLS);
    const colW = CATALOG_CELL_W;
    let svg = buildSectionTitle(CX, topY, '联动专精', theme);
    const y = topY + 22;
    const lines = await Promise.all(ids.map(async (id, i) => {
        const p = PROFESSIONS[id];
        const col = i % CATALOG_COLS;
        const row = Math.floor(i / CATALOG_COLS);
        const x = CATALOG_PAD_X + col * (colW + CATALOG_GAP);
        const blockTop = y + row * SYNERGY_ROW_H;
        const emojiCy = blockTop + SYNERGY_ROW_H / 2 + 2;
        const emojiImg = await emojiSvgImage(x + 14, emojiCy, p.emoji, 16);
        const tipLines = wrapTextLines(p.synergyTip || p.tagline, SYNERGY_TEXT_MAX_W, 12, SYNERGY_BLOCK_LINES);
        const textBlock = buildMultilineText(x + 28, blockTop + 12, tipLines, {
            fontSize: 12,
            lineHeight: SYNERGY_LINE_H,
            fill: theme.line,
        });
        return `${emojiImg}${textBlock}`;
    }));
    svg += lines.join('');
    return { svg, height: 22 + rows * SYNERGY_ROW_H + 12 };
}

async function buildSkillsGrid(theme, topY) {
    const ids = Object.keys(PROFESSION_SKILLS);
    let svg = buildSectionTitle(CX, topY, '专属技 · 1次/日', theme);
    const gridTop = topY + 24;
    const skillIcons = await Promise.all(ids.map((id) => loadSkillArt(id, SKILL_THUMB)));
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
            subtitle: skill.cmd,
            titleSize: 14,
            subSize: 11,
            subtitleMaxLines: 2,
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
            subtitle: skill.cmd,
            titleSize: 14,
            subSize: 11,
            badgeText: prof?.name?.replace(/鹿$/, '') || '',
            badgeKind: 'neutral',
            subtitleMaxLines: 2,
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

    for (let i = 0; i < ids.length; i += 1) {
        const p = PROFESSIONS[ids[i]];
        const row = Math.floor(i / CATALOG_COLS);
        const measure = buildSideArtCell({
            x: 0,
            y: 0,
            cellW: CATALOG_CELL_W,
            artSize: CATALOG_THUMB,
            theme,
            title: p.name,
            subtitle: p.tagline,
            meta: formatProfessionQuotaSummary(ids[i], 'brief'),
            badgeText: `转职${p.name.replace(/鹿$/, '')}`,
            badgeKind: p.easterEgg ? 'accent' : 'neutral',
            titleSize: 17,
            subSize: 12,
            metaSize: 11,
            subtitleMaxLines: 2,
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
        const cell = buildSideArtCell({
            x,
            y,
            cellW: CATALOG_CELL_W,
            artSize: CATALOG_THUMB,
            theme,
            title: p.name,
            subtitle: p.tagline,
            meta: formatProfessionQuotaSummary(id, 'brief'),
            badgeText: `转职${p.name.replace(/鹿$/, '')}`,
            badgeKind: p.easterEgg ? 'accent' : 'neutral',
            titleSize: 17,
            subSize: 12,
            metaSize: 11,
            subtitleMaxLines: 2,
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
    const uiSkinId = opts.skinCtx?.ui;
    const theme = uiSkinId ? resolveCardTheme(uiSkinId, 'profession') : CARD_THEMES.profession;
    const ids = Object.keys(PROFESSIONS);
    const headerEnd = CATALOG_BANNER_TOP + CATALOG_BANNER_H;
    const hasStatus = opts.snapshot && !opts.snapshot.professionRequired;
    const synergyTop = headerEnd + (hasStatus ? 54 : 36);

    const [banner, brandLogo, ...thumbs] = await Promise.all([
        loadBanner(PROFESSION_CATALOG_ART, CARD_W - 48, CATALOG_BANNER_H),
        loadBrandLogo(),
        ...ids.map((id) => loadCatalogThumb(id, CATALOG_THUMB)),
    ]);

    const synergyBlock = await buildSynergyGrid(theme, synergyTop);
    const gridTop = synergyTop + synergyBlock.height + 16;
    const profGrid = await buildProfessionCatalogGrid(theme, gridTop, ids, thumbs);
    const skillsTop = gridTop + profGrid.height + 20;
    const skillsBlock = await buildSkillsGrid(theme, skillsTop);
    const footerReserve = 56;
    const H = skillsTop + skillsBlock.height + footerReserve;

    const headerOverlays = [];
    let headerSvg = '';
    if (!banner) {
        const title = await buildCenteredEmojiTitleRaster(CX, 40, '🦌', '鹿林八职业', {
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

    const inner = `
        <rect width="${CARD_W}" height="${H}" rx="16" fill="url(#cardBg)"/>
        ${buildCardDecorations(CARD_W, H, theme, hashSeed('prof-catalog'))}
        ${headerSvg}
        ${statusSvg || textCentered(CX, headerEnd + 14, '转职+职业名 · 当日锁定 · 次日0点重置', TXT_SOFT, { size: 13, fill: theme.muted })}
        ${synergyBlock.svg}
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
        : [];

    const overlays = [...headerOverlays, ...statusOverlays, ...skillsBlock.overlays, ...deerFill];
    if (banner) overlays.push(stickerOverlay(banner, CATALOG_BANNER_TOP, 24));
    profGrid.cellParts.forEach((part) => {
        if (!part.thumb) return;
        overlays.push(stickerOverlay(part.thumb, part.cell.artTop, part.cell.artLeft));
    });
    if (brandLogo) overlays.push(stickerOverlay(brandLogo, H - 42, 22));
    return renderStyledCard(CARD_W, H, inner, 'profession', overlays.filter(Boolean));
}

export async function generateUserProfessionPanel(monthData, day, opts = {}) {
    const snap = getPlayQuotaSnapshot(monthData, day);
    if (snap.professionRequired || !snap.profession?.id) {
        return generateProfessionCatalogImage(opts);
    }
    return generateProfessionCard(snap.profession.id, { snapshot: snap, showUsage: true, ...opts });
}
