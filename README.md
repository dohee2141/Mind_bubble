# 🫧 마음버블서점 (감정책방)

**당신의 마음을 비우고 채우다.**
지금 마음을 한 문장으로 적거나 감정 버튼을 고르면, 그 마음에 맞는 책 세 권을 골라 주는 웹앱이에요.

## 🔗 바로 가기

| 페이지 | 주소 |
|---|---|
| 마음버블서점 | **https://mind-bubble-rest.web.app** |
| 관리자 페이지 | https://mind-bubble-rest.web.app/admin.html (로그인 필요) |

사이트는 Firebase Hosting에서 운영해요. (예전 GitHub Pages 주소는 닫았어요)

## ✨ 주요 기능

- **마음 단어로 찾기** — 지금 마음을 한 문장으로 적으면 감정을 읽고 책 세 권을 추천해요.
- **감정 버튼 10가지** — 불안 · 지침 · 외로움 · 우울 · 상처 · 이별 · 압박 · 후회 · 공허 · 생각 많음 중에서 골라도 돼요.
- **AI에게 물어보기** — 감정 단어가 없는 문장도 AI가 읽고 책을 골라 줘요. (관리자가 API 키를 등록하면 동작해요)
- **💌 쪽지 도착** — 고민을 적을 때마다 작가·철학자의 문장 카드 3장이 쪽지로 와요. 카드에서 그 작가의 책 목록을 보고 교보문고에서 찾아볼 수 있어요. (전체 카드 100장)
- **편하게 보기** — 밝은/다크 모드, 글자 크기 100~150%, 한국어/English, 잔잔한 배경 음악(BGM) 켜고 끄기.
- **피드백** — 추천이 마음에 닿았는지 별점과 한마디를 남길 수 있어요.

## 📁 파일 구성

| 파일·폴더 | 내용 |
|---|---|
| `index.html` | 첫 주소로 들어오면 `감정책방.html`로 이동하고, 링크 공유 미리보기(썸네일·제목·설명)를 담고 있어요. |
| `감정책방.html` | 서점 본 화면 |
| `quotes.js` | '쪽지 도착' 인용 카드 100장과 작가별 책 목록 |
| `river.js` | 윤슬 강물 배경 (서점·관리자 화면이 함께 사용) |
| `admin.html` | 관리자 전용 페이지 — 방문·검색 통계, 책 관리, 피드백, 설정 (로그인 필요) |
| `mb-config.js`, `mb-cloud.js` | Supabase 연결 (통계·피드백·책 목록·AI) |
| `supabase/` | 데이터베이스 구조와 AI 추천 서버 함수 |
| `covers/` | 책 표지 이미지 |
| `cloud.svg`, `favicon*`, `apple-touch-icon.png`, `og-image.png` | 로고 구름, 아이콘, 공유 썸네일 |
| `calm-bgm.wav` | 배경 음악 (32초 반복) |
| `firebase.json` | Firebase Hosting 배포 설정 |
| `소스/` | 프로토타입 TypeScript 원본과 빌드·테스트 스크립트 |
| `감정버튼카드/`, `감정책방_아티팩트용.html` | 예전 버전 (참고용) |

## 🚀 배포 방법

`main` 브랜치에 올리면 GitHub Actions가 **Firebase Hosting**에 자동으로 배포해요. (`.github/workflows/firebase-hosting.yml`)

직접 올리고 싶을 때는 아래 명령을 써요. (Windows PowerShell에서는 `npx.cmd`를 써요)

```bash
npx.cmd -y firebase-tools deploy --only hosting --project mind-bubble-rest
```

## 📜 저작권 안내

- **인용문** — 저작권 보호 기간(사후 70년)이 끝난 작가·철학자의 문장만 담았어요. 외국 작가의 문장은 마음버블서점이 직접 우리말로 옮겼고, 한국 시인의 시는 원문 그대로예요.
- **이미지·음악** — 구름, 강물 배경, 아이콘, 공유 썸네일, 배경 음악은 모두 코드로 직접 그리거나 합성했어요.
- **글꼴** — Jua, Gaegu, Gowun Dodum, Noto Sans KR (Google Fonts, SIL Open Font License)
- **책 표지** — 각 출판사에 저작권이 있어요. 책을 소개하기 위한 용도로만 써요.
