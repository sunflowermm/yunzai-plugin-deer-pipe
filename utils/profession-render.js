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

    listProfessionQuotaRows,

} from '../constants/profession-quotas.js';

import { getPlayQuotaSnapshot } from './data.js';

import {

    buildPortraitGlowSvg,

    loadBanner,

    loadBrandLogo,
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

const CATALOG_THUMB = 68;

const SECTION_ICON_LEFT = CX - 200;



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



/**

 * 单职业专精卡（立绘 + 分组配额 + 专属技贴图）

 */

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



/** 七职业一览（缩略立绘 + 分组配额摘要） */

export async function generateProfessionCatalogImage() {

    const theme = CARD_THEMES.profession;

    const ids = Object.keys(PROFESSIONS);

    const cols = 2;

    const cellW = 320;

    const cellH = 172;

    const padX = 24;

    const padY = 118;

    const rows = Math.ceil(ids.length / cols);

    const H = padY + rows * cellH + 64;



    const [banner, brandLogo, ...thumbs] = await Promise.all([

        loadBanner(PROFESSION_CATALOG_ART, CARD_W - 48, 76),

        loadBrandLogo(),

        ...ids.map((id) => loadProfessionArt(id, CATALOG_THUMB, { radius: 14, borderWidth: 2, fitScale: 0.9 })),

    ]);

    let cells = '';

    ids.forEach((id, i) => {

        const p = PROFESSIONS[id];

        const col = i % cols;

        const row = Math.floor(i / cols);

        const x = padX + col * (cellW + 16);

        const y = padY + row * cellH;

        const brief = listProfessionQuotaRows(id)

            .slice(0, 8)

            .map((r) => `${r.label}${r.max}`)

            .join(' ');

        const textX = x + (thumbs[i] ? 88 : 16);

        cells += `

            <rect x="${x}" y="${y}" width="${cellW}" height="${cellH - 12}" rx="12" fill="${theme.panel}" stroke="${theme.accent}" stroke-width="1.2"/>

            ${thumbs[i] ? '' : textCenteredEmoji(x + 36, y + 40, p.emoji, { size: 28 })}

            <text ${TXT} x="${textX}" y="${y + 34}" font-size="17" fill="${theme.title}" font-weight="bold">${escapeXml(p.name)}</text>

            <text ${TXT_SOFT} x="${textX}" y="${y + 54}" font-size="11" fill="${theme.muted}">${truncText(p.tagline, 26)}</text>

            <text ${TXT_SOFT} x="${x + 16}" y="${y + 96}" font-size="11" fill="${theme.sub}">${truncText(brief, 54)}</text>

            <text ${TXT_SOFT} x="${x + 16}" y="${y + 128}" font-size="10" fill="${theme.accent}">转职${escapeXml(p.name)}</text>

        `;

    });



    const inner = `

        <rect width="${CARD_W}" height="${H}" rx="16" fill="url(#cardBg)"/>

        ${buildCardDecorations(CARD_W, H, theme, hashSeed('prof-catalog'))}

        ${banner ? '' : buildCenteredEmojiTitle(CX, 40, '🦌', '鹿林七职业 · 配额专精一览', { emojiSize: 26, titleSize: 24, style: TXT, fill: theme.title })}

        ${banner ? textCentered(CX, 40, '鹿林七职业 · 配额专精一览', TXT, { size: 24, fill: theme.title, weight: 'bold' }) : ''}

        ${textCentered(CX, banner ? 100 : 68, '转职+职业名选定 · 当日锁定 · 次日0点重置', TXT_SOFT, { size: 13, fill: theme.muted })}

        ${cells}

        ${buildFooterBar(CARD_W, H - 28, '没转职=没配额：先转职，再开鹿', theme, 48)}

    `;



    const overlays = [];

    if (banner) overlays.push(stickerOverlay(banner, 48, 24));

    ids.forEach((id, i) => {

        const col = i % cols;

        const row = Math.floor(i / cols);

        const x = padX + col * (cellW + 16);

        const y = padY + row * cellH;

        if (thumbs[i]) overlays.push(stickerOverlay(thumbs[i], y + 22, x + 14));

    });

    if (brandLogo) overlays.push(stickerOverlay(brandLogo, H - 42, 22));

    return renderStyledCard(CARD_W, H, inner, 'profession', overlays.filter(Boolean));

}



/** 用户当日职业面板（含已用/剩余） */

export async function generateUserProfessionPanel(monthData, day) {

    const snap = getPlayQuotaSnapshot(monthData, day);

    if (snap.professionRequired || !snap.profession?.id) {

        return generateProfessionCatalogImage();

    }

    return generateProfessionCard(snap.profession.id, { snapshot: snap, showUsage: true });

}

