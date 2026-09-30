// SULPHUR — interfaz: la mesa y las cartas son la interfaz; esto explica, señala, pregunta y confirma.
import { CARDS, SOULS, PILGRIMS, CIRCLES, SENDAS, SENDA_KEYS, TYPES, KEYWORDS, GLOSSARY } from './data.js';
import * as ART from './art.js';
import { isEnte } from './engine.js';
import { CODEX } from './codex.js';
import { LAYOUT } from './view.js';

const $ = (sel, el = document) => el.querySelector(sel);
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const iconURL = (() => { const cache = {}; return (k, col) => { const key = k + (col || ''); if (!cache[key]) cache[key] = ART.iconCanvas(k, 64, col || (SENDAS[k] ? SENDAS[k].color : '#e6d6b4'), '#140d08').toDataURL(); return cache[key]; }; })();
const icon = (k, col, cls = 'ic') => `<img class="${cls}" src="${iconURL(k, col)}" alt="">`;
const cloneCanvas = cv => { const c = h('canvas'); c.width = cv.width; c.height = cv.height; c.getContext('2d').drawImage(cv, 0, 0); return c; };
const PHASES = [['inicio', 'Inicio', 'Enderezar · Descenso · Robo'], ['main1', 'Principal 1', 'Almas, cartas, mover'], ['combat', 'Combate', 'Atacar y bloquear'], ['main2', 'Principal 2', 'Igual que la 1'], ['final', 'Final', 'Borrar daño · descartar a 7']];
const STEP_NAMES = { enderezar: 'Enderezar', descenso: 'Descenso', robo: 'Robo', atacantes: 'Declarar atacantes', bloqueadores: 'Declarar bloqueadores', 'daño': 'Daño', fin: 'Fin del combate' };
const WINDOW_NAMES = { inicio: 'tras el Descenso', main1: 'en la fase principal', main2: 'en la fase principal', atacantes: 'tras declarar atacantes', bloqueadores: 'tras declarar bloqueadores', 'fin de combate': 'al final del combate', final: 'al final del turno' };
const HUD_TIPS = {
  will: ['Voluntad', GLOSSARY.Voluntad], energy: ['Energía', GLOSSARY['Energía'] + ' Cada rombo es un Alma: brillante = enderezada, apagado = agotada.'],
  umbral: ['Umbral', GLOSSARY.Umbral + ' Una carta «2 + 🔥🔥» exige dos símbolos de Ira.'], bal: ['Balanza', GLOSSARY.Balanza + ' ' + GLOSSARY.Destino],
  counts: ['Mazos y mano', 'Cartas en mano, en el Mazo Principal, en el Mazo de Almas y en el Olvido. ' + GLOSSARY['Agotamiento']],
};

// Explicaciones contextuales: cada una señala el objeto del que habla.
const TIPS = {
  robo: ['Robo eligiendo mazo', 'Cada vez que robas eliges: <b>Mazo Principal</b> (dorso negro) o <b>Mazo de Almas</b> (dorso claro). Sin Almas no hay energía; sin cartas no hay jugadas.', { kind: 'deck', player: 0, which: 'soul' }],
  main1: ['Tu fase principal', 'Juega <b>1 Alma</b> por turno (absolver o condenar) y después Entes, Ritos o Reliquias. Lo que puedes jugar <b>brilla</b> en tu mano.', { dom: '#handTab' }],
  absolver: ['Absolver', 'Boca arriba: su símbolo cuenta para tu <b>umbral</b> y la Balanza se inclina hacia la <b>Virtud</b>. El umbral no se gasta: basta con tenerlo.', { kind: 'balance', player: 0 }],
  condenar: ['Condenar', 'Boca abajo: su <b>Condena</b> ya se ha resuelto, pero no aporta Senda y la Balanza cae hacia la <b>Corrupción</b>.', { kind: 'balance', player: 0 }],
  energia: ['Energía', 'Cada Alma se <b>agota</b> (gira 90°) para dar 1 de energía. Al pagar, la demo agota Almas sola; también puedes pulsarlas. Lo no gastado se pierde al final de la fase.', { dom: '#hud0 .energy' }],
  cadena: ['La Cadena', 'Lo que se juega entra aquí antes de resolverse. Quien no lo jugó recibe la prioridad y puede <b>responder</b>.', { kind: 'chainArea' }],
  cadena2: ['Respuesta', 'Hay varios efectos: <b>el 1º (arriba) se resuelve primero</b>. Si al resolverse su objetivo ya no es legal, se anula.', { kind: 'chainArea' }],
  juicio: ['Juicio', 'Los Juicios (espinas y balanza junto al coste) se juegan <b>en cualquier momento con prioridad</b>, también en el turno rival.', { kind: 'chainArea' }],
  disparador: ['Disparador', '«Al entrar» y «al morir» también pasan por la Cadena. Varios a la vez: primero los del jugador activo (APNAP).', { kind: 'chainArea' }],
  anula: ['Anulado', 'Su objetivo dejó de ser legal antes de resolverse: el efecto no hace nada.', { kind: 'chainArea' }],
  reliquia: ['Reliquia', 'Se une a un Ente (icono de cadena), a tu Peregrino, o queda suelta ocupando un hueco de Retaguardia.', null],
  cond: ['Halo y cuernos', 'Las habilidades con halo funcionan si eres <b>Virtuoso</b>; las de cuernos, si eres <b>Corrupto</b>.', { dom: '#hud0 .bal' }],
  estado_virtuoso: ['¡Virtuoso!', '3 o más Almas absueltas de ventaja: halo dorado sobre tu Balanza y se activan las habilidades con halo.', { kind: 'balance', player: 0 }],
  estado_corrupto: ['¡Corrupto!', '3 o más Almas condenadas de ventaja: cuernos negros sobre tu Balanza y se activan las habilidades con cuernos.', { kind: 'balance', player: 0 }],
  estado_tibio: ['Tibio', 'Menos de 3 de ventaja: sin bonus, a salvo de los Juicios que castigan extremos. Pierde los empates del Juicio Final.', { kind: 'balance', player: 0 }],
  destino: ['Destino', 'Con 5 de ventaja se desbloquea para siempre la Redención o la Caída. El otro panel del retablo queda sellado.', { kind: 'pilgrim', player: 0 }],
  limbo: ['Limbo', 'En el Círculo I los Entes no pueden atacar: es la ronda de despliegue.', { kind: 'descenso', circle: 1 }],
  atacar: ['Ataque', 'Los atacantes se agotan y avanzan contra el Peregrino rival. Antes de los bloqueos hay una ventana de Juicios.', { kind: 'pilgrim', player: 1 }],
  bloquear: ['Bloqueo', 'Cada bloqueador se pone frente a su atacante (uno por atacante). El daño es simultáneo e igual a la Fuerza.', null],
  violencia: ['Violencia', 'En el Círculo VII el daño sobrante tras matar a un bloqueador pasa al Peregrino.', { kind: 'descenso', circle: 7 }],
  quemar: ['Quemar', 'En Herejía los Entes destruidos se <b>Queman</b>: salen de la partida en lugar de ir al Olvido.', { kind: 'descenso', circle: 6 }],
  oro: ['Oro', 'En Avaricia la energía no gastada al final del turno se guarda como Oro (máximo 3).', { dom: '#hud0 .energy' }],
  prioridad: ['Tienes la prioridad', 'Puedes jugar un Juicio o activar una habilidad, o <b>pasar</b>. Cuando los dos pasan seguidos se resuelve la Cadena o avanza el juego.', { dom: '#btnPrimary' }],
  lujuria: ['Lujuria', 'Al inicio de su turno, cada jugador mueve uno de sus Entes a la otra fila.', { kind: 'descenso', circle: 2 }],
};

export class UI {
  constructor(view, audio) {
    this.V = view; this.A = audio; this.g = null; this.tutor = null;
    this.mode = null; this.resolver = null; this.tipsSeen = new Set(); this.guideOn = true; this.pauseAll = false; this.coachQ = [];
    this.root = $('#ui'); this.build();
    view.on('hover', info => this.onHover(info));
    view.on('click', (info, e) => this.onClick(info, e));
    view.on('inspect', info => this.inspect(info));
    view.on('drop', (uid, info) => this.onDrop(uid, info));
    view.on('dragStart', uid => this.onDragStart(uid));
    view.on('frame', () => this.frame());
    view.on('circle', (n, initial) => this.circleBanner(n, initial));
    view.on('destiny', (pi, d) => this.destinyBanner(pi, d));
    view.on('finalJudgment', () => this.banner('JUICIO FINAL', 'Termina la ronda del Noveno Círculo. Se compara la Voluntad de los dos Peregrinos.', 'judg', 3200));
    view.on('fxAbsolve', d => this.flyAbsolve(d));
    view.on('fxCondemn', d => this.flyCondemn(d));
    view.on('fxEnergy', (uids, pi) => this.flyEnergy(uids, pi));
    view.on('fxWill', d => this.pulseWill(d));
    view.on('fxChain', it => this.floatAt(this.V.project(LAYOUT.chain[0], 0.4, 0.3), it.kind === 'spell' ? `Entra en la Cadena` : it.kind === 'trigger' ? 'Disparador → Cadena' : 'Habilidad → Cadena', 'fl-chain'));
    view.on('fxResolve', it => this.floatAt(this.V.project(LAYOUT.chain[0], 0.4, 0.3), `Se resuelve: ${it.name}`, 'fl-res'));
    view.canDrag = uid => {
      if (this.mode !== 'action' || !this.g) return false; const c = this.g.find(uid); if (!c) return false;
      if (this.g.P[0].hand.includes(c)) return true;
      return isEnte(c) && c.ctrl === 0 && this.g.canMove(0, c);
    };
    document.addEventListener('mousemove', e => { this.mx = e.clientX; this.my = e.clientY; this.moveTooltip(); });
    document.addEventListener('keydown', e => { if (e.key === 'm' || e.key === 'M') this.toggleHand(); if (e.key === 'Escape' && this.mode === 'pick' && this.secondary) this.secondary(); });
  }

  // ───────────────────────── DOM ─────────────────────────
  build() {
    this.root.innerHTML = `
    <div id="topbar">
      <div class="brand"><img class="brand-mark" src="assets/mark-light.png" alt=""><img class="brand-word" src="assets/word-light.png" alt="SULPHUR"></div>
      <div class="tools">
        <button data-act="log">Crónica</button>
        <button data-act="codex">Códice</button>
        <button data-act="guide">Guía: sí</button>
        <button data-act="sound">Sonido: sí</button>
        <div class="menu"><button data-act="menu">Demo ▾</button>
          <div class="menu-list">
            <button data-act="lessons">Aprender a jugar (lecciones)</button>
            <button data-act="descend">Descender (herramienta de demo)</button>
            <button data-act="pause">Detenerse en todas las ventanas: no</button>
            <button data-act="restart">Volver a la portada</button>
          </div></div>
      </div>
    </div>
    <div id="spot"></div>
    <svg id="lines"><line id="coachLine"/><line id="narrLine"/></svg>
    <div id="ringA" class="ring"></div><div id="pointer">▼</div>
    <div id="circleChip"></div>
    <div id="midline"><div id="prompt"></div></div>
    <div id="labels"></div>
    <div id="chainPanel"></div>
    ${[1, 0].map(pi => `<div class="hud" id="hud${pi}">
      <div class="hud-portrait"><canvas width="220" height="220"></canvas><div class="will" data-tip="will"><b>20</b><small>Voluntad</small></div></div>
      <div class="hud-body"><div class="hud-name"></div><div class="energy" data-tip="energy"></div><div class="umbral" data-tip="umbral"></div><div class="bal" data-tip="bal"></div><div class="counts" data-tip="counts"></div></div>
    </div>`).join('')}
    <div id="phasebox"><div class="turnlbl"></div><div class="phases"></div>
      <button id="btnPrimary" class="orb"></button><button id="btnSecondary" class="btn ghost"></button></div>
    <button id="handTab">▾ Plegar mano</button>
    <div id="coach"></div>
    <div id="narrator"></div>
    <div id="logWrap"><div id="log"></div></div>
    <div id="tooltip"></div>
    <div id="preview"></div>
    <div id="ctxMenu"></div>
    <div id="toast"></div>
    <div id="banner"></div>
    <div id="modal"></div>
    <div id="confirm"></div>`;
    this.root.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) this.toolbar(b.dataset.act, b); });
    $('#btnPrimary').onclick = () => { this.A.click(); this.primary && this.primary(); };
    $('#btnSecondary').onclick = () => { this.A.click(); this.secondary && this.secondary(); };
    $('#handTab').onclick = () => this.toggleHand();
    document.addEventListener('pointerdown', e => { if (!e.target.closest('#ctxMenu') && e.target.tagName !== 'CANVAS') $('#ctxMenu').style.display = 'none'; });
    this.root.addEventListener('mouseover', e => { const t = e.target.closest('[data-tip]'); if (!t || !HUD_TIPS[t.dataset.tip]) return; const [a, b] = HUD_TIPS[t.dataset.tip]; this.showTooltip(`<h4>${a}</h4><p>${b}</p>`); });
    this.root.addEventListener('mouseout', e => { if (e.target.closest('[data-tip]')) this.showTooltip(null); });
    this.labels = {}; this.setButtons();
  }
  toolbar(act, b) {
    this.A.start();
    const closeMenu = () => b.closest('.menu') && b.closest('.menu').classList.remove('open');
    if (act === 'log') $('#logWrap').classList.toggle('open');
    if (act === 'codex') this.openCodex();
    if (act === 'guide') { this.guideOn = !this.guideOn; b.textContent = `Guía: ${this.guideOn ? 'sí' : 'no'}`; if (!this.guideOn) { this.coachQ = []; this.showCoach(); } }
    if (act === 'sound') { this.A.setMuted(!this.A.muted); b.textContent = `Sonido: ${this.A.muted ? 'no' : 'sí'}`; }
    if (act === 'menu') b.parentElement.classList.toggle('open');
    if (act === 'pause') { this.pauseAll = !this.pauseAll; b.textContent = `Detenerse en todas las ventanas: ${this.pauseAll ? 'sí' : 'no'}`; }
    if (act === 'lessons') { closeMenu(); this.ask('¿Salir de la partida y abrir las lecciones?').then(ok => { if (ok) { sessionStorage.setItem('sulphurStart', 'learn'); location.reload(); } }); }
    if (act === 'restart') { closeMenu(); this.ask('¿Volver a la portada? La partida actual se perderá.').then(ok => { if (ok) { sessionStorage.removeItem('sulphurStart'); location.reload(); } }); }
    if (act === 'descend') {
      closeMenu();
      if (!this.g || this.mode !== 'action') return this.toast('Úsalo cuando tengas la prioridad.');
      if (this.tutor && this.tutor.active) return this.toast('No disponible durante una lección.');
      if (this.g.circle >= 9) return this.toast('Ya estáis en el Noveno Círculo.');
      this.submit({ type: 'demoDescend' });
    }
  }
  ask(text, yes = 'Sí', no = 'Cancelar') {
    return new Promise(res => {
      const d = $('#confirm'); d.innerHTML = `<div class="cf-box"><p>${text}</p><div class="cf-btns"><button class="btn" data-y>${yes}</button><button class="btn ghost" data-n>${no}</button></div></div>`;
      d.classList.add('show');
      const close = v => { d.classList.remove('show'); this.A.click(); res(v); };
      $('[data-y]', d).onclick = () => close(true); $('[data-n]', d).onclick = () => close(false);
    });
  }
  toggleHand() { if (!this.g) return; this.V.setHandMode(this.V.handMode === 'min' ? 'normal' : 'min'); this.updateHandTab(); this.A.paper(); }
  updateHandTab() { const n = this.g ? this.g.P[0].hand.length : 0; $('#handTab').innerHTML = this.V.handMode === 'min' ? `▴ Mostrar mano (${n})` : `▾ Plegar mano <small>M</small>`; }
  toast(t, ms = 2400) { const el = $('#toast'); el.innerHTML = t; el.classList.add('show'); clearTimeout(this.toastT); this.toastT = setTimeout(() => el.classList.remove('show'), ms); }
  prompt(t) { $('#prompt').innerHTML = t || ''; $('#prompt').style.opacity = t ? 1 : 0; }
  setButtons(pl, pf, sl, sf) {
    const p = $('#btnPrimary'), s = $('#btnSecondary');
    p.innerHTML = pl || (this.g && this.g.priority === 1 ? 'Turno del rival…' : 'Espera…'); p.classList.toggle('idle', !pl); p.disabled = !pl; this.primary = pl ? pf : null;
    s.style.display = sl ? '' : 'none'; s.innerHTML = sl || ''; this.secondary = sf;
  }
  banner(title, sub, cls = '', ms = 2600) {
    return new Promise(res => {
      const b = $('#banner'); b.className = 'show ' + cls; b.innerHTML = `<div class="b-title">${title}</div>${sub ? `<div class="b-sub">${sub}</div>` : ''}`;
      clearTimeout(this.bannerT); this.bannerT = setTimeout(() => { b.className = ''; res(); }, ms);
    });
  }
  circleBanner(n, initial) {
    const C = CIRCLES[n]; this.A.setCircle(n); this.update();
    if (initial) return;
    const b = $('#banner'); b.className = 'show circle'; b.style.setProperty('--acc', '#' + C.accent.toString(16).padStart(6, '0'));
    b.innerHTML = `<div class="b-kicker">El Descenso avanza</div><div class="b-roman">${C.roman}</div><div class="b-title">${C.name}</div><div class="b-rule">${C.rule}</div><div class="b-sub">${C.ambiente} · ${C.luz}</div>`;
    clearTimeout(this.bannerT); this.bannerT = setTimeout(() => { b.className = ''; }, 3600);
    this.coach('circle_' + n, `Círculo ${C.roman}: ${C.name}`, `<b>${C.rule}</b><br><span class="dim">Esta regla afecta a los dos jugadores mientras el d10 marque este Círculo.</span>`, { kind: 'descenso', circle: n });
    if (n === 2) this.coach('lujuria');
  }
  destinyBanner(pi, d) {
    const p = this.g.P[pi]; const txt = d === 'redencion' ? p.pilgrim.redencion.text : p.pilgrim.caida.text;
    this.banner(d === 'redencion' ? 'DESTINO: REDENCIÓN' : 'DESTINO: CAÍDA', `${pi === 0 ? 'Tu Peregrino' : 'El Peregrino rival'} (${p.pilgrim.name}) desbloquea para siempre: «${txt}»`, d === 'redencion' ? 'gold' : 'ash', 3600);
  }

  // ───────────────────────── señalar: foco, marcas y textos que vuelan ─────────────────────────
  resolveFocus(f) {
    if (!f) return null;
    if (typeof f === 'function') f = this.g ? f(this.g) : null; if (!f) return null;
    if (f.dom) { const el = $(f.dom); if (!el || !el.offsetParent) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: Math.max(r.width, r.height) / 2 + 18 }; }
    if (f.kind === 'card') {
      const v = this.V.views.get(f.uid); if (!v) return null; const p = v.mesh.getWorldPosition(v.mesh.position.clone()); const s = this.V.projectVec(p);
      return { x: s[0], y: s[1], r: v.mesh.parent === this.V.handGroup ? 95 : 70 };
    }
    const s = this.V.refScreen(f); if (!s) return null;
    const r = { pilgrim: 120, balance: 95, descenso: 70, chainArea: 110, deck: 70, will: 50, slot: 60, soulzone: 150 }[f.kind] || 80;
    return { x: s[0], y: s[1], r };
  }
  coach(key, title, text, focus) {
    if (!this.guideOn || this.tipsSeen.has(key) || (this.tutor && this.tutor.active)) return;
    this.tipsSeen.add(key);
    const t = TIPS[key]; const T = title || (t && t[0]); const X = text || (t && t[1]); const F = focus !== undefined ? focus : t && t[2]; if (!T) return;
    this.coachQ.push({ T, X, F }); if (this.coachQ.length === 1) this.showCoach();
  }
  showCoach() {
    const box = $('#coach'); const t = this.coachQ[0];
    if (!t) { box.classList.remove('show'); this.coachCur = null; return; }
    this.coachCur = t; box.classList.remove('show'); void box.offsetWidth;
    box.innerHTML = `<div class="c-h">${icon('seal', '#8e1c14')} ${t.T}</div><div class="c-b">${t.X}</div><div class="c-f"><button class="c-ok">Entendido${this.coachQ.length > 1 ? ` · ${this.coachQ.length - 1} más` : ''}</button><button class="c-off">No mostrar más</button></div>`;
    box.classList.add('show'); this.placeCoach = true;
    $('.c-ok', box).onclick = () => { this.A.click(); this.coachQ.shift(); this.showCoach(); };
    $('.c-off', box).onclick = () => { this.guideOn = false; $('[data-act=guide]').textContent = 'Guía: no'; this.coachQ = []; this.showCoach(); };
    clearTimeout(this.coachT); this.coachT = setTimeout(() => { if (this.coachCur === t) { this.coachQ.shift(); this.showCoach(); } }, 16000);
  }
  narrate(o) {
    const n = $('#narrator'); this.narr = o;
    if (!o) { n.classList.remove('show'); return; }
    n.innerHTML = `<div class="n-head"><canvas width="96" height="96"></canvas><div><div class="n-name">La voz del Libro</div><div class="n-lesson">${this.tutor && this.tutor.lesson ? this.tutor.lesson.title : ''}</div></div></div>
      <div class="n-text">${o.text}</div>
      <div class="n-foot">${o.action ? '<span class="n-obj">▸ Tu turno de actuar</span>' : '<button class="n-next">Continuar ▸</button>'}<button class="n-skip">Salir de la lección</button></div>`;
    ART.drawSeal($('canvas', n).getContext('2d'), 48, 48, 44, '#b8261a', { text: '✠ SVLPHVR ✠ SVLPHVR ' });
    if (o.onNext) $('.n-next', n).onclick = o.onNext;
    $('.n-skip', n).onclick = () => this.ask('¿Salir de esta lección?').then(ok => { if (ok && this.exitLesson) this.exitLesson(); });
    n.classList.remove('show'); void n.offsetWidth; n.classList.add('show'); this.placeNarr = true;
  }
  lessonComplete(lesson, text, done) {
    this.narrate(null); this.mode = null; this.setButtons();
    this.modal(`<div class="done"><div class="d-k">Lección completada</div><h2>${lesson.title}</h2><p>${text}</p><h3>Has aprendido</h3><ul class="learned">${lesson.learn.map(l => `<li>✦ ${l}</li>`).join('')}</ul></div>`, [['Continuar ▸', () => { this.closeModal(); done(); }]], 'done');
    this.A.absolve();
  }
  frame() {
    const g = this.g;
    // foco del guía (foco + flecha + línea)
    const spot = $('#spot'), ring = $('#ringA'), ptr = $('#pointer');
    let fp = null;
    if (this.narr && this.narr.focus && this.mode !== 'pick' && this.mode !== 'attack' && this.mode !== 'block') fp = this.resolveFocus(this.narr.focus);
    $('#midline').style.visibility = this.narr && this.mode !== 'pick' ? 'hidden' : 'visible';
    const coachFp = !fp && this.coachCur && this.coachCur.F ? this.resolveFocus(this.coachCur.F) : null;
    const tgt = fp || coachFp;
    if (fp) { spot.style.opacity = 1; spot.style.background = `radial-gradient(circle at ${fp.x}px ${fp.y}px, rgba(0,0,0,0) ${fp.r}px, rgba(0,0,0,.62) ${fp.r + 70}px)`; }
    else spot.style.opacity = 0;
    if (tgt) { ring.style.opacity = 1; ring.style.transform = `translate(${tgt.x - tgt.r}px,${tgt.y - tgt.r}px)`; ring.style.width = ring.style.height = `${tgt.r * 2}px`; ptr.style.opacity = 1; ptr.style.transform = `translate(${tgt.x - 14}px,${tgt.y - tgt.r - 40}px)`; }
    else { ring.style.opacity = 0; ptr.style.opacity = 0; }
    const place = (box, fp2, flag) => {
      if (!box.classList.contains('show')) return null;
      const bw = box.offsetWidth, bh = box.offsetHeight;
      if (this[flag] || !box.dataset.x) {
        let x, y;
        if (flag === 'placeNarr') { const right = !fp2 || fp2.x < innerWidth * 0.5; x = right ? innerWidth - bw - 30 : 30; y = Math.max(70, innerHeight * 0.3 - bh / 2); if (fp2 && fp2.y < innerHeight * 0.45 && fp2.x > innerWidth * 0.3 && fp2.x < innerWidth * 0.7) y = innerHeight * 0.52 - bh / 2; }
        else if (!fp2) { x = innerWidth / 2 - bw / 2; y = innerHeight * 0.16; }
        else if (fp2.y > innerHeight * 0.55) { x = Math.min(innerWidth - bw - 250, Math.max(20, fp2.x - bw / 2)); y = Math.max(70, fp2.y - fp2.r - 60 - bh); }
        else { x = fp2.x < innerWidth / 2 ? Math.min(innerWidth - bw - 20, fp2.x + fp2.r + 70) : Math.max(20, fp2.x - fp2.r - 70 - bw); y = Math.min(innerHeight - bh - 150, Math.max(70, fp2.y - bh / 2)); }
        box.dataset.x = x; box.dataset.y = y; box.style.transform = `translate(${x}px,${y}px)`; this[flag] = false;
      }
      return [+box.dataset.x, +box.dataset.y, bw, bh];
    };
    const line = (el, b, t) => {
      if (!b || !t) { el.setAttribute('opacity', 0); return; }
      const [bx, by, bw, bh] = b; const cx = Math.max(bx, Math.min(t.x, bx + bw)), cy = Math.max(by, Math.min(t.y, by + bh));
      const dx = t.x - cx, dy = t.y - cy, d = Math.hypot(dx, dy) || 1; const ex = t.x - dx / d * t.r, ey = t.y - dy / d * t.r;
      el.setAttribute('x1', cx); el.setAttribute('y1', cy); el.setAttribute('x2', ex); el.setAttribute('y2', ey); el.setAttribute('opacity', d > t.r + 10 ? 1 : 0);
    };
    line($('#narrLine'), place($('#narrator'), fp, 'placeNarr'), fp);
    line($('#coachLine'), place($('#coach'), coachFp, 'placeCoach'), coachFp);
    if (!g) return;
    for (const pi of [0, 1]) {
      const sg = pi === 0 ? 1 : -1;
      const at = (el, x, z, ax = 0.5, ay = 0.5) => { if (!el) return; const [px, py] = this.V.project(x, 0, z); el.style.transform = `translate(${px}px,${py}px) translate(${-ax * 100}%,${-ay * 100}%)`; };
      at(this.labels['main' + pi], LAYOUT.mainDeck[0], sg * (LAYOUT.mainDeck[1] + 0.9), 0.5, pi === 0 ? 0 : 1);
      at(this.labels['soul' + pi], LAYOUT.soulDeck[0], sg * (LAYOUT.soulDeck[1] + 0.9), 0.5, pi === 0 ? 0 : 1);
      at(this.labels['olv' + pi], LAYOUT.olvido[0] + 0.62, sg * LAYOUT.olvido[1], 0, 0.5);
    }
    const [mx, my] = this.V.project(0, 0, 0); $('#midline').style.top = `${my}px`;
    const [ccx, ccy] = this.V.project(LAYOUT.desc[0] + 0.95, 0, 0); $('#circleChip').style.transform = `translate(${ccx}px,${ccy}px) translate(0,-50%)`;
    const [cx, cy] = this.V.project(LAYOUT.chain[0] - 0.75, 0, LAYOUT.chain[1] + 0.2); $('#chainPanel').style.transform = `translate(${cx}px,${cy}px) translate(-100%,-50%)`;
  }
  floatAt([x, y], html, cls = '') {
    const f = h('div', 'float ' + cls, html); f.style.left = x + 'px'; f.style.top = y + 'px'; this.root.appendChild(f);
    setTimeout(() => f.remove(), 1900);
  }
  fly(from, toEl, html, cls = '', delay = 0) {
    if (!from || !toEl) return; const r = toEl.getBoundingClientRect(); if (!r.width) return;
    const f = h('div', 'fly ' + cls, html); f.style.transform = `translate(${from[0]}px,${from[1]}px) scale(1.3)`; this.root.appendChild(f);
    setTimeout(() => { f.style.transform = `translate(${r.left + r.width / 2}px,${r.top + r.height / 2}px) scale(.7)`; f.style.opacity = 0.2; }, 30 + delay);
    setTimeout(() => { f.remove(); toEl.classList.remove('bump'); void toEl.offsetWidth; toEl.classList.add('bump'); }, 950 + delay);
  }
  soulXY(uid) { const p = this.V.worldPos(uid); return p ? this.V.projectVec(p) : null; }
  flyAbsolve(d) {
    const s = this.g.find(d.uid); const xy = this.soulXY(d.uid); const hud = $(`#hud${d.pi}`);
    if (s && s.def.senda) this.fly(xy, $('.umbral', hud), `${icon(s.def.senda)} +1`, 'fl-sym');
    const b = this.V.balances[d.pi].g.position; this.floatAt(this.V.project(b.x, 1.2, b.z), `${icon('halo', '#e8c070')} Balanza → Virtud`, 'fl-gold');
  }
  flyCondemn(d) {
    const s = this.g.find(d.uid); const xy = this.soulXY(d.uid);
    if (s && xy) this.floatAt(xy, `Condena: ${s.def.text}`, 'fl-ash');
    const b = this.V.balances[d.pi].g.position; this.floatAt(this.V.project(b.x, 1.2, b.z), `${icon('horns', '#222')} Balanza → Corrupción`, 'fl-ash');
  }
  flyEnergy(uids, pi) {
    const target = this.g && this.g.chain.length && this.mode !== 'action' ? null : $(`#hud${pi} .energy`);
    uids.forEach((u, i) => { const xy = this.soulXY(u); if (!xy) return; if (target) this.fly(xy, target, icon('energia', '#e8c070') + '+1', 'fl-en', i * 90); else this.floatAt(xy, icon('energia', '#e8c070') + '−1', 'fl-pay'); });
  }
  pulseWill(d) { const el = $(`#hud${d.pi} .will`); if (!el) return; el.classList.remove('hit', 'heal'); void el.offsetWidth; el.classList.add(d.delta < 0 ? 'hit' : 'heal'); this.update(); }

  // ───────────────────────── ganchos del motor ─────────────────────────
  hooks() {
    return {
      log: (t, cls) => this.log(t, cls),
      update: () => this.update(),
      tip: k => this.coach(k),
      phaseTip: k => { if (this.g.active === 0) this.coach(k); },
      setPrompt: t => this.prompt(t),
      turnStart: A => { this.prompt(''); this.A.bell(A === 0 ? 523 : 392, 0.04, 1.5); this.banner(A === 0 ? 'TU TURNO' : 'TURNO DEL RIVAL', '', 'turn', 1300); },
      announceFirst: async first => { await this.banner(first === 0 ? 'EMPIEZAS TÚ' : 'EMPIEZA EL RIVAL', 'Se decide al azar. El jugador inicial no roba en su primer turno y hace avanzar el Descenso al inicio de cada ronda.', '', 3000); },
      gameOver: e => this.gameOver(e),
      error: e => this.toast('Error: ' + e.message, 8000),
      event: (name, data, g) => { if (this.tutor && this.tutor.active) this.tutor.onEvent(name, data, g); if (name === 'draw' && data.pi === 0) this.updateHandTab(); },
    };
  }
  log(t, cls = '') { const el = h('div', 'lg ' + cls, t); const L = $('#log'); L.appendChild(el); while (L.children.length > 250) L.removeChild(L.firstChild); L.scrollTop = L.scrollHeight; }

  update() {
    const g = this.g; if (!g) return;
    const C = CIRCLES[g.circle];
    $('#circleChip').innerHTML = `<div class="cc-r">${C.roman}</div><div><div class="cc-n">${C.name} <small>ronda ${Math.max(1, g.round)}</small></div><div class="cc-t">${C.rule}</div></div>`;
    $('#circleChip').style.setProperty('--acc', '#' + C.accent.toString(16).padStart(6, '0'));
    const cur = g.phase;
    $('#phasebox .turnlbl').innerHTML = g.phase === 'setup' ? 'Preparación' : g.active === 0 ? '<b class="you">TU TURNO</b>' : '<b class="riv">TURNO DEL RIVAL</b>';
    $('#phasebox .phases').innerHTML = PHASES.map(([k, n, d]) => `<div class="ph ${k === cur ? 'on' : ''}"><span class="dot"></span><span class="pn">${n}</span>${k === cur && g.step && STEP_NAMES[g.step] ? `<small>${STEP_NAMES[g.step]}</small>` : k === cur ? `<small>${d}</small>` : ''}</div>`).join('');
    if (!this.primary) this.setButtons();
    for (const pi of [0, 1]) this.renderHud(pi);
    this.renderChain(); this.renderCounters(); this.updateHandTab();
  }
  renderHud(pi) {
    const g = this.g, p = g.P[pi], el = $('#hud' + pi); const b = g.balance(pi); const sym = g.symbols(pi);
    if (el.dataset.pid !== p.pid) { el.dataset.pid = p.pid; const c = $('.hud-portrait canvas', el).getContext('2d'); c.clearRect(0, 0, 220, 220); c.drawImage(ART.pilgrimPortrait(p.pid), 0, 0); }
    el.classList.toggle('prio', g.priority === pi); el.classList.toggle('act', g.active === pi);
    $('.will b', el).textContent = Math.max(0, p.will);
    $('.hud-name', el).innerHTML = `${p.pilgrim.name} ${p.pilgrim.sendas.map(s => icon(s)).join('')} <span class="who">${pi === 0 ? 'Tú' : 'Rival'}</span>${g.priority === pi ? '<span class="prio-tag">PRIORIDAD</span>' : ''}`;
    const pips = p.souls.map(s => `<i class="pip ${s.tapped ? 'off' : ''} ${s.faceDown ? 'dn' : ''}"></i>`).join('') + '<i class="pip pool"></i>'.repeat(p.pool) + '<i class="pip gold"></i>'.repeat(p.gold);
    $('.energy', el).innerHTML = `<span class="k">Energía</span><b>${g.energyAvail(pi)}</b><span class="pips">${pips || '<span class="dim">sin Almas</span>'}</span>`;
    $('.umbral', el).innerHTML = `<span class="k">Umbral</span>${SENDA_KEYS.filter(k => sym[k] > 0).map(k => `<span class="sym">${icon(k)}<b>${sym[k]}</b></span>`).join('') || '<span class="dim">—</span>'}`;
    const pos = Math.max(-6, Math.min(6, b.diff));
    $('.bal', el).innerHTML = `<span class="k">Balanza</span><span class="st st-${b.state}">${b.state === 'virtuoso' ? icon('halo', '#e8c070') + 'Virtuoso' : b.state === 'corrupto' ? icon('horns', '#111') + 'Corrupto' : 'Tibio'}</span>
      <span class="minibar"><i class="z v5"></i><i class="z v3"></i><i class="z t"></i><i class="z c3"></i><i class="z c5"></i><i class="needle" style="left:${50 - pos / 6 * 50}%"></i></span>${p.destiny ? `<span class="dest">${p.destiny === 'redencion' ? 'Redención' : 'Caída'}</span>` : ''}`;
    $('.counts', el).innerHTML = `✋ ${p.hand.length} · Mazo ${p.main.length} · Almas ${p.soulDeck.length} · Olvido ${p.olvido.length}${p.burned.length ? ` · Quemadas ${p.burned.length}` : ''}`;
  }
  renderChain() {
    const g = this.g; const el = $('#chainPanel');
    if (!g.chain.length) { el.classList.remove('show'); return; }
    el.classList.add('show');
    el.innerHTML = `<div class="ch-h">${icon('chain', '#d8c8a8')} CADENA · ${g.chain.length}</div>` + [...g.chain].reverse().map((it, i) => `<div class="ch-it ${i === 0 ? 'top' : ''}"><span class="n">${i + 1}º</span> <b>${it.name}</b> <span class="who">${it.ctrl === 0 ? 'tuyo' : 'rival'}</span></div>`).join('') + `<div class="ch-f">Última en entrar, primera en resolverse</div>`;
  }
  renderCounters() {
    const g = this.g; const L = $('#labels');
    for (const pi of [0, 1]) {
      const p = g.P[pi];
      for (const [k, arr, nm] of [['main', p.main, 'Mazo'], ['soul', p.soulDeck, 'Almas'], ['olv', p.olvido, 'Olvido']]) {
        let d = this.labels[k + pi]; if (!d) { d = h('div', 'cnt'); L.appendChild(d); this.labels[k + pi] = d; }
        d.textContent = `${nm} ${arr.length}`;
      }
    }
  }

  // ───────────────────────── tooltips y vista previa ─────────────────────────
  moveTooltip() {
    const t = $('#tooltip'); if (!t.classList.contains('show')) return;
    const w = t.offsetWidth, hh = t.offsetHeight; let x = this.mx + 18, y = this.my + 18;
    if (x + w > innerWidth - 10) x = this.mx - w - 18; if (y + hh > innerHeight - 10) y = innerHeight - hh - 10;
    t.style.transform = `translate(${x}px,${y}px)`;
  }
  showTooltip(html) { const t = $('#tooltip'); if (!html) { t.classList.remove('show'); return; } t.innerHTML = html; t.classList.add('show'); this.moveTooltip(); }
  onHover(info) {
    clearTimeout(this.prevT);
    if (!info || !this.g) { this.showTooltip(null); this.hidePreview(); return; }
    const g = this.g;
    if (info.kind === 'card') {
      const c = g.find(info.uid); if (!c) return; this.showTooltip(null);
      if ((c.owner === 1 && c.zone === 'hand') || (c.soul && c.faceDown && c.owner === 1)) { this.showTooltip(c.zone === 'hand' ? `<h4>Carta del rival</h4><p>El dorso revela el mazo: ${c.soul ? '<b>Mazo de Almas</b>' : '<b>Mazo Principal</b>'}.</p>` : `<h4>Alma condenada</h4><p>Boca abajo, con el dorso claro del Mazo de Almas. Da energía pero no aporta Senda.</p>`); return; }
      this.prevT = setTimeout(() => this.showPreview(c), 110); return;
    }
    if (info.kind === 'chainToken') { const it = g.chain.find(x => x.id === info.id); if (it) this.showTooltip(`<h4>${it.name}</h4><p class="tag">${it.kind === 'trigger' ? 'Disparador' : 'Habilidad activada'} · ${it.ctrl === 0 ? 'tuya' : 'del rival'}</p><p>${it.text}</p>`); return; }
    this.hidePreview(); this.showTooltip(this.describe(info));
  }
  describe(info) {
    const g = this.g;
    switch (info.kind) {
      case 'slot': return info.row === 'van' ? `<h4>Vanguardia ${info.player === 0 ? '(tuya)' : '(rival)'}</h4><p>${GLOSSARY.Vanguardia}</p>` : `<h4>Retaguardia ${info.player === 0 ? '(tuya)' : '(rival)'}</h4><p>${GLOSSARY.Retaguardia}</p><p class="dim">Los Entes con Guardián pueden bloquear desde aquí (salvo en Traición).</p>`;
      case 'soulzone': return `<h4>Zona de Almas ${info.player === 0 ? '(tuya)' : '(rival)'}</h4><p>Absueltas boca arriba a la izquierda del Peregrino (Virtud); condenadas boca abajo a la derecha (Corrupción).</p>`;
      case 'pilgrim': { const p = g.P[info.player]; const P = p.pilgrim; const b = g.balance(info.player);
        const st = k => p.destiny === k ? '<b class="ok">desbloqueada</b>' : p.destiny ? '<b class="bad">sellada</b>' : `bloqueada (${Math.abs(b.diff)}/5 hacia ${b.diff >= 0 ? 'la Virtud' : 'la Corrupción'})`;
        return `<h4>${P.full} · Peregrino ${info.player === 0 ? '(tú)' : '(rival)'}</h4><p class="tag">${P.sendas.map(s => icon(s) + ' ' + SENDAS[s].name).join(' · ')} · Voluntad ${p.will}</p>
        <p><b>Habilidad base</b> (1 vez por turno): ${P.ability.text}</p>${info.player === 0 && g.abilities(0).some(a => a.src === 'pilgrim') ? '<p class="ok">Disponible: haz clic en tu Peregrino.</p>' : ''}
        <p>${icon('halo', '#c9a13a')} <b>Redención</b> — ${st('redencion')}: ${P.redencion.text}</p><p>${icon('horns', '#222')} <b>Caída</b> — ${st('caida')}: ${P.caida.text}</p>
        <p class="dim">No ataca ni bloquea. Aporta sus Sendas como umbral permanente.</p>`; }
      case 'will': return `<h4>Voluntad: ${g.P[info.player].will}</h4><p>${GLOSSARY.Voluntad}</p>`;
      case 'deck': { const p = g.P[info.player]; return info.which === 'main' ? `<h4>Mazo Principal · ${p.main.length}</h4><p>Entes, Ilustres, Ritos, Juicios y Reliquias. Dorso negro, sello en tinta roja.</p>` : `<h4>Mazo de Almas · ${p.soulDeck.length}</h4><p>Tu mazo de recursos. Dorso de papel con el sello en tinta negra.</p>`; }
      case 'olvido': { const p = g.P[info.player]; return `<h4>Olvido · ${p.olvido.length}</h4><p>${GLOSSARY.Olvido}</p><p class="dim">${GLOSSARY.Quemar}</p>`; }
      case 'descenso': { const n = info.circle || g.circle; const C = CIRCLES[n]; return `<h4>${C.roman}. ${C.name}${n === g.circle ? ' · <span class="ok">ACTIVO</span>' : n < g.circle ? ' · <span class="dim">superado</span>' : ''}</h4><p><b>${C.rule}</b></p><p class="dim">Ambiente: ${C.ambiente}. Luz: ${C.luz}.</p>`; }
      case 'd10': return `<h4>d10 del Descenso: ${g.circle}</h4><p>${GLOSSARY.Descenso}</p>`;
      case 'balance': { const b = g.balance(info.player);
        return `<h4>Balanza: ${b.state === 'virtuoso' ? 'Virtuoso' : b.state === 'corrupto' ? 'Corrupto' : 'Tibio'}</h4><p>${b.abs} absueltas · ${b.con} condenadas → <b>${b.diff >= 0 ? '+' : ''}${b.diff}</b>.</p><p>Virtuoso con 3+ de ventaja, Corrupto con 3+ condenadas, Tibio en medio. Con 5: Destino.</p><p class="dim">Platillo dorado: una ficha por Alma absuelta. Platillo negro: una por condenada.</p>`; }
      default: return '';
    }
  }
  statParts(e) {
    const g = this.g; const p = g.P[e.ctrl]; const F = [['base', e.def.f]], R = [['base', e.def.r]];
    if (e.permF || e.permR) { F.push(['para siempre', e.permF]); R.push(['para siempre', e.permR]); }
    if (e.tempF) F.push(['este turno', e.tempF]); if (e.tempR) R.push(['este turno', e.tempR]);
    for (const r of e.attached) { if (r.def.equip.f) F.push([r.def.name, r.def.equip.f]); if (r.def.equip.r) R.push([r.def.name, r.def.equip.r]); }
    for (const s of p.rear) if (s && s.def.apoyo && e.def.senda === s.def.apoyo.senda) F.push([`Apoyo de ${s.def.name}`, s.def.apoyo.f]);
    if (g.circle === 5 && g.rowOf(e) === 'van') F.push(['Círculo V · Ira', 1]);
    const cd = e.def.cond; if (cd && g.balance(e.ctrl).state === cd.state) { if (cd.f) F.push([cd.state === 'virtuoso' ? 'Virtuoso' : 'Corrupto', cd.f]); if (cd.r) R.push([cd.state === 'virtuoso' ? 'Virtuoso' : 'Corrupto', cd.r]); }
    if (p.destiny === 'caida' && p.pid === 'francesca' && e.attacking) F.push(['Caída de Francesca', 1]);
    if (p.destiny === 'redencion' && p.pid === 'francesca' && g.rowOf(e) === 'van') R.push(['Redención de Francesca', 1]);
    return { F, R };
  }
  cardInfoHTML(c) {
    const g = this.g; const d = c.def; const s = c.soul;
    let html = `<h4>${d.name}${d.doc ? ' <span class="docmark">del documento</span>' : ''}</h4>`;
    if (s) html += `<p class="tag">Alma · ${d.senda ? icon(d.senda) + ' ' + SENDAS[d.senda].name : 'Neutral (sin Senda)'}</p><p><b>Condena:</b> ${d.text}</p>`;
    else html += `<p class="tag">${TYPES[d.type].name}${d.sub && d.sub !== TYPES[d.type].name ? ' — ' + d.sub : ''} · ${d.senda ? icon(d.senda) + ' ' + SENDAS[d.senda].name : 'Neutral'} · Coste ${d.cost}${d.req.length ? ' + ' + d.req.map(k => icon(k)).join('') : ''}</p>${d.text ? `<p>${d.text.replace(/\*(.*?)\*/g, '<b>$1</b>').replace(/\{halo\}/g, icon('halo', '#c9a13a')).replace(/\{horns\}/g, icon('horns', '#222'))}</p>` : '<p class="dim">Sin texto: su fuerza está en sus números.</p>'}`;
    if (g && isEnte(c) && g.inPlay(c)) {
      const { F, R } = this.statParts(c); const fmt = arr => arr.map(([k, v]) => `<span class="part">${v >= 0 && k !== 'base' ? '+' : ''}${v} <i>${k}</i></span>`).join('');
      html += `<div class="stat"><span class="big">${g.force(c)}</span> Fuerza = ${fmt(F)}</div><div class="stat"><span class="big">${g.res(c)}</span> Resistencia = ${fmt(R)}${c.damage ? ` <span class="bad">· daño ${c.damage}</span>` : ''}</div>`;
      const st = [];
      if (c.tapped) st.push('agotado'); if (c.sick && c.ctrl === g.active && !g.hasKw(c, 'embestida')) st.push('entró este turno: no puede atacar'); if (c.frozen) st.push('congelado: no se endereza en su próximo Enderezar'); if (c.protectedFrom != null) st.push('no puede ser elegido por Juicios rivales este turno'); if (g.noCombat(c)) st.push('encadenado: no ataca ni bloquea'); if (c.moved) st.push('ya cambió de fila este turno');
      if (st.length) html += `<p class="dim">Estado: ${st.join(' · ')}.</p>`;
    }
    if (g && c.soul && c.zone === 'souls') html += `<p class="dim">${c.faceDown ? 'Condenada: da energía, no aporta Senda.' : 'Absuelta: da energía y aporta su símbolo al umbral.'} ${c.tapped ? 'Agotada este turno.' : c.owner === 0 ? 'Clic para agotarla: +1 de energía.' : ''}</p>`;
    const terms = new Set(); const text = s ? d.text : d.text + ' ' + TYPES[d.type].name;
    for (const k of (d.kw || [])) terms.add(KEYWORDS[k].name);
    if (d.cond) { terms.add(d.cond.state === 'virtuoso' ? 'Virtuoso' : 'Corrupto'); for (const k of d.cond.kw || []) terms.add(KEYWORDS[k].name); }
    if (d.apoyo) terms.add('Apoyo'); if (d.onDeath) terms.add('Al morir'); if (d.onEnter) terms.add('Al entrar');
    if (/Descender/.test(text)) terms.add('Descender'); if (/Balanza/.test(text)) terms.add('Balanza');
    if (!s) terms.add(TYPES[d.type].name); else { terms.add('Absolver'); terms.add('Condenar'); }
    html += `<div class="terms">${[...terms].filter(t => GLOSSARY[t]).map(t => `<p><b>${t}:</b> ${GLOSSARY[t]}</p>`).join('')}</div>`;
    if (g && c.owner === 0 && c.zone === 'hand') {
      const chk = s ? g.canPlaySoul(0, c) : g.canCast(0, c);
      html += chk.ok ? `<p class="ok">✦ Puedes jugarla ahora${s ? '' : ` (coste ${g.cost(0, c)})`}: arrástrala o haz clic.</p>` : chk.reason ? `<p class="bad">✕ ${chk.reason}</p>` : '';
    }
    return html;
  }
  showPreview(c) {
    const pv = $('#preview'); pv.innerHTML = ''; const inHand = c.owner === 0 && c.zone === 'hand';
    if (!inHand) { const img = h('div', 'pv-card'); img.appendChild(cloneCanvas(ART.cardFace(c.id))); pv.appendChild(img); }
    pv.appendChild(h('div', 'pv-info', this.cardInfoHTML(c)));
    pv.classList.toggle('left', (this.mx || 0) > innerWidth * 0.5); pv.classList.toggle('hand', inHand); pv.classList.add('show');
  }
  hidePreview() { $('#preview').classList.remove('show'); }
  inspect(info) {
    if (!info || info.kind !== 'card' || !this.g) return;
    const c = this.g.find(info.uid); if (!c || (c.owner === 1 && c.zone === 'hand') || (c.soul && c.faceDown && c.owner === 1)) return;
    this.modal(`<div class="inspect"><div class="big"></div><div class="info">${this.cardInfoHTML(c)}</div></div>`, [['Cerrar', () => this.closeModal()]]);
    $('.inspect .big').appendChild(cloneCanvas(ART.cardFace(c.id)));
  }

  // ───────────────────────── modales y Códice ─────────────────────────
  modal(html, buttons = [], cls = '') {
    const m = $('#modal'); m.className = 'show ' + cls;
    m.innerHTML = `<div class="m-box">${html}<div class="m-btns"></div></div>`;
    const bb = $('.m-btns', m); for (const [t, fn, c] of buttons) { const b = h('button', 'btn ' + (c || ''), t); b.onclick = () => { this.A.click(); fn(); }; bb.appendChild(b); }
    this.fillIcons(m); return m;
  }
  closeModal() { $('#modal').className = ''; $('#modal').innerHTML = ''; }
  fillIcons(el) {
    el.querySelectorAll('i.ic[data-ic]').forEach(i => { const k = i.dataset.ic; const col = SENDAS[k] ? SENDAS[k].color : k === 'halo' ? '#c9a13a' : k === 'horns' ? '#1a1410' : '#6a5238'; i.outerHTML = icon(k, col); });
    el.querySelectorAll('.seal-inline').forEach(s => { const c = h('canvas'); c.width = c.height = 120; ART.drawSeal(c.getContext('2d'), 60, 60, 56, '#8e1c14'); s.appendChild(c); });
    el.querySelectorAll('canvas[data-back]').forEach(c => { const src = c.dataset.back === 'main' ? ART.backMain() : ART.backSoul(); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); });
  }
  openCodex(id) {
    const groups = {}; for (const s of CODEX) (groups[s.group] = groups[s.group] || []).push(s);
    const nav = Object.entries(groups).map(([gn, list]) => `<div class="cx-g">${gn}</div>` + list.map(s => `<button class="cx-l" data-sec="${s.id}">${s.title}</button>`).join('')).join('');
    const m = this.modal(`<div class="codex"><nav>${nav}<div class="cx-g">Glosario</div><button class="cx-l" data-sec="glosario">Todos los términos</button></nav><article></article></div>`, [['Cerrar Códice', () => this.closeModal()]], 'wide');
    const show = sid => {
      m.querySelectorAll('.cx-l').forEach(b => b.classList.toggle('on', b.dataset.sec === sid));
      const art = $('article', m);
      if (sid === 'glosario') art.innerHTML = `<h2>Glosario</h2>` + Object.entries(GLOSSARY).filter(([k]) => k !== 'Quema').map(([k, v]) => `<p><b>${k}.</b> ${v}</p>`).join('');
      else { const s = CODEX.find(x => x.id === sid); art.innerHTML = `<h2>${s.title}</h2>${s.html}`; }
      this.fillIcons(art); art.scrollTop = 0;
      if (sid === 'galeria') this.buildGallery($('#gallery', art));
    };
    m.querySelectorAll('.cx-l').forEach(b => b.onclick = () => show(b.dataset.sec));
    show(id || 'vision');
  }
  buildGallery(el) {
    const add = (title, ids, isSoul) => {
      el.appendChild(h('h3', '', title)); const grid = h('div', 'gal');
      for (const id of ids) { const f = h('figure'); f.appendChild(cloneCanvas(ART.cardFace(id))); const d = isSoul ? SOULS[id] : CARDS[id]; f.appendChild(h('figcaption', '', `${d.name}${d.doc ? ' · <i>del documento</i>' : ''}`)); f.onclick = () => this.galleryInfo(id, isSoul); grid.appendChild(f); }
      el.appendChild(grid);
    };
    el.appendChild(h('h3', '', 'Peregrinos')); const pg = h('div', 'gal wide');
    for (const pid of ['francesca', 'virgilio']) { const f = h('figure'); f.appendChild(cloneCanvas(ART.pilgrimFace(pid))); f.appendChild(h('figcaption', '', PILGRIMS[pid].full)); pg.appendChild(f); }
    el.appendChild(pg);
    for (const k of [...SENDA_KEYS, null]) add(k ? `Senda de ${SENDAS[k].name}` : 'Neutrales', Object.keys(CARDS).filter(id => CARDS[id].senda === k), false);
    add('Almas', Object.keys(SOULS), true);
    el.appendChild(h('h3', '', 'Dorsos y carta de Descenso'));
    const bg = h('div', 'gal'); for (const [n, cv] of [['Dorso del Mazo Principal', ART.backMain()], ['Dorso del Mazo de Almas', ART.backSoul()], ['Carta de Descenso', ART.descensoCard()]]) { const f = h('figure'); f.appendChild(cloneCanvas(cv)); f.appendChild(h('figcaption', '', n)); bg.appendChild(f); }
    el.appendChild(bg);
  }
  galleryInfo(id, isSoul) {
    const fake = { id, def: isSoul ? SOULS[id] : CARDS[id], soul: isSoul, zone: 'gallery', owner: 0 };
    const g = this.g; this.g = null; const html = this.cardInfoHTML(fake); this.g = g;
    const art = $('#modal article'); const old = $('.gal-info', art); if (old) old.remove();
    const box = h('div', 'gal-info', html); box.prepend(cloneCanvas(ART.cardFace(id)));
    const close = h('button', 'btn ghost', 'Cerrar'); close.onclick = () => box.remove(); box.appendChild(close); art.appendChild(box);
  }

  // ───────────────────────── entrada del jugador ─────────────────────────
  tutorOk(kind, data) {
    if (!this.tutor || !this.tutor.active) return true;
    const r = this.tutor.ok(kind, data, this.g); if (r === true) return true;
    this.toast(r); this.A.fizzle(); const n = $('#narrator'); n.classList.remove('shake'); void n.offsetWidth; n.classList.add('shake'); return false;
  }
  submit(a) {
    if (!this.resolver) return;
    if (a.type !== 'demoDescend' && !this.tutorOk('action', a)) { this.V.sync(250); return; }
    const r = this.resolver; this.resolver = null; this.mode = null;
    this.V.clearHighlights(); this.setButtons(); this.hidePreview(); this.V.handLow = false;
    r(a);
  }
  pick(cands, text, cancellable, color = 0xffd08a, source = null) {
    return new Promise(res => {
      const prevMode = this.mode, prevRes = this.resolver, prevPrompt = $('#prompt').innerHTML;
      const prevBtns = [this.primary ? $('#btnPrimary').innerHTML : null, this.primary, $('#btnSecondary').innerHTML, this.secondary];
      this.mode = 'pick'; this.pickCands = cands;
      const vis = this.tutor && this.tutor.active ? cands.filter(r => this.tutor.ok('pick', r, this.g) === true) : cands;
      this.V.setHighlights(vis, color); this.prompt(text);
      const onBoard = cands.some(r => r.kind !== 'deck');
      if (onBoard) { this.V.handLow = true; this.V.sync(300); }
      if (source) this.V.setAim(source, color, info => cands.some(r => this.matchRef(info, r)));
      const done = v => {
        this.mode = prevMode; this.resolver = prevRes; this.pickDone = null; this.V.clearHighlights(); this.V.setAim(null); this.prompt(prevPrompt);
        if (onBoard) { this.V.handLow = false; this.V.sync(300); }
        this.setButtons(prevBtns[0], prevBtns[1], prevBtns[2], prevBtns[3]);
        if (prevMode === 'action') this.refreshActionHighlights();
        res(v);
      };
      this.pickDone = done;
      this.setButtons(null, null, cancellable ? 'Cancelar (Esc)' : null, cancellable ? () => done(null) : null);
    });
  }
  matchRef(info, r) {
    if (!info) return false;
    if (r.kind === 'card' || r.kind === 'soul') return info.kind === 'card' && info.uid === r.uid;
    if (r.kind === 'chain') { if (info.kind === 'chainToken') return info.id === r.id; if (info.kind === 'card') { const it = this.g.chain.find(x => x.id === r.id); return it && it.card && it.card.uid === info.uid; } return false; }
    if (r.kind === 'slot') return info.kind === 'slot' && info.player === r.player && info.row === r.row && info.idx === r.idx;
    if (r.kind === 'pilgrim') return info.kind === 'pilgrim' && info.player === r.player;
    if (r.kind === 'deck') return info.kind === 'deck' && info.player === r.player && info.which === r.which;
    return false;
  }
  onClick(info, e) {
    this.A.start(); $('#ctxMenu').style.display = 'none';
    const g = this.g; if (!g || !info) return;
    if (this.mode === 'pick') { const r = this.pickCands.find(r => this.matchRef(info, r)); if (r && this.tutorOk('pick', r)) { this.A.click(); this.pickDone(r); } return; }
    if (this.mode === 'attack') return this.attackClick(info);
    if (this.mode === 'block') return this.blockClick(info);
    if (this.mode === 'discard') return this.discardClick(info);
    if (this.mode !== 'action') { if (info.kind === 'card' && g.P[0].hand.some(c => c.uid === info.uid)) this.toast(g.priority === 1 ? 'Espera: el rival tiene la prioridad.' : 'Ahora no puedes jugar cartas.'); return; }
    if (info.kind === 'card') {
      const c = g.find(info.uid); if (!c) return;
      if (c.zone === 'hand' && c.owner === 0) return this.cardFlow(c);
      if (c.zone === 'souls' && c.owner === 0) { if (!c.tapped) { this.A.tap(); return this.submit({ type: 'tap', uid: c.uid }); } return this.toast('Esta Alma ya está agotada: se endereza al inicio de tu turno.'); }
      if (isEnte(c) && c.ctrl === 0) return this.enteMenu(c, e);
    }
    if ((info.kind === 'pilgrim' || info.kind === 'will') && info.player === 0) return this.pilgrimMenu(e);
  }
  ctxMenu(items, e) {
    const m = $('#ctxMenu'); if (!items.length) { m.style.display = 'none'; return; }
    m.innerHTML = ''; for (const [label, fn, dis] of items) { const b = h('button', dis ? 'dis' : '', label); if (!dis) b.onclick = ev => { ev.stopPropagation(); m.style.display = 'none'; fn(); }; m.appendChild(b); }
    m.style.display = 'block'; m.style.left = Math.min(e.clientX, innerWidth - 300) + 'px'; m.style.top = Math.min(e.clientY, innerHeight - 140) + 'px';
  }
  enteMenu(c, e) {
    const g = this.g; const items = []; const row = g.rowOf(c);
    if (g.isMainWindow(0)) items.push([`↕ Mover a ${row === 'van' ? 'Retaguardia' : 'Vanguardia'} (o arrástralo)`, () => this.submit({ type: 'move', uid: c.uid }), !g.canMove(0, c)]);
    if (c.def.ability) {
      const ok = g.abilities(0).some(a => a.src === c.uid);
      items.push([`✦ ${c.def.ability.text}`, async () => {
        const r = await this.pick(g.targets(0, 'otherOwnEnte', false, c), 'Elige otro Ente tuyo para sacrificar.', true, 0xff6a3a, this.V.worldPos(c.uid));
        if (r) this.submit({ type: 'ability', src: c.uid, sacrifice: r.uid });
      }, !ok]);
    }
    if (g.isMainWindow(0) && !g.canMove(0, c)) items.push([c.moved ? 'Ya cambió de fila este turno' : 'No hay hueco libre en la otra fila', () => {}, true]);
    if (!items.length) items.push(['Nada que hacer con este Ente ahora', () => {}, true]);
    this.ctxMenu(items, e);
  }
  pilgrimMenu(e) {
    const g = this.g; const p = g.P[0]; const ab = p.pilgrim.ability; const ok = g.abilities(0).some(a => a.src === 'pilgrim');
    this.ctxMenu([[`✦ ${ab.text.replace('Paga 2', `Paga ${g.abilityCost(0)}`)}`, async () => {
      const act = { type: 'ability', src: 'pilgrim' };
      if (ab.target) { const r = await this.pick(g.targets(0, ab.target, false), `Habilidad de ${p.pilgrim.name}: elige un Ente tuyo.`, true, 0xffd08a, this.V.pilgrimPos(0)); if (!r) return; act.targets = [r]; }
      this.submit(act);
    }, !ok], ...(ok ? [] : [[p.abilityUsed ? 'Ya la usaste este turno' : 'No tienes energía suficiente', () => {}, true]])], e);
  }
  async cardFlow(c) {
    const g = this.g;
    if (c.soul) { const k = g.canPlaySoul(0, c); if (!k.ok) return this.toast(k.reason); return this.submit({ type: 'soul', uid: c.uid }); }
    const chk = g.canCast(0, c); if (!chk.ok) return this.toast(chk.reason);
    if (this.tutor && this.tutor.active && this.tutor.ok('action', { type: 'cast', uid: c.uid }, g) !== true) return this.tutorOk('action', { type: 'cast', uid: c.uid });
    const d = c.def; const act = { type: 'cast', uid: c.uid }; this.V.hoverHand = null;
    const src = () => { const p = this.V.worldPos(c.uid); return p ? p.clone() : null; };
    if (isEnte(c)) {
      const slots = [...g.freeSlots(0, 'van').map(i => ({ kind: 'slot', player: 0, row: 'van', idx: i })), ...g.freeSlots(0, 'rear').map(i => ({ kind: 'slot', player: 0, row: 'rear', idx: i }))];
      const r = await this.pick(slots, `<b>${d.name}</b>: elige su fila. <b>Vanguardia</b> ataca y bloquea · <b>Retaguardia</b> protegida${d.apoyo ? ' y activa su <b>Apoyo</b>' : ''}.`, true);
      if (!r) return; act.row = r.row; act.slot = r.idx;
    }
    if (d.type === 'reliquia') {
      const r = await this.pick(g.attachOptions(0, c), `<b>${d.name}</b>: ${d.attach === 'pilgrim' ? 'se une a tu Peregrino' : d.attach === 'loose' ? 'elige un hueco libre de tu Retaguardia' : 'elige el Ente al que se une'}.`, true, d.harm ? 0xff6a3a : 0xffd08a, src());
      if (!r) return; act.attach = r;
    }
    if (d.target) {
      const r = await this.pick(g.targets(0, d.target, d.type === 'juicio'), `<b>${d.name}</b>: elige objetivo — ${d.text.replace(/\*/g, '')}`, true, d.harm ? 0xff6a3a : 0xffd08a, src());
      if (!r) return; act.targets = [r];
    }
    this.submit(act);
  }
  onDragStart(uid) {
    const g = this.g; const c = g.find(uid); this.hidePreview(); this.showTooltip(null);
    if (g.inPlay(c)) { const to = g.rowOf(c) === 'van' ? 'rear' : 'van'; this.V.setHighlights(g.freeSlots(0, to).map(i => ({ kind: 'slot', player: 0, row: to, idx: i }))); this.prompt(`Suelta a <b>${c.def.name}</b> en un hueco libre de tu ${to === 'van' ? 'Vanguardia' : 'Retaguardia'} (un cambio de fila por Ente y turno).`); return; }
    if (c.soul) this.V.setHighlights([{ kind: 'soulzone', player: 0 }]);
    else if (isEnte(c) && g.canCast(0, c).ok) this.V.setHighlights([...g.freeSlots(0, 'van').map(i => ({ kind: 'slot', player: 0, row: 'van', idx: i })), ...g.freeSlots(0, 'rear').map(i => ({ kind: 'slot', player: 0, row: 'rear', idx: i }))]);
  }
  onDrop(uid, info) {
    const g = this.g; this.V.clearHighlights(); const c = g.find(uid);
    const back = () => { this.V.sync(300); this.refreshActionHighlights(); };
    if (this.mode !== 'action' || !c) return back();
    if (g.inPlay(c)) {
      const to = g.rowOf(c) === 'van' ? 'rear' : 'van';
      if (info && info.kind === 'slot' && info.player === 0 && info.row === to && !g.P[0][to][info.idx]) { this.A.paper(); return this.submit({ type: 'move', uid, slot: info.idx }); }
      if (info && info.kind === 'slot' && info.player === 0 && info.row !== to) this.toast('Ya está en esa fila. Arrástralo a la otra.');
      return back();
    }
    if ((this.my || 0) > innerHeight * 0.84 || !info || info.kind === 'none') return back();
    if (c.soul) { const k = g.canPlaySoul(0, c); if (!k.ok) { this.toast(k.reason); return back(); } return this.submit({ type: 'soul', uid }); }
    const chk = g.canCast(0, c); if (!chk.ok) { this.toast(chk.reason); return back(); }
    if (isEnte(c) && info.kind === 'slot' && info.player === 0 && !g.P[0][info.row][info.idx]) {
      const a = { type: 'cast', uid, row: info.row, slot: info.idx };
      if (this.tutor && this.tutor.active && this.tutor.ok('pick', { kind: 'slot', player: 0, row: info.row, idx: info.idx }, g) !== true) { this.tutorOk('pick', { kind: 'slot', row: info.row }); return back(); }
      this.V.sync(200); return this.submit(a);
    }
    this.V.sync(300); this.cardFlow(c);
  }
  refreshActionHighlights() {
    const g = this.g; if (this.mode !== 'action' || !g) return;
    const refs = []; const tut = this.tutor && this.tutor.active;
    for (const c of g.P[0].hand) {
      const ok = c.soul ? g.canPlaySoul(0, c).ok : g.canCast(0, c).ok;
      if (ok && (!tut || this.tutor.ok('action', c.soul ? { type: 'soul', uid: c.uid } : { type: 'cast', uid: c.uid }, g) === true)) refs.push({ kind: 'card', uid: c.uid });
    }
    if (!tut && g.abilities(0).some(a => a.src === 'pilgrim')) refs.push({ kind: 'pilgrim', player: 0 });
    this.V.setHighlights(refs, 0x7ad8ff);
  }

  // IO del jugador humano
  io() {
    const self = this; const gate = () => self.tutor && self.tutor.active ? self.tutor.gate() : Promise.resolve();
    return {
      async chooseAction(g, pi, label) {
        await gate(); self.g = g; self.update();
        const main = g.isMainWindow(0);
        if (!main) {
          if (!g.hasResponses(0)) { await wait(g.chain.length ? 380 : 120); return { type: 'pass' }; }
          const important = g.chain.length > 0 || label === 'atacantes' || label === 'bloqueadores' || (label === 'final' && g.active !== 0);
          if (!important && !self.pauseAll) { await wait(120); return { type: 'pass' }; }
        }
        return new Promise(res => {
          self.mode = 'action'; self.resolver = a => { if (a && a.type === 'demoDescend') { g.advanceCircle('Descender').then(() => res({ type: 'noop' })); return; } res(a); };
          self.refreshActionHighlights();
          const top = g.chain[g.chain.length - 1];
          if (main) {
            const soulOk = g.P[0].hand.some(c => c.soul && g.canPlaySoul(0, c).ok);
            self.prompt(`${soulOk ? 'Juega <b>1 Alma</b> y ' : ''}juega cartas, mueve Entes o activa habilidades. Las cartas que puedes jugar brillan.`);
            self.setButtons(g.phase === 'main1' ? (g.circle === 1 ? 'Pasar<small>Limbo: sin combate</small>' : 'Ir a combate<small>Fin de la fase principal</small>') : 'Terminar turno<small>Fase final</small>', () => self.submit({ type: 'pass' }));
            if (g.phase === 'main1') self.coach('energia');
          } else {
            self.coach('prioridad');
            self.prompt(top ? `<b>${top.name}</b> (${top.ctrl === 0 ? 'tuyo' : 'del rival'}) está en la Cadena. Responde con un Juicio o una habilidad, o pasa para que se resuelva.` : `Ventana de Juicios ${WINDOW_NAMES[label] || ''}: juega un Juicio o una habilidad, o pasa.`);
            self.setButtons(top ? 'Pasar<small>Dejar que se resuelva</small>' : 'Pasar<small>No responder</small>', () => self.submit({ type: 'pass' }));
          }
        });
      },
      async chooseDrawDeck(g, pi, reason) {
        await gate(); self.g = g; self.update(); self.coach('robo');
        const p = g.P[0];
        return new Promise(async res => {
          let settled = false; const done = v => { if (settled) return; if (!self.tutorOk('draw', v)) return; settled = true; self.pickDone && self.pickDone(null); res(v); };
          const q = reason === 'scry' ? 'Virgilio: ¿de qué mazo miras las 3 cartas superiores?' : `Robo${reason && reason !== 'paso de robo' ? ` (${reason})` : ''}: elige de qué mazo robar.`;
          const pr = self.pick([{ kind: 'deck', player: 0, which: 'main' }, { kind: 'deck', player: 0, which: 'soul' }], q, false);
          self.setButtons(`Mazo Principal<small>${p.main.length} cartas</small>`, () => done('main'), `Mazo de Almas (${p.soulDeck.length})`, () => done('soul'));
          const r = await pr; if (r && !settled) { if (!self.tutorOk('draw', r.which)) { const again = await this.chooseDrawDeck(g, pi, reason); return res(again); } settled = true; res(r.which); }
        });
      },
      async chooseSoulMode(g, pi, s) {
        await gate(); self.g = g; const b = g.balance(0); const d = s.def;
        const after = diff => diff >= 3 ? 'Virtuoso' : diff <= -3 ? 'Corrupto' : 'Tibio';
        const lock = self.tutor && self.tutor.active && self.tutor.step && self.tutor.step.ok && self.tutor.step.ok.soulMode;
        return new Promise(res => {
          const m = self.modal(`<div class="soul-choice"><h2>${d.name}</h2><p class="sub">Cada alma es un dilema. ¿Qué harás con ella?</p>
            <div class="sc-row">
              <div class="sc-opt gold ${lock === 'condemn' ? 'locked' : ''}" data-m="absolve"><div class="sc-h">${icon('halo', '#e8c070')} ABSOLVER</div>
                <ul><li>Entra <b>boca arriba</b>.</li><li>Se agota para dar 1 de energía.</li><li>Aporta ${d.senda ? icon(d.senda) + ' <b>' + SENDAS[d.senda].name + '</b>' : '<b>ningún símbolo</b> (es neutral)'} a tu umbral.</li><li>Balanza → <b>Virtud</b>: ${b.abs + 1} / ${b.con} (<b>${after(b.diff + 1)}</b>).</li></ul></div>
              <div class="sc-card"></div>
              <div class="sc-opt ash ${lock === 'absolve' ? 'locked' : ''}" data-m="condemn"><div class="sc-h">${icon('horns', '#111')} CONDENAR</div>
                <ul><li>Entra <b>boca abajo</b>.</li><li>Se agota para dar 1 de energía.</li><li><b>Condena ahora:</b> ${d.text}</li><li>No aporta Senda. Balanza → <b>Corrupción</b>: ${b.abs} / ${b.con + 1} (<b>${after(b.diff - 1)}</b>).</li></ul></div>
            </div></div>`, lock ? [] : [['Volver a la mano', () => { self.closeModal(); res(null); }, 'ghost']], 'soul');
          $('.sc-card', m).appendChild(cloneCanvas(ART.cardFace(s.id)));
          m.querySelectorAll('.sc-opt').forEach(o => o.onclick = () => { if (!self.tutorOk('soulMode', o.dataset.m)) return; self.A.click(); self.closeModal(); res(o.dataset.m); });
        });
      },
      async chooseTarget(g, pi, cands, prompt, cancellable, spec) {
        await gate(); self.g = g; const r = await self.pick(cands, prompt, false, spec && spec.harm === false ? 0xffd08a : 0xff6a3a); return r || cands[0];
      },
      async chooseLujuria(g, pi, cands) {
        await gate(); self.g = g; self.coach('lujuria');
        const r = await self.pick(cands, '<b>Lujuria</b>: el vendaval te obliga a mover uno de tus Entes a la otra fila. Elige cuál.', false); return r ? r.uid : cands[0].uid;
      },
      async chooseDiscard(g, pi, n, reason) {
        await gate(); self.g = g;
        return new Promise(res => {
          self.mode = 'discard'; self.discardSel = new Set(); self.discardN = n; if (self.V.handMode === 'min') self.toggleHand();
          const upd = () => { self.V.setHighlights([...self.discardSel].map(uid => ({ kind: 'card', uid })), 0xff6a3a); self.setButtons(`Descartar<small>${self.discardSel.size}/${n}</small>`, self.discardSel.size === n ? () => { self.mode = null; self.V.clearHighlights(); self.setButtons(); res([...self.discardSel]); } : () => self.toast(`Elige ${n} carta${n > 1 ? 's' : ''}.`)); };
          self.discardUpd = upd; upd(); self.prompt(`Descarta ${n} carta${n > 1 ? 's' : ''} (${reason}). Haz clic en las cartas de tu mano.`);
        });
      },
      async chooseOrder(g, pi, cards) {
        await gate();
        return new Promise(res => {
          const order = [];
          const m = self.modal(`<h2>Ordena las cartas</h2><p class="sub">Haz clic en el orden en que quieres robarlas: la primera quedará encima.</p><div class="order"></div>`, [['Confirmar', () => { if (order.length !== cards.length) return self.toast('Ordena todas las cartas.'); self.closeModal(); res(order); }], ['Reiniciar', () => { order.length = 0; draw(); }, 'ghost']]);
          const draw = () => { const o = $('.order', m); o.innerHTML = ''; for (const c of cards) { const f = h('figure', order.includes(c) ? 'sel' : ''); f.appendChild(cloneCanvas(ART.cardFace(c.id))); if (order.includes(c)) f.appendChild(h('span', 'ordn', String(order.indexOf(c) + 1))); f.onclick = () => { if (!order.includes(c)) { order.push(c); draw(); } }; o.appendChild(f); } };
          draw();
        });
      },
      async revealHand(g, other) {
        return new Promise(res => {
          const m = self.modal(`<h2>La mano del rival</h2><p class="sub">Fraude: engaño y cartas ocultas. Por un momento, ves lo que esconde.</p><div class="order reveal"></div>`, [['Cerrar', () => { self.closeModal(); res(); }]]);
          const o = $('.order', m); for (const c of g.P[other].hand) { const f = h('figure'); f.appendChild(cloneCanvas(ART.cardFace(c.id))); o.appendChild(f); }
          if (!g.P[other].hand.length) o.innerHTML = '<p>No tiene cartas en la mano.</p>';
        });
      },
      async chooseAttackers(g, pi, cands, mandatory) {
        await gate(); self.g = g;
        return new Promise(res => {
          self.mode = 'attack'; self.atkCands = cands; self.atkMand = mandatory; self.atkSel = new Set(mandatory); self.V.handLow = true;
          for (const u of mandatory) g.find(u).attacking = true;
          const upd = () => {
            self.V.setHighlights(cands.map(uid => ({ kind: 'card', uid })), 0xff6a3a);
            for (const uid of self.atkSel) self.V.highlight({ kind: 'card', uid }, 0xffffff, 1);
            const n = self.atkSel.size; const tot = [...self.atkSel].reduce((s, u) => s + g.force(g.find(u)), 0);
            self.setButtons(n ? `Atacar con ${n}<small>${tot} de Fuerza en total</small>` : 'No atacar<small>Saltar el combate</small>', () => {
              if (!self.tutorOk('attackConfirm', [...self.atkSel])) return;
              for (const u of cands) g.find(u).attacking = false; self.mode = null; self.V.handLow = false; self.V.clearHighlights(); self.setButtons(); res([...self.atkSel]);
            });
            self.V.sync(300);
          };
          self.atkUpd = upd; upd();
          self.prompt(`<b>Declarar atacantes:</b> haz clic en tus Entes de Vanguardia. Todos atacan al Peregrino rival.${mandatory.length ? ' Los que tienen <b>Ira ciega</b> deben atacar.' : ''}`);
        });
      },
      async chooseBlocks(g, pi, attackers, cands) {
        await gate(); self.g = g;
        return new Promise(res => {
          self.mode = 'block'; self.blkAtt = attackers; self.blkCands = cands; self.blkMap = {}; self.blkSel = null; self.V.handLow = true;
          const upd = () => {
            self.V.setHighlights(attackers.map(uid => ({ kind: 'card', uid })), 0xff4a2a);
            for (const u of cands) self.V.highlight({ kind: 'card', uid: u }, Object.values(self.blkMap).includes(u) ? 0xffffff : 0x7ad8ff, u === self.blkSel ? 1 : 0.75);
            const n = Object.keys(self.blkMap).length;
            self.setButtons(n ? `Confirmar ${n} bloqueo${n > 1 ? 's' : ''}` : 'No bloquear<small>Recibir el daño</small>', () => { for (const u of cands) g.find(u).blocking = null; self.mode = null; self.V.handLow = false; self.V.setAim(null); self.V.clearHighlights(); self.setButtons(); res({ ...self.blkMap }); });
            self.V.sync(300);
          };
          self.blkUpd = upd; upd();
          const inc = attackers.reduce((s, u) => s + g.force(g.find(u)), 0);
          self.prompt(`<b>Te atacan por ${inc}.</b> Elige un Ente tuyo (azul) y luego el atacante (rojo) al que bloquea. ${attackers.some(u => g.hasKw(g.find(u), 'vuelo')) ? 'Los atacantes con <b>Vuelo</b> solo pueden ser bloqueados por Entes con Vuelo.' : ''}`);
        });
      },
    };
  }
  attackClick(info) {
    if (info.kind !== 'card' || !this.atkCands.includes(info.uid)) return;
    if (this.atkMand.includes(info.uid)) return this.toast('Ira ciega: debe atacar cada turno si puede.');
    if (!this.tutorOk('attackToggle', info.uid)) return;
    const c = this.g.find(info.uid);
    if (this.atkSel.has(info.uid)) { this.atkSel.delete(info.uid); c.attacking = false; } else { this.atkSel.add(info.uid); c.attacking = true; }
    this.A.paper(); this.atkUpd();
  }
  blockClick(info) {
    const g = this.g; if (info.kind !== 'card') return;
    if (this.blkCands.includes(info.uid)) {
      const assigned = Object.entries(this.blkMap).find(([a, b]) => b === info.uid);
      if (assigned) { delete this.blkMap[assigned[0]]; g.find(info.uid).blocking = null; this.blkSel = null; this.V.setAim(null); this.blkUpd(); return; }
      this.blkSel = info.uid; this.V.setAim(this.V.worldPos(info.uid), 0x7ad8ff, i => i && i.kind === 'card' && this.blkAtt.includes(i.uid));
      this.prompt('Ahora haz clic en el atacante que quieres bloquear.'); this.blkUpd(); return;
    }
    if (this.blkAtt.includes(info.uid)) {
      if (!this.blkSel) return this.toast('Primero elige uno de tus Entes (en azul).');
      const a = g.find(info.uid), b = g.find(this.blkSel);
      if (!g.canBlock(b, a)) return this.toast('Vuelo: solo puede ser bloqueado por Entes con Vuelo.');
      if (this.blkMap[info.uid]) g.find(this.blkMap[info.uid]).blocking = null;
      this.blkMap[info.uid] = this.blkSel; b.blocking = a.uid; this.blkSel = null; this.V.setAim(null); this.A.thump(); this.blkUpd();
    }
  }
  discardClick(info) {
    if (info.kind !== 'card' || !this.g.P[0].hand.some(c => c.uid === info.uid)) return;
    if (this.discardSel.has(info.uid)) this.discardSel.delete(info.uid); else if (this.discardSel.size < this.discardN) this.discardSel.add(info.uid);
    this.discardUpd();
  }
  cancelAll() {
    if (this.pickDone) this.pickDone(null);
    if (this.resolver) { const r = this.resolver; this.resolver = null; r({ type: 'pass' }); }
    this.mode = null; this.closeModal(); this.setButtons(); this.prompt(''); this.V.clearHighlights(); this.V.setAim(null); this.V.handLow = false;
  }

  // ───────────────────────── fin de partida ─────────────────────────
  async gameOver(e) {
    const g = this.g; this.mode = null; this.setButtons(); this.prompt('');
    if (e.reason === 'juicioFinal') await wait(2600);
    const win = e.winner === 0, draw = e.winner == null;
    let detail = '';
    if (e.reason === 'voluntad') detail = `<p><b>Derrota del Peregrino.</b> ${e.detail}</p>`;
    if (e.reason === 'agotamiento') detail = `<p><b>Agotamiento.</b> ${e.detail}</p>`;
    if (e.reason === 'juicioFinal') {
      const D = e.detail; const st = s => s === 'virtuoso' ? 'Virtuoso' : s === 'corrupto' ? 'Corrupto' : 'Tibio';
      detail = `<p><b>Juicio Final.</b> Terminó la ronda del Noveno Círculo.</p>
      <table class="judg"><tr><th></th><th>Tú (${g.P[0].pilgrim.name})</th><th>Rival (${g.P[1].pilgrim.name})</th></tr>
      <tr><td>Voluntad</td><td class="${D.by === 'will' && win ? 'ok' : ''}">${D.will[0]}</td><td class="${D.by === 'will' && !win && !draw ? 'ok' : ''}">${D.will[1]}</td></tr>
      <tr><td>Distancia al centro de la Balanza</td><td class="${D.by === 'balanza' && win ? 'ok' : ''}">${Math.abs(D.diff[0])} (${st(D.state[0])})</td><td class="${D.by === 'balanza' && !win && !draw ? 'ok' : ''}">${Math.abs(D.diff[1])} (${st(D.state[1])})</td></tr></table>
      <p>${D.by === 'will' ? 'Gana quien tiene más Voluntad.' : D.by === 'balanza' ? 'Empate de Voluntad: gana quien está más lejos del centro de la Balanza. El tibio pierde los empates.' : 'Empate de Voluntad y de distancia a la Balanza: tablas.'}</p>`;
    }
    const tut = this.tutor && this.tutor.active;
    this.modal(`<div class="over"><div class="ov-t ${draw ? '' : win ? 'win' : 'lose'}">${draw ? 'TABLAS' : win ? 'VICTORIA' : 'DERROTA'}</div>${detail}
      <h3>Las tres formas de terminar una partida</h3>
      <ul class="endings"><li class="${e.reason === 'voluntad' ? 'on' : ''}"><b>Derrota del Peregrino:</b> su Voluntad llega a 0.</li>
      <li class="${e.reason === 'agotamiento' ? 'on' : ''}"><b>Agotamiento:</b> debes robar y no quedan cartas en ninguno de tus dos mazos.</li>
      <li class="${e.reason === 'juicioFinal' ? 'on' : ''}"><b>Juicio Final:</b> tras la ronda del Círculo IX gana más Voluntad; en empate, quien esté más lejos del centro de la Balanza (el tibio pierde); si no, tablas.</li></ul></div>`,
      tut ? [['Continuar ▸', () => { this.closeModal(); this.tutor.onEvent('gameOver', e, g); }]] : [['Jugar otra vez', () => location.reload()], ['Abrir el Códice', () => this.openCodex('victoria'), 'ghost']], 'over');
    this.A.judgment();
  }

  // ───────────────────────── portada, lecciones y selección ─────────────────────────
  title() {
    return new Promise(res => {
      const m = $('#modal'); m.className = 'show title';
      m.innerHTML = `<div class="title-screen"><div class="title-logo"><img class="tl-glow" src="assets/mark-white.png" alt=""><img class="tl-mark" src="assets/mark-light.png" alt=""></div>
        <h1><img src="assets/word-light.png" alt="SULPHUR"></h1><p class="tagline">Un juego de cartas 1 contra 1 en el Infierno de Dante</p>
        <p class="pitch">Cada alma puede ser absuelta o condenada. Desciende por los nueve Círculos, inclina tu Balanza y llega al Juicio.</p>
        <div class="t-btns"><button class="btn big" data-t="learn">Aprender a jugar<small>4 lecciones guiadas</small></button><button class="btn big alt" data-t="play">Partida libre<small>contra un rival de práctica</small></button><button class="btn ghost" data-t="codex">Códice: reglas y arte</button></div>
        <p class="fine">Demo basada íntegramente en «Núcleo de reglas» y «Dirección artística».</p></div>`;
      m.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
        this.A.start(); this.A.click(); const t = b.dataset.t;
        if (t === 'codex') { this.openCodex(); const obs = setInterval(() => { if (!$('#modal').classList.contains('show')) { clearInterval(obs); this.title().then(res); } }, 300); return; }
        res(t);
      });
    });
  }
  lessonMenu(lessons, done) {
    return new Promise(res => {
      const m = $('#modal'); m.className = 'show select';
      m.innerHTML = `<div class="lessons"><h2>Aprender a jugar</h2><p class="sub">Cuatro lecciones cortas en escenarios preparados. La voz del Libro te guía paso a paso; tú juegas cada acción.</p>
        <div class="ls">${lessons.map((l, i) => `<button class="ls-it ${done.includes(l.id) ? 'done' : ''}" data-i="${i}"><span class="ls-n">${['I', 'II', 'III', 'IV'][i]}</span><span class="ls-t"><b>${l.title}</b><small>${l.sub}</small></span><span class="ls-s">${done.includes(l.id) ? '✦ Completada' : 'Empezar ▸'}</span></button>`).join('')}</div>
        <div class="t-btns"><button class="btn alt" data-x="play">Partida libre ▸</button><button class="btn ghost" data-x="back">Volver a la portada</button></div></div>`;
      m.querySelectorAll('.ls-it').forEach(b => b.onclick = () => { this.A.click(); this.closeModal(); res({ lesson: +b.dataset.i }); });
      m.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { this.A.click(); this.closeModal(); res({ go: b.dataset.x }); });
    });
  }
  choosePilgrim() {
    return new Promise(res => {
      const m = $('#modal'); m.className = 'show select';
      const card = pid => { const P = PILGRIMS[pid];
        return `<div class="pil" data-p="${pid}"><div class="pil-c"></div><div class="pil-t"><h3>${P.full}</h3><p class="tag">${P.sendas.map(s => icon(s) + ' ' + SENDAS[s].name).join(' · ')} · Voluntad ${P.will}</p><p>${P.blurb}</p>
        <p class="dim">Habilidad base: ${P.ability.text}<br>${icon('halo', '#c9a13a')} Redención: ${P.redencion.text}<br>${icon('horns', '#222')} Caída: ${P.caida.text}</p><button class="btn">Elegir a ${P.name}</button></div></div>`; };
      m.innerHTML = `<div class="select-screen"><h2>Elige tu Peregrino</h2><p class="sub">Tu líder y tu identidad: define tus Sendas, tiene 20 de Voluntad y no ataca ni bloquea. El rival llevará al otro.</p>
        <div class="pils">${card('francesca')}${card('virgilio')}</div><p class="locked">Otros Peregrinos del documento, no jugables en esta demo: Dante · Eneas · Farinata · Ulises</p></div>`;
      for (const pid of ['francesca', 'virgilio']) $(`[data-p="${pid}"] .pil-c`, m).appendChild(cloneCanvas(ART.pilgrimFace(pid)));
      m.querySelectorAll('.pil').forEach(p => p.onclick = () => { this.A.click(); this.closeModal(); res(p.dataset.p); });
    });
  }
}
