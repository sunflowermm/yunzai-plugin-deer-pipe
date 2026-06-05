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

/** QQ 头像 */
export const QQ_AVATAR = (userId, size = 100) =>
    `https://q1.qlogo.cn/g?b=qq&nk=${userId}&s=${size}`;

/** 鹿死原因 */
export const DEATH_REASON = {
    SELF: 'self',
    HELP: 'help',
    PULL: 'pull',
};

export const DEATH_REASON_TEXT = {
    [DEATH_REASON.SELF]: '过度🦌致死',
    [DEATH_REASON.HELP]: '帮🦌误伤致死',
    [DEATH_REASON.PULL]: '被拉下马',
};

export const DEATH_CELL_LABEL = {
    [DEATH_REASON.SELF]: '过🦌',
    [DEATH_REASON.HELP]: '误伤',
    [DEATH_REASON.PULL]: '下马',
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
];

export const REVIVE_MESSAGES = [
    '紧急 CPR 成功，从鹿泉边被捞回来了！',
    '救活了！今日战绩已恢复，请节制🦌…',
];

export const HELP_SUCCESS_MESSAGES = [
    '仗义出手，帮 ta 安全🦌了一发',
    '代🦌成功，今日进度 +1',
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
    helper_dead: '你已🦌死，今日无法帮🦌他人，请先被救活',
    no_target: '请 @🦌友 或引用消息指定要帮的对象',
    not_friend: 'ta 不在你的🦌友名单里！\n「添加🦌友@ta」后可帮 ta 🦌、救活或拉下马',
    default: '操作失败',
};

export const UI_MESSAGES = {
    view_panel: '🦌面板如下：',
    view_empty: (label, isAt) => isAt ? `ta在${label}还没有🦌过呢~` : `你在${label}还没有🦌过呢~`,
    rank_empty: (scope) => scope === 'year' ? '今年还没有人上榜，先来一发🦌吧~' : '本月还没有人上榜，先来一发🦌吧~',
    rank_footer: 'yunzai-plugin-deer-pipe · 数据永久保留',
};

export function pickRandom(arr) {
    if (!arr?.length) return '';
    return arr[Math.floor(Math.random() * arr.length)];
}

/** 自🦌超限区：第 4 次 BASE，之后每次 +STEP，上限 100% */
export function calcOverlimitDeathChance(currentCount) {
    if (currentCount < DAILY_SAFE_LIMIT) return 0;
    const idx = currentCount - DAILY_SAFE_LIMIT + 1;
    return Math.min(1, OVERLIMIT_DEATH_CHANCE_BASE + (idx - 1) * OVERLIMIT_DEATH_CHANCE_STEP);
}

export function formatChancePercent(chance) {
    return Math.round(chance * 100);
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
