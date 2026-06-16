import { SKIN_DEFAULT } from '../../constants/skins.js';
import { getUiSkinPack } from '../../constants/ui-skin-registry.js';
import { UI_SURFACES } from '../../constants/ui-surfaces.js';
import { CARD_THEMES, statusPanelTheme } from '../svg-base.js';

function mergeTheme(base, overlayKey) {
    if (!overlayKey) return base;
    const overlay = CARD_THEMES[overlayKey];
    if (!overlay) return base;
    return { ...base, ...overlay };
}

function surfaceConfig(pack, surface) {
    return pack.surfaces?.[surface] || {};
}

/**
 * 解析某界面的完整主题 token（颜色/渐变等）
 * @param {string} uiSkinId
 * @param {import('../../constants/ui-surfaces.js').UiSurface} surface
 * @param {{ status?: object }} [opts]
 */
export function resolveSurfaceTheme(uiSkinId, surface, opts = {}) {
    const pack = getUiSkinPack(uiSkinId);

    if (surface === UI_SURFACES.STATUS && opts.status) {
        const base = statusPanelTheme(opts.status);
        const cfg = surfaceConfig(pack, surface);
        return mergeTheme(base, cfg.themeOverlay || pack.themeOverlay);
    }

    const cfg = surfaceConfig(pack, surface);
    const baseKey = cfg.baseKey || 'mischief';
    const base = CARD_THEMES[baseKey] || CARD_THEMES.mischief;
    return mergeTheme(base, cfg.themeOverlay || pack.themeOverlay);
}

/** 月历背景双色渐变 */
export function resolveCalendarPalette(uiSkinId, { dead = false } = {}) {
    const pack = getUiSkinPack(uiSkinId);
    const fallback = getUiSkinPack(SKIN_DEFAULT).calendar || {};
    const cal = pack.calendar || fallback;
    const pair = dead ? cal.dead : cal.alive;
    if (pair?.length === 2) return pair;
    return dead ? ['#2d1b1b', '#1a0a0a'] : ['#fff8f0', '#ffe8d6'];
}

/** 月历星期栏底色 */
export function resolveCalendarWeekHeader(uiSkinId) {
    const pack = getUiSkinPack(uiSkinId);
    return pack.calendar?.weekHeader || '#f0e6dc';
}

export function resolveDecorationProfile(uiSkinId) {
    const pack = getUiSkinPack(uiSkinId);
    return pack.decorations || getUiSkinPack(SKIN_DEFAULT).decorations;
}

export { UI_SURFACES };
