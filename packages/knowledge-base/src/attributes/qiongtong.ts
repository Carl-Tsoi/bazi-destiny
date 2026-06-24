/** 穷通宝鉴专属属性 */
export interface QiongTongAttributes {
  tiaoHouPrimary: string;
  tiaoHouSecondary: string;
  tiaoHouAvoid: string;
  coldWarmScore: number;
  dryWetScore: number;
  climateUrgency: 'normal' | 'moderate' | 'emergency';
  woodState: '活木' | '死木' | null;
  fireState: '炎燥' | '温和' | '微弱' | null;
  earthState: '虚浮' | '燥烈' | '实厚' | '寒湿' | null;
  metalState: '锐利' | '柔弱' | '寒金' | null;
  waterState: '汪洋' | '干涸' | '寒冻' | null;
  seasonEffectModifier: Record<string, Record<string, string>>;
}
