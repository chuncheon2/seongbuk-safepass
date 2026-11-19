/* 성북 세이프패스 — 화면. 모든 동적 글자는 textContent 로만 넣는다. 서버(/api)가 준 값을 그대로 보여 주고, 정해진 단어만 사전으로 바꾼다. */
(function () {
  'use strict';

  var LANGS = [['en', 'EN'], ['zh', '中文'], ['ja', '日本語']];
  var MENU_IDS = ['safety', 'places', 'food', 'events', 'life', 'ask', 'more'];

  /* ---------- 화면 문구 (영어 · 중국어 간체 · 일본어). 안전 알림 문장은 사람이 확인한 고정 문장이다 ---------- */
  var T = {
    en: {
      menu: { safety: 'Safety', places: 'Nearby sights', food: 'Food', events: 'Events', life: 'Living guide', ask: 'Ask', more: 'More' },
      stay: 'Your stay', switchQr: 'Demo: scan another QR', virtual: 'Fictional demo lodging',
      today: 'Today near your stay', live: 'LIVE', demo: 'DEMO', demoNote: 'Demo value — live data unavailable', demoSet: 'Demo setting',
      say: { both: 'Rain and bad air today. Plan indoors.', rain: 'Rain is expected today. Take an umbrella.', dust: 'The air is bad today. Wear a mask.', fine: 'A good day to walk around.', unknown: 'We could not load today\'s air and rain information. Please check before you go out.' },
      air: 'Air quality', rain: 'Rain forecast', pm10: 'PM10', pm25: 'PM2.5', grade: { 1: 'Good', 2: 'Moderate', 3: 'Bad', 4: 'Very bad' },
      measured: 'Measured', station: 'Station', popMax: 'Highest chance of rain today', rainTimes: 'Rain likely at', noRainTimes: 'No rainy hours today', temp: 'Temperature',
      fix: { dustBad: 'The air is bad today. Please wear a mask and choose indoor places.', dustOk: 'The air is fine today. No mask needed.', rainBad: 'Rain is expected today. Bring an umbrella and consider indoor places.', rainOk: 'No rain is expected today.', airUnknown: 'Air quality could not be loaded. Please check the air quality before you go out.', rainUnknown: 'The rain forecast could not be loaded. Please check the weather before you go out.' },
      demoLabel: 'Demo: change today\'s weather', demoLive: 'Real data', demoRain: 'Rain', demoDust: 'Bad air',
      source: 'Source', loading: 'Loading…', retry: 'Could not load. Please try again later.', retryBtn: 'Retry', na: 'N/A', unavail: 'Not available right now', unavailNote: 'Live data could not be loaded.', tempRemain: '(rest of today)', addrKo: 'Address (Korean — show to a taxi driver)', policeOpen: 'Show the list ({n})',
      multiZone: 'This area has more than one schedule. Pick the one that matches your lodging\'s address (shown in brackets).',
      line: 'Straight-line', mapBtn: 'Map', copyBtn: 'Copy address', copied: 'Copied', showAll: 'Show all ({n})', showLess: 'Show fewer', pickStay: 'Choose your lodging to see sights, food and tips near it.', hfNo: 'Hours and fee: no data (check before you go)', detail: 'Details', updated: 'Sights, food and living-guide data updated', limited: 'Too many questions. Please wait a minute.',
      placesH: 'Nearby sights', placesSub: 'Closest to your lodging first. On rainy or bad-air days, indoor places come first. Indoor/outdoor labels are our own and not yet verified.', reasonAI: 'AI', outside: 'Outside Seongbuk-gu', boundary: 'On the district border', indoor: 'Indoor', outdoor: 'Outdoor', unknownIO: 'Indoor/outdoor: to be checked',
      dist: 'Distance', distNA: 'Distance: to be checked', addr: 'Address', hours: 'Hours', fee: 'Fee', tel: 'Phone', site: 'Website', noData: 'No data (check before you go)', aiTr: 'AI translation · not yet checked by staff', officialName: 'Official foreign-language name', km: 'km',
      foodH: 'Food', foodSub: 'Long-running local shops: Baeknyeon Gage (100+ years) and Seoul Orae Gage. Same neighborhood first.', sameDong: 'Same neighborhood', century: '100-year shop', old: 'Seoul Orae Gage (long-running)', checkOpen: 'Check that it is open before you go.', noAddr: 'Address: not in our data — call 120',
      eventsH: 'Events this week', eventsSub: 'Names, dates and places are shown exactly as published.', week: 'This week', free: 'Free', paid: 'Paid', details: 'Details', noEvents: 'No Seongbuk events found for this week.', staleNote: 'Showing events from our saved list (downloaded {d}); they may have ended.', when: 'Dates', time: 'Time', place: 'Place', target: 'For', price: 'Price',
      lifeH: 'Living guide', lifeSub: 'Trash rules for your lodging\'s area, nearby offices and police, Wi-Fi and restrooms.', trashH: 'Trash and recycling', zone: 'Your area', general: 'General waste', food2: 'Food waste', recycle: 'Recycling', days: 'Days', time2: 'Time', where: 'Where', how: 'How', noPickup: 'No pickup', bags: 'Bags', bagsInfo: 'Buy standard trash bags at convenience stores.', questionBags: 'Ask: where to buy trash bags',
      centersH: 'Community center nearby', policeH: 'Police boxes and stations in Seongbuk-gu', policeNote: 'Emergency: 112 (police) · 119 (fire, ambulance)', wifiH: 'Free public Wi-Fi nearby', wifiIn: 'Indoor', wifiOut: 'Outdoor', toiletH: 'Public restrooms nearby', transitH: 'Subway and transit card', transitText: 'Ask us how to ride the subway and where to get a transit card.', questionTransit: 'Ask: subway and transit card',
      askH: 'Ask a question', askSub: 'Answers come only from our saved documents, with the source named. If it is not there, we say so.', askPh: 'Type your question', askBtn: 'Ask', asking: 'Searching documents…', sources: 'Source', answeredBy: 'Written by AI', check: 'Hours and prices can change. Check before you go.', goMenu: 'Open the menu', sugg: ['Is Gilsangsa open now? Is there an entrance fee?', 'Any indoor places to visit on a rainy day?', 'Where is the nearest police box or community center?', 'How do I take the subway? Where do I get a transit card?'], askFail: 'AI is not available right now. Please call 1330 or 120.',
      moreH: 'More help', more1330: '1330 Korea Travel Hotline', more1330s: '24 hours, multilingual', more120: '120 Dasan Call Center', more120s: 'Seoul city information and complaints', moreSb: 'Seongbuk-gu English website', moreSbs: 'sb.go.kr/en', moreVs: 'Visit Seoul', moreVss: 'english.visitseoul.net',
      foot1: 'This service does not ask for your name, contact details or location. Distances are measured from your lodging, not from your phone.', foot2: 'Hours, prices and shop status can change. Names, addresses, dates and numbers are shown as published by each source.', foot3: 'Sources: AirKorea, Korea Meteorological Administration, Korea Tourism Organization, Seoul Open Data Plaza, Seongbuk-gu Office, Ministry of Public Data. Demo lodgings are fictional.',
    },
    zh: {
      menu: { safety: '安全', places: '附近景点', food: '美食', events: '活动', life: '生活指南', ask: '提问', more: '更多' },
      stay: '您的住宿', switchQr: '演示：扫描另一个二维码', virtual: '虚构的演示住宿',
      today: '今天住宿附近', live: '实时', demo: '演示', demoNote: '演示数值——暂时无法获取实时数据', demoSet: '演示设置',
      say: { both: '今天有雨且空气差，请安排室内行程。', rain: '今天有雨，请带伞。', dust: '今天空气差，请戴口罩。', fine: '今天适合出门走走。', unknown: '无法获取今天的空气和降雨信息，出门前请自行确认。' },
      air: '空气质量', rain: '降雨预报', pm10: 'PM10', pm25: 'PM2.5', grade: { 1: '优', 2: '良', 3: '差', 4: '很差' },
      measured: '测量时间', station: '测量站', popMax: '今天最高降水概率', rainTimes: '可能下雨的时间', noRainTimes: '今天没有降雨时段', temp: '气温',
      fix: { dustBad: '今天空气质量差，请佩戴口罩，优先选择室内场所。', dustOk: '今天空气质量良好，无需佩戴口罩。', rainBad: '今天有雨，请带伞，并考虑室内场所。', rainOk: '今天预计无雨。', airUnknown: '无法获取空气质量信息，出门前请自行确认空气质量。', rainUnknown: '无法获取降雨预报，出门前请自行确认天气。' },
      demoLabel: '演示：切换今天的天气', demoLive: '真实数据', demoRain: '下雨', demoDust: '空气差',
      source: '来源', loading: '加载中…', retry: '无法加载，请稍后再试。', retryBtn: '重试', na: '无数据', unavail: '暂时无法获取', unavailNote: '无法加载实时数据。', tempRemain: '（今天剩余时间）', addrKo: '地址（韩文，可给出租车司机看）', policeOpen: '查看列表（{n}）',
      multiZone: '该区域有多个投放时间表，请选择与您住宿地址相符的一项（括号内为地址）。',
      line: '直线距离', mapBtn: '地图', copyBtn: '复制地址', copied: '已复制', showAll: '查看全部（{n}）', showLess: '收起', pickStay: '请选择您的住宿，查看附近的景点、美食和生活信息。', hfNo: '开放时间和费用：无资料（出发前请确认）', detail: '详情', updated: '景点、美食和生活指南数据更新于', limited: '提问过多，请等一分钟。',
      placesH: '附近景点', placesSub: '按离住宿的距离排序。下雨或空气差时，室内景点排在前面。室内/室外标注为我们自行分类，尚未核实。', reasonAI: 'AI', outside: '不在城北区', boundary: '位于区界', indoor: '室内', outdoor: '室外', unknownIO: '室内/室外：待确认',
      dist: '距离', distNA: '距离：待确认', addr: '地址', hours: '开放时间', fee: '费用', tel: '电话', site: '网站', noData: '无资料（出发前请确认）', aiTr: 'AI翻译 · 尚未经工作人员确认', officialName: '官方外语名称', km: '公里',
      foodH: '美食', foodSub: '老字号：百年老店和首尔“老店”。同一街区优先。', sameDong: '同一街区', century: '百年老店', old: '首尔“老店”（长期经营）', checkOpen: '出发前请确认是否营业。', noAddr: '地址：资料中没有——请拨打120',
      eventsH: '本周活动', eventsSub: '名称、日期和地点均按原始数据显示。', week: '本周', free: '免费', paid: '收费', details: '详情', noEvents: '本周没有查到城北区的活动。', staleNote: '显示的是已保存的活动列表（{d}下载），可能已结束。', when: '日期', time: '时间', place: '地点', target: '对象', price: '价格',
      lifeH: '生活指南', lifeSub: '住宿所在区域的垃圾投放规则、附近的政府机构和警察、Wi-Fi 与洗手间。', trashH: '垃圾与回收', zone: '您的区域', general: '一般垃圾', food2: '厨余垃圾', recycle: '可回收物', days: '星期', time2: '时间', where: '地点', how: '方法', noPickup: '不收运', bags: '垃圾袋', bagsInfo: '标准垃圾袋可在便利店购买。', questionBags: '提问：哪里买垃圾袋',
      centersH: '附近的洞居民中心', policeH: '城北区的派出所', policeNote: '紧急电话：112（警察）· 119（消防、急救）', wifiH: '附近的免费公共 Wi-Fi', wifiIn: '室内', wifiOut: '室外', toiletH: '附近的公共洗手间', transitH: '地铁与交通卡', transitText: '您可以询问如何乘坐地铁、在哪里购买交通卡。', questionTransit: '提问：地铁与交通卡',
      askH: '提问', askSub: '回答只来自我们保存的文件，并注明来源。文件里没有的内容，我们会如实说明。', askPh: '请输入问题', askBtn: '提问', asking: '正在查找文件…', sources: '来源', answeredBy: 'AI撰写', check: '开放时间和价格可能变动，出发前请确认。', goMenu: '打开菜单', sugg: ['吉祥寺现在开门吗？要门票吗？', '下雨天有哪些室内景点？', '最近的派出所或居民中心在哪里？', '怎么坐地铁？在哪里买交通卡？'], askFail: '目前无法使用AI，请拨打1330或120。',
      moreH: '更多帮助', more1330: '1330 旅游翻译热线', more1330s: '24小时，多语言', more120: '120 茶山呼叫中心', more120s: '首尔市信息与投诉', moreSb: '城北区英文网站', moreSbs: 'sb.go.kr/en', moreVs: 'Visit Seoul', moreVss: 'english.visitseoul.net',
      foot1: '本服务不会询问您的姓名、联系方式或位置。距离以住宿为基准，而不是您的手机位置。', foot2: '开放时间、价格和店铺状态可能变动。名称、地址、日期和数字均按各来源发布的内容显示。', foot3: '来源：韩国环境公团（AirKorea）、气象厅、韩国观光公社、首尔开放数据广场、城北区厅、公共数据门户。演示住宿为虚构。',
    },
    ja: {
      menu: { safety: '安全', places: '近くの観光地', food: 'グルメ', events: 'イベント', life: '生活ガイド', ask: '質問', more: 'その他' },
      stay: 'ご宿泊先', switchQr: 'デモ：別のQRを読み取る', virtual: '架空のデモ用宿泊施設',
      today: '今日の宿泊先まわり', live: 'LIVE', demo: 'デモ', demoNote: 'デモ値 — リアルタイムのデータを取得できません', demoSet: 'デモ設定',
      say: { both: '今日は雨で空気も悪いです。屋内中心に。', rain: '今日は雨の予報です。傘をお持ちください。', dust: '今日は空気が悪いです。マスクを着用してください。', fine: '今日は散策日和です。', unknown: '今日の大気と雨の情報を取得できませんでした。お出かけ前にご自身でご確認ください。' },
      air: '大気の状態', rain: '雨の予報', pm10: 'PM10', pm25: 'PM2.5', grade: { 1: '良い', 2: '普通', 3: '悪い', 4: '非常に悪い' },
      measured: '測定時刻', station: '測定所', popMax: '今日の最高降水確率', rainTimes: '雨の可能性が高い時間', noRainTimes: '今日は雨の時間帯なし', temp: '気温',
      fix: { dustBad: '今日は空気が悪いです。マスクを着用し、室内の施設を選びましょう。', dustOk: '今日は空気がきれいです。マスクは不要です。', rainBad: '今日は雨の予報です。傘を持ち、室内の施設も検討してください。', rainOk: '今日は雨の予報はありません。', airUnknown: '大気の情報を取得できませんでした。お出かけ前に大気の状態をご確認ください。', rainUnknown: '雨の予報を取得できませんでした。お出かけ前に天気をご確認ください。' },
      demoLabel: 'デモ：今日の天気を切り替え', demoLive: '実データ', demoRain: '雨', demoDust: '空気が悪い',
      source: '出典', loading: '読み込み中…', retry: '読み込めませんでした。後でもう一度お試しください。', retryBtn: '再試行', na: 'データなし', unavail: '現在利用できません', unavailNote: 'リアルタイムのデータを取得できませんでした。', tempRemain: '（今日の残り時間）', addrKo: '住所（韓国語・タクシー運転手に見せられます）', policeOpen: '一覧を見る（{n}）',
      multiZone: 'この地域には複数の収集スケジュールがあります。宿泊先の住所に合うもの（括弧内）を選んでください。',
      line: '直線距離', mapBtn: '地図', copyBtn: '住所をコピー', copied: 'コピーしました', showAll: 'すべて見る（{n}）', showLess: '閉じる', pickStay: '宿泊先を選ぶと、近くの観光地・グルメ・生活情報が表示されます。', hfNo: '営業時間・料金：資料なし（お出かけ前にご確認ください）', detail: '詳細', updated: '観光地・グルメ・生活ガイドのデータ更新日', limited: '質問が多すぎます。1分ほどお待ちください。',
      placesH: '近くの観光地', placesSub: '宿泊先から近い順。雨や空気が悪い日は屋内を先に表示します。屋内/屋外の区分は当方の分類で、まだ確認していません。', reasonAI: 'AI', outside: '城北区の外', boundary: '区の境界', indoor: '屋内', outdoor: '屋外', unknownIO: '屋内/屋外：要確認',
      dist: '距離', distNA: '距離：要確認', addr: '住所', hours: '営業時間', fee: '料金', tel: '電話', site: 'ウェブサイト', noData: '資料なし（お出かけ前にご確認ください）', aiTr: 'AI翻訳 · スタッフ確認前', officialName: '公式の外国語名', km: 'km',
      foodH: 'グルメ', foodSub: '老舗：百年店とソウル「オレガゲ」。同じ町内を先に表示します。', sameDong: '同じ町内', century: '百年店', old: 'ソウル「オレガゲ」（長年営業）', checkOpen: '行く前に営業しているか確認してください。', noAddr: '住所：資料なし — 120へお問い合わせください',
      eventsH: '今週のイベント', eventsSub: '名称・日付・場所は公表されたまま表示します。', week: '今週', free: '無料', paid: '有料', details: '詳細', noEvents: '今週の城北区のイベントは見つかりませんでした。', staleNote: '保存済みのリスト（{d}取得）を表示しています。終了している場合があります。', when: '日付', time: '時間', place: '場所', target: '対象', price: '料金',
      lifeH: '生活ガイド', lifeSub: '宿泊先の地域のごみ出しルール、近くの役所・警察、Wi-Fi、トイレ。', trashH: 'ごみとリサイクル', zone: 'お住まいの区域', general: '一般ごみ', food2: '生ごみ', recycle: '資源ごみ', days: '曜日', time2: '時間', where: '場所', how: '方法', noPickup: '収集なし', bags: 'ごみ袋', bagsInfo: '規格ごみ袋はコンビニで購入できます。', questionBags: '質問：ごみ袋の買える場所',
      centersH: '近くの洞住民センター', policeH: '城北区の交番・派出所', policeNote: '緊急：112（警察）・119（消防・救急）', wifiH: '近くの無料公共Wi-Fi', wifiIn: '屋内', wifiOut: '屋外', toiletH: '近くの公衆トイレ', transitH: '地下鉄と交通カード', transitText: '地下鉄の乗り方や交通カードの買える場所を質問できます。', questionTransit: '質問：地下鉄と交通カード',
      askH: '質問する', askSub: '回答は保存した資料だけを根拠にし、出典を示します。資料にない場合はそのようにお伝えします。', askPh: '質問を入力', askBtn: '質問', asking: '資料を検索中…', sources: '出典', answeredBy: 'AIが作成', check: '営業時間や料金は変わることがあります。お出かけ前にご確認ください。', goMenu: 'メニューを開く', sugg: ['吉祥寺は今開いていますか？入場料は？', '雨の日に行ける屋内の観光地は？', '一番近い交番や住民センターはどこ？', '地下鉄の乗り方と交通カードの買い方は？'], askFail: '現在AIをご利用いただけません。1330または120へお電話ください。',
      moreH: 'その他のサポート', more1330: '1330 観光通訳案内', more1330s: '24時間・多言語', more120: '120 タサン・コールセンター', more120s: 'ソウル市の案内・苦情', moreSb: '城北区 英語ウェブサイト', moreSbs: 'sb.go.kr/en', moreVs: 'Visit Seoul', moreVss: 'english.visitseoul.net',
      foot1: 'このサービスは、お名前・連絡先・位置情報を求めません。距離はお使いの端末ではなく宿泊先から測っています。', foot2: '営業時間・料金・店舗の状況は変わることがあります。名称・住所・日付・数値は各出典の公表どおりに表示します。', foot3: '出典：韓国環境公団（AirKorea）、気象庁、韓国観光公社、ソウル公開データ広場、城北区庁、公共データポータル。デモ用の宿泊施設は架空です。',
    },
  };

  /* ---------- 정해진 단어 사전 (요일 · 월 · 흔한 말). 사전에 없는 글자는 한국어 원문 그대로 둔다 ---------- */
  var DOW = {
    en: { '월': 'Mon', '화': 'Tue', '수': 'Wed', '목': 'Thu', '금': 'Fri', '토': 'Sat', '일': 'Sun' },
    zh: { '월': '周一', '화': '周二', '수': '周三', '목': '周四', '금': '周五', '토': '周六', '일': '周日' },
    ja: { '월': '月', '화': '火', '수': '水', '목': '木', '금': '金', '토': '土', '일': '日' },
  };
  var MONTH = {
    en: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    zh: ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    ja: ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  };
  var WORDS = {
    en: [['하절기 · 동절기에 시간이 달라질 수 있다', 'times may change between summer and winter'], ['(성북구청 누리집)', '(Seongbuk-gu website)'], ['(서울시 기사, 2020)', '(Seoul city article, 2020)'], ['누리집에 시간 없음', 'Hours not listed'], ['월요일은 누리집에 없음', 'Monday not listed'], ['자료 없음 (확인 필요)', 'No data (check before you go)'], ['자료 없음', 'No data'], ['하절기', 'summer'], ['동절기', 'winter'], ['매일', 'Daily'], ['휴무', 'closed'], ['휴관', 'closed'], ['무료', 'Free'], ['유료', 'Paid'], ['원', ' KRW']],
    zh: [['하절기 · 동절기에 시간이 달라질 수 있다', '夏季与冬季的时间可能不同'], ['(성북구청 누리집)', '（城北区厅网站）'], ['(서울시 기사, 2020)', '（首尔市报道，2020）'], ['누리집에 시간 없음', '官网未列出时间'], ['월요일은 누리집에 없음', '官网未列出周一'], ['자료 없음 (확인 필요)', '无资料（出发前请确认）'], ['자료 없음', '无资料'], ['하절기', '夏季'], ['동절기', '冬季'], ['매일', '每天'], ['휴무', '休息'], ['휴관', '闭馆'], ['무료', '免费'], ['유료', '收费'], ['원', '韩元']],
    ja: [['하절기 · 동절기에 시간이 달라질 수 있다', '夏季と冬季で時間が変わる場合あり'], ['(성북구청 누리집)', '（城北区庁ウェブサイト）'], ['(서울시 기사, 2020)', '（ソウル市の記事、2020）'], ['누리집에 시간 없음', '公式サイトに時間の記載なし'], ['월요일은 누리집에 없음', '月曜は公式サイトに記載なし'], ['자료 없음 (확인 필요)', '資料なし（要確認）'], ['자료 없음', '資料なし'], ['하절기', '夏季'], ['동절기', '冬季'], ['매일', '毎日'], ['휴무', '休み'], ['휴관', '休館'], ['무료', '無料'], ['유료', '有料'], ['원', 'ウォン']],
  };
  function loc(str, lang) {
    if (str == null || str === '') return '';
    var s = String(str);
    var m = MONTH[lang];
    // 긴 문구를 먼저 바꾼다 (「달라질 수 있다」의 「수」가 요일로 바뀌는 것을 막는다)
    WORDS[lang].forEach(function (p) { s = s.split(p[0]).join(p[1]); });
    s = s.replace(/(\d{1,2})~(\d{1,2})월/g, function (_, a, b) { return m[+a] + '–' + m[+b]; });
    s = s.replace(/(\d{1,2})월/g, function (_, a) { return m[+a]; });
    s = s.replace(/(월|화|수|목|금|토|일)요일/g, function (_, d) { return DOW[lang][d]; });
    // 요일 한 글자는 시각 숫자나 다른 요일 · 휴무 옆에 있을 때만 바꾼다
    s = s.replace(/(^|[^가-힣0-9])(월|화|수|목|금|토|일)(?=\s*(?:[–~·,]|\d|$|\)|[^가-힣\s]|휴무|휴관|closed|Closed))/g, function (_, pre, d) { return pre + DOW[lang][d]; });
    return s;
  }
  function dayList(str, lang) { return String(str || '').split('+').map(function (d) { return DOW[lang][d.trim()] || d; }).join(', '); }

  /* 쓰레기 배출 문구 사전 (원문 문장이 사전과 같을 때만 바꾼다) */
  var TRASH = {
    '문전수거': { en: 'Door-front collection', zh: '门前收运', ja: '戸別収集' },
    '내 집, 내 점포 앞': { en: 'In front of your home or shop', zh: '自家或店铺门前', ja: 'ご自宅・店舗の前' },
    '규격봉투에 넣어 지정된 요일에 배출': { en: 'Put in the standard trash bag and set out on the designated days', zh: '装入标准垃圾袋，在指定的日子投放', ja: '規格袋に入れ、指定の曜日に出す' },
    '물기를 최대한 줄여 음식물 전용봉투 또는 전용용기에 넣어 배출': { en: 'Drain well and put in a food-waste bag or container', zh: '尽量沥干水分，装入厨余专用袋或容器投放', ja: '水気をよく切り、生ごみ専用の袋または容器に入れて出す' },
    '투명한 비닐봉투에 담거나 끈으로 묶어서 지정된 요일에 배출': { en: 'Put in a clear plastic bag or tie up, and set out on the designated days', zh: '装入透明塑料袋或捆扎，在指定的日子投放', ja: '透明なビニール袋に入れるかひもで束ね、指定の曜日に出す' },
    '설 명절+추석 명절+공휴일 전날': { en: 'Lunar New Year, Chuseok, and the day before public holidays', zh: '春节、中秋节、公休日前一天', ja: '旧正月・秋夕・祝日の前日' },
    '미운영': { en: 'Not operated', zh: '不运营', ja: '運営なし' },
  };
  function trashText(s, lang) { return s ? ((TRASH[s] && TRASH[s][lang]) || s) : ''; }

  /* 출처 · 부서 · 경찰 구분처럼 정해진 한국어 이름은 사전으로 바꾼다 (가게 이름 · 주소 · 행사 제목은 원래 데이터 그대로 둔다) */
  var KO_NAMES = {
    '소상공인시장진흥공단 백년가게': { en: 'Small Enterprise and Market Service · Baeknyeon Gage', zh: '小商工人市场振兴公团·百年老店', ja: '小商工人市場振興公団・百年店' },
    '서울 오래가게(2020 선정)': { en: 'Seoul Orae Gage (selected 2020)', zh: '首尔“老店”（2020年选定）', ja: 'ソウル「オレガゲ」（2020年選定）' },
    '청소행정과': { en: 'Cleaning Administration Division', zh: '清扫行政科', ja: '清掃行政課' },
    '지구대': { en: 'Police box', zh: '地区派出所', ja: '地域警察官署（地区隊）' },
    '파출소': { en: 'Police substation', zh: '派出所', ja: '派出所' },
    '서울성북': { en: 'Seoul Seongbuk Police Station', zh: '首尔城北警察署', ja: 'ソウル城北警察署' },
    '서울종암': { en: 'Seoul Jongam Police Station', zh: '首尔钟岩警察署', ja: 'ソウル鍾岩警察署' },
    '성북구': { en: 'Seongbuk-gu', zh: '城北区', ja: '城北区' },
  };
  function kl(s, lang) { return (s && KO_NAMES[s] && KO_NAMES[s][lang]) || s || ''; }
  function zoneLabel(z, lang) { return String(z || '').replace(/(\d+)권역/, function (_, n) { return lang === 'en' ? 'Zone ' + n : lang === 'zh' ? '第' + n + '区' : '第' + n + '区域'; }); }
  function joinDot(parts) { return parts.filter(function (x) { return x != null && String(x).trim() !== ''; }).join(' · '); }

  /* ---------- 작은 도우미 ---------- */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    function add(c) {
      if (c == null || c === false) return;
      if (Array.isArray(c)) { c.forEach(add); return; }
      el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    }
    for (var i = 2; i < arguments.length; i++) add(arguments[i]);
    return el;
  }
  function safeLink(url) { return /^https?:\/\//i.test(url || '') ? url : null; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function $(id) { return document.getElementById(id); }
  function getJson(url, opt) {
    return fetch(url, opt).then(function (r) { return r.json(); }).catch(function () { return { ok: false, reason: 'network' }; });
  }

  /* ---------- 상태 ---------- */
  var q = new URLSearchParams(location.search);
  var state = { lang: 'en', stay: null, demo: q.get('demo') === '1', builtAt: '', expanded: {}, override: 'live', stays: [], air: null, weather: null, places: null, food: null, events: null, life: null, reason: null, answer: null, asking: false, lastQ: '' };
  (function initLang() {
    var l = q.get('lang') || store('sp-lang') || (navigator.language || 'en').slice(0, 2);
    state.lang = (l === 'zh' || l === 'ja') ? l : 'en';
    // 숙소: QR 주소의 ?stay= 가 우선, 없으면 지난번에 고른 숙소, 그것도 없으면 직접 고르게 한다
    var s = String(q.get('stay') || store('sp-stay') || '').toUpperCase();
    state.stay = (s === 'A' || s === 'B') ? s : null;
  })();
  function t() { return T[state.lang]; }
  function stayObj() { return state.stays.filter(function (s) { return s.id === state.stay; })[0]; }

  /* 오늘의 상태: 실제 값 + 시연 설정.
     실시간 값을 받지 못했을 때 가짜 시연 값으로 「좋은 날」이라고 말하면 위험하다 — 시연 값은 ?demo=1 일 때만 쓰고,
     평소에는 「알 수 없음」으로 두어 관광객이 직접 확인하게 한다. */
  function today() {
    var air = state.air, w = state.weather;
    var airKnown = !!(air && (air.live || state.demo));
    var rainKnown = !!(w && (w.live || state.demo));
    var airBad = airKnown && !!(air.live ? air.bad : air.demo && air.demo.bad);
    var rain = rainKnown && !!(w.live ? w.rain : w.demo && w.demo.rain);
    var demoForced = false;
    if (state.override === 'rain') { rain = true; rainKnown = true; demoForced = true; }
    if (state.override === 'dust') { airBad = true; airKnown = true; demoForced = true; }
    return { airBad: airBad, rain: rain, airKnown: airKnown, rainKnown: rainKnown, bad: airBad || rain, why: airBad && rain ? 'both' : rain ? 'rain' : airBad ? 'dust' : 'fine', demoForced: demoForced };
  }

  /* ---------- 화면 그리기 ---------- */
  function renderChrome() {
    document.documentElement.lang = state.lang === 'zh' ? 'zh-Hans' : state.lang;
    var seg = $('langSeg'); seg.textContent = '';
    LANGS.forEach(function (p) {
      seg.appendChild(h('button', { type: 'button', 'aria-pressed': String(state.lang === p[0]), lang: p[0] === 'zh' ? 'zh-Hans' : p[0], text: p[1], onclick: function () { setLang(p[0]); } }));
    });
    var th = document.documentElement.getAttribute('data-theme');
    var tb = $('themeBtn'); tb.textContent = '';
    tb.setAttribute('aria-label', th === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    tb.appendChild(th === 'dark' ? svgIcon('sun') : svgIcon('moon'));
    var menu = $('menu'); menu.textContent = '';
    MENU_IDS.forEach(function (id) { menu.appendChild(h('a', { href: '#' + id, 'data-id': id, text: t().menu[id] })); });
    $('foot').textContent = '';
    $('foot').append(h('p', { text: t().foot1 }), h('p', { text: t().foot2 }), h('p', { text: t().foot3 }));
    if (state.builtAt) $('foot').appendChild(h('p', { text: t().updated + ': ' + state.builtAt }));
  }
  function svgIcon(kind) {
    var ns = 'http://www.w3.org/2000/svg';
    var s = document.createElementNS(ns, 'svg');
    s.setAttribute('width', '20'); s.setAttribute('height', '20'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(ns, 'path');
    p.setAttribute('d', kind === 'sun' ? 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z' : 'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z');
    s.appendChild(p); return s;
  }

  function renderStay() {
    var s = stayObj(), box = $('stayBar'); box.textContent = '';
    if (!state.stays.length) return;
    // 숙소가 정해지지 않았으면(QR 주소에 ?stay= 가 없을 때) 직접 고르게 한다
    if (!s) {
      box.append(h('span', { class: 'lbl', text: t().stay }), h('span', { class: 'nm', text: t().pickStay }));
      var pick = h('div', { class: 'sw' });
      state.stays.forEach(function (x) { pick.appendChild(h('button', { class: 'btn sm', type: 'button', text: x.name[state.lang] || x.name.en, onclick: function () { setStay(x.id); } })); });
      box.append(pick);
      return;
    }
    box.append(h('span', { class: 'lbl', text: t().stay }), h('span', { class: 'nm', text: s.name[state.lang] || s.name.en }));
    // 숙소 바꾸기 버튼은 시연 주소(?demo=1)에서만 보인다
    if (state.demo) {
      var sw = h('div', { class: 'sw' }, h('span', { text: t().switchQr }));
      state.stays.forEach(function (x) { sw.appendChild(h('button', { class: 'btn sm', type: 'button', 'aria-pressed': String(x.id === state.stay), text: 'QR ' + x.id, onclick: function () { setStay(x.id); } })); });
      box.append(sw);
    }
    if (s.dong) box.append(h('span', { class: 'tag', lang: 'ko', text: s.dong }));
    if (s.virtual) box.append(h('span', { class: 'tag', text: t().virtual }));
  }

  function liveBadge(isLive) { return h('span', { class: 'badge ' + (isLive ? 'live' : 'demo'), text: isLive ? t().live : t().demo }); }
  // 서버가 돌려주는 실패 사유(한국어)를 화면 언어로 바꾼다. 사전에 없는 사유는 그대로 둔다
  var REASON = {
    '키 비어 있음': { en: 'key missing', zh: '密钥为空', ja: 'キーが空' },
    '승인 안 됨': { en: 'not approved', zh: '未获批准', ja: '未承認' },
    '시간 초과': { en: 'timed out', zh: '超时', ja: 'タイムアウト' },
    '호출 한도 초과': { en: 'call limit reached', zh: '超出调用次数', ja: '呼び出し上限' },
    '응답 형식 오류': { en: 'unexpected response', zh: '响应格式错误', ja: '応答形式エラー' },
    '최근 측정값 없음(측정소 통신장애)': { en: 'no recent measurement (station offline)', zh: '无最新测量值（测量站故障）', ja: '最新の測定値なし（測定所の通信障害）' },
    '오늘 예보 자료 없음': { en: 'no forecast data for today', zh: '没有今天的预报数据', ja: '今日の予報データなし' },
  };
  function reasonText(r) { return (r && REASON[r] && REASON[r][state.lang]) || r || ''; }
  // 실시간 값을 못 받았을 때의 카드: 숫자 없이 「지금은 알 수 없음」과 다시 시도 버튼만 보여 준다
  function naCard(title, reason, retry) {
    return h('div', { class: 'sig' },
      h('div', { class: 'k' }, h('span', { text: title }), h('span', { class: 'badge na', text: t().na })),
      h('div', { class: 'st mid', text: t().unavail }),
      h('div', { class: 'note', text: t().unavailNote + (reason ? ' (' + reasonText(reason) + ')' : '') }),
      h('div', null, h('button', { class: 'btn sm', type: 'button', text: t().retryBtn, onclick: retry })));
  }

  function renderSafety() {
    var box = $('safety'); box.textContent = '';
    var tt = today(), air = state.air, w = state.weather;
    if (!air || !w) { box.append(h('div', { class: 'skel' })); return; }
    box.append(h('div', { class: 'eyebrow', id: 'h-safety' }, t().today));
    // 하나라도 모르는데 나머지가 「이상 없음」이면 「산책하기 좋은 날」이라고 말하지 않는다
    var headline = tt.why !== 'fine' ? t().say[tt.why] : (tt.airKnown && tt.rainKnown ? t().say.fine : t().say.unknown);
    box.append(h('h1', { class: 'say', text: headline }));

    var a = air.live ? air : Object.assign({}, air.demo || {});
    var aIsLive = air.live && state.override !== 'dust';
    var aBad = tt.airBad;
    var grade = state.override === 'dust' ? 3 : a.grade;
    var airCard = !tt.airKnown ? naCard(t().air, air.reason, loadAir) : h('div', { class: 'sig' },
      h('div', { class: 'k' }, h('span', { text: t().air }), liveBadge(aIsLive)),
      h('div', { class: 'v' }, a.pm10 != null ? ('PM10 ' + a.pm10) : 'PM10 –', h('small', { text: 'µg/m³' })),
      h('div', { class: 'v' }, a.pm25 != null ? ('PM2.5 ' + a.pm25) : 'PM2.5 –', h('small', { text: 'µg/m³' })),
      h('div', { class: 'st ' + (aBad ? 'bad' : grade === 1 ? 'good' : 'mid'), text: t().grade[grade] || '' }),
      h('div', { class: 'note', text: aIsLive ? (t().measured + ' ' + (a.dataTime || '') + ' · ' + t().station + ' ' + kl(a.station || '', state.lang)) : (t().demoNote + (air.reason ? ' (' + reasonText(air.reason) + ')' : '')) }));

    var wd = w.live ? w : Object.assign({}, w.demo || {});
    var wIsLive = w.live && state.override !== 'rain';
    var rainHours = state.override === 'rain' ? ['—'] : (wd.rainHours || []);
    var maxPop = state.override === 'rain' ? Math.max(wd.maxPop || 0, 80) : wd.maxPop;
    var rainCard = !tt.rainKnown ? naCard(t().rain, w.reason, loadWeather) : h('div', { class: 'sig' },
      h('div', { class: 'k' }, h('span', { text: t().rain }), liveBadge(wIsLive)),
      h('div', { class: 'v' }, maxPop != null ? (maxPop + '%') : '–', h('small', { text: t().popMax })),
      h('div', { class: 'st ' + (tt.rain ? 'bad' : 'good'), text: tt.rain ? (state.override === 'rain' ? t().demoRain : t().rainTimes + ' ' + rainHours.join(', ')) : t().noRainTimes }),
      h('div', { class: 'v' }, wd.temp ? (Math.round(wd.temp.min) + '° / ' + Math.round(wd.temp.max) + '°') : '–', h('small', { text: t().temp + (wd.tempScope === 'remaining' ? ' ' + t().tempRemain : '') })),
      h('div', { class: 'note', text: wIsLive ? (t().source + ': KMA · ' + (w.base ? w.base.date + ' ' + w.base.time : '')) : (t().demoNote + (w.reason ? ' (' + reasonText(w.reason) + ')' : '')) }));
    box.append(h('div', { class: 'signals' }, airCard, rainCard));

    // 안전 알림 문장은 AI 가 쓰지 않는다 — 사람이 확인한 고정 문장
    var lines = [
      !tt.airKnown ? [t().fix.airUnknown, 'warn'] : [tt.airBad ? t().fix.dustBad : t().fix.dustOk, tt.airBad ? 'bad' : ''],
      !tt.rainKnown ? [t().fix.rainUnknown, 'warn'] : [tt.rain ? t().fix.rainBad : t().fix.rainOk, tt.rain ? 'bad' : ''],
    ];
    lines.forEach(function (l) { box.append(h('div', { class: 'advice ' + l[1], text: l[0] })); });

    // 날씨 바꾸기는 시연용이다 — 시연 주소(?demo=1)에서만 보이고, 관광객 화면에는 나오지 않는다
    if (state.demo) {
      var demo = h('div', { class: 'demo-row' }, h('span', { class: 'lbl', text: t().demoLabel }));
      [['live', t().demoLive], ['rain', t().demoRain], ['dust', t().demoDust]].forEach(function (p) {
        demo.appendChild(h('button', { class: 'btn sm', type: 'button', 'aria-pressed': String(state.override === p[0]), text: p[1], onclick: function () { setOverride(p[0]); } }));
      });
      box.append(demo);
    }
  }

  function ioTags(p) {
    var tags = [];
    if (p.indoor === true) tags.push(h('span', { class: 'tag in', text: t().indoor }));
    else if (p.indoor === false) tags.push(h('span', { class: 'tag', text: t().outdoor }));
    else tags.push(h('span', { class: 'tag', text: t().unknownIO }));
    if (p.outsideSeongbuk) tags.push(h('span', { class: 'badge out', text: p.boundary ? t().boundary + ' · ' + t().outside : t().outside }));
    return tags;
  }
  function kvRow(k, v, extra) {
    if (v == null || v === '') return null;
    return h('div', null, h('span', { class: 'k', text: k }), h('span', { class: extra || '' }, v));
  }

  /* 지도 열기 · 주소 복사: 택시 기사에게 한국어 주소를 보여 주거나 지도 앱에 넣을 수 있게 한다 */
  function copyText(text, btn) {
    var done = function () { var old = btn.textContent; btn.textContent = '✓ ' + t().copied; setTimeout(function () { btn.textContent = old; }, 1800); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, fallback); return; }
    } catch (e) { /* 아래 방법으로 */ }
    fallback();
    function fallback() {
      var ta = h('textarea', { 'aria-hidden': 'true', style: 'position:fixed;opacity:0' }); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* 복사 불가 */ }
      document.body.removeChild(ta);
    }
  }
  function actions(nameKo, addr, lat, lng) {
    var query = addr || nameKo;
    if (!query && lat == null) return null;
    var g = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(lat != null ? lat + ',' + lng : query);
    var n = 'https://map.naver.com/p/search/' + encodeURIComponent(query);
    var row = h('div', { class: 'actions' },
      h('a', { class: 'btn sm', href: g, target: '_blank', rel: 'noopener', text: t().mapBtn + ' · Google' }),
      h('a', { class: 'btn sm', href: n, target: '_blank', rel: 'noopener', text: t().mapBtn + ' · Naver' }));
    if (addr) { var b = h('button', { class: 'btn sm', type: 'button', text: t().copyBtn }); b.addEventListener('click', function () { copyText(addr, b); }); row.appendChild(b); }
    return row;
  }
  function retryBtn(fn) { return h('div', { class: 'empty' }, h('p', { text: t().retry }), h('button', { class: 'btn sm', type: 'button', text: t().retryBtn, onclick: fn })); }
  // 긴 목록은 처음에 n개만 보여 주고 「전체 보기」로 펼친다
  function clip(items, key, n) { return state.expanded[key] || items.length <= n + 1 ? items : items.slice(0, n); }
  function moreBtn(key, total, n, rerender) {
    if (total <= n + 1) return null;
    var open = !!state.expanded[key];
    return h('div', { class: 'more-wrap' }, h('button', { class: 'btn', type: 'button', 'aria-expanded': String(open), text: open ? t().showLess : t().showAll.replace('{n}', total), onclick: function () { state.expanded[key] = !open; rerender(); } }));
  }

  function renderPlaces() {
    var box = $('places'); box.textContent = '';
    box.append(h('h2', { id: 'h-places', text: t().placesH }), h('p', { class: 'sub', text: t().placesSub }));
    if (!state.stay) { box.append(h('div', { class: 'empty', text: t().pickStay })); return; }
    if (!state.places) { box.append(h('div', { class: 'skel' })); return; }
    if (!state.places.ok) { box.append(retryBtn(function () { loadStayData(); })); return; }
    if (state.reason && state.reason.ok) box.append(h('p', { class: 'reason' }, h('span', { class: 'badge ai', text: t().reasonAI }), state.reason.text));
    var ul = h('ul', { class: 'list' });
    clip(state.places.places, 'places', 4).forEach(function (p) {
      var name = p.name[state.lang] || p.name.en || p.name.ko;
      var intro = p.intro[state.lang] || p.intro.ko;
      var introIsAi = !!(p.intro[state.lang] && p.intro.by && p.intro.reviewed === false);
      // 시간 · 요금 자료가 둘 다 없으면 「자료 없음」을 두 번 쓰지 않고 한 줄로 합친다
      var noHF = !p.hours && !p.fee;
      // 공식 외국어 주소가 있으면 먼저 보여 주고, 한국어 주소는 택시 · 지도용으로 아래에 둔다
      var offAddr = p.official && p.official[state.lang] && p.official[state.lang].addr;
      var kv = h('div', { class: 'kv' },
        offAddr ? kvRow(t().addr, offAddr) : null,
        kvRow(offAddr ? t().addrKo : t().addr, p.addr.ko, 'ko-orig'),
        noHF ? kvRow(t().hours + ' / ' + t().fee, t().noData) : kvRow(t().hours, p.hours ? loc(p.hours, state.lang) : t().noData),
        noHF ? null : kvRow(t().fee, p.fee ? loc(p.fee, state.lang) : t().noData),
        kvRow(t().tel, p.phone));
      var li = h('li', { class: 'card' },
        h('div', { class: 'card-h' },
          h('div', null, h('h3', { class: 't', text: name }), name !== p.name.ko ? h('div', { class: 'ko', lang: 'ko', text: p.name.ko }) : null),
          h('span', { class: 'dist', text: p.distanceKm != null ? t().line + ' ' + p.distanceKm.toFixed(1) + ' ' + t().km : t().distNA })),
        h('div', { class: 'tags' }, ioTags(p)),
        kv,
        intro ? h('p', { class: 'intro', lang: p.intro[state.lang] ? undefined : 'ko', text: intro }) : null,
        introIsAi ? h('p', { class: 'ai-note', text: t().aiTr }) : null,
        actions(p.name.ko, p.addr.ko, p.lat, p.lng),
        safeLink(p.site) ? h('a', { href: p.site, target: '_blank', rel: 'noopener', text: t().site + ' ↗' }) : null);
      ul.appendChild(li);
    });
    box.append(ul, moreBtn('places', state.places.places.length, 4, renderPlaces));
  }

  function renderFood() {
    var box = $('food'); box.textContent = '';
    box.append(h('h2', { id: 'h-food', text: t().foodH }), h('p', { class: 'sub', text: t().foodSub }));
    if (!state.stay) { box.append(h('div', { class: 'empty', text: t().pickStay })); return; }
    if (!state.food) { box.append(h('div', { class: 'skel' })); return; }
    if (!state.food.ok) { box.append(retryBtn(function () { loadStayData(); })); return; }
    var ul = h('ul', { class: 'list two' });
    clip(state.food.rows, 'food', 4).forEach(function (f) {
      ul.appendChild(h('li', { class: 'card' },
        h('div', { class: 'card-h' }, h('h3', { class: 't', lang: 'ko', text: f.name }), f.sameDong ? h('span', { class: 'tag in', text: t().sameDong }) : null),
        h('div', { class: 'tags' }, h('span', { class: 'tag', text: f.kind === 'century' ? t().century : t().old })),
        h('div', { class: 'kv' }, kvRow(t().addr, f.addr || t().noAddr, f.addr ? 'ko-orig' : '')),
        actions(f.name, f.addr, null, null),
        h('p', { class: 'ai-note', text: t().checkOpen + ' · ' + kl(f.source, state.lang) })));
    });
    box.append(ul, moreBtn('food', state.food.rows.length, 4, renderFood));
  }

  function renderEvents() {
    var box = $('events'); box.textContent = '';
    box.append(h('h2', { id: 'h-events', text: t().eventsH }), h('p', { class: 'sub', text: t().eventsSub }));
    var e = state.events;
    if (!e) { box.append(h('div', { class: 'skel' })); return; }
    if (!e.ok) { box.append(retryBtn(loadEvents)); return; }
    box.append(h('div', { class: 'eyebrow' }, liveBadge(e.live), t().week + ' ' + e.week.start + ' – ' + e.week.end,
      e.demo ? h('span', { text: '(' + t().demoNote + ': ' + reasonText(e.demo.reason) + ')' }) : null));
    if (e.note === 'stale' && e.demo) box.append(h('p', { class: 'ai-note', text: t().staleNote.replace('{d}', e.demo.fetchedAt) }));
    if (!e.rows.length) { box.append(h('div', { class: 'empty', text: t().noEvents })); return; }
    var ul = h('ul', { class: 'list two' });
    clip(e.rows, 'events', 4).forEach(function (r) {
      var link = safeLink(r.url);
      ul.appendChild(h('li', { class: 'card' },
        h('div', { class: 'card-h' }, h('h3', { class: 't', lang: 'ko', text: r.title }), h('span', { class: 'tag ' + (r.free === '무료' ? 'in' : ''), text: r.free === '무료' ? t().free : r.free === '유료' ? t().paid : (r.free || '') })),
        h('div', { class: 'kv' },
          kvRow(t().when, r.start + ' – ' + r.end),
          kvRow(t().time, r.time, 'ko-orig'),
          kvRow(t().place, r.place, 'ko-orig'),
          kvRow(t().target, r.target, 'ko-orig'),
          kvRow(t().price, r.fee, 'ko-orig')),
        link ? h('a', { href: link, target: '_blank', rel: 'noopener', text: t().details + ' ↗' }) : null));
    });
    box.append(ul, moreBtn('events', e.rows.length, 4, renderEvents));
  }

  function askPrefill(text) {
    $('askInput').value = text; $('askInput').focus();
    document.getElementById('ask').scrollIntoView({ behavior: 'smooth' });
    submitAsk(text);
  }
  function simpleRows(list, nameKey, addrFn, extraFn) {
    return list.map(function (x) { return h('div', { class: 'row' }, h('span', { class: 'n', lang: 'ko', text: x[nameKey] }), h('span', { class: 'a', lang: 'ko', text: addrFn(x) }), extraFn ? extraFn(x) : null); });
  }
  function renderLife() {
    var box = $('life'); box.textContent = '';
    box.append(h('h2', { id: 'h-life', text: t().lifeH }), h('p', { class: 'sub', text: t().lifeSub }));
    var L = state.life;
    if (!state.stay) { box.append(h('div', { class: 'empty', text: t().pickStay })); return; }
    if (!L) { box.append(h('div', { class: 'skel' })); return; }
    if (!L.ok) { box.append(retryBtn(function () { loadStayData(); })); return; }
    var lang = state.lang;
    box.append(h('h3', { class: 'sub-h', text: t().trashH }));
    if (!L.garbage.length) box.append(h('div', { class: 'empty', text: t().noData }));
    if (L.garbage.length > 1) box.append(h('p', { class: 'ai-note', text: t().multiZone }));
    L.garbage.forEach(function (g) {
      var skip = g.skipDays ? trashText(g.skipDays, lang) : '';
      var recycleTxt = g.recycleDays && g.recycleStart !== '미운영' ? dayList(g.recycleDays, lang) + ' · ' + g.recycleStart + '–' + g.recycleEnd : trashText('미운영', lang);
      // 먼저 한 줄 요약(일반 쓰레기 요일 · 시간 · 장소)을 보여 주고, 음식물 · 재활용과 방법은 「자세히」에 접어 둔다
      box.append(h('div', { class: 'card' },
        h('div', { class: 'card-h' }, h('span', { class: 't', text: t().zone + ': ' + zoneLabel(g.zone, lang) + ' (' + g.areas + ')' }), h('span', { class: 'tag', text: trashText(g.placeType, lang) })),
        h('div', { class: 'sum' }, h('span', { class: 'sum-k', text: t().general }), h('strong', { text: dayList(g.days, lang) + ' · ' + g.start + '–' + g.end })),
        h('p', { class: 'intro', text: trashText(g.place, lang) }),
        h('details', { class: 'more inner' }, h('summary', { text: t().detail }),
          h('div', { class: 'kv' },
            kvRow(t().food2, dayList(g.foodDays, lang) + ' · ' + g.foodStart + '–' + g.foodEnd),
            kvRow(t().recycle, recycleTxt),
            kvRow(t().how + ' (' + t().general + ')', trashText(g.method, lang)),
            kvRow(t().how + ' (' + t().food2 + ')', trashText(g.foodMethod, lang)),
            kvRow(t().how + ' (' + t().recycle + ')', trashText(g.recycleMethod, lang)),
            kvRow(t().noPickup, skip),
            kvRow(t().bags, t().bagsInfo))),
        h('p', { class: 'ai-note', text: kl(g.dept, lang) + ' ' + g.phone + ' · ' + g.baseDate }),
        h('div', null, h('button', { class: 'btn sm', type: 'button', text: t().questionBags, onclick: function () { askPrefill(lang === 'zh' ? '哪里可以买垃圾袋？' : lang === 'ja' ? 'ごみ袋はどこで買えますか？' : 'Where can I buy trash bags?'); } }))));
    });

    box.append(h('h3', { class: 'sub-h', text: t().centersH }));
    var ln = function (x) { return t().line + ' ' + x.distanceKm.toFixed(1) + ' ' + t().km; };
    box.append(h('div', { class: 'card' }, simpleRows(L.centers, 'name', function (x) { return x.addr + ' · ' + x.phone + ' · ' + ln(x); }, function (x) { return actions(x.name, x.addr, x.lat, x.lng); })));
    box.append(h('h3', { class: 'sub-h', text: t().policeH }));
    var pd = h('details', { class: 'more' }, h('summary', { text: t().policeNote + ' — ' + t().policeOpen.replace('{n}', L.police.length) }), h('div', { class: 'list' }, simpleRows(L.police, 'name', function (x) { return joinDot([kl(x.kind, lang), kl(x.station, lang), x.addr]); }, function (x) { return actions(x.name, x.addr, null, null); })));
    box.append(pd);
    box.append(h('h3', { class: 'sub-h', text: t().wifiH }));
    box.append(h('div', { class: 'card' }, simpleRows(L.wifi, 'name', function (x) { return joinDot([x.inout === '실내' ? t().wifiIn : x.inout === '실외' ? t().wifiOut : '', x.addr, ln(x)]); }, function (x) { return actions(x.name, null, x.lat, x.lng); })));
    box.append(h('h3', { class: 'sub-h', text: t().toiletH }));
    box.append(h('div', { class: 'card' }, simpleRows(L.toilets, 'name', function (x) { return joinDot([x.addr, loc(x.open, lang), ln(x)]); }, function (x) { return actions(x.name, x.addr, x.lat, x.lng); })));
    box.append(h('h3', { class: 'sub-h', text: t().transitH }));
    box.append(h('div', { class: 'card' }, h('p', { class: 'intro', text: t().transitText }),
      h('div', null, h('button', { class: 'btn sm', type: 'button', text: t().questionTransit, onclick: function () { askPrefill(t().sugg[3]); } }))));
  }

  function renderAsk() {
    var box = $('ask');
    var keep = $('askInput') ? $('askInput').value : '';
    box.textContent = '';
    box.append(h('h2', { id: 'h-ask', text: t().askH }), h('p', { class: 'sub', text: t().askSub }));
    var form = h('form', { class: 'ask-box', onsubmit: function (ev) { ev.preventDefault(); submitAsk($('askInput').value); } },
      h('input', { id: 'askInput', type: 'text', maxlength: '300', placeholder: t().askPh, 'aria-label': t().askPh, autocomplete: 'off', value: keep }),
      h('button', { class: 'btn primary', type: 'submit', text: t().askBtn, disabled: state.asking }));
    box.append(form);
    var sg = h('div', { class: 'sugg' });
    t().sugg.forEach(function (s) { sg.appendChild(h('button', { class: 'btn sm', type: 'button', text: s, onclick: function () { $('askInput').value = s; submitAsk(s); } })); });
    box.append(sg);
    var out = h('div', { id: 'askOut', 'aria-live': 'polite' });
    if (state.asking) out.append(h('div', { class: 'skel' }), h('p', { class: 'ai-note', text: t().asking }));
    else if (state.answer) {
      var a = state.answer;
      var jump = a.kind === 'screen' || a.menu ? ({ weather: 'safety', air: 'safety', events: 'events', places: 'places', trash: 'life' })[a.menu] : null;
      out.append(h('div', { class: 'ans' + (a.kind === 'nodata' || a.kind === 'error' ? ' nodata' : '') },
        h('p', { text: a.answer }),
        a.sources && a.sources.length ? h('div', { class: 'meta' }, h('span', { text: t().sources + ': ' + a.sources.join(' / '), lang: 'ko' })) : null,
        a.kind === 'answer' ? h('div', { class: 'meta' }, h('span', { text: t().answeredBy + (a.ai && a.ai.provider ? ' (' + a.ai.provider + ')' : '') }), h('span', { text: t().check })) : null,
        jump ? h('div', null, h('a', { class: 'btn sm', href: '#' + jump, text: t().goMenu + ' →' })) : null));
    }
    box.append(out);
  }

  function renderMore() {
    var box = $('more'); box.textContent = '';
    box.append(h('h2', { id: 'h-more', text: t().moreH }), h('p', { class: 'sub' }));
    function lk(href, a, b) { return h('a', { href: href, target: href.indexOf('tel:') === 0 ? null : '_blank', rel: 'noopener' }, a, h('span', { text: b })); }
    box.append(h('div', { class: 'links' },
      lk('tel:1330', t().more1330, t().more1330s), lk('tel:120', t().more120, t().more120s),
      lk('https://sb.go.kr/en', t().moreSb, t().moreSbs), lk('https://english.visitseoul.net', t().moreVs, t().moreVss)));
  }

  function renderAll() { renderChrome(); renderStay(); renderSafety(); renderPlaces(); renderFood(); renderEvents(); renderLife(); renderAsk(); renderMore(); observeMenu(); }

  /* ---------- 데이터 받기 ---------- */
  function loadStayData() {
    state.places = null; state.food = null; state.life = null; state.reason = null;
    renderPlaces(); renderFood(); renderLife();
    if (!state.stay) return; // 숙소를 아직 고르지 않았다
    var tt = today();
    var bad = tt.bad ? '1' : '0';
    lastPlacesKey = state.stay + ':' + bad;
    getJson('/api/places?stay=' + state.stay + '&bad=' + bad).then(function (r) { state.places = r; renderPlaces(); });
    getJson('/api/food?stay=' + state.stay).then(function (r) { state.food = r; renderFood(); });
    getJson('/api/life?stay=' + state.stay).then(function (r) { state.life = r; renderLife(); });
    loadReason();
  }
  // 같은 조건(숙소 + 날씨 나쁨 여부)으로는 관광지를 다시 받지 않는다 (공기 · 날씨 응답이 차례로 와도 중복 호출 방지)
  var lastPlacesKey = '';
  function loadPlacesOnly() {
    if (!state.stay) return;
    var key = state.stay + ':' + (today().bad ? '1' : '0');
    if (key !== lastPlacesKey) {
      lastPlacesKey = key;
      getJson('/api/places?stay=' + state.stay + '&bad=' + (today().bad ? '1' : '0')).then(function (r) { state.places = r; renderPlaces(); });
    }
    loadReason();
  }
  // 추천 이유(AI)는 공기 · 날씨 응답이 모두 도착한 뒤 한 번만 받는다 (짧게 모아서 중복 호출을 합친다)
  var reasonSeq = 0, reasonTimer = null;
  function loadReason() {
    if (!state.stay || !state.air || !state.weather) return;
    clearTimeout(reasonTimer);
    reasonTimer = setTimeout(function () {
      var tt = today(), seq = ++reasonSeq;
      state.reason = null;
      getJson('/api/reason?stay=' + state.stay + '&lang=' + state.lang + '&bad=' + (tt.bad ? '1' : '0') + '&why=' + tt.why).then(function (r) { if (seq === reasonSeq) { state.reason = r; renderPlaces(); } });
    }, 250);
  }

  // 언어를 바꾸면 이전 언어로 쓴 AI 문장을 먼저 지우고 그린다 (새 문장이 올 때까지 이전 언어가 남지 않게)
  function setLang(l) { state.lang = l; store('sp-lang', l); state.answer = null; state.reason = null; renderAll(); loadReason(); }
  function setStay(id) {
    state.stay = id; store('sp-stay', id);
    var u = new URL(location.href); u.searchParams.set('stay', id); history.replaceState(null, '', u);
    renderStay(); loadStayData();
  }
  function setOverride(o) { state.override = o; renderSafety(); loadPlacesOnly(); }

  function submitAsk(text) {
    text = String(text || '').trim();
    if (!text || state.asking) return;
    state.asking = true; state.answer = null; renderAsk();
    getJson('/api/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q: text, lang: state.lang }) }).then(function (r) {
      state.asking = false;
      state.answer = r && r.answer ? r : { kind: 'nodata', answer: t().askFail, sources: [] };
      renderAsk();
    });
  }

  /* ---------- 메뉴 칩: 지금 보는 구역 표시 ---------- */
  var io = null;
  function observeMenu() {
    if (!('IntersectionObserver' in window)) return;
    if (io) io.disconnect();
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        document.querySelectorAll('#menu a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-id') === en.target.id); });
      });
    }, { rootMargin: '-120px 0px -65% 0px' });
    MENU_IDS.forEach(function (id) { var el = $(id); if (el) io.observe(el); });
  }

  $('themeBtn').addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur); store('sp-theme', cur); renderChrome(); observeMenu();
  });

  /* ---------- 시작 ---------- */
  renderAll();
  getJson('/api/stays').then(function (r) {
    state.stays = (r && r.stays) || [];
    state.builtAt = (r && r.builtAt) || '';
    if (!stayObj()) state.stay = null;
    renderChrome(); renderStay();
    loadStayData();
  });
  function loadAir() { state.air = null; renderSafety(); getJson('/api/air').then(function (r) { state.air = r; renderSafety(); loadPlacesOnly(); }); }
  function loadWeather() { state.weather = null; renderSafety(); getJson('/api/weather').then(function (r) { state.weather = r; renderSafety(); loadPlacesOnly(); }); }
  function loadEvents() { state.events = null; renderEvents(); getJson('/api/events').then(function (r) { state.events = r; renderEvents(); }); }
  loadAir(); loadWeather(); loadEvents();
})();
