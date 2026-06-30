/**
 * 五行力量分布引擎
 *
 * 15步流水线（全浮点累进，不取整）：
 *   1. 天干基分    2. 地支力量    3. 同柱修正
 *   4. 天干间生克  5. 地支间生克  6. 天干五合
 *   7. 地支六合    8. 空亡        9. 三合/半合
 *  10. 三会       11. 相刑       12. 六冲
 *  13. Floor at 0 14. 克关系调整  15. 强弱判定
 */

import {
  WX, ZWX, ORDER, CLIMATE_COEFF,
  GAN_HE, ZHI_HE, TRI_COMBOS, TRI_HUI, XING_PAIRS, CHONG_PAIRS,
  GAN_ORDER, ZHI_ORDER, stemRootScore, pairDist, seasonMod,
} from './scoring-constants.js';

export { CLIMATE_COEFF } from './scoring-constants.js';

export interface PowerResult {
  scores: Record<string, number>;
  details: string[];
  dayStrength: string;
  dayScore: number;
}

export function calculatePower(
  pillars: Array<{ gan: string; zhi: string; shishen: string; canggan: Array<{ stem: string; tenGod: string }> }>,
  extraZhis: string[] = [],
): PowerResult {
  const scores: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  const details: string[] = [];
  // 追踪每柱天干+地支的原始贡献，用于位置远近调整
  const pillarRaw: Record<string, number>[] = [
    { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 },
    { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 },
    { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 },
    { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 },
  ];

  const allGans = pillars.map(p => p.gan);
  const allZhis = [...pillars.map(p => p.zhi), ...extraZhis];
  const allCangGans = pillars.flatMap(p => p.canggan);
  const monthZhi = pillars[1]?.zhi ?? '';

  const cl = (el: string) => CLIMATE_COEFF[monthZhi]?.[el] ?? 1.0;

  // ═══ 1. 天干基分 + 月令得气 ═══════════════════════
  const monthEl = ZWX[monthZhi] ?? '';
  const monthBranchScore = 5 * cl(monthEl); // 月令地支分，用于得气计算
  for (let i = 0; i < allGans.length; i++) {
    const g = allGans[i];
    const el = WX[g] ?? '';
    if (!el) continue;
    const rawRoot = stemRootScore(g, allZhis, allCangGans);
    const rootScore = rawRoot * cl(el);
    const baseTotal = 3 * cl(el) + rootScore;
    // 月令得气：月令生天干 → 天干 + floor(月令地支分/2)
    const monthIdx = ORDER.indexOf(monthEl);
    const stemIdx = ORDER.indexOf(el);
    const monthGeneratesStem = (monthIdx + 1) % 5 === stemIdx;
    const deQi = monthGeneratesStem ? Math.floor(monthBranchScore / 2) : 0;
    const total = baseTotal + deQi;
    scores[el] += total;
    pillarRaw[i][el] += total;
    const deQiStr = deQi > 0 ? `+得气${deQi}` : '';
    details.push(`天干${g}(${el}): 3×${cl(el)}+根${rawRoot}×${cl(el)}${deQiStr}=${total.toFixed(2)}`);
  }

  // ═══ 2. 地支力量 ═══════════════════════════════
  const zhiWeights = [2, 5, 3, 4];
  for (let i = 0; i < allZhis.length; i++) {
    const z = allZhis[i];
    const el = ZWX[z] ?? '';
    if (!el) continue;
    const pts = (zhiWeights[i] ?? 2) * cl(el);
    scores[el] += pts;
    pillarRaw[i][el] += pts;
    const label = i === 1 ? '月令' : i === 2 ? '日支' : '';
    details.push(`地支${z}(${el})${label ? ' ' + label : ''}: ${zhiWeights[i] ?? 2}×${cl(el)}=${pts.toFixed(2)}`);
  }

  // ═══ 3. 同柱干支修正 ═══════════════════════════
  for (let i = 0; i < Math.min(allGans.length, allZhis.length); i++) {
    const gEl = WX[allGans[i]] ?? '', zEl = ZWX[allZhis[i]] ?? '';
    if (!gEl || !zEl) continue;
    const gIdx = ORDER.indexOf(gEl), zIdx = ORDER.indexOf(zEl);
    let adjG = 0, adjZ = 0, label = '';
    if (gEl === zEl)                  { adjG = +1; adjZ = +1; label = '一气'; }
    else if ((gIdx + 2) % 5 === zIdx) { adjG =  0; adjZ = -1; label = '盖头'; }
    else if ((zIdx + 2) % 5 === gIdx) { adjG = -2; adjZ =  0; label = '截脚'; }
    else if ((gIdx + 1) % 5 === zIdx) { adjG =  0; adjZ = +1; label = '天覆'; }
    else if ((zIdx + 1) % 5 === gIdx) { adjG = +1; adjZ =  0; label = '地载'; }
    if (label) {
      if (adjG !== 0) scores[gEl] += adjG;
      if (adjZ !== 0) scores[zEl] += adjZ;
      details.push(`同柱: ${allGans[i]}(${gEl})${label}${allZhis[i]}(${zEl}) → 干${adjG >= 0 ? '+' : ''}${adjG} 支${adjZ >= 0 ? '+' : ''}${adjZ}`);
    }
  }

  // ═══ 4. 天干间生克（全6对，距离衰减） ═════════
  for (let i = 0; i < allGans.length - 1; i++) {
    for (let j = i + 1; j < allGans.length; j++) {
      const elA = WX[allGans[i]] ?? '', elB = WX[allGans[j]] ?? '';
      if (!elA || !elB || elA === elB) continue;
      const dc = pairDist(i, j);
      const idxA = ORDER.indexOf(elA), idxB = ORDER.indexOf(elB);
      if ((idxA + 1) % 5 === idxB) {
        const pts = cl(elA) * dc; scores[elB] += pts;
        details.push(`干生: ${allGans[i]}(${elA}×${cl(elA)})生${allGans[j]}(${elB}) ×${dc} → +${pts.toFixed(2)}${elB}`);
      } else if ((idxA + 2) % 5 === idxB) {
        const pts = cl(elA) * dc; scores[elB] -= pts;
        details.push(`干克: ${allGans[i]}(${elA}×${cl(elA)})克${allGans[j]}(${elB}) ×${dc} → -${pts.toFixed(2)}${elB}`);
      } else if ((idxB + 1) % 5 === idxA) {
        const pts = cl(elB) * dc; scores[elA] += pts;
        details.push(`干生: ${allGans[j]}(${elB}×${cl(elB)})生${allGans[i]}(${elA}) ×${dc} → +${pts.toFixed(2)}${elA}`);
      } else if ((idxB + 2) % 5 === idxA) {
        const pts = cl(elB) * dc; scores[elA] -= pts;
        details.push(`干克: ${allGans[j]}(${elB}×${cl(elB)})克${allGans[i]}(${elA}) ×${dc} → -${pts.toFixed(2)}${elA}`);
      }
    }
  }

  // ═══ 5. 地支间生克（全6对，距离衰减） ═════════
  for (let i = 0; i < allZhis.length - 1; i++) {
    for (let j = i + 1; j < allZhis.length; j++) {
      const elA = ZWX[allZhis[i]] ?? '', elB = ZWX[allZhis[j]] ?? '';
      if (!elA || !elB || elA === elB) continue;
      const dc = pairDist(i, j);
      const idxA = ORDER.indexOf(elA), idxB = ORDER.indexOf(elB);
      if ((idxA + 1) % 5 === idxB) {
        const pts = cl(elA) * dc; scores[elB] += pts;
        details.push(`地生: ${allZhis[i]}(${elA}×${cl(elA)})生${allZhis[j]}(${elB}) ×${dc} → +${pts.toFixed(2)}${elB}`);
      } else if ((idxA + 2) % 5 === idxB) {
        const pts = cl(elA) * dc; scores[elB] -= pts;
        details.push(`地克: ${allZhis[i]}(${elA}×${cl(elA)})克${allZhis[j]}(${elB}) ×${dc} → -${pts.toFixed(2)}${elB}`);
      } else if ((idxB + 1) % 5 === idxA) {
        const pts = cl(elB) * dc; scores[elA] += pts;
        details.push(`地生: ${allZhis[j]}(${elB}×${cl(elB)})生${allZhis[i]}(${elA}) ×${dc} → +${pts.toFixed(2)}${elA}`);
      } else if ((idxB + 2) % 5 === idxA) {
        const pts = cl(elB) * dc; scores[elA] -= pts;
        details.push(`地克: ${allZhis[j]}(${elB}×${cl(elB)})克${allZhis[i]}(${elA}) ×${dc} → -${pts.toFixed(2)}${elA}`);
      }
    }
  }

  // ═══ 6. 天干五合 ═══════════════════════════════
  for (let i = 0; i < allGans.length - 1; i++) {
    for (let j = i + 1; j < allGans.length; j++) {
      const rule = GAN_HE[allGans[i] + allGans[j]];
      if (!rule) continue;
      const el1 = WX[allGans[i]] ?? '', el2 = WX[allGans[j]] ?? '';
      const condMet = ZWX[monthZhi] === rule.result;
      if (condMet) {
        scores[el1] -= 2; scores[el2] -= 2;
        scores[rule.result] += 4;
        details.push(`天干合化: ${allGans[i]}${allGans[j]}→${rule.result}(+4), -2${el1} -2${el2}`);
      }
    }
  }

  // ═══ 7. 地支六合 ═══════════════════════════════
  const filledZhis = new Set<string>();
  for (let i = 0; i < allZhis.length - 1; i++) {
    for (let j = i + 1; j < allZhis.length; j++) {
      const result = ZHI_HE[allZhis[i] + allZhis[j]];
      if (result) {
        const hePts = 3 * cl(result);
        scores[result] += hePts;
        filledZhis.add(allZhis[i]); filledZhis.add(allZhis[j]);
        // 合化消耗原五行（化神五行不扣自己）
        const elA = ZWX[allZhis[i]] ?? '', elB = ZWX[allZhis[j]] ?? '';
        const deducts: string[] = [];
        if (elA !== result) { scores[elA] -= 2; deducts.push(`-2${elA}`); }
        if (elB !== result) { scores[elB] -= 2; deducts.push(`-2${elB}`); }
        details.push(`六合: ${allZhis[i]}${allZhis[j]}→${result}(+${hePts.toFixed(1)})${deducts.length ? ' ' + deducts.join(' ') : ''}`);
      }
    }
  }

  // ═══ 8. 空亡 ═══════════════════════════════════
  const dayGanIdx = GAN_ORDER.indexOf(pillars[2]?.gan ?? '');
  const dayZhiIdx = ZHI_ORDER.indexOf(pillars[2]?.zhi ?? '');
  const xunShouZhi = (dayZhiIdx - dayGanIdx + 12) % 12;
  const kongWangSet = new Set([ZHI_ORDER[(xunShouZhi + 10) % 12], ZHI_ORDER[(xunShouZhi + 11) % 12]]);
  for (const tri of TRI_COMBOS) {
    const present = tri.members.filter(m => allZhis.includes(m));
    if (present.length >= 2) for (const m of present) filledZhis.add(m);
  }
  for (const z of allZhis) {
    if (kongWangSet.has(z) && !filledZhis.has(z)) {
      const el = ZWX[z] ?? '';
      scores[el] -= 1;
      details.push(`空亡: ${z}(${el}) → -1`);
    }
  }

  // ═══ 9. 三合/半合 ═════════════════════════════
  const zhiCountMap: Record<string, number> = {};
  for (const z of allZhis) zhiCountMap[z] = (zhiCountMap[z] ?? 0) + 1;
  for (const tri of TRI_COMBOS) {
    const present = tri.members.filter(m => zhiCountMap[m] > 0);
    if (present.length === 3) {
      const n = Math.min(...tri.members.map(m => zhiCountMap[m] ?? 0));
      const pts = 6 * n * cl(tri.el);
      scores[tri.el] += pts;
      const deducts: string[] = [];
      for (const m of tri.members) {
        const el = ZWX[m] ?? '';
        if (el !== tri.el) { scores[el] -= 2 * n; deducts.push(`-2${el}`); }
      }
      details.push(`三合局: ${tri.members.join('')}→${tri.el}(+${pts.toFixed(1)})${deducts.length ? ' ' + deducts.join(' ') : ''}${n > 1 ? ` x${n}` : ''}`);
    } else if (present.length === 2) {
      const [c0, c1] = present.map(m => zhiCountMap[m] ?? 0);
      const n = c0 * c1;
      const hasMid = present.includes(tri.mid);
      const pts = 4 * n * cl(tri.el);
      const label = hasMid ? '前半合' : '拱合';
      scores[tri.el] += pts;
      const deducts: string[] = [];
      for (const m of present) {
        const el = ZWX[m] ?? '';
        if (el !== tri.el) { scores[el] -= 1 * (zhiCountMap[m] ?? 0); deducts.push(`-1${el}`); }
      }
      details.push(`${label}: ${present.join('')}→${tri.el}(+${pts.toFixed(1)})${deducts.length ? ' ' + deducts.join(' ') : ''}${n > 1 ? ` x${n}` : ''}`);
    }
  }

  // ═══ 10. 三会 ══════════════════════════════════
  for (const hui of TRI_HUI) {
    const counts = hui.members.map(m => zhiCountMap[m] ?? 0);
    if (counts.every(c => c > 0)) {
      const n = Math.min(...counts);
      const pts = 10 * n * cl(hui.el);
      scores[hui.el] += pts;
      // 三会消耗: 三支各-3（化神五行不扣）
      const deducts3: string[] = [];
      for (const m of hui.members) {
        const el = ZWX[m] ?? '';
        if (el !== hui.el) { scores[el] -= 3 * n; deducts3.push(`-3${el}`); }
      }
      details.push(`三会局: ${hui.members.join('')}→${hui.el}(+${pts.toFixed(1)})${deducts3.length ? ' ' + deducts3.join(' ') : ''}${n > 1 ? ` x${n}` : ''}`);
    }
  }

  // ═══ 11. 相刑（旺衰修正） ═══════════════════════
  const zhiCounts: Record<string, number> = {};
  for (const z of allZhis) zhiCounts[z] = (zhiCounts[z] ?? 0) + 1;
  for (const z of ['辰', '午', '酉', '亥']) {
    if (zhiCounts[z] >= 2) details.push(`自刑: ${z}${z}（同支自刑）`);
  }
  for (let i = 0; i < allZhis.length - 1; i++) {
    for (let j = i + 1; j < allZhis.length; j++) {
      if (!XING_PAIRS[allZhis[i] + allZhis[j]]) continue;
      const ea = ZWX[allZhis[i]] ?? '', eb = ZWX[allZhis[j]] ?? '';
      const all3 = allZhis.join('');
      const isTriXing =
        (all3.includes('寅') && all3.includes('巳') && all3.includes('申')) ||
        (all3.includes('丑') && all3.includes('戌') && all3.includes('未'));
      const base = isTriXing ? 2 : 1;
      const modA = seasonMod(allZhis[i], monthZhi), modB = seasonMod(allZhis[j], monthZhi);
      const ptsA = base * modA, ptsB = base * modB;
      scores[ea] -= ptsA; scores[eb] -= ptsB;
      const la = modA === 0.5 ? '旺' : modA === 2 ? '衰' : '平';
      const lb = modB === 0.5 ? '旺' : modB === 2 ? '衰' : '平';
      details.push(`${isTriXing ? '三刑' : '相刑'}: ${allZhis[i]}(${la})${allZhis[j]}(${lb}) → -${ptsA.toFixed(1)}${ea} -${ptsB.toFixed(1)}${eb}`);
    }
  }

  // ═══ 12. 六冲（旺衰修正） ═══════════════════════
  for (let i = 0; i < allZhis.length - 1; i++) {
    for (let j = i + 1; j < allZhis.length; j++) {
      const a = allZhis[i], b = allZhis[j];
      if (CHONG_PAIRS[a] !== b) continue;
      const ea = ZWX[a] ?? '', eb = ZWX[b] ?? '';
      const modA = seasonMod(a, monthZhi), modB = seasonMod(b, monthZhi);
      const isKu = ['辰', '戌', '丑', '未'].includes(a) && ['辰', '戌', '丑', '未'].includes(b);
      const basePts = isKu ? 3 : 5;
      const ptsA = basePts * modA, ptsB = basePts * modB;
      scores[ea] -= ptsA; scores[eb] -= ptsB;
      const la = modA === 0.5 ? '旺' : modA === 2 ? '衰' : '平';
      const lb = modB === 0.5 ? '旺' : modB === 2 ? '衰' : '平';
      details.push(`六冲: ${a}(${la})${b}(${lb})${isKu ? ' [库冲]' : ''} → -${ptsA.toFixed(1)}${ea} -${ptsB.toFixed(1)}${eb}`);
    }
  }

  // ═══ 13. Floor ═══════════════════════════════════
  // 负分归0，但八字中实际出现的五行保底0.1（弱而不灭）
  const appeared = new Set<string>();
  for (const p of pillars) {
    appeared.add(WX[p.gan] ?? '');
    appeared.add(ZWX[p.zhi] ?? '');
    for (const h of p.canggan) appeared.add(WX[h.stem] ?? '');
  }
  for (const k of Object.keys(scores)) {
    if ((scores[k] ?? 0) < 0) scores[k] = 0;
    if (scores[k] === 0 && appeared.has(k)) scores[k] = 0.01;
  }

  // ═══ 14. 位置远近调整 ═══════════════════════════
  // 年柱离日主隔一柱，影响力减半；月/时/日柱全额
  const POS_WEIGHT = [0.5, 1.0, 1.0, 1.0]; // 年,月,日,时
  for (let i = 0; i < 4; i++) {
    const pw = POS_WEIGHT[i];
    if (pw >= 1.0) continue;
    for (const el of ORDER) {
      const raw = pillarRaw[i][el];
      if (raw <= 0) continue;
      const discount = raw * (1 - pw);
      scores[el] -= discount;
      details.push(`位置: ${['年','月','日','时'][i]}柱${el}${raw.toFixed(2)}×${pw} → -${discount.toFixed(2)}`);
    }
  }

  // ═══ 15. 生克归日 ═══════════════════════════════
  // 所有五行分按生克关系统到日主：自党(比劫+印半) vs 异党(官杀+食伤+财)
  const dayGan = pillars[2]?.gan ?? '';
  const dayEl = WX[dayGan] ?? '';
  const dayIdx = ORDER.indexOf(dayEl);

  const shengEl = ORDER[(dayIdx + 4) % 5];
  const keEl   = ORDER[(dayIdx + 3) % 5];
  const ventEl = ORDER[(dayIdx + 1) % 5];
  const caiEl  = ORDER[(dayIdx + 2) % 5];

  const dayScore   = scores[dayEl] ?? 0;
  const shengScore = scores[shengEl] ?? 0;
  const keScore    = scores[keEl] ?? 0;
  const ventScore  = scores[ventEl] ?? 0;
  const caiScore   = scores[caiEl] ?? 0;

  // 自党 = 日主(含比劫) + 印星半力 × 印星气候
  const shengAdj = shengScore * cl(shengEl);
  const ziDang = dayScore + shengAdj / 2;
  // 异党 = 官杀 + 食伤 + 财
  const yiDang = keScore + ventScore + caiScore;

  details.push(`归日: 自党=日${dayScore.toFixed(2)}+印${shengScore.toFixed(1)}×${cl(shengEl)}/2=${ziDang.toFixed(2)} | 异党=官${keScore.toFixed(1)}+食${ventScore.toFixed(1)}+财${caiScore.toFixed(1)}=${yiDang.toFixed(2)}`);

  // ═══ 16. 强弱判定 ═══════════════════════════════
  const strength = ziDang > yiDang ? '身强' : '身弱';

  return { scores, details, dayStrength: strength, dayScore };
}
