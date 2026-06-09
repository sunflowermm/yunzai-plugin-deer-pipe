/**
 * 综合平衡分权重（鹿王册封 / 综合榜 / 群鹿溅目标）
 *
 * 设计目标：
 * - 纯🦌次数不能独霸鹿王（净值封顶 + 活跃边际递减）
 * - 互助施助有显著权重，受助权重低（防躺赢）
 * - 戒鹿自律有分，但低于正向净值
 * - 安全区内小幅加成，超限与互害玩法扣分
 * - 咒福状态计入 aura 项
 */
export const BALANCED_WEIGHTS = {
    /** 正净值：每 1 次 */
    netPositive: 0.72,
    /** 正净值计入上限（防卷王独霸） */
    netPositiveCap: 10,
    /** 戒鹿/负净值：每 1 次 */
    discipline: 0.50,
    disciplineCap: 10,
    /** 玩法尝试：sqrt 边际递减 */
    activitySqrt: 0.62,
    activityCap: 36,
    /** 成功帮鹿 */
    helpOut: 0.55,
    /** 救活 */
    reviveOut: 0.75,
    /** 受助（低权重） */
    helpIn: 0.05,
    helpInCap: 8,
    /** 每层鹿福 */
    blessPerStack: 0.22,
    /** 每层鹿咒（负） */
    cursePerStack: -0.25,
    /** 安全区内一次性加成 */
    safeZoneBonus: 0.35,
    /** 超安全线每多 1 次（负） */
    overlimitPerCount: -0.12,
    overlimitCap: 8,
    /** 互害玩法每 1 次（负） */
    chaosPerAction: -0.06,
    chaosCap: 5,
};

/** 帮助图 / 榜单 footer 用一句话说明 */
export const BALANCED_FORMULA_HINT =
    '净值(封顶)+自律+活跃√+施助+受助(低)+咒福+安全加成-超限-互害 · 与鹿王同算法';
