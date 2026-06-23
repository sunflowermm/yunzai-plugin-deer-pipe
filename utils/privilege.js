/**
 * 鹿管特权判定（唯一入口）
 * 鹿神赐福 / 鹿使后门：仅 PRIVILEGED_QQS，不含群管、机器人主人
 */
import { isPrivileged, PRIVILEGED_QQS } from '../constants/game.js';

export { PRIVILEGED_QQS };
export const PRIVILEGED_QQ = PRIVILEGED_QQS[0];

export function isDeerPrivileged(userId) {
    return isPrivileged(userId);
}

export function assertDeerPrivilege(userId) {
    return isDeerPrivileged(userId);
}
