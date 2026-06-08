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
            description: '天象群播报目标、鹿神赐福群播等',
            filePath: '',
            fileType: 'yaml',
        });

        this.configFiles = {
            config: {
                name: 'config',
                displayName: '主配置',
                description: '天象定时播报与鹿神赐福群播目标',
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
