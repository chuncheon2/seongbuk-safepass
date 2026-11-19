// 먹거리 — 백년가게(소상공인시장진흥공단) · 서울 오래가게. 좌표가 없어서 「같은 동」을 먼저 보여 준다.
const { load, stayById, send } = require('./_lib/data');

module.exports = async (req, res) => {
  const stay = stayById((req.query || {}).stay);
  const rows = load('food').map(f => ({ ...f, sameDong: !!(f.addr && f.addr.includes(stay.dong.replace('동', ''))) }));
  rows.sort((a, b) => (b.sameDong - a.sameDong));
  send(res, 200, { ok: true, stay: stay.id, dong: stay.dong, rows });
};
