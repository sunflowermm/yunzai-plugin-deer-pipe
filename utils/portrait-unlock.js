import { USER_SKIN_KEYS } from '../constants/skin-keys.js';
import {
    isFestivalActive,
    PORTRAIT_UNLOCK_RULES,
    hasPortraitUnlock,
} from '../constants/skins.js';

function ensureProgRoot(userRecord) {
    if (!userRecord[USER_SKIN_KEYS.festSkinProg]) {
        userRecord[USER_SKIN_KEYS.festSkinProg] = {};
    }
    return userRecord[USER_SKIN_KEYS.festSkinProg];
}

function ensureUnlockRoot(userRecord) {
    if (!userRecord[USER_SKIN_KEYS.portraitUnlock]) {
        userRecord[USER_SKIN_KEYS.portraitUnlock] = {};
    }
    return userRecord[USER_SKIN_KEYS.portraitUnlock];
}

function grantPortraitUnlock(userRecord, skinId, professionId) {
    const root = ensureUnlockRoot(userRecord);
    if (!root[skinId]) root[skinId] = {};
    root[skinId][professionId] = true;
}

/**
 * 端午活动期间累计自🦌 / 帮鹿，达标自动赠送对应立绘（永久）
 * @param {'lu'|'help_lu'} metric
 * @returns {string[]} 本次新获得的提示文案
 */
export function bumpFestivalPortraitProgress(userRecord, date, metric) {
    if (!userRecord || !isFestivalActive('duanwu', date)) return [];
    const festivalId = 'duanwu';
    const rules = PORTRAIT_UNLOCK_RULES[festivalId];
    if (!rules) return [];

    const progRoot = ensureProgRoot(userRecord);
    const prog = { lu: 0, help_lu: 0, ...progRoot[festivalId] };
    prog[metric] = (prog[metric] || 0) + 1;
    progRoot[festivalId] = prog;

    const granted = [];
    for (const [profId, rule] of Object.entries(rules)) {
        if (rule.metric !== metric) continue;
        if (hasPortraitUnlock(userRecord, festivalId, profId)) continue;
        if (prog[metric] >= rule.count) {
            grantPortraitUnlock(userRecord, festivalId, profId);
            granted.push(rule.grantText);
        }
    }
    return granted;
}

export function appendUnlockNotices(text, notices) {
    if (!notices?.length) return text;
    return `${text}\n${notices.join('\n')}`;
}
