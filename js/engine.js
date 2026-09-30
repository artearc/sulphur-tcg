// SULPHUR — motor de reglas (Núcleo de reglas + cambios del set alpha).
// Alpha: el jugador inicial roba · Gracia (absolver da 1 de Voluntad) · Asedio · Sepultar ·
// disparadores al atacar / al cambiar de fila / al morir un aliado · condiciones de Destino y de Círculo · Oro.
import { CARDS, SOULS, PILGRIMS, CIRCLES, KEYWORDS, SENDAS, buildDeckList, suggestedDeck } from './data.js';

export class GameEnd {
  constructor(winner, reason, detail) { this.winner = winner; this.reason = reason; this.detail = detail; }
}
export function seededRng(seed) {
  let a = (seed >>> 0) || 1;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function shuffle(a, rnd) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function mkInst(id, owner, isSoul, uid) {
  return {
    uid, id, def: isSoul ? SOULS[id] : CARDS[id], soul: !!isSoul, owner, ctrl: owner,
    tapped: false, sick: false, damage: 0, moved: false, tempF: 0, tempR: 0, permF: 0, permR: 0,
    frozen: false, protectedFrom: null, attacking: false, blockedBy: null, blocking: null, wasBlocked: false, siege: null,
    faceDown: false, attached: [], attachedTo: null, zone: isSoul ? 'soulDeck' : 'main',
  };
}
export const isEnte = c => c && c.def && (c.def.type === 'ente' || c.def.type === 'ilustre');
const isEnteDef = c => c && c.def && (c.def.type === 'ente' || c.def.type === 'ilustre');
const wait = ms => new Promise(r => setTimeout(r, ms));
const clean = t => (t || '').replace(/\*/g, '').replace(/\{[a-z]+\}/g, '').trim();

export class Game {
  // decks: [{main, souls}, …] (por defecto, el mazo sugerido) · seats: asientos absolutos (online) · seed: barajado reproducible
  constructor({ humanPid, aiPid, io, view, hooks, decks, seed, seats, first, fast }) {
    this.fast = !!fast;
    this.seed = seed != null ? seed : Math.floor(Math.random() * 2 ** 31);
    this.seats = seats || [0, 1];
    this.forcedFirst = first;
    this.P = [this.mkPlayer(0, humanPid, false, decks && decks[0]), this.mkPlayer(1, aiPid, true, decks && decks[1])];
    this.io = io; this.V = view; this.H = hooks;
    this.chain = []; this.chainId = 1; this.pending = [];
    this.circle = 1; this.round = 0; this.turn = 0; this.active = 0; this.first = 0; this.priority = null;
    this.phase = 'setup'; this.step = null; this.windowLabel = ''; this.turnOf = [0, 0]; this.fog = [false, false];
    this.over = null;
  }
  mkPlayer(idx, pid, isAI, deck) {
    const P = PILGRIMS[pid]; const d = deck || suggestedDeck(pid); const seat = this.seats[idx];
    const rnd = seededRng(this.seed + seat * 7919 + 13); let uid = seat * 5000 + 1;
    const mk = (id, soul) => mkInst(id, idx, soul, uid++);
    return {
      idx, pid, pilgrim: P, isAI, name: isAI ? 'Rival' : 'Tú', will: P.will, seat,
      main: shuffle(buildDeckList(d.main).map(id => mk(id, false)), rnd),
      soulDeck: shuffle(buildDeckList(d.souls).map(id => mk(id, true)), rnd),
      hand: [], van: Array(5).fill(null), rear: Array(3).fill(null), souls: [], olvido: [], burned: [], relics: [],
      pool: 0, gold: 0, soulPlayed: false, abilityUsed: false, destiny: null, lastState: 'tibio', nextUid: () => uid++,
    };
  }

  // ───────────── consultas ─────────────
  log(t, cls) { this.H.log(t, cls); }
  pause(ms) { return this.fast ? Promise.resolve() : wait(ms); }
  ev(name, data = {}) { if (this.H.event) this.H.event(name, data, this); }
  checkAbort() { if (this.aborted) throw new GameEnd(null, 'abort', ''); }
  setPhase(ph) { this.phase = ph; this.H.update(); this.ev('phase', { phase: ph, active: this.active }); }
  loadScenario(s) {
    this.circle = s.circle || 1; this.round = s.round || 0; this.first = s.first || 0; this.active = s.active != null ? s.active : this.first;
    this.turnOf = s.turnOf || [0, 0];
    s.players.forEach((sp, pi) => {
      const p = this.P[pi];
      const mk = (id, soul) => mkInst(id, pi, soul != null ? soul : !CARDS[id], p.nextUid());
      if (sp.will != null) p.will = sp.will;
      p.hand = (sp.hand || []).map(id => Object.assign(mk(id), { zone: 'hand' }));
      p.souls = (sp.souls || []).map(x => Object.assign(mk(x.id, true), { zone: 'souls', faceDown: !!x.down, tapped: !!x.tapped }));
      p.van = Array(5).fill(null); p.rear = Array(3).fill(null);
      (sp.van || []).forEach((id, i) => { if (id) p.van[i] = Object.assign(mk(id), { zone: 'van' }); });
      (sp.rear || []).forEach((id, i) => { if (id) p.rear[i] = Object.assign(mk(id), { zone: 'rear' }); });
      if (sp.main) p.main = [...sp.main].reverse().map(id => mk(id, false));
      if (sp.soulDeck) p.soulDeck = [...sp.soulDeck].reverse().map(id => mk(id, true));
      if (sp.destiny) p.destiny = sp.destiny;
      p.lastState = this.balance(pi).state;
    });
  }
  async runScenario() {
    try { this.ev('gameStart', { scenario: true }); while (true) await this.takeTurn(); }
    catch (e) { await this.handleEnd(e); }
  }
  async handleEnd(e) {
    if (e instanceof GameEnd) { if (e.reason === 'abort') return; this.over = e; this.phase = 'over'; this.ev('gameOver', { winner: e.winner, reason: e.reason }); await this.V.sync(); await this.H.gameOver(e); }
    else { console.error(e); this.H.error(e); }
  }
  entes(pi) { const p = this.P[pi]; return [...p.van, ...p.rear].filter(isEnte); }
  allEntes() { return [...this.entes(this.active), ...this.entes(1 - this.active)]; }
  rowOf(c) { const p = this.P[c.ctrl]; if (p.van.includes(c)) return 'van'; if (p.rear.includes(c)) return 'rear'; return null; }
  inPlay(c) { return !!this.rowOf(c); }
  find(uid) {
    for (const p of this.P) {
      for (const arr of [p.hand, p.souls, p.olvido, p.relics, p.main, p.soulDeck, p.burned]) { const c = arr.find(x => x.uid === uid); if (c) return c; }
      for (const c of [...p.van, ...p.rear]) { if (c && c.uid === uid) return c; if (c) { const r = c.attached.find(x => x.uid === uid); if (r) return r; } }
    }
    for (const it of this.chain) if (it.card && it.card.uid === uid) return it.card;
    return null;
  }
  balance(pi) {
    const p = this.P[pi]; const abs = p.souls.filter(s => !s.faceDown).length; const con = p.souls.length - abs; const diff = abs - con;
    const state = diff >= 3 ? 'virtuoso' : diff <= -3 ? 'corrupto' : 'tibio';
    return { abs, con, diff, state };
  }
  condOk(pi, c) {
    if (!c) return false; const p = this.P[pi]; const k = c.if || c.state;
    switch (k) {
      case 'virtuoso': case 'corrupto': case 'tibio': return this.balance(pi).state === k;
      case 'destino': return !!p.destiny;
      case 'sinDestino': return !p.destiny;
      case 'circulo': return this.circle >= c.n;
      case 'oro': return p.gold > 0;
      case 'olvido': return p.olvido.length >= c.n;
    }
    return false;
  }
  symbols(pi) {
    const p = this.P[pi]; const s = { ira: 0, gula: 0, avaricia: 0, fraude: 0, traicion: 0 };
    for (const k of p.pilgrim.sendas) s[k]++;
    for (const c of p.souls) if (!c.faceDown && c.def.senda) s[c.def.senda]++;
    return s;
  }
  meetsThreshold(pi, def) {
    const need = {}; for (const k of def.req || []) need[k] = (need[k] || 0) + 1;
    const have = this.symbols(pi); return Object.entries(need).every(([k, n]) => have[k] >= n);
  }
  cost(pi, c) {
    let n = c.def.cost;
    if (c.def.type === 'juicio') {
      let red = 0; if (this.circle === 8) red++;
      const p = this.P[pi]; if (p.destiny === 'redencion' && p.pid === 'virgilio') red++;
      if (red) n = Math.max(1, n - red);
    }
    return n;
  }
  abilityCost(pi) {
    const p = this.P[pi]; let n = p.pilgrim.ability.cost;
    for (const r of p.relics) if (r.def.equip && r.def.equip.abilityDiscount) n -= r.def.equip.abilityDiscount;
    return Math.max(0, n);
  }
  energyAvail(pi) { const p = this.P[pi]; return p.pool + p.gold + p.souls.filter(s => !s.tapped).length; }
  pay(pi, n) {
    const p = this.P[pi]; let rem = n; const tapped = [];
    const a = Math.min(p.pool, rem); p.pool -= a; rem -= a;
    for (const s of p.souls) { if (rem <= 0) break; if (!s.tapped) { s.tapped = true; tapped.push(s.uid); rem--; } }
    const g = Math.min(p.gold, rem); p.gold -= g; rem -= g;
    return tapped;
  }
  scaleOf(e, key) {
    const s = e.def.scale; if (!s || !s[key]) return 0; const p = this.P[e.ctrl];
    let n = s.per === 'oro' ? p.gold : s.per === 'olvidoEntes' ? p.olvido.filter(isEnteDef).length : 0;
    n = Math.floor(n / (s.div || 1)); return Math.min(s.max || 99, n) * s[key];
  }
  // Fuerza y Resistencia actuales (base + permanentes + turno + Reliquias + Apoyo/auras + Círculo + condiciones + Peregrinos).
  force(e) {
    const p = this.P[e.ctrl], o = this.P[1 - e.ctrl]; let f = e.def.f + e.permF + e.tempF;
    for (const r of e.attached) if (r.def.equip && r.def.equip.f) f += r.def.equip.f;
    for (const s of p.rear) {
      if (!s) continue;
      if (s.def.apoyo && e.def.senda === s.def.apoyo.senda) f += s.def.apoyo.f;
      if (s.def.aura && (!s.def.aura.attacking || e.attacking)) f += s.def.aura.f || 0;
    }
    if (this.circle === 5 && this.rowOf(e) === 'van') f += 1;
    const cd = e.def.cond; if (cd && this.condOk(e.ctrl, cd)) f += cd.f || 0;
    f += this.scaleOf(e, 'f');
    if (p.destiny === 'caida' && p.pid === 'francesca' && e.attacking) f += 1;
    if (p.destiny === 'caida' && p.pid === 'eneas' && p.gold > 0 && this.rowOf(e) === 'van') f += 1;
    if (o.destiny === 'caida' && o.pid === 'dante' && e.frozen) f -= 1;
    return Math.max(0, f);
  }
  res(e) {
    const p = this.P[e.ctrl], o = this.P[1 - e.ctrl]; let r = e.def.r + e.permR + e.tempR;
    for (const x of e.attached) if (x.def.equip && x.def.equip.r) r += x.def.equip.r;
    for (const s of p.rear) if (s && s.def.aura && s.def.aura.r && (!s.def.aura.attacking || e.attacking)) r += s.def.aura.r;
    const cd = e.def.cond; if (cd && this.condOk(e.ctrl, cd)) r += cd.r || 0;
    r += this.scaleOf(e, 'r');
    if (p.destiny === 'redencion' && p.pid === 'francesca' && this.rowOf(e) === 'van') r += 1;
    if (p.destiny === 'redencion' && p.pid === 'farinata' && e.def.senda === 'ira') r += 1;
    if (p.destiny === 'redencion' && p.pid === 'dante' && this.hasKw(e, 'guardian')) r += 2;
    if (o.destiny === 'caida' && o.pid === 'dante' && e.frozen) r -= 1;
    return r;
  }
  hasKw(e, k) {
    if ((e.def.kw || []).includes(k)) return true;
    const cd = e.def.cond; if (cd && cd.kw && cd.kw.includes(k) && this.condOk(e.ctrl, cd)) return true;
    for (const r of e.attached) if (r.def.equip && r.def.equip.kw && r.def.equip.kw.includes(k)) return true;
    return false;
  }
  kwList(e) { return Object.keys(KEYWORDS).filter(k => this.hasKw(e, k)); }
  noCombat(e) { return e.attached.some(r => r.def.equip && r.def.equip.noCombat); }
  freeSlots(pi, row) { const arr = this.P[pi][row]; const out = []; arr.forEach((c, i) => { if (!c) out.push(i); }); return out; }
  targetable(e, casterPi, isJuicio) { return !(isJuicio && e.protectedFrom === casterPi); }
  passFilter(e, f) { if (!f) return true; if (f.maxF != null && this.force(e) > f.maxF) return false; return true; }

  targets(pi, spec, isJuicio, src, filter) {
    const own = this.entes(pi), enemy = this.entes(1 - pi);
    const card = e => ({ kind: 'card', uid: e.uid });
    const ok = e => this.targetable(e, pi, isJuicio) && this.passFilter(e, filter);
    switch (spec) {
      case 'ente': return [...own, ...enemy].filter(ok).map(card);
      case 'ownEnte': return own.filter(ok).map(card);
      case 'enemyEnte': return enemy.filter(ok).map(card);
      case 'otherOwnEnte': return own.filter(e => e !== src).map(card);
      case 'anyEnte': return [...own, ...enemy].map(card);
      case 'attacker': return [...own, ...enemy].filter(e => e.attacking && ok(e)).map(card);
      case 'combatEnte': return [...own, ...enemy].filter(e => (e.attacking || e.blocking) && ok(e)).map(card);
      case 'chainJuicio': return this.chain.filter(it => it.kind === 'spell' && it.card.def.type === 'juicio' && it.ctrl !== pi).map(it => ({ kind: 'chain', id: it.id }));
      case 'chainAny': return this.chain.filter(it => it.ctrl !== pi && (it.kind !== 'spell' || it.card.def.type === 'juicio')).map(it => ({ kind: 'chain', id: it.id }));
      case 'ownSoul': return this.P[pi].souls.map(s => ({ kind: 'soul', uid: s.uid }));
      default: return [];
    }
  }
  targetsFor(pi, def, src) { return this.targets(pi, def.target, def.type === 'juicio', src, def.filter); }
  attachOptions(pi, c) {
    const a = c.def.attach;
    if (a === 'ownEnte') return this.targets(pi, 'ownEnte', false);
    if (a === 'anyEnte') return this.targets(pi, 'anyEnte', false);
    if (a === 'pilgrim') return [{ kind: 'pilgrim', player: pi }];
    if (a === 'loose') return this.freeSlots(pi, 'rear').map(i => ({ kind: 'slot', player: pi, row: 'rear', idx: i }));
    return [];
  }
  isMainWindow(pi) { return this.active === pi && this.chain.length === 0 && (this.phase === 'main1' || this.phase === 'main2'); }
  canCast(pi, c) {
    const p = this.P[pi]; const d = c.def;
    if (!p.hand.includes(c) || c.soul) return { ok: false, reason: '' };
    if (d.type !== 'juicio' && !this.isMainWindow(pi)) return { ok: false, reason: 'Solo en tu fase principal, con la Cadena vacía.' };
    if (!this.meetsThreshold(pi, d)) return { ok: false, reason: 'Umbral insuficiente: te faltan símbolos de Senda.' };
    if (this.energyAvail(pi) < this.cost(pi, c)) return { ok: false, reason: `Energía insuficiente (necesitas ${this.cost(pi, c)}).` };
    if (isEnte(c)) {
      if (!this.freeSlots(pi, 'van').length && !this.freeSlots(pi, 'rear').length) return { ok: false, reason: 'No quedan espacios libres.' };
      if (d.type === 'ilustre' && this.entes(pi).some(e => e.def.name === d.name)) return { ok: false, reason: 'Ilustre: máximo 1 en juego por nombre.' };
    }
    if (d.type === 'reliquia' && !this.attachOptions(pi, c).length) return { ok: false, reason: 'No hay dónde unir esta Reliquia.' };
    if (d.target && !this.targetsFor(pi, d).length) return { ok: false, reason: 'No hay objetivos legales.' };
    return { ok: true };
  }
  canPlaySoul(pi, c) {
    const p = this.P[pi];
    if (!c.soul || !p.hand.includes(c)) return { ok: false, reason: '' };
    if (!this.isMainWindow(pi)) return { ok: false, reason: 'Las Almas se juegan en tu fase principal.' };
    if (p.soulPlayed) return { ok: false, reason: 'Ya jugaste un Alma este turno (máximo 1).' };
    return { ok: true };
  }
  abilities(pi) {
    const p = this.P[pi]; const out = [];
    if (p.pilgrim.ability && !p.abilityUsed) {
      const cost = this.abilityCost(pi); const ab = p.pilgrim.ability;
      const hasT = !ab.target || this.targets(pi, ab.target, false).length > 0;
      if (this.energyAvail(pi) >= cost && hasT) out.push({ src: 'pilgrim', cost, text: ab.text, target: ab.target });
    }
    for (const e of this.entes(pi)) {
      if (e.def.ability && this.energyAvail(pi) >= e.def.ability.cost && this.entes(pi).length > 1)
        out.push({ src: e.uid, cost: e.def.ability.cost, text: e.def.ability.text, sacrifice: true });
    }
    return out;
  }
  canMove(pi, e) {
    if (!this.isMainWindow(pi) || e.ctrl !== pi || e.moved) return false;
    const row = this.rowOf(e); if (!row) return false;
    return this.freeSlots(pi, row === 'van' ? 'rear' : 'van').length > 0;
  }
  hasResponses(pi) {
    const p = this.P[pi];
    if (p.hand.some(c => !c.soul && c.def.type === 'juicio' && this.canCast(pi, c).ok)) return true;
    return this.abilities(pi).length > 0;
  }

  // ───────────── partida ─────────────
  async run() {
    try { await this.setup(); while (true) await this.takeTurn(); }
    catch (e) { await this.handleEnd(e); }
  }
  async setup() {
    this.phase = 'setup'; this.H.update();
    await this.V.sync();
    this.first = this.forcedFirst != null ? this.forcedFirst : (seededRng(this.seed + 99)() < 0.5 ? 0 : 1); this.active = this.first;
    this.ev('gameStart', {});
    await this.H.announceFirst(this.first);
    this.circle = 1; await this.V.fx('circle', { circle: 1, initial: true });
    this.log(`El dado del Descenso se coloca en 1: <b>Limbo</b>.`);
    for (const pi of [0, 1]) {
      this.H.setPrompt(pi === 0 ? 'Robo inicial: roba 7 cartas una a una, eligiendo cada vez de qué mazo. No hay mulligan.' : 'El rival roba su mano inicial…');
      for (let k = 0; k < 7; k++) await this.drawOne(pi, `inicial ${k + 1}/7`);
    }
    this.log('Cada jugador tiene 7 cartas. Empieza la partida.');
  }
  async takeTurn() {
    this.checkAbort();
    const A = this.active, p = this.P[A];
    this.turn++; this.turnOf[A]++;
    if (A === this.first) this.round++;
    p.soulPlayed = false; p.abilityUsed = false;
    for (const e of this.entes(A)) { e.moved = false; e.sick = false; }
    this.H.turnStart(A); this.ev('turn', { active: A, round: this.round });
    this.log(`<span class="lg-turn">Ronda ${this.round} · ${A === 0 ? 'Tu turno' : 'Turno del rival'} · Círculo ${CIRCLES[this.circle].roman}</span>`);
    // 1. INICIO
    this.setPhase('inicio'); this.step = 'enderezar';
    for (const s of p.souls) s.tapped = false;
    for (const e of this.entes(A)) {
      if (e.frozen) { e.frozen = false; this.log(`${e.def.name} sigue congelado y no se endereza.`); }
      else e.tapped = false;
    }
    await this.V.sync(); await this.pause(250);
    this.step = 'descenso';
    if (A === this.first && this.round > 1) await this.advanceCircle('ronda');
    for (const r of [...p.relics, ...p.rear.filter(x => x && x.def.type === 'reliquia')]) if (r.def.startTurn) { this.log(`${r.def.name}: ${clean(r.def.text).split(':').pop().trim()}`); await this.runOps(r.def.startTurn, r, A, null); }
    if (p.destiny === 'redencion' && p.pid === 'eneas') await this.doOp({ op: 'gainGold', n: 1 }, null, A, null, null);
    if (p.destiny === 'caida' && p.pid === 'farinata') { this.log('Caída de Farinata: el Peregrino rival pierde 1 de Voluntad.'); await this.changeWill(1 - A, -1); await this.checkState(); }
    if (this.circle === 2) await this.lujuria(A);
    this.step = 'robo'; this.H.update();
    await this.drawOne(A, 'paso de robo');
    if (this.circle === 3) { this.log('Gula: robo adicional.'); await this.drawOne(A, 'Gula: robo adicional'); }
    this.step = null;
    await this.priorityLoop('inicio');
    this.endPhasePool();
    // 2. FASE PRINCIPAL 1
    this.setPhase('main1'); this.H.phaseTip('main1');
    await this.priorityLoop('main1');
    this.endPhasePool();
    // 3. COMBATE
    this.setPhase('combat');
    await this.combat();
    this.endPhasePool();
    // 4. FASE PRINCIPAL 2
    this.setPhase('main2');
    await this.priorityLoop('main2');
    this.endPhasePool();
    // 5. FINAL
    this.setPhase('final');
    for (const r of p.rear) if (r && r.def.endTurn) { this.log(`${r.def.name}: ${clean(r.def.text).split(':').pop().trim()}`); await this.runOps(r.def.endTurn, r, A, null); }
    await this.checkState();
    await this.priorityLoop('final');
    this.endPhasePool();
    for (const e of this.allEntes()) { e.damage = 0; e.tempF = 0; e.tempR = 0; e.protectedFrom = null; }
    this.fog = [false, false];
    await this.V.sync();
    if (p.hand.length > 7) { const n = p.hand.length - 7; this.log(`Descarte hasta 7: ${A === 0 ? 'descartas' : 'el rival descarta'} ${n}.`); await this.discard(A, n, 'límite de mano'); }
    if (this.circle === 9 && A !== this.first) await this.finalJudgment();
    this.active = 1 - A;
  }
  endPhasePool() {
    for (const p of this.P) {
      if (!p.pool) continue;
      if (this.circle === 4 && (this.phase === 'main2' || this.phase === 'final') && p.idx === this.active) {
        const add = Math.min(3 - p.gold, p.pool); if (add > 0) { p.gold += add; this.log(`Avaricia: ${add} de energía no gastada se guarda como Oro (${p.gold}/3).`, 'lg-gold'); this.H.tip('oro'); }
      }
      p.pool = 0;
    }
    this.H.update();
  }
  async advanceCircle(reason) {
    if (this.circle >= 9) { this.log('El Descenso ya está en el Noveno Círculo.'); return; }
    this.circle++;
    const C = CIRCLES[this.circle];
    this.log(`<b>Descenso</b> (${reason === 'ronda' ? 'nueva ronda' : 'Descender'}): el d10 sube a ${this.circle}. Círculo ${C.roman} · <b>${C.name}</b> — ${C.rule}`, 'lg-circle');
    await this.V.fx('circle', { circle: this.circle, reason });
    this.H.update(); this.ev('circle', { circle: this.circle });
  }
  async lujuria(A) {
    const cands = this.entes(A).filter(e => this.freeSlots(A, this.rowOf(e) === 'van' ? 'rear' : 'van').length);
    if (!cands.length) { this.log('Lujuria: no hay Ente que pueda cambiar de fila.'); return; }
    const uid = await this.io[A].chooseLujuria(this, A, cands.map(e => ({ kind: 'card', uid: e.uid })));
    const e = cands.find(x => x.uid === uid) || cands[0];
    this.moveRow(e);
    this.log(`Lujuria: el vendaval arrastra a ${e.def.name} a la ${this.rowOf(e) === 'van' ? 'Vanguardia' : 'Retaguardia'}.`);
    await this.V.sync();
  }
  // Cambiar de fila: si estaba en combate, sale de él. Dispara «al cambiar de fila».
  moveRow(e, slot) {
    const p = this.P[e.ctrl]; const row = this.rowOf(e); const to = row === 'van' ? 'rear' : 'van';
    const free = this.freeSlots(e.ctrl, to); if (!free.length) return false;
    const dest = slot != null && free.includes(slot) ? slot : free[0];
    p[row][p[row].indexOf(e)] = null; p[to][dest] = e; e.zone = to;
    if (e.attacking) { e.attacking = false; e.siege = null; }
    if (e.blocking) { e.blocking = null; }
    if (e.def.onMove) this.pending.push({ ctrl: e.ctrl, src: e, fx: e.def.onMove, name: e.def.name, text: clean(e.def.text) });
    this.ev('rowChange', { pi: e.ctrl, uid: e.uid });
    return true;
  }
  async drawOne(pi, reason) {
    this.checkAbort();
    const p = this.P[pi];
    if (!p.main.length && !p.soulDeck.length) throw new GameEnd(1 - pi, 'agotamiento', `${pi === 0 ? 'Debías' : 'El rival debía'} robar y no quedaba ninguna carta en sus dos mazos.`);
    let which;
    if (!p.main.length) which = 'soul'; else if (!p.soulDeck.length) which = 'main';
    else which = await this.io[pi].chooseDrawDeck(this, pi, reason);
    const c = (which === 'soul' ? p.soulDeck : p.main).pop(); c.zone = 'hand'; p.hand.push(c);
    if (pi === 0) this.log(`Robas ${which === 'soul' ? 'un Alma' : 'del Mazo Principal'}: ${c.def.name}.`);
    else this.log(`El rival roba ${which === 'soul' ? 'un Alma' : 'del Mazo Principal'}.`);
    await this.V.fx('draw', { uid: c.uid, pi, which }); this.ev('draw', { pi, uid: c.uid, which });
  }
  async discard(pi, n, reason) {
    const p = this.P[pi]; if (!p.hand.length) return;
    n = Math.min(n, p.hand.length);
    const uids = await this.io[pi].chooseDiscard(this, pi, n, reason);
    for (const uid of uids.slice(0, n)) {
      const i = p.hand.findIndex(c => c.uid === uid); if (i < 0) continue;
      const c = p.hand.splice(i, 1)[0]; c.zone = 'olvido'; p.olvido.push(c);
      this.log(`${pi === 0 ? 'Descartas' : 'El rival descarta'} ${c.def.name}.`);
    }
    await this.V.sync();
  }

  // ───────────── prioridad y Cadena ─────────────
  async priorityLoop(label) {
    this.windowLabel = label;
    let pr = this.active, passes = 0;
    while (true) {
      this.checkAbort();
      if (await this.flushTriggers()) { passes = 0; pr = this.active; }
      this.priority = pr; this.H.update();
      await this.V.sync();
      const act = await this.io[pr].chooseAction(this, pr, label);
      this.checkAbort();
      if (!act || act.type === 'pass') {
        passes++; this.ev('pass', { pi: pr, label, chain: this.chain.length });
        if (passes >= 2) {
          if (!this.chain.length) { this.priority = null; this.H.update(); return; }
          await this.resolveTop(); passes = 0; pr = this.active; continue;
        }
        pr = 1 - pr; continue;
      }
      const usedChain = await this.perform(pr, act);
      if (usedChain) { passes = 1; pr = 1 - pr; }
    }
  }
  async perform(pi, a) {
    const p = this.P[pi];
    if (a.type === 'tap') {
      const s = p.souls.find(x => x.uid === a.uid); if (!s || s.tapped) return false;
      s.tapped = true; p.pool++; this.H.update(); await this.V.fx('tapSoul', { uid: s.uid, pi }); this.ev('tap', { pi, uid: s.uid }); return false;
    }
    if (a.type === 'soul') { await this.playSoul(pi, a.uid); return false; }
    if (a.type === 'move') {
      const e = this.find(a.uid); if (!e || !this.canMove(pi, e)) return false;
      this.moveRow(e, a.slot); e.moved = true;
      this.log(`${pi === 0 ? 'Mueves' : 'El rival mueve'} ${e.def.name} a la ${this.rowOf(e) === 'van' ? 'Vanguardia' : 'Retaguardia'}.`);
      await this.V.fx('move', { uid: e.uid }); this.ev('move', { pi, uid: e.uid }); return false;
    }
    if (a.type === 'cast') return await this.cast(pi, a);
    if (a.type === 'ability') return await this.activate(pi, a);
    return false;
  }
  async playSoul(pi, uid) {
    const p = this.P[pi]; const s = p.hand.find(c => c.uid === uid);
    if (!s || !this.canPlaySoul(pi, s).ok) return;
    const mode = await this.io[pi].chooseSoulMode(this, pi, s);
    if (!mode) return;
    p.hand.splice(p.hand.indexOf(s), 1); s.zone = 'souls'; s.faceDown = mode === 'condemn'; s.tapped = false; p.souls.push(s); p.soulPlayed = true;
    const who = pi === 0 ? 'Tú' : 'El rival';
    if (mode === 'absolve') this.log(`${who} <b class="lg-gold">absuelve</b> a ${s.def.name}: boca arriba, aporta ${s.def.senda ? 'su símbolo de ' + SENDAS[s.def.senda].name : 'energía (sin Senda)'}. Balanza → Virtud.`);
    else this.log(`${who} <b class="lg-ash">condena</b> a ${s.def.name}: boca abajo. Condena: «${clean(s.def.text)}» Balanza → Corrupción.`);
    await this.V.fx(mode === 'absolve' ? 'absolve' : 'condemn', { uid: s.uid, pi });
    this.H.tip(mode === 'absolve' ? 'absolver' : 'condenar');
    this.ev('soul', { pi, uid: s.uid, mode, senda: s.def.senda, id: s.id });
    if (mode === 'absolve') {
      this.log(`Gracia: ${pi === 0 ? 'tu Peregrino gana' : 'el Peregrino rival gana'} 1 de Voluntad.`, 'lg-gold');
      await this.changeWill(pi, 1);
      if (p.destiny === 'redencion' && p.pid === 'forese') {
        const t = this.entes(pi).sort((x, y) => this.force(x) - this.force(y))[0];
        if (t) { t.permF++; t.permR++; this.log(`Redención de Forese: ${t.def.name} recibe +1/+1 para siempre.`); await this.V.fx('buff', { uid: t.uid }); }
      }
    }
    await this.afterBalance(pi);
    if (mode === 'condemn') await this.runSpec(s.def.condemn, s, pi, null, 'Condena');
    await this.checkState();
  }
  async afterBalance(pi) {
    const p = this.P[pi]; const b = this.balance(pi);
    if (b.state !== p.lastState) {
      const prev = p.lastState; p.lastState = b.state;
      this.log(`La Balanza de ${pi === 0 ? 'tu Peregrino' : 'el rival'} pasa a <b>${b.state === 'virtuoso' ? 'Virtuoso' : b.state === 'corrupto' ? 'Corrupto' : 'Tibio'}</b> (${b.abs} absueltas / ${b.con} condenadas).`, 'lg-bal');
      await this.V.fx('balanceState', { pi, state: b.state, prev }); if (pi === 0) this.H.tip('estado_' + b.state); this.ev('balance', { pi, state: b.state });
    }
    if (!p.destiny && Math.abs(b.diff) >= 5) {
      p.destiny = b.diff > 0 ? 'redencion' : 'caida';
      const txt = p.destiny === 'redencion' ? p.pilgrim.redencion.text : p.pilgrim.caida.text;
      this.log(`<b>Destino: ${p.destiny === 'redencion' ? 'Redención' : 'Caída'}</b>. ${pi === 0 ? 'Tu' : 'El'} Peregrino desbloquea para siempre: «${txt}» El otro Destino queda sellado.`, 'lg-circle');
      await this.V.fx('destiny', { pi, destiny: p.destiny }); this.H.tip('destino'); this.ev('destiny', { pi, destiny: p.destiny, round: this.round });
    }
    this.H.update();
  }
  async cast(pi, a) {
    const p = this.P[pi]; const c = p.hand.find(x => x.uid === a.uid);
    if (!c || !this.canCast(pi, c).ok) return false;
    const cost = this.cost(pi, c); const tapped = this.pay(pi, cost);
    if (tapped.length) await this.V.fx('autoTap', { uids: tapped, pi });
    p.hand.splice(p.hand.indexOf(c), 1); c.zone = 'chain';
    const it = { id: this.chainId++, kind: 'spell', card: c, ctrl: pi, targets: a.targets || null, row: a.row, slot: a.slot, attach: a.attach, name: c.def.name };
    this.chain.push(it);
    this.log(`${pi === 0 ? 'Juegas' : 'El rival juega'} <b>${c.def.name}</b> (${cost} de energía)${this.describeTarget(it)}. Entra en la Cadena.`, c.def.type === 'juicio' ? 'lg-juicio' : '');
    await this.V.fx('chainIn', { item: it });
    this.ev('cast', { pi, item: it, id: c.id });
    this.H.tip(c.def.type === 'juicio' ? 'juicio' : 'cadena');
    if (this.chain.length >= 2) this.H.tip('cadena2');
    if (c.def.type === 'juicio' && p.destiny === 'caida' && p.pid === 'ulises') { this.log('Caída de Ulises: Sepultar 2.'); await this.doOp({ op: 'mill', n: 2, who: 'opp' }, null, pi, null, null); }
    return true;
  }
  describeTarget(it) {
    const t = it.targets && it.targets[0]; if (!t) return '';
    if (t.kind === 'card') { const e = this.find(t.uid); return e ? ` sobre ${e.def.name}` : ''; }
    if (t.kind === 'chain') { const x = this.chain.find(y => y.id === t.id); return x ? ` contra ${x.name}` : ''; }
    if (t.kind === 'soul') { const s = this.find(t.uid); return s ? ` sobre el Alma ${s.def.name}` : ''; }
    return '';
  }
  async activate(pi, a) {
    const p = this.P[pi];
    if (a.src === 'pilgrim') {
      const ab = p.pilgrim.ability; if (p.abilityUsed) return false;
      const cost = this.abilityCost(pi); if (this.energyAvail(pi) < cost) return false;
      p.abilityUsed = true; const tapped = this.pay(pi, cost); if (tapped.length) await this.V.fx('autoTap', { uids: tapped, pi });
      const it = { id: this.chainId++, kind: 'ability', ctrl: pi, spec: { fx: ab.fx, target: ab.target, harm: ab.harm }, targets: a.targets || null, name: p.pilgrim.name, text: ab.text, senda: p.pilgrim.sendas[0], srcPilgrim: pi };
      this.chain.push(it);
      this.log(`${pi === 0 ? 'Activas' : 'El rival activa'} la habilidad de <b>${p.pilgrim.name}</b>${this.describeTarget(it)}. Entra en la Cadena.`);
      await this.V.fx('chainIn', { item: it }); this.ev('ability', { pi, item: it }); return true;
    }
    const e = this.find(a.src); if (!e || !e.def.ability) return false;
    const sac = this.find(a.sacrifice); if (!sac || sac === e || sac.ctrl !== pi || !this.inPlay(sac)) return false;
    const tapped = this.pay(pi, e.def.ability.cost); if (tapped.length) await this.V.fx('autoTap', { uids: tapped, pi });
    this.log(`${pi === 0 ? 'Sacrificas' : 'El rival sacrifica'} ${sac.def.name} para activar ${e.def.name}.`);
    await this.kill(sac, 'sacrificio');
    const it = { id: this.chainId++, kind: 'ability', ctrl: pi, spec: { fx: e.def.ability.fx }, srcCard: e, targets: null, name: e.def.name, text: e.def.ability.text, senda: e.def.senda };
    this.chain.push(it); await this.V.fx('chainIn', { item: it });
    return true;
  }
  // Disparadores: entran en la Cadena en orden APNAP; los de cada jugador, en el orden en que se dispararon.
  async flushTriggers() {
    if (!this.pending.length) return false;
    const list = this.pending.splice(0);
    list.sort((a, b) => (a.ctrl === this.active ? 0 : 1) - (b.ctrl === this.active ? 0 : 1));
    let any = false;
    for (const tr of list) {
      let targets = null;
      if (tr.target) {
        const cands = this.targets(tr.ctrl, tr.target, false, tr.src);
        if (!cands.length) { this.log(`${tr.name}: no hay objetivo, el disparador no hace nada.`); continue; }
        const pick = await this.io[tr.ctrl].chooseTarget(this, tr.ctrl, cands, `${tr.name}: elige objetivo — ${tr.text}`, false, { fx: tr.fx, harm: true });
        targets = [pick || cands[0]];
      }
      const it = { id: this.chainId++, kind: 'trigger', ctrl: tr.ctrl, spec: { fx: tr.fx, target: tr.target }, srcCard: tr.src && tr.src.uid ? tr.src : null, srcPilgrim: tr.srcPilgrim, targets, name: tr.name, text: tr.text, senda: tr.src && tr.src.def ? tr.src.def.senda : null };
      this.chain.push(it); any = true;
      this.log(`Disparador: <b>${tr.name}</b> — ${tr.text} Entra en la Cadena.`);
      await this.V.fx('chainIn', { item: it });
    }
    if (any) this.H.tip('disparador');
    return any;
  }
  async resolveTop() {
    const it = this.chain[this.chain.length - 1]; if (!it) return;
    await this.V.fx('resolveStart', { item: it });
    this.chain.pop();
    if (it.kind === 'spell') {
      const c = it.card, d = c.def, p = this.P[it.ctrl];
      if (isEnte(c)) {
        let row = it.row || 'van'; let slot = it.slot;
        if (slot == null || p[row][slot]) { const f = this.freeSlots(it.ctrl, row); if (f.length) slot = f[0]; else { row = row === 'van' ? 'rear' : 'van'; const f2 = this.freeSlots(it.ctrl, row); slot = f2.length ? f2[0] : null; } }
        if (slot == null) { c.zone = 'olvido'; this.P[c.owner].olvido.push(c); this.log(`${d.name} no encuentra espacio y va al Olvido.`); }
        else {
          p[row][slot] = c; c.zone = row; c.ctrl = it.ctrl; c.sick = true; c.moved = false; c.tapped = false; c.damage = 0;
          this.log(`Resuelve ${d.name}: entra en ${row === 'van' ? 'la Vanguardia' : 'la Retaguardia'} (${this.force(c)}/${this.res(c)}).`);
          await this.V.fx('enter', { uid: c.uid, pi: it.ctrl });
          if (d.onEnter) this.pending.push({ ctrl: it.ctrl, src: c, fx: d.onEnter, target: d.onEnterTarget, name: d.name, text: clean(d.text) });
          if (d.cond) this.H.tip('cond');
          this.ev('enter', { pi: it.ctrl, uid: c.uid, id: c.id });
        }
      } else if (d.type === 'reliquia') {
        const at = it.attach; let placed = false;
        if (at && at.kind === 'card') { const e = this.find(at.uid); if (e && this.inPlay(e)) { e.attached.push(c); c.attachedTo = e.uid; c.zone = 'attached'; placed = true; this.log(`Resuelve ${d.name}: queda unida a ${e.def.name}.`); } }
        else if (at && at.kind === 'pilgrim') { p.relics.push(c); c.zone = 'relic'; placed = true; this.log(`Resuelve ${d.name}: queda unida a tu Peregrino.`); }
        else if (at && at.kind === 'slot') { const f = this.freeSlots(it.ctrl, 'rear'); const s = f.includes(at.idx) ? at.idx : f[0]; if (s != null) { p.rear[s] = c; c.zone = 'rear'; placed = true; this.log(`Resuelve ${d.name}: queda suelta en la Retaguardia.`); } }
        if (!placed) { c.zone = 'olvido'; this.P[c.owner].olvido.push(c); this.log(`${d.name} pierde su objetivo y va al Olvido.`); }
        await this.V.fx('enter', { uid: c.uid, pi: it.ctrl }); this.H.tip('reliquia');
      } else {
        const ok = await this.runSpec(d, c, it.ctrl, it.targets, d.name);
        c.zone = 'olvido'; this.P[c.owner].olvido.push(c);
        if (ok && d.type === 'juicio' && p.destiny === 'caida' && p.pid === 'virgilio') { this.log('Caída de Virgilio: el Peregrino rival pierde 2 de Voluntad.'); await this.changeWill(1 - it.ctrl, -2); }
        if (ok && d.type === 'juicio' && p.destiny === 'redencion' && p.pid === 'virgilio') { this.log('Redención de Virgilio: ganas 1 de Voluntad.'); await this.changeWill(it.ctrl, 1); }
        await this.V.sync();
      }
    } else {
      await this.runSpec(it.spec, it.srcCard || null, it.ctrl, it.targets, it.name);
    }
    await this.checkState();
    this.ev('resolve', { item: it, id: it.card ? it.card.id : null });
  }

  // ───────────── efectos ─────────────
  legalTarget(spec, t, pi, isJuicio, filter) {
    if (!t) return false;
    if (t.kind === 'chain') return this.chain.some(x => x.id === t.id);
    if (t.kind === 'soul') return this.P[pi].souls.some(s => s.uid === t.uid);
    const e = this.find(t.uid); if (!e || !this.inPlay(e)) return false;
    if (!this.targetable(e, pi, isJuicio) || !this.passFilter(e, filter)) return false;
    if (spec === 'attacker' && !e.attacking) return false;
    if (spec === 'combatEnte' && !(e.attacking || e.blocking)) return false;
    return true;
  }
  async runSpec(spec, src, pi, targets, name) {
    const isJ = !!(src && src.def && src.def.type === 'juicio');
    let target = null;
    if (spec.target) {
      if (!targets) {
        const cands = this.targets(pi, spec.target, isJ, src, spec.filter);
        if (!cands.length) { this.log(`${name}: no hay objetivo legal.`); return false; }
        const pick = await this.io[pi].chooseTarget(this, pi, cands, `${name}: elige objetivo`, false, spec);
        targets = [pick || cands[0]];
      }
      if (!this.legalTarget(spec.target, targets[0], pi, isJ, spec.filter)) {
        this.log(`<b>${name}</b> se anula: su objetivo ya no es legal.`, 'lg-fizzle');
        await this.V.fx('fizzle', { name }); this.H.tip('anula'); this.ev('fizzle', { name }); return false;
      }
      target = targets[0];
    }
    await this.runOps(spec.fx, src, pi, target);
    return true;
  }
  async runOps(ops, src, pi, target) {
    const T = target && target.kind === 'card' ? this.find(target.uid) : null;
    for (const op of ops) { if (op.if && !this.condOk(pi, { if: op.if })) continue; await this.doOp(op, src, pi, target, T); }
    await this.V.sync();
  }
  async changeWill(pi, delta) {
    const p = this.P[pi]; p.will += delta;
    await this.V.fx('will', { pi, delta }); this.ev('will', { pi, delta, will: p.will });
    this.H.update();
    if (p.will <= 0) await this.checkState();
  }
  async doOp(op, src, pi, target, T) {
    const opp = 1 - pi; const nm = x => x ? x.def.name : '';
    switch (op.op) {
      case 'damage': if (T) { T.damage += op.n; this.log(`${nm(T)} recibe ${op.n} de daño.`); await this.V.fx('damage', { uid: T.uid, n: op.n }); } break;
      case 'damageAll': {
        const list = op.who === 'enemyVan' ? this.P[opp].van.filter(isEnte) : this.entes(opp);
        this.log(`${nm(src) || 'El efecto'} inflige ${op.n} de daño a ${list.length} Entes rivales.`);
        for (const e of list) { e.damage += op.n; await this.V.fx('damage', { uid: e.uid, n: op.n }); }
        break;
      }
      case 'buff': if (T) { T.tempF += op.f; T.tempR += op.r; this.log(`${nm(T)} recibe +${op.f}/+${op.r} este turno.`); await this.V.fx('buff', { uid: T.uid }); } break;
      case 'grow': { const x = T && (!src || !this.inPlay(src) || src.soul || src.def.type !== 'ente' && src.def.type !== 'ilustre') ? T : src; if (x && this.inPlay(x)) { x.permF += op.f; x.permR += op.r; this.log(`${nm(x)} recibe +${op.f}/+${op.r} para siempre.`); await this.V.fx('buff', { uid: x.uid }); } break; }
      case 'growAll': for (const e of this.entes(pi)) { e.permF += op.f; e.permR += op.r; await this.V.fx('buff', { uid: e.uid }); } this.log(`Tus Entes reciben +${op.f}/+${op.r} para siempre.`); break;
      case 'protect': if (T) { T.protectedFrom = 1 - T.ctrl; this.log(`${nm(T)} no puede ser elegido por Juicios rivales este turno.`); await this.V.fx('buff', { uid: T.uid }); } break;
      case 'draw': for (let i = 0; i < op.n; i++) await this.drawOne(pi, src ? nm(src) : 'efecto'); break;
      case 'discard': await this.discard(pi, op.n, src ? nm(src) : 'efecto'); break;
      case 'gainWill': this.log(`${pi === 0 ? 'Tu Peregrino gana' : 'El Peregrino rival gana'} ${op.n} de Voluntad.`); await this.changeWill(pi, op.n); break;
      case 'loseWillOpp': this.log(`${opp === 0 ? 'Tu Peregrino pierde' : 'El Peregrino rival pierde'} ${op.n} de Voluntad.`); await this.changeWill(opp, -op.n); break;
      case 'gainGold': { const p = this.P[pi]; const add = Math.min(3 - p.gold, op.n); p.gold += add; this.log(`${pi === 0 ? 'Ganas' : 'El rival gana'} ${add} de Oro (${p.gold}/3).`, 'lg-gold'); this.H.update(); this.ev('gold', { pi, add }); break; }
      case 'spendGoldDraw': { const p = this.P[pi]; const n = p.gold; p.gold = 0; this.log(`${pi === 0 ? 'Gastas' : 'El rival gasta'} ${n} de Oro.`); for (let i = 0; i < n; i++) await this.drawOne(pi, 'Usura'); break; }
      case 'tap': if (T) { T.tapped = true; if (op.freeze) T.frozen = true; this.log(`${nm(T)} queda agotado${op.freeze ? ' y congelado' : ''}.`); await this.V.fx('freeze', { uid: T.uid }); } break;
      case 'tapAllEnemy': for (const e of this.entes(opp)) { e.tapped = true; if (op.freeze) e.frozen = true; await this.V.fx('freeze', { uid: e.uid }); } this.log('El hielo congela los Entes rivales.'); break;
      case 'removeCombat': if (T) { T.attacking = false; T.siege = null; this.log(`${nm(T)} deja de atacar.`); await this.V.fx('freeze', { uid: T.uid }); } break;
      case 'removeCombatAll': for (const e of this.allEntes()) if (e.attacking) { e.attacking = false; e.siege = null; await this.V.fx('freeze', { uid: e.uid }); } this.log('Todos los atacantes dejan de atacar.'); break;
      case 'fog': this.fog[pi] = true; this.log(`${pi === 0 ? 'Tu Peregrino' : 'El Peregrino rival'} no recibirá daño de combate este turno.`); break;
      case 'destroy': if (T) { this.log(`${nm(T)} es destruido.`); await this.kill(T, 'destruido'); } break;
      case 'shift': if (T && this.inPlay(T)) { if (this.moveRow(T)) { this.log(`${nm(T)} pasa a la ${this.rowOf(T) === 'van' ? 'Vanguardia' : 'Retaguardia'}.`); await this.V.fx('move', { uid: T.uid }); } else this.log(`${nm(T)} no puede cambiar de fila: no hay hueco.`); } break;
      case 'counter': {
        const i = this.chain.findIndex(x => x.id === target.id); if (i < 0) break;
        const it = this.chain[i]; const tp = this.P[it.ctrl];
        if (it.kind === 'spell' && it.card.def.type === 'juicio' && tp.destiny === 'redencion' && tp.pid === 'ulises') { this.log(`Redención de Ulises: <b>${it.name}</b> no puede ser anulado.`); break; }
        this.chain.splice(i, 1); this.log(`<b>${it.name}</b> queda anulado.`, 'lg-fizzle'); await this.V.fx('countered', { item: it });
        if (it.card) { it.card.zone = 'olvido'; this.P[it.card.owner].olvido.push(it.card); } await this.V.sync();
        break;
      }
      case 'bounce': if (T) { this.log(`${nm(T)} vuelve a la mano de su dueño.`); await this.leavePlay(T, 'hand'); } break;
      case 'bounceAll': {
        const list = this.P[opp].van.filter(e => isEnte(e) && (op.maxCost == null || e.def.cost <= op.maxCost));
        for (const e of list) await this.leavePlay(e, 'hand');
        this.log(`${list.length} Entes rivales vuelven a la mano de su dueño.`); await this.V.sync(); break;
      }
      case 'mill': {
        const who = op.who === 'self' ? pi : opp; const p = this.P[who]; const uids = [];
        for (let i = 0; i < op.n && p.main.length; i++) { const c = p.main.pop(); c.zone = 'olvido'; p.olvido.push(c); uids.push(c.uid); }
        this.log(`Sepultar ${op.n}: ${uids.length} cartas del Mazo Principal ${who === 0 ? 'tuyo' : 'rival'} van al Olvido.`, 'lg-ash');
        await this.V.fx('mill', { pi: who, uids }); this.ev('mill', { pi: who, n: uids.length }); break;
      }
      case 'exhume': {
        const p = this.P[pi]; let k = -1; for (let i = p.olvido.length - 1; i >= 0; i--) if (isEnteDef(p.olvido[i])) { k = i; break; }
        if (k < 0) { this.log('No hay ningún Ente en tu Olvido.'); break; }
        const c = p.olvido.splice(k, 1)[0]; c.zone = 'hand'; p.hand.push(c); this.log(`${pi === 0 ? 'Recuperas' : 'El rival recupera'} ${c.def.name} del Olvido.`); await this.V.sync(); break;
      }
      case 'descend': await this.advanceCircle('Descender'); break;
      case 'flip': {
        const s = this.P[pi].souls.find(x => target && x.uid === target.uid);
        if (s) { s.faceDown = !s.faceDown; this.log(`El Alma ${s.def.name} se voltea: ahora está ${s.faceDown ? 'condenada' : 'absuelta'}.`); await this.V.fx(s.faceDown ? 'condemn' : 'absolve', { uid: s.uid, pi }); await this.afterBalance(pi); }
        break;
      }
      case 'punishExtreme': {
        const st = this.balance(opp).state;
        if (st === 'tibio') this.log('El rival es Tibio: el centro es seguro, no pierde nada.');
        else { this.log(`El rival es ${st === 'virtuoso' ? 'Virtuoso' : 'Corrupto'}: los extremos exponen.`); await this.changeWill(opp, -op.n); }
        break;
      }
      case 'sacrifice': if (T && T.ctrl === pi) { this.log(`${pi === 0 ? 'Sacrificas' : 'El rival sacrifica'} ${nm(T)}.`); await this.kill(T, 'sacrificio'); } break;
      case 'scry': {
        const which = await this.io[pi].chooseDrawDeck(this, pi, 'scry');
        const deck = which === 'soul' ? this.P[pi].soulDeck : this.P[pi].main;
        const top = deck.splice(Math.max(0, deck.length - op.n)).reverse();
        if (!top.length) break;
        const order = await this.io[pi].chooseOrder(this, pi, top);
        for (const c of [...order].reverse()) deck.push(c);
        this.log(`${pi === 0 ? 'Miras' : 'El rival mira'} las ${top.length} cartas superiores de su ${which === 'soul' ? 'Mazo de Almas' : 'Mazo Principal'} y las ordena.`);
        break;
      }
      case 'revealHand': await this.io[pi].revealHand(this, opp); this.log(`${pi === 0 ? 'Miras la mano del rival.' : 'El rival mira tu mano.'}`); break;
    }
  }
  async leavePlay(e, dest) {
    const p = this.P[e.ctrl]; const row = this.rowOf(e);
    if (row) p[row][p[row].indexOf(e)] = null;
    for (const r of e.attached) { r.zone = 'olvido'; r.attachedTo = null; this.P[r.owner].olvido.push(r); }
    e.attached = [];
    Object.assign(e, { tapped: false, sick: false, damage: 0, tempF: 0, tempR: 0, permF: 0, permR: 0, frozen: false, protectedFrom: null, attacking: false, blockedBy: null, blocking: null, siege: null, ctrl: e.owner });
    const o = this.P[e.owner];
    if (dest === 'hand') { e.zone = 'hand'; o.hand.push(e); await this.V.sync(); }
    else if (dest === 'burn') { e.zone = 'burned'; o.burned.push(e); }
    else { e.zone = 'olvido'; o.olvido.push(e); }
  }
  async kill(e, why) {
    if (!this.inPlay(e)) return;
    const burn = this.circle === 6 && isEnte(e); const ctrl = e.ctrl;
    await this.V.fx(burn ? 'burn' : 'die', { uid: e.uid });
    this.log(`${e.def.name} ${why === 'sacrificio' ? 'es sacrificado' : 'muere'}${burn ? ' y se <b>Quema</b> (Herejía): sale de la partida' : ' y va al Olvido'}.`, burn ? 'lg-ash' : '');
    if (burn) this.H.tip('quemar');
    await this.leavePlay(e, burn ? 'burn' : 'olvido');
    if (isEnte(e)) {
      if (e.def.onDeath) this.pending.push({ ctrl, src: e, fx: e.def.onDeath, name: e.def.name, text: clean(e.def.text) });
      for (const a of this.entes(ctrl)) if (a.def.onAllyDeath) this.pending.push({ ctrl, src: a, fx: a.def.onAllyDeath, name: a.def.name, text: clean(a.def.text) });
      const P = this.P[ctrl];
      if (P.destiny === 'caida' && P.pid === 'forese') this.pending.push({ ctrl, src: { def: { name: 'Forese', senda: 'gula' } }, srcPilgrim: ctrl, fx: [{ op: 'loseWillOpp', n: 1 }], name: 'Caída de Forese', text: 'El Peregrino rival pierde 1 de Voluntad.' });
    }
    await this.V.sync(); this.ev('death', { uid: e.uid, id: e.id, pi: ctrl });
  }
  async checkState() {
    let changed = true;
    while (changed) {
      changed = false;
      for (const e of this.allEntes()) if (e.damage >= this.res(e) || this.res(e) <= 0) { await this.kill(e, 'daño'); changed = true; break; }
    }
    for (const pi of [0, 1]) await this.afterBalance(pi);
    const d0 = this.P[0].will <= 0, d1 = this.P[1].will <= 0;
    if (d0 || d1) {
      await this.V.sync();
      if (d0 && d1) throw new GameEnd(null, 'voluntad', 'Los dos Peregrinos llegan a 0 de Voluntad a la vez.');
      throw new GameEnd(d0 ? 1 : 0, 'voluntad', `La Voluntad de ${d0 ? 'tu Peregrino' : 'el Peregrino rival'} llega a 0.`);
    }
    await this.V.sync();
  }

  // ───────────── combate ─────────────
  attackCandidates(pi) {
    return this.P[pi].van.filter(e => isEnte(e) && !e.tapped && (!e.sick || this.hasKw(e, 'embestida')) && !this.noCombat(e));
  }
  blockCandidates(pi) {
    const p = this.P[pi]; const out = p.van.filter(e => isEnte(e) && !e.tapped && !this.noCombat(e));
    if (this.circle !== 9) for (const e of p.rear) if (isEnte(e) && !e.tapped && this.hasKw(e, 'guardian') && !this.noCombat(e)) out.push(e);
    return out;
  }
  canBlock(b, a) { return !this.hasKw(a, 'vuelo') || this.hasKw(b, 'vuelo'); }
  siegeTargets(A) { return this.P[1 - A].rear.filter(isEnte); }
  async combat() {
    const A = this.active, D = 1 - A;
    this.step = 'atacantes'; this.H.update();
    if (this.circle === 1) { this.log('Limbo: los Entes no pueden atacar. Ronda de despliegue.'); this.H.tip('limbo'); await this.pause(400); this.step = null; return; }
    const cands = this.attackCandidates(A);
    if (!cands.length) { this.log(`${A === 0 ? 'No tienes' : 'El rival no tiene'} Entes que puedan atacar.`); this.step = null; return; }
    const mandatory = cands.filter(e => this.hasKw(e, 'iraCiega'));
    let chosen = await this.io[A].chooseAttackers(this, A, cands.map(e => e.uid), mandatory.map(e => e.uid));
    chosen = [...new Set([...chosen, ...mandatory.map(e => e.uid)])];
    const attackers = cands.filter(e => chosen.includes(e.uid));
    if (!attackers.length) { this.log(`${A === 0 ? 'No atacas' : 'El rival no ataca'} este turno.`); this.step = null; return; }
    for (const e of attackers) { e.tapped = true; e.attacking = true; e.wasBlocked = false; e.siege = null; }
    // Asedio: cada atacante con Asedio elige su objetivo
    for (const e of attackers) {
      if (!this.hasKw(e, 'asedio')) continue;
      const rear = this.siegeTargets(A); if (!rear.length) continue;
      const cand = [{ kind: 'pilgrim', player: D }, ...rear.map(x => ({ kind: 'card', uid: x.uid }))];
      const pick = await this.io[A].chooseSiegeTarget(this, A, e.uid, cand);
      if (pick && pick.kind === 'card') { e.siege = pick.uid; this.log(`${e.def.name} asedia a ${this.find(pick.uid).def.name} en la Retaguardia.`); this.H.tip('asedio'); }
    }
    this.log(`${A === 0 ? 'Declaras' : 'El rival declara'} atacantes: ${attackers.map(e => `${e.def.name} (${this.force(e)})`).join(', ')}.`);
    await this.V.fx('attack', { uids: attackers.map(e => e.uid) }); this.H.tip('atacar'); this.ev('attack', { pi: A, uids: attackers.map(e => e.uid) });
    for (const e of attackers) if (e.def.onAttack) this.pending.push({ ctrl: A, src: e, fx: e.def.onAttack, target: e.def.onAttackTarget, name: e.def.name, text: clean(e.def.text) });
    await this.priorityLoop('atacantes');
    let live = attackers.filter(e => e.attacking && this.inPlay(e));
    if (live.length) {
      this.step = 'bloqueadores'; this.H.update();
      const bc = this.blockCandidates(D);
      let blocks = {};
      if (bc.length) blocks = await this.io[D].chooseBlocks(this, D, live.map(e => e.uid), bc.map(e => e.uid)) || {};
      const used = new Set();
      for (const [au, bu] of Object.entries(blocks)) {
        const a = live.find(e => e.uid === +au); const b = bc.find(e => e.uid === bu);
        if (!a || !b || used.has(bu) || !this.canBlock(b, a)) continue;
        used.add(bu); a.blockedBy = b.uid; a.wasBlocked = true; b.blocking = a.uid;
        this.log(`${D === 0 ? 'Bloqueas' : 'El rival bloquea'} a ${a.def.name} con ${b.def.name}.`);
      }
      if (!used.size) this.log(`${D === 0 ? 'No bloqueas' : 'El rival no bloquea'}.`);
      await this.V.fx('blocks', {}); if (used.size) this.H.tip('bloquear'); this.ev('blocks', { pi: D, n: used.size });
      await this.priorityLoop('bloqueadores');
      this.step = 'daño'; this.H.update();
      await this.combatDamage(A); this.ev('damageDone', {});
    }
    this.step = 'fin'; this.H.update();
    await this.checkState();
    await this.priorityLoop('fin de combate');
    for (const e of this.allEntes()) { e.attacking = false; e.blockedBy = null; e.blocking = null; e.wasBlocked = false; e.siege = null; }
    this.step = null; await this.V.sync();
  }
  async combatDamage(A) {
    const D = 1 - A;
    const attackers = this.entes(A).filter(e => e.attacking);
    const anyFirst = attackers.some(a => this.hasKw(a, 'primerGolpe') || (a.blockedBy && this.find(a.blockedBy) && this.hasKw(this.find(a.blockedBy), 'primerGolpe')));
    const dealt = new Set();
    const pass = async (firstStrike) => {
      const hits = []; let pilgrim = 0;
      for (const a of attackers) {
        if (!this.inPlay(a) || !a.attacking) continue;
        const b = a.blockedBy ? this.find(a.blockedBy) : null; const bAlive = b && this.inPlay(b);
        const aStrikes = firstStrike ? this.hasKw(a, 'primerGolpe') : !dealt.has(a.uid);
        if (aStrikes) {
          dealt.add(a.uid); const f = this.force(a);
          if (!a.wasBlocked) {
            const st = a.siege ? this.find(a.siege) : null;
            if (st && this.inPlay(st) && this.rowOf(st) === 'rear') hits.push({ from: a.uid, to: st.uid, n: f, siege: true });
            else { pilgrim += f; hits.push({ from: a.uid, toPilgrim: D, n: f }); }
          } else if (bAlive) {
            const remaining = this.res(b) - b.damage; hits.push({ from: a.uid, to: b.uid, n: f });
            if (this.circle === 7 && f > remaining) { const ex = f - Math.max(0, remaining); pilgrim += ex; hits.push({ from: a.uid, toPilgrim: D, n: ex, excess: true }); }
          }
        }
        if (bAlive) {
          const bStrikes = firstStrike ? this.hasKw(b, 'primerGolpe') : !dealt.has(b.uid);
          if (bStrikes) { dealt.add(b.uid); hits.push({ from: b.uid, to: a.uid, n: this.force(b) }); }
        }
      }
      if (!hits.length) return;
      if (this.fog[D] && pilgrim > 0) { this.log(`El Peregrino ${D === 0 ? 'tuyo' : 'rival'} está protegido: no recibe daño de combate.`); pilgrim = 0; for (const h of hits) if (h.toPilgrim != null) h.n = 0; }
      await this.V.fx('combatHits', { hits: hits.filter(h => h.n > 0), first: firstStrike });
      for (const h of hits) { if (h.to) { const t = this.find(h.to); if (t) t.damage += h.n; } }
      for (const h of hits) {
        const src = this.find(h.from); if (h.n <= 0) continue;
        if (h.to) { const t = this.find(h.to); this.log(`${src.def.name} hace ${h.n} de daño a ${t.def.name}${h.siege ? ' (Asedio)' : ''}.`); }
        else this.log(`${src.def.name} hace ${h.n} de daño ${h.excess ? 'sobrante (Violencia) ' : ''}al Peregrino ${h.toPilgrim === 0 ? 'tuyo' : 'rival'}.`, 'lg-dmg');
      }
      if (pilgrim > 0) { await this.changeWill(D, -pilgrim); this.ev('combatDamage', { pi: D, n: pilgrim }); }
      if (this.circle === 7 && hits.some(h => h.excess)) this.H.tip('violencia');
      let changed = true;
      while (changed) { changed = false; for (const e of this.allEntes()) if (e.damage >= this.res(e)) { await this.kill(e, 'daño'); changed = true; break; } }
    };
    if (anyFirst) { this.log('Primer golpe: se resuelve el daño adelantado.'); await pass(true); }
    await pass(false);
    await this.checkState();
  }

  async finalJudgment() {
    const [a, b] = this.P; const ba = this.balance(0), bb = this.balance(1);
    await this.V.fx('finalJudgment', {});
    const detail = { will: [a.will, b.will], diff: [ba.diff, bb.diff], state: [ba.state, bb.state] };
    if (a.will !== b.will) throw new GameEnd(a.will > b.will ? 0 : 1, 'juicioFinal', Object.assign(detail, { by: 'will' }));
    const da = Math.abs(ba.diff), db = Math.abs(bb.diff);
    if (da !== db) throw new GameEnd(da > db ? 0 : 1, 'juicioFinal', Object.assign(detail, { by: 'balanza' }));
    throw new GameEnd(null, 'juicioFinal', Object.assign(detail, { by: 'tablas' }));
  }
}
