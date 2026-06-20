import { REG, cleanCommandMsg } from '../constants/commands.js';
import {
    formatUiSkinCatalog,
    formatPortraitSkinCatalog,
    parseUiSkinToken,
    parsePortraitProfSkinCommand,
    SKIN_DEFAULT,
    UI_SKINS,
    PORTRAIT_SKINS,
    resolveUiSkinId,
    resolvePortraitSkinId,
    setPortraitSkinForProfession,
    isFestivalActive,
    hasPortraitUnlock,
} from '../constants/skins.js';
import { getProfessionDef } from '../constants/profession.js';
import { getExtraDeerDef, isExtraDeerId } from '../constants/extra-deer.js';
import { loadDeerData, saveDeerData } from '../utils/store.js';
import { getUserSkinPrefs, setUserSkinPref } from '../utils/skin.js';
import { reconcileFestivalPortraitUnlocks } from '../utils/portrait-unlock.js';

function ensureUserRecord(deerData, userId) {
    const uid = String(userId);
    if (!deerData[uid]) deerData[uid] = {};
    return deerData[uid];
}

function skinName(kind, id) {
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
                { reg: REG.portraitProfSwitch, fnc: 'switchPortraitProf' },
            ],
        });
    }

    async listSkins() {
        await this.reply(formatUiSkinCatalog(new Date()), true);
    }

    async listPortraitSkins() {
        const deerData = await loadDeerData();
        const record = ensureUserRecord(deerData, this.e.sender.user_id);
        reconcileFestivalPortraitUnlocks(record);
        await saveDeerData(deerData);
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
            await this.reply(`未识别的界面主题「${token}」\n可用：默认 / 端午`, true);
            return;
        }
        const { user_id } = this.e.sender;
        const deerData = await loadDeerData();
        const record = ensureUserRecord(deerData, user_id);
        setUserSkinPref(record, skinId);
        await saveDeerData(deerData);
        const active = resolveUiSkinId(getUserSkinPrefs(record));
        await this.reply(
            `🎨 界面主题已设为：${skinName('ui', skinId)}\n`
            + `当前生效：${skinName('ui', active)}（鹿况/月历/帮助/PK 等样式）\n`
            + '立绘请用：卷王鹿端午 / 雨木木鹿端午 等。',
            true,
        );
    }

    async switchPortraitProf() {
        const msg = cleanCommandMsg(this.e.msg).replace(/\s+/g, '');
        const match = msg.match(/^(?:🦌|鹿)?(卷王鹿|鹿医师|医师|卷王|王美嘉鹿|王美嘉|美嘉鹿|美嘉|雨木木鹿|雨木木|木木鹿|木木)(端午|默认|原版)$/);
        if (!match) {
            await this.listPortraitSkins();
            return;
        }
        const parsed = parsePortraitProfSkinCommand(match[1], match[2]);
        if (!parsed) {
            await this.reply(
                '切换：卷王鹿端午 / 鹿医师端午 / 雨木木鹿端午 / 王美嘉鹿端午 等\n见「鹿立绘」',
                true,
            );
            return;
        }
        const { professionId, skinId } = parsed;
        const prof = isExtraDeerId(professionId)
            ? getExtraDeerDef(professionId)
            : getProfessionDef(professionId);
        const { user_id } = this.e.sender;
        const deerData = await loadDeerData();
        const record = ensureUserRecord(deerData, user_id);
        reconcileFestivalPortraitUnlocks(record);

        if (skinId === 'duanwu' && !hasPortraitUnlock(record, 'duanwu', professionId)) {
            const hint = isFestivalActive('duanwu', new Date())
                ? `${prof.name}端午立绘未解锁（见「鹿立绘」查进度）`
                : `${prof.name}端午立绘未解锁且活动已结束`;
            await saveDeerData(deerData);
            await this.reply(hint, true);
            return;
        }

        setPortraitSkinForProfession(record, professionId, skinId);
        await saveDeerData(deerData);
        const active = resolvePortraitSkinId(record, professionId);
        await this.reply(
            `🖼️ ${prof.emoji}${prof.name}立绘已设为：${skinName('portrait', skinId)}\n`
            + `当前该职业生效：${skinName('portrait', active)}`,
            true,
        );
    }
}
