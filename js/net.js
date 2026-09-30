// SULPHUR — multijugador entre amigos (P2P con WebRTC vía PeerJS).
// Los dos navegadores ejecutan el mismo motor determinista (misma semilla, mismos identificadores de carta);
// cada uno se ve a sí mismo como jugador 0. Por la red solo viajan las decisiones de cada jugador.
const PEER_SRC = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
const PREFIX = 'sulphur-tcg-';
let peerLib = null;
function loadPeer() {
  if (peerLib) return peerLib;
  peerLib = new Promise((res, rej) => { if (window.Peer) return res(window.Peer); const s = document.createElement('script'); s.src = PEER_SRC; s.onload = () => res(window.Peer); s.onerror = () => rej(new Error('No se pudo cargar PeerJS')); document.head.appendChild(s); });
  return peerLib;
}
const code = () => Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

export class Net {
  constructor() { this.conn = null; this.queue = []; this.waiters = []; this.handlers = {}; this.seq = 0; this.closed = false; }
  on(t, fn) { this.handlers[t] = fn; const held = (this.held || []).filter(m => m.t === t); this.held = (this.held || []).filter(m => m.t !== t); held.forEach(fn); }
  async host() {
    const Peer = await loadPeer(); this.code = code(); this.isHost = true;
    return new Promise((res, rej) => {
      this.peer = new Peer(PREFIX + this.code);
      this.peer.on('open', () => res(this.code));
      this.peer.on('error', e => { if (this.handlers.error) this.handlers.error(e); rej(e); });
      this.peer.on('connection', c => { if (this.conn) { c.close(); return; } this.attach(c); });
    });
  }
  async join(roomCode) {
    const Peer = await loadPeer(); this.isHost = false; this.code = roomCode.toUpperCase().trim();
    return new Promise((res, rej) => {
      this.peer = new Peer();
      this.peer.on('error', e => { if (this.handlers.error) this.handlers.error(e); rej(e); });
      this.peer.on('open', () => { const c = this.peer.connect(PREFIX + this.code, { reliable: true }); this.attach(c); c.on('open', () => res()); });
    });
  }
  attach(c) {
    this.conn = c;
    c.on('open', () => { if (this.handlers.connected) this.handlers.connected(); });
    c.on('data', m => this.receive(m));
    c.on('close', () => { this.closed = true; if (this.handlers.close) this.handlers.close(); });
  }
  send(m) { if (this.conn && this.conn.open) this.conn.send(m); }
  receive(m) {
    if (m.t === 'io') { const w = this.waiters.shift(); if (w) w(m); else this.queue.push(m); return; }
    if (this.handlers[m.t]) this.handlers[m.t](m); else (this.held = this.held || []).push(m);
  }
  nextIO() { if (this.queue.length) return Promise.resolve(this.queue.shift()); return new Promise(r => this.waiters.push(r)); }
  close() { try { this.conn && this.conn.close(); this.peer && this.peer.destroy(); } catch (e) { } }
}

// Las referencias con «player» están en la perspectiva de quien las envía: al recibirlas se invierten.
const flip = v => {
  if (Array.isArray(v)) return v.map(flip);
  if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) o[k] = k === 'player' && typeof x === 'number' ? 1 - x : flip(x); return o; }
  return v;
};
const IO_METHODS = ['chooseAction', 'chooseDrawDeck', 'chooseSoulMode', 'chooseTarget', 'chooseLujuria', 'chooseDiscard', 'chooseOrder', 'revealHand', 'chooseAttackers', 'chooseBlocks', 'chooseSiegeTarget'];

// IO local: pregunta al jugador humano y envía su respuesta al otro navegador.
export function localNetIO(io, net) {
  const out = {};
  for (const m of IO_METHODS) out[m] = async (...args) => {
    const v = await io[m](...args);
    let enc = v; if (m === 'chooseOrder') enc = v.map(c => c.uid);
    if (enc && enc.type === 'demoDescend') enc = { type: 'pass' };
    net.send({ t: 'io', seq: net.seq++, m, v: enc === undefined ? null : enc });
    return v;
  };
  return out;
}
// IO remoto: el motor le pregunta y espera la decisión que llega por la red.
export function remoteNetIO(net, ui) {
  const out = {};
  for (const m of IO_METHODS) out[m] = async (...args) => {
    if (ui) ui.waitingRemote(true, m);
    const msg = await net.nextIO();
    if (ui) ui.waitingRemote(false);
    if (msg.m !== m) console.warn('Desincronización: esperaba', m, 'y llegó', msg.m);
    let v = flip(msg.v);
    if (m === 'chooseOrder') { const cards = args[2]; v = v.map(u => cards.find(c => c.uid === u)).filter(Boolean); }
    return v === null ? undefined : v;
  };
  return out;
}
