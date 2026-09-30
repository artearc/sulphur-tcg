// SULPHUR — Aprender a jugar: lecciones guiadas con escenario preparado, narrador, foco y acciones restringidas.
import { RivalAI } from './ai.js';

const byId = (g, pi, id) => {
  const p = g.P[pi];
  for (const arr of [p.hand, p.souls, p.van, p.rear, p.olvido]) { const c = arr.find(x => x && x.id === id); if (c) return c; }
  for (const it of g.chain) if (it.card && it.card.id === id) return it.card;
  return null;
};
export const cardRef = (id, pi = 0) => g => { const c = byId(g, pi, id); return c ? { kind: 'card', uid: c.uid } : null; };
const isCast = (a, g, id) => a.type === 'cast' && g.find(a.uid) && g.find(a.uid).id === id;
const isSoul = (a, g, id) => a.type === 'soul' && g.find(a.uid) && g.find(a.uid).id === id;

// ───────────────────────── lecciones ─────────────────────────
export const LESSONS = [
  {
    id: 'almas', title: 'Tu Peregrino y las Almas', sub: 'Absolver, umbral, energía y tu primer Ente',
    learn: ['El Peregrino: Voluntad 20 y Sendas', 'Jugar un Alma y absolverla', 'Umbral (no se gasta) y energía (se gasta)', 'Jugar un Ente: pasa por la Cadena', 'Limbo: el Círculo sin ataques'],
    setup: {
      circle: 1, round: 0, first: 0, active: 0,
      players: [
        { hand: ['argenti', 'ciacco', 'diablillo', 'larva', 'hoguera'], main: ['tamborilero', 'guerrero', 'furia', 'gloton', 'espada', 'iracundo'], soulDeck: ['estigia', 'lluviaAlma', 'argenti', 'ciacco', 'paolo'] },
        { hand: ['traidor', 'centinela', 'poeta', 'bocca', 'guido'], main: ['espectro', 'falsificador', 'prevision', 'traidor'], soulDeck: ['limbo', 'bocca', 'guido'] },
      ],
    },
    ai: { passAll: true },
    steps: [
      { say: 'Bienvenida al <b>Infierno</b>. Soy la voz de este libro y te guiaré en tu primer descenso. Este retablo es tu <b>Peregrino</b>: Francesca. Es tu líder y tu identidad; no ataca ni bloquea.', focus: { kind: 'pilgrim', player: 0 } },
      { say: 'El dado negro sobre el retablo es tu <b>Voluntad</b>: empiezas con <b>20</b>. Si llega a 0, pierdes. El rival, arriba, tiene la suya.', focus: { kind: 'will', player: 0 } },
      { say: 'Francesca pertenece a dos <b>Sendas</b>: <b>Ira</b> 🔥 y <b>Gula</b> 👄. Tu mazo solo puede llevar cartas de esas Sendas o neutrales. Además, sus símbolos cuentan siempre en tu <b>umbral</b>.', focus: { dom: '#hud0 .umbral' } },
      { say: 'Esta es tu mano. Las cartas con <b>dorso claro</b> vienen del Mazo de Almas: son tu recurso. Cada turno puedes jugar <b>una</b> Alma.', focus: { dom: '#handTab' } },
      { say: '<b>Arrastra a Filippo Argenti</b> (un Alma de Ira) hasta tu fila de Almas, o haz clic en ella.', focus: cardRef('argenti'), action: true,
        ok: { action: (a, g) => isSoul(a, g, 'argenti'), soulMode: 'absolve' }, until: (e, d) => e === 'soul' && d.pi === 0 },
      { say: 'La has <b>absuelto</b>: queda boca arriba y su símbolo 🔥 se suma a tu umbral. Mira la <b>Balanza</b>: el platillo dorado ha ganado peso hacia la <b>Virtud</b>.', focus: { kind: 'balance', player: 0 } },
      { say: 'Cada Alma se <b>agota</b> (gira 90°) para dar <b>1 de energía</b>. La energía se gasta; el umbral no. Ahora tienes 1 Alma: 1 de energía disponible.', focus: { dom: '#hud0 .energy' } },
      { say: 'El <b>Diablillo de Dite</b> cuesta <b>1</b> de energía y exige <b>🔥</b> en tu umbral (arriba a la izquierda de la carta). Lo cumples. <b>Arrástralo a tu Vanguardia</b>.', focus: cardRef('diablillo'), action: true,
        ok: { action: (a, g) => isCast(a, g, 'diablillo'), pick: r => r.kind !== 'slot' || r.row === 'van' }, until: (e, d) => e === 'cast' && d.pi === 0 },
      { say: 'Todo lo que juegas entra primero en la <b>Cadena</b> (a la derecha). El rival recibe la prioridad y podría responder antes de que se resuelva.', focus: { kind: 'chainArea' } },
      { waitFor: (e, d) => e === 'resolve' && d.id === 'diablillo', say: 'Nadie responde: el Diablillo <b>entra en juego</b> en tu Vanguardia. El reloj de arena indica que acaba de llegar y no puede atacar este turno.', focus: cardRef('diablillo') },
      { say: 'A la izquierda está el <b>Descenso</b>: los 9 Círculos. El d10 marca el <b>Círculo I, Limbo</b>: aquí los Entes no pueden atacar. Es la ronda de despliegue.', focus: { kind: 'descenso', circle: 1 } },
      { say: 'Pulsa el botón <b>Pasar</b> para terminar tu fase principal. Como es Limbo, no habrá combate.', focus: { dom: '#btnPrimary' }, action: true,
        ok: { action: a => a.type === 'pass' }, until: (e, d) => e === 'phase' && d.phase === 'main2' },
      { end: true, say: 'Has jugado tu primera Alma y tu primer Ente. Recuerda: <b>umbral</b> = símbolos que tienes (no se gastan); <b>energía</b> = Almas que agotas (se gasta).' },
    ],
  },
  {
    id: 'balanza', title: 'Condenar y la Balanza', sub: 'Poder inmediato a cambio de Corrupción',
    learn: ['Robar eligiendo mazo', 'Condenar un Alma: su Condena se resuelve ya', 'Virtuoso, Tibio y Corrupto', 'Halo y cuernos en las cartas', 'Destino: Redención o Caída'],
    setup: {
      circle: 3, round: 3, first: 1, active: 0, turnOf: [2, 3],
      players: [
        { hand: ['estigia', 'gloton', 'condenado'], souls: [{ id: 'argenti' }, { id: 'ciacco' }, { id: 'lluviaAlma' }],
          main: ['tamborilero', 'furia', 'larva', 'espada'], soulDeck: ['paolo', 'argenti', 'ciacco'] },
        { will: 20, van: [null, null, 'traidor'], souls: [{ id: 'bocca' }, { id: 'guido', down: true }, { id: 'limbo' }], hand: ['poeta', 'centinela'], main: ['espectro', 'prevision'], soulDeck: ['limbo'] },
      ],
    },
    ai: { passAll: true },
    steps: [
      { say: 'Ahora juegas <b>segunda</b> en la ronda, así que empiezas robando. Estamos en el <b>Círculo III, Gula</b>: cada jugador roba <b>1 carta adicional</b>.', focus: { kind: 'descenso', circle: 3 } },
      { say: 'Cada vez que robas eliges mazo: <b>Principal</b> (dorso negro) o <b>de Almas</b> (dorso claro). <b>Roba dos veces</b>, del mazo que quieras.', focus: { kind: 'deck', player: 0, which: 'main' }, action: true, until: (e, d, g, s) => e === 'draw' && d.pi === 0 && (s.n = (s.n || 0) + 1) >= 2 },
      { say: 'Tienes <b>3 Almas absueltas y 0 condenadas</b>: 3 de ventaja hacia la Virtud. Eres <b>Virtuoso</b>: un halo dorado corona tu Balanza.', focus: { kind: 'balance', player: 0 } },
      { say: 'El <b>Glotón bajo la lluvia</b> tiene un <b>halo</b>: «Virtuoso: +1/+1». Esas habilidades solo despiertan si eres Virtuoso. Las de <b>cuernos</b>, si eres Corrupto.', focus: cardRef('gloton') },
      { say: 'Ahora la otra cara del dilema. Juega el <b>Alma de la Estigia</b> y esta vez <b>CONDÉNALA</b>.', focus: cardRef('estigia'), action: true,
        ok: { action: (a, g) => isSoul(a, g, 'estigia'), soulMode: 'condemn' }, until: (e, d) => e === 'soul' && d.pi === 0 },
      { say: 'Al condenarla se resuelve su <b>Condena</b> al instante: el Peregrino rival <b>pierde 1 de Voluntad</b>. El Alma queda <b>boca abajo</b> y no aporta Senda.', focus: { kind: 'will', player: 1 } },
      { say: '3 absueltas y 1 condenada: ventaja <b>2</b>. Vuelves a ser <b>Tibio</b> y el halo se apaga. Condenar da poder ahora, pero cambia tu camino.', focus: { kind: 'balance', player: 0 } },
      { say: 'Con <b>5 de ventaja</b> alcanzas tu <b>Destino</b>: Redención (izquierda del retablo) o Caída (derecha), <b>para siempre</b>. El primero que alcances sella el otro.', focus: { kind: 'pilgrim', player: 0 } },
      { say: 'Los extremos dan poder y te exponen: hay Juicios que castigan al Virtuoso y al Corrupto. El <b>Tibio</b> está a salvo, pero <b>pierde los empates</b> del Juicio Final.', focus: { kind: 'balance', player: 0 } },
      { end: true, say: 'Cada Alma es un dilema: <b>absolver</b> = color y Virtud a largo plazo; <b>condenar</b> = efecto inmediato y Corrupción.' },
    ],
  },
  {
    id: 'combate', title: 'Combate y la Cadena', sub: 'El turno de ejemplo del Núcleo de reglas, jugado',
    learn: ['El Descenso avanza al empezar la ronda', 'Fuerza: base + Círculo + Apoyo + efectos', 'Declarar atacantes y bloqueadores', 'Responder en la Cadena y anular un Juicio', 'Disparadores «al morir»'],
    setup: {
      circle: 4, round: 4, first: 0, active: 0, turnOf: [4, 4],
      players: [
        { will: 14, hand: ['paolo', 'cerbero', 'impetu'], van: [null, null, 'diablillo'], rear: [null, 'tamborilero'],
          souls: [{ id: 'argenti' }, { id: 'ciacco' }, { id: 'lluviaAlma' }, { id: 'estigia', down: true }, { id: 'argenti', down: true }],
          main: ['espada', 'larva', 'furia'], soulDeck: ['ciacco'] },
        { will: 17, van: [null, null, 'centinela'], hand: ['silencio', 'prevision', 'traidor', 'poeta', 'centinela'],
          souls: [{ id: 'bocca' }, { id: 'cocitoAlma' }, { id: 'guido' }, { id: 'falsaria' }, { id: 'limbo', down: true }],
          main: ['congelado', 'espectro', 'falsificador', 'traidor'], soulDeck: ['bocca'] },
      ],
    },
    ai: { script: 'ejemplo' },
    steps: [
      { waitFor: e => e === 'circle', say: 'Ronda 5. Eres la jugadora inicial, así que al empezar tu turno <b>el Descenso avanza</b>: Círculo <b>V, Ira</b>. Los Entes en Vanguardia tienen <b>+1 de Fuerza</b>.', focus: { kind: 'descenso', circle: 5 } },
      { say: 'Roba del <b>Mazo Principal</b>.', focus: { kind: 'deck', player: 0, which: 'main' }, action: true, ok: { draw: 'main' }, until: (e, d) => e === 'draw' && d.pi === 0 },
      { say: 'Pasa el cursor sobre tu <b>Diablillo</b>: 2 de base <b>+1 por Ira</b> <b>+1 del Tamborilero</b> (su Apoyo funciona desde la Retaguardia) = <b>4 de Fuerza</b>.', focus: cardRef('diablillo') },
      { say: 'Juega el Alma <b>Paolo</b> y <b>condénala</b>. Su Condena da <b>+1/+0</b> este turno: elige a tu Diablillo.', focus: cardRef('paolo'), action: true,
        ok: { action: (a, g) => isSoul(a, g, 'paolo'), soulMode: 'condemn', pick: (r, g) => r.kind === 'card' && g.find(r.uid) && g.find(r.uid).id === 'diablillo' }, until: (e, d) => e === 'soul' && d.pi === 0 },
      { say: 'Juega <b>Cerbero</b> (Ilustre, 4 + 👄). El 👄 de Gula lo aporta Francesca. Colócalo en tu <b>Vanguardia</b>.', focus: cardRef('cerbero'), action: true,
        ok: { action: (a, g) => isCast(a, g, 'cerbero'), pick: r => r.kind !== 'slot' || r.row === 'van' }, until: (e, d) => e === 'resolve' && d.id === 'cerbero' },
      { say: 'Cerbero acaba de entrar: no puede atacar. Pulsa <b>Ir a combate</b>.', focus: { dom: '#btnPrimary' }, action: true, ok: { action: a => a.type === 'pass' }, until: (e, d) => e === 'phase' && d.phase === 'combat' },
      { say: 'Elige a tu <b>Diablillo</b> como atacante y confirma. Todos los atacantes van contra el Peregrino rival.', focus: cardRef('diablillo'), action: true, ok: { attack: ['diablillo'] }, until: e => e === 'attack' },
      { say: 'Tras declarar atacantes se abre una <b>ventana de Juicios</b>. Tú tienes la prioridad primero: <b>pasa</b> y mira qué hace el rival.', focus: { dom: '#btnPrimary' }, action: true, ok: { action: a => a.type === 'pass' }, until: (e, d) => e === 'cast' && d.pi === 1 },
      { say: 'El rival juega <b>Silencio helado</b>: «el Ente atacante objetivo deja de atacar». Está en la Cadena. <b>¡Responde!</b> Juega <b>Ímpetu</b> sobre tu Diablillo.', focus: cardRef('impetu'), action: true,
        ok: { action: (a, g) => isCast(a, g, 'impetu') || a.type === 'tap', pick: (r, g) => r.kind === 'card' && g.find(r.uid) && g.find(r.uid).id === 'diablillo' }, until: (e, d) => e === 'cast' && d.pi === 0 },
      { say: 'Mira la Cadena: <b>Ímpetu arriba (1º)</b>, Silencio helado debajo (2º). Se resuelve <b>de la última a la primera</b>: tu respuesta llega antes.', focus: { kind: 'chainArea' } },
      { waitFor: e => e === 'fizzle', say: 'Ímpetu protegió al Diablillo de los Juicios rivales. Al resolverse Silencio helado, su objetivo <b>ya no es legal</b>: se <b>anula</b> sin hacer nada.', focus: cardRef('diablillo') },
      { waitFor: e => e === 'blocks', say: 'El rival <b>bloquea</b> con su Centinela de hielo (1/4): se coloca frente a tu Diablillo. Un bloqueador por atacante como máximo.', focus: cardRef('centinela', 1) },
      { waitFor: e => e === 'damageDone', say: 'Daño simultáneo: tu Diablillo hace <b>5</b> (≥ Resistencia 4) y el Centinela muere; recibe 1 y sobrevive. Sin <b>Violencia</b> (Círculo VII), el sobrante no pasa al Peregrino.', focus: cardRef('diablillo') },
      { waitFor: (e, d) => e === 'draw' && d.pi === 1, say: 'El Centinela tenía «<b>Al morir, roba 1</b>»: ese disparador entró en la Cadena y el rival ha robado. Así ganan cartas los mazos de control.', focus: { kind: 'deck', player: 1, which: 'main' } },
      { say: 'Termina tu turno con el botón (pasa en la fase principal 2). Observa lo que hace el rival al final de tu turno.', focus: { dom: '#btnPrimary' }, action: true, ok: { action: a => a.type === 'pass' }, until: (e, d) => e === 'turn' && d.active === 1 },
      { end: true, say: 'Has jugado el <b>turno de ejemplo</b> del Núcleo de reglas: ganaste tempo (Cerbero, bloqueador eliminado) y el rival ganó cartas. Esa es la tensión central de SULPHUR.' },
    ],
  },
  {
    id: 'juicio', title: 'El Descenso y el Juicio Final', sub: 'Cómo termina una partida',
    learn: ['El Descenso es el reloj de la partida', 'Traición: la Retaguardia no bloquea', 'Juicio Final: gana más Voluntad', 'Empate: gana quien esté más lejos del centro de la Balanza', 'Las tres formas de terminar'],
    setup: {
      circle: 9, round: 9, first: 1, active: 0, turnOf: [8, 9],
      players: [
        { will: 12, hand: [], souls: [{ id: 'argenti' }, { id: 'ciacco' }, { id: 'lluviaAlma' }, { id: 'argenti' }, { id: 'estigia', down: true }], main: ['espada', 'larva'], soulDeck: ['paolo'] },
        { will: 12, hand: ['traidor'], souls: [{ id: 'bocca' }, { id: 'guido' }, { id: 'limbo' }, { id: 'falsaria', down: true }, { id: 'cocitoAlma', down: true }], main: ['espectro'], soulDeck: ['limbo'] },
      ],
    },
    ai: { passAll: true },
    steps: [
      { say: 'Hemos descendido hasta el <b>Círculo IX, Traición</b>. El Descenso es el <b>reloj</b>: subió un Círculo por ronda y no hay más abajo.', focus: { kind: 'descenso', circle: 9 } },
      { say: 'Esta es la última ronda. Tú juegas <b>segunda</b>: cuando termines tu turno, terminará la ronda del Noveno Círculo y llegará el <b>Juicio Final</b>.', focus: { kind: 'descenso', circle: 9 } },
      { say: 'En el Juicio Final gana quien tenga <b>más Voluntad</b>. Ahora mismo estáis <b>empatados a 12</b>.', focus: { kind: 'will', player: 0 } },
      { say: 'En caso de empate gana quien esté <b>más lejos del centro de la Balanza</b>. Tú: 4 absueltas y 1 condenada = <b>+3, Virtuoso</b>.', focus: { kind: 'balance', player: 0 } },
      { say: 'El rival: 3 absueltas y 2 condenadas = <b>+1, Tibio</b>. El tibio pierde los empates, un guiño a los indecisos del Vestíbulo de Dante.', focus: { kind: 'balance', player: 1 } },
      { say: 'Roba una carta y después <b>termina tu turno</b> pasando con el botón. Deja que el Descenso llegue a su fin.', focus: { dom: '#btnPrimary' }, action: true, ok: { action: a => a.type === 'pass', draw: null }, until: e => e === 'gameOver' },
      { end: true, say: 'Las tres formas de terminar: <b>Voluntad a 0</b>, <b>Agotamiento</b> (debes robar y no te quedan cartas en ninguno de tus dos mazos) y el <b>Juicio Final</b> tras el Círculo IX.' },
    ],
  },
];

// ───────────────────────── rival guionizado ─────────────────────────
export class ScriptedAI extends RivalAI {
  constructor(cfg) { super(1); this.cfg = cfg || {}; }
  async chooseAction(g, pi, label) {
    if (this.cfg.passAll) { await this.delay(300); return { type: 'pass' }; }
    if (this.cfg.script === 'ejemplo') {
      await this.delay(500);
      const p = g.P[pi]; const J = id => p.hand.find(c => c.id === id && g.canCast(pi, c).ok);
      if (label === 'atacantes' && g.active !== pi && !g.chain.length && J('silencio') && !this.usedSilencio) {
        const t = g.entes(1 - pi).find(e => e.attacking);
        if (t) { this.usedSilencio = true; return { type: 'cast', uid: J('silencio').uid, targets: [{ kind: 'card', uid: t.uid }] }; }
      }
      if (label === 'final' && g.active !== pi && !g.chain.length && J('prevision')) return { type: 'cast', uid: J('prevision').uid };
      return { type: 'pass' };
    }
    return super.chooseAction(g, pi, label);
  }
  async chooseBlocks(g, pi, attackers, cands) {
    if (this.cfg.script === 'ejemplo') { await this.delay(700); const c = cands.map(u => g.find(u)).find(e => e.id === 'centinela'); return c ? { [attackers[0]]: c.uid } : {}; }
    return super.chooseBlocks(g, pi, attackers, cands);
  }
}

// ───────────────────────── el guía ─────────────────────────
export class Tutor {
  constructor(ui) { this.ui = ui; this.active = false; this.steps = []; this.i = 0; this.shown = false; this.waiters = []; }
  start(lesson) {
    this.lesson = lesson; this.steps = lesson.steps.map(s => ({ ...s })); this.i = -1; this.active = true;
    return new Promise(res => { this.finishRes = res; this.next(); });
  }
  get step() { return this.steps[this.i]; }
  next() {
    this.i++; const s = this.step; this.shown = false;
    if (!s) return;
    if (s.waitFor) { this.ui.narrate(null); this.release(); return; }
    this.show();
  }
  show() {
    const s = this.step; this.shown = true;
    if (s.end) { this.ui.lessonComplete(this.lesson, s.say, () => this.finish()); return; }
    this.ui.narrate({ text: s.say, focus: s.focus, action: !!s.action, onNext: s.action ? null : () => { this.ui.A.click(); this.next(); this.ui.refreshActionHighlights(); } });
    if (s.action) this.release();
    this.ui.refreshActionHighlights();
  }
  // Mientras el guía habla, nadie actúa.
  blocking() { const s = this.step; return this.active && s && this.shown && !s.action && !s.end; }
  gate() { if (!this.blocking()) return Promise.resolve(); return new Promise(r => this.waiters.push(r)); }
  release() { const w = this.waiters.splice(0); w.forEach(r => r()); }
  onEvent(name, data, g) {
    const s = this.step; if (!this.active || !s) return;
    if (s.waitFor && !this.shown) { if (s.waitFor(name, data, g)) this.show(); return; }
    if (s.action && this.shown && s.until && s.until(name, data, g, s)) this.next();
  }
  // ¿Permite el paso actual esta acción del jugador?
  ok(kind, data, g) {
    if (!this.active) return true;
    const s = this.step;
    if (!s || !s.action) { if (kind === 'pick' || kind === 'draw' || kind === 'discard' || (kind === 'action' && data.type === 'pass')) return true; return 'Escucha al guía y pulsa «Continuar».'; }
    const o = s.ok || {};
    if (kind === 'action') { if (data.type === 'tap') return true; if (o.action && !o.action(data, g)) return 'Ahora no: sigue la indicación del guía.'; return true; }
    if (kind === 'pick') return !o.pick || o.pick(data, g) ? true : 'Elige el objetivo que indica el guía.';
    if (kind === 'soulMode') return !o.soulMode || o.soulMode === data ? true : `El guía te pide ${o.soulMode === 'absolve' ? 'absolver' : 'condenar'} esta Alma.`;
    if (kind === 'draw') return !o.draw || o.draw === data ? true : `Roba del ${o.draw === 'main' ? 'Mazo Principal' : 'Mazo de Almas'}.`;
    if (kind === 'attackToggle') return !o.attack || o.attack.includes(g.find(data).id) ? true : 'Ataca solo con el Ente que indica el guía.';
    if (kind === 'attackConfirm') return !o.attack || data.length > 0 ? true : 'Elige primero a tu atacante.';
    return true;
  }
  finish() { this.active = false; this.ui.narrate(null); const r = this.finishRes; this.finishRes = null; r && r(); }
  stop() { this.active = false; this.release(); this.ui.narrate(null); }
}
