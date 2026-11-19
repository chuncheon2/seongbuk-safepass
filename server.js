// 로컬 실행: node --env-file=.env server.js  →  http://localhost:3000
// public 폴더의 화면과 /api/* 를 한 서버로 띄운다. (Vercel 에서는 이 파일 없이 vercel.json 과 api 폴더만 쓴다)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) {
      const name = url.pathname.slice(5).replace(/[^a-z0-9]/gi, '');
      const file = path.join(__dirname, 'api', name + '.js');
      if (!name || name.startsWith('_') || !fs.existsSync(file)) { res.statusCode = 404; return res.end('{"ok":false,"reason":"없는 API"}'); }
      req.query = Object.fromEntries(url.searchParams);
      return await require(file)(req, res);
    }
    let p = decodeURIComponent(url.pathname);
    if (p === '/') p = '/index.html';
    const full = path.normalize(path.join(PUBLIC, p));
    if (!full.startsWith(PUBLIC) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.statusCode = 404; return res.end('Not found'); }
    res.setHeader('Content-Type', TYPES[path.extname(full)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    fs.createReadStream(full).pipe(res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) { res.statusCode = 500; res.setHeader('Content-Type', 'application/json; charset=utf-8'); }
    res.end(JSON.stringify({ ok: false, reason: '서버 오류' }));
  }
}).listen(PORT, () => console.log(`성북 세이프패스: http://localhost:${PORT}`));
