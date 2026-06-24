/** 滴天髓专属属性 */
export interface DiTianSuiAttributes {
  livingWood: boolean | null;
  sourceFlow: {
    sourceElement: string;
    sinkElement: string;
    pathClear: boolean;
    blockages: Array<{blocker:string;severity:number}>;
    healthScore: number;
  };
  specialState: {
    type: '正格'|'真从格'|'假从格'|'真化气'|'假化气'|'专旺格'|'两气成象'|null;
    details: string;
    breakable: boolean;
  };
  chongAnalysis: Record<string, {pair:[string,string];winner:string|null;loser:string|null;severity:'拔除'|'激发'|'两败俱伤'}>;
  clarity: { score:number; isPure:boolean; impurityFactors:string[]; canBeCleared:boolean };
}
