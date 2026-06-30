import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, loadBase, isStarJi } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'later-life';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
function B():any{return loadBase(CDIR,DIM);}
export function laterLifeEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeLaterLife(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  // 子女宫 → 晚年依靠
  if(ctx.childrenPalace.isJiShen){const t=J().laterLife;if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  else{const t=Y().laterLife;if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  // 财星 → 晚年经济状况
  if(ctx.wealthStars.present){
    const ji=isStarJi(ctx,2); const t=(ji?J():Y())['wealth'];
    if(t)items.push({level:'参考',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  // 印星 → 晚年精神寄托
  if(ctx.seals.present){
    const ji=isStarJi(ctx,4); const t=(ji?J():Y())['seals'];
    if(t)items.push({level:'参考',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  return items;
}
