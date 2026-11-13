// 감정 버튼 9개 → 책 카드 3장 (UX/UI 프로토타입)
// 추천 방법은 텍스트 프로토타입과 같아요: 같은 폴더의 recommend.ts (recommendByKeyword) 를 써요.
// 빌드: node scripts/build-emotion-cards.mjs  →  prototype/emotion-cards/app.js

import { recommendByKeyword } from './recommend.ts'

/** 버튼 9개: 화면에 보이는 이름 → recommendByKeyword 에 넘기는 감정 키워드 */
const EMOTIONS = [
  { label: '불안해요', emoji: '🌫️', keyword: '불안' },
  { label: '지쳤어요', emoji: '🔋', keyword: '지침' },
  { label: '외로워요', emoji: '🏝️', keyword: '외로움' },
  { label: '이별했어요', emoji: '💔', keyword: '이별' },
  { label: '생각이 많아요', emoji: '💭', keyword: '생각많음' },
  { label: '압박감', emoji: '🧱', keyword: '압박' },
  { label: '무기력해요', emoji: '🫠', keyword: '무기력' },
  { label: '후회돼요', emoji: '🔁', keyword: '후회' },
  { label: '상처받았어요', emoji: '🩹', keyword: '상처' },
]

/** 카드 윗부분 색 (카테고리별) */
const CATEGORY_COLOR: Record<string, string> = {
  work: '#f6c177',
  people: '#f4a3b4',
  love: '#f28fb0',
  future: '#a99cf0',
  burnout: '#8fd3b0',
  thoughts: '#8ec5f0',
}

const grid = document.getElementById('emotions')!
const result = document.getElementById('result')!
const heading = document.getElementById('result-heading')!
const cards = document.getElementById('cards')!

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

function show(index: number) {
  const emotion = EMOTIONS[index]
  grid.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)))

  const { recommendations } = recommendByKeyword(emotion.keyword, 3)
  heading.textContent = `${emotion.emoji} "${emotion.label}" 마음에 건네는 책 3권`
  cards.innerHTML = recommendations
    .map(
      ({ book }, i) => `
      <article class="card" style="--accent:${CATEGORY_COLOR[book.category] ?? '#ccc'}; animation-delay:${i * 80}ms">
        <div class="cover"><span>${book.emoji}</span></div>
        <div class="body">
          <h3>${escapeHtml(book.title)}</h3>
          <p class="author">${escapeHtml(book.author)}</p>
          <p class="note">${escapeHtml(book.note)}</p>
        </div>
      </article>`,
    )
    .join('')
  result.hidden = false
  result.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

grid.innerHTML = EMOTIONS.map(
  (e, i) =>
    `<button type="button" aria-pressed="false" data-i="${i}"><span class="emoji">${e.emoji}</span>${e.label}</button>`,
).join('')
grid.addEventListener('click', (ev) => {
  const btn = (ev.target as HTMLElement).closest('button')
  if (btn) show(Number(btn.dataset.i))
})
