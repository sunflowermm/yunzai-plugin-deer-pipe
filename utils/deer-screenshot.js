/**
 * 鹿管截图：统一走 XRK-Yunzai RendererLoader（与 runtime.render / TRSS 一致）
 * tplFile 必须保持相对路径，否则会跳过 art-template 编译。
 */
import path from 'node:path';
import RendererLoader from '../../../lib/renderer/loader.js';
import { DEER_FONT, getFontBase64DataUri } from '../constants/core.js';
/** 用户触发类截图：低精度、快出图 */
export const DEER_SHOT_FAST = Object.freeze({
    deviceScaleFactor: 1,
    waitUntil: 'domcontentloaded',
    imageWaitTimeout: 300,
    fontWaitTimeout: 800,
    delayBeforeScreenshot: 0,
    waitImages: true,
    waitFonts: true,
    imgType: 'jpeg',
    quality: 82,
    userTriggered: true,
    priority: true,
});

/** 从渲染器返回值取出 Buffer */
export function toImageBuffer(result) {
    if (result == null || result === false) return null;
    if (Array.isArray(result) && result.length > 0) return toImageBuffer(result[0]);
    if (Buffer.isBuffer(result)) return result;
    if (result?.type === 'image') {
        const file = result.file ?? result.data?.file;
        if (Buffer.isBuffer(file)) return file;
        if (typeof file === 'string' && file.length) return file;
    }
    if (result?.buffer != null && Buffer.isBuffer(result.buffer)) return result.buffer;
    try {
        const buf = Buffer.from(result);
        if (buf.length) return buf;
    } catch { /* ignore */ }
    return null;
}

export function getRenderer() {
    return RendererLoader.getRenderer?.() ?? global.RendererLoader?.getRenderer?.();
}

/** Puppeteer 字体 resourceRewrite（对齐 XRK-plugin 天气截图） */
export function buildDeerFontResourceRewrite() {
    const fontPath = path.resolve(DEER_FONT);
    return [
        { match: 'Genshin.ttf', toFile: fontPath, contentType: 'font/ttf' },
        { match: 'assets/Genshin.ttf', toFile: fontPath, contentType: 'font/ttf' },
    ];
}

function normalizeTplFile(tplFile) {
    if (!tplFile || typeof tplFile !== 'string') return tplFile;
    const normalized = tplFile.replace(/\\/g, '/');
    if (normalized.startsWith('./')) return normalized;
    const cwd = process.cwd().replace(/\\/g, '/');
    if (normalized.startsWith(cwd)) {
        return `.${normalized.slice(cwd.length)}`;
    }
    return `./${normalized.replace(/^\/+/, '')}`;
}

function ensureHtmlFontFields(shot) {
    if (!shot.assetFontUrl || String(shot.assetFontUrl).startsWith('file:')) {
        shot.assetFontUrl = getFontBase64DataUri();
    }
    const rewrites = buildDeerFontResourceRewrite();
    shot.resourceRewrite = [
        ...(Array.isArray(shot.resourceRewrite) ? shot.resourceRewrite : []),
        ...rewrites,
    ];
    return shot;
}

/**
 * HTML 模板截图（art-template 数据同 puppeteer.screenshot）
 * @param {string} name 模板缓存名（如 yunzai-plugin-deer-pipe/leaderboard/leaderboard）
 * @returns {Promise<import('segment').image|false|null>}
 */
export async function screenshot(name, data = {}, options = {}) {
    const renderer = getRenderer();
    const shotFn = renderer?.screenshot ?? renderer?.render;
    if (!shotFn) return false;

    const shot = ensureHtmlFontFields({
        ...DEER_SHOT_FAST,
        ...data,
        ...options,
    });
    if (shot.tplFile) {
        shot.tplFile = normalizeTplFile(shot.tplFile);
    }

    try {
        const raw = await shotFn.call(renderer, name, shot);
        const buf = toImageBuffer(raw);
        return buf ? segment.image(buf) : false;
    } catch (err) {
        logger?.error?.(`[deer-pipe] 截图失败 ${name}: ${err.message}`);
        return false;
    }
}
