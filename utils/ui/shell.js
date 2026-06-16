/**
 * UI 皮肤出图壳层：主题解析、统一 render 入口（chrome 由 appendUiPresentationLayers 处理）
 */
import { getUiSkinPack } from '../../constants/ui-skin-registry.js';
import { CARD_THEMES, renderStyledCard } from '../svg-base.js';
import { buildSkinCardDecorations } from './components.js';
import { appendUiPresentationLayers, buildPresentationUnderlays } from './skin-assets.js';
import { resolveDecorationProfile, resolveSurfaceTheme } from './theme.js';

function mergeTheme(base, overlayKey) {
    if (!overlayKey) return base;
    const overlay = CARD_THEMES[overlayKey];
    if (!overlay) return base;
    return { ...base, ...overlay };
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
 * 标准卡片出图：SVG 内容 + 皮肤贴图/chrome
 * - 默认：内容 SVG → 业务贴图 → 散布贴图 → chrome（玩法卡等）
 * - presentationUnderContent：chrome/散布贴图 → 内容 SVG → 业务贴图（职业一览 catalog）
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

    if (opts.presentationUnderContent) {
        const underlays = await buildPresentationUnderlays(uiSkinId, width, height, opts);
        return renderStyledCard(width, height, innerSvg, themeKey, overlays, resolvedTheme, underlays);
    }

    const mergedOverlays = await appendUiPresentationLayers(overlays, uiSkinId, width, height, {
        stickerSeed: opts.stickerSeed,
        stickerProfile: opts.stickerProfile,
        chromeInsertAfter: opts.chromeInsertAfter,
        stickers: opts.stickers,
    });
    return renderStyledCard(width, height, innerSvg, themeKey, mergedOverlays, resolvedTheme);
}
