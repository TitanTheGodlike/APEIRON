'use strict';
// Apeiron · actions.js: buying, Collapse, Ascension, abilities, challenges.
// The game is a set of classic scripts loaded in order by index.html; they share one global scope.

/* =====================================================================
   ACTIONS
   ===================================================================== */
function capQ() { if (!hasE('e6') && S.q.log10() > CFG.limit) S.q = D.fromLog(CFG.limit); }

function buyGen(i, mode) {
  if (!genUnlocked(i)) return 0;
  const g = S.gens[i], lm = lq();
  let n;
  if (mode === 'max') n = genMax(i);
  else if (mode === '10') n = lm >= genCostLog(i, 10) ? 10 : 0; // exactly 10, all or nothing
  else n = lm >= genCostLog(i) ? 1 : 0;
  if (n <= 0) return 0;
  S.q = S.q.sub(D.fromLog(genCostLog(i, n))).max0();
  g.bought += n; g.amt = g.amt.add(n);
  if (i > S.stats.topTier) S.stats.topTier = i;
  if (i === S.gens.length - 1) S.gens.push(newGen()); // the next tier reveals itself
  aiOnBuy(i, n);
  return n;
}
function buyClock(mode) {
  if (tierBought(0) === 0) return 0; // Clock Speed speeds up generators: none yet, so it would only waste the first Quanta
  const n = mode === 'max' ? clockMax() : (lq() >= clockCostLog() ? 1 : 0);
  if (n <= 0) return 0;
  S.q = S.q.sub(D.fromLog(clockCostLog(n))).max0();
  S.clock += n; S.run.clockBought = true;
  return n;
}
function maxAll() {
  let n = tierBought(0) === 0 ? buyGen(0, 'max') : 0; // never spend the first Quanta on Clock Speed
  n += buyClock('max');
  for (let i = S.gens.length - 1; i >= 0; i--) n += buyGen(i, 'max');
  return n;
}
const pulseCd = () => (S.relics.metronome ? 1000 : 1500) / (hasS('s22') ? 2 : 1) / (cardHas('pulse') ? 2 : 1) * cdMult('pulsecd'); // ms between Pulses
let lastPulse = -1e9;
const pulseReady = () => performance.now() - lastPulse >= pulseCd();
// A Pulse is worth a few seconds of production (Kindling 1, Metronome Heart 2 more). Its boosts soften once a
// Pulse is worth more than about two recharges of production, so clicking helps without dwarfing idle play.
const soften = (x, cap, k = 0.15) => x > cap ? cap + (x - cap) * k : x;
function pulseGain() {
  const multL = procSum('pulse') + cardSum('pulse') + (hasR('abridged') ? 2 : 0);
  let g = D.fromLog(soften(multL, 1)); // the bare Pulse: 1 Quanta, boosted (up to about 10 before softening)
  const secs = (hasQ('q1') ? 1 : 0) + (S.relics.metronome ? 2 : 0), p = secs > 0 ? qpsLog() : -Infinity;
  if (p > -Infinity) g = g.add(D.fromLog(p + soften(L10(secs) + multL, L10(Math.max(1, 2 * pulseCd() / 1000)))));
  return g;
}
function pulse() {
  if (!pulseReady()) return false;
  lastPulse = performance.now();
  const pb = UI.el && UI.el.pulse;
  if (pb) { pb.classList.remove('cooling', 'ready-flash'); void pb.offsetWidth; pb.style.setProperty('--cdms', pulseCd() + 'ms'); pb.classList.add('cooling'); }
  let g = pulseGain();
  if (Math.random() < luckyChance()) { g = g.mul(D.fromNum(LUCKY_X)); luckyPop(); }
  S.q = S.q.add(g); S.stats.pulses++; capQ();
  S.ai.pulses.push(S.stats.time); if (S.ai.pulses.length > 400) S.ai.pulses.splice(0, 200);
  S.run.pulsed = true;
  { const a = RECENT.drum = (RECENT.drum || []).concat(performance.now()).slice(-7); if (a.length === 7 && a.every((t, i) => !i || Math.abs(t - a[i - 1] - 2000) <= 150)) grantSecret('x2'); }
  { const d = new Date(); if (d.getHours() === 3 && d.getMinutes() === 33) grantSecret('x5'); }
  return true;
}
function buyQ(id) {
  const u = QBY[id];
  if (S.qUpg[id] || lq() < u.cost) return false;
  S.q = S.q.sub(D.fromLog(u.cost)).max0(); S.qUpg[id] = true; webChanged('q'); return true;
}
function buyS(id) {
  const u = SBY[id];
  if (S.sUpg[id] || sForkTaken(id) || S.shards.lt(u.cost)) return false;
  S.shards = S.shards.sub(u.cost).max0(); S.sUpg[id] = true; webChanged('s'); return true;
}
// Reshape: refund every Shard spent on the tree and restart the current run
function reshapeTree() {
  let refund = D.Z;
  for (const u of SUPG) if (S.sUpg[u.id]) refund = refund.add(u.cost);
  const st = webStatic('s');
  for (const id in S.minor.s) if (st.nodes[id]) refund = refund.add(D.fromLog(st.nodes[id].costLog));
  if (refund.m === 0) return false;
  for (const id in S.minor.s) if (st.nodes[id]) delete S.minor.s[id];
  S.sUpg = {}; MINOR_VER++; webChanged(); S.shards = S.shards.add(refund);
  { const R = S.secret.reshapes; R.push(S.stats.time); while (R.length > 3) R.shift(); if (R.length === 3 && R[2] - R[0] <= 600) grantSecret('x18'); }
  resetQLayer();
  flash('rgba(196,155,255,.5)');
  return true;
}
function useAbility(k) {
  const a = ABIL[k];
  if (!abilOn(k) || !abilReady(k)) return false;
  const now = S.stats.time;
  S.abil[k].ready = now + a.cd() * (boonHas('abilcd') ? 0.5 : 1) * (hasE('e52') ? 0.5 : 1);
  if (k === 'surge') S.abil.surge.until = now + a.dur();
  if (k === 'nova') S.abil.nova.until = now + a.dur();
  if (k === 'fold') { const p = qpsLog(); if (p > -Infinity) { S.q = S.q.add(D.fromLog(p + L10(600))); capQ(); } }
  S.run.abil++;
  return true;
}
function buyE(id) {
  const u = EBY[id];
  if (S.eUpg[id] || S.essence.lt(u.cost)) return false;
  S.essence = S.essence.sub(u.cost).max0(); S.eUpg[id] = true; webChanged('e');
  if (id === 'e6') { toast('Apeiron: the Limit is broken. Quanta can grow forever.', 'es'); aiEvent('unbound'); }
  if (id === 'e41') dealBoons(); // the first hand of Boons comes right away
  if (id === 'e52') aiSay('Do you feel that? Wind. I did not know I could make wind. Lean into it.');
  return true;
}
const repCostLog = (def, L, n = 1) => quadSumLog(L10(def.c0), L10(def.r), def.q, L, n);
const srepOn = () => !!S.sUpg.sF; // Forgeworks unlocks the Shard repeatables
function buyRep(def, store, cur, mode) {
  if (store === 'sRep' && !srepOn()) return 0;
  const L = S[store][def.id], lm = S[cur].log10();
  const n = mode === 'max' ? quadMax(lm, L10(def.c0), L10(def.r), def.q, L) : (lm >= repCostLog(def, L) ? 1 : 0);
  if (n <= 0) return 0;
  S[cur] = S[cur].sub(D.fromLog(repCostLog(def, L, n))).max0();
  S[store][def.id] += n; return n;
}

function resetQLayer() {
  S.q = D.fromLog(headStartLog());
  // Afterglow: one of each of the first ten generators is already there (not inside Challenges)
  S.gens = hasE('e49') && S.chal.active < 0 ? Array.from({ length: 10 }, () => ({ amt: D.fromNum(1), bought: 0 })) : [newGen()];
  S.clock = 0;
  if (!hasS('s2')) { S.qUpg = {}; S.proc.q = 0; for (const u of S.forge.q) u.own = false; S.minor.q = {}; MINOR_VER++; }
  S.stats.tCollapse = 0; webChanged(); // ownership changed: cached sums and frontiers count again
  S.run = { clockBought: false, abil: 0, best: S.q.log10(), pulsed: false };
}
function doCollapse(quiet = false) {
  if (!canCollapse()) return false;
  const gain = shardGain(), t = S.stats.tCollapse;
  S.shards = S.shards.add(gain); S.totalShards = S.totalShards.add(gain);
  S.collapses++; S.stats.totalCollapses++;
  if (S.stats.fastCollapse === null || t < S.stats.fastCollapse) S.stats.fastCollapse = t;
  if (t <= 30) grant('a25');
  if (!S.run.clockBought) grant('a26');
  if (!quiet && tierBought(3) === 0 && runBestLog() >= 30) grantSecret('x4');
  if (S.stats.totalCollapses === 1 && runBestLog() >= 40) grantSecret('x6');
  if (!quiet) { const a = RECENT.coll = (RECENT.coll || []).concat(performance.now()).slice(-10); if (a.length === 10 && a.every((t, i) => !i || t - a[i - 1] <= 30000)) grantSecret('x20'); }
  S.cards.active = S.cards.active.filter(c => c.k !== 'shard' && c.k !== 'top'); // used up by this Collapse
  resetQLayer();
  aiEvent('collapse', gain);
  if (!quiet) { flash('rgba(196,155,255,.5)'); sfx('collapse'); }
  return true;
}
function doAscend(quiet = false) {
  if (!canAscend()) return false;
  const gain = essenceGain(), t = S.stats.tAscend;
  S.essence = S.essence.add(gain); S.totalEssence = S.totalEssence.add(gain); S.ascensions++;
  if (S.stats.fastAscend === null || t < S.stats.fastAscend) S.stats.fastAscend = t;
  S.chal.active = -1;
  S.shards = D.Z; S.totalShards = D.Z; S.collapses = 0;
  // Ascension wipes the Shard layer too, at first. Memory-branch Essence upgrades keep more of it:
  // Remembrance the repeatable levels, Muscle Memory the automation, Perfect Recall the whole Shard web
  if (!hasE('e1')) S.sRep = { forge: 0, tune: 0, prism: 0 };
  if (!hasE('e5')) {
    const kept = {}; if (hasE('e35')) for (const id in S.sUpg) if (ASC_KEEP_AUTO.includes(id) || /^ab\d+$/.test(id)) kept[id] = true;
    S.sUpg = kept; S.minor.s = {};
  }
  // Deep Memory (e15) keeps the Upgrade web through Ascension, like Memory does through Collapse
  const keepQ = hasE('e15'), qKeep = keepQ ? { u: S.qUpg, m: S.minor.q, own: S.forge.q.map(u => u.own), n: S.proc.q } : null;
  if (!hasE('e5')) { S.proc.s = 0; for (const u of S.forge.s) u.own = false; }
  resetQLayer();
  if (keepQ) { S.qUpg = qKeep.u; S.minor.q = qKeep.m; S.forge.q.forEach((u, i) => { u.own = qKeep.own[i]; }); S.proc.q = qKeep.n; }
  else { S.qUpg = {}; S.proc.q = 0; for (const u of S.forge.q) u.own = false; S.minor.q = {}; }
  MINOR_VER++; webChanged();
  S.stats.tAscend = 0; S.stats.tInspire = 0; S.secret.ideasAsc = 0; // Inspiration starts over
  // Relics and Anomalies are bought again after every Ascension (the secrets keep them unlocked), unless Reliquary
  if (!hasE('e48')) { S.relics = {}; for (const k in S.anom) S.anom[k] = 0; }
  S.boon.active = []; S.boon.hand = null; S.boon.left = 0; if (boonOn()) dealBoons();
  S.cards.active = S.cards.active.filter(c => c.until >= 0); // Ascension uses up every until-the-next card
  aiEvent('ascend', gain);
  if (!quiet) { skyDawn(); sfx('ascend'); if (S.ascensions === 1) toast('You Ascended. Spend Essence in the Ascension tab.', 'es'); }
  return true;
}
function startChal(i) {
  if (S.chal.active === i) return;
  if (!doCollapse(true)) resetQLayer();
  S.chal.active = i;
  if (hasE('e49')) S.gens = [newGen()]; // no Afterglow inside a Challenge
  flash('rgba(255,123,139,.4)'); sfx('chal');
}
function leaveChal() {
  if (S.chal.active < 0) return;
  S.chal.active = -1;
  if (!doCollapse(true)) resetQLayer();
}
function completeChal() {
  const i = S.chal.active;
  S.chal.comps[i]++;
  S.chal.active = -1;
  if (!doCollapse(true)) resetQLayer();
  toast(`Challenge complete: ${CHALS[i].name} (${S.chal.comps[i]})`, 'bad');
  aiEvent('chal');
  flash('rgba(94,240,168,.4)');
}

/* ---------------- Automation ---------------- */
function runAuto() {
  if (hasE('e44') && S.auto.reflex !== false) for (const k in ABIL) if (abilOn(k) && abilReady(k)) useAbility(k); // Reflex
  if (S.sUpg.abC && S.auto.clock) buyClock('max');
  for (let i = S.gens.length - 1; i >= 0; i--) {
    if (S.sUpg['ab' + i] && S.auto.gens[i] !== false) buyGen(i, 'max');
  }
  // the Upgrade-web keepers buy one node at a time, then rest for a while
  ['abL', 'abH', 'abK'].forEach((id, b) => { if (S.sUpg[id] && S.auto.qb[b] && S.stats.time >= S.auto.qbNext[b] && webAutoBuy('q', 1, b)) S.auto.qbNext[b] = S.stats.time + CFG.keeperCd; });
  // the Shard-web stewards (Essence web) do the same in the Shard web, but never make a path choice for you
  ['e37', 'e38', 'e39'].forEach((id, b) => { if (S.eUpg[id] && S.auto.sb[b] && S.stats.time >= S.auto.sbNext[b] && webAutoBuy('s', 1, b, true)) S.auto.sbNext[b] = S.stats.time + CFG.keeperCd; });
  if (S.sUpg.s9 && S.auto.collapse.on && S.chal.active < 0 && canCollapse()) {
    const a = S.auto.collapse, v = D.fromStr(a.val || '0');
    let go = false;
    if (a.mode === 'gain') go = shardGain().gte(v);
    else if (a.mode === 'time') go = S.stats.tCollapse >= v.toNumber();
    else go = shardGain().gte(S.shards.mul(v));
    if (go) doCollapse(true);
  }
  if (S.eUpg.e8 && S.auto.ascend.on && canAscend()) {
    if (!hasE('e6') || essenceGain().gte(D.fromStr(S.auto.ascend.val || '1'))) doAscend(true);
  }
}

/* ---------------- Achievements ---------------- */
function grant(id) {
  if (S.ach[id]) return;
  S.ach[id] = true;
  sfx('ach');
  toast('Achievement: ' + ACHBY[id][1] + ' — ' + ACHBY[id][2]);
}
function checkAch() { for (const a of ACH) if (!S.ach[a[0]] && a[3] && a[3]()) grant(a[0]); checkSecrets(); }
