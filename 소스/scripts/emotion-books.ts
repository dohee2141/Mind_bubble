// 감정 키워드 → 책 3권 추천 (텍스트 프로토타입)
//
// 실행:
//   node scripts/emotion-books.ts            ← 대화형 (여러 번 입력)
//   node scripts/emotion-books.ts 불안해요    ← 한 번만 추천
//
// 책 목록과 추천 로직은 제출용 prototype/emotion-cards/recommend.ts 를 써요 (웹앱 파일과 분리).

import { createInterface } from 'node:readline/promises'
import { stdin, stdout, argv } from 'node:process'
import { recommendByKeyword, EXAMPLE_EMOTIONS } from '../prototype/emotion-cards/recommend.ts'
import { findEmotions } from '../prototype/emotion-cards/emotion-lexicon.ts'

const CATEGORY_LABEL: Record<string, string> = {
  work: '💼 일 & 학업',
  people: '👥 인간관계',
  love: '❤️ 사랑',
  future: '🌫️ 미래 & 불안',
  burnout: '🔋 피로 & 번아웃',
  thoughts: '💭 사소한 생각',
}

function render(input: string): string {
  // 1) 감정 단어장에서 문장 속 감정 단어 찾기
  const found = findEmotions(input)
  // 2) 찾았으면 그 키워드로, 못 찾았으면 입력 그대로 추천 (추천 방법 자체는 그대로)
  const query = found.length > 0 ? found.map((f) => f.keyword).join(' ') : input
  const { recommendations, category, exact } = recommendByKeyword(query, 3)
  if (recommendations.length === 0) return '  감정 키워드를 한 단어 이상 입력해 주세요.\n'

  const lines: string[] = []
  lines.push('')
  lines.push(
    found.length > 0
      ? `  🔎 찾은 감정 단어: ${found.map((f) => `${f.emotion}("${f.word}")`).join(', ')}`
      : '  🔎 감정 단어장에 있는 단어를 찾지 못했어요. 입력한 말 그대로 찾아볼게요.',
  )
  lines.push(`  📚 "${input}" 마음에 건네는 책 3권`)
  if (category) lines.push(`     가까운 마음: ${CATEGORY_LABEL[category] ?? category}`)
  if (!exact) lines.push('     (딱 맞는 키워드는 없어서, 비슷한 마음의 책으로 골랐어요)')
  lines.push('  ' + '─'.repeat(44))

  recommendations.forEach(({ book, matched }, i) => {
    lines.push(`  ${i + 1}. ${book.emoji} 『${book.title}』 — ${book.author}`)
    lines.push(`     이런 마음일 때: ${book.mood}`)
    lines.push(`     추천 이유: ${book.note}`)
    if (matched.length > 0) lines.push(`     연결된 감정: ${matched.map((m) => '#' + m).join(' ')}`)
    lines.push('')
  })
  return lines.join('\n')
}

const oneShot = argv.slice(2).join(' ').trim()

if (oneShot) {
  console.log(render(oneShot))
} else {
  console.log('\n  📚 감정책방 — 감정 키워드로 책 찾기')
  console.log(`  예시: ${EXAMPLE_EMOTIONS.join(', ')}`)
  console.log('  (끝내려면 "q" 또는 빈 줄에서 Enter)\n')

  const rl = createInterface({ input: stdin, output: stdout })
  while (true) {
    const answer = (await rl.question('  지금 어떤 마음이에요? > ')).trim()
    if (answer === '' || answer.toLowerCase() === 'q') break
    console.log(render(answer))
  }
  rl.close()
  console.log('  오늘도 수고했어요. 🌷\n')
}
