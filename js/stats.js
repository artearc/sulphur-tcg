// SULPHUR — recogida de datos del playtest: cada partida queda registrada en este navegador,
// se puede exportar en JSON o enviar como informe (Issue de GitHub), y se pueden simular partidas IA contra IA.
import { Game } from './engine.js';
import { RivalAI } from './ai.js';
import { PILGRIMS, CARDS, SOULS } from './data.js';

const KEY = 'sulphurStats', MAX = 300;
export const REPO_ISSUES = 'https://github.com/artearc/sulphur-tcg/issues/new';

export function loadAll() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
function saveAll(list) { try { localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX))); } catch (e) { } }
export function clearAll() { try { localStorage.removeItem(KEY); } catch (e) { } }

// Registro de una partida en curso, alimentado por los eventos del motor.
export class Recorder {
  constructor(meta) {
    this.r = { v: 1, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), date: new Date().toISOString(), ...meta,
      rounds: 0, turns: 0, circleEnd: 1, winner: null, reason: null, durationSec: 0, first: null,
      players: [0, 1].map(() => ({ absolve: 0, condemn: 0, destiny: null, destinyRound: null, casts: {}, damageDealt: 0, willEnd: 20, milled: 0, souls: 0 })) };
    this.t0 = Date.now();
  }
  on(name, d, g) {
    const R = this.r;
    switch (name) {
      case 'gameStart': R.first = g.first; break;
      case 'turn': R.turns++; R.rounds = g.round; break;
      case 'soul': R.players[d.pi][d.mode]++; R.players[d.pi].souls++; break;
      case 'cast': R.players[d.pi].casts[d.id] = (R.players[d.pi].casts[d.id] || 0) + 1; break;
      case 'destiny': R.players[d.pi].destiny = d.destiny; R.players[d.pi].destinyRound = d.round || g.round; break;
      case 'combatDamage': R.players[1 - d.pi].damageDealt += d.n; break;
      case 'mill': R.players[d.pi].milled += d.n; break;
      case 'gameOver': this.finish(g, d); break;
    }
  }
  finish(g, d) {
    const R = this.r; if (R.done) return; R.done = true;
    R.winner = d.winner; R.reason = d.reason; R.rounds = g.round; R.circleEnd = g.circle; R.durationSec = Math.round((Date.now() - this.t0) / 1000);
    g.P.forEach((p, i) => { R.players[i].willEnd = p.will; });
    if (this.r.mode !== 'leccion') { const all = loadAll(); all.push(R); saveAll(all); }
  }
}

export function summary(list = loadAll()) {
  const games = list.filter(g => g.winner !== undefined && g.reason && g.reason !== 'abort');
  const by = {}; let fj = 0, rounds = 0, dest = 0, abs = 0, con = 0; const cards = {};
  for (const g of games) {
    rounds += g.rounds; if (g.reason === 'juicioFinal') fj++;
    g.pilgrims.forEach((pid, i) => {
      const b = by[pid] = by[pid] || { g: 0, w: 0, d: 0 }; b.g++; if (g.winner === i) b.w++; if (g.players[i].destiny) b.d++;
      abs += g.players[i].absolve; con += g.players[i].condemn; if (g.players[i].destiny) dest++;
      for (const [id, n] of Object.entries(g.players[i].casts)) cards[id] = (cards[id] || 0) + n;
    });
  }
  const n = games.length || 1;
  return { n: games.length, byPilgrim: by, avgRounds: rounds / n, finalJudgment: fj / n, destinyRate: dest / (2 * n), absolveRatio: abs / Math.max(1, abs + con),
    topCards: Object.entries(cards).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([id, k]) => [CARDS[id] ? CARDS[id].name : id, k]) };
}
export function downloadJSON(data, name) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
export function issueURL(rec) {
  const P = i => PILGRIMS[rec.pilgrims[i]].name;
  const res = rec.winner == null ? 'Tablas' : rec.winner === 0 ? `Ganó ${P(0)} (jugador)` : `Ganó ${P(1)} (rival)`;
  const body = `**Partida de playtest**\n\n- Modo: ${rec.mode}${rec.level ? ' · nivel ' + rec.level : ''}\n- ${P(0)} vs ${P(1)}\n- Resultado: ${res} (${rec.reason})\n- Ronda ${rec.rounds} · Círculo ${rec.circleEnd} · ${rec.durationSec}s\n- Almas absueltas/condenadas: ${rec.players[0].absolve}/${rec.players[0].condemn} vs ${rec.players[1].absolve}/${rec.players[1].condemn}\n- Destino: ${rec.players[0].destiny || '—'} (r${rec.players[0].destinyRound || '-'}) vs ${rec.players[1].destiny || '—'} (r${rec.players[1].destinyRound || '-'})\n\n**Comentarios** (qué ha pasado, qué te ha gustado, qué no, errores):\n\n\n<details><summary>Datos</summary>\n\n\`\`\`json\n${JSON.stringify(rec)}\n\`\`\`\n</details>`;
  return `${REPO_ISSUES}?title=${encodeURIComponent(`[Playtest] ${P(0)} vs ${P(1)} — ${res}`)}&labels=playtest&body=${encodeURIComponent(body.slice(0, 6000))}`;
}

// Simulación rápida sin gráficos (IA contra IA) para medir el equilibrio.
export async function simulate({ a, b, levelA = 'dificil', levelB = 'dificil', n = 10, onProgress }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const pids = i % 2 ? [b, a] : [a, b];
    const rec = new Recorder({ mode: 'sim', level: `${levelA}/${levelB}`, pilgrims: pids });
    const hooks = { log() { }, update() { }, tip() { }, phaseTip() { }, setPrompt() { }, turnStart() { }, announceFirst: async () => { }, gameOver: async () => { }, error() { }, event: (nm, d, g) => rec.on(nm, d, g) };
    const V = { sync: async () => { }, fx: async () => { } };
    const g = new Game({ humanPid: pids[0], aiPid: pids[1], io: [new RivalAI(i % 2 ? levelB : levelA, 0), new RivalAI(i % 2 ? levelA : levelB, 0)], view: V, hooks, fast: true });
    const timer = setTimeout(() => { g.aborted = true; }, 15000);
    await g.run(); clearTimeout(timer);
    if (rec.r.done) out.push(rec.r);
    if (onProgress) onProgress(i + 1, n);
    await new Promise(r => setTimeout(r, 0));
  }
  return out;
}
