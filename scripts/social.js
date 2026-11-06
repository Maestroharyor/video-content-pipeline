#!/usr/bin/env node
/* Per-network post copy: you write social.json, this renders and checks social.md.

     npm run social -- --project <slug> --rules                  # the rules to write against
     npm run social -- --project <slug> --init [--platforms a,b] # an empty stub to write into
     npm run social -- --project <slug>                          # render + check → social/<id>.md
     npm run social -- --project <slug> --check                  # validate only, write nothing
     npm run social -- --in <file.json> --out <dir>              # no project (tests, one-offs)

   The script never writes copy. It supplies the rules, counts every block and fails on anything over
   a platform's hard cap; exit 1 is the gate. social.md is derived, so edit social.json and re-run. */
const fs = require('fs'), path = require('path');
const { ROOT, loadProject } = require('../renderer/project');
const { loadBrand } = require('../renderer/brand');
const { run: deliver } = require('../renderer/deliver');

const a = process.argv.slice(2);
const val = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
const opt = {
  project: val('--project') || val('-p'), id: val('--id'), platforms: val('--platforms'),
  in: val('--in'), out: val('--out'), init: a.includes('--init'), rules: a.includes('--rules'),
  check: a.includes('--check'), force: a.includes('--force'), noHashtags: a.includes('--no-hashtags'),
};

/* The video repo has one brand, in core/brand.js, overridden per project by project.js → social. */
function loadTarget(o) {
  const { dir, project } = loadProject(o.project);
  const mp4 = path.join('renders', 'final', project.slug + '.mp4');
  const poster = path.join('renders', 'poster');
  const posters = fs.existsSync(path.join(dir, poster)) ? fs.readdirSync(path.join(dir, poster)).filter(f => f.endsWith('.png')).sort() : [];
  return {
    dir, project, brand: loadBrand(project),
    source: {
      repo: 'vid', project: project.slug,
      asset: fs.existsSync(path.join(dir, mp4)) ? mp4 : '',
      poster: posters.length ? path.join(poster, posters[0]) : '',
    },
  };
}

const PL = require('../renderer/platforms');
const { PLATFORMS, DEFAULTS, ALT_CAP, ALT_SOFT, fieldsOf, count, hasUrl, normTags, appendTags } = PL;

const die = m => { console.error(m); process.exit(1); };

/* ---- what to work on ---- */
const wanted = (opt.platforms ? String(opt.platforms).split(',').map(s => s.trim()).filter(Boolean) : null);
if (wanted) for (const k of wanted) if (!PLATFORMS[k]) die('unknown platform ' + k + '\nhave: ' + Object.keys(PLATFORMS).join(', '));

if (opt.rules) { printRules(wanted || DEFAULTS); process.exit(0); }

let jsonFile, outDir, slug, brand;
if (opt.in) {
  jsonFile = path.resolve(opt.in);
  outDir = path.resolve(opt.out || path.dirname(jsonFile));
  slug = path.basename(jsonFile, '.json');
  brand = null;                                   /* --in reads the brand from the file itself */
} else {
  const loaded = loadTarget(opt);                 /* repo-specific: sets dir, project, brand */
  const socialDir = path.join(loaded.dir, 'social');
  const existing = fs.existsSync(socialDir) ? fs.readdirSync(socialDir).filter(f => f.endsWith('.json')).sort() : [];
  slug = opt.id || (existing.length === 1 ? path.basename(existing[0], '.json') : (loaded.defaultId || loaded.project.slug));
  jsonFile = path.join(socialDir, slug + '.json');
  outDir = socialDir;
  brand = loaded.brand;
  if (opt.init) {
    if (fs.existsSync(jsonFile) && !opt.force) die(rel(jsonFile) + ' already exists. Edit it, or pass --force to start over.');
    fs.mkdirSync(socialDir, { recursive: true });
    fs.writeFileSync(jsonFile, JSON.stringify(stub(wanted || DEFAULTS, slug, loaded), null, 2) + '\n');
    const n = (wanted || DEFAULTS).length;
    console.log('→ ' + rel(jsonFile) + '  (' + n + ' platform' + (n === 1 ? '' : 's') + ', every field empty)');
    console.log('   write the copy into it, then: npm run social -- --project ' + loaded.project.slug
      + (slug === loaded.project.slug ? '' : ' --id ' + slug));
    process.exit(0);
  }
}

if (!fs.existsSync(jsonFile)) die('no ' + rel(jsonFile) + '. Start it with: npm run social -- --project <slug> --init');
let doc;
try { doc = JSON.parse(fs.readFileSync(jsonFile, 'utf8')); }
catch (e) { die(rel(jsonFile) + ': ' + e.message); }

const result = render(doc, brand, wanted);
for (const line of result.report) console.log(line);

if (result.errors.length) {
  console.error('\n' + result.errors.length + ' problem(s):');
  for (const e of result.errors) console.error('  ' + e);
  console.error('\nfix ' + rel(jsonFile) + ' and run again. Nothing was written.');
  process.exit(1);
}
if (opt.check) { console.log('\nsocial ok (--check: nothing written)'); process.exit(0); }

fs.mkdirSync(outDir, { recursive: true });
const mdFile = path.join(outDir, slug + '.md');
fs.writeFileSync(mdFile, result.md);
console.log('\n→ ' + rel(mdFile) + '  (' + result.blocks + ' blocks' + (result.warns ? ', ' + result.warns + ' warning(s) above' : '') + ')');
if (!opt.in) deliver(path.dirname(outDir));

/* ---------------------------------------------------------------- */

function rel(f) { return path.relative(ROOT, f) || f; }

function stub(keys, id, loaded) {
  const platforms = {};
  for (const k of keys) {
    const o = {};
    for (const f of fieldsOf(k)) o[f.key] = '';
    if (PLATFORMS[k].hashtags) o.hashtags = [];
    if (PLATFORMS[k].alternates) o.alternates = [''];
    platforms[k] = o;
  }
  return {
    version: 1,
    id,
    title: (loaded.project && loaded.project.title) || id,
    brand: (loaded.brand && loaded.brand.slug) || 'personal',
    source: loaded.source || {},
    link: { url: '', label: '', bio: ((loaded.brand || {}).links || {}).bio || '' },
    alt: [{ asset: '', text: '' }],
    platforms,
    notes: '',
  };
}

function printRules(keys) {
  console.log('Write one body per network. Nothing is assembled from fields, and no two networks share a body.\n');
  for (const k of keys) {
    const P = PLATFORMS[k];
    console.log(P.label + '  (' + k + ')');
    for (const f of fieldsOf(k)) {
      console.log('  ' + f.key.padEnd(12) + 'cap ' + f.cap + '   target ' + f.soft + '   above the fold ' + f.fold
        + (f.hashtags ? '   max ' + f.hashtags + ' hashtags (' + P.tagStyle + ')' : '   no hashtags')
        + '   link: ' + P.linkPolicy + (f.weighted ? '   [urls count as 23]' : ''));
      console.log(wrap(f.shape, 4));
    }
    if (P.capNote) console.log(wrap('Cap: ' + P.capNote, 4));
    if (P.alternates) console.log(wrap('Supply ' + P.alternates + ' alternate with a different angle, in alternates[].', 4));
    console.log('');
  }
  console.log('link policies: body = put the URL in the text · bio = name the bio link, never paste a URL');
  console.log('               comment = link goes in the first comment · none = no links at all · optional = your call');
}
function wrap(s, indent) {
  const pad = ' '.repeat(indent), out = [];
  let line = pad;
  for (const w of String(s).split(/\s+/)) {
    if (line.length + w.length + 1 > 108) { out.push(line); line = pad; }
    line += (line === pad ? '' : ' ') + w;
  }
  out.push(line);
  return out.join('\n');
}

/* A body may contain backticks, and a naive three-backtick fence would cut the file in half. */
function fenceFor(s) {
  const longest = (String(s).match(/`+/g) || []).reduce((m, r) => Math.max(m, r.length), 0);
  return '`'.repeat(Math.max(3, longest + 1));
}
function block(text) { const f = fenceFor(text); return [f, text, f]; }

function render(doc, brandIn, only) {
  const errors = [], rows = [], md = [];
  const brand = brandIn || { name: doc.brand || '', voice: '', links: {} };
  const platforms = doc.platforms || {};
  const keys = (only || Object.keys(platforms)).filter(k => {
    if (!PLATFORMS[k]) { errors.push('unknown platform "' + k + '" in platforms{} (have: ' + Object.keys(PLATFORMS).join(', ') + ')'); return false; }
    if (!platforms[k]) { errors.push('--platforms asked for ' + k + ', which is not in the file'); return false; }
    return true;
  });
  if (!keys.length) errors.push('no platforms to render');

  md.push('# ' + (doc.title || doc.id || 'Untitled') + ': social copy', '');
  const bits = [];
  if (brand.name) bits.push('Brand: **' + brand.name + '**');
  if (brand.voice) bits.push('voice: ' + brand.voice);
  if (bits.length) md.push(bits.join(' · '));
  const link = doc.link || {};
  if (link.url || link.bio) md.push('Link: ' + (link.url || '(none yet)') + (link.bio ? ' · bio: ' + link.bio : ''));
  if (doc.source && doc.source.asset) md.push('Asset: `' + doc.source.asset + '`');
  md.push('', '> Rendered from `' + (doc.id || 'social') + '.json`. Counts are of the text inside each block,',
    '> hashtags included. Edit the JSON and run `npm run social` again; edits made here are overwritten.', '');

  /* alt text */
  const alts = (doc.alt || []).filter(a => a && a.text);
  if (!alts.length) rows.push({ level: 'warn', p: 'alt text', f: '', len: 0, cap: ALT_CAP, note: 'none written; an image post needs one' });
  alts.forEach((a, i) => {
    const n = count(a.text);
    const over = n > ALT_CAP;
    if (over) errors.push('alt text ' + (i + 1) + ' is ' + n + '/' + ALT_CAP);
    rows.push({ level: over ? 'OVER' : n > ALT_SOFT ? 'warn' : 'ok', p: 'alt text', f: alts.length > 1 ? String(i + 1) : '',
      len: n, cap: ALT_CAP, note: n > ALT_SOFT && !over ? 'over ' + ALT_SOFT + ', which Instagram truncates' : '' });
    md.push('### Alt text' + (alts.length > 1 ? ' ' + (i + 1) : '') + '  ·  ' + n + '/' + ALT_CAP + (over ? '  ⚠ OVER' : ''), '');
    md.push(...block(a.text), '');
  });

  let blocks = alts.length;
  for (const k of keys) {
    const P = PLATFORMS[k], data = platforms[k] || {};
    const fields = fieldsOf(k);
    const allowed = new Set(fields.map(f => f.key).concat(['hashtags', 'alternates', 'notes']));
    for (const key of Object.keys(data)) if (!allowed.has(key)) errors.push(k + ': unknown field "' + key + '" (expected: ' + [...allowed].join(', ') + ')');

    /* hashtags[] is capped, not targeted: over the maximum is a gate, under it is a choice. */
    const tags = normTags(data.hashtags);
    if (tags.length && !P.hashtags) rows.push({ level: 'warn', p: k, f: 'hashtags', len: tags.length, cap: 0, note: 'this network takes none; they were dropped' });
    else if (tags.length > P.hashtags) {
      errors.push(k + ' has ' + tags.length + ' hashtags; the maximum is ' + P.hashtags);
      rows.push({ level: 'OVER', p: k, f: 'hashtags', len: tags.length, cap: P.hashtags, note: 'the maximum is ' + P.hashtags });
    } else if (P.hashtags && !tags.length) rows.push({ level: 'warn', p: k, f: 'hashtags', len: 0, cap: P.hashtags, note: 'none written; this network takes up to ' + P.hashtags });

    md.push('---', '', '## ' + P.label, '');
    for (const f of fields) {
      const raw = data[f.key];
      if (raw == null || !String(raw).trim()) { errors.push(k + '.' + f.key + ' is empty'); continue; }
      const withTags = opt.noHashtags || f.hashtags === 0 ? String(raw) : appendTags(String(raw), data.hashtags, P.tagStyle);
      blocks += emit(md, rows, k, P, f, f.label, withTags, raw, errors);
    }
    for (const [i, alt] of (data.alternates || []).entries()) {
      if (!alt || !String(alt).trim()) continue;
      const f = fields[0];
      blocks += emit(md, rows, k, P, f, f.label + ' alternate ' + (i + 1), String(alt), alt, errors, true);
    }
  }

  md.push('---', '', '## Checks', '');
  const pad = (s, n) => String(s).padEnd(n);
  md.push(...block(rows.map(r => pad(r.level === 'OVER' ? '⚠ OVER' : r.level, 7) + pad(r.p, 19) + pad(r.f, 22)
    + pad(r.len + '/' + r.cap, 11) + r.note).map(s => s.replace(/\s+$/, '')).join('\n')), '');

  const report = rows.map(r => '  ' + pad(r.level === 'OVER' ? 'OVER' : r.level, 6) + pad(r.p, 19) + pad(r.f, 22) + pad(r.len + '/' + r.cap, 11) + r.note);
  return { md: md.join('\n').replace(/\n{3,}/g, '\n\n') + '\n', errors, rows, report, blocks, warns: rows.filter(r => r.level === 'warn').length };
}

function emit(md, rows, k, P, f, label, text, raw, errors, isAlt) {
  const n = count(text, f.weighted);
  const over = n > f.cap;
  if (over) errors.push(k + '.' + (isAlt ? 'alternate' : f.key) + ' is ' + n + '/' + f.cap);
  const notes = [];
  if (!over && n > f.soft) notes.push('over the ' + f.soft + ' target');
  if (/(^|\s)#\w/.test(String(raw))) notes.push('# inside the body; move it to hashtags[]');
  /* A Short has no chapter bar, and a time list is noise in the part of the description people read. */
  if (k === 'youtube' && f.key === 'description' && /^\s*\d{1,2}:\d{2}(:\d{2})?\s+\S/m.test(String(raw)))
    notes.push('timestamps in the description; only when asked for, and never on a Short');
  /* The description is the one place on YouTube a link is clickable; without the channel and socials it is unfinished. */
  if (k === 'youtube' && f.key === 'description' && !hasUrl(text))
    notes.push('no links; add watch-next videos, the subscribe link and the socials');
  if (P.linkPolicy === 'none' && hasUrl(text)) notes.push('linkPolicy is none; the URL is not clickable here');
  if (P.linkPolicy === 'bio' && hasUrl(text)) notes.push('linkPolicy is bio; name the bio link instead of pasting a URL');
  if (P.linkPolicy === 'comment' && hasUrl(text)) notes.push('linkPolicy is comment; a URL in the body suppresses reach');
  rows.push({ level: over ? 'OVER' : notes.length ? 'warn' : 'ok', p: k, f: label.toLowerCase(), len: n, cap: f.cap, note: notes.join('; ') });
  md.push('### ' + label + '  ·  ' + n + '/' + f.cap + (over ? '  ⚠ OVER' : ''));
  if (!isAlt) md.push('_' + f.shape + '_');
  md.push('', ...block(text), '');
  return 1;
}
