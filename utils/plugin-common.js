/**
 * 鹿插件共用：目标解析与群成员名（loader 调用 fnc 前会注入 plugin.e）
 */
import { D } from '../constants/commands.js';

const TARGET_PREFIX_RE = new RegExp(
    `^(?:同归${D}尽|帮戒${D}|擂台${D}|偷${D}|解${D}咒|解${D}福|${D}咒|冥${D}咒|献祭${D}|催${D}|倒贴${D}|借${D}|碰瓷${D}|索命${D}|托梦${D}|${D}福|清规${D})`,
);

const HELP_PREFIX_RE = new RegExp(`^帮${D}`);

const MEDIC_SKILL_RE = new RegExp(`^(?:愈${D}|${D}愈)`);

const FRIEND_ADD_RE = new RegExp(`^添加${D}友`);

const FRIEND_DEL_RE = new RegExp(`^绝交${D}友`);

/** @鹿/🦌 互害、擂台、同归等 @目标 指令 */
export async function resolveTargetId(e) {
    if (e.at) return e.at;
    if (e?.reply_id !== undefined) {
        const reply = await e.getReply();
        return reply?.user_id ?? null;
    }
    const stripped = String(e.msg).trim().replace(TARGET_PREFIX_RE, '').trim();
    return stripped || null;
}

/** 帮🦌/帮鹿 */
export async function resolveHelpTargetId(e) {
    if (e.at) return e.at;
    if (e?.reply_id !== undefined) {
        const reply = await e.getReply();
        return reply?.user_id ?? null;
    }
    const stripped = String(e.msg).trim().replace(HELP_PREFIX_RE, '').trim();
    return stripped || null;
}

/** 鹿医师专属：愈鹿 / 鹿愈 */
export async function resolveMedicSkillTargetId(e) {
    if (e.at) return e.at;
    if (e?.reply_id !== undefined) {
        const reply = await e.getReply();
        return reply?.user_id ?? null;
    }
    const stripped = String(e.msg).trim().replace(MEDIC_SKILL_RE, '').trim();
    return stripped || null;
}

/** 戒灵师专属：清规 */
export async function resolveAsceticSkillTargetId(e) {
    return resolveTargetId(e);
}

export async function resolveFriendTargetId(e, { remove = false } = {}) {
    if (e.at) return e.at;
    if (e?.reply_id !== undefined) {
        const reply = await e.getReply();
        return reply?.user_id ?? null;
    }
    const re = remove ? FRIEND_DEL_RE : FRIEND_ADD_RE;
    const stripped = String(e.msg).trim().replace(re, '').trim();
    return stripped || null;
}

export async function getMemberName(e, userId) {
    const map = await (e.group || Bot?.pickGroup(e.group_id))?.getMemberMap();
    const info = map?.get(parseInt(userId, 10));
    return info?.card || info?.nickname || String(userId);
}

/** 解析指令主体（自己 / @ / 引用） */
export async function resolveSubjectUser(e) {
    if (e.at) {
        const userId = String(e.at);
        return {
            userId,
            isAt: true,
            name: await getMemberName(e, userId),
        };
    }
    if (e?.reply_id !== undefined) {
        const reply = await e.getReply();
        if (reply?.user_id) {
            const userId = String(reply.user_id);
            return {
                userId,
                isAt: true,
                name: await getMemberName(e, userId),
            };
        }
    }
    const { user_id, card, nickname } = e.sender;
    return {
        userId: String(user_id),
        isAt: false,
        name: card || nickname || String(user_id),
    };
}
