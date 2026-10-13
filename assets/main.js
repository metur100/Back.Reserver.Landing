/* BackReserve landing page – interactions and scroll animations.
   Vanilla JS, no dependencies, no tracking, no third-party requests.
   Everything degrades gracefully: without JS or with reduced motion the page is static and complete. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var body = document.body;
  var reduced = doc.classList.contains('reduced');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Text splitting ---------- */
  function splitText(el, mode) {
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    var ci = 0, wi = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span');
            w.className = 'w';
            if (mode === 'chars') {
              Array.from(part).forEach(function (c) {
                var s = document.createElement('span');
                s.className = 'ch';
                s.style.setProperty('--ci', ci++);
                s.textContent = c;
                w.appendChild(s);
              });
            } else {
              var s = document.createElement('span');
              s.className = 'wi';
              s.style.setProperty('--wi', wi++);
              s.textContent = part;
              w.appendChild(s);
            }
            frag.appendChild(w);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.namespaceURI !== 'http://www.w3.org/2000/svg') {
          walk(child);
        }
      });
    })(el);
    if (mode === 'chars' && !el.hasAttribute('aria-hidden')) {
      el.setAttribute('aria-label', label);
      $$('.w', el).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
    }
    // Gradient index for emphasised words
    $$('em', el).forEach(function (em) {
      var chars = $$('.ch', em);
      chars.forEach(function (c, i) { c.style.setProperty('--ei', chars.length > 1 ? (i / (chars.length - 1)).toFixed(3) : 0); });
    });
  }
  $$('[data-split]').forEach(function (el) { splitText(el, el.getAttribute('data-split')); });

  // Statement: words light up while scrolling
  $$('[data-words]').forEach(function (el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span');
            s.className = 'sw';
            s.style.setProperty('--i', i++);
            s.textContent = part;
            frag.appendChild(s);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          if (child.classList.contains('pill-ic')) { child.classList.add('sw'); child.style.setProperty('--i', i++); }
          else walk(child);
        }
      });
    })(el);
    el.style.setProperty('--n', i);
  });

  /* ---------- Decorative QR codes (not scannable; deterministic pattern) ---------- */
  function qrSvg(seed, animate) {
    var h = 2166136261;
    for (var k = 0; k < seed.length; k++) { h ^= seed.charCodeAt(k); h = Math.imul(h, 16777619); }
    var rnd = function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
    var n = 21, rects = [];
    var finder = function (x, y) {
      var dx = x < 7 ? x : x - (n - 7), dy = y < 7 ? y : y - (n - 7);
      if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null;
      return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
    };
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        var inFinder = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
        var on = inFinder ? finder(x, y) : rnd() > .52;
        if (on) rects.push('<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02"' + (animate ? ' style="--q:' + rnd().toFixed(2) + '"' : '') + '/>');
      }
    }
    return '<svg viewBox="0 0 21 21" fill="currentColor" aria-hidden="true">' + rects.join('') + '</svg>';
  }
  $$('[data-qr]').forEach(function (el) { el.innerHTML = qrSvg(el.getAttribute('data-qr'), el.classList.contains('qr-anim')); });

  /* ---------- Intro ---------- */
  var intro = $('.intro');
  var readyCallbacks = [];
  function ready() {
    doc.classList.add('is-ready');
    readyCallbacks.forEach(function (fn) { fn(); });
    readyCallbacks = [];
  }
  function onReady(fn) { if (doc.classList.contains('is-ready')) fn(); else readyCallbacks.push(fn); }
  if (intro && !reduced && !doc.classList.contains('no-intro')) {
    try { sessionStorage.setItem('br-intro', '1'); } catch (e) { /* ignore */ }
    doc.classList.add('intro-running');
    var clockEl = $('[data-intro-clock]', intro);
    var times = ['03:56', '03:57', '03:58', '03:59', '04:00'];
    var t = 0;
    var tick = setInterval(function () {
      t++;
      clockEl.textContent = times[t];
      if (t >= times.length - 1) {
        clearInterval(tick);
        setTimeout(function () {
          intro.classList.add('is-out');
          doc.classList.remove('intro-running');
          ready();
          setTimeout(function () { intro.remove(); }, 1100);
        }, 360);
      }
    }, 200);
  } else {
    if (intro) intro.remove();
    ready();
  }

  /* ---------- Navigation ---------- */
  var nav = $('[data-nav]');
  var navLinks = $$('.nav-links a');
  var menu = $('#menu');
  var toggle = $('.menu-toggle');
  var menuLabel = $('[data-menu-label]');
  var menuOpen = false;
  function setMenu(open) {
    if (!menu || open === menuOpen) return;
    menuOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    menuLabel.textContent = open ? 'Menü schließen' : 'Menü öffnen';
    doc.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('is-open'); }); });
      var first = $('a', menu);
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 50);
    } else {
      menu.classList.remove('is-open');
      setTimeout(function () { if (!menuOpen) menu.hidden = true; }, reduced ? 0 : 700);
    }
  }
  if (toggle) toggle.addEventListener('click', function () { setMenu(!menuOpen); });
  if (menu) menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) { setMenu(false); toggle.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1000) setMenu(false); });

  // "#top" targets a sticky element, which browsers don't scroll to reliably.
  $$('a[href="#top"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      history.replaceState(null, '', location.pathname + location.search);
    });
  });

  /* ---------- Theme per section ---------- */
  var themeMeta = $('meta[name="theme-color"]');
  var themeColors = { night: '#100C09', day: '#F6F0E7' };
  if ('IntersectionObserver' in window) {
    var themeIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var theme = entry.target.getAttribute('data-theme-section');
        if (body.getAttribute('data-theme') !== theme) {
          body.setAttribute('data-theme', theme);
          if (themeMeta) themeMeta.setAttribute('content', themeColors[theme] || '#100C09');
        }
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    $$('[data-theme-section]').forEach(function (s) { themeIO.observe(s); });

    // Active nav link
    var linkFor = {};
    navLinks.forEach(function (a) { linkFor[a.getAttribute('href').slice(1)] = a; });
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var a = linkFor[entry.target.id];
        if (a) a.classList.toggle('is-active', entry.isIntersecting);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(linkFor).forEach(function (id) { var s = document.getElementById(id); if (s) navIO.observe(s); });
  }

  /* ---------- Reveal on enter ---------- */
  function countUp(el) {
    var from = Number(el.getAttribute('data-from')), to = Number(el.getAttribute('data-to'));
    if (reduced) { el.textContent = String(to); return; }
    var start = performance.now(), dur = 1700;
    (function step(now) {
      var k = clamp((now - start) / dur);
      var e = 1 - Math.pow(1 - k, 4);
      el.textContent = String(Math.round(from + (to - from) * e));
      if (k < 1) requestAnimationFrame(step);
    })(start);
  }
  if (!reduced) $$('[data-count]').forEach(function (el) { el.textContent = el.getAttribute('data-from'); });

  var revealTargets = $$('[data-reveal], [data-reveal-words], [data-reveal-chars], [data-count]');
  if ('IntersectionObserver' in window && !reduced) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-in');
        if (el.hasAttribute('data-count')) countUp(el);
        revealIO.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealTargets.forEach(function (el) { revealIO.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); if (el.hasAttribute('data-count')) countUp(el); });
  }

  /* ---------- Feature cards: one-shot animations + looping stock demo ---------- */
  var fcards = $$('[data-fcard]');
  var stockViz = $('.viz-stock');
  var stockTimer = null, stockVisible = false;
  function runStock() {
    if (!stockViz || stockTimer) return;
    var countEl = $('.vs-count > span', stockViz);
    var cells = $$('.vs-grid i', stockViz);
    var left = cells.length;
    var reset = function () {
      left = cells.length;
      cells.forEach(function (c) { c.classList.remove('is-res'); });
      stockViz.classList.remove('is-sold');
      countEl.textContent = String(left);
    };
    reset();
    var step = function () {
      if (!stockVisible) { stockTimer = null; return; }
      if (left > 0) {
        left--;
        cells[cells.length - 1 - left].classList.add('is-res');
        countEl.textContent = String(left);
        if (left === 0) stockViz.classList.add('is-sold');
        stockTimer = setTimeout(step, left === 0 ? 2600 : 650);
      } else {
        reset();
        stockTimer = setTimeout(step, 900);
      }
    };
    stockTimer = setTimeout(step, 500);
  }
  if (stockViz) {
    $('.vs-count > span', stockViz).textContent = reduced ? '0' : '6';
    if (reduced) { $$('.vs-grid i', stockViz).forEach(function (c) { c.classList.add('is-res'); }); stockViz.classList.add('is-sold'); }
  }
  if ('IntersectionObserver' in window && !reduced) {
    var cardIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add('is-in');
        if (stockViz && entry.target.contains(stockViz)) {
          stockVisible = entry.isIntersecting;
          if (stockVisible) runStock();
        }
      });
    }, { threshold: 0.35 });
    fcards.forEach(function (c) { cardIO.observe(c); });
  } else {
    fcards.forEach(function (c) { c.classList.add('is-in'); });
  }

  /* ---------- Hero ---------- */
  var hero = $('.hero');
  var heroStage = $('[data-hero-stage]');
  var depthEls = $$('[data-depth]', heroStage || document).map(function (el) { return { el: el, d: Number(el.getAttribute('data-depth')) }; });
  var heroTitle = $('[data-proximity]');
  var heroChars = heroTitle ? $$('.ch', heroTitle).map(function (el) { return { el: el, x: 0, y: 0, w: 380, t: 380 }; }) : [];
  var pointer = { x: 0, y: 0, tx: 0, ty: 0, px: -9999, py: -9999, inside: false, active: false };
  var heroVisible = true;
  var heroPinnedMQ = window.matchMedia('(min-width: 900px) and (min-height: 640px)');

  function measureChars() {
    heroChars.forEach(function (c) {
      var r = c.el.getBoundingClientRect();
      c.x = r.left + r.width / 2; c.y = r.top + r.height / 2;
    });
  }
  if (hero && finePointer && !reduced) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      pointer.px = e.clientX; pointer.py = e.clientY;
      pointer.inside = true;
      hero.style.setProperty('--lx', (e.clientX - r.left).toFixed(0) + 'px');
      hero.style.setProperty('--ly', (e.clientY - r.top).toFixed(0) + 'px');
    });
    hero.addEventListener('pointerleave', function () { pointer.tx = 0; pointer.ty = 0; pointer.inside = false; });
  }

  // Flour dust in the oven light
  var dust = (function () {
    var canvas = $('[data-dust]');
    if (!canvas || reduced) return null;
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, parts = [];
    var spawn = function (anywhere) {
      return {
        x: Math.random() * w, y: anywhere ? Math.random() * h : h + 8,
        r: Math.random() * 1.5 + .35, vy: -(Math.random() * .32 + .06), vx: (Math.random() - .5) * .12,
        a: Math.random() * .55 + .18, ph: Math.random() * 6.283
      };
    };
    return {
      resize: function () {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = canvas.clientWidth; h = canvas.clientHeight;
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var count = Math.round(Math.min(150, (w * h) / 8500));
        parts = [];
        for (var i = 0; i < count; i++) parts.push(spawn(true));
      },
      draw: function (time) {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#FFD9A8';
        var rect = canvas.getBoundingClientRect();
        var mx = pointer.px - rect.left, my = pointer.py - rect.top;
        var gx = w * .8, gy = h * .9, gr = Math.max(w, h) * .85;
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.y += p.vy;
          p.x += p.vx + Math.sin(time / 1700 + p.ph) * .1;
          if (pointer.inside) {
            var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
            if (d2 < 16900) { var d = Math.sqrt(d2) + .01, f = (1 - d / 130) * .9; p.x += dx / d * f; p.y += dy / d * f; }
          }
          if (p.y < -10 || p.x < -10 || p.x > w + 10) parts[i] = p = spawn(false);
          var glow = 1 - Math.min(1, Math.hypot(p.x - gx, p.y - gy) / gr);
          ctx.globalAlpha = p.a * (.25 + glow * 1.1) * (.75 + .25 * Math.sin(time / 650 + p.ph));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.2832);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    };
  })();

  // Animated ordering demo inside the hero phone
  var shopDemo = (function () {
    var shop = $('[data-shop]');
    if (!shop || !heroStage) return null;
    var items = $$('[data-item]', shop).map(function (li) {
      return { li: li, price: Number(li.getAttribute('data-price')), stock: Number(li.getAttribute('data-stock')), qty: 0,
        label: $('[data-stock-label]', li), qtyEl: $('[data-qty]', li), plus: $('[data-plus]', li), low: li.classList.contains('is-low') };
    });
    var tap = $('[data-tap]', shop), cart = $('[data-cart]', shop), toast = $('[data-toast]', shop);
    var countEl = $('[data-cart-count]', shop), totalEl = $('[data-cart-total]', shop), cartBtn = $('[data-cart-btn]', shop);
    var seq = [0, 1, 1, 2, 'reserve'];
    var idx = 0, timer = null, running = false;
    var euro = function (n) { return n.toFixed(2).replace('.', ',') + ' €'; };
    var offsetIn = function (el) {
      var x = 0, y = 0;
      while (el && el !== shop) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
      return { x: x, y: y };
    };
    var moveTap = function (target) {
      var o = offsetIn(target);
      tap.style.transform = 'translate(' + (o.x + target.offsetWidth / 2 - tap.offsetWidth / 2) + 'px,' + (o.y + target.offsetHeight / 2 - tap.offsetHeight / 2) + 'px)';
      tap.classList.add('on');
    };
    var press = function (el) { el.classList.remove('press'); void el.offsetWidth; el.classList.add('press'); };
    var render = function () {
      var count = 0, total = 0;
      items.forEach(function (it) {
        var left = it.stock - it.qty;
        it.label.textContent = (it.low ? 'Knapp · noch ' : 'Noch ') + left;
        it.qtyEl.textContent = String(it.qty);
        it.qtyEl.classList.toggle('has', it.qty > 0);
        count += it.qty; total += it.qty * it.price;
      });
      countEl.textContent = String(count);
      totalEl.textContent = euro(total);
      cart.classList.toggle('has-items', count > 0);
    };
    var reset = function () {
      items.forEach(function (it) { it.qty = 0; });
      toast.classList.remove('show');
      heroStage.classList.add('is-tearing');
      setTimeout(function () { heroStage.classList.remove('is-printed', 'is-tearing'); }, 520);
      render();
      tap.classList.remove('on');
    };
    var step = function () {
      timer = null;
      if (!running) return;
      var s = seq[idx];
      if (s === 'reserve') {
        moveTap(cartBtn);
        timer = setTimeout(function () {
          press(tap); cartBtn.classList.add('press');
          setTimeout(function () { cartBtn.classList.remove('press'); }, 220);
          toast.classList.add('show');
          heroStage.classList.add('is-printed');
          setTimeout(function () { tap.classList.remove('on'); }, 500);
          timer = setTimeout(function () {
            reset(); idx = 0;
            timer = setTimeout(step, 1800);
          }, 5200);
        }, 800);
        return;
      }
      var it = items[s];
      moveTap(it.plus);
      timer = setTimeout(function () {
        press(tap);
        it.qty++;
        it.li.classList.add('bump');
        setTimeout(function () { it.li.classList.remove('bump'); }, 450);
        cart.classList.remove('bump'); void cart.offsetWidth; cart.classList.add('bump');
        render();
        idx++;
        timer = setTimeout(step, 650);
      }, 800);
    };
    if (reduced) {
      items[0].qty = 1; items[1].qty = 2; items[2].qty = 1;
      render();
      heroStage.classList.add('is-printed');
      toast.classList.add('show');
      return null;
    }
    render();
    return {
      start: function () { if (running) return; running = true; if (!timer) timer = setTimeout(step, 600); },
      stop: function () { running = false; if (timer) { clearTimeout(timer); timer = null; } }
    };
  })();

  var heroStarted = false;
  onReady(function () {
    setTimeout(function () {
      heroStarted = true;
      measureChars();
      if (shopDemo && heroVisible && !document.hidden) shopDemo.start();
    }, reduced ? 0 : 2300);
  });
  function setHeroVisible(v) {
    if (v === heroVisible) return;
    heroVisible = v;
    if (shopDemo && heroStarted) { if (v && !document.hidden) shopDemo.start(); else shopDemo.stop(); }
  }
  document.addEventListener('visibilitychange', function () {
    if (!shopDemo || !heroStarted) return;
    if (document.hidden) shopDemo.stop(); else if (heroVisible) shopDemo.start();
  });

  /* ---------- Story (pinned timeline) ---------- */
  var story = $('[data-story]');
  var steps = story ? $$('.step', story) : [];
  var rolls = story ? $$('.roll', story) : [];
  var statusTime = story ? $('[data-status-time]', story) : null;
  var storyStep = -1;
  function setStoryStep(i) {
    if (i === storyStep || !story) return;
    storyStep = i;
    story.setAttribute('data-step', String(i));
    var time = steps[i].getAttribute('data-time');
    var digits = time.replace(':', '');
    rolls.forEach(function (r, k) { r.firstElementChild.style.setProperty('--d', digits[k]); });
    if (statusTime) statusTime.textContent = time;
  }
  setStoryStep(0);

  /* ---------- Marquee ---------- */
  var marqueeRows = $$('[data-marquee-row]').map(function (row) {
    var track = $('.marquee-track', row);
    return { row: row, track: track, dir: Number(row.getAttribute('data-marquee-row')), html: track.innerHTML, unit: 0, x: 0 };
  });
  function measureMarquee() {
    marqueeRows.forEach(function (m) {
      m.track.innerHTML = m.html;
      m.unit = m.track.scrollWidth;
      var copies = Math.max(2, Math.ceil((window.innerWidth * 1.3) / Math.max(1, m.unit)) + 1);
      var html = '';
      for (var i = 0; i < copies; i++) html += m.html;
      m.track.innerHTML = html;
      m.unit = m.track.scrollWidth / copies;
      m.x = m.dir > 0 ? 0 : -m.unit;
    });
  }

  /* ---------- Tabs (showcase) ---------- */
  var tablist = $('[data-tabs]');
  var tabs = tablist ? $$('[role="tab"]', tablist) : [];
  var shots = $$('[data-shots] img');
  var panel = $('[data-shots]');
  var tabIndex = 0, tabAuto = !reduced, tabTimer = null, showcaseVisible = false;
  function selectTab(i, focus) {
    tabIndex = (i + tabs.length) % tabs.length;
    tabs.forEach(function (t, k) {
      var on = k === tabIndex;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    shots.forEach(function (img, k) { img.classList.toggle('is-on', k === tabIndex); });
    if (panel) panel.setAttribute('aria-labelledby', tabs[tabIndex].id);
    if (focus) tabs[tabIndex].focus();
  }
  function scheduleTab() {
    clearTimeout(tabTimer);
    if (!tabAuto || !showcaseVisible) { if (tablist) tablist.classList.remove('is-auto'); return; }
    tablist.classList.remove('is-auto'); void tablist.offsetWidth; tablist.classList.add('is-auto');
    tabTimer = setTimeout(function () { selectTab(tabIndex + 1); scheduleTab(); }, 6000);
  }
  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () { tabAuto = false; selectTab(k); scheduleTab(); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (e.key === 'Home') { e.preventDefault(); tabAuto = false; selectTab(0, true); scheduleTab(); }
      else if (e.key === 'End') { e.preventDefault(); tabAuto = false; selectTab(tabs.length - 1, true); scheduleTab(); }
      else if (d) { e.preventDefault(); tabAuto = false; selectTab(tabIndex + d, true); scheduleTab(); }
    });
  });
  if (tablist && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      showcaseVisible = entries[0].isIntersecting;
      if (showcaseVisible && shots[1]) shots.forEach(function (img) { img.loading = 'eager'; });
      scheduleTab();
    }, { threshold: 0.25 }).observe($('.showcase-stage'));
  }

  /* ---------- FAQ accordion (animated) ---------- */
  $$('[data-faq] details').forEach(function (d) {
    var summary = $('summary', d), answer = $('.faq-a', d);
    summary.addEventListener('click', function (e) {
      if (reduced || !answer.animate) return;
      e.preventDefault();
      if (d.getAttribute('data-animating')) return;
      d.setAttribute('data-animating', '1');
      var opts = { duration: 420, easing: 'cubic-bezier(.65,0,.35,1)' };
      if (d.open) {
        var a = answer.animate([{ height: answer.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], opts);
        a.onfinish = function () { d.open = false; d.removeAttribute('data-animating'); scheduleMeasure(); };
      } else {
        d.open = true;
        var b = answer.animate([{ height: '0px', opacity: 0 }, { height: answer.offsetHeight + 'px', opacity: 1 }], opts);
        b.onfinish = function () { d.removeAttribute('data-animating'); scheduleMeasure(); };
      }
    });
  });

  /* ---------- Magnetic buttons + spotlight cards ---------- */
  if (finePointer && !reduced) {
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * .22, dy = (e.clientY - (r.top + r.height / 2)) * .35;
        el.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px';
      });
      el.addEventListener('pointerleave', function () { el.style.translate = ''; });
    });
    $$('[data-spot]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--x', (e.clientX - r.left).toFixed(0) + 'px');
        el.style.setProperty('--y', (e.clientY - r.top).toFixed(0) + 'px');
      });
    });
  }

  /* ---------- Scroll engine ---------- */
  var scenes = $$('[data-scene]').map(function (el) {
    return { el: el, start: Number(el.getAttribute('data-start') || 1), end: Number(el.getAttribute('data-end') || 0), top: 0, h: 0, last: -1 };
  });
  var hscroll = $('[data-hscroll]');
  var track = $('[data-hscroll-track]');
  var hs = { top: 0, dist: 0, x: 0, last: null };
  var storyBox = { top: 0, h: 0 };
  var parallax = $$('[data-parallax]').map(function (el) { return { el: el, speed: Number(el.getAttribute('data-parallax')), top: 0, h: 0, y: 0 }; });
  var progressBar = $('.scroll-progress');
  var vh = window.innerHeight, docH = 1;
  var lastY = -1, smoothY = window.scrollY, lastNavY = window.scrollY, velocity = 0, skew = 0;
  var heroP = -1;

  function measure() {
    vh = window.innerHeight;
    var sy = window.scrollY;
    docH = Math.max(1, document.documentElement.scrollHeight - vh);
    scenes.forEach(function (s) { var r = s.el.getBoundingClientRect(); s.top = r.top + sy; s.h = r.height; s.last = -1; });
    parallax.forEach(function (p) { var r = p.el.parentElement.getBoundingClientRect(); p.top = r.top + sy; p.h = r.height; });
    if (story) { var rs = story.getBoundingClientRect(); storyBox.top = rs.top + sy; storyBox.h = rs.height; }
    if (hscroll && track && !reduced) {
      var dist = Math.max(0, track.scrollWidth - window.innerWidth);
      hscroll.style.height = (dist + vh) + 'px';
      var rh = hscroll.getBoundingClientRect();
      hs.top = rh.top + sy;
      hs.dist = dist;
      // recompute dependent sections after the height change
      scenes.forEach(function (s) { var r = s.el.getBoundingClientRect(); s.top = r.top + sy; s.h = r.height; });
      parallax.forEach(function (p) { var r = p.el.parentElement.getBoundingClientRect(); p.top = r.top + sy; p.h = r.height; });
      docH = Math.max(1, document.documentElement.scrollHeight - vh);
    }
    if (dust) dust.resize();
    measureMarquee();
    if (heroStarted) measureChars();
    lastY = -1;
  }
  var measureTimer = null;
  function scheduleMeasure() { clearTimeout(measureTimer); measureTimer = setTimeout(measure, 120); }
  window.addEventListener('resize', scheduleMeasure);
  if ('ResizeObserver' in window) {
    var lastBodyH = 0;
    new ResizeObserver(function () {
      var hNow = document.body.offsetHeight;
      if (Math.abs(hNow - lastBodyH) > 2) { lastBodyH = hNow; scheduleMeasure(); }
    }).observe(document.body);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener('load', measure);
  measure();

  function frame(time) {
    var sy = window.scrollY;
    var scrolled = sy !== lastY;
    velocity = lerp(velocity, sy - (lastY < 0 ? sy : lastY), .2);
    smoothY = reduced ? sy : lerp(smoothY, sy, .14);
    if (Math.abs(smoothY - sy) < .2) smoothY = sy;

    if (scrolled) {
      // Nav state
      if (nav) {
        nav.classList.toggle('is-scrolled', sy > 30);
        if (!menuOpen) {
          if (sy > lastNavY + 6 && sy > 400) nav.classList.add('is-hidden');
          else if (sy < lastNavY - 6 || sy < 400) nav.classList.remove('is-hidden');
        }
        if (Math.abs(sy - lastNavY) > 6) lastNavY = sy;
      }
      if (progressBar) progressBar.style.setProperty('--sp', clamp(sy / docH).toFixed(4));

      // Hero scroll-out
      if (hero) {
        var pinned = heroPinnedMQ.matches;
        var hp = clamp(sy / vh);
        if (Math.abs(hp - heroP) > .0005) {
          heroP = hp;
          hero.style.setProperty('--hp', hp.toFixed(4));
          hero.classList.toggle('is-covered', pinned && hp >= 1);
        }
        setHeroVisible(pinned ? hp < 1 : sy < hero.offsetHeight);
      }

      // Generic scenes: progress 0..1 between start/end viewport lines
      scenes.forEach(function (s) {
        var top = s.top - sy;
        var p = clamp((vh * s.start - top) / (s.h + vh * (s.start - s.end)));
        if (Math.abs(p - s.last) > .0005) { s.last = p; s.el.style.setProperty('--p', p.toFixed(4)); }
      });

      // Story
      if (story) {
        var span = Math.max(1, storyBox.h - vh);
        var sp = clamp((sy - storyBox.top) / span);
        story.style.setProperty('--sp', sp.toFixed(4));
        setStoryStep(Math.min(steps.length - 1, Math.floor(sp * steps.length * .999)));
      }
      lastY = sy;
    }

    // Smoothed: horizontal track + parallax
    if (hscroll && track && !reduced && hs.dist > 0) {
      var hp2 = clamp((smoothY - hs.top) / hs.dist);
      var x = -hp2 * hs.dist;
      if (hs.last === null || Math.abs(x - hs.last) > .1) {
        hs.last = x;
        track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
        hscroll.style.setProperty('--hp', hp2.toFixed(4));
      }
    }
    if (!reduced) {
      parallax.forEach(function (p) {
        var center = p.top + p.h / 2 - smoothY - vh / 2;
        var y = center * p.speed;
        if (Math.abs(y - p.y) > .1) { p.y = y; p.el.style.translate = '0 ' + y.toFixed(1) + 'px'; }
      });

      // Marquee: constant drift, accelerated and skewed by scroll velocity
      skew = lerp(skew, clamp(velocity * -.18, -7, 7), .12);
      marqueeRows.forEach(function (m) {
        if (!m.unit) return;
        var speed = (.55 + Math.min(10, Math.abs(velocity) * .35)) * m.dir;
        m.x -= speed;
        if (m.x <= -m.unit) m.x += m.unit;
        if (m.x > 0) m.x -= m.unit;
        m.track.style.transform = 'translate3d(' + m.x.toFixed(1) + 'px,0,0) skewX(' + skew.toFixed(2) + 'deg)';
      });

      // Hero pointer parallax, tilt and letter weight
      if (heroVisible && hero) {
        var autoX = finePointer ? 0 : Math.sin(time / 2600) * .35;
        var autoY = finePointer ? 0 : Math.cos(time / 3100) * .25;
        pointer.x = lerp(pointer.x, pointer.tx + autoX, .07);
        pointer.y = lerp(pointer.y, pointer.ty + autoY, .07);
        hero.style.setProperty('--mx', pointer.x.toFixed(3));
        hero.style.setProperty('--my', pointer.y.toFixed(3));
        depthEls.forEach(function (d) {
          d.el.style.translate = (pointer.x * d.d * -12).toFixed(1) + 'px ' + (pointer.y * d.d * -9 + Math.sin(time / 1400 + d.d * 2) * d.d * 2.5).toFixed(1) + 'px';
        });
        if (heroStarted && finePointer) {
          heroChars.forEach(function (c) {
            var dist = pointer.inside ? Math.hypot(c.x - pointer.px, c.y - pointer.py) : 9999;
            c.t = 380 + clamp(1 - dist / 240) * 420;
            if (Math.abs(c.t - c.w) > .5) {
              c.w = lerp(c.w, c.t, .14);
              c.el.style.fontWeight = c.w.toFixed(0);
            }
          });
        }
        if (dust) dust.draw(time);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
