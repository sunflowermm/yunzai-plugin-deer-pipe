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
    playfulClearance: '^恶趣清算$',
    amnestyAll: '^大赦众生$',
    arena: `^擂台${D}`,
    /** 擂台「冲/拒」由 setContext('arenaRespond') 监听，勿加裸规则（避免误吞他人消息） */
    imperial: `^(皇城${D}|皇城)$`,
    steal: `^偷${D}`,
    curse: `^${D}咒`,
    cleanseCurse: `^解${D}咒`,
    sacrifice: `^献祭${D}`,
    fakeWithdraw: `^诈戒(${D})?[0-9]*$`,
    urge: `^催${D}`,
    howl: `^${D}鸣$`,
    greed: `^倒贴${D}`,
    groupSplash: `^(群${D}溅|${D}群伤|溅射${D})$`,
    borrow: `^借${D}`,
    bumper: `^碰瓷${D}`,
    lottery: `^抽${D}签$`,
    weatherToday: `^(?:今日)?${D}天气$|^${D}天气$`,
    deerGodBless: '^鹿神赐福',
    blessDeer: `^${D}福`,
    cleanseBless: `^解${D}福`,
    spectralCurse: `^冥${D}咒`,
    vengeance: `^索命${D}`,
    dreamDeer: `^托梦${D}`,
    reviveLottery: `^还阳签$`,
    tombstone: `^${D}碑$`,
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

/** 清洗指令文本（去 CQ 码、@、误粘 QQ 号） */
export function cleanCommandMsg(msg) {
    let s = String(msg ?? '').trim();
    s = s.replace(/\[CQ:[^\]]+\]/gi, '').trim();
    s = s.replace(/@\S+/g, '').trim();
    // @ 时偶发把 QQ 粘在「看鹿」后面，如 看鹿1814632762
    s = s.replace(new RegExp(`^(看${D})[1-9]\\d{4,}`), '$1');
    s = s.replace(new RegExp(`^(看${D}历)[1-9]\\d{4,}`), '$1');
    return s;
}

function coerceValidDate(date, fallback = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    return Number.isFinite(d.getTime()) ? d : fallback;
}

/** 解析看🦌/看鹿 目标月份（默认当月） */
export function parseViewMonthToken(msg) {
    const cleaned = cleanCommandMsg(msg);
    const match = cleaned.match(new RegExp(`^看${D}(\\d{4}-\\d{1,2}|\\d{1,2})?`));
    const now = new Date();
    if (!match?.[1]) {
        return coerceValidDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    }
    const part = match[1];
    if (/^\d{4}-\d{1,2}$/.test(part)) {
        const [y, m] = part.split('-').map(Number);
        if (m >= 1 && m <= 12) return coerceValidDate(new Date(y, m - 1, 1));
    } else {
        const m = parseInt(part, 10);
        if (m >= 1 && m <= 12) return coerceValidDate(new Date(now.getFullYear(), m - 1, 1));
    }
    return coerceValidDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function formatMonthLabel(date) {
    const d = coerceValidDate(date);
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}
