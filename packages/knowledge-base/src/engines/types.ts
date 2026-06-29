/**
 * 专家系统引擎 — 分层架构共享类型
 *
 * 每个引擎接收上一个引擎的输出，产生自己的结果。
 * 不是平级投票，而是逐层精炼。
 */
import type { BaziChart } from '@bazi-destiny/core';
import type { FuYiOutput } from '../analysis/method-fuyi.js';
import type { TiaoHouOutput } from '../analysis/method-tiaohou.js';
import type { TongGuanOutput } from '../analysis/method-tongguan.js';
import type { BingYaoOutput } from '../analysis/method-bingyao.js';

/** 单引擎输出 */
export interface EngineResult {
  engine: string;
  /** 本引擎推荐的用神 */
  yongShen: string | null;
  /** 用神类型 */
  yongShenType?: '格局用神' | '平衡用神' | '调候用神' | '病药用神' | '神煞' | '奇格';
  /** 诊断信息 */
  diagnostics: string[];
  /** 是否触发特殊格局（中断后续引擎） */
  specialPattern?: boolean;
}

/** 分层分析上下文 — 在六引擎间流转 */
export interface LayeredContext {
  base: BaziChart;
  fuyi: FuYiOutput;
  tiaohou: TiaoHouOutput;
  tongguan: TongGuanOutput | null;
  bingyao: BingYaoOutput | null;
  /** 引擎输出，按调用顺序排列 */
  engineResults: EngineResult[];
  /** 最终裁决 */
  finalYongShen?: string;
  finalXiShen?: string[];
  finalJiShen?: string[];
}
