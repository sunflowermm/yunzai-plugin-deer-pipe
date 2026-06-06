# 🦌管插件 (yunzai-plugin-deer-pipe)

<div align="center">
  <img src="./assets/deerpipe@100x82.png" alt="Logo" height="120">
  <br><br>
  <strong>向日葵 / XRK-Yunzai 维护版</strong>
</div>

版本：1.4.0-sunflower

## 关于本分支

本仓库为 **向日葵 / XRK-Yunzai 维护版本**。在原作者 nonebot-plugin-deer-pipe 及 Yunzai 移植版基础上改造，**签到数据仅存 Redis**，不写入插件目录；面板、排行榜、🦌历等使用 **本地资源 + Puppeteer / Sharp 渲染**。

- 数据按 `YYYY-MM` **永久保留**，支持旧格式自动迁移
- 自🦌每日安全 **3** 次；超限后鹿死概率 **10% 起、每多发 +2% 递增**；帮🦌误伤/拉下马 **固定 15%**；帮戒🦌 **30% 失手**（仍扣配额）
- **鹿死**当日次数清零且不计榜；🦌死状态下**不可帮他人**；🦌友可 `帮🦌` 救活
- 一次添加🦌友即**双向结缘**，双方互见名单、可互相帮🦌/帮戒🦌/救活，无需互相添加
- **鹿死**状态下：不可自🦌/戒🦌/帮他人/同归鹿尽/帮戒🦌/皇城鹿；可查看🦌况/面板/排行榜，等🦌友「帮🦌」救活
- **同归鹿尽**、**帮戒🦌**、**皇城鹿**（框架上下文猜大小 PK 日榜第一）
- 特权 QQ `1814632762` 可用 **回鹿返照**（清空今日全部数据）、**皇城清算**（全员重置当日皇城鹿机会）

## 安装

在 Yunzai / XRK-Yunzai 根目录执行：

```bash
git clone --depth=1 https://github.com/sunflowermm/yunzai-plugin-deer-pipe ./plugins/yunzai-plugin-deer-pipe/
pnpm i --filter=yunzai-plugin-deer-pipe
```

## 功能概览

| 分类 | 指令示例 |
|------|----------|
| 签到 | `🦌` `🦌况` `看🦌` `看🦌6` `看🦌2025-06` |
| 戒🦌 | `戒🦌` `帮戒🦌@某人`（每日 3 次，可扣至负数） |
| 排行 | `🦌榜` `🦌日榜` `🦌年榜` `戒🦌榜` `戒鹿日榜` |
| 玩法 | `同归鹿尽@某人` `皇城鹿`（宣战者 90 秒内私回复大/小，每人独立上下文） |
| 特权 | `回鹿返照` `皇城清算`（仅 QQ 1814632762） |
| 🦌历 | `🦌历` `看🦌历` `🦌历6` |
| 🦌友 | `添加🦌友@某人`（一次添加双向结缘）`绝交🦌友@某人` `帮🦌@某人` `帮戒🦌@某人` `我的🦌友` |

**规则摘要**：帮🦌/帮戒🦌各 **3** 次/日 · 帮🦌误伤/拉下马 **15%** · 帮戒失手 **30%** · 同归鹿尽/皇城鹿各 **1** 次/日 · 皇城鹿挑战者赢扣鹿王 5 次、输扣自己 3 次且鹿王 +3 次 · 骰子 4-6 为大、1-3 为小。

## 数据与资源说明

| 项 | 说明 |
|------|------|
| Redis `Yz:deer_pipe:sign` | 签到与月维度游戏数据（自动从旧键 `Yz:deer_pipe:core:sign` 迁移） |
| Redis `Yz:deer_pipe:friends` | 🦌友关系（一次添加、双向结缘） |
| `assets/` | 面板图标、MiSans 字体等本地静态资源 |
| `resources/html/` | 排行榜、🦌友列表等 Puppeteer 模板 |
| `utils/core.js` | 月历 / 年历 Sharp 渲染 |

## 原作者与鸣谢

- 创意与上游：[nonebot-plugin-deer-pipe](https://github.com/SamuNatsu/nonebot-plugin-deer-pipe)（@SamuNatsu）
- Yunzai 移植参考：[yunzai-plugin-deer-pipe](https://github.com/zhiyu1998/yunzai-plugin-deer-pipe) 等社区版本
- [向日葵插件](https://github.com/sunflowermm/XRK-plugin)
- [XRK-Yunzai](https://github.com/sunflowermm/XRK-Yunzai)

## 许可

沿用原插件 LICENSE；二次修改部分遵循 XRK-Yunzai 社区维护约定。
