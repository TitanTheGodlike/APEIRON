'use strict';
// Apeiron · sound.js: sound, the Architect's voice, the typewriter.
// The game is a set of classic scripts loaded in order by index.html; they share one global scope.

/* =====================================================================
   SOUND + TYPEWRITER (the Architect's voice)
   ===================================================================== */
const SND = { ctx: null };
function audio() {
  if (!SND.ctx) { try { SND.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (SND.ctx.state === 'suspended') SND.ctx.resume();
  return SND.ctx;
}
function blip(pitch = 1) {
  if (!S || !S.settings.sound || SIMULATING) return;
  const ac = audio(); if (!ac) return;
  const t = ac.currentTime, o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
  const base = 190 * pitch * (0.92 + Math.random() * 0.16);
  o.type = 'square'; o.frequency.setValueAtTime(base, t);
  o2.type = 'triangle'; o2.frequency.setValueAtTime(base * 2.01, t);
  f.type = 'lowpass'; f.frequency.value = 1500;
  const v = 0.045 * S.settings.volume;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  o.connect(f); o2.connect(f); f.connect(g); g.connect(ac.destination);
  o.start(t); o2.start(t); o.stop(t + 0.08); o2.stop(t + 0.08);
}

/* The Architect's voice, Animal Crossing style: every letter is one quick sung syllable. The vowel colour
   (two formant filters) and the note come from the letter, the voice slides up a little on each syllable,
   and it all runs through an analyser so the orbs can dance to it. */
const VOWELS = [[730, 1090], [530, 1840], [270, 2290], [570, 840], [300, 870]]; // a e i o u
function voiceOut(ac) {
  if (!SND.vout) { SND.vout = ac.createGain(); SND.an = ac.createAnalyser(); SND.an.fftSize = 64; SND.an.smoothingTimeConstant = 0.55; SND.vout.connect(SND.an); SND.an.connect(ac.destination); }
  return SND.vout;
}
// Split a line into rough syllables, Japanese style: a few consonants plus their vowel make one beat, and a
// word-final n gets a beat of its own. Returns { index of the beat's first letter: { v: vowel, on: onset } }.
function syllables(text) {
  const beats = {}, re = /[a-z]+|\d+/gi; let m;
  while ((m = re.exec(text))) {
    const w = m[0], base = m.index;
    if (/\d/.test(w)) { for (let i = 0; i < w.length; i += 2) beats[base + i] = { v: 'aeiou'[+w[i] % 5], on: w[i] }; continue; }
    const sre = /[^aeiouy]*[aeiouy]+|n$/gi; let s, any = false;
    while ((s = sre.exec(w))) { const v = (s[0].match(/[aeiouy]/i) || ['n'])[0].toLowerCase(); beats[base + s.index] = { v: v === 'y' ? 'i' : v, on: s[0][0].toLowerCase() }; any = true; }
    if (!any) beats[base] = { v: 'u', on: w[0].toLowerCase() }; // a word with no vowel (hmm) still gets one beat
  }
  return beats;
}
function voiceNodes(ac, dest, t, syl, pitch, vol) {
  const on = syl.on.charCodeAt(0), vi = syl.v === 'n' ? 4 : 'aeiou'.indexOf(syl.v);
  const f0 = 220 * pitch * Math.pow(2, (((on * 7 + vi * 3) % 12) - 4) / 12) * (0.97 + Math.random() * 0.06);
  const o = ac.createOscillator(), g = ac.createGain(), b1 = ac.createBiquadFilter(), b2 = ac.createBiquadFilter();
  // a consonant start dips in from a little above the note; a vowel start glides gently up
  o.type = 'sawtooth'; o.frequency.setValueAtTime(syl.on === syl.v ? f0 : f0 * 1.12, t); o.frequency.linearRampToValueAtTime(f0 * 1.05, t + 0.06);
  b1.type = b2.type = 'bandpass'; b1.frequency.value = VOWELS[vi][0]; b2.frequency.value = VOWELS[vi][1]; b1.Q.value = 5; b2.Q.value = 7;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  o.connect(b1); o.connect(b2); b1.connect(g); b2.connect(g); g.connect(dest);
  o.start(t); o.stop(t + 0.1);
}
function voice(syl, pitch = 1) {
  if (!syl) return;
  VIZ.kick = 1; VIZ.seed = syl.on.charCodeAt(0); vizWake(); // the dots bounce even with the sound off
  if (!S || !S.settings.sound || SIMULATING) return;
  const ac = audio(); if (!ac) return;
  const t = ac.currentTime; if (t - (SND.lastVoice || 0) < 0.045) return; // about 22 syllables a second at most
  SND.lastVoice = t;
  voiceNodes(ac, voiceOut(ac), t, syl, pitch, 0.26 * S.settings.volume);
}
// A ring of dots around a talking orb that moves with the voice
const VIZ = { orbs: [], kick: 0, seed: 0, bins: null, raf: 0 };
// the dots only move while someone talks: once every ring has settled the loop sleeps until the next voice
const vizWake = () => { if (!VIZ.raf && VIZ.orbs.length) VIZ.raf = requestAnimationFrame(vizFrame); };
function attachViz(orb, n = 16) {
  if (!orb || orb._viz) return;
  const ring = document.createElement('div'); ring.className = 'viz';
  const dots = []; for (let i = 0; i < n; i++) { const d = document.createElement('i'); ring.appendChild(d); dots.push(d); }
  orb.appendChild(ring); orb.classList.add('has-viz'); orb._viz = { dots, level: new Array(n).fill(0) };
  if (VIZ.orbs.length > 1) VIZ.orbs = VIZ.orbs.filter(o => o.isConnected);
  VIZ.orbs.push(orb);
  vizWake();
}
function vizFrame() {
  VIZ.raf = 0;
  let live = !!(SND.an && S && S.settings.sound && SND.ctx && SND.ctx.state === 'running');
  if (live) { if (!VIZ.bins) VIZ.bins = new Uint8Array(SND.an.frequencyBinCount); SND.an.getByteFrequencyData(VIZ.bins); live = VIZ.bins.some(b => b > 8); }
  VIZ.kick *= 0.86;
  let awake = false;
  for (const orb of VIZ.orbs) {
    const v = orb._viz, talking = orb.classList.contains('talk'), n = v.dots.length, R = orb.offsetWidth / 2 + Math.max(5, orb.offsetWidth * 0.12);
    if (talking) awake = true;
    if (!R) continue;
    let any = false;
    for (let i = 0; i < n; i++) {
      // each dot listens to its own slice of the voice (mirrored, so the ring looks balanced)
      const k = i < n / 2 ? i : n - 1 - i;
      let a = live && VIZ.bins ? VIZ.bins[2 + k % (VIZ.bins.length - 2)] / 255 : VIZ.kick * (0.5 + 0.5 * Math.abs(Math.sin(VIZ.seed * 0.7 + k * 1.3)));
      if (!talking) a = 0;
      v.level[i] += (a - v.level[i]) * 0.45;
      if (v.level[i] > 0.01) any = true;
      const L = v.level[i];
      v.dots[i].style.transform = `rotate(${(360 / n) * i}deg) translateY(${(-R - L * R * 0.45).toFixed(1)}px) scale(${(1 + L * 1.6).toFixed(2)})`;
      v.dots[i].style.opacity = (0.35 + L * 0.65).toFixed(2);
    }
    if (any) awake = true;
    orb.classList.toggle('viz-on', any);
  }
  if (awake) VIZ.raf = requestAnimationFrame(vizFrame);
}
function htmlSlice(html, n) {
  let out = '', count = 0, i = 0;
  while (i < html.length && count < n) {
    const c = html[i];
    if (c === '<') { const j = html.indexOf('>', i); out += html.slice(i, j + 1); i = j + 1; continue; }
    if (c === '&') { const j = html.indexOf(';', i); out += html.slice(i, j + 1); i = j + 1; count++; continue; }
    out += c; i++; count++;
  }
  return out;
}
const plainOf = html => html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '·');
function typewriter(el, html, { speed = 30, pitch = 1, orb = null, onDone = null } = {}) {
  const plain = plainOf(html), total = plain.length, beats = syllables(plain);
  let n = 0, timer = null, done = false;
  const finish = () => { if (done) return; done = true; clearTimeout(timer); el.innerHTML = html; if (orb) orb.classList.remove('talk'); if (onDone) onDone(); };
  const step = () => {
    if (done) return;
    n++; el.innerHTML = htmlSlice(html, n);
    const ch = plain[n - 1] || '';
    voice(beats[n - 1], pitch);
    if (n >= total) return finish();
    timer = setTimeout(step, /[.!?…]/.test(ch) ? 280 : /[,;:—]/.test(ch) ? 140 : speed);
  };
  if (orb) { orb.classList.add('talk'); vizWake(); }
  el.innerHTML = '';
  timer = setTimeout(step, speed);
  return { finish, isDone: () => done };
}
