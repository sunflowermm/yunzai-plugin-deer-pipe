import { update as Update } from '../../other/update.js';
import config from '../model/config.js';

const PLUGIN_NAME = 'yunzai-plugin-deer-pipe';

export class DeerPipeUpdate extends plugin {
    constructor() {
        super({
            name: '🦌管更新',
            dsc: '鹿管插件 git 更新',
            event: 'message',
            priority: 4000,
            rule: [
                {
                    reg: '^#*(🦌|鹿)(管)?(插件)?(强制)?更新$',
                    fnc: 'update',
                    permission: 'master',
                },
                {
                    reg: '^#?(🦌|鹿)(管)?(插件)?更新日志$',
                    fnc: 'update_log',
                },
                {
                    reg: '^#?(🦌|鹿)(管)?(插件)?版本$',
                    fnc: 'version',
                },
            ],
        });
    }

    async update(e = this.e) {
        if (!e.isMaster) return false;
        e.msg = `#${e.msg.includes('强制') ? '强制' : ''}更新${PLUGIN_NAME}`;
        const up = new Update(e);
        up.e = e;
        up.reply = this.reply.bind(this);
        return up.update();
    }

    async update_log() {
        const up = new Update();
        up.e = this.e;
        up.reply = this.reply.bind(this);
        if (up.getPlugin(PLUGIN_NAME) === false) {
            return this.reply('当前目录不是 git 仓库，无法查看更新日志');
        }
        return this.reply(await up.getLog(PLUGIN_NAME));
    }

    async version() {
        const versionData = config.getConfig('version');
        const current = versionData?.[0];
        if (!current) {
            return this.reply('未找到版本信息');
        }
        const lines = [`🦌管插件 v${current.version}`];
        if (Array.isArray(current.data) && current.data.length) {
            lines.push('', '最近变更：', ...current.data.map((item) => `- ${item}`));
        }
        lines.push('', '更新：#🦌更新 / #🦌强制更新', '日志：#🦌更新日志');
        return this.reply(lines.join('\n'));
    }
}
