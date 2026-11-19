// AI 호출: CLAUDE_API_KEY → GROQ_API_KEY → GEMINI_API_KEY 순서. 앞이 실패하면(키 비어 있음 · 오류 · 시간 초과) 다음으로 넘어가고,
// 어느 AI 가 답했는지(provider · model)와 앞에서 실패한 이유(tried)를 함께 돌려 준다.
// 모델 이름은 2026-11-19 에 각 키로 모델 목록을 조회해서 정했다 (바꾸려면 AI_MODEL_CLAUDE · AI_MODEL_GROQ · AI_MODEL_GEMINI).

const PROVIDERS = [
  {
    name: 'claude', keyName: 'CLAUDE_API_KEY', model: () => process.env.AI_MODEL_CLAUDE || 'claude-haiku-5-5',
    async call({ key, model, system, user, maxTokens, signal }) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal,
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(`${r.status} ${j.error?.message || ''}`.trim());
      return (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim();
    },
  },
  {
    name: 'groq', keyName: 'GROQ_API_KEY', model: () => process.env.AI_MODEL_GROQ || 'openai/gpt-oss-120b',
    async call({ key, model, system, user, maxTokens, signal }) {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', signal,
        headers: { Authorization: 'Bearer ' + key, 'content-type': 'application/json' },
        body: JSON.stringify({
          model, max_completion_tokens: maxTokens + 800, reasoning_effort: 'low',
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(`${r.status} ${j.error?.message || ''}`.trim());
      return (j.choices?.[0]?.message?.content || '').trim();
    },
  },
  {
    name: 'gemini', keyName: 'GEMINI_API_KEY', model: () => process.env.AI_MODEL_GEMINI || 'gemini-3.1-flash-lite',
    async call({ key, model, system, user, maxTokens, signal }) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', signal,
        headers: { 'x-goog-api-key': key, 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { maxOutputTokens: maxTokens, thinkingConfig: { thinkingBudget: 0 } },
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(`${r.status} ${j.error?.message || ''}`.trim());
      return (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    },
  },
];

function short(msg) { return String(msg).replace(/\s+/g, ' ').slice(0, 160); }

async function askAI({ system, user, maxTokens = 700, timeoutMs = 20000 }) {
  const tried = [];
  for (const p of PROVIDERS) {
    const key = (process.env[p.keyName] || '').trim();
    if (!key) { tried.push({ provider: p.name, reason: '키 비어 있음' }); continue; }
    const model = p.model();
    try {
      const text = await p.call({ key, model, system, user, maxTokens, signal: AbortSignal.timeout(timeoutMs) });
      if (!text) throw new Error('빈 답');
      return { ok: true, text, provider: p.name, model, tried };
    } catch (err) {
      const reason = (err.name === 'TimeoutError' || err.name === 'AbortError') ? '시간 초과' : short(err.message);
      tried.push({ provider: p.name, model, reason });
    }
  }
  return { ok: false, text: '', provider: null, tried };
}

module.exports = { askAI, PROVIDERS };
