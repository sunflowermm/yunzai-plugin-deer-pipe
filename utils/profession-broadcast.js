/**
 * 每日 0:00 职业重置群播
 */
import { REDIS_YUNZAI_DEER_PIPE_PROF_RESET_SENT } from '../constants/core.js';
import { DAILY_SAFE_LIMIT, pickRandom, PROFESSION_RESET_BROADCAST_MESSAGES } from '../constants/game.js';
import { PROFESSION_LIST_TEXT, TRANSFER_PROFESSION_HINT } from '../constants/profession.js';
import hub, { resolveKingBroadcastGroupIds, sleepMs } from '../lib/deer-hub.js';

function formatDayKey(date) {
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function buildProfessionResetCaption(now = new Date()) {
    const d = now instanceof Date ? now : new Date(now);
    const flavor = pickRandom(PROFESSION_RESET_BROADCAST_MESSAGES);
    return [
        `🎭 【鹿职业重置】${d.getMonth() + 1}月${d.getDate()}日 0:00`,
        flavor,
        `自🦌安全区：默认前 ${DAILY_SAFE_LIMIT} 次零鹿死（卷王/天象可 +N）`,
        '⚠️ 每日必须先转职，否则🦌/互助/互害/冥界技能全部封印',
        '——',
        PROFESSION_LIST_TEXT,
        `指令：鹿职业 · 鹿配额 · ${TRANSFER_PROFESSION_HINT}`,
    ].join('\n');
}

async function wasProfessionResetSent(dayKey) {
    const raw = await redis.get(`${REDIS_YUNZAI_DEER_PIPE_PROF_RESET_SENT}:${dayKey}`);
    return raw != null;
}

async function markProfessionResetSent(dayKey) {
    await redis.set(`${REDIS_YUNZAI_DEER_PIPE_PROF_RESET_SENT}:${dayKey}`, String(Date.now()));
}

/**
 * 0:00 与鹿王加冕同批群播：提醒职业与互助配额已刷新
 */
export async function publishDailyProfessionReset(now = new Date()) {
    const bc = hub.getKingBroadcast();
    if (!bc.enabled || bc.profession_reset === false) {
        return { sent: 0, dayKey: formatDayKey(now), skipped: true };
    }

    const dayKey = formatDayKey(now);
    if (await wasProfessionResetSent(dayKey)) {
        logger.debug(`[deer-pipe] 职业重置群播已发送 day=${dayKey}`);
        return { sent: 0, dayKey, deduped: true };
    }

    const groups = resolveKingBroadcastGroupIds();
    if (!groups.length) {
        logger.debug(`[deer-pipe] 职业重置群播跳过（无目标群） day=${dayKey}`);
        return { sent: 0, dayKey };
    }

    const text = buildProfessionResetCaption(now);
    const interval = bc.interval_ms ?? 500;
    let sent = 0;

    for (let i = 0; i < groups.length; i += 1) {
        const gid = groups[i];
        try {
            await Bot.pickGroup(gid).sendMsg(text);
            sent += 1;
        } catch (err) {
            logger.debug(`[deer-pipe] 职业重置群播 ${gid} 失败: ${err?.message || err}`);
        }
        if (i < groups.length - 1 && interval > 0) {
            await sleepMs(interval);
        }
    }

    if (sent > 0) {
        await markProfessionResetSent(dayKey);
    }
    return { sent, dayKey, groups: groups.length };
}
