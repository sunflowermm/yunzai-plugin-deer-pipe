import sharp from 'sharp';
import fs from 'fs';
import { pathToFileURL } from 'node:url';
import { CHECK_IMG, DEERPIPE_IMG, MISANS_FONT } from '../constants/core.js';
import { WEATHER_CMD_HINT } from '../constants/commands.js';
import { WEATHER_CATALOG, parseWeatherPeriodSlot } from '../constants/weather.js';
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

function escapeXml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function ensureDate(d) {
    if (d instanceof Date && Number.isFinite(d.getTime())) return d;
    return new Date();
}

function truncName(name, max = 16) {
    const s = String(name ?? '鹿友');
    return escapeXml(s.length > max ? `${s.slice(0, max)}…` : s);
}

function pickStatusTagline(status) {
    if (status.dead) return pickRandom(STATUS_TAGLINES.dead);
    if (status.cursed && status.blessed) return '福咒对冲，今日命格分裂';
    if (status.cursed) return pickRandom(STATUS_TAGLINES.cursed);
    if (status.blessed) return pickRandom(STATUS_TAGLINES.blessed);
    if (status.inRiskZone) return pickRandom(STATUS_TAGLINES.risk);
    return pickRandom(STATUS_TAGLINES.safe);
}

function statusTheme(status) {
    const { dead, cursed, blessed, inRiskZone } = status;
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
    };
}

function svgFontFace() {
    const uri = pathToFileURL(MISANS_FONT).href;
    return `@font-face{font-family:'MiSans';src:url('${uri}') format('truetype');}`;
}

function svgTextStyled(content, width, height, extra = '') {
    return Buffer.from(
        `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="txtShadow" x="-8%" y="-8%" width="116%" height="116%">
                    <feDropShadow dx="0" dy="1.2" stdDeviation="2.2" flood-color="#000" flood-opacity="0.75"/>
                </filter>
                <style>${svgFontFace()}</style>
                ${extra}
            </defs>
            ${content}
        </svg>`,
    );
}

function quotaBar(used, total, width = 200) {
    const t = Math.max(1, total);
    const u = Math.min(used, t);
    const fill = Math.round((u / t) * width);
    return { fill, width, label: `${u}/${t}` };
}

function svgText(content, width, height, extra = '') {
    return Buffer.from(
        `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${extra}${content}</svg>`
    );
}

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
    const deerpipeBuffer = fs.readFileSync(DEERPIPE_IMG);
    const checkBuffer = fs.readFileSync(CHECK_IMG);

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
                本月 ${stats.total} 次 · 活跃 ${stats.activeDays} 天 · 连击 ${stats.streak} 天
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

    const deerpipeSmall = await sharp(deerpipeBuffer).resize(48, 40).png().toBuffer();
    const checkSmall = await sharp(checkBuffer).resize(36, 38).png().toBuffer();

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

            if (!dead && count > 0) {
                compositeArray.push({
                    input: deerpipeSmall,
                    top: y0 + 30,
                    left: x0 + 26,
                });
                compositeArray.push({
                    input: checkSmall,
                    top: y0 + 28,
                    left: x0 + 32,
                });
            }
        }
    }

    return sharp({
        create: { width: IMG_W, height: IMG_H, channels: 4, background: { r: 255, g: 248, b: 240, alpha: 1 } },
    })
        .composite(compositeArray)
        .png()
        .toBuffer();
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
                全年 ${stats.total} 次 · ${stats.activeDays} 活跃日 · 💀${stats.deathDays || 0}天 · 最猛 ${stats.maxMonth}月(${stats.maxMonthCount}次)
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
        const monthData = yearMonths[monthKey];
        const total = sumMonthData(monthData);
        const bg = heatColor(total > 0 ? Math.min(total, 10) : total < 0 ? -1 : 0);
        const isCurrentMonth = m === now.getMonth() + 1;

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

    return sharp({
        create: { width: IMG_W, height: IMG_H, channels: 4, background: { r: 26, g: 26, b: 46, alpha: 1 } },
    })
        .composite(compositeArray)
        .png()
        .toBuffer();
}

/** 今日鹿况渲染图 */
export async function generateStatusImage(now, name, status) {
    now = ensureDate(now);
    const W = 740;
    const H = 680;
    const theme = statusTheme(status);
    const dead = status.dead;
    const tagline = pickStatusTagline(status);
    const moodEmoji = dead ? '💀' : (status.cursed ? '☠️' : (status.blessed ? '✨' : (status.inRiskZone ? '🔥' : '🦌')));
    const safeLimit = status.safeLimit ?? DAILY_SAFE_LIMIT;
    const countText = dead ? `鹿死 · 丢失 ${status.lostCount}` : `${status.count} / ${safeLimit}`;
    const riskLine = dead
        ? `死因：${escapeXml(status.deathReasonText || '未知')}${status.killedByName ? ` · 凶手 ${escapeXml(status.killedByName)}` : ''}`
        : (status.inRiskZone
            ? `⚠️ 高危区 · 下次自🦌 ${status.riskPercent || 0}% 鹿死`
            : `✅ 安全区 · 还可 🦌 ${status.safeLeft} 次`);

    const wx = status.weather?.weatherId
        ? (WEATHER_CATALOG[status.weather.weatherId] || WEATHER_CATALOG.sunny)
        : null;
    const periodLabel = status.weather?.periodKey
        ? parseWeatherPeriodSlot(status.weather.periodKey)
        : '';
    const weatherLine = wx
        ? `${wx.emoji} ${periodLabel}${wx.name}${status.weather?.source === 'admin' ? '·赐福' : ''} · ${escapeXml(wx.tip)}`
        : '天象：加载中…';

    let auraLine = '';
    if (status.cursed && status.blessed) {
        auraLine = `☠️咒 ×${status.curseStacks} · ✨福 ×${status.blessStacks} · 对冲中`;
    } else if (status.cursed) {
        auraLine = `咒印 ×${status.curseStacks} · 剩 ${status.curseRounds} 回合 · 叠毒 +${status.curseBonusPct}%${status.curseAscended ? ' · ⚡天咒' : ''}`;
    } else if (status.blessed) {
        auraLine = `鹿福 ×${status.blessStacks} · 剩 ${status.blessRounds} 回合 · 减鹿死 -${status.blessReducePct}%`;
    } else if (status.urgeBuff) {
        auraLine = '📣 被催更：下次安全自🦌 +1';
    } else {
        auraLine = '咒福：无 · 今日气运看天';
    }

    const helpBar = quotaBar(status.helperHelpUsed, DAILY_HELP_QUOTA);
    const wdBar = quotaBar(status.helperWithdrawUsed, DAILY_HELP_WITHDRAW_QUOTA);

    const rows = dead ? [
        ['冥咒', `${status.spectralCurseUsed ?? 0}/${DAILY_SPECTRAL_CURSE_QUOTA}`, '#e8b4ff'],
        ['索命', `${status.vengeanceUsed ?? 0}/${DAILY_VENGEANCE_QUOTA}`, '#ff8888'],
        ['托梦', status.dreamUsed ? '已用' : '可用', '#88c8ff'],
        ['还阳签', status.reviveLotteryUsed ? '已用' : '可用', '#88ffaa'],
        ['鹿鸣', `${status.howlUsed}/${DAILY_HOWL_QUOTA}`, '#88ffcc'],
        ['鹿碑', '可用', '#cccccc'],
    ] : [
        ['偷鹿', `${status.stealUsed}/${DAILY_STEAL_QUOTA}`, '#ffb347'],
        ['鹿咒', `${status.curseUsed}/${DAILY_CURSE_QUOTA}`, '#d4a5ff'],
        ['鹿福', `${status.blessUsed ?? 0}/${DAILY_BLESS_QUOTA}`, '#7dffb0'],
        ['解咒', `${status.cleanseUsed ?? 0}/${DAILY_CLEANSE_CURSE_QUOTA}`, '#88ffaa'],
        ['解福', `${status.cleanseBlessUsed ?? 0}/${DAILY_CLEANSE_BLESS_QUOTA}`, '#aaffcc'],
        ['催鹿', `${status.urgeUsed}/${DAILY_URGE_QUOTA}`, '#88c8ff'],
        ['擂台', `${status.arenaUsed}/${DAILY_ARENA_QUOTA}`, '#ff8888'],
        ['皇城', `${status.imperialUsed}/${DAILY_IMPERIAL_QUOTA}`, '#ffd700'],
        ['群溅', status.groupSplashUsed ? '已用' : '可用', '#66ddcc'],
        ['诈戒', `${status.fakeWithdrawUsed}/${DAILY_FAKE_WITHDRAW_QUOTA}`, '#cc99ff'],
        ['借鹿', status.borrowUsed ? '已用' : '可用', '#ffcc88'],
        ['碰瓷', `${status.bumperUsed ?? 0}/${DAILY_BUMPER_QUOTA}`, '#ffaa88'],
        ['鹿签', status.lotteryUsed ? '已用' : '可用', '#ffee88'],
        ['献祭', status.sacrificeUsed ? '已用' : '可用', '#ff9966'],
        ['倒贴', status.greedUsed ? '已用' : '可用', '#ff7788'],
        ['鹿鸣', `${status.howlUsed}/${DAILY_HOWL_QUOTA}`, '#88ffaa'],
    ];

    let grid = '';
    const gx0 = 20;
    const gy0 = 390;
    const colW = 175;
    const cols = 4;
    rows.forEach((row, i) => {
        const col = i % cols;
        const rowIdx = Math.floor(i / cols);
        const x = gx0 + col * colW;
        const y = gy0 + rowIdx * 44;
        grid += `<text filter="url(#txtShadow)" x="${x}" y="${y}" font-size="15" font-family="MiSans,sans-serif" fill="${theme.line}">${row[0]} <tspan fill="${row[2]}" font-weight="bold">${escapeXml(row[1])}</tspan></text>`;
    });

    const txt = 'filter="url(#txtShadow)" font-family="MiSans,sans-serif"';
    const footer = dead
        ? `冥界玩法见上 · 活人帮🦌可救活 · ${WEATHER_CMD_HINT}看天象`
        : `同归 ${status.togetherUsed ? '已用' : '可用'} · 献祭 ${status.sacrificeUsed ? '已用' : '可用'} · 倒贴 ${status.greedUsed ? '已用' : '可用'}`;

    const svg = `
        <rect width="${W}" height="${H}" rx="16" fill="url(#sbg)"/>
        <rect x="16" y="118" width="${W - 32}" height="44" rx="10" fill="${theme.panel}" stroke="${theme.accent}" stroke-width="1"/>
        <text ${txt} x="28" y="146" font-size="14" fill="${theme.line}">${weatherLine}</text>
        <text ${txt} x="36" y="48" font-size="30" fill="${theme.title}" font-weight="bold">📊 今日鹿况</text>
        <text ${txt} x="36" y="78" font-size="22" fill="${theme.sub}">${truncName(name)}</text>
        <text ${txt} x="36" y="102" font-size="14" fill="${theme.muted}" font-style="italic">${escapeXml(tagline)}</text>
        <text x="110" y="195" font-size="68" font-family="MiSans,sans-serif">${moodEmoji}</text>
        <text ${txt} x="210" y="175" font-size="34" fill="${theme.title}" font-weight="bold">${escapeXml(countText)}</text>
        <text ${txt} x="210" y="205" font-size="16" fill="${theme.sub}">尝试 ${status.attempts} 次</text>
        <text ${txt} x="210" y="230" font-size="15" fill="${theme.line}">${riskLine}</text>
        <text ${txt} x="36" y="268" font-size="15" fill="${status.cursed ? '#f0d0ff' : (status.blessed ? '#d0ffd8' : theme.line)}">${escapeXml(auraLine)}</text>
        <text ${txt} x="36" y="300" font-size="14" fill="${theme.muted}">帮🦌配额</text>
        <rect x="110" y="288" width="${helpBar.width}" height="14" rx="7" fill="${theme.barBg}"/>
        <rect x="110" y="288" width="${helpBar.fill}" height="14" rx="7" fill="#e67e22"/>
        <text ${txt} x="320" y="300" font-size="14" fill="${theme.line}">${helpBar.label}</text>
        <text ${txt} x="390" y="300" font-size="14" fill="${theme.muted}">帮戒</text>
        <rect x="440" y="288" width="${wdBar.width}" height="14" rx="7" fill="${theme.barBg}"/>
        <rect x="440" y="288" width="${wdBar.fill}" height="14" rx="7" fill="#3498db"/>
        <text ${txt} x="650" y="300" font-size="14" fill="${theme.line}" text-anchor="end">${wdBar.label}</text>
        <text ${txt} x="36" y="368" font-size="14" fill="${theme.muted}" font-weight="bold">玩法配额</text>
        ${grid}
        <text ${txt} x="36" y="${H - 28}" font-size="13" fill="${theme.muted}">${footer}</text>
        <text ${txt} x="${W - 36}" y="${H - 28}" font-size="12" fill="${theme.muted}" text-anchor="end">${now.getMonth() + 1}/${now.getDate()} · deer-pipe</text>
    `;

    return sharp({
        create: { width: W, height: H, channels: 4, background: { r: 255, g: 245, b: 235, alpha: 1 } },
    })
        .composite([{
            input: svgTextStyled(svg, W, H, `<linearGradient id="sbg" x1="0%" y1="0%" x2="100%" y2="100%">${theme.bgStops}</linearGradient>`),
            top: 0,
            left: 0,
        }])
        .png()
        .toBuffer();
}
