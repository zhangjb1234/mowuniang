/* ================================================================
   启封仪典 · 开局向导 v2（满血移植自卡内欢迎页面；视觉沿用魔典书皮）
   对照原则：功能口径逐字对齐 welcome.html；buildMsg 逐行对齐原文 buildMsg()。
   数据：window.MODIAN_RITUAL（提取自动本息） + 本文件末尾的种族分类/基调指令。
   [修改 21] 六步：新增「Ⅲ 时间与女主」（纪年时间轴 + 女主出场/好感），宿命羁绊只留 NPC。
   ================================================================ */
(function(){
'use strict';
const RT = window.MODIAN_RITUAL || {stepLabels:['塑造此身','心界住民','宿命羁绊','开局地点','启程']};
/* [修改 21] 步骤名在这里覆盖，不改 ritual-data.js */
const STEP_LABELS = ['塑造此身','心界住民','时间与女主','宿命羁绊','开局地点','启程'];
const LAST = STEP_LABELS.length - 1;
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
const COMP_SHORT = {familiar:'魔宠·菲娜',mare:'梦魔·露珂',pixie:'小仙女·蒂蒂',ghost:'幽灵·塞蕾丝',valkyrie:'女武神·西格露恩',banshee:'报丧女妖·莫伊菈',witch:'白蛇·雪代白子'};
const MAX_BONDS = (RT.rules && RT.rules.maxBonds) || 4;
const APT_DEFS = [['ling','灵感','洞察与学习·信息与熟练度'],['mei','魅力','言谈交际·说服而非交战'],['ti','体质','耐力根基·后续扩展体质池'],['xin','信仰','神恩强度·对象不固定']];
const APT_MIN = {ling:1,mei:1,ti:1,xin:0};
const APT_POOL = (RT.rules && RT.rules.aptitude && RT.rules.aptitude.pool) || 30;
const LEVEL_PRESETS = ['Lv.10','Lv.30','Lv.50','Lv.70','Lv.90','Lv.110','Lv.130','Lv.150','Lv.170','Lv.190','Lv.210'];

/* ---- [修改 21] 纪年：圣历 = 魔王历 + 1846；R.tOff = 距雷斯卡特耶沦陷的年数（负=沦陷前，0=沦陷当年，算已沦陷） ---- */
const CAL = { shift:1846, fall:1200, plan:1180, era:1260 };
const T_MIN = 1 - CAL.fall;
const ERA_OFF = CAL.era - CAL.fall;
const LOCK_BEFORE = -25;
const mwYear = off => CAL.fall + off;
const shYear = off => CAL.fall + off + CAL.shift;
const mwText = off => mwYear(off) === 1 ? '元年' : mwYear(off) + ' 年';
const isFallen = off => off != null && off >= 0;
function relText(off){
  if(off == null) return '交由命运';
  return off < 0 ? '沦陷前 '+(-off)+' 年' : off === 0 ? '沦陷当年' : '沦陷后 '+off+' 年';
}
function eraText(off){
  if(off == null) return '交由命运';
  return '魔王历 '+mwText(off)+' · 圣历 '+shYear(off)+' 年 · '+relText(off);
}
function clampOff(v){
  const n = Math.round(Number(v));
  return isFinite(n) ? Math.max(T_MIN, n) : null;
}
/* 刻度非线性：左半段「线性 + 三次方」（越靠近沦陷越细，紧挨节点也能选到 1 年），0..+60 缓幂，+60 以后线性到 +300（数字框不设上限） */
const S_MAX = 1000, S_FALL = 500, S_ERA = 820, TAIL_OFF = 300, LIN_L = 30, LIN_R = 10;
const curveL = u => LIN_L * u + (-T_MIN - LIN_L) * u * u * u;
const curveR = v => LIN_R * v + (ERA_OFF - LIN_R) * Math.pow(v, 1.6);
function sliderToOff(sv){
  const x = Math.max(0, Math.min(S_MAX, Number(sv) || 0));
  if(x < S_FALL) return -Math.max(1, Math.round(curveL((S_FALL - x) / S_FALL)));
  if(x <= S_ERA) return Math.round(curveR((x - S_FALL) / (S_ERA - S_FALL)));
  return ERA_OFF + Math.round((TAIL_OFF - ERA_OFF) * (x - S_ERA) / (S_MAX - S_ERA));
}
function invert(f, target){
  let lo = 0, hi = 1;
  for(let i = 0; i < 32; i++){ const mid = (lo + hi) / 2; if(f(mid) < target) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
function offToSlider(off){
  if(off < 0) return S_FALL - S_FALL * invert(curveL, Math.min(-T_MIN, -off));
  if(off <= ERA_OFF) return S_FALL + (S_ERA - S_FALL) * invert(curveR, off);
  return Math.min(S_MAX, S_ERA + (S_MAX - S_ERA) * (off - ERA_OFF) / (TAIL_OFF - ERA_OFF));
}
const pctOf = off => offToSlider(off) / S_MAX * 100;

/* ---- [修改 21] 开局女主：名册 = ritual-data 的 bonds（16 位，含堤露埃拉） ---- */
const HR_GROUPS = [['勇者小队','第一部 · 勇者小队'],['魔界骑士','第二部 · 雷斯卡特耶的魔界骑士']];
const HEROINES = ()=> RT.bonds || [];
const heroById = id => HEROINES().find(h=>h.id===id) || null;
const clampFav = v => Math.max(0, Math.min(100, Math.round(Number(v)) || 0));
/* 没有人类时期的（堤露埃拉）不受「尚未登场」限制 */
const heroLocked = h => !!h.rc0 && R.tOff != null && R.tOff < LOCK_BEFORE;
function heroPersona(h, off){
  if(!h.rc0) return {rc:h.rc, d:h.d, lv:h.lv, human:false};
  if(off == null) return null;
  return isFallen(off) ? {rc:h.rc, d:h.d, lv:h.lv, human:false} : {rc:h.rc0, d:h.d0, lv:h.lv0, human:true};
}
function activeHeroines(){
  return HEROINES().filter(h=>R.heroines.has(h.id) && !heroLocked(h)).map(h=>[h, R.heroines.get(h.id)]);
}
const isPresetId = id => HEROINES().some(h=>h.id===id);

const tomeEl = document.getElementById('tome');
const rit = document.createElement('section');
rit.id = 'ritual'; rit.className = 'ritual'; rit.setAttribute('aria-label','启封仪典');
tomeEl.appendChild(rit);

let R = null;
function freshR(){
  return { step:0, tone:null, tOff:null, tlCustom:'', heroines:new Map(), identity:null, identityCustom:'',
    race:null, hero:{name:'',gender:'',age:'',appearance:'',faction:'',bg:'',outfit:'',inventory:''},
    pLevel:'', apt:{ling:10,mei:10,ti:10,xin:0}, aptMode:'pool', tuneLeft:6,
    faith:null, faithCustom:'',
    companion:null,
    bonds:new Map(), customNpcs:[], region:null, regionCustom:'',
    customNpcForm:false, cnp:{name:'',race:'',desc:''},
    rollSummary:'' };
}
const aptSum = ()=> APT_DEFS.reduce((s,[k])=>s+R.apt[k],0);
const pick = arr => (arr && arr.length) ? arr[Math.floor(Math.random()*arr.length)] : '';
const pools = ()=> RT.pools || {};
const allBonds = ()=> R.customNpcs || [];
const pickName = (list,id)=>{ const x=(list||[]).find(o=>o.id===id); return x?noEmoji(x.n):id; };

window.openRitual = function(){
  if(!R){
    const d = readDraft();
    let st = d ? (d.step|0) : 0;
    if(d && !d.layout && st >= 2) st += 1;
    R = d ? profileApply(d, Math.max(0, Math.min(LAST, st))) : freshR();
    if(d && [0,1,2,3,4].some(stepFilled)) notify('已接着上次未完成的仪典继续（「重置」可清空）。','gild',3200);
  }
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
  // 2. 开局时间随机（眷顾=沦陷后更安全；试炼偏向沦陷前；变数在沦陷前后小幅摆动）
  R.tOff = toneId==='blessed' ? pick([1,2,3,5]) : toneId==='trial' ? pick([-1,-2,-3,1]) : pick([-3,-2,-1,0,1,2,3]);
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
  // 5. 住民随机（七位之一）
  R.companion = pick(['familiar','mare','pixie','ghost','valkyrie','banshee','witch']);
  // 横幅
  const toneName = pickName(RT.tones,toneId);
  const tlName = relText(R.tOff);
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
    clearDraft();
    showAwaiting();
    enterDraft(buildMsg());
    notify('仪典已成——开局定稿已誊入信笺，过目后寄出。','gild',5200);
  }else{
    showCover();
  }
}

/* ============ 渲染（每步一次整体重绘；交互用 render(true) 保滚动） ============ */
let freshSel = '';
function optCard(group, o, desc){
  const sel = R[group]===o.id ? (freshSel===group+':'+o.id ? ' sel fresh' : ' sel') : '';
  return `<button class="rit-opt${sel}" data-g="${group}" data-id="${esc(o.id)}">
    <b>${esc(noEmoji(o.n))}</b>${desc!==false&&o.d?`<i>${esc(o.d)}</i>`:''}</button>`;
}
const STEP_NUM = ['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ'];
let turnDir = 0;
function stepFilled(i){
  if(!R) return false;
  if(i===0) return !!(R.tone || R.identity || R.faith || R.pLevel ||
    Object.keys(R.hero).some(k=>String(R.hero[k]||'').trim()));
  if(i===1) return !!R.companion;
  if(i===2) return R.tOff != null || R.heroines.size > 0;
  if(i===3) return R.bonds.size > 0;
  if(i===4) return !!R.region;
  return false;
}
function goStep(n, fromSum){
  n = Math.max(0, Math.min(LAST, n|0));
  if(fromSum) R.fromSum = true;
  if(n===LAST) R.fromSum = false;
  R.profOpen = false;
  if(n===R.step){ renderRitual(true); return; }
  turnDir = n > R.step ? 1 : -1;
  R.step = n;
  renderRitual();
}
function stepCrumbs(){
  return `<nav class="rit-crumbs" aria-label="仪典步骤">${STEP_LABELS.map((s,i)=>{
    const st = i===R.step ? ' on' : stepFilled(i) ? ' done' : '';
    const sep = i ? `<span class="rc-sep${i<=R.step?' lit':''}"></span>` : '';
    const cur = i===R.step ? ' aria-current="step"' : '';
    return `${sep}<button type="button" class="rc-step${st}" data-goto="${i}"${cur} title="跳到「${esc(s)}」"><em>${STEP_NUM[i]}</em>${esc(s)}</button>`;
  }).join('')}</nav>`;
}

function bodyStep0(){
  const toneChosen = R.tone && R.tone!=='custom';
  return `
  <div class="sec-title">命运基调 · 快速开局${toneChosen?`<span class="rit-reroll"><button id="rit-reroll">以此基调重掷</button></span>`:''}</div>
  <div class="rit-grid">${(RT.tones||[]).map(o=>optCard('tone',o)).join('')}</div>
  ${R.rollSummary?`<div class="rr-banner">${esc(R.rollSummary)}</div>`:''}
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
    <label class="wide">前尘往事<textarea data-hero="bg" rows="4" placeholder="你睁开眼之前的来历——可多行书写，留空由AI按基调拟定">${esc(R.hero.bg)}</textarea></label>
    <label class="wide">服装<input data-hero="outfit" type="text" value="${esc(R.hero.outfit)}" placeholder="当前衣着，留空由AI按设定拟定"></label>
    <label class="wide">行囊<textarea data-hero="inventory" rows="3" placeholder="随身之物与资产——原文档照搬，留空由AI按设定拟定">${esc(R.hero.inventory)}</textarea></label>
  </div>
  <div class="sec-title">初始等级</div>
  <div class="rit-hintbar"><p class="rit-hint">T1平民阶 · T2正规阶 · T3精锐阶 · T4英杰阶 · T5英雄阶 · T6传说阶（无神力者天花板）· T7神话阶 · T8权柄阶 · T9半神阶（魔王位标准线）· T10神阶 · T11神王阶（当前世界现存0）。全大陆共220级、每阶约20级，所选档位即该阶起点级；阶内另有初期/中期/后期/巅峰四段成长。</p></div>
  <div class="rchip-row">${LEVEL_PRESETS.map((o,ix)=>`<button class="rchip${(R.pLevel||'')===o?' on':''}" data-pl="${ix}">${'T'+(ix+1)+' / '+o}</button>`).join('')}</div>
  <div class="rit-form"><label>自定义等级<span class="lv-wrap"><input id="lv-custom" type="number" min="1" max="220" value="${esc(String(R.pLevel||'').replace(/^Lv\./,''))}" placeholder="Lv.1 ~ 220（输入后回车或移开焦点即生效）"><button type="button" class="lv-roll" data-level-roll aria-label="等级随缘">随</button></span></label></div>
  <div class="sec-title">信仰 · 神缘之始</div>
  <div class="rit-hintbar"><p class="rit-hint">信仰即神缘，对象不固定——主神、堕落神、地方神明、魔王侧存在皆可侍奉，也可无信仰。它影响 NPC 好感与行为（同信仰者亲近、异信仰者或警戒），也影响你使用魔法/技能/道具的效果（同对象阵营的圣物祝福类效力加成）；检定上信仰负责神圣类与神缘检定。同对象行为得赐福，违背教义受削弱甚至惩罚；可以改宗，但旧神可能记仇。</p></div>
  <div class="rit-grid cols-4">${(RT.faiths||[]).map(o=>optCard('faith',o)).join('')}</div>
  ${(R.faith==='local'||R.faith==='custom')?`<div class="rit-form cwrap"><label class="wide">你信仰的是<input data-rc="faithCustom" type="text" value="${esc(R.faithCustom)}" placeholder="写下你侍奉的对象——地方神明或任意说得通的存在（由AI落进世界观）"></label></div>`:''}
  <div class="sec-title">资质 · 天赋之始<span class="rit-pool">${R.aptMode==='roll'?`骰点已掷 · 微调额度 <b>${R.tuneLeft!=null?R.tuneLeft:6}</b> / 6`:(`命运之余 <b>${APT_POOL-aptSum()}</b> / ${APT_POOL}`)}</span></div>
  <div class="rchip-row">
    <button class="rchip${R.aptMode!=='roll'?' on':''}" data-am="pool">点数池分配</button>
    <button class="rchip${R.aptMode==='roll'?' on':''}" data-am="roll">命运骰点</button>
    ${R.aptMode==='roll'?`<button type="button" class="rchip" data-am="reroll">重新骰点</button>`:''}
  </div>
  <p class="rit-hint">${R.aptMode==='roll'
    ? '4d6 取三高（信仰仍从 0 起步）；骰后送 6 点微调额度：＋消耗、−返还，可反复骰点取最后一次（重骰重置额度）。'
    : '剩余点数：'+String(APT_POOL-aptSum())+' / '+APT_POOL+(APT_POOL-aptSum()>0?'（点击 + 分配）':'（已分配完毕，点 − 可收回）')+(R.faith==='none'?'；无信仰时信仰点锁定为 0。':'')}</p>
  ${APT_DEFS.map(([k,n,d])=>`
    <div class="rit-apt"><span class="ra-name">${n}<i>${d}</i></span>
      ${R.aptMode==='roll'
        ? `<button class="ra-btn" data-apt="${k}" data-d="-1" ${(R.apt[k]<=APT_MIN[k])||(R.tuneLeft!=null?R.tuneLeft:6)>=6?'disabled':''}>−</button>
           <span class="ra-val">${R.apt[k]}</span>
           <button class="ra-btn" data-apt="${k}" data-d="1" ${R.apt[k]>=20||(R.tuneLeft!=null?R.tuneLeft:6)<=0?'disabled':''}>＋</button>`
        : `<button class="ra-btn" data-apt="${k}" data-d="-1" ${R.apt[k]<=APT_MIN[k]?'disabled':''}>−</button>
           <span class="ra-val">${R.apt[k]}</span>
           <button class="ra-btn" data-apt="${k}" data-d="1" ${R.apt[k]>=20||aptSum()>=APT_POOL||(k==='xin'&&R.faith==='none')?'disabled':''}>＋</button>`}
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
  <div class="rit-grid">${(RT.companions||[]).map(o=>optCard('companion',o)).join('')}</div>`;
}

function bodyTime(){
  const off = R.tOff, has = off != null;
  const p = has ? pctOf(off) : 50;
  const sv = Math.round(has ? offToSlider(off) : S_FALL);
  const node = (pos, cls, nm, mw, sh)=>`<div class="tl-node ${cls}" style="left:${pos}%"><i class="tl-dot"></i><b class="tl-nm">${nm}</b><span class="tl-cal">魔王历 ${mw}<br>圣历 ${sh}</span></div>`;
  const dir = !has ? '' : off < 0 ? '-' : off === 0 ? '0' : '+';
  const dirBtn = (d, t)=>`<button type="button" class="rchip${dir===d?' on':''}" data-tdir="${d}">${t}</button>`;
  const quick = [[-1,'沦陷前 1 年'],[0,'沦陷当年'],[1,'沦陷后 1 年'],[ERA_OFF,'魔界化时代'],[null,'交由命运']];
  const yrOff = !has || off === 0;
  return `
  <div class="sec-title">开局时间 · 你在哪一年睁开眼</div>
  <p class="rit-hint">拖动刻度选开局年份。雷斯卡特耶沦陷是这个世界的分水岭：沦陷之前，女主们仍是人类；沦陷当年起，她们已化为魔物娘。教团只用圣历，魔物侧通用魔王历（圣历 = 魔王历 + 1846）。</p>
  <div class="tl-box">
    <div class="tl-axis">
      <i class="tl-line"></i>
      <i class="tl-lockzone" style="width:${pctOf(LOCK_BEFORE).toFixed(2)}%"></i>
      <i class="tl-fill" style="transform:scaleX(${has?(p/100).toFixed(4):0})"></i>
      <i class="tl-tick" style="left:${pctOf(CAL.plan-CAL.fall).toFixed(2)}%" title="第四王女开始筹划 · 魔王历 1180 / 圣历 3026"></i>
      ${node(0,'start','魔王夫妇击败众神','元年','1847')}
      ${node(50,'mid','雷斯卡特耶沦陷','1200','3046')}
      ${node(pctOf(ERA_OFF).toFixed(2),'era','教团失败<br>世界魔界化','1260','3106')}
      <input type="range" class="tl-range" id="tl-range" min="0" max="${S_MAX}" step="1" value="${sv}" aria-label="开局年份" aria-valuetext="${esc(eraText(off))}">
      <div class="tl-mk-wrap${has?'':' unset'}" style="transform:translateX(${p.toFixed(2)}%)"><i class="tl-mk"></i></div>
    </div>
    <div class="tl-read" id="tl-read" aria-live="polite">${readoutHtml(off)}</div>
    <div class="rchip-row tl-ctl">
      <span class="rchip-lab">开局于</span>
      ${dirBtn('-','沦陷前')}${dirBtn('0','沦陷当年')}${dirBtn('+','沦陷后')}
      <label class="tl-yr"><input id="tl-year" type="number" inputmode="numeric" min="1"${dir==='-'?' max="'+(-T_MIN)+'"':''} value="${yrOff?'':Math.abs(off)}"${yrOff?' disabled':''} placeholder="${has?'':'先选前/后'}" aria-label="距沦陷的年数"><span>年</span></label>
    </div>
    <div class="rchip-row">${quick.map(([v,t])=>`<button type="button" class="rchip${off===v?' on':''}" data-tq="${v==null?'null':v}">${t}</button>`).join('')}</div>
    <p class="tl-legend"><span><i class="lg-tick"></i>第四王女开始筹划：沦陷前 20 年（魔王历 1180 / 圣历 3026）</span><span><i class="lg-lock"></i>虚线段：沦陷前 25 年以前，女主们尚未登场</span></p>
  </div>
  <div class="rit-form cwrap"><label class="wide">时间补充说明（可选）<input data-rc="tlCustom" type="text" value="${esc(R.tlCustom)}" placeholder="例：沦陷前夜的大雪 / 秋收节当天——随开局时间一起送往AI"></label></div>
  ${heroinesHtml()}`;
}
function readoutHtml(off){
  if(off == null) return `<b>交由命运</b><span>开局年份与雷斯卡特耶是否沦陷，由 AI 结合基调与身份决定</span>`;
  const f = isFallen(off);
  const who = off < LOCK_BEFORE ? '女主们尚未登场（堤露埃拉除外）' : f ? '女主以沦陷后的魔物娘人设登场' : '女主以沦陷前的人设登场';
  return `<b>魔王历 ${mwText(off)} · 圣历 ${shYear(off)} 年</b><span><em class="tl-st ${f?'fallen':'pre'}">${f?'已沦陷':'未沦陷'}</em>${relText(off)} · ${who}</span>`;
}
function heroCard(h){
  const e = R.heroines.get(h.id), lock = heroLocked(h), act = !!e && !lock;
  const P = heroPersona(h, R.tOff);
  const rc = P ? P.rc : h.rc0+' → '+h.rc;
  const lv = P ? (P.lv ? 'Lv.'+P.lv : '') : 'Lv.'+h.lv0+' → '+h.lv;
  const note = h.mnote && (!P || P.human) ? '（'+esc(h.mnote)+'）' : '';
  const desc = P
    ? `<b>${!h.rc0?'形态':P.human?'沦陷前':'沦陷后'}</b>：${esc(P.d||'')}${note}`
    : `<b>沦陷前</b>：${esc(h.d0||'')}${note}<br><b>沦陷后</b>：${esc(h.d||'')}`;
  return `<div class="bnd-item hr-card${act?' active':''}${lock?' locked':''}">
    <button type="button" class="hr-hd" data-hr="${esc(h.id)}" aria-pressed="${act?'true':'false'}"${lock?' aria-disabled="true"':''}>
      <span class="bnd-nm">${esc(h.n)}</span><span class="bnd-rc">${esc(rc)}</span>${lv?`<span class="hr-lv">${esc(lv)}</span>`:''}
      ${lock?`<span class="hr-lock">尚未登场${e?' · 已保留':''}</span>`:''}
      <span class="hr-sw" aria-hidden="true"></span>
    </button>
    <div class="bnd-desc">${desc}</div>
    ${act?`<label class="hr-fav"><span>好感度</span><input type="range" min="0" max="100" step="1" value="${e.fav}" data-hrfav="${esc(h.id)}" aria-label="${esc(h.n)} 初始好感度"><b class="hr-fav-v">${e.fav}</b></label>`:''}
  </div>`;
}
function heroinesHtml(){
  const kept = [...R.heroines.keys()].map(heroById).filter(h=>h && heroLocked(h)).length;
  const groups = HR_GROUPS.map(([g,title])=>{
    const list = HEROINES().filter(h=>(h.grp||'')===g);
    if(!list.length) return '';
    return `<div class="sec-title">${title}</div>
    <div class="rchip-row hr-act"><button type="button" class="rchip" data-hrgrp="${esc(g)}" data-on="1">全部出场</button><button type="button" class="rchip" data-hrgrp="${esc(g)}" data-on="0">取消</button></div>
    <div class="hr-grid">${list.map(heroCard).join('')}</div>`;
  }).join('');
  return `
  <div class="sec-title sv-cinnabar">开局女主 · 谁会出现在你的序章<span class="rit-pool">已择 <b>${activeHeroines().length}</b> 位</span></div>
  <p class="rit-hint">勾选开局即登场（或被提及）的女主，再拉好感度条定下初始好感（0–100）。不勾选的女主开局不会被提起；人设随上方时间自动切换。</p>
  ${kept?`<p class="rit-hint hr-warn">开局早于沦陷前 25 年：已勾选的 ${kept} 位暂不出场（选择仍保留，把时间往后拨即可恢复）。</p>`:''}
  ${groups}`;
}

function bondEntry(id){ return R.bonds.get(id) || {rel:null,dir:null,catOpen:null}; }
function bodyNpc(){
  const max = MAX_BONDS;
  const items = allBonds().map(npc=>{
    const entry = R.bonds.get(npc.id);
    const relBar = entry ? buildRelBar(npc,entry) : '';
    return `<div class="bnd-item${entry?' active':''}">
      <div class="bnd-hd" data-bnpc="${esc(npc.id)}">
        <span class="bnd-nm">${esc(npc.n)}</span><span class="bnd-rc">${esc(npc.rc||'')}</span>
        <span class="bnd-rc is-custom">${npc.rand?'随机':'自定义'}</span>
        ${entry&&entry.rel?`<span class="bnd-rel">${esc(entry.rel.n)}${entry.dir?(' · '+esc(entry.dir.n)):''}</span>`:''}
        <button class="bnd-del" data-delnpc="${esc(npc.id)}">✕ 移除</button>
      </div>
      ${npc.d?`<div class="bnd-desc">${esc(npc.d)}</div>`:''}
      ${relBar}
    </div>`;
  }).join('');
  return `
  <div class="sec-title">宿命羁绊 · 旅途中的旧识<span class="rit-pool">已择 <b>${R.bonds.size}</b> / ${max} 位</span></div>
  <div class="rit-hintbar"><p class="rit-hint">安排开局时与你有过交集的其他角色：自定义一位，或交给命运随机。女主们在「Ⅲ 时间与女主」里勾选出场与好感。点角色名可选中或放下，选中后再定关系。</p>
    <div class="rchip-row">
      <button type="button" class="rchip" id="cnp-toggle">添加自定义角色</button>
      <button type="button" class="rchip" id="bond-rand-npc">随机魔物娘羁绊</button>
    </div></div>
  ${R.customNpcForm?`
  <div class="rit-form cwrap">
    <label>名字<input data-cnp="name" type="text" value="${esc(R.cnp.name)}" placeholder="？？？（由AI命名）"></label>
    <label>种族<input data-cnp="race" type="text" value="${esc(R.cnp.race)}" placeholder="可填 人类 / 任意图鉴种族；未知即由AI拟定"></label>
    <label class="wide">快捷种族<span class="cnp-qrace"><button type="button" class="rchip" data-cnpq="人类">人类</button><button type="button" class="rchip" data-cnpq="人类女性">人类女性</button><button type="button" class="rchip" data-cnpq="魔物娘（种族由AI拟）">魔物娘</button><button type="button" class="rchip" data-cnpq="精灵">精灵</button><button type="button" class="rchip" data-cnpq="兽人">兽人</button><button type="button" class="rchip" data-cnpq="不死族">不死族</button></span></label>
    <label class="wide">形象/备注<textarea data-cnp="desc" rows="3" placeholder="外貌与来历的线索，可多行书写，AI 据此补全">${esc(R.cnp.desc)}</textarea></label>
    <div class="rchip-row"><button type="button" class="rchip rit-enter-mini" id="cnp-add" ${R.bonds.size>=max?'disabled':''}>加入羁绊列表</button></div>
  </div>`:''}
  ${items || `<div class="empty-note">（还没有羁绊角色——添加一位自定义角色，或让命运随机一位）</div>`}
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

function bodyRegion(){
  return `
  <div class="sec-title">开局地点 · 你在何处睁开眼</div>
  <div class="rit-grid cols-2">${(RT.regions||[]).map(o=>optCard('region',o)).join('')}</div>
  ${R.region==='custom'?`<div class="rit-form cwrap"><label class="wide">自定义开局地点<input data-rc="regionCustom" type="text" value="${esc(R.regionCustom)}" placeholder="写下自定义的开局地点"></label></div>`:''}`;
}

function bodySummary(){
  const mode = (RT.tones||[]).find(m=>m.id===R.tone);
  const iden = (RT.identities||[]).find(i=>i.id===R.identity);
  const region = (RT.regions||[]).find(r=>r.id===R.region);
  const ap = R.apt;
  const compTxt = !R.companion ? ''
    : R.companion==='none' ? '独自上路（无人格旁白）'
    : COMP_SHORT[R.companion] || R.companion;
  const heroBits = [R.hero.name,R.hero.gender,R.hero.age?R.hero.age+'岁':'',R.hero.appearance,R.pLevel,R.hero.faction,R.hero.bg,R.hero.outfit].filter(Boolean).join(' · ');
  const bondRows = [...R.bonds].map(([id,entry])=>{
    if(!entry.rel) return '';
    const npc = allBonds().find(n=>n.id===id); if(!npc) return '';
    return '· '+npc.n+'（'+(npc.rc||'未知')+'）— '+entry.rel.n+(entry.dir?' ['+entry.dir.n+']':'');
  }).filter(Boolean).join('\n');
  const heroRows = activeHeroines().map(([h,e])=>{
    const P = heroPersona(h, R.tOff);
    return '· '+h.n+'（'+(P?P.rc:h.rc0+' / '+h.rc)+'）好感 '+e.fav;
  }).join('\n');
  const keptN = [...R.heroines.keys()].map(heroById).filter(h=>h && heroLocked(h)).length;
  const heroTxt = (heroRows?esc(heroRows).replace(/\n/g,'<br>'):'')
    + (keptN?'<br><span class="sum-dim">另有 '+keptN+' 位因开局过早暂不出场</span>':'');
  const timeTxt = R.tOff!=null ? esc(eraText(R.tOff)) : (R.tlCustom ? '交由命运' : '');
  const timeFull = timeTxt + (timeTxt && R.tlCustom ? '<br><span class="sum-dim">'+esc(R.tlCustom)+'</span>' : '');
  const row = (k,v,go)=>`<div class="rit-sum-row"><span>${sumIcon(k)}${k}</span><b>${v||'<i class="unset">未择 · 命运自定</i>'}</b>${go==null?'':`<button type="button" class="sum-edit" data-goto="${go}" data-fromsum="1" aria-label="修改${k}">改</button>`}</div>`;
  return `
  <div class="sec-title sv-cinnabar">卷首誊录 · 仪典汇总</div>
  <div class="rit-sum pact">
    <div class="pact-head" aria-hidden="true"><i></i><span>Pactvm Initii</span><i></i></div>
    ${row('命运基调', R.tone?esc(pickName(RT.tones,R.tone))+'<br><span class="sum-dim">'+esc((TONE_DIRECTIVE[R.tone]||'').split('：')[1]||'')+'</span>':'', 0)}
    ${row('开局时间', timeFull, 2)}
    ${row('身份', R.identity?(esc(pickName(RT.identities,R.identity))+(R.identity==='monster'&&R.race?(' · '+esc(R.race==='__custom__'?'自定义':R.race)):'')+(R.identity==='custom'&&R.identityCustom?(' — '+esc(R.identityCustom)):'')):'', 0)}
    ${row('主角', esc(heroBits), 0)}
    ${row('行囊', esc(R.hero.inventory), 0)}
    ${row('信仰', esc(faithText()||''), 0)}
    ${row('初始等级', esc(R.pLevel||'按命运基调'), 0)}
    ${row('初始资质', `灵感 ${ap.ling} / 魅力 ${ap.mei} / 体质 ${ap.ti} / 信仰 ${ap.xin}${R.aptMode==='roll'?'（骰点）':''}`, 0)}
    ${row('心界住民', esc(compTxt), 1)}
    ${row('开局女主', heroTxt, 2)}
    ${row('宿命羁绊', bondRows?esc(bondRows).replace(/\n/g,'<br>'):'', 3)}
    ${row('开局地点', R.region?(esc(region?region.n:'')+(R.region==='custom'&&R.regionCustom?(' — '+esc(R.regionCustom)):'')):'', 4)}
    ${pactSign()}
  </div>
  <p class="rit-hint">已填写的维度将原样写进开局设定；留空的维度由命运与 AI 补全。</p>
  <div class="rchip-row prof-row">
    <button type="button" class="rchip" id="prof-save">保存配置</button>
    <button type="button" class="rchip" id="prof-load">读取配置</button>
    <button type="button" class="rchip rst" id="rit-reset">重置（重新配置）</button>
  </div>`;
}
const SUM_ICO = {
  '命运基调':'<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
  '开局时间':'<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>',
  '开局女主':'<path d="M4 18h16M5 18 4 8l4.5 4L12 5l3.5 7L20 8l-1 10"/>',
  '身份':'<path d="M4 6c3-2 13-2 16 0 0 7-3 12-8 14-5-2-8-7-8-14z"/><path d="M8.5 10.5h2M13.5 10.5h2"/>',
  '主角':'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>',
  '行囊':'<path d="M5 9h14l-1 11H6z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/>',
  '信仰':'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  '初始等级':'<path d="M6 14l6-6 6 6M6 20l6-6 6 6"/>',
  '初始资质':'<path d="M12 3l8 9-8 9-8-9z"/><path d="M4 12h16"/>',
  '心界住民':'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  '宿命羁绊':'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  '开局地点':'<path d="M12 21s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
};
function sumIcon(k){
  const p = SUM_ICO[k];
  return p ? `<svg class="sum-ico" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>` : '';
}
function pactSign(){
  const d = new Date();
  const day = `${d.getFullYear()} · ${d.getMonth()+1} · ${d.getDate()}`;
  return `<div class="pact-sign">
    <span class="ps-label">立约者</span>
    <b class="ps-name">${esc(R.hero.name||'无名旅人')}</b>
    <span class="ps-date">${day}</span>
    <span class="ps-seal" aria-hidden="true">契</span>
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
  const iden = (RT.identities||[]).find(i=>i.id===R.identity);
  const region = (RT.regions||[]).find(r=>r.id===R.region);
  const name = R.hero.name || '旅人';
  let msg = '以此身入世。\n';
  msg += '命运基调：'+(mode?noEmoji(mode.n):'自定义')+'（'+(TONE_DIRECTIVE[R.tone]||TONE_DIRECTIVE.custom)+'）\n';
  msg += timeMsg();
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
  }else{
    msg += '心界住民：'+(COMP_SHORT[R.companion]||'')+'（预设，性格/口癖/实体化路线严格按其专属条目执行）\n';
  }
  msg += '开局地点：'+(region?region.n:'随机');
  if(R.region==='custom' && R.regionCustom) msg += '（'+R.regionCustom+'）';
  msg += '\n';
  const heroPart = heroMsg();
  msg += heroPart;
  let hasRel=false; R.bonds.forEach(e=>{if(e.rel)hasRel=true;});
  if(hasRel){
    msg += '\n【初始羁绊】\n';
    R.bonds.forEach(entry=>{
      if(!entry.rel) return;
      const npc = entry.npc;
      msg += '- '+npc.n+'（'+(npc.rc||'未知')+'）\n';
      msg += '  关系：'+entry.rel.n+(entry.dir?' / '+entry.dir.n:'')+'\n';
      msg += '  含义：'+entry.rel.d+'\n';
      if(npc.custom && npc.d) msg += '  备注：'+npc.d+'\n';
      if(npc.rand) msg += '  （此角色由命运随机安排，请由AI为其命名并补全形象、性格与来历，须符合其种族图鉴设定）\n';
      else if(npc.custom) msg += '  （此角色为玩家自定义，请由AI依据以上信息补全其形象与来历）\n';
    });
  }
  msg += '\n请按照以上配置展开第一幕。';
  const parts = [heroPart?'【开局女主】':'', hasRel?'【初始羁绊】':''].filter(Boolean);
  if(parts.length) msg += '根据'+parts.join('与')+'安排对应角色在开局中出现或被提及。';
  return msg;
}
/* [修改 21] 开局时间：双纪年 + 沦陷状态 + 变量初始化口径 */
function timeMsg(){
  const off = R.tOff;
  const rule = '——纪年：圣历 = 魔王历 + 1846；教团只用圣历纪年，魔物侧通用魔王历';
  let s = '';
  if(off == null){
    s += '开局时间：交由命运（由AI结合基调与身份决定开局年份）'+rule+'\n';
    s += '雷斯卡特耶：沦陷与否随AI所定年份（魔王历 1200 年 / 圣历 3046 年沦陷，沦陷当年即算已沦陷）\n';
    s += '（请在初始化变量时把所定年份写入 世界.时间 =「魔王历 X 年 · 圣历 Y 年」，并据此写入 世界.雷斯卡特耶沦陷 =「已沦陷」或「未沦陷」；女主人设随之：未沦陷用沦陷前人设，已沦陷用沦陷后的魔物娘人设）\n';
  }else{
    const f = isFallen(off), yr = '魔王历 '+mwText(off)+' · 圣历 '+shYear(off)+' 年';
    s += '开局时间：'+yr+'（'+relText(off)+'；雷斯卡特耶于魔王历 1200 年 / 圣历 3046 年沦陷）'+rule+'\n';
    s += '雷斯卡特耶：'+(f?'已沦陷':'未沦陷')+'\n';
    s += '（请在初始化变量时写入 世界.时间 =「'+yr+'」（月日可由AI补全）、世界.雷斯卡特耶沦陷 =「'+(f?'已沦陷':'未沦陷')+'」；女主人设随沦陷状态：'+(f?'已沦陷，女主以沦陷后的魔物娘人设登场':'未沦陷，女主以沦陷前的人设登场')+'）\n';
  }
  if(String(R.tlCustom||'').trim()) s += '时间补充说明：'+String(R.tlCustom).trim()+'\n';
  return s;
}
/* [修改 21] 开局女主：只列勾选且已登场的；好感度是玩家定的起点 */
function heroMsg(){
  const list = activeHeroines();
  if(!list.length) return '';
  const off = R.tOff;
  let s = '\n【开局女主】\n';
  if(off == null) s += '（开局时间交由命运：以下女主的人设随AI所定的沦陷状态取用——未沦陷用「沦陷前」一栏，已沦陷用「沦陷后」一栏）\n';
  else if(isFallen(off)) s += '（雷斯卡特耶已沦陷：以下女主以沦陷后的魔物娘人设登场）\n';
  else s += '（雷斯卡特耶未沦陷：以下女主以沦陷前的人设登场，魔物化通常发生在沦陷之后）\n';
  list.forEach(([h,e])=>{
    const P = heroPersona(h, off);
    s += '- '+h.n+'（'+(P?P.rc:h.rc0+' / '+h.rc)+' · '+(h.grp||'')+'）\n';
    if(P) s += '  人设：'+(P.d||'')+'\n';
    else s += '  人设（沦陷前）：'+h.rc0+'——'+(h.d0||'')+'\n  人设（沦陷后）：'+h.rc+'——'+(h.d||'')+'\n';
    if(h.mnote && (!P || P.human)) s += '  备注：'+h.mnote+'\n';
    s += '  初始好感度：'+e.fav+'\n';
    if(P) s += '  等级参考：Lv.'+P.lv+(h.rc0?(P.human?'（沦陷前·新手期）':'（沦陷后·魔物化后力量大幅跃升）'):'')+'\n';
    else s += '  等级参考：沦陷前 Lv.'+h.lv0+' / 沦陷后 Lv.'+h.lv+'\n';
  });
  s += '（请在初始化变量时为上述女主写入 羁绊.{角色名}.好感度 = 所列初始好感度——这是玩家定下的起点，AI不得擅改初始值，此后按剧情增减；并把等级参考写入 羁绊.{角色名}.等级，阶层换算按〈等级属性与状态栏体系〉）\n';
  return s;
}

/* ---- 配置存档（与欢迎页面 mge_profiles_v2 兼容） ---- */
function collectProfile(){
  const comps=[]; R.bonds.forEach((entry,npcId)=>{ comps.push({npcId:npcId,rel:entry.rel?entry.rel.v:null,dir:entry.dir?entry.dir.v:null,catOpen:entry.catOpen}); });
  const heroines=[]; R.heroines.forEach((h,id)=>{ heroines.push({id:id,fav:h.fav}); });
  return {mode:R.tone,timeline:R.tOff==null?null:(R.tOff<0?'before':'after'),tlCustom:R.tlCustom,tOff:R.tOff,heroines:heroines,layout:6,
    identity:R.identity,race:R.race,raceCustom:R.identityCustom,
    name:R.hero.name,gender:R.hero.gender,age:R.hero.age,height:R.hero.appearance,faction:R.hero.faction,
    bg:R.hero.bg,outfit:R.hero.outfit,inventory:R.hero.inventory,pLevel:R.pLevel,apt:R.apt,aptMode:R.aptMode,tuneLeft:R.tuneLeft,
    region:R.region,locCustom:R.regionCustom,comps:comps,customNpcs:R.customNpcs,
    companion:R.companion,
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
function profileList(){
  try{
    const l = JSON.parse(localStorage.getItem('mge_profiles_v2')||'[]');
    return Array.isArray(l) ? l : [];
  }catch(e){ return []; }
}
function profileApply(d, step){
  const nr = freshR();
  nr.step = step;
  nr.tone=d.mode||null; nr.tlCustom=d.tlCustom||'';
  /* 旧配置只有 timeline：堕落之前 → 沦陷前 1 年，堕落之后 → 沦陷后 1 年，自定义 → 交由命运（说明文字保留） */
  if('tOff' in d) nr.tOff = d.tOff==null ? null : clampOff(d.tOff);
  else nr.tOff = d.timeline==='before' ? -1 : d.timeline==='after' ? 1 : null;
  nr.identity=d.identity||null; nr.identityCustom=d.raceCustom||''; nr.race=d.race||null;
  nr.hero.name=d.name||''; nr.hero.gender=d.gender||''; nr.hero.age=d.age||''; nr.hero.appearance=d.height||'';
  nr.hero.faction=d.faction||''; nr.hero.bg=d.bg||''; nr.hero.outfit=d.outfit||''; nr.hero.inventory=d.inventory||'';
  nr.pLevel=d.pLevel||''; nr.apt=d.apt||{ling:10,mei:10,ti:10,xin:0}; nr.aptMode=d.aptMode||'pool'; nr.tuneLeft=(d.tuneLeft!=null?d.tuneLeft:6);
  nr.region=d.region||null; nr.regionCustom=d.locCustom||'';
  nr.customNpcs=(d.customNpcs||[]).filter(n=>n && n.id && !isPresetId(n.id));
  nr.companion=d.companion||null;
  nr.faith=d.faith||null; nr.faithCustom=d.faithCustom||'';
  nr.heroines=new Map();
  (Array.isArray(d.heroines)?d.heroines:[]).forEach(h=>{ if(h && isPresetId(h.id)) nr.heroines.set(h.id,{fav:clampFav(h.fav)}); });
  nr.bonds=new Map();
  (d.comps||[]).forEach(c=>{
    if(isPresetId(c.npcId)){
      if(!Array.isArray(d.heroines) && !nr.heroines.has(c.npcId)) nr.heroines.set(c.npcId,{fav:0});
      return;
    }
    const npc=nr.customNpcs.find(n=>n.id===c.npcId);
    if(!npc) return;
    let rel=null;
    if(c.rel){ (RT.relations||[]).forEach(cat=>{ cat.rels.forEach(r=>{ if(r.v===c.rel) rel=r; }); }); }
    const dir=c.dir?(RT.directions||[]).find(x=>x.v===c.dir)||null:null;
    nr.bonds.set(c.npcId,{npc:npc,rel:rel,dir:dir,catOpen:c.catOpen??null});
  });
  return nr;
}
function profileLoad(idx){
  const list = profileList();
  if(!list.length){ notify('没有已保存的配置','warn',3000); return; }
  const d = list[Math.max(0, Math.min(list.length-1, idx|0))];
  turnDir = R && R.step < LAST ? 1 : 0;
  R = profileApply(d, LAST);
  notify('已读取：'+(d.label||'配置')+'，请在汇总页核对','gild',3000);
  renderRitual();
}
function profileDelete(idx){
  const list = profileList();
  if(!list[idx]) return;
  if(R.profDel !== idx){ R.profDel = idx; renderRitual(true); return; }
  const gone = list.splice(idx,1)[0];
  try{ localStorage.setItem('mge_profiles_v2', JSON.stringify(list)); }catch(e){}
  R.profDel = null;
  notify('已删除：'+(gone.label||'配置'),'gild',2400);
  renderRitual(true);
}
function profileMenu(){
  if(!R.profOpen) return '';
  const list = profileList();
  const when = iso => { const t = new Date(iso); return isNaN(t) ? '' : t.toLocaleString(); };
  const ago = iso => {
    const s = (Date.now() - new Date(iso)) / 1000;
    if(!(s >= 0)) return '';
    if(s < 60) return '刚刚';
    if(s < 3600) return Math.floor(s/60)+' 分钟前';
    if(s < 86400) return Math.floor(s/3600)+' 小时前';
    if(s < 86400*30) return Math.floor(s/86400)+' 天前';
    return '';
  };
  const race = p => p.race && p.race!=='__custom__' ? p.race : '';
  const brief = p => [pickName(RT.tones,p.mode), race(p), COMP_SHORT[p.companion], pickName(RT.regions,p.region)]
    .filter(Boolean).map(noEmoji).join(' · ');
  const comps = p => p.comps || [];
  const prog = p => [!!(p.mode||p.identity||p.name), !!p.companion,
    p.tOff!=null || !!p.timeline || (p.heroines||[]).length>0 || comps(p).some(c=>isPresetId(c.npcId)),
    comps(p).some(c=>!isPresetId(c.npcId)), !!p.region];
  const dots = p => prog(p).map((on,k)=>`<em class="${on?'on':''}" title="${STEP_NUM[k]}${on?' 已填':' 未填'}"></em>`).join('');
  const rows = list.map((p,i)=>`<li class="pm-row rib-${i%4}">
      <div class="pm-meta"><b>${esc(p.name||'旅人')}<span class="pm-dots">${dots(p)}</span></b><span>${esc([ago(p.savedAt), when(p.savedAt)].filter(Boolean).join(' · '))}</span><i>${esc(brief(p)||'尚未择定')}</i></div>
      <button type="button" class="rchip" data-pload="${i}">读取</button>
      <button type="button" class="rchip pm-del${R.profDel===i?' arm':''}" data-pdel="${i}">${R.profDel===i?'确认删除':'删除'}</button>
    </li>`).join('');
  return `<div class="rit-prof-pop" role="dialog" aria-label="开局配置">
    <div class="pm-head"><b>开局配置</b><span>最多保留 10 份</span><button type="button" class="rchip" id="pm-save">保存当前</button></div>
    ${list.length ? `<ol class="pm-list">${rows}</ol>` : '<p class="rit-hint">还没有保存过配置。填好后点「保存当前」。</p>'}
    <p class="pm-tip">读取后直接翻到 Ⅵ 启程核对；要改哪一项，点上方步骤签或汇总里的「改」。</p>
  </div>`;
}

/* ---- 未完成仪典的自动暂存（与配置分开存，入世或重置时清掉） ---- */
const DRAFT_KEY = 'mge_ritual_draft_v1';
let draftTimer = 0;
function readDraft(){
  try{ return JSON.parse(localStorage.getItem(DRAFT_KEY)||'null'); }catch(e){ return null; }
}
function saveDraft(){
  clearTimeout(draftTimer); draftTimer = 0;
  if(!R) return;
  try{
    const d = collectProfile();
    d.step = R.step; d.savedAt = new Date().toISOString();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  }catch(e){}
}
function saveDraftSoon(){ clearTimeout(draftTimer); draftTimer = setTimeout(saveDraft, 400); }
function clearDraft(){
  clearTimeout(draftTimer); draftTimer = 0;
  try{ localStorage.removeItem(DRAFT_KEY); }catch(e){}
}
rit.addEventListener('input', saveDraftSoon);

function resetAll(){
  clearDraft();
  R = freshR();
  renderRitual();
}

/* ============ 渲染与绑定 ============ */
function renderRitual(keepScroll){
  const rbOld = keepScroll ? rit.querySelector('.rit-body') : null;
  const stOld = rbOld ? rbOld.scrollTop : 0;
  const stepTitles = STEP_LABELS;
  const bodies = [bodyStep0, bodyStep1, bodyTime, bodyNpc, bodyRegion, bodySummary];
  const body = (bodies[R.step] || bodySummary)();
  rit.innerHTML = `
    ${turnDir?`<div class="rit-sweep ${turnDir>0?'fwd':'back'}" aria-hidden="true"></div>`:''}
    <header class="rit-head">
      <div class="rit-latin">Ritvs Initii</div>
      <h3>启封仪典</h3>
      <button type="button" class="rit-prof${R.profOpen?' on':''}" id="rit-prof" aria-expanded="${R.profOpen?'true':'false'}">配置</button>
      ${stepCrumbs()}
      ${profileMenu()}
    </header>
    <div class="rit-body${turnDir>0?' turn-next':turnDir<0?' turn-prev':''}">
      <div class="chapter-tag"><h2>${esc(stepTitles[R.step])}</h2><span class="ct-rule"></span><span class="ct-latin">GRADVS ${['I','II','III','IV','V','VI'][R.step]}</span></div>
      ${body}
    </div>
    <footer class="rit-foot">
      <button class="rf-step prev" id="rit-prev" ${R.step===0?'disabled':''}>${ICON.chevL}<span>上一步${R.step>0?`<i class="rf-to"> · ${esc(stepTitles[R.step-1])}</i>`:''}</span></button>
      ${R.step===LAST?`<button class="rit-enter" id="rit-enter">${ICON.seal}<span>以此身入世</span></button>`
        :R.fromSum?`<button type="button" class="rf-back" data-goto="${LAST}">回汇总</button>`:'<span></span>'}
      ${R.step<LAST?`<button class="rf-step next" id="rit-next"><span>下一步<i class="rf-to"> · ${esc(stepTitles[R.step+1])}</i></span>${ICON.chevR}</button>`:'<span></span>'}
    </footer>`;
  turnDir = 0;
  freshSel = '';
  const pb = rit.querySelector('#rit-prev'); if(pb) pb.addEventListener('click', ()=>goStep(R.step-1));
  const nb = rit.querySelector('#rit-next'); if(nb) nb.addEventListener('click', ()=>goStep(R.step+1));
  rit.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click', ()=>goStep(+b.dataset.goto, !!b.dataset.fromsum)));
  const en = rit.querySelector('#rit-enter'); if(en) en.addEventListener('click', ()=>closeRitual(true));

  /* 选项卡（tone/timeline/identity/faith/companion/region 共用） */
  rit.querySelectorAll('.rit-opt[data-g]').forEach(b=>b.addEventListener('click', ()=>{
    const g = b.dataset.g;
    if(g==='tone'){
      if(b.dataset.id!=='custom'){ autoFill(b.dataset.id); }
      else { R.tone='custom'; R.rollSummary=''; R.tOff=null; R.identity=null; R.race=null; }
    }
    else if(g==='companion' && R[g]===b.dataset.id){ R[g]=null; }
    else R[g]=b.dataset.id;
    freshSel = g+':'+b.dataset.id;
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
    const k=b.dataset.apt, d=+b.dataset.d;
    if(R.aptMode==='roll'){
      const tl=(R.tuneLeft!=null?R.tuneLeft:6);
      if(d>0){ if(tl<=0||R.apt[k]>=20) return; R.apt[k]++; R.tuneLeft=tl-1; }
      else { if(R.apt[k]<=APT_MIN[k]||tl>=6) return; R.apt[k]--; R.tuneLeft=tl+1; }
      renderRitual(true); return;
    }
    const nv = R.apt[k]+d;
    if(d>0 && (R.apt[k]>=20 || aptSum()>=APT_POOL)) return;
    if(d<0 && R.apt[k]<=APT_MIN[k]) return;
    if(d>0 && k==='xin' && R.faith==='none'){ notify('无信仰时信仰点锁定为 0','warn',2500); return; }
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
    R.tuneLeft=6;
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
  bindStep2();
  /* 羁绊 */
  rit.querySelectorAll('.bnd-hd[data-bnpc]').forEach(b=>b.addEventListener('click', (e)=>{
    if(e.target && e.target.closest && e.target.closest('[data-delnpc]')) return;
    const id=b.dataset.bnpc;
    const npc=allBonds().find(n=>n.id===id); if(!npc) return;
    if(R.bonds.has(id)) R.bonds.delete(id);
    else {
      if(R.bonds.size>=MAX_BONDS){ notify('宿命羁绊至多 '+MAX_BONDS+' 位——先放下一段，再拾起另一段。','warn',3000); return; }
      R.bonds.set(id,{npc:npc,rel:null,dir:null,catOpen:null});
    }
    renderRitual(true);
  }));
  rit.querySelectorAll('[data-delnpc]').forEach(b=>b.addEventListener('click', (e)=>{
    e.stopPropagation();
    const id=b.dataset.delnpc;
    R.customNpcs=(R.customNpcs||[]).filter(n=>n.id!==id);
    R.bonds.delete(id); renderRitual(true);
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
  rit.querySelectorAll('[data-cnpq]').forEach(el=>el.addEventListener('click', ()=>{ R.cnp.race=el.dataset.cnpq; renderRitual(true); }));
  const cnpAdd = rit.querySelector('#cnp-add');
  if(cnpAdd) cnpAdd.addEventListener('click', ()=>{
    if(R.bonds.size>=MAX_BONDS){ notify('宿命羁绊至多 '+MAX_BONDS+' 位','warn',3000); return; }
    const npc={id:'c'+Date.now(),n:(R.cnp.name||'').trim()||'？？？（由AI命名）',rc:(R.cnp.race||'').trim()||'未知',d:(R.cnp.desc||'').trim(),custom:true,cat:'自定义'};
    R.customNpcs.push(npc);
    R.bonds.set(npc.id,{npc:npc,rel:null,dir:null,catOpen:null});
    R.cnp={name:'',race:'',desc:''}; R.customNpcForm=false;
    renderRitual(true);
  });
  const randNpc = rit.querySelector('#bond-rand-npc');
  if(randNpc) randNpc.addEventListener('click', ()=>{
    if(R.bonds.size>=MAX_BONDS){ notify('宿命羁绊至多 '+MAX_BONDS+' 位','warn',3000); return; }
    const cat=pick(RACE_CATS.concat([{items:['人类','人类女性','精灵','兽人','不死族']}])); const race=pick(cat?cat.items:[]);
    const npc={id:'r'+Date.now(),n:'？？？（由AI命名）',rc:race,
      d:'命运随机安排的邂逅。她的名讳与来历，将在旅途中揭晓。',custom:true,rand:true,cat:'自定义'};
    R.customNpcs.push(npc);
    R.bonds.set(npc.id,{npc:npc,rel:null,dir:null,catOpen:null});
    notify('命运掷骰：'+race,'gild',2500); renderRitual(true);
  });
  /* 输入框（不触发重绘） */
  rit.querySelectorAll('[data-hero]').forEach(el=>el.addEventListener('input', ()=>{ R.hero[el.dataset.hero]=el.value; }));
  rit.querySelectorAll('[data-rc]').forEach(el=>el.addEventListener('input', ()=>{ R[el.dataset.rc]=el.value; }));
  /* 搜索框（触发重绘 + 焦点归还）；输入法组词期间不重绘，compositionend 再刷新，避免拼音被打断 */
  const imeBind = (el, set) => {
    if(!el) return;
    el.addEventListener('input', (e)=>{ set(el.value); if(e.isComposing) return; rerenderKeepFocus(el.id, el); });
    el.addEventListener('compositionend', ()=>{ set(el.value); rerenderKeepFocus(el.id, el); });
  };
  imeBind(rit.querySelector('#race-q'), v=>{ R.raceQ=v; });
  /* 存档 / 重置 */
  const ps = rit.querySelector('#prof-save'); if(ps) ps.addEventListener('click', profileSave);
  const pl = rit.querySelector('#prof-load'); if(pl) pl.addEventListener('click', ()=>profileLoad(0));
  const rst = rit.querySelector('#rit-reset'); if(rst) rst.addEventListener('click', resetAll);
  const pf = rit.querySelector('#rit-prof');
  if(pf) pf.addEventListener('click', ()=>{ R.profOpen = !R.profOpen; R.profDel = null; renderRitual(true); });
  const pms = rit.querySelector('#pm-save');
  if(pms) pms.addEventListener('click', ()=>{ profileSave(); R.profDel = null; renderRitual(true); });
  rit.querySelectorAll('[data-pload]').forEach(b=>b.addEventListener('click', ()=>profileLoad(+b.dataset.pload)));
  rit.querySelectorAll('[data-pdel]').forEach(b=>b.addEventListener('click', ()=>profileDelete(+b.dataset.pdel)));

  rit.querySelector('.rit-body').scrollTop = keepScroll ? stOld : 0;
  const crumbs = rit.querySelector('.rit-crumbs'), onStep = rit.querySelector('.rc-step.on');
  if(crumbs && onStep && crumbs.scrollWidth > crumbs.clientWidth){
    crumbs.scrollLeft = onStep.offsetLeft - (crumbs.clientWidth - onStep.offsetWidth) / 2;
  }
  saveDraftSoon();
}
function rerenderKeepFocus(id, el){
  const pos = { s: el.selectionStart, e: el.selectionEnd };
  renderRitual(true);
  const el2 = document.getElementById(id);
  if(el2){ el2.focus(); try{ el2.setSelectionRange(pos.s,pos.e); }catch(e){} }
}

/* ---- [修改 21] Ⅲ 时间与女主：刻度拖动只改 DOM，松手（change）才重绘 ---- */
function setOff(v){
  R.tOff = v == null ? null : clampOff(v);
  renderRitual(true);
}
function previewOff(rng){
  const off = sliderToOff(rng.value), p = Number(rng.value) / S_MAX * 100;
  const wrap = rit.querySelector('.tl-mk-wrap');
  if(wrap){ wrap.style.transform = 'translateX('+p.toFixed(2)+'%)'; wrap.classList.remove('unset'); }
  const fill = rit.querySelector('.tl-fill');
  if(fill) fill.style.transform = 'scaleX('+(p/100).toFixed(4)+')';
  const ro = rit.querySelector('#tl-read');
  if(ro) ro.innerHTML = readoutHtml(off);
  rng.setAttribute('aria-valuetext', eraText(off));
}
function bindStep2(){
  const rng = rit.querySelector('#tl-range');
  if(rng){
    rng.addEventListener('input', ()=>previewOff(rng));
    rng.addEventListener('change', ()=>setOff(sliderToOff(rng.value)));
  }
  rit.querySelectorAll('[data-tdir]').forEach(b=>b.addEventListener('click', ()=>{
    const d = b.dataset.tdir, n = Math.max(1, Math.abs(R.tOff || 0));
    setOff(d==='0' ? 0 : d==='-' ? -Math.min(n, -T_MIN) : n);
  }));
  const yr = rit.querySelector('#tl-year');
  if(yr) yr.addEventListener('change', ()=>{
    const n = parseInt(yr.value, 10);
    if(!(n >= 1)){ notify('请输入距沦陷的年数（至少 1 年）','warn',2600); yr.value = R.tOff ? String(Math.abs(R.tOff)) : ''; return; }
    if(R.tOff < 0 && n > -T_MIN) notify('最早只能到魔王历元年（沦陷前 '+(-T_MIN)+' 年）','warn',2600);
    setOff(R.tOff < 0 ? -Math.min(n, -T_MIN) : n);
  });
  rit.querySelectorAll('[data-tq]').forEach(b=>b.addEventListener('click', ()=>{
    setOff(b.dataset.tq==='null' ? null : +b.dataset.tq);
  }));
  rit.querySelectorAll('[data-hr]').forEach(b=>b.addEventListener('click', ()=>{
    const h = heroById(b.dataset.hr);
    if(!h) return;
    if(heroLocked(h)){ notify('这一年她尚未登场——把开局时间拨到沦陷前 25 年以内再选','warn',2800); return; }
    if(R.heroines.has(h.id)) R.heroines.delete(h.id); else R.heroines.set(h.id,{fav:0});
    renderRitual(true);
  }));
  rit.querySelectorAll('[data-hrfav]').forEach(el=>{
    const out = el.parentNode.querySelector('.hr-fav-v');
    el.addEventListener('input', ()=>{
      const e = R.heroines.get(el.dataset.hrfav);
      if(!e) return;
      e.fav = clampFav(el.value);
      if(out) out.textContent = e.fav;
    });
  });
  rit.querySelectorAll('[data-hrgrp]').forEach(b=>b.addEventListener('click', ()=>{
    const g = b.dataset.hrgrp, on = b.dataset.on==='1';
    HEROINES().filter(h=>(h.grp||'')===g).forEach(h=>{
      if(!on) R.heroines.delete(h.id);
      else if(!heroLocked(h) && !R.heroines.has(h.id)) R.heroines.set(h.id,{fav:0});
    });
    renderRitual(true);
  }));
}

/* ---- [修改 21] 样式自带（dist 单文件也能直接替换这一段脚本） ---- */
const CSS_V21 = `
.tl-box{position:relative;margin:2px 0 12px;padding:14px 18px 12px;border:1px solid rgba(120,88,40,.4);border-radius:5px;
  background:linear-gradient(172deg,rgba(246,242,231,.72),rgba(239,234,221,.48));box-shadow:inset 0 1px 0 rgba(255,255,255,.6)}
.tl-axis{position:relative;height:112px;margin:0 10px}
.tl-line,.tl-fill,.tl-lockzone{position:absolute;left:0;top:55px;height:2px;border-radius:1px}
.tl-line{right:0;background:linear-gradient(90deg,rgba(138,112,64,.35),rgba(138,112,64,.75) 50%,rgba(138,112,64,.35))}
.tl-lockzone{top:54px;height:4px;background:repeating-linear-gradient(90deg,rgba(120,96,56,.55) 0 4px,transparent 4px 8px)}
.tl-fill{right:0;transform-origin:0 50%;background:linear-gradient(90deg,rgba(150,55,46,.2),var(--cinnabar))}
.tl-tick{position:absolute;top:49px;width:2px;height:14px;margin-left:-1px;border-radius:1px;background:var(--gilt)}
.tl-node{position:absolute;top:0;bottom:0;width:0}
.tl-dot{position:absolute;left:-6px;top:50px;width:12px;height:12px;box-sizing:border-box;border-radius:50%;background:#f6f2e7;border:2px solid var(--lapis)}
.tl-node.mid .tl-dot{background:var(--cinnabar);border-color:var(--cinnabar)}
.tl-nm,.tl-cal{position:absolute;left:0;white-space:nowrap;text-align:center;transform:translateX(-50%)}
.tl-nm{bottom:68px;font-size:12px;line-height:1.35;font-weight:700;letter-spacing:.06em;color:var(--ink)}
.tl-cal{top:70px;font-size:11px;line-height:1.45;letter-spacing:.04em;color:var(--ink-faint);font-variant-numeric:tabular-nums}
.tl-node.start .tl-nm,.tl-node.start .tl-cal{left:-6px;transform:none;text-align:left}
.tl-mk-wrap{position:absolute;inset:0;pointer-events:none}
.tl-mk-wrap.unset{opacity:0}
.tl-mk{position:absolute;left:-9px;top:47px;width:18px;height:18px;box-sizing:border-box;border-radius:3px;transform:rotate(45deg);
  background:var(--cinnabar);border:2px solid #fbf6ea;box-shadow:0 2px 6px rgba(120,40,32,.35)}
.tl-range{position:absolute;left:-14px;top:34px;width:calc(100% + 28px);height:44px;margin:0;padding:0;opacity:0;cursor:pointer;
  -webkit-appearance:none;appearance:none;background:none}
.tl-range::-webkit-slider-runnable-track{height:44px;background:none}
.tl-range::-webkit-slider-thumb{-webkit-appearance:none;width:28px;height:44px}
.tl-range::-moz-range-thumb{width:28px;height:44px;border:0;background:none}
.tl-range:focus-visible + .tl-mk-wrap .tl-mk{box-shadow:0 0 0 3px rgba(150,55,46,.35),0 2px 6px rgba(120,40,32,.35)}
.tl-read{display:flex;flex-direction:column;align-items:center;gap:3px;margin:2px 0 8px;text-align:center}
.tl-read b{font-size:16px;letter-spacing:.08em;color:var(--ink);font-variant-numeric:tabular-nums}
.tl-read span{font-size:12px;line-height:1.7;letter-spacing:.04em;color:var(--ink-soft)}
.tl-st{display:inline-block;margin-right:6px;padding:0 7px;border:1px solid currentColor;border-radius:9px;font-style:normal;font-size:11px}
.tl-st.pre{color:var(--lapis)}
.tl-st.fallen{color:var(--cinnabar)}
.tl-box .rchip-row{justify-content:center}
.tl-yr{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;color:var(--ink-soft)}
.tl-yr input{width:84px;padding:4px 8px;border:1px solid rgba(120,96,56,.45);border-radius:3px;background:rgba(255,253,246,.35);
  font-family:var(--font-serif);font-size:14px;color:var(--ink);outline:none;font-variant-numeric:tabular-nums}
.tl-yr input:focus{border-color:var(--cinnabar);box-shadow:0 0 0 2px rgba(150,55,46,.12)}
.tl-yr input:disabled{opacity:.5}
.tl-legend{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 16px;margin:8px 0 0;font-size:11px;letter-spacing:.04em;color:var(--ink-faint)}
.tl-legend i{display:inline-block;vertical-align:middle;margin-right:5px}
.lg-tick{width:2px;height:10px;background:var(--gilt)}
.lg-lock{width:16px;height:3px;background:repeating-linear-gradient(90deg,rgba(120,96,56,.6) 0 4px,transparent 4px 8px)}
.hr-act{margin-top:-2px}
.hr-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:6px}
.hr-card.bnd-item{margin:0;display:flex;flex-direction:column}
.hr-hd{display:flex;align-items:center;flex-wrap:wrap;gap:6px 8px;width:100%;padding:9px 12px;border:0;border-radius:4px 4px 0 0;
  background:none;text-align:left;font:inherit;color:inherit;cursor:pointer}
.hr-hd:focus-visible{outline:2px solid var(--cinnabar);outline-offset:-2px}
.hr-lv{font-size:11px;letter-spacing:.06em;color:var(--ink-faint);font-variant-numeric:tabular-nums}
.hr-lock{font-size:11px;color:var(--ink-faint);border:1px dashed rgba(120,96,56,.5);border-radius:9px;padding:1px 7px}
.hr-sw{position:relative;flex:none;margin-left:auto;width:34px;height:18px;box-sizing:border-box;border-radius:9px;
  border:1px solid rgba(120,88,40,.5);background:rgba(120,96,56,.14);transition:background-color .2s,border-color .2s}
.hr-sw::after{content:'';position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#fbf6ea;
  box-shadow:0 1px 2px rgba(60,40,20,.35);transition:transform .2s var(--ease-out)}
.hr-card.active .hr-sw{background:var(--cinnabar);border-color:var(--cinnabar)}
.hr-card.active .hr-sw::after{transform:translateX(16px)}
.hr-card .bnd-desc{flex:1}
.hr-fav{display:flex;align-items:center;gap:10px;padding:0 13px 11px;font-size:12px;letter-spacing:.12em;color:var(--ink-faint)}
.hr-fav input{flex:1;min-width:0;height:22px;margin:0;accent-color:var(--cinnabar)}
.hr-fav-v{min-width:2.4em;text-align:right;font-size:14px;letter-spacing:0;color:var(--cinnabar);font-variant-numeric:tabular-nums}
.hr-card.locked{opacity:.5}
.hr-card.locked .hr-hd{cursor:not-allowed}
.hr-warn{color:var(--cinnabar)}
@media (hover:hover){
  .hr-hd:hover{background:rgba(201,174,109,.1)}
  .hr-card.locked .hr-hd:hover{background:none}
}
@media (max-width:760px){
  .hr-grid{grid-template-columns:1fr}
  .tl-box{padding:12px 10px 10px}
  .tl-axis{margin:0 8px}
  .tl-nm{font-size:11px}
  .tl-cal{font-size:10.5px}
}
@media (prefers-reduced-motion:reduce){
  .hr-sw,.hr-sw::after{transition:none}
}
html[data-mdx-theme="night"] .tl-box{background:var(--nt-card);border-color:var(--nt-hair);box-shadow:var(--nt-shadow)}
html[data-mdx-theme="night"] .tl-line{background:linear-gradient(90deg,var(--nt-hair),var(--nt-hair-strong) 50%,var(--nt-hair))}
html[data-mdx-theme="night"] :is(.tl-lockzone,.lg-lock){background:repeating-linear-gradient(90deg,rgba(200,160,255,.45) 0 4px,transparent 4px 8px)}
html[data-mdx-theme="night"] .tl-fill{background:linear-gradient(90deg,rgba(180,120,255,.15),var(--nt-violet))}
html[data-mdx-theme="night"] .tl-dot{background:#140b22;border-color:var(--nt-violet)}
html[data-mdx-theme="night"] .tl-node.mid .tl-dot{background:var(--nt-rose);border-color:var(--nt-rose)}
html[data-mdx-theme="night"] .tl-mk{background:var(--gilt);border-color:#140b22;box-shadow:0 0 0 1px var(--gilt),0 4px 14px -2px rgba(122,63,209,.7)}
html[data-mdx-theme="night"] .tl-read b{color:var(--gilt-hi)}
html[data-mdx-theme="night"] .tl-st.pre{color:var(--nt-violet)}
html[data-mdx-theme="night"] :is(.tl-st.fallen,.hr-warn){color:var(--nt-rose)}
html[data-mdx-theme="night"] .tl-yr input{background:rgba(7,4,12,.6);border-color:var(--nt-hair);color:var(--ink)}
html[data-mdx-theme="night"] .tl-yr input:focus{border-color:var(--nt-violet);box-shadow:0 0 0 3px rgba(180,120,255,.18)}
html[data-mdx-theme="night"] .ritual .hr-card.active{border-color:var(--gilt) !important;box-shadow:inset 3px 0 0 var(--gilt),var(--nt-float)}
html[data-mdx-theme="night"] .hr-sw{background:rgba(7,4,12,.6);border-color:var(--nt-hair-strong)}
html[data-mdx-theme="night"] .hr-card.active .hr-sw{background:var(--gilt);border-color:var(--gilt)}
html[data-mdx-theme="night"] .hr-card.active .hr-sw::after{background:#140b22}
html[data-mdx-theme="night"] .hr-fav input{accent-color:var(--gilt)}
html[data-mdx-theme="night"] .hr-fav-v{color:var(--gilt-hi)}
html[data-mdx-theme="night"] .hr-lock{border-color:var(--nt-hair-strong)}
@media (hover:hover){
  html[data-mdx-theme="night"] .hr-hd:hover{background:var(--nt-violet-dim)}
  html[data-mdx-theme="night"] .hr-card.locked .hr-hd:hover{background:none}
}
`;
function injectCssV21(){
  if(document.getElementById('rit-v21-css')) return;
  const st = document.createElement('style');
  st.id = 'rit-v21-css';
  st.textContent = CSS_V21;
  document.body.appendChild(st);
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectCssV21);
else injectCssV21();

document.addEventListener('keydown', e=>{
  if(!R || !rit.classList.contains('open') || e.altKey || e.ctrlKey || e.metaKey) return;
  if(e.key==='Escape' && R.profOpen){ R.profOpen = false; renderRitual(true); return; }
  const t = e.target;
  if(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if(e.key==='ArrowLeft'){ e.preventDefault(); goStep(R.step-1); }
  else if(e.key==='ArrowRight'){ e.preventDefault(); goStep(R.step+1); }
});
window.__ritStep = n => { if(R) goStep(n); };
window.__ritMsg = ()=> buildMsg();
window.__ritual = {
  isOpen: ()=>rit.classList.contains('open'),
  close: ()=>closeRitual(false),
  toCover: ()=>{ rit.classList.remove('open'); tome.classList.remove('rit-on'); showCover(); },
};
})();
