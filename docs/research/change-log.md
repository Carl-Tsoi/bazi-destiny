# 变更日志

> 记录所有架构变更和代码重组操作

---

## 2026-06-29 — 六层架构重构

### 背景

系统存在三个问题：
1. `determineYongShen` 被 BaziEngine、generateScoringReport、generateBaziReport 三处各调用一次，重复计算
2. `calculatePower` 藏在 `methodFuYi` 内部，调用链不可见
3. `pipeline/`、`attributes/`、`evaluator.ts` 等 16 个文件从未被引用，属于早期框架残留

### 架构变更

**L2: 排盘层**
- `packages/engine-bazi/src/index.ts`：移除 `determineYongShen` 调用，BaziEngine 只做排盘+格局检测
- `chart.yongShen`、`chart.dayStrength`、`chart.final` 不再由 Engine 填充

**L3: 计分层（新建）**
- `packages/knowledge-base/src/scoring/score-engine.ts`：新建 `scoreChart()` 函数，封装 `calculatePower` 调用，返回 `ScoreResult`
- `packages/knowledge-base/src/analysis/types.ts`：新建 `ScoreResult`、`ChartResult`、`AnalysisResult` 接口定义

**L4: 分析层（新建）**
- `packages/knowledge-base/src/analysis/analyzer.ts`：新建 `analyzeChart()` 编排器，调用 `determineYongShen` + `judgeDayun`，返回 `AnalysisResult`

**L5: 报告层（适配）**
- `packages/cli/src/detailed.ts`：`generateBaziReport()` 新增 `precomputed` 参数，优先使用外部传入的用神结果
- `packages/cli/src/report-scoring.ts`：`generateScoringReport()` 同上
- 报告层不再主动调用 `determineYongShen`（保留 fallback 用于外部直接调用场景）

**L6: 编排层（适配）**
- `packages/cli/src/index.ts`：CLI 改为 L2→L3→L4→L5 六层单向调用
- L3 和 L4 的结果通过 `(bazi as any)._precomputed` 注入报告生成器

**内部模块签名变更**
- `packages/knowledge-base/src/method-fuyi.ts`：`methodFuYi()` 改为接收 `ScoreResult`（不再内部调用 `calculatePower`）
- `packages/knowledge-base/src/yongshen.ts`：`determineYongShen()` 新增可选 `score?: ScoreResult` 参数
- `packages/knowledge-base/src/index.ts`：清理无效导出（attributes/*、pipeline/*、evaluator.ts 共18行）

### 删除的文件（16个）

| 目录/文件 | 数量 | 原因 |
|------|:--:|------|
| `pipeline/` | 7 | 早期过滤器管线框架，未被使用 |
| `attributes/` | 7 | 六书属性扩展框架，未被使用 |
| `evaluator.ts` | 1 | 评估器，未被使用 |
| 误删 `qiongtong.ts` | 1 | 调候数据表，已被 `method-tiaohou.ts` 引用。**已从 git 恢复** |

### 未完成事项

1. 报告生成器 `detailed.ts` 和 `report-scoring.ts` 仍保留 `determineYongShen` fallback 调用（冗余但安全）
2. `specialty/engine-*.ts` 10 个空壳文件待重写为专项分析引擎
3. 预计算结果通过 `(bazi as any)._precomputed` 传递，类型不安全
4. `BaziEngine` 输出的 `chart` 对象仍有 `yongShen`、`dayStrength` 等遗留字段

### 验证

- `npx turbo run build`：通过
- 24 例回归测试：23/24 命中（刘媛从格待实现）
- 判定逻辑：自党 > 异党 → 身强，自党 < 异党 → 身弱

---

## 2026-06-24~26 — 计分引擎重构

（早期变更，简单记录）

- 去掉 12 长生加值（天干不再被坐支二次扣分）
- 去掉全部 `Math.round`，全浮点累进
- 去掉阴干根气 ×0.7
- 天干得气：月令生天干 → +floor(月令分/2)
- 同柱修正：截脚力度 -1→-2
- 合化消耗原五行：六合/三合/半合/三会触发时参与地支原五行减分
- 合化条件收紧：月令必须是化神才能化
- 印星扶身按气候调整 + 去掉 floor
- 判定简化：去掉中和偏旺/中和偏弱，只判身强/身弱
- 年柱位置权重 ×0.5
- 气候系统模块化（climate.ts + 10 组系数 V1-V10）

---

## 2026-06-29 — 重构后三次自检

### 第11次：完成度审计

| 事项 | 状态 | 说明 |
|------|:--:|------|
| L2 BaziEngine 去用神 | ✅ | 不再调用 determineYongShen |
| L3 scoreChart 独立 | ✅ | 新建 scoring/score-engine.ts |
| L4 analyzeChart 独立 | ✅ | 新建 analysis/analyzer.ts |
| L5 报告层适配 | ⚠️ | 接受预计算结果，但 fallback 仍存在 |
| L6 CLI 编排 | ✅ | 六层单向调用 |
| 删除废弃文件 | ✅ | 16个，qiongtong.ts 误删后恢复 |
| 清理 index.ts | ✅ | 移除 18 行无效导出 |
| 回归测试 | ✅ | 23/24，未退化 |
| 类型安全 | ❌ | `_precomputed` 通过 `as any` 传递 |
| 架构文档 | ❌ | 未写 |
| 专项引擎 | ❌ | 10 个空壳未动 |
| 从格检测 | ❌ | 刘媛仍未命中 |

### 第12次：风险点

1. **`_precomputed` 是 `as any`**：如果报告生成器被外部代码绕过 CLI 直接调用，且不传 precomputed，fallback 路径会重新计算（目前 fallback 能工作，但与 L3/L4 计算结果可能不一致）。

2. **`chart` 对象字段冗余**：BaziEngine 不再填充 `yongShen`/`dayStrength`/`final`，但 CLI 会在 L4 之后重新注入这些字段。如果后续代码修改了注入逻辑而忘记同步，报告会读到过期值。

3. **specialty 空壳**：10 个文件虽未被删除，但 `analyzeSpecialty` 仍在被调用。当前 `specialty/index.ts` 的 `analyzeSpecialty` 函数返回的是一个简单的综合评分对象，不是真正的 11 维分析。

### 第13次：重构原则（后续必须遵守）

1. **删文件前先读内容，用 `tsc --noEmit` 验证**
2. **每次只改一个模块，改完立刻编译+回归**
3. **新建不删旧，迁移完再清理**
4. **类型安全优先，避免 `as any` 传递关键数据**
5. **写完代码写文档，架构决策必须有记录**
