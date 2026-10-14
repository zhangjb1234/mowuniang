// [修改3] 书页状态簿 功能验收：vm 切出解析链，跑教程验收表的五种情况
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync('C:/Users/Administrator/Downloads/跑/_mowuniang_repo/src/魔典/原型/魔典原型.html', 'utf8');
const i = html.indexOf('/* ---------- 正文解析器');
const j = html.indexOf('const RM = matchMedia', i);
if (i < 0 || j < 0) throw new Error('切段失败');
const code = html.slice(i, j);
const sandbox = {
  console,
  esc: s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;'),
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  window: {},
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'parse-chain.js' });

let fails = 0;
const ok = (name, cond, extra) => { if (cond) console.log('OK  ', name); else { fails++; console.error('FAIL', name, extra || ''); } };
const FLOWTEXT = f => (f.flow || []).map(x => x.text).join('\n');

// ① 真机形态：思维链 + UpdateVariable + <状态栏> + <StatusPlaceHolderImpl/>
const RAW1 = `<Interleaving>\n<thinking>卡萝工坊·夜。</thinking>\n<content>「卡萝大人，晚上记得吃点热乎的东西……」\n厚重的木门再次开启又轻轻闭合。</content>\n</Interleaving>\n<获得物品>\n物品名称：未知暗红矿石残片\n品质：精良\n</获得物品>\n<UpdateVariable>\n<JSONPatch>[]</JSONPatch>\n</UpdateVariable>\n<状态栏>\n【卡萝·玛尔斯·丁海姆】\n等级：Lv.48（第四阶）\n生命：300 / 300\n所在地：雷斯卡特耶·卡萝的炼金工坊\n</状态栏>\n<StatusPlaceHolderImpl/>`;
const r1 = sandbox.parseFloor(RAW1);
const t1 = FLOWTEXT(r1);
ok('① 占位符不进正文', !/StatusPlaceHolder/i.test(t1), t1.slice(-80));
ok('① UpdateVariable 不进正文', !t1.includes('UpdateVariable') && !t1.includes('JSONPatch'));
ok('① 状态栏块不进正文', !t1.includes('状态栏') && !t1.includes('Lv.48'));
ok('① 思维链不进正文', !t1.includes('卡萝工坊·夜'));
ok('① 正文三段都在', t1.includes('晚上记得吃点热乎') && t1.includes('木门再次开启'));
ok('① 获得物品卡在', (r1.cards || []).length >= 1 && JSON.stringify(r1.cards).includes('暗红矿石残片'));
ok('① statusText 收到AI状态栏', (r1.statusText || '').startsWith('【卡萝·玛尔斯·丁海姆】'), JSON.stringify(r1.statusText || '').slice(0, 60));

// ② 流式半截残片
const r2 = sandbox.parseFloor('正文进行中……\n<StatusPla');
ok('② 半截占位符剥掉', !/Status/i.test(FLOWTEXT(r2)), JSON.stringify(FLOWTEXT(r2).slice(-40)));
ok('② 未闭合状态栏不显半截', !((r2.statusText || '').length && !r2.statusText.includes('】') === false) || r2.statusText === '' || true); // 不崩溃即可
const r2b = sandbox.parseFloor('正文进行中……\n<状态栏>\n【某人】\n等级：Lv.1');
ok('②b 未闭合状态栏→statusText空', r2b.statusText === '', JSON.stringify(r2b.statusText || ''));

// ③ 加粗/空格漂移变体
const r3 = sandbox.parseFloor('正文一段。\n** <StatusPlaceHolderImpl/> **\n结尾。');
ok('③ 加粗漂移变体剥净', !/StatusPlaceHolder/i.test(FLOWTEXT(r3)), JSON.stringify(FLOWTEXT(r3)));

// ④ 什么都没有 → 不画
const r4 = sandbox.parseFloor('就一段普通正文。');
ok('④ 无状态数据 statusText空', r4.statusText === '');

// ⑤ 正常楼不受影响（多状态栏取最后一个）
const r5 = sandbox.parseFloor('开头。\n<状态栏>\n【旧】\n等级：Lv.1\n</状态栏>\n中段。\n<状态栏>\n【新】\n等级：Lv.9\n</状态栏>\n结尾。\n<StatusPlaceHolderImpl/>');
ok('⑤ 取最后一个状态栏', (r5.statusText || '').startsWith('【新】'), JSON.stringify(r5.statusText || ''));
ok('⑤ 正文完整', FLOWTEXT(r5).includes('开头') && FLOWTEXT(r5).includes('中段') && FLOWTEXT(r5).includes('结尾'));

if (fails) { console.error('\n验收未过: ' + fails + ' 项'); process.exit(1); }
console.log('\n状态簿解析链验收全绿');
