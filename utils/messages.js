/**
 * 统一文案格式化（所有用户可见文本经此出口）
 */
import {
    ALREADY_DEAD_MESSAGES,
    ARENA_WIN_MESSAGES,
    ARENA_BUSY_MESSAGES,
    ARENA_DECLINE_MESSAGES,
    CURSE_MESSAGES,
    CURSED_LU_MESSAGES,
    BLESS_MESSAGES,
    BLESSED_LU_MESSAGES,
    CLEANSE_BLESS_MESSAGES,
    DAILY_BLESS_QUOTA,
    DAILY_CLEANSE_BLESS_QUOTA,
    BLESS_MAX_ROUNDS,
    BLESS_DEATH_REDUCE,
    DAILY_ARENA_QUOTA,
    DAILY_CURSE_QUOTA,
    DAILY_CLEANSE_CURSE_QUOTA,
    DAILY_FAKE_WITHDRAW_QUOTA,
    DAILY_HOWL_QUOTA,
    DAILY_URGE_QUOTA,
    DAILY_GROUP_SPLASH_QUOTA,
    FAKE_WITHDRAW_MESSAGES,
    GROUP_SPLASH_CURSE_EXTRA,
    GROUP_SPLASH_BURST_MESSAGES,
    CURSE_ASCENDED_MESSAGES,
    CLEANSE_CURSE_MESSAGES,
    CURSE_MAX_ROUNDS,
    GROUP_SPLASH_MESSAGES,
    GREED_FAIL_MESSAGES,
    GREED_SUCCESS_MESSAGES,
    HOWL_BONUS_MESSAGES,
    HOWL_TRAP_MESSAGES,
    SACRIFICE_MESSAGES,
    STEAL_BACKFIRE_MESSAGES,
    STEAL_CURSE_BACKFIRE_MESSAGES,
    STEAL_FAIL_MESSAGES,
    STEAL_SUCCESS_MESSAGES,
    BORROW_MESSAGES,
    BUMPER_WIN_MESSAGES,
    BUMPER_DRAW_MESSAGES,
    BUMPER_FAIL_MESSAGES,
    BUMPER_CURSE_EXTRA,
    LOTTERY_PLUS_MESSAGES,
    LOTTERY_MINUS_MESSAGES,
    LOTTERY_URGE_MESSAGES,
    LOTTERY_CURSE_MESSAGES,
    LOTTERY_CLEANSE_MESSAGES,
    LOTTERY_BLANK_MESSAGES,
    DAILY_BORROW_QUOTA,
    DAILY_BUMPER_QUOTA,
    DAILY_LOTTERY_QUOTA,
    DAILY_SPECTRAL_CURSE_QUOTA,
    DAILY_VENGEANCE_QUOTA,
    DAILY_DREAM_QUOTA,
    DAILY_REVIVE_LOTTERY_QUOTA,
    ALIVE_ONLY_MESSAGES,
    SPECTRAL_CURSE_MESSAGES,
    VENGEANCE_CURSE_MESSAGES,
    VENGEANCE_DEDUCT_MESSAGES,
    VENGEANCE_FAIL_MESSAGES,
    VENGEANCE_SUBSTITUTE_MESSAGES,
    DREAM_URGE_MESSAGES,
    DREAM_SOOTHE_MESSAGES,
    REVIVE_LOTTERY_FULL_MESSAGES,
    REVIVE_LOTTERY_WEAK_MESSAGES,
    REVIVE_LOTTERY_BLANK_MESSAGES,
    TOMBSTONE_HEADER,
    HOWL_DEAD_HAUNT_MESSAGES,
    getDeathReasonText,
    URGE_BUFF_MESSAGES,
    URGE_MESSAGES,
    pickHowlMessage,
    DAILY_HELP_QUOTA,
    DAILY_HELP_WITHDRAW_QUOTA,
    DAILY_IMPERIAL_QUOTA,
    DAILY_SAFE_LIMIT,
    DEATH_REASON,
    ERROR_MESSAGES,
    HELP_FAIL_MESSAGES,
    HELP_FAIL_CHANCE,
    HELP_QUOTA_MESSAGES,
    HELP_SUCCESS_MESSAGES,
    HELP_WITHDRAW_SUCCESS,
    HELP_WITHDRAW_FAIL_MESSAGES,
    HELP_WITHDRAW_FAIL_CHANCE,
    HELP_WITHDRAW_QUOTA_MESSAGES,
    HELP_REVIVE_FAIL_MESSAGES,
    HELPER_DEAD_MESSAGES,
    IMPERIAL_LOSE_MESSAGES,
    IMPERIAL_WIN_MESSAGES,
    IMPERIAL_CLEARANCE_MESSAGES,
    HELP_QUOTA_CLEARANCE_MESSAGES,
    PLAYFUL_CLEARANCE_MESSAGES,
    AMNESTY_ALL_MESSAGES,
    ACTOR_DEAD_MESSAGES,
    TARGET_DEAD_MESSAGES,
    PRIVILEGE_REVIVE_MESSAGES,
    TOGETHER_FALL_MESSAGES,
    formatChancePercent,
    pickDeathMessage,
    pickRandom,
    REVIVE_MESSAGES,
    RISKY_SURVIVE_MESSAGES,
    SAFE_MESSAGES,
    WITHDRAWAL_MESSAGES,
    FRIEND_ADD_MESSAGES,
    FRIEND_ADD_NOTIFY,
    FRIEND_ALREADY_MESSAGES,
    FRIEND_EMPTY_MESSAGES,
    FRIEND_LIST_TITLES,
    FRIEND_NOT_IN_GROUP,
    FRIEND_REMOVE_MESSAGES,
    UI_MESSAGES,
} from '../constants/game.js';
import { YUMUMU_IMPOTENCE_HELP_FAIL, YUMUMU_IMPOTENCE_CHANCE, YUMUMU_BIND_MINUTES, formatYumumuBindCutoffHint, XUYUEZHEN_CHAOS_OUTCOME_LABELS } from '../constants/extra-deer.js';
import { TRANSFER_PROFESSION_HINT } from '../constants/profession.js';
import { resolveQuotaDenom } from '../constants/profession-quotas.js';

export { getDeathReasonText, getDeathCellLabel } from '../constants/game.js';

function qDenom(result, usedKey, leftKey, maxKey, fallback) {
    return resolveQuotaDenom({
        used: result[usedKey],
        left: result[leftKey],
        max: result[maxKey],
        fallback,
    });
}

function quotaHint(result) {
    if (result.helpQuotaLeft == null && result.helperHelpLeft == null) return '';
    const left = result.helpQuotaLeft ?? result.helperHelpLeft;
    const max = resolveQuotaDenom({
        used: result.helpQuotaUsed ?? result.helperHelpUsed,
        left,
        max: result.helpQuotaMax,
        fallback: DAILY_HELP_QUOTA,
    });
    return `（帮🦌剩余 ${left}/${max}）`;
}

function riskHint(result) {
    const pct = formatChancePercent(result.nextDeathChance ?? result.deathChance ?? 0);
    if (!pct) return '';
    return `，再🦌 ${pct}% 鹿死`;
}

function weatherHint(result) {
    const patrol = result.weatherPatrolConsumed ? ' · 天象巡游生效' : '';
    return (result.weatherTip ? ` · 天象：${result.weatherTip}` : '') + patrol;
}

function modifierDeathNote(result) {
    const parts = [];
    if (result.curseStacks) parts.push(`${result.curseStacks} 层咒`);
    if (result.blessStacks) parts.push(`${result.blessStacks} 层福`);
    return parts.length ? `（含${parts.join('·')}）` : '';
}

function withdrawQuotaHint(result) {
    if (result.helpWithdrawLeft == null && result.helperWithdrawLeft == null) return '';
    const left = result.helpWithdrawLeft ?? result.helperWithdrawLeft;
    const max = resolveQuotaDenom({
        used: result.helpWithdrawUsed ?? result.helperWithdrawUsed,
        left,
        max: result.helpWithdrawMax ?? result.helpWithdrawQuotaMax,
        fallback: DAILY_HELP_WITHDRAW_QUOTA,
    });
    return `（帮戒🦌剩余 ${left}/${max}）`;
}

function deerCartActionSuffix(result) {
    if (result.deerCartEnded) {
        return ' · 鹿车到站：发车人鹿死且帮鹿次数耗尽，已散车';
    }
    if (result.deerCartAwaitHelp) {
        const left = result.deerCartAwaitHelp.helpQuotaLeft;
        return ` · 鹿车进行中：帮鹿位剩余 ${left} 次`;
    }
    return '';
}

function playActionSuffix(result) {
    return extraDeerActionSuffix(result) + deerCartActionSuffix(result);
}

function extraDeerActionSuffix(result) {
    const parts = [];
    if (result.meijiaTeamLu) {
        const syncNote = result.meijiaTeamLu.syncMax != null
            ? `（今日联动 ${result.meijiaTeamLu.syncCount}/${result.meijiaTeamLu.syncMax}）`
            : '';
        parts.push(` · 组队联动：搭档同步 +1（现 ${result.meijiaTeamLu.partnerCount} 次）${syncNote}`);
    }
    if (result.meijiaTeamWipe) {
        parts.push(' · 王美嘉组队双亡：搭档一并鹿死 · 组队已解除');
    } else if (result.meijiaTeamDissolved) {
        parts.push(' · 组队已解除');
    }
    if (result.yumumuImpotence) {
        parts.push(` · 雨木木天赋：${Math.round(YUMUMU_IMPOTENCE_CHANCE * 100)}% 令目标「阳痿」，下次被帮鹿失手 +${Math.round(YUMUMU_IMPOTENCE_HELP_FAIL * 100)}%`);
    }
    if (result.impotenceTriggered) {
        parts.push(` · 阳痿 debuff 触发，帮鹿失手率 +${Math.round(YUMUMU_IMPOTENCE_HELP_FAIL * 100)}%`);
    }
    return parts.join('');
}

/** 互助配额查询/职业面板文案 */
export function formatHelperQuotaReply(snapshot, mode = 'all') {
    if (snapshot?.professionRequired) {
        return [
            '🎭 今日尚未转职，玩法已封印',
            ERROR_MESSAGES.profession_required,
            '转职后发送「鹿况」查看配额与玩法',
        ].join('\n');
    }
    if (!snapshot?.profession) return '无法读取互助配额';
    const { profession, locked, help, withdraw } = snapshot;
    const lockNote = locked ? '已锁定' : '未转职·可转职';
    const lines = [`${profession.emoji} ${profession.name}（${lockNote}）`];
    if (mode === 'all' || mode === 'help') {
        lines.push(`帮鹿：剩余 ${help.left}/${help.max}（已用 ${help.used}）`);
    }
    if (mode === 'all' || mode === 'withdraw') {
        lines.push(`帮戒：剩余 ${withdraw.left}/${withdraw.max}（已用 ${withdraw.used}）`);
    }
    if (mode === 'all') {
        lines.push(profession.tagline);
        if (snapshot.playSummary) {
            lines.push(`今日配额：${snapshot.playSummary}`);
        }
        lines.push(`转职：${TRANSFER_PROFESSION_HINT}`);
    }
    return lines.join('\n');
}

/** 失败/拒绝类文案 */
export function formatErrorMessage(result) {
    switch (result.type) {
        case 'dead':
            return pickRandom(ALREADY_DEAD_MESSAGES);
        case 'actor_dead':
            return pickRandom(ACTOR_DEAD_MESSAGES) || ERROR_MESSAGES.actor_dead;
        case 'alive_only':
            return pickRandom(ALIVE_ONLY_MESSAGES) || ERROR_MESSAGES.alive_only;
        case 'helper_dead':
            return pickRandom(HELPER_DEAD_MESSAGES) || ERROR_MESSAGES.helper_dead;
        case 'target_dead':
            return pickRandom(TARGET_DEAD_MESSAGES) || ERROR_MESSAGES.target_dead;
        case 'help_quota': {
            const max = resolveQuotaDenom({
                used: result.helpQuotaUsed ?? result.helperHelpUsed,
                left: result.helpQuotaLeft ?? result.helperHelpLeft,
                max: result.helpQuotaMax,
                fallback: DAILY_HELP_QUOTA,
            });
            const used = result.helpQuotaUsed ?? result.helperHelpUsed ?? max;
            return result.message || pickRandom(HELP_QUOTA_MESSAGES)
                || ERROR_MESSAGES.help_quota(used, max);
        }
        case 'help_withdraw_quota': {
            const max = resolveQuotaDenom({
                used: result.helpWithdrawUsed ?? result.helperWithdrawUsed,
                left: result.helpWithdrawLeft ?? result.helperWithdrawLeft,
                max: result.helpWithdrawMax ?? result.helpWithdrawQuotaMax,
                fallback: DAILY_HELP_WITHDRAW_QUOTA,
            });
            const used = result.helpWithdrawUsed ?? result.helperWithdrawUsed ?? max;
            return pickRandom(HELP_WITHDRAW_QUOTA_MESSAGES)
                || ERROR_MESSAGES.help_withdraw_quota(used, max);
        }
        case 'profession_unknown':
            return ERROR_MESSAGES.profession_unknown(result.token);
        case 'profession_locked':
            return ERROR_MESSAGES.profession_locked(result.profession?.name || '当前职业');
        case 'profession_required':
            return ERROR_MESSAGES.profession_required;
        case 'job_skill_used':
            return ERROR_MESSAGES.job_skill_used;
        case 'job_skill_wrong_profession':
            return ERROR_MESSAGES.job_skill_wrong_profession(result.expected, result.current);
        case 'patrol_buff_pending':
            return ERROR_MESSAGES.patrol_buff_pending;
        case 'lu_banned':
            return ERROR_MESSAGES.lu_banned(result.leftMin);
        case 'cart_self':
            return ERROR_MESSAGES.cart_self;
        case 'cart_already':
            return ERROR_MESSAGES.cart_already;
        case 'cart_partner_busy':
            return ERROR_MESSAGES.cart_partner_busy;
        case 'cart_busy':
            return ERROR_MESSAGES.cart_busy;
        case 'cart_helper_no_lu':
            return ERROR_MESSAGES.cart_helper_no_lu;
        case 'cart_driver_no_lu':
            return ERROR_MESSAGES.cart_driver_no_lu;
        case 'cart_help_wrong_target':
            return ERROR_MESSAGES.cart_help_wrong_target;
        case 'cart_driver_dead':
            return ERROR_MESSAGES.cart_driver_dead;
        case 'team_self':
            return ERROR_MESSAGES.team_self;
        case 'team_already':
            return ERROR_MESSAGES.team_already;
        case 'team_partner_taken':
            return ERROR_MESSAGES.team_partner_taken;
        case 'team_partner_no_lu':
            return ERROR_MESSAGES.team_partner_no_lu;
        case 'meijia_no_withdraw':
            return ERROR_MESSAGES.meijia_no_withdraw;
        case 'team_meijia_negative':
            return ERROR_MESSAGES.team_meijia_negative;
        case 'bind_self':
            return ERROR_MESSAGES.bind_self;
        case 'bind_already':
            return ERROR_MESSAGES.bind_already;
        case 'bind_after_cutoff':
            return ERROR_MESSAGES.bind_after_cutoff;
        case 'withdrawal_dead':
            return ERROR_MESSAGES.withdrawal_dead;
        case 'empty':
            return ERROR_MESSAGES.empty;
        case 'together_used':
            return ERROR_MESSAGES.together_used;
        case 'together_disabled':
            return '当前职业无法使用同归鹿尽（配额 0）';
        case 'together_self':
            return ERROR_MESSAGES.together_self;
        case 'imperial_used':
            return ERROR_MESSAGES.imperial_used(
                result.imperialUsed ?? result.imperialMax ?? DAILY_IMPERIAL_QUOTA,
                result.imperialMax ?? DAILY_IMPERIAL_QUOTA,
            );
        case 'arena_used':
            return ERROR_MESSAGES.arena_used(
                result.arenaUsed ?? result.arenaMax ?? DAILY_ARENA_QUOTA,
                result.arenaMax ?? DAILY_ARENA_QUOTA,
            );
        case 'arena_self':
            return ERROR_MESSAGES.arena_self;
        case 'arena_target_dead':
            return ERROR_MESSAGES.arena_target_dead;
        case 'arena_need_group':
            return ERROR_MESSAGES.arena_need_group;
        case 'arena_no_pending':
            return ERROR_MESSAGES.arena_no_pending;
        case 'arena_busy':
            return pickRandom(ARENA_BUSY_MESSAGES) || ERROR_MESSAGES.arena_busy;
        case 'steal_used':
            return ERROR_MESSAGES.steal_used(
                result.stealUsed ?? result.stealMax ?? DAILY_STEAL_QUOTA,
                result.stealMax ?? DAILY_STEAL_QUOTA,
            );
        case 'steal_target_dead':
            return ERROR_MESSAGES.steal_target_dead;
        case 'steal_empty':
            return ERROR_MESSAGES.steal_empty;
        case 'curse_used':
            return ERROR_MESSAGES.curse_used(
                result.curseUsed ?? qDenom(result, 'curseUsed', 'curseLeft', 'curseMax', DAILY_CURSE_QUOTA),
                qDenom(result, 'curseUsed', 'curseLeft', 'curseMax', DAILY_CURSE_QUOTA),
            );
        case 'curse_self':
            return ERROR_MESSAGES.curse_self;
        case 'cleanse_used':
            return ERROR_MESSAGES.cleanse_used(
                result.cleanseUsed ?? qDenom(result, 'cleanseUsed', 'cleanseLeft', 'cleanseMax', DAILY_CLEANSE_CURSE_QUOTA),
                qDenom(result, 'cleanseUsed', 'cleanseLeft', 'cleanseMax', DAILY_CLEANSE_CURSE_QUOTA),
            );
        case 'cleanse_no_curse':
            return ERROR_MESSAGES.cleanse_no_curse;
        case 'bless_used':
            return ERROR_MESSAGES.bless_used(
                result.blessUsed ?? qDenom(result, 'blessUsed', 'blessLeft', 'blessMax', DAILY_BLESS_QUOTA),
                qDenom(result, 'blessUsed', 'blessLeft', 'blessMax', DAILY_BLESS_QUOTA),
            );
        case 'bless_self':
            return ERROR_MESSAGES.bless_self;
        case 'cleanse_bless_used':
            return ERROR_MESSAGES.cleanse_bless_used(
                result.cleanseBlessUsed ?? qDenom(result, 'cleanseBlessUsed', 'cleanseBlessLeft', 'cleanseBlessMax', DAILY_CLEANSE_BLESS_QUOTA),
                qDenom(result, 'cleanseBlessUsed', 'cleanseBlessLeft', 'cleanseBlessMax', DAILY_CLEANSE_BLESS_QUOTA),
            );
        case 'cleanse_no_bless':
            return ERROR_MESSAGES.cleanse_no_bless;
        case 'weather_unknown':
            return ERROR_MESSAGES.weather_unknown(result.token);
        case 'weather_privilege_only':
            return ERROR_MESSAGES.weather_privilege_only;
        case 'sacrifice_used':
            return ERROR_MESSAGES.sacrifice_used;
        case 'sacrifice_self':
            return ERROR_MESSAGES.sacrifice_self;
        case 'fake_withdraw_used':
            return ERROR_MESSAGES.fake_withdraw_used(
                result.fakeWithdrawUsed ?? qDenom(result, 'fakeWithdrawUsed', 'fakeWithdrawLeft', 'fakeWithdrawMax', DAILY_FAKE_WITHDRAW_QUOTA),
                qDenom(result, 'fakeWithdrawUsed', 'fakeWithdrawLeft', 'fakeWithdrawMax', DAILY_FAKE_WITHDRAW_QUOTA),
            );
        case 'urge_used':
            return ERROR_MESSAGES.urge_used(
                result.urgeUsed ?? qDenom(result, 'urgeUsed', 'urgeLeft', 'urgeMax', DAILY_URGE_QUOTA),
                qDenom(result, 'urgeUsed', 'urgeLeft', 'urgeMax', DAILY_URGE_QUOTA),
            );
        case 'howl_used':
            return ERROR_MESSAGES.howl_used(
                result.howlUsed ?? qDenom(result, 'howlUsed', 'howlLeft', 'howlMax', DAILY_HOWL_QUOTA),
                qDenom(result, 'howlUsed', 'howlLeft', 'howlMax', DAILY_HOWL_QUOTA),
            );
        case 'howl_dead':
            return ERROR_MESSAGES.howl_dead;
        case 'howl_chain_no_curse':
            return ERROR_MESSAGES.howl_chain_no_curse;
        case 'greed_used':
            return ERROR_MESSAGES.greed_used;
        case 'greed_self':
            return ERROR_MESSAGES.greed_self;
        case 'splash_used':
            return ERROR_MESSAGES.splash_used(
                result.splashUsed ?? qDenom(result, 'splashUsed', 'splashLeft', 'splashMax', DAILY_GROUP_SPLASH_QUOTA),
                qDenom(result, 'splashUsed', 'splashLeft', 'splashMax', DAILY_GROUP_SPLASH_QUOTA),
            );
        case 'splash_need_group':
            return ERROR_MESSAGES.splash_need_group;
        case 'splash_no_rank':
            return ERROR_MESSAGES.splash_no_rank;
        case 'splash_no_victims':
            return ERROR_MESSAGES.splash_no_victims;
        case 'steal_self':
            return ERROR_MESSAGES.steal_self;
        case 'borrow_used':
            return ERROR_MESSAGES.borrow_used;
        case 'borrow_self':
            return ERROR_MESSAGES.borrow_self;
        case 'borrow_poor':
            return ERROR_MESSAGES.borrow_poor(result.min ?? 2, result.monthNet);
        case 'bumper_used':
            return ERROR_MESSAGES.bumper_used(
                result.bumperUsed ?? qDenom(result, 'bumperUsed', 'bumperLeft', 'bumperMax', DAILY_BUMPER_QUOTA),
                qDenom(result, 'bumperUsed', 'bumperLeft', 'bumperMax', DAILY_BUMPER_QUOTA),
            );
        case 'bumper_self':
            return ERROR_MESSAGES.bumper_self;
        case 'lottery_used':
            return ERROR_MESSAGES.lottery_used;
        case 'spectral_curse_used':
            return ERROR_MESSAGES.spectral_curse_used(
                result.spectralCurseUsed ?? qDenom(result, 'spectralCurseUsed', 'spectralCurseLeft', 'spectralCurseMax', DAILY_SPECTRAL_CURSE_QUOTA),
                qDenom(result, 'spectralCurseUsed', 'spectralCurseLeft', 'spectralCurseMax', DAILY_SPECTRAL_CURSE_QUOTA),
            );
        case 'spectral_curse_self':
            return ERROR_MESSAGES.spectral_curse_self;
        case 'vengeance_used':
            return ERROR_MESSAGES.vengeance_used(
                result.vengeanceUsed ?? qDenom(result, 'vengeanceUsed', 'vengeanceLeft', 'vengeanceMax', DAILY_VENGEANCE_QUOTA),
                qDenom(result, 'vengeanceUsed', 'vengeanceLeft', 'vengeanceMax', DAILY_VENGEANCE_QUOTA),
            );
        case 'vengeance_self':
            return ERROR_MESSAGES.vengeance_self;
        case 'vengeance_not_killer':
            return ERROR_MESSAGES.vengeance_not_killer;
        case 'dream_used':
            return ERROR_MESSAGES.dream_used;
        case 'dream_self':
            return ERROR_MESSAGES.dream_self;
        case 'revive_lottery_used':
            return ERROR_MESSAGES.revive_lottery_used;
        case 'tombstone_alive':
            return ERROR_MESSAGES.tombstone_alive;
        case 'urge_self':
            return ERROR_MESSAGES.urge_self;
        case 'imperial_no_king':
            return ERROR_MESSAGES.imperial_no_king;
        case 'imperial_is_king':
            return ERROR_MESSAGES.imperial_is_king;
        case 'imperial_king_dead':
            return ERROR_MESSAGES.imperial_king_dead;
        case 'imperial_need_group':
            return ERROR_MESSAGES.imperial_need_group;
        case 'imperial_dead':
            return pickRandom(ACTOR_DEAD_MESSAGES) || ERROR_MESSAGES.imperial_dead;
        case 'privilege_only':
            return ERROR_MESSAGES.privilege_only;
        default:
            if (typeof result.type === 'string' && result.type.endsWith('_disabled')) {
                return '当前职业无法使用此玩法（配额 0）';
            }
            return result.message || ERROR_MESSAGES.default;
    }
}

export function formatCartSessionMessage(session, ctx = {}) {
    return buildCartForwardLines(session, ctx).join('\n');
}

function cartLuLine(result) {
    if (!result?.ok) return formatErrorMessage(result);
    const count = result.count ?? result.entry?.c ?? '?';
    const safe = result.safeLimit ?? DAILY_SAFE_LIMIT;
    if (result.type === 'safe' || result.type === 'safe_grinder' || result.type === 'safe_urged') {
        return `🦌 安全 +1 · ${count}/${safe}`;
    }
    if (String(result.type || '').startsWith('risky')) {
        const pct = formatChancePercent(result.deathChance ?? 0);
        return `🦌 险区 +1 · ${count} 次 · 再🦌 ${pct || '?'}%`;
    }
    if (String(result.type || '').startsWith('death')) {
        return `💀 鹿死 · 丢 ${result.snap ?? 0} 次`;
    }
    return formatActionMessage(result);
}

function cartHelpLine(result, { helperName, driverName }) {
    if (!result?.ok) return formatErrorMessage(result);
    const q = quotaHint(result);
    switch (result.type) {
        case 'revive':
            return `💚 ${helperName} 救活 ${driverName} → ${result.count} 次${q}`;
        case 'help_revive_fail':
            return `💔 ${helperName} 救失手${q}`;
        case 'help':
            return `🤝 ${helperName} 帮鹿 → ${result.count}/${result.safeLimit ?? DAILY_SAFE_LIMIT}${q}`;
        case 'help_kill':
        case 'help_pull':
            return `⚠️ ${helperName} 帮失手${q}`;
        default:
            return formatActionMessage(result, { helperName, targetName: driverName });
    }
}

/** 鹿车详情：聊天记录逐条（短句，无天象/随机梗） */
export function buildCartForwardLines(session, { driverName, helperName } = {}) {
    const lines = [];
    for (const [i, round] of (session.rounds || []).entries()) {
        if ((session.rounds?.length || 0) > 1) lines.push(`— 第 ${i + 1} 轮 —`);
        lines.push(`${driverName} ${cartLuLine(round.lu)}`);
        const helps = round.helps?.length ? round.helps : (round.help ? [round.help] : []);
        for (const help of helps) {
            lines.push(cartHelpLine(help, { helperName, driverName }));
        }
    }
    return lines;
}

export function formatCartSessionSummary(session) {
    const n = session.roundCount || 0;
    const lastLu = session.rounds?.[session.rounds.length - 1]?.lu;
    const endedDead = !!(lastLu?.entry?.d || String(lastLu?.type || '').startsWith('death'));
    if (session.maxRoundsHit) {
        return `🚗 连鹿 ×${n} · 达单趟上限 · 已散车`;
    }
    if (endedDead) {
        return `🚗 连鹿 ×${n} · 发车位鹿死且帮鹿用尽 · 已散车`;
    }
    return `🚗 连鹿 ×${n} · 本趟结束 · 已散车`;
}

/** 单人连鹿详情：聊天记录逐条 */
export function buildSoloLuForwardLines(session, { playerName } = {}) {
    const lines = [];
    for (const [i, lu] of (session.results || []).entries()) {
        if ((session.results?.length || 0) > 1) lines.push(`— 第 ${i + 1} 次 —`);
        lines.push(`${playerName} ${cartLuLine(lu)}`);
    }
    return lines;
}

export function formatSoloLuSessionSummary(session) {
    const n = session.count || 0;
    const lastLu = session.results?.[session.results.length - 1];
    const endedDead = !!(lastLu?.entry?.d || String(lastLu?.type || '').startsWith('death'));
    if (session.maxRoundsHit) {
        return `🦌 连鹿 ×${n} · 达单趟上限`;
    }
    if (endedDead) {
        return `🦌 连鹿 ×${n} · 鹿死收场`;
    }
    return `🦌 连鹿 ×${n} · 本趟结束`;
}

function formatQuotaChainSummary(session, { emoji, label, tail = '配额耗尽' } = {}) {
    const n = session.count || 0;
    if (session.revived) return `${emoji} 连${label} ×${n} · 还阳成功`;
    return `${emoji} 连${label} ×${n} · ${tail}`;
}

const CHAIN_PLAY_META = {
    urge: {
        emoji: '⏰',
        label: '催鹿',
        tail: (session) => {
            const stacks = session.results?.[session.results.length - 1]?.buffStacks ?? 0;
            return stacks ? `催更符 ×${stacks}` : '配额耗尽';
        },
    },
    lottery: { emoji: '🎴', label: '抽鹿签' },
    howl: {
        emoji: '📣',
        label: '鹿鸣',
        tail: (session) => (session.curseCleared ? '咒已清' : '配额耗尽'),
    },
    fakeWithdraw: {
        emoji: '🎭',
        label: '诈戒',
        tail: (session) => {
            const count = session.results?.[session.results.length - 1]?.count ?? 0;
            return count ? `现 ${count} 次` : '配额耗尽';
        },
    },
    reviveLottery: { emoji: '🪷', label: '还阳签' },
    bless: {
        emoji: '✨',
        label: '鹿福',
        tail: (session) => {
            const last = session.results?.[session.results.length - 1];
            return last?.blessStacks ? `鹿福 ×${last.blessStacks} 层` : '配额耗尽';
        },
    },
    curse: {
        emoji: '☠️',
        label: '鹿咒',
        tail: (session) => {
            const last = session.results?.[session.results.length - 1];
            return last?.curseStacks ? `鹿咒 ×${last.curseStacks} 层` : '配额耗尽';
        },
    },
    spectralCurse: {
        emoji: '👻',
        label: '冥鹿咒',
        tail: (session) => {
            const last = session.results?.[session.results.length - 1];
            return last?.curseStacks ? `冥鹿咒 ×${last.curseStacks} 层` : '配额耗尽';
        },
    },
    dream: { emoji: '💤', label: '托梦鹿' },
};

export function formatPlayChainSummary(session, kind) {
    const meta = CHAIN_PLAY_META[kind] || { emoji: '🦌', label: '连玩' };
    const tail = meta.tail?.(session) ?? '配额耗尽';
    return formatQuotaChainSummary(session, { emoji: meta.emoji, label: meta.label, tail });
}

export function buildQuotaChainForwardLines(session, formatOne, ctx = {}) {
    const lines = [];
    for (const [i, result] of (session.results || []).entries()) {
        if ((session.results?.length || 0) > 1) lines.push(`— 第 ${i + 1} 次 —`);
        lines.push(formatOne(result, ctx));
    }
    return lines;
}

export function buildPlayChainForwardLines(session, ctx = {}) {
    return buildQuotaChainForwardLines(session, (r) => formatActionMessage(r, ctx), ctx);
}

/** 操作结果文案 */
export function formatActionMessage(result, ctx = {}) {
    const { helperName, targetName, dice, diceSide, choice } = ctx;
    if (!result.ok) return formatErrorMessage(result);
    const q = quotaHint(result);
    const wq = withdrawQuotaHint(result);
    switch (result.type) {
        case 'safe':
            return `${pickRandom(SAFE_MESSAGES)}（${result.count}/${result.safeLimit ?? DAILY_SAFE_LIMIT}）${weatherHint(result)}${playActionSuffix(result)}`;
        case 'safe_grinder':
            return `${pickRandom(SAFE_MESSAGES)} 卷王连击 +${result.grinderBonus || 1}！（${result.count}/${result.safeLimit ?? DAILY_SAFE_LIMIT}）${weatherHint(result)}${playActionSuffix(result)}`;
        case 'safe_urged': {
            const urgeNote = result.urgeBonus
                ? `催更符 ×${result.urgeBonus} 已兑现（+1 基础 +${result.urgeBonus}）`
                : pickRandom(URGE_BUFF_MESSAGES);
            return `${pickRandom(SAFE_MESSAGES)} ${urgeNote}（${result.count}/${result.safeLimit ?? DAILY_SAFE_LIMIT}）${weatherHint(result)}${playActionSuffix(result)}`;
        }
        case 'risky':
            return `${pickRandom(RISKY_SURVIVE_MESSAGES)} 今日 ${result.count} 次${riskHint(result)}${weatherHint(result)}${playActionSuffix(result)}`;
        case 'risky_urged': {
            const urgeNote = `催更符 ×${result.urgeBonus} 已兑现（+1 基础 +${result.urgeBonus}）`;
            return `${pickRandom(RISKY_SURVIVE_MESSAGES)} ${urgeNote} 今日 ${result.count} 次${riskHint(result)}${weatherHint(result)}${playActionSuffix(result)}`;
        }
        case 'risky_cursed':
            return `${pickRandom(CURSED_LU_MESSAGES)} ${pickRandom(RISKY_SURVIVE_MESSAGES)} 今日 ${result.count} 次${riskHint(result)}${weatherHint(result)}${playActionSuffix(result)}`;
        case 'risky_urged_cursed': {
            const urgeNote = `催更符 ×${result.urgeBonus} 已兑现（+1 基础 +${result.urgeBonus}）`;
            return `${pickRandom(CURSED_LU_MESSAGES)} ${pickRandom(RISKY_SURVIVE_MESSAGES)} ${urgeNote} 今日 ${result.count} 次${riskHint(result)}${weatherHint(result)}${playActionSuffix(result)}`;
        }
        case 'risky_blessed':
            return `${pickRandom(BLESSED_LU_MESSAGES)} ${pickRandom(RISKY_SURVIVE_MESSAGES)} 今日 ${result.count} 次${riskHint(result)}${weatherHint(result)}${playActionSuffix(result)}`;
        case 'risky_urged_blessed': {
            const urgeNote = `催更符 ×${result.urgeBonus} 已兑现（+1 基础 +${result.urgeBonus}）`;
            return `${pickRandom(BLESSED_LU_MESSAGES)} ${pickRandom(RISKY_SURVIVE_MESSAGES)} ${urgeNote} 今日 ${result.count} 次${riskHint(result)}${weatherHint(result)}${playActionSuffix(result)}`;
        }
        case 'risky_mixed':
            return `${pickRandom(CURSED_LU_MESSAGES)} ${pickRandom(BLESSED_LU_MESSAGES)} 福咒对冲！今日 ${result.count} 次${riskHint(result)}${weatherHint(result)}${playActionSuffix(result)}`;
        case 'risky_urged_mixed': {
            const urgeNote = `催更符 ×${result.urgeBonus} 已兑现（+1 基础 +${result.urgeBonus}）`;
            return `${pickRandom(CURSED_LU_MESSAGES)} ${pickRandom(BLESSED_LU_MESSAGES)} 福咒对冲！${urgeNote} 今日 ${result.count} 次${riskHint(result)}${weatherHint(result)}${playActionSuffix(result)}`;
        }
        case 'death': {
            const pct = formatChancePercent(result.deathChance ?? 0);
            const pctText = pct ? `（触发 ${pct}% 判定）` : '';
            const reason = result.entry?.dr || DEATH_REASON.SELF;
            return `${pickDeathMessage(reason)}${pctText}（丢失 ${result.snap} 次）${weatherHint(result)}${playActionSuffix(result)}`;
        }
        case 'death_cursed': {
            const pct = formatChancePercent(result.deathChance ?? 0);
            const stackNote = result.curseStacks ? ` · ${result.curseStacks} 层咒` : '';
            const pctText = pct ? `（含鹿咒${stackNote}，触发 ${pct}% 判定）` : '';
            return `${pickRandom(CURSED_LU_MESSAGES)} ${pickDeathMessage(DEATH_REASON.SELF)}${pctText}（丢失 ${result.snap} 次）${weatherHint(result)}${playActionSuffix(result)}`;
        }
        case 'death_blessed': {
            const pct = formatChancePercent(result.deathChance ?? 0);
            const stackNote = result.blessStacks ? ` · ${result.blessStacks} 层福` : '';
            const pctText = pct ? `（含鹿福${stackNote}，触发 ${pct}% 判定）` : '';
            return `${pickRandom(BLESSED_LU_MESSAGES)} ${pickDeathMessage(DEATH_REASON.SELF)}${pctText}（丢失 ${result.snap} 次）${weatherHint(result)}${playActionSuffix(result)}`;
        }
        case 'death_mixed': {
            const pct = formatChancePercent(result.deathChance ?? 0);
            const pctText = pct ? `（福咒对冲${modifierDeathNote(result)}，触发 ${pct}% 判定）` : '';
            return `${pickDeathMessage(DEATH_REASON.SELF)}${pctText}（丢失 ${result.snap} 次）${weatherHint(result)}${playActionSuffix(result)}`;
        }
        case 'revive': {
            const bonus = result.helpQuotaBonus ? ' · 鹿医师：帮鹿上限+1' : '';
            const saved = result.helpQuotaSaved ? ' · 妙手留存：本次不耗帮鹿次数' : '';
            return `${helperName || '🦌友'} 救活 ${targetName || 'ta'}！${pickRandom(REVIVE_MESSAGES)}（恢复 ${result.count} 次 · 咒印尽散）${bonus}${saved}${q}`;
        }
        case 'help_revive_fail':
            return `${helperName || '你'} 救 ${targetName || 'ta'} ${pickRandom(HELP_REVIVE_FAIL_MESSAGES)}（${Math.round((result.failChance ?? HELP_FAIL_CHANCE) * 100)}% 概率 · 仍鹿死）${q}`;
        case 'help': {
            const soothe = result.curseSoothe ? ' · 顺手下咒回合 -1' : '';
            const medic = result.medicCleanse ? ' · 鹿医师撕咒' : (result.medicBless ? ' · 鹿医师贴福' : '');
            const bonus = result.helpQuotaBonus ? ' · 鹿医师：帮鹿上限+1' : '';
            const saved = result.helpQuotaSaved ? ' · 妙手留存：本次不耗帮鹿次数' : '';
            return `${helperName || '你'} 帮 ${targetName || 'ta'} ${pickRandom(HELP_SUCCESS_MESSAGES)}（${result.count}/${result.safeLimit ?? DAILY_SAFE_LIMIT}）${soothe}${medic}${bonus}${saved}${q}${playActionSuffix(result)}`;
        }
        case 'help_kill':
            return `${helperName || '你'} 误伤 ${targetName || 'ta'}！${pickDeathMessage(DEATH_REASON.HELP)}（${Math.round((result.helpKillChance ?? HELP_FAIL_CHANCE) * 100)}% 概率 · 丢失 ${result.snap} 次）${q}${playActionSuffix(result)}`;
        case 'help_pull':
            return `${helperName || '你'} 拉 ${targetName || 'ta'} 下马！${pickDeathMessage(DEATH_REASON.PULL)}（${Math.round((result.helpKillChance ?? HELP_FAIL_CHANCE) * 100)}% 概率 · 丢失 ${result.snap} 次）${q}${playActionSuffix(result)}`;
        case 'withdrawal':
            return `${pickRandom(WITHDRAWAL_MESSAGES)}（剩余 ${result.count} 次）`;
        case 'withdrawal_ascetic':
            return `${pickRandom(WITHDRAWAL_MESSAGES)} 戒灵师再 -${result.asceticBonus || 1}！（剩余 ${result.count} 次）`;
        case 'together_fall':
            return `${pickRandom(TOGETHER_FALL_MESSAGES)}\n你：${result.selfCount} 次 · ${targetName || 'ta'}：${result.targetCount} 次（各 -${result.cost}）`;
        case 'help_withdraw':
            return `${helperName || '你'} ${pickRandom(HELP_WITHDRAW_SUCCESS)}（现 ${result.count} 次）${result.helpWithdrawSaved ? ' · 清规留存：本次不耗帮戒次数' : ''}${wq}`;
        case 'help_withdraw_extra':
            return `${helperName || '你'} ${pickRandom(HELP_WITHDRAW_SUCCESS)} 戒灵师联动再 -${result.withdrawExtra || 1}！（现 ${result.count} 次）${result.helpWithdrawSaved ? ' · 清规留存：本次不耗帮戒次数' : ''}${wq}`;
        case 'help_withdraw_fail': {
            const failPct = Math.round((result.failChance ?? HELP_WITHDRAW_FAIL_CHANCE) * 100);
            return `${helperName || '你'} 帮戒 ${targetName || 'ta'} ${pickRandom(HELP_WITHDRAW_FAIL_MESSAGES)}（${failPct}% 失手 · 仍为 ${result.count} 次）${wq}`;
        }
        case 'privilege_revive':
            return `${pickRandom(PRIVILEGE_REVIVE_MESSAGES)}${result.wasDead ? '（原鹿死状态已解除）' : ''}（今日 ${result.count} 次）`;
        case 'imperial_clearance':
            return `${pickRandom(IMPERIAL_CLEARANCE_MESSAGES)}（${result.cleared} 人可再战皇城鹿）`;
        case 'help_quota_clearance':
            return `${pickRandom(HELP_QUOTA_CLEARANCE_MESSAGES)}（${result.cleared} 人配额已重置）`;
        case 'playful_clearance':
            return `${pickRandom(PLAYFUL_CLEARANCE_MESSAGES)}（${result.cleared} 人恶趣味次数已重置）`;
        case 'amnesty_all':
            return `${pickRandom(AMNESTY_ALL_MESSAGES)}（还阳 ${result.revived} 人 · 玩法重置 ${result.metaReset} 人）`;
        case 'imperial_win': {
            const yujieNote = result.yujieDaipai
                ? ' · 带派脚丫子必胜'
                : (result.yujieBonus ? ' · 语姐皇城胜势' : '');
            return `${pickRandom(IMPERIAL_WIN_MESSAGES)} · ${targetName || '鹿王'} 现 ${result.kingCount} 次${yujieNote}`;
        }
        case 'imperial_lose': {
            const kingPart = result.kingBonus
                ? ` · ${targetName || '鹿王'} +${result.kingBonus} 现 ${result.kingCount} 次`
                : ` · ${targetName || '鹿王'} 现 ${result.kingCount} 次`;
            return `${pickRandom(IMPERIAL_LOSE_MESSAGES)} · 你现 ${result.challengerCount} 次${kingPart}`;
        }
        case 'arena_win_challenger':
            return `${helperName || '挑战者'} 擂台胜 ${targetName || 'ta'}！${pickRandom(ARENA_WIN_MESSAGES)}\n${helperName}：${result.challengerCount} 次 · ${targetName}：${result.targetCount} 次（±${result.stake}）`;
        case 'arena_win_target':
            return `${targetName || '应战者'} 擂台胜 ${helperName || '挑战者'}！${pickRandom(ARENA_WIN_MESSAGES)}\n${helperName}：${result.challengerCount} 次 · ${targetName}：${result.targetCount} 次（±${result.stake}）`;
        case 'arena_decline':
            return pickRandom(ARENA_DECLINE_MESSAGES);
        case 'steal_success': {
            const bonus = result.stealBonus > 0
                ? ` · 借咒 +${Math.round(result.stealBonus * 100)}%`
                : '';
            const snap = result.stolenFromSnap ? ' · 偷自冥库' : '';
            const saved = result.stealQuotaSaved ? ' · 窃影留存：本次不耗偷鹿次数' : '';
            return `${helperName || '你'} ${pickRandom(STEAL_SUCCESS_MESSAGES)}${bonus}${snap}${saved}\n你：${result.thiefCount} 次 · ${targetName}：${result.targetCount} 次（偷鹿 ${result.stealUsed}/${qDenom(result, 'stealUsed', 'stealLeft', 'stealMax', DAILY_STEAL_QUOTA)}）`;
        }
        case 'steal_fail':
            return `${helperName || '你'} ${pickRandom(STEAL_FAIL_MESSAGES)}（偷鹿 ${result.stealUsed}/${qDenom(result, 'stealUsed', 'stealLeft', 'stealMax', DAILY_STEAL_QUOTA)}）`;
        case 'steal_backfire':
            return `${helperName || '你'} ${pickRandom(STEAL_BACKFIRE_MESSAGES)} 现 ${result.thiefCount} 次（偷鹿 ${result.stealUsed}/${qDenom(result, 'stealUsed', 'stealLeft', 'stealMax', DAILY_STEAL_QUOTA)}）`;
        case 'steal_curse_backfire':
            return `${helperName || '你'} ${pickRandom(STEAL_BACKFIRE_MESSAGES)} ${pickRandom(STEAL_CURSE_BACKFIRE_MESSAGES)} 现 ${result.thiefCount} 次（偷鹿 ${result.stealUsed}/${qDenom(result, 'stealUsed', 'stealLeft', 'stealMax', DAILY_STEAL_QUOTA)}）`;
        case 'steal_curse_fail':
            return `${helperName || '你'} ${pickRandom(STEAL_FAIL_MESSAGES)} ${pickRandom(STEAL_CURSE_BACKFIRE_MESSAGES)}（偷鹿 ${result.stealUsed}/${qDenom(result, 'stealUsed', 'stealLeft', 'stealMax', DAILY_STEAL_QUOTA)}）`;
        case 'curse': {
            const asc = result.ascended ? ` ${pickRandom(CURSE_ASCENDED_MESSAGES)}` : '';
            const pct = Math.round((result.bonus ?? 0.1) * result.curseStacks * 100);
            const saved = result.curseQuotaSaved ? ' · 咒缚留存：本次不耗鹿咒次数' : '';
            return `${helperName || '你'} 对 ${targetName || 'ta'} ${pickRandom(CURSE_MESSAGES)}（${result.curseStacks} 层 · 剩 ${result.curseRounds}/${CURSE_MAX_ROUNDS} 回合 · 叠毒 +${pct}%）${asc}${saved}（${result.curseUsed}/${qDenom(result, 'curseUsed', 'curseLeft', 'curseMax', DAILY_CURSE_QUOTA)}）`;
        }
        case 'cleanse_curse':
            return `${helperName || '你'} 为 ${targetName || 'ta'} ${pickRandom(CLEANSE_CURSE_MESSAGES)}（撕掉 ${result.clearedStacks} 层 · ${result.cleanseUsed}/${qDenom(result, 'cleanseUsed', 'cleanseLeft', 'cleanseMax', DAILY_CLEANSE_CURSE_QUOTA)}）`;
        case 'bless': {
            const pct = Math.round((result.reduce ?? BLESS_DEATH_REDUCE) * result.blessStacks * 100);
            return `${helperName || '你'} 对 ${targetName || 'ta'} ${pickRandom(BLESS_MESSAGES)}（${result.blessStacks} 层 · 剩 ${result.blessRounds}/${BLESS_MAX_ROUNDS} 回合 · 减鹿死 -${pct}%）（${result.blessUsed}/${qDenom(result, 'blessUsed', 'blessLeft', 'blessMax', DAILY_BLESS_QUOTA)}）`;
        }
        case 'cleanse_bless':
            return `${helperName || '你'} 为 ${targetName || 'ta'} ${pickRandom(CLEANSE_BLESS_MESSAGES)}（撕掉 ${result.clearedStacks} 层 · ${result.cleanseBlessUsed}/${qDenom(result, 'cleanseBlessUsed', 'cleanseBlessLeft', 'cleanseBlessMax', DAILY_CLEANSE_BLESS_QUOTA)}）`;
        case 'sacrifice': {
            const purge = result.cursePurged ? ' · 顺带净化 1 层咒' : '';
            return `${helperName || '你'} ${pickRandom(SACRIFICE_MESSAGES)}${purge}\n你：${result.selfCount} 次 · ${targetName}：${result.targetCount} 次`;
        }
        case 'fake_withdraw':
            return `${pickRandom(FAKE_WITHDRAW_MESSAGES)}（对外显示约 ${result.fakeCount} 次，实际 ${result.count} 次 · ${result.fakeWithdrawUsed}/${qDenom(result, 'fakeWithdrawUsed', 'fakeWithdrawLeft', 'fakeWithdrawMax', DAILY_FAKE_WITHDRAW_QUOTA)}）`;
        case 'urge': {
            const who = result.selfTarget ? '你' : (targetName || 'ta');
            const buff = result.buffApplied
                ? `${who} 催更符 ×${result.buffStacks ?? 1}（下次自🦌 +1 再 +${result.buffStacks ?? 1}）`
                : '催更符未生效';
            const bless = result.blessStacks ? ` · 鹿福 ×${result.blessStacks} 共存` : '';
            const curse = result.curseUrged ? ` · 咒回合 -1（剩 ${result.curseRounds}）` : '';
            return `${helperName || '你'} ${pickRandom(URGE_MESSAGES)}（${buff}${bless}${curse} · ${result.urgeUsed}/${qDenom(result, 'urgeUsed', 'urgeLeft', 'urgeMax', DAILY_URGE_QUOTA)}）`;
        }
        case 'howl': {
            const base = pickHowlMessage(result.count, false);
            const howlCap = qDenom(result, 'howlUsed', 'howlLeft', 'howlMax', DAILY_HOWL_QUOTA);
            if (result.howlEffect === 'cleanse' || result.howlEffect === 'bonus_cleanse') {
                const left = result.curseStacks ? `剩 ${result.curseStacks} 层咒` : '咒已清';
                return `${base}\n吉兆震散 1 层咒！${left}（${result.howlUsed}/${howlCap}）`;
            }
            if (result.howlEffect === 'bonus') {
                return `${base}\n${pickRandom(HOWL_BONUS_MESSAGES)} 现 ${result.count} 次（${result.howlUsed}/${howlCap}）`;
            }
            if (result.howlEffect === 'trap') {
                return `${base}\n${pickRandom(HOWL_TRAP_MESSAGES)} 现 ${result.count} 次（${result.howlUsed}/${howlCap}）`;
            }
            return `${base}（${result.howlUsed}/${howlCap}）`;
        }
        case 'howl_dead':
            return `${pickHowlMessage(0, true)}（${result.howlUsed}/${qDenom(result, 'howlUsed', 'howlLeft', 'howlMax', DAILY_HOWL_QUOTA)}）`;
        case 'howl_dead_haunt':
            return `${pickHowlMessage(0, true)}\n${pickRandom(HOWL_DEAD_HAUNT_MESSAGES)}（鸣魂 ${result.howlUsed}/${qDenom(result, 'howlUsed', 'howlLeft', 'howlMax', DAILY_HOWL_QUOTA)}）`;
        case 'greed_success': {
            const strip = result.curseStripped ? ' · 顺手撕 1 层咒' : '';
            return `${helperName || '你'} ${pickRandom(GREED_SUCCESS_MESSAGES)}${strip}\n你：${result.selfCount} 次 · ${targetName}：${result.targetCount} 次`;
        }
        case 'greed_fail':
            return `${helperName || '你'} ${pickRandom(GREED_FAIL_MESSAGES)} 现 ${result.selfCount} 次`;
        case 'group_splash': {
            const curseNote = result.cursedCount > 0
                ? `\n${pickRandom(GROUP_SPLASH_CURSE_EXTRA)}（${result.cursedCount} 人叠咒）`
                : '';
            const burstNote = result.burstCount > 0
                ? `\n${pickRandom(GROUP_SPLASH_BURST_MESSAGES)}（${result.burstCount} 人）`
                : '';
            return `${helperName || '你'} ${pickRandom(GROUP_SPLASH_MESSAGES)} 日榜 Top${result.targetCount} 命中 ${result.totalHit} 人各 -${result.damage}${burstNote}${curseNote} · 你反噬 -${result.recoil} 现 ${result.casterCount} 次（群鹿溅 ${result.splashUsed}/${qDenom(result, 'splashUsed', 'splashLeft', 'splashMax', DAILY_GROUP_SPLASH_QUOTA)}）`;
        }
        case 'borrow': {
            const strip = result.curseStripped ? ' · 利息撕 1 层咒' : '';
            return `${helperName || '你'} 向 ${targetName || 'ta'} ${pickRandom(BORROW_MESSAGES)}${strip}\n你：${result.selfCount} 次 · ${targetName}：${result.targetCount} 次（借鹿 ${result.borrowUsed}/${qDenom(result, 'borrowUsed', 'borrowLeft', 'borrowMax', DAILY_BORROW_QUOTA)}）`;
        }
        case 'bumper_win': {
            const curse = result.curseApplied ? ` ${pickRandom(BUMPER_CURSE_EXTRA)}` : '';
            return `${helperName || '你'} 对 ${targetName || 'ta'} ${pickRandom(BUMPER_WIN_MESSAGES)}${curse}\n你：${result.selfCount} 次 · ${targetName}：${result.targetCount} 次（碰瓷 ${result.bumperUsed}/${qDenom(result, 'bumperUsed', 'bumperLeft', 'bumperMax', DAILY_BUMPER_QUOTA)}）`;
        }
        case 'bumper_draw':
            return `${helperName || '你'} 与 ${targetName || 'ta'} ${pickRandom(BUMPER_DRAW_MESSAGES)}\n你：${result.selfCount} 次 · ${targetName}：${result.targetCount} 次（碰瓷 ${result.bumperUsed}/${qDenom(result, 'bumperUsed', 'bumperLeft', 'bumperMax', DAILY_BUMPER_QUOTA)}）`;
        case 'bumper_fail':
            return `${helperName || '你'} ${pickRandom(BUMPER_FAIL_MESSAGES)} 现 ${result.selfCount} 次（碰瓷 ${result.bumperUsed}/${qDenom(result, 'bumperUsed', 'bumperLeft', 'bumperMax', DAILY_BUMPER_QUOTA)}）`;
        case 'lottery': {
            const outcomeMap = {
                plus: LOTTERY_PLUS_MESSAGES,
                minus: LOTTERY_MINUS_MESSAGES,
                urge: LOTTERY_URGE_MESSAGES,
                curse: LOTTERY_CURSE_MESSAGES,
                cleanse: LOTTERY_CLEANSE_MESSAGES,
                blank: LOTTERY_BLANK_MESSAGES,
            };
            const msgs = outcomeMap[result.outcome] || LOTTERY_BLANK_MESSAGES;
            const curseNote = result.curseStacks > 0
                ? ` · 咒 ${result.curseStacks} 层`
                : '';
            const urgeNote = result.outcome === 'urge' && result.buffStacks
                ? ` · 催更符 ×${result.buffStacks}（下次自🦌 +1 再 +${result.buffStacks}）`
                : '';
            return `${pickRandom(msgs)} 现 ${result.count} 次${urgeNote}${curseNote}（鹿签 ${result.lotteryUsed}/${qDenom(result, 'lotteryUsed', 'lotteryLeft', 'lotteryMax', DAILY_LOTTERY_QUOTA)}）`;
        }
        case 'spectral_curse': {
            const asc = result.ascended ? ` ${pickRandom(CURSE_ASCENDED_MESSAGES)}` : '';
            return `${helperName || '亡魂'} 对 ${targetName || 'ta'} ${pickRandom(SPECTRAL_CURSE_MESSAGES)}（${result.curseStacks} 层 · 剩 ${result.curseRounds}/${CURSE_MAX_ROUNDS} 回合）${asc}（冥咒 ${result.spectralCurseUsed}/${qDenom(result, 'spectralCurseUsed', 'spectralCurseLeft', 'spectralCurseMax', DAILY_SPECTRAL_CURSE_QUOTA)}）`;
        }
        case 'vengeance_curse':
            return `${helperName || '亡魂'} ${pickRandom(VENGEANCE_CURSE_MESSAGES)}（${targetName || '凶手'} 现 ${result.targetCount} 次 · 咒 ${result.curseStacks} 层 · 索命 ${result.vengeanceUsed}/${qDenom(result, 'vengeanceUsed', 'vengeanceLeft', 'vengeanceMax', DAILY_VENGEANCE_QUOTA)}）`;
        case 'vengeance_deduct':
            return `${helperName || '亡魂'} ${pickRandom(VENGEANCE_DEDUCT_MESSAGES)}（${targetName || '凶手'} 现 ${result.targetCount} 次 · 索命 ${result.vengeanceUsed}/${qDenom(result, 'vengeanceUsed', 'vengeanceLeft', 'vengeanceMax', DAILY_VENGEANCE_QUOTA)}）`;
        case 'vengeance_substitute':
            return `${helperName || '亡魂'} ${pickRandom(VENGEANCE_SUBSTITUTE_MESSAGES)}（${targetName || '替身'} 现 ${result.targetCount} 次 · 咒 ${result.curseStacks} 层 · 索命 ${result.vengeanceUsed}/${qDenom(result, 'vengeanceUsed', 'vengeanceLeft', 'vengeanceMax', DAILY_VENGEANCE_QUOTA)}）`;
        case 'vengeance_fail':
            return `${helperName || '亡魂'} ${pickRandom(VENGEANCE_FAIL_MESSAGES)}（索命 ${result.vengeanceUsed}/${qDenom(result, 'vengeanceUsed', 'vengeanceLeft', 'vengeanceMax', DAILY_VENGEANCE_QUOTA)}）`;
        case 'dream': {
            const effectMsg = result.dreamEffect === 'soothe'
                ? pickRandom(DREAM_SOOTHE_MESSAGES)
                : pickRandom(DREAM_URGE_MESSAGES);
            const curseNote = result.curseStacks > 0
                ? ` · 咒剩 ${result.curseRounds} 回合`
                : '';
            return `${helperName || '亡魂'} 托梦 ${targetName || '🦌友'}：${effectMsg}${curseNote}（托梦 ${result.dreamUsed}/${qDenom(result, 'dreamUsed', 'dreamLeft', 'dreamMax', DAILY_DREAM_QUOTA)}）`;
        }
        case 'revive_lottery_full':
            return `${pickRandom(REVIVE_LOTTERY_FULL_MESSAGES)} 恢复 ${result.restored} 次（还阳签 ${result.reviveLotteryUsed}/${qDenom(result, 'reviveLotteryUsed', 'reviveLotteryLeft', 'reviveLotteryMax', DAILY_REVIVE_LOTTERY_QUOTA)}）`;
        case 'revive_lottery_weak': {
            const poolNote = result.poolLeft > 0 ? `，另有 ${result.poolLeft} 次待还阳` : '';
            return `${pickRandom(REVIVE_LOTTERY_WEAK_MESSAGES)} 现 ${result.count} 次${poolNote}（还阳签 ${result.reviveLotteryUsed}/${qDenom(result, 'reviveLotteryUsed', 'reviveLotteryLeft', 'reviveLotteryMax', DAILY_REVIVE_LOTTERY_QUOTA)}）`;
        }
        case 'revive_lottery_blank':
            return `${pickRandom(REVIVE_LOTTERY_BLANK_MESSAGES)} 仍丢失 ${result.lostCount} 次（还阳签 ${result.reviveLotteryUsed}/${qDenom(result, 'reviveLotteryUsed', 'reviveLotteryLeft', 'reviveLotteryMax', DAILY_REVIVE_LOTTERY_QUOTA)}）`;
        case 'tombstone': {
            const reason = getDeathReasonText(result.deathReason);
            const killerLine = targetName
                ? `凶手：${targetName}`
                : (result.killerId ? `凶手 QQ：${result.killerId}` : '凶手：无（过🦌/自尽等）');
            return [
                TOMBSTONE_HEADER,
                `丢失：${result.lostCount} 次 · 死因：${reason}`,
                killerLine,
                `今日尝试 ${result.attempts} · 累计鹿死 ${result.deathCount} · 被帮 ${result.helped} · 被救 ${result.revived}`,
                '冥界可用：冥咒/索命/托梦/还阳签 · 活人请帮🦌救活',
            ].join('\n');
        }
        case 'profession_set': {
            const p = result.profession;
            if (result.quota) {
                return [
                    `${p.emoji} 转职成功：${p.name}（今日已锁定）`,
                    formatHelperQuotaReply(result.quota, 'all'),
                ].join('\n');
            }
            return [
                `${p.emoji} 转职成功：${p.name}（今日已锁定）`,
                p.tagline,
                `帮鹿 ${p.helpQuota}/日 · 帮戒 ${p.helpWithdrawQuota}/日`,
            ].join('\n');
        }
        case 'profession_same': {
            const p = result.profession;
            const quotaText = result.quota ? `\n${formatHelperQuotaReply(result.quota, 'all')}` : '';
            return `你已是 ${p.emoji}${p.name}，无需重复转职${quotaText}`;
        }
        case 'job_skill_info': {
            if (result.professionRequired) {
                return [
                    '🎭 今日尚未转职，专属技不可用',
                    ERROR_MESSAGES.profession_required,
                ].join('\n');
            }
            const skill = result.skill;
            const statusLine = result.used
                ? '今日专属技：已使用'
                : (result.patrolPending ? '今日专属技：可用 · 天象巡游已蓄势' : '今日专属技：可用');
            return [
                `⚡ ${skill?.name || '专属技'}`,
                skill?.desc || '',
                `指令：${skill?.cmd || '见说明书'}`,
                statusLine,
                result.balancedScore > 0
                    ? `综合 ${result.balancedScore} 分 · ${result.balancedBreakdown || ''}`
                    : '',
            ].filter(Boolean).join('\n');
        }
        case 'job_skill_patrol':
            return `🦌 天象巡游开启！下一次玩法天象正向修正 ×${result.amp || 1.42}（与巡游被动叠加）${result.lotteryLuckBonus ? ` · 下一次抽鹿签吉运 +${Math.round(result.lotteryLuckBonus * 100)}%` : ''}${result.lotteryQuotaBonus ? ` · 当日鹿签 +${result.lotteryQuotaBonus}` : ''}`;
        case 'job_skill_grinder_rush':
            return `🔥 卷王冲锋！强制安全 +${result.gain || 2}（现 ${result.count}/${result.safeLimit ?? DAILY_SAFE_LIMIT}）${result.rushShieldMult ? ` · 下一次超限自🦌鹿死 ×${result.rushShieldMult}` : ''}${result.arenaQuotaBonus ? ` · 当日擂台 +${result.arenaQuotaBonus}` : ''}${weatherHint(result)}`;
        case 'job_skill_medic_revive': {
            const medic = result.medicCleanse ? ' · 妙手清咒' : (result.medicBless ? ' · 顺手贴福' : '');
            const quota = result.skillHelpQuotaBonus ? ` · 当日帮鹿 +${result.skillHelpQuotaBonus}` : '';
            return `${helperName || '你'} 妙手愈鹿救活 ${targetName || 'ta'}！${pickRandom(REVIVE_MESSAGES)}（恢复 ${result.count} 次 · 不占帮鹿配额）${medic}${quota}`;
        }
        case 'job_skill_medic_help': {
            const medic = result.medicCleanse ? ' · 妙手清咒' : (result.medicBless ? ' · 顺手贴福' : '');
            const quota = result.skillHelpQuotaBonus ? ` · 当日帮鹿 +${result.skillHelpQuotaBonus}` : '';
            return `${helperName || '你'} 妙手愈鹿帮 ${targetName || 'ta'} +1（${result.count}/${result.safeLimit ?? DAILY_SAFE_LIMIT} · 零失手 · 不占配额）${medic}${quota}${weatherHint(result)}`;
        }
        case 'job_skill_ascetic_cleanse':
            return `${helperName || '你'} 清规戒律！帮 ${targetName || 'ta'} -${result.withdrawAmount || 3}（现 ${result.count} 次 · 零失手 · 不占帮戒配额）${result.helpWithdrawQuotaBonus ? ` · 当日帮戒 +${result.helpWithdrawQuotaBonus}` : ''}`;
        case 'job_skill_curser_bind': {
            const note = result.curseRefreshed ? ' · 满层续回合' : '';
            return `${helperName || '你'} 咒缚！${targetName || 'ta'} 叠咒至 ${result.curseStacks} 层${note}（不占鹿咒配额）${result.curseQuotaBonus ? ` · 当日鹿咒 +${result.curseQuotaBonus}` : ''}`;
        }
        case 'job_skill_blesser_grant': {
            const strip = result.curseStripped ? ' · 先撕 1 层咒' : '';
            return `${helperName || '你'} 广福！${targetName || 'ta'} 鹿福至 ${result.blessStacks} 层${strip}（不占鹿福配额）${result.blessQuotaBonus ? ` · 当日鹿福 +${result.blessQuotaBonus}` : ''}`;
        }
        case 'job_skill_sunflower_facing': {
            const parts = [`催更 +${result.urgeStacks || 2}`, `鹿福 ${result.blessStacks} 层`];
            if (result.countGain) parts.push(`滋养 +${result.countGain}`);
            if (result.curseCleared) parts.push(`清咒 ${result.curseCleared} 层`);
            const quota = (result.urgeQuotaBonus || result.blessQuotaBonus)
                ? ` · 当日催鹿 +${result.urgeQuotaBonus || 0} · 鹿福 +${result.blessQuotaBonus || 0}`
                : '';
            return `${helperName || '你'} 向阳！${targetName || 'ta'} ${parts.join(' · ')}（现 ${result.count} 次 · 不占催鹿/鹿福配额）${quota}`;
        }
        case 'job_skill_rogue_raid_success':
            return `${helperName || '你'} 夜袭得手！你 ${result.thiefCount} 次 · ${targetName || 'ta'} ${result.targetCount} 次（${Math.round((result.nightChance ?? 0.92) * 100)}% · 不占偷鹿配额）${result.stealQuotaBonus ? ` · 当日偷鹿 +${result.stealQuotaBonus}` : ''}`;
        case 'job_skill_rogue_raid_fail':
            return `${helperName || '你'} 夜袭失手，全身而退（不占偷鹿配额 · 不扣次数）${result.stealQuotaBonus ? ` · 当日偷鹿 +${result.stealQuotaBonus}` : ''}`;
        case 'deer_cart_invite':
            return ERROR_MESSAGES.cart_invited(targetName || 'ta');
        case 'deer_cart_depart':
            return `${helperName || '你'} 发车！与 ${targetName || 'ta'} 同乘鹿车 · 连鹿至死/帮鹿用尽（详情见聊天记录）`;
        case 'job_skill_meijia_team':
            return `${helperName || '你'} 组队成功！与 ${targetName || 'ta'} 绑定：王美嘉自鹿 +1 时 ta 同步 +1（每日最多 5 次 · 净值≥0）· 任一方鹿死双亡 · 王美嘉不可戒鹿`;
        case 'job_skill_yumumu_bind':
            return `${helperName || '你'} 束缚！${targetName || 'ta'} ${result.banMinutes ?? YUMUMU_BIND_MINUTES} 分钟内无法自鹿（仍可被帮鹿）· 仅 ${formatYumumuBindCutoffHint()}可用`;
        case 'job_skill_yujie_daipai':
            return `${helperName || '你'} 带派！脚丫子蓄势 · 下一次皇城鹿掷骰必胜`;
        case 'job_skill_xuyuezhen_chaos': {
            const tag = XUYUEZHEN_CHAOS_OUTCOME_LABELS[result.outcome] || result.outcome;
            const extra = result.curseStacks ? ` · 咒 ${result.curseStacks} 层` : '';
            const blessNote = result.blessStacks ? ` · 福 ${result.blessStacks} 层` : '';
            return `${helperName || '你'} 操你血妈！${tag} · 现 ${result.count} 次${extra}${blessNote}`;
        }
        default:
            return result.message || '操作完成';
    }
}

export function formatViewEmpty(label, isAt) {
    return UI_MESSAGES.view_empty(label, isAt);
}

export function formatRankEmpty(scope) {
    return UI_MESSAGES.rank_empty(scope);
}

export function formatFriendAddMessage(myName, targetName) {
    return [
        `${myName} 与 ${targetName} ${pickRandom(FRIEND_ADD_MESSAGES)}`,
        pickRandom(FRIEND_ADD_NOTIFY),
        '可「帮🦌」「借鹿」「鹿福」「偷鹿」「鹿咒」「碰瓷鹿」「抽鹿签」等互助/互害',
    ].join('\n');
}

export function formatFriendRemoveMessage(myName, targetName) {
    return `${myName} 与 ${targetName} ${pickRandom(FRIEND_REMOVE_MESSAGES)}`;
}

export function formatFriendEmpty() {
    return pickRandom(FRIEND_EMPTY_MESSAGES);
}

export function formatFriendNotInGroup() {
    return pickRandom(FRIEND_NOT_IN_GROUP);
}

export function formatFriendAlready() {
    return pickRandom(FRIEND_ALREADY_MESSAGES);
}

export function pickFriendListTitle() {
    return pickRandom(FRIEND_LIST_TITLES);
}
