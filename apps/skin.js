import { REG, cleanCommandMsg } from '../constants/commands.js';
import {
    formatUiSkinCatalog,
    formatPortraitSkinCatalog,
    parseUiSkinToken,
    parsePortraitSkinToken,
    SKIN_AUTO,
    SKIN_DEFAULT,
    UI_SKINS,
    PORTRAIT_SKINS,
    resolveUiSkinId,
    resolvePortraitSkinId,
    isFestivalActive,
    hasAnyPortraitUnlock,
} from '../constants/skins.js';
import { getUserRecord } from '../utils/data.js';
import { loadDeerData, saveDeerData } from '../utils/store.js';
import {
    getUserSkinPrefs,
    setUserSkinPref,
    resolveSkinContext,
} from '../utils/skin.js';

function ensureUserRecord(deerData, userId) {
    const uid = String(userId);
    if (!deerData[uid]) deerData[uid] = {};
    return deerData[uid];
}

function skinName(kind, id) {
    if (id === SKIN_AUTO) return '自动（节日优先）';
    if (id === SKIN_DEFAULT) return '默认';
    const map = kind === 'portrait' ? PORTRAIT_SKINS : UI_SKINS;
    const s = map[id];
    return s ? `${s.emoji}${s.name}` : id;
}

export class DeerSkin extends plugin {
    constructor() {
        super({
            name: '🦌皮肤',
            dsc: '鹿管界面主题 / 立绘皮肤（独立切换）',
            event: 'message',
            priority: 5000,
            bypassThrottle: true,
            rule: [
                { reg: REG.skinList, fnc: 'listSkins' },
                { reg: REG.skinSwitch, fnc: 'switchSkin' },
                { reg: REG.portraitSkinList, fnc: 'listPortraitSkins' },
                { reg: REG.portraitSkinSwitch, fnc: 'switchPortraitSkin' },
            ],
        });
    }

    async listSkins() {
        await this.reply(formatUiSkinCatalog(new Date()), true);
    }

    async listPortraitSkins() {
        const deerData = await loadDeerData();
        const record = getUserRecord(deerData, this.e.sender.user_id);
        await this.reply(formatPortraitSkinCatalog(record, new Date()), true);
    }

    async switchSkin() {
        const msg = cleanCommandMsg(this.e.msg);
        const match = msg.match(new RegExp(`^(?:🦌|鹿)皮肤(.+)$`));
        const token = match?.[1]?.trim() ?? '';
        if (!token) {
            await this.listSkins();
            return;
        }
        const skinId = parseUiSkinToken(token);
        if (!skinId) {
            await this.reply(`未识别的界面主题「${token}」\n可用：默认 / 端午 / 自动`, true);
            return;
        }
        const { user_id } = this.e.sender;
        const deerData = await loadDeerData();
        const record = ensureUserRecord(deerData, user_id);
        setUserSkinPref(record, 'ui', skinId);
        await saveDeerData(deerData);
        const active = resolveUiSkinId(getUserSkinPrefs(record), new Date());
        await this.reply(
            `🎨 界面主题已设为：${skinName('ui', skinId)}\n`
            + `当前生效：${skinName('ui', active)}（鹿况/月历/帮助/PK 等样式；立绘请用「鹿立绘」）\n`
            + '已写入档案，永久保存直至再次切换。',
            true,
        );
    }

    async switchPortraitSkin() {
        const msg = cleanCommandMsg(this.e.msg);
        const match = msg.match(new RegExp(`^(?:🦌|鹿)立绘(.+)$`));
        const token = match?.[1]?.trim() ?? '';
        if (!token) {
            await this.listPortraitSkins();
            return;
        }
        const skinId = parsePortraitSkinToken(token);
        if (!skinId) {
            await this.reply(`未识别的立绘皮肤「${token}」\n可用：默认 / 端午 / 自动`, true);
            return;
        }
        const { user_id } = this.e.sender;
        const deerData = await loadDeerData();
        const record = ensureUserRecord(deerData, user_id);
        if (skinId === 'duanwu' && !hasAnyPortraitUnlock(record, 'duanwu')) {
            const hint = isFestivalActive('duanwu', new Date())
                ? '端午立绘未解锁：鹿医师帮鹿 10 次 · 卷王鹿自🦌 10 次（活动期间累计）'
                : '端午立绘未解锁且活动已结束';
            await this.reply(hint, true);
            return;
        }
        setUserSkinPref(record, 'portrait', skinId);
        await saveDeerData(deerData);
        const ctx = resolveSkinContext(record, new Date(), 'medic');
        await this.reply(
            `🖼️ 立绘皮肤已设为：${skinName('portrait', skinId)}\n`
            + `当前鹿医师/卷王鹿生效：${skinName('portrait', ctx.portrait)}\n`
            + '仅影响职业立绘，不改变界面主题；已永久保存直至再次切换。',
            true,
        );
    }
}
