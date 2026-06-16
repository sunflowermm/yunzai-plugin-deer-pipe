import {
    USER_SKIN_KEYS,
    SKIN_AUTO,
    SKIN_DEFAULT,
    resolveUiSkinId,
    resolvePortraitSkinId,
    portraitSkinSupportsProfession,
    hasAnyPortraitUnlock,
} from '../constants/skins.js';

export function getUserSkinPrefs(userRecord) {
    if (!userRecord || typeof userRecord !== 'object') {
        return { ui: SKIN_AUTO, portrait: SKIN_AUTO };
    }
    return {
        ui: userRecord[USER_SKIN_KEYS.ui] ?? SKIN_AUTO,
        portrait: userRecord[USER_SKIN_KEYS.portrait] ?? SKIN_AUTO,
    };
}

export function setUserSkinPref(userRecord, kind, skinId) {
    const key = kind === 'portrait' ? USER_SKIN_KEYS.portrait : USER_SKIN_KEYS.ui;
    if (!skinId || skinId === SKIN_AUTO) {
        delete userRecord[key];
        return SKIN_AUTO;
    }
    userRecord[key] = skinId;
    return skinId;
}

/**
 * 出图皮肤上下文：ui 管界面样式，portrait 管职业立绘（二者独立）
 * @returns {{ ui: string, portrait: string, pref: { ui: string, portrait: string } }}
 */
export function resolveSkinContext(userRecord, date = new Date(), professionId = null) {
    const pref = getUserSkinPrefs(userRecord);
    const ui = resolveUiSkinId(pref, date);
    const portrait = professionId
        ? resolvePortraitSkinId(pref, professionId, date, userRecord)
        : resolvePortraitSkinId(pref, 'medic', date, userRecord);
    return { ui, portrait, pref };
}

export function shouldBypassPrebuiltForPortraitSkin(skinCtx) {
    return !!skinCtx && skinCtx.portrait !== SKIN_DEFAULT;
}

export function isUserProfileKey(key) {
    return key === USER_SKIN_KEYS.ui
        || key === USER_SKIN_KEYS.portrait
        || key === USER_SKIN_KEYS.portraitUnlock
        || key === USER_SKIN_KEYS.festSkinProg;
}

export { portraitSkinSupportsProfession, hasAnyPortraitUnlock, USER_SKIN_KEYS };
