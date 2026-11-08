'use strict';
// Apeiron · ui.js: header, tabs, tutorial and the Generators tab.
// The game is a set of classic scripts loaded in order by index.html; they share one global scope.

/* ---------------- Header ---------------- */
function buildHeader() {
  const hd = $('hdr');
  const qv = h('div', { class: 'v' }), qr = h('div', { class: 'r' });
  const sv = h('div', { class: 'v' }), sr = h('div', { class: 'r' });
  const ev = h('div', { class: 'v' }), er = h('div', { class: 'r' });
  const rq = h('div', { class: 'res q' }, h('div', { class: 'lbl' }, 'Quanta'), qv, qr);
  const rs = h('div', { class: 'res sh' }, h('div', { class: 'lbl' }, 'Shards'), sv, sr);
  const re = h('div', { class: 'res es' }, h('div', { class: 'lbl' }, 'Essence'), ev, er);
  const bcSub = h('small'), baSub = h('small'), bxSub = h('small');
  const bc = h('button', { class: 'btn-big btn-collapse', onclick: () => doCollapse() }, 'Collapse', bcSub);
  UI.el.collapse = bc;
  const ba = h('button', { class: 'btn-big btn-ascend', onclick: () => doAscend() }, 'Ascend', baSub);
  const bx = h('button', { class: 'btn-big btn-chal', onclick: () => leaveChal() }, 'Leave challenge', bxSub);
  hd.append(h('div', { class: 'title' }, h('div', { class: 'orb poke', onclick: poke, title: 'The Architect' }), 'APEIRON'), rq, rs, re, h('div', { class: 'spacer' }), h('div', { class: 'prestige' }, bx, bc, ba));
  up(() => {
    setT(qv, fmt(S.q));
    setT(qr, (R.qps > -Infinity ? '+' + fmt(D.fromLog(R.qps)) : '+0') + ' /s' + (!hasE('e6') && lq() >= CFG.limit - 1e-9 ? '  · at the Limit' : ''));
    show(rs, shardsVisible());
    setT(sv, fmt(S.shards.floor(), 0));
    setT(sr, hasS('s3') ? 'Lattice ' + fmtMult(latticeExp() * S.totalShards.add(1).log10()) : S.collapses + ' collapses');
    show(re, ascVisible());
    setT(ev, fmt(S.essence.floor(), 0));
    setT(er, S.ascensions + ' ascensions');
    show(bc, S.reached.collapse && collapseKnown());
    const cc = canCollapse(); setDis(bc, !cc);
    setT(bcSub, cc ? `+${fmt(R.sg, 0)} Shards` : `need ${fmt(D.fromLog(collapseReqLog()))} Quanta`);
    show(ba, S.reached.limit && ascendKnown());
    const ca = canAscend(); setDis(ba, !ca);
    setT(baSub, ca ? `+${fmt(essenceGain(), 0)} Essence` : `need ${fmt(D.fromLog(CFG.limit))} Quanta`);
    show(bx, S.chal.active >= 0);
    if (S.chal.active >= 0) setT(bxSub, CHALS[S.chal.active].name);
  });
}

/* ---------------- Nav ---------------- */
const TABS = [
  ['gen', 'Generators', () => true, () => false],
  ['upg', 'Upgrades', () => true, () => webCanBuy('q')], // only what you can buy right now,
  ['shard', 'Shards', shardsVisible, () => shardsVisible() && webCanBuy('s')], // not the side of a path choice you left,
  ['asc', 'Ascension', ascVisible, () => ascVisible() && webCanBuy('e')],
  ['cards', 'Fortune', () => cardsOn() || boonOn(), () => !!S.cards.hand || !!S.boon.hand],
  ['relic', 'Relics', () => RELICS.some(r => rewardUnlocked(r.id)) || ANOMALIES.some(a => rewardUnlocked(a.id)), () => RELICS.some(r => rewardUnlocked(r.id) && !hasR(r.id) && lq() >= r.cost)],
  ['auto', 'Automation', autoVisible, () => false],
  ['chal', 'Challenges', () => hasE('e3'), () => false],
  ['arch', 'Architect', () => tutorialDone(), () => false], // its lines show in the speech bubble; no dot on the tab
  ['ach', 'Achievements', () => true, () => false],
  ['stats', 'Statistics', () => true, () => false],
  ['guide', 'Guide', () => true, () => false],
  ['opt', 'Options', () => true, () => false],
];
const TAB_ICONS = { relic: '✶', gen: '◈', arch: '✦', upg: '▲', shard: '◆', auto: '⟳', asc: '✧', cards: '♢', chal: '⚔', ach: '★', stats: '≣', guide: '?', opt: '⚙' };
function setTab(id) {
  if (S.settings.tab !== id) { const now = performance.now(); tabTimes.push(now); while (tabTimes.length && now - tabTimes[0] > 60000) tabTimes.shift(); if (tabTimes.length >= 30) grantSecret('x10'); }
  S.settings.tab = id;
  // the web tabs are the web and nothing else: the page does not scroll there (dragging moves the web instead)
  const web = id === 'upg' || id === 'shard' || id === 'asc'; setC(document.body, 'webtab', web); if (web) scrollTo(0, 0);
  for (const [k, el] of Object.entries(UI.tabs)) setC(el, 'active', k === id);
  for (const [k, b] of Object.entries(UI.navBtns)) setC(b, 'active', k === id);
  if (IS_PHONE && UI.navBtns[id] && UI.navBtns[id].scrollIntoView) UI.navBtns[id].scrollIntoView({ inline: 'center', block: 'nearest' }); // the tab bar scrolls sideways on a phone
  render(true);
}
function buildNav() {
  const nav = $('nav'), main = $('main');
  for (const [id, label, vis, dot] of TABS) {
    const d = h('span', { class: 'dot' });
    const b = h('button', { onclick: () => { sfx('tab'); setTab(id); } }, h('span', { class: 'ico' }, TAB_ICONS[id] || '·'), label, d);
    UI.navBtns[id] = b; nav.append(b);
    UI.tabs[id] = h('section', { class: 'tab' }); main.append(UI.tabs[id]);
    up(() => { show(b, vis()); d.style.visibility = dot() ? 'visible' : 'hidden'; }); // the dot keeps its space, so tabs never change width
  }
}

/* ---------------- Tutorial (narrated by the Architect) ---------------- */
const TUT = [
  { text: 'Welcome. This world runs on <b class="hl-q">Quanta</b>, the blue number at the top, and right now you have none. <b>Pulse</b> is your hand on the machine: each click gives you 1 Quanta. Click it until you have <b>10</b>, enough for your first generator.',
    done: () => S.q.log10() >= genCostLog(0) || tierBought(0) > 0, target: () => UI.el.pulse },
  { text: 'Now buy a <b>Flicker</b>. Flickers make Quanta every second, on their own, forever. That is what this game is about: things that make things.',
    done: () => tierBought(0) > 0, target: () => UI.genRows[0] && UI.genRows[0].btn },
  { text: 'More Flickers means more Quanta, and every <b>10</b> of the same generator multiplies it again (the thin bar under each multiplier). Keep buying until you can afford a <b>Spark</b>.',
    done: () => tierBought(1) > 0, target: () => UI.genRows[1] && UI.genRows[1].btn },
  { text: 'Sparks do not make Quanta. They make <b>Flickers</b>. Every tier makes the tier below it, so a higher tier snowballs everything underneath. Get an <b>Ember</b> next.',
    done: () => tierBought(2) > 0, target: () => UI.genRows[2] && UI.genRows[2].btn },
  { text: '<b>Clock Speed</b> (the top row) speeds up every generator at once. Buy a level when you can afford it.',
    done: () => S.clock > 0 || S.stats.totalCollapses > 0, target: () => UI.el.clock },
  { text: 'Tip: <b>Max all</b> (or the <kbd>M</kbd> key) buys everything you can afford. Keep growing. At <b>1e25</b> Quanta something new opens up.',
    done: () => S.reached.collapse && collapseKnown(), target: () => UI.el.maxAll }, // after the chapter that tells you about it
  { text: 'You can <b class="hl-sh">Collapse</b> now (purple button, top right). It resets your Quanta, generators, Clock Speed and Upgrades, but pays you in <b class="hl-sh">Shards</b>, which you keep. Each Collapse also makes the heavy first world lighter, so the next run goes faster.',
    done: () => S.stats.totalCollapses > 0, target: () => UI.el.collapse },
  { text: 'Spend your Shard in the <b>Shards</b> tab. The first upgrade there, <b>Fracture</b>, makes me start dealing you cards. The Shard upgrades near the middle unlock new things; more power waits further out. From here the loop is: grow, Collapse, upgrade, and each loop goes further.',
    done: () => Object.keys(S.sUpg).length > 0, target: () => UI.navBtns.shard },
  { text: 'One last thing: I will keep inventing new upgrades and new generators for you, and there is no last one. The <b>Guide</b> tab explains everything if you get lost, and once you press Got it, the <b>Architect</b> tab will always show you what to aim for next. Good luck.',
    done: () => false, ack: true },
];
const tutorialDone = () => S.tut.off || S.tut.step >= TUT.length;
// an aside in the middle of the tutorial: the moment you have 20 Quanta (your first upgrade), point at the Upgrades tab
const TUT_UPG = { text: 'You have <b>20 Quanta</b>: enough for your first <b>upgrade</b>. Open the <b>Upgrades</b> tab (it has a dot now) and buy one. I will show you around in there.', target: () => UI.navBtns.upg };
const tutUpgAside = () => !S.tut.upgSeen && S.stats.totalCollapses === 0 && tierBought(0) > 0 && S.q.log10() >= L10(20) - 1e-9;
function tutorialFinished() {
  if (S.ai.said.tutDone) return;
  S.ai.said.tutDone = true;
  aiSay('You know the basics now. I opened the Architect tab for you: it always shows what to aim for next, and everything I have told you.');
}
function buildTutorial(T) {
  const txt = h('div', { class: 'tut-txt' });
  const ok = h('button', { onclick: () => { S.tut.step++; tutorialFinished(); } }, 'Got it');
  const skip = h('button', { class: 'linkish', onclick: () => { S.tut.off = true; tutorialFinished(); } }, 'Skip tutorial');
  const orb = h('div', { class: 'orb poke', onclick: poke, title: 'The Architect' }); attachViz(orb, 12);
  const box = h('div', { class: 'tut' }, orb, h('div', { style: 'flex:1' }, h('div', { class: 'tut-who' }, 'THE ARCHITECT · GUIDE'), txt, h('div', { class: 'tut-btns' }, ok, skip)));
  T.append(box);
  let lastTarget = null, lastStep = -1, tw = null;
  up(() => {
    while (!S.tut.off && S.tut.step < TUT.length && TUT[S.tut.step].done()) S.tut.step++;
    const active = !S.tut.off && S.tut.step < TUT.length, aside = active && tutUpgAside(), st = aside ? TUT_UPG : active && TUT[S.tut.step];
    show(box, active);
    // the Architect only speaks (and points) while you are looking at the Generators tab
    const onGen = S.settings.tab === 'gen' && !stageUp();
    const tg = active && onGen && st.target ? st.target() : null;
    if (tg !== lastTarget) { if (lastTarget) lastTarget.classList.remove('tut-hl'); if (tg) tg.classList.add('tut-hl'); lastTarget = tg; }
    if (!active) { lastStep = -1; return; }
    if (!onGen) { if (tw && !tw.isDone()) tw.finish(); return; } // finish the line silently if you leave mid-sentence
    const stepKey = aside ? 'upg' : S.tut.step;
    if (stepKey !== lastStep) { lastStep = stepKey; if (tw) tw.finish(); tw = typewriter(txt, veil(st.text), { speed: 22, pitch: 1.15, orb }); }
    show(ok, !!st.ack);
  });
}

/* ---------------- Ability buttons ---------------- */
const fmtClock = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function abilityButtons() {
  return Object.entries(ABIL).map(([k, a]) => {
    const b = h('button', { class: 'abil', onclick: act(() => useAbility(k), k === 'surge' ? 'upgrade' : 'buy') });
    up(() => {
      const unl = abilOn(k); show(b, unl); if (!unl) return;
      const now = S.stats.time, ready = abilReady(k), live = (k === 'surge' && surgeActive()) || (k === 'nova' && novaActive());
      let txt, p;
      if (live) { const left = S.abil[k].until - now; txt = a.name + ' · active ' + Math.ceil(left) + 's'; p = left / a.dur(); }
      else if (ready) { txt = a.name + ' · ready'; p = 1; }
      else { const left = S.abil[k].ready - now; txt = a.name + ' · ' + fmtClock(left); p = 1 - left / a.cd(); }
      setT(b, txt); b.style.setProperty('--cd', (Math.max(0, Math.min(1, p)) * 100).toFixed(1) + '%');
      setC(b, 'can', ready); setC(b, 'live', live);
    }, 'gen');
    return b;
  });
}

/* ---------------- Generators tab ---------------- */
function buildGenTab() {
  const T = UI.tabs.gen;
  buildTutorial(T);
  const pv = h('span', { class: 'pv' }, '');
  const pb = h('button', { class: 'pulse', onclick: act(pulse, 'pulse') }, h('span', { class: 'pl' }, 'Pulse'), pv);
  UI.el.pulse = pb;
  const modes = [['1', 'Buy 1'], ['10', 'Buy 10'], ['max', 'Max']].map(([m, l]) => {
    const b = h('button', { onclick: () => { S.settings.buyMode = m; } }, l);
    up(() => setC(b, 'on', S.settings.buyMode === m), 'gen'); return b;
  });
  const ma = h('button', { onclick: act(maxAll), title: IS_PHONE ? 'Buy as much of everything as you can afford.' : 'Buy as much of everything as you can afford (key M).' }, IS_PHONE ? 'Max all' : 'Max all  (M)');
  UI.el.maxAll = ma;
  T.append(h('div', { class: 'toolbar' }, pb, h('div', { class: 'seg', title: 'How much each Buy button buys.' }, modes), ma, ...abilityButtons(), h('span', { class: 'muted' }, 'Each tier makes the tier below it. Every 10 bought multiplies a generator by its Resonance.')));
  const heavy = h('div', { class: 'heavy-note' }); T.append(heavy);
  up(() => { const hl = heavyLog(); show(heavy, hl > 0.01); if (hl > 0.01) setH(heavy, `<b>Heavy world:</b> Sparks and every higher generator make <b>${fmt(D.fromLog(hl))}× less</b> than normal (Flickers are not slowed). ` + (collapseKnown() ? `It gets lighter with every Collapse: after the next one, only <b>${fmt(D.fromLog(hl / 2))}× less</b>.` : 'It will not stay this heavy forever.')); }, 'gen');
  up(() => {
    setT(pv, '+' + fmt(pulseGain()));
    if (pb.classList.contains('cooling') && pulseReady()) { pb.classList.remove('cooling'); pb.classList.remove('ready-flash'); void pb.offsetWidth; pb.classList.add('ready-flash'); }
  }, 'gen');

  // Clock
  const cl = h('div', { class: 'sub' }), ce = h('div', { class: 'mult' }), cs = h('div', { class: 'rate' });
  const cb = h('button', { onclick: act(() => buyClock(S.settings.buyMode === 'max' ? 'max' : '1')) });
  UI.el.clock = cb;
  T.append(h('div', { class: 'row clock' }, h('div', {}, h('div', { class: 'name' }, h('span', { class: 'tier' }, '⏱'), 'Clock Speed'), cl), h('div', {}, ce, cs), h('div', { class: 'rate' }, 'Speeds up every generator.'), cb));
  up(() => {
    setT(cl, 'level ' + S.clock);
    setT(ce, inChal(0) ? 'disabled by Stillness' : fmtMult(clockMultLog()) + ' to all generators');
    setT(cs, '×' + clockBase().toFixed(3).replace(/0$/, '') + ' per level');
    const c0 = clockCostLog(), lm = lq();
    if (S.settings.buyMode === 'max') {
      const n = Math.max(1, clockMax());
      setT(cb, (n > 1 ? `Buy ${n} · ` : 'Buy · ') + fmt(D.fromLog(clockCostLog(n))));
    } else setT(cb, 'Buy · ' + fmt(D.fromLog(c0)));
    setDis(cb, lm < c0); setC(cb, 'can', lm >= c0);
  }, 'gen');

  // Generators: rows are created on demand, because there is no last tier
  const rows = h('div'); T.append(rows);
  UI.genRows = [];
  const makeRow = i => {
    const am = h('div', { class: 'sub' }), bar = h('i'), mu = h('div', { class: 'mult' }), ra = h('div', { class: 'rate' }), nm = h('span');
    const bb = h('button', { onclick: act(() => buyGen(i, S.settings.buyMode)) });
    const row = h('div', { class: 'row' },
      h('div', {}, h('div', { class: 'name' }, h('span', { class: 'tier' }, i + 1), nm), am),
      h('div', {}, mu, h('div', { class: 'bar10' }, bar)), ra, bb);
    row.style.setProperty('--hue', String((195 + i * 47) % 360));
    rows.append(row);
    UI.genRows[i] = { row, btn: bb };
    setT(nm, genDef(i).name);
    up(() => {
      const g = S.gens[i];
      if (!g) { show(row, false); return; }
      const unl = genUnlocked(i);
      show(row, unl || (i > 0 && genUnlocked(i - 1) && !(inChal(1) && i > 3)));
      setC(row, 'locked', !unl);
      setT(am, fmt(g.amt, 0) + '  (' + g.bought + ' bought)');
      const rs = resStep(i);
      setT(mu, fmtMult(tierMultLog(i, R.gl)) + '  · next ×' + R.res.toFixed(2) + ' in ' + (rs - g.bought % rs));
      bar.style.width = ((g.bought % rs) / rs * 100) + '%';
      const r = genRateLog(i, R.gl);
      setT(ra, r > -Infinity ? '+' + fmt(D.fromLog(r)) + (i === 0 ? ' Quanta/s' : ' ' + plural(genDef(i - 1).name) + '/s') : (i === 0 ? 'makes Quanta' : 'makes ' + plural(genDef(i - 1).name)));
      if (!unl) { setT(bb, 'Requires a ' + genDef(i - 1).name); setDis(bb, true); setC(bb, 'can', false); return; }
      const c0 = genCostLog(i), lm = lq(), m = S.settings.buyMode;
      let n = m === 'max' ? genMax(i) : m === '10' ? 10 : 1;
      if (n < 1) n = 1;
      const cost = genCostLog(i, n), need = m === '10' ? cost : c0;
      setT(bb, (n > 1 ? 'Buy ' + n + ' · ' : 'Buy · ') + fmt(D.fromLog(cost)));
      setDis(bb, lm < need); setC(bb, 'can', lm >= need);
    }, 'gen');
  };
  up(() => { while (UI.genRows.length < S.gens.length) makeRow(UI.genRows.length); });


}
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
