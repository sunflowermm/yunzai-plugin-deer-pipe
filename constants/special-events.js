/** 特殊日期活动（公历月日每年循环；集体加成全员生效） */

export const SPECIAL_EVENT_DAYS = Object.freeze({
    day626: {
        month: 6,
        day: 26,
        label: '626 安全区狂欢',
        safeBonus: 200,
    },
});

/** 当天是否命中某活动 */
export function isSpecialEventActive(eventId, date = new Date()) {
    const ev = SPECIAL_EVENT_DAYS[eventId];
    if (!ev) return false;
    return date.getMonth() + 1 === ev.month && date.getDate() === ev.day;
}

/** 当天所有生效中的活动 id */
export function listActiveSpecialEvents(date = new Date()) {
    return Object.keys(SPECIAL_EVENT_DAYS).filter((id) => isSpecialEventActive(id, date));
}

/** 当天活动提供的安全区加成合计（集体） */
export function getSpecialEventSafeBonus(date = new Date()) {
    let sum = 0;
    for (const id of listActiveSpecialEvents(date)) {
        sum += SPECIAL_EVENT_DAYS[id].safeBonus || 0;
    }
    return sum;
}

/** 活动标签文案（鹿况/帮助用） */
export function formatActiveSpecialEventLabels(date = new Date()) {
    return listActiveSpecialEvents(date).map((id) => SPECIAL_EVENT_DAYS[id].label || id);
}
