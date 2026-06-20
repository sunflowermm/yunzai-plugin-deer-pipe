import { REG } from '../constants/commands.js';
import { resolveHelpImages } from '../utils/prebuilt-images.js';
import { HELP_TAGLINE } from '../constants/help-catalog.js';
import { loadDeerData } from '../utils/store.js';
import { skinCtxForSender } from '../utils/panel.js';

export class DeerHelp extends plugin {
    constructor() {
        super({
            name: '🦌管说明书',
            dsc: '鹿/🦌帮助 · 双页指令手册',
            event: 'message',
            priority: 4999,
            bypassThrottle: true,
            rule: [
                { reg: REG.helpPage, fnc: 'deerHelp' },
            ],
        });
    }

    async deerHelp() {
        const deerData = await loadDeerData();
        const skinCtx = skinCtxForSender(deerData, this.e.sender.user_id, new Date());
        const intro = `${HELP_TAGLINE}\n共 2 张图：活鹿篇（玩法/天象/生态）+ 冥界篇（对线/死亡/特权/彩蛋）\n提示：所有「鹿」与「🦌」可互换`;
        const imagesPromise = resolveHelpImages({ skinCtx });
        await this.reply(intro, true);
        const images = await imagesPromise;
        await this.reply(images.map((buf) => segment.image(buf)), true);
    }
}
