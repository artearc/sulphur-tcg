// SULPHUR — arranque: portada, lecciones guiadas, partida contra la IA, multijugador, mazos y datos del playtest.
import { loadFonts, cardFace, setLogo } from './art.js';
import { View } from './view.js';
import { UI } from './ui.js';
import { Game } from './engine.js';
import { RivalAI } from './ai.js';
import { Audio } from './audio.js';
import { PILGRIMS, validateDeck } from './data.js';
import { LESSONS, ScriptedAI, Tutor } from './tutorial.js';
import { Recorder } from './stats.js';
import { Net, localNetIO, remoteNetIO } from './net.js';
import { openDeckBuilder } from './decks.js';

const store = { get() { try { return JSON.parse(localStorage.getItem('sulphurLessons') || '[]'); } catch (e) { return []; } }, add(id) { try { const s = new Set(this.get()); s.add(id); localStorage.setItem('sulphurLessons', JSON.stringify([...s])); } catch (e) { } } };

function warmTextures(decks) {
  const ids = [...new Set(decks.flatMap(d => [...Object.keys(d.main), ...Object.keys(d.souls)]))];
  const idle = window.requestIdleCallback || (fn => setTimeout(() => fn({ timeRemaining: () => 8 }), 60));
  const warm = dl => { while (ids.length && dl.timeRemaining() > 4) cardFace(ids.shift()); if (ids.length) idle(warm); };
  idle(warm);
}

(async () => {
  const loading = document.getElementById('loading');
  await loadFonts();
  const logo = new Image(); logo.src = 'assets/mark-ink.png';
  try { await logo.decode(); setLogo(logo); } catch (e) { /* sin logo: se usa el sello dibujado */ }
  const audio = new Audio();
  const view = new View(document.getElementById('stage'));
  view.audio = audio;
  const ui = new UI(view, audio);
  loading.classList.add('gone'); setTimeout(() => loading.remove(), 900);

  let current = null;
  const endCurrent = () => { if (current) { current.aborted = true; ui.cancelAll(); current = null; } };

  // Los eventos del motor alimentan a la vez la interfaz y el registro de la partida.
  function recordedHooks(meta) {
    const rec = new Recorder(meta); ui.recorder = rec;
    const H = ui.hooks(); const ev = H.event;
    H.event = (name, d, g) => { ev(name, d, g); try { rec.on(name, d, g); } catch (e) { console.warn(e); } };
    return H;
  }
  function begin(g) { current = g; ui.g = g; view.setGame(g); ui.update(); g.run(); }

  async function playLesson(i) {
    const L = LESSONS[i];
    const tutor = new Tutor(ui); ui.tutor = tutor; ui.recorder = null;
    const g = new Game({ humanPid: 'francesca', aiPid: 'virgilio', io: [ui.io(), gatedAI(new ScriptedAI(L.ai), tutor)], view, hooks: ui.hooks() });
    g.loadScenario(L.setup); current = g;
    ui.g = g; view.setGame(g); ui.update();
    let exited = false;
    const finished = new Promise(res => { ui.exitLesson = () => { exited = true; tutor.stop(); res(); }; });
    const lessonDone = tutor.start(L);
    g.runScenario();
    await Promise.race([lessonDone, finished]);
    if (!exited) store.add(L.id);
    tutor.stop(); ui.tutor = null; endCurrent();
    return exited ? 'menu' : 'next';
  }
  function gatedAI(ai, tutor) {
    return new Proxy(ai, { get(t, k) { const v = t[k]; if (typeof v !== 'function' || !k.startsWith('choose')) return typeof v === 'function' ? v.bind(t) : v; return async (...a) => { await tutor.gate(); return v.apply(t, a); }; } });
  }
  async function learn(start = null) {
    let i = start;
    while (true) {
      if (i == null) {
        const r = await ui.lessonMenu(LESSONS, store.get());
        if (r.go === 'play') return freePlay();
        if (r.go === 'back') return home();
        i = r.lesson;
      }
      const res = await playLesson(i);
      i = res === 'next' && i + 1 < LESSONS.length ? i + 1 : null;
    }
  }

  async function freePlay() {
    const s = await ui.setupScreen();
    if (!s) return home();
    if (s.go === 'decks') { await openDeckBuilder(ui); return freePlay(); }
    const rivalDeck = null; // el rival usa el mazo sugerido de su Peregrino
    warmTextures([s.deck]);
    const hooks = recordedHooks({ mode: 'ia', level: s.level, pilgrims: [s.pid, s.rivalPid], deckName: s.deckName });
    const g = new Game({ humanPid: s.pid, aiPid: s.rivalPid, decks: [s.deck, rivalDeck], io: [ui.io(), new RivalAI(s.level)], view, hooks });
    ui.toast(`Tu rival: <b>${PILGRIMS[s.rivalPid].full}</b> · nivel ${{ facil: 'Fácil', normal: 'Normal', dificil: 'Difícil' }[s.level]}`, 3500);
    begin(g);
  }

  async function decks() { await openDeckBuilder(ui); return home(); }

  // Multijugador: el anfitrión fija la semilla y quién empieza; los dos motores avanzan con las mismas decisiones.
  async function online() {
    const net = new Net();
    const role = await ui.lobby(net);
    if (!role) return home();
    const mine = await ui.setupScreen({ online: true });
    if (!mine || mine.go) { net.close(); if (mine && mine.go === 'decks') await openDeckBuilder(ui); return home(); }
    const hello = { pid: mine.pid, deck: mine.deck };
    ui.net = net;
    ui.prompt('Esperando a que tu rival elija Peregrino…');
    net.on('close', () => { if (current && !current.over) ui.modal('<h2>Conexión perdida</h2><p>Tu rival se ha desconectado. La partida no puede continuar.</p>', [['Volver al menú', () => location.reload()]]); });
    net.on('error', e => ui.toast('Error de red: ' + (e.type || e.message), 6000));
    const start = cfg => {
      const seats = role === 'host' ? [0, 1] : [1, 0];
      const byS = [cfg.host, cfg.guest]; const me = byS[seats[0]], them = byS[seats[1]];
      if (!validateDeck(them.pid, them.deck.main, them.deck.souls).ok) { ui.toast('El mazo del rival no es válido: se usa su mazo sugerido.', 5000); them.deck = null; }
      warmTextures([me.deck, them.deck || { main: PILGRIMS[them.pid].deck, souls: PILGRIMS[them.pid].souls }]);
      const hooks = recordedHooks({ mode: 'multi', pilgrims: [me.pid, them.pid], role });
      const g = new Game({ humanPid: me.pid, aiPid: them.pid, decks: [me.deck, them.deck], seed: cfg.seed, seats, first: seats.indexOf(cfg.firstSeat),
        io: [localNetIO(ui.io(), net), remoteNetIO(net, ui)], view, hooks });
      g.online = true;
      begin(g);
    };
    if (role === 'host') {
      net.on('hello', m => {
        const cfg = { seed: Math.floor(Math.random() * 2 ** 31), firstSeat: Math.random() < 0.5 ? 0 : 1, host: hello, guest: { pid: m.pid, deck: m.deck } };
        net.send({ t: 'start', ...cfg }); start(cfg);
      });
      net.send({ t: 'ready' });
    } else {
      net.on('start', m => start(m));
      net.send({ t: 'hello', ...hello });
    }
  }

  async function home() {
    ui.net = null;
    const start = sessionStorage.getItem('sulphurStart'); sessionStorage.removeItem('sulphurStart');
    const choice = start || await ui.title();
    if (choice === 'learn') return learn();
    if (choice === 'online') return online();
    if (choice === 'decks') return decks();
    return freePlay();
  }
  home();
})();
