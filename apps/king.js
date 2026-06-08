import { loadDeerData } from '../utils/store.js';
import { publishDailyKingCoronation } from '../utils/king.js';

export class DeerKing extends plugin {
    constructor() {
        super({
            name: '🦌管鹿王',
            dsc: '每日 12:00 日度鹿王加冕群播',
            event: 'message',
            priority: 5003,
            rule: [],
        });
        this.task = [
            {
                name: '日度鹿王·加冕',
                cron: '0 0 12 * * *',
                fnc: () => this.publishDailyKing(),
                log: true,
            },
        ];
    }

    async publishDailyKing() {
        try {
            const deerData = await loadDeerData();
            const { sent, dayKey, groups } = await publishDailyKingCoronation(deerData);
            logger.info(`[deer-pipe] 日度鹿王加冕 ${dayKey} · 群 ${groups} · 成功 ${sent}`);
        } catch (err) {
            logger.error(`[deer-pipe] 日度鹿王加冕失败: ${err?.message || err}`);
        }
    }
}
