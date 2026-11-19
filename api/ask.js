// 질문하기 — docs/답변참고문서/청킹 에 있는 내용으로만 답한다.
// 1단계: AI 가 질문의 언어를 알아내고 한국어 검색어를 만든다  2단계: 청킹 조각을 찾아 AI 가 그 안에서만 답한다 (근거 문서 이름을 붙인다)
// 근거가 없으면 AI 를 부르지 않고 「자료 없음 + 1330 · 120」 고정 문장을 질문한 언어로 보여 준다.
const fs = require('fs');
const path = require('path');
const { askAI } = require('./_lib/ai');
const { load, send } = require('./_lib/data');

const CHUNK_DIR = path.join(__dirname, '..', 'docs', '답변참고문서', '청킹');
let chunks = null;
function loadChunks() {
  if (chunks) return chunks;
  chunks = fs.readdirSync(CHUNK_DIR).filter(f => f.endsWith('.md')).map(f => {
    const m = f.match(/^(.*?)_(\d{2,3})_(.*)\.md$/);
    const text = fs.readFileSync(path.join(CHUNK_DIR, f), 'utf8').replace(/^﻿/, '');
    return { file: f, doc: m ? m[1] : f.replace(/\.md$/, ''), part: m ? m[3] : '', text, hay: (f + '\n' + text) };
  });
  return chunks;
}

const NO_DATA = {
  ko: '문서에서 확인되지 않는 내용입니다. 1330 관광통역안내(24시간, 다국어) 또는 120 다산콜센터로 문의해 주세요.',
  en: 'I could not find this in the documents. Please call 1330 Korea Travel Hotline (24 hours, multilingual) or 120 Dasan Call Center.',
  zh: '文件中没有查到这个内容。请拨打 1330 旅游翻译热线（24小时，多语言）或 120 茶山呼叫中心咨询。',
  ja: '資料では確認できませんでした。1330 観光通訳案内（24時間・多言語）または 120 タサン・コールセンターへお問い合わせください。',
};
// 날씨 · 미세먼지 · 이번 주 행사 · 가까운 관광지 · 쓰레기 배출은 AI 가 아니라 화면이 원래 데이터를 보여 준다 (2026-11-12 팀 결정)
const MENU = {
  weather: { ko: '오늘의 안전 알림', en: 'Today\'s safety alert', zh: '今日安全提醒', ja: '今日の安全アラート' },
  air: { ko: '오늘의 안전 알림', en: 'Today\'s safety alert', zh: '今日安全提醒', ja: '今日の安全アラート' },
  events: { ko: '이번 주 행사', en: 'Events this week', zh: '本周活动', ja: '今週のイベント' },
  places: { ko: '가까운 관광지', en: 'Nearby sights', zh: '附近景点', ja: '近くの観光地' },
  trash: { ko: '생활 안내', en: 'Living guide', zh: '生活指南', ja: '生活ガイド' },
};
const SCREEN_TPL = {
  ko: m => `이 정보는 원래 데이터를 그대로 보여 주는 화면의 「${m}」 메뉴에서 확인하세요.`,
  en: m => `This is shown directly from the original data in the "${m}" menu on this page.`,
  zh: m => `这些信息请在本页“${m}”菜单中查看，菜单直接显示原始数据。`,
  ja: m => `この情報は、元のデータをそのまま表示する画面の「${m}」メニューでご覧ください。`,
};
const screenMsg = (kind, lang) => (SCREEN_TPL[lang] || SCREEN_TPL.en)((MENU[kind] || MENU.weather)[lang] || MENU[kind || 'weather'].en);
const pick = (t, lang) => t[lang] || t.en;

function retrieve(keywords, limit = 9) {
  const all = loadChunks();
  const kws = [...new Set(keywords.map(k => String(k).trim()).filter(k => k.length >= 2))].slice(0, 8);
  if (!kws.length) return [];
  const df = kws.map(k => all.reduce((n, c) => n + (c.hay.includes(k) ? 1 : 0), 0));
  const scored = all.map(c => {
    let s = 0;
    kws.forEach((k, i) => {
      if (!df[i]) return;
      const idf = Math.log(all.length / (1 + df[i])) + 0.5;
      const hits = c.hay.split(k).length - 1;
      if (hits) s += idf * (1 + Math.min(hits, 4) * 0.25);
      if (c.file.includes(k)) s += idf; // 문서 · 소제목 이름에 있으면 가산
    });
    return { c, s };
  }).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
  const top = scored.slice(0, limit).map(x => x.c);
  // 조각이 4개 이하인 작은 문서는 한 조각만 걸려도 문서 전체를 같이 준다 (예: 오래가게 문서의 「문서정보」만 걸리는 경우)
  const byDoc = {};
  for (const c of all) (byDoc[c.doc] = byDoc[c.doc] || []).push(c);
  for (const c of [...top]) {
    const sib = byDoc[c.doc];
    if (sib.length <= 4) for (const s of sib) if (!top.includes(s)) top.push(s);
  }
  return top.slice(0, limit + 4);
}

function parseJson(text) {
  const m = String(text || '').match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const ch of req) raw += ch;
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

const AI_DOWN = {
  ko: '지금은 AI를 쓸 수 없습니다. 잠시 뒤에 다시 시도하거나 1330 관광통역안내 · 120 다산콜센터로 문의해 주세요.',
  en: 'The AI helper is not available right now. Please try again later, or call 1330 Korea Travel Hotline or 120 Dasan Call Center.',
  zh: '目前无法使用AI助手。请稍后再试，或拨打 1330 旅游翻译热线、120 茶山呼叫中心。',
  ja: '現在AIをご利用いただけません。しばらくしてからお試しいただくか、1330 観光通訳案内・120 タサン・コールセンターへお問い合わせください。',
};
// AI 가 실패한 이유(원문 오류 · 조직 ID 등)는 서버 기록에만 남기고 브라우저로는 보내지 않는다
const pubAi = a => ({ provider: a.provider || null, model: a.model || null });
function logTried(step, tried) { if (tried && tried.length) console.warn('[ask ' + step + ' AI 실패]', JSON.stringify(tried)); }

// 호출 제한: 같은 접속 주소(IP)가 1분에 6번, 1시간에 40번까지. AI 키 사용량이 갑자기 늘지 않게 막는다 (서버 메모리 기준)
const hits = new Map();
const LIMIT_MSG = {
  ko: '질문이 너무 많습니다. 잠시 뒤에 다시 물어봐 주세요.',
  en: 'Too many questions in a short time. Please try again in a minute.',
  zh: '短时间内提问过多，请一分钟后再试。',
  ja: '短時間に質問が多すぎます。しばらくしてからもう一度お試しください。',
};
function limited(req) {
  const ip = String((req.headers && (req.headers['x-forwarded-for'] || '')) || (req.socket && req.socket.remoteAddress) || 'local').split(',')[0].trim();
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 3600e3);
  const lastMinute = list.filter(t => now - t < 60e3).length;
  if (lastMinute >= 6 || list.length >= 40) { hits.set(ip, list); return true; }
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < 3600e3)) hits.delete(k);
  return false;
}

module.exports = async (req, res) => {
  const body = req.method === 'POST' ? await readBody(req) : (req.query || {});
  const question = String(body.q || '').trim().slice(0, 300);
  const uiLang = ['ko', 'en', 'zh', 'ja'].includes(body.lang) ? body.lang : 'en';
  if (!question) return send(res, 400, { ok: false, reason: '질문이 비어 있습니다' });
  if (limited(req)) return send(res, 429, { ok: false, kind: 'limited', reason: '호출 제한', answer: pick(LIMIT_MSG, uiLang), lang: uiLang, sources: [] });

  // 1단계: 언어 · 한국어 검색어
  // 관광지 이름 사전: 데이터(places.json)에 있는 공식 이름을 AI 에게 알려 줘서 중국어 · 일본어 이름도 한국어로 바르게 바꾸게 한다
  const glossary = load('places').map(p => [p.name.ko, p.name.en, p.name.zh, p.name.ja].filter(Boolean).join(' = ')).join('\n');
  const s1 = await askAI({
    system: `You prepare a search for a Korean document set. Place names (Korean = English = Chinese = Japanese), use the Korean one:\n${glossary}\nOutput ONE JSON object only, no other text:
{"lang":"ko|en|zh|ja|other","ko":"the question translated into Korean","keywords":["4 to 8 Korean nouns for searching, no particles"],"screen":"weather|air|events|places|trash|none"}
The document set contains: 성북구청 관광지 운영 안내(의릉 정릉 숙정문 혜화문 심우장 이태준가옥 최순우옛집 한양도성 길상사, 운영시간·입장료), 서울 오래가게(보헤미안커피하우스 나폴레옹과자점 봉화묵집), 백년가게, 성북구청 생활 안내, 종량제 봉투 판매소, 동주민센터, 지구대 파출소 경찰서, 교통카드 기후동행카드 지하철, 문화재, 문화시설, 축제 안내, 한식 메뉴 외국어 표기, 한양도성 안내, 와이파이, 공중화장실. Use these exact Korean words as keywords when they fit (for example "long-running old local restaurants" -> 오래가게, 백년가게; "subway or transit card" -> 교통카드, 기후동행카드, 지하철).
"screen" is set ONLY when the person asks about the current real-time or screen-data item itself: weather = today's rain/temperature forecast; air = today's air quality / fine dust / whether a mask is needed; events = what events are on this week; places = which attractions are close to their lodging; trash = which day and time the trash is collected at their lodging. Questions about indoor places, opening hours, fees, addresses, police, transit, restaurants or anything else are "none".`,
    user: question, maxTokens: 700, timeoutMs: 25000,
  });
  const p1 = s1.ok ? parseJson(s1.text) : null;
  if (process.env.ASK_DEBUG === '1') console.log('[ask1]', s1.ok, String(s1.text).slice(0, 300), JSON.stringify(s1.tried));
  logTried('1단계', s1.tried);
  // AI 가 안 될 때는 「문서에 없음」이 아니라 「지금 AI 를 쓸 수 없음」이라고 알린다 (서버 장애를 자료 부족으로 오해하지 않게)
  if (!p1) return send(res, 200, { ok: false, kind: 'error', reason: 'AI 를 쓸 수 없습니다', answer: pick(AI_DOWN, uiLang), lang: uiLang, sources: [] });
  // 질문 글자로 언어를 먼저 판단한다 (한자만 있는 일본어 질문을 AI 가 한국어로 오판하는 경우를 막는다)
  const byScript = /[぀-ヿ]/.test(question) ? 'ja' : /[가-힯]/.test(question) ? 'ko' : /[一-鿿]/.test(question) ? 'zh' : /[A-Za-z]/.test(question) ? 'en' : null;
  const lang = byScript || (['ko', 'en', 'zh', 'ja'].includes(p1.lang) ? p1.lang : uiLang);
  const trash = p1.screen === 'trash'; // 쓰레기는 봉투 판매소 같은 문서 내용도 있어서 문서 답에 화면 안내를 덧붙인다
  const withScreen = text => (trash ? `${text}\n\n${screenMsg('trash', lang)}` : text);

  if (p1.screen && p1.screen !== 'none' && !trash) {
    return send(res, 200, { ok: true, kind: 'screen', menu: p1.screen, answer: screenMsg(p1.screen, lang), lang, sources: [], ai: pubAi(s1) });
  }

  const found = retrieve([...(p1.keywords || []), ...String(p1.ko || '').split(/\s+/)]);
  if (process.env.ASK_DEBUG === '1') console.log('[ask]', JSON.stringify({ p1, found: found.map(c => c.file) }));
  if (!found.length) {
    return send(res, 200, { ok: true, kind: 'nodata', menu: trash ? 'trash' : undefined, answer: withScreen(pick(NO_DATA, lang)), lang, sources: [], ai: pubAi(s1) });
  }

  // 2단계: 찾은 조각 안에서만 답한다
  const ctx = found.map((c, i) => `[${i + 1}] ${c.doc} · ${c.part}\n${c.text.slice(0, 1800)}`).join('\n\n---\n\n');
  const langName = { ko: 'Korean', en: 'English', zh: 'Simplified Chinese', ja: 'Japanese' }[lang];
  const s2 = await askAI({
    system: `You answer questions from foreign tourists in Seongbuk-gu, Seoul, using ONLY the numbered documents provided. Rules:
- Write the answer in ${langName}.
- Use only facts that appear in the documents. Never guess, and never add facts from your own knowledge.
- Copy names, addresses, times, prices and numbers exactly as written in the documents.
- If the documents do not contain the answer, set "found" to false and write nothing else in "answer".
- When the question asks for places or items, list every matching item that appears in the documents (not just some), each with the address or detail exactly as written.
- Do not make eligibility decisions or promise anything. Keep the answer under 6 short sentences. Mention when the source says something needs checking.
Output ONE JSON object only: {"found":true|false,"answer":"...","used":[numbers of the documents you used]}`,
    user: `Question: ${question}\nQuestion in Korean: ${p1.ko || ''}\n\nDocuments:\n${ctx}`,
    maxTokens: 1500, timeoutMs: 40000,
  });
  const ai = pubAi({ provider: s2.provider || s1.provider, model: s2.model || s1.model });
  logTried('2단계', s2.tried);
  const p2 = s2.ok ? parseJson(s2.text) : null;
  if (process.env.ASK_DEBUG === '1') console.log('[ask2]', s2.ok, String(s2.text).slice(0, 400), JSON.stringify(s2.tried));
  if (!p2) return send(res, 200, { ok: false, kind: 'error', reason: 'AI 답을 읽지 못했습니다', answer: pick(AI_DOWN, lang), lang, sources: [], ai });
  if (!p2.found || !String(p2.answer || '').trim()) return send(res, 200, { ok: true, kind: 'nodata', menu: trash ? 'trash' : undefined, answer: withScreen(pick(NO_DATA, lang)), lang, sources: [], ai });
  const used = [...new Set((p2.used || []).map(n => found[n - 1]).filter(Boolean))];
  const sources = [...new Set((used.length ? used : found.slice(0, 2)).map(c => c.doc))];
  send(res, 200, { ok: true, kind: 'answer', menu: trash ? 'trash' : undefined, answer: withScreen(String(p2.answer).trim()), lang, sources, ai });
};
