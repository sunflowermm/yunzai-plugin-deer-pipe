/**
 * 统一文案格式化（所有用户可见文本经此出口）
 */
import {
    ALREADY_DEAD_MESSAGES,
    ARENA_LOSE_MESSAGES,
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
    DAILY_SACRIFICE_QUOTA,
    DAILY_STEAL_QUOTA,
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
    HELP_KILL_CHANCE,
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
    IMPERIAL_PK_HINTS,
    IMPERIAL_CLEARANCE_MESSAGES,
    HELP_QUOTA_CLEARANCE_MESSAGES,
    PLAYFUL_CLEARANCE_MESSAGES,
    AMNESTY_ALL_MESSAGES,
    ACTOR_DEAD_MESSAGES,
    TARGET_DEAD_MESSAGES,
    OVERLIMIT_DEATH_CHANCE_STEP,
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

export { getDeathReasonText, getDeathCellLabel } from '../constants/game.js';

function quotaHint(result) {
    return result.helpQuotaLeft != null
        ? `（帮🦌剩余 ${result.helpQuotaLeft}/${result.helpQuotaMax ?? DAILY_HELP_QUOTA}）`
        : '';
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
    return result.helpWithdrawLeft != null
        ? `（帮戒🦌剩余 ${result.helpWithdrawLeft}/${result.helpWithdrawMax ?? DAILY_HELP_WITHDRAW_QUOTA}）`
        : '';
}

/** 互助配额查询/职业面板文案 */
export function formatHelperQuotaReply(snapshot, mode = 'all') {
    if (snapshot?.professionRequired) {
        return [
            '🎭 今日尚未转职，玩法已封印',
            ERROR_MESSAGES.profession_required,
            '转职后发送「鹿配额」查看互助剩余',
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
        lines.push('转职：转职鹿医 / 转职戒师 / 转职卷王 / 转职巡游');
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
            const max = result.helpQuotaMax ?? DAILY_HELP_QUOTA;
            const used = result.helpQuotaUsed ?? max;
            return result.message || pickRandom(HELP_QUOTA_MESSAGES)
                || ERROR_MESSAGES.help_quota(used, max);
        }
        case 'help_withdraw_quota': {
            const max = result.helpWithdrawMax ?? DAILY_HELP_WITHDRAW_QUOTA;
            const used = result.helpWithdrawUsed ?? max;
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
        case 'withdrawal_dead':
            return ERROR_MESSAGES.withdrawal_dead;
        case 'empty':
            return ERROR_MESSAGES.empty;
        case 'together_used':
            return ERROR_MESSAGES.together_used;
        case 'together_self':
            return ERROR_MESSAGES.together_self;
        case 'imperial_used':
            return ERROR_MESSAGES.imperial_used(
                result.imperialUsed ?? DAILY_IMPERIAL_QUOTA,
                DAILY_IMPERIAL_QUOTA,
            );
        case 'arena_used':
            return ERROR_MESSAGES.arena_used(
                result.arenaUsed ?? DAILY_ARENA_QUOTA,
                DAILY_ARENA_QUOTA,
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
            return ERROR_MESSAGES.steal_used(result.stealUsed ?? DAILY_STEAL_QUOTA, DAILY_STEAL_QUOTA);
        case 'steal_target_dead':
            return ERROR_MESSAGES.steal_target_dead;
        case 'steal_empty':
            return ERROR_MESSAGES.steal_empty;
        case 'curse_used':
            return ERROR_MESSAGES.curse_used(result.curseUsed ?? DAILY_CURSE_QUOTA, DAILY_CURSE_QUOTA);
        case 'curse_self':
            return ERROR_MESSAGES.curse_self;
        case 'cleanse_used':
            return ERROR_MESSAGES.cleanse_used(
                result.cleanseUsed ?? DAILY_CLEANSE_CURSE_QUOTA,
                DAILY_CLEANSE_CURSE_QUOTA,
            );
        case 'cleanse_no_curse':
            return ERROR_MESSAGES.cleanse_no_curse;
        case 'bless_used':
            return ERROR_MESSAGES.bless_used(
                result.blessUsed ?? DAILY_BLESS_QUOTA,
                DAILY_BLESS_QUOTA,
            );
        case 'bless_self':
            return ERROR_MESSAGES.bless_self;
        case 'cleanse_bless_used':
            return ERROR_MESSAGES.cleanse_bless_used(
                result.cleanseBlessUsed ?? DAILY_CLEANSE_BLESS_QUOTA,
                DAILY_CLEANSE_BLESS_QUOTA,
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
                result.fakeWithdrawUsed ?? DAILY_FAKE_WITHDRAW_QUOTA,
                DAILY_FAKE_WITHDRAW_QUOTA,
            );
        case 'urge_used':
            return ERROR_MESSAGES.urge_used(result.urgeUsed ?? DAILY_URGE_QUOTA, DAILY_URGE_QUOTA);
        case 'howl_used':
            return ERROR_MESSAGES.howl_used(result.howlUsed ?? DAILY_HOWL_QUOTA, DAILY_HOWL_QUOTA);
        case 'howl_dead':
            return ERROR_MESSAGES.howl_dead;
        case 'greed_used':
            return ERROR_MESSAGES.greed_used;
        case 'greed_self':
            return ERROR_MESSAGES.greed_self;
        case 'splash_used':
            return ERROR_MESSAGES.splash_used(
                result.splashUsed ?? DAILY_GROUP_SPLASH_QUOTA,
                DAILY_GROUP_SPLASH_QUOTA,
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
                result.bumperUsed ?? DAILY_BUMPER_QUOTA,
                DAILY_BUMPER_QUOTA,
            );
        case 'bumper_self':
            return ERROR_MESSAGES.bumper_self;
        case 'lottery_used':
            return ERROR_MESSAGES.lottery_used;
        case 'spectral_curse_used':
            return ERROR_MESSAGES.spectral_curse_used(
                result.spectralCurseUsed ?? DAILY_SPECTRAL_CURSE_QUOTA,
                DAILY_SPECTRAL_CURSE_QUOTA,
            );
        case 'spectral_curse_self':
            return ERROR_MESSAGES.spectral_curse_self;
        case 'vengeance_used':
            return ERROR_MESSAGES.vengeance_used(
                result.vengeanceUsed ?? DAILY_VENGEANCE_QUOTA,
                DAILY_VENGEANCE_QUOTA,
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
            return result.message || ERROR_MESSAGES.default;
    }
}

/** 操作结果文案 */
export function formatActionMessage(result, ctx = {}) {
    const { helperName, targetName, dice, diceSide, choice } = ctx;
    const helpFailPct = Math.round((HELP_FAIL_CHANCE ?? HELP_KILL_CHANCE) * 100);
    if (!result.ok) return formatErrorMessage(result);
    const q = quotaHint(result);
    const wq = withdrawQuotaHint(result);
    switch (result.type) {
        case 'safe':
            return `${pickRandom(SAFE_MESSAGES)}（${result.count}/${result.safeLimit ?? DAILY_SAFE_LIMIT}）${weatherHint(result)}`;
        case 'safe_grinder':
            return `${pickRandom(SAFE_MESSAGES)} 卷王连击 +${result.grinderBonus || 1}！（${result.count}/${result.safeLimit ?? DAILY_SAFE_LIMIT}）${weatherHint(result)}`;
        case 'safe_urged':
            return `${pickRandom(SAFE_MESSAGES)} ${pickRandom(URGE_BUFF_MESSAGES)}（${result.count}/${result.safeLimit ?? DAILY_SAFE_LIMIT}）${weatherHint(result)}`;
        case 'risky':
            return `${pickRandom(RISKY_SURVIVE_MESSAGES)} 今日 ${result.count} 次${riskHint(result)}${weatherHint(result)}`;
        case 'risky_cursed':
            return `${pickRandom(CURSED_LU_MESSAGES)} ${pickRandom(RISKY_SURVIVE_MESSAGES)} 今日 ${result.count} 次${riskHint(result)}${weatherHint(result)}`;
        case 'risky_blessed':
            return `${pickRandom(BLESSED_LU_MESSAGES)} ${pickRandom(RISKY_SURVIVE_MESSAGES)} 今日 ${result.count} 次${riskHint(result)}${weatherHint(result)}`;
        case 'risky_mixed':
            return `${pickRandom(CURSED_LU_MESSAGES)} ${pickRandom(BLESSED_LU_MESSAGES)} 福咒对冲！今日 ${result.count} 次${riskHint(result)}${weatherHint(result)}`;
        case 'death': {
            const pct = formatChancePercent(result.deathChance ?? 0);
            const pctText = pct ? `（触发 ${pct}% 判定）` : '';
            return `${pickDeathMessage(DEATH_REASON.SELF)}${pctText}（丢失 ${result.snap} 次）${weatherHint(result)}`;
        }
        case 'death_cursed': {
            const pct = formatChancePercent(result.deathChance ?? 0);
            const stackNote = result.curseStacks ? ` · ${result.curseStacks} 层咒` : '';
            const pctText = pct ? `（含鹿咒${stackNote}，触发 ${pct}% 判定）` : '';
            return `${pickRandom(CURSED_LU_MESSAGES)} ${pickDeathMessage(DEATH_REASON.SELF)}${pctText}（丢失 ${result.snap} 次）${weatherHint(result)}`;
        }
        case 'death_blessed': {
            const pct = formatChancePercent(result.deathChance ?? 0);
            const stackNote = result.blessStacks ? ` · ${result.blessStacks} 层福` : '';
            const pctText = pct ? `（含鹿福${stackNote}，触发 ${pct}% 判定）` : '';
            return `${pickRandom(BLESSED_LU_MESSAGES)} ${pickDeathMessage(DEATH_REASON.SELF)}${pctText}（丢失 ${result.snap} 次）${weatherHint(result)}`;
        }
        case 'death_mixed': {
            const pct = formatChancePercent(result.deathChance ?? 0);
            const pctText = pct ? `（福咒对冲${modifierDeathNote(result)}，触发 ${pct}% 判定）` : '';
            return `${pickDeathMessage(DEATH_REASON.SELF)}${pctText}（丢失 ${result.snap} 次）${weatherHint(result)}`;
        }
        case 'revive':
            return `${helperName || '🦌友'} 救活 ${targetName || 'ta'}！${pickRandom(REVIVE_MESSAGES)}（恢复 ${result.count} 次 · 咒印尽散）${q}`;
        case 'help_revive_fail':
            return `${helperName || '你'} 救 ${targetName || 'ta'} ${pickRandom(HELP_REVIVE_FAIL_MESSAGES)}（${helpFailPct}% 固定概率 · 仍鹿死）${q}`;
        case 'help': {
            const soothe = result.curseSoothe ? ' · 顺手下咒回合 -1' : '';
            const medic = result.medicCleanse ? ' · 鹿医撕咒' : (result.medicBless ? ' · 鹿医贴福' : '');
            return `${helperName || '你'} 帮 ${targetName || 'ta'} ${pickRandom(HELP_SUCCESS_MESSAGES)}（${result.count}/${result.safeLimit ?? DAILY_SAFE_LIMIT}）${soothe}${medic}${q}`;
        }
        case 'help_kill':
            return `${helperName || '你'} 误伤 ${targetName || 'ta'}！${pickDeathMessage(DEATH_REASON.HELP)}（${helpFailPct}% 固定概率 · 丢失 ${result.snap} 次）${q}`;
        case 'help_pull':
            return `${helperName || '你'} 拉 ${targetName || 'ta'} 下马！${pickDeathMessage(DEATH_REASON.PULL)}（${helpFailPct}% 固定概率 · 丢失 ${result.snap} 次）${q}`;
        case 'help_miss':
            return `${helperName || '你'} 想拉 ${targetName || 'ta'} 下马，${pickRandom(HELP_FAIL_MESSAGES)}（${helpFailPct}% 未触发）${q}`;
        case 'withdrawal':
            return `${pickRandom(WITHDRAWAL_MESSAGES)}（剩余 ${result.count} 次）`;
        case 'withdrawal_ascetic':
            return `${pickRandom(WITHDRAWAL_MESSAGES)} 戒灵师再 -${result.asceticBonus || 1}！（剩余 ${result.count} 次）`;
        case 'together_fall':
            return `${pickRandom(TOGETHER_FALL_MESSAGES)}\n你：${result.selfCount} 次 · ${targetName || 'ta'}：${result.targetCount} 次（各 -${result.cost}）`;
        case 'help_withdraw':
            return `${helperName || '你'} ${pickRandom(HELP_WITHDRAW_SUCCESS)}（现 ${result.count} 次）${wq}`;
        case 'help_withdraw_extra':
            return `${helperName || '你'} ${pickRandom(HELP_WITHDRAW_SUCCESS)} 戒灵师联动再 -${result.withdrawExtra || 1}！（现 ${result.count} 次）${wq}`;
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
        case 'imperial_win':
            return `${pickRandom(IMPERIAL_WIN_MESSAGES)} · ${targetName || '鹿王'} 现 ${result.kingCount} 次`;
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
            return `${helperName || '你'} ${pickRandom(STEAL_SUCCESS_MESSAGES)}${bonus}\n你：${result.thiefCount} 次 · ${targetName}：${result.targetCount} 次（偷鹿 ${result.stealUsed}/${DAILY_STEAL_QUOTA}）`;
        }
        case 'steal_fail':
            return `${helperName || '你'} ${pickRandom(STEAL_FAIL_MESSAGES)}（偷鹿 ${result.stealUsed}/${DAILY_STEAL_QUOTA}）`;
        case 'steal_backfire':
            return `${helperName || '你'} ${pickRandom(STEAL_BACKFIRE_MESSAGES)} 现 ${result.thiefCount} 次（偷鹿 ${result.stealUsed}/${DAILY_STEAL_QUOTA}）`;
        case 'steal_curse_backfire':
            return `${helperName || '你'} ${pickRandom(STEAL_BACKFIRE_MESSAGES)} ${pickRandom(STEAL_CURSE_BACKFIRE_MESSAGES)} 现 ${result.thiefCount} 次（偷鹿 ${result.stealUsed}/${DAILY_STEAL_QUOTA}）`;
        case 'steal_curse_fail':
            return `${helperName || '你'} ${pickRandom(STEAL_FAIL_MESSAGES)} ${pickRandom(STEAL_CURSE_BACKFIRE_MESSAGES)}（偷鹿 ${result.stealUsed}/${DAILY_STEAL_QUOTA}）`;
        case 'curse': {
            const asc = result.ascended ? ` ${pickRandom(CURSE_ASCENDED_MESSAGES)}` : '';
            const pct = Math.round((result.bonus ?? 0.1) * result.curseStacks * 100);
            return `${helperName || '你'} 对 ${targetName || 'ta'} ${pickRandom(CURSE_MESSAGES)}（${result.curseStacks} 层 · 剩 ${result.curseRounds}/${CURSE_MAX_ROUNDS} 回合 · 叠毒 +${pct}%）${asc}（${result.curseUsed}/${DAILY_CURSE_QUOTA}）`;
        }
        case 'cleanse_curse':
            return `${helperName || '你'} 为 ${targetName || 'ta'} ${pickRandom(CLEANSE_CURSE_MESSAGES)}（撕掉 ${result.clearedStacks} 层 · ${result.cleanseUsed}/${DAILY_CLEANSE_CURSE_QUOTA}）`;
        case 'bless': {
            const pct = Math.round((result.reduce ?? BLESS_DEATH_REDUCE) * result.blessStacks * 100);
            return `${helperName || '你'} 对 ${targetName || 'ta'} ${pickRandom(BLESS_MESSAGES)}（${result.blessStacks} 层 · 剩 ${result.blessRounds}/${BLESS_MAX_ROUNDS} 回合 · 减鹿死 -${pct}%）（${result.blessUsed}/${DAILY_BLESS_QUOTA}）`;
        }
        case 'cleanse_bless':
            return `${helperName || '你'} 为 ${targetName || 'ta'} ${pickRandom(CLEANSE_BLESS_MESSAGES)}（撕掉 ${result.clearedStacks} 层 · ${result.cleanseBlessUsed}/${DAILY_CLEANSE_BLESS_QUOTA}）`;
        case 'sacrifice': {
            const purge = result.cursePurged ? ' · 顺带净化 1 层咒' : '';
            return `${helperName || '你'} ${pickRandom(SACRIFICE_MESSAGES)}${purge}\n你：${result.selfCount} 次 · ${targetName}：${result.targetCount} 次`;
        }
        case 'fake_withdraw':
            return `${pickRandom(FAKE_WITHDRAW_MESSAGES)}（对外显示约 ${result.fakeCount} 次，实际 ${result.count} 次 · ${result.fakeWithdrawUsed}/${DAILY_FAKE_WITHDRAW_QUOTA}）`;
        case 'urge': {
            const buff = result.buffApplied ? '已贴催🦌符，下次自🦌 +1' : 'ta 今日已有🦌绩，符咒未生效';
            const curse = result.curseUrged ? ` · 咒回合 -1（剩 ${result.curseRounds}）` : '';
            return `${helperName || '你'} ${pickRandom(URGE_MESSAGES)}（${buff}${curse} · ${result.urgeUsed}/${DAILY_URGE_QUOTA}）`;
        }
        case 'howl': {
            const base = pickHowlMessage(result.count, false);
            if (result.howlEffect === 'bonus_cleanse') {
                return `${base}\n${pickRandom(HOWL_BONUS_MESSAGES)} 吉兆震散 1 层咒！现 ${result.count} 次（${result.howlUsed}/${DAILY_HOWL_QUOTA}）`;
            }
            if (result.howlEffect === 'bonus') {
                return `${base}\n${pickRandom(HOWL_BONUS_MESSAGES)} 现 ${result.count} 次（${result.howlUsed}/${DAILY_HOWL_QUOTA}）`;
            }
            if (result.howlEffect === 'trap') {
                return `${base}\n${pickRandom(HOWL_TRAP_MESSAGES)} 现 ${result.count} 次（${result.howlUsed}/${DAILY_HOWL_QUOTA}）`;
            }
            return `${base}（${result.howlUsed}/${DAILY_HOWL_QUOTA}）`;
        }
        case 'howl_dead':
            return `${pickHowlMessage(0, true)}（${result.howlUsed}/${DAILY_HOWL_QUOTA}）`;
        case 'howl_dead_haunt':
            return `${pickHowlMessage(0, true)}\n${pickRandom(HOWL_DEAD_HAUNT_MESSAGES)}（鸣魂 ${result.howlUsed}/${DAILY_HOWL_QUOTA}）`;
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
            return `${helperName || '你'} ${pickRandom(GROUP_SPLASH_MESSAGES)} 日榜 Top${result.targetCount} 命中 ${result.totalHit} 人各 -${result.damage}${burstNote}${curseNote} · 你反噬 -${result.recoil} 现 ${result.casterCount} 次（群鹿溅 ${result.splashUsed}/${DAILY_GROUP_SPLASH_QUOTA}）`;
        }
        case 'borrow': {
            const strip = result.curseStripped ? ' · 利息撕 1 层咒' : '';
            return `${helperName || '你'} 向 ${targetName || 'ta'} ${pickRandom(BORROW_MESSAGES)}${strip}\n你：${result.selfCount} 次 · ${targetName}：${result.targetCount} 次（借鹿 ${result.borrowUsed}/${DAILY_BORROW_QUOTA}）`;
        }
        case 'bumper_win': {
            const curse = result.curseApplied ? ` ${pickRandom(BUMPER_CURSE_EXTRA)}` : '';
            return `${helperName || '你'} 对 ${targetName || 'ta'} ${pickRandom(BUMPER_WIN_MESSAGES)}${curse}\n你：${result.selfCount} 次 · ${targetName}：${result.targetCount} 次（碰瓷 ${result.bumperUsed}/${DAILY_BUMPER_QUOTA}）`;
        }
        case 'bumper_draw':
            return `${helperName || '你'} 与 ${targetName || 'ta'} ${pickRandom(BUMPER_DRAW_MESSAGES)}\n你：${result.selfCount} 次 · ${targetName}：${result.targetCount} 次（碰瓷 ${result.bumperUsed}/${DAILY_BUMPER_QUOTA}）`;
        case 'bumper_fail':
            return `${helperName || '你'} ${pickRandom(BUMPER_FAIL_MESSAGES)} 现 ${result.selfCount} 次（碰瓷 ${result.bumperUsed}/${DAILY_BUMPER_QUOTA}）`;
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
            return `${pickRandom(msgs)} 现 ${result.count} 次${curseNote}（鹿签 ${result.lotteryUsed}/${DAILY_LOTTERY_QUOTA}）`;
        }
        case 'spectral_curse': {
            const asc = result.ascended ? ` ${pickRandom(CURSE_ASCENDED_MESSAGES)}` : '';
            return `${helperName || '亡魂'} 对 ${targetName || 'ta'} ${pickRandom(SPECTRAL_CURSE_MESSAGES)}（${result.curseStacks} 层 · 剩 ${result.curseRounds}/${CURSE_MAX_ROUNDS} 回合）${asc}（冥咒 ${result.spectralCurseUsed}/${DAILY_SPECTRAL_CURSE_QUOTA}）`;
        }
        case 'vengeance_curse':
            return `${helperName || '亡魂'} ${pickRandom(VENGEANCE_CURSE_MESSAGES)}（${targetName || '凶手'} 现 ${result.targetCount} 次 · 咒 ${result.curseStacks} 层 · 索命 ${result.vengeanceUsed}/${DAILY_VENGEANCE_QUOTA}）`;
        case 'vengeance_deduct':
            return `${helperName || '亡魂'} ${pickRandom(VENGEANCE_DEDUCT_MESSAGES)}（${targetName || '凶手'} 现 ${result.targetCount} 次 · 索命 ${result.vengeanceUsed}/${DAILY_VENGEANCE_QUOTA}）`;
        case 'vengeance_substitute':
            return `${helperName || '亡魂'} ${pickRandom(VENGEANCE_SUBSTITUTE_MESSAGES)}（${targetName || '替身'} 现 ${result.targetCount} 次 · 咒 ${result.curseStacks} 层 · 索命 ${result.vengeanceUsed}/${DAILY_VENGEANCE_QUOTA}）`;
        case 'vengeance_fail':
            return `${helperName || '亡魂'} ${pickRandom(VENGEANCE_FAIL_MESSAGES)}（索命 ${result.vengeanceUsed}/${DAILY_VENGEANCE_QUOTA}）`;
        case 'dream': {
            const effectMsg = result.dreamEffect === 'soothe'
                ? pickRandom(DREAM_SOOTHE_MESSAGES)
                : pickRandom(DREAM_URGE_MESSAGES);
            const curseNote = result.curseStacks > 0
                ? ` · 咒剩 ${result.curseRounds} 回合`
                : '';
            return `${helperName || '亡魂'} 托梦 ${targetName || '🦌友'}：${effectMsg}${curseNote}（托梦 ${result.dreamUsed}/${DAILY_DREAM_QUOTA}）`;
        }
        case 'revive_lottery_full':
            return `${pickRandom(REVIVE_LOTTERY_FULL_MESSAGES)} 恢复 ${result.restored} 次（还阳签 ${result.reviveLotteryUsed}/${DAILY_REVIVE_LOTTERY_QUOTA}）`;
        case 'revive_lottery_weak':
            return `${pickRandom(REVIVE_LOTTERY_WEAK_MESSAGES)} 现 ${result.count} 次（还阳签 ${result.reviveLotteryUsed}/${DAILY_REVIVE_LOTTERY_QUOTA}）`;
        case 'revive_lottery_blank':
            return `${pickRandom(REVIVE_LOTTERY_BLANK_MESSAGES)} 仍丢失 ${result.lostCount} 次（还阳签 ${result.reviveLotteryUsed}/${DAILY_REVIVE_LOTTERY_QUOTA}）`;
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
            ].join('\n');
        }
        case 'job_skill_patrol':
            return `🦌 天象巡游开启！下一次玩法天象正向修正 ×${result.amp || 1.35}（与巡游被动叠加）`;
        case 'job_skill_grinder_rush':
            return `🔥 卷王冲锋！强制安全 +${result.gain || 2}（现 ${result.count}/${result.safeLimit ?? DAILY_SAFE_LIMIT}）${weatherHint(result)}`;
        case 'job_skill_medic_revive': {
            const medic = result.medicCleanse ? ' · 妙手撕咒' : (result.medicBless ? ' · 顺手贴福' : '');
            return `${helperName || '你'} 妙手愈鹿救活 ${targetName || 'ta'}！${pickRandom(REVIVE_MESSAGES)}（恢复 ${result.count} 次 · 不占帮鹿配额）${medic}`;
        }
        case 'job_skill_medic_help': {
            const medic = result.medicCleanse ? ' · 妙手撕咒' : (result.medicBless ? ' · 顺手贴福' : '');
            return `${helperName || '你'} 妙手愈鹿帮 ${targetName || 'ta'} +1（${result.count}/${result.safeLimit ?? DAILY_SAFE_LIMIT} · 零失手 · 不占配额）${medic}${weatherHint(result)}`;
        }
        case 'job_skill_ascetic_cleanse':
            return `${helperName || '你'} 清规戒律！帮 ${targetName || 'ta'} -${result.withdrawAmount || 2}（现 ${result.count} 次 · 零失手 · 不占帮戒配额）`;
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
