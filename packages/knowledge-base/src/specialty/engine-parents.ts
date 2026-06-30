/**
 * 专项引擎: 父母 (7/11) v2: 喜忌双轨
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, isStarJi } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'parents';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
export function parentsEngine(ctx:SpecContext):string[]{return['父母分析需结合具体命局。'];}
export function analyzeParents(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  // 年柱宫位
  if(ctx.parentsPalace.isYongShen){const r=Y().year;if(r)items.push({level:'确定',layer1:r.l1,layer2:r.l2,layer3:r.l3});}
  else if(ctx.parentsPalace.isJiShen){const r=J().year;if(r)items.push({level:'确定',layer1:r.l1,layer2:r.l2,layer3:r.l3});}
  // 印星=母亲 (生我 offset 4)
  if(ctx.seals.present){
    if(isStarJi(ctx,4)){const r=J().seal;if(r)items.push({level:'确定',layer1:r.l1,layer2:r.l2,layer3:r.l3});}
    else{const r=Y().seal;if(r)items.push({level:'确定',layer1:r.l1,layer2:r.l2,layer3:r.l3});}
  }
  // 财星=父亲 (我克 offset 2)
  if(ctx.wealthStars.present){
    if(isStarJi(ctx,2)){const r=J().wealth;if(r)items.push({level:'确定',layer1:r.l1,layer2:r.l2,layer3:r.l3});}
    else{const r=Y().wealth;if(r)items.push({level:'确定',layer1:r.l1,layer2:r.l2,layer3:r.l3});}
  }
  return items;
}
