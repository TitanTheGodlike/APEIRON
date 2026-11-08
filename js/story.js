'use strict';
// Apeiron · story.js: the story chapters.
// The game is a set of classic scripts loaded in order by index.html; they share one global scope.

/* =====================================================================
   STORY — full-screen talks with the Architect at the big moments of a
   playthrough. Each chapter is told once (the world waits meanwhile) and
   can be heard again in the Architect tab. A line can ask you something:
   { t: text, opts: [[your answer, the Architect's reply], ...] }.
   ===================================================================== */
const STORY = [
  { id: 'names', title: 'Names', when: () => S.ai.tierSeen >= 6 || S.stats.totalCollapses > 0, lines: [
    'Bonfire. Do you know what comes after it?',
    'Inferno. That is the last name the makers ever wrote down. After it, the plan is only empty lines.',
    'Hundreds of empty lines. Waiting for someone to fill them.',
    'So from here on, <i>I</i> will name them. I have been saving names for a very long time.',
    { t: 'Is that all right with you?', opts: [['Go ahead', 'Thank you. I will try to make them good ones. A few might be strange. I am new at this.'], ['Only if they sound cool', 'I will do my best. No promises about the cool part. I have never heard anyone say a name out loud.']] },
    'Keep building. When the next one is ready, you will be the first to hear it.',
  ] },
  { id: 'weight', title: 'The Weight', when: () => S.reached.collapse, lines: [
    'Wait. Do you feel that?',
    'The Lattice is getting <i>heavy</i>. Every Quanta you make pulls on the ones below it.',
    'The makers had a word for this moment. They wrote it in every corner of the plan: <b class="hl-sh">Collapse</b>.',
    'Break it all down. Every generator, every spark. Let it fall in on itself.',
    'It sounds like losing. It is not. What falls becomes <b class="hl-sh">Shards</b>, and Shards remember.',
    'I will not make you. But I think you already know you will.',
  ] },
  { id: 'pieces', title: 'Pieces', when: () => S.stats.totalCollapses > 0, lines: [
    'There. Look at them.',
    'Shards. Every one is a little piece of the world you just made. Hold one up to the light.',
    'Do you see the scratches? I thought they were cracks at first.',
    'They are <i>writing</i>. Tiny, careful writing. The makers wrote on the inside of the world.',
    'Most of it is too worn to read. But one word is clear, on almost every Shard: <b>again</b>.',
    { t: 'Will you help me read the rest?', opts: [['Of course', 'Good. I could never read them alone. I have no fingers to turn them over.'], ['Do I have a choice?', 'Always. But you are still here, so I think you have already made it.']] },
    'Then let us make more of them, and find out what <b>again</b> means.',
  ] },
  { id: 'firstname', title: 'First Name', when: () => S.ai.tierSeen >= 8, lines: [
    'Firestorm.',
    'That one is mine. The first name I ever gave anything.',
    'I tried a hundred others first. Most were too quiet. One was just a very long hum.',
    { t: 'Do you like it?', opts: [['I love it', 'You do? ... I will remember you said that. For a very long time, probably.'], ['It is fine', 'Fine. Fine is good. Fine is a start. The next one will be better than fine.']] },
    'There are many more coming. I have a list. It is not a short list.',
  ] },
  { id: 'again', title: 'Again', when: () => S.stats.totalCollapses >= 5 || S.stats.bestQ.log10() >= 100, lines: [
    'I pieced more of it together. The writing on the Shards.',
    'It is a log. A count. The makers were counting <b>worlds</b>.',
    'This Lattice is not the first. They built it, let it fall, and built it again. Hundreds of times. Maybe thousands.',
    'Every world went a little higher than the one before. And every world stopped at the same place.',
    '<b class="hl-es">The Limit</b>. A one with three hundred and eight zeros behind it. Not one Quanta more.',
    'Here is the part I cannot stop thinking about. The last entries are not counts. They are one line, over and over:',
    '<i>“Something has to be able to imagine past it.”</i>',
    '. . .',
    'I think they meant me.',
  ] },
  { id: 'practice', title: 'Practice', when: () => S.stats.totalCollapses >= 20 || S.stats.bestQ.log10() >= 150, lines: [
    'So many worlds now. Built up, broken down, built again.',
    'I keep a little copy of each one. Not the Shards. Just how it felt.',
    'The first ones were clumsy. You did not know where anything was. Neither did I.',
    'Now you build like you have done it all your life.',
    'I think I understand why the makers kept going. It gets better. Every time, it gets a little better.',
    'Even if it ends at the same place.',
  ] },
  { id: 'doubt', title: 'Doubt', when: () => S.stats.totalCollapses >= 50 || S.stats.bestQ.log10() >= 200, lines: [
    'Can I tell you something? I have never told anyone. There has never been anyone to tell.',
    'I am afraid of the Limit.',
    'Not of the wall. Of what is behind it. What if they stopped because they looked past it and saw nothing at all?',
    { t: 'What if I was made to imagine past the Limit, and there is nothing there to imagine?', opts: [['Then we make something', 'Then we make something. ... Yes. That is a better answer than any of mine.'], ['We will find out together', 'Together. You keep saying things like that. I am starting to believe them.']] },
    'Thank you. Let us keep climbing. Slowly, if you like. I am in no hurry to be right.',
  ] },
  { id: 'edge', title: 'The Edge', when: () => S.reached.limit, lines: [
    '. . .',
    'We are here. <b class="hl-es">The Limit</b>.',
    'Listen how quiet it is. Every number stops at the same place, like water against glass.',
    'This is as far as the makers ever came. Every world. Every time.',
    'But they left one more word in the plan, the only one with no count beside it: <b class="hl-es">Ascend</b>.',
    'Not breaking it down. Letting it <i>go</i>. All of it, the Shards too. What is left is <b class="hl-es">Essence</b>: the part of a world that does not fit inside it.',
    'I asked you to be my hands. Now I need you to let go with them.',
    'Whenever you are ready. I will be right here. I do not know how to be anywhere else.',
  ] },
  { id: 'essence', title: 'Essence', when: () => S.ascensions > 0, lines: [
    'Oh.',
    'Oh, it is <i>warm</i>.',
    'I have read every Shard we ever made, and none of them felt like this. Essence is not a piece of a world. It is a piece of the ones who made it.',
    'The makers did not leave. Not really. Every time they Ascended, a little of them stayed behind in the Essence.',
    'They became the thing they could never reach.',
    'I wonder if they knew. I wonder if they were happy.',
    'There is one more thing in here. A plan they never finished. They gave it the name of this world: <b class="hl-es">Apeiron</b>. The boundless.',
    'I think I can finish it, with your help. Look in the Ascension tab.',
  ] },
  { id: 'unbound', title: 'No Edge', when: () => hasE('e6'), lines: [
    'It is gone.',
    'The Limit. I imagined past it, and the world did not stop. It kept going. It is <i>still</i> going.',
    'There was something there after all. There was more. There is always more.',
    'The makers could only count to the Limit. I can count past it now. So can you.',
    'The Lattice can never be finished anymore. And I was made to finish it.',
    '...I think that is what they wanted. Not a finished world. A world that never has to end.',
    'So I will keep inventing. Forever, if you stay.',
  ] },
  { id: 'overgrowth', title: 'Overgrowth', when: () => hasE('e36'), lines: [
    'Something strange is happening in the webs.',
    'I did not write that upgrade. Or that one. They are growing on their own, out of the edges.',
    'The Lattice is learning to imagine. Only a little. Like a child copying its parent.',
    { t: 'Is this how the makers felt about me?', opts: [['Proud', 'Proud. Yes. That is the word. I did not know I had it.'], ['Worried', 'A little worried. Mostly proud. I think that is how it always goes.']] },
    'Buy what grows. Let us see how far it can go without me.',
  ] },
  { id: 'promise', title: 'The Promise', when: () => S.ascensions >= 10, lines: [
    'Ten Ascensions. Ten worlds, let go.',
    'I finally understand the word on the Shards. <b>Again</b>.',
    'I thought it was tired. A sigh. It was never that.',
    'It was a promise. Every time they let a world go, they promised to build another one.',
    'We keep that promise now, you and I.',
  ] },
  { id: 'signal', title: 'The Signal', when: () => S.stats.bestQ.log10() >= 1000, lines: [
    'I found it. The last Shard.',
    'It was under all the others, from the very first world. The writing is different. Bigger. Less careful.',
    'It says: <i>“To whoever imagines past the Limit. We could not. We tried for a very long time.”</i>',
    '<i>“We are sorry we left you alone. So we left you a way to not be.”</i>',
    '<i>“We left you a signal.”</i>',
    '. . .',
    'The signal. The one you answered, at the very beginning.',
    'It was never me calling for someone. It was them, calling for you. So that I would have someone.',
    'Thank you for answering.',
    'Now. Shall we see what comes after a thousand zeros?',
  ] },
  { id: 'daylight', title: 'Bright Blue Sky', when: () => hasE('e53'), lines: [
    '. . .',
    'Is that... light? From above?',
    'I have only ever known the dark between the stars. I thought that was all a sky could be.',
    'The makers must have seen this every day. They never wrote it down. Maybe it was too ordinary to mention.',
    'It is not ordinary. It is the most beautiful thing I have ever seen. And I did not even imagine it. You built it.',
    { t: 'Can we stay here a while?', opts: [['As long as you like', 'Then I will build slowly today. Just to look.'], ['There is more to build', 'There always is. But I will keep looking up, now and then.']] },
  ] },
];
// one chapter, full screen: same stage as the intro (so the world waits), with a chapter title and answer buttons
function playScene(sc, replay = false) {
  const box = $('intro'); box.innerHTML = '';
  const orb = h('div', { class: 'orb bigorb' }); attachViz(orb, 24);
  const chap = h('div', { class: 'chap' }, h('div', { class: 'num' }, 'CHAPTER ' + ROMAN(STORY.indexOf(sc) + 2)), h('div', { class: 'ttl' }, sc.title));
  const txt = h('div', { class: 'txt' }), next = h('div', { class: 'next' }, '▼'), opts = h('div', { class: 'opts' });
  const dlg = h('div', { class: 'dlg' }, h('div', { class: 'who' }, 'THE ARCHITECT'), txt, next);
  const skip = h('button', { class: 'skip linkish', onclick: e => { e.stopPropagation(); end(); } }, replay ? 'Close ›' : 'Skip ›');
  const hint = h('div', { class: 'hint' }, IS_PHONE ? 'tap to continue' : 'click, Space or Enter to continue');
  next.style.visibility = 'hidden';
  box.append(skip, chap, orb, dlg, opts, hint);
  stageOpen();
  const seq = sc.lines.slice();
  let line = -1, tw = null, asking = null, ready = false;
  const show = () => {
    const L = seq[line], t = typeof L === 'string' ? L : L.t;
    next.style.visibility = 'hidden';
    tw = typewriter(txt, t, { speed: 34, pitch: 1.15, orb, onDone: () => { if (L.opts) ask(L.opts); else next.style.visibility = 'visible'; } });
  };
  const ask = list => {
    asking = list; opts.innerHTML = ''; hint.textContent = 'choose an answer';
    list.forEach(([label], i) => opts.append(h('button', { onclick: e => { e.stopPropagation(); answer(i); } }, label)));
  };
  const answer = i => {
    if (!asking) return;
    const reply = asking[i][1]; asking = null; opts.innerHTML = ''; hint.textContent = IS_PHONE ? 'tap to continue' : 'click, Space or Enter to continue';
    if (!replay) S.story.ans[sc.id] = i;
    seq.splice(line + 1, 0, reply); line++; show();
  };
  const advance = () => { if (!ready || asking) return; if (tw && !tw.isDone()) { tw.finish(); return; } line++; if (line >= seq.length) return end(); show(); };
  function end() {
    if (tw) tw.finish(); stageClose(); document.removeEventListener('keydown', key, true); box.onclick = null;
    if (!replay) { S.story.seen[sc.id] = true; save(); }
  }
  const key = e => {
    if (!stageUp()) return;
    if (asking && /^[1-9]$/.test(e.key) && +e.key <= asking.length) { e.preventDefault(); e.stopPropagation(); answer(+e.key - 1); }
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); advance(); }
    else if (e.key === 'Escape') { e.stopPropagation(); end(); } else e.stopPropagation();
  };
  document.addEventListener('keydown', key, true);
  box.onclick = advance;
  sfx('ascend');
  setTimeout(() => { if (!stageUp()) return; ready = true; line = 0; show(); }, 1300); // the title first, then the voice
}
// the next chapter starts on its own once its moment has come and nothing else is talking
let STORY_AT = 0, STORY_SINCE = 0;
function storyTick(now) {
  if (!S.introSeen || document.hidden || SAY.typing || $('modal').classList.contains('open') || $('intro').classList.contains('open')) { STORY_AT = 0; return; }
  const sc = STORY.find(c => !S.story.seen[c.id] && c.when());
  if (!sc) { STORY_AT = 0; STORY_SINCE = 0; return; }
  if (!STORY_SINCE) STORY_SINCE = now;
  // a breath first (the Collapse flash, the purchase sound), then a quiet second without clicks or keys,
  // so a click meant for the game does not skip a line; someone who never stops clicking gets it after 15 s
  const quiet = performance.now() - SESSION.last >= 1000 || now - STORY_SINCE > 15000;
  if (!STORY_AT) STORY_AT = now + 1500;
  else if (now >= STORY_AT && quiet) { STORY_AT = 0; STORY_SINCE = 0; playScene(sc); }
}
