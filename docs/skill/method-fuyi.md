# 扶抑法（Method: FuYi）

## 来源

《子平真诠》《滴天髓》— 日主强弱定扶抑

## 功能定位

蒋文正批断流程 **Step 3**。当其他方法不触发时的默认用神来源。

判断日主强弱，决定是「扶」（生扶日主）还是「抑」（克泄日主），给出扶抑用神。

## 输入

```typescript
interface FuYiInput {
  pillars: Record<string, Pillar>;  // 四柱
  extraZhis?: string[];             // 额外地支（大运/流年注入用，可选）
}
```

## 输出

```typescript
interface FuYiOutput {
  yongShen: string;                     // 扶抑用神（五行元素）
  reason: string;                       // 判断依据
  dayStrength: string;                  // 日主强弱: 身强/身弱/中和偏旺/中和偏弱
  dayScore: number;                     // 日主力量得分
  elementScores: Record<string, number>; // 五行力量分布: {木:N, 火:N, 土:N, 金:N, 水:N}
}
```

## 判断逻辑

### 1. 五行力量计算

调用 `calculatePower(pillars, extraZhis)`（来自 `power-distribution.ts`）获取：
- `scores`: 每个五行元素的得分
- `dayScore`: 日主元素得分
- `dayStrength`: 初步强弱判定

计算规则：
- 天干计分：基础 3 分 × 旺相休囚死（季节权重） × 十二长生乘数 + 根气分
- 地支计分：每支 +2 分给该支所属五行
- 天干五合：合化元素 +4 分，原元素各 -2 分（需月令支持）
- 地支六合：合化元素 +2 分
- 地支三合/半合：三合 +6 分，半合 +3 分
- 地支六冲：冲突双方各 -2 分
- 克关系调整：克日主元素得分 ÷ 2，扣减日主得分

### 2. 日主有效得分

```
effectiveDay = dayScore + (印星得分 > dayScore ? floor(印星得分 / 2) : 0)
```

印星 = 生日主者（日主元素在五行循环中的前一个）。

### 3. 对抗得分

```
opposeScore = 官杀得分 + 食伤得分 + 财星得分
```

- 官杀 = 克日主者
- 食伤 = 日主生者
- 财星 = 日主克者

### 4. 日主强弱判定

| 条件 | 判定 |
|------|------|
| `effectiveDay >= opposeScore × 1.5` | **身强** |
| `食伤得分 >= dayScore × 0.7` 且 `dayScore >= 8` | **身强**（食伤泄秀通道） |
| `effectiveDay >= opposeScore` | **中和偏旺** |
| `effectiveDay >= opposeScore × 0.6` | **中和偏弱** |
| 其余 | **身弱** |

### 5. 扶抑用神

| 日主强弱 | 策略 | 用神 |
|----------|------|------|
| 身强 | 泄 | 食伤元素（日主生） |
| 中和偏旺 | 克泄 | 官杀元素（克日主） |
| 中和偏弱 | 生扶 | 印星元素（生日主） |
| 身弱 | 生扶 | 比劫元素（同日主） |

## 古典依据

《滴天髓》：
> 身强则抑之，身弱则扶之。

《子平真诠》：
> 旺则宜泄，衰则宜扶。

## 使用位置

在 `yongshen.ts` 的 `determineYongShen()` 中，第三步调用。在「调候法」之后、「通关法」之前。

扶抑法是默认用神来源。当其他方法（调候/通关/病药）不触发时，扶抑法的结果即为最终用神。
