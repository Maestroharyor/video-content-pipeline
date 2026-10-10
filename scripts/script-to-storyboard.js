#!/usr/bin/env node
/* Turn a voiceover script into VO windows for the cue sheet.
     node scripts/script-to-storyboard.js script.txt [--wps 2.6] [--md]
     node scripts/script-to-storyboard.js projects/<slug>/vo.json --md        (whisper output)
   Accepts whisper vo.json, SRT/VTT, "(m:ss) text (m:ss.ss) text" transcripts (timestamps anywhere in the text)
   or plain prose (windows are then estimated from word count at --wps words/second and flagged estimated). */
const fs = require('fs');
const { parseScript, toMarkdown } = require('../renderer/storyboard');
const a = process.argv.slice(2), file = a.find(x => !x.startsWith('--') && a[a.indexOf(x) - 1] !== '--wps');
const wps = +(a[a.indexOf('--wps') + 1] || 2.6) || 2.6;
const src = file ? fs.readFileSync(file, 'utf8') : fs.readFileSync(0, 'utf8');
const sb = parseScript(src, { wps });
if (!sb.lines.length) { console.error('no text found'); process.exit(1); }
console.log(a.includes('--md') ? toMarkdown(sb, wps) : JSON.stringify(sb, null, 2));
