/* [修改 34] 自定义心界住民：表单 / AI 补全五阶段档案 / 档案编辑 / 写入聊天变量
   - 档案存在聊天变量 mge_custom_resident（酒馆 chat_metadata.variables），卡内世界书「心界住民：自定义」读它按当前阶段排版；
     不进 stat_data，所以不会被 MVU schema 剔掉、不跟重演回滚、也不会在变量注入里重复一遍。
   - 格式由代码锁死：AI 只填 JSON 字段，排版（标题 / 门槛 / 表格 / <心语> 包裹）全在世界书条目里。
   - 不挂 MutationObserver、不开定时器；只在仪典第Ⅱ步和「心界档案」弹窗里工作。
   对外：window.__mdxCustomRes */
(function () {
  'use strict';
  if (window.__mdxCustomRes) return;

  var VAR_KEY = 'mge_custom_resident';
  var VER = 1;
  var CN = ['一', '二', '三', '四', '五'];
  var META = ['好感0~19 · 碎晶0~1 · T1', '好感20~49 · 碎晶2~4 · T2~T3', '好感50~74 · 碎晶5~7 · T4~T5', '好感75~99 · 碎晶8~10 · T6~T7', '好感100 · 碎晶11/11 · T8~T11'];
  var BASE_LIM = { 名字: 12, 种族: 20, 定位: 24, 设定: 80, 外貌: 80, 核心梗: 120, 神职: 20 };
  var TOP_LIM = { 图鉴: 30, 称呼: 8, 语气: 30, 等待: 30, 加护类型: 14, 爱室: 14 };
  var LAW_LIM = { 题: 24, 文: 240, 点名: 14, 点文: 200, 条: 3, 点: 4 };
  var ORI_LIM = { 表面: 180, 外貌: 180, 成神: 200 };
  var SJ_LIM = { 名: 14, 文: 140, 提议引子: 50, 提议: 100 };
  var STAGE_LIM = { 名: 16, 短名: 6, 速览: 22, 外貌: 220, 日常题: 14, 日常: 320, 台词: 110, 加护名: 18, 加护: 160 };
  var STAGE_KEYS = ['名', '短名', '速览', '外貌', '日常题', '日常', '台词', '加护名', '加护'];
  var STAGE_NEED = ['名', '外貌', '日常', '台词', '加护名', '加护'];
  var ROLE_CHIPS = ['专属老师', '心界正妻', '青梅竹马', '专属女仆', '姐姐', '妹妹', '专属骑士', '守护灵', '损友', '小主人'];
  var busyMap = new WeakMap();
  var uiMap = new WeakMap();

  /* ---------- 宿主接口（酒馆助手把函数注入 iframe 全局；取不到再找父页 / TavernHelper） ---------- */
  function host(name) {
    try { if (typeof window[name] === 'function') return window[name]; } catch (e) {}
    try { var th = window.TavernHelper; if (th && typeof th[name] === 'function') return th[name].bind(th); } catch (e) {}
    try { var p = window.parent; if (p && p !== window) { if (typeof p[name] === 'function') return p[name]; if (p.TavernHelper && typeof p.TavernHelper[name] === 'function') return p.TavernHelper[name].bind(p.TavernHelper); } } catch (e) {}
    return null;
  }

  /* ---------- 文本清洗 ---------- */
  var TAG_RE = /<\/?([a-zA-Z][\w-]*)[^>]*>/g;
  function chars(s) { return Array.from(String(s == null ? '' : s)); }
  function cut(s, max) { var a = chars(s); return a.length > max ? a.slice(0, max).join('') : a.join(''); }
  function len(s) { return chars(s).length; }
  function clean(v, max, multi) {
    var s = String(v == null ? '' : v);
    s = s.split('<' + '%').join('').split('%' + '>').join('');
    s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(TAG_RE, '');
    s = s.replace(/\r\n?/g, '\n');
    s = multi ? s.replace(/\n{3,}/g, '\n\n') : s.replace(/\s*\n\s*/g, ' ');
    s = s.replace(/[ \t\u3000]{2,}/g, ' ').trim();
    return max ? cut(s, max) : s;
  }
  function cleanLine(v, max) { return clean(v, max, false).replace(/<\/?心语>/g, ''); }
  /* 正文类字段允许 AI 自己写 <心语>…</心语> 示例，其余标签全剥 */
  function cleanBody(v, max) {
    var s = String(v == null ? '' : v).replace(/<心语>/g, '\u0001').replace(/<\/心语>/g, '\u0002');
    s = clean(s, 0, false).replace(/\u0001/g, '<心语>').replace(/\u0002/g, '</心语>');
    return cut(s, max);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- 数据 ---------- */
  function blank() { return { v: VER, 名字: '', 种族: '', 定位: '', 设定: '', 外貌: '', 核心梗: '', 神职: '', 档案: null }; }
  function isReady(st) { return !!(st && clean(st.名字) && clean(st.种族)); }
  function hasDossier(st) { return !!(st && st.档案 && Array.isArray(st.档案.阶段) && st.档案.阶段.length === 5); }

  function normStage(raw, idx) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var o = {};
    STAGE_KEYS.forEach(function (k) {
      var v = raw[k];
      o[k] = (k === '外貌' || k === '日常' || k === '加护') ? cleanBody(v, STAGE_LIM[k]) : cleanLine(v, STAGE_LIM[k]);
    });
    if (!o.短名 && o.名) o.短名 = cut(o.名.split('·')[0], STAGE_LIM.短名);
    if (!o.日常题) o.日常题 = '日常与反应';
    var miss = STAGE_NEED.filter(function (k) { return !o[k]; });
    return { data: o, missing: miss.map(function (k) { return '阶段' + CN[idx] + '.' + k; }) };
  }

  function normTop(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var o = {}, miss = [];
    Object.keys(TOP_LIM).forEach(function (k) { o[k] = cleanLine(raw[k], TOP_LIM[k]); });
    ['语气', '爱室'].forEach(function (k) { if (!o[k]) miss.push(k); });
    var laws = Array.isArray(raw.铁律) ? raw.铁律 : [];
    o.铁律 = laws.slice(0, LAW_LIM.条).map(function (L) {
      L = L || {};
      var pts = Array.isArray(L.要点) ? L.要点 : [];
      return {
        题: cleanLine(L.题, LAW_LIM.题).replace(/^【|】$/g, ''),
        文: cleanBody(L.文, LAW_LIM.文),
        要点: pts.slice(0, LAW_LIM.点).map(function (p) { p = p || {}; return { 名: cleanLine(p.名, LAW_LIM.点名), 文: cleanBody(p.文, LAW_LIM.点文) }; }).filter(function (p) { return p.名 && p.文; })
      };
    }).filter(function (L) { return L.题 && L.文; });
    if (!o.铁律.length) miss.push('铁律');
    var ll = raw.来历 || {};
    o.来历 = { 表面: cleanBody(ll.表面, ORI_LIM.表面), 外貌: cleanBody(ll.外貌, ORI_LIM.外貌), 成神: cleanBody(ll.成神, ORI_LIM.成神) };
    if (!o.来历.表面) miss.push('来历.表面');
    if (!o.来历.成神) miss.push('来历.成神');
    var sj = raw.碎晶 || {};
    var ways = Array.isArray(sj.途径) ? sj.途径 : [];
    o.碎晶 = {
      途径: ways.slice(0, 2).map(function (w) { w = w || {}; return { 名: cleanLine(w.名, SJ_LIM.名), 文: cleanBody(w.文, SJ_LIM.文) }; }).filter(function (w) { return w.名 && w.文; }),
      提议引子: cleanLine(sj.提议引子, SJ_LIM.提议引子),
      提议: cleanLine(sj.提议, SJ_LIM.提议)
    };
    if (o.碎晶.途径.length < 2) miss.push('碎晶.途径');
    return { data: o, missing: miss };
  }

  /* 导出用：去掉下划线开头的界面状态，字段再洗一遍 */
  function exportable(st) {
    var o = { v: VER };
    Object.keys(BASE_LIM).forEach(function (k) { o[k] = cleanLine(st[k], BASE_LIM[k]); });
    o.设定 = clean(st.设定, BASE_LIM.设定, false);
    if (hasDossier(st)) {
      var t = normTop(st.档案).data;
      t.阶段 = st.档案.阶段.map(function (s, i) { return normStage(s, i).data; });
      o.档案 = t;
    } else o.档案 = null;
    return o;
  }

  /* ---------- 生成 ---------- */
  var EXAMPLE = {
    图鉴: 'NO.106 白蛇（拉米亚属）', 称呼: '夫君', 语气: '端庄温婉中透着咬牙切齿', 等待: '只会端坐煮茶、红着眼眶等你', 加护类型: '被动特权', 爱室: '随身神社水榭',
    铁律: [
      { 题: '生理铁律（NO.106 白蛇）', 文: '天生纯白长直发、雪白肌肤、红宝石眼瞳，上半身为端庄巫女，腰部以下直接连接修长粗壮的纯白蛇身——半人半蛇即为完整本体，严禁写成黑发或长出人类双腿。' },
      { 题: '核心人设：大和抚子 ×「无能的妻子」', 文: '在修成完全实体前，{{user}}在外与其他魔物娘亲密时，她既无法离开心界阻止，又死守正妻的体面，只能含泪强笑地当贤内助。', 要点: [
        { 名: '表腔', 文: '双手交叠、行礼如仪，把「夫君尽兴便好」「妾身绝不善妒」挂在嘴边。' },
        { 名: '里腔', 文: '表面越贤惠，袴下的白蛇尾把地板拍得越碎，括号里的酸水越浓。' },
        { 名: '绝不当场失态', 文: '正典白蛇会给花心的夫君种下「嫉妒之火」，但她舍不得烧疼{{user}}，硬生生把妒火憋回自己肚子里。' }
      ] }
    ],
    来历: { 表面: '侍奉水神的首席白蛇巫女，一睁眼便与{{user}}灵魂共生，自认已是明媒正娶的心界正妻。', 外貌: '', 成神: '她本是古老水脉信仰中陨落的白蛇神。集齐11枚心相碎晶后，她把千百日的「嫉妒之火」淬炼为「家宅神火」，在T8~T11以白蛇真神之姿降临，执掌【家宅、净水与丰饶】。' },
    碎晶: { 途径: [
      { 名: '地域水脉共鸣', 文: '每当{{user}}抵达新的国家/大区域并体验当地风物时，她借整顿心界水脉之名拓印奇景' },
      { 名: '醋海翻腾共鸣', 文: '每当{{user}}经历一场魔物娘修罗场，并在事后回到心界认真哄好吃醋的她时，嫉妒之火淬炼升华' }
    ], 提议引子: '她偶尔会借「想去某地看看净水/神社/茶具」向{{user}}温和提议', 提议: '夫君，听说东瀛的温泉与神社颇有古风……（绝不是想让夫君离城里那帮魅魔远一点！）……若顺路的话，去看看可好？' },
    阶段: [{ 名: '白蛇盘绕·雾中初见', 短名: '白蛇盘绕', 速览: '雾中纯白蛇尾与红瞳，安静守望', 外貌: '心界水边雾气中盘绕着一抹纯白蛇影——只看得清一段覆着月华般白鳞的修长蛇尾，与一双清冷专注的红宝石眼瞳。', 日常题: '日常与反应', 日常: '安静的观察与守望期。她话不多，只要{{user}}露出疲惫便吐出清凉水汽为你安神；若{{user}}跟别的女性靠得太近，心界里的白蛇尾就会冷不丁收紧一寸。', 台词: '……（红瞳静静凝视着贴向{{user}}的魔物娘，蛇尾在水雾里不悦地拍了一下水面）……夫君，外头风凉，莫要离陌生女子太近了。', 加护名: '蛇信感知', 加护: '凭借白蛇对气息与恶意的敏锐直觉，使{{user}}在先手察觉与闪避检定上获得微弱优势（被动常驻）。' }]
  };

  var SCHEMA_DOC = [
    '图鉴：图鉴编号与种族，≤30字（不确定编号就只写种族与属别）',
    '称呼：她对{{user}}的称呼，≤8字',
    '语气：台词语气，≤30字，接在「单条≤60字，」后面读得通',
    '等待：门槛未达标时她的表现，≤30字，接在「未达标时她」后面读得通',
    '加护类型：神契加护的总体方向，≤14字，例「被动特权」「武勇/主动权特权」',
    '爱室：心界爱室的总名，≤14字',
    '铁律：数组，1~3 项，每项 {题≤24字, 文≤240字, 要点?:[{名≤14字, 文≤200字}] 最多4条}。第一项必须是「生理铁律」（种族正典身体构造，写清严禁写错的地方），第二项是「核心人设」机制（她最有戏的反差，用要点拆开）',
    '来历：{表面≤180字, 外貌≤180字（生理铁律已写清外貌时可留空）, 成神≤200字（集齐11枚碎晶、T8~T11 登临什么神座，执掌【……】）}',
    '碎晶：{途径:[恰好2项 {名≤14字, 文≤140字}]（第一项=游历新国度风物，第二项=该住民专属的种族本能互动；文不要写「碎晶+1」，排版会自动补）, 提议引子≤50字, 提议≤100字（一句她的闲聊提议台词）}',
    '阶段：数组，每项 {名：「四字·四字」≤16字, 短名：名的前半≤6字, 速览：表格里的形态一句话≤22字, 外貌：外貌与爱室状态≤220字（必须写爱室装修演变）, 日常题：默认「日常与反应」≤14字, 日常≤320字, 台词≤110字（不带标签）, 加护名≤18字（可用「A & B」两条）, 加护≤160字（写清触发频率）}'
  ].join('\n');

  var SYS = [
    '你是《魔物娘图鉴》（Monster Girl Encyclopedia）世界观的资深角色卡作者，为文字冒险卡「魔物娘图鉴」设计一位「心界住民」——住在{{user}}心界（灵魂内侧）的唯一一位魔物娘伴侣，对除{{user}}外一切存在不可见。',
    '你只输出一个 JSON 对象：不要解释、不要 Markdown 代码块、不要思考过程。',
    '若提示词末尾附有【种族正典】：编号、外貌、生理特征、本能与「禁止」条目一律以正典为准；正典缺失时「图鉴」字段写「未编号·种族名」，严禁编造 NO. 编号。',
    '',
    '【五阶段架构（门槛锁死，不得改动）】',
    '阶段一 好感0~19·碎晶≥0·T1：初醒雾影，只有声音/轮廓与常驻直觉。',
    '阶段二 好感20~49·碎晶≥2·T2：半透明灵体凝形，日常吐槽陪伴。',
    '阶段三 好感50~74·碎晶≥5·T4：半实体化，【初级爱室】成型，可贴身接触与温养。',
    '阶段四 好感75~99·碎晶≥8·T6：爱室常驻实体+现实月下/私密处真身，【高级爱室】扩建，情感与种族本能高发期。',
    '阶段五 好感100·碎晶11/11·T8~T11：完全实体化+登临专属神座，终局级爱室与完满结合。',
    '每一阶段都要写出心界爱室（随身亚空间爱巢）的装修演变；形态只能逐级解锁，前一阶段不能出现后一阶段的外貌与能力。',
    '',
    '【三大系统】',
    '1. 碎晶共11枚，不设强制打卡的任务线索，只通过两条途径自然凝聚：①游历新国度风物；②贴合该住民种族本能的特色互动。每3~5回合至多1枚。原来的线索播报改为符合人设的「日常闲聊提议」。',
    '2. 神契加护贴合魔物娘图鉴无战死的沙盒生态：侧重精力/元精恢复、抗魅了与抢主动权、潜行伪装、寻宝或社交心防破绽；写清「被动常驻 / 一场一次 / 每事件一次 / 长冷却」；不加单纯攻击力数值。阶段五是终局级守护。',
    '3. 深度还原图鉴原典 + 活人感：深挖该种族在《魔物娘图鉴》正典中的核心生理特征（例如半人半蛇、半人马的下半身构造）、魔力性质、求偶逻辑与心理本能，写进行为细节；台词细腻，有实况观察、反差萌或高位宠溺 / 自愿献身的张力。拒绝八股，拒绝「课程记录：」「批注：」这类机械前缀，拒绝 OOC；不要编造{{user}}以外的固定配角。',
    '',
    '【写法】',
    '- 用「她」指代住民，用 {{user}} 指代玩家（原样写 {{user}}）。',
    '- 台词、提议只写台词本身，不要写 <心语> 标签，可以带括号心声；单条最好≤60字。',
    '- 不要写 HTML，不要写模板符号。亲密描写点到为止，具体场面留给正文。',
    '- 玩家填写的设定是最高优先；没填的部分由你按种族正典补全。字数是上限，写满不如写准。',
    '',
    '【JSON 字段】（未注明的都是字符串）',
    SCHEMA_DOC,
    '',
    '【示例】只展示结构与文风（只给了阶段一），禁止照抄内容：',
    JSON.stringify(EXAMPLE)
  ].join('\n');

  /* ---------- [修改 34+] 世界书访问器：dexApi 同款三级帧查找（window/parent/top）+ TavernHelper 兜底 ---------- */
  function apiAll(name) {
    var fr = [window];
    try { if (window.parent && window.parent !== window) fr.push(window.parent); } catch (e) {}
    try { if (window.top && window.top !== window) fr.push(window.top); } catch (e) {}
    for (var i = 0; i < fr.length; i++) { try { if (typeof fr[i][name] === 'function') return fr[i][name].bind(fr[i]); } catch (e) {} }
    try { var th = window.TavernHelper; if (th && typeof th[name] === 'function') return th[name].bind(th); } catch (e) {}
    return null;
  }
  /* [修改 34+] 脚本桥：酒馆助手脚本「心界档案·世界书桥」把 worldbook API 挂到页面全局 __mgeWb，iframe 内跨帧调用 */
  function wbBridge() {
    var fr = [window];
    try { if (window.parent && window.parent !== window) fr.push(window.parent); } catch (e) {}
    try { if (window.top && window.top !== window) fr.push(window.top); } catch (e) {}
    for (var i = 0; i < fr.length; i++) { try { if (fr[i].__mgeWb && fr[i].__mgeWb.get) return fr[i].__mgeWb; } catch (e) {} }
    return null;
  }
  function wbApi(name) {
    var b = wbBridge();
    if (b && typeof b[name] === 'function') return b[name].bind(b);
    return apiAll(name);
  }
  async function wbAllBooks() {
    var out = [];
    var namesFn = wbApi('getCharWorldbookNames'), gw = wbApi('getWorldbook');
    if (namesFn && gw) {
      try {
        var cb = await namesFn('current');
        var names = [];
        if (cb && cb.primary) names.push(cb.primary);
        if (cb && Array.isArray(cb.additional)) names = names.concat(cb.additional);
        for (var i = 0; i < names.length; i++) {
          try { var wb = await gw(names[i]); if (Array.isArray(wb)) out.push({ name: names[i], wb: wb }); } catch (e) {}
        }
      } catch (e) {}
    }
    if (!out.length) {
      var gw2 = wbApi('getWorldbook');
      if (gw2) { try { var w2 = await gw2('魔物娘图鉴世界'); if (Array.isArray(w2)) out.push({ name: '魔物娘图鉴世界', wb: w2 }); } catch (e) {} }
    }
    if (!out.length) throw new Error('读不到任何已绑定世界书（getCharWorldbookNames/getWorldbook 均不可用）');
    return out;
  }

  /* ---------- [修改 34+] 种族正典注入：补全前从已绑定世界书取〈种族核心模板〉喂给提示词 ---------- */
  var canonCache = { race: '', text: null };
  async function raceCanon(st) {
    var race = cleanLine(st.种族, BASE_LIM.种族);
    if (!race || race.length < 2) return '';
    if (canonCache.race === race && canonCache.text !== null) return canonCache.text;
    var text = '';
    try {
      var NO_RE = /^NO\.\d+\s*(.+)$/;
      var books = await wbAllBooks();
      for (var b = 0; b < books.length && !text; b++) {
        var wb = books[b].wb; if (!Array.isArray(wb)) continue;
        var pass1 = null, pass2 = null;
        for (var i = 0; i < wb.length; i++) {
          var e = wb[i]; if (!e || !e.content) continue;
          var cm = String(e.comment || '').trim();
          var m = cm.match(NO_RE);
          if (!pass1 && m && m[1].trim() === race) pass1 = e;   /* 第一轮：编号+种族名精确 */
          if (!pass2 && (e.key || []).indexOf(race) >= 0) pass2 = e;   /* 第二轮：关键字精确 */
        }
        var hit = pass1 || pass2;
        if (hit) text = String(hit.content).replace(/<\/?world_setting>/g, '').trim();
      }
      if (!text) console.info('[修改 34+] 种族正典：「' + race + '」未在已绑定世界书中命中，走未编号即兴分支');
    } catch (e) { console.warn('[修改 34+] 种族正典读取失败：', e); text = ''; }
    if (text.length > 4000) text = text.slice(0, 4000) + '\n……（正典过长已截断，以上仍为权威依据）';
    canonCache.race = race; canonCache.text = text;
    return text;
  }
  function brief(st) {
    var rows = [['名字', st.名字], ['种族', st.种族], ['与{{user}}的关系定位', st.定位], ['设定', st.设定], ['外貌要点', st.外貌], ['核心反差 / 机制', st.核心梗], ['成神后执掌', st.神职]];
    return '玩家填写（空着的交给你）：\n' + rows.map(function (r) { return r[0] + '：' + (clean(r[1]) || '（未填）'); }).join('\n');
  }

  function parseJSON(text) {
    var s = String(text == null ? '' : (typeof text === 'object' && text.content != null ? text.content : text));
    s = s.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '').replace(/```(?:json)?/gi, '');
    var a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b <= a) throw new Error('AI 没有返回 JSON');
    var body = s.slice(a, b + 1);
    try { return JSON.parse(body); } catch (e) {}
    try { return JSON.parse(body.replace(/,\s*([}\]])/g, '$1').replace(/[“”]/g, '"')); } catch (e) {}
    throw new Error('AI 的回复不是完整的 JSON（可能被截断了）');
  }

  async function ask(user, gid) {
    var gr = host('generateRaw');
    if (!gr) throw new Error('找不到酒馆助手的 generateRaw，请确认酒馆助手已启用');
    var last = null;
    for (var t = 0; t < 2; t++) {
      try {
        var out = await gr({ ordered_prompts: [{ role: 'system', content: SYS }, { role: 'user', content: user }], should_silence: true, generation_id: gid });
        return parseJSON(out);
      } catch (e) { last = e; }
    }
    throw last;
  }

  async function generateAll(st, gid, step) {
    var canon = await raceCanon(st);
    var canonBlock = canon
      ? '\n\n【种族正典（卡内图鉴〈种族核心模板〉原文）——编号、外貌、生理特征、本能与「禁止」条目一律以此为准，不得改动、不得另编 NO. 编号】\n' + canon
      : '\n\n【种族正典】卡内未收录该种族：按《魔物娘图鉴》通行设定即兴即可，但「图鉴」字段必须写「未编号·种族名」，严禁编造 NO. 编号。';
    step('正在写总纲与阶段一、二……（1/2）');
    var a = await ask(brief(st) + canonBlock + '\n\n这一次输出全部总纲字段，「阶段」数组只含阶段一、阶段二两项。', gid);
    var top = normTop(a);
    if (top.missing.length) throw new Error('AI 的回复缺少：' + top.missing.join('、'));
    var stages = Array.isArray(a.阶段) ? a.阶段.slice(0, 5) : [];
    if (stages.length < 5) {
      step('正在写阶段三、四、五……（2/2）');
      var draft = Object.assign({}, top.data, { 阶段: stages.slice(0, 2).map(function (s, i) { return normStage(s, i).data; }) });
      var b = await ask(brief(st) + canonBlock + '\n\n下面是已经定稿的总纲与阶段一、二：\n' + JSON.stringify(draft) + '\n\n这一次只输出 {"阶段":[阶段三, 阶段四, 阶段五]}，与前两阶段衔接、逐级递进，外貌与设定必须与正典及前两阶段一致。', gid);
      stages = stages.slice(0, 2).concat(Array.isArray(b.阶段) ? b.阶段.slice(0, 3) : []);
    }
    if (stages.length < 5) throw new Error('AI 只写了 ' + stages.length + ' 个阶段');
    var miss = [], out = [];
    stages.forEach(function (s, i) { var r = normStage(s, i); out.push(r.data); miss = miss.concat(r.missing); });
    if (miss.length) throw new Error('AI 的回复缺少：' + miss.slice(0, 6).join('、'));
    top.data.阶段 = out;
    return top.data;
  }

  async function generateStage(st, n, hint, gid) {
    var cur = exportable(st).档案;
    var obj = await ask(brief(st) + '\n\n下面是这位住民的完整档案：\n' + JSON.stringify(cur) + '\n\n重写阶段' + CN[n] + '（' + META[n] + '），只输出这一阶段的单个对象 {"名":…}，与前后阶段衔接，不要照抄原文。' + (clean(hint) ? '\n玩家的修改要求：' + clean(hint, 120) : ''), gid);
    if (obj && Array.isArray(obj.阶段)) obj = obj.阶段[0];
    var r = normStage(obj, n);
    if (r.missing.length) throw new Error('AI 的回复缺少：' + r.missing.join('、'));
    return r.data;
  }

  /* ---------- 聊天变量 ---------- */
  function readFromChat() {
    var gv = host('getVariables');
    if (!gv) return null;
    try { var v = gv({ type: 'chat' }) || {}; var d = v[VAR_KEY]; if (typeof d === 'string') d = JSON.parse(d); return d && typeof d === 'object' ? d : null; } catch (e) { return null; }
  }
  async function writeChat(fn) {
    var uv = host('updateVariablesWith');
    if (uv) { await uv(function (v) { v = v || {}; fn(v); return v; }, { type: 'chat' }); return; }
    var gv = host('getVariables'), rv = host('replaceVariables');
    if (gv && rv) { var v = gv({ type: 'chat' }) || {}; fn(v); await rv(v, { type: 'chat' }); return; }
    throw new Error('找不到酒馆助手的变量接口');
  }
  async function saveToChat(st) { var d = exportable(st); await writeChat(function (v) { v[VAR_KEY] = d; }); return d; }
  async function clearChat() { await writeChat(function (v) { delete v[VAR_KEY]; }); }

  /* ---------- 开场信笺 / 汇总 ---------- */
  function msgLine(st) {
    var d = exportable(st);
    var parts = ['自定义住民'];
    if (d.定位) parts.push('定位：' + d.定位);
    if (d.设定) parts.push('设定：' + d.设定);
    return '心界住民：' + d.种族 + '·' + d.名字 + '（' + parts.join('；') + '。人设、阶段与碎晶规则严格按「心界住民：自定义」条目执行；变量 心界住民.名字 记为「' + d.名字 + '」，心界住民.种族 记为「' + d.种族 + '」，心界住民.设定 记为「' + (d.设定 || d.定位 || d.种族) + '」）\n';
  }
  function summary(st) {
    if (!isReady(st)) return '自定义（未填写名字或种族）';
    return '自定义 · ' + clean(st.种族) + '·' + clean(st.名字) + (hasDossier(st) ? ' · 五阶段档案已补全' : ' · 档案未补全（游玩中由 AI 即兴）');
  }

  /* ---------- 导入 / 导出 ---------- */
  function exportJSON(st) { return JSON.stringify(Object.assign({ 格式: 'mge-custom-resident' }, exportable(st))); }
  function importJSON(st, text) {
    var o;
    try { o = parseJSON(text); } catch (e) { return { ok: false, msg: '不是有效的档案文本' }; }
    if (!o || !clean(o.名字) || !clean(o.种族)) return { ok: false, msg: '档案里缺少名字或种族' };
    var tmp = blank();
    Object.keys(BASE_LIM).forEach(function (k) { tmp[k] = o[k] || ''; });
    if (o.档案 && Array.isArray(o.档案.阶段) && o.档案.阶段.length === 5) tmp.档案 = o.档案;
    var d = exportable(tmp);
    Object.keys(d).forEach(function (k) { st[k] = d[k]; });
    return { ok: true, msg: '已读取：' + d.种族 + '·' + d.名字 + (d.档案 ? '（含五阶段档案）' : '') };
  }

  /* ---------- 样式（羊皮纸 + 紫曜夜读；只注入一次） ---------- */
  var CSS = [
    '.mcr{margin-top:14px;display:grid;gap:12px}',
    '.mcr-open{margin-left:8px;padding:1px 9px;border:1px solid rgba(138,106,52,.55);border-radius:999px;background:rgba(255,248,230,.6);color:#6b4a22;font-size:12px;letter-spacing:.08em;cursor:pointer;vertical-align:1px}',
    '.mcr-open:hover{background:rgba(201,174,109,.25)}',
    'html[data-mdx-theme="night"] .mcr-open{background:rgba(20,11,34,.5);border-color:rgba(201,174,109,.4);color:#e9d9b0}',
    '.mcr-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px}',
    '.mcr label{display:flex;flex-direction:column;gap:4px;font-size:13px;color:#5a4632}',
    '.mcr .wide{grid-column:1/-1}',
    '.mcr-lab{display:flex;align-items:baseline;gap:6px}',
    '.mcr-lab em{font-style:normal;color:#96372E}',
    '.mcr-cnt{margin-left:auto;font-style:normal;font-size:11px;color:var(--gilt-dim,#8A7040)}',
    '.mcr-cnt.over{color:#96372E}',
    '.mcr input,.mcr textarea{font:inherit;font-size:14px;padding:6px 8px;border:1px solid rgba(169,138,70,.55);border-radius:4px;background:rgba(255,252,242,.7);color:var(--ink,#2C221A);width:100%;box-sizing:border-box}',
    '.mcr input[readonly]{opacity:.7}',
    '.mcr textarea{resize:vertical;min-height:3.2em;line-height:1.55}',
    '.mcr-chips{display:flex;flex-wrap:wrap;gap:6px}',
    '.mcr-chip{border:1px solid rgba(169,138,70,.55);border-radius:999px;padding:1px 10px;font:inherit;font-size:12px;background:none;cursor:pointer;color:inherit}',
    '.mcr-chip.on{background:rgba(150,55,46,.12);border-color:#96372E}',
    '.mcr-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
    '.mcr-btn{border:1px solid rgba(169,138,70,.7);border-radius:4px;padding:5px 14px;background:rgba(255,252,242,.6);cursor:pointer;font:inherit;font-size:13px;color:inherit}',
    '.mcr-btn.hot{background:#96372E;border-color:#96372E;color:#F6F0DE}',
    '.mcr-btn[disabled]{opacity:.5;cursor:default}',
    '.mcr-st{font-size:12.5px;color:var(--gilt-dim,#8A7040)}',
    '.mcr-st.err{color:#96372E}',
    '.mcr-note{font-size:12.5px;color:#6E5E4C;margin:0;line-height:1.6}',
    '.mcr-io{display:grid;gap:6px}',
    '.mcr-io[hidden],.mcr-ed[hidden]{display:none}',
    '.mcr-tabs{display:flex;gap:2px;flex-wrap:wrap;border-bottom:1px solid rgba(169,138,70,.45)}',
    '.mcr-tab{border:none;background:none;padding:4px 10px;cursor:pointer;font:inherit;font-size:13px;color:inherit;border-bottom:2px solid transparent;margin-bottom:-1px}',
    '.mcr-tab.on{border-bottom-color:#96372E;font-weight:600}',
    '.mcr-pane{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;padding-top:8px}',
    '.mcr-law{grid-column:1/-1;border-left:2px solid rgba(169,138,70,.55);padding-left:10px;display:grid;gap:6px}',
    '.mcr-modal{position:fixed;inset:0;z-index:9000;background:rgba(20,12,6,.55);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 12px;box-sizing:border-box}',
    '.mcr-sheet{width:min(760px,100%);background:linear-gradient(168deg,#F3EDDD,#E4D9BF);color:#2C221A;border:1px solid rgba(169,138,70,.6);border-radius:6px;padding:16px 18px;box-shadow:0 12px 40px -12px rgba(0,0,0,.6);box-sizing:border-box}',
    '.mcr-head{display:flex;align-items:center;gap:8px;margin-bottom:6px}',
    '.mcr-head b{font-family:var(--font-serif,"Noto Serif SC","Songti SC",serif);font-size:16px;letter-spacing:.08em;margin-right:auto}',
    '.mcr-foot{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}',
    '@media (max-width:760px){.mcr-grid,.mcr-pane{grid-template-columns:1fr}.mcr-sheet{padding:12px}.mcr-modal{padding:8px}}',
    'html[data-mdx-theme="night"] .mcr label{color:#c9bdd6}',
    'html[data-mdx-theme="night"] .mcr input,html[data-mdx-theme="night"] .mcr textarea{background:rgba(20,11,34,.55);border-color:var(--nt-hair-strong,rgba(233,201,140,.35));color:#f4eee1}',
    'html[data-mdx-theme="night"] .mcr-cnt,html[data-mdx-theme="night"] .mcr-st{color:var(--nt-gilt-dim,#e8c385)}',
    'html[data-mdx-theme="night"] .mcr-cnt.over,html[data-mdx-theme="night"] .mcr-st.err,html[data-mdx-theme="night"] .mcr-lab em{color:#ff8fae}',
    'html[data-mdx-theme="night"] .mcr-note{color:#c9bdd6}',
    'html[data-mdx-theme="night"] .mcr-btn,html[data-mdx-theme="night"] .mcr-chip{background:rgba(20,11,34,.5);border-color:rgba(233,201,140,.45);color:#f4eee1}',
    'html[data-mdx-theme="night"] .mcr-chip.on{background:rgba(154,77,255,.25);border-color:#9a4dff}',
    'html[data-mdx-theme="night"] .mcr-btn.hot{background:#6d2bb8;border-color:#9a4dff;color:#f7ecff}',
    'html[data-mdx-theme="night"] .mcr-tabs{border-bottom-color:rgba(233,201,140,.35)}',
    'html[data-mdx-theme="night"] .mcr-tab.on{border-bottom-color:#ff5e8a}',
    'html[data-mdx-theme="night"] .mcr-law{border-left-color:rgba(233,201,140,.45)}',
    'html[data-mdx-theme="night"] .mcr-sheet{background:linear-gradient(168deg,#211234,#0f0817);color:#f4eee1;border-color:rgba(233,201,140,.45)}'
  ].join('\n');
  function ensureStyle(doc) {
    if (doc.getElementById('mcr-style')) return;
    var s = doc.createElement('style'); s.id = 'mcr-style'; s.textContent = CSS; (doc.head || doc.documentElement).appendChild(s);
  }

  /* ---------- 界面 ---------- */
  function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function setPath(o, p, v) { var ks = p.split('.'), cur = o; for (var i = 0; i < ks.length - 1; i++) { if (cur[ks[i]] == null) cur[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {}; cur = cur[ks[i]]; } cur[ks[ks.length - 1]] = v; }
  function counter(v, max) { var n = len(v); return '<i class="mcr-cnt' + (n > max ? ' over' : '') + '" data-max="' + max + '">' + n + '/' + max + '</i>'; }
  function field(o) {
    /* o: {key|path, label, max, multi, rows, wide, ph, need, ro} */
    var attr = o.key ? 'data-mcr="' + o.key + '"' : 'data-mcr-path="' + o.path + '"';
    var v = o.value == null ? '' : String(o.value);
    var ctl = o.multi
      ? '<textarea ' + attr + ' rows="' + (o.rows || 2) + '" placeholder="' + esc(o.ph || '') + '"' + (o.ro ? ' readonly' : '') + '>' + esc(v) + '</textarea>'
      : '<input ' + attr + ' type="text" value="' + esc(v) + '" placeholder="' + esc(o.ph || '') + '"' + (o.list ? ' list="' + o.list + '"' : '') + (o.ro ? ' readonly' : '') + '>';
    return '<label class="' + (o.wide ? 'wide' : '') + '"><span class="mcr-lab">' + esc(o.label) + (o.need ? '<em>*</em>' : '') + counter(v, o.max) + '</span>' + ctl + (o.extra || '') + '</label>';
  }

  function baseHTML(st, opts, listId) {
    var ro = !!opts.inGame;
    var chips = '<div class="mcr-chips">' + ROLE_CHIPS.map(function (c) { return '<button type="button" class="mcr-chip' + (clean(st.定位) === c ? ' on' : '') + '" data-mcr-chip="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>';
    return '<div class="mcr-grid">' +
      field({ key: '名字', label: '名字', max: BASE_LIM.名字, value: st.名字, need: 1, ph: '例：艾丝缇', ro: ro }) +
      field({ key: '种族', label: '种族', max: BASE_LIM.种族, value: st.种族, need: 1, ph: '图鉴种族，例：半人马', list: listId, ro: ro }) +
      field({ key: '定位', label: '与你的关系定位', max: BASE_LIM.定位, value: st.定位, wide: 1, ph: '她和你是什么关系，可点下面的快捷或自己写', extra: chips }) +
      field({ key: '设定', label: '设定', max: BASE_LIM.设定, value: st.设定, wide: 1, multi: 1, ph: '一两句话：性格、反差、口癖。会写进变量 心界住民.设定，全程常驻' }) +
      field({ key: '外貌', label: '外貌要点（选填）', max: BASE_LIM.外貌, value: st.外貌, wide: 1, ph: '发色、瞳色、衣着……空着就按图鉴正典' }) +
      field({ key: '核心梗', label: '核心反差 / 机制（选填）', max: BASE_LIM.核心梗, value: st.核心梗, wide: 1, multi: 1, ph: '她最有戏的一个点，例：嘴上贤惠心里醋海的「无能的妻子」、拿「神之声」当借口撒娇' }) +
      field({ key: '神职', label: '成神后执掌（选填）', max: BASE_LIM.神职, value: st.神职, ph: '例：家宅、净水与丰饶' }) +
      '</div>';
  }

  function lawHTML(L, i) {
    var pts = (L.要点 || []).map(function (p) { return p.名 + '：' + p.文; }).join('\n');
    return '<div class="mcr-law">' +
      field({ path: '档案.铁律.' + i + '.题', label: '铁律 ' + (i + 1) + ' · 标题', max: LAW_LIM.题, value: L.题 }) +
      field({ path: '档案.铁律.' + i + '.文', label: '正文', max: LAW_LIM.文, value: L.文, multi: 1, rows: 3 }) +
      '<label><span class="mcr-lab">要点（一行一条，「名：内容」，最多 4 条）</span><textarea data-mcr-points="' + i + '" rows="3">' + esc(pts) + '</textarea></label>' +
      '</div>';
  }

  function paneHTML(st, tab) {
    var D = st.档案;
    if (tab === 0) {
      var h = '';
      h += field({ path: '档案.图鉴', label: '图鉴编号与种族', max: TOP_LIM.图鉴, value: D.图鉴 });
      h += field({ path: '档案.称呼', label: '她怎么称呼你', max: TOP_LIM.称呼, value: D.称呼 });
      h += field({ path: '档案.语气', label: '台词语气', max: TOP_LIM.语气, value: D.语气 });
      h += field({ path: '档案.等待', label: '门槛未到时她会', max: TOP_LIM.等待, value: D.等待 });
      h += field({ path: '档案.加护类型', label: '加护类型', max: TOP_LIM.加护类型, value: D.加护类型 });
      h += field({ path: '档案.爱室', label: '爱室名', max: TOP_LIM.爱室, value: D.爱室 });
      (D.铁律 || []).forEach(function (L, i) { h += lawHTML(L, i); });
      h += field({ path: '档案.来历.表面', label: '表面来历', max: ORI_LIM.表面, value: D.来历.表面, multi: 1, wide: 1 });
      h += field({ path: '档案.来历.外貌', label: '心象外貌（可空）', max: ORI_LIM.外貌, value: D.来历.外貌, multi: 1, wide: 1 });
      h += field({ path: '档案.来历.成神', label: '成神真途', max: ORI_LIM.成神, value: D.来历.成神, multi: 1, wide: 1 });
      [0, 1].forEach(function (k) {
        var w = (D.碎晶.途径 || [])[k] || {};
        h += field({ path: '档案.碎晶.途径.' + k + '.名', label: '碎晶途径 ' + (k + 1), max: SJ_LIM.名, value: w.名 });
        h += field({ path: '档案.碎晶.途径.' + k + '.文', label: '说明', max: SJ_LIM.文, value: w.文, multi: 1 });
      });
      h += field({ path: '档案.碎晶.提议引子', label: '闲聊提议·引子', max: SJ_LIM.提议引子, value: D.碎晶.提议引子, wide: 1 });
      h += field({ path: '档案.碎晶.提议', label: '闲聊提议·台词', max: SJ_LIM.提议, value: D.碎晶.提议, multi: 1, wide: 1 });
      return h;
    }
    var n = tab - 1, S = D.阶段[n] || {}, p = '档案.阶段.' + n + '.';
    return '<p class="mcr-note wide">阶段' + CN[n] + '：' + META[n] + '</p>' +
      field({ path: p + '名', label: '阶段名', max: STAGE_LIM.名, value: S.名 }) +
      field({ path: p + '短名', label: '表格短名', max: STAGE_LIM.短名, value: S.短名 }) +
      field({ path: p + '速览', label: '表格里的形态', max: STAGE_LIM.速览, value: S.速览, wide: 1 }) +
      field({ path: p + '外貌', label: '外貌与爱室状态', max: STAGE_LIM.外貌, value: S.外貌, multi: 1, rows: 3, wide: 1 }) +
      field({ path: p + '日常题', label: '日常小标题', max: STAGE_LIM.日常题, value: S.日常题 }) +
      field({ path: p + '加护名', label: '神契加护名', max: STAGE_LIM.加护名, value: S.加护名 }) +
      field({ path: p + '日常', label: '日常与反应', max: STAGE_LIM.日常, value: S.日常, multi: 1, rows: 4, wide: 1 }) +
      field({ path: p + '台词', label: '台词基调参考（不用写 <心语>）', max: STAGE_LIM.台词, value: S.台词, multi: 1, wide: 1 }) +
      field({ path: p + '加护', label: '加护效果', max: STAGE_LIM.加护, value: S.加护, multi: 1, wide: 1 }) +
      '<div class="mcr-bar wide"><input data-mcr-hint type="text" placeholder="想怎么改？可留空，例：更傲娇一点" style="flex:1;min-width:160px"><button type="button" class="mcr-btn" data-mcr-act="regen">只重写这一阶段</button></div>';
  }

  function editorHTML(st) {
    var ui = uiMap.get(st) || { tab: 0 };
    var tabs = ['总纲'].concat(CN.map(function (c) { return '阶段' + c; }));
    return '<div class="mcr-tabs">' + tabs.map(function (t, i) { return '<button type="button" class="mcr-tab' + (ui.tab === i ? ' on' : '') + '" data-tab="' + i + '">' + t + '</button>'; }).join('') + '</div>' +
      '<div class="mcr-pane">' + paneHTML(st, ui.tab) + '</div>';
  }

  function mountForm(container, st, opts) {
    if (!container || !st) return;
    opts = opts || {};
    var doc = container.ownerDocument || document;
    ensureStyle(doc);
    if (!uiMap.has(st)) uiMap.set(st, { tab: 0 });
    var listId = 'mcr-races-' + Math.random().toString(36).slice(2, 8);
    var races = Array.isArray(opts.races) ? opts.races.filter(Boolean) : [];
    var busy = busyMap.get(st);
    var root = doc.createElement('div');
    root.className = 'mcr';
    root.innerHTML =
      (opts.inGame ? '' : '<p class="mcr-note">只有名字和种族必填。点「AI 补全」会按卡里住民的统一格式写出五个阶段，写完可以逐字修改；不补全也能启程，游玩中由 AI 按种族即兴。档案只存在这个聊天里，另存配置可带到下一局。</p>') +
      baseHTML(st, opts, listId) +
      (races.length ? '<datalist id="' + listId + '">' + races.map(function (r) { return '<option value="' + esc(r) + '">'; }).join('') + '</datalist>' : '') +
      '<div class="mcr-bar">' +
        '<button type="button" class="mcr-btn hot" data-mcr-act="gen"' + (busy ? ' disabled' : '') + '>' + (hasDossier(st) ? '整份重写档案' : 'AI 补全五阶段档案') + '</button>' +
        (busy ? '<button type="button" class="mcr-btn" data-mcr-act="stop">停止</button>' : '') +
        '<button type="button" class="mcr-btn" data-mcr-act="io">导入 / 导出</button>' +
        '<span class="mcr-st">' + esc(busy ? busy.msg : (hasDossier(st) ? '档案已补全，可在下面修改' : '')) + '</span>' +
      '</div>' +
      '<div class="mcr-io" hidden><textarea data-mcr-io rows="4" placeholder="粘贴别人分享的档案文本后点「读取」；点「复制」导出当前档案"></textarea><div class="mcr-bar"><button type="button" class="mcr-btn" data-mcr-act="import">读取</button><button type="button" class="mcr-btn" data-mcr-act="copy">复制当前档案</button></div></div>' +
      '<div class="mcr-ed"' + (hasDossier(st) ? '' : ' hidden') + '>' + (hasDossier(st) ? editorHTML(st) : '') + '</div>';
    container.innerHTML = '';
    container.appendChild(root);

    var stEl = root.querySelector('.mcr-st');
    function status(msg, err) { stEl.textContent = msg || ''; stEl.classList.toggle('err', !!err); }
    function changed() { if (typeof opts.onChange === 'function') { try { opts.onChange(st); } catch (e) {} } }
    function rerender() { mountForm(container, st, opts); }
    function bump(el) {
      var c = el.parentNode && el.parentNode.querySelector('.mcr-cnt');
      if (!c) return;
      var max = +c.dataset.max, n = len(el.value);
      c.textContent = n + '/' + max; c.classList.toggle('over', n > max);
    }
    function notify(msg, kind) { if (typeof opts.notify === 'function') { try { opts.notify(msg, kind); } catch (e) {} } }

    root.addEventListener('input', function (ev) {
      var el = ev.target;
      if (el.dataset.mcr) { st[el.dataset.mcr] = el.value; bump(el); changed(); if (el.dataset.mcr === '定位') root.querySelectorAll('.mcr-chip').forEach(function (b) { b.classList.toggle('on', b.dataset.mcrChip === clean(el.value)); }); return; }
      if (el.dataset.mcrPath && st.档案) { setPath(st, el.dataset.mcrPath, el.value); bump(el); changed(); return; }
      if (el.dataset.mcrPoints != null && st.档案) {
        var L = st.档案.铁律[+el.dataset.mcrPoints];
        if (L) L.要点 = el.value.split('\n').map(function (line) { var m = line.match(/^\s*([^：:]{1,14})[：:]\s*(.+)$/); return m ? { 名: m[1].trim(), 文: m[2].trim() } : null; }).filter(Boolean).slice(0, LAW_LIM.点);
        changed();
      }
    });

    root.addEventListener('click', async function (ev) {
      var b = ev.target.closest && ev.target.closest('button');
      if (!b || !root.contains(b)) return;
      if (b.dataset.mcrChip != null) {
        if (opts.inGame) return;
        st.定位 = b.dataset.mcrChip;
        var inp = root.querySelector('[data-mcr="定位"]'); inp.value = st.定位; bump(inp);
        root.querySelectorAll('.mcr-chip').forEach(function (x) { x.classList.toggle('on', x === b); });
        changed(); return;
      }
      if (b.dataset.tab != null) { uiMap.get(st).tab = +b.dataset.tab; root.querySelector('.mcr-ed').innerHTML = editorHTML(st); return; }
      var act = b.dataset.mcrAct;
      if (act === 'io') { var io = root.querySelector('.mcr-io'); io.hidden = !io.hidden; return; }
      if (act === 'copy') {
        var txt = exportJSON(st), ta = root.querySelector('[data-mcr-io]'); ta.value = txt;
        try { await navigator.clipboard.writeText(txt); status('已复制到剪贴板'); } catch (e) { ta.select(); status('已放进上面的框里，请手动复制'); }
        return;
      }
      if (act === 'import') {
        if (opts.inGame) { status('游戏中不能换人，导入请在开局仪典里做', true); return; }
        var r = importJSON(st, root.querySelector('[data-mcr-io]').value);
        if (!r.ok) { status(r.msg, true); return; }
        changed(); rerender(); notify(r.msg, 'gild'); return;
      }
      if (act === 'stop') {
        var bz = busyMap.get(st), stop = host('stopGenerationById');
        if (bz && stop) { try { stop(bz.gid); } catch (e) {} }
        busyMap.delete(st); rerender(); return;
      }
      if (act === 'gen' || act === 'regen') {
        if (busyMap.get(st)) return;
        if (!isReady(st)) { status('先填名字和种族', true); return; }
        if (act === 'gen' && hasDossier(st) && typeof window.confirm === 'function' && !window.confirm('整份重写会覆盖你手改过的内容，继续吗？')) return;
        var gid = 'mcr-' + Date.now().toString(36);
        var job = { gid: gid, msg: act === 'gen' ? '正在写档案……' : '正在重写这一阶段……' };
        busyMap.set(st, job);
        var n = (uiMap.get(st).tab || 1) - 1;
        var hintEl = root.querySelector('[data-mcr-hint]'), hint = hintEl ? hintEl.value : '';
        rerender();
        var cur = function () { return container.querySelector('.mcr-st'); };
        var step = function (m) { job.msg = m; var e = cur(); if (e) e.textContent = m; };
        try {
          if (act === 'gen') { st.档案 = await generateAll(st, gid, step); uiMap.get(st).tab = 0; }
          else { st.档案.阶段[n] = await generateStage(st, n, hint, gid); }
          if (busyMap.get(st) !== job) return; /* 已点停止 */
          busyMap.delete(st); changed(); rerender();
          var e1 = cur(); if (e1) e1.textContent = act === 'gen' ? '档案已补全，可在下面修改' : '阶段' + CN[n] + '已重写';
          notify(act === 'gen' ? '心界住民档案已补全' : '阶段' + CN[n] + '已重写', 'gild');
        } catch (err) {
          if (busyMap.get(st) !== job) return;
          busyMap.delete(st); rerender();
          var e2 = cur(); if (e2) { e2.textContent = (err && err.message ? err.message : String(err)) + '。可以再点一次；若总被截断，把预设的最大回复长度调到 4000 以上'; e2.classList.add('err'); }
        }
      }
    });
    return root;
  }

  /* ---------- 游戏中的「心界档案」弹窗 ---------- */
  function openEditor(opts) {
    opts = opts || {};
    var doc = document;
    ensureStyle(doc);
    var data = readFromChat();
    if (!data || !clean(data.名字)) { if (typeof opts.notify === 'function') opts.notify('这个聊天没有自定义住民', 'warn'); return false; }
    var st = blank(); Object.keys(data).forEach(function (k) { st[k] = data[k]; });
    var old = doc.querySelector('.mcr-modal'); if (old) old.remove();
    var modal = doc.createElement('div');
    modal.className = 'mcr-modal';
    modal.innerHTML = '<div class="mcr-sheet" role="dialog" aria-label="心界档案"><div class="mcr-head"><b>心界档案 · ' + esc(clean(st.种族) + '·' + clean(st.名字)) + '</b><button type="button" class="mcr-btn" data-mcr-close>关闭</button></div>' +
      '<p class="mcr-note">名字和种族开局后不能改（变量里的 心界住民.名字 要和这里一致，世界书才认得她）。其余内容改完点「保存」，下一楼起生效。</p>' +
      '<div data-mcr-host></div><div class="mcr-foot"><span class="mcr-st" data-mcr-save-st></span><button type="button" class="mcr-btn" data-mcr-act="wb"></button><button type="button" class="mcr-btn hot" data-mcr-act="save">保存到本聊天</button></div></div>';
    doc.body.appendChild(modal);
    (function () { var wbb = modal.querySelector('[data-mcr-act="wb"]'); if (!wbb) return; readPin().then(function (pn) { wbb.textContent = (pn && pn !== 'off') ? '撤下世界书条目' : '定格到世界书'; }, function () { wbb.textContent = '定格到世界书'; }); })();
    mountForm(modal.querySelector('[data-mcr-host]'), st, { inGame: true, notify: opts.notify });
    function close() { modal.remove(); doc.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    doc.addEventListener('keydown', onKey);
    modal.addEventListener('click', async function (ev) {
      if (ev.target === modal || (ev.target.closest && ev.target.closest('[data-mcr-close]'))) { close(); return; }
      var wbb = ev.target.closest && ev.target.closest('[data-mcr-act="wb"]');
      if (wbb) {
        var s3 = modal.querySelector('[data-mcr-save-st]');
        if (busyMap.get(st)) { s3.textContent = '等 AI 写完再操作'; return; }
        st.名字 = data.名字; st.种族 = data.种族;
        (async function () {
          try {
            var pn = await readPin();
            if (pn && pn !== 'off') { await unpin(); s3.textContent = '已撤下世界书条目（聊天变量档案保留）'; wbb.textContent = '定格到世界书'; }
            else { var nm = await materialize(st); s3.textContent = '已定格「' + nm + '」，全聊天生效'; wbb.textContent = '撤下世界书条目'; }
            if (typeof opts.notify === 'function') opts.notify(s3.textContent, 'gild');
          } catch (e) { s3.textContent = '操作失败：' + (e && e.message ? e.message : e); s3.classList.add('err'); }
        })();
        return;
      }
      var b = ev.target.closest && ev.target.closest('[data-mcr-act="save"]');
      if (!b) return;
      var s = modal.querySelector('[data-mcr-save-st]');
      if (busyMap.get(st)) { s.textContent = '等 AI 写完再保存'; return; }
      st.名字 = data.名字; st.种族 = data.种族;
      try { await saveToChat(st);
        var pn = await readPin();
        if (pn && pn !== 'off') { if (pn !== entryNameOf(st)) await removeEntry(pn); await materialize(st); }
        close(); if (typeof opts.notify === 'function') opts.notify('心界档案已保存，下一楼起生效' + (pn && pn !== 'off' ? '（世界书条目已同步）' : ''), 'gild'); }
      catch (e) { s.textContent = '保存失败：' + (e && e.message ? e.message : e); s.classList.add('err'); }
    });
    return true;
  }

  
  /* ---------- [修改 34+] 定格到世界书：档案写成角色世界书条目（照抄「心界住民：自定义」模板+内嵌JSON），跨聊天永久生效 ---------- */
  var PIN_KEY = 'mge_custom_resident_wb';
  function entryNameOf(st) { return '心界住民：自定义·' + cleanLine(st.名字, BASE_LIM.名字); }
  async function readPin() {
    var gv = host('getVariables');
    if (!gv) return '';
    try { var v = gv({ type: 'chat' }) || {}; return String(v[PIN_KEY] || ''); } catch (e) { return ''; }
  }
  async function writePin(v) { await writeChat(function (x) { if (v) x[PIN_KEY] = v; else delete x[PIN_KEY]; }); }
  async function removeEntry(name) {
    var rw = wbApi('replaceWorldbook');
    if (!rw) throw new Error('找不到酒馆助手的 replaceWorldbook（三级帧均未命中）');
    var books = await wbAllBooks();
    var done = '';
    for (var b = 0; b < books.length; b++) {
      var wb = books[b].wb;
      var has = false;
      for (var i = 0; i < wb.length; i++) if ((wb[i].comment || '') === name) { has = true; break; }
      if (!has) continue;
      await rw(books[b].name, wb.filter(function (e) { return (e.comment || '') !== name; }));
      done = books[b].name;
    }
    if (!done) throw new Error('已绑定世界书里没有「' + name + '」条目');
    return done;
  }
  async function buildEntryContent(st) {
    var books = await wbAllBooks();
    var tpl = null, bookName = '';
    for (var b = 0; b < books.length && !tpl; b++) {
      var wb = books[b].wb;
      for (var i = 0; i < wb.length; i++) if ((wb[i].comment || '') === '心界住民：自定义') { tpl = String(wb[i].content || ''); bookName = books[b].name; break; }
    }
    if (!tpl) throw new Error('世界书里没有「心界住民：自定义」模板条目（修改34a），无法定格——请重新导入最新卡恢复该条目');
    var d = JSON.stringify(exportable(st)).replace(/<\//g, '<\\/');
    var i1 = tpl.indexOf('var mcr = null;');
    var cutEnd = "if (!mcr || typeof mcr !== 'object') mcr = {};";
    var i2 = tpl.indexOf(cutEnd);
    var i3 = tpl.indexOf('var mcrOn =');
    if (i1 < 0 || i2 < 0 || i3 < 0 || i2 < i1 || i3 < i2) throw new Error('模板条目结构与 34a 不符，无法定格');
    var gate = 'var mcrOn = !!mcrName && !!mcrRace && (mgeResName === mcrName || mgeResName.indexOf(mcrName) >= 0);';
    return { content: tpl.slice(0, i1) + 'var mcr = ' + d + ';\n' + tpl.slice(i2 + cutEnd.length, i3) + gate + tpl.slice(tpl.indexOf('\n', i3)), bookName: bookName };
  }
  async function materialize(st) {
    if (!hasDossier(st)) throw new Error('还没有完整五阶段档案（先点 AI 补全）');
    var rw = wbApi('replaceWorldbook');
    if (!rw) throw new Error('找不到酒馆助手的 replaceWorldbook（三级帧均未命中）');
    var built = await buildEntryContent(st);
    var name = entryNameOf(st);
    var books = await wbAllBooks();
    var book = books[0];
    for (var b = 0; b < books.length; b++) if (books[b].name === built.bookName) book = books[b];
    var wb = book.wb;
    var hit = null, maxUid = -1;
    for (var i = 0; i < wb.length; i++) {
      if ((wb[i].comment || '') === name) hit = wb[i];
      var u = Number(wb[i].uid); if (Number.isFinite(u) && u > maxUid) maxUid = u;
    }
    if (hit) { hit.content = built.content; hit.enabled = true; hit.constant = true; }
    else wb.push({ uid: maxUid + 1, comment: name, content: built.content, key: [], keysecondary: [], constant: true,
      selective: false, order: 205.9, position: 4, depth: 4, disable: false, addMemo: true,
      excludeRecursion: true, preventRecursion: true, probability: 100, useProbability: true });
    await rw(book.name, wb);
    await writePin(name);
    return name;
  }
  async function unpin() {
    var pn = await readPin();
    if (pn && pn !== 'off') await removeEntry(pn);
    await writePin('off');
  }
window.__mdxCustomRes = {
    VAR_KEY: VAR_KEY, blank: blank, isReady: isReady, hasDossier: hasDossier,
    mountForm: mountForm, openEditor: openEditor,
    saveToChat: saveToChat, clearChat: clearChat, readFromChat: readFromChat,
    msgLine: msgLine, summary: summary, exportJSON: exportJSON, importJSON: importJSON,
    exportable: exportable,
    materialize: materialize, unmaterialize: unpin, pinnedName: readPin,
    isBusy: function (st) { return !!(st && busyMap.get(st)); }
  };
})();
