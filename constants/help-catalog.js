/**

 * 鹿插件指令与每日配额一览（帮助图 / 文案唯一数据源）

 */

import { D_SHOW } from './commands.js';

import {

    ARENA_STAKE,

    DAILY_ARENA_QUOTA,

    DAILY_CURSE_QUOTA,

    DAILY_FAKE_WITHDRAW_QUOTA,

    DAILY_GREED_QUOTA,

    DAILY_GROUP_SPLASH_QUOTA,

    GROUP_SPLASH_MIN_MEMBERS,

    DAILY_HELP_QUOTA,

    DAILY_HELP_WITHDRAW_QUOTA,

    DAILY_HOWL_QUOTA,

    DAILY_IMPERIAL_QUOTA,

    DAILY_SAFE_LIMIT,

    DAILY_SACRIFICE_QUOTA,

    DAILY_STEAL_QUOTA,

    DAILY_URGE_QUOTA,

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

            { cmd: `${D_SHOW}况`, desc: '今日数据 + 各玩法剩余', quota: '不限' },

            { cmd: `看${D_SHOW} / 看${D_SHOW}6`, desc: '月历面板', quota: '不限' },

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

        ],

    },

    {

        title: '互害恶趣味',

        emoji: '😈',

        items: [

            { cmd: `偷${D_SHOW}@ta`, desc: '35% 偷 1 · 25% 反噬', quota: `${DAILY_STEAL_QUOTA} 次/日` },

            { cmd: `${D_SHOW}咒@ta`, desc: '下次自🦌鹿死 +10%', quota: `${DAILY_CURSE_QUOTA} 次/日` },

            { cmd: `献祭${D_SHOW}@ta`, desc: '你 -2，ta +2', quota: `${DAILY_SACRIFICE_QUOTA} 次/日` },

            { cmd: `倒贴${D_SHOW}@ta`, desc: '50% 你+1 ta-1 / 败 -2', quota: `${DAILY_GREED_QUOTA} 次/日` },

            { cmd: `催${D_SHOW}@ta`, desc: 'ta 今日 0 次则下次自🦌 +1', quota: `${DAILY_URGE_QUOTA} 次/日` },

            { cmd: '诈戒 / 诈戒鹿', desc: '嘴上戒🦌，实际 +1', quota: `${DAILY_FAKE_WITHDRAW_QUOTA} 次/日` },

            { cmd: `${D_SHOW}鸣`, desc: '群内嚎叫 · 小概率 ±1', quota: `${DAILY_HOWL_QUOTA} 次/日` },

            { cmd: `群${D_SHOW}溅`, desc: '群伤！活人各 -1，你反噬 -2，15% 附鹿咒', quota: `${DAILY_GROUP_SPLASH_QUOTA} 次/日 · 群≥${GROUP_SPLASH_MIN_MEMBERS} 人` },

        ],

    },

    {

        title: '对线大招',

        emoji: '⚔️',

        items: [

            { cmd: `擂台${D_SHOW}@ta`, desc: 'ta 在待战上下文内回「冲」/「拒」（优先于普通指令）', quota: `${DAILY_ARENA_QUOTA} 次/日 · 胜负 ±${ARENA_STAKE}` },

            { cmd: `同归${D_SHOW}尽@ta`, desc: '双方各 -5', quota: '1 次/日' },

            { cmd: `皇城${D_SHOW}`, desc: '猜大小 PK 日榜第一', quota: `${DAILY_IMPERIAL_QUOTA} 次/日` },

        ],

    },

    {

        title: '冷知识',

        emoji: '💀',

        items: [

            { cmd: '鹿死', desc: '当日🦌绩清零不计榜', quota: '等帮🦌救活' },

            { cmd: `回${D_SHOW}返照`, desc: '特权：保留次数，重置玩法', quota: '鹿使专属' },

            { cmd: `${D_SHOW}帮助`, desc: '就是本图', quota: '随便看' },

        ],

    },

];



export const HELP_FOOTER = '鹿管说明书 · 鹿与🦌等价 · 数据存 Redis';



export const HELP_TAGLINE = '一只鹿管，全村社死';


