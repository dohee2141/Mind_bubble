// 제출용 감정 책 추천 프로토타입 빌드
// 실행: node scripts/build-emotion-cards.mjs
// 결과:
//   prototype/emotion-cards/app.js      ← 감정 버튼 9개 → 책 카드 3장 (index.html 이 불러요)
//   prototype/emotion-cards/ai-tabs.html ← 탭 1 규칙 / 탭 2 AI 비교 (스크립트가 한 파일 안에 들어가요, 아티팩트로 올리는 파일)
import { build } from 'esbuild'
import { readFile, writeFile } from 'node:fs/promises'

const DIR = 'prototype/emotion-cards'

await build({
  entryPoints: [`${DIR}/app.ts`],
  outfile: `${DIR}/app.js`,
  bundle: true,
  format: 'iife',
  target: 'es2020',
  charset: 'utf8',
})
console.log(`✅ ${DIR}/app.js`)

const tabs = await build({
  entryPoints: [`${DIR}/ai-tabs.ts`],
  bundle: true,
  write: false,
  format: 'iife',
  target: 'es2020',
  charset: 'utf8',
})
const js = tabs.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')
const template = await readFile(`${DIR}/ai-tabs.template.html`, 'utf8')
const page = template.replace('/*__APP__*/', () => js)
await writeFile(`${DIR}/ai-tabs.html`, page)
// 로컬 미리보기용: 아티팩트가 올릴 때 붙여 주는 문서 머리(문자 인코딩)를 직접 붙여요
await writeFile(
  `${DIR}/ai-tabs.preview.html`,
  `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${page}</body></html>`,
)
console.log(`✅ ${DIR}/ai-tabs.html (+ ai-tabs.preview.html)`)
