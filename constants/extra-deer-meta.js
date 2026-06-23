/** 番外数值与转职文案（无依赖，避免 game.js ↔ extra-deer.js 循环 import） */

export const YUMUMU_LU_BAN_MS = 55 * 60 * 1000;
/** 束缚可用截止：当日 23:00 起不可用（晚上11点前） */
export const YUMUMU_BIND_CUTOFF_HOUR = 23;
export const YUMUMU_BIND_CUTOFF_LABEL = '晚上11点前';
export const YUMUMU_BIND_MINUTES = Math.round(YUMUMU_LU_BAN_MS / 60000);
export const YUMUMU_IMPOTENCE_CHANCE = 0.40;
export const YUMUMU_IMPOTENCE_HELP_FAIL = 0.08;

/** 语姐鹿：皇城鹿猜大小额外必胜概率（叠在 50% 骰运之上） */
export const YUJIE_IMPERIAL_WIN_BONUS = 0.20;

export const EXTRA_DEER_TRANSFER_HINT = '番外：转职王美嘉 / 转职雨木木 / 转职语姐 / 转职许月珍';

export const XUYUEZHEN_CHAOS_OUTCOME_LABELS = {
    plus2: '绿恐龙暴走 +2',
    minus2: '反噬 -2',
    plus1: '吉签 +1',
    minus1: '凶签 -1',
    curse: '叠 1 层咒',
    cleanse: '撕 1 层咒',
    urge: '催更符已贴',
    bless: '叠 1 层福',
    blank: '空签 · 无事发生',
};

export function isYumumuBindAfterCutoff(date) {
    return date.getHours() >= YUMUMU_BIND_CUTOFF_HOUR;
}

export function formatYumumuBindCutoffHint() {
    return YUMUMU_BIND_CUTOFF_LABEL;
}
