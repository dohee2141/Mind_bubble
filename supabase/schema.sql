-- 마음버블서점 Supabase 설정
-- Supabase 대시보드 → SQL Editor 에 이 파일 전체를 붙여 넣고 Run 하세요.
-- 여러 번 실행해도 안전해요.

-- ───────── 관리자 ─────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- 관리자가 아직 아무도 없을 때만, 지금 로그인한 계정을 관리자로 등록해요.
create or replace function public.claim_admin() returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if exists (select 1 from public.admins) then return public.is_admin(); end if;
  insert into public.admins (user_id) values (auth.uid());
  return true;
end $$;

drop policy if exists "admins: self read" on public.admins;
create policy "admins: self read" on public.admins for select to authenticated using (user_id = auth.uid());

-- ───────── 방문·검색 기록 (IP는 저장하지 않아요) ─────────
create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('visit', 'search')),
  mode text check (mode in ('rule', 'ai')),
  query text check (char_length(query) <= 300),
  emotions text[] check (coalesce(array_length(emotions, 1), 0) <= 10),
  books text[] check (coalesce(array_length(books, 1), 0) <= 10),
  lang text check (lang in ('ko', 'en')),
  session text check (char_length(session) <= 40)
);
create index if not exists events_created_at_idx on public.events (created_at desc);
alter table public.events enable row level security;
drop policy if exists "events: anyone insert" on public.events;
create policy "events: anyone insert" on public.events for insert to anon, authenticated with check (true);
drop policy if exists "events: admin read" on public.events;
create policy "events: admin read" on public.events for select to authenticated using (public.is_admin());
drop policy if exists "events: admin delete" on public.events;
create policy "events: admin delete" on public.events for delete to authenticated using (public.is_admin());

-- ───────── 방문자 피드백 ─────────
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  rating int check (rating between 1 and 5),
  message text check (char_length(message) <= 1000),
  lang text check (lang in ('ko', 'en')),
  check (rating is not null or coalesce(char_length(message), 0) > 0)
);
alter table public.feedback enable row level security;
drop policy if exists "feedback: anyone insert" on public.feedback;
create policy "feedback: anyone insert" on public.feedback for insert to anon, authenticated with check (true);
drop policy if exists "feedback: admin read" on public.feedback;
create policy "feedback: admin read" on public.feedback for select to authenticated using (public.is_admin());
drop policy if exists "feedback: admin delete" on public.feedback;
create policy "feedback: admin delete" on public.feedback for delete to authenticated using (public.is_admin());

-- ───────── 책 목록 ─────────
create table if not exists public.books (
  id text primary key check (id ~ '^[a-z0-9-]{1,60}$'),
  title text not null,
  author text not null default '',
  category text not null check (category in ('work', 'people', 'love', 'future', 'burnout', 'thoughts')),
  mood text not null default '',
  note text not null default '',
  keywords text[] not null default '{}',
  emoji text not null default '📘',
  cover_url text,
  sort int not null default 1000,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.books enable row level security;
drop policy if exists "books: read" on public.books;
create policy "books: read" on public.books for select to anon, authenticated using (active or public.is_admin());
drop policy if exists "books: admin write" on public.books;
create policy "books: admin write" on public.books for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ───────── 설정 (한 줄) ─────────
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  ai_enabled boolean not null default true,
  ai_daily_limit int not null default 300 check (ai_daily_limit between 0 and 100000),
  ai_hourly_per_ip int not null default 20 check (ai_hourly_per_ip between 1 and 1000),
  ai_model text not null default 'claude-opus-5-5' check (ai_model in ('claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5')),
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;
alter table public.settings enable row level security;
drop policy if exists "settings: admin" on public.settings;
create policy "settings: admin" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ───────── 비밀값 (API 키) ─────────
-- 테이블은 아무도 직접 읽을 수 없어요. 관리자는 아래 함수로 저장·삭제만 하고,
-- 상태는 끝 4자리만 볼 수 있어요. 키는 AI 함수(서버)만 읽어요.
create table if not exists public.app_secrets (
  name text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;

create or replace function public.set_secret(p_name text, p_value text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if p_name not in ('ANTHROPIC_API_KEY') then raise exception 'unknown secret'; end if;
  if coalesce(length(trim(p_value)), 0) < 10 then raise exception 'value too short'; end if;
  insert into public.app_secrets (name, value, updated_at) values (p_name, trim(p_value), now())
  on conflict (name) do update set value = excluded.value, updated_at = now();
end $$;

create or replace function public.clear_secret(p_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  delete from public.app_secrets where name = p_name;
end $$;

create or replace function public.secret_status()
returns table (name text, hint text, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  return query select s.name, '…' || right(s.value, 4), s.updated_at from public.app_secrets s;
end $$;

-- ───────── AI 호출 기록 (요청 제한용, IP는 해시로만) ─────────
create table if not exists public.ai_calls (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  ip_hash text not null
);
create index if not exists ai_calls_created_at_idx on public.ai_calls (created_at desc);
alter table public.ai_calls enable row level security;
drop policy if exists "ai_calls: admin read" on public.ai_calls;
create policy "ai_calls: admin read" on public.ai_calls for select to authenticated using (public.is_admin());

revoke execute on function public.set_secret(text, text), public.clear_secret(text), public.secret_status() from anon, public;
grant execute on function public.set_secret(text, text), public.clear_secret(text), public.secret_status(), public.claim_admin(), public.is_admin() to authenticated;

-- ───────── 처음 책 목록 ─────────
insert into public.books (id, title, author, category, mood, note, keywords, emoji, sort) values
  ('atomic-habits', '아주 작은 습관의 힘', '제임스 클리어', 'work', '해야 할 일이 너무 커 보여서 시작이 안 될 때', '거창한 결심 대신 1%짜리 작은 변화부터. 부담을 잘게 쪼개는 법을 알려줘요.', array['막막함','미루기','게으름','의욕','자책','부담']::text[], '🧱', 10),
  ('deep-work', '딥 워크', '칼 뉴포트', 'work', '하루 종일 바빴는데 한 게 없는 것 같을 때', '알림과 산만함에서 벗어나 정말 중요한 일에 집중하는 시간을 되찾게 해줘요.', array['산만함','집중','조급함','허무','바쁨']::text[], '🎯', 20),
  ('hamatomyeon', '하마터면 열심히 살 뻔했다', '하완', 'work', '열심히 사는데도 늘 뒤처지는 기분일 때', '"꼭 그렇게까지 해야 하나?" 하고 한숨 돌리게 해주는 유쾌한 에세이예요.', array['뒤처짐','비교','압박','조급함','지침','회의감']::text[], '🛋️', 30),
  ('joy-and-sorrow-of-work', '일의 기쁨과 슬픔', '장류진', 'work', '회사에서 내 자리가 작게만 느껴질 때', '직장인의 하루를 담담하고 재치 있게 그린 소설집. "나만 이런 게 아니구나" 하고 웃게 돼요.', array['회사','직장','억울함','현타','씁쓸함','공감']::text[], '🏢', 40),
  ('essentialism', '에센셜리즘', '그렉 맥커운', 'work', '부탁을 거절 못 해서 할 일이 산더미일 때', '모든 걸 다 하려는 대신 정말 중요한 몇 가지만 고르는 연습. 마음의 짐이 가벼워져요.', array['과부하','거절','벅참','압박','정리','부담']::text[], '✂️', 50),
  ('grit', '그릿', '앤절라 더크워스', 'work', '재능이 없는 것 같아 포기하고 싶을 때', '타고난 재능보다 꾸준함이 더 멀리 간다는 이야기. 시험·공부에 지친 날 다시 힘을 줘요.', array['포기','좌절','시험','열등감','실패','자신감']::text[], '🌱', 60),
  ('courage-to-be-disliked', '미움받을 용기', '기시미 이치로 · 고가 후미타케', 'people', '남들의 시선과 기대가 너무 신경 쓰일 때', '타인의 과제와 나의 과제를 나누는 법. 관계의 무게를 덜어줘요.', array['눈치','시선','인정욕구','미움','부담','자존감']::text[], '🕊️', 70),
  ('i-decided-to-live-as-me', '나는 나로 살기로 했다', '김수현', 'people', '누구에게도 맞추느라 내가 사라진 것 같을 때', '남의 기준이 아닌 나의 기준으로 살아도 괜찮다고 다정하게 말해줘요.', array['자존감','눈치','비교','상처','위축','자기혐오']::text[], '🌷', 80),
  ('you-are-right', '당신이 옳다', '정혜신', 'people', '누군가에게 온전히 이해받고 싶을 때', '충고보다 공감이 사람을 살린다는 이야기. 나와 주변을 대하는 법이 달라져요.', array['서운함','공감','이해','상처','외로움','위로']::text[], '🤝', 90),
  ('almond', '아몬드', '손원평', 'people', '마음을 표현하는 게 서툴러 외로울 때', '감정을 잘 느끼지 못하는 소년이 사람을 통해 변해가는 따뜻한 소설이에요.', array['외로움','고립','표현','서툼','공허']::text[], '🌰', 100),
  ('reading-relationships', '관계를 읽는 시간', '문요한', 'people', '가까운 사람 때문에 자꾸 지치고 상처받을 때', '나와 너 사이의 적당한 거리, "바운더리"를 세우는 법을 차분하게 알려줘요.', array['갈등','상처','배신','거리두기','서운함','지침','가족']::text[], '🪢', 110),
  ('need-to-be-lonely', '가끔은 격하게 외로워야 한다', '김정운', 'people', '사람들 속에 있어도 혼자인 것 같을 때', '외로움을 피할 대상이 아니라 나를 만나는 시간으로 바꿔 보자는 유쾌한 제안이에요.', array['외로움','혼자','쓸쓸함','고독','소외감']::text[], '🏝️', 120),
  ('essays-in-love', '왜 나는 너를 사랑하는가', '알랭 드 보통', 'love', '사랑의 시작과 흔들림, 이별까지 마음이 복잡할 때', '사랑에 빠지고 아파하는 우리의 마음을 가장 섬세하고 지적인 언어로 어루만져 줘요.', array['설렘','혼란','이별','집착','연애']::text[], '❤️', 130),
  ('art-of-loving', '사랑의 기술', '에리히 프롬', 'love', '나를 잃지 않으면서 건강하게 사랑하고 싶을 때', '사랑은 감정에만 머무는 게 아니라 나를 먼저 돌보는 단단한 힘에서 시작된다고 말해줘요.', array['집착','불안','의존','연애','자존감']::text[], '💌', 140),
  ('moments-of-love', '모든 순간이 너였다', '하태완', 'love', '지친 연애나 짝사랑 끝에 따뜻한 위로가 필요할 때', '반짝이던 순간과 아팠던 마음을 다정하게 토닥여 주는 에세이예요.', array['짝사랑','그리움','이별','위로','설렘']::text[], '🌸', 150),
  ('course-of-love', '낭만적 연애와 그 후의 일상', '알랭 드 보통', 'love', '오래된 관계가 예전 같지 않아 서운할 때', '설렘이 지나간 뒤의 사랑을 솔직하게 들여다봐요. 다툼도 사랑의 일부라고 알려줘요.', array['권태','서운함','다툼','결혼','연애','실망']::text[], '🏡', 160),
  ('life-of-love', '사랑의 생애', '이승우', 'love', '사랑 앞에서 내 마음을 나도 모르겠을 때', '사랑이 사람에게 들어와 머물다 가는 과정을 깊이 있게 그린 소설. 복잡한 마음이 정리돼요.', array['혼란','짝사랑','질투','설렘','그리움']::text[], '🫧', 170),
  ('unbearable-lightness', '참을 수 없는 존재의 가벼움', '밀란 쿤데라', 'love', '이별 뒤에 "그때 다른 선택을 했다면" 하고 맴돌 때', '사랑과 선택, 무거움과 가벼움을 묻는 소설. 아픈 마음을 조금 멀리서 바라보게 해줘요.', array['이별','후회','미련','선택','그리움']::text[], '🎈', 180),
  ('tteokbokki', '죽고 싶지만 떡볶이는 먹고 싶어', '백세희', 'future', '이유 없이 불안하고 마음이 가라앉을 때', '가벼운 우울과 불안을 솔직하게 들여다본 상담 기록. "나만 그런 게 아니구나" 싶어져요.', array['우울','불안','무기력','공허','자기혐오']::text[], '🍢', 190),
  ('namiya', '나미야 잡화점의 기적', '히가시노 게이고', 'future', '어떤 선택을 해야 할지 막막할 때', '고민 편지에 답장을 해주는 잡화점 이야기. 내 고민에도 답이 올 것 같은 기분이 들어요.', array['막막함','선택','진로','고민','희망']::text[], '✉️', 200),
  ('fish-dont-exist', '물고기는 존재하지 않는다', '룰루 밀러', 'future', '세상이 정한 정답에서 벗어난 것 같아 두려울 때', '혼돈 속에서도 의미를 찾아가는 과정. 불확실함을 조금 덜 무섭게 만들어줘요.', array['두려움','혼란','불확실','좌절','의미']::text[], '🐟', 210),
  ('midnight-library', '미드나잇 라이브러리', '매트 헤이그', 'future', '"그때 다른 길을 갔다면" 하는 후회가 클 때', '살아보지 못한 삶들을 둘러보는 도서관 이야기. 지금 내 삶을 다시 보듬게 돼요.', array['후회','우울','절망','선택','진로','희망']::text[], '📖', 220),
  ('status-anxiety', '불안', '알랭 드 보통', 'future', '남들보다 뒤처질까 봐 늘 초조할 때', '왜 우리는 지위와 성공 때문에 불안해할까? 그 뿌리를 알면 불안이 조금 작아져요.', array['불안','초조','비교','뒤처짐','성공','조급함']::text[], '🌀', 230),
  ('mans-search-for-meaning', '죽음의 수용소에서', '빅터 프랭클', 'future', '살아가는 이유를 잘 모르겠을 때', '가장 어두운 곳에서도 의미를 찾은 기록. 버티는 힘이 어디서 오는지 알려줘요.', array['절망','허무','의미','고통','희망','공허']::text[], '🕯️', 240),
  ('stop-and-see', '멈추면, 비로소 보이는 것들', '혜민', 'burnout', '멈추면 안 될 것 같아서 계속 달리고 있을 때', '짧은 글들이라 지친 날에도 한 페이지씩 읽기 좋아요. 쉬어도 된다는 허락 같은 책.', array['지침','피곤','조급함','휴식','위로']::text[], '🍃', 250),
  ('dallergut', '달러구트 꿈 백화점', '이미예', 'burnout', '잠들기 전까지 머리가 쉬지 않을 때', '꿈을 사고파는 상점이라는 포근한 상상. 잠들기 전에 읽기 딱 좋은 소설이에요.', array['불면','피곤','잠','휴식','포근함']::text[], '🌙', 260),
  ('convenience-store', '불편한 편의점', '김호연', 'burnout', '사람의 온기가 그리운 지친 날', '동네 편의점에 모인 사람들이 서로를 조금씩 회복시키는 이야기. 읽고 나면 마음이 데워져요.', array['지침','외로움','회복','따뜻함','위로']::text[], '🏪', 270),
  ('hyunam-dong-bookshop', '어서 오세요, 휴남동 서점입니다', '황보름', 'burnout', '다 내려놓고 잠시 숨고 싶을 때', '번아웃 끝에 작은 서점을 연 사람과 손님들의 이야기. 천천히 살아도 괜찮다고 말해줘요.', array['번아웃','무기력','퇴사','지침','휴식','회복']::text[], '☕', 280),
  ('forest-capitalist', '숲속의 자본주의자', '박혜윤', 'burnout', '더 많이 벌고 더 바쁘게 사는 게 지겨울 때', '시골에서 최소한으로 일하며 사는 가족의 이야기. "덜 해도 된다"는 감각을 되찾아줘요.', array['번아웃','회의감','지침','권태','쉼']::text[], '🌲', 290),
  ('walden', '월든', '헨리 데이비드 소로', 'burnout', '복잡한 일상에서 잠시 벗어나고 싶을 때', '호숫가 오두막에서 보낸 단순한 삶의 기록. 한 장씩 천천히 읽으면 숨이 고르게 쉬어져요.', array['번아웃','피로','복잡함','도피','쉼','자연']::text[], '🛶', 300),
  ('temperature-of-language', '언어의 온도', '이기주', 'thoughts', '누군가의 말 한마디가 계속 마음에 남을 때', '말과 글에 담긴 온도를 다룬 에세이. 내가 쓰는 말도, 들은 말도 다시 보게 돼요.', array['상처','말','서운함','곱씹음','예민함']::text[], '💬', 310),
  ('reasons-for-travel', '여행의 이유', '김영하', 'thoughts', '생각이 꼬리를 물어 어디론가 떠나고 싶을 때', '여행을 통해 나를 돌아보는 산문. 복잡한 머릿속에 창문을 하나 열어주는 느낌이에요.', array['답답함','권태','도피','복잡함','떠나고싶음']::text[], '🧳', 320),
  ('little-prince', '어린 왕자', '앙투안 드 생텍쥐페리', 'thoughts', '어른이 되면서 잊어버린 것이 그리울 때', '다시 읽을 때마다 다르게 다가오는 책. 정말 중요한 게 무엇인지 조용히 묻게 돼요.', array['그리움','공허','순수','외로움','허무']::text[], '🌹', 330),
  ('ordinary-existence', '보통의 존재', '이석원', 'thoughts', '나만 특별히 못난 것 같은 밤', '평범한 사람의 솔직한 고백들. 누구나 이 정도는 흔들린다는 걸 알게 돼요.', array['자기혐오','자존감','우울','공허','쓸쓸함']::text[], '🌃', 340),
  ('too-many-thoughts', '나는 생각이 너무 많아', '크리스텔 프티콜랭', 'thoughts', '사소한 일도 끝없이 곱씹느라 지칠 때', '생각이 많은 건 결함이 아니라 특성이라고 말해줘요. 예민한 나를 이해하는 데 도움이 돼요.', array['생각많음','예민함','곱씹음','걱정','불면','과민']::text[], '🧠', 350),
  ('frame', '프레임', '최인철', 'thoughts', '같은 일도 늘 나쁜 쪽으로만 보일 때', '세상을 보는 "마음의 창"을 바꾸면 같은 하루도 달라진다는 심리학 이야기예요.', array['부정적','비관','걱정','관점','불만']::text[], '🖼️', 360)
on conflict (id) do nothing;
