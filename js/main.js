// SULPHUR — arranque: portada, lecciones guiadas y partida libre.
import { loadFonts, cardFace, setLogo } from './art.js';
import { View } from './view.js';
import { UI } from './ui.js';
import { Game } from './engine.js';
import { RivalAI } from './ai.js';
import { Audio } from './audio.js';
import { PILGRIMS } from './data.js';
import { LESSONS, ScriptedAI, Tutor } from './tutorial.js';

const store = { get() { try { return JSON.parse(localStorage.getItem('sulphurLessons') || '[]'); } catch (e) { return []; } }, add(id) { try { const s = new Set(this.get()); s.add(id); localStorage.setItem('sulphurLessons', JSON.stringify([...s])); } catch (e) { } } };

function warmTextures(pids) {
  const ids = [...new Set(pids.flatMap(p => [...Object.keys(PILGRIMS[p].deck), ...Object.keys(PILGRIMS[p].souls)]))];
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
  warmTextures(['francesca', 'virgilio']);

  let current = null;
  const endCurrent = () => { if (current) { current.aborted = true; ui.cancelAll(); current = null; } };

  async function playLesson(i) {
    const L = LESSONS[i];
    const tutor = new Tutor(ui); ui.tutor = tutor;
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
    const pid = await ui.choosePilgrim();
    const aiPid = pid === 'francesca' ? 'virgilio' : 'francesca';
    const g = new Game({ humanPid: pid, aiPid, io: [ui.io(), new RivalAI()], view, hooks: ui.hooks() });
    current = g; ui.g = g; view.setGame(g); ui.update();
    g.run();
  }
  async function home() {
    const start = sessionStorage.getItem('sulphurStart'); sessionStorage.removeItem('sulphurStart');
    const choice = start || await ui.title();
    if (choice === 'learn') return learn();
    return freePlay();
  }
  home();
})();
