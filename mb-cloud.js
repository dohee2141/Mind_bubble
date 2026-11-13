// 마음버블서점 ↔ Supabase 연결 (방문·검색 기록, 피드백, 책 목록, AI 추천)
(() => {
  "use strict";
  const C = window.MB_CONFIG || {};
  const url = String(C.supabaseUrl || "").replace(/\/+$/, "");
  const key = String(C.supabaseKey || "");
  const enabled = Boolean(url && key);
  const H = { apikey: key, "Content-Type": "application/json" };

  let session = "";
  try {
    session = sessionStorage.getItem("mb-sid") || "";
    if (!session) {
      session = Math.random().toString(36).slice(2, 14);
      sessionStorage.setItem("mb-sid", session);
    }
  } catch {}

  const post = (table, row) =>
    fetch(`${url}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify(row),
      keepalive: true
    }).then((r) => r.ok).catch(() => false);

  const list = (a, n) => (Array.isArray(a) ? a : []).filter((x) => typeof x === "string").slice(0, n);

  window.MB_CLOUD = {
    enabled,
    visit(lang) {
      if (enabled) post("events", { kind: "visit", lang, session });
    },
    search({ mode, query, emotions, books, lang }) {
      if (!enabled) return;
      post("events", {
        kind: "search",
        mode,
        query: String(query || "").slice(0, 300),
        emotions: list(emotions, 10),
        books: list(books, 10),
        lang,
        session
      });
    },
    feedback({ rating, message, lang }) {
      if (!enabled) return Promise.resolve(false);
      return post("feedback", { rating: rating || null, message: String(message || "").slice(0, 1000) || null, lang });
    },
    async books() {
      if (!enabled) return null;
      try {
        const r = await fetch(`${url}/rest/v1/books?select=*&active=eq.true&order=sort.asc,title.asc`, { headers: H });
        if (!r.ok) return null;
        const rows = await r.json();
        return Array.isArray(rows) && rows.length ? rows : null;
      } catch {
        return null;
      }
    },
    async ai(text, lang) {
      let r;
      try {
        r = await fetch(`${url}/functions/v1/recommend`, { method: "POST", headers: H, body: JSON.stringify({ text, lang }) });
      } catch {
        throw { code: "other" };
      }
      const data = await r.json().catch(() => null);
      if (!r.ok) throw { code: (data && data.error) || "other" };
      return data;
    }
  };
})();
