// SULPHUR — sonido sintetizado: sagrado, oscuro, contenido. Sin orquesta heroica ni sonidos de arcade.
export class Audio {
  constructor() { this.ctx = null; this.muted = false; this.master = null; }
  start() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.8;
    const comp = this.ctx.createDynamicsCompressor(); this.master.connect(comp); comp.connect(this.ctx.destination);
    this.rev = this.makeReverb(); this.rev.connect(this.master);
    this.noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.drone();
  }
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.1); }
  makeReverb() {
    const c = this.ctx; const len = c.sampleRate * 3.2; const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const conv = c.createConvolver(); conv.buffer = buf; const g = c.createGain(); g.gain.value = 0.55; g.connect(conv); this.revIn = g; return conv;
  }
  out(node, wet = 0.4) { const g = this.ctx.createGain(); g.gain.value = 1; node.connect(this.master); const w = this.ctx.createGain(); w.gain.value = wet; node.connect(w); w.connect(this.revIn); }
  tone(freq, dur, { type = 'sine', vol = 0.2, attack = 0.01, wet = 0.4, detune = 0, when = 0 } = {}) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + when;
    const o = c.createOscillator(); o.type = type; o.frequency.value = freq; o.detune.value = detune;
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); this.out(g, wet); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  noise(dur, { vol = 0.2, freq = 1200, q = 1, type = 'bandpass', attack = 0.005, wet = 0.2, when = 0, sweep = null } = {}) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + when;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); this.out(g, wet); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  bell(f, vol = 0.18, dur = 4, when = 0) { for (const [m, v] of [[1, 1], [2.01, 0.5], [2.76, 0.35], [5.4, 0.15], [0.5, 0.4]]) this.tone(f * m, dur * (m > 2 ? 0.5 : 1), { vol: vol * v, attack: 0.003, wet: 0.7, when }); }
  drone() {
    const c = this.ctx; const g = c.createGain(); g.gain.value = 0.0; g.gain.linearRampToValueAtTime(0.05, c.currentTime + 4);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260; f.connect(g); this.out(g, 0.6);
    this.droneOsc = [];
    for (const [fr, dt] of [[55, 0], [55, 7], [82.4, -5], [110, 3]]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.detune.value = dt; o.connect(f); o.start(); this.droneOsc.push(o); }
    const lfo = c.createOscillator(); lfo.frequency.value = 0.07; const lg = c.createGain(); lg.gain.value = 90; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
    this.droneFilter = f; this.droneGain = g;
  }
  setCircle(n) {
    if (!this.ctx) return; const t = this.ctx.currentTime; const base = 55 * Math.pow(0.955, n - 1);
    const ratios = [1, 1, 1.5, 2]; this.droneOsc.forEach((o, i) => o.frequency.setTargetAtTime(base * ratios[i] * (n >= 7 && i === 2 ? 0.944 : 1), t, 2));
    this.droneFilter.frequency.setTargetAtTime(300 - n * 18, t, 2); this.droneGain.gain.setTargetAtTime(0.045 + n * 0.004, t, 2);
  }
  // ───── eventos ─────
  paper() { this.noise(0.18, { vol: 0.12, freq: 3200, q: 0.7, type: 'highpass', wet: 0.1 }); this.noise(0.1, { vol: 0.08, freq: 900, q: 1, wet: 0.05, when: 0.05 }); }
  tap() { this.noise(0.08, { vol: 0.1, freq: 1800, q: 2, wet: 0.1 }); this.tone(220, 0.15, { vol: 0.05, type: 'triangle', wet: 0.2 }); }
  thump() { if (!this.ctx) return; const o = this.tone(110, 0.35, { vol: 0.35, wet: 0.2 }); if (o) o.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3); this.noise(0.12, { vol: 0.12, freq: 400, q: 0.8, wet: 0.2 }); }
  absolve() { for (const [f, w] of [[392, 0], [493.9, 0.06], [587.3, 0.12], [784, 0.2]]) this.tone(f, 2.6, { vol: 0.06, attack: 0.25, wet: 0.8, when: w, type: 'sine', detune: (Math.random() - 0.5) * 8 }); this.bell(1568, 0.04, 2.5, 0.1); }
  condemn() { this.noise(1.6, { vol: 0.14, freq: 700, q: 6, wet: 0.6, attack: 0.2, sweep: 180 }); this.tone(73.4, 1.8, { vol: 0.14, type: 'sawtooth', wet: 0.5, attack: 0.05 }); this.tone(77.8, 1.8, { vol: 0.1, type: 'sawtooth', wet: 0.5, attack: 0.05 }); }
  chain(sharp) {
    for (let i = 0; i < (sharp ? 5 : 3); i++) { const f = 1800 + Math.random() * 2400; this.tone(f, 0.25, { vol: 0.05, type: 'square', wet: 0.4, when: i * 0.045 }); this.noise(0.06, { vol: 0.1, freq: 5000, q: 3, wet: 0.3, when: i * 0.045 }); }
    this.thump(); if (sharp) this.bell(880, 0.05, 1.5);
  }
  resolve() { this.bell(659, 0.06, 2); this.noise(0.4, { vol: 0.05, freq: 2400, q: 4, wet: 0.5 }); }
  hit() { this.thump(); this.noise(0.18, { vol: 0.18, freq: 1500, q: 1.5, wet: 0.2 }); }
  pilgrimHit() { this.tone(92, 0.9, { vol: 0.3, type: 'triangle', wet: 0.5 }); this.bell(185, 0.08, 2.5); this.noise(0.3, { vol: 0.2, freq: 800, q: 1, wet: 0.3 }); }
  die() { this.noise(0.5, { vol: 0.18, freq: 2500, q: 0.8, sweep: 300, wet: 0.3 }); this.tone(60, 0.6, { vol: 0.2, wet: 0.4 }); }
  burn() { for (let i = 0; i < 14; i++) this.noise(0.05 + Math.random() * 0.08, { vol: 0.08, freq: 2000 + Math.random() * 3000, q: 2, wet: 0.2, when: i * 0.06 }); this.noise(1.2, { vol: 0.1, freq: 500, q: 0.5, wet: 0.4, attack: 0.2 }); }
  bless() { this.tone(784, 0.8, { vol: 0.04, wet: 0.6 }); this.tone(1175, 0.8, { vol: 0.03, wet: 0.6, when: 0.05 }); }
  frost() { for (let i = 0; i < 6; i++) this.tone(2400 + Math.random() * 1800, 0.4, { vol: 0.025, wet: 0.7, when: i * 0.04 }); }
  attack() { this.noise(0.5, { vol: 0.12, freq: 300, q: 0.7, wet: 0.3, attack: 0.1 }); this.tone(98, 0.6, { vol: 0.14, type: 'sawtooth', wet: 0.4 }); }
  fizzle() { this.noise(0.6, { vol: 0.12, freq: 1200, q: 2, sweep: 200, wet: 0.5 }); }
  descend() { this.bell(98, 0.22, 7); this.bell(146.8, 0.12, 6, 0.9); this.tone(49, 5, { vol: 0.2, attack: 1.2, wet: 0.8 }); this.noise(4, { vol: 0.06, freq: 300, q: 0.5, wet: 0.8, attack: 1.5 }); }
  destiny(kind) { if (kind === 'redencion') { this.absolve(); this.bell(784, 0.1, 5, 0.3); } else { this.condemn(); this.bell(69.3, 0.25, 6, 0.2); } }
  judgment() { this.bell(65.4, 0.3, 9); this.bell(98, 0.2, 8, 1.2); this.bell(130.8, 0.15, 7, 2.4); this.tone(32.7, 8, { vol: 0.25, attack: 2, wet: 0.9 }); }
  whisper() { this.noise(1.2, { vol: 0.06, freq: 2600, q: 8, wet: 0.7, attack: 0.3 }); }
  click() { this.noise(0.04, { vol: 0.06, freq: 2500, q: 2, wet: 0.05 }); }
}
