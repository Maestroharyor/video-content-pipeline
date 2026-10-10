/* vo.json words → caption groups (captions.json) and SRT. Pure. */
const DEFAULTS = { maxWords: 5, maxChars: 22, gap: 0.6, maxDur: 2.5, linger: 1.0 };
const endsSentence = w => /[.!?]["')\]]?$/.test(w);

function groupWords(words, o = {}) {
  const c = Object.assign({}, DEFAULTS, o);
  const groups = [];
  let g = null;
  const close = () => { if (g && g.words.length) groups.push(g); g = null; };
  for (const w of words) {
    if (g) {
      const prev = g.words[g.words.length - 1];
      const chars = g.words.map(x => x.w).join(' ').length + 1 + w.w.length;
      // c.cuts: splice points (an intro cut in after the hook); a group never spans one
      const cut = (c.cuts || []).some(t => g.start < t && w.s >= t);
      if (cut || g.words.length >= c.maxWords || chars > c.maxChars || w.s - prev.e > c.gap || w.e - g.start > c.maxDur ||
          (endsSentence(prev.w) && g.words.length >= 2)) close();
    }
    if (!g) g = { start: w.s, end: w.e, words: [] };
    g.words.push({ w: w.w, s: w.s, e: w.e }); g.end = w.e;
  }
  close();
  // orphan fix: a single closing word after a long group joins it when it fits
  for (let i = 1; i < groups.length; i++) {
    const a = groups[i - 1], b = groups[i];
    if (b.words.length === 1 && a.words.length >= 4 && a.words.length < c.maxWords + 1 && b.start - a.end <= c.gap &&
        a.words.map(x => x.w).join(' ').length + 1 + b.words[0].w.length <= c.maxChars + 4) {
      a.words.push(b.words[0]); a.end = b.end; groups.splice(i, 1); i--;
    }
  }
  groups.forEach((x, i) => {
    const next = groups[i + 1], cut = Math.min(...(c.cuts || []).filter(t => t > x.start), Infinity);
    x.end = +Math.min(next ? next.start : Infinity, x.end + c.linger, Math.max(cut, x.end)).toFixed(3); x.start = +x.start.toFixed(3);
  });
  return groups;
}
const ts = s => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = Math.floor(s % 60), ms = Math.round((s - Math.floor(s)) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms).padStart(3, '0')}`; };
function srt(groups) {
  return groups.map((g, i) => `${i + 1}\n${ts(g.start)} --> ${ts(g.end)}\n${g.words.map(w => w.w).join(' ')}\n`).join('\n');
}
function buildCaptions(vo, style = {}, opts = {}) {
  return { version: 1, source: 'vo.json', style: Object.assign({ accent: 't' }, style), groups: groupWords(vo.words || [], opts) };
}
module.exports = { groupWords, srt, buildCaptions, DEFAULTS };
