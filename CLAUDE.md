# Bazi-Destiny 八字命理分析系统

## 项目架构

六层单向数据流，每层不调用上层函数：

```
L1 输入 → L2 排盘 → L3 计分 → L4 分析 → L5 报表 → L6 输出
```

### 数据流

```
L1: 出生时间+性别
  ↓
L2: BaziEngine.calculate() → ChartResult (四柱+大运+格局+神煞)
  ↓
L3: scoreChart() → ScoreResult (五行分+身强/弱)
  ↓
L4: analyzeChart() → AnalysisResult (用神+喜神+忌神+六书引擎)
  ↓
L5: analyzeAllDimensions() → SpecialtyResultV2 (11维专项分析)
  +  generateAiAnalyses() → AI文本 (原局/大运/流年)
  ↓
L6: generateBaziReport() → Markdown报告
```

## 目录结构

```
packages/
  core/              — 类型定义 + 数据库
  engine-bazi/       — L2: BaziEngine（只做排盘+格局检测，不做计分和分析）
  knowledge-base/
    scoring/               — L3: 五行计分
      climate.ts                — 气候系数加载 (V1-V10)
      power-distribution.ts     — 16步计分流水线
      score-engine.ts           — scoreChart() 入口
      scoring-constants.ts      — 查表+工具函数
      climate-coeff-v*.json     — 10组气候表
    analysis/              — L4: 分析引擎
      analyzer.ts              — analyzeChart() 编排器
      yongshen.ts              — determineYongShen() 六引擎
      method-fuyi.ts           — 扶抑法
      method-tiaohou.ts        — 调候法
      qiongtong.ts             — 调候数据表(十干×十二月)
      dayun-judge.ts           — judgeDayun()
      types.ts                 — ChartResult/ScoreResult/AnalysisResult
      engines/                 — 六书引擎(子平/滴天髓/穷通/神峰/渊海/三命)
    specialty/             — L5a: 11维专项规则引擎
      shared/
        evaluator.ts           — ★ 统一十神评估器 (所有判断逻辑的唯一入口)
        template-lookup.ts     — ★ 统一模板查找 (优先级链+fallback)
        context.ts             — buildContext() 数据提取 + SharedContext 类型
        content-loader.ts      — loadContent/loadBase 纯加载函数
      engine-personality.ts    — 性格 (1/11)
      engine-career.ts         — 事业 (2/11)
      engine-wealth.ts         — 财运 (3/11)
      engine-marriage.ts       — 婚姻 (4/11)
      engine-health.ts         — 健康 (5/11)
      engine-children.ts       — 子女 (6/11)
      engine-parents.ts        — 父母 (7/11)
      engine-benefactors.ts    — 人际/贵人 (8/11)
      engine-siblings.ts       — 兄弟 (9/11)
      engine-property.ts       — 田宅 (10/11)
      engine-later-life.ts     — 晚年 (11/11)
      engine-education.ts      — 学业 (旧版，未被新版编排器调用)
      index.ts                 — analyzeAllDimensions() 统一入口 + computeRating()
      types.ts                 — AnalysisItem 类型 + 旧版兼容类型
      content/                 — 11维分析模板 JSON (yong.json/ji.json/base.json)
    rules/                 — 知识规则
      pattern.ts / rules.ts / rules-lookup.ts / ziwei-rules.ts / bazi-interactions.ts
  cli/                   — L6: CLI
    src/index.ts               — 编排L2→L3→L4→L5→L6
    src/detailed.ts            — generateBaziReport() 报告生成器
    src/report-scoring.ts      — generateScoringReport() 计分报告
    src/types.ts               — PrecomputedData 层间传递类型
  reports/               — L5: AI报表
    src/ai-engines.ts          — generateAiAnalyses() 原局/大运/流年
    src/narrative.ts           — generateNarratives() 旧版AI(保留)
    content/ai-prompts.json    — AI提示词模板
```

## L5a 架构详解（2026-07-02 全部重写）

### 核心理念

**统一的十神评估 → 统一的模板查找 → 统一的输出构建**

所有11个引擎共享同一套判断原语，不再各自手写判断逻辑。

### 核心类型

```typescript
// 十神力量等级
type StrengthLevel = 'absent' | 'weak' | 'moderate' | 'strong' | 'very_strong';

// 星的品质维度
interface StarQuality {
  touGan: boolean;    // 天干透出
  youGen: boolean;    // 地支有根（同五行藏干）
  zhuQi: boolean;     // 主气藏干
  beiKe: boolean;     // 被克（有其他星克制它）
  beiHe: boolean;     // 被合
}

// 完整的十神评估（替代旧的 { present: boolean }）
interface StarEvaluation {
  present: boolean;          // 是否存在且有力量（出现 + 元素分>0）
  strength: StrengthLevel;   // 力量等级
  quality: StarQuality;      // 品质维度
  favorable: boolean;        // 是否为喜（替代旧的 isStarJi）
  favorabilityReason: string; // 喜忌原因
  element: string;           // 对应五行
  score: number;             // 五行得分
  scoreRatio: number;        // 占总分比例
}

// 宫位评估
interface PalaceEvaluation {
  zhi: string; element: string; tenGod: string;
  isYongShen: boolean; isJiShen: boolean;
  clashes: string[]; combinations: string[]; harms: string[];
  score: number;
}

// 顶层上下文
interface SharedContext {
  officials, seals, wealthStars, outputStars, peers: StarEvaluation;
  spousePalace, parentsPalace, childrenPalace, siblingsPalace: PalaceEvaluation;
  elementScores, totalScore, missingElements, excessElements: ...;
  dayGan, dayEl, dayStrength, yongShen, jiShen, pattern: ...;
  dayunContext, gender, age, mixedOfficials: ...;
  isStrong, isWeak, specialPattern: boolean;
  starCount: Record<TenGodStar, number>;
}
```

### 力量分级阈值

| 等级 | 阈值 | 含义 |
|------|------|------|
| `absent` | score=0 | 不存在或无力量 |
| `weak` | 0 < ratio < 5% | 力量微弱 |
| `moderate` | 5% ≤ ratio < 15% | 有气 |
| `strong` | 15% ≤ ratio < 25% | 有力 |
| `very_strong` | ratio ≥ 25% | 过旺 |

### 喜忌判断规则（determineFavorability）

优先级：
1. **L4 jiShen 列表**（已综合身强/弱+格局+调候）— 权威来源
2. **基本原理 fallback** — 身强喜克泄耗（官杀/食伤/财）、身弱喜生扶（印星/比劫）
3. **特殊格局覆盖** — 从强格/从弱格翻转部分规则

### 模板查找优先级链（lookupStarTemplate）

```
{starKey}_{strength}     →  如 "officials_strong"
  ↓ 未找到
{starKey}                →  如 "officials"
  ↓ 未找到
base.json fallback       →  降级为"参考"
```

- 优先在 favourable 侧（yong.json/ji.json）查找
- 找不到时 fallback 到 opposite 侧（降级为"参考"）
- 最后查 base.json

### 每个引擎的统一模板

```typescript
export function analyze<Dim>(ctx: SharedContext): AnalysisItem[] {
  // Step A: 星曜判断 — lookupStarTemplate()
  // Step B: 宫位判断 — lookupPalaceTemplate()
  // Step C: 特殊条件 — lookupComboTemplate() / lookupBaseNested()
  // Step D: 兜底 — lookupBaseTemplate(DIM, 'general')
}
```

### 内容 JSON 规范

所有 key 使用英文 snake_case：

| 类别 | 命名格式 | 示例 |
|------|---------|------|
| 星+力 | `{star}_{strength}` | `officials_strong`, `seals_weak` |
| 星(通用) | `{star}` | `officials`, `peers` |
| 组合 | `{star1}_{star2}` | `officials_seals`, `output_wealth` |
| 宫位 | `{palace}Palace` | `spousePalace`, `parentsPalace` |
| 特殊 | 维度特定 | `laterLife`, `mixedOfficials`, `general` |

## 关键设计决策

1. **不再使用 Math.round** — 全浮点累进
2. **不再使用12长生** — 天干坐支影响由同柱修正+根气系统覆盖
3. **不再使用阴干根气×0.7** — 删除了
4. **判定简化** — 只判身强/身弱，自党>异党→强，反之为弱
5. **合化条件收紧** — 月令必须是化神才能化
6. **合化消耗原五行** — 六合/三合/半合触发时参与支减分
7. **截脚力度-2** — 支克干比盖头力度大
8. **天干得气** — 月令生天干→+floor(月令分/2)
9. **年柱位置权重×0.5** — 只在归日步骤用pillarRaw折扣
10. **印扶身乘气候** — 印星生身力乘印星自身气候系数
11. **专项引擎内容外置** — 分析文本在 specialty/content/*.json，改描述不动代码
12. **不得在代码中硬编码命理文本** — 违反则退回
13. **不得用as any传递关键数据** — 用 PrecomputedData 类型
14. **提交前跑 build + 24例回归**
15. **L5a 统一判断框架** — 所有引擎通过 evaluator.ts + template-lookup.ts 统一判断，不再各自手写 offset 算术和 isStarJi
16. **星力五级分级** — absent/weak/moderate/strong/very_strong，阈值 0%/5%/15%/25%
17. **present = 出现 AND 元素分>0** — 出现但无力的星视为 absent，引擎跳过
18. **内容 JSON key 全英文 snake_case** — 统一命名，查找链自动 fallback
19. **旧版 *Engine() 返回空数组桩** — 保留兼容但不再产出内容
20. **命格等级封顶B** — computeRating 基于用神有力程度+刑冲+五行平衡

## 测试

```bash
npx turbo run build                                    # 全量编译

# 单元测试
npx tsx packages/knowledge-base/src/__tests__/specialty-engines.test.ts   # L5a 专项引擎

# 回归测试
npx tsx packages/knowledge-base/src/__tests__/regression-l3.test.ts       # L3 计分 24例
npx tsx packages/knowledge-base/src/__tests__/regression-l5a.test.ts      # L5a 专项 28例

# 单例端到端
npx tsx packages/cli/src/index.ts "1985-12-09 10:30" --gender M --scoring
```

回归测试数据: `data/cases.json` (28例) + `data/expected.json` (L3预期强弱)
- L3 命中: 24/24（4例跳过：刘媛从格、黄楷钒/TEST-陈葆欣/TEST-AUTO 无预期）
- L5a 验证: 28/28 全部通过（无预期文件，验证结构合规性+无异常）

## 28例测试

数据: `data/cases.json` + `data/expected.json`
L3 命中: 24/24（刘媛从格待实现，已挂起）
L5a 验证: 28/28 全部通过
判定文件: `docs/research/scoring-results.md`
回归汇总: `output/REGRESSION/regression-l5a-summary.json`

## 最新变更（2026-07-02）— L5a 全部重写

### 新建文件
- `specialty/shared/evaluator.ts` — 统一十神评估器。包含：
  - `evaluateStar()` — 评估单个十神的存在性/力量/品质/喜忌
  - `evaluateAllStars()` — 批量评估全部5个十神
  - `evaluatePalace()` — 宫位评估
  - `determineFavorability()` — 喜忌判断（替代 isStarJi）
  - `classifyStrength()` — 五级力量分级
  - `tenGodElement()` / `tenGodOffset()` — 十神→五行映射
  - `countStarPillars()` — 统计十神出现柱数
  - `isSpecialPattern()` — 特殊格局检测
- `specialty/shared/template-lookup.ts` — 统一模板查找。包含：
  - `lookupStarTemplate()` — 星模板查找（优先级链 + fallback）
  - `lookupComboTemplate()` — 组合模板查找（官印相生/食伤生财）
  - `lookupPalaceTemplate()` — 宫位模板查找
  - `lookupBaseTemplate()` — base.json 查找
  - `lookupBaseNested()` — 嵌套 base 查找（dayGanTraits.壬）
  - `lookupContentTemplateWithReplace()` — 内容模板+占位符替换
- `__tests__/regression-l5a.test.ts` — L5a 28例回归测试

### 重写文件
- `specialty/shared/context.ts` — buildContext v2：
  - SharedContext 类型的十神字段从 `StarPresence {present:boolean}` 升级为 `StarEvaluation`
  - 宫位字段从 `PalaceInfo` 升级为 `PalaceEvaluation`
  - 新增 `excessElements`, `isStrong`, `isWeak`, `specialPattern`, `starCount`
  - 调用 evaluateAllStars() 统一评估
- `specialty/shared/content-loader.ts` — 简化为纯加载函数，移除 isStarJi
- 11个引擎文件 — 全部重写为统一模板模式：
  - 移除手写 offset 算术、isStarJi 调用、ad-hoc key 构造
  - 改用 `lookupStarTemplate()`, `lookupPalaceTemplate()`, `lookupComboTemplate()`
  - 每个引擎 ~30行
- `specialty/index.ts` — analyzeAllDimensions 使用新 SharedContext，computeRating 重写
- `specialty/content/` — 所有 JSON key 统一英文 snake_case

### 修改文件
- `cli/src/detailed.ts` — 移除旧版 analyzeSpecialty fallback，只使用新引擎输出

### 删除内容
- `isStarJi()` 函数（移入 evaluator.determineFavorability）
- 各引擎中的手写 offset 算术和 ad-hoc 模板 key 构造

## 当前待办

- 刘媛从格判定待实现
- education 维度待整合入新版编排器
- 旧版 *Engine() 桩函数待彻底移除

## 编码规范

见 `docs/research/coding-standards.md`
核心：内容外置JSON、禁as any、提交前回归、函数≤40行、禁中文变量名

## 工作流程

每次完成任务后更新此文件：
- 修改「最新变更」章节
- 如新增文件/模块，更新「目录结构」
- 如新增设计决策，更新「关键设计决策」
- 如新增测试数据，更新「测试」章节
