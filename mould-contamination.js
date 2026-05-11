/* mould-contamination.js
   Vanilla, dependency-free element-aware mould contamination overlay.
   Usage: new MouldContamination(document.querySelector('.card'), { mode: 'corner-bloom' })
*/
(() => {
  const TWO_PI = Math.PI * 2;

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
        border-radius: inherit;
      }
    `;
    document.head.appendChild(style);
  }

  const DEFAULTS = {
    mode: 'corner-bloom',       // corner-bloom | ceiling-line | skirting-creep | patch-bloom | window-frame | humidity-speckle | severe-colony
    source: 'top-left',         // top-left | top-right | bottom-left | bottom-right | top | right | bottom | left | center | "0.25,0.1"
    edges: null,                // optional override: "top,left" or "none"
    material: 'painted-plaster',
    seed: null,
    intensity: 0.75,            // 0..1, visual darkness/strength
    coverage: 0.45,             // 0..1, how much of the dampness field becomes visible growth
    density: 0.75,              // 0..1, speckle/colony density
    edgeBias: 0.85,             // 0..1, how much growth clings to edges/seams
    staining: 0.5,              // 0..1, damp discoloration under colonies
    fuzz: 0.65,                 // 0..1, soft fungal haze
    opacity: 1,
    blendMode: 'multiply',      // multiply usually looks most physically integrated on light surfaces
    zIndex: 1,
    maxDpr: 2,
    autoRender: true,
    redrawOnResize: true
  };

  const MATERIALS = {
    'painted-plaster': { stain: 1.00, growth: 1.00, grain: 0.45, warmth: 0.42 },
    plaster:           { stain: 1.05, growth: 1.00, grain: 0.55, warmth: 0.38 },
    paper:             { stain: 1.20, growth: 0.86, grain: 0.75, warmth: 0.65 },
    tile:              { stain: 0.45, growth: 0.72, grain: 0.18, warmth: 0.22 },
    timber:            { stain: 0.90, growth: 0.82, grain: 0.95, warmth: 0.82 },
    concrete:          { stain: 0.85, growth: 1.08, grain: 0.85, warmth: 0.25 }
  };

  const MODE_ALIASES = {
    corner: 'corner-bloom',
    ceiling: 'ceiling-line',
    top: 'ceiling-line',
    'top-edge': 'ceiling-line',
    'ceiling-line': 'ceiling-line',
    skirting: 'skirting-creep',
    bottom: 'skirting-creep',
    'bottom-edge': 'skirting-creep',
    'skirting-creep': 'skirting-creep',
    patch: 'patch-bloom',
    window: 'window-frame',
    speckle: 'humidity-speckle',
    severe: 'severe-colony',
    'severe-colony': 'severe-colony',
    'patch-bloom': 'patch-bloom',
    'corner-bloom': 'corner-bloom',
    'window-frame': 'window-frame',
    'humidity-speckle': 'humidity-speckle'
  };

  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (edge0, edge1, x) => {
    const t = clamp((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  };

  function hashString(str) {
    let h = 2166136261;
    str = String(str ?? '');
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

  function normaliseMode(mode) {
    const m = String(mode || DEFAULTS.mode).trim().toLowerCase().replace(/_/g, '-');
    return MODE_ALIASES[m] || m;
  }

  function parseSource(source) {
    const s = String(source || 'top-left').trim().toLowerCase();
    if (/^\s*\d*\.?\d+\s*,\s*\d*\.?\d+\s*$/.test(s)) {
      const [x, y] = s.split(',').map(Number);
      return { x: clamp(x), y: clamp(y), edges: [], kind: 'point' };
    }

    const map = {
      'top-left':     { x: 0,   y: 0,   edges: ['top', 'left'],    corner: 'top-left',     kind: 'corner' },
      'left-top':     { x: 0,   y: 0,   edges: ['top', 'left'],    corner: 'top-left',     kind: 'corner' },
      'top-right':    { x: 1,   y: 0,   edges: ['top', 'right'],   corner: 'top-right',    kind: 'corner' },
      'right-top':    { x: 1,   y: 0,   edges: ['top', 'right'],   corner: 'top-right',    kind: 'corner' },
      'bottom-left':  { x: 0,   y: 1,   edges: ['bottom', 'left'], corner: 'bottom-left',  kind: 'corner' },
      'left-bottom':  { x: 0,   y: 1,   edges: ['bottom', 'left'], corner: 'bottom-left',  kind: 'corner' },
      'bottom-right': { x: 1,   y: 1,   edges: ['bottom', 'right'],corner: 'bottom-right', kind: 'corner' },
      'right-bottom': { x: 1,   y: 1,   edges: ['bottom', 'right'],corner: 'bottom-right', kind: 'corner' },
      top:            { x: 0.5, y: 0,   edges: ['top'],            kind: 'edge' },
      right:          { x: 1,   y: 0.5, edges: ['right'],          kind: 'edge' },
      bottom:         { x: 0.5, y: 1,   edges: ['bottom'],         kind: 'edge' },
      left:           { x: 0,   y: 0.5, edges: ['left'],           kind: 'edge' },
      center:         { x: 0.5, y: 0.5, edges: [],                 kind: 'point' },
      centre:         { x: 0.5, y: 0.5, edges: [],                 kind: 'point' }
    };
    return map[s] || map['top-left'];
  }

  function parseEdges(edges, mode, sourceSpec) {
    if (edges && String(edges).trim().toLowerCase() === 'none') return [];
    if (edges) {
      return String(edges)
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(e => ['top', 'right', 'bottom', 'left'].includes(e));
    }

    switch (mode) {
      case 'ceiling-line': return ['top'];
      case 'skirting-creep': return ['bottom'];
      case 'window-frame': {
        const side = sourceSpec.edges.includes('right') ? 'right' : 'left';
        return ['top', side];
      }
      case 'corner-bloom':
      case 'severe-colony': return sourceSpec.edges.length ? sourceSpec.edges : ['top', 'left'];
      default: return sourceSpec.edges || [];
    }
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

  function cornerGaussian(x, y, src, aspect, rx = 0.48, ry = 0.48) {
    const dx = Math.abs(x - src.x) * aspect / rx;
    const dy = Math.abs(y - src.y) / ry;
    return Math.exp(-1.7 * (dx * dx + dy * dy));
  }

  function pointGaussian(x, y, cx, cy, aspect, rx = 0.35, ry = 0.35) {
    const dx = (x - cx) * aspect / rx;
    const dy = (y - cy) / ry;
    return Math.exp(-2.1 * (dx * dx + dy * dy));
  }

  function modeShape(x, y, opts, src, activeEdges, noise) {
    const mode = opts.mode;
    const aspect = opts.aspect || 1;
    const edgeBias = opts.edgeBias;
    const nLow = noise.fbm(x * 1.8 + 13.1, y * 1.8 - 7.3, 4);

    if (mode === 'ceiling-line') {
      const top = edgeBand(x, y, 'top', 0.055 + 0.055 * edgeBias);
      const plume = Math.exp(-y / (0.20 + 0.18 * opts.coverage)) * (0.28 + 0.90 * nLow);
      const brokenColumns = Math.pow(noise.fbm(x * 5.6 + 1.1, y * 2.2 + 5.0, 4), 1.6);
      return clamp(top * 0.95 + plume * (0.35 + 0.65 * brokenColumns));
    }

    if (mode === 'skirting-creep') {
      const bottom = edgeBand(x, y, 'bottom', 0.06 + 0.07 * edgeBias);
      const upward = Math.exp(-(1 - y) / (0.18 + 0.20 * opts.coverage)) * (0.25 + 0.85 * nLow);
      const patches = Math.pow(noise.fbm(x * 4.2 - 3.0, y * 3.2 + 11.0, 5), 1.35);
      return clamp(bottom * 0.90 + upward * patches);
    }

    if (mode === 'window-frame') {
      const side = activeEdges.includes('right') ? 'right' : 'left';
      const top = edgeBand(x, y, 'top', 0.06 + 0.04 * edgeBias);
      const vertical = edgeBand(x, y, side, 0.055 + 0.05 * edgeBias);
      const csrc = side === 'right'
        ? { x: 1, y: 0, edges: ['top', 'right'] }
        : { x: 0, y: 0, edges: ['top', 'left'] };
      const corner = cornerGaussian(x, y, csrc, aspect, 0.55, 0.52);
      const down = Math.exp(-y / (0.35 + 0.15 * opts.coverage));
      return clamp(top * 0.52 + vertical * 0.45 * down + corner * 0.88);
    }

    if (mode === 'patch-bloom') {
      const cx = src.kind === 'point' ? src.x : 0.5;
      const cy = src.kind === 'point' ? src.y : 0.52;
      const main = pointGaussian(x, y, cx, cy, aspect, 0.33 + opts.coverage * 0.18, 0.30 + opts.coverage * 0.16);
      const satellites = Math.pow(noise.fbm(x * 3.3 + 41.0, y * 3.3 - 2.5, 5), 1.45);
      return clamp(main * (0.55 + 0.75 * satellites));
    }

    if (mode === 'humidity-speckle') {
      const broad = noise.fbm(x * 1.2 + 18.0, y * 1.2 + 3.0, 5);
      const mid = noise.fbm(x * 4.5 - 10.0, y * 4.5 + 9.0, 4);
      return clamp(0.18 + broad * 0.52 + mid * 0.32);
    }

    if (mode === 'severe-colony') {
      let edges = 0;
      for (const e of activeEdges) edges = Math.max(edges, edgeBand(x, y, e, 0.10 + 0.09 * edgeBias));
      const corner = cornerGaussian(x, y, src, aspect, 0.62, 0.62);
      const broad = noise.fbm(x * 2.2 - 5.0, y * 2.2 + 8.0, 5);
      return clamp(corner * 0.90 + edges * 0.50 + broad * 0.34);
    }

    // corner-bloom default: dampness originates at a corner and creeps along both adjacent planes/edges.
    let edgeCreep = 0;
    for (const e of activeEdges) edgeCreep = Math.max(edgeCreep, edgeBand(x, y, e, 0.055 + 0.065 * edgeBias));
    const corner = cornerGaussian(x, y, src, aspect, 0.55, 0.55);
    const downwardBias = src.y === 0 ? Math.exp(-y / (0.40 + opts.coverage * 0.15)) : Math.exp(-(1 - y) / (0.40 + opts.coverage * 0.15));
    const lateralBreakup = Math.pow(noise.fbm(x * 3.2 + 9.7, y * 2.5 + 30.0, 4), 1.25);
    return clamp(corner * 0.82 + edgeCreep * 0.42 + downwardBias * lateralBreakup * 0.35);
  }

  function rawWetness(x, y, opts, src, activeEdges, noise, mat) {
    const shape = modeShape(x, y, opts, src, activeEdges, noise);
    const large = noise.fbm(x * 2.75 + 0.1, y * 2.75 - 12.4, 5);
    const mid = noise.fbm(x * 8.5 + 4.0, y * 8.5 + 17.0, 4);
    const fine = noise.fbm(x * 22.0 - 5.0, y * 22.0 + 2.0, 3);

    // Cellular-ish breaks: high where two noise bands agree, creating biological clumps rather than flat dirt.
    const clump = Math.pow(clamp(mid * 0.78 + fine * 0.32), 1.35);
    const ragged = shape * (0.50 + 0.72 * large) + shape * clump * 0.50;
    const grain = (mid - 0.5) * 0.12 * mat.grain;

    return clamp((ragged + grain) * mat.growth);
  }

  function buildGrowthMap(width, height, opts, src, activeEdges, noise, mat) {
    const mw = Math.max(48, Math.min(360, Math.round(width / 3)));
    const mh = Math.max(48, Math.min(360, Math.round(height / 3)));
    const raw = new Float32Array(mw * mh);
    const growth = new Float32Array(mw * mh);
    const stain = new Float32Array(mw * mh);

    const threshold = lerp(0.80, 0.25, opts.coverage);
    for (let y = 0; y < mh; y++) {
      for (let x = 0; x < mw; x++) {
        const nx = (x + 0.5) / mw;
        const ny = (y + 0.5) / mh;
        const r = rawWetness(nx, ny, opts, src, activeEdges, noise, mat);
        const g = smoothstep(threshold - 0.22, threshold + 0.10, r) * opts.intensity;
        const s = smoothstep(0.06, 0.76, r) * opts.staining * (0.45 + 0.55 * opts.intensity);
        const id = y * mw + x;
        raw[id] = r;
        growth[id] = clamp(g);
        stain[id] = clamp(s);
      }
    }

    function sample(arr, nx, ny) {
      const x = clamp(Math.floor(nx * mw), 0, mw - 1);
      const y = clamp(Math.floor(ny * mh), 0, mh - 1);
      return arr[y * mw + x];
    }

    return {
      width: mw,
      height: mh,
      raw,
      growth,
      stain,
      sampleRaw: (nx, ny) => sample(raw, nx, ny),
      sampleGrowth: (nx, ny) => sample(growth, nx, ny),
      sampleStain: (nx, ny) => sample(stain, nx, ny)
    };
  }

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  }

  function colorString(rgb, a) {
    return `rgba(${rgb[0] | 0}, ${rgb[1] | 0}, ${rgb[2] | 0}, ${clamp(a)})`;
  }

  function pickPalette(rng, warmth = 0.4, dark = false) {
    const cold = [
      [19, 24, 17], [26, 31, 20], [36, 39, 25], [48, 45, 31]
    ];
    const warm = [
      [43, 35, 22], [62, 49, 31], [79, 66, 43], [33, 29, 18]
    ];
    const set = rng() < warmth ? warm : cold;
    const c = set[Math.floor(rng() * set.length)];
    if (!dark) return c;
    return [Math.max(8, c[0] * 0.55), Math.max(9, c[1] * 0.55), Math.max(7, c[2] * 0.55)];
  }

  function drawRadial(ctx, x, y, r, rgb, alpha, inner = 0.0, mid = 0.55) {
    const g = ctx.createRadialGradient(x, y, r * inner, x, y, r);
    g.addColorStop(0, colorString(rgb, alpha));
    g.addColorStop(mid, colorString(rgb, alpha * 0.55));
    g.addColorStop(1, colorString(rgb, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TWO_PI);
    ctx.fill();
  }

  function drawStainLayer(ctx, width, height, map, opts, mat, rng) {
    const off = makeCanvas(map.width, map.height);
    const octx = off.getContext('2d');
    const img = octx.createImageData(map.width, map.height);
    const cool = [83, 82, 66];
    const warm = [119, 98, 68];
    const dark = [44, 45, 32];

    for (let i = 0; i < map.stain.length; i++) {
      const v = map.stain[i];
      const g = map.growth[i];
      const t = clamp(mat.warmth + (rng() - 0.5) * 0.10);
      const base = [
        lerp(cool[0], warm[0], t),
        lerp(cool[1], warm[1], t),
        lerp(cool[2], warm[2], t)
      ];
      const rgb = [
        lerp(base[0], dark[0], g * 0.32),
        lerp(base[1], dark[1], g * 0.32),
        lerp(base[2], dark[2], g * 0.32)
      ];
      const a = clamp(Math.pow(v, 0.90) * 0.36 * mat.stain) * 255;
      const p = i * 4;
      img.data[p] = rgb[0];
      img.data[p + 1] = rgb[1];
      img.data[p + 2] = rgb[2];
      img.data[p + 3] = a;
    }

    octx.putImageData(img, 0, 0);
    ctx.save();
    ctx.globalAlpha = opts.opacity;
    ctx.filter = `blur(${Math.max(1.5, Math.min(width, height) * 0.010)}px)`;
    ctx.drawImage(off, 0, 0, width, height);
    ctx.restore();
  }

  function biasedPoint(map, rng, width, height, channel = 'growth', power = 1.0, tries = 40) {
    let best = { x: rng() * width, y: rng() * height, v: 0 };
    for (let i = 0; i < tries; i++) {
      const x = rng() * width;
      const y = rng() * height;
      const nx = x / width;
      const ny = y / height;
      const v = channel === 'raw' ? map.sampleRaw(nx, ny) : map.sampleGrowth(nx, ny);
      if (v > best.v) best = { x, y, v };
      if (rng() < Math.pow(v, power)) return { x, y, v };
    }
    return best;
  }

  function drawFuzzLayer(ctx, width, height, map, opts, mat, rng) {
    const area = width * height;
    const count = Math.round(clamp(area / 18000, 4, 70) * opts.fuzz * (0.55 + opts.intensity));

    ctx.save();
    ctx.globalAlpha = opts.opacity;
    ctx.filter = `blur(${Math.max(1, Math.min(width, height) * 0.004)}px)`;

    for (let i = 0; i < count; i++) {
      const p = biasedPoint(map, rng, width, height, 'raw', 1.25, 60);
      if (p.v < 0.08) continue;
      const r = lerp(10, Math.min(width, height) * 0.18, Math.pow(rng(), 0.45)) * (0.55 + p.v);
      const rgb = pickPalette(rng, mat.warmth, false);
      const alpha = (0.025 + 0.090 * rng()) * opts.fuzz * opts.intensity * (0.45 + p.v);
      drawRadial(ctx, p.x, p.y, r, rgb, alpha, 0, 0.58);
    }

    ctx.restore();
  }

  function drawColony(ctx, x, y, radius, value, opts, mat, rng) {
    const lobes = Math.round(lerp(8, 34, opts.intensity * opts.density) * (0.7 + rng() * 0.8));
    ctx.save();
    ctx.globalAlpha = opts.opacity;
    ctx.filter = `blur(${0.15 + rng() * 0.85}px)`;

    const core = pickPalette(rng, mat.warmth, true);
    drawRadial(ctx, x, y, radius * (0.55 + rng() * 0.35), core, 0.20 * opts.intensity * (0.35 + value), 0, 0.45);

    for (let i = 0; i < lobes; i++) {
      const a = rng() * TWO_PI;
      const d = radius * Math.pow(rng(), 0.75);
      const px = x + Math.cos(a) * d;
      const py = y + Math.sin(a) * d;
      const rr = radius * lerp(0.10, 0.45, Math.pow(rng(), 1.8));
      const rgb = pickPalette(rng, mat.warmth, rng() < 0.65);
      const alpha = lerp(0.045, 0.24, rng()) * opts.intensity * (0.55 + value);
      drawRadial(ctx, px, py, rr, rgb, alpha, 0, 0.62);
    }

    ctx.restore();
  }

  function drawColonies(ctx, width, height, map, opts, mat, rng) {
    const area = width * height;
    const count = Math.round(clamp(area / 15000, 3, 80) * opts.density * (0.55 + opts.intensity));
    const maxR = Math.min(width, height) * lerp(0.035, 0.105, opts.intensity);
    const minR = Math.max(3, Math.min(width, height) * 0.012);

    for (let i = 0; i < count; i++) {
      const p = biasedPoint(map, rng, width, height, 'growth', 0.75, 80);
      if (p.v < 0.12) continue;
      const r = lerp(minR, maxR, Math.pow(rng(), 0.35)) * (0.75 + p.v * 0.85);
      drawColony(ctx, p.x, p.y, r, p.v, opts, mat, rng);
    }
  }

  function drawSpeckles(ctx, width, height, map, opts, mat, rng) {
    const area = width * height;
    const target = Math.round(clamp(area / 65, 80, 9000) * opts.density * (0.40 + opts.intensity));
    let drawn = 0;
    let guard = target * 18;

    ctx.save();
    ctx.globalAlpha = opts.opacity;

    while (drawn < target && guard-- > 0) {
      const x = rng() * width;
      const y = rng() * height;
      const v = map.sampleGrowth(x / width, y / height);
      if (rng() > Math.pow(v, lerp(1.85, 0.85, opts.coverage)) * 1.20) continue;

      const bigChance = rng();
      let r;
      if (bigChance > 0.985) r = lerp(3.4, 8.5, rng());
      else if (bigChance > 0.92) r = lerp(1.3, 3.2, rng());
      else r = lerp(0.28, 1.15, Math.pow(rng(), 1.7));

      const rgb = pickPalette(rng, mat.warmth, rng() < 0.82);
      const alpha = lerp(0.14, 0.70, rng()) * opts.intensity * (0.35 + v * 0.85);

      if (r < 0.75) {
        ctx.fillStyle = colorString(rgb, alpha);
        ctx.fillRect(x, y, Math.max(0.5, r), Math.max(0.5, r));
      } else if (r < 2.0) {
        ctx.fillStyle = colorString(rgb, alpha);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TWO_PI);
        ctx.fill();
      } else {
        drawRadial(ctx, x, y, r, rgb, alpha, 0.05, 0.50);
      }

      drawn++;
    }

    ctx.restore();
  }

  function pointOnEdge(edge, t, dist, width, height) {
    if (edge === 'top') return { x: t * width, y: dist };
    if (edge === 'bottom') return { x: t * width, y: height - dist };
    if (edge === 'left') return { x: dist, y: t * height };
    return { x: width - dist, y: t * height };
  }

  function drawEdgeGrime(ctx, width, height, map, opts, mat, rng, activeEdges) {
    if (!activeEdges.length || opts.edgeBias <= 0) return;

    ctx.save();
    ctx.globalAlpha = opts.opacity;
    ctx.filter = `blur(${0.45 + opts.edgeBias * 1.2}px)`;

    for (const edge of activeEdges) {
      const length = edge === 'top' || edge === 'bottom' ? width : height;
      const count = Math.round(clamp(length / 7, 12, 180) * opts.edgeBias * (0.40 + opts.intensity));

      for (let i = 0; i < count; i++) {
        const t = rng();
        const dist = Math.pow(rng(), 2.2) * lerp(4, 28, opts.coverage);
        const p = pointOnEdge(edge, t, dist, width, height);
        const v = map.sampleRaw(p.x / width, p.y / height);
        if (rng() > clamp(v * 1.7 + 0.12)) continue;

        const along = lerp(4, 34, rng()) * (edge === 'top' || edge === 'bottom' ? 1 : 0.65);
        const thick = lerp(2, 14, rng()) * (0.35 + v);
        const rgb = pickPalette(rng, mat.warmth, rng() < 0.55);
        const alpha = lerp(0.035, 0.20, rng()) * opts.intensity * opts.edgeBias;

        ctx.fillStyle = colorString(rgb, alpha);
        ctx.beginPath();
        if (edge === 'top' || edge === 'bottom') {
          ctx.ellipse(p.x, p.y, along, thick, 0, 0, TWO_PI);
        } else {
          ctx.ellipse(p.x, p.y, thick, along, 0, 0, TWO_PI);
        }
        ctx.fill();
      }

      // Noisy seam line, like the dark accumulation in the wall/ceiling reference.
      const segments = Math.round(clamp(length / 22, 8, 80));
      for (let s = 0; s < segments; s++) {
        const a = s / segments;
        const b = (s + 0.75 + rng() * 0.35) / segments;
        const alpha = (0.03 + rng() * 0.10) * opts.intensity * opts.edgeBias;
        ctx.strokeStyle = colorString(pickPalette(rng, mat.warmth, true), alpha);
        ctx.lineWidth = lerp(1, 5.5, rng()) * (0.6 + opts.intensity);
        ctx.beginPath();
        if (edge === 'top') { ctx.moveTo(a * width, 1); ctx.lineTo(b * width, 1 + rng() * 3); }
        if (edge === 'bottom') { ctx.moveTo(a * width, height - 1); ctx.lineTo(b * width, height - 1 - rng() * 3); }
        if (edge === 'left') { ctx.moveTo(1, a * height); ctx.lineTo(1 + rng() * 3, b * height); }
        if (edge === 'right') { ctx.moveTo(width - 1, a * height); ctx.lineTo(width - 1 - rng() * 3, b * height); }
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function renderMould(ctx, width, height, options) {
    const opts = { ...options, aspect: width / Math.max(1, height) };
    const mat = MATERIALS[opts.material] || MATERIALS['painted-plaster'];
    const seed = opts.seed || 'mould';
    const rng = makeRng(`${seed}:${width}x${height}:${opts.mode}:${opts.source}`);
    const noise = createNoise(`${seed}:noise:${opts.mode}:${opts.source}`);
    const src = parseSource(opts.source);
    const activeEdges = parseEdges(opts.edges, opts.mode, src);
    const map = buildGrowthMap(width, height, opts, src, activeEdges, noise, mat);

    ctx.clearRect(0, 0, width, height);

    drawStainLayer(ctx, width, height, map, opts, mat, rng);
    drawFuzzLayer(ctx, width, height, map, opts, mat, rng);
    drawEdgeGrime(ctx, width, height, map, opts, mat, rng, activeEdges);
    drawColonies(ctx, width, height, map, opts, mat, rng);
    drawSpeckles(ctx, width, height, map, opts, mat, rng);
  }

  function readNumber(value, fallback) {
    if (value == null || value === '') return fallback;
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function readOptionsFromDataset(el) {
    const d = el.dataset || {};
    const opts = {};
    if (d.mould && d.mould !== 'true' && d.mould !== '') opts.mode = d.mould;
    if (d.mouldMode) opts.mode = d.mouldMode;
    if (d.mouldSource) opts.source = d.mouldSource;
    if (d.mouldEdges) opts.edges = d.mouldEdges;
    if (d.mouldMaterial) opts.material = d.mouldMaterial;
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
    opts.maxDpr = clamp(Number(opts.maxDpr) || 2, 1, 4);
    opts.material = String(opts.material || DEFAULTS.material).toLowerCase();
    opts.source = String(opts.source || DEFAULTS.source).toLowerCase();
    return opts;
  }

  function ensureHostStyles(el) {
    const cs = getComputedStyle(el);
    if (cs.position === 'static') el.style.position = 'relative';
    if (cs.isolation !== 'isolate') el.style.isolation = 'isolate';
  }

  let uid = 0;

  class MouldContamination {
    constructor(element, options = {}) {
      injectMouldLayerStyles();
      this.el = typeof element === 'string' ? document.querySelector(element) : element;
      if (!this.el) throw new Error('MouldContamination: target element not found.');

      ensureHostStyles(this.el);
      this.options = normaliseOptions({ ...readOptionsFromDataset(this.el), ...options });
      if (!this.options.seed) {
        this.options.seed = this.el.id || this.el.getAttribute('aria-label') || this.el.className || `mould-${++uid}`;
      }

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'mould-contamination-canvas';
      Object.assign(this.canvas.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: String(this.options.zIndex),
        mixBlendMode: this.options.blendMode,
        opacity: String(this.options.opacity),
        contain: 'strict'
      });
      this.el.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this._raf = 0;
      this._lastSize = '';

      if (this.options.redrawOnResize && 'ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(() => this.scheduleRender());
        this.resizeObserver.observe(this.el);
      }

      if (this.options.autoRender) this.render();
    }

    setOptions(next = {}) {
      this.options = normaliseOptions({ ...this.options, ...next });
      this.canvas.style.mixBlendMode = this.options.blendMode;
      this.canvas.style.opacity = String(this.options.opacity);
      this.canvas.style.zIndex = String(this.options.zIndex);
      this.scheduleRender(true);
      return this;
    }

    scheduleRender(force = false) {
      if (force) this._lastSize = '';
      cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(() => this.render(force));
    }

    render(force = false) {
      const rect = this.el.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (width < 2 || height < 2) return this;

      const dpr = Math.min(window.devicePixelRatio || 1, this.options.maxDpr);
      const key = `${width}x${height}@${dpr}:${JSON.stringify(this.options)}`;
      if (!force && key === this._lastSize) return this;
      this._lastSize = key;

      this.canvas.width = Math.max(1, Math.round(width * dpr));
      this.canvas.height = Math.max(1, Math.round(height * dpr));
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;

      const cs = getComputedStyle(this.el);
      this.canvas.style.borderTopLeftRadius = cs.borderTopLeftRadius;
      this.canvas.style.borderTopRightRadius = cs.borderTopRightRadius;
      this.canvas.style.borderBottomRightRadius = cs.borderBottomRightRadius;
      this.canvas.style.borderBottomLeftRadius = cs.borderBottomLeftRadius;

      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderMould(this.ctx, width, height, this.options);
      return this;
    }

    destroy() {
      cancelAnimationFrame(this._raf);
      if (this.resizeObserver) this.resizeObserver.disconnect();
      this.canvas.remove();
    }

    toDataURL(type = 'image/png', quality) {
      return this.canvas.toDataURL(type, quality);
    }

    static mountAll(root = document, options = {}) {
      return Array.from(root.querySelectorAll('[data-mould]')).map(el => new MouldContamination(el, options));
    }
  }

  window.MouldContamination = MouldContamination;
  window.MouldEngine = MouldContamination;

  // Auto-mount declarative elements unless explicitly disabled.
  if (!window.MOULD_CONTAMINATION_NO_AUTO_MOUNT) {
    const mount = () => MouldContamination.mountAll(document);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
    else mount();
  }
})();
