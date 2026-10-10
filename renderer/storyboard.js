/* Script/transcript parsing → VO windows. Pure; used by scripts/script-to-storyboard.js and the tests.
   parseScript(src, {wps}) accepts, in this order of detection:
     - whisper vo.json (object with words[] / segments[])            → real timings
     - SRT / WebVTT                                                  → real timings
     - text with (m:ss) / (m:ss.ss) / (h:mm:ss) markers anywhere     → real timings
     - plain prose                                                   → one window per sentence at wps words/s, estimated:true */
const mmss = s => { const m = Math.floor(s / 60), ss = Math.round(s % 60); return m + ':' + String(ss).padStart(2, '0'); };
const words = t => t.trim() ? t.trim().split(/\s+/).length : 0;
const secs = (h, m, s) => (+h || 0) * 3600 + (+m || 0) * 60 + parseFloat(s || 0);

function finish(segs, wps) {
  segs = segs.filter(s => s.text);
  segs.forEach((s, i) => { if (s.end == null) s.end = segs[i + 1] ? segs[i + 1].start : s.start + Math.max(1, words(s.text) / wps); });
  return segs.map(s => ({ start: +s.start.toFixed(2), end: +s.end.toFixed(2), window: mmss(s.start) + '-' + mmss(s.end),
    words: words(s.text), estimated: !!s.estimated, text: s.text.replace(/\s+/g, ' ').trim() }));
}
function fromWhisper(vo) {
  if (Array.isArray(vo.segments) && vo.segments.length) return vo.segments.map(s => ({ start: s.s, end: s.e, text: s.text }));
  // fall back to sentences built from words
  const segs = []; let cur = null;
  for (const w of vo.words || []) {
    if (!cur) cur = { start: w.s, text: '' };
    cur.text += (cur.text ? ' ' : '') + w.w; cur.end = w.e;
    if (/[.!?]["')\]]?$/.test(w.w)) { segs.push(cur); cur = null; }
  }
  if (cur) segs.push(cur);
  return segs;
}
function fromSubs(src) {
  const segs = [];
  const re = /(\d+:)?(\d{1,2}):(\d{2})[.,](\d{1,3})\s*-->\s*(\d+:)?(\d{1,2}):(\d{2})[.,](\d{1,3})[^\n]*\n([\s\S]*?)(?=\n\s*\n|\s*$)/g;
  let m;
  while ((m = re.exec(src))) {
    const st = secs(m[1], m[2], m[3] + '.' + m[4].padEnd(3, '0')), en = secs(m[5], m[6], m[7] + '.' + m[8].padEnd(3, '0'));
    const text = m[9].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (text) segs.push({ start: st, end: en, text });
  }
  return segs;
}
function fromMarkers(src) {
  const parts = src.split(/\((?:(\d+):)?(\d+):(\d\d(?:\.\d+)?)\)/);
  const segs = [];
  for (let i = 1; i < parts.length; i += 4) segs.push({ start: secs(parts[i], parts[i + 1], parts[i + 2]), text: (parts[i + 3] || '').trim() });
  return segs;
}
function fromProse(src, wps) {
  const flat = src.replace(/\s+/g, ' ').trim();
  const sents = flat.match(/[^.!?]+[.!?]+["')\]]?/g) || (flat ? [flat] : []);
  const tail = flat.slice(sents.join('').length).trim(); if (tail) sents.push(tail);
  let t = 0;
  return sents.map(s => { const text = s.trim(), d = Math.max(1, words(text) / wps); const seg = { start: t, end: t + d, text, estimated: true }; t += d; return seg; });
}
function parseScript(src, o = {}) {
  const wps = +o.wps || 2.6;
  src = String(src || '');
  let segs = null, kind = 'prose';
  const trimmed = src.trim();
  if (trimmed.startsWith('{')) { try { const j = JSON.parse(trimmed); if (j.words || j.segments) { segs = fromWhisper(j); kind = 'whisper'; } } catch {} }
  if (!segs && /-->/.test(src)) { segs = fromSubs(src); kind = 'subtitles'; }
  if (!segs && /\((\d+:)?\d+:\d\d(\.\d+)?\)/.test(src)) { segs = fromMarkers(src); kind = 'markers'; }
  if (!segs) segs = fromProse(src, wps);
  const lines = finish(segs, wps);
  return { kind, total: lines.length ? lines[lines.length - 1].end : 0, estimated: !!(lines[0] && lines[0].estimated), lines };
}
function toMarkdown(sb, wps) {
  const out = ['| Start | End | Window | Words | Line |', '|---|---|---|---|---|'];
  sb.lines.forEach(s => out.push(`| ${s.start} | ${s.end} | ${s.window}${s.estimated ? ' (est.)' : ''} | ${s.words} | ${s.text.replace(/\|/g, '/')} |`));
  out.push('', `Total ${mmss(sb.total)} · ${sb.lines.length} lines · ${sb.lines.reduce((n, s) => n + s.words, 0)} words${sb.estimated ? ' · timings estimated at ' + wps + ' words/s' : ' · source: ' + sb.kind}`);
  return out.join('\n');
}
module.exports = { parseScript, toMarkdown, mmss };
