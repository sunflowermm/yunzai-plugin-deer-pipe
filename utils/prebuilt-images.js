import { readFileSync } from 'node:fs';
import { FileUtils } from '../../../lib/utils/file-utils.js';
import hub from '../lib/deer-hub.js';
import { SKIN_DEFAULT } from '../constants/skins.js';
import { HELP_PAGES } from '../constants/help-catalog.js';
import { isExtraDeerId } from '../constants/extra-deer.js';
import {
    PREBUILT_REL,
    prebuiltAbsPath,
    prebuiltUiSkinId,
    weatherPrebuiltSlot,
} from '../constants/prebuilt-images.js';
import { generateHelpImages } from './help-render.js';
import { generateProfessionCatalogImage, generateProfessionCard } from './profession-render.js';
import { generateExtraDeerCatalogImage } from './extra-deer-render.js';
import { generateWeatherDetailImage } from './card-render.js';
import { resolveExtraDeerPortraitSkin } from './extra-deer.js';
import { shouldBypassPrebuiltForPortraitSkin } from './skin.js';

const bufferCache = new Map();

export function shouldUsePrebuilt() {
    if (process.env.DEER_PIPE_FORCE_LIVE_RENDER === '1') return false;
    return hub.getRenderConfig().prefer_prebuilt !== false;
}

/** 职业一览带当日互助快照时需 live 渲染顶栏 */
export function needsLiveProfessionCatalog(snapshot) {
    return !!(snapshot && !snapshot.professionRequired);
}

/** 非默认立绘皮肤时走 live（预渲染图为默认立绘） */
export function needsLiveProfessionCard(opts = {}) {
    if (needsLiveProfessionCatalog(opts.snapshot)) return true;
    return !!(opts.skinCtx && shouldBypassPrebuiltForPortraitSkin(opts.skinCtx));
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

function loadPrebuiltBundle(uiSkinId, relPaths) {
    if (!shouldUsePrebuilt()) return null;
    const bufs = [];
    for (const rel of relPaths) {
        const buf = loadPrebuiltForUi(uiSkinId, rel);
        if (!buf) return null;
        bufs.push(buf);
    }
    return bufs;
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
    const relPaths = HELP_PAGES.map((_, i) => PREBUILT_REL.helpPage(uiSkinId, i));
    const cached = loadPrebuiltBundle(uiSkinId, relPaths);
    if (cached) return cached;
    return generateHelpImages(opts);
}

export async function resolveProfessionCatalogImage(opts = {}) {
    if (needsLiveProfessionCatalog(opts.snapshot)) {
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
    if (needsLiveProfessionCard(opts)) {
        return generateProfessionCard(professionId, opts);
    }
    const uiSkinId = prebuiltUiSkinId(opts);
    const rel = isExtraDeerId(professionId)
        ? PREBUILT_REL.professionExtraCard(uiSkinId, professionId)
        : PREBUILT_REL.professionCard(uiSkinId, professionId);
    return resolvePrebuiltSkin(
        uiSkinId,
        rel,
        () => generateProfessionCard(professionId, opts),
    );
}

export async function resolveExtraDeerCatalogImage(opts = {}) {
    const uiSkinId = prebuiltUiSkinId(opts);
    const portraitSkin = resolveExtraDeerPortraitSkin(opts.date || new Date());
    const rel = PREBUILT_REL.extraDeerCatalog(uiSkinId, portraitSkin);
    return resolvePrebuiltSkin(
        uiSkinId,
        rel,
        () => generateExtraDeerCatalogImage(opts),
    );
}

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
