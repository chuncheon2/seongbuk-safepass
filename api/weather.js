// 오늘의 비 예보 — 기상청 단기예보 (공공데이터포털, DATA_GO_KR_KEY). 성북구 격자 nx 60 · ny 127(질문지 기준). 1시간 캐시.
const { cached, serviceKey, getJson, dataGoError } = require('./_lib/http');
const { kst, send } = require('./_lib/data');

const NX = 60, NY = 127;
const BASES = [2, 5, 8, 11, 14, 17, 20, 23];
const PTY = { 0: 'none', 1: 'rain', 2: 'sleet', 3: 'snow', 4: 'shower' };
// 연결이 안 될 때의 「시연 값」 — 실제 예보가 아니다
const DEMO = { rain: false, maxPop: 20, temp: { min: 4, max: 11 }, hours: [], rainHours: [] };

// 발표 시각: 발표 후 약 10분 뒤부터 조회된다
function baseTime() {
  const t = kst(Date.now() - 15 * 60e3);
  const past = BASES.filter(h => h <= t.hour);
  if (!past.length) { const y = kst(Date.now() - 24 * 3600e3 - 15 * 60e3); return { date: y.ymd, time: '2300' }; }
  return { date: t.ymd, time: String(past[past.length - 1]).padStart(2, '0') + '00' };
}

async function load() {
  const key = serviceKey();
  if (!key) return { ok: false, reason: '키 비어 있음', demo: DEMO };
  const b = baseTime();
  const url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${key}&dataType=JSON&numOfRows=1000&pageNo=1&base_date=${b.date}&base_time=${b.time}&nx=${NX}&ny=${NY}`;
  const r = await getJson(url, { timeoutMs: 10000 });
  if (!r.ok) return { ok: false, reason: r.reason, demo: DEMO };
  const err = dataGoError(r.json);
  if (err && err !== 'NORMAL_SERVICE') return { ok: false, reason: /SERVICE KEY|UNREGISTERED|등록/i.test(err) ? '승인 안 됨' : err, demo: DEMO };
  const items = r.json.response?.body?.items?.item || [];
  const today = kst().ymd;
  const by = {};
  let tmn = null, tmx = null;
  for (const i of items) {
    if (i.fcstDate !== today) continue;
    if (i.category === 'TMN') tmn = parseFloat(i.fcstValue);
    if (i.category === 'TMX') tmx = parseFloat(i.fcstValue);
    (by[i.fcstTime] = by[i.fcstTime] || {})[i.category] = i.fcstValue;
  }
  const hours = Object.keys(by).sort().map(t => ({
    time: t.slice(0, 2) + ':00', temp: parseFloat(by[t].TMP), pop: parseInt(by[t].POP, 10) || 0, pty: PTY[by[t].PTY] || 'none', pcp: by[t].PCP || '강수없음',
  }));
  if (!hours.length) return { ok: false, reason: '오늘 예보 자료 없음', demo: DEMO };
  // 강수확률 60% 이상이거나 비 · 눈이 예보된 시간 (질문지 기준)
  const rainHours = hours.filter(h => h.pop >= 60 || h.pty !== 'none').map(h => h.time);
  const temps = hours.map(h => h.temp).filter(Number.isFinite);
  return {
    ok: true, live: true, base: b, hours, rainHours, rain: rainHours.length > 0,
    maxPop: Math.max(...hours.map(h => h.pop)),
    temp: { min: tmn ?? Math.min(...temps), max: tmx ?? Math.max(...temps) },
    // 오후 발표본에는 하루 최저·최고(TMN·TMX)가 없어서 「남은 시간」의 값이 된다 — 화면에 그렇다고 알린다
    tempScope: tmn !== null && tmx !== null ? 'day' : 'remaining',
  };
}

module.exports = async (req, res) => {
  const out = await cached('weather:' + baseTime().date + baseTime().time, 3600e3, load);
  send(res, 200, out.ok ? out : { ...out, live: false });
};
