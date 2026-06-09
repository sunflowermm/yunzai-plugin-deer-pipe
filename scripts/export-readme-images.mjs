/**
 * @deprecated 请使用 export-prebuilt-images.mjs
 * 在 XRK-Yunzai 根目录运行：node plugins/yunzai-plugin-deer-pipe/scripts/export-prebuilt-images.mjs
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const script = join(dirname(fileURLToPath(import.meta.url)), 'export-prebuilt-images.mjs');
const r = spawnSync(process.execPath, [script], { stdio: 'inherit', cwd: process.cwd() });
process.exit(r.status ?? 1);
