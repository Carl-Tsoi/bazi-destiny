/** 三命通会专属属性 */
export interface SanMingAttributes {
  nayingPairs: Record<string,string>;
  specialPatterns: Array<{name:string;conditions:string[];bonus:string[];avoid:string[]}>;
  benZhuRelation: {benStrength:number;zhuStrength:number;balance:string};
  yearLuckEffects: Array<{type:string;severity:number;detail:string}>;
}
