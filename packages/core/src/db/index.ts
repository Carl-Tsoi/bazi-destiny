/**
 * SQLite 数据库层 — L1-L6 层间持久化
 *
 * 表结构:
 *   subjects        — L1 输入 (替代 cases.json)
 *   l2_charts       — L2 排盘
 *   l3_scores       — L3 计分
 *   l4_analyses     — L4 分析
 *   l5_specialties  — L5 专项
 *   l6_reports      — L6 报告
 *
 * 使用: 每层算完后调用对应的 write 函数（幂等: INSERT OR REPLACE）
 *       下次运行先查 DB 缓存，命中则跳过计算
 */

import Database from 'better-sqlite3';
import type BetterSqlite3 from 'better-sqlite3';

// ── 表结构 DDL ──────────────────────────────────

const SCHEMA = `
CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  datetime TEXT NOT NULL,
  latitude REAL NOT NULL DEFAULT 0,
  longitude REAL NOT NULL DEFAULT 0,
  timezone TEXT NOT NULL DEFAULT 'Asia/Shanghai',
  gender TEXT NOT NULL CHECK(gender IN ('M', 'F')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(name, datetime, gender)
);

CREATE TABLE IF NOT EXISTS l2_charts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL UNIQUE REFERENCES subjects(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL DEFAULT '',
  start_age INTEGER NOT NULL DEFAULT 0,
  direction TEXT NOT NULL DEFAULT 'forward',
  day_gan TEXT NOT NULL DEFAULT '',
  day_zhi TEXT NOT NULL DEFAULT '',
  month_zhi TEXT NOT NULL DEFAULT '',
  pillars_json TEXT NOT NULL DEFAULT '{}',
  dayun_json TEXT NOT NULL DEFAULT '{}',
  shensha_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS l3_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL UNIQUE REFERENCES subjects(id) ON DELETE CASCADE,
  day_strength TEXT NOT NULL DEFAULT '',
  day_score REAL NOT NULL DEFAULT 0,
  zi_dang REAL NOT NULL DEFAULT 0,
  yi_dang REAL NOT NULL DEFAULT 0,
  element_scores_json TEXT NOT NULL DEFAULT '{}',
  details_json TEXT NOT NULL DEFAULT '[]',
  climate_version INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS l4_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL UNIQUE REFERENCES subjects(id) ON DELETE CASCADE,
  yong_shen TEXT NOT NULL DEFAULT '',
  xi_shen_json TEXT NOT NULL DEFAULT '[]',
  ji_shen_json TEXT NOT NULL DEFAULT '[]',
  engines_json TEXT NOT NULL DEFAULT '[]',
  pattern_type TEXT NOT NULL DEFAULT '',
  day_strength TEXT NOT NULL DEFAULT '',
  tiaohou_json TEXT NOT NULL DEFAULT '{}',
  fuyi_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS l5_specialties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL UNIQUE REFERENCES subjects(id) ON DELETE CASCADE,
  dimensions_json TEXT NOT NULL DEFAULT '[]',
  grade TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS l6_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  format TEXT NOT NULL DEFAULT 'md',
  content TEXT NOT NULL DEFAULT '',
  generated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

// ── 初始化 ─────────────────────────────────────

export function initDatabase(dbPath: string): BetterSqlite3.Database {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

// ── L1: subjects (替代 cases.json) ────────────

export interface SubjectRow {
  id: number;
  name: string | null;
  datetime: string;
  latitude: number;
  longitude: number;
  timezone: string;
  gender: 'M' | 'F';
}

export function upsertSubject(db: BetterSqlite3.Database, s: Omit<SubjectRow, 'id'>): number {
  // 手动 upsert: 先查后插（兼容旧表无 UNIQUE 约束）
  const existing = db.prepare('SELECT id FROM subjects WHERE name=? AND datetime=? AND gender=?').get(s.name, s.datetime, s.gender) as { id: number } | undefined;
  if (existing) return existing.id;
  const r = db.prepare('INSERT INTO subjects (name, datetime, latitude, longitude, timezone, gender) VALUES (?,?,?,?,?,?)').run(s.name, s.datetime, s.latitude, s.longitude, s.timezone, s.gender);
  return Number(r.lastInsertRowid);
}

export function getSubject(db: BetterSqlite3.Database, name: string, datetime: string, gender: string): SubjectRow | undefined {
  return db.prepare('SELECT * FROM subjects WHERE name=? AND datetime=? AND gender=?').get(name, datetime, gender) as SubjectRow | undefined;
}

export function getAllSubjects(db: BetterSqlite3.Database): SubjectRow[] {
  return db.prepare('SELECT * FROM subjects ORDER BY id').all() as SubjectRow[];
}

export function importCasesJson(db: BetterSqlite3.Database, cases: Array<{ name: string; gender: 'M' | 'F'; birth: string }>): number {
  const stmt = db.prepare(`INSERT OR IGNORE INTO subjects (name, datetime, latitude, longitude, timezone, gender) VALUES (?, ?, 0, 0, 'Asia/Shanghai', ?)`);
  const tx = db.transaction(() => {
    let count = 0;
    for (const c of cases) {
      const r = stmt.run(c.name, c.birth.replace(' ', 'T'), c.gender);
      if (r.changes > 0) count++;
    }
    return count;
  });
  return tx();
}

// ── L2: charts ──────────────────────────────

export function writeL2Chart(db: BetterSqlite3.Database, subjectId: number, data: {
  pattern: string; startAge: number; direction: string;
  dayGan: string; dayZhi: string; monthZhi: string;
  pillarsJson: string; dayunJson: string; shenshaJson: string;
}): void {
  db.prepare(`INSERT OR REPLACE INTO l2_charts (subject_id, pattern, start_age, direction, day_gan, day_zhi, month_zhi, pillars_json, dayun_json, shensha_json)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(subjectId, data.pattern, data.startAge, data.direction, data.dayGan, data.dayZhi, data.monthZhi, data.pillarsJson, data.dayunJson, data.shenshaJson);
}

export function getL2Chart(db: BetterSqlite3.Database, subjectId: number): Record<string, unknown> | undefined {
  return db.prepare('SELECT * FROM l2_charts WHERE subject_id=?').get(subjectId) as Record<string, unknown> | undefined;
}

// ── L3: scores ──────────────────────────────

export function writeL3Score(db: BetterSqlite3.Database, subjectId: number, data: {
  dayStrength: string; dayScore: number; ziDang: number; yiDang: number;
  elementScoresJson: string; detailsJson: string; climateVersion: number;
}): void {
  db.prepare(`INSERT OR REPLACE INTO l3_scores (subject_id, day_strength, day_score, zi_dang, yi_dang, element_scores_json, details_json, climate_version)
    VALUES (?,?,?,?,?,?,?,?)`).run(subjectId, data.dayStrength, data.dayScore, data.ziDang, data.yiDang, data.elementScoresJson, data.detailsJson, data.climateVersion);
}

export function getL3Score(db: BetterSqlite3.Database, subjectId: number): Record<string, unknown> | undefined {
  return db.prepare('SELECT * FROM l3_scores WHERE subject_id=?').get(subjectId) as Record<string, unknown> | undefined;
}

// ── L4: analyses ────────────────────────────

export function writeL4Analysis(db: BetterSqlite3.Database, subjectId: number, data: {
  yongShen: string; xiShenJson: string; jiShenJson: string;
  enginesJson: string; patternType: string; dayStrength: string;
  tiaohouJson: string; fuyiJson: string;
}): void {
  db.prepare(`INSERT OR REPLACE INTO l4_analyses (subject_id, yong_shen, xi_shen_json, ji_shen_json, engines_json, pattern_type, day_strength, tiaohou_json, fuyi_json)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(subjectId, data.yongShen, data.xiShenJson, data.jiShenJson, data.enginesJson, data.patternType, data.dayStrength, data.tiaohouJson, data.fuyiJson);
}

export function getL4Analysis(db: BetterSqlite3.Database, subjectId: number): Record<string, unknown> | undefined {
  return db.prepare('SELECT * FROM l4_analyses WHERE subject_id=?').get(subjectId) as Record<string, unknown> | undefined;
}

// ── L5: specialties ──────────────────────────

export function writeL5Specialty(db: BetterSqlite3.Database, subjectId: number, data: {
  dimensionsJson: string; grade: string; summary: string;
}): void {
  db.prepare(`INSERT OR REPLACE INTO l5_specialties (subject_id, dimensions_json, grade, summary)
    VALUES (?,?,?,?)`).run(subjectId, data.dimensionsJson, data.grade, data.summary);
}

export function getL5Specialty(db: BetterSqlite3.Database, subjectId: number): Record<string, unknown> | undefined {
  return db.prepare('SELECT * FROM l5_specialties WHERE subject_id=?').get(subjectId) as Record<string, unknown> | undefined;
}

// ── L6: reports ──────────────────────────────

export function writeL6Report(db: BetterSqlite3.Database, subjectId: number, format: string, content: string): void {
  db.prepare('INSERT INTO l6_reports (subject_id, format, content) VALUES (?,?,?)').run(subjectId, format, content);
}

export function getL6Reports(db: BetterSqlite3.Database, subjectId: number): Array<{ format: string; content: string; generated_at: string }> {
  return db.prepare('SELECT format, content, generated_at FROM l6_reports WHERE subject_id=? ORDER BY generated_at DESC').all(subjectId) as Array<{ format: string; content: string; generated_at: string }>;
}

// ── 查询辅助 ──────────────────────────────────

/** 检查某层是否已有缓存 */
export function hasLayerCache(db: BetterSqlite3.Database, subjectId: number, layer: string): boolean {
  const tables: Record<string, string> = { L2: 'l2_charts', L3: 'l3_scores', L4: 'l4_analyses', L5: 'l5_specialties' };
  const table = tables[layer];
  if (!table) return false;
  const row = db.prepare(`SELECT 1 FROM ${table} WHERE subject_id=?`).get(subjectId);
  return !!row;
}
