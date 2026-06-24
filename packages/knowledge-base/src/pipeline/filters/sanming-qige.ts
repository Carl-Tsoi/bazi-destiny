/**
 * 三命奇格拦截器 (Priority 600)
 *
 * 基于《三命通会》奇格异局 + 纳音
 * Ref: docs/三命通会_notebook.md
 */
import type { AnalysisFilter, AnalysisContext, FilterOutput } from '../types.js';
import { BookName, setAnnotation } from '../../attributes/base-types.js';
import type { SanMingAttributes } from '../../attributes/sanming.js';

// 纳音五行 (年柱)
const NAYIN: Record<string,string> = {
  '甲子':'金','乙丑':'金','丙寅':'火','丁卯':'火','戊辰':'木','己巳':'木','庚午':'土','辛未':'土','壬申':'金','癸酉':'金',
  '甲戌':'火','乙亥':'火','丙子':'水','丁丑':'水','戊寅':'土','己卯':'土','庚辰':'金','辛巳':'金','壬午':'木','癸未':'木',
  '甲申':'水','乙酉':'水','丙戌':'土','丁亥':'土','戊子':'火','己丑':'火','庚寅':'木','辛卯':'木','壬辰':'水','癸巳':'水',
  '甲午':'金','乙未':'金','丙申':'火','丁酉':'火','戊戌':'木','己亥':'木','庚子':'土','辛丑':'土','壬寅':'金','癸卯':'金',
  '甲辰':'火','乙巳':'火','丙午':'水','丁未':'水','戊申':'土','己酉':'土','庚戌':'金','辛亥':'金','壬子':'木','癸丑':'木',
  '甲寅':'水','乙卯':'水','丙辰':'土','丁巳':'土','戊午':'火','己未':'火','庚申':'木','辛酉':'木','壬戌':'水','癸亥':'水',
};

// 特殊格局检测
function checkSpecialPattern(pillars: Record<string,{gan:string;zhi:string}>): Array<{name:string;conditions:string[];bonus:string[];avoid:string[]}> {
  const zhis = [pillars.年柱.zhi, pillars.月柱.zhi, pillars.日柱.zhi, pillars.时柱.zhi];
  const found: Array<{name:string;conditions:string[];bonus:string[];avoid:string[]}> = [];

  // 四位纯全:四柱地支全子午卯酉/寅申巳亥/辰戌丑未
  const sets = [
    {name:'子午卯酉', members:['子','午','卯','酉']},
    {name:'寅申巳亥', members:['寅','申','巳','亥']},
    {name:'辰戌丑未', members:['辰','戌','丑','未']},
  ];
  for (const s of sets) {
    if (s.members.every(m => zhis.includes(m))) {
      found.push({name:`四位纯全(${s.name})`,conditions:[`四柱地支全${s.name}`],bonus:['格局清奇'],avoid:['冲刑破局']});
    }
  }

  // 日禄归时:时支为日干禄位
  const luMap: Record<string,string> = {甲:'寅',乙:'卯',丙:'巳',丁:'午',戊:'巳',己:'午',庚:'申',辛:'酉',壬:'亥',癸:'子'};
  if (pillars.时柱.zhi === (luMap[pillars.日柱.gan] ?? '')) {
    found.push({name:'日禄归时',conditions:['时支为日干禄位'],bonus:['晚年福厚'],avoid:['禄位被冲']});
  }

  // 魁罡:日柱为庚辰/壬辰/戊戌/庚戌
  const kuiGang = ['庚辰','壬辰','戊戌','庚戌'];
  if (kuiGang.includes(pillars.日柱.gan + pillars.日柱.zhi)) {
    found.push({name:'魁罡',conditions:['日柱庚辰/壬辰/戊戌/庚戌'],bonus:['聪明果断'],avoid:['财官运破格']});
  }

  return found;
}

export const sanmingQigeFilter: AnalysisFilter = {
  name: '三命奇格',
  priority: 600,
  enabled: true,

  analyze(ctx: AnalysisContext): FilterOutput {
    const pillars = ctx.chart.base.pillars;
    const yearGanZhi = pillars.年柱.gan + pillars.年柱.zhi;
    const dayGanZhi = pillars.日柱.gan + pillars.日柱.zhi;
    const nayinYear = NAYIN[yearGanZhi] ?? '';
    const nayinDay = NAYIN[dayGanZhi] ?? '';

    const specialPatterns = checkSpecialPattern(pillars);

    const attrs: SanMingAttributes = {
      nayingPairs: { 年柱: nayinYear, 日柱: nayinDay },
      specialPatterns,
      benZhuRelation: { benStrength: 50, zhuStrength: 50, balance: '本主均衡' },
      yearLuckEffects: [],
    };

    setAnnotation(ctx.chart, BookName.SanMing, attrs as unknown as Record<string, unknown>);

    return {
      filterName: '三命奇格',
      priority: 600,
      annotation: ctx.chart.annotations.find(a => a.book === BookName.SanMing),
      stopPropagation: specialPatterns.length > 0,
      diagnostics: [nayinYear ? `纳音:年${nayinYear} 日${nayinDay}` : '', ...specialPatterns.map(p => p.name)].filter(Boolean),
    };
  },
};
