/**
 * Ziwei analysis rules — 格局评论, 星曜喜忌, 四化飞星
 */

// ── 星曜亮度释义 ─────────────────────────────────
export const BRIGHTNESS_MEANING: Record<string, string> = {
  '庙': '星曜最强状态，吉星增吉，凶星减凶',
  '旺': '星曜强旺，力量充足，吉凶皆显',
  '得': '星曜得地，力量中等，需结合宫位判断',
  '利': '星曜尚可，力量偏弱，需他星扶持',
  '平': '星曜平平，力量不足，影响力有限',
  '陷': '星曜落陷，力量最弱，吉星无力凶星肆虐',
};

// ── 格局评论 ──────────────────────────────────────
export const PATTERN_COMMENTARY: Record<string, string> = {
  '日照雷门格': '太阳居卯宫为日照雷门，卯为震卦属木，日出东方光照雷门，主其人光明磊落，胸襟开阔，早年即有声名。太阳庙旺，一生贵人多助，适合文教、法律、政治等行业。',
  '月朗天门格': '太阴居亥宫为月朗天门，亥为天门属水，月映水中清辉万里，主其人温文尔雅，才思敏捷，富艺术气质，女命尤贵。',
  '日丽中天格': '太阳居午宫为日丽中天，午为正南方离火之位，日照当空光芒万丈，主其人志向远大，事业心强，可成大器，但须防锋芒过露。',
  '紫微朝垣格': '紫微守命宫为紫微朝垣，紫微为帝星，坐守命宫统领全局，主其人天生领袖气质，有统御之才，但须辅弼扶持方成大器。',
  '机月同梁格': '天机、太阴、天同、天梁汇聚命宫或迁移宫，为机月同梁格。此四星皆属柔和之星，主其人心思细腻，善谋划，适合幕僚、参谋、策划类工作，多为吏人。',
  '杀破狼格': '七杀、破军、贪狼守命宫，为杀破狼格。三星皆属动荡之星，主其人一生起伏较大，不喜安稳，适合创业、军警、开拓性行业，成败皆在一念之间。',
};

// ── 主星在各宫位的喜忌 ──────────────────────────
export interface StarPalaceInfo {
  star: string;
  likes: string[];    // 喜在此宫
  dislikes: string[]; // 忌在此宫
  comment: string;
}

export const STAR_PALACE_COMPATIBILITY: StarPalaceInfo[] = [
  {
    star: '紫微',
    likes: ['命宫', '官禄', '财帛', '田宅'],
    dislikes: ['疾厄', '仆役', '兄弟'],
    comment: '紫微为帝星，喜居庙旺宫位，入命宫、官禄宫最为得力；入疾厄、仆役则帝星蒙尘，难展其才。',
  },
  {
    star: '天机',
    likes: ['命宫', '兄弟', '福德'],
    dislikes: ['财帛', '田宅'],
    comment: '天机为谋士之星，喜居命宫、福德宫，善谋划而不善守财，入财帛宫易财来财去。',
  },
  {
    star: '太阳',
    likes: ['命宫', '官禄', '夫妻', '迁移'],
    dislikes: ['疾厄', '田宅'],
    comment: '太阳喜居庙旺宫位及日间出生之人，入命宫、官禄光芒万丈；入疾厄则需注意心血管。',
  },
  {
    star: '武曲',
    likes: ['财帛', '官禄', '命宫'],
    dislikes: ['夫妻', '子女', '福德'],
    comment: '武曲为财星，喜居财帛、官禄宫，主财运亨通；入夫妻宫刚硬寡宿，感情多波折。',
  },
  {
    star: '天同',
    likes: ['命宫', '福德', '夫妻'],
    dislikes: ['官禄', '财帛'],
    comment: '天同为福星，喜居命宫、福德宫主一生安逸；入官禄宫则进取心不足，事业难有大成。',
  },
  {
    star: '廉贞',
    likes: ['官禄', '命宫'],
    dislikes: ['夫妻', '兄弟'],
    comment: '廉贞为次桃花，入命宫、官禄宫主才艺出众；入夫妻宫主感情纠葛，需防桃花劫。',
  },
  {
    star: '天府',
    likes: ['命宫', '财帛', '田宅', '官禄'],
    dislikes: ['疾厄', '兄弟'],
    comment: '天府为库星，喜居庙旺宫位，入命宫、财帛宫主一生富足；入疾厄宫需注意肠胃。',
  },
  {
    star: '太阴',
    likes: ['命宫', '夫妻', '财帛', '田宅'],
    dislikes: ['官禄', '兄弟'],
    comment: '太阴为月星，喜夜间出生之人，入命宫、夫妻宫温柔娴雅；入官禄宫魄力不足。',
  },
  {
    star: '贪狼',
    likes: ['命宫', '夫妻', '福德'],
    dislikes: ['官禄', '田宅'],
    comment: '贪狼为正桃花，入命宫、夫妻宫主多才多艺、交际广泛；入官禄宫易因色误事。',
  },
  {
    star: '巨门',
    likes: ['命宫', '福德', '官禄'],
    dislikes: ['夫妻', '兄弟', '父母'],
    comment: '巨门为暗星，喜居庙旺位或得太阳照射；入命宫口才出众，入夫妻宫口舌是非多。',
  },
  {
    star: '天相',
    likes: ['命宫', '官禄', '财帛'],
    dislikes: ['疾厄', '夫妻'],
    comment: '天相为印星，入命宫、官禄宫主辅佐之才；入疾厄宫需注意皮肤、泌尿系统。',
  },
  {
    star: '天梁',
    likes: ['命宫', '福德', '父母'],
    dislikes: ['财帛', '夫妻'],
    comment: '天梁为寿星，入命宫、福德宫主长寿、有长者之风；入财帛宫主清贫自守。',
  },
  {
    star: '七杀',
    likes: ['命宫', '官禄', '迁移'],
    dislikes: ['夫妻', '子女', '田宅'],
    comment: '七杀为将星，入命宫、官禄宫主杀伐决断、开拓有成；入夫妻宫刚暴寡情。',
  },
  {
    star: '破军',
    likes: ['命宫', '官禄', '迁移'],
    dislikes: ['夫妻', '田宅', '财帛'],
    comment: '破军为耗星，入命宫、官禄宫主破旧立新、改革有成；入夫妻宫、田宅宫主家宅不宁。',
  },
];

// ── 四化飞星分析 ─────────────────────────
import type { ZiweiChart } from '@bazi-destiny/core';

export interface ZiweiAnalysis {
  pattern: {
    name: string;
    commentary: string;
  };
  sihuaAnalysis: Array<{
    star: string;
    type: '禄' | '权' | '科' | '忌';
    palace: string;
    comment: string;
  }>;
  palaceAnalysis: Array<{
    name: string;
    tianGan: string;
    diZhi: string;
    stars: Array<{
      name: string;
      brightness: string;
      brightnessComment: string;
      compatibility: string;
    }>;
  }>;
}

export function analyzeZiwei(chart: ZiweiChart): ZiweiAnalysis {
  const patternName = chart.pattern || '';
  const patternComment = PATTERN_COMMENTARY[patternName] ?? `此格局为${patternName}，具体分析需结合全盘星曜分布综合判断。`;

  // 四化 analysis
  const sihuaAnalysis = [];
  for (const [type, info] of Object.entries(chart.sihua)) {
    if (info.star) {
      const t = type === 'huaLu' ? '禄' : type === 'huaQuan' ? '权' : type === 'huaKe' ? '科' : '忌';
      sihuaAnalysis.push({
        star: info.star,
        type: t as '禄' | '权' | '科' | '忌',
        palace: info.palace,
        comment: getSihuaComment(info.star, t as '禄' | '权' | '科' | '忌', info.palace),
      });
    }
  }

  // Palace analysis
  const palaceAnalysis = chart.palaces.map(p => {
    const allStars = [...p.majorStars, ...p.minorStars];
    return {
      name: p.name,
      tianGan: p.heavenlyStem,
      diZhi: p.earthlyBranch,
      stars: allStars.map(s => {
        const brightnessComment = BRIGHTNESS_MEANING[s.brightness] ?? '';
        const compat = STAR_PALACE_COMPATIBILITY.find(c => c.star === s.name);
        const compatibility = compat
          ? (compat.likes.includes(p.name) ? `喜居此宫: ${compat.comment}` : compat.dislikes.includes(p.name) ? `忌居此宫: ${compat.comment}` : compat.comment)
          : '';
        return {
          name: s.name,
          brightness: s.brightness,
          brightnessComment,
          compatibility,
        };
      }),
    };
  });

  return { pattern: { name: patternName, commentary: patternComment }, sihuaAnalysis, palaceAnalysis };
}

// ── 四化飞星分析 ─────────────────────────
export interface SihuaEffect {
  star: string;
  type: '禄' | '权' | '科' | '忌';
  fromPalace: string;
  general: string;
  /** Which palaces are affected by this四化 */
  affected: string[];
}

export function getSihuaComment(star: string, type: '禄' | '权' | '科' | '忌', palace: string): string {
  const comments: Record<string, Record<string, string>> = {
    '天机': {
      '禄': `天机化禄在${palace}，主智慧生财，思维敏捷，善于抓住机遇。`,
      '权': `天机化权在${palace}，主智谋掌权，以计谋取胜，策划能力增强。`,
      '科': `天机化科在${palace}，主文采出众，考试运佳，学术研究有成就。`,
      '忌': `天机化忌在${palace}，主思虑过度，计划多变难以落实，易因想太多而错失良机。`,
    },
    '天梁': {
      '禄': `天梁化禄在${palace}，主福寿双全，贵人扶持，危难之时自有救应，晚年福厚。`,
      '权': `天梁化权在${palace}，主以德服人，长者之风更显，在组织中有话语权。`,
      '科': `天梁化科在${palace}，主清誉远播，德行受人敬仰，宜学术、教育、公益事业。`,
      '忌': `天梁化忌在${palace}，主孤芳自赏，过于清高而难以合群，需防好心办坏事。`,
    },
    '紫微': {
      '禄': `紫微化禄在${palace}，主帝星得禄，权威与财富并增，事业大有可为。`,
      '权': `紫微化权在${palace}，主权柄在握，统御能力增强，适合担任领导职位。`,
      '科': `紫微化科在${palace}，主名声显赫，社会地位提升，有贵人提携。`,
      '忌': `紫微化忌在${palace}，主孤君在朝，虽有权位但无人可用，须防刚愎自用。`,
    },
    '太阳': {
      '禄': `太阳化禄在${palace}，主光明正大而得财，名声与财富兼得，适合公众人物。`,
      '权': `太阳化权在${palace}，主权势显赫，领导力突出，事业如日中天。`,
      '科': `太阳化科在${palace}，主声名远播，文章出众，考试功名有成就。`,
      '忌': `太阳化忌在${palace}，主光芒被遮，事业受阻，须防小人暗算，注意眼疾。`,
    },
    '武曲': {
      '禄': `${star}化禄在${palace}，主财运亨通，正财偏财皆有收获，适合经商理财。`,
      '权': `${star}化权在${palace}，主以实力掌权，执行力强，做事果断有魄力。`,
      '科': `${star}化科在${palace}，主理财有方，财务规划能力出众，信用良好。`,
      '忌': `${star}化忌在${palace}，主财运受阻，资金周转困难，须防投资失误，注意呼吸系统。`,
    },
    '太阴': {
      '禄': `${star}化禄在${palace}，主暗财涌动，不动产运佳，适合长期投资。`,
      '权': `${star}化权在${palace}，主以柔克刚，以智慧掌权，不动声色中掌控全局。`,
      '科': `${star}化科在${palace}，主文采风流，艺术才华出众，审美能力提升。`,
      '忌': `${star}化忌在${palace}，主情绪低落，女性缘薄，须防妇科疾病，注意水厄。`,
    },
    '天同': {
      '禄': `${star}化禄在${palace}，主福气自来，不争不抢反而得利，晚年安逸。`,
      '权': `${star}化权在${palace}，主化被动为主动，懒散之性改善，事业有所作为。`,
      '科': `${star}化科在${palace}，主人缘提升，和气生财，宜从事协调沟通类工作。`,
      '忌': `${star}化忌在${palace}，主情绪困扰，缺乏进取心，易因安逸而错失机会。`,
    },
    '廉贞': {
      '禄': `${star}化禄在${palace}，主人缘桃花旺，交际应酬中得财，但须防烂桃花。`,
      '权': `${star}化权在${palace}，主自控力增强，能将才艺转化为事业，化桃花为力量。`,
      '科': `${star}化科在${palace}，主才艺出众，审美品位提升，宜艺术创作。`,
      '忌': `${star}化忌在${palace}，主桃花劫，感情纠葛不断，须防因色破财，注意血液疾病。`,
    },
    '贪狼': {
      '禄': `${star}化禄在${palace}，主交际得财，人脉就是钱脉，但须防酒色伤身。`,
      '权': `${star}化权在${palace}，主掌控欲望，社交手腕高明，能将人脉转化为权力。`,
      '科': `${star}化科在${palace}，主才艺出众，多才多艺更显，适合演艺、设计。`,
      '忌': `${star}化忌在${palace}，主欲望失控，沉迷酒色，须防纵欲伤身，注意肝病。`,
    },
    '巨门': {
      '禄': `${star}化禄在${palace}，主口才生财，靠嘴巴吃饭，宜销售、律师、教师。`,
      '权': `${star}化权在${palace}，主口才犀利，辩论能力出众，以理服人。`,
      '科': `${star}化科在${palace}，主学术研究有成，文章口才俱佳，宜学术工作。`,
      '忌': `${star}化忌在${palace}，主口舌是非，言语得罪人而不自知，须防官非诉讼。`,
    },
    '左辅': {
      '禄': `${star}化禄在${palace}，主贵人得力，左右逢源，团队合作顺利。`,
      '权': `${star}化权在${palace}，主辅佐之力增强，在团队中获得实权。`,
      '科': `${star}化科在${palace}，主人缘提升，同辈关系融洽，互相提携。`,
      '忌': `${star}化忌在${palace}，主助手不力，同辈失和，须防被身边人拖累。`,
    },
  };

  return comments[star]?.[type] ?? `${star}化${type}在${palace}，其影响需结合具体宫位和星曜组合判断。`;
}
