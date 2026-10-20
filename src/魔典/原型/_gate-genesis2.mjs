// [修改7升级] ⑤′创世回廊 v2 验收：scene_time转标头/新元数据剥离/Optional模组→战况框/花括号去除
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const NEW = readFileSync('C:/Users/Administrator/Downloads/跑/_mowuniang_repo/src/魔典/原型/魔典原型.html', 'utf8');
const OLD = readFileSync('C:/Users/Administrator/Downloads/跑/_snap_pre7b.html', 'utf8'); // v1018a

function makeChain(html, tag) {
  const i = html.indexOf('/* ---------- 正文解析器');
  const j = html.indexOf('const RM = matchMedia', i);
  if (i < 0 || j < 0) throw new Error(tag + ' 切段失败');
  const sb = {
    console: { log() {}, error() {}, warn() {} },
    esc: s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt'),
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    window: {},
  };
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(html.slice(i, j), sb, { filename: tag + '-chain.js' });
  return sb;
}
const newSb = makeChain(NEW, 'new');
const oldSb = makeChain(OLD, 'old');
const cf = sb => raw => String(sb.cleanseFloor(raw).text);

let fails = 0;
const ok = (name, cond, extra) => { if (cond) console.log('OK  ', name); else { fails++; console.error('FAIL', name, extra || ''); } };

// ① scene_time → 场景标头行（ISO 日期解析 + ｜附加段）
const t1 = cf(newSb)('<scene_time>0742-03-15T10:24|天气：晴</scene_time>\n正文一。');
ok('① scene_time日期格式化', t1.includes('『742年3月15日 10:24 · 天气：晴』'), JSON.stringify(t1.slice(0, 80)));
const t1b = cf(newSb)('<scene_time>0001-01-02T08:05</scene_time>\n正文。');
ok('① 前导零剥离', t1b.includes('『1年1月2日 08:05』'), JSON.stringify(t1b.slice(0, 60)));
const t1c = cf(oldSb)('<scene_time>0742-03-15T10:24</scene_time>\n正文。');
ok('① 旧版是直接删（对照）', !t1c.includes('『') && !t1c.includes('0742'), JSON.stringify(t1c.slice(0, 60)));

// ② 新元数据剥离：dice_calculation / review / charThink / jp:
const t2 = cf(newSb)('<dice_calculation>d20+5=17</dice_calculation>\n<!-- charThink: 内心戏 -->\n<!-- jp: メモ -->\n<review>复盘</review>\n正文A。\n<!-- plotThink: 旧格式也删 -->\n正文B。');
ok('② dice_calculation删', !t2.includes('d20') && !t2.includes('dice_calculation'), JSON.stringify(t2.slice(0, 80)));
ok('② review删', !t2.includes('复盘'), JSON.stringify(t2.slice(0, 80)));
ok('② charThink/jp/plotThink注释删', !t2.includes('charThink') && !t2.includes('メモ') && !t2.includes('plotThink'), JSON.stringify(t2.slice(0, 80)));
ok('② 正文保留', t2.includes('正文A') && t2.includes('正文B'), JSON.stringify(t2.slice(0, 80)));

// ③ Optional 模组 → 战况框
const MOD = [
  '<DiceCombat>\n回合1：攻击命中。\n\n特图的旁白：\n伤害 42。\n</DiceCombat>',
  '<CombatSnapshot>\n血量 1200/1500。\n</CombatSnapshot>',
  '<LootLog>\n获得：兽牙×2。\n</LootLog>',
].join('\n') + '\n正文。';
const t3 = cf(newSb)(MOD);
ok('③ DiceCombat→战况框', t3.includes('<战况>【掷骰 · 攻击】') && t3.includes('回合1：攻击命中。') && t3.includes('</战况>'), JSON.stringify(t3.slice(0, 120)));
ok('③ 空行/特图旁白过滤', !/\n\n/.test(t3.slice(t3.indexOf('【掷骰'), t3.indexOf('</战况>'))) && !t3.includes('特图的旁白'), JSON.stringify(t3.slice(t3.indexOf('【掷骰') - 10, t3.indexOf('</战况>') + 8)));
ok('③ CombatSnapshot→战况快照', t3.includes('【战况快照】') && t3.includes('血量 1200/1500。'), '');
ok('③ LootLog→战利品', t3.includes('【战利品】') && t3.includes('获得：兽牙×2。'), '');
ok('③ 旧版不处理模组（对照）', !cf(oldSb)('<CombatSnapshot>x</CombatSnapshot>\n正文。').includes('战况快照'), '');

// ④ 无<正文>+now_plot：转正文且对白行首花括号去掉
const t4 = cf(newSb)('<now_plot>\n{莉莉丝}「早上好，旅行者。」\n\n{阿瞳}『今天也要加油。』\n\n旁白行。\n</now_plot>');
ok('④ now_plot转正文', t4.includes('<正文>') && t4.includes('</正文>'), JSON.stringify(t4.slice(0, 60)));
ok('④ 花括号去除', t4.includes('莉莉丝「早上好，旅行者。」') && t4.includes('阿瞳『今天也要加油。』'), JSON.stringify(t4.slice(0, 120)));
ok('④ 引号内文本不动', t4.includes('早上好，旅行者。'), '');
ok('④ 旧版不去花括号（对照）', cf(oldSb)('<now_plot>\n{莉莉丝}「早上好。」\n</now_plot>').includes('{莉莉丝}'), '');

// ⑤ 有<正文>时：now_plot 不动、花括号不去
const t5 = cf(newSb)('<正文>\n{保留}「这里的括号不该被碰。」\n</正文>\n<now_plot>备用</now_plot>');
ok('⑤ 正文内花括号保留', t5.includes('{保留}「这里的括号不该被碰。」'), JSON.stringify(t5.slice(0, 100)));
ok('⑤ now_plot不动', !t5.includes('正文>') || t5.indexOf('备用') < 0 || !t5.includes('备用正文'), JSON.stringify(t5.slice(0, 100)));

if (fails) { console.error('\n验收未过: ' + fails + ' 项'); process.exit(1); }
console.log('\n修改7升级 ⑤′v2 验收全绿');
