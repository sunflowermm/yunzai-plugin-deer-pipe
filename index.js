import fs from "node:fs";
import path from "path";
import config from "./model/config.js";
import hub from "./lib/deer-hub.js";
import { verifyArtManifest } from "./constants/deer-assets.js";
import { verifyPrebuiltManifest, warmPrebuiltCache } from "./utils/prebuilt-images.js";

hub.startWatch();
if (!global.segment) {
    global.segment = (await import("oicq")).segment
}

// 加载版本号
const versionData = config.getConfig("version");
// 加载名称
const packageJsonPath = path.join('./plugins', 'yunzai-plugin-deer-pipe', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const pluginName = packageJson.name;
// 初始化输出
logger.info(logger.yellow(`🦌管插件（yunzai-plugin-deer-pipe）：${versionData[0].version}初始化，欢迎加入【R插件和它的朋友们】秋秋群：575663150`));

const missingArt = verifyArtManifest();
if (missingArt.length) {
    logger.warn(`[deer-pipe] 贴图缺失 ${missingArt.length} 项：${missingArt.join(' · ')}`);
}

const missingPrebuilt = verifyPrebuiltManifest();
if (missingPrebuilt.length) {
    logger.warn(`[deer-pipe] 预渲染 PNG 缺失 ${missingPrebuilt.length} 项（将回退实时渲染）：${missingPrebuilt.slice(0, 5).join(' · ')}${missingPrebuilt.length > 5 ? ' …' : ''}`);
    logger.warn('[deer-pipe] 预渲染 PNG 缺失：请拉取仓库内 assets/prebuilt/ 成品，或联系维护者更新');
} else {
    const warmed = warmPrebuiltCache();
    if (warmed > 0) {
        logger.info(`[deer-pipe] 预渲染 PNG 已预热 ${warmed} 张（帮助/职业一览）`);
    }
}

const files = fs.readdirSync(`./plugins/${pluginName}/apps`).filter(file => file.endsWith(".js"));

let ret = [];

files.forEach(file => {
    ret.push(import(`./apps/${file}`));
});

ret = await Promise.allSettled(ret);

let apps = {};
for (let i in files) {
    let name = files[i].replace(".js", "");
    if (ret[i].status !== "fulfilled") {
        logger.error(`载入插件错误：${logger.red(name)}`);
        logger.error(ret[i].reason);
        continue;
    }
    apps[name] = ret[i].value[Object.keys(ret[i].value)[0]];
}
export { apps };
