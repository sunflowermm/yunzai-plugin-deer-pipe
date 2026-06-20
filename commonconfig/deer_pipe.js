/**
 * 鹿管插件 CommonConfig（Web 控制台可视化编辑）
 * 运行时读写 data/deer_pipe/，模板见 config/default/
 */
import path from 'path';
import ConfigBase from '../../../lib/commonconfig/commonconfig.js';
import hub from '../lib/deer-hub.js';

const getDeerPath = (name, ext = 'yaml') => () => path.join('data', 'deer_pipe', `${name}.${ext}`);

export default class DeerPipeConfig extends ConfigBase {
    constructor() {
        super({
            name: 'deer_pipe',
            displayName: '鹿管配置',
            description: '天象群播报目标、鹿神赐福群播、出图预渲染等',
            filePath: '',
            fileType: 'yaml',
        });
        this.configFiles = {
            config: {
                name: 'config',
                displayName: '主配置',
                description: '天象定时播报、鹿神赐福群播与出图选项',
                filePath: getDeerPath('config'),
                fileType: 'yaml',
                schema: {
                    fields: {
                        weather_broadcast: {
                            type: 'object',
                            label: '天象群播报',
                            description: '00:00 / 12:00 换场播报与鹿神赐福群播',
                            component: 'SubForm',
                            fields: {
                                enabled: {
                                    type: 'boolean',
                                    label: '启用定时播报',
                                    default: true,
                                    component: 'Switch',
                                },
                                mode: {
                                    type: 'string',
                                    label: '播报范围',
                                    description: 'all=全部群，selected=仅下方群号',
                                    enum: ['all', 'selected'],
                                    default: 'selected',
                                    component: 'Select',
                                },
                                group_ids: {
                                    type: 'array',
                                    label: '播报群号',
                                    description: 'mode=selected 时生效，留空则不播报',
                                    itemType: 'string',
                                    default: [],
                                    component: 'Tags',
                                },
                                bless_broadcast: {
                                    type: 'boolean',
                                    label: '鹿神赐福群播',
                                    default: true,
                                    component: 'Switch',
                                },
                                interval_ms: {
                                    type: 'number',
                                    label: '群间间隔(ms)',
                                    min: 0,
                                    default: 500,
                                    component: 'InputNumber',
                                },
                            },
                        },
                        king_broadcast: {
                            type: 'object',
                            label: '日度鹿王群播',
                            description: '每日 00:00 结算昨日鹿王加冕，并可选推送职业重置提醒',
                            component: 'SubForm',
                            fields: {
                                enabled: {
                                    type: 'boolean',
                                    label: '启用鹿王加冕',
                                    default: true,
                                    component: 'Switch',
                                },
                                mode: {
                                    type: 'string',
                                    label: '播报范围',
                                    enum: ['all', 'selected'],
                                    default: 'selected',
                                    component: 'Select',
                                },
                                group_ids: {
                                    type: 'array',
                                    label: '播报群号',
                                    description: '留空则沿用天象播报群号',
                                    itemType: 'string',
                                    default: [],
                                    component: 'Tags',
                                },
                                interval_ms: {
                                    type: 'number',
                                    label: '群间间隔(ms)',
                                    min: 0,
                                    default: 500,
                                    component: 'InputNumber',
                                },
                                profession_reset: {
                                    type: 'boolean',
                                    label: '0点职业重置提醒',
                                    description: '与鹿王同批群播，提醒可重新转职',
                                    default: true,
                                    component: 'Switch',
                                },
                            },
                        },
                        render: {
                            type: 'object',
                            label: '出图',
                            description: '帮助/职业/天象等静态图：服务端预渲染开关 + 玩家皮肤偏好',
                            component: 'SubForm',
                            fields: {
                                prefer_prebuilt: {
                                    type: 'boolean',
                                    label: '优先预渲染图',
                                    description: '开启：默认读 assets/prebuilt/（快）；玩家换了界面主题或立绘皮肤时仍会自动实时出图。关闭：全员始终实时 SVG 出图。缺预渲染文件时也会自动回退实时渲染。',
                                    default: true,
                                    component: 'Switch',
                                },
                            },
                        },
                    },
                },
            },
        };
    }

    getConfigInstance(name) {
        const configMeta = this.configFiles[name];
        if (!configMeta) throw new Error(`未知的配置: ${name}`);
        return new ConfigBase(configMeta);
    }

    _invoke(name, method, ...args) {
        return this.getConfigInstance(name)[method](...args);
    }

    async read(name) {
        if (!name) {
            return {
                name: this.name,
                displayName: this.displayName,
                description: this.description,
                configs: this.getConfigList(),
            };
        }
        return this._invoke(name, 'read');
    }

    async write(name, data, options = {}) {
        if (!name) throw new Error('DeerPipeConfig 写入需要指定子配置名称');
        const result = await this._invoke(name, 'write', data, options);
        hub.reload();
        return result;
    }

    async get(name, keyPath) {
        return this._invoke(name, 'get', keyPath);
    }

    async set(name, keyPath, value, options = {}) {
        const result = await this._invoke(name, 'set', keyPath, value, options);
        hub.reload();
        return result;
    }

    getStructure() {
        const structure = {
            name: this.name,
            displayName: this.displayName,
            description: this.description,
            configs: {},
        };
        for (const [name, meta] of Object.entries(this.configFiles)) {
            structure.configs[name] = {
                ...meta,
                fields: meta.schema?.fields || {},
            };
        }
        return structure;
    }

    getConfigList() {
        return Object.entries(this.configFiles).map(([name, meta]) => ({
            name,
            displayName: meta.displayName,
            description: meta.description,
            filePath: meta.filePath,
            fileType: meta.fileType,
        }));
    }
}
