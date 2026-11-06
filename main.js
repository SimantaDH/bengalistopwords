/* ==========================================================
   The Words We Read Past: interactive layer
   Simanta Nandi, IIT (ISM) Dhanbad, 2026. CC BY-NC 4.0
   ========================================================== */
(function () {
  'use strict';

  var D = window.STOPWORDS;
  if (!D) { console.error('Stop-word data did not load.'); return; }

  document.documentElement.classList.add('js');

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var norm = function (s) { return (s || '').normalize('NFC').toLowerCase().trim(); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };

  var ENTRIES = D.entries;
  var CATS = D.categories;
  var CAT_IDS = Object.keys(CATS);
  var MACROS = D.macro_order;
  var MVAR = {}; MACROS.forEach(function (m, i) { MVAR[m] = 'var(--m' + (i + 1) + ')'; });
  var BY_ROMAN = {}; ENTRIES.forEach(function (e) { BY_ROMAN[e.roman] = e; });
  var catCount = {}; ENTRIES.forEach(function (e) { catCount[e.category_id] = (catCount[e.category_id] || 0) + 1; });

  /* ---------------- tooltip ---------------- */
  var tip = $('#tooltip');
  function showTip(html, ev) {
    tip.innerHTML = html; tip.hidden = false;
    var x = ev.clientX + 14, y = ev.clientY + 14;
    var r = tip.getBoundingClientRect();
    if (x + r.width > window.innerWidth - 8) x = ev.clientX - r.width - 14;
    if (y + r.height > window.innerHeight - 8) y = ev.clientY - r.height - 14;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function hideTip() { tip.hidden = true; }

  /* ---------------- theme ---------------- */
  var themeBtn = $('#theme-toggle');
  function setThemeLabel() {
    var dark = document.documentElement.getAttribute('data-theme') !== 'light';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to the light page' : 'Switch to the dark page');
    themeBtn.title = dark ? 'Light the page' : 'Dim the page';
  }
  setThemeLabel();
  themeBtn.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('bsw-theme', next); } catch (e) {}
    setThemeLabel();
  });

  /* ---------------- top bar, progress, nav ---------------- */
  var topbar = $('#topbar'), bar = $('#progress-bar');
  var toTop = $('#to-top'), toTopFill = $('#to-top-fill'), RING = 138.2;
  function onScroll() {
    var h = document.documentElement;
    var p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    bar.style.width = (p * 100).toFixed(2) + '%';
    topbar.classList.toggle('solid', h.scrollTop > window.innerHeight * 0.6);
    if (toTop) {
      toTop.classList.toggle('show', h.scrollTop > window.innerHeight * 0.8);
      toTopFill.style.strokeDashoffset = (RING * (1 - p)).toFixed(1);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var menuBtn = $('#menu-toggle'), nav = $('#topnav');
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('#topnav a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }); });

  if ('IntersectionObserver' in window) {
    var navMap = {};
    $$('#topnav a').forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });
    var navIO = new IntersectionObserver(function (items) {
      items.forEach(function (it) {
        if (it.isIntersecting && navMap[it.target.id]) {
          $$('#topnav a').forEach(function (a) { a.classList.remove('active'); });
          navMap[it.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(navMap).forEach(function (id) { var el = document.getElementById(id); if (el) navIO.observe(el); });
  }

  /* lamplight carried down the page */
  var glowFrame = null, gx = -999, gy = -999;
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    gx = e.clientX; gy = e.clientY;
    if (!glowFrame) glowFrame = requestAnimationFrame(function () {
      document.documentElement.style.setProperty('--lx', gx + 'px');
      document.documentElement.style.setProperty('--ly', gy + 'px');
      glowFrame = null;
    });
  }, { passive: true });

  /* ==========================================================
     HERO: move the light across the dark to read
     ========================================================== */
  (function hero() {
    var section = $('#top'), canvas = $('#dark-field');
    var ctx = canvas.getContext('2d');
    var faint = document.createElement('canvas'), fctx = faint.getContext('2d');
    var W = 0, H = 0, DPR = 1, words = [], motes = [];
    var lamp = { x: 0, y: 0, tx: 0, ty: 0, r: 0, tr: 0 };
    var lastInput = -1e9, running = false, visible = true, born = performance.now();

    var pool = [];
    var seen = {};
    ENTRIES.forEach(function (e) { if (e.bengali && !seen[e.bengali]) { seen[e.bengali] = 1; pool.push(e); } });

    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

    function layout() {
      var rect = section.getBoundingClientRect();
      W = rect.width; H = rect.height;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      [canvas, faint].forEach(function (c) { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); });
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      fctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      var target = Math.round(Math.max(70, Math.min(pool.length, (W * H) / 4300)));
      var boxes = [], list = shuffle(pool.slice());
      words = [];
      fctx.textBaseline = 'middle';
      for (var i = 0; i < list.length && words.length < target; i++) {
        var size = 14 + Math.pow(Math.random(), 1.8) * 22;
        fctx.font = size + 'px "Tiro Bangla", "Noto Serif Bengali", serif';
        var w = fctx.measureText(list[i].bengali).width;
        var placed = false;
        for (var tries = 0; tries < 40 && !placed; tries++) {
          var x = 10 + Math.random() * Math.max(10, W - w - 20);
          var y = 20 + Math.random() * Math.max(10, H - 40);
          var b = { x: x - 6, y: y - size * 0.75, w: w + 12, h: size * 1.5 + 12 };
          var hit = false;
          for (var k = 0; k < boxes.length; k++) {
            var o = boxes[k];
            if (b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y) { hit = true; break; }
          }
          if (!hit) {
            boxes.push(b);
            words.push({ e: list[i], x: x, y: y, w: w, size: size, cx: x + w / 2, cy: y, tw: Math.random() * 6.28 });
            placed = true;
          }
        }
      }
      fctx.clearRect(0, 0, W, H);
      words.forEach(function (wd) {
        fctx.font = wd.size + 'px "Tiro Bangla", "Noto Serif Bengali", serif';
        fctx.fillStyle = 'rgba(236, 225, 200, 0.055)';
        fctx.fillText(wd.e.bengali, wd.x, wd.y);
      });

      motes = [];
      var n = Math.round(Math.min(70, W * H / 22000));
      for (var m = 0; m < n; m++) motes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .12, vy: -.05 - Math.random() * .18, s: .6 + Math.random() * 1.6 });

      if (!lamp.x) { lamp.x = lamp.tx = W * (W < 900 ? 0.5 : 0.66); lamp.y = lamp.ty = H * (W < 900 ? 0.24 : 0.38); }
      lamp.tr = Math.max(130, Math.min(W, H) * 0.3);
    }

    function draw(t) {
      ctx.fillStyle = '#0a101c';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(faint, 0, 0, W, H);

      var R = lamp.r;
      if (R < 2) return;
      var flick = REDUCED ? 1 : 1 + 0.022 * Math.sin(t * 0.0071) + 0.016 * Math.sin(t * 0.0133 + 1.3) + 0.01 * Math.sin(t * 0.031);
      R *= flick;

      var g = ctx.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, R * 1.25);
      g.addColorStop(0, 'rgba(255, 214, 140, 0.20)');
      g.addColorStop(0.35, 'rgba(242, 184, 75, 0.09)');
      g.addColorStop(1, 'rgba(242, 184, 75, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(lamp.x - R * 1.3, lamp.y - R * 1.3, R * 2.6, R * 2.6);

      ctx.textBaseline = 'middle';
      var near = [];
      for (var i = 0; i < words.length; i++) {
        var wd = words[i];
        var dx = wd.cx - lamp.x, dy = wd.cy - lamp.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d > R) continue;
        var a = Math.pow(1 - d / R, 1.35);
        var warm = Math.round(200 + 55 * a);
        ctx.font = wd.size + 'px "Tiro Bangla", "Noto Serif Bengali", serif';
        ctx.shadowColor = 'rgba(242, 184, 75, ' + (0.85 * a).toFixed(3) + ')';
        ctx.shadowBlur = 16 * a;
        ctx.fillStyle = 'rgba(255, ' + warm + ', ' + Math.round(120 + 90 * a) + ', ' + Math.min(1, a * 1.15).toFixed(3) + ')';
        ctx.fillText(wd.e.bengali, wd.x, wd.y);
        if (d < R * 0.5) near.push({ wd: wd, d: d });
      }
      ctx.shadowBlur = 0;

      // romanisation and gloss under the few words nearest the flame
      near.sort(function (p, q) { return p.d - q.d; });
      var placed = [];
      for (var n = 0; n < near.length && placed.length < 4; n++) {
        var w2 = near[n].wd, fs = Math.max(11.5, w2.size * 0.5);
        ctx.font = 'italic ' + fs + 'px "Newsreader", Georgia, serif';
        var label = w2.e.roman + ', ' + w2.e.gloss.split(';')[0];
        var lw = ctx.measureText(label).width;
        var box = { x: w2.x, y: w2.y + w2.size * 0.55, w: lw, h: fs * 1.3 };
        var clash = placed.some(function (o) { return box.x < o.x + o.w + 8 && box.x + box.w + 8 > o.x && box.y < o.y + o.h && box.y + box.h > o.y; });
        if (clash) continue;
        placed.push(box);
        var b = 1 - near[n].d / (R * 0.5);
        ctx.fillStyle = 'rgba(236, 225, 200, ' + (0.8 * Math.min(1, b * 1.6)).toFixed(3) + ')';
        ctx.fillText(label, box.x, box.y + box.h / 2);
      }

      for (var m = 0; m < motes.length; m++) {
        var p = motes[m];
        if (!REDUCED) { p.x += p.vx; p.y += p.vy; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; } }
        var md = Math.hypot(p.x - lamp.x, p.y - lamp.y);
        if (md > R) continue;
        ctx.fillStyle = 'rgba(255, 220, 160, ' + (0.55 * (1 - md / R)).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.283); ctx.fill();
      }

      // the flame at the cursor
      var core = ctx.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, 16);
      core.addColorStop(0, 'rgba(255, 240, 205, 0.95)');
      core.addColorStop(0.3, 'rgba(255, 210, 120, 0.55)');
      core.addColorStop(1, 'rgba(242, 184, 75, 0)');
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(lamp.x, lamp.y, 16, 0, 6.283); ctx.fill();
    }

    function step(t) {
      if (!running) return;
      var idle = t - lastInput > 3200;
      if (idle) {
        var s = (t - born) * 0.00011;
        if (W < 900) {
          // on a phone the title fills the lower half, so the lamp wanders above it
          lamp.tx = W * (0.5 + 0.36 * Math.sin(s * 2.1));
          lamp.ty = H * (0.24 + 0.12 * Math.sin(s * 1.3 + 0.8));
        } else {
          lamp.tx = W * (0.62 + 0.26 * Math.sin(s * 2.1) * Math.cos(s * 0.7));
          lamp.ty = H * (0.42 + 0.26 * Math.sin(s * 1.3 + 0.8));
        }
      }
      var k = idle ? 0.02 : 0.16;
      lamp.x += (lamp.tx - lamp.x) * k;
      lamp.y += (lamp.ty - lamp.y) * k;
      lamp.r += (lamp.tr - lamp.r) * 0.035;
      draw(t);
      requestAnimationFrame(step);
    }

    function start() { if (!running && visible) { running = true; requestAnimationFrame(step); } }
    function stop() { running = false; }

    function point(e) {
      var r = canvas.getBoundingClientRect();
      lamp.tx = e.clientX - r.left; lamp.ty = e.clientY - r.top;
      lastInput = performance.now();
      if (REDUCED) { lamp.x = lamp.tx; lamp.y = lamp.ty; requestAnimationFrame(draw); }
    }
    section.addEventListener('pointermove', point);
    section.addEventListener('pointerdown', point);

    var resizeT;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () { layout(); if (REDUCED) draw(0); }, 180);
    });

    function boot() {
      layout();
      if (REDUCED) { lamp.r = lamp.tr; draw(0); return; }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (items) {
          visible = items[0].isIntersecting;
          if (visible) start(); else stop();
        }).observe(section);
      }
      start();
    }
    var fontsReady = document.fonts && document.fonts.load ? document.fonts.load('20px "Tiro Bangla"', 'আমি') : Promise.resolve();
    Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1500); })]).then(boot);
  })();

  /* ==========================================================
     LEXICON
     ========================================================== */
  var lex = { q: '', macro: '', cat: '', reg: '', flag: false, sel: null };
  var lexEl = $('#lexicon'), countEl = $('#lex-count'), card = $('#entry-card');
  var catSelect = $('#cat-select'), regSelect = $('#reg-select'), flagBox = $('#flag-only'), search = $('#lex-search');

  (function buildChips() {
    var wrap = $('#macro-chips');
    MACROS.forEach(function (m) {
      var n = ENTRIES.filter(function (e) { return e.macro === m; }).length;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.macro = m;
      b.setAttribute('aria-pressed', 'false');
      b.style.setProperty('--c', MVAR[m]);
      b.innerHTML = '<i></i>' + esc(m) + ' <span>' + n + '</span>';
      b.addEventListener('click', function () {
        lex.macro = lex.macro === m ? '' : m;
        if (lex.cat && CATS[lex.cat].macro !== lex.macro) lex.cat = '';
        syncControls(); renderLex();
      });
      wrap.appendChild(b);
    });
  })();

  function fillCatSelect() {
    var cur = lex.cat;
    catSelect.innerHTML = '<option value="">All categories</option>';
    CAT_IDS.forEach(function (id) {
      if (lex.macro && CATS[id].macro !== lex.macro) return;
      var o = document.createElement('option');
      o.value = id; o.textContent = CATS[id].label + ' (' + catCount[id] + ')';
      catSelect.appendChild(o);
    });
    catSelect.value = cur;
  }
  function syncControls() {
    $$('#macro-chips .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.macro === lex.macro)); });
    fillCatSelect();
    regSelect.value = lex.reg; flagBox.checked = lex.flag; search.value = lex.q;
  }

  function matches(e) {
    if (lex.macro && e.macro !== lex.macro) return false;
    if (lex.cat && e.category_id !== lex.cat) return false;
    if (lex.reg && e.register !== lex.reg) return false;
    if (lex.flag && !e.note) return false;
    if (lex.q) {
      var q = norm(lex.q);
      return e.roman.indexOf(q) > -1 || norm(e.bengali).indexOf(q) > -1 || e.gloss.toLowerCase().indexOf(q) > -1;
    }
    return true;
  }
  function hl(text) {
    if (!lex.q) return esc(text);
    var q = norm(lex.q), i = text.toLowerCase().indexOf(q);
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  }

  function renderLex() {
    var shown = 0, html = '';
    CAT_IDS.forEach(function (id) {
      var items = ENTRIES.filter(function (e) { return e.category_id === id && matches(e); });
      if (!items.length) return;
      shown += items.length;
      html += '<section class="lex-group" style="--c:' + MVAR[CATS[id].macro] + '"><h4>' + esc(CATS[id].label) + '<small>' + items.length + '</small></h4>';
      items.forEach(function (e) {
        html += '<button type="button" class="lex-entry' + (lex.sel === e.roman ? ' on' : '') + '" data-r="' + esc(e.roman) + '">' +
          '<span class="bn" lang="bn">' + esc(e.bengali || '?') + '</span>' +
          '<span class="ro">' + hl(e.roman) + (e.note ? '<span class="dag" title="This entry has a note">†</span>' : '') + '</span>' +
          '<span class="gl">' + hl(e.gloss) + '</span></button>';
      });
      html += '</section>';
    });
    lexEl.innerHTML = html || '<p class="lex-empty">No stop word matches that search. Try the other script, or clear the filters.</p>';
    countEl.textContent = shown === ENTRIES.length ? 'Showing all ' + shown + ' words. A dagger (†) marks a word with a note.' : 'Showing ' + shown + ' of ' + ENTRIES.length + ' words.';
  }

  function showEntry(r) {
    var e = BY_ROMAN[r]; if (!e) return;
    lex.sel = r;
    $$('.lex-entry').forEach(function (b) { b.classList.toggle('on', b.dataset.r === r); });
    card.innerHTML =
      '<button class="e-close" type="button">Close</button>' +
      '<p class="e-bn" lang="bn">' + esc(e.bengali || '?') + '</p>' +
      '<p class="e-ro">' + esc(e.roman) + '</p>' +
      '<p class="e-gl">' + esc(e.gloss) + '</p>' +
      '<dl><dt>Category</dt><dd><i style="--c:' + MVAR[e.macro] + '"></i>' + esc(e.category) + '</dd>' +
      '<dt>Family</dt><dd>' + esc(e.macro) + '</dd>' +
      '<dt>Register</dt><dd>' + esc(e.register_label) + '</dd>' +
      '<dt>Length</dt><dd>' + e.length + ' letters</dd></dl>' +
      (e.note ? '<p class="e-note">' + esc(e.note) + '</p>' : '');
    card.classList.add('show');
    $('.e-close', card).addEventListener('click', function () { card.classList.remove('show'); });
  }

  lexEl.addEventListener('click', function (ev) {
    var b = ev.target.closest('.lex-entry'); if (b) showEntry(b.dataset.r);
  });
  var qT;
  search.addEventListener('input', function () { clearTimeout(qT); qT = setTimeout(function () { lex.q = search.value; renderLex(); }, 90); });
  catSelect.addEventListener('change', function () { lex.cat = catSelect.value; renderLex(); });
  regSelect.addEventListener('change', function () { lex.reg = regSelect.value; renderLex(); });
  flagBox.addEventListener('change', function () { lex.flag = flagBox.checked; renderLex(); });

  function openCategory(id) {
    lex = { q: '', macro: CATS[id].macro, cat: id, reg: '', flag: false, sel: null };
    syncControls(); renderLex();
    document.getElementById('list').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
  }
  syncControls(); renderLex();

  /* ==========================================================
     FIGURES
     ========================================================== */
  var d3 = window.d3;
  var revealers = [];
  function onReveal(el, fn) { revealers.push({ el: el, fn: fn }); }

  /* ---- Figure 1: ring + bars ---- */
  var catOrder = CAT_IDS.slice().sort(function (a, b) {
    var ma = MACROS.indexOf(CATS[a].macro), mb = MACROS.indexOf(CATS[b].macro);
    return ma - mb || catCount[b] - catCount[a];
  });
  var ringHover = function () {}, barHover = function () {};

  (function ring() {
    var host = $('#ring-chart'); if (!d3 || !host) return;
    var size = 380, r = size / 2;
    var svg = d3.select(host).append('svg').attr('viewBox', [-r, -r, size, size]).attr('aria-hidden', 'true');
    var macroData = MACROS.map(function (m) { return { m: m, n: ENTRIES.filter(function (e) { return e.macro === m; }).length }; });
    var catData = catOrder.map(function (id, i) { return { id: id, m: CATS[id].macro, n: catCount[id], i: i }; });
    var pie = d3.pie().sort(null).value(function (d) { return d.n; }).padAngle(0.012);
    var inner = d3.arc().innerRadius(r * 0.36).outerRadius(r * 0.58).cornerRadius(3);
    var outer = d3.arc().innerRadius(r * 0.62).outerRadius(r * 0.96).cornerRadius(3);

    var gIn = svg.append('g'), gOut = svg.append('g');
    var inArcs = gIn.selectAll('path').data(pie(macroData)).join('path')
      .attr('class', 'arc').style('fill', function (d) { return MVAR[d.data.m]; })
      .style('stroke', 'var(--bg)').style('stroke-width', 2);
    var outArcs = gOut.selectAll('path').data(pie(catData)).join('path')
      .attr('class', 'arc').style('fill', function (d) { return MVAR[d.data.m]; })
      .style('fill-opacity', function (d, i) { return i % 2 ? 0.62 : 0.88; })
      .style('stroke', 'var(--bg)').style('stroke-width', 2)
      .attr('tabindex', 0).attr('role', 'button')
      .attr('aria-label', function (d) { return CATS[d.data.id].label + ', ' + d.data.n + ' words. Open in the list.'; });

    var cNum = svg.append('text').attr('class', 'ring-centre-num').attr('text-anchor', 'middle').attr('y', 6).style('font-size', '44px').text(ENTRIES.length);
    var cLab = svg.append('text').attr('class', 'ring-centre-lab').attr('text-anchor', 'middle').attr('y', 30).style('font-size', '13px').text('stop words');

    function setCentre(n, lab) { cNum.text(n); cLab.text(lab); }
    function focusCat(id) {
      d3.select(host).classed('dimmed', !!id);
      outArcs.classed('hot', function (d) { return d.data.id === id; });
      inArcs.classed('hot', function (d) { return id && d.data.m === CATS[id].macro; });
      if (id) setCentre(catCount[id], CATS[id].label.length > 24 ? CATS[id].label.slice(0, 22) + '…' : CATS[id].label);
      else setCentre(ENTRIES.length, 'stop words');
    }
    ringHover = focusCat;

    outArcs.on('pointerenter', function (ev, d) {
      focusCat(d.data.id); barHover(d.data.id);
      showTip('<b>' + esc(CATS[d.data.id].label) + '</b><br>' + d.data.n + ' words, ' + (100 * d.data.n / ENTRIES.length).toFixed(1) + '% of the list<br><span class="t-muted">' + esc(CATS[d.data.id].description) + '</span>', ev);
    }).on('pointermove', function (ev, d) { showTip(tip.innerHTML, ev); })
      .on('pointerleave', function () { focusCat(null); barHover(null); hideTip(); })
      .on('click', function (ev, d) { hideTip(); openCategory(d.data.id); })
      .on('keydown', function (ev, d) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openCategory(d.data.id); } })
      .on('focus', function (ev, d) { focusCat(d.data.id); }).on('blur', function () { focusCat(null); });
    inArcs.on('pointerenter', function (ev, d) {
      d3.select(host).classed('dimmed', true);
      outArcs.classed('hot', function (o) { return o.data.m === d.data.m; });
      inArcs.classed('hot', function (o) { return o.data.m === d.data.m; });
      setCentre(d.data.n, d.data.m);
      showTip('<b>' + esc(d.data.m) + '</b><br>' + d.data.n + ' words, ' + (100 * d.data.n / ENTRIES.length).toFixed(1) + '%', ev);
    }).on('pointermove', function (ev) { showTip(tip.innerHTML, ev); })
      .on('pointerleave', function () { focusCat(null); hideTip(); });

    function grow() {
      var dur = REDUCED ? 0 : 1400;
      [[inArcs, inner], [outArcs, outer]].forEach(function (pair, k) {
        pair[0].transition().delay(k * 250).duration(dur).ease(d3.easeCubicOut).attrTween('d', function (d) {
          var i = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d);
          return function (t) { return pair[1](i(t)); };
        });
      });
    }
    inArcs.attr('d', function (d) { return inner({ startAngle: d.startAngle, endAngle: d.startAngle }); });
    outArcs.attr('d', function (d) { return outer({ startAngle: d.startAngle, endAngle: d.startAngle }); });
    onReveal(host, grow);

    var legend = document.createElement('div');
    legend.className = 'legend';
    legend.innerHTML = MACROS.map(function (m) { return '<span><i style="--c:' + MVAR[m] + '"></i>' + esc(m) + '</span>'; }).join('');
    host.parentNode.parentNode.insertBefore(legend, host.parentNode);
  })();

  (function bars() {
    var host = $('#bar-chart'); if (!d3 || !host) return;
    var rowH = 23, gap = 10, labelW = 250, W = 600, valPad = 34;
    var rows = [], y = 0, prev = null;
    catOrder.forEach(function (id) {
      if (prev && CATS[id].macro !== CATS[prev].macro) y += gap;
      rows.push({ id: id, y: y }); y += rowH; prev = id;
    });
    var H = y + 26;
    var x = d3.scaleLinear().domain([0, 32]).range([labelW, W - valPad]);
    var svg = d3.select(host).append('svg').attr('viewBox', [0, 0, W, H]).attr('role', 'img').attr('aria-label', 'Bar chart of stop words in each of the 17 categories');
    svg.append('g').attr('class', 'grid').selectAll('line').data([10, 20, 30]).join('line')
      .attr('x1', x).attr('x2', x).attr('y1', 0).attr('y2', y);
    svg.append('g').attr('class', 'axis').attr('transform', 'translate(0,' + (y + 4) + ')')
      .call(d3.axisBottom(x).tickValues([0, 10, 20, 30]).tickSize(0).tickPadding(8)).call(function (g) { g.select('.domain').remove(); });

    var g = svg.selectAll('g.bar-row').data(rows).join('g').attr('class', 'bar-row')
      .attr('transform', function (d) { return 'translate(0,' + d.y + ')'; });
    g.append('rect').attr('x', 0).attr('y', 0).attr('width', W).attr('height', rowH).style('fill', 'transparent');
    g.append('text').attr('class', 'bar-label').attr('x', labelW - 10).attr('y', rowH / 2).attr('dy', '.35em').attr('text-anchor', 'end')
      .text(function (d) { return CATS[d.id].label; });
    var rects = g.append('rect').attr('x', x(0)).attr('y', 4).attr('height', rowH - 8).attr('rx', 3)
      .style('fill', function (d) { return MVAR[CATS[d.id].macro]; }).attr('width', 0);
    var vals = g.append('text').attr('class', 'bar-value').attr('y', rowH / 2).attr('dy', '.35em')
      .attr('x', x(0) + 6).text(function (d) { return catCount[d.id]; }).style('opacity', 0);

    barHover = function (id) { g.classed('hot', function (d) { return d.id === id; }); };
    g.on('pointerenter', function (ev, d) {
      barHover(d.id); ringHover(d.id);
      var ex = ENTRIES.filter(function (e) { return e.category_id === d.id; }).slice(0, 6).map(function (e) { return e.roman; }).join(', ');
      showTip('<b>' + esc(CATS[d.id].label) + '</b>: ' + catCount[d.id] + '<br><span class="t-muted">' + esc(ex) + '…</span>', ev);
    }).on('pointermove', function (ev) { showTip(tip.innerHTML, ev); })
      .on('pointerleave', function () { barHover(null); ringHover(null); hideTip(); })
      .on('click', function (ev, d) { hideTip(); openCategory(d.id); });

    onReveal(host, function () {
      var dur = REDUCED ? 0 : 900;
      rects.transition().delay(function (d, i) { return REDUCED ? 0 : 300 + i * 40; }).duration(dur).ease(d3.easeCubicOut)
        .attr('width', function (d) { return x(catCount[d.id]) - x(0); });
      vals.transition().delay(function (d, i) { return REDUCED ? 0 : 300 + i * 40; }).duration(dur).ease(d3.easeCubicOut)
        .attr('x', function (d) { return x(catCount[d.id]) + 6; }).style('opacity', 1);
    });
  })();

  /* ---- data tables behind the figures ---- */
  (function tables() {
    var fam = '<table><thead><tr><th>Family</th><th>Category</th><th class="num">Words</th><th class="num">Share</th></tr></thead><tbody>';
    catOrder.forEach(function (id) {
      fam += '<tr><td>' + esc(CATS[id].macro) + '</td><td>' + esc(CATS[id].label) + '</td><td class="num">' + catCount[id] + '</td><td class="num">' + (100 * catCount[id] / ENTRIES.length).toFixed(1) + '%</td></tr>';
    });
    fam += '<tr><th>Total</th><th></th><th class="num">' + ENTRIES.length + '</th><th class="num">100%</th></tr></tbody></table>';
    $('#table-families').innerHTML = fam;

    var reg = '<table><thead><tr><th>Family</th><th class="num">Cholito</th><th class="num">Sadhu</th><th class="num">Regional</th></tr></thead><tbody>';
    MACROS.forEach(function (m) {
      var c = function (r) { return ENTRIES.filter(function (e) { return e.macro === m && e.register === r; }).length; };
      reg += '<tr><td>' + esc(m) + '</td><td class="num">' + c('C') + '</td><td class="num">' + c('S') + '</td><td class="num">' + c('R') + '</td></tr>';
    });
    reg += '</tbody></table>';
    $('#table-register').innerHTML = reg;

    $$('[data-table]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var t = document.getElementById('table-' + btn.dataset.table);
        t.hidden = !t.hidden;
        btn.textContent = t.hidden ? 'Show as a table' : 'Hide the table';
      });
    });
  })();

  /* ---- Figure 2: pronoun paradigm ---- */
  (function paradigm() {
    var host = $('#paradigm'); if (!host) return;
    var cols = D.paradigm.columns, rows = D.paradigm.rows, script = 'roman';
    function form(r) { var e = BY_ROMAN[r]; return script === 'bn' && e ? e.bengali : r; }
    function render() {
      var h = '<table><thead><tr><th></th>' + cols.map(function (c, j) { return '<th data-c="' + j + '">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
      Object.keys(rows).forEach(function (rk, i) {
        h += '<tr><th data-r="' + i + '">' + esc(rk) + '</th>';
        rows[rk].forEach(function (cell, j) {
          var f = cell.split(' ');
          h += '<td data-r="' + i + '" data-c="' + j + '" data-forms="' + esc(cell) + '" class="' + (f.length > 1 ? 'two' : '') + '"' + (script === 'bn' ? ' lang="bn"' : '') + '>' +
            esc(form(f[0])) + (f[1] ? '<span class="alt">' + esc(form(f[1])) + '</span>' : '') + '</td>';
        });
        h += '</tr>';
      });
      host.innerHTML = h + '</tbody></table>';
      host.classList.toggle('bn', script === 'bn');
    }
    render();
    host.addEventListener('pointerover', function (ev) {
      var td = ev.target.closest('td'); if (!td) return;
      var r = td.dataset.r, c = td.dataset.c;
      $$('td, th', host).forEach(function (n) {
        n.classList.remove('lit', 'lit-rc');
        if (n.tagName === 'TD' && (n.dataset.r === r || n.dataset.c === c)) n.classList.add('lit-rc');
        if (n.tagName === 'TH' && (n.dataset.r === r || n.dataset.c === c)) n.classList.add('lit');
      });
      td.classList.remove('lit-rc'); td.classList.add('lit');
      var info = td.dataset.forms.split(' ').map(function (f) {
        var e = BY_ROMAN[f];
        return '<b>' + esc(f) + '</b> <span class="t-bn" lang="bn">' + esc(e ? e.bengali : '') + '</span><br><span class="t-muted">' + esc(e ? e.gloss + (e.register === 'S' ? ' · literary' : '') : '') + '</span>';
      }).join('<br>');
      showTip(info, ev);
    });
    host.addEventListener('pointermove', function (ev) { if (!tip.hidden) showTip(tip.innerHTML, ev); });
    host.addEventListener('pointerleave', function () { $$('.lit, .lit-rc', host).forEach(function (n) { n.classList.remove('lit', 'lit-rc'); }); hideTip(); });
    $$('#fig-paradigm .seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        script = b.dataset.script;
        $$('#fig-paradigm .seg button').forEach(function (o) { o.classList.toggle('on', o === b); o.setAttribute('aria-pressed', String(o === b)); });
        render();
      });
    });
  })();

  /* ---- Figure 3: correlatives ---- */
  (function correlatives() {
    var host = $('#correl'); if (!host) return;
    var heads = [['k', 'Question'], ['j', 'Relative'], ['t / s', 'Answering'], ['e', 'Near'], ['o', 'Far']];
    // [romanised, Bengali if absent from the list]; null = no common form
    var T = [
      ['Person', ['ke'], ['je'], ['se'], ['e', 'এ'], ['o']],
      ['Time', ['kokhon', 'কখন'], ['jokhon'], ['tokhon'], ['ekhon'], null],
      ['Place', ['kothay'], ['jekhane'], ['sekhane'], ['ekhane'], ['okhane']],
      ['Amount', ['koto'], ['joto'], ['toto'], ['eto', 'এত'], ['oto', 'অত']],
      ['Manner', ['kemon'], ['jemon'], ['temon'], ['emon'], ['omon', 'অমন']],
      ['Duration', ['kotokhon', 'কতক্ষণ'], ['jotokhon'], ['totokhon'], ['etokhon', 'এতক্ষণ'], ['otokhon', 'অতক্ষণ']],
      ['Thing (-ta)', ['konta'], ['jeta'], ['seta'], ['eta'], ['ota']],
      ['Thing (-ti)', ['konti'], ['jeti'], ['seti'], ['eti'], ['oti']],
      ['Things (-gulo)', ['kongulo', 'কোনগুলো'], ['jegulo'], ['segulo'], ['egulo'], ['ogulo']],
      ['Kind (literary)', ['kirup', 'কীরূপ'], ['jerup', 'যেরূপ'], ['serup', 'সেরূপ'], ['erup'], ['orup']]
    ];
    var h = '<table><thead><tr><th></th>' + heads.map(function (x) { return '<th><b>' + x[0] + '-</b>' + x[1] + '</th>'; }).join('') + '</tr></thead><tbody>';
    var inN = 0, outN = 0;
    T.forEach(function (row) {
      h += '<tr><th>' + esc(row[0]) + '</th>';
      for (var j = 1; j < row.length; j++) {
        var c = row[j];
        if (!c) { h += '<td class="none" title="No common form">·</td>'; continue; }
        var e = BY_ROMAN[c[0]];
        if (e) { inN++; h += '<td class="in" data-r="' + esc(c[0]) + '"><span class="bn" lang="bn">' + esc(e.bengali) + '</span><span class="ro">' + esc(c[0]) + '</span></td>'; }
        else { outN++; h += '<td class="out" data-out="' + esc(c[0]) + '"><span class="bn" lang="bn">' + esc(c[1] || '') + '</span><span class="ro">' + esc(c[0]) + '</span></td>'; }
      }
      h += '</tr>';
    });
    host.innerHTML = h + '</tbody></table>';
    var cap = $('#fig-correlatives figcaption');
    cap.textContent = 'Figure 3. The correlative table. ' + inN + ' filled cells are in the list; ' + outN + ' outlined cells show forms the list does not yet include. A dot marks a slot with no common form.';
    host.addEventListener('pointerover', function (ev) {
      var td = ev.target.closest('td'); if (!td) return;
      if (td.dataset.r) { var e = BY_ROMAN[td.dataset.r]; showTip('<b>' + esc(e.roman) + '</b> <span class="t-bn" lang="bn">' + esc(e.bengali) + '</span><br><span class="t-muted">' + esc(e.gloss) + '</span>', ev); }
      else if (td.dataset.out) showTip('<b>' + esc(td.dataset.out) + '</b><br><span class="t-muted">Not in the list yet</span>', ev);
      else hideTip();
    });
    host.addEventListener('pointermove', function (ev) { if (!tip.hidden) showTip(tip.innerHTML, ev); });
    host.addEventListener('pointerleave', hideTip);
  })();

  /* ---- Figure 4: register ---- */
  (function register() {
    var host = $('#register-chart'); if (!d3 || !host) return;
    var regs = [['C', 'Cholito (standard colloquial)', 'var(--muted)', 0.45], ['S', 'Sadhu (literary)', 'var(--lamp)', 1], ['R', 'Regional', 'var(--m4)', 1]];
    var W = 640, rowH = 34, labelW = 150, H = MACROS.length * (rowH + 10) + 30;
    var max = d3.max(MACROS, function (m) { return ENTRIES.filter(function (e) { return e.macro === m; }).length; });
    var x = d3.scaleLinear().domain([0, max]).range([labelW, W - 20]);
    var legend = document.createElement('div'); legend.className = 'legend';
    legend.innerHTML = regs.map(function (r) { return '<span><i style="--c:' + r[2] + ';opacity:' + r[3] + '"></i>' + r[1] + '</span>'; }).join('');
    host.appendChild(legend);
    var svg = d3.select(host).append('svg').attr('viewBox', [0, 0, W, H]).attr('role', 'img').attr('aria-label', 'Stacked bars of register within each family');
    var segs = [];
    MACROS.forEach(function (m, i) {
      var y = i * (rowH + 10), left = 0;
      svg.append('text').attr('class', 'bar-label').attr('x', labelW - 10).attr('y', y + rowH / 2).attr('dy', '.35em').attr('text-anchor', 'end').text(m);
      regs.forEach(function (r) {
        var n = ENTRIES.filter(function (e) { return e.macro === m && e.register === r[0]; }).length;
        if (!n) return;
        segs.push({ m: m, r: r, n: n, y: y, x0: left });
        left += n;
      });
    });
    var rects = svg.selectAll('rect.seg').data(segs).join('rect').attr('class', 'seg')
      .attr('y', function (d) { return d.y; }).attr('height', rowH).attr('rx', 3)
      .attr('x', function (d) { return x(d.x0) + 1; }).attr('width', 0)
      .style('fill', function (d) { return d.r[2]; }).style('fill-opacity', function (d) { return d.r[3]; })
      .on('pointerenter pointermove', function (ev, d) {
        var ex = ENTRIES.filter(function (e) { return e.macro === d.m && e.register === d.r[0]; }).slice(0, 8).map(function (e) { return e.roman; }).join(', ');
        showTip('<b>' + esc(d.m) + '</b>, ' + esc(d.r[1]) + ': ' + d.n + '<br><span class="t-muted">' + esc(ex) + (d.n > 8 ? '…' : '') + '</span>', ev);
      }).on('pointerleave', hideTip);
    var labels = svg.selectAll('text.seg-v').data(segs.filter(function (d) { return d.r[0] !== 'C' || true; })).join('text')
      .attr('class', 'bar-value').attr('y', function (d) { return d.y + rowH / 2; }).attr('dy', '.35em')
      .attr('text-anchor', 'middle').style('opacity', 0)
      .attr('x', function (d) { return x(d.x0 + d.n / 2); })
      .text(function (d) { return x(d.x0 + d.n) - x(d.x0) > 22 ? d.n : ''; });
    onReveal(host, function () {
      rects.transition().duration(REDUCED ? 0 : 900).ease(d3.easeCubicOut).attr('width', function (d) { return Math.max(0, x(d.x0 + d.n) - x(d.x0) - 2); });
      labels.transition().delay(REDUCED ? 0 : 600).duration(REDUCED ? 0 : 500).style('opacity', 1);
    });
  })();

  /* ---- Figure 5: length ---- */
  (function lengths() {
    var host = $('#length-chart'); if (!d3 || !host) return;
    var counts = d3.rollup(ENTRIES, function (v) { return v; }, function (e) { return e.length; });
    var ks = d3.range(1, d3.max(ENTRIES, function (e) { return e.length; }) + 1);
    var W = 560, H = 260, m = { t: 20, r: 10, b: 36, l: 34 };
    var x = d3.scaleBand().domain(ks).range([m.l, W - m.r]).padding(0.22);
    var y = d3.scaleLinear().domain([0, d3.max(ks, function (k) { return (counts.get(k) || []).length; })]).nice().range([H - m.b, m.t]);
    var svg = d3.select(host).append('svg').attr('viewBox', [0, 0, W, H]).attr('role', 'img').attr('aria-label', 'Histogram of word length in letters');
    svg.append('g').attr('class', 'grid').selectAll('line').data(y.ticks(4)).join('line')
      .attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
    svg.append('g').attr('class', 'axis').attr('transform', 'translate(0,' + (H - m.b) + ')').call(d3.axisBottom(x).tickSize(0).tickPadding(8)).call(function (g) { g.select('.domain').remove(); });
    svg.append('g').attr('class', 'axis').attr('transform', 'translate(' + m.l + ',0)').call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(8)).call(function (g) { g.select('.domain').remove(); });
    svg.append('text').attr('class', 'ring-centre-lab').attr('x', (W + m.l) / 2).attr('y', H - 2).attr('text-anchor', 'middle').style('font-size', '12px').text('letters in the romanised form');
    var b = svg.selectAll('rect.b').data(ks).join('rect').attr('class', 'b')
      .attr('x', function (k) { return x(k); }).attr('width', x.bandwidth()).attr('rx', 3)
      .attr('y', H - m.b).attr('height', 0).style('fill', 'var(--m1)')
      .on('pointerenter pointermove', function (ev, k) {
        var v = counts.get(k) || [];
        showTip('<b>' + k + ' letter' + (k > 1 ? 's' : '') + '</b>: ' + v.length + ' words<br><span class="t-muted">' + esc(v.slice(0, 10).map(function (e) { return e.roman; }).join(', ')) + (v.length > 10 ? '…' : '') + '</span>', ev);
      }).on('pointerleave', hideTip);
    var lbl = svg.selectAll('text.v').data(ks).join('text').attr('class', 'bar-value').attr('text-anchor', 'middle')
      .attr('x', function (k) { return x(k) + x.bandwidth() / 2; }).attr('y', function (k) { return y((counts.get(k) || []).length) - 6; })
      .text(function (k) { return (counts.get(k) || []).length; }).style('opacity', 0);
    onReveal(host, function () {
      b.transition().delay(function (k, i) { return REDUCED ? 0 : i * 50; }).duration(REDUCED ? 0 : 800).ease(d3.easeCubicOut)
        .attr('y', function (k) { return y((counts.get(k) || []).length); })
        .attr('height', function (k) { return H - m.b - y((counts.get(k) || []).length); });
      lbl.transition().delay(REDUCED ? 0 : 700).duration(REDUCED ? 0 : 400).style('opacity', 1);
    });
  })();

  /* ---- Figure 6: live filter ---- */
  (function tryIt() {
    var ta = $('#try-text'); if (!ta) return;
    // Built only from the 317 entries: each spelling (romanised or Bengali
    // script) points back to the entries it belongs to.
    var LOOKUP = {}, PHRASES = {};
    ENTRIES.forEach(function (e) {
      [e.roman, e.bengali].forEach(function (w) {
        if (!w) return;
        w = norm(w);
        var bucket = w.indexOf(' ') > -1 ? PHRASES : LOOKUP;
        bucket[w] = bucket[w] || [];
        if (bucket[w].indexOf(e) < 0) bucket[w].push(e);
      });
    });
    var SAMPLES = {
      bn: D.summary.sample_text,
      roman: 'ami jokhon prothome Dhanbad e eshechhilam, tokhon shohorta amar kachhe ektu ochena mone hoyechhilo. kintu koyek diner modhye sobkichu bodle gelo. ekhon ami roj sokale library r dike hati, ar sekhane purono boier patar modhye nijer jonno ekta shanto kon khunje pai. hoyto ei karone shohortake ekhon ar ochena lage na.'
    };
    ta.value = SAMPLES.bn;
    var WORD = /([ঀ-৿‌‍A-Za-z]+)/;

    function run() {
      var text = ta.value.normalize('NFC');
      // Only words that belong to the 317-entry dataset are ever shown.
      // Every other word in the input is skipped and never displayed.
      var parts = text.split(WORD), hits = 0, found = [], foundBy = {};
      function mark(entries) {
        hits++;
        var key = entries.map(function (e) { return e.roman; }).join(' / ');
        if (!foundBy[key]) { foundBy[key] = { entries: entries, n: 0 }; found.push(foundBy[key]); }
        foundBy[key].n++;
      }
      for (var i = 1; i < parts.length; i += 2) {
        var w = parts[i].toLowerCase();
        // two-word entries such as "sathe sathe"
        if (i + 2 < parts.length && /^\s+$/.test(parts[i + 1])) {
          var pair = w + ' ' + parts[i + 2].toLowerCase();
          if (PHRASES[pair]) { mark(PHRASES[pair]); i += 2; continue; }
        }
        if (LOOKUP[w]) mark(LOOKUP[w]);
      }
      var share = 100 * found.length / ENTRIES.length;
      $('#try-stats').innerHTML =
        '<span><b>' + hits + '</b>matches</span><span><b>' + found.length + '</b>of the ' + ENTRIES.length + ' stop words</span>' +
        '<span class="try-meter" aria-hidden="true"><span style="width:' + share.toFixed(1) + '%"></span></span>';
      $('#try-found').innerHTML = found.length ? found.map(function (f) {
        var bn = f.entries[0].bengali;
        return '<span>' + (bn ? '<b lang="bn">' + esc(bn) + '</b>' : '') +
          '<i>' + esc(f.entries.map(function (e) { return e.roman; }).join(' / ')) + '</i>' +
          (f.n > 1 ? '<small>×' + f.n + '</small>' : '') + '</span>';
      }).join('') : '<em>' + (text.trim() ? 'None of the 317 stop words appears in this text.' : 'Type or paste some Bengali text.') + '</em>';
    }
    var t;
    ta.addEventListener('input', function () { clearTimeout(t); t = setTimeout(run, 120); });
    $$('#fig-try .seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        ta.value = SAMPLES[b.dataset.sample];
        $$('#fig-try .seg button').forEach(function (o) { o.classList.toggle('on', o === b); o.setAttribute('aria-pressed', String(o === b)); });
        run();
      });
    });
    run();
  })();

  /* ---- reveal figures as they enter the page ---- */
  (function reveal() {
    var figs = $$('.figure');
    if (!('IntersectionObserver' in window)) { revealers.forEach(function (r) { r.fn(); }); return; }
    figs.forEach(function (f) { f.classList.add('pending'); });
    var io = new IntersectionObserver(function (items) {
      items.forEach(function (it) {
        if (!it.isIntersecting) return;
        it.target.classList.remove('pending');
        revealers.forEach(function (r) { if (!r.done && it.target.contains(r.el)) { r.done = true; r.fn(); } });
        io.unobserve(it.target);
      });
    }, { threshold: 0.15 });
    figs.forEach(function (f) { io.observe(f); });
  })();

  /* ==========================================================
     CITATION MACHINE
     ========================================================== */
  (function citer() {
    var META = {
      family: 'Nandi', given: 'Simanta', initials: 'S.',
      title: 'The Words We Read Past: Bengali Stop Words for Natural Language Processing',
      sentence: 'The words we read past: Bengali stop words for natural language processing',
      year: '2026', version: '1.0',
      dept: 'Department of Humanities and Social Sciences',
      inst: 'Indian Institute of Technology (Indian School of Mines) Dhanbad',
      instShort: 'IIT (ISM) Dhanbad', place: 'Dhanbad',
      url: 'https://simantadh.github.io/bengalistopwords/',
      repo: 'https://github.com/SimantaDH/bengalistopwords'
    };
    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var MSHORT = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
    var IEEEM = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
    var VANM = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    var STYLES = [
      ['apa', 'APA 7'], ['mla', 'MLA 9'], ['chicago', 'Chicago (notes)'], ['chicago-ad', 'Chicago (author-date)'],
      ['harvard', 'Harvard'], ['ieee', 'IEEE'], ['vancouver', 'Vancouver'], ['bibtex', 'BibTeX'], ['ris', 'RIS']
    ];
    var state = { style: 'apa', type: 'web', date: new Date() };
    var dateIn = $('#cite-date'), typeIn = $('#cite-type');
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
    dateIn.value = iso(state.date);

    function build() {
      var d = state.date, dd = d.getDate(), mm = d.getMonth(), yy = d.getFullYear();
      var t = state.type, M = META;
      var apaDesc = { web: 'Website', dataset: 'Data set', software: 'Computer software' }[t];
      var harvDesc = { web: '', dataset: ' [Dataset]', software: ' [Computer program]' }[t];
      var ieeeDesc = { web: 'Online', dataset: 'Dataset', software: 'Software' }[t];
      var risType = { web: 'ELEC', dataset: 'DATA', software: 'COMP' }[t];
      var ver = t === 'web' ? '' : ' (Version ' + M.version + ')';
      switch (state.style) {
        case 'apa':
          return { html: M.family + ', ' + M.initials + ' (' + M.year + '). <i>' + M.sentence + '</i>' + ver + ' [' + apaDesc + ']. ' + M.dept + ', ' + M.inst + '. Retrieved ' + MONTHS[mm] + ' ' + dd + ', ' + yy + ', from ' + M.url };
        case 'mla':
          return { html: M.family + ', ' + M.given + '. <i>' + M.title + '</i>. ' + (t === 'web' ? '' : 'Version ' + M.version + ', ') + M.dept + ', ' + M.inst + ', ' + M.year + ', ' + M.url.replace('https://', '') + '. Accessed ' + dd + ' ' + MSHORT[mm] + ' ' + yy + '.' };
        case 'chicago':
          return { html: '<span style="display:block;margin-bottom:.8rem"><b>Bibliography</b><br>' + M.family + ', ' + M.given + '. <i>' + M.title + '</i>.' + (t === 'web' ? '' : ' Version ' + M.version + '.') + ' ' + M.place + ': ' + M.dept + ', ' + M.inst + ', ' + M.year + '. Accessed ' + MONTHS[mm] + ' ' + dd + ', ' + yy + '. ' + M.url + '.</span>' +
            '<span style="display:block"><b>Note</b><br>1. ' + M.given + ' ' + M.family + ', <i>' + M.title + '</i> (' + M.place + ': ' + M.dept + ', ' + M.inst + ', ' + M.year + '), ' + M.url + '.</span>' };
        case 'chicago-ad':
          return { html: M.family + ', ' + M.given + '. ' + M.year + '. <i>' + M.title + '</i>.' + (t === 'web' ? '' : ' Version ' + M.version + '.') + ' ' + M.place + ': ' + M.dept + ', ' + M.inst + '. Accessed ' + MONTHS[mm] + ' ' + dd + ', ' + yy + '. ' + M.url + '.' };
        case 'harvard':
          return { html: M.family + ', ' + M.initials + ' (' + M.year + ') <i>' + M.sentence + '</i>' + harvDesc + '. ' + (t === 'web' ? '' : 'Version ' + M.version + '. ') + M.place + ': ' + M.dept + ', ' + M.inst + '. Available at: ' + M.url + ' (Accessed: ' + dd + ' ' + MONTHS[mm] + ' ' + yy + ').' };
        case 'ieee':
          return { html: '[1] S. ' + M.family + ', "' + M.sentence.charAt(0).toUpperCase() + M.sentence.slice(1) + '," Dept. of Humanities and Social Sciences, ' + M.instShort + ', ' + M.place + ', India, ' + M.year + (t === 'web' ? '' : ', ver. ' + M.version) + '. [' + ieeeDesc + ']. Available: ' + M.url + ' (accessed ' + IEEEM[mm] + ' ' + dd + ', ' + yy + ').' };
        case 'vancouver':
          return { html: M.family + ' ' + M.initials.replace('.', '') + '. ' + M.sentence.charAt(0).toUpperCase() + M.sentence.slice(1) + ' [Internet]. ' + M.place + ': ' + M.dept + ', ' + M.inst + '; ' + M.year + ' [cited ' + yy + ' ' + VANM[mm] + ' ' + dd + ']. Available from: ' + M.url };
        case 'bibtex':
          var kind = t === 'software' ? '@software' : (t === 'dataset' ? '@dataset' : '@misc');
          return { mono: true, file: 'nandi2026words.bib', mime: 'application/x-bibtex', text:
            kind + '{nandi2026words,\n' +
            '  author       = {Nandi, Simanta},\n' +
            '  title        = {The Words We Read Past: {B}engali Stop Words for Natural Language Processing},\n' +
            '  year         = {' + M.year + '},\n' +
            (t === 'web' ? '' : '  version      = {' + M.version + '},\n') +
            '  institution  = {' + M.dept + ', ' + M.inst + '},\n' +
            '  address      = {' + M.place + ', India},\n' +
            '  url          = {' + M.url + '},\n' +
            '  urldate      = {' + iso(d) + '},\n' +
            '  note         = {Source code: ' + M.repo + '. Licensed under CC BY-NC 4.0}\n}' };
        case 'ris':
          return { mono: true, file: 'nandi2026words.ris', mime: 'application/x-research-info-systems', text:
            'TY  - ' + risType + '\nAU  - Nandi, Simanta\nTI  - ' + M.title + '\nPY  - ' + M.year + '\nPB  - ' + M.dept + ', ' + M.inst +
            '\nCY  - ' + M.place + ', India\n' + (t === 'web' ? '' : 'ET  - ' + M.version + '\n') + 'UR  - ' + M.url + '\nY2  - ' + iso(d) + '\nN1  - Licensed under CC BY-NC 4.0\nER  - ' };
      }
    }

    var out = $('#cite-text'), dl = $('#cite-download'), copyBtn = $('#cite-copy');
    function render() {
      var c = build();
      out.classList.toggle('mono', !!c.mono);
      if (c.mono) out.textContent = c.text; else out.innerHTML = c.html;
      dl.hidden = !c.file;
      dl.textContent = c.file ? 'Download .' + c.file.split('.').pop() : '';
      $$('#cite-tabs button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.style === state.style)); b.tabIndex = b.dataset.style === state.style ? 0 : -1; });
    }

    var tabs = $('#cite-tabs');
    STYLES.forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.style = s[0]; b.textContent = s[1];
      b.setAttribute('aria-controls', 'cite-panel');
      b.addEventListener('click', function () { state.style = s[0]; render(); });
      tabs.appendChild(b);
    });
    tabs.addEventListener('keydown', function (ev) {
      if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
      var i = STYLES.findIndex(function (s) { return s[0] === state.style; });
      i = (i + (ev.key === 'ArrowRight' ? 1 : -1) + STYLES.length) % STYLES.length;
      state.style = STYLES[i][0]; render(); $('button[data-style="' + state.style + '"]', tabs).focus();
    });
    typeIn.addEventListener('change', function () { state.type = typeIn.value; render(); });
    dateIn.addEventListener('change', function () {
      var p = dateIn.value.split('-');
      if (p.length === 3) { state.date = new Date(+p[0], +p[1] - 1, +p[2]); render(); }
    });

    copyBtn.addEventListener('click', function () {
      var c = build();
      var plain = c.mono ? c.text : out.innerText;
      var done = function () { copyBtn.textContent = 'Copied'; copyBtn.classList.add('done'); setTimeout(function () { copyBtn.textContent = 'Copy reference'; copyBtn.classList.remove('done'); }, 1800); };
      if (!c.mono && window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
        navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([out.innerHTML], { type: 'text/html' }), 'text/plain': new Blob([plain], { type: 'text/plain' }) })]).then(done, function () { copyText(plain, done); });
      } else copyText(plain, done);
    });
    dl.addEventListener('click', function () {
      var c = build(); if (!c.file) return;
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([c.text], { type: c.mime }));
      a.download = c.file; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    });
    render();
  })();

  /* ---------------- copy helpers ---------------- */
  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, fallback); }
    else fallback();
    function fallback() {
      var t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      t.remove();
    }
  }
  $$('.copy-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      copyText(document.getElementById(b.dataset.copy).innerText, function () {
        b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600);
      });
    });
  });

  /* ---------------- portrait: a small lamp ---------------- */
  var portrait = $('#portrait');
  if (portrait) {
    portrait.addEventListener('pointermove', function (e) {
      var r = portrait.getBoundingClientRect();
      portrait.style.setProperty('--px', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      portrait.style.setProperty('--py', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
    portrait.addEventListener('pointerleave', function () { portrait.style.setProperty('--px', '50%'); portrait.style.setProperty('--py', '36%'); });
  }
})();
