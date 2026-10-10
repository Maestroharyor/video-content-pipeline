#!/usr/bin/env node
/**
 * Asset fetcher. Two modes, both idempotent (existing files are never re-downloaded):
 *
 *   node scripts/fetch-assets.js                      shared, brand-agnostic set every project needs:
 *                                                     fonts, the outro marks (instagram, x, tiktok, braandly), audio beds
 *   node scripts/fetch-assets.js --project <slug>     what THIS project declares in project.js → assets:
 *       aws:    ['ec2', 'lambda', …]                  official AWS Architecture Icons → assets/logos/aws/<name>.svg (shared cache, any project can reuse)
 *       brands: ['docker', 'python', …]               simple-icons slugs           → assets/logos/brands/<slug>.svg (shared cache)
 *       urls:   { acme: 'https://…/logo.svg' }        anything else (official brand pages) → projects/<slug>/assets/<name>.svg (passet('acme.svg'))
 *
 * Nothing vendor-specific is fetched unless a project asks for it. Provenance goes to assets/SOURCES.md (shared) and
 * projects/<slug>/assets/SOURCES.md (per project).
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const A = (...p) => path.join(ROOT, 'assets', ...p);
const CACHE = A('.cache');
// The original deck's source is kept for reference only. Fonts/audio/braandly are committed under assets/;
// this path is consulted only when one of them is missing AND the reference deck is present.
const PREV = path.join(ROOT, 'generated', 'source-appux5-deck');

const AWS_ICONS_PAGE = 'https://aws.amazon.com/architecture/icons/';
const AWS_ZIP = 'https://d1.awsstatic.com/onedam/marketing-channels/website/public/shared/architecture-icon-release/Icon-package_07312026.5846e92413caa21490223536cc97f1269e44fa92.zip';
const OPEN_SANS = 'https://github.com/googlefonts/opensans/raw/main/fonts/variable/OpenSans%5Bwdth%2Cwght%5D.ttf';
// short names → exact zip entries (anything not listed is found by searching the zip: see resolveAws)
const AWS_ALIASES = {
  'ec2':              'Architecture-Service-Icons_07312026/Arch_Compute/64/Arch_Amazon-EC2_64.svg',
  'rds':              'Architecture-Service-Icons_07312026/Arch_Databases/64/Arch_Amazon-RDS_64.svg',
  'ebs':              'Architecture-Service-Icons_07312026/Arch_Storage/64/Arch_Amazon-Elastic-Block-Store_64.svg',
  's3':               'Architecture-Service-Icons_07312026/Arch_Storage/64/Arch_Amazon-Simple-Storage-Service_64.svg',
  'vpc':              'Architecture-Service-Icons_07312026/Arch_Networking-Content-Delivery/64/Arch_Amazon-Virtual-Private-Cloud_64.svg',
  'cost-explorer':    'Architecture-Service-Icons_07312026/Arch_Cloud-Financial-Management/64/Arch_AWS-Cost-Explorer_64.svg',
  'billing':          'Architecture-Service-Icons_07312026/Arch_Cloud-Financial-Management/64/Arch_AWS-Billing-Conductor_64.svg',
  'nat-gateway':      'Resource-Icons_07312026/Res_Networking-Content-Delivery/Res_Amazon-VPC_NAT-Gateway_48.svg',
  'internet-gateway': 'Resource-Icons_07312026/Res_Networking-Content-Delivery/Res_Amazon-VPC_Internet-Gateway_48.svg',
  'ec2-instance':     'Resource-Icons_07312026/Res_Compute/Res_Amazon-EC2_Instance_48.svg',
  'ebs-volume':       'Resource-Icons_07312026/Res_Storage/Res_Amazon-Elastic-Block-Store_Volume_48.svg',
  'aws-cloud-logo':   'Architecture-Group-Icons_07312026/AWS-Cloud-logo_32.svg',
};
// abbreviations whose official file names are spelled out
const AWS_TERMS = { sqs: 'simple-queue-service', sns: 'simple-notification-service', ses: 'simple-email-service', eks: 'elastic-kubernetes-service',
  ecs: 'elastic-container-service', ecr: 'elastic-container-registry', elb: 'elastic-load-balancing', alb: 'elastic-load-balancing',
  efs: 'elastic-file-system', emr: 'emr', iam: 'identity-and-access-management', kms: 'key-management-service', acm: 'certificate-manager',
  cloudwatch: 'cloudwatch', eventbridge: 'eventbridge', 'step-functions': 'step-functions', bedrock: 'bedrock', sagemaker: 'sagemaker' };
const OUTRO_MARKS = ['instagram', 'x', 'tiktok'];   // what core/brand.js's default outro uses

const log = (...a) => console.log('[assets]', ...a);
const ensureDir = p => fs.mkdirSync(p, { recursive: true });
const copyIfMissing = (src, dst, what) => {
  if (fs.existsSync(dst)) return;
  if (!fs.existsSync(src)) { log(`skip ${what}: ${path.relative(ROOT, dst)} missing and ${path.relative(ROOT, src)} not available`); return; }
  fs.copyFileSync(src, dst);
};
function need(bin, probeArgs) {
  try { execFileSync(bin, probeArgs, { stdio: 'ignore' }); }
  catch { console.error(`[assets] \`${bin}\` is required on PATH (macOS: preinstalled; Linux: apt install ${bin}; Windows: install it or use Git Bash)`); process.exit(1); }
}
function download(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return false;
  need('curl', ['--version']);
  log('downloading', url);
  try { execFileSync('curl', ['-sSL', '--fail', '-o', dest, url], { stdio: 'inherit' }); }
  catch (e) { try { fs.rmSync(dest, { force: true }); } catch {} console.error(`[assets] download failed: ${url}`); process.exit(1); }
  return true;
}
function unzipFile(zip, entry) { need('unzip', ['-v']); return execFileSync('unzip', ['-p', zip, entry], { maxBuffer: 1 << 24 }).toString('utf8'); }
let zipList = null;
function zipEntries(zip) { need('unzip', ['-v']); return zipList || (zipList = execFileSync('unzip', ['-Z1', zip], { maxBuffer: 1 << 26 }).toString('utf8').split('\n').filter(e => e.endsWith('.svg'))); }
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
/* find the zip entry for a short name: alias first, then the best-matching official file name
   (service icons at 64px preferred over resource icons at 48px; shortest name wins ties) */
function resolveAws(zip, name) {
  if (AWS_ALIASES[name]) return AWS_ALIASES[name];
  const n = norm(AWS_TERMS[name] || name);
  const cands = zipEntries(zip).filter(e => /(_64|_48)\.svg$/.test(e)).map(e => {
    const base = path.basename(e).replace(/^(Arch_|Res_)/, '').replace(/_(64|48)\.svg$/, '').replace(/^(Amazon-|AWS-)/, '');
    return { e, base: norm(base), arch: /^Arch_/.test(path.basename(e)) };
  }).filter(c => c.base === n || c.base.includes(n));
  cands.sort((a, b) => (a.base === n ? 0 : 1) - (b.base === n ? 0 : 1) || (a.arch ? 0 : 1) - (b.arch ? 0 : 1) || a.base.length - b.base.length);
  return cands.length ? cands[0].e : null;
}
function simpleIcon(slug) {
  const si = require('simple-icons');
  const ic = si['si' + slug[0].toUpperCase() + slug.slice(1)];
  return ic ? { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>${ic.title}</title><path fill="#${ic.hex}" d="${ic.path}"/></svg>\n`, title: ic.title, hex: ic.hex } : null;
}
/* Rows a fetch did not make (a logo from a vendor's own icon pack, an illustration downloaded by hand) go under a
   `## Added by hand` heading; the file is regenerated on every fetch, so that section is carried over verbatim. */
const HAND = '## Added by hand';
function writeSources(file, title, rows, footer) {
  const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '', at = old.indexOf(HAND);
  const hand = at >= 0 ? ['', old.slice(at).trimEnd()] : [];
  const md = ['# ' + title, '', '| File | Source | Notes |', '|------|--------|-------|', ...rows.map(r => `| ${r[0]} | ${r[1]} | ${r[2]} |`), '', ...(footer || []), ...hand].join('\n') + '\n';
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== md) { fs.writeFileSync(file, md); return true; }
  return false;
}

/* ---------- shared set ---------- */
function fetchShared() {
  ensureDir(CACHE); ensureDir(A('fonts')); ensureDir(A('logos', 'aws')); ensureDir(A('logos', 'brands')); ensureDir(A('audio'));
  const sources = [];
  for (const f of ['InterVariable.woff2', 'InterDisplay-Bold.woff2', 'InterDisplay-ExtraBold.woff2', 'InterDisplay-Black.woff2',
    'InterDisplay-SemiBold.woff2', 'InterDisplay-Medium.woff2', 'JetBrainsMono-Regular.woff2', 'JetBrainsMono-Bold.woff2']) copyIfMissing(path.join(PREV, 'fonts', f), A('fonts', f), 'font');
  sources.push(['assets/fonts/Inter*.woff2', 'https://rsms.me/inter/', 'Inter / Inter Display 4.x (SIL OFL 1.1)']);
  sources.push(['assets/fonts/JetBrainsMono-*.woff2', 'https://www.jetbrains.com/lp/mono/', 'JetBrains Mono (SIL OFL 1.1)']);
  if (!fs.existsSync(A('fonts', 'OpenSans-Variable.ttf'))) { const os = path.join(CACHE, 'opensans.ttf'); download(OPEN_SANS, os); fs.copyFileSync(os, A('fonts', 'OpenSans-Variable.ttf')); }
  sources.push(['assets/fonts/OpenSans-Variable.ttf', 'https://github.com/googlefonts/opensans', 'Open Sans variable (SIL OFL 1.1). Used inside the AWS console mock (Cloudscape uses Open Sans; Amazon Ember is not redistributable).']);
  log('fonts ok');
  for (const slug of OUTRO_MARKS) {
    const dst = A('logos', 'brands', slug + '.svg');
    if (!fs.existsSync(dst)) { const ic = simpleIcon(slug); if (ic) fs.writeFileSync(dst, ic.svg); else log('MISSING simple-icons slug', slug); }
    sources.push(['assets/logos/brands/' + slug + '.svg', 'https://simpleicons.org/?q=' + slug, 'simple-icons npm package (outro handle tile)']);
  }
  copyIfMissing(path.join(PREV, 'assets', 'braandly.svg'), A('logos', 'brands', 'braandly.svg'), 'braandly mark');
  sources.push(['assets/logos/brands/braandly.svg', 'https://braandly.bio', 'braandly mark (link-in-bio box in the outro)']);
  sources.push(['(LinkedIn)', 'https://brand.linkedin.com/', 'Not downloaded: simple-icons does not ship the LinkedIn mark. Rendered as an "in" text tile in #0A66C2.']);
  for (const f of ['outro.wav', 'pop.wav', 'shim.wav']) copyIfMissing(path.join(PREV, 'audio', f), A('audio', f), 'audio bed');
  sources.push(['assets/audio/*.wav', 'own recording', 'Outro audio bed (pops + shimmer)']);
  sources.push(['assets/logos/aws/*.svg', AWS_ICONS_PAGE, 'AWS Architecture Icons, fetched on demand by projects that list them (project.js → assets.aws); see each project\'s SOURCES.md']);
  sources.push(['assets/logos/brands/*.svg (others)', 'https://simpleicons.org', 'simple-icons marks fetched on demand by projects (project.js → assets.brands)']);
  log('outro marks + audio ok');
  const changed = writeSources(A('SOURCES.md'), 'Asset sources', sources,
    ['AWS Architecture Icons are provided by Amazon Web Services under the terms on the icons page (use to depict AWS architecture; do not alter the marks).',
     'Brand marks from simple-icons are trademarks of their respective owners.']);
  log(changed ? 'wrote assets/SOURCES.md' : 'assets/SOURCES.md unchanged');
}

/* ---------- per project ---------- */
function fetchForProject(slug) {
  const { loadProject } = require('../renderer/project');
  const { dir, project } = loadProject(slug);
  const want = project.assets || {};
  const out = path.join(dir, 'assets');
  ensureDir(out); ensureDir(CACHE); ensureDir(A('logos', 'aws')); ensureDir(A('logos', 'brands'));
  const rows = []; let fetched = 0;
  if ((want.aws || []).length) {
    const zip = path.join(CACHE, 'aws-icons.zip');
    const missing = want.aws.filter(n => !fs.existsSync(A('logos', 'aws', n + '.svg')) && !(n === 'aws-cloud-logo' && fs.existsSync(A('logos', 'aws', 'aws-logo-white.svg'))));
    if (missing.length) download(AWS_ZIP, zip);
    for (const name of want.aws) {
      const dst = A('logos', 'aws', name + '.svg');
      if (name === 'aws-cloud-logo') {
        if (!fs.existsSync(A('logos', 'aws', 'aws-logo-white.svg'))) {
          // the group logo ships on a dark square; strip it so the mark sits on our own nav colour
          const svg = unzipFile(zip, AWS_ALIASES[name]).replace(/<rect id="Rectangle" fill="#242F3E"[^>]*><\/rect>/, '');
          fs.writeFileSync(A('logos', 'aws', 'aws-logo-white.svg'), svg); fs.writeFileSync(A('logos', 'aws', 'aws-logo-dark.svg'), svg.replace(/#FFFFFF/gi, '#232F3E')); fetched++;
        }
        rows.push(['assets/logos/aws/aws-logo-white.svg, aws-logo-dark.svg (shared)', AWS_ICONS_PAGE, 'AWS Architecture Icons: ' + AWS_ALIASES[name] + ' (background square removed)']);
        continue;
      }
      let entry = AWS_ALIASES[name] || null;
      if (!fs.existsSync(dst)) {
        entry = resolveAws(zip, name);
        if (!entry) { log('no AWS icon matches "' + name + '" (try the service name as on the icons page, e.g. lambda, dynamodb, cloudfront)'); rows.push(['(' + name + ')', AWS_ICONS_PAGE, 'NOT FOUND in the AWS Architecture Icons package']); continue; }
        fs.writeFileSync(dst, unzipFile(zip, entry)); fetched++; log('aws', name, '←', path.basename(entry));
      }
      rows.push(['assets/logos/aws/' + name + '.svg (shared)', AWS_ICONS_PAGE, 'AWS Architecture Icons package' + (entry ? ': ' + entry : '')]);
    }
  }
  for (const slugName of want.brands || []) {
    const dst = A('logos', 'brands', slugName + '.svg');
    const ic = simpleIcon(slugName);
    if (!ic) { log('MISSING simple-icons slug', slugName); rows.push(['(' + slugName + ')', 'https://simpleicons.org', 'NOT FOUND in simple-icons; add the SVG from the official brand page via assets.urls']); continue; }
    if (!fs.existsSync(dst)) { fs.writeFileSync(dst, ic.svg); fetched++; log('brand', slugName); }
    rows.push(['assets/logos/brands/' + slugName + '.svg (shared)', 'https://simpleicons.org/?q=' + slugName, 'simple-icons (' + ic.title + ', #' + ic.hex + ')']);
  }
  for (const [name, url] of Object.entries(want.urls || {})) {
    const ext = (path.extname(new URL(url).pathname) || '.svg').toLowerCase();
    const dst = path.join(out, name + ext);
    if (download(url, dst)) { fetched++; log('url', name + ext); }
    rows.push(['assets/' + name + ext, url, 'downloaded as declared in project.js → assets.urls; use passet(\'' + name + ext + '\')']);
  }
  writeSources(path.join(out, 'SOURCES.md'), 'Asset sources (' + project.slug + ')', rows);
  log('project', project.slug + ':', rows.length, 'asset(s),', fetched, 'fetched →', path.relative(ROOT, out) + '/SOURCES.md');
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const projArg = argv[argv.indexOf('--project') + 1];
  if (argv.includes('--project') && projArg) fetchForProject(projArg); else fetchShared();
}
module.exports = { resolveAws, fetchShared, fetchForProject, AWS_ALIASES };
