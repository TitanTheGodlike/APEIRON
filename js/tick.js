'use strict';
// Apeiron · tick.js: one step of game time.
// The game is a set of classic scripts loaded in order by index.html; they share one global scope.

/* =====================================================================
   SIMULATION TICK
   ===================================================================== */
let HEART = 0; // Heartbeat: seconds since its last Pulse
function tick(dt) {
  if (!(dt > 0)) return;
  const st = S.stats;
  st.time += dt; st.tCollapse += dt; st.tAscend += dt;
  if (hasE('e45') && S.auto.heart !== false && (HEART += dt) >= 3) { const n = Math.floor(HEART / 3); HEART -= 3 * n; S.q = S.q.add(pulseGain().mul(D.fromNum(n))); capQ(); }
  if (S.eUpg.e6) { st.tUnbound += dt; if (lq() >= CFG.limit) st.tInspire += dt; } // Inspiration only builds past the Limit
  const gl = globalMultLog(), ldt = L10(dt);
  for (let i = S.gens.length - 1; i >= 1; i--) {
    const r = genRateLog(i, gl);
    if (r > -Infinity) S.gens[i - 1].amt = S.gens[i - 1].amt.add(D.fromLog(r + ldt));
  }
  const ql = qpsLog(gl);
  if (ql > -Infinity) { const g = D.fromLog(ql + ldt); S.q = S.q.add(g); st.totalQ = st.totalQ.add(g); }
  capQ();
  if (S.q.gt(st.bestQ)) st.bestQ = S.q;
  if (S.run.best === undefined || lq() > S.run.best) S.run.best = lq();
  const Hh = S.hist;
  if (st.time >= Hh.next) {
    Hh.t.push(Math.round(st.time)); Hh.q.push(+Math.max(0, lq()).toFixed(2)); Hh.best.push(+Math.max(0, st.bestQ.log10()).toFixed(2));
    Hh.sh.push(S.shards.m > 0 ? +Math.max(0, S.shards.log10()).toFixed(2) : 0); Hh.es.push(S.essence.m > 0 ? +Math.max(0, S.essence.log10()).toFixed(2) : 0);
    if (Hh.t.length > 600) { for (const k of ['t', 'q', 'best', 'sh', 'es']) Hh[k] = Hh[k].filter((_, i) => i % 2 === 0); Hh.every *= 2; }
    Hh.next = st.time + Hh.every;
  }
  if (hasE('e7')) {
    const g = shardGain();
    if (g.m > 0) { const add = g.mul(0.1 * dt); S.shards = S.shards.add(add); S.totalShards = S.totalShards.add(add); }
  }
  if (canCollapse()) S.reached.collapse = true;
  if (canAscend()) S.reached.limit = true;
  if (S.chal.active >= 0 && lq() >= chalGoalLog(S.chal.active)) completeChal();
  runAuto();
  aiTick();
  cardsTick();
  checkAch();
}
