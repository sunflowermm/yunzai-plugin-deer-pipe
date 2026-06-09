import { PROFESSION_CATALOG_ART, professionUsesEmojiArt } from '../constants/deer-assets.js';
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
    buildPortraitGlowSvg,
    loadBanner,
    loadBrandLogo,
    loadCatalogThumb,
    loadProfessionArt,
    loadSectionArt,
    loadSkillArt,
    stickerOverlay,
} from './sticker-compose.js';
import {
    buildCardDecorations,
    buildCenteredEmojiTitle,
    buildCenteredPanel,
    buildFooterBar,
    buildQuotaBarStack,
    buildRibbonBadge,
    buildSectionTitle,
    buildSideArtCell,
    CARD_THEMES,
    DEFAULT_CARD_W,
    escapeXml,
    hashSeed,
    renderStyledCard,
    sectionIconSlot,
    textCentered,
    textCenteredEmoji,
    truncText,
    TXT,
    TXT_EMOJI,
    TXT_SOFT,
} from './svg-base.js';

const CARD_W = DEFAULT_CARD_W;
const CX = CARD_W / 2;
const PORTRAIT_SIZE = 220;
const PORTRAIT_PAD = 10;
const SKILL_ICON = 44;
const SECTION_ICON = 34;

const CATALOG_COLS = 2;
const CATALOG_PAD_X = 20;
const CATALOG_GAP = 14;
const CATALOG_CELL_W = 324;
const CATALOG_CELL_H = 118;
const CATALOG_THUMB = 84;
const CATALOG_BANNER_TOP = 32;
const CATALOG_BANNER_H = 76;

const SKILL_CELL_W = 324;
const SKILL_CELL_H = 52;
const SKILL_THUMB = 40;

function cellArtEmojiSvg(artLeft, artTop, artSize, emoji) {
    const cx = artLeft + artSize / 2;
    const cy = artTop + artSize / 2 + Math.round(artSize * 0.1);
    return textCenteredEmoji(cx, cy, emoji, { size: Math.round(artSize * 0.52) });
}

function sectionTitleSvg(cx, y, title, theme) {
    return textCentered(cx, y, escapeXml(title), TXT_SOFT, {
        size: 13,
        fill: theme.accent,
        weight: 'bold',
    });
}

async function buildLimitQuotaBlock(professionId, theme, topY) {
    const groups = listProfessionQuotaGroups(professionId);
    let y = topY;
    let svg = textCentered(CX, y, '今日玩法配额上限', TXT_SOFT, { size: 13, fill: theme.muted });
    y += 24;
    const overlays = [];
    for (const g of groups) {
        const icon = await loadSectionArt(g.sectionKey, SECTION_ICON);
        if (icon) {
            const slot = sectionIconSlot(CX, y, SECTION_ICON);
            overlays.push(stickerOverlay(icon, slot.top, slot.left));
        }
        svg += sectionTitleSvg(CX, y, g.title, theme);
        y += 20;
        const line = g.rows.map((r) => `${r.label}×${r.max}`).join(' · ');
        svg += textCentered(CX, y, truncText(line, 74), TXT_SOFT, { size: 12, fill: theme.sub });
        y += 28;
    }
    return { svg, height: y - topY, overlays };
}

async function buildUsageQuotaBlock(snapshot, theme, topY) {
    const sections = buildUsageBarSections(snapshot);
    let y = topY;
    let svg = textCentered(CX, y, '今日配额已用 / 上限', TXT_SOFT, { size: 13, fill: theme.muted });
    y += 24;
    const overlays = [];
    const rowGap = 24;
    const sectionGap = 14;
    for (const sec of sections) {
        const icon = await loadSectionArt(sec.sectionKey, SECTION_ICON);
        if (icon) {
            const slot = sectionIconSlot(CX, y, SECTION_ICON);
            overlays.push(stickerOverlay(icon, slot.top, slot.left));
        }
        svg += sectionTitleSvg(CX, y, sec.title, theme);
        y += 20;
        svg += buildQuotaBarStack(CX, y, sec.items, theme, rowGap);
        y += sec.items.length * rowGap + sectionGap;
    }
    return { svg, height: y - topY, overlays };
}

async function buildSkillRow(professionId, skillY, theme) {
    const skill = PROFESSION_SKILLS[professionId];
    if (!skill) return { svg: '', height: 0, overlays: [] };

    const cellW = 380;
    const cellH = 52;
    const x = CX - cellW / 2;
    const cell = buildSideArtCell({
        x,
        y: skillY,
        cellW,
        cellH,
        artSize: SKILL_ICON,
        artPad: 6,
        theme,
        title: `专属技 · ${skill.name}`,
        subtitle: `${skill.cmd} · ${skill.desc}`,
        titleSize: 14,
        subSize: 11,
    });
    const skillIcon = await loadSkillArt(professionId, SKILL_ICON);
    const prof = PROFESSIONS[professionId];
    const emojiArt = !skillIcon && prof?.emoji
        ? cellArtEmojiSvg(cell.artLeft, cell.artTop, cell.artSize, prof.emoji)
        : '';
    const overlays = [];
    if (skillIcon) {
        overlays.push(stickerOverlay(skillIcon, cell.artTop, cell.artLeft));
    }
    return { svg: cell.svg + emojiArt, height: cellH + 8, overlays };
}

export async function generateProfessionCard(professionId, opts = {}) {
    const prof = getProfessionDef(professionId);
    const theme = CARD_THEMES.profession;
    const flavor = PROFESSION_ART_FLAVOR[professionId] || prof.tagline;
    const seed = hashSeed('prof-card', professionId);

    const headerH = 76;
    const illuPanelH = PORTRAIT_SIZE + PORTRAIT_PAD * 2;
    const portraitTop = headerH + 12;
    const quotaTop = portraitTop + illuPanelH + 12;

    const quotaBlock = (opts.showUsage && opts.snapshot)
        ? await buildUsageQuotaBlock(opts.snapshot, theme, quotaTop)
        : await buildLimitQuotaBlock(professionId, theme, quotaTop);

    const skillY = quotaTop + quotaBlock.height + 16;
    const skillBlock = await buildSkillRow(professionId, skillY, theme);
    const footerY = skillY + skillBlock.height + 12;
    const H = footerY + 56;

    const [portrait, brandLogo] = await Promise.all([
        loadProfessionArt(professionId, PORTRAIT_SIZE, { borderWidth: 0, shadow: true }),
        loadBrandLogo(),
    ]);

    const inner = `
        <rect width="${CARD_W}" height="${H}" rx="16" fill="url(#cardBg)"/>
        ${buildCardDecorations(CARD_W, H, theme, seed)}
        ${buildCenteredEmojiTitle(CX, 38, prof.emoji, `${prof.name} · 职业专精`, {
            emojiSize: 28, titleSize: 24, style: TXT, fill: theme.title,
        })}
        ${textCentered(CX, 62, truncText(prof.tagline, 42), TXT_SOFT, { size: 13, fill: theme.muted, italic: true })}
        ${buildRibbonBadge(CX, 72, '转职锁定至次日0点', 'neutral')}
        ${portrait ? buildPortraitGlowSvg(CX, portraitTop + illuPanelH / 2, PORTRAIT_SIZE) : ''}
        ${portrait ? '' : buildCenteredPanel(CX, portraitTop + illuPanelH / 2 - 8, PORTRAIT_SIZE + 48, illuPanelH, theme)}
        ${portrait ? '' : textCenteredEmoji(CX, portraitTop + illuPanelH / 2 + 8, prof.emoji, { size: PORTRAIT_SIZE * 0.42 })}
        ${quotaBlock.svg}
        ${skillBlock.svg}
        ${buildFooterBar(CARD_W, footerY, flavor, theme, 52)}
    `;

    const overlays = [...quotaBlock.overlays, ...skillBlock.overlays];
    if (portrait) {
        const pad = 4;
        overlays.push(stickerOverlay(portrait, portraitTop + PORTRAIT_PAD - pad, Math.round(CX - PORTRAIT_SIZE / 2 - pad)));
    }
    if (brandLogo) {
        overlays.push(stickerOverlay(brandLogo, footerY + 6, 22));
    }
    return renderStyledCard(CARD_W, H, inner, 'profession', overlays.filter(Boolean));
}

function buildSynergyGrid(theme, topY) {
    const ids = Object.keys(PROFESSIONS);
    const rows = Math.ceil(ids.length / CATALOG_COLS);
    const colW = CATALOG_CELL_W;
    let svg = buildSectionTitle(CX, topY, '联动专精', theme);
    let y = topY + 22;
    ids.forEach((id, i) => {
        const p = PROFESSIONS[id];
        const col = i % CATALOG_COLS;
        const row = Math.floor(i / CATALOG_COLS);
        const x = CATALOG_PAD_X + col * (colW + CATALOG_GAP);
        const lineY = y + row * 20;
        svg += `<text ${TXT_SOFT} x="${x + 6}" y="${lineY}" font-size="12" fill="${theme.line}">
            <tspan ${TXT_EMOJI} font-size="13">${escapeXml(p.emoji)}</tspan>
            <tspan> ${truncText(p.synergyTip || p.tagline, 26)}</tspan>
        </text>`;
    });
    return { svg, height: 22 + rows * 20 + 12 };
}

async function buildSkillsGrid(theme, topY) {
    const ids = Object.keys(PROFESSION_SKILLS);
    const rows = Math.ceil(ids.length / CATALOG_COLS);
    let svg = buildSectionTitle(CX, topY, '专属技 · 1次/日', theme);
    const gridTop = topY + 24;
    let cells = '';
    const cellLayouts = [];
    const skillIcons = await Promise.all(ids.map((id) => loadSkillArt(id, SKILL_THUMB)));

    ids.forEach((id, i) => {
        const skill = PROFESSION_SKILLS[id];
        const prof = PROFESSIONS[id];
        const col = i % CATALOG_COLS;
        const row = Math.floor(i / CATALOG_COLS);
        const x = CATALOG_PAD_X + col * (SKILL_CELL_W + CATALOG_GAP);
        const y = gridTop + row * (SKILL_CELL_H + 10);
        const cell = buildSideArtCell({
            x,
            y,
            cellW: SKILL_CELL_W,
            cellH: SKILL_CELL_H,
            artSize: SKILL_THUMB,
            artPad: 6,
            theme,
            title: skill.name,
            subtitle: skill.cmd,
            titleSize: 14,
            subSize: 11,
            badgeText: prof?.name?.replace(/鹿$/, '') || '',
            badgeKind: 'neutral',
        });
        const emojiArt = !skillIcons[i] && prof?.emoji
            ? cellArtEmojiSvg(cell.artLeft, cell.artTop, cell.artSize, prof.emoji)
            : '';
        cells += cell.svg + emojiArt;
        cellLayouts.push({ ...cell, id, icon: skillIcons[i] });
    });

    const overlays = cellLayouts
        .filter((c) => c.icon)
        .map((c) => stickerOverlay(c.icon, c.artTop, c.artLeft));

    return {
        svg: svg + cells,
        height: 24 + rows * (SKILL_CELL_H + 10) + 8,
        overlays,
    };
}

/** 职业一览：配额/联动/专属技均渲染进图 */
export async function generateProfessionCatalogImage(opts = {}) {
    const theme = CARD_THEMES.profession;
    const ids = Object.keys(PROFESSIONS);
    const profRows = Math.ceil(ids.length / CATALOG_COLS);
    const headerEnd = CATALOG_BANNER_TOP + CATALOG_BANNER_H;
    const hasStatus = opts.snapshot && !opts.snapshot.professionRequired;
    const synergyTop = headerEnd + (hasStatus ? 54 : 36);
    const synergyBlock = buildSynergyGrid(theme, synergyTop);
    const gridTop = synergyTop + synergyBlock.height + 16;
    const skillsTop = gridTop + profRows * (CATALOG_CELL_H + CATALOG_GAP) + 20;
    const skillsBlock = await buildSkillsGrid(theme, skillsTop);
    const H = skillsTop + skillsBlock.height + 52;

    const [banner, brandLogo, ...thumbs] = await Promise.all([
        loadBanner(PROFESSION_CATALOG_ART, CARD_W - 48, CATALOG_BANNER_H),
        loadBrandLogo(),
        ...ids.map((id) => loadCatalogThumb(id, CATALOG_THUMB)),
    ]);

    let cells = '';
    const cellLayouts = [];
    ids.forEach((id, i) => {
        const p = PROFESSIONS[id];
        const col = i % CATALOG_COLS;
        const row = Math.floor(i / CATALOG_COLS);
        const x = CATALOG_PAD_X + col * (CATALOG_CELL_W + CATALOG_GAP);
        const y = gridTop + row * (CATALOG_CELL_H + CATALOG_GAP);
        const cell = buildSideArtCell({
            x,
            y,
            cellW: CATALOG_CELL_W,
            cellH: CATALOG_CELL_H,
            artSize: CATALOG_THUMB,
            theme,
            title: p.name,
            subtitle: p.tagline,
            meta: formatProfessionQuotaSummary(id, 'brief'),
            badgeText: p.easterEgg ? '彩蛋' : `转职${p.name.replace(/鹿$/, '')}`,
            badgeKind: p.easterEgg ? 'accent' : 'neutral',
        });
        const emojiArt = (!thumbs[i] || professionUsesEmojiArt(id)) && p.emoji
            ? cellArtEmojiSvg(cell.artLeft, cell.artTop, cell.artSize, p.emoji)
            : '';
        cells += cell.svg + emojiArt;
        cellLayouts.push(cell);
    });

    let statusSvg = '';
    if (hasStatus) {
        const { profession, help, withdraw } = opts.snapshot;
        const statusY = headerEnd + 14;
        statusSvg = `
            ${buildCenteredEmojiTitle(CX, statusY, profession.emoji, `${profession.name} · 今日互助`, {
                emojiSize: 16, titleSize: 14, style: TXT, fill: theme.title,
            })}
            ${textCentered(CX, statusY + 18, `帮鹿 ${help.left}/${help.max} · 帮戒 ${withdraw.left}/${withdraw.max}`, TXT_SOFT, { size: 12, fill: theme.sub })}
        `;
    }

    const inner = `
        <rect width="${CARD_W}" height="${H}" rx="16" fill="url(#cardBg)"/>
        ${buildCardDecorations(CARD_W, H, theme, hashSeed('prof-catalog'))}
        ${banner ? '' : buildCenteredEmojiTitle(CX, 40, '🦌', '鹿林八职业', { emojiSize: 26, titleSize: 24, style: TXT, fill: theme.title })}
        ${statusSvg || textCentered(CX, headerEnd + 14, '转职+职业名 · 当日锁定 · 次日0点重置', TXT_SOFT, { size: 13, fill: theme.muted })}
        ${synergyBlock.svg}
        ${cells}
        ${skillsBlock.svg}
        ${buildFooterBar(CARD_W, H - 28, '没转职=没配额：先转职，再开鹿', theme, 48)}
    `;

    const overlays = [...skillsBlock.overlays];
    if (banner) overlays.push(stickerOverlay(banner, CATALOG_BANNER_TOP, 24));
    ids.forEach((id, i) => {
        if (!thumbs[i] || professionUsesEmojiArt(id)) return;
        const layout = cellLayouts[i];
        overlays.push(stickerOverlay(thumbs[i], layout.artTop, layout.artLeft));
    });
    if (brandLogo) overlays.push(stickerOverlay(brandLogo, H - 42, 22));
    return renderStyledCard(CARD_W, H, inner, 'profession', overlays.filter(Boolean));
}

export async function generateUserProfessionPanel(monthData, day) {
    const snap = getPlayQuotaSnapshot(monthData, day);
    if (snap.professionRequired || !snap.profession?.id) {
        return generateProfessionCatalogImage();
    }
    return generateProfessionCard(snap.profession.id, { snapshot: snap, showUsage: true });
}
