// 생활 안내 — 숙소 구역의 쓰레기 배출(전국생활쓰레기배출정보표준데이터), 가까운 주민센터 · 지구대 · 파출소, 와이파이, 공중화장실
const { load, km, stayById, send } = require('./_lib/data');

const near = (list, stay, n) => list
  .filter(x => x.lat != null && x.lng != null)
  .map(x => ({ ...x, distanceKm: Math.round(km(stay.lat, stay.lng, x.lat, x.lng) * 100) / 100 }))
  .sort((a, b) => a.distanceKm - b.distanceKm)
  .slice(0, n);

module.exports = async (req, res) => {
  const stay = stayById((req.query || {}).stay);
  // 구역 짝짓기: 숙소의 동 이름이 「관리구역 대상 지역」에 들어 있는 구역 (예: 삼선동 → 2권역, 성북동 → 1권역)
  // 동 이름이 정확히 같은 구역이 있으면 그것만 쓴다 (성북동 ↔ 성북동1가처럼 요일이 다른 구역이 둘 나와 관광객이 고를 수 없게 되는 것을 막는다)
  const seen = new Set();
  const all = load('garbage');
  const exact = all.filter(g => g.areas.split('+').some(a => a === stay.dong));
  const garbage = (exact.length ? exact : all.filter(g => g.areas.split('+').some(a => a.startsWith(stay.dong))))
    .filter(g => { const k = g.zone + g.days + g.start; if (seen.has(k)) return false; seen.add(k); return true; });
  const center = near(load('centers'), stay, 2);
  send(res, 200, {
    ok: true, stay: stay.id, dong: stay.dong, garbage, centers: center,
    // 지구대 · 파출소는 주소만 있고 좌표가 없다 → 성북구 안 10곳을 모두 보여 준다
    police: load('police'),
    wifi: near(load('wifi'), stay, 3),
    toilets: near(load('toilets'), stay, 3),
  });
};
