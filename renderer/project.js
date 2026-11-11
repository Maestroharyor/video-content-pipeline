/* Project discovery + settings for Node. project.js is a browser file (window.PROJECT = {...}); evaluate it in a sandbox. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const PROJECTS = path.join(ROOT, 'projects');

const CANVAS = { vertical: { width: 1080, height: 1920 }, horizontal: { width: 1920, height: 1080 } };
/* output resolution = the CSS stage × a device scale factor (layout never changes; Chrome just rasterises finer).
   RES_OPTIONS is what the wizard offers per canvas, first = default. */
const RES = { '1080p': 1, '1440p': 4 / 3, '2k': 4 / 3, '4k': 2 };
const RES_OPTIONS = { horizontal: ['4k', '1440p', '1080p'], vertical: ['2k', '1080p'] };
const RES_DEFAULT = { horizontal: RES_OPTIONS.horizontal[0], vertical: RES_OPTIONS.vertical[0] };

function listProjects() {
  if (!fs.existsSync(PROJECTS)) return [];
  return fs.readdirSync(PROJECTS).filter(d => fs.existsSync(path.join(PROJECTS, d, 'project.js'))).sort();
}
function projectDir(slugOrDir) {
  if (!slugOrDir) {
    const env = process.env.VID_PROJECT; if (env) return projectDir(env);
    const all = listProjects();
    if (all.length === 1) return path.join(PROJECTS, all[0]);
    throw new Error('--project <slug> is required. Available: ' + (all.join(', ') || '(none; run npm run new)'));
  }
  const abs = path.isAbsolute(slugOrDir) ? slugOrDir : fs.existsSync(path.join(PROJECTS, slugOrDir)) ? path.join(PROJECTS, slugOrDir) : path.resolve(slugOrDir);
  if (!fs.existsSync(path.join(abs, 'project.js'))) throw new Error('no project.js in ' + abs + '. Available: ' + listProjects().join(', '));
  return abs;
}
/* opts.variant: a named block of project.js (e.g. `vertical: { canvas: 'vertical', grid: {…} }`) laid over the base
   settings, so one project renders the same deck on another canvas (core/grid.js does the same in the browser).
   project.js sees window.VARIANT while it runs, to skip base-only geometry. */
function loadProject(slugOrDir, opts = {}) {
  const dir = projectDir(slugOrDir);
  const sandbox = { window: opts.variant ? { VARIANT: opts.variant } : {} };
  /* a nested project (projects/<video>/social) runs on top of its video's settings, as its index.html loads
     ../project.js first: its own project.js starts from window.PROJECT and changes only what differs */
  const parent = path.join(dir, '..', 'project.js');
  if (path.resolve(dir, '..') !== PROJECTS && fs.existsSync(parent)) vm.runInNewContext(fs.readFileSync(parent, 'utf8'), sandbox, { filename: parent });
  vm.runInNewContext(fs.readFileSync(path.join(dir, 'project.js'), 'utf8'), sandbox, { filename: 'project.js' });
  const P = sandbox.window.PROJECT;
  if (!P) throw new Error('project.js must set window.PROJECT');
  P.slug = P.slug || path.basename(dir);
  if (opts.variant) {
    if (!P[opts.variant]) throw new Error(`project.js has no "${opts.variant}" block (--variant ${opts.variant})`);
    Object.assign(P, P[opts.variant]); P.variant = opts.variant;
  }
  P.canvas = P.canvas || 'vertical';
  if (!CANVAS[P.canvas]) throw new Error('unknown canvas ' + P.canvas);
  return { dir, project: P };
}
/* every engine script a project index.html loads, in order (managed by syncIndex so adding a core file is a one-line change) */
const CORE_SCRIPTS = ['grid.js', 'timeline.js', 'bg.js', 'anim.js', 'components/aws-console.js', 'components/cost-chart.js', 'components/vpc-diagram.js',
  'components/misc.js', 'components/cast.js', 'components/fx.js', 'components/subscribe.js', 'components/figure.js', 'brand.js', 'captions.js', 'registry.js', 'overlay.js', 'templates/_shared.js', 'templates/title.js', 'templates/statement.js',
  'templates/compare.js', 'templates/list.js', 'templates/logos.js', 'templates/code.js', 'templates/console.js', 'templates/chart.js',
  'templates/checklist.js', 'templates/diagram.js', 'templates/cards.js', 'templates/hop.js', 'templates/anatomy.js', 'templates/tree.js',
  'templates/rail.js', 'templates/lanes.js', 'templates/app.js', 'templates/map.js', 'templates/bench.js', 'templates/talk.js', 'templates/providers.js', 'templates/meter.js', 'templates/term.js', 'templates/pipeline.js', 'templates/tiers.js', 'templates/matrix.js', 'templates/stackcode.js', 'templates/quota.js',
  'templates/desk.js', 'templates/cabinet.js', 'templates/budget.js', 'templates/flow.js', 'templates/swap.js', 'templates/crash.js', 'templates/noc.js', 'templates/recover.js', 'templates/gap.js', 'templates/wire.js', 'templates/chat.js', 'templates/xray.js', 'templates/bakery.js', 'templates/prep.js', 'templates/trail.js', 'templates/redline.js', 'templates/warehouse.js', 'templates/board.js', 'templates/cafe.js', 'templates/plan.js', 'templates/bistro.js', 'templates/outro.js'];
/* relative to the project folder: ../../core for projects/<slug>, ../../../core for a nested one (projects/<slug>/social) */
const coreBlock = dir => '<!-- core:start (managed by the renderer: engine scripts in load order) -->\n' +
  CORE_SCRIPTS.map(f => `<script src="${path.relative(dir, ROOT).split(path.sep).join('/')}/core/${f}"></script>`).join('\n') + '\n<!-- core:end -->';
const slidesBlock = files => '<!-- slides:start (managed by the renderer: every slides/*.js in numeric order) -->\n' +
  files.map(f => `<script src="slides/${f}"></script>`).join('\n') + '\n<!-- slides:end -->';
/* keep the managed blocks of index.html in sync: core scripts and slides/*.js (name order = deck order).
   An index.html without core markers (pre-timeline projects) is rebuilt from the skeleton, keeping its <title>. */
function syncIndex(dir) {
  const idx = path.join(dir, 'index.html');
  if (!fs.existsSync(idx)) throw new Error('missing ' + idx + ' (copy core/skeleton/index.html)');
  /* Numeric order on the leading number, not string order: a 150-slide deck sorts "100-…" before "11-…" as
     plain text, which silently reorders the whole timeline (the cue sheet check catches it as "slide order
     differs from deck order"). Files without a leading number keep their name order, after the numbered ones. */
  const slideOrder = (a, b) => {
    const na = (a.match(/^(\d+)/) || [])[1], nb = (b.match(/^(\d+)/) || [])[1];
    if (na && nb && +na !== +nb) return +na - +nb;
    if (na && !nb) return -1;
    if (!na && nb) return 1;
    return a.localeCompare(b);
  };
  const files = fs.existsSync(path.join(dir, 'slides')) ? fs.readdirSync(path.join(dir, 'slides')).filter(f => f.endsWith('.js')).sort(slideOrder) : [];
  let html = fs.readFileSync(idx, 'utf8');
  if (!/<!-- core:start/.test(html)) {
    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || path.basename(dir);
    html = fs.readFileSync(path.join(ROOT, 'core', 'skeleton', 'index.html'), 'utf8').replace('__TITLE__', title);
  }
  const out = html.replace(/<!-- core:start[\s\S]*?<!-- core:end -->/, coreBlock(dir)).replace(/<!-- slides:start[\s\S]*?<!-- slides:end -->/, slidesBlock(files));
  if (out !== fs.readFileSync(idx, 'utf8')) fs.writeFileSync(idx, out);
  return files;
}
/* audio for a slide: absolute, project dir, project assets, then shared assets/audio */
function resolveAudio(dir, file) {
  if (!file) return null;
  const cands = [path.isAbsolute(file) ? file : null, path.join(dir, file), path.join(dir, 'assets', file), path.join(ROOT, 'assets', 'audio', file)].filter(Boolean);
  return cands.find(f => fs.existsSync(f)) || null;
}
module.exports = { ROOT, PROJECTS, CANVAS, RES, RES_OPTIONS, RES_DEFAULT, CORE_SCRIPTS, listProjects, projectDir, loadProject, syncIndex, resolveAudio };
