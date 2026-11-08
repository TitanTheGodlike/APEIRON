'use strict';
// Apeiron · save.js: saving, loading, old-save notices.
// The game is a set of classic scripts loaded in order by index.html; they share one global scope.

/* =====================================================================
   SAVE / LOAD
   ===================================================================== */
const SAVE_KEY = 'apeiron.save.v1';
// Big updates bump SAVE_VER and add a line here. A save from before one gets a one-time notice offering a fresh start.
const SAVE_VER = 5;
const BIG_UPDATES = [
  { v: 2, what: 'over 400 upgrades across the three webs, cards from the Architect, a much slower opening, a Shard web that starts with unlocks, upgrades that come one at a time, Ascension that resets the Shard web, and slower offline progress' },
  { v: 3, what: 'the story: full-screen chapters with the Architect at the big moments (hear them again in the Architect tab, under Story), and Overgrowth that branches into many more lines' },
  { v: 4, what: 'Wonders, a fourth branch of the Essence web full of unlocks (Boons each Ascension, the Nova ability, Reflex, Heartbeat, bigger hands of cards, Afterglow, Reliquary), Anomalies bought again after every Ascension like Relics, and upgrade keepers that buy every 5 seconds' },
  { v: 5, what: 'Inspiration (from Apeiron) now only builds while your Quanta is past the Limit and starts over with every Ascension, so a new world climbs to the Limit again instead of racing through in minutes; and a new dawn in the sky after every Ascension' },
];
const reviver = (k, v) => typeof v === 'string' && v.startsWith('D:') ? D.fromStr(v.slice(2)) : v;
function merge(def, sav) {
  if (def === null || def === undefined) return sav;
  if (sav === undefined || sav === null) return def;
  if (def instanceof D) return sav instanceof D ? sav : D.n(sav);
  if (Array.isArray(def)) {
    if (!Array.isArray(sav)) return def;
    const len = Math.max(def.length, sav.length);
    return Array.from({ length: len }, (_, i) => i < sav.length ? merge(def[i] !== undefined ? def[i] : def[0], sav[i]) : def[i]);
  }
  if (typeof def === 'object') {
    if (typeof sav !== 'object') return def;
    const out = {};
    for (const k of Object.keys(def)) out[k] = merge(def[k], sav[k]);
    for (const k of Object.keys(sav)) if (!(k in out)) out[k] = sav[k];
    return out;
  }
  return typeof sav === typeof def ? sav : def;
}
const NOSAVE = /[?&]nosave/.test(location.search); // for testing without touching the real save
function save() { if (NOSAVE) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }
function loadFrom(json) { return merge(newState(), JSON.parse(json, reviver)); }
const encodeSave = () => btoa(unescape(encodeURIComponent(JSON.stringify(S))));
const decodeSave = str => loadFrom(decodeURIComponent(escape(atob(str.trim()))));
