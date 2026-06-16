/** 用户档案上的皮肤偏好键（与 YYYY-MM 月键并列，由 migrateUserRecord 保留） */

export const SKIN_AUTO = 'auto';
export const SKIN_DEFAULT = 'default';

export const USER_SKIN_KEYS = {
    ui: '_user_skin_ui',
    /** @deprecated 已改为按职业 _portrait_by_prof；读取时仅作迁移 */
    portrait: '_user_skin_portrait',
    portraitByProf: '_portrait_by_prof',
    portraitUnlock: '_portrait_unlock',
    festSkinProg: '_fest_skin_prog',
};
