'use strict';
// Apeiron · state.js: the save state and every rule of production.
// The game is a set of classic scripts loaded in order by index.html; they share one global scope.

/* =====================================================================
   STATE
   ===================================================================== */
function newState() {
  return {
    v: 1, ver: SAVE_VER,
    q: D.Z, // a new world starts empty: the first Quanta come from Pulse
    gens: [newGen()],
    clock: 0,
    qUpg: {}, sUpg: {}, eUpg: {},
    proc: { q: 0, s: 0, e: 0 },
    forge: { q: [], s: [], e: [] },
    tut: { step: 0, off: false, upgSeen: false, upgDone: false }, // upgSeen/upgDone: the Upgrades-tab guide
    ai: { log: [], total: 0, seen: 0, lastInput: 0, pulses: [], tierSeen: 0, said: {}, announced: { q: 0, s: 0, e: 0 } },
    story: { seen: {}, ans: {} }, // chapters of the story already told, and what you answered
    shards: D.Z, totalShards: D.Z, collapses: 0,
    sRep: { forge: 0, tune: 0, prism: 0 },
    essence: D.Z, totalEssence: D.Z, ascensions: 0,
    eRep: { amp: 0, expo: 0, magnet: 0 },
    chal: { active: -1, comps: CHALS.map(() => 0) },
    auto: {
      gens: GEN_FIRST.map(() => true), genHigh: true, clock: true, qupg: true, qb: [true, true, true], qbNext: [0, 0, 0], sb: [true, true, true], sbNext: [0, 0, 0],
      collapse: { on: false, mode: 'gain', val: '1' },
      ascend: { on: false, val: '1' },
    },
    reached: { collapse: false, limit: false },
    run: { clockBought: false, abil: 0, best: 1, pulsed: false },
    stats: { time: 0, tCollapse: 0, tAscend: 0, totalQ: D.Z, bestQ: D.fromNum(10), totalCollapses: 0, fastCollapse: null, fastAscend: null, pulses: 0, tUnbound: 0, tInspire: 0, topTier: -1 }, // topTier: the highest generator you ever bought
    ach: {},
    settings: { notation: 'sci', buyMode: 'max', autosave: true, offline: true, tab: 'gen', sound: true, volume: 0.6, sfx: true, sfxVol: 0.5,
      ui: { theme: 'nebula', stars: true, sky: true, motion: true, compact: false, tint: true, toasts: true, scale: 1 } },
    relics: {}, anom: { echo: 0, hourglass: 0, prism: 0 }, secret: { orb: 0, guide: 0, heads: 0, tails: 0, reshapes: [], heard: 0, skips: 0, themes: [], ideasAsc: 0 },
    abil: { surge: { ready: 0, until: 0 }, fold: { ready: 0 }, nova: { ready: 0, until: 0 } },
    minor: { q: {}, s: {}, e: {} },
    hist: { every: 30, next: 0, t: [], q: [], best: [], sh: [], es: [] },
    cards: { hand: null, active: [], next: 0, drawn: 0, by: [0, 0, 0, 0], seq: 0, kept: 0 },
    boon: { hand: null, active: [], left: 0 }, // Boons (Observatory): the choice waiting, and what works this Ascension
    introSeen: false,
    last: Date.now(),
  };
}
let S = null;

/* ---------------- Queries ---------------- */
const hasQ = id => !!S.qUpg[id];
const isolated = () => S.chal.active === 5;
const hasS = id => !!S.sUpg[id] && (!isolated() || !!SBY[id].auto);
const hasE = id => !!S.eUpg[id];
const inChal = i => S.chal.active === i;
const totalBought = () => S.gens.reduce((t, g) => t + g.bought, 0);
const totalComps = () => S.chal.comps.reduce((a, b) => a + b, 0);
const momentum = () => Math.min(30, 1 + S.stats.tCollapse / 20);
const latticeExp = () => hasS('s18') ? 0.7 : hasS('s13') ? 0.55 : 0.4;
// The story introduces Collapse (chapter The Weight) and Ascension (The Edge). Until a chapter has played, nothing on
// screen mentions what it introduces: no button, no Guide sentence, no statistic, no achievement text.
const collapseKnown = () => S.stats.totalCollapses > 0 || S.ascensions > 0 || !!S.story.seen.weight;
const ascendKnown = () => S.ascensions > 0 || !!S.story.seen.edge;
const shardsVisible = () => collapseKnown() && (S.reached.collapse || S.collapses > 0 || S.ascensions > 0);
const ascVisible = () => ascendKnown() && (S.reached.limit || S.ascensions > 0);
// texts written for later, reworded while their idea is still unknown
function veil(t) {
  if (!t) return t;
  if (!ascendKnown()) t = t.replace(/ earned this Ascension/g, ' earned so far').replace(/ this Ascension/g, ' so far').replace(/ that you buy again after every Ascension/g, '')
    .replace(/; you buy it again after every Ascension, until Reliquary/g, '').replace(/ or Essence to your next prestige/g, ' to your next Collapse').replace(/ or Ascension/g, '');
  if (!collapseKnown()) t = t.replace(/Every Collapse starts with/g, 'Every fresh start begins with').replace(/ in this Collapse/g, ' in this run').replace(/ for your first several Collapses,/g, ' for a long while,')
    .replace(/ Every Collapse makes it lighter, until after a few it is gone\./g, ' It will not stay this heavy forever.').replace(/ and Cascade \(higher tiers and Shards\)/g, ' and Cascade (higher tiers)')
    .replace(/that ignores Collapse/g, 'that never resets');
  if (IS_PHONE) t = t.replace(/ \(or the <kbd>[A-Z]<\/kbd> key\)/g, '').replace(/ \(key [A-Z]\)/g, '') // no keyboard on a phone
    .replace(/double-click/g, 'double-tap').replace(/Double-click/g, 'Double-tap').replace(/\bclick(s|ed|ing)?\b/g, 'tap$1').replace(/\bClick(s)?\b/g, 'Tap$1').replace(/scroll to zoom/g, 'pinch to zoom');
  return t;
}
// Guide sections: reworded, then any sentence still about something unknown is left out
function veilText(t) {
  t = veil(t);
  const ban = (collapseKnown() ? [] : ['Collaps', 'Shard']).concat(ascendKnown() ? [] : ['Ascen', 'Essence', 'Apeiron', 'Challenge', 'Reliquary']);
  return ban.length ? t.split(/(?<=[.!?])\s+(?=[A-Z<])/).filter(s => !ban.some(b => s.includes(b))).join(' ') : t;
}
const AUTOBUYERS = ['ab0', 'ab1', 'ab2', 'ab3', 'ab4', 'ab5', 'ab6', 'ab7', 'ab8', 'abC', 'abL', 'abH', 'abK'];
const autoVisible = () => AUTOBUYERS.some(id => S.sUpg[id]) || !!S.sUpg.s9 || !!S.eUpg.e8 || !!S.eUpg.e37;
const ASC_KEEP_AUTO = ['sB', 's2', 's9', 's11'].concat(AUTOBUYERS); // what Muscle Memory (e35) keeps through Ascension
const tierBought = i => S.gens[i] ? S.gens[i].bought : 0;
const genUnlocked = i => !(inChal(1) && i > 3) && (i === 0 || tierBought(i - 1) > 0 || tierBought(i) > 0);

function resonance() {
  if (inChal(2)) return 1;
  let r = CFG.resBase;
  r += fSum('res');
  if (hasS('s7')) r += 0.15;
  if (hasS('s17')) r += 0.3;
  if (hasE('e11')) r += 0.3;
  if (hasR('lucky7')) r += 0.07;
  r += minorSum('res');
  return r + 0.05 * S.chal.comps[2] + procSum('res') + cardSum('res');
}
function clockBase() {
  let b = CFG.clockBase;
  b += fSum('clock');
  if (!isolated() && srepOn()) b += 0.005 * S.sRep.tune;
  if (hasE('e10')) b += 0.02;
  if (hasR('moonlit')) b += 0.02;
  if (hasR('patina')) b += 0.01;
  if (hasS('s27')) b += 0.03;
  b += minorSum('clock');
  b += 0.002 * anomN('hourglass');
  return b + 0.005 * S.chal.comps[0] + procSum('clock');
}
const clockMultLog = () => inChal(0) ? 0 : S.clock * L10(clockBase());
const clockStep = () => (hasS('s8') ? L10(6) : 1) * thriftMult(-1);
const clockCostLog = (n = 1) => quadSumLog(CFG.clock0, clockStep(), CFG.clockScale, S.clock, n);
const clockMax = () => quadMax(lq(), CFG.clock0, clockStep(), CFG.clockScale, S.clock);
function genStep(i) {
  let s = genDef(i).step;
  if (inChal(3)) s *= 2;
  return s * Math.max(0.6, Math.pow(0.97, S.chal.comps[3])) * thriftMult(i);
}
const genCostLog = (i, n = 1) => quadSumLog(genDef(i).base, genStep(i), CFG.genScale, tierBought(i), n);
const genMax = i => quadMax(lq(), genDef(i).base, genStep(i), CFG.genScale, tierBought(i));

function achMultLog() { return Object.keys(S.ach).length * L10(1.1); }
// Multipliers come in two kinds: `all` speeds up every generator (Clock Speed),
// `q` multiplies Quanta production only (everything from upgrades and prestige).
function globalMultLog() {
  const ai = aiMods();
  let all = clockMultLog() + ai.all;
  if (inChal(4)) all -= L10(1 + S.stats.tCollapse / 10);
  all += cardSum('speed');
  let L = achMultLog() + procSum('qmult') + ai.q + inspirationLog() + anomN('echo') * L10(2);
  if (hasR('selftaught')) L += L10(3);
  L += minorSum('qmult') + cardSum('qmult') + (isIdle() ? cardSum('idle') : 0);
  if (hasR('lucky7')) L += L10(77);
  if (hasR('spectrum')) L += L10(20);
  if (hasR('cheatcode')) L += L10(30);
  if (hasR('dreamer') && isIdle()) L += 3;
  L += fSum('qm');
  if (hasQ('q20')) L += L10(S.gens.length);
  if (hasS('s15')) L += 3;
  if (hasS('s20')) L += 2 * L10(S.gens.length);
  if (hasS('s24')) L += Object.keys(S.sUpg).length * L10(1.3);
  if (hasS('s28')) L += 4;
  if (hasE('e16')) L += 6;
  if (surgeActive()) L += 3;
  if (hasR('secondwind')) L += 3;
  if (hasR('annotated')) L += L10(1 + Object.keys(S.ach).length);
  if (hasQ('q5')) L += L10(1 + totalBought() / 100);
  if (hasQ('q7')) L += L10(momentum());
  if (hasS('s3')) L += latticeExp() * S.totalShards.add(1).log10();
  if (!isolated() && srepOn()) L += S.sRep.forge * L10(2);
  if (hasE('e2')) L += 3 + 1.5 * S.totalEssence.add(1).log10();
  L += S.eRep.amp;
  L += 3 * L10(1 + S.chal.comps[4]);
  return { all, q: L };
}
function tierMultLog(i, gl) {
  let L = gl.all + Math.floor(S.gens[i].bought / resStep(i)) * L10(resonance()) + procSyn(i);
  if (i === 0) {
    L += gl.q;
    if (hasQ('q2')) L += L10(1 + Math.max(0, lq()));
    if (hasQ('q8')) L += S.clock * L10(1.07);
    if (hasQ('q13')) L += 2 * L10(Math.max(1, lq()));
    L += procSum('flick') * L10(Math.max(1, lq()));
    L += S.clock * fSum('pc');
  } else {
    L += fSum('hi');
  }
  if (i < 4 && hasS('s19')) L += 1;
  L += procTier(i);
  if (i === highestTier()) L += cardSum('top');
  if (i < 3 && hasR('bareframe')) L += 1;
  if (i < 4) L += S.chal.comps[1] * L10(3);
  return L;
}
// Past the Limit every order of magnitude of production is harder to reach: ^0.85 on the part above 1e308.
const DAMP = 0.85;
const dampen = L => L > CFG.limit ? CFG.limit + Math.pow(L - CFG.limit, CFG.damp) : L;
function qExponent() {
  let x = 1;
  if (hasS('s12')) x += 0.01;
  if (hasS('s14')) x += 0.015;
  if (hasS('s16')) x += 0.025;
  if (hasE('e9')) x += 0.02;
  if (hasE('e17')) x += 0.01;
  if (hasE('e52')) x += 0.03; // Wind in Your Hair
  if (hasE('e53')) x += 0.05; // Bright Blue Sky
  if (hasE('e57')) x += 0.04; // Morning Glow
  x += 0.005 * S.eRep.expo + 0.01 * S.chal.comps[6] + procSum('qexp');
  if (inChal(6)) x *= 0.8;
  return x;
}
function qpsLog(gl = globalMultLog()) {
  const a = S.gens[0].amt; if (a.m <= 0) return -Infinity;
  const raw = a.log10() + tierMultLog(0, gl);
  const L = raw > 0 ? raw * qExponent() * (novaActive() ? (hasE('e51') ? 1.06 : 1.04) : 1) : raw; // Nova: production to a power
  return dampen(L);
}
// slows the first run to about half an hour; each lifetime Collapse halves it, so it fades out over the next few
const heavyLog = () => S.stats.totalCollapses >= 20 ? 0 : CFG.heavy * Math.pow(0.5, S.stats.totalCollapses);
const cascadeLog = () => CFG.cascadeLog - heavyLog();
function genRateLog(i, gl = globalMultLog()) { // per second, of tier i-1 (or Quanta for i=0)
  if (i === 0) return qpsLog(gl);
  const a = S.gens[i].amt; if (a.m <= 0) return -Infinity;
  return a.log10() + tierMultLog(i, gl) + cascadeLog();
}

function shardMultLog() {
  let L = 0;
  L += fSum('shard');
  if (hasQ('q15')) L += 2.5 * L10(Math.max(1, runBestLog() / 100));
  if (hasS('s10')) L += 2 * L10(L10(S.collapses + 10));
  if (!isolated() && srepOn()) L += S.sRep.prism * L10(1.25);
  if (hasE('e4')) L += L10(1 + S.ascensions);
  L += S.eRep.magnet * L10(3) + S.chal.comps[5] * L10(2) + procSum('shard') + aiMods().shard + anomN('prism') * L10(1.25) + (hasR('heavy') ? L10(4) : 0);
  if (hasS('s23')) L += L10(5);
  L += minorSum('shard');
  if (hasS('s29')) L += L10(3);
  if (hasE('e13')) L += 1;
  if (hasE('e18')) L += L10(5);
  if (hasS('s31')) L += L10(1 + S.run.abil);
  return L + cardSum('shard') + (hasR('draftsman') ? L10(3) : 0);
}
const collapseReqLog = () => hasS('s23') ? 30 : CFG.collapseReq;
const runBestLog = () => Math.max(lq(), S.run.best === undefined ? -Infinity : S.run.best);
const canCollapse = () => runBestLog() >= collapseReqLog();
function shardGain() {
  if (!canCollapse()) return D.Z;
  return D.fromLog(softcap((runBestLog() - CFG.collapseReq) / CFG.shardDiv, 40) + shardMultLog()).floor();
}
// Quanta needed for the next whole shard
// Past start, growth slows to a power of 0.85: a safety net so prestige loops can never run away.
function softcap(x, start) { return x <= start ? x : start + Math.pow(x - start, 0.85); }
function unsoftcap(y, start) { return y <= start ? y : start + Math.pow(y - start, 1 / 0.85); }
function nextShardAtLog() {
  const cur = shardGain(), target = cur.add(1).log10() - shardMultLog();
  return Math.max(collapseReqLog(), CFG.collapseReq + unsoftcap(target, 40) * CFG.shardDiv);
}
function essMultLog() { return (hasE('e12') ? 2 * L10(L10(S.ascensions + 10)) : 0) + (hasE('e14') ? L10(1.5) : 0) + procSum('ess') + minorSum('ess') + fSum('ess') + cardSum('ess') + (hasR('attentive') ? L10(2) : 0) + (hasE('e53') ? 3 : 0) + (hasE('e54') ? 1 : 0) + (hasE('e56') ? 2 : 0); } // Bright Blue Sky, Pale Horizon, Birdsong
const canAscend = () => lq() >= CFG.limit - 1e-9;
function essenceGain() {
  if (!canAscend()) return D.Z;
  let L = essMultLog();
  if (hasE('e6')) L += softcap((lq() - CFG.limit) / CFG.ascDiv, 30);
  return D.fromLog(L).floor().max(D.fromNum(1));
}
const chalGoalLog = i => { const c = S.chal.comps[i], ch = CHALS[i]; return ch.g0 + ch.gs * c + 1.5 * c * c; };
