/**
 * 统一文案格式化（所有用户可见文本经此出口）
 */
import {
    ALREADY_DEAD_MESSAGES,
    DAILY_HELP_QUOTA,
    DAILY_HELP_WITHDRAW_QUOTA,
    DAILY_SAFE_LIMIT,
    DEATH_REASON,
    ERROR_MESSAGES,
    HELP_FAIL_MESSAGES,
    HELP_KILL_CHANCE,
    HELP_QUOTA_MESSAGES,
    HELP_SUCCESS_MESSAGES,
    HELP_WITHDRAW_SUCCESS,
    HELP_WITHDRAW_FAIL_MESSAGES,
    HELP_WITHDRAW_FAIL_CHANCE,
    HELP_WITHDRAW_QUOTA_MESSAGES,
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
            return ERROR_MESSAGES.imperial_used;
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
    const helpKillPct = Math.round(HELP_KILL_CHANCE * 100);

    if (!result.ok) return formatErrorMessage(result);

    const q = quotaHint(result);
    const wq = withdrawQuotaHint(result);

    switch (result.type) {
        case 'safe':
            return `${pickRandom(SAFE_MESSAGES)}（${result.count}/${DAILY_SAFE_LIMIT}）`;
        case 'risky':
            return `${pickRandom(RISKY_SURVIVE_MESSAGES)} 今日 ${result.count} 次${riskHint(result)}`;
        case 'death': {
            const pct = formatChancePercent(result.deathChance ?? 0);
            const pctText = pct ? `（触发 ${pct}% 判定）` : '';
            return `${pickDeathMessage(DEATH_REASON.SELF)}${pctText}（丢失 ${result.snap} 次）`;
        }
        case 'revive':
            return `${helperName || '🦌友'} 救活 ${targetName || 'ta'}！${pickRandom(REVIVE_MESSAGES)}（恢复 ${result.count} 次）${q}`;
        case 'help':
            return `${helperName || '你'} 帮 ${targetName || 'ta'} ${pickRandom(HELP_SUCCESS_MESSAGES)}（${result.count}/${DAILY_SAFE_LIMIT}）${q}`;
        case 'help_kill':
            return `${helperName || '你'} 误伤 ${targetName || 'ta'}！${pickDeathMessage(DEATH_REASON.HELP)}（${helpKillPct}% 固定概率 · 丢失 ${result.snap} 次）${q}`;
        case 'help_pull':
            return `${helperName || '你'} 拉 ${targetName || 'ta'} 下马！${pickDeathMessage(DEATH_REASON.PULL)}（${helpKillPct}% 固定概率 · 丢失 ${result.snap} 次）${q}`;
        case 'help_miss':
            return `${helperName || '你'} 想拉 ${targetName || 'ta'} 下马，${pickRandom(HELP_FAIL_MESSAGES)}（${helpKillPct}% 未触发）${q}`;
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
            return `${pickRandom(PRIVILEGE_REVIVE_MESSAGES)}${result.wasDead ? '（原鹿死状态已解除）' : ''}（今日 0 次，可重新🦌）`;
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
        `皇城鹿：${status.dead ? '💀 鹿死不可用' : (status.imperialUsed ? '今日已用' : '可用 1 次')}`,
    ];

    if (status.dead) {
        lines.push(`状态：💀 ${status.deathReasonText}，等「帮🦌」救活`);
        lines.push(`互助：今日不可帮他人 · 不可发起特殊玩法`);
        lines.push(`可用：🦌况 / 看🦌 / 排行榜 · 特权「回鹿返照」`);
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
        `规则：安全 ${DAILY_SAFE_LIMIT} 次 · 超限递增 · 帮🦌误伤/拉下马 ${status.helpKillPercent}% · 帮戒失手 ${status.helpWithdrawFailPercent}% · 配额各 ${DAILY_HELP_QUOTA}/${DAILY_HELP_WITHDRAW_QUOTA} 次/日`
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
        '可「帮🦌」「帮戒🦌」「同归鹿尽」等互助',
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
