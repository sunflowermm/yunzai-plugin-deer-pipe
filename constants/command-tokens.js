/** 鹿/🦌 指令 token（无依赖，供 commands / 皮肤指令正则共用） */

/** 匹配鹿或🦌（捕获组） */
export const D = '(🦌|鹿)';

/** 可选前缀（非捕获） */
export const D_OPT = '(?:🦌|鹿)?';

/** 帮助图指令展示（单 token，Twemoji 渲染） */
export const D_HELP = '🦌';

/** 等价说明用：🦌/鹿 可互换（勿与 D_HELP 混用于指令名） */
export const D_SHOW = '🦌/鹿';
