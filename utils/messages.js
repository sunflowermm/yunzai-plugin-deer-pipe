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
    DAILY_ARENA_QUOTA,
    DAILY_CURSE_QUOTA,
    DAILY_FAKE_WITHDRAW_QUOTA,
    DAILY_HOWL_QUOTA,
    DAILY_SACRIFICE_QUOTA,
    DAILY_STEAL_QUOTA,
    DAILY_URGE_QUOTA,
    DAILY_GROUP_SPLASH_QUOTA,
    FAKE_WITHDRAW_MESSAGES,
    GROUP_SPLASH_CURSE_EXTRA,
    GROUP_SPLASH_MESSAGES,
    GREED_FAIL_MESSAGES,
    GREED_SUCCESS_MESSAGES,
    HOWL_BONUS_MESSAGES,
    HOWL_TRAP_MESSAGES,
    SACRIFICE_MESSAGES,
    STEAL_BACKFIRE_MESSAGES,
    STEAL_FAIL_MESSAGES,
    STEAL_SUCCESS_MESSAGES,
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
        ? `（帮🦌剩余 ${result.helpQuotaLeft}/${DAILY_HELP_QUOTA}）`
        : '';
}

function riskHint(result) {
    const pct = formatChancePercent(result.nextDeathChance ?? result.deathChance ?? 0);
    if (!pct) return '';
    return `，再🦌 ${pct}% 鹿死`;
}

function withdrawQuotaHint(result) {
    return result.helpWithdrawLeft != null
        ? `（帮戒🦌剩余 ${result.helpWithdrawLeft}/${DAILY_HELP_WITHDRAW_QUOTA}）`
        : '';
}

/** 失败/拒绝类文案 */
export function formatErrorMessage(result) {
    switch (result.type) {
        case 'dead':
            return pickRandom(ALREADY_DEAD_MESSAGES);
        case 'actor_dead':
            return pickRandom(ACTOR_DEAD_MESSAGES) || ERROR_MESSAGES.actor_dead;
        case 'helper_dead':
            return pickRandom(HELPER_DEAD_MESSAGES) || ERROR_MESSAGES.helper_dead;
        case 'target_dead':
            return pickRandom(TARGET_DEAD_MESSAGES) || ERROR_MESSAGES.target_dead;
        case 'help_quota':
            return result.message || pickRandom(HELP_QUOTA_MESSAGES)
                || ERROR_MESSAGES.help_quota(DAILY_HELP_QUOTA, DAILY_HELP_QUOTA);
        case 'help_withdraw_quota':
            return pickRandom(HELP_WITHDRAW_QUOTA_MESSAGES)
                || ERROR_MESSAGES.help_withdraw_quota(DAILY_HELP_WITHDRAW_QUOTA, DAILY_HELP_WITHDRAW_QUOTA);
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
        case 'splash_need_crowd':
            return ERROR_MESSAGES.splash_need_crowd(result.min ?? 4);
        case 'splash_no_victims':
            return ERROR_MESSAGES.splash_no_victims;
        case 'steal_self':
            return ERROR_MESSAGES.steal_self;
        case 'urge_self':
            return ERROR_MESSAGES.urge_self;
        case 'imperial_no_king':
            return ERROR_MESSAGES.imperial_no_king;
        case 'imperial_is_king':
            return ERROR_MESSAGES.imperial_is_king;
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
            return `${pickRandom(SAFE_MESSAGES)}（${result.count}/${DAILY_SAFE_LIMIT}）`;
        case 'safe_urged':
            return `${pickRandom(SAFE_MESSAGES)} ${pickRandom(URGE_BUFF_MESSAGES)}（${result.count}/${DAILY_SAFE_LIMIT}）`;
        case 'risky':
            return `${pickRandom(RISKY_SURVIVE_MESSAGES)} 今日 ${result.count} 次${riskHint(result)}`;
        case 'risky_cursed':
            return `${pickRandom(CURSED_LU_MESSAGES)} ${pickRandom(RISKY_SURVIVE_MESSAGES)} 今日 ${result.count} 次${riskHint(result)}`;
        case 'death': {
            const pct = formatChancePercent(result.deathChance ?? 0);
            const pctText = pct ? `（触发 ${pct}% 判定）` : '';
            return `${pickDeathMessage(DEATH_REASON.SELF)}${pctText}（丢失 ${result.snap} 次）`;
        }
        case 'death_cursed': {
            const pct = formatChancePercent(result.deathChance ?? 0);
            const pctText = pct ? `（含鹿咒，触发 ${pct}% 判定）` : '';
            return `${pickRandom(CURSED_LU_MESSAGES)} ${pickDeathMessage(DEATH_REASON.SELF)}${pctText}（丢失 ${result.snap} 次）`;
        }
        case 'revive':
            return `${helperName || '🦌友'} 救活 ${targetName || 'ta'}！${pickRandom(REVIVE_MESSAGES)}（恢复 ${result.count} 次）${q}`;
        case 'help_revive_fail':
            return `${helperName || '你'} 救 ${targetName || 'ta'} ${pickRandom(HELP_REVIVE_FAIL_MESSAGES)}（${helpFailPct}% 固定概率 · 仍鹿死）${q}`;
        case 'help':
            return `${helperName || '你'} 帮 ${targetName || 'ta'} ${pickRandom(HELP_SUCCESS_MESSAGES)}（${result.count}/${DAILY_SAFE_LIMIT}）${q}`;
        case 'help_kill':
            return `${helperName || '你'} 误伤 ${targetName || 'ta'}！${pickDeathMessage(DEATH_REASON.HELP)}（${helpFailPct}% 固定概率 · 丢失 ${result.snap} 次）${q}`;
        case 'help_pull':
            return `${helperName || '你'} 拉 ${targetName || 'ta'} 下马！${pickDeathMessage(DEATH_REASON.PULL)}（${helpFailPct}% 固定概率 · 丢失 ${result.snap} 次）${q}`;
        case 'help_miss':
            return `${helperName || '你'} 想拉 ${targetName || 'ta'} 下马，${pickRandom(HELP_FAIL_MESSAGES)}（${helpFailPct}% 未触发）${q}`;
        case 'withdrawal':
            return `${pickRandom(WITHDRAWAL_MESSAGES)}（剩余 ${result.count} 次）`;
        case 'together_fall':
            return `${pickRandom(TOGETHER_FALL_MESSAGES)}\n你：${result.selfCount} 次 · ${targetName || 'ta'}：${result.targetCount} 次（各 -${result.cost}）`;
        case 'help_withdraw':
            return `${helperName || '你'} ${pickRandom(HELP_WITHDRAW_SUCCESS)}（现 ${result.count} 次）${wq}`;
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
        case 'steal_success':
            return `${helperName || '你'} ${pickRandom(STEAL_SUCCESS_MESSAGES)}\n你：${result.thiefCount} 次 · ${targetName}：${result.targetCount} 次（偷鹿 ${result.stealUsed}/${DAILY_STEAL_QUOTA}）`;
        case 'steal_fail':
            return `${helperName || '你'} ${pickRandom(STEAL_FAIL_MESSAGES)}（偷鹿 ${result.stealUsed}/${DAILY_STEAL_QUOTA}）`;
        case 'steal_backfire':
            return `${helperName || '你'} ${pickRandom(STEAL_BACKFIRE_MESSAGES)} 现 ${result.thiefCount} 次（偷鹿 ${result.stealUsed}/${DAILY_STEAL_QUOTA}）`;
        case 'curse':
            return `${helperName || '你'} 对 ${targetName || 'ta'} ${pickRandom(CURSE_MESSAGES)}（${result.curseUsed}/${DAILY_CURSE_QUOTA}）`;
        case 'sacrifice':
            return `${helperName || '你'} ${pickRandom(SACRIFICE_MESSAGES)}\n你：${result.selfCount} 次 · ${targetName}：${result.targetCount} 次`;
        case 'fake_withdraw':
            return `${pickRandom(FAKE_WITHDRAW_MESSAGES)}（对外显示约 ${result.fakeCount} 次，实际 ${result.count} 次 · ${result.fakeWithdrawUsed}/${DAILY_FAKE_WITHDRAW_QUOTA}）`;
        case 'urge': {
            const buff = result.buffApplied ? '已贴催🦌符，下次自🦌 +1' : 'ta 今日已有🦌绩，符咒未生效';
            return `${helperName || '你'} ${pickRandom(URGE_MESSAGES)}（${buff} · ${result.urgeUsed}/${DAILY_URGE_QUOTA}）`;
        }
        case 'howl': {
            const base = pickHowlMessage(result.count, false);
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
        case 'greed_success':
            return `${helperName || '你'} ${pickRandom(GREED_SUCCESS_MESSAGES)}\n你：${result.selfCount} 次 · ${targetName}：${result.targetCount} 次`;
        case 'greed_fail':
            return `${helperName || '你'} ${pickRandom(GREED_FAIL_MESSAGES)} 现 ${result.selfCount} 次`;
        case 'group_splash': {
            const curseNote = result.cursedCount > 0
                ? `\n${pickRandom(GROUP_SPLASH_CURSE_EXTRA)}（${result.cursedCount} 人中标）`
                : '';
            return `${helperName || '你'} ${pickRandom(GROUP_SPLASH_MESSAGES)} 命中 ${result.totalHit} 人各 -${result.damage} · 你反噬 -${result.recoil} 现 ${result.casterCount} 次${curseNote}（群鹿溅 ${result.splashUsed}/${DAILY_GROUP_SPLASH_QUOTA}）`;
        }
        default:
            return result.message || '操作完成';
    }
}

/** 今日🦌况 */
export function formatStatusMessage(name, status) {
    const stepPct = status.deathChanceStep ?? Math.round(OVERLIMIT_DEATH_CHANCE_STEP * 100);
    const lines = [
        `📊 ${name} · 今日🦌况`,
        `有效：${status.dead ? `💀 鹿死（失 ${status.lostCount} 次，不计榜）` : `${status.count}/${DAILY_SAFE_LIMIT}`}`,
        `尝试：${status.attempts} 次`,
        `帮🦌配额：${status.helperHelpUsed}/${DAILY_HELP_QUOTA}`,
        `帮戒🦌配额：${status.helperWithdrawUsed}/${DAILY_HELP_WITHDRAW_QUOTA}`,
        `同归鹿尽：${status.dead ? '💀 鹿死不可用' : (status.togetherUsed ? '今日已用' : '可用 1 次')}`,
        `皇城鹿：${status.dead ? '💀 鹿死不可用' : `${status.imperialUsed}/${DAILY_IMPERIAL_QUOTA} 次`}`,
        `擂台鹿：${status.dead ? '💀 鹿死不可用' : `${status.arenaUsed}/${DAILY_ARENA_QUOTA} 次`}`,
        `偷鹿：${status.dead ? '💀' : `${status.stealUsed}/${DAILY_STEAL_QUOTA}`} · 鹿咒：${status.dead ? '💀' : `${status.curseUsed}/${DAILY_CURSE_QUOTA}`} · 献祭：${status.dead ? '💀' : (status.sacrificeUsed ? '已用' : '可用')}`,
        `诈戒：${status.dead ? '💀' : `${status.fakeWithdrawUsed}/${DAILY_FAKE_WITHDRAW_QUOTA}`} · 催鹿：${status.dead ? '💀' : `${status.urgeUsed}/${DAILY_URGE_QUOTA}`} · 鹿鸣：${status.howlUsed}/${DAILY_HOWL_QUOTA}`,
        `倒贴：${status.dead ? '💀' : (status.greedUsed ? '已用' : '可用')} · 群溅：${status.dead ? '💀' : (status.groupSplashUsed ? '已用' : '可用')} · 详单：鹿/🦌帮助`,
    ];

    if (status.cursed) lines.push('⚠️ 身中鹿咒，下次自🦌鹿死率 +10%');
    if (status.urgeBuff) lines.push('📣 被催更中，下次安全自🦌 +1');

    if (status.dead) {
        lines.push(`状态：💀 ${status.deathReasonText}，等「帮🦌」救活`);
        lines.push(`互助：今日不可帮他人 · 不可发起特殊玩法`);
        lines.push(`可用：🦌况 / 看🦌 / 排行榜 · 特权「回鹿/🦌返照」`);
        if (status.killedByName) lines.push(`凶手：${status.killedByName}`);
    } else if (status.inRiskZone) {
        lines.push(`状态：⚠️ 高危区，再🦌 ${status.riskPercent}% 鹿死（每多发 +${stepPct}%）`);
    } else if (status.safeLeft > 0) {
        lines.push(`状态：✅ 安全区，还可 🦌 ${status.safeLeft} 次`);
    }

    if (!status.dead) {
        lines.push(`帮🦌：${status.canHelp ? '可帮🦌友' : '不可用'}`);
    }

    lines.push(
        `规则：帮🦌 ${DAILY_HELP_QUOTA}/日 · 皇城 ${DAILY_IMPERIAL_QUOTA} · 擂台 ${DAILY_ARENA_QUOTA} · 群溅 ${DAILY_GROUP_SPLASH_QUOTA}/日 · 鹿与🦌指令等价 · 发送「鹿帮助」看全表`
    );
    return lines.join('\n');
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
        '可「帮🦌」「帮戒🦌」「偷鹿」「鹿咒」「献祭」「催鹿」「倒贴鹿」等互助/互害',
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
