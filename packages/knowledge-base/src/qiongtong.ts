/**
 * 《穷通宝鉴》(造化元钥) 调候用神表
 * 十干 × 十二月 → 精准调候喜忌
 */

type MonthKey = '寅'|'卯'|'辰'|'巳'|'午'|'未'|'申'|'酉'|'戌'|'亥'|'子'|'丑';

interface TiaoHouRule {
  primary: string;   // 首选调候用神
  secondary: string; // 次选用神
  avoid: string;     // 忌见
  reason: string;    // 穷通原文简述
}

// 十干 × 十二月调候表
export const QIONGTONG_TABLE: Record<string, Record<MonthKey, TiaoHouRule>> = {
  // ── 甲木 ─────────────────────────────────────
  甲: {
    寅: { primary:'丙', secondary:'癸', avoid:'庚', reason:'初春尚有余寒，先丙后癸。丙癸双透，科甲清贵。' },
    卯: { primary:'庚', secondary:'丙丁戊己', avoid:'', reason:'春木阳壮，先用庚金砍削成材。' },
    辰: { primary:'庚', secondary:'丁壬', avoid:'', reason:'春深木老，先用庚金，再用丁火暖之。' },
    巳: { primary:'癸', secondary:'丁庚', avoid:'', reason:'夏木枯槁，先用癸水解炎，再用庚丁。' },
    午: { primary:'癸', secondary:'丁庚', avoid:'', reason:'五月木性焦枯，必取癸水润泽，兼用丁庚。' },
    未: { primary:'癸', secondary:'庚丁', avoid:'', reason:'三夏末月，先用癸水，次用庚金。' },
    申: { primary:'庚', secondary:'丁', avoid:'', reason:'秋金肃杀，庚金雕琢成器，丁火炼金。' },
    酉: { primary:'庚', secondary:'丁丙', avoid:'丙', reason:'八月官星当令，庚金制之，忌丙合辛。' },
    戌: { primary:'庚', secondary:'甲丁', avoid:'', reason:'九月土燥木枯，先用庚金劈甲引丁。' },
    亥: { primary:'庚', secondary:'丁丙戊', avoid:'', reason:'亥月水旺，庚金劈甲引丁，戊土制水。' },
    子: { primary:'丁', secondary:'庚丙', avoid:'癸', reason:'严冬木寒不发，专用丁火解冻，忌癸灭丁。' },
    丑: { primary:'丁', secondary:'庚丙', avoid:'癸', reason:'腊月同子月，专用丁火暖局。' },
  },

  // ── 乙木 ─────────────────────────────────────
  乙: {
    寅: { primary:'丙', secondary:'癸', avoid:'', reason:'初春尚寒，丙火照暖，癸水滋润。丙癸双透为贵。' },
    卯: { primary:'丙', secondary:'癸', avoid:'', reason:'二月乙木，丙癸并用，花木向阳。' },
    辰: { primary:'丙', secondary:'癸', avoid:'', reason:'三月乙木，丙癸双用。' },
    巳: { primary:'癸', secondary:'', avoid:'丙', reason:'夏木枯槁，专用癸水润泽，丙多用癸。' },
    午: { primary:'癸', secondary:'', avoid:'丙', reason:'五月乙木，癸水解旱为急，火多木焚。' },
    未: { primary:'癸', secondary:'丙', avoid:'', reason:'三夏末月，先癸后丙。' },
    申: { primary:'丙', secondary:'癸', avoid:'庚', reason:'秋金当令，丙火制金，癸水润木，忌庚合乙。' },
    酉: { primary:'癸', secondary:'丙', avoid:'', reason:'八月乙木根枯，优先癸水润木。' },
    戌: { primary:'癸', secondary:'', avoid:'', reason:'九秋木枯，专用癸水。' },
    亥: { primary:'丙', secondary:'', avoid:'', reason:'十月乙木，丙火为尊。' },
    子: { primary:'丙', secondary:'', avoid:'', reason:'冬月乙木，丙火解冻，花木向阳。' },
    丑: { primary:'丙', secondary:'', avoid:'', reason:'腊月同子，丙火为急。' },
  },

  // ── 丙火 ─────────────────────────────────────
  丙: {
    寅: { primary:'壬', secondary:'庚', avoid:'', reason:'春初丙火渐生，壬水辅映，庚金助水。' },
    卯: { primary:'壬', secondary:'己', avoid:'', reason:'二月丙火阳壮，壬水为尊，己土浊水宜酌。' },
    辰: { primary:'壬', secondary:'甲', avoid:'', reason:'三月先用壬水，甲木助之。' },
    巳: { primary:'壬', secondary:'庚癸', avoid:'', reason:'夏火炎炎，壬水为第一，庚金发源。' },
    午: { primary:'壬', secondary:'庚', avoid:'', reason:'五月丙火极旺，专用壬水，庚金发源。' },
    未: { primary:'壬', secondary:'庚', avoid:'', reason:'三夏末月，同午月取壬庚。' },
    申: { primary:'壬', secondary:'戊', avoid:'', reason:'秋火渐衰，壬水为用，戊土制水适中。' },
    酉: { primary:'壬', secondary:'癸', avoid:'', reason:'八月火退，壬癸并用。' },
    戌: { primary:'甲', secondary:'壬', avoid:'', reason:'九秋火微，甲木生火，壬水酌用。' },
    亥: { primary:'甲', secondary:'戊庚', avoid:'', reason:'亥月水旺克火，甲木助火，戊土制水。' },
    子: { primary:'甲', secondary:'戊庚', avoid:'', reason:'冬月丙火微弱，甲木为命源，忌水灭火。' },
    丑: { primary:'甲', secondary:'戊庚', avoid:'', reason:'腊月同子，甲木为急。' },
  },

  // ── 丁火 ─────────────────────────────────────
  丁: {
    寅: { primary:'甲', secondary:'庚', avoid:'', reason:'春初丁火微弱，甲木引火，庚金劈甲。' },
    卯: { primary:'甲', secondary:'庚', avoid:'', reason:'二月丁火，甲庚并用。' },
    辰: { primary:'甲', secondary:'庚', avoid:'', reason:'三月同。' },
    巳: { primary:'甲', secondary:'庚', avoid:'', reason:'夏火旺，甲木为燃料，庚金劈甲引丁。' },
    午: { primary:'甲', secondary:'庚', avoid:'', reason:'五月丁火同巳月。' },
    未: { primary:'甲', secondary:'庚', avoid:'', reason:'三夏末月同。' },
    申: { primary:'甲', secondary:'庚丙', avoid:'', reason:'秋金旺，甲木扶丁，庚金劈甲。' },
    酉: { primary:'甲', secondary:'庚丙', avoid:'', reason:'八月丁火同申月。' },
    戌: { primary:'甲', secondary:'庚', avoid:'', reason:'九秋丁火微，甲木为先。' },
    亥: { primary:'甲', secondary:'庚', avoid:'', reason:'亥月丁火微弱，甲木为急。' },
    子: { primary:'甲', secondary:'庚', avoid:'', reason:'冬月丁火，甲木救命，庚金劈甲引丁。' },
    丑: { primary:'甲', secondary:'庚', avoid:'', reason:'腊月同子。' },
  },

  // ── 戊土 ─────────────────────────────────────
  戊: {
    寅: { primary:'丙', secondary:'甲癸', avoid:'', reason:'初春寒气未除，先丙暖土，次甲疏土，癸润土。' },
    卯: { primary:'丙', secondary:'甲癸', avoid:'', reason:'二月戊土，丙甲癸三用。' },
    辰: { primary:'甲', secondary:'丙癸', avoid:'', reason:'三月土厚，先用甲木疏劈。' },
    巳: { primary:'癸', secondary:'甲丙', avoid:'', reason:'夏土燥烈，优先癸水润土。' },
    午: { primary:'癸', secondary:'丙', avoid:'', reason:'五月土燥，癸水为急。' },
    未: { primary:'癸', secondary:'丙甲', avoid:'', reason:'三夏末月同。' },
    申: { primary:'丙', secondary:'甲癸', avoid:'', reason:'秋土渐寒，先用丙火暖土。' },
    酉: { primary:'丙', secondary:'癸', avoid:'', reason:'八月戊土，丙癸双用。' },
    戌: { primary:'甲', secondary:'癸丙', avoid:'', reason:'九秋土实，甲木疏劈为先。' },
    亥: { primary:'甲', secondary:'丙', avoid:'', reason:'亥月水旺土荡，甲木疏土，丙火暖之。' },
    子: { primary:'丙', secondary:'甲', avoid:'', reason:'冬月戊土寒冻，丙火解冻为先。' },
    丑: { primary:'丙', secondary:'甲', avoid:'', reason:'腊月同子月。' },
  },

  // ── 己土 ─────────────────────────────────────
  己: {
    寅: { primary:'丙', secondary:'甲', avoid:'', reason:'初春己土寒湿，丙火暖土为先。' },
    卯: { primary:'甲', secondary:'丙癸', avoid:'', reason:'二月己土，甲木疏劈。' },
    辰: { primary:'丙', secondary:'癸甲', avoid:'', reason:'三月先用丙火，癸水润之，甲木疏之。' },
    巳: { primary:'癸', secondary:'丙', avoid:'', reason:'夏土燥，癸水润土为先。' },
    午: { primary:'癸', secondary:'丙', avoid:'', reason:'五月己土同巳月。' },
    未: { primary:'癸', secondary:'丙', avoid:'', reason:'三夏末月同。' },
    申: { primary:'丙', secondary:'癸', avoid:'', reason:'秋土渐寒，丙暖癸润。' },
    酉: { primary:'丙', secondary:'癸', avoid:'', reason:'八月己土，丙癸双用。' },
    戌: { primary:'甲', secondary:'癸丙', avoid:'', reason:'九秋土实，甲木为先。' },
    亥: { primary:'丙', secondary:'甲', avoid:'', reason:'冬土寒，丙火为先。' },
    子: { primary:'丙', secondary:'甲', avoid:'', reason:'冬月己土，丙火解冻。' },
    丑: { primary:'丙', secondary:'甲', avoid:'', reason:'腊月同子月。' },
  },

  // ── 庚金 ─────────────────────────────────────
  庚: {
    寅: { primary:'丙', secondary:'甲戊', avoid:'', reason:'初春余寒，丙火暖金为先。' },
    卯: { primary:'丁', secondary:'甲丙', avoid:'', reason:'二月庚金，丁火锻炼，甲木引火。' },
    辰: { primary:'甲', secondary:'丁', avoid:'', reason:'三月先用甲木疏土，次用丁火炼金。' },
    巳: { primary:'壬', secondary:'戊丙', avoid:'', reason:'夏火克金，壬水护金，戊土制水。' },
    午: { primary:'壬', secondary:'癸', avoid:'', reason:'五月庚金，壬水为急，癸水次之。' },
    未: { primary:'壬', secondary:'甲丁', avoid:'', reason:'三夏末月，壬水护金。' },
    申: { primary:'丁', secondary:'甲', avoid:'', reason:'秋金当令，丁火锻炼成器。' },
    酉: { primary:'丁', secondary:'丙', avoid:'', reason:'八月庚金同申月。' },
    戌: { primary:'甲', secondary:'壬', avoid:'', reason:'九秋土厚埋金，甲木疏土，壬水次之。' },
    亥: { primary:'丁', secondary:'丙', avoid:'', reason:'冬金寒，丁火暖金为先。' },
    子: { primary:'丁', secondary:'甲丙', avoid:'', reason:'冬月庚金寒，丁火为第一用神。' },
    丑: { primary:'丙', secondary:'丁甲', avoid:'癸', reason:'腊月金入库，丙火暖金。本命用火调候。忌癸水灭丙。' },
  },

  // ── 辛金 ─────────────────────────────────────
  辛: {
    寅: { primary:'己', secondary:'壬', avoid:'', reason:'初春辛金弱，己土生金，壬水淘洗。' },
    卯: { primary:'壬', secondary:'甲', avoid:'', reason:'二月辛金，壬水淘洗。' },
    辰: { primary:'壬', secondary:'甲', avoid:'', reason:'三月辛金同。' },
    巳: { primary:'壬', secondary:'甲癸', avoid:'', reason:'夏火克金，壬水护金，甲木助水。' },
    午: { primary:'壬', secondary:'己癸', avoid:'', reason:'五月辛金，壬水为急。' },
    未: { primary:'壬', secondary:'庚', avoid:'', reason:'三夏末月同。' },
    申: { primary:'壬', secondary:'甲戊', avoid:'', reason:'秋金旺，壬水淘洗，甲木制土。' },
    酉: { primary:'壬', secondary:'', avoid:'', reason:'八月辛金，壬水为用。' },
    戌: { primary:'壬', secondary:'甲', avoid:'', reason:'九秋同。' },
    亥: { primary:'壬', secondary:'丙', avoid:'', reason:'冬金寒湿，先用壬水，次用丙暖。' },
    子: { primary:'丙', secondary:'壬', avoid:'', reason:'冬月辛金寒，丙暖为先，壬水次之。' },
    丑: { primary:'丙', secondary:'壬', avoid:'', reason:'腊月辛金入库，丙火暖金为先。' },
  },

  // ── 壬水 ─────────────────────────────────────
  壬: {
    寅: { primary:'庚', secondary:'丙戊', avoid:'', reason:'春初水寒，庚金发源，丙火暖之。' },
    卯: { primary:'戊', secondary:'庚辛', avoid:'', reason:'二月壬水，戊土堤防为先。' },
    辰: { primary:'甲', secondary:'庚', avoid:'', reason:'三月土旺，甲木疏土，庚金助水。' },
    巳: { primary:'壬', secondary:'庚癸', avoid:'', reason:'夏水干涸，壬水比助为先，庚金发源。' },
    午: { primary:'癸', secondary:'庚辛', avoid:'', reason:'五月壬水极涸，癸水为急，庚辛生水。' },
    未: { primary:'庚', secondary:'癸', avoid:'', reason:'三夏末月，庚金发源为先。' },
    申: { primary:'戊', secondary:'丁', avoid:'', reason:'秋水旺，戊土堤防，丁火助土。' },
    酉: { primary:'甲', secondary:'庚', avoid:'', reason:'八月壬水，甲木泄水，庚金助水。' },
    戌: { primary:'甲', secondary:'丙', avoid:'', reason:'九秋同。' },
    亥: { primary:'戊', secondary:'丙庚', avoid:'', reason:'亥月水旺，戊土堤防，丙火暖之。' },
    子: { primary:'戊', secondary:'丙', avoid:'', reason:'冬月壬水汪洋，戊土堤防为先，丙火次之。' },
    丑: { primary:'丙', secondary:'甲戊', avoid:'', reason:'腊月水寒，丙火为先。' },
  },

  // ── 癸水 ─────────────────────────────────────
  癸: {
    寅: { primary:'庚', secondary:'丙', avoid:'', reason:'初春水寒，庚金发源，丙火暖之。' },
    卯: { primary:'庚', secondary:'丙', avoid:'', reason:'二月癸水，庚丙双用。' },
    辰: { primary:'丙', secondary:'辛', avoid:'', reason:'三月癸水入库，丙火为首，辛金发源。' },
    巳: { primary:'辛', secondary:'', avoid:'', reason:'夏水干涸，辛金发源为急。' },
    午: { primary:'辛', secondary:'壬庚', avoid:'', reason:'五月癸水极弱，辛金发源，壬水比助。' },
    未: { primary:'庚', secondary:'壬', avoid:'', reason:'三夏末月，庚金为先。' },
    申: { primary:'丁', secondary:'', avoid:'', reason:'秋水金旺，丁火暖水。' },
    酉: { primary:'辛', secondary:'丙', avoid:'', reason:'八月癸水，辛金发源，丙火暖之。' },
    戌: { primary:'辛', secondary:'甲', avoid:'', reason:'九秋同。' },
    亥: { primary:'庚', secondary:'辛戊', avoid:'', reason:'亥月水旺，庚金发源，戊土制水。' },
    子: { primary:'丙', secondary:'辛', avoid:'', reason:'冬月癸水极寒，丙火为第一用神。' },
    丑: { primary:'丙', secondary:'', avoid:'', reason:'腊月同子月，丙火为急。' },
  },
};

// ── 查表函数 ──────────────────────────────────
export function lookupTiaoHou(dayGan: string, monthZhi: string): TiaoHouRule | null {
  const table = QIONGTONG_TABLE[dayGan];
  if (!table) return null;
  return table[monthZhi as MonthKey] ?? null;
}

export function formatTiaoHou(dayGan: string, monthZhi: string): string {
  const rule = lookupTiaoHou(dayGan, monthZhi);
  if (!rule) return '无调候数据';
  return `${rule.reason}（首选${rule.primary}${rule.secondary ? '、次选'+rule.secondary : ''}${rule.avoid ? '、忌'+rule.avoid : ''}）`;
}
