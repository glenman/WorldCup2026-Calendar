# FIFA World Cup 2026 — 观赛日程表

纯前端世界杯赛程日历，支持**实时比分更新**、**小组积分榜**、**射手榜**、**ICS 日历订阅**，通过 GitHub Pages 静态部署，**GitHub Actions 全自动比分同步**。

在线地址：https://glenman.github.io/WorldCup2026-Calendar/

---

## 功能一览

| 功能 | 状态 | 说明 |
|------|------|------|
| 赛程展示 | ✅ | 72场小组赛，按日期分组，含时间、对阵、场地、轮次 |
| 比分显示 | ✅ | 已结束比赛显示实时比分（从 `matches.json` 动态加载） |
| 小组积分榜 | ✅ | 12组（A-L）自动计算：已赛/胜/平/负/进球/失球/净胜球/积分 |
| 射手榜 | ✅ | 从 `wc2026-goals.json` 加载，按进球数排名，含球员/球队 |
| 球队筛选 | ✅ | 多选球队，高亮赛程，生成专属 ICS |
| ICS 日历下载 | ✅ | 全部赛程 / 选中球队，含场地坐标（GEO） |
| 日历订阅链接 | ✅ | 复制链接后粘贴到日历应用（Apple/Google/Outlook） |
| 响应式布局 | ✅ | 桌面 / 平板 / 手机 自适应 |
| AI 比分录入 | ✅ | 通过 Skill 一句话更新比分（手工方式） |
| API 自动同步 | ✅ | GitHub Actions 每天 08:00/12:00（北京时间）自动从 API 拉取比分、积分、进球 |
| 进球数据 | ✅ | 138+ 个进球记录，含球员、时间、点球/乌龙标注 |

---

## 快速开始

### 本地预览

```bash
cd WorldCup2026-Calendar
python -m http.server 3000
# 浏览器打开 http://localhost:3000/index.html
```

### 更新比分

本项目支持 **两种更新方式**：

#### 方式一：API 全自动同步（推荐）

无需任何手动操作。GitHub Actions 每 3/6/9/12 点（北京时间）自动运行：

```
GitHub Actions 触发
  ├─ node scripts/sync-results.js   ← 拉 API → 更新比分+积分 → 调 build.js
  ├─ node scripts/sync-goals.js     ← 拉 API → 更新进球记录
  └─ git commit + push
```

#### 方式二：Skill 手工录入

在 IDE 中直接说：

```
更新比赛结果 巴西 vs 摩洛哥 3:1
```

AI 会自动调用 `scripts/update-match.js` 完成所有更新。

#### 方式三：命令行

```bash
node scripts/update-match.js "巴西 vs 摩洛哥 3:1"
```

### 一键构建

```bash
node scripts/build.js
```

读取 `data/worldcup2026-matches.json` → 计算积分榜 → 写入 `data/worldcup2026-group_standings.json` + 生成 `worldcup2026.ics`

---

## 项目架构

```
                    worldcup26.ir API
                          │
              ┌───────────┼───────────┐
              ▼                       ▼
      sync-results.js           sync-goals.js
      (比分+积分+状态)           (进球记录)
              │                       │
              ▼                       ▼
        matches.json            wc2026-goals.json
              │                       │
              ▼                       │
          build.js                    │
      (重算积分榜+ICS)                 │
              │                       │
      ┌───────┴───────┐               │
      ▼               ▼               ▼
  standings.json  ics文件        index.html
      │               │          (射手榜Tab)
      └───────┬───────┘
              ▼
        index.html
     (赛程Tab + 积分榜)
```

**核心原则：单一数据源** — `worldcup2026-matches.json` 是唯一的比赛数据源，其他文件都由它派生。

**零依赖** — 纯 Node.js 标准库，无需 npm install，无需数据库，无需后端。

---

## 目录结构

```
WorldCup2026-Calendar/
├── index.html                          # 单文件前端应用（赛程 + 射手榜双Tab）
├── worldcup2026.ics                    # 自动生成的 ICS 日历文件
├── .github/workflows/
│   └── sync-goals.yml                  # GitHub Actions: 定时自动同步比分+进球
├── data/
│   ├── worldcup2026-matches.json       # ★ 比赛数据（72场，唯一数据源）
│   ├── worldcup2026-group_standings.json  # 小组积分榜（自动计算）
│   └── wc2026-goals.json               # 进球记录（从 API 自动同步）
├── scripts/
│   ├── build.js                        # 构建脚本：算积分榜 + 生成 ICS
│   ├── update-match.js                 # 比分更新脚本（手工）：A vs B X:Y
│   ├── sync-results.js                 # API 自动同步：比分+积分（Actions 使用）
│   └── sync-goals.js                   # API 自动同步：进球记录（Actions 使用）
├── docs/
│   ├── Project_spec.md                 # 项目规范文档
│   └── TODO.md                         # 待处理任务清单
├── .trae/skills/
│   └── worldcup-update-result/
│       └── SKILL.md                    # Skill 定义文件
├── archive/                            # 历史备份
└── README.md
```

---

## 自动化同步

### GitHub Actions

Workflow 文件：[.github/workflows/sync-goals.yml](.github/workflows/sync-goals.yml)

**触发时间**（北京时间）：

| 时间 | 说明 |
|------|------|
| 08:00 | 早晨同步 |
| 12:00 | 中午同步 |

> **注意**：cron 表达式为 `0 0,4 * * *`（UTC）。GitHub Actions 的 cron 调度器在 workflow 变更后可能需要一个周期才能生效，偶尔跳过一次属正常现象。如遇未触发，可手动触发（见下方）。

**同步内容**：

| 文件 | 数据来源 | 更新内容 |
|------|---------|---------|
| `worldcup2026-matches.json` | API `home_score`/`away_score` | 比分、积分、状态 |
| `worldcup2026-group_standings.json` | build.js 重算 | 12组积分榜 |
| `worldcup2026.ics` | build.js 重生成 | 日历文件 |
| `wc2026-goals.json` | API `home_scorers`/`away_scorers` | 每场进球记录 |

**数据来源**：`https://worldcup26.ir/get/games`（无需认证）

### 手动触发

如果 cron 未自动触发，可以手动触发 GitHub Actions：

```bash
cd WorldCup2026-Calendar
github workflow run sync-goals.yml
```

或直接访问：https://github.com/glenman/WorldCup2026-Calendar/actions/workflows/sync-goals.yml

---

## 数据格式

### matches.json（数组格式）

```json
[
  {
    "match_number": 1,
    "date_cn": "6月12日",
    "time_cn": "3:00",
    "match_type": "小组赛",
    "round": "第1轮",
    "group": "A组",
    "home_team": {
      "flag": "🇲🇽",
      "name": "墨西哥",
      "score": 2,
      "points": 3
    },
    "away_team": {
      "flag": "🇿🇦",
      "name": "南非",
      "score": 0,
      "points": 0
    },
    "venue": "Mexico City, Mexico",
    "stadium": "阿兹特克球场",
    "status": "已结束"
  }
]
```

### group_standings.json

```json
{
  "A组": {
    "group": "A组",
    "teams": [
      {
        "team": "墨西哥",
        "played": 1, "won": 1, "drawn": 0, "lost": 0,
        "gf": 2, "ga": 0, "gd": 2, "points": 3,
        "standing": 1
      }
    ]
  }
}
```

### wc2026-goals.json

```json
{
  "updated_at": "2026-06-24T...",
  "source": "https://worldcup26.ir/get/games",
  "total_goals": 138,
  "goals": [
    {
      "match_number": 1,
      "group": "A组",
      "round": "第1轮",
      "home_team": "墨西哥",
      "away_team": "南非",
      "team": "墨西哥",
      "team_en": "Mexico",
      "scorer": "J. Quiñones",
      "minute": 9,
      "minute_display": "9'",
      "own_goal": false,
      "penalty": false,
      "half": 1
    }
  ]
}
```

---

## 射手榜

页面顶部 Tab 栏可切换：
- **比赛赛程** — 原有全部功能（赛程、积分榜、筛选、ICS）
- **射手榜** — 从 `wc2026-goals.json` 加载，按进球数降序排名

特性：
- 前三名金银铜奖牌高亮
- 同进球数并列排名
- 点球(p)和乌龙(og)标注
- 移动端自适应

---

## AI Skill 系统

### worldcup-update-result

定义文件：[.trae/skills/worldcup-update-result/SKILL.md](.trae/skills/worldcup-update-result/SKILL.md)

**功能：** 一句话更新世界杯比赛结果

**触发方式：**

```
"更新比赛结果 巴西 vs 摩洛哥 3:1"
"墨西哥 2:0 南非"
```

**实现机制：**

1. AI 检测到用户输入含 "A vs B X:Y" 比分格式
2. 调用 `worldcup-update-result` skill
3. Skill 指示 AI 执行 `node scripts/update-match.js "A vs B X:Y"`
4. 脚本自动完成：
   - 在 `matches.json` 中查找对应比赛（自动判断主客队方向）
   - 更新 `home_team.score`、`away_team.score`、`points`、`status`
   - 自动调用 `build.js` 重新计算所有小组积分榜
   - 重新生成 `worldcup2026.ics`
5. 刷新浏览器即可看到更新

**支持格式：**
- `球队A vs 球队B X:Y`（推荐）
- `球队A X:Y 球队B`（会自动转换）

---

## 部署

1. 本地更新比分 → `node scripts/update-match.js "..."` 或 Skill
2. `git add -A && git commit -m "update scores" && git push origin gh-pages`
3. GitHub Pages 自动部署（1-2 分钟）
4. 在线查看：https://glenman.github.io/WorldCup2026-Calendar/

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | HTML + CSS + Vanilla JS（单文件） |
| 构建 | Node.js（标准库，零 npm 依赖） |
| 数据 | JSON（静态文件） |
| 部署 | GitHub Pages |
| 自动化 | GitHub Actions（定时同步） |
| AI | Trae Skill（worldcup-update-result） |

---

*最后更新：2026-06-24*
