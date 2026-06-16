/**
 * 鹿管插件配置中心：加载、缓存 data/deer_pipe
 */
import fs from 'fs';
import yaml from 'yaml';
import { FileUtils } from '../../../lib/utils/file-utils.js';
import {
    DEER_PIPE_CONFIG_DIR,
    ensureAllConfigsSync,
    getConfigPath,
} from './config-paths.js';

export const DEFAULT_MAIN_CONFIG = {
    weather_broadcast: {
        enabled: true,
        mode: 'selected',
        group_ids: [],
        bless_broadcast: true,
        interval_ms: 500,
    },
    king_broadcast: {
        enabled: true,
        mode: 'selected',
        group_ids: [],
        interval_ms: 500,
        /** 与鹿王同批 0:00 推送职业重置提醒 */
        profession_reset: true,
    },
    render: {
        /** 优先读 assets/prebuilt/；false 或缺文件时实时渲染 */
        prefer_prebuilt: true,
    },
};

function readRaw(name, ext = 'yaml') {
    const p = getConfigPath(name, ext);
    if (!FileUtils.existsSync(p)) return null;
    const raw = fs.readFileSync(p, 'utf8');
    try {
        return yaml.parse(raw) || null;
    } catch {
        return null;
    }
}

function mergeMainConfig(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const wb = src.weather_broadcast && typeof src.weather_broadcast === 'object'
        ? src.weather_broadcast
        : {};
    const kb = src.king_broadcast && typeof src.king_broadcast === 'object'
        ? src.king_broadcast
        : {};
    const render = src.render && typeof src.render === 'object' ? src.render : {};
    return {
        ...DEFAULT_MAIN_CONFIG,
        ...src,
        weather_broadcast: {
            ...DEFAULT_MAIN_CONFIG.weather_broadcast,
            ...wb,
            group_ids: Array.isArray(wb.group_ids)
                ? wb.group_ids.map((id) => String(id).trim()).filter(Boolean)
                : [],
        },
        king_broadcast: {
            ...DEFAULT_MAIN_CONFIG.king_broadcast,
            ...kb,
            profession_reset: kb.profession_reset !== false,
            group_ids: Array.isArray(kb.group_ids)
                ? kb.group_ids.map((id) => String(id).trim()).filter(Boolean)
                : [],
        },
        render: {
            prefer_prebuilt: render.prefer_prebuilt !== false,
        },
    };
}

class DeerHub {
    constructor() {
        this._cache = mergeMainConfig(null);
        this._watchStarted = false;
        ensureAllConfigsSync();
        this.reload();
    }

    reload() {
        this._cache = mergeMainConfig(readRaw('config'));
        import('../utils/prebuilt-images.js')
            .then((m) => m.clearPrebuiltCache?.())
            .catch(() => {});
        return this._cache;
    }

    startWatch() {
        if (this._watchStarted) return;
        this._watchStarted = true;
        if (!FileUtils.existsSync(DEER_PIPE_CONFIG_DIR)) return;
        const filePath = getConfigPath('config');
        if (!FileUtils.existsSync(filePath)) return;
        fs.watchFile(filePath, { interval: 800 }, (curr, prev) => {
            if (curr.mtimeMs !== prev.mtimeMs) {
                this.reload();
                logger.info('[deer-pipe] 配置已热重载');
            }
        });
    }

    getConfig() {
        return this._cache;
    }

    getWeatherBroadcast() {
        return this._cache?.weather_broadcast || DEFAULT_MAIN_CONFIG.weather_broadcast;
    }

    getKingBroadcast() {
        return this._cache?.king_broadcast || DEFAULT_MAIN_CONFIG.king_broadcast;
    }

    getRenderConfig() {
        return this._cache?.render || DEFAULT_MAIN_CONFIG.render;
    }
}

const hub = new DeerHub();
export default hub;

/**
 * 解析天象播报目标群
 * @param {'schedule'|'bless'} scene
 */
export function resolveBroadcastGroupIds(scene = 'schedule') {
    const bc = hub.getWeatherBroadcast();
    if (scene === 'schedule' && !bc.enabled) return [];
    if (scene === 'bless' && !bc.bless_broadcast) return [];
    if (bc.mode === 'all') {
        return Bot.gl ? [...Bot.gl.keys()].map(String) : [];
    }
    return (bc.group_ids || []).map(String).filter(Boolean);
}

/** 日度鹿王 / 职业重置 0:00 群播目标；未配置 group_ids 时回落到天象播报群 */
export function resolveKingBroadcastGroupIds() {
    const bc = hub.getKingBroadcast();
    if (!bc.enabled) return [];
    if (bc.mode === 'all') {
        return Bot.gl ? [...Bot.gl.keys()].map(String) : [];
    }
    const ids = (bc.group_ids || []).map(String).filter(Boolean);
    if (ids.length) return ids;
    const weather = hub.getWeatherBroadcast();
    if (weather.mode === 'all') {
        return Bot.gl ? [...Bot.gl.keys()].map(String) : [];
    }
    return (weather.group_ids || []).map(String).filter(Boolean);
}

export function sleepMs(ms) {
    const n = Number(ms) || 0;
    if (n <= 0) return Promise.resolve();
    return new Promise((resolve) => { setTimeout(resolve, n); });
}
