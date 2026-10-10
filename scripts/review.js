#!/usr/bin/env node
/* Everything the build gate wants, in one go: probe → posters → filmstrips → contact sheet.
     npm run review -- --project <slug> [--canvas horizontal] [--slide 07]
   Exit code 1 when the probe reports issues. */
const path = require('path');
const { spawnSync } = require('child_process');
const a = process.argv.slice(2);
const run = (script, extra = []) => spawnSync('node', [path.join(__dirname, '..', script), ...a, ...extra], { stdio: 'inherit' }).status;
const probe = run('scripts/probe.js');
run('renderer/cli.js', ['--poster']);
run('scripts/strip.js');
if (!a.includes('--slide')) run('scripts/contact-sheet.js');
console.log(probe ? '\nreview: FIX THE PROBE ISSUES ABOVE, then look at renders/poster, renders/strip and renders/contact-sheet.png' : '\nreview: probe clean — now look at renders/poster/*.png, renders/strip/*.png and renders/contact-sheet.png');
process.exit(probe ? 1 : 0);
