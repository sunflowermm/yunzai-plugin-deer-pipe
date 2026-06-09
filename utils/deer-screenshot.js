/**
 * 鹿管截图：统一走 XRK-Yunzai RendererLoader（与排行榜/好友等 HTML 模板一致）
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import RendererLoader from '../../../lib/renderer/loader.js';
import { DEER_FONT } from '../constants/core.js';

/** 用户触发类截图：低精度、快出图 */
export const DEER_SHOT_FAST = Object.freeze({
    deviceScaleFactor: 1,
    waitUntil: 'domcontentloaded',
    imageWaitTimeout: 300,
    fontWaitTimeout: 400,
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

/** 本地 Genshin 字体 file://，供 HTML 模板 @font-face */
export function getDeerFontFileUrl() {
    return pathToFileURL(path.resolve(DEER_FONT)).href;
}

/**
 * HTML 模板截图（art-template 数据同 puppeteer.screenshot）
 * @returns {Promise<import('segment').image|false|null>}
 */
export async function screenshot(saveId, data = {}, options = {}) {
    const renderer = getRenderer();
    if (!renderer?.render) return false;
    const shot = {
        ...DEER_SHOT_FAST,
        ...data,
        ...options,
    };
    if (shot.tplFile && !path.isAbsolute(shot.tplFile)) {
        shot.tplFile = path.resolve(process.cwd(), shot.tplFile);
    }
    try {
        const raw = await renderer.render(saveId, shot);
        const buf = toImageBuffer(raw);
        return buf ? segment.image(buf) : false;
    } catch (err) {
        logger?.error?.(`[deer-pipe] 截图失败 ${saveId}: ${err.message}`);
        return false;
    }
}
