---
name: deer-pipe-dev
description: >-
  yunzai-plugin-deer-pipe 开发与出图：新增八职业/番外鹿角色、改天赋/UI、一键 render、
  art 流水线。在改 deer-pipe 插件职业、渲染、贴图、预渲染、README 附图时使用。
---

# deer-pipe 开发流程

插件路径：`plugins/yunzai-plugin-deer-pipe/`（独立 git 仓库）。

## 一键出图（改 UI / 天赋 / 布局后必跑）

在插件目录：

```bash
npm run render
```

或在 XRK-Yunzai 根目录：

```bash
node plugins/yunzai-plugin-deer-pipe/scripts/render-all.mjs
```

**一次生成全部提交用图：**

| 目录 | 内容 |
|------|------|
| `assets/prebuilt/` | Bot 运行时：帮助、八职业一览、职业卡、番外卡、番外一览、天象 |
| `docs/images/` | README 附图：**鹿况** `status-{default\|duanwu}.png`、月历、年历、职业一览、**番外一览**、帮助、玩法卡 |

入口：`scripts/render-all.mjs` + `scripts/lib/ui-export.mjs`。

发版前提交：`assets/prebuilt/` + `docs/images/`（GitHub 才能显示 README 里的鹿况图）。

---

## 新增「八职业」检查清单

按顺序改，漏一步会 manifest/指令/出图对不上。

### 1. 数值与天赋（单源）

| 文件 | 改什么 |
|------|--------|
| `constants/profession.js` | `PROFESSIONS.{id}`：仅写 **数值字段**（`safeBonus`、`helpFailDelta`、`stealDelta`…），**不要**手写 `tagline` |
| `constants/profession-quotas.js` | `PROFESSION_QUOTA_TABLE.{id}` 各玩法次数 |
| `constants/talent-text.js` | 若新增天赋字段类型，在 `collectTalentParts()` 加展示规则 |
| `constants/profession.js` | `PROFESSION_SKILLS.{id}` 专属技（1 次/日，与天赋分开） |
| `constants/profession.js` | `PROFESSION_ALIASES` 转职别名 |

`getProfessionDef()` 会自动注入 `tagline` / `synergyTip`（带具体百分比/次数）。

### 2. 玩法逻辑

| 文件 | 改什么 |
|------|--------|
| `utils/data.js` | 专属技 `perform*Skill`、天赋在 `getProfessionMods` 链路上的生效 |
| `utils/messages.js` | 成功/失败文案 |
| `constants/commands.js` | 新指令正则 |
| `apps/core.js` | handler 挂载 |

### 3. 立绘与贴图

| 文件 | 改什么 |
|------|--------|
| `constants/deer-assets.js` | 路径 + `ART_MANIFEST` 条目 |
| `scripts/art-pipeline/jobs.mjs` | AI 生图 job（立绘、技能 icon、端午 skin 等） |
| `constants/profession-flavor.js` | 职业卡底部诙谐一句（可选） |

```bash
npm run art -- sync <job-id>    # 生图 + 抠图 → assets/
npm run art:fresh               # 全量重跑（慎用）
```

启动时 `verifyArtManifest()` 校验 `assets/` 文件齐全。

### 4. 预渲染清单

| 文件 | 改什么 |
|------|--------|
| `constants/prebuilt-images.js` | `listPrebuiltRelPaths()` 若新增**新类别** PNG（一般八职业只改 `PROFESSIONS` 即可自动进 card 列表） |

`npm run render` 会写 `assets/prebuilt/manifest.json`。

### 5. 验证

```bash
npm run render
node -e "import('./utils/prebuilt-images.js').then(m=>console.log(m.verifyPrebuiltManifest()))"
```

Bot 内：`DEER_PIPE_FORCE_LIVE_RENDER=1` 对比实时 vs 预渲染。

---

## 新增「番外鹿」（王美嘉 / 雨木木 模式）

番外**不在** `PROFESSIONS`，单独一套文件：

| 文件 | 改什么 |
|------|--------|
| `constants/extra-deer.js` | `EXTRA_DEER` 天赋数值、`EXTRA_DEER_SKILLS` 专属技、`EXTRA_DEER_QUOTA_TABLE`、`EXTRA_DEER_ALIASES` |
| `constants/extra-deer.js` | `EXTRA_DEER_IDS` 数组 |
| `utils/extra-deer.js` | 机制（组队双亡+解除、束缚、阳痿 debuff 等） |
| `utils/extra-deer-render.js` | 番外一览 SVG |
| `utils/data.js` | `performMeijiaTeamSkill` / `performYumumuBindSkill` |
| `constants/prebuilt-images.js` | `professionExtraCard`、`extraDeerCatalog` 已在模板里，新 id 加进 `EXTRA_DEER_IDS` 即可 |
| `constants/commands.js` | `^组队`、`^束缚` 等 |
| `apps/core.js` | handler |

**概念分离（必守）：**

- **天赋** = 转职后全程被动 → `EXTRA_DEER` 数值 + `talent-text.js` 生成文案
- **专属技** = `组队@` / `束缚@`，1 次/日，写在 `EXTRA_DEER_SKILLS`

---

## 改 UI 皮肤（default / duanwu）

| 文件 | 改什么 |
|------|--------|
| `constants/skins.js` | UI 主题、节日、立绘 skin |
| `constants/prebuilt-images.js` | `PREBUILT_UI_SKIN_IDS` |
| `scripts/art-pipeline/jobs.mjs` | 对应 skin 贴图 job |

每个 UI 主题各跑一遍 `npm run render`（脚本已循环 `PREBUILT_UI_SKIN_IDS`）。

---

## 渲染架构速查

```
用户指令 → apps/core.js
         → utils/panel.js（reply*）
         → utils/prebuilt-images.js（优先读 prebuilt，fallback live）
         → utils/*-render.js / utils/core.js（generate*Image）
```

- **鹿况 / 月历**：带用户数据 → **仅 live**；README 样例在 `docs/images/status-*.png` 由 render 导出
- **职业卡 / 帮助 / 天象 / 番外一览**：默认 prebuilt
- 非默认立绘 skin：`needsLiveProfessionCard()` → live 职业卡

---

## 常见错误

| 现象 | 排查 |
|------|------|
| README 鹿况图仍是旧版 | 未跑 `npm run render` 或未提交 `docs/images/` |
| 预渲染缺图 | `verifyPrebuiltManifest()`；补 `listPrebuiltRelPaths` 后重跑 render |
| 天赋文案与实装不符 | 改 `PROFESSIONS` 数值，勿手写 tagline；检查 `collectTalentParts` |
| SVG 「组队共 」空白 | 文案含 🦌 → 用 `deerTextForSvg()` 或写「鹿」 |
| 贴图 404 | `deer-assets.js` manifest 与 `assets/` 不一致 → `npm run art` |

---

## 相关文件

- `scripts/render-all.mjs` — 入口
- `scripts/lib/ui-export.mjs` — prebuilt / docs 共用逻辑
- `scripts/art-pipeline/` — AI 生图（gitignore，本地维护）
- `constants/talent-text.js` — 天赋展示单源
