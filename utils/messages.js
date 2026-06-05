/**
 * 统一文案格式化（所有用户可见文本经此出口）
 */
import {
    ALREADY_DEAD_MESSAGES,
    DAILY_HELP_QUOTA,
    DAILY_SAFE_LIMIT,
    DEATH_REASON,
    ERROR_MESSAGES,
    HELP_FAIL_MESSAGES,
    HELP_KILL_CHANCE,
    HELP_QUOTA_MESSAGES,
    HELP_SUCCESS_MESSAGES,
    HELPER_DEAD_MESSAGES,
    OVERLIMIT_DEATH_CHANCE_STEP,
    formatChancePercent,
    pickDeathMessage,
    pickRandom,
    REVIVE_MESSAGES,
    RISKY_SURVIVE_MESSAGES,
    SAFE_MESSAGES,
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

/** 失败/拒绝类文案 */
export function formatErrorMessage(result) {
    switch (result.type) {
        case 'dead':
            return pickRandom(ALREADY_DEAD_MESSAGES);
        case 'helper_dead':
            return pickRandom(HELPER_DEAD_MESSAGES) || ERROR_MESSAGES.helper_dead;
        case 'help_quota':
            return result.message || pickRandom(HELP_QUOTA_MESSAGES)
                || ERROR_MESSAGES.help_quota(DAILY_HELP_QUOTA, DAILY_HELP_QUOTA);
        case 'withdrawal_dead':
            return ERROR_MESSAGES.withdrawal_dead;
        case 'empty':
            return ERROR_MESSAGES.empty;
        default:
            return result.message || ERROR_MESSAGES.default;
    }
}

/** 操作结果文案 */
export function formatActionMessage(result, ctx = {}) {
    const { helperName, targetName } = ctx;
    const helpKillPct = Math.round(HELP_KILL_CHANCE * 100);

    if (!result.ok) return formatErrorMessage(result);

    const q = quotaHint(result);

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
            return `戒🦌成功（剩余 ${result.count} 次）`;
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
        `帮🦌配额：${status.helperHelpUsed}/${DAILY_HELP_QUOTA}（可全给同一人）`,
    ];

    if (status.dead) {
        lines.push(`状态：💀 ${status.deathReasonText}，等「帮🦌」救活`);
        lines.push(`帮🦌：今日不可帮他人（自身鹿死）`);
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
        `规则：安全 ${DAILY_SAFE_LIMIT} 次 · 超限 ${status.riskPercent}% 起递增 +${stepPct}%/次 · 帮🦌固定 ${status.helpKillPercent}%`
    );
    return lines.join('\n');
}

export function formatViewEmpty(label, isAt) {
    return UI_MESSAGES.view_empty(label, isAt);
}

export function formatRankEmpty(scope) {
    return UI_MESSAGES.rank_empty(scope);
}
