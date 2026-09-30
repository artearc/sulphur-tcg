// SULPHUR — la mesa en Three.js: un libro abierto que arde, cartas físicas, dados, Balanza, Cadena y atmósfera por Círculo.
import * as THREE from 'three';
import { CIRCLES, SENDAS } from './data.js';
import * as ART from './art.js';
import { isEnte } from './engine.js';
import { Environment, CIRCLE_ENV, lightPillar, shockwave, lightning, burnMaterial, tickAnimations } from './env.js';
import { Post } from './post.js';

export const LAYOUT = {
  van: [-2.8, -1.4, 0, 1.4, 2.8], vanZ: 1.22,
  rear: [-1.4, 0, 1.4], rearZ: 2.8,
  pilgrim: [0, 4.45], pilgrimScale: 1.12, soulZ: 4.45, soulStart: 1.85, soulEnd: 5.5,
  will: [0.78, 4.08],
  balance: [-4.6, 2.85],
  mainDeck: [4.65, 2.8], soulDeck: [6.0, 2.8], olvido: [4.65, 1.22],
  chain: [6.55, 0.0],
  desc: [-6.65, 0],
  bookW: 16.8, bookH: 12.1,
};
const CARD_W = 1, CARD_H = 1.4, CARD_T = 0.012;
const DESC_W = 1.62, DESC_H = 4.75;
const ease = {
  io: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  slam: t => t * t * t,
};
const wait = ms => new Promise(r => setTimeout(r, ms));
const texCache = new Map();
function tex(key, make, aniso) {
  if (texCache.has(key)) return texCache.get(key);
  const t = new THREE.CanvasTexture(make()); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso || 8; texCache.set(key, t); return t;
}
function softGlow() {
  const cv = ART.mkCanvas(128, 160), c = cv.getContext('2d');
  const gr = c.createRadialGradient(64, 80, 30, 64, 80, 80); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = gr; c.fillRect(0, 0, 128, 160); return cv;
}
function frameTexture() {
  const cv = ART.mkCanvas(128, 176), c = cv.getContext('2d');
  c.shadowColor = '#fff'; c.shadowBlur = 10; c.strokeStyle = 'rgba(255,255,255,1)'; c.lineWidth = 5; c.strokeRect(8, 8, 112, 160);
  c.shadowBlur = 0; c.fillStyle = 'rgba(255,255,255,.10)'; c.fillRect(8, 8, 112, 160); return cv;
}
function dotTexture() {
  const cv = ART.mkCanvas(64, 64), c = cv.getContext('2d');
  const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = gr; c.fillRect(0, 0, 64, 64); return cv;
}

// ───────────────────────── partículas ─────────────────────────
class Particles {
  constructor(scene, n, blending, sizeMul = 1) {
    this.n = n; this.i = 0; this.hdr = blending === THREE.AdditiveBlending ? 2.6 : 1;
    this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3); this.vel = new Float32Array(n * 3);
    this.life = new Float32Array(n); this.max = new Float32Array(n); this.grav = new Float32Array(n);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mat = new THREE.PointsMaterial({ size: 0.09 * sizeMul, map: tex('dot', dotTexture), vertexColors: true, transparent: true, depthWrite: false, blending, sizeAttenuation: true });
    this.pts = new THREE.Points(geo, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = 20; scene.add(this.pts);
    for (let k = 0; k < n; k++) this.pos[k * 3 + 1] = -99;
  }
  emit(x, y, z, count, o = {}) {
    const c = new THREE.Color(o.color || '#ffd27a');
    for (let k = 0; k < count; k++) {
      const i = this.i; this.i = (this.i + 1) % this.n; const sp = o.spread ?? 0.4;
      this.pos[i * 3] = x + (Math.random() - 0.5) * (o.w ?? sp); this.pos[i * 3 + 1] = y + Math.random() * 0.05; this.pos[i * 3 + 2] = z + (Math.random() - 0.5) * (o.h ?? sp);
      const v = o.speed ?? 1;
      this.vel[i * 3] = (Math.random() - 0.5) * v; this.vel[i * 3 + 1] = (o.up ?? 1) * (0.4 + Math.random()) * v; this.vel[i * 3 + 2] = (Math.random() - 0.5) * v;
      this.life[i] = this.max[i] = (o.life ?? 1) * (0.6 + Math.random() * 0.6); this.grav[i] = o.grav ?? 0;
      const j = o.jitter ?? 0.15; const hdr = this.hdr; this.col[i * 3] = c.r * hdr * (1 - Math.random() * j); this.col[i * 3 + 1] = c.g * hdr * (1 - Math.random() * j); this.col[i * 3 + 2] = c.b * hdr * (1 - Math.random() * j);
    }
  }
  update(dt) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt; if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -99; continue; }
      this.vel[i * 3 + 1] -= this.grav[i] * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      const f = 0.985 + (this.life[i] / this.max[i]) * 0.015; this.col[i * 3] *= f; this.col[i * 3 + 1] *= f; this.col[i * 3 + 2] *= f;
    }
    this.pts.geometry.attributes.position.needsUpdate = true; this.pts.geometry.attributes.color.needsUpdate = true;
  }
}
class Ambient {
  constructor(scene) {
    this.n = 520; this.pos = new Float32Array(this.n * 3); this.col = new Float32Array(this.n * 3); this.seed = new Float32Array(this.n);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mat = new THREE.PointsMaterial({ size: 0.07, map: tex('dot', dotTexture), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 });
    this.pts = new THREE.Points(geo, this.mat); this.pts.frustumCulled = false; this.pts.renderOrder = 19; scene.add(this.pts);
    this.kind = 'fog'; this.color = new THREE.Color(0xcfc8b8);
    for (let i = 0; i < this.n; i++) { this.seed[i] = Math.random(); this.reset(i, true); }
  }
  reset(i, anywhere) {
    this.pos[i * 3] = (Math.random() - 0.5) * 20; this.pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    const k = this.kind; this.pos[i * 3 + 1] = anywhere ? Math.random() * 5 : (k === 'embers' ? 0 : k === 'fog' || k === 'motes' || k === 'dust' ? Math.random() * 3 : 5);
  }
  setKind(kind, color) { this.kind = kind; this.color = new THREE.Color(color); this.mat.blending = (kind === 'ash' || kind === 'rain') ? THREE.NormalBlending : THREE.AdditiveBlending; this.mat.size = kind === 'rain' ? 0.05 : kind === 'fog' ? 0.5 : kind === 'wind' ? 0.06 : 0.07; this.mat.opacity = kind === 'fog' ? 0.1 : 0.75; this.mat.needsUpdate = true; }
  update(dt, t) {
    const k = this.kind, c = this.color;
    for (let i = 0; i < this.n; i++) {
      const s = this.seed[i]; let x = this.pos[i * 3], y = this.pos[i * 3 + 1], z = this.pos[i * 3 + 2];
      if (k === 'embers') { y += dt * (0.4 + s * 0.6); x += Math.sin(t * 2 + s * 30) * dt * 0.3; if (y > 5) { this.reset(i); continue; } }
      else if (k === 'ash' || k === 'snow') { y -= dt * (k === 'snow' ? 0.35 + s * 0.3 : 0.2 + s * 0.25); x += Math.sin(t + s * 20) * dt * 0.2 + (k === 'ash' ? dt * 0.15 : 0); if (y < 0) { this.reset(i); continue; } }
      else if (k === 'rain') { y -= dt * (6 + s * 3); x -= dt * 1.2; if (y < 0) { this.reset(i); continue; } }
      else if (k === 'wind') { x += dt * (3 + s * 3); z += Math.sin(t * 1.5 + s * 10) * dt * 1.2; y += Math.cos(t + s * 7) * dt * 0.3; if (x > 10) x = -10; }
      else { x += Math.sin(t * 0.3 + s * 40) * dt * 0.15; z += Math.cos(t * 0.25 + s * 30) * dt * 0.12; y += Math.sin(t * 0.5 + s * 9) * dt * 0.05; if (y < 0.1) y = 0.1; }
      this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
      const fl = k === 'embers' ? 0.6 + 0.4 * Math.sin(t * 6 + s * 50) : 1;
      this.col[i * 3] = c.r * fl; this.col[i * 3 + 1] = c.g * fl; this.col[i * 3 + 2] = c.b * fl;
    }
    this.pts.geometry.attributes.position.needsUpdate = true; this.pts.geometry.attributes.color.needsUpdate = true;
  }
}
// Flecha curva al estilo de los TCG digitales: núcleo brillante + halo.
class Arrow {
  constructor(scene, color) {
    this.core = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, depthTest: false });
    this.halo = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, depthTest: false, blending: THREE.AdditiveBlending, depthWrite: false });
    this.tube = new THREE.Mesh(new THREE.BufferGeometry(), this.core); this.glow = new THREE.Mesh(new THREE.BufferGeometry(), this.halo);
    this.head = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.42, 14), this.core);
    for (const m of [this.tube, this.glow, this.head]) { m.renderOrder = 60; m.frustumCulled = false; scene.add(m); }
    this.visible = true;
  }
  setColor(c) { this.core.color.set(c); this.halo.color.set(c); }
  set(from, to) {
    const d = from.distanceTo(to); const mid = from.clone().lerp(to, 0.5); mid.y += 0.35 + d * 0.28;
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    this.tube.geometry.dispose(); this.glow.geometry.dispose();
    this.tube.geometry = new THREE.TubeGeometry(curve, 28, 0.045, 6); this.glow.geometry = new THREE.TubeGeometry(curve, 28, 0.13, 8);
    const tg = curve.getTangent(1); this.head.position.copy(to); this.head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tg);
    this.show(true);
  }
  show(v) { this.visible = v; this.tube.visible = this.glow.visible = this.head.visible = v; }
  dispose(scene) { for (const m of [this.tube, this.glow, this.head]) { scene.remove(m); if (m !== this.head) m.geometry.dispose(); } }
}

function d10Geometry(r = 0.3) {
  const h = r * 1.05, a = r * 0.11; const top = new THREE.Vector3(0, h, 0), bot = new THREE.Vector3(0, -h, 0);
  const U = [], L = [];
  for (let i = 0; i < 5; i++) { const an = i / 5 * Math.PI * 2; U.push(new THREE.Vector3(Math.cos(an) * r, a, Math.sin(an) * r)); const bn = an + Math.PI / 5; L.push(new THREE.Vector3(Math.cos(bn) * r, -a, Math.sin(bn) * r)); }
  const pos = []; const tri = (p, q, s) => pos.push(p.x, p.y, p.z, q.x, q.y, q.z, s.x, s.y, s.z);
  for (let i = 0; i < 5; i++) { const u0 = U[i], u1 = U[(i + 1) % 5], l0 = L[i], lp = L[(i + 4) % 5]; tri(top, u1, l0); tri(top, l0, u0); tri(bot, l0, u1); tri(bot, lp, l0); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}

// ───────────────────────── la vista ─────────────────────────
export class View {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x0b0806);
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120); this.scene.add(this.camera);
    this.aniso = this.renderer.capabilities.getMaxAnisotropy();
    this.views = new Map(); this.game = null; this.hoverHand = null; this.hoverBoard = null; this.highlights = new Map(); this.dragging = null;
    this.handMode = 'normal'; this.handLow = false;
    this.clock = new THREE.Clock(); this.shake = 0; this.listeners = {}; this.atmo = {};
    this.combatArrows = new Map(); this.chainBadges = new Map(); this.pilgrims = []; this.olvidoMeshes = [];
    this.scene.fog = new THREE.Fog(0x1a0e08, 26, 60);
    this.buildLights(); this.buildEnvMap(); this.buildTable(); this.buildDecks(); this.buildDescenso(); this.buildSlots();
    this.fxAdd = new Particles(this.scene, 900, THREE.AdditiveBlending); this.fxDark = new Particles(this.scene, 600, THREE.NormalBlending, 1.2);
    this.ambient = new Ambient(this.scene);
    this.handGroup = new THREE.Group(); this.camera.add(this.handGroup);
    this.chainLinks = new THREE.Group(); this.scene.add(this.chainLinks);
    this.aim = new Arrow(this.scene, 0xffc860); this.aim.show(false); this.aimFrom = null;
    this.raycaster = new THREE.Raycaster(); this.mouse = new THREE.Vector2(-9, -9);
    this.post = new Post(this.renderer, this.scene, this.camera);
    this.camIntro = 0; this.camPunch = 0;
    this.resize(); window.addEventListener('resize', () => this.resize());
    this.bindPointer();
    this.setAtmosphere(1, true);
    this.renderer.setAnimationLoop(() => this.frame());
  }
  on(ev, fn) { this.listeners[ev] = fn; }
  emit(ev, ...a) { if (this.listeners[ev]) this.listeners[ev](...a); }

  // Encuadre: busca la cámara más cercana que deja toda la mesa visible y reserva abajo el espacio de la mano.
  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight; this.renderer.setSize(w, h);
    const cam = this.camera; cam.aspect = w / h; const fovR = cam.fov * Math.PI / 180;
    const elev = 64 * Math.PI / 180; const dir = new THREE.Vector3(0, Math.sin(elev), Math.cos(elev));
    const pts = [[-7.55, 5.3], [7.2, 5.3], [-7.55, -5.3], [7.2, -5.3], [0, 5.3], [0, -5.3]].map(([x, z]) => new THREE.Vector3(x, 0, z));
    const bot = -0.66, top = 0.83;
    const fits = (c, d) => {
      const T = new THREE.Vector3(0, 0, c); cam.position.copy(T).addScaledVector(dir, d); cam.lookAt(T); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
      return pts.every(p => { const v = p.clone().project(cam); return v.x > -0.97 && v.x < 0.97 && v.y > bot && v.y < top; });
    };
    let best = null;
    for (let c = -0.5; c <= 3; c += 0.1) {
      let lo = 6, hi = 70; if (!fits(c, hi)) continue;
      for (let k = 0; k < 24; k++) { const mid = (lo + hi) / 2; if (fits(c, mid)) hi = mid; else lo = mid; }
      if (!best || hi < best.d) best = { c, d: hi };
    }
    if (!best) best = { c: 1, d: 30 };
    const T = new THREE.Vector3(0, 0, best.c); cam.position.copy(T).addScaledVector(dir, best.d); cam.lookAt(T); cam.updateProjectionMatrix();
    this.camBase = cam.position.clone(); this.camDir = dir.clone(); this.camTarget = T.clone();
    if (this.post) this.post.setSize();
    this.handDist = 7; this.hh = Math.tan(fovR / 2) * this.handDist; this.hw = this.hh * cam.aspect;
    if (this.game) this.sync(0);
  }

  buildLights() {
    this.hemi = new THREE.HemisphereLight(0xfff0d8, 0x2a1a10, 1.5); this.scene.add(this.hemi);
    this.key = new THREE.DirectionalLight(0xffe2b8, 1.8); this.key.position.set(-5, 16, 8); this.key.castShadow = true;
    const s = this.key.shadow; s.mapSize.set(4096, 4096); s.camera.left = -11; s.camera.right = 11; s.camera.top = 9; s.camera.bottom = -9; s.camera.near = 1; s.camera.far = 45; s.bias = -0.0005; s.radius = 5;
    this.scene.add(this.key);
    this.glowLight = new THREE.PointLight(0xff6a2a, 6, 24, 1.6); this.glowLight.position.set(0, 3.5, 0); this.scene.add(this.glowLight);

  }
  buildEnvMap() {
    // Entorno cálido (para el oro y el metal): cielo de brasas arriba, fuego del abismo abajo.
    const envScene = new THREE.Scene();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide,
      vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vP; void main(){ float y=normalize(vP).y; vec3 top=vec3(0.35,0.22,0.14); vec3 hor=vec3(1.6,0.7,0.25); vec3 bot=vec3(2.2,0.5,0.12); vec3 c=y>0.0?mix(hor,top,pow(y,0.6)):mix(hor,bot,pow(-y,0.7)); gl_FragColor=vec4(c,1.0); }' }));
    envScene.add(sky);
    const pm = new THREE.PMREMGenerator(this.renderer); this.envMap = pm.fromScene(envScene, 0.04).texture; pm.dispose();
  }
  buildTable() {
    this.env = new Environment(this.scene, LAYOUT); this.tableMat = this.env.bookMat; this.table = this.env.book;
    this.env.bookMat.envMap = this.envMap; this.env.bookMat.envMapIntensity = 0.5;
    this.scene.traverse(o => { if (o.isMesh && o.material && o.material.metalness >= 0.8 && !o.material.envMap) { o.material.envMap = this.envMap; o.material.envMapIntensity = 1.2; } });
  }
  cardMaterials(front, back) {
    const edge = new THREE.MeshStandardMaterial({ color: 0x2a211a, roughness: 0.9 });
    const mk = t => new THREE.MeshStandardMaterial({ map: t, roughness: 0.78, metalness: 0, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.3 });
    return [edge, edge, edge, edge, mk(front), mk(back)];
  }
  glowPlane(w, h) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex('cglow', ART.cardGlowTexture), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.z = -0.008; m.renderOrder = 1; return m;
  }
  buildDecks() {
    this.deckMeshes = {}; this.dice = []; this.balances = [];
    const backM = tex('backM', ART.backMain, this.aniso), backS = tex('backS', ART.backSoul, this.aniso);
    for (const pi of [0, 1]) {
      const sg = pi === 0 ? 1 : -1;
      for (const [which, pos, back] of [['main', LAYOUT.mainDeck, backM], ['soul', LAYOUT.soulDeck, backS]]) {
        const side = new THREE.MeshStandardMaterial({ color: which === 'main' ? 0x1a1411 : 0xcdbd9a, roughness: 0.9 });
        const topM = new THREE.MeshStandardMaterial({ map: back, roughness: 0.8, emissive: 0xffffff, emissiveMap: back, emissiveIntensity: 0.3 });
        const m = new THREE.Mesh(new THREE.BoxGeometry(CARD_W, 1, CARD_H), [side, side, topM, side, side, side]);
        m.position.set(pos[0], 0.2, sg * pos[1]); m.castShadow = true; m.receiveShadow = true; m.userData = { kind: 'deck', player: pi, which };
        this.scene.add(m); this.deckMeshes[`${pi}${which}`] = m;
      }
      const ol = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 1.46), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }));
      ol.rotation.x = -Math.PI / 2; ol.position.set(LAYOUT.olvido[0], 0.004, sg * LAYOUT.olvido[1]); ol.userData = { kind: 'olvido', player: pi }; this.scene.add(ol); this.olvidoMeshes.push(ol);
      this.balances.push(this.buildBalance(pi));
      const d20 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 0), new THREE.MeshStandardMaterial({ color: 0x151010, roughness: 0.3, metalness: 0.35, flatShading: true }));
      d20.add(new THREE.LineSegments(new THREE.EdgesGeometry(d20.geometry), new THREE.LineBasicMaterial({ color: 0xa82418 })));
      d20.position.set(LAYOUT.will[0], 0.3, sg * LAYOUT.will[1]); d20.castShadow = true; d20.userData = { kind: 'will', player: pi };
      this.scene.add(d20);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: true })); spr.scale.set(0.8, 0.64, 1); spr.position.set(0, 0.46, 0); spr.renderOrder = 30; d20.add(spr);
      this.dice.push({ mesh: d20, spr, val: null, spin: 0 });
    }
  }
  buildBalance(pi) {
    const sg = pi === 0 ? 1 : -1; const g = new THREE.Group(); g.position.set(LAYOUT.balance[0], 0, sg * LAYOUT.balance[1]); g.scale.setScalar(1.3);
    const metal = new THREE.MeshStandardMaterial({ color: 0xb08a44, roughness: 0.35, metalness: 0.8 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.55, metalness: 0.6 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.08, 24), dark); base.position.y = 0.04; g.add(base);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.9, 12), metal); post.position.y = 0.48; g.add(post);
    const pivot = new THREE.Group(); pivot.position.y = 0.94; g.add(pivot);
    pivot.add(new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.05, 0.06), metal));
    const pans = [];
    for (const side of [-1, 1]) {
      const hang = new THREE.Group(); hang.position.x = side * 0.74; pivot.add(hang);
      for (const dz of [-0.11, 0.11]) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.44, 4), dark); ch.position.set(0, -0.21, dz); ch.rotation.x = dz > 0 ? -0.26 : 0.26; hang.add(ch); }
      const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.17, 0.05, 24), side < 0 ? metal : dark); pan.position.y = -0.44; hang.add(pan);
      const tokens = new THREE.Group(); tokens.position.y = -0.41; hang.add(tokens);
      pans.push({ hang, tokens });
    }
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.022, 8, 32), new THREE.MeshStandardMaterial({ color: 0xffd67a, emissive: 0xffb840, emissiveIntensity: 2, metalness: 0.8, roughness: 0.3 }));
    halo.rotation.x = Math.PI / 2; halo.position.y = 1.17; halo.visible = false; g.add(halo);
    const horns = new THREE.Group(); horns.position.y = 1.05; horns.visible = false; g.add(horns);
    const hm = new THREE.MeshStandardMaterial({ color: 0x0a0807, roughness: 0.3, metalness: 0.4, emissive: 0x400800, emissiveIntensity: 0.6 });
    for (const side of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.032, 8, 16, Math.PI * 0.6), hm); h.position.set(side * 0.06, 0.02, 0); h.rotation.z = side < 0 ? Math.PI * 0.35 : Math.PI * 0.05; if (side > 0) h.scale.x = -1; horns.add(h); }
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.38), new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.8, emissive: 0xffffff, emissiveIntensity: 0.35 }));
    plaque.rotation.x = -Math.PI / 2; plaque.position.set(0, 0.012, 0.5); g.add(plaque);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.3, 1.3), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.6; g.add(hit);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData = { kind: 'balance', player: pi }; } });
    this.scene.add(g);
    return { g, pivot, pans, halo, horns, plaque, angle: 0, target: 0, key: '' };
  }
  plaqueTexture(diff, destiny) {
    const cv = ART.mkCanvas(680, 144), c = cv.getContext('2d');
    ART.paper(c, 680, 144, 5, [222, 206, 172], { vignette: 0.2 });
    c.strokeStyle = '#1a120c'; c.lineWidth = 3; c.strokeRect(2, 2, 676, 140);
    const x0 = 60, x1 = 620; const X = d => x0 + (d + 6) / 12 * (x1 - x0);
    c.fillStyle = 'rgba(201,161,58,.35)'; c.fillRect(X(6), 40, X(3) - X(6), 44);
    c.fillStyle = 'rgba(20,14,10,.35)'; c.fillRect(X(-3), 40, X(-6) - X(-3), 44);
    c.fillStyle = 'rgba(201,161,58,.85)'; c.fillRect(X(6), 40, X(5) - X(6), 44);
    c.fillStyle = 'rgba(10,8,6,.85)'; c.fillRect(X(-5), 40, X(-6) - X(-5), 44);
    c.strokeStyle = '#1a120c'; c.lineWidth = 2; c.strokeRect(x0, 40, x1 - x0, 44);
    c.font = `600 17px ${ART.FONT_R}`; c.fillStyle = '#1a120c'; c.textAlign = 'center';
    for (let d = -6; d <= 6; d++) { const x = X(-d); c.beginPath(); c.moveTo(x, 84); c.lineTo(x, d % 3 === 0 || Math.abs(d) === 5 ? 96 : 90); c.stroke(); }
    for (const d of [5, 3, 0, -3, -5]) c.fillText(String(Math.abs(d)), X(d), 116);
    c.font = `22px ${ART.FONT_D}`;
    c.fillText('VIRTVOSO', (X(6) + X(3)) / 2, 30); c.fillText('TIBIO', X(0), 30); c.fillText('CORRVPTO', (X(-3) + X(-6)) / 2, 30);
    c.font = `italic 15px ${ART.FONT_R}`; c.fillText('Redención', X(5.5), 136); c.fillText('Caída', X(-5.5), 136);
    ART.drawIcon(c, 'halo', 26, 62, 40, '#c9a13a'); ART.drawIcon(c, 'horns', 654, 62, 40, '#0b0806');
    const px = X(Math.max(-6, Math.min(6, diff)));
    c.fillStyle = '#8e1c14'; c.beginPath(); c.moveTo(px, 88); c.lineTo(px - 11, 104); c.lineTo(px + 11, 104); c.fill(); c.fillRect(px - 2, 36, 4, 52);
    if (destiny) { c.fillStyle = destiny === 'redencion' ? '#8a6418' : '#0b0806'; c.font = `18px ${ART.FONT_D}`; c.fillText(destiny === 'redencion' ? '✦ DESTINO: REDENCIÓN ✦' : '✦ DESTINO: CAÍDA ✦', X(0), 136); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  buildDescenso() {
    const t = tex('desc', ART.descensoCard, this.aniso);
    const m = new THREE.Mesh(new THREE.BoxGeometry(DESC_W, DESC_H, 0.02), this.cardMaterials(t, t));
    m.rotation.x = -Math.PI / 2; m.position.set(LAYOUT.desc[0], 0.012, LAYOUT.desc[1]); m.receiveShadow = true; m.castShadow = true;
    m.userData = { kind: 'descenso' }; this.scene.add(m); this.descMesh = m;
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(DESC_W * 1.04, 0.54), new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    gl.rotation.x = -Math.PI / 2; gl.position.set(LAYOUT.desc[0], 0.03, 0); this.scene.add(gl); this.descGlow = gl;
    const d10 = new THREE.Mesh(d10Geometry(0.25), new THREE.MeshStandardMaterial({ color: 0x141010, roughness: 0.35, metalness: 0.3, flatShading: true }));
    d10.add(new THREE.LineSegments(new THREE.EdgesGeometry(d10.geometry), new THREE.LineBasicMaterial({ color: 0xc89a3c })));
    d10.castShadow = true; d10.userData = { kind: 'd10' }; this.scene.add(d10);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: true })); spr.scale.set(0.72, 0.72, 1); spr.position.y = 0.44; spr.renderOrder = 30; d10.add(spr);
    this.d10 = { mesh: d10, spr, target: new THREE.Vector3(LAYOUT.desc[0] - 0.5, 0.3, 0), spin: 0 };
  }
  setD10(n) {
    const cv = ART.textSprite(String(n), { size: 70, color: '#f0c870', stroke: '#0b0806', strokeW: 10, w: 128, h: 128 });
    if (this.d10.spr.material.map) this.d10.spr.material.map.dispose(); this.d10.spr.material.map = new THREE.CanvasTexture(cv); this.d10.spr.material.map.colorSpace = THREE.SRGBColorSpace; this.d10.spr.material.needsUpdate = true;
  }
  bandZ(n) { const top = 110 / ART.DH, bh = (ART.DH - 130) / 9 / ART.DH; return -DESC_H / 2 + (top + (n - 0.5) * bh) * DESC_H; }
  buildSlots() {
    this.slots = [];
    const mat = () => new THREE.MeshBasicMaterial({ map: tex('frame', frameTexture), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffd08a });
    for (const pi of [0, 1]) {
      const sg = pi === 0 ? 1 : -1;
      for (const [row, xs, z] of [['van', LAYOUT.van, LAYOUT.vanZ], ['rear', LAYOUT.rear, LAYOUT.rearZ]]) {
        xs.forEach((x, idx) => {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 1.52), mat()); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.006, sg * z);
          m.userData = { kind: 'slot', player: pi, row, idx }; this.scene.add(m); this.slots.push(m);
        });
      }
      const sz = new THREE.Mesh(new THREE.PlaneGeometry(11.6, 1.6), mat()); sz.rotation.x = -Math.PI / 2; sz.position.set(0, 0.004, sg * LAYOUT.soulZ);
      sz.userData = { kind: 'soulzone', player: pi }; this.scene.add(sz); this.slots.push(sz);
    }
  }

  // ───────────────────────── partida ─────────────────────────
  reset() {
    for (const k of [...this.views.keys()]) this.removeView(k);
    for (const p of this.pilgrims) if (p) this.scene.remove(p.mesh);
    this.pilgrims = []; this.clearHighlights(); this.setAim(null);
    for (const a of this.combatArrows.values()) a.dispose(this.scene); this.combatArrows.clear();
    for (const s of this.chainBadges.values()) this.scene.remove(s); this.chainBadges.clear();
    for (const d of this.dice) d.val = null; for (const b of this.balances) b.key = '';
    this.game = null;
  }
  setGame(game) {
    this.reset(); this.game = game;
    for (const pi of [0, 1]) {
      const p = game.P[pi]; const sg = pi === 0 ? 1 : -1;
      const face = new THREE.CanvasTexture(ART.pilgrimFace(p.pid, {})); face.colorSpace = THREE.SRGBColorSpace; face.anisotropy = this.aniso;
      const m = new THREE.Mesh(new THREE.BoxGeometry(ART.PW / ART.PH * 1.4, 1.4, 0.02), this.cardMaterials(face, tex('backM', ART.backMain)));
      m.rotation.x = -Math.PI / 2; m.scale.setScalar(LAYOUT.pilgrimScale); m.position.set(LAYOUT.pilgrim[0], 0.022, sg * LAYOUT.pilgrim[1]); m.castShadow = true; m.receiveShadow = true;
      m.userData = { kind: 'pilgrim', player: pi }; this.scene.add(m);
      const glow = this.glowPlane(2.3, 1.75); glow.material.map = tex('soft', softGlow); m.add(glow);
      this.pilgrims[pi] = { mesh: m, glow, face, destinyKey: '' };
    }
    this.setAtmosphere(game.circle, true); this.setD10(game.circle);
    this.scene.traverse(o => { if (o.isMesh && o.material && !Array.isArray(o.material) && o.material.metalness >= 0.3 && !o.material.envMap) { o.material.envMap = this.envMap; o.material.envMapIntensity = 1.1; o.material.needsUpdate = true; } });
    this.camIntro = 1;
    this.sync(0);
  }
  cardView(c) {
    let v = this.views.get(c.uid); if (v) return v;
    const front = tex('f_' + c.id, () => ART.cardFace(c.id), this.aniso);
    const back = c.soul ? tex('backS', ART.backSoul) : tex('backM', ART.backMain);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(CARD_W, CARD_H, CARD_T), this.cardMaterials(front, back));
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.rotation.order = 'YXZ'; mesh.userData = { kind: 'card', uid: c.uid };
    const glow = this.glowPlane(1.26, 1.66); mesh.add(glow);
    v = { mesh, glow, c, anim: null, badge: null, badgeKey: '', icons: new THREE.Group(), iconKey: '', tint: 1, flash: 0, flashCol: new THREE.Color() };
    mesh.add(v.icons); this.views.set(c.uid, v); return v;
  }
  spawnAt(v, pos, faceUp) { this.scene.add(v.mesh); v.mesh.position.copy(pos); v.mesh.rotation.set(faceUp ? -Math.PI / 2 : Math.PI / 2, 0, 0); v.mesh.scale.setScalar(1); }
  removeView(uid) { const v = this.views.get(uid); if (!v) return; v.mesh.parent && v.mesh.parent.remove(v.mesh); this.views.delete(uid); }
  setHandMode(m) { this.handMode = m; this.sync(380); }
  // Geometría de la mano en el espacio de la cámara (estable: no depende de las cartas animadas).
  handLayout(n) {
    const s = 0.74, H = CARD_H * s; const sp = Math.min(0.62, (this.hw * 0.95) / Math.max(1, n));
    const topNdc = this.handMode === 'min' || this.handLow ? -0.94 : -0.66;
    const hs = 1.06, hd = this.handDist - 0.5, hhD = this.hh * hd / this.handDist, hoverNdcTop = -1 + (CARD_H * hs + 0.08) / hhD;
    return { s, H, sp, hs, hd, hhD, restTop: topNdc * this.hh, hoverTop: hoverNdcTop * this.hh, x: i => (i - (n - 1) / 2) * sp + 0.35, y: i => topNdc * this.hh - H / 2 - Math.abs(i - (n - 1) / 2) * 0.025 };
  }
  handUidAt() {
    if (!this.game || this.mouse.x < -1.5) return null;
    const hand = this.game.P[0].hand; const n = hand.length; if (!n) return null;
    const L = this.handLayout(n); const xc = this.mouse.x * this.hw, yc = this.mouse.y * this.hh;
    const top = this.hoverHand != null ? Math.max(L.hoverTop, L.restTop) : L.restTop;
    if (yc > top) return null;
    if (xc < L.x(0) - 0.45 || xc > L.x(n - 1) + 0.45) return null;
    let best = 0, bd = 1e9; for (let i = 0; i < n; i++) { const d = Math.abs(xc - L.x(i)); if (d < bd) { bd = d; best = i; } }
    return hand[best].uid;
  }

  targets() {
    const g = this.game; const T = new Map();
    const W = (x, y, z, rx, ry, s = 1, extra = {}) => ({ parent: 'world', pos: new THREE.Vector3(x, y, z), rot: new THREE.Euler(rx, ry, 0, 'YXZ'), s, ...extra });
    const FU = -Math.PI / 2, FD = Math.PI / 2, TAP = -Math.PI / 2;
    const lift = uid => this.hoverBoard === uid ? 0.14 : 0; const grow = uid => this.hoverBoard === uid ? 1.06 : 1;
    for (const pi of [0, 1]) {
      const p = g.P[pi], sg = pi === 0 ? 1 : -1; const n = p.hand.length;
      p.hand.forEach((c, i) => {
        const off = i - (n - 1) / 2;
        if (pi === 0) {
          const L = this.handLayout(n); const hi = this.dragging ? -1 : p.hand.findIndex(x => x.uid === this.hoverHand);
          const hov = hi === i;
          let x = L.x(i), y = L.y(i), sc = L.s, z = -this.handDist + i * 0.004, rz = -off * 0.035;
          if (hi >= 0 && !hov) x += Math.sign(i - hi) * 0.3;
          if (hov) { sc = L.hs; y = -L.hhD + CARD_H * sc / 2 + 0.06; z = -L.hd; x *= L.hd / this.handDist; rz = 0; }
          T.set(c.uid, { parent: 'hand', pos: new THREE.Vector3(x, y, z), rot: new THREE.Euler(0, 0, rz), s: sc });
        } else {
          const sp = Math.min(0.42, 3.6 / Math.max(1, n));
          T.set(c.uid, { parent: 'hand', pos: new THREE.Vector3(off * sp, this.hh + 0.12 + Math.abs(off) * 0.015, -this.handDist + i * 0.004), rot: new THREE.Euler(0, Math.PI, Math.PI + off * 0.05), s: 0.4 });
        }
      });
      const place = (c, x, z) => {
        let px = x, pz = z;
        if (c.attacking) pz -= sg * 0.5;
        if (c.blocking) { const a = g.find(c.blocking); if (a) { px = this.rowX(a); pz = sg * 0.8; } }
        T.set(c.uid, W(px, 0.03 + (c.attacking || c.blocking ? 0.05 : 0) + lift(c.uid), pz, FU, c.tapped ? TAP : 0, grow(c.uid)));
        c.attached.forEach((r, k) => T.set(r.uid, W(px + 0.14 + k * 0.1, 0.018 - k * 0.002, pz + sg * (0.3 + k * 0.14), FU, c.tapped ? TAP : 0, 0.92)));
      };
      p.van.forEach((c, i) => { if (c) place(c, LAYOUT.van[i], sg * LAYOUT.vanZ); });
      p.rear.forEach((c, i) => { if (c) place(c, LAYOUT.rear[i], sg * LAYOUT.rearZ); });
      const abs = p.souls.filter(s => !s.faceDown), con = p.souls.filter(s => s.faceDown);
      const spc = k => Math.min(1.04, (LAYOUT.soulEnd - LAYOUT.soulStart) / Math.max(1, k - 1));
      abs.forEach((s, i) => T.set(s.uid, W(-LAYOUT.soulStart - i * spc(abs.length), 0.02 + i * 0.003 + lift(s.uid), sg * LAYOUT.soulZ, FU, s.tapped ? TAP : 0, 0.94 * grow(s.uid))));
      con.forEach((s, i) => T.set(s.uid, W(LAYOUT.soulStart + i * spc(con.length), 0.02 + i * 0.003 + lift(s.uid), sg * LAYOUT.soulZ, FD, s.tapped ? TAP : 0, 0.94 * grow(s.uid))));
      p.relics.forEach((r, i) => T.set(r.uid, W(LAYOUT.pilgrim[0] - 0.7 + i * 0.5, 0.012, sg * (LAYOUT.pilgrim[1] - 0.72), FU, 0, 0.78)));
      p.olvido.slice(-5).forEach((c, i) => T.set(c.uid, W(LAYOUT.olvido[0] + (i % 2) * 0.02, 0.02 + i * 0.012, sg * LAYOUT.olvido[1] + (i % 3) * 0.01, FU, (i % 3 - 1) * 0.04, 1)));
    }
    g.chain.forEach((it, i) => {
      const pos = this.chainPos(i); const rot = new THREE.Euler(FU, ((it.id * 37) % 7 - 3) * 0.012, 0, 'YXZ');
      if (it.card) T.set(it.card.uid, { parent: 'world', pos, rot, s: 1.12, chain: true });
      else T.set('chain:' + it.id, { parent: 'world', pos, rot, s: 1.12, chain: true, item: it });
    });
    return T;
  }
  chainPos(i) { return new THREE.Vector3(LAYOUT.chain[0], 0.08 + i * 0.07, LAYOUT.chain[1] + 0.95 - i * 0.52); }
  rowX(c) { const p = this.game.P[c.ctrl]; let i = p.van.indexOf(c); if (i >= 0) return LAYOUT.van[i]; i = p.rear.indexOf(c); if (i >= 0) return LAYOUT.rear[i]; return 0; }

  sync(dur = 420) {
    if (!this.game) return Promise.resolve();
    const T = this.targets(); const g = this.game; let longest = 0;
    for (const [key, t] of T) {
      if (typeof key === 'string' && key.startsWith('chain:') && !this.views.has(key)) {
        const it = t.item; const tx = new THREE.CanvasTexture(ART.tokenCard(it.name, it.text, it.senda, it.kind)); tx.colorSpace = THREE.SRGBColorSpace;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(CARD_W, CARD_H, CARD_T), this.cardMaterials(tx, tx)); mesh.rotation.order = 'YXZ'; mesh.castShadow = true;
        mesh.userData = { kind: 'chainToken', id: it.id };
        const glow = this.glowPlane(1.26, 1.66); mesh.add(glow);
        const v = { mesh, glow, c: null, token: it, anim: null, icons: new THREE.Group(), tint: 1, flash: 0, flashCol: new THREE.Color() }; mesh.add(v.icons);
        this.views.set(key, v);
        const src = it.srcPilgrim != null ? this.pilgrims[it.srcPilgrim].mesh.position : (it.srcCard && this.views.get(it.srcCard.uid) ? this.views.get(it.srcCard.uid).mesh.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(LAYOUT.chain[0], 2, 0));
        this.spawnAt(v, src.clone().add(new THREE.Vector3(0, 0.6, 0)), true);
      }
    }
    for (const [key, t] of T) {
      let v;
      if (typeof key === 'string') v = this.views.get(key);
      else { const c = g.find(key); if (!c) continue; const had = this.views.has(key); v = this.cardView(c); if (!had) this.spawnNew(v, c); }
      if (!v || v === this.dragging) continue;
      const parent = t.parent === 'hand' ? this.handGroup : this.scene;
      const wasHand = v.mesh.parent === this.handGroup;
      if (v.mesh.parent !== parent) { parent.attach(v.mesh); v.mesh.castShadow = parent === this.scene; }
      const handMove = wasHand && parent === this.handGroup;
      const q1 = new THREE.Quaternion().setFromEuler(t.rot);
      const same = v.mesh.position.distanceTo(t.pos) < 0.001 && v.mesh.quaternion.angleTo(q1) < 0.001 && Math.abs(v.mesh.scale.x - t.s) < 0.001;
      if (!same) {
        const d = dur === 0 ? 0 : (v.slam ? 360 : handMove ? Math.min(dur, 190) : dur); const far = v.mesh.position.distanceTo(t.pos) > 1.2;
        v.anim = { p0: v.mesh.position.clone(), p1: t.pos.clone(), q0: v.mesh.quaternion.clone(), q1, s0: v.mesh.scale.x, s1: t.s, t: 0, dur: d / 1000, arc: handMove ? 0 : parent === this.scene ? (v.slam ? 1.6 : far ? 0.55 : 0.1) : (far ? 0.2 : 0), ease: v.slam ? ease.slam : handMove ? ease.out : ease.io, slam: v.slam };
        v.slam = false; longest = Math.max(longest, d);
      }
      this.decorate(v);
    }
    for (const [key, v] of [...this.views]) {
      if (T.has(key)) continue;
      if (typeof key === 'string') { this.removeView(key); continue; }
      const c = g.find(key);
      if (!c || ['burned', 'olvido', 'main', 'soulDeck'].includes(c.zone)) { if (!v.dying) this.removeView(key); }
    }
    this.updateStatic(); this.updateChainLinks(); this.updateCombatArrows();
    return wait(longest + 30);
  }
  spawnNew(v, c) {
    const pi = c.owner, sg = pi === 0 ? 1 : -1;
    if (c.zone === 'hand' || c.zone === 'chain' || c.zone === 'souls') {
      const deck = c.soul ? LAYOUT.soulDeck : LAYOUT.mainDeck;
      if (c.zone === 'hand' || pi === 0) this.spawnAt(v, new THREE.Vector3(deck[0], 0.5, sg * deck[1]), false);
      else this.spawnAt(v, new THREE.Vector3(0, 3, -6.5), false);
    } else if (['van', 'rear'].includes(c.zone)) this.spawnAt(v, new THREE.Vector3(0, 0.03, sg * 2), true);
    else this.spawnAt(v, new THREE.Vector3(LAYOUT.olvido[0], 0.3, sg * LAYOUT.olvido[1]), true);
  }
  decorate(v) {
    const c = v.c; if (!c) return; const g = this.game;
    if (isEnte(c) && g.inPlay(c)) {
      const f = g.force(c), r = g.res(c); const key = `${f}|${r}|${c.damage}`;
      if (key !== v.badgeKey) {
        v.badgeKey = key; const cv = ART.statBadge(f, r, f - c.def.f, r - c.def.r, c.damage);
        if (!v.badge) { v.badge = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.24), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })); v.badge.position.set(0, -0.6, 0.009); v.badge.renderOrder = 5; v.mesh.add(v.badge); }
        if (v.badge.material.map) v.badge.material.map.dispose();
        const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; v.badge.material.map = tx; v.badge.material.needsUpdate = true;
      }
      v.badge.visible = true;
      const icons = [];
      if (c.sick && !g.hasKw(c, 'embestida') && c.ctrl === g.active) icons.push('hourglass');
      if (c.frozen) icons.push('traicion'); if (c.protectedFrom != null) icons.push('fraude');
      if (c.attacking) icons.push('sword'); if (c.blocking) icons.push('guardian'); if (g.noCombat(c)) icons.push('chain');
      const ik = icons.join(',');
      if (ik !== v.iconKey) {
        v.iconKey = ik; v.icons.clear();
        icons.forEach((k, i) => {
          const m = new THREE.Mesh(new THREE.CircleGeometry(0.14, 20), new THREE.MeshBasicMaterial({ map: tex('ic_' + k, () => { const cv = ART.mkCanvas(96, 96); const cc = cv.getContext('2d'); cc.fillStyle = '#efe3c6'; cc.beginPath(); cc.arc(48, 48, 46, 0, 7); cc.fill(); cc.strokeStyle = '#1a120c'; cc.lineWidth = 4; cc.stroke(); ART.drawIcon(cc, k, 48, 48, 62, k === 'sword' ? '#8e1c14' : k === 'traicion' ? SENDAS.traicion.color : k === 'fraude' ? SENDAS.fraude.color : '#3a2e22'); return cv; }), transparent: true, depthWrite: false }));
          m.position.set(0.36 - i * 0.3, 0.6, 0.012); m.renderOrder = 6; v.icons.add(m);
        });
      }
    } else { if (v.badge) v.badge.visible = false; if (v.iconKey) { v.icons.clear(); v.iconKey = ''; } }
    if (c.attachedTo != null && !v.chainIcon) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(0.12, 20), new THREE.MeshBasicMaterial({ map: tex('ic_chain2', () => { const cv = ART.mkCanvas(96, 96); const cc = cv.getContext('2d'); cc.fillStyle = '#2a2420'; cc.beginPath(); cc.arc(48, 48, 46, 0, 7); cc.fill(); ART.drawIcon(cc, 'chain', 48, 48, 66, '#d8c8a8'); return cv; }), transparent: true }));
      m.position.set(-0.38, -0.58, 0.012); v.mesh.add(m); v.chainIcon = m;
    }
  }
  updateStatic() {
    const g = this.game;
    for (const pi of [0, 1]) {
      const p = g.P[pi];
      for (const [w, n] of [['main', p.main.length], ['soul', p.soulDeck.length]]) { const m = this.deckMeshes[`${pi}${w}`]; const h = Math.max(0.004, n * 0.008); m.scale.y = h; m.position.y = h / 2; m.visible = n > 0; }
      const d = this.dice[pi];
      if (d.val !== p.will) {
        d.val = p.will; const cv = ART.textSprite(String(Math.max(0, p.will)), { size: 72, color: '#ff5a3c', stroke: '#0b0806', strokeW: 12, w: 160, h: 128 });
        if (d.spr.material.map) d.spr.material.map.dispose(); d.spr.material.map = new THREE.CanvasTexture(cv); d.spr.material.map.colorSpace = THREE.SRGBColorSpace; d.spr.material.needsUpdate = true;
      }
      const b = g.balance(pi), B = this.balances[pi];
      B.target = Math.max(-6, Math.min(6, b.diff)) * 0.075;
      const key = `${b.abs}|${b.con}|${p.destiny}`;
      if (key !== B.key) {
        B.key = key;
        B.pans.forEach((pan, k) => {
          pan.tokens.clear(); const n = k === 0 ? b.abs : b.con;
          for (let i = 0; i < n; i++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.022, 16), new THREE.MeshStandardMaterial({ color: k === 0 ? 0xe0b454 : 0x100c0a, metalness: k === 0 ? 0.8 : 0.2, roughness: 0.4, emissive: k === 0 ? 0x5a3a08 : 0 })); t.position.set(((i % 3) - 1) * 0.085, 0.02 + Math.floor(i / 3) * 0.024, ((i % 2) - 0.5) * 0.05); pan.tokens.add(t); }
        });
        B.halo.visible = b.state === 'virtuoso' || p.destiny === 'redencion'; B.horns.visible = b.state === 'corrupto' || p.destiny === 'caida';
        if (B.plaque.material.map) B.plaque.material.map.dispose(); B.plaque.material.map = this.plaqueTexture(b.diff, p.destiny); B.plaque.material.emissiveMap = B.plaque.material.map; B.plaque.material.needsUpdate = true;
      }
      const P = this.pilgrims[pi]; if (P) {
        const dk = p.destiny || '';
        if (dk !== P.destinyKey) {
          P.destinyKey = dk; const st = dk === 'redencion' ? { redencion: 'active', caida: 'sealed' } : dk === 'caida' ? { redencion: 'sealed', caida: 'active' } : {};
          const tx = new THREE.CanvasTexture(ART.pilgrimFace(p.pid, st)); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = this.aniso;
          P.mesh.material[4].map = tx; P.mesh.material[4].emissiveMap = tx; P.mesh.material[4].needsUpdate = true;
        }
      }
    }
    this.d10.target.set(LAYOUT.desc[0] - 0.5, 0.3, this.bandZ(g.circle));
    this.descGlow.position.z = this.bandZ(g.circle);
  }
  updateChainLinks() {
    this.chainLinks.clear();
    for (const [id, s] of this.chainBadges) { if (!this.game.chain.some(x => x.id === id)) { this.scene.remove(s); this.chainBadges.delete(id); } }
    const items = this.game.chain; if (!items.length) return;
    const mat = new THREE.MeshStandardMaterial({ color: 0x4a4038, metalness: 0.85, roughness: 0.3 });
    const x = LAYOUT.chain[0]; const z0 = LAYOUT.chain[1] + 0.95 + 0.85;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 8, 20), mat); ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.03, z0); this.chainLinks.add(ring);
    const zEnd = LAYOUT.chain[1] + 0.95 - (items.length - 1) * 0.52 - 0.7; const n = Math.floor((z0 - zEnd) / 0.16);
    for (let i = 0; i < n; i++) {
      const l = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 6, 14), mat);
      l.position.set(x - 0.6, 0.05 + (i / n) * items.length * 0.07 + 0.02, z0 - i * 0.16); l.rotation.set(i % 2 ? 0 : Math.PI / 2, Math.PI / 2, 0); l.scale.set(1, 1.5, 1); this.chainLinks.add(l);
    }
    // insignias de orden: 1º = el que se resuelve primero (arriba del todo)
    items.forEach((it, i) => {
      const order = items.length - i; const key = `${order}|${items.length}`;
      let s = this.chainBadges.get(it.id);
      if (!s || s.userData.key !== key) {
        if (s) this.scene.remove(s);
        const cv = ART.mkCanvas(128, 128), c = cv.getContext('2d');
        c.fillStyle = order === 1 ? '#8e1c14' : '#1a120c'; c.beginPath(); c.arc(64, 64, 58, 0, 7); c.fill(); c.strokeStyle = '#e8c878'; c.lineWidth = 6; c.stroke();
        c.fillStyle = '#fff0d6'; c.font = `700 60px ${ART.FONT_R}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(`${order}º`, 64, 68);
        s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: true, transparent: true })); s.material.map.colorSpace = THREE.SRGBColorSpace;
        s.scale.set(0.42, 0.42, 1); s.renderOrder = 55; s.userData.key = key; this.scene.add(s); this.chainBadges.set(it.id, s);
      }
      const p = this.chainPos(i); s.position.set(p.x + 0.62, p.y + 0.2, p.z - 0.55);
    });
  }
  updateCombatArrows() {
    const g = this.game; const want = new Map();
    for (const e of g.allEntes()) {
      if (!e.attacking) continue;
      const b = e.blockedBy ? g.find(e.blockedBy) : null;
      const from = new THREE.Vector3(this.rowX(e), 0.3, (e.ctrl === 0 ? 1 : -1) * (LAYOUT.vanZ - 0.5) - (e.ctrl === 0 ? 0.55 : -0.55));
      let to;
      if (b && g.inPlay(b)) to = new THREE.Vector3(this.rowX(e), 0.3, (b.ctrl === 0 ? 1 : -1) * 0.55);
      else { const P = this.pilgrims[1 - e.ctrl]; to = P.mesh.position.clone(); to.y = 0.3; to.x += (this.rowX(e)) * 0.12; to.z += (e.ctrl === 0 ? 0.6 : -0.6); }
      want.set(e.uid, [from, to, b ? 0xffb040 : 0xff3a1a]);
    }
    for (const [uid, a] of this.combatArrows) if (!want.has(uid)) { a.dispose(this.scene); this.combatArrows.delete(uid); }
    for (const [uid, [from, to, col]] of want) {
      let a = this.combatArrows.get(uid); if (!a) { a = new Arrow(this.scene, col); this.combatArrows.set(uid, a); }
      a.setColor(col); a.set(from, to);
    }
  }

  // ───────────────────────── flecha de objetivo ─────────────────────────
  setAim(from, color = 0xffc860, valid = null) {
    this.aimFrom = from ? from.clone() : null; this.aimValid = valid; this.aim.setColor(color);
    if (!from) this.aim.show(false);
  }
  infoPos(info) {
    if (!info) return null;
    if (info.kind === 'card') { const p = this.worldPos(info.uid); if (!p) return null; const v = this.views.get(info.uid); if (v && v.mesh.parent === this.handGroup) return null; return p.setY(0.2); }
    if (info.kind === 'chainToken') { const v = this.views.get('chain:' + info.id); return v ? v.mesh.position.clone().setY(0.25) : null; }
    if (info.kind === 'slot') { const s = this.slots.find(m => m.userData.kind === 'slot' && m.userData.player === info.player && m.userData.row === info.row && m.userData.idx === info.idx); return s ? s.position.clone().setY(0.15) : null; }
    if (info.kind === 'pilgrim') return this.pilgrims[info.player].mesh.position.clone().setY(0.2);
    if (info.kind === 'deck') return this.deckMeshes[`${info.player}${info.which}`].position.clone().setY(0.4);
    return null;
  }

  // ───────────────────────── resaltados ─────────────────────────
  setHighlights(refs, color = 0xffd08a) { this.clearHighlights(); for (const r of refs) this.highlight(r, color); }
  refMesh(r) {
    if (r.kind === 'card' || r.kind === 'soul') { const v = this.views.get(r.uid); return v ? v.glow : null; }
    if (r.kind === 'chain') { const it = this.game.chain.find(x => x.id === r.id); if (it) { const v = it.card ? this.views.get(it.card.uid) : this.views.get('chain:' + it.id); return v ? v.glow : null; } return null; }
    if (r.kind === 'slot') return this.slots.find(s => s.userData.kind === 'slot' && s.userData.player === r.player && s.userData.row === r.row && s.userData.idx === r.idx);
    if (r.kind === 'pilgrim') return this.pilgrims[r.player] && this.pilgrims[r.player].glow;
    if (r.kind === 'soulzone') return this.slots.find(s => s.userData.kind === 'soulzone' && s.userData.player === r.player);
    if (r.kind === 'deck') { const m = this.deckMeshes[`${r.player}${r.which}`]; if (!m) return null; if (!m.userData.glow) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.9), new THREE.MeshBasicMaterial({ map: tex('cglow', ART.cardGlowTexture), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); gl.rotation.x = -Math.PI / 2; gl.position.set(m.position.x, 0.005, m.position.z); gl.renderOrder = 2; this.scene.add(gl); m.userData.glow = gl; } return m.userData.glow; }
    return null;
  }
  highlight(r, color = 0xffd08a, op = 0.9) { const t = this.refMesh(r); if (!t) return; t.material.color.set(color); t.material.opacity = op; t.userData.pulse = true; this.highlights.set(t.uuid, t); }
  clearHighlights() { for (const t of this.highlights.values()) { t.material.opacity = 0; t.userData.pulse = false; } this.highlights.clear(); }
  refScreen(r) {
    let p = null;
    if (r.kind === 'card' || r.kind === 'soul') { const v = this.views.get(r.uid); if (v) p = v.mesh.getWorldPosition(new THREE.Vector3()); }
    else if (r.kind === 'world') p = new THREE.Vector3(r.x, r.y || 0, r.z);
    else { const m = this.refMesh(r); if (m) p = m.getWorldPosition(new THREE.Vector3()); else if (r.kind === 'balance') p = this.balances[r.player].g.position.clone().setY(0.6); else if (r.kind === 'descenso') p = new THREE.Vector3(LAYOUT.desc[0], 0, r.circle ? this.bandZ(r.circle) : 0); else if (r.kind === 'chainArea') p = new THREE.Vector3(LAYOUT.chain[0], 0, 0.3); else if (r.kind === 'will') p = this.dice[r.player].mesh.position.clone(); }
    if (!p) return null;
    const v = p.clone().project(this.camera); const el = this.renderer.domElement;
    return [(v.x + 1) / 2 * el.clientWidth, (1 - v.y) / 2 * el.clientHeight];
  }

  // ───────────────────────── puntero ─────────────────────────
  bindPointer() {
    const el = this.renderer.domElement;
    const setMouse = e => { const r = el.getBoundingClientRect(); this.mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
    el.addEventListener('pointermove', e => {
      setMouse(e);
      if (this.down && !(e.buttons & 1)) this.down = null;
      if (this.down && !this.dragging && this.down.info && this.down.info.kind === 'card') {
        const dx = e.clientX - this.down.x, dy = e.clientY - this.down.y;
        if (dx * dx + dy * dy > 90 && this.canDrag && this.canDrag(this.down.info.uid)) this.startDrag(this.down.info.uid);
      }
      if (this.dragging) this.moveDrag();
    });
    el.addEventListener('pointerdown', e => { setMouse(e); if (e.button !== 0) return; const hit = this.pick(); this.down = { x: e.clientX, y: e.clientY, info: hit && hit.userData, hand: hit && this.isInHand(hit) }; });
    el.addEventListener('pointerup', e => {
      setMouse(e);
      if (this.dragging) { this.endDrag(); this.down = null; return; }
      if (this.down && e.button === 0) { const hit = this.pick(); this.emit('click', hit ? hit.userData : { kind: 'none' }, e); }
      this.down = null;
    });
    window.addEventListener('pointerup', e => { if (e.target === el) return; if (this.dragging) this.endDrag(); this.down = null; });
    el.addEventListener('contextmenu', e => { e.preventDefault(); const hit = this.pick(); if (hit) this.emit('inspect', hit.userData); });
    el.addEventListener('pointerleave', () => this.mouse.set(-9, -9));
  }
  isInHand(obj) { let o = obj; while (o) { if (o === this.handGroup) return true; o = o.parent; } return false; }
  pick(exclude) {
    if (!exclude && !this.dragging) { const hu = this.handUidAt(); if (hu != null) { const v = this.views.get(hu); if (v && v.mesh.parent === this.handGroup) return v.mesh; } }
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const objs = [];
    for (const v of this.views.values()) if (v.mesh !== exclude && v.mesh.parent) objs.push(v.mesh);
    for (const p of this.pilgrims) if (p) objs.push(p.mesh);
    objs.push(...this.slots, ...Object.values(this.deckMeshes), this.descMesh, this.d10.mesh, ...this.dice.map(d => d.mesh), ...this.olvidoMeshes);
    for (const b of this.balances) b.g.traverse(o => { if (o.isMesh) objs.push(o); });
    const hits = this.raycaster.intersectObjects(objs, false).filter(h => h.object.userData && h.object.userData.kind);
    let best = null;
    for (const h of hits) {
      const k = h.object.userData.kind;
      const rank = this.isInHand(h.object) ? 4 : (k === 'card' || k === 'chainToken') ? 1 : k === 'slot' || k === 'soulzone' ? 3 : 2;
      if (!best || rank < best.rank || (rank === best.rank && h.distance < best.h.distance)) best = { h, rank };
    }
    if (best && best.h.object.userData.kind === 'descenso') {
      const vy = 1 - best.h.uv.y; const top = 110 / ART.DH, bh = (ART.DH - 130) / 9 / ART.DH;
      const n = Math.floor((vy - top) / bh) + 1; best.h.object.userData.circle = n >= 1 && n <= 9 ? n : null;
    }
    return best ? best.h.object : null;
  }
  startDrag(uid) { const v = this.views.get(uid); if (!v) return; this.dragging = v; this.scene.attach(v.mesh); v.anim = null; this.emit('dragStart', uid); }
  moveDrag() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const p = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.9), p)) {
      const v = this.dragging; v.mesh.position.lerp(p, 0.5);
      v.mesh.quaternion.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.25, 0, 0, 'YXZ')), 0.3); v.mesh.scale.setScalar(1.05);
    }
  }
  endDrag() { const v = this.dragging; const hit = this.pick(v.mesh); this.dragging = null; this.emit('drop', v.c.uid, hit ? hit.userData : { kind: 'none' }); }

  // ───────────────────────── atmósfera ─────────────────────────
  setAtmosphere(n, instant) {
    const C = CIRCLES[n];
    const from = { tint: this.tableMat.color.clone(), hemi: this.hemi.intensity, key: this.key.intensity, glow: this.glowLight.color.clone(), gi: this.glowLight.intensity, bg: this.scene.background.clone(), exp: this.renderer.toneMappingExposure };
    const to = { tint: new THREE.Color(C.tint).lerp(new THREE.Color(0xffffff), 0.72), hemi: 0.2 + C.light * 0.8, key: 0.5 + C.light * 2.1, glow: new THREE.Color(C.accent), gi: 1.5 + n * 0.35, bg: new THREE.Color(CIRCLE_ENV[n].fog), exp: 0.92 + C.light * 0.22 };
    this.env.setCircle(n); if (this.post) this.post.setCircle(n); this.scene.fog.color.set(CIRCLE_ENV[n].fog);
    this.atmo = { from, to, t: instant ? 1 : 0, dur: 2.6 };
    this.ambient.setKind(C.particle, C.n === 1 ? 0xd8d2c4 : C.accent);
  }
  applyAtmo(dt) {
    const A = this.atmo; if (!A.to) return;
    if (A.t < 1) A.t = Math.min(1, A.t + dt / A.dur);
    const k = ease.io(A.t);
    this.tableMat.color.copy(A.from.tint).lerp(A.to.tint, k);
    this.hemi.intensity = A.from.hemi + (A.to.hemi - A.from.hemi) * k; this.key.intensity = A.from.key + (A.to.key - A.from.key) * k;
    this.glowLight.color.copy(A.from.glow).lerp(A.to.glow, k); this.glowLight.intensity = A.from.gi + (A.to.gi - A.from.gi) * k;
    this.scene.background.copy(A.from.bg).lerp(A.to.bg, k); this.renderer.toneMappingExposure = A.from.exp + (A.to.exp - A.from.exp) * k;
  }

  // ───────────────────────── efectos ─────────────────────────
  worldPos(uid) { const v = this.views.get(uid); return v ? v.mesh.getWorldPosition(new THREE.Vector3()) : null; }
  pilgrimPos(pi) { return this.pilgrims[pi] ? this.pilgrims[pi].mesh.position.clone() : new THREE.Vector3(); }
  flash(uid, color, strength = 1) { const v = this.views.get(uid); if (v) { v.flash = strength; v.flashCol.set(color); } }
  async fx(name, d) {
    const A = this.audio;
    switch (name) {
      case 'draw': A && A.paper(); await this.sync(520); break;
      case 'absolve': {
        A && A.absolve(); await this.sync(620);
        const p = this.worldPos(d.uid); if (p) { this.fxAdd.emit(p.x, 0.2, p.z, 90, { color: '#ffd27a', speed: 0.8, life: 1.6, spread: 0.9, up: 1.6 }); this.flash(d.uid, '#ffd27a', 1.4); lightPillar(this.scene, p, 0xffd27a, { radius: 0.4 }); shockwave(this.scene, p, 0xffc860, { size: 2.2 }); this.post.doFlash(0xffe0a0, 0.06); }
        this.emit('fxAbsolve', d); await wait(500); break;
      }
      case 'condemn': {
        A && A.condemn(); await this.sync(950); const p = this.worldPos(d.uid);
        if (p) { this.fxDark.emit(p.x, 0.15, p.z, 140, { color: '#0c0908', speed: 1.1, life: 2.2, spread: 1.2, up: 0.9 }); this.fxAdd.emit(p.x, 0.1, p.z, 50, { color: '#ff4a1a', speed: 0.9, life: 1.1, spread: 0.9 }); this.flash(d.uid, '#ff4a20', 0.8); shockwave(this.scene, p, 0x9a1a08, { size: 2.6, width: 0.35 }); lightPillar(this.scene, p, 0x6a0800, { height: 4, radius: 0.45, dur: 1.2 }); this.post.doFlash(0x300000, 0.18); }
        this.emit('fxCondemn', d); await wait(700); break;
      }
      case 'tapSoul': A && A.tap(); await this.sync(300); { const p = this.worldPos(d.uid); if (p) this.fxAdd.emit(p.x, 0.15, p.z, 14, { color: '#ffe0a0', speed: 0.5, life: 0.8, spread: 0.4 }); } this.emit('fxEnergy', [d.uid], d.pi); break;
      case 'autoTap': A && A.tap(); this.emit('fxEnergy', d.uids, d.pi); await this.sync(300); break;
      case 'chainIn': {
        const it = d.item; if (it.card) { const v = this.cardView(it.card); v.slam = true; if (!v.mesh.parent) this.spawnNew(v, it.card); }
        const pr = this.sync(); await wait(330);
        const isJ = it.card && it.card.def.type === 'juicio'; A && A.chain(isJ);
        const pos = this.chainPos(this.game.chain.length - 1);
        if (isJ) { lightning(this.scene, pos.clone().add(new THREE.Vector3(-1.5, 11, -4)), pos.clone().setY(0.2), 0xd8e8ff); this.post.doFlash(0xc8dcff, 0.35); this.camPunch = 0.6; }
        else shockwave(this.scene, pos, 0xffb070, { size: 1.6 });
        this.fxAdd.emit(pos.x, pos.y + 0.1, pos.z, isJ ? 70 : 35, { color: isJ ? '#ffe6b0' : '#ffb070', speed: 2.2, life: 0.5, spread: 1.1, up: 0.5 });
        this.shake = isJ ? 0.12 : 0.06; this.ring(pos, 0xfff0c8, 1.4); this.emit('fxChain', it);
        await pr; break;
      }
      case 'resolveStart': {
        const it = d.item; const v = this.views.get(it.card ? it.card.uid : 'chain:' + it.id); A && A.resolve();
        if (v) { v.flash = 1.3; v.flashCol.set('#ffe6b0'); const p = v.mesh.position; this.fxAdd.emit(p.x, p.y + 0.1, p.z, 40, { color: '#fff0c0', speed: 0.8, life: 0.7, spread: 1 }); shockwave(this.scene, p, 0xffe0a0, { size: 1.8, dur: 0.7 }); }
        this.emit('fxResolve', it); await wait(560); break;
      }
      case 'enter': { A && A.thump(); await this.sync(380); const p = this.worldPos(d.uid); if (p) this.fxDark.emit(p.x, 0.05, p.z, 24, { color: '#3a2e24', speed: 0.7, life: 0.7, spread: 1.2, up: 0.3 }); break; }
      case 'die': {
        A && A.die(); const v = this.views.get(d.uid);
        if (v) { v.dying = true; v.tint = 0.25; v.flash = 1; v.flashCol.set('#ff3a20'); this.crack(v); const p = v.mesh.position; this.fxDark.emit(p.x, 0.1, p.z, 60, { color: '#100b08', speed: 0.9, life: 1.2, spread: 1 }); this.fxAdd.emit(p.x, 0.1, p.z, 40, { color: '#ff5020', speed: 1.4, life: 0.6, spread: 0.8 }); shockwave(this.scene, p, 0xff3010, { size: 1.8, dur: 0.6 }); }
        await wait(650); if (v) { v.dying = false; v.tint = 1; if (v.crackMesh) { v.mesh.remove(v.crackMesh); v.crackMesh = null; } } break;
      }
      case 'burn': {
        A && A.burn(); const v = this.views.get(d.uid);
        if (v) { v.dying = true; const p = v.mesh.position.clone();
          const bm = burnMaterial(v.mesh.material[4].map); v.mesh.material = [...v.mesh.material.slice(0, 4), bm, bm]; v.burning = true;
          for (let k = 0; k <= 12; k++) { bm.uniforms.uP.value = k / 12; this.fxAdd.emit(p.x, 0.1, p.z, 22, { color: k % 2 ? '#ff7a2a' : '#ffc060', speed: 0.9, life: 1.2, w: 1, h: 1.4, up: 1.4 }); if (k % 2) this.fxDark.emit(p.x, 0.1, p.z, 18, { color: '#0a0706', speed: 0.7, life: 1.8, w: 1, h: 1.4, up: 1 }); await wait(85); }
          this.removeView(d.uid); }
        break;
      }
      case 'damage': { A && A.hit(); const p = this.worldPos(d.uid); this.flash(d.uid, '#ff3a20', 1.2); if (p) { this.fxAdd.emit(p.x, 0.2, p.z, 60, { color: '#ff5a2a', speed: 2.2, life: 0.55, spread: 0.6 }); this.popup(p, `−${d.n}`, '#ff5a3c'); shockwave(this.scene, p, 0xff4010, { size: 1.4, dur: 0.5 }); } this.shake = Math.max(this.shake, 0.06); await wait(400); break; }
      case 'buff': { A && A.bless(); this.flash(d.uid, '#ffd27a', 1); const p = this.worldPos(d.uid); if (p) this.fxAdd.emit(p.x, 0.2, p.z, 24, { color: '#ffd27a', speed: 0.6, life: 0.8, spread: 0.8 }); await this.sync(250); break; }
      case 'freeze': { A && A.frost(); this.flash(d.uid, '#9adcff', 1.2); const p = this.worldPos(d.uid); if (p) this.fxAdd.emit(p.x, 0.2, p.z, 30, { color: '#bfeaff', speed: 0.5, life: 1.1, spread: 1 }); await this.sync(300); break; }
      case 'move': A && A.paper(); await this.sync(450); break;
      case 'attack': A && A.attack(); await this.sync(520); for (const u of d.uids || []) { const p = this.worldPos(u); if (p) { shockwave(this.scene, p, 0xff3a10, { size: 1.3, dur: 0.6 }); this.fxAdd.emit(p.x, 0.1, p.z, 30, { color: '#ff5a20', speed: 1, life: 0.8, spread: 0.8 }); } } this.shake = Math.max(this.shake, 0.05); break;
      case 'blocks': A && A.thump(); await this.sync(560); break;
      case 'combatHits': {
        for (const h of d.hits) {
          const v = this.views.get(h.from); if (!v) continue;
          const from = v.mesh.position.clone(); const to = h.to ? this.worldPos(h.to) : this.pilgrimPos(h.toPilgrim); if (!to) continue;
          const mid = from.clone().lerp(to, h.to ? 0.35 : 0.25); mid.y += 0.35; const q = v.mesh.quaternion.clone();
          v.anim = { p0: from, p1: mid, q0: q, q1: q, s0: v.mesh.scale.x, s1: v.mesh.scale.x, t: 0, dur: 0.16, arc: 0, ease: ease.slam };
          await wait(170); A && A.hit(); this.fxAdd.emit(to.x, 0.25, to.z, 70, { color: '#ff6a3a', speed: 2.6, life: 0.5, spread: 0.5 }); shockwave(this.scene, to, 0xff5020, { size: 1.5, dur: 0.45 }); this.post.doFlash(0x401000, 0.12);
          if (h.to) { this.flash(h.to, '#ff3a20', 1.2); this.popup(to, `−${h.n}`, '#ff5a3c'); } else { this.popup(to, `−${h.n}`, '#ff5a3c', 1.6); this.shake = 0.14; }
          v.anim = { p0: mid, p1: from, q0: q, q1: q, s0: v.mesh.scale.x, s1: v.mesh.scale.x, t: 0, dur: 0.28, arc: 0, ease: ease.out };
          await wait(200);
        }
        await wait(250); break;
      }
      case 'will': {
        const D = this.dice[d.pi]; D.spin = 1.2; const pos = D.mesh.position;
        if (d.delta < 0) { A && A.pilgrimHit(); this.shake = Math.max(this.shake, 0.14); if (d.pi === 0) this.post.doHurt(0.85); else this.post.doFlash(0x500800, 0.2); shockwave(this.scene, this.pilgrimPos(d.pi), 0xff2a10, { size: 3, dur: 0.7 }); this.fxAdd.emit(pos.x, 0.4, pos.z, 40, { color: '#ff3a20', speed: 1.4, life: 0.6, spread: 0.4 }); const P = this.pilgrims[d.pi]; P.glow.material.color.set('#ff2a10'); P.glow.material.opacity = 1; P.hitFade = 1; }
        else { A && A.bless(); this.fxAdd.emit(pos.x, 0.4, pos.z, 30, { color: '#ffd27a', speed: 0.8, life: 1, spread: 0.4 }); }
        this.popup(pos.clone().add(new THREE.Vector3(0, 0.4, 0)), `${d.delta > 0 ? '+' : '−'}${Math.abs(d.delta)}`, d.delta > 0 ? '#ffd27a' : '#ff5a3c', 1.4);
        this.updateStatic(); this.emit('fxWill', d); await wait(450); break;
      }
      case 'circle': {
        if (!d.initial) A && A.descend();
        this.setAtmosphere(d.circle, d.initial); this.d10.spin = d.initial ? 0 : 2.4; this.updateStatic();
        this.emit('circle', d.circle, d.initial, d.reason);
        this.setD10(d.circle);
        if (!d.initial) {
          const acc = CIRCLES[d.circle].accent; const dp = new THREE.Vector3(LAYOUT.desc[0], 0.1, this.bandZ(d.circle));
          shockwave(this.scene, dp, acc, { size: 26, dur: 2.4, width: 0.04 }); shockwave(this.scene, dp, acc, { size: 14, dur: 1.6, width: 0.08 });
          lightPillar(this.scene, dp, acc, { height: 12, radius: 0.8, dur: 2.2 }); this.post.doFlash(acc, 0.35); this.camPunch = 1; this.shake = 0.12;
          for (let i = 0; i < 12; i++) this.fxAdd.emit(-8 + i * 1.5, 0.3, 0, 26, { color: '#' + new THREE.Color(acc).getHexString(), speed: 0.7, life: 2.2, w: 1.5, h: 11, up: 1.5 });
          await wait(2600);
        }
        break;
      }
      case 'balanceState': { const B = this.balances[d.pi]; A && (d.state === 'virtuoso' ? A.absolve() : d.state === 'corrupto' ? A.condemn() : A.tap()); const p = B.g.position.clone(); this.fxAdd.emit(p.x, 1.1, p.z, 50, { color: d.state === 'corrupto' ? '#ff4a20' : '#ffd27a', speed: 0.7, life: 1.2, spread: 0.6 }); this.updateStatic(); this.emit('balanceState', d.pi, d.state); await wait(700); break; }
      case 'destiny': { A && A.destiny(d.destiny); this.updateStatic(); const P = this.pilgrims[d.pi]; lightPillar(this.scene, P.mesh.position, d.destiny === 'redencion' ? 0xffd27a : 0xff2a08, { height: 14, radius: 1.3, dur: 2.6 }); shockwave(this.scene, P.mesh.position, d.destiny === 'redencion' ? 0xffd27a : 0xff2a08, { size: 8, dur: 1.6 }); this.post.doFlash(d.destiny === 'redencion' ? 0xffe8b0 : 0x600800, 0.45); this.camPunch = 1; P.glow.material.color.set(d.destiny === 'redencion' ? '#ffd27a' : '#ff3010'); P.glow.material.opacity = 1; P.hitFade = 0.4; const p = P.mesh.position; this.fxAdd.emit(p.x, 0.3, p.z, 140, { color: d.destiny === 'redencion' ? '#ffe08a' : '#ff5020', speed: 1, life: 2, spread: 2 }); this.emit('destiny', d.pi, d.destiny); await wait(1800); break; }
      case 'fizzle': A && A.fizzle(); await wait(500); break;
      case 'countered': { A && A.fizzle(); const v = this.views.get(d.item.card ? d.item.card.uid : 'chain:' + d.item.id); if (v) { v.tint = 0.3; this.crack(v); const p = v.mesh.position; this.fxDark.emit(p.x, p.y, p.z, 50, { color: '#0a0706', speed: 1, life: 1.2, spread: 1 }); } await wait(700); if (v) { v.tint = 1; if (v.crackMesh) { v.mesh.remove(v.crackMesh); v.crackMesh = null; } } break; }
      case 'finalJudgment': {
        A && A.judgment(); this.emit('finalJudgment'); this.post.doFlash(0xdff2ff, 0.9); this.camPunch = 1;
        for (const pi of [0, 1]) { const pp = this.pilgrimPos(pi); lightPillar(this.scene, pp, 0xcfe8ff, { height: 16, radius: 1.4, dur: 3 }); lightning(this.scene, pp.clone().add(new THREE.Vector3(0, 12, -3)), pp.clone().setY(0.3), 0xdff0ff, { dur: 0.7, branches: 3 }); }
        await wait(400); break;
      }
    }
  }
  ring(pos, color, scale = 1) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.copy(pos); m.position.y = Math.max(0.05, pos.y) + 0.02; m.userData.ring = { t: 0, s: scale }; this.scene.add(m); (this.rings || (this.rings = [])).push(m);
  }
  crack(v) {
    const cv = ART.mkCanvas(256, 358), c = cv.getContext('2d'); const r = ART.rng(v.c ? v.c.uid : 3);
    c.strokeStyle = 'rgba(8,5,3,.95)'; c.lineWidth = 3;
    for (let k = 0; k < 6; k++) { c.beginPath(); let x = 128, y = 179; c.moveTo(x, y); for (let i = 0; i < 7; i++) { x += (r() - 0.5) * 80; y += (r() - 0.5) * 90; c.lineTo(x, y); } c.stroke(); }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false }));
    m.position.z = 0.008; m.renderOrder = 7; v.mesh.add(m); v.crackMesh = m;
  }
  popup(pos, text, color, scale = 1) {
    const cv = ART.textSprite(text, { size: 76, color, stroke: '#0b0806', strokeW: 10, w: 200, h: 128 });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false }));
    s.material.map.colorSpace = THREE.SRGBColorSpace; s.scale.set(0.9 * scale, 0.58 * scale, 1); s.position.copy(pos); s.position.y += 0.5; s.renderOrder = 40;
    s.userData.pop = { t: 0 }; this.scene.add(s); (this.pops || (this.pops = [])).push(s);
  }
  project(x, y, z) { const v = new THREE.Vector3(x, y, z).project(this.camera); const el = this.renderer.domElement; return [(v.x + 1) / 2 * el.clientWidth, (1 - v.y) / 2 * el.clientHeight]; }
  projectVec(p) { return this.project(p.x, p.y, p.z); }

  // ───────────────────────── bucle ─────────────────────────
  frame() {
    const dt = Math.min(0.05, this.clock.getDelta()); const t = this.clock.elapsedTime;
    for (const v of this.views.values()) {
      const a = v.anim;
      if (a) {
        a.t += dt; const k = a.dur > 0 ? Math.min(1, a.t / a.dur) : 1; const e = a.ease(k);
        v.mesh.position.lerpVectors(a.p0, a.p1, e); const up = a.arc * Math.sin(Math.PI * k);
        if (v.mesh.parent === this.scene) v.mesh.position.y += up; else v.mesh.position.z += up;
        v.mesh.quaternion.slerpQuaternions(a.q0, a.q1, e); v.mesh.scale.setScalar(a.s0 + (a.s1 - a.s0) * e);
        if (k >= 1) { v.anim = null; if (a.slam) this.shake = Math.max(this.shake, 0.05); }
      }
      const mats = v.mesh.material;
      if (v.flash > 0) v.flash = Math.max(0, v.flash - dt * 1.6);
      if (!v.burning) for (const m of [mats[4], mats[5]]) {
        m.color.setRGB(v.tint, v.tint, v.tint);
        if (v.flash > 0) { m.emissive.copy(v.flashCol); m.emissiveIntensity = 0.3 + v.flash * 1.6; } else { m.emissive.setRGB(1, 1, 1); m.emissiveIntensity = 0.3 * v.tint; }
      }
      if (v.glow.userData.pulse) v.glow.material.opacity = 0.65 + Math.sin(t * 5) * 0.3;
    }
    for (const s of this.slots) if (s.userData.pulse) s.material.opacity = 0.5 + Math.sin(t * 5) * 0.3;
    for (const p of this.pilgrims) if (p) {
      if (p.glow.userData.pulse) p.glow.material.opacity = 0.55 + Math.sin(t * 5) * 0.3;
      else if (p.hitFade > 0) { p.hitFade -= dt * 0.8; p.glow.material.opacity = Math.max(0, p.hitFade); }
      else if (this.game && this.game.priority != null && this.pilgrims[this.game.priority] === p) { p.glow.material.color.set('#ffcf80'); p.glow.material.opacity = 0.35 + Math.sin(t * 2.2) * 0.15; }
      else p.glow.material.opacity = 0;
    }
    for (const m of Object.values(this.deckMeshes)) if (m.userData.glow && m.userData.glow.userData.pulse) m.userData.glow.material.opacity = 0.6 + Math.sin(t * 5) * 0.3;
    for (const d of this.dice) { d.mesh.rotation.y += dt * (0.25 + d.spin * 8); d.mesh.rotation.x = 0.4 + Math.sin(t * 0.7) * 0.05; if (d.spin > 0) d.spin = Math.max(0, d.spin - dt * 2); d.mesh.position.y = 0.3 + d.spin * 0.4; }
    const D = this.d10; D.mesh.position.lerp(D.target, Math.min(1, dt * 3)); D.mesh.position.y = 0.3 + D.spin * 0.6; D.mesh.rotation.y += dt * (0.3 + D.spin * 6); D.mesh.rotation.z = D.spin * 2; if (D.spin > 0) D.spin = Math.max(0, D.spin - dt);
    this.descGlow.material.opacity = 0.3 + Math.sin(t * 1.5) * 0.1;

    for (const B of this.balances) { B.angle += (B.target - B.angle) * Math.min(1, dt * 2.5); B.pivot.rotation.z = B.angle + Math.sin(t * 1.3) * 0.006; for (const p of B.pans) p.hang.rotation.z = -B.pivot.rotation.z; B.halo.rotation.z += dt; }
    if (this.rings) this.rings = this.rings.filter(m => { m.userData.ring.t += dt; const k = m.userData.ring.t / 0.8; m.scale.setScalar(1 + k * 2 * m.userData.ring.s); m.material.opacity = Math.max(0, 0.9 - k); if (k >= 1) { this.scene.remove(m); return false; } return true; });
    if (this.pops) this.pops = this.pops.filter(s => { s.userData.pop.t += dt; const k = s.userData.pop.t / 1.3; s.position.y += dt * 0.5; s.material.opacity = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3; if (k >= 1) { this.scene.remove(s); return false; } return true; });
    for (const s of this.chainBadges.values()) s.scale.setScalar(0.42 + Math.sin(t * 4) * 0.02);
    this.fxAdd.update(dt); this.fxDark.update(dt); this.ambient.update(dt, t); this.applyAtmo(dt); this.env.update(dt, t); tickAnimations(dt);
    // cámara: entrada cinematográfica, respiración leve, golpe de cámara y temblor
    if (this.camIntro > 0) this.camIntro = Math.max(0, this.camIntro - dt * 0.45);
    if (this.camPunch > 0) this.camPunch = Math.max(0, this.camPunch - dt * 1.4);
    const intro = Math.pow(this.camIntro, 2) * 9, punch = Math.sin(Math.min(1, this.camPunch) * Math.PI) * 0.9;
    const cp = this.camBase.clone().addScaledVector(this.camDir, intro - punch); cp.x += Math.sin(t * 0.21) * 0.05 + Math.sin(this.camIntro * 3) * this.camIntro * 1.5; cp.y += Math.sin(t * 0.33) * 0.04;
    if (this.shake > 0) { this.shake = Math.max(0, this.shake - dt * 0.5); const s = this.shake; cp.x += (Math.random() - 0.5) * s; cp.y += (Math.random() - 0.5) * s; cp.z += (Math.random() - 0.5) * s; }
    this.camera.position.copy(cp); this.camera.lookAt(this.camTarget);
    // hover + flecha de objetivo
    if (!this.dragging && this.game) {
      const hit = this.pick(); const info = hit ? hit.userData : null; const key = info ? JSON.stringify(info) : '';
      if (key !== this.hoverKey) {
        this.hoverKey = key; this.emit('hover', info);
        const inHand = info && info.kind === 'card' && hit && this.isInHand(hit) && this.game.P[0].hand.some(c => c.uid === info.uid);
        const hh = inHand ? info.uid : null; const hb = !inHand && info && info.kind === 'card' && !this.aimFrom ? info.uid : null;
        if (hh !== this.hoverHand || hb !== this.hoverBoard) { this.hoverHand = hh; this.hoverBoard = hb; this.sync(180); }
      }
      if (this.aimFrom) {
        let to = this.aimValid && info && this.aimValid(info) ? this.infoPos(info) : null;
        if (!to) { this.raycaster.setFromCamera(this.mouse, this.camera); to = new THREE.Vector3(); if (!this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.15), to)) to = null; }
        if (to && to.distanceTo(this.aimFrom) > 0.4) this.aim.set(this.aimFrom, to); else this.aim.show(false);
      }
    }
    this.emit('frame');
    this.post.render(dt, t);
  }
}
