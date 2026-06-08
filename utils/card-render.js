import {
    WEATHER_CATALOG,
    WEATHER_IDS,
    formatWeatherPeriodLabel,
    parseWeatherPeriodSlot,
} from '../constants/weather.js';
import { WEATHER_CMD_HINT } from '../constants/commands.js';
import { formatWeatherEffectsDetail } from './weather.js';
import { escapeXml, truncText, renderStyledCard, CARD_THEMES } from './svg-base.js';

const CARD_W = 700;
const TXT = 'filter="url(#txtShadow)" font-family="MiSans,sans-serif"';

function truncPlain(text, max = 16) {
    const s = String(text ?? '');
    return s.length > max ? `${s.slice(0, max)}…` : s;
}

function pct(n) {
    const v = Number(n) || 0;
    if (!v) return '0%';
    return `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`;
}

/** 天象八象图鉴 */
export async function generateWeatherCatalogImage(currentWeatherId = null) {
    const theme = CARD_THEMES.weather;
    const rowH = 54;
    const headerH = 118;
    const footerH = 40;
    const H = headerH + WEATHER_IDS.length * rowH + footerH;

    let rows = '';
    let y = headerH + 8;
    for (const id of WEATHER_IDS) {
        const def = WEATHER_CATALOG[id];
        const active = id === currentWeatherId;
        const bg = active ? theme.highlight : 'transparent';
        rows += `
            <rect x="16" y="${y - 22}" width="${CARD_W - 32}" height="${rowH - 6}" rx="10" fill="${bg}" stroke="${active ? theme.accent : 'transparent'}" stroke-width="2"/>
            <text ${TXT} x="28" y="${y}" font-size="22" fill="${theme.line}">${def.emoji}</text>
            <text ${TXT} x="62" y="${y}" font-size="17" fill="${theme.title}" font-weight="bold">${escapeXml(def.name)}${active ? ' · 当前' : ''}</text>
            <text ${TXT} x="160" y="${y}" font-size="13" fill="${theme.muted}">权重 ${def.weight}</text>
            <text ${TXT} x="28" y="${y + 20}" font-size="13" fill="${theme.sub}">${truncText(def.tip, 52)}</text>
        `;
        y += rowH;
    }

    const inner = `
        <rect width="${CARD_W}" height="${H}" rx="16" fill="url(#cardBg)"/>
        <rect x="12" y="12" width="${CARD_W - 24}" height="${H - 24}" rx="14" fill="none" stroke="${theme.accent}" stroke-width="2" stroke-dasharray="6 5"/>
        <text ${TXT} x="28" y="44" font-size="26" fill="${theme.title}" font-weight="bold">🌤 天象一览 · 鹿林八象</text>
        <text ${TXT} x="28" y="72" font-size="14" fill="${theme.muted}">00:00 / 12:00 换场 · 查本场「${escapeXml(WEATHER_CMD_HINT)}」</text>
        ${rows}
        <text ${TXT} x="${CARD_W / 2}" y="${H - 14}" font-size="12" fill="${theme.muted}" text-anchor="middle">晴/鹿虹偏吉 · 阴霾/雷暴偏凶 · 细雨偷鹿狂</text>
    `;
    return renderStyledCard(CARD_W, H, inner, 'weather');
}

/** 当前半天场次天象详情卡 */
export async function generateWeatherDetailImage(state, effects, date = new Date()) {
    const theme = CARD_THEMES.weather;
    const def = WEATHER_CATALOG[state?.weatherId] || WEATHER_CATALOG.sunny;
    const period = state?.periodKey
        ? parseWeatherPeriodSlot(state.periodKey)
        : formatWeatherPeriodLabel(date);
    const src = state?.source === 'admin'
        ? `鹿神赐福${state.adminBy ? ` · QQ ${state.adminBy}` : ''}`
        : '鹿林天象随机';

    const detailLines = formatWeatherEffectsDetail(effects).split('\n');
    let y = 200;
    let grid = '';
    for (const line of detailLines) {
        grid += `<text ${TXT} x="28" y="${y}" font-size="14" fill="${theme.line}">${escapeXml(line)}</text>`;
        y += 24;
    }
    const H = Math.max(360, y + 48);

    const inner = `
        <rect width="${CARD_W}" height="${H}" rx="16" fill="url(#cardBg)"/>
        <rect x="16" y="16" width="${CARD_W - 32}" height="88" rx="12" fill="${theme.panel}" stroke="${theme.accent}" stroke-width="1"/>
        <text x="48" y="58" font-size="42" font-family="MiSans,sans-serif">${def.emoji}</text>
        <text ${TXT} x="110" y="52" font-size="24" fill="${theme.title}" font-weight="bold">${escapeXml(period)} · ${escapeXml(def.name)}</text>
        <text ${TXT} x="110" y="78" font-size="14" fill="${theme.sub}">来源：${escapeXml(src)}</text>
        <text ${TXT} x="28" y="130" font-size="15" fill="${theme.line}" font-weight="bold">玩法修正</text>
        <text ${TXT} x="28" y="154" font-size="14" fill="${theme.muted}">${truncText(def.tip, 58)}</text>
        ${grid}
        <text ${TXT} x="28" y="${H - 20}" font-size="12" fill="${theme.muted}">安全区 ${effects.safeBonus >= 0 ? '+' : ''}${effects.safeBonus || 0} · 鹿死 ${pct(effects.deathDelta)}</text>
    `;
    return renderStyledCard(CARD_W, H, inner, 'weather');
}

const PLAYFUL_META = {
    steal_success: { emoji: '🥷', title: '偷鹿 · 得手', theme: 'steal' },
    steal_fail: { emoji: '🫥', title: '偷鹿 · 空手', theme: 'fail' },
    steal_backfire: { emoji: '💢', title: '偷鹿 · 反噬', theme: 'steal' },
    steal_curse_backfire: { emoji: '☠️', title: '偷鹿 · 咒反噬', theme: 'curse' },
    steal_curse_fail: { emoji: '🌀', title: '偷鹿 · 失手带咒', theme: 'curse' },
    curse: { emoji: '☠️', title: '鹿咒 · 叠层', theme: 'curse' },
    cleanse_curse: { emoji: '🧹', title: '解鹿咒', theme: 'bless' },
    bless: { emoji: '✨', title: '鹿福 · 贴福', theme: 'bless' },
    cleanse_bless: { emoji: '🌿', title: '解鹿福', theme: 'bless' },
    sacrifice: { emoji: '🔥', title: '献祭鹿', theme: 'mischief' },
    fake_withdraw: { emoji: '🎭', title: '诈戒 · 真香', theme: 'mischief' },
    urge: { emoji: '📣', title: '催鹿', theme: 'mischief' },
    howl: { emoji: '📯', title: '鹿鸣', theme: 'howl' },
    howl_dead: { emoji: '👻', title: '鹿鸣 · 亡魂', theme: 'howl' },
    howl_dead_haunt: { emoji: '⚰️', title: '鸣魂 · 索咒', theme: 'curse' },
    greed_success: { emoji: '💰', title: '倒贴 · 得手', theme: 'mischief' },
    greed_fail: { emoji: '📉', title: '倒贴 · 翻车', theme: 'fail' },
    group_splash: { emoji: '💦', title: '群鹿溅', theme: 'splash' },
    borrow: { emoji: '🤲', title: '借鹿', theme: 'mischief' },
    bumper_win: { emoji: '🚗', title: '碰瓷 · 胜', theme: 'mischief' },
    bumper_draw: { emoji: '🤕', title: '碰瓷 · 双输', theme: 'fail' },
    bumper_fail: { emoji: '🩹', title: '碰瓷 · 翻车', theme: 'fail' },
    lottery: { emoji: '🎋', title: '鹿签', theme: 'lottery' },
};

function resolvePlayfulMeta(type) {
    if (PLAYFUL_META[type]) return PLAYFUL_META[type];
    if (String(type).startsWith('steal')) return PLAYFUL_META.steal_fail;
    if (String(type).includes('curse') || String(type).includes('bless')) return PLAYFUL_META.curse;
    return { emoji: '😈', title: '恶趣味', theme: 'mischief' };
}

function buildPlayfulStatRows(result, { helperName, targetName } = {}) {
    const rows = [];
    const push = (label, value, color) => rows.push({ label, value, color });

    switch (result.type) {
        case 'steal_success':
        case 'steal_fail':
        case 'steal_backfire':
        case 'steal_curse_backfire':
        case 'steal_curse_fail':
            push('你', `${result.thiefCount ?? '?'} 次`, '#ff6b81');
            push('目标', `${result.targetCount ?? '?'} 次`, '#ffd700');
            push('偷鹿配额', `${result.stealUsed ?? '?'}/${result.stealLeft != null ? result.stealUsed + result.stealLeft : '?'}`, '#ccc');
            if (result.stealBonus > 0) push('借咒加成', `+${Math.round(result.stealBonus * 100)}%`, '#c39bff');
            break;
        case 'curse':
            push('咒层', `×${result.curseStacks}`, '#c39bff');
            push('回合', `${result.curseRounds}/${result.curseRounds != null ? 3 : '?'}`, '#e8d4ff');
            push('叠毒', `+${Math.round((result.bonus ?? 0.1) * (result.curseStacks ?? 1) * 100)}%`, '#ff8888');
            push('配额', `${result.curseUsed}/?`, '#ccc');
            if (result.ascended) push('状态', '⚡天咒', '#ffd700');
            break;
        case 'cleanse_curse':
            push('撕咒', `${result.clearedStacks} 层`, '#7dffb0');
            push('配额', `${result.cleanseUsed}/?`, '#ccc');
            break;
        case 'bless':
            push('福层', `×${result.blessStacks}`, '#7dffb0');
            push('回合', `${result.blessRounds}/?`, '#d8ffd8');
            push('配额', `${result.blessUsed}/?`, '#ccc');
            break;
        case 'cleanse_bless':
            push('收福', `${result.clearedStacks} 层`, '#7dffb0');
            break;
        case 'sacrifice':
        case 'greed_success':
        case 'borrow':
        case 'bumper_win':
        case 'bumper_draw':
            push('你', `${result.selfCount ?? '?'} 次`, '#e67e22');
            push('目标', `${result.targetCount ?? '?'} 次`, '#ffd700');
            break;
        case 'greed_fail':
        case 'bumper_fail':
            push('你', `${result.selfCount ?? '?'} 次`, '#888');
            break;
        case 'fake_withdraw':
            push('实际', `${result.count} 次`, '#e67e22');
            push('伪装', `≈${result.fakeCount} 次`, '#cc99ff');
            break;
        case 'urge':
            push('催更符', result.buffApplied ? '已贴' : '未生效', result.buffApplied ? '#68d391' : '#888');
            if (result.curseUrged) push('咒回合', `-1 → ${result.curseRounds}`, '#c39bff');
            break;
        case 'howl':
        case 'howl_dead':
        case 'howl_dead_haunt':
            push('次数', `${result.count ?? 0}`, '#68d391');
            push('配额', `${result.howlUsed}/?`, '#ccc');
            if (result.howlEffect) push('效果', result.howlEffect, '#ffd700');
            break;
        case 'group_splash':
            push('命中', `${result.totalHit ?? 0} 人`, '#38b2ac');
            push('伤害', `各 -${result.damage ?? 1}`, '#ff8888');
            push('反噬', `-${result.recoil ?? 1}`, '#888');
            push('叠咒', `${result.cursedCount ?? 0} 人`, '#c39bff');
            break;
        case 'lottery':
            push('结果', result.outcome || '?', '#f6c90e');
            push('现次', `${result.count ?? 0}`, '#e67e22');
            if (result.curseStacks > 0) push('自咒', `×${result.curseStacks}`, '#c39bff');
            break;
        default:
            if (result.count != null) push('次数', `${result.count}`, '#e67e22');
            break;
    }

    if (targetName && !['fake_withdraw', 'howl', 'howl_dead', 'howl_dead_haunt', 'lottery', 'group_splash'].includes(result.type)) {
        rows.unshift({ label: '对象', value: truncPlain(targetName, 10), color: '#ffd700' });
    }
    if (helperName) {
        rows.unshift({ label: '发起', value: truncPlain(helperName, 10), color: '#88c8ff' });
    }
    if (result.weatherTip) {
        rows.push({ label: '天象', value: truncPlain(result.weatherTip, 14), color: '#63b3ed' });
    }

    return rows;
}

/** 恶趣味 / 互动结果结构化卡片 */
export async function generatePlayfulCard({
    result,
    helperName,
    targetName,
    headline,
    extraLines = [],
}) {
    const meta = resolvePlayfulMeta(result?.type);
    const theme = CARD_THEMES[meta.theme] || CARD_THEMES.mischief;
    const rows = buildPlayfulStatRows(result, { helperName, targetName });

    const colW = Math.floor((CARD_W - 56) / 2);
    let statGrid = '';
    rows.forEach((row, i) => {
        const col = i % 2;
        const rowIdx = Math.floor(i / 2);
        const x = 28 + col * colW;
        const y = 118 + rowIdx * 36;
        statGrid += `<text ${TXT} x="${x}" y="${y}" font-size="14" fill="${theme.muted}">${escapeXml(row.label)}</text>`;
        statGrid += `<text ${TXT} x="${x + 52}" y="${y}" font-size="15" fill="${row.color || theme.line}" font-weight="bold">${escapeXml(String(row.value))}</text>`;
    });

    const statRows = Math.ceil(rows.length / 2);
    let y = 118 + statRows * 36 + 16;
    let extraBlock = '';
    for (const line of extraLines.slice(0, 6)) {
        extraBlock += `<text ${TXT} x="28" y="${y}" font-size="13" fill="${theme.sub}">· ${truncText(line, 48)}</text>`;
        y += 22;
    }

    if (headline) {
        extraBlock = `<text ${TXT} x="28" y="${y}" font-size="14" fill="${theme.line}">${truncText(headline, 56)}</text>${extraBlock}`;
        y += 26;
    }

    const H = Math.max(220, y + 36);

    const inner = `
        <rect width="${CARD_W}" height="${H}" rx="16" fill="url(#cardBg)"/>
        <rect x="16" y="16" width="${CARD_W - 32}" height="72" rx="12" fill="${theme.panel}" stroke="${theme.accent}" stroke-width="1"/>
        <text x="32" y="58" font-size="32" font-family="MiSans,sans-serif">${meta.emoji}</text>
        <text ${TXT} x="78" y="48" font-size="22" fill="${theme.title}" font-weight="bold">${escapeXml(meta.title)}</text>
        <text ${TXT} x="78" y="72" font-size="13" fill="${theme.muted}">${escapeXml(result?.type || 'action')}</text>
        ${statGrid}
        ${extraBlock}
    `;
    return renderStyledCard(CARD_W, H, inner, meta.theme);
}
