import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'later-life';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
export function laterLifeEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeLaterLife(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  if(ctx.childrenPalace.isYongShen){const t=Y().laterLife;if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  else{const t=J().laterLife;if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});}
  return items;
}
