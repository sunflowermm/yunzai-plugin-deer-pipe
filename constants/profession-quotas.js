/**

 * 各职业每日玩法次数上限（须完整覆盖 QUOTA 全部键，禁止回落全局默认）

 */

import {

    DAILY_ARENA_QUOTA,

    DAILY_BLESS_QUOTA,

    DAILY_BORROW_QUOTA,

    DAILY_BUMPER_QUOTA,

    DAILY_CLEANSE_BLESS_QUOTA,

    DAILY_CLEANSE_CURSE_QUOTA,

    DAILY_CURSE_QUOTA,

    DAILY_DREAM_QUOTA,

    DAILY_FAKE_WITHDRAW_QUOTA,

    DAILY_GREED_QUOTA,

    DAILY_GROUP_SPLASH_QUOTA,

    DAILY_HELP_QUOTA,

    DAILY_HELP_WITHDRAW_QUOTA,

    DAILY_HOWL_QUOTA,

    DAILY_IMPERIAL_QUOTA,

    DAILY_LOTTERY_QUOTA,

    DAILY_REVIVE_LOTTERY_QUOTA,

    DAILY_SACRIFICE_QUOTA,

    DAILY_SPECTRAL_CURSE_QUOTA,

    DAILY_STEAL_QUOTA,

    DAILY_URGE_QUOTA,

    DAILY_VENGEANCE_QUOTA,

} from './game.js';



/** @typedef {keyof typeof BASE_QUOTAS} QuotaId */



export const QUOTA = {

    help: 'help',

    helpWithdraw: 'helpWithdraw',

    imperial: 'imperial',

    arena: 'arena',

    steal: 'steal',

    curse: 'curse',

    cleanseCurse: 'cleanseCurse',

    bless: 'bless',

    cleanseBless: 'cleanseBless',

    sacrifice: 'sacrifice',

    fakeWithdraw: 'fakeWithdraw',

    urge: 'urge',

    howl: 'howl',

    greed: 'greed',

    groupSplash: 'groupSplash',

    borrow: 'borrow',

    bumper: 'bumper',

    lottery: 'lottery',

    spectralCurse: 'spectralCurse',

    vengeance: 'vengeance',

    dream: 'dream',

    reviveLottery: 'reviveLottery',

    together: 'together',

};



/** 未转职 / 未知职业时的占位（实际 getProfessionQuotaLimit 未转职返回 0） */

export const BASE_QUOTAS = {

    [QUOTA.help]: DAILY_HELP_QUOTA,

    [QUOTA.helpWithdraw]: DAILY_HELP_WITHDRAW_QUOTA,

    [QUOTA.imperial]: DAILY_IMPERIAL_QUOTA,

    [QUOTA.arena]: DAILY_ARENA_QUOTA,

    [QUOTA.steal]: DAILY_STEAL_QUOTA,

    [QUOTA.curse]: DAILY_CURSE_QUOTA,

    [QUOTA.cleanseCurse]: DAILY_CLEANSE_CURSE_QUOTA,

    [QUOTA.bless]: DAILY_BLESS_QUOTA,

    [QUOTA.cleanseBless]: DAILY_CLEANSE_BLESS_QUOTA,

    [QUOTA.sacrifice]: DAILY_SACRIFICE_QUOTA,

    [QUOTA.fakeWithdraw]: DAILY_FAKE_WITHDRAW_QUOTA,

    [QUOTA.urge]: DAILY_URGE_QUOTA,

    [QUOTA.howl]: DAILY_HOWL_QUOTA,

    [QUOTA.greed]: DAILY_GREED_QUOTA,

    [QUOTA.groupSplash]: DAILY_GROUP_SPLASH_QUOTA,

    [QUOTA.borrow]: DAILY_BORROW_QUOTA,

    [QUOTA.bumper]: DAILY_BUMPER_QUOTA,

    [QUOTA.lottery]: DAILY_LOTTERY_QUOTA,

    [QUOTA.spectralCurse]: DAILY_SPECTRAL_CURSE_QUOTA,

    [QUOTA.vengeance]: DAILY_VENGEANCE_QUOTA,

    [QUOTA.dream]: DAILY_DREAM_QUOTA,

    [QUOTA.reviveLottery]: DAILY_REVIVE_LOTTERY_QUOTA,

    [QUOTA.together]: 1,

};



/** 玩法配额中文名（鹿配额 / 鹿况面板） */

export const QUOTA_LABELS = {

    [QUOTA.help]: '帮鹿',

    [QUOTA.helpWithdraw]: '帮戒',

    [QUOTA.imperial]: '皇城',

    [QUOTA.arena]: '擂台',

    [QUOTA.steal]: '偷鹿',

    [QUOTA.curse]: '鹿咒',

    [QUOTA.cleanseCurse]: '解咒',

    [QUOTA.bless]: '鹿福',

    [QUOTA.cleanseBless]: '解福',

    [QUOTA.sacrifice]: '献祭',

    [QUOTA.fakeWithdraw]: '诈戒',

    [QUOTA.urge]: '催鹿',

    [QUOTA.howl]: '鹿鸣',

    [QUOTA.greed]: '倒贴',

    [QUOTA.groupSplash]: '群溅',

    [QUOTA.borrow]: '借鹿',

    [QUOTA.bumper]: '碰瓷',

    [QUOTA.lottery]: '鹿签',

    [QUOTA.spectralCurse]: '冥咒',

    [QUOTA.vengeance]: '索命',

    [QUOTA.dream]: '托梦',

    [QUOTA.reviveLottery]: '还阳签',

    [QUOTA.together]: '同归',

};

/** 配额 chip / 进度条色（渲染统一） */
export const QUOTA_CHIP_COLORS = {
    [QUOTA.help]: '#68d391',
    [QUOTA.helpWithdraw]: '#5dade2',
    [QUOTA.steal]: '#ff6b81',
    [QUOTA.curse]: '#c39bff',
    [QUOTA.bless]: '#7dffb0',
    [QUOTA.arena]: '#ff7043',
    [QUOTA.imperial]: '#ffd700',
};

export function quotaChipColor(quotaId, fallback = '#ffb347') {
    return QUOTA_CHIP_COLORS[quotaId] || fallback;
}

/** 配额分组（职业卡 / 鹿配额面板） */
export const QUOTA_GROUPS = [
    {
        title: '互助救治',
        sectionKey: 'help',
        ids: [QUOTA.help, QUOTA.helpWithdraw, QUOTA.borrow, QUOTA.dream, QUOTA.reviveLottery],
    },
    {
        title: '互害恶趣',
        sectionKey: 'harm',
        ids: [
            QUOTA.steal, QUOTA.curse, QUOTA.bless, QUOTA.cleanseCurse, QUOTA.cleanseBless,
            QUOTA.spectralCurse, QUOTA.vengeance, QUOTA.sacrifice, QUOTA.fakeWithdraw,
            QUOTA.urge, QUOTA.howl, QUOTA.greed, QUOTA.groupSplash, QUOTA.bumper, QUOTA.together,
        ],
    },
    {
        title: '擂台皇城',
        sectionKey: 'pvp',
        ids: [QUOTA.arena, QUOTA.imperial, QUOTA.lottery],
    },
];

export function listProfessionQuotaRows(professionId) {
    const q = resolveProfessionQuotas(professionId);
    return Object.values(QUOTA)
        .filter((id) => (q[id] ?? 0) > 0)
        .map((id) => ({
            id,
            label: QUOTA_LABELS[id] || id,
            max: q[id],
        }));
}

export function listProfessionQuotaGroups(professionId) {
    const q = resolveProfessionQuotas(professionId);
    return QUOTA_GROUPS.map((g) => ({
        title: g.title,
        sectionKey: g.sectionKey,
        rows: g.ids
            .filter((id) => (q[id] ?? 0) > 0)
            .map((id) => ({
                id,
                label: QUOTA_LABELS[id] || id,
                max: q[id],
            })),
    })).filter((g) => g.rows.length > 0);
}

/** 从玩法快照构建分组进度条（鹿配额 / 职业面板） */
export function buildUsageBarSections(snapshot) {
    if (!snapshot || snapshot.professionRequired) return [];
    const sliceOf = (id) => {
        if (id === QUOTA.help) return snapshot.help;
        if (id === QUOTA.helpWithdraw) return snapshot.withdraw;
        return snapshot.play?.[id];
    };
    return QUOTA_GROUPS.map((g) => {
        const items = [];
        for (const id of g.ids) {
            const slice = sliceOf(id);
            if (!slice || slice.max <= 0) continue;
            items.push({
                label: QUOTA_LABELS[id] || id,
                used: slice.used ?? 0,
                total: slice.max,
                color: quotaChipColor(id),
            });
        }
        return { title: g.title, sectionKey: g.sectionKey, items };
    }).filter((s) => s.items.length > 0);
}

/** 各职业专精配额（每键均显式赋值，互不相同） */

export const PROFESSION_QUOTA_TABLE = {

    /** 巡游鹿：均衡偏探索，天象/签运/群游 */

    ranger: {

        help: 7, helpWithdraw: 5, steal: 4, curse: 3, bless: 3,

        cleanseCurse: 2, cleanseBless: 2, arena: 5, imperial: 2,

        howl: 6, lottery: 3, groupSplash: 2, bumper: 2, borrow: 2,

        urge: 4, sacrifice: 1, fakeWithdraw: 2, greed: 1, dream: 1,

        spectralCurse: 1, vengeance: 1, reviveLottery: 1, together: 1,

    },

    /** 鹿医师：帮鹿/解咒/还阳，禁互害 */

    medic: {

        help: 14, helpWithdraw: 1, steal: 0, curse: 0, bless: 3,

        cleanseCurse: 3, cleanseBless: 2, arena: 2, imperial: 1,

        borrow: 3, dream: 3, reviveLottery: 3, howl: 2, lottery: 1,

        spectralCurse: 1, vengeance: 0, sacrifice: 0, fakeWithdraw: 0,

        urge: 2, greed: 0, groupSplash: 0, bumper: 0, together: 0,

    },

    /** 戒灵师：帮戒/诈戒/催鹿，偏自律 */

    ascetic: {

        help: 2, helpWithdraw: 10, steal: 0, curse: 1, bless: 1,

        cleanseCurse: 2, cleanseBless: 2, fakeWithdraw: 5, urge: 6,

        arena: 2, imperial: 2, sacrifice: 1, bumper: 1, howl: 3,

        lottery: 1, borrow: 1, dream: 1, greed: 0, groupSplash: 0,

        spectralCurse: 0, vengeance: 0, reviveLottery: 1, together: 1,

    },

    /** 卷王鹿：擂台/皇城/碰瓷，安全区大 */

    grinder: {

        help: 3, helpWithdraw: 1, steal: 2, curse: 2, bless: 1,

        cleanseCurse: 1, cleanseBless: 1, arena: 8, imperial: 3,

        lottery: 1, fakeWithdraw: 2, howl: 3, greed: 2, bumper: 4,

        groupSplash: 1, sacrifice: 1, urge: 2, borrow: 1, dream: 1,

        spectralCurse: 1, vengeance: 1, reviveLottery: 1, together: 2,

    },

    /** 叠咒鹿：咒/冥咒/索命/群溅，互害专精 */

    curser: {

        help: 3, helpWithdraw: 2, steal: 1, curse: 7, bless: 0,

        cleanseCurse: 1, cleanseBless: 0, spectralCurse: 4, vengeance: 4,

        sacrifice: 3, arena: 3, imperial: 2, howl: 5, dream: 2,

        groupSplash: 3, together: 2, fakeWithdraw: 1, urge: 3, bumper: 2,

        greed: 1, borrow: 0, lottery: 1, reviveLottery: 1,

    },

    /** 福鹿使：福/解福/解咒/帮鹿，偏正面互助 */

    blesser: {

        help: 11, helpWithdraw: 3, steal: 0, curse: 0, bless: 6,

        cleanseBless: 4, cleanseCurse: 4, borrow: 3, urge: 5,

        lottery: 2, arena: 3, imperial: 1, howl: 4, fakeWithdraw: 1,

        sacrifice: 1, dream: 2, bumper: 1, groupSplash: 1, greed: 0,

        spectralCurse: 1, vengeance: 0, reviveLottery: 2, together: 1,

    },

    /** 窃光鹿：偷/碰瓷/诈戒/倒贴，窃掠专精 */

    rogue: {

        help: 4, helpWithdraw: 2, steal: 7, curse: 3, bless: 0,

        cleanseCurse: 1, cleanseBless: 0, greed: 3, bumper: 5,

        fakeWithdraw: 5, arena: 5, imperial: 3, lottery: 3,

        groupSplash: 3, sacrifice: 2, urge: 3, howl: 3, borrow: 1,

        dream: 1, spectralCurse: 2, vengeance: 2, reviveLottery: 1, together: 2,

    },

    /** 向日葵鹿：催鹿/鹿福/鹿鸣/签运，向光互助 */

    sunflower: {

        help: 11, helpWithdraw: 3, steal: 0, curse: 0, bless: 6,

        cleanseBless: 4, cleanseCurse: 3, urge: 7, howl: 6,

        lottery: 4, borrow: 3, dream: 3, reviveLottery: 3, arena: 3,

        imperial: 1, bumper: 2, fakeWithdraw: 1, sacrifice: 1,

        groupSplash: 1, greed: 0, spectralCurse: 0, vengeance: 0, together: 1,

    },

};



export const PROFESSION_IDS = Object.keys(PROFESSION_QUOTA_TABLE);



/** @returns {typeof BASE_QUOTAS} */

export function resolveProfessionQuotas(professionId) {

    const table = PROFESSION_QUOTA_TABLE[professionId];

    if (!table) return { ...BASE_QUOTAS };

    return { ...table };

}

/** 配额分母：优先 max，否则 used+left，最后 fallback */
export function resolveQuotaDenom({ used, left, max, fallback }) {
    if (max != null) return max;
    if (used != null && left != null) return used + left;
    return fallback ?? 0;
}

/** 格式化职业专精配额摘要 */
export function formatProfessionQuotaSummary(professionId, mode = 'brief') {
    const q = resolveProfessionQuotas(professionId);
    if (mode === 'brief') {
        return `帮${q.help} 戒${q.helpWithdraw} · 偷${q.steal} 咒${q.curse} 福${q.bless} 擂${q.arena} 皇${q.imperial}`;
    }
    const lines = Object.values(QUOTA)
        .filter((id) => (q[id] ?? 0) > 0)
        .map((id) => `${QUOTA_LABELS[id] || id} ${q[id]}`);
    return lines.join(' · ');
}



/** 校验表完整性（开发期自检） */

export function assertProfessionQuotaTableComplete() {

    const keys = Object.values(QUOTA);

    for (const [profId, row] of Object.entries(PROFESSION_QUOTA_TABLE)) {

        for (const k of keys) {

            if (row[k] == null) {

                throw new Error(`[profession-quotas] ${profId} 缺少配额键 ${k}`);

            }

        }

    }

}



assertProfessionQuotaTableComplete();


