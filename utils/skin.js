import {
    USER_SKIN_KEYS,
    SKIN_DEFAULT,
    resolveUiSkinId,
    resolvePortraitSkinId,
    portraitSkinSupportsProfession,
    hasPortraitUnlock,
    migratePortraitSkinPrefs,
} from '../constants/skins.js';
import { reconcileFestivalPortraitUnlocks } from './portrait-unlock.js';

export function getUserSkinPrefs(userRecord) {
    if (!userRecord || typeof userRecord !== 'object') {
        return { ui: SKIN_DEFAULT };
    }
    return {
        ui: userRecord[USER_SKIN_KEYS.ui] ?? SKIN_DEFAULT,
    };
}

export function setUserSkinPref(userRecord, skinId) {
    if (!userRecord || typeof userRecord !== 'object') return SKIN_DEFAULT;
    if (!skinId || skinId === SKIN_DEFAULT) {
        delete userRecord[USER_SKIN_KEYS.ui];
        return SKIN_DEFAULT;
    }
    userRecord[USER_SKIN_KEYS.ui] = skinId;
    return skinId;
}

/**
 * 出图皮肤上下文：ui 管界面样式，portrait 管职业立绘（二者独立）
 * @returns {{ ui: string, portrait: string, pref: { ui: string } }}
 */
export function resolveSkinContext(userRecord, date = new Date(), professionId = null) {
    migratePortraitSkinPrefs(userRecord);
    reconcileFestivalPortraitUnlocks(userRecord);
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
        || key === USER_SKIN_KEYS.portraitByProf
        || key === USER_SKIN_KEYS.portraitUnlock
        || key === USER_SKIN_KEYS.festSkinProg;
}

export { portraitSkinSupportsProfession, hasPortraitUnlock, USER_SKIN_KEYS };
