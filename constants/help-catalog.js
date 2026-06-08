/**
 * 鹿插件指令与生态说明（帮助图唯一数据源）
 */
import { D_SHOW, WEATHER_CMD_SHOW } from './commands.js';
import { PRIVILEGED_QQ } from './game.js';
import { PROFESSION_HELP_RANGE, PROFESSION_LIST_TEXT, PROFESSION_WITHDRAW_RANGE } from './profession.js';
import {
    ARENA_STAKE,
    DAILY_ARENA_QUOTA,
    DAILY_CURSE_QUOTA,
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
    DAILY_HELP_QUOTA,
    DAILY_HELP_WITHDRAW_QUOTA,
    DAILY_HOWL_QUOTA,
    DAILY_IMPERIAL_QUOTA,
    DAILY_SAFE_LIMIT,
    DAILY_SACRIFICE_QUOTA,
    DAILY_STEAL_QUOTA,
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
            { cmd: `戒${D_SHOW}`, desc: '自律 -1（可扣到负数）', quota: '不限次数' },
            { cmd: `${D_SHOW}况 / @ta ${D_SHOW}况`, desc: '今日鹿况渲染图（可围观）', quota: '含天象/咒福/配额一览' },
            { cmd: `看${D_SHOW} / @ta 看${D_SHOW} / 看${D_SHOW}6`, desc: '月历面板（支持 @ 围观）', quota: '💀格=鹿死原因缩写' },
            { cmd: `${D_SHOW}榜 / ${D_SHOW}日榜 / 年榜`, desc: '月/年榜按当月正负净值合计', quota: '日榜仍看当日 · 鹿死当日不计榜' },
        ],
    },
    friends: {
        title: '🦌友互助',
        emoji: '🤝',
        items: [
            { cmd: `添加${D_SHOW}友@ta`, desc: '双向结缘', quota: '互助/解咒/借鹿需好友' },
            { cmd: `帮${D_SHOW}@ta`, desc: '代🦌 / 救活鹿死', quota: `依职业 ${PROFESSION_HELP_RANGE[0]}~${PROFESSION_HELP_RANGE[1]} 次/日 · 失手 ${Math.round(HELP_FAIL_CHANCE * 100)}% 起` },
            { cmd: `帮戒${D_SHOW}@ta`, desc: '帮 ta -1', quota: `依职业 ${PROFESSION_WITHDRAW_RANGE[0]}~${PROFESSION_WITHDRAW_RANGE[1]} 次/日 · 失手 ${Math.round(HELP_WITHDRAW_FAIL_CHANCE * 100)}% 起` },
            { cmd: `${D_SHOW}配额 / 帮${D_SHOW}次数 / 帮戒${D_SHOW}次数`, desc: '查今日互助剩余次数', quota: '与职业上限联动 · 须先转职' },
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
            { cmd: `偷${D_SHOW}@ta`, desc: '35% 偷 1 · 带咒每层 +5%', quota: `${DAILY_STEAL_QUOTA} 次/日 · 反噬 ${Math.round(STEAL_BACKFIRE_CHANCE * 100)}%` },
            { cmd: `${D_SHOW}咒@ta`, desc: `叠毒 · 每层 +${Math.round(CURSE_DEATH_BONUS * 100)}% 鹿死`, quota: `${DAILY_CURSE_QUOTA} 次/日 · ${CURSE_ASCENDED_STACKS} 层天咒` },
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
            { cmd: `${D_SHOW}职业`, desc: '【每日必做】选定职业后玩法解锁', quota: '未转职封印全部玩法 · 仅鹿碑/看榜/帮助可用' },
            { cmd: '转职鹿医 / 转职戒师 / 转职卷王 / 转职巡游', desc: '首次转职后当日锁定', quota: '各职业 buff/天象联动见说明书' },
            { cmd: `${D_SHOW}技`, desc: '查看今日专属技状态', quota: '每职业 1 次/日' },
            { cmd: `${D_SHOW}巡`, desc: '巡游专属：下一次玩法天象正向 ×1.35', quota: '仅巡游鹿 · 1 次/日' },
            { cmd: '愈鹿@ / 鹿愈@', desc: '鹿医专属：零失手帮 +1/救活', quota: '不占帮鹿配额 · 1 次/日' },
            { cmd: '清规@', desc: '戒灵专属：零失手帮 -2', quota: '不占帮戒配额 · 1 次/日' },
            { cmd: '卷王冲 / 卷冲', desc: '卷王专属：强制安全自🦌 +2', quota: '1 次/日' },
        ],
    },
    weather: {
        title: '鹿林天象',
        emoji: '🌤',
        items: [
            { cmd: WEATHER_CMD_SHOW, desc: '当前半天场次详情卡（15 维度修正）', quota: '00:00 / 12:00 换场 · 群播见「鹿管配置」' },
            { cmd: '天象一览 / 鹿林天象', desc: '八象图鉴 · 高亮当前天象', quota: '与「鹿环境」互补 · 不与通用天气抢指令' },
            { cmd: '鹿神赐福 [天气]', desc: '特权鹿使覆写天象（8 种可点名）', quota: `仅 QQ ${PRIVILEGED_QQ} · 非群管 · 至换场/再赐福` },
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
            { cmd: `回${D_SHOW}返照`, desc: '自己还阳 + 重置个人玩法次数', quota: `仅 QQ ${PRIVILEGED_QQ}` },
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
        sectionKeys: ['base', 'profession', 'friends', 'playful', 'weather', 'eco'],
    },
    {
        key: 'beyond',
        title: '冥界篇 · 对线与王座',
        subtitle: '第 2/2 张 · 特权后门 · 死亡 DLC 全收录',
        sectionKeys: ['pvp', 'death', 'privilege', 'data', 'easter'],
    },
];

/** @deprecated 兼容旧引用 */
export const HELP_CATALOG = HELP_PAGES.flatMap((page) =>
    page.sectionKeys.map((key) => HELP_SECTIONS[key]),
);

export const HELP_FOOTER = '鹿管说明书 · 数据 Redis · 天象群播见控制台「鹿管配置」';
export const HELP_TAGLINE = '一只鹿管，全村社死';
