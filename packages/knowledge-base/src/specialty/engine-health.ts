import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, loadBase } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'health';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
function B():any{return loadBase(CDIR,DIM);}
const ORDER=['木','火','土','金','水'];
export function healthEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeHealth(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[],bal=ctx.elementBalance,organs=B().elementOrgans||{};
  for(const el of bal.missing){
    const o=organs[el]||el,t=B().deficient;if(t)items.push({level:'确定',layer1:t.l1.replace('{el}',el).replace('{organ}',o),layer2:t.l2.replace('{el}',el),layer3:t.l3.replace('{el}',el)});
  }
  for(const el of bal.excess){
    const o=organs[el]||el; const isJi=ctx.jiShen.includes(el);
    if(isJi){const t=J().excess;if(t)items.push({level:'确定',layer1:t.l1.replace('{el}',el).replace('{organ}',o),layer2:t.l2.replace('{el}',el),layer3:t.l3.replace('{el}',el)});}
    else{const t=B().deficient;if(t)items.push({level:'参考',layer1:t.l1.replace('{el}',el).replace('{organ}',o),layer2:t.l2.replace('{el}',el),layer3:t.l3.replace('{el}',el)});}
  }
  return items;
}
