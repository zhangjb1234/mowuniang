/* [修改 6] 门禁：sbFromText 按原文顺序分段绘制 + 折叠摘要行口径
   vm 沙箱切出 parseFields + sbFromText（纯函数区），不依赖宿主。 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('./魔典原型.html', import.meta.url), 'utf8');
let fails = 0;
const ok = (name, cond, extra) => { console.log((cond ? '✅' : '❌') + ' ' + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };

const i = html.indexOf('function parseFields(raw){');
const j = html.indexOf('/* afterLine', i);
const k1 = html.indexOf('function sbFromText(text){');
const k2 = html.indexOf('function statusCardHtml', k1);
if (i < 0 || j < 0 || k1 < 0 || k2 < 0) { console.error('切段失败'); process.exit(1); }
const sb = vm.runInNewContext('const esc = s => String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;");\n' + html.slice(i, j) + '\n' + html.slice(k1, k2) + '\nsbFromText', {}, { filename: 'sbf.js' });

// 样例：五段状态栏（段名+键值+杂行），段间穿插
const SAMPLE = `【主角状态】
姓名：安然·萨希尔
等级：Lv.77｜T7
生命：14400/14400
法力：9000/9000
【资产与行囊】
金币：1200
 redeemable 杂行
【心界住民】
菲娜：羁绊 32｜形态三
【阵营与声望】
萨希尔王国：友善
【羁绊台账】
露珂：初见`;

const r = sb(SAMPLE);
const h = r.html;

// ① 五段标题全部出现，且顺序正确
const order = ['主角状态', '资产与行囊', '心界住民', '阵营与声望', '羁绊台账'];
const find = t => h.indexOf('<div class="sb-sec">' + t + '</div>');
const pos = order.map(find);
ok('① 五段标题齐全且按原文顺序', pos.every(p => p >= 0) && pos.every((p, k) => k === 0 || p > pos[k - 1]), pos.join(','));

// ② 字段归段：菲娜在「心界住民」段内（位于其标题之后、阵营标题之前）
const secHeart = find('心界住民'), secCamp = find('阵营与声望');
ok('② 键值归入所属段', secHeart > 0 && secCamp > secHeart && h.slice(secHeart, secCamp).includes('菲娜') && h.slice(secHeart, secCamp).includes('羁绊 32'));

// ③ 段名不再堆到最后：sb-sec 总数 = 5
ok('③ 段名共5个', (h.match(/class="sb-sec"/g) || []).length === 5);

// ④ 折叠摘要行（教程口径：姓名·等级·体力·法力，无所在地）
ok('④ 摘要行口径', r.line === '安然·萨希尔 · Lv.77 · 体力 14400/14400 · 法力 9000/9000', r.line);

// ⑤ 生命字段兼容「生命：」写法（正文多写「生命」而非「体力」）
const r2 = sb('【主角状态】\n姓名：测试\n等级：Lv.1｜T1\n生命：100/100\n法力：50/50');
ok('⑤ 生命字段摘要', r2.line === '测试 · Lv.1 · 体力 100/100 · 法力 50/50', r2.line);

// ⑥ 杂行进段内（extras → dd 跨列）
ok('⑥ 杂行保留', h.includes('redeemable 杂行'));

// ⑦ 无段名开头（无【主角状态】前缀）也能画
const r3 = sb('姓名：无段\n等级：Lv.1');
ok('⑦ 无段名容错', r3.html.includes('无段') && (r3.html.match(/class="sb-sec"/g) || []).length === 0, r3.line);

// ⑧ 空输入安全
ok('⑧ 空输入安全', sb('').html === '' && sb('').line === '');

// ⑨ 段内空段跳过（只有标题没有内容 → 不画标题）
const r4 = sb('【主角状态】\n姓名：甲\n【空段】\n【羁绊台账】\n乙：初见');
ok('⑨ 空段跳过', !r4.html.includes('空段') && r4.html.includes('羁绊台账'));

process.exit(fails ? 1 : 0);
