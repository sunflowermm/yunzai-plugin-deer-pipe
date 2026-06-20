/** 番外数值与转职文案（无依赖，避免 game.js ↔ extra-deer.js 循环 import） */

export const YUMUMU_LU_BAN_MS = 55 * 60 * 1000;
export const YUMUMU_BIND_CUTOFF_HOUR = 11;
export const YUMUMU_BIND_MINUTES = Math.round(YUMUMU_LU_BAN_MS / 60000);
export const YUMUMU_IMPOTENCE_CHANCE = 0.40;
export const YUMUMU_IMPOTENCE_HELP_FAIL = 0.08;

export const EXTRA_DEER_TRANSFER_HINT = '番外：转职王美嘉 / 转职雨木木';
