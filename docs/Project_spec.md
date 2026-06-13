# WorldCup2026-Calendar 项目规范文档

## 基本信息

- **项目名称**: FIFA 2026 世界杯观赛日程表
- **GitHub 仓库**: https://github.com/glenman/WorldCup2026-Calendar
- **在线地址**: https://glenman.github.io/WorldCup2026-Calendar/
- **工作目录**: `d:\Workspace\WorldCup2026-Calendar\`
- **部署分支**: `gh-pages`
- **技术栈**: 纯 HTML/CSS/JavaScript（前端），Node.js 标准库（构建脚本），GitHub Pages 静态部署
- **数据**: 72 场小组赛，48 支球队，12 个小组（A-L），3 个东道主（加拿大、美国、墨西哥）

---

## 项目结构

```
WorldCup2026-Calendar/
├── index.html                              # 单文件应用（前端展示 + 所有 JS/CSS）
├── worldcup2026.ics                        # ★ 自动生成的 ICS 日历文件
├── data/
│   ├── worldcup2026-matches.json           # ★ 比赛数据（72场，唯一数据源）
│   └── worldcup2026-group_standings.json   # ★ 小组积分榜数据（从 matches 自动计算）
├── scripts/
│   ├── build.js                            # 构建脚本：计算积分榜 + 生成 ICS
│   └── update-match.js                     # 比分更新：解析 "A vs B X:Y" → 全链路更新
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

## 数据流架构（v2.0 当前实现）

```
              ┌─────────────────────────┐
              │   AI Skill 自然语言输入   │
              │  "巴西 vs 摩洛哥 3:1"    │
              └───────────┬─────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │  update-match.js     │
              │  · 解析 A vs B X:Y   │
              │  · 匹配主客队         │
              │  · 写入 score/points  │
              │  · 更新 status        │
              └──────────┬───────────┘
                         │
                         ▼
         ┌───────────────────────────┐
         │ worldcup2026-matches.json │ ◄── 单一数据源（数组格式）
         └─────────────┬─────────────┘
                       │
          ┌────────────┴────────────┐
          │  build.js               │
          │  · 读取 matches.json    │
          │  · 循环计算 12 组积分    │
          │  · 排序（积分→净胜→进球）│
          │  · 生成 ICS 日历文件    │
          └─────────┬───────────────┘
                    │
          ┌─────────┴──────────┐
          ▼                    ▼
group_standings.json    worldcup2026.ics
          │                    │
          └─────────┬──────────┘
                    ▼
              index.html
          (fetch JSON → render)
```

### 核心原则

- **单一数据源**: `worldcup2026-matches.json` 是唯一可编辑的数据文件
- **自动派生**: `group_standings.json` 和 `worldcup2026.ics` 由 `build.js` 自动生成
- **零依赖**: 全部使用 Node.js 标准库（fs、path），无需 npm install
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
5. **TODO**: 淘汰赛阶段（当前仅小组赛）
6. **TODO**: 积分榜更多字段展示（已赛/胜/平/负/净胜球）
7. **TODO**: 实时比赛中的状态标记（进行中/半场）
8. **TODO**: 比赛卡片点击展开详情（阵容、进球时间等）

---

## 部署流程

1. **本地更新**: Skill 或 `node scripts/update-match.js "..."` 更新比分
2. **本地验证**: `python -m http.server 3000` 查看 index.html
3. **Git 提交**: `git add -A && git commit -m "update scores"`
4. **推送**: `git push origin gh-pages`
5. **线上访问**: https://glenman.github.io/WorldCup2026-Calendar/
6. **更新订阅**: 已在日历中订阅的用户会自动同步 `worldcup2026.ics`

---

*最后更新: 2026-06-13*
