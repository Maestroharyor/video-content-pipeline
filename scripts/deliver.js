#!/usr/bin/env node
/* npm run deliver -- --project <slug>: rebuild projects/<slug>/deliver/, the one flat folder of everything finished
   for a video (masters, thumbnail, vertical cuts + captions, image posts, all post copy). The finishing commands
   (dual, social-cut, social, and the image pipeline's review and social) call this themselves; run it by hand
   after moving files around. Accepts a nested or sibling project too: mcp-vs-api/social and mcp-vs-api-thumbs
   both deliver into mcp-vs-api. --img <root> points at a checkout of image-content-pipeline elsewhere. */
const path = require('path');
const { run } = require('../renderer/deliver');

const a = process.argv.slice(2), val = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
const p = val('--project') || val('-p') || process.env.VID_PROJECT;
if (!p) { console.error('usage: npm run deliver -- --project <slug>'); process.exit(1); }
const vid = path.resolve(__dirname, '..');
const dir = path.isAbsolute(p) ? p : path.join(vid, 'projects', p);
if (!run(require('fs').existsSync(dir) ? dir : p, { img: val('--img') && path.resolve(val('--img')) })) process.exit(1);
