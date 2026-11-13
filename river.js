// 버전2: 푸른 윤슬 강물 배경 — 사진 없이 코드로 직접 그려서 저작권 걱정이 없어요.
// 물빛 그라데이션 + 천천히 흐르는 물결 + 햇빛이 부서지는 반짝임(윤슬).
// 움직임 줄이기 설정이면 멈춘 한 장면만 그리고, 탭이 안 보일 때는 쉬어요.
(() => {
  "use strict";
  const c = document.getElementById("river");
  if (!c || !c.getContext) return;
  const ctx = c.getContext("2d");
  const root = document.documentElement;
  const darkQ = matchMedia("(prefers-color-scheme: dark)");
  const calmQ = matchMedia("(prefers-reduced-motion: reduce)");
  const isDark = () => root.dataset.theme === "dark" || (root.dataset.theme !== "light" && darkQ.matches);
  let W = 0, H = 0, glints = [], raf = 0, last = 0;

  function seed() {
    const n = Math.min(320, Math.round((W * H) / 5000));
    glints = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.pow(Math.random(), 0.8) * H,
      len: 3 + Math.random() * 14,
      ph: Math.random() * Math.PI * 2,
      sp: 0.5 + Math.random() * 1.5,
      drift: 4 + Math.random() * 12
    }));
  }
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }
  function draw(t) {
    const d = isDark();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    if (d) { g.addColorStop(0, "#0a1b2c"); g.addColorStop(0.5, "#11314d"); g.addColorStop(1, "#1a4567"); }
    else { g.addColorStop(0, "#e6f4fc"); g.addColorStop(0.45, "#c2e3f5"); g.addColorStop(1, "#93c8e8"); }
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 천천히 흐르는 물결 띠
    ctx.lineCap = "round";
    for (let k = 0; k < 7; k++) {
      const y0 = H * (0.08 + k * 0.14);
      const amp = 4 + k * 1.2, wl = 180 + k * 40, ph = t * 0.00025 * (1 + k * 0.15) + k;
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 12) {
        const y = y0 + Math.sin(x / wl * Math.PI * 2 + ph) * amp + Math.sin(x / (wl * 0.37) - ph * 1.7) * amp * 0.35;
        x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = d ? "rgba(140,190,235,0.07)" : "rgba(255,255,255,0.22)";
      ctx.lineWidth = 10 + k * 2;
      ctx.stroke();
    }

    // 윤슬: 반짝였다 사라지는 가로로 긴 빛 조각
    ctx.globalCompositeOperation = "lighter";
    for (const s of glints) {
      const b = Math.pow(Math.max(0, Math.sin(t * 0.0012 * s.sp + s.ph)), 6);
      if (b < 0.02) continue;
      const x = (s.x + (t / 1000) * s.drift) % (W + 40) - 20;
      const y = s.y + Math.sin(t * 0.0008 + s.ph) * 2;
      const r = s.len * (0.6 + b * 0.6);
      const a = (d ? 0.75 : 0.9) * b;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `rgba(255,255,255,${a})`);
      rg.addColorStop(0.35, d ? `rgba(190,225,255,${a * 0.5})` : `rgba(235,248,255,${a * 0.55})`);
      rg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      if (b > 0.85) { // 가장 밝은 순간엔 작은 별빛
        ctx.fillStyle = `rgba(255,255,255,${(b - 0.85) * 4})`;
        ctx.fillRect(x - 0.5, y - r * 0.5, 1, r);
        ctx.fillRect(x - r * 0.5, y - 0.5, r, 1);
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }
  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (t - last < 33) return; // 약 30fps
    last = t;
    draw(t);
  }
  function start() {
    cancelAnimationFrame(raf);
    if (calmQ.matches) { draw(4000); return; }
    if (!document.hidden) raf = requestAnimationFrame(loop);
  }
  addEventListener("resize", () => { resize(); if (calmQ.matches) draw(4000); });
  document.addEventListener("visibilitychange", start);
  calmQ.addEventListener("change", start);
  darkQ.addEventListener("change", () => draw(performance.now()));
  resize();
  start();
})();
