/**
 * 综合平衡分权重（鹿王册封 / 综合榜 / 群鹿溅目标）
 *
 * 设计目标：
 * - 自🦌净值主维度；施助/帮戒计入综合分，支撑医师/福使/戒师
 * - 卷王高位鹿死封顶 60%，对应超限 soft/hard 双段扣分
 * - 受助 helpIn 低权重（防躺赢）
 */
export const BALANCED_WEIGHTS = {
    /** 正净值：每 1 次（主权重） */
    netPositive: 0.88,
    /** 正净值计入上限 */
    netPositiveCap: 12,
    /** 戒鹿/负净值：每 1 次 */
    discipline: 0.50,
    disciplineCap: 10,
    /** 玩法尝试：sqrt 边际递减 */
    activitySqrt: 0.55,
    activityCap: 36,
    /** 被帮成功 +1（受助侧） */
    helpOut: 0.30,
    /** 被救活（受助侧） */
    reviveOut: 1.20,
    /** 受助次数（低权重） */
    helpIn: 0.05,
    helpInCap: 8,
    /** 施助：帮鹿/愈鹿（日志 helpers） */
    healGivenPerAction: 0.34,
    medicSkillBonus: 0.22,
    healGivenCap: 10,
    /** 施助：救活他人 */
    reviveGiven: 1.20,
    reviveGivenCap: 4,
    /** 施助：帮戒 / 清规 */
    withdrawGiven: 0.36,
    asceticSkillGiven: 0.50,
    withdrawGivenCap: 8,
    /** 每层鹿福 */
    blessPerStack: 0.22,
    /** 每层鹿咒（负） */
    cursePerStack: -0.25,
    /** 安全区内一次性加成 */
    safeZoneBonus: 0.28,
    /** 超限 soft 段：每多 1 次 */
    overlimitPerCount: -0.14,
    overlimitCap: 24,
    /** 超限 hard 段：极高次数追加扣分（对齐 60% 鹿死风险） */
    overlimitHardPerCount: -0.22,
    overlimitHardCap: 12,
    /** 互害玩法每 1 次（负） */
    chaosPerAction: -0.07,
    chaosCap: 6,
};

/** 帮助图 / 榜单 footer 用一句话说明 */
export const BALANCED_FORMULA_HINT =
    '净值(主)+施助/帮戒+活跃√+被帮/救活(辅)-超限(双段)-互害 · 与鹿王同算法';
