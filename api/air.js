// 오늘의 미세먼지 — 한국환경공단 에어코리아 (공공데이터포털, DATA_GO_KR_KEY). 실시간 호출, 1시간 캐시.
const { cached, serviceKey, getJson, dataGoError } = require('./_lib/http');
const { send } = require('./_lib/data');

const STATION = '성북구'; // 측정소 이름은 질문지 기준 (확인 필요)
const GRADES = ['좋음', '보통', '나쁨', '매우나쁨'];
const g10 = v => (v <= 30 ? 1 : v <= 80 ? 2 : v <= 150 ? 3 : 4);
const g25 = v => (v <= 15 ? 1 : v <= 35 ? 2 : v <= 75 ? 3 : 4);
const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };

// 연결이 안 될 때 화면에 보이는 「시연 값」 — 실제 측정값이 아니다
const DEMO = { pm10: 45, pm25: 20, grade: 2, gradeText: GRADES[1], bad: false, dataTime: null, station: STATION };

async function load() {
  const key = serviceKey();
  if (!key) return { ok: false, reason: '키 비어 있음', demo: DEMO };
  const url = `http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?serviceKey=${key}&returnType=json&numOfRows=24&pageNo=1&stationName=${encodeURIComponent(STATION)}&dataTerm=DAILY&ver=1.3`;
  const r = await getJson(url);
  if (!r.ok) return { ok: false, reason: r.reason, demo: DEMO };
  const err = dataGoError(r.json);
  if (err) return { ok: false, reason: /SERVICE KEY|UNREGISTERED|등록/i.test(err) ? '승인 안 됨' : err, demo: DEMO };
  const items = r.json.response?.body?.items || [];
  // 가장 최근 측정값(숫자가 있는 첫 줄). 측정 장비 통신장애 줄은 건너뛴다
  const row = items.find(i => num(i.pm10Value) !== null || num(i.pm25Value) !== null);
  if (!row) return { ok: false, reason: '최근 측정값 없음(측정소 통신장애)', demo: DEMO };
  const pm10 = num(row.pm10Value), pm25 = num(row.pm25Value);
  const grade = Math.max(pm10 !== null ? g10(pm10) : 1, pm25 !== null ? g25(pm25) : 1);
  return { ok: true, live: true, station: row.stationName || STATION, dataTime: row.dataTime, pm10, pm25, grade, gradeText: GRADES[grade - 1], bad: grade >= 3 };
}

module.exports = async (req, res) => {
  const out = await cached('air', 3600e3, load);
  send(res, 200, out.ok ? out : { ...out, live: false });
};
