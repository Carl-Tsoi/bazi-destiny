/**
 * 专项引擎: 财运 (3/11)
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { readFileSync } from 'fs'; import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
let _c: any = null; function C(): any { if(!_c) _c=JSON.parse(readFileSync(join(__dirname,'content','wealth.json'),'utf-8')); return _c; }
function match(cond:string, ctx:SharedContext):boolean{return cond.split(/\s+AND\s+/i).every(p=>{const[path,val]=p.trim().split('.');let o:any=ctx;for(const k of path.split('.'))o=o?.[k];return typeof o==='object'&&'strength'in o?o.strength===val:String(o)===val});}
export function wealthEngine(ctx:SpecContext):string[]{const c:string[]=[];if(ctx.caiStars.length>0)c.push('财星透出，有理财意识。');else c.push('财星不显，需大运引出财源。');if(ctx.foodHurtStars.length>0)c.push('食伤生财，有技术变现能力。');return c;}
export function analyzeWealth(ctx:SharedContext):AnalysisItem[]{const items:AnalysisItem[]=[];for(const[name,rule]of Object.entries(C().patterns||{})as any){if(rule.condition&&match(rule.condition,ctx)){items.push({level:'确定',layer1:rule.l1||'',layer2:rule.l2||'',layer3:rule.l3||''});}}return items;}
