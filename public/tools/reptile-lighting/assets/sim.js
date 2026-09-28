/* =========================================================
   موتور شبیه‌سازی نور
   مختصات: x = فاصلهٔ افقی در عرض محفظه (cm)
           y = فاصله زیر سقف/توری (cm) ؛ لامپ‌های روی توری y منفی دارند
   ========================================================= */

const Sim = (() => {
  const SEGMENTS = 28;
  const calCache = new Map();

  /* فاصلهٔ سطح تابش لامپ از سطح توری */
  function lampY(lamp, inside) {
    if (lamp.kind === 'tube') return inside ? 3 : -4;
    return inside ? 9 : -9;
  }

  /* مجموع هندسی منبع خطی با ضریب یک — برای کالیبراسیون */
  function tubeRaw(len, n, dx, dy) {
    if (dy <= 0.5) dy = 0.5;
    const seg = len / SEGMENTS;
    let s = 0;
    for (let i = 0; i < SEGMENTS; i++) {
      const sx = -len / 2 + seg * (i + 0.5);
      const ddx = dx - sx;
      const r2 = ddx * ddx + dy * dy;
      const cos = dy / Math.sqrt(r2);
      s += Math.pow(cos, n + 1) / r2;
    }
    return s * seg;
  }

  function spotRaw(beam, dx, dy) {
    if (dy <= 0.5) dy = 0.5;
    const r2 = dx * dx + dy * dy;
    const r = Math.sqrt(r2);
    const theta = Math.acos(dy / r) * 180 / Math.PI;
    const b = beam || 30;
    const I = 0.93 * Math.exp(-Math.LN2 * (theta / b) * (theta / b)) + 0.07 * Math.cos(theta * Math.PI / 180);
    return I * (dy / r) / r2;
  }

  /* ضریب کالیبراسیون: مقدار واقعی در ۳۰cm زیر مرکز = مقدار ثبت‌شده */
  function calib(lamp) {
    if (calCache.has(lamp.id)) return calCache.get(lamp.id);
    const raw = lamp.kind === 'tube' ? tubeRaw(lamp.len, lamp.n || 2, 0, 30) : spotRaw(lamp.beam, 0, 30);
    const k = 1 / raw;
    calCache.set(lamp.id, k);
    return k;
  }

  /* ساخت لیست منابع فعال از وضعیت برنامه */
  function sources(state) {
    const list = [];
    const meshF = 1 - (state.encl.mesh || 0) / 100;
    const add = (slot, forcedInside) => {
      if (!slot || !slot.lampId || slot.on === false) return;
      const lamp = LAMPS.find(l => l.id === slot.lampId);
      if (!lamp) return;
      let inside;
      if (state.mount === 'inside') inside = true;
      else if (state.mount === 'above') inside = false;
      else inside = !!slot.inside;
      if (forcedInside !== undefined) inside = forcedInside;
      list.push({
        lamp, x: slot.x, y: lampY(lamp, inside), inside,
        k: calib(lamp),
        f: inside ? 1 : meshF,
        dim: slot.dim != null ? slot.dim / 100 : 1,
      });
    };
    add(state.uvb);
    state.basking.forEach(s => add(s));
    state.led.forEach(s => add(s));
    return list;
  }

  /* مقدار یک متریک در نقطهٔ (x,y) */
  function valueAt(srcs, metric, x, y) {
    const key = metric === 'uvb' ? 'uvi30' : metric === 'heat' ? 'heat30' : 'lux30';
    let v = 0;
    for (const s of srcs) {
      const base = s.lamp[key];
      if (!base) continue;
      const dy = y - s.y;
      if (dy <= 0) continue;
      const g = s.lamp.kind === 'tube'
        ? tubeRaw(s.lamp.len, s.lamp.n || 2, x - s.x, dy)
        : spotRaw(s.lamp.beam, x - s.x, dy);
      // دیمر روی گرما اثر کامل دارد و روی UV (برای MVB) نه
      const dim = metric === 'uvb' ? 1 : s.dim;
      v += base * s.k * g * s.f * dim;
    }
    return v;
  }

  /* شبکهٔ مقادیر با گام step سانتی‌متر */
  function grid(state, metric, step = 1) {
    const srcs = sources(state);
    const W = state.encl.W, H = state.encl.H;
    const nx = Math.ceil(W / step) + 1, ny = Math.ceil(H / step) + 1;
    const data = new Float32Array(nx * ny);
    for (let j = 0; j < ny; j++) {
      const y = Math.min(j * step, H);
      for (let i = 0; i < nx; i++) {
        const x = Math.min(i * step, W);
        data[j * nx + i] = valueAt(srcs, metric, x, Math.max(y, 0.3));
      }
    }
    return { nx, ny, step, data, W, H };
  }

  /* خواندن مقدار از شبکه با درون‌یابی دوخطی */
  function sample(g, x, y) {
    const fx = Math.max(0, Math.min(g.nx - 1.001, x / g.step));
    const fy = Math.max(0, Math.min(g.ny - 1.001, y / g.step));
    const i = Math.floor(fx), j = Math.floor(fy);
    const tx = fx - i, ty = fy - j;
    const d = g.data, nx = g.nx;
    const a = d[j * nx + i], b = d[j * nx + i + 1];
    const c = d[(j + 1) * nx + i], e = d[(j + 1) * nx + i + 1];
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + e * tx) * ty;
  }

  /* بیشترین مقدار روی پشت جانور */
  function atAnimal(state, metric) {
    const srcs = sources(state);
    const sp = state.animal;
    const half = Math.min(animalSpan(state) / 2, state.encl.W / 2);
    const y = backDepth(state);
    let best = 0;
    for (let t = -1; t <= 1.0001; t += 0.1) {
      const x = state.platform.x + t * half * 0.8;
      best = Math.max(best, valueAt(srcs, metric, x, y));
    }
    return best;
  }

  function animalSpan(state) {
    const sp = state.animal;
    // مارها چنبره می‌زنند؛ طول دیده‌شده کمتر از طول کل است
    if (sp.shape === 'snake') return Math.min(sp.len * 0.35, 60);
    if (sp.shape === 'chameleon') return sp.len * 0.7;
    return sp.len * 0.85;
  }

  function backDepth(state) {
    return Math.max(0.5, state.platform.depth - state.animal.back);
  }

  /* بازهٔ عمقی (از سقف) که پشت جانور در آن به هدف می‌رسد */
  function targetDepth(state, metric, range) {
    const srcs = sources(state);
    const floor = state.encl.H - state.encl.sub;
    let lo = null, hi = null;
    const back = state.animal.back;
    for (let d = 1; d <= floor; d += 0.25) {
      const y = d - back;
      if (y < 0.5) continue;
      const half = Math.min(animalSpan(state) / 2, state.encl.W / 2) * 0.8;
      let v = 0;
      for (let t = -1; t <= 1.0001; t += 0.2) v = Math.max(v, valueAt(srcs, metric, state.platform.x + t * half, y));
      if (v >= range[0] && v <= range[1]) {
        if (lo === null) lo = d;
        hi = d;
      }
    }
    return lo === null ? null : [lo, hi];
  }

  return { sources, valueAt, grid, sample, atAnimal, targetDepth, backDepth, animalSpan, lampY, calib };
})();
