/**
 * 鹿管皮肤运行时逻辑（配置见 skin-registry.js）
 *
 * - UI 皮肤：界面主题，写入 _user_skin_ui
 * - 立绘皮肤：按职业 _portrait_by_prof，与 UI 独立
 */

import { cleanCommandMsg } from './commands.js';
import { PORTRAIT_PROF_SWITCH } from './portrait-skin-command.js';
import { isExtraDeerId, resolveExtraDeerId } from './extra-deer.js';
import { resolveProfessionId } from './profession.js';
import {
    FESTIVAL_WINDOWS,
    PORTRAIT_SKINS,
    PORTRAIT_UNLOCK_MODE,
    PORTRAIT_UNLOCK_RULES,
    SKIN_ALIASES,
    SKIN_DEFAULT,
    UI_SKINS,
    USER_SKIN_KEYS,
} from './skin-registry.js';

export {
    FESTIVAL_WINDOWS,
    PORTRAIT_SKINS,
    PORTRAIT_UNLOCK_RULES,
    SKIN_ALIASES,
    SKIN_DEFAULT,
    UI_SKINS,
    USER_SKIN_KEYS,
} from './skin-registry.js';

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

/** 解析「卷王鹿端午」「语姐鹿年限」等完整指令 */
export function parsePortraitProfSkinMessage(msg) {
    const s = cleanCommandMsg(msg).replace(/\s+/g, '');
    const match = s.match(new RegExp(PORTRAIT_PROF_SWITCH));
    if (!match) return null;
    return parsePortraitProfSkinCommand(match[1], match[2]);
}

/** 解析职业 token + 皮肤 token */
export function parsePortraitProfSkinCommand(profToken, skinToken) {
    const profId = resolveProfessionId(profToken) || resolveExtraDeerId(profToken);
    if (!profId) return null;
    const mapped = mapSkinAlias(skinToken);
    if (!mapped) return null;
    if (mapped === SKIN_DEFAULT) return { professionId: profId, skinId: SKIN_DEFAULT };
    if (PORTRAIT_SKINS[mapped] && portraitSkinSupportsProfession(mapped, profId)) {
        return { professionId: profId, skinId: mapped };
    }
    return null;
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

/** 界面主题：未设置时恒为 default */
export function resolveUiSkinId(pref) {
    const raw = pref?.ui ?? SKIN_DEFAULT;
    if (!raw || raw === SKIN_DEFAULT) return SKIN_DEFAULT;
    return UI_SKINS[raw] ? raw : SKIN_DEFAULT;
}

/** 立绘：按职业独立偏好 */
export function resolvePortraitSkinId(userRecord, professionId) {
    const byProf = portraitPrefByProf(userRecord);
    const chosen = byProf[professionId];
    if (chosen && chosen !== SKIN_DEFAULT
        && portraitSkinSupportsProfession(chosen, professionId)
        && hasPortraitUnlock(userRecord, chosen, professionId)) {
        return chosen;
    }
    return SKIN_DEFAULT;
}

function portraitPrefByProf(userRecord) {
    const raw = userRecord?.[USER_SKIN_KEYS.portraitByProf];
    return raw && typeof raw === 'object' ? raw : {};
}

export function setPortraitSkinForProfession(userRecord, professionId, skinId) {
    if (!userRecord || !professionId) return SKIN_DEFAULT;
    const id = (skinId && skinId !== SKIN_DEFAULT && portraitSkinSupportsProfession(skinId, professionId))
        ? skinId
        : SKIN_DEFAULT;
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
    if (!portraitSkinSupportsProfession(skinId, professionId)) return false;
    const skin = PORTRAIT_SKINS[skinId];
    if (skin?.unlock === PORTRAIT_UNLOCK_MODE.FREE) return true;
    if (skin?.unlock === PORTRAIT_UNLOCK_MODE.EXTRA_FREE && isExtraDeerId(professionId)) return true;
    return !!portraitUnlockMap(userRecord)?.[skinId]?.[professionId];
}

export function getFestivalSkinProgress(userRecord, festivalId) {
    const all = userRecord?.[USER_SKIN_KEYS.festSkinProg];
    const prog = all?.[festivalId];
    return prog && typeof prog === 'object' ? { ...prog } : { lu: 0, help_lu: 0 };
}

/** 预览用：强制 UI 皮肤 */
export function userRecordWithUiSkin(uiSkinId) {
    const id = UI_SKINS[uiSkinId]?.id ?? SKIN_DEFAULT;
    return { [USER_SKIN_KEYS.ui]: id };
}

function collectUnlockProgressLines(userRecord, date) {
    const lines = [];
    for (const [skinId, rules] of Object.entries(PORTRAIT_UNLOCK_RULES)) {
        const festivalId = PORTRAIT_SKINS[skinId]?.festival;
        if (!festivalId) continue;
        const active = isFestivalActive(festivalId, date);
        const prog = getFestivalSkinProgress(userRecord, festivalId);
        for (const [profId, rule] of Object.entries(rules)) {
            const got = hasPortraitUnlock(userRecord, skinId, profId);
            const cur = prog[rule.metric] ?? 0;
            const status = got
                ? '已获得'
                : (active ? `${cur}/${rule.count}（${rule.hint}）` : '未获得（活动已结束）');
            lines.push(`· ${rule.label}：${status}`);
        }
    }
    return lines;
}

function collectSwitchHintLines() {
    const lines = [];
    for (const skin of Object.values(PORTRAIT_SKINS)) {
        if (skin.id === SKIN_DEFAULT || !skin.switchHints?.length) continue;
        lines.push(...skin.switchHints.map((hint) => `· ${hint}`));
    }
    return lines;
}

export function formatUiSkinCatalog() {
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
    const activeFestivals = listActiveFestivals(date);
    const festHint = activeFestivals.length
        ? `当前活动：${activeFestivals.map((id) => FESTIVAL_WINDOWS[id]?.label || id).join('、')} · 结束后不可再解锁`
        : '节日活动已结束；已解锁立绘永久保留';
    const portraitLines = Object.values(PORTRAIT_SKINS).map((s) => {
        if (s.id === SKIN_DEFAULT) return `${s.emoji} ${s.name} — ${s.desc}`;
        const profs = s.professions ? s.professions.join('、') : '全职业';
        return `${s.emoji} ${s.name}（${s.id}）— ${s.desc} · ${profs}`;
    });
    const unlockLines = collectUnlockProgressLines(userRecord, date);
    const switchLines = collectSwitchHintLines();
    return [
        '🖼️ 鹿管立绘皮肤（角色皮肤 · 与界面主题独立）',
        festHint,
        '',
        '仅影响：职业专精立绘 · 状态栏职业缩略图 · 专属技图标',
        '不影响：鹿况配色 / 月历 / PK 卡等（请用「鹿皮肤」）',
        '',
        ...portraitLines,
        '',
        '活动解锁进度：',
        ...(unlockLines.length ? unlockLines : ['· 暂无']),
        '',
        '切换：',
        ...switchLines,
    ].join('\n');
}
