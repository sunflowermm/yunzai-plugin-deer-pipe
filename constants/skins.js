/**
 * 鹿管皮肤系统：UI 主题（鹿况/月历等）与职业立绘皮肤
 * - UI 皮肤：影响鹿况面板、月历背景、职业卡配色等
 * - 立绘皮肤：影响职业立绘 PNG（按职业 id 可选覆盖）
 */

export const SKIN_AUTO = 'auto';
export const SKIN_DEFAULT = 'default';

/** 用户档案键（挂在 userRecord 根，与 YYYY-MM 月键并列） */
export const USER_SKIN_KEYS = {
    ui: '_user_skin_ui',
    portrait: '_user_skin_portrait',
};

/** 节日窗口（公历近似，每年可扩展） */
export const FESTIVAL_WINDOWS = {
    duanwu: { start: '2026-06-01', end: '2026-06-30', label: '端午节' },
};

/** UI 主题皮肤 */
export const UI_SKINS = {
    default: {
        id: SKIN_DEFAULT,
        name: '默认鹿林',
        emoji: '🦌',
        desc: '经典暖色鹿林配色',
    },
    duanwu: {
        id: 'duanwu',
        name: '端午粽香',
        emoji: '🫔',
        festival: 'duanwu',
        desc: '青粽荷叶 · 龙舟水色 · 鹿况/月历端午主题',
    },
};

/** 职业立绘皮肤（仅列出有独立 PNG 的职业） */
export const PORTRAIT_SKINS = {
    default: {
        id: SKIN_DEFAULT,
        name: '默认立绘',
        emoji: '🦌',
        desc: '原版职业立绘',
        professions: null,
    },
    duanwu: {
        id: 'duanwu',
        name: '端午限定立绘',
        emoji: '🐲',
        festival: 'duanwu',
        desc: '鹿医师 · 卷王鹿 端午换装',
        professions: ['medic', 'grinder'],
    },
};

export const SKIN_ALIASES = {
    默认: SKIN_DEFAULT,
    default: SKIN_DEFAULT,
    原版: SKIN_DEFAULT,
    自动: SKIN_AUTO,
    auto: SKIN_AUTO,
    端午: 'duanwu',
    端午节: 'duanwu',
    duanwu: 'duanwu',
    粽香: 'duanwu',
    龙舟: 'duanwu',
};

export function parseSkinToken(raw) {
    const s = String(raw ?? '').trim().replace(/\s+/g, '');
    if (!s) return null;
    if (s === SKIN_AUTO || SKIN_ALIASES[s] === SKIN_AUTO) return SKIN_AUTO;
    const mapped = SKIN_ALIASES[s] ?? s;
    if (mapped === SKIN_DEFAULT || UI_SKINS[mapped] || PORTRAIT_SKINS[mapped]) return mapped;
    return null;
}

function parseYmd(ymd) {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export function isFestivalActive(festivalId, date = new Date()) {
    const win = FESTIVAL_WINDOWS[festivalId];
    if (!win) return false;
    const t = date.getTime();
    return t >= parseYmd(win.start).getTime() && t <= parseYmd(win.end).getTime() + 86400000;
}

export function listActiveFestivals(date = new Date()) {
    return Object.keys(FESTIVAL_WINDOWS).filter((id) => isFestivalActive(id, date));
}

export function portraitSkinSupportsProfession(skinId, professionId) {
    if (!skinId || skinId === SKIN_DEFAULT) return true;
    const skin = PORTRAIT_SKINS[skinId];
    if (!skin?.professions) return false;
    return skin.professions.includes(professionId);
}

export function resolveUiSkinId(pref, date = new Date()) {
    const raw = pref?.ui ?? SKIN_AUTO;
    if (raw && raw !== SKIN_AUTO && UI_SKINS[raw]) return raw;
    if (isFestivalActive('duanwu', date) && UI_SKINS.duanwu) return 'duanwu';
    return SKIN_DEFAULT;
}

/** 显式指定 UI 皮肤（不走 auto/节日），供预览与「强制默认」 */
export function userRecordWithUiSkin(uiSkinId) {
    const id = UI_SKINS[uiSkinId]?.id ?? SKIN_DEFAULT;
    return { [USER_SKIN_KEYS.ui]: id };
}

export function resolvePortraitSkinId(pref, professionId, date = new Date()) {
    const raw = pref?.portrait ?? SKIN_AUTO;
    if (raw && raw !== SKIN_AUTO && PORTRAIT_SKINS[raw]) {
        if (portraitSkinSupportsProfession(raw, professionId)) return raw;
        return SKIN_DEFAULT;
    }
    if (isFestivalActive('duanwu', date) && portraitSkinSupportsProfession('duanwu', professionId)) {
        return 'duanwu';
    }
    return SKIN_DEFAULT;
}

export function formatSkinCatalog(date = new Date()) {
    const festivals = listActiveFestivals(date);
    const festHint = festivals.length
        ? `当前节日：${festivals.map((f) => FESTIVAL_WINDOWS[f]?.label || f).join(' · ')}（未设皮肤时自动套用节日主题）`
        : '当前无节日窗口，自动模式使用默认皮肤';
    const uiLines = Object.values(UI_SKINS).map((s) => `${s.emoji} ${s.name}（${s.id}）— ${s.desc}`);
    const portraitLines = Object.values(PORTRAIT_SKINS).map((s) => {
        const profs = s.professions ? s.professions.join('、') : '全职业默认图';
        return `${s.emoji} ${s.name}（${s.id}）— ${s.desc} · ${profs}`;
    });
    return [
        '🎨 鹿管皮肤一览',
        festHint,
        '',
        '【界面主题】鹿况 / 月历 / 职业卡 / 帮助 配色 + 可选 UI 组件 PNG',
        ...uiLines,
        '',
        'UI 组件：顶栏丝带 · 顶角装饰 · 月历水印（default / duanwu → assets/skins/*/ui/）',
        '',
        '【立绘皮肤】职业立绘 PNG',
        ...portraitLines,
        '',
        '切换：鹿皮肤端午 / 鹿皮肤默认 / 鹿皮肤自动',
        '立绘：鹿立绘端午 / 鹿立绘默认 / 鹿立绘自动',
    ].join('\n');
}
