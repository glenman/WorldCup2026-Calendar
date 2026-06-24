# WorldCup2026-Calendar 项目规范文档

## 基本信息

- **项目名称**: FIFA 2026 世界杯观赛日程表
- **GitHub 仓库**: https://github.com/glenman/WorldCup2026-Calendar
- **在线地址**: https://glenman.github.io/WorldCup2026-Calendar/
- **工作目录**: `d:\Workspace\WorldCup2026-Calendar\`
- **部署分支**: `gh-pages`
- **技术栈**: 纯 HTML/CSS/JavaScript（前端），Node.js 标准库（构建脚本），GitHub Pages 静态部署
- **数据**: 72 场小组赛，48 支球队，12 个小组（A-L），3 个东道主（加拿大、美国、墨西哥）
- **自动化**: GitHub Actions 定时从 API 自动同步比分、积分榜、进球记录

---

## 项目结构

```
WorldCup2026-Calendar/
├── index.html                              # 单文件应用（前端展示 + 所有 JS/CSS，含赛程/射手榜双Tab）
├── worldcup2026.ics                        # ★ 自动生成的 ICS 日历文件
├── .github/workflows/
│   └── sync-goals.yml                      # GitHub Actions: 定时自动同步比分+进球
├── data/
│   ├── worldcup2026-matches.json           # ★ 比赛数据（72场，唯一数据源）
│   ├── worldcup2026-group_standings.json   # ★ 小组积分榜数据（从 matches 自动计算）
│   └── wc2026-goals.json                   # ★ 进球记录（从 API 自动同步）
├── scripts/
│   ├── build.js                            # 构建脚本：计算积分榜 + 生成 ICS
│   ├── update-match.js                     # 比分更新：解析 "A vs B X:Y" → 全链路更新
│   ├── sync-results.js                     # API 自动同步：比分+积分+状态+调 build.js
│   └── sync-goals.js                       # API 自动同步：进球记录解析+写入
├── docs/
│   ├── Project_spec.md                     # 本文档
│   └── TODO.md                             # 待处理任务清单
├── .trae/skills/
│   └── worldcup-update-result/
│       └── SKILL.md                        # AI Skill 定义：比分更新
├── archive/                                # 历史备份
├── index.html.backup                       # 构造时的备份
├── test-width.html                         # 宽度测试页
├── TODO.md                                 # 待处理任务清单
└── README.md                               # 项目首页说明
```

---

## 数据流架构（v3.0 当前实现）

### API 自动化同步（主要方式）

```
                    worldcup26.ir API
                     (无需认证)
                          │
              ┌───────────┼───────────┐
              ▼                       ▼
      sync-results.js           sync-goals.js
      · 拉取比赛数据             · 拉取比赛数据
      · 匹配球队+比分           · 解析进球字符串
      · 更新 score/points       · 球员名归一化
      · 更新 status             · 英→中队名映射
      · 调用 build.js           · 写入 wc2026-goals.json
              │                       │
              ▼                       ▼
        matches.json            wc2026-goals.json
              │
              ▼
          build.js
      · 读取 matches.json
      · 循环计算 12 组积分
      · 排序（积分→净胜→进球）
      · 生成 ICS 日历文件
              │
      ┌───────┴───────┐
      ▼               ▼
standings.json    worldcup2026.ics
      │               │
      └───────┬───────┘
              ▼
        index.html
    · 赛程Tab: matches + standings
    · 射手榜Tab: wc2026-goals
```

### 手工 Skill 方式（辅助）

```
   AI Skill 自然语言输入
  "巴西 vs 摩洛哥 3:1"
            │
            ▼
    update-match.js
    · 解析 A vs B X:Y
    · 匹配主客队
    · 写入 score/points
    · 调用 build.js
            │
            ▼
      matches.json → build.js → standings + ICS
```

### 核心原则

- **单一数据源**: `worldcup2026-matches.json` 是唯一可编辑的比赛数据文件
- **自动派生**: `group_standings.json` 和 `worldcup2026.ics` 由 `build.js` 自动生成
- **全自动同步**: GitHub Actions 定时从 API 拉取数据，无需人工干预
- **零依赖**: 全部使用 Node.js 标准库（fs、path、https），无需 npm install
- **静态部署**: 所有文件为静态 JSON/ICS/HTML，通过 GitHub Pages 直接托管

---

## 核心功能

### 1. 赛程展示

- 按日期分组展示，每天一个 date-header
- 比赛卡片含：时间、国旗、球队名、比分（已结束时）、场地、组别、轮次
- 数据源：`data/worldcup2026-matches.json`（前端通过 `fetch()` 加载）
- 72 场小组赛，17 个比赛日（6月12日 - 6月28日）

### 2. 比分显示

- 已结束比赛（`status: "已结束"`）在卡片上显示比分（如 `2:0`）
- 比分格式：`home_team.score : away_team.score`
- 单场积分：胜 3 分、平 1 分、负 0 分，记录在 home/away team 的 `points` 字段

### 3. 小组积分榜

- 12 组（A-L）各有独立的 standings table
- 显示字段：球队名、积分
- 完整数据（`group_standings.json`）：played / won / drawn / lost / gf / ga / gd / points / standing
- 排序规则：积分 → 净胜球 → 进球数
- HTML 元素：`<tbody id="standings-body-X组">` 通过 JS 动态填充

### 4. 球队选择器

- 12 组 × 4 队，积木式网格布局
- 点击选中/取消，金色高亮 + ✓ 标记
- 快捷按钮：全选、清空、东道主（🇲🇽 🇨🇦 🇺🇸）、热门球队
- 选中后过滤赛程，可下载选中球队专属 ICS
- URL 参数支持：`?teams=墨西哥,巴西`

### 5. ICS 日历

- **全部赛程 ICS**: `worldcup2026.ics`（静态文件，由 build.js 生成）
- **前端动态 ICS**: 选中球队后 JavaScript 动态生成 Blob 并下载
- ICS 内容含：SUMMARY（比分或对阵）、DESCRIPTION（组别+场地+比分）、LOCATION（地址）、GEO（坐标）、X-APPLE-STRUCTURED-LOCATION
- 订阅链接：`webcal://` 和 `https://` 两种格式，支持复制到剪贴板

### 6. AI Skill — 比分更新

- **Skill 名称**: `worldcup-update-result`
- **定义文件**: `.trae/skills/worldcup-update-result/SKILL.md`
- **触发方式**: 用户输入含 "A vs B X:Y" 格式的比分
- **执行链路**: Skill → `scripts/update-match.js` → `build.js` → 完整更新

### 7. 射手榜

- 页面顶部 Tab 栏可切换 "比赛赛程" / "射手榜"
- 数据源：`data/wc2026-goals.json`（由 sync-goals.js 自动同步）
- 按进球数降序排名，同进球数并列
- 前三名金银铜奖牌高亮
- 点球(p)和乌龙(og)标注
- 球员名归一化处理（L. Messi = Lionel Messi, K. Mbappé = Kylian Mbappé 等）
- 移动端自适应布局

### 8. API 自动化同步

- **触发**: GitHub Actions 定时（北京时间 3/6/9/12 点）
- **比分同步**: `sync-results.js` 从 API 拉取 → 匹配球队 → 更新 score/points/status → 调用 build.js
- **进球同步**: `sync-goals.js` 从 API 拉取 → 解析进球字符串 → 球员名归一化 → 写入 wc2026-goals.json
- **数据源**: `https://worldcup26.ir/get/games`（无需认证）
- **球队映射**: 48 支球队英文↔中文双向映射（含 `USA`/`United States` 双写兼容）
- **智能匹配**: `findMatch()` 自动处理主客队反转，无需关心 API 球队顺序
- **增量更新**: 仅当数据变化时写入文件，避免不必要的 Git 提交

---

## 数据格式

### matches.json（数组格式，v2.0 实现）

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
        "standing": 1,
        "played": 1, "won": 1, "drawn": 0, "lost": 0,
        "gf": 2, "ga": 0, "gd": 2, "points": 3
      }
    ]
  }
}
```

### 状态判断

- `"已结束"`: 比分已录入
- `"未开始"`: 比分未录入

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

每个进球记录字段说明：
- `match_number`: 赛程编号（对应 matches.json）
- `team` / `team_en`: 进球方中文 / 英文队名
- `scorer`: 球员名（已归一化）
- `minute` / `minute_display`: 进球分钟数 / 显示文本
- `own_goal` / `penalty`: 乌龙球 / 点球标记
- `half`: 半场（1=上半场, 2=下半场）

---

## Skill 系统说明

### worldcup-update-result

这是为本项目定制的 AI Skill，让用户在 IDE 中通过自然语言更新比分。

**定义文件**: `.trae/skills/worldcup-update-result/SKILL.md`

**Skill 文件结构**（Markdown + YAML frontmatter）:

```markdown
---
name: "worldcup-update-result"
description: "Update World Cup match results..."
---

# Skill 标题

触发条件、执行步骤、示例
```

**执行机制**:

1. 用户在 IDE 中输入含比分的自然语言
2. AI 检测到 `worldcup-update-result` skill 的触发条件
3. AI 读取 `SKILL.md` 获取执行指令
4. AI 执行 `node scripts/update-match.js "球队A vs 球队B X:Y"`
5. `update-match.js` 完成数据更新 → 调用 `build.js` → 全链路完成
6. AI 向用户回报结果

**支持输入格式**:
| 输入样式 | 示例 |
|---------|------|
| 标准 vs 格式 | `更新比赛结果 巴西 vs 摩洛哥 3:1` |
| 简化 vs 格式 | `墨西哥 2:0 南非` |
| 无 vs 格式 | `巴西 3:1 摩洛哥`（自动转换） |

**设计优势**:
- 无需记住命令或文件路径
- 自动判断主客队方向（输入顺序可随意）
- 一次性完成比分→积分榜→ICS的全链路更新

---

## 构建脚本

### build.js

```
node scripts/build.js
```

功能：
1. 读取 `data/worldcup2026-matches.json`
2. 遍历所有比赛，按小组累计每队 played/won/drawn/lost/gf/ga/gd/points
3. 按积分→净胜球→进球排序
4. 写入 `data/worldcup2026-group_standings.json`
5. 生成 `worldcup2026.ics`（含 72 场比赛，已结束场次含比分）

### update-match.js

```
node scripts/update-match.js "球队A vs 球队B X:Y"
```

功能：
1. 正则解析 `"A vs B X:Y"` 格式
2. 在 matches.json 中查找对应比赛（自动判断主客队方向）
3. 更新 score、points、status
4. 写入 matches.json
5. 自动调用 `build.js` 完成全链路

### sync-results.js (API 自动同步)

```
node scripts/sync-results.js
# 或: node scripts/sync-results.js --ci  (跳过 git 操作)
```

功能：
1. 从 `https://worldcup26.ir/get/games` 拉取比赛数据
2. 通过 48 队 TEAM_MAP 将英文队名映射为中文
3. `findMatch()` 双向匹配 API 比赛与 matches.json（支持主客队反转）
4. 比对 home_score/away_score，仅当变化时更新
5. 自动设置 status（已结束/未开始）
6. 调用 `build.js` 重算积分榜 + 重新生成 ICS
7. GitHub Actions 中带 `--ci` 参数运行（跳过 git add/commit/push）

### sync-goals.js (进球数据自动同步)

```
node scripts/sync-goals.js
```

功能：
1. 从 `https://worldcup26.ir/get/games` 拉取比赛数据
2. 解析 `home_scorers` / `away_scorers` 字符串（格式：`"Messi 23(p), Di Maria 60"`）
3. 球员名归一化（`NAME_NORMALIZE` 映射表 + 同队首字母+姓氏匹配）
4. 判断点球(p)、乌龙(og)标记
5. 写入 `data/wc2026-goals.json`

---

## GitHub Actions 自动化

Workflow 文件：[`.github/workflows/sync-goals.yml`](../.github/workflows/sync-goals.yml)

### 触发时间（北京时间）

| 时间 | 说明 |
|------|------|
| 03:00 | 凌晨场次结束后 |
| 06:00 | 早晨场次结束后 |
| 09:00 | 上午场次结束后 |
| 12:00 | 下午补充同步 |

### 执行流程

```
GitHub Actions 触发 (每3小时)
  │
  ├─ 1. Checkout gh-pages 分支
  ├─ 2. node scripts/sync-results.js --ci
  │     └─ 拉API → 更新matches → 调build.js → 生成standings + ICS
  ├─ 3. node scripts/sync-goals.js
  │     └─ 拉API → 解析进球 → 写入wc2026-goals.json
  └─ 4. git commit + push
        └─ 提交 4 个文件: matches.json, standings.json, .ics, goals.json
```

### 同步文件一览

| 文件 | 更新脚本 | 数据来源 |
|------|---------|---------|
| `data/worldcup2026-matches.json` | sync-results.js | API home_score/away_score |
| `data/worldcup2026-group_standings.json` | build.js（由 sync-results 调用） | matches.json 重算 |
| `worldcup2026.ics` | build.js（同上） | matches.json 重生成 |
| `data/wc2026-goals.json` | sync-goals.js | API home_scorers/away_scorers |

---

## 关键代码位置（index.html）

| 功能 | 行号区域 |
|------|----------|
| 全局数据变量 | ALL_MATCHES, STANDINGS_DATA |
| renderCalendar() | ~1097 |
| renderAllStandings() | ~1244 |
| generateICS() | ~1106 |
| getTeamMatches() | ~1099 |
| onTeamChange() | ~1229 |
| toggleTeam() | 球队多选逻辑 |
| DOMContentLoaded | ~1258（fetch JSON 入口） |
| FLAG_MAP | ~1284 |
| 积分榜 CSS | ~138-159 |
| 场地坐标 STADIUM_GEO | 构建在 build.js 中 |

---

## 已知问题 & 优化方向

1. ~~MATCHES 数据硬编码~~ → ✅ 已改为 fetch JSON
2. ~~积分榜仅 A组~~ → ✅ 12组全部实现
3. ~~比分格式不规范~~ → ✅ 统一使用 home_team/away_team.score
4. ~~需要手动编辑 JSON~~ → ✅ Skill + update-match.js
5. ~~手动更新比分~~ → ✅ GitHub Actions API 全自动同步
6. ~~缺少进球数据~~ → ✅ sync-goals.js + 射手榜
7. **TODO**: 淘汰赛阶段（当前仅小组赛）
8. **TODO**: 积分榜更多字段展示（已赛/胜/平/负/净胜球）
9. **TODO**: 实时比赛中的状态标记（进行中/半场）
10. **TODO**: 比赛卡片点击展开详情（阵容、进球时间等）

---

## 部署流程

比分和进球数据由 GitHub Actions 自动同步，无需手动部署：

1. **自动同步**: GitHub Actions 每 3/6/9/12 点自动拉取 API 数据
2. **自动构建**: sync-results.js → build.js → standings + ICS
3. **自动部署**: git push 到 gh-pages 分支 → GitHub Pages 自动发布
4. **线上访问**: https://glenman.github.io/WorldCup2026-Calendar/
5. **更新订阅**: 日历订阅用户自动同步 `worldcup2026.ics`

如需手动部署：
1. **本地更新**: Skill 或 `node scripts/update-match.js "..."` 更新比分
2. **本地验证**: `python -m http.server 3000` 查看 index.html
3. **Git 提交**: `git add -A && git commit -m "update scores"`
4. **推送**: `git push origin gh-pages`

---

*最后更新: 2026-06-24*
