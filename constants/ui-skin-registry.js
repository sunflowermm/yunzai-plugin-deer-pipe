/**
 * UI 皮肤包注册表：配色、装饰参数、可选 PNG 组件路径
 * - themeOverlay 键对应 svg-base CARD_THEMES 中的叠色主题
 * - components 相对 assets/ 的路径，缺失时回退纯 SVG
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
        },
        calendar: {
            alive: ['#fff8f0', '#ffe8d6'],
            dead: ['#2d1b1b', '#1a0a0a'],
            weekHeader: '#f0e6dc',
        },
        decorations: {
            dotCount: 14,
            dashPattern: '9 7',
            cornerRadius: 16,
        },
        chrome: {
            ribbonHeight: 24,
            cornerSize: 32,
            headerTextShift: 28,
        },
        components: {
            headerRibbon: 'skins/default/ui/header-ribbon.png',
            frameCorner: 'skins/default/ui/frame-corner.png',
            calendarWatermark: 'skins/default/ui/calendar-watermark.png',
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
        },
        calendar: {
            alive: ['#e8f8ec', '#d4f0dc'],
            dead: ['#1a2820', '#0f1a14'],
            weekHeader: '#c8e8d4',
        },
        decorations: {
            dotCount: 22,
            dashPattern: '6 8',
            cornerRadius: 20,
        },
        chrome: {
            ribbonHeight: 24,
            cornerSize: 32,
            headerTextShift: 28,
        },
        components: {
            headerRibbon: 'skins/duanwu/ui/header-ribbon.png',
            frameCorner: 'skins/duanwu/ui/frame-corner.png',
            calendarWatermark: 'skins/duanwu/ui/calendar-watermark.png',
        },
    },
};

export const UI_SKIN_COMPONENT_KEYS = Object.freeze([
    'headerRibbon',
    'frameCorner',
    'calendarWatermark',
]);

export function getUiSkinPack(skinId) {
    return UI_SKIN_PACKS[skinId] || UI_SKIN_PACKS[SKIN_DEFAULT];
}
