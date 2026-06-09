import { PROFESSION_CATALOG_ART } from '../constants/deer-assets.js';
import {
    PROFESSIONS,
    PROFESSION_SKILLS,
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
    buildSideArtCell,
    CARD_THEMES,
    DEFAULT_CARD_W,
    escapeXml,
    hashSeed,
    renderStyledCard,
    textCentered,
    textCenteredEmoji,
    truncText,
    TXT,
    TXT_SOFT,
} from './svg-base.js';

const CARD_W = DEFAULT_CARD_W;
const CX = CARD_W / 2;
const PORTRAIT_SIZE = 220;
const PORTRAIT_PAD = 10;
const SKILL_ICON = 44;
const SECTION_ICON = 34;
const SECTION_ICON_LEFT = CX - 200;

const CATALOG_COLS = 2;
const CATALOG_PAD_X = 20;
const CATALOG_GAP = 14;
const CATALOG_CELL_W = 324;
const CATALOG_CELL_H = 104;
const CATALOG_THUMB = 84;
const CATALOG_BANNER_TOP = 32;
const CATALOG_BANNER_H = 76;

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
        if (icon) overlays.push(stickerOverlay(icon, y - SECTION_ICON + 4, SECTION_ICON_LEFT));
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
        if (icon) overlays.push(stickerOverlay(icon, y - SECTION_ICON + 4, SECTION_ICON_LEFT));
        svg += sectionTitleSvg(CX, y, sec.title, theme);
        y += 20;
        svg += buildQuotaBarStack(CX, y, sec.items, theme, rowGap);
        y += sec.items.length * rowGap + sectionGap;
    }
    return { svg, height: y - topY, overlays };
}

export async function generateProfessionCard(professionId, opts = {}) {
    const prof = getProfessionDef(professionId);
    const skill = PROFESSION_SKILLS[professionId];
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

    const skillBlockH = skill ? 58 : 0;
    const skillY = quotaTop + quotaBlock.height + 16;
    const footerY = skillY + skillBlockH + 12;
    const H = footerY + 56;

    const [portrait, skillIcon, brandLogo] = await Promise.all([
        loadProfessionArt(professionId, PORTRAIT_SIZE, { fitScale: 0.94, borderWidth: 0, shadow: true }),
        skill ? loadSkillArt(professionId, SKILL_ICON) : null,
        loadBrandLogo(),
    ]);
    let skillSvg = '';
    if (skill) {
        skillSvg = `
            ${textCentered(CX + 28, skillY + 14, `专属技 · ${escapeXml(skill.name)}`, TXT, { size: 14, fill: theme.title, weight: 'bold' })}
            ${textCentered(CX + 28, skillY + 34, truncText(`${skill.cmd} · ${skill.desc}`, 44), TXT_SOFT, { size: 11, fill: theme.sub })}
        `;
    }

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
        ${skillSvg}
        ${buildFooterBar(CARD_W, footerY, flavor, theme, 52)}
    `;

    const overlays = [...quotaBlock.overlays];
    if (portrait) {
        const pad = 4;
        overlays.push(stickerOverlay(portrait, portraitTop + PORTRAIT_PAD - pad, Math.round(CX - PORTRAIT_SIZE / 2 - pad)));
    }
    if (skillIcon) {
        overlays.push(stickerOverlay(skillIcon, skillY + 4, Math.round(CX - 168)));
    }
    if (brandLogo) {
        overlays.push(stickerOverlay(brandLogo, footerY + 6, 22));
    }
    return renderStyledCard(CARD_W, H, inner, 'profession', overlays.filter(Boolean));
}

/** 七职业一览：大图为主，仅保留名称 + 一句 tagline + 转职提示 */
export async function generateProfessionCatalogImage() {
    const theme = CARD_THEMES.profession;
    const ids = Object.keys(PROFESSIONS);
    const rows = Math.ceil(ids.length / CATALOG_COLS);
    const gridTop = CATALOG_BANNER_TOP + CATALOG_BANNER_H + 40;
    const H = gridTop + rows * (CATALOG_CELL_H + CATALOG_GAP) + 52;

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
            badgeText: `转职${p.name.replace(/鹿$/, '')}`,
            badgeKind: 'neutral',
        });
        cells += cell.svg;
        cellLayouts.push(cell);
    });

    const inner = `
        <rect width="${CARD_W}" height="${H}" rx="16" fill="url(#cardBg)"/>
        ${buildCardDecorations(CARD_W, H, theme, hashSeed('prof-catalog'))}
        ${banner ? '' : buildCenteredEmojiTitle(CX, 40, '🦌', '鹿林七职业', { emojiSize: 26, titleSize: 24, style: TXT, fill: theme.title })}
        ${textCentered(CX, banner ? CATALOG_BANNER_TOP + CATALOG_BANNER_H + 22 : 68, '转职+职业名 · 当日锁定 · 次日0点重置', TXT_SOFT, { size: 13, fill: theme.muted })}
        ${cells}
        ${buildFooterBar(CARD_W, H - 28, '没转职=没配额：先转职，再开鹿', theme, 48)}
    `;

    const overlays = [];
    if (banner) overlays.push(stickerOverlay(banner, CATALOG_BANNER_TOP, 24));
    ids.forEach((id, i) => {
        if (!thumbs[i]) return;
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
