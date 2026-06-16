/**
 * 鹿管皮肤：界面主题（UI）与职业立绘（Portrait）两套独立体系
 *
 * - UI 皮肤：鹿况 / 月历 / 帮助 / PK 互动卡 / 天象 / 鹿王 等出图配色与装饰 PNG；
 *   用户显式切换后写入 _user_skin_ui，永久生效直至再次切换（auto 才跟节日）。
 * - 立绘皮肤：仅职业立绘与专属技图标 PNG；写入 _user_skin_portrait，与 UI 无关。
 */

import { SKIN_AUTO, SKIN_DEFAULT, USER_SKIN_KEYS } from './skin-keys.js';

export { SKIN_AUTO, SKIN_DEFAULT, USER_SKIN_KEYS };

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
        desc: '青粽荷叶 · 龙舟水色 · 鹿况/月历/PK 端午主题',
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
        desc: '鹿医师 · 卷王鹿 端午换装（活动解锁）',
        professions: ['medic', 'grinder'],
    },
};

/** 端午立绘解锁：活动期间累计达成后永久获得对应职业立绘 */
export const PORTRAIT_UNLOCK_RULES = {
    duanwu: {
        grinder: {
            metric: 'lu',
            count: 10,
            label: '卷王鹿端午立绘',
            grantText: '🫔 端午活动：已获得卷王鹿限定立绘！',
            hint: '端午活动期间自🦌累计 10 次',
        },
        medic: {
            metric: 'help_lu',
            count: 10,
            label: '鹿医师端午立绘',
            grantText: '🫔 端午活动：已获得鹿医师限定立绘！',
            hint: '端午活动期间帮鹿累计 10 次',
        },
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

function mapSkinAlias(raw) {
    const s = String(raw ?? '').trim().replace(/\s+/g, '');
    if (!s) return null;
    if (s === SKIN_AUTO || SKIN_ALIASES[s] === SKIN_AUTO) return SKIN_AUTO;
    return SKIN_ALIASES[s] ?? s;
}

/** 解析界面主题 token（仅 UI_SKINS） */
export function parseUiSkinToken(raw) {
    const mapped = mapSkinAlias(raw);
    if (!mapped) return null;
    if (mapped === SKIN_AUTO || mapped === SKIN_DEFAULT) return mapped;
    return UI_SKINS[mapped] ? mapped : null;
}

/** 解析立绘皮肤 token（仅 PORTRAIT_SKINS） */
export function parsePortraitSkinToken(raw) {
    const mapped = mapSkinAlias(raw);
    if (!mapped) return null;
    if (mapped === SKIN_AUTO || mapped === SKIN_DEFAULT) return mapped;
    return PORTRAIT_SKINS[mapped] ? mapped : null;
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

/** 界面主题：显式 pref 永久生效；auto 时节日窗口套 duanwu */
export function resolveUiSkinId(pref, date = new Date()) {
    const raw = pref?.ui ?? SKIN_AUTO;
    if (raw && raw !== SKIN_AUTO && UI_SKINS[raw]) return raw;
    if (isFestivalActive('duanwu', date) && UI_SKINS.duanwu) return 'duanwu';
    return SKIN_DEFAULT;
}

/** 立绘：须已解锁；auto 时仅对已解锁职业套用节日立绘 */
export function resolvePortraitSkinId(pref, professionId, date = new Date(), userRecord = null) {
    const raw = pref?.portrait ?? SKIN_AUTO;
    const unlocked = (skinId) => portraitSkinSupportsProfession(skinId, professionId)
        && hasPortraitUnlock(userRecord, skinId, professionId);

    if (raw && raw !== SKIN_AUTO && PORTRAIT_SKINS[raw]) {
        if (raw === SKIN_DEFAULT) return SKIN_DEFAULT;
        return unlocked(raw) ? raw : SKIN_DEFAULT;
    }
    if (unlocked('duanwu')) return 'duanwu';
    return SKIN_DEFAULT;
}

function portraitUnlockMap(userRecord) {
    const raw = userRecord?.[USER_SKIN_KEYS.portraitUnlock];
    return raw && typeof raw === 'object' ? raw : {};
}

export function hasPortraitUnlock(userRecord, skinId, professionId) {
    if (!skinId || skinId === SKIN_DEFAULT) return true;
    return !!portraitUnlockMap(userRecord)?.[skinId]?.[professionId];
}

export function hasAnyPortraitUnlock(userRecord, skinId) {
    const profs = portraitUnlockMap(userRecord)?.[skinId];
    if (!profs || typeof profs !== 'object') return false;
    return Object.values(profs).some(Boolean);
}

export function getFestivalSkinProgress(userRecord, festivalId = 'duanwu') {
    const all = userRecord?.[USER_SKIN_KEYS.festSkinProg];
    const prog = all?.[festivalId];
    return prog && typeof prog === 'object' ? { ...prog } : { lu: 0, help_lu: 0 };
}

/** 预览用：强制 UI 皮肤（不走 auto/节日） */
export function userRecordWithUiSkin(uiSkinId) {
    const id = UI_SKINS[uiSkinId]?.id ?? SKIN_DEFAULT;
    return { [USER_SKIN_KEYS.ui]: id };
}

export function formatUiSkinCatalog(date = new Date()) {
    const festivals = listActiveFestivals(date);
    const festHint = festivals.length
        ? `当前节日：${festivals.map((f) => FESTIVAL_WINDOWS[f]?.label || f).join(' · ')}（仅「自动」界面会跟节日）`
        : '当前无节日窗口；「自动」使用默认主题';
    const uiLines = Object.values(UI_SKINS).map((s) => `${s.emoji} ${s.name}（${s.id}）— ${s.desc}`);
    return [
        '🎨 鹿管界面主题（样式皮肤 · 免费切换）',
        festHint,
        '',
        '影响：鹿况 · 月历 · 帮助 · 职业卡配色 · PK/互动卡 · 天象 · 鹿王',
        '不影响：职业立绘 PNG（请用「鹿立绘」单独切换）',
        '',
        ...uiLines,
        '',
        '切换后永久保存：鹿皮肤端午 / 鹿皮肤默认 / 鹿皮肤自动',
    ].join('\n');
}

export function formatPortraitSkinCatalog(userRecord = null, date = new Date()) {
    const active = isFestivalActive('duanwu', date);
    const festHint = active
        ? `当前端午活动进行中（${FESTIVAL_WINDOWS.duanwu.label}）· 活动结束后不可再解锁`
        : '端午活动已结束；已解锁立绘永久保留';
    const prog = getFestivalSkinProgress(userRecord, 'duanwu');
    const rules = PORTRAIT_UNLOCK_RULES.duanwu || {};
    const portraitLines = Object.values(PORTRAIT_SKINS).map((s) => {
        if (s.id === SKIN_DEFAULT) return `${s.emoji} ${s.name} — ${s.desc}`;
        const profs = s.professions ? s.professions.join('、') : '全职业';
        return `${s.emoji} ${s.name}（${s.id}）— ${s.desc} · ${profs}`;
    });
    const unlockLines = Object.entries(rules).map(([profId, rule]) => {
        const got = hasPortraitUnlock(userRecord, 'duanwu', profId);
        const cur = prog[rule.metric] ?? 0;
        const status = got ? '已获得' : (active ? `${cur}/${rule.count}（${rule.hint}）` : '未获得（活动已结束）');
        return `· ${rule.label}：${status}`;
    });
    return [
        '🖼️ 鹿管立绘皮肤（角色皮肤 · 与界面主题独立）',
        festHint,
        '',
        '仅影响：职业专精立绘 · 状态栏职业缩略图 · 专属技图标',
        '不影响：鹿况配色 / 月历 / PK 卡等（请用「鹿皮肤」）',
        '',
        ...portraitLines,
        '',
        '端午解锁进度：',
        ...unlockLines,
        '',
        '切换：鹿立绘端午 / 鹿立绘默认 / 鹿立绘自动（须先解锁对应职业）',
    ].join('\n');
}
