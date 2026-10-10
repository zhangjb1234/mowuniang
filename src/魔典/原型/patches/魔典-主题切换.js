/* 魔典-主题切换 v1
 * 在魔典 iframe 内运行：给 <html> 打 data-mdx-theme（vellum 羊皮纸 / night 紫曜夜读），
 * 在书页左下角放一枚切换按钮，选择记在 localStorage（与酒馆同源，所有楼层与「旧楼收纳」卡片共享）。
 * 手动指定：加载前设 window.MODIAN_THEME_DEFAULT = 'night'（仅在玩家没选过时生效），
 * 或在控制台 / 其他脚本里调用 window.__modianTheme.set('night')。
 * 另含较量面板 d20 的滚骰动画（两套主题通用；系统「减少动态效果」时跳过）。
 */
(function () {
  'use strict';
  if (window.__modianTheme) return;
  var KEY = 'modian_theme_v1';
  var THEMES = { vellum: '羊皮纸', night: '紫曜夜读' };
  var root = document.documentElement;

  function store() {
    try { if (window.localStorage) return window.localStorage; } catch (e) {}
    try { return window.parent.localStorage; } catch (e) {}
    return null;
  }
  function saved() {
    var s = store(), v = null;
    try { v = s && s.getItem(KEY); } catch (e) {}
    return THEMES[v] ? v : null;
  }
  function initial() {
    if (THEMES[window.MODIAN_THEME_INITIAL]) return window.MODIAN_THEME_INITIAL;
    return saved() || (THEMES[window.MODIAN_THEME_DEFAULT] ? window.MODIAN_THEME_DEFAULT : 'vellum');
  }

  var ICON_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/><path d="M17 3.5v3M15.5 5h3"/></svg>';
  var ICON_BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></svg>';

  function label() {
    var b = document.getElementById('mdx-theme-toggle');
    if (!b) return;
    var cur = root.getAttribute('data-mdx-theme');
    var next = cur === 'night' ? 'vellum' : 'night';
    b.innerHTML = (next === 'night' ? ICON_MOON : ICON_BOOK) + '<span>' + THEMES[next] + '</span>';
    b.setAttribute('title', '切换为 · ' + THEMES[next]);
    b.setAttribute('aria-label', '切换为' + THEMES[next] + '主题');
  }
  function apply(t) {
    root.setAttribute('data-mdx-theme', THEMES[t] ? t : 'vellum');
    label();
  }
  function set(t, persist) {
    if (!THEMES[t]) return;
    apply(t);
    if (persist !== false) { try { store().setItem(KEY, t); } catch (e) {} }
    try { window.dispatchEvent(new CustomEvent('modian:theme', { detail: t })); } catch (e) {}
  }
  function toggle() { set(root.getAttribute('data-mdx-theme') === 'night' ? 'vellum' : 'night'); }
  apply(initial());

  var STYLE =
    '#mdx-theme-toggle{position:fixed;left:12px;bottom:78px;z-index:3002;display:flex;align-items:center;gap:6px;height:38px;padding:0 13px 0 11px;' +
    'border-radius:19px;border:1px solid rgba(140,112,64,.6);background:linear-gradient(180deg,#F6F0DE,#E4D9BF);color:#4E4032;' +
    'font:500 12px/1 "Noto Sans SC",sans-serif;letter-spacing:.12em;cursor:pointer;box-shadow:0 4px 12px rgba(41,30,16,.3),inset 0 1px 0 rgba(255,255,255,.8);' +
    'opacity:.82;transition:opacity .2s,transform .2s,box-shadow .2s,border-color .2s}' +
    '#mdx-theme-toggle:hover{opacity:1;transform:translateY(-1px);border-color:#96372E}' +
    '#mdx-theme-toggle svg{width:16px;height:16px;flex:none}' +
    'html[data-mdx-theme="night"] #mdx-theme-toggle{background:linear-gradient(180deg,rgba(33,18,52,.92),rgba(15,8,23,.95));color:#e8c385;' +
    'border-color:rgba(233,201,140,.45);box-shadow:0 4px 16px rgba(0,0,0,.5),0 0 12px rgba(180,120,255,.25)}' +
    'html[data-mdx-theme="night"] #mdx-theme-toggle:hover{border-color:#e8c385;box-shadow:0 0 18px rgba(180,120,255,.45)}' +
    '@media (max-width:520px){#mdx-theme-toggle span{display:none}#mdx-theme-toggle{width:38px;padding:0;justify-content:center}}';

  function mount() {
    if (!document.body || document.getElementById('mdx-theme-toggle')) return;
    var s = document.createElement('style');
    s.id = 'mdx-theme-style';
    s.textContent = STYLE;
    (document.head || root).appendChild(s);
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'mdx-theme-toggle';
    b.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    document.body.appendChild(b);
    label();
  }

  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function rollDice(el) {
    el.setAttribute('data-mdx-rolled', '1');
    var text = el.textContent || '';
    var m = text.match(/(\d+)(?!.*\d)/);
    if (!m) return;
    var v = parseInt(m[1], 10);
    if (v === 20) el.classList.add('mdx-crit');
    if (v === 1) el.classList.add('mdx-fumble');
    if (reduced) return;
    var head = text.slice(0, m.index), tail = text.slice(m.index + m[1].length), n = 0;
    var iv = setInterval(function () {
      n++;
      if (n >= 12 || !el.isConnected) { clearInterval(iv); el.textContent = text; return; }
      el.textContent = head + (1 + Math.floor(Math.random() * 20)) + tail;
    }, 55);
  }
  var pending = false, watching = false;
  function scan() {
    pending = false;
    var list = document.querySelectorAll('.cj-d20:not([data-mdx-rolled])');
    for (var i = 0; i < list.length; i++) rollDice(list[i]);
  }
  function watch() {
    if (watching || !document.body || typeof MutationObserver !== 'function') return;
    watching = true;
    new MutationObserver(function (muts) {
      if (pending) return;
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].addedNodes.length) {
          pending = true;
          setTimeout(scan, 30);
          return;
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
    scan();
  }

  function boot() { mount(); watch(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  // $('body').load() 会整体替换 body 内容，按钮被冲掉时补回
  var tries = 0;
  (function keep() {
    mount();
    if (++tries < 40) setTimeout(keep, 500);
  })();

  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(saved() || 'vellum'); });
  window.__modianTheme = { get: function () { return root.getAttribute('data-mdx-theme'); }, set: set, toggle: toggle, mount: boot, themes: THEMES };
})();
