import path from 'path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { FileUtils } from '../../../lib/utils/file-utils.js';
import { PROFESSIONS } from './profession.js';
import { QUOTA_GROUPS } from './profession-quotas.js';

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const PLUGIN_PATH = PLUGIN_ROOT;
export const ASSET_ROOT = `${PLUGIN_ROOT}/assets`;
export const DEERPIPE_LOGO = `${ASSET_ROOT}/deerpipe@100x82.png`;
export const CHECK_MARK = `${ASSET_ROOT}/check@96x100.png`;
export const DEER_FONT = `${ASSET_ROOT}/Genshin.ttf`;
/** Genshin.ttf 内嵌 PostScript 名，resvg 须用此 family 匹配 */
export const DEER_FONT_FAMILY = 'FZBenMoYueYiTiS';

let _fontB64Cache = null;

/** sharp 栅格 SVG 用：base64 内嵌字体（librsvg 不支持外部 file://） */
export function getFontBase64DataUri() {
    if (!_fontB64Cache) {
        _fontB64Cache = readFileSync(DEER_FONT).toString('base64');
    }
    return `data:font/ttf;base64,${_fontB64Cache}`;
}

export const PROFESSION_CATALOG_ART = `${ASSET_ROOT}/professions/catalog.png`;

/** 策划彩蛋职业：无独立 PNG，职业卡/一览用 emoji 占位 */
export const PROFESSION_EMOJI_ONLY = new Set(['sunflower']);

export function professionUsesEmojiArt(professionId) {
    return PROFESSION_EMOJI_ONLY.has(professionId);
}

export function professionArtPath(professionId) {
    if (professionUsesEmojiArt(professionId)) return null;
    return `${ASSET_ROOT}/professions/${professionId}.png`;
}

export function skillArtPath(professionId) {
    if (professionUsesEmojiArt(professionId)) return null;
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
    paths.push(...ids.filter((id) => !professionUsesEmojiArt(id)).map((id) => `professions/${id}.png`));
    paths.push('professions/catalog.png');
    paths.push(...ids.filter((id) => !professionUsesEmojiArt(id)).map((id) => `stickers/skills/${id}.png`));
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
