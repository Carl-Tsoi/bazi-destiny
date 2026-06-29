# Bazi-Destiny 编码规范

> 基于 SOLID + Airbnb TS + Clean Code，适配本项目的命理领域特点。
> Claude 生成的所有代码必须遵守此规范。

---

## 一、模块设计

### 单一职责（SRP）
一个文件只做一件事。已做到的：
```
scoring/
  climate.ts              ← 只管气候系数加载切换
  power-distribution.ts   ← 只管16步计分流水线
  score-engine.ts         ← 只管 L3 入口封装
```
没做到的（需整改）：
```
detailed.ts              ← 混了报告组装+数据提取+AI调用（三个职责）
specialty/index.ts       ← 混了编排+评级+引擎调用
```

### 开闭原则（OCP）
对扩展开放，对修改关闭。
- ✅ 加新气候表 → 放一个 `climate-coeff-v11.json`，不改代码
- ✅ 改性格描述 → 改 `content/personality.json`，不改引擎
- ❌ 当前加新专项引擎 → 要改 `index.ts` 增加 import 和调用。应改为引擎自动发现机制

### 依赖倒置（DIP）
上层不依赖下层实现，依赖接口。
- ✅ L5 报告层依赖 `ScoreResult` / `AnalysisResult` 接口，不直接调用 `calculatePower`
- ❌ CLI 通过 `(bazi as any)._precomputed` 传递，类型不安全

---

## 二、命名规范

| 类别 | 规范 | 正确 | 错误 |
|------|------|------|------|
| 文件名 | kebab-case | `score-engine.ts` | `ScoreEngine.ts` |
| 函数 | camelCase，动词开头 | `calculatePower()` | `power()` |
| 接口/类型 | PascalCase | `ScoreResult` | `scoreResult` |
| 常量 | UPPER_SNAKE | `ELEMENT_ORDER` | `elementOrder` |
| 布尔变量 | is/has/can 开头 | `isShiLing` | `shiling` |
| 中文变量 | ❌ 禁止在代码中使用 | `const透干` | 用 `touGan` 不行，用英文 `isStemRevealed` |

---

## 三、函数规范

- 一个函数不超过 40 行。超过就拆。
- 函数参数不超过 4 个。超过就封装成 object。
- 不用 `as any` 逃避类型检查。如果确实需要，加注释说明原因。
- 每个 public 函数必须有 JSDoc 注释，说明输入输出。
- 避免深层嵌套：if 嵌套不超过 3 层。

**禁止模式：**
```typescript
// ❌ as any 逃避类型
const result = (someFunc as any)(arg1, arg2);

// ✅ 正确：定义接口或使用 unknown 中转
const result = someFunc(arg1 as unknown as CorrectType);
```

---

## 四、类型安全

- 所有函数参数和返回值必须有类型标注。
- 禁止隐式 `any`。
- 接口定义放在 `types.ts` 文件中，不散布在各引擎文件里。
- 使用 `Record<string, X>` 而不是 `{ [k: string]: X }`。

---

## 五、内容与逻辑分离

**这是本项目最重要的原则。**

命理分析文本（性格描述、事业建议、古籍引用）不在代码中硬编码。

```
✅ 正确: engine-career.ts → 读 content/career.json → 匹配规则 → 输出
❌ 错误: engine-career.ts → const CAREER_TEXTS = { ... } 直接写代码里
```

JSON 内容文件的规范：
- 放在 `specialty/content/` 目录下
- 文件名与引擎对应：`career.json` ↔ `engine-career.ts`
- 结构：`{ _meta, rules: [ { condition, output: { l1, l2, l3 } } ] }`
- 支持占位符 `{dayGan}` `{dayEl}` `{yongShen}` 等，引擎负责替换

---

## 六、文件组织

```
新文件创建时必须遵循：
- 分析逻辑 → analysis/
- 计分逻辑 → scoring/
- 知识数据 → rules/
- 引擎代码 → specialty/
- 引擎内容 → specialty/content/
- 文档 → docs/research/
```

禁止在 `src/` 根目录新增 .ts 文件。必须放在对应子目录。

---

## 七、错误处理

- 不吞错误。`try { } catch { }` 空 catch 必须加注释说明为什么可以忽略。
- 文件读取（JSON 配置）失败时，给明确的错误信息，包含文件路径。
- CLI 输出错误时，区分"用户输入错误"（400）和"系统内部错误"（500）。

---

## 八、变更规范

每次代码变更必须：

1. **编译通过**：`npx turbo run build` 无错误
2. **回归通过**：24 例测试结果与 `data/expected.json` 一致（刘媛除外）
3. **不引入新的 `as any`**：除非有注释说明
4. **新文件放对目录**：按第六节的组织规范
5. **变更记录**：在 `docs/research/change-log.md` 加一条

---

## 九、禁止事项

| 禁止 | 原因 | 替代做法 |
|------|------|------|
| 在代码中硬编码命理文本 | 你改内容要动代码 | 放 JSON 配置文件 |
| 用 `as any` 传递关键数据 | 类型不安全 | 定义接口 |
| 在同一层重复调用相同函数 | 违反 DRY | 上层调用，结果下传 |
| 删文件前不验证依赖 | 容易误删 | 用 grep 搜索所有 import |
| 不提 regression 就提交 | 可能退化 | 提交前跑 24 例 |
| 中文变量名 | TypeScript 编译可能出错 | 用英文命名 |
| 空 catch 块 | 隐藏错误 | 至少 console.error 或加注释 |
| 超过 4 个参数的函数 | 难以阅读和维护 | 封装成 options object |

---

## 十、提交规范

- commit message 格式：`type: 简短描述`
- type: `feat` / `fix` / `refactor` / `docs` / `test` / `chore`
- 每次提交只做一件事。不混合新功能+重构+修bug。
- 提交前确认：build 通过 + 24 例回归通过

---

*最后更新: 2026-06-29 | 版本 1.0*
