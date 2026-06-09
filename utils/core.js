import { WEATHER_CATALOG, parseWeatherPeriodSlot } from '../constants/weather.js';
import { escapeXml, truncText, svgTextStyled, svgTextPlain, buildCardDecorations, hashSeed, cardSvgExtraDefs, textCentered, textCenteredEmoji, buildFooterBar, buildCenteredPanel, buildQuotaBarStack, buildLabelValueGrid, labelValueGridRowCount, buildSectionTitle, buildCenteredEmojiLine, TXT, TXT_SOFT } from './svg-base.js';
import { loadCalendarDeerMark, loadCheckMark, loadProfessionArt, loadSectionArt, loadSkillArt, stickerOverlay } from './sticker-compose.js';
import { compositeToPng } from './render-pipeline.js';
import { CARD_FLAVOR } from '../constants/eco.js';
import {
    calcMonthStats,
    calcYearStats,
    getDayEntry,
    getDaySnap,
    getDeathKillerId,
    getDeathReason,
    getEffectiveCount,
    getRawDayCount,
    getYearMonths,
    isDayDead,
    normalizeDayEntry,
    sumMonthData,
    sumMonthNet,
} from './data.js';
import {
    CALENDAR_TAGLINES,
    DAILY_ARENA_QUOTA,
    DAILY_CLEANSE_CURSE_QUOTA,
    DAILY_CURSE_QUOTA,
    DAILY_FAKE_WITHDRAW_QUOTA,
    DAILY_GROUP_SPLASH_QUOTA,
    DAILY_HELP_QUOTA,
    DAILY_HELP_WITHDRAW_QUOTA,
    DAILY_HOWL_QUOTA,
    DAILY_IMPERIAL_QUOTA,
    DAILY_SAFE_LIMIT,
    DAILY_STEAL_QUOTA,
    DAILY_URGE_QUOTA,
    DAILY_SPECTRAL_CURSE_QUOTA,
    DAILY_VENGEANCE_QUOTA,
    DAILY_DREAM_QUOTA,
    DAILY_REVIVE_LOTTERY_QUOTA,
    DAILY_BLESS_QUOTA,
    DAILY_CLEANSE_BLESS_QUOTA,
    DAILY_BORROW_QUOTA,
    DAILY_BUMPER_QUOTA,
    DAILY_LOTTERY_QUOTA,
    STATUS_TAGLINES,
    getDeathCellLabel,
    getDeathReasonText,
    pickRandom,
} from '../constants/game.js';

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const BOX_W = 100;
const BOX_H = 100;
const HEADER_H = 130;
const STATS_H = 50;

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

function statusTheme(status) {
    const { dead, cursed, blessed, inRiskZone, inWithdrawalZone } = status;
    if (dead) {
        return {
            bgStops: '<stop offset="0%" style="stop-color:#1a0a0a"/><stop offset="100%" style="stop-color:#0d0404"/>',
            title: '#ffffff',
            sub: '#ffe4e4',
            line: '#fff8f8',
            muted: '#ffcaca',
            accent: '#ff7070',
            barBg: '#4a2828',
            panel: 'rgba(0,0,0,0.55)',
            highlight: 'rgba(255,112,112,0.18)',
        };
    }
    if (cursed) {
        return {
            bgStops: '<stop offset="0%" style="stop-color:#1f1230"/><stop offset="100%" style="stop-color:#120a1c"/>',
            title: '#f5ebff',
            sub: '#e8d4ff',
            line: '#faf5ff',
            muted: '#d4b8ff',
            accent: '#c39bff',
            barBg: '#3d2a55',
            panel: 'rgba(0,0,0,0.4)',
            highlight: 'rgba(195,155,255,0.2)',
        };
    }
    if (blessed) {
        return {
            bgStops: '<stop offset="0%" style="stop-color:#1a2818"/><stop offset="100%" style="stop-color:#0f1a0d"/>',
            title: '#f0fff0',
            sub: '#d8ffd8',
            line: '#f5fff5',
            muted: '#b8f0b8',
            accent: '#7dffb0',
            barBg: '#2a4030',
            panel: 'rgba(0,0,0,0.35)',
            highlight: 'rgba(125,255,176,0.15)',
        };
    }
    if (inRiskZone) {
        return {
            bgStops: '<stop offset="0%" style="stop-color:#3d2818"/><stop offset="100%" style="stop-color:#2a1508"/>',
            title: '#fff5eb',
            sub: '#ffe0c8',
            line: '#fffaf5',
            muted: '#ffcc99',
            accent: '#ff9a56',
            barBg: '#5c4030',
            panel: 'rgba(0,0,0,0.35)',
            highlight: 'rgba(255,154,86,0.18)',
        };
    }
    if (inWithdrawalZone) {
        return {
            bgStops: '<stop offset="0%" style="stop-color:#e8f4fc"/><stop offset="100%" style="stop-color:#d0e8f8"/>',
            title: '#1a5276',
            sub: '#2874a6',
            line: '#154360',
            muted: '#5dade2',
            accent: '#3498db',
            barBg: '#aed6f1',
            panel: 'rgba(255,255,255,0.55)',
            highlight: 'rgba(52,152,219,0.15)',
        };
    }
    return {
        bgStops: '<stop offset="0%" style="stop-color:#fff8f0"/><stop offset="100%" style="stop-color:#ffe8d6"/>',
        title: '#3d2818',
        sub: '#5c3d2e',
        line: '#2a1a10',
        muted: '#7a4e32',
        accent: '#e67e22',
        barBg: '#e8d5c4',
        panel: 'rgba(255,255,255,0.55)',
        highlight: 'rgba(230,126,34,0.12)',
    };
}

const svgText = svgTextPlain;

/**
 * @param {object} options highlightDay=高亮日期, forceDeadBanner=强制显示鹿死横幅
 */
export async function generateImage(now, name, monthData, options = {}) {
    now = ensureDate(now);
    const { highlightDay = now.getDate(), forceDeadBanner = false } = options;
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
    const deerpipeSmall = await loadCalendarDeerMark(48);
    const checkSmall = await loadCheckMark(36);
    const compositeArray = [{
        input: svgText(`
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    ${todayDead
                        ? `<stop offset="0%" style="stop-color:#2d1b1b"/><stop offset="100%" style="stop-color:#1a0a0a"/>`
                        : `<stop offset="0%" style="stop-color:#fff8f0"/><stop offset="100%" style="stop-color:#ffe8d6"/>`}
                </linearGradient>
            </defs>
            <rect width="${IMG_W}" height="${IMG_H}" fill="url(#bg)"/>
        `, IMG_W, IMG_H),
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
            <text filter="url(#txtShadow)" x="20" y="42" font-size="28" font-family="MiSans,sans-serif" fill="${titleColor}" font-weight="bold">
                ${todayDead ? '💀' : '🦌'} ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')} 鹿历
            </text>
            <text filter="url(#txtShadow)" x="20" y="78" font-size="24" font-family="MiSans,sans-serif" fill="${subColor}">${truncName(name)}</text>
            <text filter="url(#txtShadow)" x="20" y="102" font-size="15" font-family="MiSans,sans-serif" fill="${metaColor}" font-style="italic">${escapeXml(pickRandom(CALENDAR_TAGLINES))}</text>
            <text filter="url(#txtShadow)" x="20" y="122" font-size="16" font-family="MiSans,sans-serif" fill="${metaColor}">
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
            input: svgText(`
                <rect x="0" y="0" width="${BOX_W}" height="${BOX_H}" fill="#f0e6dc" rx="6"/>
                <text x="${BOX_W / 2}" y="62" font-size="22" font-family="MiSans" fill="#8b6914" text-anchor="middle" font-weight="bold">${WEEK_LABELS[i]}</text>
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
            const bg = dead
                ? { r: 28, g: 22, b: 30, a: 1 }
                : heatColor(count);
            const stroke = dead
                ? (isHighlight ? '#ff4444' : '#553333')
                : (isHighlight ? '#ff9a56' : '#e8d5c4');
            const strokeW = isHighlight ? 3 : 1;
            compositeArray.push({
                input: svgText(`
                    <rect x="2" y="2" width="${BOX_W - 4}" height="${BOX_H - 4}" fill="rgb(${bg.r},${bg.g},${bg.b})" rx="8" stroke="${stroke}" stroke-width="${strokeW}"/>
                    ${dead ? `<line x1="8" y1="90" x2="${BOX_W - 8}" y2="20" stroke="#ff4444" stroke-width="2" opacity="0.5"/>` : ''}
                    <text x="10" y="28" font-size="18" font-family="MiSans" fill="${dead ? '#888' : '#666'}">${day}</text>
                    ${dead ? `
                        <text x="${BOX_W / 2}" y="58" font-size="26" font-family="MiSans" fill="#ff6b6b" text-anchor="middle">💀</text>
                        <text x="${BOX_W / 2}" y="82" font-size="14" font-family="MiSans" fill="#ff9999" text-anchor="middle">失${snap}</text>
                        <text x="${BOX_W - 8}" y="18" font-size="12" font-family="MiSans" fill="#ff7777" text-anchor="end">${reasonLabel}</text>
                    ` : ''}
                    ${!dead && count !== 0 ? `<text x="${BOX_W - 8}" y="${BOX_H - 12}" font-size="20" font-family="MiSans" fill="${count < 0 ? '#3498db' : '#c0392b'}" text-anchor="end" font-weight="bold">${count > 99 ? '99+' : count < -99 ? '-99+' : count}</text>` : ''}
                    ${!dead && count > DAILY_SAFE_LIMIT ? `<text x="8" y="48" font-size="14" font-family="MiSans" fill="#e67e22">危</text>` : ''}
                    ${!dead && count < 0 ? `<text x="8" y="48" font-size="14" font-family="MiSans" fill="#3498db">戒</text>` : ''}
                    ${!dead && count === 0 && isHighlight ? `<text x="${BOX_W / 2}" y="68" font-size="14" font-family="MiSans" fill="#bbb" text-anchor="middle">空</text>` : ''}
                `, BOX_W, BOX_H),
                top: y0,
                left: x0,
            });
            if (!dead && count > 0 && deerpipeSmall) {
                compositeArray.push({
                    input: deerpipeSmall,
                    top: y0 + 30,
                    left: x0 + 26,
                });
            }
            if (!dead && count > 0 && checkSmall) {
                compositeArray.push({
                    input: checkSmall,
                    top: y0 + 28,
                    left: x0 + 32,
                });
            }
        }
    }

    return compositeToPng(IMG_W, IMG_H, compositeArray, { r: 255, g: 248, b: 240, alpha: 1 });
}

/**
 * 生成年度🦌历（12 月热力概览）
 */
export async function generateYearImage(now, name, userRecord) {
    now = ensureDate(now);
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
        input: svgText(`
            <defs>
                <linearGradient id="ybg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#1a1a2e"/>
                    <stop offset="50%" style="stop-color:#16213e"/>
                    <stop offset="100%" style="stop-color:#0f3460"/>
                </linearGradient>
            </defs>
            <rect width="${IMG_W}" height="${IMG_H}" fill="url(#ybg)" rx="12"/>
        `, IMG_W, IMG_H),
        top: 0,
        left: 0,
    }];
    compositeArray.push({
        input: svgText(`
            <text x="${IMG_W / 2}" y="40" font-size="30" font-family="MiSans" fill="#ffd700" text-anchor="middle" font-weight="bold">🦌 ${year} 年鹿历 🦌</text>
            <text x="${IMG_W / 2}" y="72" font-size="22" font-family="MiSans" fill="#e8e8e8" text-anchor="middle">${truncName(name, 20)}</text>
            <text x="${IMG_W / 2}" y="102" font-size="16" font-family="MiSans" fill="#aaa" text-anchor="middle">
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
            input: svgText(`
                <rect x="0" y="0" width="${MINI_W}" height="${MINI_H}" fill="rgb(${bg.r},${bg.g},${bg.b})" rx="10" stroke="${isCurrentMonth ? '#ffd700' : '#444'}" stroke-width="${isCurrentMonth ? 2 : 1}"/>
                <text x="10" y="24" font-size="18" font-family="MiSans" fill="#333" font-weight="bold">${m}月</text>
                <text x="${MINI_W - 10}" y="24" font-size="16" font-family="MiSans" fill="${total < 0 ? '#3498db' : '#c0392b'}" text-anchor="end" font-weight="bold">${total}次</text>
                ${cells}
            `, MINI_W, MINI_H),
            top: y0,
            left: x0,
        });
    }

    return compositeToPng(IMG_W, IMG_H, compositeArray, { r: 26, g: 26, b: 46, alpha: 1 });
}

/** 今日鹿况渲染图 */
export async function generateStatusImage(now, name, status) {
    now = ensureDate(now);
    const W = 740;
    const CX = W / 2;
    const theme = statusTheme(status);
    const dead = status.dead;
    const profHint = status.professionRequired
        ? '🎭未转职'
        : (status.professionName
            ? `${status.professionEmoji || ''}${status.professionName}${status.professionLocked ? '·已锁定' : ''}`
            : '');
    const tagline = status.professionRequired
        ? '请先转职：转职鹿医师 / 转职戒师 / 转职卷王 / 转职巡游 等'
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
    const weatherText = wx
        ? `${periodLabel}${wx.name}${status.weather?.source === 'admin' ? '·赐福' : ''} · ${wx.tip}`
        : '天象：加载中…';
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
    const gridItems = dead ? [
        { label: '冥咒', value: qv(status.spectralCurseUsed, status.spectralCurseMax), color: '#e8b4ff' },
        { label: '索命', value: qv(status.vengeanceUsed, status.vengeanceMax), color: '#ff8888' },
        { label: '托梦', value: qv(status.dreamUsed, status.dreamMax), color: '#88c8ff' },
        { label: '还阳签', value: qv(status.reviveLotteryUsed, status.reviveLotteryMax), color: '#88ffaa' },
        { label: '鹿鸣', value: qv(status.howlUsed, status.howlMax), color: '#88ffcc' },
        { label: '鹿碑', value: '可用', color: '#cccccc' },
    ] : [
        { label: '偷鹿', value: qv(status.stealUsed, status.stealMax), color: '#ffb347' },
        { label: '鹿咒', value: qv(status.curseUsed, status.curseMax), color: '#d4a5ff' },
        { label: '鹿福', value: qv(status.blessUsed, status.blessMax), color: '#7dffb0' },
        { label: '解咒', value: qv(status.cleanseUsed, status.cleanseMax), color: '#88ffaa' },
        { label: '解福', value: qv(status.cleanseBlessUsed, status.cleanseBlessMax), color: '#aaffcc' },
        { label: '催鹿', value: qv(status.urgeUsed, status.urgeMax), color: '#88c8ff' },
        { label: '擂台', value: qv(status.arenaUsed, status.arenaMax), color: '#ff8888' },
        { label: '皇城', value: qv(status.imperialUsed, status.imperialMax), color: '#ffd700' },
        { label: '群溅', value: qv(status.groupSplashUsed, status.groupSplashMax), color: '#66ddcc' },
        { label: '诈戒', value: qv(status.fakeWithdrawUsed, status.fakeWithdrawMax), color: '#cc99ff' },
        { label: '借鹿', value: qv(status.borrowUsed, status.borrowMax), color: '#ffcc88' },
        { label: '碰瓷', value: qv(status.bumperUsed, status.bumperMax), color: '#ffaa88' },
        { label: '鹿签', value: qv(status.lotteryUsed, status.lotteryMax), color: '#ffee88' },
        { label: '献祭', value: qv(status.sacrificeUsed, status.sacrificeMax), color: '#ff9966' },
        { label: '倒贴', value: qv(status.greedUsed, status.greedMax), color: '#ff7788' },
        { label: '同归', value: qv(status.togetherUsed, status.togetherMax), color: '#88ddff' },
        { label: '鹿鸣', value: qv(status.howlUsed, status.howlMax), color: '#88ffaa' },
        {
            label: '专属技',
            value: status.professionRequired
                ? '未转职'
                : (status.jobSkillUsed ? '已用' : (status.patrolBuffPending ? '巡游蓄势' : '可用')),
            color: '#ffdd88',
        },
    ];

    const WEATHER_TOP = 108;
    const WEATHER_H = 40;
    const PANEL_W = W - 32;
    const STAT_TOP = WEATHER_TOP + WEATHER_H + 24;
    const balancedExtra = (status.balancedScore != null && !status.professionRequired) ? 24 : 0;
    const QUOTA_TITLE_Y = STAT_TOP + 162 + balancedExtra;
    const QUOTA_TOP = QUOTA_TITLE_Y + 20;
    const GRID_TITLE_Y = QUOTA_TOP + 56;
    const GRID_COLS = 4;
    const GRID_GAP_Y = 36;
    const gridRows = labelValueGridRowCount(gridItems.length, GRID_COLS);
    const gridTop = GRID_TITLE_Y + 20;
    const flavorY = gridTop + gridRows * GRID_GAP_Y + 24;
    const H = flavorY + 40;

    const helpMax = status.helpQuotaMax ?? DAILY_HELP_QUOTA;
    const wdMax = status.helpWithdrawQuotaMax ?? DAILY_HELP_WITHDRAW_QUOTA;
    const quotaSvg = buildQuotaBarStack(CX, QUOTA_TOP, [
        { label: '帮鹿', used: helpUsed, total: helpMax, color: '#e67e22' },
        { label: '帮戒', used: wdUsed, total: wdMax, color: '#3498db' },
    ], theme);
    const gridSvg = buildLabelValueGrid(gridItems, theme, gridTop, W, { cols: GRID_COLS, gapY: GRID_GAP_Y });

    const auraFill = status.cursed ? '#f0d0ff' : (status.blessed ? '#d0ffd8' : theme.line);
    const flavorLine = pickStatusFlavor(status);
    const decoSeed = hashSeed(name, now.toDateString(), status.count, dead);
    const dateMeta = `${now.getMonth() + 1}/${now.getDate()} · deer-pipe`;

    const [profThumb, helpIcon, harmIcon, pvpIcon, skillIcon] = await Promise.all([
        (!status.professionRequired && status.professionId)
            ? loadProfessionArt(status.professionId, 76, { borderWidth: 2, radius: 12 })
            : null,
        loadSectionArt('help', 30),
        loadSectionArt('harm', 30),
        loadSectionArt('pvp', 30),
        (!status.professionRequired && status.professionId)
            ? loadSkillArt(status.professionId, 32)
            : null,
    ]);

    const svg = `
        <rect width="${W}" height="${H}" rx="16" fill="url(#sbg)"/>
        ${buildCardDecorations(W, H, theme, decoSeed)}
        ${textCentered(CX, 44, '今日鹿况', TXT, { size: 28, fill: theme.title, weight: 'bold' })}
        ${textCentered(CX, 72, truncName(name, 18), TXT, { size: 20, fill: theme.sub })}
        ${textCentered(CX, 94, escapeXml(tagline), TXT_SOFT, { size: 13, fill: theme.muted, italic: true })}
        ${buildCenteredPanel(CX, WEATHER_TOP, PANEL_W, WEATHER_H, theme)}
        ${buildCenteredEmojiLine(CX, WEATHER_TOP + 26, wx?.emoji, weatherText, theme, 44)}
        ${textCenteredEmoji(CX, STAT_TOP + 28, moodEmoji, { size: 36 })}
        ${textCentered(CX, STAT_TOP + 68, escapeXml(countText), TXT, { size: 30, fill: theme.title, weight: 'bold' })}
        ${textCentered(CX, STAT_TOP + 94, `尝试 ${status.attempts} 次`, TXT_SOFT, { size: 15, fill: theme.sub })}
        ${status.balancedScore != null && !status.professionRequired ? textCentered(CX, STAT_TOP + 114, `综合 ${status.balancedScore} 分 · ${escapeXml(truncText(status.balancedBreakdown || '', 40))}`, TXT_SOFT, { size: 13, fill: '#c9782a' }) : ''}
        ${textCentered(CX, STAT_TOP + (status.balancedScore != null && !status.professionRequired ? 134 : 114), truncText(riskLine, 52), TXT_SOFT, { size: 14, fill: theme.line })}
        ${textCentered(CX, STAT_TOP + (status.balancedScore != null && !status.professionRequired ? 158 : 138), escapeXml(auraLine), TXT_SOFT, { size: 14, fill: auraFill })}
        ${buildSectionTitle(CX, QUOTA_TITLE_Y, '互助配额', theme)}
        ${quotaSvg}
        ${buildSectionTitle(CX, GRID_TITLE_Y, '玩法配额', theme)}
        ${gridSvg}
        ${buildFooterBar(W, flavorY, `${flavorLine} · ${dateMeta}`, theme, 56)}
    `;
    const layers = [{
        input: svgTextStyled(svg, W, H, `<linearGradient id="sbg" x1="0%" y1="0%" x2="100%" y2="100%">${theme.bgStops}</linearGradient>${cardSvgExtraDefs(theme)}`),
        top: 0,
        left: 0,
    }];
    const thumbOverlay = profThumb ? stickerOverlay(profThumb, 28, W - 100) : null;
    if (thumbOverlay) layers.push(thumbOverlay);
    const helpTitleOverlay = helpIcon ? stickerOverlay(helpIcon, QUOTA_TITLE_Y - 22, 28) : null;
    if (helpTitleOverlay) layers.push(helpTitleOverlay);
    const playTitleOverlay = harmIcon ? stickerOverlay(harmIcon, GRID_TITLE_Y - 22, 28) : null;
    if (playTitleOverlay) layers.push(playTitleOverlay);
    const pvpTitleOverlay = pvpIcon ? stickerOverlay(pvpIcon, GRID_TITLE_Y - 22, 68) : null;
    if (pvpTitleOverlay) layers.push(pvpTitleOverlay);
    const skillOverlay = skillIcon ? stickerOverlay(skillIcon, gridTop + gridRows * GRID_GAP_Y - 8, W - 72) : null;
    if (skillOverlay) layers.push(skillOverlay);
    return compositeToPng(W, H, layers);
}
