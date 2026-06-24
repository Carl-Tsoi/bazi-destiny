/** 子平真诠专属属性 */
export interface ZiPingAttributes {
  pattern: string;
  patternSource: '本气透干'|'余气透干'|'三合会支'|'本气'|'建禄月劫';
  yongShen: string;
  xiangShen: string | null;
  patternStatus: '成格'|'败格'|'成中有败'|'败中有成';
  remedy: string | null;
  purity: { isPure:boolean; score:number; mixedBy:string[] };
  luckTransitions: Array<{pillar:string;effect:'助格'|'破格'|'改变格局';detail:string}>;
}
