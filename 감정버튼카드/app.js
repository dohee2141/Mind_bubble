"use strict";
(() => {
  // prototype/emotion-cards/recommend.ts
  var BOOKS = [
    // 💼 일 & 학업
    { id: "atomic-habits", title: "아주 작은 습관의 힘", author: "제임스 클리어", category: "work", mood: "해야 할 일이 너무 커 보여서 시작이 안 될 때", note: "거창한 결심 대신 1%짜리 작은 변화부터. 부담을 잘게 쪼개는 법을 알려줘요.", keywords: ["막막함", "미루기", "게으름", "의욕", "자책", "부담"], emoji: "🧱" },
    { id: "deep-work", title: "딥 워크", author: "칼 뉴포트", category: "work", mood: "하루 종일 바빴는데 한 게 없는 것 같을 때", note: "알림과 산만함에서 벗어나 정말 중요한 일에 집중하는 시간을 되찾게 해줘요.", keywords: ["산만함", "집중", "조급함", "허무", "바쁨"], emoji: "🎯" },
    { id: "hamatomyeon", title: "하마터면 열심히 살 뻔했다", author: "하완", category: "work", mood: "열심히 사는데도 늘 뒤처지는 기분일 때", note: '"꼭 그렇게까지 해야 하나?" 하고 한숨 돌리게 해주는 유쾌한 에세이예요.', keywords: ["뒤처짐", "비교", "압박", "조급함", "지침", "회의감"], emoji: "🛋️" },
    { id: "joy-and-sorrow-of-work", title: "일의 기쁨과 슬픔", author: "장류진", category: "work", mood: "회사에서 내 자리가 작게만 느껴질 때", note: '직장인의 하루를 담담하고 재치 있게 그린 소설집. "나만 이런 게 아니구나" 하고 웃게 돼요.', keywords: ["회사", "직장", "억울함", "현타", "씁쓸함", "공감"], emoji: "🏢" },
    { id: "essentialism", title: "에센셜리즘", author: "그렉 맥커운", category: "work", mood: "부탁을 거절 못 해서 할 일이 산더미일 때", note: "모든 걸 다 하려는 대신 정말 중요한 몇 가지만 고르는 연습. 마음의 짐이 가벼워져요.", keywords: ["과부하", "거절", "벅참", "압박", "정리", "부담"], emoji: "✂️" },
    { id: "grit", title: "그릿", author: "앤절라 더크워스", category: "work", mood: "재능이 없는 것 같아 포기하고 싶을 때", note: "타고난 재능보다 꾸준함이 더 멀리 간다는 이야기. 시험·공부에 지친 날 다시 힘을 줘요.", keywords: ["포기", "좌절", "시험", "열등감", "실패", "자신감"], emoji: "🌱" },
    // 👥 인간관계
    { id: "courage-to-be-disliked", title: "미움받을 용기", author: "기시미 이치로 · 고가 후미타케", category: "people", mood: "남들의 시선과 기대가 너무 신경 쓰일 때", note: "타인의 과제와 나의 과제를 나누는 법. 관계의 무게를 덜어줘요.", keywords: ["눈치", "시선", "인정욕구", "미움", "부담", "자존감"], emoji: "🕊️" },
    { id: "i-decided-to-live-as-me", title: "나는 나로 살기로 했다", author: "김수현", category: "people", mood: "누구에게도 맞추느라 내가 사라진 것 같을 때", note: "남의 기준이 아닌 나의 기준으로 살아도 괜찮다고 다정하게 말해줘요.", keywords: ["자존감", "눈치", "비교", "상처", "위축", "자기혐오"], emoji: "🌷" },
    { id: "you-are-right", title: "당신이 옳다", author: "정혜신", category: "people", mood: "누군가에게 온전히 이해받고 싶을 때", note: "충고보다 공감이 사람을 살린다는 이야기. 나와 주변을 대하는 법이 달라져요.", keywords: ["서운함", "공감", "이해", "상처", "외로움", "위로"], emoji: "🤝" },
    { id: "almond", title: "아몬드", author: "손원평", category: "people", mood: "마음을 표현하는 게 서툴러 외로울 때", note: "감정을 잘 느끼지 못하는 소년이 사람을 통해 변해가는 따뜻한 소설이에요.", keywords: ["외로움", "고립", "표현", "서툼", "공허"], emoji: "🌰" },
    { id: "reading-relationships", title: "관계를 읽는 시간", author: "문요한", category: "people", mood: "가까운 사람 때문에 자꾸 지치고 상처받을 때", note: '나와 너 사이의 적당한 거리, "바운더리"를 세우는 법을 차분하게 알려줘요.', keywords: ["갈등", "상처", "배신", "거리두기", "서운함", "지침", "가족"], emoji: "🪢" },
    { id: "need-to-be-lonely", title: "가끔은 격하게 외로워야 한다", author: "김정운", category: "people", mood: "사람들 속에 있어도 혼자인 것 같을 때", note: "외로움을 피할 대상이 아니라 나를 만나는 시간으로 바꿔 보자는 유쾌한 제안이에요.", keywords: ["외로움", "혼자", "쓸쓸함", "고독", "소외감"], emoji: "🏝️" },
    // ❤️ 사랑
    { id: "essays-in-love", title: "왜 나는 너를 사랑하는가", author: "알랭 드 보통", category: "love", mood: "사랑의 시작과 흔들림, 이별까지 마음이 복잡할 때", note: "사랑에 빠지고 아파하는 우리의 마음을 가장 섬세하고 지적인 언어로 어루만져 줘요.", keywords: ["설렘", "혼란", "이별", "집착", "연애"], emoji: "❤️" },
    { id: "art-of-loving", title: "사랑의 기술", author: "에리히 프롬", category: "love", mood: "나를 잃지 않으면서 건강하게 사랑하고 싶을 때", note: "사랑은 감정에만 머무는 게 아니라 나를 먼저 돌보는 단단한 힘에서 시작된다고 말해줘요.", keywords: ["집착", "불안", "의존", "연애", "자존감"], emoji: "💌" },
    { id: "moments-of-love", title: "모든 순간이 너였다", author: "하태완", category: "love", mood: "지친 연애나 짝사랑 끝에 따뜻한 위로가 필요할 때", note: "반짝이던 순간과 아팠던 마음을 다정하게 토닥여 주는 에세이예요.", keywords: ["짝사랑", "그리움", "이별", "위로", "설렘"], emoji: "🌸" },
    { id: "course-of-love", title: "낭만적 연애와 그 후의 일상", author: "알랭 드 보통", category: "love", mood: "오래된 관계가 예전 같지 않아 서운할 때", note: "설렘이 지나간 뒤의 사랑을 솔직하게 들여다봐요. 다툼도 사랑의 일부라고 알려줘요.", keywords: ["권태", "서운함", "다툼", "결혼", "연애", "실망"], emoji: "🏡" },
    { id: "life-of-love", title: "사랑의 생애", author: "이승우", category: "love", mood: "사랑 앞에서 내 마음을 나도 모르겠을 때", note: "사랑이 사람에게 들어와 머물다 가는 과정을 깊이 있게 그린 소설. 복잡한 마음이 정리돼요.", keywords: ["혼란", "짝사랑", "질투", "설렘", "그리움"], emoji: "🫧" },
    { id: "unbearable-lightness", title: "참을 수 없는 존재의 가벼움", author: "밀란 쿤데라", category: "love", mood: '이별 뒤에 "그때 다른 선택을 했다면" 하고 맴돌 때', note: "사랑과 선택, 무거움과 가벼움을 묻는 소설. 아픈 마음을 조금 멀리서 바라보게 해줘요.", keywords: ["이별", "후회", "미련", "선택", "그리움"], emoji: "🎈" },
    // 🌫️ 미래 & 불안
    { id: "tteokbokki", title: "죽고 싶지만 떡볶이는 먹고 싶어", author: "백세희", category: "future", mood: "이유 없이 불안하고 마음이 가라앉을 때", note: '가벼운 우울과 불안을 솔직하게 들여다본 상담 기록. "나만 그런 게 아니구나" 싶어져요.', keywords: ["우울", "불안", "무기력", "공허", "자기혐오"], emoji: "🍢" },
    { id: "namiya", title: "나미야 잡화점의 기적", author: "히가시노 게이고", category: "future", mood: "어떤 선택을 해야 할지 막막할 때", note: "고민 편지에 답장을 해주는 잡화점 이야기. 내 고민에도 답이 올 것 같은 기분이 들어요.", keywords: ["막막함", "선택", "진로", "고민", "희망"], emoji: "✉️" },
    { id: "fish-dont-exist", title: "물고기는 존재하지 않는다", author: "룰루 밀러", category: "future", mood: "세상이 정한 정답에서 벗어난 것 같아 두려울 때", note: "혼돈 속에서도 의미를 찾아가는 과정. 불확실함을 조금 덜 무섭게 만들어줘요.", keywords: ["두려움", "혼란", "불확실", "좌절", "의미"], emoji: "🐟" },
    { id: "midnight-library", title: "미드나잇 라이브러리", author: "매트 헤이그", category: "future", mood: '"그때 다른 길을 갔다면" 하는 후회가 클 때', note: "살아보지 못한 삶들을 둘러보는 도서관 이야기. 지금 내 삶을 다시 보듬게 돼요.", keywords: ["후회", "우울", "절망", "선택", "진로", "희망"], emoji: "📖" },
    { id: "status-anxiety", title: "불안", author: "알랭 드 보통", category: "future", mood: "남들보다 뒤처질까 봐 늘 초조할 때", note: "왜 우리는 지위와 성공 때문에 불안해할까? 그 뿌리를 알면 불안이 조금 작아져요.", keywords: ["불안", "초조", "비교", "뒤처짐", "성공", "조급함"], emoji: "🌀" },
    { id: "mans-search-for-meaning", title: "죽음의 수용소에서", author: "빅터 프랭클", category: "future", mood: "살아가는 이유를 잘 모르겠을 때", note: "가장 어두운 곳에서도 의미를 찾은 기록. 버티는 힘이 어디서 오는지 알려줘요.", keywords: ["절망", "허무", "의미", "고통", "희망", "공허"], emoji: "🕯️" },
    // 🔋 피로 & 번아웃
    { id: "stop-and-see", title: "멈추면, 비로소 보이는 것들", author: "혜민", category: "burnout", mood: "멈추면 안 될 것 같아서 계속 달리고 있을 때", note: "짧은 글들이라 지친 날에도 한 페이지씩 읽기 좋아요. 쉬어도 된다는 허락 같은 책.", keywords: ["지침", "피곤", "조급함", "휴식", "위로"], emoji: "🍃" },
    { id: "dallergut", title: "달러구트 꿈 백화점", author: "이미예", category: "burnout", mood: "잠들기 전까지 머리가 쉬지 않을 때", note: "꿈을 사고파는 상점이라는 포근한 상상. 잠들기 전에 읽기 딱 좋은 소설이에요.", keywords: ["불면", "피곤", "잠", "휴식", "포근함"], emoji: "🌙" },
    { id: "convenience-store", title: "불편한 편의점", author: "김호연", category: "burnout", mood: "사람의 온기가 그리운 지친 날", note: "동네 편의점에 모인 사람들이 서로를 조금씩 회복시키는 이야기. 읽고 나면 마음이 데워져요.", keywords: ["지침", "외로움", "회복", "따뜻함", "위로"], emoji: "🏪" },
    { id: "hyunam-dong-bookshop", title: "어서 오세요, 휴남동 서점입니다", author: "황보름", category: "burnout", mood: "다 내려놓고 잠시 숨고 싶을 때", note: "번아웃 끝에 작은 서점을 연 사람과 손님들의 이야기. 천천히 살아도 괜찮다고 말해줘요.", keywords: ["번아웃", "무기력", "퇴사", "지침", "휴식", "회복"], emoji: "☕" },
    { id: "forest-capitalist", title: "숲속의 자본주의자", author: "박혜윤", category: "burnout", mood: "더 많이 벌고 더 바쁘게 사는 게 지겨울 때", note: '시골에서 최소한으로 일하며 사는 가족의 이야기. "덜 해도 된다"는 감각을 되찾아줘요.', keywords: ["번아웃", "회의감", "지침", "권태", "쉼"], emoji: "🌲" },
    { id: "walden", title: "월든", author: "헨리 데이비드 소로", category: "burnout", mood: "복잡한 일상에서 잠시 벗어나고 싶을 때", note: "호숫가 오두막에서 보낸 단순한 삶의 기록. 한 장씩 천천히 읽으면 숨이 고르게 쉬어져요.", keywords: ["번아웃", "피로", "복잡함", "도피", "쉼", "자연"], emoji: "🛶" },
    // 💭 사소한 생각
    { id: "temperature-of-language", title: "언어의 온도", author: "이기주", category: "thoughts", mood: "누군가의 말 한마디가 계속 마음에 남을 때", note: "말과 글에 담긴 온도를 다룬 에세이. 내가 쓰는 말도, 들은 말도 다시 보게 돼요.", keywords: ["상처", "말", "서운함", "곱씹음", "예민함"], emoji: "💬" },
    { id: "reasons-for-travel", title: "여행의 이유", author: "김영하", category: "thoughts", mood: "생각이 꼬리를 물어 어디론가 떠나고 싶을 때", note: "여행을 통해 나를 돌아보는 산문. 복잡한 머릿속에 창문을 하나 열어주는 느낌이에요.", keywords: ["답답함", "권태", "도피", "복잡함", "떠나고싶음"], emoji: "🧳" },
    { id: "little-prince", title: "어린 왕자", author: "앙투안 드 생텍쥐페리", category: "thoughts", mood: "어른이 되면서 잊어버린 것이 그리울 때", note: "다시 읽을 때마다 다르게 다가오는 책. 정말 중요한 게 무엇인지 조용히 묻게 돼요.", keywords: ["그리움", "공허", "순수", "외로움", "허무"], emoji: "🌹" },
    { id: "ordinary-existence", title: "보통의 존재", author: "이석원", category: "thoughts", mood: "나만 특별히 못난 것 같은 밤", note: "평범한 사람의 솔직한 고백들. 누구나 이 정도는 흔들린다는 걸 알게 돼요.", keywords: ["자기혐오", "자존감", "우울", "공허", "쓸쓸함"], emoji: "🌃" },
    { id: "too-many-thoughts", title: "나는 생각이 너무 많아", author: "크리스텔 프티콜랭", category: "thoughts", mood: "사소한 일도 끝없이 곱씹느라 지칠 때", note: "생각이 많은 건 결함이 아니라 특성이라고 말해줘요. 예민한 나를 이해하는 데 도움이 돼요.", keywords: ["생각많음", "예민함", "곱씹음", "걱정", "불면", "과민"], emoji: "🧠" },
    { id: "frame", title: "프레임", author: "최인철", category: "thoughts", mood: "같은 일도 늘 나쁜 쪽으로만 보일 때", note: '세상을 보는 "마음의 창"을 바꾸면 같은 하루도 달라진다는 심리학 이야기예요.', keywords: ["부정적", "비관", "걱정", "관점", "불만"], emoji: "🖼️" }
  ];
  var EMOTION_TO_CATEGORY = {
    work: ["일", "공부", "시험", "회사", "직장", "야근", "마감", "성적", "취업", "압박", "스트레스", "미루기", "집중"],
    people: ["관계", "친구", "가족", "외로", "눈치", "서운", "상처", "미움", "갈등", "소외", "혼자"],
    love: ["사랑", "연애", "이별", "짝사랑", "설렘", "그리움", "헤어", "미련", "질투", "권태"],
    future: ["불안", "두려", "걱정", "진로", "미래", "우울", "막막", "초조", "절망", "후회"],
    burnout: ["지침", "지쳐", "지친", "피곤", "번아웃", "무기력", "힘들", "쉬고", "휴식", "불면", "퇴사"],
    thoughts: ["생각", "잡념", "곱씹", "예민", "복잡", "답답", "공허", "허무", "자존감"]
  };
  function tokenize(input) {
    return input.split(/[\s,./!?~·]+/).map((w) => w.trim()).filter((w) => w.length > 0);
  }
  function stem(word) {
    return word.replace(/(했어요|해요|하고|하다|해서|하게|해|요|감|함|이|가|을|를|은|는|과|와|에|도)$/u, "") || word;
  }
  function matches(a, b) {
    if (a.length < 1 || b.length < 1) return false;
    return a.includes(b) || b.includes(a);
  }
  var DEFAULT_BOOK_IDS = ["convenience-store", "stop-and-see", "little-prince"];
  function recommendByKeyword(input, count = 3) {
    const words = tokenize(input).map(stem).filter((w) => w.length > 0);
    if (words.length === 0) return { recommendations: [], category: null, exact: false };
    const categoryScore = {};
    for (const [cat, emotions] of Object.entries(EMOTION_TO_CATEGORY)) {
      for (const w of words) {
        if (emotions.some((e) => matches(w, e))) categoryScore[cat] = (categoryScore[cat] ?? 0) + 1;
      }
    }
    const topCategory = Object.entries(categoryScore).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const scored = BOOKS.map((book, index) => {
      let score = 0;
      const matched = /* @__PURE__ */ new Set();
      for (const w of words) {
        for (const k of book.keywords) {
          if (matches(w, k)) {
            score += 3;
            matched.add(k);
          }
        }
        if (w.length >= 2 && (book.mood.includes(w) || book.note.includes(w))) score += 1;
      }
      score += (categoryScore[book.category] ?? 0) * 2;
      return { book, matched: [...matched], score, tie: index };
    });
    const inTop = (s) => Number(topCategory !== null && s.book.category === topCategory);
    const hits = scored.filter((s) => s.score > 0).sort((a, b) => inTop(b) - inTop(a) || b.score - a.score || a.tie - b.tie);
    const exact = hits.length > 0;
    if (!exact && topCategory === null) {
      const defaults = DEFAULT_BOOK_IDS.map((id) => BOOKS.find((b) => b.id === id)).slice(0, count);
      return { recommendations: defaults.map((book) => ({ book, matched: [] })), category: null, exact: false };
    }
    const picked = hits.slice(0, count);
    if (picked.length < count) {
      const used = new Set(picked.map((p) => p.book.id));
      const fallback = scored.filter((s) => !used.has(s.book.id)).sort(
        (a, b) => Number(b.book.category === topCategory) - Number(a.book.category === topCategory) || a.tie - b.tie
      );
      picked.push(...fallback.slice(0, count - picked.length));
    }
    return {
      recommendations: picked.map(({ book, matched }) => ({ book, matched })),
      category: topCategory,
      exact
    };
  }

  // prototype/emotion-cards/app.ts
  var EMOTIONS = [
    { label: "불안해요", emoji: "🌫️", keyword: "불안" },
    { label: "지쳤어요", emoji: "🔋", keyword: "지침" },
    { label: "외로워요", emoji: "🏝️", keyword: "외로움" },
    { label: "이별했어요", emoji: "💔", keyword: "이별" },
    { label: "생각이 많아요", emoji: "💭", keyword: "생각많음" },
    { label: "압박감", emoji: "🧱", keyword: "압박" },
    { label: "무기력해요", emoji: "🫠", keyword: "무기력" },
    { label: "후회돼요", emoji: "🔁", keyword: "후회" },
    { label: "상처받았어요", emoji: "🩹", keyword: "상처" }
  ];
  var CATEGORY_COLOR = {
    work: "#f6c177",
    people: "#f4a3b4",
    love: "#f28fb0",
    future: "#a99cf0",
    burnout: "#8fd3b0",
    thoughts: "#8ec5f0"
  };
  var grid = document.getElementById("emotions");
  var result = document.getElementById("result");
  var heading = document.getElementById("result-heading");
  var cards = document.getElementById("cards");
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  }
  function show(index) {
    const emotion = EMOTIONS[index];
    grid.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(i === index)));
    const { recommendations } = recommendByKeyword(emotion.keyword, 3);
    heading.textContent = `${emotion.emoji} "${emotion.label}" 마음에 건네는 책 3권`;
    cards.innerHTML = recommendations.map(
      ({ book }, i) => `
      <article class="card" style="--accent:${CATEGORY_COLOR[book.category] ?? "#ccc"}; animation-delay:${i * 80}ms">
        <div class="cover"><span>${book.emoji}</span></div>
        <div class="body">
          <h3>${escapeHtml(book.title)}</h3>
          <p class="author">${escapeHtml(book.author)}</p>
          <p class="note">${escapeHtml(book.note)}</p>
        </div>
      </article>`
    ).join("");
    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  grid.innerHTML = EMOTIONS.map(
    (e, i) => `<button type="button" aria-pressed="false" data-i="${i}"><span class="emoji">${e.emoji}</span>${e.label}</button>`
  ).join("");
  grid.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button");
    if (btn) show(Number(btn.dataset.i));
  });
})();
