import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ARCS, CITIES, DEG, fibonacciPositions, lonLatToXYZ, type GlobeState } from './data';
import { duration, globe as globeTokens } from '../../styles/motion';

export interface GlobeOptions {
  canvas: HTMLCanvasElement;
  states: GlobeState[];
  n: number;
  /** Versi ringan: titik lebih sedikit, tanpa bloom, DPR ≤ 1.5 */
  lite?: boolean;
  /** Mode still: tanpa animasi waktu, untuk render gambar statis */
  still?: boolean;
  accent?: string;
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const pointVert = /* glsl */ `
  attribute float aFrom;
  attribute float aTo;
  attribute float aRand;
  uniform float uMix;
  uniform float uSize;
  uniform float uPR;
  uniform float uIntro;
  uniform float uTime;
  varying float vAlpha;
  varying float vLand;
  void main() {
    float land = mix(aFrom, aTo, uMix);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * position);
    float facing = dot(n, normalize(-mv.xyz));
    float front = smoothstep(-0.02, 0.3, facing);
    float twinkle = 0.82 + 0.18 * sin(uTime * 1.1 + aRand * 60.0);
    vLand = land;
    vAlpha = front * mix(0.075, 0.95 * twinkle, land) * uIntro;
    gl_PointSize = uSize * uPR * mix(0.55, 1.0, land) * (3.4 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const pointFrag = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  varying float vLand;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.1, d) * vAlpha;
    vec3 ocean = vec3(0.93, 0.92, 0.89) * 0.55;
    gl_FragColor = vec4(mix(ocean, uColor, vLand) * a, a);
  }
`;

const lineVert = /* glsl */ `
  varying float vFront;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * position);
    vFront = smoothstep(-0.02, 0.35, dot(n, normalize(-mv.xyz)));
    gl_Position = projectionMatrix * mv;
  }
`;
const lineFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFront;
  void main() {
    float a = uOpacity * vFront;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

const atmoVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
/** Fresnel: cahaya menguat di tepi bola. */
const atmoFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uStrength;
  uniform float uInside;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float f;
    if (uInside > 0.5) {
      f = pow(clamp(1.0 - dot(vNormal, vView), 0.0, 1.0), uPower);
    } else {
      // sisi belakang bola luar: terang di tepi globe, memudar ke luar
      f = pow(clamp(-dot(vNormal, vView) * 1.95, 0.0, 1.0), uPower);
    }
    float a = f * uStrength;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

const cityVert = /* glsl */ `
  attribute float aRand;
  uniform float uPR;
  uniform float uTime;
  uniform float uOn;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * position);
    float front = smoothstep(0.0, 0.3, dot(n, normalize(-mv.xyz)));
    float pulse = 0.7 + 0.3 * sin(uTime * 2.0 + aRand * 20.0);
    vAlpha = front * uOn * pulse;
    gl_PointSize = 10.0 * uPR * (3.4 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const cityFrag = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.18, 0.0, d);
    float halo = smoothstep(0.5, 0.0, d) * 0.45;
    vec3 col = mix(uColor, vec3(1.0, 0.97, 0.9), core);
    float a = (core + halo) * vAlpha;
    gl_FragColor = vec4(col * a, a);
  }
`;

const arcVert = /* glsl */ `
  attribute float aT;
  attribute float aSeed;
  varying float vT;
  varying float vSeed;
  varying float vFront;
  void main() {
    vT = aT;
    vSeed = aSeed;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * position);
    vFront = smoothstep(-0.25, 0.25, dot(n, normalize(-mv.xyz)));
    gl_Position = projectionMatrix * mv;
  }
`;
const arcFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOn;
  varying float vT;
  varying float vSeed;
  varying float vFront;
  void main() {
    float head = fract(uTime * 0.18 + vSeed);
    float d = vT - head;
    float trail = smoothstep(-0.28, 0.0, d) * smoothstep(0.02, 0.0, d);
    float a = (0.12 + 0.88 * trail) * uOn * vFront;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

const flareVert = /* glsl */ `
  uniform float uPR;
  uniform float uSize;
  void main() {
    gl_PointSize = uSize * uPR;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const flareFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOn;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float core = exp(-d * d * 30.0);
    float halo = exp(-d * 4.0) * 0.5;
    float a = (core + halo) * uOn;
    vec3 col = mix(uColor, vec3(1.0), core * 0.8);
    gl_FragColor = vec4(col * a, a);
  }
`;

export class Globe {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private composer?: EffectComposer;
  private tilt = new THREE.Group();
  private spin = new THREE.Group();
  private points: THREE.Points;
  private pointMat: THREE.ShaderMaterial;
  private coastMeshes: THREE.LineSegments[] = [];
  private atmoMats: THREE.ShaderMaterial[] = [];
  private cityMat: THREE.ShaderMaterial;
  private arcMat: THREE.ShaderMaterial;
  private gratMat: THREE.ShaderMaterial;
  private flareMat: THREE.ShaderMaterial;
  private states: GlobeState[];
  private indices: Uint32Array;
  private fromAttr: THREE.BufferAttribute;
  private toAttr: THREE.BufferAttribute;
  private color = new THREE.Color();
  private targetColor = new THREE.Color();
  private fromColor = new THREE.Color();
  private colorT = 1;
  private stateIdx = 0;
  private prevStateIdx = 0;
  private mixT = 1;
  private citiesOn = 0;
  private citiesTarget = 0;
  private intro = 1;
  private outro = 0;
  private centerX = 0.5;
  private raf = 0;
  private running = false;
  private visible = true;
  private clock = new THREE.Clock();
  private time = 0;
  private dragging = false;
  private lastInteract = -Infinity;
  private velocity = 0;
  private pitch = 0;
  private lite: boolean;
  private still: boolean;
  private resizeObs?: ResizeObserver;
  private onVisibility = () => {
    this.visible = document.visibilityState === 'visible';
    if (this.visible) this.start();
    else this.stop();
  };

  constructor(opts: GlobeOptions) {
    this.lite = !!opts.lite;
    this.still = !!opts.still;
    this.states = opts.states;
    const canvas = opts.canvas;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !this.lite,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: this.still,
    });
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.lite ? 1.5 : 2));

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    this.camera.position.set(0, 0, 5.2);

    this.tilt.rotation.z = 23.4 * DEG; // kemiringan sumbu Bumi
    this.tilt.add(this.spin);
    this.scene.add(this.tilt);
    this.spin.rotation.y = -1.9; // mulai dengan Asia Tenggara/Samudra Hindia menghadap penonton

    this.color.set(opts.accent ?? '#f5a25d');
    this.targetColor.copy(this.color);

    // ---- Titik (darat terang, laut redup)
    const allPos = fibonacciPositions(opts.n);
    const step = this.lite ? 2 : 1;
    const count = Math.floor(opts.n / step);
    this.indices = new Uint32Array(count);
    const pos = new Float32Array(count * 3);
    const rand = new Float32Array(count);
    for (let k = 0; k < count; k++) {
      const i = k * step;
      this.indices[k] = i;
      pos[k * 3] = allPos[i * 3];
      pos[k * 3 + 1] = allPos[i * 3 + 1];
      pos[k * 3 + 2] = allPos[i * 3 + 2];
      rand[k] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
    this.fromAttr = new THREE.BufferAttribute(new Float32Array(count), 1);
    this.toAttr = new THREE.BufferAttribute(new Float32Array(count), 1);
    geo.setAttribute('aFrom', this.fromAttr);
    geo.setAttribute('aTo', this.toAttr);
    this.pointMat = new THREE.ShaderMaterial({
      vertexShader: pointVert,
      fragmentShader: pointFrag,
      uniforms: {
        uMix: { value: 1 },
        uSize: { value: this.lite ? 5.2 : 4.2 },
        uPR: { value: this.renderer.getPixelRatio() },
        uIntro: { value: 1 },
        uTime: { value: 0 },
        uColor: { value: this.color },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, this.pointMat);
    this.spin.add(this.points);
    this.writeLand(this.toAttr, 0);
    this.writeLand(this.fromAttr, 0);

    // ---- Garis pantai per keadaan (crossfade)
    for (const s of this.states) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(s.coast, 3));
      const m = new THREE.ShaderMaterial({
        vertexShader: lineVert,
        fragmentShader: lineFrag,
        uniforms: { uColor: { value: this.color }, uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.LineSegments(g, m);
      mesh.visible = false;
      this.coastMeshes.push(mesh);
      this.spin.add(mesh);
    }

    // ---- Graticule samar
    this.gratMat = new THREE.ShaderMaterial({
      vertexShader: lineVert,
      fragmentShader: lineFrag,
      uniforms: { uColor: { value: new THREE.Color(0xedeae3) }, uOpacity: { value: 0.06 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.spin.add(new THREE.LineSegments(this.graticule(), this.gratMat));

    // ---- Inti gelap (menutup sisi belakang) + atmosfer fresnel
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.992, 64, 48),
      new THREE.MeshBasicMaterial({ color: 0x000000 }),
    );
    this.spin.add(core);
    const rim = this.atmosphere(1.0, THREE.FrontSide, 1, 3.6, 0.5);
    const halo = this.atmosphere(1.14, THREE.BackSide, 0, 4.0, 0.45);
    this.tilt.add(rim, halo);

    // ---- Lampu kota & busur (Era Digital dan AI)
    const cityPos: number[] = [];
    const cityRand: number[] = [];
    const tmp: number[] = [];
    for (const [lon, lat] of CITIES) {
      lonLatToXYZ(lon, lat, 1.006, tmp, 0);
      cityPos.push(tmp[0], tmp[1], tmp[2]);
      cityRand.push(Math.random());
    }
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.Float32BufferAttribute(cityPos, 3));
    cg.setAttribute('aRand', new THREE.Float32BufferAttribute(cityRand, 1));
    this.cityMat = new THREE.ShaderMaterial({
      vertexShader: cityVert,
      fragmentShader: cityFrag,
      uniforms: {
        uColor: { value: this.color },
        uPR: { value: this.renderer.getPixelRatio() },
        uTime: { value: 0 },
        uOn: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.spin.add(new THREE.Points(cg, this.cityMat));

    this.arcMat = new THREE.ShaderMaterial({
      vertexShader: arcVert,
      fragmentShader: arcFrag,
      uniforms: { uColor: { value: this.color }, uTime: { value: 0 }, uOn: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.spin.add(new THREE.LineSegments(this.arcs(), this.arcMat));

    // ---- Titik cahaya penutup
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
    this.flareMat = new THREE.ShaderMaterial({
      vertexShader: flareVert,
      fragmentShader: flareFrag,
      uniforms: {
        uColor: { value: this.color },
        uOn: { value: 0 },
        uPR: { value: this.renderer.getPixelRatio() },
        uSize: { value: 90 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const flare = new THREE.Points(fg, this.flareMat);
    flare.renderOrder = 10;
    this.scene.add(flare);

    if (!this.lite) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42, 0.35, 0.12));
      this.composer.addPass(new OutputPass());
    }

    this.setState(0, opts.accent ?? '#f5a25d', false, true);
    this.resize();
    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(canvas);
    document.addEventListener('visibilitychange', this.onVisibility);
    if (!this.still) this.bindDrag(canvas);
  }

  private atmosphere(r: number, side: THREE.Side, inside: number, power: number, strength: number) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: atmoVert,
      fragmentShader: atmoFrag,
      uniforms: {
        uColor: { value: this.color },
        uPower: { value: power },
        uStrength: { value: strength },
        uInside: { value: inside },
      },
      side,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.atmoMats.push(mat);
    return new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), mat);
  }

  private graticule(): THREE.BufferGeometry {
    const pts: number[] = [];
    const a: number[] = [];
    const b: number[] = [];
    for (let lon = -180; lon < 180; lon += 30) {
      for (let lat = -88; lat < 88; lat += 4) {
        lonLatToXYZ(lon, lat, 1.001, a, 0);
        lonLatToXYZ(lon, lat + 4, 1.001, b, 0);
        pts.push(...a.slice(0, 3), ...b.slice(0, 3));
      }
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let lon = -180; lon < 180; lon += 4) {
        lonLatToXYZ(lon, lat, 1.001, a, 0);
        lonLatToXYZ(lon + 4, lat, 1.001, b, 0);
        pts.push(...a.slice(0, 3), ...b.slice(0, 3));
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }

  private arcs(): THREE.BufferGeometry {
    const pos: number[] = [];
    const ts: number[] = [];
    const seeds: number[] = [];
    const va = new THREE.Vector3();
    const vb = new THREE.Vector3();
    const p = new THREE.Vector3();
    const q = new THREE.Vector3();
    const tmp: number[] = [];
    const SEG = 48;
    ARCS.forEach(([i, j], k) => {
      lonLatToXYZ(CITIES[i][0], CITIES[i][1], 1, tmp, 0);
      va.set(tmp[0], tmp[1], tmp[2]);
      lonLatToXYZ(CITIES[j][0], CITIES[j][1], 1, tmp, 0);
      vb.set(tmp[0], tmp[1], tmp[2]);
      const angle = va.angleTo(vb);
      const lift = 0.04 + 0.22 * (angle / Math.PI);
      const seed = (k * 0.618) % 1;
      const at = (t: number, out: THREE.Vector3) => {
        // slerp di permukaan lalu angkat membentuk busur
        const s = Math.sin(angle * (1 - t)) / Math.sin(angle);
        const e = Math.sin(angle * t) / Math.sin(angle);
        out.copy(va).multiplyScalar(s).addScaledVector(vb, e);
        return out.multiplyScalar(1.004 + lift * Math.sin(Math.PI * t));
      };
      for (let s = 0; s < SEG; s++) {
        const t0 = s / SEG;
        const t1 = (s + 1) / SEG;
        at(t0, p);
        at(t1, q);
        pos.push(p.x, p.y, p.z, q.x, q.y, q.z);
        ts.push(t0, t1);
        seeds.push(seed, seed);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aT', new THREE.Float32BufferAttribute(ts, 1));
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1));
    return g;
  }

  private writeLand(attr: THREE.BufferAttribute, stateIdx: number) {
    const land = this.states[stateIdx].land;
    const arr = attr.array as Float32Array;
    for (let k = 0; k < this.indices.length; k++) arr[k] = land[this.indices[k]];
    attr.needsUpdate = true;
  }

  private bindDrag(canvas: HTMLCanvasElement) {
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    canvas.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = performance.now();
      this.velocity = 0;
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add('is-dragging');
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const k = 3.2 / Math.max(canvas.clientHeight, 1);
      this.spin.rotation.y += dx * k;
      this.pitch = THREE.MathUtils.clamp(this.pitch + dy * k, -0.7, 0.7);
      this.velocity = (dx * k) / Math.max((now - lastT) / 1000, 1 / 120);
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = now;
      this.lastInteract = this.time;
      this.start();
    });
    const end = (e: PointerEvent) => {
      if (!this.dragging) return;
      this.dragging = false;
      this.lastInteract = this.time;
      canvas.classList.remove('is-dragging');
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  }

  /** Pindah ke keadaan globe (indeks data), aksen, dan lampu kota. */
  setState(stateIdx: number, accent: string, cities: boolean, instant = false) {
    const idx = THREE.MathUtils.clamp(stateIdx, 0, this.states.length - 1);
    if (idx !== this.stateIdx || instant) {
      // bekukan tampilan saat ini sebagai "from"
      const fromArr = this.fromAttr.array as Float32Array;
      const toArr = this.toAttr.array as Float32Array;
      const m = this.mixT >= 1 ? 1 : easeInOut(this.mixT);
      for (let k = 0; k < fromArr.length; k++) fromArr[k] = fromArr[k] + (toArr[k] - fromArr[k]) * m;
      this.fromAttr.needsUpdate = true;
      this.writeLand(this.toAttr, idx);
      this.prevStateIdx = instant ? idx : this.stateIdx;
      this.stateIdx = idx;
      this.mixT = instant ? 1 : 0;
      if (instant) {
        this.writeLand(this.fromAttr, idx);
      }
    }
    this.fromColor.copy(this.color);
    this.targetColor.set(accent);
    this.colorT = instant ? 1 : 0;
    if (instant) this.color.copy(this.targetColor);
    this.citiesTarget = cities ? 1 : 0;
    if (instant) this.citiesOn = this.citiesTarget;
    this.start();
  }

  /** 0 = gelap, 1 = menyala penuh (intro). */
  setIntro(v: number) {
    this.intro = v;
    this.start();
  }

  /** 0..1 — globe menjauh sampai tinggal satu titik cahaya. */
  setOutro(v: number) {
    this.outro = THREE.MathUtils.clamp(v, 0, 1);
    this.start();
  }

  /** Posisi horizontal pusat globe dalam fraksi lebar layar. */
  setCenter(x: number) {
    this.centerX = x;
    this.resize();
  }

  setRotation(y: number) {
    this.spin.rotation.y = y;
  }

  resize() {
    const canvas = this.renderer.domElement;
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
    this.camera.aspect = w / h;
    // Pastikan globe muat di layar sempit: mundurkan kamera bila tinggi > lebar.
    this.camera.position.z = w < h ? 5.2 * Math.min(1.9, (h / w) * 0.85) : 5.2;
    this.camera.setViewOffset(w, h, (0.5 - this.centerX) * w, 0, w, h);
    this.camera.updateProjectionMatrix();
    this.renderOnce();
  }

  start() {
    if (this.running || this.still || !this.visible) {
      if (this.still) this.renderOnce();
      return;
    }
    this.running = true;
    this.clock.getDelta();
    const loop = () => {
      if (!this.running) return;
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const settled = this.tick(dt);
      this.draw();
      if (settled) {
        this.running = false;
        return;
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Aktifkan/nonaktifkan loop animasi (mis. saat globe tak terlihat). */
  setActive(active: boolean) {
    this.visible = active && document.visibilityState === 'visible';
    if (this.visible) this.start();
    else this.stop();
  }

  private tick(dt: number): boolean {
    this.time += dt;
    const u = this.pointMat.uniforms;
    // perpindahan keadaan & warna
    if (this.mixT < 1) this.mixT = Math.min(1, this.mixT + dt / (duration.accent / 1000));
    if (this.colorT < 1) {
      this.colorT = Math.min(1, this.colorT + dt / (duration.accent / 1000));
      this.color.copy(this.fromColor).lerp(this.targetColor, easeInOut(this.colorT));
    }
    this.citiesOn += (this.citiesTarget - this.citiesOn) * Math.min(1, dt * 2.5);

    // rotasi: otomatis kecuali sedang/baru saja di-drag; inersia setelah dilepas
    const idle = this.time - this.lastInteract > globeTokens.resumeAfter;
    if (!this.dragging) {
      this.spin.rotation.y += this.velocity * dt;
      this.velocity *= Math.pow(0.04, dt);
      if (idle) {
        this.spin.rotation.y += globeTokens.spin * dt;
        this.pitch *= Math.pow(0.3, dt);
      }
    }
    this.spin.rotation.x = this.pitch;

    // outro: mengecil menuju satu titik cahaya
    const o = easeOutExpo(this.outro);
    const s = 1 - 0.985 * this.outro * this.outro * (3 - 2 * this.outro);
    this.tilt.scale.setScalar(Math.max(s, 0.012));
    this.flareMat.uniforms.uOn.value = Math.max(0, (this.outro - 0.55) / 0.45) * 1.2;
    this.flareMat.uniforms.uSize.value = 40 + 70 * o;

    u.uMix.value = easeInOut(this.mixT);
    u.uTime.value = this.time;
    u.uIntro.value = this.intro;
    this.cityMat.uniforms.uTime.value = this.time;
    this.cityMat.uniforms.uOn.value = this.citiesOn * this.intro;
    this.arcMat.uniforms.uTime.value = this.time;
    this.arcMat.uniforms.uOn.value = this.citiesOn * this.intro;
    for (const m of this.atmoMats) m.uniforms.uStrength.value = (m.uniforms.uInside.value > 0.5 ? 0.5 : 0.45) * this.intro;
    this.gratMat.uniforms.uOpacity.value = 0.06 * this.intro;

    // garis pantai: keadaan aktif menyala, sebelumnya memudar
    const mix = u.uMix.value as number;
    this.coastMeshes.forEach((mesh, i) => {
      let op = 0;
      if (i === this.stateIdx) op = mix;
      if (i === this.prevStateIdx && i !== this.stateIdx) op = 1 - mix;
      if (i === this.stateIdx && this.prevStateIdx === this.stateIdx) op = 1;
      (mesh.material as THREE.ShaderMaterial).uniforms.uOpacity.value = op * 0.75 * this.intro;
      mesh.visible = op > 0.001;
    });
    return false;
  }

  private draw() {
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  renderOnce() {
    this.tick(0);
    this.draw();
  }

  dispose() {
    this.stop();
    this.resizeObs?.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    this.composer?.dispose();
    this.renderer.dispose();
  }
}

/** Uji dukungan WebGL tanpa membuat konteks permanen. */
export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
    (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
