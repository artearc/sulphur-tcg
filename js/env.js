// SULPHUR — entorno 3D: el libro sobre el altar, el embudo del Infierno, lava, velas, braseros,
// partículas procedurales en GPU y primitivas de VFX (pilares de luz, rayos, ondas, quemado).
import * as THREE from 'three';
import * as ART from './art.js';

const NOISE_GLSL = `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
`;

// Tono de cada Círculo para el entorno (lava, niebla, luz inferior).
export const CIRCLE_ENV = [null,
  { hot: [0.75, 0.72, 0.66], crust: [0.05, 0.05, 0.06], heat: 0.35, fog: 0x1c1a18, under: 0x9a948a, ember: [1.0, 0.8, 0.55], embers: 0.35 },
  { hot: [1.2, 0.35, 0.3], crust: [0.05, 0.03, 0.04], heat: 0.6, fog: 0x1e1416, under: 0xb04a40, ember: [1.0, 0.55, 0.5], embers: 0.5 },
  { hot: [0.8, 1.0, 0.25], crust: [0.04, 0.05, 0.02], heat: 0.55, fog: 0x141a0e, under: 0x8aa030, ember: [0.85, 1.0, 0.4], embers: 0.45 },
  { hot: [1.4, 1.0, 0.3], crust: [0.06, 0.04, 0.01], heat: 0.8, fog: 0x1a140a, under: 0xd0a040, ember: [1.0, 0.85, 0.4], embers: 0.7 },
  { hot: [1.8, 0.5, 0.12], crust: [0.08, 0.02, 0.01], heat: 1.2, fog: 0x200a06, under: 0xff5020, ember: [1.0, 0.45, 0.12], embers: 1.0 },
  { hot: [1.9, 0.8, 0.15], crust: [0.08, 0.03, 0.01], heat: 1.35, fog: 0x1e0e04, under: 0xff7a20, ember: [1.0, 0.6, 0.15], embers: 1.2 },
  { hot: [1.4, 0.12, 0.08], crust: [0.06, 0.01, 0.01], heat: 1.0, fog: 0x160606, under: 0xc01818, ember: [1.0, 0.3, 0.2], embers: 0.8 },
  { hot: [0.9, 0.35, 1.4], crust: [0.03, 0.01, 0.05], heat: 0.8, fog: 0x0e0814, under: 0x8a40d0, ember: [0.8, 0.5, 1.0], embers: 0.6 },
  { hot: [0.5, 1.0, 1.6], crust: [0.02, 0.04, 0.07], heat: 0.55, fog: 0x060a10, under: 0x5ab0e8, ember: [0.7, 0.9, 1.0], embers: 0.3 },
];

// ───────────────────────── partículas procedurales (GPU) ─────────────────────────
// La posición de cada partícula se calcula en el shader a partir del tiempo y de su semilla.
export class GPUParticles {
  constructor(count, { base, rise = 2.5, life = 4, size = 0.08, colorA = [1, 0.8, 0.4], colorB = [1, 0.2, 0.05], intensity = 3, drift = 0.6, fall = false, blending = THREE.AdditiveBlending, spread = 0 }) {
    const geo = new THREE.BufferGeometry(); const pos = new Float32Array(count * 3), seed = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) { const b = base(i); pos.set([b[0], b[1], b[2]], i * 3); seed.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    this.uniforms = { uTime: { value: 0 }, uRise: { value: rise }, uLife: { value: life }, uSize: { value: size }, uColorA: { value: new THREE.Vector3(...colorA) }, uColorB: { value: new THREE.Vector3(...colorB) }, uIntensity: { value: intensity }, uDrift: { value: drift }, uFall: { value: fall ? 1 : 0 }, uSpread: { value: spread }, uPR: { value: Math.min(window.devicePixelRatio, 2) } };
    this.mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms, transparent: true, depthWrite: false, blending,
      vertexShader: `attribute vec4 aSeed; uniform float uTime,uRise,uLife,uSize,uDrift,uFall,uSpread,uPR; varying float vT; varying float vFade; varying float vFlick;
        void main(){ float life=uLife*(0.55+aSeed.x*0.9); float t=mod(uTime+aSeed.y*life*7.0, life)/life; vec3 p=position;
          float dir = uFall>0.5 ? -1.0 : 1.0; p.y += dir*t*uRise*(0.5+aSeed.z);
          p.x += sin(uTime*1.3+aSeed.w*20.0+t*6.0)*uDrift*t + (aSeed.z-0.5)*t*uSpread;
          p.z += cos(uTime*1.1+aSeed.x*17.0+t*5.0)*uDrift*t + (aSeed.w-0.5)*t*uSpread;
          vT=t; vFade=smoothstep(0.0,0.08,t)*(1.0-smoothstep(0.55,1.0,t)); vFlick=0.55+0.45*sin(uTime*(8.0+aSeed.w*14.0)+aSeed.x*50.0);
          vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
          gl_PointSize=uSize*(0.5+aSeed.x)*(1.0-0.5*t)*(420.0/-mv.z)*uPR; }`,
      fragmentShader: `uniform vec3 uColorA,uColorB; uniform float uIntensity; varying float vT; varying float vFade; varying float vFlick;
        void main(){ vec2 c=gl_PointCoord-0.5; float d=length(c); if(d>0.5) discard; float a=smoothstep(0.5,0.0,d);
          vec3 col=mix(uColorA,uColorB,vT)*uIntensity*vFlick; gl_FragColor=vec4(col*a*vFade, a*vFade); }`,
    });
    this.points = new THREE.Points(geo, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 18;
  }
  update(t) { this.uniforms.uTime.value = t; }
}

// ───────────────────────── entorno ─────────────────────────
export class Environment {
  constructor(scene, L) {
    this.scene = scene; this.L = L; this.t = 0; this.lights = []; this.flames = []; this.systems = [];
    this.buildBook(); this.buildAltar(); this.buildAbyss(); this.buildCandles(); this.buildBraziers(); this.buildParticles(); this.buildAtmosphere();
  }
  // Rayos de luz volumétricos (luz dramática desde una sola fuente) y humo que brota de los bordes que arden.
  buildAtmosphere() {
    const L = this.L;
    this.shaftU = { uTime: { value: 0 }, uColor: { value: new THREE.Color(1, 0.85, 0.6) }, uA: { value: 0.07 } };
    const shaftMat = new THREE.ShaderMaterial({
      uniforms: this.shaftU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: NOISE_GLSL + `uniform float uTime,uA; uniform vec3 uColor; varying vec2 vUv;
        void main(){ float edge=smoothstep(0.0,0.35,vUv.x)*smoothstep(1.0,0.65,vUv.x); float len=smoothstep(0.0,0.25,vUv.y)*smoothstep(1.0,0.55,vUv.y);
          float n=fbm(vec2(vUv.x*3.0+uTime*0.05, vUv.y*1.5-uTime*0.08)); gl_FragColor=vec4(uColor*uA*edge*len*(0.45+n), 1.0); }`,
    });
    this.shafts = [];
    const from = new THREE.Vector3(-14, 22, -16);
    for (const [tx, tz, w] of [[-2, 1, 3.2], [1.5, -1, 2.2], [4, 2.5, 1.6], [-5, -2.5, 1.8]]) {
      const to = new THREE.Vector3(tx, 0, tz); const len = from.distanceTo(to);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), shaftMat);
      m.position.copy(from).lerp(to, 0.5); m.lookAt(to); m.rotateX(Math.PI / 2);
      m.renderOrder = 17; this.scene.add(m); this.shafts.push(m);
      const m2 = m.clone(); m2.rotateY(Math.PI / 2); this.scene.add(m2); this.shafts.push(m2);
    }
    // humo: un plano con ruido animado, visible solo en el perímetro del libro
    this.smokeU = { uTime: { value: 0 }, uColor: { value: new THREE.Color(0.35, 0.28, 0.24) }, uA: { value: 0.55 }, uHalf: { value: new THREE.Vector2(L.bookW / 2, L.bookH / 2) } };
    const smoke = new THREE.Mesh(new THREE.PlaneGeometry(L.bookW + 6, L.bookH + 6), new THREE.ShaderMaterial({
      uniforms: this.smokeU, transparent: true, depthWrite: false, fog: false,
      vertexShader: `varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: NOISE_GLSL + `uniform float uTime,uA; uniform vec3 uColor; uniform vec2 uHalf; varying vec2 vP;
        void main(){ vec2 d=abs(vP)-uHalf; float dist=max(d.x,d.y); float ring=smoothstep(-1.4,0.1,dist)*smoothstep(2.6,0.4,dist);
          float n=fbm(vP*0.45+vec2(uTime*0.06,-uTime*0.09)); float n2=fbm(vP*0.9-vec2(uTime*0.11,uTime*0.04));
          float a=ring*smoothstep(0.35,0.8,n*0.7+n2*0.5)*uA; gl_FragColor=vec4(uColor, a); }`,
    }));
    smoke.rotation.x = -Math.PI / 2; smoke.position.y = 0.35; smoke.renderOrder = 16; this.scene.add(smoke); this.smoke = smoke;
  }
  buildBook() {
    const L = this.L; const maps = ART.bookMaps(L);
    const t = (cv, srgb = true) => { const x = new THREE.CanvasTexture(cv); if (srgb) x.colorSpace = THREE.SRGBColorSpace; x.anisotropy = 16; return x; };
    const color = t(maps.color), emis = t(maps.emissive), metal = t(maps.metal, false);
    this.bookMat = new THREE.MeshStandardMaterial({ map: color, bumpMap: color, bumpScale: 0.6, roughnessMap: null, roughness: 0.88, metalnessMap: metal, metalness: 1, emissive: 0xffffff, emissiveMap: emis, emissiveIntensity: 2.2, alphaTest: 0.5 });
    const book = new THREE.Mesh(new THREE.PlaneGeometry(L.bookW, L.bookH, 1, 1), this.bookMat);
    book.rotation.x = -Math.PI / 2; book.receiveShadow = true; book.userData = { kind: 'table' }; this.scene.add(book); this.book = book;
    // bloque de páginas y tapas de cuero con cantoneras de oro
    const pages = new THREE.Mesh(new THREE.BoxGeometry(L.bookW - 0.35, 0.16, L.bookH - 0.35), new THREE.MeshStandardMaterial({ color: 0xcdb48a, roughness: 0.95 }));
    pages.position.y = -0.085; pages.receiveShadow = true; this.scene.add(pages);
    const leather = t(ART.leatherTexture()); leather.wrapS = leather.wrapT = THREE.RepeatWrapping; leather.repeat.set(4, 3);
    const cover = new THREE.Mesh(new THREE.BoxGeometry(L.bookW + 0.5, 0.12, L.bookH + 0.5), new THREE.MeshStandardMaterial({ map: leather, bumpMap: leather, bumpScale: 1.5, roughness: 0.6, metalness: 0.05, color: 0xb05040 }));
    cover.position.y = -0.2; cover.castShadow = true; cover.receiveShadow = true; this.scene.add(cover);
    const goldM = new THREE.MeshStandardMaterial({ color: 0xd8a848, metalness: 1, roughness: 0.28 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const g = new THREE.Group(); g.position.set(sx * (L.bookW / 2 + 0.1), -0.13, sz * (L.bookH / 2 + 0.1));
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.16), goldM); a.position.set(-sx * 0.35, 0, 0);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.9), goldM); b.position.set(0, 0, -sz * 0.35);
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), goldM); s.scale.y = 0.6;
      g.add(a, b, s); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); this.scene.add(g);
    }
    // lomo: nervios dorados en los cantos laterales
    for (const sx of [-1, 1]) for (let k = -3; k <= 3; k++) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.35), goldM); r.position.set(sx * (L.bookW / 2 + 0.24), -0.14, k * 0.06); this.scene.add(r);
    }
    // marcapáginas rojo colgando del lomo
    const rib = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 2.4), new THREE.MeshStandardMaterial({ color: 0x8a1010, roughness: 0.5, side: THREE.DoubleSide }));
    rib.rotation.x = -Math.PI / 2; rib.position.set(L.bookW / 2 - 2.2, -0.12, -(L.bookH / 2 + 1.0)); rib.rotation.z = 0.12; this.scene.add(rib);
  }
  buildAltar() {
    const L = this.L, pad = 0.95; const m = ART.altarTopMaps(L, pad);
    const tc = new THREE.CanvasTexture(m.color); tc.colorSpace = THREE.SRGBColorSpace; tc.anisotropy = 8;
    const te = new THREE.CanvasTexture(m.emissive); te.colorSpace = THREE.SRGBColorSpace;
    const side = new THREE.CanvasTexture(ART.altarTexture()); side.colorSpace = THREE.SRGBColorSpace; side.wrapS = side.wrapT = THREE.RepeatWrapping; side.repeat.set(5, 1);
    const sideM = new THREE.MeshStandardMaterial({ map: side, roughness: 0.9, color: 0x9a8a80 });
    this.altarTopMat = new THREE.MeshStandardMaterial({ map: tc, bumpMap: tc, bumpScale: 2, roughness: 0.85, emissive: 0xffffff, emissiveMap: te, emissiveIntensity: 1.6 });
    const altar = new THREE.Mesh(new THREE.BoxGeometry(L.bookW + pad * 2, 1.4, L.bookH + pad * 2), [sideM, sideM, this.altarTopMat, sideM, sideM, sideM]);
    altar.position.y = -0.26 - 0.7; altar.receiveShadow = true; this.scene.add(altar);
    // columnas bajas en las esquinas del altar
    const colM = new THREE.MeshStandardMaterial({ map: side, color: 0x6a5a50, roughness: 0.85 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 3, 12), colM); col.position.set(sx * (L.bookW / 2 + pad + 0.2), -1.9, sz * (L.bookH / 2 + pad + 0.2)); this.scene.add(col);
    }
  }
  buildAbyss() {
    const L = this.L;
    // terrazas del embudo que descienden hacia el lago de fuego
    const rock = new THREE.CanvasTexture(ART.altarTexture()); rock.colorSpace = THREE.SRGBColorSpace; rock.wrapS = rock.wrapT = THREE.RepeatWrapping; rock.repeat.set(8, 8);
    this.terraceMats = [];
    for (let k = 1; k <= 5; k++) {
      const w = L.bookW + 5 + k * 6.5, h = L.bookH + 5 + k * 6.5, hw = w - 5, hh = h - 5;
      const shape = new THREE.Shape(); shape.moveTo(-w / 2, -h / 2); shape.lineTo(w / 2, -h / 2); shape.lineTo(w / 2, h / 2); shape.lineTo(-w / 2, h / 2); shape.closePath();
      const hole = new THREE.Path(); hole.moveTo(-hw / 2, -hh / 2); hole.lineTo(-hw / 2, hh / 2); hole.lineTo(hw / 2, hh / 2); hole.lineTo(hw / 2, -hh / 2); hole.closePath(); shape.holes.push(hole);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.4, bevelEnabled: true, bevelSize: 0.3, bevelThickness: 0.3, bevelSegments: 1 });
      const mat = new THREE.MeshStandardMaterial({ map: rock, roughness: 0.95, color: new THREE.Color().setHSL(0.05, 0.15, 0.32 - k * 0.04), emissive: 0xff4010, emissiveMap: rock, emissiveIntensity: 0.12 * k });
      this.terraceMats.push(mat);
      const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.y = -2.4 - k * 2.2; m.receiveShadow = true; this.scene.add(m);
      // figuras diminutas en la cornisa: almas en procesión
      const figs = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.06, 0.22, 2, 6), new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 1 }), 60);
      const dm = new THREE.Object3D();
      for (let i = 0; i < 60; i++) {
        const side = i % 4; const u = Math.random() - 0.5; const r = (w + hw) / 4;
        const x = side < 2 ? u * w * 0.95 : (side === 2 ? -1 : 1) * r; const z = side < 2 ? (side === 0 ? -1 : 1) * ((h + hh) / 4) : u * h * 0.95;
        dm.position.set(x, m.position.y + 0.25, z); dm.rotation.set(0, Math.random() * 6, (Math.random() - 0.5) * 0.4); dm.updateMatrix(); figs.setMatrixAt(i, dm.matrix);
      }
      this.scene.add(figs);
    }
    // lago de fuego
    this.lavaU = { uTime: { value: 0 }, uHot: { value: new THREE.Vector3(1.8, 0.5, 0.12) }, uCrust: { value: new THREE.Vector3(0.08, 0.02, 0.01) }, uHeat: { value: 1 } };
    const lava = new THREE.Mesh(new THREE.PlaneGeometry(160, 160, 1, 1), new THREE.ShaderMaterial({
      uniforms: this.lavaU, fog: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: NOISE_GLSL + `uniform float uTime,uHeat; uniform vec3 uHot,uCrust; varying vec2 vUv;
        void main(){ vec2 p=vUv*28.0; float n=fbm(p+vec2(uTime*0.04,uTime*0.025)); float m=fbm(p*1.7-vec2(uTime*0.03,0.0)+n*1.5);
          float veins=pow(1.0-abs(m-0.5)*2.0, 6.0); float glow=veins*0.9+pow(n,3.0)*0.6;
          vec3 col=mix(uCrust, uHot*uHeat*1.6, clamp(glow,0.0,1.0));
          float d=length(vUv-0.5); col*=smoothstep(0.5,0.1,d);
          gl_FragColor=vec4(col,1.0); }`,
    }));
    lava.rotation.x = -Math.PI / 2; lava.position.y = -16; this.scene.add(lava);
    this.underLight = new THREE.PointLight(0xff5020, 60, 40, 1.5); this.underLight.position.set(0, -9, 0); this.scene.add(this.underLight);
  }
  buildCandles() {
    const L = this.L; const wax = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.6, emissive: 0x401808, emissiveIntensity: 0.3 });
    const flameTex = new THREE.CanvasTexture(ART.flameTexture()); flameTex.colorSpace = THREE.SRGBColorSpace;
    const spots = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    for (const [sx, sz] of spots) {
      const cx = sx * (L.bookW / 2 + 0.55), cz = sz * (L.bookH / 2 + 0.55);
      const light = new THREE.PointLight(0xffa050, 5, 9, 1.8); light.position.set(cx, 1.2, cz); this.scene.add(light); this.lights.push({ light, base: 5, seed: Math.random() * 10 });
      for (let k = 0; k < 3; k++) {
        const h = 0.5 + Math.random() * 0.8, r = 0.1 + Math.random() * 0.05;
        const x = cx + (Math.random() - 0.5) * 0.7, z = cz + (Math.random() - 0.5) * 0.5;
        const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, h, 14), wax); c.position.set(x, -0.26 + h / 2, z); c.castShadow = true; this.scene.add(c);
        const drip = new THREE.Mesh(new THREE.SphereGeometry(r * 1.3, 12, 8), wax); drip.scale.y = 0.35; drip.position.set(x, -0.25, z); this.scene.add(drip);
        const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, color: new THREE.Color(3, 2.2, 1.4), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        f.position.set(x, -0.26 + h + 0.14, z); f.scale.set(0.14, 0.3, 1); this.scene.add(f); this.flames.push({ f, seed: Math.random() * 10, base: f.position.y });
      }
    }
  }
  buildBraziers() {
    const L = this.L; const iron = new THREE.MeshStandardMaterial({ color: 0x2a2420, metalness: 0.8, roughness: 0.45 });
    this.braziers = [];
    for (const sx of [-1, 1]) {
      const g = new THREE.Group(); g.position.set(sx * (L.bookW / 2 + 0.55), -0.26, 0); g.scale.setScalar(0.8);
      const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(0.15 + Math.sin(t * Math.PI * 0.5) * 0.55, t * 0.5)); }
      const bowl = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), iron); bowl.position.y = 0.55; g.add(bowl);
      const coalTex = new THREE.CanvasTexture(ART.altarTexture()); coalTex.colorSpace = THREE.SRGBColorSpace;
      const coals = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), new THREE.MeshStandardMaterial({ color: 0x120604, emissive: 0xff3a08, emissiveMap: coalTex, emissiveIntensity: 2.5 })); coals.rotation.x = -Math.PI / 2; coals.position.y = 1.0; g.add(coals);
      for (let k = 0; k < 3; k++) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.9, 6), iron); const an = k / 3 * Math.PI * 2; leg.position.set(Math.cos(an) * 0.35, 0.3, Math.sin(an) * 0.35); leg.rotation.z = Math.cos(an) * 0.3; leg.rotation.x = -Math.sin(an) * 0.3; g.add(leg); }
      g.traverse(o => { if (o.isMesh) o.castShadow = true; }); this.scene.add(g);
      const light = new THREE.PointLight(0xff6a20, 10, 12, 1.6); light.position.set(g.position.x, 1.6, 0); this.scene.add(light); this.lights.push({ light, base: 14, seed: Math.random() * 10 });
      const fire = new GPUParticles(420, { base: () => { const a = Math.random() * 6.28, r = Math.random() * 0.5; return [g.position.x + Math.cos(a) * r * 0.8, 0.55, Math.sin(a) * r * 0.8]; }, rise: 1.6, life: 0.9, size: 0.16, colorA: [1, 0.75, 0.35], colorB: [0.9, 0.12, 0.02], intensity: 1.6, drift: 0.3, spread: -0.35 });
      this.scene.add(fire.points); this.systems.push(fire); this.braziers.push({ g, fire, coals });
    }
  }
  buildParticles() {
    const L = this.L;
    // brasas que se desprenden de los bordes ardientes del libro
    const edge = () => { const s = Math.floor(Math.random() * 4), u = Math.random() - 0.5; return s < 2 ? [u * L.bookW, 0.02, (s ? 1 : -1) * L.bookH / 2] : [(s === 2 ? -1 : 1) * L.bookW / 2, 0.02, u * L.bookH]; };
    this.embers = new GPUParticles(900, { base: edge, rise: 3.2, life: 4.5, size: 0.17, colorA: [1, 0.85, 0.5], colorB: [1, 0.25, 0.05], intensity: 3.2, drift: 0.8, spread: 0.6 });
    this.ash = new GPUParticles(500, { base: () => [(Math.random() - 0.5) * 26, 7, (Math.random() - 0.5) * 20], rise: 7.5, life: 12, size: 0.13, colorA: [0.5, 0.45, 0.42], colorB: [0.25, 0.22, 0.2], intensity: 0.8, drift: 1.2, fall: true });
    this.sparks = new GPUParticles(300, { base: () => [(Math.random() - 0.5) * 60, -14, (Math.random() - 0.5) * 60], rise: 10, life: 6, size: 0.3, colorA: [1, 0.7, 0.3], colorB: [1, 0.15, 0.03], intensity: 4, drift: 1.5 });
    for (const s of [this.embers, this.ash, this.sparks]) { this.scene.add(s.points); this.systems.push(s); }
  }
  setCircle(n) {
    const E = CIRCLE_ENV[n]; this.target = E;
    this.lavaU.uHot.value.set(...E.hot); this.lavaU.uCrust.value.set(...E.crust); this.lavaU.uHeat.value = E.heat;
    this.underLight.color.set(E.under); this.underLight.intensity = 30 + E.heat * 50;
    this.embers.uniforms.uColorA.value.set(...E.ember); this.embers.uniforms.uIntensity.value = 1.5 + E.embers * 2.5;
    this.sparks.uniforms.uColorA.value.set(...E.ember); this.sparks.uniforms.uIntensity.value = 1 + E.heat * 3;
    this.bookMat.emissive.setRGB(...E.ember); this.bookMat.emissiveIntensity = 1.4 + E.heat * 1.4; this.altarTopMat.emissive.setRGB(...E.ember); this.altarTopMat.emissiveIntensity = 1.2 + E.heat * 1.8;
    if (this.shaftU) { const sh = [null, [1, 0.98, 0.92], [1, 0.8, 0.8], [0.85, 1, 0.6], [1, 0.85, 0.5], [1, 0.55, 0.3], [1, 0.62, 0.3], [1, 0.45, 0.4], [0.8, 0.6, 1], [0.7, 0.9, 1]][n]; this.shaftU.uColor.value.setRGB(...sh); this.shaftU.uA.value = n === 1 ? 0.16 : 0.11 + E.heat * 0.03; this.smokeU.uColor.value.setRGB(0.3 + E.crust[0], 0.26 + E.crust[1], 0.24 + E.crust[2]); }
    this.terraceMats.forEach((m, i) => { m.emissive.set(E.under); m.emissiveIntensity = 0.06 * (i + 1) * (0.5 + E.heat); });
    for (const b of this.braziers) { b.coals.material.emissive.setRGB(E.hot[0] * 0.55, E.hot[1] * 0.35, E.hot[2] * 0.3); b.fire.uniforms.uColorB.value.set(E.hot[0] * 0.6, E.hot[1] * 0.25, E.hot[2] * 0.25); }
  }
  update(dt, t) {
    this.t = t; this.lavaU.uTime.value = t; for (const s of this.systems) s.update(t);
    if (this.shaftU) { this.shaftU.uTime.value = t; this.smokeU.uTime.value = t; }
    for (const l of this.lights) l.light.intensity = l.base * (0.82 + Math.sin(t * 9 + l.seed) * 0.08 + Math.sin(t * 23 + l.seed * 3) * 0.06 + Math.sin(t * 3.1 + l.seed) * 0.05);
    for (const f of this.flames) { const k = 1 + Math.sin(t * 13 + f.seed) * 0.12 + Math.sin(t * 29 + f.seed * 2) * 0.08; f.f.scale.set(0.13 * (2 - k), 0.3 * k, 1); f.f.position.y = f.base + (k - 1) * 0.08; }
    this.bookMat.emissiveIntensity *= 1; // (constante; el parpadeo lo aportan las luces)
  }
}

// ───────────────────────── VFX ─────────────────────────
export function lightPillar(scene, pos, color, { height = 7, radius = 0.55, dur = 1.6 } = {}) {
  const u = { uColor: { value: new THREE.Color(color).multiplyScalar(1.3) }, uA: { value: 0 }, uTime: { value: 0 } };
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.3, height, 32, 1, true), new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uA,uTime; varying vec2 vUv; void main(){ float v=smoothstep(1.0,0.0,vUv.y)*smoothstep(0.0,0.08,vUv.y); float s=0.6+0.4*sin(vUv.x*40.0+uTime*6.0+vUv.y*10.0); gl_FragColor=vec4(uColor*v*s*uA, v*uA); }`,
  }));
  m.position.set(pos.x, height / 2, pos.z); scene.add(m);
  return animate(dur, k => { u.uA.value = Math.sin(Math.PI * Math.min(1, k * 1.2)) * 0.9; u.uTime.value = k * dur; m.scale.set(1 + k * 0.4, 1, 1 + k * 0.4); }, () => { scene.remove(m); m.geometry.dispose(); });
}
export function shockwave(scene, pos, color, { size = 3, dur = 0.9, width = 0.18 } = {}) {
  const c = new THREE.Color(color).multiplyScalar(1.8);
  const m = new THREE.Mesh(new THREE.RingGeometry(1 - width, 1, 64), new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2; m.position.set(pos.x, Math.max(0.05, pos.y) + 0.03, pos.z); scene.add(m);
  return animate(dur, k => { const s = 0.2 + (1 - Math.pow(1 - k, 3)) * size; m.scale.set(s, s, s); m.material.opacity = 1 - k; }, () => { scene.remove(m); m.geometry.dispose(); });
}
export function lightning(scene, from, to, color = 0xcfe6ff, { dur = 0.45, branches = 2 } = {}) {
  const group = new THREE.Group(); scene.add(group);
  const col = new THREE.Color(color).multiplyScalar(6);
  const bolt = (a, b, thick, jag) => {
    const pts = []; const N = 14;
    for (let i = 0; i <= N; i++) { const t = i / N; const p = a.clone().lerp(b, t); if (i > 0 && i < N) p.add(new THREE.Vector3((Math.random() - 0.5) * jag, (Math.random() - 0.5) * jag * 0.5, (Math.random() - 0.5) * jag)); pts.push(p); }
    const curve = new THREE.CatmullRomCurve3(pts);
    const core = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, thick, 5), new THREE.MeshBasicMaterial({ color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    const halo = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, thick * 4, 6), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(0.25), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    group.add(core, halo); return pts;
  };
  const pts = bolt(from, to, 0.035, 0.9);
  for (let i = 0; i < branches; i++) { const s = pts[3 + Math.floor(Math.random() * 8)]; bolt(s, s.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2.5, -1.2, (Math.random() - 0.5) * 2.5)), 0.018, 0.6); }
  const light = new THREE.PointLight(color, 40, 12, 1.5); light.position.copy(to).add(new THREE.Vector3(0, 1, 0)); group.add(light);
  return animate(dur, k => { const f = k < 0.5 ? (Math.random() > 0.3 ? 1 : 0.2) : 1 - (k - 0.5) * 2; group.children.forEach(o => { if (o.material) o.material.opacity = f; }); light.intensity = 40 * f; }, () => { scene.remove(group); group.traverse(o => o.geometry && o.geometry.dispose()); });
}
// Material de quemado: la carta se disuelve con un borde incandescente.
export function burnMaterial(map, color = new THREE.Vector3(1.6, 0.55, 0.12)) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, uP: { value: 0 }, uEdge: { value: color } }, transparent: true,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: NOISE_GLSL + `uniform sampler2D map; uniform float uP; uniform vec3 uEdge; varying vec2 vUv;
      void main(){ vec4 t=texture2D(map,vUv); float n=fbm(vUv*6.0)*0.8 + (1.0-vUv.y)*0.25; float d=n-uP*1.25+0.1;
        if(d<0.0) discard; float e=1.0-smoothstep(0.0,0.07,d); vec3 c=t.rgb*(1.0-e*0.9)*(0.4+0.6*smoothstep(0.0,0.25,d)) + uEdge*e*4.0;
        gl_FragColor=vec4(c,1.0); }`,
  });
}
// Animador genérico (lo avanza la vista en cada fotograma).
const running = new Set();
export function animate(dur, step, done) { return new Promise(res => running.add({ t: 0, dur, step, done: () => { done && done(); res(); } })); }
export function tickAnimations(dt) { for (const a of [...running]) { a.t += dt; const k = Math.min(1, a.t / a.dur); a.step(k); if (k >= 1) { running.delete(a); a.done(); } } }
