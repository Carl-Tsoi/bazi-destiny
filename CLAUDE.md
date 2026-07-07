# Bazi-Destiny 八字命理分析系统

## 仓库与姊妹项目

git 根为 `/Users/carl/Projects/Lucky`，bazi-destiny 是其中的命理分析核心。姊妹项目：

- **`bazi-knowledge-collector`** — 维护 `bazi-destiny/packages/knowledge-base/src/specialty/content/` 下的 11 维断语模板 JSON（各维度的 yong/ji/base.json）。在 bazi-destiny 里看到这批 JSON 有改动，是 collector 的输出，**不是 bazi-destiny 自身代码改动**；可随 bazi-destiny 一起提交。
- `bazi-scraper`、`gstack` — 其他工具。

工作流：本地直接在 `main` 分支开发，push 到 `github.com/Carl-Tsoi/bazi-destiny`（不开 PR 分支）。

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
L6: generateBaziReport() → Markdown报告 (8章专业格式)
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
    analysis/              — L4: 分析层（编排 + 古典方法 + 数据表）
      analyzer.ts              — analyzeChart() 编排器(L2→L3→L4)
      yongshen.ts              — determineYongShen() 调度变格+六书引擎
      dayun-judge.ts           — judgeDayun() 大运吉凶
      method-fuyi.ts           — 扶抑法
      method-tiaohou.ts        — 调候法
      method-tongguan.ts       — 通关法
      method-bingyao.ts        — 病药法
      jiang-wenzheng.ts        — 蒋文正流派断语
      qiongtong.ts             — 调候数据表(十干×十二月)
      types.ts                 — ChartResult/ScoreResult/AnalysisResult
    engines/              — L4: 专家系统引擎（分层精炼，非平级投票）
      types.ts                 — LayeredContext 引擎间流转上下文 + EngineResult
      biange-zhuangwang.ts     — 变格① 专旺格(曲直/炎上/从革/润下/稼穑)
      biange-cong.ts           — 变格② 从格(从财/从杀/从儿/从势，真假从+阳干降级)
      biange-shishang-zhisha.ts— 变格③ 食伤制杀格
      ziping.ts                — 子平格局法
      ditiansui.ts             — 滴天髓 扶抑/从化
      qiongtong.ts             — 穷通宝鉴 调候用神
      shenfeng.ts              — 神峰通考 病药
      yuanhai.ts               — 渊海子平 神煞
      sanming.ts               — 三命通会 奇格
      ※ yongshen.ts 调用顺序: [专旺, 从格, 食伤制杀, 子平, 滴天髓, 穷通, 神峰, 渊海, 三命]
         变格引擎命中即 specialPattern=true，中断后续六书
    specialty/             — L5a: 11维专项规则引擎
      shared/
        evaluator.ts           — ★ 统一十神评估器 (所有判断逻辑的唯一入口)
        template-lookup.ts     — ★ 统一模板查找 (优先级链+fallback)
        context.ts             — buildContext() 数据提取 + SharedContext 类型
        content-loader.ts      — loadContent/loadBase 纯加载函数，读本地 content/
      engine-personality.ts    — 性格 (1/11)
      engine-career.ts         — 事业 (2/11)
      engine-wealth.ts         — 财运 (3/11)
      engine-marriage.ts       — 婚姻 (4/11，含性别区分)
      engine-health.ts         — 健康 (5/11)
      engine-children.ts       — 子女 (6/11，含性别区分)
      engine-parents.ts        — 父母 (7/11，偏财=父)
      engine-benefactors.ts    — 人际/贵人 (8/11)
      engine-siblings.ts       — 兄弟 (9/11)
      engine-property.ts       — 田宅 (10/11)
      engine-later-life.ts     — 晚年 (11/11，含性别区分)
      engine-education.ts      — 学业 (旧版，未被新版编排器调用)
      index.ts                 — analyzeAllDimensions() 统一入口 + computeRating()
      types.ts                 — AnalysisItem 类型 + 旧版兼容类型
      content/                 — 11维分析模板 JSON (yong.json/ji.json/base.json)  ⚠ 由 bazi-knowledge-collector 维护
                                key统一英文snake_case，存于src/specialty/content/
    rules/                 — 知识规则
      pattern.ts / rules.ts / rules-lookup.ts / ziwei-rules.ts / bazi-interactions.ts
  cli/                   — L6: CLI
    src/index.ts               — 编排L2→L3→L4→L5→L6
    src/detailed.ts            — generateBaziReport() 8章专业报告
    src/report-scoring.ts      — generateScoringReport() 计分报告
    src/types.ts               — PrecomputedData 层间传递类型
  reports/               — L5: AI报表
    src/ai-engines.ts          — generateAiAnalyses() 原局/大运/流年（reports 现仅保留此 AI 转出层）
    content/ai-prompts.json    — AI提示词模板
```

## 报告结构（8章专业格式）

综合网上10个最佳命理报告模板设计：

```
封面        — markdown表格: 姓名/性别/出生/年龄/生成时间
第一章      命局总览 — 四柱表(传统时日月年格式)+五行力量条+强弱判定
第二章      日主分析 — 日主性格白话+强弱白话解释("身弱的意思是...")
第三章      用神喜忌 — 六书合参表+喜忌神白话总结(每个元素解释为什么喜/忌)
第四章      人生专题 — 🎯性格 💼事业财运 💕婚姻感情 ⚕️健康养生 🏠六亲缘份
              每项三层卡片: ▸命理依据 → ▸对你的影响 → ▸趋避建议
第五章      大运走势 — 已过大运折叠，当前/未来每运独立卡片解读
第六章      当前运势 — 当前大运+今年流年+明年预告+下一大运预告
第七章      趋吉避凶 — 6维对照表(五行/行业/方位/颜色/贵人/季节)
第八章      AI深度解读 — --ai启用时显示，原局/大运/流年
附录        计分详情+古籍参考(折叠)
```

### 四柱表格式（传统）

```
| 时 | 日 | 月 | 年 | |
| 十神 | 十神 | 十神 | 十神 | 十神 |
| 天干 | 天干 | 天干 | 天干 | 天干 |
| 地支 | 地支 | 地支 | 地支 | 地支 |
```

- 列序：时日月年（传统从右到左阅读，年柱在最右）
- 十神紧贴天干上方，一眼看出天干什么十神
- 标签（十神/天干/地支）在最右边

## 十神×性别 传统规则

引擎中涉及性别区分的维度，严格按传统命理规则：

| 维度 | 十神 | 男命(乾造) | 女命(坤造) |
|------|------|-----------|-----------|
| 配偶星 | 财星 | ✅ 妻星 | — |
| 配偶星 | 官杀 | — | ✅ 夫星 |
| 子女星 | 官杀 | ✅ 子女（克我者为子女） | — |
| 子女星 | 食伤 | — | ✅ 子女（我生者为子女） |
| 母亲 | 印星 | ✅（正印偏印均可） | ✅ |
| 父亲 | 偏财 | ✅（只有偏财，正财不是） | ✅ |
| 兄弟 | 比劫 | ✅ | ✅ |
| 配偶星混杂 | — | 财星混杂（正财+偏财同时现） | 官杀混杂（正官+七杀同时现） |

实现位置：
- `engine-marriage.ts`: 配偶星+混杂判断均区分性别
- `engine-children.ts`: `ctx.gender === 'M' ? ctx.officials : ctx.outputStars`
- `engine-later-life.ts`: 同上，子女依靠星
- `engine-parents.ts`: `ctx.hasPianCai`（偏财=父），`ctx.seals`（印星=母）
- `context.ts`: `hasPianCai: boolean` 新增字段，检测偏财是否在四柱或藏干中出现

## L5a 架构详解

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
  beiKe: boolean;     // 被克
  beiHe: boolean;     // 被合
}

// 完整的十神评估（替代旧的 { present: boolean }）
interface StarEvaluation {
  present: boolean;          // 是否存在且有力量（出现 + 元素分>0）
  strength: StrengthLevel;   // 力量等级
  quality: StarQuality;      // 品质维度
  favorable: boolean;        // 是否为喜
  favorabilityReason: string; // 喜忌原因
  element: string;           // 对应五行
  score: number;             // 五行得分
  scoreRatio: number;        // 占总分比例
}

interface SharedContext {
  // 十神评估
  officials, seals, wealthStars, outputStars, peers: StarEvaluation;
  // 宫位评估
  spousePalace, parentsPalace, childrenPalace, siblingsPalace: PalaceEvaluation;
  // 五行
  elementScores, totalScore, missingElements, excessElements;
  // 全局
  dayGan, dayEl, dayStrength, yongShen, jiShen, pattern;
  dayunContext, gender, age;
  mixedOfficials: boolean;   // 官杀混杂
  hasPianCai: boolean;       // 偏财是否存在（父亲星）
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

所有 key 使用英文 snake_case，文件存于 `src/specialty/content/<dim>/{yong,ji,base}.json`：

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
14. **提交前跑 build + 28例回归**
15. **L5a 统一判断框架** — 所有引擎通过 evaluator.ts + template-lookup.ts 统一判断
16. **星力五级分级** — absent/weak/moderate/strong/very_strong，阈值 0%/5%/15%/25%
17. **present = 出现 AND 元素分>0** — 出现但无力的星视为 absent，引擎跳过
18. **内容 JSON key 全英文 snake_case** — 统一命名，查找链自动 fallback
19. **命格等级封顶B** — computeRating 基于用神有力程度+刑冲+五行平衡
20. **传统十神性别规则** — 男命官杀=子女/财=妻，女命食伤=子女/官杀=夫
21. **偏财=父** — 只有偏财是父亲星，正财不是（区别于通用财星）
22. **8章专业报告格式** — 封面→命局→日主→用神→专题→大运→当前→趋避→附录
23. **四柱表传统格式** — 时日月年列序(右→左)，十神贴天干上，标签在右
24. **大运卡片式** — 已过折叠，当前/未来展开为独立卡片含干支解读

## 测试

```bash
npx turbo run build                                    # 全量编译

# 单元测试
npx tsx packages/knowledge-base/src/__tests__/specialty-engines.test.ts   # L5a 专项引擎

# 回归测试
npx tsx packages/knowledge-base/src/__tests__/regression-l3.test.ts       # L3 计分 24例（强弱二分）
npx tsx packages/knowledge-base/src/__tests__/regression-l4.test.ts       # L4 变格 27例（从格类型+真假）
npx tsx packages/knowledge-base/src/__tests__/regression-l5a.test.ts      # L5a 专项 28例

# 单例端到端
npx tsx packages/cli/src/index.ts "1985-12-09 10:30" --gender M --scoring

# 完整报告(含AI+PDF)
npx tsx packages/cli/src/index.ts "1985-12-09 10:30" --gender M --name "张耿" --report --pdf --ai
```

回归测试数据: `data/cases.json` (27例) + `data/expected.json` (L3预期强弱) + `data/expected-l4.json` (L4预期变格)
- L3 命中: 24/24（3例跳过：刘媛/刘媛-test 从格走 L4、黄楷钒 expected 拼写 typo「黄楷帆」待修）
- L4 命中: 27/27（刘媛=从财格真从、李若然=从杀格假从、刘安霖=从财格假从；其余=无变格）
- L5a 验证: 28/28 全部通过（验证结构合规性+无异常）

## 最新变更（2026-07-07）— 从格回归覆盖 + 周锦俊误报修正 + ziDang parsing 修正

### L4 变格回归框架（新建，补齐从格零覆盖）
- 新建 `data/expected-l4.json`（27例变格 ground truth）+ `regression-l4.test.ts`，与 L3（强弱二分）分层
- 跑全 L4 流程 `analyzeChart()`，从 `engines` 解析变格判定（从财/从杀/从儿/从势 + 真从/假从）
- 锁定：刘媛=从财格真从、李若然=从杀格假从、刘安霖=从财格假从；林翠/郑芷茵/Amanda/邓芳/陈倩怡等=无变格（身弱）

### 周锦俊从格误报修正（`biange-cong.ts`）
- 周锦俊(1990-09-08，丙火) 误判「假从财格」→ 实为身弱。根因：2个午(比劫) vs 1个子，`areAllRootsDestroyed` 旧逻辑把「每个午的对家在场」当全毁
- 修正为 **子午冲 1:1 配对**：按冲支分组，可摧毁数=min(根数, 冲支在四支出现数)。1子只冲散1午，另1午存活→非全毁→身弱
- 关键不退化：林翠走藏干分支（日支辰被 `shishen==='日主'` 排除）不受影响，仍正确身弱；刘媛/李若然/刘安霖地支无印比根→supportZhis=[]→不受影响

### ziDang/YiDang 负号 parsing 修正（`score-engine.ts`）
- `extractZiDang`/`extractYiDang` 正则 `[\d.]+` 吃不掉负号，ziDang 为负时越过本值误抓同行 yiDang（如周锦俊 ziDang=-0.09 被读成 6.82）
- 捕获组加 `[-]?`。影响 DB 存储（`l3_scores.zi_dang`）+ 8章报告「全局自党/异党 X 分」（`detailed.ts`）

### 林翠「日主0分」结论
- 经核验：林翠 day主元素分≈0 但有结构性印比强根（日支辰=比劫）→ 引擎判身弱**正确**，非 bug。「L3 对」不适用——L3 的有效分≈0 与结构性根检查不矛盾，二者量的是不同维度。

## 最新变更（2026-07-07）— 用神引擎重构为分层架构 + bazi-app 前端

### L4 用神引擎：六书 → 分层精炼 + 变格引擎
- 新建顶层 `engines/` 目录（从原 `analysis/engines/` 提升），引入 `LayeredContext`：引擎逐层精炼，**非平级投票**
- 新增 3 个**变格引擎**（命中即 `specialPattern=true`，中断后续六书）：
  - `biange-zhuangwang.ts` — 专旺格（曲直/炎上/从革/润下/稼穑）
  - `biange-cong.ts` — 从格（从财/从杀/从儿/从势，含真从/假从判据、根被冲散、阳干降级）
  - `biange-shishang-zhisha.ts` — 食伤制杀格
- `yongshen.ts` 调用顺序：`[专旺, 从格, 食伤制杀, 子平, 滴天髓, 穷通, 神峰, 渊海, 三命]`
- `analysis/` 补齐 `method-tongguan.ts`(通关)、`method-bingyao.ts`(病药)、`jiang-wenzheng.ts`(蒋文正流派)

### bazi-app Web 前端（新建，首次记录入 CLAUDE.md）
- **uni-app 前端**（`pages/index`、`pages/chart`）+ **Express 后端**（`server/index.js`）
- 后端通过 `spawn` 调 CLI（`packages/cli/src/index.ts`）+ 直读 `bazi-destiny.db`（`subjects`/`l2_charts`/`l4_analyses`/`l5_specialties` 表）
- 已实现功能：命例录入、姓名搜索(AJAX)、一键生成报告、PDF(注入 PingFang SC 等 CJK 字体)、AI 复选框(--ai)、`/stats` 统计页、级联删除

### 三术交叉验证死链移除（紫微/占星彻底下线）
- 删除整包：`packages/engine-ziwei`、`packages/engine-astrology`、`packages/cross-validator`
- 删除 `knowledge-base/src/rules/ziwei-rules.ts`（唯一消费方是已删的 `reports.generateReport`）
- `reports/src/index.ts` 移除 `generateReport`/`generateText`/`getCurrentContext` 及 cross-validator、analyzeZiwei 导入，仅保留 `generateAiAnalyses` 转出
- `knowledge-base/src/index.ts` 移除 `analyzeZiwei`/`PATTERN_COMMENTARY` 等导出
- `cli/package.json`、`reports/package.json` 清掉对上述包的依赖；根 `package.json` description → "Bazi (four-pillar) destiny analysis CLI"
- 验证：`turbo run build` 5/5 全绿，L3 24✅/0❌，L5a + specialty 全过，零退化
- 第二轮（同日）：`cli/src/ascii.ts` 移除 `renderZiwei`/`renderAstrology`，删 `core/src/schemas/ziwei.ts`、`schemas/astrology.ts` 及 `core/src/index.ts` 对应导出（`ZiweiChart`/`WesternChart` 类型彻底下线），build 5/5 + L3 24✅/0❌

## 最新变更（2026-07-02）— 报告格式重设计 + 性别规则修正

### 报告格式重设计 (detailed.ts 完全重写)
- **8章专业结构**: 封面→命局总览→日主分析→用神喜忌→人生专题→大运走势→当前运势→趋吉避凶
- **封面**: markdown表格，简洁5行（姓名/性别/出生/年龄/生成时间）
- **四柱表**: 传统时日月年列序，十神贴天干上，标签在右
- **五行力量条**: 彩色ASCII bar，直观显示五行强弱对比
- **日主分析**: 白话解释日主性格+强弱含义（"身弱的意思是..."）
- **用神喜忌**: 六书合参表+每个喜忌元素白话解释为什么喜/忌
- **人生专题**: 每项三层卡片（▸影响 + ▸建议），章节带图标
- **大运走势**: 已过折叠，当前/未来每运独立卡片含干支+互动解读
- **当前运势**: 当前大运+今年流年+明年预告+下一大运预告
- **趋吉避凶**: 6维对照表（五行/行业/方位/颜色/贵人/季节）
- **AI章节**: 作为独立第八章展示（--ai启用），不再折叠
- **免责声明**: 报告末尾

### 性别规则修正（传统十神×性别）
- **engine-marriage.ts**: 男命财星混杂(starCount.wealth>=2)、女命官杀混杂(mixedOfficials)
- **engine-children.ts**: 男命官杀为子女星(克我者)、女命食伤为子女星(我生者)
- **engine-later-life.ts**: 同上，子女依靠星按性别区分
- **engine-parents.ts**: 偏财=父(hasPianCai)，印星=母
- **context.ts**: 新增 `hasPianCai` 字段检测偏财存在性
- **children/later-life content**: 新增 `officials` 模板（官杀为子女星）
- **marriage content**: 新增 `mixedWealth` 模板（男命财星混杂）

### L5a 全部重写（同日稍早）
- 新建 evaluator.ts + template-lookup.ts，11引擎统一判断框架
- StarPresence→StarEvaluation，PalaceInfo→PalaceEvaluation
- 内容JSON key全英文snake_case，同步到src/specialty/content/
- 新增 regression-l5a.test.ts (28例)

## 当前待办

> 更新于 2026-07-07

- **education（学业）维度**：仍未整合，编排器仅 11 维，无 `engine-education.ts`。
- **类型安全债**：`(bazi as any)._precomputed` / `Object.assign` 注入仍存在（详见 `docs/system-flow.md` 问题清单 A–G）。
- **报告生成器 fallback**：`detailed.ts` 仍可在 `precomputed` 缺失时重算 `determineYongShen()`，打破单一数据源。
- **expected.json 拼写 typo**：`黄楷帆` 应为 `黄楷钒`（致该例在 L3 回归被 skip）。
- **文档同步**：`change-log.md`(停在 06-29)、`pending-cases.md`(06-26)、`questions.md`(~60 个待师父确认的算法/古籍问题) 均未跟进最新代码。

## 编码规范

见 `docs/research/coding-standards.md`
核心：内容外置JSON、禁as any、提交前回归、函数≤40行、禁中文变量名

## 工作流程

每次完成任务后更新此文件：
- 修改「最新变更」章节
- 如新增文件/模块，更新「目录结构」
- 如新增设计决策，更新「关键设计决策」
- 如新增测试数据，更新「测试」章节
