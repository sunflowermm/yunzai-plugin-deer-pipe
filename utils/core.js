import sharp from 'sharp';
import fs from 'fs';
import { CHECK_IMG, DEERPIPE_IMG } from '../constants/core.js';
import {
    calcMonthStats,
    calcYearStats,
    getDayEntry,
    getDaySnap,
    getDeathKillerId,
    getDeathReason,
    getEffectiveCount,
    getYearMonths,
    isDayDead,
    normalizeDayEntry,
    sumMonthData,
} from './data.js';
import { DAILY_SAFE_LIMIT, getDeathCellLabel, getDeathReasonText } from '../constants/game.js';

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
    if (!count || count <= 0) return { r: 245, g: 247, b: 250, a: 1 };
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

function svgText(content, width, height, extra = '') {
    return Buffer.from(
        `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${extra}${content}</svg>`
    );
}

/**
 * @param {object} options highlightDay=高亮日期, forceDeadBanner=强制显示鹿死横幅
 */
export async function generateImage(now, name, monthData, options = {}) {
    const { highlightDay = now.getDate(), forceDeadBanner = false } = options;
    const cal = getMonthCalendar(now);
    const IMG_W = 700;
    const IMG_H = HEADER_H + STATS_H + BOX_H + BOX_H * cal.length;

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

    const titleColor = todayDead ? '#ffcccc' : '#5c3d2e';
    const subColor = todayDead ? '#ffb3b3' : '#8b5a3c';
    const metaColor = todayDead ? '#ff9999' : '#a07050';
    const deadBanner = todayDead
        ? ` · 💀今日鹿死（失${todaySnap}次·${getDeathReasonText(todayReason)}）`
        : '';

    compositeArray.push({
        input: svgText(`
            <text x="20" y="42" font-size="28" font-family="MiSans" fill="${titleColor}" font-weight="bold">
                ${todayDead ? '💀' : '🦌'} ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')} 鹿历
            </text>
            <text x="20" y="78" font-size="24" font-family="MiSans" fill="${subColor}">${escapeXml(name)}</text>
            <text x="20" y="112" font-size="17" font-family="MiSans" fill="${metaColor}">
                本月 ${stats.total} 次 · 活跃 ${stats.activeDays} 天 · 连击 ${stats.streak} 天
                ${stats.deathDays > 0 ? ` · 💀${stats.deathDays}天` : ''}${deadBanner}
            </text>
        `, IMG_W, HEADER_H),
        top: 0,
        left: 0,
    });

    // 星期标题
    const weekY = HEADER_H;
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
            const y0 = HEADER_H + BOX_H + weekIdx * BOX_H;
            if (day === null) continue;

            const rawDay = monthData?.[String(day)];
            const entry = normalizeDayEntry(rawDay);
            const dead = isDayDead(rawDay);
            const count = getEffectiveCount(rawDay);
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
                    ${!dead && count > 0 ? `<text x="${BOX_W - 8}" y="${BOX_H - 12}" font-size="20" font-family="MiSans" fill="#c0392b" text-anchor="end" font-weight="bold">${count > 99 ? '99+' : count}</text>` : ''}
                    ${!dead && count > DAILY_SAFE_LIMIT ? `<text x="8" y="48" font-size="14" font-family="MiSans" fill="#e67e22">危</text>` : ''}
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
            <text x="${IMG_W / 2}" y="72" font-size="22" font-family="MiSans" fill="#e8e8e8" text-anchor="middle">${escapeXml(name)}</text>
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
        const bg = heatColor(total > 0 ? Math.min(total, 10) : 0);
        const isCurrentMonth = m === now.getMonth() + 1;

        // 迷你月格子条
        const daysInMonth = new Date(year, m, 0).getDate();
        let cells = '';
        for (let d = 1; d <= daysInMonth; d++) {
            const raw = monthData?.[String(d)];
            const dead = isDayDead(raw);
            const c = dead ? 0 : getEffectiveCount(raw);
            const cellBg = dead ? { r: 45, g: 30, b: 35, a: 1 } : heatColor(c);
            const cx = 8 + ((d - 1) % 7) * 20;
            const cy = 36 + Math.floor((d - 1) / 7) * 14;
            cells += dead
                ? `<rect x="${cx}" y="${cy}" width="16" height="12" rx="2" fill="rgb(${cellBg.r},${cellBg.g},${cellBg.b})" stroke="#ff4444" stroke-width="1"/>`
                : `<rect x="${cx}" y="${cy}" width="16" height="12" rx="2" fill="rgb(${cellBg.r},${cellBg.g},${cellBg.b})"/>`;
        }

        compositeArray.push({
            input: svgText(`
                <rect x="0" y="0" width="${MINI_W}" height="${MINI_H}" fill="rgb(${bg.r},${bg.g},${bg.b})" rx="10" stroke="${isCurrentMonth ? '#ffd700' : '#444'}" stroke-width="${isCurrentMonth ? 2 : 1}"/>
                <text x="10" y="24" font-size="18" font-family="MiSans" fill="#333" font-weight="bold">${m}月</text>
                <text x="${MINI_W - 10}" y="24" font-size="16" font-family="MiSans" fill="#c0392b" text-anchor="end" font-weight="bold">${total}次</text>
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
