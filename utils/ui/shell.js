/**
 * UI 皮肤出图壳层：主题解析、统一 render 入口（chrome 由 appendUiPresentationLayers 处理）
 */
import { getUiSkinPack } from '../../constants/ui-skin-registry.js';
import {
    CARD_THEMES,
    cardSvgExtraDefs,
    renderStyledCard,
    svgTextStyled,
} from '../svg-base.js';
import { compositeToPng, px, rasterizeDeerSvg } from '../render-pipeline.js';
import { buildSkinCardDecorations } from './components.js';
import { appendUiPresentationLayers, buildPresentationUnderlays } from './skin-assets.js';
import { resolveDecorationProfile, resolveSurfaceTheme } from './theme.js';

function mergeTheme(base, overlayKey) {
    if (!overlayKey) return base;
    const overlay = CARD_THEMES[overlayKey];
    if (!overlay) return base;
    return { ...base, ...overlay };
}

function cardSvgDefs(theme) {
    return `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">${theme.bgStops}</linearGradient>${cardSvgExtraDefs(theme)}`;
}

/** 在任意 CARD_THEMES / 天象主题上叠 UI 皮肤色 */
export function mergeUiSkinTheme(uiSkinId, baseTheme) {
    const pack = getUiSkinPack(uiSkinId);
    return mergeTheme(baseTheme, pack.themeOverlay);
}

/** 玩法结果卡：保留 curse/bless 等语义色，再叠节日皮肤 */
export function resolvePlayResultTheme(uiSkinId, resultThemeKey) {
    const base = CARD_THEMES[resultThemeKey] || CARD_THEMES.mischief;
    return mergeUiSkinTheme(uiSkinId, base);
}

/**
 * 虚线边框装饰（随皮肤 profile）
 */
export function buildSurfaceDecorations(width, height, theme, uiSkinId, seed) {
    const profile = resolveDecorationProfile(uiSkinId);
    return buildSkinCardDecorations(width, height, theme, seed, profile);
}

/**
 * 分层出图：背景 SVG → chrome/散布贴图 → 内容 SVG → 业务贴图
 * 职业一览用：皮肤配饰可见，且内容层盖住边带贴图、不挡格子
 */
export async function renderSkinnedCardStacked({
    width,
    height,
    backgroundSvg,
    contentSvg,
    uiSkinId = 'default',
    overlays = [],
    theme = null,
    themeKey = 'profession',
    opts = {},
}) {
    const resolvedTheme = theme || CARD_THEMES[themeKey] || CARD_THEMES.mischief;
    const w = px(width);
    const h = px(height);
    const defs = cardSvgDefs(resolvedTheme);
    const bgLayer = rasterizeDeerSvg(svgTextStyled(backgroundSvg, w, h, defs));
    const contentLayer = rasterizeDeerSvg(svgTextStyled(contentSvg, w, h, defs));
    const underlays = await buildPresentationUnderlays(uiSkinId, width, height, opts);
    return compositeToPng(w, h, [
        { input: bgLayer, top: 0, left: 0 },
        ...underlays,
        { input: contentLayer, top: 0, left: 0 },
        ...overlays.filter(Boolean),
    ]);
}

/**
 * 标准卡片出图：SVG 内容 + 皮肤贴图/chrome（玩法卡等，配饰在最顶层）
 */
export async function renderSkinnedCard({
    width,
    height,
    innerSvg,
    uiSkinId = 'default',
    surface,
    overlays = [],
    theme = null,
    themeKey = 'mischief',
    baseKey = null,
    opts = {},
}) {
    const resolvedTheme = theme || (surface
        ? resolveSurfaceTheme(uiSkinId, surface, baseKey ? { baseKey } : opts)
        : CARD_THEMES[themeKey] || CARD_THEMES.mischief);
    const mergedOverlays = await appendUiPresentationLayers(overlays, uiSkinId, width, height, {
        stickerSeed: opts.stickerSeed,
        stickerProfile: opts.stickerProfile,
        chromeInsertAfter: opts.chromeInsertAfter,
        stickers: opts.stickers,
    });
    return renderStyledCard(width, height, innerSvg, themeKey, mergedOverlays, resolvedTheme);
}
