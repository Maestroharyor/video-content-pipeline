#!/usr/bin/env node
/* The one command. Asks what it needs, then runs every step that is possible for the project's current state:
 *
 *   npm run video                      new project: questions → scaffold → copy/transcribe the audio → draft cue sheet →
 *                                      hands the slide writing to Claude Code (`claude "/new-video --project <slug>"`)
 *   npm run video -- --project <slug>  resume: does whatever is still missing (transcribe, review, timeline, assemble)
 *
 * Flags pre-answer questions (useful without a TTY): --title --slug --canvas vertical|horizontal --res 4k|1440p|2k|1080p --fps 60|30 --audio <file>
 *   --script <file> --captions on|off --accent t|v|g|r|a|b|o --no-claude --yes
 * Slides are the creative part and are written by Claude (the /new-video skill); everything else is automated here. */
const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const { spawnSync } = require('child_process');
const { ROOT, RES_OPTIONS, RES_DEFAULT, listProjects, loadProject } = require('../renderer/project');
const { findVo } = require('../renderer/transcribe');
const { parseScript } = require('../renderer/storyboard');

const a = process.argv.slice(2), val = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; }, has = k => a.includes(k);
const TTY = process.stdin.isTTY && !has('--yes');
const rl = TTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;
const log = m => console.log('\n\x1b[1m==> ' + m + '\x1b[0m');
const run = (cmd, args, opts = {}) => { const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: ROOT, shell: process.platform === 'win32', ...opts }); if (r.status !== 0 && !opts.soft) { console.error(`\n${cmd} ${args.join(' ')} failed`); process.exit(r.status || 1); } return r.status; };
const npm = (...args) => run('npm', ['run', ...args]);
const which = bin => spawnSync(process.platform === 'win32' ? 'where' : 'which', [bin]).status === 0;
async function ask(q, def, opts) {
  if (!rl) return def;
  const hint = opts ? ` (${opts.join('/')})` : (def != null && def !== '' ? ` [${def}]` : '');
  for (;;) {
    const v = (await rl.question(`${q}${hint}: `)).trim() || (def == null ? '' : String(def));
    if (!opts || opts.includes(v)) return v;
    console.log('  please answer one of: ' + opts.join(', '));
  }
}
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
const exists = p => fs.existsSync(p);
const slideFiles = dir => exists(path.join(dir, 'slides')) ? fs.readdirSync(path.join(dir, 'slides')).filter(f => f.endsWith('.js')) : [];
const cueRows = dir => { const f = path.join(dir, 'cue-sheet.md'); if (!exists(f)) return 0; return (fs.readFileSync(f, 'utf8').match(/^\| \d\d \|/gm) || []).length; };

(async () => {
  console.log('vid — voiceover to finished video\n');
  let slug = val('--project') || val('--slug');
  let dir, fresh = false;

  /* ---- 1. which project ---- */
  if (!slug) {
    const all = listProjects().filter(p => p !== 'template-gallery');
    if (all.length && TTY) console.log('existing projects: ' + all.join(', ') + '   (enter one to resume, or a new title)');
    const title = val('--title') || await ask('Video title (or existing project slug)', '');
    if (!title) { console.error('a title is required'); process.exit(1); }
    if (all.includes(title)) slug = title; else { slug = val('--slug') || slugify(title); a.push('--title', title); }
  }
  dir = path.join(ROOT, 'projects', slug);
  if (!exists(path.join(dir, 'project.js'))) {
    fresh = true;
    const title = val('--title') || slug;
    const canvas = val('--canvas') || await ask('Aspect ratio: vertical (Shorts/Reels/TikTok) or horizontal (YouTube)', 'vertical', ['vertical', 'horizontal']);
    const res = val('--res') || await ask('Output resolution' + (canvas === 'horizontal' ? ' (4k = 3840x2160, best for YouTube)' : ' (2k = 1440x2560; 1080p is what most social apps deliver)'), RES_DEFAULT[canvas], RES_OPTIONS[canvas]);
    const fps = val('--fps') || await ask('Frame rate (60 is smoother; 30 halves the render time)', '60', ['60', '30']);
    const captions = val('--captions') || await ask('Burned-in captions (word highlight, needs the recording)', canvas === 'vertical' ? 'on' : 'off', ['on', 'off']);
    log(`creating projects/${slug} (${canvas} ${res} @ ${fps}fps, captions ${captions})`);
    npm('new', '--', '--slug', slug, '--title', title, '--canvas', canvas, '--res', res, '--fps', fps, '--captions', captions);
  } else log(`resuming projects/${slug}`);
  const { project } = loadProject(dir);

  /* ---- 2. voiceover / script ---- */
  let vo = findVo(dir);
  if (!vo) {
    const p = val('--audio') || await ask('Path to the voiceover recording (wav/m4a/mp3/flac/ogg), empty if you only have text', '');
    if (p) {
      const src = path.resolve(p.replace(/^~/, process.env.HOME || ''));
      if (!exists(src)) { console.error('not found: ' + src); process.exit(1); }
      vo = path.join(dir, 'vo' + path.extname(src).toLowerCase());
      fs.copyFileSync(src, vo); console.log('  copied → ' + path.relative(ROOT, vo));
    }
  }
  const voJson = path.join(dir, 'vo.json'), transcript = path.join(dir, 'transcript.txt'), script = path.join(dir, 'script.txt');
  if (vo && !exists(voJson)) {
    log('transcribing with whisper.cpp (first run downloads the model, ≈1.5GB)');
    npm('transcribe', '--', '--project', slug);
  }
  if (!vo && !exists(transcript) && !exists(script)) {
    const p = val('--script') || await ask('Path to the script / transcript file (with (m:ss) markers, SRT, or plain prose); empty to paste', '');
    if (p) fs.copyFileSync(path.resolve(p.replace(/^~/, process.env.HOME || '')), script);
    else if (rl) {
      console.log('Paste the script, then an empty line and Ctrl-D:');
      const lines = []; for await (const l of rl) lines.push(l);
      fs.writeFileSync(script, lines.join('\n') + '\n');
    }
  }
  const source = exists(transcript) ? transcript : exists(script) ? script : null;

  /* ---- 3. draft cue sheet (VO windows + lines; templates/headlines are filled by Claude) ---- */
  if (source && cueRows(dir) === 0) {
    log('drafting the cue sheet from ' + path.basename(source));
    const sb = parseScript(fs.readFileSync(source, 'utf8'));
    const cue = path.join(dir, 'cue-sheet.md');
    let md = exists(cue) ? fs.readFileSync(cue, 'utf8') : '# ' + project.title + '\n## Cue sheet\n\n';
    const mmss = s => { const m = Math.floor(s / 60), ss = (s % 60).toFixed(2).padStart(5, '0'); return m + ':' + ss; };
    // draft beats: the first words of each clause are candidates (?: placeholders are renamed to element names in the storyboard step)
    const cand = text => text.split(/[,;.!?]\s+|\s+(?:and|but|so|because|which)\s+/i).map(c => c.trim().split(/\s+/).slice(0, 2).join(' ')).filter(c => c && c.length > 2).slice(1, 5).map(c => `?:"${c.replace(/["|]/g, '')}"`).join(' ');
    const rows = sb.lines.map((l, i) => `| ${String(i + 1).padStart(2, '0')} | ${String(i + 1).padStart(2, '0')}-${slugify(l.text.split(' ').slice(0, 4).join(' ')) || 'line'} | ${mmss(l.start)}-${mmss(l.end)} | ? | | | | | | ${cand(l.text) || '–'} | "${l.text.replace(/\|/g, '/')}" |`);
    const table = '| # | File | VO window | Template | Eyebrow | Headline | Visual / data | Accent | Interaction | Beats | Line it covers |\n|---|------|-----------|----------|---------|----------|---------------|--------|-------------|-------|----------------|\n' + rows.join('\n') + '\n';
    md = /\| # \| File \|/.test(md) ? md.replace(/\| # \| File \|[\s\S]*?\n(?=\n|## |$)/, table) : md + '\n' + table;
    md = md.replace(/runtime (\?|__VO__)/, 'runtime ' + mmss(sb.total) + (sb.estimated ? ' (estimated)' : '')).replace(/Slides: (\?|__N__)/, 'Slides: ' + sb.lines.length + ' (draft)');
    fs.writeFileSync(cue, md);
    console.log(`  ${sb.lines.length} lines, ${mmss(sb.total)} total${sb.estimated ? ' (timings estimated: no timestamps in the text)' : ''} → ${path.relative(ROOT, cue)}`);
    console.log('  DRAFT: one row per spoken line, Beats pre-filled with clause starts (?:"…"). Claude merges/splits rows, picks templates and headlines and names the beat targets in the storyboard step.');
  }

  /* ---- 4. slides: hand off to Claude Code when they do not exist yet ---- */
  const slides = slideFiles(dir);
  const onlySkeleton = slides.length <= 1 && slides[0] === '01-title.js' && fresh || slides.length === 0;
  const skeletonUntouched = slides.length === 1 && fs.readFileSync(path.join(dir, 'slides', slides[0]), 'utf8') === fs.readFileSync(path.join(ROOT, 'core', 'skeleton', 'slides', '01-title.js'), 'utf8');
  if (onlySkeleton || skeletonUntouched) {
    const prompt = `/new-video --project ${slug}`;
    log('slides are written by Claude Code (the /new-video skill): it reviews the draft cue sheet with you, then builds, reviews, times and assembles');
    if (which('claude') && !has('--no-claude') && (val('--claude') === 'yes' || await ask('Open Claude Code on this project now?', 'yes', ['yes', 'no'])) === 'yes') {
      rl && rl.close();
      run('claude', [prompt], { soft: true });
      return;
    }
    console.log(`\nNext: in Claude Code run   ${prompt}\nthen, when the slides exist:   npm run video -- --project ${slug}   (review → timeline → assemble)`);
    rl && rl.close(); return;
  }

  /* ---- 5. review → timeline → assemble ---- */
  log('review: probe + posters + filmstrips + contact sheet');
  const rc = npm('review', '--', '--project', slug);
  if (rc) { console.log('\nfix the probe issues above (or ask Claude to), then re-run: npm run video -- --project ' + slug); rl && rl.close(); process.exit(1); }
  log('timeline from the cue sheet' + (exists(voJson) ? ' + word timestamps' : ''));
  npm('timeline', '--', '--project', slug);
  log('assembling the final video');
  npm('assemble', '--', '--project', slug);
  const out = path.join(dir, 'renders', 'final', slug + '.mp4');
  console.log(`\nDone → ${path.relative(ROOT, out)}${vo ? '  (voiceover + beds mixed in)' : '  (silent: add your audio in the editor, or drop vo.m4a in and re-run)'}`);
  console.log(`Review images: projects/${slug}/renders/{poster,strip,contact-sheet.png}   Play it: npm run preview -- --project ${slug}`);
  rl && rl.close();
})().catch(e => { console.error(e.message || e); process.exit(1); });
