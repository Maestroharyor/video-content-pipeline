#!/usr/bin/env node
/* Fetch openly-licensed music beds for a project, and write their provenance down.

   The sibling of scripts/fetch-photos.js, and it exists for the same reason: a bed that plays under a published
   video is licensed use, not fair use, and a commercial track will be caught by YouTube's and Instagram's
   Content ID whatever the intent. So only CC0 and public-domain audio is taken by default — no attribution
   burden, no claim risk. `--allow-by` widens it to CC-BY, which is usable but then the credit has to go in the
   video description, so the SOURCES.md row for a BY track says so in its Notes.
   -NC, -ND and -SA are never accepted: this footage is published commercially and may be edited.

   Source: Openverse's audio index (aggregates Freesound, Jamendo, Wikimedia), plain JSON over curl, the same
   way fetch-photos.js and fetch-assets.js work. Anything whose licence cannot be read from the response is
   skipped, loudly.

   usage: node scripts/fetch-music.js --project <slug> --q "ambient pad loop" [--per 4] [--min 20] [--max 400]
                                      [--allow-by] [--dry]
*/
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { projectDir } = require('../renderer/project');

const UA = 'User-Agent: vid-music-fetch/1 (local video project; openly-licensed audio only)';

const args = (argv => {
  const o = { project: null, q: null, per: 4, min: 20, max: 400, allowBy: false, dry: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--project') o.project = argv[++i];
    else if (a === '--q') o.q = argv[++i];
    else if (a === '--per') o.per = +argv[++i];
    else if (a === '--min') o.min = +argv[++i];
    else if (a === '--max') o.max = +argv[++i];
    else if (a === '--allow-by') o.allowBy = true;
    else if (a === '--dry') o.dry = true;
    else throw new Error('unknown flag ' + a);
  }
  if (!o.q) throw new Error('--q "what kind of music" is required');
  return o;
})(process.argv.slice(2));

const OK = args.allowBy ? ['cc0', 'pdm', 'by'] : ['cc0', 'pdm'];
const dir = projectDir(args.project);
const music = path.join(dir, 'assets', 'music');
const sources = path.join(dir, 'SOURCES.md');

const get = url => JSON.parse(execFileSync('curl',
  ['-sSL', '--fail', '--max-time', '40', '-H', UA, url], { maxBuffer: 32 * 1024 * 1024 }).toString());

function openverse(q, n) {
  const url = 'https://api.openverse.org/v1/audio/?q=' + encodeURIComponent(q)
    // 20 is the ceiling for an unauthenticated Openverse request; asking for more returns 401, not a short page.
    + '&license=' + OK.join(',') + '&mature=false&page_size=' + Math.min(20, Math.max(n, n * 6));
  const r = get(url);
  return (r.results || [])
    .filter(x => OK.includes((x.license || '').toLowerCase()))
    .map(x => ({
      url: x.url, title: x.title || '(untitled)', creator: x.creator || '(unknown)',
      licence: (x.license || '').toUpperCase() + ' ' + (x.license_version || ''),
      landing: x.foreign_landing_url || '', dur: (x.duration || 0) / 1000, provider: x.source || 'openverse',
    }))
    .filter(x => x.url && x.dur >= args.min && x.dur <= args.max)
    .sort((a, b) => b.dur - a.dur);
}

const slugify = s => String(s).toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 34) || 'track';

let found = [];
try { found = openverse(args.q, args.per); }
catch (e) { console.error('openverse failed: ' + e.message.split('\n')[0]); process.exit(1); }
if (!found.length) { console.error(`NONE  no ${OK.join('/')} audio for "${args.q}" between ${args.min}s and ${args.max}s`); process.exit(1); }

fs.mkdirSync(music, { recursive: true });
const rows = [];
found.slice(0, args.per).forEach((f, i) => {
  const ext = (f.url.match(/\.(mp3|wav|ogg|flac|m4a)(\?|$)/i) || [, 'mp3'])[1].toLowerCase();
  const file = `${String(i + 1).padStart(2, '0')}-${slugify(f.title)}.${ext}`;
  const dest = path.join(music, file);
  console.log(`${args.dry ? 'would get' : 'get'}  ${file.padEnd(42)} ${f.licence.padEnd(9)} ${f.dur.toFixed(0).padStart(4)}s  ${f.title.slice(0, 40)}`);
  if (args.dry) return;
  try { execFileSync('curl', ['-sSL', '--fail', '--max-time', '120', '-H', UA, '-o', dest, f.url], { stdio: 'pipe' }); }
  catch (e) { console.error('  download failed: ' + f.url); return; }
  const by = /^BY/i.test(f.licence) ? ' **Credit required in the video description.**' : '';
  rows.push(`| assets/music/${file} | ${f.landing || f.url} | ${f.title} by ${f.creator}. ${f.licence.trim()}. ${f.dur.toFixed(0)}s, via ${f.provider}.${by} |`);
});

if (rows.length && !args.dry) {
  const head = fs.existsSync(sources) ? fs.readFileSync(sources, 'utf8')
    : '# Asset sources\n\n| File | Source | Notes |\n|------|--------|-------|\n';
  fs.writeFileSync(sources, head.replace(/\n*$/, '\n') + rows.join('\n') + '\n');
  console.log(`\n${rows.length} track(s) → ${path.relative(process.cwd(), music)}, provenance appended to ${path.relative(process.cwd(), sources)}`);
}
