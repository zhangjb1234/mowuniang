/* [修改 27] 魔典-装帧二 v1
 * 只在内核渲染完成后「补」DOM：#page-base 挂一个只看直接子节点的 MutationObserver（同魔典-增强，不看 subtree），
 *   每样东西都带幂等标记，重复触发只会白跑一遍查询。
 * 装帧规则全部挂在 html.mx-deco 下：阅读设置「装帧 简洁」一键全关；省电模式挂 html.mx-lite，是独立开关。
 * 性能纪律：不加常驻动画；无 blur / backdrop-filter / mix-blend-mode / 外链字体图片；纹理只用内联 SVG data URI；
 *   入场动画一次性 ≤0.35s、只动 opacity / transform；日序按楼层号缓存，旧楼只算一次。
 */
(function(){
'use strict';
if(window.__mxDeco2) return;
window.__mxDeco2 = { version:1 };

const root = document.documentElement;
const LS = {
  get(k, fb){ try{ const v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; }catch(e){ return fb; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} },
};
const floors = () => (typeof FLOORS !== 'undefined' && Array.isArray(FLOORS)) ? FLOORS : [];
const curIdx = () => (typeof cur === 'number') ? cur : floors().length - 1;
const mem = (()=>{ let h = window; try{ if(typeof dexHost === 'function') h = dexHost(); }catch(e){} try{ return h.__mxDeco2Mem || (h.__mxDeco2Mem = {}); }catch(e){ return window.__mxDeco2Mem || (window.__mxDeco2Mem = {}); } })();
const txt = el => (el && el.textContent || '').replace(/\s+/g, ' ').trim();
function chatKey(){
  try{
    const st = hostPick('SillyTavern');
    const c = st && st.getContext && st.getContext();
    const id = c && (c.chatId || (typeof c.getCurrentChatId === 'function' && c.getCurrentChatId()));
    if(id) return String(id);
  }catch(e){}
  return 'local';
}
/* 只认「这一楼」的变量快照（与状态簿同口径）；取不到返回 null，不回退聊天级，免得旧楼全吃最新值 */
function sdAt(i){
  const f = floors()[i];
  if(!f) return null;
  try{ if(typeof floorStatData === 'function'){ const r = floorStatData(f, i); if(r && r.sd) return r.sd; } }catch(e){}
  return null;
}
function worldAt(i, allowChat){
  const sd = sdAt(i);
  let w = sd && sd['世界'];
  if((!w || typeof w !== 'object') && allowChat){
    try{ const f = floors()[i]; w = Stat.getFloor('世界', f ? f.idx : null, null); }catch(e){ w = null; }
  }
  return (w && typeof w === 'object') ? w : null;
}
const hash = s => { let h = 0; for(const c of String(s)) h = (h * 31 + c.codePointAt(0)) >>> 0; return h; };

/* ═════════ 七 · 省电模式（最先执行，免得常驻动画先跑起来） ═════════
   自动：内存 ≤4GB / 核心 ≤4 / 触屏小屏 → 精简。精简 = 所有 CSS 动画只播一轮（与系统「减少动态效果」同一手法），
   书页上的入场动画也省掉；静态装帧一样不少。阅读设置里「动效 自动 / 精简 / 完整」可手动改。 */
const LITE_KEY = 'mx-lite-mode';
let liteMode = LS.get(LITE_KEY, 'auto');
if(liteMode !== 'on' && liteMode !== 'off') liteMode = 'auto';
function liteAuto(){
  try{
    const n = navigator;
    if(n.deviceMemory && n.deviceMemory <= 4) return true;
    if(n.hardwareConcurrency && n.hardwareConcurrency <= 4) return true;
    if(window.matchMedia && matchMedia('(pointer:coarse)').matches && Math.min(screen.width || 9999, screen.height || 9999) <= 480) return true;
  }catch(e){}
  return false;
}
const liteOn = () => liteMode === 'on' || (liteMode === 'auto' && liteAuto());
function applyLite(){ root.classList.toggle('mx-lite', liteOn()); }
applyLite();

/* ═════════ SVG 素材（两套主题各一份，生成 data URI） ═════════ */
const svgUri = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const NS = "xmlns='http://www.w3.org/2000/svg'";
/* 卷草纹分隔：中心菱花 + 左右各一道回卷的藤蔓与两片叶，外侧细线渐隐 */
const vineSvg = c => {
  const half = `<path d='M0 12h70' stroke='url(#f)' stroke-width='.9'/>`
    + `<path d='M110 12c-8 0-11-7-18-6-5 1-5 8 0 8 3 0 3-4 0-4' fill='none' stroke='${c}' stroke-width='1.1' stroke-linecap='round'/>`
    + `<path d='M92 12c-6 0-10 4-16 2' fill='none' stroke='${c}' stroke-width='.9' stroke-linecap='round'/>`
    + `<path d='M100 9q-4-6-11-5 3 5 11 5z' fill='${c}' fill-opacity='.75'/>`
    + `<path d='M84 15q-3 4-9 4 2-4 9-4z' fill='${c}' fill-opacity='.6'/>`;
  return svgUri(`<svg ${NS} viewBox='0 0 240 24'><defs><linearGradient id='f'><stop offset='0' stop-color='${c}' stop-opacity='0'/>`
    + `<stop offset='1' stop-color='${c}' stop-opacity='.7'/></linearGradient></defs>`
    + `<g>${half}</g><g transform='matrix(-1 0 0 1 240 0)'>${half}</g>`
    + `<path d='M120 4l7 8-7 8-7-8z' fill='${c}'/><path d='M120 8.5l3 3.5-3 3.5-3-3.5z' fill='none' stroke='${c}' stroke-opacity='.4'/>`
    + `<circle cx='120' cy='12' r='1.3' fill='${c}' fill-opacity='.35'/></svg>`);
};
const rainSvg = c => svgUri(`<svg ${NS} viewBox='0 0 36 36'><g stroke='${c}' stroke-width='1' stroke-linecap='round'>`
  + `<path d='M7 2l-2.5 8'/><path d='M25 13l-2.5 8'/><path d='M15 25l-2 6.5'/><path d='M33 28l-1.5 5'/></g></svg>`);
const snowSvg = c => svgUri(`<svg ${NS} viewBox='0 0 40 40'><g fill='${c}'>`
  + `<circle cx='6' cy='7' r='1.4'/><circle cx='27' cy='4' r='1'/><circle cx='17' cy='20' r='1.6'/><circle cx='35' cy='24' r='1.1'/><circle cx='9' cy='33' r='1'/><circle cx='28' cy='36' r='1.4'/></g></svg>`);

/* 天头时段小图标（currentColor，跟着页眉字色走） */
const TOD_ICO = {
  day:  `<circle cx='8' cy='8' r='3'/><path d='M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.4 3.4l1.3 1.3M11.3 11.3l1.3 1.3M3.4 12.6l1.3-1.3M11.3 4.7l1.3-1.3'/>`,
  dawn: `<path d='M4.5 11a3.5 3.5 0 0 1 7 0'/><path d='M1.5 11h13M8 3v2M3.6 5.6l1.2 1.2M12.4 5.6l-1.2 1.2M4 13.5h8'/>`,
  dusk: `<path d='M4.5 10a3.5 3.5 0 0 1 7 0'/><path d='M1.5 10h13M3 12.5h10M5 14.6h6'/>`,
  night:`<path d='M11.8 10.6A5 5 0 0 1 6.4 3.2a5 5 0 1 0 5.4 7.4z'/><path d='M12.5 2.5v2M11.5 3.5h2'/>`,
};

/* ═════════ 一 · 天色：时段静态色调 + 雨 / 雪 / 雾 / 阴 静态纹理 ═════════ */
const TOD_RULES = [
  ['night', /凌晨|深夜|午夜|子夜|半夜|入夜|夜|晚上|子时|丑时|亥时/],
  ['dusk',  /黄昏|傍晚|日暮|薄暮|夕|暮|酉时|戌时/],
  ['dawn',  /黎明|拂晓|破晓|清晨|早晨|晨|寅时|卯时/],
  ['day',   /白昼|白天|上午|中午|正午|午后|下午|晌午|日间|昼|午|辰时|巳时|未时|申时/],
];
function todOf(w){
  for(const src of [w['时段'], w['时间']]){
    const s = String(src || '');
    if(!s) continue;
    for(const [k, re] of TOD_RULES) if(re.test(s)) return k;
  }
  return '';
}
function wxOf(w){
  const s = String(w['天气'] || '');
  if(/雪|霜|冰雹|霰/.test(s)) return 'snow';
  if(/雷|暴雨|风暴/.test(s)) return 'storm';
  if(/雨/.test(s)) return 'rain';
  if(/雾|霾|沙尘|烟尘/.test(s)) return 'fog';
  if(/阴|多云/.test(s)) return 'cloud';
  return '';
}
function ambience(page){
  const w = worldAt(curIdx(), true);
  const tod = w ? todOf(w) : '', wx = w ? wxOf(w) : '';
  let amb = page.querySelector(':scope > .mx-amb');
  if(!tod && !wx){ if(amb) amb.remove(); return; }
  if(!amb){ amb = document.createElement('span'); amb.className = 'mx-amb'; amb.setAttribute('aria-hidden', 'true'); page.appendChild(amb); }
  if(amb.dataset.tod !== tod) amb.dataset.tod = tod;
  if(amb.dataset.wx !== wx) amb.dataset.wx = wx;
  const head = page.querySelector(':scope > .folio-head');
  const subs = head ? head.querySelectorAll(':scope > .wh-latin') : [];
  const sub = subs.length ? subs[subs.length - 1] : null;
  if(tod && sub && !head.querySelector('.mx-tod')){
    const i = document.createElement('i');
    i.className = 'mx-tod'; i.setAttribute('aria-hidden', 'true');
    i.innerHTML = `<svg viewBox='0 0 16 16' fill='none' stroke='currentColor' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round'>${TOD_ICO[tod]}</svg>`;
    sub.insertBefore(i, sub.firstChild);
  }
}

/* ═════════ 二 · 场景分隔：***／———／◇◇◇ 独占一段 → 卷草纹；页中独立的『…』场景行之前补一道 ═════════ */
const SCENE_RE = /^[\s*＊\-—–─━=~～·•◇◆◈❖✦✧†※#]+$/;
function scenes(sc){
  let first = true;
  sc.querySelectorAll('.prose > p').forEach(p => {
    const isNew = !p.hasAttribute('data-mx2s');
    if(isNew) p.setAttribute('data-mx2s', '');
    const t = txt(p);
    if(isNew && t.replace(/\s/g, '').length >= 3 && SCENE_RE.test(t)){
      p.className = 'mx-scene'; p.setAttribute('role', 'separator'); p.setAttribute('aria-label', '场景转换'); p.textContent = '';
      return;
    }
    if(isNew && !first && /^『[^』]{1,80}』$/.test(t)) p.classList.add('mx-scene-line');
    if(t) first = false;
  });
}

/* ═════════ 三 · 说话人着色 ═════════
   ① 明写格式 `名[表情]:"台词"`（小猫之神等）：段首前缀换成名牌，引号台词按对白上色；不需要白名单。
   ② 其余对白（「…」/“…”）：只认白名单——16 位女主（全名与「·」前的短名）+ 本楼羁绊名单。
      同一段里，对白前最近一次出现的白名单名字 = 说话人；对白前没有就看紧跟其后的 8 字内。
      认出来的：名字加粗着色、对白下加一道同色细线。认不出的保持原样，不猜。
   颜色：女主按名册序号固定色相；其他人按名字散列色相。两套主题各自定明度，保证对比。 */
let spkCache = { key:null, re:null, map:null };
function stripName(s){ return String(s || '').replace(/[（(【\[][^）)】\]]*[）)】\]]/g, '').trim(); }
function speakerTable(){
  const hs = (window.MODIAN_DATA && Array.isArray(window.MODIAN_DATA.heroines)) ? window.MODIAN_DATA.heroines : [];
  let bonds = {};
  try{ const sd = sdAt(curIdx()); bonds = (sd && sd['羁绊']) || Stat.get('羁绊', {}) || {}; }catch(e){}
  const bkeys = (bonds && typeof bonds === 'object' && !Array.isArray(bonds)) ? Object.keys(bonds) : [];
  const key = bkeys.join('|');
  if(spkCache.key === key && spkCache.map) return spkCache;
  const map = new Map();
  const add = (alias, canon, hue) => { alias = stripName(alias); if(alias.length >= 2 && !map.has(alias)) map.set(alias, { name:canon, hue }); };
  hs.forEach((h, i) => {
    const full = stripName(h && h.name); if(!full) return;
    const hue = Math.round(i * 360 / Math.max(hs.length, 1) + 8) % 360;
    add(full, full, hue);
    const head = full.split(/[·・]/)[0]; if(head !== full) add(head, full, hue);
  });
  bkeys.forEach(k => {
    const full = stripName(k); if(!full) return;
    const hit = map.get(full) || map.get(full.split(/[·・]/)[0]);
    const hue = hit ? hit.hue : otherHue(full);
    add(full, hit ? hit.name : full, hue);
    const head = full.split(/[·・]/)[0]; if(head !== full) add(head, hit ? hit.name : full, hue);
  });
  const alts = [...map.keys()].sort((a, b) => b.length - a.length).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  spkCache = { key, map, re: alts.length ? new RegExp(alts.join('|'), 'g') : null };
  return spkCache;
}
const EXPLICIT_RE = /^\s*([^\s\[\]【】:：「」“”"<>]{1,12}?)\s*(?:[\[【]([^\]】]{1,16})[\]】])?\s*[:：]\s*/;
/* 非白名单的人落在两位女主色相的正中间（女主每 22.5° 一位），撞色概率最低 */
const otherHue = name => Math.round(8 + 11.25 + 22.5 * (hash(name) % 16)) % 360;
function hueFor(name, tbl){ const hit = tbl.map.get(stripName(name)); return hit ? hit.hue : otherHue(stripName(name)); }
/* 没写 [表情] 时，名字得像个名字：在白名单里，或不含人称代词、不以「道/说/问…」收尾（挡住「她低声道："…"」） */
const SAY_TAIL = /[道说问喊答笑叫吼骂叹应嚷曰哼念]$/, PRONOUN = /[你我他她它们]/;
const nameLike = (name, tbl) => tbl.map.has(stripName(name)) || (stripName(name).length <= 8 && !SAY_TAIL.test(name) && !PRONOUN.test(name));
/* 直引号台词 "…" 内核不上色：只把引号这一段包成 span.dlg，引号后的旁白原样留在外面 */
function mkDlg(textNode){
  const v = textNode.nodeValue, close = v.indexOf('"', 1);
  if(close > 0 && close < v.length - 1) textNode.splitText(close + 1);
  const s = document.createElement('span');
  s.className = 'dlg'; textNode.replaceWith(s); s.appendChild(textNode);
  return s;
}
function speakers(sc){
  const tbl = speakerTable();
  sc.querySelectorAll('.prose > p:not([data-mx2w])').forEach(p => {
    p.setAttribute('data-mx2w', '');
    let pend = null;
    /* ① 明写格式 */
    const first = p.firstChild;
    if(first && first.nodeType === 3){
      const m = EXPLICIT_RE.exec(first.nodeValue);
      if(m){
        const rest = first.nodeValue.slice(m[0].length);
        const nx = first.nextSibling;
        const quoted = /^["“「]/.test(rest) || (!rest && nx && nx.nodeType === 1 && nx.classList.contains('dlg'));
        /* 带 [表情] 的一律认；不带的只认直引号 "…" 且名字像名字（中文旁白「X道：「…」」不动） */
        const explicit = quoted && (m[2] ? true : (/^"/.test(rest) && nameLike(m[1], tbl)));
        if(explicit){
          const name = m[1], hue = hueFor(name, tbl);
          const chip = document.createElement('span');
          chip.className = 'mx-spk'; chip.style.setProperty('--wh', hue);
          chip.textContent = stripName(name) || name;
          if(m[2]){ const em = document.createElement('i'); em.textContent = m[2]; chip.appendChild(em); }
          first.nodeValue = rest;
          p.insertBefore(chip, first);
          if(/^"/.test(rest)) mkDlg(first);
          const known = tbl.map.get(stripName(name));
          pend = { hue, name: known ? known.name : (stripName(name) || name) };
          p.classList.add('mx-said');
        }
      }
    }
    if(!tbl.re && !pend) return;
    /* ② 白名单归属：按文档序走一遍，对白节点不往里钻 */
    const wraps = [];
    let waiting = [];
    const setWho = (d, who) => { if(d.dataset.who) return; d.dataset.who = who.name; d.style.setProperty('--wh', who.hue); };
    const visit = node => {
      for(const n of [...node.childNodes]){
        if(n.nodeType === 3){
          if(!tbl.re) continue;
          const s = n.nodeValue; tbl.re.lastIndex = 0;
          let m, fm = null, lm = null;
          while((m = tbl.re.exec(s))){ if(!fm) fm = m; lm = m; }
          if(fm && waiting.length && fm.index <= 8){
            const who = tbl.map.get(fm[0]);
            waiting.forEach(d => setWho(d, who));
            wraps.push({ n, i:fm.index, len:fm[0].length, hue:who.hue });
          }
          if(s.trim()) waiting = [];
          if(lm){ const who = tbl.map.get(lm[0]); pend = { hue:who.hue, name:who.name, ref:{ n, i:lm.index, len:lm[0].length, hue:who.hue } }; }
        }else if(n.nodeType === 1){
          if(n.classList.contains('mx-spk')) continue;
          if(n.classList.contains('dlg')){
            if(pend){ setWho(n, pend); if(pend.ref){ wraps.push(pend.ref); pend.ref = null; } }
            else waiting.push(n);
          }else visit(n);
        }
      }
    };
    visit(p);
    /* 同一文本节点里从后往前切，前面的下标不受影响 */
    const seen = new Map();
    wraps.filter(w => { const set = seen.get(w.n) || new Set(); seen.set(w.n, set); if(set.has(w.i)) return false; set.add(w.i); return true; })
      .sort((a, b) => b.i - a.i)
      .forEach(w => {
        if(!w.n.parentNode || w.i + w.len > w.n.nodeValue.length) return;
        const mid = w.n.splitText(w.i); mid.splitText(w.len);
        const b = document.createElement('b');
        b.className = 'mx-name'; b.style.setProperty('--wh', w.hue);
        mid.replaceWith(b); b.appendChild(mid);
      });
  });
}

/* ═════════ 四 · 获得物品：品质色（复用行囊的 mx-q0…7 色阶与 enums.品质 排序） ═════════ */
function qualIndex(s){
  const Q = (typeof D !== 'undefined' && typeof g === 'function') ? (g(D, 'enums.品质', []) || []) : [];
  const t = String(s || '').trim();
  if(!t || !Q.length) return -1;
  let best = -1, bl = 0;
  Q.forEach((q, i) => { if(!q) return; if(t === q || (q.length >= 2 && t.includes(q) && q.length > bl)){ best = i; bl = q.length; } });
  return best;
}
function itemQuality(sc){
  sc.querySelectorAll('.specimen.t-res:not([data-mx2q])').forEach(card => {
    card.setAttribute('data-mx2q', '');
    let top = -1;
    card.querySelectorAll('.sp-fields > dt').forEach(dt => {
      if(!/品质|品阶|稀有度/.test(txt(dt))) return;
      const dd = dt.nextElementSibling; if(!dd || dd.tagName !== 'DD') return;
      const qi = qualIndex(txt(dd)); if(qi < 0) return;
      dd.classList.add('mx-qdd', 'mx-q' + qi);
      top = Math.max(top, qi);
    });
    if(top < 0) return;
    card.classList.add('mx-qcard', 'mx-q' + top);
    if(top >= 6) card.classList.add('mx-qhi');
    const edge = document.createElement('i');
    edge.className = 'mx-qedge'; edge.setAttribute('aria-hidden', 'true');
    card.appendChild(edge);
  });
}

/* ═════════ 五 · 魔物娘档案：属徽 + 大类印（28 大类按序号取色相） ═════════ */
let raceIdx = null;
function races(){
  if(raceIdx) return raceIdx;
  const cats = (window.MODIAN_DEX && window.MODIAN_DEX.cats) || [];
  const out = [];
  cats.forEach((c, ci) => (c.races || []).forEach(r => {
    const fam = r.family || r.family2 || '';
    const hue = Math.round(ci * 137.508) % 360;
    [r.name].concat(String(r.alias || '').split(/[、，,/／\s]+/)).forEach(n => {
      n = String(n || '').trim();
      if(n.length >= 2) out.push({ n, fam, cat:c.name || '', hue });
    });
  }));
  out.sort((a, b) => b.n.length - a.n.length);
  return (raceIdx = out);
}
function monsterSeal(sc){
  sc.querySelectorAll('.specimen.t-monstrum:not([data-mx2r])').forEach(card => {
    card.setAttribute('data-mx2r', '');
    let race = '';
    card.querySelectorAll('.sp-fields > dt').forEach(dt => { if(!race && /^种族$|^种族名|^所属种族/.test(txt(dt))){ const dd = dt.nextElementSibling; if(dd) race = txt(dd); } });
    if(!race) return;
    const hit = races().find(r => race.includes(r.n));
    if(!hit) return;
    const head = card.querySelector('.sp-head'), title = head && head.querySelector('.sp-title');
    if(!title) return;
    const chip = document.createElement('span');
    chip.className = 'mx-fam'; chip.style.setProperty('--fh', hit.hue);
    chip.title = [hit.cat, hit.fam].filter(Boolean).join(' · ');
    const seal = document.createElement('b'); seal.textContent = (hit.cat || hit.fam || '?').charAt(0);
    chip.appendChild(seal);
    if(hit.fam || hit.cat) chip.appendChild(document.createTextNode(hit.fam || hit.cat));
    title.after(chip);
  });
}

/* ═════════ 六 · 日序缎带：世界.时间 去掉时刻后的「日期」与上一楼不同 → 页首「第 N 日 · 季节」 ═════════
   卡里没有天数变量，N 是从第一楼数到本楼的「日期变化次数」。日期认法：中文数字归一成阿拉伯数字，
   去掉 HH:MM / X点X分 / 时辰 / 清晨午后黄昏等时段词，剩下的串必须含「日 / 号 / 天」或「X月X / 初X」才算日期；
   「圣历纪年待定」这类占位不算。每楼结果按楼层号缓存（最新两楼每次重算，防重 roll 后不更新）。 */
const CN = { '零':0, '〇':0, '一':1, '二':2, '两':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9 };
function cnRun(s){
  if(!/[十百千]/.test(s)) return s.split('').map(c => CN[c]).join('');
  let n = 0, d = 0;
  for(const c of s){ if(c in CN) d = CN[c]; else { n += (d || 1) * (c === '十' ? 10 : c === '百' ? 100 : 1000); d = 0; } }
  return String(n + d);
}
function dateKey(raw){
  let t = String(raw == null ? '' : raw);
  if(!t || /待定|未知|不详|未定/.test(t)) return '';
  t = t.replace(/[零〇一二两三四五六七八九十百千]+/g, cnRun)
    .replace(/\d{1,2}\s*[:：]\s*\d{2}(\s*[:：]\s*\d{2})?/g, '')
    .replace(/[子丑寅卯辰巳午未申酉戌亥]时(初|正|末)?(\d刻)?/g, '')
    .replace(/\d{1,2}\s*[点时](\s*\d{1,2}\s*分|半|许|整)?/g, '')
    .replace(/凌晨|拂晓|黎明|破晓|清晨|早晨|早上|上午|晌午|中午|正午|午后|下午|傍晚|黄昏|日暮|薄暮|入夜|夜晚|晚上|夜间|深夜|午夜|子夜|半夜|白昼|白天|夜里|晨间|午间|时分|左右|前后|时许|[一1]刻/g, '')
    .replace(/[\s·・,，、。.\-—|｜/\\()（）【】\[\]]+/g, '')
    .replace(/([日号天])[晨早午晚夜昏暮昼间的之]+$/, '$1')
    .replace(/[的之]+$/, '');
  return /[日号天]|月初?\d|初\d/.test(t) ? t : '';
}
function dayKeyAt(i){
  const fs = floors(), f = fs[i];
  if(!f) return '';
  const ck = 'day:' + chatKey();
  const cache = mem[ck] || (mem[ck] = {});
  const id = String(Number.isInteger(f.idx) ? f.idx : i);
  if(i < fs.length - 2 && Object.prototype.hasOwnProperty.call(cache, id)) return cache[id];
  const w = worldAt(i, false);
  const k = w ? dateKey(w['时间'] || w['日期'] || '') : '';
  cache[id] = k;
  return k;
}
function dayRibbon(sc){
  if(sc.querySelector(':scope > .mx-day')) return;
  const i = curIdx(), k = dayKeyAt(i);
  if(!k) return;
  let prev = '';
  for(let j = i - 1; j >= 0 && !prev; j--) prev = dayKeyAt(j);
  if(prev === k) return;
  let n = 0, last = '';
  for(let j = 0; j <= i; j++){ const kk = dayKeyAt(j); if(kk && kk !== last){ n++; last = kk; } }
  const w = worldAt(i, false) || {};
  const season = String(w['季节'] || '').trim();
  const el = document.createElement('div');
  el.className = 'mx-day'; el.setAttribute('role', 'note');
  el.innerHTML = `<b>第 ${n} 日</b>${season ? `<i>${season.replace(/[&<>"']/g, '')}</i>` : ''}`;
  sc.insertBefore(el, sc.firstChild);
}

/* ═════════ 样式 ═════════ */
const DV = 'html.mx-deco:not([data-mdx-theme="night"])', DN = 'html.mx-deco[data-mdx-theme="night"]';
const CSS = `
/* 省电：常驻动画只播一轮（与 prefers-reduced-motion 同口径） */
html.mx-lite *,html.mx-lite *::before,html.mx-lite *::after{animation-iteration-count:1!important}
html.mx-lite .mx-day,html.mx-lite .mx-scene{animation:none!important}

/* 一 · 天色 */
.mx-amb{display:none}
html.mx-deco #page-base > .mx-amb{display:block;position:absolute;inset:0;z-index:0;pointer-events:none;border-radius:inherit}
html.mx-deco #page-base > .mx-amb::after{content:'';position:absolute;inset:0;background-repeat:repeat}
${DV} .mx-amb[data-tod="dawn"]{background:radial-gradient(120% 55% at 50% -8%,rgba(236,160,112,.17),transparent 62%)}
${DV} .mx-amb[data-tod="day"]{background:radial-gradient(120% 50% at 50% -10%,rgba(255,226,150,.16),transparent 60%)}
${DV} .mx-amb[data-tod="dusk"]{background:linear-gradient(180deg,rgba(190,98,48,.14),transparent 42%),radial-gradient(130% 60% at 50% 112%,rgba(120,52,40,.12),transparent 60%)}
${DV} .mx-amb[data-tod="night"]{background:linear-gradient(180deg,rgba(30,40,86,.17),rgba(30,40,86,.06) 55%,rgba(30,40,86,.13))}
${DN} .mx-amb[data-tod="dawn"]{background:radial-gradient(120% 55% at 50% -8%,rgba(255,150,170,.11),transparent 62%)}
${DN} .mx-amb[data-tod="day"]{background:radial-gradient(120% 50% at 50% -10%,rgba(255,226,170,.08),transparent 60%)}
${DN} .mx-amb[data-tod="dusk"]{background:linear-gradient(180deg,rgba(255,118,80,.11),transparent 45%)}
${DN} .mx-amb[data-tod="night"]{background:radial-gradient(110% 60% at 50% -10%,rgba(90,70,200,.14),transparent 62%),linear-gradient(180deg,transparent 50%,rgba(6,3,20,.2))}
${DV} .mx-amb[data-wx="rain"]::after,${DV} .mx-amb[data-wx="storm"]::after{background-image:${rainSvg('rgba(52,72,104,.2)')};background-size:36px 36px}
${DN} .mx-amb[data-wx="rain"]::after,${DN} .mx-amb[data-wx="storm"]::after{background-image:${rainSvg('rgba(200,206,255,.15)')};background-size:36px 36px}
${DV} .mx-amb[data-wx="storm"]{box-shadow:inset 0 0 120px rgba(30,34,52,.2)}
${DN} .mx-amb[data-wx="storm"]{box-shadow:inset 0 0 120px rgba(0,0,0,.35)}
${DV} .mx-amb[data-wx="snow"]::after{background-image:${snowSvg('rgba(110,128,156,.26)')};background-size:40px 40px}
${DN} .mx-amb[data-wx="snow"]::after{background-image:${snowSvg('rgba(255,255,255,.26)')};background-size:40px 40px}
${DV} .mx-amb[data-wx="fog"]::after{background:linear-gradient(0deg,rgba(140,138,132,.2),transparent 48%),linear-gradient(180deg,rgba(140,138,132,.12),transparent 30%)}
${DN} .mx-amb[data-wx="fog"]::after{background:linear-gradient(0deg,rgba(200,190,232,.11),transparent 48%),linear-gradient(180deg,rgba(200,190,232,.07),transparent 30%)}
${DV} .mx-amb[data-wx="cloud"]::after{background:rgba(100,100,112,.06)}
${DN} .mx-amb[data-wx="cloud"]::after{background:rgba(0,0,0,.12)}
.mx-tod{display:none}
html.mx-deco .folio-head .mx-tod{display:inline-block;width:13px;height:13px;margin-right:6px;vertical-align:-1px;opacity:.85}
html.mx-deco .folio-head .mx-tod svg{display:block;width:100%;height:100%}

/* 二 · 场景分隔（简洁装帧下退回一行居中的 ◆ ◆ ◆，仍看得出是换场） */
.prose p.mx-scene{height:24px;margin:1.3em auto!important;text-indent:0!important;text-align:center}
.prose p.mx-scene::before{content:'◆ ◆ ◆';font-size:9px;letter-spacing:.6em;color:var(--gilt-dim);line-height:24px}
html.mx-deco .prose p.mx-scene{max-width:240px;background:var(--mx-vine) center/contain no-repeat;animation:mx2In .35s var(--ease-out,ease-out) both}
html.mx-deco .prose p.mx-scene::before{content:none}
html.mx-deco .prose p.mx-scene-line::before{content:'';display:block;height:20px;max-width:200px;margin:.6em auto 1em;background:var(--mx-vine) center/contain no-repeat;opacity:.75}
${DV}{--mx-vine:${vineSvg('#A98A46')}}
${DN}{--mx-vine:${vineSvg('#e8c385')}}

/* 三 · 说话人 */
html.mx-deco .prose .mx-name{font-weight:600;color:hsl(var(--wh) 50% 32%)}
html.mx-deco .prose .dlg[data-who]{background-image:linear-gradient(hsl(var(--wh) 48% 42% / .5),hsl(var(--wh) 48% 42% / .5));
  background-size:100% 1px;background-position:0 100%;background-repeat:no-repeat;padding-bottom:1px;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.prose .mx-spk{display:inline-flex;align-items:baseline;gap:4px;margin-right:6px;padding:0 8px;border-radius:10px;
  font:600 .78em/1.75 var(--font-sans);letter-spacing:.08em;text-indent:0;vertical-align:1px;
  color:hsl(var(--wh) 50% 30%);border:1px solid hsl(var(--wh) 40% 40% / .45);background:hsl(var(--wh) 60% 50% / .08)}
.prose .mx-spk i{font-style:normal;font-weight:400;opacity:.75}
.prose .mx-spk i::before{content:'· '}
html[data-mdx-theme="night"] .prose .mx-spk{color:hsl(var(--wh) 80% 78%);border-color:hsl(var(--wh) 70% 70% / .4);background:hsl(var(--wh) 70% 60% / .1)}
${DN} .prose .mx-name{color:hsl(var(--wh) 80% 76%)}
${DN} .prose .dlg[data-who]{background-image:linear-gradient(hsl(var(--wh) 75% 72% / .55),hsl(var(--wh) 75% 72% / .55))}
html:not(.mx-deco) .prose .mx-spk{border-color:var(--ink-faint);color:var(--ink-soft);background:none}

/* 四 · 物品品质 */
html.mx-deco .specimen.mx-qcard{position:relative}
.mx-qedge{display:none}
html.mx-deco .specimen.mx-qcard > .mx-qedge{display:block;position:absolute;left:0;top:12px;bottom:12px;width:3px;border-radius:0 3px 3px 0;background:var(--qc);pointer-events:none}
html.mx-deco .specimen.mx-qhi > .mx-qedge{width:4px;box-shadow:0 0 8px var(--qc)}
html.mx-deco .specimen .sp-fields dd.mx-qdd{color:var(--qc);font-weight:600}
html.mx-deco .specimen .sp-fields dd.mx-qdd::before{content:'◆';display:inline-block;margin-right:6px;font-size:.7em;vertical-align:1px}

/* 五 · 种族属徽 */
.mx-fam{display:inline-flex;align-items:center;gap:5px;margin-left:10px;font:500 11px/1 var(--font-sans);letter-spacing:.1em;white-space:nowrap;
  color:hsl(var(--fh) 42% 34%)}
.mx-fam b{display:inline-grid;place-items:center;width:19px;height:19px;border-radius:4px;font:700 11.5px/1 var(--font-serif);letter-spacing:0;
  color:#fbf6ea;background:hsl(var(--fh) 42% 38%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.28)}
html[data-mdx-theme="night"] .mx-fam{color:hsl(var(--fh) 78% 78%)}
html[data-mdx-theme="night"] .mx-fam b{color:#170d23;background:hsl(var(--fh) 70% 74%)}
html:not(.mx-deco) .mx-fam b{background:var(--ink-faint);color:var(--vellum)}
html:not(.mx-deco) .mx-fam{color:var(--ink-faint)}

/* 六 · 日序缎带 */
.mx-day{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 0 14px;font:600 12px/1.6 var(--font-sans);letter-spacing:.3em;color:var(--cinnabar)}
.mx-day::before,.mx-day::after{content:'';flex:0 1 80px;height:1px;background:linear-gradient(90deg,transparent,currentColor)}
.mx-day::after{background:linear-gradient(270deg,transparent,currentColor)}
.mx-day i{font-style:normal;font-weight:400;color:var(--ink-faint)}
.mx-day i::before{content:'·';margin-right:12px;color:var(--gilt-dim)}
html.mx-deco .mx-day{animation:mx2In .35s var(--ease-out,ease-out) both}

@keyframes mx2In{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){html.mx-deco .mx-day,html.mx-deco .prose p.mx-scene{animation:none}}
@media (max-width:520px){.mx-fam{margin-left:6px;font-size:10.5px}.mx-day{letter-spacing:.22em}.mx-day::before,.mx-day::after{flex-basis:40px}}
`;
function mountCss(){
  if(document.getElementById('mx-deco2-css')) return;
  const st = document.createElement('style');
  st.id = 'mx-deco2-css'; st.textContent = CSS;
  document.body.appendChild(st);
}

/* ═════════ 阅读设置：补一行「动效 自动 / 精简 / 完整」 ═════════
   面板每次打开都 innerHTML 重绘（魔典-增强），所以看着面板的直接子节点，被冲掉就补回来。 */
function liteRowHtml(){
  const b = (v, label, tip) => `<button type="button" data-lite="${v}" class="${liteMode === v ? 'on' : ''}" title="${tip}">${label}</button>`;
  return `<span>动效</span>${b('auto', '自动', '按本机性能决定（当前：' + (liteAuto() ? '精简' : '完整') + '）')}${b('on', '精简', '常驻动画只播一轮，入场动画省掉')}${b('off', '完整', '全部动画照常')}`;
}
let liteTries = 0;
function mountLiteRow(){
  const p = document.getElementById('mx-read-pop');
  if(!p){ if(liteTries++ < 20) setTimeout(mountLiteRow, 500); return; }
  if(p.__mx2lite) return; p.__mx2lite = true;
  const paint = () => {
    if(!p.firstElementChild) return;
    let row = p.querySelector(':scope > .mx-rp-lite');
    if(!row){
      row = document.createElement('div'); row.className = 'mx-rp-row mx-rp-lite';
      p.insertBefore(row, p.querySelector(':scope > .mx-rp-foot'));
    }
    const h = liteRowHtml();
    if(row.innerHTML !== h) row.innerHTML = h;
  };
  if(window.MutationObserver) new MutationObserver(paint).observe(p, { childList:true });
  p.addEventListener('click', e => {
    const t = e.target.closest('[data-lite]'); if(!t) return;
    liteMode = t.dataset.lite; LS.set(LITE_KEY, liteMode); applyLite(); paint();
  });
  paint();
}

/* ═════════ 挂载 ═════════ */
function enhance(){
  const page = document.getElementById('page-base');
  const sc = page && page.querySelector(':scope > .scroll');
  if(!sc || !page.querySelector('.folio-foot')) return;
  try{ ambience(page); }catch(e){ console.warn('[魔典·装帧二] 天色', e); }
  try{ dayRibbon(sc); }catch(e){ console.warn('[魔典·装帧二] 日序', e); }
  try{ scenes(sc); }catch(e){ console.warn('[魔典·装帧二] 场景', e); }
  try{ speakers(sc); }catch(e){ console.warn('[魔典·装帧二] 说话人', e); }
  try{ itemQuality(sc); }catch(e){ console.warn('[魔典·装帧二] 品质', e); }
  try{ monsterSeal(sc); }catch(e){ console.warn('[魔典·装帧二] 属徽', e); }
}
window.__mxDeco2.refresh = enhance;
window.__mxDeco2.dateKey = dateKey;
function boot(){
  mountCss();
  mountLiteRow();
  const el = document.getElementById('page-base');
  if(el && window.MutationObserver) new MutationObserver(enhance).observe(el, { childList:true });
  enhance();
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

