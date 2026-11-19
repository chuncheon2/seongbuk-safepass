// 이번 주 성북구 행사 — 서울 열린데이터광장 「서울시 문화행사 정보」. 이름 · 기간 · 장소 · 요금은 원래 데이터 그대로.
// 실시간(24시간 캐시)으로 받고, 안 되면 받아 둔 표(data/events.json)를 「시연 값」으로 보여 준다.
const { cached, getJson } = require('./_lib/http');
const { load, kst, send } = require('./_lib/data');

function weekRange() {
  const t = kst();
  const mondayOffset = (t.dow + 6) % 7;
  const start = new Date(t.date.getTime() - mondayOffset * 86400e3).toISOString().slice(0, 10);
  const end = new Date(t.date.getTime() + (6 - mondayOffset) * 86400e3).toISOString().slice(0, 10);
  return { start, end };
}
const toRow = r => ({
  cat: r.CODENAME, title: r.TITLE, place: r.PLACE, start: String(r.STRTDATE).slice(0, 10), end: String(r.END_DATE).slice(0, 10),
  time: r.PRO_TIME, target: r.USE_TRGT, free: r.IS_FREE, fee: r.USE_FEE, url: r.HMPG_ADDR || r.ORG_LINK,
});

async function loadLive() {
  const key = (process.env.seoulOpenDataKey || '').trim();
  if (!key) return { ok: false, reason: '키 비어 있음' };
  const svc = (process.env.seoulCultureEventApi || '').trim() || 'culturalEventInfo';
  let rows = [], a = 1;
  for (let guard = 0; guard < 8; guard++) {
    const r = await getJson(`http://openapi.seoul.go.kr:8088/${encodeURIComponent(key)}/json/${encodeURIComponent(svc)}/${a}/${a + 999}/`, { timeoutMs: 12000 });
    if (!r.ok) return { ok: false, reason: r.reason };
    const part = r.json[svc];
    if (!part) {
      const code = r.json.RESULT?.CODE || '';
      return { ok: false, reason: /INFO-100|ERROR-300|인증/.test(code + (r.json.RESULT?.MESSAGE || '')) ? '승인 안 됨' : (r.json.RESULT?.MESSAGE || '응답 형식 오류') };
    }
    rows = rows.concat(part.row || []);
    if (rows.length >= (part.list_total_count || 0) || !(part.row || []).length) break;
    a += 1000;
  }
  return { ok: true, live: true, rows: rows.filter(r => r.GUNAME === '성북구').map(toRow) };
}

module.exports = async (req, res) => {
  const week = weekRange();
  let src = await cached('events', 24 * 3600e3, loadLive);
  let demo = null;
  if (!src.ok) {
    const f = load('events');
    demo = { reason: src.reason, fetchedAt: f.fetchedAt, source: f.source };
    src = { ok: true, live: false, rows: f.rows };
  }
  let rows = src.rows.filter(r => r.start <= week.end && r.end >= week.start);
  let note = null;
  if (!rows.length && demo) {
    // 받아 둔 표가 오래돼 이번 주에 걸리는 행사가 없을 때: 받은 날 기준 진행 중 · 예정 행사를 보여 주고 그렇다고 알린다
    rows = src.rows.filter(r => r.end >= demo.fetchedAt);
    note = 'stale';
  }
  rows.sort((a, b) => a.start.localeCompare(b.start));
  send(res, 200, { ok: true, live: !!src.live, week, demo, note, rows });
};
