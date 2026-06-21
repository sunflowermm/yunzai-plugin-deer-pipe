import {
    USER_SKIN_KEYS,
    SKIN_DEFAULT,
    resolveUiSkinId,
    resolvePortraitSkinId,
    portraitSkinSupportsProfession,
    hasPortraitUnlock,
} from '../constants/skins.js';
import { EXTRA_DEER_IDS } from '../constants/extra-deer.js';
import { PROFESSIONS } from '../constants/profession.js';
import { reconcileFestivalPortraitUnlocks } from './portrait-unlock.js';

const USER_PROFILE_KEYS = new Set(Object.values(USER_SKIN_KEYS));

/** 同步立绘解锁进度（出图/切换前调用一次即可） */
export function syncPortraitSkinState(userRecord) {
    reconcileFestivalPortraitUnlocks(userRecord);
}

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
    syncPortraitSkinState(userRecord);
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

/** 单格立绘 skinId（default → undefined 走默认 PNG） */
export function resolveProfessionArtSkin(userRecord, professionId) {
    if (!userRecord || !professionId) return undefined;
    syncPortraitSkinState(userRecord);
    const id = resolvePortraitSkinId(userRecord, professionId);
    return id !== SKIN_DEFAULT ? id : undefined;
}

/** 番外一览：任一番外鹿非默认立绘时须 live（预渲染图为全员默认皮） */
export function needsLiveExtraDeerCatalog(userRecord) {
    if (!userRecord) return false;
    syncPortraitSkinState(userRecord);
    return EXTRA_DEER_IDS.some((id) => resolvePortraitSkinId(userRecord, id) !== SKIN_DEFAULT);
}

/** 八职业一览：任一职业非默认立绘时须 live */
export function needsLiveProfessionCatalogForPortraits(userRecord) {
    if (!userRecord) return false;
    syncPortraitSkinState(userRecord);
    return Object.keys(PROFESSIONS).some((id) => resolvePortraitSkinId(userRecord, id) !== SKIN_DEFAULT);
}

export function isUserProfileKey(key) {
    return USER_PROFILE_KEYS.has(key);
}

export { portraitSkinSupportsProfession, hasPortraitUnlock, USER_SKIN_KEYS };
