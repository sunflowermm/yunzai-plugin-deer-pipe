import {
    USER_SKIN_KEYS,
    SKIN_DEFAULT,
    resolveUiSkinId,
    resolvePortraitSkinId,
    portraitSkinSupportsProfession,
    hasPortraitUnlock,
    migratePortraitSkinPrefs,
} from '../constants/skins.js';
import { EXTRA_DEER_IDS } from '../constants/extra-deer.js';
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
    const ui = resolveUiSkinId(pref);
    const portrait = professionId
        ? resolvePortraitSkinId(userRecord, professionId)
        : resolvePortraitSkinId(userRecord, 'medic');
    return { ui, portrait, pref };
}

export function shouldBypassPrebuiltForPortraitSkin(skinCtx) {
    return !!skinCtx && skinCtx.portrait !== SKIN_DEFAULT;
}

/** 番外一览：任一番外鹿非默认立绘时须 live（预渲染图为全员默认皮） */
export function needsLiveExtraDeerCatalog(userRecord) {
    if (!userRecord) return false;
    migratePortraitSkinPrefs(userRecord);
    reconcileFestivalPortraitUnlocks(userRecord);
    return EXTRA_DEER_IDS.some((id) => resolvePortraitSkinId(userRecord, id) !== SKIN_DEFAULT);
}

/** 单格立绘 skinId（default → undefined 走默认 PNG） */
export function resolveExtraDeerArtSkin(userRecord, extraId) {
    if (!userRecord || !extraId) return undefined;
    migratePortraitSkinPrefs(userRecord);
    reconcileFestivalPortraitUnlocks(userRecord);
    const id = resolvePortraitSkinId(userRecord, extraId);
    return id !== SKIN_DEFAULT ? id : undefined;
}

export function isUserProfileKey(key) {
    return key === USER_SKIN_KEYS.ui
        || key === USER_SKIN_KEYS.portrait
        || key === USER_SKIN_KEYS.portraitByProf
        || key === USER_SKIN_KEYS.portraitUnlock
        || key === USER_SKIN_KEYS.festSkinProg;
}

export { portraitSkinSupportsProfession, hasPortraitUnlock, USER_SKIN_KEYS };
