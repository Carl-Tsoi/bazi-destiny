/** Shared types for specialty engines — L5a 输出类型 */

// ── 三层分析输出 ──
export interface AnalysisItem {
  level: '确定' | '参考';
  layer1: string;   // 命理判断
  layer2: string;   // 对命主影响
  layer3: string;   // 行动建议
  citation?: string; // 古籍引证
}
