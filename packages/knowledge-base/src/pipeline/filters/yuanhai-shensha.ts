/**
 * 渊海神煞拦截器 (Priority 500)
 *
 * 基于《渊海子平》神煞系统
 * Ref: docs/渊海子平_notebook.md
 */
import type { AnalysisFilter, AnalysisContext, FilterOutput } from '../types.js';
import { BookName, setAnnotation } from '../../attributes/base-types.js';
import type { YuanHaiAttributes } from '../../attributes/yuanhai.js';

const GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

export const yuanhaiShenshaFilter: AnalysisFilter = {
  name: '渊海神煞',
  priority: 500,
  enabled: true,

  analyze(ctx: AnalysisContext): FilterOutput {
    const pillars = ctx.chart.base.pillars;
    const yearGan = pillars.年柱.gan;
    const yearZhi = pillars.年柱.zhi;
    const dayGan = pillars.日柱.gan;
    const dayZhi = pillars.日柱.zhi;

    const shensha: Record<string, boolean> = {};

    // 天乙贵人
    const tianYi: Record<string,string[]> = {甲:['丑','未'],乙:['子','申'],丙:['亥','酉'],丁:['亥','酉'],戊:['丑','未'],己:['子','申'],庚:['丑','未'],辛:['午','寅'],壬:['卯','巳'],癸:['卯','巳']};
    const tyDay = tianYi[dayGan] ?? [];
    const tyYear = tianYi[yearGan] ?? [];
    shensha['天乙贵人(日)'] = tyDay.includes(dayZhi) || Object.values(pillars).some(p => tyDay.includes(p.zhi));
    shensha['天乙贵人(年)'] = tyYear.includes(yearZhi);

    // 文昌
    const wenChang: Record<string,string> = {甲:'巳',乙:'午',丙:'申',丁:'酉',戊:'申',己:'酉',庚:'亥',辛:'子',壬:'寅',癸:'卯'};
    shensha['文昌'] = Object.values(pillars).some(p => p.zhi === wenChang[dayGan]);

    // 羊刃:阳干帝旺位
    const yangRenMap: Record<string,string> = {甲:'卯',丙:'午',戊:'午',庚:'酉',壬:'子'};
    shensha['羊刃'] = Object.values(pillars).some(p => p.zhi === (yangRenMap[dayGan] ?? ''));

    // 桃花(子午卯酉)
    const taoHua: Record<string,string> = {'寅午戌':'卯','申子辰':'酉','亥卯未':'子','巳酉丑':'午'};
    const taoHuaZhi = taoHua[Object.keys(taoHua).find(k => k.includes(yearZhi)) ?? ''] ?? '';
    shensha['桃花'] = Object.values(pillars).some(p => p.zhi === taoHuaZhi);

    // 驿马
    const yiMa: Record<string,string> = {'寅午戌':'申','申子辰':'寅','亥卯未':'巳','巳酉丑':'亥'};
    const yiMaZhi = yiMa[Object.keys(yiMa).find(k => k.includes(yearZhi)) ?? ''] ?? '';
    shensha['驿马'] = Object.values(pillars).some(p => p.zhi === yiMaZhi);

    // 孤辰寡宿
    const guChen: Record<string,string> = {'亥子丑':'寅','寅卯辰':'巳','巳午未':'申','申酉戌':'亥'};
    const guaSu: Record<string,string> = {'亥子丑':'戌','寅卯辰':'丑','巳午未':'辰','申酉戌':'未'};
    shensha['孤辰'] = Object.values(pillars).some(p => p.zhi === (guChen[Object.keys(guChen).find(k => k.includes(yearZhi)) ?? ''] ?? ''));
    shensha['寡宿'] = Object.values(pillars).some(p => p.zhi === (guaSu[Object.keys(guaSu).find(k => k.includes(yearZhi)) ?? ''] ?? ''));

    const attrs: YuanHaiAttributes = {
      shensha,
      poemMatches: [],
      sixRelatives: {},
      patternVariants: [],
      rigidRules: [],
    };

    setAnnotation(ctx.chart, BookName.YuanHai, attrs as unknown as Record<string, unknown>);

    const activeShensha = Object.entries(shensha).filter(([,v])=>v).map(([k])=>k);
    return {
      filterName: '渊海神煞',
      priority: 500,
      annotation: ctx.chart.annotations.find(a => a.book === BookName.YuanHai),
      diagnostics: activeShensha.length > 0 ? activeShensha : ['无特殊神煞'],
    };
  },
};
