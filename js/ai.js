// SULPHUR — rival de práctica con tres niveles. Juega con las mismas reglas e información que tú
// (salvo que no mira tu mano). Fácil: juega sin plan y casi no responde. Normal: juega bien sus cartas.
// Difícil: calcula el combate contra tus bloqueos probables, busca letales, guarda respuestas y trucos.
import { isEnte } from './engine.js';
import { CARDS } from './data.js';

const wait = ms => new Promise(r => setTimeout(r, ms));
const LEVELS = { facil: 0, normal: 1, dificil: 2 };

export class RivalAI {
  constructor(level = 'normal', speed = 1) { this.level = typeof level === 'number' ? level : (LEVELS[level] ?? 1); this.speed = speed; }
  delay(ms) { return this.speed ? wait(ms * this.speed) : Promise.resolve(); }
  get easy() { return this.level === 0; } get hard() { return this.level === 2; }
  rnd() { return Math.random(); }

  // ───────── valoraciones ─────────
  value(g, e) {
    let v = g.force(e) * 1.6 + g.res(e) * 0.9;
    for (const k of g.kwList(e)) v += { vuelo: 1.8, primerGolpe: 1, guardian: 0.6, embestida: 0.3, asedio: 1.4, iraCiega: -0.3 }[k] || 0;
    if (e.def.apoyo || e.def.aura) v += 2;
    if (e.def.type === 'ilustre') v += 1.5;
    if (e.def.onAttack || e.def.onMove || e.def.onAllyDeath || e.def.ability) v += 1;
    return v;
  }
  defValue(d) { if (!d.f && d.f !== 0) return d.cost; return d.f * 1.6 + d.r * 0.9 + (d.kw || []).length + (d.onEnter ? 1.5 : 0); }
  incoming(g, pi) { return g.entes(1 - pi).filter(e => e.attacking).reduce((s, e) => s + (e.blockedBy || e.siege ? 0 : g.force(e)), 0); }
  potentialAttack(g, pi) { return g.P[1 - pi].van.filter(e => isEnte(e) && !g.noCombat(e)).reduce((s, e) => s + g.force(e), 0); }

  // ───────── robo y Almas ─────────
  async chooseDrawDeck(g, pi, reason) {
    const p = g.P[pi];
    if (reason === 'scry') return p.soulDeck.length && p.souls.length < 4 ? 'soul' : 'main';
    const soulsHand = p.hand.filter(c => c.soul).length;
    if (reason && reason.startsWith('inicial')) { await this.delay(80); return soulsHand < 3 ? 'soul' : 'main'; }
    await this.delay(300);
    if (this.easy) return this.rnd() < 0.35 ? 'soul' : 'main';
    const target = Math.min(g.round + (this.hard ? 3 : 2), this.hard ? 9 : 8);
    const expensive = p.hand.filter(c => !c.soul && c.def.cost > g.energyAvail(pi)).length;
    if (soulsHand === 0 && p.souls.length < target) return 'soul';
    if (this.hard && soulsHand === 0 && expensive >= 2 && p.souls.length < 10) return 'soul';
    return 'main';
  }
  missingPips(g, pi) {
    const p = g.P[pi]; const have = g.symbols(pi); const miss = {};
    for (const c of p.hand) {
      if (c.soul) continue; const req = {}; for (const k of c.def.req || []) req[k] = (req[k] || 0) + 1;
      for (const [k, n] of Object.entries(req)) if (have[k] < n) miss[k] = Math.max(miss[k] || 0, n - have[k]);
    }
    return miss;
  }
  condemnValue(g, pi, s) {
    const spec = s.def.condemn; let v = 0; const opp = 1 - pi;
    for (const op of spec.fx) {
      if (op.op === 'damage') { const kill = g.entes(opp).filter(e => g.res(e) - e.damage <= op.n); v += kill.length ? 2 + Math.max(...kill.map(e => this.value(g, e))) * 0.3 : 0.3; }
      else if (op.op === 'loseWillOpp') v += g.P[opp].will <= 6 ? 3 : 1.2;
      else if (op.op === 'draw') v += 1.6;
      else if (op.op === 'gainWill') v += g.P[pi].will <= 10 ? 1.8 : 0.8;
      else if (op.op === 'gainGold') v += 1.2;
      else if (op.op === 'mill') v += 0.8;
      else if (op.op === 'tap') v += g.entes(opp).some(e => !e.tapped && g.rowOf(e) === 'van') ? 1.3 : 0.2;
      else v += 0.8;
    }
    if (spec.target && !g.targets(pi, spec.target, false).length) v = 0;
    return v;
  }
  async chooseSoulMode(g, pi, s) {
    await this.delay(450);
    const p = g.P[pi]; const b = g.balance(pi);
    if (this.easy) return this.rnd() < 0.5 ? 'absolve' : 'condemn';
    const miss = this.missingPips(g, pi);
    if (s.def.senda && miss[s.def.senda]) return 'absolve';
    // Camino al Destino: si ya se inclina, empuja hacia ese lado
    if (!p.destiny && b.diff >= 3) return 'absolve';
    if (!p.destiny && b.diff <= -3 && this.condemnValue(g, pi, s) > 0.3) return 'condemn';
    if (p.destiny === 'redencion') return 'absolve';
    if (p.destiny === 'caida') return 'condemn';
    const cv = this.condemnValue(g, pi, s);
    const graceValue = 1 + (p.will <= 10 ? 1 : 0) + (s.def.senda ? 0.6 : 0);
    const bias = p.pilgrim.style === 'agresivo' ? 0.5 : p.pilgrim.style === 'control' ? -0.4 : 0;
    return cv + bias > graceValue ? 'condemn' : 'absolve';
  }

  // ───────── objetivos ─────────
  async chooseTarget(g, pi, cands, prompt, cancellable, spec) {
    await this.delay(300);
    return this.pickTarget(g, pi, cands, spec || {});
  }
  pickTarget(g, pi, cands, spec) {
    if (!cands.length) return null;
    if (cands[0].kind === 'chain') return cands[cands.length - 1];
    if (cands[0].kind === 'soul') {
      const b = g.balance(pi); const wantFace = b.diff >= 0;
      const s = cands.map(c => g.find(c.uid)).find(s => s.faceDown === wantFace) || g.find(cands[0].uid);
      return { kind: 'soul', uid: s.uid };
    }
    const ops = (spec.fx || []).map(o => o.op);
    const cards = cands.filter(c => c.kind === 'card').map(c => ({ c, e: g.find(c.uid) })).filter(x => x.e);
    const mine = cards.filter(x => x.e.ctrl === pi), theirs = cards.filter(x => x.e.ctrl !== pi);
    const byVal = (a, b) => this.value(g, b.e) - this.value(g, a.e);
    if (ops.includes('shift')) {
      const atk = theirs.filter(x => x.e.attacking); if (atk.length) return atk.sort(byVal)[0].c;
      const sup = mine.filter(x => x.e.def.apoyo && g.rowOf(x.e) === 'van'); if (sup.length) return sup[0].c;
      const blk = theirs.filter(x => g.rowOf(x.e) === 'van' && !x.e.tapped); if (blk.length) return blk.sort(byVal)[0].c;
      return (theirs[0] || cards[0]).c;
    }
    const harm = spec.harm !== undefined ? spec.harm : !ops.some(o => ['buff', 'grow', 'protect', 'sacrifice'].includes(o));
    if (harm && theirs.length) {
      const dmg = (spec.fx || []).find(o => o.op === 'damage');
      let pool = theirs;
      if (dmg) { const kill = theirs.filter(x => g.res(x.e) - x.e.damage <= dmg.n); if (kill.length) pool = kill; }
      if (ops.includes('tap')) { const up = theirs.filter(x => !x.e.tapped); if (up.length) pool = up; }
      return pool.sort(byVal)[0].c;
    }
    if (!harm && mine.length) {
      if (ops.includes('sacrifice')) return mine.sort((a, b) => this.value(g, a.e) - this.value(g, b.e))[0].c;
      const busy = mine.filter(x => x.e.attacking || x.e.blocking); const pool = busy.length ? busy : mine;
      return pool.sort(byVal)[0].c;
    }
    return cands[0];
  }
  async chooseLujuria(g, pi, cands) {
    await this.delay(350);
    const es = cands.map(c => g.find(c.uid));
    const move = es.find(e => e.def.onMove) || es.find(e => e.def.apoyo && g.rowOf(e) === 'van') || es.filter(e => g.rowOf(e) === 'van').sort((a, b) => g.force(a) - g.force(b))[0];
    return (move || es[0]).uid;
  }
  async chooseDiscard(g, pi, n) {
    await this.delay(250);
    const p = g.P[pi]; const sorted = [...p.hand].sort((a, b) => this.cardValue(g, pi, a) - this.cardValue(g, pi, b));
    return sorted.slice(0, n).map(c => c.uid);
  }
  cardValue(g, pi, c) {
    const p = g.P[pi];
    if (c.soul) return p.hand.filter(x => x.soul).length > 2 || p.souls.length >= 8 ? 0 : 6;
    return (c.def.cost || 0) + (c.def.type === 'ilustre' ? 3 : 0) + (g.meetsThreshold(pi, c.def) ? 2 : -1);
  }
  async chooseOrder(g, pi, cards) {
    await this.delay(250);
    const val = c => c.soul ? (g.P[pi].souls.length < 6 ? 6 : 1) : (isEnte(c) ? 5 : 3) + (g.meetsThreshold(pi, c.def) ? 2 : 0);
    return [...cards].sort((a, b) => val(b) - val(a));
  }
  async revealHand() { await this.delay(250); }
  async chooseSiegeTarget(g, pi, uid, cands) {
    await this.delay(250);
    const a = g.find(uid); const f = g.force(a);
    const rear = cands.filter(c => c.kind === 'card').map(c => ({ c, e: g.find(c.uid) }));
    const kill = rear.filter(x => g.res(x.e) - x.e.damage <= f).sort((x, y) => this.value(g, y.e) - this.value(g, x.e));
    if (this.easy) return cands[0];
    if (kill.length && (this.value(g, kill[0].e) >= 3 || g.P[1 - pi].will > 8)) return kill[0].c;
    return cands[0];
  }

  // ───────── combate ─────────
  // Predice los bloqueos del rival con la lógica normal de bloqueo.
  predictBlocks(g, D, attackers) {
    const cands = g.blockCandidates(D).map(e => e.uid);
    return this.blockPlan(g, D, attackers.map(e => e.uid), cands, 1);
  }
  outcome(g, A, attackers) {
    const D = 1 - A; const blocks = this.predictBlocks(g, D, attackers);
    let dmg = 0, gain = 0, loss = 0;
    for (const a of attackers) {
      const bu = blocks[a.uid];
      if (!bu) { if (a.siege) gain += 2; else dmg += g.force(a); continue; }
      const b = g.find(bu); const fa = g.force(a), fb = g.force(b);
      const aFirst = g.hasKw(a, 'primerGolpe'), bFirst = g.hasKw(b, 'primerGolpe');
      const bDies = fa >= g.res(b) - b.damage; const aDies = fb >= g.res(a) - a.damage && !(aFirst && !bFirst && bDies);
      if (bDies && !(bFirst && !aFirst && aDies)) gain += this.value(g, b);
      if (aDies) loss += this.value(g, a);
    }
    if (g.circle === 7) dmg += 1;
    return { dmg, gain, loss, score: dmg * (g.P[D].will <= 10 ? 1.6 : 1) + gain - loss };
  }
  async chooseAttackers(g, pi, cands, mandatory) {
    await this.delay(650);
    const opp = 1 - pi; const es = cands.map(u => g.find(u)); const out = new Set(mandatory);
    if (this.easy) { for (const e of es) if (this.rnd() < 0.55) out.add(e.uid); return [...out]; }
    const blockers = g.blockCandidates(opp); const oppWill = g.P[opp].will;
    if (!this.hard) {
      const total = es.reduce((s, e) => s + g.force(e), 0);
      const lethal = total >= oppWill && blockers.length === 0;
      for (const e of es) {
        if (out.has(e.uid)) continue;
        const f = g.force(e), r = g.res(e) - e.damage; const able = blockers.filter(b => g.canBlock(b, e));
        const killers = able.filter(b => g.force(b) >= r); const trades = able.filter(b => g.res(b) - b.damage <= f);
        if (lethal || !able.length || !killers.length || (trades.length >= killers.length && f >= 3) || g.P[pi].will > oppWill + 6) out.add(e.uid);
      }
      return [...out];
    }
    // Difícil: busca el mejor subconjunto frente a los bloqueos previstos
    let set = es.slice(); let best = this.outcome(g, pi, set);
    const unblock = es.filter(e => g.hasKw(e, 'vuelo') && !blockers.some(b => g.hasKw(b, 'vuelo'))).reduce((s, e) => s + g.force(e), 0);
    const allDmg = es.reduce((s, e) => s + g.force(e), 0);
    const chumps = blockers.length;
    const lethal = unblock >= oppWill || (allDmg - Math.max(0, chumps) * 0 >= oppWill && best.dmg >= oppWill);
    if (!lethal) {
      let improved = true;
      while (improved && set.length) {
        improved = false;
        for (const e of set) {
          if (out.has(e.uid) && mandatory.includes(e.uid)) continue;
          const s2 = set.filter(x => x !== e); const o2 = this.outcome(g, pi, s2);
          if (o2.score > best.score + 0.01) { set = s2; best = o2; improved = true; break; }
        }
      }
      // no te quedes sin defensas si el contraataque es letal
      const back = g.P[opp].van.filter(e => isEnte(e) && !g.noCombat(e)).reduce((s, e) => s + g.force(e), 0);
      const myWill = g.P[pi].will;
      if (back >= myWill - 1) {
        const keep = set.filter(e => !mandatory.includes(e.uid)).sort((a, b) => g.res(b) - g.res(a));
        while (keep.length && back >= myWill - 1 && set.length > 0) { const k = keep.shift(); set = set.filter(x => x !== k); if (set.length === 0) break; }
      }
    }
    for (const e of set) out.add(e.uid);
    return [...out];
  }
  blockPlan(g, pi, attackers, cands, level) {
    const res = {}; const used = new Set(); const will = g.P[pi].will;
    const atk = attackers.map(u => g.find(u)).filter(Boolean).sort((a, b) => g.force(b) - g.force(a));
    const incoming = atk.reduce((s, a) => s + (a.siege ? 0 : g.force(a)), 0);
    const danger = incoming >= will - (level >= 2 ? 3 : 2) || will <= 6;
    for (const a of atk) {
      const bl = cands.map(u => g.find(u)).filter(b => b && !used.has(b.uid) && g.canBlock(b, a));
      if (!bl.length) continue;
      const fa = g.force(a), ra = g.res(a) - a.damage;
      const aFirst = g.hasKw(a, 'primerGolpe');
      const good = bl.filter(b => g.force(b) >= ra && g.res(b) - b.damage > fa);
      const safe = bl.filter(b => g.res(b) - b.damage > fa && !(aFirst && false));
      const trade = bl.filter(b => g.force(b) >= ra && this.value(g, b) <= this.value(g, a) + 0.5 && !(aFirst && fa >= g.res(b) - b.damage));
      let pick = good[0] || safe[0] || (fa >= 3 ? trade[0] : null);
      if (!pick && a.siege) { const t = g.find(a.siege); if (t && this.value(g, t) >= 3) pick = bl.sort((x, y) => this.value(g, x) - this.value(g, y))[0]; }
      if (!pick && danger) pick = bl.sort((x, y) => this.value(g, x) - this.value(g, y))[0];
      if (pick) { res[a.uid] = pick.uid; used.add(pick.uid); }
    }
    return res;
  }
  async chooseBlocks(g, pi, attackers, cands) {
    await this.delay(700);
    if (this.easy) { const r = {}; const used = new Set(); for (const u of attackers) { const a = g.find(u); const b = cands.map(x => g.find(x)).find(b => !used.has(b.uid) && g.canBlock(b, a) && g.res(b) > g.force(a)); if (b) { r[u] = b.uid; used.add(b.uid); } } return r; }
    return this.blockPlan(g, pi, attackers, cands, this.level);
  }

  // ───────── acción con prioridad ─────────
  async chooseAction(g, pi, label) {
    await this.delay(g.chain.length ? 600 : 420);
    const p = g.P[pi], opp = 1 - pi;
    const J = p.hand.filter(c => !c.soul && c.def.type === 'juicio' && g.canCast(pi, c).ok);
    const jid = id => J.find(c => c.id === id);
    const cast = (c, targets) => ({ type: 'cast', uid: c.uid, targets });
    const card = e => [{ kind: 'card', uid: e.uid }];
    const respond = !this.easy || this.rnd() < 0.25;

    // 1) responder a la Cadena
    const top = g.chain[g.chain.length - 1];
    if (top && top.ctrl !== pi && respond) {
      const tgt = top.targets && top.targets[0] && top.targets[0].kind === 'card' ? g.find(top.targets[0].uid) : null;
      const hostileSpell = top.card && top.card.def.harm !== false && (top.card.def.type === 'juicio' || top.card.def.type === 'rito');
      const hitsMine = tgt && tgt.ctrl === pi;
      if (hitsMine && hostileSpell && top.card.def.type === 'juicio' && jid('impetu')) return cast(jid('impetu'), card(tgt));
      const counter = jid('promesa') || (top.kind === 'spell' && top.card.def.type === 'juicio' ? jid('engano') : null);
      const worth = (hitsMine && tgt && this.value(g, tgt) >= 4) || (top.card && top.card.def.cost >= 3) || (!this.hard && this.rnd() < 0.4);
      if (counter && worth && (counter.id !== 'engano' || (top.kind === 'spell' && top.card.def.type === 'juicio'))) return cast(counter, [{ kind: 'chain', id: top.id }]);
      if (hitsMine && top.card && top.card.def.fx && top.card.def.fx.some(o => o.op === 'damage' || o.op === 'destroy') && jid('lluvia') && tgt) return cast(jid('lluvia'), card(tgt));
      if (hitsMine && jid('hambre') && tgt && top.card && top.card.def.fx && top.card.def.fx.some(o => ['destroy', 'damage', 'bounce'].includes(o.op))) return cast(jid('hambre'), card(tgt));
    }
    if (g.chain.length) return { type: 'pass' };

    // 2) combate (defendiendo)
    if (g.active !== pi && (label === 'atacantes' || label === 'bloqueadores') && respond) {
      const att = g.entes(opp).filter(e => e.attacking).sort((a, b) => g.force(b) - g.force(a));
      const inc = this.incoming(g, pi);
      if (label === 'atacantes' && att.length) {
        if (inc >= p.will && jid('muralla')) return cast(jid('muralla'));
        if (inc >= Math.min(p.will, 6) && jid('ventisca')) return cast(jid('ventisca'));
        const big = att.find(e => g.targetable(e, pi, true));
        if (big && (g.force(big) >= 3 || inc >= p.will - 2)) {
          for (const id of ['lanza', 'silencio', 'soborno', 'desvio', 'vendaval']) { const c = jid(id); if (c && g.targetsFor(pi, c.def).some(t => t.uid === big.uid)) return cast(c, card(big)); }
        }
      }
      if (label === 'bloqueadores' && inc >= p.will && jid('muralla')) return cast(jid('muralla'));
    }
    // 3) trucos de combate (ambos lados)
    if (label === 'bloqueadores' && respond) {
      for (const e of g.entes(pi).filter(e => e.attacking || e.blocking)) {
        const other = e.attacking ? (e.blockedBy && g.find(e.blockedBy)) : g.find(e.blocking);
        if (!other) { if (e.attacking && !e.siege && jid('furia') && g.force(e) + 2 >= g.P[opp].will) return cast(jid('furia'), card(e)); continue; }
        const dies = g.force(other) >= g.res(e) - e.damage, kills = g.force(e) >= g.res(other) - other.damage;
        if (jid('rabia') && g.targetable(other, pi, true) && g.res(other) - other.damage <= 3 && (dies || this.value(g, other) >= 4)) return cast(jid('rabia'), card(other));
        if (dies && jid('lluvia') && g.force(other) < g.res(e) - e.damage + 3) return cast(jid('lluvia'), card(e));
        if (!kills && jid('furia') && g.force(e) + 2 >= g.res(other) - other.damage) return cast(jid('furia'), card(e));
        if (dies && jid('hambre')) return cast(jid('hambre'), card(e));
        const ab = g.abilities(pi).find(a => a.src === 'pilgrim');
        if (ab && p.pilgrim.ability.target === 'ownEnte' && !kills && g.force(e) + 1 >= g.res(other) - other.damage) return { type: 'ability', src: 'pilgrim', targets: card(e) };
        if (ab && p.pilgrim.ability.fx[0].op === 'damage' && g.res(other) - other.damage <= 1) return { type: 'ability', src: 'pilgrim', targets: card(other) };
      }
    }
    // 4) turno del rival: preparar / robar al final
    if (g.active !== pi) {
      if (!respond) return { type: 'pass' };
      if ((label === 'inicio' || label === 'main1') && jid('escarcha')) {
        const t = g.entes(opp).filter(e => g.rowOf(e) === 'van' && !e.tapped && g.targetable(e, pi, true)).sort((a, b) => g.force(b) - g.force(a))[0];
        if (t && g.force(t) >= 3) return cast(jid('escarcha'), card(t));
      }
      if (label === 'final') {
        if (this.hard && jid('lanza')) { const t = g.entes(opp).filter(e => g.targetable(e, pi, true) && g.force(e) <= 3).sort((a, b) => this.value(g, b) - this.value(g, a))[0]; if (t && this.value(g, t) >= 4) return cast(jid('lanza'), card(t)); }
        if (jid('extremos') && g.balance(opp).state !== 'tibio') return cast(jid('extremos'));
        if (jid('tibios') && g.balance(pi).state === 'tibio') return cast(jid('tibios'));
        if (jid('prevision')) return cast(jid('prevision'));
        if (jid('balanzaMercader')) return cast(jid('balanzaMercader'));
        const b = g.balance(pi);
        if (jid('contricion') && !p.destiny && Math.abs(b.diff) >= 3) { const s = p.souls.find(x => x.faceDown === (b.diff > 0)); if (s) return cast(jid('contricion'), [{ kind: 'soul', uid: s.uid }]); }
        const ab = g.abilities(pi).find(a => a.src === 'pilgrim');
        if (ab && !p.pilgrim.ability.target) return { type: 'ability', src: 'pilgrim' };
        if (ab && p.pilgrim.ability.target === 'ownEnte' && p.pilgrim.ability.fx[0].op === 'grow' && g.entes(pi).length) return { type: 'ability', src: 'pilgrim', targets: card(g.entes(pi).sort((a, b) => this.value(g, b) - this.value(g, a))[0]) };
      }
      return { type: 'pass' };
    }
    // 5) mi fase principal
    if (!g.isMainWindow(pi)) {
      if (label === 'fin de combate' || label === 'inicio') return { type: 'pass' };
      return { type: 'pass' };
    }
    if (this.easy && this.rnd() < 0.15) return { type: 'pass' };
    const soul = p.hand.find(c => c.soul);
    if (soul && g.canPlaySoul(pi, soul).ok) return { type: 'soul', uid: soul.uid };
    for (const e of g.entes(pi)) if ((e.def.apoyo || (e.def.aura && !e.def.f)) && g.rowOf(e) === 'van' && g.canMove(pi, e)) return { type: 'move', uid: e.uid };
    if (this.hard) for (const e of g.entes(pi)) if (e.def.onMove && g.canMove(pi, e) && g.freeSlots(pi, g.rowOf(e) === 'van' ? 'rear' : 'van').length && !(label === 'main1' && g.rowOf(e) === 'rear')) return { type: 'move', uid: e.uid };
    // habilidad del Peregrino en tu turno
    const ab = g.abilities(pi).find(a => a.src === 'pilgrim');
    if (ab && label === 'main1') {
      const op = p.pilgrim.ability.fx[0].op;
      if (op === 'damage') { const t = g.entes(opp).find(e => g.res(e) - e.damage <= 1); if (t) return { type: 'ability', src: 'pilgrim', targets: card(t) }; }
      if (op === 'tap' && this.level >= 1) { const t = g.entes(opp).filter(e => g.rowOf(e) === 'van' && !e.tapped).sort((a, b) => this.value(g, b) - this.value(g, a))[0]; if (t && g.energyAvail(pi) >= ab.cost + 2) return { type: 'ability', src: 'pilgrim', targets: card(t) }; }
    }
    const reserve = this.hard && p.hand.some(c => c.def.type === 'juicio' && ['lanza', 'silencio', 'rabia', 'lluvia', 'engano', 'promesa', 'muralla'].includes(c.id)) && g.P[opp].van.some(isEnte) ? 2 : 0;
    const castable = p.hand.filter(c => !c.soul && c.def.type !== 'juicio' && g.canCast(pi, c).ok)
      .map(c => ({ c, v: this.castScore(g, pi, c) })).filter(x => x.v > 0)
      .sort((a, b) => b.v - a.v || b.c.def.cost - a.c.def.cost);
    for (const { c } of castable) {
      if (reserve && g.energyAvail(pi) - g.cost(pi, c) < reserve && c.def.cost <= 3 && castable.length > 1) continue;
      const act = this.planCast(g, pi, c); if (act) return act;
    }
    if (ab && label === 'main2' && !p.pilgrim.ability.target && g.energyAvail(pi) >= ab.cost + reserve) return { type: 'ability', src: 'pilgrim' };
    if (ab && label === 'main2' && p.pilgrim.ability.fx[0].op === 'grow' && g.entes(pi).length && g.energyAvail(pi) >= ab.cost) return { type: 'ability', src: 'pilgrim', targets: card(g.entes(pi).sort((a, b) => this.value(g, b) - this.value(g, a))[0]) };
    if (label === 'main2' && g.circle === 4) {
      const untapped = p.souls.filter(s => !s.tapped);
      if (untapped.length > reserve && p.gold + p.pool < 3) return { type: 'tap', uid: untapped[0].uid };
    }
    return { type: 'pass' };
  }
  castScore(g, pi, c) {
    const d = c.def; const opp = 1 - pi;
    if (isEnte(c)) return this.defValue(d) + 1;
    if (d.type === 'reliquia') return 2.5;
    let v = 0;
    for (const op of d.fx || []) {
      if (op.if && !g.condOk(pi, { if: op.if })) continue;
      switch (op.op) {
        case 'draw': v += op.n * 1.4; break;
        case 'gainGold': v += 0.6; break;
        case 'damage': case 'destroy': case 'bounce': v += g.targetsFor(pi, d).some(t => g.find(t.uid) && g.find(t.uid).ctrl === opp) ? 4 : -5; break;
        case 'damageAll': { const k = g.P[opp].van.filter(e => isEnte(e) && g.res(e) - e.damage <= op.n); v += k.length >= 2 ? 3 + k.length : -5; break; }
        case 'bounceAll': { const k = g.P[opp].van.filter(e => isEnte(e) && e.def.cost <= op.maxCost); v += k.length >= 2 ? 3 + k.length : -5; break; }
        case 'tapAllEnemy': v += g.entes(opp).length >= 2 ? 5 : -5; break;
        case 'growAll': v += g.entes(pi).length >= 2 ? 2 + g.entes(pi).length : -5; break;
        case 'mill': v += op.who === 'self' ? 0.3 : 1 + (g.P[opp].main.length < 12 ? 3 : 0); break;
        case 'exhume': v += g.P[pi].olvido.some(isEnteLike) ? 3 : -5; break;
        case 'spendGoldDraw': v += g.P[pi].gold >= 2 ? g.P[pi].gold * 1.3 : -5; break;
        case 'sacrifice': { const cheap = g.entes(pi).filter(e => this.value(g, e) < 5); v += cheap.length && g.P[pi].hand.length <= 3 ? 1 : -6; break; }
        case 'descend': v += g.P[pi].will >= g.P[opp].will ? 1 : -2; break;
        default: v += 0.5;
      }
    }
    return v;
  }
  planCast(g, pi, c) {
    const d = c.def; const opp = 1 - pi;
    if (isEnte(c)) {
      const wantRear = !!d.apoyo || (d.kw || []).includes('guardian') && d.f <= 2 || (d.f <= 1 && !(d.kw || []).length);
      let row = wantRear ? 'rear' : 'van'; let f = g.freeSlots(pi, row);
      if (!f.length) { row = row === 'van' ? 'rear' : 'van'; f = g.freeSlots(pi, row); }
      if (!f.length) return null;
      const mid = row === 'van' ? [2, 1, 3, 0, 4] : [1, 0, 2]; const slot = mid.find(i => f.includes(i));
      return { type: 'cast', uid: c.uid, row, slot };
    }
    if (d.type === 'reliquia') {
      const opts = g.attachOptions(pi, c); if (!opts.length) return null;
      if (d.attach === 'anyEnte') { const t = g.entes(opp).sort((a, b) => this.value(g, b) - this.value(g, a))[0]; return t ? { type: 'cast', uid: c.uid, attach: { kind: 'card', uid: t.uid } } : null; }
      if (d.attach === 'ownEnte') { const t = g.entes(pi).filter(e => g.rowOf(e) === 'van').sort((a, b) => this.value(g, b) - this.value(g, a))[0]; return t ? { type: 'cast', uid: c.uid, attach: { kind: 'card', uid: t.uid } } : null; }
      return { type: 'cast', uid: c.uid, attach: opts[0] };
    }
    if (d.target) {
      const cands = g.targetsFor(pi, d); const t = this.pickTarget(g, pi, cands, d); if (!t) return null;
      if (d.harm !== false && t.kind === 'card' && g.find(t.uid).ctrl === pi && !d.fx.some(o => o.op === 'sacrifice')) return null;
      return { type: 'cast', uid: c.uid, targets: [t] };
    }
    return { type: 'cast', uid: c.uid };
  }
}
const isEnteLike = c => c && c.def && (c.def.type === 'ente' || c.def.type === 'ilustre');
