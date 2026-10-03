import fs from 'node:fs';

const CARD = 'D:/BaiduNetdiskDownload/24/妖怪/地图/大雍/魔物娘图鉴世界254_正文美化版 (1).json';
const OUT = 'D:/BaiduNetdiskDownload/tavern_helper_template-main/src/魔典/原型/content-data.js';
const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const d = card.data;
const entries = d.character_book.entries;
const byComment = c => entries.find(e => e.comment === c);

const schema = d.extensions.tavern_helper.scripts.find(s => s.name === 'mvu_mge_schema').content;

// ---------- 1. firstMesText ----------
const firstMesText = card.first_mes.replace(/<\/?start>/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/^\n+|\n+$/g, '');

// ---------- 2. heroines ----------
const mObj = schema.match(/角色档案:\s*z\.object\(\{([\s\S]*?)\}\)\.prefault/);
const heroNames = [...mObj[1].matchAll(/^\s*(\S+):\s*z\.boolean\(\)/gm)].map(m => m[1]);
const idx = byComment('[ejs]女主索引（蓝灯引导）').content;
const introLines = idx.split(/\r?\n/).filter(l => /^- .+[:：]/.test(l));
const heroines = heroNames.map(name => {
  const line = introLines.find(l => l.replace(/^- /, '').split(/[:：]/)[0].includes(name));
  return { name, intro: line ? line.replace(/^- [^:：]+[:：]/, '').trim() : '' };
});

// ---------- 3. regions ----------
const regions = byComment('区域总索引（蓝灯引导）').content;

// ---------- 4. dexGuide ----------
const dex = byComment('[ejs]图鉴速览控制器').content;
const pickLines = dex.split(/\r?\n/).filter(l => /^\s*\/\/\s*(图鉴速览控制器|数据源：|本脚本通过|产出变量|本脚本不含|数据源行格式|大类标题格式|数据源按「大类」|因此段落|运行时派生)/.test(l)).map(l => l.trim());
const grab = (fromMarker, toMarker) => {
  const a = dex.indexOf(fromMarker); if (a === -1) throw new Error('dexGuide marker not found: ' + fromMarker);
  if (!toMarker) return dex.slice(a, a + fromMarker.length);
  const b = dex.indexOf(toMarker, a); if (b === -1) throw new Error('dexGuide end marker not found: ' + toMarker);
  return dex.slice(a, b + toMarker.length);
};
const dexGuide = [
  pickLines.join('\n'),
  grab('大类（成员数）—— 括号内为其下辖科属：', null),
  grab('需要某类完整名单 → 直接说出大类名或科属名；需要具体种族的完整资料 → 以种族名检索其 NO. 图鉴条目。', null),
  grab('使用规则：本索引仅提供类型/科属的成员清单与栖息地速查，不得代替具体种族条目作出行为或攻略判定；', null) +
  grab('正文如需展开叙述，以具体种族名检索其 NO. 条目为准。', null),
].join('\n');

// ---------- 5. statusSpec ----------
const statusSpec = byComment('等级属性与状态栏体系').content;

// ---------- 6. tagFormats ----------
const rules = byComment('AI运行总规则与沙盒引擎').content;
const sliceTag = (tag, tail) => {
  const head = '## <' + tag + '>标签';
  const a = rules.indexOf(head); if (a === -1) throw new Error('tag head not found: ' + tag);
  const b = rules.indexOf(tail, a); if (b === -1) throw new Error('tag tail not found: ' + tag);
  return rules.slice(a, b + tail.length);
};
const tagFormats = {
  '魔物生成': sliceTag('魔物生成', '</魔物生成>'),
  '获得物品': sliceTag('获得物品', '</获得物品>'),
  '获取任务': sliceTag('获取任务', '</获取任务>'),
  '技能生成': sliceTag('技能生成', '</技能生成>'),
  '较量面板': byComment('较量面板与行动菜单').content,
  '状态栏': (() => {
    const a = rules.indexOf('## <状态栏>标签');
    const b = rules.indexOf('\n\n## <较量面板>标签', a);
    if (a === -1 || b === -1) throw new Error('状态栏 section not found');
    return rules.slice(a, b).trimEnd();
  })(),
};

// ---------- 7. tierNames ----------
const tierNames = ['第一阶·平民阶', '第二阶·正规阶', '第三阶·精锐阶', '第四阶·英杰阶', '第五阶·英雄阶', '第六阶·传说阶', '第七阶·神话阶', '第八阶·权柄阶', '第九阶·半神阶', '第十阶·神阶', '第十一阶·神王阶'];

// ---------- 8. enums ----------
const q = schema.match(/品质枚举 = z\.enum\(\[([^\]]*)\]\)/);
const c = schema.match(/分类枚举 = z\.enum\(\[([^\]]*)\]\)/);
const parseArr = s => JSON.parse('[' + s.replace(/'/g, '"') + ']');
const enums = { 品质: parseArr(q[1]), 分类: parseArr(c[1]) };

// ---------- 9. welcomeOldTexts ----------
let wl = d.extensions.regex_scripts.find(s => s.scriptName === '欢迎页面').replaceString;
wl = wl.replace(/^```html\s*/, '').replace(/```\s*$/, '');
const wlHtml = wl
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<!--[\s\S]*?-->/g, '');
const BLOCK = /^(div|p|h[1-6]|section|article|header|footer|li|ul|ol|tr|td|th|table|br|button|label|fieldset|legend|form|nav|blockquote|pre|hr|img|input|textarea|select|option)$/i;
const wlText = wlHtml.replace(/<\/?([a-zA-Z0-9]+)(?:\s[^>]*)?>/g, (m, tag) => BLOCK.test(tag) ? '\n' : '');
const wlAll = [];
{
  const seenWl = new Set();
  for (const line of wlText.split(/\r?\n/)) {
    const t = line.replace(/&[a-z#0-9]+;/ig, '').replace(/[ \t]+/g, ' ').trim();
    if (t && /[\u4e00-\u9fff]/.test(t) && t.length <= 240 && !seenWl.has(t)) { seenWl.add(t); wlAll.push(t); }
  }
}
// 按源码顺序挑 30 条（覆盖四幕+三步骤全链路，略去字段级小标签与导航按钮）
const keepIdx = [2,3,4,5,6,7,8,9,10,11,12,13,14,16,18,23,29,30,32,33,34,35,42,43,46,47,48,52,53,64];
const welcomeOldTexts = keepIdx.map(i => wlAll[i - 1]);

// ---------- 10. schemaDefaults ----------
const schemaDefaults = {
  主角: {
    姓名: '无名旅人',
    等级: 1,
    阶层: '第一阶·平民阶',
    体力上限: 200,
    当前体力: 200,
    法力上限: 120,
    当前法力: 120,
    幸运: 10,
    魔化段位: '纯人类',
    资质: { 灵感: 10, 魅力: 10, 体质: 10, 信仰: 0 },
    心界住民好感: 0,
  },
  阵营声望: { 魔界友好度: 0, 教团信任度: 0, 佳婿风评: 0, 地方声望: {} },
  资产: { 金币: 0, 银币: 0, 铜币: 0, 魔晶: 0 },
  心界住民: {
    名字: '未选定',
    好感度: 0,
    实体化进度: '未实体化',
    当前状态: '',
    碎晶数: 0,
    当前碎晶线索: '无',
    已唤醒记忆: [],
  },
  图鉴: { 已遭遇种族: [], 结缘对象: [], 知识记录: {} },
  战斗: {
    状态: '空闲',
    当前对手: '无',
    对手阶层: '无',
    裁定: '无',
    战斗日志: '暂无较量记录',
  },
};

// ---------- assemble ----------
const data = {
  firstMesText,
  heroines,
  regions,
  dexGuide,
  statusSpec,
  tagFormats,
  tierNames,
  enums,
  welcomeOldTexts,
  schemaDefaults,
};
const js = '// 自动提取自魔物娘图鉴世界卡 · 勿手改\nwindow.MODIAN_DATA = ' + JSON.stringify(data, null, 2) + ';\n';
fs.writeFileSync(OUT, js, 'utf8');

// ---------- verification ----------
globalThis.window = {};
(0, eval)(js);
const D = globalThis.window.MODIAN_DATA;
const check = (name, ok, info) => console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + ' :: ' + info);
check('keys', JSON.stringify(Object.keys(D)) === JSON.stringify(['firstMesText','heroines','regions','dexGuide','statusSpec','tagFormats','tierNames','enums','welcomeOldTexts','schemaDefaults']), Object.keys(D).join(','));
check('firstMesText', !/start|\r/.test(D.firstMesText), 'len=' + D.firstMesText.length);
check('heroines', D.heroines.length === 13 && D.heroines.every(h => h.intro), D.heroines.map(h => h.name + (h.intro ? '' : '(空)')).join(','));
check('regions', D.regions.length <= 3000, 'len=' + D.regions.length);
check('dexGuide', D.dexGuide.length <= 2000 && !D.dexGuide.includes('<%'), 'len=' + D.dexGuide.length);
check('statusSpec', D.statusSpec.length <= 4000, 'len=' + D.statusSpec.length);
for (const [k, v] of Object.entries(D.tagFormats)) check('tagFormats.' + k, v.length <= 1200, 'len=' + v.length);
check('tierNames', D.tierNames.length === 11, D.tierNames.join('、'));
check('enums', D.enums.品质.length === 7 && D.enums.分类.length === 11, D.enums.品质.join('/') + ' | ' + D.enums.分类.join('/'));
check('welcomeOldTexts', D.welcomeOldTexts.length <= 30 && D.welcomeOldTexts.every(Boolean), 'count=' + D.welcomeOldTexts.length);
check('schemaDefaults', D.schemaDefaults.主角.阶层 === '第一阶·平民阶' && D.schemaDefaults.资产.金币 === 0, 'ok');
// heroine index head for reply
console.log('=====女主索引头600字=====');
console.log(idx.slice(0, 600));
console.log('=====dexGuide 全文=====');
console.log(D.dexGuide);
console.log('=====状态栏 tagFormats 全文=====');
console.log(D.tagFormats['状态栏']);
console.log('=====welcomeOldTexts=====');
console.log(D.welcomeOldTexts.map((t, i) => (i + 1) + '. ' + t).join('\n'));
