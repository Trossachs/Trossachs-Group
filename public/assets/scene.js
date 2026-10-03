// Lightweight 3D hero scene. Pure Canvas 2D with a small perspective projector (no WebGL, no libraries).
// A faceted glass-like icosahedron, two thin orbital rings and a few small satellites.
// Reacts to pointer, scroll and device orientation; throttles itself if the device struggles.

const PHI = (1 + Math.sqrt(5)) / 2;
const ICO_V = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
].map((v) => norm(v));
const ICO_F = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
];
const OCT_V = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const OCT_F = [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]];

function norm(v) { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
function rot(v, rx, ry, rz = 0) {
  let [x, y, z] = v;
  let c = Math.cos(rx), s = Math.sin(rx);
  [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(ry); s = Math.sin(ry);
  [x, z] = [x * c + z * s, -x * s + z * c];
  if (rz) { c = Math.cos(rz); s = Math.sin(rz); [x, y] = [x * c - y * s, x * s + y * c]; }
  return [x, y, z];
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export function startScene(canvas, opts = {}) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) { opts.onFallback?.(); return { stop() {}, refreshPalette() {} }; }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = () => innerWidth < 720;
  const level = { value: opts.intensity === 'low' ? 1 : 2 }; // 2 = full, 1 = reduced, 0 = static
  let w = 0, h = 0, dpr = 1;
  let palette = readPalette();
  const light = [-0.45, -0.7, -0.55];

  const state = {
    tx: 0, ty: 0, x: 0, y: 0, // pointer target / smoothed (-1..1)
    scroll: 0, running: false, visible: true, raf: 0, last: 0, t: 0,
    frames: 0, slow: 0,
  };

  function readPalette() {
    const cs = getComputedStyle(document.documentElement);
    const rgb = (cs.getPropertyValue('--accent-rgb') || '138,164,192').trim();
    const dark = document.documentElement.getAttribute('data-resolved-theme') !== 'light';
    return { accent: rgb, dark };
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    const cap = small() || coarse || level.value < 2 ? 1.5 : 2;
    dpr = Math.min(window.devicePixelRatio || 1, cap);
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!state.running) draw(state.t);
  }

  function project(p, cx, cy, scale) {
    const d = 4.2;
    const k = d / (d - p[2]);
    return [cx + p[0] * scale * k, cy + p[1] * scale * k, p[2]];
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    const { accent, dark } = palette;
    const base = Math.min(w, h * 1.15);
    const isSmall = small();
    const scale = base * (isSmall ? 0.2 : 0.17);
    const scrollFade = Math.max(0, 1 - state.scroll / (h * 0.9));
    const cx = w * (isSmall ? 0.5 : 0.72);
    const cy = h * (isSmall ? 0.3 : 0.46) - state.scroll * 0.12;
    const rx = 0.5 + state.y * 0.45 + state.scroll * 0.0006 + Math.sin(t * 0.00018) * 0.12;
    const ry = t * 0.00012 + state.x * 0.6 + state.scroll * 0.0009;
    const prims = [];
    const edgeRGB = dark ? '235,240,248' : '24,34,50';
    const fillRGB = dark ? accent : '255,255,255';

    // Icosahedron
    const R = scale * 1.55;
    const iv = ICO_V.map((v) => rot(v, rx, ry, 0.15));
    for (const f of ICO_F) {
      const a = iv[f[0]], b = iv[f[1]], c = iv[f[2]];
      const n = norm(cross(sub(b, a), sub(c, a)));
      const facing = n[2];
      if (facing < -0.02) continue; // back-face cull
      const lit = Math.max(0, dot(n, norm(light)) * -1);
      const z = (a[2] + b[2] + c[2]) / 3;
      prims.push({ z, kind: 'face', pts: [a, b, c].map((p) => project(p, cx, cy, R)), lit, facing });
    }

    // Rings (thin orbit lines with depth fade)
    const ringCount = level.value >= 2 ? 2 : 1;
    for (let r = 0; r < ringCount; r += 1) {
      const radius = 1.45 + r * 0.38;
      const tilt = [0.9 + r * 0.55, 0.3 - r * 0.8, 0.15 + r * 0.4];
      const spin = t * 0.00009 * (r ? -1 : 1);
      const steps = isSmall ? 56 : 96;
      let prev = null;
      for (let i = 0; i <= steps; i += 1) {
        const ang = (i / steps) * Math.PI * 2 + spin;
        let p = [Math.cos(ang) * radius, 0, Math.sin(ang) * radius];
        p = rot(p, tilt[0], tilt[1], tilt[2]);
        p = rot(p, rx * 0.35, ry * 0.5);
        const q = project(p, cx, cy, R);
        if (prev) prims.push({ z: (p[2] + prev.z) / 2, kind: 'seg', a: prev.q, b: q, depth: p[2] });
        prev = { q, z: p[2] };
      }
    }

    // Satellites
    if (level.value >= 2) {
      const sats = isSmall ? 2 : 4;
      for (let s = 0; s < sats; s += 1) {
        const ang = t * 0.00022 * (1 + s * 0.17) + s * 1.7;
        const rad = 1.9 + (s % 2) * 0.55;
        let c0 = [Math.cos(ang) * rad, Math.sin(ang * 0.7) * 0.7, Math.sin(ang) * rad];
        c0 = rot(c0, rx * 0.35, ry * 0.5);
        const size = 0.11 + (s % 3) * 0.04;
        const ov = OCT_V.map((v) => { const q = rot(v, ang * 1.3, ang * 0.9); return [c0[0] + q[0] * size, c0[1] + q[1] * size, c0[2] + q[2] * size]; });
        for (const f of OCT_F) {
          const a = ov[f[0]], b = ov[f[1]], c = ov[f[2]];
          const n = norm(cross(sub(b, a), sub(c, a)));
          if (n[2] < 0) continue;
          prims.push({ z: c0[2], kind: 'face', pts: [a, b, c].map((p) => project(p, cx, cy, R)), lit: Math.max(0, dot(n, norm(light)) * -1), facing: n[2], small: true });
        }
      }
    }

    prims.sort((p, q) => p.z - q.z);

    // Soft ground glow behind the form
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.3);
    g.addColorStop(0, `rgba(${accent},${dark ? 0.16 : 0.18})`);
    g.addColorStop(1, `rgba(${accent},0)`);
    ctx.globalAlpha = scrollFade;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.lineJoin = 'round';
    for (const p of prims) {
      if (p.kind === 'seg') {
        const a = 0.1 + 0.4 * ((p.depth + 2) / 4);
        ctx.strokeStyle = `rgba(${edgeRGB},${Math.max(0.04, Math.min(0.45, a)) * scrollFade})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p.a[0], p.a[1]); ctx.lineTo(p.b[0], p.b[1]); ctx.stroke();
      } else {
        const [A, B, C] = p.pts;
        const fa = (dark ? 0.05 : 0.22) + p.lit * (dark ? 0.2 : 0.3);
        ctx.fillStyle = `rgba(${fillRGB},${fa * scrollFade})`;
        ctx.strokeStyle = `rgba(${edgeRGB},${(0.12 + p.lit * 0.35 + p.facing * 0.12) * scrollFade})`;
        ctx.lineWidth = p.small ? 0.8 : 1;
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    state.raf = 0;
    if (!state.running) return;
    const dt = state.last ? now - state.last : 16;
    state.last = now;
    state.t += Math.min(dt, 50);
    state.x += (state.tx - state.x) * 0.06;
    state.y += (state.ty - state.y) * 0.06;

    // Adaptive quality: if the first frames are slow, step down once, then give up gracefully.
    state.frames += 1;
    if (state.frames > 20 && state.frames <= 100) {
      if (dt > 38) state.slow += 1;
      if (state.frames === 100) {
        if (state.slow > 30) {
          if (level.value > 1) { level.value = 1; resize(); }
          else if (level.value === 1) { level.value = 0; stop(); draw(state.t); opts.onFallback?.(); return; }
        }
        state.frames = 21; state.slow = 0;
      }
    }
    draw(state.t);
    state.raf = requestAnimationFrame(frame);
  }

  function start() {
    if (reduced || level.value === 0 || state.running || !state.visible || document.hidden) return;
    state.running = true; state.last = 0;
    state.raf = requestAnimationFrame(frame);
  }
  function stop() {
    state.running = false;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
  }

  const onPointer = (e) => {
    if (coarse) return;
    state.tx = (e.clientX / innerWidth - 0.5) * 2;
    state.ty = (e.clientY / innerHeight - 0.5) * 2;
  };
  const onOrient = (e) => {
    if (e.gamma == null || e.beta == null) return;
    state.tx = Math.max(-1, Math.min(1, e.gamma / 35));
    state.ty = Math.max(-1, Math.min(1, (e.beta - 40) / 35));
  };
  const onScroll = () => { state.scroll = window.scrollY; if (!state.running) draw(state.t); };
  const onVis = () => (document.hidden ? stop() : start());

  addEventListener('pointermove', onPointer, { passive: true });
  addEventListener('deviceorientation', onOrient, { passive: true });
  addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVis);
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { state.visible = e.isIntersecting; state.visible ? start() : stop(); }, { threshold: 0 });
  io.observe(canvas);

  resize();
  state.scroll = window.scrollY;
  draw(0);
  start();

  return {
    stop() {
      stop();
      removeEventListener('pointermove', onPointer); removeEventListener('deviceorientation', onOrient);
      removeEventListener('scroll', onScroll); document.removeEventListener('visibilitychange', onVis);
      ro.disconnect(); io.disconnect();
    },
    refreshPalette() { palette = readPalette(); if (!state.running) draw(state.t); },
  };
}
