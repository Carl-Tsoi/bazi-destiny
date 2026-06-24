/** 专项断事 — 十引擎编排器 */
import type { BaziChart } from '@bazi-destiny/core';
import { buildCtx } from './types.js';
import type { SpecContext } from './types.js';
import { personalityEngine } from './engine-personality.js';
import { educationEngine } from './engine-education.js';
import { careerEngine } from './engine-career.js';
import { wealthEngine } from './engine-wealth.js';
import { marriageEngine } from './engine-marriage.js';
import { parentsEngine } from './engine-parents.js';
import { benefactorsEngine } from './engine-benefactors.js';
import { childrenEngine } from './engine-children.js';
import { propertyEngine } from './engine-property.js';
import { healthEngine } from './engine-health.js';

export interface SpecialtyResult {
  personality: string[]; education: string[]; career: string[]; wealth: string[];
  marriage: string[]; parents: string[]; benefactors: string[]; children: string[];
  property: string[]; health: string[];
  rating: { grade: string; summary: string };
}

export function analyzeSpecialty(bazi: BaziChart, dayStrength: string, pattern: string, gender?: string): SpecialtyResult {
  const ctx = buildCtx(bazi, dayStrength, pattern, gender);
  const isStrong = ctx.isStrong; const caiStars = ctx.caiStars;

  // 评级
  let gs=0;
  if (pattern&&!pattern.includes('未定')) gs+=2;
  if (dayStrength.includes('中和')) gs+=1; else if (isStrong) gs+=2;
  if (caiStars.length>0) gs+=1;
  if (ctx.officials.length>0) gs+=1;
  const chongCount=ctx.allZhis.flatMap((z,i,a)=>a.slice(i+1).map(z2=>z+z2)).filter(c=>['子午','午子','丑未','未丑','寅申','申寅','卯酉','酉卯','辰戌','戌辰','巳亥','亥巳'].includes(c)).length;
  if (chongCount<=1) gs+=1;
  let grade:string,summary:string;
  if (gs>=5){grade='A';summary='格局明确，身强能担，财官有气，刑冲较少。命格层次较佳。';}
  else if(gs>=3){grade='B';summary='格局可用但有不足之处，需大运补足。中等命格。';}
  else if(gs>=1){grade='C';summary='格局有缺，需大运扶持方可有成。';}
  else{grade='D';summary='格局不明，刑冲较多，波折较多，需特殊组合或大运救助。';}

  return {
    personality: personalityEngine(ctx), education: educationEngine(ctx),
    career: careerEngine(ctx), wealth: wealthEngine(ctx),
    marriage: marriageEngine(ctx), parents: parentsEngine(ctx),
    benefactors: benefactorsEngine(ctx), children: childrenEngine(ctx),
    property: propertyEngine(ctx), health: healthEngine(ctx),
    rating: { grade, summary },
  };
}
