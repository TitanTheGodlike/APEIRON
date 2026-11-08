'use strict';
// Apeiron · cards.js: cards and Boons.
// The game is a set of classic scripts loaded in order by index.html; they share one global scope.

/* =====================================================================
   CARDS: once you have Collapsed, the Architect deals three cards every
   ten minutes and you keep one. Rarity is random and so is each card's roll;
   buffs run on game time, a few last until your next Collapse or Ascension.
   ===================================================================== */
const RARITY = [
  { id: 'common', name: 'Common', w: 60, p: 1 },
  { id: 'rare', name: 'Rare', w: 28, p: 2 },
  { id: 'epic', name: 'Epic', w: 10, p: 3.5 },
  { id: 'legend', name: 'Legendary', w: 2, p: 6 },
];
const DEAL_EVERY = 600; // seconds of game time between hands
const dealEvery = () => (hasE('e46') ? 420 : DEAL_EVERY) * (boonHas('deal') ? 0.5 : 1); // Full House, the Dealer Boon
const handSize = () => hasE('e46') ? 4 : 3;
const NUMW = ['no', 'one', 'two', 'three', 'four', 'five'];
const cardsOn = () => !!S.sUpg.s1; // Fracture, the root of the Shard web, starts the deck
const cardScale = () => 0.6 + Math.max(0, runBestLog()) / 120; // a card matters early and late
const durTxt = s => s % 60 === 0 && s >= 60 ? (s / 60) + (s === 60 ? ' minute' : ' minutes') : fmtTime(s); // 300 → '5 minutes'
const untilTxt = c => c.dur < 0 ? (c.k === 'ess' ? 'until you Ascend' : 'until you Collapse') : 'for ' + durTxt(c.dur);
const CARD_KINDS = {
  qmult: { w: 3, g: '☀', names: ['Bright Hour', 'Gold Leaf', 'Open Window', 'Sunlit Page', 'High Tide'], dur: 300, val: (p, s) => 0.7 * p * s, text: c => 'Quanta production ' + fmtMult(c.v) + ' ' + untilTxt(c) + '.' },
  speed: { w: 1.4, g: '⏱', names: ['Quickening', 'Racing Heart', 'Tailwind', 'Spun Gears'], dur: 180, val: p => 0.05 * p, text: c => 'Every generator ' + fmtMult(c.v) + ' ' + untilTxt(c) + '.' },
  top: { w: 2, g: '▲', names: ['Crowned Tier', 'Summit', 'Spire', 'Lighthouse Keeper'], dur: -1, val: (p, s) => 1.4 * p * s, text: c => 'Your highest generator ' + fmtMult(c.v) + ' ' + untilTxt(c) + '.' },
  pulse: { w: 1.4, g: '✋', names: ['Drumroll', 'Quick Hands', 'Heartbeat', 'Strike Twice'], dur: 180, val: p => 1.5 * p, text: c => 'Pulse ' + fmtMult(c.v) + ' and it recharges twice as fast ' + untilTxt(c) + '.' },
  lucky: { w: 1, g: '✧', names: ['Four Leaves', 'Loaded Die', 'Wishbone', 'Shooting Star'], dur: 300, val: p => 0.06 * p, text: c => 'Lucky Pulse chance +' + pct(c.v) + ' ' + untilTxt(c) + '.' },
  res: { w: 1.2, g: '≋', names: ['Tuned Strings', 'Echo Chamber', 'Perfect Fifth', 'Ringing Bell'], dur: 300, val: p => 0.02 * p, text: c => 'Resonance +' + c.v.toFixed(2) + ' ' + untilTxt(c) + '.' },
  idle: { w: 1.2, g: '☾', names: ['Long Nap', 'Still Water', 'Dreaming', 'Quiet Night'], dur: 900, val: (p, s) => p * s, text: c => 'While you have not touched the game for a minute, Quanta production ' + fmtMult(c.v) + ' ' + untilTxt(c) + '.' },
  time: { w: 1.5, g: '⌛', names: ['Borrowed Time', 'Lost Hour', 'Stopped Clock', 'Time Capsule'], instant: true, val: p => 120 * p, text: c => 'Right now: gain ' + durTxt(Math.round(c.v / 60) * 60) + ' of Quanta production.' },
  shard: { w: 1.5, req: () => S.collapses > 0 || S.ascensions > 0, g: '◆', names: ['Fault Line', 'Geode', 'Cracked Mirror', 'Shard Storm'], dur: -1, val: p => L10(1 + p), text: c => 'Your next Collapse gives ' + fmtMult(c.v) + ' Shards.' },
  ess: { w: 1, req: () => S.ascensions > 0, g: '✧', names: ['Distilled Light', 'Halo', 'Vesper', 'Last Ember'], dur: -1, val: p => L10(1 + 0.5 * p), text: c => 'Your next Ascension gives ' + fmtMult(c.v) + ' Essence.' },
  abil: { w: 0.8, req: () => hasS('s25') || hasS('s26') || hasE('e43'), g: '↻', names: ['Second Wind', 'Rewind', 'Encore'], instant: true, val: () => 1, text: () => 'Right now: your abilities recharge (Surge, Time Fold, Nova).' },
  ideas: { w: 0.8, g: '✦', names: ['Inspiration', 'Sketchbook', 'Bright Idea', 'Muse'], dur: 600, val: p => p, text: c => 'The Architect’s ideas cost ÷' + fmt(D.fromLog(c.v)) + ' ' + untilTxt(c) + '.' },
  gamble: { w: 0.7, g: '⚀', names: ['Coin Flip', 'Double or Nothing', 'Wild Card'], val: (p, s) => 2 * p * s, text: c => 'A coin flip when you keep it: heads, Quanta production ' + fmtMult(c.v) + ' for 10 minutes; tails, nothing.' },
};
// Boons add to the same effects as the cards, so they work everywhere a card of that kind would
const cardSum = k => { let s = 0; for (const c of S.cards.active) if (c.k === k) s += c.v; for (const b of S.boon.active) if (b.k === k) s += b.v; return s; };
const cardHas = k => S.cards.active.some(c => c.k === k) || S.boon.active.some(b => b.k === k);
/* Boons (Observatory, Wonders branch): with every Ascension I show you a few and you keep one (Twin Stars: two).
   A Boon lasts until the next Ascension. Its strength is set when it is dealt, from the best Quanta you ever had,
   about a very lucky Legendary card's worth; Wide Sky makes them half again as strong. */
const BOON_KINDS = {
  qmult: { g: '☀', names: ['The Sun', 'Gilded Sky', 'Noon'], val: s => CARD_KINDS.qmult.val(9, s), text: v => 'Quanta production ' + fmtMult(v) + '.' },
  top: { g: '▲', names: ['The Tower', 'High Star', 'Summit'], val: s => CARD_KINDS.top.val(9, s), text: v => 'Your highest generator ' + fmtMult(v) + '.' },
  idle: { g: '☾', names: ['The Moon', 'Long Night', 'Deep Sleep'], val: s => CARD_KINDS.idle.val(9, s), text: v => 'While you have not touched the game for a minute, Quanta production ' + fmtMult(v) + '.' },
  pulse: { g: '✋', names: ['The Hand', 'Drumbeat'], val: () => CARD_KINDS.pulse.val(9), text: v => 'Pulse ' + fmtMult(v) + ', and it recharges twice as fast.' },
  lucky: { g: '✧', names: ['The Wheel', 'Fortune'], val: () => CARD_KINDS.lucky.val(3), text: v => 'Lucky Pulse chance +' + pct(v) + '.' },
  shard: { g: '◆', names: ['The Quarry', 'Broken Crown'], val: () => L10(30), text: v => 'Every Collapse gives ' + fmtMult(v) + ' Shards.' },
  ess: { g: '✧', names: ['The Chalice', 'Distiller'], val: () => L10(3), text: v => 'Your next Ascension gives ' + fmtMult(v) + ' Essence.' },
  ideas: { g: '✦', names: ['The Muse', 'Open Book'], val: () => 6, text: v => 'The Architect’s ideas cost ÷' + fmt(D.fromLog(v)) + '.' },
  abilcd: { g: '↻', names: ['The Wind', 'Quick Breath'], req: () => hasS('s25') || hasS('s26') || hasE('e43'), val: () => 0, text: () => 'Surge, Time Fold and Nova recharge twice as fast.' },
  deal: { g: '♢', names: ['The Dealer', 'Open Hand'], req: () => cardsOn(), val: () => 0, text: () => 'Hands of cards come twice as often.' },
};
const boonOn = () => hasE('e41');
const boonHas = k => S.boon.active.some(b => b.k === k);
function dealBoons() {
  const n = (hasE('e42') ? 4 : 3) + (hasE('e50') ? 1 : 0), s = 0.6 + Math.max(0, S.stats.bestQ.log10()) / 120, x = (hasE('e50') ? 1.5 : 1) * (hasE('e56') ? 2 : 1); // Wide Sky, Birdsong
  const pool = Object.keys(BOON_KINDS).filter(k => !BOON_KINDS[k].req || BOON_KINDS[k].req()), hand = [];
  while (hand.length < n && pool.length) { const k = pool.splice(Math.floor(Math.random() * pool.length), 1)[0], d = BOON_KINDS[k]; hand.push({ k, v: d.val(s) * x, name: rnd(d.names), id: ++S.cards.seq }); }
  S.boon.hand = hand; S.boon.left = hasE('e42') ? 2 : 1;
  aiSay(rnd(['The stars have turned. Choose a Boon in the Fortune tab.', 'A new sky, a new Boon. It waits in the Fortune tab.', 'I read the stars for you. Pick a Boon in the Fortune tab.']));
}
function pickBoon(i) {
  const B = S.boon, b = B.hand && B.hand[i]; if (!b) return false;
  B.active.push({ k: b.k, v: b.v, name: b.name });
  B.hand = B.hand.filter((_, j) => j !== i);
  if (--B.left <= 0 || !B.hand.length) { B.hand = null; B.left = 0; }
  return true;
}
function dealCards() {
  const hand = [], used = new Set(), s = cardScale();
  for (let n = 0; n < handSize(); n++) {
    let tot = 0; const pool = [];
    for (const k in CARD_KINDS) { const d = CARD_KINDS[k]; if (used.has(k) || (d.req && !d.req())) continue; pool.push(k); tot += d.w; }
    let r = Math.random() * tot, k = pool[0];
    for (const x of pool) { r -= CARD_KINDS[x].w; if (r <= 0) { k = x; break; } }
    used.add(k);
    let rr = Math.random() * 100, ri = 0; for (; ri < RARITY.length - 1; ri++) { rr -= RARITY[ri].w; if (rr <= 0) break; }
    const d = CARD_KINDS[k], p = RARITY[ri].p * (0.85 + 0.3 * Math.random()) * (hasR('markeddeck') ? 1.25 : 1); // each card rolls a little up or down
    hand.push({ k, r: ri, v: d.val(p, s), dur: d.dur === undefined ? 0 : d.dur, name: rnd(d.names), id: ++S.cards.seq });
  }
  S.cards.hand = hand;
  aiSay(rnd(['I drew ' + NUMW[hand.length] + ' cards for you. Keep ' + (hasE('e47') ? 'two' : 'one') + '.', 'Your hand is dealt. Choose.', 'Fortune is a kind of Quanta too. Pick a card.', 'Cards on the table. Keep what you like.']));
}
function keepCard(i) {
  const hand = S.cards.hand; if (!hand || !hand[i]) return false;
  const c = hand[i], d = CARD_KINDS[c.k], t = S.stats.time;
  // Second Hand: the first card you keep leaves the rest of the hand on the table for one more
  if (hasE('e47') && !S.cards.kept && hand.length > 1) { S.cards.kept = 1; S.cards.hand = hand.filter((_, j) => j !== i); }
  else { S.cards.hand = null; S.cards.kept = 0; S.cards.next = t + dealEvery(); }
  S.cards.drawn++; S.cards.by[c.r]++;
  if (c.k === 'time') { const p = qpsLog(); if (p > -Infinity) { S.q = S.q.add(D.fromLog(p + L10(c.v))); capQ(); } }
  else if (c.k === 'abil') { S.abil.surge.ready = 0; S.abil.fold.ready = 0; S.abil.nova.ready = 0; }
  else if (c.k === 'gamble') {
    if (Math.random() < (hasR('consolation') ? 2 / 3 : 0.5)) { S.cards.active.push({ k: 'qmult', v: c.v, dur: 600, until: t + 600, name: c.name + ' (heads)', r: c.r }); aiSay('Heads. Enjoy it.'); S.secret.heads++; S.secret.tails = 0; if (S.secret.heads >= 5) grantSecret('x16'); }
    else { aiSay(rnd(['Tails. The deck owes you one.', 'Tails. Nothing this time.'])); S.secret.tails++; S.secret.heads = 0; if (S.secret.tails >= 5) grantSecret('x15'); }
  }
  else S.cards.active.push({ k: c.k, v: c.v, dur: c.dur, until: c.dur < 0 ? -1 : t + c.dur, name: c.name, r: c.r });
  if (c.r === 3) grant('a43');
  return true;
}
function cardsTick() {
  const C = S.cards, t = S.stats.time;
  if (C.active.length && C.active.some(c => c.until >= 0 && c.until <= t)) C.active = C.active.filter(c => c.until < 0 || c.until > t);
  if (!C.hand && cardsOn() && t >= C.next) dealCards();
}
function simulate(total, maxTicks = 2000) {
  const n = Math.min(maxTicks, Math.max(1, Math.ceil(total / 0.05))), step = total / n;
  SIMULATING = true;
  try { for (let i = 0; i < n; i++) tick(step); } finally { SIMULATING = false; }
}
