// SULPHUR — postproceso de cámara: bloom HDR, gradación por Círculo, viñeta, grano, aberración cromática,
// calima de calor, destellos y pulso de daño.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Gradación: tinte multiplicativo, elevación de negros, saturación y calima por Círculo.
export const GRADE = [null,
  { tint: [1.02, 1.0, 0.97], lift: [0.02, 0.02, 0.025], sat: 0.75, haze: 0.0, vig: 0.66 },
  { tint: [1.04, 0.97, 0.97], lift: [0.03, 0.01, 0.015], sat: 0.85, haze: 0.2, vig: 0.6 },
  { tint: [0.98, 1.03, 0.9], lift: [0.01, 0.025, 0.0], sat: 0.85, haze: 0.2, vig: 0.62 },
  { tint: [1.06, 1.0, 0.86], lift: [0.03, 0.02, 0.0], sat: 0.95, haze: 0.3, vig: 0.64 },
  { tint: [1.06, 0.96, 0.9], lift: [0.035, 0.0, 0.0], sat: 1.0, haze: 0.8, vig: 0.68 },
  { tint: [1.06, 0.98, 0.9], lift: [0.035, 0.012, 0.0], sat: 0.98, haze: 1.0, vig: 0.7 },
  { tint: [1.08, 0.9, 0.88], lift: [0.03, 0.0, 0.0], sat: 0.9, haze: 0.6, vig: 0.72 },
  { tint: [0.98, 0.93, 1.08], lift: [0.015, 0.0, 0.03], sat: 0.9, haze: 0.2, vig: 0.74 },
  { tint: [0.9, 0.98, 1.1], lift: [0.0, 0.015, 0.035], sat: 0.7, haze: 0.0, vig: 0.78 },
];

const FinalShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) },
    uTint: { value: new THREE.Vector3(1, 1, 1) }, uLift: { value: new THREE.Vector3() }, uSat: { value: 1 },
    uVig: { value: 0.6 }, uGrain: { value: 0.045 }, uCA: { value: 0.0022 }, uHaze: { value: 0 }, uFlash: { value: new THREE.Vector3() }, uHurt: { value: 0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime,uSat,uVig,uGrain,uCA,uHaze,uHurt; uniform vec2 uRes; uniform vec3 uTint,uLift,uFlash; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 uv=vUv; vec2 c=uv-0.5; float r=length(c*vec2(uRes.x/uRes.y,1.0))*0.72;
      float hz=uHaze*smoothstep(0.35,0.0,uv.y+0.1)*0.0025; uv+=vec2(sin(uv.y*55.0+uTime*3.1), cos(uv.x*48.0+uTime*2.6))*hz;
      vec2 off=c*uCA*(0.4+r*1.6);
      vec3 col=vec3(texture2D(tDiffuse,uv+off).r, texture2D(tDiffuse,uv).g, texture2D(tDiffuse,uv-off).b);
      float l=dot(col,vec3(0.2126,0.7152,0.0722)); col=mix(vec3(l),col,uSat); col=col*uTint+uLift*(1.0-l);
      col*=mix(1.0, smoothstep(0.95,0.28,r), uVig);
      col=mix(col, vec3(0.55,0.02,0.0), uHurt*smoothstep(0.25,0.75,r));
      col+=uFlash;
      col+=(h(uv*uRes+fract(uTime*7.0)*100.0)-0.5)*uGrain;
      gl_FragColor=vec4(col,1.0);
    }`,
};

export class Post {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    const size = renderer.getSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(renderer, rt);
    this.composer.addPass(new RenderPass(scene, camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.55, 0.55, 1.08);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.final = new ShaderPass(FinalShader); this.composer.addPass(this.final);
    this.u = this.final.uniforms; this.grade = { ...GRADE[1] }; this.target = GRADE[1]; this.flash = 0; this.flashCol = new THREE.Color(1, 1, 1); this.hurt = 0;
    this.setSize();
  }
  setSize() {
    const s = this.renderer.getSize(new THREE.Vector2()); const pr = Math.min(window.devicePixelRatio, 1.75);
    this.composer.setPixelRatio(pr); this.composer.setSize(s.x, s.y); this.u.uRes.value.set(s.x * pr, s.y * pr);
  }
  setCircle(n) { this.target = GRADE[n]; }
  doFlash(color = 0xffffff, amount = 0.6) { this.flashCol.set(color); this.flash = Math.max(this.flash, amount); }
  doHurt(a = 0.7) { this.hurt = Math.max(this.hurt, a); }
  render(dt, t) {
    const g = this.grade, T = this.target, k = Math.min(1, dt * 1.2);
    for (const key of ['tint', 'lift']) for (let i = 0; i < 3; i++) g[key][i] += (T[key][i] - g[key][i]) * k;
    for (const key of ['sat', 'haze', 'vig']) g[key] += (T[key] - g[key]) * k;
    const u = this.u; u.uTime.value = t; u.uTint.value.set(...g.tint); u.uLift.value.set(...g.lift); u.uSat.value = g.sat; u.uHaze.value = g.haze; u.uVig.value = g.vig;
    this.flash = Math.max(0, this.flash - dt * 1.6); this.hurt = Math.max(0, this.hurt - dt * 1.1);
    u.uFlash.value.set(this.flashCol.r * this.flash, this.flashCol.g * this.flash, this.flashCol.b * this.flash); u.uHurt.value = this.hurt;
    this.composer.render(dt);
  }
}
