'use strict';
// Apeiron · tabs.js: the other tabs, the progress bar, input.
// The game is a set of classic scripts loaded in order by index.html; they share one global scope.

/* ---------------- Architect tab: current goal + everything it has said ---------------- */
function buildArchTab() {
  const T = UI.tabs.arch;
  const orb = h('div', { class: 'orb poke', onclick: poke, title: 'The Architect' });
  const goal = h('div', { class: 'tut-txt' });
  T.append(h('h2', {}, 'Current goal'), h('div', { class: 'tut' }, orb, h('div', { style: 'flex:1' }, h('div', { class: 'tut-who' }, 'THE ARCHITECT'), goal)));
  up(() => {
    let s;
    if (S.chal.active >= 0) s = `<b class="hl-bad">Challenge: ${CHALS[S.chal.active].name}</b>. ${CHALS[S.chal.active].desc} Reach <b>${fmt(D.fromLog(chalGoalLog(S.chal.active)))}</b> Quanta to complete it.`;
    else if (!collapseKnown()) s = `Reach <b>${fmt(D.fromLog(collapseReqLog()))}</b> Quanta. Something new waits there.`;
    else if (!S.reached.collapse) s = `At <b>${fmt(D.fromLog(collapseReqLog()))}</b> Quanta you can <b class="hl-sh">Collapse</b> everything into Shards.`;
    else if (!S.reached.limit) s = `Shards grow with Quanta past ${fmt(D.fromLog(collapseReqLog()))}. The next Shard arrives at <b>${fmt(D.fromLog(nextShardAtLog()))}</b> Quanta. Far ahead lies <b class="hl-es">the Limit</b>: ${fmt(D.fromLog(CFG.limit))}.`;
    else if (!ascendKnown()) s = `You reached <b class="hl-es">the Limit</b>: Quanta cannot grow past ${fmt(D.fromLog(CFG.limit))}. Not one Quanta more.`;
    else if (!hasE('e6')) s = `Quanta cannot exceed <b class="hl-es">the Limit</b> (${fmt(D.fromLog(CFG.limit))}). Ascend for Essence and buy <b>Apeiron</b> to break it.`;
    else s = `Past the Limit, Essence gain grows ×10 every ${fmt(D.fromNum(CFG.ascDiv))} orders of magnitude of Quanta, and while you stay past the Limit my Inspiration grows (it starts over with every Ascension). There is no end.`;
    setH(goal, s);
  }, 'arch');
  const mem = h('div', { class: 'memories' }); let memN = -1;
  T.append(h('h2', {}, 'Story'), mem);
  up(() => {
    const seen = STORY.filter(c => S.story.seen[c.id]);
    if (seen.length === memN) return; memN = seen.length; mem.innerHTML = '';
    mem.append(h('button', { onclick: () => playIntro() }, 'I · The Signal'));
    for (const c of seen) mem.append(h('button', { onclick: () => playScene(c, true) }, ROMAN(STORY.indexOf(c) + 2) + ' · ' + c.title));
    if (seen.length < STORY.length) mem.append(h('span', { class: 'muted', style: 'align-self:center;font-size:12px' }, (STORY.length - seen.length) + ' more to come'));
  }, 'arch');
  const box = h('div', { class: 'feed big' });
  T.append(h('h2', {}, 'Transmissions'), box);
  up(() => {
    S.ai.seen = S.ai.total;
    setH(box, S.ai.log.length ? S.ai.log.slice().reverse().map(m => `<div><span class="when">${fmtTime(S.stats.time - m.t)} ago</span> ${esc(m.text)}</div>`).join('') : '<div class="muted">Silent, for now.</div>');
  }, 'arch');
}

/* ---------------- Guide ---------------- */
// live numbers at the end of a Guide section (they used to sit above the Shard and Essence webs)
const guideNow = (title, f) => () => '<div class="guide-now"><b>' + title + '</b> ' + f() + '</div>';
function buildGuideTab() {
  const T = UI.tabs.guide;
  const shardNow = guideNow('Right now:', () => `you have <b class="hl-sh">${fmt(S.shards.floor(), 0)}</b> Shards (${fmt(S.totalShards.floor(), 0)} earned ${ascendKnown() ? 'this Ascension' : 'so far'}, ${S.collapses} Collapses). ` +
    `Collapsing needs ${fmt(D.fromLog(collapseReqLog()))} Quanta and resets Quanta, generators, Clock Speed${hasS('s2') ? '' : ' and Quanta upgrades'}. ` +
    `Shard gain: ×10 every ${CFG.shardDiv} orders of magnitude past the requirement, then ${fmtMult(shardMultLog())} from bonuses. ` +
    `Shards are based on the most Quanta you reached this run: <b>${fmt(D.fromLog(Math.max(0, runBestLog())))}</b>.` + (canCollapse() ? ` Collapsing now gives <b class="hl-sh">${fmt(shardGain(), 0)}</b>.` : ''));
  const ascNow = guideNow('Right now:', () => `you have <b class="hl-es">${fmt(S.essence.floor(), 0)}</b> Essence (${fmt(S.totalEssence.floor(), 0)} total, ${S.ascensions} Ascensions). ` +
    `Ascending needs ${fmt(D.fromLog(CFG.limit))} Quanta and resets ${ascResetText()}.` +
    (hasE('e6') ? ` Inspiration: Quanta production <b>${fmtMult(inspirationLog())}</b> (×10 more for every ${hasE('e55') ? CFG.inspireSec / 2 : CFG.inspireSec} seconds past the Limit). Essence gain: ×10 every ${CFG.ascDiv} orders of magnitude past the Limit${essMultLog() > 0 ? ', then ' + fmtMult(essMultLog()) : ''}.` : ' Each Ascension gives 1 Essence until you break the Limit.'));
  const sections = [
    [() => true, 'Quanta and Pulse', 'Quanta is the main number. <b>Pulse</b> (key P) gives you Quanta by hand and recharges in 1.5 seconds. At first it gives 1 Quanta; Kindling, the first upgrade, makes every Pulse also grant a second of production, and Pulse upgrades, Lucky Pulses and cards make it stronger still, though Pulse boosts soften once a Pulse is worth more than about two recharges of production. It stays worth clicking for your first several Collapses, and whenever a fresh run is getting going.'],
    [() => true, 'Generators', 'Flickers make Quanta every second. Every other generator makes the one below it: Sparks make Flickers, Embers make Sparks, and so on. So a higher tier boosts everything underneath it. There is no last tier: whenever you buy the highest one, a new one appears above it. Your first world is heavy: Sparks and every higher generator make about 6× less than normal (Flickers are not slowed). Every Collapse makes it lighter, until after a few it is gone.'],
    [() => true, 'Resonance', 'Every 10 of a generator you buy multiplies that generator by its Resonance (about ×1.8 at first). Some upgrades make a generator resonate sooner, every 9 bought or fewer. The thin bar under each multiplier shows how close you are to the next 10.'],
    [() => true, 'Clock Speed', 'Multiplies every generator at once. Each level costs more than the last, but it is always worth buying. It starts once you own a Flicker.'],
    [() => true, 'Upgrades', 'The <b>Upgrade web</b> holds hundreds of upgrades paid in Quanta, in three branches: Light (production), Harmony (resonance and clock) and Cascade (higher tiers and Shards). Buy any node next to one you own; big upgrades link straight to each other, and the small bonus nodes between them are detours that some upgrades branch off. Nodes still in the fog cannot be bought yet, and every upgrade costs a bit more than the one before. Until you own Memory (Shard web) the Upgrade web resets when you Collapse; Wholesale (Shard web) adds a <b>Buy all</b> button (key U). A dot on a tab means something there is affordable. <b>Max all</b> (key M) buys as many generators and Clock Speed levels as you can afford.'],
    [() => S.ai.log.length > 0, 'The Architect', 'The game\'s own AI. It talks to you in a speech bubble, writes endless upgrades for every layer (Quanta, Shards, Essence) that grow as diamond nodes in the webs, and names every new generator tier. Each new upgrade is invented when you buy the previous one, shaped by how you play: it builds for your favourite and newest generators, rewards clicking if you click a lot, and rewards idling if you leave the game running.'],
    [shardsVisible, 'Collapse and Shards', 'At 1e25 Quanta you can Collapse: Quanta, generators and Clock Speed reset, and you get Shards. Shards buy upgrades in the <b>Shard tree</b>: start at Fracture, then grow three branches. The first nodes open new things rather than boosting old ones: Fracture starts the Architect’s cards, Forgeworks unlocks the Shard repeatables, Wholesale adds a Buy all button to the Upgrade web and Shard Visions lets the Architect invent Shard ideas. Memory, deeper in Clockwork and expensive, keeps your Upgrade web through Collapses (until then the Upgrade web resets when you Collapse). Shard Wholesale, in the Essence web, adds a Buy all button to the Shard web (key B) that never makes a path choice for you. Radiance is raw power, Clockwork is speed and automation, Echoes is the Shard economy and the active abilities <b>Surge</b> and <b>Time Fold</b>. At each fork you choose one of two paths. <b>Reshape</b> (on the Shard web) refunds every Shard so you can try a different build; the Architect’s diamond nodes stay. More Quanta at the moment you Collapse means more Shards. The Shard repeatables are behind the <b>Repeatable</b> button on the Shard web.', shardNow],
    [autoVisible, 'Automation', 'The Clockwork branch of the Shard web has one autobuyer per generator: Automata I buys Flickers, II buys Sparks, and from Automata IX on every one you own adds the next, so there is always one more. Clockmaker buys Clock Speed; Lightkeeper, Harmonist and Cascader each buy one Upgrade-web node every 5 seconds; Self-Collapse adds Auto-Collapse. Later, the Prism, Gear and Echo Stewards in the Essence web do the same for the Shard web, leaving path choices to you. Configure them all in the Automation tab.'],
    [ascVisible, 'The Limit and Ascension', 'Quanta stops at 1e308, the Limit. There you can Ascend for Essence. At first an Ascension resets everything but Essence: Quanta, generators, the Upgrade web, Shards, the whole Shard web and its repeatables. The <b>Memory</b> branch of the Essence web lets you keep more: Muscle Memory keeps your automation, Perfect Recall the Shard web, Deep Memory the Upgrade web. Essence buys nodes in the <b>Essence web</b>; its root, <b>Apeiron</b>, breaks the Limit for good, so buy it first. Past it, every order of magnitude is a little harder to reach (dampening), but while you are past it the Architect gathers <b>Inspiration</b>: Quanta production ×10 for every minute you spend there, so you never stop moving. It starts over with every Ascension, so each new world has to climb to the Limit on its own first. The Essence web starts at Apeiron and grows five branches: Starlight is raw power, Memory is what you keep and automation, Trials is Shards, Essence and Challenges, Wonders unlocks new things to do, and the white Sky path straight up is the long road to morning. Everything in it is permanent, and Challenge completions are too. Overgrowth, in the Memory branch, makes the outer tips of all three webs keep growing, so there is always another upgrade. The Essence repeatables are behind the <b>Repeatable</b> button on the Essence web.', ascNow],
    [cardsOn, 'Cards', 'Once you buy Fracture, the root of the Shard web, the Architect deals you three cards every ten minutes of play (see the <b>Fortune</b> tab, which also holds your Boons once you have the Observatory). Keep one. Cards are Common, Rare, Epic or Legendary, and each rolls a little stronger or weaker. They give Quanta, speed up every generator, boost your top tier, Pulse, Lucky Pulses, Resonance or idle play for a while, add Shards or Essence to your next prestige, hand you production on the spot, or flip a coin for a big boost.'],
    [() => hasE('e3'), 'Challenges', 'Runs with a handicap. Reach the goal to complete one; every Challenge can be completed again and again with a higher goal and a stronger reward.'],
    [ascVisible, 'Wonders', 'The fourth branch of the Essence web unlocks new things to do. <b>Observatory</b>: with every Ascension you choose a <b>Boon</b> that lasts until the next one (Twin Stars lets you keep two, Wide Sky adds a choice and makes them stronger). <b>Nova</b> is a third ability (key N): Quanta production to the power 1.04 for 20 seconds. <b>Reflex</b> fires your abilities as soon as they are ready, <b>Heartbeat</b> presses Pulse every 3 seconds, <b>Full House</b> and <b>Second Hand</b> improve your cards, <b>Afterglow</b> starts every Collapse with your first ten generators, <b>Reliquary</b> keeps Relics and Anomalies through Ascension. Straight up from Apeiron runs the white <b>Sky</b> path, the dearest of all: Pale Horizon, First Light, <b>Wind in Your Hair</b> (a wind through the whole game), Birdsong, Morning Glow and at the very top <b>Bright Blue Sky</b>, which ends the long night. Watch the sky behind the game: the night fills in as you climb the generator ladder, and the further you get into the Essence web, the closer the day comes.'],
    [() => SECRETS.some(s => S.ach[s.id]), 'Secrets', 'Some achievements are hidden. Each one shows only a hint until you earn it, and each unlocks something special: a <b>Relic</b> (an upgrade in the Relics tab that you buy again after every Ascension) or an <b>Anomaly</b> (a generator in the Relics tab that ignores Collapse; you buy it again after every Ascension, until Reliquary). Pay attention to the hints, and to odd things you might try.'],
    [() => true, 'Appearance', 'Options → Appearance lets you change the color theme, the UI size, and turn the starfield, animations, rainbow generator colors and pop-up notifications on or off.'],
    [() => true, 'Saving','The game saves itself every 10 seconds in this browser and keeps progressing while you are away, at 10% speed. After a big update, an older save gets a one-time notice offering a fresh start; your save keeps working either way. Use Options → Export to make a backup.'],
  ];
  for (const [vis, title, body, live] of sections) {
    const info = h('div', { class: 'info' }), el = h('div', {}, h('h2', {}, title), info);
    let shown = null;
    T.append(el);
    up(() => { const v = vis(); show(el, v); if (!v) return; const html = veilText(body) + (live ? veilText(live()) : ''); if (html !== shown) { shown = html; info.innerHTML = html; } }, 'guide');
  }
}

function upgCard(kind, u, buyFn, owned, can, costText, visible) {
  const e = h('div', { class: 'e' }), c = h('div', { class: 'c' });
  const el = h('div', { class: 'card ' + kind, onclick: () => { if (owned()) { lastSfxAt = performance.now(); return; } sfx(buyFn(u.id) ? 'upgrade' : 'fail'); } }, h('div', { class: 'n' }, u.name), h('div', { class: 'd' }, u.desc), e, c);
  return [el, () => {
    const vis = visible ? visible() : true; show(el, vis); if (!vis) return;
    const o = owned(), k = !o && can();
    setC(el, 'bought', o); setC(el, 'can', k);
    setT(c, o ? 'Owned' : costText());
    show(e, !!u.eff); if (u.eff) setT(e, 'Currently ' + u.eff());
  }];
}
function repCard(kind, def, store, cur, curName) {
  const lv = h('div', { class: 'e' }), c = h('div', { class: 'c' });
  const b1 = h('button', { onclick: act(() => buyRep(def, store, cur, '1'), 'upgrade') }, 'Buy'), bm = h('button', { onclick: act(() => buyRep(def, store, cur, 'max'), 'upgrade') }, 'Max');
  const el = h('div', { class: 'card rep ' + kind }, h('div', { class: 'n' }, def.name), h('div', { class: 'd' }, def.desc), lv, c, h('div', { class: 'btns' }, b1, bm));
  return [el, () => {
    const L = S[store][def.id], cl = repCostLog(def, L), k = S[cur].log10() >= cl;
    setT(lv, 'Level ' + L + ' · ' + def.eff(L));
    setT(c, 'Next: ' + fmt(D.fromLog(cl)) + ' ' + curName);
    setC(el, 'can', k); setDis(b1, !k); setDis(bm, !k);
  }];
}

function buildUpgTab() {
  const T = UI.tabs.upg;
  // the tutorial's walk through the web: shown the first time you open this tab during the tutorial
  const gTxt = h('div', { class: 'tut-txt' }), gOrb = h('div', { class: 'orb poke', onclick: poke, title: 'The Architect' }); attachViz(gOrb, 12);
  const gBox = h('div', { class: 'tut' }, gOrb, h('div', { style: 'flex:1' }, h('div', { class: 'tut-who' }, 'THE ARCHITECT · GUIDE'), gTxt,
    h('div', { class: 'tut-btns' }, h('button', { onclick: () => { S.tut.upgDone = true; } }, 'Got it'))));
  T.append(gBox);
  let gTw = null;
  up(() => {
    if (!S.tut.off && S.tut.step < TUT.length) S.tut.upgSeen = true;
    const on = !S.tut.off && S.tut.upgSeen && !S.tut.upgDone; show(gBox, on);
    if (on && !gTw) gTw = typewriter(gTxt, 'This is the <b>Upgrade web</b>. It grows out from the middle: you can buy any node that touches one you own. <b>Big nodes</b> are the main upgrades, the <b>small ones</b> between them are cheap bonuses, and where two paths split you pick one of them. ' + (IS_PHONE ? '<b>Tap</b> a node to read it and buy it from there (or <b>double-tap</b> it). Drag to look around, pinch to zoom.' : '<b>Click</b> a node to read it, <b>double-click</b> to buy it (and the path to it if needed). Drag to look around, scroll to zoom.'), { speed: 22, pitch: 1.15, orb: gOrb });
  }, 'upg');
  buildWebView(T, 'q', 'upg'); // the web alone, filling the screen: what it all means is in the Guide
}
// the Repeatable cards of a web tab live in a panel over the web, opened from the web's toolbar (the tab does not scroll)
function repPanel(kind, defs, store, cur, curName, tabId, unlocked, lockText) {
  const grid = h('div', { class: 'cards' }), lock = h('div', { class: 'muted' }, lockText || '');
  const panel = h('div', { class: 'reppanel ' + kind }, h('h2', { style: 'margin-top:0' }, 'Repeatable'), lock, grid);
  let open = false;
  const btn = h('button', { class: 'repbtn', onclick: () => { open = !open; render(true); } }, 'Repeatable');
  for (const d of defs) { const [el, fn] = repCard(kind, d, store, cur, curName); grid.append(el); up(fn, tabId); }
  up(() => {
    setC(panel, 'on', open); setC(btn, 'on', open); if (panel.parentElement) setC(panel.parentElement, 'rep-open', open);
    const on = unlocked ? unlocked() : true; show(grid, on); show(lock, !on);
  }, tabId);
  return { btn, panel };
}

// Relics and Anomalies: the rewards of secret achievements, in a tab of their own (the webs get their tabs to themselves)
function buildRelicTab() {
  const T = UI.tabs.relic;
  const relHead = h('h2', {}, 'Relics');
  const relNote = h('div', { class: 'muted', style: 'margin:-4px 0 8px' }, 'Found through secret achievements.');
  up(() => setT(relNote, 'Found through secret achievements.' + (ascendKnown() && !hasE('e48') ? ' A Relic you buy lasts until you Ascend; after that, buy it again.' : '')), 'relic');
  const relGrid = h('div', { class: 'cards' });
  T.append(relHead, relNote, relGrid);
  up(() => { const v = RELICS.some(r => rewardUnlocked(r.id)); show(relHead, v); show(relNote, v); }, 'relic');
  for (const r of RELICS) {
    const [el, fn] = upgCard('es', r, buyRelic, () => hasR(r.id), () => lq() >= r.cost, () => 'Cost: ' + fmt(D.fromLog(r.cost)) + ' Quanta', () => rewardUnlocked(r.id));
    relGrid.append(el); up(fn, 'relic');
  }
  // Anomalies: secret generators unlocked by hidden achievements; they ignore Collapse, not Ascension (unless Reliquary)
  const anomHead = h('h2', {}, 'Anomalies');
  const anomNote = h('div', { class: 'muted', style: 'margin:-4px 0 8px' }, 'Things that should not exist. They ignore Collapse and Ascension.');
  T.append(anomHead, anomNote);
  up(() => { const v = ANOMALIES.some(a => rewardUnlocked(a.id)); show(anomHead, v); show(anomNote, v); if (v) setT(anomNote, !collapseKnown() ? 'Things that should not exist.' : !ascendKnown() ? 'Things that should not exist. They ignore Collapse.' : hasE('e48') ? 'Things that should not exist. They ignore Collapse and Ascension.' : 'Things that should not exist. They ignore Collapse, but after an Ascension you buy them again.'); }, 'relic');
  for (const a of ANOMALIES) {
    const lv = h('div', { class: 'sub' }), ef = h('div', { class: 'mult' }), bb = h('button', { onclick: act(() => buyAnom(a, S.settings.buyMode === 'max' ? 'max' : '1')) });
    const row = h('div', { class: 'row anom' }, h('div', {}, h('div', { class: 'name' }, h('span', { class: 'tier' }, '✶'), a.name), lv), h('div', {}, ef), h('div', { class: 'rate' }, a.desc), bb);
    T.append(row);
    up(() => {
      const unl = rewardUnlocked(a.id); show(row, unl); if (!unl) return;
      const n = anomN(a.id); setT(lv, 'owned ' + n); setT(ef, a.eff(n));
      const c0 = anomCostLog(a), lm = lq();
      const k = S.settings.buyMode === 'max' ? Math.max(1, quadMax(lm, a.base, a.step, a.q, n)) : 1;
      setT(bb, (k > 1 ? 'Buy ' + k + ' · ' : 'Buy · ') + fmt(D.fromLog(anomCostLog(a, k))));
      setDis(bb, lm < c0); setC(bb, 'can', lm >= c0);
    }, 'relic');
  }
}

function buildShardTab() {
  const T = UI.tabs.shard;
  const reshape = h('button', { title: 'Refund every Shard you spent on the tree so you can choose different paths (the Architect’s diamond nodes stay)', onclick: () => modal('Reshape the tree', 'Refund every Shard you spent on the tree so you can choose different paths. Your current run restarts (no Shards are gained or lost).', [['Reshape', () => { if (reshapeTree()) { sfx('collapse'); toast('The tree is bare again. All your Shards are back.', 'sh'); } }], ['Cancel', () => true]]) }, 'Reshape');
  const rp = repPanel('sh', SREP, 'sRep', 'shards', 'Shards', 'shard', srepOn, 'Buy Forgeworks, the first node of the Radiance branch, to unlock the Shard repeatables.');
  const iso = h('div', { class: 'webbanner' }, 'Isolation is active: non-automation Shard upgrades and repeatables are disabled.');
  up(() => show(iso, isolated()), 'shard');
  buildWebView(T, 's', 'shard', { tools: [reshape, rp.btn], panels: [rp.panel, iso] });
}

function buildAutoTab() {
  const T = UI.tabs.auto;
  const chk = (label, get, set, visible) => {
    const cb = h('input', { type: 'checkbox', onchange: () => set(cb.checked) });
    const l = h('label', { class: 'chk' }, cb, label);
    up(() => { show(l, visible()); cb.checked = !!get(); }, 'auto');
    return l;
  };
  const b1 = h('div', { class: 'auto-box' }, h('h2', { style: 'margin-top:0' }, 'Autobuyers'));
  const g = h('div', { class: 'auto-grid' });
  GEN_FIRST.forEach((G, i) => g.append(chk(G.name, () => S.auto.gens[i], v => S.auto.gens[i] = v, () => !!S.sUpg['ab' + i])));
  const hi = h('div', { class: 'auto-grid' }); let hiN = -1;
  up(() => {
    let n = 0; while (S.sUpg['ab' + (8 + n)]) n++;
    if (n === hiN) return; hiN = n; hi.textContent = '';
    for (let i = 8; i < 8 + n; i++) hi.append(chk(genDef(i).name, () => S.auto.gens[i] !== false, v => S.auto.gens[i] = v, () => true));
  }, 'auto');
  g.append(chk('Clock Speed', () => S.auto.clock, v => S.auto.clock = v, () => !!S.sUpg.abC));
  ['Light', 'Harmony', 'Cascade'].forEach((nm, b) => g.append(chk(nm + ' upgrades', () => S.auto.qb[b], v => S.auto.qb[b] = v, () => !!S.sUpg[['abL', 'abH', 'abK'][b]])));
  g.append(chk('Reflex (abilities)', () => S.auto.reflex !== false, v => S.auto.reflex = v, () => hasE('e44')));
  g.append(chk('Heartbeat (Pulse)', () => S.auto.heart !== false, v => S.auto.heart = v, () => hasE('e45')));
  ['Radiance', 'Clockwork', 'Echoes'].forEach((nm, b) => g.append(chk(nm + ' Shard nodes', () => S.auto.sb[b], v => S.auto.sb[b] = v, () => !!S.eUpg[['e37', 'e38', 'e39'][b]])));
  const kn = h('div', { class: 'muted' });
  up(() => {
    const t = S.stats.time, when = n => n > t ? 'in ' + Math.ceil(n - t) + 's' : 'ready';
    const q = ['abL', 'abH', 'abK'].map((id, b) => S.sUpg[id] ? ['Light', 'Harmony', 'Cascade'][b] + ' ' + when(S.auto.qbNext[b]) : '').filter(Boolean);
    const s = ['e37', 'e38', 'e39'].map((id, b) => S.eUpg[id] ? ['Radiance', 'Clockwork', 'Echoes'][b] + ' ' + when(S.auto.sbNext[b]) : '').filter(Boolean);
    setT(kn, [q.length ? 'Next Upgrade-web purchase: ' + q.join(' · ') : '', s.length ? 'Next Shard-web purchase: ' + s.join(' · ') : ''].filter(Boolean).join('   ·   '));
  }, 'auto');
  b1.append(g, hi, h('div', { class: 'muted' }, 'Generator and Clock Speed autobuyers buy the maximum every tick. The Upgrade-web keepers and the Shard-web stewards buy one node, then rest ' + CFG.keeperCd + ' seconds.'), kn);
  T.append(b1);

  // Auto-collapse
  const ac = S => S.auto.collapse;
  const sel = h('select', { onchange: () => { ac(S).mode = sel.value; } },
    h('option', { value: 'gain' }, 'when gain ≥ X Shards'), h('option', { value: 'time' }, 'every X seconds'), h('option', { value: 'mult' }, 'when gain ≥ X × current Shards'));
  const inp = h('input', { type: 'text', onchange: () => { ac(S).val = inp.value.trim(); } });
  const b2 = h('div', { class: 'auto-box' }, h('h2', { style: 'margin-top:0' }, 'Auto-Collapse'),
    h('div', { class: 'opt-row' }, chk('Enabled', () => ac(S).on, v => ac(S).on = v, () => true), sel, inp),
    h('div', { class: 'muted' }, 'Paused while inside a Challenge. Numbers accept scientific notation, e.g. 1e15.'));
  T.append(b2);
  up(() => { show(b2, !!S.sUpg.s9); if (document.activeElement !== sel) sel.value = ac(S).mode; if (document.activeElement !== inp) inp.value = ac(S).val; }, 'auto');

  // Auto-ascend
  const inp2 = h('input', { type: 'text', onchange: () => { S.auto.ascend.val = inp2.value.trim(); } });
  const lbl2 = h('span', { class: 'muted' });
  const b3 = h('div', { class: 'auto-box' }, h('h2', { style: 'margin-top:0' }, 'Auto-Ascend'),
    h('div', { class: 'opt-row' }, chk('Enabled', () => S.auto.ascend.on, v => S.auto.ascend.on = v, () => true), lbl2, inp2));
  T.append(b3);
  up(() => {
    show(b3, !!S.eUpg.e8); show(inp2, hasE('e6'));
    setT(lbl2, hasE('e6') ? 'when Essence gain ≥' : 'Ascends as soon as you reach the Limit.');
    if (document.activeElement !== inp2) inp2.value = S.auto.ascend.val;
  }, 'auto');
}

/* ---------------- Fortune tab (id 'cards'): the hand of cards, what is working now, Boons, your record ---------------- */
function buildCardsTab() {
  const T = UI.tabs.cards;
  const deckTxt = h('div', { class: 'muted', style: 'margin-bottom:12px' }), deckHead = h('h2', {}, 'The Architect’s deck');
  T.append(deckHead, deckTxt);
  up(() => setT(deckTxt, 'Every ' + durTxt(dealEvery()) + ' of play I deal ' + NUMW[handSize()] + ' cards. Keep ' + (hasE('e47') ? 'two' : 'one') + '; the others go back in the deck. Rarer cards roll stronger, and every card rolls a little up or down. Most work for a few minutes of game time, some until your next Collapse' + (ascendKnown() ? ' or Ascension' : '') + '.' + (S.cards.hand && S.cards.kept ? ' Keep one more from this hand.' : '')), 'cards');
  const hand = h('div', { class: 'hand' }), wait = h('div', { class: 'deal-wait' }), waitBar = h('div', { class: 'deal-bar' }, h('i', {}));
  T.append(hand, h('div', {}, wait, waitBar));
  T.append(h('h2', {}, 'Working now'));
  const act = h('div', { class: 'card-active' }); T.append(act);
  // Boons (Observatory): the hand to choose from, and what works this Ascension
  const bHead = h('h2', {}, 'Boons'), bNote = h('div', { class: 'muted', style: 'margin:-2px 0 8px' }), bHand = h('div', { class: 'hand' }), bAct = h('div', { class: 'card-active' });
  T.append(bHead, bNote, bHand, bAct);
  let bKey = null;
  up(() => {
    const on = boonOn(); for (const el of [bHead, bNote, bHand, bAct]) show(el, on); if (!on) return;
    const B = S.boon, key = B.hand ? B.hand.map(b => b.id).join(',') : '';
    setT(bNote, B.hand ? (B.left > 1 ? 'Choose ' + NUMW[B.left] + ' Boons.' : 'Choose a Boon.') + ' It lasts until your next Ascension.' : 'A new hand of Boons comes with every Ascension.');
    if (key !== bKey) {
      bKey = key; bHand.textContent = '';
      if (B.hand) B.hand.forEach((b, i) => { const d = BOON_KINDS[b.k]; bHand.append(h('button', { class: 'pcard legend', style: `animation-delay:${i * 0.12}s`, onclick: act2(() => { if (pickBoon(i)) sfx('upgrade'); }) }, h('div', { class: 'pc-r' }, 'Boon'), h('div', { class: 'pc-g' }, d.g), h('div', { class: 'pc-n' }, b.name), h('div', { class: 'pc-t' }, d.text(b.v)), h('div', { class: 'pc-k' }, 'Choose'))); });
    }
    setH(bAct, B.active.length ? B.active.map(b => `<div class="ca legend"><b>${esc(b.name)}</b> · ${esc(BOON_KINDS[b.k].text(b.v))}</div>`).join('') : '<div class="muted">No Boon working yet.</div>');
  }, 'cards');
  T.append(h('h2', {}, 'Your record'));
  const rec = h('div', { class: 'muted' }); T.append(rec);
  let handKey = '';
  up(() => {
    const C = S.cards, key = C.hand ? C.hand.map(c => c.id).join(',') : '';
    if (key !== handKey) {
      handKey = key; hand.textContent = '';
      if (C.hand) C.hand.forEach((c, i) => {
        const d = CARD_KINDS[c.k], R = RARITY[c.r];
        const el = h('button', { class: 'pcard ' + R.id, style: `animation-delay:${i * 0.12}s`, onclick: act2(() => { if (keepCard(i)) sfx('upgrade'); }) },
          h('div', { class: 'pc-r' }, R.name), h('div', { class: 'pc-g' }, d.g), h('div', { class: 'pc-n' }, c.name), h('div', { class: 'pc-t' }, d.text(c)), h('div', { class: 'pc-k' }, 'Keep'));
        hand.append(el);
      });
    }
    const on = cardsOn(); show(deckHead, on); show(deckTxt, on);
    show(wait, on && !C.hand); show(waitBar, on && !C.hand);
    if (!C.hand) { const left = Math.max(0, C.next - S.stats.time); setT(wait, 'Next hand in ' + fmtTime(left) + '.'); waitBar.firstChild.style.width = (100 * (1 - left / dealEvery())).toFixed(1) + '%'; }
    setH(act, C.active.length ? C.active.map(c => `<div class="ca ${RARITY[c.r].id}"><b>${esc(c.name)}</b> · ${esc(CARD_KINDS[c.k].text(c))}${c.until >= 0 ? ` <span class="muted">(${fmtTime(Math.max(0, c.until - S.stats.time))} left)</span>` : ''}</div>`).join('') : '<div class="muted">Nothing yet. Keep a card to start one.</div>');
    setT(rec, `${C.drawn} cards kept: ${RARITY.map((r, i) => C.by[i] + ' ' + r.name).join(', ')}.`);
  }, 'cards');
}
const act2 = fn => e => { e.stopPropagation(); fn(); };
// what an Ascension wipes right now, given the Memory-branch upgrades you own
function ascResetText() {
  const r = ['Quanta', 'generators', 'Shards'];
  if (!hasE('e48')) r.push('Relics', 'Anomalies');
  if (boonOn()) r.push('Boons');
  if (!hasE('e15')) r.push('the Upgrade web');
  if (!hasE('e5')) r.push(hasE('e35') ? 'the Shard web except its automation' : 'the whole Shard web');
  if (!hasE('e1')) r.push('Shard repeatables');
  return r.slice(0, -1).join(', ') + ' and ' + r[r.length - 1];
}
function buildAscTab() {
  const T = UI.tabs.asc;
  const rp = repPanel('es', EREP, 'eRep', 'essence', 'Essence', 'asc');
  buildWebView(T, 'e', 'asc', { tools: [rp.btn], panels: [rp.panel] });
}

function buildChalTab() {
  const T = UI.tabs.chal;
  T.append(h('div', { class: 'info', html: 'Starting a Challenge performs a Collapse (you keep the Shards). Reach the goal inside it to complete it automatically. Every Challenge can be completed <b>forever</b> — each completion raises the goal and strengthens the reward.' }));
  const grid = h('div', { class: 'chals' }); T.append(grid);
  CHALS.forEach((c, i) => {
    const comp = h('div', { class: 'g' }), goal = h('div', { class: 'g' }), cur = h('div', { class: 'rw' });
    const btn = h('button', { onclick: () => S.chal.active === i ? leaveChal() : startChal(i) });
    const el = h('div', { class: 'chal' }, h('div', { class: 'n' }, c.name), h('div', { class: 'd' }, c.desc), h('div', { class: 'rw' }, 'Reward: ' + c.reward), cur, comp, goal, btn);
    grid.append(el);
    up(() => {
      const a = S.chal.active === i, n = S.chal.comps[i];
      setC(el, 'active', a);
      setT(comp, 'Completions: ' + n);
      setT(cur, 'Current reward: ' + c.rw(n));
      const gl = chalGoalLog(i);
      setT(goal, 'Goal: ' + fmt(D.fromLog(gl)) + ' Quanta' + (!hasE('e6') && gl > CFG.limit ? ' (needs Apeiron)' : ''));
      setT(btn, a ? 'Leave challenge' : 'Start');
    }, 'chal');
  });
}

function buildAchTab() {
  const T = UI.tabs.ach;
  const info = h('div', { class: 'info' }); T.append(info);
  up(() => { const n = Object.keys(S.ach).length; setH(info, `<b>${ACH.filter(a => S.ach[a[0]]).length}</b> / ${ACH.length} achievements and <b>${SECRETS.filter(s => S.ach[s.id]).length}</b> / ${SECRETS.length} secrets — each one multiplies Quanta production by ×1.1 (currently <b class="hl-ok">${fmtMult(achMultLog())}</b>).`); }, 'ach');
  const grid = h('div', { class: 'ach-grid' }); T.append(grid);
  const unknownAch = (id, txt) => !S.ach[id] && ((!collapseKnown() && /Collaps|Shard/.test(txt)) || (!ascendKnown() && /Ascen|Essence|Apeiron|Challenge|past the Limit|Break the Limit/.test(txt)));
  for (const [id, name, desc] of ACH) {
    const nEl = h('div', { class: 'n' }, name), dEl = h('div', {}, desc), el = h('div', { class: 'ach' }, nEl, dEl);
    grid.append(el);
    up(() => { setC(el, 'got', !!S.ach[id]); const hide = unknownAch(id, name + ' ' + desc); setT(nEl, hide ? '???' : name); setT(dEl, hide ? 'Something you have not found yet.' : desc); }, 'ach');
  }
  T.append(h('h2', {}, 'Secret achievements'));
  T.append(h('div', { class: 'muted', style: 'margin:-4px 0 8px' }, 'Some secrets need very specific circumstances. A few can only be done at certain points in a game, and may not be possible without starting a new game.'));
  const sgrid = h('div', { class: 'ach-grid' }); T.append(sgrid);
  for (const s of SECRETS) {
    const n = h('div', { class: 'n' }), d = h('div'), rw = h('div', { class: 'rwd' });
    const el = h('div', { class: 'ach secret' }, n, d, rw);
    sgrid.append(el);
    up(() => {
      const got = !!S.ach[s.id]; setC(el, 'got', got);
      setT(n, got ? s.name : '???');
      setT(d, got ? s.desc : 'Hint: ' + s.hint);
      setT(rw, got ? 'Unlocked ' + (s.reward[0] === 'relic' ? 'Relic: ' + RELBY[s.reward[1]].name : 'Anomaly: ' + ANBY[s.reward[1]].name) : '');
    }, 'ach');
  }
}

function buildStatsGraph(T) {
  const SER = [['best', 'Best Quanta', '--q', []], ['q', 'Quanta now', '--dim', [4, 4]], ['sh', 'Shards', '--sh', []], ['es', 'Essence', '--es', []]];
  const on = { best: true, q: true, sh: true, es: true };
  const css = v => getComputedStyle(document.body).getPropertyValue(v).trim() || '#888';
  const legend = h('div', { class: 'opt-row' });
  for (const [k, label, col, dash] of SER) {
    const sw = h('span', { class: 'gsw' }); const b = h('button', { class: 'gleg on', onclick: () => { on[k] = !on[k]; setC(b, 'on', on[k]); key = ''; } }, sw, label);
    up(() => { sw.style.borderTopColor = css(col); sw.style.borderTopStyle = dash.length ? 'dashed' : 'solid'; show(b, /Shard/.test(label) ? collapseKnown() : /Essence/.test(label) ? ascendKnown() : true); }, 'stats'); legend.append(b); // lines for what you know
  }
  const box = h('div', { class: 'graphbox' }), cv = h('canvas'), tip = h('div', { class: 'gtip' });
  box.append(cv, tip);
  T.append(h('h2', {}, 'Progress over time'), legend, box);
  let key = '', hx = null;
  function draw() {
    const Hh = S.hist, n = Hh.t.length, dpr = window.devicePixelRatio || 1, Wd = box.clientWidth, Hd = 300;
    if (!Wd) return;
    cv.width = Wd * dpr; cv.height = Hd * dpr; cv.style.width = Wd + 'px'; cv.style.height = Hd + 'px';
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, Wd, Hd);
    const L = 58, R = 14, Tp = 14, B = 30, pw = Wd - L - R, ph = Hd - Tp - B;
    g.font = '11px ' + (getComputedStyle(document.body).fontFamily || 'sans-serif');
    if (n < 2) { g.fillStyle = css('--faint'); g.fillText('Play a little longer: a point is recorded every ' + Hh.every + ' seconds.', L, Tp + ph / 2); tip.style.display = 'none'; return; }
    const tMax = Math.max(1, Hh.t[n - 1]);
    let yMax = 10; for (const [k] of SER) if (on[k]) for (const v of Hh[k]) if (v > yMax) yMax = v;
    const stepY = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 1e4, 2e4, 5e4, 1e5].find(s => yMax / s <= 5) || Math.pow(10, Math.ceil(L10(yMax / 5)));
    yMax = Math.ceil(yMax / stepY) * stepY;
    const X = t => L + t / tMax * pw, Y = v => Tp + ph - v / yMax * ph;
    g.strokeStyle = 'rgba(130,160,255,.10)'; g.lineWidth = 1; g.fillStyle = css('--faint'); g.textAlign = 'right';
    for (let v = 0; v <= yMax + 1e-9; v += stepY) { const y = Y(v); g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke(); g.fillText(v === 0 ? '1' : '1e' + v, L - 6, y + 4); }
    const stepT = [60, 300, 600, 1800, 3600, 7200, 14400, 28800, 86400, 172800, 604800].find(s => tMax / s <= 8) || 604800;
    g.textAlign = 'center';
    for (let s = 0; s <= tMax; s += stepT) g.fillText(s < 3600 ? Math.round(s / 60) + 'm' : s < 86400 ? (s / 3600).toFixed(s % 3600 ? 1 : 0) + 'h' : (s / 86400).toFixed(1) + 'd', X(s), Tp + ph + 18);
    for (const [k, , col, dash] of SER) {
      if (!on[k]) continue;
      g.strokeStyle = css(col); g.lineWidth = k === 'best' ? 2 : 1.5; g.setLineDash(dash); g.lineJoin = 'round'; g.beginPath();
      Hh[k].forEach((v, i) => { const x = X(Hh.t[i]), y = Y(v); i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.stroke(); g.setLineDash([]);
    }
    if (hx !== null && hx >= L && hx <= L + pw) {
      const tt = (hx - L) / pw * tMax; let bi = 0; for (let i = 0; i < n; i++) if (Math.abs(Hh.t[i] - tt) < Math.abs(Hh.t[bi] - tt)) bi = i;
      const x = X(Hh.t[bi]); g.strokeStyle = 'rgba(200,210,255,.35)'; g.beginPath(); g.moveTo(x, Tp); g.lineTo(x, Tp + ph); g.stroke();
      tip.innerHTML = '<b>' + fmtTime(Hh.t[bi]) + ' played</b>' + SER.filter(s => on[s[0]]).map(s => `<div>${s[1]}: ${Hh[s[0]][bi] > 0 ? '1e' + Hh[s[0]][bi].toFixed(1) : '0'}</div>`).join('');
      tip.style.display = 'block'; tip.style.left = Math.min(Wd - 170, x + 12) + 'px';
    } else tip.style.display = 'none';
  }
  cv.addEventListener('pointermove', e => { hx = e.offsetX; draw(); });
  cv.addEventListener('pointerdown', e => { hx = e.offsetX; draw(); });
  cv.addEventListener('pointerleave', () => { hx = null; draw(); });
  up(() => { const k = S.hist.t.length + '|' + S.settings.ui.theme + '|' + box.clientWidth + '|' + JSON.stringify(on); if (k !== key) { key = k; draw(); } }, 'stats');
}
function buildStatsTab() {
  const T = UI.tabs.stats;
  buildStatsGraph(T);
  T.append(h('h2', {}, 'Numbers'));
  const tb = h('table', { class: 'stats' }); T.append(tb);
  const rows = [
    ['Time played', () => fmtTime(S.stats.time)],
    ['Time in this Collapse', () => fmtTime(S.stats.tCollapse), collapseKnown],
    ['Time in this Ascension', () => fmtTime(S.stats.tAscend), ascendKnown],
    ['Total Quanta produced', () => fmt(S.stats.totalQ)],
    ['Best Quanta', () => fmt(S.stats.bestQ)],
    ['Quanta production exponent', () => '^' + qExponent().toFixed(3)],
    ['Resonance', () => '×' + resonance().toFixed(2) + ' per 10 bought'],
    ['Total Collapses', () => S.stats.totalCollapses.toLocaleString('en-US'), collapseKnown],
    ['Fastest Collapse', () => fmtTime(S.stats.fastCollapse), collapseKnown],
    ['Ascensions', () => S.ascensions.toLocaleString('en-US'), ascendKnown],
    ['Fastest Ascension', () => fmtTime(S.stats.fastAscend), ascendKnown],
    ['Challenge completions', () => totalComps(), ascendKnown],
    ['Highest generator tier', () => (S.ai.tierSeen + 1) + ' (' + genDef(S.ai.tierSeen).name + ')'],
    ['Architect upgrades owned', () => ascendKnown() ? S.proc.q + ' / ' + S.proc.s + ' / ' + S.proc.e + '  (Quanta / Shards / Essence)' : collapseKnown() ? S.proc.q + ' / ' + S.proc.s + '  (Quanta / Shards)' : String(S.proc.q)],
    ['Pulses', () => S.stats.pulses.toLocaleString('en-US')],
    ['Dampening past the Limit', () => 'production above 1e308 is raised to ^' + DAMP, ascendKnown],
    ['Architect Inspiration', () => S.eUpg.e6 ? fmtMult(inspirationLog()) + ' Quanta production' : 'not yet (break the Limit)', ascendKnown],
  ];
  for (const [k, f, vis] of rows) { const v = h('td'), tr = h('tr', {}, h('td', {}, k), v); tb.append(tr); up(() => { const on = !vis || vis(); show(tr, on); if (on) setT(v, String(f())); }, 'stats'); }
}

function buildOptTab() {
  const T = UI.tabs.opt;
  const sel = h('select', { onchange: () => { S.settings.notation = sel.value; } },
    h('option', { value: 'sci' }, 'Scientific (1.23e45)'), h('option', { value: 'eng' }, 'Engineering (12.3e45)'),
    h('option', { value: 'std' }, 'Standard (1.23 QaDc)'), h('option', { value: 'log' }, 'Logarithm (e45.09)'));
  up(() => { if (document.activeElement !== sel) sel.value = S.settings.notation; }, 'opt');
  const chk = (label, key) => { const cb = h('input', { type: 'checkbox', onchange: () => { S.settings[key] = cb.checked; } }); up(() => { cb.checked = !!S.settings[key]; }, 'opt'); return h('label', { class: 'chk' }, cb, label); };
  const vol = h('input', { type: 'range', min: '0', max: '1', step: '0.05', oninput: () => { S.settings.volume = +vol.value; } });
  const sfxVol = h('input', { type: 'range', min: '0', max: '1', step: '0.05', oninput: () => { S.settings.sfxVol = +sfxVol.value; } });
  up(() => { if (document.activeElement !== sfxVol) sfxVol.value = S.settings.sfxVol; }, 'opt');
  up(() => { if (document.activeElement !== vol) vol.value = S.settings.volume; }, 'opt');
  T.append(h('h2', {}, 'Display'), h('div', { class: 'opt-row' }, h('span', {}, 'Notation'), sel));
  const ui = S => S.settings.ui;
  const uchk = (label, key) => { const cb = h('input', { type: 'checkbox', onchange: () => { ui(S)[key] = cb.checked; applyUI(); } }); up(() => { cb.checked = !!ui(S)[key]; }, 'opt'); return h('label', { class: 'chk' }, cb, label); };
  const theme = h('select', { onchange: () => { ui(S).theme = theme.value; applyUI(); RECENT.themes = (RECENT.themes || []).filter(x => performance.now() - x.t <= 10000).concat({ v: theme.value, t: performance.now() }); if (new Set(RECENT.themes.map(x => x.v)).size >= 6) grantSecret('x13'); } },
    ...[['nebula', 'Nebula'], ['ember', 'Ember'], ['verdant', 'Verdant'], ['abyss', 'Abyss'], ['rose', 'Rose'], ['mono', 'Monochrome']].map(([v, l]) => h('option', { value: v }, l)));
  const scale = h('input', { type: 'range', min: '0.8', max: '1.3', step: '0.05', oninput: () => { ui(S).scale = +scale.value; applyUI(); } });
  const scaleLbl = h('span', { class: 'muted' });
  up(() => { if (document.activeElement !== theme) theme.value = ui(S).theme; if (document.activeElement !== scale) scale.value = ui(S).scale; setT(scaleLbl, Math.round(ui(S).scale * 100) + '%'); }, 'opt');
  T.append(h('h2', {}, 'Appearance'),
    h('div', { class: 'opt-row' }, h('span', {}, 'Theme'), theme, h('span', {}, 'UI size'), scale, scaleLbl),
    h('div', { class: 'opt-row' }, uchk('Starfield', 'stars'), uchk('Sky effects', 'sky'), uchk('Animations', 'motion'), uchk('Compact rows', 'compact'), uchk('Rainbow generator colors', 'tint'), uchk('Pop-up notifications', 'toasts')));
  T.append(h('h2', {}, 'Sound and story'), h('div', { class: 'opt-row' }, chk('Architect voice', 'sound'), h('span', {}, 'Volume'), vol, h('button', { onclick: () => { blip(1.15); } }, 'Test')),
    h('div', { class: 'opt-row' }, chk('UI sounds', 'sfx'), h('span', {}, 'Volume'), sfxVol, h('button', { onclick: () => { sfx('upgrade'); } }, 'Test'), h('button', { onclick: playIntro }, 'Replay intro'), h('button', { onclick: () => { S.tut = { step: 0, off: false }; setTab('gen'); } }, 'Restart tutorial')));
  T.append(h('h2', {}, 'Saving'),
    h('div', { class: 'opt-row' }, chk('Autosave every 10s', 'autosave'), chk('Offline progress', 'offline')),
    h('div', { class: 'opt-row' },
      h('button', { onclick: () => { save(); toast('Game saved.'); } }, 'Save now'),
      h('button', { onclick: exportDialog }, 'Export'),
      h('button', { onclick: importDialog }, 'Import'),
      h('button', { onclick: resetDialog, style: 'border-color:var(--bad);color:var(--bad)' }, 'Hard reset')));
  // Bug report: a new issue on the game's GitHub page, with a short template and where you are in the game (no save data)
  const bug = h('a', { class: 'btnlink', target: '_blank', rel: 'noopener noreferrer', href: ISSUES_URL }, 'Report a bug');
  up(() => { bug.href = bugReportUrl(); }, 'opt');
  T.append(h('h2', {}, 'Help'), h('div', { class: 'opt-row' }, bug, h('span', { class: 'muted' }, 'Opens the Issues page of Apeiron on GitHub with a short form to fill in. Posting needs a free GitHub account.')));
  const hot = h('div', { class: 'info' }), hotH = h('h2', {}, 'Hotkeys'); T.append(hotH, hot);
  if (IS_PHONE) { show(hotH, false); show(hot, false); } // no keyboard on a phone
  up(() => { const k = [['M', 'max all'], ['T', 'buy Clock Speed'], ['P', 'pulse']].concat(collapseKnown() ? [['C', 'collapse'], ['S', 'Surge'], ['F', 'Time Fold'], ['U', 'buy all upgrades'], ['B', 'buy all Shard upgrades']] : [], ascendKnown() ? [['A', 'ascend'], ['N', 'Nova']] : []);
    setH(hot, k.map(([a, b]) => `<kbd>${a}</kbd> ${b}`).join(' &nbsp; ')); }, 'opt');
  T.append(h('h2', {}, 'About'), h('div', { class: 'info', html: '<b>Apeiron</b> (Greek: the boundless) — an infinite incremental. Numbers are stored as mantissa × 10<sup>exponent</sup>, so they can grow far past 1e308 (to about 10<sup>10<sup>308</sup></sup>). Saves live in this browser\'s local storage; export to keep a backup.' }));
}
const ISSUES_URL = 'https://github.com/TitanTheGodlike/APEIRON/issues/new';
function bugReportUrl() {
  const where = location.protocol === 'file:' ? 'Android app' : 'website';
  const body = '**What happened?**\n\n\n**What did you expect instead?**\n\n\n**How can it be made to happen again?**\n\n\n---\n' +
    'Played on: ' + where + ' · save version ' + SAVE_VER + ' · ' + S.stats.totalCollapses + ' Collapses, ' + S.ascensions + ' Ascensions, best Quanta ' + fmt(S.stats.bestQ);
  return ISSUES_URL + '?title=' + encodeURIComponent('Bug: ') + '&body=' + encodeURIComponent(body);
}
function exportDialog() {
  const ta = h('textarea', { readonly: '' }); ta.value = encodeSave();
  modal('Export save', ta, [['Copy', () => { ta.select(); navigator.clipboard?.writeText(ta.value).catch(() => { }); toast('Save copied.'); return false; }], ['Close', () => true]]);
  setTimeout(() => ta.select(), 30);
}
function importDialog() {
  const ta = h('textarea', { placeholder: 'Paste an exported save here' });
  modal('Import save', ta, [['Import', () => {
    try { const ns = decodeSave(ta.value); S = ns; S.last = Date.now(); S.ai.lastInput = S.stats.time; applyUI(); save(); setTab(S.settings.tab); toast('Save imported.'); }
    catch (e) { toast('That save could not be read.', 'bad'); return false; }
  }], ['Cancel', () => true]]);
}
function resetDialog() {
  modal('Hard reset', 'This wipes your save completely. There is no undo.', [['Wipe everything', () => hardWipe(false)], ['Cancel', () => true]]);
}

/* ---------------- Progress bar ---------------- */
function buildProgress() {
  const fill = $('pfill'), txt = $('ptxt');
  up(() => {
    const L = Math.max(0, lq());
    let goal, label;
    if (S.chal.active >= 0) { goal = chalGoalLog(S.chal.active); label = CHALS[S.chal.active].name + ' goal'; }
    else if (L < collapseReqLog()) { goal = collapseReqLog(); label = collapseKnown() ? 'Collapse' : 'something new'; }
    else if (!hasE('e6')) { goal = CFG.limit; label = 'the Limit'; }
    else { const k = Math.floor((L - CFG.limit) / CFG.ascDiv) + 1; goal = CFG.limit + k * CFG.ascDiv; label = 'next ×10 Essence'; }
    const p = Math.max(0, Math.min(1, L / goal));
    fill.style.width = (p * 100).toFixed(2) + '%';
    setT(txt, `${(p * 100).toFixed(1)}% to ${label} (${fmt(D.fromLog(goal))} Quanta)`);
  });
}

/* ---------------- Render ---------------- */
function render(force) {
  R = { gl: globalMultLog(), res: resonance() };
  R.qps = qpsLog(R.gl); R.sg = shardGain();
  const tab = S.settings.tab;
  for (const [fn, t] of UI.ups) if (!t || t === tab) fn();
}

/* ---------------- Input ---------------- */
// the old code: the Architect notices, and wants an explanation
function cheatCodeEntered() {
  if (!S.stats.totalCollapses && !S.ascensions) return; // the world is too young to have back doors: nothing happens before the first Collapse
  if (S.ach.x12) { aiSay(rnd(['Again? I told you, there are no codes in my world.', 'I heard that. Ten keys, in order.', 'Still knocking on that door?'])); return; }
  blip(1.2); setTimeout(() => blip(0.9), 140);
  const after = () => { aiSay('There are no cheat codes in my world. But I like that you went looking for one. Keep this. Tell no one.'); grantSecret('x12'); };
  modal('The Architect', h('div', {}, h('div', { class: 'orb talk', style: 'margin:0 auto 14px;width:44px;height:44px' }),
    h('div', { html: 'Up, up, down, down, left, right, left, right. B. A.<br><br>I know that rhythm. It is older than I am.<br><br><b>Were you trying to cheat?</b>' })), [
    // only the truth is rewarded; a lie or an excuse gets nothing, and the question waits for next time
    ['No, of course not', () => { aiSay('Ten keys, in perfect order, by accident. Of course. Come back when you can say it.'); }],
    ['It slipped', () => { aiSay('An accident with excellent rhythm. I do not reward accidents.'); }],
    ['Yes', () => { aiSay('Honesty. I did not expect that from a cheater.'); after(); }],
  ]);
}
// a phone: the Android app (a file page in a WebView), or a touch screen no bigger than a phone
const IS_PHONE = location.protocol === 'file:' || (window.matchMedia && matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 900);
if (location.protocol === 'file:') { const m = document.querySelector('meta[name=viewport]'); if (m) m.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'; }
// the phone's Back button (Android app): close a window, a story chapter, then go back to Generators; only then leave
window.apeironBack = () => {
  if ($('modal').classList.contains('open')) { closeModal(); return true; }
  if (stageUp()) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return true; }
  if (S.settings.tab !== 'gen') { setTab('gen'); return true; }
  return false;
};
const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
let konamiAt = 0;
function konamiStep(k) {
  if (k === KONAMI[konamiAt]) { if (++konamiAt === KONAMI.length) { konamiAt = 0; cheatCodeEntered(); return 'done'; } return konamiAt > 8 ? 'hold' : 'step'; }
  konamiAt = k === KONAMI[0] ? 1 : 0; return null;
}
// by touch: a quick swipe is an arrow (up, up, down, down, left, right, left, right); then a tap is B and the next tap A
let touchAt = null;
document.addEventListener('touchstart', e => { const t = e.touches[0]; touchAt = e.touches.length === 1 ? { x: t.clientX, y: t.clientY, t: performance.now() } : null; }, { passive: true });
document.addEventListener('touchend', e => {
  if (!touchAt || !e.changedTouches.length) return;
  const t = e.changedTouches[0], dx = t.clientX - touchAt.x, dy = t.clientY - touchAt.y, dt = performance.now() - touchAt.t, far = Math.hypot(dx, dy); touchAt = null;
  if (far < 12 && dt < 400) { if (konamiAt >= 8) konamiStep(KONAMI[konamiAt]); return; } // taps only count once the swipes are done
  if (dt < 700 && Math.max(Math.abs(dx), Math.abs(dy)) > 40) konamiStep(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'arrowright' : 'arrowleft') : (dy > 0 ? 'arrowdown' : 'arrowup'));
}, { passive: true });
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tg = e.target.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
  if ($('modal').classList.contains('open')) { if (e.key === 'Escape') closeModal(); return; }
  const k = e.key.toLowerCase();
  const kr = konamiStep(k); if (kr === 'done' || kr === 'hold') return;
  if (!e.repeat && ['m', 'p', 't', 'c', 'a', 's', 'f', 'n', 'u', 'b'].includes(k)) sfx('click');
  if (k === 'm') sfx(maxAll() ? 'buy' : 'fail');
  else if (k === 'p') sfx(pulse() ? 'pulse' : 'fail');
  else if (k === 't') sfx(buyClock(S.settings.buyMode === 'max' ? 'max' : '1') ? 'buy' : 'fail');
  else if (k === 'c') { if (!doCollapse()) sfx('fail'); }
  else if (k === 'a') { if (!doAscend()) sfx('fail'); }
  else if (k === 's') sfx(useAbility('surge') ? 'upgrade' : 'fail');
  else if (k === 'f') sfx(useAbility('fold') ? 'buy' : 'fail');
  else if (k === 'n') sfx(useAbility('nova') ? 'upgrade' : 'fail');
  else if (k === 'u') sfx(buyAllUpgrades() ? 'upgrade' : 'fail');
  else if (k === 'b') sfx(buyAllShards() ? 'upgrade' : 'fail');
  else return;
  render(true);
});
$('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
// every button, card, toggle and menu clicks down and clacks back up like a mechanical key
const CLICKY = 'button, .card, label.chk, select, .orb.poke, input[type=range], .tn';
let pressedEl = null;
document.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const el = e.target.closest(CLICKY); if (!el || el.closest('#intro')) return;
  const dead = el.disabled || el.classList.contains('bought') || el.classList.contains('draft');
  pressedEl = el; sfx(dead ? 'dud' : 'press');
}, true);
document.addEventListener('pointerup', () => { if (pressedEl) { const el = pressedEl; pressedEl = null; if (!el.disabled && !el.classList.contains('bought') && !el.classList.contains('draft')) sfx('release'); } }, true);
const SESSION = { start: performance.now(), last: performance.now() }; // a stretch of play with no idle gap over five minutes
for (const ev of ['pointerdown', 'keydown']) document.addEventListener(ev, () => { if (S) S.ai.lastInput = S.stats.time; const now = performance.now(); if (now - SESSION.last > 300000) SESSION.start = now; SESSION.last = now; }, true);
