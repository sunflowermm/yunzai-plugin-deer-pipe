import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXTRA_DEER_IDS } from './extra-deer.js';
import { PROFESSIONS } from './profession.js';
import { WEATHER_IDS } from './weather.js';
import { HELP_PAGES } from './help-catalog.js';
import { SKIN_DEFAULT } from './skin-registry.js';

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 运行时预渲染 PNG 根目录（提交到 Git，Bot 直接读） */
export const PREBUILT_ROOT = path.join(PLUGIN_ROOT, 'assets', 'prebuilt');

export const WEATHER_PREBUILT_SLOTS = Object.freeze(['am', 'pm']);

/** 运行时预渲染与 README 样例图共用的 UI 主题 id */
export const PREBUILT_UI_SKIN_IDS = Object.freeze(['default', 'duanwu']);

export const PREBUILT_REL = {
    helpPage: (uiId, index) => `help/${uiId}/page-${index + 1}.png`,
    professionCatalog: (uiId) => `profession/${uiId}/catalog.png`,
    professionCard: (uiId, professionId) => `profession/${uiId}/card-${professionId}.png`,
    professionExtraCard: (uiId, extraId) => `profession/${uiId}/card-extra-${extraId}.png`,
    extraDeerCatalog: (uiId, portraitSkin = 'default') => (
        portraitSkin === 'duanwu'
            ? `profession/${uiId}/extra-catalog-duanwu.png`
            : `profession/${uiId}/extra-catalog.png`
    ),
    weatherDetail: (uiId, weatherId, slot = 'am') => `weather/${uiId}/${weatherId}-${slot}.png`,
    manifest: 'manifest.json',
};

/** docs/images 文件名（README / GitHub 附图，提交仓库） */
export const DOCS_IMAGE = {
    status: (uiId) => `status-${uiId}.png`,
    calendar: (uiId) => `calendar-${uiId}.png`,
    year: (uiId) => `year-${uiId}.png`,
    catalog: (uiId) => `catalog-${uiId}.png`,
    extraCatalog: (uiId) => `extra-catalog-${uiId}.png`,
    helpPage: (uiId, index) => `help-${uiId}-${index + 1}.png`,
    playSteal: 'play-steal-success.png',
    playCurse: 'play-curse.png',
};

/** @returns {string[]} docs/images 下应保留的文件名 */
export function listDocsImageFiles() {
    const files = [DOCS_IMAGE.playSteal, DOCS_IMAGE.playCurse];
    for (const uiId of PREBUILT_UI_SKIN_IDS) {
        files.push(
            DOCS_IMAGE.status(uiId),
            DOCS_IMAGE.calendar(uiId),
            DOCS_IMAGE.year(uiId),
            DOCS_IMAGE.catalog(uiId),
            DOCS_IMAGE.extraCatalog(uiId),
        );
        for (let i = 0; i < HELP_PAGES.length; i += 1) {
            files.push(DOCS_IMAGE.helpPage(uiId, i));
        }
    }
    return files;
}

/** @returns {string[]} 运行时预渲染相对路径（鹿况/月历等带用户数据的不预渲染） */
export function listPrebuiltRelPaths() {
    const paths = [];
    for (const uiId of PREBUILT_UI_SKIN_IDS) {
        for (let i = 0; i < HELP_PAGES.length; i += 1) {
            paths.push(PREBUILT_REL.helpPage(uiId, i));
        }
        paths.push(PREBUILT_REL.professionCatalog(uiId));
        for (const id of Object.keys(PROFESSIONS)) {
            paths.push(PREBUILT_REL.professionCard(uiId, id));
        }
        for (const eid of EXTRA_DEER_IDS) {
            paths.push(PREBUILT_REL.professionExtraCard(uiId, eid));
        }
        paths.push(PREBUILT_REL.extraDeerCatalog(uiId, 'default'));
        paths.push(PREBUILT_REL.extraDeerCatalog(uiId, 'duanwu'));
        for (const weatherId of WEATHER_IDS) {
            for (const slot of WEATHER_PREBUILT_SLOTS) {
                paths.push(PREBUILT_REL.weatherDetail(uiId, weatherId, slot));
            }
        }
    }
    return paths;
}

export function prebuiltAbsPath(relPath) {
    return path.join(PREBUILT_ROOT, relPath.replace(/\\/g, '/'));
}

/** 当前半天 → 预渲染 weather 文件名后缀 */
export function weatherPrebuiltSlot(date = new Date()) {
    return date.getHours() < 12 ? 'am' : 'pm';
}

/** 从 skinCtx 解析 UI 主题 id（预渲染路径用） */
export function prebuiltUiSkinId(opts = {}) {
    const ui = opts.skinCtx?.ui;
    if (ui && PREBUILT_UI_SKIN_IDS.includes(ui)) return ui;
    return SKIN_DEFAULT;
}
