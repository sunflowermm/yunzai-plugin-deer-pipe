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

export function sleepMs(ms) {
    const n = Number(ms) || 0;
    if (n <= 0) return Promise.resolve();
    return new Promise((resolve) => { setTimeout(resolve, n); });
}
