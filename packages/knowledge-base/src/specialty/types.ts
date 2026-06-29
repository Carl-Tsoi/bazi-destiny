/** Shared types for specialty engines */

// ── 新版三层分析输出 ──
export interface AnalysisItem {
  level: '确定' | '参考';
  layer1: string;   // 命理判断
  layer2: string;   // 对命主影响
  layer3: string;   // 行动建议
  citation?: string; // 古籍引证
}

// ── 旧版兼容类型 ──
export interface Pillar { gan:string;zhi:string;shishen:string;canggan:Array<{stem:string;tenGod:string}>; }
export interface SpecContext {
  ps: Record<string, Pillar>; dayGan: string; dayEl: string; dayZhi: string;
  allZhis: string[]; monthZhi: string; elements: Set<string>;
  isMale: boolean; isStrong: boolean; isWeak: boolean; dayStrength: string; pattern: string;
  //十神
  officials: Array<{pos:string;gan:string;zhi:string;shishen:string}>;
  killers: Array<{pos:string;gan:string;zhi:string;shishen:string}>;
  foods: Array<{pos:string;gan:string;zhi:string;shishen:string}>;
  hurts: Array<{pos:string;gan:string;zhi:string;shishen:string}>;
  yins: Array<{pos:string;gan:string;zhi:string;shishen:string}>;
  caiStars: Array<{pos:string;gan:string;zhi:string;shishen:string}>;
  biJie: Array<{pos:string;gan:string;zhi:string;shishen:string}>;
  foodHurtStars: Array<{pos:string;gan:string;zhi:string;shishen:string}>;
}

export function hasSS(ps:Record<string,Pillar>,name:string,inCang?:boolean|'mainQi'):Array<{pos:string;gan:string;zhi:string;shishen:string}> {
  const f:Array<{pos:string;gan:string;zhi:string;shishen:string}>=[];
  const onlyMainQi=inCang==='mainQi';
  for(const[k,p]of Object.entries(ps)){
    if(p.shishen===name)f.push({pos:k,gan:p.gan,zhi:p.zhi,shishen:p.shishen});
    if(inCang)for(let i=0;i<p.canggan.length;i++){
      const cg=p.canggan[i];
      if(onlyMainQi&&i>0)continue; // only主气
      if(cg.tenGod===name)f.push({pos:k,gan:p.gan,zhi:p.zhi,shishen:cg.tenGod+'(藏)'});
    }
  }
  return f;
}
export function hsl(ps:Record<string,Pillar>,frag:string,inCang?:boolean|'mainQi'):Array<{pos:string;gan:string;zhi:string;shishen:string}> {
  const f:Array<{pos:string;gan:string;zhi:string;shishen:string}>=[];
  const em=(s:string)=>frag==='财'?(s==='正财'||s==='偏财'):frag==='官'?s==='正官':s.includes(frag);
  const onlyMainQi=inCang==='mainQi';
  for(const[k,p]of Object.entries(ps)){
    if(em(p.shishen))f.push({pos:k,gan:p.gan,zhi:p.zhi,shishen:p.shishen});
    if(inCang)for(let i=0;i<p.canggan.length;i++){
      const cg=p.canggan[i];
      if(onlyMainQi&&i>0)continue;
      if(em(cg.tenGod))f.push({pos:k,gan:p.gan,zhi:p.zhi,shishen:cg.tenGod+'(藏)'});
    }
  }
  return f;
}

import type { BaziChart } from '@bazi-destiny/core';
const wx:Record<string,string>={'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
export function buildCtx(bazi:BaziChart,dayStrength:string,pattern:string,gender?:string):SpecContext{
  const ps=bazi.pillars as unknown as Record<string,Pillar>;
  const dayGan=ps.日柱.gan;const dayEl=wx[dayGan]??'';const isMale=gender==='M';
  const es=new Set<string>();for(const[,p]of Object.entries(ps)){const e=wx[p.gan]??'';if(e)es.add(e);}
  return{
    ps,dayGan,dayEl,dayZhi:ps.日柱.zhi,
    allZhis:[ps.年柱.zhi,ps.月柱.zhi,ps.日柱.zhi,ps.时柱.zhi],
    monthZhi:ps.月柱.zhi,elements:es,
    isMale,isStrong:dayStrength.includes('强')||dayStrength.includes('旺'),
    isWeak:dayStrength.includes('弱'),dayStrength,pattern,
    //统一:透干+主气
    officials:[...hasSS(ps,'正官','mainQi'),...hasSS(ps,'七杀','mainQi')],
    killers:hasSS(ps,'七杀','mainQi'),
    yins:hsl(ps,'印','mainQi'),
    foods:hsl(ps,'食','mainQi'),hurts:hsl(ps,'伤','mainQi'),
    caiStars:hsl(ps,'财','mainQi'),
    biJie:[...hsl(ps,'比'),...hsl(ps,'劫')],
    foodHurtStars:[...hsl(ps,'食','mainQi'),...hsl(ps,'伤','mainQi')],
  };
}
