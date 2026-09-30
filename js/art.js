// SULPHUR — arte procedural: grabado en tinta negra sobre papel envejecido + un único acento de Senda.
import { SENDAS, CIRCLES, CARDS, SOULS, PILGRIMS, TYPES } from './data.js';

export const FONT_D = '"IM Fell English SC", "IM Fell English", Georgia, serif';
export const FONT_R = '"EB Garamond", Garamond, Georgia, serif';
export const CW = 512, CH = 716;

const INK = [24, 17, 12];
const PAPER = [233, 221, 194];

export async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load(`40px ${FONT_D}`),
      document.fonts.load(`20px ${FONT_R}`),
      document.fonts.load(`bold 20px ${FONT_R}`),
      document.fonts.load(`italic 20px ${FONT_R}`),
    ]);
  } catch (e) { /* sin fuentes: se usa la reserva */ }
}

// ───────────────────────── utilidades ─────────────────────────
export function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const g = v => { const c = Math.round(clamp(v, 0, 1) * 255); return `rgb(${c},${c},${c})`; };
const ga = (v, al) => { const c = Math.round(clamp(v, 0, 1) * 255); return `rgba(${c},${c},${c},${al})`; };
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

function makeNoise(seed) {
  const r = rng(seed); const P = new Float32Array(65536);
  for (let i = 0; i < 65536; i++) P[i] = r();
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y); const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = P[((yi & 255) << 8) | (xi & 255)], b = P[((yi & 255) << 8) | ((xi + 1) & 255)];
    const c = P[(((yi + 1) & 255) << 8) | (xi & 255)], d = P[(((yi + 1) & 255) << 8) | ((xi + 1) & 255)];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

// ───────────────────────── papel ─────────────────────────
export function paper(ctx, w, h, seed = 7, base = PAPER, opts = {}) {
  const img = ctx.createImageData(w, h); const D = img.data; const n = makeNoise(seed); const r = rng(seed + 3);
  const vig = opts.vignette ?? 0.25;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const bl = n(x * 0.01, y * 0.01) * 0.6 + n(x * 0.04 + 40, y * 0.04) * 0.3 + n(x * 0.3, y * 0.3) * 0.1;
    const dx = (x / w - 0.5) * 2, dy = (y / h - 0.5) * 2; const ed = Math.pow(Math.max(Math.abs(dx), Math.abs(dy)), 6);
    const k = (0.9 + bl * 0.13) * (1 - ed * vig) - (r() < 0.004 ? 0.12 : 0);
    D[i] = base[0] * k; D[i + 1] = base[1] * k; D[i + 2] = base[2] * k * 0.98; D[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

// ───────────────────────── grabado ─────────────────────────
// paint(t, a, r, w, h): t = tono (blanco = luz, negro = sombra), a = máscara de acento (alfa).
export function engrave(w, h, paint, opts = {}) {
  const seed = opts.seed ?? 1;
  const tc = mkCanvas(w, h), t = tc.getContext('2d');
  const ac = mkCanvas(w, h), a = ac.getContext('2d');
  t.fillStyle = '#fff'; t.fillRect(0, 0, w, h);
  paint(t, a, rng(seed), w, h);
  const T = t.getImageData(0, 0, w, h).data, A = a.getImageData(0, 0, w, h).data;
  const out = mkCanvas(w, h), o = out.getContext('2d'); const img = o.createImageData(w, h); const D = img.data;
  const nz = makeNoise(seed + 11);
  const sp = opts.spacing ?? 4.6;
  const base = opts.paper ?? PAPER;
  const ink = opts.ink ?? INK;
  const aL = opts.accent ? hexRgb(opts.accent.light) : null;
  const aD = opts.accent ? hexRgb(opts.accent.color) : null;
  const L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) L[i] = T[i * 4] / 255;
  const cover = (u, width) => {
    if (width <= 0) return 0;
    const f = u - Math.floor(u); const dist = Math.abs(f - 0.5) * 2;
    return clamp((Math.min(width, 1) - dist) * sp * 0.55 + 0.5, 0, 1);
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x; const l = L[i]; const d = 1 - l;
      const wob = (nz(x * 0.045, y * 0.045) - 0.5) * 3.2;
      const u1 = (x * 0.7071 + y * 0.7071 + wob) / sp;
      const u2 = (x * 0.7071 - y * 0.7071 + wob) / sp;
      const u3 = (y + Math.sin(x * 0.025) * 2 + wob * 0.5) / (sp * 0.9);
      let k = cover(u1, (d - 0.1) * 1.15);
      if (d > 0.42) k = Math.max(k, cover(u2, (d - 0.42) * 1.35));
      if (d > 0.7) k = Math.max(k, cover(u3, (d - 0.7) * 2.1));
      if (d > 0.94) k = 1;
      // contornos (Sobel)
      if (x > 0 && y > 0 && x < w - 1 && y < h - 1) {
        const tl = L[i - w - 1], tm = L[i - w], tr = L[i - w + 1], ml = L[i - 1], mr = L[i + 1], bl = L[i + w - 1], bm = L[i + w], br = L[i + w + 1];
        const gx = -tl - 2 * ml - bl + tr + 2 * mr + br; const gy = -tl - 2 * tm - tr + bl + 2 * bm + br;
        const e = Math.sqrt(gx * gx + gy * gy);
        k = Math.max(k, clamp((e - 0.35) * 2.4, 0, 0.95));
      }
      const pn = 0.9 + nz(x * 0.012 + 50, y * 0.012) * 0.12;
      let pr = base[0] * pn, pg = base[1] * pn, pb = base[2] * pn;
      let ir = ink[0], ig = ink[1], ib = ink[2];
      const al = A[i * 4 + 3] / 255;
      if (aL && al > 0) {
        pr = pr + (aL[0] - pr) * al; pg = pg + (aL[1] - pg) * al; pb = pb + (aL[2] - pb) * al;
        const m = al * 0.85; ir = ir + (aD[0] - ir) * m; ig = ig + (aD[1] - ig) * m; ib = ib + (aD[2] - ib) * m;
        k *= (1 - al * 0.35);
      }
      const j = i * 4;
      D[j] = pr + (ir - pr) * k; D[j + 1] = pg + (ig - pg) * k; D[j + 2] = pb + (ib - pb) * k; D[j + 3] = 255;
    }
  }
  o.putImageData(img, 0, 0);
  return out;
}

// ───────────────────────── primitivas de figura ─────────────────────────
function dir(side, deg) { const r = deg * Math.PI / 180; return [side * Math.sin(r), Math.cos(r)]; }
const POSES = {
  stand: { L: [14, 8], R: [14, 8], legs: 'stand' },
  raised: { L: [150, 172], R: [150, 172], legs: 'stride' },
  spread: { L: [95, 105], R: [95, 105], legs: 'stand' },
  strike: { L: [45, 25], R: [140, 172], legs: 'stride' },
  reach: { L: [22, 10], R: [160, 178], legs: 'stand' },
  pray: { L: [18, -160], R: [18, -160], legs: 'kneel' },
  cower: { L: [155, -110], R: [155, -110], legs: 'kneel' },
  hold: { L: [30, -120], R: [30, -120], legs: 'stand' },
  push: { L: [100, 85], R: [100, 80], legs: 'stride' },
  drum: { L: [60, -60], R: [70, 20], legs: 'stand' },
};
// Figura humana en silueta. Devuelve la posición de la cabeza y las manos.
export function figure(t, o) {
  const { x, y, h } = o; const s = h;
  const tone = o.tone ?? 0.14, hi = o.hi ?? 0.42; const lx = o.lightX ?? 1;
  const grad = t.createLinearGradient(x - s * 0.35 * lx, 0, x + s * 0.35 * lx, 0);
  grad.addColorStop(0, g(tone)); grad.addColorStop(1, g(hi));
  t.fillStyle = grad; t.strokeStyle = grad; t.lineCap = 'round'; t.lineJoin = 'round';
  const pose = POSES[o.pose || 'stand'];
  const bw = o.bloat ? 1.65 : (o.broad || 1);
  const kneel = pose.legs === 'kneel';
  const hipY = y - s * (kneel ? 0.3 : 0.47);
  const shY = y - s * (kneel ? 0.63 : 0.79);
  const lean = (o.lean || 0) * s;
  const headR = s * 0.068 * (o.headScale || 1);
  const hx = x + lean * 1.25, hy = shY - headR * 1.35;
  if (o.wings) wings(t, x + lean, shY + s * 0.06, s * o.wings, grad, o.wingUp);
  // piernas
  t.lineWidth = s * 0.075 * (o.bloat ? 1.35 : 1);
  if (!o.noLegs) {
    t.beginPath();
    if (pose.legs === 'stand') {
      t.moveTo(x - s * 0.06, hipY); t.lineTo(x - s * 0.08, y - s * 0.22); t.lineTo(x - s * 0.1, y);
      t.moveTo(x + s * 0.06, hipY); t.lineTo(x + s * 0.08, y - s * 0.22); t.lineTo(x + s * 0.1, y);
    } else if (pose.legs === 'stride') {
      t.moveTo(x - s * 0.05, hipY); t.lineTo(x - s * 0.14, y - s * 0.22); t.lineTo(x - s * 0.22, y);
      t.moveTo(x + s * 0.05, hipY); t.lineTo(x + s * 0.12, y - s * 0.24); t.lineTo(x + s * 0.18, y);
    } else {
      t.moveTo(x - s * 0.05, hipY); t.lineTo(x - s * 0.2, hipY + s * 0.02); t.lineTo(x - s * 0.21, y);
      t.moveTo(x + s * 0.05, hipY); t.lineTo(x + s * 0.06, y - s * 0.01); t.lineTo(x + s * 0.26, y);
    }
    t.stroke();
  }
  if (o.robe) {
    t.beginPath(); t.moveTo(x + lean - s * 0.14 * bw, shY);
    t.quadraticCurveTo(x - s * 0.2, y - s * 0.3, x - s * 0.26 * (o.robe), y);
    t.lineTo(x + s * 0.26 * (o.robe), y); t.quadraticCurveTo(x + s * 0.2, y - s * 0.3, x + lean + s * 0.14 * bw, shY);
    t.closePath(); t.fill();
  }
  // torso
  t.beginPath();
  const bel = o.bloat ? 0.3 : 0.17;
  t.moveTo(x + lean - s * 0.13 * bw, shY);
  t.quadraticCurveTo(x + lean * 0.5 - s * bel * bw, (shY + hipY) / 2 + s * 0.05, x - s * 0.1 * bw, hipY);
  t.lineTo(x + s * 0.1 * bw, hipY);
  t.quadraticCurveTo(x + lean * 0.5 + s * bel * bw, (shY + hipY) / 2 + s * 0.05, x + lean + s * 0.13 * bw, shY);
  t.closePath(); t.fill();
  // brazos
  const hands = [];
  const armSet = o.sixArms ? [[0, 1], [-0.06, 0.8], [0.08, 0.6]] : [[0, 1]];
  for (const [dy, mul] of armSet) {
    for (const side of [-1, 1]) {
      const ang = side < 0 ? pose.L : pose.R;
      const extra = o.sixArms ? (dy < 0 ? 35 : dy > 0 ? -35 : 0) : 0;
      const sx = x + lean + side * s * 0.12 * bw, sy = shY + s * (0.03 + dy);
      const [ax, ay] = dir(side, ang[0] + extra); const [bx, by] = dir(side, ang[1] + extra);
      const ex = sx + ax * s * 0.2 * mul, ey = sy + ay * s * 0.2 * mul; const wx = ex + bx * s * 0.19 * mul, wy = ey + by * s * 0.19 * mul;
      t.lineWidth = s * 0.052 * (o.bloat ? 1.4 : 1) * mul;
      t.beginPath(); t.moveTo(sx, sy); t.lineTo(ex, ey); t.lineTo(wx, wy); t.stroke();
      t.beginPath(); t.arc(wx, wy, s * 0.028 * mul, 0, 7); t.fill();
      hands.push([wx, wy]);
    }
  }
  // cabeza
  t.beginPath(); t.ellipse(hx, hy, headR * 0.85, headR, 0, 0, 7); t.fill();
  if (o.bull) {
    t.beginPath(); t.ellipse(hx, hy + headR * 0.5, headR * 1.1, headR * 0.8, 0, 0, 7); t.fill();
    horns(t, hx, hy, headR, 1.4);
  }
  if (o.horns) horns(t, hx, hy, headR, o.horns);
  if (o.hood) {
    t.beginPath(); t.moveTo(hx - headR * 1.4, hy + headR * 2.2);
    t.quadraticCurveTo(hx - headR * 1.6, hy - headR * 1.5, hx + headR * 0.2, hy - headR * 2.1);
    t.quadraticCurveTo(hx + headR * 1.6, hy - headR * 1.2, hx + headR * 1.4, hy + headR * 2.2); t.closePath(); t.fill();
  }
  if (o.crown) {
    t.beginPath(); t.moveTo(hx - headR, hy - headR * 0.6);
    for (let k = 0; k <= 4; k++) { t.lineTo(hx - headR + k * headR * 0.5, hy - headR * (k % 2 ? 1.1 : 1.9)); }
    t.lineTo(hx + headR, hy - headR * 0.6); t.closePath(); t.fill();
  }
  if (o.laurel) {
    t.lineWidth = headR * 0.35; t.beginPath(); t.arc(hx, hy - headR * 0.1, headR * 1.05, Math.PI * 0.95, Math.PI * 2.05); t.stroke();
  }
  return { hx, hy, headR, hands, shY, hipY };
}
function horns(t, hx, hy, r, sz) {
  for (const side of [-1, 1]) {
    t.beginPath(); t.moveTo(hx + side * r * 0.45, hy - r * 0.55);
    t.quadraticCurveTo(hx + side * r * 1.9 * sz, hy - r * 1.0 * sz, hx + side * r * 1.35 * sz, hy - r * 2.6 * sz);
    t.quadraticCurveTo(hx + side * r * 1.25 * sz, hy - r * 1.35 * sz, hx + side * r * 0.05, hy - r * 0.9);
    t.closePath(); t.fill();
  }
}
function wings(t, x, y, span, fill, up = 0.7) {
  for (const side of [-1, 1]) {
    t.fillStyle = fill; t.beginPath(); t.moveTo(x, y);
    t.quadraticCurveTo(x + side * span * 0.35, y - span * up * 1.1, x + side * span, y - span * up * 0.8);
    const n = 4;
    for (let i = 1; i <= n; i++) {
      const px = x + side * span * (1 - i / n) * 0.95, py = y - span * up * 0.8 * (1 - i / n) + span * 0.08 * (i === n ? 0 : 1);
      const mx = x + side * span * (1 - (i - 0.5) / n), my = py - span * 0.02;
      t.quadraticCurveTo(mx, my + span * 0.18, px, py);
    }
    t.closePath(); t.fill();
  }
}
// cuadrúpedo: perro de tres cabezas, caballo (centauro), etc.
function beast(t, o) {
  const { x, y, s } = o; const tone = o.tone ?? 0.14, hi = o.hi ?? 0.4;
  const grad = t.createLinearGradient(x - s * 0.5, y - s, x + s * 0.5, y);
  grad.addColorStop(0, g(tone)); grad.addColorStop(1, g(hi));
  t.fillStyle = grad; t.strokeStyle = grad; t.lineCap = 'round';
  const by = y - s * 0.5;
  t.lineWidth = s * 0.075;
  t.beginPath();
  for (const lx of [-0.3, -0.18, 0.2, 0.32]) { t.moveTo(x + lx * s, by); t.lineTo(x + lx * s + s * 0.02, y - s * 0.2); t.lineTo(x + lx * s - s * 0.01, y); }
  t.stroke();
  t.beginPath(); t.ellipse(x, by, s * 0.42, s * (o.bulk || 0.2), 0, 0, 7); t.fill();
  // cola
  t.lineWidth = s * 0.03; t.beginPath(); t.moveTo(x - s * 0.4, by - s * 0.05); t.quadraticCurveTo(x - s * 0.62, by - s * 0.3, x - s * 0.55, by + s * 0.15); t.stroke();
  const heads = [];
  if (o.kind === 'dog') {
    const n = o.heads || 1;
    for (let k = 0; k < n; k++) {
      const off = n === 1 ? 0 : (k - (n - 1) / 2);
      const nx = x + s * 0.32, ny = by - s * 0.08;
      const hx = x + s * (0.5 + Math.abs(off) * 0.02) + off * s * 0.05, hy = by - s * 0.36 + off * s * 0.2 - Math.abs(off) * s * 0.02;
      t.lineWidth = s * 0.11; t.beginPath(); t.moveTo(nx, ny); t.quadraticCurveTo(nx + s * 0.1, hy + s * 0.1, hx, hy); t.stroke();
      t.beginPath(); t.ellipse(hx, hy, s * 0.09, s * 0.075, 0, 0, 7); t.fill();
      t.beginPath(); t.moveTo(hx + s * 0.04, hy - s * 0.04); t.lineTo(hx + s * 0.2, hy - s * 0.005); t.lineTo(hx + s * 0.17, hy + s * 0.02); t.lineTo(hx + s * 0.04, hy + s * 0.03); t.fill();
      t.beginPath(); t.moveTo(hx + s * 0.04, hy + s * 0.04); t.lineTo(hx + s * 0.17, hy + s * 0.08); t.lineTo(hx + s * 0.03, hy + s * 0.07); t.fill();
      t.beginPath(); t.moveTo(hx - s * 0.05, hy - s * 0.05); t.lineTo(hx - s * 0.03, hy - s * 0.15); t.lineTo(hx + s * 0.02, hy - s * 0.06); t.fill();
      heads.push([hx + s * 0.05, hy - s * 0.015]);
    }
  }
  return { heads, by };
}

// ───────────────────────── fondos ─────────────────────────
function sky(t, w, h, top, bot) { const gr = t.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, g(top)); gr.addColorStop(1, g(bot)); t.fillStyle = gr; t.fillRect(0, 0, w, h); }
function glow(t, x, y, r, inner, outer, al = 1) { const gr = t.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, ga(inner, al)); gr.addColorStop(1, ga(outer, 0)); t.fillStyle = gr; t.fillRect(x - r, y - r, r * 2, r * 2); }
export function flames(t, x, y, w, h, r, col, n = 7) {
  t.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const fx = x - w / 2 + (i + 0.5) * w / n + (r() - 0.5) * w / n * 0.6; const fh = h * (0.45 + r() * 0.55); const fw = w / n * (0.8 + r() * 0.7);
    t.beginPath(); t.moveTo(fx - fw / 2, y);
    t.bezierCurveTo(fx - fw * 0.6, y - fh * 0.4, fx + fw * 0.3 * (r() - 0.5), y - fh * 0.6, fx + fw * 0.2 * (r() - 0.5) * 2, y - fh);
    t.bezierCurveTo(fx + fw * 0.2, y - fh * 0.6, fx + fw * 0.7, y - fh * 0.4, fx + fw / 2, y);
    t.closePath(); t.fill();
  }
}
function columns(t, w, h, r, tone, n = 4, groundY = 0.78) {
  for (let i = 0; i < n; i++) {
    const cx = (i + 0.5) * w / n + (r() - 0.5) * 40; const ch = h * (0.35 + r() * 0.35); const cw = 16 + r() * 16; const base = h * groundY;
    const gr = t.createLinearGradient(cx - cw, 0, cx + cw, 0); gr.addColorStop(0, g(tone - 0.12)); gr.addColorStop(0.6, g(tone + 0.12)); gr.addColorStop(1, g(tone - 0.08));
    t.fillStyle = gr; t.fillRect(cx - cw / 2, base - ch, cw, ch);
    t.fillRect(cx - cw * 0.8, base - 8, cw * 1.6, 8);
    if (r() < 0.6) t.fillRect(cx - cw * 0.75, base - ch - 7, cw * 1.5, 7);
    else { t.fillStyle = g(tone + 0.25); t.beginPath(); t.moveTo(cx - cw / 2, base - ch); t.lineTo(cx + cw / 2, base - ch + 12); t.lineTo(cx + cw / 2, base - ch); t.fill(); }
  }
}
function fogBands(t, w, h, r, n = 5, al = 0.45) {
  for (let i = 0; i < n; i++) { const y = h * (0.35 + r() * 0.55); t.fillStyle = ga(1, al * (0.5 + r() * 0.5)); t.beginPath(); t.ellipse(w * r(), y, w * (0.4 + r() * 0.4), 14 + r() * 20, 0, 0, 7); t.fill(); }
}
function iceFloor(t, w, h, y0, r) {
  const gr = t.createLinearGradient(0, y0, 0, h); gr.addColorStop(0, g(0.88)); gr.addColorStop(1, g(0.62)); t.fillStyle = gr; t.fillRect(0, y0, w, h - y0);
  t.strokeStyle = g(0.35); t.lineWidth = 1.5;
  for (let i = 0; i < 9; i++) { t.beginPath(); let x = r() * w, y = y0 + r() * (h - y0); t.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 90; y += (r() - 0.3) * 30; t.lineTo(x, y); } t.stroke(); }
}
function rain(t, w, h, r, n = 120, tone = 0.2, al = 0.5) {
  t.strokeStyle = ga(tone, al); t.lineWidth = 1.4;
  for (let i = 0; i < n; i++) { const x = r() * w * 1.2, y = r() * h; t.beginPath(); t.moveTo(x, y); t.lineTo(x - 14, y + 34); t.stroke(); }
}
function tomb(t, x, y, w, open, r, a, glowCol) {
  t.fillStyle = g(0.16); t.fillRect(x - w / 2, y - w * 0.4, w, w * 0.4);
  t.fillStyle = g(0.3); t.beginPath(); t.moveTo(x - w / 2, y - w * 0.4); t.lineTo(x + w / 2, y - w * 0.4); t.lineTo(x + w * 0.45, y - w * 0.48); t.lineTo(x - w * 0.55, y - w * 0.48); t.fill();
  if (open) {
    flames(t, x, y - w * 0.4, w * 0.9, w * 0.7, r, g(0.95), 5);
    if (a) flames(a, x, y - w * 0.4, w * 0.9, w * 0.7, rng(Math.floor(x)), glowCol || '#fff', 5);
    t.fillStyle = g(0.24); t.save(); t.translate(x + w * 0.3, y - w * 0.62); t.rotate(-0.5); t.fillRect(-w * 0.45, -6, w * 0.9, 12); t.restore();
  }
}
function arches(t, w, h, tone, n = 5) {
  for (let i = n; i >= 1; i--) {
    const k = i / n; const aw = w * 0.95 * k, ah = h * 0.95 * k; const cx = w / 2, by = h * 0.5 + ah * 0.5;
    t.fillStyle = g(tone + (1 - k) * 0.5);
    t.beginPath(); t.moveTo(cx - aw / 2, by); t.lineTo(cx - aw / 2, by - ah * 0.55);
    t.quadraticCurveTo(cx - aw / 2, by - ah, cx, by - ah); t.quadraticCurveTo(cx + aw / 2, by - ah, cx + aw / 2, by - ah * 0.55);
    t.lineTo(cx + aw / 2, by); t.closePath(); t.fill();
  }
}
function rock(t, x, y, rad, tone) {
  const gr = t.createRadialGradient(x + rad * 0.3, y - rad * 0.4, rad * 0.1, x, y, rad); gr.addColorStop(0, g(tone + 0.3)); gr.addColorStop(1, g(tone - 0.05));
  t.fillStyle = gr; t.beginPath(); t.ellipse(x, y, rad, rad * 0.85, 0.2, 0, 7); t.fill();
}
function coins(t, a, x, y, w, r, n = 40) {
  for (let i = 0; i < n; i++) {
    const cx = x + (r() - 0.5) * w, cy = y - Math.pow(r(), 2) * w * 0.25; const rr = 7 + r() * 5;
    t.fillStyle = g(0.8); t.beginPath(); t.ellipse(cx, cy, rr, rr * 0.5, 0, 0, 7); t.fill(); t.strokeStyle = g(0.3); t.lineWidth = 1.2; t.stroke();
    if (a) { a.fillStyle = '#fff'; a.beginPath(); a.ellipse(cx, cy, rr, rr * 0.5, 0, 0, 7); a.fill(); }
  }
}
function crystals(t, a, x, y, s, r, n = 5) {
  for (let i = 0; i < n; i++) {
    const cx = x + (r() - 0.5) * s * 1.2, hgt = s * (0.4 + r() * 0.8), wd = s * (0.1 + r() * 0.12), tilt = (r() - 0.5) * 0.6;
    const draw = (c, col) => { c.save(); c.translate(cx, y); c.rotate(tilt); c.fillStyle = col; c.beginPath(); c.moveTo(-wd, 0); c.lineTo(-wd, -hgt * 0.8); c.lineTo(0, -hgt); c.lineTo(wd, -hgt * 0.8); c.lineTo(wd, 0); c.closePath(); c.fill(); c.restore(); };
    draw(t, g(0.75 + r() * 0.2)); if (a) draw(a, 'rgba(255,255,255,0.9)');
  }
}
function chainsDraw(t, x1, y1, x2, y2, tone, sz = 9) {
  const d = Math.hypot(x2 - x1, y2 - y1); const n = Math.floor(d / (sz * 1.6)); const ang = Math.atan2(y2 - y1, x2 - x1);
  t.strokeStyle = g(tone); t.lineWidth = sz * 0.38;
  for (let i = 0; i < n; i++) {
    const px = x1 + (x2 - x1) * i / n, py = y1 + (y2 - y1) * i / n;
    t.save(); t.translate(px, py); t.rotate(ang); t.beginPath(); t.ellipse(0, 0, sz, i % 2 ? sz * 0.25 : sz * 0.55, 0, 0, 7); t.stroke(); t.restore();
  }
}
function mask(t, x, y, s, fill, holes = true) {
  t.fillStyle = fill; t.beginPath(); t.moveTo(x - s * 0.5, y - s * 0.45);
  t.quadraticCurveTo(x, y - s * 0.62, x + s * 0.5, y - s * 0.45);
  t.quadraticCurveTo(x + s * 0.52, y + s * 0.2, x, y + s * 0.6); t.quadraticCurveTo(x - s * 0.52, y + s * 0.2, x - s * 0.5, y - s * 0.45); t.fill();
  if (holes) {
    t.save(); t.globalCompositeOperation = 'destination-out';
    t.beginPath(); t.ellipse(x - s * 0.2, y - s * 0.12, s * 0.12, s * 0.07, -0.25, 0, 7); t.ellipse(x + s * 0.2, y - s * 0.12, s * 0.12, s * 0.07, 0.25, 0, 7); t.fill();
    t.restore();
    t.fillStyle = g(0.05); t.beginPath(); t.ellipse(x - s * 0.2, y - s * 0.12, s * 0.12, s * 0.07, -0.25, 0, 7); t.ellipse(x + s * 0.2, y - s * 0.12, s * 0.12, s * 0.07, 0.25, 0, 7); t.fill();
    t.beginPath(); t.moveTo(x - s * 0.15, y + s * 0.28); t.quadraticCurveTo(x, y + s * 0.2, x + s * 0.15, y + s * 0.28); t.lineWidth = s * 0.04; t.strokeStyle = g(0.05); t.stroke();
  }
}
function sword(t, x1, y1, x2, y2, w, tone) {
  const ang = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1);
  t.save(); t.translate(x1, y1); t.rotate(ang); t.fillStyle = g(tone);
  t.beginPath(); t.moveTo(0, -w / 2); t.lineTo(len * 0.9, -w / 2); t.lineTo(len, 0); t.lineTo(len * 0.9, w / 2); t.lineTo(0, w / 2); t.fill();
  t.fillStyle = g(0.1); t.fillRect(-w * 0.6, -w * 2, w * 0.8, w * 4); t.fillRect(-w * 3, -w * 0.4, w * 2.6, w * 0.8);
  t.restore();
}
function halo(t, x, y, r, a) {
  t.lineWidth = r * 0.14; t.strokeStyle = g(0.97); t.beginPath(); t.arc(x, y, r, 0, 7); t.stroke();
  glow(t, x, y, r * 2.2, 0.98, 0.7, 0.8);
  if (a) { a.lineWidth = r * 0.22; a.strokeStyle = '#fff'; a.beginPath(); a.arc(x, y, r, 0, 7); a.stroke(); glowA(a, x, y, r * 1.8, 0.7); }
}
function glowA(a, x, y, r, al = 1) { const gr = a.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,255,${al})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); a.fillStyle = gr; a.fillRect(x - r, y - r, r * 2, r * 2); }
function eyes(a, x, y, sep, rad = 3) { a.fillStyle = '#fff'; a.beginPath(); a.arc(x - sep, y, rad, 0, 7); a.arc(x + sep, y, rad, 0, 7); a.fill(); glowA(a, x, y, sep * 3, 0.5); }
function eyesT(t, x, y, sep, rad = 3) { t.fillStyle = g(1); t.beginPath(); t.arc(x - sep, y, rad, 0, 7); t.arc(x + sep, y, rad, 0, 7); t.fill(); }
function boat(t, x, y, w) {
  t.fillStyle = g(0.12); t.beginPath(); t.moveTo(x - w / 2, y - w * 0.12); t.quadraticCurveTo(x - w * 0.3, y + w * 0.08, x, y + w * 0.08);
  t.quadraticCurveTo(x + w * 0.3, y + w * 0.08, x + w / 2, y - w * 0.16); t.lineTo(x + w * 0.4, y - w * 0.06); t.lineTo(x - w * 0.4, y - w * 0.04); t.closePath(); t.fill();
}
function water(t, w, h, y0, tone) {
  const gr = t.createLinearGradient(0, y0, 0, h); gr.addColorStop(0, g(tone + 0.2)); gr.addColorStop(1, g(tone)); t.fillStyle = gr; t.fillRect(0, y0, w, h - y0);
  t.strokeStyle = ga(0.9, 0.35); t.lineWidth = 1.3;
  for (let y = y0 + 6; y < h; y += 9) { t.beginPath(); for (let x = 0; x <= w; x += 12) t.lineTo(x, y + Math.sin(x * 0.05 + y) * 2); t.stroke(); }
}
function scaleIcon(t, x, y, s, tone) {
  t.strokeStyle = g(tone); t.fillStyle = g(tone); t.lineWidth = s * 0.05;
  t.beginPath(); t.moveTo(x, y - s * 0.5); t.lineTo(x, y + s * 0.45); t.moveTo(x - s * 0.5, y - s * 0.32); t.lineTo(x + s * 0.5, y - s * 0.38); t.stroke();
  for (const [px, py] of [[x - s * 0.5, y - s * 0.32], [x + s * 0.5, y - s * 0.38]]) {
    t.beginPath(); t.moveTo(px, py); t.lineTo(px - s * 0.18, py + s * 0.35); t.moveTo(px, py); t.lineTo(px + s * 0.18, py + s * 0.35); t.stroke();
    t.beginPath(); t.ellipse(px, py + s * 0.37, s * 0.22, s * 0.06, 0, 0, Math.PI); t.fill();
  }
  t.fillRect(x - s * 0.2, y + s * 0.42, s * 0.4, s * 0.07);
}

// ───────────────────────── ilustraciones por carta ─────────────────────────
const ART = {
  diomedes(t, a, r, W, H) { ART.ulises(t, a, r, W, H); },
  diablillo(t, a, r, W, H) {
    sky(t, W, H, 0.15, 0.3); glow(t, W * 0.5, H * 0.95, H * 0.8, 0.95, 0.2);
    tomb(t, W * 0.15, H * 0.98, 120, true, r, a); tomb(t, W * 0.88, H * 0.98, 110, true, r, a);
    const f = figure(t, { x: W * 0.5, y: H * 0.92, h: H * 0.55, pose: 'raised', horns: 1.1, wings: 0.45, lean: 0.03, tone: 0.08, hi: 0.3 });
    eyes(a, f.hx, f.hy, 7, 3); eyesT(t, f.hx, f.hy, 7, 3);
  },
  tamborilero(t, a, r, W, H) {
    sky(t, W, H, 0.2, 0.1); glow(t, W * 0.5, H * 0.6, H * 0.6, 0.95, 0.15);
    flames(t, W * 0.5, H, W * 1.1, H * 0.35, r, g(0.9), 10); flames(a, W * 0.5, H, W * 1.1, H * 0.35, rng(3), 'rgba(255,255,255,.9)', 10);
    const f = figure(t, { x: W * 0.46, y: H * 0.95, h: H * 0.62, pose: 'drum', horns: 0.9, tone: 0.08, hi: 0.3, bloat: false, broad: 1.2 });
    t.fillStyle = g(0.35); t.beginPath(); t.ellipse(W * 0.62, H * 0.68, 60, 70, 0, 0, 7); t.fill(); t.fillStyle = g(0.8); t.beginPath(); t.ellipse(W * 0.62, H * 0.6, 58, 18, 0, 0, 7); t.fill();
    eyes(a, f.hx, f.hy, 6, 2.5);
  },
  iracundo(t, a, r, W, H) {
    sky(t, W, H, 0.3, 0.15); water(t, W, H, H * 0.62, 0.15);
    for (let i = 0; i < 6; i++) figure(t, { x: 40 + i * 90 + r() * 20, y: H * 0.7, h: 70, pose: i % 2 ? 'raised' : 'strike', tone: 0.25, hi: 0.35, noLegs: true });
    const f = figure(t, { x: W * 0.5, y: H * 1.02, h: H * 0.75, pose: 'raised', tone: 0.06, hi: 0.3, lean: -0.02 });
    glowA(a, f.hx, f.hy + 30, 60, 0.4); flames(a, W * 0.5, H * 0.62, W, 60, r, 'rgba(255,255,255,.7)', 12);
  },
  guerrero(t, a, r, W, H) {
    sky(t, W, H, 0.25, 0.6); glow(t, W * 0.8, H * 0.2, 220, 0.95, 0.4);
    const f = figure(t, { x: W * 0.45, y: H * 0.98, h: H * 0.78, pose: 'strike', horns: 1.3, wings: 0.5, tone: 0.06, hi: 0.35, lightX: 1 });
    const hd = f.hands[1]; sword(t, hd[0], hd[1], hd[0] + 120, hd[1] - 110, 12, 0.85);
    a.save(); a.globalAlpha = 0.9; sword(a, hd[0], hd[1], hd[0] + 120, hd[1] - 110, 14, 1); a.restore(); glowA(a, hd[0] + 70, hd[1] - 60, 60, 0.6);
    eyes(a, f.hx, f.hy, 7, 3);
  },
  condenado(t, a, r, W, H) {
    sky(t, W, H, 0.12, 0.2);
    const f = figure(t, { x: W * 0.5, y: H * 0.95, h: H * 0.7, pose: 'cower', tone: 0.15, hi: 0.35 });
    flames(t, W * 0.5, H, W * 0.7, H * 0.85, r, g(0.93), 9); flames(a, W * 0.5, H, W * 0.7, H * 0.85, rng(9), 'rgba(255,255,255,.95)', 9);
  },
  flegias(t, a, r, W, H) {
    sky(t, W, H, 0.28, 0.12); glow(t, W * 0.3, H * 0.35, 200, 0.9, 0.3);
    water(t, W, H, H * 0.7, 0.12); flames(a, W * 0.2, H * 0.72, W * 0.5, 50, r, 'rgba(255,255,255,.8)', 6); flames(t, W * 0.2, H * 0.72, W * 0.5, 50, r, g(0.85), 6);
    boat(t, W * 0.55, H * 0.8, W * 0.8);
    const f = figure(t, { x: W * 0.62, y: H * 0.76, h: H * 0.55, pose: 'hold', hood: true, robe: 1.1, tone: 0.06, hi: 0.3 });
    t.strokeStyle = g(0.1); t.lineWidth = 7; t.beginPath(); t.moveTo(W * 0.4, H * 0.1); t.lineTo(W * 0.75, H * 0.95); t.stroke();
    eyes(a, f.hx, f.hy + 4, 6, 2.5);
  },
  hoguera(t, a, r, W, H) {
    sky(t, W, H, 0.1, 0.25); water(t, W, H, H * 0.75, 0.1);
    flames(t, W * 0.5, H * 0.8, W * 0.8, H * 0.75, r, g(0.95), 11); flames(a, W * 0.5, H * 0.8, W * 0.8, H * 0.75, rng(21), '#fff', 11);
    for (let i = 0; i < 3; i++) figure(t, { x: W * (0.3 + i * 0.2), y: H * 0.82, h: 120, pose: 'raised', tone: 0.05, hi: 0.2, noLegs: true });
  },
  impetu(t, a, r, W, H) {
    sky(t, W, H, 0.55, 0.25); t.strokeStyle = ga(0.95, 0.8);
    for (let i = 0; i < 18; i++) { t.lineWidth = 2 + r() * 4; const y = H * r(); t.beginPath(); t.moveTo(0, y); t.lineTo(W * (0.3 + r() * 0.4), y + (r() - 0.5) * 20); t.stroke(); }
    const f = figure(t, { x: W * 0.55, y: H * 0.95, h: H * 0.72, pose: 'push', horns: 0.8, lean: 0.12, tone: 0.06, hi: 0.35 });
    glowA(a, f.hx + 10, f.hy + 60, 120, 0.8); eyes(a, f.hx, f.hy, 6);
  },
  furia(t, a, r, W, H) {
    sky(t, W, H, 0.2, 0.08); glow(t, W / 2, H * 0.45, 200, 1, 0.2);
    const f = figure(t, { x: W * 0.5, y: H * 1.05, h: H * 0.85, pose: 'raised', tone: 0.04, hi: 0.25, broad: 1.2 });
    flames(a, W * 0.5, f.hy + 20, 140, 160, r, '#fff', 5); flames(t, W * 0.5, f.hy + 20, 140, 160, r, g(0.95), 5);
  },
  espada(t, a, r, W, H) {
    sky(t, W, H, 0.12, 0.3); glow(t, W / 2, H * 0.4, 180, 0.9, 0.2);
    sword(t, W * 0.5, H * 0.95, W * 0.5, H * 0.05, 30, 0.8);
    a.save(); sword(a, W * 0.5, H * 0.85, W * 0.5, H * 0.05, 26, 1); a.restore();
    chainsDraw(t, W * 0.1, H * 0.2, W * 0.45, H * 0.7, 0.2, 10); chainsDraw(t, W * 0.9, H * 0.25, W * 0.55, H * 0.7, 0.2, 10);
  },
  cerbero(t, a, r, W, H) {
    sky(t, W, H, 0.45, 0.3); rain(t, W, H, r, 140, 0.25, 0.6);
    t.fillStyle = g(0.2); t.fillRect(0, H * 0.82, W, H * 0.18);
    const b = beast(t, { x: W * 0.42, y: H * 0.92, s: W * 0.72, kind: 'dog', heads: 3, tone: 0.05, hi: 0.3, bulk: 0.22 });
    for (const [hx, hy] of b.heads) { a.fillStyle = '#fff'; a.beginPath(); a.arc(hx, hy, 4, 0, 7); a.fill(); glowA(a, hx + 20, hy + 20, 30, 0.7); }
  },
  larva(t, a, r, W, H) {
    sky(t, W, H, 0.5, 0.3); rain(t, W, H, r, 80, 0.3, 0.4); t.fillStyle = g(0.25); t.fillRect(0, H * 0.7, W, H * 0.3);
    for (let i = 0; i < 5; i++) { const x = W * (0.2 + i * 0.15), y = H * (0.75 + (i % 2) * 0.08); t.fillStyle = g(0.12); t.beginPath(); t.ellipse(x, y, 40, 16, (i - 2) * 0.3, 0, 7); t.fill(); }
    t.fillStyle = g(0.1); t.beginPath(); t.ellipse(W * 0.5, H * 0.6, 150, 70, -0.2, 0, 7); t.fill();
    for (let k = 0; k < 6; k++) { t.strokeStyle = g(0.4); t.lineWidth = 3; t.beginPath(); t.ellipse(W * 0.5 - 100 + k * 40, H * 0.6 - 10 + k * 3, 8, 55, -0.2, 0, 7); t.stroke(); }
    a.fillStyle = '#fff'; a.beginPath(); a.ellipse(W * 0.72, H * 0.52, 26, 22, 0, 0, 7); a.fill(); t.fillStyle = g(0.9); t.beginPath(); t.ellipse(W * 0.72, H * 0.52, 26, 22, 0, 0, 7); t.fill();
  },
  devorador(t, a, r, W, H) {
    sky(t, W, H, 0.4, 0.25); rain(t, W, H, r, 90, 0.25, 0.5);
    const f = figure(t, { x: W * 0.5, y: H * 1.02, h: H * 0.9, pose: 'hold', bloat: true, tone: 0.06, hi: 0.3 });
    a.fillStyle = '#fff'; a.beginPath(); a.ellipse(f.hx, f.hy + 12, 20, 13, 0, 0, 7); a.fill(); t.fillStyle = g(0.85); t.beginPath(); t.ellipse(f.hx, f.hy + 12, 20, 13, 0, 0, 7); t.fill();
  },
  gloton(t, a, r, W, H) {
    sky(t, W, H, 0.55, 0.35); rain(t, W, H, r, 160, 0.22, 0.6);
    t.fillStyle = g(0.3); t.fillRect(0, H * 0.8, W, H * 0.2);
    const f = figure(t, { x: W * 0.5, y: H * 0.95, h: H * 0.66, pose: 'pray', bloat: true, tone: 0.1, hi: 0.35 });
    halo(t, f.hx, f.hy - 18, 26, a);
  },
  bestia(t, a, r, W, H) {
    sky(t, W, H, 0.35, 0.2); rain(t, W, H, r, 100, 0.2, 0.5);
    t.fillStyle = g(0.16); t.fillRect(0, H * 0.78, W, H * 0.22);
    const b = beast(t, { x: W * 0.45, y: H * 0.95, s: W * 0.85, kind: 'dog', heads: 1, tone: 0.04, hi: 0.26, bulk: 0.3 });
    const [hx, hy] = b.heads[0]; a.fillStyle = '#fff'; a.beginPath(); a.ellipse(hx + 30, hy + 20, 32, 12, 0.2, 0, 7); a.fill();
  },
  festin(t, a, r, W, H) {
    sky(t, W, H, 0.2, 0.1); glow(t, W / 2, H * 0.4, 200, 0.85, 0.2);
    t.fillStyle = g(0.25); t.fillRect(W * 0.08, H * 0.62, W * 0.84, 18); t.fillRect(W * 0.12, H * 0.62, 12, H * 0.38); t.fillRect(W * 0.86, H * 0.62, 12, H * 0.38);
    for (let i = 0; i < 4; i++) figure(t, { x: W * (0.2 + i * 0.2), y: H * 0.72, h: 150, pose: 'hold', bloat: true, tone: 0.08, hi: 0.25, noLegs: true });
    a.fillStyle = '#fff'; a.beginPath(); a.ellipse(W * 0.5, H * 0.6, 70, 20, 0, 0, 7); a.fill(); t.fillStyle = g(0.8); t.beginPath(); t.ellipse(W * 0.5, H * 0.6, 70, 20, 0, 0, 7); t.fill();
  },
  lluvia(t, a, r, W, H) {
    sky(t, W, H, 0.6, 0.4); rain(t, W, H, r, 260, 0.15, 0.7);
    const f = figure(t, { x: W * 0.5, y: H * 0.98, h: H * 0.7, pose: 'cower', tone: 0.1, hi: 0.3 });
    t.strokeStyle = ga(1, 0.9); t.lineWidth = 6; t.beginPath(); t.arc(W / 2, H * 0.62, 150, Math.PI * 1.1, Math.PI * 1.9); t.stroke();
    a.strokeStyle = '#fff'; a.lineWidth = 10; a.beginPath(); a.arc(W / 2, H * 0.62, 150, Math.PI * 1.1, Math.PI * 1.9); a.stroke();
  },
  colmillo(t, a, r, W, H) {
    sky(t, W, H, 0.2, 0.35); glow(t, W / 2, H / 2, 200, 0.9, 0.2);
    t.fillStyle = g(0.92); t.beginPath(); t.moveTo(W * 0.4, H * 0.15); t.quadraticCurveTo(W * 0.75, H * 0.35, W * 0.55, H * 0.9); t.quadraticCurveTo(W * 0.52, H * 0.4, W * 0.4, H * 0.15); t.fill();
    a.fillStyle = 'rgba(255,255,255,.6)'; a.beginPath(); a.moveTo(W * 0.4, H * 0.15); a.quadraticCurveTo(W * 0.75, H * 0.35, W * 0.55, H * 0.9); a.quadraticCurveTo(W * 0.52, H * 0.4, W * 0.4, H * 0.15); a.fill();
    chainsDraw(t, W * 0.1, H * 0.1, W * 0.42, H * 0.2, 0.15, 9);
  },
  pluto(t, a, r, W, H) {
    sky(t, W, H, 0.1, 0.1); arches(t, W, H, 0.08, 5); coins(t, a, W / 2, H * 0.98, W, r, 60);
    const f = figure(t, { x: W * 0.5, y: H * 0.9, h: H * 0.75, pose: 'spread', horns: 1, crown: true, broad: 1.4, tone: 0.05, hi: 0.3 });
    eyes(a, f.hx, f.hy, 6);
  },
  avaro(t, a, r, W, H) {
    sky(t, W, H, 0.12, 0.2); arches(t, W, H, 0.1, 4);
    rock(t, W * 0.62, H * 0.62, 120, 0.35);
    figure(t, { x: W * 0.32, y: H * 0.95, h: H * 0.6, pose: 'push', lean: 0.12, tone: 0.06, hi: 0.3 });
    coins(t, a, W * 0.5, H, W * 0.9, r, 30);
  },
  codicioso(t, a, r, W, H) {
    sky(t, W, H, 0.1, 0.2); arches(t, W, H, 0.08, 6); fogBands(t, W, H, r, 4, 0.3);
    const f = figure(t, { x: W * 0.5, y: H * 0.95, h: H * 0.75, pose: 'reach', hood: true, robe: 1.3, tone: 0.18, hi: 0.4 });
    coins(t, a, f.hands[1][0], f.hands[1][1] + 10, 60, r, 8);
  },
  moneda(t, a, r, W, H) {
    sky(t, W, H, 0.08, 0.15); glow(t, W / 2, H * 0.45, 200, 0.9, 0.1);
    t.fillStyle = g(0.9); t.beginPath(); t.arc(W / 2, H * 0.45, 120, 0, 7); t.fill(); t.strokeStyle = g(0.3); t.lineWidth = 6; t.beginPath(); t.arc(W / 2, H * 0.45, 100, 0, 7); t.stroke();
    drawSealShape(t, W / 2, H * 0.45, 80, g(0.3));
    a.fillStyle = '#fff'; a.beginPath(); a.arc(W / 2, H * 0.45, 120, 0, 7); a.fill();
    for (let i = 0; i < 5; i++) { t.strokeStyle = g(0.15); t.lineWidth = 5; t.beginPath(); t.moveTo(W * 0.15 + i * 90, H); t.quadraticCurveTo(W / 2, H * 0.7, W / 2 + (i - 2) * 30, H * 0.58); t.stroke(); }
  },
  pesos(t, a, r, W, H) {
    sky(t, W, H, 0.12, 0.2); arches(t, W, H, 0.1, 4);
    t.fillStyle = g(0.4); t.fillRect(W * 0.3, H * 0.5, W * 0.4, H * 0.35); t.fillStyle = g(0.7); t.fillRect(W * 0.3, H * 0.5, W * 0.4, 12);
    a.fillStyle = '#fff'; a.fillRect(W * 0.3, H * 0.5, W * 0.4, 12);
    chainsDraw(t, W * 0.35, H * 0.5, W * 0.2, H * 0.05, 0.15, 11); chainsDraw(t, W * 0.65, H * 0.5, W * 0.8, H * 0.05, 0.15, 11);
  },
  falsificador(t, a, r, W, H) {
    sky(t, W, H, 0.12, 0.2); arches(t, W, H, 0.05, 6);
    const f = figure(t, { x: W * 0.5, y: H * 0.98, h: H * 0.75, pose: 'hold', hood: true, robe: 1.2, tone: 0.1, hi: 0.35 });
    mask(t, W * 0.5, f.hands[0][1] - 20, 80, g(0.92)); mask(a, W * 0.5, f.hands[0][1] - 20, 80, '#fff', false);
  },
  espectro(t, a, r, W, H) {
    sky(t, W, H, 0.3, 0.12); arches(t, W, H, 0.1, 5); fogBands(t, W, H, r, 8, 0.5);
    const f = figure(t, { x: W * 0.5, y: H * 0.9, h: H * 0.7, pose: 'spread', wings: 0.6, robe: 1.4, tone: 0.3, hi: 0.55, noLegs: true });
    eyes(a, f.hx, f.hy, 6, 3); eyesT(t, f.hx, f.hy, 6, 3);
  },
  gerion(t, a, r, W, H) {
    sky(t, W, H, 0.08, 0.3); arches(t, W, H, 0.06, 4);
    const b = beast(t, { x: W * 0.45, y: H * 0.95, s: W * 0.8, kind: 'none', tone: 0.05, hi: 0.3, bulk: 0.16 });
    wings(t, W * 0.45, H * 0.52, W * 0.42, g(0.1), 0.9);
    const f = figure(t, { x: W * 0.72, y: H * 0.6, h: H * 0.4, pose: 'hold', tone: 0.12, hi: 0.4, noLegs: true });
    t.strokeStyle = g(0.1); t.lineWidth = 16; t.beginPath(); t.moveTo(W * 0.1, H * 0.5); t.quadraticCurveTo(W * 0.02, H * 0.2, W * 0.2, H * 0.12); t.stroke();
    mask(a, f.hx, f.hy + 5, 40, '#fff', false);
  },
  ulises(t, a, r, W, H) {
    sky(t, W, H, 0.08, 0.2); glow(t, W / 2, H * 0.5, 240, 0.95, 0.1);
    flames(t, W * 0.42, H * 0.95, 170, H * 0.9, r, g(0.95), 3); flames(t, W * 0.6, H * 0.95, 150, H * 0.8, r, g(0.95), 3);
    flames(a, W * 0.5, H * 0.95, 300, H * 0.9, rng(4), 'rgba(255,255,255,.85)', 6);
    const f = figure(t, { x: W * 0.5, y: H * 0.95, h: H * 0.62, pose: 'reach', tone: 0.08, hi: 0.3, laurel: true });
  },
  engano(t, a, r, W, H) {
    sky(t, W, H, 0.15, 0.3); arches(t, W, H, 0.05, 7);
    mask(t, W * 0.5, H * 0.45, 230, g(0.9)); mask(a, W * 0.5, H * 0.45, 230, '#fff', false);
    for (let i = 0; i < 2; i++) mask(t, W * (0.18 + i * 0.64), H * 0.75, 90, g(0.4));
  },
  espejismo(t, a, r, W, H) {
    sky(t, W, H, 0.2, 0.1);
    t.fillStyle = g(0.8); t.beginPath(); t.ellipse(W / 2, H * 0.48, 150, 210, 0, 0, 7); t.fill(); t.strokeStyle = g(0.1); t.lineWidth = 16; t.stroke();
    a.strokeStyle = 'rgba(255,255,255,.9)'; a.lineWidth = 10; a.beginPath(); a.ellipse(W / 2, H * 0.48, 150, 210, 0, 0, 7); a.stroke();
    figure(t, { x: W / 2, y: H * 0.85, h: 260, pose: 'reach', tone: 0.45, hi: 0.65, horns: 1 });
    figure(t, { x: W / 2 + 40, y: H * 1.02, h: 330, pose: 'stand', tone: 0.06, hi: 0.2, lightX: -1 });
  },
  mascara(t, a, r, W, H) {
    sky(t, W, H, 0.1, 0.25); glow(t, W / 2, H * 0.45, 220, 0.85, 0.1);
    mask(t, W / 2, H * 0.45, 260, g(0.93)); mask(a, W / 2, H * 0.45, 260, '#fff', false);
    t.strokeStyle = g(0.15); t.lineWidth = 4; t.beginPath(); t.moveTo(W / 2 - 130, H * 0.33); t.quadraticCurveTo(W * 0.1, H * 0.2, W * 0.05, H * 0.6); t.stroke();
  },
  centinela(t, a, r, W, H) {
    sky(t, W, H, 0.1, 0.25); iceFloor(t, W, H, H * 0.6, r);
    const f = figure(t, { x: W * 0.5, y: H * 1.05, h: H * 0.85, pose: 'stand', horns: 0.9, broad: 1.3, tone: 0.1, hi: 0.35 });
    crystals(t, a, W * 0.5, H, W * 0.8, r, 9); crystals(t, a, f.hx, f.shY + 20, 110, r, 4);
    eyes(a, f.hx, f.hy, 6, 2.5);
  },
  congelado(t, a, r, W, H) {
    sky(t, W, H, 0.06, 0.2); iceFloor(t, W, H, H * 0.55, r);
    const f = figure(t, { x: W * 0.5, y: H * 1.0, h: H * 0.8, pose: 'spread', horns: 1.3, wings: 0.55, tone: 0.06, hi: 0.3 });
    crystals(t, a, W * 0.5, H, W * 0.9, r, 10);
    t.fillStyle = ga(0.95, 0.35); t.fillRect(0, H * 0.72, W, H * 0.28); a.fillStyle = 'rgba(255,255,255,.35)'; a.fillRect(0, H * 0.72, W, H * 0.28);
  },
  traidor(t, a, r, W, H) {
    sky(t, W, H, 0.08, 0.2); iceFloor(t, W, H, H * 0.45, r);
    for (let i = 0; i < 5; i++) { const x = W * (0.12 + i * 0.19), y = H * (0.6 + (i % 2) * 0.15); t.fillStyle = g(0.15); t.beginPath(); t.ellipse(x, y, 22, 26, 0, 0, 7); t.fill(); }
    t.fillStyle = g(0.08); t.beginPath(); t.ellipse(W * 0.5, H * 0.66, 50, 58, 0, 0, 7); t.fill();
    t.fillStyle = ga(0.95, 0.5); t.fillRect(0, H * 0.7, W, H * 0.3); a.fillStyle = 'rgba(255,255,255,.55)'; a.fillRect(0, H * 0.7, W, H * 0.3);
  },
  ugolino(t, a, r, W, H) {
    sky(t, W, H, 0.05, 0.18); iceFloor(t, W, H, H * 0.6, r);
    const f = figure(t, { x: W * 0.5, y: H * 0.95, h: H * 0.7, pose: 'hold', lean: 0.14, tone: 0.05, hi: 0.3, broad: 1.2 });
    t.fillStyle = g(0.3); t.beginPath(); t.ellipse(W * 0.66, H * 0.75, 34, 30, 0, 0, 7); t.fill();
    crystals(t, a, W * 0.5, H, W, r, 8);
  },
  lucifer(t, a, r, W, H) {
    sky(t, W, H, 0.02, 0.12); iceFloor(t, W, H, H * 0.78, r);
    const f = figure(t, { x: W * 0.5, y: H * 1.25, h: H * 1.2, pose: 'spread', horns: 1.4, wings: 0.7, sixArms: true, broad: 1.5, tone: 0.03, hi: 0.2 });
    for (const dx of [-26, 0, 26]) { a.fillStyle = '#fff'; a.beginPath(); a.arc(f.hx + dx, f.hy, 3.5, 0, 7); a.fill(); }
    glowA(a, f.hx, f.hy, 90, 0.5); crystals(t, a, W * 0.5, H, W, r, 12);
  },
  silencio(t, a, r, W, H) {
    sky(t, W, H, 0.12, 0.3); iceFloor(t, W, H, H * 0.7, r);
    const f = figure(t, { x: W * 0.5, y: H * 1.05, h: H * 0.9, pose: 'pray', tone: 0.08, hi: 0.3 });
    crystals(t, a, W / 2, H, W * 0.6, r, 7); glowA(a, f.hx, f.hy, 60, 0.7);
  },
  escarcha(t, a, r, W, H) {
    sky(t, W, H, 0.15, 0.4);
    for (let k = 0; k < 6; k++) { const ang = k * Math.PI / 3; t.save(); t.translate(W / 2, H * 0.48); t.rotate(ang); t.fillStyle = g(0.9); t.fillRect(-6, -170, 12, 170); for (let j = 1; j < 4; j++) { t.save(); t.translate(0, -j * 40); t.rotate(0.7); t.fillRect(-3, -40, 6, 40); t.rotate(-1.4); t.fillRect(-3, -40, 6, 40); t.restore(); } t.restore(); }
    a.save(); a.translate(W / 2, H * 0.48); for (let k = 0; k < 6; k++) { a.rotate(Math.PI / 3); a.fillStyle = '#fff'; a.fillRect(-7, -170, 14, 170); } a.restore();
    figure(t, { x: W * 0.5, y: H * 1.1, h: 280, pose: 'stand', tone: 0.06, hi: 0.2 });
  },
  cocito(t, a, r, W, H) {
    sky(t, W, H, 0.05, 0.2); iceFloor(t, W, H, H * 0.35, r);
    for (let i = 0; i < 14; i++) { const x = r() * W, y = H * (0.45 + r() * 0.5), s = 16 + (y / H) * 20; t.fillStyle = g(0.2); t.beginPath(); t.ellipse(x, y, s * 0.8, s, 0, 0, 7); t.fill(); }
    a.fillStyle = 'rgba(255,255,255,.55)'; a.fillRect(0, H * 0.35, W, H * 0.65);
    figure(t, { x: W * 0.5, y: H * 0.38, h: 180, pose: 'spread', wings: 0.8, horns: 1.2, sixArms: true, tone: 0.05, hi: 0.2 });
  },
  cadenas(t, a, r, W, H) {
    sky(t, W, H, 0.1, 0.3); iceFloor(t, W, H, H * 0.75, r);
    const f = figure(t, { x: W * 0.5, y: H * 0.95, h: H * 0.7, pose: 'spread', tone: 0.12, hi: 0.35 });
    for (const [hx, hy] of f.hands) { chainsDraw(t, hx, hy, hx < W / 2 ? 0 : W, hy - 80, 0.85, 10); chainsDraw(a, hx, hy, hx < W / 2 ? 0 : W, hy - 80, 1, 10); }
  },
  prevision(t, a, r, W, H) {
    sky(t, W, H, 0.85, 0.6); columns(t, W, H, r, 0.6, 4);
    t.fillStyle = g(0.25); t.beginPath(); t.ellipse(W / 2, H * 0.45, 150, 70, 0, 0, 7); t.fill();
    t.fillStyle = g(0.95); t.beginPath(); t.ellipse(W / 2, H * 0.45, 130, 55, 0, 0, 7); t.fill();
    t.fillStyle = g(0.08); t.beginPath(); t.arc(W / 2, H * 0.45, 42, 0, 7); t.fill(); t.fillStyle = g(1); t.beginPath(); t.arc(W / 2 - 12, H * 0.43, 9, 0, 7); t.fill();
    fogBands(t, W, H, r, 4, 0.4);
  },
  extremos(t, a, r, W, H) {
    sky(t, W, H, 0.7, 0.3); glow(t, W / 2, H * 0.2, 200, 1, 0.6);
    scaleIcon(t, W / 2, H * 0.5, 330, 0.08);
    figure(t, { x: W * 0.2, y: H * 0.7, h: 90, pose: 'pray', tone: 0.2, hi: 0.4 });
    figure(t, { x: W * 0.8, y: H * 0.7, h: 90, pose: 'cower', horns: 1, tone: 0.05, hi: 0.2 });
  },
  contricion(t, a, r, W, H) {
    sky(t, W, H, 0.3, 0.15); glow(t, W * 0.5, 0, H * 0.9, 1, 0.3);
    t.fillStyle = ga(1, 0.4); for (let i = 0; i < 7; i++) { t.beginPath(); t.moveTo(W / 2, 0); t.lineTo(W * (0.1 + i * 0.13), H); t.lineTo(W * (0.14 + i * 0.13), H); t.fill(); }
    figure(t, { x: W / 2, y: H * 0.95, h: H * 0.6, pose: 'pray', tone: 0.08, hi: 0.35 });
  },
  poeta(t, a, r, W, H) {
    sky(t, W, H, 0.92, 0.75); columns(t, W, H, r, 0.62, 5); fogBands(t, W, H, r, 6, 0.5);
    const f = figure(t, { x: W * 0.5, y: H * 0.95, h: H * 0.7, pose: 'hold', robe: 1.1, laurel: true, tone: 0.3, hi: 0.55 });
    halo(t, f.hx, f.hy, 30, a);
  },
  centauro(t, a, r, W, H) {
    sky(t, W, H, 0.55, 0.7); t.fillStyle = g(0.75); t.fillRect(0, H * 0.78, W, H * 0.22);
    t.fillStyle = g(0.35); t.fillRect(0, H * 0.84, W, 16); a.fillStyle = 'rgba(255,255,255,.7)'; a.fillRect(0, H * 0.84, W, 16);
    beast(t, { x: W * 0.42, y: H * 0.95, s: W * 0.66, kind: 'none', tone: 0.06, hi: 0.3 });
    const f = figure(t, { x: W * 0.68, y: H * 0.6, h: H * 0.48, pose: 'strike', tone: 0.06, hi: 0.3, noLegs: true });
    t.strokeStyle = g(0.1); t.lineWidth = 4; t.beginPath(); t.arc(f.hands[0][0], f.hands[0][1], 70, -1.2, 1.2); t.stroke();
  },
  minotauro(t, a, r, W, H) {
    sky(t, W, H, 0.5, 0.65); t.fillStyle = g(0.72); t.fillRect(0, H * 0.8, W, H * 0.2);
    const f = figure(t, { x: W * 0.5, y: H * 0.98, h: H * 0.85, pose: 'strike', bull: true, broad: 1.5, tone: 0.04, hi: 0.25 });
    eyes(a, f.hx, f.hy + 6, 10, 3.5); t.fillStyle = g(0.25); t.fillRect(0, H * 0.9, W, 14); a.fillStyle = 'rgba(255,255,255,.7)'; a.fillRect(0, H * 0.9, W, 14);
  },
  descensoForzado(t, a, r, W, H) {
    sky(t, W, H, 0.1, 0.05);
    for (let i = 0; i < 9; i++) { const k = 1 - i / 9; t.fillStyle = g(0.85 * k + 0.05); t.beginPath(); t.ellipse(W / 2, H * (0.2 + i * 0.07), W * 0.46 * k + 20, H * 0.1 * k + 8, 0, 0, 7); t.fill(); }
    figure(t, { x: W * 0.5, y: H * 0.28, h: 80, pose: 'stand', tone: 0.05, hi: 0.2 });
  },
  lampara(t, a, r, W, H) {
    sky(t, W, H, 0.1, 0.2); glow(t, W / 2, H * 0.45, 230, 1, 0.1);
    t.strokeStyle = g(0.15); t.lineWidth = 4; t.beginPath(); t.moveTo(W / 2, 0); t.lineTo(W / 2, H * 0.3); t.stroke();
    t.fillStyle = g(0.2); t.beginPath(); t.moveTo(W / 2 - 60, H * 0.3); t.lineTo(W / 2 + 60, H * 0.3); t.lineTo(W / 2 + 40, H * 0.62); t.lineTo(W / 2 - 40, H * 0.62); t.fill();
    t.fillStyle = g(1); t.beginPath(); t.ellipse(W / 2, H * 0.47, 30, 50, 0, 0, 7); t.fill(); glowA(a, W / 2, H * 0.47, 110, 0.9);
  },
  corona(t, a, r, W, H) {
    sky(t, W, H, 0.4, 0.15); glow(t, W / 2, H * 0.45, 200, 0.95, 0.2);
    t.strokeStyle = g(0.1); t.lineWidth = 10; for (let k = 0; k < 3; k++) { t.beginPath(); t.ellipse(W / 2, H * 0.5 + k * 6, 170, 60, 0.05 * k, 0, 7); t.stroke(); }
    t.fillStyle = g(0.1); for (let i = 0; i < 26; i++) { const an = i / 26 * Math.PI * 2; const x = W / 2 + Math.cos(an) * 170, y = H * 0.5 + Math.sin(an) * 60; t.beginPath(); t.moveTo(x - 4, y); t.lineTo(x + Math.cos(an + 1) * 22, y - 22); t.lineTo(x + 4, y); t.fill(); }
  },
  guadana(t, a, r, W, H) {
    sky(t, W, H, 0.6, 0.35); columns(t, W, H, r, 0.5, 3);
    t.strokeStyle = g(0.1); t.lineWidth = 10; t.beginPath(); t.moveTo(W * 0.3, H * 0.98); t.lineTo(W * 0.62, H * 0.1); t.stroke();
    t.fillStyle = g(0.85); t.beginPath(); t.moveTo(W * 0.62, H * 0.1); t.quadraticCurveTo(W * 0.3, H * 0.02, W * 0.1, H * 0.3); t.quadraticCurveTo(W * 0.35, H * 0.12, W * 0.6, H * 0.18); t.fill(); t.strokeStyle = g(0.2); t.lineWidth = 3; t.stroke();
  },
};

// Ilustración de Alma: mitad superior redención (halo de pan de oro), mitad inferior condena (ceniza).
function soulArt(id, s) {
  return (t, a, r, W, H) => {
    const gr = t.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, g(0.97)); gr.addColorStop(0.45, g(0.82)); gr.addColorStop(0.62, g(0.3)); gr.addColorStop(1, g(0.08));
    t.fillStyle = gr; t.fillRect(0, 0, W, H);
    t.fillStyle = ga(1, 0.35); for (let i = 0; i < 9; i++) { t.beginPath(); t.moveTo(W / 2, H * 0.1); t.lineTo(W * (i / 8), H * 0.55); t.lineTo(W * (i / 8) + 18, H * 0.55); t.fill(); }
    // ceniza
    for (let i = 0; i < 200; i++) { t.fillStyle = ga(r() < 0.5 ? 0.02 : 0.45, 0.8); t.fillRect(r() * W, H * 0.55 + r() * H * 0.45, 2 + r() * 3, 2 + r() * 3); }
    const poses = { embrace: 'hold', rage: 'raised', drown: 'raised', kneel: 'pray', cower: 'cower', push: 'push', trapped: 'spread', hood: 'hold', stand: 'stand' };
    const f = figure(t, { x: W * 0.5, y: H * 0.64, h: H * 0.42, pose: poses[s.pose] || 'stand', hood: s.pose === 'hood', tone: 0.12, hi: 0.4, bloat: s.senda === 'gula' });
    if (s.pose === 'embrace') figure(t, { x: W * 0.4, y: H * 0.64, h: H * 0.4, pose: 'hold', tone: 0.18, hi: 0.45, lightX: -1 });
    // halo de pan de oro
    a.lineWidth = 9; a.strokeStyle = '#fff'; a.beginPath(); a.arc(f.hx, f.hy, 34, 0, 7); a.stroke(); glowA(a, f.hx, f.hy, 90, 0.55);
    t.lineWidth = 6; t.strokeStyle = g(1); t.beginPath(); t.arc(f.hx, f.hy, 34, 0, 7); t.stroke();
    // reflejo condenado (figura invertida en la ceniza)
    t.save(); t.translate(0, H * 1.28); t.scale(1, -1); t.globalAlpha = 0.45;
    figure(t, { x: W * 0.5, y: H * 0.64, h: H * 0.42, pose: poses[s.pose] || 'stand', horns: 1, tone: 0.02, hi: 0.1 }); t.restore();
  };
}

function pilgrimArt(id) {
  return (t, a, r, W, H) => {
    if (id === 'francesca') {
      sky(t, W, H, 0.55, 0.3); t.strokeStyle = ga(0.95, 0.6);
      for (let i = 0; i < 16; i++) { t.lineWidth = 2 + r() * 3; t.beginPath(); t.arc(W / 2, H * 0.5, 60 + i * 18, r() * 6, r() * 6 + 1.6); t.stroke(); }
      const f = figure(t, { x: W * 0.5, y: H * 0.98, h: H * 0.8, pose: 'reach', robe: 1.2, tone: 0.1, hi: 0.35 });
      t.fillStyle = g(0.12); t.beginPath(); t.moveTo(f.hx, f.hy - 10); t.quadraticCurveTo(f.hx + 120, f.hy - 40, W, f.hy + 60); t.quadraticCurveTo(f.hx + 80, f.hy + 10, f.hx, f.hy + 30); t.fill();
      a.fillStyle = 'rgba(255,255,255,.7)'; a.beginPath(); a.moveTo(f.hx, f.hy - 10); a.quadraticCurveTo(f.hx + 120, f.hy - 40, W, f.hy + 60); a.quadraticCurveTo(f.hx + 80, f.hy + 10, f.hx, f.hy + 30); a.fill();
    } else if (id === 'virgilio') {
      sky(t, W, H, 0.9, 0.6); columns(t, W, H, r, 0.6, 3); fogBands(t, W, H, r, 5, 0.5);
      const f = figure(t, { x: W * 0.5, y: H * 0.98, h: H * 0.82, pose: 'reach', robe: 1.3, laurel: true, tone: 0.1, hi: 0.35 });
      glowA(a, f.hands[1][0], f.hands[1][1], 50, 0.9); t.fillStyle = g(1); t.beginPath(); t.arc(f.hands[1][0], f.hands[1][1], 12, 0, 7); t.fill();
    } else if (id === 'farinata') {
      sky(t, W, H, 0.15, 0.1); glow(t, W / 2, H, H * 0.9, 1, 0.2);
      tomb(t, W * 0.5, H * 1.02, W * 0.8, true, r, a);
      const f = figure(t, { x: W * 0.5, y: H * 0.78, h: H * 0.62, pose: 'spread', robe: 1.1, tone: 0.06, hi: 0.3 });
      flames(a, W * 0.5, H * 0.95, W * 0.9, H * 0.45, r, '#fff', 9);
    } else if (id === 'forese') {
      sky(t, W, H, 0.55, 0.35); rain(t, W, H, r, 120, 0.25, 0.5);
      t.strokeStyle = g(0.12); t.lineWidth = 8; t.beginPath(); t.moveTo(W * 0.82, H); t.lineTo(W * 0.8, H * 0.2); t.stroke();
      for (let k = 0; k < 7; k++) { t.beginPath(); t.moveTo(W * 0.8, H * (0.25 + k * 0.08)); t.lineTo(W * (0.62 + r() * 0.1), H * (0.15 + k * 0.08)); t.stroke(); }
      for (let k = 0; k < 6; k++) { a.fillStyle = '#fff'; a.beginPath(); a.arc(W * (0.64 + r() * 0.12), H * (0.2 + r() * 0.4), 9, 0, 7); a.fill(); }
      figure(t, { x: W * 0.42, y: H * 0.98, h: H * 0.78, pose: 'reach', broad: 0.7, tone: 0.1, hi: 0.35 });
    } else if (id === 'eneas') {
      sky(t, W, H, 0.3, 0.15); arches(t, W, H, 0.1, 4);
      const f = figure(t, { x: W * 0.5, y: H * 0.98, h: H * 0.8, pose: 'reach', robe: 1.2, crown: true, tone: 0.08, hi: 0.35 });
      const [hx, hy] = f.hands[1]; t.strokeStyle = g(0.9); a.strokeStyle = '#fff'; t.lineWidth = a.lineWidth = 6;
      for (const c of [t, a]) { c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + 40, hy - 90); c.stroke(); for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(hx + 12 + k * 7, hy - 25 - k * 15, 12, 5, -0.8 + (k % 2) * 1.6, 0, 7); c === a ? c.fill() : c.stroke(); } }
      glowA(a, hx + 20, hy - 50, 80, 0.6);
    } else if (id === 'ulises') {
      sky(t, W, H, 0.08, 0.2); glow(t, W / 2, H * 0.5, 240, 0.95, 0.1);
      flames(t, W * 0.4, H * 0.98, 190, H * 0.95, r, g(0.95), 3); flames(t, W * 0.62, H * 0.98, 170, H * 0.85, r, g(0.95), 3);
      flames(a, W * 0.5, H * 0.98, 320, H * 0.95, rng(8), 'rgba(255,255,255,.85)', 6);
      figure(t, { x: W * 0.5, y: H * 0.98, h: H * 0.7, pose: 'hold', hood: true, robe: 1.1, tone: 0.06, hi: 0.3 });
    } else if (id === 'dante') {
      sky(t, W, H, 0.12, 0.25); iceFloor(t, W, H, H * 0.65, r);
      figure(t, { x: W * 0.72, y: H * 0.7, h: H * 0.85, pose: 'spread', wings: 0.6, horns: 1.2, sixArms: true, tone: 0.28, hi: 0.4 });
      figure(t, { x: W * 0.38, y: H * 0.98, h: H * 0.78, pose: 'stand', robe: 1.2, laurel: true, hood: true, tone: 0.06, hi: 0.3 });
      crystals(t, a, W * 0.5, H, W, r, 10);
    } else {
      sky(t, W, H, 0.7, 0.4); columns(t, W, H, r, 0.5, 3);
      figure(t, { x: W * 0.5, y: H * 0.98, h: H * 0.8, pose: 'stand', robe: 1.2, tone: 0.1, hi: 0.35 });
    }
  };
}

// ───────────────────────── arte automático (cartas sin ilustración propia) ─────────────────────────
const BG = {
  ira: (t, a, r, W, H) => { sky(t, W, H, 0.12, 0.28); glow(t, W / 2, H, H * 0.9, 0.95, 0.2); flames(t, W / 2, H, W * 1.1, H * 0.3, r, g(0.9), 10); flames(a, W / 2, H, W * 1.1, H * 0.3, rng(5), 'rgba(255,255,255,.85)', 10); },
  gula: (t, a, r, W, H) => { sky(t, W, H, 0.5, 0.3); rain(t, W, H, r, 130, 0.22, 0.55); t.fillStyle = g(0.22); t.fillRect(0, H * 0.82, W, H * 0.18); },
  avaricia: (t, a, r, W, H) => { sky(t, W, H, 0.1, 0.18); arches(t, W, H, 0.08, 5); coins(t, a, W / 2, H, W, r, 35); },
  fraude: (t, a, r, W, H) => { sky(t, W, H, 0.2, 0.1); arches(t, W, H, 0.05, 7); fogBands(t, W, H, r, 6, 0.45); },
  traicion: (t, a, r, W, H) => { sky(t, W, H, 0.08, 0.22); iceFloor(t, W, H, H * 0.62, r); },
  neutral: (t, a, r, W, H, d) => { const c = d.circle || 1; if (c <= 2) { sky(t, W, H, 0.88, 0.7); columns(t, W, H, r, 0.6, 4); fogBands(t, W, H, r, 5, 0.5); } else if (c === 7) { sky(t, W, H, 0.55, 0.7); t.fillStyle = g(0.7); t.fillRect(0, H * 0.8, W, H * 0.2); t.fillStyle = g(0.3); t.fillRect(0, H * 0.86, W, 14); } else { sky(t, W, H, 0.35, 0.15); glow(t, W / 2, H * 0.3, 200, 0.9, 0.3); } },
};
function autoArt(id, d) {
  return (t, a, r, W, H) => {
    (BG[d.senda] || BG.neutral)(t, a, r, W, H, d);
    const sub = (d.sub || '') + ' ' + d.name; const kw = d.kw || [];
    const accentEyes = (f) => { if (f) { eyes(a, f.hx, f.hy, 6, 3); eyesT(t, f.hx, f.hy, 6, 3); } };
    if (d.type === 'ente' || d.type === 'ilustre') {
      const big = d.type === 'ilustre' ? 0.85 : 0.72; let f = null;
      if (/Centauro|Arquero|arquero/.test(sub)) { beast(t, { x: W * 0.42, y: H * 0.96, s: W * 0.66, kind: 'none', tone: 0.06, hi: 0.3 }); f = figure(t, { x: W * 0.68, y: H * 0.6, h: H * 0.48, pose: 'strike', tone: 0.06, hi: 0.3, noLegs: true }); t.strokeStyle = g(0.1); t.lineWidth = 4; t.beginPath(); t.arc(f.hands[0][0], f.hands[0][1], 70, -1.2, 1.2); t.stroke(); }
      else if (/Bestia|Arpía|Monstruo|Titán|Erisicton|Carroñero/.test(sub)) { const b = beast(t, { x: W * 0.45, y: H * 0.96, s: W * big, kind: 'dog', heads: /Arpía/.test(sub) ? 1 : 1, tone: 0.05, hi: 0.3, bulk: /Titán|hinchado/.test(sub) ? 0.3 : 0.2 }); if (kw.includes('vuelo') || /Arpía/.test(sub)) wings(t, W * 0.45, H * 0.5, W * 0.4, g(0.1), 0.9); for (const [hx, hy] of b.heads) { a.fillStyle = '#fff'; a.beginPath(); a.arc(hx, hy, 4, 0, 7); a.fill(); } }
      else if (/Larva|Gusano|Sanguijuela/.test(sub)) { t.fillStyle = g(0.1); t.beginPath(); t.ellipse(W * 0.5, H * 0.62, 170, 64, -0.2, 0, 7); t.fill(); for (let k = 0; k < 7; k++) { t.strokeStyle = g(0.4); t.lineWidth = 3; t.beginPath(); t.ellipse(W * 0.5 - 120 + k * 40, H * 0.62 - 12 + k * 3, 8, 52, -0.2, 0, 7); t.stroke(); } a.fillStyle = '#fff'; a.beginPath(); a.ellipse(W * 0.74, H * 0.54, 24, 18, 0, 0, 7); a.fill(); }
      else if (/Sombra|Espectro/.test(sub)) { f = figure(t, { x: W * 0.5, y: H * 0.92, h: H * big, pose: 'spread', robe: 1.4, wings: kw.includes('vuelo') ? 0.6 : 0, tone: 0.28, hi: 0.5, noLegs: true }); fogBands(t, W, H, r, 4, 0.4); accentEyes(f); }
      else if (/Demonio/.test(sub)) { f = figure(t, { x: W * 0.5, y: H * 0.98, h: H * big, pose: r() < 0.5 ? 'strike' : 'raised', horns: 1 + r() * 0.5, wings: kw.includes('vuelo') || r() < 0.3 ? 0.5 : 0, broad: 1.1 + r() * 0.3, tone: 0.05, hi: 0.3 }); accentEyes(f); }
      else { const poses = ['stand', 'hold', 'reach', 'pray', 'cower', 'raised']; f = figure(t, { x: W * 0.5, y: H * 0.98, h: H * big, pose: poses[Math.floor(r() * poses.length)], hood: /Falsario|Traidor|Hipócrita/.test(sub), robe: /Falsario|Hipócrita|Juez|Barquero|Tesorero/.test(sub) ? 1.2 : 0, crown: d.type === 'ilustre' && r() < 0.5, laurel: d.type === 'ilustre' && r() >= 0.5, bloat: d.senda === 'gula' && r() < 0.5, tone: 0.07, hi: 0.32 }); accentEyes(f); }
      if (kw.includes('asedio') && f && f.hands) { const hd = f.hands[f.hands.length - 1]; sword(t, hd[0], hd[1], hd[0] + 110, hd[1] - 100, 14, 0.85); a.save(); sword(a, hd[0], hd[1], hd[0] + 110, hd[1] - 100, 14, 1); a.restore(); }
      if (d.senda === 'traicion') crystals(t, a, W * 0.5, H, W * 0.8, r, 7);
      if (d.senda === 'fraude' && f) mask(a, f.hx, f.hy, 36, '#fff', false);
    } else if (d.type === 'rito') {
      if (d.senda === 'ira') { flames(t, W * 0.5, H * 0.95, W * 0.9, H * 0.8, r, g(0.95), 12); flames(a, W * 0.5, H * 0.95, W * 0.9, H * 0.8, rng(2), '#fff', 12); for (let i = 0; i < 3; i++) figure(t, { x: W * (0.3 + i * 0.2), y: H * 0.95, h: 120, pose: 'raised', tone: 0.05, hi: 0.2, noLegs: true }); }
      else if (d.senda === 'gula') { t.fillStyle = g(0.15); t.beginPath(); t.ellipse(W / 2, H * 0.5, 170, 110, 0, 0, 7); t.fill(); a.fillStyle = '#fff'; a.beginPath(); a.ellipse(W / 2, H * 0.5, 120, 60, 0, 0, 7); a.fill(); t.fillStyle = g(0.85); for (let i = -3; i <= 3; i++) { t.beginPath(); t.moveTo(W / 2 + i * 34 - 12, H * 0.42); t.lineTo(W / 2 + i * 34 + 12, H * 0.42); t.lineTo(W / 2 + i * 34, H * 0.52); t.fill(); } }
      else if (d.senda === 'avaricia') { coins(t, a, W / 2, H * 0.9, W * 0.9, r, 90); t.fillStyle = g(0.9); t.beginPath(); t.arc(W / 2, H * 0.4, 90, 0, 7); t.fill(); drawSealShape(t, W / 2, H * 0.4, 60, g(0.3)); a.fillStyle = '#fff'; a.beginPath(); a.arc(W / 2, H * 0.4, 90, 0, 7); a.fill(); }
      else if (d.senda === 'fraude') { for (let i = 0; i < 5; i++) mask(t, W * (0.15 + i * 0.175), H * (0.4 + (i % 2) * 0.2), 80 + r() * 50, g(0.85 - i * 0.1)); mask(a, W * 0.5, H * 0.4, 150, '#fff', false); }
      else if (d.senda === 'traicion') { crystals(t, a, W * 0.5, H * 0.95, W, r, 16); figure(t, { x: W / 2, y: H * 0.7, h: 200, pose: 'cower', tone: 0.1, hi: 0.3 }); }
      else { for (let i = 0; i < 9; i++) { const k = 1 - i / 9; t.fillStyle = g(0.85 * k + 0.05); t.beginPath(); t.ellipse(W / 2, H * (0.2 + i * 0.07), W * 0.46 * k + 20, H * 0.1 * k + 8, 0, 0, 7); t.fill(); } }
    } else if (d.type === 'juicio') {
      const f = figure(t, { x: W * 0.5, y: H * 1.05, h: H * 0.82, pose: r() < 0.5 ? 'reach' : 'raised', tone: 0.06, hi: 0.3 });
      const [hx, hy] = f.hands[f.hands.length - 1]; t.strokeStyle = g(1); a.strokeStyle = '#fff'; t.lineWidth = 6; a.lineWidth = 10;
      for (const c of [t, a]) { c.beginPath(); c.moveTo(hx, hy); let x = hx, y = hy; for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 60 + 10; y -= 40; c.lineTo(x, y); } c.stroke(); }
      glowA(a, hx, hy, 80, 0.7);
    } else if (d.type === 'reliquia') {
      glow(t, W / 2, H * 0.45, 220, 0.9, 0.15);
      if (d.senda === 'ira') { t.fillStyle = g(0.15); t.fillRect(W * 0.48, H * 0.1, 10, H * 0.85); t.fillStyle = g(0.8); t.beginPath(); t.moveTo(W * 0.5, H * 0.12); t.lineTo(W * 0.85, H * 0.2); t.lineTo(W * 0.72, H * 0.33); t.lineTo(W * 0.85, H * 0.46); t.lineTo(W * 0.5, H * 0.4); t.fill(); flames(a, W * 0.66, H * 0.46, 220, 190, r, '#fff', 5); }
      else if (d.senda === 'avaricia') { coins(t, a, W / 2, H * 0.62, 180, r, 30); t.fillStyle = g(0.9); t.beginPath(); t.arc(W / 2, H * 0.4, 70, 0, 7); t.fill(); a.fillStyle = '#fff'; a.beginPath(); a.arc(W / 2, H * 0.4, 70, 0, 7); a.fill(); }
      else { chainsDraw(t, W * 0.1, H * 0.2, W * 0.9, H * 0.7, 0.2, 12); sword(t, W * 0.5, H * 0.95, W * 0.5, H * 0.1, 24, 0.8); a.save(); sword(a, W * 0.5, H * 0.85, W * 0.5, H * 0.1, 20, 1); a.restore(); }
    }
  };
}

// ───────────────────────── iconos grabados ─────────────────────────
export function drawIcon(c, key, x, y, s, col = '#1a120c', ink = '#140d08') {
  c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round';
  const k = s / 100; c.scale(k, k);
  c.fillStyle = col; c.strokeStyle = ink; c.lineWidth = 6;
  const hatch = () => { c.save(); c.clip(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2.2; for (let i = -100; i < 100; i += 9) { c.beginPath(); c.moveTo(i, -60); c.lineTo(i + 60, 60); c.stroke(); } c.restore(); };
  c.beginPath();
  switch (key) {
    case 'ira': case 'flame':
      c.moveTo(0, -46); c.bezierCurveTo(20, -20, 38, -2, 30, 22); c.bezierCurveTo(24, 42, -24, 44, -30, 22); c.bezierCurveTo(-36, 0, -14, -8, -10, -26);
      c.bezierCurveTo(-2, -10, 6, -14, 0, -46); c.closePath(); c.fill(); c.stroke(); hatch();
      c.beginPath(); c.moveTo(0, -4); c.bezierCurveTo(12, 10, 14, 28, 0, 32); c.bezierCurveTo(-12, 28, -12, 12, 0, -4); c.fillStyle = 'rgba(255,240,200,.55)'; c.fill(); break;
    case 'gula': case 'mouth':
      c.ellipse(0, 0, 44, 30, 0, 0, 7); c.fill(); c.stroke(); hatch();
      c.beginPath(); c.ellipse(0, 2, 30, 16, 0, 0, 7); c.fillStyle = '#120906'; c.fill();
      c.fillStyle = '#efe4c8'; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 11 - 5, -13); c.lineTo(i * 11 + 5, -13); c.lineTo(i * 11, -3); c.fill(); c.beginPath(); c.moveTo(i * 11 - 5, 17); c.lineTo(i * 11 + 5, 17); c.lineTo(i * 11, 8); c.fill(); } break;
    case 'avaricia': case 'coin':
      c.arc(0, 0, 42, 0, 7); c.fill(); c.stroke(); hatch(); c.beginPath(); c.arc(0, 0, 31, 0, 7); c.stroke();
      c.beginPath(); c.moveTo(0, -20); c.lineTo(0, 20); c.moveTo(-14, -8); c.lineTo(14, -8); c.moveTo(-10, 10); c.lineTo(10, 10); c.lineWidth = 6; c.stroke(); break;
    case 'fraude': case 'mask':
      c.moveTo(-40, -30); c.quadraticCurveTo(0, -48, 40, -30); c.quadraticCurveTo(44, 14, 0, 44); c.quadraticCurveTo(-44, 14, -40, -30); c.closePath(); c.fill(); c.stroke(); hatch();
      c.fillStyle = '#120906'; c.beginPath(); c.ellipse(-16, -8, 10, 6, -0.3, 0, 7); c.ellipse(16, -8, 10, 6, 0.3, 0, 7); c.fill();
      c.beginPath(); c.moveTo(-12, 20); c.quadraticCurveTo(0, 12, 12, 20); c.stroke(); break;
    case 'traicion': case 'crystal':
      c.moveTo(0, -48); c.lineTo(26, -18); c.lineTo(20, 40); c.lineTo(-20, 40); c.lineTo(-26, -18); c.closePath(); c.fill(); c.stroke(); hatch();
      c.beginPath(); c.moveTo(0, -48); c.lineTo(0, 40); c.moveTo(-26, -18); c.lineTo(0, -8); c.lineTo(26, -18); c.lineWidth = 3; c.stroke(); break;
    case 'halo':
      c.lineWidth = 9; c.strokeStyle = col; c.ellipse(0, -6, 40, 16, 0, 0, 7); c.stroke(); c.lineWidth = 3; c.strokeStyle = ink; c.beginPath(); c.ellipse(0, -6, 46, 21, 0, 0, 7); c.stroke();
      for (let i = 0; i < 10; i++) { const an = i / 10 * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(an) * 50, -6 + Math.sin(an) * 24); c.lineTo(Math.cos(an) * 60, -6 + Math.sin(an) * 30); c.stroke(); }
      c.beginPath(); c.arc(0, 26, 16, 0, 7); c.fillStyle = col; c.fill(); break;
    case 'horns':
      for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 10, 30); c.quadraticCurveTo(sd * 48, 20, sd * 40, -44); c.quadraticCurveTo(sd * 30, 4, sd * 2, 10); c.closePath(); c.fill(); c.stroke(); }
      break;
    case 'balance': case 'juicio':
      c.lineWidth = 6; c.strokeStyle = col; c.moveTo(0, -42); c.lineTo(0, 40); c.moveTo(-40, -26); c.lineTo(40, -26); c.stroke();
      for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 40, -26); c.lineTo(sd * 26, 8); c.lineTo(sd * 54, 8); c.closePath(); c.stroke(); c.beginPath(); c.ellipse(sd * 40, 10, 18, 6, 0, 0, Math.PI); c.fillStyle = col; c.fill(); }
      c.fillRect(-18, 38, 36, 8); break;
    case 'chain':
      c.lineWidth = 10; c.strokeStyle = col; c.save(); c.rotate(-0.7); c.beginPath(); c.ellipse(-16, 0, 24, 13, 0, 0, 7); c.stroke(); c.beginPath(); c.ellipse(16, 0, 24, 13, 0, 0, 7); c.stroke(); c.restore(); break;
    case 'vuelo':
      c.moveTo(-44, 20); c.quadraticCurveTo(-20, -40, 44, -40); c.quadraticCurveTo(30, -20, 36, -14); c.quadraticCurveTo(20, -10, 26, 0); c.quadraticCurveTo(8, 2, 12, 12); c.quadraticCurveTo(-10, 12, -44, 20); c.fill(); c.stroke(); hatch(); break;
    case 'primerGolpe':
      c.moveTo(0, -48); c.lineTo(10, 10); c.lineTo(0, 18); c.lineTo(-10, 10); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-24, 16); c.lineTo(24, 16); c.moveTo(0, 18); c.lineTo(0, 44); c.lineWidth = 8; c.strokeStyle = col; c.stroke(); break;
    case 'guardian':
      c.moveTo(0, -46); c.lineTo(38, -32); c.quadraticCurveTo(38, 20, 0, 46); c.quadraticCurveTo(-38, 20, -38, -32); c.closePath(); c.fill(); c.stroke(); hatch();
      c.beginPath(); c.moveTo(0, -30); c.lineTo(0, 30); c.moveTo(-20, -8); c.lineTo(20, -8); c.lineWidth = 5; c.stroke(); break;
    case 'embestida':
      for (const dx of [-22, 6]) { c.beginPath(); c.moveTo(dx - 14, -30); c.lineTo(dx + 16, 0); c.lineTo(dx - 14, 30); c.lineTo(dx - 4, 0); c.closePath(); c.fill(); c.stroke(); } break;
    case 'iraCiega':
      c.moveTo(-44, 0); c.quadraticCurveTo(0, -36, 44, 0); c.quadraticCurveTo(0, 36, -44, 0); c.fill(); c.stroke(); hatch();
      c.beginPath(); c.moveTo(-40, 4); c.quadraticCurveTo(0, 26, 40, 4); c.lineWidth = 7; c.stroke();
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 12, 14); c.lineTo(i * 14, 26); c.stroke(); } break;
    case 'energia':
      c.arc(0, 0, 40, 0, 7); c.fill(); c.stroke(); hatch(); c.beginPath(); c.moveTo(6, -30); c.lineTo(-14, 4); c.lineTo(4, 4); c.lineTo(-6, 30); c.lineTo(16, -6); c.lineTo(-2, -6); c.closePath(); c.fillStyle = '#f5e9cc'; c.fill(); break;
    case 'oro':
      c.arc(0, 0, 40, 0, 7); c.fill(); c.stroke(); hatch(); c.beginPath(); c.arc(0, 0, 26, 0, 7); c.stroke(); break;
    case 'will':
      c.moveTo(0, -46); c.lineTo(40, -22); c.lineTo(40, 22); c.lineTo(0, 46); c.lineTo(-40, 22); c.lineTo(-40, -22); c.closePath(); c.fill(); c.stroke(); break;
    case 'sword':
      c.moveTo(-6, -48); c.lineTo(6, -48); c.lineTo(6, 20); c.lineTo(-6, 20); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-22, 20); c.lineTo(22, 20); c.moveTo(0, 20); c.lineTo(0, 44); c.lineWidth = 9; c.strokeStyle = col; c.stroke(); break;
    case 'asedio':
      c.moveTo(-44, 14); c.lineTo(20, 14); c.lineTo(20, -14); c.lineTo(-44, -14); c.closePath(); c.fill(); c.stroke(); hatch();
      c.beginPath(); c.moveTo(20, -24); c.lineTo(44, -12); c.lineTo(44, 12); c.lineTo(20, 24); c.closePath(); c.fillStyle = ink; c.fill();
      c.beginPath(); c.arc(-30, 28, 10, 0, 7); c.arc(8, 28, 10, 0, 7); c.stroke(); break;
    case 'sepultar':
      c.moveTo(-28, 44); c.lineTo(-28, -14); c.quadraticCurveTo(-28, -44, 0, -44); c.quadraticCurveTo(28, -44, 28, -14); c.lineTo(28, 44); c.closePath(); c.fill(); c.stroke(); hatch();
      c.beginPath(); c.moveTo(0, -30); c.lineTo(0, 10); c.moveTo(-14, -14); c.lineTo(14, -14); c.lineWidth = 6; c.strokeStyle = ink; c.stroke(); break;
    case 'hourglass':
      c.moveTo(-26, -40); c.lineTo(26, -40); c.lineTo(4, 0); c.lineTo(26, 40); c.lineTo(-26, 40); c.lineTo(-4, 0); c.closePath(); c.fill(); c.stroke(); break;
    case 'seal':
      drawSealShape(c, 0, 0, 46, col); break;
    default:
      c.arc(0, 0, 30, 0, 7); c.fill(); c.stroke();
  }
  c.restore();
}
export function iconCanvas(key, size = 64, col, ink) {
  const cv = mkCanvas(size, size); const c = cv.getContext('2d');
  drawIcon(c, key, size / 2, size / 2, size * 0.9, col, ink); return cv;
}
export function sendaIconColor(k) { return k ? SENDAS[k].color : '#6b6257'; }

// ───────────────────────── el sello de seis brazos ─────────────────────────
// Logo oficial (figura de seis brazos). Si está cargado, sustituye al sello dibujado.
let LOGO = null; const logoTints = new Map();
export function setLogo(img) { LOGO = img; logoTints.clear(); }
function tintedLogo(col) {
  if (logoTints.has(col)) return logoTints.get(col);
  const cv = mkCanvas(LOGO.width, LOGO.height), c = cv.getContext('2d');
  c.drawImage(LOGO, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = col; c.fillRect(0, 0, cv.width, cv.height);
  logoTints.set(col, cv); return cv;
}
export function drawSealShape(c, cx, cy, r, col) {
  if (LOGO) {
    const img = tintedLogo(col); const h = r * 1.75, w = h * img.width / img.height;
    c.drawImage(img, cx - w / 2, cy - h / 2 + r * 0.04, w, h); return;
  }
  drawSealShapeDrawn(c, cx, cy, r, col);
}
function drawSealShapeDrawn(c, cx, cy, r, col) {
  c.save(); c.translate(cx, cy); c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  // cuerpo
  c.beginPath(); c.moveTo(0, -r * 0.42); c.quadraticCurveTo(r * 0.16, -r * 0.1, r * 0.1, r * 0.25); c.lineTo(0, r * 0.82); c.lineTo(-r * 0.1, r * 0.25);
  c.quadraticCurveTo(-r * 0.16, -r * 0.1, 0, -r * 0.42); c.fill();
  // cabeza + corona de llamas
  c.beginPath(); c.arc(0, -r * 0.54, r * 0.12, 0, 7); c.fill();
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * r * 0.05 - r * 0.03, -r * 0.62); c.quadraticCurveTo(i * r * 0.07, -r * 0.78 + Math.abs(i) * r * 0.05, i * r * 0.05 + r * 0.03, -r * 0.62); c.fill(); }
  // seis brazos
  c.lineWidth = r * 0.07;
  const arms = [[-1, -0.3, -70], [-1, -0.18, -5], [-1, -0.05, 55], [1, -0.3, -70], [1, -0.18, -5], [1, -0.05, 55]];
  for (const [sd, yy, ang] of arms) {
    const a0 = ang * Math.PI / 180; const sx = sd * r * 0.08, sy = r * yy;
    const ex = sx + sd * Math.cos(a0) * r * 0.36, ey = sy + Math.sin(a0) * r * 0.36;
    const hx = ex + sd * Math.cos(a0 - sd * 0) * r * 0.26, hy = ey + Math.sin(a0) * r * 0.26 - r * 0.08;
    c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(ex, ey + r * 0.06, hx, hy); c.stroke();
    c.lineWidth = r * 0.03;
    for (let f = -1; f <= 1; f++) { c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + sd * r * 0.08 * Math.cos(a0 + f * 0.5), hy + r * 0.08 * Math.sin(a0 + f * 0.5) - r * 0.02); c.stroke(); }
    c.lineWidth = r * 0.07;
  }
  c.restore();
}
export function drawSeal(c, cx, cy, r, col, opts = {}) {
  c.save(); c.strokeStyle = col; c.fillStyle = col;
  c.lineWidth = r * 0.035; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke();
  c.lineWidth = r * 0.015; c.beginPath(); c.arc(cx, cy, r * 0.93, 0, 7); c.stroke(); c.beginPath(); c.arc(cx, cy, r * 0.72, 0, 7); c.stroke();
  const txt = opts.text || '✠ SVLPHVR ✠ PER ME SI VA NE LA CITTÀ DOLENTE ';
  c.font = `${r * 0.13}px ${FONT_D}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const n = txt.length;
  for (let i = 0; i < n; i++) { const an = -Math.PI / 2 + i / n * Math.PI * 2; c.save(); c.translate(cx + Math.cos(an) * r * 0.825, cy + Math.sin(an) * r * 0.825); c.rotate(an + Math.PI / 2); c.fillText(txt[i], 0, 0); c.restore(); }
  for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI * 2 - Math.PI / 2; c.beginPath(); c.arc(cx + Math.cos(an) * r * 0.64, cy + Math.sin(an) * r * 0.64, r * 0.02, 0, 7); c.fill(); }
  drawSealShape(c, cx, cy + r * 0.05, r * 0.62, col);
  c.restore();
}

// ───────────────────────── texto enriquecido ─────────────────────────
function tokenize(text) {
  const toks = []; let bold = false;
  const parts = text.split(/(\*|\{[a-z]+\})/);
  for (const p of parts) {
    if (p === '*') { bold = !bold; continue; }
    if (/^\{[a-z]+\}$/.test(p)) { toks.push({ icon: p.slice(1, -1) }); continue; }
    for (const w of p.split(/(\s+)/)) { if (!w) continue; if (/^\s+$/.test(w)) toks.push({ space: true }); else toks.push({ w, bold }); }
  }
  return toks;
}
export function richText(c, text, x, y, maxW, size, opts = {}) {
  const lh = size * (opts.lh || 1.18); const col = opts.color || '#1a120c'; const align = opts.align || 'left';
  const toks = tokenize(text); const lines = [[]]; let lw = 0; const spW = size * 0.28;
  const tw = tk => { if (tk.icon) return size * 1.15; c.font = `${tk.bold ? 'italic 600' : '400'} ${size}px ${FONT_R}`; return c.measureText(tk.w).width; };
  for (const tk of toks) {
    if (tk.space) { if (lines[lines.length - 1].length) { lines[lines.length - 1].push(tk); lw += spW; } continue; }
    const w = tw(tk);
    if (lw + w > maxW && lines[lines.length - 1].length) { const L = lines[lines.length - 1]; while (L.length && L[L.length - 1].space) L.pop(); lines.push([]); lw = 0; }
    lines[lines.length - 1].push(tk); lw += w;
  }
  c.textBaseline = 'alphabetic';
  lines.forEach((L, li) => {
    while (L.length && L[L.length - 1].space) L.pop();
    const total = L.reduce((s, tk) => s + (tk.space ? spW : tw(tk)), 0);
    let cx = align === 'center' ? x - total / 2 : x; const cy = y + li * lh;
    for (const tk of L) {
      if (tk.space) { cx += spW; continue; }
      if (tk.icon) { drawIcon(c, tk.icon, cx + size * 0.55, cy - size * 0.33, size * 1.05, tk.icon === 'halo' ? '#c9a13a' : '#1a120c'); cx += size * 1.15; continue; }
      c.font = `${tk.bold ? 'italic 600' : '400'} ${size}px ${FONT_R}`; c.fillStyle = col; c.fillText(tk.w, cx, cy); cx += c.measureText(tk.w).width;
    }
  });
  return lines.length * lh;
}
function fitFont(c, text, font, size, maxW) { let s = size; do { c.font = `${s}px ${font}`; if (c.measureText(text).width <= maxW) break; s -= 1; } while (s > 10); return s; }

// ───────────────────────── marcos ─────────────────────────
function burntEdges(c, w, h, seed) {
  const n = makeNoise(seed); const img = c.getImageData(0, 0, w, h); const D = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ed = Math.min(x, y, w - 1 - x, h - 1 - y); const corner = Math.min(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y));
    const th = 10 + n(x * 0.05, y * 0.05) * 22 + Math.max(0, 70 - corner) * 0.6;
    const i = (y * w + x) * 4;
    if (ed < th) { const k = clamp((th - ed) / 9, 0, 1); const burn = ed < th - 7 ? 0 : 1;
      D[i] = D[i] * (1 - k) + (burn ? 60 : 12) * k; D[i + 1] = D[i + 1] * (1 - k) + (burn ? 22 : 8) * k; D[i + 2] = D[i + 2] * (1 - k) + (burn ? 6 : 5) * k; }
    else if (ed < th + 16) { const k = 1 - (ed - th) / 16; D[i] *= 1 - k * 0.35; D[i + 1] *= 1 - k * 0.42; D[i + 2] *= 1 - k * 0.5; }
  }
  c.putImageData(img, 0, 0);
}
function thornFrame(c, w, h, col, r) {
  c.save(); c.strokeStyle = '#140d08'; c.fillStyle = '#140d08'; c.lineWidth = 5;
  const inset = 13;
  const path = [[inset, inset], [w - inset, inset], [w - inset, h - inset], [inset, h - inset], [inset, inset]];
  for (let s = 0; s < 4; s++) {
    const [x0, y0] = path[s], [x1, y1] = path[s + 1]; const len = Math.hypot(x1 - x0, y1 - y0); const nx = (y1 - y0) / len, ny = -(x1 - x0) / len;
    c.beginPath(); c.moveTo(x0, y0);
    const steps = Math.floor(len / 22);
    for (let i = 1; i <= steps; i++) { const tt = i / steps; const px = x0 + (x1 - x0) * tt, py = y0 + (y1 - y0) * tt; const off = Math.sin(i * 1.7) * 4; c.lineTo(px + nx * off, py + ny * off); }
    c.stroke();
    for (let i = 1; i < steps; i++) { const tt = i / steps; const px = x0 + (x1 - x0) * tt, py = y0 + (y1 - y0) * tt; const sd = i % 2 ? 1 : -1;
      c.beginPath(); c.moveTo(px - (x1 - x0) / len * 4, py - (y1 - y0) / len * 4); c.lineTo(px + nx * 11 * sd + (x1 - x0) / len * 5, py + ny * 11 * sd + (y1 - y0) / len * 5); c.lineTo(px + (x1 - x0) / len * 4, py + (y1 - y0) / len * 4); c.fill(); }
  }
  // rayos en las esquinas
  c.strokeStyle = col; c.lineWidth = 4;
  for (const [cx, cy, sx, sy] of [[inset, inset, 1, 1], [w - inset, inset, -1, 1], [inset, h - inset, 1, -1], [w - inset, h - inset, -1, -1]]) {
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + sx * 26, cy + sy * 12); c.lineTo(cx + sx * 18, cy + sy * 22); c.lineTo(cx + sx * 44, cy + sy * 36); c.stroke();
  }
  c.restore();
}
function metalFrame(c, w, h, bw) {
  c.save();
  const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#5a5550'); gr.addColorStop(0.5, '#2a2724'); gr.addColorStop(1, '#4a4540');
  c.fillStyle = gr; c.beginPath(); c.rect(0, 0, w, h); c.rect(bw, bw, w - bw * 2, h - bw * 2); c.fill('evenodd');
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; for (let i = -h; i < w; i += 7) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + h, h); c.stroke(); }
  c.fillStyle = gr; c.beginPath(); c.rect(bw, bw, w - bw * 2, h - bw * 2); c.restore(); c.save();
  c.strokeStyle = '#0c0a08'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, w - 3, h - 3); c.strokeRect(bw, bw, w - bw * 2, h - bw * 2);
  const rivet = (x, y) => { const rg = c.createRadialGradient(x - 2, y - 2, 1, x, y, 7); rg.addColorStop(0, '#d8d0c4'); rg.addColorStop(0.5, '#6e675f'); rg.addColorStop(1, '#1a1714'); c.fillStyle = rg; c.beginPath(); c.arc(x, y, 6.5, 0, 7); c.fill(); };
  for (let x = bw; x <= w - bw + 1; x += (w - bw * 2) / 6) { rivet(x, bw / 2); rivet(x, h - bw / 2); }
  for (let y = bw; y <= h - bw + 1; y += (h - bw * 2) / 8) { rivet(bw / 2, y); rivet(w - bw / 2, y); }
  c.restore();
}
function gothicArch(c, x, y, w, h, spring) {
  c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + spring);
  c.quadraticCurveTo(x, y, x + w / 2, y - spring * 0.15); c.quadraticCurveTo(x + w, y, x + w, y + spring); c.lineTo(x + w, y + h); c.closePath();
}

// ───────────────────────── caras de carta ─────────────────────────
const faceCache = new Map();
export function cardFace(id) {
  if (faceCache.has(id)) return faceCache.get(id);
  const d = CARDS[id]; const cv = d ? drawMainCard(id, d) : drawSoulCard(id, SOULS[id]);
  faceCache.set(id, cv); return cv;
}
function costMedallion(c, x, y, cost, type, req) {
  c.save();
  c.fillStyle = '#16100b'; c.beginPath(); c.arc(x, y, 34, 0, 7); c.fill();
  c.strokeStyle = '#c9b48a'; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, 29, 0, 7); c.stroke();
  c.fillStyle = '#efe3c6'; c.font = `700 44px ${FONT_R}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(cost), x, y + 2);
  let ox = x + 44;
  if (type === 'juicio') { c.fillStyle = 'rgba(20,14,9,.82)'; c.beginPath(); c.arc(ox + 14, y, 22, 0, 7); c.fill(); drawIcon(c, 'balance', ox + 14, y, 34, '#e9dcc0', '#e9dcc0'); ox += 44; }
  for (const s of req) { c.fillStyle = 'rgba(233,221,194,.92)'; c.beginPath(); c.arc(ox + 14, y, 21, 0, 7); c.fill(); c.strokeStyle = '#1a120c'; c.lineWidth = 2; c.stroke(); drawIcon(c, s, ox + 14, y, 30, SENDAS[s].color); ox += 40; }
  c.restore();
}
function drawMainCard(id, d) {
  const cv = mkCanvas(CW, CH), c = cv.getContext('2d');
  paper(c, CW, CH, hashStr(id));
  const sd = d.senda ? SENDAS[d.senda] : null;
  const accent = sd ? { light: sd.light, color: sd.color } : null;
  const artFn = ART[id] || autoArt(id, d);
  let ax = 0, ay = 0, aw = CW, ah = 478;
  if (d.type === 'rito') { ax = 26; ay = 26; aw = CW - 52; ah = 430; }
  if (d.type === 'juicio') { ax = 30; ay = 30; aw = CW - 60; ah = 440; }
  if (d.type === 'reliquia') { ax = 26; ay = 26; aw = CW - 52; ah = 440; }
  if (d.type === 'ilustre') { ax = 24; ay = 20; aw = CW - 48; ah = 458; }
  const art = engrave(aw, ah, artFn, { seed: hashStr(id), accent });
  c.save();
  if (d.type === 'ilustre') { gothicArch(c, ax, ay, aw, ah, 150); c.clip(); }
  c.drawImage(art, ax, ay);
  // la parte inferior de la ilustración se funde con el papel
  const fade = c.createLinearGradient(0, ay + ah - 60, 0, ay + ah); fade.addColorStop(0, 'rgba(233,221,194,0)'); fade.addColorStop(1, 'rgba(233,221,194,.85)');
  c.fillStyle = fade; c.fillRect(ax, ay + ah - 60, aw, 60);
  c.restore();
  // marcos por tipo
  if (d.type === 'ente') {
    c.strokeStyle = '#120c08'; c.lineWidth = 6; c.strokeRect(3, 3, CW - 6, CH - 6);
    c.strokeStyle = sd ? sd.color : '#1a120c'; c.lineWidth = 3; c.strokeRect(12, 12, CW - 24, CH - 24);
  } else if (d.type === 'ilustre') {
    c.strokeStyle = '#120c08'; c.lineWidth = 6; c.strokeRect(3, 3, CW - 6, CH - 6);
    c.lineWidth = 5; gothicArch(c, ax, ay, aw, ah, 150); c.stroke();
    c.strokeStyle = sd ? sd.color : '#1a120c'; c.lineWidth = 2.5; gothicArch(c, ax + 8, ay + 8, aw - 16, ah - 8, 142); c.stroke();
    // tracería en las enjutas
    c.strokeStyle = '#2a1e14'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(ax + 24, ay + 22, 6 + i * 5, 0, 7); c.stroke(); c.beginPath(); c.arc(ax + aw - 24, ay + 22, 6 + i * 5, 0, 7); c.stroke(); }
  } else if (d.type === 'juicio') {
    c.strokeStyle = sd ? sd.color : '#1a120c'; c.lineWidth = 2; c.strokeRect(ax, ay, aw, ah);
    thornFrame(c, CW, CH, sd ? sd.color : '#3a2e22', null);
  } else if (d.type === 'reliquia') {
    metalFrame(c, CW, CH, 22);
    c.strokeStyle = sd ? sd.color : '#1a120c'; c.lineWidth = 2.5; c.strokeRect(ax + 3, ay + 3, aw - 6, ah - 6);
  } else if (d.type === 'rito') {
    c.strokeStyle = sd ? sd.color : '#1a120c'; c.lineWidth = 2.5; c.strokeRect(ax, ay, aw, ah);
  }
  costMedallion(c, 58, 58, d.cost, d.type, d.req);
  // nombre
  const nameY = d.type === 'rito' ? 500 : 516;
  if (d.type === 'ilustre') {
    const first = d.name[0], rest = d.name.slice(1);
    c.fillStyle = sd ? sd.color : '#1a120c'; c.fillRect(30, nameY - 44, 50, 54); c.strokeStyle = '#120c08'; c.lineWidth = 3; c.strokeRect(30, nameY - 44, 50, 54);
    c.strokeStyle = 'rgba(255,240,210,.5)'; c.lineWidth = 1.5; c.strokeRect(35, nameY - 39, 40, 44);
    c.fillStyle = '#f4e8cc'; c.font = `46px ${FONT_D}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(first, 55, nameY + 2);
    c.fillStyle = '#16100b'; c.textAlign = 'left'; const fs = fitFont(c, rest, FONT_D, 36, 330); c.font = `${fs}px ${FONT_D}`; c.fillText(rest, 84, nameY);
    // sello de único
    c.save(); c.fillStyle = sd ? sd.dark : '#3a1010'; c.beginPath(); for (let i = 0; i < 14; i++) { const an = i / 14 * Math.PI * 2; const rr = i % 2 ? 26 : 30; c.lineTo(462 + Math.cos(an) * rr, nameY - 16 + Math.sin(an) * rr); } c.fill();
    drawSealShape(c, 462, nameY - 14, 20, 'rgba(240,225,195,.9)'); c.fillStyle = '#f0e1c3'; c.font = `600 10px ${FONT_R}`; c.textAlign = 'center'; c.fillText('ÚNICO', 462, nameY + 6); c.restore();
  } else {
    c.fillStyle = '#16100b'; c.textAlign = d.type === 'rito' ? 'center' : 'left'; c.textBaseline = 'alphabetic';
    const fs = fitFont(c, d.name, FONT_D, 38, 420); c.font = `${fs}px ${FONT_D}`; c.fillText(d.name, d.type === 'rito' ? CW / 2 : 32, nameY);
  }
  // línea de tipo
  const tl = `${TYPES[d.type].name}${d.sub && d.sub !== TYPES[d.type].name ? ' — ' + d.sub : ''}${sd ? ' · ' + sd.name : ' · Neutral'}`;
  c.font = `italic 20px ${FONT_R}`; c.fillStyle = '#4a3b2c'; c.textAlign = d.type === 'rito' ? 'center' : 'left'; c.fillText(tl, d.type === 'rito' ? CW / 2 : 34, nameY + 28);
  c.strokeStyle = 'rgba(40,28,18,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(32, nameY + 38); c.lineTo(CW - 32, nameY + 38); c.stroke();
  // sello de agua
  c.save(); c.globalAlpha = 0.07; drawSeal(c, CW / 2, 612, 70, '#1a120c'); c.restore();
  // texto de reglas
  const isStat = d.type === 'ente' || d.type === 'ilustre';
  if (d.text) richText(c, d.text, d.type === 'rito' ? CW / 2 : 34, nameY + 68, CW - 68, 24, { align: d.type === 'rito' ? 'center' : 'left' });
  if (d.attach) { drawIcon(c, 'chain', CW - 50, CH - 44, 34, '#2a2420'); }
  // lápida de Fuerza | Resistencia
  if (isStat) {
    const tx = CW / 2, ty = CH - 16, tw = 170, th = 70;
    c.save(); c.beginPath(); c.moveTo(tx - tw / 2, ty); c.lineTo(tx - tw / 2, ty - th + 26); c.quadraticCurveTo(tx - tw / 2, ty - th, tx, ty - th - 4); c.quadraticCurveTo(tx + tw / 2, ty - th, tx + tw / 2, ty - th + 26); c.lineTo(tx + tw / 2, ty); c.closePath();
    const tg = c.createLinearGradient(0, ty - th, 0, ty); tg.addColorStop(0, '#5b544b'); tg.addColorStop(1, '#2c2823'); c.fillStyle = tg; c.fill();
    c.strokeStyle = '#0e0b08'; c.lineWidth = 3; c.stroke(); c.clip();
    c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.2; for (let i = -200; i < 200; i += 6) { c.beginPath(); c.moveTo(tx + i, ty - th); c.lineTo(tx + i + 70, ty); c.stroke(); }
    c.restore();
    c.fillStyle = '#efe3c6'; c.font = `700 48px ${FONT_R}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText(`${d.f}`, tx - 40, ty - 14); c.fillText(`${d.r}`, tx + 40, ty - 14);
    c.fillStyle = '#b8ab92'; c.font = `400 40px ${FONT_R}`; c.fillText('|', tx, ty - 17);
    // palabras clave en iconos
    let kx = 34; for (const k of (d.kw || [])) { drawIcon(c, k, kx + 16, CH - 44, 32, '#3a2e22'); kx += 40; }
  }
  // círculo de ambientación
  if (d.circle) { c.fillStyle = '#5a4a38'; c.font = `18px ${FONT_D}`; c.textAlign = 'right'; c.fillText(CIRCLES[d.circle].roman, CW - (d.attach ? 80 : 30), CH - 24); }
  if (d.type === 'rito') burntEdges(c, CW, CH, hashStr(id) + 5);
  return cv;
}
function drawSoulCard(id, s) {
  const cv = mkCanvas(CW, CH), c = cv.getContext('2d');
  const gold = { light: '#f2d488', color: '#b8892a' };
  const art = engrave(CW, CH, soulArt(id, s), { seed: hashStr(id), accent: gold });
  c.drawImage(art, 0, 0);
  // nombre en cartela
  c.fillStyle = 'rgba(236,224,198,.9)'; c.fillRect(60, 22, CW - 120, 52); c.strokeStyle = '#1a120c'; c.lineWidth = 2; c.strokeRect(60, 22, CW - 120, 52); c.strokeRect(66, 28, CW - 132, 40);
  c.fillStyle = '#16100b'; c.textAlign = 'center'; c.textBaseline = 'middle'; const fs = fitFont(c, s.name, FONT_D, 32, CW - 150); c.font = `${fs}px ${FONT_D}`; c.fillText(s.name, CW / 2, 49);
  // gran símbolo de Senda
  const sd = s.senda ? SENDAS[s.senda] : null;
  c.fillStyle = 'rgba(236,224,198,.82)'; c.beginPath(); c.arc(CW / 2, 400, 78, 0, 7); c.fill(); c.strokeStyle = '#1a120c'; c.lineWidth = 4; c.stroke(); c.lineWidth = 1.5; c.beginPath(); c.arc(CW / 2, 400, 70, 0, 7); c.stroke();
  if (sd) drawIcon(c, s.senda, CW / 2, 400, 104, sd.color); else { c.fillStyle = '#3a2e22'; c.font = `italic 22px ${FONT_R}`; c.fillText('sin Senda', CW / 2, 400); }
  // tipo
  c.font = `italic 19px ${FONT_R}`; c.fillStyle = '#efe3c6'; c.fillText(`Alma · ${sd ? sd.name : 'Neutral'}`, CW / 2, 505);
  // línea de condena
  c.fillStyle = 'rgba(10,7,5,.9)'; c.fillRect(0, CH - 150, CW, 150);
  c.strokeStyle = '#8a7a62'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(24, CH - 140); c.lineTo(CW - 24, CH - 140); c.stroke();
  drawIcon(c, 'horns', 48, CH - 104, 40, '#0b0806', '#b8ab92');
  c.fillStyle = '#c9b48a'; c.font = `26px ${FONT_D}`; c.textAlign = 'left'; c.fillText('Condena', 76, CH - 102);
  richText(c, s.text, 30, CH - 62, CW - 60, 25, { color: '#efe3c6' });
  c.strokeStyle = '#120c08'; c.lineWidth = 6; c.strokeRect(3, 3, CW - 6, CH - 6);
  return cv;
}

// ───────────────────────── dorsos ─────────────────────────
let backM, backS;
export function backMain() {
  if (backM) return backM;
  const cv = mkCanvas(CW, CH), c = cv.getContext('2d');
  paper(c, CW, CH, 91, [22, 18, 16], { vignette: 0.1 });
  c.strokeStyle = '#8e1c14'; c.lineWidth = 3; c.strokeRect(18, 18, CW - 36, CH - 36); c.lineWidth = 1.2; c.strokeRect(28, 28, CW - 56, CH - 56);
  c.strokeStyle = 'rgba(142,28,20,.25)'; c.lineWidth = 1; for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(CW / 2, CH / 2, 60 + i * 6, 0, 7); c.stroke(); }
  drawSeal(c, CW / 2, CH / 2, 180, '#a82418');
  c.fillStyle = '#a82418'; c.font = `34px ${FONT_D}`; c.textAlign = 'center'; c.fillText('SVLPHVR', CW / 2, CH - 70);
  backM = cv; return cv;
}
export function backSoul() {
  if (backS) return backS;
  const cv = mkCanvas(CW, CH), c = cv.getContext('2d');
  paper(c, CW, CH, 92, [226, 212, 182]);
  c.strokeStyle = '#1a120c'; c.lineWidth = 3; c.strokeRect(18, 18, CW - 36, CH - 36); c.lineWidth = 1.2; c.strokeRect(28, 28, CW - 56, CH - 56);
  c.globalAlpha = 0.12; for (let i = 0; i < 18; i++) { c.beginPath(); c.moveTo(CW / 2, CH / 2); c.lineTo(CW / 2 + Math.cos(i / 18 * 6.283) * 400, CH / 2 + Math.sin(i / 18 * 6.283) * 400); c.stroke(); } c.globalAlpha = 1;
  drawSeal(c, CW / 2, CH / 2, 180, '#1a120c');
  c.fillStyle = '#1a120c'; c.font = `30px ${FONT_D}`; c.textAlign = 'center'; c.fillText('ALMAS', CW / 2, CH - 70);
  backS = cv; return cv;
}

// ───────────────────────── Peregrino (retablo) ─────────────────────────
export const PW = 840, PH = 572;
export function pilgrimFace(id, state = {}) {
  const P = PILGRIMS[id]; const cv = mkCanvas(PW, PH), c = cv.getContext('2d');
  paper(c, PW, PH, hashStr(id) + 1, [228, 214, 184]);
  const lw = 230, cw = PW - lw * 2;
  // panel central
  const art = engrave(cw - 40, 330, pilgrimArt(id), { seed: hashStr(id), accent: P.sendas.length ? { light: SENDAS[P.sendas[0]].light, color: SENDAS[P.sendas[0]].color } : null });
  c.save(); gothicArch(c, lw + 20, 24, cw - 40, 330, 110); c.clip(); c.drawImage(art, lw + 20, 24); c.restore();
  c.strokeStyle = '#120c08'; c.lineWidth = 4; gothicArch(c, lw + 20, 24, cw - 40, 330, 110); c.stroke();
  c.fillStyle = '#16100b'; c.textAlign = 'center'; c.font = `44px ${FONT_D}`; c.fillText(P.name, PW / 2, 400);
  c.font = `italic 20px ${FONT_R}`; c.fillStyle = '#4a3b2c';
  c.fillText(`Peregrino${P.sendas.length ? ' — ' + P.sendas.map(s => SENDAS[s].name).join(' · ') : ''}`, PW / 2, 428);
  let sx = PW / 2 - (P.sendas.length - 1) * 22; for (const s of P.sendas) { drawIcon(c, s, sx, 60, 36, SENDAS[s].color); sx += 44; }
  if (P.ability) { c.font = `600 17px ${FONT_R}`; c.fillStyle = '#6a5238'; c.fillText('HABILIDAD BASE · 1 VEZ POR TURNO', PW / 2, 458); richText(c, P.ability.text, PW / 2, 486, cw - 40, 21, { align: 'center' }); }
  else { c.font = `italic 20px ${FONT_R}`; c.fillText('Ejemplo del documento — no jugable en esta demo', PW / 2, 470); }
  // Voluntad
  c.fillStyle = '#16100b'; c.beginPath(); c.arc(PW / 2, PH - 30, 0, 0, 7); c.fill();
  // paneles laterales
  const side = (x, kind) => {
    const isR = kind === 'redencion'; const st = state[kind] || 'locked';
    const gr = c.createLinearGradient(x, 0, x + lw, PH);
    if (isR) { gr.addColorStop(0, '#e8c86a'); gr.addColorStop(0.5, '#b88a2c'); gr.addColorStop(1, '#8a6418'); }
    else { gr.addColorStop(0, '#3a3530'); gr.addColorStop(0.5, '#1a1714'); gr.addColorStop(1, '#0b0908'); }
    c.save(); gothicArch(c, x + 14, 40, lw - 28, PH - 60, 80); c.fillStyle = gr; c.fill(); c.clip();
    // pan de oro craquelado / ceniza
    const r = rng(isR ? 5 : 6); c.strokeStyle = isR ? 'rgba(90,60,10,.35)' : 'rgba(200,190,170,.12)'; c.lineWidth = 1;
    for (let i = 0; i < 60; i++) { c.beginPath(); let px = x + r() * lw, py = r() * PH; c.moveTo(px, py); for (let k = 0; k < 3; k++) { px += (r() - 0.5) * 40; py += (r() - 0.5) * 40; c.lineTo(px, py); } c.stroke(); }
    if (!isR) { for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(${r() < 0.5 ? '200,190,170' : '0,0,0'},${r() * 0.4})`; c.fillRect(x + r() * lw, r() * PH, 2, 2); } }
    c.restore();
    c.strokeStyle = '#120c08'; c.lineWidth = 3; gothicArch(c, x + 14, 40, lw - 28, PH - 60, 80); c.stroke();
    const tc = isR ? '#1e1408' : '#e0d6c4';
    drawIcon(c, isR ? 'halo' : 'horns', x + lw / 2, 120, 64, isR ? '#fff2c0' : '#0b0806', isR ? '#3a2808' : '#c8bca8');
    c.fillStyle = tc; c.textAlign = 'center'; c.font = `30px ${FONT_D}`; c.fillText(isR ? 'Redención' : 'Caída', x + lw / 2, 196);
    c.font = `italic 16px ${FONT_R}`; c.fillText(isR ? '5 absueltas de ventaja' : '5 condenadas de ventaja', x + lw / 2, 220);
    if (P.redencion) richText(c, (isR ? P.redencion : P.caida).text, x + lw / 2, 262, lw - 56, 19, { align: 'center', color: tc });
    // estado
    c.font = `600 15px ${FONT_R}`; c.fillStyle = tc;
    const label = st === 'active' ? 'DESBLOQUEADA' : st === 'sealed' ? 'SELLADA' : 'BLOQUEADA';
    c.fillText(label, x + lw / 2, PH - 50);
    if (st === 'sealed') { c.save(); c.strokeStyle = 'rgba(10,6,4,.85)'; c.lineWidth = 12; c.beginPath(); c.moveTo(x + 30, 60); c.lineTo(x + lw - 30, PH - 40); c.moveTo(x + lw - 30, 60); c.lineTo(x + 30, PH - 40); c.stroke(); c.restore(); }
    if (st === 'locked') { c.save(); c.fillStyle = 'rgba(10,6,4,.28)'; gothicArch(c, x + 14, 40, lw - 28, PH - 60, 80); c.fill(); c.restore(); }
  };
  side(0, 'redencion'); side(PW - lw, 'caida');
  // marco del retablo
  c.strokeStyle = '#120c08'; c.lineWidth = 7; c.strokeRect(3.5, 3.5, PW - 7, PH - 7);
  c.strokeStyle = '#a3823c'; c.lineWidth = 2.5; c.strokeRect(12, 12, PW - 24, PH - 24);
  return cv;
}

const portraitCache = {};
export function pilgrimPortrait(id) {
  if (portraitCache[id]) return portraitCache[id];
  const P = PILGRIMS[id]; const S = 220; const cv = mkCanvas(S, S), c = cv.getContext('2d');
  const art = engrave(300, 330, pilgrimArt(id), { seed: hashStr(id), accent: P.sendas.length ? { light: SENDAS[P.sendas[0]].light, color: SENDAS[P.sendas[0]].color } : null });
  c.save(); c.beginPath(); c.arc(S / 2, S / 2, S / 2 - 4, 0, 7); c.clip(); c.drawImage(art, -40, -24, 300, 330); c.restore();
  portraitCache[id] = cv; return cv;
}

// ───────────────────────── carta de Descenso ─────────────────────────
export const DW = 440, DH = 1290;
let descCache;
export function descensoCard() {
  if (descCache) return descCache;
  const cv = mkCanvas(DW, DH), c = cv.getContext('2d');
  paper(c, DW, DH, 77, [214, 202, 176]);
  c.fillStyle = '#16100b'; c.textAlign = 'center'; c.font = `40px ${FONT_D}`; c.fillText('DESCENSO', DW / 2, 62);
  c.font = `italic 17px ${FONT_R}`; c.fillText('Temporada 1 · un d10 marca el Círculo', DW / 2, 88);
  const top = 110, bh = (DH - top - 20) / 9;
  for (let i = 1; i <= 9; i++) {
    const C = CIRCLES[i]; const y = top + (i - 1) * bh; const dark = i >= 5;
    const bg = c.createLinearGradient(0, y, 0, y + bh); bg.addColorStop(0, C.band); bg.addColorStop(1, shade(C.band, -0.15));
    c.fillStyle = bg; c.fillRect(16, y, DW - 32, bh - 4);
    c.save(); c.beginPath(); c.rect(16, y, DW - 32, bh - 4); c.clip(); c.strokeStyle = `rgba(0,0,0,${0.08 + i * 0.03})`; c.lineWidth = 1.2;
    for (let k = -200; k < DW + 200; k += 7 - Math.min(3, i * 0.3)) { c.beginPath(); c.moveTo(k, y); c.lineTo(k + bh, y + bh); c.stroke(); }
    c.restore();
    const tc = dark ? '#eadcc0' : '#16100b';
    c.fillStyle = tc; c.textAlign = 'left'; c.font = `46px ${FONT_D}`; c.fillText(C.roman, 30, y + 54);
    c.font = `28px ${FONT_D}`; c.fillText(C.name, 124, y + 38);
    c.globalAlpha = 0.95; richText(c, C.rule, 124, y + 66, DW - 150, 17, { color: tc, lh: 1.12 }); c.globalAlpha = 1;
    c.strokeStyle = '#120c08'; c.lineWidth = 2; c.strokeRect(16, y, DW - 32, bh - 4);
  }
  c.save(); c.globalAlpha = 0.9; drawSealShape(c, DW - 44, 58, 34, '#16100b'); drawSealShape(c, 44, 58, 34, '#16100b'); c.restore();
  c.strokeStyle = '#120c08'; c.lineWidth = 6; c.strokeRect(3, 3, DW - 6, DH - 6);
  descCache = cv; return cv;
}
function shade(hex, k) { const [r, g2, b] = hexRgb(hex); const f = v => Math.round(clamp(v * (1 + k), 0, 255)); return `rgb(${f(r)},${f(g2)},${f(b)})`; }

// ───────────────────────── mesa ─────────────────────────
export function tableTexture(layout) {
  const TW = 2400, TH = 1760; const cv = mkCanvas(TW, TH), c = cv.getContext('2d');
  paper(c, TW, TH, 1234, [58, 44, 32], { vignette: 0.5 });
  const { toPx, worldW, worldH } = layout;
  // grabado del descenso completo: anillos concéntricos del embudo
  c.save(); c.globalAlpha = 0.16; c.strokeStyle = '#c9a76a';
  const [cx, cy] = toPx(0, 0);
  for (let i = 0; i < 9; i++) { c.lineWidth = 2; c.beginPath(); c.ellipse(cx, cy, 1100 - i * 110, 780 - i * 78, 0, 0, 7); c.stroke(); }
  for (let i = 0; i < 90; i++) { const an = i / 90 * Math.PI * 2; c.lineWidth = 1; c.beginPath(); c.moveTo(cx + Math.cos(an) * 200, cy + Math.sin(an) * 140); c.lineTo(cx + Math.cos(an) * 1150, cy + Math.sin(an) * 820); c.stroke(); }
  c.restore();
  c.save(); c.globalAlpha = 0.07; drawSeal(c, cx, cy, 330, '#e0c890'); c.restore();
  // línea central
  c.strokeStyle = 'rgba(201,167,106,.35)'; c.lineWidth = 2; c.setLineDash([14, 10]); c.beginPath(); c.moveTo(toPx(-4.2, 0)[0], cy); c.lineTo(toPx(4.6, 0)[0], cy); c.stroke(); c.setLineDash([]);
  // huecos de zona e inscripciones discretas
  const slot = (x, z, w = 1.06, h = 1.46) => { const [px, py] = toPx(x - w / 2, z - h / 2); const [qx, qy] = toPx(x + w / 2, z + h / 2); c.strokeStyle = 'rgba(214,186,130,.28)'; c.lineWidth = 2; c.strokeRect(px, py, qx - px, qy - py); c.strokeStyle = 'rgba(214,186,130,.12)'; c.strokeRect(px + 6, py + 6, qx - px - 12, qy - py - 12); };
  const label = (txt, x, z, rot = 0, size = 26) => { const [px, py] = toPx(x, z); c.save(); c.translate(px, py); c.rotate(rot); c.fillStyle = 'rgba(214,186,130,.42)'; c.font = `${size}px ${FONT_D}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 0, 0); c.restore(); };
  for (const side of [1, -1]) {
    for (const s of layout.van) slot(s, layout.vanZ * side);
    for (const s of layout.rear) slot(s, layout.rearZ * side);
    label('VANGVARDIA', -3.75, layout.vanZ * side, -Math.PI / 2);
    label('RETAGVARDIA', -2.4, layout.rearZ * side, -Math.PI / 2, 22);
    label('ALMAS ABSVELTAS', -1.6, (layout.soulZ + 0.86) * side, 0, 20);
    label('ALMAS CONDENADAS', 1.6, (layout.soulZ + 0.86) * side, 0, 20);
    label('PEREGRINO', layout.pilgrim[0], (layout.pilgrim[1] + 0.86) * side, 0, 20);
    slot(layout.mainDeck[0], layout.mainDeck[1] * side); label('MAZO', layout.mainDeck[0], (layout.mainDeck[1] + 0.9) * side, 0, 18);
    slot(layout.soulDeck[0], layout.soulDeck[1] * side); label('ALMAS', layout.soulDeck[0], (layout.soulDeck[1] + 0.9) * side, 0, 18);
    slot(layout.olvido[0], layout.olvido[1] * side); label('OLVIDO', layout.olvido[0], (layout.olvido[1] + (side > 0 ? 0.9 : -0.9)), 0, 18);
  }
  label('CADENA', layout.chain[0], layout.chain[1] + 0.95, 0, 22);
  label('DESCENSO', layout.desc[0] + 0.95, 0, Math.PI / 2, 22);
  return cv;
}

// ───────────────────────── el libro abierto (la mesa) ─────────────────────────
export function bookTexture(L) { return bookMaps(L).color; }
// Devuelve color + mapa emisivo (bordes que arden) + mapa metálico (pan de oro).
export function bookMaps(L) {
  const TW = 2600, TH = Math.round(2600 * L.bookH / L.bookW); const cv = mkCanvas(TW, TH), c = cv.getContext('2d');
  const EW = TW / 2, EH = Math.round(TH / 2);
  const ecv = mkCanvas(EW, EH), e = ecv.getContext('2d'); e.fillStyle = '#000'; e.fillRect(0, 0, EW, EH);
  const mcv = mkCanvas(EW, EH), mt = mcv.getContext('2d'); mt.fillStyle = '#000'; mt.fillRect(0, 0, EW, EH);
  paper(c, TW, TH, 4242, [214, 188, 142], { vignette: 0.5 });
  const toPx = (x, z) => [(x + L.bookW / 2) / L.bookW * TW, (z + L.bookH / 2) / L.bookH * TH];
  const cy = TH / 2; const ink = a => `rgba(48,26,12,${a})`; const red = a => `rgba(150,28,16,${a})`;
  const r = rng(77);
  const gold = (fn) => {
    const gr = c.createLinearGradient(0, 0, TW, TH); gr.addColorStop(0, '#f6d77e'); gr.addColorStop(0.3, '#b8862c'); gr.addColorStop(0.55, '#ffe9a8'); gr.addColorStop(0.8, '#a8741e'); gr.addColorStop(1, '#e8c060');
    c.save(); c.fillStyle = gr; c.strokeStyle = gr; fn(c); c.restore();
    mt.save(); mt.scale(0.5, 0.5); mt.fillStyle = '#fff'; mt.strokeStyle = '#fff'; fn(mt); mt.restore();
  };
  // el embudo del Infierno: los nueve círculos descienden hacia el lomo
  for (const side of [-1, 1]) {
    c.save(); c.beginPath(); c.rect(0, side < 0 ? 0 : cy, TW, cy); c.clip();
    for (let i = 9; i >= 1; i--) {
      const rx = 220 + i * 128, ry = 70 + i * 52;
      c.fillStyle = `rgba(60,34,14,${0.018 + (9 - i) * 0.006})`; c.beginPath(); c.ellipse(TW / 2, cy, rx, ry, 0, 0, 7); c.fill();
      c.strokeStyle = ink(0.14); c.lineWidth = 2.2; c.beginPath(); c.ellipse(TW / 2, cy, rx, ry, 0, 0, 7); c.stroke();
      c.strokeStyle = ink(0.06); c.lineWidth = 1;
      for (let k = 0; k < 120; k++) { const an = k / 120 * Math.PI * 2; const x0 = TW / 2 + Math.cos(an) * rx, y0 = cy + Math.sin(an) * ry; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(an) * 24, y0 + Math.sin(an) * 12 + 8); c.stroke(); }
      c.fillStyle = ink(0.12);
      for (let k = 0; k < 14 + i * 3; k++) { const an = r() * Math.PI * 2; const x0 = TW / 2 + Math.cos(an) * (rx - 30), y0 = cy + Math.sin(an) * (ry - 12); c.fillRect(x0, y0 - 9, 2.5, 9); c.beginPath(); c.arc(x0 + 1, y0 - 11, 2.4, 0, 7); c.fill(); }
    }
    c.restore();
  }
  c.save(); c.globalAlpha = 0.06; drawSeal(c, TW * 0.5, cy + TH * 0.27, 250, '#3a1e0c'); drawSeal(c, TW * 0.5, cy - TH * 0.27, 250, '#3a1e0c'); c.restore();
  const sp = c.createLinearGradient(0, cy - 170, 0, cy + 170);
  sp.addColorStop(0, 'rgba(60,34,14,0)'); sp.addColorStop(0.4, 'rgba(60,34,14,.3)'); sp.addColorStop(0.5, 'rgba(24,12,4,.62)'); sp.addColorStop(0.6, 'rgba(60,34,14,.3)'); sp.addColorStop(1, 'rgba(60,34,14,0)');
  c.fillStyle = sp; c.fillRect(0, cy - 170, TW, 340);
  const m = 70;
  c.strokeStyle = ink(0.75); c.lineWidth = 4; c.strokeRect(m, m, TW - m * 2, TH - m * 2);
  c.lineWidth = 1.5; c.strokeRect(m + 16, m + 16, TW - m * 2 - 32, TH - m * 2 - 32);
  gold(g => { g.lineWidth = 5; g.strokeRect(m + 8, m + 8, TW - m * 2 - 16, TH - m * 2 - 16); });
  c.strokeStyle = red(0.5); c.lineWidth = 1.2; for (let x = m + 40; x < TW - m - 30; x += 16) { c.beginPath(); c.moveTo(x, m + 24); c.lineTo(x + 8, m + 32); c.stroke(); c.beginPath(); c.moveTo(x, TH - m - 24); c.lineTo(x + 8, TH - m - 32); c.stroke(); }
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [TW - m, m, -1, 1], [m, TH - m, 1, -1], [TW - m, TH - m, -1, -1]]) {
    gold(g => {
      g.save(); g.translate(x, y); g.scale(sx, sy);
      g.lineWidth = 6; for (let rr = 30; rr <= 110; rr += 26) { g.beginPath(); g.arc(0, 0, rr, 0, Math.PI / 2); g.stroke(); }
      g.beginPath(); g.moveTo(0, 0); for (let k = 0; k < 7; k++) { const an = k / 6 * Math.PI / 2; g.lineTo(Math.cos(an) * 150, Math.sin(an) * 150); g.lineTo(Math.cos(an + 0.13) * 60, Math.sin(an + 0.13) * 60); } g.fill();
      g.beginPath(); g.arc(0, 0, 22, 0, 7); g.fill(); g.restore();
    });
    c.save(); c.translate(x, y); c.scale(sx, sy); c.strokeStyle = ink(0.8); c.lineWidth = 2; for (let rr = 30; rr <= 110; rr += 26) { c.beginPath(); c.arc(0, 0, rr + 4, 0, Math.PI / 2); c.stroke(); } c.restore();
  }
  const canto = 'PER ME SI VA NE LA CITTÀ DOLENTE · PER ME SI VA NE L’ETTERNO DOLORE · PER ME SI VA TRA LA PERDUTA GENTE · LASCIATE OGNE SPERANZA, VOI CH’INTRATE';
  c.font = `28px ${FONT_D}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = red(0.62);
  c.fillText(canto, TW / 2, m - 26);
  c.save(); c.translate(TW / 2, TH - m + 26); c.rotate(Math.PI); c.fillText(canto, 0, 0); c.restore();
  const frame = (x, z, w = 1.08, h = 1.48, a = 0.5) => {
    const [px, py] = toPx(x - w / 2, z - h / 2); const [qx, qy] = toPx(x + w / 2, z + h / 2);
    c.fillStyle = 'rgba(60,34,14,.05)'; c.fillRect(px, py, qx - px, qy - py);
    c.strokeStyle = ink(a); c.lineWidth = 2.5; c.strokeRect(px, py, qx - px, qy - py);
    c.lineWidth = 1; c.strokeRect(px + 8, py + 8, qx - px - 16, qy - py - 16);
    for (const [ax, ay] of [[px, py], [qx, py], [px, qy], [qx, qy]]) gold(g => { g.beginPath(); g.arc(ax, ay, 7, 0, 7); g.fill(); });
  };
  const label = (txt, x, z, rot = 0, size = 30, a = 0.8) => {
    const [px, py] = toPx(x, z); c.save(); c.translate(px, py); c.rotate(rot); c.font = `${size}px ${FONT_D}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const w = c.measureText(txt).width; c.fillStyle = red(a); c.fillText(txt, 0, 0);
    c.strokeStyle = red(a * 0.6); c.lineWidth = 1.2; c.beginPath(); c.moveTo(-w / 2 - 20, size * 0.62); c.lineTo(w / 2 + 20, size * 0.62); c.stroke(); c.restore();
  };
  for (const sg of [1, -1]) {
    for (const x of L.van) frame(x, L.vanZ * sg);
    for (const x of L.rear) frame(x, L.rearZ * sg);
    frame(L.mainDeck[0], L.mainDeck[1] * sg, 1.1, 1.5, 0.3); frame(L.soulDeck[0], L.soulDeck[1] * sg, 1.1, 1.5, 0.3); frame(L.olvido[0], L.olvido[1] * sg, 1.1, 1.5, 0.3);
    label('VANGVARDIA', -3.72, L.vanZ * sg, -Math.PI / 2, 28);
    label('RETAGVARDIA', -2.32, L.rearZ * sg, -Math.PI / 2, 24);
    label('ALMAS ABSVELTAS', -3.7, (L.soulZ + 0.98) * sg, 0, 26);
    label('ALMAS CONDENADAS', 3.7, (L.soulZ + 0.98) * sg, 0, 26);
    label('PEREGRINO', 0, (L.soulZ + 0.98) * sg, 0, 24);
    label('MAZO', L.mainDeck[0], (L.mainDeck[1] + 0.9) * sg, 0, 20, 0.6); label('ALMAS', L.soulDeck[0], (L.soulDeck[1] + 0.9) * sg, 0, 20, 0.6);
    label('OLVIDO', L.olvido[0], (L.olvido[1] - 0.9) * sg, 0, 20, 0.6);
    label('BALANZA', L.balance[0], (L.balance[1] + 0.95) * sg, 0, 20, 0.6);
  }
  label('CADENA', L.chain[0], L.chain[1] + 1.95, 0, 26);
  label('DESCENSO', L.desc[0] + 1.05, 0, Math.PI / 2, 26);
  const n = makeNoise(99); const img = c.getImageData(0, 0, TW, TH); const D = img.data;
  const eimg = e.getImageData(0, 0, EW, EH); const ED = eimg.data;
  const glow = (x, y, v, g2) => { const ex = x >> 1, ey = y >> 1; if (ex >= EW || ey >= EH) return; const j = (ey * EW + ex) * 4; ED[j] = Math.max(ED[j], 255 * v); ED[j + 1] = Math.max(ED[j + 1], 255 * v * g2); ED[j + 2] = Math.max(ED[j + 2], 40 * v * g2); ED[j + 3] = 255; };
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
    const ed = Math.min(x, y, TW - 1 - x, TH - 1 - y); if (ed > 90) continue;
    const th = 16 + n(x * 0.018, y * 0.018) * 48 + n(x * 0.08, y * 0.08) * 10; const i = (y * TW + x) * 4;
    if (ed < th - 10) { D[i + 3] = 0; continue; }
    if (ed < th) { const k = (th - ed) / 10; D[i] = 40 + 200 * (1 - k); D[i + 1] = 14 + 60 * (1 - k); D[i + 2] = 6; glow(x, y, 1 - k * 0.5, 0.35 + (1 - k) * 0.4); continue; }
    const k = Math.max(0, 1 - (ed - th) / 34); D[i] *= 1 - k * 0.65; D[i + 1] *= 1 - k * 0.75; D[i + 2] *= 1 - k * 0.85;
    if (k > 0.6 && n(x * 0.3, y * 0.3) > 0.78) glow(x, y, (k - 0.6) * 1.6, 0.4);
  }
  c.putImageData(img, 0, 0); e.putImageData(eimg, 0, 0);
  return { color: cv, emissive: ecv, metal: mcv };
}
// El altar que sostiene el libro: piedra negra y la inscripción de la puerta del Infierno en brasa.
export function altarTopMaps(L, pad) {
  const W = 2048, H = Math.round(2048 * (L.bookH + pad * 2) / (L.bookW + pad * 2));
  const cv = mkCanvas(W, H), c = cv.getContext('2d'); const ecv = mkCanvas(W, H), e = ecv.getContext('2d');
  paper(c, W, H, 311, [52, 44, 40], { vignette: 0.2 });
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  const r = rng(12);
  c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 2;
  for (let i = 0; i < 70; i++) { let x = r() * W, y = r() * H; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 120; y += (r() - 0.5) * 120; c.lineTo(x, y); } c.stroke(); }
  const bx = pad / (L.bookW + pad * 2) * W, by = pad / (L.bookH + pad * 2) * H;
  const text = 'LASCIATE OGNE SPERANZA, VOI CH’INTRATE ✠ PER ME SI VA NE LA CITTÀ DOLENTE ✠ ';
  for (const g of [c, e]) {
    g.font = `${Math.round(by * 0.24)}px ${FONT_D}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = g === c ? 'rgba(18,8,4,.95)' : 'rgba(200,80,24,.8)';
    if (g === e) { g.shadowColor = '#ff5a10'; g.shadowBlur = 8; }
    g.fillText(text + text + text, W / 2, by * 0.5);
    g.save(); g.translate(W / 2, H - by * 0.5); g.rotate(Math.PI); g.fillText(text + text + text, 0, 0); g.restore();
    g.save(); g.translate(bx * 0.5, H / 2); g.rotate(-Math.PI / 2); g.fillText(text + text, 0, 0); g.restore();
    g.save(); g.translate(W - bx * 0.5, H / 2); g.rotate(Math.PI / 2); g.fillText(text + text, 0, 0); g.restore();
    g.shadowBlur = 0;
  }
  e.lineCap = 'round';
  for (let i = 0; i < 30; i++) {
    let x, y; if (r() < 0.5) { x = r() < 0.5 ? r() * bx : W - r() * bx; y = r() * H; } else { x = r() * W; y = r() < 0.5 ? r() * by : H - r() * by; }
    e.beginPath(); e.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 80; y += (r() - 0.5) * 80; e.lineTo(x, y); }
    e.strokeStyle = 'rgba(255,90,20,.9)'; e.lineWidth = 2.5; e.shadowColor = '#ff4000'; e.shadowBlur = 10; e.stroke();
  }
  return { color: cv, emissive: ecv };
}
export function leatherTexture() {
  const S = 1024; const cv = mkCanvas(S, S), c = cv.getContext('2d'); paper(c, S, S, 900, [96, 24, 16], { vignette: 0.3 });
  const r = rng(3); c.strokeStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 900; i++) { const x = r() * S, y = r() * S; c.beginPath(); c.arc(x, y, 1 + r() * 3, 0, 7); c.stroke(); }
  return cv;
}
export function flameTexture() {
  const cv = mkCanvas(64, 128), c = cv.getContext('2d');
  const g = c.createRadialGradient(32, 92, 2, 32, 80, 60); g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(0.25, 'rgba(255,210,110,1)'); g.addColorStop(0.55, 'rgba(255,110,30,.8)'); g.addColorStop(1, 'rgba(255,60,10,0)');
  c.fillStyle = g; c.beginPath(); c.moveTo(32, 4); c.bezierCurveTo(52, 50, 58, 90, 32, 124); c.bezierCurveTo(6, 90, 12, 50, 32, 4); c.fill();
  return cv;
}
export function altarTexture() {
  const S = 1024; const cv = mkCanvas(S, S), c = cv.getContext('2d');
  paper(c, S, S, 55, [30, 22, 18], { vignette: 0 });
  const r = rng(8); c.lineCap = 'round';
  for (let i = 0; i < 40; i++) {
    let x = r() * S, y = r() * S; c.beginPath(); c.moveTo(x, y);
    for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; c.lineTo(x, y); }
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 3; c.stroke(); c.strokeStyle = 'rgba(255,90,20,.18)'; c.lineWidth = 1.2; c.stroke();
  }
  return cv;
}
export function edgeGlowTexture(w = 1300, h = 940) {
  const cv = mkCanvas(w, h), c = cv.getContext('2d'); const m = 60;
  c.shadowColor = 'rgba(255,110,30,1)'; c.shadowBlur = 50; c.strokeStyle = 'rgba(255,140,50,.9)'; c.lineWidth = 10;
  for (let i = 0; i < 3; i++) c.strokeRect(m, m, w - m * 2, h - m * 2);
  return cv;
}
export function cardGlowTexture() {
  const cv = mkCanvas(160, 208), c = cv.getContext('2d');
  c.shadowColor = '#fff'; c.shadowBlur = 16; c.strokeStyle = 'rgba(255,255,255,1)'; c.lineWidth = 7;
  const rr = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  for (let i = 0; i < 2; i++) { rr(18, 18, 124, 172, 10); c.stroke(); }
  return cv;
}

// ───────────────────────── fichas y etiquetas ─────────────────────────
export function tokenCard(title, text, sendaKey, kind) {
  const cv = mkCanvas(CW, CH), c = cv.getContext('2d');
  paper(c, CW, CH, hashStr(title + text), [222, 206, 172]);
  burntEdges(c, CW, CH, hashStr(title));
  const sd = sendaKey ? SENDAS[sendaKey] : null;
  c.strokeStyle = sd ? sd.color : '#1a120c'; c.lineWidth = 3; c.strokeRect(34, 34, CW - 68, CH - 68);
  c.save(); c.globalAlpha = 0.1; drawSeal(c, CW / 2, CH / 2, 180, '#1a120c'); c.restore();
  c.fillStyle = '#6a5238'; c.font = `600 22px ${FONT_R}`; c.textAlign = 'center'; c.fillText(kind === 'trigger' ? 'DISPARADOR' : 'HABILIDAD ACTIVADA', CW / 2, 110);
  drawIcon(c, kind === 'trigger' ? 'hourglass' : 'chain', CW / 2, 190, 70, sd ? sd.color : '#3a2e22');
  c.fillStyle = '#16100b'; const fs = fitFont(c, title, FONT_D, 40, CW - 100); c.font = `${fs}px ${FONT_D}`; c.fillText(title, CW / 2, 300);
  richText(c, text, CW / 2, 370, CW - 110, 27, { align: 'center' });
  return cv;
}
export function textSprite(text, opts = {}) {
  const size = opts.size || 64; const cv = mkCanvas(opts.w || 128, opts.h || 128); const c = cv.getContext('2d');
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `${opts.weight || 700} ${size}px ${opts.font || FONT_R}`;
  if (opts.stroke) { c.lineWidth = opts.strokeW || 8; c.strokeStyle = opts.stroke; c.strokeText(text, cv.width / 2, cv.height / 2 + 4); }
  c.fillStyle = opts.color || '#c8261a'; c.fillText(text, cv.width / 2, cv.height / 2 + 4);
  return cv;
}
export function statBadge(f, r, fMod, rMod, dmg) {
  const cv = mkCanvas(256, 96), c = cv.getContext('2d');
  c.fillStyle = 'rgba(16,11,8,.92)'; c.beginPath(); c.moveTo(16, 94); c.lineTo(16, 30); c.quadraticCurveTo(16, 4, 128, 2); c.quadraticCurveTo(240, 4, 240, 30); c.lineTo(240, 94); c.closePath(); c.fill();
  c.strokeStyle = '#c9b48a'; c.lineWidth = 3; c.stroke();
  c.font = `700 62px ${FONT_R}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = fMod > 0 ? '#f2cf6a' : fMod < 0 ? '#e27a6a' : '#efe3c6'; c.fillText(String(f), 78, 56);
  c.fillStyle = dmg > 0 ? '#ff5a3c' : rMod > 0 ? '#f2cf6a' : rMod < 0 ? '#e27a6a' : '#efe3c6'; c.fillText(String(Math.max(0, r - dmg)), 178, 56);
  c.fillStyle = '#8a7a62'; c.font = `400 50px ${FONT_R}`; c.fillText('|', 128, 52);
  return cv;
}
