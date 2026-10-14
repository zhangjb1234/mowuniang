// statusCardHtml 渲染烟测：桩掉宿主依赖，验证三条取数路径与折叠逻辑
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync('C:/Users/Administrator/Downloads/跑/_mowuniang_repo/src/魔典/原型/魔典原型.html', 'utf8');
const i = html.indexOf('const STATUS_OPEN_KEY');
const j = html.indexOf('function renderFloor', i);
if (i < 0 || j < 0) throw new Error('切段失败');
const code = html.slice(i, j);
const sandbox = {
  console,
  esc: s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;'),
  ICON: { eye: '<svg/>' },
  FLOORS: [{ idx: 0 }, { idx: 1 }, { idx: 2 }, { idx: 3 }],
  meter: (l, c, m) => `<div class="meter">${l}${c}/${m}</div>`,
  meterCentered: (l, c, m) => `<div class="meter c">${l}${c}/${m}</div>`,
  chips: a => `<div class="chip-row">${a.join(',')}</div>`,
  parseFields: t => { const fields = [], extras = []; for (const line of String(t).split('\n')) { const m = line.match(/^([^：:]{1,12})[：:]\s*(.+)$/); if (m) fields.push([m[1], m[2]]); else if (line.trim()) extras.push(line.trim()); } return { fields, extras }; },
  paintMeters: () => {},
  dexHost: () => sandbox.window,
  hostPick: () => undefined,
  hostFrames: () => [],
  Stat: { pick: name => name === 'Mvu' ? { getMvuData: d => d && d.message_id === 3 ? { stat_data: STAT.stat_data } : null } : undefined },
  document: { addEventListener: () => {} },
};
sandbox.window = sandbox;
sandbox.window.__modian_status_open = {};
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'statusbook.js' });

let fails = 0;
const ok = (name, cond, extra) => { if (cond) console.log('OK  ', name); else { fails++; console.error('FAIL', name, extra || ''); } };

const STAT = { stat_data: { 主角: { 姓名: '卢茜安', 种族: '人类', 等级: 6, 阶层: '第一阶·平民阶', 当前体力: 240, 体力上限: 240, 当前法力: 144, 法力上限: 144, 战斗力基础: 100, 敏捷基础: 60, 防御基础: 60, 幸运: 10, 资质: { 灵感: '10' }, 魔化度: 0, 所在地: '雷斯卡特耶·客栈「垂铃」' }, 世界: { 地点: '雷斯卡特耶·客栈「垂铃」', 时段: '夜晚' }, 阵营声望: { 教团信任度: 5 }, 羁绊: { '堤露埃拉': { 种族: '魅魔', 好感度: 42, 关系: '挚友', 心理活动: '「他今天累了吗」' } }, 心界住民: { 名字: '菲娜', 好感度: 35, 实体化进度: '形态二' }, 战斗: { 状态: '空闲' } } };

// ① MVU 路径
const r1 = { flow: [{ text: '客栈里。\n堤露埃拉帮你放下行囊。' }], cover: false, statusText: '' };
const h1 = sandbox.statusCardHtml({ idx: 3, stat: null }, 3, r1);
ok('① 有MVU→画状态簿', h1.includes('状态簿') && h1.includes('STATVS'), '');
ok('① 主角行', h1.includes('卢茜安') && h1.includes('Lv.6'));
ok('① 生命法力条', h1.includes('240') && h1.includes('144'));
ok('① 四属性', h1.includes('战斗力') && h1.includes('幸运'));
ok('① 资质/魔化/阵营/所在地', h1.includes('灵感') && h1.includes('魔化度') && h1.includes('教团信任') && h1.includes('垂铃'));
ok('① 在场角色(羁绊名在正文)', h1.includes('堤露埃拉') && h1.includes('挚友') && h1.includes('他今天累了吗'));
ok('① 心界住民块', h1.includes('菲娜') && h1.includes('形态二'));
ok('① 较量空闲不画', !h1.includes('较量'));
ok('① 最新页默认展开', h1.includes(' open'));
ok('① 来源标注', h1.includes('本楼 MVU 变量'));

// ② AI状态栏文本兜底
const r2 = { flow: [{ text: '正文' }], cover: false, statusText: '【无名旅人】\n等级：Lv.3（第一阶·平民阶）\n生命：200 / 200\n所在地：客栈' };
const h2 = sandbox.statusCardHtml({ idx: 1 }, 1, r2);
ok('② 文本兜底→状态簿', h2.includes('状态簿') && h2.includes('无名旅人') && h2.includes('Lv.3'));
ok('② 来源=AI状态栏文本', h2.includes('AI 状态栏文本'));
ok('② 旧页默认折叠', !h2.includes(' open'));

// ③ 都没有 → 不画
const h3 = sandbox.statusCardHtml({ idx: 1 }, 1, { flow: [{ text: '正文' }], cover: false, statusText: '' });
ok('③ 无数据不画', h3 === '');

// ④ 封面楼不画
const h4 = sandbox.statusCardHtml({ idx: 1 }, 1, { cover: true, statusText: 'x' });
ok('④ 封面不画', h4 === '');

if (fails) { console.error('\n烟测未过: ' + fails + ' 项'); process.exit(1); }
console.log('\nstatusCardHtml 烟测全绿');
