import type { SharedContext } from './shared/context.js';
import type { AnalysisItem, SpecContext } from './types.js';
import { fileURLToPath } from 'url'; import { dirname, join } from 'path';
import { loadContent, isStarJi } from './shared/content-loader.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const CDIR = join(__dirname, 'content'); const DIM = 'property';
function Y():any{return loadContent(CDIR,DIM,'yong');}
function J():any{return loadContent(CDIR,DIM,'ji');}
const ORD=['木','火','土','金','水'];
export function propertyEngine(ctx:SpecContext):string[]{return[''];};
export function analyzeProperty(ctx:SharedContext):AnalysisItem[]{
  const items:AnalysisItem[]=[],di=ORD.indexOf(ctx.dayEl);
  if(ctx.seals.present){
    const sealScore=ctx.elementScores[ORD[(di+4)%5]]||0;
    const total=Object.values(ctx.elementScores).reduce((a,b)=>a+b,0)||1;
    const s=sealScore>total*0.1;
    const ji=isStarJi(ctx,4);
    const key=(ji?'ji':'yong')+'_'+(s?'strong':'weak');
    const t=(ji?J():Y())[key]; if(t)items.push({level:'确定',layer1:t.l1,layer2:t.l2,layer3:t.l3});
  }
  return items;
}
