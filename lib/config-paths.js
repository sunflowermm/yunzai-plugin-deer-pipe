/**
 * 鹿管插件配置路径（对齐向日葵 data/xrkconfig 模式）
 * 模板：plugins/yunzai-plugin-deer-pipe/config/default/
 * 运行时：data/deer_pipe/
 */
import path from 'path';
import fs from 'fs';
import { FileUtils } from '../../../lib/utils/file-utils.js';

const ROOT = process.cwd();

export const DEER_PIPE_PLUGIN_ROOT = path.join(ROOT, 'plugins', 'yunzai-plugin-deer-pipe');
export const DEER_PIPE_CONFIG_DIR = path.join(ROOT, 'data', 'deer_pipe');
export const DEER_PIPE_DEFAULT_DIR = path.join(DEER_PIPE_PLUGIN_ROOT, 'config', 'default');

export function getConfigPath(name, ext = 'yaml') {
    return path.join(DEER_PIPE_CONFIG_DIR, `${name}.${ext}`);
}

export function getDefaultPath(name, ext = 'yaml') {
    return path.join(DEER_PIPE_DEFAULT_DIR, `${name}.${ext}`);
}

/** 启动时将 default 下 yaml/json 复制到 data/deer_pipe（仅缺则复制） */
export function ensureAllConfigsSync() {
    const copied = [];
    if (!FileUtils.existsSync(DEER_PIPE_DEFAULT_DIR)) return { copied };
    if (!FileUtils.existsSync(DEER_PIPE_CONFIG_DIR)) {
        fs.mkdirSync(DEER_PIPE_CONFIG_DIR, { recursive: true });
    }
    const files = FileUtils.readDirSync(DEER_PIPE_DEFAULT_DIR) || [];
    for (const file of files) {
        if (!file || !(file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json'))) continue;
        const target = path.join(DEER_PIPE_CONFIG_DIR, file);
        if (FileUtils.existsSync(target)) continue;
        const src = path.join(DEER_PIPE_DEFAULT_DIR, file);
        if (!FileUtils.existsSync(src)) continue;
        fs.writeFileSync(target, fs.readFileSync(src, 'utf8'), 'utf8');
        copied.push(file);
    }
    return { copied };
}
