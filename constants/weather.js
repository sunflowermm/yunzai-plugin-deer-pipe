/** 鹿林天象：每 12 小时（00:00 / 12:00）切换，全局一条 Redis 状态 */

export const WEATHER_IDS = [
    'sunny',
    'drizzle',
    'snow',
    'storm',
    'fog',
    'breeze',
    'gloom',
    'rainbow',
];

/** @typedef {object} WeatherEffects
 * @property {number} deathDelta 超限自🦌鹿死加减
 * @property {number} safeBonus 安全区额外次数
 * @property {number} stealDelta 偷鹿成功率加减
 * @property {number} stealBackfireDelta 偷鹿反噬区间加减（负=少反噬）
 * @property {number} helpFailDelta 帮🦌误伤/拉下马/救活失手
 * @property {number} helpWithdrawFailDelta 帮戒失手
 * @property {number} reviveFailDelta 仅救活分支额外失手（叠 helpFailDelta）
 * @property {number} bumperWinDelta 碰瓷胜率
 * @property {number} greedSuccessDelta 倒贴成功率
 * @property {number} howlBonusDelta 鹿鸣吉兆
 * @property {number} howlTrapDelta 鹿鸣反噬
 * @property {number} splashCurseDelta 群溅叠咒概率
 * @property {number} splashDamageBonus 群溅基础伤害 +N
 * @property {number} lotteryLuckDelta 鹿签气运（正=偏吉）
 * @property {number} curseExtraChance 鹿咒额外 +1 层概率
 */
/** @typedef {WeatherEffects & { id: string, name: string, emoji: string, weight: number, tip: string, announce: string[] }} WeatherDef */

/** @type {Record<string, WeatherDef>} */
export const WEATHER_CATALOG = {
    sunny: {
        id: 'sunny',
        name: '晴朗',
        emoji: '☀️',
        weight: 18,
        deathDelta: -0.03,
        safeBonus: 0,
        stealDelta: 0,
        stealBackfireDelta: -0.04,
        helpFailDelta: -0.04,
        helpWithdrawFailDelta: -0.03,
        reviveFailDelta: -0.03,
        bumperWinDelta: 0.05,
        greedSuccessDelta: 0.05,
        howlBonusDelta: 0.04,
        howlTrapDelta: -0.02,
        splashCurseDelta: -0.05,
        splashDamageBonus: 0,
        lotteryLuckDelta: 0.06,
        curseExtraChance: 0,
        tip: '晴空：鹿死/误伤略降 · 碰瓷/倒贴/鹿签小吉 · 偷鹿反噬减轻',
        announce: ['鹿林晴朗，卷王也请系好安全带', '今日阳气足，阎王爷下班早'],
    },
    drizzle: {
        id: 'drizzle',
        name: '细雨',
        emoji: '🌧️',
        weight: 14,
        deathDelta: 0.04,
        safeBonus: 0,
        stealDelta: 0.18,
        stealBackfireDelta: -0.08,
        helpFailDelta: 0.02,
        helpWithdrawFailDelta: 0,
        reviveFailDelta: 0,
        bumperWinDelta: -0.05,
        greedSuccessDelta: 0.08,
        howlBonusDelta: 0,
        howlTrapDelta: 0.03,
        splashCurseDelta: 0.05,
        splashDamageBonus: 0,
        lotteryLuckDelta: 0,
        curseExtraChance: 0.08,
        tip: '细雨藏刀：偷鹿 +18% · 反噬 -8% · 自🦌 +4% · 倒贴 +8%',
        announce: ['细雨润物，神偷出门记得带伞', '鹿林小雨，顺手牵羊成功率暴涨'],
    },
    snow: {
        id: 'snow',
        name: '瑞雪',
        emoji: '❄️',
        weight: 12,
        deathDelta: -0.08,
        safeBonus: 1,
        stealDelta: -0.06,
        stealBackfireDelta: 0,
        helpFailDelta: -0.08,
        helpWithdrawFailDelta: -0.08,
        reviveFailDelta: -0.10,
        bumperWinDelta: -0.08,
        greedSuccessDelta: -0.10,
        howlBonusDelta: 0.08,
        howlTrapDelta: -0.05,
        splashCurseDelta: -0.10,
        splashDamageBonus: -1,
        lotteryLuckDelta: 0.05,
        curseExtraChance: -0.15,
        tip: '瑞雪护体：鹿死 -8% · 安全+1 · 帮🦌/帮戒/救活大减伤 · 群溅伤害-1',
        announce: ['瑞雪封魔，今日阎王爷也打滑', '雪花落地，全员印堂发银光'],
    },
    storm: {
        id: 'storm',
        name: '雷暴',
        emoji: '⛈️',
        weight: 12,
        deathDelta: 0.12,
        safeBonus: -1,
        stealDelta: -0.12,
        stealBackfireDelta: 0.10,
        helpFailDelta: 0.08,
        helpWithdrawFailDelta: 0.06,
        reviveFailDelta: 0.05,
        bumperWinDelta: -0.12,
        greedSuccessDelta: -0.15,
        howlBonusDelta: -0.04,
        howlTrapDelta: 0.10,
        splashCurseDelta: 0.12,
        splashDamageBonus: 1,
        lotteryLuckDelta: -0.12,
        curseExtraChance: 0.20,
        tip: '雷暴诛邪：鹿死 +12% · 安全-1 · 群溅+1伤叠咒+12% · 鹿鸣反噬+10%',
        announce: ['雷暴预警！高危区请系好裤腰带', '天雷滚滚，手贱🦌者当场火化'],
    },
    fog: {
        id: 'fog',
        name: '鹿雾',
        emoji: '🌫️',
        weight: 14,
        deathDelta: 0.06,
        safeBonus: 0,
        stealDelta: -0.15,
        stealBackfireDelta: 0.06,
        helpFailDelta: 0.04,
        helpWithdrawFailDelta: 0.04,
        reviveFailDelta: 0.03,
        bumperWinDelta: -0.12,
        greedSuccessDelta: -0.18,
        howlBonusDelta: 0.02,
        howlTrapDelta: 0.06,
        splashCurseDelta: 0.08,
        splashDamageBonus: 0,
        lotteryLuckDelta: -0.06,
        curseExtraChance: 0.10,
        tip: '鹿雾迷踪：偷鹿/碰瓷/倒贴大减 · 自🦌 +6% · 误伤 +4%',
        announce: ['鹿雾锁林，伸手不见五指', '雾里🦌，雾里卷，碰瓷倒贴全瞎'],
    },
    breeze: {
        id: 'breeze',
        name: '祥风',
        emoji: '🍃',
        weight: 14,
        deathDelta: -0.06,
        safeBonus: 2,
        stealDelta: 0.06,
        stealBackfireDelta: -0.05,
        helpFailDelta: -0.05,
        helpWithdrawFailDelta: -0.05,
        reviveFailDelta: -0.06,
        bumperWinDelta: 0.10,
        greedSuccessDelta: 0.10,
        howlBonusDelta: 0.10,
        howlTrapDelta: -0.04,
        splashCurseDelta: -0.08,
        splashDamageBonus: 0,
        lotteryLuckDelta: 0.10,
        curseExtraChance: -0.10,
        tip: '祥风扩容：安全 +2 · 鹿死 -6% · 碰瓷/倒贴/鹿鸣/鹿签全面加成',
        announce: ['祥风过境，今日多两次养生额度', '好风凭借力，碰瓷也能赢'],
    },
    gloom: {
        id: 'gloom',
        name: '阴霾',
        emoji: '🌑',
        weight: 12,
        deathDelta: 0.10,
        safeBonus: 0,
        stealDelta: 0.04,
        stealBackfireDelta: 0.08,
        helpFailDelta: 0.10,
        helpWithdrawFailDelta: 0.10,
        reviveFailDelta: 0.08,
        bumperWinDelta: 0.06,
        greedSuccessDelta: -0.08,
        howlBonusDelta: -0.06,
        howlTrapDelta: 0.08,
        splashCurseDelta: 0.18,
        splashDamageBonus: 0,
        lotteryLuckDelta: -0.12,
        curseExtraChance: 0.25,
        tip: '阴霾噬运：鹿死/误伤 +10% · 溅射叠咒 +18% · 鹿咒额外层 +25%',
        announce: ['阴霾不散，全员印堂发黑', '今日不宜逞强，宜躺平摸鱼'],
    },
    rainbow: {
        id: 'rainbow',
        name: '鹿虹',
        emoji: '🌈',
        weight: 4,
        deathDelta: -0.12,
        safeBonus: 1,
        stealDelta: 0.10,
        stealBackfireDelta: -0.10,
        helpFailDelta: -0.10,
        helpWithdrawFailDelta: -0.08,
        reviveFailDelta: -0.12,
        bumperWinDelta: 0.15,
        greedSuccessDelta: 0.18,
        howlBonusDelta: 0.12,
        howlTrapDelta: -0.08,
        splashCurseDelta: -0.12,
        splashDamageBonus: 0,
        lotteryLuckDelta: 0.18,
        curseExtraChance: -0.20,
        tip: '鹿虹大吉：全面减伤+1安全 · 碰瓷/倒贴/偷鹿/鹿签大运 · 叠咒概率大降',
        announce: ['鹿虹贯日！今日欧皇附体', '彩虹挂在鹿林上，阎王爷带薪休假'],
    },
};

export const WEATHER_EFFECT_KEYS = [
    'deathDelta',
    'safeBonus',
    'stealDelta',
    'stealBackfireDelta',
    'helpFailDelta',
    'helpWithdrawFailDelta',
    'reviveFailDelta',
    'bumperWinDelta',
    'greedSuccessDelta',
    'howlBonusDelta',
    'howlTrapDelta',
    'splashCurseDelta',
    'splashDamageBonus',
    'lotteryLuckDelta',
    'curseExtraChance',
];

export const WEATHER_ALIAS = {
    晴: 'sunny',
    晴朗: 'sunny',
    雨: 'drizzle',
    细雨: 'drizzle',
    雪: 'snow',
    瑞雪: 'snow',
    雷: 'storm',
    雷暴: 'storm',
    雾: 'fog',
    鹿雾: 'fog',
    风: 'breeze',
    祥风: 'breeze',
    阴: 'gloom',
    阴霾: 'gloom',
    虹: 'rainbow',
    鹿虹: 'rainbow',
};

export function resolveWeatherId(token) {
    const t = String(token ?? '').trim();
    if (!t) return null;
    if (WEATHER_CATALOG[t]) return t;
    return WEATHER_ALIAS[t] ?? null;
}

export function pickRandomWeatherId() {
    const pool = WEATHER_IDS.map((id) => {
        const w = WEATHER_CATALOG[id];
        return { id, weight: w?.weight ?? 1 };
    });
    const total = pool.reduce((s, p) => s + p.weight, 0);
    let roll = Math.random() * total;
    for (const p of pool) {
        roll -= p.weight;
        if (roll <= 0) return p.id;
    }
    return 'sunny';
}

export function formatWeatherDateKey(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** 半天场次：00:00–11:59 为 am，12:00–23:59 为 pm */
export function formatWeatherPeriodKey(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    const slot = d.getHours() < 12 ? 'am' : 'pm';
    return `${formatWeatherDateKey(d)}:${slot}`;
}

export function formatWeatherPeriodLabel(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    return d.getHours() < 12 ? '上午场' : '下午场';
}

export function parseWeatherPeriodSlot(periodKey) {
    const slot = String(periodKey ?? '').split(':').pop();
    return slot === 'pm' ? '下午场' : '上午场';
}

/** 天象详情卡配色（按 weatherId 区分背景/强调色） */
export const WEATHER_CARD_THEMES = {
    sunny: {
        bgStops: '<stop offset="0%" style="stop-color:#fff9e6"/><stop offset="100%" style="stop-color:#ffe8a3"/>',
        title: '#7a4a00', sub: '#9a6a10', line: '#3d2810', muted: '#8b6914', accent: '#f6ad55',
        panel: 'rgba(255,255,255,0.78)', highlight: 'rgba(246,173,85,0.22)', barBg: 'rgba(255,255,255,0.5)',
    },
    drizzle: {
        bgStops: '<stop offset="0%" style="stop-color:#e8f4ff"/><stop offset="100%" style="stop-color:#b8d4f0"/>',
        title: '#1a3a5c', sub: '#2c5282', line: '#1a202c', muted: '#4a5568', accent: '#4299e1',
        panel: 'rgba(255,255,255,0.75)', highlight: 'rgba(66,153,225,0.2)', barBg: 'rgba(255,255,255,0.45)',
    },
    snow: {
        bgStops: '<stop offset="0%" style="stop-color:#f0f8ff"/><stop offset="100%" style="stop-color:#c8e0f8"/>',
        title: '#1a365d', sub: '#2b6cb0', line: '#1a202c', muted: '#4a6fa5', accent: '#90cdf4',
        panel: 'rgba(255,255,255,0.82)', highlight: 'rgba(144,205,244,0.25)', barBg: 'rgba(255,255,255,0.55)',
    },
    storm: {
        bgStops: '<stop offset="0%" style="stop-color:#2d1b4e"/><stop offset="55%" style="stop-color:#1a1035"/><stop offset="100%" style="stop-color:#0f0820"/>',
        title: '#f5ebff', sub: '#d4b8ff', line: '#faf5ff', muted: '#b794f4', accent: '#ffd700',
        panel: 'rgba(0,0,0,0.45)', highlight: 'rgba(255,215,0,0.15)', barBg: 'rgba(255,255,255,0.12)',
    },
    fog: {
        bgStops: '<stop offset="0%" style="stop-color:#e8e8ec"/><stop offset="100%" style="stop-color:#b8b8c8"/>',
        title: '#2d3748', sub: '#4a5568', line: '#1a202c', muted: '#718096', accent: '#a0aec0',
        panel: 'rgba(255,255,255,0.65)', highlight: 'rgba(160,174,192,0.25)', barBg: 'rgba(255,255,255,0.4)',
    },
    breeze: {
        bgStops: '<stop offset="0%" style="stop-color:#e6fffa"/><stop offset="100%" style="stop-color:#b2f5ea"/>',
        title: '#1a4731', sub: '#276749', line: '#1a202c', muted: '#38a169', accent: '#68d391',
        panel: 'rgba(255,255,255,0.72)', highlight: 'rgba(104,211,145,0.2)', barBg: 'rgba(255,255,255,0.45)',
    },
    gloom: {
        bgStops: '<stop offset="0%" style="stop-color:#1a1a2e"/><stop offset="100%" style="stop-color:#0f0f1a"/>',
        title: '#e8e8f0', sub: '#a0a0b8', line: '#f0f0f8', muted: '#8888a0', accent: '#805ad5',
        panel: 'rgba(0,0,0,0.5)', highlight: 'rgba(128,90,213,0.2)', barBg: 'rgba(255,255,255,0.1)',
    },
    rainbow: {
        bgStops: '<stop offset="0%" style="stop-color:#fff0f8"/><stop offset="35%" style="stop-color:#f0fff4"/><stop offset="70%" style="stop-color:#ebf8ff"/><stop offset="100%" style="stop-color:#faf5ff"/>',
        title: '#553c9a', sub: '#6b46c1', line: '#2d1b69', muted: '#805ad5', accent: '#ed64a6',
        panel: 'rgba(255,255,255,0.72)', highlight: 'rgba(237,100,166,0.18)', barBg: 'rgba(255,255,255,0.5)',
    },
};

export function resolveWeatherCardTheme(weatherId) {
    return WEATHER_CARD_THEMES[weatherId] || WEATHER_CARD_THEMES.sunny;
}

export function getWeatherEffects(weatherId) {
    const def = WEATHER_CATALOG[weatherId] || WEATHER_CATALOG.sunny;
    /** @type {WeatherEffects & { id: string, name: string, emoji: string, tip: string }} */
    const effects = {
        id: def.id,
        name: def.name,
        emoji: def.emoji,
        tip: def.tip,
    };
    for (const key of WEATHER_EFFECT_KEYS) {
        effects[key] = def[key] ?? 0;
    }
    return effects;
}
