/** 每日安全🦌次数 */
export const DAILY_SAFE_LIMIT = 3;

/** 自🦌超限后首次（第 4 次）鹿死概率 */
export const OVERLIMIT_DEATH_CHANCE_BASE = 0.10;

/** 自🦌每多尝试一次，鹿死概率递增量（第 5 次 12%、第 6 次 14%…） */
export const OVERLIMIT_DEATH_CHANCE_STEP = 0.02;

/** @deprecated 兼容旧引用，等同 BASE */
export const OVERLIMIT_DEATH_CHANCE = OVERLIMIT_DEATH_CHANCE_BASE;

/** 帮🦌拉下马 / 误伤：固定概率，不递增 */
export const HELP_KILL_CHANCE = 0.10;

/** 帮🦌者每日总次数（可全部给同一人） */
export const DAILY_HELP_QUOTA = 3;

/** 帮戒🦌者每日总次数 */
export const DAILY_HELP_WITHDRAW_QUOTA = 3;

/** 同归鹿尽：双方各扣次数 */
export const TOGETHER_FALL_COST = 5;

/** 皇城鹿 PK 胜/负扣次 */
export const IMPERIAL_WIN_DEDUCT = 5;
export const IMPERIAL_LOSE_DEDUCT = 3;

/** 特权 QQ：回鹿返照 */
export const PRIVILEGED_QQ = '1814632762';

export const META_PREFIX = {
    HELP: '_hq_',
    HELP_WITHDRAW: '_hwq_',
    TOGETHER: '_tf_',
    IMPERIAL: '_hc_',
};

/** QQ 头像 */
export const QQ_AVATAR = (userId, size = 100) =>
    `https://q1.qlogo.cn/g?b=qq&nk=${userId}&s=${size}`;

/** 鹿死原因 */
export const DEATH_REASON = {
    SELF: 'self',
    HELP: 'help',
    PULL: 'pull',
    TOGETHER: 'together',
    IMPERIAL: 'imperial',
};

export const DEATH_REASON_TEXT = {
    [DEATH_REASON.SELF]: '过度🦌致死',
    [DEATH_REASON.HELP]: '帮🦌误伤致死',
    [DEATH_REASON.PULL]: '被拉下马',
    [DEATH_REASON.TOGETHER]: '同归鹿尽',
    [DEATH_REASON.IMPERIAL]: '皇城鹿败北',
};

export const DEATH_CELL_LABEL = {
    [DEATH_REASON.SELF]: '过🦌',
    [DEATH_REASON.HELP]: '误伤',
    [DEATH_REASON.PULL]: '下马',
    [DEATH_REASON.TOGETHER]: '同尽',
    [DEATH_REASON.IMPERIAL]: '皇城',
};

export const DEATH_MESSAGES = {
    self: [
        '精尽人亡！今日战绩全部清零，快找🦌友帮🦌救活吧…',
        '过度🦌导致原地去世，今日次数作废！',
        '鹿极必反，你🦌死了！今日面板已重置。',
    ],
    help: [
        '帮🦌帮过头了！对方被你一手送走了…',
        '这手帮🦌属于医疗事故，对方已鹿死。',
    ],
    pull: [
        '成功拉下马！对方今日🦌绩清零，现已鹿死。',
        '阴招奏效：帮🦌变帮倒忙，ta 被你送走了。',
    ],
};

export const RISKY_SURVIVE_MESSAGES = [
    '极限求生成功！又苟活了一发…',
    '好险，差点🦌死！',
    '阎王爷收人慢了一步，你还活着！',
    '在鹿死的边缘反复横跳，侥幸 +1',
];

export const SAFE_MESSAGES = [
    '稳健🦌手，今日进度 +1',
    '健康🦌，继续保持！',
    '安全区内，稳如老狗 +1',
    '今日🦌运尚佳，+1 不亏',
    '节制是美德，安全 +1',
];

export const WITHDRAWAL_MESSAGES = [
    '戒🦌成功，今日 -1',
    '回头是岸，今日少🦌一次',
    '自律鹿，-1 向健康迈进',
    '忍一时风平浪静，-1',
];

export const REVIVE_MESSAGES = [
    '紧急 CPR 成功，从鹿泉边被捞回来了！',
    '救活了！今日战绩已恢复，请节制🦌…',
];

export const HELP_SUCCESS_MESSAGES = [
    '仗义出手，帮 ta 安全🦌了一发',
    '代🦌成功，今日进度 +1',
    '鹿友相助，功德 +1',
    '你一臂之力，ta 今日 +1',
];

export const HELP_WITHDRAW_SUCCESS = [
    '帮戒🦌成功，ta 今日 -1',
    '好🦌友就要互相监督，-1',
    '代戒一手，望 ta 回头是岸',
];

export const HELP_FAIL_MESSAGES = [
    '帮🦌失手了，ta 还好好的…',
    '没能拉下马，对方躲过一劫',
];

export const HELP_QUOTA_MESSAGES = [
    '今日帮🦌体力透支，明天再来吧',
    '帮🦌次数用光了（3/3），好🦌友也需要休息',
];

export const ALREADY_DEAD_MESSAGES = [
    '你已经🦌死了！今日作废，快喊🦌友「帮🦌」救活',
    '💀 尸体还在地上，先等救活再🦌',
    '鹿魂尚未归位，今日禁止自🦌',
];

export const HELP_WITHDRAW_QUOTA_MESSAGES = [
    '今日帮戒🦌次数已用尽，明日再战',
    '帮戒🦌配额耗尽（3/3），手别抖了',
];

export const TOGETHER_FALL_MESSAGES = [
    '同归鹿尽！双方各失五载🦌功，今日缘尽于此…',
    '鹿途同归：你俩各扣 5 次，一损俱损。',
    '双双跌落鹿坛，各减五次，好一对苦命鸳鸯鹿。',
];

export const IMPERIAL_START_MESSAGES = [
    '皇城鹿诏已下！向今日鹿王发起骰局决斗',
    '紫禁鹿门开启，猜大小赢则夺鹿王五载功',
];

export const IMPERIAL_WIN_MESSAGES = [
    '皇城鹿大捷！鹿王今日被削 5 次🦌绩',
    '骰运在天！你赢了，鹿王失五次',
];

export const IMPERIAL_LOSE_MESSAGES = [
    '皇城鹿惜败…你今日自损 3 次以谢天下',
    '大小不合天意，你折 3 次🦌功',
];

export const PRIVILEGE_REVIVE_MESSAGES = [
    '回鹿返照！死而复生，帮🦌与帮戒🦌次数已重置',
    '鹿光逆照，你已还阳，今日配额清零重来',
];

export const FRIEND_ADD_MESSAGES = [
    '鹿缘一线牵！一次添加，双向结缘～',
    '🦌友达成！你们已互入名单，可互相帮🦌/帮戒🦌/救活',
    '林中又多一对鹿伴，从此不必互相添加',
    '添加成功：你帮 ta，ta 也帮你，省事！',
];

export const FRIEND_ADD_NOTIFY = [
    '对方也已自动将你列入🦌友，无需 ta 再添加',
    'ta 的「我的🦌友」里也会出现你',
];

export const FRIEND_REMOVE_MESSAGES = [
    '鹿途分岔，双向🦌友关系已解除',
    '绝交完成，从此各自🦌，互不打扰',
    '缘分已尽，双方名单均已移除',
];

export const FRIEND_EMPTY_MESSAGES = [
    '你还没有🦌友！「添加🦌友@某人」一次添加，双方互见名单',
    '鹿林空空…发送「添加🦌友@ta」结缘吧',
];

export const FRIEND_NOT_IN_GROUP = [
    '🦌友都不在本群，换个群看看～',
    '名单里的🦌友未在本群露面',
];

export const FRIEND_ALREADY_MESSAGES = [
    '你们已经是🦌友啦，无需重复添加',
    '双向🦌友已存在，直接去帮 ta 吧',
];

export const FRIEND_LIST_TITLES = [
    '我的🦌友林',
    '可互助的🦌友们',
    '鹿伴名册',
];

export const HELPER_DEAD_MESSAGES = [
    '你都🦌死了还怎么帮别人？先等🦌友救活你吧',
    '💀 自身难保，今日无法帮🦌（救活也不行，先自救）',
    '帮🦌失败：帮🦌者已鹿死，请先被救活',
];

/** 业务错误文案（data 层只返回 type，文案由此读取） */
export const ERROR_MESSAGES = {
    withdrawal_dead: '🦌死状态下请先被救活再戒🦌',
    empty: '这天本来就没🦌过',
    help_quota: (used, total) => `今日帮🦌次数已用完（${used}/${total}），明天再来吧`,
    help_withdraw_quota: (used, total) => `今日帮戒🦌次数已用完（${used}/${total}）`,
    helper_dead: '你已🦌死，今日无法帮🦌他人，请先被救活',
    no_target: '请 @🦌友 或引用消息指定对象',
    not_friend: 'ta 还不是你的🦌友！\n「添加🦌友@ta」一次添加，双方互见名单并可互助',
    together_used: '今日已用过同归鹿尽，明天再来殉情吧',
    together_self: '不能对自己同归鹿尽',
    imperial_used: '今日皇城鹿机会已用完',
    imperial_no_king: '今日群内尚无鹿王（🦌日榜第一），先去🦌一发',
    imperial_is_king: '你已是今日鹿王，无需向自己宣战',
    imperial_need_group: '皇城鹿仅在群内可用',
    privilege_only: '此指令为特权鹿使专属',
    default: '操作失败',
};

export const UI_MESSAGES = {
    view_panel: '🦌面板如下：',
    view_empty: (label, isAt) => isAt ? `ta在${label}还没有🦌过呢~` : `你在${label}还没有🦌过呢~`,
    rank_empty: (scope) => {
        if (scope === 'year') return '今年还没有人上榜，先来一发🦌吧~';
        if (scope === 'day') return '今日还没有人上榜，先来一发🦌吧~';
        if (scope === 'day_wd') return '今日还没有人可戒🦌排行~';
        return '本月还没有人上榜，先来一发🦌吧~';
    },
    rank_footer: 'yunzai-plugin-deer-pipe · 数据永久保留',
};

export function pickRandom(arr) {
    if (!arr?.length) return '';
    return arr[Math.floor(Math.random() * arr.length)];
}

/** 0~1 概率 → 整型百分比（不含 %），0 或无效则返回空串 */
export function formatChancePercent(chance) {
    const n = Number(chance);
    if (!Number.isFinite(n) || n <= 0) return '';
    return String(Math.round(n * 100));
}

/** 自🦌超限区：第 4 次 BASE，之后每次 +STEP，上限 100% */
export function calcOverlimitDeathChance(currentCount) {
    if (currentCount < DAILY_SAFE_LIMIT) return 0;
    const idx = currentCount - DAILY_SAFE_LIMIT + 1;
    return Math.min(1, OVERLIMIT_DEATH_CHANCE_BASE + (idx - 1) * OVERLIMIT_DEATH_CHANCE_STEP);
}

export function isPrivileged(userId) {
    return String(userId) === PRIVILEGED_QQ;
}

export function rollDiceBigSmall() {
    const dice = Math.floor(Math.random() * 6) + 1;
    return { dice, side: dice >= 4 ? '大' : '小' };
}

export function pickDeathMessage(reason = DEATH_REASON.SELF) {
    return pickRandom(DEATH_MESSAGES[reason] || DEATH_MESSAGES.self);
}

export function getDeathReasonText(reason) {
    return DEATH_REASON_TEXT[reason] || DEATH_REASON_TEXT[DEATH_REASON.SELF];
}

export function getDeathCellLabel(entry) {
    if (!entry) return '💀';
    return DEATH_CELL_LABEL[entry.dr || DEATH_REASON.SELF] || '💀';
}
