import { REG, cleanCommandMsg } from '../constants/commands.js';
import {
    formatSkinCatalog,
    parseSkinToken,
    SKIN_AUTO,
    SKIN_DEFAULT,
    UI_SKINS,
    PORTRAIT_SKINS,
    resolveUiSkinId,
    resolvePortraitSkinId,
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
            dsc: '鹿管 UI / 立绘皮肤切换',
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
        await this.reply(formatSkinCatalog(new Date()), true);
    }

    async listPortraitSkins() {
        await this.reply(formatSkinCatalog(new Date()), true);
    }

    async switchSkin() {
        const msg = cleanCommandMsg(this.e.msg);
        const match = msg.match(new RegExp(`^(?:🦌|鹿)皮肤(.+)$`));
        const token = match?.[1]?.trim() ?? '';
        if (!token) {
            await this.listSkins();
            return;
        }
        const skinId = parseSkinToken(token);
        if (!skinId) {
            await this.reply(`未识别的皮肤「${token}」\n可用：默认 / 端午 / 自动`, true);
            return;
        }
        if (skinId !== SKIN_AUTO && skinId !== SKIN_DEFAULT && !UI_SKINS[skinId]) {
            await this.reply(`界面皮肤不存在：${skinId}`, true);
            return;
        }
        const { user_id } = this.e.sender;
        const deerData = await loadDeerData();
        const record = ensureUserRecord(deerData, user_id);
        setUserSkinPref(record, 'ui', skinId);
        await saveDeerData(deerData);
        const active = resolveUiSkinId(getUserSkinPrefs(record), new Date());
        await this.reply(
            `🎨 界面皮肤已设为：${skinName('ui', skinId)}\n当前生效：${skinName('ui', active)}（鹿况/月历/职业卡配色）`,
            true,
        );
    }

    async switchPortraitSkin() {
        const msg = cleanCommandMsg(this.e.msg);
        const match = msg.match(new RegExp(`^(?:🦌|鹿)立绘(.+)$`));
        const token = match?.[1]?.trim() ?? '';
        if (!token) {
            await this.reply(
                '立绘皮肤：鹿立绘端午 / 鹿立绘默认 / 鹿立绘自动\n端午限定：鹿医师 · 卷王鹿',
                true,
            );
            return;
        }
        const skinId = parseSkinToken(token);
        if (!skinId) {
            await this.reply(`未识别的立绘「${token}」\n可用：默认 / 端午 / 自动`, true);
            return;
        }
        if (skinId !== SKIN_AUTO && skinId !== SKIN_DEFAULT && !PORTRAIT_SKINS[skinId]) {
            await this.reply(`立绘皮肤不存在：${skinId}`, true);
            return;
        }
        const { user_id } = this.e.sender;
        const deerData = await loadDeerData();
        const record = ensureUserRecord(deerData, user_id);
        setUserSkinPref(record, 'portrait', skinId);
        await saveDeerData(deerData);
        const ctx = resolveSkinContext(record, new Date(), 'medic');
        await this.reply(
            `🖼️ 立绘皮肤已设为：${skinName('portrait', skinId)}\n当前鹿医师/卷王生效：${skinName('portrait', ctx.portrait)}`,
            true,
        );
    }
}
