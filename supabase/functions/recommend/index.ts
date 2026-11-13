// 마음버블서점 "AI에게 물어보기" 서버 함수 (Supabase Edge Function)
// 배포: Supabase 대시보드 → Edge Functions → Deploy a new function → Via Editor
//       이름: recommend, 이 파일 내용을 붙여 넣고, "Verify JWT" 는 꺼 주세요.
// API 키: 관리자 페이지 → 설정에서 저장하거나, Edge Function Secrets 에 ANTHROPIC_API_KEY 로 넣어요.
import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const fail = (code: string, status: number) => json({ error: code }, status);

type Book = { id: string; title: string; author: string; mood: string; keywords: string[] };

function buildPrompt(input: string, lang: "ko" | "en", books: Book[]): string {
  const out =
    lang === "en"
      ? "emotion, secondary, why, read 는 모두 자연스러운 영어로 쓴다(emotion은 1~3단어 소문자)."
      : "emotion은 짧은 한국어 명사(1~6자), why와 read는 한국어 해요체로 쓴다.";
  const catalog = books
    .map((b) => `${b.id} | 『${b.title}』 ${b.author} | 이런 마음일 때: ${b.mood} | 키워드: ${b.keywords.join(", ")}`)
    .join("\n");
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
${catalog}

사용자 문장: """${input}"""`;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["emotion", "secondary", "read", "books"],
  properties: {
    emotion: { type: ["string", "null"] },
    secondary: { type: "array", items: { type: "string" } },
    read: { type: "string" },
    books: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "why"],
        properties: { id: { type: "string" }, why: { type: "string" } },
      },
    },
  },
};

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("method_not_allowed", 405);

  let body: { text?: unknown; lang?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("bad_request", 400);
  }
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 300) : "";
  const lang = body.lang === "en" ? "en" : "ko";
  if (!text) return fail("bad_request", 400);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const { data: settings } = await db.from("settings").select("*").eq("id", 1).maybeSingle();
  if (!settings?.ai_enabled) return fail("ai_disabled", 403);

  // 요청 제한: IP별 1시간, 전체 24시간
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const ipHash = await sha256("mb:" + ip);
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86400_000).toISOString();
  const [{ count: mine }, { count: total }] = await Promise.all([
    db.from("ai_calls").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", hourAgo),
    db.from("ai_calls").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
  ]);
  if ((mine ?? 0) >= settings.ai_hourly_per_ip) return fail("rate_limited", 429);
  if ((total ?? 0) >= settings.ai_daily_limit) return fail("daily_limit", 429);

  let apiKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
  if (!apiKey) {
    const { data } = await db.from("app_secrets").select("value").eq("name", "ANTHROPIC_API_KEY").maybeSingle();
    apiKey = data?.value ?? "";
  }
  if (!apiKey) return fail("ai_disabled", 503);

  const { data: books } = await db
    .from("books")
    .select("id,title,author,mood,keywords")
    .eq("active", true)
    .order("sort");
  if (!books?.length) return fail("other", 500);

  await db.from("ai_calls").insert({ ip_hash: ipHash });

  const client = new Anthropic({ apiKey });
  try {
    const response = await client.beta.messages.create({
      model: settings.ai_model,
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: buildPrompt(text, lang, books as Book[]) }],
    } as Anthropic.Beta.MessageCreateParamsNonStreaming);

    if (response.stop_reason === "refusal") return fail("refused", 422);
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return fail("invalid_json", 502);
    let result: unknown;
    try {
      result = JSON.parse(block.text);
    } catch {
      return fail("invalid_json", 502);
    }
    return json(result);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return fail("rate_limited", 429);
    if (err instanceof Anthropic.AuthenticationError) return fail("ai_disabled", 503);
    if (err instanceof Anthropic.APIError) {
      console.error("anthropic", err.status, err.message);
      return fail("other", 502);
    }
    console.error(err);
    return fail("other", 500);
  }
});
