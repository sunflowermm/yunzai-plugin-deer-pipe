/**
 * 导出 README 用出图样例 → docs/images/
 * 在 XRK-Yunzai 根目录运行：node plugins/yunzai-plugin-deer-pipe/scripts/export-readme-images.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PLUGIN = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(PLUGIN, 'docs', 'images');

const imp = (rel) => import(pathToFileURL(join(PLUGIN, rel)).href);

const { generateHelpImages } = await imp('utils/help-render.js');
const { generateProfessionCatalogImage, generateProfessionCard } = await imp('utils/profession-render.js');
const { generateStatusImage } = await imp('utils/core.js');
const { generateWeatherDetailImage, generateInteractionCard } = await imp('utils/card-render.js');
const { getWeatherEffects } = await imp('constants/weather.js');
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

async function save(name, buf) {
    await writeFile(join(OUT, name), buf);
    console.log('✓', name);
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

await mkdir(OUT, { recursive: true });

const now = new Date();

const helpPages = await generateHelpImages();
await save('help-1.png', helpPages[0]);
await save('help-2.png', helpPages[1]);

await save('profession-catalog.png', await generateProfessionCatalogImage());
await save('profession-card-grinder.png', await generateProfessionCard('grinder'));
await save('profession-card-sunflower.png', await generateProfessionCard('sunflower'));
await save('profession-card-rogue.png', await generateProfessionCard('rogue'));
await save('profession-card-medic.png', await generateProfessionCard('medic'));

await save('status-panel.png', await generateStatusImage(now, '演示群友', mockStatus()));

for (const id of ['rainbow', 'storm', 'gloom', 'sunny', 'drizzle']) {
    const effects = getWeatherEffects(id);
    const state = { weatherId: id, periodKey: 'demo:am', source: 'roll' };
    await save(`weather-${id}.png`, await generateWeatherDetailImage(state, effects, now));
}

await save('play-steal-success.png', await generateInteractionCard({
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

await save('play-curse.png', await generateInteractionCard({
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

console.log('\n全部导出完成 →', OUT);
