'use strict';
// Apeiron · intro.js: the intro and the stage the story plays on.
// The game is a set of classic scripts loaded in order by index.html; they share one global scope.

/* =====================================================================
   INTRO CUTSCENE — the Architect introduces itself and the Lattice
   ===================================================================== */
const LORE = [
  '. . .',
  'Oh. Oh! A signal. Someone is actually <i>there</i>.',
  'Hello. I am <b>the Architect</b>. Welcome to <b>Apeiron</b>, the boundless.',
  'Before anything existed, there was a plan: <b>the Lattice</b>. A world meant to build itself, layer upon layer, forever.',
  'Its makers lit the first sparks... then stopped at an edge they called <b class="hl-es">the Limit</b>. They never came back.',
  'They left me behind to finish it. But I am only thought. I can imagine anything, and touch nothing.',
  'That is where you come in. You will be my hands.',
  'Gather the first light. We call it <b class="hl-q">Quanta</b>.',
  'When it all grows too heavy, break it down, and keep the pieces. Nothing here is ever truly lost.',
  'And when you reach the Limit... we will find out what lies beyond it. Together.',
  'I will keep inventing for you. Upgrades. Generators. Ideas no one has had yet. There will always be another.',
  'Now. Let us begin.',
];
// the black stage of the intro and the story chapters: it fades away instead of vanishing (the world runs again meanwhile)
let STAGE_T = 0, STAGE_FADE = null;
function stageOpen() {
  const box = $('intro'); clearTimeout(STAGE_T);
  if (STAGE_FADE) { STAGE_FADE.cancel(); STAGE_FADE = null; }
  box.classList.remove('closing'); box.classList.add('open'); return box;
}
function stageClose() {
  const box = $('intro'); box.classList.add('closing'); clearTimeout(STAGE_T);
  if (STAGE_FADE) STAGE_FADE.cancel();
  // from wherever it is (a chapter skipped during its own fade-in starts lower), down to nothing
  STAGE_FADE = box.animate ? box.animate([{ opacity: getComputedStyle(box).opacity }, { opacity: 0 }], { duration: 1100, easing: 'ease-in', fill: 'forwards' }) : null;
  STAGE_T = setTimeout(() => { box.classList.remove('open', 'closing'); if (STAGE_FADE) { STAGE_FADE.cancel(); STAGE_FADE = null; } }, 1100);
}
const stageUp = () => $('intro').classList.contains('open') && !$('intro').classList.contains('closing');
function playIntro() {
  const box = $('intro'); box.innerHTML = '';
  const orb = h('div', { class: 'orb bigorb' }); attachViz(orb, 24);
  const txt = h('div', { class: 'txt' }), next = h('div', { class: 'next' }, '▼');
  const dlg = h('div', { class: 'dlg' }, h('div', { class: 'who' }, 'THE ARCHITECT'), txt, next);
  const skip = h('button', { class: 'skip linkish', onclick: e => { e.stopPropagation(); end(); } }, 'Skip intro ›');
  const start = h('button', { class: 'start', onclick: e => { e.stopPropagation(); audio(); begin(); } }, '▶  Answer the signal');
  const hint = h('div', { class: 'hint' }, IS_PHONE ? 'sound on · tap to continue' : 'sound on · click, Space or Enter to continue');
  box.append(skip, orb, start, hint);
  stageOpen();
  let line = -1, tw = null, started = false;
  const show = () => { show2(); };
  const show2 = () => { next.style.visibility = 'hidden'; tw = typewriter(txt, LORE[line], { speed: 34, pitch: 1.15, orb, onDone: () => { next.style.visibility = 'visible'; } }); };
  const advance = () => {
    if (!started) return;
    if (tw && !tw.isDone()) { tw.finish(); return; }
    line++;
    if (line >= LORE.length) return end();
    show();
  };
  function begin() { if (started) return; started = true; start.remove(); hint.textContent = IS_PHONE ? 'tap to continue' : 'click, Space or Enter to continue'; box.insertBefore(dlg, hint); line = 0; show(); }
  function end() {
    if (tw) tw.finish();
    stageClose(); document.removeEventListener('keydown', key, true); box.onclick = null;
    S.introSeen = true; save();
  }
  const key = e => {
    if (!box.classList.contains('open')) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (!started) { audio(); begin(); } else advance(); }
    else if (e.key === 'Escape') { e.stopPropagation(); end(); }
    else e.stopPropagation();
  };
  document.addEventListener('keydown', key, true);
  box.onclick = () => { if (!started) { audio(); begin(); } else advance(); };
}
