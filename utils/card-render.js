import {
    WEATHER_CATALOG,
    WEATHER_IDS,
    formatWeatherPeriodLabel,
    parseWeatherPeriodSlot,
} from '../constants/weather.js';
import { WEATHER_CMD_HINT } from '../constants/commands.js';
import { formatWeatherEffectsDetail } from './weather.js';
import {
    ARENA_STAKE,
    DAILY_SAFE_LIMIT,
    IMPERIAL_LOSE_DEDUCT,
    IMPERIAL_WIN_DEDUCT,
    TOGETHER_FALL_COST,
    pickRandom,
} from '../constants/game.js';
import { CARD_FLAVOR } from '../constants/eco.js';
import {
    escapeXml,
    truncText,
    renderStyledCard,
    CARD_THEMES,
    fetchCircleAvatar,
    hashSeed,
    buildCardDecorations,
    buildVsBadge,
    buildRibbonBadge,
    buildStatChip,
    buildMiniBar,
    buildDuelSpark,
} from './svg-base.js';

const CARD_W = 700;
const TXT = 'filter="url(#txtShadow)" font-family="MiSans,sans-serif"';
const AVATAR_SIZE = 68;
const AVATAR_LEFT = 36;
const AVATAR_TOP = 28;

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
        ${buildCardDecorations(CARD_W, H, theme, hashSeed('weather-catalog'))}
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
    const flavor = pickRandom(CARD_FLAVOR.weather || CARD_FLAVOR.default);
    const inner = `
        <rect width="${CARD_W}" height="${H}" rx="16" fill="url(#cardBg)"/>
        ${buildCardDecorations(CARD_W, H, theme, hashSeed('weather-detail', state?.weatherId))}
        <rect x="16" y="16" width="${CARD_W - 32}" height="88" rx="12" fill="${theme.panel}" stroke="${theme.accent}" stroke-width="1"/>
        <text x="48" y="58" font-size="42" font-family="MiSans,sans-serif">${def.emoji}</text>
        <text ${TXT} x="110" y="52" font-size="24" fill="${theme.title}" font-weight="bold">${escapeXml(period)} · ${escapeXml(def.name)}</text>
        <text ${TXT} x="110" y="78" font-size="14" fill="${theme.sub}">来源：${escapeXml(src)}</text>
        <text ${TXT} x="28" y="130" font-size="15" fill="${theme.line}" font-weight="bold">玩法修正</text>
        <text ${TXT} x="28" y="154" font-size="14" fill="${theme.muted}">${truncText(def.tip, 58)}</text>
        ${grid}
        <rect x="20" y="${H - 44}" width="${CARD_W - 40}" height="24" rx="8" fill="${theme.highlight}" opacity="0.55"/>
        <text ${TXT} x="${CARD_W / 2}" y="${H - 26}" font-size="12" fill="${theme.muted}" text-anchor="middle" font-style="italic">${truncText(flavor, 48)}</text>
        <text ${TXT} x="28" y="${H - 8}" font-size="12" fill="${theme.muted}">安全区 ${effects.safeBonus >= 0 ? '+' : ''}${effects.safeBonus || 0} · 鹿死 ${pct(effects.deathDelta)}</text>
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
    arena_win_challenger: { emoji: '🏆', title: '擂台 · 挑战者胜', theme: 'pvp' },
    arena_win_target: { emoji: '🛡️', title: '擂台 · 应战者胜', theme: 'pvp' },
    arena_decline: { emoji: '🏳️', title: '擂台 · 拒战', theme: 'fail' },
    arena_invite: { emoji: '⚔️', title: '擂台战书', theme: 'pvp' },
    imperial_win: { emoji: '👑', title: '皇城鹿 · 胜', theme: 'pvp' },
    imperial_lose: { emoji: '😵', title: '皇城鹿 · 败', theme: 'fail' },
    imperial_invite: { emoji: '🏰', title: '皇城宣战', theme: 'pvp' },
    together_fall: { emoji: '💔', title: '同归鹿尽', theme: 'pvp' },
    help: { emoji: '🤝', title: '帮🦌成功', theme: 'help' },
    help_kill: { emoji: '💀', title: '帮🦌误伤', theme: 'fail' },
    help_pull: { emoji: '📉', title: '拉下马', theme: 'pvp' },
    help_miss: { emoji: '🫥', title: '帮🦌失手', theme: 'fail' },
    help_revive_fail: { emoji: '⚰️', title: '救活失手', theme: 'fail' },
    revive: { emoji: '💚', title: '救活成功', theme: 'help' },
    help_withdraw: { emoji: '📘', title: '帮戒成功', theme: 'help' },
    help_withdraw_fail: { emoji: '😅', title: '帮戒失手', theme: 'fail' },
    spectral_curse: { emoji: '👻', title: '冥咒', theme: 'curse' },
    vengeance_curse: { emoji: '⚡', title: '索命 · 叠咒', theme: 'curse' },
    vengeance_deduct: { emoji: '⚔️', title: '索命 · 扣次', theme: 'pvp' },
    vengeance_substitute: { emoji: '🎭', title: '索命 · 替身', theme: 'curse' },
    dream: { emoji: '💤', title: '托梦', theme: 'howl' },
};

const DUEL_TYPES = new Set([
    'arena_win_challenger', 'arena_win_target', 'arena_decline', 'arena_invite',
    'imperial_win', 'imperial_lose', 'imperial_invite',
    'together_fall', 'help', 'help_kill', 'help_pull', 'help_miss', 'help_revive_fail', 'revive',
    'help_withdraw', 'help_withdraw_fail',
    'steal_success', 'steal_fail', 'steal_backfire', 'steal_curse_backfire', 'steal_curse_fail',
    'curse', 'cleanse_curse', 'bless', 'cleanse_bless',
    'sacrifice', 'borrow', 'bumper_win', 'bumper_draw', 'bumper_fail', 'greed_success', 'greed_fail',
    'spectral_curse', 'vengeance_curse', 'vengeance_deduct', 'vengeance_substitute', 'dream',
]);

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
        case 'arena_win_challenger':
        case 'arena_win_target':
            push('挑战者', `${result.challengerCount ?? '?'} 次`, '#ff7043');
            push('应战者', `${result.targetCount ?? '?'} 次`, '#ffd700');
            push('赌注', `±${result.stake ?? ARENA_STAKE}`, '#ffcc88');
            push('胜者', result.challengerWins ? '挑战方' : '应战方', '#7dffb0');
            break;
        case 'arena_decline':
            push('拒战者', `${result.count ?? '?'} 次`, '#888');
            push('懦夫税', `-${result.penalty ?? 1}`, '#ff8888');
            break;
        case 'arena_invite':
            push('规则', `±${ARENA_STAKE}`, '#ff7043');
            push('胜负', '50% 掷硬币', '#ccc');
            break;
        case 'imperial_win':
            push('你', `${result.challengerCount ?? '?'} 次`, '#ffd700');
            push('鹿王', `${result.kingCount ?? '?'} 次`, '#ff7043');
            push('鹿王扣', `-${result.deduct ?? IMPERIAL_WIN_DEDUCT}`, '#ff8888');
            break;
        case 'imperial_lose':
            push('你', `${result.challengerCount ?? '?'} 次`, '#888');
            push('鹿王', `${result.kingCount ?? '?'} 次`, '#ffd700');
            push('你扣', `-${result.deduct ?? IMPERIAL_LOSE_DEDUCT}`, '#ff8888');
            if (result.kingBonus) push('守擂奖', `+${result.kingBonus}`, '#7dffb0');
            break;
        case 'imperial_invite':
            push('鹿王', `${result.kingCount ?? '?'} 次`, '#ffd700');
            push('赢扣', `-${IMPERIAL_WIN_DEDUCT}`, '#ff8888');
            push('输扣', `-${IMPERIAL_LOSE_DEDUCT}`, '#888');
            break;
        case 'together_fall':
            push('你', `${result.selfCount ?? '?'} 次`, '#e67e22');
            push('对方', `${result.targetCount ?? '?'} 次`, '#ffd700');
            push('各扣', `-${result.cost ?? TOGETHER_FALL_COST}`, '#ff8888');
            break;
        case 'help':
        case 'help_kill':
        case 'help_pull':
        case 'help_miss':
        case 'help_revive_fail':
        case 'revive':
            push('目标', `${result.count ?? result.snap ?? '?'} 次`, '#5dade2');
            if (result.snap != null && result.type !== 'revive') push('丢失', `${result.snap}`, '#ff8888');
            break;
        case 'help_withdraw':
        case 'help_withdraw_fail':
            push('目标', `${result.count ?? '?'} 次`, '#3498db');
            break;
        case 'spectral_curse':
            push('咒层', `×${result.curseStacks}`, '#c39bff');
            push('回合', `${result.curseRounds}/?`, '#e8d4ff');
            break;
        case 'vengeance_curse':
        case 'vengeance_deduct':
        case 'vengeance_substitute':
            push('目标', `${result.targetCount ?? '?'} 次`, '#ffd700');
            if (result.curseStacks) push('咒层', `×${result.curseStacks}`, '#c39bff');
            break;
        case 'dream':
            push('效果', result.dreamEffect === 'soothe' ? '缓咒' : '催更', '#88c8ff');
            break;
        default:
            if (result.count != null) push('次数', `${result.count}`, '#e67e22');
            break;
    }

    if (targetName && !DUEL_TYPES.has(result.type) && !['fake_withdraw', 'howl', 'howl_dead', 'howl_dead_haunt', 'lottery', 'group_splash'].includes(result.type)) {
        rows.unshift({ label: '对象', value: truncPlain(targetName, 10), color: '#ffd700' });
    }
    if (helperName && !DUEL_TYPES.has(result.type)) {
        rows.unshift({ label: '发起', value: truncPlain(helperName, 10), color: '#88c8ff' });
    }
    if (result.weatherTip) {
        rows.push({ label: '天象', value: truncPlain(result.weatherTip, 14), color: '#63b3ed' });
    }

    return rows;
}

function pickCardFlavor(type) {
    const pool = CARD_FLAVOR[type] || CARD_FLAVOR.default;
    return pickRandom(pool);
}

function resolveOutcomeBadge(type) {
    const map = {
        steal_success: ['得手', 'win'],
        steal_fail: ['扑空', 'fail'],
        steal_backfire: ['反噬', 'fail'],
        steal_curse_backfire: ['咒反', 'curse'],
        curse: ['下咒', 'curse'],
        bless: ['贴福', 'win'],
        cleanse_curse: ['解咒', 'neutral'],
        cleanse_bless: ['收福', 'neutral'],
        borrow: ['周转', 'win'],
        sacrifice: ['献祭', 'neutral'],
        bumper_win: ['碰瓷胜', 'win'],
        bumper_draw: ['双输', 'fail'],
        bumper_fail: ['翻车', 'fail'],
        greed_success: ['倒贴胜', 'win'],
        greed_fail: ['倒贴败', 'fail'],
        fake_withdraw: ['真香', 'neutral'],
        arena_win_challenger: ['挑战胜', 'win'],
        arena_win_target: ['守擂胜', 'win'],
        arena_decline: ['拒战', 'fail'],
        arena_invite: ['约战', 'invite'],
        imperial_win: ['夺位', 'win'],
        imperial_lose: ['败北', 'lose'],
        imperial_invite: ['宣战', 'invite'],
        together_fall: ['同尽', 'fail'],
        help: ['帮🦌', 'win'],
        help_kill: ['误伤', 'fail'],
        help_pull: ['拉坠', 'fail'],
        revive: ['还阳', 'win'],
        help_withdraw: ['帮戒', 'neutral'],
        group_splash: ['溅射', 'neutral'],
        lottery: ['签运', 'neutral'],
        howl: ['鹿鸣', 'neutral'],
        howl_dead_haunt: ['鸣魂', 'curse'],
        vengeance_curse: ['索咒', 'curse'],
        vengeance_deduct: ['扣命', 'fail'],
        dream: ['托梦', 'neutral'],
    };
    return map[type] || null;
}

function resolveDuelWinner(result) {
    switch (result?.type) {
        case 'arena_win_challenger':
        case 'imperial_win':
        case 'steal_success':
        case 'greed_success':
        case 'bumper_win':
            return 'left';
        case 'arena_win_target':
        case 'imperial_lose':
            return 'right';
        default:
            return null;
    }
}

function parseCountRatio(value) {
    const m = String(value).match(/(-?\d+)/);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    return Math.min(1, Math.abs(n) / (DAILY_SAFE_LIMIT + 4));
}

function buildDuelHeaderSvg({ leftName, rightName, meta, theme, subtitle, winnerSide, outcomeBadge }) {
    const lx = AVATAR_LEFT + AVATAR_SIZE / 2;
    const rx = CARD_W - AVATAR_LEFT - AVATAR_SIZE / 2;
    const cy = AVATAR_TOP + AVATAR_SIZE / 2;
    const crown = (side) => (winnerSide === side
        ? `<text x="${side === 'left' ? lx : rx}" y="${AVATAR_TOP - 6}" font-size="20" font-family="MiSans,sans-serif" text-anchor="middle">👑</text>`
        : '');
    const badge = outcomeBadge
        ? buildRibbonBadge(CARD_W / 2, 8, outcomeBadge[0], outcomeBadge[1])
        : '';
    return `
        ${badge}
        <rect x="16" y="20" width="${CARD_W - 32}" height="100" rx="12" fill="${theme.panel}" stroke="${theme.accent}" stroke-width="1.5"/>
        ${buildDuelSpark(CARD_W / 2, cy, theme)}
        ${buildVsBadge(CARD_W / 2, cy, theme)}
        ${crown('left')}
        ${crown('right')}
        <circle cx="${lx}" cy="${cy}" r="${AVATAR_SIZE / 2 + 2}" fill="none" stroke="${winnerSide === 'left' ? '#ffd700' : theme.accent}" stroke-width="${winnerSide === 'left' ? 3 : 2}" opacity="0.9"/>
        <circle cx="${rx}" cy="${cy}" r="${AVATAR_SIZE / 2 + 2}" fill="none" stroke="${winnerSide === 'right' ? '#ffd700' : theme.accent}" stroke-width="${winnerSide === 'right' ? 3 : 2}" opacity="0.9"/>
        <text ${TXT} x="${lx}" y="${AVATAR_TOP + AVATAR_SIZE + 18}" font-size="12" fill="${theme.sub}" text-anchor="middle" font-weight="${winnerSide === 'left' ? 'bold' : 'normal'}">${truncPlain(leftName, 8)}</text>
        <text ${TXT} x="${rx}" y="${AVATAR_TOP + AVATAR_SIZE + 18}" font-size="12" fill="${theme.sub}" text-anchor="middle" font-weight="${winnerSide === 'right' ? 'bold' : 'normal'}">${truncPlain(rightName, 8)}</text>
        <text filter="url(#glow)" x="${CARD_W / 2}" y="${AVATAR_TOP + AVATAR_SIZE + 38}" font-size="14" font-family="MiSans,sans-serif" text-anchor="middle">${meta.emoji}</text>
        <text ${TXT} x="${CARD_W / 2}" y="${AVATAR_TOP + AVATAR_SIZE + 58}" font-size="16" fill="${theme.title}" text-anchor="middle" font-weight="bold">${escapeXml(meta.title)}</text>
        ${subtitle ? `<text ${TXT} x="${CARD_W / 2}" y="${AVATAR_TOP + AVATAR_SIZE + 76}" font-size="11" fill="${theme.muted}" text-anchor="middle">${truncText(subtitle, 42)}</text>` : ''}
    `;
}

function buildSimpleHeaderSvg({ meta, theme, typeLabel, outcomeBadge }) {
    const badge = outcomeBadge
        ? buildRibbonBadge(CARD_W - 56, 22, outcomeBadge[0], outcomeBadge[1])
        : '';
    return `
        ${badge}
        <rect x="16" y="16" width="${CARD_W - 32}" height="76" rx="12" fill="${theme.panel}" stroke="${theme.accent}" stroke-width="1.5"/>
        <text filter="url(#glow)" x="36" y="62" font-size="36" font-family="MiSans,sans-serif">${meta.emoji}</text>
        <text ${TXT} x="88" y="48" font-size="22" fill="${theme.title}" font-weight="bold">${escapeXml(meta.title)}</text>
        <text ${TXT} x="88" y="72" font-size="12" fill="${theme.muted}">${escapeXml(typeLabel)}</text>
    `;
}

async function buildAvatarOverlays(helperId, targetId, winnerSide = null) {
    const winRing = '#ffd700';
    const loseRing = 'rgba(100,100,100,0.65)';
    const leftRing = winnerSide === 'left' ? winRing : winnerSide === 'right' ? loseRing : null;
    const rightRing = winnerSide === 'right' ? winRing : winnerSide === 'left' ? loseRing : null;
    const [leftAvatar, rightAvatar] = await Promise.all([
        fetchCircleAvatar(helperId, AVATAR_SIZE, leftRing),
        fetchCircleAvatar(targetId, AVATAR_SIZE, rightRing),
    ]);
    const leftPad = leftRing ? 6 : 0;
    const rightPad = rightRing ? 6 : 0;
    const overlays = [];
    if (leftAvatar) overlays.push({ input: leftAvatar, top: AVATAR_TOP - leftPad + 2, left: AVATAR_LEFT - leftPad });
    if (rightAvatar) overlays.push({ input: rightAvatar, top: AVATAR_TOP - rightPad + 2, left: CARD_W - AVATAR_LEFT - AVATAR_SIZE - rightPad });
    return overlays;
}

function buildStatGrid(rows, theme, statsTop) {
    const colW = 168;
    const gapY = 44;
    let grid = '';
    rows.forEach((row, i) => {
        const col = i % 2;
        const rowIdx = Math.floor(i / 2);
        const x = 24 + col * (colW + 16);
        const y = statsTop + rowIdx * gapY;
        grid += buildStatChip(x, y, row.label, row.value, row.color || theme.line, theme);
        const ratio = parseCountRatio(row.value);
        if (ratio != null) {
            grid += buildMiniBar(x + 10, y + 18, 132, ratio, row.color || theme.accent);
        }
    });
    return grid;
}

/** 互动 / PK / 恶趣味 结构化卡片（可选双头像对决布局） */
export async function generateInteractionCard({
    result,
    helperName,
    targetName,
    helperId,
    targetId,
    headline,
    extraLines = [],
    duel = false,
    subtitle = '',
}) {
    const meta = resolvePlayfulMeta(result?.type);
    const theme = CARD_THEMES[meta.theme] || CARD_THEMES.mischief;
    const rows = buildPlayfulStatRows(result, { helperName, targetName });
    const isDuel = (duel || DUEL_TYPES.has(result?.type)) && helperId && targetId;
    const winnerSide = isDuel ? resolveDuelWinner(result) : null;
    const outcomeBadge = resolveOutcomeBadge(result?.type);
    const decoSeed = hashSeed(result?.type, helperId, targetId, headline);
    const statsTop = isDuel ? 148 : 112;
    const statGrid = buildStatGrid(rows, theme, statsTop);
    const statRows = Math.ceil(rows.length / 2);
    let y = statsTop + statRows * 44 + 12;
    let extraBlock = '';
    for (const line of extraLines.slice(0, 5)) {
        extraBlock += `<text ${TXT} x="28" y="${y}" font-size="13" fill="${theme.sub}">· ${truncText(line, 48)}</text>`;
        y += 22;
    }

    if (headline) {
        extraBlock = `<text ${TXT} x="28" y="${y}" font-size="14" fill="${theme.line}">${truncText(headline, 56)}</text>${extraBlock}`;
        y += 24;
    }

    const flavor = pickCardFlavor(result?.type);
    const footerY = Math.max(y + 8, (isDuel ? 280 : 240));
    const flavorBlock = `
        <rect x="20" y="${footerY - 8}" width="${CARD_W - 40}" height="28" rx="8" fill="${theme.highlight || theme.panel}" opacity="0.55"/>
        <text ${TXT} x="${CARD_W / 2}" y="${footerY + 10}" font-size="12" fill="${theme.muted}" text-anchor="middle" font-style="italic">${truncText(flavor, 52)}</text>
    `;
    const H = footerY + 36;
    const header = isDuel
        ? buildDuelHeaderSvg({ leftName: helperName, rightName: targetName, meta, theme, subtitle, winnerSide, outcomeBadge })
        : buildSimpleHeaderSvg({ meta, theme, typeLabel: result?.type || 'action', outcomeBadge });
    const inner = `
        <rect width="${CARD_W}" height="${H}" rx="16" fill="url(#cardBg)"/>
        ${buildCardDecorations(CARD_W, H, theme, decoSeed)}
        ${header}
        ${statGrid}
        ${extraBlock}
        ${flavorBlock}
    `;
    const overlays = isDuel ? await buildAvatarOverlays(helperId, targetId, winnerSide) : [];
    return renderStyledCard(CARD_W, H, inner, meta.theme, overlays);
}

/** @deprecated 别名，请用 generateInteractionCard */
export async function generatePlayfulCard(opts) {
    return generateInteractionCard(opts);
}
