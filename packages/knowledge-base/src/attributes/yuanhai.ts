/** 渊海子平专属属性 */
export interface YuanHaiAttributes {
  shensha: Record<string, boolean>;
  poemMatches: Array<{poem:string;rule:string;result:string}>;
  sixRelatives: Record<string, string[]>;
  patternVariants: string[];
  rigidRules: Array<{condition:string;conclusion:string;source:string}>;
}
