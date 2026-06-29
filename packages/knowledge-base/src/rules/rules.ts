/**
 * Knowledge base — classical Bazi rules from canonical texts.
 * Each rule maps: pattern + conditions → conclusion + source citation.
 */

export interface ClassicalRule {
  /** 格局 pattern name (正官格, 七杀格, etc.) */
  pattern: string;
  /** Keywords/conditions 十神/用神/五行 that trigger this rule */
  conditions: string[];
  /** The classical conclusion/断语 */
  conclusion: string;
  /** Source citation */
  source: {
    book: string;     // 书名
    chapter?: string; // 章节
  };
}

/**
 * Core rules from《渊海子平》— the foundational Ming-dynasty text.
 * Covers the 8 standard patterns (正格八格).
 */
export const YUANHAI_ZIPING: ClassicalRule[] = [
  // ── 正官格 ──────────────────────────────────────
  {
    pattern: '正官格',
    conditions: ['正官', '佩印'],
    conclusion: '官星佩印，贵不可言。正官格得印绶相生，官印双全，主其人品性端正，文章盖世，可为公卿之才。',
    source: { book: '渊海子平', chapter: '正官格' },
  },
  {
    pattern: '正官格',
    conditions: ['正官', '财星'],
    conclusion: '官得财生，富贵双全。正官格见财星，财能生官，官星得助，主富贵兼得。',
    source: { book: '渊海子平', chapter: '正官格' },
  },
  {
    pattern: '正官格',
    conditions: ['正官', '伤官'],
    conclusion: '官星被伤，贵气受损。正官格逢伤官克制，主官场不顺，易有口舌是非。宜配印制伤以救应。',
    source: { book: '渊海子平', chapter: '正官格' },
  },
  {
    pattern: '正官格',
    conditions: ['正官', '七杀', '混杂'],
    conclusion: '官杀混杂，去留须清。正官格兼见七杀，为官杀混杂，宜去杀留官或去官留杀，取清为贵。',
    source: { book: '渊海子平', chapter: '官杀混杂' },
  },
  {
    pattern: '正官格',
    conditions: ['正官', '身旺'],
    conclusion: '身旺官强，位高权重。日主旺相而官星有力，为身官两停，主仕途通达，执掌权柄。',
    source: { book: '渊海子平', chapter: '正官格' },
  },
  {
    pattern: '正官格',
    conditions: ['正官', '身弱'],
    conclusion: '身弱官重，劳而无功。日主衰弱而官星过旺，为官多身弱，主虽有为官之志，力不从心，宜行印比运。',
    source: { book: '渊海子平', chapter: '正官格' },
  },

  // ── 七杀格 / 偏官格 ────────────────────────────
  {
    pattern: '七杀格',
    conditions: ['七杀', '食神制杀'],
    conclusion: '食神制杀，英雄独压万人。七杀为凶神，得食神有力克制，化杀为权，主智勇双全，可掌兵刑大权。',
    source: { book: '渊海子平', chapter: '七杀格' },
  },
  {
    pattern: '七杀格',
    conditions: ['七杀', '印绶', '化杀'],
    conclusion: '杀印相生，功名显达。七杀逢印绶化之，杀生印、印生身，化凶为吉，主文武兼备。',
    source: { book: '渊海子平', chapter: '七杀格' },
  },
  {
    pattern: '七杀格',
    conditions: ['七杀', '身弱', '无制'],
    conclusion: '杀重身弱，非贫即夭。七杀攻身而无制化，日主不堪其克，主一生多灾多难。',
    source: { book: '渊海子平', chapter: '七杀格' },
  },
  {
    pattern: '七杀格',
    conditions: ['七杀', '羊刃'],
    conclusion: '杀刃双显，武贵之命。七杀得羊刃合之，刃可合杀，主以武职立功，但性情刚烈易折。',
    source: { book: '渊海子平', chapter: '七杀格' },
  },

  // ── 正财格 ──────────────────────────────────────
  {
    pattern: '正财格',
    conditions: ['正财', '身旺'],
    conclusion: '身旺财旺，富裕之命。日主强旺而正财得令有气，为身财两停，主一生财源广进。',
    source: { book: '渊海子平', chapter: '正财格' },
  },
  {
    pattern: '正财格',
    conditions: ['正财', '身弱'],
    conclusion: '财多身弱，富屋贫人。正财过旺而身弱不堪任财，主虽见钱财而不能自享。',
    source: { book: '渊海子平', chapter: '正财格' },
  },
  {
    pattern: '正财格',
    conditions: ['正财', '官星'],
    conclusion: '财官双美，名利双收。正财格得官星护卫，财能生官，主富贵兼得。',
    source: { book: '渊海子平', chapter: '正财格' },
  },

  // ── 偏财格 ──────────────────────────────────────
  {
    pattern: '偏财格',
    conditions: ['偏财', '身旺'],
    conclusion: '偏财身旺，经商致富。偏财主动荡之财，日主旺相能任，主经商得利，且有意外之财。',
    source: { book: '渊海子平', chapter: '偏财格' },
  },
  {
    pattern: '偏财格',
    conditions: ['偏财', '官杀'],
    conclusion: '偏财带官，商而优则仕。偏财格见官星，财能生官，主由商界转入政界。',
    source: { book: '渊海子平', chapter: '偏财格' },
  },

  // ── 正印格 ──────────────────────────────────────
  {
    pattern: '正印格',
    conditions: ['正印', '身弱'],
    conclusion: '印绶扶身，文贵之命。日主衰弱得正印相生，化杀生身，主学业优异，文章出众，以文采立身。',
    source: { book: '渊海子平', chapter: '正印格' },
  },
  {
    pattern: '正印格',
    conditions: ['正印', '官星'],
    conclusion: '印绶逢官，学而优则仕。正印格得官星相配，印可护官，主学问渊博且有官运。',
    source: { book: '渊海子平', chapter: '正印格' },
  },
  {
    pattern: '正印格',
    conditions: ['正印', '财星', '贪财坏印'],
    conclusion: '贪财坏印，贵气受损。正印格逢财星克印，财能坏印，主因利损德，功名受阻。',
    source: { book: '渊海子平', chapter: '正印格' },
  },

  // ── 偏印格 / 枭神格 ────────────────────────────
  {
    pattern: '偏印格',
    conditions: ['偏印', '身弱'],
    conclusion: '枭印扶身，巧艺立身。偏印生身，主思维独特，擅长偏门技艺，宜从事研究或技术工作。',
    source: { book: '渊海子平', chapter: '偏印格' },
  },
  {
    pattern: '偏印格',
    conditions: ['偏印', '食神', '枭神夺食'],
    conclusion: '枭神夺食，福薄多灾。偏印克夺食神，食神为福星，被夺则福泽受损，主多病或子女缘薄。',
    source: { book: '渊海子平', chapter: '偏印格' },
  },

  // ── 食神格 ──────────────────────────────────────
  {
    pattern: '食神格',
    conditions: ['食神', '身旺'],
    conclusion: '食神泄秀，才艺出众。日主旺相而食神有力泄之，主人聪慧多才，衣食丰足，性情温和。',
    source: { book: '渊海子平', chapter: '食神格' },
  },
  {
    pattern: '食神格',
    conditions: ['食神', '正官'],
    conclusion: '食神见官，心性平和。食神格逢正官，食神不伤官星则为福，主性情稳重，有管理之才。',
    source: { book: '渊海子平', chapter: '食神格' },
  },
  {
    pattern: '食神格',
    conditions: ['食神', '偏印'],
    conclusion: '食神逢枭，福中有忧。食神格遇偏印克制，为倒食，主食禄有损，宜注意健康。',
    source: { book: '渊海子平', chapter: '食神格' },
  },

  // ── 伤官格 ──────────────────────────────────────
  {
    pattern: '伤官格',
    conditions: ['伤官', '佩印'],
    conclusion: '伤官佩印，贵不可言。伤官泄秀太过，得印星制伤扶身，化偏为正，主才华与地位双收。',
    source: { book: '渊海子平', chapter: '伤官格' },
  },
  {
    pattern: '伤官格',
    conditions: ['伤官', '见官'],
    conclusion: '伤官见官，为祸百端。伤官克制正官，官为贵气，被伤则贵气全失，主仕途坎坷，口舌是非多。',
    source: { book: '渊海子平', chapter: '伤官格' },
  },
  {
    pattern: '伤官格',
    conditions: ['伤官', '生财'],
    conclusion: '伤官生财，以技致富。伤官生财星，化泄为生，主以技艺、口才、创意谋生，可成富命。',
    source: { book: '渊海子平', chapter: '伤官格' },
  },
  {
    pattern: '伤官格',
    conditions: ['伤官', '身弱'],
    conclusion: '伤官身弱，聪明反累。日主衰弱而伤官泄之过度，虽聪明但精力不济，宜行印比运助身。',
    source: { book: '渊海子平', chapter: '伤官格' },
  },
];

/**
 * Supplementary rules from《三命通会》— the Ming encyclopedia.
 */
export const SANMING_TONGHUI: ClassicalRule[] = [
  {
    pattern: '正官格',
    conditions: ['正官', '日主', '得令'],
    conclusion: '日主得令而官星透干，为官星得地，主少年得志，早登科甲。',
    source: { book: '三命通会', chapter: '论正官' },
  },
  {
    pattern: '七杀格',
    conditions: ['七杀', '有制', '身强'],
    conclusion: '七杀有制为偏官，身强制杀为权，主威震边疆，功名显赫。',
    source: { book: '三命通会', chapter: '论偏官' },
  },
  {
    pattern: '正财格',
    conditions: ['正财', '食神', '生财'],
    conclusion: '食神生财，财有源头，主善于经营，财富源源不断。',
    source: { book: '三命通会', chapter: '论正财' },
  },
];

/**
 * Supplementary rules from《滴天髓》— the Qing classic.
 */
export const DITIANSUI: ClassicalRule[] = [
  {
    pattern: '正官格',
    conditions: ['正官', '清', '纯'],
    conclusion: '官星清而纯，不杂七杀，不受刑冲，为清贵之象。',
    source: { book: '滴天髓', chapter: '官杀论' },
  },
  {
    pattern: '七杀格',
    conditions: ['七杀', '攻身', '无制'],
    conclusion: '杀无制而攻身，克我无情，非贫即夭，宜用食神制之或用印化之。',
    source: { book: '滴天髓', chapter: '官杀论' },
  },
  {
    pattern: '伤官格',
    conditions: ['伤官', '水木', '火土'],
    conclusion: '伤官格须分五行：木火伤官官要旺，金水伤官喜见官。各随五行性质而定喜忌。',
    source: { book: '滴天髓', chapter: '伤官论' },
  },
];

/** All rules combined */
export const ALL_RULES: ClassicalRule[] = [
  ...YUANHAI_ZIPING,
  ...SANMING_TONGHUI,
  ...DITIANSUI,
];
