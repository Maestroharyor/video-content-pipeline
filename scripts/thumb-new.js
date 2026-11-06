#!/usr/bin/env node
/* thumb-new: scaffold projects/<video>-thumbs/ from core/thumbs-skeleton (the /new-thumbnail skill's Step 3).
   Every thumbs project used to be copied by hand from the last one; this gives the same shape every time:
   project.js (PROJECT.thumbs + the probe contract), index.html (engine scripts synced by the renderer), kit.js
   (window.TK, the shared core), slides/01-hook.js (a starter), render.sh (drafts), SOURCES.md, assets/{faces,logos},
   research/ (npm run yt-research writes there), renders/candidates/.
   usage: npm run thumb-new -- --video <slug> [--title "..."] [--out <dir>] [--force]
          (--title defaults to the video's PROJECT.title; --out defaults to projects/<slug>-thumbs) */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SK = path.join(ROOT, 'core', 'thumbs-skeleton');

/* the video's title from its project.js, read as text (project.js is a browser script) */
function videoTitle(slug) {
  const f = path.join(ROOT, 'projects', slug, 'project.js');
  if (!fs.existsSync(f)) return null;
  const m = fs.readFileSync(f, 'utf8').match(/\btitle:\s*(['"`])((?:\\.|(?!\1).)*)\1/);
  return m ? m[2].replace(/\\(['"`])/g, '$1') : null;
}

/* the placeholders, filled in the skeleton's text files. Pure */
function fill(text, v) {
  return text.replace(/__SLUG__|__VIDEO__|__TITLE__/g, k => ({ __SLUG__: v.slug, __VIDEO__: v.video, __TITLE__: v.title.replace(/'/g, "\\'") }[k]));
}

function scaffold({ video, title, out, force }) {
  if (!video || !/^[a-z0-9-]+$/.test(video)) throw new Error('usage: npm run thumb-new -- --video <slug> [--title "..."] [--out <dir>] [--force]');
  const dir = out || path.join(ROOT, 'projects', video + '-thumbs');
  if (fs.existsSync(path.join(dir, 'project.js')) && !force) throw new Error(path.relative(ROOT, dir) + ' already exists (pass --force to overwrite its skeleton files; slides and renders are kept)');
  const v = { slug: path.basename(dir), video, title: title || videoTitle(video) || video };
  for (const d of ['slides', 'assets/faces', 'assets/logos', 'research', 'renders/candidates']) fs.mkdirSync(path.join(dir, d), { recursive: true });
  for (const f of ['project.js', 'index.html', 'kit.js', 'SOURCES.md']) {
    const to = path.join(dir, f === 'SOURCES.md' ? 'assets/SOURCES.md' : f);
    fs.writeFileSync(to, fill(fs.readFileSync(path.join(SK, f), 'utf8'), v));
  }
  fs.copyFileSync(path.join(SK, 'render.sh'), path.join(dir, 'render.sh'));
  fs.chmodSync(path.join(dir, 'render.sh'), 0o755);
  if (!fs.readdirSync(path.join(dir, 'slides')).length) fs.copyFileSync(path.join(SK, 'slides', '01-hook.js'), path.join(dir, 'slides', '01-hook.js'));
  return { dir, ...v };
}

if (require.main === module) {
  const argv = process.argv.slice(2), get = k => { const i = argv.indexOf(k); return i < 0 ? null : argv[i + 1]; };
  try {
    const r = scaffold({ video: get('--video'), title: get('--title'), out: get('--out') && path.resolve(get('--out')), force: argv.includes('--force') });
    const rel = path.relative(ROOT, r.dir);
    console.log(`created ${rel} for "${r.title}"
  next: research   npm run yt-research -- --out ${rel}/research --queries "…" --channels "…" --min-age 0
        palette    set TK.C in ${rel}/kit.js from the video's theme CSS
        faces      swift scripts/cutout.swift <frame.png> ${rel}/assets/faces/tNN.png --mode subject --crop
        drafts     ./${rel}/render.sh "01" "off"
        export     npm run thumb -- --project ${r.slug} --slide 01 --var v=1
        check      npm run thumb-check -- --project ${r.slug} --all`);
  } catch (e) { console.error(e.message || e); process.exit(1); }
}
module.exports = { scaffold, fill, videoTitle };
