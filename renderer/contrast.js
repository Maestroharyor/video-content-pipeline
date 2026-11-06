/* WCAG colour maths for the probe's readability check (scripts/probe.js runs it in the page via toString, so every
   function here must be self-contained: no closures over module scope, no requires). */
// computed colours come as rgb()/rgba() or, from color-mix(), as color(srgb r g b / a) in 0-1
function parseColor(c) {
  const m = String(c).replace(/^color\(srgb/, '').match(/[\d.]+/g);
  if (!m) return null;
  const k = /^color\(/.test(c) ? 255 : 1;
  return [m[0] * k, m[1] * k, m[2] * k, m[3] == null ? 1 : +m[3]];
}
// colour a with alpha laid over the opaque colour b
function composite(a, b) { return [0, 1, 2].map(i => a[i] * a[3] + b[i] * (1 - a[3])).concat(1); }
function luminance(c) {
  const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
  return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]);
}
// contrast of text colour fg (may be translucent) on the opaque background bg, as the WCAG ratio (1-21)
function contrastRatio(fg, bg) {
  const L1 = luminance(composite(fg, bg)), L2 = luminance(bg);
  return (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
}
// AA threshold: 3:1 for large text (32px, or 24px at weight 700+), 4.5:1 otherwise
function minContrast(px, weight) { return px >= 32 || (px >= 24 && weight >= 700) ? 3 : 4.5; }
module.exports = { parseColor, composite, luminance, contrastRatio, minContrast };
