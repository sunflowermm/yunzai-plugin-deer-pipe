/**

 * 鹿王综合指数：自🦌、施助、活跃、自律等多维加权（备用算法，与综合榜主算法分离）

 */



/** @param {object} entry 当日 entry */

/** @param {{ helpLu?: number, revive?: number, medicSkill?: number, withdraw?: number, asceticSkill?: number }} [helperStats] 当日作为协助方的日志 */

export function calcKingBalanceScore(entry, helperStats = null) {

    if (!entry || entry.d) return 0;



    const c = entry.c ?? 0;

    const helped = entry.helped || 0;

    const revived = entry.revived || 0;

    const attempts = Math.min(entry.a || 0, 24);



    const healGiven = helperStats

        ? (helperStats.helpLu || 0) + (helperStats.revive || 0) * 1.5

            + (helperStats.medicSkill || 0) * 1.2 + (helperStats.withdraw || 0) * 0.55

            + (helperStats.asceticSkill || 0) * 0.75

        : 0;



    let score = 0;

    if (c > 0) score += Math.min(c, 14) * 0.50;

    else if (c < 0) score += Math.min(Math.abs(c), 10) * 0.30;



    score += helped * 0.12;

    score += revived * 0.08;

    score += healGiven * 0.24;

    score += Math.sqrt(attempts) * 0.45;



    return Math.round(score * 100) / 100;

}



export function compareKingScore(a, b) {

    const diff = b.sum - a.sum;

    return diff !== 0 ? diff : String(a.id).localeCompare(String(b.id));

}


