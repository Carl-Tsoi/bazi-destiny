/**
 * engine-ziwei — wraps iztro, fully extracts四化/亮度/天干/格局
 */
import type { BirthInfo, Result, IDivinationEngine } from '@bazi-destiny/core';
import { ZiweiChartSchema } from '@bazi-destiny/core';
import type { ZiweiChart } from '@bazi-destiny/core';

export class ZiweiEngine implements IDivinationEngine<ZiweiChart> {
  async calculate(birthInfo: BirthInfo): Promise<Result<ZiweiChart>> {
    try {
      const date = new Date(birthInfo.datetime);
      const { astro } = await import('iztro');

      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      const timeIndex = this.hourToTimeIndex(date.getHours());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r: any = astro.bySolar(dateStr, timeIndex, birthInfo.gender === 'M' ? 'male' : 'female');

      // Extract四化 from star mutagen data
      const sihua = this.extractSihua(r);
      // Detect pattern (格局)
      const pattern = this.detectPattern(r, sihua);

      const chart: ZiweiChart = {
        engine: 'ziwei',
        birthInfo: {
          lunarDate: r.lunarDate ?? dateStr,
          gender: birthInfo.gender,
        },
        palaces: (r.palaces ?? []).map((p: Record<string, unknown>) => ({
          name: (p.name as string) ?? '',
          heavenlyStem: (p.heavenlyStem as string) ?? '',
          earthlyBranch: (p.earthlyBranch as string) ?? '',
          majorStars: (Array.isArray(p.majorStars) ? p.majorStars : []).map((s: Record<string, unknown>) => ({
            name: (s.name as string) ?? '',
            type: 'major' as const,
            brightness: (s.brightness as string) ?? '',
            mutagen: (s.mutagen as string) ?? '',
          })),
          minorStars: (Array.isArray(p.minorStars) ? p.minorStars : []).map((s: Record<string, unknown>) => ({
            name: (s.name as string) ?? '',
            type: 'minor' as const,
            brightness: (s.brightness as string) ?? '',
            mutagen: (s.mutagen as string) ?? '',
          })),
        })),
        sihua,
        shengxiao: r.zodiac ?? '',
        pattern,
        decades: [],
      };

      ZiweiChartSchema.parse(chart);
      return { success: true, data: chart };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Ziwei engine failed: ${message}` };
    }
  }

  private hourToTimeIndex(hour: number): number {
    if (hour === 23 || hour === 0) return 0;
    return Math.ceil(hour / 2);
  }

  /** Extract生年四化 from star mutagen across all palaces */
  private extractSihua(r: Record<string, unknown>): ZiweiChart['sihua'] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const palaces = (r.palaces as any[]) ?? [];
    const result = {
      huaLu: { star: '', palace: '' },
      huaQuan: { star: '', palace: '' },
      huaKe: { star: '', palace: '' },
      huaJi: { star: '', palace: '' },
    };

    for (const p of palaces) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allStars = [...(p.majorStars ?? []), ...(p.minorStars ?? [])];
      for (const s of allStars) {
        const m = s.mutagen as string ?? '';
        if (m === '禄') result.huaLu = { star: s.name as string, palace: p.name as string };
        if (m === '权') result.huaQuan = { star: s.name as string, palace: p.name as string };
        if (m === '科') result.huaKe = { star: s.name as string, palace: p.name as string };
        if (m === '忌') result.huaJi = { star: s.name as string, palace: p.name as string };
      }
    }

    return result;
  }

  /** Detect Ziwei pattern (格局) based on star configurations */
  private detectPattern(r: Record<string, unknown>, sihua: ZiweiChart['sihua']): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const palaces = (r.palaces as any[]) ?? [];

    const mingPalace = palaces.find((p: Record<string, unknown>) => p.name === '命宫');
    if (!mingPalace) return '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allStars = [...(mingPalace.majorStars ?? []), ...(mingPalace.minorStars ?? [])];

    // 日照雷门格: 太阳在卯宫命宫
    const hasSun = allStars.some((s: Record<string, unknown>) => s.name === '太阳');
    if (hasSun && mingPalace.earthlyBranch === '卯') return '日照雷门格';

    // 月朗天门格: 太阴在亥宫命宫
    const hasMoon = allStars.some((s: Record<string, unknown>) => s.name === '太阴');
    if (hasMoon && mingPalace.earthlyBranch === '亥') return '月朗天门格';

    // 紫微同宫格: 紫微在命宫
    const hasZiwei = allStars.some((s: Record<string, unknown>) => s.name === '紫微');
    if (hasZiwei) return '紫微朝垣格';

    // 日丽中天格: 太阳在午宫命宫
    if (hasSun && mingPalace.earthlyBranch === '午') return '日丽中天格';

    // 机月同梁格: 天机+太阴+天同+天梁在命宫或迁移宫
    const starNames = allStars.map((s: Record<string, unknown>) => s.name);
    const jiYueSet = ['天机', '太阴', '天同', '天梁'];
    if (jiYueSet.every(n => starNames.includes(n))) return '机月同梁格';

    // 杀破狼格: 七杀/破军/贪狼在命宫
    const hasShaPoLang = allStars.some((s: Record<string, unknown>) =>
      ['七杀', '破军', '贪狼'].includes(s.name as string));
    if (hasShaPoLang) return '杀破狼格';

    // Default: named by main star
    const mainStar = allStars.find((s: Record<string, unknown>) => s.type === 'major');
    return mainStar ? `${mainStar.name}守命格` : '';
  }
}
