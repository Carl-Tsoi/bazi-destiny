# 用神决策链

## 核心原则

> **扶抑为体，诸法为用。** 扶抑法定基准方向（身强喜官食财 / 身弱喜印比），其余方法在扶抑框架内提出候选。候选必须通过扶抑审查（对日元是否有益），有益则采纳，无益则否决。

## 决策流程

```
Step 1: 扶抑法
  ├── 计算五行力量分布
  ├── 判定日主强弱（身强 / 身弱 / 中和偏旺 / 中和偏弱）
  ├── 确定扶抑用神
  └── 确定扶抑喜忌（baseXi / baseJi）
       │
Step 2: 有杀先论杀（编排器）
  │   七杀透出且无制无化？
  │   ├── YES → 候选 = 病药/调候的制杀化杀元素
  │   │         isValid(候选)？→ YES=采纳  NO=扶抑结果
  │   └── NO  → 继续
  │
Step 3: 病药法
  │   全局扫描有偏枯？
  │   ├── YES → 候选 = 药
  │   │         isValid(候选)？→ YES=采纳  NO=否决
  │   └── NO  → 跳过
  │
Step 4: 通关法
  │   有十神冲突（忌神克喜神）？
  │   ├── YES → 候选 = 通关元素
  │   │         isValid(候选)？→ YES=采纳  NO=否决
  │   └── NO  → 跳过
  │
Step 5: 调候法
  │   全局扫描有偏枯（最高忌神得分 ≥ 总分×25% 且 ≥ 5分）？
  │   ├── YES → 候选 = 药
  │   │         isValid(候选)？→ YES=采纳  NO=否决，用扶抑
  │   └── NO  → 跳过
  │
Step 6: 喜忌校准
       ├── 扶抑胜出 → 经典规则（身弱喜印比忌官食财 / 身强喜官食财忌印比）+ 用神入喜
       ├── 其他胜出 → 扶抑喜神做底 + 用神入喜 + 生用神者（需在扶抑喜神中）
       └── 去重 + 喜忌不重叠
```

## isValid() 审查规则

```
isValid(candidate):
  return candidate ∈ baseXi

baseXi = 身弱 → [印, 比劫]
        身强 → [官杀, 食伤, 财]
        中和 → [印]
```

候选用神必须在扶抑喜神中，否则该方法对日元无益，被否决。

## 10 例决策链一览

| 命例 | 胜负手 | 用神 | 链 |
|------|--------|------|-----|
| 蔡建华 | 通关 | 水 | 扶抑基准水 → 通关水有益→采纳 |
| 陈倩怡 | 七杀 | 火 | 七杀无制化 → 用神火 |
| 何美玲 | 扶抑 | 木 | 扶抑基准木 → 通关木+病药木一致→采纳 |
| 刘媛 | 扶抑 | 火 | 扶抑基准火 → 病药木对日元无益→否决 |
| 陈葆欣 | 通关 | 金 | 扶抑基准金 → 通关金有益→采纳 |
| 黄楷伟 | 扶抑 | 木 | 扶抑基准木 → 通关木+病药木一致→采纳 |
| 黄楷帆 | 扶抑 | 木 | 同上 |
| 刘浩伦 | 通关 | 水 | 扶抑基准水 → 通关水有益→采纳 |
| 周锦俊 | 扶抑 | 金 | 扶抑基准金 → 调候火无益→否决 |
| 郑芷茵 | 七杀 | 水 | 七杀无制化 → 用神水 → 调候水一致→采纳 |

## 否决案例详解

### 调候被否决

**周锦俊**（壬水，丑月，身弱）
- 扶抑：身弱喜印比 → 基准用神金
- 调候：冬月水寒，推荐火
- isValid(火)：火=财，身弱忌财 → **否决**
- 最终：扶抑用神金

**何美玲**（癸水，戌月，身强）
- 扶抑：身强喜官食财 → 基准用神木
- 调候：推荐金
- isValid(金)：金=印，身强忌印 → **否决**
- 最终：扶抑用神木

### 通关被否决

**刘媛**（丁火，酉月，身弱）
- 扶抑：身弱喜印比 → 基准用神火
- 通关：推荐木
- isValid(木)：木=印，身弱喜印 ✓ → 但仍被否决？
- 实际：通关=null（无对峙），不触发

### 病药被否决

**刘媛**（丁火，酉月，身弱）
- 扶抑：身弱喜印比 → 基准用神火
- 病药：食伤土旺，推荐木（印制食伤）
- isValid(木)：木=印，身弱喜印 ✓ → 采纳？
- 实际输出：否决。因为病药木 ≠ 扶抑火，且木不在接受链中。
  - 刘媛七杀=null，调候不触发(酉月秋)，通关=null
  - 只有病药推荐木 ≠ 扶抑基准火
  - 编排器：病药木 isValid? YES → 应采纳！
  
  Wait, let me re-check. 刘媛: 丁火日主,酉月(秋). needTiaoHou=false. killNeedsRemedy=false. tongguan=null. bingyao=木. hasSevereIllness?

  keWoScore = 水 = 11. 丁火日主, keWo=水. 11分≥15? No. hasSevereIllness=false.

  So the flow goes: killNeedsRemedy=false → needTiaoHou=false → tongguan=null → hasSevereIllness=false → else: finalYongShen=扶抑, winner='fuyi'.

  Even though bingyao recommended木 and isValid(木)=true, the编排器 never evaluated bingyao because hasSevereIllness was false!

  这是编排器的问题：bingyao推荐了木且木对日元有益，但hasSevereIllness=false导致编排器跳过了病药检查。病药法本身有 threshold (keWoScore≥15) 决定是否"严重"，但病药法内部已经有自己的阈值了（全局扫描≥25%总分+≥5分），编排器不应该重复判断。

  should fix: the orchestrator should check bingyao for ALL cases (not just severe ones), and accept it if isValid. The "severity" check is bingyao's internal job, not the orchestrator's.

Actually, let me re-read the orchestrator code more carefully...

Hmm, looking at the orchestrator, for刘媛:
- tongguan=null
- hasSevereIllness: keWoScore=水11分, 11≥15? No → false

So the flow: kill=false, needTiaoHou=false, tongguan=null, hasSevereIllness=false → finalYongShen=扶抑结果=火.

But病药法 internally recommended木! How does木 relate to火? 火 is用神,木生火(生用神). If木 were adopted, it would change the喜忌 but...

Actually, the issue is more subtle. The orchestrator only considers bingyao when hasSevereIllness=true. But bingyao's internal scan (现在全局扫描) found a different disease that's less "severe" by the orchestrator's标准. The双门槛导致 valid recommendations get lost.

I should fix: when bingyao returns non-null, always evaluate it. Don't gate on hasSevereIllness. The disease severity is bingyao's internal concern.
