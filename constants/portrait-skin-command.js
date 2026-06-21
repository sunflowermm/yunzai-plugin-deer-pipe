/** 立绘切换指令正则（由职业/番外别名 + 皮肤别名动态拼装） */

import { D_OPT } from './command-tokens.js';
import { PROFESSIONS, PROFESSION_ALIASES } from './profession.js';
import { EXTRA_DEER, EXTRA_DEER_ALIASES } from './extra-deer.js';
import { PORTRAIT_SKINS, SKIN_ALIASES, SKIN_DEFAULT } from './skin-registry.js';

function collectProfTokens() {
    const set = new Set();
    for (const p of Object.values(PROFESSIONS)) {
        set.add(p.name);
        const short = p.name.replace(/鹿$/, '');
        if (short) set.add(short);
    }
    for (const alias of Object.keys(PROFESSION_ALIASES)) set.add(alias);
    for (const d of Object.values(EXTRA_DEER)) {
        set.add(d.name);
        const short = d.name.replace(/鹿$/, '');
        if (short) set.add(short);
    }
    for (const alias of Object.keys(EXTRA_DEER_ALIASES)) set.add(alias);
    return [...set].sort((a, b) => b.length - a.length);
}

function collectSkinTokens() {
    const set = new Set(['默认', '原版']);
    for (const [alias, id] of Object.entries(SKIN_ALIASES)) {
        if (id === SKIN_DEFAULT || PORTRAIT_SKINS[id]) set.add(alias);
    }
    for (const id of Object.keys(PORTRAIT_SKINS)) {
        if (id !== SKIN_DEFAULT) set.add(id);
    }
    return [...set].sort((a, b) => b.length - a.length);
}

export const PORTRAIT_PROF_SWITCH = `^${D_OPT}(${collectProfTokens().join('|')})(${collectSkinTokens().join('|')})$`;
