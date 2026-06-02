# PWA 改造记录

> 本文档记录从原项目 (AmintaCCCP/GithubStarsManager) 改造为 iOS PWA 的所有改动。
> 新开 AI 对话时提供此文件即可快速了解上下文。

## 项目信息

- **上游仓库**: https://github.com/AmintaCCCP/GithubStarsManager
- **你的仓库**: https://github.com/NeoZhouCHN/GithubStarsManager
- **线上地址**: https://github-stars.pages.dev (Cloudflare Pages)
- **部署方式**: GitHub Actions 自动同步上游 + 自动构建 + 自动部署到 Cloudflare Pages
- **同步频率**: 每天凌晨 2 点 (UTC) 自动同步，支持手动触发

## 技术方案

**方案 A：纯前端 PWA**（无后端，数据存浏览器 localStorage/IndexedDB）

- React 18 + TypeScript + Tailwind CSS + Zustand + Vite
- PWA: vite-plugin-pwa + Workbox
- 部署: Cloudflare Pages (免费，无限流量)

---

## 改动清单

### 1. PWA 基础 (vite.config.ts + index.html)

**文件**: `vite.config.ts`
- 安装并配置 `vite-plugin-pwa`
- Workbox 缓存策略:
  - 应用自身文件: Precache (离线可用)
  - GitHub API: NetworkFirst (优先网络，断网用缓存)
  - Google Fonts: CacheFirst (缓存一年)
- `maximumFileSizeToCacheInBytes: 4MB` (legacy chunk 超 2MB 默认限制)

**文件**: `index.html`
- 添加 iOS meta 标签:
  - `apple-mobile-web-app-capable`
  - `apple-mobile-web-app-status-bar-style: black-translucent`
  - `apple-mobile-web-app-title`
  - `theme-color: #0d1117`
  - `viewport-fit=cover, user-scalable=no`
  - `format-detection: telephone=no`

### 2. Header 移动端适配 (src/components/Header.tsx)

**问题**: 竖屏 (<768px) 时导航按钮不显示，缺少汉堡菜单按钮，iPhone 刘海遮挡。

**改动**:
- 添加汉堡菜单按钮 (☰) 控制移动端下拉导航
- 添加同步按钮 (🔄) 在汉堡菜单左侧
- Header 添加 `paddingTop: env(safe-area-inset-top)` 适配 iPhone 刘海/Dynamic Island
- 导入 `Menu`, `X` 图标

**竖屏布局**: `[Logo] [🔄同步] [☰菜单] [🌙主题] [头像] [退出]`

### 3. AI 配置面板按钮 (src/components/settings/AIConfigPanel.tsx)

**问题 1**: 保存/测试连接/取消按钮在小屏上变成两行，太大。

**改动 1**: 按钮缩小为 `px-3 py-1.5 text-sm`，容器改为 `flex flex-wrap gap-2`，"测试连接" 缩短为 "Test"。

**问题 2**: 已保存的 AI 配置项右侧测试/编辑/删除按钮溢出屏幕。

**改动 2**: 按钮从右侧移到配置信息下方，改为带文字标签的按钮 (`flex items-center gap-1.5 px-3 py-1.5 text-sm`)，长 URL 加 `break-all`。

### 4. ReadmeModal 移动端适配 (src/components/ReadmeModal.tsx)

**问题**: 竖屏时 README 内容显示不全，右侧需要来回滑动；TOC 目录栏太宽。

**改动**:
- 手机端改为底部弹出样式 (`items-end`, `rounded-t-xl`, `max-h-[100dvh]`)
- 手机端默认隐藏 TOC 目录侧栏 (`window.innerWidth >= 768`)
- 内容区添加 `overflow-x-auto` 横向滚动
- Header 工具栏改为 `flex-wrap` 自动换行
- Header padding: `p-3 md:p-4`
- Header 添加 `paddingTop: max(0.75rem, env(safe-area-inset-top))` 适配刘海

### 5. Toast 弹窗 (src/components/ui/Toast.tsx)

**问题**: 弹窗被刘海遮挡，背景太淡像透明，位置偏右溢出。

**改动**:
- 位置: 手机居中，桌面右上角 (`left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4`)
- 安全区域: `top: calc(env(safe-area-inset-top, 0px) + 16px)`
- 背景: `bg-white dark:bg-gray-800` (不透明)
- 边框加强: `border-2`, `shadow-xl`, `backdrop-blur-sm`
- 文字加粗: `font-medium`

### 6. ConfirmDialog 确认弹窗 (src/components/ui/ConfirmDialog.tsx)

**问题**: 居中偏高遮挡内容，背景半透明。

**改动**:
- 手机端改为底部弹出 (`items-end md:items-center`)
- 背景加深: `bg-black/60 backdrop-blur-sm`
- 底部安全区域: `marginBottom: env(safe-area-inset-bottom, 0px)`
- 手机端圆角只上方: `md:rounded-xl rounded-t-xl`

### 7. RepositoryCard 浮窗 (src/components/RepositoryCard.tsx)

**问题**: 项目描述文字上方的 FloatingTooltip 持续闪烁，桌面端也有此 bug。

**改动**: 完全移除 FloatingTooltip，描述文字改为纯文本显示，移除相关 state/ref/event handler。删除了 `FloatingTooltip` 导入、`showTooltip` state、`descTriggerRef`、`tooltipHideTimerRef`。

### 8. 登录页 (src/components/LoginScreen.tsx)

**问题**: 语言/主题切换按钮被 iPhone 刘海遮挡。

**改动**: 切换按钮区域添加安全区域定位: `top: calc(env(safe-area-inset-top, 0px) + 16px)`

---

## 自动化部署

### 文件: `.github/workflows/sync-and-deploy.yml`

**sync job**:
- 每天凌晨 2 点 UTC 或手动触发
- 从 upstream (AmintaCCCP/GithubStarsManager) 拉取 main 分支
- 合并到本地 main，有冲突则跳过推送
- 需要 `permissions: contents: write`

**build-and-deploy job**:
- Node.js 20 构建
- `npm ci` + `npm run build`
- `cloudflare/wrangler-action@v3` 部署到 Cloudflare Pages

### 需要的 GitHub Secrets

| Name | 说明 |
|------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token (Edit Cloudflare Workers 模板) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |

### 上游更新后如何处理

- **自动**: 每天自动同步，无需操作
- **手动触发**: GitHub Actions → Sync & Deploy → Run workflow
- **冲突**: 如果上游改了我们改过的同一行代码，合并会失败，工作流跳过推送，需手动解决

### 我们修改过的文件 (冲突风险)

| 文件 | 改动 | 冲突风险 |
|------|------|----------|
| `vite.config.ts` | 加 PWA 插件 | 低 (只加新内容) |
| `index.html` | 加 iOS meta 标签 | 低 (只加新行) |
| `Header.tsx` | 汉堡菜单+同步按钮+安全区域 | 中 (上游可能重构 Header) |
| `AIConfigPanel.tsx` | 缩小按钮+按钮移到下方 | 低 (只改 className) |
| `ReadmeModal.tsx` | 移动端底部弹出+安全区域 | 中 (上游可能改 ReadmeModal) |
| `Toast.tsx` | 位置+背景+安全区域 | 低 |
| `ConfirmDialog.tsx` | 底部弹出+背景 | 低 |
| `RepositoryCard.tsx` | 移除 FloatingTooltip | 中 (上游可能改描述区) |
| `LoginScreen.tsx` | 安全区域 | 低 |

---

## iOS PWA 已知限制

| 限制 | 影响 |
|------|------|
| Service Worker 不稳定 | iOS 会随时杀死后台 SW |
| 存储上限 50MB (IndexedDB) | 约可存 12,000-25,000 个 star |
| 无后台同步 | 关掉 app 就停止 |
| 每次切走可能重载 | 内存压力大时 iOS 会杀进程 |
| 翻译用微软免费 API | README 长+手机网络慢时翻译较慢 |

## 翻译机制

- **不是 AI 翻译**，使用 Microsoft Translator 免费 API
- API: `api-edge.cognitive.microsofttranslator.com/translate`
- 认证: Edge 浏览器翻译 token (`edge.microsoft.com/translate/auth`)
- 分段翻译，每批最多 100 段，长文本拆成 50KB 块
- 有重试机制 (指数退避，最多 3 次)

---

## 关键命令

```bash
# 本地开发
cd D:\GitHubTool\GitHubSTARS\GithubStarsManager
npm install
npm run dev

# 构建
npm run build

# 部署 (手动)
wrangler pages deploy dist --project-name=github-stars

# 检查上游冲突 (dry-run)
git fetch upstream
git merge upstream/main --no-edit --dry-run

# 手动合并上游
git fetch upstream
git merge upstream/main --no-edit
git push
```
