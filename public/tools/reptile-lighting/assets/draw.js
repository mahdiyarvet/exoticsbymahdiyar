/* =========================================================
   رسم نقشهٔ مقطع محفظه، لامپ‌ها، سکو و جانور
   ========================================================= */

const Draw = (() => {
  const INK = '#3a372e';

  function hexToRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const bandRgb = {};
  for (const k in BANDS) bandRgb[k] = BANDS[k].colors.map(hexToRgb);

  function bandIndex(metric, v) {
    const s = BANDS[metric].stops;
    let i = 0;
    for (let k = 1; k < s.length; k++) if (v >= s[k]) i = k;
    return i;
  }

  /* Original vector artwork. All silhouettes stay within their physical width/height.
     Paths are cached once; fine detail is omitted at small on-chart sizes. */
  const SHAPES = {
    lizard: { H: 25, eye: [10, 45],
      body: 'M2 42 Q3 51 12 54 L20 42 Q25 38 30 40 C39 46 50 43 57 30 C74 12 91 13 98 47 C99 22 88 7 73 8 Q61 8 52 15 Q35 10 25 18 L17 29 Q6 29 2 42 Z',
      legs: ['M28 27 Q24 24 23 15 L17 5 L9 3 Q8 1 12 1 L22 2 L32 14 L36 26 Z','M48 26 Q61 30 63 19 L58 6 L48 2 L43 2 Q42 5 48 6 L53 11 L50 18 L44 20 Z'],
      lines: ['M3 39 Q10 35 16 38','M17 30 Q18 36 20 40','M28 23 Q38 17 47 20'],
    },
    gecko: { H: 20, eye: [11, 43],
      body: 'M2 35 Q1 48 11 53 Q19 55 24 43 C35 50 46 47 55 35 C67 48 80 32 98 18 C84 17 75 9 65 13 Q59 15 53 20 Q37 13 25 22 Q18 24 13 25 Q4 25 2 35 Z',
      legs: ['M29 29 Q23 23 24 15 L19 6 L10 3 L12 1 L23 2 Q29 7 32 17 L36 27 Z','M47 28 Q59 32 61 22 L57 12 L65 4 L62 1 L51 7 Q45 13 47 19 L42 21 Z'],
      lines: ['M3 32 Q10 29 17 32','M26 24 Q36 20 44 24','M66 18 Q77 20 87 20'],
    },
    chameleon: { H: 43, eye: [12, 37],
      body: 'M2 30 L7 42 L20 59 L24 46 C36 57 54 52 63 34 Q67 22 75 21 C87 21 97 22 97 12 C98 1 83 0 80 9 C78 16 89 20 91 12 Q91 9 87 9 Q89 14 85 12 C82 7 91 5 93 11 C96 20 81 16 75 16 Q64 16 59 19 Q40 12 25 20 L18 24 Q8 23 2 30 Z',
      legs: ['M31 25 L25 14 L29 5 L25 1 L20 2 L22 6 L20 16 L24 29 Z','M52 25 L61 16 L56 6 L59 3 L56 1 L51 4 L53 15 L46 24 Z'],
      lines: ['M3 29 Q10 27 19 30','M23 39 Q39 49 56 35','M26 31 Q42 39 57 29'],
    },
    snake: { H: 23, eye: [9, 48],
      body: 'M1 44 Q2 56 14 57 Q23 57 25 45 C26 32 31 22 40 22 C51 22 56 40 70 39 C82 39 85 21 99 13 C89 11 81 17 75 23 C67 32 57 12 43 9 C30 5 20 15 18 28 L16 35 Q7 34 1 44 Z',
      lines: ['M2 43 Q10 39 18 43','M21 37 C22 20 35 11 45 17 C58 25 62 36 74 31','M25 21 L29 23 M30 16 L33 19 M37 14 L38 18 M44 16 L43 20 M51 22 L49 25 M57 28 L55 30'],
    },
    tortoise: { H: 40, eye: [8, 27],
      body: 'M20 17 C21 43 35 58 54 59 C74 60 88 42 90 18 Q77 11 56 12 Q35 10 20 17 Z',
      head: 'M24 23 L16 25 Q15 34 8 34 Q1 34 1 25 Q2 18 10 18 L23 15 Z',
      legs: ['M30 19 Q34 12 30 4 L23 1 L17 2 Q16 5 20 8 L22 20 Z','M73 20 Q83 18 83 9 L87 3 Q84 0 73 1 L68 4 L70 17 Z'],
      lines: ['M23 21 Q52 16 86 21','M25 29 Q54 22 85 29','M32 45 L44 40 L59 42 L68 51','M44 40 L42 28 M59 42 L64 27','M32 45 L32 29 M68 51 L77 39 L78 27','M44 40 L45 56 M59 42 L59 58'],
    },
    frog: { H: 47, eye: [22, 49],
      body: 'M5 28 Q7 42 17 45 Q14 58 24 59 Q34 60 37 49 C50 51 72 44 78 26 Q82 12 67 8 L30 9 Q10 11 5 28 Z',
      legs: ['M55 27 C61 44 82 43 88 27 Q92 16 79 11 L96 4 Q98 1 92 1 L69 3 Q59 6 57 15 L72 23 Q65 31 55 27 Z','M27 25 L31 11 L25 3 L13 1 L9 3 L19 6 L20 23 Z'],
      lines: ['M6 27 Q17 21 32 26','M36 41 Q48 38 53 29','M67 12 Q78 16 80 25'],
    },
  };
  for (const shape of Object.values(SHAPES)) {
    shape.bodyPath = new Path2D(shape.body);
    shape.legPaths = (shape.legs || []).map(d => new Path2D(d));
    shape.detailPaths = shape.lines.map(d => new Path2D(d));
    if (shape.head) shape.headPath = new Path2D(shape.head);
  }

  function drawAnimal(ctx, shapeId, x0, yBottom, w, h, opts = {}) {
    if (!(w > 0 && h > 0)) return;
    const id = SHAPES[shapeId] ? shapeId : 'lizard';
    const S = SHAPES[id], sx = w / 100, sy = h / 60;
    const ink = opts.ink || INK, fill = opts.fill || '#dce9c0';
    const detail = w >= 95 && h >= 20;
    ctx.save(); ctx.translate(x0, yBottom);
    if (opts.flip) { ctx.translate(w, 0); ctx.scale(-1, 1); }
    ctx.scale(sx, -sy); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // Bound stroke thickness so a tiny animal remains a silhouette, not a dark blob.
    const lw = Math.min(opts.lw || 1.3, Math.max(.55, h / 22)) / Math.max(sx, sy);
    ctx.lineWidth = lw; ctx.strokeStyle = ink;
    const grad = ctx.createLinearGradient(0, 5, 0, 60);
    grad.addColorStop(0, fill); grad.addColorStop(.65, fill); grad.addColorStop(1, '#fffdf0');
    function paint(path) { ctx.fillStyle = grad; ctx.fill(path); ctx.strokeStyle = ink; ctx.lineWidth = lw; ctx.stroke(path); }
    function ellipse(x, y, rx, ry, color) {
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    }
    // Far limbs have a soft shadow; foreground limbs receive their own contours.
    if (S.legPaths.length) {
      ctx.save(); ctx.translate(4, 1); ctx.globalAlpha = .38;
      for (const leg of S.legPaths) paint(leg);
      ctx.restore();
    }
    if (S.headPath) {
      paint(S.headPath);
      const tail = new Path2D('M87 20 Q94 17 98 11 L87 14 Z'); paint(tail);
    }
    paint(S.bodyPath);
    // Natural markings are clipped to the silhouette and scale with it.
    ctx.save(); ctx.clip(S.bodyPath); ctx.fillStyle = ink; ctx.strokeStyle = ink;
    if (id === 'gecko' || id === 'lizard' || id === 'frog') {
      ctx.globalAlpha = id === 'gecko' ? .42 : .18;
      const count = detail ? 25 : 9;
      for (let i = 0; i < count; i++) {
        const x = 27 + (i * 13 % 48), y = 20 + (i * 7 % 24);
        ellipse(x, y, id === 'gecko' ? 1.5 : .85, id === 'gecko' ? 2 : 1.1, ink);
      }
    } else if (id === 'snake') {
      ctx.globalAlpha = .28;
      for (let i = 0; i < 7; i++) {
        ctx.save(); ctx.translate(23 + i * 9, 23 + Math.sin(i * 1.6) * 10); ctx.rotate(-.45);
        ellipse(0, 0, 3.3, 10, ink); ellipse(-.7, 1, 1.4, 5.5, fill); ctx.restore();
      }
    } else if (id === 'chameleon') {
      ctx.globalAlpha = .2;
      for (let i = 0; i < 4; i++) {
        const x = 28 + i * 8;
        ctx.beginPath(); ctx.moveTo(x, 19); ctx.lineTo(x + 3, 46); ctx.lineWidth = 2.5; ctx.stroke();
      }
    } else if (id === 'tortoise') {
      ctx.globalAlpha = .12;
      ellipse(55, 28, 29, 12, ink);
      ctx.globalAlpha = .4; ellipse(46, 48, 12, 5, '#ffffff');
    }
    ctx.restore();
    for (const leg of S.legPaths) paint(leg);
    ctx.strokeStyle = ink; ctx.lineWidth = lw * .65;
    S.detailPaths.forEach((path, i) => { if (detail || i === 0 || id === 'tortoise') ctx.stroke(path); });
    if (detail && id === 'tortoise') {
      ctx.globalAlpha = .35;
      for (let x = 28; x < 84; x += 7) {
        ctx.beginPath(); ctx.moveTo(x, 16); ctx.lineTo(x + 1, 22); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      for (const x of [20, 24, 28, 75, 79, 83]) { ctx.beginPath(); ctx.moveTo(x, 2); ctx.lineTo(x - .5, 5); ctx.stroke(); }
    }
    if (detail && id === 'lizard') {
      ctx.beginPath();
      for (let x = 8; x < 18; x += 2) { ctx.moveTo(x, 30); ctx.lineTo(x + 1, 26); }
      for (let x = 29; x < 50; x += 3) { ctx.moveTo(x, 39); ctx.lineTo(x + 1, 43); }
      ctx.stroke();
    }
    if (id === 'chameleon') {
      ellipse(12, 37, 5.5, 8, fill);
      ctx.beginPath(); ctx.ellipse(12, 37, 5.5, 8, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // Eye shapes are species-specific, with a restrained catchlight.
    const [ex, ey] = S.eye;
    const er = id === 'frog' ? 4 : id === 'gecko' ? 2.8 : id === 'chameleon' ? 2 : 1.5;
    ellipse(ex, ey, er + .8, (er + .8) * sx / sy, '#fff6db');
    ellipse(ex, ey, er, er * sx / sy, ink);
    if (detail) ellipse(ex - er * .3, ey + er * sx / sy * .35, er * .3, er * .3 * sx / sy, '#ffffff');
    ctx.restore();
  }

  // Visual status only: use the same current readings and target comparisons as the UI.
  const MOODS = {
    lo: { fill: '#dceff9', ink: '#285b79' },
    hi: { fill: '#ffe0bd', ink: '#8f421e' },
    ok: { fill: '#e1efcc', ink: '#365b32' },
  };
  function drawMood(ctx, x, y, status) {
    const c = MOODS[status];
    ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = c.ink; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    if (status === 'ok') {
      ctx.moveTo(-5, 0); ctx.lineTo(-1, 4); ctx.lineTo(6, -4);
    } else if (status === 'lo') {
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3, co = Math.cos(a), si = Math.sin(a);
        ctx.moveTo(0, 0); ctx.lineTo(co * 7, si * 7);
        ctx.moveTo(co * 4 - si * 2, si * 4 + co * 2); ctx.lineTo(co * 3, si * 3); ctx.lineTo(co * 4 + si * 2, si * 4 - co * 2);
      }
    } else {
      for (const dx of [-5, 0, 5]) {
        ctx.moveTo(dx, 6); ctx.bezierCurveTo(dx - 4, 2, dx + 4, -2, dx, -6);
      }
    }
    ctx.stroke(); ctx.restore();
  }

  /* ---------------- رسم لامپ‌ها ---------------- */
  function drawLamp(ctx, src, X, Y, s, label, active) {
    const L = src.lamp;
    const role = L.role;
    const glow = role === 'uvb' ? '#b69cff' : role === 'led' ? '#bcd6ff' : '#ffd07a';
    const shell = '#2f4d48';
    ctx.save();
    if (L.kind === 'tube') {
      const x0 = X(src.x - L.len / 2), x1 = X(src.x + L.len / 2);
      const yc = Y(src.y);
      const th = Math.min(11, Math.max(6, 1.6 * s));
      ctx.fillStyle = shell;
      roundRect(ctx, x0 - 4, yc - th - 4, x1 - x0 + 8, th + 4, 4); ctx.fill();
      const g = ctx.createLinearGradient(0, yc - th / 2, 0, yc + th / 2);
      g.addColorStop(0, '#ffffff'); g.addColorStop(1, glow);
      ctx.fillStyle = g;
      roundRect(ctx, x0, yc - th / 2, x1 - x0, th, th / 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.stroke();
      if (active) { ctx.strokeStyle = role === 'uvb' ? '#7b5cc9' : '#3a78d6'; ctx.lineWidth = 2; roundRect(ctx, x0 - 6, yc - th - 6, x1 - x0 + 12, th * 1.5 + 10, 6); ctx.stroke(); }
    } else {
      const xc = X(src.x), yc = Y(src.y);
      const r = Math.min(20, Math.max(9, 3.2 * s));
      // کاسهٔ سرپیچ
      ctx.fillStyle = shell;
      ctx.beginPath(); ctx.moveTo(xc - r * 1.05, yc); ctx.quadraticCurveTo(xc - r, yc - r * 1.3, xc, yc - r * 1.35); ctx.quadraticCurveTo(xc + r, yc - r * 1.3, xc + r * 1.05, yc); ctx.closePath(); ctx.fill();
      ctx.fillRect(xc - 3, yc - r * 1.35 - 6, 6, 6);
      // حباب
      const g = ctx.createRadialGradient(xc, yc - r * 0.2, 1, xc, yc - r * 0.2, r);
      g.addColorStop(0, '#fffdf3'); g.addColorStop(0.55, glow); g.addColorStop(1, role === 'heat' ? (L.lux30 ? '#e98a2e' : '#9b4a3a') : glow);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(xc, yc - r * 0.15, r * 0.82, r * 0.72, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.stroke();
      if (active) { ctx.strokeStyle = role === 'uvb' ? '#7b5cc9' : role === 'led' ? '#3a78d6' : '#e0742a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(xc, yc - r * 0.5, r * 1.35, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  /* ---------------- رسم صحنهٔ اصلی ---------------- */
  function scene(canvas, st, view, fmt) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth || 700;
    const W = st.encl.W, H = st.encl.H;
    const floor = H - st.encl.sub;
    const padL = 48, padR = 16, padB = 42;
    const srcs = Sim.sources(st);
    // فضای بالا برای لامپ‌های روی توری
    const plotW = cssW - padL - padR;
    let s = plotW / W;
    const maxPlotH = Math.min(520, Math.max(260, window.innerHeight * 0.55));
    if (H * s > maxPlotH) s = maxPlotH / H;
    const lampTop = srcs.reduce((m, q) => Math.max(m, -q.y), 0);
    const padT = Math.max(40, lampTop * s + Math.min(20, Math.max(9, 3.2 * s)) * 1.5 + 26);
    const pw = W * s, ph = H * s;
    const offX = padL + (plotW - pw) / 2;
    const cssH = Math.round(padT + ph + padB);
    canvas.style.height = cssH + 'px';
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    const X = x => offX + x * s, Y = y => padT + y * s;
    const geo = { X, Y, s, padT, offX, pw, ph, cssW, cssH, invX: px => (px - offX) / s, invY: py => (py - padT) / s };

    const metric = view.tab === 'combined' ? 'heat' : view.tab;
    const g = view.grids[metric];
    const gU = view.tab === 'combined' ? view.grids.uvb : null;
    const target = view.targets[metric];

    // ---- نقشهٔ رنگی با دقت پیکسلی ----
    const x0p = Math.round(X(0) * dpr), y0p = Math.round(Y(0) * dpr);
    const wp = Math.round(pw * dpr), hp = Math.round(Math.min(floor, H) * s * dpr);
    if (wp > 0 && hp > 0) {
      const img = ctx.createImageData(wp, hp);
      const d = img.data;
      const cols = bandRgb[metric];
      const colsU = bandRgb.uvb;
      const idxRow = new Int16Array(wp), idxRowU = new Int16Array(wp);
      const alpha = view.tab === 'combined' ? 0.75 : 1;
      for (let j = 0; j < hp; j++) {
        const ycm = (j + 0.5) / dpr / s;
        let prevI = -1, prevU = -1;
        for (let i = 0; i < wp; i++) {
          const xcm = (i + 0.5) / dpr / s;
          const v = Sim.sample(g, xcm, ycm);
          const bi = bandIndex(metric, v);
          let c = cols[bi];
          let r = c[0], gg = c[1], b = c[2];
          if (alpha < 1) { r = 255 - (255 - r) * alpha; gg = 255 - (255 - gg) * alpha; b = 255 - (255 - b) * alpha; }
          let edge = view.contours && ((prevI >= 0 && prevI !== bi) || (j > 0 && idxRow[i] !== bi));
          let edgeU = false;
          if (gU) {
            const u = Sim.sample(gU, xcm, ycm);
            const ui = bandIndex('uvb', u);
            edgeU = (prevU >= 0 && prevU !== ui) || (j > 0 && idxRowU[i] !== ui);
            idxRowU[i] = ui; prevU = ui;
          }
          if (view.assist && target && v >= target[0] && v <= target[1]) {
            if (((i + j) % Math.round(9 * dpr)) < 1.4 * dpr) { r *= .72; gg *= .72; b *= .72; }
          }
          if (edge) { r *= .78; gg *= .78; b *= .78; }
          if (edgeU) { r = r * .35 + 123 * .65; gg = gg * .35 + 92 * .65; b = b * .35 + 201 * .65; }
          idxRow[i] = bi; prevI = bi;
          const k = (j * wp + i) * 4;
          d[k] = r; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = 255;
        }
      }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.putImageData(img, x0p, y0p);
      ctx.restore();
    }

    // ---- خطوط شبکه و محورها ----
    ctx.save();
    ctx.font = '11px Vazirmatn, Tahoma, sans-serif';
    ctx.fillStyle = '#6d6857'; ctx.strokeStyle = 'rgba(58,55,46,.08)'; ctx.lineWidth = 1;
    const stepX = niceStep(W, pw / 60), stepY = niceStep(H, ph / 28);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let x = 0; x <= W + 0.01; x += stepX) {
      ctx.beginPath(); ctx.moveTo(X(x), Y(0)); ctx.lineTo(X(x), Y(floor)); ctx.stroke();
      ctx.fillText(fmt.dist(x, 0), X(x), Y(H) + 5);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let y = 0; y <= H + 0.01; y += stepY) {
      if (y < floor) { ctx.beginPath(); ctx.moveTo(X(0), Y(y)); ctx.lineTo(X(W), Y(y)); ctx.stroke(); }
      ctx.fillText(fmt.dist(y, 0), X(0) - 6, Y(y));
    }
    ctx.textAlign = 'center';
    ctx.font = '600 11px Vazirmatn, Tahoma, sans-serif'; ctx.fillStyle = '#4b473b';
    ctx.fillText('فاصلهٔ افقی در طول محفظه (' + fmt.unit + ')', X(W / 2), Y(H) + 24);
    ctx.save(); ctx.translate(13, Y(H / 2)); ctx.rotate(-Math.PI / 2); ctx.fillText('فاصله زیر سقف (' + fmt.unit + ')', 0, 0); ctx.restore();
    ctx.restore();

    // ---- بستر ----
    if (st.encl.sub > 0) {
      const gy = ctx.createLinearGradient(0, Y(floor), 0, Y(H));
      gy.addColorStop(0, '#d9c49a'); gy.addColorStop(1, '#bfa476');
      ctx.fillStyle = gy; ctx.fillRect(X(0), Y(floor), pw, Y(H) - Y(floor));
      ctx.fillStyle = 'rgba(120,95,55,.35)';
      for (let i = 0; i < pw / 6; i++) {
        const px = X(0) + ((i * 37.7) % pw), py = Y(floor) + 3 + ((i * 13.3) % Math.max(1, Y(H) - Y(floor) - 5));
        ctx.fillRect(px, py, 1.6, 1.6);
      }
    }

    // ---- سکو (سنگ آفتاب‌گیری) ----
    const span = Sim.animalSpan(st);
    const pX = st.platform.x, pD = st.platform.depth;
    const platW = Math.min(W, span * 1.15 + 4);
    const px0 = X(Math.max(0, pX - platW / 2)), px1 = X(Math.min(W, pX + platW / 2));
    ctx.save();
    const rockG = ctx.createLinearGradient(0, Y(pD), 0, Y(floor));
    rockG.addColorStop(0, 'rgba(206,196,176,.92)'); rockG.addColorStop(1, 'rgba(150,138,116,.92)');
    ctx.fillStyle = rockG; ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    ctx.beginPath();
    const topY = Y(pD), botY = Y(floor);
    const shrink = Math.min((px1 - px0) * 0.12, 18);
    ctx.moveTo(px0 + shrink, botY);
    ctx.lineTo(px0 + 3, topY + Math.min(10, (botY - topY) * 0.25));
    ctx.quadraticCurveTo(px0, topY, px0 + 8, topY);
    ctx.lineTo(px1 - 8, topY);
    ctx.quadraticCurveTo(px1, topY, px1 - 3, topY + Math.min(10, (botY - topY) * 0.25));
    ctx.lineTo(px1 - shrink, botY);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // لایه‌های سنگ
    ctx.strokeStyle = 'rgba(58,55,46,.25)'; ctx.lineWidth = 1;
    for (let yy = topY + 12; yy < botY - 4; yy += 14) {
      ctx.beginPath(); ctx.moveTo(px0 + shrink + 6, yy); ctx.quadraticCurveTo((px0 + px1) / 2, yy + 4, px1 - shrink - 6, yy - 2); ctx.stroke();
    }
    if (botY - topY > 18) {
      ctx.fillStyle = '#4b473b'; ctx.font = 'italic 600 11px Vazirmatn, Tahoma, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('سنگ آفتاب‌گیری', (px0 + px1) / 2, Math.min(topY + 14, (topY + botY) / 2));
    }
    ctx.restore();

    // ---- جانور ----
    const aw = span * s, ah = st.animal.back * s;
    const heat = Sim.atAnimal(st, 'heat'), heatTarget = view.targets.heat;
    const mood = heat < heatTarget[0] ? 'lo' : heat > heatTarget[1] ? 'hi' : 'ok';
    drawAnimal(ctx, st.animal.shape, X(pX) - aw / 2, Y(pD), aw, ah, { lw: 1.25, ...MOODS[mood] });
    // Small plots keep feedback in the adjacent HTML strip, leaving the animal unobscured.
    if (pw >= 360 && Y(pD) - ah - Y(0) >= 30) {
      drawMood(ctx, Math.max(X(0) + 14, Math.min(X(W) - 14, X(pX) + aw / 2 + 17)), Y(pD) - ah - 16, mood);
    }

    // ---- خط ارتفاع پشت ----
    const by = Y(Sim.backDepth(st));
    ctx.save();
    ctx.strokeStyle = '#2d5fa8'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(X(0), by); ctx.lineTo(X(W), by); ctx.stroke();
    ctx.fillStyle = '#2d5fa8'; ctx.font = '700 10.5px Vazirmatn, Tahoma, sans-serif'; ctx.textBaseline = 'bottom';
    ctx.textAlign = pX > W / 2 ? 'left' : 'right';
    ctx.fillText('ارتفاع پشت جانور ↕ بکشید', pX > W / 2 ? X(0) + 6 : X(W) - 6, by - 3);
    ctx.restore();

    // ---- قاب محفظه ----
    ctx.save();
    ctx.strokeStyle = '#2a2822'; ctx.lineWidth = 2.5;
    ctx.strokeRect(X(0), Y(0), pw, ph);
    if (st.encl.mesh > 0) {
      ctx.strokeStyle = '#6d6857'; ctx.lineWidth = 3; ctx.setLineDash([3, 2]);
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(W), Y(0)); ctx.stroke();
    }
    ctx.restore();

    // ---- لامپ‌ها ----
    geo.lampHits = [];
    const labels = view.labels;
    srcs.forEach((src, i) => {
      const lab = labels[i];
      const active = view.hoverLamp === lab.key || view.dragLamp === lab.key;
      drawLamp(ctx, src, X, Y, s, lab.text, active);
      const L = src.lamp;
      const rr = Math.min(20, Math.max(9, 3.2 * s));
      const halfW = L.kind === 'tube' ? L.len / 2 * s : rr * 1.1;
      geo.lampHits.push({ key: lab.key, x: X(src.x), y: Y(src.y), halfW, top: Y(src.y) - rr * 1.6 - 6, bot: Y(src.y) + 8 });
      ctx.save();
      ctx.font = '800 10px Vazirmatn, Tahoma, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = src.lamp.role === 'uvb' ? '#5f45ad' : src.lamp.role === 'led' ? '#2a5fb0' : '#b3551a';
      const ty = L.kind === 'tube' ? Y(src.y) - Math.min(11, Math.max(6, 1.6 * s)) - 7 : Y(src.y) - rr * 1.35 - 9;
      if (L.kind === 'tube') { ctx.textAlign = 'left'; ctx.fillText(lab.text, X(src.x - L.len / 2) + 2, Math.max(10, ty)); }
      else ctx.fillText(lab.text, X(src.x), Math.max(10, ty));
      ctx.restore();
    });

    geo.platform = { x0: px0, x1: px1, top: Y(pD), back: by, bot: botY };
    return geo;
  }

  function niceStep(range, maxTicks) {
    const raw = range / Math.max(2, maxTicks);
    const opts = [5, 10, 20, 25, 50, 100];
    for (const o of opts) if (o >= raw) return o;
    return 100;
  }

  /* ---------------- نمودار پخش افقی ---------------- */
  function spread(canvas, st, view, fmt) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight;
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    const metric = view.tab === 'combined' ? 'uvb' : view.tab;
    const g = view.grids[metric];
    const W = st.encl.W;
    const y = Sim.backDepth(st);
    const padL = 48, padR = 16, padT = 20, padB = 22;
    const vals = [];
    for (let x = 0; x <= W; x += W / 200) vals.push([x, Sim.sample(g, x, y)]);
    const tgt = view.targets[metric];
    let vmax = Math.max(tgt[1] * 1.3, ...vals.map(v => v[1])) * 1.05 || 1;
    const X = x => padL + x / W * (cssW - padL - padR);
    const Yv = v => cssH - padB - v / vmax * (cssH - padT - padB);
    // بازهٔ هدف
    ctx.fillStyle = 'rgba(44,138,75,.12)';
    ctx.fillRect(X(0), Yv(tgt[1]), X(W) - X(0), Yv(tgt[0]) - Yv(tgt[1]));
    ctx.strokeStyle = 'rgba(44,138,75,.5)'; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(X(0), Yv(tgt[0])); ctx.lineTo(X(W), Yv(tgt[0])); ctx.moveTo(X(0), Yv(tgt[1])); ctx.lineTo(X(W), Yv(tgt[1])); ctx.stroke();
    ctx.setLineDash([]);
    // محدودهٔ سکو
    const span = Sim.animalSpan(st);
    ctx.fillStyle = 'rgba(45,95,168,.08)';
    ctx.fillRect(X(st.platform.x - span / 2), padT, (span / W) * (cssW - padL - padR), cssH - padT - padB);
    // منحنی
    const col = metric === 'uvb' ? '#7b5cc9' : metric === 'heat' ? '#e0742a' : '#3a78d6';
    const grad = ctx.createLinearGradient(0, padT, 0, cssH - padB);
    grad.addColorStop(0, col + '55'); grad.addColorStop(1, col + '05');
    ctx.beginPath(); ctx.moveTo(X(0), Yv(0));
    vals.forEach(([x, v]) => ctx.lineTo(X(x), Yv(v)));
    ctx.lineTo(X(W), Yv(0)); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); vals.forEach(([x, v], i) => i ? ctx.lineTo(X(x), Yv(v)) : ctx.moveTo(X(x), Yv(v)));
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
    // برچسب‌ها
    ctx.font = '11px Vazirmatn, Tahoma, sans-serif'; ctx.fillStyle = '#6d6857';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    [0, vmax / 2, vmax].forEach(v => ctx.fillText(fmt.metric(metric, v, true), padL - 6, Yv(v)));
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('پخش ' + BANDS[metric].label + ' در ارتفاع پشت جانور — ناحیهٔ سبز: هدف', cssW / 2, 2);
    ctx.strokeStyle = '#cfc7b3'; ctx.beginPath(); ctx.moveTo(X(0), Yv(0)); ctx.lineTo(X(W), Yv(0)); ctx.stroke();
  }

  /* پیش‌نمایش جانور در مودال */
  function preview(canvas, sp) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = 280, h = 100;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const baseY = 78;
    ctx.fillStyle = '#e9e1cd'; ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    roundRect(ctx, 40, baseY, 200, 12, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6d6857'; ctx.font = 'italic 600 10px Vazirmatn, Tahoma'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('سنگ آفتاب‌گیری', 140, baseY + 6.5);
    const S = SHAPES[sp.shape] || SHAPES.lizard;
    let aw = 170, ah = aw * S.H / 100 * (sp.shape === 'frog' ? 0.9 : sp.shape === 'tortoise' ? 1.3 : 1.25);
    if (ah > 64) { aw *= 64 / ah; ah = 64; }
    const colors = {
      lizard: '#d4ae78', gecko: '#e9cf93', chameleon: '#9acb87',
      snake: '#d0b893', tortoise: '#b9b078', frog: '#97c988',
    };
    drawAnimal(ctx, sp.shape, 140 - aw / 2, baseY, aw, ah, { lw: 1.4, fill: colors[sp.shape] || colors.lizard });
  }

  return { scene, spread, preview, drawAnimal, bandIndex };
})();
