import { REDIS_YUNZAI_DEER_PIPE_WEATHER } from '../constants/core.js';
import {
    WEATHER_CATALOG,
    formatWeatherPeriodKey,
    formatWeatherPeriodLabel,
    getWeatherEffects,
    parseWeatherPeriodSlot,
    pickRandomWeatherId,
    resolveWeatherId,
} from '../constants/weather.js';
import { pickRandom } from '../constants/game.js';
import { WEATHER_CMD_HINT } from '../constants/commands.js';
import hub, { resolveBroadcastGroupIds, sleepMs } from '../lib/deer-hub.js';

async function redisGetJson(key) {
    const raw = await redis.get(key);
    if (raw == null) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

async function redisSetJson(key, value) {
    await redis.set(key, JSON.stringify(value));
}

/** @typedef {{ periodKey: string, weatherId: string, source: 'roll'|'admin', adminBy?: string, updatedAt: number }} WeatherState */

export function createWeatherState(date = new Date(), weatherId, source = 'roll', adminBy = '') {
    return {
        periodKey: formatWeatherPeriodKey(date),
        weatherId: weatherId || pickRandomWeatherId(),
        source,
        adminBy: adminBy ? String(adminBy) : '',
        updatedAt: Date.now(),
    };
}

export async function loadWeatherState() {
    return (await redisGetJson(REDIS_YUNZAI_DEER_PIPE_WEATHER)) ?? null;
}

export async function saveWeatherState(state) {
    await redisSetJson(REDIS_YUNZAI_DEER_PIPE_WEATHER, state);
}

function isWeatherStateValid(state, periodKey) {
    return !!(
        state?.periodKey === periodKey
        && state.weatherId
        && WEATHER_CATALOG[state.weatherId]
    );
}

/** 确保当前半天场次天气存在（懒加载） */
export async function ensureCurrentWeather(date = new Date()) {
    const periodKey = formatWeatherPeriodKey(date);
    let state = await loadWeatherState();
    if (isWeatherStateValid(state, periodKey)) {
        return state;
    }
    state = createWeatherState(date, pickRandomWeatherId(), 'roll');
    await saveWeatherState(state);
    return state;
}

/** 定时任务：强制掷骰新天气（清管理员覆写） */
export async function rollPeriodWeather(date = new Date()) {
    const state = createWeatherState(date, pickRandomWeatherId(), 'roll');
    await saveWeatherState(state);
    return state;
}

/** 鹿神赐福：保持至下次 00:00/12:00 或再次赐福 */
export async function adminSetWeather(weatherId, adminId, date = new Date()) {
    const id = resolveWeatherId(weatherId) || weatherId;
    if (!WEATHER_CATALOG[id]) {
        return { ok: false, type: 'weather_unknown', token: weatherId };
    }
    const state = createWeatherState(date, id, 'admin', adminId);
    await saveWeatherState(state);
    return { ok: true, state, effects: getWeatherEffects(id) };
}

export function resolveWeatherContext(state) {
    if (!state?.weatherId) {
        return { state: null, effects: getWeatherEffects('sunny') };
    }
    return {
        state,
        effects: getWeatherEffects(state.weatherId),
    };
}

export async function getWeatherContext(date = new Date()) {
    const state = await ensureCurrentWeather(date);
    return resolveWeatherContext(state);
}

function pct(n) {
    const v = Number(n) || 0;
    if (!v) return '0%';
    return `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`;
}

export function formatWeatherEffectsDetail(effects) {
    const safeBonus = effects.safeBonus || 0;
    const splashDmg = effects.splashDamageBonus || 0;
    return [
        `鹿死 ${pct(effects.deathDelta)} · 安全区 ${safeBonus >= 0 ? '+' : ''}${safeBonus}`,
        `偷鹿 ${pct(effects.stealDelta)} · 反噬 ${pct(effects.stealBackfireDelta)}`,
        `帮🦌误伤 ${pct(effects.helpFailDelta)} · 帮戒失手 ${pct(effects.helpWithdrawFailDelta)} · 救活 ${pct(effects.reviveFailDelta)}`,
        `碰瓷 ${pct(effects.bumperWinDelta)} · 倒贴 ${pct(effects.greedSuccessDelta)}`,
        `鹿鸣吉兆 ${pct(effects.howlBonusDelta)} · 反噬 ${pct(effects.howlTrapDelta)}`,
        `群溅叠咒 ${pct(effects.splashCurseDelta)} · 溅伤 ${splashDmg >= 0 ? '+' : ''}${splashDmg}`,
        `鹿签 ${pct(effects.lotteryLuckDelta)} · 鹿咒额外层 ${pct(effects.curseExtraChance)}`,
    ].join('\n');
}

export function formatWeatherAnnouncement(state, date = new Date()) {
    const def = WEATHER_CATALOG[state?.weatherId] || WEATHER_CATALOG.sunny;
    const period = state?.periodKey
        ? parseWeatherPeriodSlot(state.periodKey)
        : formatWeatherPeriodLabel(date);
    const src = state?.source === 'admin' ? ' · 鹿神赐福' : '';
    const effects = getWeatherEffects(state?.weatherId);
    return [
        `${def.emoji} 【鹿林天象·${period}】${def.name}${src}`,
        pickRandom(def.announce) || def.tip,
        `效果：${def.tip}`,
        formatWeatherEffectsDetail(effects),
        `发送「${WEATHER_CMD_HINT}」查看详情`,
    ].join('\n');
}

export function formatWeatherBrief(state, date = new Date()) {
    const def = WEATHER_CATALOG[state?.weatherId] || WEATHER_CATALOG.sunny;
    const period = state?.periodKey
        ? parseWeatherPeriodSlot(state.periodKey)
        : formatWeatherPeriodLabel(date);
    const src = state?.source === 'admin' ? '（鹿神赐福）' : '';
    return `${def.emoji} ${period}${def.name}${src} · ${def.tip}`;
}

export async function broadcastWeatherNotice(text, { scene = 'schedule', skipGroupId = null } = {}) {
    let groups = resolveBroadcastGroupIds(scene);
    if (skipGroupId != null && skipGroupId !== '') {
        const skip = String(skipGroupId);
        groups = groups.filter((gid) => String(gid) !== skip);
    }
    if (!groups.length) {
        logger.debug(`[deer-pipe] 天象群播跳过（scene=${scene}，无目标群）`);
        return 0;
    }

    const interval = hub.getWeatherBroadcast()?.interval_ms ?? 0;
    let sent = 0;
    for (let i = 0; i < groups.length; i += 1) {
        const gid = groups[i];
        try {
            await Bot.pickGroup(gid).sendMsg(text);
            sent += 1;
        } catch (err) {
            logger.debug(`[deer-pipe] 天气播报 ${gid} 失败: ${err?.message || err}`);
        }
        if (i < groups.length - 1 && interval > 0) {
            await sleepMs(interval);
        }
    }
    return sent;
}
