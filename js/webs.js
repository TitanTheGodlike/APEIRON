'use strict';
// Apeiron · webs.js: the skill webs: layout, growth, drawing; Upgrades and Shards tabs.
// The game is a set of classic scripts loaded in order by index.html; they share one global scope.

/* =====================================================================
   SKILL WEBS: sprawling passive trees for Quanta upgrades and Shards.
   Notables (the real upgrades) are joined by chains of small minor nodes and
   cross-linked into a web. You can buy any node next to one you own. The
   Architect's ideas sprout as new diamond nodes and the web re-settles around them.
   ===================================================================== */
const SVGNS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}) => { const el = document.createElementNS(SVGNS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); return el; };
const hashStr = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; };
const WEB_DEF = {
  q: { root: 'q1', cur: 'q', curName: 'Quanta', costLog: id => QBY[id].cost, owned: id => !!S.qUpg[id],
    ring: { kind: 'qmult', v: L10(1.1), text: 'Quanta production ×1.1' },
    branches: [
      { name: 'Light', sub: 'production', angle: -150, start: 'q2', links: [['q2', 'q32'], ['q2', 'q5'], ['q32', 'q17'], ['q32', 'q33'], ['q5', 'q34'], ['q5', 'q7'], ['q17', 'q18'], ['q33', 'q37'], ['q7', 'q39'], ['q34', 'q35'], ['q18', 'q13'], ['q18', 'q19'], ['q37', 'q38'], ['q39', 'q40'], ['q35', 'q36'], ['q13', 'q45'], ['q19', 'q16'], ['q38', 'q42'], ['q40', 'q41'], ['q36', 'q20'], ['q45', 'q46'], ['q16', 'q21'], ['q42', 'q43'], ['q20', 'q48'], ['q41', 'q44'], ['q21', 'q47'], ['q46', 'q49'], ['q47', 'q50']], minor: { kind: 'qmult', v: L10(1.035), text: 'Quanta production ×1.035' } },
      { name: 'Harmony', sub: 'resonance and clock', angle: -30, start: 'q3', links: [['q3', 'q51'], ['q3', 'q52'], ['q51', 'q22'], ['q51', 'q53'], ['q52', 'q9'], ['q22', 'q4'], ['q53', 'q55'], ['q9', 'q23'], ['q9', 'q54'], ['q4', 'q8'], ['q4', 'q11'], ['q23', 'q56'], ['q55', 'q57'], ['q54', 'q58'], ['q11', 'q59'], ['q56', 'q24'], ['q57', 'q64'], ['q58', 'q61'], ['q59', 'q25'], ['q24', 'q60'], ['q61', 'q62'], ['q60', 'q26'], ['q25', 'q63'], ['q62', 'q65'], ['q26', 'q66']], minor: { kind: 'res', v: 0.002, text: 'Resonance +0.002' } },
      { name: 'Cascade', sub: 'tiers and Shards', angle: 90, start: 'q6', links: [['q6', 'q67'], ['q6', 'q68'], ['q67', 'q10'], ['q67', 'q69'], ['q68', 'q27'], ['q10', 'q28'], ['q10', 'q12'], ['q69', 'q70'], ['q28', 'q71'], ['q12', 'q72'], ['q70', 'q29'], ['q28', 'q30'], ['q12', 'q14'], ['q70', 'q73'], ['q71', 'q75'], ['q14', 'q15'], ['q27', 'q74'], ['q30', 'q76'], ['q15', 'q77'], ['q29', 'q31'], ['q77', 'q79'], ['q74', 'q78'], ['q78', 'q80']], minor: { kind: 'shard', v: L10(1.008), text: 'Shard gain ×1.008' } },
    ] },
  s: { root: 's1', cur: 'shards', curName: 'Shards', costLog: id => L10(SBY[id].cost), owned: id => !!S.sUpg[id],
    ring: { kind: 'qmult', v: L10(1.15), text: 'Quanta production ×1.15' },
    branches: [
      { name: 'Radiance', sub: 'raw power', angle: -150, start: 'sF', links: [['sF', 's3'], ['s3', 's32'], ['s32', 's7'], ['s3', 's12'], ['s3', 's13'], ['s7', ['s19', 's20']], [['s19', 's20'], 's33'], ['s33', 's17'], ['s17', 's38'], ['s12', 's34'], ['s34', 's14'], ['s14', 's35'], ['s35', 's16'], ['s16', 's28'], ['s28', 's37'], ['s13', 's36'], ['s36', 's18'], ['s18', 's39']], minor: { kind: 'qmult', v: L10(1.12), text: 'Quanta production ×1.12' } },
      { name: 'Clockwork', sub: 'speed and automation', angle: -30, start: 'sB', links: [['sB', 'ab0'], ['sB', 's8'], ['ab0', 'ab1'], ['ab1', 'abC'], ['ab1', 'ab2'], ['ab2', 'ab3'], ['ab3', 's11'], ['ab3', 'ab4'], ['ab4', 'abL'], ['abL', 'abH'], ['abH', 'abK'], ['ab4', 'ab5'], ['ab5', 'ab6'], ['ab6', 'ab7'], ['ab7', 'ab8'], ['ab7', 's9'], ['s9', 's45'], ['abK', 's46'], ['s11', 's44'], ['s8', 's40'], ['s40', ['s21', 's22']], [['s21', 's22'], 's41'], ['s41', 's27'], ['s41', 's42'], ['s27', 's15'], ['s15', 's43'], ['abK', 's2']], minor: { kind: 'clock', v: 0.0007, text: 'Clock Speed base +0.0007' } },
      { name: 'Echoes', sub: 'Shards and abilities', angle: 90, start: 's5', links: [['s5', 's47'], ['s47', 's25'], ['s5', ['s23', 's24']], ['s25', 's26'], ['s26', 's31'], ['s25', 's30'], ['s26', 's50'], ['s31', 's52'], ['s30', 's53'], ['s25', 's48'], [['s23', 's24'], 's10'], [['s23', 's24'], 's49'], ['s10', 's29'], ['s49', 's51'], ['s29', 's54']], minor: { kind: 'shard', v: L10(1.016), text: 'Shard gain ×1.016' } },
    ] },
  e: { root: 'e6', cur: 'essence', curName: 'Essence', costLog: id => L10(EBY[id].cost), owned: id => !!S.eUpg[id], loopNodes: 1,
    ring: { kind: 'qmult', v: L10(2), text: 'Quanta production ×2' },
    branches: [
      { name: 'Starlight', sub: 'raw power', angle: -150, span: 60, start: 'e2', links: [['e2', 'e19'], ['e19', 'e9'], ['e2', 'e10'], ['e9', 'e16'], ['e9', 'e20'], ['e10', 'e11'], ['e19', 'e22'], ['e11', 'e18'], ['e10', 'e23'], ['e16', 'e17'], ['e20', 'e21'], ['e17', 'e24']], minor: { kind: 'qmult', v: L10(1.96), text: 'Quanta production ×1.96' } },
      { name: 'Memory', sub: 'what you keep, and automation', angle: -30, span: 80, start: 'e1', links: [['e1', 'e25'], ['e1', 'e35'], ['e25', 'e5'], ['e25', 'e7'], ['e25', 'e8'], ['e25', 'e36'], ['e8', 'e37'], ['e37', 'e38'], ['e38', 'e39'], ['e7', 'e29'], ['e7', 'e15'], ['e8', 'e26'], ['e15', 'e27'], ['e27', 'e28'], ['e35', 'e40']], minor: { kind: 'shard', v: L10(1.092), text: 'Shard gain ×1.092' } },
      { name: 'Trials', sub: 'Shards, Essence and Challenges', angle: 50, span: 80, start: 'e3', links: [['e3', 'e4'], ['e3', 'e14'], ['e3', 'e30'], ['e4', 'e13'], ['e13', 'e12'], ['e13', 'e33'], ['e14', 'e31'], ['e12', 'e32'], ['e32', 'e34']], minor: { kind: 'ess', v: L10(1.026), text: 'Essence gain ×1.026' } },
      { name: 'Wonders', sub: 'new things to do', angle: 130, span: 80, start: 'e41', links: [['e41', 'e45'], ['e41', 'e43'], ['e41', 'e46'], ['e41', 'e42'], ['e45', 'e49'], ['e43', 'e44'], ['e43', 'e51'], ['e46', 'e47'], ['e49', 'e48'], ['e42', 'e50']], minor: { kind: 'ess', v: L10(1.02), text: 'Essence gain ×1.02' } },
      { name: 'Sky', sub: 'the long road to morning', angle: -90, span: 20, noLoops: true, start: 'e54', links: [['e54', 'e55'], ['e55', 'e52'], ['e52', 'e56'], ['e56', 'e57'], ['e57', 'e53']], minor: { kind: 'ess', v: L10(1.02), text: 'Essence gain ×1.02' } },
    ] },
};
// the branch an idea belongs on, by what it does (t = its generator tier; -1 is Clock Speed)
const ARCH_BRANCH = {
  q: (k, t) => ['res', 'clock', 'resonate', 'pulsecd', 'insight'].includes(k) || (k === 'thrift' && t === -1) ? 1 : ['tier', 'qexp', 'thrift', 'synergy'].includes(k) ? 2 : 0,
  s: (k, t) => ['qmult', 'tier', 'idle', 'pulse', 'resonate', 'synergy'].includes(k) ? 0 : ['clock', 'head', 'thrift', 'insight'].includes(k) ? 1 : 2,
  e: (k, t) => ['qmult', 'tier', 'idle', 'pulse', 'qexp', 'synergy'].includes(k) ? 0 : ['head', 'insight', 'thrift'].includes(k) ? 1 : 2,
};
/* Grown upgrades: hundreds of small notables of every kind, grown off the hand-made ones in short chains.
   Seeded, so every save sees the same webs. Most of them do something other than ×Quanta; the ones that
   work like the Architect's ideas (kind) are counted in procAgg, the simple ones use fields (FU). */
const GROW = {
  q: { n: 40, kinds: [
    { tier: 3, pulse: 1, idle: 1, lucky: 0.7, pulsecd: 0.7, flick: 0.6, qm: 0.8 },
    { res: 1.5, resonate: 1, thrift: 2, pc: 1.2, clock: 0.3 },
    { tier: 2.2, synergy: 2, shard: 1.5, head: 0.8 }] },
  s: { n: 26, kinds: [
    { tier: 2.5, synergy: 1.5, resonate: 0.6, qm: 0.6 },
    { thrift: 2, head: 1.2, insight: 1, idle: 1, pulsecd: 0.6, pc: 0.8 },
    { shard: 1.6, surge: 1, fold: 1, lucky: 0.8, pulse: 0.6 }] },
  e: { n: 16, kinds: [
    { tier: 2, synergy: 1.5, qexp: 0.4, qm: 0.6 },
    { head: 1, insight: 1.2, thrift: 1.2, shard: 1 },
    { ess: 1.2, shard: 1.2, res: 1, surge: 0.6, fold: 0.6 }] },
};
// strength of a grown upgrade of each kind; s runs from 1 (cheapest) to 2 (dearest in its web)
const GROW_VAL = {
  q: { tier: s => L10(1.5 + 0.5 * s), pulse: s => L10(2 * s), idle: s => L10(1.2 + 0.2 * s), lucky: s => 0.01 * s, pulsecd: s => 0.02 * s, flick: s => 0.02 * s, qm: s => L10(1.15 + 0.15 * s),
    res: s => 0.002 * s, resonate: () => 1, thrift: s => 0.015 * s, pc: s => L10(1 + 0.002 * s), clock: () => 0.001, hi: s => L10(1 + 0.04 * s), synergy: s => 0.03 * s, shard: s => L10(1 + 0.1 * s), head: s => 0.5 * s },
  s: { tier: s => L10(2 * s), synergy: s => 0.04 * s, hi: s => L10(1 + 0.06 * s), resonate: () => 1, qm: s => L10(1.5 * s), thrift: s => 0.015 * s, head: s => s, insight: s => 0.3 * s, idle: s => L10(1 + 0.5 * s),
    pulsecd: s => 0.02 * s, pc: s => L10(1 + 0.0025 * s), shard: s => L10(1 + 0.12 * s), surge: s => Math.round(3 * s), fold: s => 0.02 * s, lucky: s => 0.01 * s, pulse: s => L10(3 * s) },
  e: { tier: s => L10(10 * s), synergy: s => 0.06 * s, hi: s => L10(1 + 0.1 * s), qexp: s => 0.001 * s, qm: s => L10(100 * s), head: s => 1.5 * s, insight: s => 0.5 * s, thrift: s => 0.02 * s,
    shard: s => L10(1 + 0.5 * s), ess: s => L10(1 + 0.01 * s), res: s => 0.003 * s, surge: s => Math.round(5 * s), fold: s => 0.03 * s },
};
const GROW_NAMES = Object.assign({}, NAME_BITS, {
  qm: NAME_BITS.qmult,
  hi: [['Falling', 'Rushing', 'Deep', 'Swift', 'Heavy', 'Sheer', 'Sunken'], ['Cascade', 'Torrent', 'Rapids', 'Spillway', 'Current', 'Weir', 'Sluice']],
  pc: [['Ticking', 'Measured', 'Steady', 'Tolling', 'Counted', 'Even'], ['Beat', 'Tick', 'Toll', 'Chime', 'Count', 'Stroke']],
});
const GROWN = new Set(), KIND_UPG = { q: [], s: [], e: [] }, GROW_P = { q: 0.18, s: 0.1, e: 0.18 }; // strength of the grown upgrades per web (the Shard web feeds the Collapse loop)
const roundSig = (x, d = 2) => +x.toPrecision(d);
const GROW_FULL = new Set(['resonate', 'surge', 'thrift', 'lucky', 'pulsecd', 'fold', 'res', 'clock', 'pc', 'ess', 'qexp', 'synergy', 'flick']); // grown kinds not scaled by GROW_P
function growDesc(u) {
  const G = t => plural(genDef(t).name), x = v => niceX(v);
  switch (u.kind) {
    case 'tier': return G(u.tier) + ' ×' + x(u.v) + '.';
    case 'thrift': return priceName(u.tier) + ' prices grow ' + pct(u.v) + ' slower.';
    case 'resonate': return G(u.tier) + ' resonate one purchase sooner (every 10 bought becomes every 9, and so on, down to every 5).';
    case 'synergy': return G(u.tier) + ' ×(1 + ' + G(u.src) + ' bought)^' + u.v + '.';
    case 'pulse': return 'Pulse ×' + x(u.v) + '.';
    case 'idle': return 'While you have not touched the game for a minute, Quanta production ×' + x(u.v) + '.';
    case 'lucky': return 'Each Pulse gets +' + pct(u.v) + ' chance to be Lucky (×' + LUCKY_X + ' Quanta).';
    case 'pulsecd': return 'Pulse recharges ' + pct(u.v) + ' faster.';
    case 'flick': return 'Flickers ×(log₁₀ Quanta)^' + u.v + '.';
    case 'head': return 'Every Collapse starts with ×' + x(u.v) + ' more Quanta (up to ' + x(HEAD_CAP) + ' in all).';
    case 'insight': return 'The Architect’s ideas in this web cost ÷' + x(u.v) + '.';
    case 'surge': return 'Surge lasts ' + u.v + ' seconds longer.';
    case 'fold': return 'Time Fold recharges ' + pct(u.v) + ' faster.';
    case 'qexp': return 'Quanta production exponent +' + u.v + '.';
  }
  return '';
}
// what a kind upgrade shows as "Currently ..."
const kindEff = u => u.kind === 'synergy' ? () => fmtMult(u.v * L10(1 + tierBought(u.src))) : u.kind === 'flick' ? () => fmtMult(u.v * L10(Math.max(1, lq()))) : undefined;
function growWebs() {
  const LISTS = { q: QUPG, s: SUPG, e: EUPG }, BY = { q: QBY, s: SBY, e: EBY };
  // the hand-written kind upgrades (kx) join the list first
  for (const layer of ['q', 's', 'e']) for (const u of LISTS[layer]) if (u.kind) { KIND_UPG[layer].push(u); if (!u.desc) u.desc = growDesc(u); u.eff = kindEff(u); }
  const names = new Set([].concat(QUPG, SUPG, EUPG).map(u => u.name));
  // one pass of growth over a web: count upgrades per branch, seeded, numbered on from k0
  const pass = (layer, count, seed, k0, pickAnchors) => {
    const W = WEB_DEF[layer], cfg = GROW[layer], rng = mulberry(hashStr(seed + layer));
    const pick = a => a[Math.floor(rng() * a.length)];
    const costLog = id => W.costLog(id);
    let maxC = 0; W.branches.forEach((br, b) => { if (cfg.kinds[b]) for (const l of br.links) for (const id of [].concat(l[0], l[1])) maxC = Math.max(maxC, costLog(id)); });
    let k = k0;
    W.branches.forEach((br, b) => {
      if (!cfg.kinds[b]) return; // Wonders (Essence web) is unlocks only: nothing grows on it
      const ids = []; for (const l of br.links) for (const id of [].concat(l[0], l[1])) if (!ids.includes(id)) ids.push(id);
      if (!pickAnchors) for (const late of GROW_LATE) if (ids.includes(late)) ids.splice(ids.indexOf(late), 1);
      if (!pickAnchors && layer === 's' && b === 1) { ids.splice(ids.indexOf('s2'), 1); ids.unshift('s2'); } // Wholesale came later: same anchors as before
      const anchors = (pickAnchors ? pickAnchors(ids, br) : ids).slice(), wts = cfg.kinds[b], made = [];
      if (!anchors.length) return;
      for (let i = anchors.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [anchors[i], anchors[j]] = [anchors[j], anchors[i]]; }
      let a = 0;
      while (made.length < count) {
        const anchor = anchors[a++ % anchors.length], len = Math.min(count - made.length, 1 + Math.floor(rng() * 3));
        let prev = anchor, c = costLog(anchor);
        for (let j = 0; j < len; j++) {
          // the next price: a little above the one before (Quanta costs are already logs)
          c += layer === 'q' ? Math.max(1, Math.round(Math.max(1.5, 0.08 * c) * (0.6 + 0.8 * rng()))) : Math.max(0.3, 0.1 * c) * (0.6 + 0.8 * rng());
          const cost = layer === 'q' ? c : roundSig(Math.pow(10, c)), s = 1 + Math.min(1, c / Math.max(1, maxC));
          let tot = 0; for (const kd in wts) tot += wts[kd];
          let r = rng() * tot, kind = 'qm'; for (const kd in wts) { r -= wts[kd]; if (r <= 0) { kind = kd; break; } }
          const id = 'g' + layer + (++k), u = { id, name: '', cost, grown: true };
          const val = GROW_FULL.has(kind) ? GROW_VAL[layer][kind](s) : GROW_VAL[layer][kind](s) * GROW_P[layer];
          if (FIELDS.includes(kind)) {
            u[kind] = FLOG[kind] ? L10(roundSig(Math.pow(10, val), val < L10(1.1) ? 4 : 3)) : +val.toFixed(3);
          } else {
            u.kind = kind; u.v = ['tier', 'pulse', 'idle', 'head', 'insight'].includes(kind) ? L10(roundSig(Math.pow(10, val), val < L10(1.1) ? 3 : 2)) : +val.toFixed(3);
            // which generator it is about: around the tiers you have when you can afford it
            let topT = layer === 's' ? 2 + Math.floor((s - 1) * 10) : 6 + Math.floor((s - 1) * 14);
            if (layer === 'q') { topT = 1; while (topT + 1 < GEN_NAMES.length && genDef(topT + 1).base <= c - 2) topT++; }
            if (kind === 'tier' || kind === 'resonate') u.tier = Math.max(0, Math.min(GEN_NAMES.length - 1, topT - Math.floor(rng() * 4)));
            if (kind === 'thrift') u.tier = Math.max(0, Math.min(GEN_NAMES.length - 1, topT - Math.floor(rng() * 4)));
            if (kind === 'synergy') { u.src = Math.max(1, Math.min(GEN_NAMES.length - 1, topT - Math.floor(rng() * 3))); u.tier = rng() < 0.6 ? u.src - 1 : Math.floor(rng() * u.src); }
            u.eff = kindEff(u);
            KIND_UPG[layer].push(u);
          }
          // a name nobody else has
          const bits = GROW_NAMES[kind] || GROW_NAMES.qmult;
          for (let tries = 0; tries < 30 && (!u.name || names.has(u.name)); tries++)
            u.name = (kind === 'tier' || kind === 'resonate' ? genDef(u.tier).name : kind === 'synergy' ? genDef(u.src).name + '–' + genDef(u.tier).name : pick(bits[0].length ? bits[0] : NAME_BITS.qmult[0])) + ' ' + pick(bits[1]);
          const base = u.name;
          for (let n = 2; names.has(u.name); n++) u.name = base + ' ' + (n <= 10 ? ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n - 2] : n);
          names.add(u.name);
          u.desc = u.kind ? growDesc(u) : FIELDS.filter(f => u[f]).map(f => FIELD_TXT[f] + (FLOG[f] ? niceX(u[f]) : u[f]) + (f === 'pc' ? ' per Clock Speed level' : '') + '.').join(' ');
          LISTS[layer].push(u); BY[layer][id] = u; GROWN.add(id);
          for (const f of FIELDS) if (u[f]) FU[f].push([layer, u]);
          br.links.push([prev, id]); prev = id; made.push(id);
        }
      }
    });
    return k;
  };
  for (const layer of ['q', 's', 'e']) pass(layer, GROW[layer].n, 'grow:', 0, null);
  // a second, later pass fills out the thin Shard web: short twigs on the written upgrades with the fewest
  // branches. It has its own seed and numbering, so every upgrade from the first pass stays exactly the same.
  pass('s', GROW_MORE_S, 'grow2:', GROW.s.n * 3, (ids, br) => {
    if (br.name === 'Clockwork') return ['s8', 'abC', 'ab2', 's11', 'abL', 'abH', 'abK', 'ab5', 'ab6', 'ab8', 's9', 's45', 's46', 's44', 's40', 's21', 's22', 's27', 's42', 's15', 's43', 's2']; // Memory moved later
    if (br.name === 'Echoes') return ['s47', 's25', 's23', 's24', 's31', 's30', 's50', 's52', 's53', 's48', 's10', 's49', 's29', 's51', 's54']; // re-linked later
    const kids = {};
    for (const [a, b] of br.links) if (!GROWN.has([].concat(b)[0])) for (const x of [].concat(a)) kids[x] = (kids[x] || 0) + 1;
    return ids.filter(id => !GROWN.has(id) && (kids[id] || 0) <= 1);
  });
}
const GROW_MORE_S = 18; // extra Shard upgrades per branch
const GROW_LATE = ['sB', 'e40']; // written upgrades added after the first growth pass: never its anchors
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
growWebs();
/* Endless growth: past the written webs, the outer tips keep growing. Owning the newest node of a tip sprouts
   the next one (and every few steps a new branch), so there is always one more upgrade. Each node is generated
   from its id alone, so a save only remembers which ones it owns and the web regrows the same way. */
const DYN = { q: null, s: null, e: null };
const DYN_MIN = { q: 120, s: 9, e: 3 };     // only tips at least this dear (log10) keep growing, so the start stays calm
const DYN_FLOOR = { q: 320, s: 45, e: 12 }; // the first grown node of a tip costs at least this much: past the written web
const DYN_TIPS = 4;                          // growing tips per branch (the dearest leaves)
const dynStep = (layer, c) => layer === 'q' ? Math.max(4, 0.04 * c) : layer === 's' ? 2 + 0.05 * c : 1 + 0.05 * c;
function dynState(layer) {
  if (DYN[layer]) return DYN[layer];
  const W = WEB_DEF[layer], parents = new Set(), tips = [];
  for (const br of W.branches) for (const [a] of br.links) for (const x of [].concat(a)) parents.add(x);
  W.branches.forEach((br, b) => {
    if (!GROW[layer].kinds[b]) return; // Wonders does not grow endlessly either
    const leaves = [];
    for (const [, c] of br.links) for (const y of [].concat(c)) if (!parents.has(y) && !leaves.includes(y)) leaves.push(y);
    leaves.sort((x, y) => W.costLog(y) - W.costLog(x));
    const far = leaves.filter(id => W.costLog(id) >= DYN_MIN[layer]);
    for (const id of (far.length >= 2 ? far : leaves).slice(0, DYN_TIPS)) tips.push({ id, b });
  });
  return (DYN[layer] = { tips, nodes: {}, list: [] });
}
function dynMake(layer, id, parent, b, c, depth, twig) {
  const D = dynState(layer); if (D.nodes[id]) return D.nodes[id];
  const LIST = { q: QUPG, s: SUPG, e: EUPG }[layer], BY = { q: QBY, s: SBY, e: EBY }[layer];
  const rng = mulberry(hashStr('dyn:' + id)), pick = a => a[Math.floor(rng() * a.length)];
  const wts = GROW[layer].kinds[b]; let tot = 0; for (const k in wts) tot += wts[k];
  let r = rng() * tot, kind = 'qm'; for (const k in wts) { r -= wts[k]; if (r <= 0) { kind = k; break; } }
  const u = { id, name: '', cost: layer === 'q' ? Math.round(c * 10) / 10 : (c < 300 ? roundSig(Math.pow(10, c)) : Infinity), grown: true, dyn: true };
  const val = GROW_FULL.has(kind) ? GROW_VAL[layer][kind](2) : GROW_VAL[layer][kind](2) * GROW_P[layer];
  if (FIELDS.includes(kind)) u[kind] = FLOG[kind] ? L10(roundSig(Math.pow(10, val), val < L10(1.1) ? 4 : 3)) : +val.toFixed(3);
  else {
    u.kind = kind; u.v = ['tier', 'pulse', 'idle', 'head', 'insight'].includes(kind) ? L10(roundSig(Math.pow(10, val), val < L10(1.1) ? 3 : 2)) : +val.toFixed(3);
    // which generator: around the tiers you would have at that price (deep tips reach far up the ladder)
    let topT = layer === 's' ? 10 + Math.floor(depth / 2) : layer === 'e' ? 18 + Math.floor(depth / 2) : 1;
    if (layer === 'q') { while (topT < 400 && genDef(topT + 1).base <= c - 2) topT++; }
    if (kind === 'tier' || kind === 'resonate' || kind === 'thrift') u.tier = Math.max(0, topT - Math.floor(rng() * 4));
    if (kind === 'synergy') { u.src = Math.max(1, topT - Math.floor(rng() * 3)); u.tier = rng() < 0.6 ? u.src - 1 : Math.floor(rng() * u.src); }
    u.eff = kindEff(u);
    KIND_UPG[layer].push(u);
  }
  const bits = GROW_NAMES[kind] || GROW_NAMES.qmult;
  u.name = (kind === 'tier' || kind === 'resonate' ? genDef(u.tier).name : kind === 'synergy' ? genDef(u.src).name + '–' + genDef(u.tier).name : pick(bits[0].length ? bits[0] : NAME_BITS.qmult[0])) + ' ' + pick(bits[1]) + ' ' + ROMAN(depth);
  u.desc = u.kind ? growDesc(u) : FIELDS.filter(f => u[f]).map(f => FIELD_TXT[f] + (FLOG[f] ? niceX(u[f]) : u[f]) + (f === 'pc' ? ' per Clock Speed level' : '') + '.').join(' ');
  LIST.push(u); BY[id] = u;
  for (const f of FIELDS) if (u[f]) FU[f].push([layer, u]);
  const n = { id, parent, b, depth, twig: twig || false, costLog: c };
  D.nodes[id] = n; D.list.push(n);
  return n;
}
// Automata never run out: owning Automata N (from IX up) adds Automata N+1, an autobuyer for the next generator
const autoCostLog = k => L10(2e7) + 1.2 * (k - 8) + 0.04 * (k - 8) * (k - 8);
function growAutomata() {
  const D = dynState('s');
  for (let k = 9; k < 2000 && S.sUpg['ab' + (k - 1)]; k++) {
    const id = 'ab' + k;
    if (!D.nodes[id]) {
      const c = autoCostLog(k);
      const u = { id, name: 'Automata ' + ROMAN(k + 1), cost: c < 300 ? roundSig(Math.pow(10, c)) : Infinity, auto: true, dyn: true, desc: 'An autobuyer for ' + plural(genDef(k).name) + '. Owning it adds the next Automata.' };
      SUPG.push(u); SBY[id] = u;
      const n = { id, parent: 'ab' + (k - 1), b: 1, depth: k, twig: false, costLog: c, big: true };
      D.nodes[id] = n; D.list.push(n);
    }
  }
}
// The endless tree: every line keeps growing as you buy its newest node, and forks every few steps (alternating
// sides). The new lines fork again, three levels deep, each level a little steeper, so the tree bushes out into
// many branches without putting more upgrades into each order of magnitude.
const DYN_FORK = [2, 3, 2], DYN_STEEP = 2.6, DYN_GENS = 3;
function dynLine(layer, b, parent, c, depth, gen, idAt, twig) {
  const own = id => !!S[UPG_KEY[layer]][id], k = Math.pow(DYN_STEEP, gen);
  let bp = parent, bc = c;
  for (let j = 1; j < 5000; j++) {
    const id = idAt(j);
    dynMake(layer, id, bp, b, bc, depth + j - 1, j === 1 ? twig : false);
    // a fork is a sibling of this node (both grow from the one before); ids t / x are the ones older saves own
    if (gen < DYN_GENS && j % DYN_FORK[gen] === 0 && own(bp)) {
      const f = j / DYN_FORK[gen], suf = gen === 0 ? (j % 4 ? 'u' : 't') : gen === 1 ? 'x' : 'y';
      dynLine(layer, b, bp, bc + 0.5 * dynStep(layer, bc) * k, depth + j - 1, gen + 1, i => i === 1 ? id + suf : id + suf + '_' + i, f % 2 ? 'L' : 'R');
    }
    if (!own(id)) break;
    bp = id; bc += dynStep(layer, bc) * k * (0.85 + 0.3 * mulberry(hashStr('step:' + idAt(j + 1)))());
  }
}
function growDynamic(layer) {
  const D = dynState(layer), W = WEB_DEF[layer], own = id => !!S[UPG_KEY[layer]][id];
  if (layer === 's') growAutomata();
  if (!S.eUpg.e36) return D; // Overgrowth (Essence web) starts the endless growth
  for (const tip of D.tips) {
    if (!own(tip.id)) continue;
    const at = d => layer + '_' + tip.id + '_' + d, c0 = W.costLog(tip.id);
    const c1 = Math.max(c0 + dynStep(layer, c0) * (0.85 + 0.3 * mulberry(hashStr('step:' + at(1)))()), DYN_FLOOR[layer]);
    dynLine(layer, tip.b, tip.id, c1, 1, 0, at, false);
  }
  return D;
}
const dynNode = (layer, id) => { const D = dynState(layer), n = D.nodes[id]; return n ? { id, type: 'notable', gen: !n.big, dyn: true, big: !!n.big, br: n.b, upg: id, costLog: n.costLog, parent: n.parent } : null; };
// Upgrades come one at a time, not in bursts: sorted by its written price, every upgrade costs at least
// x5 (QGAP orders of magnitude) more than the one before it. The first costs 20 Quanta, then 100, 500, ...
// until the written prices are steeper anyway. cost0 keeps the written price.
const QGAP = 0.7;
// the written prices squeezed at the cheap end (2 → 20 Quanta), rejoining them at 1e18
const qPrice = c => c >= 18 ? c : 1.3 + 16.7 * Math.pow(Math.max(0, c - 2) / 16, 2);
function priceUpgradeWeb(gap = QGAP) {
  const depth = { [WEB_DEF.q.root]: 0 }, kids = {};
  for (const br of WEB_DEF.q.branches) { depth[br.start] = 1; for (const [a, b] of br.links) for (const x of [].concat(a)) for (const y of [].concat(b)) (kids[x] = kids[x] || []).push(y); }
  const q = Object.keys(depth); while (q.length) { const x = q.shift(); for (const y of kids[x] || []) if (depth[y] === undefined) { depth[y] = depth[x] + 1; q.push(y); } }
  for (const u of QUPG) if (u.cost0 === undefined) u.cost0 = u.cost;
  // ties keep parents before children, so every upgrade still costs at least as much as the one it grows from
  const order = QUPG.slice().sort((a, b) => (a.cost0 - b.cost0) || ((depth[a.id] || 0) - (depth[b.id] || 0)));
  let prev = -Infinity;
  for (const u of order) { const c = prev === -Infinity ? L10(20) : Math.max(qPrice(u.cost0), prev + gap); u.cost = c < 300 ? L10(roundSig(Math.pow(10, c), 2)) : Math.round(c * 10) / 10; prev = c; }
}
priceUpgradeWeb();
// Force layout: springs along edges, repulsion between nodes, anchors pull notables to their branch.
// where a new endless node goes: a step out from the node it grows from, forks turning off to their side
function dynPlace(layer, nodes, pos, dn) {
  const pp = pos[dn.parent] || [0, 0], gp = nodes[dn.parent] && nodes[dn.parent].dyn ? pos[nodes[dn.parent].parent] : null;
  let dx = pp[0] - (gp ? gp[0] : 0), dy = pp[1] - (gp ? gp[1] : 0); const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
  const turn = dn.twig === 'L' ? -0.85 : dn.twig === 'R' ? 0.85 : (dn.depth % 2 ? 0.15 : -0.15);
  const vx = dx - dy * turn, vy = dy + dx * turn, vl = Math.hypot(vx, vy) || 1;
  return [pp[0] + vx / vl * 125, pp[1] + vy / vl * 125];
}
// one of the Architect's ideas joins the web: the idea and its connector, at the least crowded spot near its parent
function archAdd(layer, i, nodes, edges, pos) {
  const W = WEB_DEF[layer], u = S.forge[layer][i];
  if (u.branch === undefined) { u.branch = ARCH_BRANCH[layer](u.kind, u.tier); u.parent = pickParentWeb(layer, u.branch, S.forge[layer].slice(0, i)); }
  const id = 'a' + i, cid = 'c' + i;
  u.parent = bigParent(layer, nodes[u.parent] ? u.parent : W.root);
  const parent = nodes[u.parent] ? u.parent : W.root;
  nodes[cid] = connectorNode(layer, i); nodes[cid].parent = parent;
  nodes[id] = { id, type: 'arch', arch: i, br: u.branch, parent, anchor: null };
  edges.push([parent, id], [parent, cid], [cid, id]);
  if (pos[id]) return null;
  const pp = pos[parent] || [0, 0];
  const base = (pp[0] || pp[1]) ? Math.atan2(pp[1], pp[0]) : W.branches[u.branch].angle * Math.PI / 180;
  let best = null, bestA = base, score = -Infinity; // the least crowded spot wins, even when every spot is crowded
  for (const da of [0, 0.45, -0.45, 0.9, -0.9, 1.35, -1.35, 1.8, -1.8, 2.4, -2.4]) for (const dist of [140, 200, 260]) {
    const a2 = base + da, c = [pp[0] + Math.cos(a2) * dist, pp[1] + Math.sin(a2) * dist];
    let m = 1e12; for (const k in pos) { const q = pos[k], d2 = (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2; if (d2 < m) m = d2; }
    m -= dist * 40; // prefer staying close to the parent when there is room
    if (m > score) { score = m; best = c; bestA = a2; }
  }
  pos[id] = best; nodes[id].anchor = best.slice();
  const mx = (pp[0] + best[0]) / 2, my = (pp[1] + best[1]) / 2;
  pos[cid] = [mx + Math.cos(bestA + Math.PI / 2) * 45, my + Math.sin(bestA + Math.PI / 2) * 45];
  return [id, cid];
}
// a new idea in a big web: place it and settle just it, instead of a fresh layout of everything (0.2 s late in the game)
function webArchOnly(layer, c, nArch) {
  const nodes = c.nodes, edges = c.edges, pos = WEB_POS[layer], adj = c.adj, added = [], e0 = edges.length;
  for (let i = c.nArch; i < nArch; i++) { const ids = archAdd(layer, i, nodes, edges, pos); if (ids) added.push(...ids); }
  for (let k = e0; k < edges.length; k++) { const [a, b] = edges[k]; (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a); }
  relaxNew(added, nodes, pos);
  return (WEB_CACHE[layer] = { nodes, edges, adj, pos, nArch, nDyn: c.nDyn, S });
}
function webGrowOnly(layer, c, D) {
  const nodes = c.nodes, edges = c.edges, pos = WEB_POS[layer], adj = c.adj, added = [];
  for (let i = c.nDyn; i < D.list.length; i++) {
    const dn = D.list[i], n = dynNode(layer, dn.id);
    nodes[dn.id] = n; edges.push([dn.parent, dn.id]);
    adj[dn.id] = [dn.parent]; (adj[dn.parent] = adj[dn.parent] || []).push(dn.id);
    pos[dn.id] = dynPlace(layer, nodes, pos, dn); n.anchor = pos[dn.id].slice(); added.push(dn.id);
  }
  relaxNew(added, nodes, pos);
  return (WEB_CACHE[layer] = { nodes, edges, adj, pos, nArch: c.nArch, nDyn: D.list.length, S });
}
// settle only the new nodes: pushed away from everything near them, pulled toward the node they grow from
function relaxNew(ids, nodes, pos, iters = 25) {
  const all = Object.keys(nodes);
  for (let it = 0; it < iters; it++) for (const id of ids) {
    const p = pos[id]; let fx = 0, fy = 0;
    for (const k of all) {
      if (k === id) continue; const q = pos[k]; if (!q) continue;
      const dx = p[0] - q[0], dy = p[1] - q[1], d2 = dx * dx + dy * dy + 1; if (d2 > 90000) continue;
      const d = Math.sqrt(d2), f = 3400 / d2; fx += dx / d * f; fy += dy / d * f;
    }
    const o = pos[nodes[id].parent]; if (o) { const dx = o[0] - p[0], dy = o[1] - p[1], d = Math.hypot(dx, dy) + 0.01, f = (d - 100) * 0.05; fx += dx / d * f; fy += dy / d * f; }
    const m = Math.hypot(fx, fy); if (m > 30) { fx *= 30 / m; fy *= 30 / m; }
    p[0] += fx; p[1] += fy;
  }
}
function relax(nodes, edges, pos, iters) {
  const ids = Object.keys(nodes), n = ids.length, idx = {};
  ids.forEach((id, i) => { idx[id] = i; });
  const Pp = ids.map(id => pos[id]), kind = ids.map(id => nodes[id].type), anc = ids.map(id => nodes[id].anchor || null);
  const E = edges.filter(e => !e[2]).map(([a, b]) => [idx[a], idx[b]]).filter(([i, j]) => i !== undefined && j !== undefined);
  if (n > 400) iters = Math.min(iters, 30);
  for (let it = 0; it < iters; it++) {
    const F = ids.map(() => [0, 0]);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const dx = Pp[i][0] - Pp[j][0], dy = Pp[i][1] - Pp[j][1], d2 = dx * dx + dy * dy + 1;
      if (d2 > 90000) continue;
      const d = Math.sqrt(d2), f = 3400 / d2;
      F[i][0] += dx / d * f; F[i][1] += dy / d * f; F[j][0] -= dx / d * f; F[j][1] -= dy / d * f;
    }
    for (const [i, j] of E) {
      const dx = Pp[j][0] - Pp[i][0], dy = Pp[j][1] - Pp[i][1], d = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const rest = kind[i] === 'minor' && kind[j] === 'minor' ? 70 : 100, f = (d - rest) * 0.05;
      F[i][0] += dx / d * f; F[i][1] += dy / d * f; F[j][0] -= dx / d * f; F[j][1] -= dy / d * f;
    }
    // keep nodes from sitting on lines they are not part of
    if (it % 2 === 0) for (const [i, j] of E) {
      const ax = Pp[i][0], ay = Pp[i][1], bx = Pp[j][0], by = Pp[j][1], vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy + 1e-6;
      const x0 = Math.min(ax, bx) - 45, x1 = Math.max(ax, bx) + 45, y0 = Math.min(ay, by) - 45, y1 = Math.max(ay, by) + 45;
      for (let c = 0; c < n; c++) {
        if (c === i || c === j) continue;
        const px = Pp[c][0], py = Pp[c][1];
        if (px < x0 || px > x1 || py < y0 || py > y1) continue;
        const u = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / L2)), qx = ax + vx * u, qy = ay + vy * u, ex = px - qx, ey = py - qy, d = Math.sqrt(ex * ex + ey * ey) + 0.01;
        if (d < 42) { const f = (42 - d) * 0.25; F[c][0] += ex / d * f; F[c][1] += ey / d * f; }
      }
    }
    for (let i = 0; i < n; i++) {
      if (kind[i] === 'root') { Pp[i][0] = 0; Pp[i][1] = 0; continue; }
      if (anc[i]) { const s = kind[i] === 'notable' ? 0.3 : 0.12; F[i][0] += (anc[i][0] - Pp[i][0]) * s; F[i][1] += (anc[i][1] - Pp[i][1]) * s; }
      Pp[i][0] += Math.max(-14, Math.min(14, F[i][0])); Pp[i][1] += Math.max(-14, Math.min(14, F[i][1]));
    }
  }
}
const WEB_STATIC = {};
function webStatic(layer) {
  if (WEB_STATIC[layer]) return WEB_STATIC[layer];
  const W = WEB_DEF[layer], nodes = {}, edges = [], placed = [], forks = [];
  const add = n => (nodes[n.id] = n);
  const link = (x, y, arc) => edges.push(arc ? [x, y, 1] : [x, y]);
  const polar = (ang, r) => [Math.cos(ang) * r, Math.sin(ang) * r];
  const ids = g => Array.isArray(g) ? g : [g], key = g => ids(g).join('|');
  // a side loop of optional bonus nodes from big node group A to group B through the given points
  const loop = (idp, A, B, pts, effOf) => {
    const cMax = Math.max(nodes[A[0]].costLog, nodes[B[0]].costLog), cMin = Math.min(nodes[A[0]].costLog, nodes[B[0]].costLog);
    let prev = A;
    pts.forEach((p, i) => { const id = `${idp}:${i + 1}`, e = effOf(i + 1), c = layer === 'q' ? cMin + (cMax - cMin) * (i + 1) / (pts.length + 1) : cMax - 0.3; add({ id, type: 'minor', br: e.br, costLog: c, eff: e.eff, anchor: p }); for (const q of prev) link(q, id); prev = [id]; });
    for (const c of B) link(prev[0], c);
  };
  // the bonus loop alongside a direct link, bulging to one side
  const sideLoop = (idp, A, B, side, eff) => {
    const pa = nodes[A[0]].anchor, pb = nodes[B[0]].anchor, dx = pb[0] - pa[0], dy = pb[1] - pa[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len * side, ny = dx / len * side;
    const off = Math.min(85, len * 0.3);
    loop(idp, A, B, W.loopNodes === 1 ? [[pa[0] + dx * 0.5 + nx * off, pa[1] + dy * 0.5 + ny * off]] : [[pa[0] + dx * 0.33 + nx * off, pa[1] + dy * 0.33 + ny * off], [pa[0] + dx * 0.67 + nx * off, pa[1] + dy * 0.67 + ny * off]], () => eff);
  };
  const R = d => 260 + d * 240;
  add({ id: W.root, type: 'root', br: -1, upg: W.root, costLog: W.costLog(W.root), anchor: [0, 0] });
  W.branches.forEach((br, b) => {
    const th0 = br.angle * Math.PI / 180, span = (br.span || 100) * Math.PI / 180, kids = {};
    for (const [p, c] of br.links) (kids[key(p)] = kids[key(p)] || []).push(c);
    const leaves = g => { const k = kids[key(g)]; return k ? k.reduce((s, c) => s + leaves(c), 0) : (GROWN.has(ids(g)[0]) ? 0.4 : 1); };
    let li = 0;
    const place = (g, depth, a0, a1, parent, pAng) => {
      const ang = (a0 + a1) / 2, r = R(depth), gi = ids(g), dir = [Math.cos(ang), Math.sin(ang)], nrm = [-dir[1], dir[0]];
      gi.forEach((id, k) => {
        const off = gi.length > 1 ? (k ? 105 : -105) : 0;
        add({ id, type: 'notable', br: b, upg: id, gen: GROWN.has(id), costLog: W.costLog(id), anchor: [dir[0] * r + nrm[0] * off, dir[1] * r + nrm[1] * off] });
        for (const p of ids(parent)) link(p, id);
      });
      placed.push({ b, depth, ang, g: gi });
      if (gi.length > 1) forks.push(gi); // a path choice: own one side and the other closes
      // bonus loop on the outer side of a split, alternating along a straight line
      const side = Math.abs(ang - pAng) < 0.02 ? ((li++ % 2) ? 1 : -1) : (ang > pAng ? 1 : -1);
      if (!br.noLoops && !GROWN.has(gi[0]) && gi.length === 1 && ids(parent).length === 1) sideLoop(`m:${layer}:${b}:${key(g)}`, ids(parent), gi, side, { br: b, eff: br.minor });
      const k = kids[key(g)] || [], total = k.reduce((s, c) => s + leaves(c), 0);
      let cur = a0;
      for (const c of k) { const w = (a1 - a0) * leaves(c) / total; place(c, depth + (GROWN.has(ids(c)[0]) ? 0.55 : 1), cur, cur + w, g, ang); cur += w; }
    };
    place(br.start, 0, th0 - span / 2, th0 + span / 2, W.root, th0);
  });
  // Upgrades can branch from bonus nodes too: about half of the grown chains start from the bonus node just
  // before the big upgrade they hang from (it always costs less, so prices still rise along every path)
  for (let i = 0; i < edges.length; i++) {
    const [x, y] = edges[i], nx = nodes[x], ny = nodes[y];
    if (!nx || !ny || !ny.gen || nx.gen || nx.type !== 'notable' || hashStr('bonusroot:' + y) % 2) continue;
    const mid = `m:${layer}:${nx.br}:${x}:${W.loopNodes || 2}`, m = nodes[mid];
    if (m && m.costLog <= ny.costLog) { edges[i] = [mid, y]; ny.fromBonus = true; }
  }
  const adj = {};
  for (const id in nodes) adj[id] = [];
  for (const [x, y] of edges) { adj[x].push(y); adj[y].push(x); }
  const pos = {};
  for (const id in nodes) pos[id] = nodes[id].anchor.slice();
  relax(nodes, edges, pos, 200);
  return (WEB_STATIC[layer] = { nodes, edges, adj, pos, forks });
}
let MINOR_VER = 0;
const MINOR_AGG = {};
function minorAgg(layer) {
  const c = MINOR_AGG[layer];
  if (c && c.v === MINOR_VER && c.S === S) return c.a;
  const a = { qmult: 0, res: 0, clock: 0, shard: 0, ess: 0 }, st = webStatic(layer);
  for (const id in S.minor[layer]) { const n = st.nodes[id] || (/^c\d+$/.test(id) ? connectorNode(layer, +id.slice(1)) : null); if (n && n.eff) a[n.eff.kind] += n.eff.v; }
  MINOR_AGG[layer] = { v: MINOR_VER, S, a };
  return a;
}
const minorSum = k => minorAgg('q')[k] + minorAgg('s')[k] + minorAgg('e')[k];
const isBig = n => !!n && (n.type === 'notable' || n.type === 'root' || n.type === 'arch');
// connector bonus node c<i> sits between an Architect idea a<i> and the big node it grows from
function connectorNode(layer, i) {
  const u = S.forge[layer][i]; if (!u) return null;
  const br = WEB_DEF[layer].branches[u.branch];
  return { id: 'c' + i, type: 'minor', connector: i, br: u.branch, parent: u.parent, eff: br ? br.minor : WEB_DEF[layer].ring, costLog: procCost(layer, i) - 0.5 };
}
// older saves may have an idea attached to a small node: move it to the nearest big node
function bigParent(layer, pid) {
  const st = webStatic(layer);
  if (/^a\d+$/.test(pid) || !st.nodes[pid] || isBig(st.nodes[pid])) return st.nodes[pid] || /^a\d+$/.test(pid) ? pid : WEB_DEF[layer].root;
  const seen = { [pid]: 1 }, q = [pid];
  while (q.length) { const id = q.shift(); for (const nb of st.adj[id]) if (!seen[nb]) { if (isBig(st.nodes[nb])) return nb; seen[nb] = 1; q.push(nb); } }
  return WEB_DEF[layer].root;
}
function webNode(layer, id) {
  if (/^a\d+$/.test(id)) { const i = +id.slice(1), u = S.forge[layer][i]; return u ? { id, type: 'arch', arch: i, br: u.branch, parent: u.parent } : null; }
  if (/^c\d+$/.test(id)) return connectorNode(layer, +id.slice(1));
  return webStatic(layer).nodes[id] || dynNode(layer, id);
}
function webOwned(layer, n) {
  if (n.type === 'arch') return ideaOwned(layer, n.arch);
  if (n.type === 'minor') return !!S.minor[layer][n.id];
  return WEB_DEF[layer].owned(n.upg);
}
const webForked = (layer, n) => layer === 's' && n.type === 'notable' && sForkTaken(n.upg);
const webForkOther = (layer, id) => { for (const f of webStatic(layer).forks) if (f.includes(id)) return f.find(x => x !== id); return null; };
function webAvail(layer, n) {
  if (webOwned(layer, n) || webForked(layer, n)) return false;
  if (n.type === 'root') return true;
  if (n.type === 'arch' || n.dyn) { const p = webNode(layer, n.parent || WEB_DEF[layer].root); return !!p && webOwned(layer, p); }
  if (n.connector !== undefined) { if (!S.forge[layer][n.connector]) return false; const p = webNode(layer, n.parent || WEB_DEF[layer].root), a = webNode(layer, 'a' + n.connector); return (!!p && webOwned(layer, p)) || (!!a && webOwned(layer, a)); }
  const st = webStatic(layer);
  for (const nb of st.adj[n.id]) if (webOwned(layer, st.nodes[nb])) return true;
  return false;
}
const webCostLog = (layer, n) => n.type === 'arch' ? procCost(layer, n.arch) : n.costLog;
function webBuy(layer, id) {
  const n = typeof id === 'string' ? webNode(layer, id) : id;
  if (!n || !webAvail(layer, n)) return false;
  const W = WEB_DEF[layer], cost = webCostLog(layer, n);
  if (S[W.cur].log10() < cost) return false;
  if (n.type === 'arch') return buyProc(layer, n.arch);
  if (n.type === 'minor') { S[W.cur] = S[W.cur].sub(D.fromLog(cost)).max0(); S.minor[layer][n.id] = true; MINOR_VER++; return true; }
  return layer === 'q' ? buyQ(n.upg) : layer === 's' ? buyS(n.upg) : buyE(n.upg);
}
function webFrontier(layer) {
  const st = webStatic(layer), out = [], D = growDynamic(layer);
  for (const id in D.nodes) { const x = dynNode(layer, id); if (webAvail(layer, x)) out.push(x); }
  for (const id in st.nodes) { const n = st.nodes[id]; if (webAvail(layer, n)) out.push(n); }
  for (let i = 0; i < S.forge[layer].length; i++) for (const id of ['c' + i, 'a' + i]) { const x = webNode(layer, id); if (x && webAvail(layer, x)) out.push(x); }
  return out;
}
// buy the cheapest affordable nodes next to what you own (used by the Quanta upgrade autobuyer)
const wholesaleOn = () => !!S.sUpg.sB;
// Wholesale: buy every affordable Upgrade-web node, cheapest first
const buyAllUpgrades = () => wholesaleOn() ? webAutoBuy('q', 2000) : 0;
// Shard Wholesale (Essence web): the same for the Shard web, leaving path choices to you
const shardWholesaleOn = () => !!S.eUpg.e40;
const buyAllShards = () => shardWholesaleOn() ? webAutoBuy('s', 2000, undefined, true) : 0;
function webAutoBuy(layer, max = 40, branch, keepChoices) {
  const cur = WEB_DEF[layer].cur;
  let bought = 0;
  ensureOpen(layer);
  for (let g = 0; g < max; g++) {
    let best = null, bc = Infinity;
    for (const n of webFrontier(layer)) { if (branch !== undefined && n.br !== branch && n.type !== 'root') continue; if (keepChoices && n.type === 'notable' && webForkOther(layer, n.upg)) continue; const c = webCostLog(layer, n); if (c < bc) { bc = c; best = n; } }
    if (!best || S[cur].log10() < bc || !webBuy(layer, best)) break;
    bought++;
  }
  return bought;
}
// Where a new idea grows: off an owned big upgrade of its own branch, spread around. The upgrade carrying the
// fewest ideas wins (a little randomness breaks ties), so ideas turn up here and there along the branch instead
// of trailing off in a line. Ideas sprout from other ideas only once the owned upgrades there already carry some.
function pickParentWeb(layer, b, list = S.forge[layer]) {
  const W = WEB_DEF[layer]; if (!W) return null;
  const st = webStatic(layer), kids = {}, open = new Set(), depth = [];
  list.forEach((u, i) => {
    if (!u.parent) return;
    kids[u.parent] = (kids[u.parent] || 0) + 1;
    if (!u.own) open.add(u.parent);
    depth[i] = /^a\d+$/.test(u.parent) ? (depth[+u.parent.slice(1)] || 0) + 1 : 1;
  });
  let best = null, bs = Infinity;
  const consider = (id, extra) => { const s = (kids[id] || 0) + extra + (open.has(id) ? 3 : 0) + Math.random() * 1.2; if (s < bs) { bs = s; best = id; } };
  for (const id in st.nodes) { const n = st.nodes[id]; if (n.br === b && n.type === 'notable' && webOwned(layer, n)) consider(id, 0); }
  list.forEach((u, i) => { if (u.branch === b && u.own) consider('a' + i, 1.5 + (depth[i] || 1)); });
  if (best) return best;
  const br = W.branches[b]; // nothing of this branch owned yet: wait at the branch's first upgrade
  return br ? (Array.isArray(br.start) ? br.start[0] : br.start) : W.root;
}
// spread every idea of a web over its own branch again (saves from before ideas were spread out)
function respreadIdeas(layer) {
  const list = S.forge[layer];
  if (!WEB_DEF[layer]) return;
  list.forEach((u, i) => {
    u.branch = ARCH_BRANCH[layer](u.kind, u.tier); u.parent = pickParentWeb(layer, u.branch, list.slice(0, i));
    const last = u.name.split(' ').pop(); // generator names changed: rename ideas about a generator
    if (u.kind === 'tier' || u.kind === 'resonate') u.name = genDef(u.tier).name + ' ' + last;
    if (u.kind === 'synergy') u.name = genDef(u.src).name + '–' + genDef(u.tier).name + ' ' + last;
  });
  delete WEB_CACHE[layer]; WEB_POS[layer] = {};
}
// The full web for drawing: static nodes plus the Architect's growth, with re-settled positions.
const WEB_CACHE = {}, WEB_POS = { q: {}, s: {}, e: {} };
function webGraph(layer) {
  const st = webStatic(layer), W = WEB_DEF[layer];
  ensureOpen(layer);
  const D = growDynamic(layer), nDyn = D.list.length;
  const nArch = S.forge[layer].length, c = WEB_CACHE[layer];
  if (c && c.nArch === nArch && c.nDyn === nDyn && c.S === S) return c;
  if (c && c.nArch === nArch && c.S === S && nDyn > c.nDyn) return webGrowOnly(layer, c, D);
  if (c && c.nDyn === nDyn && c.S === S && nArch > c.nArch) return webArchOnly(layer, c, nArch); // a new idea: place just it
  const pos = WEB_POS[layer];
  for (const k in pos) delete pos[k]; // auto-tidy: a new node means a fresh layout of the whole web
  const nodes = Object.assign({}, st.nodes), edges = st.edges.slice();
  for (const id in st.nodes) if (!pos[id]) pos[id] = st.pos[id].slice();
  let grew = false;
  for (let i = 0; i < nArch; i++) if (archAdd(layer, i, nodes, edges, pos)) grew = true;
  // endless growth: each new node steps outward from the one it grows from (new branches turn off to the side)
  for (const dn of D.list) {
    const n = dynNode(layer, dn.id); nodes[dn.id] = n; edges.push([dn.parent, dn.id]);
    const at = dynPlace(layer, nodes, pos, dn);
    pos[dn.id] = at; n.anchor = at.slice(); grew = true;
  }
  if (grew) relax(nodes, edges, pos, 140);
  const adj = {};
  for (const id in nodes) adj[id] = [];
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  return (WEB_CACHE[layer] = { nodes, edges, adj, pos, nArch, nDyn, S });
}
// cheapest route (fewest nodes) from what you own to a target, for "buy the whole path"
function webPath(layer, targetId) {
  const G = webGraph(layer), tgt = G.nodes[targetId]; if (!tgt) return null;
  if (webOwned(layer, tgt)) return [];
  const prev = {}, q = [];
  let any = false;
  for (const id in G.nodes) if (webOwned(layer, G.nodes[id])) { prev[id] = null; q.push(id); any = true; }
  if (!any) { if (targetId === WEB_DEF[layer].root) return [targetId]; prev[WEB_DEF[layer].root] = null; q.push(WEB_DEF[layer].root); }
  while (q.length) {
    const id = q.shift();
    if (id === targetId) break;
    for (const nb of G.adj[id]) {
      if (nb in prev) continue;
      const n = G.nodes[nb];
      if (webForked(layer, n)) continue;
      if (n.type === 'arch' && nb !== targetId) continue;
      prev[nb] = id; q.push(nb);
    }
  }
  if (!(targetId in prev)) return null;
  const path = [];
  for (let id = targetId; id !== null && !webOwned(layer, G.nodes[id]); id = prev[id]) path.unshift(id);
  return path;
}
function webInfo(layer, n) {
  const W = WEB_DEF[layer], br = W.branches[n.br];
  if (n.type === 'arch') { const u = S.forge[layer][n.arch]; return { name: u.name, label: 'The Architect\u2019s idea' + (br ? ' · ' + br.name : ''), desc: forgeDesc(u), reason: u.reason }; }
  if (n.type === 'minor') return { name: n.eff.text, label: (n.connector !== undefined ? 'Bonus node, grown by the Architect' : 'Bonus node') + (br ? ' · ' + br.name : ''), desc: n.eff.text + '.' };
  const u = layer === 'q' ? QBY[n.upg] : layer === 's' ? SBY[n.upg] : EBY[n.upg];
  const other = webForkOther(layer, n.upg), ou = other && (layer === 's' ? SBY[other] : layer === 'q' ? QBY[other] : EBY[other]);
  const choice = ou ? 'Path choice: you get this or ' + ou.name + ', not both. Buying one closes the other' + (layer === 's' ? ' (Reshape the tree to switch).' : '.') : '';
  return { name: u.name, label: n.type === 'root' ? 'The root' : (ou ? 'Path choice · ' : n.dyn && !n.big ? 'Endless growth · ' : 'Notable · ') + (br ? br.name : ''), desc: u.desc, eff: u.eff, choice };
}
const BR_HUE = [['var(--es)', 'var(--esr)'], ['var(--q)', 'var(--qr)'], ['var(--sh)', 'var(--shr)'], ['var(--ok)', '110,242,180'], ['#f2f5ff', '242,245,255']]; // the Sky path is white
function buildWebView(T, layer, tabId) {
  const W = WEB_DEF[layer];
  const wrap = h('div', { class: 'treeview' });
  const svg = sv('svg', { class: 'treesvg' }), world = sv('g'), gE = sv('g'), gN = sv('g');
  world.append(gE, gN); svg.append(world);
  const pType = h('div', { class: 'pb' }), pName = h('div', { class: 'pn' }), pDesc = h('div', { class: 'pd' }), pEff = h('div', { class: 'pe' }), pWhy = h('div', { class: 'pw' }), pCost = h('div', { class: 'pc' }), pFork = h('div', { class: 'pf' });
  const pBuy = h('button', {}, 'Buy');
  const panel = h('div', { class: 'nodepanel' }, pType, pName, pDesc, pFork, pEff, pWhy, pCost, pBuy);
  const isQ = layer === 'q', buyAll = h('button', { class: 'buyall', onclick: () => sfx((isQ ? buyAllUpgrades() : buyAllShards()) ? 'upgrade' : 'fail'), title: veil(isQ ? 'Buy every upgrade you can afford, cheapest first (key U)' : 'Buy every Shard upgrade you can afford, cheapest first; path choices are left to you (key B)') }, 'Buy all');
  const tools = h('div', { class: 'treetools' }, h('button', { onclick: () => zoomBy(1.25) }, '+'), h('button', { onclick: () => zoomBy(0.8) }, '−'), h('button', { onclick: () => fit(true) }, 'Fit'), h('button', { onclick: () => tidy(), title: 'Re-sort the whole web' }, 'Tidy'), layer !== 'e' ? buyAll : '');
  if (layer !== 'e') up(() => show(buyAll, isQ ? wholesaleOn() : shardWholesaleOn()), tabId);
  const hint = h('div', { class: 'treehint' }, 'Drag to move · scroll to zoom · click a node to inspect it · double-click to buy (the whole path if needed)');
  wrap.append(svg, tools, panel, hint);
  T.append(wrap);
  let view = { x: 0, y: 0, k: 0.5 }, anim = null, sel = null, hover = null, fitted = false, builtG = null, els = {}, edgeEls = [], forkEls = [], shown = {}, tweening = false;
  const apply = () => world.setAttribute('transform', `translate(${view.x.toFixed(1)},${view.y.toFixed(1)}) scale(${view.k.toFixed(4)})`);
  function animateTo(v) {
    const start = !anim; anim = v;
    if (!start) return;
    const step = () => {
      if (!anim) return;
      view.x += (anim.x - view.x) * 0.18; view.y += (anim.y - view.y) * 0.18; view.k += (anim.k - view.k) * 0.18; apply();
      if (Math.abs(anim.x - view.x) + Math.abs(anim.y - view.y) + Math.abs(anim.k - view.k) * 300 < 0.6) { view = Object.assign({}, anim); anim = null; apply(); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function fit(smooth) {
    const Wd = wrap.clientWidth, Hd = wrap.clientHeight; if (!Wd) return;
    const G = webGraph(layer); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const id in G.nodes) { if ((dist[id] === undefined ? 99 : dist[id]) > 2) continue; const p = G.pos[id]; x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    if (x0 > x1) { x0 = -200; x1 = 200; y0 = -200; y1 = 200; }
    const k = Math.max(0.15, Math.min(1.25, (Wd - 280) / (x1 - x0 + 160), Hd / (y1 - y0 + 180)));
    const v = { k, x: (Wd - 270) / 2 - (x0 + x1) / 2 * k, y: Hd / 2 - (y0 + y1) / 2 * k };
    if (smooth) animateTo(v); else { view = v; apply(); }
  }
  function zoomBy(f, cx = wrap.clientWidth / 2, cy = wrap.clientHeight / 2) {
    anim = null; const k2 = Math.max(0.12, Math.min(2.5, view.k * f));
    view.x = cx - (cx - view.x) * (k2 / view.k); view.y = cy - (cy - view.y) * (k2 / view.k); view.k = k2; apply();
  }
  function reveal(id) {
    const p = webGraph(layer).pos[id]; if (!p) return;
    const Wd = wrap.clientWidth, Hd = wrap.clientHeight, sx = view.x + p[0] * view.k, sy = view.y + p[1] * view.k;
    if (sx < 60 || sx > Wd - 300 || sy < 60 || sy > Hd - 60) animateTo({ k: view.k, x: (Wd - 270) / 2 - p[0] * view.k, y: Hd / 2 - p[1] * view.k });
  }
  let drag = null;
  const touches = new Map(); let pinch = null;
  svg.addEventListener('pointerdown', e => {
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size === 2) { const [p, q] = [...touches.values()]; pinch = { d: Math.hypot(p[0] - q[0], p[1] - q[1]) || 1, k: view.k, x: view.x, y: view.y, mx: (p[0] + q[0]) / 2, my: (p[1] + q[1]) / 2 }; drag = null; anim = null; return; }
    if (e.button !== 0 || e.target.closest('.tn')) return; anim = null; drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: 0 }; svg.setPointerCapture(e.pointerId); wrap.classList.add('dragging');
  });
  svg.addEventListener('pointermove', e => {
    if (touches.has(e.pointerId)) touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && touches.size >= 2) {
      const [p, q] = [...touches.values()], r = svg.getBoundingClientRect(), k2 = Math.max(0.12, Math.min(2.5, pinch.k * (Math.hypot(p[0] - q[0], p[1] - q[1]) / pinch.d)));
      const cx = pinch.mx - r.left, cy = pinch.my - r.top, mx = (p[0] + q[0]) / 2 - pinch.mx, my = (p[1] + q[1]) / 2 - pinch.my;
      view.k = k2; view.x = cx - (cx - pinch.x) * (k2 / pinch.k) + mx; view.y = cy - (cy - pinch.y) * (k2 / pinch.k) + my; apply(); return;
    }
    if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy)); view.x = drag.vx + dx; view.y = drag.vy + dy; apply(); });
  const endDrag = e => { if (e && touches.has(e.pointerId)) touches.delete(e.pointerId); if (touches.size < 2) pinch = null; if (drag && drag.moved < 4) sel = null; drag = null; wrap.classList.remove('dragging'); };
  svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);
  svg.addEventListener('wheel', e => { e.preventDefault(); const r = svg.getBoundingClientRect(); zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  const buyPath = id => { const path = webPath(layer, id); if (!path || !path.length) return 0; let n = 0; for (const pid of path) { if (!webBuy(layer, pid)) break; n++; } return n; };
  pBuy.addEventListener('click', () => { if (sel) sfx(buyPath(sel) ? 'upgrade' : 'fail'); });
  function placeAll() {
    for (const id in els) { const p = shown[id]; els[id].setAttribute('transform', `translate(${p[0].toFixed(1)},${p[1].toFixed(1)})`); }
    for (const [ln, a, b, arc] of edgeEls) {
      const p = shown[a], q = shown[b]; if (!p || !q) continue;
      if (arc) { const cx = (p[0] + q[0]) * 2, cy = (p[1] + q[1]) * 2; ln.setAttribute('d', `M${p[0].toFixed(1)},${p[1].toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${q[0].toFixed(1)},${q[1].toFixed(1)}`); }
      else ln.setAttribute('d', `M${p[0].toFixed(1)},${p[1].toFixed(1)} L${q[0].toFixed(1)},${q[1].toFixed(1)}`);
    }
    for (const [ln, lb, a, b] of forkEls) {
      const p = shown[a], q = shown[b]; if (!p || !q) continue;
      ln.setAttribute('d', `M${p[0].toFixed(1)},${p[1].toFixed(1)} L${q[0].toFixed(1)},${q[1].toFixed(1)}`);
      lb.setAttribute('transform', `translate(${((p[0] + q[0]) / 2).toFixed(1)},${(Math.min(p[1], q[1]) - 42).toFixed(1)})`); // above the pair, clear of their names
    }
  }
  // Tidy: forget every remembered position and lay the whole web out again (the nodes glide to their new spots)
  function tidy() {
    const P = WEB_POS[layer]; for (const k in P) delete P[k];
    WEB_CACHE[layer] = null;
    sfx('upgrade'); setTimeout(() => fit(true), 900);
  }
  function tween() {
    if (tweening) return; tweening = true;
    const step = () => {
      const G = webGraph(layer); let moving = false;
      for (const id in els) { const s = shown[id], g = G.pos[id]; if (!g) continue; const dx = g[0] - s[0], dy = g[1] - s[1]; if (Math.abs(dx) + Math.abs(dy) > 0.4) { s[0] += dx * 0.12; s[1] += dy * 0.12; moving = true; } else { s[0] = g[0]; s[1] = g[1]; } }
      placeAll();
      if (moving) requestAnimationFrame(step); else tweening = false;
    };
    requestAnimationFrame(step);
  }
  function rebuild(grown) {
    const G = webGraph(layer);
    gE.textContent = ''; gN.textContent = ''; els = {}; edgeEls = []; forkEls = [];
    for (const [a, b, arc] of G.edges) { const ln = sv('path', { class: 'te' + (arc ? ' arc' : '') }); ln.style.setProperty('--ec', BR_HUE[Math.max(0, G.nodes[b].br)] ? `rgba(${BR_HUE[Math.max(0, G.nodes[b].br)][1]},.7)` : 'rgba(200,200,255,.6)'); gE.append(ln); edgeEls.push([ln, a, b, arc]); }
    // path choices: a dashed line between the two sides and a CHOOSE ONE tag between them
    for (const [a, b] of webStatic(layer).forks) {
      const ln = sv('path', { class: 'tfork' }), lb = sv('g', { class: 'tforkl' }), tx = sv('text', { y: 4 });
      tx.textContent = 'CHOOSE ONE'; tx.setAttribute('y', 4); lb.append(sv('rect', { x: -60, y: -12, width: 120, height: 24, rx: 12 }), tx);
      gE.append(ln, lb); forkEls.push([ln, lb, a, b, tx]);
    }
    let i = 0;
    for (const id in G.nodes) {
      const n = G.nodes[id], g = sv('g', { class: 'tn ' + n.type + (n.gen ? ' gen' : '') });
      g.style.setProperty('--bc', n.br < 0 ? '#e7eaff' : BR_HUE[n.br][0]);
      const body = sv('g', { class: 'tbody' }); body.style.animationDelay = (-((i++ * 0.37) % 5)).toFixed(2) + 's';
      const r = n.type === 'root' ? 30 : n.type === 'notable' ? (n.gen ? 13 : 19) : n.type === 'arch' ? 15 : 8;
      const shape = n.type === 'arch' ? sv('polygon', { class: 'tshape', points: `0,${-r} ${r},0 0,${r} ${-r},0` }) : sv('circle', { class: 'tshape', r });
      body.append(shape);
      if (n.type === 'notable' && webForkOther(layer, n.upg)) body.append(sv('circle', { class: 'tforkring', r: r + 8 })); // one side of a path choice
      if (n.type !== 'minor') { body.append(sv('circle', { class: 'tcore', r: n.type === 'root' ? 9 : n.gen ? 3.5 : 5 })); const lbl = sv('text', { class: 'tl', y: r + 16 }); lbl.textContent = webInfo(layer, n).name; body.append(lbl); }
      g.append(body);
      if (grown >= 0 && ((n.type === 'arch' && n.arch >= grown) || (n.connector !== undefined && n.connector >= grown))) g.classList.add('fresh');
      // nodes still in the fog cannot be inspected or bought: you have to get close first
      const hidden = () => g.classList.contains('fog');
      g.addEventListener('click', e => { e.stopPropagation(); if (!hidden()) sel = id; });
      g.addEventListener('dblclick', e => { e.stopPropagation(); if (hidden()) return; sel = id; sfx(buyPath(id) ? 'upgrade' : 'fail'); });
      g.addEventListener('pointerenter', () => { if (!hidden()) hover = id; });
      g.addEventListener('pointerleave', () => { if (hover === id) hover = null; });
      gN.append(g); els[id] = g;
      if (!shown[id]) { const par = (n.type === 'arch' || n.connector !== undefined) ? shown[n.parent] : null; shown[id] = (par || G.pos[id]).slice(); }
    }
    placeAll(); tween();
  }
  let distKey = '', dist = {};
  up(() => {
    const G = webGraph(layer);
    if (builtG !== G) { const grown = builtG && builtG.S === S && G.nArch > builtG.nArch ? builtG.nArch : -1; if (!builtG || builtG.S !== S) shown = {}; rebuild(grown); if (grown >= 0) reveal('a' + (G.nArch - 1)); builtG = G; }
    // hop distance from what you own (drives the fog of the unexplored web)
    const ownedIds = []; for (const id in G.nodes) if (webOwned(layer, G.nodes[id])) ownedIds.push(id);
    const key = ownedIds.join(',') + '|' + G.nArch;
    if (key !== distKey) {
      distKey = key; dist = {}; const q = ownedIds.length ? ownedIds.slice() : [W.root];
      for (const id of q) dist[id] = 0;
      while (q.length) { const id = q.shift(); for (const nb of G.adj[id]) if (!(nb in dist)) { dist[nb] = dist[id] + 1; q.push(nb); } }
      const count = W.branches.map(() => 0); for (const id of ownedIds) { const b = G.nodes[id].br; if (b >= 0) count[b]++; }
      const tot = count.reduce((a, b) => a + b, 0), top = count.indexOf(Math.max(...count));
      wrap.style.setProperty('--tint', tot ? `rgba(${BR_HUE[top][1]},${(0.05 + Math.min(0.12, tot / 300)).toFixed(3)})` : 'rgba(var(--shr),.05)');
    }
    {
      const topY = wrap.getBoundingClientRect().top + scrollY, bar = ($('topbar') || document.body).getBoundingClientRect().bottom;
      const want = Math.max(IS_PHONE ? 300 : 420, Math.round(layer === 'q' ? innerHeight - topY - (IS_PHONE ? 76 : 84) : innerHeight - bar - 60));
      if (Math.abs(want - wrap.clientHeight) > 4) { wrap.style.height = want + 'px'; fitted = false; }
    }
    if (!fitted && wrap.clientWidth) { fit(false); fitted = true; }
    const curLog = S[W.cur].log10(), owned = {};
    for (const id in els) {
      const n = G.nodes[id], g = els[id], o = webOwned(layer, n), av = !o && webAvail(layer, n), d = dist[id] === undefined ? 99 : dist[id];
      owned[id] = o;
      setC(g, 'owned', o); setC(g, 'can', av && curLog >= webCostLog(layer, n)); setC(g, 'avail', av);
      setC(g, 'forked', webForked(layer, n)); setC(g, 'far', !o && !av && d <= 3); setC(g, 'fog', !o && !av && d > 3);
      setC(g, 'sel', sel === id);
    }
    for (const [ln, a, b] of edgeEls) { setC(ln, 'on', !!owned[a] && !!owned[b]); setC(ln, 'fogged', !owned[a] && !owned[b] && (dist[a] > 3 || dist[b] > 3)); }
    for (const [ln, lb, a, b, tx] of forkEls) {
      const done = !!owned[a] || !!owned[b], open = !done && (webAvail(layer, G.nodes[a]) || webAvail(layer, G.nodes[b]));
      for (const el of [ln, lb]) { setC(el, 'done', done); setC(el, 'off', !done && !open); } // only once you can actually choose
      for (const id of [a, b]) if (els[id]) setC(els[id], 'fork-on', done || open);
      setC(lb, 'open', open); setT(tx, done ? 'PATH CHOSEN' : 'CHOOSE ONE');
    }
    if (sel && els[sel] && els[sel].classList.contains('fog')) sel = null; // e.g. after a Reshape the node went back into the fog
    if (hover && els[hover] && els[hover].classList.contains('fog')) hover = null;
    const f = sel || hover, n = f && G.nodes[f];
    show(panel, !!n);
    if (n) {
      const info = webInfo(layer, n), o = webOwned(layer, n), forked = webForked(layer, n);
      setT(pType, info.label); setT(pName, info.name); setT(pDesc, veil(info.desc));
      show(pFork, !!info.choice); if (info.choice) setT(pFork, info.choice);
      show(pEff, !!info.eff); if (info.eff) setT(pEff, 'Currently ' + info.eff());
      show(pWhy, !!info.reason); if (info.reason) setT(pWhy, '“' + info.reason + '”');
      let costTxt, can = false, label = 'Buy';
      if (o) costTxt = 'Owned';
      else if (forked) costTxt = 'Path not taken (the other side of this fork is yours)';
      else {
        const path = webPath(layer, f);
        if (!path) costTxt = n.type === 'arch' ? 'The Architect will offer this once you own what it grows from' : 'Not reachable yet';
        else {
          let tot = D.Z; for (const pid of path) tot = tot.add(D.fromLog(webCostLog(layer, G.nodes[pid])));
          costTxt = (path.length > 1 ? path.length + ' nodes · total ' : 'Cost: ') + fmt(tot) + ' ' + W.curName;
          can = S[W.cur].gte(D.fromLog(webCostLog(layer, G.nodes[path[0]]))) && webAvail(layer, G.nodes[path[0]]);
          label = path.length > 1 ? 'Buy path (' + path.length + ')' : 'Buy';
        }
      }
      setT(pCost, costTxt); show(pBuy, !o && !forked); setT(pBuy, label); setDis(pBuy, !can); setC(pBuy, 'can', can);
    }
  }, tabId);
}
