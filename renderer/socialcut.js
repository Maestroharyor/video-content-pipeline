/* Pure maths for scripts/social-cut.js. A cut is a list of spans of a finished master. Spans and section starts are
   authored in VO time (the voiceover with any spliced intro removed), moved onto the master by toMaster, and laid
   end to end into cut time here. No I/O. */
const { resolveBeats } = require('./timeline');

const r3 = x => Math.round(x * 1000) / 1000;

/* A span authored as "this line .. up to the next line" is snapped to speech: it opens 0.08s before its first word
   (never into the previous word) and closes 0.25s after its last word (never into the next one, never past `to`),
   so a join never clips a syllable and never keeps a long dead pause. */
function snapSpan(words, from, to) {
  const inside = words.filter(w => w.s >= from - 0.05 && w.s < to - 0.05);
  if (!inside.length) throw new Error(`no words between ${from} and ${to}`);
  const first = inside[0], last = inside[inside.length - 1];
  const prev = words[words.indexOf(first) - 1], next = words[words.indexOf(last) + 1];
  // whisper stretches a sentence-final word's end over the following silence, so cap it at 0.9s. A number is the
  // exception: "8.2.35" is said as "eight point two point thirty-five" (1.8s in php2shell), and the cap clipped it, so
  // each digit group adds 0.3s
  const lastEnd = Math.min(last.e, last.s + 0.9 + 0.3 * ((last.w || '').match(/\d+/g) || []).length);
  // no earlier than the middle of the gap before it: an aligned word's end can be a frame or two early, and a start
  // right on it keeps the tail of the word before ("So" in front of "that is the whole path")
  const a = Math.max(first.s - 0.08, prev ? (prev.e + first.s) / 2 : 0);
  const b = Math.min(lastEnd + 0.25, next ? next.s - 0.02 : lastEnd + 0.25, to);
  return { from: r3(a), to: r3(b) };
}

/* VO time → master time. A splice inserts `head` seconds of intro at `at`, so everything after it moves. */
const toMaster = (t, splice) => (splice && t >= splice.at ? r3(t + splice.head) : r3(t));

/* A VO span that crosses the splice point becomes two master spans with the intro left out between them. */
function masterSpans(span, splice) {
  // a span that ends exactly on the splice point ends before the intro: toMaster would move its end past it
  if (splice && span.to <= splice.at) return [{ from: r3(span.from), to: r3(span.to) }];
  if (!splice || span.from >= splice.at) return [{ from: toMaster(span.from, splice), to: toMaster(span.to, splice) }];
  return [{ from: r3(span.from), to: r3(splice.at) }, { from: r3(splice.at + splice.head), to: r3(span.to + splice.head) }];
}

/* Master spans laid end to end: [{from, to, at}], `at` = where the span starts in the cut. */
function layout(spans) {
  let at = 0;
  return spans.map(s => { const o = { ...s, at: r3(at) }; at += s.to - s.from; return o; });
}
const cutLength = spans => r3(spans.reduce((n, s) => n + (s.to - s.from), 0));

/* Master time → cut time, or null when that moment was cut out. */
function toCut(t, laid) {
  const s = laid.find(x => t >= x.from && t < x.to);
  return s ? r3(s.at + t - s.from) : null;
}
/* Like toCut, but a moment that was cut out lands on the start of the next span that survives (a section title
   authored on a line the cut skips still appears where the cut resumes). */
function toCutOrNext(t, laid) {
  const c = toCut(t, laid);
  if (c != null) return c;
  const s = laid.find(x => x.from > t);
  return s ? s.at : null;
}

/* Master-time windows [[a, b, ...extra]] → the pieces of them that survive the cut, in cut time. Extra values (a face
   window's crop centre) ride along untouched. */
/* Face windows in cut time → every deck stretch between two of them at least `min` seconds long (default 2.5): a slide
   that shows for a moment between two face shots only flickers (ai-can-clone-apps, preview 1: "some frames only show
   for a split second"). The face shot before a short stretch ends earlier, when it keeps at least `keep` (1.5) s; it
   never runs longer, because outside its windows a reveal master is not on the face (a split, or the deck). Pure. */
function widenDeckGaps(wins, min, keep) {
  const m = min == null ? 2.5 : min, k = keep == null ? 1.5 : keep, out = wins.map(w => w.slice());
  for (let i = 0; i + 1 < out.length; i++) {
    const gap = out[i + 1][0] - out[i][1], end = out[i + 1][0] - m;
    if (gap > 0 && gap < m && end - out[i][0] >= k) out[i][1] = Math.round(end * 1000) / 1000;
  }
  return out;
}
function mapWindows(windows, laid) {
  const out = [];
  for (const s of laid) for (const [a0, b0, ...extra] of windows) {
    const a = Math.max(a0, s.from), b = Math.min(b0, s.to);
    if (b > a) out.push([r3(s.at + a - s.from), r3(s.at + b - s.from), ...extra]);
  }
  out.sort((p, q) => p[0] - q[0]);
  // pieces that touch across a join, with the same extras, are one window
  const same = (p, q) => p.length === q.length && p.slice(2).every((v, i) => v === q[i + 2]);
  return out.reduce((m, w) => { const l = m[m.length - 1]; if (l && w[0] - l[1] < 0.001 && same(l, w)) l[1] = w[1]; else m.push(w); return m; }, []);
}

/* The deck's own face windows → the cut's. A master whose reveals put the speaker on screen (PROJECT.reveals, VO time)
   shows the face there, and luma detection (--faces) cannot see a face under an over window's cards, so the opening
   hook would open on the deck. Every reveal window that shows the whole face (not a split; an over window counts, its
   cards are re-laid over the face) becomes a master-time face window [a, b, over]. A window that overlaps the CTA
   (PROJECT.cta: the subscribe bar burnt into the master) is left out: the bar does not fit a 9:16 crop. */
function revealFaces(reveals, splice, cta) {
  const end = t => (splice && t > splice.at ? r3(t + splice.head) : r3(t));   // a window that ends on the splice ends before the intro
  return (reveals || []).filter(w => !w.split && !(cta && w.at < cta.to && w.to > cta.at))
    .map(w => [toMaster(w.at, splice), end(w.to), !!w.over]);
}
/* Face windows from cuts.json [[a, b, x?]] and from the reveals [[a, b]] → one sorted list without overlaps, each with
   the crop centre `x` (its own, else the first one cuts.json gives: one camera, one framing; else 0.5). */
function mergeFaces(spec, extra) {
  const x0 = ((spec || []).find(w => w[2] != null) || [])[2];
  const all = [...(spec || []), ...(extra || []).map(([a, b]) => [a, b])].map(([a, b, x]) => [a, b, x != null ? x : x0 != null ? x0 : 0.5])
    .sort((p, q) => p[0] - q[0]);
  return all.reduce((m, w) => { const l = m[m.length - 1]; if (l && w[0] <= l[1] + 0.05) l[1] = Math.max(l[1], w[1]); else m.push(w.slice()); return m; }, []);
}
/* The deck slides an over window covers (at least `min` seconds of the slide inside it, VO time) → slide ids, drawn over
   the face in the cut (cuts.json overFace) rather than replaced by it. The cut shows each one only where it overlaps
   a face window (clampOvers), so a slide whose window outlasts the face goes back to its plain layout. */
function overSlides(reveals, slides, min = 0.5) {
  const over = (reveals || []).filter(w => w.over && !w.split);
  return (slides || []).filter(e => over.some(w => Math.min(e.end, w.to) - Math.max(e.start, w.at) >= min)).map(e => e.id);
}
/* An over-face clip [at, to] (cut time) → the pieces of it that lie inside the face windows (cut time). */
function clampOvers(at, to, faceWins) {
  return (faceWins || []).map(([a, b]) => [Math.max(at, a), Math.min(to, b)]).filter(([a, b]) => b - a > 0.001).map(([a, b]) => [r3(a), r3(b)]);
}

/* The deck for a cut, timed to the cut's own audio: the source deck's timeline (VO time), its cue-sheet rows, the cut's
   spans laid out in VO time ([{from, to, at}], see layout) and the cut's words (cut time) → a timeline in cut time.
   A slide is kept when at least `minKeep` seconds of its window survive (a span edge overlapping the next line by a
   few frames keeps nothing); it runs from where its kept part starts to where the next kept slide starts, so the
   windows tile 0..total, and one slide that spans a join keeps a single window across it. Its beats are resolved again
   from the cue sheet against the cut's words inside that window, so every element enters on its word in the cut; a
   beat whose words were cut falls back to the template's fraction schedule. Returns { tl, issues }. */
function cutTimeline({ tl, rows, laid, words, total, minKeep = 1 }) {
  const kept = [];
  for (const sl of tl.slides) {
    let a = null, len = 0;
    for (const s of laid) {
      const x = Math.max(sl.start, s.from), y = Math.min(sl.end, s.to);
      if (y > x) { a = a == null ? s.at + x - s.from : a; len += y - x; }
    }
    if (len >= minKeep) kept.push({ sl, a });
  }
  if (!kept.length) throw new Error('the cut keeps no slide');
  const issues = [], rowOf = {};
  rows.forEach(r => { rowOf[r.file.replace(/\.js$/, '')] = r; });
  const slides = kept.map(({ sl, a }, i) => {
    const e = { id: sl.id, slug: sl.slug, start: i ? r3(a) : 0, end: null };
    for (const k of ['xf', 'motion', 'audio']) if (sl[k] != null) e[k] = sl[k];
    return e;
  });
  slides.forEach((e, i) => {
    e.end = i < slides.length - 1 ? slides[i + 1].start : r3(total);
    const r = rowOf[e.slug];
    if (!r || !r.beats || !r.beats.length || e.audio) return;
    const res = resolveBeats(r.beats, words, e.start, e.end, { lead: tl.lead });
    /* a beat whose words were cut keeps its place in the story rather than the template's fraction schedule (which
       lit React Native's row on "and Flutter" once "React Native, yeah, gets a 4" was cut): said before the kept part,
       the element is already there when the slide opens; said after it, the element never comes */
    const src = kept[i].sl.beats || {}, a = kept[i].a;
    const from = laid.find(s => a >= s.at - 1e-6 && a < s.at + s.to - s.from), vStart = from ? from.from + a - from.at : -Infinity;
    // a beat counts as kept only when the moment it was said survives the cut: the cut's words are matched on their
    // first word alone when the full phrase is gone ("with" for "with 3s"), which lit cut rows at the slide's start
    r.beats.forEach(it => { if (res.beats[it.name] && src[it.name] && toCut(src[it.name][0] + (tl.lead || 0), laid) == null) delete res.beats[it.name]; });
    r.beats.forEach(it => {
      if (res.beats[it.name] || !src[it.name]) return;
      // vt: when the line was said in the full video; next: where the cut resumes after it (a gap inside the slide)
      const vt = src[it.name][0], next = toCutOrNext(vt, laid);
      res.beats[it.name] = vt < vStart ? [e.start, r3(e.start + 0.1)]
        : next != null && next < e.end - 1 ? [r3(next), r3(next + 0.1)]   // the slide resumes after a gap inside it
        : [r3(e.end + 60), r3(e.end + 60.1)];
      res.issues = res.issues.filter(t => !t.startsWith(`beat ${it.name} `));
      issues.push(`${e.id}: beat ${it.name} cut, ${res.beats[it.name][0] > e.end ? 'never shown' : 'shown from the start'}`);
    });
    /* a group member with no beat of its own trails the one before it (c2 after c1); once that one never comes, the
       template would squeeze it into the slide's last moment, so the unbeaten members after a never-shown one stay out */
    const never = n => res.beats[n] && res.beats[n][0] > e.end;
    Object.keys(res.beats).filter(never).forEach(n => {
      const m = n.match(/^([a-z]+)(\d+)$/);
      if (m) for (let k = +m[2] + 1; k <= +m[2] + 8 && !r.beats.some(it => it.name === m[1] + k); k++) res.beats[m[1] + k] = res.beats[n];
    });
    res.issues.forEach(t => issues.push(`${e.id}: ${t}`));
    if (Object.keys(res.beats).length) { e.beats = res.beats; if (res.hero) e.hero = res.hero; }
  });
  return { tl: { version: 1, fps: tl.fps, total: r3(total), vo: null, words: 'vo.json', xf: tl.xf, motion: tl.motion, lead: tl.lead, subset: true, slides }, issues };
}

/* The left edge of a 9:16 crop of a srcW-wide frame centred on a face at x (its centre as a fraction of the width,
   0.5 when not measured), clamped inside the frame. */
function faceCropPx(x, srcW, cropW) {
  return Math.round(Math.min(Math.max((x == null ? 0.5 : x) * srcW - cropW / 2, 0), srcW - cropW));
}

/* A screencast region [x, y, w, h] (source px) fitted inside a pane box {x, y, w, h} (output px): the largest even
   size that keeps the region's aspect, centred in the box. A screen window shows two of these, the editor over the
   browser, so a 16:9 recording reads on a 9:16 frame without either side being cropped away. */
function paneFit(rect, box) {
  const [x, y, w, h] = rect.map(Math.round), k = Math.min(box.w / w, box.h / h);
  const ow = 2 * Math.floor(w * k / 2), oh = 2 * Math.floor(h * k / 2);
  return { crop: [w, h, x, y], w: ow, h: oh, x: box.x + Math.round((box.w - ow) / 2), y: box.y + Math.round((box.h - oh) / 2) };
}

/* A screen window's two panes, the editor over the browser, as one group: the editor fitted to the area's width and
   at most `maxH` tall, the browser to the width and whatever height is left, the two `gap` apart, the pair centred
   vertically in the area. Centring each pane in its own half left a dead band between a wide editor crop and the
   browser. Returns [codeFit, webFit] (paneFit shapes). */
function stackPanes(code, web, area, gap, maxH) {
  const a = paneFit(code, { x: area.x, y: 0, w: area.w, h: maxH }), b = paneFit(web, { x: area.x, y: 0, w: area.w, h: area.h - a.h - gap });
  const y0 = area.y + Math.max(0, Math.round((area.h - (a.h + gap + b.h)) / 2));
  return [{ ...a, y: y0 }, { ...b, y: y0 + a.h + gap }];
}

/* Words in VO time → the cut's own vo.json words: only those whose start survives, clipped to their span. */
function cutWords(words, splice, laid) {
  const out = [];
  for (const w of words) {
    const s = toMaster(w.s, splice), span = laid.find(x => s >= x.from && s < x.to);
    if (!span) continue;
    const e = Math.min(toMaster(w.e, splice), span.to);
    out.push({ ...w, s: r3(span.at + s - span.from), e: r3(span.at + e - span.from) });
  }
  return out;
}

/* Face windows from a per-frame mean-luma track: the talking head is lit footage, the decks are near-black, so a
   threshold splits them. Runs shorter than minLen (a flash in an intro, a white slide) are dropped, and runs split
   by less than maxGap (a whip pan or a blink of motion blur in the footage) are one window. */
function facesFromLuma(means, fps, thr = 70, minLen = 0.6, maxGap = 0.25) {
  const out = []; let a = null;
  means.forEach((m, i) => {
    const last = i === means.length - 1;
    if (m > thr && a == null) a = i;
    if (a != null && (m <= thr || last)) {
      const b = m > thr ? i + 1 : i;
      if ((b - a) / fps >= minLen) out.push([r3(a / fps), r3(b / fps)]);
      a = null;
    }
  });
  return out.reduce((m, w) => { const l = m[m.length - 1]; if (l && w[0] - l[1] < maxGap) l[1] = w[1]; else m.push(w); return m; }, []);
}

/* A stacked cut (cuts.json "stack") shows the 16:9 deck through a narrower window (4:3) that follows the action. `E` is
   a motion track of the deck in cut time: E[k] = changed pixels per column between analysis frame k and k-1 (null at
   the first frame of a span, where the picture jumps), `fps` its rate. The window is `win` of the frame's width.
   `bounds` = [[t, kind]] where the framing is decided again: 'cut' (a span join: jump) or 'glide' (a slide boundary:
   ease over `glide` s). Inside a stretch the window holds still and moves only when the action leaves it by more than
   `dead` of its travel, so typing does not drag it around. Returns keys [[t, f]], f = the window's left edge as a
   fraction of its travel (0 left, 1 right), for a piecewise-eased crop (cropExpr). Pure. */
function followCrop(E, fps, total, bounds, o = {}) {
  const win = o.win == null ? 0.75 : o.win, glide = o.glide || 0.6, dead = o.dead == null ? 0.3 : o.dead,
    look = o.look || 1.5, minE = o.minE == null ? 40 : o.minE, step = o.step || 0.5;
  const C = (E.find(Boolean) || []).length;
  if (!C) return [[0, 0.5]];
  const w = Math.round(C * win), travel = C - w;
  // the window placement [0..1] that holds the most motion in frames [t0, t1), the one nearest `pref` among ties
  const best = (t0, t1, pref) => {
    const S = new Float64Array(C);
    for (let k = Math.max(0, Math.floor(t0 * fps)); k < Math.min(E.length, Math.ceil(t1 * fps)); k++) if (E[k]) for (let c = 0; c < C; c++) S[c] += E[k][c];
    let tot = 0; for (let c = 0; c < C; c++) tot += S[c];
    if (tot < minE) return null;
    let run = 0; for (let c = 0; c < w; c++) run += S[c];
    const sums = [run];
    for (let s = 1; s <= travel; s++) { run += S[s + w - 1] - S[s - 1]; sums.push(run); }
    const top = Math.max(...sums);
    let pick = null;
    sums.forEach((v, s) => { if (v >= top * 0.97) { const f = travel ? s / travel : 0.5; if (pick == null || Math.abs(f - pref) < Math.abs(pick - pref)) pick = f; } });
    return pick;
  };
  const B = [...bounds].filter(([t]) => t > 0 && t < total).sort((p, q) => p[0] - q[0]);
  const segs = [[0, 'cut'], ...B].map(([t, kind], i, a) => ({ a: t, b: i + 1 < a.length ? a[i + 1][0] : total, kind }));
  const keys = []; let cur = 0.5;
  const push = (t, f) => { const r = Math.round(f * 1000) / 1000; if (keys.length && t <= keys[keys.length - 1][0]) keys[keys.length - 1][1] = r; else keys.push([r3(t), r]); };
  segs.forEach(({ a, b, kind }, i) => {
    const first = best(a, Math.min(b, a + 3), cur), next = first != null ? first : best(a, b, cur);
    const f = next != null ? next : cur;
    if (i === 0 || kind === 'cut') { if (keys.length) push(a - 0.001, cur); push(a, f); }
    else { push(a, cur); push(Math.min(b, a + glide), f); }
    cur = f;
    for (let t = a + glide + step; t < b - glide; t += step) {
      const g = best(Math.max(a, t - look), Math.min(b, t + look), cur);
      if (g != null && Math.abs(g - cur) > dead) { push(t, cur); push(t + glide, g); cur = g; t += glide; }
    }
  });
  return keys;
}

/* keys [[t, f]] → an ffmpeg expression in t for the crop's x (px): each step between two keys eased (smoothstep), held
   flat before the first and after the last. `travel` = source width minus the crop width. */
function cropExpr(keys, travel) {
  const px = f => Math.round(f * travel);
  if (keys.length === 1) return String(px(keys[0][1]));
  let e = String(px(keys[keys.length - 1][1]));
  for (let i = keys.length - 2; i >= 0; i--) {
    const [t0, f0] = keys[i], [t1, f1] = keys[i + 1], x0 = px(f0), x1 = px(f1);
    const seg = x0 === x1 ? String(x0) : `${x0}+${x1 - x0}*(3*pow((t-${t0})/${r3(t1 - t0)},2)-2*pow((t-${t0})/${r3(t1 - t0)},3))`;
    e = `if(lt(t,${t1}),${seg},${e})`;
  }
  return `if(lt(t,${keys[0][0]}),${px(keys[0][1])},${e})`;
}

module.exports = { followCrop, cropExpr, widenDeckGaps, revealFaces, mergeFaces, overSlides, clampOvers, snapSpan, cutTimeline, toMaster, masterSpans, layout, cutLength, toCut, toCutOrNext, mapWindows, faceCropPx, paneFit, stackPanes, cutWords, facesFromLuma };
