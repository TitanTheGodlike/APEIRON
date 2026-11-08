'use strict';
// Apeiron · content.js: every upgrade, achievement, challenge and repeatable.
// The game is a set of classic scripts loaded in order by index.html; they share one global scope.

/* =====================================================================
   CONTENT
   ===================================================================== */
const CFG = {
  cascadeLog: 0,      // log10 of how fast tier N makes tier N-1
  heavy: 0.8,         // the first world is heavy: tiers make each other 10^0.8 slower until you Collapse (halves with every Collapse)
  collapseReq: 25,    // log10 Quanta needed to Collapse
  shardDiv: 40,       // shards = 10^((logQ - req)/div) * mult (40: the middle game was slowed twice)
  limit: 308,         // The Limit
  ascDiv: 70,         // essence beyond the limit = 10^((logQ - 308)/div) * mult
  inspireSec: 60,     // Inspiration: x10 Quanta production for every this many seconds spent past the Limit in this Ascension
  damp: 0.82,         // past the Limit every order of magnitude is harder: the part above 1e308 is raised to this power
  clock0: 1.7,        // log10 first Clock Speed cost (50)
  offlineRate: 0.1,   // time away (game closed, or a paused phone app) counts at 10% speed
  keeperCd: 5,        // seconds between purchases of each Upgrade-web keeper (Lightkeeper, Harmonist, Cascader)
  clockScale: 12,     // Clock cost growth doubles every 12 levels
  genScale: 60,       // generator cost growth doubles every 60 bought
  clockBase: 1.1,
  resBase: 1.75,
};

/* Generators never run out: the first eight are hand-tuned, every tier after that
   is generated (each costs more and scales faster than the one before). */
const GEN_FIRST = [
  { name: 'Flicker', base: 1, step: 0.30 },
  { name: 'Spark', base: 1.7, step: 0.40 },
  { name: 'Ember', base: 4.5, step: 0.60 },
  { name: 'Flame', base: 7, step: 0.70 },
  { name: 'Flare', base: 10, step: 0.90 },
  { name: 'Blaze', base: 14, step: 1.10 },
  { name: 'Bonfire', base: 19, step: 1.30 },
  { name: 'Inferno', base: 25, step: 1.50 },
];
// the names climb slowly: small lights, then fires, then stars, then the sky itself
const GEN_NAMES = ['Flicker', 'Spark', 'Ember', 'Flame', 'Flare', 'Blaze', 'Bonfire', 'Inferno',
  'Firestorm', 'Sun', 'Giant', 'Pulsar', 'Quasar', 'Nova', 'Nebula', 'Galaxy',
  'Rift', 'Vortex', 'Horizon', 'Aether', 'Eclipse', 'Paradox', 'Monolith', 'Genesis'];
const ROMAN = n => { let s = '', v = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; for (const [a, r] of v) while (n >= a) { s += r; n -= a; } return s; };
const GEN_CACHE = [];
function genDef(i) {
  if (GEN_CACHE[i]) return GEN_CACHE[i];
  let d;
  if (i < GEN_FIRST.length) d = GEN_FIRST[i];
  else {
    const j = i - 7; // 1 for the 9th tier
    d = { name: i < GEN_NAMES.length ? GEN_NAMES[i] : aiTierName(i), base: 25 + 15 * j + 2.5 * j * j, step: 2 + 0.25 * j };
  }
  return (GEN_CACHE[i] = d);
}
const newGen = () => ({ amt: D.Z, bought: 0 });
// Vortexes, Galaxies, Geneses; with an epithet the first word takes the plural (Velariths of Many Suns)
const plural = n => { const m = n.match(/^(\S+)( (?:the|of|Who|Beyond) .*)$/); if (m) return plural(m[1]) + m[2].replace(/ Who Waits$/, ' Who Wait');
  return /is$/.test(n) ? n.slice(0, -2) + 'es' : /(s|x|z|ch|sh)$/.test(n) ? n + 'es' : /[^aeiou]y$/.test(n) ? n.slice(0, -1) + 'ies' : n + 's'; };

// Simple upgrades in every web carry their effect as a field: qm (Quanta ×), hi (every tier above Flicker ×),
// shard (Shard gain ×), ess (Essence gain ×), pc (Flickers × per Clock Speed level), all stored as log10;
// res and clock are added to Resonance and the Clock Speed base. fx() writes one from a plain multiplier.
const FIELDS = ['qm', 'hi', 'shard', 'ess', 'pc', 'res', 'clock'], FLOG = { qm: 1, hi: 1, shard: 1, ess: 1, pc: 1 };
const fx = (id, name, cost, k, x) => ({ id, name, cost, [k]: FLOG[k] ? L10(x) : x });
// kx(): an upgrade that works like one of the Architect's ideas (tier = which generator, src = the one it bonds with)
const KLOG = { tier: 1, pulse: 1, idle: 1, head: 1, insight: 1 };
const kx = (id, name, cost, kind, x, tier, src) => { const u = { id, name, cost, kind, v: KLOG[kind] ? L10(x) : x }; if (tier !== undefined) u.tier = tier; if (src !== undefined) u.src = src; return u; };
// cost = log10 of Quanta
const QUPG = [
  { id: 'q1', name: 'Kindling', cost: 2, desc: 'Pulse also grants 1 second of Quanta production.' },
  // Light: production
  { id: 'q2', name: 'Feedback Loop', cost: 3, desc: 'Flickers gain ×(1 + log₁₀ Quanta).', eff: () => '×' + fmt(1 + Math.max(0, lq())) },
  { id: 'q17', name: 'Glow', cost: 6, qm: L10(2), desc: 'Quanta production ×2.' },
  { id: 'q5', name: 'Synergy', cost: 9, desc: 'Quanta production ×(1 + total generators bought / 100).', eff: () => '×' + fmt(1 + totalBought() / 100) },
  { id: 'q18', name: 'Lantern', cost: 14, qm: L10(3), desc: 'Quanta production ×3.' },
  { id: 'q7', name: 'Momentum', cost: 17, desc: 'Quanta production grows with time spent in this Collapse (+×1 every 20s, max ×30).', eff: () => '×' + fmt(momentum()) },
  { id: 'q13', name: 'Hyperflux', cost: 40, desc: 'Flickers ×(log₁₀ Quanta)².', eff: () => '×' + fmt(Math.pow(Math.max(1, lq()), 2)) },
  { id: 'q19', name: 'Prism Glass', cost: 55, qm: L10(5), desc: 'Quanta production ×5.' },
  { id: 'q16', name: 'Lens Array', cost: 80, qm: 1, desc: 'Quanta production ×10.' },
  { id: 'q20', name: 'Corona', cost: 130, desc: 'Quanta production ×(generator tiers unlocked).', eff: () => '×' + fmt(S.gens.length) },
  { id: 'q21', name: 'Sunforge', cost: 220, qm: 2, desc: 'Quanta production ×100.' },
  fx('q32', 'Candlewick', 4, 'qm', 1.22), kx('q33', 'Hearth', 10, 'tier', 2, 0), kx('q34', 'Kiln', 13, 'pulse', 3),
  kx('q35', 'Beacon', 22, 'tier', 2, 1), fx('q37', 'Halo', 26, 'qm', 1.41), kx('q39', 'Daybreak', 28, 'tier', 2, 2),
  kx('q36', 'Afterglow', 30, 'idle', 1.5), kx('q38', 'Gleam', 42, 'lucky', 0.03), kx('q40', 'Lighthouse', 60, 'pulsecd', 0.1),
  kx('q42', 'Starglass', 68, 'tier', 2, 3), kx('q45', 'Incandescence', 75, 'idle', 1.5), kx('q41', 'Solstice', 95, 'flick', 0.05),
  fx('q43', 'Photon Mill', 120, 'qm', 1.73), kx('q46', 'Aurora', 140, 'lucky', 0.03), kx('q44', 'Zenith', 170, 'tier', 3, 4),
  kx('q48', 'High Noon', 190, 'pulse', 5), fx('q47', 'Dawnfire', 280, 'qm', 2.24), kx('q49', 'Second Sun', 400, 'tier', 10, 9),
  fx('q50', 'Endless Day', 650, 'qm', 5.48),
  // Harmony: resonance and clock
  { id: 'q3', name: 'Harmonics', cost: 5, res: 0.07, desc: 'Resonance +0.07 (the multiplier gained for every 10 of a generator bought).' },
  { id: 'q22', name: 'Tuning Fork', cost: 8, clock: 0.006, desc: 'Clock Speed base +0.006.' },
  { id: 'q4', name: 'Overclock', cost: 11, clock: 0.008, desc: 'Clock Speed base +0.008.' },
  { id: 'q9', name: 'Critical Mass', cost: 20, res: 0.08, desc: 'Resonance +0.08.' },
  { id: 'q8', name: 'Starlight Echo', cost: 26, desc: 'Flickers ×1.07 per Clock Speed level.', eff: () => fmtMult(S.clock * L10(1.07)) },
  { id: 'q23', name: 'Chorus', cost: 35, res: 0.03 },
  { id: 'q11', name: 'Event Horizon', cost: 48, clock: 0.008, desc: 'Clock Speed base +0.008.' },
  { id: 'q24', name: 'Overtone Bell', cost: 70, res: 0.03 },
  { id: 'q25', name: 'Escapement', cost: 100, clock: 0.008, desc: 'Clock Speed base +0.008.' },
  { id: 'q26', name: 'Grand Harmony', cost: 150, res: 0.03 },
  fx('q51', 'Metronome', 6, 'res', 0.005), fx('q52', 'Pendulum', 12, 'pc', 1.005), kx('q53', 'Cadence', 15, 'resonate', 1, 0),
  fx('q54', 'Tempo', 24, 'pc', 1.005), kx('q55', 'Refrain', 28, 'thrift', 0.05, 0), kx('q57', 'Counterpoint', 40, 'resonate', 1, 1),
  kx('q58', 'Fugue', 45, 'thrift', 0.05, 1), fx('q56', 'Unison', 50, 'res', 0.005), fx('q59', 'Chime', 75, 'clock', 0.002),
  kx('q64', 'Resonant Hall', 95, 'resonate', 1, 3), kx('q60', 'Octave', 110, 'resonate', 1, 2), fx('q61', 'Carillon', 140, 'pc', 1.007),
  kx('q62', 'Crescendo', 200, 'thrift', 0.05, 2), fx('q63', 'Coda', 260, 'res', 0.005), fx('q65', 'Music of the Spheres', 450, 'res', 0.01),
  fx('q66', 'Perfect Pitch', 700, 'pc', 1.01),
  // Cascade: higher tiers and Shards
  { id: 'q6', name: 'Cascade', cost: 12, hi: L10(2), desc: 'Every generator above Flicker ×2.' },
  { id: 'q10', name: 'Condense', cost: 25, shard: L10(1.5), desc: 'Shard gain ×1.5.' },
  { id: 'q27', name: 'Undertow', cost: 30, hi: L10(1.5), desc: 'Every generator above Flicker ×1.5.' },
  { id: 'q28', name: 'Sediment', cost: 38, shard: L10(1.5), desc: 'Shard gain ×1.5.' },
  { id: 'q12', name: 'Overflow', cost: 45, shard: L10(2.5), desc: 'Shard gain ×2.5.' },
  { id: 'q29', name: 'Deep Current', cost: 60, hi: L10(1.5), desc: 'Every generator above Flicker ×1.5.' },
  { id: 'q30', name: 'Riverbed', cost: 90, shard: L10(1.5), desc: 'Shard gain ×1.5.' },
  { id: 'q14', name: 'Escape Velocity', cost: 110, shard: L10(3), desc: 'Shard gain ×3.' },
  { id: 'q15', name: 'Brink', cost: 160, desc: 'Shard gain ×(log₁₀ Quanta / 100)^2.5.', eff: () => '×' + fmt(Math.pow(Math.max(1, runBestLog() / 100), 2.5)) },
  { id: 'q31', name: 'Torrent', cost: 200, hi: L10(1.5), desc: 'Every generator above Flicker ×1.5.' },
  fx('q67', 'Trickle', 16, 'shard', 1.1), kx('q68', 'Rapids', 20, 'synergy', 0.1, 0, 1), fx('q69', 'Silt', 32, 'shard', 1.1),
  kx('q70', 'Eddy', 42, 'synergy', 0.1, 1, 2), kx('q71', 'Delta', 65, 'head', 10), fx('q72', 'Spillway', 80, 'shard', 1.14),
  kx('q73', 'Whirlpool', 85, 'synergy', 0.1, 2, 3), fx('q75', 'Floodplain', 125, 'shard', 1.14), fx('q74', 'Undercurrent', 130, 'hi', 1.02),
  kx('q76', 'Estuary', 175, 'synergy', 0.12, 3, 4), fx('q77', 'Maelstrom', 240, 'shard', 1.22), kx('q78', 'Tidal Bore', 270, 'tier', 3, 7),
  fx('q79', 'Abyssal Flow', 420, 'shard', 1.41), fx('q80', 'Ocean of Tiers', 680, 'hi', 1.05),
];

// cost = plain number of Shards; auto:true = still works inside Isolation
// The Shard Skill Tree: a root and three branches. Each node needs the one above it;
// at a fork you pick one of two paths (Reshape refunds everything so you can try the other).
const SUPG = [
  { id: 's1', name: 'Fracture', cost: 1, auto: true, desc: 'The root of the tree. The Architect starts dealing you cards: three every ten minutes, keep one (Fortune tab).' },
  // Radiance: raw power
  { id: 'sF', name: 'Forgeworks', cost: 2, auto: true, desc: 'Unlock the Shard repeatables: Shard Forge, Clock Tuning and Prism (the Repeatable button on the Shard web).' },
  { id: 's3', name: 'Crystal Lattice', cost: 2, desc: 'Quanta production ×(1 + Shards earned this Ascension)^0.4.', eff: () => fmtMult(latticeExp() * S.totalShards.add(1).log10()) },
  { id: 's7', name: 'Deep Resonance', cost: 300, desc: 'Resonance +0.15.' },
  { id: 's19', name: 'Focused Light', cost: 1.5e4, desc: 'Flicker, Spark, Ember and Flame ×10 each.' },
  { id: 's20', name: 'Wide Light', cost: 1.5e4, desc: 'Quanta production ×(generator tiers unlocked)².', eff: () => '×' + fmt(Math.pow(S.gens.length, 2)) },
  { id: 's12', name: 'Fold', cost: 4e5, desc: 'Quanta production exponent +0.01.' },
  { id: 's13', name: 'Lattice II', cost: 2e7, desc: 'Crystal Lattice grows faster (^0.4 → ^0.55).' },
  { id: 's14', name: 'Fold II', cost: 2e9, desc: 'Quanta production exponent +0.015.' },
  { id: 's17', name: 'Overtone', cost: 2.5e11, desc: 'Resonance +0.3.' },
  { id: 's16', name: 'Deep Fold', cost: 4e13, desc: 'Quanta production exponent +0.025.' },
  { id: 's18', name: 'Lattice III', cost: 1.3e16, desc: 'Crystal Lattice grows faster again (^0.55 → ^0.7).' },
  { id: 's28', name: 'Starfire', cost: 5e18, desc: 'Quanta production ×10,000.' },
  // Clockwork: speed and automation
  { id: 'sB', name: 'Wholesale', cost: 2, auto: true, desc: 'Adds a Buy all button to the Upgrade web (key U): one press buys every upgrade you can afford there, cheapest first.' },
  { id: 's2', name: 'Memory', cost: 1e10, auto: true, desc: 'Keep the Upgrade web (Quanta upgrades) when you Collapse.' },
  { id: 's8', name: 'Gear Down', cost: 500, desc: 'Clock Speed cost grows ×6 per level instead of ×10.' },
  { id: 's21', name: 'Patient Hands', cost: 2.5e4, desc: 'While you have not touched the game for a minute, Quanta production ×100.' },
  { id: 's22', name: 'Busy Hands', cost: 2.5e4, desc: 'Pulse recharges twice as fast, and for 3 seconds after each Pulse, Quanta production ×100.' },
  { id: 'ab0', name: 'Automata I', cost: 3, auto: true, desc: 'An autobuyer for Flickers.' },
  { id: 'ab1', name: 'Automata II', cost: 15, auto: true, desc: 'An autobuyer for Sparks.' },
  { id: 'abC', name: 'Clockmaker', cost: 50, auto: true, desc: 'An autobuyer for Clock Speed.' },
  { id: 'ab2', name: 'Automata III', cost: 60, auto: true, desc: 'An autobuyer for Embers.' },
  { id: 'ab3', name: 'Automata IV', cost: 300, auto: true, desc: 'An autobuyer for Flames.' },
  { id: 'ab4', name: 'Automata V', cost: 2000, auto: true, desc: 'An autobuyer for Flares.' },
  { id: 'abL', name: 'Lightkeeper', cost: 8000, auto: true, desc: 'Automatically buys the cheapest node in the Light branch of the Upgrade web, one every 5 seconds.' },
  { id: 'ab5', name: 'Automata VI', cost: 1.5e4, auto: true, desc: 'An autobuyer for Blazes.' },
  { id: 'abH', name: 'Harmonist', cost: 6e4, auto: true, desc: 'Automatically buys the cheapest node in the Harmony branch of the Upgrade web, one every 5 seconds.' },
  { id: 'ab6', name: 'Automata VII', cost: 1.2e5, auto: true, desc: 'An autobuyer for Bonfires.' },
  { id: 'abK', name: 'Cascader', cost: 4e5, auto: true, desc: 'Automatically buys the cheapest node in the Cascade branch of the Upgrade web, one every 5 seconds.' },
  { id: 'ab7', name: 'Automata VIII', cost: 1e6, auto: true, desc: 'An autobuyer for Infernos.' },
  { id: 'ab8', name: 'Automata IX', cost: 2e7, auto: true, desc: 'An autobuyer for Firestorms. Every Automata you own adds the next one, for the next generator.' },
  { id: 's11', name: 'Starseed', cost: 6e6, auto: true, desc: 'Start every Collapse with 1e6 Quanta.' },
  { id: 's9', name: 'Self-Collapse', cost: 5e6, auto: true, desc: 'Unlock Auto-Collapse.' },
  { id: 's27', name: 'Overclock III', cost: 2.6e12, desc: 'Clock Speed base +0.03.' },
  { id: 's15', name: 'Refraction', cost: 6e14, desc: 'Quanta production ×1,000.' },
  // Echoes: the Shard economy and active abilities
  { id: 's5', name: 'Shard Visions', cost: 5, auto: true, desc: 'The Architect starts inventing Shard ideas: new diamond nodes that grow in this web.' },
  { id: 's25', name: 'Surge', cost: 1000, desc: 'Unlock the Surge ability (key S): Quanta production ×1,000 for 30 seconds, recharges in 5 minutes.' },
  { id: 's23', name: 'Hoarder', cost: 5e4, desc: 'Shard gain ×5, but Collapsing needs 1e30 Quanta.' },
  { id: 's24', name: 'Spender', cost: 5e4, desc: 'Quanta production ×1.3 for every Shard upgrade you own.', eff: () => fmtMult(Object.keys(S.sUpg).length * L10(1.3)) },
  { id: 's10', name: 'Echoing Shards', cost: 2e6, desc: 'Shard gain ×(log₁₀(Collapses + 10))².', eff: () => '×' + fmt(Math.pow(L10(S.collapses + 10), 2)) },
  { id: 's26', name: 'Time Fold', cost: 1e8, desc: 'Unlock the Time Fold ability (key F): instantly gain 10 minutes of Quanta production, recharges in 20 minutes.' },
  { id: 's31', name: 'Echo Chamber', cost: 5e9, desc: 'Shard gain ×(1 + abilities used this Collapse).', eff: () => '×' + fmt(1 + S.run.abil) },
  { id: 's29', name: 'Shard Bloom', cost: 8e11, desc: 'Shard gain ×3.' },
  { id: 's30', name: 'Long Surge', cost: 1.3e14, desc: 'Surge lasts 60 seconds and recharges in 3 minutes.' },
  // more of the simple kind, spread through all three branches
  fx('s32', 'Glint', 25, 'qm', 1.5), kx('s34', 'Facet', 3e7, 'tier', 3, 4), kx('s33', 'Brilliance', 5e7, 'synergy', 0.12, 4, 5),
  fx('s36', 'Clear Lattice', 1e11, 'qm', 2), kx('s35', 'Gemfire', 2e11, 'tier', 4, 6), fx('s38', 'Choir of Light', 2e13, 'res', 0.01),
  kx('s39', 'Crystal Sun', 3e18, 'tier', 8, 9), fx('s37', 'Supernova', 5e20, 'qm', 10),
  kx('s40', 'Mainspring', 6000, 'head', 10), kx('s46', 'Orrery', 3e7, 'thrift', 0.06, 1), kx('s41', 'Escapement Wheel', 1e8, 'insight', 10),
  kx('s44', 'Wound Spring', 2e9, 'head', 10), fx('s42', 'Cog Choir', 3e10, 'res', 0.005), kx('s45', 'Autonomy', 5e10, 'idle', 3),
  kx('s43', 'Perpetual Motion', 1e17, 'thrift', 0.06, 2),
  fx('s47', 'Splinter', 60, 'shard', 1.15), kx('s48', 'Resonant Shards', 3e5, 'surge', 10), fx('s49', 'Shardstorm', 3e8, 'shard', 1.15),
  kx('s50', 'Afterimage', 1e10, 'fold', 0.1), kx('s52', 'Echo Well', 3e11, 'lucky', 0.05), fx('s51', 'Geode', 5e14, 'shard', 1.25),
  kx('s53', 'Crystal Rain', 5e16, 'pulse', 10), fx('s54', 'Shard Sun', 1e19, 'qm', 4),
];
const TREE = [
  { name: 'Radiance', sub: 'raw power', nodes: ['s3', 's7', ['s19', 's20'], 's12', 's13', 's14', 's17', 's16', 's18', 's28'] },
  { name: 'Clockwork', sub: 'speed and automation', nodes: ['s2', 's8', ['s21', 's22'], 's4', 's11', 's6', 's9', 's27', 's15'] },
  { name: 'Echoes', sub: 'Shards and abilities', nodes: ['s5', 's25', ['s23', 's24'], 's10', 's26', 's31', 's29', 's30'] },
];
const SREQ = { s1: [] }, SFORK = {};
for (const br of TREE) br.nodes.forEach((n, i) => {
  const ids = Array.isArray(n) ? n : [n], p = br.nodes[i - 1];
  const prev = i === 0 ? ['s1'] : (Array.isArray(p) ? p : [p]);
  for (const id of ids) { SREQ[id] = prev; if (ids.length > 1) SFORK[id] = ids.find(x => x !== id); }
});
const sReqMet = id => SREQ[id].length === 0 || SREQ[id].some(r => S.sUpg[r]);
const sForkTaken = id => !!(SFORK[id] && S.sUpg[SFORK[id]]);
// Abilities: active skills from the Echoes branch (timers run on game time, so they recharge offline too)
const ABIL = {
  surge: { name: 'Surge', node: 's25', dur: () => (hasS('s30') ? 60 : 30) + procSum('surge'), cd: () => hasS('s30') ? 180 : 300 },
  fold: { name: 'Time Fold', node: 's26', dur: () => 0, cd: () => 1200 * cdMult('fold') },
  nova: { name: 'Nova', node: 'e43', dur: () => 20, cd: () => hasE('e51') ? 600 : 900 },
};
const abilOn = k => { const n = ABIL[k].node; return n[0] === 'e' ? hasE(n) : hasS(n); };
const novaActive = () => hasE('e43') && S.stats.time < (S.abil.nova.until || 0);
const abilReady = k => S.stats.time >= (S.abil[k].ready || 0);
const surgeActive = () => hasS('s25') && S.stats.time < (S.abil.surge.until || 0);
const busyActive = () => hasS('s22') && S.ai.pulses.length > 0 && S.stats.time - S.ai.pulses[S.ai.pulses.length - 1] <= 3;
const SREP = [
  { id: 'forge', name: 'Shard Forge', desc: 'Quanta production ×2 per level.', c0: 10, r: 6, q: 60, eff: L => fmtMult(L * L10(2)) },
  { id: 'tune', name: 'Clock Tuning', desc: 'Clock Speed base +0.005 per level.', c0: 50, r: 8, q: 40, eff: L => '+' + (0.005 * L).toFixed(3) },
  { id: 'prism', name: 'Prism', desc: 'Shard gain ×1.25 per level.', c0: 100, r: 25, q: 40, eff: L => fmtMult(L * L10(1.25)) },
];

// cost = plain number of Essence
const EUPG = [
  { id: 'e6', name: 'Apeiron', cost: 1, desc: 'Break the Limit: Quanta can grow past 1e308, Essence gain grows with it, and while you are past the Limit the Architect gathers Inspiration (×10 Quanta production every minute, starting over with every Ascension).' },
  { id: 'e1', name: 'Remembrance', cost: 1, desc: 'Keep Shard repeatable levels (Forge, Tuning, Prism) when you Ascend.' },
  { id: 'e2', name: 'Starlight', cost: 2, desc: 'Quanta production ×1,000 × (1 + total Essence)^1.5.', eff: () => fmtMult(3 + 1.5 * S.totalEssence.add(1).log10()) },
  { id: 'e3', name: 'Trials', cost: 3, desc: 'Unlock Challenges.' },
  { id: 'e4', name: 'Bloom', cost: 5, desc: 'Shard gain ×(1 + Ascensions).', eff: () => '×' + fmt(1 + S.ascensions) },
  { id: 'e5', name: 'Perfect Recall', cost: 1e4, desc: 'Keep the whole Shard web when you Ascend: its upgrades, bonus nodes and the Architect’s Shard ideas.' },
  { id: 'e37', name: 'Prism Steward', cost: 1e7, desc: 'Automatically buys the cheapest node in the Radiance branch of the Shard web, one every 5 seconds. Path choices are left to you.' },
  { id: 'e38', name: 'Gear Steward', cost: 1e10, desc: 'Automatically buys the cheapest node in the Clockwork branch of the Shard web, one every 5 seconds. Path choices are left to you.' },
  { id: 'e39', name: 'Echo Steward', cost: 1e13, desc: 'Automatically buys the cheapest node in the Echoes branch of the Shard web, one every 5 seconds. Path choices are left to you.' },
  { id: 'e36', name: 'Overgrowth', cost: 40, desc: 'The webs never end: the outer tips of the Upgrade, Shard and Essence webs keep growing. Every node you buy at a tip sprouts the next one, and the lines keep forking into new branches.' },
  { id: 'e40', name: 'Shard Wholesale', cost: 4, desc: 'Adds a Buy all button to the Shard web (key B): one press buys every Shard upgrade you can afford, cheapest first. It never makes a path choice for you.' },
  { id: 'e35', name: 'Muscle Memory', cost: 2, desc: 'Keep Wholesale, Memory, the Automata, Clockmaker, the three branch keepers, Starseed and Self-Collapse when you Ascend.' },
  { id: 'e7', name: 'Shard Stream', cost: 15, desc: 'Passively gain 10% of your pending Collapse Shards every second.' },
  { id: 'e8', name: 'Self-Ascend', cost: 30, desc: 'Unlock Auto-Ascend.' },
  { id: 'e9', name: 'Transcendence', cost: 75, desc: 'Quanta production exponent +0.02.' },
  { id: 'e10', name: 'Eternal Clock', cost: 200, desc: 'Clock Speed base +0.02.' },
  { id: 'e11', name: 'Harmony', cost: 1000, desc: 'Resonance +0.3.' },
  { id: 'e12', name: 'Recursion', cost: 1e4, desc: 'Essence gain ×(log₁₀(Ascensions + 10))².', eff: () => '×' + fmt(Math.pow(L10(S.ascensions + 10), 2)) },
  { id: 'e13', name: 'Echo of Ages', cost: 40, desc: 'Shard gain ×10.' },
  { id: 'e14', name: 'Distillery', cost: 120, desc: 'Essence gain ×1.5.' },
  { id: 'e15', name: 'Deep Memory', cost: 500, desc: 'Keep the Upgrade web (and the Architect’s Quanta ideas) when you Ascend.' },
  { id: 'e16', name: 'Lumen', cost: 3000, desc: 'Quanta production ×1e6.' },
  { id: 'e17', name: 'Old Light', cost: 2e5, desc: 'Quanta production exponent +0.01.' },
  { id: 'e18', name: 'Shard Rain', cost: 1e5, desc: 'Shard gain ×5.' },
  fx('e19', 'Nebula Glow', 10, 'qm', 10), kx('e22', 'Night Sky', 500, 'tier', 100, 14), kx('e20', 'Daystar', 2e4, 'synergy', 0.3, 14, 15),
  fx('e23', 'Starfall', 1e6, 'shard', 1.73), fx('e21', 'Firmament', 2e6, 'qm', 100), kx('e24', 'Ever-Light', 1e8, 'qexp', 0.005),
  kx('e25', 'Keepsake', 4, 'head', 1000), kx('e29', 'Steady Stream', 60, 'insight', 1000), fx('e26', 'Old Habits', 100, 'shard', 1.41),
  kx('e27', 'Long Memory', 5000, 'thrift', 0.1, 7), fx('e28', 'Archive', 5e5, 'shard', 1.73),
  fx('e30', 'Proving Ground', 8, 'ess', 1.02), fx('e33', 'Gauntlet', 300, 'shard', 1.73), fx('e31', 'Stillwater', 400, 'ess', 1.05),
  kx('e32', 'Crucible', 1e5, 'surge', 20), fx('e34', 'Apotheosis', 1e7, 'ess', 1.07),
  // Wonders, the fourth branch: only unlocks, new things to do rather than more of the same
  { id: 'e41', name: 'Observatory', cost: 3, desc: 'Unlock Boons: with every Ascension I show you three Boons and you choose one. It lasts until your next Ascension (Fortune tab).' },
  { id: 'e45', name: 'Heartbeat', cost: 12, desc: 'Pulse presses itself every 3 seconds, even while you are away (switch it off in Automation).' },
  { id: 'e43', name: 'Nova', cost: 25, desc: 'Unlock the Nova ability (key N): for 20 seconds Quanta production is raised to the power 1.04. Recharges in 15 minutes.' },
  { id: 'e46', name: 'Full House', cost: 50, desc: 'I deal four cards to a hand instead of three, and a new hand comes every 7 minutes instead of 10.' },
  { id: 'e49', name: 'Afterglow', cost: 150, desc: 'Every Collapse starts with one of each of your first ten generators already there (not inside Challenges).' },
  { id: 'e44', name: 'Reflex', cost: 250, desc: 'Surge, Time Fold and Nova fire on their own whenever they are ready (switch it off in Automation).' },
  { id: 'e42', name: 'Twin Stars', cost: 800, desc: 'Boons: I show you four, and you keep two.' },
  { id: 'e47', name: 'Second Hand', cost: 2000, desc: 'Keep two cards from every hand instead of one.' },
  { id: 'e48', name: 'Reliquary', cost: 5000, desc: 'Relics and Anomalies stay through Ascension: no more buying them again.' },
  { id: 'e51', name: 'Supernova', cost: 3e4, desc: 'Nova raises Quanta production to the power 1.06 instead of 1.04, and recharges in 10 minutes.' },
  { id: 'e50', name: 'Wide Sky', cost: 5e5, desc: 'Boons: one more to choose from, and every Boon is half again as strong.' },
  { id: 'e53', name: 'Bright Blue Sky', cost: 1e30, desc: 'The long night is over: full daylight over Apeiron. Quanta production exponent +0.05 and Essence gain ×1,000.' },
  // the Sky: its own white path straight up from Apeiron, the dearest of all, ending in daylight
  { id: 'e54', name: 'Pale Horizon', cost: 1e14, desc: 'The night starts to thin at the edge of the world. Essence gain ×10.' },
  { id: 'e55', name: 'First Light', cost: 1e17, desc: 'Inspiration builds twice as fast: ×10 Quanta production for every 30 seconds past the Limit.' },
  { id: 'e52', name: 'Wind in Your Hair', cost: 1e20, desc: 'A wind starts blowing through Apeiron, and you let it: Quanta production exponent +0.03, and every ability recharges twice as fast. You can see it, too.' },
  { id: 'e56', name: 'Birdsong', cost: 1e23, desc: 'Something out there is singing. Essence gain ×100, and new Boons are twice as strong.' },
  { id: 'e57', name: 'Morning Glow', cost: 1e26, desc: 'The air turns gold. Quanta production exponent +0.04.' },
];
// every field upgrade, per field, with its web; plus plain descriptions for the ones written with fx()
const FU = {};
for (const k of FIELDS) FU[k] = [].concat(QUPG.filter(u => u[k]).map(u => ['q', u]), SUPG.filter(u => u[k]).map(u => ['s', u]), EUPG.filter(u => u[k]).map(u => ['e', u]));
// sums of the grown upgrades' fields, remembered until ownership changes (a new grown upgrade bumps UPG_VER too)
let FSUM_C = null;
const fSum = k => {
  let c = FSUM_C; const iso = isolated();
  if (!c || c.S !== S || c.v !== UPG_VER || c.q !== S.qUpg || c.s !== S.sUpg || c.e !== S.eUpg || c.iso !== iso) c = FSUM_C = { S, v: UPG_VER, q: S.qUpg, s: S.sUpg, e: S.eUpg, iso, m: {} };
  if (k in c.m) return c.m[k];
  let s = 0; for (const [l, u] of FU[k]) if (l === 'q' ? S.qUpg[u.id] : l === 's' ? hasS(u.id) : S.eUpg[u.id]) s += u[k];
  return (c.m[k] = s);
};
const niceX = v => { const x = Math.pow(10, v); return x >= 1e5 && Math.abs(v - Math.round(v)) < 1e-9 ? '1e' + Math.round(v) : x >= 1000 ? Math.round(x).toLocaleString('en-US') : String(+x.toFixed(3)); };
const FIELD_TXT = { qm: 'Quanta production ×', hi: 'Every generator above Flicker ×', shard: 'Shard gain ×', ess: 'Essence gain ×', pc: 'Flickers ×', res: 'Resonance +', clock: 'Clock Speed base +' };
for (const u of [].concat(QUPG, SUPG, EUPG)) if (!u.desc) u.desc = FIELDS.filter(k => u[k]).map(k => FIELD_TXT[k] + (FLOG[k] ? niceX(u[k]) : u[k]) + (k === 'pc' ? ' per Clock Speed level' : '') + '.').join(' ');
const EREP = [
  { id: 'amp', name: 'Amplify', desc: 'Quanta production ×10 per level.', c0: 1, r: 3, q: 100, eff: L => fmtMult(L) },
  { id: 'expo', name: 'Exponent', desc: 'Quanta production exponent +0.005 per level.', c0: 10, r: 10, q: 5, eff: L => '+' + (0.005 * L).toFixed(3) },
  { id: 'magnet', name: 'Shard Magnet', desc: 'Shard gain ×3 per level.', c0: 2, r: 4, q: 60, eff: L => fmtMult(L * L10(3)) },
];

// Challenges are Collapse-level runs with infinitely repeatable completions.
const CHALS = [
  { name: 'Stillness', desc: 'Clock Speed has no effect.', reward: 'Clock Speed base +0.005 per completion.', g0: 25, gs: 12, rw: c => '+' + (0.005 * c).toFixed(3) },
  { name: 'Narrow Band', desc: 'Only Flicker through Flame can be bought.', reward: 'Flicker–Flame ×3 per completion.', g0: 20, gs: 8, rw: c => fmtMult(c * L10(3)) },
  { name: 'Dissonance', desc: 'Resonance is fixed at ×1.', reward: 'Resonance +0.05 per completion.', g0: 25, gs: 12, rw: c => '+' + (0.05 * c).toFixed(2) },
  { name: 'Inflation', desc: 'Generator costs scale twice as fast.', reward: 'Generator cost scaling ×0.97 per completion (down to ×0.6).', g0: 25, gs: 12, rw: c => '×' + Math.max(0.6, Math.pow(0.97, c)).toFixed(3) },
  { name: 'Entropy', desc: 'All production is divided by (1 + seconds in this run / 10).', reward: 'Quanta production ×(1 + completions)³.', g0: 20, gs: 10, rw: c => '×' + fmt(Math.pow(1 + c, 3)) },
  { name: 'Isolation', desc: 'Shard upgrades and Shard repeatables have no effect (automation still works).', reward: 'Shard gain ×2 per completion.', g0: 25, gs: 10, rw: c => fmtMult(c * L10(2)) },
  { name: 'Decay', desc: 'Quanta production exponent ×0.8.', reward: 'Quanta production exponent +0.01 per completion.', g0: 22, gs: 10, rw: c => '+' + (0.01 * c).toFixed(2) },
];

const lq = () => S.q.log10();
const ACH = [
  ['a1', 'First Light', 'Buy a Flicker.', () => tierBought(0) > 0],
  ['a2', 'Sparks Fly', 'Buy a Spark.', () => tierBought(1) > 0],
  ['a3', 'Smoulder', 'Buy an Ember.', () => tierBought(2) > 0],
  ['a4', 'Catching Fire', 'Buy a Flame.', () => tierBought(3) > 0],
  ['a5', 'Flare Up', 'Buy a Flare.', () => tierBought(4) > 0],
  ['a6', 'Ablaze', 'Buy a Blaze.', () => tierBought(5) > 0],
  ['a7', 'Gathering Fire', 'Buy a Bonfire.', () => tierBought(6) > 0],
  ['a8', 'Into the Inferno', 'Buy an Inferno.', () => tierBought(7) > 0],
  ['a9', 'Hundredfold', 'Buy 100 Flickers in one run.', () => tierBought(0) >= 100],
  ['a10', 'Full Spectrum', 'Buy 10 of each of the first eight generators in one run.', () => [0, 1, 2, 3, 4, 5, 6, 7].every(i => tierBought(i) >= 10)],
  ['a37', 'Uncharted', 'Buy a 12th-tier generator.', () => tierBought(11) > 0],
  ['a38', 'Deep Field', 'Buy a 16th-tier generator.', () => tierBought(15) > 0],
  ['a39', 'Far Beyond', 'Buy a 24th-tier generator.', () => tierBought(23) > 0],
  ['a40', 'Endless Ladder', 'Buy a 40th-tier generator.', () => tierBought(39) > 0],
  ['a41', 'Collector', 'Own 25 endless upgrades at once.', () => S.proc.q + S.proc.s + S.proc.e >= 25],
  ['a42', 'Hoarder of Light', 'Own 100 endless upgrades at once.', () => S.proc.q + S.proc.s + S.proc.e >= 100],
  ['a11', 'Millions', 'Reach 1e6 Quanta.', () => lq() >= 6],
  ['a12', 'Trillions', 'Reach 1e12 Quanta.', () => lq() >= 12],
  ['a13', 'Critical', 'Reach 1e25 Quanta.', () => lq() >= 25],
  ['a14', 'Googol', 'Reach 1e100 Quanta.', () => lq() >= 100],
  ['a15', 'The Limit', 'Reach 1e308 Quanta.', () => lq() >= CFG.limit - 1e-9],
  ['a16', 'Past the Edge', 'Reach 1e500 Quanta.', () => lq() >= 500],
  ['a17', 'Thousand Orders', 'Reach 1e1000 Quanta.', () => lq() >= 1000],
  ['a18', 'Beyond Counting', 'Reach 1e10000 Quanta.', () => lq() >= 1e4],
  ['a19', 'Ticking', 'Reach Clock Speed level 10.', () => S.clock >= 10],
  ['a20', 'Overclocked', 'Reach Clock Speed level 50.', () => S.clock >= 50],
  ['a21', 'Timeless', 'Reach Clock Speed level 250.', () => S.clock >= 250],
  ['a22', 'Fracture', 'Collapse for the first time.', () => S.stats.totalCollapses >= 1],
  ['a23', 'Habit', 'Collapse 10 times.', () => S.stats.totalCollapses >= 10],
  ['a24', 'Ritual', 'Collapse 1,000 times.', () => S.stats.totalCollapses >= 1000],
  ['a25', 'Quick Snap', 'Collapse within 30 seconds of starting a run.', null],
  ['a26', 'Purist', 'Collapse without buying any Clock Speed.', null],
  ['a27', 'Shard Hoard', 'Hold 1,000 Shards.', () => S.shards.log10() >= 3],
  ['a28', 'Crystalline', 'Hold 1e10 Shards.', () => S.shards.log10() >= 10],
  ['a29', 'Fully Lit', 'Own every Quanta upgrade at once.', () => QUPG.every(u => u.dyn || S.qUpg[u.id])],
  ['a30', 'Ascendant', 'Ascend for the first time.', () => S.ascensions >= 1],
  ['a31', 'Again and Again', 'Ascend 10 times.', () => S.ascensions >= 10],
  ['a32', 'Unbound', 'Break the Limit.', () => !!S.eUpg.e6],
  ['a33', 'Tested', 'Complete a Challenge.', () => totalComps() >= 1],
  ['a34', 'Trial Master', 'Reach 25 total Challenge completions.', () => totalComps() >= 25],
  ['a35', 'Essence Well', 'Hold 1e6 Essence.', () => S.essence.log10() >= 6],
  ['a36', 'Tap Tap', 'Pulse 100 times.', () => S.stats.pulses >= 100],
  ['a44', 'Dealt In', 'Keep your first card.', () => S.cards.drawn >= 1],
  ['a45', 'Card Sharp', 'Keep 50 cards.', () => S.cards.drawn >= 50],
  ['a46', 'Full Table', 'Have 4 cards working at once.', () => S.cards.active.length >= 4],
  ['a43', 'Legend', 'Keep a Legendary card.', null],
  ['a71', 'High Roller', 'Keep 3 Legendary cards.', () => S.cards.by[3] >= 3],
  ['a72', 'Deck Master', 'Keep 200 cards.', () => S.cards.drawn >= 200],
  ['a47', 'Sixty Rungs', 'Buy a 60th-tier generator.', () => tierBought(59) > 0],
  ['a48', 'Hundredth Rung', 'Buy a 100th-tier generator.', () => tierBought(99) > 0],
  ['a49', 'Unwritten', 'Reach 1e100,000 Quanta.', () => lq() >= 1e5],
  ['a50', 'Apeiron', 'Reach 1e1,000,000 Quanta.', () => lq() >= 1e6],
  ['a51', 'Clockwork Heart', 'Reach Clock Speed level 500.', () => S.clock >= 500],
  ['a52', 'Ever Onward', 'Reach Clock Speed level 1,000.', () => S.clock >= 1000],
  ['a53', 'Centurion', 'Collapse 100 times.', () => S.stats.totalCollapses >= 100],
  ['a54', 'Endless Ritual', 'Collapse 10,000 times.', () => S.stats.totalCollapses >= 1e4],
  ['a55', 'Crystal Cave', 'Hold 1e25 Shards.', () => S.shards.log10() >= 25],
  ['a56', 'Shard Sea', 'Hold 1e50 Shards.', () => S.shards.log10() >= 50],
  ['a57', 'Crystal Sky', 'Hold 1e100 Shards.', () => S.shards.log10() >= 100],
  ['a58', 'Hundredfold Ascent', 'Ascend 100 times.', () => S.ascensions >= 100],
  ['a59', 'Thousand Ascents', 'Ascend 1,000 times.', () => S.ascensions >= 1000],
  ['a60', 'Essence Lake', 'Hold 1e15 Essence.', () => S.essence.log10() >= 15],
  ['a61', 'Essence Ocean', 'Hold 1e30 Essence.', () => S.essence.log10() >= 30],
  ['a62', 'Trial Lord', 'Reach 100 total Challenge completions.', () => totalComps() >= 100],
  ['a63', 'Seasoned', 'Complete every Challenge at least 5 times.', () => S.chal.comps.every(c => c >= 5)],
  ['a64', 'Idea Hoard', 'Own 250 endless upgrades at once.', () => S.proc.q + S.proc.s + S.proc.e >= 250],
  ['a65', 'Library of Babel', 'Own 500 endless upgrades at once.', () => S.proc.q + S.proc.s + S.proc.e >= 500],
  ['a66', 'Web Walker', 'Own 300 web upgrades at once.', () => Object.keys(S.qUpg).length + Object.keys(S.sUpg).length + Object.keys(S.eUpg).length >= 300],
  ['a67', 'Every Star', 'Own every Essence upgrade.', () => EUPG.every(u => u.dyn || S.eUpg[u.id])],
  ['a68', 'A Long Day', 'Play for 24 hours.', () => S.stats.time >= 86400],
  ['a69', 'Hammer', 'Pulse 1,000 times.', () => S.stats.pulses >= 1000],
  ['a70', 'Anvil', 'Pulse 10,000 times.', () => S.stats.pulses >= 1e4],
];
