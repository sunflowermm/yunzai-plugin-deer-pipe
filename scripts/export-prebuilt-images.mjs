/**
 * 导出预渲染 PNG → assets/prebuilt/，并镜像 README 用图到 docs/images/
 * 在 XRK-Yunzai 根目录运行：
 *   node plugins/yunzai-plugin-deer-pipe/scripts/export-prebuilt-images.mjs
 */
import { writeFile, mkdir, copyFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
    PREBUILT_ROOT,
    PREBUILT_REL,
    README_IMAGE_MIRROR,
    WEATHER_PREBUILT_SLOTS,
    listPrebuiltExportTargets,
} from '../constants/prebuilt-images.js';
import { PROFESSIONS } from '../constants/profession.js';
import { WEATHER_IDS, getWeatherEffects } from '../constants/weather.js';

const PLUGIN = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS_OUT = join(PLUGIN, 'docs', 'images');

const imp = (rel) => import(pathToFileURL(join(PLUGIN, rel)).href);

const { generateHelpImages } = await imp('utils/help-render.js');
const { generateProfessionCatalogImage, generateProfessionCard } = await imp('utils/profession-render.js');
const { generateStatusImage, generateImage } = await imp('utils/core.js');
const { generateWeatherDetailImage, generateInteractionCard } = await imp('utils/card-render.js');
const {
    DAILY_SAFE_LIMIT,
    DAILY_STEAL_QUOTA,
    DAILY_CURSE_QUOTA,
    DAILY_BLESS_QUOTA,
    DAILY_CLEANSE_CURSE_QUOTA,
    DAILY_CLEANSE_BLESS_QUOTA,
    DAILY_URGE_QUOTA,
    DAILY_ARENA_QUOTA,
    DAILY_IMPERIAL_QUOTA,
    DAILY_HELP_QUOTA,
    DAILY_HELP_WITHDRAW_QUOTA,
} = await imp('constants/game.js');

async function savePrebuilt(rel, buf) {
    const abs = join(PREBUILT_ROOT, rel);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, buf);
    console.log('✓', rel);
    return rel;
}

function mockStatus(overrides = {}) {
    return {
        dead: false,
        count: 2,
        attempts: 4,
        safeLimit: DAILY_SAFE_LIMIT,
        safeLeft: 1,
        inRiskZone: false,
        inWithdrawalZone: false,
        professionRequired: false,
        professionId: 'grinder',
        professionName: '卷王鹿',
        professionEmoji: '🔥',
        professionLocked: true,
        jobSkillUsed: false,
        patrolBuffPending: false,
        balancedScore: 72,
        balancedBreakdown: '互助+擂台+天象',
        cursed: false,
        blessed: true,
        blessStacks: 1,
        blessRounds: 2,
        blessReducePct: 5,
        weather: { weatherId: 'rainbow', periodKey: 'demo:am', source: 'roll' },
        helperHelpUsed: 1,
        helperWithdrawUsed: 0,
        helperHelpLeft: DAILY_HELP_QUOTA - 1,
        helperWithdrawLeft: DAILY_HELP_WITHDRAW_QUOTA,
        helpQuotaMax: DAILY_HELP_QUOTA,
        helpWithdrawQuotaMax: DAILY_HELP_WITHDRAW_QUOTA,
        stealUsed: 1, stealMax: DAILY_STEAL_QUOTA, stealLeft: DAILY_STEAL_QUOTA - 1,
        curseUsed: 0, curseMax: DAILY_CURSE_QUOTA,
        blessUsed: 1, blessMax: DAILY_BLESS_QUOTA,
        cleanseUsed: 0, cleanseMax: DAILY_CLEANSE_CURSE_QUOTA,
        cleanseBlessUsed: 0, cleanseBlessMax: DAILY_CLEANSE_BLESS_QUOTA,
        urgeUsed: 0, urgeMax: DAILY_URGE_QUOTA,
        arenaUsed: 2, arenaMax: 8,
        imperialUsed: 0, imperialMax: 3,
        groupSplashUsed: 0, groupSplashMax: 1,
        fakeWithdrawUsed: 0, fakeWithdrawMax: 2,
        borrowUsed: 0, borrowMax: 1,
        bumperUsed: 0, bumperMax: 2,
        lotteryUsed: 1, lotteryMax: 4,
        sacrificeUsed: 0, sacrificeMax: 1,
        greedUsed: 0, greedMax: 2,
        togetherUsed: 0, togetherMax: 1,
        howlUsed: 0, howlMax: 3,
        ...overrides,
    };
}

const exported = [];

await mkdir(PREBUILT_ROOT, { recursive: true });
await mkdir(DOCS_OUT, { recursive: true });

const now = new Date();

const helpPages = await generateHelpImages();
for (let i = 0; i < helpPages.length; i += 1) {
    exported.push(await savePrebuilt(PREBUILT_REL.helpPage(i), helpPages[i]));
}

exported.push(await savePrebuilt(
    PREBUILT_REL.professionCatalog,
    await generateProfessionCatalogImage(),
));

for (const id of Object.keys(PROFESSIONS)) {
    exported.push(await savePrebuilt(
        PREBUILT_REL.professionCard(id),
        await generateProfessionCard(id),
    ));
}

for (const weatherId of WEATHER_IDS) {
    const effects = getWeatherEffects(weatherId);
    for (const slot of WEATHER_PREBUILT_SLOTS) {
        const state = { weatherId, periodKey: `demo:${slot}`, source: 'roll' };
        exported.push(await savePrebuilt(
            PREBUILT_REL.weatherDetail(weatherId, slot),
            await generateWeatherDetailImage(state, effects, now),
        ));
    }
}

const monthDemo = {
    '4': 2, '5': 6, '6': 22, '7': 21, '8': { dead: true, snap: 33 }, '9': 25,
};
exported.push(await savePrebuilt(
    PREBUILT_REL.calendarMonthDemo,
    await generateImage(new Date(2026, 5, 9), '演示群友', monthDemo, { highlightDay: 9 }),
));

/** README 专用样例（仅 docs/images，不参与运行时预渲染） */
async function saveDocs(name, buf) {
    await writeFile(join(DOCS_OUT, name), buf);
    console.log('✓ docs/images/', name);
}

await saveDocs('status-panel.png', await generateStatusImage(now, '演示群友', mockStatus()));
await saveDocs('play-steal-success.png', await generateInteractionCard({
    result: {
        type: 'steal_success',
        thiefCount: 4,
        targetCount: 2,
        stealUsed: 1,
        stealLeft: 2,
        stealMax: DAILY_STEAL_QUOTA,
    },
    helperName: '小偷甲',
    targetName: '倒霉乙',
    headline: '得手！对方 -1，你 +1',
}));
await saveDocs('play-curse.png', await generateInteractionCard({
    result: {
        type: 'curse',
        curseStacks: 2,
        curseRounds: 3,
        curseUsed: 1,
        curseLeft: 2,
        curseMax: DAILY_CURSE_QUOTA,
        bonus: 0.1,
    },
    helperName: '咒师',
    targetName: '受害者',
    headline: '叠咒成功 · 下回合继续生效',
}));

const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    files: exported,
};
const manifestRel = PREBUILT_REL.manifest;
await writeFile(join(PREBUILT_ROOT, manifestRel), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('✓', manifestRel, `(${exported.length} files)`);

for (const [srcRel, docName] of Object.entries(README_IMAGE_MIRROR)) {
    await copyFile(join(PREBUILT_ROOT, srcRel), join(DOCS_OUT, docName));
    console.log('↳ docs/images/', docName);
}

console.log('\n预渲染完成 →', PREBUILT_ROOT);
console.log('README 镜像 →', DOCS_OUT);
console.log('提交 assets/prebuilt/ 与 docs/images/ 后，Bot 将直接读 PNG，无需实时渲染上述静态图。');
