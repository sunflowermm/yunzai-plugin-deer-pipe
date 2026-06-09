import { BALANCED_FORMULA_HINT, BALANCED_WEIGHTS } from '../constants/balanced-score.js';

export { BALANCED_FORMULA_HINT, BALANCED_WEIGHTS } from '../constants/balanced-score.js';

export function roundBalancedScore(score) {
    return Math.round(score * 10) / 10;
}

/**
 * @param {object|null} entry 单日 entry
 * @param {object} [ctx]
 * @param {number} [ctx.safeLimit=3]
 * @param {number} [ctx.chaosActions=0]
 * @param {{ active?: boolean, stacks?: number }} [ctx.curse]
 * @param {{ active?: boolean, stacks?: number }} [ctx.bless]
 */
export function computeBalancedScore(entry, ctx = {}) {
    if (!entry || entry.d) {
        return { score: 0, parts: null };
    }

    const W = BALANCED_WEIGHTS;
    const c = entry.c ?? 0;
    const safeLimit = ctx.safeLimit ?? 3;
    const chaosActions = ctx.chaosActions ?? 0;

    let net = 0;
    if (c > 0) {
        net = Math.min(c, W.netPositiveCap) * W.netPositive;
    } else if (c < 0) {
        net = Math.min(Math.abs(c), W.disciplineCap) * W.discipline;
    }

    const attempts = entry.a || 0;
    const cappedAttempts = Math.min(attempts, W.activityCap);
    const activity = Math.sqrt(cappedAttempts) * W.activitySqrt;

    const helpOut = (entry.helped || 0) * W.helpOut + (entry.revived || 0) * W.reviveOut;

    let helpIn = 0;
    if (entry.helpBy && typeof entry.helpBy === 'object') {
        const received = Object.values(entry.helpBy).reduce((a, b) => a + (b || 0), 0);
        helpIn = Math.min(received, W.helpInCap) * W.helpIn;
    }

    const curse = ctx.curse || {};
    const bless = ctx.bless || {};
    const aura = (bless.active ? (bless.stacks || 0) * W.blessPerStack : 0)
        + (curse.active ? (curse.stacks || 0) * W.cursePerStack : 0);

    let safeBonus = 0;
    let overlimit = 0;
    if (c > 0 && c <= safeLimit) {
        safeBonus = W.safeZoneBonus;
    } else if (c > safeLimit) {
        overlimit = Math.min(c - safeLimit, W.overlimitCap) * W.overlimitPerCount;
    }

    const chaos = Math.min(chaosActions, W.chaosCap) * W.chaosPerAction;
    const raw = net + activity + helpOut + helpIn + aura + safeBonus + overlimit + chaos;
    const score = raw <= 0 ? 0 : roundBalancedScore(raw);

    return {
        score,
        parts: {
            net: roundBalancedScore(net),
            activity: roundBalancedScore(activity),
            helpOut: roundBalancedScore(helpOut),
            helpIn: roundBalancedScore(helpIn),
            aura: roundBalancedScore(aura),
            safeBonus: roundBalancedScore(safeBonus),
            overlimit: roundBalancedScore(overlimit),
            chaos: roundBalancedScore(chaos),
        },
    };
}

export function calcDayBalancedScore(entry, ctx) {
    return computeBalancedScore(entry, ctx).score;
}

/** 鹿况 / 说明用：分项摘要 */
export function formatBalancedBreakdown(parts) {
    if (!parts) return '暂无';
    const items = [];
    if (parts.net) items.push(`净值${fmtSigned(parts.net)}`);
    if (parts.activity) items.push(`活跃+${parts.activity}`);
    if (parts.helpOut) items.push(`施助+${parts.helpOut}`);
    if (parts.helpIn) items.push(`受助+${parts.helpIn}`);
    if (parts.aura) items.push(`咒福${fmtSigned(parts.aura)}`);
    if (parts.safeBonus) items.push(`安全+${parts.safeBonus}`);
    if (parts.overlimit) items.push(`超限${parts.overlimit}`);
    if (parts.chaos) items.push(`互害${parts.chaos}`);
    return items.length ? items.join(' · ') : '暂无';
}

function fmtSigned(n) {
    return n > 0 ? `+${n}` : String(n);
}
