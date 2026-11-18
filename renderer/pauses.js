/* Silent pauses inside a recording: the deck keeps playing while the voice and the face stop, so a viewer can read code
   the voiceover only names (react-to-solid's cheat sheet: fifteen cards on one six-second line).
   PROJECT.pauses = { from: 'aroll-clean.mp4', out: 'aroll-paused.mp4', at: [[seconds, length, fill?], …] } in RECORDING time.
   A gap is silence unless it has a fill = { audio, words }: narration recorded elsewhere (a take cut from the unedited
   recording) that plays from the gap's start, its words (seconds into the fill) merged into vo.json so beats can use them.
   scripts/pauses.js builds the longer footage and voice from these; this file is the time maths, kept pure for tests. */

/* sorted, validated gap list: [{at, dur, fill?}] with ascending, non-overlapping `at` (recording time) */
function normalise(list) {
  const gaps = (list || []).map(([at, dur, fill]) => Object.assign({ at: +at, dur: +dur }, fill ? { fill } : {}));
  /* a negative length is a cut: that much silence is taken out from `at` on (undo-git review 4: "reduce the pause before
     'So which one do you reach for?' by half" needed less than the recording's own gap) */
  for (const g of gaps) if (!(g.at >= 0) || !g.dur || g.fill && g.dur < 0) throw new Error(`bad pause ${JSON.stringify(g)}: need at >= 0, a non-zero length, and no fill on a cut`);
  gaps.sort((a, b) => a.at - b.at);
  for (let i = 1; i < gaps.length; i++) if (gaps[i].at === gaps[i - 1].at) throw new Error(`two pauses at ${gaps[i].at}s`);
  return gaps;
}

/* a recording time → its time in the paused source. A word that starts exactly on a gap moves after it, because the gap
   is the silence before the word. */
function shiftTime(t, gaps) {
  let add = 0;
  for (const g of gaps) {
    if (g.dur < 0 && t > g.at && t < g.at - g.dur) return g.at + add;   // inside a cut: lands on the cut point
    if (t >= g.at) add += g.dur;
  }
  return t + add;
}

/* where each gap starts in paused time (the gaps before it already added) */
function gapStart(g, gaps) { return g.at + gaps.filter(o => o.at < g.at).reduce((s, o) => s + o.dur, 0); }

/* where a word lands in paused time. A gap is placed in a silence, so a word that straddles one was aligned a little
   early (undo-git review 2: "then" aligned at 140.31, voiced from 140.45, the hold at 140.41): when most of the word lies
   after the gap it starts after the gap, keeping its length; otherwise it keeps its start. */
function shiftWord(w, gaps) {
  const g = gaps.find(o => w.s < o.at && w.e > o.at && o.at - w.s < (w.e - w.s) / 2);
  const s = g ? shiftTime(g.at, gaps) : shiftTime(w.s, gaps), len = g ? w.e - g.at : w.e - w.s;
  return { s, e: s + len };
}

/* vo.json in recording time → vo.json in paused time (words and segments; a segment that straddles a gap keeps its
   start and stretches its end). fillWords[i] = the words of gap i's fill, seconds into the fill; they join in order. */
function shiftVo(vo, gaps, fillWords = []) {
  const r = n => Math.round(n * 1000) / 1000;
  const total = gaps.reduce((s, g) => s + g.dur, 0);
  return Object.assign({}, vo, {
    duration: vo.duration != null ? r(vo.duration + total) : vo.duration,
    words: vo.words.map(w => { const t = shiftWord(w, gaps); return Object.assign({}, w, { s: r(t.s), e: r(t.e) }); })
      .concat(...gaps.map((g, i) => (fillWords[i] || []).map(w => Object.assign({}, w, { s: r(gapStart(g, gaps) + w.s), e: r(gapStart(g, gaps) + w.e) }))))
      .sort((a, b) => a.s - b.s),
    segments: (vo.segments || []).map(g => Object.assign({}, g, { s: r(shiftTime(g.s, gaps)), e: r(shiftTime(g.e - 1e-6, gaps) + 1e-6) })),
  });
}

/* the pieces to concatenate: [{from, to, pad, fill?}] in recording time; `to` null = to the end */
function pieces(gaps) {
  const out = [];
  let from = 0;
  for (const g of gaps) { out.push(Object.assign({ from, to: g.at, pad: Math.max(0, g.dur) }, g.fill ? { fill: g.fill } : {})); from = g.dur < 0 ? g.at - g.dur : g.at; }
  out.push({ from, to: null, pad: 0 });
  return out;
}

module.exports = { normalise, shiftTime, shiftWord, gapStart, shiftVo, pieces };
