'use strict';
// Apeiron · sky.js: starfield, the sky, the wind.
// The game is a set of classic scripts loaded in order by index.html; they share one global scope.

/* ---------------- Starfield ---------------- */
/* The sky is a view from the Earth. At night it fills in with the generator ladder (the highest tier you ever reached,
   so it stays): embers from a campfire, then the hills at Bonfire, the first light at Sun, the Moon at Giant, shooting
   stars at Nova, the Milky Way at Galaxy, mountains at Horizon. The further you get into the Essence web, the closer the
   day comes: dawn, sunrise, the Moon setting, morning. Full daylight is the last Essence upgrade, Bright Blue Sky. The landscape
   is painted on a canvas only when something changes. Off in Options (Sky effects). */
// from night (0) to bright day (1): the top, middle and horizon of the sky, then the near hills and the far mountains
const SKY_KEYS = [
  [0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [5, 6, 12], [9, 10, 22]],
  [0.06, [3, 5, 20, .45], [12, 12, 40, .4], [46, 30, 78, .55], [6, 7, 14], [12, 12, 28]],
  [0.25, [8, 15, 48, .8], [48, 40, 98, .72], [214, 116, 96, .82], [12, 11, 22], [34, 28, 54]],
  [0.45, [24, 46, 112, .93], [116, 102, 166, .88], [255, 172, 118, .92], [24, 28, 38], [74, 66, 104]],
  [0.75, [42, 102, 196, 1], [108, 164, 226, 1], [252, 214, 178, 1], [34, 60, 46], [96, 116, 150]],
  [1, [44, 124, 238, 1], [112, 180, 250, 1], [206, 232, 255, 1], [44, 88, 52], [118, 148, 182]],
];
function skyCol(t, i) {
  let a = SKY_KEYS[0], b = SKY_KEYS[SKY_KEYS.length - 1];
  for (let k = 1; k < SKY_KEYS.length; k++) if (t <= SKY_KEYS[k][0]) { a = SKY_KEYS[k - 1]; b = SKY_KEYS[k]; break; }
  const f = b[0] > a[0] ? Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))) : 1;
  return a[i].map((x, j) => x + (b[i][j] - x) * f);
}
const rgbaOf = (c, a = c.length > 3 ? c[3] : 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${(+a).toFixed(3)})`;
const mixRgb = (a, b, f) => [0, 1, 2].map(j => a[j] + (b[j] - a[j]) * f);
const skySmooth = (a, b, x) => { const f = Math.max(0, Math.min(1, (x - a) / (b - a))); return f * f * (3 - 2 * f); };
// how far into the day: the share of the Essence web you own takes it to 0.9, Bright Blue Sky to 1
function skyDay() {
  if (hasE('e53')) return 1;
  let own = 0, all = 0; for (const u of EUPG) if (!u.dyn && u.id !== 'e53') { all++; if (S.eUpg[u.id]) own++; }
  return Math.max(S.stats.topTier >= 9 ? 0.03 : 0, 0.9 * own / Math.max(1, all)); // Sun: the first light on the horizon
}
// one ridge line, seeded so it never changes: y(x) in screen fractions (0 = top), smooth hills or rough mountains
function skyRidge(seed, base, amp, rough) {
  const r = mulberry(hashStr(seed)), ph = Array.from({ length: 5 }, () => r() * 6.283), fr = [1.6, 3.7, 8.3, 17, 37];
  const wt = rough ? [0.42, 0.26, 0.17, 0.1, 0.05] : [0.6, 0.28, 0.12, 0, 0];
  return x => { let s = 0; for (let k = 0; k < 5; k++) s += wt[k] * Math.sin(x * fr[k] * 6.283 / 4 + ph[k]); if (rough) s += 0.12 * Math.abs(Math.sin(x * 61 + ph[0])); return base - amp * (0.5 + 0.5 * s); };
}
// Ascension: the screen goes black for a moment, then the sky starts again from night and climbs back over 9 seconds
let SKY_DAWN = 0;
function skyDawn() {
  const b = $('blackout'); b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
  SKY_DAWN = performance.now();
}
let SKY_LAYERS = null; // made on first use (the seeding helpers are defined further down)
const skyLayers = () => SKY_LAYERS || (SKY_LAYERS = [ // far to near: when it appears (tier), its ridge, and how much haze softens it
  { at: 18, y: skyRidge('sky:m1', 0.74, 0.22, true), haze: 0.62, col: 5 },
  { at: 18, y: skyRidge('sky:m2', 0.8, 0.16, true), haze: 0.42, col: 5 },
  { at: 6, y: skyRidge('sky:h1', 0.87, 0.09, false), haze: 0.2, col: 4 },
  { at: 6, y: skyRidge('sky:h2', 0.93, 0.07, false), haze: 0, col: 4 },
]);
const SKY_FIRE_X = 0.17;
function paintSky(c, t, tier) {
  const d = 1, W = innerWidth, H = innerHeight; // soft gradients: full resolution is wasted
  c.width = Math.floor(W * d); c.height = Math.floor(H * d); c.style.width = W + 'px'; c.style.height = H + 'px';
  const g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H);
  const top = skyCol(t, 1), mid = skyCol(t, 2), hor = skyCol(t, 3), night = 1 - skySmooth(0.35, 0.7, t);
  // the sky itself (see-through at night, so the stars show)
  const sg = g.createLinearGradient(0, 0, 0, H);
  sg.addColorStop(0, rgbaOf(top)); sg.addColorStop(0.5, rgbaOf(mid)); sg.addColorStop(0.82, rgbaOf(hor)); sg.addColorStop(1, rgbaOf(hor));
  g.fillStyle = sg; g.fillRect(0, 0, W, H);
  // the Milky Way: a faint band of light and dust, with a sprinkle of tiny stars
  if (tier >= 15 && night > 0.01) {
    g.save(); g.translate(W * 0.5, H * 0.3); g.rotate(-0.32); g.globalAlpha = night;
    const r = mulberry(hashStr('sky:milky'));
    for (let k = 0; k < 7; k++) { const x = (r() - 0.5) * W * 1.1, w = W * (0.18 + r() * 0.25), h = H * (0.05 + r() * 0.06); g.save(); g.translate(x, (r() - 0.5) * H * 0.05); g.scale(1, h / w); const rg = g.createRadialGradient(0, 0, 0, 0, 0, w); rg.addColorStop(0, 'rgba(210,214,255,.075)'); rg.addColorStop(1, 'rgba(210,214,255,0)'); g.fillStyle = rg; g.beginPath(); g.arc(0, 0, w, 0, 6.283); g.fill(); g.restore(); }
    g.fillStyle = 'rgba(235,238,255,.55)';
    for (let k = 0; k < 420; k++) { const x = (r() - 0.5) * W * 1.3, y = (r() + r() + r() - 1.5) * H * 0.07, s = r() * 1.1 + 0.2; g.fillRect(x, y, s, s); }
    g.restore();
  }
  // the Moon: a crescent with a soft glow. As the sun starts to come up in the east (right), it sets in the west (left):
  // it sinks along an arc and goes down behind the hills, which are painted over it
  const moonSet = skySmooth(0.08, 0.5, t);
  if (tier >= 10 && moonSet < 1) {
    const R = Math.min(W, H) * 0.032, mx = W * (0.2 - 0.12 * moonSet), my = H * (0.26 + 0.74 * moonSet * moonSet * (1.4 - 0.4 * moonSet)), mc = document.createElement('canvas');
    mc.width = mc.height = Math.ceil(R * 6 * d); const m = mc.getContext('2d'); m.scale(d, d);
    // the crescent on its own little canvas (a disc with an offset disc cut away), then a soft glow behind it
    m.fillStyle = '#eef1ff'; m.beginPath(); m.arc(R * 3, R * 3, R, 0, 6.283); m.fill();
    m.globalCompositeOperation = 'destination-out'; m.beginPath(); m.arc(R * 3 + R * 0.55, R * 3 - R * 0.22, R * 0.95, 0, 6.283); m.fill();
    g.globalAlpha = 1 - 0.35 * moonSet;
    const gl = g.createRadialGradient(mx - R * 0.35, my + R * 0.1, R * 0.5, mx - R * 0.35, my + R * 0.1, R * 3.2); gl.addColorStop(0, 'rgba(220,228,255,.16)'); gl.addColorStop(1, 'rgba(220,228,255,0)');
    g.fillStyle = gl; g.fillRect(mx - R * 4, my - R * 4, R * 8, R * 8);
    g.drawImage(mc, mx - R * 3, my - R * 3, R * 6, R * 6); g.globalAlpha = 1;
  }
  // the sun: below the mountains at dawn, climbing to high noon; a wide warm glow, then the disc
  const sunVis = skySmooth(0.2, 0.32, t), up = skySmooth(0.24, 1, t), warm = 1 - up;
  if (sunVis > 0) {
    const sx = W * 0.7, sy = H * (0.95 - 0.68 * up), R = Math.min(W, H) * (0.034 + 0.014 * warm);
    const sc = [255, 200 + 50 * up, 130 + 110 * up];
    g.globalCompositeOperation = 'screen';
    const wide = g.createRadialGradient(sx, sy, 0, sx, sy, H * (0.75 - 0.25 * up));
    wide.addColorStop(0, rgbaOf(sc, 0.42 * sunVis)); wide.addColorStop(0.25, rgbaOf([255, 170 + 70 * up, 120 + 110 * up], 0.16 * sunVis)); wide.addColorStop(1, rgbaOf(sc, 0));
    g.fillStyle = wide; g.fillRect(0, 0, W, H);
    const disc = g.createRadialGradient(sx, sy, 0, sx, sy, R * 1.6);
    disc.addColorStop(0, rgbaOf([255, 255, 245], sunVis)); disc.addColorStop(0.55, rgbaOf(sc, sunVis)); disc.addColorStop(1, rgbaOf(sc, 0));
    g.fillStyle = disc; g.beginPath(); g.arc(sx, sy, R * 1.6, 0, 6.283); g.fill();
    g.globalCompositeOperation = 'source-over';
  }
  // the land: ridges from far to near, each softened by haze toward the horizon colour (lighter and bluer far away)
  const hazeTo = mixRgb([10, 12, 26], hor, hor[3]);
  let first = true;
  for (const L of skyLayers()) {
    if (tier < L.at) continue;
    const base = skyCol(t, L.col), col = mixRgb(base, hazeTo, L.haze), dark = mixRgb(col, [2, 3, 8], 0.35);
    let minY = 1; for (let i = 0; i <= 80; i++) minY = Math.min(minY, L.y(i / 80));
    const lg = g.createLinearGradient(0, H * minY, 0, H); lg.addColorStop(0, rgbaOf(col)); lg.addColorStop(1, rgbaOf(dark));
    g.fillStyle = lg; g.beginPath(); g.moveTo(0, H);
    const n = Math.max(60, Math.round(W / 8));
    for (let i = 0; i <= n; i++) g.lineTo(W * i / n, H * L.y(i / n));
    g.lineTo(W, H); g.closePath(); g.fill();
    // the first light catches the farthest ridge at sunrise
    if (first && sunVis > 0 && warm > 0.2) { g.strokeStyle = rgbaOf([255, 196, 150], 0.35 * sunVis * warm); g.lineWidth = 1.2; g.beginPath(); for (let i = 0; i <= n; i++) { const x = W * i / n, y = H * L.y(i / n); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    // a little mist at its feet, in daylight
    if (t > 0.4) { const fy = H * (minY + 0.08), fg = g.createLinearGradient(0, fy - H * 0.05, 0, fy + H * 0.05); fg.addColorStop(0, rgbaOf(hor, 0)); fg.addColorStop(0.5, rgbaOf(hor, 0.18 * skySmooth(0.4, 1, t))); fg.addColorStop(1, rgbaOf(hor, 0)); g.fillStyle = fg; g.fillRect(0, fy - H * 0.05, W, H * 0.1); }
    first = false;
  }
  return mixRgb(skyCol(t, 4), [2, 3, 8], 0.35); // the colour of the nearest ground, for the grass
}
function startSky() {
  // two canvases: a change is painted on the hidden one, then the two cross-fade, so new things fade in
  const sky = $('sky'), cvs = [document.createElement('canvas'), document.createElement('canvas')];
  for (const c of cvs) { c.style.opacity = 0; sky.appendChild(c); }
  let front = 0, fadeUntil = 0;
  const el = {};
  for (const k of ['shoot', 'fire', 'embers', 'grass']) { const d = document.createElement('div'); d.className = 'sky-' + k; sky.appendChild(d); el[k] = d; }
  el.shoot.appendChild(document.createElement('i'));
  const fireY = () => (1 - skyLayers()[3].y(SKY_FIRE_X)) * 100 - 0.4; // the campfire sits on the nearest hill (vh from the bottom)
  el.fire.style.left = SKY_FIRE_X * 100 + 'vw';
  const embers = [];
  for (let i = 0; i < 18; i++) {
    const e = document.createElement('i'), s = (2 + Math.random() * 2.5).toFixed(1) + 'px';
    e.style.left = (SKY_FIRE_X * 100 + (Math.random() - 0.5) * 2.4).toFixed(2) + 'vw'; e.style.width = s; e.style.height = s;
    e.style.setProperty('--dx', ((Math.random() - 0.3) * 18).toFixed(1) + 'vw');
    e.style.animationDuration = (8 + Math.random() * 9).toFixed(1) + 's'; e.style.animationDelay = (-Math.random() * 17).toFixed(1) + 's';
    el.embers.appendChild(e); embers.push(e);
  }
  for (let i = 0; i < 40; i++) {
    const g = document.createElement('i');
    g.style.left = (i / 40 * 100 + Math.random() * 1.5).toFixed(2) + '%'; g.style.height = (1.6 + Math.random() * 3.4).toFixed(2) + 'vh';
    g.style.animationDuration = (1.6 + Math.random() * 1.6).toFixed(2) + 's'; g.style.animationDelay = (-Math.random() * 3).toFixed(2) + 's';
    el.grass.appendChild(g);
  }
  // show or hide an element with a fade; once it has faded out it is taken away (its animations stop)
  const fadeTo = (e, o) => {
    clearTimeout(e._ft);
    if (o > 0) { if (e.style.display === 'none') { e.style.opacity = 0; e.style.display = ''; void e.offsetWidth; } e.style.opacity = o; }
    else if (e.style.display !== 'none') { e.style.opacity = 0; e._ft = setTimeout(() => { e.style.display = 'none'; }, 5200); }
  };
  for (const k in el) el[k].style.display = 'none';
  let last = null, painted = null, size = innerWidth + 'x' + innerHeight;
  addEventListener('resize', () => { clearTimeout(startSky.rt); startSky.rt = setTimeout(() => { size = innerWidth + 'x' + innerHeight; }, 200); });
  up(() => {
    const on = !(S.settings.ui && S.settings.ui.sky === false), tier = S.stats.topTier;
    let t = on ? skyDay() : 0;
    if (SKY_DAWN) { const p = (performance.now() - SKY_DAWN - 700) / 9000; if (p >= 1) SKY_DAWN = 0; else t *= p <= 0 ? 0 : p * p * (3 - 2 * p); } // a new dawn after Ascension
    const key = [on, t.toFixed(3), tier, hasE('e52'), size].join('|');
    if (key === last) return;
    const now = performance.now(), direct = !painted || !!SKY_DAWN || painted !== size; // the first picture, the dawn replay and a new window size come at once
    if (!direct && now < fadeUntil) return; // a cross-fade is still running: the next change waits for it
    last = key; painted = size;
    const show = t > 0 || tier >= 6 ? 1 : 0; // nothing to paint before Bonfire or the first light
    let ground;
    if (direct) {
      ground = paintSky(cvs[front], t, tier);
      for (const c of cvs) c.style.transition = 'none';
      cvs[front].style.opacity = show; cvs[1 - front].style.opacity = 0;
    } else {
      const b = 1 - front; ground = paintSky(cvs[b], t, tier);
      for (const c of cvs) c.style.transition = 'opacity 2.6s ease-in-out';
      void cvs[b].offsetWidth; cvs[b].style.opacity = show; cvs[front].style.opacity = 0;
      front = b; fadeUntil = now + 2700;
    }
    sky.style.setProperty('--hill', rgbaOf(ground));
    const night = 1 - skySmooth(0.35, 0.7, t), fireOn = tier >= 2 ? 1 - skySmooth(0.4, 0.75, t) : 0;
    el.fire.style.bottom = fireY().toFixed(2) + 'vh'; fadeTo(el.fire, tier >= 6 ? fireOn : 0);
    fadeTo(el.embers, fireOn);
    for (const e of embers) e.style.bottom = (tier >= 6 ? fireY() : -2).toFixed(2) + 'vh';
    const n = tier < 2 ? 0 : tier < 3 ? 5 : tier < 5 ? 8 : tier < 7 ? 11 : tier < 8 ? 14 : 18; // more embers with every fire
    embers.forEach((e, i) => { e.style.display = i < n ? '' : 'none'; });
    fadeTo(el.shoot, tier >= 13 ? night : 0);
    fadeTo(el.grass, hasE('e52') ? 1 : 0); // Wind in Your Hair: grass in the wind
    const starsO = 1 - skySmooth(0.3, 0.8, t); $('stars').style.opacity = starsO.toFixed(3); STARS_HIDDEN = starsO < 0.01;
    // daylight: more solid panels and shadowed loose text
    const dayL = skySmooth(0.3, 1, t);
    if (dayL > 0) document.body.style.setProperty('--glass', `rgba(12,16,36,${(0.82 + 0.1 * dayL).toFixed(3)})`); else document.body.style.removeProperty('--glass');
    setC(document.body, 'daysky', dayL > 0.35);
  });
}
// Wind in Your Hair: streaks of wind, made once, shown while you own it and Animations are on
function startWind() {
  const w = $('wind');
  for (let i = 0; i < 22; i++) {
    const s = document.createElement('i');
    s.style.top = (Math.random() * 100).toFixed(1) + '%'; s.style.width = (8 + Math.random() * 22).toFixed(1) + 'vw';
    s.style.opacity = (0.3 + Math.random() * 0.7).toFixed(2);
    s.style.animationDuration = (4.5 + Math.random() * 5).toFixed(2) + 's'; s.style.animationDelay = (-Math.random() * 10).toFixed(2) + 's'; // a calm drift across the screen
    w.appendChild(s);
  }
  up(() => setC(w, 'on', hasE('e52') && !(S.settings.ui && S.settings.ui.motion === false)));
}
let STARS_HIDDEN = false; // set by the sky: in daylight the stars are invisible
function startStars() {
  const c = $('stars'), g = c.getContext('2d');
  let W = 0, H = 0, stars = [], last = 0;
  const resize = () => {
    const d = window.devicePixelRatio || 1;
    W = c.width = Math.floor(innerWidth * d); H = c.height = Math.floor(innerHeight * d);
    c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
    stars = Array.from({ length: Math.round(innerWidth * innerHeight / 4500) }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random(), p: Math.random() * 6.28, hue: Math.random() < 0.15 ? 270 : Math.random() < 0.3 ? 190 : 225 }));
  };
  resize(); addEventListener('resize', resize);
  const draw = ts => {
    requestAnimationFrame(draw);
    if (ts - last < 33 || document.body.classList.contains('nostars') || STARS_HIDDEN) return; // nothing to see: no drawing
    const dt = Math.min(0.1, (ts - last) / 1000); last = ts;
    const d = window.devicePixelRatio || 1;
    g.clearRect(0, 0, W, H);
    for (const s of stars) {
      s.y -= (3 + s.z * 12) * dt * d; if (s.y < 0) { s.y = H; s.x = Math.random() * W; }
      s.p += dt * (0.6 + s.z * 1.4);
      const a = 0.15 + 0.6 * s.z * (0.55 + 0.45 * Math.sin(s.p)), r = (0.5 + s.z * 1.3) * d;
      g.fillStyle = `hsla(${s.hue},90%,${80 + s.z * 15}%,${a})`;
      g.fillRect(s.x, s.y, r, r);
    }
  };
  requestAnimationFrame(draw);
}

const $ = id => document.getElementById(id);
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid != null) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return el;
}
function setT(el, s) {
  if (el._t === s) return;
  const c = el.firstChild; // keep the same text node when there is one, so a click in progress is not lost
  if (c && c === el.lastChild && c.nodeType === 3) c.nodeValue = s; else el.textContent = s;
  el._t = s;
}
function setH(el, s) { if (el._h !== s) { el.innerHTML = s; el._h = s; } }
function setC(el, c, on) { if (el.classList.contains(c) !== !!on) el.classList.toggle(c, !!on); }
function show(el, on) { const v = on ? '' : 'none'; if (el.style.display !== v) el.style.display = v; }
function setDis(el, d) { if (el.disabled !== !!d) el.disabled = !!d; }

const UI = { ups: [], tabs: {}, navBtns: {}, el: {}, genRows: [] };
const up = (fn, tab) => UI.ups.push([fn, tab]);
let R = {}; // per-render cache

function toast(msg, kind = '', always = false) {
  if (!always && S && S.settings.ui && !S.settings.ui.toasts) return;
  const box = $('toasts');
  while (box.children.length >= 5) box.firstChild.remove();
  const t = h('div', { class: 'toast ' + kind, onclick: () => t.remove() }, msg); // a tap dismisses it
  box.append(t);
  setTimeout(() => t.remove(), 4500);
}
function flash(color) {
  const f = $('flash'); f.style.background = `radial-gradient(circle at 50% 40%, ${color}, transparent 70%)`;
  f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
}
function oldSaveNotice(changes, then) {
  modal('Your save is from an older Apeiron', h('div', { html: 'Since this save was made, the game has changed a lot: ' + changes.map(c => c.what).join('; ') + '.<br><br>Your save still works and keeps everything you earned, but it was built under the old rules. To play the game as it is meant to be now, start fresh.' }), [
    ['Keep playing', () => { S.ver = SAVE_VER; save(); if (then) setTimeout(then, 60); }],
    ['Start fresh', () => { setTimeout(() => modal('Start fresh?', 'This wipes your save completely: progress, achievements, secrets and relics. There is no undo.', [
      ['Wipe and start fresh', () => hardWipe(true)],
      ['Back', () => { setTimeout(() => oldSaveNotice(changes, then), 60); }],
    ]), 60); }],
  ]);
}
// wipe the save; with restart the page reloads, so a fresh game begins with the intro
function hardWipe(restart) {
  sayClear(); S = newState();
  if (restart) { save(); location.reload(); return; }
  applyUI(); save(); setTab('gen'); toast('Fresh start.');
}
function modal(title, body, buttons) {
  const box = $('mbox'); box.innerHTML = '';
  box.append(h('h3', {}, title), h('div', { class: 'mb' }, body),
    h('div', { class: 'mbtns' }, buttons.map(([label, fn]) => h('button', { onclick: () => { if (fn() !== false) closeModal(); } }, label))));
  $('modal').classList.add('open');
}
const closeModal = () => $('modal').classList.remove('open');
