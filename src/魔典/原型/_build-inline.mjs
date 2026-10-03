// 把 魔典原型.html（多文件原形）打成单文件内联产物（照幻璃镜/租借男友交付形制）
// 输入：魔典原型.html + 六个数据 .js；输出：dist/魔典原型.inline.html
// 机制：六个 <script src> 按原位替换为内联内容；CSS 相对纹理路径改绝对地址；全量扫防坑
//
// 纹理基址可用环境变量 MODIAN_ASSET_BASE 覆盖（默认本地 5500）：
//   node _build-inline.mjs                                   → 本地调试版
//   MODIAN_ASSET_BASE=https://cdn.jsdelivr.net/gh/<user>/<repo>@main/src/魔典/ node _build-inline.mjs
// 正式版必须覆盖，否则别人拿到的 CDN 页面会朝自己电脑的 5500 要图（全部 404）。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(DIR, 'dist');
mkdirSync(OUT_DIR, { recursive: true });

const SRC = process.env.MODIAN_ASSET_BASE || 'http://localhost:5500/src/魔典/';
const FILES = ['content-data.js', 'world-data.js', 'demo-floors.js', 'dex-races.js', 'ritual-data.js', 'ritual-v2.js'];

let html = readFileSync(path.join(DIR, '魔典原型.html'), 'utf8');
let residual = [];

for (const f of FILES) {
  const c = readFileSync(path.join(DIR, f), 'utf8');
  if (c.includes('</script')) throw new Error(`${f} 含 </script 字面量，内联会截烂文件`);
  const tag = `<script src="${f}"></script>`;
  if (!html.includes(tag)) throw new Error(`魔典原型.html 里找不到 <script src="${f}"></script>`);
  html = html.split(tag).join(`<script data-modian-inline="${f}">\n${c}\n</script>`);
}

// CSS 相对纹理/资源 → 绝对 5500（当前仅这一种相对引用；其它相对型会被质检②揪出来）
// 注意：源里写的是 '../素材候选/x.jpg'，替换后必须是 '<绝对前缀>素材候选/x.jpg'。
// 前缀已含 'src/魔典/'，若这里再拼一段 '素材候选/' 会叠成 '素材候选/素材候选/' —— 全 404。
html = html.replace(/url\('\.\.\//g, `url('${SRC}`);

// —— 出货前全量质检 ——
// ① 不许残留相对的 <script src="xx.js">
for (const m of html.matchAll(/<script src="([^"]+)"/g)) {
  if (!/^https?:/.test(m[1])) residual.push('外链未内联: ' + m[1]);
}
// ② 不许相对 url('../ / url("./ 残留
for (const m of html.matchAll(/url\('([^']+)'\)/g)) {
  const u = m[1];
  if (!/^https?:|^data:|^#/.test(u)) residual.push('相对 CSS 资源残留: ' + u);
}
// ②b 绝对路径必须真实存在 —— 只查"是不是相对"挡不住前缀拼错（如 素材候选/素材候选/ 叠段）
// 仅本地基址可查盘；CDN 基址指向远端，文件在仓库里而不在本机 dist 旁，跳过存在性校验。
const CAN_CHECK_DISK = SRC.startsWith('http://localhost') || SRC.startsWith('http://127.0.0.1');
for (const m of html.matchAll(/url\('(https?:\/\/[^']+)'\)/g)) {
  const u = m[1];
  if (!u.startsWith(`${SRC}`)) {
    residual.push(`绝对资源前缀异常（应为 ${SRC}）: ` + u);
    continue;
  }
  if (!CAN_CHECK_DISK) continue;
  const rel = decodeURIComponent(u.slice(SRC.length).split('?')[0]);
  if (!existsSync(path.join(DIR, '..', rel))) residual.push('绝对资源在磁盘上不存在（会 404）: ' + rel);
}
// ③ 核对六个内联全部在场且顺序正确
let prev = -1;
for (const f of FILES) {
  const i = html.indexOf(`data-modian-inline="${f}"`);
  if (i < 0) residual.push('内联缺失: ' + f);
  else if (i < prev) residual.push('内联顺序错乱: ' + f);
  prev = i;
}
// ④ 六个 data-modian-inline 标记全集（比数闭合标签靠谱）——六个数据段都在
const nInline = (html.match(/data-modian-inline="/g) || []).length;
if (nInline !== FILES.length) residual.push('内联标记数异常: 官方 ' + FILES.length + ' 实得 ' + nInline);
// ⑤ 版本回执钉见：用户可自查
const STAMP = `<!-- 魔典单文件内联产物 · 构建于 ${new Date().toISOString()} · 勿手改（源：魔典原型.html） -->`;
html = html.replace(/<\/body>/, STAMP + '\n</body>');

// ⑥ 不许 </html> 之后残留非空白内容——浏览器会把它们渲染成页面可见文本（两次漏字事故同款）
const afterHtml = html.slice(html.lastIndexOf('</html>') + '</html>'.length);
if (afterHtml.trim()) residual.push('</html> 之后残留非空白内容（会漏成页面可见文本）: ' + afterHtml.trim().slice(0, 60));

const out = path.join(OUT_DIR, '魔典原型.inline.html');
writeFileSync(out, html);
console.log('产物:', out, (html.length / 1024).toFixed(1) + 'KB');
if (residual.length) { console.error('\n质检未过:\n- ' + residual.join('\n- ')); process.exit(1); }
console.log('质检全绿（六内联按序、无相对路径残留、无 </script 截烂风险）');
