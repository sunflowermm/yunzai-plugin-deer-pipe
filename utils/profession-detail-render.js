/**
 * 职业天赋/专属技详解渲染（鹿况、职业卡、一览共用）
 */
import {
    PROFESSION_SKILLS,
    PROFESSIONS,
    formatProfessionQuotaSummary,
    getProfessionDef,
} from '../constants/profession.js';
import { getExtraDeerDef, getExtraDeerSkill, isExtraDeerId } from '../constants/extra-deer.js';
import { formatTalentDetailParts } from '../constants/talent-text.js';
import { emojiSvgImage } from './emoji-compose.js';
import { loadExtraDeerSkillArt, loadSkillArt, stickerOverlay } from './sticker-compose.js';
import {
    buildMultilineTextCentered,
    buildSideArtCell,
    deerTextForSvg,
    textCentered,
    wrapTextLines,
    TXT_SOFT,
} from './svg-base.js';

const TALENT_COLS = 2;
const TALENT_FONT = 10;
const TALENT_LINE_H = 13;
const TALENT_WRAP_PER = 3;
const SKILL_ICON = 44;
const UNLIMITED_LINES = 48;

function talentColLayout(width, padX = 20, gap = 14) {
    const colW = (width - padX * 2 - gap * (TALENT_COLS - 1)) / TALENT_COLS;
    const colCx = [
        padX + colW / 2,
        padX + colW + gap + colW / 2,
    ];
    return { colW, colCx, padX, gap };
}

/** 逐条天赋折行（不合并成一行，避免截断） */
export function expandTalentTextLines(parts, maxWidth, fontSize = TALENT_FONT, maxLinesPerPart = TALENT_WRAP_PER) {
    const lines = [];
    for (const part of parts) {
        lines.push(...wrapTextLines(deerTextForSvg(part), maxWidth, fontSize, maxLinesPerPart));
    }
    return lines;
}

/** 一览格：右栏文本最大宽度（与 buildSideArtCell 一致） */
export function sideArtCellTextMaxW(cellW, artSize, artPad = 10, badgeText = '') {
    const textLeft = artPad + artSize + 12;
    const textPadRight = badgeText ? 58 : 8;
    return cellW - textLeft - textPadRight;
}

/** 一览格文案 */
export function buildCatalogCellCopy(id, textMaxW) {
    const profDef = getProfessionDef(id);
    const skill = PROFESSION_SKILLS[id];
    const subtitleLines = expandTalentTextLines(formatTalentDetailParts(profDef), textMaxW, 10, 2);
    const quotaBrief = formatProfessionQuotaSummary(id, 'brief');
    const meta = deerTextForSvg(skill ? `${quotaBrief} · ${skill.cmd}` : quotaBrief);
    return { subtitleLines, meta };
}

/** 双列天赋网格高度（含标题） */
export function measureTalentDetailBlock(parts, width, opts = {}) {
    const { colW } = talentColLayout(width, opts.padX, opts.gap);
    const colHeights = [0, 0];
    for (let i = 0; i < parts.length; i += 1) {
        const col = i % TALENT_COLS;
        const lines = wrapTextLines(deerTextForSvg(parts[i]), colW, TALENT_FONT, TALENT_WRAP_PER);
        colHeights[col] += lines.length * TALENT_LINE_H + 3;
    }
    const bodyH = Math.max(colHeights[0], colHeights[1]);
    return 20 + bodyH + 10;
}

/** 双列居中天赋详解 */
export function buildTalentDetailBlock(parts, theme, topY, width, opts = {}) {
    const { colW, colCx } = talentColLayout(width, opts.padX, opts.gap);
    let svg = textCentered(width / 2, topY, '天赋详解', TXT_SOFT, {
        size: 12,
        fill: theme.muted,
        weight: 'bold',
    });
    const bodyTop = topY + 20;
    const colY = [bodyTop, bodyTop];
    for (let i = 0; i < parts.length; i += 1) {
        const col = i % TALENT_COLS;
        const lines = wrapTextLines(deerTextForSvg(parts[i]), colW, TALENT_FONT, TALENT_WRAP_PER);
        svg += buildMultilineTextCentered(colCx[col], colY[col], lines, {
            fontSize: TALENT_FONT,
            lineHeight: TALENT_LINE_H,
            fill: theme.sub,
        });
        colY[col] += lines.length * TALENT_LINE_H + 3;
    }
    return { svg, height: measureTalentDetailBlock(parts, width, opts) };
}

async function cellArtEmojiImg(artLeft, artTop, artSize, emoji) {
    const cx = artLeft + artSize / 2;
    const cy = artTop + artSize / 2 + Math.round(artSize * 0.1);
    return emojiSvgImage(cx, cy, emoji, Math.round(artSize * 0.52));
}

/** 专属技单元（居中 + 贴图） */
export async function buildSkillDetailCell({
    professionId,
    skill,
    theme,
    topY,
    width,
    portraitSkinId,
    stateLabel = '',
    cellW: cellWIn,
    iconSize = SKILL_ICON,
}) {
    if (!skill) return { svg: '', height: 0, overlays: [] };
    const cellW = cellWIn ?? width - 48;
    const cellX = (width - cellW) / 2;
    const stateSuffix = stateLabel ? ` · ${stateLabel}` : '';
    const cell = buildSideArtCell({
        x: cellX,
        y: topY,
        cellW,
        artSize: iconSize,
        artPad: 8,
        theme,
        title: `专属技 · ${skill.name}${stateSuffix}`,
        subtitle: deerTextForSvg(`${skill.cmd} · ${skill.desc}`),
        titleSize: 14,
        subSize: 10,
        subtitleMaxLines: UNLIMITED_LINES,
    });
    const skinId = portraitSkinId && portraitSkinId !== 'default' ? portraitSkinId : undefined;
    const extra = isExtraDeerId(professionId);
    const skillIcon = extra
        ? await loadExtraDeerSkillArt(professionId, iconSize)
        : await loadSkillArt(professionId, iconSize, skinId);
    const prof = extra ? getExtraDeerDef(professionId) : PROFESSIONS[professionId];
    const emojiArt = !skillIcon && prof?.emoji
        ? await cellArtEmojiImg(cell.artLeft, cell.artTop, cell.artSize, prof.emoji)
        : '';
    const overlays = [];
    if (skillIcon) overlays.push(stickerOverlay(skillIcon, cell.artTop, cell.artLeft));
    return { svg: cell.svg + emojiArt, height: cell.cellH + 10, overlays, cell };
}

/** 鹿况：天赋详解 + 专属技（异步加载贴图） */
export async function buildStatusProfessionDetail(status, theme, topY, width, skinCtx = null) {
    if (status.professionRequired || !status.professionId) {
        return { svg: '', height: 0, overlays: [] };
    }
    const profDef = isExtraDeerId(status.professionId)
        ? getExtraDeerDef(status.professionId)
        : getProfessionDef(status.professionId);
    const parts = formatTalentDetailParts(profDef);
    const talentBlock = buildTalentDetailBlock(parts, theme, topY, width);
    let y = topY + talentBlock.height;
    let svg = talentBlock.svg;
    const overlays = [];

    if (status.jobSkillName) {
        const extra = isExtraDeerId(status.professionId);
        const skill = extra
            ? getExtraDeerSkill(status.professionId)
            : PROFESSION_SKILLS[status.professionId];
        const stateLabel = status.jobSkillUsed
            ? '今日已用'
            : (status.patrolBuffPending ? '巡游蓄势' : '可用');
        const skillBlock = await buildSkillDetailCell({
            professionId: status.professionId,
            skill: skill || {
                name: status.jobSkillName,
                cmd: status.jobSkillCmd,
                desc: status.jobSkillDesc,
            },
            theme,
            topY: y + 8,
            width,
            portraitSkinId: skinCtx?.portrait,
            stateLabel,
        });
        svg += skillBlock.svg;
        overlays.push(...skillBlock.overlays);
        y += 8 + skillBlock.height;
    }

    return { svg, height: y - topY, overlays };
}
