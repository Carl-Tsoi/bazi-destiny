/**
 * Standard 12 dimensions — aligned with Ziwei 12 palaces.
 * All three engines produce signals for each dimension.
 */
export interface DimensionDef {
  id: string;
  name: string;
  ziweiPalace: string;  // matching Ziwei palace name
  description: string;
}

export const TWELVE_DIMENSIONS: DimensionDef[] = [
  { id: 'self', name: '命格', ziweiPalace: '命宫', description: '性格、天赋、人生大方向、气质格局' },
  { id: 'siblings', name: '兄弟', ziweiPalace: '兄弟', description: '手足关系、同辈合作、竞争环境' },
  { id: 'spouse', name: '夫妻', ziweiPalace: '夫妻', description: '婚姻感情、配偶条件、两性关系' },
  { id: 'children', name: '子女', ziweiPalace: '子女', description: '子女缘分、下属关系、创作产出' },
  { id: 'wealth', name: '财帛', ziweiPalace: '财帛', description: '财运收入、理财能力、物质生活' },
  { id: 'health', name: '疾厄', ziweiPalace: '疾厄', description: '身体健康、疾病倾向、灾厄' },
  { id: 'travel', name: '迁移', ziweiPalace: '迁移', description: '外出发展、变动机遇、远行运' },
  { id: 'friends', name: '交友', ziweiPalace: '仆役', description: '朋友关系、人际交往、部属运' },
  { id: 'career', name: '官禄', ziweiPalace: '官禄', description: '事业发展、学业功名、社会地位' },
  { id: 'property', name: '田宅', ziweiPalace: '田宅', description: '房产家宅、家庭环境、不动产运' },
  { id: 'fortune', name: '福德', ziweiPalace: '福德', description: '精神享受、福气福报、晚年生活' },
  { id: 'parents', name: '父母', ziweiPalace: '父母', description: '父母缘分、长辈关系、上司运' },
];
