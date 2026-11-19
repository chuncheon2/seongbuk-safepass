// data/*.json 읽기 + 거리 계산 + 한국 시간
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const memo = {};
function load(name) {
  if (!memo[name]) memo[name] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, name + '.json'), 'utf8'));
  return memo[name];
}

// 두 지점 사이 거리(km)
function km(lat1, lng1, lat2, lng2) {
  const r = x => x * Math.PI / 180;
  const h = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// 한국 시간(UTC+9)의 지금: { ymd:'20261119', iso:'2026-11-19', hour, minute, dow(0=일) }
function kst(now = Date.now()) {
  const d = new Date(now + 9 * 3600e3);
  const iso = d.toISOString().slice(0, 10);
  return { iso, ymd: iso.replace(/-/g, ''), hour: d.getUTCHours(), minute: d.getUTCMinutes(), dow: d.getUTCDay(), date: d };
}

function stayById(id) {
  const stays = load('stays');
  return stays.find(s => s.id === String(id || '').toUpperCase()) || stays[0];
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

module.exports = { load, km, kst, stayById, send };
