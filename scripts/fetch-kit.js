#!/usr/bin/env node
/* The "make it alive" kit for a project: emoji stickers and illustrated characters, downloaded into the project's
   assets and logged in its SOURCES.md under "## Added by hand" (the section `npm run assets` carries over).
     npm run kit -- --project <slug> --emoji "rocket, thinking face, party popper"
     npm run kit -- --project <slug> --character dev --seed devtunde [--options "glasses=variant08&glassesProbability=100"]
                                     [--gestures point,ok,hand,waveLongArm,handPhone,none]
   Emoji: Microsoft Fluent Emoji, 3D style, 256px PNG (MIT) → assets/emoji/<snake_name>.png; names are Fluent's own
   ("Thinking face", "Party popper"; browse https://github.com/microsoft/fluentui-emoji/tree/main/assets). Emoji with skin
   tones use the Default (yellow) tone. Use them with data.emoji on any slide (core/components/fx.js).
   Characters: DiceBear Notionists (CC0) → assets/avatars/<name>-<gesture>.svg, one file per gesture, same seed and
   options so it is the same person. A seed picks the face; options pin the look (https://www.dicebear.com/styles/notionists/).
   Use them with cast / avatar / team in the lanes, talk, app, map and bench templates (core/components/cast.js). */
const fs = require('fs'), path = require('path'), https = require('https');
const { projectDir } = require('../renderer/project');

const argv = process.argv.slice(2), val = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const slug = val('--project') || val('-p') || process.env.VID_PROJECT;
if (!slug) { console.error('usage: npm run kit -- --project <slug> (--emoji "a, b" | --character <name> --seed <seed> [--options q] [--gestures g1,g2])'); process.exit(1); }
const dir = projectDir(slug), today = new Date().toISOString().slice(0, 10);

function get(url) {
  return new Promise((ok, no) => https.get(url, { headers: { 'User-Agent': 'vid-kit' } }, r => {
    if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) return get(r.headers.location).then(ok, no);
    const b = []; r.on('data', d => b.push(d)); r.on('end', () => ok({ status: r.statusCode, body: Buffer.concat(b) }));
  }).on('error', no));
}
const HAND = '## Added by hand';
function logSources(rows) {
  const file = path.join(dir, 'assets', 'SOURCES.md');
  let md = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '# Asset sources\n';
  if (!md.includes(HAND)) md = md.trimEnd() + `\n\n${HAND}\n\n| File | Source | Notes |\n|------|--------|-------|\n`;
  const fresh = rows.filter(r => !md.includes(`| ${r[0]} |`));
  // rows go at the end of the hand table (the last table line in the section)
  const at = md.indexOf(HAND), sec = md.slice(at).split('\n'), last = sec.map((l, i) => l.startsWith('|') ? i : -1).filter(i => i >= 0).pop();
  sec.splice(last + 1, 0, ...fresh.map(r => `| ${r[0]} | ${r[1]} | ${r[2]} |`));
  fs.writeFileSync(file, md.slice(0, at) + sec.join('\n'));
  return fresh.length;
}

async function emoji(list) {
  const base = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/', out = path.join(dir, 'assets', 'emoji'), rows = [];
  fs.mkdirSync(out, { recursive: true });
  for (const raw of list) {
    const name = raw.trim().replace(/^./, c => c.toUpperCase()), snake = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const dst = path.join(out, snake + '.png');
    let url = base + encodeURIComponent(name) + `/3D/${snake}_3d.png`, r = await get(url);
    if (r.status !== 200) { url = base + encodeURIComponent(name) + `/Default/3D/${snake}_3d_default.png`; r = await get(url); }
    if (r.status !== 200) { console.log(`  ✗ ${name}: not in Fluent Emoji (check the folder name on GitHub)`); continue; }
    fs.writeFileSync(dst, r.body);
    rows.push([path.relative(path.join(dir, '..', '..'), dst), url, `Microsoft Fluent Emoji 3D, MIT License (https://github.com/microsoft/fluentui-emoji), unmodified, downloaded ${today}`]);
    console.log(`  ✓ emoji/${snake}.png  (use e: '${snake}')`);
  }
  return rows;
}
async function character(name, seed, options, gestures) {
  const out = path.join(dir, 'assets', 'avatars'), rows = [];
  fs.mkdirSync(out, { recursive: true });
  for (const g of gestures) {
    const q = `seed=${encodeURIComponent(seed)}${options ? '&' + options : ''}` + (g === 'none' ? '&gestureProbability=0' : `&gesture=${g}&gestureProbability=100`);
    const url = 'https://api.dicebear.com/9.x/notionists/svg?' + q, r = await get(url);
    if (r.status !== 200) { console.log(`  ✗ ${name}-${g}: HTTP ${r.status} (check the option names)`); continue; }
    const dst = path.join(out, `${name}-${g}.svg`);
    fs.writeFileSync(dst, r.body);
    rows.push([path.relative(path.join(dir, '..', '..'), dst), url, `DiceBear "Notionists", CC0 1.0 (https://www.dicebear.com/licenses/), unmodified, downloaded ${today}`]);
    console.log(`  ✓ avatars/${name}-${g}.svg  (use passet('avatars/${name}-${g}.svg'))`);
  }
  return rows;
}

(async () => {
  let rows = [];
  if (val('--emoji')) rows = rows.concat(await emoji(val('--emoji').split(',').filter(s => s.trim())));
  if (val('--character')) {
    if (!val('--seed')) { console.error('--character needs --seed'); process.exit(1); }
    rows = rows.concat(await character(val('--character'), val('--seed'), val('--options'), (val('--gestures') || 'point,ok,hand,waveLongArm,handPhone,none').split(',')));
  }
  if (!rows.length) { console.error('nothing fetched'); process.exit(1); }
  console.log(`kit ${slug}: ${rows.length} file(s), ${logSources(rows)} new row(s) in assets/SOURCES.md`);
})();
