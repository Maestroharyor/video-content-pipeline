/* Rough cut of a raw recording: the pure parts (no ffmpeg, no files), used by scripts/rough-cut.js and unit-tested.
     parseScript(text)                 the spoken lines of a script (headers, on-screen notes and review notes dropped)
     normWords(text)                   lower-case word tokens, symbols spelled the way whisper writes them
     alignIsland(words, scriptWords)   best local alignment of one island's words inside the script
     chooseTakes(islands, script)      which islands to keep: the last complete take of each line, retakes and false starts out
     planSegments(islands, edit)       frame-snapped segments + EDL from the kept islands, with the house pacing caps
   Two videos were cut this way by hand first (kafka-vs-rabbitmq, reverse-proxy-lb-gateway); planSegments is their
   source/edit.js segment code, and chooseTakes encodes the rules applied by hand there (house-rules: "last complete take,
   doubtful ones flagged, the whole list approved before any cut"). */

const SECTION_RE = /^\s*\[(\d{1,2}):(\d{2})\]\s*(.*)$/;
const NOTES_RE = /^\s*#*\s*(review notes|production notes|notes)\s*:?\s*$/i;
const DIRECTION_RE = /^\s*[([](?:on[ -]?screen|b-?roll|cut to|sfx|music|graphic|visual|note)\b[^)\]]*[)\]]\s*$/i;

/* the words a line is made of, normalised for matching: case and punctuation dropped, flags and operators spelled out */
function normWords(s) {
  return String(s)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/~(\d+)/g, ' $1')                  // HEAD~1 → head 1
    .replace(/--?([a-z])/g, ' $1')              // --soft → soft, -m → m
    .replace(/&/g, ' and ')
    .replace(/%/g, ' percent ')
    .replace(/[^a-z0-9' ]+/g, ' ')
    .split(/\s+/)
    .map(w => w.replace(/^'+|'+$/g, ''))
    .filter(Boolean);
}

/* a line that is code, a command or a diagram rather than speech: no sentence punctuation and mostly symbols, flags,
   hashes or short command words (e.g. `git add .`, `A -- B -- C`, `9f2c1ab HEAD@{0}: reset: moving to HEAD~1`) */
function looksLikeCode(line) {
  const t = line.trim();
  if (!t) return false;
  if (/^(\$|>|#!|\/\/|<\w)/.test(t)) return true;
  const words = t.split(/\s+/);
  // a command: starts with a lower-case CLI name, short (`git add .`, `git reset --soft HEAD~1`)
  // (not a sentence that happens to start with one: "git reset moves your branch back to an earlier commit.")
  if (words.length <= 10 && /^(git|npm|npx|node|curl|docker|kubectl|cd|ls|cat|sudo|pip|python|yarn|pnpm|brew)\s/.test(t) && !/[a-z]{2,}[.!?]["')]?$/.test(t)) return true;
  // a diagram or output: code symbols and no sentence ending (`A -- B -- C`, `9f2c1ab HEAD@{0}: reset: moving to HEAD~1`)
  if (/[{}<>@=]|--|->|=>|::|\b[0-9a-f]{7,40}\b|HEAD[~@^]/.test(t) && !/[a-z][.!?]["')]?$/.test(t)) return true;
  return false;
}

/* sentences of a paragraph: split after . ! ? (not inside code-like tokens such as `.env`, `v1.2`, `git add .`) */
function sentences(p) {
  const out = []; let cur = '';
  const parts = p.split(/(?<=[.!?]["')]?)\s+(?=[A-Z0-9"'(])/);
  for (const s of parts) { cur = cur ? cur + ' ' + s : s; if (/[.!?]["')]?$/.test(cur.trim())) { out.push(cur.trim()); cur = ''; } }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/* The spoken lines of a script. Accepts plain text and Markdown; the usual LifeTech Facts script layout (title, date,
   byline, "YouTube script | …", then [mm:ss] Section markers, (ON SCREEN: …) directions, code lines, and a trailing
   "Review notes" block) is the common case. */
function parseScript(text) {
  const raw = String(text).replace(/\r\n?/g, '\n').split('\n');
  const hasMarkers = raw.some(l => SECTION_RE.test(l));
  const sections = [], lines = [];
  let started = !hasMarkers, section = -1, para = [];
  const flush = () => {
    if (!para.length) return;
    const joined = para.join(' ').replace(/\s+/g, ' ').trim(); para = [];
    if (!joined) return;
    if (section < 0) { sections.push({ title: '', at: null }); section = 0; }
    for (const s of sentences(joined)) {
      const words = normWords(s);
      if (words.length) lines.push({ id: lines.length + 1, section, text: s, words, optional: false });
    }
  };
  for (const l of raw) {
    if (NOTES_RE.test(l)) { flush(); break; }
    const m = SECTION_RE.exec(l);
    if (m) { flush(); started = true; sections.push({ title: m[3].trim(), at: +m[1] * 60 + +m[2] }); section = sections.length - 1; continue; }
    if (!started) continue;
    const t = l.trim();
    if (!t) { flush(); continue; }
    if (!hasMarkers && /^#{1,6}\s/.test(t)) { flush(); sections.push({ title: t.replace(/^#+\s*/, ''), at: null }); section = sections.length - 1; continue; }
    if (DIRECTION_RE.test(t) || /^\(.*\)$/.test(t) || /^\[.*\]$/.test(t)) { flush(); continue; }
    if (/^```/.test(t)) { flush(); continue; }
    const body = t.replace(/^[-*•]\s+/, '').replace(/^#{1,6}\s+/, '');
    if (looksLikeCode(body)) {
      flush();
      const words = normWords(body);
      if (words.length) lines.push({ id: lines.length + 1, section: Math.max(0, section), text: body, words, optional: true });
      if (section < 0) { sections.push({ title: '', at: null }); section = 0; }
      continue;
    }
    // a short heading-like line ("--soft: keep the changes staged", "Option 1: git revert") is spoken as a sub-title
    // or not at all: matched if said, never required
    if (/^[^.!?]{1,60}:\s*\S[^.!?]*$/.test(body) && body.split(/\s+/).length <= 8) {
      flush();
      const words = normWords(body);
      if (words.length) lines.push({ id: lines.length + 1, section: Math.max(0, section), text: body, words, optional: true });
      continue;
    }
    para.push(body);
    // a line that ends a sentence and is followed by a new line is its own paragraph in these scripts
    if (/[.!?]["')]?$/.test(body)) flush();
  }
  flush();
  return { sections, lines };
}

/* Smith-Waterman on word tokens: where in the script (from..to, word indices) one island's words fit best.
   match +2, mismatch -1, gap -1. coverage = matched words / island words. */
function alignIsland(iw, sw) {
  const n = iw.length, m = sw.length;
  if (!n || !m) return { from: -1, to: -1, score: 0, matched: 0, coverage: 0 };
  let prev = new Float64Array(m + 1), cur = new Float64Array(m + 1);
  const trace = [];
  let best = 0, bi = 0, bj = 0;
  for (let i = 1; i <= n; i++) {
    const row = new Uint8Array(m + 1);
    for (let j = 1; j <= m; j++) {
      const d = prev[j - 1] + (iw[i - 1] === sw[j - 1] ? 2 : -1), u = prev[j] - 1, l = cur[j - 1] - 1;
      let v = 0, t = 0;
      if (d > v) { v = d; t = 1; }
      if (u > v) { v = u; t = 2; }
      if (l > v) { v = l; t = 3; }
      cur[j] = v; row[j] = t;
      if (v > best) { best = v; bi = i; bj = j; }
    }
    trace.push(row);
    [prev, cur] = [cur, prev]; cur.fill(0);
  }
  let i = bi, j = bj, matched = 0, from = bj - 1, ifrom = bi - 1;
  while (i > 0 && j > 0) {
    const t = trace[i - 1][j];
    if (t === 0) break;
    if (t === 1) { if (iw[i - 1] === sw[j - 1]) matched++; from = j - 1; ifrom = i - 1; i--; j--; }
    else if (t === 2) { ifrom = i - 1; i--; }
    else { from = j - 1; j--; }
  }
  return { from, to: bj - 1, score: best, matched, coverage: matched / n, ifrom, ito: bi - 1 };
}

/* script word index → line, so an alignment can be read as lines */
function scriptIndex(script) {
  const words = [], lineOf = [], starts = [];
  script.lines.forEach((l, k) => { starts.push(words.length); l.words.forEach(w => { words.push(w); lineOf.push(k); }); });
  return { words, lineOf, starts };
}

/* repeated words at an island's start: "the the request", "we, we can" */
function stutterAt(w) {
  for (let k = 1; k <= 3 && 2 * k <= w.length; k++) if (w.slice(0, k).join(' ') === w.slice(k, 2 * k).join(' ')) return k;
  return 0;
}

/* an island with no speech in it ([BLANK_AUDIO], noises) or a take abandoned mid-word or mid-thought ("T-", "First sign
   the request to...") is never kept */
function dropNonSpeech(t, w) {
  if (!w.length) { t.keep = false; t.reason = 'no speech'; t.dead = true; return true; }
  if (/(-|\.\.\.|…)\s*["')]?$/.test(t.text.trim())) { t.keep = false; t.reason = 'cut off'; t.dead = true; return true; }
  return false;
}

/* Which islands to keep. islands: [{ i, a, b, text }] in raw order. script: parseScript output, or null (no script: the
   transcript is its own reference). Returns { takes: [{ i, keep, lines, flag, reason, alt }], missing: [line ids] }. */
function chooseTakes(islands, script, o = {}) {
  const minScore = o.minScore != null ? o.minScore : 4;   // two matched words
  const W = islands.map(x => normWords(x.text.replace(/\[[A-Z_ ]+\]|\([a-z ]+\)/g, ' ')));
  const takes = islands.map((x, k) => ({ i: x.i, a: x.a, b: x.b, text: x.text, keep: true, lines: [], flag: null, reason: '', span: null }));

  takes.forEach((t, k) => dropNonSpeech(t, W[k]));
  if (!script) {
    // no script: a retake is an island whose words mostly repeat the next one's (≥ 60% of the shorter), so the earlier goes
    for (let k = 0; k < takes.length - 1; k++) {
      const a = W[k], b = W[k + 1];
      if (!a.length || !b.length) continue;
      const al = alignIsland(a, b), share = al.matched / Math.min(a.length, b.length);
      if (takes[k].keep && share >= 0.6) { takes[k].keep = false; takes[k].reason = `retake of ${takes[k + 1].i}`; }
    }
    takes.forEach((t, k) => { const s = stutterAt(W[k]); if (t.keep && s) t.flag = 'stutter'; });
    return { takes, missing: [] };
  }

  const S = scriptIndex(script);
  takes.forEach((t, k) => {
    if (dropNonSpeech(t, W[k])) return;
    const al = alignIsland(W[k], S.words);
    if (al.score < minScore || al.matched < 2) {
      t.flag = 'ad-lib';
      if (W[k].length < 4) { t.keep = false; t.reason = 'short off-script'; }
      return;
    }
    t.span = [al.from, al.to];
    t.cov = al.coverage;
    t.lines = Array.from(new Set(S.lineOf.slice(al.from, al.to + 1))).map(li => script.lines[li].id);
  });

  // a later island that covers the same script words makes the earlier one a retake (last take wins); an island whose
  // span is a prefix of the next one's is a false start
  for (let k = 0; k < takes.length; k++) {
    const t = takes[k]; if (!t.span || !t.keep || t.decided) continue;
    for (let q = k + 1; q < takes.length && q <= k + 12; q++) {
      const u = takes[q]; if (!u.span) continue;
      const lo = Math.max(t.span[0], u.span[0]), hi = Math.min(t.span[1], u.span[1]);
      const ov = hi - lo + 1, tl = t.span[1] - t.span[0] + 1;
      if (ov > 0 && ov / tl >= 0.6) {
        /* the later take is clearly worse (fluffed, or a word so clipped whisper mis-hears it) while this one is clean:
           keep this one and say so (the hand cuts: 131 over 132's clipped "door", 526 over the slurred 527) */
        if (t.cov >= 0.95 && u.cov < t.cov - 0.15 && t.span[0] <= u.span[0] && t.span[1] >= u.span[1]) {
          u.keep = false; u.decided = true; u.reason = `fluffed retake of ${t.i}`;
          t.flag = 'check'; t.alt = u.i; t.reason = `earlier take kept: ${u.i} reads worse`;
          continue;
        }
        t.keep = false;
        t.reason = u.span[0] <= t.span[0] && u.span[1] - t.span[1] >= 2 && tl <= 6 ? `false start, said again in ${u.i}` : `retake, later take ${u.i}`;
        t.laterTake = u.i;
        break;
      }
    }
  }

  /* a pause inside a sentence leaves a short island (often one or two words, often mis-heard: "proxy." came back as
     "Kranzki po!") that matches nothing on its own. One that sits between two kept takes whose script words leave a gap
     it could fill is that gap: kept, given the gap's span (the hand cuts kept every such fragment) */
  const kept = () => takes.filter(t => t.keep && t.span);
  takes.forEach((t, k) => {
    if (t.dead || (t.span && !(t.flag === 'ad-lib'))) return;
    const prev = takes.slice(0, k).reverse().find(u => u.keep && u.span), next = takes.slice(k + 1).find(u => u.keep && u.span);
    if (!prev || !next) return;
    const from = prev.span[1] + 1, to = next.span[0] - 1, gap = to - from + 1;
    const near = takes.indexOf(prev) >= k - 2 && takes.indexOf(next) <= k + 2;
    const shares = W[k].some(w => S.words.slice(from, to + 1).includes(w));
    if (near && gap >= 1 && W[k].length <= gap + 2 && (shares || (W[k].length <= 2 && gap <= 4))) {
      t.keep = true; t.flag = null; t.reason = `fills the gap between ${prev.i} and ${next.i}`; t.span = [from, to];
      t.lines = Array.from(new Set(S.lineOf.slice(from, to + 1))).map(li => script.lines[li].id);
    }
  });

  /* off-script lines get the no-script rule: an ad-lib repeated by the next kept island (≥ 60% of the shorter) is a retake
     of it, and the earlier one goes (smoke test: "right here on this channel we're going to keep…" said twice, both kept) */
  const ks = takes.map((t, k) => k).filter(k => takes[k].keep);
  for (let q = 0; q < ks.length - 1; q++) {
    const k = ks[q], n = ks[q + 1], t = takes[k];
    if (t.flag !== 'ad-lib' || !W[k].length || !W[n].length) continue;
    const al = alignIsland(W[k], W[n]);
    if (al.matched / Math.min(W[k].length, W[n].length) >= 0.6) { t.keep = false; t.reason = `retake, later take ${takes[n].i}`; }
  }

  /* a line is judged on everything kept for it together (a sentence is often split over several islands by his own
     pauses): under 80% of its words covered → the last kept island on it is flagged incomplete, and a whole earlier take
     of it, if one was dropped as a retake, is offered (the hand cuts chose it in such cases: "131 over 132's clipped 'door'") */
  const cover = new Map();
  kept().forEach(t => { for (let w = t.span[0]; w <= t.span[1]; w++) { const li = S.lineOf[w]; cover.set(li, (cover.get(li) || 0) + 1); } });
  const missing = [];
  script.lines.forEach((l, li) => {
    if (l.optional) return;
    const c = (cover.get(li) || 0) / l.words.length;
    if (c === 0) { missing.push(l.id); return; }
    if (c < 0.8) {
      const on = kept().filter(t => S.lineOf[t.span[0]] <= li && S.lineOf[t.span[1]] >= li);
      const last = on[on.length - 1]; if (!last) return;
      last.flag = 'incomplete';
      const lineFrom = S.starts[li], lineTo = lineFrom + l.words.length - 1;
      const whole = takes.filter(e => e.span && !e.keep && e.span[0] <= lineFrom + 1 && e.span[1] >= lineTo - 1);
      if (whole.length) last.alt = whole[whole.length - 1].i;
    }
  });
  takes.forEach((t, k) => { if (t.keep && !t.flag && stutterAt(W[k])) t.flag = 'stutter'; });
  return { takes, missing };
}

/* Segments of the cut, from the raw islands, the kept set and the pacing caps. edit = { keep, trim, sections, fps,
   maxGap, minJoin, maxJoin, sectionGap, endTail, pre, joins? }; joins = { "<island>": seconds of pause after it }. Exactly the segment code of the two hand-cut projects'
   source/edit.js: every cut sits in a pause, every edge on the frame grid, pauses are his own and capped. */
function planSegments(I, E) {
  const trim = E.trim || {};
  const joins = E.joins || {};
  const keep = new Set(E.keep);
  const sections = E.sections || [];
  const fr = x => Math.round(x * E.fps) / E.fps;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const byI = new Map(I.map((o, k) => [o.i, k]));
  const prevOf = o => I[byI.get(o.i) - 1], nextOf = o => I[byI.get(o.i) + 1];
  const span = o => ({ a: (trim[o.i] && trim[o.i].a) || o.a, b: (trim[o.i] && trim[o.i].b) || o.b });
  const before = o => (trim[o.i] && trim[o.i].a ? trim[o.i].room : o.a - (prevOf(o) ? prevOf(o).b : 0));
  const after = o => (trim[o.i] && trim[o.i].b ? trim[o.i].room : (nextOf(o) ? nextOf(o).a : o.b + 2) - o.b);
  const K = I.filter(o => keep.has(o.i));
  const segs = [];
  K.forEach((o, k) => {
    const { a, b } = span(o);
    const next = K[k + 1];
    const lead = k === 0 ? Math.min(0.3, before(o)) : segs[k - 1].leadNext;
    let tail, leadNext = 0;
    if (next) {
      const adjacent = byI.get(next.i) === byI.get(o.i) + 1 && !(trim[o.i] && trim[o.i].b) && !(trim[next.i] && trim[next.i].a);
      const room = adjacent ? span(next).a - b : after(o) + before(next) - 0.08;
      // joins: a pause chosen per join (mid-sentence joins run on, sentence joins stay short); never more than the raw has
      const gap = joins[o.i] != null ? Math.min(joins[o.i], room)
        : sections.includes(next.i) ? Math.min(E.sectionGap, room)
        : adjacent ? Math.min(room, E.maxGap)
        : clamp(Math.min(after(o), before(next)), E.minJoin, E.maxJoin);
      tail = Math.min(gap - E.pre, after(o) - 0.03);
      leadNext = Math.min(gap - tail, before(next) - 0.03);
    } else tail = Math.min(E.endTail, after(o));
    segs.push({ i: o.i, s: fr(a - lead), e: fr(b + tail), leadNext, text: o.text });
  });
  for (let k = 1; k < segs.length; k++) if (segs[k].s < segs[k - 1].e) throw new Error(`overlap at island ${segs[k].i}`);
  let t = 0;
  const edl = segs.map(g => { const d = g.e - g.s; const r = { i: g.i, raw: [+g.s.toFixed(4), +g.e.toFixed(4)], cut: [+t.toFixed(4), +(t + d).toFixed(4)], text: g.text }; t += d; return r; });
  return { segs, edl, length: t };
}

/* the island that opens each script section (for the fuller pause before a section): first kept island whose first
   line belongs to a new section */
function sectionStarts(takes, script) {
  if (!script) return [];
  const secOf = new Map(script.lines.map(l => [l.id, l.section]));
  const out = []; let last = null;
  takes.filter(t => t.keep && t.lines.length).forEach(t => { const s = secOf.get(t.lines[0]); if (last != null && s !== last) out.push(t.i); last = s; });
  return out;
}

const PACING = { maxGap: 0.6, minJoin: 0.3, maxJoin: 0.55, pre: 0.06, fade: 0.008, sectionGap: 0.85, endTail: 0.3 };

module.exports = { parseScript, normWords, looksLikeCode, alignIsland, chooseTakes, planSegments, sectionStarts, stutterAt, PACING };
