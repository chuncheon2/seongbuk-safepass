// QR 숙소 목록(시연용 가상 숙소 2곳) + 자료를 마지막으로 받은 날
const { load, send } = require('./_lib/data');
module.exports = async (req, res) => {
  let builtAt = '';
  try { builtAt = load('meta').builtAt || ''; } catch { /* meta.json 이 없으면 비워 둔다 */ }
  send(res, 200, { ok: true, stays: load('stays'), builtAt });
};
