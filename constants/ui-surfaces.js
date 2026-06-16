/** 出图界面类型 — UI 皮肤按 surface 解析主题与组件资源 */

export const UI_SURFACES = Object.freeze({
    STATUS: 'status',
    CALENDAR: 'calendar',
    CALENDAR_YEAR: 'calendarYear',
    PROFESSION: 'profession',
    PROFESSION_CATALOG: 'professionCatalog',
    HELP: 'help',
    PLAY: 'play',
    WEATHER: 'weather',
});

/** @typedef {typeof UI_SURFACES[keyof typeof UI_SURFACES]} UiSurface */
