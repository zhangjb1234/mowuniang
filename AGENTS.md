# AGENTS.md — 魔典前端（给 AI 的硬规则）

本仓库是酒馆（SillyTavern）前端界面「魔典 · 烛光抄本」。
人类可读说明见 `README.md`；本文件是给 AI 的**操作红线与事实**。

## 仓库定位

- 产物：`src/魔典/原型/dist/魔典原型.inline.html`（单文件内联，约 373KB）
- 消费方式：酒馆助手「正则」把楼层文本整楼替换成代码块 → 提升为 iframe 加载上述文件
- 不改酒馆本体，不装依赖，不构建框架

## 文件角色三分法

| 类别 | 文件 | 规则 |
|---|---|---|
| **源**（手改） | `原型/魔典原型.html`、`原型/lock-frontend.src.js`、`原型/modian-skin.src.js` | 改这里 |
| **资料**（勿手改） | `原型/content-data.js`、`world-data.js`、`dex-races.js`、`ritual-data.js` | 由 `_build.mjs` 从世界卡提取，改了下次会丢 |
| **产物**（勿手改） | `原型/dist/*.html`、`原型/导入到酒馆中/*.json` | 一律用脚本重新生成 |

## 铁律

1. **绝不手改 `dist/魔典原型.inline.html`**。它由 `_build-inline.mjs` 生成，改动会被覆盖。
2. **改完源必须重新打包**：`node src/魔典/原型/_build-inline.mjs`。
3. **发布前必须用 CDN 基址重建**，否则纹理会指向使用者本机的 5500 而全部 404：
   ```powershell
   $env:MODIAN_ASSET_BASE='https://cdn.jsdelivr.net/gh/zzh185061429-cmyk/mowuniang@main/src/魔典/'
   node src/魔典/原型/_build-inline.mjs
   ```
4. **改锁定脚本后跑生成器**：`node src/魔典/原型/_gen-lock-json.mjs`。
5. **不要运行 `_build.mjs`**：内含原作者本机绝对路径，换机器必失败。
6. **两条界面正则互斥**：`魔典-界面-本地调试.json` 与 `魔典-界面-正式.json` 不可同时启用。

## 已知坑（改动时务必复查）

- **锁定触发器必须双轨**：`fullscreenchange` 事件 **+** 轮询 `__modianFullscreen`。
  酒馆 iframe 无 `allowfullscreen`，原生全屏必定静默失败；只留事件监听会导致锁完全不上，
  表现为「全屏中旧楼层仍被新楼层销毁」。改 `lock-frontend.src.js` 时不要删轮询那段。
- **纹理前缀勿叠段**：源里 `url('../素材候选/x.jpg')`，前缀已含 `src/魔典/`；
  再补 `素材候选/` 会得到 `素材候选/素材候选/` → 404。质检 ②b 会拦。
- **jQuery `.load()` 语义**：正则用 `$('body').load(url)`，依赖酒馆页面已有 jQuery。

## 验证方式

```bash
node src/魔典/原型/_verify-lock.mjs    # 锁定脚本真机 A/B 自测（需 Edge）
```

改锁定逻辑后必须跑通，且用 `LOCK_SRC` 指向旧版确认旧版会 FAIL（证明测试有效）。
