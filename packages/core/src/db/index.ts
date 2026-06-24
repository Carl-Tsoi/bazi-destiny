import Database from 'better-sqlite3';
import type BetterSqlite3 from 'better-sqlite3';

/**
 * Initialize the SQLite database and create tables if they don't exist.
 * Uses WAL mode for better concurrent read performance.
 */
export function initDatabase(dbPath: string): BetterSqlite3.Database {
  const db = new Database(dbPath);

  // WAL mode for concurrent reads
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Birth subjects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      datetime TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timezone TEXT NOT NULL,
      gender TEXT NOT NULL CHECK(gender IN ('M', 'F')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Bazi chart table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bazi_charts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      chart_data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Ziwei chart table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ziwei_charts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      chart_data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Western astrology chart table
  db.exec(`
    CREATE TABLE IF NOT EXISTS astro_charts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      chart_data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  return db;
}
