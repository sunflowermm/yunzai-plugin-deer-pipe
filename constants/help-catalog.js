/**

 * 鹿插件指令与每日配额一览（帮助图 / 文案唯一数据源）

 */

import { D_SHOW } from './commands.js';

import {

    ARENA_STAKE,

    DAILY_ARENA_QUOTA,

    DAILY_CURSE_QUOTA,
    DAILY_CLEANSE_CURSE_QUOTA,
    CURSE_MAX_ROUNDS,
    CURSE_ASCENDED_STACKS,

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

    HELP_FAIL_CHANCE,

    HELP_WITHDRAW_FAIL_CHANCE,

} from './game.js';



/** @typedef {{ cmd: string, desc: string, quota: string, tag?: string }} HelpItem */

/** @typedef {{ title: string, emoji: string, items: HelpItem[] }} HelpSection */



/** @type {HelpSection[]} */

export const HELP_CATALOG = [

    {

        title: '基础操作',

        emoji: '🦌',

        items: [

            { cmd: D_SHOW, desc: '自🦌 +1', quota: `安全 ${DAILY_SAFE_LIMIT} 次/日，超限递增鹿死` },

            { cmd: `戒${D_SHOW}`, desc: '自律 -1（可扣到负数）', quota: '不限次数' },

            { cmd: `${D_SHOW}况 / @ta ${D_SHOW}况`, desc: '今日鹿况渲染图（可围观他人）', quota: '不限' },

            { cmd: `看${D_SHOW} / @ta 看${D_SHOW} / 看${D_SHOW}6`, desc: '月历面板（支持 @ 围观）', quota: '不限' },

            { cmd: `${D_SHOW}榜 / ${D_SHOW}日榜`, desc: '排行', quota: '不限' },

        ],

    },

    {

        title: '🦌友互助',

        emoji: '🤝',

        items: [

            { cmd: `添加${D_SHOW}友@ta`, desc: '双向结缘', quota: '不限' },

            { cmd: `帮${D_SHOW}@ta`, desc: '代🦌 / 救活鹿死', quota: `${DAILY_HELP_QUOTA} 次/日 · 失手 ${Math.round(HELP_FAIL_CHANCE * 100)}%` },

            { cmd: `帮戒${D_SHOW}@ta`, desc: '帮 ta -1', quota: `${DAILY_HELP_WITHDRAW_QUOTA} 次/日 · 失手 ${Math.round(HELP_WITHDRAW_FAIL_CHANCE * 100)}%` },

            { cmd: `解${D_SHOW}咒@ta`, desc: '为🦌友撕咒印（清全部层数）', quota: `${DAILY_CLEANSE_CURSE_QUOTA} 次/日` },

            { cmd: `借${D_SHOW}@ta`, desc: `你 +1 ta -1 · 顺带撕 1 层咒`, quota: `${DAILY_BORROW_QUOTA} 次/日 · ta 需≥${BORROW_MIN_TARGET_COUNT}` },

        ],

    },

    {

        title: '互害恶趣味',

        emoji: '😈',

        items: [

            { cmd: `偷${D_SHOW}@ta`, desc: '35% 偷 1 · 带咒每层 +5% · 失手可能反咒', quota: `${DAILY_STEAL_QUOTA} 次/日 · 反噬 ${Math.round(STEAL_BACKFIRE_CHANCE * 100)}%` },

            { cmd: `${D_SHOW}咒@ta`, desc: `叠层毒咒 · 每层 +10% 鹿死 · ${CURSE_MAX_ROUNDS} 回合内生效`, quota: `${DAILY_CURSE_QUOTA} 次/日 · ${CURSE_ASCENDED_STACKS} 层天咒` },

            { cmd: `献祭${D_SHOW}@ta`, desc: '你 -2，ta +2', quota: `${DAILY_SACRIFICE_QUOTA} 次/日` },

            { cmd: `倒贴${D_SHOW}@ta`, desc: '50% 你+1 ta-1 / 败 -1', quota: `${DAILY_GREED_QUOTA} 次/日` },

            { cmd: `催${D_SHOW}@ta`, desc: '0 次叠催更 buff · 带咒者咒回合 -1', quota: `${DAILY_URGE_QUOTA} 次/日` },

            { cmd: '诈戒 / 诈戒鹿', desc: '嘴上戒🦌，实际 +1', quota: `${DAILY_FAKE_WITHDRAW_QUOTA} 次/日` },

            { cmd: `${D_SHOW}鸣`, desc: '嚎叫 · 吉兆可震散 1 层咒', quota: `${DAILY_HOWL_QUOTA} 次/日` },

            { cmd: `群${D_SHOW}溅`, desc: '日榜 Top5 各 -1 · 带咒引爆再 -1 · 20% 叠咒', quota: `${DAILY_GROUP_SPLASH_QUOTA} 次/日 · 溅 ${GROUP_SPLASH_TOP_N} 人 · 自损 1` },

            { cmd: `碰瓷${D_SHOW}@ta`, desc: `${Math.round(BUMPER_WIN_CHANCE * 100)}% 你+1 / 32% 双-1 / 30% 你-2`, quota: `${DAILY_BUMPER_QUOTA} 次/日 · 无需🦌友` },

            { cmd: `抽${D_SHOW}签`, desc: '单人运势签 · ±1/催更符/自咒/撕咒/空签', quota: `${DAILY_LOTTERY_QUOTA} 次/日` },

        ],

    },

    {

        title: '对线大招',

        emoji: '⚔️',

        items: [

            { cmd: `擂台${D_SHOW}@ta`, desc: 'ta 在待战上下文内回「冲」/「拒」（优先于普通指令）', quota: `${DAILY_ARENA_QUOTA} 次/日 · 胜负 ±${ARENA_STAKE}` },

            { cmd: `同归${D_SHOW}尽@ta`, desc: `双方各 -${TOGETHER_FALL_COST}`, quota: '1 次/日' },

            { cmd: `皇城${D_SHOW}`, desc: '猜大小 PK 日榜第一', quota: `${DAILY_IMPERIAL_QUOTA} 次/日` },

        ],

    },

    {

        title: '冷知识',

        emoji: '💀',

        items: [

            { cmd: '鹿死', desc: '当日🦌绩清零不计榜', quota: '等帮🦌救活' },

            { cmd: `${D_SHOW}帮助`, desc: '就是本图', quota: '随便看' },

        ],

    },

    {

        title: '鹿使后门',

        emoji: '👑',

        items: [

            { cmd: `回${D_SHOW}返照`, desc: '自己还阳 + 重置个人玩法次数', quota: '保留今日🦌绩' },

            { cmd: `${D_SHOW}清算`, desc: '全员帮🦌/帮戒配额清零', quota: '鹿使专属' },

            { cmd: '皇城清算', desc: '全员皇城鹿次数清零', quota: '鹿使专属 · 作废进行中场次' },

            { cmd: '恶趣清算', desc: '偷咒献祭擂台同归等恶趣味次数清零', quota: '鹿使专属 · 撕战书' },

            { cmd: '大赦众生', desc: '鹿神赐福：全员还阳 + 全部玩法次数清零', quota: '鹿使专属 · 终极后门' },

        ],

    },

];



export const HELP_FOOTER = '鹿管说明书 · 鹿与🦌等价 · 数据存 Redis';



export const HELP_TAGLINE = '一只鹿管，全村社死';


