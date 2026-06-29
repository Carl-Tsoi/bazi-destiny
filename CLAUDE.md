# Bazi-Destiny 八字命理分析系统

## 项目架构

六层单向数据流，每层不调用上层函数：

```
L1 输入 → L2 排盘 → L3 计分 → L4 分析 → L5 报表 → L6 输出
```

## 目录结构

```
packages/
  core/         — 类型定义 + 数据库
  engine-bazi/  — L2: BaziEngine（只做排盘+格局检测，不做计分和分析）
  knowledge-base/
    scoring/          — L3: 五行计分
      climate.ts           — 气候系数加载 (V1-V10)
      power-distribution.ts — 16步计分流水线
      score-engine.ts      — scoreChart() 入口
      scoring-constants.ts — 查表+工具函数
      climate-coeff-v*.json — 10组气候表
    analysis/         — L4: 分析引擎
      analyzer.ts         — analyzeChart() 编排器
      yongshen.ts          — determineYongShen() 六引擎
      method-fuyi.ts       — 扶抑法(接收ScoreResult,不内部调用calculatePower)
      method-tiaohou.ts    — 调候法
      qiongtong.ts         — 调候数据表(十干×十二月)
      dayun-judge.ts       — judgeDayun()
      types.ts             — ChartResult/ScoreResult/AnalysisResult
      engines/             — 六书引擎(子平/滴天髓/穷通/神峰/渊海/三命)
    specialty/        — L5: 11维专项引擎
      shared/context.ts    — 数据提取公共函数 buildContext()
      content/*.json       — 11个维度的分析文本(引擎读取JSON,不硬编码)
      engine-*.ts          — 11个引擎(旧版*Engine+新版analyze*双存)
      index.ts             — analyzeAllDimensions() 统一入口
    rules/            — 知识规则
      pattern.ts / rules.ts / rules-lookup.ts / ziwei-rules.ts / bazi-interactions.ts
  cli/              — L6: CLI
    src/index.ts          — 编排L2→L3→L4→L5→L6
    src/detailed.ts       — generateBaziReport() 报告生成器(格式A:12章节)
    src/report-scoring.ts — generateScoringReport() 计分报告
    src/types.ts          — PrecomputedData层间传递类型
  reports/          — L5: 报表+AI
    src/ai-engines.ts     — generateAiAnalyses() 原局/大运/流年
    src/narrative.ts      — generateNarratives() 旧版AI(保留)
    content/ai-prompts.json — AI提示词模板
```

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

## 测试

```bash
npx turbo run build                    # 全量编译
npx tsx packages/cli/src/index.ts "1985-12-09 10:30" --gender M --scoring  # 单例计分
npx tsx packages/knowledge-base/src/__tests__/specialty-engines.test.ts    # 单元测试
```

回归测试用 Python 脚本跑24例 → 见 `data/expected.json` 预期答案。

## 24例测试

数据: `data/cases.json` + `data/expected.json`
命中: 23/24（刘媛从格待实现，已挂起）
判定文件: `docs/research/scoring-results.md`

## 当前待办

1. AI渲染修复 — --ai时报告不显示AI内容，疑似precomputed传递问题


## 编码规范

见 `docs/research/coding-standards.md`
核心：内容外置JSON、禁as any、提交前回归、函数≤40行、禁中文变量名

## 工作流程

每次完成任务后更新此文件：
- 修改「当前待办」章节
- 如新增文件/模块，更新「目录结构」
- 如新增设计决策，更新「关键设计决策」
- 如新增测试数据，更新「测试」章节
