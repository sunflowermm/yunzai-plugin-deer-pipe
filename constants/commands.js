/**
 * 鹿/🦌 等价指令 token 与 rule 正则（全插件唯一数据源）
 * loader 会将 reg 字符串转为 RegExp，此处用字符串拼接便于维护
 */
import { D, D_OPT, D_SHOW } from './command-tokens.js';
import { PORTRAIT_PROF_SWITCH } from './portrait-skin-command.js';

export { D, D_OPT, D_SHOW };

/** 查鹿林天象（不与通用「天气」插件抢匹配） */
export const WEATHER_CMD_SHOW = `${D_SHOW}环境 / 天气${D_SHOW}`;
export const WEATHER_CMD_HINT = '鹿环境 / 天气鹿';

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
    /** 主：鹿环境 / 今日鹿环境 · 别名：天气鹿 / 今日天气鹿 */
    weatherToday: `^(?:今日)?(?:${D}环境|天气${D})$`,
    /** 八象图鉴（不与通用天气插件冲突） */
    weatherCatalog: `^(?:天象一览|${D}林天象|${D}环境一览)$`,
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
    rankHeal: `^(?:奶${D}|${D}奶)榜$`,
    rankHealDay: `^(?:奶${D}|${D}奶)日榜$`,
    rankHealYear: `^(?:奶${D}|${D}奶)年榜$`,
    rankWithdrawHelp: '^戒师榜$',
    rankWithdrawHelpDay: '^戒师日榜$',
    rankWithdrawHelpYear: '^戒师年榜$',
    rankPeak: '^卷王榜$',
    rankPeakDay: '^卷王日榜$',
    rankPeakYear: '^卷王年榜$',
    rankChaos: '^恶趣榜$',
    rankChaosDay: '^恶趣日榜$',
    rankChaosYear: '^恶趣年榜$',
    rankBalanced: '^(综合榜|鹿王榜)$',
    rankBalancedDay: '^(综合日榜|鹿王日榜)$',
    rankBalancedYear: '^(综合年榜|鹿王年榜)$',
    rankActive: '^活跃榜$',
    rankActiveDay: '^活跃日榜$',
    rankActiveYear: '^活跃年榜$',
    rankRevive: '^(救活榜|救榜)$',
    rankReviveDay: '^(救活日榜|救日榜)$',
    rankReviveYear: '^(救活年榜|救年榜)$',
    curserBindSkill: '^咒缚',
    blesserGrantSkill: '^广福',
    rogueNightRaidSkill: '^夜袭',
    deerCart: '^鹿车',
    /** 单人连鹿（与鹿车独立） */
    soloLu: `^连${D}$`,
    /** 鹿车「发车」由 setContext('deerCartDepart') 监听，勿加裸规则 */
    meijiaTeamSkill: '^组队',
    yumumuBindSkill: '^束缚',
    yujieDaipaiSkill: '^带派$',
    addFriend: `^添加${D}友(.*)`,
    delFriend: `^绝交${D}友(.*)`,
    myFriend: `^我的${D}友$`,
    profession: `^${D}职业$`,
    /** 查看静态职业卡（预渲染 PNG） */
    professionCard: `^(?:看)?(?:🦌|鹿)职业(?:卡)?(.+)$`,
    transferProfession: `^转职(?:${D})?(.+)$`,
    helperQuota: `^(${D}配额|互助配额)$`,
    helpQuotaQuery: `^帮${D}次数$`,
    helpWithdrawQuotaQuery: `^帮戒${D}次数$`,
    jobSkillInfo: `^${D}技$`,
    rangerPatrol: `^${D}巡$`,
    medicHealSkill: `^愈${D}`,
    medicHealSkillAlt: `^${D}愈`,
    asceticCleanseSkill: `^清规${D}`,
    grinderRush: `^(卷王冲|卷冲)$`,
    sunflowerFacingSkill: '^向阳',
    skinList: `^${D}皮肤$`,
    skinSwitch: `^${D}皮肤(.+)$`,
    portraitSkinList: `^${D}立绘$`,
    portraitProfSwitch: PORTRAIT_PROF_SWITCH,
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
