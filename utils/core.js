import sharp from 'sharp';
import { WEATHER_CATALOG, parseWeatherPeriodSlot } from '../constants/weather.js';
import { escapeXml, truncText, svgTextStyled, svgTextPlain, hashSeed, cardSvgExtraDefs, textCentered, buildQuotaBarStack, buildLabelValueGrid, labelValueGridRowCount, wrapTextLines, TXT, TXT_SOFT, TXT_PLAIN, TXT_EMOJI } from './svg-base.js';
import {
    buildPortraitGlowSvg,
    loadCalendarDeerMark,
    loadExtraDeerArt,
    loadProfessionArt,
    loadSectionArt,
    stickerOverlay,
} from './sticker-compose.js';
import { isExtraDeerId } from '../constants/extra-deer.js';
import { compositeToPng, rasterizeDeerSvg } from './render-pipeline.js';
import { emojiSvgImage } from './emoji-compose.js';
import { CARD_FLAVOR } from '../constants/eco.js';
import {
    calcMonthStats,
    calcYearStats,
    getDayEntry,
    getDaySnap,
    getDeathReason,
    getRawDayCount,
    getYearMonths,
    isDayDead,
    normalizeDayEntry,
    sumMonthNet,
} from './data.js';
import {
    CALENDAR_TAGLINES,
    DAILY_HELP_QUOTA,
    DAILY_HELP_WITHDRAW_QUOTA,
    DAILY_SAFE_LIMIT,
    STATUS_TAGLINES,
    getDeathCellLabel,
    getDeathReasonText,
    pickRandom,
} from '../constants/game.js';
import { TRANSFER_PROFESSION_HINT } from '../constants/profession.js';
import { resolveSurfaceTheme, UI_SURFACES } from './ui/theme.js';
import {
    buildStatusHeader,
    buildStatusPanelShell,
    buildStatusStatBlock,
    buildWeatherPanel,
    buildPanelFooter,
    buildSectionHeader,
    buildCalendarBackgroundSvg,
} from './ui/components.js';
import {
    resolveCalendarPalette,
    resolveCalendarWeekHeader,
} from './ui/theme.js';
import {
    appendUiPresentationLayers,
    composeCalendarWatermark,
    statusHeaderOffset,
} from './ui/skin-assets.js';
import { overlayPlacedRect } from './ui/skin-stickers.js';
import { QUOTA, QUOTA_GROUPS, QUOTA_LABELS, quotaChipColor, resolveQuotaDenom } from '../constants/profession-quotas.js';

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const BOX_W = 100;
const BOX_H = 100;
const HEADER_H = 130;
const STATS_H = 50;
/** 月历格内鹿标高度；贴图放左下区，次数单独叠在最上层 */
const CAL_DEER_MARK_H = 28;
const CAL_DEER_MARK_LEFT = 8;
const CAL_DEER_MARK_TOP = 38;
/** 鹿况职业立绘（对齐职业卡视觉，接近专精卡 220） */
const STATUS_PORTRAIT_SIZE = 208;
const STATUS_PORTRAIT_LEFT = 24;

async function loadStatusProfessionArt(professionId, size, skinCtx) {
    const portraitSkin = skinCtx?.portrait && skinCtx.portrait !== 'default' ? skinCtx.portrait : undefined;
    const stickerOpts = { borderWidth: 0, shadow: true, fitScale: 0.92 };
    if (isExtraDeerId(professionId)) {
        return loadExtraDeerArt(professionId, size, portraitSkin, stickerOpts);
    }
    return loadProfessionArt(professionId, size, { ...stickerOpts, skinId: portraitSkin });
}

function formatDayCount(count) {
    if (count > 99) return '99+';
    if (count < -99) return '-99+';
    return String(count);
}

function buildDayCountLayer(count) {
    const display = formatDayCount(count);
    const fill = count < 0 ? '#3498db' : '#c0392b';
    return svgTextStyled(`
        <rect x="${BOX_W - 44}" y="${BOX_H - 36}" width="40" height="28" rx="7" fill="rgba(255,255,255,0.78)"/>
        <text ${TXT_PLAIN} x="${BOX_W - 10}" y="${BOX_H - 14}" font-size="20" fill="${fill}" text-anchor="end" font-weight="bold">${display}</text>
    `, BOX_W, BOX_H);
}

function getMonthCalendar(now) {
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let firstDayOfMonth = new Date(year, month, 1).getDay();
    firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const cal = [];
    let week = new Array(7).fill(null);
    let day = 1;
    for (let i = firstDayOfMonth; i < 7; i++) week[i] = day++;
    cal.push(week);
    while (day <= daysInMonth) {
        week = new Array(7).fill(null);
        for (let i = 0; i < 7 && day <= daysInMonth; i++) week[i] = day++;
        cal.push(week);
    }
    return cal;
}

function heatColor(count) {
    if (count == null || count === 0) return { r: 245, g: 247, b: 250, a: 1 };
    if (count < 0) return { r: 200, g: 230, b: 255, a: 1 };
    if (count === 1) return { r: 255, g: 230, b: 200, a: 1 };
    if (count <= 3) return { r: 255, g: 190, b: 140, a: 1 };
    if (count <= 9) return { r: 255, g: 140, b: 100, a: 1 };
    return { r: 230, g: 80, b: 80, a: 1 };
}

function ensureDate(d) {
    if (d instanceof Date && Number.isFinite(d.getTime())) return d;
    return new Date();
}

function truncName(name, max = 16) {
    return truncText(name, max);
}

function pickStatusTagline(status) {
    if (status.dead) return pickRandom(STATUS_TAGLINES.dead);
    if (status.cursed && status.blessed) return '福咒对冲，今日命格分裂';
    if (status.cursed) return pickRandom(STATUS_TAGLINES.cursed);
    if (status.blessed) return pickRandom(STATUS_TAGLINES.blessed);
    if (status.inRiskZone) return pickRandom(STATUS_TAGLINES.risk);
    if (status.inWithdrawalZone) return pickRandom(STATUS_TAGLINES.withdrawal);
    return pickRandom(STATUS_TAGLINES.safe);
}

function pickStatusFlavor(status) {
    let key = 'status_safe';
    if (status.dead) key = 'status_dead';
    else if (status.cursed && status.blessed) key = 'status_mixed';
    else if (status.cursed) key = 'status_cursed';
    else if (status.blessed) key = 'status_blessed';
    else if (status.inRiskZone) key = 'status_risk';
    else if (status.inWithdrawalZone) key = 'status_withdrawal';
    return pickRandom(CARD_FLAVOR[key] || CARD_FLAVOR.default);
}

const STATUS_PLAY_FIELDS = {
    [QUOTA.steal]: { used: 'stealUsed', max: 'stealMax' },
    [QUOTA.curse]: { used: 'curseUsed', max: 'curseMax' },
    [QUOTA.bless]: { used: 'blessUsed', max: 'blessMax' },
    [QUOTA.cleanseCurse]: { used: 'cleanseUsed', max: 'cleanseMax' },
    [QUOTA.cleanseBless]: { used: 'cleanseBlessUsed', max: 'cleanseBlessMax' },
    [QUOTA.urge]: { used: 'urgeUsed', max: 'urgeMax' },
    [QUOTA.arena]: { used: 'arenaUsed', max: 'arenaMax' },
    [QUOTA.imperial]: { used: 'imperialUsed', max: 'imperialMax' },
    [QUOTA.groupSplash]: { used: 'groupSplashUsed', max: 'groupSplashMax' },
    [QUOTA.fakeWithdraw]: { used: 'fakeWithdrawUsed', max: 'fakeWithdrawMax' },
    [QUOTA.borrow]: { used: 'borrowUsed', max: 'borrowMax' },
    [QUOTA.bumper]: { used: 'bumperUsed', max: 'bumperMax' },
    [QUOTA.lottery]: { used: 'lotteryUsed', max: 'lotteryMax' },
    [QUOTA.sacrifice]: { used: 'sacrificeUsed', max: 'sacrificeMax' },
    [QUOTA.greed]: { used: 'greedUsed', max: 'greedMax' },
    [QUOTA.together]: { used: 'togetherUsed', max: 'togetherMax' },
    [QUOTA.howl]: { used: 'howlUsed', max: 'howlMax' },
    [QUOTA.spectralCurse]: { used: 'spectralCurseUsed', max: 'spectralCurseMax' },
    [QUOTA.vengeance]: { used: 'vengeanceUsed', max: 'vengeanceMax' },
    [QUOTA.dream]: { used: 'dreamUsed', max: 'dreamMax' },
    [QUOTA.reviveLottery]: { used: 'reviveLotteryUsed', max: 'reviveLotteryMax' },
};

function buildStatusPlaySections(status, qv) {
    if (status.dead) {
        return [{
            sectionKey: 'harm',
            title: '亡魂玩法',
            items: [
                { label: '冥咒', value: qv(status.spectralCurseUsed, status.spectralCurseMax), color: '#e8b4ff' },
                { label: '索命', value: qv(status.vengeanceUsed, status.vengeanceMax), color: '#ff8888' },
                { label: '托梦', value: qv(status.dreamUsed, status.dreamMax), color: '#88c8ff' },
                { label: '还阳签', value: qv(status.reviveLotteryUsed, status.reviveLotteryMax), color: '#88ffaa' },
                { label: '鹿鸣', value: qv(status.howlUsed, status.howlMax), color: '#88ffcc' },
                { label: '鹿碑', value: '可用', color: '#cccccc' },
            ],
        }];
    }
    const sections = QUOTA_GROUPS
        .filter((g) => g.sectionKey !== 'help')
        .map((g) => ({
            title: g.title,
            sectionKey: g.sectionKey,
            items: g.ids.map((id) => {
                const fields = STATUS_PLAY_FIELDS[id];
                if (!fields) return null;
                const max = status[fields.max];
                if (max == null) return null;
                return {
                    label: QUOTA_LABELS[id] || id,
                    value: qv(status[fields.used], max),
                    color: quotaChipColor(id),
                };
            }).filter(Boolean),
        }))
        .filter((s) => s.items.length > 0);
    const last = sections[sections.length - 1];
    if (last) {
        last.items.push({
            label: '专属技',
            value: status.professionRequired
                ? '未转职'
                : (status.jobSkillUsed ? '已用' : (status.patrolBuffPending ? '巡游蓄势' : '可用')),
            color: '#ffdd88',
        });
    }
    return sections;
}

/**
 * @param {object} options highlightDay=高亮日期, forceDeadBanner=强制显示鹿死横幅, skinCtx=皮肤上下文
 */
export async function generateImage(now, name, monthData, options = {}) {
    now = ensureDate(now);
    const { highlightDay = now.getDate(), forceDeadBanner = false, skinCtx = null } = options;
    const cal = getMonthCalendar(now);
    const IMG_W = 700;
    const HEADER_H_CAL = 140;
    const IMG_H = HEADER_H_CAL + STATS_H + BOX_H + BOX_H * cal.length;
    const upToDay = now.getDate();
    const stats = calcMonthStats(monthData, upToDay);
    const todayEntry = getDayEntry(monthData, highlightDay);
    const todayDead = isDayDead(todayEntry) || forceDeadBanner;
    const todaySnap = getDaySnap(todayEntry);
    const todayReason = getDeathReason(todayEntry);
    const deerpipeSmall = await loadCalendarDeerMark(CAL_DEER_MARK_H);
    let deerMarkW = 34;
    let deerMarkH = CAL_DEER_MARK_H;
    if (deerpipeSmall) {
        try {
            const dm = await sharp(deerpipeSmall).metadata();
            deerMarkW = dm.width || deerMarkW;
            deerMarkH = dm.height || deerMarkH;
        } catch { /* keep defaults */ }
    }
    const deerOccupiedRects = [];
    const uiSkinId = skinCtx?.ui || 'default';
    const calPair = resolveCalendarPalette(uiSkinId, { dead: todayDead });
    const weekHeaderFill = resolveCalendarWeekHeader(uiSkinId);
    const calGradientStops = `<stop offset="0%" style="stop-color:${calPair[0]}"/><stop offset="100%" style="stop-color:${calPair[1]}"/>`;
    const compositeArray = [{
        input: svgTextPlain(
            buildCalendarBackgroundSvg({ width: IMG_W, height: IMG_H, gradientStops: calGradientStops }),
            IMG_W,
            IMG_H,
        ),
        top: 0,
        left: 0,
    }];
    const titleColor = todayDead ? '#ffffff' : '#2a1a10';
    const subColor = todayDead ? '#ffe8e8' : '#4a3020';
    const metaColor = todayDead ? '#ffd0d0' : '#6b4423';
    const deadBanner = todayDead
        ? ` · 💀今日鹿死（失${todaySnap}次·${getDeathReasonText(todayReason)}）`
        : '';
    compositeArray.push({
        input: svgTextStyled(`
            <text filter="url(#txtShadow)" x="20" y="42" font-size="28" font-family="FZBenMoYueYiTiS,sans-serif" fill="${titleColor}" font-weight="bold">
                ${todayDead ? '💀' : '🦌'} ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')} 鹿历
            </text>
            <text filter="url(#txtShadow)" x="20" y="78" font-size="24" font-family="FZBenMoYueYiTiS,sans-serif" fill="${subColor}">${truncName(name)}</text>
            <text filter="url(#txtShadow)" x="20" y="102" font-size="15" font-family="FZBenMoYueYiTiS,sans-serif" fill="${metaColor}" font-style="italic">${escapeXml(pickRandom(CALENDAR_TAGLINES))}</text>
            <text filter="url(#txtShadow)" x="20" y="122" font-size="16" font-family="FZBenMoYueYiTiS,sans-serif" fill="${metaColor}">
                本月净值 ${stats.total} · 活跃 ${stats.activeDays} 天 · 连击 ${stats.streak} 天
                ${stats.deathDays > 0 ? ` · 💀${stats.deathDays}天` : ''}${deadBanner}
            </text>
        `, IMG_W, HEADER_H_CAL),
        top: 0,
        left: 0,
    });
    // 星期标题
    const weekY = HEADER_H_CAL;
    for (let i = 0; i < 7; i++) {
        compositeArray.push({
            input: svgTextStyled(`
                <rect x="0" y="0" width="${BOX_W}" height="${BOX_H}" fill="${weekHeaderFill}" rx="6"/>
                <text ${TXT_PLAIN} x="${BOX_W / 2}" y="62" font-size="22" fill="#8b6914" text-anchor="middle" font-weight="bold">${WEEK_LABELS[i]}</text>
            `, BOX_W, BOX_H),
            top: weekY,
            left: i * BOX_W,
        });
    }

    for (let weekIdx = 0; weekIdx < cal.length; weekIdx++) {
        for (let dayIdx = 0; dayIdx < cal[weekIdx].length; dayIdx++) {
            const day = cal[weekIdx][dayIdx];
            const x0 = dayIdx * BOX_W;
            const y0 = HEADER_H_CAL + BOX_H + weekIdx * BOX_H;
            if (day === null) continue;
            const rawDay = monthData?.[String(day)];
            const entry = normalizeDayEntry(rawDay);
            const dead = isDayDead(rawDay);
            const count = dead ? 0 : (getRawDayCount(rawDay) ?? 0);
            const snap = getDaySnap(rawDay);
            const isHighlight = day === highlightDay;
            const reasonLabel = dead ? getDeathCellLabel(entry) : '';
            const showDeer = !dead && count > 0 && deerpipeSmall;
            const showCount = !dead && count !== 0;
            const bg = dead
                ? { r: 28, g: 22, b: 30, a: 1 }
                : heatColor(count);
            const stroke = dead
                ? (isHighlight ? '#ff4444' : '#553333')
                : (isHighlight ? '#ff9a56' : '#e8d5c4');
            const strokeW = isHighlight ? 3 : 1;
            compositeArray.push({
                input: svgTextStyled(`
                    <rect x="2" y="2" width="${BOX_W - 4}" height="${BOX_H - 4}" fill="rgb(${bg.r},${bg.g},${bg.b})" rx="8" stroke="${stroke}" stroke-width="${strokeW}"/>
                    ${dead ? `<line x1="8" y1="90" x2="${BOX_W - 8}" y2="20" stroke="#ff4444" stroke-width="2" opacity="0.5"/>` : ''}
                    <text ${TXT_PLAIN} x="10" y="28" font-size="18" fill="${dead ? '#888' : '#666'}">${day}</text>
                    ${dead ? `
                        <text ${TXT_EMOJI} x="${BOX_W / 2}" y="58" font-size="26" fill="#ff6b6b" text-anchor="middle">💀</text>
                        <text ${TXT_PLAIN} x="${BOX_W / 2}" y="82" font-size="14" fill="#ff9999" text-anchor="middle">失${snap}</text>
                        <text ${TXT_PLAIN} x="${BOX_W - 8}" y="18" font-size="12" fill="#ff7777" text-anchor="end">${reasonLabel}</text>
                    ` : ''}
                    ${showCount && !showDeer ? `<text ${TXT_PLAIN} x="${BOX_W - 8}" y="${BOX_H - 12}" font-size="20" fill="${count < 0 ? '#3498db' : '#c0392b'}" text-anchor="end" font-weight="bold">${formatDayCount(count)}</text>` : ''}
                    ${!dead && count > DAILY_SAFE_LIMIT ? `<text ${TXT_PLAIN} x="8" y="48" font-size="14" fill="#e67e22">危</text>` : ''}
                    ${!dead && count < 0 ? `<text ${TXT_PLAIN} x="8" y="48" font-size="14" fill="#3498db">戒</text>` : ''}
                    ${!dead && count === 0 && isHighlight ? `<text ${TXT_PLAIN} x="${BOX_W / 2}" y="68" font-size="14" fill="#bbb" text-anchor="middle">空</text>` : ''}
                `, BOX_W, BOX_H),
                top: y0,
                left: x0,
            });
            if (showDeer) {
                deerOccupiedRects.push({
                    left: x0 + CAL_DEER_MARK_LEFT - 4,
                    top: y0 + CAL_DEER_MARK_TOP - 4,
                    width: deerMarkW + 8,
                    height: deerMarkH + 8,
                });
                compositeArray.push({
                    input: deerpipeSmall,
                    top: y0 + CAL_DEER_MARK_TOP,
                    left: x0 + CAL_DEER_MARK_LEFT,
                });
            }
            if (showCount && showDeer) {
                compositeArray.push({
                    input: buildDayCountLayer(count),
                    top: y0,
                    left: x0,
                });
            }
        }
    }

    const calWatermark = await composeCalendarWatermark(uiSkinId, IMG_W, IMG_H);
    if (calWatermark) compositeArray.push(calWatermark);

    return compositeToPng(IMG_W, IMG_H, await appendUiPresentationLayers(compositeArray, uiSkinId, IMG_W, IMG_H, {
        chromeInsertAfter: 1,
        stickerSeed: hashSeed('cal', uiSkinId, highlightDay),
        stickerProfile: {
            placement: 'edge',
            marginTop: 4,
            marginBottom: 6,
            excludeRects: [
                { left: 84, top: 0, width: IMG_W - 168, height: HEADER_H_CAL },
                { left: 0, top: HEADER_H_CAL, width: IMG_W, height: IMG_H - HEADER_H_CAL },
            ],
            occupiedRects: deerOccupiedRects,
            edgeGutter: 0.1,
            count: 8,
        },
    }), { r: 255, g: 248, b: 240, alpha: 1 });
}

/**
 * 生成年度🦌历（12 月热力概览）
 * @param {object} [options] skinCtx
 */
export async function generateYearImage(now, name, userRecord, options = {}) {
    now = ensureDate(now);
    const uiSkinId = options.skinCtx?.ui || 'default';
    const yearTheme = resolveSurfaceTheme(uiSkinId, UI_SURFACES.CALENDAR_YEAR);
    const calPair = resolveCalendarPalette(uiSkinId, { dead: true });
    const year = now.getFullYear();
    const yearMonths = getYearMonths(userRecord, year);
    const stats = calcYearStats(userRecord, year, now);
    const COLS = 4;
    const ROWS = 3;
    const MINI_W = 160;
    const MINI_H = 130;
    const PAD = 16;
    const TITLE_H = 120;
    const IMG_W = COLS * MINI_W + (COLS + 1) * PAD;
    const IMG_H = TITLE_H + ROWS * MINI_H + (ROWS + 1) * PAD;
    const compositeArray = [{
        input: svgTextPlain(`
            <defs>
                <linearGradient id="ybg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${calPair[0]}"/>
                    <stop offset="100%" style="stop-color:${calPair[1]}"/>
                </linearGradient>
            </defs>
            <rect width="${IMG_W}" height="${IMG_H}" fill="url(#ybg)" rx="12"/>
        `, IMG_W, IMG_H),
        top: 0,
        left: 0,
    }];
    compositeArray.push({
        input: svgTextStyled(`
            <text ${TXT} x="${IMG_W / 2}" y="40" font-size="30" fill="${yearTheme.title || '#ffd700'}" text-anchor="middle" font-weight="bold">🦌 ${year} 年鹿历 🦌</text>
            <text ${TXT} x="${IMG_W / 2}" y="72" font-size="22" fill="${yearTheme.sub || '#e8e8e8'}" text-anchor="middle">${truncName(name, 20)}</text>
            <text ${TXT_SOFT} x="${IMG_W / 2}" y="102" font-size="16" fill="${yearTheme.muted || '#aaa'}" text-anchor="middle">
                全年净值 ${stats.total} · ${stats.activeDays} 活跃日 · 💀${stats.deathDays || 0}天 · 最猛 ${stats.maxMonth}月(${stats.maxMonthCount})
            </text>
        `, IMG_W, TITLE_H),
        top: 0,
        left: 0,
    });
    for (let m = 1; m <= 12; m++) {
        const col = (m - 1) % COLS;
        const row = Math.floor((m - 1) / COLS);
        const x0 = PAD + col * (MINI_W + PAD);
        const y0 = TITLE_H + PAD + row * (MINI_H + PAD);
        const monthKey = `${year}-${String(m).padStart(2, '0')}`;
        const isCurrentMonth = m === now.getMonth() + 1;
        const monthData = yearMonths[monthKey];
        const capDay = isCurrentMonth ? now.getDate() : 31;
        const total = sumMonthNet(monthData, { upToDay: capDay }).sum;
        const bg = heatColor(total > 0 ? Math.min(total, 10) : total < 0 ? -1 : 0);
        // 迷你月格子条
        const daysInMonth = new Date(year, m, 0).getDate();
        const cellW = 18;
        const cellH = 11;
        const gapX = 2;
        const gapY = 2;
        let cells = '';
        for (let d = 1; d <= daysInMonth; d++) {
            const raw = monthData?.[String(d)];
            const dead = isDayDead(raw);
            const c = dead ? 0 : (getRawDayCount(raw) ?? 0);
            const cellBg = dead ? { r: 45, g: 30, b: 35, a: 1 } : heatColor(c);
            const col = (d - 1) % 7;
            const row = Math.floor((d - 1) / 7);
            const cx = 8 + col * (cellW + gapX);
            const cy = 38 + row * (cellH + gapY);
            if (cy + cellH > MINI_H - 4) continue;
            cells += dead
                ? `<rect x="${cx}" y="${cy}" width="${cellW}" height="${cellH}" rx="2" fill="rgb(${cellBg.r},${cellBg.g},${cellBg.b})" stroke="#ff4444" stroke-width="1"/>`
                : `<rect x="${cx}" y="${cy}" width="${cellW}" height="${cellH}" rx="2" fill="rgb(${cellBg.r},${cellBg.g},${cellBg.b})"/>`;
        }

        compositeArray.push({
            input: svgTextStyled(`
                <rect x="0" y="0" width="${MINI_W}" height="${MINI_H}" fill="rgb(${bg.r},${bg.g},${bg.b})" rx="10" stroke="${isCurrentMonth ? '#ffd700' : '#444'}" stroke-width="${isCurrentMonth ? 2 : 1}"/>
                <text ${TXT_PLAIN} x="10" y="24" font-size="18" fill="#333" font-weight="bold">${m}月</text>
                <text ${TXT_PLAIN} x="${MINI_W - 10}" y="24" font-size="16" fill="${total < 0 ? '#3498db' : '#c0392b'}" text-anchor="end" font-weight="bold">${total}次</text>
                ${cells}
            `, MINI_W, MINI_H),
            top: y0,
            left: x0,
        });
    }

    const calWatermark = await composeCalendarWatermark(uiSkinId, IMG_W, IMG_H);
    if (calWatermark) compositeArray.push(calWatermark);

    return compositeToPng(IMG_W, IMG_H, await appendUiPresentationLayers(compositeArray, uiSkinId, IMG_W, IMG_H, {
        chromeInsertAfter: 1,
        stickerSeed: hashSeed('year', uiSkinId, year),
        stickerProfile: {
            placement: 'edge',
            marginTop: 4,
            marginBottom: PAD,
            excludeRects: [
                { left: 68, top: 0, width: IMG_W - 136, height: TITLE_H },
                { left: PAD, top: TITLE_H, width: IMG_W - PAD * 2, height: IMG_H - TITLE_H - PAD },
            ],
            edgeGutter: 0.1,
            count: 8,
            size: 34,
        },
    }), { r: 26, g: 26, b: 46, alpha: 1 });
}

/** 今日鹿况渲染图 */
export async function generateStatusImage(now, name, status, skinCtx = null) {
    now = ensureDate(now);
    const W = 740;
    const CX = W / 2;
    const uiSkinId = skinCtx?.ui || 'default';
    const theme = resolveSurfaceTheme(uiSkinId, UI_SURFACES.STATUS, { status });
    const dead = status.dead;
    const profHint = status.professionRequired
        ? '🎭未转职'
        : (status.professionName
            ? `${status.professionEmoji || ''}${status.professionName}${status.professionLocked ? '·已锁定' : ''}`
            : '');
    const tagline = status.professionRequired
        ? `请先转职：${TRANSFER_PROFESSION_HINT}`
        : [pickStatusTagline(status), profHint].filter(Boolean).join(' · ');
    const moodEmoji = dead ? '💀' : (status.cursed ? '☠️' : (status.blessed ? '✨' : (status.inRiskZone ? '🔥' : (status.inWithdrawalZone ? '📘' : '🦌'))));
    const safeLimit = status.safeLimit ?? DAILY_SAFE_LIMIT;
    const countText = dead
        ? `鹿死 · 丢失 ${status.lostCount}`
        : (status.inWithdrawalZone ? `戒鹿 ${status.count} 次` : `${status.count} / ${safeLimit}`);
    const riskLine = dead
        ? `死因：${status.deathReasonText || '未知'}${status.killedByName ? ` · 凶手 ${status.killedByName}` : ''}`
        : (status.inWithdrawalZone
            ? `戒鹿区 · 当月净值 ${status.monthNet ?? status.count} · 再 🦌 ${status.recoveryNeeded} 次回安全线`
            : (status.inRiskZone
                ? `高危区 · 下次自🦌 ${status.riskPercent || 0}% 鹿死`
                : `安全区 · 还可 🦌 ${status.safeLeft} 次`));
    const wx = status.weather?.weatherId
        ? (WEATHER_CATALOG[status.weather.weatherId] || WEATHER_CATALOG.sunny)
        : null;
    const periodLabel = status.weather?.periodKey
        ? parseWeatherPeriodSlot(status.weather.periodKey)
        : '';
    const weatherBody = wx
        ? `${periodLabel}${wx.name}${status.weather?.source === 'admin' ? '·赐福' : ''} · ${wx.tip}`
        : '天象：加载中…';

    const headerY0 = 44 + statusHeaderOffset(uiSkinId);
    const WEATHER_TOP = headerY0 + 64;
    const PANEL_W = W - 32;
    const WEATHER_PAD_X = 28;
    const WEATHER_EMOJI_SIZE = 30;
    const WEATHER_TEXT_X = WEATHER_PAD_X + WEATHER_EMOJI_SIZE + 12;
    const weatherTextMaxW = PANEL_W - WEATHER_TEXT_X - WEATHER_PAD_X;
    const weatherLines = wrapTextLines(weatherBody, weatherTextMaxW, 13, 3);
    const WEATHER_H = Math.max(52, 28 + weatherLines.length * 17);
    const STAT_TOP = WEATHER_TOP + WEATHER_H + 24;
    let auraLine = '';
    if (status.cursed && status.blessed) {
        auraLine = `咒 ×${status.curseStacks} · 福 ×${status.blessStacks} · 对冲中`;
    } else if (status.cursed) {
        auraLine = `咒印 ×${status.curseStacks} · 剩 ${status.curseRounds} 回合 · 叠毒 +${status.curseBonusPct}%${status.curseAscended ? ' · 天咒' : ''}`;
    } else if (status.blessed) {
        auraLine = `鹿福 ×${status.blessStacks} · 剩 ${status.blessRounds} 回合 · 减鹿死 -${status.blessReducePct}%`;
    } else if (status.urgeBuff) {
        auraLine = '被催更：下次安全自🦌 +1';
    } else {
        auraLine = '咒福：无 · 今日气运看天';
    }

    const helpUsed = status.helperHelpUsed ?? 0;
    const wdUsed = status.helperWithdrawUsed ?? 0;
    const qv = (used, max) => {
        if (!max) return '—';
        return `${used ?? 0}/${max}`;
    };
    const playSections = buildStatusPlaySections(status, qv);

    const hasProfPortrait = !status.professionRequired && !!status.professionId;
    const portraitExtra = hasProfPortrait ? Math.max(0, STATUS_PORTRAIT_SIZE - 88) : 0;
    const balancedExtra = ((status.balancedScore != null && !status.professionRequired) ? 24 : 0) + portraitExtra;
    const statCx = hasProfPortrait
        ? Math.round((STATUS_PORTRAIT_LEFT + STATUS_PORTRAIT_SIZE + 20 + W) / 2)
        : CX;
    const STATUS_SECTION_PAD = 24;
    const STATUS_SECTION_ICON = 30;
    const QUOTA_TITLE_Y = STAT_TOP + 162 + balancedExtra;
    const QUOTA_TOP = QUOTA_TITLE_Y + 20;
    const GRID_COLS = 4;
    const GRID_GAP_Y = 36;

    let playY = QUOTA_TOP + 56;
    let playSvg = '';
    const playHeaders = [];
    for (const sec of playSections) {
        const header = buildSectionHeader(playY, sec.title, theme, {
            padLeft: STATUS_SECTION_PAD, iconSize: STATUS_SECTION_ICON, fontSize: 14, fill: theme.muted,
        });
        playHeaders.push({ header, sectionKey: sec.sectionKey });
        playSvg += header.svg;
        const gridTop = playY + 22;
        playSvg += buildLabelValueGrid(sec.items, theme, gridTop, W, { cols: GRID_COLS, gapY: GRID_GAP_Y });
        const rows = labelValueGridRowCount(sec.items.length, GRID_COLS);
        playY = gridTop + rows * GRID_GAP_Y + 18;
    }
    const flavorY = playY + 24;
    const H = flavorY + 40;

    const helpMax = resolveQuotaDenom({
        used: helpUsed,
        left: status.helperHelpLeft,
        max: status.helpQuotaMax,
        fallback: DAILY_HELP_QUOTA,
    });
    const wdMax = resolveQuotaDenom({
        used: wdUsed,
        left: status.helperWithdrawLeft,
        max: status.helpWithdrawQuotaMax,
        fallback: DAILY_HELP_WITHDRAW_QUOTA,
    });
    const quotaSvg = buildQuotaBarStack(CX, QUOTA_TOP, [
        { label: '帮鹿', used: helpUsed, total: helpMax, color: '#e67e22' },
        { label: '帮戒', used: wdUsed, total: wdMax, color: '#3498db' },
    ], theme);

    const auraFill = status.cursed ? '#f0d0ff' : (status.blessed ? '#d0ffd8' : theme.line);
    const flavorLine = pickStatusFlavor(status);
    const decoSeed = hashSeed(name, now.toDateString(), status.count, dead);
    const dateMeta = `${now.getMonth() + 1}/${now.getDate()} · deer-pipe`;

    const helpHeader = buildSectionHeader(QUOTA_TITLE_Y, '互助配额', theme, {
        padLeft: STATUS_SECTION_PAD, iconSize: STATUS_SECTION_ICON, fontSize: 14, fill: theme.muted,
    });

    const weatherEmojiCx = WEATHER_PAD_X + WEATHER_EMOJI_SIZE / 2;
    const weatherEmojiCy = WEATHER_TOP + WEATHER_H / 2;
    const portraitTop = STAT_TOP + 6;
    const portraitCy = portraitTop + STATUS_PORTRAIT_SIZE / 2;
    const balancedLine = (status.balancedScore != null && !status.professionRequired)
        ? textCentered(statCx, STAT_TOP + 114, `综合 ${status.balancedScore} 分 · ${escapeXml(truncText(status.balancedBreakdown || '', 40))}`, TXT_SOFT, { size: 13, fill: '#c9782a' })
        : '';

    const [profThumb, helpIcon, weatherEmojiSvg, ...playIcons] = await Promise.all([
        hasProfPortrait
            ? loadStatusProfessionArt(status.professionId, STATUS_PORTRAIT_SIZE, skinCtx)
            : null,
        loadSectionArt('help', STATUS_SECTION_ICON),
        wx ? emojiSvgImage(weatherEmojiCx, weatherEmojiCy, wx.emoji, WEATHER_EMOJI_SIZE) : Promise.resolve(''),
        ...playHeaders.map(({ sectionKey }) => loadSectionArt(sectionKey, STATUS_SECTION_ICON)),
    ]);

    const innerSvg = `
        ${buildStatusHeader({ cx: CX, theme, name, tagline, y0: headerY0 })}
        ${buildWeatherPanel({
            width: W,
            top: WEATHER_TOP,
            height: WEATHER_H,
            theme,
            weatherLines,
            weatherEmojiSvg,
            textX: WEATHER_TEXT_X,
        })}
        ${hasProfPortrait ? buildPortraitGlowSvg(STATUS_PORTRAIT_LEFT + STATUS_PORTRAIT_SIZE / 2, portraitCy, STATUS_PORTRAIT_SIZE) : ''}
        ${buildStatusStatBlock({
            cx: statCx,
            statTop: STAT_TOP,
            theme: { ...theme, auraFill },
            moodEmoji,
            countText,
            attemptsLine: `尝试 ${status.attempts} 次`,
            riskLine,
            auraLine,
            balancedLine,
        })}
        ${helpHeader.svg}
        ${quotaSvg}
        ${playSvg}
        ${buildPanelFooter(W, flavorY, `${flavorLine} · ${dateMeta}`, theme, 56)}
    `;

    const svg = buildStatusPanelShell({
        width: W,
        height: H,
        theme,
        uiSkinId,
        seed: decoSeed,
        innerSvg,
    });
    const layers = [{
        input: rasterizeDeerSvg(svgTextStyled(svg, W, H, `<linearGradient id="sbg" x1="0%" y1="0%" x2="100%" y2="100%">${theme.bgStops}</linearGradient>${cardSvgExtraDefs(theme)}`)),
        top: 0,
        left: 0,
    }];
    const thumbOverlay = profThumb
        ? stickerOverlay(profThumb, portraitTop, STATUS_PORTRAIT_LEFT)
        : null;
    if (thumbOverlay) layers.push(thumbOverlay);
    if (helpIcon) layers.push(stickerOverlay(helpIcon, helpHeader.slot.top, helpHeader.slot.left));
    playHeaders.forEach(({ header }, i) => {
        const icon = playIcons[i];
        if (icon) layers.push(stickerOverlay(icon, header.slot.top, header.slot.left));
    });
    const occupiedRects = [];
    if (thumbOverlay) {
        const r = await overlayPlacedRect(thumbOverlay, 10);
        if (r) occupiedRects.push(r);
    }
    return compositeToPng(W, H, await appendUiPresentationLayers(layers, uiSkinId, W, H, {
        stickerSeed: decoSeed,
        stickerProfile: { occupiedRects },
    }));
}
