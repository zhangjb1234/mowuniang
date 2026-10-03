// 由 lock-frontend.src.js 生成 导入到酒馆中/魔典-脚本-锁定前端.json
// （源文件维护，json 是生成产物，勿手改 content）
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.join(DIR, 'lock-frontend.src.js'), 'utf8');
if (src.includes('</script')) throw new Error('lock-frontend.src.js 含 </script 字面量，注入父页时会截烂');
if (!src.includes('modian-lock-protect-script')) throw new Error('源未含保护脚本 id（改名漏网之鱼？)');

const OUT = path.join(DIR, '导入到酒馆中', '魔典-脚本-锁定前端.json');
const pkg = JSON.parse(readFileSync(OUT, 'utf8'));   // 保留原 id / name / buttons 不动
pkg.content = src;
pkg.info = '全屏某楼层前端时自动隐藏其他楼层并拦截该楼 iframe 被销毁，退出全屏恢复。与幻璃镜-锁定前端同构（父页 fullscreenchange 触发 + 父页面三路原型拦截），modian 前缀，互不冲突。源：lock-frontend.src.js，由 _gen-lock-json.mjs 生成，勿手改 content。';
writeFileSync(OUT, JSON.stringify(pkg, null, 2));
console.log('生成:', OUT, (src.length / 1024).toFixed(1) + 'KB content, id=' + pkg.id);
