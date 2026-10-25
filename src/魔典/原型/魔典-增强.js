/* [修改 19 / 20] 魔典-增强 v2 —— 阅读页 / 目录 / 总览 / 羁绊 / 行囊 / 委托 / 信笺 / 书页装帧
 * 只在内核渲染完成后「补」DOM，不改内核的取数与渲染：
 *   #page-base / #insert / #toc-list 各挂一个只看直接子节点的 MutationObserver（不看 subtree，不会自激）。
 * 性能纪律：滚动用 passive + rAF；搜索 150ms 防抖、全文索引按需建一次；动画只动 transform / opacity。
 * 存储：阅读设置、书签、常用短句进 localStorage；「最近寄出」只放内存（信笺用过即抛，不跨会话保留）。
 * 装帧（修改 20）：全部规则挂在 html.mx-deco 下，阅读设置里「装帧 华丽 / 简洁」一键关掉；
 *   只用静态渐变 / 内联 SVG / 伪元素，无 backdrop-filter、无 blur、无常驻动画；首字下沉按作者先前的决定不加。
 */
(function(){
'use strict';
if(window.__mxEnhance) return;
window.__mxEnhance = { version:2 };

const H = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS = {
  get(k, fb){ try{ const v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; }catch(e){ return fb; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} },
};
const mem = (()=>{ let h = window; try{ if(typeof dexHost === 'function') h = dexHost(); }catch(e){} try{ return h.__mxMem || (h.__mxMem = {}); }catch(e){ return window.__mxMem || (window.__mxMem = {}); } })();
const ui = mem.ui || (mem.ui = { fold:{}, bondSort:'default', bondQ:'', bagCat:'all', questTab:'doing' });
const floors = () => (typeof FLOORS !== 'undefined' && Array.isArray(FLOORS)) ? FLOORS : [];
const curIdx = () => (typeof cur === 'number') ? cur : floors().length - 1;
const num = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const statGet = (p, fb) => { try{ return Stat.get(p, fb); }catch(e){ return fb; } };

function chatKey(){
  try{
    const st = hostPick('SillyTavern');
    const c = st && st.getContext && st.getContext();
    const id = c && (c.chatId || (typeof c.getCurrentChatId === 'function' && c.getCurrentChatId()));
    if(id) return String(id);
  }catch(e){}
  return 'local';
}
function statAt(i){
  const f = floors()[i];
  if(!f) return null;
  try{ const r = floorStatData(f, i); return r ? r.sd : null; }catch(e){ return null; }
}
/* 「上一页」= 往前找最近一张有变量快照的书页 */
function prevStat(i){
  for(let k = i - 1; k >= 0; k--){ const s = statAt(k); if(s) return { sd:s, idx:k }; }
  return null;
}
const pvLatest = () => prevStat(floors().length - 1);
function pick(o, path){
  for(const k of path.split('.')){ o = (o && typeof o === 'object') ? o[k] : undefined; if(o === undefined) return undefined; }
  return o;
}

/* ═════════ 一 · 阅读设置（字号 / 行距 / 页宽） ═════════ */
const READ_KEY = 'mge_read_prefs_v1';
const READ_DEF = { fs:1, lh:2.05, w:760, deco:true };
const WIDTHS = [[620,'窄'],[760,'标准'],[920,'宽']];
let rp = Object.assign({}, READ_DEF, LS.get(READ_KEY, {}));
function applyRead(){
  const r = document.documentElement;
  r.style.setProperty('--mx-fs', rp.fs);
  r.style.setProperty('--mx-lh', rp.lh);
  r.style.setProperty('--mx-w', rp.w + 'px');
  r.toggleAttribute('data-mx-read', rp.fs !== 1 || rp.lh !== 2.05 || rp.w !== 760);
  r.classList.toggle('mx-deco', rp.deco !== false);
}
function readPanelHtml(){
  const pct = Math.round(rp.fs * 100);
  return `<div class="mx-rp-row"><span>字号</span><button data-rp="fs:-">A−</button><b>${pct}%</b><button data-rp="fs:+">A＋</button></div>
    <div class="mx-rp-row"><span>行距</span><button data-rp="lh:-">−</button><b>${rp.lh.toFixed(2)}</b><button data-rp="lh:+">＋</button></div>
    <div class="mx-rp-row"><span>页宽</span>${WIDTHS.map(([w,n])=>`<button data-rp="w:${w}" class="${rp.w===w?'on':''}">${n}</button>`).join('')}</div>
    <div class="mx-rp-row"><span>装帧</span><button data-rp="deco:1" class="${rp.deco !== false ? 'on' : ''}">华丽</button><button data-rp="deco:0" class="${rp.deco === false ? 'on' : ''}">简洁</button></div>
    <div class="mx-rp-foot"><button data-rp="reset">恢复默认</button></div>`;
}
function mountReadSettings(){
  if(document.getElementById('mx-read')) return;
  const b = document.createElement('button');
  b.id = 'mx-read'; b.type = 'button'; b.title = '阅读设置'; b.setAttribute('aria-label','阅读设置');
  b.innerHTML = '<span>Aa</span>';
  const p = document.createElement('div');
  p.id = 'mx-read-pop'; p.setAttribute('role','dialog'); p.setAttribute('aria-label','阅读设置');
  const paint = ()=>{ p.innerHTML = readPanelHtml(); };
  b.addEventListener('click', e=>{ e.stopPropagation(); const on = !p.classList.contains('open'); if(on) paint(); p.classList.toggle('open', on); b.classList.toggle('on', on); });
  p.addEventListener('click', e=>{
    e.stopPropagation();
    const t = e.target.closest('[data-rp]'); if(!t) return;
    const [k, v] = t.dataset.rp.split(':');
    if(k === 'reset') rp = Object.assign({}, READ_DEF);
    else if(k === 'fs') rp.fs = Math.min(1.4, Math.max(.85, Math.round((rp.fs + (v === '+' ? .05 : -.05)) * 100) / 100));
    else if(k === 'lh') rp.lh = Math.min(2.6, Math.max(1.6, Math.round((rp.lh + (v === '+' ? .1 : -.1)) * 100) / 100));
    else if(k === 'w') rp.w = +v;
    else if(k === 'deco') rp.deco = v === '1';
    LS.set(READ_KEY, rp); applyRead(); paint();
  });
  document.addEventListener('click', ()=>{ p.classList.remove('open'); b.classList.remove('on'); });
  document.body.appendChild(b); document.body.appendChild(p);
}

/* ═════════ 二 · 阅读页：滚动进度 / 全书进度 / 输入页码跳页 ═════════ */
function enhancePage(){
  const page = document.getElementById('page-base');
  const foot = page && page.querySelector('.folio-foot');
  const sc = page && page.querySelector('.scroll');
  if(foot && sc) decoratePage(page);
  if(!foot || !sc || page.querySelector('.mx-rprog')) return;
  const bar = document.createElement('div');
  bar.className = 'mx-rprog'; bar.innerHTML = '<i></i>';
  page.insertBefore(bar, page.firstChild);
  const fill = bar.firstChild;
  let raf = 0;
  const upd = ()=>{ raf = 0; const max = sc.scrollHeight - sc.clientHeight; fill.style.transform = `scaleX(${max > 4 ? Math.min(1, sc.scrollTop / max) : 1})`; };
  sc.addEventListener('scroll', ()=>{ if(!raf) raf = requestAnimationFrame(upd); }, { passive:true });
  requestAnimationFrame(upd);
  const total = floors().length, ord = curIdx() + 1;
  const bp = document.createElement('span');
  bp.className = 'mx-bprog'; bp.style.setProperty('--p', total > 1 ? (ord / total).toFixed(4) : 1);
  bp.setAttribute('aria-hidden','true');
  foot.insertBefore(bp, foot.firstChild);
  const pg = foot.querySelector('.ff-page');
  if(pg && total > 2){
    pg.classList.add('mx-jump'); pg.title = '点击输入页码跳转'; pg.tabIndex = 0; pg.setAttribute('role','button');
    const open = ()=>{
      if(pg.querySelector('input')) return;
      const keep = pg.innerHTML;
      pg.innerHTML = `<span class="mx-jp">跳至第 <input type="number" inputmode="numeric" min="1" max="${total}" value="${ord}"> 页 / 共 ${total} 页</span>`;
      const inp = pg.querySelector('input');
      const done = go => {
        const n = parseInt(inp.value, 10);
        if(go && n >= 1 && n <= total && n !== ord){ showFloor(n - 1, n > ord ? 1 : -1); return; }
        pg.innerHTML = keep;
      };
      inp.addEventListener('keydown', e=>{ e.stopPropagation(); if(e.key === 'Enter') done(true); else if(e.key === 'Escape') done(false); });
      inp.addEventListener('blur', ()=>done(true));
      inp.focus(); inp.select();
    };
    pg.addEventListener('click', open);
    pg.addEventListener('keydown', e=>{ if(e.key === 'Enter') open(); });
  }
}

/* ═════════ 三 · 目录：全文搜索 / 每页地点时间 / 书签 ═════════ */
const BM_KEY = 'mge_bookmarks_v1';
const bmAll = () => LS.get(BM_KEY, {});
const bmList = () => bmAll()[chatKey()] || [];
function bmToggle(id){
  const all = bmAll(), k = chatKey(), l = all[k] || [];
  const i = l.indexOf(id);
  if(i >= 0) l.splice(i, 1); else l.push(id);
  all[k] = l; LS.set(BM_KEY, all);
  return i < 0;
}
const textCache = new Map();
function floorText(f){
  const key = f.idx + ':' + (f.raw || '').length;
  let t = textCache.get(key);
  if(t == null){
    t = String(f.raw || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    textCache.set(key, t);
  }
  return t;
}
function placeOf(i){
  const w = pick(statAt(i), '世界');
  if(!w || typeof w !== 'object') return '';
  return [w['地点'], w['时间'] || w['日期']].filter(Boolean).join(' · ');
}
function snippet(text, q){
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if(i < 0) return '';
  const a = Math.max(0, i - 16), b = Math.min(text.length, i + q.length + 22);
  return (a ? '…' : '') + H(text.slice(a, i)) + '<mark>' + H(text.slice(i, i + q.length)) + '</mark>' + H(text.slice(i + q.length, b)) + (b < text.length ? '…' : '');
}
function mountTocTools(){
  const list = document.getElementById('toc-list');
  if(!list || document.getElementById('mx-toc-tools')) return;
  const box = document.createElement('div');
  box.id = 'mx-toc-tools';
  box.innerHTML = `<input type="search" id="mx-toc-q" placeholder="搜索书页内容…" autocomplete="off">
    <button type="button" class="rchip" id="mx-toc-bm" aria-pressed="false">只看书签</button>
    <span id="mx-toc-n"></span>`;
  list.parentNode.insertBefore(box, list);
  const q = box.querySelector('#mx-toc-q'), bm = box.querySelector('#mx-toc-bm');
  let t = 0;
  q.addEventListener('input', e=>{ if(e.isComposing) return; clearTimeout(t); t = setTimeout(filterToc, 150); });
  q.addEventListener('compositionend', ()=>{ clearTimeout(t); t = setTimeout(filterToc, 150); });
  q.addEventListener('keydown', e=>e.stopPropagation());
  bm.addEventListener('click', ()=>{ const on = bm.getAttribute('aria-pressed') !== 'true'; bm.setAttribute('aria-pressed', on); bm.classList.toggle('on', on); filterToc(); });
}
function enhanceToc(){
  const list = document.getElementById('toc-list');
  if(!list || list.querySelector('.mx-ti')) return;
  mountTocTools();
  const marks = bmList();
  list.querySelectorAll('.toc-item[data-toc]').forEach(b=>{
    const i = +b.dataset.toc;
    if(!Number.isInteger(i)) return;
    const f = floors()[i]; if(!f) return;
    const where = placeOf(i);
    const title = b.querySelector('.ti-title');
    const wrap = document.createElement('span');
    wrap.className = 'mx-ti';
    if(title) wrap.appendChild(title);
    wrap.insertAdjacentHTML('beforeend', `${where ? `<span class="ti-where">${H(where)}</span>` : ''}<span class="ti-hit"></span>`);
    b.appendChild(wrap);
    const on = marks.includes(f.idx);
    b.insertAdjacentHTML('beforeend', `<span class="ti-star${on ? ' on' : ''}" role="button" tabindex="0" aria-label="${on ? '取消书签' : '加书签'}" title="书签">${on ? '★' : '☆'}</span>`);
    b.classList.toggle('mx-bm', on);
  });
  list.querySelectorAll('.ti-star').forEach(s=>{
    const flip = e=>{
      e.stopPropagation(); e.preventDefault();
      const b = s.closest('.toc-item'), f = floors()[+b.dataset.toc];
      const on = bmToggle(f.idx);
      s.classList.toggle('on', on); s.textContent = on ? '★' : '☆';
      s.setAttribute('aria-label', on ? '取消书签' : '加书签');
      b.classList.toggle('mx-bm', on);
      filterToc();
    };
    s.addEventListener('click', flip);
    s.addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' ') flip(e); });
  });
  filterToc();
}
function filterToc(){
  const list = document.getElementById('toc-list');
  const qEl = document.getElementById('mx-toc-q'), bmEl = document.getElementById('mx-toc-bm');
  if(!list || !qEl) return;
  const q = qEl.value.trim(), onlyBm = bmEl && bmEl.getAttribute('aria-pressed') === 'true';
  let shown = 0, total = 0;
  list.querySelectorAll('.toc-item[data-toc]').forEach(b=>{
    const i = +b.dataset.toc;
    if(!Number.isInteger(i)) { b.hidden = !!(q || onlyBm); return; }
    total++;
    const f = floors()[i];
    const hit = b.querySelector('.ti-hit');
    let ok = !onlyBm || b.classList.contains('mx-bm');
    let snip = '';
    if(ok && q && f){
      const title = (b.querySelector('.ti-title') || {}).textContent || '';
      snip = snippet(floorText(f), q);
      ok = !!snip || title.toLowerCase().includes(q.toLowerCase());
    }
    if(hit) hit.innerHTML = snip;
    b.hidden = !ok;
    if(ok) shown++;
  });
  const n = document.getElementById('mx-toc-n');
  if(n) n.textContent = (q || onlyBm) ? `${shown} / ${total}` : '';
  let empty = list.querySelector('.mx-toc-empty');
  if(!shown && (q || onlyBm)){
    if(!empty){ empty = document.createElement('div'); empty.className = 'toc-empty mx-toc-empty'; list.appendChild(empty); }
    empty.textContent = onlyBm && !q ? '还没有书签。点书页右侧的 ☆ 加一个。' : '没有找到。';
  } else if(empty) empty.remove();
}

/* ═════════ 四 · 总览：本页变化 ═════════ */
const DIFF_ROOTS = ['主角','资产','阵营声望','心界住民','羁绊'];
const DIFF_SKIP = /上限$|^资质$|序号|编号|时间戳/;
function flatNums(o, pre, out, depth){
  if(!o || typeof o !== 'object' || Array.isArray(o) || depth > 3) return out;
  for(const [k, v] of Object.entries(o)){
    if(DIFF_SKIP.test(k)) continue;
    const p = pre ? pre + '.' + k : k;
    if(typeof v === 'number' || (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim()))) out[p] = Number(v);
    else if(v && typeof v === 'object') flatNums(v, p, out, depth + 1);
  }
  return out;
}
function diffLabel(p){
  const s = p.split('.');
  if(s[0] === '羁绊') return `${s[1]} · ${s.slice(2).join(' · ')}`;
  if(s[0] === '资产' || s[0] === '阵营声望') return s.slice(1).join(' · ');
  if(s[0] === '心界住民') return '心界住民 · ' + s.slice(1).join(' · ');
  return s.slice(1).join(' · ') || s[0];
}
function keyDiff(a, b, path){
  const x = pick(a, path), y = pick(b, path);
  const ka = x && typeof x === 'object' ? Object.keys(x) : [];
  const kb = y && typeof y === 'object' ? Object.keys(y) : [];
  return { added: kb.filter(k => !ka.includes(k)), removed: ka.filter(k => !kb.includes(k)) };
}
function computeDiff(i){
  const now = statAt(i), pv = prevStat(i);
  if(!now || !pv) return null;
  const nums = [];
  for(const root of DIFF_ROOTS){
    const A = flatNums(pv.sd[root], root, {}, 0), B = flatNums(now[root], root, {}, 0);
    for(const p of Object.keys(B)){
      if(!(p in A)) continue;
      const d = Math.round((B[p] - A[p]) * 100) / 100;
      if(d) nums.push({ p, d, v:B[p], root });
    }
  }
  nums.sort((x, y) => DIFF_ROOTS.indexOf(x.root) - DIFF_ROOTS.indexOf(y.root) || Math.abs(y.d) - Math.abs(x.d));
  return {
    from: pv.idx, nums,
    bonds: keyDiff(pv.sd, now, '羁绊'), quests: keyDiff(pv.sd, now, '任务'), bag: keyDiff(pv.sd, now, '行囊.背包'),
  };
}
function deltaHtml(i){
  const D = computeDiff(i);
  const head = `<div class="sec-title">本页变化<span class="rit-pool" style="font-weight:400">${D ? `第 ${i + 1} 页 · 对比第 ${D.from + 1} 页` : ''}</span></div>`;
  if(!D) return `<div class="mx-delta">${head}<div class="empty-note">这一页之前没有可对比的变量快照。</div></div>`;
  const tags = [];
  const add = (l, cls, list) => list.forEach(k => tags.push(`<span class="mx-dt ${cls}">${l} · ${H(k)}</span>`));
  add('新羁绊', 'up', D.bonds.added); add('新委托', 'up', D.quests.added); add('获得', 'up', D.bag.added);
  add('失去', 'down', D.bag.removed); add('离开', 'down', D.bonds.removed);
  const rows = D.nums.slice(0, 14).map(n => `<span class="mx-dr ${n.d > 0 ? 'up' : 'down'}"><i>${H(diffLabel(n.p))}</i><b>${n.d > 0 ? '+' : ''}${n.d}</b><em>→ ${n.v}</em></span>`).join('');
  const more = D.nums.length > 14 ? `<span class="mx-dmore">另有 ${D.nums.length - 14} 项小幅变化</span>` : '';
  const body = rows || tags.length ? `<div class="mx-drows">${rows}</div>${more}${tags.length ? `<div class="mx-dtags">${tags.join('')}</div>` : ''}` : '<div class="empty-note">这一页数值没有变化。</div>';
  return `<div class="mx-delta">${head}${body}</div>`;
}

/* ═════════ 五 · 羁绊录：折叠 / 排序 / 搜索 / 关系徽章 / 好感涨跌 ═════════ */
const REL_TONE = [
  [/敌|仇|憎|厌/, 'r-foe'], [/警|疑|戒/, 'r-wary'], [/恋|爱|伴侣|夫|妻|结缘|契约|婚/, 'r-love'],
  [/亲密|信赖|信任|挚|暧昧/, 'r-close'], [/友|朋|伙伴|同伴/, 'r-friend'],
];
const relTone = s => { for(const [re, c] of REL_TONE) if(re.test(s)) return c; return 'r-new'; };
function enhanceVincula(body){
  const bonds = statGet('羁绊', {}) || {};
  const names = Object.keys(bonds);
  const plaques = [...body.children].filter(e => e.classList.contains('plaque'));
  if(!names.length || plaques.length !== names.length) return;
  const pv = pvLatest();
  const before = pv ? (pick(pv.sd, '羁绊') || {}) : null;
  plaques.forEach((pl, k)=>{
    const name = names[k], b = bonds[name] || {};
    pl.dataset.name = name; pl.dataset.fav = num(b.好感度) || 0;
    pl.dataset.q = [name, b.种族, b.关系, b.势力, b.所在地].filter(Boolean).join(' ').toLowerCase();
    pl.classList.add('mx-bond');
    const h4 = pl.querySelector('h4');
    const badge = h4 && h4.querySelector('.init-badge');
    if(badge) badge.classList.add('mx-rel', relTone(b.关系 || ''));
    if(before){
      const old = before[name];
      let tag = '';
      if(!old) tag = '<span class="mx-d new">新</span>';
      else { const d = (num(b.好感度) || 0) - (num(old.好感度) || 0); if(d) tag = `<span class="mx-d ${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'}${Math.abs(d)}</span>`; }
      if(tag && badge) badge.insertAdjacentHTML('beforebegin', tag);
    }
    if(h4){
      h4.insertAdjacentHTML('beforeend', '<span class="mx-fold" aria-hidden="true"></span>');
      h4.setAttribute('role','button'); h4.tabIndex = 0;
      const t = ()=>{ const f = !pl.classList.contains('folded'); pl.classList.toggle('folded', f); ui.fold[name] = f; h4.setAttribute('aria-expanded', !f); };
      h4.addEventListener('click', t);
      h4.addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); t(); } });
    }
    const folded = name in ui.fold ? ui.fold[name] : names.length > 3;
    pl.classList.toggle('folded', folded);
    if(h4) h4.setAttribute('aria-expanded', !folded);
  });
  const bar = document.createElement('div');
  bar.className = 'mx-tools';
  bar.innerHTML = `<input type="search" class="mx-q" placeholder="搜索名字 / 种族 / 关系" value="${H(ui.bondQ)}">
    <button type="button" class="rchip" data-bs="default">默认</button><button type="button" class="rchip" data-bs="fav">好感↓</button><button type="button" class="rchip" data-bs="name">名字</button>
    <button type="button" class="rchip" data-bfold="1">全部折叠</button><button type="button" class="rchip" data-bfold="0">全部展开</button>`;
  plaques[0].before(bar);
  const order = ()=>{
    const list = plaques.slice();
    if(ui.bondSort === 'fav') list.sort((a, b) => b.dataset.fav - a.dataset.fav);
    else if(ui.bondSort === 'name') list.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name, 'zh'));
    let at = bar;
    list.forEach(p => { at.after(p); at = p; });
    bar.querySelectorAll('[data-bs]').forEach(x => x.classList.toggle('on', x.dataset.bs === ui.bondSort));
  };
  const filt = ()=>{ const q = ui.bondQ.trim().toLowerCase(); plaques.forEach(p => { p.hidden = !!q && !p.dataset.q.includes(q); }); };
  const inp = bar.querySelector('.mx-q');
  inp.addEventListener('input', e=>{ ui.bondQ = inp.value; if(!e.isComposing) filt(); });
  inp.addEventListener('compositionend', ()=>{ ui.bondQ = inp.value; filt(); });
  inp.addEventListener('keydown', e=>e.stopPropagation());
  inp.addEventListener('focus', ()=>{ ui.bondFocus = true; });
  inp.addEventListener('blur', ()=>{ if(inp.isConnected) ui.bondFocus = false; });
  if(ui.bondFocus){ inp.focus({ preventScroll:true }); const n = inp.value.length; try{ inp.setSelectionRange(n, n); }catch(e){} }
  bar.addEventListener('click', e=>{
    const s = e.target.closest('[data-bs]'), f = e.target.closest('[data-bfold]');
    if(s){ ui.bondSort = s.dataset.bs; order(); }
    if(f){ const v = f.dataset.bfold === '1'; plaques.forEach(p => { p.classList.toggle('folded', v); ui.fold[p.dataset.name] = v; const h = p.querySelector('h4'); if(h) h.setAttribute('aria-expanded', !v); }); }
  });
  order(); filt();
}

/* ═════════ 六 · 行囊：按品质上色 / 按分类分组 / 分类筛选 / 图例收起 ═════════ */
function sectionOf(body, title){
  const head = [...body.children].filter(e => e.classList.contains('sec-title')).find(e => (e.firstChild && e.firstChild.textContent || e.textContent).trim().startsWith(title));
  if(!head) return null;
  const items = [];
  for(let n = head.nextElementSibling; n && !n.classList.contains('sec-title'); n = n.nextElementSibling) items.push(n);
  return { head, items };
}
function enhanceSarcina(body){
  const qs = sectionOf(body, '品质七档'), cs = sectionOf(body, '分类十一');
  if(qs && cs){
    const det = document.createElement('details');
    det.className = 'mx-ref';
    det.innerHTML = '<summary>品质与分类图例</summary>';
    qs.head.before(det);
    [qs.head, ...qs.items, cs.head, ...cs.items].forEach(n => det.appendChild(n));
    det.querySelectorAll('.chip.c-q').forEach((c, i) => c.classList.add('mx-q' + i));
  }
  const bs = sectionOf(body, '背包');
  const bag = statGet('行囊.背包', {}) || {};
  const keys = Object.keys(bag);
  if(!bs || !keys.length) return;
  const QUAL = (typeof D !== 'undefined' && typeof g === 'function') ? g(D, 'enums.品质', []) : [];
  const CATS = (typeof D !== 'undefined' && typeof g === 'function') ? g(D, 'enums.分类', []) : [];
  const groups = {};
  keys.forEach(k => { const c = (bag[k] && bag[k].分类) || '杂物'; (groups[c] = groups[c] || []).push(k); });
  const catOrder = Object.keys(groups).sort((a, b) => (CATS.indexOf(a) + 1 || 99) - (CATS.indexOf(b) + 1 || 99));
  if(ui.bagCat !== 'all' && !groups[ui.bagCat]) ui.bagCat = 'all';
  const qIdx = q => { const i = QUAL.indexOf(q); return i < 0 ? 1 : i; };
  const card = k => {
    const it = bag[k] || {}, qi = qIdx(it.品质);
    return `<div class="plaque mx-item mx-q${qi}"><h4>${H(k)}${num(it.数量) > 1 ? ` <span class="k-latin">×${it.数量}</span>` : ''}${it.品质 ? `<span class="mx-qtag">${H(it.品质)}</span>` : ''}</h4>${it.效果 ? `<div class="p-desc">${H(it.效果)}</div>` : ''}</div>`;
  };
  const wrap = document.createElement('div');
  wrap.className = 'mx-bag';
  const paint = ()=>{
    const cats = ui.bagCat === 'all' ? catOrder : [ui.bagCat];
    wrap.innerHTML = `<div class="mx-tools"><button type="button" class="rchip${ui.bagCat === 'all' ? ' on' : ''}" data-cat="all">全部 ${keys.length}</button>${catOrder.map(c => `<button type="button" class="rchip${ui.bagCat === c ? ' on' : ''}" data-cat="${H(c)}">${H(c)} ${groups[c].length}</button>`).join('')}</div>`
      + cats.map(c => `<div class="mx-cat">${H(c)}</div>` + groups[c].slice().sort((a, b) => qIdx((bag[b] || {}).品质) - qIdx((bag[a] || {}).品质)).map(card).join('')).join('');
  };
  wrap.addEventListener('click', e=>{ const b = e.target.closest('[data-cat]'); if(b){ ui.bagCat = b.dataset.cat; paint(); } });
  bs.items.forEach(n => n.remove());
  bs.head.after(wrap);
  bs.head.insertAdjacentHTML('beforeend', `<span class="rit-pool" style="font-weight:400">${keys.length} 件</span>`);
  paint();
}

/* ═════════ 七 · 委托：进行中 / 已完成 / 已失败 分栏 + 进度条 + 新任务高亮 ═════════ */
const DONE_RE = /完成|达成|成功/, FAIL_RE = /失败|放弃|过期|逾期|取消/;
function progressOf(v){
  const s = String(v == null ? '' : v);
  let m = s.match(/(\d+(?:\.\d+)?)\s*[\/／]\s*(\d+(?:\.\d+)?)/);
  if(m && +m[2] > 0) return Math.min(1, +m[1] / +m[2]);
  m = s.match(/(\d+(?:\.\d+)?)\s*%/);
  if(m) return Math.min(1, +m[1] / 100);
  return null;
}
function enhanceMandata(body){
  const sec = sectionOf(body, '进行中');
  const quests = statGet('任务', {}) || {};
  const keys = Object.keys(quests);
  if(!sec || !keys.length) return;
  const plaques = sec.items.filter(e => e.classList.contains('plaque'));
  if(plaques.length !== keys.length) return;
  const pv = pvLatest();
  const before = pv ? (pick(pv.sd, '任务') || {}) : null;
  const tabOf = t => DONE_RE.test(t.结果 || '') ? 'done' : FAIL_RE.test(t.结果 || '') ? 'fail' : 'doing';
  const count = { doing:0, done:0, fail:0 };
  plaques.forEach((pl, k)=>{
    const t = quests[keys[k]] || {}, tab = tabOf(t);
    count[tab]++; pl.dataset.tab = tab; pl.classList.add('mx-quest');
    const p = progressOf(t.进度);
    const h4 = pl.querySelector('h4');
    if(p != null && h4) h4.insertAdjacentHTML('afterend', `<div class="mx-qbar" title="进度 ${H(t.进度)}"><i style="transform:scaleX(${p.toFixed(3)})"></i><span>${Math.round(p * 100)}%</span></div>`);
    if(before && h4){
      const old = before[keys[k]];
      let tag = '';
      if(!old){ tag = '新'; pl.classList.add('mx-fresh'); }
      else if(tabOf(old) !== tab && tab !== 'doing') tag = tab === 'done' ? '刚完成' : '刚失败';
      if(tag) h4.firstChild && h4.firstChild.after(document.createRange().createContextualFragment(`<span class="mx-d ${tag === '刚失败' ? 'down' : 'new'}">${tag}</span>`));
    }
  });
  if(ui.questTab !== 'doing' && !count[ui.questTab]) ui.questTab = 'doing';
  sec.head.firstChild.textContent = '委托 ';
  const bar = document.createElement('div');
  bar.className = 'mx-tools';
  const tabs = [['doing','进行中'],['done','已完成'],['fail','已失败']].filter(([k]) => k !== 'fail' || count.fail);
  bar.innerHTML = tabs.map(([k, n]) => `<button type="button" class="rchip" data-qt="${k}">${n} ${count[k]}</button>`).join('');
  sec.head.after(bar);
  const paint = ()=>{
    plaques.forEach(p => { p.hidden = p.dataset.tab !== ui.questTab; });
    bar.querySelectorAll('[data-qt]').forEach(b => b.classList.toggle('on', b.dataset.qt === ui.questTab));
    let e = bar.nextElementSibling && bar.nextElementSibling.classList.contains('mx-qempty') ? bar.nextElementSibling : null;
    if(!count[ui.questTab]){ if(!e){ bar.insertAdjacentHTML('afterend', '<div class="empty-note mx-qempty"></div>'); e = bar.nextElementSibling; } e.textContent = '这一栏暂时是空的。'; }
    else if(e) e.remove();
  };
  bar.addEventListener('click', e=>{ const b = e.target.closest('[data-qt]'); if(b){ ui.questTab = b.dataset.qt; paint(); } });
  paint();
}

function enhanceInsert(){
  const el = document.getElementById('insert');
  const body = el && el.querySelector('.insert-body');
  if(!body || body.dataset.mx) return;
  body.dataset.mx = '1';
  const k = typeof insertOpen !== 'undefined' ? insertOpen : null;
  try{
    if(k === 'home') body.insertAdjacentHTML('afterbegin', deltaHtml(curIdx() > 0 ? curIdx() : floors().length - 1));
    else if(k === 'vincula') enhanceVincula(body);
    else if(k === 'sarcina') enhanceSarcina(body);
    else if(k === 'mandata') enhanceMandata(body);
  }catch(e){ console.warn('[魔典·增强]', k, e); }
}

/* ═════════ 八 · 信笺：常用短句 / 字数段数 / 最近寄出（仅本次会话） ═════════ */
const PH_KEY = 'mge_quick_phrases_v1';
const PH_DEF = ['（继续）','（沉默片刻）','（环顾四周）','（点头答应）','（摇头拒绝）','（时间推进到第二天清晨）'];
const sent = mem.sent || (mem.sent = []);
function mountLetter(){
  const body = document.getElementById('modian-letter-body');
  const foot = document.querySelector('#letter .let-foot');
  if(!body || !foot || document.getElementById('mx-phr')) return;
  let edit = false;
  const box = document.createElement('div');
  box.id = 'mx-phr';
  const phrases = () => LS.get(PH_KEY, PH_DEF);
  const paint = ()=>{
    const list = phrases();
    box.innerHTML = list.map((p, i) => `<button type="button" class="mx-ph" data-ph="${i}">${H(p)}${edit ? '<i aria-label="删除">×</i>' : ''}</button>`).join('')
      + (edit ? '<input id="mx-ph-new" maxlength="40" placeholder="新短句，回车添加"><button type="button" class="mx-ph mx-ph-tool" data-pht="done">完成</button>'
              : `<button type="button" class="mx-ph mx-ph-tool" data-pht="edit" title="管理常用短句">管理</button>${sent.length ? '<button type="button" class="mx-ph mx-ph-tool" data-pht="hist" title="本次会话里寄出过的内容">最近寄出</button>' : ''}`);
    const ni = box.querySelector('#mx-ph-new');
    if(ni) ni.addEventListener('keydown', e=>{
      e.stopPropagation();
      if(e.key !== 'Enter') return;
      e.preventDefault();
      const v = ni.value.trim(); if(!v) return;
      const l = phrases(); if(!l.includes(v)) l.push(v);
      LS.set(PH_KEY, l); paint(); box.querySelector('#mx-ph-new').focus();
    });
  };
  const insert = text => {
    body.focus();
    const s = body.selectionStart ?? body.value.length, e = body.selectionEnd ?? s;
    body.setRangeText(text, s, e, 'end');
    body.dispatchEvent(new Event('input', { bubbles:true }));
  };
  const hist = document.createElement('div');
  hist.id = 'mx-hist'; hist.hidden = true;
  box.addEventListener('click', e=>{
    const t = e.target.closest('[data-pht]'), p = e.target.closest('[data-ph]');
    if(t){
      const a = t.dataset.pht;
      if(a === 'edit' || a === 'done'){ edit = a === 'edit'; hist.hidden = true; paint(); if(edit) box.querySelector('#mx-ph-new').focus(); }
      if(a === 'hist'){
        hist.hidden = !hist.hidden;
        hist.innerHTML = '<div class="mx-hist-h">最近寄出 · 只保留在本次会话，刷新酒馆后清空</div>' + sent.map((s, i) => `<button type="button" data-hi="${i}">${H(s.length > 60 ? s.slice(0, 60) + '…' : s)}</button>`).join('');
      }
      return;
    }
    if(!p) return;
    const i = +p.dataset.ph;
    if(edit){ if(e.target.tagName === 'I'){ const l = phrases(); l.splice(i, 1); LS.set(PH_KEY, l); paint(); } return; }
    insert(phrases()[i]);
  });
  hist.addEventListener('click', e=>{
    const b = e.target.closest('[data-hi]'); if(!b) return;
    body.value = sent[+b.dataset.hi]; hist.hidden = true;
    body.dispatchEvent(new Event('input', { bubbles:true })); body.focus();
  });
  foot.before(box); foot.before(hist);
  paint();
  const record = ()=>{
    const v = body.value.trim();
    const btn = document.getElementById('let-send');
    if(!v || (btn && btn.disabled)) return;
    const i = sent.indexOf(v); if(i >= 0) sent.splice(i, 1);
    sent.unshift(v); sent.length = Math.min(sent.length, 5);
    setTimeout(()=>{ if(!edit) paint(); }, 0);
  };
  const btn = document.getElementById('let-send');
  if(btn) btn.addEventListener('click', record, true);
  body.addEventListener('keydown', e=>{ if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)) record(); }, true);
  if(typeof updLetterCount === 'function'){
    const orig = updLetterCount;
    updLetterCount = function(){
      orig.apply(this, arguments);
      const c = document.getElementById('let-count'), v = body.value;
      if(!c || !v.trim()) return;
      const paras = v.split(/\n+/).filter(s => s.trim()).length;
      if(paras > 1) c.textContent += ` · ${paras} 段`;
    };
  }
}

/* ═════════ 九 · 书页装帧（修改 20）：版框 / 章题 / 选项 / 状态簿 ═════════ */
const STD_TAG = /^(选项[一二三四五六七八九十\d]*|[A-Ha-h]|\d{1,2})$/;
function frameOf(page){
  return Array.from(page.children).find(c => c.classList.contains('mx-frame'));
}
function meterInfo(m){
  const txt = sel => { const e = m.querySelector(sel); return e ? e.textContent.trim() : ''; };
  const fill = m.querySelector('.m-fill');
  const w = fill ? parseFloat(fill.getAttribute('data-w') || fill.style.width) : NaN;
  return { lab:txt('.m-label'), val:txt('.m-val'), pct:Number.isFinite(w) ? Math.max(0, Math.min(100, w)) : 0 };
}
function heroName(body){
  const n = body.querySelector('.sb-hero .sb-name');
  if(!n) return '';
  const t = n.firstChild;
  return (t && t.nodeType === 3 ? t.nodeValue : n.textContent).trim();
}
function fieldOf(body, key){
  const dt = Array.from(body.querySelectorAll('.sp-fields dt')).find(d => !d.closest('.sb-npc') && d.textContent.trim() === key);
  return dt && dt.nextElementSibling ? dt.nextElementSibling.textContent.trim() : '';
}
function heroBars(body){
  const out = [];
  body.querySelectorAll('.meter').forEach(m => {
    if(m.closest('.sb-npc')) return;
    const info = meterInfo(m);
    const cls = /^(生命|体力)/.test(info.lab) ? 'mx-hp' : /^法力/.test(info.lab) ? 'mx-mp' : '';
    if(!cls) return;
    m.classList.add(cls);
    out.push(Object.assign(info, { cls, short:info.lab.slice(0, 2) }));
  });
  return out;
}
function miniHtml(name, sub, bars){
  const ch = name ? Array.from(name)[0] : '';
  const bar = b => `<span class="mx-sm-bar ${b.cls}"><em>${H(b.short)}</em>`
    + `<span class="mx-sm-t"><i style="transform:scaleX(${(b.pct / 100).toFixed(3)})"></i></span>`
    + `<small>${H(b.val)}</small></span>`;
  return `<span class="mx-sb-mini">${ch ? `<span class="mx-medal">${H(ch)}</span>` : ''}`
    + `<span class="mx-sm-id">${name ? `<b>${H(name)}</b>` : ''}${sub ? `<i>${H(sub)}</i>` : ''}</span>`
    + (bars.length ? `<span class="mx-sm-bars">${bars.map(bar).join('')}</span>` : '')
    + `</span>`;
}
function miniStatus(d){
  if(d.dataset.mxDeco) return;
  d.dataset.mxDeco = '1';
  const head = d.querySelector('summary .sp-head'), body = d.querySelector('.sb-body');
  if(!head || !body) return;
  const name = heroName(body);
  const tierEl = body.querySelector('.sb-hero .sb-tier');
  const sub = [tierEl ? tierEl.textContent.trim() : '', fieldOf(body, '所在地')].filter(Boolean).join(' · ');
  const bars = heroBars(body);
  if(!name && !bars.length) return;
  head.insertAdjacentHTML('afterend', miniHtml(name, sub, bars));
  d.classList.add('mx-has-mini');
  const hero = body.querySelector('.sb-hero');
  if(hero && name) hero.insertAdjacentHTML('afterbegin', `<span class="mx-medal mx-medal-lg" aria-hidden="true">${H(Array.from(name)[0])}</span>`);
}
function decoratePage(page){
  if(!frameOf(page)){
    const fr = document.createElement('span');
    fr.className = 'mx-frame'; fr.setAttribute('aria-hidden', 'true');
    page.appendChild(fr);
  }
  page.querySelectorAll('.choice-slip .cs-tag:not(.mx-std)').forEach(t => {
    if(STD_TAG.test(t.textContent.trim())) t.classList.add('mx-std');
  });
  page.querySelectorAll('details.t-status').forEach(miniStatus);
}

/* 装帧用的 SVG：在这里按两套主题的金色各生成一份 data URI */
const svgUri = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const SVGNS = "xmlns='http://www.w3.org/2000/svg'";
const cornerSvg = (c, rot) => svgUri(`<svg ${SVGNS} viewBox='0 0 28 28' fill='none' stroke='${c}' stroke-linecap='round'>`
  + `<g transform='rotate(${rot} 14 14)'><path d='M.5 28V8Q.5 .5 8 .5H28' stroke-opacity='.8'/>`
  + `<path d='M4.5 28V12Q4.5 4.5 12 4.5H28' stroke-opacity='.45'/>`
  + `<path d='M9 9q6.5 0 8.5 8.5Q9 15.5 9 9z' fill='${c}' fill-opacity='.6' stroke='none'/>`
  + `<path d='M17.5 17.5q2 3 5.5 2.5' stroke-opacity='.6'/></g></svg>`);
const ruleSvg = (c, p) => svgUri(`<svg ${SVGNS} viewBox='0 0 200 16'><defs>`
  + `<linearGradient id='a'><stop offset='0' stop-color='${c}' stop-opacity='0'/><stop offset='1' stop-color='${c}'/></linearGradient>`
  + `<linearGradient id='b' x1='1' x2='0'><stop offset='0' stop-color='${c}' stop-opacity='0'/><stop offset='1' stop-color='${c}'/></linearGradient></defs>`
  + `<path d='M0 8h80' stroke='url(#a)'/><path d='M120 8h80' stroke='url(#b)'/>`
  + `<g fill='${c}'><path d='M100 1.5l6.5 6.5-6.5 6.5-6.5-6.5z'/><circle cx='86' cy='8' r='1.6'/><circle cx='114' cy='8' r='1.6'/></g>`
  + `<path d='M100 5l3 3-3 3-3-3z' fill='${p}'/></svg>`);
const endSvg = c => svgUri(`<svg ${SVGNS} viewBox='0 0 132 18'><g fill='${c}'>`
  + `<path d='M66 3l6 6-6 6-6-6z'/><circle cx='50' cy='9' r='1.5'/><circle cx='82' cy='9' r='1.5'/>`
  + `<path d='M57 9q-3.5-5-9.5-3.5 4 1.5 9.5 3.5zM57 9q-3.5 5-9.5 3.5 4-1.5 9.5-3.5z'/>`
  + `<path d='M75 9q3.5-5 9.5-3.5-4 1.5-9.5 3.5zM75 9q3.5 5 9.5 3.5-4-1.5-9.5-3.5z'/></g>`
  + `<path d='M6 9h36M90 9h36' stroke='${c}' stroke-width='.8' stroke-opacity='.55'/></svg>`);
const swordSvg = c => svgUri(`<svg ${SVGNS} viewBox='0 0 40 40' fill='none' stroke='${c}' stroke-width='2' stroke-linecap='round'>`
  + `<path d='M6 6l22 22M34 6L12 28M23 31l8-8M9 23l8 8M29 29l5 5M11 29l-5 5'/></svg>`);
function frameBg(sel, c, lo, li){
  const k = 'var(--mxk) var(--mxk) no-repeat';
  const ln = (col, pos, size) => `linear-gradient(${col},${col}) ${pos}/${size} no-repeat`;
  const H2 = 'calc(100% - 2 * var(--mxe)) 1px', V2 = '1px calc(100% - 2 * var(--mxe))';
  return `${sel}{background:${cornerSvg(c, 0)} 0 0/${k},${cornerSvg(c, 90)} 100% 0/${k},`
    + `${cornerSvg(c, 180)} 100% 100%/${k},${cornerSvg(c, 270)} 0 100%/${k},`
    + `${ln(lo, 'var(--mxe) 0', H2)},${ln(lo, 'var(--mxe) 100%', H2)},${ln(lo, '0 var(--mxe)', V2)},${ln(lo, '100% var(--mxe)', V2)},`
    + `${ln(li, 'var(--mxe) var(--mxg)', H2)},${ln(li, 'var(--mxe) calc(100% - var(--mxg))', H2)},`
    + `${ln(li, 'var(--mxg) var(--mxe)', V2)},${ln(li, 'calc(100% - var(--mxg)) var(--mxe)', V2)}}`;
}
const DV = 'html.mx-deco:not([data-mdx-theme="night"])', DN = 'html.mx-deco[data-mdx-theme="night"]';

/* ═════════ 样式 ═════════ */
const CSS = `
/* ── 阅读设置 ── */
html[data-mx-read] .tome .prose p{font-size:calc(17px * var(--mx-fs,1));line-height:var(--mx-lh,2.05)}
@media (min-width:761px){html[data-mx-read] body:not(.modian-fs-on) .tome{width:min(var(--mx-w,760px),94vw)}}
@media (max-width:760px){html[data-mx-read] .tome .prose p{font-size:calc(15.5px * var(--mx-fs,1))}}
#mx-read{position:fixed;right:12px;bottom:124px;z-index:3002;width:38px;height:38px;padding:0;border-radius:50%;
  border:1px solid rgba(169,138,70,.55);background:linear-gradient(180deg,rgba(246,240,222,.94),rgba(226,214,186,.96));
  color:var(--ink-soft);font-family:var(--font-latin);font-size:16px;font-weight:600;cursor:pointer;
  box-shadow:0 4px 14px rgba(0,0,0,.28);transition:transform .2s var(--ease-out),border-color .2s}
#mx-read.on{border-color:var(--cinnabar);color:var(--cinnabar)}
@media (hover:hover){#mx-read:hover{transform:translateY(-2px);border-color:var(--cinnabar)}}
@media (hover:none){#mx-read{width:42px;height:42px;bottom:128px}}
body.modian-fs-on #mx-read{bottom:auto;top:58px;right:14px}
#mx-read-pop{position:fixed;right:12px;bottom:172px;z-index:3003;width:248px;padding:12px 14px 10px;border-radius:8px;
  border:1px solid rgba(169,138,70,.5);background:linear-gradient(176deg,#f6f0de,#e6dabd);color:var(--ink);
  box-shadow:0 14px 40px rgba(0,0,0,.35);font-family:var(--font-sans);font-size:12.5px;
  opacity:0;transform:translateY(8px) scale(.98);transform-origin:right bottom;pointer-events:none;
  transition:opacity .18s ease,transform .22s var(--ease-out)}
#mx-read-pop.open{opacity:1;transform:none;pointer-events:auto}
body.modian-fs-on #mx-read-pop{bottom:auto;top:104px;transform-origin:right top}
.mx-rp-row{display:flex;align-items:center;gap:6px;margin:0 0 8px}
.mx-rp-row span{flex:none;width:34px;color:var(--ink-faint);letter-spacing:.12em}
.mx-rp-row b{flex:1;text-align:center;font-weight:600;color:var(--cinnabar);font-variant-numeric:tabular-nums}
.mx-rp-row button,.mx-rp-foot button{flex:1;min-height:30px;padding:0 8px;border-radius:15px;border:1px solid rgba(120,88,40,.42);
  background:rgba(255,252,244,.6);color:var(--ink-soft);font:inherit;cursor:pointer}
.mx-rp-row button.on{border-color:var(--cinnabar);color:var(--cinnabar);background:rgba(150,55,46,.1)}
.mx-rp-foot{display:flex;padding-top:8px;border-top:1px dashed rgba(120,96,56,.32)}
.mx-rp-foot button{flex:none;margin-left:auto;font-size:11.5px}

/* ── 阅读页进度 / 跳页 ── */
.mx-rprog{position:absolute;left:0;right:0;top:0;height:2px;z-index:5;pointer-events:none;overflow:hidden;border-radius:6px 14px 0 0}
.mx-rprog i{display:block;height:100%;background:linear-gradient(90deg,var(--gilt),var(--cinnabar));transform-origin:left center;transform:scaleX(0)}
.mx-bprog{position:absolute;left:30px;right:30px;top:0;height:1px;background:rgba(120,88,40,.22);pointer-events:none}
.mx-bprog::after{content:'';position:absolute;inset:0;background:var(--cinnabar);opacity:.7;transform-origin:left center;transform:scaleX(var(--p,0))}
.ff-page.mx-jump{cursor:pointer;border-radius:3px}
@media (hover:hover){.ff-page.mx-jump:hover{color:var(--cinnabar)}}
.mx-jp input{width:3.6em;padding:1px 4px;margin:0 2px;border:1px solid rgba(150,55,46,.5);border-radius:3px;background:rgba(255,252,244,.8);
  color:var(--ink);font:inherit;text-align:center;-moz-appearance:textfield}
.mx-jp input::-webkit-inner-spin-button{display:none}

/* ── 目录 ── */
#mx-toc-tools{flex:none;display:flex;align-items:center;gap:6px;padding:9px 12px 2px}
#mx-toc-q{flex:1;min-width:0;height:30px;padding:0 10px;border-radius:15px;border:1px solid rgba(120,88,40,.42);
  background:rgba(255,252,244,.55);color:var(--ink);font:12.5px var(--font-sans);outline:none}
#mx-toc-q:focus{border-color:var(--cinnabar)}
#mx-toc-bm{flex:none;white-space:nowrap}
#mx-toc-n{flex:none;font:10.5px var(--font-sans);color:var(--ink-faint);letter-spacing:.08em}
.mx-ti{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.ti-where{font:10.5px var(--font-sans);color:var(--ink-faint);letter-spacing:.06em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ti-hit{font:11.5px/1.6 var(--font-serif);color:var(--ink-soft)}
.ti-hit:empty{display:none}
.ti-hit mark{background:rgba(150,55,46,.18);color:var(--cinnabar-deep);border-radius:2px;padding:0 1px}
.ti-star{flex:none;align-self:center;width:26px;height:26px;margin:-4px -4px -4px 0;display:grid;place-items:center;border-radius:50%;
  color:var(--gilt-dim);font-size:15px;line-height:1;cursor:pointer;transition:transform .2s var(--ease-spring)}
.ti-star.on{color:var(--cinnabar)}
.ti-star:active{transform:scale(.82)}
@media (hover:hover){.ti-star:hover{color:var(--cinnabar)}}
.toc-item.mx-bm{border-left:3px solid var(--cinnabar)}

/* ── 总览 · 本页变化 ── */
.mx-delta{margin:0 0 6px}
.mx-delta .sec-title{margin-top:4px}
.mx-drows{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}
.mx-dr{display:flex;align-items:baseline;gap:6px;padding:6px 10px;border-radius:4px;border:1px solid rgba(120,88,40,.28);
  background:rgba(246,242,231,.55);font-family:var(--font-sans);font-size:12px;min-width:0}
.mx-dr i{flex:1;min-width:0;font-style:normal;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mx-dr b{flex:none;font-variant-numeric:tabular-nums}
.mx-dr em{flex:none;font-style:normal;font-size:10.5px;color:var(--ink-faint)}
.mx-dr.up b{color:var(--moss-deep)}.mx-dr.down b{color:var(--cinnabar)}
.mx-dmore{display:block;margin-top:5px;font:11px var(--font-sans);color:var(--ink-faint);letter-spacing:.08em}
.mx-dtags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.mx-dt{padding:3px 10px;border-radius:12px;font:11.5px var(--font-sans);letter-spacing:.06em;border:1px solid currentColor}
.mx-dt.up{color:var(--moss-deep);background:rgba(91,107,76,.08)}.mx-dt.down{color:var(--cinnabar);background:rgba(150,55,46,.07)}

/* ── 通用工具条 / 标记 ── */
.mx-tools{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:2px 0 10px}
.mx-tools .mx-q{flex:1 1 160px;min-width:0;height:30px;padding:0 11px;border-radius:15px;border:1px solid rgba(120,88,40,.42);
  background:rgba(255,252,244,.55);color:var(--ink);font:12.5px var(--font-sans);outline:none}
.mx-tools .mx-q:focus{border-color:var(--cinnabar)}
.mx-d{flex:none;align-self:center;padding:0 7px;border-radius:9px;font:600 10.5px/17px var(--font-sans);letter-spacing:.04em;font-variant-numeric:tabular-nums}
.mx-d.up{color:var(--moss-deep);background:rgba(91,107,76,.14)}
.mx-d.down{color:var(--cinnabar);background:rgba(150,55,46,.12)}
.mx-d.new{color:#fff;background:var(--cinnabar)}
.plaque h4 .mx-d + .init-badge,.plaque h4 .mx-d{margin-left:auto}
.plaque h4 .mx-d + .init-badge{margin-left:0}

/* ── 羁绊录 ── */
.mx-bond > h4{cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent}
.mx-fold{flex:none;align-self:center;width:16px;height:16px;position:relative}
.mx-fold::before{content:'';position:absolute;left:5px;top:3px;width:6px;height:6px;border-right:1.5px solid var(--gilt-dim);border-bottom:1.5px solid var(--gilt-dim);
  transform:rotate(45deg);transition:transform .22s var(--ease-out)}
.mx-bond.folded .mx-fold::before{transform:translateY(3px) rotate(-45deg)}
.mx-bond.folded > :not(h4){display:none}
.mx-bond.folded{padding-top:9px;padding-bottom:9px}
.mx-rel{border-color:currentColor !important}
.mx-rel.r-foe{color:#8E2A22;background:rgba(150,55,46,.1)}
.mx-rel.r-wary{color:#8A5A1A;background:rgba(169,120,40,.1)}
.mx-rel.r-love{color:#A3305E;background:rgba(190,60,110,.1)}
.mx-rel.r-close{color:#6B3F8C;background:rgba(110,70,150,.1)}
.mx-rel.r-friend{color:var(--moss-deep);background:rgba(91,107,76,.1)}
.mx-rel.r-new{color:var(--gilt-dim)}

/* ── 行囊 ── */
.mx-ref{margin:14px 0 4px;border:1px dashed rgba(120,88,40,.35);border-radius:4px;padding:0 12px}
.mx-ref > summary{list-style:none;cursor:pointer;padding:9px 0;font:12px var(--font-sans);letter-spacing:.16em;color:var(--ink-faint)}
.mx-ref > summary::-webkit-details-marker{display:none}
.mx-ref > summary::before{content:'▸';display:inline-block;margin-right:6px;transition:transform .2s var(--ease-out)}
.mx-ref[open] > summary::before{transform:rotate(90deg)}
.mx-ref[open]{padding-bottom:8px}
.mx-q0{--qc:#8B8172}.mx-q1{--qc:#6E5E4C}.mx-q2{--qc:#4F6B3E}.mx-q3{--qc:#2F5A7A}
.mx-q4{--qc:#6A44A8}.mx-q5{--qc:#A0561A}.mx-q6{--qc:#B07D12}.mx-q7{--qc:#A8302A}
.chip.c-q[class*="mx-q"]{color:var(--qc)}
.mx-cat{margin:12px 0 6px;font:600 11.5px var(--font-sans);letter-spacing:.2em;color:var(--ink-faint)}
.mx-item{border-left:3px solid var(--qc,var(--gilt-dim))}
.mx-item.mx-q6,.mx-item.mx-q7{box-shadow:0 4px 12px rgba(96,66,28,.1),inset 0 0 0 1px color-mix(in srgb,var(--qc) 30%,transparent)}
.mx-qtag{margin-left:auto;padding:0 8px;border-radius:10px;font:600 10.5px/18px var(--font-sans);letter-spacing:.1em;color:var(--qc);
  border:1px solid currentColor;font-style:normal}

/* ── 委托 ── */
.mx-qbar{position:relative;height:6px;margin:9px 40px 5px 0;border-radius:3px;background:rgba(120,88,40,.16);overflow:hidden}
.mx-qbar i{position:absolute;inset:0;background:linear-gradient(90deg,var(--gilt),var(--cinnabar));transform-origin:left center}
.mx-qbar{overflow:visible}.mx-qbar i{border-radius:3px}
.mx-qbar span{position:absolute;left:calc(100% + 8px);top:50%;transform:translateY(-50%);font:10.5px var(--font-sans);color:var(--ink-faint);font-variant-numeric:tabular-nums}
.mx-quest h4 .mx-d{margin-left:0}
.mx-quest.mx-fresh{position:relative;border-color:rgba(150,55,46,.55)}
.mx-quest.mx-fresh::after{content:'';position:absolute;inset:-1px;border-radius:4px;pointer-events:none;
  box-shadow:0 0 0 2px rgba(150,55,46,.35);opacity:0;animation:mx-fresh 1.6s ease-out 2}
@keyframes mx-fresh{0%{opacity:0}30%{opacity:1}100%{opacity:0}}

/* ── 信笺 ── */
#mx-phr{display:flex;flex-wrap:wrap;align-items:center;gap:5px;padding:7px 0 2px}
.mx-ph{position:relative;padding:3px 10px;border-radius:12px;border:1px solid rgba(120,88,40,.36);background:rgba(255,252,244,.5);
  color:var(--ink-soft);font:12px var(--font-sans);letter-spacing:.04em;cursor:pointer;transition:transform .15s ease}
.mx-ph:active{transform:scale(.95)}
@media (hover:hover){.mx-ph:hover{border-color:var(--cinnabar);color:var(--cinnabar)}}
.mx-ph i{margin-left:6px;font-style:normal;color:var(--cinnabar)}
.mx-ph-tool{border-style:dashed;color:var(--ink-faint)}
#mx-ph-new{flex:1 1 140px;min-width:0;height:26px;padding:0 10px;border-radius:13px;border:1px solid rgba(150,55,46,.45);
  background:rgba(255,252,244,.7);color:var(--ink);font:12px var(--font-sans);outline:none}
#mx-hist{display:flex;flex-direction:column;gap:4px;margin:6px 0 2px;padding:8px;border-radius:4px;border:1px dashed rgba(120,88,40,.35);max-height:150px;overflow-y:auto}
#mx-hist[hidden]{display:none}
.mx-hist-h{font:10.5px var(--font-sans);letter-spacing:.1em;color:var(--ink-faint)}
#mx-hist button{text-align:left;padding:5px 8px;border-radius:3px;border:1px solid transparent;background:rgba(255,252,244,.5);color:var(--ink-soft);
  font:12.5px/1.6 var(--font-serif);cursor:pointer}
@media (hover:hover){#mx-hist button:hover{border-color:rgba(150,55,46,.4)}}

/* ── 紫曜夜读 ── */
html[data-mdx-theme="night"] #mx-read{background:linear-gradient(180deg,rgba(33,18,52,.92),rgba(15,8,23,.95));border-color:var(--nt-hair-strong);color:var(--gilt)}
html[data-mdx-theme="night"] #mx-read-pop{background:linear-gradient(176deg,#21123a,#120a1d);border-color:var(--nt-hair-strong);box-shadow:var(--nt-float)}
html[data-mdx-theme="night"] :is(.mx-rp-row button,.mx-rp-foot button,#mx-toc-q,.mx-tools .mx-q,.mx-jp input,.mx-ph,#mx-ph-new,#mx-hist button,.mx-dr){
  background:rgba(20,11,34,.6);border-color:var(--nt-hair-strong);color:var(--ink-soft)}
html[data-mdx-theme="night"] :is(#mx-toc-q,.mx-tools .mx-q,#mx-ph-new):focus{border-color:var(--nt-rose)}
html[data-mdx-theme="night"] :is(.mx-rp-foot,.mx-ref,#mx-hist){border-color:var(--nt-hair-strong)}
html[data-mdx-theme="night"] .mx-bprog,html[data-mdx-theme="night"] .mx-qbar{background:var(--nt-hair)}
html[data-mdx-theme="night"] .ti-hit mark{background:var(--nt-rose-dim);color:var(--cinnabar-hi)}
html[data-mdx-theme="night"] .mx-q0{--qc:#a99ab8}html[data-mdx-theme="night"] .mx-q1{--qc:#ddd2e8}
html[data-mdx-theme="night"] .mx-q2{--qc:#7ec8a0}html[data-mdx-theme="night"] .mx-q3{--qc:#7fb8ff}
html[data-mdx-theme="night"] .mx-q4{--qc:#c9a4ff}html[data-mdx-theme="night"] .mx-q5{--qc:#ffae6b}
html[data-mdx-theme="night"] .mx-q6{--qc:#ffd27a}html[data-mdx-theme="night"] .mx-q7{--qc:#ff6f8f}
html[data-mdx-theme="night"] .mx-rel.r-foe{color:#ff6f8f;background:var(--nt-rose-dim)}
html[data-mdx-theme="night"] .mx-rel.r-wary{color:#ffbf7a;background:rgba(255,170,90,.12)}
html[data-mdx-theme="night"] .mx-rel.r-love{color:#ff8fc8;background:rgba(255,120,190,.13)}
html[data-mdx-theme="night"] .mx-rel.r-close{color:#c9a4ff;background:var(--nt-violet-dim)}
html[data-mdx-theme="night"] .mx-rel.r-friend{color:#7ec8a0;background:rgba(126,200,160,.12)}
html[data-mdx-theme="night"] .mx-d.up,html[data-mdx-theme="night"] .mx-dt.up{background:rgba(126,200,160,.14)}
html[data-mdx-theme="night"] .mx-d.down,html[data-mdx-theme="night"] .mx-dt.down{background:var(--nt-rose-dim)}
html[data-mdx-theme="night"] .mx-quest.mx-fresh::after{box-shadow:0 0 0 2px rgba(255,94,138,.4)}

/* ── 手机 ── */
@media (max-width:760px){
  #mx-read-pop{left:12px;right:12px;width:auto;bottom:178px}
  .mx-drows{grid-template-columns:1fr 1fr}
  .mx-dr{padding:6px 8px;font-size:11.5px}
  .mx-dr em{display:none}
  #mx-toc-tools{padding:8px 10px 2px}
  .ti-star{width:32px;height:32px}
}
@media (prefers-reduced-motion:reduce){
  #mx-read,#mx-read-pop,.ti-star,.mx-fold::before,.mx-ref > summary::before,.mx-ph{transition:none}
  .mx-quest.mx-fresh::after{animation:none;opacity:1}
}
`;
const CSS_DECO = `
/* ── 九 · 书页装帧（html.mx-deco；「简洁」时整段不生效） ── */
.mx-frame,.mx-sb-mini,.mx-medal{display:none}

/* 书桌：烛光暖晕 / 夜读星云（静态渐变） */
html.mx-deco #stage::before{content:'';position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(46% 42% at 50% 44%,rgba(255,196,120,.13),transparent 72%),radial-gradient(120% 90% at 50% 50%,transparent 56%,rgba(0,0,0,.36))}
${DN} #stage::before{background:radial-gradient(38% 34% at 20% 26%,rgba(180,120,255,.15),transparent 72%),radial-gradient(34% 30% at 82% 76%,rgba(255,94,138,.10),transparent 72%),radial-gradient(120% 90% at 50% 50%,transparent 56%,rgba(0,0,0,.45))}

/* 书脊 + 书页厚度（仅桌面；手机书页铺满，不画） */
@media (min-width:761px){
  html.mx-deco .tome::before{content:'';position:absolute;left:-10px;top:5px;bottom:5px;width:18px;z-index:-1;transform:translateZ(-1px);pointer-events:none;border-radius:9px 3px 3px 9px;
    background:linear-gradient(180deg,transparent 16%,rgba(201,174,109,.6) 16%,rgba(201,174,109,.6) 16.5%,transparent 16.5%,transparent 83.5%,rgba(201,174,109,.6) 83.5%,rgba(201,174,109,.6) 84%,transparent 84%),
      linear-gradient(90deg,#24140d,#5a3626 38%,#40261a 72%,#22130c);
    box-shadow:-4px 6px 14px rgba(0,0,0,.5),inset 0 0 0 1px rgba(201,174,109,.22)}
  html.mx-deco .tome::after{content:'';position:absolute;inset:0;z-index:-1;transform:translateZ(-1px);pointer-events:none;border-radius:6px 14px 14px 6px;background:#d8caa6;
    box-shadow:2px 2px 0 #e6dbbf,3px 3px 0 rgba(120,90,50,.38),5px 5px 0 #ddd0b0,6px 6px 0 rgba(120,90,50,.32),8px 8px 0 #d3c49f,9px 9px 0 rgba(84,60,30,.5),22px 28px 46px rgba(0,0,0,.5)}
  ${DN} .tome::before{background:linear-gradient(180deg,transparent 16%,rgba(232,195,133,.55) 16%,rgba(232,195,133,.55) 16.5%,transparent 16.5%,transparent 83.5%,rgba(232,195,133,.55) 83.5%,rgba(232,195,133,.55) 84%,transparent 84%),
      linear-gradient(90deg,#0d0614,#3a1a5a 38%,#24103a 72%,#0b0511);box-shadow:-4px 6px 16px rgba(0,0,0,.6),inset 0 0 0 1px rgba(232,195,133,.2)}
  ${DN} .tome::after{background:#120a1c;
    box-shadow:2px 2px 0 #1c1029,3px 3px 0 rgba(200,160,255,.22),5px 5px 0 #180d24,6px 6px 0 rgba(200,160,255,.16),8px 8px 0 #140a1f,9px 9px 0 rgba(232,195,133,.22),22px 28px 50px rgba(0,0,0,.65)}
}

/* 版框：描金双线 + 四角花饰（ghost 翻页也带着，所以挂 .page 而不是 #page-base） */
html.mx-deco .page > .mx-frame{display:block;position:absolute;inset:9px;z-index:1;pointer-events:none;--mxk:28px;--mxe:calc(var(--mxk) - 2px);--mxg:calc(var(--mxk) / 7)}
${frameBg(DV + ' .page > .mx-frame', '#A98A46', 'rgba(169,138,70,.6)', 'rgba(169,138,70,.32)')}
${frameBg(DN + ' .page > .mx-frame', '#e8c385', 'rgba(232,195,133,.42)', 'rgba(232,195,133,.2)')}

/* 章题：拉丁小字在上、标题居中、花饰分隔（只动阅读页，仪典里的章题不变） */
@keyframes mxRise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes mxSpread{from{opacity:0;transform:scaleX(.35)}to{opacity:1;transform:none}}
html.mx-deco #page-base .chapter-tag{flex-direction:column;gap:6px;margin:10px 0 26px;text-align:center}
html.mx-deco #page-base .chapter-tag .ct-latin{order:-1;font-size:11px;letter-spacing:.5em;padding-left:.5em;color:var(--cinnabar)}
html.mx-deco #page-base .chapter-tag h2{font-size:22px;line-height:1.5;letter-spacing:.2em;padding-left:.2em;white-space:normal}
${DV} #page-base .chapter-tag h2{color:var(--ink)}
html.mx-deco #page-base .chapter-tag h2::before,html.mx-deco #page-base .chapter-tag .ct-rule::after{display:none}
html.mx-deco #page-base .chapter-tag .ct-rule{flex:none;width:min(300px,78%);height:16px;background:${ruleSvg('#A98A46', '#EAE0C7')} center/100% 100% no-repeat}
${DN} #page-base .chapter-tag .ct-rule{background-image:${ruleSvg('#e8c385', '#170d23')}}
html.mx-deco #page-base .chapter-tag > *{animation:mxRise .6s var(--ease-out) both}
html.mx-deco #page-base .chapter-tag h2{animation-delay:.06s}
html.mx-deco #page-base .chapter-tag .ct-rule{animation:mxSpread .7s .14s var(--ease-out) both}

/* 正文：对白淡朱底纹、章末花饰（保留 clear:both，页边批注浮动不受影响） */
html.mx-deco #page-base .dlg{background:linear-gradient(transparent 64%,rgba(150,55,46,.11) 64%,rgba(150,55,46,.11) 94%,transparent 94%);-webkit-box-decoration-break:clone;box-decoration-break:clone}
${DN} #page-base .dlg{background:linear-gradient(transparent 62%,rgba(201,160,255,.17) 62%,rgba(201,160,255,.17) 94%,transparent 94%)}
html.mx-deco #page-base .prose:not(:empty)::after{content:'';display:block;clear:both;width:132px;height:18px;margin:26px auto 2px;background:${endSvg('#A98A46')} center/contain no-repeat;opacity:.85}
${DN} #page-base .prose:not(:empty)::after{background-image:${endSvg('#e8c385')}}

/* 心语便签：缝线边 + 淡「」水印（羊皮纸的「页边批注」手写模式不动） */
${DV}[data-mdx-off~="margin"] #page-base .mind-slip{outline:1px dashed rgba(150,55,46,.28);outline-offset:-4px}
${DV}[data-mdx-off~="margin"] #page-base .mind-slip::before,${DN} #page-base .mind-slip::after{content:'」';display:block;position:absolute;right:14px;bottom:-10px;font-family:var(--font-serif);font-size:56px;line-height:1;color:rgba(150,55,46,.09);pointer-events:none}
${DN} #page-base .mind-slip::after{color:rgba(255,95,174,.13);border:none;width:auto;height:auto;opacity:1}

/* 大陆见闻：顶端一条胶带、底边剪裁虚线 */
html.mx-deco #page-base .news-clip{position:relative;border-bottom-style:dashed}
html.mx-deco #page-base .news-clip::before{content:'';position:absolute;top:-3px;left:50%;width:70px;height:15px;margin-left:-35px;z-index:1;pointer-events:none;transform:rotate(-2.5deg);
  background:linear-gradient(180deg,rgba(246,236,206,.8),rgba(226,212,170,.72));box-shadow:0 1px 2px rgba(60,40,15,.2)}
${DN} #page-base .news-clip::before{background:linear-gradient(180deg,rgba(233,201,140,.32),rgba(233,201,140,.18));box-shadow:none}

/* 战况：警示斜纹 + 交剑水印 */
html.mx-deco #page-base .duel-banner{position:relative}
html.mx-deco #page-base .duel-banner::after{content:'';position:absolute;right:10px;bottom:6px;width:44px;height:44px;pointer-events:none;opacity:.12;background:${swordSvg('#6D231C')} center/contain no-repeat}
${DN} #page-base .duel-banner::after{background-image:${swordSvg('#e8c385')};opacity:.16}
${DV} #page-base .duel-banner .db-head{background:repeating-linear-gradient(-45deg,rgba(255,240,220,.09) 0 7px,transparent 7px 14px),linear-gradient(94deg,rgba(150,55,46,.9),rgba(109,35,28,.9))}
${DN} #page-base .duel-banner .db-head{background:repeating-linear-gradient(-45deg,rgba(255,233,184,.07) 0 7px,transparent 7px 14px),linear-gradient(90deg,rgba(122,63,209,.65),rgba(255,94,138,.35))}

/* 选项：「命运之岔」题头 + 罗马数字印 */
html.mx-deco #page-base .choices{counter-reset:mxc}
html.mx-deco #page-base .choices::before{content:'命运之岔';grid-column:1/-1;padding:0 0 2px .5em;text-align:center;font-family:var(--font-sans);font-size:11px;letter-spacing:.5em;color:var(--gilt-dim);
  background:linear-gradient(90deg,transparent,rgba(169,138,70,.6)) 0 50%/32% 1px no-repeat,linear-gradient(90deg,rgba(169,138,70,.6),transparent) 100% 50%/32% 1px no-repeat}
${DN} #page-base .choices::before{color:var(--gilt);background-image:linear-gradient(90deg,transparent,rgba(232,195,133,.5)),linear-gradient(90deg,rgba(232,195,133,.5),transparent)}
html.mx-deco #page-base .choice-slip{counter-increment:mxc}
html.mx-deco #page-base .choice-slip::before{content:counter(mxc,upper-roman);display:grid;place-items:center;min-width:24px;width:auto;height:24px;padding:0 4px;border-radius:12px;
  font-family:var(--font-latin);font-size:12.5px;font-weight:700;line-height:1;color:#FBF3E2;text-shadow:0 1px 1px rgba(60,10,6,.4)}
${DN} #page-base .choice-slip::before{color:#fff;text-shadow:0 0 6px rgba(255,255,255,.4)}
html.mx-deco .choice-slip .cs-tag.mx-std{display:none}

/* 状态簿：皮革书签头 + 收起时的徽章速览 */
${DV} #page-base .specimen.t-status > summary{margin:-9px -11px 0;padding:9px 11px;border-radius:2px;
  background:radial-gradient(120% 140% at 0 0,rgba(255,210,150,.14),transparent 60%),linear-gradient(180deg,#5b3a2a,#3d261b);
  box-shadow:inset 0 0 0 1px rgba(201,174,109,.5),inset 0 0 0 3px #3d261b,inset 0 0 0 4px rgba(201,174,109,.26),0 2px 6px -2px rgba(40,20,10,.45)}
${DV} #page-base .specimen.t-status[open] > summary{margin-bottom:12px}
${DV} #page-base .specimen.t-status .sp-head{margin-bottom:0}
${DV} #page-base .t-status > summary :is(.sp-emblem,.sp-title,.sb-chev){color:var(--gilt-hi)}
${DV} #page-base .t-status > summary .sp-title{text-shadow:0 1px 1px rgba(0,0,0,.45)}
${DV} #page-base .t-status > summary .sp-latin{color:rgba(233,214,170,.72)}
${DV} #page-base .t-status > summary .sb-line{color:rgba(246,236,214,.88)}
${DN} #page-base .specimen.t-status > summary{margin:-16px -18px 0;padding:16px 18px 14px;background:linear-gradient(105deg,rgba(111,212,196,.13),rgba(122,63,209,.10) 55%,transparent 85%)}
${DN} #page-base .specimen.t-status[open] > summary{margin-bottom:12px;border-bottom:1px solid var(--nt-hair)}
${DN} #page-base .specimen.t-status[open] .sp-head{padding-bottom:0;border-bottom:none;margin-bottom:0}
html.mx-deco .t-status.mx-has-mini > summary .sb-line{display:none}
html.mx-deco .t-status > summary .mx-sb-mini{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin-top:9px}
html.mx-deco .t-status[open] > summary .mx-sb-mini{display:none}
html.mx-deco .mx-medal{display:grid;place-items:center;flex:none;width:34px;height:34px;border-radius:50%;font-weight:700;font-size:16px;line-height:1;color:#F3E2B8;
  background:radial-gradient(circle at 35% 30%,#7a4a32,#3a2117 70%);box-shadow:0 0 0 1px rgba(201,174,109,.85),0 0 0 3px #3a2117,0 0 0 4px rgba(201,174,109,.4),0 2px 5px rgba(0,0,0,.35)}
html.mx-deco .sb-hero .mx-medal{width:40px;height:40px;font-size:19px;align-self:center;margin:4px 2px 4px 4px}
${DN} .mx-medal{color:var(--gilt-hi);background:radial-gradient(circle at 35% 30%,#4b2475,#1c0d2c 70%);box-shadow:0 0 0 1px rgba(232,195,133,.7),0 0 0 3px #140a1f,0 0 0 4px rgba(111,212,196,.4),0 0 12px rgba(180,120,255,.35)}
.mx-sm-id{display:flex;flex-direction:column;min-width:0;line-height:1.35}
.mx-sm-id b{font-size:14.5px;letter-spacing:.06em;color:#F6EBD2}
.mx-sm-id i{font-style:normal;font-family:var(--font-sans);font-size:11px;letter-spacing:.06em;color:rgba(233,214,170,.76)}
.mx-sm-bars{display:flex;flex-direction:column;gap:4px;margin-left:auto;font-family:var(--font-sans)}
.mx-sm-bar{display:flex;align-items:center;gap:7px;font-size:10.5px;color:rgba(246,236,214,.82)}
.mx-sm-bar em{font-style:normal;letter-spacing:.1em}
.mx-sm-bar small{min-width:54px;font-size:10.5px;font-variant-numeric:tabular-nums}
.mx-sm-t{width:84px;height:5px;border-radius:9px;overflow:hidden;background:rgba(0,0,0,.38);box-shadow:inset 0 0 0 1px rgba(201,174,109,.25)}
.mx-sm-t i{display:block;height:100%;border-radius:inherit;transform-origin:left center}
.mx-hp .mx-sm-t i{background:linear-gradient(90deg,#8e2219,#d4574a)}
.mx-mp .mx-sm-t i{background:linear-gradient(90deg,#2a5578,#6fa6d4)}
${DN} .mx-sm-id b{color:var(--ink)}
${DN} .mx-sm-id i,${DN} .mx-sm-bar{color:var(--ink-soft)}
${DN} .mx-sm-t{background:rgba(28,16,46,.85);box-shadow:inset 0 0 0 1px var(--nt-hair)}
${DN} .mx-hp .mx-sm-t i{background:linear-gradient(90deg,#c2184f,#ff7ea2)}
${DN} .mx-mp .mx-sm-t i{background:linear-gradient(90deg,#5a46d6,#a9b8ff)}

/* 生命 / 法力条：朱红 / 青金 + 十格刻度 */
html.mx-deco #page-base .t-status .meter .m-track{position:relative}
html.mx-deco #page-base .t-status .meter .m-track::after{content:'';position:absolute;inset:0;pointer-events:none;border-radius:inherit;
  background:repeating-linear-gradient(90deg,transparent 0 calc(10% - 1px),rgba(43,34,26,.22) calc(10% - 1px) 10%)}
${DN} #page-base .t-status .meter .m-track::after{background:repeating-linear-gradient(90deg,transparent 0 calc(10% - 1px),rgba(5,2,9,.55) calc(10% - 1px) 10%)}
html.mx-deco #page-base .t-status .meter.mx-hp .m-fill{background:linear-gradient(180deg,rgba(255,255,255,.3),rgba(255,255,255,0) 60%),linear-gradient(90deg,#7d1f18,#c8483b);box-shadow:0 0 6px -1px rgba(200,72,59,.7)}
html.mx-deco #page-base .t-status .meter.mx-mp .m-fill{background:linear-gradient(180deg,rgba(255,255,255,.3),rgba(255,255,255,0) 60%),linear-gradient(90deg,#24476a,#5f93c4);box-shadow:0 0 6px -1px rgba(95,147,196,.7)}
${DN} #page-base .t-status .meter.mx-hp .m-fill{background:linear-gradient(90deg,#a3133f,#e0507a);box-shadow:0 0 8px -1px #ff5e8a}
${DN} #page-base .t-status .meter.mx-mp .m-fill{background:linear-gradient(90deg,#4a3ab8,#7f8fe6);box-shadow:0 0 8px -1px #a9b8ff}

/* 属性格：宝石格 */
html.mx-deco #page-base .sb-stat{position:relative}
html.mx-deco #page-base .sb-stat::before{content:'';position:absolute;top:-3px;left:50%;width:6px;height:6px;margin-left:-3px;transform:rotate(45deg);background:var(--gilt);pointer-events:none}
${DV} #page-base .sb-stat{border-color:rgba(169,138,70,.5);background:linear-gradient(180deg,rgba(255,250,238,.62),rgba(236,224,196,.5));
  box-shadow:inset 0 0 0 2px rgba(255,250,238,.5),inset 0 0 0 3px rgba(169,138,70,.2),0 2px 4px -2px rgba(70,46,18,.3)}
${DV} #page-base .sb-stat b{color:var(--cinnabar-deep)}
${DN} #page-base .sb-stat{border-color:rgba(232,195,133,.3);box-shadow:inset 0 0 14px rgba(111,212,196,.08)}
${DN} #page-base .sb-stat b{color:var(--gilt-hi);text-shadow:0 0 8px rgba(232,195,133,.35)}

/* 所有书页卡：字段虚线引线、题头描金线 */
html.mx-deco #page-base .specimen .sp-fields{column-gap:0}
html.mx-deco #page-base .specimen .sp-fields dt{padding-right:12px}
html.mx-deco #page-base .specimen .sp-fields :is(dt,dd){padding-bottom:2px;border-bottom:1px dotted rgba(120,88,40,.3)}
${DN} #page-base .specimen .sp-fields :is(dt,dd){border-bottom-color:var(--nt-hair)}
${DV} #page-base .specimen:not(.t-status) .sp-head{padding-bottom:8px;border-bottom:1px solid transparent;border-image:var(--mdx-gilt-rule) 1}

/* 地脚页码两侧小菱 */
html.mx-deco #page-base .ff-page::before,html.mx-deco #page-base .ff-page::after{content:'';display:inline-block;width:5px;height:5px;margin:0 10px;vertical-align:2px;transform:rotate(45deg);background:var(--gilt);opacity:.7}

@media (max-width:760px){
  html.mx-deco .page > .mx-frame{inset:5px;--mxk:20px}
  html.mx-deco #page-base .chapter-tag h2{font-size:19px;letter-spacing:.14em}
  html.mx-deco #page-base .ff-page::before,html.mx-deco #page-base .ff-page::after{display:none}
  html.mx-deco .t-status > summary .mx-sb-mini{gap:8px 10px}
  .mx-sm-t{width:64px}
}
@media (max-width:420px){
  .mx-sm-bars{width:100%;margin-left:0}
}
@media (prefers-reduced-motion:reduce){
  html.mx-deco #page-base .chapter-tag > *{animation:none}
}
`;
function mountCss(){
  if(document.getElementById('mx-enhance-css')) return;
  const st = document.createElement('style');
  st.id = 'mx-enhance-css'; st.textContent = CSS + CSS_DECO;
  document.body.appendChild(st);
}

/* ═════════ 挂载 ═════════ */
function watch(id, fn){
  const el = document.getElementById(id);
  if(!el || !window.MutationObserver) return;
  new MutationObserver(()=>fn()).observe(el, { childList:true });
  fn();
}
window.__mxEnhance.refresh = ()=>{ enhancePage(); enhanceInsert(); enhanceToc(); };
function boot(){
  mountCss();
  applyRead();
  mountReadSettings();
  mountLetter();
  watch('page-base', enhancePage);
  watch('insert', enhanceInsert);
  watch('toc-list', enhanceToc);
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

