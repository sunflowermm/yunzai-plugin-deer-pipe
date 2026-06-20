/**
 * 天赋展示文案：由职业/番外 def 的数值字段统一生成，避免手写与逻辑不一致
 */
import {
    DAILY_SAFE_LIMIT,
    HELP_FAIL_CHANCE,
    HELP_WITHDRAW_FAIL_CHANCE,
    STEAL_SUCCESS_CHANCE,
} from './game.js';

function pct(rate, digits = 0) {
    const n = rate * 100;
    return `${digits ? n.toFixed(digits) : Math.round(n)}%`;
}

function clamp01(v) {
    return Math.min(1, Math.max(0, v));
}

function signedPctText(delta) {
    const v = Math.round(delta * 1000) / 10;
    if (!v) return '0%';
    return v > 0 ? `+${v}%` : `${v}%`;
}

/** @returns {string[]} 可读天赋条目（含具体数值） */
export function collectTalentParts(def) {
    if (!def || typeof def !== 'object') return [];
    const parts = [];

    if (def.safeBonus) {
        parts.push(`安全区 ${DAILY_SAFE_LIMIT + def.safeBonus} 次（基础 ${DAILY_SAFE_LIMIT} +${def.safeBonus}）`);
    }

    if (def.helpFailDelta) {
        const eff = clamp01(HELP_FAIL_CHANCE + def.helpFailDelta);
        parts.push(`帮鹿失手 ${pct(eff)}（基础 ${pct(HELP_FAIL_CHANCE)} ${signedPctText(def.helpFailDelta)}）`);
    }

    if (def.helpWithdrawFailDelta) {
        const eff = clamp01(HELP_WITHDRAW_FAIL_CHANCE + def.helpWithdrawFailDelta);
        parts.push(`帮戒失手 ${pct(eff)}（基础 ${pct(HELP_WITHDRAW_FAIL_CHANCE)} ${signedPctText(def.helpWithdrawFailDelta)}）`);
    }

    if (def.reviveFailDelta) {
        const eff = clamp01(HELP_FAIL_CHANCE + def.reviveFailDelta);
        parts.push(`救活失手 ${pct(eff)}（基础 ${pct(HELP_FAIL_CHANCE)} ${signedPctText(def.reviveFailDelta)}）`);
    }

    if (def.deathDelta) {
        parts.push(`超限自鹿鹿死 ${signedPctText(def.deathDelta)}`);
    }

    if (def.weatherPositiveAmp && def.weatherPositiveAmp !== 1) {
        parts.push(`天象正向修正 ×${def.weatherPositiveAmp}`);
    }

    if (def.stealDelta) {
        const eff = clamp01(STEAL_SUCCESS_CHANCE + def.stealDelta);
        parts.push(`偷鹿成功率 ${pct(eff)}（基础 ${pct(STEAL_SUCCESS_CHANCE)} +${pct(def.stealDelta)}）`);
    }

    if (def.lotteryLuckDelta) {
        parts.push(`抽鹿签吉兆概率 +${pct(def.lotteryLuckDelta)}`);
    }

    if (def.curseApplyBonus) {
        parts.push(`鹿咒成功后再叠 1 层 ${pct(def.curseApplyBonus)}`);
    }

    if (def.blessApplyBonus) {
        parts.push(`鹿福成功后再叠 1 层 ${pct(def.blessApplyBonus)}`);
    }

    if (def.helpCurseCleanseChance) {
        parts.push(`帮鹿时 ${pct(def.helpCurseCleanseChance)} 撕 1 层咒`);
    }

    if (def.helpBlessChance) {
        parts.push(`帮鹿时 ${pct(def.helpBlessChance)} 贴 1 层福`);
    }

    if (def.helpQuotaBonusChance) {
        parts.push(`帮鹿成功 ${pct(def.helpQuotaBonusChance)} 当日帮鹿次数 +1`);
    }

    if (def.withdrawExtraChance) {
        const amt = def.withdrawExtraAmount || 1;
        parts.push(`帮戒 ${pct(def.withdrawExtraChance)} 额外再扣 ${amt} 次`);
    }

    if (def.asceticZoneBonus) {
        parts.push(`目标已在戒区时帮戒再扣 ${def.asceticZoneBonus} 次`);
    }

    if (def.selfWithdrawBonus && def.selfWithdrawBonusChance) {
        parts.push(`自戒 ${pct(def.selfWithdrawBonusChance)} 再扣 ${def.selfWithdrawBonus} 次`);
    }

    if (def.safeLuDoubleChance) {
        parts.push(`安全自鹿 ${pct(def.safeLuDoubleChance)} 连 +2 次（共 +2）`);
    }

    if (def.overlimitStepReduce) {
        parts.push(`超限鹿死递增 -${pct(def.overlimitStepReduce, 1)}/次`);
    }

    if (def.overlimitDeathCap != null) {
        parts.push(`超限鹿死概率上限 ${pct(def.overlimitDeathCap)}`);
    }

    if (def.impotenceChance) {
        parts.push(`帮鹿 ${pct(def.impotenceChance)} 令目标挂「阳痿」`);
    }

    if (def.impotenceHelpFailBonus) {
        parts.push(`阳痿目标被帮鹿失手 +${pct(def.impotenceHelpFailBonus)}（叠加基础 ${pct(HELP_FAIL_CHANCE)}）`);
    }

    return parts;
}

/** 职业卡 / 鹿况：完整天赋一行（过长由渲染截断） */
export function formatTalentTagline(def, maxParts = 4) {
    const parts = collectTalentParts(def);
    if (!parts.length) return '无额外天赋数值修正';
    if (maxParts >= parts.length) return parts.join(' · ');
    return `${parts.slice(0, maxParts).join(' · ')} …`;
}

/** 职业一览「天赋」格：配额 + 前两条天赋 */
export function formatTalentCatalogLine(def, quotaBrief) {
    const talent = collectTalentParts(def).slice(0, 2).join(' · ');
    if (quotaBrief && talent) return `${quotaBrief} · ${talent}`;
    return quotaBrief || talent || '';
}

/** 列表文案用：天赋摘要（不含配额） */
export function formatTalentPerkBrief(def, maxParts = 3) {
    const parts = collectTalentParts(def);
    if (!parts.length) return '';
    return ` · ${parts.slice(0, maxParts).join(' · ')}`;
}
