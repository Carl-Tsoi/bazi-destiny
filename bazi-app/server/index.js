const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const { spawn } = require('child_process');
const app = express();
app.use(express.json());

const DB_PATH = path.join(__dirname, '..', '..', 'bazi-destiny.db');
const CLI_PATH = path.join(__dirname, '..', '..', 'packages', 'cli', 'src', 'index.ts');

function getDb() { return new Database(DB_PATH); }

app.get('/api/subjects', (req, res) => {
  const db = getDb(); const q = req.query.q || '';
  const rows = q
    ? db.prepare('SELECT s.*, l2.day_gan, l2.day_zhi, l2.pattern, l4.yong_shen, l5.grade FROM subjects s LEFT JOIN l2_charts l2 ON s.id=l2.subject_id LEFT JOIN l4_analyses l4 ON s.id=l4.subject_id LEFT JOIN l5_specialties l5 ON s.id=l5.subject_id WHERE s.name LIKE ? ORDER BY s.id DESC').all('%'+q+'%')
    : db.prepare('SELECT s.*, l2.day_gan, l2.day_zhi, l2.pattern, l4.yong_shen, l5.grade FROM subjects s LEFT JOIN l2_charts l2 ON s.id=l2.subject_id LEFT JOIN l4_analyses l4 ON s.id=l4.subject_id LEFT JOIN l5_specialties l5 ON s.id=l5.subject_id ORDER BY s.id DESC LIMIT 50').all();
  const result = rows.map(r => ({ id: r.id, name: r.name, gender: r.gender, datetime: r.datetime, dayGan: r.day_gan||'', dayZhi: r.day_zhi||'', pattern: r.pattern||'', yongShen: r.yong_shen||'', grade: r.grade||'', hasReport: !!r.grade }));
  db.close(); res.json(result);
});

app.get('/api/subjects/:id', (req, res) => {
  const db = getDb();
  const s = db.prepare('SELECT * FROM subjects WHERE id=?').get(req.params.id);
  if (!s) { db.close(); return res.status(404).json({ error: 'Not found' }); }
  const l2 = db.prepare('SELECT * FROM l2_charts WHERE subject_id=?').get(s.id);
  const l3 = db.prepare('SELECT * FROM l3_scores WHERE subject_id=?').get(s.id);
  const l4 = db.prepare('SELECT * FROM l4_analyses WHERE subject_id=?').get(s.id);
  const l5 = db.prepare('SELECT * FROM l5_specialties WHERE subject_id=?').get(s.id);
  db.close();
  res.json({ id: s.id, name: s.name, gender: s.gender, datetime: s.datetime,
    l2: l2 ? { dayGan: l2.day_gan, dayZhi: l2.day_zhi, pattern: l2.pattern, monthZhi: l2.month_zhi, startAge: l2.start_age, direction: l2.direction, pillars: JSON.parse(l2.pillars_json||'{}') } : null,
    l3: l3 ? { dayStrength: l3.day_strength, dayScore: l3.day_score, ziDang: l3.zi_dang, yiDang: l3.yi_dang, elementScores: JSON.parse(l3.element_scores_json||'{}') } : null,
    l4: l4 ? { yongShen: l4.yong_shen, xiShen: JSON.parse(l4.xi_shen_json||'[]'), jiShen: JSON.parse(l4.ji_shen_json||'[]'), engines: JSON.parse(l4.engines_json||'[]') } : null,
    l5: l5 ? { grade: l5.grade, summary: l5.summary } : null,
  });
});

app.post('/api/subjects', async (req, res) => {
  const { name, gender, datetime } = req.body;
  if (!name || !gender || !datetime) return res.status(400).json({ error: 'name/gender/datetime required' });
  try {
    const dt = datetime.replace('T',' ').replace('  ',' ');
    const child = spawn('npx', ['tsx', CLI_PATH, dt, '--gender', gender, '--name', name, '--report'], { cwd: path.join(__dirname,'..','..'), env: {...process.env}, timeout: 120000 });
    let out='', err='';
    child.stdout.on('data',d=>out+=d); child.stderr.on('data',d=>err+=d);
    await new Promise((resolve,reject) => child.on('close',code=>code===0?resolve():reject(new Error(err||'CLI failed'))));
    const db = getDb(); const s2 = db.prepare('SELECT id FROM subjects WHERE name=? ORDER BY id DESC LIMIT 1').get(name); db.close();
    res.json({ success: true, subjectId: s2?.id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/subjects/:id/calculate', async (req, res) => {
  const db = getDb(); const s = db.prepare('SELECT * FROM subjects WHERE id=?').get(req.params.id); db.close();
  if (!s) return res.status(404).json({ error: 'Not found' });
  try {
    const dt = (s.datetime||'').replace('T',' ');
    const child = spawn('npx', ['tsx', CLI_PATH, dt, '--gender', s.gender, '--name', s.name, '--report'], { cwd: path.join(__dirname,'..','..'), env: {...process.env}, timeout: 120000 });
    let out='', err='';
    child.stdout.on('data',d=>out+=d); child.stderr.on('data',d=>err+=d);
    await new Promise((resolve,reject) => child.on('close',code=>code===0?resolve():reject(new Error(err||'CLI failed'))));
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/subjects/:id/report', (req, res) => {
  const db = getDb();
  const row = db.prepare("SELECT content FROM l6_reports WHERE subject_id=? AND format='md' ORDER BY generated_at DESC LIMIT 1").get(req.params.id);
  db.close();
  if (!row) return res.status(404).json({ error: 'No report' });
  res.type('text/markdown').send(row.content);
});

app.get('/api/stats', (req, res) => {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as c FROM subjects').get().c;
  const withReport = db.prepare('SELECT COUNT(DISTINCT subject_id) as c FROM l6_reports').get().c;
  const strength = db.prepare("SELECT day_strength, COUNT(*) as c FROM l3_scores GROUP BY day_strength").all();
  const grades = db.prepare("SELECT grade, COUNT(*) as c FROM l5_specialties GROUP BY grade").all();
  db.close();
  res.json({ total, withReport, strength, grades });
});

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => console.log('Bazi API on http://localhost:'+PORT));
