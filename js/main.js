'use strict';
// Apeiron · main.js: the main loop and start-up.
// The game is a set of classic scripts loaded in order by index.html; they share one global scope.

/* ---------------- Main loop ---------------- */
let paused = false, lastRender = 0, lastSave = Date.now();
function frame() {
  const now = Date.now();
  const dt = (now - S.last) / 1000; S.last = now;
  const inIntro = stageUp(); // the world waits while the Architect talks (not while the stage fades away)
  if (!paused && !inIntro && dt > 0) {
    // a long gap means the game was not running (phone app paused, laptop asleep): beyond a minute it counts like time away
    const run = dt > 60 ? 60 + (S.settings.offline ? (dt - 60) * CFG.offlineRate : 0) : dt;
    if (run > 0.5) simulate(run); else tick(run);
  }
  if (S.settings.tab === 'guide' && dt > 0 && dt < 1) { S.secret.guide += dt; if (S.secret.guide >= 60) grantSecret('x8'); } // an easy one, on purpose
  if (now - lastRender > 90) { render(); lastRender = now; }
  storyTick(now);
  if (S.settings.autosave && now - lastSave > 10000) { save(); lastSave = now; }
}

function init() {
  S = newState();
  let away = 0, storyCatchUp = false;
  try {
    const raw = NOSAVE ? null : localStorage.getItem(SAVE_KEY);
    if (raw) { const savedVer = JSON.parse(raw).ver || 1; S = loadFrom(raw); S.ver = savedVer; away = (Date.now() - S.last) / 1000; if (!JSON.parse(raw).story) storyCatchUp = true; }
  } catch (e) { console.warn('Save could not be loaded', e); S = newState(); }
  // older saves: the highest tier bought is at least the one below the highest seen
  if (S.stats.topTier < 0) S.stats.topTier = Math.max(-1, S.ai.tierSeen - 1, ...S.gens.map((g, i) => g.bought > 0 ? i : -1));
  // the tutorial goes back to the first step you have not actually done (a changed step list once skipped players ahead)
  if (!S.tut.off && S.tut.step < TUT.length) while (S.tut.step > 0 && !TUT[S.tut.step - 1].done()) S.tut.step--;
  buildHeader(); buildNav(); buildGenTab(); buildArchTab(); buildUpgTab(); buildShardTab(); buildAutoTab(); buildAscTab(); buildCardsTab(); buildRelicTab(); buildChalTab(); buildAchTab(); buildStatsTab(); buildGuideTab(); buildOptTab(); buildProgress();
  let welcome = null;
  if (away > 10 && S.settings.offline) {
    const q0 = S.q, s0 = S.shards, e0 = S.essence, c0 = S.stats.totalCollapses, a0 = S.ascensions;
    simulate(away * CFG.offlineRate, 4000);
    const parts = [`Quanta: ${fmt(q0)} → <b class="hl-q">${fmt(S.q)}</b>`];
    if (S.shards.gt(s0) || S.stats.totalCollapses > c0) parts.push(`Shards: ${fmt(s0.floor(), 0)} → <b class="hl-sh">${fmt(S.shards.floor(), 0)}</b> (${S.stats.totalCollapses - c0} collapses)`);
    if (S.ascensions > a0) parts.push(`Essence: ${fmt(e0.floor(), 0)} → <b class="hl-es">${fmt(S.essence.floor(), 0)}</b> (${S.ascensions - a0} ascensions)`);
    welcome = () => modal('Welcome back', h('div', { html: `You were away for <b>${fmtTime(away)}</b>. Time away counts at ${Math.round(CFG.offlineRate * 100)}% speed, so the world moved on by <b>${fmtTime(away * CFG.offlineRate)}</b>.<br><br>` + parts.join('<br>') }), [['Continue', () => true]]);
  }
  // a save from before a big update: say so first, then the welcome back
  const stale = BIG_UPDATES.filter(b => b.v > (S.ver || 1));
  if (stale.length) oldSaveNotice(stale, welcome); else if (welcome) welcome();
  if (away >= 8 * 3600 && !S.settings.offline) grantSecret('x17');
  S.last = Date.now();
  S.ai.lastInput = S.stats.time;
  // older saves: ideas were bought in order; Automata I/II became individual autobuyers
  for (const l of ['q', 's', 'e']) S.forge[l].forEach((u, i) => { if (u.own === undefined) u.own = i < S.proc[l]; });
  if (S.sUpg.s4) { for (const id of ['ab0', 'ab1', 'ab2', 'ab3', 'abC']) S.sUpg[id] = true; delete S.sUpg.s4; }
  if (S.sUpg.s6) { for (const id of ['ab4', 'ab5', 'ab6', 'ab7', 'ab8', 'abL', 'abH', 'abK']) S.sUpg[id] = true; delete S.sUpg.s6; }
  // Quanta ideas became cheaper and weaker: re-value the ones already written; ideas now spread over their branch
  if (S.forgeVer !== FORGE_VER) { for (const u of S.forge.q) u.v = forgeValue('q', u.kind, u.n); for (const l of ['q', 's', 'e']) respreadIdeas(l); S.forgeVer = FORGE_VER; PROC_AGG = {}; }
  attachViz($('say').querySelector('.orb'), 14);
  if (storyCatchUp) {
    let n = 0; for (const c of STORY) if (c.when()) { S.story.seen[c.id] = true; n++; }
    if (n) setTimeout(() => toast('The Architect has ' + n + ' chapter' + (n > 1 ? 's' : '') + ' of the story for you. Hear them in the Architect tab, under Story.', 'es', true), 2500);
  }
  applyUI();
  if (!S.introSeen) playIntro();
  setTab(TABS.some(t => t[0] === S.settings.tab) ? S.settings.tab : 'gen');
  setInterval(frame, 50);
  window.addEventListener('beforeunload', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); }); // phones often close apps without unloading
  // work offline once visited (only on the real site; not on local test servers or the Android app)
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
  startStars(); startSky(); startWind();
}

// Debug / testing hooks
window.UB = {
  get S() { return S; }, D, CFG, genDef, procUpg, buyProc, PROC, tick, simulate, maxAll, buyGen, buyClock, buyQ, buyS, buyE, buyRep, SREP, EREP, QUPG, SUPG, EUPG, CHALS,
  doCollapse, doAscend, startChal, leaveChal, shardGain, essenceGain, chalGoalLog, qpsLog, newState,
  webAutoBuy, webBuy, webGraph, webFrontier, webCostLog, forgeNew, forgeDesc, procAgg, procCost, resStep, thriftMult, genCostLog, pulse, luckyChance, headStartLog, useAbility, ensureOpen,
  pause(v) { paused = v; }, reset() { S = newState(); }, setS(x) { S = x; }, loadFrom, render,
};
init();
