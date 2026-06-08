# WorldCup2026-Calendar 处理记录

## 当前分支
- **分支**: `gh-pages` (GitHub Pages 部署源)
- **仓库**: https://github.com/glenman/WorldCup2026-Calendar
- **页面**: https://glenman.github.io/WorldCup2026-Calendar/index-new.html

## 最新 commit
```
1b9ccdc Fix: GEO in ICS + subscribe URL input+button + initFromURL marks
```

## 已完成修改

### 1. 球队选择器组件 (`index-new.html`)
- 基于 `index_backup_2026-06-08.html` 提取，合并到基线版本
- 12 组 × 4 队 = 48 支球队
- 点击选中 → 金色高亮 + ✓ 标记
- 底部 chip 标签显示已选球队
- 快捷操作：全选 / 清空 / 东道主 / 豪门

### 2. 布局修改
- **移除了分类标签**（种子队/第2档等），每组合并显示4支球队
- **响应式 Grid 布局**:
  - 桌面端/竖屏: 3 列 × 4 行
  - 横屏 (≥768px): 6 列 × 2 行
  - 手机小屏 (≤480px): 2 列
- 紧凑间距和字体

### 3. 复制功能修复
- `copyToClipboard` 支持异步 (Clipboard API) + 同步 (execCommand) 双模式
- `copyAllSubscribeLink` 和 `generateAndCopyLink` 兼容 sync/async 返回值
- 复制失败时弹出 `prompt()` 手动复制兜底
- **改为文本框+按钮**: 订阅链接显示在只读 input 中，旁边有"复制"按钮

### 4. 多选支持
- `selectedTeams` 使用 `Set` 存储，支持多球队同时选中
- 选中/取消时同步更新 UI 标记 (.select-mark)
- `initFromURL()` 加载时预选球队也会同步添加标记

### 5. ICS GEO 属性
- 16 个场馆 LAT/LNG 坐标 (STADIUM_GEO 映射)
- 生成 ICS 时输出 `GEO:纬度,经度` 属性
- 场馆包含墨西哥2个 + 美国12个 + 加拿大2个

## 遗留问题 / 待研究

### 1. GitHub Pages CDN 缓存
- CDN 刷新有延迟 (通常 1-3 分钟)
- `last-modified` 可能不实时更新
- 解决: 等待 CDN 刷新，或 hard refresh (Cmd+Shift+R)

### 2. 复制功能在部分浏览器可能受限
- 某些浏览器/场景下 `execCommand('copy')` 可能失败
- 有 fallback 到 `prompt()` 手动复制

### 3. 浏览器控制台可能有 Clipboard API 错误
- 如果页面非 HTTPS 环境，Clipboard API 不可用
- 自动 fallback 到 execCommand

## 关键文件
- `index-new.html` - 主文件 (含球队选择器)
- `index.html` - 基线版本 (无球队选择器)
- `index_backup_2026-06-08.html` - 备份文件 (原球队选择器版本)

## 下次开发注意
1. 推送后等待 CDN 刷新再测试
2. 用 `curl -sI` 检查 `last-modified` 确认更新
3. 用 `grep` 验证部署内容
4. `execCommand('copy')` 需要 HTTPS 或 localhost
5. Python 替换 HTML/JS 时注意 `\n` escape 问题
6. initFromURL 预选球队后需要同步更新 UI 标记
