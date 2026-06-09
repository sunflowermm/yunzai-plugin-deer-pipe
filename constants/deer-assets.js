import path from 'path';
import { FileUtils } from '../../../lib/utils/file-utils.js';
import { PROFESSIONS } from './profession.js';
import { QUOTA_GROUPS } from './profession-quotas.js';

const PLUGIN_ROOT = path.resolve('./plugins/yunzai-plugin-deer-pipe');

export const PLUGIN_PATH = PLUGIN_ROOT;
export const ASSET_ROOT = `${PLUGIN_ROOT}/assets`;
export const DEERPIPE_LOGO = `${ASSET_ROOT}/deerpipe@100x82.png`;
export const CHECK_MARK = `${ASSET_ROOT}/check@96x100.png`;
export const DEER_FONT = `${ASSET_ROOT}/Genshin.ttf`;
export const PROFESSION_CATALOG_ART = `${ASSET_ROOT}/professions/catalog.png`;

export function professionArtPath(professionId) {
    return `${ASSET_ROOT}/professions/${professionId}.png`;
}

export function skillArtPath(professionId) {
    return `${ASSET_ROOT}/stickers/skills/${professionId}.png`;
}

export function sectionArtPath(sectionKey) {
    return `${ASSET_ROOT}/stickers/sections/${sectionKey}.png`;
}

/** 帮助图分区 → 贴图（互助/恶趣/擂台） */
export const HELP_SECTION_ART = {
    friends: 'help',
    playful: 'harm',
    pvp: 'pvp',
    profession: 'catalog',
};

function listArtRelativePaths() {
    const ids = Object.keys(PROFESSIONS);
    const paths = ['Genshin.ttf'];
    paths.push(...ids.map((id) => `professions/${id}.png`));
    paths.push('professions/catalog.png');
    paths.push(...ids.map((id) => `stickers/skills/${id}.png`));
    paths.push(...QUOTA_GROUPS.map((g) => `stickers/sections/${g.sectionKey}.png`));
    return paths;
}

/** @returns {string[]} 缺失的贴图相对路径 */
export function verifyArtManifest() {
    const missing = [];
    for (const rel of listArtRelativePaths()) {
        if (!FileUtils.existsSync(`${ASSET_ROOT}/${rel}`)) {
            missing.push(rel);
        }
    }
    return missing;
}
