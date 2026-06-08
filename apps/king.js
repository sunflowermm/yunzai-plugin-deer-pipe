import { loadDeerData } from '../utils/store.js';
import { publishDailyKingCoronation } from '../utils/king.js';
import { publishDailyProfessionReset } from '../utils/profession-broadcast.js';

export class DeerKing extends plugin {
    constructor() {
        super({
            name: '🦌管鹿王',
            dsc: '每日 0:00 鹿王加冕与职业重置群播',
            event: 'message',
            priority: 5003,
            rule: [],
        });
        this.task = [
            {
                name: '日度鹿王·加冕与职业重置',
                cron: '0 0 0 * * *',
                fnc: () => this.publishMidnightBroadcasts(),
                log: true,
            },
        ];
    }

    async publishMidnightBroadcasts() {
        try {
            const deerData = await loadDeerData();
            const king = await publishDailyKingCoronation(deerData);
            logger.info(`[deer-pipe] 日度鹿王加冕 ${king.dayKey} · 群 ${king.groups ?? 0} · 成功 ${king.sent}`);
            const prof = await publishDailyProfessionReset();
            if (!prof.skipped && !prof.deduped) {
                logger.info(`[deer-pipe] 职业重置群播 ${prof.dayKey} · 群 ${prof.groups ?? 0} · 成功 ${prof.sent}`);
            }
        } catch (err) {
            logger.error(`[deer-pipe] 0点群播失败: ${err?.message || err}`);
        }
    }
}
