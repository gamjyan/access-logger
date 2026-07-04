const express = require('express');
const { Pool } = require('pg');
const app = express();

app.set('trust proxy', true);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.query(`CREATE TABLE IF NOT EXISTS logs (id SERIAL PRIMARY KEY, time TIMESTAMPTZ DEFAULT NOW(), ip TEXT, url TEXT, user_agent TEXT, referer TEXT)`).catch(err => console.error('table error', err));

app.use(async (req, res, next) => {
  if (req.path === '/dashboard') return next();
  try {
    await pool.query('INSERT INTO logs (ip, url, user_agent, referer) VALUES ($1, $2, $3, $4)', [req.ip, req.originalUrl, req.get('User-Agent') || '', req.get('Referer') || '']);
  } catch (err) {
    console.error('insert error', err);
  }
  next();
});

app.get('/', (req, res) => {
  res.send('<h1>접속되었습니다</h1>');
});

app.get('/dashboard', async (req, res) => {
  if (req.query.key !== process.env.DASHBOARD_KEY) {
    return res.status(401).send('접근 권한이 없습니다');
  }
  try {
    const result = await pool.query('SELECT * FROM logs ORDER BY time DESC');
    const logs = result.rows;
    const total = logs.length;
    const uniqueIps = new Set(logs.map(l => l.ip)).size;
    const rows = logs.map(l => `<tr><td>${new Date(l.time).toLocaleString()}</td><td>${l.ip}</td><td>${l.url}</td><td>${l.user_agent}</td></tr>`).join('');
    res.send(`<h2>접속 통계</h2><p>총 접속: ${total}회 고유 IP: ${uniqueIps}개</p><table border="1" cellpadding="6"><tr><th>시각</th><th>IP</th><th>경로</th><th>브라우저</th></tr>${rows}</table>`);
  } catch (err) {
    res.send('DB 오류: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('listening on ' + PORT));
