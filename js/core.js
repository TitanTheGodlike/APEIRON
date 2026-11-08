'use strict';
// Apeiron · core.js: big numbers, helpers, settings and the generator ladder.
// The game is a set of classic scripts loaded in order by index.html; they share one global scope.

/* =====================================================================
   APEIRON — an infinite incremental. No dependencies: index.html, css/style.css and the scripts in js/,
   loaded in order as classic scripts that share one global scope (core.js first, main.js last).
   ===================================================================== */

/* ---------------- Big numbers: m × 10^e, m in [1,10) ---------------- */
class D {
  constructor(m, e) { this.m = m; this.e = e; }
  static norm(m, e) {
    if (m === 0 || Number.isNaN(m)) return D.Z;
    if (!Number.isFinite(m)) return new D(m > 0 ? 1 : -1, 1e300);
    const s = Math.floor(Math.log10(Math.abs(m)));
    if (s !== 0) { m /= Math.pow(10, s); e += s; }
    const a = Math.abs(m);
    if (a >= 10) { m /= 10; e += 1; } else if (a < 1) { m *= 10; e -= 1; }
    return new D(m, e);
  }
  static fromNum(x) { return D.norm(x, 0); }
  static fromLog(L) {
    if (Number.isNaN(L) || L === -Infinity) return D.Z;
    if (L === Infinity) return new D(1, 1e300);
    let e = Math.floor(L), m = Math.pow(10, L - e);
    if (m >= 10) { m /= 10; e++; }
    return new D(m, e);
  }
  static fromStr(s) {
    s = String(s).trim().replace(/,/g, '');
    const i = s.search(/e/i);
    if (i < 0) { const n = parseFloat(s); return Number.isFinite(n) ? D.fromNum(n) : D.Z; }
    const ms = s.slice(0, i), m = ms === '' ? 1 : parseFloat(ms), e = parseFloat(s.slice(i + 1));
    if (!Number.isFinite(m) || !Number.isFinite(e)) return D.Z;
    if (Number.isInteger(e)) return D.norm(m, e);
    return m > 0 ? D.fromLog(Math.log10(m) + e) : D.Z;
  }
  static n(x) { return x instanceof D ? x : typeof x === 'number' ? D.fromNum(x) : typeof x === 'string' ? D.fromStr(x) : D.Z; }
  add(b) {
    b = D.n(b); if (this.m === 0) return b; if (b.m === 0) return this;
    const d = this.e - b.e;
    if (d > 17) return this; if (d < -17) return b;
    return d >= 0 ? D.norm(this.m + b.m * Math.pow(10, -d), this.e) : D.norm(this.m * Math.pow(10, d) + b.m, b.e);
  }
  sub(b) { b = D.n(b); return this.add(new D(-b.m, b.e)); }
  mul(b) { b = D.n(b); if (this.m === 0 || b.m === 0) return D.Z; return D.norm(this.m * b.m, this.e + b.e); }
  div(b) { b = D.n(b); if (b.m === 0) return new D(1, 1e300); if (this.m === 0) return D.Z; return D.norm(this.m / b.m, this.e - b.e); }
  log10() { return this.m > 0 ? this.e + Math.log10(this.m) : -Infinity; }
  pow(p) { return this.m <= 0 ? D.Z : D.fromLog(this.log10() * p); }
  cmp(b) {
    b = D.n(b); const sa = Math.sign(this.m), sb = Math.sign(b.m);
    if (sa !== sb) return sa > sb ? 1 : -1; if (sa === 0) return 0;
    if (this.e !== b.e) return (this.e > b.e ? 1 : -1) * sa;
    return this.m === b.m ? 0 : this.m > b.m ? 1 : -1;
  }
  gt(b) { return this.cmp(b) > 0; } gte(b) { return this.cmp(b) >= 0; }
  lt(b) { return this.cmp(b) < 0; } lte(b) { return this.cmp(b) <= 0; }
  max(b) { b = D.n(b); return this.gte(b) ? this : b; }
  max0() { return this.m < 0 ? D.Z : this; }
  floor() { if (this.m === 0 || this.e >= 15) return this; return D.fromNum(Math.floor(this.toNumber() + 1e-9)); }
  toNumber() { return this.m * Math.pow(10, this.e); }
  toJSON() { return 'D:' + this.m + 'e' + this.e; }
}
D.Z = new D(0, 0);
const L10 = Math.log10;

/* ---------------- Formatting ---------------- */
const LOW_SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
const U_SUF = ['', 'U', 'D', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'O', 'N'];
const T_SUF = ['', 'Dc', 'Vg', 'Tg', 'Qd', 'Qq', 'Sg', 'St', 'Og', 'Nn'];
const H_SUF = ['', 'Ce', 'DCe', 'TCe', 'QaCe', 'QiCe', 'SxCe', 'SpCe', 'OCe', 'NCe'];
function stdSuffix(k) {
  if (k < LOW_SUF.length) return LOW_SUF[k];
  const n = k - 1; if (n >= 1000) return null;
  return U_SUF[n % 10] + T_SUF[Math.floor(n / 10) % 10] + H_SUF[Math.floor(n / 100)];
}
function mant3(x) {
  const e3 = Math.floor(x.e / 3) * 3, v = x.m * Math.pow(10, x.e - e3);
  const s = v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0);
  return parseFloat(s) >= 1000 ? [(v / 1000).toFixed(2), e3 + 3] : [s, e3];
}
function fmt(x, dp = 2) {
  x = D.n(x);
  if (x.m === 0) return '0';
  if (x.m < 0) return '-' + fmt(new D(-x.m, x.e), dp);
  const N = S ? S.settings.notation : 'sci';
  if (x.e < 3) {
    const n = x.toNumber();
    if (dp === 0 || n >= 100) return String(Math.floor(n + 1e-9));
    return n.toFixed(n < 10 ? dp : Math.min(dp, 1));
  }
  if (N === 'log') return 'e' + fmtL(x.log10());
  if (x.e < 6) return Math.floor(x.toNumber() + 1e-9).toLocaleString('en-US');
  if (x.e >= 1e6) return 'e' + fmt(D.fromNum(x.e), 2);
  if (N === 'eng') { const [s, e3] = mant3(x); return s + 'e' + e3; }
  if (N === 'std') { const [s, e3] = mant3(x); const suf = stdSuffix(e3 / 3); if (suf !== null) return s + ' ' + suf; }
  let ms = x.m.toFixed(2), e = x.e;
  if (ms === '10.00') { ms = '1.00'; e += 1; }
  return ms + 'e' + e;
}
function fmtL(L) { return L < 1e6 ? L.toFixed(2) : fmt(D.fromNum(L)); }
function fmtMult(L) { return '×' + fmt(D.fromLog(L)); }
function fmtTime(s) {
  if (s == null || !Number.isFinite(s)) return '—';
  if (s < 60) return s.toFixed(s < 10 ? 2 : 1) + 's';
  const m = Math.floor(s / 60); if (m < 60) return m + 'm ' + Math.floor(s % 60) + 's';
  const hh = Math.floor(m / 60); if (hh < 24) return hh + 'h ' + (m % 60) + 'm';
  const d = Math.floor(hh / 24); if (d < 365) return d + 'd ' + (hh % 24) + 'h';
  return fmt(d / 365) + ' years';
}

/* ---------------- Geometric cost helpers (all in log10 space) ---------------- */
// sum of n terms c0, c0*r, c0*r^2 ... where log10(c0)=c0L, log10(r)=step
function geoSumLog(c0L, step, n) {
  const sn = step * n, lr1 = L10(Math.pow(10, step) - 1);
  const lnum = sn > 15 ? sn : L10(Math.pow(10, sn) - 1);
  return c0L + lnum - lr1;
}
// largest n with geoSum <= money
function geoMax(lm, c0L, step) {
  if (!(lm >= c0L)) return 0;
  const lr1 = L10(Math.pow(10, step) - 1), L = lm - c0L + lr1;
  let n = L > 15 ? Math.floor(L / step) : Math.floor(L10(Math.pow(10, L) + 1) / step + 1e-9);
  n = Math.max(1, n);
  for (let guard = 0; n > 1 && guard < 50 && geoSumLog(c0L, step, n) > lm + 1e-12; guard++) n--;
  return n;
}
function logAdd(a, b) {
  if (a === -Infinity) return b; if (b === -Infinity) return a;
  const mx = Math.max(a, b), mn = Math.min(a, b);
  return mx + L10(1 + Math.pow(10, mn - mx));
}
// Quadratic scaling: log10 cost of unit k = c0 + s*k + s*k^2/(2q)  (each unit costs more than the last, and faster over time)
const quadCost = (c0, s, q, k) => c0 + s * k + s * k * k / (2 * q);
function quadInv(c0, s, q, lm) { const d = lm - c0; return d < 0 ? -1 : q * (-1 + Math.sqrt(1 + 2 * d / (s * q))); }
function quadSumLog(c0, s, q, k, n) {
  if (!(n > 0)) return -Infinity;
  const top = k + n - 1, m = Math.min(n, 80);
  let acc = -Infinity;
  for (let t = 0; t < m; t++) acc = logAdd(acc, quadCost(c0, s, q, top - t));
  return acc;
}
function quadMax(lm, c0, s, q, k) {
  const top = Math.floor(quadInv(c0, s, q, lm) + 1e-9);
  if (!(top >= k)) return 0;
  let n = top - k + 1;
  if (n > 1e9) return n; // astronomically many: exact cost check is meaningless at this scale
  for (let guard = 0; n > 0 && guard < 50 && quadSumLog(c0, s, q, k, n) > lm + 1e-12; guard++) n--;
  return n;
}
