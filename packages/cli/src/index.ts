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
import { BirthInfoSchema, initDatabase } from '@bazi-destiny/core';
import { BaziEngine } from '@bazi-destiny/engine-bazi';
import { renderBazi } from './ascii.js';
import { runSensitivity } from './sensitivity.js';
import { cite, scoreChart, analyzeChart, analyzeAllDimensions } from '@bazi-destiny/knowledge-base';
import type { ChartResult, SpecialtyResultV2 } from '@bazi-destiny/knowledge-base';
import { generateBaziReport, generateScoringReport } from './detailed.js';
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

      // Initialize database
      const dbPath = join(homedir(), '.bazi-destiny', 'charts.db');
      const fs = await import('fs');
      fs.mkdirSync(join(homedir(), '.bazi-destiny'), { recursive: true });
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

      // ═══ L3+L4: 计分 + 分析（编排器统一执行，不再在Engine或报告中重复计算） ═══
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
        const score = scoreChart(chart);
        const analysis = await analyzeChart(chart, score, {
          age: new Date().getFullYear() - new Date(birthInfo.datetime).getFullYear(),
          gender: birthInfo.gender as 'M' | 'F',
        });
        // 注入 L3+L4 结果（兼容旧报告接口）
        Object.assign(bazi, {
          yongShen: analysis.yongShen,
          dayStrength: score.dayStrength,
          final: { yongShen: analysis.yongShen, xiShen: analysis.xiShen, jiShen: analysis.jiShen },
        });
        // L5: 专项分析（11维规则引擎）
        const specialty = analyzeAllDimensions(chart, score, analysis, {
          gender: birthInfo.gender as 'M' | 'F',
          age: new Date().getFullYear() - new Date(birthInfo.datetime).getFullYear(),
        });

        // 预计算结果，传给报告生成器避免重复计算
        (bazi as any)._precomputed = {
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
        const scoringReport = await generateScoringReport(outputs.bazi as any, { datetime, location: `${birthInfo.latitude}, ${birthInfo.longitude}`, gender: birthInfo.gender, name: options.name as string || '' }, (outputs.bazi as any)._precomputed);
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
        const baziReport = await generateBaziReport(outputs.bazi as any, birthInfoObj, (outputs.bazi as any)._precomputed);

        if (options.output) {
          const base = (options.output as string).replace(/\.(txt|json)$/, '');
          fs.writeFileSync(`${base}-bazi.md`, baziReport, 'utf-8');
          console.log(`Saved: ${base}-bazi.md`);
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
        }, (outputs.bazi as any)._precomputed);
        if (options.output) {
          const reportPath = (options.output as string).replace(/\.(txt|json)$/, '') + '-report.md';
          fs.writeFileSync(reportPath, baziReport, 'utf-8');
          console.log(`Report saved: ${reportPath}`);
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

      // Save to case registry if --name provided
      if (options.name) {
        const casesPath = 'data/cases.json';
        const casesFile = fs.existsSync(casesPath) ? JSON.parse(fs.readFileSync(casesPath, 'utf-8')) : [];
        // Deduplicate: update existing or add new
        const key = `${options.name}|${datetime.replace('T', ' ')}|${options.gender}`;
        const existingIdx = casesFile.findIndex((c: Record<string,string>) =>
          `${c.name}|${c.birth}|${c.gender}` === key);
        const entry = {
          name: options.name as string,
          gender: options.gender,
          birth: datetime.replace('T', ' '),
          location: options.lat ? `${options.lat}, ${options.lon}` : '',
          reportPath: `output/${options.name}/full-bazi.md`,
          generatedAt: new Date().toISOString(),
        };
        if (existingIdx >= 0) casesFile[existingIdx] = entry;
        else casesFile.push(entry);
        fs.mkdirSync(dirname(casesPath), { recursive: true });
        fs.writeFileSync(casesPath, JSON.stringify(casesFile, null, 2), 'utf-8');
      }

      // Save system determination to data/<name>/
      if (options.name && outputs.bazi) {
        const baziData = outputs.bazi as Record<string, unknown>;
        const sysDir = `data/${options.name}`;
        fs.mkdirSync(sysDir, { recursive: true });
        const pillars = baziData.pillars as Record<string, unknown> | undefined;
        const dayun = baziData.dayun as Record<string, unknown> | undefined;
        fs.writeFileSync(`${sysDir}/system-result.json`, JSON.stringify({
          name: options.name,
          birth: datetime.replace('T', ' '),
          gender: options.gender,
          yongShen: baziData.yongShen,
          final: baziData.final,
          dayStrength: baziData.dayStrength,
          pattern: baziData.pattern,
          // 四柱精简: 只存干支十神，不含纳音
          pillars: pillars ? {
            年柱: { gan: (pillars.年柱 as Record<string,unknown>)?.gan, zhi: (pillars.年柱 as Record<string,unknown>)?.zhi, shishen: (pillars.年柱 as Record<string,unknown>)?.shishen, canggan: (pillars.年柱 as Record<string,unknown>)?.canggan },
            月柱: { gan: (pillars.月柱 as Record<string,unknown>)?.gan, zhi: (pillars.月柱 as Record<string,unknown>)?.zhi, shishen: (pillars.月柱 as Record<string,unknown>)?.shishen, canggan: (pillars.月柱 as Record<string,unknown>)?.canggan },
            日柱: { gan: (pillars.日柱 as Record<string,unknown>)?.gan, zhi: (pillars.日柱 as Record<string,unknown>)?.zhi, shishen: (pillars.日柱 as Record<string,unknown>)?.shishen, canggan: (pillars.日柱 as Record<string,unknown>)?.canggan },
            时柱: { gan: (pillars.时柱 as Record<string,unknown>)?.gan, zhi: (pillars.时柱 as Record<string,unknown>)?.zhi, shishen: (pillars.时柱 as Record<string,unknown>)?.shishen, canggan: (pillars.时柱 as Record<string,unknown>)?.canggan },
          } : undefined,
          dayun: dayun ? {
            startAgeYears: dayun.startAgeYears,
            direction: dayun.direction,
            steps: (dayun.steps as Array<Record<string,unknown>>)?.map(s => ({
              startAge: s.startAge, endAge: s.endAge,
              gan: s.gan, zhi: s.zhi,
              ganShishen: s.ganShishen, zhiShishen: s.zhiShishen,
            })),
          } : undefined,
        }, null, 2), 'utf-8');
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
