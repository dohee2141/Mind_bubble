// 제출용 프로토타입 시나리오 테스트 (탭 1 규칙 쪽)
// 실행: node scripts/test-emotion-scenarios.ts
import { findEmotions } from '../prototype/emotion-cards/emotion-lexicon.ts'
import { BOOKS, DEFAULT_BOOK_IDS, recommendByKeyword } from '../prototype/emotion-cards/recommend.ts'

/** 탭 1과 같은 흐름: 감정 찾기 → 있으면 추천, 없으면 기본 추천 */
function run(input: string) {
  const found = findEmotions(input)
  const books = !input.trim()
    ? []
    : found.length
      ? recommendByKeyword(found.map((f) => f.keyword).join(' '), 3).recommendations.map((r) => r.book)
      : DEFAULT_BOOK_IDS.map((id) => BOOKS.find((b) => b.id === id)!)
  return { emotions: found.map((f) => f.emotion), words: found.map((f) => f.word), books }
}

type R = ReturnType<typeof run>
const cases: { id: string; kind: string; input: string; expect: string; check: (r: R) => boolean }[] = [
  // ① 문제별 확인
  { id: 'F1', kind: '수정 확인', input: '발표 앞두고 손이 떨려', expect: '감정: 불안', check: (r) => r.emotions.includes('불안') },
  { id: 'F2', kind: '수정 확인', input: '불안한 건 아닌데 마음이 허해', expect: '불안 제외, 감정: 공허', check: (r) => !r.emotions.includes('불안') && r.emotions.includes('공허') },
  { id: 'F3', kind: '수정 확인', input: '불안해요', expect: '3권 모두 불안·미래 분류 (『사랑의 기술』 없음)', check: (r) => r.books.every((b) => b.category === 'future') },
  { id: 'F4', kind: '수정 확인', input: '오늘 날씨 좋다', expect: '사전에 없음 + 기본 추천 3권 고정', check: (r) => r.emotions.length === 0 && r.books.map((b) => b.id).join() === DEFAULT_BOOK_IDS.join() },
  { id: 'F5', kind: '수정 확인', input: '불안해요 (2회)', expect: '두 번 모두 같은 순서', check: () => run('불안해요').books.map((b) => b.id).join() === run('불안해요').books.map((b) => b.id).join() },
  { id: 'F6', kind: '수정 확인', input: '시험 끝나서 신나', expect: '압박으로 분류되지 않음', check: (r) => !r.emotions.includes('압박') },
  // ② 시나리오
  { id: 'S1', kind: '정상', input: '발표 앞두고 불안해', expect: '감정: 불안 / 불안 관련 책 3권', check: (r) => r.emotions.join() === '불안' && r.books.length === 3 && r.books.every((b) => b.category === 'future') },
  { id: 'S2', kind: '정상', input: '요즘 지치고 외로워', expect: '감정: 지침, 외로움 / 책 3권', check: (r) => r.emotions.join() === '지침,외로움' && r.books.length === 3 },
  { id: 'S3', kind: '정상', input: '생각이 많아서 잠이 안 와요', expect: '감정: 생각 많음, 불면 / 책 3권', check: (r) => r.emotions.join() === '생각 많음,불면' && r.books.length === 3 },
  { id: 'S4', kind: '정상', input: '이별 (감정 버튼)', expect: '감정: 이별 / 사랑 분류 책 3권', check: () => { const r = run('이별'); return r.emotions.join() === '이별' && r.books.every((b) => b.category === 'love') } },
  { id: 'S6', kind: '예외', input: '친구가 내 생일을 잊어버렸어', expect: '감정: 상처 (수정 1로 단어장에 추가됨)', check: (r) => r.emotions.includes('상처') && r.books.length === 3 },
  { id: 'S6b', kind: '예외', input: '오늘 점심 뭐 먹지', expect: '사전에 없음 + 기본 추천 3권 + 감정 9개', check: (r) => r.emotions.length === 0 && r.books.length === 3 },
  { id: 'S7', kind: '예외', input: '불안하지 않아요. 그냥 외로워', expect: '불안 제외, 감정: 외로움', check: (r) => r.emotions.join() === '외로움' },
  { id: 'S8', kind: '예외', input: '짝사랑하던 사람이랑 헤어졌어요', expect: '감정: 짝사랑, 이별', check: (r) => r.emotions.join() === '짝사랑,이별' },
  { id: 'S9', kind: '예외', input: '시험 때문에 스트레스 받아', expect: '감정: 압박 (한 번만)', check: (r) => r.emotions.join() === '압박' },
  { id: 'S10', kind: '실패', input: '   ', expect: '결과 없음', check: (r) => r.emotions.length === 0 && r.books.length === 0 },
]

let pass = 0
for (const c of cases) {
  const r = run(c.input.replace(/ \(.*\)$/, ''))
  const ok = c.check(r)
  if (ok) pass++
  const actual = `${r.emotions.join(', ') || '감정 없음'} | ${r.books.map((b) => b.title).join(' / ') || '책 없음'}`
  console.log(`${ok ? 'PASS' : 'FAIL'}\t${c.id}\t${c.kind}\t${c.input}\t${c.expect}\t${actual}`)
}
console.log(`\n${pass}/${cases.length} 통과`)
process.exitCode = pass === cases.length ? 0 : 1
