// 감정 단어장 + 문장에서 감정 단어 찾기 규칙 (제출용 프로토타입 전용)
//
// ■ 단어장 (EMOTION_LEXICON)
//   - emotion : 화면에 보여 줄 감정 이름
//   - keyword : 책 추천(recommendByKeyword)에 넘길 키워드
//   - words   : 문장 속에서 찾을 표현. 활용형이 다 걸리도록 "어간"으로 적어요.
//               예) '지치' → 지치고/지치네 ,  '지쳐' → 지쳐요/지쳐서 ,  '지쳤' → 지쳤어요
//
// ■ 찾기 규칙 (findEmotions)
//   1. 정리: 문장을 소문자로 바꾸고 띄어쓰기·문장부호를 모두 지워요.
//            → "생각이 많아요" 와 "생각이많아요" 를 똑같이 찾을 수 있어요.
//   2. 긴 표현 먼저: 단어장 표현을 길이가 긴 순서로 찾아요.
//            → "짝사랑" 을 먼저 찾고, 그 자리는 "사랑" 으로 다시 세지 않아요.
//   3. 겹침 금지: 이미 찾은 글자 위치와 겹치는 표현은 버려요.
//   4. 감정별로 한 번: 같은 감정이 여러 번 나와도 한 번만 남기고, 문장에 처음 나온 순서대로 돌려줘요.
//   5. 부정 표현: 바로 앞에 "안"·"못"이 붙거나 바로 뒤에 "지않"·"진않"이 붙으면 그 감정은 빼요.
//            → "불안하지 않아요", "안 외로워요" 는 감정으로 세지 않아요. (단순 규칙이라 완벽하진 않아요)

export interface EmotionEntry {
  emotion: string
  keyword: string
  words: string[]
}

export const EMOTION_LEXICON: EmotionEntry[] = [
  { emotion: '불안', keyword: '불안', words: ['불안', '초조', '조마조마', '마음이불편', '긴장', '떨려', '떨리', '떨린'] },
  { emotion: '걱정', keyword: '걱정', words: ['걱정', '염려', '신경쓰여', '신경쓰이'] },
  { emotion: '두려움', keyword: '두려움', words: ['두렵', '두려', '무섭', '무서워', '겁나', '겁이나'] },
  { emotion: '지침', keyword: '지침', words: ['지침', '지치', '지쳐', '지쳤', '지친', '피곤', '힘들', '힘드', '녹초', '기운없', '기운이없'] },
  { emotion: '번아웃', keyword: '번아웃', words: ['번아웃', '탈진', '다타버', '소진'] },
  { emotion: '무기력', keyword: '무기력', words: ['무기력', '의욕없', '의욕이없', '귀찮', '아무것도하기싫', '아무것도못하'] },
  { emotion: '우울', keyword: '우울', words: ['우울', '가라앉', '울적', '기분이안좋', '기분이나빠'] },
  { emotion: '슬픔', keyword: '위로', words: ['슬프', '슬퍼', '슬픔', '눈물', '울고싶', '울었', '서러', '서럽', '서운하고슬'] },
  { emotion: '외로움', keyword: '외로움', words: ['외롭', '외로', '쓸쓸', '혼자인', '혼자라', '고독', '소외'] },
  { emotion: '상처', keyword: '상처', words: ['상처', '속상', '서운', '섭섭', '마음아프', '마음이아프', '잊어버렸', '잊었', '까먹었', '무시당'] },
  { emotion: '화남', keyword: '억울함', words: ['화나', '화가나', '화났', '짜증', '열받', '빡치', '억울', '분노'] },
  { emotion: '이별', keyword: '이별', words: ['이별', '헤어지', '헤어졌', '헤어져', '차였'] },
  { emotion: '그리움', keyword: '그리움', words: ['그립', '그리워', '그리움', '보고싶', '생각나'] },
  { emotion: '짝사랑', keyword: '짝사랑', words: ['짝사랑', '고백못', '혼자좋아'] },
  { emotion: '설렘', keyword: '설렘', words: ['설레', '설렘', '두근', '신나', '신난', '기대돼', '기대된'] },
  { emotion: '질투', keyword: '질투', words: ['질투', '샘나', '부럽', '부러워'] },
  { emotion: '후회', keyword: '후회', words: ['후회', '아쉽', '아쉬워', '그때왜', '했어야'] },
  { emotion: '막막함', keyword: '막막함', words: ['막막', '답이없', '어떻게해야할지', '뭘해야할지'] },
  { emotion: '답답함', keyword: '답답함', words: ['답답', '숨막', '갑갑'] },
  { emotion: '압박', keyword: '압박', words: ['압박', '부담', '스트레스', '마감압박', '마감때문', '시험걱정', '시험때문', '시험압박', '쫓기'] },
  { emotion: '비교', keyword: '비교', words: ['비교', '뒤처', '나만못', '남들은'] },
  { emotion: '자존감 낮음', keyword: '자존감', words: ['자존감', '못난', '한심', '자책', '자괴감', '쓸모없'] },
  { emotion: '공허', keyword: '공허', words: ['공허', '허무', '텅빈', '허전', '의미없', '허해', '허하'] },
  { emotion: '생각 많음', keyword: '생각많음', words: ['생각이많', '생각많', '잡생각', '곱씹', '머리가복잡', '생각이꼬리'] },
  { emotion: '불면', keyword: '불면', words: ['불면', '잠이안', '잠을못', '못자', '못잤'] },
]

export interface FoundEmotion {
  emotion: string
  keyword: string
  /** 문장에서 실제로 걸린 표현 */
  word: string
}

/** 1단계: 소문자 + 띄어쓰기·문장부호 제거 */
export function normalize(sentence: string): string {
  return sentence.toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '')
}

/** 단어장 표현을 (표현, 감정) 쌍으로 펼쳐서 긴 표현부터 정렬 (한 번만 만들어 둬요) */
const PATTERNS = EMOTION_LEXICON.flatMap((entry) => entry.words.map((word) => ({ word, entry }))).sort(
  (a, b) => b.word.length - a.word.length,
)

function isNegated(text: string, start: number, end: number): boolean {
  const before = text[start - 1]
  if (before === '안' || before === '못') return true
  // 표현 뒤 몇 글자 안에 부정이 오면 빼요
  // 예: 불안하지않아요, 외롭진않아, 불안한건아닌데, 슬픈건아니고, 외로운게아니라
  const after = text.slice(end, end + 6)
  return /^.{0,2}(지않|진않|건아니|건아닌|게아니|게아닌|는아니|는아닌)/.test(after)
}

/** 문장에서 감정 단어장에 있는 표현을 찾아요. */
export function findEmotions(sentence: string): FoundEmotion[] {
  const text = normalize(sentence)
  const used = new Array<boolean>(text.length).fill(false)
  const hits: { pos: number; found: FoundEmotion; negated: boolean }[] = []

  for (const { word, entry } of PATTERNS) {
    let from = 0
    while (true) {
      const pos = text.indexOf(word, from)
      if (pos === -1) break
      from = pos + 1
      const end = pos + word.length
      // 3단계: 이미 찾은 자리와 겹치면 건너뛰기
      if (used.slice(pos, end).some(Boolean)) continue
      for (let i = pos; i < end; i++) used[i] = true
      hits.push({
        pos,
        negated: isNegated(text, pos, end),
        found: { emotion: entry.emotion, keyword: entry.keyword, word },
      })
    }
  }

  // 4·5단계: 부정 표현 빼고, 문장 순서대로, 감정별로 한 번만
  const seen = new Set<string>()
  return hits
    .filter((h) => !h.negated)
    .sort((a, b) => a.pos - b.pos)
    .filter((h) => (seen.has(h.found.emotion) ? false : (seen.add(h.found.emotion), true)))
    .map((h) => h.found)
}
