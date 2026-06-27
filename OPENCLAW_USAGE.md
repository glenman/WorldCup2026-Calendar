# OpenClaw 使用说明

## 项目概览

**WorldCup2026-Calendar** 是一个纯前端的世界杯赛程日历项目，通过 GitHub Pages 静态部署，GitHub Actions 自动同步比分数据。

- **在线地址**：https://glenman.github.io/WorldCup2026-Calendar/
- **本地路径**：`/Users/glenman/.openclaw/workspace/WorldCup2026-Calendar/`
- **GitHub**：https://github.com/glenman/WorldCup2026-Calendar

---

## 常用操作

### 1. 手动触发 GitHub Actions（同步比分）

当 cron 未自动触发时，让小龙虾帮你触发：

```
小龙虾，帮我触发一下世界杯项目的 GitHub Action
```

或者我也可以直接执行：
```bash
cd /Users/glenman/.openclaw/workspace/WorldCup2026-Calendar
gh workflow run sync-goals.yml
```

### 2. 更新比赛比分（手工方式）

```
小龙虾，更新比赛结果 巴西 vs 摩洛哥 3:1
```

我会自动执行：
```bash
cd /Users/glenman/.openclaw/workspace/WorldCup2026-Calendar
node scripts/update-match.js "巴西 vs 摩洛哥 3:1"
```

### 3. 查看项目状态

```
小龙虾，世界杯项目最近一次同步是什么时候？
```

我会检查：
```bash
cd /Users/glenman/.openclaw/workspace/WorldCup2026-Calendar
gh run list --workflow=sync-goals.yml --limit 5
```

### 4. 本地预览

```
小龙虾，帮我本地启动世界杯项目
```

我会执行：
```bash
cd /Users/glenman/.openclaw/workspace/WorldCup2026-Calendar
python -m http.server 3000
```

---

## 自动化说明

### GitHub Actions Cron

- **Cron 表达式**：`0 0,4 * * *`（UTC）
- **北京时间**：08:00 和 12:00
- **触发文件**：`.github/workflows/sync-goals.yml`
- **同步内容**：比分、积分榜、进球记录、ICS 日历

### 常见问题

**Q: cron 没自动触发怎么办？**
A: 手动触发即可。跟我说"帮我触发一下世界杯的 GitHub Action"就行。

**Q: 为什么有时候会跳过？**
A: GitHub Actions 的 cron 调度器在 workflow 变更后可能需要一个周期才能生效，偶尔跳过一次是正常现象。

**Q: 数据多久更新一次？**
A: 正常情况下每天 08:00 和 12:00 自动更新。如果比赛期间需要更频繁更新，可以手动触发。

---

## 文件结构

```
WorldCup2026-Calendar/
├── index.html                          # 前端应用
├── worldcup2026.ics                    # ICS 日历文件
├── .github/workflows/sync-goals.yml    # GitHub Actions 配置
├── data/
│   ├── worldcup2026-matches.json       # 比赛数据（唯一数据源）
│   ├── worldcup2026-group_standings.json  # 积分榜
│   └── wc2026-goals.json               # 进球记录
├── scripts/
│   ├── build.js                        # 构建脚本
│   ├── update-match.js                 # 手工更新比分
│   ├── sync-results.js                 # API 同步比分
│   └── sync-goals.js                   # API 同步进球
└── OPENCLAW_USAGE.md                   # 本文件
```

---

*最后更新：2026-06-27*
