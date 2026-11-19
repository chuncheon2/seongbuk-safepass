// 화면이 보여 줄 자료를 data/*.json 으로 만든다. 실행: node --env-file=.env tools/build-data.js  (team_project 폴더에서)
// - docs/답변참고문서 의 표 · CSV 를 읽는다 (이름 · 주소 · 시간 · 수치는 원래 값 그대로 옮긴다)
// - 관광공사 API 로 관광지 좌표와 공식 외국어 이름을 받는다 (키는 .env 의 DATA_GO_KR_KEY)
// - 공식 외국어 자료가 없는 설명만 AI 가 번역하고, 「reviewed: false」(사람 확인 전)로 표시한다
const fs = require('fs');
const path = require('path');
const { getJson, serviceKey } = require('../api/_lib/http.js');
const { askAI } = require('../api/_lib/ai.js');

const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs', '답변참고문서');
const OUT = path.join(ROOT, 'data');
fs.mkdirSync(OUT, { recursive: true });
const save = (name, data) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 1) + '\n', 'utf8');
const readText = (p) => {
  const b = fs.readFileSync(p);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(b).replace(/^﻿/, ''); }
  catch { return new TextDecoder('euc-kr').decode(b); }
};

function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift();
  return rows.filter(r => r.length > 1).map(r => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] || '').trim()])));
}
function parseMdTable(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().startsWith('|'));
  if (lines.length < 3) return [];
  const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(s => s.trim());
  const head = cells(lines[0]);
  return lines.slice(2).map(l => Object.fromEntries(cells(l).map((v, i) => [head[i], v])));
}
const km = (a, b, c, d) => { const r = x => x * Math.PI / 180; const h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };

// ---------- 가상 숙소 (기획서 7-1: 지어낸 이름 · 주소, 좌표는 대략값) ----------
const stays = [
  { id: 'A', virtual: true, name: { ko: '한성대입구역 근처 게스트하우스', en: 'Guesthouse near Hansung Univ. Station', zh: '汉城大学入口站附近民宿', ja: '漢城大学入口駅近くのゲストハウス' }, dong: '삼선동', lat: 37.5885, lng: 127.0063 },
  { id: 'B', virtual: true, name: { ko: '성북동 한옥 스테이', en: 'Seongbuk-dong Hanok Stay', zh: '城北洞韩屋民宿', ja: '城北洞 韓屋ステイ' }, dong: '성북동', lat: 37.5946, lng: 126.9988 },
];

// ---------- 생활 안내: 쓰레기 배출 / 와이파이 / 화장실 / 주민센터 / 지구대 ----------
function buildLife() {
  const garbageAll = parseCsv(readText(path.join(DOCS, '원본', '생활쓰레기배출정보_서울특별시.csv'))).filter(r => r['시군구명'] === '성북구');
  const garbage = garbageAll.map(r => ({
    zone: r['관리구역명'], areas: r['관리구역대상지역명'], placeType: r['배출장소유형'], place: r['배출장소'],
    method: r['생활쓰레기배출방법'], foodMethod: r['음식물쓰레기배출방법'], recycleMethod: r['재활용품배출방법'],
    days: r['생활쓰레기배출요일'], start: r['생활쓰레기배출시작시각'], end: r['생활쓰레기배출종료시각'],
    foodDays: r['음식물쓰레기배출요일'], foodStart: r['음식물쓰레기배출시작시각'], foodEnd: r['음식물쓰레기배출종료시각'],
    recycleDays: r['재활용품배출요일'], recycleStart: r['재활용품배출시작시각'], recycleEnd: r['재활용품배출종료시각'],
    skipDays: r['미수거일'], dept: r['관리부서명'], phone: r['관리부서전화번호'], baseDate: r['데이터기준일자'],
  }));
  save('garbage.json', garbage);

  const wifi = parseCsv(readText(path.join(DOCS, '원본', '서울시 성북구 공공와이파이 서비스 위치 정보.csv')))
    .map(r => ({ name: r['와이파이명'], addr: r['도로명주소'], inout: r['실내외구분'], lat: +r['X좌표'], lng: +r['Y좌표'] }))
    .filter(r => r.lat > 37 && r.lng > 126);
  save('wifi.json', wifi);

  const toilets = parseCsv(readText(path.join(DOCS, '원본', '서울시 공중화장실 위치정보.csv')))
    .filter(r => (r['구 명칭'] || '') === '성북구' || (r['도로명주소'] || '').includes('성북구'))
    .map(r => ({ name: r['건물명'], addr: r['도로명주소'], open: (r['개방시간'] || '').replace(/\|/g, ' ').trim(), type: (r['유형'] || '').replace(/\|/g, ''), lng: +r['x 좌표'], lat: +r['y 좌표'] }))
    .filter(r => r.lat > 37 && r.lng > 126);
  save('toilets.json', toilets);

  const centersMd = parseMdTable(readText(path.join(DOCS, '청킹전', '성북구_동주민센터현황_2023.md')));
  const centers = centersMd.map(r => ({ name: r['주민센터명'], dong: r['행정동'], addr: r['주소'], phone: r['전화번호'], lat: +r['위도'], lng: +r['경도'] })).filter(r => r.lat > 37);
  save('centers.json', centers);

  const policeMd = readText(path.join(DOCS, '청킹전', '경찰청_전국 지구대 파출소 주소 현황_20251231.md'));
  const police = parseCsv(readText(path.join(DOCS, '원본', '경찰청_전국 지구대 파출소 주소 현황_20251231.csv')))
    .filter(r => (r['주소'] || '').includes('성북구') && /성북|종암/.test(r['경찰서']))
    .map(r => ({ name: r['관서명'], kind: r['구분'], station: r['경찰서'], addr: r['주소'].replace(/\s+/g, ' ') }));
  save('police.json', police);
  return { garbage: garbage.length, wifi: wifi.length, toilets: toilets.length, centers: centers.length, police: police.length, policeMdChars: policeMd.length };
}

// ---------- 먹거리 ----------
function buildFood() {
  const old = ['보헤미안커피하우스', '나폴레옹과자점', '봉화묵집'].map(n => ({ name: n, kind: 'old', source: '서울 오래가게(2020 선정)', note: '영업 여부 확인 필요' }));
  const centuryRows = parseMdTable(readText(path.join(DOCS, '청킹전', '소상공인시장진흥공단_백년가게성북구_2026.md')));
  const century = centuryRows.map(r => ({ name: r['업체명'], addr: r['업체주소'], kind: 'century', source: '소상공인시장진흥공단 백년가게', note: '영업 여부 확인 필요' }));
  // 같은 가게가 두 목록에 있으면 백년가게(주소 있음)를 쓴다
  const names = new Set(century.map(c => c.name));
  const merged = [...century, ...old.filter(o => !names.has(o.name))].map(r => ({ ...r, dong: (r.addr && (r.addr.match(/\(([가-힣]+?)\d?가?[,)]/) || [])[1]) || '' }));
  save('food.json', merged);
  return merged.length;
}

// ---------- 행사 (실시간 호출이 막힐 때 쓰는 받아 둔 표) ----------
function buildEvents() {
  const rows = parseMdTable(readText(path.join(DOCS, '청킹전', '서울시_문화행사정보성북구_2026.md')));
  const ev = rows.map(r => ({ cat: r['분류'], title: r['공연/행사명'], place: r['장소'], start: r['시작일'], end: r['종료일'], time: r['행사시간'], target: r['이용대상'], free: r['유무료'], fee: r['이용요금'], url: r['문화포털상세URL'] }));
  save('events.json', { fetchedAt: '2026-11-05', source: '서울 열린데이터광장 서울시 문화행사 정보(OA-15486)', rows: ev });
  return ev.length;
}

// ---------- 관광지 ----------
const PLACE_DEFS = [
  { id: 'gilsangsa', doc: '길상사', kw: '길상사', en: 'Gilsangsa', zh: '吉祥寺', ja: '吉祥寺', demo: true },
  { id: 'simujang', doc: '심우장', kw: '심우장', en: 'Simujang', demo: true },
  { id: 'choisunu', doc: '최순우 옛집', kw: '최순우', en: "Choi Sun-u's House", demo: true },
  { id: 'hanyang', doc: '한양도성 성북동 구간', kw: null, demo: true, lat: null },
  { id: 'seonjam', doc: null, ko: '성북선잠박물관', kw: '성북선잠박물관', en: 'Seongbuk Seonjam Museum', indoor: true, demo: true },
  { id: 'naksan', doc: null, ko: '낙산공원', kw: '낙산공원', en: 'Naksan Park', zh: '骆山公园', ja: '駱山公園', indoor: false, demo: true },
  { id: 'uireung', doc: '의릉', kw: '의릉' },
  { id: 'jeongneung', doc: '정릉', kw: '정릉' },
  { id: 'sukjeongmun', doc: '숙정문', kw: '숙정문' },
  { id: 'hyehwamun', doc: '혜화문', kw: '혜화문' },
  { id: 'suyeon', doc: '이태준 가옥', kw: '수연산방' },
  { id: 'artmuseum', doc: null, ko: '성북구립미술관', kw: '성북구립미술관', en: 'Seongbuk Museum of Art', indoor: true },
];
const LANG_SVC = { en: 'EngService2', zh: 'ChsService2', ja: 'JpnService2' };

function parseDoc() {
  const t = readText(path.join(DOCS, '청킹전', '성북구청_관광지운영안내_2026.md'));
  const out = {};
  for (const sec of t.split(/\n## /).slice(1)) {
    const lines = sec.split(/\r?\n/);
    const title = lines[0].trim();
    const m = title.match(/^(.*?)\s*\((.*)\)\s*$/);
    const ko = (m ? m[1] : title).trim();
    const f = {};
    for (const l of lines.slice(1)) { const mm = l.match(/^- ([^:]+):\s*(.*)$/); if (mm) f[mm[1].trim()] = mm[2].trim(); }
    if (f['소개'] || f['주소'] || f['운영']) out[ko] = { ko, enRaw: m ? m[2] : '', ...f };
  }
  return out;
}
async function tourSearch(svc, keyword, k) {
  const r = await getJson(`https://apis.data.go.kr/B551011/${svc}/searchKeyword2?serviceKey=${k}&MobileOS=ETC&MobileApp=SafePass&_type=json&numOfRows=8&pageNo=1&keyword=${encodeURIComponent(keyword)}`, { timeoutMs: 15000 });
  if (!r.ok) return [];
  const it = r.json.response?.body?.items?.item;
  return Array.isArray(it) ? it : [];
}
const clean = s => String(s || '').replace(/\s*[（(][가-힣0-9（）()\s]+[）)]\s*$/u, '').trim();

async function buildPlaces() {
  const doc = parseDoc();
  const k = serviceKey();
  const places = [];
  const report = [];
  for (const d of PLACE_DEFS) {
    const dd = d.doc ? doc[d.doc] : null;
    const ko = d.ko || (dd && dd.ko) || d.doc;
    const p = { id: d.id, demo: !!d.demo, name: { ko }, addr: { ko: dd?.['주소'] || null }, hours: dd?.['운영'] || null, fee: dd?.['입장료'] || dd?.['관람료'] || null, phone: dd?.['전화'] || null, site: dd?.['누리집'] || null, intro: { ko: dd?.['소개'] || null }, official: {}, lat: null, lng: null, outsideSeongbuk: false, indoor: null };
    const g = dd?.['구분'] || '';
    p.indoor = d.indoor ?? (g.startsWith('실내') ? true : g.startsWith('실외') ? false : null);
    p.indoorNote = dd ? '구분은 팀이 정한 것(사람 확인 필요)' : (d.indoor !== undefined ? '구분은 팀이 정한 것(사람 확인 필요)' : null);
    // 좌표 · 주소: 관광공사 국문 서비스
    let hit = null;
    if (d.kw) {
      const list = await tourSearch('KorService2', d.kw, k);
      hit = list.find(x => x.mapx && x.title.includes(d.kw.slice(0, 2)) && /성북|종로/.test(x.addr1 || '')) || list.find(x => x.mapx);
    }
    if (d.id === 'hanyang') { // 성북동 구간은 길상사 아래 능선이라 순성길 대표 지점 대신 성북동 구간 좌표를 따로 못 받는다 → 확인 필요
      const l = await tourSearch('KorService2', '서울한양도성 성북동', k);
      hit = l.find(x => /성북/.test(x.addr1 || '') || /성북/.test(x.title)) || null;
    }
    if (hit) { p.lat = +hit.mapy; p.lng = +hit.mapx; p.addr.ko = p.addr.ko || hit.addr1; p.tourId = hit.contentid; if (!dd) p.name.ko = ko; }
    // 주소가 「서울 종로구 …」로 시작하면 성북구 밖이다 (숙정문 · 혜화문은 성북구 경계라 「성북구 밖 · 경계」로 보여 준다)
    p.outsideSeongbuk = !!(p.addr.ko && /^(서울특별시|서울)\s*종로구/.test(p.addr.ko));
    if (p.addr.ko) p.addr.ko = p.addr.ko.replace(/\s*\(성북구 경계[^)]*\)/, '');
    p.boundary = d.id === 'sukjeongmun' || d.id === 'hyehwamun';
    // 영문 이름 (구청 영문 누리집 표기)
    const enDoc = (dd?.enRaw || '').split(/[,·]/).map(s => s.trim()).filter(s => /[A-Za-z]/.test(s)).pop();
    p.name.en = enDoc || d.en || null; p.nameEnBy = enDoc ? '성북구청 영문 누리집' : null;
    // 공식 외국어 자료(관광공사 영 · 중 · 일): 같은 자리(500m 안)에 있는 것만 받는다
    for (const lang of ['en', 'zh', 'ja']) {
      const kw = d[lang]; if (!kw || p.lat == null) continue;
      const list = await tourSearch(LANG_SVC[lang], kw, k);
      const m = list.find(x => x.mapx && km(p.lat, p.lng, +x.mapy, +x.mapx) < 0.5);
      if (m) { p.official[lang] = { title: clean(m.title), addr: m.addr1 || '', contentid: m.contentid }; p.name[lang] = clean(m.title); }
    }
    report.push(`${d.id}: 좌표 ${p.lat != null ? '있음' : '없음'} / 공식 외국어 ${Object.keys(p.official).join(',') || '없음'}`);
    places.push(p);
  }
  // AI: 공식 외국어 자료가 없는 이름 · 설명만 번역한다 (사람 확인 전)
  let prev = [];
  try { prev = JSON.parse(fs.readFileSync(path.join(OUT, 'places.json'), 'utf8')); } catch { /* 처음이면 없음 */ }
  for (const p of places) {
    const need = ['en', 'zh', 'ja'].filter(l => !p.name[l]);
    const text = p.intro.ko || '';
    // 이미 번역해 둔 것(한국어 소개가 같을 때)은 다시 부르지 않는다 — 사람이 고친 번역을 덮어쓰지 않기 위해서다
    const old = prev.find(o => o.id === p.id);
    if (old && old.intro && old.intro.ko === p.intro.ko && ['en', 'zh', 'ja'].every(l => old.intro[l] || !text) && need.every(l => old.name?.[l])) {
      p.intro = old.intro; for (const l of need) p.name[l] = old.name[l]; p.nameAiLangs = old.nameAiLangs; continue;
    }
    if (!need.length && !text) continue;
    const prompt = `관광지 「${p.name.ko}」(성북구 · 서울)의 이름과 소개를 번역해 JSON 하나만 출력하세요.\n` +
      `규칙: 소개에 없는 사실을 지어내지 말 것. 숫자 · 연도 · 고유명사는 그대로. 이름은 널리 쓰이는 표기가 있으면 그것을 쓰고 없으면 소리 나는 대로.\n` +
      `사람 이름(인명)은 한자 · 표기를 확신할 수 없으면 추측하지 말고 한국어 이름을 괄호 안에 그대로 함께 적을 것 (예: 한용운 → 韓龍雲(한용운)처럼 확실한 것만 한자로, 아니면 한국어 그대로).\n` +
      `형식: {"name":{"en":"","zh":"(간체)","ja":""},"intro":{"en":"","zh":"(간체)","ja":""}}\n` +
      `소개(한국어): ${p.intro.ko || '(없음 — intro 는 빈 문자열)'}`;
    const r = await askAI({ system: '당신은 관광 안내문 번역가입니다. 요청한 JSON 외에는 아무것도 쓰지 않습니다.', user: prompt, maxTokens: 900, timeoutMs: 40000 });
    p.intro.by = r.ok ? `${r.provider}/${r.model}` : null; p.intro.reviewed = false;
    if (!r.ok) { report.push(`${p.id}: AI 번역 실패 ${JSON.stringify(r.tried)}`); continue; }
    try {
      const m = r.text.match(/\{[\s\S]*\}/);
      const j = JSON.parse(m ? m[0] : r.text);
      for (const l of need) if (j.name?.[l]) { p.name[l] = j.name[l]; p.nameAiLangs = [...(p.nameAiLangs || []), l]; }
      for (const l of ['en', 'zh', 'ja']) if (j.intro?.[l]) p.intro[l] = j.intro[l];
    } catch { report.push(`${p.id}: AI 답을 JSON 으로 읽지 못함`); }
  }
  save('places.json', places);
  save('stays.json', stays);
  return report;
}

(async () => {
  const life = buildLife();
  console.log('생활 안내', JSON.stringify(life));
  console.log('먹거리', buildFood(), '곳');
  console.log('행사(받아 둔 표)', buildEvents(), '건');
  const rep = await buildPlaces();
  console.log(rep.join('\n'));
  save('meta.json', { builtAt: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10) }); // 화면 맨 아래에 「자료 받은 날」로 보인다
})();
