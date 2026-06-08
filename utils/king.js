/**
 * 日度鹿王：结算、存档、群播
 */
import { REDIS_YUNZAI_DEER_PIPE_KING_ARCHIVE } from '../constants/core.js';
import { pickRandom } from '../constants/game.js';
import { CARD_FLAVOR } from '../constants/eco.js';
import { getDayRankInGroup } from './data.js';
import { generateDailyKingImage } from './king-render.js';
import hub, { resolveKingBroadcastGroupIds, sleepMs } from '../lib/deer-hub.js';

async function redisGetJson(key) {
    const raw = await redis.get(key);
    if (raw == null) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

async function redisSetJson(key, value) {
    await redis.set(key, JSON.stringify(value));
}

function formatDayKey(date) {
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatDateLabel(date) {
    const d = date instanceof Date ? date : new Date(date);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function shiftDate(date, deltaDays) {
    const d = new Date(date);
    d.setDate(d.getDate() + deltaDays);
    d.setHours(12, 0, 0, 0);
    return d;
}

export async function loadKingArchive() {
    return (await redisGetJson(REDIS_YUNZAI_DEER_PIPE_KING_ARCHIVE)) ?? {};
}

export async function saveKingArchive(archive) {
    await redisSetJson(REDIS_YUNZAI_DEER_PIPE_KING_ARCHIVE, archive);
}

async function resolveMemberName(groupId, userId) {
    try {
        const group = Bot.pickGroup(groupId);
        const info = await group?.pickMember(userId)?.getInfo?.();
        return info?.card || info?.nickname || String(userId);
    } catch {
        return String(userId);
    }
}

async function resolveGroupMembers(groupId) {
    try {
        const map = await Bot.pickGroup(groupId)?.getMemberMap?.();
        if (!map?.size) return [];
        return Array.from(map.keys());
    } catch {
        return [];
    }
}

/**
 * 结算指定日、指定群的日榜鹿王
 */
export async function compileGroupDailyKing(deerData, groupId, rankDate = new Date()) {
    const members = await resolveGroupMembers(groupId);
    if (!members.length) return null;
    const rank = getDayRankInGroup(deerData, members, rankDate);
    if (!rank.length) return null;
    const king = rank[0];
    const kingName = await resolveMemberName(groupId, king.id);
    const rankTop = await Promise.all(rank.slice(0, 3).map(async (item, idx) => ({
        rank: idx + 1,
        id: item.id,
        count: item.sum,
        name: idx === 0 ? kingName : await resolveMemberName(groupId, item.id),
    })));
    return {
        groupId: String(groupId),
        kingId: king.id,
        kingName,
        count: king.sum,
        rankTop,
        dateKey: formatDayKey(rankDate),
        dateLabel: formatDateLabel(rankDate),
    };
}

export function buildKingCaption(result) {
    const flavor = pickRandom(CARD_FLAVOR.king || CARD_FLAVOR.default);
    return [
        `👑 【日度鹿王】${result.dateLabel}`,
        `本群鹿王：${result.kingName}（${result.count} 次）`,
        `皇城鹿可向其宣战 · 发送「皇城🦌」`,
        flavor,
    ].join('\n');
}

/**
 * 12:00 定时：整理昨日日度鹿王并群播
 * @param {Date} [now] 触发时刻，默认取「昨日」完整日榜
 */
export async function publishDailyKingCoronation(deerData, now = new Date()) {
    const rankDate = shiftDate(now, -1);
    const dayKey = formatDayKey(rankDate);
    const archive = await loadKingArchive();
    if (!archive[dayKey]) archive[dayKey] = { groups: {} };

    const groups = resolveKingBroadcastGroupIds();
    if (!groups.length) {
        logger.debug(`[deer-pipe] 鹿王加冕跳过（无目标群） day=${dayKey}`);
        return { sent: 0, dayKey };
    }

    const interval = hub.getKingBroadcast()?.interval_ms ?? 500;
    let sent = 0;

    for (let i = 0; i < groups.length; i += 1) {
        const gid = groups[i];
        const gKey = String(gid);
        if (archive[dayKey].groups[gKey]?.sent) continue;

        const result = await compileGroupDailyKing(deerData, gid, rankDate);
        if (!result) {
            archive[dayKey].groups[gKey] = { sent: true, empty: true, at: Date.now() };
            continue;
        }

        try {
            const img = await generateDailyKingImage({
                date: rankDate,
                kingName: result.kingName,
                kingId: result.kingId,
                count: result.count,
                rankTop: result.rankTop,
                dateLabel: `${result.dateLabel} · 日度鹿王`,
                groupLabel: `群 ${gKey} · 鹿王册封`,
            });
            const caption = buildKingCaption(result);
            await Bot.pickGroup(gid).sendMsg([caption, segment.image(img)]);
            archive[dayKey].groups[gKey] = {
                sent: true,
                kingId: result.kingId,
                kingName: result.kingName,
                count: result.count,
                at: Date.now(),
            };
            sent += 1;
        } catch (err) {
            logger.debug(`[deer-pipe] 鹿王加冕 ${gKey} 失败: ${err?.message || err}`);
        }

        if (i < groups.length - 1 && interval > 0) {
            await sleepMs(interval);
        }
    }

    await saveKingArchive(archive);
    return { sent, dayKey, groups: groups.length };
}
