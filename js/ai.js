// SULPHUR — rival de práctica. Juega con las mismas reglas y la misma información que tú.
import { isEnte } from './engine.js';

const wait = ms => new Promise(r => setTimeout(r, ms));

export class RivalAI {
  constructor(speed = 1) { this.speed = speed; }
  delay(ms) { return wait(ms * this.speed); }

  async chooseDrawDeck(g, pi, reason) {
    const p = g.P[pi];
    if (reason === 'scry') return 'main';
    const soulsHand = p.hand.filter(c => c.soul).length;
    if (reason && reason.startsWith('inicial')) { await this.delay(90); return soulsHand < 3 ? 'soul' : 'main'; }
    await this.delay(300);
    const target = Math.min(g.round + 2, 8);
    if (soulsHand === 0 && p.souls.length < target) return 'soul';
    return 'main';
  }

  async chooseSoulMode(g, pi, s) {
    await this.delay(500);
    const p = g.P[pi]; const b = g.balance(pi); const have = g.symbols(pi);
    // ¿Me falta el símbolo de esta Alma para cartas de la mano?
    let needs = false;
    if (s.def.senda) for (const c of p.hand) {
      if (c.soul) continue; const req = {}; for (const k of c.def.req || []) req[k] = (req[k] || 0) + 1;
      if (req[s.def.senda] && have[s.def.senda] < req[s.def.senda]) needs = true;
    }
    if (p.destiny === 'redencion' || b.diff >= 3) return 'absolve';
    if (p.destiny === 'caida' || b.diff <= -3) return 'condemn';
    if (needs) return 'absolve';
    const spec = s.def.condemn; const hasTarget = !spec.target || g.targets(pi, spec.target, false).length;
    const aggressive = p.pid === 'francesca';
    if (!hasTarget) return 'absolve';
    if (spec.fx.some(o => o.op === 'damage') && g.entes(1 - pi).some(e => g.res(e) - e.damage <= 1)) return 'condemn';
    return Math.random() < (aggressive ? 0.55 : 0.3) ? 'condemn' : 'absolve';
  }

  score(g, pi, e) { return g.force(e) * 2 + g.res(e) + (e.def.type === 'ilustre' ? 2 : 0); }

  async chooseTarget(g, pi, cands, prompt, cancellable, spec) {
    await this.delay(350);
    const harm = spec && spec.harm !== undefined ? spec.harm : true;
    const cards = cands.filter(c => c.kind === 'card').map(c => ({ c, e: g.find(c.uid) })).filter(x => x.e);
    if (cands[0] && cands[0].kind === 'chain') return cands[cands.length - 1];
    if (cands[0] && cands[0].kind === 'soul') {
      const b = g.balance(pi); const wantFace = b.diff >= 0; // voltear hacia el lado dominante
      const s = cands.map(c => g.find(c.uid)).find(s => s.faceDown === wantFace) || g.find(cands[0].uid);
      return { kind: 'soul', uid: s.uid };
    }
    const mine = cards.filter(x => x.e.ctrl === pi), theirs = cards.filter(x => x.e.ctrl !== pi);
    const dmg = spec && spec.fx && spec.fx.find(o => o.op === 'damage');
    if (harm && theirs.length) {
      let pool = theirs;
      if (dmg) { const kill = theirs.filter(x => g.res(x.e) - x.e.damage <= dmg.n); if (kill.length) pool = kill; }
      pool.sort((a, b) => this.score(g, pi, b.e) - this.score(g, pi, a.e));
      return pool[0].c;
    }
    if (!harm && mine.length) {
      if (spec && spec.fx && spec.fx.some(o => o.op === 'sacrifice')) { mine.sort((a, b) => this.score(g, pi, a.e) - this.score(g, pi, b.e)); return mine[0].c; }
      const att = mine.filter(x => x.e.attacking || x.e.blocking); const pool = att.length ? att : mine;
      pool.sort((a, b) => this.score(g, pi, b.e) - this.score(g, pi, a.e)); return pool[0].c;
    }
    return cands[0];
  }

  async chooseLujuria(g, pi, cands) {
    await this.delay(400);
    const es = cands.map(c => g.find(c.uid));
    const sup = es.find(e => e.def.apoyo && g.rowOf(e) === 'van');
    if (sup) return sup.uid;
    const weakVan = es.filter(e => g.rowOf(e) === 'van').sort((a, b) => g.force(a) - g.force(b))[0];
    return (weakVan || es[0]).uid;
  }

  async chooseDiscard(g, pi, n) {
    await this.delay(300);
    const p = g.P[pi];
    const sorted = [...p.hand].sort((a, b) => this.cardValue(g, pi, a) - this.cardValue(g, pi, b));
    return sorted.slice(0, n).map(c => c.uid);
  }
  cardValue(g, pi, c) {
    const p = g.P[pi];
    if (c.soul) return p.hand.filter(x => x.soul).length > 2 ? 0 : 5;
    return (c.def.cost || 0) + (c.def.type === 'ilustre' ? 3 : 0) + (g.meetsThreshold(pi, c.def) ? 2 : 0);
  }
  async chooseOrder(g, pi, cards) {
    await this.delay(300);
    const val = c => c.soul ? (g.P[pi].souls.length < 6 ? 6 : 1) : (isEnte(c) ? 5 : 3) + (g.meetsThreshold(pi, c.def) ? 2 : 0);
    return [...cards].sort((a, b) => val(b) - val(a));
  }
  async revealHand(g, other) { await this.delay(300); }

  async chooseAttackers(g, pi, cands, mandatory) {
    await this.delay(700);
    const opp = 1 - pi; const blockers = g.blockCandidates(opp); const oppWill = g.P[opp].will;
    const out = [...mandatory];
    const total = cands.map(u => g.find(u)).reduce((s, e) => s + g.force(e), 0);
    const lethal = total >= oppWill && blockers.length === 0;
    for (const uid of cands) {
      if (out.includes(uid)) continue;
      const e = g.find(uid); const f = g.force(e), r = g.res(e) - e.damage;
      const able = blockers.filter(b => g.canBlock(b, e));
      const killers = able.filter(b => g.force(b) >= r);
      const trades = able.filter(b => g.res(b) - b.damage <= f);
      if (lethal || !able.length || !killers.length || (trades.length >= killers.length && f >= 3) || g.P[pi].will > oppWill + 6) out.push(uid);
    }
    return out;
  }

  async chooseBlocks(g, pi, attackers, cands) {
    await this.delay(800);
    const res = {}; const used = new Set(); const will = g.P[pi].will;
    const atk = attackers.map(u => g.find(u)).sort((a, b) => g.force(b) - g.force(a));
    const incoming = atk.reduce((s, a) => s + g.force(a), 0);
    for (const a of atk) {
      const bl = cands.map(u => g.find(u)).filter(b => !used.has(b.uid) && g.canBlock(b, a));
      if (!bl.length) continue;
      const fa = g.force(a), ra = g.res(a) - a.damage;
      const good = bl.filter(b => g.force(b) >= ra && g.res(b) - b.damage > fa);
      const safe = bl.filter(b => g.res(b) - b.damage > fa);
      const trade = bl.filter(b => g.force(b) >= ra);
      let pick = good[0] || safe[0] || (fa >= 3 ? trade[0] : null);
      if (!pick && (incoming >= will - 2 || will <= 6)) pick = bl.sort((x, y) => this.score(g, pi, x) - this.score(g, pi, y))[0];
      if (pick) { res[a.uid] = pick.uid; used.add(pick.uid); }
    }
    return res;
  }

  // ───────── acción con prioridad ─────────
  async chooseAction(g, pi, label) {
    const p = g.P[pi]; const opp = 1 - pi;
    await this.delay(g.chain.length ? 650 : 450);
    const juicios = p.hand.filter(c => !c.soul && c.def.type === 'juicio' && g.canCast(pi, c).ok);
    const J = id => juicios.find(c => c.id === id);
    // 1) responder a la Cadena
    const top = g.chain[g.chain.length - 1];
    if (top && top.ctrl !== pi) {
      const tgt = top.targets && top.targets[0] && top.targets[0].kind === 'card' ? g.find(top.targets[0].uid) : null;
      const hostile = top.card && top.card.def.type === 'juicio' && tgt && tgt.ctrl === pi && top.card.def.harm !== false;
      if (hostile && J('impetu')) return { type: 'cast', uid: J('impetu').uid, targets: [{ kind: 'card', uid: tgt.uid }] };
      if (top.card && top.card.def.type === 'juicio' && J('engano') && (hostile || Math.random() < 0.5)) return { type: 'cast', uid: J('engano').uid, targets: [{ kind: 'chain', id: top.id }] };
    }
    if (g.chain.length) return { type: 'pass' };
    // 2) ventanas de combate
    if (label === 'atacantes' && g.active !== pi) {
      const att = g.entes(opp).filter(e => e.attacking).sort((a, b) => g.force(b) - g.force(a));
      const s = J('silencio'); if (s && att.length && (g.force(att[0]) >= 3 || g.force(att[0]) >= p.will - 3)) {
        const t = att.find(e => g.targetable(e, pi, true)); if (t) return { type: 'cast', uid: s.uid, targets: [{ kind: 'card', uid: t.uid }] };
      }
    }
    if (label === 'bloqueadores') {
      const mine = g.entes(pi).filter(e => e.attacking || e.blocking);
      for (const e of mine) {
        const other = e.attacking ? (e.blockedBy && g.find(e.blockedBy)) : g.find(e.blocking);
        if (!other) {
          if (e.attacking && J('furia') && g.force(e) + 2 >= g.P[opp].will) return { type: 'cast', uid: J('furia').uid, targets: [{ kind: 'card', uid: e.uid }] };
          continue;
        }
        const dies = g.force(other) >= g.res(e) - e.damage; const kills = g.force(e) >= g.res(other) - other.damage;
        if (dies && J('lluvia') && g.force(other) < g.res(e) - e.damage + 3) return { type: 'cast', uid: J('lluvia').uid, targets: [{ kind: 'card', uid: e.uid }] };
        if (!kills && J('furia') && g.force(e) + 2 >= g.res(other) - other.damage) return { type: 'cast', uid: J('furia').uid, targets: [{ kind: 'card', uid: e.uid }] };
        if (!kills && p.pilgrim.ability && !p.abilityUsed && p.pilgrim.ability.target === 'ownEnte' && g.abilities(pi).some(a => a.src === 'pilgrim') && g.force(e) + 1 >= g.res(other) - other.damage)
          return { type: 'ability', src: 'pilgrim', targets: [{ kind: 'card', uid: e.uid }] };
      }
    }
    // 3) turno del rival: congelar antes de su combate, robar al final
    if (g.active !== pi) {
      if ((label === 'inicio' || label === 'main1') && J('escarcha')) {
        const t = g.entes(opp).filter(e => g.rowOf(e) === 'van' && !e.tapped && g.targetable(e, pi, true)).sort((a, b) => g.force(b) - g.force(a))[0];
        if (t && g.force(t) >= 3) return { type: 'cast', uid: J('escarcha').uid, targets: [{ kind: 'card', uid: t.uid }] };
      }
      if (label === 'final') {
        if (J('extremos') && g.balance(opp).state !== 'tibio') return { type: 'cast', uid: J('extremos').uid };
        if (J('prevision')) return { type: 'cast', uid: J('prevision').uid };
        const b = g.balance(pi);
        if (J('contricion') && !p.destiny && Math.abs(b.diff) >= 3) {
          const s = p.souls.find(x => x.faceDown === (b.diff > 0)); if (s) return { type: 'cast', uid: J('contricion').uid, targets: [{ kind: 'soul', uid: s.uid }] };
        }
        if (p.pilgrim.ability && p.pilgrim.ability.fx[0].op === 'scry' && g.abilities(pi).some(a => a.src === 'pilgrim')) return { type: 'ability', src: 'pilgrim' };
      }
      return { type: 'pass' };
    }
    // 4) mi fase principal
    if (!g.isMainWindow(pi)) return { type: 'pass' };
    const soul = p.hand.find(c => c.soul);
    if (soul && g.canPlaySoul(pi, soul).ok) return { type: 'soul', uid: soul.uid };
    // mover Apoyo a Retaguardia
    for (const e of g.entes(pi)) if (e.def.apoyo && g.rowOf(e) === 'van' && g.canMove(pi, e)) return { type: 'move', uid: e.uid };
    const castable = p.hand.filter(c => !c.soul && c.def.type !== 'juicio' && g.canCast(pi, c).ok).sort((a, b) => b.def.cost - a.def.cost);
    for (const c of castable) {
      const act = this.planCast(g, pi, c);
      if (act) return act;
    }
    if (label === 'main2' && g.circle === 4) {
      const reserve = p.hand.some(c => c.def.type === 'juicio') ? 2 : 0;
      const untapped = p.souls.filter(s => !s.tapped);
      if (untapped.length > reserve && p.gold + p.pool < 3) return { type: 'tap', uid: untapped[0].uid };
    }
    return { type: 'pass' };
  }

  planCast(g, pi, c) {
    const d = c.def; const opp = 1 - pi;
    if (isEnte(c)) {
      const wantRear = !!d.apoyo || (d.f <= 1 && !d.kw);
      let row = wantRear ? 'rear' : 'van'; let f = g.freeSlots(pi, row);
      if (!f.length) { row = row === 'van' ? 'rear' : 'van'; f = g.freeSlots(pi, row); }
      if (!f.length) return null;
      const mid = row === 'van' ? [2, 1, 3, 0, 4] : [1, 0, 2]; const slot = mid.find(i => f.includes(i));
      return { type: 'cast', uid: c.uid, row, slot };
    }
    if (d.type === 'reliquia') {
      const opts = g.attachOptions(pi, c); if (!opts.length) return null;
      if (d.attach === 'anyEnte') { const t = g.entes(opp).sort((a, b) => this.score(g, pi, b) - this.score(g, pi, a))[0]; return t ? { type: 'cast', uid: c.uid, attach: { kind: 'card', uid: t.uid } } : null; }
      if (d.attach === 'ownEnte') { const t = g.entes(pi).filter(e => g.rowOf(e) === 'van').sort((a, b) => this.score(g, pi, b) - this.score(g, pi, a))[0]; return t ? { type: 'cast', uid: c.uid, attach: { kind: 'card', uid: t.uid } } : null; }
      return { type: 'cast', uid: c.uid, attach: opts[0] };
    }
    // Ritos
    const enemies = g.entes(opp).sort((a, b) => this.score(g, pi, b) - this.score(g, pi, a));
    switch (c.id) {
      case 'hoguera': { const t = enemies.find(e => g.res(e) - e.damage <= 3); return t ? { type: 'cast', uid: c.uid, targets: [{ kind: 'card', uid: t.uid }] } : null; }
      case 'espejismo': { const t = enemies.find(e => e.def.cost >= 3); return t ? { type: 'cast', uid: c.uid, targets: [{ kind: 'card', uid: t.uid }] } : null; }
      case 'cocito': return enemies.length >= 2 ? { type: 'cast', uid: c.uid } : null;
      case 'festin': { const t = g.entes(pi).find(e => e.id === 'larva' || e.id === 'traidor'); return t && g.P[pi].hand.length <= 3 ? { type: 'cast', uid: c.uid, targets: [{ kind: 'card', uid: t.uid }] } : null; }
      case 'descensoForzado': return g.P[pi].will >= g.P[opp].will ? { type: 'cast', uid: c.uid } : null;
      default: return d.target ? null : { type: 'cast', uid: c.uid };
    }
  }
}
