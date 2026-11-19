// 가까운 관광지 — 숙소(QR) 기준 거리순. 비 · 미세먼지 나쁨(bad=1)이면 실내를 먼저 보여 준다. 위치는 받지 않는다(숙소 좌표만 쓴다).
const { load, km, stayById, send } = require('./_lib/data');

module.exports = async (req, res) => {
  const q = req.query || {};
  const stay = stayById(q.stay);
  const bad = q.bad === '1';
  const list = load('places').map(p => ({
    ...p,
    distanceKm: p.lat != null ? Math.round(km(stay.lat, stay.lng, p.lat, p.lng) * 100) / 100 : null,
  }));
  // 순서: (나쁜 날) 실내 먼저 → 거리 가까운 순 → 좌표 없는 곳은 맨 뒤
  list.sort((a, b) => {
    if (bad && a.indoor !== b.indoor) return (b.indoor === true) - (a.indoor === true);
    const da = a.distanceKm ?? 1e9, db = b.distanceKm ?? 1e9;
    return da - db;
  });
  send(res, 200, { ok: true, stay: stay.id, bad, places: list });
};
