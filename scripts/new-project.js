#!/usr/bin/env node
/* Scaffold a new video project from core/skeleton.
     npm run new -- --slug my-video --title "My video" [--canvas vertical|horizontal] [--res 4k|1440p|2k|1080p] [--fps 60] [--dur 5] [--hold 1] [--lead 0.10] [--captions on|off] [--layout top|left] [--force]
   Resolution defaults to 4k for horizontal and 2k (1440x2560) for vertical (renderer/project.js RES_OPTIONS).
   Captions default to on for vertical, off for horizontal (they need a voiceover: npm run transcribe). */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { RES, RES_DEFAULT } = require('../renderer/project');
const a = process.argv.slice(2), get = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const slug = get('--slug'), title = get('--title', slug), canvas = get('--canvas', 'vertical');
if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error('usage: npm run new -- --slug my-video --title "My video" [--canvas vertical|horizontal]'); process.exit(1); }
if (!['vertical', 'horizontal'].includes(canvas)) { console.error('canvas must be vertical or horizontal'); process.exit(1); }
const res = get('--res', RES_DEFAULT[canvas]).toLowerCase();
if (!RES[res]) { console.error('res must be one of ' + Object.keys(RES).join(', ')); process.exit(1); }
const dir = path.join(ROOT, 'projects', slug);
if (fs.existsSync(dir) && !a.includes('--force')) { console.error('exists: ' + path.relative(ROOT, dir) + ' (use --force to overwrite project.js/index.html, or pick another slug)'); process.exit(1); }
const caps = get('--captions', canvas === 'vertical' ? 'on' : 'off') === 'on';
// title position on the 16:9 canvas (core/grid.js): top unless left is asked for; vertical always stacks
const layout = get('--layout', 'top');
if (!['top', 'left'].includes(layout)) { console.error('layout must be top or left'); process.exit(1); }
const vars = { __SLUG__: slug, __TITLE__: title, __CANVAS__: canvas, __CAPS__: String(caps), __RES__: res, __FPS__: get('--fps', '60'), __DUR__: get('--dur', '5'), __HOLD__: get('--hold', '1'),
  __W__: canvas === 'vertical' ? 1080 : 1920, __H__: canvas === 'vertical' ? 1920 : 1080, __CLIP__: String(+get('--dur', '5') + +get('--hold', '1')), __VO__: '?', __N__: '?', __LEAD__: get('--lead', '0.10'),
  __LAYOUT__: layout };
const fill = s => Object.keys(vars).reduce((o, k) => o.split(k).join(vars[k]), s);
const sk = path.join(ROOT, 'core', 'skeleton');
for (const d of ['slides', 'assets', 'renders/gif', 'renders/mp4', 'renders/webm', 'renders/poster', 'renders/final']) fs.mkdirSync(path.join(dir, d), { recursive: true });
for (const f of ['project.js', 'index.html', 'cue-sheet.md']) fs.writeFileSync(path.join(dir, f), fill(fs.readFileSync(path.join(sk, f), 'utf8')));
if (!fs.readdirSync(path.join(dir, 'slides')).length) fs.copyFileSync(path.join(sk, 'slides', '01-title.js'), path.join(dir, 'slides', '01-title.js'));
fs.writeFileSync(path.join(dir, 'assets', '.keep'), '');
console.log('created projects/' + slug + ' (' + canvas + ' ' + res + ' @ ' + vars.__FPS__ + 'fps, captions ' + (caps ? 'on' : 'off') + (canvas === 'horizontal' ? ', title ' + layout : '') + ')\n  next: drop the voiceover in as projects/' + slug + '/vo.m4a and run npm run transcribe -- --project ' + slug +
  '\n  npm run timeline -- --project ' + slug + ' --words   (each slide\'s words with times, to author the Beats column)\n  edit cue-sheet.md + slides/*.js, then\n  npm run review -- --project ' + slug + '\n  npm run timeline -- --project ' + slug + '\n  npm run assemble -- --project ' + slug);
