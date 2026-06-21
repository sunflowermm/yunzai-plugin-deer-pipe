/** 皮肤静态配置（数据层 · 增删皮肤只改此文件） */

import { SKIN_DEFAULT, USER_SKIN_KEYS } from './skin-keys.js';

export { SKIN_DEFAULT, USER_SKIN_KEYS };

/** 立绘解锁策略：free 全员免费 · extraFree 番外免费/其余走活动 · festival 全员须解锁 */
export const PORTRAIT_UNLOCK_MODE = Object.freeze({
    FREE: 'free',
    EXTRA_FREE: 'extraFree',
    FESTIVAL: 'festival',
});

/** 节日窗口（按公历月日每年循环；start/end 的 YYYY 仅作配置锚点） */
export const FESTIVAL_WINDOWS = {
    duanwu: { start: '2026-06-01', end: '2026-06-30', label: '端午节' },
};

/** UI 主题皮肤 */
export const UI_SKINS = {
    default: {
        id: SKIN_DEFAULT,
        name: '默认鹿林',
        emoji: '🦌',
        desc: '经典暖色鹿林配色',
    },
    duanwu: {
        id: 'duanwu',
        name: '端午粽香',
        emoji: '🫔',
        festival: 'duanwu',
        desc: '青粽荷叶 · 龙舟水色 · 鹿况/月历/PK 端午主题',
    },
};

/** 职业立绘皮肤（professions 列出有独立 PNG 的职业 id） */
export const PORTRAIT_SKINS = {
    default: {
        id: SKIN_DEFAULT,
        name: '默认立绘',
        emoji: '🦌',
        desc: '原版职业立绘',
        professions: null,
    },
    duanwu: {
        id: 'duanwu',
        name: '端午限定立绘',
        emoji: '🐲',
        festival: 'duanwu',
        unlock: PORTRAIT_UNLOCK_MODE.EXTRA_FREE,
        desc: '鹿医师 · 卷王鹿 端午换装（活动解锁）· 王美嘉/雨木木 番外免费随时切换',
        professions: ['medic', 'grinder', 'meijia', 'yumumu'],
        switchHints: [
            '卷王鹿端午 / 卷王鹿默认（须解锁）',
            '鹿医师端午 / 鹿医师默认（须解锁）',
            '雨木木鹿端午 / 王美嘉鹿端午（番外免费 · 随时切换）',
        ],
    },
    nianxian: {
        id: 'nianxian',
        name: '年限带翅膀',
        emoji: '🪽',
        unlock: PORTRAIT_UNLOCK_MODE.FREE,
        desc: '语姐鹿专属 · 金翼年限立绘（免费随时切换）',
        professions: ['yujie'],
        switchHints: [
            '语姐鹿年限 / 语姐鹿翅膀 / 语姐鹿默认（语姐专属 · 免费切换）',
        ],
    },
};

/** 活动立绘解锁：skinId → 职业 → 累计指标 */
export const PORTRAIT_UNLOCK_RULES = {
    duanwu: {
        grinder: {
            metric: 'lu',
            count: 10,
            label: '卷王鹿端午立绘',
            grantText: '🫔 端午活动：已获得卷王鹿限定立绘！',
            hint: '端午活动期间自🦌累计 10 次',
        },
        medic: {
            metric: 'help_lu',
            count: 10,
            label: '鹿医师端午立绘',
            grantText: '🫔 端午活动：已获得鹿医师限定立绘！',
            hint: '端午活动期间帮鹿累计 10 次',
        },
    },
};

/** 指令别名 → skinId（UI / 立绘共用；未列出则尝试 raw id） */
export const SKIN_ALIASES = {
    默认: SKIN_DEFAULT,
    default: SKIN_DEFAULT,
    原版: SKIN_DEFAULT,
    端午: 'duanwu',
    端午节: 'duanwu',
    duanwu: 'duanwu',
    粽香: 'duanwu',
    龙舟: 'duanwu',
    年限: 'nianxian',
    带翅膀: 'nianxian',
    翅膀: 'nianxian',
};
