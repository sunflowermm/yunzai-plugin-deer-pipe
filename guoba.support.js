import path from 'path';
import fs from 'node:fs';
import yaml from 'yaml';
import lodash from 'lodash';
import hub from './lib/deer-hub.js';
import { DEERPIPE_LOGO } from './constants/deer-assets.js';
import { ensureAllConfigsSync, getConfigPath } from './lib/config-paths.js';

const pluginName = 'yunzai-plugin-deer-pipe';
const _path = path.join(process.cwd(), 'plugins', pluginName);

function buildGroupOptions() {
    const options = [];
    try {
        Bot.gl?.forEach((v, k) => {
            options.push({ label: `${v.group_name}(${k})`, value: String(k) });
        });
    } catch (_) {}
    return options;
}

function normalizeConfig(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const wb = src.weather_broadcast && typeof src.weather_broadcast === 'object'
        ? src.weather_broadcast
        : {};
    const kb = src.king_broadcast && typeof src.king_broadcast === 'object'
        ? src.king_broadcast
        : {};
    const render = src.render && typeof src.render === 'object' ? src.render : {};
    return {
        ...src,
        weather_broadcast: {
            ...wb,
            group_ids: Array.isArray(wb.group_ids)
                ? wb.group_ids.map((id) => String(id).trim()).filter(Boolean)
                : [],
        },
        king_broadcast: {
            ...kb,
            group_ids: Array.isArray(kb.group_ids)
                ? kb.group_ids.map((id) => String(id).trim()).filter(Boolean)
                : [],
        },
        render: {
            prefer_prebuilt: render.prefer_prebuilt !== false,
        },
    };
}

function saveMainConfig(patch) {
    ensureAllConfigsSync();
    const next = normalizeConfig(lodash.merge({}, hub.getConfig(), patch));
    fs.writeFileSync(getConfigPath('config'), yaml.stringify(next), 'utf8');
    hub.reload();
    return next;
}

export function supportGuoba() {
    const groupOptions = buildGroupOptions();
    const groupComponent = groupOptions.length ? 'Select' : 'GTags';

    return {
        pluginInfo: {
            name: '🦌管插件',
            title: pluginName,
            author: '@R插件和它的朋友们',
            authorLink: 'https://github.com/sunflowermm/yunzai-plugin-deer-pipe',
            link: 'https://github.com/sunflowermm/yunzai-plugin-deer-pipe',
            isV3: true,
            isV2: false,
            description: '鹿/🦌 签到、天象、职业、鹿王与互助玩法',
            showInMenu: 'auto',
            icon: 'mdi:deer',
            iconColor: '#c9a227',
            iconPath: DEERPIPE_LOGO,
        },
        configInfo: {
            schemas: [
                {
                    component: 'SOFT_GROUP_BEGIN',
                    label: '天象群播报',
                },
                {
                    field: 'weather_broadcast.enabled',
                    label: '启用定时播报',
                    bottomHelpMessage: '00:00 / 12:00 换场播报',
                    component: 'Switch',
                },
                {
                    field: 'weather_broadcast.mode',
                    label: '播报范围',
                    bottomHelpMessage: 'all=机器人所在全部群，selected=仅下方群号',
                    component: 'Select',
                    componentProps: {
                        options: [
                            { label: '全部群', value: 'all' },
                            { label: '指定群', value: 'selected' },
                        ],
                    },
                },
                {
                    field: 'weather_broadcast.group_ids',
                    label: '播报群号',
                    bottomHelpMessage: 'mode=selected 时生效',
                    component: groupComponent,
                    componentProps: {
                        mode: 'multiple',
                        allowAdd: true,
                        allowDel: true,
                        options: groupOptions,
                    },
                },
                {
                    field: 'weather_broadcast.bless_broadcast',
                    label: '鹿神赐福群播',
                    component: 'Switch',
                },
                {
                    field: 'weather_broadcast.interval_ms',
                    label: '群间间隔(ms)',
                    component: 'InputNumber',
                    componentProps: {
                        min: 0,
                        placeholder: '500',
                    },
                },
                {
                    component: 'SOFT_GROUP_BEGIN',
                    label: '日度鹿王群播',
                },
                {
                    field: 'king_broadcast.enabled',
                    label: '启用鹿王加冕',
                    bottomHelpMessage: '每日 00:00 结算昨日鹿王',
                    component: 'Switch',
                },
                {
                    field: 'king_broadcast.mode',
                    label: '播报范围',
                    component: 'Select',
                    componentProps: {
                        options: [
                            { label: '全部群', value: 'all' },
                            { label: '指定群', value: 'selected' },
                        ],
                    },
                },
                {
                    field: 'king_broadcast.group_ids',
                    label: '播报群号',
                    bottomHelpMessage: '留空则沿用天象播报群号',
                    component: groupComponent,
                    componentProps: {
                        mode: 'multiple',
                        allowAdd: true,
                        allowDel: true,
                        options: groupOptions,
                    },
                },
                {
                    field: 'king_broadcast.interval_ms',
                    label: '群间间隔(ms)',
                    component: 'InputNumber',
                    componentProps: {
                        min: 0,
                        placeholder: '500',
                    },
                },
                {
                    field: 'king_broadcast.profession_reset',
                    label: '0点职业重置提醒',
                    bottomHelpMessage: '与鹿王同批群播，提醒可重新转职',
                    component: 'Switch',
                },
                {
                    component: 'SOFT_GROUP_BEGIN',
                    label: '出图',
                },
                {
                    field: 'render.prefer_prebuilt',
                    label: '优先预渲染 PNG',
                    bottomHelpMessage: '开启后优先读 assets/prebuilt/，缺文件时自动回退实时渲染',
                    component: 'Switch',
                },
            ],
            getConfigData() {
                return hub.getConfig();
            },
            setConfigData(data, { Result }) {
                const patch = {};
                for (const [keyPath, value] of Object.entries(data)) {
                    lodash.set(patch, keyPath, value);
                }
                saveMainConfig(patch);
                return Result.ok({}, '保存成功~');
            },
        },
    };
}
