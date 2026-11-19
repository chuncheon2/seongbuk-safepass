// 추천 이유 쓰기 — AI 는 설명 문장만 쓴다. 장소 이름 · 거리 · 수치는 서버가 직접 넣어 주고 AI 가 바꾸지 못하게 한다. 1시간 캐시.
const { cached } = require('./_lib/http');
const { askAI } = require('./_lib/ai');
const { load, km, stayById, send } = require('./_lib/data');

const LANG = { en: 'English', zh: 'Simplified Chinese', ja: 'Japanese' };

module.exports = async (req, res) => {
  const q = req.query || {};
  const lang = LANG[q.lang] ? q.lang : 'en';
  const stay = stayById(q.stay);
  const bad = q.bad === '1';
  const reasonKey = ['rain', 'dust', 'both', 'fine'].includes(q.why) ? q.why : 'fine';
  const top = load('places')
    .filter(p => p.lat != null)
    .map(p => ({ p, d: km(stay.lat, stay.lng, p.lat, p.lng) }))
    .sort((a, b) => (bad && a.p.indoor !== b.p.indoor ? (b.p.indoor === true) - (a.p.indoor === true) : a.d - b.d))
    .slice(0, 3)
    .map(x => `${x.p.name[lang] || x.p.name.ko} (${x.p.indoor ? 'indoor' : 'outdoor'}, ${x.d.toFixed(1)} km${x.p.outsideSeongbuk ? ', outside Seongbuk-gu' : ''})`);
  const key = `reason:${stay.id}:${lang}:${bad}:${reasonKey}`;
  const out = await cached(key, 3600e3, async () => {
    const r = await askAI({
      system: `You write a short recommendation for a foreign tourist. Write at most 2 short sentences in ${LANG[lang]}. Use ONLY the facts given (today's condition and the place list). Do not invent opening hours, prices or other facts. Do not change the place names or distances. Plain text only.`,
      user: `Today's condition: ${{ rain: 'rain is expected', dust: 'fine dust is bad', both: 'rain is expected and fine dust is bad', fine: 'weather and air are fine' }[reasonKey]}.\nPlaces near the guest's lodging, in the order they are shown: ${top.join('; ')}.\n${bad ? 'Because of today\'s condition the indoor places are listed first. Say that.' : 'Today is fine, so the list is simply ordered by distance from the lodging. Say that the nearest places come first and today is good for walking. Do not say indoor places come first.'}\nMention only the first one or two places by name.`,
      maxTokens: 220, timeoutMs: 20000,
    });
    // 실패 원문은 서버 기록에만 남긴다 (브라우저로 내보내지 않는다)
    if (r.tried && r.tried.length) console.warn('[reason AI 실패]', JSON.stringify(r.tried));
    return r.ok ? { ok: true, text: r.text, provider: r.provider, model: r.model } : { ok: false, reason: 'AI 를 쓸 수 없습니다' };
  });
  send(res, 200, out);
};
