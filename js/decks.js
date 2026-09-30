// SULPHUR — constructor de mazos y almacenamiento (localStorage + códigos para compartir).
import { CARDS, SOULS, PILGRIMS, PILGRIM_IDS, SENDAS, SENDA_KEYS, TYPES, validateDeck, legalFor, suggestedDeck } from './data.js';
import * as ART from './art.js';

const KEY = 'sulphurDecks';
export function loadDecks() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
export function saveDecks(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { } }
export function encodeDeck(d) { return 'SUL1:' + btoa(unescape(encodeURIComponent(JSON.stringify({ n: d.name, p: d.pid, m: d.main, s: d.souls })))); }
export function decodeDeck(code) {
  const t = (code || '').trim(); if (!t.startsWith('SUL1:')) throw new Error('Código no válido');
  const o = JSON.parse(decodeURIComponent(escape(atob(t.slice(5))))); if (!PILGRIMS[o.p]) throw new Error('Peregrino desconocido');
  return { name: o.n || 'Mazo importado', pid: o.p, main: o.m || {}, souls: o.s || {} };
}
// Opciones de mazo para un Peregrino: el sugerido + los guardados que sean legales.
export function deckOptions(pid) {
  const opts = [{ key: 'sug', name: 'Mazo sugerido', deck: suggestedDeck(pid) }];
  loadDecks().forEach((d, i) => { if (d.pid === pid && validateDeck(pid, d.main, d.souls).ok) opts.push({ key: 'saved' + i, name: d.name, deck: { main: d.main, souls: d.souls } }); });
  return opts;
}

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const icon = (k, col) => `<img class="ic" src="${ART.iconCanvas(k, 48, col || (SENDAS[k] ? SENDAS[k].color : '#e6d6b4'), '#140d08').toDataURL()}" alt="">`;
const thumbCache = new Map();
function thumb(id) { if (!thumbCache.has(id)) { const cv = ART.cardFace(id); const t = ART.mkCanvas(172, 240); t.getContext('2d').drawImage(cv, 0, 0, 172, 240); thumbCache.set(id, t.toDataURL('image/jpeg', 0.85)); } return thumbCache.get(id); }

export function openDeckBuilder(ui, initial) {
  return new Promise(done => {
    const m = document.getElementById('modal'); m.className = 'show builder';
    let cur = initial ? JSON.parse(JSON.stringify(initial)) : { name: 'Mi mazo', pid: 'francesca', ...suggestedDeck('francesca') };
    let editingIndex = initial && initial._index != null ? initial._index : null;
    const f = { senda: 'all', type: 'all', q: '', cost: 'all' };
    m.innerHTML = `<div class="db">
      <div class="db-top"><h2>Constructor de mazos</h2>
        <div class="db-pils">${PILGRIM_IDS.map(pid => `<button class="db-pil" data-p="${pid}"><b>${PILGRIMS[pid].name}</b><span>${PILGRIMS[pid].sendas.map(s => icon(s)).join('')}</span></button>`).join('')}</div>
        <button class="btn ghost" data-a="close">Cerrar</button></div>
      <div class="db-body">
        <div class="db-pool">
          <div class="db-filters">
            <input class="db-q" placeholder="Buscar nombre o texto…">
            <select class="db-type"><option value="all">Todos los tipos</option>${['ente', 'ilustre', 'rito', 'juicio', 'reliquia', 'alma'].map(t => `<option value="${t}">${TYPES[t].name}</option>`).join('')}</select>
            <select class="db-cost"><option value="all">Cualquier coste</option>${[1, 2, 3, 4, 5, 6, 7].map(c => `<option value="${c}">${c}${c === 7 ? '+' : ''}</option>`).join('')}</select>
            <span class="db-sendas"></span>
          </div>
          <div class="db-grid"></div>
        </div>
        <div class="db-deck">
          <input class="db-name" value="">
          <div class="db-count"></div>
          <div class="db-curve"></div>
          <div class="db-list"></div>
          <div class="db-errs"></div>
          <div class="db-btns">
            <button class="btn" data-a="save">Guardar</button>
            <button class="btn ghost" data-a="suggest">Mazo sugerido</button>
            <button class="btn ghost" data-a="clear">Vaciar</button>
            <button class="btn ghost" data-a="new">Nuevo</button>
            <button class="btn ghost" data-a="export">Copiar código</button>
            <button class="btn ghost" data-a="import">Importar código</button>
          </div>
          <div class="db-saved"></div>
        </div>
      </div></div>`;
    const $ = s => m.querySelector(s);
    const setPilgrim = pid => {
      if (pid === cur.pid) return;
      cur.pid = pid;
      for (const zone of ['main', 'souls']) for (const id of Object.keys(cur[zone])) if (!legalFor(pid, id)) delete cur[zone][id];
      render();
    };
    const add = id => {
      const isSoul = !!SOULS[id] && !CARDS[id]; const zone = isSoul ? 'souls' : 'main'; const d = isSoul ? SOULS[id] : CARDS[id];
      if (!legalFor(cur.pid, id)) return ui.toast(`${d.name} no es de las Sendas de ${PILGRIMS[cur.pid].name}.`);
      const n = cur[zone][id] || 0; const total = Object.values(cur[zone]).reduce((a, b) => a + b, 0);
      if (!isSoul && d.type === 'ilustre' && n >= 1) return ui.toast('Los Ilustres van 1 por mazo.');
      if (!isSoul && n >= 3) return ui.toast('Máximo 3 copias por nombre.');
      if (total >= (isSoul ? 20 : 50)) return ui.toast(isSoul ? 'El Mazo de Almas ya tiene 20.' : 'El Mazo Principal ya tiene 50.');
      cur[zone][id] = n + 1; ui.A.paper(); renderDeck();
    };
    const remove = id => { const zone = cur.souls[id] != null && !CARDS[id] ? 'souls' : 'main'; if (!cur[zone][id]) return; cur[zone][id]--; if (!cur[zone][id]) delete cur[zone][id]; renderDeck(); };
    const renderPool = () => {
      const P = PILGRIMS[cur.pid];
      $('.db-sendas').innerHTML = ['all', ...P.sendas, 'neutral'].map(k => `<button class="db-sf ${f.senda === k ? 'on' : ''}" data-s="${k}">${k === 'all' ? 'Todas' : k === 'neutral' ? 'Neutrales' : icon(k) + SENDAS[k].name}</button>`).join('');
      $('.db-sendas').querySelectorAll('[data-s]').forEach(b => b.onclick = () => { f.senda = b.dataset.s; renderPool(); });
      const ids = [...Object.keys(CARDS), ...Object.keys(SOULS)].filter(id => legalFor(cur.pid, id));
      const list = ids.filter(id => {
        const isSoul = !!SOULS[id] && !CARDS[id]; const d = isSoul ? SOULS[id] : CARDS[id];
        if (f.senda === 'neutral' && d.senda) return false; if (f.senda !== 'all' && f.senda !== 'neutral' && d.senda !== f.senda) return false;
        const type = isSoul ? 'alma' : d.type; if (f.type !== 'all' && type !== f.type) return false;
        if (f.cost !== 'all' && (isSoul || (+f.cost === 7 ? d.cost < 7 : d.cost !== +f.cost))) return false;
        if (f.q && !(d.name + ' ' + (d.text || '') + ' ' + (d.sub || '')).toLowerCase().includes(f.q.toLowerCase())) return false;
        return true;
      }).sort((a, b) => { const A = CARDS[a] || { cost: 99 }, B = CARDS[b] || { cost: 99 }; return (A.cost - B.cost) || (A.name || SOULS[a].name).localeCompare(B.name || SOULS[b].name); });
      const grid = $('.db-grid'); grid.innerHTML = '';
      for (const id of list) {
        const d = CARDS[id] || SOULS[id]; const fig = h('figure', 'db-card'); fig.title = d.name;
        const img = h('img'); img.loading = 'lazy'; img.src = thumb(id); fig.appendChild(img);
        const n = (cur.main[id] || 0) + (!CARDS[id] ? (cur.souls[id] || 0) : 0); if (n) fig.appendChild(h('span', 'db-n', '×' + n));
        fig.onclick = () => { add(id); renderPool(); };
        fig.oncontextmenu = e => { e.preventDefault(); remove(id); renderPool(); };
        fig.onmouseenter = () => ui.previewDef && ui.previewDef(id);
        fig.onmouseleave = () => ui.hidePreview();
        grid.appendChild(fig);
      }
    };
    const renderDeck = () => {
      $('.db-name').value = cur.name;
      m.querySelectorAll('.db-pil').forEach(b => b.classList.toggle('on', b.dataset.p === cur.pid));
      const v = validateDeck(cur.pid, cur.main, cur.souls);
      $('.db-count').innerHTML = `<span class="${v.nm === 50 ? 'ok' : 'bad'}">Principal ${v.nm}/50</span> · <span class="${v.ns === 20 ? 'ok' : 'bad'}">Almas ${v.ns}/20</span>`;
      const curve = [0, 0, 0, 0, 0, 0, 0, 0]; const pips = {};
      for (const [id, n] of Object.entries(cur.main)) { const d = CARDS[id]; curve[Math.min(7, d.cost)] += n; for (const k of d.req) pips[k] = (pips[k] || 0) + n; }
      const mx = Math.max(1, ...curve);
      $('.db-curve').innerHTML = `<div class="dc-bars">${curve.slice(1).map((c, i) => `<div class="dc-b"><i style="height:${c / mx * 100}%"></i><span>${i + 1}${i === 6 ? '+' : ''}</span><em>${c}</em></div>`).join('')}</div>
        <div class="dc-pips">${Object.entries(pips).map(([k, n]) => `${icon(k)} ${n}`).join(' · ') || '<span class="dim">sin requisitos de Senda</span>'}</div>`;
      const groups = [['Entes e Ilustres', id => ['ente', 'ilustre'].includes(CARDS[id].type)], ['Ritos', id => CARDS[id].type === 'rito'], ['Juicios', id => CARDS[id].type === 'juicio'], ['Reliquias', id => CARDS[id].type === 'reliquia']];
      let html = '';
      for (const [title, test] of groups) {
        const ids = Object.keys(cur.main).filter(test).sort((a, b) => CARDS[a].cost - CARDS[b].cost);
        if (!ids.length) continue;
        html += `<div class="dl-g">${title} (${ids.reduce((s, id) => s + cur.main[id], 0)})</div>` + ids.map(id => `<div class="dl-r" data-id="${id}"><span class="dl-c">${CARDS[id].cost}</span>${CARDS[id].senda ? icon(CARDS[id].senda) : ''}<span class="dl-nm">${CARDS[id].name}</span><span class="dl-x">×${cur.main[id]}</span><button data-r="${id}">−</button><button data-a2="${id}">+</button></div>`).join('');
      }
      const sids = Object.keys(cur.souls);
      if (sids.length) html += `<div class="dl-g">Almas (${sids.reduce((s, id) => s + cur.souls[id], 0)})</div>` + sids.map(id => `<div class="dl-r"><span class="dl-c">✦</span>${SOULS[id].senda ? icon(SOULS[id].senda) : ''}<span class="dl-nm">${SOULS[id].name}</span><span class="dl-x">×${cur.souls[id]}</span><button data-r="${id}">−</button><button data-a2="${id}">+</button></div>`).join('');
      $('.db-list').innerHTML = html || '<p class="dim">Haz clic en las cartas de la izquierda para añadirlas (clic derecho para quitar).</p>';
      $('.db-list').querySelectorAll('[data-r]').forEach(b => b.onclick = () => { remove(b.dataset.r); renderPool(); });
      $('.db-list').querySelectorAll('[data-a2]').forEach(b => b.onclick = () => { add(b.dataset.a2); renderPool(); });
      $('.db-errs').innerHTML = v.ok ? '<span class="ok">✦ Mazo legal: listo para jugar.</span>' : v.errs.slice(0, 4).map(e => `<div class="bad">✕ ${e}</div>`).join('');
      const saved = loadDecks();
      $('.db-saved').innerHTML = saved.length ? `<div class="dl-g">Mazos guardados</div>` + saved.map((d, i) => `<div class="ds-r"><button data-load="${i}">${d.name} <span class="dim">· ${PILGRIMS[d.pid].name}${validateDeck(d.pid, d.main, d.souls).ok ? '' : ' · incompleto'}</span></button><button data-del="${i}" title="Borrar">✕</button></div>`).join('') : '';
      $('.db-saved').querySelectorAll('[data-load]').forEach(b => b.onclick = () => { const d = loadDecks()[+b.dataset.load]; cur = JSON.parse(JSON.stringify(d)); editingIndex = +b.dataset.load; render(); });
      $('.db-saved').querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { if (!(await ui.ask('¿Borrar este mazo?'))) return; const l = loadDecks(); l.splice(+b.dataset.del, 1); saveDecks(l); editingIndex = null; renderDeck(); });
    };
    const render = () => { renderPool(); renderDeck(); };
    m.querySelectorAll('.db-pil').forEach(b => b.onclick = () => setPilgrim(b.dataset.p));
    $('.db-q').oninput = e => { f.q = e.target.value; renderPool(); };
    $('.db-type').onchange = e => { f.type = e.target.value; renderPool(); };
    $('.db-cost').onchange = e => { f.cost = e.target.value; renderPool(); };
    $('.db-name').oninput = e => { cur.name = e.target.value; };
    m.querySelector('.db').addEventListener('click', async e => {
      const a = e.target.closest('[data-a]'); if (!a) return; const act = a.dataset.a;
      if (act === 'close') { ui.hidePreview(); m.className = ''; m.innerHTML = ''; done(); }
      if (act === 'save') { const l = loadDecks(); const d = { name: cur.name || 'Mi mazo', pid: cur.pid, main: cur.main, souls: cur.souls }; if (editingIndex != null && l[editingIndex]) l[editingIndex] = d; else { l.push(d); editingIndex = l.length - 1; } saveDecks(l); ui.toast('Mazo guardado.'); renderDeck(); }
      if (act === 'suggest') { const s = suggestedDeck(cur.pid); cur.main = s.main; cur.souls = s.souls; render(); }
      if (act === 'clear') { cur.main = {}; cur.souls = {}; render(); }
      if (act === 'new') { cur = { name: 'Nuevo mazo', pid: cur.pid, main: {}, souls: {} }; editingIndex = null; render(); }
      if (act === 'export') { const c = encodeDeck(cur); try { await navigator.clipboard.writeText(c); ui.toast('Código copiado: pégalo a tus amigos.'); } catch (err) { await ui.askText('Copia este código y compártelo:', c); } }
      if (act === 'import') { const c = await ui.askText('Pega el código del mazo (empieza por SUL1:)', ''); if (!c) return; try { cur = decodeDeck(c); editingIndex = null; render(); ui.toast('Mazo importado.'); } catch (err) { ui.toast('Código no válido.'); } }
    });
    render();
  });
}
