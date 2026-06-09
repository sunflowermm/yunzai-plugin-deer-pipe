import {
    adminSetWeather,
    broadcastWeatherNotice,
    formatWeatherAnnouncement,
    formatWeatherBrief,
    formatWeatherEffectsDetail,
    getWeatherContext,
    rollPeriodWeather,
} from '../utils/weather.js';

import { WEATHER_CATALOG, resolveWeatherId } from '../constants/weather.js';

import { performBlessDeer, performCleanseBless } from '../utils/data.js';

import { canHelpFriend } from '../utils/friends.js';

import { ERROR_MESSAGES, pickRandom } from '../constants/game.js';
import { WEATHER_GOD_BLESS_FLAVOR } from '../constants/eco.js';
import { isDeerPrivileged } from '../utils/privilege.js';

import { formatActionMessage, formatErrorMessage } from '../utils/messages.js';

import { REG, cleanCommandMsg } from '../constants/commands.js';

import { getMemberName, resolveTargetId } from '../utils/plugin-common.js';
import { loadDeerData, loadFriends, saveDeerData } from '../utils/store.js';
import { resolveWeatherDetailImage } from '../utils/prebuilt-images.js';
import { screenshot, toImageBuffer } from '../utils/deer-screenshot.js';
import WeatherCatalog from '../model/weather-catalog.js';
import { replyWeatherCard, replyInteractionResult } from '../utils/panel.js';

export class DeerWeather extends plugin {
    constructor() {
        super({
            name: '🦌管天气',
            dsc: '鹿林天气播报/鹿福/鹿神赐福',
            event: 'message',
            priority: 5004,
            bypassThrottle: true,
            rule: [
                { reg: REG.weatherToday, fnc: 'weatherToday' },
                { reg: REG.weatherCatalog, fnc: 'weatherCatalog' },
                { reg: REG.deerGodBless, fnc: 'deerGodBless' },
                { reg: REG.blessDeer, fnc: 'blessDeer' },
                { reg: REG.cleanseBless, fnc: 'cleanseBless' },
            ],
        });
        this.task = [
            {
                name: '鹿林天象·上午场',
                cron: '0 0 0 * * *',
                fnc: () => this.publishPeriodWeather(),
                log: false,
            },
            {
                name: '鹿林天象·下午场',
                cron: '0 0 12 * * *',
                fnc: () => this.publishPeriodWeather(),
                log: false,
            },
        ];
    }

    async publishPeriodWeather() {
        try {
            const state = await rollPeriodWeather();
            const text = formatWeatherAnnouncement(state);
            const sent = await broadcastWeatherNotice(text);
            logger.info(`[deer-pipe] 天象播报 ${state.periodKey} · ${state.weatherId} · 群 ${sent}`);
        } catch (err) {
            logger.error(`[deer-pipe] 天气播报失败: ${err?.message || err}`);
        }
    }

    async weatherToday() {
        const date = new Date();
        const { state, effects } = await getWeatherContext(date);
        const img = await resolveWeatherDetailImage(state, effects, date);
        const caption = [
            formatWeatherBrief(state, date),
            pickRandom(WEATHER_CATALOG[state.weatherId]?.announce || []) || '',
        ].filter(Boolean).join('\n');
        await replyWeatherCard(this.e, { caption, imageBuffer: img });
    }

    async weatherCatalog() {
        const date = new Date();
        const { state } = await getWeatherContext(date);
        const data = new WeatherCatalog(this.e).getData(state?.weatherId);
        const shot = await screenshot('yunzai-plugin-deer-pipe/weather-catalog/weather-catalog', data);
        const brief = formatWeatherBrief(state, date);
        await replyWeatherCard(this.e, {
            caption: `📖 鹿林八象图鉴\n当前：${brief}`,
            imageBuffer: toImageBuffer(shot),
        });
    }

    async deerGodBless() {
        const { user_id } = this.e.sender;
        if (!isDeerPrivileged(user_id)) {
            await this.reply(ERROR_MESSAGES.weather_privilege_only, true);
            return;
        }

        const msg = cleanCommandMsg(this.e.msg).replace(/^鹿神赐福/, '').trim();
        let weatherId = resolveWeatherId(msg);
        if (!weatherId) {
            weatherId = pickRandom(Object.keys(WEATHER_CATALOG));
        }

        const result = await adminSetWeather(weatherId, user_id);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }

        const text = [
            '🙏 鹿神赐福已生效，天象改换直到下次赐福或 00:00/12:00 换场',
            formatWeatherBrief(result.state),
            `效果：${result.effects.tip}`,
            formatWeatherEffectsDetail(result.effects),
            pickRandom(WEATHER_GOD_BLESS_FLAVOR),
        ].filter(Boolean).join('\n');
        await this.reply(text, true);
        await broadcastWeatherNotice(text, {
            scene: 'bless',
            skipGroupId: this.e.isGroup ? this.e.group_id : null,
        });
    }

    async requireFriend(userId, targetId) {
        const friends = await loadFriends();
        if (!canHelpFriend(friends, userId, targetId)) {
            await this.reply(ERROR_MESSAGES.not_friend, true);
            return false;
        }

        return true;
    }

    async blessDeer() {
        const { user_id, card, nickname } = this.e.sender;
        const targetId = await resolveTargetId(this.e);
        if (!targetId) {
            await this.reply(ERROR_MESSAGES.no_target, true);
            return;
        }

        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performBlessDeer(deerData, user_id, targetId, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }

        await saveDeerData(deerData);
        const targetName = await getMemberName(this.e, targetId);
        const text = formatActionMessage(result, { helperName: card || nickname, targetName });
        await replyInteractionResult(this.e, {
            text,
            result,
            helperName: card || nickname,
            targetName,
            helperId: user_id,
            targetId,
            duel: true,
        });
    }

    async cleanseBless() {
        const { user_id, card, nickname } = this.e.sender;
        const targetId = await resolveTargetId(this.e);
        if (!targetId) {
            await this.reply(ERROR_MESSAGES.no_target, true);
            return;
        }

        if (!(await this.requireFriend(user_id, targetId))) return;
        const date = new Date();
        const day = date.getDate();
        const deerData = await loadDeerData();
        const result = performCleanseBless(deerData, user_id, targetId, date, day);
        if (!result.ok) {
            await this.reply(formatErrorMessage(result), true);
            return;
        }

        await saveDeerData(deerData);
        const targetName = await getMemberName(this.e, targetId);
        const text = formatActionMessage(result, { helperName: card || nickname, targetName });
        await replyInteractionResult(this.e, {
            text,
            result,
            helperName: card || nickname,
            targetName,
            helperId: user_id,
            targetId,
            duel: true,
        });
    }

}
