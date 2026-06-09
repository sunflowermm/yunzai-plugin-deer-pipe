import {
    WEATHER_CATALOG,
    formatWeatherPeriodLabel,
    parseWeatherPeriodSlot,
} from '../constants/weather.js';
import { WEATHER_CMD_HINT } from '../constants/commands.js';
import { buildWeatherEffectStatRows } from './weather.js';
import { buildCenteredEmojiTitleRaster } from './emoji-compose.js';
import {
    ARENA_STAKE,
    BLESS_MAX_ROUNDS,
    CURSE_MAX_ROUNDS,
    DAILY_BLESS_QUOTA,
    DAILY_CLEANSE_BLESS_QUOTA,
    DAILY_CLEANSE_CURSE_QUOTA,
    DAILY_CURSE_QUOTA,
    DAILY_HOWL_QUOTA,
    DAILY_SAFE_LIMIT,
    DAILY_STEAL_QUOTA,
    IMPERIAL_LOSE_DEDUCT,
    IMPERIAL_WIN_DEDUCT,
    TOGETHER_FALL_COST,
    pickRandom,
} from '../constants/game.js';
import { CARD_FLAVOR } from '../constants/eco.js';
import { resolveQuotaDenom } from '../constants/profession-quotas.js';
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
    buildDuelSpark,
    buildStatGrid,
    statGridRowCount,
    statGridHeight,
    buildFooterBar,
    buildCenteredPanel,
    buildMultilineText,
    textCentered,
    wrapTextLines,
    textCenteredEmoji,
    textEmoji,
    buildCenteredEmojiTitle,
    buildCenteredEmojiLine,
    parseDayCountRatio,
    DEFAULT_CARD_W,
    STAT_COLS,
    TXT,
    TXT_SOFT,
} from './svg-base.js';

const CARD_W = DEFAULT_CARD_W;
const CX = CARD_W / 2;
const AVATAR_SIZE = 68;
const AVATAR_LEFT = 36;
const AVATAR_TOP = 28;
const DUEL_PANEL_TOP = 28;
const DUEL_PANEL_H = 100;
const SIMPLE_HEADER_H = 80;
const STAT_GAP_Y = 48;
const TITLE_BELOW_PANEL = 28;
const STAT_CHIP_H = 34;

function pct(n) {
    const v = Number(n) || 0;
    if (!v) return '0%';
    return `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`;
}

function countRatio(value) {
    return parseDayCountRatio(value, DAILY_SAFE_LIMIT + 4);
}

function quotaDenom(result, usedKey, leftKey, maxKey, fallback) {
    return resolveQuotaDenom({
        used: result[usedKey],
        left: result[leftKey],
        max: result[maxKey],
        fallback,
    });
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

    const statRows = buildWeatherEffectStatRows(effects, theme);
    const TIP_PAD = 44;
    const tipLines = wrapTextLines(def.tip, CARD_W - TIP_PAD * 2, 13, 2);
    const tipTop = 96;
    const tipBottom = tipTop + tipLines.length * 18;
    const statsTitleY = tipBottom + 32;
    const statsTop = statsTitleY + 26;
    const statGapY = 44;
    const rowCount = statGridRowCount(statRows, STAT_COLS);
    const statsBottom = statsTop + statGridHeight(rowCount, statGapY, STAT_CHIP_H);
    const H = statsBottom + 64;
    const flavor = pickRandom(CARD_FLAVOR.weather || CARD_FLAVOR.default);
    const metaLine = `安全区 ${effects.safeBonus >= 0 ? '+' : ''}${effects.safeBonus || 0} · 鹿死 ${pct(effects.deathDelta)}`;

    const titleBlock = await buildCenteredEmojiTitleRaster(CX, 44, def.emoji, `${period} · ${def.name}`, {
        emojiSize: 32, titleSize: 22, style: TXT, fill: theme.title, weight: 'bold',
    });

    const tipText = buildMultilineText(TIP_PAD, tipTop, tipLines, {
        fontSize: 13,
        lineHeight: 18,
        fill: theme.line,
    });

    const inner = `
        <rect width="${CARD_W}" height="${H}" rx="16" fill="url(#cardBg)"/>
        ${buildCardDecorations(CARD_W, H, theme, hashSeed('weather-detail', state?.weatherId))}
        ${buildCenteredPanel(CX, 16, CARD_W - 32, 78, theme)}
        ${titleBlock.svg}
        ${textCentered(CX, 68, escapeXml(`来源：${src}`), TXT_SOFT, { size: 13, fill: theme.sub })}
        ${tipText}
        ${textCentered(CX, statsTitleY, '玩法', TXT, { size: 15, fill: theme.line, weight: 'bold' })}
        ${buildStatGrid(statRows, theme, statsTop, CARD_W, { cols: STAT_COLS, gapY: statGapY })}
        ${buildFooterBar(CARD_W, H - 20, `${flavor} · ${metaLine}`, theme, 56)}
    `;
    return renderStyledCard(CARD_W, H, inner, 'weather', titleBlock.overlays);
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
            push('偷鹿配额', `${result.stealUsed ?? '?'}/${quotaDenom(result, 'stealUsed', 'stealLeft', 'stealMax', DAILY_STEAL_QUOTA)}`, '#ccc');
            if (result.stealBonus > 0) push('借咒加成', `+${Math.round(result.stealBonus * 100)}%`, '#c39bff');
            break;
        case 'curse':
            push('咒层', `×${result.curseStacks}`, '#c39bff');
            push('回合', `${result.curseRounds}/${CURSE_MAX_ROUNDS}`, '#e8d4ff');
            push('叠毒', `+${Math.round((result.bonus ?? 0.1) * (result.curseStacks ?? 1) * 100)}%`, '#ff8888');
            push('配额', `${result.curseUsed}/${quotaDenom(result, 'curseUsed', 'curseLeft', 'curseMax', DAILY_CURSE_QUOTA)}`, '#ccc');
            if (result.ascended) push('状态', '⚡天咒', '#ffd700');
            break;
        case 'cleanse_curse':
            push('撕咒', `${result.clearedStacks} 层`, '#7dffb0');
            push('配额', `${result.cleanseUsed}/${quotaDenom(result, 'cleanseUsed', 'cleanseLeft', 'cleanseMax', DAILY_CLEANSE_CURSE_QUOTA)}`, '#ccc');
            break;
        case 'bless':
            push('福层', `×${result.blessStacks}`, '#7dffb0');
            push('回合', `${result.blessRounds}/${BLESS_MAX_ROUNDS}`, '#d8ffd8');
            push('配额', `${result.blessUsed}/${quotaDenom(result, 'blessUsed', 'blessLeft', 'blessMax', DAILY_BLESS_QUOTA)}`, '#ccc');
            break;
        case 'cleanse_bless':
            push('收福', `${result.clearedStacks} 层`, '#7dffb0');
            push('配额', `${result.cleanseBlessUsed}/${quotaDenom(result, 'cleanseBlessUsed', 'cleanseBlessLeft', 'cleanseBlessMax', DAILY_CLEANSE_BLESS_QUOTA)}`, '#ccc');
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
            push('配额', `${result.howlUsed}/${quotaDenom(result, 'howlUsed', 'howlLeft', 'howlMax', DAILY_HOWL_QUOTA)}`, '#ccc');
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
        rows.unshift({ label: '对象', value: truncText(targetName, 10), color: '#ffd700' });
    }
    if (helperName && !DUEL_TYPES.has(result.type)) {
        rows.unshift({ label: '发起', value: truncText(helperName, 10), color: '#88c8ff' });
    }
    if (result.weatherTip) {
        rows.push({ label: '天象', value: truncText(result.weatherTip, 14), color: '#63b3ed' });
    }

    return rows;
}

function pickCardFlavor(type) {
    return pickRandom(CARD_FLAVOR[type] || CARD_FLAVOR.default);
}

const OUTCOME_BADGE = {
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

function duelTitleBottom(hasSubtitle) {
    const titleY = DUEL_PANEL_TOP + DUEL_PANEL_H + TITLE_BELOW_PANEL;
    return hasSubtitle ? titleY + 58 : titleY + 28;
}

function buildDuelTitleBlock(meta, theme, subtitle) {
    const titleY = DUEL_PANEL_TOP + DUEL_PANEL_H + TITLE_BELOW_PANEL;
    const bandTop = titleY - 14;
    const bandH = subtitle ? 72 : 44;
    return `
        <rect x="24" y="${bandTop}" width="${CARD_W - 48}" height="${bandH}" rx="10" fill="${theme.panel}" opacity="0.35"/>
        ${textCenteredEmoji(CX, titleY, meta.emoji, { size: 16 })}
        ${textCentered(CX, titleY + 20, escapeXml(meta.title), TXT, { size: 14, fill: theme.title, weight: 'bold' })}
        ${subtitle ? textCentered(CX, titleY + 40, truncText(subtitle, 38), TXT_SOFT, { size: 11, fill: theme.muted }) : ''}
    `;
}

function buildDuelHeaderSvg({ leftName, rightName, meta, theme, subtitle, winnerSide, outcomeBadge }) {
    const lx = AVATAR_LEFT + AVATAR_SIZE / 2;
    const rx = CARD_W - AVATAR_LEFT - AVATAR_SIZE / 2;
    const cy = AVATAR_TOP + AVATAR_SIZE / 2;
    const nameY = AVATAR_TOP + AVATAR_SIZE + 16;
    const crown = (side) => (winnerSide === side
        ? textCenteredEmoji(side === 'left' ? lx : rx, AVATAR_TOP - 2, '👑', { size: 20 })
        : '');
    const badge = outcomeBadge
        ? buildRibbonBadge(CX, DUEL_PANEL_TOP + 4, outcomeBadge[0], outcomeBadge[1])
        : '';
    return `
        ${badge}
        ${buildCenteredPanel(CX, DUEL_PANEL_TOP, CARD_W - 32, DUEL_PANEL_H, theme)}
        ${buildDuelSpark(CX, cy, theme)}
        ${buildVsBadge(CX, cy, theme)}
        ${crown('left')}
        ${crown('right')}
        <circle cx="${lx}" cy="${cy}" r="${AVATAR_SIZE / 2 + 2}" fill="none" stroke="${winnerSide === 'left' ? '#ffd700' : theme.accent}" stroke-width="${winnerSide === 'left' ? 3 : 2}" opacity="0.9"/>
        <circle cx="${rx}" cy="${cy}" r="${AVATAR_SIZE / 2 + 2}" fill="none" stroke="${winnerSide === 'right' ? '#ffd700' : theme.accent}" stroke-width="${winnerSide === 'right' ? 3 : 2}" opacity="0.9"/>
        ${textCentered(lx, nameY, truncText(leftName, 9), TXT_SOFT, { size: 12, fill: theme.sub, weight: winnerSide === 'left' ? 'bold' : undefined })}
        ${textCentered(rx, nameY, truncText(rightName, 9), TXT_SOFT, { size: 12, fill: theme.sub, weight: winnerSide === 'right' ? 'bold' : undefined })}
        ${buildDuelTitleBlock(meta, theme, subtitle)}
    `;
}

function buildSimpleHeaderSvg({ meta, theme, outcomeBadge }) {
    const badge = outcomeBadge
        ? buildRibbonBadge(CX, 18, outcomeBadge[0], outcomeBadge[1])
        : '';
    return `
        ${badge}
        ${buildCenteredPanel(CX, 16, CARD_W - 32, SIMPLE_HEADER_H, theme)}
        ${textCenteredEmoji(CX, 48, meta.emoji, { size: 36 })}
        ${textCentered(CX, 78, escapeXml(meta.title), TXT, { size: 20, fill: theme.title, weight: 'bold' })}
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

function buildExtraBlock(lines, theme, startY) {
    let y = startY;
    let block = '';
    for (const line of lines) {
        block += textCentered(CX, y, truncText(line, 46), TXT_SOFT, { size: 13, fill: theme.sub });
        y += 20;
    }
    return { block, bottom: y };
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
    const outcomeBadge = OUTCOME_BADGE[result?.type] || null;
    const statsTop = isDuel ? duelTitleBottom(Boolean(subtitle)) + 20 : 16 + SIMPLE_HEADER_H + 16;
    const statRows = statGridRowCount(rows, STAT_COLS);
    const statGrid = buildStatGrid(rows, theme, statsTop, CARD_W, { cols: STAT_COLS, gapY: STAT_GAP_Y, countRatio });
    const statsBottom = statsTop + statGridHeight(statRows, STAT_GAP_Y, STAT_CHIP_H);

    let extraBlock = '';
    let contentBottom = statsBottom + 12;
    if (headline) {
        extraBlock += textCentered(CX, contentBottom, truncText(headline, 50), TXT, { size: 14, fill: theme.line });
        contentBottom += 22;
    }
    const { block: extraLinesBlock, bottom: extraBottom } = buildExtraBlock(extraLines.slice(0, 5), theme, contentBottom);
    extraBlock += extraLinesBlock;
    contentBottom = extraBottom;

    const footerY = Math.max(contentBottom + 14, statsBottom + 16);
    const cardH = footerY + 34;
    const flavor = pickCardFlavor(result?.type);
    const header = isDuel
        ? buildDuelHeaderSvg({ leftName: helperName, rightName: targetName, meta, theme, subtitle, winnerSide, outcomeBadge })
        : buildSimpleHeaderSvg({ meta, theme, outcomeBadge });
    const inner = `
        <rect width="${CARD_W}" height="${cardH}" rx="16" fill="url(#cardBg)"/>
        ${buildCardDecorations(CARD_W, cardH, theme, hashSeed(result?.type, helperId, targetId, headline))}
        ${header}
        ${statGrid}
        ${extraBlock}
        ${buildFooterBar(CARD_W, footerY, flavor, theme, 48)}
    `;
    const overlays = isDuel ? await buildAvatarOverlays(helperId, targetId, winnerSide) : [];
    return renderStyledCard(CARD_W, cardH, inner, meta.theme, overlays);
}
