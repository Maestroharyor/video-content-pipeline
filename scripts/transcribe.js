#!/usr/bin/env node
/* Transcribe a project's voiceover with whisper.cpp → vo.json (word timestamps) + transcript.txt ((m:ss.ss) markers).
     npm run transcribe -- --project <slug> [--audio path] [--model medium.en|small.en|base.en] [--prompt "AWS, EC2, RDS"] [--threads 8] [--dtw] [--no-download]
   The audio is looked up as projects/<slug>/{vo,voice,voiceover}.{wav,m4a,mp3,flac,ogg} unless --audio is given.
   The model is downloaded once into assets/.cache/whisper/. */
const { projectDir } = require('../renderer/project');
const { transcribe } = require('../renderer/transcribe');
const a = process.argv.slice(2), val = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
try {
  const dir = projectDir(val('--project') || val('-p'));
  transcribe({ dir, audio: val('--audio'), model: val('--model') || 'medium.en', prompt: val('--prompt'), threads: val('--threads') && +val('--threads'),
    download: !a.includes('--no-download'), dtw: a.includes('--dtw') });
} catch (e) { console.error(e.message); process.exit(1); }
