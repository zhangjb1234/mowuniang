/* 魔典-细节 v1 — 放在魔典全部脚本之后。一个 MutationObserver（rAF 合帧），不开轮询。
 * 状态（时段 / 月相 / 魔化度 / 战斗）在 DOM 变化时顺带从 __MODIAN.Stat 读一次；
 * window.__mdxDetail.sim({...}) 可手动覆盖（预览页用）。 */
(function () {
  'use strict';
  if (window.__mdxDetail) return;
  var root = document.documentElement;
  var reduced = false;
  try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var sim = {};
  var theme = function () { return root.getAttribute('data-mdx-theme') || 'vellum'; };
  var off = function (k) { return (' ' + (root.getAttribute('data-mdx-off') || '') + ' ').indexOf(' ' + k + ' ') >= 0; };
  var stat = function (p) { try { return window.__MODIAN.Stat.get(p, null); } catch (e) { return null; } };
  var page = function () { return document.getElementById('page-base'); };

  /* ── 状态联动 ── */
  var MOON = { '新月': [0, 1], '朔': [0, 1], '峨眉': [.2, 1], '蛾眉': [.2, 1], '眉月': [.2, 1], '上弦': [.5, 1], '盈凸': [.78, 1], '满月': [1, 1], '望': [1, 1], '亏凸': [.78, 0], '下弦': [.5, 0], '残月': [.2, 0] };
  function moonSvg(name) {
    var k = .5, wax = 1, s = String(name || '');
    for (var key in MOON) if (s.indexOf(key) >= 0) { k = MOON[key][0]; wax = MOON[key][1]; break; }
    var lit = '';
    if (k >= .99) lit = '<circle cx="8" cy="8" r="7" fill="#f6e3b8"/>';
    else if (k > .01) {
      var rx = (7 * Math.abs(1 - 2 * k)).toFixed(2);
      var outer = wax ? 1 : 0, inner = (k < .5) === !!wax ? 0 : 1;
      lit = '<path d="M8 1A7 7 0 0 ' + outer + ' 8 15A' + rx + ' 7 0 0 ' + inner + ' 8 1Z" fill="#f6e3b8"/>';
    }
    return '<svg viewBox="0 0 16 16" aria-label="月相 · ' + (s || '上弦') + '"><circle cx="8" cy="8" r="7" fill="#1d1133" stroke="rgba(232,195,133,.55)" stroke-width=".8"/>' + lit + '</svg>';
  }
  var lastMoon = '';
  function syncState() {
    var t = sim.time != null ? sim.time : (stat('世界.时段') || '白昼');
    root.setAttribute('data-mdx-time', /夜|子时|丑时/.test(t) ? 'night' : /黄昏|傍晚|暮|日落|薄暮/.test(t) ? 'dusk' : 'day');
    var c = sim.corrupt != null ? sim.corrupt : Number(stat('主角.魔化度')) || 0;
    root.style.setProperty('--mdx-corrupt', Math.max(0, Math.min(1, c / 100)).toFixed(2));
    var b = sim.battle != null ? sim.battle : (function (s) { return !!s && s !== '空闲'; })(stat('战斗.状态'));
    root.setAttribute('data-mdx-battle', b ? '1' : '0');
    var m = sim.moon != null ? sim.moon : (stat('世界.月相') || '上弦');
    var head = document.querySelector('#page-base .folio-head');
    if (head && (!head.querySelector('.mdx-moon') || m !== lastMoon)) {
      var el = head.querySelector('.mdx-moon');
      if (!el) { el = document.createElement('span'); el.className = 'mdx-moon'; head.appendChild(el); }
      el.innerHTML = moonSvg(m); lastMoon = m;
    }
  }

  /* ── 书页叠层 / 卷角 ── */
  function ensurePage() {
    var p = page();
    if (!p) return;
    if (!p.querySelector(':scope > .mdx-fx')) { var fx = document.createElement('div'); fx.className = 'mdx-fx'; p.insertBefore(fx, p.firstChild); }
    if (!p.querySelector(':scope > .mdx-curl')) { var c = document.createElement('span'); c.className = 'mdx-curl'; c.title = '翻至下一页'; p.appendChild(c); }
  }

  /* ── 墨渗：showFloor 带翻页动画时（enter-r / enter-l）触发；静默重渲不触发 ── */
  var inkTimer = 0;
  function ink() {
    var p = page();
    if (!p || reduced) return;
    p.classList.remove('mdx-ink'); void p.offsetWidth; p.classList.add('mdx-ink');
    clearTimeout(inkTimer); inkTimer = setTimeout(function () { p.classList.remove('mdx-ink'); }, 2000);
  }

  /* ── d20 大成功 / 大失败 ── */
  function burst(el, kind) {
    if (reduced || off('crit')) return;
    var b = document.createElement('span');
    b.className = 'mdx-burst ' + kind;
    el.appendChild(b);
    setTimeout(function () { b.remove(); }, 1400);
  }
  function scanDice() {
    var list = document.querySelectorAll('.cj-d20.mdx-crit:not([data-mdx-burst]),.cj-d20.mdx-fumble:not([data-mdx-burst])');
    for (var i = 0; i < list.length; i++) {
      (function (el) { el.setAttribute('data-mdx-burst', '1'); setTimeout(function () { burst(el, el.classList.contains('mdx-crit') ? 'crit' : 'fumble'); }, 720); })(list[i]);
    }
  }
  function rollTo(v) {
    var el = document.querySelector('#page-base .cj-d20');
    if (!el) return false;
    el.classList.remove('mdx-crit', 'mdx-fumble'); el.removeAttribute('data-mdx-burst');
    var final = 'd20 · ' + v, n = 0;
    var iv = setInterval(function () {
      if (++n >= 12 || reduced) {
        clearInterval(iv); el.textContent = final;
        if (v === 20) el.classList.add('mdx-crit'); if (v === 1) el.classList.add('mdx-fumble');
        el.setAttribute('data-mdx-burst', '1'); burst(el, v === 20 ? 'crit' : 'fumble');
        return;
      }
      el.textContent = 'd20 · ' + (1 + Math.floor(Math.random() * 20));
    }, 55);
    return true;
  }

  /* ── 观察：一个 body 观察者 + 一个书页 class 观察者 ── */
  var queued = false;
  function tick() { queued = false; ensurePage(); syncState(); scanDice(); }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(tick); } }
  function boot() {
    if (!document.body) return;
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var t = muts[i].target;
        if (t.classList && (t.classList.contains('mdx-fx') || t.classList.contains('mdx-moon') || t.classList.contains('mdx-burst'))) continue;
        schedule(); return;
      }
    }).observe(document.body, { childList: true, subtree: true });
    var p = page();
    if (p) new MutationObserver(function () {
      if ((p.classList.contains('enter-r') || p.classList.contains('enter-l')) && !p.classList.contains('mdx-ink')) ink();
    }).observe(p, { attributes: true, attributeFilter: ['class'] });
    schedule();
  }

  /* ── 点击：盖章（羊皮纸）/ 涟漪（夜读）/ 卷角 / 主题切换 ── */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var tg = t.closest('#mdx-theme-toggle');
    if (tg) { e.stopImmediatePropagation(); e.preventDefault(); switchTo(theme() === 'night' ? 'vellum' : 'night', tg); return; }
    if (t.closest('.mdx-curl')) { var nx = document.querySelector('#page-base .ff-next:not(:disabled)'); if (nx) nx.click(); return; }
    var slip = t.closest('.choice-slip,.cm-act');
    if (!slip || slip.hasAttribute('data-mdx-pass') || theme() !== 'vellum' || off('seal') || reduced) return;
    e.stopImmediatePropagation(); e.preventDefault();
    var old = document.querySelectorAll('#page-base .mdx-seal');
    for (var i = 0; i < old.length; i++) old[i].remove();
    var r = slip.getBoundingClientRect(), s = document.createElement('span');
    s.className = 'mdx-seal';
    s.style.left = (r.width ? (e.clientX - r.left) / r.width * 100 : 50) + '%';
    s.style.top = (r.height ? (e.clientY - r.top) / r.height * 100 : 50) + '%';
    if (getComputedStyle(slip).position === 'static') slip.style.position = 'relative';
    slip.appendChild(s);
    setTimeout(function () { slip.setAttribute('data-mdx-pass', ''); slip.click(); slip.removeAttribute('data-mdx-pass'); }, 420);
  }, true);

  var ripples = 0;
  document.addEventListener('pointerdown', function (e) {
    if (theme() !== 'night' || off('ripple') || reduced || ripples >= 3) return;
    var r = document.createElement('span');
    r.className = 'mdx-ripple'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
    ripples++; document.body.appendChild(r);
    setTimeout(function () { r.remove(); ripples--; }, 720);
  }, { passive: true });

  function switchTo(next, origin) {
    var T = window.__modianTheme;
    if (!T || next === theme()) return;
    if (reduced || off('switch') || typeof document.startViewTransition !== 'function') {
      root.classList.add('mdx-fade'); T.set(next);
      setTimeout(function () { root.classList.remove('mdx-fade'); }, 550);
      return;
    }
    var r = origin && origin.getBoundingClientRect ? origin.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    root.style.setProperty('--mdx-vx', (r.left + r.width / 2) + 'px');
    root.style.setProperty('--mdx-vy', (r.top + r.height / 2) + 'px');
    root.classList.add('mdx-vt-' + next);
    var vt = document.startViewTransition(function () { T.set(next); });
    vt.finished.then(done, done);
    function done() { root.classList.remove('mdx-vt-' + next); }
  }

  window.__mdxDetail = {
    sim: function (o) { for (var k in o) sim[k] = o[k]; syncState(); },
    ink: ink, rollTo: rollTo, switchTo: switchTo,
    setOff: function (list) { root.setAttribute('data-mdx-off', list.join(' ')); },
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
