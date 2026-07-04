const express = require('express');
const app = express();

app.set('trust proxy', true);

const logs = [];

app.use((req, res, next) => {
  if (req.path === '/dashboard') return next();

  logs.push({
    time: new Date().toISOString(),
    ip: req.ip,
    url: req.originalUrl,
    userAgent: req.get('User-Agent') || '',
    referer: req.get('Referer') || '',
  });
  next();
});

app.get('/', (req, res) => {
  res.send('<h1>접속되었습니다</h1>');
});

app.get('/dashboard', (req, res) => {
  const total = logs.length;
  const uniqueIps = new Set(logs.map(l => l.ip)).size;

  const rows = logs.slice().reverse().map(l =>
    `<tr><td>${l.time}</td><td>${l.ip}</td><td>${l.url}</td><td>${l.userAgent}</td></tr>`
  ).join('');

  res.send(`
    <h2>접속 통계</h2>
    <p>총 접속: ${total}회 &nbsp; 고유 IP: ${uniqueIps}개</p>
    <table border="1" cellpadding="6">
      <tr><th>시각</th><th>IP</th><th>경로</th><th>브라우저</th></tr>
      ${rows}
    </table>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('listening on ' + PORT));
