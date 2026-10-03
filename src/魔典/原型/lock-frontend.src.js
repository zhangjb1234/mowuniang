/**
 * 魔典-锁定前端 — 独立脚本（照幻璃镜-锁定前端同构实现，modian 前缀）
 *
 * 策略：向酒馆父页面注入 <script>，在父页面的 JS 引擎里直接
 * 拦截 HTMLIFrameElement.prototype.remove 和 Node.prototype.removeChild。
 * 碰到锁定楼层的 iframe 时跳过删除，从源头阻止酒馆销毁它。
 *
 * 触发：两条腿走路（缺一不可）：
 *   ① 父页 fullscreenchange——原生全屏时锁之（幻璃镜同款，正常路径）
 *   ② 父页轮询扫 __modianFullscreen 标志——魔典主用「伪全屏」，其
 *      requestFullscreen() 常因 iframe 缺 allowfullscreen 而静默失败，
 *      此时不触发 ①，锁根本没上 —— 这是旧楼层仍被销毁的根因。
 *
 * 与魔典原型内伪全屏模块的分工：前端只负责视觉（藏楼 + .mes 顶满视口），
 * 保命归本脚本（父页三路原型拦截），两者经 __modianFullscreen 标志解耦。
 */

$(() => {
  const STYLE_ID = 'modian-lock-floor-style';
  const PROTECT_SCRIPT_ID = 'modian-lock-protect-script';
  const parentDoc = window.parent.document;
  const parentWin = window.parent;

  let lockedFloorId = null;
  let hideObserver = null;
  let pollTimer = null;

  // ═══════════════════════════════════════════
  // CSS 隐藏其他楼层（视觉清爽）
  // ═══════════════════════════════════════════

  function updateHideStyle(keepFloorId) {
    parentDoc.getElementById(STYLE_ID)?.remove();
    if (keepFloorId === null) return;

    const style = parentDoc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `.mes:not([mesid="${keepFloorId}"]) { display: none !important; }`;
    parentDoc.head.appendChild(style);
  }

  // ═══════════════════════════════════════════
  // 核心：向父页面注入脚本，拦截 iframe 删除
  // ═══════════════════════════════════════════

  function injectProtection(floorId) {
    // 先清除旧注入
    removeProtection();

    const script = parentDoc.createElement('script');
    script.id = PROTECT_SCRIPT_ID;
    script.textContent = `
      (function() {
        if (window.__modianLockCleanup) {
          window.__modianLockCleanup();
        }

        var LOCKED_FLOOR_ID = ${floorId};

        // ── 拦截 HTMLIFrameElement.prototype.remove ──
        var _origIframeRemove = HTMLIFrameElement.prototype.remove;
        HTMLIFrameElement.prototype.remove = function() {
          var mesEl = this.closest('[mesid]');
          if (mesEl && parseInt(mesEl.getAttribute('mesid'), 10) === LOCKED_FLOOR_ID) {
            console.warn('[魔典·锁定前端·父页面] 拦截 remove()，保护楼层 #' + LOCKED_FLOOR_ID);
            return;
          }
          return _origIframeRemove.call(this);
        };

        // ── 拦截 Node.prototype.removeChild ──
        var _origRemoveChild = Node.prototype.removeChild;
        Node.prototype.removeChild = function(child) {
          if (child instanceof HTMLIFrameElement) {
            var mesEl = child.closest('[mesid]');
            if (mesEl && parseInt(mesEl.getAttribute('mesid'), 10) === LOCKED_FLOOR_ID) {
              console.warn('[魔典·锁定前端·父页面] 拦截 removeChild()，保护楼层 #' + LOCKED_FLOOR_ID);
              return child;
            }
          }
          // 也检查被移除的节点内部是否包含要保护的 iframe
          if (child && child.querySelectorAll) {
            var protectedIframes = child.querySelectorAll('.mes[mesid="' + LOCKED_FLOOR_ID + '"] iframe');
            if (protectedIframes.length > 0) {
              console.warn('[魔典·锁定前端·父页面] 拦截 removeChild()（嵌套），保护楼层 #' + LOCKED_FLOOR_ID);
              return child;
            }
          }
          return _origRemoveChild.call(this, child);
        };

        // ── 拦截 jQuery.fn.remove（酒馆大量使用 jQuery） ──
        if (window.$ && window.$.fn) {
          var _origJqRemove = window.$.fn.remove;
          window.$.fn.remove = function() {
            var self = this;
            for (var i = 0; i < self.length; i++) {
              var el = self[i];
              if (el instanceof HTMLIFrameElement) {
                var mesEl = el.closest('[mesid]');
                if (mesEl && parseInt(mesEl.getAttribute('mesid'), 10) === LOCKED_FLOOR_ID) {
                  console.warn('[魔典·锁定前端·父页面] 拦截 jQuery.remove()，保护楼层 #' + LOCKED_FLOOR_ID);
                  // 把受保护的 iframe 从 jQuery 集合里排除
                  self.splice(i, 1);
                  i--;
                }
              }
            }
            // 对剩余的调用原始 remove
            if (self.length > 0) {
              return _origJqRemove.call(self);
            }
            return self;
          };
        }

        // ── 存储清理函数 ──
        window.__modianLockCleanup = function() {
          HTMLIFrameElement.prototype.remove = _origIframeRemove;
          Node.prototype.removeChild = _origRemoveChild;
          if (window.$ && window.$.fn && _origJqRemove) {
            window.$.fn.remove = _origJqRemove;
          }
          delete window.__modianLockCleanup;
          console.info('[魔典·锁定前端·父页面] 保护已解除');
        };

        console.info('[魔典·锁定前端·父页面] 已激活对楼层 #' + LOCKED_FLOOR_ID + ' 的 iframe 保护');
      })();
    `;

    parentDoc.head.appendChild(script);
    console.info(`[魔典·锁定前端] 已向父页面注入保护脚本，锁定楼层 #${floorId}`);
  }

  function removeProtection() {
    // 调用父页面中的清理函数
    if (parentWin.__modianLockCleanup) {
      try {
        parentWin.__modianLockCleanup();
      } catch (e) {
        console.warn('[魔典·锁定前端] 清理父页面保护时出错', e);
      }
    }
    parentDoc.getElementById(PROTECT_SCRIPT_ID)?.remove();
  }

  // ═══════════════════════════════════════════
  // 综合锁定 / 解锁
  // ═══════════════════════════════════════════

  function lockFloor(floorId) {
    if (lockedFloorId === floorId) return;
    if (lockedFloorId !== null) unlockFloor();

    lockedFloorId = floorId;
    updateHideStyle(floorId);       // CSS 隐藏
    injectProtection(floorId);      // 注入拦截脚本

    console.info(`[魔典·锁定前端] === 楼层 #${floorId} 已锁定 ===`);
  }

  function unlockFloor() {
    const wasLocked = lockedFloorId;
    removeProtection();             // 清除注入脚本
    updateHideStyle(null);          // 清除 CSS
    lockedFloorId = null;

    if (wasLocked !== null) {
      console.info(`[魔典·锁定前端] === 楼层 #${wasLocked} 已解锁 ===`);
    }
  }

  // ═══════════════════════════════════════════
  // 全屏事件监听
  // ═══════════════════════════════════════════

  function getFloorIdFromFullscreenElement(el) {
    const mesEl = el.closest('[mesid]');
    if (!mesEl) return null;
    const id = parseInt(mesEl.getAttribute('mesid'), 10);
    return isNaN(id) ? null : id;
  }

  $(parentDoc).on('fullscreenchange', () => {
    const fsEl = parentDoc.fullscreenElement;
    if (!fsEl) { syncFromPseudo(); return; }

    const floorId = getFloorIdFromFullscreenElement(fsEl);
    if (floorId !== null) lockFloor(floorId);
  });

  // 脚本后加载时，如果已经全屏了也处理
  const currentFs = parentDoc.fullscreenElement;
  if (currentFs) {
    const floorId = getFloorIdFromFullscreenElement(currentFs);
    if (floorId !== null) lockFloor(floorId);
  }

  // ── ② 伪全屏兜底：扫 __modianFullscreen 标志 ──
  // 魔典前端主用伪全屏（藏楼 + .mes 顶满视口），原生 requestFullscreen()
  // 常因 iframe 缺 allowfullscreen 而静默失败 → 父页 fullscreenchange 不触发
  // → 旧实现锁永远上不了 → 新楼层一来旧 iframe 被 destroy。
  // 这里从父页遍历各楼层 iframe，读其 contentWindow 上的标志，锁定对应楼层。
  function findPseudoFullscreenFloorId() {
    const frames = parentDoc.querySelectorAll('#chat .mes iframe');
    for (const f of frames) {
      try {
        if (f.contentWindow && f.contentWindow.__modianFullscreen === true) {
          const mesEl = f.closest('.mes');
          const id = mesEl ? parseInt(mesEl.getAttribute('mesid'), 10) : NaN;
          if (!isNaN(id)) return id;
        }
      } catch (e) {
        // 跨域/尚未加载完成，跳过
      }
    }
    return null;
  }

  function syncFromPseudo() {
    const id = findPseudoFullscreenFloorId();
    if (id !== null) {
      lockFloor(id);
    } else if (!parentDoc.fullscreenElement) {
      // 伪全屏退了且不在原生全屏 → 才解锁（原生全屏时保持锁定）
      unlockFloor();
    }
  }

  // 轮询：伪全屏标志在 iframe 内，父页收不到事件，只能扫。
  // 250ms 足够跟手，又不至于压垮父页主线程。
  pollTimer = setInterval(syncFromPseudo, 250);

  // 首扫一次（脚本后加载时可能已在伪全屏中）
  syncFromPseudo();

  // ═══════════════════════════════════════════
  // 新楼层自动隐藏
  // ═══════════════════════════════════════════

  const chatContainer = parentDoc.getElementById('chat') || parentDoc.body;
  hideObserver = new MutationObserver((mutations) => {
    if (lockedFloorId === null) return;
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (
          node instanceof HTMLElement &&
          node.matches(`.mes:not([mesid="${lockedFloorId}"])`)
        ) {
          node.style.display = 'none';
        }
      }
    }
  });
  hideObserver.observe(chatContainer, { childList: true, subtree: true });

  // ═══════════════════════════════════════════
  // 清理
  // ═══════════════════════════════════════════

  $(window).on('pagehide', () => {
    unlockFloor();
    hideObserver?.disconnect();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
    console.info('[魔典·锁定前端] 脚本已卸载');
  });

  console.info('[魔典·锁定前端] 脚本已启动（CSS隐藏 + 父页面原型拦截 + 伪全屏兜底轮询）');
});
