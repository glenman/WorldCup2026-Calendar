# WorldCup2026-Calendar 项目说明文档

## 基本信息

- **项目名称**: FIFA 2026 世界杯观赛日程表
- **GitHub 仓库**: https://github.com/glenman/WorldCup2026-Calendar
- **在线地址**: https://glenman.github.io/WorldCup2026-Calendar/
- **工作目录**: `/Users/glenman/.openclaw/workspace/WorldCup2026-Calendar/`
- **部署分支**: `gh-pages`
- **技术栈**: 纯 HTML/CSS/JavaScript，GitHub Pages 静态部署
- **数据**: 72 场小组赛，48 支球队，12 个小组（A-L），3 个东道主（加拿大、美国、墨西哥）

---

## 项目结构

```
WorldCup2026-Calendar/
├── index.html                    # 单文件应用（所有代码在一个文件中）
├── data/
│   └── worldcup2026-matches.json # 比赛数据 JSON 备份
├── rebuild.sh                    # GitHub Pages 重建脚本
├── README.md                     # 项目说明
└── Project_spec.md               # 本文档
```

---

## 核心功能

### 1. 赛事概览（Summary Banner）

- **位置**: 页面顶部
- **内容**:
  - ⏰ 时间范围（6月12日 - 6月28日）
  - ⏱️ 时区（北京时间）
  - 🏆 总场次（72 场）
  - 📅 比赛天数（17 天）
- **按钮**: 下载全部赛程 ICS、下载 JSON
- **CSS 类**: `.summary-banner`, `.summary-grid`, `.summary-item`

### 2. 赛程展示（Calendar）

- **位置**: 页面主体区域
- **容器**: `<div id="calendar-app"></div>`
- **展示方式**: 按日期分组，每天一个 date-header，下面列出当天所有比赛
- **比赛卡片**: `.match-card` 包含时间、对阵、场地、组别
- **CSS 类**: `.date-header`, `.match-card`, `.group-badge`
- **功能**: 支持按选中球队过滤显示

### 3. 球队选择器（可选功能，版本区分）

> **注意**: 球队选择器功能在多个版本中出现和消失，需注意版本差异。

- **容器**: `<div id="team-selector-section">` 或 `<div class="team-selector-section">`
- **布局**: 积木风格，12 组 × 4 队 = 48 支球队
- **CSS 类**:
  - `.group-selector` - 3列 × 4行 Grid 布局
  - `.group-block` - 每个小组的卡片容器
  - `.group-block-header` - 小组名称（如 "A组"）
  - `.group-block-teams` - 球队列表容器
  - `.group-team-row` - 单个球队行
  - `.selected-summary` - 已选球队摘要
  - `.chip` - 已选球队标签
- **功能**:
  - 多选球队（点击选中/取消）
  - 选中后金色高亮 + 对勾标记
  - 底部显示已选 chip 标签，可点击移除
  - 快捷操作：全选、清空、东道主、豪门
  - 生成订阅链接（含选中球队参数）
  - 下载 ICS 日历文件

---

## 关键技术细节

### 比赛数据格式

```javascript
const MATCHES = {
    "6月12日": [
        {
            "g": "A组",      // 小组
            "m": "🇲🇽 墨西哥 vs 🇿🇦 南非",  // 对阵（含国旗emoji）
            "c": "墨西哥城",  // 城市
            "s": "阿兹特克球场",  // 场地
            "t": "3:00"       // 时间（北京时间）
        },
        // ...更多比赛
    ],
    // ...更多日期
};
```

- 共 17 个日期键（6月12日 - 6月28日）
- 共 72 场比赛
- 国旗使用 Unicode emoji（🇲🇽🇿🇦🇰🇷 等）

### 球队选择器（完整版本）

```javascript
const FLAG_MAP = {
    '墨西哥': '🇲🇽', '南非': '🇿🇦', '韩国': '🇰🇷', '捷克': '🇨🇿',
    // ... 48 支球队
};
const HOST_TEAMS = ['墨西哥', '加拿大', '美国'];
const FAN_FAVORITES = ['巴西', '法国', '德国', '阿根廷', '西班牙', '英格兰', '葡萄牙', '意大利'];
let selectedTeams = new Set();
```

### 核心函数

| 函数名 | 功能 |
|--------|------|
| `toggleTeam(el, name)` | 切换球队选中状态 |
| `updateChips()` | 更新已选球队 chip 标签 |
| `removeTeam(name)` | 移除已选球队 |
| `selectAll()` | 全选所有球队 |
| `deselectAll()` | 清空所有选择 |
| `selectAllHost()` | 选择东道主球队 |
| `selectAllFavorites()` | 选择豪门球队 |
| `generateAndCopyLink()` | 生成订阅链接并复制到剪贴板 |
| `downloadSelectedICS()` | 下载选中球队的 ICS 文件 |
| `renderCalendar(filteredMatches)` | 渲染赛程（支持过滤） |
| `getSelectedMatches()` | 获取选中球队的比赛 |

### URL 参数

- `?teams=墨西哥,巴西,美国` - 通过 URL 参数预加载选中球队
- 页面初始化时调用 `initFromURL()` 读取参数

---

## 版本历史与关键提交

| Commit | 说明 | 重要性 |
|--------|------|--------|
| `8dcf973` | 不含球队选择器的版本 | ✅ 基础版本（推荐） |
| `85b1c4e` | 新增强化版球队选择器 | ⚠️ 曾导致页面布局问题 |
| `9822468` | 积木风格小组选择器 | ⚠️ 布局问题版本 |
| `5e95a14` | 恢复 85b1c4e | ⚠️ 临时恢复 |
| `70f24fc` | 最终版本（不含选择器） | ✅ 当前推荐 |

**推荐**: 使用 `8dcf973` 或 `70f24fc` 作为基础版本。

---

## 常见修改操作

### 1. 修改赛事概览字体

```css
.summary-banner h2 {
    font-size: 1.5rem;          /* 标题大小 */
    white-space: nowrap;        /* 防止换行 */
}
.summary-item .label {
    font-size: 0.65rem;         /* 标签大小 */
    white-space: nowrap;        /* 防止换行 */
}
.summary-item .value {
    font-size: 1rem;            /* 数值大小 */
    white-space: nowrap;        /* 防止换行 */
}
```

### 2. 修改球队选择器（如需添加）

```html
<!-- 在 </style> 和 <div id="calendar-app"> 之间添加 -->
<div class="team-selector-section">
    <h3>🎯 选择关注球队</h3>
    <div class="group-selector">
        <div class="group-block">
            <div class="group-block-header">A组</div>
            <div class="group-block-teams">
                <div class="group-team-row" onclick="toggleTeam(this, '墨西哥')">
                    <span class="check-mark">✓</span>
                    <span class="team-flag">🇲🇽</span>
                    <span class="team-name">墨西哥</span>
                </div>
                <!-- 更多球队 -->
            </div>
        </div>
        <!-- 更多小组 -->
    </div>
</div>
```

### 3. 推送更新

```bash
cd /Users/glenman/.openclaw/workspace/WorldCup2026-Calendar
git add -A
git commit -m "你的修改说明"
git config http.proxy http://127.0.0.1:7898
git config https.proxy http://127.0.0.1:7898
git config http.version HTTP/1.1
git push --force origin gh-pages
```

### 4. 恢复指定版本

```bash
cd /Users/glenman/.openclaw/workspace/WorldCup2026-Calendar
git checkout <commit-hash> -- index.html
git add -A
git commit -m "Restore to <commit-hash>"
git push --force origin gh-pages
```

---

## 已知问题与解决方案

### 1. GitHub Pages 缓存

- **现象**: 修改后页面不更新
- **解决**: 
  - 浏览器强制刷新: `Cmd + Shift + R`（Mac）或 `Ctrl + F5`（Windows）
  - 添加 cache-busting 注释到 `</head>`
  - 等待 1-2 分钟自动刷新

### 2. 球队选择器布局问题

- **现象**: 页面只能看到选择器，赛程部分被遮挡
- **原因**: `.group-block` 和 `.group-block-teams` 没有设置最大高度
- **解决**:
  ```css
  .group-block {
      max-height: 350px;
      overflow: hidden;
  }
  .group-block-teams {
      max-height: 280px;
      overflow-y: auto;
  }
  ```

### 3. HTML 结构错误

- **现象**: 页面空白
- **原因**: 缺少 `</head>`, `<body>`, `</body>` 等关键标签
- **解决**: 使用 `git checkout <commit> -- index.html` 恢复干净版本

### 4. Python 字符串拼接问题

- **现象**: `write` 工具验证失败
- **原因**: Python 字符串中 `"` 被误解为连接符
- **解决**: 改用 `exec` + Python 脚本生成文件

---

## 部署流程

1. **本地修改**: 在 `index.html` 中修改
2. **本地验证**: 确保 HTML 结构完整、功能正常
3. **Git 提交**: `git add -A && git commit -m "..."`
4. **推送**: `git push --force origin gh-pages`
5. **等待部署**: GitHub Pages 自动构建（1-2 分钟）
6. **强制刷新**: `Cmd + Shift + R` 清除浏览器缓存

---

## 代理配置

如果网络受限，需要配置 HTTP 代理：

```bash
git config http.proxy http://127.0.0.1:7898
git config https.proxy http://127.0.0.1:7898
git config http.version HTTP/1.1
```

---

## 数据源

- **FIFA 2026 官方赛程**: 72 场小组赛
- **比赛数据**: `data/worldcup2026-matches.json`
- **国旗 emoji**: Unicode emoji（无需外部资源）
- **部署**: GitHub Pages（免费静态托管）

---

## 联系方式

- **仓库所有者**: Glenman
- **仓库地址**: https://github.com/glenman/WorldCup2026-Calendar
- **文档**: 项目根目录 `README.md`

---

*最后更新: 2026-06-08*
