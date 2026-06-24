/**
 * 属性扩展基类 — 六书 annotator 共用类型
 *
 * 设计原则：不修改 BaziChartSchema，通过 EnrichedChart 组合模式挂载扩展属性。
 * 所有 Filter/Pipeline 接收 EnrichedChart，不直接依赖 BaziChart。
 */
import type { BaziChart } from '@bazi-destiny/core';

export enum BookName {
  QiongTong = '穷通宝鉴',
  DiTianSui = '滴天髓',
  ShenFeng = '神峰通考',
  ZiPing = '子平真诠',
  YuanHai = '渊海子平',
  SanMing = '三命通会',
}

export interface BookAnnotation {
  book: BookName;
  version: string;
  attributes: Record<string, unknown>;
}

export interface EnrichedChart {
  base: BaziChart;
  annotations: BookAnnotation[];
  lastUpdated?: string;
}

export function getAnnotation(chart: EnrichedChart, book: BookName): BookAnnotation | undefined {
  return chart.annotations.find(a => a.book === book);
}

export function getAttribute<T>(chart: EnrichedChart, book: BookName, key: string): T | undefined {
  const ann = getAnnotation(chart, book);
  return ann?.attributes[key] as T | undefined;
}

export function setAnnotation(chart: EnrichedChart, book: BookName, attrs: Record<string, unknown>): void {
  const existing = chart.annotations.findIndex(a => a.book === book);
  if (existing >= 0) {
    chart.annotations[existing] = { book, version: '1.0', attributes: attrs };
  } else {
    chart.annotations.push({ book, version: '1.0', attributes: attrs });
  }
  chart.lastUpdated = new Date().toISOString();
}

export function enrichChart(base: BaziChart): EnrichedChart {
  return { base, annotations: [], lastUpdated: new Date().toISOString() };
}
