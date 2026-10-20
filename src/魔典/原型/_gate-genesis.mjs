// [修改7] 创世回廊适配验收：vm 切解析链，跑教程验收 + 全演示楼层改前改后逐字节对比
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const NEW = readFileSync('C:/Users/Administrator/Downloads/跑/_mowuniang_repo/src/魔典/原型/魔典原型.html', 'utf8');
const OLD = readFileSync('C:/Users/Administrator/Downloads/跑/_snap_pre7.html', 'utf8');
const DEMO = readFileSync('C:/Users/Administrator/Downloads/跑/_mowuniang_repo/src/魔典/原型/demo-floors.js', 'utf8');

function makeChain(html, tag) {
  const i = html.indexOf('/* ---------- 正文解析器');
  const j = html.indexOf('const RM = matchMedia', i);
  if (i < 0 || j < 0) throw new Error(tag + ' 切段失败');
  const sb = {
    console: { log() {}, error() {}, warn() {} },
    esc: s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;'),
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    window: {},
  };
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(html.slice(i, j), sb, { filename: tag + '-chain.js' });
  return sb;
}
const oldSb = makeChain(OLD, 'old');
const newSb = makeChain(NEW, 'new');

let fails = 0;
const ok = (name, cond, extra) => { if (cond) console.log('OK  ', name); else { fails++; console.error('FAIL', name, extra || ''); } };
const FLOWTEXT = r => (r.flow || []).map(x => x.text).join('\n');

// ── ① 创世回廊开局楼层（CRLF + 元数据 + now_plot + action）──
const G = [
  '<type>开局</type>',
  '<scene_time>圣历742年·清晨</scene_time>',
  '<!-- plotThink: 主角在阁楼醒来，交代小镇氛围与今日钩子 -->',
  '<now_plot>',
  '木窗棂挡不住透进来的微凉晨光。',
  '',
  '你从行军床上坐起，昨夜的雨还挂在檐角。',
  '',
  '楼下传来炉火与碗碟的响动，今天恐怕又不会太平。',
  '</now_plot>',
  '<action>',
  '[Opt1:😇] 去楼下吃顿热乎的早饭',
  '[Opt2:😏] 先检查行囊里那封没有署名的信',
  '[Opt3:🧗] 爬上钟楼看看小镇全景',
  '[Opt4:🤪] 对着镜子练习今天要用的微笑',
  '[Opt5:💋] 去敲隔壁那位旅人的房门',
  '[Opt6:😈] 趁没人把老板娘的猫抱走',
  '</action>',
  '<StatusPlaceHolderImpl/>',
].join('\r\n');

const g = newSb.parseFloor(G);
const gt = FLOWTEXT(g);
ok('① 正文首段=木窗棂', gt.trim().startsWith('木窗棂挡不住透进来的微凉晨光。'), JSON.stringify(gt.slice(0, 60)));
ok('① 空行分段生效(CRLF)', gt.includes('行军床上坐起') && gt.includes('炉火与碗碟'), '段数=' + (g.flow || []).length);
ok('① 元数据不进正文', !/type>|scene_time|plotThink|now_plot/.test(gt) && !gt.includes('<正文') && !gt.includes('Opt1'), gt.slice(0, 120));
ok('① 选项签6张', (g.options || []).length === 6, JSON.stringify(g.options || []).slice(0, 200));
ok('① 选项标签序列', JSON.stringify((g.options || []).map(o => o.label)) === JSON.stringify(['😇', '😏', '🧗', '🤪', '💋', '😈']), JSON.stringify((g.options || []).map(o => o.label)));
ok('① 选项文本完整', (g.options || []).every(o => o.text && !o.text.includes('Opt')), JSON.stringify((g.options || []).map(o => o.text)));
ok('① 占位符不进正文', !/StatusPlaceHolder/i.test(gt));

// ── ② 正文标签已存在时 now_plot 不改写 ──
const g2 = newSb.parseFloor('<type>x</type>\r\n<正文>\r\n已有正文。\r\n</正文>\r\n<now_plot>备用正文不应出现</now_plot>');
const gt2 = FLOWTEXT(g2);
ok('② 有<正文>时now_plot不动', gt2.includes('已有正文') && !gt2.includes('备用正文'), JSON.stringify(gt2.slice(0, 80)));

// ── ③ plotThink 只删 plotThink 开头的注释 ──
const g3 = newSb.parseFloor('<!-- 正常注释保留语义测试 -->\r\n正文A。\r\n<!-- plotThink: 元数据 -->\r\n正文B。');
const gt3 = FLOWTEXT(g3);
ok('③ plotThink注释删/普通注释不影响', !gt3.includes('plotThink') && gt3.includes('正文A') && gt3.includes('正文B'), JSON.stringify(gt3.slice(0, 120)));

// ── ④ 全演示楼层：改前改后 parseFloor 输出逐字节相同 ──
const sb = { window: {}, console: { log() {} } };
sb.window = sb;
vm.createContext(sb);
vm.runInContext(DEMO, sb, { filename: 'demo.js' });
const floors = sb.window.MODIAN_FLOORS || [];
ok('④ 演示楼层载入', floors.length >= 5, 'n=' + floors.length);
let diffs = [];
for (let k = 0; k < floors.length; k++) {
  const raw = floors[k].raw || '';
  let a, b;
  try { a = JSON.stringify(oldSb.parseFloor(raw)); } catch (e) { a = 'ERR:' + e.message; }
  try { b = JSON.stringify(newSb.parseFloor(raw)); } catch (e) { b = 'ERR:' + e.message; }
  if (a !== b) diffs.push((floors[k].label || ('#' + k)));
}
ok('④ ' + floors.length + '个演示楼层输出逐字节一致', diffs.length === 0, diffs.join(', '));

// ── ⑤ 已有预设形态回归：SUOT 选项不受影响 ──
const g5o = oldSb.parseFloor('<SUOT>\n[1] 第一件事\n[2] 第二件事\n</SUOT>\n正文。');
const g5n = newSb.parseFloor('<SUOT>\n[1] 第一件事\n[2] 第二件事\n</SUOT>\n正文。');
ok('⑤ SUOT选项回归一致', JSON.stringify(g5o.options) === JSON.stringify(g5n.options) && (g5n.options || []).length === 2, JSON.stringify(g5n.options || []));

if (fails) { console.error('\n验收未过: ' + fails + ' 项'); process.exit(1); }
console.log('\n修改7 创世回廊适配验收全绿');
