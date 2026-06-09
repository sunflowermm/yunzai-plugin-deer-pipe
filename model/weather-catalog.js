import Base from './base.js';
import { WEATHER_CMD_HINT } from '../constants/commands.js';
import { WEATHER_CATALOG, WEATHER_IDS } from '../constants/weather.js';

export default class WeatherCatalog extends Base {
    constructor(e) {
        super(e);
        this.model = 'weather-catalog';
    }

    getData(currentWeatherId = null) {
        const rows = WEATHER_IDS.map((id) => {
            const def = WEATHER_CATALOG[id];
            return {
                id,
                name: def.name,
                emoji: def.emoji,
                weight: def.weight,
                tip: def.tip,
                active: id === currentWeatherId,
            };
        });
        return {
            ...this.screenData,
            saveId: `weather-catalog-${currentWeatherId || 'none'}`,
            title: '天象一览 · 鹿林八象',
            subtitle: `00:00 / 12:00 换场 · 查本场「${WEATHER_CMD_HINT}」`,
            rows,
            footer1: '晴/鹿虹偏吉 · 阴霾/雷暴偏凶',
            footer2: '细雨偷鹿狂 · 换场见分晓',
        };
    }
}
