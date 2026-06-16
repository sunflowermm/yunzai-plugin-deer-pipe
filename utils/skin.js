import { FileUtils } from '../../../lib/utils/file-utils.js';
import {
    USER_SKIN_KEYS,
    SKIN_AUTO,
    SKIN_DEFAULT,
    UI_SKINS,
    PORTRAIT_SKINS,
    resolveUiSkinId,
    resolvePortraitSkinId,
    userRecordWithUiSkin,
    portraitSkinSupportsProfession,
} from '../constants/skins.js';
import { professionArtPath, skillArtPath } from '../constants/deer-assets.js';
import { UI_SURFACES, resolveSurfaceTheme } from './ui/theme.js';

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

/** @returns {{ ui: string, portrait: string, uiSkin: object, portraitSkinId: string }} */
export function resolveSkinContext(userRecord, date = new Date(), professionId = null) {
    const pref = getUserSkinPrefs(userRecord);
    const ui = resolveUiSkinId(pref, date);
    const portrait = professionId
        ? resolvePortraitSkinId(pref, professionId, date)
        : resolvePortraitSkinId(pref, 'medic', date);
    return {
        ui,
        portrait,
        uiSkin: UI_SKINS[ui] || UI_SKINS[SKIN_DEFAULT],
        portraitSkinId: portrait,
        pref,
    };
}

export function portraitArtExists(skinId, professionId) {
    const path = professionArtPath(professionId, skinId);
    return path && FileUtils.existsSync(path);
}

export function skillArtExists(skinId, professionId) {
    const path = skillArtPath(professionId, skinId);
    return path && FileUtils.existsSync(path);
}

export function shouldBypassPrebuiltForSkin(skinCtx) {
    if (!skinCtx) return false;
    return skinCtx.ui !== SKIN_DEFAULT || skinCtx.portrait !== SKIN_DEFAULT;
}

export function isUserProfileKey(key) {
    return key === USER_SKIN_KEYS.ui || key === USER_SKIN_KEYS.portrait;
}

export { portraitSkinSupportsProfession, USER_SKIN_KEYS, UI_SURFACES, resolveSurfaceTheme, userRecordWithUiSkin };
