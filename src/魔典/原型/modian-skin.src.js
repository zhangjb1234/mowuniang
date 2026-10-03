/* ================================================================
   烛光抄本皮肤 v5.0.0 —— 移植自魔典原型（魔典/原型/魔典原型.html）
   令牌与器物质感逐字对齐原型 :root：
     vellum #EAE0C7 / vellum-hi #F6F0DE / vellum-aged #DCCFAF
     ink    #2C221A / ink-soft #4E4032 / ink-faint #6E5E4C
     cinnabar #96372E / cinnabar-hi #B04A3E / cinnabar-deep #6D231C
     gilt   #A98A46 / gilt-hi #C9AE6D / gilt-dim #8A7040
     lapis  #2F4A5E / lapis-hi #43617A / moss #5B6B4C
     leather-0 #4A2E22 / leather-1 #3A231A
   作用：把酒馆内旧版紫晶玻璃态的图鉴墙/种族卡/悬浮球/状态簿，
         整体换为原型的羊皮纸鎏金器物外观。
   挂载：随「导入到酒馆中/魔典-脚本-烛光皮肤.json」注入酒馆，
         在 MGE状态栏 之后运行，只覆盖样式、不改逻辑。
   ================================================================ */
(function (root) {
    'use strict';

    var C = {
        vellum: '#EAE0C7', vellumHi: '#F6F0DE', vellumAged: '#DCCFAF',
        ink: '#2C221A', inkSoft: '#4E4032', inkFaint: '#6E5E4C',
        cinnabar: '#96372E', cinnabarHi: '#B04A3E', cinnabarDeep: '#6D231C',
        gilt: '#A98A46', giltHi: '#C9AE6D', giltDim: '#8A7040',
        lapis: '#2F4A5E', lapisHi: '#43617A',
        moss: '#5B6B4C', mossDeep: '#46543B',
        leather0: '#4A2E22', leather1: '#3A231A'
    };
    var APP_ID = 'nl-mge-statusbar-root';
    var WALL = '#nl-mge-dexwall';
    var RC = '#nl-mge-racecard';
    var STYLE_ID = 'nl-mge-candlelight-skin';

    /* 羊皮纸底：原型 .page / .insert 同源的三层叠加（提亮晕 + 陈纸渐变 + 净羊皮） */
    var paper = 'linear-gradient(rgba(242,237,222,.55),rgba(238,231,211,.62)),' +
        'radial-gradient(120% 90% at 50% 0%,rgba(255,250,238,.5),transparent 60%),' + C.vellum;
    /* 细金线：原型 folio-head/folio-foot 的 1px 暖褐分割 */
    var hair = '1px solid rgba(120,88,40,.32)';
    var gold = '1px solid rgba(140,112,64,.55)';
    /* 卡片内衬：比墙面更亮的净纸，压出层叠感 */
    var card = 'linear-gradient(rgba(250,245,232,.6),rgba(243,236,219,.5))';

    function buildPanel() {
        var s = '';
        s += '#' + APP_ID + '{' +
            'background:' + paper + ';' +
            'border:' + hair + ';border-radius:3px 10px 10px 3px;' +
            'color:' + C.ink + ';' +
            'box-shadow:-10px 12px 30px rgba(41,30,16,.42),inset 0 0 44px rgba(120,96,56,.10);' +
            'font-family:"Noto Serif SC","Songti SC",serif;padding:12px 14px 11px' +
        '}';
        /* 天头金线取代霓虹顶条 */
        s += '#' + APP_ID + '::before{height:1px;border-radius:0;opacity:.85;' +
            'background:linear-gradient(90deg,transparent,' + C.giltHi + ' 22%,' + C.gilt + ' 50%,' + C.giltHi + ' 78%,transparent)}';
        s += '#' + APP_ID + ' .mge-title{color:' + C.ink + ';font-weight:700;font-size:13.5px;' +
            'letter-spacing:.24em;text-indent:.24em;margin-bottom:9px;padding-bottom:7px;border-bottom:' + hair + '}';
        s += '#' + APP_ID + ' .mge-tabs{border-bottom:' + hair + ';gap:0;margin:0 -2px 9px;padding:0}';
        s += '#' + APP_ID + ' .mge-tab{color:' + C.giltDim + ';font-family:"Noto Sans SC",sans-serif;font-weight:600;' +
            'border-radius:0;border-left:1px solid rgba(120,88,40,.22)}';
        s += '#' + APP_ID + ' .mge-tab:first-child{border-left:0}';
        /* 选中签：朱砂渐变 + 米色字，取代玫紫霓虹 */
        s += '#' + APP_ID + ' .mge-tab.on{color:#F6F2E7;border-color:transparent;box-shadow:none;' +
            'background:linear-gradient(180deg,' + C.cinnabarHi + ',' + C.cinnabarDeep + ')}';
        s += '#' + APP_ID + ' .mge-tab:hover{color:' + C.cinnabar + '}';
        s += '#' + APP_ID + ' .mge-tab.on:hover{color:#F6F2E7}';
        s += '#' + APP_ID + ' .mge-tab.empty{opacity:.45}';
        s += '#' + APP_ID + ' .mge-tab:focus-visible{outline:1px solid ' + C.cinnabar + ';outline-offset:-1px}';
        s += '#' + APP_ID + '-content{scrollbar-width:thin;scrollbar-color:' + C.gilt + ' transparent}';
        s += '#' + APP_ID + ' .mge-section{border-bottom:1px solid rgba(120,88,40,.2)}';
        s += '#' + APP_ID + ' .mge-label{color:' + C.lapis + ';font-weight:700;font-size:11px;letter-spacing:.16em}';
        s += '#' + APP_ID + ' .mge-value{color:' + C.inkSoft + '}';
        s += '#' + APP_ID + ' .mge-row{color:' + C.ink + '}';
        s += '#' + APP_ID + ' .mge-bar-wrap{background:rgba(120,88,40,.16);border-radius:2px;height:6px}';
        s += '#' + APP_ID + ' .mge-bar{border-radius:2px}';
        /* 量条：紫玫 → 朱砂 / 鎏金 / 苔绿 / 血红 */
        s += '#' + APP_ID + ' .mge-bar.purple{background:linear-gradient(90deg,' + C.cinnabar + ',' + C.cinnabarHi + ')}';
        s += '#' + APP_ID + ' .mge-bar.gold{background:linear-gradient(90deg,' + C.giltDim + ',' + C.giltHi + ')}';
        s += '#' + APP_ID + ' .mge-bar.green{background:linear-gradient(90deg,' + C.mossDeep + ',' + C.moss + ')}';
        s += '#' + APP_ID + ' .mge-bar.red{background:linear-gradient(90deg,' + C.cinnabarDeep + ',' + C.cinnabarHi + ')}';
        s += '#' + APP_ID + ' .mge-bar.pink{background:linear-gradient(90deg,' + C.giltDim + ',' + C.vellumAged + ')}';
        s += '#' + APP_ID + ' .mge-tag{background:rgba(47,74,94,.10);color:' + C.lapis + ';border-radius:2px;font-weight:700}';
        s += '#' + APP_ID + ' .mge-tag.battle{background:rgba(150,55,46,.14);color:' + C.cinnabarDeep + '}';
        s += '#' + APP_ID + ' .ev-x{background:rgba(120,88,40,.08);border-left:2px solid ' + C.gilt +
            ';border-radius:0 3px 3px 0;color:' + C.inkSoft + '}';
        s += '#' + APP_ID + ' .mge-close{color:' + C.inkFaint + '}';
        s += '#' + APP_ID + ' .mge-close:hover{color:' + C.cinnabar + '}';
        return s;
    }
    function buildWall() {
        var s = '';
        s += WALL + '{background:' + paper + ';border:' + hair + ';border-radius:3px 10px 10px 3px;' +
            'color:' + C.ink + ';box-shadow:-18px 16px 40px rgba(0,0,0,.42),inset 0 0 44px rgba(120,96,56,.10)}';
        /* 墙头 = 原型插页头：朱砂纹章 + 墨色标题 + 鎏金分隔 */
        s += WALL + ' .dw-head{background:transparent;border-bottom:' + hair + ';color:' + C.ink + ';box-shadow:none}';
        s += WALL + ' .dw-title{color:' + C.ink + ';font-weight:700;letter-spacing:.2em}';
        s += WALL + ' .dw-sub{color:' + C.giltDim + ';letter-spacing:.22em}';
        s += WALL + ' .dw-count{color:' + C.giltDim + '}';
        s += WALL + ' .dw-close{color:' + C.inkSoft + ';border:' + hair + ';background:rgba(255,250,238,.5)}';
        s += WALL + ' .dw-close:hover{background:' + C.cinnabar + ';color:#F6F2E7;border-color:' + C.cinnabar + '}';
        /* 页签：鎏金下划，选中转朱砂 */
        s += WALL + ' .dw-tabs{border-bottom:' + hair + ';gap:4px}';
        s += WALL + ' .dw-tab{color:' + C.inkFaint + ';border-radius:0;font-weight:700;letter-spacing:.14em;' +
            'border-bottom:2px solid transparent;background:transparent}';
        s += WALL + ' .dw-tab.on{color:' + C.cinnabar + ';border-bottom-color:' + C.cinnabar +
            ';background:transparent;box-shadow:none}';
        s += WALL + ' .dw-tab:hover{color:' + C.cinnabar + '}';
        s += WALL + ' .dw-card{background:rgba(255,250,238,.42);border:' + hair +
            ';border-radius:3px;box-shadow:0 4px 14px rgba(96,66,28,.12)}';
        s += WALL + ' .dw-cardlabel{color:' + C.cinnabar + ';letter-spacing:.3em;border-bottom:' + hair + ';padding-bottom:6px}';
        s += WALL + ' .dw-empty{color:' + C.inkFaint + ';letter-spacing:.2em}';
        /* 大类标题（类型 → 科属）：青金 + 暖褐细线 */
        s += WALL + ' .dw-region{color:' + C.lapis + ';border-bottom:1px solid rgba(47,74,94,.28)}';
        s += WALL + ' .dw-region-name{color:' + C.lapis + ';font-weight:700;letter-spacing:.16em}';
        s += WALL + ' .dw-region-count{color:' + C.giltDim + '}';
        /* 种族槽：纸签 */
        s += WALL + ' .dw-slot{background:' + card + ';border:' + hair + ';border-radius:3px;color:' + C.inkSoft + '}';
        s += WALL + ' .dw-slot:hover{border-color:' + C.cinnabar + ';box-shadow:0 3px 10px rgba(96,66,28,.18)}';
        s += WALL + ' .dw-slot.peek{border-color:' + C.gilt + '}';
        s += WALL + ' .dw-no{color:' + C.giltDim + ';letter-spacing:.14em}';
        s += WALL + ' .dw-nm{color:' + C.ink + ';font-weight:700}';
        s += WALL + ' .dw-sub{color:' + C.inkFaint + '}';
        s += WALL + ' .dw-tag{background:rgba(47,74,94,.10);color:' + C.lapis + ';border-radius:2px}';
        /* 量条 */
        s += WALL + ' .dw-m{background:rgba(120,88,40,.18);border-radius:2px;height:5px}';
        s += WALL + ' .dw-mf{background:linear-gradient(90deg,' + C.lapis + ',' + C.lapisHi + ');border-radius:2px}';
        s += WALL + ' .dw-mf.blue2{background:linear-gradient(90deg,' + C.lapis + ',' + C.lapisHi + ')}';
        s += WALL + ' .dw-mf.gold2{background:linear-gradient(90deg,' + C.giltDim + ',' + C.giltHi + ')}';
        s += WALL + ' .dw-mf.red2{background:linear-gradient(90deg,' + C.cinnabarDeep + ',' + C.cinnabarHi + ')}';
        s += WALL + ' .dw-mf.pink{background:linear-gradient(90deg,' + C.mossDeep + ',' + C.moss + ')}';
        s += WALL + ' .dw-mf.green2{background:linear-gradient(90deg,' + C.mossDeep + ',' + C.moss + ')}';
        /* 搜索栏 */
        s += WALL + ' .dw-searchbar{background:rgba(255,250,238,.6);border:' + gold + ';border-radius:2px}';
        s += WALL + ' .dw-searchbar input{background:transparent;border:0;color:' + C.ink + ';font-family:inherit}';
        s += WALL + ' .dw-searchbar input::placeholder{color:' + C.giltDim + '}';
        s += WALL + ' .dw-search-icon{color:' + C.giltDim + '}';
        s += WALL + ' .dw-search-count{color:' + C.cinnabar + '}';
        s += WALL + ' .dw-search-clear{color:' + C.inkFaint + '}';
        s += WALL + ' .dw-search-empty{color:' + C.inkFaint + ';letter-spacing:.2em}';
        return s;
    }
    function buildCards() {
        var s = '';
        /* 羁绊档案卡：头像改皮革压印 */
        s += WALL + ' .ab-card{background:rgba(255,250,238,.44);border:' + hair +
            ';border-radius:3px;box-shadow:0 4px 14px rgba(96,66,28,.12)}';
        s += WALL + ' .ab-ava{background:linear-gradient(135deg,' + C.leather0 + ',' + C.leather1 + ');color:' + C.giltHi + ';border-radius:3px}';
        s += WALL + ' .ab-name{color:' + C.ink + ';font-weight:700}';
        s += WALL + ' .ab-meta,' + WALL + ' .as-desc,' + WALL + ' .ab-state{color:' + C.inkFaint + '}';
        s += WALL + ' .ab-more{border:1px dashed rgba(140,112,64,.5);color:' + C.giltDim + ';border-radius:3px;letter-spacing:.2em}';
        s += WALL + ' .ab-more:hover{background:rgba(169,138,70,.10);color:' + C.cinnabar + '}';
        /* 技能 */
        s += WALL + ' .as-row{background:rgba(255,250,238,.4);border:' + hair + ';border-radius:3px;color:' + C.inkSoft + '}';
        s += WALL + ' .as-lv{color:' + C.cinnabar + ';font-weight:700}';
        /* 物品 */
        s += WALL + ' .ai-card{background:rgba(255,250,238,.44);border:' + hair + ';border-radius:3px}';
        s += WALL + ' .ai-top{color:' + C.ink + ';font-weight:700}';
        s += WALL + ' .ai-desc{color:' + C.inkSoft + '}';
        s += WALL + ' .ai-cur{color:' + C.cinnabar + '}';
        /* 任务 */
        s += WALL + ' .aq-row{background:rgba(255,250,238,.4);border:' + hair + ';border-radius:3px;color:' + C.inkSoft + '}';
        s += WALL + ' .aq-main{color:' + C.ink + '}';
        s += WALL + ' .aq-meta,' + WALL + ' .aq-desc{color:' + C.inkFaint + '}';
        /* 事件档案 */
        s += WALL + ' .dw-hrow{background:rgba(255,250,238,.4);border:' + hair + ';border-radius:3px;color:' + C.inkSoft + '}';
        s += WALL + ' .dw-hname{color:' + C.ink + ';font-weight:700}';
        s += WALL + ' .dw-hst{color:' + C.giltDim + '}';
        s += WALL + ' .df-event{background:rgba(255,250,238,.4);border:' + hair + ';border-radius:3px;color:' + C.inkSoft + '}';
        s += WALL + ' .df-head{color:' + C.lapis + ';border-bottom:1px solid rgba(47,74,94,.25)}';
        s += WALL + ' .df-title{color:' + C.ink + ';font-weight:700}';
        s += WALL + ' .df-meta,' + WALL + ' .df-sub{color:' + C.inkFaint + '}';
        s += WALL + ' .df-result{color:' + C.cinnabarDeep + '}';
        /* 总览：环 / 行 / 关系块 */
        s += WALL + ' .ag-ring{background:conic-gradient(' + C.giltHi + ' calc(var(--p)*1%),rgba(120,88,40,.20) 0)}';
        s += WALL + ' .ag-ring::before{background:' + C.vellum + ';border:' + hair + '}';
        s += WALL + ' .ag-ring b{color:' + C.cinnabar + '}';
        s += WALL + ' .ag-ring small{color:' + C.giltDim + '}';
        s += WALL + ' .ag-row{color:' + C.lapis + '}';
        s += WALL + ' .ag-row b{color:' + C.ink + '}';
        s += WALL + ' .ag-line{color:' + C.inkSoft + '}';
        s += WALL + ' .ag-line.dim{color:' + C.inkFaint + '}';
        s += WALL + ' .ar-bar{background:linear-gradient(90deg,' + C.lapis + ',' + C.lapisHi + ')}';
        s += WALL + ' .ar-head{color:' + C.lapis + '}';
        s += WALL + ' .ar-hero{color:' + C.ink + ';font-weight:700}';
        s += WALL + ' .ar-col{color:' + C.inkSoft + '}';
        s += WALL + ' .dg-card{background:rgba(255,250,238,.44);border:' + hair + ';border-radius:3px}';
        s += WALL + ' .dg-title{color:' + C.ink + ';font-weight:700}';
        s += WALL + ' .dg-scene{color:' + C.inkSoft + '}';
        s += WALL + ' .dg-sub{color:' + C.inkFaint + '}';
        s += WALL + ' .dg-issue{color:' + C.cinnabar + '}';
        s += WALL + ' .dg-ok{color:' + C.mossDeep + '}';
        /* 解锁闸 / 追问块 / 折叠钮 */
        s += WALL + ' .dw-lock{background:rgba(120,88,40,.08);border:' + hair + ';color:' + C.inkSoft + '}';
        s += WALL + ' .dw-ask{background:rgba(169,138,70,.10);border:' + hair + ';border-radius:3px;color:' + C.inkSoft + '}';
        s += WALL + ' .dw-ask-t{color:' + C.ink + ';font-weight:700}';
        s += WALL + ' .dw-ask-sub{color:' + C.inkFaint + '}';
        s += WALL + ' .dw-ask-btn{background:linear-gradient(180deg,' + C.cinnabarHi + ',' + C.cinnabarDeep +
            ');color:#F6F2E7;border-radius:2px;font-weight:700;letter-spacing:.14em}';
        s += WALL + ' .dw-ask-btn:hover{filter:brightness(1.08)}';
        s += WALL + ' .dw-hbtn2{background:rgba(47,74,94,.10);color:' + C.lapis + ';border-radius:2px}';
        s += WALL + ' .dw-diag-back{color:' + C.giltDim + '}';
        s += WALL + ' .mge-search-hidden{display:none}';
        return s;
    }
    function buildFurniture() {
        var s = '';
        /* ══ 四、种族卡（nl-mge-racecard） ══ */
        s += RC + '{background:' + paper + ';border:' + hair + ';border-radius:3px 10px 10px 3px;' +
            'color:' + C.ink + ';box-shadow:-14px 14px 34px rgba(0,0,0,.44),inset 0 0 40px rgba(120,96,56,.10)}';
        s += RC + ' .rd-topbar{background:linear-gradient(94deg,rgba(150,55,46,.14),rgba(150,55,46,.05));' +
            'border-bottom:' + hair + '}';
        s += RC + ' .rd-top{background:transparent}';
        s += RC + ' .rc-no{color:' + C.giltDim + ';letter-spacing:.24em}';
        s += RC + ' .rc-nm{color:' + C.ink + ';font-weight:700;letter-spacing:.14em}';
        s += RC + ' .rc-row{color:' + C.inkSoft + '}';
        s += RC + ' .rc-row span{color:' + C.lapis + '}';
        s += RC + ' .rc-img{border:' + gold + ';border-radius:3px}';
        s += RC + ' .rc-imgph{background:rgba(120,88,40,.08);border:1px dashed rgba(140,112,64,.5);border-radius:3px}';
        s += RC + ' .rc-tip{color:' + C.inkFaint + ';border-top:1px dashed rgba(120,88,40,.3)}';
        s += RC + ' .rd-info{background:rgba(255,250,238,.44);border:' + hair + ';border-radius:3px;color:' + C.inkSoft + '}';
        s += RC + ' .rd-sec{background:rgba(255,250,238,.4);border:' + hair + ';border-radius:3px}';
        s += RC + ' .rd-name{color:' + C.ink + ';font-weight:700}';
        s += RC + ' .rd-lore{color:' + C.inkSoft + '}';
        s += RC + ' .rd-row{color:' + C.inkSoft + '}';
        s += RC + ' .rd-no{color:' + C.giltDim + '}';
        s += RC + ' .rd-head{color:' + C.lapis + '}';
        s += RC + ' .rd-back{background:rgba(169,138,70,.12);color:' + C.giltDim + ';border-radius:2px}';
        s += RC + ' .rd-close{color:' + C.inkFaint + '}';
        s += RC + ' .rd-close:hover{color:' + C.cinnabar + '}';

        /* ══ 五、悬浮球与球菜单：皮革 + 烫金（原型封皮质感） ══ */
        var leather = 'radial-gradient(circle at 34% 28%,' + C.leather0 + ' 0%,' + C.leather1 + ' 72%,#241009 100%)';
        s += '#nl-mge-dexball{background:' + leather + ';border:' + gold + ';color:' + C.giltHi + ';' +
            'box-shadow:0 4px 18px rgba(10,5,20,.55),0 0 14px rgba(201,174,109,.32)}';
        s += '#nl-mge-dexball::after{color:' + C.giltHi + ';text-shadow:0 1px 2px rgba(0,0,0,.8)}';
        s += '#nl-mge-dexball.dock-ease{border-color:' + gold + '}';
        /* 呼吸辉光改为鎏金而非玫粉 */
        s += '@keyframes mgeBallPulse{0%,100%{box-shadow:0 4px 18px rgba(10,5,20,.55),0 0 10px rgba(201,174,109,.22)}' +
            '50%{box-shadow:0 4px 18px rgba(10,5,20,.55),0 0 22px rgba(201,174,109,.5)}}';
        s += '#nl-mge-ballmenu .bm-item{background:' + leather + ';border:' + gold + ';color:' + C.giltHi + '}';
        s += '#nl-mge-ballmenu .bm-item:hover{border-color:' + C.giltHi + ';box-shadow:0 0 18px rgba(201,174,109,.5)}';
        s += '#nl-mge-ballmenu .bm-center{background:rgba(58,35,26,.9);border:1px dashed rgba(169,138,70,.5);color:' + C.giltDim + '}';

        /* ══ 六、错误条 ══ */
        s += '#nl-mge-errbar{background:rgba(109,35,28,.92);border:' + gold + ';color:#F0E4DC;border-radius:3px}';
        return s;
    }

    /* ══ 挂载：注入宿主文档，置于旧样式之后（同特异性 → 天然覆盖） ══ */
    function hostDoc() {
        try { if (window.parent && window.parent !== window && window.parent.document) return window.parent.document; } catch (e) {}
        return document;
    }
    function apply() {
        var doc = hostDoc();
        if (!doc || !doc.head) return;
        var old = doc.getElementById(STYLE_ID);
        if (old && old.parentNode) old.parentNode.removeChild(old);
        var st = doc.createElement('style');
        st.id = STYLE_ID;
        st.setAttribute('data-modian', 'candlelight-skin');
        st.textContent = buildPanel() + buildWall() + buildCards() + buildFurniture();
        doc.head.appendChild(st);
    }

    /* MGE状态栏 的 init 延后 1.5s 起，且切卡会重建 UI —— 皮肤须反复自愈。
       轮询检测目标节点在场即刻补挂，节点消失（切卡清理）后待重建再挂。 */
    function watch() {
        var armed = false;
        try {
            if (root.__MODIAN_SKIN_WATCH__) return;
            root.__MODIAN_SKIN_WATCH__ = true;
        } catch (e) {}
        var tick = function () {
            var doc = hostDoc();
            if (!doc) return;
            var has = doc.getElementById('nl-mge-dexball') ||
                doc.getElementById('nl-mge-statusbar-root') ||
                doc.getElementById(APP_ID);
            if (has && !doc.getElementById(STYLE_ID)) apply();
            armed = has;
        };
        tick();
        try {
            var w = root.setInterval ? root : (root.defaultView || root);
            w.setInterval(tick, 700);
            /* 事件驱动补挂：UI 常在消息渲染后才建，事件比轮询更快跟上 */
            if (typeof root.eventOn === 'function' && root.tavern_events) {
                var evs = root.tavern_events;
                ['MESSAGE_RECEIVED', 'MESSAGE_UPDATED', 'CHAT_CHANGED', 'GENERATION_ENDED'].forEach(function (k) {
                    var name = evs[k];
                    if (typeof name === 'string') {
                        try { root.eventOn(name, function () { setTimeout(tick, 120); }); } catch (e2) {}
                    }
                });
            }
        } catch (e3) {}
        /* 换卡/重载兜底：帧回调轮询在页面隐藏切回时补一次 */
        try {
            var self = this;
            var raf = (root.requestAnimationFrame || setTimeout);
            var loop = function () {
                var doc = hostDoc();
                if (doc) {
                    var has = doc.getElementById('nl-mge-dexball') || doc.getElementById(APP_ID);
                    if (has && !doc.getElementById(STYLE_ID)) apply();
                }
                raf(loop, 1200);
            };
            raf(loop, 1200);
        } catch (e4) {}
    }

    watch();
    root.__MODIAN_SKIN_APPLY__ = apply;

})(typeof window !== 'undefined' ? window : this);
