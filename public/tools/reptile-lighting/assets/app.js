/* =========================================================
   خزنده‌نور — کنترلر رابط کاربری
   ========================================================= */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lampById = id => LAMPS.find(l => l.id === id);
  const spById = id => SPECIES.find(s => s.id === id) || SPECIES[0];

  /* ---------------- وضعیت ---------------- */
  function defaultState(speciesId = 'bearded') {
    const sp = spById(speciesId);
    return {
      v: 1, speciesId: sp.id, name: '',
      encl: { W: sp.encl[0], D: sp.encl[1], H: sp.encl[2], sub: 5, mesh: 35, brand: 'zoomed' },
      mount: 'above',
      uvb: { lampId: 'lh-t5-10', x: 30, inside: false },
      basking: [{ lampId: 'hal-75', x: 22, on: true, inside: false, dim: 100 }, { lampId: 'hal-75', x: 38, on: true, inside: false, dim: 100 }],
      led: [],
      platform: { x: 30, depth: 30 },
      backH: sp.back, zone: sp.zone,
      targets: { uvb: [...sp.uvi], heat: [...sp.heat], led: [...sp.lux] },
      tab: 'uvb', assist: false, spread: false, contours: true,
      locks: { uvb: false, basking: false, led: false },
    };
  }

  let prefs = Object.assign({ unit: 'cm', theme: 'auto', digits: 'fa', advanced: false }, LS.get('kn_prefs', {}));
  let state = loadInitial();
  let view = { grids: {}, labels: [], hoverLamp: null, dragLamp: null };
  let geo = null;

  function loadInitial() {
    const m = location.hash.match(/#s=([^&]+)/);
    if (m) {
      try { const s = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1]))))); history.replaceState(null, '', location.pathname + location.search); return sanitize(s); } catch { /* ignore */ }
    }
    const saved = LS.get('kn_state', null);
    if (saved) return sanitize(saved);
    const st = defaultState();
    autoLayout(st); autoPlatform(st);
    st._fresh = true;
    return st;
  }
  function sanitize(s) {
    const d = defaultState(s.speciesId || 'bearded');
    const st = Object.assign(d, s);
    st.encl = Object.assign(d.encl, s.encl || {});
    st.targets = Object.assign(d.targets, s.targets || {});
    st.locks = Object.assign(d.locks, s.locks || {});
    st.platform = Object.assign(d.platform, s.platform || {});
    st.basking = (s.basking || d.basking).filter(b => lampById(b.lampId));
    st.led = (s.led || []).filter(b => lampById(b.lampId));
    if (!st.uvb || (st.uvb.lampId && !lampById(st.uvb.lampId))) st.uvb = d.uvb;
    return st;
  }
  function persist() { LS.set('kn_state', state); }

  /* وضعیت مخصوص شبیه‌ساز با اطلاعات جانور */
  function simState(st = state) {
    const sp = spById(st.speciesId);
    return Object.assign({}, st, { animal: { shape: sp.shape, len: sp.len, back: st.backH } });
  }

  /* ---------------- قالب‌بندی اعداد ---------------- */
  const fmt = {
    get unit() { return prefs.unit === 'in' ? 'in' : 'cm'; },
    num(v, d = 0) {
      if (v == null || isNaN(v)) return '—';
      const opts = { minimumFractionDigits: d, maximumFractionDigits: d };
      return prefs.digits === 'fa' ? v.toLocaleString('fa-IR', opts) : v.toLocaleString('en-US', opts);
    },
    dist(cm, d = 1) {
      if (prefs.unit === 'in') return fmt.num(cm / 2.54, d);
      return fmt.num(cm, d);
    },
    distU(cm, d = 1) { return fmt.dist(cm, d) + ' ' + (prefs.unit === 'in' ? 'اینچ' : 'cm'); },
    metric(m, v, short) {
      if (m === 'uvb') return fmt.num(v, v >= 10 ? 1 : 2);
      if (m === 'heat') return fmt.num(Math.round(v)) + (short ? '' : ' W/m²');
      if (v >= 1000) return fmt.num(v / 1000, v >= 10000 ? 0 : 1) + (short ? 'k' : ' هزار لوکس');
      return fmt.num(Math.round(v)) + (short ? '' : ' لوکس');
    },
  };
  const toCm = v => prefs.unit === 'in' ? v * 2.54 : v;
  const fromCm = v => prefs.unit === 'in' ? +(v / 2.54).toFixed(1) : +(+v).toFixed(1);

  /* ---------------- جانمایی خودکار لامپ‌ها ---------------- */
  function spanOf(st) { return Sim.animalSpan(simState(st)); }

  function autoLayout(st) {
    const W = st.encl.W;
    const span = spanOf(st);
    const u = st.uvb.lampId ? lampById(st.uvb.lampId) : null;
    let px = clamp(W * 0.28, span / 2 + 3, W - span / 2 - 3);
    if (u && u.kind === 'tube') {
      const x = u.len >= W * 0.8 ? W / 2 : clamp(u.len / 2 + 3, u.len / 2, W - u.len / 2);
      st.uvb.x = x;
      px = clamp(u.len >= W * 0.8 ? W * 0.3 : x - u.len * 0.12, span / 2 + 2, W - span / 2 - 2);
    } else if (u) {
      st.uvb.x = px;
    }
    st.platform.x = px;
    const on = st.basking.filter(b => b.on !== false);
    const gap = Math.max(10, Math.min(span * 0.4, 25));
    on.forEach((b, i) => {
      const off = on.length === 1 ? 0 : (i - (on.length - 1) / 2) * gap;
      b.x = clamp(px + off, 6, W - 6);
    });
    st.led.forEach((l, i) => {
      const L = lampById(l.lampId);
      l.x = L.kind === 'tube' ? clamp(W - L.len / 2 - 3 - i * 5, L.len / 2, W - L.len / 2) : clamp(W * 0.6, 6, W - 6);
    });
  }

  function minDepth(st) { return Math.min(st.backH + 3, st.encl.H - st.encl.sub - 1); }
  function maxDepth(st) { return st.encl.H - st.encl.sub - 1; }

  function focusMetric(st) { return st.tab === 'combined' || st.tab === 'led' ? 'uvb' : st.tab; }

  function depthRange(st, metric) {
    const ss = simState(st);
    if (st.tab === 'combined' && !metric) {
      const a = Sim.targetDepth(ss, 'uvb', st.targets.uvb), b = Sim.targetDepth(ss, 'heat', st.targets.heat);
      if (a && b) { const lo = Math.max(a[0], b[0]), hi = Math.min(a[1], b[1]); if (lo <= hi) return [lo, hi]; }
      return null;
    }
    return Sim.targetDepth(ss, metric || (st.tab === 'combined' ? 'uvb' : st.tab), st.targets[metric || (st.tab === 'combined' ? 'uvb' : st.tab)]);
  }

  function autoPlatform(st) {
    let r = depthRange(st);
    if (!r && st.tab === 'combined') r = depthRange(st, 'uvb');
    const lo = minDepth(st), hi = maxDepth(st);
    if (r) { st.platform.depth = clamp((r[0] + r[1]) / 2, lo, hi); return true; }
    // نزدیک‌ترین عمق به هدف
    const m = focusMetric(st);
    const t = st.targets[m], mid = (t[0] + t[1]) / 2;
    let best = lo, bestE = Infinity;
    for (let d = lo; d <= hi; d += 0.5) {
      const tmp = Object.assign({}, st, { platform: { x: st.platform.x, depth: d } });
      const v = Sim.atAnimal(simState(tmp), m);
      const e = Math.abs(Math.log((v + 0.01) / mid));
      if (e < bestE) { bestE = e; best = d; }
    }
    st.platform.depth = best;
    return false;
  }

  /* ---------------- انتخاب‌گر کشویی ---------------- */
  function makePicker(host, { groups, selected, onSelect, search, labelOf }) {
    host.innerHTML = '';
    host.classList.add('picker');
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'picker-btn';
    btn.innerHTML = `<span class="pv">${labelOf(selected)}</span><span class="caret">▾</span>`;
    const menu = document.createElement('div'); menu.className = 'picker-menu';
    host.append(btn, menu);
    const build = (q = '') => {
      menu.innerHTML = '';
      if (search) {
        const inp = document.createElement('input');
        inp.type = 'text'; inp.className = 'picker-search'; inp.placeholder = 'جستجو…'; inp.value = q;
        inp.addEventListener('input', () => { build(inp.value); const ni = menu.querySelector('input'); ni.focus(); ni.setSelectionRange(ni.value.length, ni.value.length); });
        menu.append(inp);
      }
      groups.forEach(g => {
        const items = g.items.filter(it => !q || (it.label + ' ' + (it.sub || '') + ' ' + g.label).toLowerCase().includes(q.toLowerCase()));
        if (!items.length) return;
        const wrap = document.createElement('div');
        wrap.className = 'pg' + (q || items.some(i => i.id === selected) || groups.length === 1 ? ' open' : '');
        const head = document.createElement('button');
        head.type = 'button'; head.className = 'pg-head';
        head.innerHTML = `<span><span class="tri">◀</span>${g.label}</span><span class="cnt">${fmt.num(items.length)}</span>`;
        head.onclick = e => { e.stopPropagation(); wrap.classList.toggle('open'); };
        const list = document.createElement('div'); list.className = 'pg-items';
        items.forEach(it => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'pg-item' + (it.id === selected ? ' sel' : '');
          b.innerHTML = it.label + (it.sub ? ` <small dir="ltr">${it.sub}</small>` : "");
          b.onclick = e => { e.stopPropagation(); host.classList.remove('open'); onSelect(it.id); };
          list.append(b);
        });
        wrap.append(head, list); menu.append(wrap);
      });
    };
    btn.onclick = e => {
      e.stopPropagation();
      const open = host.classList.contains('open');
      closeAllPopups();
      if (!open) { build(); host.classList.add('open'); const sel = menu.querySelector('.sel'); if (sel) sel.scrollIntoView({ block: 'nearest' }); }
    };
    menu.addEventListener('click', e => e.stopPropagation());
  }
  function closeAllPopups() {
    $$('.picker.open').forEach(p => p.classList.remove('open'));
    $$('.dropdown.open').forEach(p => p.classList.remove('open'));
  }
  document.addEventListener('click', closeAllPopups);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAllPopups(); $$('.modal:not([hidden])').forEach(m => closeModal(m)); } });

  function lampGroups(role, includeNone) {
    // اول برندهای موجود در بازار ایران، بعد وارداتی‌های کمیاب
    const iran = [], imported = [];
    LAMPS.filter(l => l.role === role).forEach(l => {
      const list = l.iran ? iran : imported;
      const label = l.iran ? '🇮🇷 ' + l.brand : '✈️ ' + l.brand + ' — وارداتی، در ایران کمیاب';
      let g = list.find(b => b.label === label);
      if (!g) { g = { label, items: [] }; list.push(g); }
      g.items.push({ id: l.id, label: l.name, sub: l.kind === 'tube' ? fmt.num(l.len) + 'cm' : '' });
    });
    const groups = [...iran, ...imported];
    if (includeNone) groups.unshift({ label: 'هیچ', items: [{ id: '', label: 'بدون لامپ UVB' }] });
    return groups;
  }
  const brandPrefix = l => /[A-Za-z]/.test(l.brand) ? l.brand + ' ' : '';
  const lampLabel = id => { if (!id) return '<small>بدون لامپ UVB</small>'; const l = lampById(id); return brandPrefix(l) + l.name; };

  /* ---------------- ساخت ستون لامپ‌ها ---------------- */
  function renderSlots() {
    renderSpeciesSide();
    // UVB
    const u = $('#uvbSlot'); u.innerHTML = '';
    const row = document.createElement('div'); row.className = 'slot';
    const pk = document.createElement('div');
    row.append(pk);
    u.append(row);
    makePicker(pk, { groups: lampGroups('uvb', true), selected: state.uvb.lampId, search: true, labelOf: lampLabel, onSelect: id => {
      state.uvb.lampId = id;
      const L = lampById(id);
      if (L && L.kind === 'tube') state.uvb.x = clamp(state.uvb.x, L.len / 2, state.encl.W - L.len / 2);
      commit(true);
    } });
    if (state.mount === 'mixed' && state.uvb.lampId) u.append(mountRow(state.uvb));

    // گرما
    const b = $('#baskingSlots'); b.innerHTML = '';
    if (!state.basking.length) b.innerHTML = '<div class="empty-slot">بدون لامپ حرارتی — با + اضافه کنید</div>';
    state.basking.forEach((slot, i) => {
      const r = document.createElement('div'); r.className = 'slot';
      r.innerHTML = `<input type="checkbox" ${slot.on !== false ? 'checked' : ''} title="روشن/خاموش"><span class="tag">B${fmt.num(i + 1)}</span><div></div><button class="icon-btn" title="حذف">✕</button>`;
      r.querySelector('input').onchange = e => { slot.on = e.target.checked; commit(true); };
      r.querySelector('.icon-btn').onclick = () => { state.basking.splice(i, 1); commit(true); };
      makePicker(r.querySelector('div'), { groups: lampGroups('heat'), selected: slot.lampId, search: true, labelOf: lampLabel, onSelect: id => { slot.lampId = id; commit(true); } });
      b.append(r);
      const ex = document.createElement('div'); ex.className = 'slot-extra adv';
      ex.innerHTML = `<span>دیمر</span><input type="range" min="30" max="100" step="5" value="${slot.dim ?? 100}"><b>${fmt.num(slot.dim ?? 100)}٪</b>`;
      const rg = ex.querySelector('input');
      rg.oninput = () => { slot.dim = +rg.value; ex.querySelector('b').textContent = fmt.num(slot.dim) + '٪'; commit(false); };
      if (state.mount === 'mixed') ex.append(mountSeg(slot));
      b.append(ex);
    });

    // LED
    const l = $('#ledSlots'); l.innerHTML = '';
    if (!state.led.length) l.innerHTML = '<div class="empty-slot">بدون LED — برای روشنایی بیشتر اضافه کنید</div>';
    state.led.forEach((slot, i) => {
      const r = document.createElement('div'); r.className = 'slot led';
      r.innerHTML = `<input type="checkbox" ${slot.on !== false ? 'checked' : ''}><span class="tag">L${fmt.num(i + 1)}</span><div></div><button class="icon-btn" title="حذف">✕</button>`;
      r.querySelector('input').onchange = e => { slot.on = e.target.checked; commit(true); };
      r.querySelector('.icon-btn').onclick = () => { state.led.splice(i, 1); commit(true); };
      makePicker(r.querySelector('div'), { groups: lampGroups('led'), selected: slot.lampId, search: false, labelOf: lampLabel, onSelect: id => { slot.lampId = id; const L = lampById(id); if (L.kind === 'tube') slot.x = clamp(slot.x, L.len / 2, state.encl.W - L.len / 2); commit(true); } });
      l.append(r);
      if (state.mount === 'mixed') l.append(mountRow(slot));
    });

  }
  function mountSeg(slot) {
    const seg = document.createElement('div'); seg.className = 'seg seg-sm';
    seg.innerHTML = `<button class="${!slot.inside ? 'on' : ''}">روی توری</button><button class="${slot.inside ? 'on' : ''}">داخل</button>`;
    const [a, b] = seg.children;
    a.onclick = () => { slot.inside = false; commit(true); };
    b.onclick = () => { slot.inside = true; commit(true); };
    return seg;
  }
  function mountRow(slot) {
    const ex = document.createElement('div'); ex.className = 'slot-extra';
    ex.innerHTML = '<span>محل نصب</span>'; ex.append(mountSeg(slot));
    return ex;
  }

  /* ---------------- کارت گونه ---------------- */
  function renderSpeciesCard() {
    const sp = spById(state.speciesId);
    const t = state.targets;
    $('#speciesCard').innerHTML = `
      <h3 class="sec-title">جانور شما</h3>
      <div class="sp-name">${state.name ? escapeHtml(state.name) + ' — ' : ''}${sp.fa}</div>
      <div class="sp-sci">${sp.en}</div>
      <span class="zone-chip">${zoneText(sp)}</span>
      <div class="src-note">${SRC_TEXT[sp.src] || ''}</div>
      <dl>
        <dt>هدف UVI</dt><dd>${fmt.num(t.uvb[0], 1)} تا ${fmt.num(t.uvb[1], 1)}</dd>
        <dt>هدف گرما</dt><dd>${fmt.num(t.heat[0])} تا ${fmt.num(t.heat[1])} W/m²</dd>
        <dt>روشنایی</dt><dd>${fmt.metric('led', t.led[0])} به بالا</dd>
        <dt>دمای سطح</dt><dd>${sp.bask}${/\d|[۰-۹]/.test(sp.bask) ? ' °C' : ''}</dd>
      </dl>`;
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  /* ---------------- خلاصهٔ محفظه ---------------- */
  function renderSummary() {
    const e = state.encl, sp = spById(state.speciesId);
    $('#enclSummary').textContent = `${fmt.dist(e.W, 0)}×${fmt.dist(e.D, 0)}×${fmt.dist(e.H, 0)} ${prefs.unit === 'in' ? 'اینچ' : 'cm'} | ${state.name || sp.fa} | منطقهٔ ${fmt.num(state.zone)}`;
    $$('#mountSeg button').forEach(b => b.classList.toggle('on', b.dataset.mount === state.mount));
    $$('#tabs button[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === state.tab));
    $('#assistChk').checked = state.assist; $('#spreadChk').checked = state.spread; $('#contourChk').checked = state.contours;
    $('#spreadWrap').hidden = !state.spread;
  }

  /* ---------------- برچسب منابع ---------------- */
  function sourceLabels() {
    const labels = [];
    if (state.uvb.lampId) labels.push({ key: 'uvb', text: lampById(state.uvb.lampId).brand === 'بخار جیوه' ? 'MVB' : 'UVB', role: 'uvb' });
    state.basking.forEach((b, i) => { if (b.on !== false) labels.push({ key: 'b' + i, text: 'B' + (i + 1), role: 'heat' }); });
    state.led.forEach((l, i) => { if (l.on !== false) labels.push({ key: 'l' + i, text: 'L' + (i + 1), role: 'led' }); });
    return labels;
  }
  function slotByKey(k) {
    if (k === 'uvb') return state.uvb;
    if (k[0] === 'b') return state.basking[+k.slice(1)];
    return state.led[+k.slice(1)];
  }
  function clampSlotX(slot, x) {
    const L = lampById(slot.lampId);
    const W = state.encl.W;
    if (L.kind === 'tube') return clamp(x, Math.min(L.len / 2, W / 2), Math.max(W - L.len / 2, W / 2));
    return clamp(x, 4, W - 4);
  }

  /* ---------------- رندر اصلی ---------------- */
  let raf = 0, needSlots = false;
  function commit(rebuildSlots = false) {
    needSlots = needSlots || rebuildSlots;
    persist();
    if (raf) return;
    const run = () => { if (!raf) return; raf = 0; render(); };
    raf = requestAnimationFrame(run);
    setTimeout(run, 60); // پشتیبان وقتی تب پنهان است و rAF اجرا نمی‌شود
  }

  function render() {
    // هنگام کشیدن سنگ یا لامپ، نقشه روی صفحه ثابت بماند حتی اگر محتوای بالای آن (کارت نتیجه) کوتاه یا بلند شود.
    // (سافاری آیفون «scroll anchoring» ندارد، پس دستی جبران می‌کنیم.)
    const anchorEl = view.anchor ? $('#canvasWrap') : null;
    const anchorTop = anchorEl ? anchorEl.getBoundingClientRect().top : 0;
    view.anchor = false;
    const interacting = !!anchorEl;
    if (needSlots) { renderSlots(); needSlots = false; $('#result').style.minHeight = ''; }
    const ss = simState();
    const tab = state.tab;
    const step = Math.max(1, Math.max(state.encl.W, state.encl.H) / 160);
    view.grids = {};
    const need = tab === 'combined' ? ['heat', 'uvb'] : [tab];
    need.forEach(m => view.grids[m] = Sim.grid(ss, m, step));
    view.tab = tab; view.assist = state.assist; view.contours = state.contours;
    view.targets = state.targets;
    view.labels = sourceLabels();
    geo = Draw.scene($('#viz'), ss, view, fmt);
    if (state.spread) Draw.spread($('#spread'), ss, view, fmt);
    renderStats(ss);
    renderPositions();
    renderLegend(ss);
    renderSummary();
    renderSpeciesCard();
    renderSimpleInputs();
    renderResult();
    if (interacting) {
      // هنگام کشیدن، کارت نتیجه کوتاه نشود تا چیزی زیر انگشت کاربر جابه‌جا نشود
      const card = $('#result');
      const locked = parseFloat(card.style.minHeight) || 0;
      const h = card.getBoundingClientRect().height;
      if (h > locked) card.style.minHeight = Math.ceil(h) + 'px';
    }
    $('#platRange').max = maxDepth(state);
    $('#platRange').min = minDepth(state);
    $('#platRange').value = state.platform.depth;
    $('#platVal').textContent = fmt.distU(state.encl.H - state.encl.sub - state.platform.depth, 0);
    if (anchorEl) {
      const shift = anchorEl.getBoundingClientRect().top - anchorTop;
      if (Math.abs(shift) > 0.5) window.scrollBy({ top: shift, left: 0, behavior: 'instant' });
    }
  }

  /* ---------------- حالت ساده: انتخاب جانور و ابعاد ---------------- */
  const SRC_TEXT = {
    uvtool: '📚 منبع: مقالهٔ UV-Tool (Baines و همکاران، ۲۰۱۶)',
    rel: '📚 بر اساس نزدیک‌ترین گونهٔ خویشاوند در مقالهٔ UV-Tool',
    est: '⚠️ این گونه در مقالهٔ UV-Tool نیست؛ مقادیر تخمینی‌اند',
    custom: 'مقادیر پیش‌فرض؛ از منوی «اهداف» تغییرشان دهید',
  };
  const zoneText = sp => {
    const z = state.zone === sp.zone ? sp.zoneLabel : String(state.zone);
    return 'منطقهٔ فرگوسن ' + z.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]).replace('-', ' تا ');
  };
  const NEED_TEXT = { 1: 'نیاز به نور UV: کم (جانور سایه‌زی)', 2: 'نیاز به نور UV: متوسط', 3: 'نیاز به نور UV: زیاد', 4: 'نیاز به نور UV: خیلی زیاد (عاشق آفتاب)' };
  function selectSpecies(id) {
    const sp = spById(id);
    state.speciesId = id; state.backH = sp.back; state.zone = sp.zone;
    state.targets = { uvb: [...sp.uvi], heat: [...sp.heat], led: [...sp.lux] };
    if (!sp.custom) { state.encl.W = sp.encl[0]; state.encl.D = sp.encl[1]; state.encl.H = sp.encl[2]; }
    autoLayout(state);
    autoBoth(state);
    commit(true);
    toast(`مقادیر هدف «${sp.fa}» تنظیم شد`);
  }
  function renderSpeciesSide() {
    makePicker($('#speciesPickerSide'), { groups: speciesGroups(), selected: state.speciesId, search: true, labelOf: id => spById(id).fa, onSelect: selectSpecies });
    const sp = spById(state.speciesId);
    $('#speciesHint').innerHTML = (NEED_TEXT[state.zone] || '') + ' · ' + zoneText(sp) + '<br><span class="src-note">' + (SRC_TEXT[sp.src] || '') + '</span>';
  }
  function lidOf() {
    if (state.encl.mesh >= 100) return 'glass';
    if (state.mount === 'inside' || state.encl.mesh === 0) return 'open';
    return 'mesh';
  }
  function renderSimpleInputs() {
    const e = state.encl;
    [['#sW', e.W], ['#sD', e.D], ['#sH', e.H]].forEach(([id, v]) => { const el = $(id); if (document.activeElement !== el) el.value = Math.round(v); });
    $('#sLid').value = lidOf();
  }
  [['#sW', 'W', 20, 400], ['#sD', 'D', 20, 200], ['#sH', 'H', 20, 250]].forEach(([id, key, lo, hi]) => {
    $(id).onchange = e => {
      const v = parseFloat(e.target.value);
      if (isNaN(v)) return;
      state.encl[key] = clamp(v, lo, hi);
      state.encl.sub = clamp(state.encl.sub, 0, state.encl.H * 0.5);
      autoLayout(state); autoBoth(state);
      commit(true);
    };
  });
  $('#sLid').onchange = e => {
    const v = e.target.value;
    if (v === 'mesh') { state.mount = 'above'; if (state.encl.mesh === 0 || state.encl.mesh >= 100) state.encl.mesh = 35; state.encl.brand = 'std'; }
    if (v === 'open') { state.mount = 'inside'; state.encl.mesh = 0; state.encl.brand = 'none'; toast('⚠ لامپ داخل محفظه حتماً باید قفس محافظ داشته باشد'); }
    if (v === 'glass') { state.mount = 'above'; state.encl.mesh = 100; state.encl.brand = 'glass'; }
    autoBoth(state); commit(true);
  };

  /* ارتفاع سکو برای رسیدن همزمان به هدف UV و گرما */
  function autoBoth(st) {
    const t = st.tab;
    st.tab = 'combined';
    let ok = autoPlatform(st);
    if (!ok) { st.tab = 'uvb'; ok = autoPlatform(st); }
    st.tab = t;
    return ok;
  }
  function comboRange() {
    const t = state.tab; state.tab = 'combined';
    const r = depthRange(state);
    state.tab = t;
    return r;
  }

  /* فاصلهٔ عمودی هر نوع لامپ تا پشت جانور (برای نصب) */
  function lampDistances() {
    const ss = simState();
    const back = Sim.backDepth(ss);
    const parts = [];
    const srcs = Sim.sources(ss);
    const u = srcs.find(s => s.lamp.role === 'uvb');
    const h = srcs.find(s => s.lamp.role === 'heat');
    const cmB = x => `<b>${fmt.num(Math.round(x))} سانتی‌متر</b>`;
    if (u) parts.push('UVB حدود ' + cmB(back - u.y));
    if (h) parts.push('حرارتی حدود ' + cmB(back - h.y));
    return parts.join(' · ');
  }

  /* ---------------- کارت نتیجه (به زبان ساده) ---------------- */
  function renderResult() {
    const sp = spById(state.speciesId);
    const v = view.vals, t = state.targets;
    const su = statusOf(v.uvb, t.uvb)[0], sh = statusOf(v.heat, t.heat)[0];
    const floor = state.encl.H - state.encl.sub;
    const cm = x => `<b>${fmt.num(Math.round(x))} سانتی‌متر</b>`;
    const side = state.platform.x < state.encl.W / 2 ? 'چپ' : 'راست';
    const other = side === 'چپ' ? 'راست' : 'چپ';
    const hasUvb = !!state.uvb.lampId;
    const hasHeat = state.basking.some(b => b.on !== false);
    let cls, icon, title, btn = '';
    const lines = [];
    if (state.encl.mesh >= 100 && hasUvb && state.mount !== 'inside') {
      cls = 'bad'; icon = '🚫'; title = 'شیشه و پلکسی جلوی نور UVB را کامل می‌گیرند';
      lines.push('لامپ UVB را روی توری یا داخل محفظه (با قفس محافظ) نصب کنید، نه پشت شیشه.');
      btn = '<button class="btn btn-primary" data-act="lid">درِ توری را انتخاب کن</button>';
    } else if (su === 'ok' && sh === 'ok') {
      cls = 'ok'; icon = '✅'; title = `عالی! این چیدمان برای ${sp.fa} مناسب است`;
      const dl = lampDistances();
      if (dl) lines.push(`📐 فاصلهٔ لامپ تا پشت جانور: ${dl}`);
      lines.push(`📏 سطح سنگ آفتاب‌گیری را ${cm(floor - state.platform.depth)} بالاتر از کفِ بستر قرار دهید.`);
      lines.push(`☀️ لامپ‌ها را در سمت ${side} محفظه نصب کنید تا سمت ${other} سایه و خنک بماند.`);
    } else {
      const reasons = [];
      if (su === 'lo') reasons.push(hasUvb ? 'نور UV کم است' : 'لامپ UVB انتخاب نشده');
      if (su === 'hi') reasons.push('نور UV زیاد است');
      if (sh === 'lo') reasons.push(hasHeat ? 'گرما کم است' : 'لامپ حرارتی انتخاب نشده');
      if (sh === 'hi') reasons.push('گرما زیاد است');
      if (comboRange()) {
        cls = 'fix'; icon = '🔧'; title = reasons.join(' و ') + ' — فقط ارتفاع سنگ را تغییر دهید';
        lines.push('با همین لامپ‌ها می‌شود به مقدار مناسب رسید؛ کافی است سنگ آفتاب‌گیری را جابه‌جا کنید.');
        btn = '<button class="btn btn-primary" data-act="auto">درستش کن</button>';
      } else {
        cls = 'bad'; icon = '⚠️'; title = reasons.join(' و ');
        lines.push(`با این لامپ‌ها در هیچ ارتفاعی از سنگ، مقدار مناسب ${sp.fa} به دست نمی‌آید.`);
        if (su === 'lo' && hasUvb) lines.push('برای رسیدن به مقدار مناسب، خروجی UVB بیشتری لازم است (درصد UVB یا وات بالاتر، یا نصب زیر توری).');
        if (su === 'hi') lines.push('خروجی UVB این لامپ برای این جانور زیاد است؛ لامپی با درصد UVB کمتر را امتحان کنید.');
        if (sh === 'lo' && hasHeat) lines.push('گرمای بیشتری لازم است؛ لامپ حرارتی با وات بالاتر یا لامپ دوم را امتحان کنید.');
        if (sh === 'hi') lines.push('گرمای این لامپ‌ها زیاد است؛ وات کمتر یا دیمر را امتحان کنید.');
        if (!hasHeat && sh === 'lo') lines.push('با دکمهٔ «+» کنار «لامپ حرارتی» در ستون کناری، لامپ حرارتی‌تان را اضافه کنید.');
        if (!hasUvb && su === 'lo') lines.push('از فهرست «لامپ UVB» در ستون کناری، لامپ UVB‌تان را انتخاب کنید.');
      }
    }
    const el = $('#result');
    el.className = 'result ' + cls;
    el.innerHTML = `<div class="r-icon">${icon}</div><div class="r-body"><div class="r-title">${title}</div>${lines.map(l => `<p>${l}</p>`).join('')}</div>${btn ? `<div class="r-act">${btn}</div>` : ''}`;
    const b = el.querySelector('[data-act]');
    if (b) b.onclick = () => {
      const a = b.dataset.act;
      if (a === 'auto') { autoBoth(state); commit(); toast('ارتفاع سنگ تنظیم شد ✓'); }
      if (a === 'lid') { $('#sLid').value = 'mesh'; $('#sLid').onchange({ target: $('#sLid') }); }
    };
  }

  function statusOf(v, t) { return v < t[0] ? ['lo', 'کم'] : v > t[1] ? ['hi', 'زیاد'] : ['ok', 'مناسب']; }
  function meter(el, v, t) {
    const max = Math.max(t[1] * 1.6, v * 1.05, 0.0001);
    const pct = x => clamp(x / max * 100, 0, 100);
    el.innerHTML = `<div class="band" style="right:${pct(t[0])}%;width:${pct(t[1]) - pct(t[0])}%"></div><div class="needle" style="right:${pct(v)}%"></div>`;
  }
  function renderStats(ss) {
    const vals = { uvb: Sim.atAnimal(ss, 'uvb'), heat: Sim.atAnimal(ss, 'heat'), led: Sim.atAnimal(ss, 'led') };
    view.vals = vals;
    const heatStatus = statusOf(vals.heat, state.targets.heat)[0];
    const uvStatus = statusOf(vals.uvb, state.targets.uvb)[0];
    const heatLabels = { lo: 'گرمای تابشی کم', hi: 'گرمای تابشی زیاد', ok: 'گرمای تابشی مناسب' };
    const marks = { lo: '❄', hi: '♨', ok: '✓' };
    const statusEl = $('#animalStatus');
    const statusKey = heatStatus + ':' + uvStatus;
    if (statusEl.dataset.status !== statusKey) {
      statusEl.dataset.status = statusKey;
      statusEl.innerHTML = `<span class="animal-state ${heatStatus}"><span class="animal-mark" aria-hidden="true">${marks[heatStatus]}</span><span>${heatLabels[heatStatus]}</span></span><span class="animal-uv">نور UV: ${statusOf(vals.uvb, state.targets.uvb)[1]}</span>`;
    }
    const map = { uvb: ['#svUvi', '#stUvi', '#mUvi'], heat: ['#svHeat', '#stHeat', '#mHeat'], led: ['#svLux', '#stLux', '#mLux'] };
    for (const m in map) {
      const [a, b, c] = map[m];
      const t = state.targets[m];
      $(a).textContent = fmt.metric(m, vals[m]);
      const [cls, txt] = statusOf(vals[m], t);
      $(b).className = cls; $(b).textContent = txt;
      meter($(c), vals[m], t);
      const statEl = $(a).closest('.stat');
      const rel = !prefs.advanced ? m !== 'led' : state.tab === 'combined' ? m !== 'led' : state.tab === m;
      let tg = statEl.querySelector('.tgt');
      if (!tg) { tg = document.createElement('small'); tg.className = 'tgt'; statEl.append(tg); }
      tg.textContent = 'مقدار مناسب: ' + fmt.metric(m, t[0], true) + ' تا ' + fmt.metric(m, t[1]);
      statEl.classList.toggle('dim', !rel);
      statEl.classList.toggle('focus', state.tab === m);
    }
    const r = depthRange(state);
    $('#svDepth').textContent = r ? `${fmt.dist(r[0])} تا ${fmt.dist(r[1])} ${prefs.unit === 'in' ? 'اینچ' : 'cm'}` : 'دست‌نیافتنی';
    $('#svDepth').style.color = r ? '' : 'var(--bad)';
    $('#svMesh').textContent = state.mount === 'inside' ? 'بی‌اثر (داخلی)' : fmt.num(state.encl.mesh) + '٪';
  }

  function renderPositions() {
    const tr = $('#posTrack'); tr.innerHTML = '';
    const W = state.encl.W;
    $('#posStart').textContent = fmt.dist(0, 0);
    $('#posEnd').textContent = fmt.distU(W, 0);
    view.labels.forEach(lab => {
      const slot = slotByKey(lab.key);
      const L = lampById(slot.lampId);
      const c = document.createElement('div');
      c.className = `pos-chip ${lab.role}${L.kind === 'tube' ? ' tube' : ''}`;
      c.textContent = lab.text;
      c.style.left = (slot.x / W * 100) + '%';
      c.title = 'بکشید تا جابه‌جا شود — ' + fmt.distU(slot.x) + ' از دیوار چپ';
      c.onpointerdown = e => {
        e.preventDefault(); c.setPointerCapture(e.pointerId);
        const rect = tr.getBoundingClientRect();
        const mv = ev => { slot.x = clampSlotX(slot, (ev.clientX - rect.left) / rect.width * W); c.style.left = (slot.x / W * 100) + '%'; view.anchor = true; commit(); };
        const up = () => { c.removeEventListener('pointermove', mv); c.removeEventListener('pointerup', up); };
        c.addEventListener('pointermove', mv); c.addEventListener('pointerup', up);
      };
      tr.append(c);
    });
  }

  function renderLegend(ss) {
    const m = state.tab === 'combined' ? 'heat' : state.tab;
    const B = BANDS[m];
    const cur = Draw.bandIndex(m, view.vals[m]);
    $('#legend').innerHTML = B.colors.map((c, i) => `<div style="background:${c}" class="${i === cur ? 'cur' : ''}">${B.labels[i]}<small>${B.unit}</small></div>`).join('');
    $('.legend-ends').innerHTML = state.tab === 'combined'
      ? '<span>🌳 سایه</span><span style="color:var(--uv)">خطوط بنفش = مرزهای UVI</span><span>آفتاب کامل ☀</span>'
      : '<span>🌳 سایه</span><span>آفتاب کامل ☀</span>';
  }

  /* ---------------- تعامل با بوم ---------------- */
  const cv = $('#viz'), tip = $('#vizTip');
  let drag = null;
  function hit(px, py) {
    if (!geo) return null;
    for (let i = geo.lampHits.length - 1; i >= 0; i--) {
      const h = geo.lampHits[i];
      if (Math.abs(px - h.x) <= h.halfW + 4 && py >= h.top - 6 && py <= h.bot + 4) return { type: 'lamp', key: h.key };
    }
    const p = geo.platform;
    if ((Math.abs(py - p.back) < 9 && px >= geo.offX && px <= geo.offX + geo.pw) || (px >= p.x0 && px <= p.x1 && py >= p.back - 6 && py <= p.bot)) return { type: 'plat' };
    return null;
  }
  function localXY(e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  cv.addEventListener('pointerdown', e => {
    const [px, py] = localXY(e);
    const h = hit(px, py);
    if (!h) return;
    e.preventDefault(); cv.setPointerCapture(e.pointerId);
    if (h.type === 'lamp') { drag = { type: 'lamp', key: h.key, dx: geo.invX(px) - slotByKey(h.key).x }; view.dragLamp = h.key; }
    else drag = { type: 'plat', dy: geo.invY(py) - state.platform.depth, dx: geo.invX(px) - state.platform.x, sx: px, sy: py, axis: null };
    tip.style.display = 'none';
  });
  cv.addEventListener('pointermove', e => {
    const [px, py] = localXY(e);
    if (drag) {
      view.anchor = true;
      if (drag.type === 'lamp') {
        const slot = slotByKey(drag.key);
        slot.x = clampSlotX(slot, geo.invX(px) - drag.dx);
      } else {
        const sp = spanOf(state);
        state.platform.depth = clamp(geo.invY(py) - drag.dy, minDepth(state), maxDepth(state));
        state.platform.x = clamp(geo.invX(px) - drag.dx, Math.min(sp / 2, state.encl.W / 2), Math.max(state.encl.W - sp / 2, state.encl.W / 2));
      }
      commit();
      return;
    }
    const h = hit(px, py);
    cv.style.cursor = h ? (h.type === 'lamp' ? 'ew-resize' : 'move') : 'crosshair';
    const newHover = h && h.type === 'lamp' ? h.key : null;
    if (newHover !== view.hoverLamp) { view.hoverLamp = newHover; commit(); }
    // راهنمای مقدار
    const x = geo.invX(px), y = geo.invY(py);
    const floor = state.encl.H - state.encl.sub;
    if (x >= 0 && x <= state.encl.W && y >= 0 && y <= floor && !h) {
      const srcs = Sim.sources(simState());
      let txt;
      if (state.tab === 'combined') {
        txt = `UVI ${fmt.metric('uvb', Sim.valueAt(srcs, 'uvb', x, y))} · ${fmt.metric('heat', Sim.valueAt(srcs, 'heat', x, y))}`;
      } else {
        txt = `${BANDS[state.tab].label}: <b>${fmt.metric(state.tab, Sim.valueAt(srcs, state.tab, x, y))}</b>`;
      }
      tip.innerHTML = `${txt}<br><span style="opacity:.75">از دیوار چپ ${fmt.distU(x)} · زیر سقف ${fmt.distU(y)}</span>`;
      tip.style.left = px + 'px'; tip.style.top = py + 'px'; tip.style.display = 'block';
    } else tip.style.display = 'none';
  });
  const endDrag = () => { if (drag) { drag = null; view.dragLamp = null; commit(); } };
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('pointerleave', () => { tip.style.display = 'none'; if (view.hoverLamp) { view.hoverLamp = null; commit(); } });

  new ResizeObserver(() => commit()).observe($('#canvasWrap'));

  /* ---------------- کنترل‌های عمومی ---------------- */
  $$('#tabs button[data-tab]').forEach(b => b.onclick = () => { state.tab = b.dataset.tab; commit(); });
  $$('#mountSeg button').forEach(b => b.onclick = () => {
    state.mount = b.dataset.mount;
    if (state.mount === 'inside') toast('⚠ لامپ داخل محفظه باید محافظ (قفس لامپ) داشته باشد');
    commit(true);
  });
  $('#assistChk').onchange = e => { state.assist = e.target.checked; commit(); };
  $('#spreadChk').onchange = e => { state.spread = e.target.checked; commit(); };
  $('#contourChk').onchange = e => { state.contours = e.target.checked; commit(); };
  $('#platRange').oninput = e => { state.platform.depth = +e.target.value; view.anchor = true; commit(); };
  $('#autoBtn').onclick = () => { const ok = autoBoth(state); commit(); toast(ok ? 'سنگ در ارتفاع مناسب قرار گرفت' : 'با این لامپ‌ها ارتفاع کاملاً مناسبی نیست؛ نزدیک‌ترین ارتفاع انتخاب شد'); };
  $('#addBasking').onclick = () => {
    if (state.basking.length >= 4) return toast('حداکثر ۴ لامپ حرارتی');
    const last = state.basking[state.basking.length - 1];
    state.basking.push({ lampId: last ? last.lampId : 'hal-75', x: clamp((last ? last.x : state.platform.x) + 12, 4, state.encl.W - 4), on: true, inside: false, dim: 100 });
    commit(true);
  };
  $('#addLed').onclick = () => {
    if (state.led.length >= 3) return toast('حداکثر ۳ LED');
    const L = LAMPS.find(l => l.role === 'led' && l.kind === 'tube' && l.len <= state.encl.W - 4) || lampById('gen-ledspot-10');
    state.led.push({ lampId: L.id, x: clampSlotX({ lampId: L.id }, state.encl.W * 0.6), on: true, inside: false });
    commit(true);
  };

  // منوهای کشویی
  $$('[data-dd-toggle]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const dd = b.closest('.dropdown');
    const was = dd.classList.contains('open');
    closeAllPopups();
    if (!was) { dd.classList.add('open'); if (dd.id === 'settingsDD') renderSaved(); if (dd.id === 'targetsDD') renderTargets(); }
  });
  $$('.dd-menu').forEach(m => m.addEventListener('click', e => e.stopPropagation()));

  // اهداف
  function renderTargets() {
    const t = state.targets;
    const row = (m, lbl, st) => `<div class="tgt-row"><span>${lbl}</span><input type="number" step="${st}" data-m="${m}" data-i="0" value="${t[m][0]}"><input type="number" step="${st}" data-m="${m}" data-i="1" value="${t[m][1]}"></div>`;
    $('#targetsMenu').innerHTML = `<div class="dd-title">مقادیر هدف در پشت جانور</div>
      <div class="tgt-row head"><span></span><span>حداقل</span><span>حداکثر</span></div>
      ${row('uvb', 'شاخص UV', 0.1)}${row('heat', 'W/m²', 10)}${row('led', 'لوکس', 1000)}
      <hr><button class="dd-item" id="tgtReset">↺ بازگشت به پیش‌فرض گونه</button>`;
    $$('#targetsMenu input').forEach(inp => inp.onchange = () => {
      const v = parseFloat(inp.value); if (isNaN(v)) return;
      state.targets[inp.dataset.m][+inp.dataset.i] = v;
      const a = state.targets[inp.dataset.m]; if (a[0] > a[1]) a.reverse();
      commit(true);
    });
    $('#tgtReset').onclick = () => { const sp = spById(state.speciesId); state.targets = { uvb: [...sp.uvi], heat: [...sp.heat], led: [...sp.lux] }; renderTargets(); commit(true); };
  }

  /* ---------------- تنظیمات ---------------- */
  function applyPrefs() {
    // داخل سایت اصلی گزینهٔ پوسته وجود ندارد؛ آنجا تم کل صفحه را تغییر نمی‌دهیم
    if ($('#themeSeg')) {
      if (prefs.theme === 'auto') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', prefs.theme);
    }
    $$('#unitSeg button, #unitSeg2 button').forEach(b => b.classList.toggle('on', b.dataset.unit === prefs.unit));
    $$('#themeSeg button').forEach(b => b.classList.toggle('on', b.dataset.theme === prefs.theme));
    $$('#digitSeg button').forEach(b => b.classList.toggle('on', b.dataset.digits === prefs.digits));
    $$('.u').forEach(s => s.textContent = prefs.unit === 'in' ? 'اینچ' : 'cm');
    document.body.classList.toggle('simple', !prefs.advanced);
    $('#advToggle span').textContent = prefs.advanced ? 'بستن تنظیمات پیشرفته' : 'نمایش تنظیمات پیشرفته';
    if (!prefs.advanced && (state.tab === 'led' || state.tab === 'combined')) state.tab = 'uvb';
    LS.set('kn_prefs', prefs);
  }
  $$('#unitSeg button, #unitSeg2 button').forEach(b => b.onclick = () => { prefs.unit = b.dataset.unit; applyPrefs(); fillEnclForm(); commit(true); });
  $('#advToggle').onclick = () => { prefs.advanced = !prefs.advanced; applyPrefs(); commit(true); if (prefs.advanced) toast('ابزارهای پیشرفته نمایش داده شدند'); };
  $$('#themeSeg button').forEach(b => b.onclick = () => { prefs.theme = b.dataset.theme; applyPrefs(); commit(); });
  $$('#digitSeg button').forEach(b => b.onclick = () => { prefs.digits = b.dataset.digits; applyPrefs(); commit(true); });

  function renderSaved() {
    const list = LS.get('kn_saved', []);
    const el = $('#savedList');
    if (!list.length) { el.innerHTML = '<div class="saved-empty">هنوز طرحی ذخیره نشده. از «برگهٔ نصب و ذخیره» ذخیره کنید.</div>'; return; }
    el.innerHTML = list.map((s, i) => `<div class="saved-item"><button class="load" data-i="${i}">📁 ${escapeHtml(s.name)}</button><button class="del" data-i="${i}" title="حذف">✕</button></div>`).join('');
    $$('.load', el).forEach(b => b.onclick = () => { state = sanitize(list[+b.dataset.i].state); closeAllPopups(); commit(true); toast('طرح بارگذاری شد'); });
    $$('.del', el).forEach(b => b.onclick = () => { if (!confirm('این طرح حذف شود؟')) return; list.splice(+b.dataset.i, 1); LS.set('kn_saved', list); renderSaved(); });
  }
  function shareLink() {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    return location.origin + location.pathname + '#s=' + encodeURIComponent(data);
  }
  function copyLink() {
    const url = shareLink();
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast('لینک کپی شد ✓'), () => { prompt('این لینک را کپی کنید:', url); });
  }
  $('#copyLinkBtn').onclick = () => { closeAllPopups(); copyLink(); };
  $('#resetBtn').onclick = () => { if (!confirm('همهٔ تنظیمات این طرح بازنشانی شود؟')) return; state = defaultState(); autoLayout(state); autoPlatform(state); closeAllPopups(); commit(true); };

  /* ---------------- مودال‌ها ---------------- */
  function openModal(m) { m.hidden = false; document.body.style.overflow = 'hidden'; }
  function closeModal(m) { m.hidden = true; document.body.style.overflow = ''; if (m.id === 'guideModal') LS.set('kn_guide_seen', true); }
  $$('.modal').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) closeModal(m); });
    $$('[data-close]', m).forEach(b => b.onclick = () => closeModal(m));
  });

  /* محفظه و جانور */
  function speciesGroups() {
    return CATEGORIES.map(c => ({ label: c.fa, items: SPECIES.filter(s => s.cat === c.id).map(s => ({ id: s.id, label: s.fa, sub: s.custom ? '' : s.en })) }));
  }
  function fillEnclForm() {
    const e = state.encl;
    makePicker($('#speciesPicker'), { groups: speciesGroups(), selected: state.speciesId, search: true, labelOf: id => spById(id).fa, onSelect: id => {
      const sp = spById(id);
      state.speciesId = id; state.backH = sp.back; state.zone = sp.zone;
      state.targets = { uvb: [...sp.uvi], heat: [...sp.heat], led: [...sp.lux] };
      if (!sp.custom) { state.encl.W = sp.encl[0]; state.encl.D = sp.encl[1]; state.encl.H = sp.encl[2]; }
      autoLayout(state); autoPlatform(state);
      fillEnclForm(); commit(true);
    } });
    $('#petName').value = state.name || '';
    $('#backH').value = fromCm(state.backH);
    $('#zoneSel').value = state.zone;
    $('#encW').value = fromCm(e.W); $('#encD').value = fromCm(e.D); $('#encH').value = fromCm(e.H);
    $('#encSub').value = fromCm(e.sub);
    $('#brandSel').innerHTML = ENCLOSURE_BRANDS.map(b => `<option value="${b.id}">${b.fa}${b.mesh != null ? ' (' + fmt.num(b.mesh) + '٪)' : ''}</option>`).join('');
    $('#brandSel').value = e.brand;
    $('#meshPct').value = e.mesh;
    $('#meshNote').className = 'note' + (e.mesh >= 100 ? ' warn' : '');
    $('#meshNote').textContent = e.mesh >= 100
      ? 'شیشه و پلکسی تقریباً تمام UVB را جذب می‌کنند. لامپ UVB باید داخل محفظه یا روی توری باشد.'
      : 'توری بخشی از UV، گرما و نور را می‌گیرد. اگر مطمئن نیستید، برای توری فلزی معمول ۳۰ تا ۴۰ درصد در نظر بگیرید.';
    Draw.preview(ensurePreviewCanvas(), spById(state.speciesId));
  }
  function ensurePreviewCanvas() {
    let c = $('#animalPreview canvas');
    if (!c) { c = document.createElement('canvas'); $('#animalPreview').append(c); }
    return c;
  }
  $('#enclBtn').onclick = () => { fillEnclForm(); openModal($('#enclModal')); };
  $('#petName').oninput = e => { state.name = e.target.value.trim(); commit(); };
  $('#backH').onchange = e => { state.backH = clamp(toCm(+e.target.value || 1), 0.5, 60); commit(); };
  $('#zoneSel').onchange = e => { state.zone = +e.target.value; commit(); };
  const dimInput = (id, key, lo, hi) => $(id).onchange = e => {
    const v = toCm(parseFloat(e.target.value));
    if (isNaN(v)) return;
    state.encl[key] = clamp(v, lo, hi);
    if (key === 'W' || key === 'H' || key === 'sub') {
      state.encl.sub = clamp(state.encl.sub, 0, state.encl.H * 0.5);
      autoLayout(state); state.platform.depth = clamp(state.platform.depth, minDepth(state), maxDepth(state));
    }
    commit(true);
  };
  dimInput('#encW', 'W', 20, 400); dimInput('#encD', 'D', 20, 200); dimInput('#encH', 'H', 20, 250); dimInput('#encSub', 'sub', 0, 60);
  $('#brandSel').onchange = e => {
    const b = ENCLOSURE_BRANDS.find(x => x.id === e.target.value);
    state.encl.brand = b.id;
    if (b.mesh != null) state.encl.mesh = b.mesh;
    fillEnclForm(); commit();
  };
  $('#meshPct').onchange = e => { state.encl.mesh = clamp(+e.target.value || 0, 0, 100); state.encl.brand = 'custom'; fillEnclForm(); commit(); };

  /* ---------------- برگهٔ نصب ---------------- */
  function renderFinish() {
    $('#finishContent').innerHTML = planHtml(true);
  }

  function planHtml(withImg) {
    const ss = simState();
    const sp = spById(state.speciesId);
    const srcs = Sim.sources(ss);
    const back = Sim.backDepth(ss);
    const floor = state.encl.H - state.encl.sub;
    const img = withImg ? $('#viz').toDataURL('image/png') : '';
    const lampRows = view.labels.map((lab, i) => {
      const s = srcs[i];
      const L = s.lamp;
      const dist = back - s.y;
      return `<tr><td><b>${lab.text}</b></td><td>${escapeHtml(L.name)}</td><td>${fmt.distU(s.x)}</td><td>${s.inside ? 'داخل محفظه' : 'روی توری'}</td><td>${fmt.distU(dist)}</td></tr>`;
    }).join('');
    const v = view.vals;
    const st = (m) => { const [c, t] = statusOf(v[m], state.targets[m]); return `<span style="color:${c === 'ok' ? 'var(--good)' : c === 'hi' ? 'var(--bad)' : 'var(--led)'}">${t}</span>`; };
    return `<div class="sheet" id="planSheet">
      <h4>برگهٔ نصب — ${escapeHtml($('#setupName').value || '')}</h4>
      <p class="sub">${escapeHtml(state.name ? state.name + ' · ' : '')}${sp.fa} (${sp.en}) · محفظهٔ ${fmt.num(state.encl.W)}×${fmt.num(state.encl.D)}×${fmt.num(state.encl.H)} cm · ${ZONE_TEXT[state.zone]}</p>
      <div class="plan-grid">
        <div>${img ? `<img class="plan-img" src="${img}" alt="نقشهٔ محفظه">` : ''}</div>
        <div>
          <table class="plan-table">
            <tr><th>فاصلهٔ سطح سنگ تا سقف</th><td>${fmt.distU(state.platform.depth)}</td></tr>
            <tr><th>ارتفاع سنگ از روی بستر</th><td>${fmt.distU(floor - state.platform.depth)}</td></tr>
            <tr><th>مرکز سنگ از دیوار چپ</th><td>${fmt.distU(state.platform.x)}</td></tr>
            <tr><th>شاخص UV روی پشت</th><td>${fmt.metric('uvb', v.uvb)} (هدف ${fmt.num(state.targets.uvb[0], 1)} تا ${fmt.num(state.targets.uvb[1], 1)}) ${st('uvb')}</td></tr>
            <tr><th>چگالی توان</th><td>${fmt.metric('heat', v.heat)} ${st('heat')}</td></tr>
            <tr><th>روشنایی</th><td>${fmt.metric('led', v.led)} ${st('led')}</td></tr>
            <tr><th>دمای سطح آفتاب‌گیری (منبع)</th><td>${sp.bask}${/[۰-۹]/.test(sp.bask) ? ' °C' : ''}</td></tr>
          </table>
        </div>
      </div>
      <h4 style="margin-top:14px">لامپ‌ها</h4>
      <div class="table-scroll"><table class="plan-table"><tr><th></th><th>لامپ</th><th>مرکز از دیوار چپ</th><th>نصب</th><th>فاصله تا پشت جانور</th></tr>${lampRows || '<tr><td colspan="5">لامپی انتخاب نشده</td></tr>'}</table></div>
      <h4 style="margin-top:14px">برنامهٔ روشنایی پیشنهادی</h4>
      <div class="schedule">
        <div style="flex:7;background:#2e3350;color:#cfd6ff">شب</div>
        <div style="flex:1;background:#f7da9c">LED</div>
        <div style="flex:10;background:linear-gradient(90deg,#f6c1c9,#ffa630,#f6c1c9)">UVB + گرما + نور</div>
        <div style="flex:1;background:#f7da9c">LED</div>
        <div style="flex:5;background:#2e3350;color:#cfd6ff">شب</div>
      </div>
      <p class="note">۰ تا ۲۴ — حدود ۱۲ ساعت روشنایی (۷ تا ۱۹)، UVB و گرما در ۱۰ ساعت میانی. در زمستان می‌توانید ۱ تا ۲ ساعت کوتاه‌تر کنید.</p>
      <h4 style="margin-top:10px">چک‌لیست نصب</h4>
      <ul class="checklist">
        <li>لامپ‌ها را طبق جدول بالا نصب کنید و سنگ را در ارتفاع گفته‌شده بگذارید.</li>
        <li>پس از ۳۰ دقیقه، دمای سطح سنگ را با دماسنج لیزری اندازه بگیرید و با دیمر تنظیم کنید.</li>
        <li>اگر UV‌سنج دارید، شاخص UV را در محل پشت جانور بسنجید.</li>
        <li>مطمئن شوید سمت دیگر محفظه سایه و خنک است تا جانور بتواند جابه‌جا شود.</li>
        <li>لامپ UVB را هر ۱۲ ماه (T5) یا ۶ ماه (T8 و کم‌مصرف) تعویض کنید.</li>
      </ul>
      <p class="note">ساخته‌شده با خزنده‌نور — مقادیر شبیه‌سازی‌شده تقریبی هستند.</p>
    </div>`;
  }

  $('#finishBtn').onclick = () => {
    const sp = spById(state.speciesId);
    $('#setupName').value = `${state.name || sp.fa} ${fmt.num(state.encl.W)}×${fmt.num(state.encl.D)}×${fmt.num(state.encl.H)}`;
    renderFinish(); openModal($('#finishModal'));
  };
  $('#saveSetupBtn').onclick = () => {
    const name = $('#setupName').value.trim() || 'طرح بدون نام';
    const list = LS.get('kn_saved', []);
    const i = list.findIndex(s => s.name === name);
    const item = { name, date: Date.now(), state: JSON.parse(JSON.stringify(state)) };
    if (i >= 0) list[i] = item; else list.unshift(item);
    LS.set('kn_saved', list.slice(0, 30));
    toast('«' + name + '» ذخیره شد ✓');
  };
  $('#shareSetupBtn').onclick = copyLink;
  $('#printBtn').onclick = () => {
    let pa = $('#printArea');
    if (!pa) { pa = document.createElement('div'); pa.id = 'printArea'; pa.hidden = true; ($('.rl-app') || document.body).append(pa); }
    pa.innerHTML = planHtml(true);
    pa.hidden = false;
    document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); pa.hidden = true; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => window.print(), 80);
  };

  /* ---------------- راهنمای مبتدی ---------------- */
  const lizardSvg = (x, y, w, h, fill = '#fffaf0') => {
    const sx = w / 100, sy = h / 20;
    return `<g transform="translate(${x} ${y}) scale(${sx} ${-sy})" stroke="#3a372e" stroke-linejoin="round" stroke-linecap="round" fill="${fill}" stroke-width="${1.4 / sx}">
      <path d="M27 6 L23 2.6 L18 0.4 M49 6 L55 2.6 L50 0.4" opacity=".4" fill="none"/>
      <path d="M1 8 Q4 13 10 14 L16 13.2 C26 19 40 19 48 14 C62 10 82 4.2 100 3 L99.5 2.1 C80 2.6 62 3.6 52 5 C40 4.2 26 4 18 5.2 Q6 5 1 8 Z"/>
      <path d="M24 6 L20 2.6 L15 0.4 M46 6 L52 2.6 L47 0.4" fill="none" stroke-width="${2 / sx}"/>
      <ellipse cx="7" cy="10.4" rx="0.9" ry="${0.9 * sx / sy}" fill="#3a372e" stroke="none"/></g>`;
  };
  const sun = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r * 1.7}" fill="#f7e2a8" opacity=".5"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#efb93f"/>` +
    Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return `<line x1="${cx + Math.cos(a) * r * 1.25}" y1="${cy + Math.sin(a) * r * 1.25}" x2="${cx + Math.cos(a) * r * 1.5}" y2="${cy + Math.sin(a) * r * 1.5}" stroke="#e0a936" stroke-width="3" stroke-linecap="round"/>`; }).join('');
  const GUIDE = [
    { k: 'راهنمای مبتدی', t: 'با نورپردازی خزندگان تازه آشنا شده‌اید؟', p: ['یک راهنمای کوتاه و تعاملی دربارهٔ این ابزار و ساختن یک «تکهٔ آفتاب» درست برای جانورتان.'],
      art: `<svg viewBox="0 0 440 190"><defs><linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4c95a" stop-opacity=".55"/><stop offset="1" stop-color="#f4c95a" stop-opacity=".08"/></linearGradient></defs><path d="M250 20 L130 172 L350 172 Z" fill="url(#gb)"/>${sun(270, 18, 34)}<ellipse cx="240" cy="172" rx="130" ry="8" fill="#ecd7a5"/>${lizardSvg(110, 170, 210, 38)}</svg>` },
    { k: 'قدم ۱ از ۵', t: 'چرا خزنده به نور نیاز دارد؟', p: ['خزندگان گرمای بدنشان را از محیط می‌گیرند و با پرتو UVB در پوستشان ویتامین D3 می‌سازند تا کلسیم را جذب کنند.', 'بدون UVB کافی، بیماری متابولیک استخوان (MBD) رخ می‌دهد. ولی UV بیش از حد هم به چشم و پوست آسیب می‌زند؛ هدف «تعادل» است.'],
      art: `<svg viewBox="0 0 440 190"><rect x="0" y="0" width="440" height="190" fill="#f6ecd4"/>${sun(90, 60, 28)}<g font-family="Vazirmatn" font-weight="800" font-size="15" text-anchor="middle"><rect x="170" y="40" width="80" height="34" rx="10" fill="#ece6fb"/><text x="210" y="62" fill="#7b5cc9">UVB</text><rect x="170" y="86" width="80" height="34" rx="10" fill="#fde9d8"/><text x="210" y="108" fill="#e0742a">گرما</text><rect x="170" y="132" width="80" height="34" rx="10" fill="#e1ecfc"/><text x="210" y="154" fill="#3a78d6">نور</text></g><path d="M120 60 L165 57 M120 70 L165 103 M115 80 L165 149" stroke="#c9a454" stroke-width="2" stroke-dasharray="4 4"/>${lizardSvg(280, 130, 140, 28)}</svg>` },
    { k: 'قدم ۲ از ۵', t: 'فاصله، همه‌چیز است', p: ['شدت نور با دورشدن از لامپ به‌سرعت کم می‌شود. هر بار که فاصله دو برابر شود، شدتِ یک لامپ نقطه‌ای تقریباً یک‌چهارم می‌شود.', 'به همین خاطر، ارتفاع سکوی آفتاب‌گیری مهم‌ترین پیچ تنظیم شماست. در شبیه‌ساز، سکو را بالا و پایین بکشید و اعداد را ببینید.'],
      art: `<svg viewBox="0 0 440 190"><rect width="440" height="190" fill="#fbf3df"/><rect x="170" y="10" width="100" height="14" rx="4" fill="#2f4d48"/><rect x="178" y="18" width="84" height="8" rx="4" fill="#b69cff"/><g fill="#7b5cc9" opacity=".9"><ellipse cx="220" cy="40" rx="70" ry="16" opacity=".55"/><ellipse cx="220" cy="80" rx="110" ry="26" opacity=".3"/><ellipse cx="220" cy="130" rx="150" ry="36" opacity=".14"/></g><g font-family="Vazirmatn" font-size="13" font-weight="800" fill="#3a372e"><text x="380" y="46">UVI ۸</text><text x="380" y="86">UVI ۴</text><text x="380" y="136">UVI ۱٫۵</text></g><path d="M60 30 V170" stroke="#3a372e" stroke-width="1.5" marker-end="url(#ar)"/><defs><marker id="ar" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#3a372e"/></marker></defs><text x="48" y="100" font-family="Vazirmatn" font-size="12" fill="#3a372e" text-anchor="end" transform="rotate(-90 48 100)">فاصله</text></svg>` },
    { k: 'قدم ۳ از ۵', t: 'مناطق فرگوسن', p: ['پژوهشگران گونه‌ها را بر اساس رفتار آفتاب‌گیری در ۴ «منطقهٔ فرگوسن» گروه‌بندی کرده‌اند؛ از جانوران سایه‌زی (منطقهٔ ۱) تا آفتاب‌گیرهای کامل بیابانی (منطقهٔ ۴).', 'وقتی گونه را انتخاب می‌کنید، هدف UVI و گرما به‌طور خودکار از همین منطقه تنظیم می‌شود.'],
      art: `<svg viewBox="0 0 440 190"><rect width="440" height="190" fill="#fbf3df"/><g font-family="Vazirmatn" font-weight="800" font-size="14" text-anchor="middle">${[['۱', '#e4f1dc', 40], ['۲', '#cfe8b8', 70], ['۳', '#f7da9c', 105], ['۴', '#f4a8a8', 140]].map((z, i) => `<rect x="${50 + i * 90}" y="${170 - z[2]}" width="70" height="${z[2]}" rx="8" fill="${z[1]}" stroke="#3a372e" stroke-opacity=".2"/><text x="${85 + i * 90}" y="${162 - z[2] + 30}" fill="#3a372e">منطقهٔ ${z[0]}</text>`).join('')}</g>${sun(400, 26, 14)}</svg>` },
    { k: 'قدم ۴ از ۵', t: 'گرادیان: سمت گرم و سمت سرد', p: ['تمام لامپ‌ها را در یک سمت محفظه بگذارید. جانور باید بتواند بین نقطهٔ داغ آفتاب‌گیری و سایهٔ خنک جابه‌جا شود و دمای بدنش را خودش تنظیم کند.', 'با «نمودار پخش» ببینید نور و گرما در طول محفظه چطور کم می‌شود.'],
      art: `<svg viewBox="0 0 440 190"><defs><linearGradient id="gr" x1="0" x2="1"><stop offset="0" stop-color="#ffa630"/><stop offset=".45" stop-color="#ffe28a"/><stop offset="1" stop-color="#e1ecfc"/></linearGradient></defs><rect x="30" y="30" width="380" height="140" rx="6" fill="url(#gr)" stroke="#2a2822" stroke-width="2.5"/><circle cx="90" cy="30" r="14" fill="#ffd07a" stroke="#2f4d48" stroke-width="5"/><g font-family="Vazirmatn" font-weight="800" font-size="15"><text x="70" y="160" fill="#8a3a0a">گرم</text><text x="350" y="160" fill="#2a5fb0">خنک</text></g>${lizardSvg(60, 120, 120, 22)}<path d="M200 110 H330" stroke="#3a372e" stroke-width="2" stroke-dasharray="6 5"/><path d="M330 104 L342 110 L330 116" fill="#3a372e"/></svg>` },
    { k: 'قدم ۵ از ۵', t: 'حالا نوبت شماست!', p: ['۱. جانور و اندازهٔ محفظه را در ستون کناری انتخاب کنید.', '۲. مدل لامپ UVB و لامپ حرارتی خودتان را از فهرست بردارید.', '۳. کارت نتیجه می‌گوید سنگ آفتاب‌گیری را در چه ارتفاعی بگذارید؛ در پایان «برگهٔ نصب» را چاپ کنید.'],
      art: `<svg viewBox="0 0 440 190"><rect width="440" height="190" fill="#fbf3df"/><rect x="70" y="24" width="300" height="146" rx="12" fill="#fff" stroke="#e0d7c3"/><rect x="86" y="40" width="80" height="18" rx="6" fill="#ece6fb"/><rect x="172" y="40" width="70" height="18" rx="6" fill="#fde9d8"/><rect x="248" y="40" width="70" height="18" rx="6" fill="#e1ecfc"/><rect x="86" y="68" width="268" height="86" rx="6" fill="#f7da9c" opacity=".6"/><ellipse cx="170" cy="72" rx="60" ry="30" fill="#f6c1c9" opacity=".7"/>${lizardSvg(130, 128, 90, 16)}<rect x="126" y="128" width="100" height="26" fill="#cfc4ae" stroke="#3a372e"/></svg>` },
  ];
  let gStep = 0;
  function renderGuide() {
    const g = GUIDE[gStep];
    $('#guideArt').innerHTML = g.art;
    $('#guideKicker').textContent = g.k;
    $('#guideTitle').textContent = g.t;
    $('#guideText').innerHTML = g.p.map(p => `<p>${p}</p>`).join('');
    $('#guideDots').innerHTML = GUIDE.map((_, i) => `<span class="${i === gStep ? 'on' : ''}"></span>`).join('');
    $('#guideNext').textContent = gStep === 0 ? 'شروع راهنما' : gStep === GUIDE.length - 1 ? 'بزن بریم!' : 'بعدی ←';
    $('#guidePrev').textContent = gStep === 0 ? 'الان نه' : '→ قبلی';
    $('#guideNever').hidden = gStep !== 0;
  }
  function openGuide() { gStep = 0; renderGuide(); openModal($('#guideModal')); }
  $('#guideNext').onclick = () => { if (gStep < GUIDE.length - 1) { gStep++; renderGuide(); } else closeModal($('#guideModal')); };
  $('#guidePrev').onclick = () => { if (gStep === 0) closeModal($('#guideModal')); else { gStep--; renderGuide(); } };
  $('#guideNever').onclick = () => { LS.set('kn_guide_never', true); closeModal($('#guideModal')); };
  $('#openGuideBtn').onclick = () => { closeAllPopups(); openGuide(); };

  /* ---------------- اعلان ---------------- */
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------------- شروع ---------------- */
  applyPrefs();
  if (state._fresh) { delete state._fresh; autoBoth(state); }
  needSlots = true;
  render();
  const qs = new URLSearchParams(location.search);
  if (qs.get('tab') && BANDS[qs.get('tab')] || qs.get('tab') === 'combined') { state.tab = qs.get('tab'); commit(); }
  window.addEventListener('resize', () => commit());
})();
