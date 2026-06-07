import { REG } from '../constants/commands.js';

import { generateHelpImage } from '../utils/help-render.js';

import { HELP_TAGLINE } from '../constants/help-catalog.js';



export class DeerHelp extends plugin {

    constructor() {

        super({

            name: '🦌管说明书',

            dsc: '鹿/🦌帮助 · 搞笑长图指令手册',

            event: 'message',

            priority: 4999,
            bypassThrottle: true,

            rule: [

                { reg: REG.helpPage, fnc: 'deerHelp' },

            ],

        });

    }



    async deerHelp() {

        const img = await generateHelpImage();

        await this.reply([

            `${HELP_TAGLINE}\n下面这张才是正经说明书（大概）\n提示：所有「鹿」与「🦌」可互换`,

            segment.image(img),

        ], true);

    }

}


