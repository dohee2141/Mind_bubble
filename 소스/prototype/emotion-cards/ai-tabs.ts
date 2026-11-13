// 감정책방 감정 책 추천 (탭 1: 마음 단어로 찾기 / 탭 2: AI에게 물어보기) · 한국어/English
// 빌드: node scripts/build-emotion-cards.mjs  →  ai-tabs.html (아티팩트로 올리는 파일)
// 탭 1: findEmotions → recommendByKeyword, 못 찾으면 기본 추천 3권 + 감정 9개

import { BOOKS, DEFAULT_BOOK_IDS, recommendByKeyword, type Book } from './recommend.ts'
import { findEmotions } from './emotion-lexicon.ts'

type Lang = 'ko' | 'en'

const I18N = {
  ko: {
    title: '감정책방',
    sub: '오늘 마음에 맞는 책 세 권을 골라 드려요',
    tabRule: '마음 단어로 찾기',
    tabAi: 'AI에게 물어보기',
    ask: '오늘 마음을 한 문장으로 적어 주세요',
    phRule: '예: 발표 앞두고 불안해',
    phAi: '예: 불안한 건 아닌데 마음이 허해',
    submit: '책 추천받기',
    hintRule: '',
    hintAi: '감정 단어가 없어도 괜찮아요. 처음 한 번은 Claude 사용 허용 창이 떠요.',
    tryThis: '이렇게 써 보세요',
    moodPre: '지금 마음은 ',
    moodPost: '에 가까워 보여요',
    unknown: '아직 잘 모르는 말이에요. 이 중에 가까운 마음이 있나요?',
    howAbout: '이 책들은 어때요?',
    thinking: '마음을 읽고 있어요…',
    noEmotion: '마음이 잘 드러나지 않았어요. 지금 기분을 조금 더 적어 주세요.',
    noAi: '여기서는 AI에게 물어볼 수 없어요. claude.ai에 로그인한 상태로 열어 주세요.',
    goRule: '마음 단어로 찾기',
    err_not_granted: 'Claude 사용을 허용하지 않아 AI에게 물어볼 수 없어요. "마음 단어로 찾기"는 계속 쓸 수 있어요.',
    err_sampling_disabled: '이 계정에서는 AI에게 물어볼 수 없어요. "마음 단어로 찾기"를 써 주세요.',
    err_rate_limited: '잠깐 쉬었다가 다시 눌러 주세요.',
    err_session_expired: '로그인이 만료됐어요. 다시 로그인한 뒤 눌러 주세요.',
    err_invalid_json: '답을 제대로 받지 못했어요. 한 번 더 눌러 주세요.',
    err_refused: '이 문장에는 답하기 어려워요. 표현을 바꿔 다시 적어 주세요.',
    err_other: '연결이 잠시 끊겼어요. 다시 눌러 주세요.',
  },
  en: {
    title: 'Emotion Bookshop',
    sub: 'Three books picked for how you feel today',
    tabRule: 'Find by feeling words',
    tabAi: 'Ask AI',
    ask: 'Tell us how you feel in one sentence',
    phRule: 'e.g. 발표 앞두고 불안해',
    phAi: "e.g. I'm not anxious, just feeling empty",
    submit: 'Get books',
    hintRule: 'This tab understands Korean sentences only. Use "Ask AI" for English.',
    hintAi: "No feeling words needed. The first time, you'll be asked to allow Claude.",
    tryThis: 'Try',
    moodPre: 'You seem to be feeling ',
    moodPost: '',
    unknown: "We don't know that word yet. Is one of these close?",
    howAbout: 'How about these books?',
    thinking: 'Reading how you feel…',
    noEmotion: "We couldn't tell how you feel. Tell us a little more.",
    noAi: "AI isn't available here. Open this page while signed in to claude.ai.",
    goRule: 'Find by feeling words',
    err_not_granted: 'Claude access was not allowed, so AI can\'t be used. "Find by feeling words" still works.',
    err_sampling_disabled: 'AI is not available for this account. Please use "Find by feeling words".',
    err_rate_limited: 'Please wait a moment and try again.',
    err_session_expired: 'Your sign-in expired. Sign in again and try once more.',
    err_invalid_json: "We didn't get a proper answer. Please try again.",
    err_refused: "We can't answer that sentence. Try putting it differently.",
    err_other: 'The connection dropped. Please try again.',
  },
} as const
type Key = keyof (typeof I18N)['ko']

/** 감정 이름 영어 표기 (단어장 25개) */
const EMO_EN: Record<string, string> = {
  불안: 'anxiety', 걱정: 'worry', 두려움: 'fear', 지침: 'exhaustion', 번아웃: 'burnout', 무기력: 'lethargy',
  우울: 'depression', 슬픔: 'sadness', 외로움: 'loneliness', 상처: 'hurt', 화남: 'anger', 이별: 'breakup',
  그리움: 'longing', 짝사랑: 'unrequited love', 설렘: 'excitement', 질투: 'jealousy', 후회: 'regret',
  막막함: 'feeling lost', 답답함: 'frustration', 압박: 'pressure', 비교: 'comparison', '자존감 낮음': 'low self-esteem',
  공허: 'emptiness', '생각 많음': 'overthinking', 불면: 'sleeplessness',
}

const NINE = ['불안', '지침', '외로움', '이별', '생각 많음', '압박', '무기력', '후회', '상처']
const EXAMPLES_KO = ['발표 앞두고 불안해', '요즘 지치고 외로워', '불안한 건 아닌데 마음이 허해', '서러워서 눈물 나']
const EXAMPLES_EN = ['Nervous before my presentation', 'Tired and lonely lately', "Not anxious, just empty", 'So upset I could cry']

let lang: Lang = 'ko'
try {
  if (localStorage.getItem('mb-lang') === 'en') lang = 'en'
} catch {}
const t = (k: Key) => I18N[lang][k]
const emo = (name: string) => (lang === 'en' ? EMO_EN[name] ?? name : name)

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T
const esc = (s: unknown) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

const cardsHTML = (items: { book: Book; why: string }[]) =>
  '<ol class="books">' +
  items
    .map(
      ({ book, why }) => `<li><span class="em" aria-hidden="true">${book.emoji}</span>
      <div class="bk"><div class="t">『${esc(book.title)}』</div><div class="a">${esc(book.author)}</div>
      <div class="w">${esc(why)}</div></div></li>`,
    )
    .join('') +
  '</ol>'

/** label: 보이는 글자, q: 실제로 넣을 문장 */
const chipsHTML = (items: { label: string; q: string }[]) =>
  items.map((c) => `<button type="button" class="chip" data-q="${esc(c.q)}">${esc(c.label)}</button>`).join('')

const moodHTML = (names: string) => `<p class="mood">${esc(t('moodPre'))}<b>${names}</b>${esc(t('moodPost'))}</p>`
const defaults = () => DEFAULT_BOOK_IDS.map((id) => BOOKS.find((b) => b.id === id)!)

/* ─────────── 탭 1: 마음 단어로 찾기 ─────────── */

let lastRule = ''
function ruleRespond(raw: string) {
  const input = raw.trim()
  if (!input) return
  lastRule = input
  const found = findEmotions(input)
  const out = $('#out-rule')
  if (found.length) {
    const books = recommendByKeyword(found.map((f) => f.keyword).join(' '), 3).recommendations.map((r) => ({
      book: r.book,
      why: r.book.note,
    }))
    out.innerHTML = moodHTML(found.map((f) => esc(emo(f.emotion))).join(', ')) + cardsHTML(books)
  } else {
    out.innerHTML =
      `<div class="soft"><p>${esc(t('unknown'))}</p><div class="chips">${chipsHTML(NINE.map((n) => ({ label: emo(n), q: n })))}</div></div>` +
      `<p class="mood">${esc(t('howAbout'))}</p>` +
      cardsHTML(defaults().map((book) => ({ book, why: book.note })))
  }
}

/* ─────────── 탭 2: AI에게 물어보기 ─────────── */

type Sample = ((input: string, opts?: object) => Promise<{ text: string }>) & {
  json: <T>(input: string, opts?: object) => Promise<T>
}
interface AiAnswer {
  emotion?: unknown
  secondary?: unknown
  read?: unknown
  books?: unknown
}

let samplePromise: Promise<Sample | null> | null = null
function getSample(): Promise<Sample | null> {
  const w = window as unknown as { claude?: { use: (n: string) => Promise<Sample | null> } }
  if (!samplePromise) samplePromise = (w.claude ? w.claude.use('sample') : Promise.resolve(null)).catch(() => null)
  return samplePromise
}
let aiOff = false

const CATALOG = BOOKS.map(
  (b) => `${b.id} | 『${b.title}』 ${b.author} | 이런 마음일 때: ${b.mood} | 키워드: ${b.keywords.join(', ')}`,
).join('\n')

function buildPrompt(input: string): string {
  const out =
    lang === 'en'
      ? 'emotion, secondary, why, read 는 모두 자연스러운 영어로 쓴다(emotion은 1~3단어 소문자).'
      : 'emotion은 짧은 한국어 명사(1~6자), why와 read는 한국어 해요체로 쓴다.'
  return `너는 독서 큐레이터다. 사용자가 지금 마음을 한 문장으로 적었다(한국어 또는 영어). 문장 전체의 뜻을 읽고 감정을 판단한 뒤, 아래 책 목록에서만 책 3권을 골라라.

규칙:
- ${out}
- emotion: 가장 강한 감정 하나. secondary: 함께 느껴지는 감정 최대 2개, 없으면 빈 배열.
- 부정 표현("안 ~해", "~지 않아", "~한 건 아닌데", "not ~")이 붙은 감정은 제외한다.
- books: 반드시 아래 목록의 id로만, 서로 다른 책 3권. 목록에 없는 책은 고르지 않는다.
- why: 사용자의 문장을 직접 반영한 한 문장(60자/100 characters 이내). 책 줄거리를 지어내지 말고 감정과의 연결만 말한다.
- read: 사용자의 마음을 다정하게 짚어 주는 한 문장.
- 감정 표현이 전혀 없으면 emotion을 null, books를 빈 배열로 한다.

책 목록:
${CATALOG}

JSON 하나만 답한다:
{"emotion":"감정 또는 null","secondary":["감정"],"read":"한 문장","books":[{"id":"책 id","why":"이유"}]}

사용자 문장: """${input.slice(0, 300)}"""`
}

const STOP_CODES = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed']
const errText = (code: string) => {
  const k = `err_${code}` as Key
  return k in I18N.ko ? t(k) : t('err_other')
}

const strList = (v: unknown, n: number) =>
  (Array.isArray(v) ? v : []).filter((x): x is string => typeof x === 'string' && x.trim() !== '').slice(0, n)

const goRuleHTML = () =>
  `<div class="chips"><button type="button" class="chip" data-go="rule">${esc(t('goRule'))}</button></div>`

async function aiRespond(raw: string) {
  const input = raw.trim()
  if (!input || aiOff) return
  const out = $('#out-ai')
  const btn = $<HTMLButtonElement>('#b-ai')
  out.innerHTML = `<p class="thinking">${esc(t('thinking'))}</p>`
  btn.disabled = true

  const sample = await getSample()
  if (!sample) {
    out.innerHTML = `<div class="soft"><p>${esc(t('noAi'))}</p>${goRuleHTML()}</div>`
    btn.disabled = false
    return
  }

  try {
    const res = await sample.json<AiAnswer>(buildPrompt(input), { modelTier: 'quick' })
    const emotion =
      typeof res?.emotion === 'string' && res.emotion.trim() && res.emotion.trim() !== 'null'
        ? res.emotion.trim().slice(0, 24)
        : null
    const secondary = strList(res?.secondary, 2).filter((s) => s !== emotion)
    const read = typeof res?.read === 'string' ? res.read : ''

    if (!emotion) {
      out.innerHTML =
        `<div class="soft"><p>${esc(t('noEmotion'))}</p></div>` +
        `<p class="mood">${esc(t('howAbout'))}</p>` +
        cardsHTML(defaults().map((book) => ({ book, why: book.note })))
    } else {
      // 목록 밖·중복 책은 빼고, 모자라면 같은 추천 방법으로 채워요
      const picked: { book: Book; why: string }[] = []
      for (const b of Array.isArray(res?.books) ? res.books : []) {
        const item = (b ?? {}) as { id?: unknown; why?: unknown }
        const book = BOOKS.find((x) => x.id === String(item.id ?? '').trim())
        if (book && !picked.some((p) => p.book.id === book.id) && picked.length < 3)
          picked.push({ book, why: String(item.why ?? '').slice(0, 160) || book.note })
      }
      for (const r of recommendByKeyword([emotion, ...secondary].join(' '), 6).recommendations) {
        if (picked.length < 3 && !picked.some((p) => p.book.id === r.book.id)) picked.push({ book: r.book, why: r.book.note })
      }
      out.innerHTML =
        moodHTML(esc(emotion) + (secondary.length ? ', ' + secondary.map(esc).join(', ') : '')) +
        (read ? `<p class="read">${esc(read)}</p>` : '') +
        cardsHTML(picked)
    }
  } catch (e) {
    const code = (e as { code?: string })?.code ?? ''
    const stop = STOP_CODES.includes(code)
    out.innerHTML = `<div class="soft"><p>${esc(errText(code))}</p>${stop ? goRuleHTML() : ''}</div>`
    if (stop) {
      aiOff = true
      $<HTMLTextAreaElement>('#q-ai').disabled = true
      return
    }
  }
  btn.disabled = false
}

/* ─────────── 언어 ─────────── */

function applyLang() {
  document.documentElement.lang = lang
  document.title = t('title')
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const v = t(el.dataset.i18n as Key)
    el.textContent = v
    if (el.classList.contains('hint')) el.hidden = !v
  })
  document.querySelectorAll<HTMLTextAreaElement>('[data-i18n-ph]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPh as Key)
  })
  document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang))
  })
  // 단어 탭은 한국어 문장만 알아들어서 예시는 늘 한국어, AI 탭 예시는 언어에 맞춰요
  $('#chips-rule').innerHTML =
    `<span class="lbl">${esc(t('tryThis'))}</span>` + chipsHTML(EXAMPLES_KO.map((q) => ({ label: q, q })))
  $('#chips-ai').innerHTML =
    `<span class="lbl">${esc(t('tryThis'))}</span>` +
    chipsHTML((lang === 'en' ? EXAMPLES_EN : EXAMPLES_KO).map((q) => ({ label: q, q })))
  if (lastRule) ruleRespond(lastRule)
  $('#out-ai').innerHTML = ''
}

document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach((b) =>
  b.addEventListener('click', () => {
    lang = b.dataset.lang === 'en' ? 'en' : 'ko'
    try {
      localStorage.setItem('mb-lang', lang)
    } catch {}
    applyLang()
  }),
)

/* ─────────── 화면 연결 ─────────── */

for (const [form, q, count, fn] of [
  ['#f-rule', '#q-rule', '#c-rule', ruleRespond],
  ['#f-ai', '#q-ai', '#c-ai', aiRespond],
] as const) {
  const ta = $<HTMLTextAreaElement>(q)
  ta.addEventListener('input', () => ($(count).textContent = `${ta.value.length}/300`))
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault()
      $<HTMLFormElement>(form).requestSubmit()
    }
  })
  $(form).addEventListener('submit', (e) => {
    e.preventDefault()
    if (fn === aiRespond && $<HTMLButtonElement>('#b-ai').disabled) return
    fn(ta.value)
  })
}

function fillAndRun(panel: 'rule' | 'ai', text: string) {
  const ta = $<HTMLTextAreaElement>(`#q-${panel}`)
  ta.value = text
  $(`#c-${panel}`).textContent = `${text.length}/300`
  if (panel === 'rule') ruleRespond(text)
  else if (!$<HTMLButtonElement>('#b-ai').disabled) aiRespond(text)
}

for (const panel of ['rule', 'ai'] as const) {
  $(`#p-${panel}`).addEventListener('click', (e) => {
    const el = e.target as HTMLElement
    if (el.closest('button[data-go]')) {
      location.hash = 'rule'
      show('rule')
      return
    }
    const b = el.closest<HTMLButtonElement>('button[data-q]')
    if (b) fillAndRun(panel, b.dataset.q ?? '')
  })
}

// 탭 전환 (#rule / #ai)
const TABS: Record<string, [HTMLElement, HTMLElement]> = {
  rule: [$('#t-rule'), $('#p-rule')],
  ai: [$('#t-ai'), $('#p-ai')],
}
function show(name: string) {
  if (!TABS[name]) name = 'rule'
  for (const [k, [tab, p]] of Object.entries(TABS)) {
    const on = k === name
    tab.setAttribute('aria-selected', String(on))
    tab.tabIndex = on ? 0 : -1
    p.hidden = !on
  }
}
for (const k of Object.keys(TABS)) {
  TABS[k][0].addEventListener('click', () => {
    location.hash = k
    show(k)
  })
}
$('[role=tablist]').addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
  const next = TABS.rule[0].getAttribute('aria-selected') === 'true' ? 'ai' : 'rule'
  location.hash = next
  show(next)
  TABS[next][0].focus()
})
addEventListener('hashchange', () => show(location.hash.slice(1)))
show(location.hash.slice(1))

applyLang()
// 첫 화면: 예시 한 문장 결과를 보여 줘요
fillAndRun('rule', EXAMPLES_KO[0])
