/* hobi gallery — the art wall. Edit this list to add, remove or retitle pieces.
   frame: gold | black | wood | white | pink     size: s | m | l      kind: paint | draw | digital | fan */
const ART = [
  { src: "ga-forest", title: "Into the Forest", medium: "Painting", kind: "paint", frame: "gold", size: "l" },
  { src: "ga-red", title: "Red Room", medium: "Portrait study", kind: "digital", frame: "black", size: "m" },
  { src: "ga-street", title: "Autumn Street", medium: "Painting", year: "2019", kind: "paint", frame: "gold", size: "s" },
  { src: "ga-twofaces", title: "Two Halves", medium: "Graphite drawing", kind: "draw", frame: "black", size: "m" },
  { src: "ga-kiss", title: "The Kiss", medium: "Ink and colour · sketchbook", kind: "draw", frame: "wood", size: "m" },
  { src: "ga-lake", title: "Lakeside", medium: "Painting", kind: "paint", frame: "gold", size: "m" },
  { src: "ga-flower", title: "Bloom", medium: "Painting", year: "2020", kind: "paint", frame: "black", size: "s" },
  { src: "ga-portrait", title: "Portrait in Paint", medium: "Digital painting", kind: "digital", frame: "gold", size: "l" },
  { src: "ga-hands", title: "Creation, Revisited", medium: "Ink · sketchbook · after Michelangelo", kind: "draw", frame: "wood", size: "m" },
  { src: "ga-gold", title: "David in Gold", medium: "Mixed media · sketchbook", kind: "draw", frame: "gold", size: "s" },
  { src: "ga-graphite", title: "Graphite Portrait", medium: "Graphite drawing", kind: "draw", frame: "white", size: "m" },
  { src: "ga-jeep", title: "Moonlight Drive", medium: "Photo manipulation", year: "2021", kind: "digital", frame: "black", size: "m" },
  { src: "wp-4-final", title: "Workplace", medium: "Animation background · Photoshop", year: "2026", kind: "digital", frame: "pink", size: "l" },
  { src: "ga-fairy", title: "Bone Fairy", medium: "Ink and colour · sketchbook", year: "2022", kind: "draw", frame: "wood", size: "s" },
  { src: "ga-rose", title: "Golden Rose", medium: "Painting", year: "2021", kind: "paint", frame: "black", size: "s" },
  { src: "ga-braid", title: "Braids", medium: "Pencil drawing", kind: "draw", frame: "white", size: "m" },
  { src: "ga-wave", title: "Swell", medium: "Monochrome painting", kind: "paint", frame: "gold", size: "m" },
  { src: "il-garden", title: "Community Garden", medium: "Digital illustration · Photoshop", kind: "digital", frame: "pink", size: "m" },
  { src: "ga-couple", title: "Together", medium: "Sketchbook", kind: "draw", frame: "wood", size: "s" },
  { src: "il-lowpoly", title: "Low-poly Portrait", medium: "Vector · Illustrator", kind: "digital", frame: "white", size: "s" },
  { src: "ga-david", title: "David, Sketch", medium: "Ink · sketchbook", kind: "draw", frame: "black", size: "s" },
  { src: "ga-cases", title: "Starry Night Cases", medium: "Hand-painted phone cases · after Van Gogh", kind: "paint", frame: "gold", size: "m" },
  { src: "ga-067", title: "067", medium: "Digital painting · fan art", kind: "fan", frame: "pink", size: "m" },
  { src: "il-poster-noface", title: "No-Face", medium: "Vector poster · fan art", kind: "fan", frame: "white", size: "s" },
  { src: "il-poster-hp", title: "The Boy Who Lived", medium: "Vector poster · fan art", kind: "fan", frame: "white", size: "s" },
  { src: "il-poster-coco", title: "Remember Me", medium: "Vector poster · fan art", kind: "fan", frame: "white", size: "s" },
  { src: "ga-case2", title: "Pocket-sized Starry Night", medium: "Hand-painted phone case · after Van Gogh", kind: "paint", frame: "black", size: "s" },
];

(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wall = $('#wall');

ART.forEach((a, i) => {
  const f = document.createElement('figure');
  f.className = `art ${a.size}`;
  f.dataset.kind = a.kind; f.dataset.i = i;
  f.style.setProperty('--d', `${(i % 6) * 70}ms`);
  f.innerHTML = `<button class="frame f-${a.frame}" aria-label="View ${a.title}"><span class="mat"><img src="media/${a.src}.webp" alt="${a.title}" loading="lazy"></span></button>
    <figcaption class="plaque"><b>${a.title}</b><span>${a.medium}${a.year ? ` · ${a.year}` : ''}</span></figcaption>`;
  wall.appendChild(f);
});

// counts + filters
const kinds = { all: 'All', paint: 'Paintings', draw: 'Drawings', digital: 'Digital', fan: 'Fan art' };
$('#gfilters').innerHTML = Object.entries(kinds).map(([k, l]) =>
  `<button data-k="${k}" class="${k === 'all' ? 'on' : ''}">${l}<sup>${k === 'all' ? ART.length : ART.filter(a => a.kind === k).length}</sup></button>`).join('');
$('#gfilters').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $$('#gfilters button').forEach(x => x.classList.toggle('on', x === b));
  $$('.art').forEach(f => {
    const show = b.dataset.k === 'all' || f.dataset.kind === b.dataset.k;
    f.classList.toggle('off', !show);
  });
});

// hang the frames as they come into view
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('hung'); io.unobserve(e.target); } }), { threshold: .15 });
$$('.art').forEach(f => io.observe(f));

// gallery spotlight that follows the cursor
const room = $('#room');
if (!reduce && matchMedia('(hover: hover)').matches) {
  addEventListener('pointermove', e => {
    room.style.setProperty('--mx', e.clientX + 'px'); room.style.setProperty('--my', e.clientY + 'px');
  });
} else room.classList.add('nolight');

// tilt each frame a touch toward the cursor
$$('.art .frame').forEach(fr => {
  if (reduce) return;
  fr.addEventListener('mousemove', e => {
    const r = fr.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    fr.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-6px)`;
  });
  fr.addEventListener('mouseleave', () => fr.style.transform = '');
});

// viewing room (lightbox)
const vr = $('#viewing'), vImg = $('#vImg'), vFrame = $('#vFrame');
let cur = 0;
const visible = () => $$('.art:not(.off)').map(f => +f.dataset.i);
function show(i) {
  cur = i; const a = ART[i];
  vFrame.className = `vframe f-${a.frame}`;
  vImg.src = `media/${a.src}.webp`; vImg.alt = a.title;
  $('#vTitle').textContent = a.title;
  $('#vMeta').textContent = a.medium + (a.year ? ` · ${a.year}` : '');
  const list = visible(); $('#vCount').textContent = `${list.indexOf(i) + 1} / ${list.length}`;
}
function open(i) { show(i); vr.classList.add('on'); document.body.style.overflow = 'hidden'; }
function close() { vr.classList.remove('on'); document.body.style.overflow = ''; }
function step(d) { const l = visible(); show(l[(l.indexOf(cur) + d + l.length) % l.length]); }
wall.addEventListener('click', e => { const f = e.target.closest('.art'); if (f) open(+f.dataset.i); });
$('#vClose').addEventListener('click', close);
$('#vPrev').addEventListener('click', () => step(-1));
$('#vNext').addEventListener('click', () => step(1));
vr.addEventListener('click', e => { if (e.target === vr) close(); });
addEventListener('keydown', e => { if (!vr.classList.contains('on')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
let sx = null;
vr.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
vr.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); sx = null; });
})();
