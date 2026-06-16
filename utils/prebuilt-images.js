import path from 'node:path';
import { readFileSync } from 'node:fs';
import YAML from 'yaml';
import { FileUtils } from '../../../lib/utils/file-utils.js';
import { PLUGIN_PATH } from '../constants/deer-assets.js';
import { SKIN_DEFAULT } from '../constants/skins.js';
import { HELP_PAGES } from '../constants/help-catalog.js';
import {
    PREBUILT_REL,
    prebuiltAbsPath,
    prebuiltUiSkinId,
    weatherPrebuiltSlot,
} from '../constants/prebuilt-images.js';
import { generateHelpImages } from './help-render.js';
import { generateProfessionCatalogImage, generateProfessionCard } from './profession-render.js';
import { generateWeatherDetailImage } from './card-render.js';
import { shouldBypassPrebuiltForPortraitSkin } from './skin.js';

const bufferCache = new Map();
let renderConfig;

function readRenderConfig() {
    if (renderConfig) return renderConfig;
    try {
        const cfgPath = path.join(PLUGIN_PATH, 'config', 'default', 'config.yaml');
        const raw = FileUtils.readFileSync(cfgPath, 'utf8');
        renderConfig = YAML.parse(raw)?.render ?? {};
    } catch {
        renderConfig = {};
    }
    return renderConfig;
}

/** 是否优先读预渲染 PNG（缺文件时自动回退实时渲染） */
export function shouldUsePrebuilt() {
    if (process.env.DEER_PIPE_FORCE_LIVE_RENDER === '1') return false;
    return readRenderConfig().prefer_prebuilt !== false;
}

export function clearPrebuiltCache() {
    bufferCache.clear();
}

export function loadPrebuiltImage(relPath) {
    if (!relPath) return null;
    const key = relPath.replace(/\\/g, '/');
    if (bufferCache.has(key)) return bufferCache.get(key);
    const abs = prebuiltAbsPath(key);
    if (!FileUtils.existsSync(abs)) return null;
    const buf = readFileSync(abs);
    if (!Buffer.isBuffer(buf) || !buf.length) return null;
    bufferCache.set(key, buf);
    return buf;
}

function loadPrebuiltForUi(uiSkinId, relPath) {
    let buf = loadPrebuiltImage(relPath);
    if (buf || uiSkinId === SKIN_DEFAULT) return buf;
    return loadPrebuiltImage(relPath.replace(`/${uiSkinId}/`, `/${SKIN_DEFAULT}/`));
}

async function resolvePrebuiltSkin(uiSkinId, relPath, renderFn) {
    if (shouldUsePrebuilt()) {
        const cached = loadPrebuiltForUi(uiSkinId, relPath);
        if (cached) return cached;
    }
    return renderFn();
}

/** @returns {Promise<Buffer[]>} */
export async function resolveHelpImages(opts = {}) {
    const uiSkinId = prebuiltUiSkinId(opts);
    if (!shouldUsePrebuilt()) return generateHelpImages(opts);
    const pages = [];
    let missing = false;
    for (let i = 0; i < HELP_PAGES.length; i += 1) {
        const buf = loadPrebuiltForUi(uiSkinId, PREBUILT_REL.helpPage(uiSkinId, i));
        if (!buf) {
            missing = true;
            break;
        }
        pages.push(buf);
    }
    if (!missing && pages.length === HELP_PAGES.length) return pages;
    return generateHelpImages(opts);
}

export async function resolveProfessionCatalogImage(opts = {}) {
    if (opts.snapshot) {
        return generateProfessionCatalogImage(opts);
    }
    const uiSkinId = prebuiltUiSkinId(opts);
    return resolvePrebuiltSkin(
        uiSkinId,
        PREBUILT_REL.professionCatalog(uiSkinId),
        () => generateProfessionCatalogImage(opts),
    );
}

export async function resolveProfessionCard(professionId, opts = {}) {
    if (opts.skinCtx && shouldBypassPrebuiltForPortraitSkin(opts.skinCtx)) {
        return generateProfessionCard(professionId, opts);
    }
    const uiSkinId = prebuiltUiSkinId(opts);
    return resolvePrebuiltSkin(
        uiSkinId,
        PREBUILT_REL.professionCard(uiSkinId, professionId),
        () => generateProfessionCard(professionId, opts),
    );
}

/**
 * 天象详情卡：admin 赐福、缺预渲染文件时走实时渲染
 */
export async function resolveWeatherDetailImage(state, effects, date = new Date(), opts = {}) {
    const weatherId = state?.weatherId || 'sunny';
    const uiSkinId = prebuiltUiSkinId(opts);
    const render = () => generateWeatherDetailImage(state, effects, date, opts);
    if (state?.source === 'admin') {
        return render();
    }
    const slot = weatherPrebuiltSlot(date);
    const rel = PREBUILT_REL.weatherDetail(uiSkinId, weatherId, slot);
    return resolvePrebuiltSkin(uiSkinId, rel, render);
}

/** @returns {string[]} 缺失的预渲染相对路径 */
export function verifyPrebuiltManifest() {
    const manifestPath = prebuiltAbsPath(PREBUILT_REL.manifest);
    if (!FileUtils.existsSync(manifestPath)) {
        return ['manifest.json'];
    }
    try {
        const manifest = JSON.parse(FileUtils.readFileSync(manifestPath, 'utf8'));
        const files = manifest?.files;
        if (!Array.isArray(files)) return ['manifest.json'];
        return files.filter((rel) => !FileUtils.existsSync(prebuiltAbsPath(rel)));
    } catch {
        return ['manifest.json'];
    }
}
