/* mould-contamination.js
   Continuous scroll-driven mould growth for fixed UI surfaces.
*/
(() => {
  const TAU = Math.PI * 2;

  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, Number.isFinite(v) ? v : min));
  const lerp = (a, b, t) => a + (b - a) * t;

  function smoothstep(a, b, x) {
    const t = clamp((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  }

  function readNumber(value, fallback) {
    if (value == null || value === '') return fallback;
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function hashString(str) {
    let h = 2166136261 >>> 0;
    str = String(str || '');
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function makeRng(seed) {
    let t = hashString(seed) || 0x12345678;
    return function rng() {
      t = (t + 0x6D2B79F5) >>> 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createNoise(seed) {
    const salt = hashString(seed) || 1;

    function h(ix, iy) {
      let n = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ salt;
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    }

    function value(x, y) {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const fx = x - ix;
      const fy = y - iy;
      const u = fx * fx * (3 - 2 * fx);
      const v = fy * fy * (3 - 2 * fy);
      const a = h(ix, iy);
      const b = h(ix + 1, iy);
      const c = h(ix, iy + 1);
      const d = h(ix + 1, iy + 1);
      return lerp(lerp(a, b, u), lerp(c, d, u), v);
    }

    function fbm(x, y, octaves = 5, lacunarity = 2, gain = 0.52) {
      let amp = 0.5;
      let freq = 1;
      let sum = 0;
      let norm = 0;
      for (let i = 0; i < octaves; i++) {
        sum += amp * value(x * freq, y * freq);
        norm += amp;
        amp *= gain;
        freq *= lacunarity;
      }
      return norm ? sum / norm : 0;
    }

    return { value, fbm };
  }

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  }

  function rgba(rgb, a) {
    return `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${clamp(a)})`;
  }

  function injectMouldLayerStyles() {
    if (document.getElementById('mould-contamination-layer-styles')) return;
    const style = document.createElement('style');
    style.id = 'mould-contamination-layer-styles';
    style.textContent = `
      [data-mould] > :not(.mould-contamination-canvas) {
        position: relative;
        z-index: 2;
      }
      .mould-contamination-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        border-radius: inherit;
      }
    `;
    document.head.appendChild(style);
  }

  function edgeBand(x, y, edge, spread) {
    switch (edge) {
      case 'top': return 1 - smoothstep(0, spread, y);
      case 'bottom': return 1 - smoothstep(0, spread, 1 - y);
      case 'left': return 1 - smoothstep(0, spread, x);
      case 'right': return 1 - smoothstep(0, spread, 1 - x);
      default: return 0;
    }
  }

  function drawRadial(ctx, x, y, r, rgb, alpha, mid = 0.58) {
    if (r <= 0 || alpha <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(rgb, alpha));
    g.addColorStop(mid, rgba(rgb, alpha * 0.52));
    g.addColorStop(1, rgba(rgb, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }

  function pickMouldColour(rng, warmth = 0.42, dark = false) {
    const cold = [[17, 23, 16], [25, 31, 21], [35, 40, 27], [48, 48, 33]];
    const warm = [[41, 34, 22], [59, 48, 31], [76, 62, 41], [32, 28, 18]];
    const set = rng() < warmth ? warm : cold;
    const c = set[Math.floor(rng() * set.length)];
    if (!dark) return c;
    return [
      Math.max(8, c[0] * 0.55),
      Math.max(8, c[1] * 0.55),
      Math.max(7, c[2] * 0.55)
    ];
  }

  const DEFAULTS = {
    mode: 'corner-bloom',
    source: 'top-left',
    material: 'painted-plaster',
    seed: null,
    intensity: 0.75,
    coverage: 0.5,
    density: 0.75,
    edgeBias: 0.75,
    staining: 0.5,
    fuzz: 0.65,
    warmth: 0.42,
    opacity: 1,
    blendMode: 'multiply',
    zIndex: 1,
    maxDpr: 1.12,
    maxPixels: 1400000,
    growthMode: 'time',
    growthDuration: 2600,
    growthDelay: 0,
    scrollRoot: null,
    scrollStart: 0,
    scrollEnd: 1,
    scrollLag: 0.42,
    scrollMaturity: 1.08,
    scrollEase: 1.8,
    seedProgress: 0.02,
    redrawOnResize: true
  };

  const SOURCE_MAP = {
    'top-left': { x: 0, y: 0, edges: ['top', 'left'] },
    'left-top': { x: 0, y: 0, edges: ['top', 'left'] },
    'top-right': { x: 1, y: 0, edges: ['top', 'right'] },
    'right-top': { x: 1, y: 0, edges: ['top', 'right'] },
    'bottom-left': { x: 0, y: 1, edges: ['bottom', 'left'] },
    'left-bottom': { x: 0, y: 1, edges: ['bottom', 'left'] },
    'bottom-right': { x: 1, y: 1, edges: ['bottom', 'right'] },
    'right-bottom': { x: 1, y: 1, edges: ['bottom', 'right'] },
    top: { x: 0.5, y: 0, edges: ['top'] },
    right: { x: 1, y: 0.5, edges: ['right'] },
    bottom: { x: 0.5, y: 1, edges: ['bottom'] },
    left: { x: 0, y: 0.5, edges: ['left'] },
    center: { x: 0.5, y: 0.5, edges: [] },
    centre: { x: 0.5, y: 0.5, edges: [] }
  };

  function normaliseMode(mode) {
    const m = String(mode || DEFAULTS.mode).trim().toLowerCase().replace(/_/g, '-');
    if (m === 'corner') return 'corner-bloom';
    if (m === 'top-edge') return 'ceiling-line';
    if (m === 'bottom-edge') return 'skirting-creep';
    if (m === 'bottom') return 'skirting-creep';
    if (m === 'top') return 'ceiling-line';
    if (m === 'patch') return 'patch-bloom';
    if (m === 'speckle') return 'humidity-speckle';
    if (m === 'severe') return 'severe-colony';
    return m;
  }

  function parseSource(source) {
    const s = String(source || 'top-left').trim().toLowerCase();
    if (/^\s*\d*\.?\d+\s*,\s*\d*\.?\d+\s*$/.test(s)) {
      const [x, y] = s.split(',').map(Number);
      return { x: clamp(x), y: clamp(y), edges: [] };
    }
    return SOURCE_MAP[s] || SOURCE_MAP['top-left'];
  }

  function sourceWith(overrides) {
    return {
      start: 0,
      speed: 0.44,
      strength: 1,
      spreadX: 0.58,
      spreadY: 0.58,
      edgeSpread: 0.14,
      noiseFreq: 3,
      ...overrides
    };
  }

  function buildSources(el, opts) {
    if (el.classList.contains('problem-theatre-stage')) {
      return [
        sourceWith({
          x: 0, y: 0, edges: ['top', 'left'], metric: 'scene',
          start: 0.02, speed: 0.39, strength: 1.12,
          spreadX: 0.88, spreadY: 0.86, edgeSpread: 0.18,
          noiseX: 3.2, noiseY: 12.4, arrivalX: 8.1, arrivalY: 4.2
        }),
        sourceWith({
          x: 1, y: 1, edges: ['right', 'bottom'], metric: 'scene',
          start: 0.18, speed: 0.42, strength: 0.76,
          spreadX: 0.58, spreadY: 0.54, edgeSpread: 0.16,
          noiseX: 22.8, noiseY: 9.2, arrivalX: 18.4, arrivalY: 3.5
        })
      ];
    }

    const base = parseSource(opts.source);
    const lateStart = el.classList.contains('find-card') ? 0.22 : 0.12;
    const mode = opts.mode;
    if (mode === 'skirting-creep') {
      return [sourceWith({
        x: 0.5, y: 1, edges: ['bottom'],
        start: lateStart, speed: 0.56, strength: 0.9,
        spreadX: 0.92, spreadY: 0.44, edgeSpread: 0.16
      })];
    }
    if (mode === 'ceiling-line') {
      return [sourceWith({
        x: 0.5, y: 0, edges: ['top'],
        start: lateStart, speed: 0.56, strength: 0.9,
        spreadX: 0.92, spreadY: 0.44, edgeSpread: 0.16
      })];
    }
    if (mode === 'patch-bloom') {
      return [sourceWith({
        x: base.x, y: base.y, edges: [],
        start: lateStart + 0.04, speed: 0.60, strength: 0.88,
        spreadX: 0.44, spreadY: 0.44, edgeSpread: 0.10
      })];
    }
    return [
      sourceWith({
        x: base.x, y: base.y, edges: base.edges,
        start: lateStart, speed: 0.58, strength: 0.94,
        spreadX: 0.58, spreadY: 0.62, edgeSpread: 0.15
      }),
      sourceWith({
        x: base.x > 0.5 ? 0 : 1,
        y: base.y > 0.5 ? 0 : 1,
        edges: base.x > 0.5 ? ['left'] : ['right'],
        start: lateStart + 0.18, speed: 0.62, strength: 0.20,
        spreadX: 0.38, spreadY: 0.38, edgeSpread: 0.08
      })
    ];
  }

  function readOptionsFromDataset(el) {
    const d = el.dataset || {};
    const opts = {};
    if (d.mould && d.mould !== 'true' && d.mould !== '') opts.mode = d.mould;
    if (d.mouldMode) opts.mode = d.mouldMode;
    if (d.mouldSource) opts.source = d.mouldSource;
    if (d.mouldSeed) opts.seed = d.mouldSeed;
    if (d.mouldBlend) opts.blendMode = d.mouldBlend;
    if (d.mouldZ) opts.zIndex = readNumber(d.mouldZ, DEFAULTS.zIndex);
    if (d.mouldIntensity) opts.intensity = readNumber(d.mouldIntensity, DEFAULTS.intensity);
    if (d.mouldCoverage) opts.coverage = readNumber(d.mouldCoverage, DEFAULTS.coverage);
    if (d.mouldDensity) opts.density = readNumber(d.mouldDensity, DEFAULTS.density);
    if (d.mouldSpeckle) opts.density = readNumber(d.mouldSpeckle, DEFAULTS.density);
    if (d.mouldEdgeBias) opts.edgeBias = readNumber(d.mouldEdgeBias, DEFAULTS.edgeBias);
    if (d.mouldStaining) opts.staining = readNumber(d.mouldStaining, DEFAULTS.staining);
    if (d.mouldStain) opts.staining = readNumber(d.mouldStain, DEFAULTS.staining);
    if (d.mouldFuzz) opts.fuzz = readNumber(d.mouldFuzz, DEFAULTS.fuzz);
    if (d.mouldOpacity) opts.opacity = readNumber(d.mouldOpacity, DEFAULTS.opacity);
    if (d.mouldMaxDpr) opts.maxDpr = readNumber(d.mouldMaxDpr, DEFAULTS.maxDpr);
    if (d.mouldMaxPixels) opts.maxPixels = readNumber(d.mouldMaxPixels, DEFAULTS.maxPixels);
    if (d.mouldGrowthMode) opts.growthMode = d.mouldGrowthMode;
    if (d.mouldGrowthDuration) opts.growthDuration = readNumber(d.mouldGrowthDuration, DEFAULTS.growthDuration);
    if (d.mouldGrowthDelay) opts.growthDelay = readNumber(d.mouldGrowthDelay, DEFAULTS.growthDelay);
    if (d.mouldScrollRoot) opts.scrollRoot = d.mouldScrollRoot;
    if (d.mouldScrollStart) opts.scrollStart = readNumber(d.mouldScrollStart, DEFAULTS.scrollStart);
    if (d.mouldScrollEnd) opts.scrollEnd = readNumber(d.mouldScrollEnd, DEFAULTS.scrollEnd);
    if (d.mouldScrollLag) opts.scrollLag = readNumber(d.mouldScrollLag, DEFAULTS.scrollLag);
    if (d.mouldScrollMaturity) opts.scrollMaturity = readNumber(d.mouldScrollMaturity, DEFAULTS.scrollMaturity);
    if (d.mouldScrollEase) opts.scrollEase = readNumber(d.mouldScrollEase, DEFAULTS.scrollEase);
    if (d.mouldSeedProgress) opts.seedProgress = readNumber(d.mouldSeedProgress, DEFAULTS.seedProgress);
    return opts;
  }

  function normaliseOptions(options) {
    const opts = { ...DEFAULTS, ...options };
    opts.mode = normaliseMode(opts.mode);
    opts.intensity = clamp(Number(opts.intensity));
    opts.coverage = clamp(Number(opts.coverage));
    opts.density = clamp(Number(opts.density));
    opts.edgeBias = clamp(Number(opts.edgeBias));
    opts.staining = clamp(Number(opts.staining));
    opts.fuzz = clamp(Number(opts.fuzz));
    opts.opacity = clamp(Number(opts.opacity));
    opts.maxDpr = clamp(readNumber(opts.maxDpr, DEFAULTS.maxDpr), 0.2, 3);
    opts.maxPixels = Math.max(36000, readNumber(opts.maxPixels, DEFAULTS.maxPixels));
    opts.growthMode = String(opts.growthMode || DEFAULTS.growthMode).trim().toLowerCase();
    opts.growthDuration = Math.max(0, Number(opts.growthDuration) || 0);
    opts.growthDelay = Math.max(0, Number(opts.growthDelay) || 0);
    opts.scrollRoot = opts.scrollRoot == null ? null : String(opts.scrollRoot).trim();
    opts.scrollStart = clamp(Number(opts.scrollStart), 0, 1);
    opts.scrollEnd = clamp(Number(opts.scrollEnd), 0, 1);
    if (opts.scrollEnd <= opts.scrollStart) opts.scrollEnd = Math.min(1, opts.scrollStart + 0.01);
    opts.scrollLag = clamp(readNumber(opts.scrollLag, DEFAULTS.scrollLag), 0, 1.4);
    opts.scrollMaturity = clamp(readNumber(opts.scrollMaturity, DEFAULTS.scrollMaturity), 1, 1.24);
    opts.scrollEase = clamp(readNumber(opts.scrollEase, DEFAULTS.scrollEase), 0.7, 3.2);
    opts.seedProgress = clamp(Number(opts.seedProgress), 0, 0.2);
    opts.warmth = opts.material === 'timber' ? 0.56 : 0.42;
    return opts;
  }

  function ensureHost(el) {
    const cs = getComputedStyle(el);
    if (cs.position === 'static') el.style.position = 'relative';
    if (cs.isolation !== 'isolate') el.style.isolation = 'isolate';
  }

  class MouldContamination {
    constructor(element, options = {}) {
      injectMouldLayerStyles();
      this.el = typeof element === 'string' ? document.querySelector(element) : element;
      if (!this.el) throw new Error('MouldContamination: target element not found.');

      ensureHost(this.el);
      this.options = normaliseOptions({ ...readOptionsFromDataset(this.el), ...options });
      if (!this.options.seed) {
        this.options.seed = this.el.id || this.el.className || 'mould';
      }
      this.sources = buildSources(this.el, this.options);

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'mould-contamination-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      Object.assign(this.canvas.style, {
        zIndex: String(this.options.zIndex),
        mixBlendMode: this.options.blendMode,
        opacity: String(this.options.opacity),
        contain: 'strict'
      });
      this.el.appendChild(this.canvas);

      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.maskCanvas = makeCanvas(1, 1);
      this.maskCtx = this.maskCanvas.getContext('2d', { alpha: true });
      this.tmpCanvas = makeCanvas(1, 1);
      this.tmpCtx = this.tmpCanvas.getContext('2d', { alpha: true });

      this.progress = 0;
      this.width = 0;
      this.height = 0;
      this.cssWidth = 0;
      this.cssHeight = 0;
      this.scale = 1;
      this.targetProgress = 0;
      this.scrollRaf = 0;
      this.growthRaf = 0;
      this.lastGrowthAt = 0;
      this.renderRaf = 0;
      this.resizeTimer = 0;
      this.timeTimer = 0;
      this.scrollHandler = null;

      this.resize();

      if (this.options.redrawOnResize && 'ResizeObserver' in window) {
        this.ro = new ResizeObserver(() => this.scheduleResize());
        this.ro.observe(this.el);
      }

      if (this.options.growthMode === 'scroll') this.bindScrollGrowth();
      else this.startTimedGrowth();
    }

    scheduleResize() {
      cancelAnimationFrame(this.renderRaf);
      this.renderRaf = requestAnimationFrame(() => {
        this.renderRaf = 0;
        const rect = this.el.getBoundingClientRect();
        this.canvas.style.width = `${Math.max(1, Math.round(rect.width))}px`;
        this.canvas.style.height = `${Math.max(1, Math.round(rect.height))}px`;
      });

      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        this.resizeTimer = 0;
        this.resize();
        if (this.scrollHandler) this.scrollHandler();
      }, 160);
    }

    resize() {
      const rect = this.el.getBoundingClientRect();
      const cssW = Math.max(1, Math.round(rect.width));
      const cssH = Math.max(1, Math.round(rect.height));
      let scale = Math.min(window.devicePixelRatio || 1, this.options.maxDpr);
      const estimated = cssW * cssH * scale * scale;
      if (estimated > this.options.maxPixels) {
        scale *= Math.sqrt(this.options.maxPixels / estimated);
      }
      scale = clamp(scale, 0.2, 3);

      const w = Math.max(1, Math.round(cssW * scale));
      const h = Math.max(1, Math.round(cssH * scale));
      if (w === this.width && h === this.height && cssW === this.cssWidth && cssH === this.cssHeight) {
        this.render(this.progress);
        return;
      }

      this.cssWidth = cssW;
      this.cssHeight = cssH;
      this.width = w;
      this.height = h;
      this.scale = scale;
      this.aspect = w / Math.max(1, h);
      this.visualUnit = Math.max(1, Math.max(300, Math.min(cssW, 860)) * scale);
      this.visualArea = Math.max(1, cssW * cssH);

      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style.width = `${cssW}px`;
      this.canvas.style.height = `${cssH}px`;

      const cs = getComputedStyle(this.el);
      this.canvas.style.borderTopLeftRadius = cs.borderTopLeftRadius;
      this.canvas.style.borderTopRightRadius = cs.borderTopRightRadius;
      this.canvas.style.borderBottomRightRadius = cs.borderBottomRightRadius;
      this.canvas.style.borderBottomLeftRadius = cs.borderBottomLeftRadius;

      const theatre = this.el.classList.contains('problem-theatre-stage');
      const heroRect = theatre ? this.el.parentElement?.querySelector('.hero')?.getBoundingClientRect() : null;
      const sceneBoxHeight = heroRect?.height || Math.min(cssH, window.innerHeight || cssW * 0.66);
      this.sceneBoxHeight = Math.max(1, Math.min(cssH, sceneBoxHeight));
      this.sceneBoxRatio = clamp(this.sceneBoxHeight / Math.max(1, cssH), 0.05, 1);
      this.sceneAspect = cssW / Math.max(1, this.sceneBoxHeight);
      this.mapW = theatre
        ? Math.max(72, Math.min(320, Math.round(cssW / 5)))
        : Math.max(96, Math.min(420, Math.round(cssW / 4)));
      this.mapH = theatre
        ? Math.max(72, Math.min(420, Math.round(cssH / 8)))
        : Math.max(96, Math.min(420, Math.round(cssH / 4)));
      this.maskW = theatre
        ? Math.max(80, Math.min(240, Math.round(cssW / 6)))
        : Math.max(96, Math.min(260, Math.round(cssW / 5)));
      this.maskH = theatre
        ? Math.max(80, Math.min(300, Math.round(cssH / 10)))
        : Math.max(96, Math.min(260, Math.round(cssH / 5)));

      this.maskCanvas.width = this.maskW;
      this.maskCanvas.height = this.maskH;
      this.maskImage = this.maskCtx.createImageData(this.maskW, this.maskH);
      this.tmpCanvas.width = w;
      this.tmpCanvas.height = h;

      this.noise = createNoise(`${this.options.seed}:${w}x${h}`);
      this.rng = makeRng(`${this.options.seed}:features:${w}x${h}`);
      this.buildMaps();
      this.buildLayers();
      this.render(this.progress);
    }

    sourceScenePoint(nx, ny, src) {
      if (src.metric !== 'scene') return { x: nx, y: ny, aspect: this.aspect, falloff: 1 };

      const ratio = this.sceneBoxRatio || 1;
      const y = src.y >= 0.5
        ? 1 - ((1 - ny) / ratio)
        : ny / ratio;
      const edgeFade = 0.35;
      const falloff =
        smoothstep(-edgeFade, 0, nx) *
        smoothstep(-edgeFade, 0, y) *
        (1 - smoothstep(1, 1 + edgeFade, nx)) *
        (1 - smoothstep(1, 1 + edgeFade, y));

      return {
        x: nx,
        y,
        aspect: this.sceneAspect || this.aspect,
        falloff
      };
    }

    sourceShape(nx, ny, src) {
      if (src.axis === 'x') {
        const side = src.x <= 0.5 ? 'left' : 'right';
        const inward = Math.exp(-Math.abs(nx - src.x) / (src.spreadX ?? 0.22));
        const verticalDistance = Math.abs(ny - src.y) / (src.spreadY ?? 1);
        const vertical = 0.42 + 0.58 * Math.exp(-0.85 * verticalDistance * verticalDistance);
        const edge = edgeBand(nx, ny, side, src.edgeSpread ?? 0.16);
        const n = this.noise.fbm(
          nx * (src.noiseFreq ?? 3.8) + (src.noiseX ?? 0),
          ny * (src.noiseFreq ?? 3.8) + (src.noiseY ?? 0),
          5
        );
        return clamp((inward * 0.68 + edge * 0.54 * this.options.edgeBias) * vertical * (0.52 + 0.76 * n) * (src.strength ?? 1));
      }

      if (src.axis === 'y') {
        const side = src.y <= 0.5 ? 'top' : 'bottom';
        const inward = Math.exp(-Math.abs(ny - src.y) / (src.spreadY ?? 0.16));
        const horizontalDistance = Math.abs(nx - src.x) * this.aspect / (src.spreadX ?? 1);
        const horizontal = 0.42 + 0.58 * Math.exp(-0.85 * horizontalDistance * horizontalDistance);
        const edge = edgeBand(nx, ny, side, src.edgeSpread ?? 0.12);
        const n = this.noise.fbm(
          nx * (src.noiseFreq ?? 4) + (src.noiseX ?? 0),
          ny * (src.noiseFreq ?? 4) + (src.noiseY ?? 0),
          5
        );
        return clamp((inward * 0.62 + edge * 0.48 * this.options.edgeBias) * horizontal * (0.52 + 0.76 * n) * (src.strength ?? 1));
      }

      if (src.metric === 'scene') {
        const scene = this.sourceScenePoint(nx, ny, src);
        if (scene.falloff <= 0) return 0;
        const dx = (scene.x - src.x) * scene.aspect / (src.spreadX ?? 0.58);
        const dy = (scene.y - src.y) / (src.spreadY ?? 0.58);
        const radial = Math.exp(-1.75 * (dx * dx + dy * dy));
        let edge = 0;
        for (const e of src.edges || []) {
          edge = Math.max(edge, edgeBand(scene.x, scene.y, e, src.edgeSpread ?? 0.14));
        }
        const n = this.noise.fbm(
          nx * (src.noiseFreq ?? 3) + (src.noiseX ?? 0),
          ny * (src.noiseFreq ?? 3) + (src.noiseY ?? 0),
          5
        );
        const vertical =
          src.y <= 0.05 ? 0.66 + 0.54 * Math.exp(-scene.y / 0.38) :
          src.y >= 0.95 ? 0.66 + 0.54 * Math.exp(-(1 - scene.y) / 0.38) :
          1;
        return clamp((radial * 0.86 + edge * 0.48 * this.options.edgeBias) * vertical * (0.48 + 0.78 * n) * (src.strength ?? 1) * scene.falloff);
      }

      const dx = (nx - src.x) * this.aspect / (src.spreadX ?? 0.58);
      const dy = (ny - src.y) / (src.spreadY ?? 0.58);
      const radial = Math.exp(-1.75 * (dx * dx + dy * dy));
      let edge = 0;
      for (const e of src.edges || []) {
        edge = Math.max(edge, edgeBand(nx, ny, e, src.edgeSpread ?? 0.14));
      }
      const n = this.noise.fbm(
        nx * (src.noiseFreq ?? 3) + (src.noiseX ?? 0),
        ny * (src.noiseFreq ?? 3) + (src.noiseY ?? 0),
        5
      );
      const vertical =
        src.y <= 0.05 ? 0.66 + 0.54 * Math.exp(-ny / 0.38) :
        src.y >= 0.95 ? 0.66 + 0.54 * Math.exp(-(1 - ny) / 0.38) :
        1;
      return clamp((radial * 0.86 + edge * 0.48 * this.options.edgeBias) * vertical * (0.48 + 0.78 * n) * (src.strength ?? 1));
    }

    sourceArrival(nx, ny, src, shape) {
      let dist;
      if (src.axis === 'x') {
        dist = Math.pow(Math.abs(nx - src.x) / (src.spreadX ?? 0.22), 0.84);
      } else if (src.axis === 'y') {
        dist = Math.pow(Math.abs(ny - src.y) / (src.spreadY ?? 0.16), 0.84);
      } else if (src.metric === 'scene') {
        const scene = this.sourceScenePoint(nx, ny, src);
        const dx = Math.abs(scene.x - src.x) * scene.aspect / (src.spreadX ?? 0.58);
        const dy = Math.abs(scene.y - src.y) / (src.spreadY ?? 0.58);
        dist = Math.pow(Math.sqrt(dx * dx + dy * dy), 0.92);
      } else {
        const dx = Math.abs(nx - src.x) * this.aspect / (src.spreadX ?? 0.58);
        const dy = Math.abs(ny - src.y) / (src.spreadY ?? 0.58);
        dist = Math.pow(Math.sqrt(dx * dx + dy * dy), 0.92);
      }
      let edgeAdvantage = 0;
      for (const e of src.edges || []) {
        edgeAdvantage = Math.max(edgeAdvantage, edgeBand(nx, ny, e, src.edgeSpread ?? 0.14));
      }
      const resistance = this.noise.fbm(
        nx * 4.1 + (src.arrivalX ?? 13.7),
        ny * 4.1 + (src.arrivalY ?? 4.2),
        4
      );
      return (src.start ?? 0) + dist * (src.speed ?? 0.44) * (0.78 + 0.48 * (1 - resistance)) - edgeAdvantage * 0.055 + (1 - shape) * 0.12;
    }

    buildMaps() {
      const len = this.mapW * this.mapH;
      this.field = new Float32Array(len);
      this.arrival = new Float32Array(len);
      for (let y = 0; y < this.mapH; y++) {
        for (let x = 0; x < this.mapW; x++) {
          const nx = (x + 0.5) / this.mapW;
          const ny = (y + 0.5) / this.mapH;
          let fieldSum = 0;
          let firstArrival = 9;
          for (const src of this.sources) {
            const shape = this.sourceShape(nx, ny, src);
            fieldSum += shape;
            if (shape > 0.002) firstArrival = Math.min(firstArrival, this.sourceArrival(nx, ny, src, shape));
          }
          const large = this.noise.fbm(nx * 2.4 + 1.7, ny * 2.4 - 4.2, 5);
          const mid = this.noise.fbm(nx * 8.0 - 3.1, ny * 8.0 + 9.4, 4);
          const raw = clamp(fieldSum * (0.50 + 0.80 * large) + fieldSum * Math.pow(mid, 1.6) * 0.22);
          const i = y * this.mapW + x;
          this.field[i] = raw * (0.45 + this.options.coverage * 0.8);
          this.arrival[i] = firstArrival < 9 ? clamp(firstArrival + (1 - raw) * 0.14, -0.12, 1.35) : 1.4;
        }
      }
    }

    sample(arr, nx, ny) {
      const x = clamp(Math.floor(nx * this.mapW), 0, this.mapW - 1);
      const y = clamp(Math.floor(ny * this.mapH), 0, this.mapH - 1);
      return arr[y * this.mapW + x];
    }

    sampleField(nx, ny) {
      return this.sample(this.field, nx, ny);
    }

    weightedPoint(power = 1, tries = 60) {
      let best = { x: this.rng() * this.width, y: this.rng() * this.height, v: 0 };
      for (let i = 0; i < tries; i++) {
        const x = this.rng() * this.width;
        const y = this.rng() * this.height;
        const v = this.sampleField(x / this.width, y / this.height);
        if (v > best.v) best = { x, y, v };
        if (this.rng() < Math.pow(v, power)) return { x, y, v };
      }
      return best;
    }

    buildLayers() {
      this.layers = {
        stain: makeCanvas(this.width, this.height),
        fuzz: makeCanvas(this.width, this.height),
        edge: makeCanvas(this.width, this.height),
        colonies: makeCanvas(this.width, this.height),
        speckles: makeCanvas(this.width, this.height)
      };
      this.colonies = [];
      this.paintStainLayer(this.layers.stain.getContext('2d'));
      this.paintFuzzLayer(this.layers.fuzz.getContext('2d'));
      this.paintEdgeLayer(this.layers.edge.getContext('2d'));
      this.paintColoniesLayer(this.layers.colonies.getContext('2d'));
      this.paintSpecklesLayer(this.layers.speckles.getContext('2d'));
    }

    paintStainLayer(ctx) {
      const low = makeCanvas(this.mapW, this.mapH);
      const lctx = low.getContext('2d');
      const img = lctx.createImageData(this.mapW, this.mapH);
      const cool = [86, 84, 67];
      const warm = [122, 98, 70];
      const dark = [42, 45, 31];
      for (let i = 0; i < this.field.length; i++) {
        const f = this.field[i];
        const a = smoothstep(0.035, 0.86, f) * 0.54 * this.options.intensity * this.options.staining;
        const t = clamp(this.options.warmth + (f - 0.5) * 0.25);
        const base = [lerp(cool[0], warm[0], t), lerp(cool[1], warm[1], t), lerp(cool[2], warm[2], t)];
        const rgb = [
          lerp(base[0], dark[0], smoothstep(0.42, 1, f) * 0.34),
          lerp(base[1], dark[1], smoothstep(0.42, 1, f) * 0.34),
          lerp(base[2], dark[2], smoothstep(0.42, 1, f) * 0.34)
        ];
        const p = i * 4;
        img.data[p] = rgb[0];
        img.data[p + 1] = rgb[1];
        img.data[p + 2] = rgb[2];
        img.data[p + 3] = clamp(a) * 255;
      }
      lctx.putImageData(img, 0, 0);
      ctx.save();
      ctx.filter = `blur(${Math.max(1.5, Math.min(this.width, this.height) * 0.012)}px)`;
      ctx.drawImage(low, 0, 0, this.width, this.height);
      ctx.restore();
    }

    paintFuzzLayer(ctx) {
      const area = this.visualArea;
      const theatre = this.el.classList.contains('problem-theatre-stage');
      const count = Math.round(clamp(area / (theatre ? 14000 : 11500), 10, theatre ? 110 : 140) * this.options.intensity * this.options.fuzz);
      ctx.save();
      ctx.filter = 'blur(2.4px)';
      for (let i = 0; i < count; i++) {
        const p = this.weightedPoint(1.05, 80);
        if (p.v < 0.05) continue;
        const r = lerp(this.visualUnit * 0.008, this.visualUnit * 0.092, Math.pow(this.rng(), 0.42)) * (0.45 + p.v);
        const alpha = (0.014 + 0.046 * this.rng()) * (0.55 + p.v) * this.options.intensity * this.options.fuzz;
        drawRadial(ctx, p.x, p.y, r, pickMouldColour(this.rng, this.options.warmth, false), alpha, 0.58);
      }
      ctx.restore();
    }

    pointOnEdge(edge, t, dist) {
      if (edge === 'top') return { x: t * this.width, y: dist };
      if (edge === 'bottom') return { x: t * this.width, y: this.height - dist };
      if (edge === 'left') return { x: dist, y: t * this.height };
      return { x: this.width - dist, y: t * this.height };
    }

    paintEdgeLayer(ctx) {
      ctx.save();
      ctx.filter = 'blur(1.35px)';
      for (const src of this.sources) {
        for (const edge of src.edges || []) {
          const length = edge === 'top' || edge === 'bottom' ? this.width : this.height;
          const lengthCss = length / Math.max(0.001, this.scale);
          const count = Math.round(clamp(lengthCss / 5.5, 18, 320) * (src.strength ?? 1) * this.options.edgeBias);
          for (let i = 0; i < count; i++) {
            const t = this.rng();
            const dist = Math.pow(this.rng(), 2.15) * lerp(5 * this.scale, 46 * this.scale, this.options.intensity);
            const p = this.pointOnEdge(edge, t, dist);
            const f = this.sampleField(p.x / this.width, p.y / this.height);
            if (this.rng() > f * 1.55 + 0.08) continue;
            const radius = lerp(3 * this.scale, 18 * this.scale, Math.pow(this.rng(), 0.58)) * (0.55 + f * 0.75);
            const alpha = lerp(0.01, 0.048, this.rng()) * (0.55 + f) * this.options.intensity * this.options.edgeBias;
            drawRadial(ctx, p.x, p.y, radius, pickMouldColour(this.rng, this.options.warmth, false), alpha, 0.68);
          }
        }
      }
      ctx.restore();
    }

    paintColoniesLayer(ctx) {
      const area = this.visualArea;
      const theatre = this.el.classList.contains('problem-theatre-stage');
      const count = Math.round(clamp(area / (theatre ? 13000 : 10500), 6, theatre ? 150 : 190) * this.options.density * this.options.intensity);
      for (let i = 0; i < count; i++) {
        const p = this.weightedPoint(0.68, 90);
        if (p.v < 0.08) continue;
        const radius = lerp(Math.max(2.2, this.visualUnit * 0.0045), this.visualUnit * 0.048, Math.pow(this.rng(), 0.33)) * (0.72 + p.v);
        this.colonies.push({ x: p.x, y: p.y, r: radius, v: p.v });
        const lobes = Math.round(lerp(9, 40, this.options.intensity) * (0.7 + this.rng() * 0.9));
        drawRadial(ctx, p.x, p.y, radius * 0.82, pickMouldColour(this.rng, this.options.warmth, true), 0.18 * (0.55 + p.v) * this.options.intensity, 0.46);
        for (let l = 0; l < lobes; l++) {
          const a = this.rng() * TAU;
          const d = radius * Math.pow(this.rng(), 0.78);
          const x = p.x + Math.cos(a) * d;
          const y = p.y + Math.sin(a) * d;
          const r = radius * lerp(0.08, 0.42, Math.pow(this.rng(), 1.55));
          drawRadial(ctx, x, y, r, pickMouldColour(this.rng, this.options.warmth, this.rng() < 0.75), lerp(0.045, 0.27, this.rng()) * (0.55 + p.v) * this.options.intensity, 0.58);
        }
      }
    }

    paintSpecklesLayer(ctx) {
      const area = this.visualArea;
      const theatre = this.el.classList.contains('problem-theatre-stage');
      const target = Math.round(clamp(area / (theatre ? 70 : 54), 260, theatre ? 18000 : 24000) * this.options.density * this.options.intensity);
      const maxAttempts = target * (theatre ? 6 : 9);
      let placed = 0;
      for (let i = 0; i < maxAttempts && placed < target; i++) {
        const x = this.rng() * this.width;
        const y = this.rng() * this.height;
        const f = this.sampleField(x / this.width, y / this.height);
        if (this.rng() > Math.pow(f, 0.72) * 1.18) continue;
        let boost = 0;
        for (const c of this.colonies) {
          const dx = c.x - x;
          const dy = c.y - y;
          const rr = c.r * 2.7;
          const d2 = dx * dx + dy * dy;
          if (d2 < rr * rr) boost = Math.max(boost, 1 - Math.sqrt(d2) / rr);
        }
        if (this.rng() > 0.11 + boost * 0.89) continue;
        const roll = this.rng();
        const rCss = roll > 0.985 ? lerp(3.2, 8.2, this.rng()) : roll > 0.91 ? lerp(1.2, 3.1, this.rng()) : lerp(0.28, 1.12, Math.pow(this.rng(), 1.8));
        const r = rCss * this.scale;
        const alpha = lerp(0.16, 0.9, this.rng()) * (0.42 + f * 0.9) * this.options.intensity;
        const colour = pickMouldColour(this.rng, this.options.warmth, this.rng() < 0.84);
        if (r < 0.75) {
          ctx.fillStyle = rgba(colour, alpha);
          ctx.fillRect(x, y, Math.max(0.45 * this.scale, r), Math.max(0.45 * this.scale, r));
        } else if (r < 2) {
          ctx.fillStyle = rgba(colour, alpha);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fill();
        } else {
          drawRadial(ctx, x, y, r, colour, alpha, 0.5);
        }
        placed++;
      }
    }

    buildMask(t, options) {
      const { lead = 0, span = 0.32, floor = 0.04, wetPower = 0.9, maturityPower = 1.15 } = options;
      const data = this.maskImage.data;
      for (let y = 0; y < this.maskH; y++) {
        for (let x = 0; x < this.maskW; x++) {
          const nx = (x + 0.5) / this.maskW;
          const ny = (y + 0.5) / this.maskH;
          const field = this.sampleField(nx, ny);
          const arrival = this.sample(this.arrival, nx, ny);
          const maturity = smoothstep(arrival + lead, arrival + lead + span, t);
          const wetness = smoothstep(floor, 0.82, field);
          const alpha = Math.pow(maturity, maturityPower) * Math.pow(wetness, wetPower);
          const p = (y * this.maskW + x) * 4;
          data[p] = 0;
          data[p + 1] = 0;
          data[p + 2] = 0;
          data[p + 3] = clamp(alpha) * 255;
        }
      }
      this.maskCtx.putImageData(this.maskImage, 0, 0);
    }

    drawMaskedLayer(layer, t, maskOptions, alpha = 1) {
      const tmp = this.tmpCtx;
      tmp.setTransform(1, 0, 0, 1, 0, 0);
      tmp.clearRect(0, 0, this.width, this.height);
      tmp.globalAlpha = 1;
      tmp.globalCompositeOperation = 'source-over';
      tmp.filter = 'none';
      tmp.drawImage(layer, 0, 0);
      this.buildMask(t, maskOptions);
      tmp.globalCompositeOperation = 'destination-in';
      tmp.imageSmoothingEnabled = true;
      tmp.drawImage(this.maskCanvas, 0, 0, this.width, this.height);
      tmp.globalCompositeOperation = 'source-over';
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.drawImage(this.tmpCanvas, 0, 0);
      this.ctx.restore();
    }

    render(t) {
      this.progress = clamp(t, 0, this.options.scrollMaturity);
      const ctx = this.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.width, this.height);
      this.drawMaskedLayer(this.layers.stain, this.progress, { lead: -0.08, span: 0.50, floor: 0.018, wetPower: 0.62, maturityPower: 0.94 }, 0.86);
      this.drawMaskedLayer(this.layers.fuzz, this.progress, { lead: -0.01, span: 0.46, floor: 0.032, wetPower: 0.72, maturityPower: 1.02 }, 0.95);
      this.drawMaskedLayer(this.layers.edge, this.progress, { lead: 0.02, span: 0.44, floor: 0.026, wetPower: 0.66, maturityPower: 1.04 }, 0.66);
      this.drawMaskedLayer(this.layers.colonies, this.progress, { lead: 0.08, span: 0.42, floor: 0.048, wetPower: 0.82, maturityPower: 1.08 }, 1.08);
      this.drawMaskedLayer(this.layers.speckles, this.progress, { lead: 0.12, span: 0.40, floor: 0.04, wetPower: 0.74, maturityPower: 1.06 }, 1.08);
    }

    getScrollRoot() {
      if (!this.options.scrollRoot) return this.el;
      return document.querySelector(this.options.scrollRoot) || this.el;
    }

    getScrollProgress() {
      const root = this.getScrollRoot();
      const rect = root.getBoundingClientRect();
      const docTop = rect.top + window.scrollY;
      const height = Math.max(1, root.offsetHeight || rect.height);
      const viewport = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
      const travel = Math.max(1, height - viewport);
      const start = docTop + travel * this.options.scrollStart;
      const end = docTop + travel * this.options.scrollEnd;
      return clamp((window.scrollY - start) / Math.max(1, end - start));
    }

    bindScrollGrowth() {
      const organicProgress = value => {
        const t = clamp(value);
        const eased = Math.pow(t, this.options.scrollEase);
        const whisper = t * 0.035;
        return clamp(eased + whisper * (1 - eased));
      };
      const update = () => {
        this.scrollRaf = 0;
        const scrollTarget = Math.max(
          this.options.seedProgress,
          organicProgress(this.getScrollProgress()) * this.options.scrollMaturity
        );
        this.targetProgress = Math.max(this.targetProgress, scrollTarget);
        this.startScrollCatchup();
      };
      this.scrollHandler = () => {
        if (!this.scrollRaf) this.scrollRaf = requestAnimationFrame(update);
      };
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
      window.addEventListener('resize', this.scrollHandler);
      update();
      return this;
    }

    startScrollCatchup() {
      if (this.growthRaf) return this;

      this.growthRaf = requestAnimationFrame(() => {
        this.growthRaf = 0;
        this.render(this.targetProgress);
      });
      return this;
    }

    startTimedGrowth() {
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion || this.options.growthDuration <= 0) {
        this.render(1);
        return this;
      }
      const startedAt = performance.now() + this.options.growthDelay;
      const tick = () => {
        const t = Math.max(this.options.seedProgress, clamp((performance.now() - startedAt) / this.options.growthDuration));
        this.render(t);
        if (t < 1) this.timeTimer = setTimeout(tick, 42);
      };
      tick();
      return this;
    }

    destroy() {
      if (this.scrollHandler) {
        window.removeEventListener('scroll', this.scrollHandler);
        window.removeEventListener('resize', this.scrollHandler);
      }
      cancelAnimationFrame(this.scrollRaf);
      cancelAnimationFrame(this.growthRaf);
      cancelAnimationFrame(this.renderRaf);
      clearTimeout(this.resizeTimer);
      clearTimeout(this.timeTimer);
      if (this.ro) this.ro.disconnect();
      this.canvas.remove();
    }

    static mountAll(root = document, options = {}) {
      return Array.from(root.querySelectorAll('[data-mould]'))
        .filter(el => !el.__mouldContamination)
        .map(el => {
          const instance = new MouldContamination(el, options);
          el.__mouldContamination = instance;
          return instance;
        });
    }

    static mountVisible(root = document, options = {}) {
      const targets = Array.from(root.querySelectorAll('[data-mould]'))
        .filter(el => !el.__mouldContamination);
      if (!targets.length) return [];

      const mounted = [];
      const mount = el => {
        if (el.__mouldContamination) return el.__mouldContamination;
        const instance = new MouldContamination(el, options);
        el.__mouldContamination = instance;
        mounted.push(instance);
        return instance;
      };

      const immediate = targets.filter(el => el.classList.contains('problem-theatre-stage'));
      const deferred = targets.filter(el => !immediate.includes(el));
      immediate.forEach(mount);

      if (!deferred.length || !('IntersectionObserver' in window)) {
        deferred.forEach(mount);
        return mounted;
      }

      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          mount(entry.target);
          observer.unobserve(entry.target);
        }
      }, {
        rootMargin: '35% 0px',
        threshold: 0.01
      });

      deferred.forEach(el => observer.observe(el));
      return mounted;
    }
  }

  window.MouldContamination = MouldContamination;
  window.MouldEngine = MouldContamination;

  if (!window.MOULD_CONTAMINATION_NO_AUTO_MOUNT) {
    const mount = () => MouldContamination.mountVisible(document);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
    else mount();
  }
})();
