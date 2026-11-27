/* hobi — site behaviour. No dependencies: rAF tweens, IntersectionObserver, scroll-scrubbed timelines. */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const E = {
  out3: t => 1 - Math.pow(1 - t, 3), inOut3: t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2, in3: t => t*t*t,
  back: t => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3*Math.pow(t-1,3) + c1*Math.pow(t-1,2); },
  elastic: t => t === 0 || t === 1 ? t : Math.pow(2,-10*t)*Math.sin((t*10-.75)*(2*Math.PI)/3) + 1, lin: t => t,
};
const wait = ms => new Promise(r => setTimeout(r, ms));
function tween(dur, fn, ease = E.out3, delay = 0, tok) {
  return new Promise(res => {
    const start = performance.now() + delay;
    const step = now => {
      if (tok && tok.dead) return res();
      const raw = clamp((now - start) / dur);
      if (now >= start) fn(ease(raw), raw);
      raw < 1 ? requestAnimationFrame(step) : res();
    };
    requestAnimationFrame(step);
  });
}
const store = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };

/* ======================= FACE (intro + idle) ======================= */
const scaleAbout = (x, y, s, sy = s) => `translate(${x} ${y}) scale(${s} ${sy}) translate(${-x} ${-y})`;
function makeFace(svg, opts = {}) {
  const root = $('.faceRoot', svg) || svg;
  const vb = svg.viewBox.baseVal, fc = { x: vb.width/2, y: vb.height/2 };
  const sil = $('[data-r=sil]', root);
  const shadow = sil.cloneNode(); shadow.removeAttribute('data-r'); shadow.setAttribute('class', 'shadow');
  root.insertBefore(shadow, sil);
  if (!opts.intro) shadow.setAttribute('transform', 'translate(3 3)');
  const lines = $$('[data-r=line]', root).map(el => { const L = el.getTotalLength(); el.style.strokeDasharray = L; return { el, L, y: el.getBBox().y }; });
  const yMin = Math.min(...lines.map(l => l.y)), yMax = Math.max(...lines.map(l => l.y));
  const eyes = $$('[data-r=eye]', root).map(el => ({ el, cx: +el.getAttribute('cx'), cy: +el.getAttribute('cy') }));
  const dots = $$('[data-r=dot]', root).map(el => ({ el, cx: +el.getAttribute('cx'), cy: +el.getAttribute('cy') }));
  const spark = $('[data-r=spark]', root), spb = spark.getBBox(), spc = { x: spb.x + spb.width/2, y: spb.y + spb.height/2 };
  const smile = lines.find(l => l.el.getAttribute('d').startsWith('M92.62'));
  const brows = lines.filter(l => /^M(92\.91|37\.65)/.test(l.el.getAttribute('d'))).map(l => l.el);
  const ring = $('.ring', svg);
  const st = { look: { x: 0, y: 0 }, target: { x: 0, y: 0 }, blink: 1, eyeScale: 1, alive: !opts.intro, tok: { dead: false } };
  const drawEyes = () => {
    eyes.forEach(e => e.el.setAttribute('transform', `translate(${st.look.x} ${st.look.y}) ` + scaleAbout(e.cx, e.cy, st.eyeScale, st.eyeScale * st.blink)));
    // brows ride along with the eyes and lift a little when looking up
    const lift = Math.min(0, st.look.y) * .9;
    brows.forEach(b => b.setAttribute('transform', `translate(${st.look.x * .55} ${st.look.y * .35 + lift})`));
  };

  function hide() {
    [sil, shadow].forEach(el => el.setAttribute('transform', scaleAbout(fc.x, fc.y, 0)));
    lines.forEach(l => { l.el.style.strokeDashoffset = l.L; l.el.style.opacity = 0; });
    st.eyeScale = 0; drawEyes();
    dots.forEach(d => d.el.setAttribute('transform', scaleAbout(d.cx, d.cy, 0)));
    spark.setAttribute('transform', scaleAbout(spc.x, spc.y, 0));
  }
  function show() {
    sil.removeAttribute('transform'); shadow.setAttribute('transform', 'translate(3 3)');
    lines.forEach(l => { l.el.style.strokeDashoffset = 0; l.el.style.opacity = 1; });
    st.eyeScale = 1; drawEyes(); dots.forEach(d => d.el.removeAttribute('transform')); spark.removeAttribute('transform');
  }
  async function blink(tok) {
    await tween(90, t => { st.blink = 1 - .9*t; drawEyes(); }, E.in3, 0, tok);
    await tween(140, t => { st.blink = .1 + .9*t; drawEyes(); }, E.out3, 0, tok);
  }
  async function play(lead = 0) {
    st.tok.dead = true; const tok = st.tok = { dead: false }; st.alive = false;
    hide(); root.setAttribute('transform', '');
    if (reduce) { show(); st.alive = true; return; }
    if (lead) { await wait(lead); if (tok.dead) return; }
    if (ring) {
      ring.setAttribute('cx', fc.x); ring.setAttribute('cy', fc.y);
      tween(800, t => {
        const r = lerp(120, 40, t), C = 2*Math.PI*r;
        ring.setAttribute('r', r); ring.style.strokeWidth = lerp(16, 4, t);
        ring.style.strokeDasharray = `${C * lerp(.35, .1, t)} ${C}`;
        ring.style.opacity = t < .8 ? 1 : 1 - (t - .8)/.2;
        ring.setAttribute('transform', `rotate(${lerp(120, -420, t)} ${fc.x} ${fc.y})`);
      }, E.inOut3, 0, tok);
    }
    tween(900, t => sil.setAttribute('transform', scaleAbout(fc.x, fc.y, t)), E.elastic, 550, tok);
    tween(900, t => shadow.setAttribute('transform', `translate(${3*t} ${3*t}) ` + scaleAbout(fc.x, fc.y, t)), E.elastic, 640, tok);
    lines.forEach(l => { if (l === smile) return;
      tween(520, t => { l.el.style.opacity = 1; l.el.style.strokeDashoffset = l.L * (1 - t); }, E.inOut3, 800 + ((l.y - yMin) / (yMax - yMin)) * 650, tok); });
    tween(520, t => { st.eyeScale = t; drawEyes(); }, E.back, 1550, tok);
    tween(700, t => spark.setAttribute('transform', `rotate(${lerp(-200, 0, t)} ${spc.x} ${spc.y}) ` + scaleAbout(spc.x, spc.y, t)), E.back, 1650, tok);
    dots.forEach((d, i) => tween(380, t => d.el.setAttribute('transform', scaleAbout(d.cx, d.cy, t)), E.back, 1800 + i*80, tok));
    await tween(420, t => { smile.el.style.opacity = 1; smile.el.style.strokeDashoffset = smile.L * (1 - t); }, E.out3, 1950, tok);
    if (tok.dead) return;
    await wait(250); await blink(tok); st.alive = true;
  }
  async function wiggle() {
    if (!st.alive || st.wig || reduce) return; st.wig = true;
    tween(700, t => spark.setAttribute('transform', `rotate(${360*t} ${spc.x} ${spc.y})`), E.inOut3);
    await tween(800, (t, raw) => root.setAttribute('transform', `rotate(${Math.sin(raw*Math.PI*4) * 6 * (1-raw)} ${fc.x} ${fc.y*1.6})`), E.lin);
    st.wig = false;
  }
  // idle life
  (async () => { while (true) { await wait(2600 + Math.random()*2600); if (st.alive && !document.hidden) { await blink(); if (Math.random() < .25) { await wait(120); await blink(); } } } })();
  (async () => { while (true) { await wait(4200 + Math.random()*1500); if (!st.alive || reduce) continue;
    await tween(700, (t, raw) => spark.setAttribute('transform', `rotate(${90*t} ${spc.x} ${spc.y}) ` + scaleAbout(spc.x, spc.y, 1 + Math.sin(raw*Math.PI)*.6)), E.inOut3); } })();
  addEventListener('pointermove', e => {
    const r = svg.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height*.6;
    // follows the cursor anywhere on the page: strength scales with distance across the viewport
    const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / (Math.min(innerWidth, innerHeight) * .45));
    st.target = { x: dx/d * 5.2 * k, y: dy/d * 3.8 * k };
  });
  (function loop() { st.look.x += (st.target.x - st.look.x) * .12; st.look.y += (st.target.y - st.look.y) * .12; if (st.alive) drawEyes(); requestAnimationFrame(loop); })();
  svg.addEventListener('mouseenter', wiggle);
  if (opts.intro) hide();
  return { play, wiggle, show };
}

/* ======================= header ======================= */
const header = $('#header');
const navFace = makeFace($('#navFace'));
// magnetic nav face
(() => {
  const el = $('#navFace'); let m = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width/2), dy = e.clientY - (r.top + r.height/2);
    if (Math.hypot(dx, dy) < 110 && !reduce) { m.tx = dx * .35; m.ty = dy * .35; } else { m.tx = m.ty = 0; }
  });
  (function loop() { m.x += (m.tx - m.x) * .15; m.y += (m.ty - m.y) * .15; el.style.transform = `translate(${m.x}px,${m.y}px) rotate(${m.x*.25}deg)`; requestAnimationFrame(loop); })();
  el.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
})();
$('#burger').addEventListener('click', () => { $('#nav').classList.toggle('open'); $('#burger').classList.toggle('open'); });
$$('#nav a').forEach(a => a.addEventListener('click', () => { $('#nav').classList.remove('open'); $('#burger').classList.remove('open'); }));
let lastY = scrollY;
addEventListener('scroll', () => {
  const y = scrollY;
  header.classList.toggle('tuck', y > lastY && y > innerHeight * 0.8 && !$('#nav').classList.contains('open'));
  lastY = y;
}, { passive: true });

/* ======================= hero ======================= */
const hero = $('#hero'), heroFaceSvg = $('#heroFace');
const heroFace = makeFace(heroFaceSvg, { intro: true });
heroFaceSvg.addEventListener('click', () => heroFace.play());

// chips that burst out of the face on scroll
const burst = $('#burst');
const chipSrc = ['dd-01.webp', 'tn-poster.webp', 'cf-scene-01.webp', 'wp-4-final.webp', 'jj-mock-1.webp', 'fl-05.webp', 'vx-a1-poster.webp', 'vx-ps5-poster.webp', 'tn-cover-dark.webp', 'sy-poster.webp', 'pt-process.webp', 'mp-01.webp'];
const tallSet = new Set(['tn-poster.webp', 'pt-process.webp', 'tn-cover-dark.webp']);
const chips = chipSrc.map((s, i) => {
  const d = document.createElement('div'); d.className = 'chip' + (tallSet.has(s) ? ' tall' : '');
  d.innerHTML = `<img src="media/${s}" alt="" loading="lazy">`; burst.appendChild(d);
  const a = (-90 + (i - (chipSrc.length - 1) / 2) * (300 / chipSrc.length)) * Math.PI / 180; // fan out above + sides
  const ring = i % 2 ? 1 : 0.72;
  return { el: d, a, ring, rot: (Math.random() - .5) * 34, delay: (i % 4) * 0.05 + Math.random() * .06 };
});
const tag = $('#tag');
function heroScroll() {
  const r = hero.getBoundingClientRect(), total = hero.offsetHeight - innerHeight;
  const p = clamp(-r.top / total);
  const W = innerWidth, H = innerHeight, R = Math.min(W * .48, H * .62);
  chips.forEach(c => {
    const q = clamp((p - .06 - c.delay) / .4);
    const e = E.out3(q);
    const x = Math.cos(c.a) * R * c.ring * e * (W < 760 ? .9 : 1.25), y = Math.sin(c.a) * R * c.ring * e * .95 + (W < 760 ? -H*.06 : 0);
    c.el.style.opacity = q > 0 ? Math.min(1, q * 3) * (1 - clamp((p - .86) / .14)) : 0;
    c.el.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px) rotate(${c.rot * e}deg) scale(${lerp(.2, 1, e)})`;
  });
  const f = clamp((p - .05) / .5);
  const tq = clamp((p - .45) / .2), tout = clamp((p - .85) / .12);
  heroFaceSvg.style.transform = `scale(${lerp(1, .55, E.inOut3(f)) * lerp(1, .6, tq)})`;
  heroFaceSvg.style.opacity = 1 - tq;
  burst.style.opacity = lerp(1, .38, tq);
  burst.style.filter = tq > 0 ? `blur(${tq * 3}px)` : '';
  tag.style.opacity = tq * (1 - tout);
  tag.style.transform = `translate(-50%,-50%) translateY(${lerp(30, 0, E.out3(tq))}px)`;
  $('.name', hero).style.opacity = 1 - clamp((p - .25) / .2);
  $('.roles', hero).style.opacity = 1 - clamp((p - .2) / .2);
  $('.scrollcue', hero).style.opacity = 1 - clamp(p / .08);
}

/* ======================= statement words ======================= */
const stmt = $('#statement');
stmt.innerHTML = stmt.textContent.split(/\s+/).map(w => {
  const pk = w.includes('*'); return `<span class="w${pk ? ' pk' : ''}">${w.replace(/\*/g, '')}</span>`;
}).join(' ');
const words = $$('.w', stmt);
function stmtScroll() {
  const r = stmt.getBoundingClientRect();
  const p = clamp((innerHeight * .85 - r.top) / (r.height + innerHeight * .45));
  const n = Math.round(p * words.length);
  words.forEach((w, i) => w.classList.toggle('on', i < n));
}

/* ======================= work grid ======================= */
const grid = $('#grid');
const items = [...PROJECTS.map(p => ({ ...p, case: true })), ...EXTRAS];
// interleave extras between projects for a lively bento
const order = []; let ei = PROJECTS.length;
PROJECTS.forEach((p, i) => { order.push(i); if (i % 2 === 1 && ei < items.length) order.push(ei++); });
while (ei < items.length) order.push(ei++);
// featured first, in this exact order; everything else keeps its place below
const FEATURED = ['see-you-again', 'what-the-fudge', 'showreel', 'welcome-to-toronto', 'got-lost', 'the-night-we-met', 'solsip', 'hobi logo reveal', 'ps5-logo', 'joji-magazine', 'football-legends'];
const fIdx = FEATURED.map(k => items.findIndex(it => it.slug === k || it.title === k)).filter(i => i >= 0);
order.splice(0, order.length, ...fIdx, ...order.filter(i => !fIdx.includes(i)));
const catLabel = { ux: 'UX/UI', motion: 'Motion Graphics', brand: 'Branding & Print', illus: 'Illustration', video: 'Video' };
// VFX and Motion are one category now: Motion Graphics
items.forEach(it => { it.cat = [...new Set(it.cat.map(c => c === 'vfx' ? 'motion' : c))]; });
order.forEach(idx => {
  const it = items[idx];
  const t = document.createElement(it.case ? 'a' : 'div');
  t.className = `tile ${it.size || 'sq'} reveal` + (it.white ? ' white' : '') + (it.textTile ? ' texty' : '');
  t.dataset.cat = it.cat.join(' ');
  if (it.case) { t.href = '#' + it.slug; t.dataset.slug = it.slug; }
  t.dataset.idx = idx;
  let media;
  if (it.textTile) media = `<div class="media"><div><b>${it.title}</b><small>${it.textTile}</small></div></div>`;
  else if (it.video) media = `<div class="media"><video src="${it.cover}" muted loop playsinline preload="metadata" class="always"></video></div>`;
  else media = `<div class="media"><img src="${it.cover}" alt="${it.title}" loading="lazy">${it.loop ? `<video class="loop" data-src="${it.loop}" muted loop playsinline preload="none"></video>` : ''}</div>`;
  t.innerHTML = media +
    `<span class="badge${it.case ? ' case' : ''}">${it.case ? 'Case study' : catLabel[it.cat[0]]}</span>` +
    `<div class="meta"><div><h3>${it.title}</h3><p>${it.blurb || it.note || ''}</p></div><span class="yr">${it.year || ''}</span></div>`;
  grid.appendChild(t);
});
// masonry: every tile takes the real proportions of its cover, so nothing is squished or awkwardly cropped
const ROW = 6;
function layoutGrid() {
  const cs = getComputedStyle(grid), cols = cs.gridTemplateColumns.split(' ').length, gap = parseFloat(cs.columnGap) || 0;
  const colW = (grid.clientWidth - gap * (cols - 1)) / cols, rowGap = gap * 1.1;
  $$('.tile', grid).forEach(t => {
    const it = items[+t.dataset.idx];
    let ar = (typeof RATIOS !== 'undefined' && RATIOS[it.cover]) || (it.textTile ? .8 : 1);
    ar = Math.min(2.1, Math.max(.62, ar));
    if (cols >= 2 && fIdx.includes(+t.dataset.idx)) ar = Math.max(ar, 1.25); // featured: always a wide tile so the order stays clean
    const span = cols >= 2 && ar >= 1.2 ? 2 : 1, w = span * colW + (span - 1) * gap, h = w / ar;
    t.style.gridColumn = `span ${span}`;
    t.style.gridRow = `span ${Math.ceil((h + rowGap) / ROW)}`;
    t.style.height = h + 'px';
  });
}
layoutGrid();
let lgT; addEventListener('resize', () => { clearTimeout(lgT); lgT = setTimeout(layoutGrid, 120); });
// counts on filters
$$('#filters button').forEach(b => { const f = b.dataset.f; const n = f === 'all' ? items.length : items.filter(i => i.cat.includes(f)).length; b.insertAdjacentHTML('beforeend', `<sup>${n}</sup>`); });
// hover: play loops, 3D tilt
$$('.tile', grid).forEach(t => {
  const v = $('video.loop', t), always = $('video.always', t);
  if (always) { new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? always.play().catch(() => {}) : always.pause()), { threshold: .3 }).observe(always); }
  t.addEventListener('mouseenter', () => { if (v) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } });
  t.addEventListener('mouseleave', () => { if (v) v.pause(); t.style.transform = ''; });
  if (fine && !reduce) t.addEventListener('mousemove', e => {
    const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    t.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-4px)`;
  });
  if (!t.dataset.slug) t.addEventListener('click', () => openLightbox(items[+t.dataset.idx]));
});
// filters with FLIP
$('#filters').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $$('#filters button').forEach(x => x.classList.toggle('on', x === b));
  const f = b.dataset.f, tiles = $$('.tile', grid);
  const first = new Map(tiles.map(t => [t, t.getBoundingClientRect()]));
  tiles.forEach(t => t.classList.toggle('hidden', f !== 'all' && !t.dataset.cat.split(' ').includes(f)));
  tiles.forEach(t => {
    if (t.classList.contains('hidden')) return;
    const a = first.get(t), z = t.getBoundingClientRect();
    if (!a.width) { t.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' }); return; }
    t.animate([{ transform: `translate(${a.left - z.left}px,${a.top - z.top}px) scale(${a.width / z.width},${a.height / z.height})` }, { transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
});

/* ======================= cursor ======================= */
const cur = $('#cursor'); let cx = -100, cy = -100, tx = -100, ty = -100;
if (fine) {
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; });
  (function loop() { cx += (tx - cx) * .22; cy += (ty - cy) * .22; cur.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
  document.addEventListener('pointerover', e => { cur.classList.toggle('big', !!e.target.closest('.tile, .cs-gal img, .cs-next')); });
} else cur.remove();

/* ======================= marquee (velocity reactive) ======================= */
const words2 = ['VFX', 'Compositing', 'Illustration', 'Animation', 'UX/UI', 'Branding', 'Motion', 'After Effects', 'Figma', 'Procreate', 'Blender', 'Toon Boom', 'Photoshop', 'InDesign', 'Video'];
const row = '<div class="row">' + words2.map((w, i) => `<span class="${i % 3 === 2 ? 'o' : ''}">${w}</span><img src="media/star-icon.svg" alt="">`).join('') + '</div>';
const mq = $('#mq'); mq.innerHTML = row + row;
let mqX = 0, vel = 0, prevY = scrollY;
(function loop() {
  const dy = scrollY - prevY; prevY = scrollY;
  vel += (dy * 0.6 - vel) * .1;
  mqX -= (reduce ? 0 : 1.1) + Math.abs(vel) * .9;
  const w = mq.scrollWidth / 2; if (w && mqX < -w) mqX += w;
  mq.style.transform = `translateX(${mqX}px) skewX(${clamp(-vel * .3, -12, 12)}deg)`;
  requestAnimationFrame(loop);
})();

/* ======================= gallery preview (full wall lives on gallery.html) ======================= */
const GPREV = [
  ['ga-lake', 'Lakeside', 'gold'], ['ga-red', 'Red Room', 'black'], ['ga-hands', 'Creation, Revisited', 'wood'],
  ['ga-portrait', 'Portrait in Paint', 'gold'], ['ga-067', '067', 'pink'], ['ga-cases', 'Starry Night Cases', 'white'],
];
$('#gwall').innerHTML = GPREV.map(([src, t, f], i) =>
  `<a class="gp reveal" href="gallery.html" style="--d:${i * 70}ms"><span class="fr f-${f}"><span class="mat"><img src="media/${src}.webp" alt="${t}" loading="lazy"></span></span><b>${t}</b></a>`).join('');

/* ======================= live caricatures: polaroid wall ======================= */
// each entry is a photo, or [person, their caricature] shown side by side
const CARI_LAYOUT = [[1, 11], 3, 4, 9, 10, 7, [6, 5], 13, 15, 2, 12, 16, 8, [17, 14], 18];
const ccSrc = n => `media/cc-${String(n).padStart(2, '0')}.webp`;
const CARI = CARI_LAYOUT.flat().map(ccSrc);
let ci = 0;
const pola = (n, extra = '') => `<button class="pola${extra}" data-i="${ci++}" aria-label="Open caricature photo"><img src="${ccSrc(n)}" alt="Caricature by Harshit at a Seneca club event" loading="lazy"></button>`;
$('#polas').innerHTML = CARI_LAYOUT.map((u, i) => {
  const st = `style="--r:${[-4, 3, -2, 5, -3, 2][i % 6]}deg;--d:${(i % 6) * 60}ms"`;
  return Array.isArray(u)
    ? `<div class="pair reveal" ${st}>${pola(u[0])}<span class="pair-star"><img src="media/star-icon.svg" alt=""></span>${pola(u[1], ' card')}</div>`
    : `<div class="solo reveal" ${st}>${pola(u)}</div>`;
}).join('');
$$('#polas .pola').forEach(b => b.addEventListener('click', () => openLightbox({ gallery: CARI, title: 'Live caricatures · Seneca Design Innovators' }, +b.dataset.i)));

/* ======================= about: software stars ======================= */
const sw = [['Photoshop', 5], ['Illustrator', 4], ['After Effects', 4], ['InDesign', 3], ['Premiere Pro', 4], ['Procreate', 5], ['Blender', 3], ['Figma', 4], ['Unity', 3]];
$('#sw').innerHTML = sw.map(([n, k]) => `<div>${n}<span class="stars">${[0,1,2,3,4].map(i => `<img src="media/star-icon.svg" class="${i < k ? 'on' : ''}" alt="">`).join('')}</span></div>`).join('');

/* ======================= reveals ======================= */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
$$('.reveal').forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(el); });

/* ======================= contact ======================= */
const EMAIL = 'bawaharshit75@gmail.com';
async function copyEmail(btn) {
  try { await navigator.clipboard.writeText(EMAIL); toast('Email copied ✦'); } catch (e) { toast(EMAIL); }
}
function toast(msg) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast';
    Object.assign(t.style, { position: 'fixed', left: '50%', bottom: '96px', transform: 'translateX(-50%)', background: '#EA6292', color: '#fff', padding: '12px 22px', borderRadius: '30px', fontWeight: '800', zIndex: 190, boxShadow: '0 8px 0 #BBB7B6', transition: 'opacity .3s', letterSpacing: '.06em' });
    document.body.appendChild(t); }
  t.textContent = msg; t.style.opacity = 1; clearTimeout(t._h); t._h = setTimeout(() => t.style.opacity = 0, 1800);
}
$('#copyEmail').addEventListener('click', copyEmail); $('#dockMail').addEventListener('click', copyEmail);
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, err = $('#err');
  const bad = [...f.querySelectorAll('[required]')].find(i => !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value)));
  if (bad) { err.textContent = bad.type === 'email' && bad.value ? 'Please enter a valid email.' : 'Please fill in every field.'; bad.focus();
    bad.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 300 }); return; }
  err.textContent = '';
  if (f._honey && f._honey.value) return; // spam bot filled the hidden field
  const btn = f.querySelector('button[type=submit]'), label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Sending…';
  const first = f.first.value.trim();
  // FormSubmit (formsubmit.co) relays the message to Harshit's inbox; no server needed
  fetch(`https://formsubmit.co/ajax/${EMAIL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name: `${first} ${f.last.value.trim()}`, email: f.email.value.trim(), message: f.msg.value.trim(),
      _subject: `Portfolio message from ${first} ${f.last.value.trim()}`, _replyto: f.email.value.trim(), _template: 'table', _captcha: 'false'
    })
  }).then(r => r.json().then(j => ({ ok: r.ok && String(j.success) !== 'false', j })))
    .then(({ ok, j }) => {
      if (!ok) throw new Error(j && j.message || 'send failed');
      const ding = $('#ding'); try { ding.currentTime = 0; ding.play().catch(() => {}); } catch (x) {}
      $('#sentMsg').innerHTML = `Thanks ${first}! Your message is on its way to me. I'll get back to you soon.`;
      $('#sent').classList.add('on'); f.reset();
    })
    .catch(() => {
      err.innerHTML = `Something went wrong sending your message. Please email me directly at <a href="mailto:${EMAIL}" style="color:var(--pink)">${EMAIL}</a>.`;
    })
    .finally(() => { btn.disabled = false; btn.textContent = label; });
});
$('#sentOk').addEventListener('click', () => $('#sent').classList.remove('on'));

/* ======================= dock ======================= */
const dock = $('#dock');
const dockItems = $$('a,button', dock);
dock.addEventListener('mousemove', e => {
  if (reduce) return;
  dockItems.forEach(el => { const r = el.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width/2)); const s = 52 + Math.max(0, 28 - d * .25); el.style.width = el.style.height = s + 'px'; });
});
dock.addEventListener('mouseleave', () => dockItems.forEach(el => el.style.width = el.style.height = ''));

/* ======================= case studies ======================= */
const caseEl = $('#case'), caseInner = $('#caseInner');
let current = null;
function block(s) {
  switch (s.type) {
    case 'text': return `<div class="cs-text reveal"><h3>${s.title || ''}</h3><p>${s.body}</p></div>`;
    case 'quote': return `<div class="cs-quote reveal">${s.body}</div>`;
    case 'hero': return `<div class="cs-hero-img reveal"><img src="${s.src}" alt=""></div>`;
    case 'gallery': return `<div class="cs-gal c${s.cols || 1}">${s.items.map(src => `<img class="reveal" src="${src}" alt="" loading="lazy">`).join('')}</div>`;
    case 'video': return `<div class="reveal"><div class="cs-vid${s.portrait ? ' portrait' : ''}"><video src="${s.src}" controls playsinline preload="metadata"></video></div>${s.caption ? `<div class="cs-cap">${s.title ? `<b style="color:#fff">${s.title}</b> · ` : ''}${s.caption}</div>` : ''}</div>`;
    case 'videos': return `<div class="cs-vids">${s.items.map(v => `<div class="reveal"><div class="cs-vid${v.portrait ? ' portrait' : ''}"><video src="${v.src}"${v.poster ? ` poster="${v.poster}"` : ''} controls playsinline preload="metadata"></video></div><div class="cs-cap">${v.caption}</div></div>`).join('')}</div>`;
    case 'stats': return `<div class="cs-stats">${s.items.map(([n, l]) => `<div class="card reveal"><b data-count="${n}">${n}</b><span>${l}</span></div>`).join('')}</div>`;
    case 'stills': return `<div class="cs-stills reveal"><h3>${s.title || 'Stills'}</h3><div class="cs-gal ${s.portrait ? 'c4 tallgal' : 'c3'}">${s.items.map(src => `<img src="${src}" alt="" loading="lazy">`).join('')}</div></div>`;
    case 'steps': return `<div class="cs-steps reveal"><h3>${s.title}</h3><ol>${s.items.map(([a, b]) => `<li><b>${a}</b><span>${b}</span></li>`).join('')}</ol></div>`;
    case 'compare': return `<div class="cs-compare reveal" data-compare><img src="${s.before}" alt="${s.labels[0]}"><div class="after"><img src="${s.after}" alt="${s.labels[1]}"></div><div class="bar"><i><img src="media/star-icon.svg" alt=""></i></div><span class="lab" style="left:16px">${s.labels[0]}</span><span class="lab" style="right:16px">${s.labels[1]}</span></div>`;
    case 'yt': return `<div class="cs-yt reveal"><div class="cs-vid yt"><iframe src="https://www.youtube-nocookie.com/embed/${s.id}?rel=0&modestbranding=1" title="${s.title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><aside class="card"><span class="pill">Watch the film</span><h3>${s.title}</h3>${(s.meta || []).map(([k, v]) => `<p><b>${k}</b>${v}</p>`).join('')}<a class="btn" href="https://www.youtube.com/watch?v=${s.id}" target="_blank" rel="noopener">Watch on YouTube ↗</a></aside></div>`;
    case 'link': return `<a class="btn cs-link reveal" href="${s.href}" target="_blank" rel="noopener">${s.label}</a>`;
  }
  return '';
}
function openCase(slug, push) {
  const i = PROJECTS.findIndex(p => p.slug === slug); if (i < 0) return closeCase();
  const p = PROJECTS[i], next = PROJECTS[(i + 1) % PROJECTS.length];
  current = slug;
  const meta = [['Year', p.year], ['Role', p.role], ['Tools', (p.tools || []).join(', ')]].filter(m => m[1]);
  caseInner.innerHTML = `
    <div class="cs-hero">
      <div class="kicker"><img src="media/star-icon.svg" alt="">${p.kicker || ''}</div>
      <h1>${p.title}</h1>
      <p class="lead">${p.blurb || ''}</p>
      <div class="cs-meta">${meta.map(([k, v]) => `<div class="card"><h5>${k}</h5><p>${v}</p></div>`).join('')}</div>
      ${p.note ? `<p class="cs-note">${p.note}</p>` : ''}
      ${(p.links || []).map(l => `<a class="btn ghost" style="margin-top:24px" href="${l.href}" target="_blank" rel="noopener">${l.label} ↗</a>`).join(' ')}
    </div>
    <div class="cs-body">
      ${p.sections.map(block).join('')}
      <a class="cs-next" href="#${next.slug}"><div><small>Next project</small><h4>${next.title}</h4></div><img class="arrow" src="media/star-icon.svg" alt=""></a>
    </div>`;
  caseEl.scrollTop = 0;
  caseEl.classList.add('open'); document.body.classList.add('locked');
  const cio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); cio.unobserve(e.target); } }), { root: caseEl, threshold: .08 });
  $$('.reveal', caseInner).forEach(el => cio.observe(el));
  $$('[data-compare]', caseInner).forEach(setupCompare);
  $$('.cs-gal img', caseInner).forEach((img, k, all) => img.addEventListener('click', () => openLightbox({ gallery: all.map(x => x.src), title: p.title }, k)));
}
function closeCase() {
  current = null; caseEl.classList.remove('open'); document.body.classList.remove('locked');
  $$('video', caseInner).forEach(v => v.pause());
}
function route() {
  const h = location.hash.slice(1);
  if (PROJECTS.some(p => p.slug === h)) openCase(h);
  else { if (current) closeCase(); if (h) { const t = document.getElementById(h); if (t) t.scrollIntoView({ behavior: 'smooth' }); } }
}
addEventListener('hashchange', route);
$('#caseClose').addEventListener('click', () => { history.pushState('', '', location.pathname + location.search); closeCase(); });
addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('#lb').classList.contains('on')) closeLB(); else if (current) $('#caseClose').click(); } });
function setupCompare(el) {
  const after = $('.after', el), bar = $('.bar', el);
  const set = x => { const r = el.getBoundingClientRect(), p = clamp((x - r.left) / r.width) * 100; after.style.clipPath = `inset(0 0 0 ${p}%)`; bar.style.left = p + '%'; };
  let down = false;
  el.addEventListener('pointerdown', e => { down = true; el.setPointerCapture(e.pointerId); set(e.clientX); });
  el.addEventListener('pointermove', e => down && set(e.clientX));
  el.addEventListener('pointerup', () => down = false);
  // gentle demo sweep when it first appears
  const o = new IntersectionObserver(es => { if (es[0].isIntersecting && !reduce) { o.disconnect();
    tween(1600, (t, raw) => { const r = el.getBoundingClientRect(); set(r.left + r.width * (.5 + Math.sin(raw * Math.PI * 2) * .3)); }, E.lin); } }, { root: caseEl, threshold: .5 });
  o.observe(el);
}

/* ======================= lightbox ======================= */
const lb = $('#lb'), lbIn = $('#lbIn'); let lbList = [], lbI = 0, lbTitle = '';
function openLightbox(it, start = 0) {
  lbTitle = it.title || '';
  lbList = it.gallery ? it.gallery : it.loop ? [{ v: it.loop }] : it.video ? [{ v: it.cover }] : [it.cover];
  lbI = start; drawLB(); lb.classList.add('on');
}
function drawLB() {
  const x = lbList[lbI];
  lbIn.innerHTML = (typeof x === 'object' ? `<video src="${x.v}" autoplay loop muted playsinline controls></video>` : `<img src="${x}" alt="">`) +
    `<div class="cap">${lbTitle}${lbList.length > 1 ? ` · ${lbI + 1}/${lbList.length}` : ''}</div>`;
  $('#lbP').style.display = $('#lbN').style.display = lbList.length > 1 ? '' : 'none';
}
function closeLB() { lb.classList.remove('on'); lbIn.innerHTML = ''; }
$('#lbX').addEventListener('click', closeLB);
lb.addEventListener('click', e => { if (e.target === lb) closeLB(); });
$('#lbP').addEventListener('click', () => { lbI = (lbI - 1 + lbList.length) % lbList.length; drawLB(); });
$('#lbN').addEventListener('click', () => { lbI = (lbI + 1) % lbList.length; drawLB(); });

/* ======================= scroll loop ======================= */
let ticking = false;
function onScroll() {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    heroScroll(); stmtScroll();
    dock.classList.toggle('show', scrollY > innerHeight * 1.6);
    const sec = ['work', 'about', 'contact'].find(id => { const r = document.getElementById(id).getBoundingClientRect(); return r.top < innerHeight * .4 && r.bottom > innerHeight * .4; });
    $$('#nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + sec));
    ticking = false;
  });
}
addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);

/* ======================= start ======================= */
hero.classList.add('ready');
heroFace.play(450);
onScroll(); route();
onScroll();
})();
