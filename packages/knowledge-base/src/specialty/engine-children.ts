/**
 * 专项引擎: 子女 (6/11) v2: 喜忌双轨
 */
import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, isStarJi } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'children';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
export function childrenEngine(ctx:SpecContext):string[]{return['子女分析需结合具体命局。'];}
export function analyzeChildren(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  const os=ctx.outputStars;
  if(os.strength==='强'||os.strength==='一般'){
    if(isStarJi(ctx,1)){const r=J().output;if(r)items.push({level:'确定',layer1:r.l1,layer2:r.l2,layer3:r.l3});}
    else{const r=Y().output;if(r)items.push({level:'确定',layer1:r.l1,layer2:r.l2,layer3:r.l3});}
  }
  if(ctx.childrenPalace.isYongShen){const r=Y().hour;if(r)items.push({level:'确定',layer1:r.l1,layer2:r.l2,layer3:r.l3});}
  else if(ctx.childrenPalace.isJiShen){const r=J().hour;if(r)items.push({level:'确定',layer1:r.l1,layer2:r.l2,layer3:r.l3});}
  return items;
}
