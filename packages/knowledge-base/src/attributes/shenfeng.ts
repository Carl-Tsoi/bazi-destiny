/** 神峰通考专属属性 */
export interface ShenFengAttributes {
  fourBing: { diao:boolean; ku:boolean; wang:boolean; ruo:boolean };
  fourYao: { sun:string|null; yi:string|null; sheng:string|null; zhang:string|null };
  bingYaoPair: { disease:string; medicine:string; severity:'轻'|'中'|'重' } | null;
  yinYangFactor: { isYangStem:boolean; monthYang:boolean };
  patternRank: '大病大药'|'小病小药'|'中和无病'|'有病无药'|null;
}
