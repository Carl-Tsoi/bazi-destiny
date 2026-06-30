import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, isStarJi } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'siblings';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
export function siblingsEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeSiblings(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[];
  if(ctx.peers.present){
    const ji=isStarJi(ctx,0); const t=(ji?J():Y())['peers'];
    if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  return items;
}
