/**
 * UI 皮肤包注册表：配色、装饰参数、可选 PNG 组件路径
 * - 仅界面样式；职业立绘由 constants/skins.js PORTRAIT_SKINS + assets/professions/skins/ 独立管理
 * - themeOverlay 键对应 svg-base CARD_THEMES 中的叠色主题
 */

import { SKIN_DEFAULT } from './skins.js';
import { UI_SURFACES } from './ui-surfaces.js';

/** @typedef {{ dotCount?: number, dashPattern?: string, cornerRadius?: number }} DecorationProfile */

/** @typedef {Record<string, string>} SkinComponentMap */

/**
 * @typedef {object} UiSkinPack
 * @property {string} id
 * @property {string} [themeOverlay] CARD_THEMES 叠色键
 * @property {Record<string, { baseKey?: string, themeOverlay?: string }>} [surfaces]
 * @property {{ alive?: [string,string], dead?: [string,string], weekHeader?: string }} [calendar]
 * @property {DecorationProfile} [decorations]
 * @property {SkinComponentMap} [components]
 */

/** @type {Record<string, UiSkinPack>} */
export const UI_SKIN_PACKS = {
    [SKIN_DEFAULT]: {
        id: SKIN_DEFAULT,
        surfaces: {
            [UI_SURFACES.STATUS]: { baseKey: 'mischief' },
            [UI_SURFACES.PROFESSION]: { baseKey: 'profession' },
            [UI_SURFACES.PROFESSION_CATALOG]: { baseKey: 'profession' },
            [UI_SURFACES.HELP]: { baseKey: 'help' },
            [UI_SURFACES.PLAY]: { baseKey: 'mischief' },
            [UI_SURFACES.WEATHER]: { baseKey: 'weather' },
            [UI_SURFACES.CALENDAR]: { baseKey: 'mischief' },
            [UI_SURFACES.CALENDAR_YEAR]: { baseKey: 'mischief' },
            [UI_SURFACES.KING]: { baseKey: 'king' },
        },
        calendar: {
            alive: ['#fff8f0', '#ffe8d6'],
            dead: ['#2d1b1b', '#1a0a0a'],
            weekHeader: '#f5e6d8',
        },
        decorations: {
            dotCount: 14,
            dashPattern: '9 7',
            cornerRadius: 16,
        },
        chrome: {
            ribbonMaxHeight: 60,
            ribbonScale: 1.6,
            ribbonPairPull: 40,
            ribbonHalfInset: 4,
            cornerWidth: 136,
            cornerPad: 2,
            cornerPairPull: 22,
            headerTextShift: 42,
        },
        sticker: {
            placement: 'full',
            count: 12,
            size: 42,
            sizeVariation: 0.35,
            opacity: 0.2,
            marginTop: 52,
            marginBottom: 28,
            minGap: 8,
            excludePad: 6,
        },
        components: {
            headerRibbon: 'skins/default/ui/header-ribbon.png',
            frameCorner: 'skins/default/ui/frame-corner.png',
            calendarWatermark: 'skins/default/ui/calendar-watermark.png',
            skinSticker: 'skins/default/ui/sticker-heart.png',
        },
    },
    duanwu: {
        id: 'duanwu',
        themeOverlay: 'duanwu',
        surfaces: {
            [UI_SURFACES.STATUS]: { baseKey: 'mischief', themeOverlay: 'duanwu' },
            [UI_SURFACES.PROFESSION]: { baseKey: 'profession', themeOverlay: 'duanwu' },
            [UI_SURFACES.PROFESSION_CATALOG]: { baseKey: 'profession', themeOverlay: 'duanwu' },
            [UI_SURFACES.HELP]: { baseKey: 'help', themeOverlay: 'duanwu' },
            [UI_SURFACES.PLAY]: { baseKey: 'mischief', themeOverlay: 'duanwu' },
            [UI_SURFACES.WEATHER]: { baseKey: 'weather', themeOverlay: 'duanwu' },
            [UI_SURFACES.CALENDAR]: { baseKey: 'mischief', themeOverlay: 'duanwu' },
            [UI_SURFACES.CALENDAR_YEAR]: { baseKey: 'mischief', themeOverlay: 'duanwu' },
            [UI_SURFACES.KING]: { baseKey: 'king', themeOverlay: 'duanwu' },
        },
        calendar: {
            alive: ['#eef8f0', '#d4ecd8'],
            dead: ['#142820', '#0a1812'],
            weekHeader: '#c5e0cc',
        },
        decorations: {
            dotCount: 22,
            dashPattern: '6 8',
            cornerRadius: 20,
        },
        chrome: {
            ribbonMaxHeight: 52,
            ribbonScale: 1,
            ribbonTopOffset: 20,
            ribbonPairFactor: 0.14,
            ribbonHalfInset: 2,
            cornerWidth: 84,
            cornerPad: 2,
            cornerPairPull: 20,
            headerTextShift: 40,
        },
        sticker: {
            placement: 'full',
            count: 18,
            size: 38,
            sizeVariation: 0.4,
            opacity: 0.21,
            marginTop: 44,
            marginBottom: 24,
            minGap: 6,
            excludePad: 6,
        },
        components: {
            headerRibbon: 'skins/duanwu/ui/header-ribbon.png',
            frameCorner: 'skins/duanwu/ui/frame-corner.png',
            calendarWatermark: 'skins/duanwu/ui/calendar-watermark.png',
            skinSticker: 'skins/duanwu/ui/sticker-zongzi.png',
        },
    },
};

export const UI_SKIN_COMPONENT_KEYS = Object.freeze([
    'headerRibbon',
    'frameCorner',
    'calendarWatermark',
    'skinSticker',
]);

export function getUiSkinPack(skinId) {
    return UI_SKIN_PACKS[skinId] || UI_SKIN_PACKS[SKIN_DEFAULT];
}
