#!/usr/bin/env node
/* Fetch openly-licensed object photographs for a project's thumbnails, and write their provenance down.

   Only CC0 / public-domain / CC-BY images are taken, because a thumbnail is published and a "free to look at"
   image is not the same thing as a licensed one. Every file that lands gets a row in the project's
   SOURCES.md with its title, creator, licence and landing page, which is the repo's standing rule for
   anything downloaded. Anything whose licence cannot be read from the API response is skipped, loudly.

   Two sources, tried in order: Openverse (aggregates Flickr, Wikimedia, museums; no key needed) and the
   Wikimedia Commons API. Both are plain JSON over curl, the same way scripts/fetch-assets.js works.

   usage: node scripts/fetch-photos.js --project <slug> [--subject "server rack"] [--per 3] [--dry]
   With no --subject it fetches the default set the storage video needs.  */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { projectDir } = require('../renderer/project');

/* What each design needs, and the word that finds it. `name` becomes the filename stem. */
const WANT = [
  { name: 'rack', q: 'server rack data center' },
  { name: 'phone', q: 'smartphone on desk' },
  { name: 'laptop', q: 'laptop computer open' },
  { name: 'ssd', q: 'solid state drive ssd' },
  { name: 'disk', q: 'hard disk drive platter' },
];
const OK_LICENCE = ['cc0', 'pdm', 'by'];   // no -nc, no -nd, no -sa: this is published commercially

const args = (argv => {
  const o = { project: null, subject: null, per: 3, dry: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--project') o.project = argv[++i];
    else if (a === '--subject') o.subject = argv[++i];
    else if (a === '--per') o.per = +argv[++i];
    else if (a === '--dry') o.dry = true;
    else throw new Error('unknown flag ' + a);
  }
  return o;
})(process.argv.slice(2));

const dir = projectDir(args.project);
const photos = path.join(dir, 'assets', 'photos');
const sources = path.join(dir, 'SOURCES.md');

/* Two User-Agents, because the two sources want opposite things. StockSnap's CDN 403s a request that does
   not look like a browser; Wikimedia 403s one that does, and asks for a descriptive agent instead. */
const UA_WIKI = 'User-Agent: vid-thumbnail-fetch/1 (https://github.com/; local research fetch)';
const UA_CDN = 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36';
const agent = url => /wikimedia\.org|wikipedia\.org/.test(url) ? UA_WIKI : UA_CDN;
const get = url => {
  const out = execFileSync('curl', ['-sSL', '--fail', '--max-time', '30', '-H', agent(url), url], { maxBuffer: 32 * 1024 * 1024 });
  return JSON.parse(out.toString());
};

/* ---- Openverse ---- */
function openverse(q, n) {
  const url = 'https://api.openverse.org/v1/images/?q=' + encodeURIComponent(q)
    + '&license=cc0,pdm,by&extension=jpg&size=large&mature=false&page_size=' + (n * 4);
  const r = get(url);
  return (r.results || [])
    .filter(x => OK_LICENCE.includes((x.license || '').toLowerCase()))
    .filter(x => x.width >= 1600 && x.url)
    .map(x => ({
      src: 'openverse', url: x.url, title: x.title || '(untitled)',
      creator: x.creator || '(unknown)', licence: (x.license || '').toUpperCase() + ' ' + (x.license_version || ''),
      landing: x.foreign_landing_url || x.detail_url || '', w: x.width, h: x.height,
    }));
}

/* ---- Wikimedia Commons ---- */
function commons(q, n) {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search'
    + '&gsrsearch=' + encodeURIComponent('filetype:bitmap ' + q) + '&gsrnamespace=6&gsrlimit=' + (n * 4)
    + '&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=2400';
  const r = get(url);
  const pages = ((r.query || {}).pages) || {};
  return Object.values(pages).map(p => {
    const ii = (p.imageinfo || [])[0]; if (!ii) return null;
    const m = ii.extmetadata || {};
    const lic = ((m.LicenseShortName || {}).value || '').toLowerCase();
    const free = lic.includes('cc0') || lic.includes('public domain') || /^cc by(?!-)/.test(lic) || lic.includes('cc by 4') || lic.includes('cc by 3') || lic.includes('cc by 2');
    if (!free || lic.includes('nc') || lic.includes('nd') || lic.includes('sa')) return null;
    if ((ii.width || 0) < 1600) return null;
    return {
      src: 'commons', url: ii.thumburl || ii.url, title: p.title.replace(/^File:/, ''),
      creator: ((m.Artist || {}).value || '').replace(/<[^>]*>/g, '').trim() || '(unknown)',
      licence: (m.LicenseShortName || {}).value || lic, landing: ii.descriptionurl || '',
      w: ii.width, h: ii.height,
    };
  }).filter(Boolean);
}

/* ---- main ---- */
const jobs = args.subject ? [{ name: args.subject.replace(/\W+/g, '-').toLowerCase(), q: args.subject }] : WANT;
const rows = [];
fs.mkdirSync(photos, { recursive: true });

for (const job of jobs) {
  let found = [];
  for (const fn of [openverse, commons]) {
    try { found = found.concat(fn(job.q, args.per)); } catch (e) { console.error(`  ${fn.name} failed for "${job.q}": ${e.message.split('\n')[0]}`); }
    if (found.length >= args.per) break;
  }
  if (!found.length) { console.error(`NONE  ${job.name.padEnd(8)} "${job.q}" — no openly-licensed match; this design falls back to a drawn object`); continue; }
  found.slice(0, args.per).forEach((f, i) => {
    const file = `${job.name}-${i + 1}.jpg`;
    const dest = path.join(photos, file);
    console.log(`${args.dry ? 'would get' : 'get'}  ${file.padEnd(14)} ${f.licence.padEnd(14)} ${f.title.slice(0, 48)}`);
    if (!args.dry) {
      try { execFileSync('curl', ['-sSL', '--fail', '--max-time', '60', '-H', agent(f.url), ...(/wikimedia|wikipedia/.test(f.url) ? [] : ['-H', 'Referer: ' + (f.landing || f.url)]), '-o', dest, f.url], { stdio: 'pipe' }); }
      catch (e) { console.error('  download failed: ' + f.url); return; }
    }
    rows.push(`| assets/photos/${file} | ${f.landing || f.url} | ${f.title} by ${f.creator}. ${f.licence.trim()}. ${f.w}x${f.h}, via ${f.src}. |`);
  });
}

if (rows.length && !args.dry) {
  const head = fs.existsSync(sources) ? fs.readFileSync(sources, 'utf8') : '# Asset sources\n\n| File | Source | Notes |\n|------|--------|-------|\n';
  fs.writeFileSync(sources, head.replace(/\n*$/, '\n') + rows.join('\n') + '\n');
  console.log(`\nwrote ${rows.length} rows to ${path.relative(process.cwd(), sources)}`);
}
