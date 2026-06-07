/**
 * 鹿/🦌 等价指令 token 与 rule 正则（全插件唯一数据源）
 * loader 会将 reg 字符串转为 RegExp，此处用字符串拼接便于维护
 */

/** 匹配鹿或🦌 */
export const D = '(🦌|鹿)';

/** 帮助图展示：🦌/鹿 可互换 */
export const D_SHOW = '🦌/鹿';

export const REG = {
    lu: `^${D}$`,
    withdraw: `^戒${D}[0-9]*$`,
    view: `^看${D}(\\d{4}-\\d{1,2}|\\d{1,2})?$`,
    status: `^${D}况$`,
    help: `^帮${D}`,
    helpWithdraw: `^帮戒${D}`,
    together: `^同归${D}尽`,
    privilegeRevive: `^回${D}返照$`,
    imperialClearance: `^皇城清算$`,
    deerClearance: `^${D}清算$`,
    arena: `^擂台${D}`,
    arenaAccept: `^冲$`,
    arenaDecline: `^拒$`,
    imperial: `^(皇城${D}|皇城)$`,
    steal: `^偷${D}`,
    curse: `^${D}咒`,
    sacrifice: `^献祭${D}`,
    fakeWithdraw: `^诈戒(${D})?[0-9]*$`,
    urge: `^催${D}`,
    howl: `^${D}鸣$`,
    greed: `^倒贴${D}`,
    groupSplash: `^(群${D}溅|${D}群伤|溅射${D})$`,
    helpPage: `^${D}(帮助|教程|说明书)$`,
    calendarYear: `^${D}历$`,
    calendarView: `^看${D}历$`,
    calendarMonth: `^${D}历(\\d{4}-\\d{1,2}|\\d{1,2})$`,
    rank: `^(戒?${D})榜$`,
    rankYear: `^(戒?${D})年榜$`,
    rankDay: `^(戒?${D})日榜$`,
    addFriend: `^添加${D}友(.*)`,
    delFriend: `^绝交${D}友(.*)`,
    myFriend: `^我的${D}友$`,
};

/** 解析看🦌/看鹿 日期 */
export function parseViewMonthToken(msg) {
    const match = String(msg).match(new RegExp(`看${D}(\\d{4}-\\d{1,2}|\\d{1,2})?$`));
    if (!match?.[1]) return new Date();
    const part = match[1];
    if (/^\d{4}-\d{1,2}$/.test(part)) {
        const [y, m] = part.split('-').map(Number);
        return new Date(y, m - 1, 1);
    }
    return new Date(new Date().getFullYear(), parseInt(part, 10) - 1, 1);
}
