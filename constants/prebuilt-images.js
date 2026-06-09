import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROFESSIONS } from './profession.js';
import { WEATHER_IDS } from './weather.js';
import { HELP_PAGES } from './help-catalog.js';

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 运行时预渲染 PNG 根目录（提交到 Git，Bot 直接读） */
export const PREBUILT_ROOT = path.join(PLUGIN_ROOT, 'assets', 'prebuilt');

export const WEATHER_PREBUILT_SLOTS = Object.freeze(['am', 'pm']);

export const PREBUILT_REL = {
    helpPage: (index) => `help/page-${index + 1}.png`,
    professionCatalog: 'profession/catalog.png',
    professionCard: (professionId) => `profession/card-${professionId}.png`,
    weatherDetail: (weatherId, slot = 'am') => `weather/${weatherId}-${slot}.png`,
    calendarMonthDemo: 'calendar/month-demo.png',
    manifest: 'manifest.json',
};

/** README 文档镜像：prebuilt 相对路径 → docs/images 文件名 */
export const README_IMAGE_MIRROR = Object.freeze({
    [PREBUILT_REL.helpPage(0)]: 'help-1.png',
    [PREBUILT_REL.helpPage(1)]: 'help-2.png',
    [PREBUILT_REL.professionCatalog]: 'profession-catalog.png',
    'profession/card-grinder.png': 'profession-card-grinder.png',
    'profession/card-sunflower.png': 'profession-card-sunflower.png',
    'profession/card-rogue.png': 'profession-card-rogue.png',
    'profession/card-medic.png': 'profession-card-medic.png',
    'weather/rainbow-am.png': 'weather-rainbow.png',
    'weather/storm-am.png': 'weather-storm.png',
    'weather/gloom-am.png': 'weather-gloom.png',
    'weather/sunny-am.png': 'weather-sunny.png',
    'weather/drizzle-am.png': 'weather-drizzle.png',
});

/** @returns {{ rel: string, kind: string }[]} */
export function listPrebuiltExportTargets() {
    const targets = [];
    for (let i = 0; i < HELP_PAGES.length; i += 1) {
        targets.push({ rel: PREBUILT_REL.helpPage(i), kind: 'help' });
    }
    targets.push({ rel: PREBUILT_REL.professionCatalog, kind: 'profession-catalog' });
    for (const id of Object.keys(PROFESSIONS)) {
        targets.push({ rel: PREBUILT_REL.professionCard(id), kind: 'profession-card' });
    }
    for (const weatherId of WEATHER_IDS) {
        for (const slot of WEATHER_PREBUILT_SLOTS) {
            targets.push({ rel: PREBUILT_REL.weatherDetail(weatherId, slot), kind: 'weather' });
        }
    }
    targets.push({ rel: PREBUILT_REL.calendarMonthDemo, kind: 'calendar-demo' });
    return targets;
}

export function prebuiltAbsPath(relPath) {
    return path.join(PREBUILT_ROOT, relPath.replace(/\\/g, '/'));
}

/** 当前半天 → 预渲染 weather 文件名后缀 */
export function weatherPrebuiltSlot(date = new Date()) {
    return date.getHours() < 12 ? 'am' : 'pm';
}
