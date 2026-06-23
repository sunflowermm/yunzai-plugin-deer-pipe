/**
 * 鹿插件指令与生态说明（帮助图唯一数据源）
 */
import { D_SHOW, WEATHER_CMD_SHOW } from './commands.js';
import { BALANCED_FORMULA_HINT } from './balanced-score.js';
import { PRIVILEGED_QQS } from './game.js';

const PRIVILEGED_QQ_HINT = `仅 QQ ${PRIVILEGED_QQS.join('、')}`;
import { PROFESSION_HELP_RANGE, PROFESSION_WITHDRAW_RANGE } from './profession.js';
import { PROFESSION_QUOTA_TABLE, QUOTA } from './profession-quotas.js';
import {
    EXTRA_DEER_SKILLS,
    YUMUMU_BIND_MINUTES,
    YUMUMU_IMPOTENCE_CHANCE,
    formatExtraDeerQuotaBrief,
    formatYumumuBindCutoffHint,
    getExtraDeerDef,
    resolveExtraDeerQuotas,
} from './extra-deer.js';
import {
    ARENA_STAKE,
    DAILY_ARENA_QUOTA,
    DAILY_CLEANSE_CURSE_QUOTA,
    DAILY_BLESS_QUOTA,
    BLESS_MAX_STACKS,
    BLESS_MAX_ROUNDS,
    BLESS_DEATH_REDUCE,
    DAILY_CLEANSE_BLESS_QUOTA,
    CURSE_MAX_ROUNDS,
    CURSE_ASCENDED_STACKS,
    CURSE_MAX_STACKS,
    CURSE_DEATH_BONUS,
    DAILY_FAKE_WITHDRAW_QUOTA,
    DAILY_GREED_QUOTA,
    DAILY_GROUP_SPLASH_QUOTA,
    GROUP_SPLASH_TOP_N,
    DAILY_HOWL_QUOTA,
    DAILY_IMPERIAL_QUOTA,
    DAILY_SAFE_LIMIT,
    DAILY_SACRIFICE_QUOTA,
    DAILY_URGE_QUOTA,
    DAILY_BORROW_QUOTA,
    BORROW_MIN_TARGET_COUNT,
    DAILY_BUMPER_QUOTA,
    BUMPER_WIN_CHANCE,
    DAILY_LOTTERY_QUOTA,
    TOGETHER_FALL_COST,
    STEAL_BACKFIRE_CHANCE,
    DAILY_SPECTRAL_CURSE_QUOTA,
    DAILY_VENGEANCE_QUOTA,
    VENGEANCE_CURSE_CHANCE,
    VENGEANCE_DEDUCT_CHANCE,
    VENGEANCE_SUBSTITUTE_CURSE_CHANCE,
    DAILY_DREAM_QUOTA,
    DAILY_REVIVE_LOTTERY_QUOTA,
    MEIJIA_TEAM_SYNC_MAX,
    REVIVE_LOTTERY_FULL_CHANCE,
    REVIVE_LOTTERY_WEAK_CHANCE,
    GHOST_HOWL_KILLER_CURSE_CHANCE,
    HELP_FAIL_CHANCE,
    HELP_WITHDRAW_FAIL_CHANCE,
} from './game.js';

/** @typedef {{ cmd: string, desc: string, quota: string, tag?: string }} HelpItem */
/** @typedef {{ title: string, emoji: string, items: HelpItem[] }} HelpSection */

/** @type {Record<string, HelpSection>} */
export const HELP_SECTIONS = {
    base: {
        title: '基础操作',
        emoji: '🦌',
        items: [
            { cmd: D_SHOW, desc: '自🦌 +1', quota: `安全 ${DAILY_SAFE_LIMIT} 次/日，超限递增鹿死` },
            { cmd: `连${D_SHOW}`, desc: '单人自动连🦌直至鹿死', quota: '过程发聊天记录 · 须已转职 · 鹿车上不可用' },
            { cmd: `戒${D_SHOW}`, desc: '自律 -1（可扣到负数）', quota: '不限次数' },
            { cmd: `${D_SHOW}况 / @ta ${D_SHOW}况`, desc: '今日鹿况渲染图（可围观）', quota: '含天象/咒福/配额一览' },
            { cmd: `看${D_SHOW} / @ta 看${D_SHOW} / 看${D_SHOW}6`, desc: '月历面板（支持 @ 围观）', quota: '💀格=鹿死原因缩写' },
            { cmd: `${D_SHOW}榜 / ${D_SHOW}日榜 / 年榜`, desc: '月/年榜按当月正负净值合计', quota: '日榜仍看当日 · 鹿死当日不计榜' },
            { cmd: '综合榜 / 鹿王榜', desc: '综合平衡分（与 0 点鹿王册封同算法）', quota: BALANCED_FORMULA_HINT },
            { cmd: `奶${D_SHOW}榜 / 戒师榜 / 救活榜 / 活跃榜`, desc: '互助奶榜 · 帮戒 · 救活 · 玩法尝试', quota: '均支持日榜/年榜' },
            { cmd: '卷王榜 / 恶趣榜', desc: '单日最高🦌绩 · 互害玩法次数', quota: '卷王榜看峰值 · 恶趣榜看偷咒擂台等' },
        ],
    },
    friends: {
        title: '🦌友互助',
        emoji: '🤝',
        items: [
            { cmd: `添加${D_SHOW}友@ta`, desc: '双向结缘', quota: '互助/解咒/借鹿需好友' },
            { cmd: `帮${D_SHOW}@ta`, desc: '代🦌 / 救活鹿死', quota: `依职业 ${PROFESSION_HELP_RANGE[0]}~${PROFESSION_HELP_RANGE[1]} 次/日 · 失手 ${Math.round(HELP_FAIL_CHANCE * 100)}% 起` },
            { cmd: '鹿车@ta', desc: '邀请🦌友上车，对方 context 内回复「发车」', quota: '连鹿至死/帮鹿用尽 · 过程发聊天记录 · 帮鹿位禁自鹿' },
            { cmd: '发车', desc: '被邀请方在限时内确认上车', quota: '连鹿直至发车位鹿死且帮鹿用尽 · 详情见聊天记录' },
            { cmd: `帮戒${D_SHOW}@ta`, desc: '帮 ta -1', quota: `依职业 ${PROFESSION_WITHDRAW_RANGE[0]}~${PROFESSION_WITHDRAW_RANGE[1]} 次/日 · 失手 ${Math.round(HELP_WITHDRAW_FAIL_CHANCE * 100)}% 起` },
            { cmd: `帮${D_SHOW}次数 / 帮戒${D_SHOW}次数`, desc: '文字查互助剩余（图看发鹿况）', quota: '与职业上限联动 · 须先转职' },
            { cmd: `解${D_SHOW}咒@ta`, desc: '撕咒印（清全部层）', quota: `${DAILY_CLEANSE_CURSE_QUOTA} 次/日` },
            { cmd: `${D_SHOW}福@ta`, desc: `正面咒 · 每层 -${Math.round(BLESS_DEATH_REDUCE * 100)}% 鹿死`, quota: `${DAILY_BLESS_QUOTA} 次/日 · 最多 ${BLESS_MAX_STACKS} 层 ${BLESS_MAX_ROUNDS} 回合` },
            { cmd: `解${D_SHOW}福@ta`, desc: '收福咒（清全部层）', quota: `${DAILY_CLEANSE_BLESS_QUOTA} 次/日` },
            { cmd: `借${D_SHOW}@ta`, desc: '你 +1 ta -1 · 顺带撕 1 层咒', quota: `${DAILY_BORROW_QUOTA} 次/日 · ta 当月净值≥${BORROW_MIN_TARGET_COUNT}` },
        ],
    },
    playful: {
        title: '互害恶趣味',
        emoji: '😈',
        items: [
            { cmd: `偷${D_SHOW}@ta`, desc: '35% 偷 1 · 带咒每层 +5%', quota: `依职业（窃光鹿最多 ${PROFESSION_QUOTA_TABLE.rogue.steal}）· 反噬 ${Math.round(STEAL_BACKFIRE_CHANCE * 100)}%` },
            { cmd: `${D_SHOW}咒@ta`, desc: `叠毒 · 每层 +${Math.round(CURSE_DEATH_BONUS * 100)}% 鹿死`, quota: `依职业（叠咒鹿最多 ${PROFESSION_QUOTA_TABLE.curser.curse}）· ${CURSE_ASCENDED_STACKS} 层天咒` },
            { cmd: `献祭${D_SHOW}@ta`, desc: '你 -2，ta +2', quota: `${DAILY_SACRIFICE_QUOTA} 次/日` },
            { cmd: `倒贴${D_SHOW}@ta`, desc: '50% 你+1 ta-1 / 败 -1', quota: `${DAILY_GREED_QUOTA} 次/日` },
            { cmd: `催${D_SHOW}@ta`, desc: '0 次叠催更 buff · 带咒者咒回合 -1', quota: `${DAILY_URGE_QUOTA} 次/日` },
            { cmd: '诈戒 / 诈戒鹿', desc: '嘴上戒🦌，实际 +1', quota: `${DAILY_FAKE_WITHDRAW_QUOTA} 次/日` },
            { cmd: `${D_SHOW}鸣`, desc: '嚎叫 · 吉兆震咒 · 鹿死鸣魂咒凶手', quota: `${DAILY_HOWL_QUOTA} 次/日 · 鸣魂 ${Math.round(GHOST_HOWL_KILLER_CURSE_CHANCE * 100)}%` },
            { cmd: `群${D_SHOW}溅`, desc: '日榜 Top5 各 -1 · 带咒引爆', quota: `${DAILY_GROUP_SPLASH_QUOTA} 次/日 · 溅 ${GROUP_SPLASH_TOP_N} 人 · 自损 1` },
            { cmd: `碰瓷${D_SHOW}@ta`, desc: `${Math.round(BUMPER_WIN_CHANCE * 100)}% 你+1 / 32% 双-1 / 30% 你-2`, quota: `${DAILY_BUMPER_QUOTA} 次/日 · 无需🦌友` },
            { cmd: `抽${D_SHOW}签`, desc: '运势签 · ±1/催更符/自咒/撕咒/空签', quota: `${DAILY_LOTTERY_QUOTA} 次/日 · 吃天象 lotteryLuck` },
        ],
    },
    profession: {
        title: '每日鹿职业',
        emoji: '🎭',
        items: [
            { cmd: `${D_SHOW}职业`, desc: '【每日必做】选定职业后玩法解锁 · 附职业一览图', quota: '未转职封印全部玩法 · 仅鹿碑/看榜/帮助可用' },
            { cmd: `${D_SHOW}职业卷王 / ${D_SHOW}职业卡窃光`, desc: '查看某职业静态卡（配额/天赋/专属技）', quota: '无需转职 · 预渲染快出图' },
            { cmd: '转职鹿医师 / 转职戒师 / 转职卷王 / 转职巡游 等', desc: '8 职业：含向日葵鹿 · 详见鹿职业一览', quota: '首次转职后当日锁定 · 各职业全玩法次数不同' },
            { cmd: `${D_SHOW}技`, desc: '查看今日专属技状态', quota: '每职业 1 次/日' },
            { cmd: `${D_SHOW}巡 / 愈鹿@ / 清规@ / 卷冲`, desc: '巡游/鹿医师/戒灵师/卷王专属技', quota: '须对应职业 · 鹿医师帮鹿成功 12% 帮鹿次数+1' },
            { cmd: '咒缚@ / 广福@ / 夜袭@ / 向阳@ / 组队@ / 束缚@ / 带派 / 操你血妈', desc: '叠咒/福鹿使/窃光/向日葵/王美嘉/雨木木/语姐/许月珍专属技', quota: '不占对应玩法配额 · 1 次/日' },
        ],
    },
    extraDeer: {
        title: '番外隐藏鹿',
        emoji: '✨',
        items: [
            {
                cmd: '转职王美嘉 / 转职雨木木 / 转职语姐 / 转职许月珍',
                desc: '与八职业互斥 · 当日锁定 · 「鹿职业」第二张图',
                quota: `王美嘉 ${formatExtraDeerQuotaBrief('meijia')} · 雨木木 ${formatExtraDeerQuotaBrief('yumumu')} · 语姐 ${formatExtraDeerQuotaBrief('yujie')} · 许月珍 ${formatExtraDeerQuotaBrief('xuyuezhen')}`,
            },
            {
                cmd: EXTRA_DEER_SKILLS.meijia.cmd,
                desc: '王美嘉专属 · 绑定 1 鹿友：自鹿 +1 时搭档同步 +1',
                quota: `每日联动 ≤${MEIJIA_TEAM_SYNC_MAX} 次 · 净值≥0 · 双亡 · 不可戒鹿`,
            },
            {
                cmd: EXTRA_DEER_SKILLS.yumumu.cmd,
                desc: `雨木木专属 · 目标 ${YUMUMU_BIND_MINUTES} 分钟禁自鹿（仍可被帮鹿）`,
                quota: `仅 ${formatYumumuBindCutoffHint()} · 1 次/日 · 帮鹿 ${Math.round(YUMUMU_IMPOTENCE_CHANCE * 100)}% 挂阳痿 debuff`,
            },
            {
                cmd: EXTRA_DEER_SKILLS.yujie.cmd,
                desc: '语姐专属 · 带派脚丫子蓄势：下一次皇城鹿掷骰必胜',
                quota: `催鹿/皇城配额偏高 · 天赋皇城胜势 +20% · 1 次/日`,
            },
            {
                cmd: EXTRA_DEER_SKILLS.xuyuezhen.cmd,
                desc: '许月珍专属 · 绿恐龙暴走：随机 ±2/±1/咒/福/催更/空签',
                quota: `抽鹿签配额 ${resolveExtraDeerQuotas('xuyuezhen')[QUOTA.lottery] ?? 0} · 天赋吉兆 +10% · 1 次/日`,
            },
            {
                cmd: '看鹿职业卡雨木木 / 雨木木鹿端午 / 语姐鹿年限',
                desc: '番外静态专精卡 · 端午/年限立绘免费随时切换（默认不穿皮肤）',
                quota: `帮鹿 ${getExtraDeerDef('yumumu').helpQuota} · ${Math.round(YUMUMU_IMPOTENCE_CHANCE * 100)}% 阳痿 · 束缚 ${YUMUMU_BIND_MINUTES} 分/${formatYumumuBindCutoffHint()}`,
            },
        ],
    },
    weather: {
        title: '鹿林天象',
        emoji: '🌤',
        items: [
            { cmd: WEATHER_CMD_SHOW, desc: '当前半天场次详情卡（15 维度修正）', quota: '00:00 / 12:00 换场 · 群播见「鹿管配置」' },
            { cmd: '天象一览 / 鹿林天象', desc: '八象图鉴 · 高亮当前天象', quota: '与「鹿环境」互补 · 不与通用天气抢指令' },
            { cmd: '鹿神赐福 [天气]', desc: '特权鹿使覆写天象（8 种可点名）', quota: `${PRIVILEGED_QQ_HINT} · 非群管 · 至换场/再赐福` },
        ],
    },
    eco: {
        title: '生态机制',
        emoji: '🧬',
        items: [
            { cmd: '机制·安全/超限', desc: `安全区=前 N 次自🦌零鹿死（默认 ${DAILY_SAFE_LIMIT}）；超限后每次 +2% 鹿死`, quota: '卷王/天象 safeBonus 可抬高 N · 鹿况图可见' },
            { cmd: '机制·咒福叠层', desc: `咒 ${CURSE_MAX_STACKS} 层上限 · 福 ${BLESS_MAX_STACKS} 层 · 可互解`, quota: `${CURSE_MAX_ROUNDS} 回合内生效 · ${CURSE_ASCENDED_STACKS} 层称天咒` },
            { cmd: '机制·催更符', desc: '对被催的 0 次者，下次自🦌/被帮 +1', quota: '催带咒目标 = 咒回合 -1' },
            { cmd: '机制·全局联动', desc: '偷/帮/碰瓷/倒贴/鸣/溅/签/救活/叠咒概率均吃天象', quota: `鹿况图与「${WEATHER_CMD_SHOW}」可看实时修正` },
        ],
    },
    skin: {
        title: '界面主题与立绘',
        emoji: '🎨',
        items: [
            { cmd: `${D_SHOW}皮肤`, desc: '列出界面主题（样式皮肤 · 免费切换）', quota: '鹿况/月历/帮助/PK 等配色 · 与立绘独立' },
            { cmd: `${D_SHOW}皮肤端午 / 默认`, desc: '切换界面主题 · 永久保存', quota: '未设置时恒为默认 · 不跟节日自动变色' },
            { cmd: `${D_SHOW}立绘`, desc: '端午立绘解锁进度', quota: '仅查进度 · 不切换立绘' },
            { cmd: '卷王鹿端午 / 鹿医师端午 / 雨木木鹿端午 / 王美嘉鹿端午', desc: '按职业切换立绘', quota: '八职业端午须活动解锁 · 番外端午免费随时切换' },
        ],
    },
    pvp: {
        title: '对线大招',
        emoji: '⚔️',
        items: [
            { cmd: `擂台${D_SHOW}@ta`, desc: 'ta 在待战上下文回「冲」/「拒」', quota: `${DAILY_ARENA_QUOTA} 次/日 · 胜负 ±${ARENA_STAKE}` },
            { cmd: `同归${D_SHOW}尽@ta`, desc: `双方各 -${TOGETHER_FALL_COST}`, quota: '1 次/日 · 需🦌友' },
            { cmd: `皇城${D_SHOW}`, desc: '猜大小 PK 日榜第一', quota: `${DAILY_IMPERIAL_QUOTA} 次/日 · 仅群内` },
        ],
    },
    death: {
        title: '死亡生态',
        emoji: '💀',
        items: [
            { cmd: '鹿死', desc: '当日🦌绩清零不计榜 · 活人玩法封印', quota: '帮🦌救活 · 冥界玩法照常' },
            { cmd: `${D_SHOW}碑`, desc: '死因/凶手/丢失次数', quota: '仅鹿死' },
            { cmd: `冥${D_SHOW}咒@ta`, desc: '亡魂叠咒（同鹿咒）', quota: `${DAILY_SPECTRAL_CURSE_QUOTA} 次/日` },
            { cmd: `索命${D_SHOW}@ta`, desc: `有凶手须@凶手 · ${Math.round(VENGEANCE_CURSE_CHANCE * 100)}%咒/${Math.round(VENGEANCE_DEDUCT_CHANCE * 100)}%扣次`, quota: `${DAILY_VENGEANCE_QUOTA} 次/日 · 无凶替身 ${Math.round(VENGEANCE_SUBSTITUTE_CURSE_CHANCE * 100)}%咒` },
            { cmd: `托梦${D_SHOW}@🦌友`, desc: '缓咒回合或贴催更符', quota: `${DAILY_DREAM_QUOTA} 次/日` },
            { cmd: '还阳签', desc: `${Math.round(REVIVE_LOTTERY_FULL_CHANCE * 100)}%满血 / ${Math.round(REVIVE_LOTTERY_WEAK_CHANCE * 100)}%残魂1次`, quota: `${DAILY_REVIVE_LOTTERY_QUOTA} 次/日` },
            { cmd: `${D_SHOW}帮助`, desc: '本说明书（共 2 张图）', quota: '鹿/🦌 指令完全等价' },
        ],
    },
    privilege: {
        title: '特权鹿使',
        emoji: '👑',
        items: [
            { cmd: `回${D_SHOW}返照`, desc: '自己还阳 + 重置个人玩法次数', quota: PRIVILEGED_QQ_HINT },
            { cmd: `${D_SHOW}清算`, desc: '全员帮🦌/帮戒配额清零', quota: '特权专属' },
            { cmd: '皇城清算', desc: '全员皇城鹿次数清零', quota: '特权专属 · 作废进行中场次' },
            { cmd: '恶趣清算', desc: '偷咒献祭擂台同归等次数清零', quota: '特权专属 · 撕战书' },
            { cmd: '大赦众生', desc: '全员还阳 + 全部玩法次数清零', quota: '特权专属 · 终极后门' },
            { cmd: '鹿神赐福', desc: '改天象 + 可选群播（控制台配群）', quota: `非机器人主人/群管 · 见「鹿林天象」` },
        ],
    },
    data: {
        title: '数据与配置',
        emoji: '📁',
        items: [
            { cmd: `我的${D_SHOW}友`, desc: '查看结缘列表', quota: '绝交指令同添加格式' },
            { cmd: `看${D_SHOW}历 / ${D_SHOW}历`, desc: '年度/月度鹿迹热力图', quota: '与看🦌月历同源数据' },
            { cmd: '控制台·鹿管配置', desc: '天象/鹿王群播 · mode · 群号 Tags', quota: '鹿王 00:00 加冕昨日日榜第一 · data/deer_pipe/config.yaml' },
        ],
    },
    easter: {
        title: '彩蛋提示',
        emoji: '🥚',
        items: [
            { cmd: '等价·鹿🦌', desc: '所有指令「鹿」与 emoji 🦌 可互换', quota: '正则统一由 commands.js 维护' },
            { cmd: '彩蛋·诈戒真香', desc: '口嫌体正直 +1，与真戒🦌独立计数', quota: '适合深夜嘴硬' },
            { cmd: '彩蛋·鹿虹日', desc: '天象鹿虹：全面减伤 +1 安全区 + 签运大吉', quota: '阴霾/雷暴日请收敛' },
            { cmd: '彩蛋·冥界营业', desc: '鹿死后仍可鸣魂/冥咒/索命/托梦/还阳签', quota: '活人专属帮🦌是最佳救场' },
        ],
    },
};

/** 双页帮助图分页 */
export const HELP_PAGES = [
    {
        key: 'live',
        title: '活鹿篇 · 玩法与天象',
        subtitle: '发送「鹿帮助」· 第 1/2 张 · 鹿与🦌等价',
        sectionKeys: ['base', 'profession', 'extraDeer', 'friends', 'playful', 'weather', 'eco', 'skin'],
    },
    {
        key: 'beyond',
        title: '冥界篇 · 对线与王座',
        subtitle: '第 2/2 张 · 特权后门 · 死亡 DLC 全收录',
        sectionKeys: ['pvp', 'death', 'privilege', 'data', 'easter'],
    },
];

export const HELP_FOOTER = '鹿管说明书 · 数据 Redis · 天象群播见控制台「鹿管配置」';
export const HELP_TAGLINE = '一只鹿管，全村社死';
