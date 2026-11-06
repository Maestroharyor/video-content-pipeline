/* One folder per video, projects/<slug>/deliver/, holding every finished file the user posts, in two flat
   subfolders: video/ (the masters, the thumbnail, the vertical cuts with their captions, the video's copy) and
   posts/ (the image posts from ../image-content-pipeline, the carousel and their copy). The renders stay where each
   pipeline writes them; this hard-links them in under names that say what they are, so a 4K master costs no extra
   disk. Previews and drafts never land here.
   plan() is pure path maths over what exists; apply() links, writes the generated files and removes whatever an
   earlier gather put there whose source has since gone (tracked in deliver/.manifest.json). */
const fs = require('fs');
const path = require('path');

const VID_ROOT = path.resolve(__dirname, '..');
const DRAFT = /-preview|-part\b|^deck|^source/;

const V = n => 'video/' + n, P = n => 'posts/' + n;
const exists = f => fs.existsSync(f);
const ls = d => (exists(d) ? fs.readdirSync(d).sort() : []);
const isDir = d => exists(d) && fs.statSync(d).isDirectory();

function roots(o = {}) {
  const vid = o.vid || VID_ROOT;
  return { vid, img: o.img || process.env.IMG_ROOT || path.resolve(vid, '..', 'image-content-pipeline') };
}

/* projects/x/social → x, projects/x-thumbs → x, a bare slug → itself. In either repo. */
function baseSlug(dirOrSlug, R = roots()) {
  const abs = path.resolve(dirOrSlug);
  const projectsOf = d => path.basename(path.dirname(d)) === 'projects';
  let slug = path.basename(abs);
  if (!projectsOf(abs) && isDir(abs) && exists(path.join(abs, '..', 'project.js'))) slug = path.basename(path.dirname(abs));
  else if (!isDir(abs)) slug = dirOrSlug.split(/[\\/]/)[0];
  const stripped = slug.replace(/-(thumbs|social|vertical)$/, '');
  return stripped !== slug && (isDir(path.join(R.vid, 'projects', stripped)) || isDir(path.join(R.img, 'projects', stripped))) ? stripped : slug;
}

/* the folder: the video project's, or the image project's when there is no video */
function destOf(slug, R = roots()) {
  const vid = path.join(R.vid, 'projects', slug);
  return path.join(isDir(vid) ? vid : path.join(R.img, 'projects', slug), 'deliver');
}

const copyFiles = d => ls(d).filter(f => f.endsWith('.md') && exists(path.join(d, f.replace(/\.md$/, '.json'))));

function srtToText(srt) {
  const words = srt.split(/\r?\n/).filter(l => l.trim() && !/^\d+$/.test(l.trim()) && !l.includes('-->')).join(' ').split(/\s+/);
  const lines = [''];
  for (const w of words) {
    if (lines[lines.length - 1].length + w.length + 1 > 100) lines.push('');
    lines[lines.length - 1] += (lines[lines.length - 1] ? ' ' : '') + w;
  }
  return lines.join('\n') + '\n';
}

/* → [{ name, src }] to link, and [{ name, text }] to write */
function plan(slug, R = roots()) {
  const out = [];
  const add = (name, src) => out.push({ name, src });
  const vp = path.join(R.vid, 'projects', slug);

  // the masters: dual A and B, plus a whole-deck vertical render
  // (a --variant render writes renders/<variant>/final, so every such folder counts, vertical among them)
  const finals = ['final', ...ls(path.join(vp, 'renders')).map(d => d + '/final').filter(d => exists(path.join(vp, 'renders', d)))];
  for (const [d, f] of finals.flatMap(d => ls(path.join(vp, 'renders', d)).map(f => [d, f]))) {
    if (!/\.(mp4|srt)$/.test(f) || DRAFT.test(f) || !f.startsWith(slug)) continue;
    const rest = f.slice(slug.length);
    const name = /^-reveal/.test(rest) ? slug + '-master-face' + rest.slice('-reveal'.length)
      : /^-vertical/.test(rest) ? slug + '-vertical-full' + rest.slice('-vertical'.length) : slug + '-master' + rest;
    add(V(name), path.join(vp, 'renders', d, f));
  }

  // the thumbnail: the newest export wins, a tie goes to the JPG (npm run thumb writes a PNG under 2 MB since 2026-11-04; older picks are JPEGs)
  const td = path.join(R.vid, 'projects', slug + '-thumbs', 'renders');
  const thumb = ls(td).filter(f => /thumbnail\.(jpg|png)$/.test(f)).sort((a, b) => fs.statSync(path.join(td, b)).mtimeMs - fs.statSync(path.join(td, a)).mtimeMs || (b.endsWith('.jpg') - a.endsWith('.jpg')))[0];   // a tie: the JPG
  if (thumb) add(V(slug + '-thumbnail' + path.extname(thumb)), path.join(td, thumb));

  // the vertical cuts, from the nested social project or an older <slug>-social sibling
  const text = [];
  for (const sp of [path.join(vp, 'social'), path.join(R.vid, 'projects', slug + '-social')]) {
    const cutsDir = path.join(sp, 'renders', 'social');
    for (const cut of ls(cutsDir).filter(c => isDir(path.join(cutsDir, c)))) {
      for (const f of ls(path.join(cutsDir, cut))) {
        const m = f.match(new RegExp('-' + cut.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\.mp4|\\.srt)$'));
        if (!m || DRAFT.test(f)) continue;
        const src = path.join(cutsDir, cut, f);
        add(V(`${slug}-vertical-${cut}${m[1]}`), src);
        if (m[1] === '.srt') text.push({ name: V(`${slug}-vertical-${cut}-transcript.txt`), text: srtToText(fs.readFileSync(src, 'utf8')) });
      }
    }
    const md = copyFiles(sp);
    md.forEach(f => add(V(md.length === 1 ? `${slug}-copy-video.md` : `${slug}-copy-video-${path.basename(f, '.md')}.md`), path.join(sp, f)));
  }

  // the image posts
  const ip = path.join(R.img, 'projects', slug);
  const nameOf = {};
  const design = ls(path.join(ip, 'out', 'design')).filter(f => f.endsWith('.png')).map(f => [f, ...f.slice(0, -4).split('--')]);
  const multi = (i, f) => new Set(design.filter(d => d[1] === f[1]).map(d => d[i])).size > 1;
  for (const d of design) {
    const name = 'card-' + d[1] + (multi(2, d) ? '-' + d[2] : '') + (new Set(design.map(x => x[3])).size > 1 ? '-' + d[3] : '') + '.png';
    nameOf['out/design/' + d[0]] = nameOf[d[1]] = name;
    add(P(name), path.join(ip, 'out', 'design', d[0]));
  }
  const slides = ls(path.join(ip, 'out', 'carousel')).filter(f => f.endsWith('.png')).map(f => {
    const [nn, id, ratio] = f.slice(0, -4).split('--');
    return { f, nn, ratio, series: id.replace(/-\d+$/, '') };
  });
  const series = [...new Set(slides.map(s => s.series))], ratios = new Set(slides.map(s => s.ratio));
  for (const s of slides) {
    const mm = String(slides.filter(x => x.series === s.series && x.ratio === s.ratio).length).padStart(2, '0');
    const name = 'carousel-' + (series.length > 1 ? s.series + '-' : '') + `${s.nn}-of-${mm}` + (ratios.size > 1 ? '-' + s.ratio : '') + '.png';
    nameOf['out/carousel/' + s.f] = name;
    add(P(name), path.join(ip, 'out', 'carousel', s.f));
  }
  if (exists(path.join(ip, 'out', 'contact-sheet.png'))) add(P('0-contact-sheet.png'), path.join(ip, 'out', 'contact-sheet.png'));

  // the image posts' copy, one file: carousels first, then content.json's order, each under a heading naming its image
  const md = copyFiles(path.join(ip, 'social'));
  if (md.length) {
    const spec = exists(path.join(ip, 'content.json')) ? JSON.parse(fs.readFileSync(path.join(ip, 'content.json'), 'utf8')) : { ideas: [] };
    const ideas = spec.ideas || [];
    const order = id => { const i = ideas.findIndex(x => x.id === id); return i < 0 ? 1e6 : ideas[i].slide ? i - 1e6 : i; };
    const ids = md.map(f => path.basename(f, '.md')).sort((a, b) => order(a) - order(b));
    const parts = ids.map((id, n) => {
      const doc = JSON.parse(fs.readFileSync(path.join(ip, 'social', id + '.json'), 'utf8'));
      const asset = (doc.source && doc.source.asset || '').replace(/^projects\/[^/]+\//, '');
      const s = slides.find(x => 'out/carousel/' + x.f === asset);
      const run = s && slides.filter(x => x.series === s.series && x.ratio === s.ratio).map(x => nameOf['out/carousel/' + x.f]);
      // a re-render under another layout renames the file, so a stale asset path still finds the idea's card by its id
      const image = run ? `${run[0]} to ${run[run.length - 1]} (${run.length} slides)` : nameOf[asset] || nameOf[id] || asset;
      return `# POST ${n + 1}: ${id}\nImage: ${image}\n\n` + fs.readFileSync(path.join(ip, 'social', id + '.md'), 'utf8').split('\n').slice(1).join('\n').trim();
    });
    text.push({ name: P(`${slug}-copy-posts.md`), text: parts.join('\n\n========================================\n\n') + '\n' });
  }
  return { link: out, write: text };
}

function link(src, dest) {
  if (exists(dest)) {
    const a = fs.statSync(src), b = fs.statSync(dest);
    if (a.ino === b.ino && a.dev === b.dev) return;
    fs.rmSync(dest);
  }
  try { fs.linkSync(src, dest); } catch { fs.copyFileSync(src, dest); }   // another disk: a copy instead
}

function apply(dest, p) {
  fs.mkdirSync(dest, { recursive: true });
  const mf = path.join(dest, '.manifest.json');
  const before = exists(mf) ? JSON.parse(fs.readFileSync(mf, 'utf8')) : [];
  const names = [...p.link.map(x => x.name), ...p.write.map(x => x.name)];
  for (const n of before) if (!names.includes(n)) fs.rmSync(path.join(dest, n), { force: true });
  for (const d of new Set(names.map(n => path.dirname(n)))) fs.mkdirSync(path.join(dest, d), { recursive: true });
  for (const x of p.link) link(x.src, path.join(dest, x.name));
  for (const x of p.write) fs.writeFileSync(path.join(dest, x.name), x.text);
  for (const d of ['video', 'posts']) if (isDir(path.join(dest, d)) && !ls(path.join(dest, d)).length) fs.rmdirSync(path.join(dest, d));
  fs.writeFileSync(mf, JSON.stringify(names.sort(), null, 1) + '\n');
  return names;
}

/* the hook every finishing command calls; a gather that fails warns and never fails the render behind it */
function run(dirOrSlug, o = {}) {
  try {
    const R = roots(o), slug = baseSlug(dirOrSlug, R), dest = destOf(slug, R);
    const names = apply(dest, plan(slug, R));
    console.log(`deliver → ${path.relative(process.cwd(), dest) || dest}  (${names.length} files)`);
    return dest;
  } catch (e) { console.warn('deliver: ' + (e.message || e)); return null; }
}

module.exports = { roots, baseSlug, destOf, plan, apply, run, srtToText };
