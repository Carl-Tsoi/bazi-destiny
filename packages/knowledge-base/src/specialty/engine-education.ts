/** 学业引擎 — 古籍气候模式识别 */
import type { SpecContext } from './types.js';

export function educationEngine(ctx: SpecContext): string[] {
  const e: string[] = [];
  const winterMonths=['亥','子','丑'];const summerMonths=['巳','午','未'];
  const isWinter=winterMonths.includes(ctx.monthZhi);const isSummer=summerMonths.includes(ctx.monthZhi);
  const jinShuiCount=ctx.allZhis.filter(z=>['申','酉','亥','子'].includes(z)).length;
  const muHuoCount=ctx.allZhis.filter(z=>['寅','卯','巳','午'].includes(z)).length;
  const fireScore=ctx.elements.has('火')?ctx.allZhis.filter(z=>['巳','午'].includes(z)).length:0;
  const metalScore=(ctx.elements.has('金')?1:0)+ctx.allZhis.filter(z=>['申','酉'].includes(z)).length;

  if (ctx.dayEl==='水'&&jinShuiCount>=3&&!isWinter) e.push('**金白水清**：《滴天髓》"相涵斯秀"。金水两旺，聪慧过人，顶尖学霸配置。');
  if (ctx.dayEl==='水'&&isWinter&&metalScore>=2) e.push(`**金寒水冷**：《穷通宝鉴》云"金寒水冷，冻金不生水"。${ctx.monthZhi}月水冻成冰，金印被寒气锁死无从发力，印星再多也是摆设。学业天赋被冰封，需行火运解冻方能开窍。行火运前读书吃力，事倍功半。`);
  if (ctx.dayEl==='火'&&muHuoCount>=3&&!isWinter) e.push('**木火通明**：《滴天髓》"文明之象"。文思泉涌，文科艺术类学习天赋高。');
  if (ctx.dayEl==='土'&&isSummer&&fireScore>=2) e.push(`**火炎土燥**：《穷通宝鉴》云"万物枯焦"。${ctx.monthZhi}月印星火过旺反成忌，学习急躁冒进，学而不精。需水调候润局。`);
  if (isWinter&&fireScore===0) e.push('《穷通宝鉴》冬月无火则"金寒水冷，木盘屈在地，火体绝形亡"。全局寒气重，缺乏灵性与悟性，书读得辛苦却事倍功半。需大运行火运方开智慧之门。');
  if (ctx.killers.length>0&&ctx.yins.length>0) e.push('**杀印相生**：压力即动力，考试型选手，升学关键期超常发挥。');
  if (ctx.yins.length>=2) e.push(`印星${ctx.yins.length}重（${ctx.yins.map(y=>y.shishen.replace('(藏)','')).join('、')}），强于理论学习和深度研究。${ctx.yins.some(y=>y.shishen.includes('偏印'))?'偏印主偏门学问，特定领域可达顶尖，也可能严重偏科。':'正印主正统教育。'}`);
  else if (ctx.yins.length===0) e.push('**印星全无**：缺乏学术耐力，坐不住冷板凳。学历缘薄，宜走实践技术路线。');
  if (ctx.foodHurtStars.length>=2&&ctx.yins.length===0) e.push('食伤旺无印制：聪明但浮躁，兴趣广泛无一精通。"什么都懂一点什么都不精"。');
  if (ctx.yins.length===0&&ctx.isWeak) e.push('《神峰通考》"无印身弱，难承书香"。学习条件先天不足。');
  return e;
}
