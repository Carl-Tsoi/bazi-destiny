/**
 * 专项引擎: 婚姻 (4/11)
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, loadBase, isStarJi } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'marriage';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
function B():any{return loadBase(CDIR,DIM);}
export function marriageEngine(ctx:SpecContext):string[]{const c:string[]=[];c.push('婚姻需综合分析配偶星和夫妻宫。');return c;}
export function analyzeMarriage(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  const sp=ctx.spousePalace;
  // 配偶星: 男命财为妻(offset 2), 女命官为夫(offset 3)
  const spouseOffset = ctx.gender==='M' ? 2 : 3;
  const spouseStar = ctx.gender==='M' ? ctx.wealthStars : ctx.officials;
  if(spouseStar.present){
    const ji=isStarJi(ctx, spouseOffset);
    const ss=(ji?J():Y())['spouseStar']; if(ss)items.push({level:'确定',layer1:ss.l1,layer2:ss.l2,layer3:ss.l3});
  }
  // 夫妻宫
  if(sp.isYongShen){const p=Y().spousePalace?.['用神'];if(p)items.push({level:'确定',layer1:p.l1,layer2:p.l2,layer3:p.l3});}
  else if(sp.isJiShen){const p=J().spousePalace?.['忌神'];if(p)items.push({level:'确定',layer1:p.l1,layer2:p.l2,layer3:p.l3});}
  if(sp.clashes.length>0){const p=B().spousePalaceChong;if(p)items.push({level:'参考',layer1:p.l1,layer2:p.l2,layer3:p.l3});}
  if(ctx.mixedOfficials){const p=B().mixedOfficials;if(p)items.push({level:'参考',layer1:p.l1,layer2:p.l2,layer3:p.l3});}
  return items;
}
