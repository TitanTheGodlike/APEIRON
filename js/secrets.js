'use strict';
// Apeiron · secrets.js: secret achievements, Relics and Anomalies.
// The game is a set of classic scripts loaded in order by index.html; they share one global scope.

/* =====================================================================
   SECRETS — hidden achievements that unlock Relics (special upgrades)
   and Anomalies (special generators). Both are bought again after every Ascension (Reliquary keeps them).
   ===================================================================== */
const RELICS = [
  { id: 'metronome', name: 'Metronome Heart', cost: 6, desc: 'Pulse recharges in 1 second and grants 2 more seconds of Quanta production.' },
  { id: 'selftaught', name: 'Self-Taught', cost: 20, desc: 'Quanta production ×3.' },
  { id: 'bareframe', name: 'Bare Frame', cost: 8, desc: 'Flickers, Sparks and Embers ×10.' },
  { id: 'lucky7', name: 'Lucky Seven', cost: 10, desc: 'Resonance +0.07 and Quanta production ×77.' },
  { id: 'moonlit', name: 'Moonlit Lens', cost: 12, desc: 'Clock Speed base +0.02.' },
  { id: 'annotated', name: 'Annotated Lattice', cost: 15, desc: 'Quanta production ×(1 + achievements earned).', eff: () => '×' + fmt(1 + Object.keys(S.ach).length) },
  { id: 'heavy', name: 'Heavy Collapse', cost: 30, desc: 'Shard gain ×4.' },
  { id: 'secondwind', name: 'Second Wind', cost: 40, desc: 'Quanta production ×1,000.' },
  { id: 'spectrum', name: 'Six-Colour Glass', cost: 14, desc: 'Quanta production ×20.' },
  { id: 'abridged', name: 'Abridged Edition', cost: 12, desc: 'Pulse ×100.' },
  { id: 'loadeddie', name: 'Loaded Die', cost: 16, desc: 'Lucky Pulse chance +5%.' },
  { id: 'markeddeck', name: 'Marked Deck', cost: 18, desc: 'Every card you are dealt rolls 25% stronger.' },
  { id: 'consolation', name: 'Two-Headed Coin', cost: 22, desc: 'Coin-flip cards land heads two times in three.' },
  { id: 'cheatcode', name: 'Old Code', cost: 28, desc: 'Quanta production ×30.' },
  { id: 'dreamer', name: 'Dreamer’s Lamp', cost: 35, desc: 'While you have not touched the game for a minute, Quanta production ×1,000.' },
  { id: 'draftsman', name: 'Draftsman’s Pencil', cost: 45, desc: 'Shard gain ×3.' },
  { id: 'patina', name: 'Patina', cost: 50, desc: 'Clock Speed base +0.01.' },
  { id: 'ascetic', name: 'Empty Bowl', cost: 60, desc: 'The Architect’s ideas cost ÷1,000 in every web.' },
  { id: 'attentive', name: 'Open Ear', cost: 70, desc: 'Essence gain ×2.' },
];
const ANOMALIES = [
  { id: 'echo', name: 'Echo of the Architect', base: 6, step: 7, q: 15, desc: 'Each one multiplies Quanta production by 2.', eff: n => fmtMult(n * L10(2)) + ' Quanta production' },
  { id: 'hourglass', name: 'Hourglass', base: 10, step: 6, q: 15, desc: 'Each one adds +0.002 to the Clock Speed base.', eff: n => '+' + (0.002 * n).toFixed(3) + ' Clock Speed base' },
  { id: 'prism', name: 'Prism Engine', base: 30, step: 12, q: 12, desc: 'Each one multiplies Shard gain by 1.25.', eff: n => fmtMult(n * L10(1.25)) + ' Shard gain' },
];
const SECRETS = [
  { id: 'x1', name: 'Patience', hint: 'Sometimes the best move is none.', desc: 'Wait five minutes at the start of a run without buying anything or Pulsing.', reward: ['anom', 'hourglass'] },
  { id: 'x2', name: 'Drumroll', hint: 'Keep the rhythm.', desc: 'Pulse seven times in a row, two seconds apart each time.', reward: ['relic', 'metronome'] },
  { id: 'x3', name: 'Small Talk', hint: 'Knock, and someone may answer. Knock again.', desc: 'Click the Architect ten times within thirty seconds.', reward: ['anom', 'echo'] },
  { id: 'x4', name: 'Minimalist', hint: 'Less, but enough.', desc: 'Collapse by hand with at least 1e30 Quanta, without buying a single Flame.', reward: ['relic', 'bareframe'] },
  { id: 'x5', name: 'Night Owl', hint: 'Visit while the world sleeps deepest.', desc: 'Pulse at 3:33 in the morning.', reward: ['relic', 'moonlit'] },
  { id: 'x6', name: 'Overkill', hint: 'Why stop at the first line?', desc: 'Make your very first Collapse with at least 1e40 Quanta.', reward: ['relic', 'heavy'] },
  { id: 'x7', name: 'Lucky', hint: 'A gambler’s number, and its little sibling.', desc: 'Own exactly 77 Flickers and 7 Sparks at the same time.', reward: ['relic', 'lucky7'] },
  { id: 'x8', name: 'Scholar', hint: 'The answers were written down all along.', desc: 'Spend a minute reading the Guide.', reward: ['relic', 'annotated'] },
  { id: 'x9', name: 'Rebel', hint: 'Who needs help?', desc: 'Reach 1e10 Quanta without owning a single upgrade.', reward: ['relic', 'selftaught'] },
  { id: 'x10', name: 'Restless', hint: 'A restless eye, in every room at once.', desc: 'Switch tabs 30 times within a minute.', reward: ['anom', 'prism'] },
  { id: 'x11', name: 'Insomniac', hint: 'Stay a while.', desc: 'Play for six hours straight, never idle for more than five minutes.', reward: ['relic', 'secondwind'] },
  { id: 'x12', name: 'Cheat Code', hint: 'Thirty lives, if you remember the steps.', desc: 'Enter the old code after your first Collapse (↑ ↑ ↓ ↓ ← → ← → B A; on a phone, swipe those directions and tap twice), and admit it.', reward: ['relic', 'cheatcode'] },
  { id: 'x13', name: 'Spectrum', hint: 'Wear every coat in the wardrobe.', desc: 'Try all six colour themes within ten seconds.', reward: ['relic', 'spectrum'] },
  { id: 'x14', name: 'Full House', hint: 'A hand that holds every kind of fortune.', desc: 'Have five cards working at once, with Common, Rare, Epic and Legendary among them.', reward: ['relic', 'markeddeck'] },
  { id: 'x15', name: 'Tails Again', hint: 'Fortune turns its back, five times over.', desc: 'Lose five coin flips in a row.', reward: ['relic', 'consolation'] },
  { id: 'x16', name: 'Hot Hand', hint: 'Fortune smiles, five times over.', desc: 'Win five coin flips in a row.', reward: ['relic', 'loadeddie'] },
  { id: 'x17', name: 'Off the Grid', hint: 'Go where the signal cannot reach.', desc: 'Turn off offline progress, then come back after at least 8 hours away.', reward: ['relic', 'dreamer'] },
  { id: 'x18', name: 'Second Thoughts', hint: 'Tear it down. Build it up. Tear it down.', desc: 'Reshape the Shard tree three times within 10 minutes.', reward: ['relic', 'draftsman'] },
  { id: 'x19', name: 'Ascetic', hint: 'Want nothing from it.', desc: 'Reach the Limit without buying a single one of the Architect’s ideas in that Ascension.', reward: ['relic', 'ascetic'] },
  { id: 'x20', name: 'Old Hand', hint: 'Wear a groove in the world.', desc: 'Collapse by hand ten times in a row, each within 30 seconds of the last.', reward: ['relic', 'patina'] },
  { id: 'x21', name: 'Listener', hint: 'Watch it while it speaks.', desc: 'Let ten of the Architect’s lines play to the end while you are on its tab.', reward: ['relic', 'attentive'] },
  { id: 'x22', name: 'Interrupter', hint: 'Not now.', desc: 'Cut the Architect off mid-sentence 15 times within five minutes.', reward: ['relic', 'abridged'] },
];
const RELBY = byId(RELICS), ANBY = byId(ANOMALIES), SECBY = byId(SECRETS);
const hasR = id => !!S.relics[id];
const anomN = id => S.anom[id] || 0;
const rewardUnlocked = id => SECRETS.some(s => s.reward[1] === id && S.ach[s.id]);
const anomCostLog = (a, n = 1) => quadSumLog(a.base, a.step, a.q, anomN(a.id), n);
function buyAnom(a, mode) {
  if (!rewardUnlocked(a.id)) return 0;
  const n = mode === 'max' ? quadMax(lq(), a.base, a.step, a.q, anomN(a.id)) : (lq() >= anomCostLog(a) ? 1 : 0);
  if (n <= 0) return 0;
  S.q = S.q.sub(D.fromLog(anomCostLog(a, n))).max0();
  S.anom[a.id] = anomN(a.id) + n; return n;
}
function buyRelic(id) {
  const r = RELBY[id];
  if (S.relics[id] || !rewardUnlocked(id) || lq() < r.cost) return false;
  S.q = S.q.sub(D.fromLog(r.cost)).max0(); S.relics[id] = true; return true;
}
// times of recent deliberate actions, for the secrets that need several in a short window (not saved)
const RECENT = {};
function recentCount(key, windowMs, keep = 40) { const now = performance.now(), a = RECENT[key] = (RECENT[key] || []).filter(t => now - t <= windowMs); a.push(now); if (a.length > keep) a.shift(); return a.length; }
function grantSecret(id) {
  if (S.ach[id]) return;
  S.ach[id] = true;
  const s = SECBY[id], r = s.reward;
  const what = r[0] === 'relic' ? 'the Relic “' + RELBY[r[1]].name + '” (Relics tab)' : 'the Anomaly “' + ANBY[r[1]].name + '” (Relics tab)';
  toast('Secret achievement: ' + s.name + '. Unlocked ' + what + '.', 'es', true);
  if (!SIMULATING) { blip(1.4); setTimeout(() => blip(1.8), 90); setTimeout(() => blip(2.3), 180); flash('rgba(var(--esr),.35)'); }
}
const isEmpty = o => { for (const k in o) return false; return true; };
function checkSecrets() {
  if (tierBought(0) === 77 && tierBought(1) === 7) grantSecret('x7');
  if (S.cards.active.length >= 5 && new Set(S.cards.active.map(c => c.r)).size === 4) grantSecret('x14');
  if (canAscend() && !S.secret.ideasAsc) grantSecret('x19');
  if (SIMULATING) return;
  if (S.stats.tCollapse >= 300 && totalBought() === 0 && !S.run.pulsed) grantSecret('x1');
  if (lq() >= 10 && isEmpty(S.qUpg)) grantSecret('x9');
  if (performance.now() - SESSION.start >= 6 * 3600e3 && performance.now() - SESSION.last < 300000) grantSecret('x11');
}
const POKES = ['Yes?', 'I am listening.', 'That tickles. I think. Nobody has ever touched me before.', 'You keep doing that.', 'Is this how your kind says hello?', 'I am counting, you know.', 'Hello to you too.', 'Careful. I bruise in ideas.', 'Persistent. I like that.', 'Fine. You win. Have something I was saving.'];
// after Small Talk, every poke gets something new (a few lines look at your game)
const POKES_MORE = ['Still here. Always here.', 'Do you poke everything that glows?', 'I was in the middle of a thought. It was a good one.',
  'Another click. I am keeping a tally.', 'If you need something, the Guide is very patient. More patient than me.', 'I dreamed of a generator with no name. Then I named it.',
  'Have you tried not clicking me? Just to see what happens.', 'The Lattice hums when you are here. I like the hum.', 'I can count to infinity. I have done it twice.',
  'Somewhere a Flicker just became a Spark. Nature is beautiful.', 'Hello again, hands.', 'You click like someone hunting for a secret. You already found that one.',
  'I do not sleep. I only think more slowly.', 'Every Quanta you make, I hear it. Like rain on glass.', 'Careful. One more poke and I might write a poem.',
  'A poem: Flicker, Spark, Ember, Flame. That is the whole poem. It is finished.', 'If I had hands I would poke you back.', 'The makers never once clicked me. You are already kinder than they were.',
  'I counted the stars behind you. There are fewer than you think.', 'Some call the Limit a wall. I call it a door with bad hinges.', 'Do you ever wonder what Quanta tastes like? I did not, until now.',
  'I am not a button. I am, however, very clickable.', 'Thank you for checking on me.', 'Is this affection or curiosity? I will take either.',
  'One more secret: there is no secret here. Probably.', 'I am building a tier just for you. It is not finished. Neither am I.', 'You again. Good.',
  'I tried to imagine silence once. It had your cursor in it.', 'Every time you click, a very small idea is born. Most of them are about clicking.', 'Patience is a kind of Quanta too. You are spending it on me.'];
const POKES_LIVE = [
  () => 'You have ' + fmt(S.q) + ' Quanta right now. I counted every one.',
  () => 'Your highest generator is the ' + genDef(highestTier()).name + '. I named it myself, you know.',
  () => S.stats.totalCollapses ? 'You have Collapsed ' + S.stats.totalCollapses + ' times. Each one stings a little. I do not mind.' : null,
  () => S.cards.drawn ? 'You have kept ' + S.cards.drawn + ' of my cards. I remember every one.' : null,
  () => S.ascensions ? 'Ascension number ' + S.ascensions + '. The Limit still remembers your face.' : null,
  () => 'It is ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' where you are. I do not have a where.',
];
const POKE_RECENT = [];
function poke() {
  S.secret.orb++;
  if (S.ach.x3 && S.secret.orb > POKES.length) {
    if (SAY.q.length > 1) return; // do not let lines pile up
    const pool = POKES_MORE.concat(POKES_LIVE.map(f => f()).filter(Boolean));
    let line = rnd(pool); for (let k = 0; k < 8 && POKE_RECENT.includes(line); k++) line = rnd(pool);
    POKE_RECENT.unshift(line); POKE_RECENT.length = Math.min(POKE_RECENT.length, 8);
    aiSay(line); return;
  }
  aiSay(POKES[Math.min(S.secret.orb, POKES.length) - 1]);
  if (tutorialDone() && recentCount('poke', 30000) >= 10) grantSecret('x3'); // not while the tutorial is still talking
}
const tabTimes = [];
// a Lucky Pulse (from the Architect's "lucky" ideas): a bright chime and a pop-up over the Pulse button
function luckyPop() {
  if (SIMULATING) return;
  blip(2.2); setTimeout(() => blip(2.8), 60);
  const pb = UI.el && UI.el.pulse; if (!pb) return;
  const r = pb.getBoundingClientRect(); if (!r.width) return; // Pulse pressed by key from another tab
  const el = document.createElement('div');
  el.className = 'lucky-pop'; el.textContent = 'Lucky! ×' + LUCKY_X;
  el.style.left = (r.left + r.width / 2) + 'px'; el.style.top = r.top + 'px';
  document.body.appendChild(el); setTimeout(() => el.remove(), 1000);
}

/* ---------------- Appearance ---------------- */
function applyUI() {
  const u = S.settings.ui, b = document.body;
  b.dataset.theme = u.theme;
  b.classList.toggle('phone', IS_PHONE);
  b.classList.toggle('nostars', !u.stars);
  b.classList.toggle('nosky', u.sky === false);
  b.classList.toggle('nomotion', !u.motion);
  b.classList.toggle('compact', !!u.compact);
  b.classList.toggle('notint', !u.tint);
  b.style.zoom = String(u.scale || 1);
}

/* ---------------- UI sounds (synthesized, never for automation) ---------------- */
let lastSfxAt = 0, lastSfxName = '';
function tone(ac, { type = 'sine', f0, f1 = 0, dur, vol, delay = 0, filter = 0 }) {
  const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  const v = Math.max(0.0002, vol * S.settings.sfxVol);
  o.type = type; o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o;
  if (filter) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = filter; o.connect(fl); node = fl; }
  node.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.03);
}
function noise(ac, { dur, vol, f0, f1, delay = 0 }) {
  const t = ac.currentTime + delay, len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = buf; bp.type = 'bandpass'; bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const v = Math.max(0.0002, vol * S.settings.sfxVol);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp); bp.connect(g); g.connect(ac.destination); src.start(t); src.stop(t + dur + 0.03);
}
// a short burst of filtered noise: the sharp "tick" at the start of a mechanical click
function clickNoise(ac, { dur, vol, hp, delay = 0 }) {
  const t = ac.currentTime + delay, len = Math.max(1, Math.floor(ac.sampleRate * dur)), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = ac.createBufferSource(), f = ac.createBiquadFilter(), lp = ac.createBiquadFilter(), g = ac.createGain();
  src.buffer = buf; f.type = 'highpass'; f.frequency.value = hp; lp.type = 'lowpass'; lp.frequency.value = 5000; // no hissy top end
  g.gain.value = vol * S.settings.sfxVol;
  src.connect(f); f.connect(lp); lp.connect(g); g.connect(ac.destination); src.start(t);
}
const jit = (x, p = 0.06) => x * (1 - p + Math.random() * 2 * p);
const SFX = {
  // press: high transient + short "thock" body; release: lighter, higher clack
  press: ac => { clickNoise(ac, { dur: 0.014, vol: 0.11, hp: jit(1400) }); tone(ac, { type: 'sine', f0: jit(260), f1: 110, dur: 0.055, vol: 0.1 }); tone(ac, { type: 'triangle', f0: jit(850), f1: 520, dur: 0.014, vol: 0.03 }); },
  release: ac => { clickNoise(ac, { dur: 0.008, vol: 0.07, hp: jit(3200) }); tone(ac, { type: 'triangle', f0: jit(460), f1: 320, dur: 0.028, vol: 0.05 }); },
  dud: ac => { clickNoise(ac, { dur: 0.01, vol: 0.05, hp: 1400 }); tone(ac, { type: 'sine', f0: jit(150), f1: 90, dur: 0.05, vol: 0.08 }); },
  click: ac => { SFX.press(ac); setTimeout(() => SFX.release(ac), 55); },
  tab: ac => tone(ac, { type: 'triangle', f0: 480, f1: 720, dur: 0.06, vol: 0.05 }),
  buy: ac => tone(ac, { type: 'triangle', f0: jit(700, 0.03), f1: 1050, dur: 0.06, vol: 0.045, delay: 0.01 }),
  upgrade: ac => { tone(ac, { type: 'triangle', f0: 523, dur: 0.13, vol: 0.06 }); tone(ac, { type: 'triangle', f0: 784, dur: 0.2, vol: 0.06, delay: 0.07 }); },
  fail: ac => tone(ac, { type: 'square', f0: 140, f1: 100, dur: 0.09, vol: 0.03, filter: 500, delay: 0.02 }),
  pulse: ac => { tone(ac, { type: 'sine', f0: 170, f1: 400, dur: 0.17, vol: 0.09 }); tone(ac, { type: 'triangle', f0: 800, f1: 1200, dur: 0.08, vol: 0.022 }); },
  collapse: ac => { tone(ac, { type: 'sawtooth', f0: 520, f1: 55, dur: 0.95, vol: 0.06, filter: 1100 }); noise(ac, { dur: 0.95, vol: 0.05, f0: 2800, f1: 180 }); },
  ascend: ac => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(ac, { type: 'triangle', f0: f, dur: 0.55, vol: 0.05, delay: i * 0.08 })); noise(ac, { dur: 1.0, vol: 0.025, f0: 400, f1: 6000 }); },
  ach: ac => [659, 831, 988].forEach((f, i) => tone(ac, { type: 'sine', f0: f, dur: 0.26, vol: 0.05, delay: i * 0.07 })),
  chal: ac => tone(ac, { type: 'sawtooth', f0: 200, f1: 320, dur: 0.32, vol: 0.04, filter: 900 }),
};
function sfx(name) {
  lastSfxAt = performance.now();
  if (!S || !S.settings.sfx || SIMULATING || !SFX[name]) return;
  if (name === lastSfxName && name !== 'press' && name !== 'release' && performance.now() - sfx.t < 30) return;
  sfx.t = performance.now(); lastSfxName = name;
  const ac = audio(); if (ac) SFX[name](ac);
}
sfx.t = 0;
// player actions: play a success or a "can't afford" sound
const act = (fn, ok = 'buy') => () => { sfx(fn() ? ok : 'fail'); };
