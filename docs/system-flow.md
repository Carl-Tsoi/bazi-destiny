# 八字命理系统 — 数据流全景图

> 生成日期：2026-06-30 | 基于当前 `main` 分支代码

---

## 一、总览：六层单向数据流

```mermaid
flowchart TB
    subgraph L1["🔵 L1 输入层"]
        CLI["CLI (index.ts)<br/>Commander.action()"]
        BI["BirthInfo<br/>zod parse"]
    end

    subgraph L2["🟢 L2 排盘层"]
        BE["BaziEngine.calculate(birthInfo)<br/>→ Result&lt;BaziOutput&gt;"]
        CHART["ChartResult 桥接<br/>手动提取 pillars/dayun/pattern"]
    end

    subgraph L3["🟡 L3 计分层"]
        SC["scoreChart(chart)<br/>→ ScoreResult"]
        CP["calculatePower()<br/>16步流水线"]
    end

    subgraph L4["🟠 L4 分析层"]
        AC["analyzeChart(chart, score, opts)<br/>→ AnalysisResult"]
        DYS["determineYongShen()<br/>六引擎专家系统"]
        JDY["judgeDayun()<br/>大运吉凶判断"]
    end

    subgraph L5["🔴 L5 报表层"]
        AAD["analyzeAllDimensions()<br/>11维专项引擎"]
        CTX["buildContext()<br/>数据提取公共层"]
        AIA["generateAiAnalyses()<br/>3次 Claude API (--ai)"]
    end

    subgraph L6["🟣 L6 输出层"]
        GBR["generateBaziReport()<br/>→ markdown 报告"]
        GSR["generateScoringReport()<br/>→ 计分明细"]
    end

    L1 -->|"BirthInfo"| L2
    L2 -->|"ChartResult"| L3
    L3 -->|"ScoreResult"| L4
    L4 -->|"AnalysisResult"| L5
    L5 -->|"SpecialtyResultV2 + AiResult"| L6

    L3 & L4 -->|"Object.assign 注入 bazi 对象"| L6

    style L1 fill:#2196F3,color:#fff
    style L2 fill:#4CAF50,color:#fff
    style L3 fill:#FFC107,color:#333
    style L4 fill:#FF9800,color:#fff
    style L5 fill:#F44336,color:#fff
    style L6 fill:#9C27B0,color:#fff
```

**核心原则**：每层不调用上层函数。数据只能向下流动。

---

## 二、L1→L2：输入 → 排盘

```mermaid
flowchart LR
    ARGV["CLI 参数<br/>datetime + --gender"] -->|"replace(' ', 'T')"| ZOD["BirthInfoSchema.parse()"]
    ZOD --> BI["BirthInfo<br/>{datetime, lat, lon, timezone, gender}"]
    BI --> CALC["BaziEngine.calculate(birthInfo)"]
    
    subgraph engine["BaziEngine 内部"]
        CALC --> RAW["@openfate/bazi-engine<br/>calculateBaziChart()"]
        RAW -->|"转换干支/十神/纳音/藏干"| XFORM["结构化 PillarData × 4"]
        XFORM --> DP["detectPattern(chart)<br/>格局自动检测"]
    end
    
    DP --> OUT["Result&lt;BaziOutput&gt;<br/>.value.data → bazi 变量"]

    style ZOD fill:#90CAF9
    style OUT fill:#81C784
```

**BaziOutput 结构**：
```
pillars: { 年柱, 月柱, 日柱, 时柱 }
  └─ { gan, zhi, nayin, shishen, canggan[] }
pattern: string
yongShen: '' (空，L4 填入)
shensha: {}
dayun: { startAgeYears, direction, steps[] }
  └─ step { startAge, endAge, gan, zhi, ganShishen, zhiShishen }
```

---

## 三、L2→L3：排盘 → 计分

```mermaid
flowchart TB
    BAZI["bazi: BaziOutput<br/>(from L2)"] --> EXTRACT["⚠️ 手动提取 ChartResult<br/>as ChartResult['pillars']<br/>as ChartResult['dayun']"]
    
    EXTRACT --> CR["ChartResult {<br/>  pillars, dayun, pattern, shensha,<br/>  dayGan, dayZhi, monthZhi<br/>}"]
    
    CR --> SC["scoreChart(chart)"]
    
    subgraph pipeline["16步计分流水线 calculatePower()"]
        S1["1.天干基分<br/>3×climate + root×climate + 得气"]
        S2["2.地支力量<br/>weight[年2月5日3时4] × climate"]
        S3["3.同柱修正<br/>一气+1 | 盖头0-1 | 截脚-2 | 天覆0+1"]
        S4["4.天干间生克<br/>6对，距离衰减"]
        S5["5.地支间生克<br/>6对，距离衰减"]
        S6["6-10.合化<br/>天干五合/地支六合/三合/半合/三会"]
        S11["11-12.刑冲<br/>相刑(季节调制)/六冲"]
        S13["13.Floor at 0"]
        S14["14.年柱×0.5 位置折扣"]
        S15["15.归日: 自党 vs 异党"]
        S16["16.判定: ziDang>yiDang?强:弱"]
    end
    
    SC --> SR["ScoreResult {<br/>  elementScores, dayScore,<br/>  dayStrength, ziDang, yiDang,<br/>  details[], climateVersion<br/>}"]

    style EXTRACT fill:#FFAB91,stroke:#E64A19
    style SR fill:#FFF176
```

### ⚠️ 问题点 E：L2→L3 桥接

CLI 中手动从 `BaziOutput` 提取字段构造 `ChartResult`，同时额外提取 `dayGan`/`dayZhi`/`monthZhi` 三个便捷字段。类型安全依赖 `as` 断言。

```typescript
// packages/cli/src/index.ts:116-124
const chart: ChartResult = {
  pillars: bazi.pillars as ChartResult['pillars'],
  dayun: bazi.dayun as ChartResult['dayun'],
  pattern: bazi.pattern as string || '',
  shensha: (bazi.shensha || {}) as ChartResult['shensha'],
  dayGan: (bazi.pillars as Record<string, {gan: string}>).日柱?.gan ?? '',
  dayZhi: (bazi.pillars as Record<string, {zhi: string}>).日柱?.zhi ?? '',
  monthZhi: (bazi.pillars as Record<string, {zhi: string}>).月柱?.zhi ?? '',
};
```

---

## 四、L3→L4：计分 → 分析

```mermaid
flowchart TB
    INPUT["chart: ChartResult<br/>score: ScoreResult<br/>opts: {age, gender}"] --> AC["analyzeChart(chart, score, opts)"]
    
    AC --> DYS["determineYongShen()<br/>六引擎专家系统"]
    
    subgraph six["六书引擎（顺序执行，遇从格/奇格即停）"]
        ENG1["① zipingEngine<br/>子平格局法"]
        ENG2["② ditiansuiEngine<br/>滴天髓扶抑/从化"]
        ENG3["③ qiongtongEngine<br/>穷通调候"]
        ENG4["④ shenfengEngine<br/>神峰病药"]
        ENG5["⑤ yuanhaiEngine<br/>渊海神煞"]
        ENG6["⑥ sanmingEngine<br/>三命奇格"]
    end
    
    subgraph classical["古典方法（辅助）"]
        MT["methodTiaoHou(dayGan, monthZhi, pillars)"]
        MF["methodFuYi(dayGan, score)"]
        MB["methodBingYao(pillars, dayStrength)"]
    end
    
    DYS --> classical --> six
    
    DYS --> YSR["YongShenResult {<br/>  tiaohou, fuyi, bingyao,<br/>  engines[6],<br/>  final: {yongShen, xiShen[], jiShen[]}<br/>}"]
    
    AC --> JDY["judgeDayun(steps, pillars, xiShen, jiShen, yongShen)"]
    JDY --> DJ["DayunJudgment[]<br/>{step, ganJudgment, zhiJudgment, interactions, overall}"]
    
    YSR & DJ --> AR["AnalysisResult {<br/>  yongShen, xiShen[], jiShen[],<br/>  engines[], dayunJudgments[],<br/>  tiaohou, fuyi, bingyao<br/>}"]

    style AR fill:#FFCC80
```

---

## 五、L4→L5a：分析 → 11维专项引擎

```mermaid
flowchart TB
    INPUT2["chart: ChartResult<br/>score: ScoreResult<br/>analysis: AnalysisResult<br/>opts: {gender, age}"] --> AAD["analyzeAllDimensions()"]
    
    AAD --> BC["buildContext(chart, score, analysis, opts)<br/>── 数据提取公共层 ──"]
    
    subgraph ctx["SharedContext 输出"]
        SS["十神强度 × 5<br/>officials | seals | wealthStars<br/>outputStars | peers"]
        PL["四柱宫位 × 4<br/>spousePalace | parentsPalace<br/>childrenPalace | siblingsPalace"]
        GL["全局状态<br/>elementBalance | dayStrength<br/>yongShen | xiShen | jiShen<br/>dayunContext"]
    end
    
    BC --> SS & PL & GL
    SS & PL & GL --> DIMS
    
    subgraph dims["11维专项引擎（规则驱动）"]
        D1["analyzePersonality()<br/>性格"]
        D2["analyzeCareer()<br/>事业"]
        D3["analyzeWealth()<br/>财运"]
        D4["analyzeMarriage()<br/>婚姻"]
        D5["analyzeHealth()<br/>健康"]
        D6["analyzeChildren()<br/>子女"]
        D7["analyzeParents()<br/>父母"]
        D8["analyzeBenefactors()<br/>人际"]
        D9["analyzeSiblings()<br/>兄弟"]
        D10["analyzeProperty()<br/>田宅"]
        D11["analyzeLaterLife()<br/>晚年"]
    end
    
    DIMS --> RATING["computeRating(ctx)<br/>→ {grade, summary}"]
    
    RATING --> SRV2["SpecialtyResultV2 {<br/>  dimensions: DimensionResult[],<br/>  rating: {grade, summary}<br/>}"]

    style BC fill:#CE93D8
    style SRV2 fill:#EF9A9A
```

### SharedContext：关键计算

| 字段 | 计算逻辑 |
|------|---------|
| `peers.score` | = `max(0, dayElScore - dayOwnScore)` — 比劫分 = 同五行总分 - 日主自身分 |
| `strength` | >20% 强 / >5% 一般 / >0 弱 / ≤0 无 |
| `palace.isYongShen` | 宫位地支五行 ∈ 用神列表 |
| `clashes/combos` | 从 `score.details[]` 字符串匹配解析 |

---

## 六、L5b：AI 分析 （--ai 条件触发）

```mermaid
flowchart LR
    subgraph ai_input["AiInput 构造 (CLI index.ts)"]
        CD["chartData<br/>JSON.stringify(chart.pillars)"]
        SD["scoreData<br/>'自党X 异党Y 日主Z'"]
        AD["analysisData<br/>'用神A 喜B/C 忌D/E'"]
        SS2["specialtySummary<br/>dimensions 串联"]
        DYD["currentDayun/nextDayun<br/>dayunInteractions"]
        LND["liunianData<br/>'2026年 丙午'"]
    end
    
    ai_input --> GAA["generateAiAnalyses(AiInput)"]

    subgraph api["3 次 Anthropic API 调用（并行）"]
        YJ["generateYuanju(input)<br/>→ 原局分析"]
        DY["generateDayun(input)<br/>→ 大运解读"]
        LN["generateLiunian(input)<br/>→ 流年解读"]
    end
    
    GAA --> api
    api --> AIR["AiResult {<br/>  yuanju, dayun, liunian<br/>}"]
    
    style GAA fill:#E1BEE7
    style AIR fill:#CE93D8
```

**提示词模板**：`packages/reports/content/ai-prompts.json` → 注入参数 → `temperature: 0.3`

---

## 七、L5→L6：汇总 → 报告生成

```mermaid
flowchart TB
    subgraph assembly["⚠️ PrecomputedData 组装 (CLI index.ts)"]
        PD["PrecomputedData {<br/>  yongShenResult: Record&lt;string, <b>any</b>&gt;,  ⚠️<br/>  score: { dayStrength, dayScore, ... },<br/>  specialty: SpecialtyResultV2,<br/>  aiResult?: <b>any</b>  ⚠️<br/>}"]
    end

    subgraph inject["⚠️ Object.assign 注入"]
        OJ["Object.assign(bazi, {<br/>  yongShen,<br/>  dayStrength,<br/>  final<br/>})"]
    end

    PD & OJ --> GBR["generateBaziReport(bazi, birthInfo, precomputed)"]
    PD --> GSR["generateScoringReport(bazi, birthInfo, precomputed)"]

    subgraph report["报告生成内部 (detailed.ts)"]
        FALLBACK["⚠️ precomputed 缺失时<br/>重新调用 determineYongShen()"]
        REUSE["precomputed 可用时<br/>直接使用 specialty.dimensions"]
        AI_SECTION["AI 章节<br/>precomputed.aiResult"]
    end

    GBR --> MD["📄 Markdown 报告<br/>12 章节 (H2/H3 层级)"]
    GSR --> MD2["📄 计分报告<br/>7 章节 + 附录"]

    style assembly fill:#FFAB91,stroke:#E64A19
    style inject fill:#FFAB91,stroke:#E64A19
    style FALLBACK fill:#FFAB91,stroke:#E64A19
    style MD fill:#81C784
```

---

## 八、类型流转全景

```mermaid
flowchart LR
    BI2["BirthInfo<br/>zod schema"] -->|"L2 calculate()"| BO2["BaziOutput<br/>@bazi-destiny/core"]
    BO2 -->|"⚠️ as 强转提取"| CR2["ChartResult<br/>analysis/types.ts"]
    CR2 -->|"L3 scoreChart()"| SR2["ScoreResult<br/>analysis/types.ts"]
    SR2 -->|"L4 analyzeChart()"| AR2["AnalysisResult<br/>analysis/types.ts"]
    AR2 -->|"L5a analyzeAllDimensions()"| SV2["SpecialtyResultV2<br/>specialty/index.ts"]
    AR2 -->|"L5b generateAiAnalyses()"| AIR2["AiResult<br/>reports/ai-engines.ts"]
    SV2 & AIR2 -->|"组装"| PD2["PrecomputedData<br/>cli/types.ts"]
    PD2 -->|"L6 generateXxxReport()"| STR["string<br/>markdown"]

    style CR2 fill:#FFCC80
    style PD2 fill:#FFAB91
```

---

## 九、问题清单

| # | 严重度 | 问题 | 位置 | 影响 |
|---|--------|------|------|------|
| **A** | 中 | `PrecomputedData.yongShenResult: Record<string, any>` | `cli/types.ts:7` | 丢失 YongShenResult 类型信息，报告生成器使用时无类型提示 |
| **B** | 中 | `outputs.bazi as any` 多处强制类型转换 | `cli/index.ts` 多处 | L3/L4/L5 全部通过 `as any` 传参给报告生成器 |
| **C** | 低 | `Object.assign(bazi, {...})` 突变注入 | `cli/index.ts:137-141` | 修改 L2 输出对象，污染不变量；L4 结果混入 bazi 对象 |
| **D** | 中 | 报告生成器内部可重新计算 | `cli/detailed.ts:215-218` | `precomputed` 缺失时调用 `determineYongShen()`，打破单一数据源 |
| **E** | 低 | L2→L3 桥接手动拼字段 | `cli/index.ts:116-124` | `ChartResult` 需额外提取 `dayGan/dayZhi/monthZhi`，类型安全靠断言 |
| **F** | 低 | `aiResult?: any` 无类型 | `cli/types.ts:16` | AI 结果无结构约束 |
| **G** | 低 | `detailed.ts` 保留旧版 `baziDimension()` 函数 | `cli/detailed.ts:35` | 与 L5 `specialty` 引擎功能重复，两套实现并存 |

---

## 十、层间调用关系矩阵

| | L1 CLI | L2 Engine | L3 Score | L4 Analysis | L5a Specialty | L5b AI | L6 Report |
|---|---|---|---|---|---|---|---|
| **L1 CLI** | — | ✅ 调用 | ✅ 调用 | ✅ 调用 | ✅ 调用 | ✅ 调用 | ✅ 调用 |
| **L2 Engine** | ❌ | — | ❌ | ❌ | ❌ | ❌ | ❌ |
| **L3 Score** | ❌ | ❌ | — | ❌ | ❌ | ❌ | ❌ |
| **L4 Analysis** | ❌ | ❌ | ❌ | — | ❌ | ❌ | ❌ |
| **L5a Specialty** | ❌ | ❌ | ❌ | ❌ | — | ❌ | ❌ |
| **L5b AI** | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ |
| **L6 Report** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | — |

✅ = 该层被上层调用 / ❌ = 不会反向调用

**结论**：严格单向流已建立。当前不完善之处集中在：
1. CLI 编排层的类型安全（`as any` 泛滥）
2. `PrecomputedData` 的类型设计（`any` 字段）
3. L5→L6 的数据传递方式（`Object.assign` 突变 + 报告生成器 fallback 重新计算）

---

## 十一、改进方向（后续建议）

```
当前架构                         理想架构
────────                        ────────
BaziOutput                      BaziOutput
  │                                │
  ├─ as 提取 ChartResult           ├─ toChartResult() 类型安全转换
  ├─ as any 传参                    ├─ TypedPipeline<L1,L2,L3,L4,L5,L6>
  ├─ Object.assign 注入             ├─ PrecomputedData 不可变 + 强类型
  └─ precomputed fallback           └─ 报告生成器纯函数，无 fallback 计算
```

优先级：**C > A > D > B > E > F > G**
