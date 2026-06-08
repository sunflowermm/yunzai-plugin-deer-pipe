import { getWeatherContext } from './weather.js';

/** 加载当前半天场次天象，供 perform* 与鹿况使用 */
export async function loadGameContext(date = new Date()) {
    const { state, effects } = await getWeatherContext(date);
    return {
        weatherState: state,
        weatherEffects: effects,
    };
}
