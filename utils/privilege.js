/**
 * 鹿管特权判定（唯一入口）
 * 鹿神赐福 / 鹿使后门：仅 PRIVILEGED_QQ，不含群管、机器人主人
 */
import { isPrivileged, PRIVILEGED_QQ } from '../constants/game.js';

export { PRIVILEGED_QQ };

export function isDeerPrivileged(userId) {
    return isPrivileged(userId);
}

export function assertDeerPrivilege(userId) {
    return isDeerPrivileged(userId);
}
