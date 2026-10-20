// [修改5] 泉此方日文思维链/标签泄露 功能验收：vm 切出解析链，跑教程验收项
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

// 病灶楼：Izumi 日文思维链 + 中文正文；思考里行内提到五件套标签名
const RAW_IZUMI = `<konatan_planning~>
（第2楼）
次のシーンは夕暮れの辺境町。IzumiEditで感情の補線を入れる。
出力順：「<状态栏>、<魔物生成>、<获得物品>をすべて</正文>の後に出力する」
</konatan_planning~>
<tucao>夕焼けの余韻を大事にしたい一幕。灯りが灯る描写はここ。</tucao>
『圣历742年4月12日·傍晚-边境城镇·灰栖镇』
<正文>
夕阳的最后一点红光沉进地平线，镇口的灯一盏盏亮起。
她在桥头站定，裙摆被晚风掀起一角。
</正文>
<魔物生成>
种族：史莱姆
品质：普通
</魔物生成>
<获得物品>
物品名称：试作药水
品质：精良
</获得物品>`;

const r = sandbox.parseFloor(RAW_IZUMI);
const t = FLOWTEXT(r);

ok('① 场景标头正确', r.header === '『圣历742年4月12日·傍晚-边境城镇·灰栖镇』', JSON.stringify(r.header));
ok('② 小此留言收到1条tucao', (r.konataNotes || []).length === 1 && r.konataNotes[0].type === 'tucao', JSON.stringify(r.konataNotes || '').slice(0, 120));
ok('② 留言内容完整', (r.konataNotes[0]?.content || '').includes('夕焼けの余韻'));
ok('③ 正文首段从夕阳开始', (t.split('\n').find(Boolean) || '').startsWith('夕阳的最后一点红光'), JSON.stringify((t.split('\n').find(Boolean) || '').slice(0, 40)));
ok('③ 正文不含 konatan', !t.includes('konatan'));
ok('③ 正文不含思考句（をすべて）', !t.includes('をすべて'));
ok('③ 正文不含（第2楼）', !t.includes('第2楼'));
ok('③ 正文不含 <tucao', !/<tucao/i.test(t));
ok('③ 正文不含 IzumiEdit', !t.includes('IzumiEdit'));
ok('③ 正文含两段人话', t.includes('镇口的灯一盏盏亮起') && t.includes('裙摆被晚风掀起一角'));
const mg = (r.cards || []).filter(c => c.tag === '魔物生成');
const wp = (r.cards || []).filter(c => c.tag === '获得物品');
ok('④ <魔物生成> 恰一次', mg.length === 1, JSON.stringify((r.cards || []).map(c => c.name)));
ok('④ <获得物品> 恰一次', wp.length === 1);
ok('④ 卡内容完整', JSON.stringify(r.cards).includes('史莱姆') && JSON.stringify(r.cards).includes('试作药水'));

// 另测：正文行内写到 <获得物品> 不会被当功能卡抢走
const RAW_INLINE = `<正文>
他把笔记本翻开，里面用小字抄着「<获得物品>」的申报格式，旁边画了个歪歪的图。
</正文>
<获得物品>
物品名称：真正的掉落物
</获得物品>`;
const r2 = sandbox.parseFloor(RAW_INLINE);
ok('⑤ 行内提及不算卡', (r2.cards || []).filter(c => c.tag === '获得物品').length === 1, JSON.stringify((r2.cards || []).map(c => c.tag)));
ok('⑤ 行内提及留在正文', FLOWTEXT(r2).includes('申报格式'), JSON.stringify(FLOWTEXT(r2).slice(0, 80)));

if (fails) { console.error('\n验收未过: ' + fails + ' 项'); process.exit(1); }
console.log('\n修改5 泉此方泄露验收全绿');
