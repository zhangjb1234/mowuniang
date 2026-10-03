# 魔典 · 烛光抄本

魔物娘图鉴世界的**前端界面**，做成单文件内联 HTML，由酒馆（SillyTavern）的一条正则整楼替换后提升为 iframe 逐楼层渲染。

> 给 AI / 新接手的人：**先读 [本文档](#三该改哪个文件该发布哪个文件)**，再动手。别改错地方。

---

## 一、这是什么，不是什么

| 是 | 不是 |
|---|---|
| 一个跑在酒馆 iframe 里的**前端界面** | 不是一个酒馆插件/扩展 |
| 由 `dist/魔典原型.inline.html` 单文件承载 | 不需要 `npm install`、不需要构建框架 |
| 从魔物娘图鉴世界卡**机器提取**资料后渲染 | 数据源不在本仓库，在那张卡里 |
| 通过一条正则挂进酒馆 | 不改酒馆本体任何文件 |

---

## 二、目录结构与每个文件的作用

```
src/魔典/
├── 原型/                        ← 【源】改这里
│   ├── 魔典原型.html              主源文件：结构 + CSS + 全部前端逻辑。界面长什么样全在这
│   ├── content-data.js            资料层：开场白、女主名册、区域索引（自动提取，勿手改）
│   ├── world-data.js              资料层：世界状态 prefault（时间/地点/天气…）
│   ├── dex-races.js               资料层：种族图鉴 28大类/85科属/237种族
│   ├── ritual-data.js             资料层：启封仪典的步骤标签与文案
│   ├── ritual-v2.js               仪典逻辑：开局向导运行时
│   ├── demo-floors.js             演示楼层（只在本地预览用；真酒馆里不铺，改走真实楼层）
│   ├── lock-frontend.src.js       【源】锁定前端脚本源码（保命用，见第四节）
│   ├── modian-skin.src.js         烛光皮肤：把酒馆内旧组件换成羊皮纸鎏金外观（只改样式）
│   ├── _build.mjs                 从世界卡重新提取资料（⚠️ 含本机绝对路径，别人跑不了）
│   ├── _build-inline.mjs          ★ 打包器：把上面 6 个数据 js 内联进单文件
│   ├── _gen-lock-json.mjs         把 lock-frontend.src.js 灌进酒馆脚本 json
│   ├── _verify-lock.mjs           锁定脚本的真机自测（A/B 验证）
│   │
│   ├── dist/
│   │   └── 魔典原型.inline.html    ★★ 【产物】单文件内联成品，正则加载的就是它
│   │
│   └── 导入到酒馆中/               ← 【产物】导入酒馆用的 JSON
│       ├── 魔典-界面-本地调试.json    正则：走 localhost:5500（开发用，默认禁用）
│       ├── 魔典-界面-正式.json        正则：走 jsDelivr CDN（给朋友用，默认启用）
│       └── 魔典-脚本-锁定前端.json    酒馆助手脚本：锁定楼层，防酒馆销毁 iframe
│
└── 素材候选/                      ← 【素材】17 张羊皮纸/皮革/木纹贴图 + 来源清单
    ├── manifest.json              每张图的原始出处与 CC0 许可（可商用）
    ├── 素材挑选墙.html             本地挑图用的看板
    └── *.jpg                      贴图本体（界面背景/纸张质感）
```

---

## 三、该改哪个文件，该发布哪个文件

### 🔧 要改界面 → 改「源」，然后重新打包

```
改  src/魔典/原型/魔典原型.html          （或 6 个数据 .js）
 ↓
跑  node src/魔典/原型/_build-inline.mjs
 ↓
产出 src/魔典/原型/dist/魔典原型.inline.html
 ↓
推  git push
```

**永远不要手改 `dist/魔典原型.inline.html`** —— 它是打包产物，下次构建就被覆盖了。

### 📦 要发布给别人用

```bash
# 本地调试版（纹理指向 localhost:5500）
node src/魔典/原型/_build-inline.mjs

# CDN 正式版（纹理指向 jsDelivr，别人没开本地服务器也能看）
# PowerShell:
$env:MODIAN_ASSET_BASE='https://cdn.jsdelivr.net/gh/zzh185061429-cmyk/mowuniang@main/src/魔典/'
node src/魔典/原型/_build-inline.mjs

git add -A && git commit -m "..." && git push
```

> ⚠️ **发布前务必用上面那条 CDN 命令重建一次。**
> 默认构建会把纹理地址写成 `localhost:5500`，那样别人打开会**全部 404 没背景**。

### 🎯 正则该用哪个

| 文件 | 加载地址 | 用途 |
|---|---|---|
| `魔典-界面-本地调试.json` | `localhost:5500` | 你自己改东西时用，需先跑本地服务器 |
| `魔典-界面-正式.json` | jsDelivr CDN | **给朋友 / 日常使用** |

**两条正则互斥，不要同时启用**（会抢同一个楼层）。

---

## 四、锁定前端脚本（保命用）

酒馆在刷新时会销毁旧楼层的 iframe，导致「全屏中的界面被新楼层顶掉」。
`魔典-脚本-锁定前端.json` 通过在父页面拦截 `remove()` / `removeChild()` / `jQuery.remove()`，
把当前锁定楼层的 iframe 保住。

**源码是 `lock-frontend.src.js`**，改完跑：

```bash
node src/魔典/原型/_gen-lock-json.mjs    # 重新生成 json
```

自测：

```bash
node src/魔典/原型/_verify-lock.mjs       # 需本机装有 Edge
```

> 触发条件说明见下节，这是最容易踩坑的地方。

---

## 五、给 AI 接手时的注意事项（血泪坑）

1. **锁定的触发器有两条腿，缺一不可**
   魔典主用「伪全屏」（CSS 藏楼 + `.mes` 顶满视口），原生 `requestFullscreen()`
   会因为酒馆 iframe **没有 `allowfullscreen`** 而静默失败。
   所以锁定脚本除了监听 `fullscreenchange`，**还必须轮询 `__modianFullscreen` 标志**。
   只留前者 = 锁根本不上 = 旧楼层照常被销毁。

2. **纹理路径别拼出叠段**
   源里是 `url('../素材候选/x.jpg')`，替换前缀若已含 `src/魔典/`，
   再拼一段 `素材候选/` 就变成 `素材候选/素材候选/` → 全 404。
   `_build-inline.mjs` 的质检 ②b 会拦住这种错。

3. **`content-data.js` / `dex-races.js` 等标了「勿手改」**
   它们由 `_build.mjs` 从世界卡机器提取，手改会在下次提取时丢失。
   要改展示逻辑请改 `魔典原型.html`。

4. **`_build.mjs` 有本机绝对路径**（`D:/BaiduNetdiskDownload/24/妖怪/...`），
   是原作者的一次性提取脚本，**换机器跑不了**，也不该跑。

5. **CDN 有缓存**。推完 jsDelivr 可能 1–2 分钟才生效，
   调试时加 `?t=<时间戳>` 强制刷新。

---

## 六、本地开发环境

```bash
# 1. 起静态服务器（仓库根目录）
node serve.mjs          # → http://localhost:5500

# 2. 改完重新打包
node src/魔典/原型/_build-inline.mjs

# 3. 浏览器直接看效果
#    http://localhost:5500/src/魔典/原型/魔典原型.html   （多文件原形，带 HMR 友好结构）
#    http://localhost:5500/src/魔典/原型/dist/魔典原型.inline.html  （打包后）
```

> ⚠️ **不要用 `python -m http.server 5500`** —— 它不发 CORS 头，酒馆里会直接白屏。

---

## 七、素材来源

`素材候选/manifest.json` 记录了每张贴图的 Wikimedia Commons 出处与许可，
**全部为 CC0（公共领域，可商用）**。

---

## 八、致谢

界面与资料源自「魔物娘图鉴世界」角色卡；结构参考同门的租借男友 / 幻璃镜项目。
