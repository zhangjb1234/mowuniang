// 锁逻辑真机验证：模拟酒馆父页 + 楼层 iframe，验证「伪全屏 → 锁 → 新楼层不销毁旧楼层」。
// 复现旧 bug 的关键条件：iframe 缺 allowfullscreen，原生全屏静默失败（父页 fullscreenchange 不触发）。
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9481;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const { spawn } = await import('node:child_process');
const fs = await import('node:fs');
const path = await import('node:path');
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
// LOCK_SRC 环境变量可指向「旧版触发逻辑」以做 A/B 对照；默认用当前源文件
const lockSrc = fs.readFileSync(process.env.LOCK_SRC || path.join(DIR, 'lock-frontend.src.js'), 'utf8');

process.on('exit', () => { try { edge.kill(); } catch {} });
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${PORT}`, '--user-data-dir=' + process.env.TEMP + '/modian-lock-' + Date.now(),
  '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });

let sid = null;
for (let i = 0; i < 50 && !sid; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const p = (await r.json()).find((t) => t.type === 'page');
    if (p) sid = p.webSocketDebuggerUrl;
  } catch {}
  await wait(300);
}
const ws = new WebSocket(sid);
await new Promise((r) => (ws.onopen = r));
let seq = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const id = ++seq; pend.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.result?.value;

await send('Runtime.enable'); await send('Page.enable');

// ── 搭一个酒馆形状的父页：#chat > .mes[mesid] > iframe（无 allowfullscreen）──
await ev(`
document.body.innerHTML = '<div id="chat">' +
  '<div class="mes" mesid="1"><iframe id="f1"></iframe></div>' +
  '<div class="mes" mesid="2"><iframe id="f2"></iframe></div>' +
'</div>';
const f1 = document.getElementById('f1');
const f1doc = f1.contentDocument;
f1doc.open();
f1doc.write('<!DOCTYPE html><html><body><div id="app">floor1</div></body></html>');
f1doc.close();
'built'`);
await wait(400);

// 装 jQuery（锁脚本用 $ ready）
await ev(`
const s = document.createElement('script');
s.src = 'http://localhost:5500/node_modules/jquery/dist/jquery.min.js';
document.head.appendChild(s);
'jq'`);

await wait(1200);
console.log('jQuery 版本 =', await ev(`window.jQuery ? jQuery.fn.jquery : 'NONE'`));

// 注入锁脚本（父页语境：window.parent === window）
await ev(`${lockSrc}; 'lock-injected'`);
await wait(600);
console.log('锁脚本已注入');

// ── 场景：楼层1 进入「伪全屏」，原生全屏静默失败（不触发父页 fullscreenchange）──
console.log('\n--- 伪全屏开启（原生全屏失败，父页不会收到 fullscreenchange）---');
console.log('设置 __modianFullscreen = true');
await ev(`document.getElementById('f1').contentWindow.__modianFullscreen = true; 'ok'`);
await wait(900); // 等轮询(250ms)抓到

const locked = await ev(`(() => {
  const st = document.getElementById('modian-lock-floor-style');
  const prot = document.getElementById('modian-lock-protect-script');
  return { hideStyle: !!st, css: st ? st.textContent : null, protect: !!prot };
})()`);
console.log('锁状态 =', JSON.stringify(locked, null, 2));

let pass = 0, fail = 0;
const check = (name, cond) => { cond ? (pass++, console.log('  PASS', name)) : (fail++, console.log('  FAIL', name)); };
check('藏楼 CSS 已注入', locked.hideStyle);
check('CSS 锁定了 mesid=1', /mesid="1"/.test(locked.css || ''));
check('父页保护脚本已注入', locked.protect);

// ── 关键验证：酒馆销毁旧楼层 iframe（removeChild），锁应拦截 ──
console.log('\n--- 模拟酒馆销毁旧楼层（父页 removeChild）---');
const survived = await ev(`(() => {
  const mes = document.querySelector('.mes[mesid="1"]');
  try { mes.parentNode.removeChild(mes); } catch(e) { return {threw: String(e)}; }
  const still = !!document.querySelector('.mes[mesid="1"] iframe');
  return { still, msg: still ? '旧楼层存活 ✅' : '旧楼层被销毁 ❌' };
})()`);
console.log('结果 =', JSON.stringify(survived));
check('新楼层出现时旧楼层 iframe 未被销毁', survived.still);

// ── 退出伪全屏，应解锁 ──
console.log('\n--- 退出伪全屏 ---');
await ev(`document.getElementById('f1').contentWindow.__modianFullscreen = false; 'ok'`);
await wait(900);
const after = await ev(`({ hide: !!document.getElementById('modian-lock-floor-style'), prot: !!document.getElementById('modian-lock-protect-script') })`);
console.log('退出后 =', JSON.stringify(after));
check('退出全屏后藏楼 CSS 已清除', !after.hide);
check('退出全屏后保护脚本已清除', !after.prot);

console.log(`\n=== 结果：PASS ${pass} / FAIL ${fail} ===`);
try { edge.kill(); } catch {}
process.exit(fail ? 1 : 0);
