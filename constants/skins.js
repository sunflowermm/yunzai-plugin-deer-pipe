/**
 * 鹿管皮肤：界面主题（UI）与职业立绘（Portrait）两套独立体系
 *
 * - UI 皮肤：鹿况 / 月历 / 帮助 / PK 互动卡 / 天象 / 鹿王 等出图配色与装饰 PNG；
 *   用户显式「鹿皮肤端午」等后写入 _user_skin_ui；未设置则恒为默认主题。
 * - 立绘皮肤：按职业写入 _portrait_by_prof；与 UI 无关。
 */

import { SKIN_AUTO, SKIN_DEFAULT, USER_SKIN_KEYS } from './skin-keys.js';
import { isExtraDeerId, resolveExtraDeerId } from './extra-deer.js';
import { resolveProfessionId } from './profession.js';

export { SKIN_DEFAULT, USER_SKIN_KEYS };

/** 有端午独立立绘的职业 */
export const DUANWU_PORTRAIT_PROFESSIONS = Object.freeze(['medic', 'grinder']);

/** 节日窗口（按公历月日每年循环；start/end 的 YYYY 仅作配置锚点） */
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
        desc: '鹿医师 · 卷王鹿 端午换装（活动解锁）· 番外鹿免费随时切换',
        professions: ['medic', 'grinder', 'meijia', 'yumumu'],
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
    端午: 'duanwu',
    端午节: 'duanwu',
    duanwu: 'duanwu',
    粽香: 'duanwu',
    龙舟: 'duanwu',
};

function mapSkinAlias(raw) {
    const s = String(raw ?? '').trim().replace(/\s+/g, '');
    if (!s) return null;
    return SKIN_ALIASES[s] ?? s;
}

/** 解析界面主题 token（仅 UI_SKINS） */
export function parseUiSkinToken(raw) {
    const mapped = mapSkinAlias(raw);
    if (!mapped) return null;
    if (mapped === SKIN_DEFAULT) return SKIN_DEFAULT;
    return UI_SKINS[mapped] ? mapped : null;
}

/** 解析「卷王鹿端午」「雨木木鹿默认」等 */
export function parsePortraitProfSkinCommand(profToken, skinToken) {
    const profId = resolveProfessionId(profToken) || resolveExtraDeerId(profToken);
    if (!profId) return null;
    const mapped = mapSkinAlias(skinToken);
    if (!mapped) return null;
    if (mapped === SKIN_DEFAULT) return { professionId: profId, skinId: SKIN_DEFAULT };
    if (mapped === 'duanwu' && portraitSkinSupportsProfession('duanwu', profId)) {
        return { professionId: profId, skinId: 'duanwu' };
    }
    return null;
}

/** 旧版全局立绘偏好 → 按职业偏好（一次性迁移） */
export function migratePortraitSkinPrefs(userRecord) {
    if (!userRecord) return;
    const legacy = userRecord[USER_SKIN_KEYS.portrait];
    if (!legacy) return;
    if (legacy === 'duanwu') {
        for (const profId of DUANWU_PORTRAIT_PROFESSIONS) {
            if (hasPortraitUnlock(userRecord, 'duanwu', profId)) {
                setPortraitSkinForProfession(userRecord, profId, 'duanwu');
            }
        }
    }
    delete userRecord[USER_SKIN_KEYS.portrait];
}

export function isFestivalActive(festivalId, date = new Date()) {
    const win = FESTIVAL_WINDOWS[festivalId];
    if (!win?.start || !win?.end) return false;
    const [, sm, sd] = win.start.split('-').map(Number);
    const [, em, ed] = win.end.split('-').map(Number);
    const y = date.getFullYear();
    const start = new Date(y, sm - 1, sd);
    const end = new Date(y, em - 1, ed, 23, 59, 59, 999);
    return date >= start && date <= end;
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

/** 界面主题：未设置或 default/auto 时恒为默认，不跟节日自动切换 */
export function resolveUiSkinId(pref) {
    const raw = pref?.ui ?? SKIN_DEFAULT;
    if (!raw || raw === SKIN_AUTO || raw === SKIN_DEFAULT) return SKIN_DEFAULT;
    return UI_SKINS[raw] ? raw : SKIN_DEFAULT;
}

/** 立绘：按职业独立偏好；八职业端午须解锁，番外端午免费 */
export function resolvePortraitSkinId(userRecord, professionId) {
    const byProf = portraitPrefByProf(userRecord);
    const chosen = byProf[professionId];
    if (chosen === 'duanwu' && hasPortraitUnlock(userRecord, 'duanwu', professionId)) {
        return 'duanwu';
    }
    return SKIN_DEFAULT;
}

function portraitPrefByProf(userRecord) {
    const raw = userRecord?.[USER_SKIN_KEYS.portraitByProf];
    return raw && typeof raw === 'object' ? raw : {};
}

export function setPortraitSkinForProfession(userRecord, professionId, skinId) {
    if (!userRecord || !professionId) return SKIN_DEFAULT;
    const id = skinId === 'duanwu' ? 'duanwu' : SKIN_DEFAULT;
    const root = { ...portraitPrefByProf(userRecord) };
    if (id === SKIN_DEFAULT) {
        delete root[professionId];
    } else {
        root[professionId] = id;
    }
    if (Object.keys(root).length) {
        userRecord[USER_SKIN_KEYS.portraitByProf] = root;
    } else {
        delete userRecord[USER_SKIN_KEYS.portraitByProf];
    }
    return id;
}

function portraitUnlockMap(userRecord) {
    const raw = userRecord?.[USER_SKIN_KEYS.portraitUnlock];
    return raw && typeof raw === 'object' ? raw : {};
}

export function hasPortraitUnlock(userRecord, skinId, professionId) {
    if (!skinId || skinId === SKIN_DEFAULT) return true;
    if (skinId === 'duanwu' && isExtraDeerId(professionId)) return true;
    return !!portraitUnlockMap(userRecord)?.[skinId]?.[professionId];
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
    const uiLines = Object.values(UI_SKINS).map((s) => `${s.emoji} ${s.name}（${s.id}）— ${s.desc}`);
    return [
        '🎨 鹿管界面主题（样式皮肤 · 免费切换）',
        '未手动切换时恒为默认主题，不会自动跟节日变色。',
        '',
        '影响：鹿况 · 月历 · 帮助 · 职业卡配色 · PK/互动卡 · 天象 · 鹿王',
        '不影响：职业立绘 PNG（见「鹿立绘」查进度 · 卷王鹿端午 等切换）',
        '',
        ...uiLines,
        '',
        '切换：鹿皮肤端午 / 鹿皮肤默认',
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
        '切换：',
        '· 卷王鹿端午 / 卷王鹿默认（须解锁）',
        '· 鹿医师端午 / 鹿医师默认（须解锁）',
        '· 雨木木鹿端午 / 王美嘉鹿端午（番外免费 · 随时切换）',
    ].join('\n');
}
