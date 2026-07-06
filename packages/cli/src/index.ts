#!/usr/bin/env node
/**
 * bazi-destiny CLI — Three-system destiny analysis
 *
 * Usage:
 *   bazi-destiny "1990-01-15 14:30" --lat 39.9 --lon 116.4 --gender M
 *   bazi-destiny "1990-01-15 14:30" --lat 39.9 --lon 116.4 --gender M --sensitivity
 *   bazi-destiny "1990-01-15 14:30" --lat 39.9 --lon 116.4 --gender M --debug
 */
import { Command } from 'commander';
import { BirthInfoSchema, initDatabase, upsertSubject, writeL2Chart, writeL3Score, writeL4Analysis, writeL5Specialty, writeL6Report, importCasesJson } from '@bazi-destiny/core';
import { BaziEngine } from '@bazi-destiny/engine-bazi';
import { renderBazi } from './ascii.js';
import { runSensitivity } from './sensitivity.js';
import { cite, scoreChart, analyzeChart, analyzeAllDimensions } from '@bazi-destiny/knowledge-base';
import type { ChartResult } from '@bazi-destiny/knowledge-base';
import { generateBaziReport, generateScoringReport } from './detailed.js';
import type { PrecomputedData } from './types.js';
import { generateAiAnalyses } from '@bazi-destiny/reports';
import type { AiInput } from '@bazi-destiny/reports';
import { homedir } from 'os';
import { join, dirname } from 'path';

const program = new Command();

program
  .name('bazi-destiny')
  .description('Three-system cross-validation destiny analysis CLI')
  .argument('<datetime>', 'Birth datetime (YYYY-MM-DD HH:MM)')
  .requiredOption('--gender <M|F>', 'Gender (M or F)')
  .option('--lat <number>', 'Birth latitude (-90 to 90)', parseFloat)
  .option('--lon <number>', 'Birth longitude (-180 to 180)', parseFloat)
  .option('--true-solar', 'Enable true solar time correction (requires --lat --lon)')
  .option('--sensitivity', 'Run time sensitivity analysis (±1 hour)')
  .option('--debug', 'Show full error stack traces')
  .option('--json', 'Output raw JSON only (no ASCII art)')
  .option('--output <path>', 'Save output to file instead of stdout')
  .option('--name <name>', 'Person name for report and case registry')
  .option('--consensus', 'Run cross-validation consensus analysis')
  .option('--citations', 'Include classical text citations')
  .option('--report', 'Generate professional markdown report')
  .option('--detailed', 'Generate separate detailed reports for each engine')
  .option('--ai', 'Enable AI narrative generation (disabled by default to save tokens)')
  .option('--scoring', 'Generate detailed scoring process report')
  .option('--pdf', 'Generate PDF from markdown report (requires --report --output)')
  .action(async (datetime, options) => {
    try {
      // Default to Beijing time; only use coordinates if --true-solar
      const lat = options.trueSolar ? (options.lat ?? 0) : 0;
      const lon = options.trueSolar ? (options.lon ?? 0) : 0;

      // Validate input
      const birthInfo = BirthInfoSchema.parse({
        datetime: datetime.replace(' ', 'T'),
        latitude: lat,
        longitude: lon,
        timezone: 'Asia/Shanghai',
        gender: options.gender,
      });

      // 只初始化八字引擎（紫微/占星后续开发时启用）
      const engines = [
        { name: 'bazi', engine: new BaziEngine() },
      ];

      const fs = await import('fs');
      // Initialize database
      const dbPath = join(process.cwd(), 'bazi-destiny.db');
      const db = initDatabase(dbPath);

      // Run engines in parallel
      const results = await Promise.allSettled(
        engines.map(e => e.engine.calculate(birthInfo)),
      );

      const outputs: Record<string, unknown> = {};
      const errors: string[] = [];

      for (let i = 0; i < engines.length; i++) {
        const r = results[i];
        const engineName = engines[i].name;

        if (r.status === 'fulfilled' && r.value.success) {
          outputs[engineName] = r.value.data;

          // Store in DB
          try {
            const stmt = db.prepare(
              'INSERT INTO subjects (datetime, latitude, longitude, timezone, gender) VALUES (?, ?, ?, ?, ?)',
            );
            const info = stmt.run(birthInfo.datetime, birthInfo.latitude, birthInfo.longitude, birthInfo.timezone, birthInfo.gender);
            const subjectId = info.lastInsertRowid as number;

            const tableMap: Record<string, string> = {
              bazi: 'bazi_charts',
              ziwei: 'ziwei_charts',
              astrology: 'astro_charts',
            };
            db.prepare(`INSERT INTO ${tableMap[engineName]} (subject_id, chart_data) VALUES (?, ?)`).run(
              subjectId,
              JSON.stringify(r.value.data),
            );
          } catch {
            // DB write is best-effort; don't fail CLI output
          }
        } else {
          const errMsg = r.status === 'fulfilled' ? (r.value.success ? '' : r.value.error) : String(r.reason);
          errors.push(`${engineName}: ${errMsg}`);
        }
      }

      // ═══ L3+L4+L5: 计分 + 分析 + 专项（编排器统一执行） ═══
      let precomputed: PrecomputedData | undefined;
      if (outputs.bazi) {
        const bazi = outputs.bazi as Record<string, unknown>;
        const chart: ChartResult = {
          pillars: bazi.pillars as ChartResult['pillars'],
          dayun: bazi.dayun as ChartResult['dayun'],
          pattern: bazi.pattern as string || '',
          shensha: (bazi.shensha || {}) as ChartResult['shensha'],
          dayGan: (bazi.pillars as Record<string, {gan: string}>).日柱?.gan ?? '',
          dayZhi: (bazi.pillars as Record<string, {zhi: string}>).日柱?.zhi ?? '',
          monthZhi: (bazi.pillars as Record<string, {zhi: string}>).月柱?.zhi ?? '',
        };
        const age = new Date().getFullYear() - new Date(birthInfo.datetime).getFullYear();
        const score = scoreChart(chart);
        const analysis = await analyzeChart(chart, score, { age, gender: birthInfo.gender as 'M' | 'F' });
        Object.assign(bazi, {
          yongShen: analysis.yongShen,
          dayStrength: score.dayStrength,
          final: { yongShen: analysis.yongShen, xiShen: analysis.xiShen, jiShen: analysis.jiShen },
        });
        // L5: 专项分析（11维规则引擎）
        const specialty = analyzeAllDimensions(chart, score, analysis, {
          gender: birthInfo.gender as 'M' | 'F',
          age,
        });

        // ── DB 持久化: L2→L3→L4→L5 ──
        if (options.name) {
          const subjectId = upsertSubject(db, { name: options.name, datetime: birthInfo.datetime, latitude: birthInfo.latitude, longitude: birthInfo.longitude, timezone: birthInfo.timezone, gender: birthInfo.gender as 'M' | 'F' });
          writeL2Chart(db, subjectId, {
            pattern: bazi.pattern as string || '', startAge: (bazi.dayun as any).startAgeYears || 0, direction: (bazi.dayun as any).direction || 'forward',
            dayGan: chart.dayGan, dayZhi: chart.dayZhi, monthZhi: chart.monthZhi,
            pillarsJson: JSON.stringify(bazi.pillars), dayunJson: JSON.stringify(bazi.dayun), shenshaJson: JSON.stringify(bazi.shensha || {}),
          });
          writeL3Score(db, subjectId, {
            dayStrength: score.dayStrength, dayScore: score.dayScore, ziDang: score.ziDang, yiDang: score.yiDang,
            elementScoresJson: JSON.stringify(score.elementScores), detailsJson: JSON.stringify(score.details), climateVersion: score.climateVersion,
          });
          writeL4Analysis(db, subjectId, {
            yongShen: analysis.yongShen, xiShenJson: JSON.stringify(analysis.xiShen), jiShenJson: JSON.stringify(analysis.jiShen),
            enginesJson: JSON.stringify(analysis.engines), patternType: chart.pattern, dayStrength: score.dayStrength,
            tiaohouJson: JSON.stringify(analysis.tiaohou), fuyiJson: JSON.stringify(analysis.fuyi),
          });
          writeL5Specialty(db, subjectId, {
            dimensionsJson: JSON.stringify(specialty.dimensions), grade: specialty.rating.grade, summary: specialty.rating.summary,
          });
        }

        // L5b: AI 分析（--ai 时并行调用3次API）
        let aiResult: any;
        const calcAge = new Date().getFullYear() - new Date(birthInfo.datetime).getFullYear();
        if (options.ai) {
          const currentYear = new Date().getFullYear();
          const tianGan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
          const diZhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
          const liunianGan = tianGan[(currentYear - 4) % 10];
          const liunianZhi = diZhi[(currentYear - 4) % 12];
          const curDayun = analysis.dayunJudgments.find((d: any) => d.step.startAge <= calcAge && d.step.endAge >= calcAge);
          const nextDayun = analysis.dayunJudgments.find((d: any) => d.step.startAge > calcAge);
          const specialtySummary = specialty.dimensions
            .filter((d: any) => d.items.length > 0)
            .map((d: any) => d.dimension + ': ' + (d.items[0]?.layer1 || '')).join('; ');

          aiResult = await generateAiAnalyses({
            chartData: JSON.stringify(chart.pillars),
            scoreData: '自党' + score.ziDang + ' 异党' + score.yiDang + ' 日主' + score.dayStrength,
            analysisData: '用神' + analysis.yongShen + ' 喜' + analysis.xiShen.join('/') + ' 忌' + analysis.jiShen.join('/'),
            specialtySummary,
            currentDayun: curDayun ? curDayun.step.gan + curDayun.step.zhi + ' (' + curDayun.step.startAge + '-' + curDayun.step.endAge + '岁)' : '',
            nextDayun: nextDayun ? nextDayun.step.gan + nextDayun.step.zhi + ' (' + nextDayun.step.startAge + '-' + nextDayun.step.endAge + '岁)' : '',
            dayunInteractions: curDayun?.interactions?.join('; ') || '',
            liunianData: currentYear + '年 ' + liunianGan + liunianZhi + '年',
            currentDayunContext: curDayun?.overall || '',
            yongShen: analysis.yongShen,
            xiShen: analysis.xiShen,
            jiShen: analysis.jiShen,
            dayStrength: score.dayStrength,
          });
        }

        // 预计算结果（类型安全），传给报告生成器避免重复计算
        precomputed = {
          aiResult,
          specialty,
          yongShenResult: {
            tiaohou: analysis.tiaohou,
            fuyi: analysis.fuyi,
            bingyao: analysis.bingyao,
            engines: analysis.engines,
            final: { yongShen: analysis.yongShen, xiShen: analysis.xiShen, jiShen: analysis.jiShen },
          },
          score: {
            dayStrength: score.dayStrength,
            dayScore: score.dayScore,
            elementScores: score.elementScores,
            ziDang: score.ziDang,
            yiDang: score.yiDang,
          },
        };
      }

      // Build output
      const jsonOutput = JSON.stringify({ outputs, errors }, null, 2);
      let textOutput = '';
      if (outputs.bazi) {
        textOutput += renderBazi(outputs.bazi as Parameters<typeof renderBazi>[0]) + '\n\n';
      }

      // Write to file or stdout
      if (options.output) {
        const outPath = options.output as string;
        fs.mkdirSync(dirname(outPath), { recursive: true });
        const content = options.json ? jsonOutput : textOutput;
        fs.writeFileSync(outPath, content, 'utf-8');

        // Also write JSON alongside if text mode
        if (!options.json) {
          const jsonPath = outPath.replace(/\.txt$/, '') + '.json';
          fs.writeFileSync(jsonPath, jsonOutput, 'utf-8');
          console.log(`Saved: ${outPath}`);
          console.log(`Saved: ${jsonPath}`);
        } else {
          console.log(`Saved: ${outPath}`);
        }
      } else {
        if (options.json) {
          console.log(jsonOutput);
        } else {
          console.log(textOutput);
        }
      }

      // Errors
      if (errors.length > 0) {
        console.error('\n--- ERRORS ---');
        for (const err of errors) {
          console.error(`  ${err}`);
        }
      }

      // 交叉验证：需紫微/占星引擎，暂不可用
      if (options.consensus) {
        console.log('⚠️ --consensus 需要紫微和占星引擎，尚未开发。');
      }

      // Scoring process report
      if (options.scoring && outputs.bazi) {
        const scoringReport = await generateScoringReport(outputs.bazi as any, { datetime, location: `${birthInfo.latitude}, ${birthInfo.longitude}`, gender: birthInfo.gender, name: options.name as string || '' }, precomputed!);
        if (options.output) {
          fs.writeFileSync(`${(options.output as string).replace(/\.(txt|json)$/, '')}-scoring.md`, scoringReport, 'utf-8');
          console.log(`Saved: ${(options.output as string).replace(/\.(txt|json)$/, '')}-scoring.md`);
        } else { console.log(scoringReport); }
      }

      // 八字详细报告（紫微/占星报告暂停开发）
      if (options.detailed && outputs.bazi) {
        const birthInfoObj = {
          datetime: datetime,
          location: `${birthInfo.latitude}, ${birthInfo.longitude}`,
          gender: birthInfo.gender,
          name: options.name as string || '',
          skipAi: !(options.ai as boolean),
        };
        const baziReport = await generateBaziReport(outputs.bazi as any, birthInfoObj, precomputed!);

        if (options.output) {
          const base = (options.output as string).replace(/\.(txt|json)$/, '');
          const reportDir = `output/${options.name}/report`; fs.mkdirSync(reportDir, { recursive: true }); fs.writeFileSync(`${reportDir}/bazi.md`, baziReport, 'utf-8');
          console.log(`Saved: ${reportDir}/bazi.md`);
        } else {
          console.log(baziReport);
        }
      }

      // 专业报告（紫微/占星暂停开发，仅出八字报告）
      if (options.report && outputs.bazi) {
        const baziReport = await generateBaziReport(outputs.bazi as any, {
          datetime: datetime,
          location: `${birthInfo.latitude}, ${birthInfo.longitude}`,
          gender: birthInfo.gender,
          name: options.name as string || '',
          skipAi: !(options.ai as boolean),
        }, precomputed!);
        // L6 报告写入 DB
        if (options.name) {
          const sid = upsertSubject(db, { name: options.name, datetime: birthInfo.datetime, latitude: birthInfo.latitude, longitude: birthInfo.longitude, timezone: birthInfo.timezone, gender: birthInfo.gender as 'M' | 'F' });
          writeL6Report(db, sid, 'md', baziReport);
        }
        if (options.output) {
          const name = options.name as string || 'report';
          const reportDir = `output/${name}`;
          fs.mkdirSync(reportDir, { recursive: true });
          const reportPath = `${reportDir}/${name}-report.md`;
          fs.writeFileSync(reportPath, baziReport, 'utf-8');
          console.log(`Report saved: ${reportPath}`);

          // PDF 生成
          if (options.pdf) {
            const pdfPath = `${reportDir}/${name}-report.pdf`;
            console.log(`Generating PDF...`);
            const { spawnSync } = await import('child_process');
            const result = spawnSync('bash', ['-c',
              `npx md-to-pdf "${reportPath}" --css "body { font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif; }" --pdf-options '{"format":"A4","margin":{"top":"15mm","bottom":"15mm","left":"15mm","right":"15mm"}}' > "${pdfPath}"`
            ], { cwd: process.cwd(), stdio: 'inherit', shell: false });
            if (result.status === 0) {
              console.log(`PDF saved: ${pdfPath}`);
            } else {
              console.log(`PDF generation failed`);
            }
          }
        } else {
          console.log(baziReport);
        }
      }

      // Classical text citations
      if (options.citations && outputs.bazi) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const b: any = outputs.bazi;
        const pattern: string = b.pattern || '';
        const keywords: string[] = [];
        if (b.pillars) {
          for (const [, p] of Object.entries(b.pillars as Record<string, { shishen: string }>)) {
            if (p.shishen && p.shishen !== '日主') keywords.push(p.shishen);
          }
        }
        if (b.yongShen) keywords.push(b.yongShen as string);

        if (keywords.length > 0) {
          // Use detected pattern; fall back to keyword-only search if pattern unknown
          const citationText = cite({ pattern: pattern || '', keywords, limit: 5 });
          if (!options.json) {
            console.log('\n--- 古籍引用 ---');
            console.log(citationText);
          }
        }
      }

      // Sensitivity analysis
      if (options.sensitivity) {
        console.log('\n--- SENSITIVITY ANALYSIS (±1h) ---');
        const sensResult = await runSensitivity(birthInfo, engines);

        for (const [label, engineResults] of Object.entries(sensResult.results)) {
          console.log(`\n  [${label}]`);
          for (const [engName, data] of Object.entries(engineResults)) {
            console.log(`    ${engName}: ${data ? 'OK' : 'FAILED'}`);
          }
        }

        if (sensResult.errors.length > 0) {
          console.error('\n  Sensitivity errors:');
          for (const err of sensResult.errors) {
            console.error(`    ${err}`);
          }
        }
      }

      // Debug: show full errors
      if (options.debug && errors.length > 0) {
        console.error('\n--- DEBUG (full error details) ---');
        for (const err of errors) {
          console.error(`  ${err}`);
        }
      }

      // Save to case registry (DB) if --name provided
      if (options.name) {
        upsertSubject(db, { name: options.name, datetime: birthInfo.datetime, latitude: birthInfo.latitude, longitude: birthInfo.longitude, timezone: birthInfo.timezone, gender: birthInfo.gender as 'M' | 'F' });
      }

      db.close();

      // Exit with error code if any engine failed
      if (errors.length > 0) {
        process.exit(1);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      if (options.debug) {
        console.error(err);
      }
      process.exit(1);
    }
  });

program.parse();
