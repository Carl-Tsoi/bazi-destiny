/**
 * 专项引擎: 婚姻 (4/11)
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, loadBase } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'marriage';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
function B():any{return loadBase(CDIR,DIM);}
export function marriageEngine(ctx:SpecContext):string[]{const c:string[]=[];c.push('婚姻需综合分析配偶星和夫妻宫。');return c;}
export function analyzeMarriage(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  const sp=ctx.spousePalace;
  // 配偶星: 男性看财星为妻星, 女性看官杀为夫星
  const spouseIsJi = ctx.gender==='M' ? ctx.wealthStars.strength!=='无'&&ctx.jiShen.some(e=>ctx.wealthStars.positions.length>0) : ctx.officials.strength!=='无'&&ctx.jiShen.some(e=>ctx.officials.positions.length>0);
  const ss = (spouseIsJi ? J() : Y())['spouseStar']; if(ss)items.push({level:'确定',layer1:ss.l1,layer2:ss.l2,layer3:ss.l3});
  // 夫妻宫
  if(sp.isYongShen){const p=Y().spousePalace?.['用神'];if(p)items.push({level:'确定',layer1:p.l1,layer2:p.l2,layer3:p.l3});}
  else if(sp.isJiShen){const p=J().spousePalace?.['忌神'];if(p)items.push({level:'确定',layer1:p.l1,layer2:p.l2,layer3:p.l3});}
  if(sp.clashes.length>0){const p=B().spousePalaceChong;if(p)items.push({level:'参考',layer1:p.l1,layer2:p.l2,layer3:p.l3});}
  if(B().mixedOfficials&&ctx.officials.present&&ctx.officials.strength!=='弱'){const p=B().mixedOfficials;if(p)items.push({level:'参考',layer1:p.l1,layer2:p.l2,layer3:p.l3});}
  return items;
}
