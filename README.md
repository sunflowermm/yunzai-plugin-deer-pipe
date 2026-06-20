# 🦌 鹿管插件

<div align="center">

<img src="./assets/deerpipe@100x82.png" alt="鹿管 Logo" width="120">

**群友 🦌 绩签到 · 天象联动 · 八职业配额 · 互害恶趣 · 鹿王册封**

<br>

[![XRK-Yunzai](https://img.shields.io/badge/框架-XRK--Yunzai-ff7043?style=flat-square)](https://github.com/sunflowermm/XRK-Yunzai)
[![Node](https://img.shields.io/badge/Node-%3E%3D24-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Redis](https://img.shields.io/badge/数据-Redis-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Version](https://img.shields.io/badge/版本-1.5.0--sunflower-f6c90e?style=flat-square)](#)

*向日葵 / XRK-Yunzai 维护版 · 基于 nonebot-plugin-deer-pipe 生态二次开发*

</div>

---

## 目录

**使用说明**

- [这是什么](#这是什么)
- [安装与依赖](#安装与依赖)
- [新手一日流程](#新手一日流程)
- [界面说明](#界面说明)
- [八职业体系](#八职业体系)
- [鹿林天象](#鹿林天象)
- [核心机制](#核心机制)
- [指令大全](#指令大全)
- [排行榜与鹿王](#排行榜与鹿王)
- [数据与配置](#数据与配置)
- [渲染与预出图](#渲染与预出图)
- [项目结构](#项目结构)

**附录（出图样例 · 贴图立绘，各图仅在此处展示一次）**

- [附录 A · Bot 出图样例](#附录-a--bot-出图样例)
- [附录 B · 贴图与立绘资源](#附录-b--贴图与立绘资源)

- [鸣谢与许可](#鸣谢与许可)

---

## 这是什么

**鹿管**（`yunzai-plugin-deer-pipe`）是 QQ / OneBot 群内的 **🦌 绩签到 + 轻量社交博弈** 插件：

| 维度 | 说明 |
|------|------|
| **签到** | `鹿` / `🦌` 自 🦌 +1；`戒鹿` 自律 −1（可负） |
| **职业** | 每日 **`转职xxx`** 解锁玩法配额；**未转职 = 全部玩法封印** |
| **天象** | 每 12 小时换场，全局修正鹿死、偷、帮、签运等 15+ 维度 |
| **互助** | 🦌 友双向结缘；`帮鹿@` / `帮戒鹿@` 代操作或救活 |
| **互害** | 偷咒、碰瓷、群溅、擂台、皇城等恶趣玩法 |
| **冥界** | 鹿死后冥咒、索命、托梦、还阳签；活人 `帮鹿` 主救场 |
| **鹿王** | 每日 0:00 按 **综合平衡分** 册封昨日日榜第一 |

- **指令等价**：全文 **`鹿`** 与 **`🦌`** 可互换（[`constants/commands.js`](constants/commands.js)）。
- **完整玩法**：群内 **`鹿帮助`**（双页长图，与 [`help-catalog.js`](constants/help-catalog.js) 同源）。
- **界面长什么样**：见文末 [附录 A · Bot 出图样例](#附录-a--bot-出图样例)。

---

## 安装与依赖

在 **XRK-Yunzai 根目录**：

```bash
git clone --depth=1 https://github.com/sunflowermm/yunzai-plugin-deer-pipe ./plugins/yunzai-plugin-deer-pipe/
cd plugins/yunzai-plugin-deer-pipe && pnpm install
```

| 依赖 | 用途 |
|------|------|
| `sharp` | PNG 合成、Twemoji 栅格、贴图 trim |
| `@resvg/resvg-js` | SVG 文字渲染（加载 `assets/Genshin.ttf`） |

重启 Bot 生效。排行榜 / 🦌 友等 HTML 页走 **RendererLoader**（Puppeteer），模板在 `resources/html/`。

- **贴图自检**：启动时 `verifyArtManifest()` 检查 [`assets/`](assets/) 立绘与贴图（清单见 [附录 B](#附录-b--贴图与立绘资源)）。
- **预渲染 PNG**：仓库含 [`assets/prebuilt/`](assets/prebuilt/)（帮助、职业、天象等）；缺失时自动回退实时渲染。

---

## 新手一日流程

```mermaid
flowchart TD
    A["进群第一天"] --> B["鹿职业 / 鹿职业卷王"]
    B --> C["转职卷王"]
    C --> D{"已转职?"}
    D -->|否| E["仅看榜 / 鹿碑 / 帮助"]
    D -->|是| F["鹿 ×3 安全自🦌"]
    F --> G["鹿况 · 天象 / 配额"]
    G --> H["添加鹿友@ · 帮鹿 / 偷鹿 …"]
    H --> I{"鹿死?"}
    I -->|是| J["鹿碑 + 冥界 / 等救活"]
    I -->|否| K["消耗配额"]
    K --> L["次日 0:00 职业重置 + 鹿王"]
```

| 步骤 | 指令 | 得到什么 |
|:----:|------|----------|
| 1 | `鹿职业` | 八职业一览（联动专精 + 专属技） |
| 2 | `鹿职业卷王` 等 | 任意时间看 **静态专精卡**（不必转职） |
| 3 | `转职卷王` 等 | **当日锁定**职业与配额 |
| 4 | `鹿` | 安全区自 🦌（默认前 3 次零鹿死） |
| 5 | `鹿况` | 天象、咒福、互助、玩法分区 |
| 6 | `鹿帮助` | 双页说明书 |

---

## 界面说明

以下说明 **布局与指令**；对应截图均在 [附录 A](#附录-a--bot-出图样例) 集中展示，正文不再插图。

### 今日鹿况 · `鹿况`

| 区域 | 内容 |
|------|------|
| 标题区 | 昵称、心情 emoji（Twemoji）、职业与锁定 |
| 天象条 | 左侧天气 emoji + 换行 tip，面板高度自适应 |
| 计数区 | 安全 `n/上限`、戒鹿区、高危区或鹿死丢失 |
| 综合分 | 与 **综合榜 / 0 点鹿王** 同算法 |
| 互助配额 | 帮鹿 / 帮戒进度条；标题旁为分区贴图（见 [附录 B](#附录-b--贴图与立绘资源)） |
| 玩法分区 | **互害恶趣**、**擂台皇城** 等，标题左对齐 |
| 底栏 | 随机 flavor + 日期 |

支持 `@某人 鹿况` 围观。

### 职业相关出图

| 指令 | 出图类型 |
|------|----------|
| `鹿职业` | **一览图**；已转职时顶栏叠加今日职业与互助剩余 |
| `鹿职业卷王` / `鹿职业卡窃光` / `看鹿职业医师` | **静态专精卡**（预渲染，随时可看） |
| `鹿配额` | **个人配额面板**（各玩法已用/上限） |
| `转职卷王` 等 | 转职成功 → 个人配额面板 + 文字结果 |

### 鹿林天象 · `鹿环境` / `天象一览`

- **`鹿环境`** / `天气鹿`：当前半天场次 **详情卡**（八象独立配色与特效）。
- **`天象一览`** / `鹿林天象`：八象 **HTML 图鉴**，高亮当前象（Puppeteer 截图，非 SVG 卡）。

### 月历 · `看鹿` / `鹿历`

- **月历**：当月格子热力 + 鹿标；💀 格为鹿死日。
- **年历**：12 月迷你热力总览。

### 说明书 · `鹿帮助`

双页：**活鹿篇**（基础 / 职业 / 互助 / 恶趣 / 天象 / 生态）+ **冥界篇**（死亡 / 特权 / 彩蛋）。指令行内 emoji 走 Twemoji；节标题旁贴图见附录 B。

### 玩法互动卡

偷鹿、叠咒、帮鹿等 **对局结果卡**（含头像、统计条）为 **实时渲染**，样式见附录 A 样例。

### 界面主题与立绘皮肤

**界面主题（样式）** 与 **职业立绘** 完全独立，切换互不影响；显式切换后 **永久写入档案**。

| 类型 | 指令 | 规则 |
|------|------|------|
| **界面主题** | `鹿皮肤` / `鹿皮肤端午` / `鹿皮肤默认` | **免费切换** · 影响鹿况、月历、帮助、PK 卡、天象等 UI |
| **立绘进度** | `鹿立绘` | 查看端午解锁进度（不切换立绘） |
| **立绘切换** | `卷王鹿端午` / `卷王鹿默认` · `鹿医师端午` / `鹿医师默认` | **按职业**切换 · 须先解锁对应端午立绘 |

**未手动设置界面主题时恒为默认**，不会随端午活动自动变色（须发 `鹿皮肤端午`）。

**端午立绘（活动）**（每年公历 6 月 1 日～30 日循环）：

| 立绘 | 解锁条件 | 说明 |
|------|----------|------|
| 🔥 卷王鹿·端午 | 活动期间 **自🦌 累计 10 次** | 达标自动赠送，操作成功时提示 |
| 💊 鹿医师·端午 | 活动期间 **帮鹿 累计 10 次** | 同上 |

活动结束后 **不可再解锁**；已获得的立绘 **永久保留**。界面端午主题仍可通过 `鹿皮肤端午` 随时免费切换。

附录 A 主截图展示 **端午界面主题**；默认主题对照见 [附录 A · 主题对照](#主题对照默认--端午)。

---

## 八职业体系

| 职业 | 转职 | 看静态卡 | 定位 | 专属技 | 关键被动 |
|------|------|----------|------|--------|----------|
| 🦌 巡游鹿 | `转职巡游` | `鹿职业巡游` | 均衡探索 | `鹿巡` | 天象 ×1.25 · 偷 +6% |
| 💊 鹿医师 | `转职鹿医师` | `鹿职业医师` | 救场 | `愈鹿@` | 帮鹿失手大减 · 12% 次数+1 |
| 📘 戒灵师 | `转职戒师` | `鹿职业戒师` | 帮戒 | `清规@` | 帮戒 10 · 30% 再 -1 |
| 🔥 卷王鹿 | `转职卷王` | `鹿职业卷王` | 高位卷 | `卷冲` | 安全 +3 · 超限鹿死 ≤60% |
| ☠️ 叠咒鹿 | `转职叠咒` | `鹿职业叠咒` | 互害咒 | `咒缚@` | 鹿咒 7 · 冥咒 4 |
| ✨ 福鹿使 | `转职福鹿使` | `鹿职业福鹿使` | 正面互助 | `广福@` | 鹿福 6 · 解福/解咒多 |
| 🥷 窃光鹿 | `转职窃光` | `鹿职业窃光` | 窃掠 | `夜袭@` | 偷 7 · 碰瓷 5 |
| 🌻 向日葵鹿 | `转职向日葵` | `鹿职业向日葵` | 天象/签运 | `向阳@` | 天象 ×1.28 · 签运 +10% |

**规则**：首次转职后 **当日锁定**，次日 **0:00** 重置；**没转职 = 没配额**。专属技 **`鹿技`** 查状态，多数 **1 次/日** 且不占对应玩法配额。  
各职业 **静态专精卡** 见 [附录 A · 八职业静态专精卡](#八职业静态专精卡)；立绘见 [附录 B](#附录-b--贴图与立绘资源)。

### 各职业玩法配额（每日上限）

> 完整键名：[`constants/profession-quotas.js`](constants/profession-quotas.js)

<details>
<summary><b>🦌 巡游鹿</b></summary>

| 帮鹿 | 帮戒 | 偷鹿 | 鹿咒 | 鹿福 | 擂台 | 皇城 | 鹿鸣 | 鹿签 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 7 | 5 | 4 | 3 | 3 | 5 | 2 | 6 | 3 |

</details>

<details>
<summary><b>💊 鹿医师</b></summary>

| 帮鹿 | 帮戒 | 偷鹿 | 鹿咒 | 解咒 | 借鹿 | 托梦 | 还阳签 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 14 | 1 | 0 | 0 | 3 | 3 | 3 | 3 |

</details>

<details>
<summary><b>📘 戒灵师</b></summary>

| 帮鹿 | 帮戒 | 诈戒 | 催鹿 | 帮戒再-1 |
|:---:|:---:|:---:|:---:|:---:|
| 2 | 10 | 5 | 6 | 30% |

</details>

<details>
<summary><b>🔥 卷王鹿</b></summary>

| 帮鹿 | 擂台 | 皇城 | 碰瓷 | 同归 | 安全加成 |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 3 | 8 | 3 | 4 | 2 | +3 |

</details>

<details>
<summary><b>☠️ 叠咒鹿</b></summary>

| 鹿咒 | 冥咒 | 索命 | 群溅 | 献祭 | 同归 |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 7 | 4 | 4 | 3 | 3 | 2 |

</details>

<details>
<summary><b>✨ 福鹿使</b></summary>

| 帮鹿 | 鹿福 | 解福 | 解咒 | 催鹿 |
|:---:|:---:|:---:|:---:|:---:|
| 11 | 6 | 4 | 4 | 5 |

</details>

<details>
<summary><b>🥷 窃光鹿</b></summary>

| 偷鹿 | 碰瓷 | 诈戒 | 倒贴 | 群溅 |
|:---:|:---:|:---:|:---:|:---:|
| 7 | 5 | 5 | 3 | 3 |

</details>

<details>
<summary><b>🌻 向日葵鹿</b></summary>

| 帮鹿 | 鹿福 | 催鹿 | 鹿鸣 | 鹿签 | 借鹿 |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 11 | 6 | 7 | 6 | 4 | 3 |

**向阳@**：催更 +1 · 鹿福 2 层 · 咒回合 −2（不占催鹿/鹿福配额）

</details>

---

## 鹿林天象

**换场**：每日 **00:00 / 12:00** · 全局 Redis · 可配置换场群播（控制台「鹿管配置」）。

| 天象 | emoji | 权重 | 一句话 |
|------|:-----:|:----:|--------|
| 晴朗 | ☀️ | 18 | 鹿死/误伤略降 · 碰瓷/倒贴/鹿签小吉 |
| 细雨 | 🌧️ | 14 | 偷 +18% · 自🦌 +4% |
| 瑞雪 | ❄️ | 12 | 鹿死 −8% · 安全 +1 |
| 雷暴 | ⛈️ | 12 | 鹿死 +12% · 群溅叠咒 +12% |
| 鹿雾 | 🌫️ | 14 | 偷/碰瓷/倒贴大减 |
| 祥风 | 🍃 | 14 | 安全 +2 · 全面小加成 |
| 阴霾 | 🌑 | 12 | 鹿死/误伤 +10% |
| 鹿虹 | 🌈 | 4 | 彩蛋大吉 · 全面减伤 +1 安全 |

指令：`鹿环境` / `天气鹿` · `天象一览` · 特权 `鹿神赐福 [天气]`。巡游 ×1.25、向日葵 ×1.28 与天象 **叠乘**。  
八象 **详情卡** 样例见 [附录 A · 鹿林八象](#鹿林八象详情卡)（运行时按上/下午场各一张预渲染 PNG）。

---

## 核心机制

### 安全区 · 超限 · 鹿死

| 机制 | 数值 |
|------|------|
| 默认安全自 🦌 | 前 **3** 次零鹿死（+ 职业/天象 `safeBonus`） |
| 超限鹿死 | 第 4 次起 **12%**，每多发 **+2.2%** |
| 卷王封顶 | 超限鹿死 **≤ 60%** |
| 帮鹿失手 | **10%** 起（职业修正） |
| 鹿死 | 当日 🦌 绩清零不计榜 · 活人玩法封印 · `帮鹿` 救活 |

### 咒 · 福 · 催更

| 状态 | 规则 |
|------|------|
| **鹿咒** | 每层 +10% 鹿死 · 最多 5 层 / 3 回合 · ≥3 层「天咒」 |
| **鹿福** | 每层 −5% 鹿死 · 最多 3 层 / 3 回合 |
| **催更符** | 对 0 次者下次 +1；催带咒目标 = 咒回合 −1 |
| **互解** | `解鹿咒@` / `解鹿福@`（🦌 友 + 配额） |

### 综合平衡分

与 **鹿况图**、**综合榜**、**0:00 册封** 同源，算法见 [`constants/balanced-score.js`](constants/balanced-score.js)。

### 冥界

| 指令 | 说明 |
|------|------|
| `鹿碑` | 死因 / 凶手 / 丢失次数 |
| `冥鹿咒@` / `索命鹿@` / `托梦鹿@` / `还阳签` | 亡魂玩法 |
| `帮鹿@` | 活人主救场（医师 `愈鹿@` 更强） |

---

## 指令大全

<details>
<summary><b>基础 · 互助 · 数据</b></summary>

| 指令 | 作用 |
|------|------|
| `鹿` / `戒鹿` | 自 🦌 +1 / 自律 −1 |
| `鹿况` / `@ta 鹿况` | 今日鹿况图 |
| `看鹿` / `看鹿6` / `鹿历` / `看鹿历` / `鹿历6` | 月历 / 年历 |
| `添加鹿友@` / `我的鹿友` / `绝交鹿友@` | 🦌 友 |
| `帮鹿@` / `帮戒鹿@` | 代 🦌 / 帮戒 |
| `鹿配额` / `帮鹿次数` / `帮戒鹿次数` | 互助与玩法配额 |
| `鹿皮肤` / `鹿皮肤端午` / `鹿皮肤默认` | 界面主题（免费 · 永久保存） |
| `鹿立绘` | 端午立绘解锁进度 |
| `卷王鹿端午` / `鹿医师端午` 等 | 按职业切换立绘（须解锁 · 与界面独立） |
| `解鹿咒@` / `鹿福@` / `解鹿福@` / `借鹿@` | 咒福互解 / 借鹿 |

</details>

<details>
<summary><b>职业 · 专属技</b></summary>

| 指令 | 作用 |
|------|------|
| `鹿职业` | 八职业一览 |
| `鹿职业卷王` / `鹿职业卡窃光` / `看鹿职业医师` | 静态专精卡（预渲染） |
| `转职卷王` 等八职业 | 转职并当日锁定 |
| `鹿技` | 专属技状态 |
| `鹿巡` / `愈鹿@` / `清规@` / `卷冲` / `咒缚@` / `广福@` / `夜袭@` / `向阳@` | 各职业专属技 |

</details>

<details>
<summary><b>互害 · 对线 · 排行 · 特权</b></summary>

| 指令 | 作用 |
|------|------|
| `偷鹿@` / `鹿咒@` / `献祭鹿@` / `倒贴鹿@` / `催鹿@` / `诈戒` / `鹿鸣` / `群鹿溅` / `碰瓷鹿@` / `抽鹿签` | 恶趣玩法 |
| `擂台鹿@` / `同归鹿尽@` / `皇城鹿` | 对线 PK |
| `鹿榜` / `综合榜` / `奶鹿榜` / `戒师榜` / `救活榜` / `活跃榜` / `卷王榜` / `恶趣榜` 及日/年榜 | 排行榜 |
| `回鹿返照` / `鹿清算` / `大赦众生` / `鹿神赐福` | 特权 |

</details>

> 概率与次数以 [`constants/game.js`](constants/game.js) 及 **`鹿帮助`** 图为准。

---

## 排行榜与鹿王

| 榜单 | 口径 |
|------|------|
| 鹿榜 / 日 / 年 | 净值（**鹿死日不计**） |
| 综合榜 / 鹿王榜 | 综合平衡分 |
| 奶鹿 / 戒师 / 救活 / 活跃 / 卷王 / 恶趣 | 专项统计 |

**0:00 鹿王册封**：昨日 **日榜综合分第一**（可配置群播 · `data/deer_pipe/config.yaml`）。

---

## 数据与配置

| Redis 键 | 用途 |
|----------|------|
| `Yz:deer_pipe:sign` | 月维度签到与玩法 |
| `Yz:deer_pipe:friends` | 🦌 友关系 |
| `Yz:deer_pipe:weather` | 鹿林天象 |
| `Yz:deer_pipe:help_log` | 帮鹿/帮戒日志 |
| `Yz:deer_pipe:king_archive` | 鹿王存档 |

**控制台** → `鹿管配置`：天象/鹿王群播、特权 QQ 等。  
**出图** → 控制台「鹿管配置」→ **优先预渲染图**（默认开）；或编辑 `data/deer_pipe/config.yaml` 的 `render.prefer_prebuilt`。调试实时出图：`DEER_PIPE_FORCE_LIVE_RENDER=1`。

---

## 渲染与预出图

| 类型 | 运行时入口 | 预渲染 / 实时 |
|------|------------|---------------|
| 鹿帮助 | `resolveHelpImages()` | `prebuilt/help/{ui}/page-*.png` |
| 职业一览 | `resolveProfessionCatalogImage()` | 未转职 → `catalog.png`；已转职带配额 → 实时 |
| 番外一览 | `resolveExtraDeerCatalogImage()` | `prebuilt/.../extra-catalog*.png` |
| 静态职业卡 | `resolveProfessionCard(id)` | `prebuilt/profession/{ui}/card-*.png`（非默认立绘 → 实时） |
| 天象详情 | `resolveWeatherDetailImage()` | `prebuilt/weather/{ui}/{id}-am\|pm.png`（鹿神赐福 → 实时） |
| 鹿况 / 月历 / 玩法卡 | 实时 SVG + sharp | — |

**改 UI / 天赋文案 / 布局后**（XRK-Yunzai 根目录或插件目录）：

```bash
cd plugins/yunzai-plugin-deer-pipe && npm run render
```

**一条命令**重新生成：

| 输出目录 | 用途 |
|----------|------|
| `assets/prebuilt/` | Bot 运行时直读（帮助、职业卡、天象、番外） |
| `docs/images/` | README / GitHub 附图（**含鹿况 `status-*.png`、月历、帮助、番外一览**） |

调试实时出图：`DEER_PIPE_FORCE_LIVE_RENDER=1`。

**Git 提交**：`assets/professions/`、`assets/stickers/`、`assets/prebuilt/`、`docs/images/`。**不提交**：`scripts/`（维护脚本）、`assets/_source/`、`assets/_archive/`、`assets/style-ref/`。

新增角色 / 改 UI 的开发清单见 [`.cursor/skills/deer-pipe-dev/SKILL.md`](.cursor/skills/deer-pipe-dev/SKILL.md)。

---

## 项目结构

```
yunzai-plugin-deer-pipe/
├── apps/                 # core / calendar / weather / help …
├── constants/            # commands · profession · help-catalog · weather …
├── utils/                # prebuilt-images · core · profession-render …
├── assets/
│   ├── prebuilt/         # 运行时预渲染 PNG（提交）
│   ├── professions/      # 抠图后立绘（提交；源图在 _source/ 不提交）
│   ├── _source/          # 抠图前品红底（本地，gitignore）
│   └── stickers/         # 抠图后图标（提交）
├── docs/images/          # README 附图（提交，GitHub 展示）
```

---

## 附录 A · Bot 出图样例

> 以下每张图 **仅在本附录出现一次**。`assets/prebuilt/` 为 Bot 运行时预渲染；`docs/images/` 为 README 固定样例（鹿况、月历、玩法卡等带演示数据，**须提交仓库** GitHub 才能显示）。
> **主截图**为 **端午界面主题**；默认主题见 [主题对照](#主题对照默认--端午)。

### 鹿况 · 职业一览 · 说明书（端午主题）

| 今日鹿况 `鹿况` | 八职业一览 `鹿职业` |
|:---:|:---:|
| <img src="./docs/images/status-duanwu.png" alt="今日鹿况·端午主题" width="360"> | <img src="./docs/images/catalog-duanwu.png" alt="八职业一览·端午主题" width="360"> |

| 番外一览 `鹿职业`（第二张图） |
|:---:|
| <img src="./docs/images/extra-catalog-duanwu.png" alt="番外鹿一览·端午主题" width="360"> |

| 鹿帮助 · 活鹿篇 `鹿帮助` | 鹿帮助 · 冥界篇 |
|:---:|:---:|
| <img src="./docs/images/help-duanwu-1.png" alt="帮助活鹿篇·端午主题" width="360"> | <img src="./docs/images/help-duanwu-2.png" alt="帮助冥界篇·端午主题" width="360"> |

### 主题对照（默认 ↔ 端午）

界面主题 **免费切换**；文件名：`docs/images/{类型}-{default|duanwu}.png`。

| 鹿况 | 月历 | 帮助活鹿篇 |
|:---:|:---:|:---:|
| <img src="./docs/images/status-default.png" alt="鹿况·默认" width="200"> | <img src="./docs/images/calendar-default.png" alt="月历·默认" width="200"> | <img src="./docs/images/help-default-1.png" alt="帮助·默认" width="200"> |
| <img src="./docs/images/status-duanwu.png" alt="鹿况·端午" width="200"> | <img src="./docs/images/calendar-duanwu.png" alt="月历·端午" width="200"> | <img src="./docs/images/help-duanwu-1.png" alt="帮助·端午" width="200"> |

### 八职业静态专精卡

指令：`鹿职业{别名}` / `鹿职业卡{别名}` / `看鹿职业{别名}`（与转职别名相同，**不必转职**）。

| 巡游 `鹿职业巡游` | 鹿医师 `鹿职业医师` | 戒灵师 `鹿职业戒师` | 卷王 `鹿职业卷王` |
|:---:|:---:|:---:|:---:|
| <img src="./assets/prebuilt/profession/default/card-ranger.png" alt="巡游鹿" width="200"> | <img src="./assets/prebuilt/profession/default/card-medic.png" alt="鹿医师" width="200"> | <img src="./assets/prebuilt/profession/default/card-ascetic.png" alt="戒灵师" width="200"> | <img src="./assets/prebuilt/profession/default/card-grinder.png" alt="卷王鹿" width="200"> |

| 叠咒 `鹿职业叠咒` | 福鹿使 `鹿职业福鹿使` | 窃光 `鹿职业窃光` | 向日葵 `鹿职业向日葵` |
|:---:|:---:|:---:|:---:|
| <img src="./assets/prebuilt/profession/default/card-curser.png" alt="叠咒鹿" width="200"> | <img src="./assets/prebuilt/profession/default/card-blesser.png" alt="福鹿使" width="200"> | <img src="./assets/prebuilt/profession/default/card-rogue.png" alt="窃光鹿" width="200"> | <img src="./assets/prebuilt/profession/default/card-sunflower.png" alt="向日葵鹿" width="200"> |

### 鹿林八象详情卡

指令：`鹿环境` / `天气鹿`。运行时按 **上午场 / 下午场** 各读一张预渲染 PNG；下图为 **上午场** 样例。

| 晴朗 ☀️ | 细雨 🌧️ | 瑞雪 ❄️ | 雷暴 ⛈️ |
|:---:|:---:|:---:|:---:|
| <img src="./assets/prebuilt/weather/default/sunny-am.png" alt="晴朗" width="200"> | <img src="./assets/prebuilt/weather/default/drizzle-am.png" alt="细雨" width="200"> | <img src="./assets/prebuilt/weather/default/snow-am.png" alt="瑞雪" width="200"> | <img src="./assets/prebuilt/weather/default/storm-am.png" alt="雷暴" width="200"> |

| 鹿雾 🌫️ | 祥风 🍃 | 阴霾 🌑 | 鹿虹 🌈 |
|:---:|:---:|:---:|:---:|
| <img src="./assets/prebuilt/weather/default/fog-am.png" alt="鹿雾" width="200"> | <img src="./assets/prebuilt/weather/default/breeze-am.png" alt="祥风" width="200"> | <img src="./assets/prebuilt/weather/default/gloom-am.png" alt="阴霾" width="200"> | <img src="./assets/prebuilt/weather/default/rainbow-am.png" alt="鹿虹" width="200"> |

### 玩法互动卡（实时出图样例）

| 偷鹿得手 `偷鹿@` | 叠咒 `鹿咒@` |
|:---:|:---:|
| <img src="./docs/images/play-steal-success.png" alt="偷鹿玩法卡" width="360"> | <img src="./docs/images/play-curse.png" alt="叠咒玩法卡" width="360"> |

### 月历样例

指令：`看鹿` / `鹿历6` 等（含用户数据，样式参考 · 端午主题）。

<img src="./docs/images/calendar-duanwu.png" alt="月历样例·端午" width="680">

---

## 附录 B · 贴图与立绘资源

> SVG/PNG 素材，供出图合成使用；**不在正文重复展示**。

### 职业立绘 · `assets/professions/`

一览顶栏横幅：`catalog.png`（见 [八职业一览](#鹿况--职业一览--说明书) 截图）。

| 巡游鹿 | 鹿医师 | 戒灵师 | 卷王鹿 |
|:---:|:---:|:---:|:---:|
| <img src="./assets/professions/ranger.png" width="88" alt="巡游鹿"> | <img src="./assets/professions/medic.png" width="88" alt="鹿医师"> | <img src="./assets/professions/ascetic.png" width="88" alt="戒灵师"> | <img src="./assets/professions/grinder.png" width="88" alt="卷王鹿"> |

| 叠咒鹿 | 福鹿使 | 窃光鹿 | 向日葵鹿 |
|:---:|:---:|:---:|:---:|
| <img src="./assets/professions/curser.png" width="88" alt="叠咒鹿"> | <img src="./assets/professions/blesser.png" width="88" alt="福鹿使"> | <img src="./assets/professions/rogue.png" width="88" alt="窃光鹿"> | <img src="./assets/professions/sunflower.png" width="88" alt="向日葵鹿"> |

端午立绘（`skins/duanwu/`，medic / grinder）— **活动解锁**，非界面主题：

| 解锁 | 条件（端午活动期间） |
|------|------------------------|
| 卷王鹿·端午 | 自🦌 **累计 10 次** 自动赠送 |
| 鹿医师·端午 | 帮鹿 **累计 10 次** 自动赠送 |

活动结束后不可再解锁；已解锁永久保留。切换：`卷王鹿端午` / `鹿医师端午`（须已解锁对应职业）。

| 鹿医师·端午 | 卷王鹿·端午 |
|:---:|:---:|
| <img src="./assets/professions/skins/duanwu/medic.png" width="88" alt="端午鹿医师"> | <img src="./assets/professions/skins/duanwu/grinder.png" width="88" alt="端午卷王鹿"> |

### 帮助 / 鹿况分区贴图 · `assets/stickers/sections/`

| 互助 `help` | 恶趣 `harm` | 擂台 `pvp` |
|:---:|:---:|:---:|
| <img src="./assets/stickers/sections/help.png" width="72" alt="互助"> | <img src="./assets/stickers/sections/harm.png" width="72" alt="恶趣"> | <img src="./assets/stickers/sections/pvp.png" width="72" alt="擂台"> |

用于：鹿帮助节标题、鹿况玩法分区标题等。

### 专属技贴图 · `assets/stickers/skills/`

| 巡游 | 医师 | 戒师 | 卷王 |
|:---:|:---:|:---:|:---:|
| <img src="./assets/stickers/skills/ranger.png" width="64" alt="鹿巡"> | <img src="./assets/stickers/skills/medic.png" width="64" alt="愈鹿"> | <img src="./assets/stickers/skills/ascetic.png" width="64" alt="清规"> | <img src="./assets/stickers/skills/grinder.png" width="64" alt="卷冲"> |

| 叠咒 | 福使 | 窃光 | 向日葵 |
|:---:|:---:|:---:|:---:|
| <img src="./assets/stickers/skills/curser.png" width="64" alt="咒缚"> | <img src="./assets/stickers/skills/blesser.png" width="64" alt="广福"> | <img src="./assets/stickers/skills/rogue.png" width="64" alt="夜袭"> | <img src="./assets/stickers/skills/sunflower.png" width="64" alt="向阳"> |

职业一览顶栏横幅：`assets/professions/catalog.png`（八职业拼版，见 [八职业一览](#鹿况--职业一览--说明书) 截图）。

### 品牌与其它

| 鹿管 Logo | 勾选贴图 |
|:---:|:---:|
| <img src="./assets/deerpipe@100x82.png" width="100" alt="鹿管 Logo"> | <img src="./assets/check@96x100.png" width="72" alt="勾选"> |

字体：`assets/Genshin.ttf`（PostScript 名 `FZBenMoYueYiTiS`，resvg 渲染用）。

---

## 鸣谢与许可

| 来源 | 链接 |
|------|------|
| 原创 nonebot 插件 | [nonebot-plugin-deer-pipe](https://github.com/SamuNatsu/nonebot-plugin-deer-pipe) |
| Yunzai 移植参考 | [yunzai-plugin-deer-pipe](https://github.com/zhiyu1998/yunzai-plugin-deer-pipe) |
| 维护框架 | [XRK-Yunzai](https://github.com/sunflowermm/XRK-Yunzai) |

沿用原插件 **LICENSE**。

---

<div align="center">

**一只鹿管，全村社死** 🦌

发送 **`鹿帮助`** 获取最新玩法图 · Issue / PR 欢迎

</div>
