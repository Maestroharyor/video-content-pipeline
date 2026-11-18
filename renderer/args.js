/* CLI flag parsing shared by cli/assemble/probe/contact-sheet. Unknown --flags are an error. */
const path = require('path');
const FLAGS = {
  '--project': ['project', 's'], '-p': ['project', 's'], '--slide': ['slide', 'list'], '--overlay': ['slide', 'list'], '-s': ['slide', 'list'],
  '--format': ['format', 's'], '-f': ['format', 's'], '--canvas': ['canvas', 's'], '--fps': ['fps', 'n'], '--width': ['width', 'n'], '--height': ['height', 'n'],
  '--res': ['res', 's'], '--crf': ['crf', 'n'], '--preset': ['preset', 's'], '--max-size': ['maxSize', 's'],
  '--hold': ['hold', 'n'], '--out': ['outputDir', 'path'], '--frames': ['frameDir', 'path'], '--t': ['t', 'n'], '--jobs': ['jobs', 'n'],
  '--xf': ['xf', 's'], '--xf-dur': ['xfDur', 'n'], '--captions': ['captions', 's'], '--from': ['from', 'n'], '--to': ['to', 'n'], '--audio': ['audio', 's'],
  '--transparent': ['transparent', 'b'], '--poster': ['poster', 'b'], '--keep-frames': ['keepFrames', 'b'], '--list': ['list', 'b'],
  '--force': ['force', 'b'], '--timed': ['timed', 'b'], '--no-timed': ['noTimed', 'b'], '--preview': ['preview', 'b'], '--resume': ['resume', 'b'], '--no-audio': ['noAudio', 'b'],
  '--var': ['vars', 'list'], '--variant': ['variant', 's'], '--strip': ['strip', 'b'], '--over': ['over', 's'], '--over-end': ['overEnd', 'n'], '--open': ['open', 'b'], '--port': ['port', 'n'],
  // scripts/dual-render.js
  '--chunk': ['chunk', 'n'], '--only': ['only', 's'], '--limit': ['limit', 'n'], '--source': ['source', 's'], '--reveals': ['reveals', 's'], '--punch': ['punch', 'n'],
};
function parseArgs(argv) {
  const o = { slide: [], vars: [], format: 'all', transparent: false, poster: false, keepFrames: false, list: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const def = FLAGS[a];
    if (!def) {
      if (a.startsWith('-')) throw new Error('unknown flag ' + a + '\nknown: ' + Object.keys(FLAGS).join(' '));
      o.slide.push(a); continue;
    }
    const [key, type] = def;
    if (type === 'b') { o[key] = true; continue; }
    const v = argv[++i];
    if (v === undefined) throw new Error(a + ' needs a value');
    if (type === 'list') o[key].push(v); else if (type === 'n') o[key] = +v; else if (type === 'path') o[key] = path.resolve(v); else o[key] = v;
  }
  return o;
}
module.exports = { parseArgs, FLAGS };
