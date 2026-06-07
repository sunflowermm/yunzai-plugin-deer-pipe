/** 每日安全🦌次数 */
export const DAILY_SAFE_LIMIT = 3;

/** 自🦌超限后首次（第 4 次）鹿死概率 */
export const OVERLIMIT_DEATH_CHANCE_BASE = 0.10;

/** 自🦌每多尝试一次，鹿死概率递增量（第 5 次 12%、第 6 次 14%…） */
export const OVERLIMIT_DEATH_CHANCE_STEP = 0.02;

/** 帮🦌误伤/拉下马/救人失手：固定 10%，不递增 */
export const HELP_FAIL_CHANCE = 0.10;

/** @deprecated 兼容旧引用 */
export const HELP_KILL_CHANCE = HELP_FAIL_CHANCE;

/** 帮戒🦌失手：固定 30%，不扣对方次数但仍消耗配额 */
export const HELP_WITHDRAW_FAIL_CHANCE = 0.30;

/** 帮🦌者每日总次数（可全部给同一人） */
export const DAILY_HELP_QUOTA = 6;

/** 帮戒🦌者每日总次数 */
export const DAILY_HELP_WITHDRAW_QUOTA = 3;

/** 同归鹿尽：双方各扣次数 */
export const TOGETHER_FALL_COST = 5;

/** 皇城鹿：每人每日可宣战次数 */
export const DAILY_IMPERIAL_QUOTA = 2;

/** 皇城鹿 PK：挑战者赢扣鹿王次数 / 挑战者输扣自己次数 / 鹿王守擂成功奖励 */
export const IMPERIAL_WIN_DEDUCT = 5;
export const IMPERIAL_LOSE_DEDUCT = 3;
export const IMPERIAL_KING_WIN_BONUS = 3;

/** 擂台鹿：每人每日可参与次数 / 胜负转移次数 */
export const DAILY_ARENA_QUOTA = 5;
export const ARENA_STAKE = 5;
export const ARENA_PK_TIMEOUT_SEC = 60;
export const ARENA_DECLINE_PENALTY = 1;

/** 偷鹿：每日次数 / 成功率 / 反噬率 */
export const DAILY_STEAL_QUOTA = 3;
export const STEAL_SUCCESS_CHANCE = 0.35;
export const STEAL_BACKFIRE_CHANCE = 0.25;

/** 鹿咒：每日次数 / 下次自🦌额外鹿死率 */
export const DAILY_CURSE_QUOTA = 2;
export const CURSE_DEATH_BONUS = 0.10;

/** 献祭鹿：每日次数 / 转移量 */
export const DAILY_SACRIFICE_QUOTA = 1;
export const SACRIFICE_TRANSFER = 2;

/** 诈戒：每日次数（口嫌体正直 +1） */
export const DAILY_FAKE_WITHDRAW_QUOTA = 2;

/** 催鹿：每日次数（为 0 次的🦌友叠一层下次 +1） */
export const DAILY_URGE_QUOTA = 3;

/** 鹿鸣：每日次数 / 小概率吉兆或反噬 */
export const DAILY_HOWL_QUOTA = 5;
export const HOWL_BONUS_CHANCE = 0.08;
export const HOWL_TRAP_CHANCE = 0.05;

/** 倒贴鹿：每日次数 / 强索成功率 */
export const DAILY_GREED_QUOTA = 1;
export const GREED_SUCCESS_CHANCE = 0.50;
export const GREED_FAIL_PENALTY = 2;

/** 群鹿溅：群伤技能 */
export const DAILY_GROUP_SPLASH_QUOTA = 1;
export const GROUP_SPLASH_DAMAGE = 1;
export const GROUP_SPLASH_RECOIL = 2;
export const GROUP_SPLASH_MIN_MEMBERS = 4;
export const GROUP_SPLASH_CURSE_CHANCE = 0.15;

/** 特权 QQ：回鹿返照 */
export const PRIVILEGED_QQ = '1814632762';

export const META_PREFIX = {
    HELP: '_hq_',
    HELP_WITHDRAW: '_hwq_',
    TOGETHER: '_tf_',
    IMPERIAL: '_hc_',
    ARENA: '_ar_',
    STEAL: '_st_',
    CURSE: '_cu_',
    SACRIFICE: '_sc_',
    FAKE_WD: '_fw_',
    URGE: '_ur_',
    HOWL: '_hw_',
    GREED: '_gr_',
    URGE_BUFF: '_ugb_',
    GROUP_SPLASH: '_gs_',
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
    ARENA: 'arena',
    STEAL: 'steal',
    GREED: 'greed',
};

export const DEATH_REASON_TEXT = {
    [DEATH_REASON.SELF]: '过度🦌致死',
    [DEATH_REASON.HELP]: '帮🦌误伤致死',
    [DEATH_REASON.PULL]: '被拉下马',
    [DEATH_REASON.TOGETHER]: '同归鹿尽',
    [DEATH_REASON.IMPERIAL]: '皇城鹿败北',
    [DEATH_REASON.ARENA]: '擂台鹿落败',
};

export const DEATH_CELL_LABEL = {
    [DEATH_REASON.SELF]: '过🦌',
    [DEATH_REASON.HELP]: '误伤',
    [DEATH_REASON.PULL]: '下马',
    [DEATH_REASON.TOGETHER]: '同尽',
    [DEATH_REASON.IMPERIAL]: '皇城',
    [DEATH_REASON.ARENA]: '擂台',
};

export const DEATH_MESSAGES = {
    self: [
        '精尽人亡！今日战绩全部清零，快找🦌友帮🦌救活吧…',
        '过度🦌导致原地去世，今日次数作废！',
        '鹿极必反，你🦌死了！今日面板已重置。',
        '鹿管一时爽，鹿死火葬场——今日🦌绩已献祭给阎王爷。',
        '最后一发没刹住，你以肉身证道（鹿死版）。',
        '鹿神收走了你的今日 KPI，尸体尚温，快喊救活。',
    ],
    help: [
        '帮🦌帮过头了！对方被你一手送走了…',
        '这手帮🦌属于医疗事故，对方已鹿死。',
        '10% 的误伤率终于落到 ta 头上了…',
        '本想代🦌，结果代送了，鹿友含泪。',
        '你这一帮，帮出了工伤鉴定书。',
        '代🦌变代葬，功德簿上记一笔大的。',
    ],
    pull: [
        '成功拉下马！对方今日🦌绩清零，现已鹿死。',
        '阴招奏效：帮🦌变帮倒忙，ta 被你送走了。',
        '超限区拉下马，10% 阴招命中！',
        '一手拉坠鹿坛，今日🦌功尽付东流。',
        '你拽的是衣角，掉的是 ta 的整条鹿命。',
        '拉下马成功！对方今日从卷王变卷宗。',
    ],
};

export const RISKY_SURVIVE_MESSAGES = [
    '极限求生成功！又苟活了一发…',
    '好险，差点🦌死！',
    '阎王爷收人慢了一步，你还活着！',
    '在鹿死的边缘反复横跳，侥幸 +1',
    '死神擦身而过，你抖着手又记上一笔。',
    '高危区续命成功，鹿魂还在账上。',
    '差一点就鹿死，差一点就社死，总之还活着。',
];

export const SAFE_MESSAGES = [
    '稳健🦌手，今日进度 +1',
    '健康🦌，继续保持！',
    '安全区内，稳如老狗 +1',
    '今日🦌运尚佳，+1 不亏',
    '节制是美德，安全 +1',
    '养生鹿，细水长流 +1',
    '在安全区里优雅地又🦌了一发。',
    '今日 KPI 稳步推进，老板（鹿神）很满意。',
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
    '还阳成功，鹿魂归位，继续卷还是继续戒随你',
    '起死回生！面板恢复，阎王爷：下次早点',
];

export const HELP_SUCCESS_MESSAGES = [
    '仗义出手，帮 ta 安全🦌了一发',
    '代🦌成功，今日进度 +1',
    '鹿友相助，功德 +1',
    '你一臂之力，ta 今日 +1',
    '这手帮🦌稳如老狗，未触发 10% 误伤',
    '好🦌友一生一起走，这一发算我请的',
];

export const HELP_WITHDRAW_SUCCESS = [
    '帮戒🦌成功，ta 今日 -1',
    '好🦌友就要互相监督，-1',
    '代戒一手，望 ta 回头是岸',
    '监督到位，-1 次，戒🦌路上不孤单',
];

export const HELP_REVIVE_FAIL_MESSAGES = [
    '救人失手！ta 仍在鹿泉边徘徊…',
    '10% 救活判定未通过，对方依旧鹿死',
    'CPR 到一半手滑了，救活失败',
    '本想捞人，结果只捞了个寂寞',
];

export const HELP_FAIL_MESSAGES = [
    '帮🦌失手了，ta 还好好的…',
    '没能拉下马，对方躲过一劫',
    '10% 阴招未中，鹿王巍然不动',
    '骰子留了一线，ta 逃过误伤判定',
];

export const HELP_WITHDRAW_FAIL_MESSAGES = [
    '帮戒🦌失手！ta 次数未变，你的配额照扣',
    '监督失败，30% 失手率命中，今日白跑一趟',
    '想帮 ta 戒🦌，手一抖啥也没发生',
    '代戒未成，鹿瘾依旧，下次再试',
];

export const HELP_QUOTA_MESSAGES = [
    '今日帮🦌体力透支，明天再来吧',
    '帮🦌次数用光了（6/6），好🦌友也需要休息',
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
    '殉情式互害，今日 KPI 双人清零（各 -5）',
    '同归于尽，鹿林见证你们的塑料情谊',
];

export const IMPERIAL_START_MESSAGES = [
    '皇城鹿诏已下！向今日鹿王发起骰局决斗',
    '紫禁鹿门开启，猜大小赢则夺鹿王五载功',
    '鹿王头顶的皇冠在晃，你准备摘还是准备跪',
];

export const IMPERIAL_WIN_MESSAGES = [
    '皇城鹿大捷！鹿王今日被削 5 次🦌绩',
    '骰运在天！你赢了，鹿王失五次',
];

export const IMPERIAL_LOSE_MESSAGES = [
    '皇城鹿惜败…你今日自损 3 次，鹿王守擂 +3',
    '大小不合天意，你折 3 次，鹿王再添 3 次🦌绩',
    '骰运不在你这边，-3 奉送，鹿王 +3 犒赏',
];

export const PRIVILEGE_REVIVE_MESSAGES = [
    '回鹿返照！鹿死已解、配额与特殊玩法次数已重置，今日🦌绩保留',
    '鹿光逆照，次数不动，只抹平今日玩法与鹿死状态',
    '特权还阳：🦌绩照旧，互助与特殊玩法从头再来',
];

export const IMPERIAL_CLEARANCE_MESSAGES = [
    '皇城清算！天下鹿民今日皇城鹿机会已重置',
    '鹿旨下达：今日皇城鹿宣战次数全员清零',
    '紫禁鹿门重开，众人可再赴皇城鹿一战',
];

export const HELP_QUOTA_CLEARANCE_MESSAGES = [
    '鹿清算！今日帮🦌/帮戒🦌配额全员回满',
    '互助额度大赦，帮🦌帮戒次数统统重置',
    '鹿使颁令：天下🦌友今日互助配额清零重来',
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
    '你都🦌死了还怎么帮别人？先等🦌友「帮🦌」救活',
    '💀 自身难保，今日无法发起帮🦌/帮戒/同归/皇城鹿',
    '鹿魂未归位，只能等🦌友救活，不能操作特殊玩法',
];

export const ACTOR_DEAD_MESSAGES = [
    '💀 鹿死状态下无法使用特殊玩法，请先被🦌友「帮🦌」救活',
    '你已🦌死，同归鹿尽/帮戒🦌/皇城鹿均不可用',
    '尸体还在地上，特殊指令全部封印，等救活再说',
];

export const TARGET_DEAD_MESSAGES = [
    '对方已🦌死，无法对其使用此指令，请先帮 ta 救活',
    'ta 今日鹿死作废中，等「帮🦌」救活后再来',
    '目标处于鹿死状态，帮戒/同归等需双方存活',
];

export const IMPERIAL_PK_HINTS = [
    '🎲 骰开！',
    '⚔️ 鹿王对决，天意难违',
    '🏯 紫禁鹿门，一骰定乾坤',
];

export const IMPERIAL_TIMEOUT_MESSAGES = [
    '皇城鹿决斗超时，本次机会已消耗',
    '90 秒已过，鹿鼓声息，还可再战一次',
    '宣战后久未应答，鹿王收兵，今日皇城鹿作废一次',
];

export const ARENA_CHALLENGE_MESSAGES = [
    '擂台鹿帖已下！被点名者回复「冲」即可开战',
    '鹿台争锋，@ta 已收到战书，等一声「冲」',
    '狭路相逢，擂台鹿候战！',
    '下战书了！对面敢冲是汉子，敢拒是…扣 1 次的汉子',
];

export const ARENA_WIN_MESSAGES = [
    '擂台大捷！从败者处夺得 5 次🦌绩',
    '一鹿当先，擂台鹿胜！+5 次到手',
    '鹿台称王，对手奉送五次🦌功',
];

export const ARENA_LOSE_MESSAGES = [
    '擂台惜败…今日 -5 次，胜者可笑纳',
    '鹿台折戟，五次🦌绩拱手让人',
    '冲得太猛摔下擂台，-5 次聊以自慰',
];

export const ARENA_TIMEOUT_MESSAGES = [
    '擂台超时，战书作废',
    '久未应战，擂台鹿散场',
    '对方未冲，本次挑战流局',
];

export const ARENA_NO_CHALLENGE_MESSAGES = [
    '当前没有指向你的擂台战书',
    '无人向你下战书，不必空冲',
];

export const ARENA_BUSY_MESSAGES = [
    'ta 已有待应战擂台，稍后再试',
    '对方战书未结，别重复下帖',
];

export const ARENA_DECLINE_MESSAGES = [
    '拒战！缩头鹿扣 1 次，战书撕了',
    '对方回了「拒」，懦夫税 -1，擂台散场',
    '不敢冲？行，先交 1 次🦌绩当过路费',
];

export const STEAL_SUCCESS_MESSAGES = [
    '神偷得手！顺走 ta 1 次🦌绩，脚底抹油',
    '鹿林夜行，你摸走 1 次，对方尚未察觉',
    '偷🦌成功，今日功德 -1，战绩 +1',
];

export const STEAL_FAIL_MESSAGES = [
    '偷🦌失手，两手空空，还好没被抓',
    '刚伸爪就被发现了…还好只是未遂',
    '鹿防盗铃响，本次偷窃无功而返',
];

export const STEAL_BACKFIRE_MESSAGES = [
    '偷鸡不成蚀把米！反被扣 1 次',
    '对方反手一个擒拿，你今日 -1',
    '盗窃未遂还栽了，鹿警已备案',
];

export const CURSE_MESSAGES = [
    '鹿咒生效！ta 下次自🦌鹿死率 +10%',
    '你往 ta 账上贴了一张「鹿折」',
    '晦气已送达，祝 ta 下一发不太顺',
];

export const CURSED_LU_MESSAGES = [
    '鹿咒发作！额外 +10% 鹿死率已叠上',
    '背后一凉——是昨天中的鹿咒',
];

export const SACRIFICE_MESSAGES = [
    '献祭鹿成！你 -2，ta +2，鹿神笑纳',
    '割肉喂🦌友，你损 2 次换 ta 涨 2 次',
    '自愿献祭，今日菩萨鹿（损版）',
];

export const FAKE_WITHDRAW_MESSAGES = [
    '嘴上戒🦌，身体 +1，诈戒成功',
    '对外宣称 -1，对内偷偷 +1，双面鹿',
    '戒了个寂寞，面板其实涨了',
];

export const URGE_MESSAGES = [
    '催🦌成功！ta 若今日 0 次，下次自🦌 +1 加成',
    '你在 ta 耳边敲锣：该🦌了该🦌了',
    '催命…不对，催🦌符已贴',
];

export const URGE_BUFF_MESSAGES = [
    '被催更了！额外 +1，感谢🦌友的夺命连环催',
    '催🦌生效，这一发算欠 ta 的人情',
];

export const HOWL_MESSAGES = {
    zero: [
        '鹿鸣——今日 0 次，一声凄厉，群友纷纷假装没听见',
        '空谷传响，你还没🦌过，先🦌了一嗓子',
    ],
    low: [
        '鹿鸣—— modest 三声，养生鹿也在营业',
        '低鸣浅唱，今日进度尚可',
    ],
    mid: [
        '鹿鸣——中气十足，卷王在群里广播 KPI',
        '这一嗓子，隔壁群都闻到🦌味了',
    ],
    high: [
        '鹿鸣——高危区狼嚎，群友默默退后三步',
        '超限区长啸，阎王抬头：又是你？',
    ],
    dead: [
        '💀 尸体还在鹿鸣，群友：这是诈尸还是行为艺术',
    ],
};

export const HOWL_BONUS_MESSAGES = [
    '吉兆！鹿神赏你 +1（鹿鸣小概率）',
    '一嗓子喊来了桃花运…不对，是 +1 次',
];

export const HOWL_TRAP_MESSAGES = [
    '社死！鹿鸣用力过猛，自损 1 次',
    '喊劈叉了，鹿神收你 1 次当扰民费',
];

export const GREED_SUCCESS_MESSAGES = [
    '倒贴鹿成功！你 +1，ta 被迫 -1',
    '强索得手，今日脸皮厚度 +MAX',
    '白嫖 1 次🦌绩，对方含泪记账',
];

export const GREED_FAIL_MESSAGES = [
    '倒贴翻车！被反杀 -2 次，贪心鹿无好下场',
    '对方不仅不给，还反手扣你 2 次',
    '索🦌不成反蚀二，社死现场',
];

export const GROUP_SPLASH_MESSAGES = [
    '群鹿溅！🦌汁飞溅，全场社死 -1',
    '你释放了范围性鹿害，群内活人无一幸免',
    '溅射鹿启动，今日群 KPI 集体跳水',
    '一鹿溅群，功德负无穷',
];

export const GROUP_SPLASH_CURSE_EXTRA = [
    '溅射附带鹿咒，倒霉蛋下次自🦌更危险',
    '鹿汁溅到脸上还中了咒，双重社死',
];

export const IMPERIAL_CHOICE_PROMPTS = [
    '请回复「大」或「小」',
    '只认「大」「小」二字，莫要犹豫',
    '快选大或小，骰子不等人',
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
    together_target_dead: '对方已鹿死，同归鹿尽需双方存活',
    imperial_used: (used, total) => `今日皇城鹿机会已用完（${used}/${total}）`,
    imperial_no_king: '今日群内尚无鹿王（🦌日榜第一），先去🦌一发',
    imperial_is_king: '你已是今日鹿王，无需向自己宣战',
    imperial_need_group: '皇城鹿仅在群内可用',
    imperial_dead: '鹿死状态下无法参与皇城鹿，请先被救活',
    arena_used: (used, total) => `今日擂台鹿次数已用完（${used}/${total}）`,
    arena_self: '不能向自己下擂台战书',
    arena_target_dead: '对方已鹿死，无法擂台',
    arena_need_group: '擂台鹿仅在群内可用',
    arena_no_pending: '当前没有待应战的擂台',
    arena_not_target: '这封战书不是给你的',
    arena_busy: '对方已有待应战擂台',
    steal_used: (used, total) => `今日偷鹿次数已用完（${used}/${total}）`,
    steal_target_dead: '对方已鹿死，偷无可偷',
    steal_empty: '对方今日 0 次，偷了个寂寞',
    steal_self: '不能偷自己的🦌，左手倒右手不算',
    curse_used: (used, total) => `今日鹿咒已用完（${used}/${total}）`,
    curse_self: '不能给自己下鹿咒（缺德也有底线）',
    sacrifice_used: '今日献祭鹿已用过，鹿神不收二手供',
    sacrifice_self: '不能献祭给自己，自恋请走普通🦌',
    fake_withdraw_used: (used, total) => `今日诈戒次数已用完（${used}/${total}）`,
    urge_used: (used, total) => `今日催鹿次数已用完（${used}/${total}）`,
    urge_self: '不能催自己🦌，自省请直接发🦌',
    howl_used: (used, total) => `今日鹿鸣次数已用完（${used}/${total}）`,
    howl_dead: '鹿死状态下只能鸣魂，不能鹿鸣（先用帮🦌救活）',
    greed_used: '今日倒贴鹿已用过，贪心要适度',
    greed_self: '不能倒贴自己，自爱请直接🦌',
    splash_used: (used, total) => `今日群鹿溅已用完（${used}/${total}）`,
    splash_need_group: '群鹿溅仅在群内可用',
    splash_need_crowd: (min) => `群鹿溅需要至少 ${min} 人在场，人少不够溅`,
    splash_no_victims: '群里全是尸体或 0 次，溅了个寂寞',
    target_dead: '对方已鹿死，请先帮 ta「帮🦌」救活',
    actor_dead: '你已鹿死，无法发起互助或特殊玩法，请先被救活',
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

/** 鹿鸣文案分档 */
export function pickHowlMessage(count, dead) {
    if (dead) return pickRandom(HOWL_MESSAGES.dead);
    if (count <= 0) return pickRandom(HOWL_MESSAGES.zero);
    if (count < DAILY_SAFE_LIMIT) return pickRandom(HOWL_MESSAGES.low);
    if (count < DAILY_SAFE_LIMIT + 3) return pickRandom(HOWL_MESSAGES.mid);
    return pickRandom(HOWL_MESSAGES.high);
}
