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
  WX, ZWX, ORDER, YIN_GAN, CLIMATE_COEFF,
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

  const allGans = pillars.map(p => p.gan);
  const allZhis = [...pillars.map(p => p.zhi), ...extraZhis];
  const allCangGans = pillars.flatMap(p => p.canggan);
  const monthZhi = pillars[1]?.zhi ?? '';

  const cl = (el: string) => CLIMATE_COEFF[monthZhi]?.[el] ?? 1.0;

  // ═══ 1. 天干基分 ═══════════════════════════════
  for (let i = 0; i < allGans.length; i++) {
    const g = allGans[i];
    const el = WX[g] ?? '';
    if (!el) continue;
    const rawRoot = stemRootScore(g, allZhis, allCangGans);
    const rootScore = (YIN_GAN.has(g) ? rawRoot * 0.7 : rawRoot) * cl(el);
    const total = 3 * cl(el) + rootScore;
    scores[el] += total;
    details.push(`天干${g}(${el}): 3×${cl(el)}+根${rawRoot}×${cl(el)}${YIN_GAN.has(g) ? '(阴)' : ''}=${total.toFixed(2)}`);
  }

  // ═══ 2. 地支力量 ═══════════════════════════════
  const zhiWeights = [2, 5, 3, 4];
  for (let i = 0; i < allZhis.length; i++) {
    const z = allZhis[i];
    const el = ZWX[z] ?? '';
    if (!el) continue;
    const pts = (zhiWeights[i] ?? 2) * cl(el);
    scores[el] += pts;
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
    else if ((zIdx + 2) % 5 === gIdx) { adjG = -1; adjZ =  0; label = '截脚'; }
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
      const condMet = ZWX[monthZhi] === rule.result || allZhis.some(z => ZWX[z] === rule.result);
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
        scores[result] += 3;
        filledZhis.add(allZhis[i]); filledZhis.add(allZhis[j]);
        details.push(`六合: ${allZhis[i]}${allZhis[j]}→${result}(+3)`);
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
      scores[tri.el] += 6 * n;
      details.push(`三合局: ${tri.members.join('')}→${tri.el}(+${6 * n}${n > 1 ? ` x${n}` : ''})`);
    } else if (present.length === 2) {
      const [c0, c1] = present.map(m => zhiCountMap[m] ?? 0);
      const n = c0 * c1;
      const hasMid = present.includes(tri.mid);
      const label = hasMid ? '前半合' : '拱合';
      scores[tri.el] += 4 * n;
      details.push(`${label}: ${present.join('')}→${tri.el}(+${4}${n > 1 ? ` x${n}` : ''})`);
    }
  }

  // ═══ 10. 三会 ══════════════════════════════════
  for (const hui of TRI_HUI) {
    const counts = hui.members.map(m => zhiCountMap[m] ?? 0);
    if (counts.every(c => c > 0)) {
      const n = Math.min(...counts);
      scores[hui.el] += 10 * n;
      details.push(`三会局: ${hui.members.join('')}→${hui.el}(+${10 * n}${n > 1 ? ` x${n}` : ''})`);
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

  // ═══ 13. Floor at 0 ══════════════════════════════
  for (const k of Object.keys(scores)) {
    if ((scores[k] ?? 0) < 0) scores[k] = 0;
  }

  // ═══ 14. 克关系调整 ═════════════════════════════
  const dayGan = pillars[2]?.gan ?? '';
  const dayEl = WX[dayGan] ?? '';
  const dayIdx = ORDER.indexOf(dayEl);
  if (dayIdx >= 0) {
    const controllerEl = ORDER[(dayIdx + 3) % 5];
    const controllerScore = scores[controllerEl] ?? 0;
    if (controllerScore > 0) {
      const penalty = Math.floor(controllerScore / 2) * cl(controllerEl);
      scores[dayEl] = Math.max(0, (scores[dayEl] ?? 0) - penalty);
      details.push(`克关系: ${controllerEl}(${controllerScore.toFixed(2)}×${cl(controllerEl)})克${dayEl} → 日主-${penalty.toFixed(2)}`);
    } else {
      details.push(`克关系: ${controllerEl}为0，无克身之力`);
    }
  }

  // ═══ 15. 强弱判定 ══════════════════════════════
  const dayScore = scores[dayEl] ?? 0;
  const shengEl = ORDER[(ORDER.indexOf(dayEl) + 4) % 5];
  const shengScore = scores[shengEl] ?? 0;
  const effectiveDay = shengScore > dayScore ? dayScore + Math.floor(shengScore / 2) : dayScore;

  const keEl = ORDER[(ORDER.indexOf(dayEl) + 3) % 5];
  const woShengEl = ORDER[(ORDER.indexOf(dayEl) + 1) % 5];
  const woKeEl = ORDER[(ORDER.indexOf(dayEl) + 2) % 5];
  const opposeScore = (scores[keEl] ?? 0) + (scores[woShengEl] ?? 0) + (scores[woKeEl] ?? 0);
  const ventScore = scores[woShengEl] ?? 0;

  const dayWt = CLIMATE_COEFF[monthZhi]?.[dayEl] ?? 1.0;
  const isShiLing = dayWt <= 0.7;

  let strength: string;
  if (effectiveDay >= opposeScore * 1.5) {
    strength = isShiLing ? '中和偏旺' : '身强';
  } else if (ventScore >= dayScore * 0.7 && dayScore >= 8) {
    strength = isShiLing ? '中和偏旺' : '身强';
  } else if (effectiveDay >= opposeScore) {
    strength = '中和偏旺';
  } else if (effectiveDay >= opposeScore * 0.6) {
    strength = '中和偏弱';
  } else {
    strength = '身弱';
  }

  return { scores, details, dayStrength: strength, dayScore };
}
