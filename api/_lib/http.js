// 공공 API 호출 공통 — 키는 .env 에서만 읽고, 실패하면 이유를 분류해서 돌려 준다
const cache = new Map();

// 메모리 캐시: 같은 서버가 살아 있는 동안만 쓴다 (Vercel 은 인스턴스마다 따로)
async function cached(key, ttlMs, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return { ...hit.value, cached: true };
  const value = await loader();
  // 실패 결과(시연 값)는 오래 붙잡지 않는다
  if (value && value.ok) cache.set(key, { at: Date.now(), value });
  return value;
}

// 공공데이터포털 키: Encoding 키(%2B 같은 퍼센트 부호 포함)든 Decoding 키든 둘 다 받는다
function serviceKey() {
  const raw = (process.env.DATA_GO_KR_KEY || '').trim();
  if (!raw) return '';
  let decoded = raw;
  if (/%[0-9A-Fa-f]{2}/.test(raw)) {
    try { decoded = decodeURIComponent(raw); } catch { decoded = raw; }
  }
  return encodeURIComponent(decoded);
}

// .env 의 서비스 이름 · 주소: http 로 시작하면 주소, 아니면 서비스 이름으로 본다
function envValue(name) {
  return (process.env[name] || '').trim();
}

function classify(err, status, bodyText) {
  if (err && (err.name === 'TimeoutError' || err.name === 'AbortError')) return '시간 초과';
  if (status === 401 || status === 403) return '승인 안 됨';
  const t = String(bodyText || '');
  if (/SERVICE[_ ]KEY[_ ]IS[_ ]NOT[_ ]REGISTERED|UNREGISTERED|SERVICE ACCESS DENIED|APPLICATION[_ ]ERROR|승인|등록되지/i.test(t)) return '승인 안 됨';
  if (/LIMITED[_ ]NUMBER|REQUEST[_ ]LIMIT/i.test(t)) return '호출 한도 초과';
  if (err) return '연결 오류: ' + (err.message || err);
  if (status && status >= 400) return `응답 오류 ${status}`;
  return '응답 형식 오류';
}

async function getJson(url, { timeoutMs = 8000, headers = {} } = {}) {
  let status = 0, text = '';
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'SeongbukSafePass', ...headers }, signal: AbortSignal.timeout(timeoutMs) });
    status = r.status;
    text = await r.text();
    if (!r.ok) return { ok: false, reason: classify(null, status, text) };
    try { return { ok: true, json: JSON.parse(text) }; }
    catch { return { ok: false, reason: classify(null, status, text) }; }
  } catch (err) {
    return { ok: false, reason: classify(err, status, text) };
  }
}

// 응답 본문 맨 위에 오류가 들어 있는 공공데이터포털 형식을 확인한다
function dataGoError(json) {
  const h = json && json.response && json.response.header;
  if (h && h.resultCode && h.resultCode !== '00' && h.resultCode !== '0000') return h.resultMsg || h.resultCode;
  if (json && json.resultCode && json.resultCode !== '00') return json.resultMsg || json.resultCode;
  return '';
}

module.exports = { cached, serviceKey, envValue, getJson, classify, dataGoError };
