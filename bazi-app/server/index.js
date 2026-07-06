const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const { spawn } = require('child_process');
const { marked } = require('marked');
const { mdToPdf } = require('md-to-pdf');
const fs = require('fs');
const os = require('os');
const app = express();
app.use(express.json());

const DB_PATH = path.join(__dirname, '..', '..', 'bazi-destiny.db');
const CLI_DIR = path.join(__dirname, '..', '..');
const CLI_PATH = path.join(CLI_DIR, 'packages', 'cli', 'src', 'index.ts');

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
    const child = spawn('npx', ['tsx', CLI_PATH, dt, '--gender', gender, '--name', name, '--report'], { cwd: CLI_DIR, env: {...process.env}, timeout: 120000 });
    let err=''; child.stderr.on('data',d=>err+=d);
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
    const child = spawn('npx', ['tsx', CLI_PATH, dt, '--gender', s.gender, '--name', s.name, '--report'], { cwd: CLI_DIR, env: {...process.env}, timeout: 120000 });
    let err=''; child.stderr.on('data',d=>err+=d);
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

app.get('/', (req, res) => {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as c FROM subjects').get().c;
  const withReport = db.prepare('SELECT COUNT(DISTINCT subject_id) as c FROM l6_reports').get().c;
  const subjects = db.prepare("SELECT s.id, s.name, s.gender, s.datetime, l2.day_gan, l2.day_zhi, l2.pattern, l4.yong_shen, l5.grade FROM subjects s LEFT JOIN l2_charts l2 ON s.id=l2.subject_id LEFT JOIN l4_analyses l4 ON s.id=l4.subject_id LEFT JOIN l5_specialties l5 ON s.id=l5.subject_id ORDER BY s.id DESC").all();
  db.close();
  const rows = subjects.map(s => `<tr><td><a href="/report/${s.id}">${s.name||'-'}</a></td><td>${s.gender}</td><td>${(s.datetime||'').replace('T',' ')}</td><td>${s.day_gan||''}${s.day_zhi||''}</td><td>${s.pattern||''}</td><td>${s.yong_shen||''}</td><td>${s.grade||''}</td></tr>`).join('');
  res.type('html').send(`<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>八字命理</title>
<style>body{font-family:'PingFang SC',sans-serif;background:#f5f0eb;color:#333;margin:0;padding:20px}
h1{color:#8b6914;text-align:center} .bar{text-align:center;color:#999;margin-bottom:20px}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)}
th{background:#faf6f0;color:#8b6914;padding:12px;text-align:center;font-size:14px;border-bottom:2px solid #e8d5b0}
td{padding:12px;border-bottom:1px solid #f0e8d8;font-size:14px;text-align:center}
tr:hover{background:#fdfaf5}
a{color:#8b6914;text-decoration:none;font-weight:500} a:hover{text-decoration:underline}
.btns{text-align:center;margin:20px 0}
.btns a{display:inline-block;padding:10px 24px;background:#8b6914;color:#fff;border-radius:8px;margin:0 8px;font-weight:bold;text-decoration:none}
form{background:#fff;padding:20px;border-radius:12px;max-width:500px;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,.06)}
form input,form select{padding:10px;margin:8px 0;border-radius:6px;border:1px solid #e0d5c0;background:#fdfaf5;color:#333;width:100%;box-sizing:border-box}
form button{padding:12px;background:#8b6914;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:bold;width:100%;margin-top:12px;cursor:pointer}
</style></head><body>
<h1>八字命理分析系统</h1>
<p class="bar">命例总数 ${total} · 已生成报告 ${withReport}</p>
<div class="btns"><a href="/new">+ 新增命例</a></div>
<table><thead><tr><th>姓名</th><th>性别</th><th>出生</th><th>日柱</th><th>格局</th><th>用神</th><th>等级</th></tr></thead><tbody>${rows}</tbody></table>
<script>fetch('/api/stats').then(r=>r.json()).then(d=>{document.querySelector('.bar').textContent='命例 '+d.total+' · 报告 '+d.withReport+' · 身强'+d.strength.filter(x=>x.day_strength==='身强')[0]?.c+' 身弱'+d.strength.filter(x=>x.day_strength==='身弱')[0]?.c})</script>
</body></html>`);
});

app.get('/new', (req, res) => {
  res.type('html').send(`<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>新增命例</title>
<style>body{font-family:'PingFang SC',sans-serif;background:#f5f0eb;color:#333;margin:0;padding:20px}
h1{color:#8b6914;text-align:center}a{color:#8b6914}
form{background:#fff;padding:20px;border-radius:12px;max-width:500px;margin:20px auto;box-shadow:0 2px 8px rgba(0,0,0,.06)}
input,select{padding:10px;margin:8px 0;border-radius:6px;border:1px solid #e0d5c0;background:#fdfaf5;color:#333;width:100%;box-sizing:border-box}
button{padding:12px;background:#8b6914;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:bold;width:100%;margin-top:12px;cursor:pointer}
#result{margin-top:16px;padding:12px;border-radius:8px;display:none}
</style></head><body>
<h1>新增命例</h1>
<form id="form"><input name="name" placeholder="姓名" required>
<select name="gender"><option value="M">男</option><option value="F">女</option></select>
<input name="date" type="date" required><input name="time" type="time" value="12:00" required>
<button type="submit">开始排盘</button></form>
<div id="result"></div>
<script>
document.getElementById('form').onsubmit=async e=>{e.preventDefault();
const fd=new FormData(e.target);
const r=document.getElementById('result');r.style.display='block';r.style.background='#1a1a2e';r.textContent='排盘中...';
try{
const res=await fetch('/api/subjects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:fd.get('name'),gender:fd.get('gender'),datetime:fd.get('date')+'T'+fd.get('time')})});
const d=await res.json();
if(d.subjectId){r.style.background='#2a3a1a';r.innerHTML='排盘完成! <a href=\"/report/'+d.subjectId+'\">查看报告</a>';}
else{r.style.background='#3a1a1a';r.textContent='失败: '+JSON.stringify(d);}
}catch(err){r.style.background='#3a1a1a';r.textContent='错误: '+err.message;}
};
</script></body></html>`);
});

app.get('/api/subjects/:id/pdf', async (req, res) => {
  const db = getDb();
  const s = db.prepare('SELECT * FROM subjects WHERE id=?').get(req.params.id);
  const l6 = db.prepare("SELECT content FROM l6_reports WHERE subject_id=? AND format='md' ORDER BY generated_at DESC LIMIT 1").get(req.params.id);
  db.close();
  if (!s || !l6) return res.status(404).send('No report');
  try {
    const pdf = await mdToPdf({ content: l6.content }, {
      pdf_options: { format: 'A4', margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' } },
      launch_options: { args: ['--no-sandbox'] },
    });
    const filename = encodeURIComponent(s.name) + '-bazi-report.pdf';
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` });
    res.send(pdf.content);
  } catch(e) { res.status(500).send('PDF generation failed: '+e.message); }
});

app.get('/report/:id', (req, res) => {
  const db = getDb();
  const s = db.prepare('SELECT * FROM subjects WHERE id=?').get(req.params.id);
  const l6 = db.prepare("SELECT content FROM l6_reports WHERE subject_id=? AND format='md' ORDER BY generated_at DESC LIMIT 1").get(req.params.id);
  db.close();
  if (!s) return res.status(404).send('Not found');
  const html = l6 ? marked.parse(l6.content) : '<p>(暂无报告，请先生成)</p>';
  res.type('html').send(`<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${s.name} · 八字报告</title>
<style>body{font-family:'PingFang SC',sans-serif;background:#f5f0eb;color:#333;margin:0;padding:20px;line-height:1.8}
.nav{margin-bottom:16px}a{color:#8b6914}h1,h2,h3{color:#8b6914}h2{border-bottom:1px solid #e8d5b0;padding-bottom:8px;margin-top:32px}
table{width:100%;border-collapse:collapse;margin:16px 0;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04)}
th{background:#faf6f0;color:#8b6914;padding:10px 14px;text-align:center;font-size:14px;border-bottom:2px solid #e8d5b0}
td{padding:10px 14px;border-bottom:1px solid #f0e8d8;font-size:14px;text-align:center}
blockquote{background:#fdfaf5;border-left:3px solid #8b6914;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0}
code{background:#f0e8d8;padding:2px 6px;border-radius:4px;font-size:13px;color:#8b6914}
pre{background:#fdfaf5;padding:16px;border-radius:8px;overflow-x:auto;border:1px solid #e0d5c0}
hr{border:none;border-top:1px solid #e8d5b0;margin:24px 0}
details{margin:12px 0}summary{color:#8b6914;cursor:pointer}
</style></head><body>
<div class="nav"><a href="/">← 返回列表</a> | <a href="/api/subjects/${s.id}/report">原始MD</a> | <a href="/api/subjects/${s.id}/pdf" target="_blank">📄 下载PDF</a></div>
<div class="report">${html}</div>
</body></html>`);
});

app.listen(PORT, () => console.log('Bazi API http://localhost:'+PORT));
