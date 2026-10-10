/* 魔典-性能补丁 v1
 * 放在魔典内核 <script> 之前执行（dist 里插在 content-data.js 之前，或直接内联进「魔典-界面」正则）。
 * ① 长周期轮询（≥1s 的 setInterval）只在「当前那一本」里跑：最新 AI 楼层或伪全屏中，且 iframe 可见、标签页在前台。
 * ② parseFloor 按楼层原文缓存，楼层事件时只解析新增/改动的楼。
 * ③ iframe 滚出视口或标签页转入后台时暂停 CSS 动画；系统「减少动态效果」时循环动画只播一次。
 */
(function () {
  'use strict';
  if (window.__modianPerf) return;
  var perf = window.__modianPerf = { version: 1, parseHits: 0, parseMisses: 0, skippedTicks: 0, parseCacheInstalled: false };
  var visible = true;

  function frameEl() {
    try { return window.frameElement; } catch (e) { return null; }
  }

  function isPrimaryFrame() {
    if (window.__modianFullscreen === true) return true;
    var fe = frameEl();
    var mes = fe && fe.closest ? fe.closest('.mes[mesid]') : null;
    if (!mes || !mes.parentElement) return true;
    for (var el = mes.parentElement.lastElementChild; el; el = el.previousElementSibling) {
      if (!el.classList || !el.classList.contains('mes')) continue;
      if (el.getAttribute('is_user') === 'true' || el.getAttribute('is_system') === 'true') continue;
      return el === mes;
    }
    return true;
  }
  perf.isPrimaryFrame = isPrimaryFrame;

  var nativeSetInterval = window.setInterval;
  window.setInterval = function (fn, ms) {
    if (typeof fn !== 'function' || !(Number(ms) >= 1000)) return nativeSetInterval.apply(window, arguments);
    var extra = Array.prototype.slice.call(arguments, 2);
    return nativeSetInterval.call(window, function () {
      if (document.hidden || !visible || !isPrimaryFrame()) { perf.skippedTicks++; return; }
      return fn.apply(this, extra);
    }, ms);
  };

  var STYLE_ID = 'modian-perf-style';
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      'html.modian-idle *,html.modian-idle *::before,html.modian-idle *::after{animation-play-state:paused!important}' +
      '@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-iteration-count:1!important}}';
    (document.head || document.documentElement).appendChild(s);
  }
  function syncIdle() {
    document.documentElement.classList.toggle('modian-idle', document.hidden || !visible);
  }
  ensureStyle();
  document.addEventListener('visibilitychange', syncIdle);
  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver(function (entries) {
      visible = entries[entries.length - 1].isIntersecting;
      syncIdle();
    }).observe(document.documentElement);
  }

  var clone = typeof structuredClone === 'function'
    ? function (v) { return structuredClone(v); }
    : function (v) { return JSON.parse(JSON.stringify(v)); };

  perf.installParseCache = function () {
    if (perf.parseCacheInstalled) return true;
    if (typeof window.parseFloor !== 'function') return false;
    var original = window.parseFloor;
    var cache = new Map();
    var MAX = 400;
    window.parseFloor = function (raw) {
      var key = typeof raw === 'string' ? raw : String(raw == null ? '' : raw);
      if (cache.has(key)) {
        var hit = cache.get(key);
        cache.delete(key);
        cache.set(key, hit);
        perf.parseHits++;
        return clone(hit);
      }
      var result = original.apply(this, arguments);
      perf.parseMisses++;
      try {
        cache.set(key, clone(result));
        if (cache.size > MAX) cache.delete(cache.keys().next().value);
      } catch (e) {}
      return result;
    };
    perf.parseCacheInstalled = true;
    ensureStyle();
    return true;
  };

  var tries = 0;
  (function retry() {
    if (perf.installParseCache() || ++tries > 40) return;
    setTimeout(retry, 250);
  })();
})();
