/* ================================================================
   启封仪典 · 开局向导 v2（满血移植自卡内欢迎页面；视觉沿用魔典书皮）
   对照原则：功能口径逐字对齐 welcome.html；buildMsg 逐行对齐原文 buildMsg()。
   数据：window.MODIAN_RITUAL（提取自动本息） + 本文件末尾的种族分类/基调指令。
   ================================================================ */
(function(){
'use strict';
const RT = window.MODIAN_RITUAL || {stepLabels:['塑造此身','心界住民','宿命羁绊','开局地点','启程']};
const noEmoji = s => String(s||'').replace(/[⭐🎭🔥🎲✎️←-⇿⌀-➿⬀-⯿️]|[\u{1F000}-\u{1FAFF}]|[⚀-⚿⛀-⛿]/gu,'').replace(/\s+/g,' ').trim();

/* ---- 开局种族数据（正典三层：28 大类 / 77 科属 / 237 种族，源=卡内世界书「速览：魔物娘种族总览」#250） ---- */
const RACE_CATS = [
  {"cat":"植物型","items":["阿娜温","玛坦戈","树妖","曼德拉草","凯斯柏莎","触手","莉莉娜温","绵羊草","浮游海带","蕈人","食人草（挟叶种）","食人草（袋叶种）"]},
  {"cat":"半液体生物型","alts":"半液状生物型","items":["史莱姆","红色史莱姆","海生史莱姆","湿地史莱姆","史莱姆女王","黑暗史莱姆","濡女子","寄生史莱姆&史莱姆宿主","修格斯","矮蛋","太岁"]},
  {"cat":"魔法物质型","alts":"魔法物质类型","items":["魔像","石像鬼","妖怪灯笼","活人偶","熔岩魔像","唐伞妖怪","活铠甲","诅咒之剑","一反木棉","自动人形","烛灵"]},
  {"cat":"昆虫型","items":["大蚂蚁","魔虫","蜜蜂","大黄蜂","别西卜","阿拉克尼","女郎蜘蛛","蚂蚁阿拉克尼","蝎子人","螳螂","牛鬼","大百足","凯布利","沙虫","蛾人","士兵甲虫","吸血鬼蚊","阿特拉克·纳克亚","青虫","花蝶","幻虫","亚巴顿","亚巴顿群众"]},
  {"cat":"爬虫类型","alts":"爬虫型","items":["拉米亚","美杜莎","蜥蜴人","厄喀德娜","龙","沙罗曼蛇","白蛇","龍","双足飞龙","亚龙","阿波菲斯","炸脖龙","毒蜥","本耶普","邪龙","龙人"]},
  {"cat":"鸟人型","items":["哈比","黑色哈比","鸡蛇兽","乌鸦天狗","塞壬","雷鸟","乾闼婆","揪拨揪拨鸟","鸮魔法师","不死鸟"]},
  {"cat":"妖精型","items":["小妖精","小仙女","凉南希","泰坦妮亚"]},
  {"cat":"不死型","items":["丧尸","杜拉罕","木乃伊","骷髅","幽灵","吸血鬼","食尸鬼","重身幽灵","法老","巫妖","尸妖","鬼火","僵尸","尸龙","落武者","魅影","报丧女妖","布歌儿宝"]},
  {"cat":"元素精灵型","alts":"元素型","items":["雪女","暗物质","温蒂妮","伊格尼斯","希尔芙","诺姆","狐火","冰精","冰之女王","多罗姆","冰柱女","灯精","苍白骑士"]},
  {"cat":"恶魔型","items":["小恶魔","魅魔","次级魅魔","亚马逊女战士","爱丽丝","黑暗祭司","艾露普","莉莉姆","女忍","高阶小恶魔","魔鬼","恶魔","小魔怪","夜魇","炎魔","巴洛格"]},
  {"cat":"兽人型","items":["狼人","蝙蝠人","兔人","半人马","巨大老鼠","妖狐","猫人","狐仙","米洛陶洛斯","荷斯陶洛斯","半兽人","梦魇","斯芬克斯","阿努比斯","独角兽","灰熊","绵羊人","猫又","刑部狸","双角兽","雪人","塞尔克","人虎","奇奇莫拉","柴郡猫","三月兔","睡鼠","火鼠","熊猫人","地狱犬","凯西","攫猿","温迪戈","狗头人","雷兽","库西","半羊人","白泽","白角","镰鼬","拉塔托斯克","高等兽人","欧希洛美","凯尔派"]},
  {"cat":"鬼亚人型","items":["哥布林","红鬼","食人魔","大哥布林","青鬼","红帽子","布吉","波吉"]},
  {"cat":"软体生物型","items":["大型蛞蝓","海兔"]},
  {"cat":"软体亚人型","items":["斯库拉","克拉肯","夺心魔"]},
  {"cat":"拟态亚人型","items":["宝箱怪","壶魔人","卡律布狄斯","金币怪"]},
  {"cat":"鱼型","items":["美人鱼","海洋主教","梅洛","鳗女郎","乙姬","人鲨"]},
  {"cat":"原巨人型","items":["独眼巨人"]},
  {"cat":"精灵型","items":["精灵","黑暗精灵"]},
  {"cat":"触手生物型","alts":"不定形型","items":["罗帕"]},
  {"cat":"魔人型","items":["魔女","狐凭","半吸血鬼","疯帽子","毛娼妓","垢舐鬼","扑克兵","暗魔法师","滑瓢"]},
  {"cat":"魔兽型","items":["巴风特","蝎狮","魔宠","奇美拉","狮鹫","坎普斯"]},
  {"cat":"水栖亚人型","items":["河童","涅瑞伊得斯","沙华鱼人","阿普撒拉斯","海和尚"]},
  {"cat":"天使型","items":["天使","黑暗天使","女武神","暗黑女武神","天女","丘比特","萨尔平克斯"]},
  {"cat":"矮人型","items":["矮人"]},
  {"cat":"单眼亚人型","items":["眼魔"]},
  {"cat":"甲壳亚人型","items":["巨蟹"]},
  {"cat":"亚人型","items":["巨魔"]},
  {"cat":"两栖亚人型","items":["粘液蛙"]}
];
/* 科属映射（种族名 → 主科属；双科属取主形态） */
const RACE_FAM = {
  "阿娜温":"阿娜温属",
  "玛坦戈":"玛坦戈属",
  "树妖":"树妖属",
  "曼德拉草":"曼德拉属",
  "凯斯柏莎":"曼德拉属",
  "触手":"触手属",
  "莉莉娜温":"阿娜温属",
  "绵羊草":"阿娜温属",
  "浮游海带":"曼德拉属",
  "蕈人":"玛坦戈属",
  "食人草（挟叶种）":"食人草属",
  "食人草（袋叶种）":"食人草属",
  "史莱姆":"史莱姆属",
  "红色史莱姆":"史莱姆属",
  "海生史莱姆":"史莱姆属",
  "湿地史莱姆":"史莱姆属",
  "史莱姆女王":"史莱姆属",
  "黑暗史莱姆":"史莱姆属",
  "濡女子":"史莱姆属",
  "寄生史莱姆&史莱姆宿主":"史莱姆属",
  "修格斯":"史莱姆属",
  "矮蛋":"史莱姆属",
  "太岁":"史莱姆属",
  "魔像":"魔像属",
  "石像鬼":"魔像属",
  "妖怪灯笼":"付丧神属",
  "活人偶":"人偶属",
  "熔岩魔像":"魔像属",
  "唐伞妖怪":"付丧神属",
  "活铠甲":"铠甲属",
  "诅咒之剑":"剑魔属",
  "一反木棉":"一反木棉属",
  "自动人形":"魔像属",
  "烛灵":"魔像属",
  "大蚂蚁":"蚂蚁属",
  "魔虫":"魔虫属",
  "蜜蜂":"蜂属",
  "大黄蜂":"蜂属",
  "别西卜":"苍蝇属",
  "阿拉克尼":"阿拉克尼属",
  "女郎蜘蛛":"阿拉克尼属",
  "蚂蚁阿拉克尼":"阿拉克尼属",
  "蝎子人":"阿拉克尼属",
  "螳螂":"螳螂属",
  "牛鬼":"阿拉克尼属",
  "大百足":"蜈蚣属",
  "凯布利":"甲虫属",
  "沙虫":"蠕虫属",
  "蛾人":"花蝶属",
  "士兵甲虫":"甲虫属",
  "吸血鬼蚊":"苍蝇属",
  "阿特拉克·纳克亚":"阿拉克尼属",
  "青虫":"虫属",
  "花蝶":"花蝶属",
  "幻虫":"虫属",
  "亚巴顿":"亚巴顿属",
  "亚巴顿群众":"亚巴顿属",
  "拉米亚":"拉米亚属",
  "美杜莎":"拉米亚属",
  "蜥蜴人":"蜥蜴人属",
  "厄喀德娜":"拉米亚属",
  "龙":"龙属",
  "沙罗曼蛇":"蜥蜴人属",
  "白蛇":"拉米亚属",
  "龍":"龙属",
  "双足飞龙":"龙属",
  "亚龙":"龙属",
  "阿波菲斯":"拉米亚属",
  "炸脖龙":"龙属",
  "毒蜥":"拉米亚属",
  "本耶普":"拉米亚属",
  "邪龙":"龙属",
  "龙人":"龙属",
  "哈比":"哈比属",
  "黑色哈比":"哈比属",
  "鸡蛇兽":"哈比属",
  "乌鸦天狗":"哈比属",
  "塞壬":"哈比属",
  "雷鸟":"哈比属",
  "乾闼婆":"哈比属",
  "揪拨揪拨鸟":"哈比属",
  "鸮魔法师":"哈比属",
  "不死鸟":"哈比属",
  "小妖精":"小恶魔属",
  "小仙女":"魅魔属（原妖精属）",
  "凉南希":"妖精属",
  "泰坦妮亚":"魅魔属（原妖精属）",
  "丧尸":"丧尸属",
  "杜拉罕":"杜拉罕属",
  "木乃伊":"丧尸属",
  "骷髅":"魔像属",
  "幽灵":"幽灵属",
  "吸血鬼":"魅魔属",
  "食尸鬼":"丧尸属",
  "重身幽灵":"幽灵属",
  "法老":"丧尸属",
  "巫妖":"丧尸属",
  "尸妖":"丧尸属",
  "鬼火":"幽灵属",
  "僵尸":"丧尸属",
  "尸龙":"龙属",
  "落武者":"丧尸属",
  "魅影":"幽灵属",
  "报丧女妖":"魅魔属",
  "布歌儿宝":"哥布林属",
  "雪女":"元素精灵属",
  "暗物质":"元素精灵属",
  "温蒂妮":"元素精灵属",
  "伊格尼斯":"元素精灵属",
  "希尔芙":"元素精灵属",
  "诺姆":"元素精灵属",
  "狐火":"元素精灵属",
  "冰精":"元素精灵属",
  "冰之女王":"元素精灵属",
  "多罗姆":"元素精灵属",
  "冰柱女":"元素精灵属",
  "灯精":"元素精灵属",
  "苍白骑士":"病魔属",
  "小恶魔":"小恶魔属",
  "魅魔":"魅魔属",
  "次级魅魔":"魅魔属",
  "亚马逊女战士":"魅魔属",
  "爱丽丝":"魅魔属",
  "黑暗祭司":"魅魔属",
  "艾露普":"魅魔属",
  "莉莉姆":"魅魔属",
  "女忍":"魅魔属",
  "高阶小恶魔":"小恶魔属",
  "魔鬼":"小恶魔属",
  "恶魔":"魅魔属",
  "小魔怪":"小恶魔属",
  "夜魇":"魅魔属",
  "炎魔":"魅魔属",
  "巴洛格":"魅魔属",
  "狼人":"狼属",
  "蝙蝠人":"蝙蝠属",
  "兔人":"兔属",
  "半人马":"半人马属",
  "巨大老鼠":"鼠属",
  "妖狐":"狐狸属",
  "猫人":"猫属",
  "狐仙":"狐狸属",
  "米洛陶洛斯":"牛头人属",
  "荷斯陶洛斯":"牛头人属",
  "半兽人":"半兽人属",
  "梦魇":"半人马属",
  "斯芬克斯":"猫属",
  "阿努比斯":"狼属",
  "独角兽":"半人马属",
  "灰熊":"熊属",
  "绵羊人":"羊属",
  "猫又":"猫属",
  "刑部狸":"狸猫属",
  "双角兽":"半人马属",
  "雪人":"猿人属",
  "塞尔克":"人鱼属",
  "人虎":"虎属",
  "奇奇莫拉":"狼属",
  "柴郡猫":"猫属",
  "三月兔":"兔属",
  "睡鼠":"鼠属",
  "火鼠":"鼠属",
  "熊猫人":"熊属",
  "地狱犬":"狼属",
  "凯西":"猫属",
  "攫猿":"猿人属",
  "温迪戈":"温迪戈属",
  "狗头人":"狼属",
  "雷兽":"鼬属",
  "库西":"狼属",
  "半羊人":"半羊人属",
  "白泽":"牛头人属",
  "白角":"半人马属",
  "镰鼬":"鼬属",
  "拉塔托斯克":"松鼠属",
  "高等兽人":"半兽人属",
  "欧希洛美":"猫属",
  "凯尔派":"半人马属",
  "哥布林":"哥布林属",
  "红鬼":"半兽人属",
  "食人魔":"食人魔属",
  "大哥布林":"哥布林属",
  "青鬼":"半兽人属",
  "红帽子":"哥布林属",
  "布吉":"食人魔属",
  "波吉":"食人魔属",
  "大型蛞蝓":"甲壳属",
  "海兔":"贝类属",
  "斯库拉":"斯库拉属",
  "克拉肯":"斯库拉属",
  "夺心魔":"斯库拉属",
  "宝箱怪":"宝箱怪属",
  "壶魔人":"宝箱怪属",
  "卡律布狄斯":"宝箱怪属",
  "金币怪":"宝箱怪属",
  "美人鱼":"人鱼属",
  "海洋主教":"人鱼属",
  "梅洛":"人鱼属",
  "鳗女郎":"人鱼属",
  "乙姬":"龙属",
  "人鲨":"人鱼属",
  "独眼巨人":"原巨人属",
  "精灵":"魅魔属",
  "黑暗精灵":"魅魔属",
  "罗帕":"罗帕属",
  "魔女":"魔人属",
  "狐凭":"魔人属",
  "半吸血鬼":"魅魔属",
  "疯帽子":"玛坦戈属",
  "毛娼妓":"魅魔属",
  "垢舐鬼":"妖女属",
  "扑克兵":"魔人属",
  "暗魔法师":"魔人属",
  "滑瓢":"妖女属",
  "巴风特":"巴风特属",
  "蝎狮":"奇美拉属",
  "魔宠":"奇美拉属",
  "奇美拉":"奇美拉属",
  "狮鹫":"狮鹫属",
  "坎普斯":"巴风特属",
  "河童":"鱼人属",
  "涅瑞伊得斯":"魅魔属",
  "沙华鱼人":"鱼人属",
  "阿普撒拉斯":"元素精灵属",
  "海和尚":"龟属",
  "天使":"魅魔属（原天使属）",
  "黑暗天使":"魅魔属",
  "女武神":"天使属",
  "暗黑女武神":"天使属",
  "天女":"天使属",
  "丘比特":"天使属",
  "萨尔平克斯":"天使属",
  "矮人":"魅魔属",
  "眼魔":"眼魔属",
  "巨蟹":"巨蟹属",
  "巨魔":"巨魔属",
  "粘液蛙":"蛙属"
};
/* 别名映射（种族名 → 卡内别名，供搜索与悬浮提示） */
const RACE_ALIAS = {
  "玛坦戈":"蘑菇",
  "浮游海带":"海带娘",
  "食人草（挟叶种）":"Man-eating Plant",
  "红色史莱姆":"红史莱姆",
  "史莱姆女王":"女王史莱姆",
  "黑暗史莱姆":"暗黑史莱姆",
  "寄生史莱姆&史莱姆宿主":"寄生史莱姆",
  "魔像":"魔法物质",
  "熔岩魔像":"岩浆魔",
  "唐伞妖怪":"唐伞",
  "自动人形":"自动人偶",
  "大蚂蚁":"蚁后",
  "大黄蜂":"杀人蜂",
  "阿拉克尼":"蜘蛛女",
  "女郎蜘蛛":"络新妇",
  "蝎子人":"蝎子",
  "大百足":"蜈蚣",
  "沙虫":"蠕虫",
  "士兵甲虫":"甲壳",
  "吸血鬼蚊":"吸血蚊",
  "阿特拉克·纳克亚":"纳克亚",
  "花蝶":"蝴蝶",
  "亚巴顿":"魔王虫",
  "亚巴顿群众":"兵虫",
  "拉米亚":"拉弥亚",
  "美杜莎":"梅杜莎",
  "厄喀德娜":"魔族之母",
  "龙":"西方龙",
  "龍":"东方龙/Ryu",
  "双足飞龙":"飞龙",
  "龙人":"多拉贡尼亚龙人",
  "乌鸦天狗":"天狗",
  "小妖精":"妖精",
  "小仙女":"仙女",
  "泰坦妮亚":"妖精女王",
  "杜拉罕":"无头骑士",
  "重身幽灵":"多佩尔甘格",
  "尸龙":"龙僵尸",
  "魅影":"暗影",
  "布歌儿宝":"毛绒玩偶",
  "雪女":"元素精灵",
  "暗物质":"暗元素",
  "温蒂妮":"水元素",
  "伊格尼斯":"火元素",
  "希尔芙":"风元素",
  "诺姆":"土元素",
  "冰精":"冰元素",
  "多罗姆":"泥巨人",
  "苍白骑士":"死亡骑士",
  "小恶魔":"Imp",
  "魅魔":"淫魔",
  "黑暗祭司":"暗之祭司",
  "艾露普":"Alp/阿尔普",
  "妖狐":"九尾狐",
  "猫人":"猫魔",
  "狐仙":"Fox Spirit",
  "米洛陶洛斯":"米诺陶洛斯",
  "半兽人":"Orc",
  "梦魇":"女梦魔",
  "刑部狸":"狸猫",
  "地狱犬":"刻耳柏洛斯",
  "雷兽":"雷元素",
  "库西":"库·西",
  "大型蛞蝓":"蜗牛",
  "海兔":"海牛",
  "宝箱怪":"拟态怪",
  "美人鱼":"人鱼",
  "精灵":"Elf/魅魔化精灵",
  "黑暗精灵":"暗精灵",
  "垢舐鬼":"Akuname",
  "滑瓢":"滑头鬼",
  "蝎狮":"蝎尾狮",
  "黑暗天使":"暗黑天使",
  "女武神":"瓦尔基里",
  "暗黑女武神":"黑暗瓦尔基里",
  "萨尔平克斯":"终焉的喇叭",
  "矮人":"侏儒",
  "巨蟹":"螃蟹"
};
/* 基调 → 开局强度指令（写入开场消息，指导AI的开局压力） */
const TONE_DIRECTIVE = {
  blessed:'顺风开局：主角资源充裕、处境安稳，请以从容舒展的基调展开第一幕',
  woven:'变数开局：福祸相依、悬念丛生，请在第一幕中埋入未知伏笔与转机',
  trial:'绝境开局：主角资源匮乏、处境凶险，第一幕即应面临压力、追索或危机',
  custom:'自定义开局：严格依照玩家填写的配置展开'
};
const FAITH_SELF = ['local','custom'];
const COMP_SHORT = {familiar:'魔宠·菲娜',mare:'梦魔·露珂',pixie:'小仙女·蒂蒂',ghost:'幽灵·塞蕾丝'};
const MAX_BONDS = (RT.rules && RT.rules.maxBonds) || 4;
const APT_DEFS = [['ling','灵感','洞察与学习·信息与熟练度'],['mei','魅力','言谈交际·说服而非交战'],['ti','体质','耐力根基·后续扩展体质池'],['xin','信仰','神恩强度·对象不固定']];
const APT_MIN = {ling:1,mei:1,ti:1,xin:0};
const APT_POOL = (RT.rules && RT.rules.aptitude && RT.rules.aptitude.pool) || 30;
const LEVEL_PRESETS = ['Lv.10','Lv.30','Lv.50','Lv.70','Lv.90','Lv.110','Lv.130','Lv.150','Lv.170','Lv.190','Lv.210'];

const tomeEl = document.getElementById('tome');
const rit = document.createElement('section');
rit.id = 'ritual'; rit.className = 'ritual'; rit.setAttribute('aria-label','启封仪典');
tomeEl.appendChild(rit);

let R = null;
function freshR(){
  return { step:0, tone:null, timeline:null, tlCustom:'', identity:null, identityCustom:'',
    race:null, hero:{name:'',gender:'',age:'',appearance:'',faction:'',bg:'',outfit:'',inventory:''},
    pLevel:'', apt:{ling:10,mei:10,ti:10,xin:0}, aptMode:'pool',
    faith:null, faithCustom:'',
    companion:null, compCustom:{name:'',race:'',persona:'',look:'',origin:'',route:''}, compRandRace:'',
    bonds:new Map(), customNpcs:[], region:null, regionCustom:'',
    npcSearch:'', npcFilter:{race:[],reg:[],lv:[]}, customNpcForm:false, cnp:{name:'',race:'',desc:''},
    rollSummary:'' };
}
const aptSum = ()=> APT_DEFS.reduce((s,[k])=>s+R.apt[k],0);
const pick = arr => (arr && arr.length) ? arr[Math.floor(Math.random()*arr.length)] : '';
const pools = ()=> RT.pools || {};
const allBonds = ()=> (RT.bonds||[]).concat(R.customNpcs||[]);
const pickName = (list,id)=>{ const x=(list||[]).find(o=>o.id===id); return x?noEmoji(x.n):id; };

window.openRitual = function(){
  if(!R) R = freshR();
  renderRitual();
  setStage('ritual');
  tome.classList.remove('cover-on');
  tome.classList.add('rit-on');
  rit.classList.add('open');
};

/* ---- 快速开局（随机整套，数据池 = 欢迎页面原文） ---- */
function autoFill(toneId){
  const P = pools();
  R.tone = toneId;
  // 1. 身份随机（人类男/人类女/魔物娘 等权重）
  R.identity = pick(['human_m','human_f','monster']);
  const isM = R.identity==='monster', female = R.identity!=='human_m';
  if(isM){ const cat = pick(RACE_CATS); R.race = pick(cat ? cat.items : []); R.rollRace='（'+(cat?cat.cat:'')+'）'; }
  else { R.race = null; R.rollRace=''; }
  // 2. 时间线随机（眷顾=堕落后更安全；试炼偏向堕落前）
  R.timeline = toneId==='blessed' ? 'after' : toneId==='trial' ? pick(['before','before','after']) : pick(['before','after']);
  // 3. 属性联动身份与基调
  R.hero.gender = female?'女':'男';
  R.hero.name = pick(female?P.namesF:P.namesM) || R.hero.name;
  R.hero.age = String(18+Math.floor(Math.random()*15));
  R.hero.appearance = String(female?(150+Math.floor(Math.random()*25)):(165+Math.floor(Math.random()*23)))+'cm';
  R.hero.faction = rollToneField(P,'faction', toneId, isM);
  R.hero.bg = rollToneField(P,'bg', toneId, isM);
  R.hero.inventory = pick(toneId==='trial'?P.itemsTrial:(toneId==='woven'?P.itemsWoven:P.itemsBlessed)) || '';
  R.hero.outfit = isM ? pick(P.outfitsMonster) : pick(toneId==='blessed'?P.outfitsBlessed:toneId==='trial'?P.outfitsTrial:P.outfitsWoven) || '';
  // 4. 信仰随机（自填两档不参与）
  const fp = (RT.faiths||[]).filter(f=>FAITH_SELF.indexOf(f.id)<0);
  const f = pick(fp); if(f){ R.faith = f.id; R.faithCustom=''; }
  // 5. 住民随机（四预设之一）
  R.companion = pick(['familiar','mare','pixie','ghost']);
  R.compCustom = {name:'',race:'',persona:'',look:'',origin:'',route:''};
  // 横幅
  const toneName = pickName(RT.tones,toneId);
  const tlName = pickName(RT.timelines,R.timeline);
  const idText = isM ? ('魔物娘 · '+R.race+(R.rollRace||'')) : (female?'人类女性':'人类男性');
  R.rollSummary = '🎲 '+toneName+'　→　'+idText+'　·　'+R.hero.name+'　·　'+tlName+'　·　住民：'+(COMP_SHORT[R.companion]||'');
  notify(toneName+' · '+(isM?('魔物娘 · '+R.race):(female?'人类女性':'人类男性')),'gild',3000);
}
function rollToneField(P, kind, toneId, isM){
  const cap = kind==='faction'?'faction':'bg';
  const set = isM
    ? (toneId==='blessed'?P[cap+'MBlessed']:(toneId==='trial'?P[cap+'MTrial']:P[cap+'MWoven']))
    : (toneId==='blessed'?P[cap+'Blessed']:(toneId==='trial'?P[cap+'Trial']:P[cap+'Woven']));
  return pick(set) || '';
}

function closeRitual(enter){
  rit.classList.remove('open');
  tome.classList.remove('rit-on');
  if(enter){
    showAwaiting();
    enterDraft(buildMsg());
    notify('仪典已成——开局定稿已誊入信笺，过目后寄出。','gild',5200);
  }else{
    showCover();
  }
}

/* ---- NPC 形态（跟随时间线/人类/已魔物化；堕落之前默认人类） ---- */
function npcForm(npc, entry){
  const f = entry && entry.form;
  if(f==='human' && npc.rc0) return {rc:npc.rc0, d:npc.d0, human:true};
  if(f==='monster' || !npc.rc0) return {rc:npc.rc, d:npc.d, human:false};
  if(R.timeline==='before') return {rc:npc.rc0, d:npc.d0, human:true};
  return {rc:npc.rc, d:npc.d, human:false};
}
/* ---- NPC 三层索引（同层多选，跨层叠加） ---- */
function npcLvBand(v){ v=parseInt(v,10)||1;
  if(v<=20)return't1';if(v<=40)return't2';if(v<=60)return't3';if(v<=80)return't4';if(v<=100)return't5';
  if(v<=120)return't6';if(v<=140)return't7';if(v<=160)return't8';if(v<=180)return't9';if(v<=200)return't10';return't11'; }
const LV_LABELS = {t1:'T1 / Lv.1-20',t2:'T2 / Lv.21-40',t3:'T3 / Lv.41-60',t4:'T4 / Lv.61-80',t5:'T5 / Lv.81-100',t6:'T6 / Lv.101-120',t7:'T7 / Lv.121-140',t8:'T8 / Lv.141-160',t9:'T9 / Lv.161-180',t10:'T10 / Lv.181-200',t11:'T11 / Lv.201-220'};
function npcRaceKey(v){ v=String(v||''); return v.indexOf('人类')===0?'人类':v; }
function npcPass(npc){
  const NF = R.npcFilter;
  const raceOk = !NF.race.length || NF.race.indexOf(npcRaceKey(npc.rc))>=0 || NF.race.indexOf(npcRaceKey(npc.rc0))>=0;
  const regOk  = !NF.reg.length || NF.reg.indexOf(npc.reg||'')>=0;
  const lvOk   = !NF.lv.length || NF.lv.indexOf(npcLvBand(npc.lv||1))>=0 || (npc.lv0?NF.lv.indexOf(npcLvBand(npc.lv0))>=0:false);
  return raceOk && regOk && lvOk;
}
function npcIndexHtml(){
  const npcs = allBonds();
  const races=[],regs=[];
  npcs.forEach(n=>{ [npcRaceKey(n.rc),npcRaceKey(n.rc0)].forEach(r=>{ if(r&&r.indexOf('未知')!==0&&races.indexOf(r)<0)races.push(r); });
    if(n.reg&&regs.indexOf(n.reg)<0)regs.push(n.reg); });
  const NF = R.npcFilter;
  const rowHtml=(label,key,items)=>{
    const actLabel = cur => `<button class="rchip${cur?' on':''}" data-nix="${key}" data-v="${'__all__'}">全部</button>`;
    return `<div class="rchip-row"><span class="rchip-lab">${label}</span>${actLabel(!NF[key].length)}${items.map(it=>{
      const k = Array.isArray(it)?it[0]:it, t = Array.isArray(it)?it[1]:it;
      return `<button class="rchip${NF[key].indexOf(k)>=0?' on':''}" data-nix="${key}" data-v="${esc(k)}">${esc(t)}</button>`;}).join('')}</div>`;
  };
  return `<div class="rchip-row"><span class="rchip-hint">同层可多选，跨层叠加</span><button class="rchip rchip-clear" data-nix="reset" data-v="all">清除筛选</button></div>`
    + rowHtml('种族','race',races)
    + rowHtml('地区','reg',regs)
    + rowHtml('等级','lv',Object.keys(LV_LABELS).map(k=>[k,LV_LABELS[k]]));
}

/* ============ 渲染（每步一次整体重绘；交互用 render(true) 保滚动） ============ */
function optCard(group, o, desc){
  const sel = R[group]===o.id ? ' sel' : '';
  return `<button class="rit-opt${sel}" data-g="${group}" data-id="${esc(o.id)}">
    <b>${esc(noEmoji(o.n))}</b>${desc!==false&&o.d?`<i>${esc(o.d)}</i>`:''}</button>`;
}
function stepCrumbs(){
  return `<div class="rit-crumbs">${RT.stepLabels.map((s,i)=>
    `${i?'<span class="rc-sep"></span>':''}<span class="rc-step${i===R.step?' on':i<R.step?' done':''}"><em>${['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ'][i]}</em>${esc(s)}</span>`).join('')}</div>`;
}

function bodyStep0(){
  const toneChosen = R.tone && R.tone!=='custom';
  const hitChoices = { timeline:'tlCustomWrap', identity:'idCustomWrap' };
  return `
  <div class="sec-title">命运基调 · 快速开局${toneChosen?`<span class="rit-reroll"><button id="rit-reroll">以此基调重掷</button></span>`:''}</div>
  <div class="rit-grid">${(RT.tones||[]).map(o=>optCard('tone',o)).join('')}</div>
  ${R.rollSummary?`<div class="rr-banner">${esc(R.rollSummary)}</div>`:''}
  <div class="sec-title">时间线 · 堕落之前或之后</div>
  <p class="rit-hint">雷斯卡特耶沦陷是这个世界的分水岭。在那之前，女主们仍是人类；在那之后，她们已化为魔物娘。</p>
  <div class="rit-grid cols-3">${(RT.timelines||[]).map(o=>optCard('timeline',o)).join('')}</div>
  ${R.timeline==='custom'?`<div class="rit-form cwrap"><label class="wide">自定义时间线<input data-rc="tlCustom" type="text" value="${esc(R.tlCustom)}" placeholder="自行设定时间线状态——在后文说明送往AI"></label></div>`:''}
  <div class="sec-title">身份 · 你是谁</div>
  <div class="rit-grid cols-4">${(RT.identities||[]).map(o=>optCard('identity',o,false)).join('')}</div>
  ${R.identity==='custom'?`<div class="rit-form cwrap"><label class="wide">身份描述<input data-rc="identityCustom" type="text" value="${esc(R.identityCustom)}" placeholder="自定义身份/种族描述——在后文说明送往AI"></label></div>`:''}
  ${(R.identity==='monster'||R.race)?`
  <div class="sec-title">种族 · 你的魔物形态<span class="rit-pool" style="font-weight:400">${R.race&&R.race!=='__custom__'?('已择 '+esc(R.race)+' · '+esc(raceCatOf(R.race))):(R.race==='__custom__'?'已择 · 自定义（在身份描述中填写）':'16 类可选 · 亦可自定义')}</span></div>
  <div class="dw-searchbar"><input id="race-q" type="text" value="${esc(R.raceQ||'')}" data-q="race" placeholder="检索种族……"><span class="rchip-hint">${esc(raceShownCount())} / ${esc(String(raceTotal()))}</span></div>
  <div class="race-acc">${raceAccHtml()}</div>
  <div class="race-acc"><button class="rit-opt bond${R.race==='__custom__'?' sel':''}" data-race="__custom__"><b>自定义种族</b><i>在上方「身份 · 自定义」的描述栏里填写</i></button></div>
  `:''}
  <div class="sec-title">主角配置 · 以此身<span class="rit-pool" style="font-weight:400">已填写的维度将原样写进开局设定，留空由命运与 AI 补全</span></div>
  <div class="rit-form">
    <label>姓名<input data-hero="name" type="text" value="${esc(R.hero.name)}" placeholder="你在这片大陆的名字，留空由命运补全"></label>
    <label>性别<input data-hero="gender" type="text" value="${esc(R.hero.gender)}" placeholder="男 / 女"></label>
    <label>年龄<input data-hero="age" type="text" value="${esc(R.hero.age)}" placeholder="例：18"></label>
    <label>外貌<input data-hero="appearance" type="text" value="${esc(R.hero.appearance)}" placeholder="例：178cm / 贫乳长发虎牙 / 白发兽耳"></label>
    <label class="wide">势力<input data-hero="faction" type="text" value="${esc(R.hero.faction)}" placeholder="留空由命运与基调斟酌"></label>
    <label class="wide">前尘往事<input data-hero="bg" type="text" value="${esc(R.hero.bg)}" placeholder="你睁开眼之前的来历"></label>
    <label class="wide">服装<input data-hero="outfit" type="text" value="${esc(R.hero.outfit)}" placeholder="当前衣着，留空由AI按设定拟定"></label>
    <label class="wide">行囊<textarea data-hero="inventory" rows="3" placeholder="随身之物与资产——原文档照搬，留空由AI按设定拟定">${esc(R.hero.inventory)}</textarea></label>
  </div>
  <div class="sec-title">初始等级</div>
  <div class="rchip-row">${LEVEL_PRESETS.map((o,ix)=>`<button class="rchip${(R.pLevel||'')===o?' on':''}" data-pl="${ix}">${'T'+(ix+1)+' / '+o}</button>`).join('')}</div>
  <div class="rit-form"><label>自定义等级<span class="lv-wrap"><input id="lv-custom" type="number" min="1" max="220" value="${esc(String(R.pLevel||'').replace(/^Lv\./,''))}" placeholder="Lv.1 ~ 220（输入后回车或移开焦点即生效）"><button type="button" class="lv-roll" data-level-roll aria-label="等级随缘">随</button></span></label></div>
  <div class="sec-title">信仰 · 神缘之始</div>
  <div class="rit-hintbar"><p class="rit-hint">信仰即神缘，对象不固定——主神、堕落神、地方神明、魔王侧存在皆可侍奉，也可无信仰。它影响 NPC 好感与行为（同信仰者亲近、异信仰者或警戒），也影响你使用魔法/技能/道具的效果（同对象阵营的圣物祝福类效力加成）；检定上信仰负责神圣类与神缘检定。同对象行为得赐福，违背教义受削弱甚至惩罚；可以改宗，但旧神可能记仇。</p></div>
  <div class="rit-grid cols-4">${(RT.faiths||[]).map(o=>optCard('faith',o,false)).join('')}</div>
  ${(R.faith==='local'||R.faith==='custom')?`<div class="rit-form cwrap"><label class="wide">你信仰的是<input data-rc="faithCustom" type="text" value="${esc(R.faithCustom)}" placeholder="local=地方神 / custom=任意说得通的对象"></label></div>`:''}
  <div class="sec-title">资质 · 天赋之始<span class="rit-pool">${R.aptMode==='roll'?`骰点已掷`:(`命运之余 <b>${APT_POOL-aptSum()}</b> / ${APT_POOL}`)}</span></div>
  <div class="rchip-row">
    <button class="rchip${R.aptMode!=='roll'?' on':''}" data-am="pool">点数池分配</button>
    <button class="rchip${R.aptMode==='roll'?' on':''}" data-am="roll">命运骰点</button>
    ${R.aptMode==='roll'?`<button type="button" class="rchip" data-am="reroll">重新骰点</button>`:''}
  </div>
  <p class="rit-hint">${R.aptMode==='roll'
    ? '4d6 取三高（信仰仍从 0 起步）；可反复骰点，取最后一次。'
    : '剩余点数：'+String(APT_POOL-aptSum())+' / '+APT_POOL+(APT_POOL-aptSum()>0?'（点击 + 分配）':'（已分配完毕，点 − 可收回）')}</p>
  ${APT_DEFS.map(([k,n,d])=>`
    <div class="rit-apt"><span class="ra-name">${n}<i>${d}</i></span>
      ${R.aptMode==='roll'
        ? `<span class="ra-val">${R.apt[k]}</span>`
        : `<button class="ra-btn" data-apt="${k}" data-d="-1" ${R.apt[k]<=APT_MIN[k]?'disabled':''}>−</button>
           <span class="ra-val">${R.apt[k]}</span>
           <button class="ra-btn" data-apt="${k}" data-d="1" ${R.apt[k]>=20||aptSum()>=APT_POOL?'disabled':''}>＋</button>`}
    </div>`).join('')}`;
}
function raceCatOf(race){
  for(const c of RACE_CATS){ if(c.items.indexOf(race)>=0) return c.cat; }
  return '';
}
function raceTotal(){ return RACE_CATS.reduce((s,c)=>s+c.items.length,0); }
function raceShownCount(){
  const q = (R.raceQ||'').toLowerCase();
  if(!q) return raceTotal();
  return RACE_CATS.reduce((s,c)=>s+c.items.filter(r=>r.toLowerCase().indexOf(q)>=0).length,0);
}
function raceAccHtml(){
  const q = (R.raceQ||'').toLowerCase();
  const hit = (r)=> !q || r.toLowerCase().indexOf(q)>=0 || (RACE_ALIAS[r]||'').toLowerCase().indexOf(q)>=0;
  return RACE_CATS.map((c,ci)=>{
    const matches = c.items.filter(hit);
    if(q && !matches.length) return '';
    const hasSel = R.race && c.items.indexOf(R.race)>=0;
    const open = !!q || (R.raceAcc!=null ? R.raceAcc===ci : !!hasSel);
    let lastFam = '';
    const rows = matches.map(r=>{
      const f = RACE_FAM[r]||'';
      const head = (f && f!==lastFam) ? ((lastFam=f), '<div class="race-fam">'+esc(f)+'</div>') : '';
      const tip = RACE_ALIAS[r] ? ' title="别名：'+esc(RACE_ALIAS[r])+'"' : '';
      return head+'<button class="race-item'+(R.race===r?' sel':'')+'" data-race="'+esc(r)+'"'+tip+'>'+esc(r)+'</button>';
    }).join('');
    return `<button class="race-cat${open?' open':''}${hasSel?' has':''}" data-rcat="${ci}">${esc(c.cat)} (${matches.length})${hasSel?' ✦':''}</button>
      <div class="race-items"${open?'':''}>${rows}</div>`;
  }).join('');
}

function bodyStep1(){
  return `
  <div class="sec-title">心界住民 · 脑内之声</div>
  <p class="rit-hint">当你在开局的黎明睁开眼，颅内已经住着一个声音。四位预设住民性格、播报风格与实体化路线各不相同；此选择全程唯一，途中不可更换。</p>
  <div class="rit-grid">${(RT.companions||[]).map(o=>optCard('companion',o)).join('')}</div>
  ${R.companion==='comp_custom'?`
  <div class="sec-title">自定义住民</div>
  <div class="rit-form">
    <label>住民名字<input data-cc="name" type="text" value="${esc(R.compCustom.name)}" placeholder="留空则由AI命名"></label>
    <label>住民种族<input data-cc="race" type="text" value="${esc(R.compCustom.race)}" placeholder="例：魔宠 / 梦魔 / 幽灵 / 任意图鉴种族；留空由AI拟定"></label>
    <label class="wide">性格与语癖<input data-cc="persona" type="text" value="${esc(R.compCustom.persona)}" placeholder="例：冷静毒舌，句尾带「……啧」"></label>
    <label class="wide">心象外形<input data-cc="look" type="text" value="${esc(R.compCustom.look)}" placeholder="心界中的长相与衣着；留空由AI拟定"></label>
    <label class="wide">来历<input data-cc="origin" type="text" value="${esc(R.compCustom.origin)}" placeholder="TA 为何住进你脑内；留空由AI拟定"></label>
    <label class="wide">实体化路线（愿景）<input data-cc="route" type="text" value="${esc(R.compCustom.route)}" placeholder="好感升高后你希望走向什么结局——留空由AI按心界法则拟定"></label>
  </div>`:''}
  ${R.companion==='comp_random'?`<p class="rit-hint">命运随机将从以下声族抽选：${(RT.companionRandomRaces||[]).map(esc).join(' · ')}<br>已抽：<b>${esc(R.compRandRace||'（尚未掷签）')}</b></p>`:''}`;
}

function bondEntry(id){ return R.bonds.get(id) || {rel:null,dir:null,catOpen:null}; }
function bodyStep2(){
  const max = MAX_BONDS;
  const q = (R.npcSearch||'').toLowerCase();
  const groups = [['勇者小队','第一部·勇者小队/堕落的少女们'],['魔界骑士','第二部·圣冰华骑士团/雷斯卡特耶的魔界骑士们'],['自定义','自定义与随机']];
  let matched = 0;
  const grpHtml = groups.map(([g,title])=>{
    const bucket = allBonds().filter(n=>{
      if((n.grp||'自定义')!==g) return false;
      const hay = (n.n+' '+(n.rc0||'')+' '+(n.rc||'')+' '+(n.d0||'')+' '+(n.d||'')+' '+(n.reg||'')).toLowerCase();
      if(q && hay.indexOf(q)<0) return false;
      return npcPass(n);
    });
    if(!bucket.length) return '';
    matched += bucket.length;
    const items = bucket.map(npc=>{
      const entry = R.bonds.get(npc.id), fm = npcForm(npc,entry);
      const fv = entry && entry.form || 'auto';
      const relBar = entry ? buildRelBar(npc,entry) : '';
      return `<div class="bnd-item${entry?' active':''}">
        <div class="bnd-hd" data-bnpc="${esc(npc.id)}">
          <span class="bnd-nm">${esc(npc.n)}</span><span class="bnd-rc">${esc(fm.rc)}</span>
          ${npc.custom?`<span class="bnd-rc is-custom">${npc.rand?'随机':'自定义'}</span>`:''}
          ${entry&&entry.rel?`<span class="bnd-rel">${esc(entry.rel.n)}${entry.dir?(' · '+esc(entry.dir.n)):''}</span>`:''}
          ${npc.custom?`<button class="bnd-del" data-delnpc="${esc(npc.id)}">✕ 移除</button>`:''}
        </div>
        ${npc.rc0?`<div class="bnd-desc"><b>人类时期</b>：${esc(npc.rc0)}${npc.lv0?(' · Lv.'+npc.lv0):''}${npc.mnote?('（'+esc(npc.mnote)+'）'):''}<br>${esc(npc.d0||'')}</div>`:''}
        <div class="bnd-desc"><b>${npc.rc0?'魔物娘时期':'形态'}</b>：${esc(npc.rc||'')}${npc.lv?(' · Lv.'+npc.lv):''}<br>${esc(npc.d||'')}</div>
        ${entry&&npc.rc0?`<div class="rchip-row">
          <button class="rchip${fv==='auto'?' on':''}" data-fnpc="${esc(npc.id)}" data-fv="auto">跟随时间线</button>
          <button class="rchip${fv==='human'?' on':''}" data-fnpc="${esc(npc.id)}" data-fv="human">人类形态</button>
          <button class="rchip${fv==='monster'?' on':''}" data-fnpc="${esc(npc.id)}" data-fv="monster">已魔物化</button>
        </div>`:''}
        ${relBar}
      </div>`;
    }).join('');
    return `<div class="sec-title">${title}</div>${items}`;
  }).join('');
  return `
  <div class="sec-title">宿命羁绊<span class="rit-pool">已择 <b>${R.bonds.size}</b> / ${max} 位</span></div>
  <div class="rit-hintbar"><p class="rit-hint">选择开局时与你有过交集的角色。名单卡内载录 ${(RT.bonds||[]).length} 位，勇者小队与魔界骑士各为其主；亦可自定义或交付命运。</p>
    <div class="rchip-row">
      <button type="button" class="rchip" id="cnp-toggle">添加自定义角色</button>
      <button type="button" class="rchip" id="bond-rand-npc">随机魔物娘羁绊</button>
    </div></div>
  ${R.customNpcForm?`
  <div class="rit-form cwrap">
    <label>名字<input data-cnp="name" type="text" value="${esc(R.cnp.name)}" placeholder="？？？（由AI命名）"></label>
    <label>种族<input data-cnp="race" type="text" value="${esc(R.cnp.race)}" placeholder="未知即由AI拟定"></label>
    <label class="wide">形象/备注<input data-cnp="desc" type="text" value="${esc(R.cnp.desc)}" placeholder="外貌与来历的线索，AI 据此补全"></label>
    <div class="rchip-row"><button type="button" class="rchip rit-enter-mini" id="cnp-add" ${R.bonds.size>=max?'disabled':''}>加入羁绊列表</button></div>
  </div>`:''}
  <div class="dw-searchbar"><input id="npc-q" type="text" value="${esc(R.npcSearch)}" data-q="npc" placeholder="检索名字 / 种族 / 地区……"></div>
  ${npcIndexHtml()}
  ${matched? grpHtml : `<div class="empty-note">（没有符合条件的女主）</div>`}
  <div class="chip-row">${[...R.bonds].map(([id,entry])=>{
    if(!entry.rel) return '';
    const npc = allBonds().find(n=>n.id===id);
    return `<span class="chip c-q">${esc(npc?npc.n:id)}〔${esc(npc?npc.rc:'')}〕：${esc(entry.rel.n)}${entry.dir?(' ('+esc(entry.dir.n)+')'):''}<button class="chip-x" data-xbond="${esc(id)}">×</button></span>`;
  }).join('')}</div>`;
}
function buildRelBar(npc, entry){
  const RL = RT.relations||[];
  let html = `<div class="rchip-row">`+RL.map((c,ci)=>`<button class="rchip${entry.catOpen===ci?' on':''}" data-rci="${ci}" data-bnpcr="${esc(npc.id)}">${esc(c.cat)}</button>`).join('')+`</div>`;
  if(entry.catOpen!==null && entry.catOpen!==undefined){
    const cat = RL[entry.catOpen];
    html += `<div class="rchip-row sub">`+cat.rels.map(rel=>`<button class="rchip${entry.rel&&entry.rel.v===rel.v?' on':''}" data-rv="${esc(rel.v)}" data-bnpcr="${esc(npc.id)}">${esc(rel.n)}</button>`).join('')+`</div>`;
    if(entry.rel){
      html += `<p class="rit-hint">${esc(entry.rel.d)}</p>`;
      html += `<div class="rchip-row">`+(RT.directions||[]).map(dir=>`<button class="rchip${entry.dir&&entry.dir.v===dir.v?' on':''}" data-rdw="${esc(dir.v)}" data-bnpcr="${esc(npc.id)}">${esc(dir.n)}</button>`).join('')+`</div>`;
    }
  }
  return html;
}

function bodyStep3(){
  return `
  <div class="sec-title">开局地点 · 你在何处睁开眼</div>
  <div class="rit-grid cols-2">${(RT.regions||[]).map(o=>optCard('region',o)).join('')}</div>
  ${R.region==='custom'?`<div class="rit-form cwrap"><label class="wide">自定义开局地点<input data-rc="regionCustom" type="text" value="${esc(R.regionCustom)}" placeholder="写下自定义的开局地点"></label></div>`:''}`;
}

function bodyStep4(){
  const mode = (RT.tones||[]).find(m=>m.id===R.tone);
  const tl = (RT.timelines||[]).find(t=>t.id===R.timeline);
  const iden = (RT.identities||[]).find(i=>i.id===R.identity);
  const region = (RT.regions||[]).find(r=>r.id===R.region);
  const ap = R.apt;
  const compTxt = !R.companion ? ''
    : R.companion==='none' ? '独自上路（无人格旁白）'
    : R.companion==='comp_random' ? ('命运随机 · '+(R.compRandRace||'?')+'（名字由AI拟定）')
    : R.companion==='comp_custom' ? ((R.compCustom.name||'由AI命名')+'（自定义 · '+(R.compCustom.race||'种族由AI拟定')+(R.compCustom.persona?(' · '+(R.compCustom.persona.length>18?R.compCustom.persona.slice(0,18)+'…':R.compCustom.persona)):'')+'）')
    : COMP_SHORT[R.companion] || R.companion;
  const heroBits = [R.hero.name,R.hero.gender,R.hero.age?R.hero.age+'岁':'',R.hero.appearance,R.pLevel,R.hero.faction,R.hero.bg,R.hero.outfit].filter(Boolean).join(' · ');
  const bondRows = [...R.bonds].map(([id,entry])=>{
    if(!entry.rel) return '';
    const npc = allBonds().find(n=>n.id===id); if(!npc) return '';
    const fm = npcForm(npc,entry);
    return '· '+npc.n+'（'+fm.rc+'）— '+entry.rel.n+(entry.dir?' ['+entry.dir.n+']':'');
  }).filter(Boolean).join('\n');
  const row = (k,v)=>`<div class="rit-sum-row"><span>${k}</span><b>${v||'<i class="unset">未择 · 命运自定</i>'}</b></div>`;
  return `
  <div class="sec-title sv-cinnabar">卷首誊录 · 仪典汇总</div>
  <div class="rit-sum">
    ${row('命运基调', R.tone?esc(pickName(RT.tones,R.tone))+'<br><span class="sum-dim">'+esc((TONE_DIRECTIVE[R.tone]||'').split('：')[1]||'')+'</span>':'')}
    ${row('时间线', R.timeline?esc(pickName(RT.timelines,R.timeline))+(R.timeline==='custom'&&R.tlCustom?(' — '+esc(R.tlCustom)):''):'')}
    ${row('身份', R.identity?(esc(pickName(RT.identities,R.identity))+(R.identity==='monster'&&R.race?(' · '+esc(R.race==='__custom__'?'自定义':R.race)):'')+(R.identity==='custom'&&R.identityCustom?(' — '+esc(R.identityCustom)):'')):'')}
    ${row('主角', esc(heroBits))}
    ${row('行囊', esc(R.hero.inventory))}
    ${row('信仰', esc(faithText()||''))}
    ${row('初始等级', esc(R.pLevel||'按命运基调'))}
    ${row('初始资质', `灵感 ${ap.ling} / 魅力 ${ap.mei} / 体质 ${ap.ti} / 信仰 ${ap.xin}${R.aptMode==='roll'?'（骰点）':''}`)}
    ${row('心界住民', esc(compTxt))}
    ${row('宿命羁绊', bondRows?esc(bondRows).replace(/\n/g,'<br>'):'')}
    ${row('开局地点', R.region?(esc(region?region.n:'')+(R.region==='custom'&&R.regionCustom?(' — '+esc(R.regionCustom)):'')):'')}
  </div>
  <p class="rit-hint">已填写的维度将原样写进开局设定；留空的维度由命运与 AI 补全。</p>
  <div class="rchip-row prof-row">
    <button type="button" class="rchip" id="prof-save">保存配置</button>
    <button type="button" class="rchip" id="prof-load">读取配置</button>
    <button type="button" class="rchip rst" id="rit-reset">重置（重新配置）</button>
  </div>`;
}
function faithText(){
  if(!R.faith) return '';
  if(FAITH_SELF.indexOf(R.faith)>=0) return (R.faithCustom||'').trim() || '（自填，待补）';
  const f = (RT.faiths||[]).find(x=>x.id===R.faith);
  return f?f.n:'';
}

/* ---- 开场消息（逐行对齐欢迎页面 buildMsg 原文口径） ---- */
function buildMsg(){
  const mode = (RT.tones||[]).find(m=>m.id===R.tone);
  const tl = (RT.timelines||[]).find(t=>t.id===R.timeline);
  const iden = (RT.identities||[]).find(i=>i.id===R.identity);
  const region = (RT.regions||[]).find(r=>r.id===R.region);
  const name = R.hero.name || '旅人';
  let msg = '以此身入世。\n';
  msg += '命运基调：'+(mode?noEmoji(mode.n):'自定义')+'（'+(TONE_DIRECTIVE[R.tone]||TONE_DIRECTIVE.custom)+'）\n';
  msg += '时间线：'+(tl?tl.n:'未指定');
  if(R.timeline==='custom' && R.tlCustom) msg += '（'+R.tlCustom+'）';
  msg += '\n';
  msg += '玩家姓名：'+name+'\n';
  msg += '身份：'+(iden?iden.n:'自定义');
  if(R.identity==='monster' && R.race && R.race!=='__custom__') msg += ' · 种族：'+R.race;
  if(R.identity==='custom' && R.identityCustom) msg += '（'+R.identityCustom+'）';
  msg += '\n';
  if(R.hero.gender) msg += '性别：'+R.hero.gender+'\n';
  if(R.hero.age) msg += '年龄：'+R.hero.age+'\n';
  if(R.hero.appearance) msg += '外貌：'+R.hero.appearance+'\n';
  if(R.hero.faction) msg += '所属势力：'+R.hero.faction+'\n';
  if(faithText()) msg += '信仰：'+faithText()+'\n';
  const ap = R.apt;
  msg += '初始资质：灵感'+ap.ling+' / 魅力'+ap.mei+' / 体质'+ap.ti+' / 信仰'+ap.xin+'（按〈属性与检定法则〉写入主角.资质，AI不得擅改；未出现此行则用默认10/10/10/0）\n';
  if(R.hero.bg) msg += '前尘往事：'+R.hero.bg+'\n';
  if(R.hero.outfit) msg += '当前服装：'+R.hero.outfit+'\n';
  if(R.hero.inventory) msg += '行囊：'+R.hero.inventory+'\n';
  const initLv = R.pLevel ? R.pLevel : (mode==='blessed'?'Lv.5':mode==='trial'?'Lv.1':mode==='woven'?'Lv.3':'由背景决定');
  msg += '初始等级：'+(R.pLevel||initLv)+'（Lv.1~220，按对应T阶与等级公式生成）\n';
  if(R.companion==='none' || !R.companion){
    msg += '心界住民：无（系统播报使用无人格旁白）\n';
  }else if(R.companion==='comp_random'){
    msg += '心界住民：命运随机（种族：'+(R.compRandRace||'由AI抽取')+'；名字与性格由AI依种族拟定，职能与输出格式遵循【心界住民系统】条目）\n';
  }else if(R.companion==='comp_custom'){
    const cc=[['名字',R.compCustom.name],['种族',R.compCustom.race],['性格与语癖',R.compCustom.persona],['心象外形',R.compCustom.look],['来历',R.compCustom.origin],['实体化路线愿景',R.compCustom.route]];
    const filled=cc.filter(p=>p[1]&&p[1].trim()).map(p=>p[0]+'：'+p[1].trim());
    const empt=cc.filter(p=>!(p[1]&&p[1].trim())).map(p=>p[0]);
    msg += '心界住民：玩家自定义住民。';
    if(filled.length) msg += '玩家已定（AI不得擅改）：'+filled.join('；')+'。';
    if(empt.length) msg += '以下维度由AI按【心界住民系统】与所选种族补全：'+empt.join('/')+'。';
    msg += '职能与输出格式遵循【心界住民系统】条目，好感阶段规则与预设住民一致（见该条目·好感与进化通则）\n';
  }else{
    msg += '心界住民：'+(COMP_SHORT[R.companion]||'')+'（预设，性格/口癖/实体化路线严格按其专属条目执行）\n';
  }
  msg += '开局地点：'+(region?region.n:'随机');
  if(R.region==='custom' && R.regionCustom) msg += '（'+R.regionCustom+'）';
  msg += '\n';
  let hasRel=false; R.bonds.forEach(e=>{if(e.rel)hasRel=true;});
  if(hasRel){
    msg += '\n【初始羁绊】\n';
    const preFall=(R.timeline==='before');
    let anyHero=false;
    if(preFall) msg += '（时间线为「堕落之前」：未特别标注形态的女主角色默认以人类/半精灵等堕落前形态登场，魔物化通常在雷斯卡特耶沦陷的剧情发生后出现）\n';
    R.bonds.forEach(entry=>{
      if(!entry.rel) return;
      const npc = entry.npc;
      const fm = npcForm(npc,entry);
      msg += '- '+npc.n+'（'+fm.rc+'）\n';
      msg += '  关系：'+entry.rel.n+(entry.dir?' / '+entry.dir.n:'')+'\n';
      msg += '  含义：'+entry.rel.d+'\n';
      if(npc.lv){
        const lvF=(npc.rc0?(entry.form||'auto'):'monster');
        const lvV=lvF==='human'?(npc.lv0||npc.lv):(lvF==='monster'?npc.lv:(preFall?npc.lv0:npc.lv));
        msg += '  等级参考：Lv.'+lvV+((npc.rc0&&lvF!=='monster')?'（人类时期·新手）':'（魔物娘时期·魔物化后力量大幅跃升）')+'\n';
      }
      if(npc.rc0){
        anyHero=true;
        const fv=entry.form||'auto';
        if(fv==='human') msg += '  初始形态：人类——'+(npc.d0||'')+'（玩家指定）\n';
        else if(fv==='monster') msg += '  初始形态：'+npc.rc+'——已魔物化（玩家指定：因玩家因果或其它原因，早于常规时间线魔物化）\n';
        else if(preFall) msg += '  初始形态：人类——'+(npc.d0||'')+'\n';
        else msg += '  初始形态：'+npc.rc+'\n';
      }
      if(npc.custom && npc.d) msg += '  备注：'+npc.d+'\n';
      if(npc.rand) msg += '  （此角色由命运随机安排，请由AI为其命名并补全形象、性格与来历，须符合其种族图鉴设定）\n';
      else if(npc.custom) msg += '  （此角色为玩家自定义，请由AI依据以上信息补全其形象与来历）\n';
    });
    if(anyHero) msg += '（请在初始化变量时把上述女主的初始形态写入 羁绊.{角色名}.当前形态：「人类形态」或「魔物形态」，并把等级参考写入 羁绊.{角色名}.等级——人类时期为第一阶新手等级，魔物娘时期大幅跃升，阶层换算按〈等级属性与状态栏体系〉；此后个别女主若因剧情因果提前魔物化、抵抗侵蚀保持人类或远离事件区暂缓魔物化，也以剧情事实更新该字段为准，勿机械跟随全局时间线）\n';
  }
  msg += '\n请按照以上配置展开第一幕。';
  if(hasRel) msg += '根据【初始羁绊】安排对应角色在开局中出现或被提及。';
  return msg;
}

/* ---- 配置存档（与欢迎页面 mge_profiles_v2 兼容） ---- */
function collectProfile(){
  const comps=[]; R.bonds.forEach((entry,npcId)=>{ comps.push({npcId:npcId,rel:entry.rel?entry.rel.v:null,dir:entry.dir?entry.dir.v:null,catOpen:entry.catOpen,form:entry.form||null}); });
  return {mode:R.tone,timeline:R.timeline,tlCustom:R.tlCustom,identity:R.identity,race:R.race,raceCustom:R.identityCustom,
    name:R.hero.name,gender:R.hero.gender,age:R.hero.age,height:R.hero.appearance,faction:R.hero.faction,
    bg:R.hero.bg,outfit:R.hero.outfit,inventory:R.hero.inventory,pLevel:R.pLevel,apt:R.apt,aptMode:R.aptMode,
    region:R.region,locCustom:R.regionCustom,comps:comps,customNpcs:R.customNpcs,
    companion:R.companion,compName:R.compCustom.name,compRace:R.compCustom.race,compRandRace:R.compRandRace,
    compPersona:R.compCustom.persona,compLook:R.compCustom.look,compOrigin:R.compCustom.origin,compRoute:R.compCustom.route,
    faith:R.faith,faithCustom:R.faithCustom};
}
function profileSave(){
  try{
    const data=collectProfile();
    data.savedAt=new Date().toISOString();
    data.label=(R.hero.name||'旅人')+' '+new Date().toLocaleString();
    let list=[]; try{ list=JSON.parse(localStorage.getItem('mge_profiles_v2')||'[]'); }catch(e){}
    list.unshift(data); if(list.length>10) list=list.slice(0,10);
    localStorage.setItem('mge_profiles_v2',JSON.stringify(list));
    notify('配置已保存：'+(R.hero.name||'旅人'),'gild',3000);
  }catch(e){ notify('当前环境不支持保存','warn',3000); }
}
function profileLoad(){
  let list=[]; try{ list=JSON.parse(localStorage.getItem('mge_profiles_v2')||'[]'); }catch(e){}
  if(!list.length){ notify('没有已保存的配置','warn',3000); return; }
  const d = list[0];
  const nr = freshR();
  nr.step = R.step;
  nr.tone=d.mode||null; nr.timeline=d.timeline||null; nr.tlCustom=d.tlCustom||'';
  nr.identity=d.identity||null; nr.identityCustom=d.raceCustom||''; nr.race=d.race||null;
  nr.hero.name=d.name||''; nr.hero.gender=d.gender||''; nr.hero.age=d.age||''; nr.hero.appearance=d.height||'';
  nr.hero.faction=d.faction||''; nr.hero.bg=d.bg||''; nr.hero.outfit=d.outfit||''; nr.hero.inventory=d.inventory||'';
  nr.pLevel=d.pLevel||''; nr.apt=d.apt||{ling:10,mei:10,ti:10,xin:0}; nr.aptMode=d.aptMode||'pool';
  nr.region=d.region||null; nr.regionCustom=d.locCustom||'';
  nr.customNpcs=d.customNpcs||[];
  nr.companion=d.companion||null; nr.compRandRace=d.compRandRace||'';
  nr.compCustom={name:d.compName||'',race:d.compRace||'',persona:d.compPersona||'',look:d.compLook||'',origin:d.compOrigin||'',route:d.compRoute||''};
  nr.faith=d.faith||null; nr.faithCustom=d.faithCustom||'';
  nr.bonds=new Map();
  (d.comps||[]).forEach(c=>{
    const npc=(RT.bonds||[]).concat(nr.customNpcs).find(n=>n.id===c.npcId);
    if(!npc) return;
    let rel=null;
    if(c.rel){ (RT.relations||[]).forEach(cat=>{ cat.rels.forEach(r=>{ if(r.v===c.rel) rel=r; }); }); }
    const dir=c.dir?(RT.directions||[]).find(x=>x.v===c.dir)||null:null;
    nr.bonds.set(c.npcId,{npc:npc,rel:rel,dir:dir,catOpen:c.catOpen??null,form:c.form||null});
  });
  R = nr;
  notify('已读取：'+(d.label||'配置'),'gild',3000);
  renderRitual(true);
}
function resetAll(){
  R = freshR();
  renderRitual();
}

/* ============ 渲染与绑定 ============ */
function renderRitual(keepScroll){
  const rbOld = keepScroll ? rit.querySelector('.rit-body') : null;
  const stOld = rbOld ? rbOld.scrollTop : 0;
  const stepTitles = RT.stepLabels || ['塑造此身','心界住民','宿命羁绊','开局地点','启程'];
  let body = '';
  if(R.step===0) body = bodyStep0();
  else if(R.step===1) body = bodyStep1();
  else if(R.step===2) body = bodyStep2();
  else if(R.step===3) body = bodyStep3();
  else body = bodyStep4();
  rit.innerHTML = `
    <header class="rit-head">
      <div class="rit-latin">Ritvs Initii</div>
      <h3>启封仪典</h3>
      ${stepCrumbs()}
    </header>
    <div class="rit-body">
      <div class="chapter-tag"><h2>${esc(stepTitles[R.step])}</h2><span class="ct-rule"></span><span class="ct-latin">GRADVS ${['I','II','III','IV','V'][R.step]}</span></div>
      ${body}
    </div>
    <footer class="rit-foot">
      <button class="rf-step prev" id="rit-prev" ${R.step===0?'disabled':''}>${ICON.chevL}<span>上一步</span></button>
      ${R.step===4?`<button class="rit-enter" id="rit-enter">${ICON.seal}<span>以此身入世</span></button>`:'<span></span>'}
      ${R.step<4?`<button class="rf-step next" id="rit-next"><span>下一步</span>${ICON.chevR}</button>`:'<span></span>'}
    </footer>`;
  const pb = rit.querySelector('#rit-prev'); if(pb) pb.addEventListener('click', ()=>{ if(R.step>0){R.step--;renderRitual();} });
  const nb = rit.querySelector('#rit-next'); if(nb) nb.addEventListener('click', ()=>{ if(R.step<4){R.step++;renderRitual();} });
  const en = rit.querySelector('#rit-enter'); if(en) en.addEventListener('click', ()=>closeRitual(true));

  /* 选项卡（tone/timeline/identity/faith/companion/region 共用） */
  rit.querySelectorAll('.rit-opt[data-g]').forEach(b=>b.addEventListener('click', ()=>{
    const g = b.dataset.g;
    if(g==='tone'){
      if(b.dataset.id!=='custom'){ autoFill(b.dataset.id); }
      else { R.tone='custom'; R.rollSummary=''; R.timeline=null; R.identity=null; R.race=null; }
    }
    else if(g==='companion' && b.dataset.id==='comp_random' && R.companion!=='comp_random'){
      R.companion='comp_random';
      R.compRandRace = pick(RT.companionRandomRaces||[]);
      notify('心界降临：'+R.compRandRace+'（名字由AI拟定）','gild',3000);
    }
    else if(g==='companion' && R[g]===b.dataset.id){ R[g]=null; }
    else R[g]=b.dataset.id;
    renderRitual(true);
  }));
  /* 种族 */
  rit.querySelectorAll('.race-cat').forEach(b=>b.addEventListener('click', ()=>{
    const ci=+b.dataset.rcat; R.raceAcc = (R.raceAcc===ci?null:ci); renderRitual(true);
  }));
  rit.querySelectorAll('[data-race]').forEach(b=>b.addEventListener('click', ()=>{
    if(b.dataset.race==='__custom__'){ R.race='__custom__'; R.identity='custom'; }
    else R.race = b.dataset.race;
    renderRitual(true);
  }));
  /* 快速重掷 / 资质 / 等级 */
  const rr = rit.querySelector('#rit-reroll');
  if(rr) rr.addEventListener('click', ()=>{ autoFill(R.tone); renderRitual(true); });
  rit.querySelectorAll('.ra-btn').forEach(b=>b.addEventListener('click', ()=>{
    if(R.aptMode==='roll') return;
    const k=b.dataset.apt, d=+b.dataset.d;
    const nv = R.apt[k]+d;
    if(d>0 && (R.apt[k]>=20 || aptSum()>=APT_POOL)) return;
    if(d<0 && R.apt[k]<=APT_MIN[k]) return;
    if(nv<0||nv>20) return;
    R.apt[k]=nv; renderRitual(true);
  }));
  rit.querySelectorAll('[data-am]').forEach(b=>b.addEventListener('click', ()=>{
    const m=b.dataset.am;
    if(m==='pool'){ R.aptMode='pool'; R.apt={ling:10,mei:10,ti:10,xin:0}; }
    else { R.aptMode='roll'; rollApt(); }
    renderRitual(true);
  }));
  function rollApt(){
    const r4d6=()=>{ const a=[1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)].sort((x,y)=>y-x); return a[0]+a[1]+a[2]; };
    R.apt={ling:Math.min(20,r4d6()),mei:Math.min(20,r4d6()),ti:Math.min(20,r4d6()),xin:0};
  }
  rit.querySelectorAll('[data-pl]').forEach(b=>b.addEventListener('click', ()=>{
    const ix=+b.dataset.pl; R.pLevel = LEVEL_PRESETS[ix]||''; renderRitual(true);
  }));
  const lvc = rit.querySelector('#lv-custom');
  if(lvc) lvc.addEventListener('change', ()=>{
    const v = parseInt(lvc.value, 10);
    if(!v || v<1 || v>220){ notify('自定义等级请输入 1-220','warn',3000); return; }
    R.pLevel = 'Lv.'+v; renderRitual(true);
    notify('初始等级设为 Lv.'+v,'gild',1500);
  });
  const lvRoll = rit.querySelector('[data-level-roll]');
  if(lvRoll) lvRoll.addEventListener('click', ()=>{
    R.pLevel='Lv.'+(1+Math.floor(Math.random()*220));
    notify('命运掷骰：'+R.pLevel,'gild',2200); renderRitual(true);
  });
  /* 羁绊 */
  rit.querySelectorAll('.bnd-hd[data-bnpc]').forEach(b=>b.addEventListener('click', (e)=>{
    if(e.target && e.target.closest && e.target.closest('[data-delnpc]')) return;
    const id=b.dataset.bnpc;
    const npc=allBonds().find(n=>n.id===id); if(!npc) return;
    if(R.bonds.has(id)) R.bonds.delete(id);
    else {
      if(R.bonds.size>=MAX_BONDS){ notify('宿命羁绊至多 '+MAX_BONDS+' 位——先放下一段，再拾起另一段。','warn',3000); return; }
      R.bonds.set(id,{npc:npc,rel:null,dir:null,catOpen:null,form:null});
    }
    renderRitual(true);
  }));
  rit.querySelectorAll('[data-delnpc]').forEach(b=>b.addEventListener('click', (e)=>{
    e.stopPropagation();
    const id=b.dataset.delnpc;
    R.customNpcs=(R.customNpcs||[]).filter(n=>n.id!==id);
    R.bonds.delete(id); renderRitual(true);
  }));
  rit.querySelectorAll('[data-fnpc]').forEach(b=>b.addEventListener('click', (e)=>{
    e.stopPropagation();
    const entry=R.bonds.get(b.dataset.fnpc); if(!entry) return;
    entry.form=b.dataset.fv; renderRitual(true);
  }));
  rit.querySelectorAll('[data-rci]').forEach(b=>b.addEventListener('click', ()=>{
    const entry=R.bonds.get(b.dataset.bnpcr); if(!entry) return;
    const ci=+b.dataset.rci;
    entry.catOpen=(entry.catOpen===ci?null:ci); renderRitual(true);
  }));
  rit.querySelectorAll('[data-rv]').forEach(b=>b.addEventListener('click', ()=>{
    const entry=R.bonds.get(b.dataset.bnpcr); if(!entry) return;
    const cat=(RT.relations||[])[entry.catOpen]; if(!cat) return;
    const rel=cat.rels.find(r=>r.v===b.dataset.rv);
    entry.rel=(entry.rel&&entry.rel.v===b.dataset.rv)?null:rel;
    if(!entry.rel) entry.dir=null; else if(!entry.dir) entry.dir=(RT.directions||[])[1]||null;
    renderRitual(true);
  }));
  rit.querySelectorAll('[data-rdw]').forEach(b=>b.addEventListener('click', ()=>{
    const entry=R.bonds.get(b.dataset.bnpcr); if(!entry) return;
    entry.dir=(RT.directions||[]).find(d=>d.v===b.dataset.rdw)||null; renderRitual(true);
  }));
  rit.querySelectorAll('[data-xbond]').forEach(b=>b.addEventListener('click', ()=>{
    R.bonds.delete(b.dataset.xbond); renderRitual(true);
  }));
  /* 自定义/随机 NPC */
  const cnpT = rit.querySelector('#cnp-toggle');
  if(cnpT) cnpT.addEventListener('click', ()=>{ R.customNpcForm=!R.customNpcForm; renderRitual(true); });
  rit.querySelectorAll('[data-cnp]').forEach(el=>el.addEventListener('input', ()=>{ R.cnp[el.dataset.cnp]=el.value; }));
  const cnpAdd = rit.querySelector('#cnp-add');
  if(cnpAdd) cnpAdd.addEventListener('click', ()=>{
    if(R.bonds.size>=MAX_BONDS){ notify('宿命羁绊至多 '+MAX_BONDS+' 位','warn',3000); return; }
    const npc={id:'c'+Date.now(),n:(R.cnp.name||'').trim()||'？？？（由AI命名）',rc:(R.cnp.race||'').trim()||'未知',d:(R.cnp.desc||'').trim(),custom:true,cat:'自定义'};
    R.customNpcs.push(npc);
    R.bonds.set(npc.id,{npc:npc,rel:null,dir:null,catOpen:null,form:null});
    R.cnp={name:'',race:'',desc:''}; R.customNpcForm=false;
    renderRitual(true);
  });
  const randNpc = rit.querySelector('#bond-rand-npc');
  if(randNpc) randNpc.addEventListener('click', ()=>{
    if(R.bonds.size>=MAX_BONDS){ notify('宿命羁绊至多 '+MAX_BONDS+' 位','warn',3000); return; }
    const cat=pick(RACE_CATS); const race=pick(cat?cat.items:[]);
    const npc={id:'r'+Date.now(),n:'？？？（由AI命名）',rc:race,
      d:'命运随机安排的邂逅。她的名讳与来历，将在旅途中揭晓。',custom:true,rand:true,cat:'自定义'};
    R.customNpcs.push(npc);
    R.bonds.set(npc.id,{npc:npc,rel:null,dir:null,catOpen:null,form:null});
    notify('命运掷骰：'+race,'gild',2500); renderRitual(true);
  });
  /* NPC 索引筛选 */
  rit.querySelectorAll('[data-nix]').forEach(b=>b.addEventListener('click', ()=>{
    const key=b.dataset.nix, v=b.dataset.v, NF=R.npcFilter;
    if(key==='reset'){ NF.race=[];NF.reg=[];NF.lv=[]; }
    else if(v==='__all__'){ NF[key]=[]; }
    else { const i=NF[key].indexOf(v); if(i>=0)NF[key].splice(i,1); else NF[key].push(v); }
    renderRitual(true);
  }));
  /* 输入框（不触发重绘） */
  rit.querySelectorAll('[data-hero]').forEach(el=>el.addEventListener('input', ()=>{ R.hero[el.dataset.hero]=el.value; }));
  rit.querySelectorAll('[data-cc]').forEach(el=>el.addEventListener('input', ()=>{ R.compCustom[el.dataset.cc]=el.value; }));
  rit.querySelectorAll('[data-rc]').forEach(el=>el.addEventListener('input', ()=>{ R[el.dataset.rc]=el.value; }));
  /* 搜索框（触发重绘 + 焦点归还）；输入法组词期间不重绘，compositionend 再刷新，避免拼音被打断 */
  const imeBind = (el, set) => {
    if(!el) return;
    el.addEventListener('input', (e)=>{ set(el.value); if(e.isComposing) return; rerenderKeepFocus(el.id, el); });
    el.addEventListener('compositionend', ()=>{ set(el.value); rerenderKeepFocus(el.id, el); });
  };
  imeBind(rit.querySelector('#race-q'), v=>{ R.raceQ=v; });
  imeBind(rit.querySelector('#npc-q'), v=>{ R.npcSearch=v; });
  /* 存档 / 重置 */
  const ps = rit.querySelector('#prof-save'); if(ps) ps.addEventListener('click', profileSave);
  const pl = rit.querySelector('#prof-load'); if(pl) pl.addEventListener('click', profileLoad);
  const rst = rit.querySelector('#rit-reset'); if(rst) rst.addEventListener('click', resetAll);

  rit.querySelector('.rit-body').scrollTop = keepScroll ? stOld : 0;
}
function rerenderKeepFocus(id, el){
  const pos = { s: el.selectionStart, e: el.selectionEnd };
  renderRitual(true);
  const el2 = document.getElementById(id);
  if(el2){ el2.focus(); try{ el2.setSelectionRange(pos.s,pos.e); }catch(e){} }
}

window.__ritStep = n => { if(R){ R.step = Math.max(0, Math.min(4, n)); renderRitual(); } };
window.__ritMsg = ()=> buildMsg();
window.__ritual = {
  isOpen: ()=>rit.classList.contains('open'),
  close: ()=>closeRitual(false),
  toCover: ()=>{ rit.classList.remove('open'); tome.classList.remove('rit-on'); showCover(); },
};
})();
