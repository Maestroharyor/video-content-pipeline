#!/usr/bin/env node
/* Live preview: serves the repo over http, injects the project's timeline/captions and a control bar so the deck
   can be scrubbed and played at real time (with the voiceover, when present) without rendering.
     npm run preview -- --project <slug> [--port 4173] [--canvas horizontal] [--open] */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFile } = require('child_process');
const { resolve } = require('../renderer/config');
const { parseArgs } = require('../renderer/args');
const { defaultInject } = require('../renderer/browser');
const { findVo } = require('../renderer/transcribe');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.flac': 'audio/flac', '.ogg': 'audio/ogg', '.mp4': 'video/mp4' };
const args = parseArgs(process.argv.slice(2));
const cfg = resolve(args);
const port = args.port || 4173;
const rel = path.relative(cfg.root, cfg.projectDir).split(path.sep).join('/');
const vo = findVo(cfg.projectDir);

function page() {
  const inj = defaultInject(cfg);
  if (cfg.project.captions && cfg.project.captions.on && fs.existsSync(path.join(cfg.projectDir, 'captions.json'))) inj.CAPTIONS = JSON.parse(fs.readFileSync(path.join(cfg.projectDir, 'captions.json'), 'utf8'));
  inj.PREVIEW = { slug: cfg.slug, canvas: args.canvas || cfg.canvas, fps: cfg.fps, vo: vo ? '/' + rel + '/' + path.relative(cfg.projectDir, vo).split(path.sep).join('/') : null };
  let html = fs.readFileSync(cfg.deck, 'utf8');
  html = html.replace(/<script>window\.ASSETS[^<]*<\/script>/, m => m + `\n<script>Object.assign(window, ${JSON.stringify(inj)});</script>`);
  html = html.replace('</body>', '<script src="/core/preview.js"></script>\n</body>');
  return html;
}
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = decodeURIComponent(url.pathname);
  if (p === '/' || p === '/' + rel + '/' || p === '/' + rel + '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); return res.end(page());
  }
  const file = path.join(cfg.root, p);
  if (!file.startsWith(cfg.root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => {
  const u = `http://localhost:${port}/${rel}/index.html?canvas=${args.canvas || cfg.canvas}`;
  console.log(`preview ${cfg.slug} → ${u}\n  space: play/pause · ←/→: ±1 frame · shift+←/→: ±1s · 1-9: jump to slide · ctrl-c to stop`);
  if (args.open) execFile(process.platform === 'darwin' ? 'open' : 'xdg-open', [u]);
});
