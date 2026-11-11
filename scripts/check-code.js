#!/usr/bin/env node
/* Every code example a video shows must be real and correct (user, 2026-11-11: "ensure all the code examples and snippets
   are correct"). A project keeps the complete files it shows in projects/<slug>/code/; this script checks each one with
   the real tool, then writes projects/<slug>/code.js (window.CODE[file] = [lines]) for the slides. Slides show those
   lines, or an excerpt with the file's own line numbers, never retyped code.
     npm run check-code -- --project <slug> [--allow-unchecked] [--width 80]
   Checks by file type:
     *.js / *.cjs / *.mjs          node --check
     *.json                        JSON.parse
     *.sh                          bash -n
     *.conf (nginx)                nginx -t on a scratch nginx.conf: events {} + http { <the file> }. Paths the file names under
                                   /etc/ssl and /var/log are rewritten into the scratch prefix, and a throwaway self-signed
                                   certificate is made for every ssl_certificate pair, so the check is the syntax and the
                                   directives, not this machine's files.
     Caddyfile                     caddy validate --adapter caddyfile (local caddy, else docker image caddy:2)
   Every file is also held to the formatting rule (format(): line width, one-line blocks, tabs).
   Files with no available checker are reported UNCHECKED and fail the run unless --allow-unchecked (then say so at the
   preview: an unchecked snippet is a decision for the user, not a silent pass). Files under code/ named *.txt are copied
   into code.js without a check (prose, output text). */
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync, spawnSync } = require('child_process');
const { projectDir } = require('../renderer/project');

const argv = process.argv.slice(2), val = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const slug = val('--project') || val('-p') || process.env.VID_PROJECT;
if (!slug) { console.error('usage: npm run check-code -- --project <slug> [--allow-unchecked]'); process.exit(1); }
const dir = path.join(projectDir(slug), 'code');
if (!fs.existsSync(dir)) { console.error('no ' + path.relative(process.cwd(), dir) + ': put the complete files the video shows there'); process.exit(1); }
const has = bin => spawnSync('sh', ['-c', 'command -v ' + bin], { encoding: 'utf8' }).status === 0;
const run = (bin, args, o) => { const r = spawnSync(bin, args, Object.assign({ encoding: 'utf8' }, o || {})); return { ok: r.status === 0, out: (r.stdout || '') + (r.stderr || '') }; };

function nginx(file) {
  if (!has('nginx')) return null;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vid-nginx-'));
  ['logs', 'ssl', 'log'].forEach(d => fs.mkdirSync(path.join(tmp, d), { recursive: true }));
  let body = fs.readFileSync(file, 'utf8').replace(/\/etc\/ssl\//g, tmp + '/ssl/').replace(/\/var\/log\/nginx\//g, tmp + '/log/');
  // a throwaway self-signed pair for every certificate the file names
  const certs = [...body.matchAll(/ssl_certificate\s+(\S+);/g)].map(m => m[1]);
  certs.forEach(crt => {
    const key = (body.match(/ssl_certificate_key\s+(\S+);/) || [])[1] || crt.replace(/\.crt$/, '.key');
    execFileSync('openssl', ['req', '-x509', '-nodes', '-newkey', 'rsa:2048', '-days', '1', '-subj', '/CN=check', '-keyout', key, '-out', crt], { stdio: 'ignore' });
  });
  const conf = path.join(tmp, 'nginx.conf');
  fs.writeFileSync(conf, `pid ${tmp}/nginx.pid;\nerror_log ${tmp}/logs/error.log;\nevents {}\nhttp {\n  access_log ${tmp}/logs/access.log;\n${body}\n}\n`);
  const r = run('nginx', ['-t', '-p', tmp, '-c', conf]);
  fs.rmSync(tmp, { recursive: true, force: true });
  return { ok: r.ok, tool: 'nginx -t', out: r.out.replace(new RegExp(tmp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '<scratch>') };
}
function caddy(file) {
  if (has('caddy')) { const r = run('caddy', ['validate', '--adapter', 'caddyfile', '--config', file]); return { ok: r.ok, tool: 'caddy validate', out: r.out }; }
  if (has('docker') && run('docker', ['info']).ok) {
    const r = run('docker', ['run', '--rm', '-v', path.dirname(file) + ':/w:ro', 'caddy:2', 'caddy', 'validate', '--adapter', 'caddyfile', '--config', '/w/' + path.basename(file)]);
    return { ok: r.ok, tool: 'caddy validate (docker)', out: r.out };
  }
  return null;
}
/* formatting, the house rule (code is never cut off, formatted like prettier): no line past --width (80, prettier's
   printWidth), no block on one line (`upstream x { server …; server …; }`), no tabs */
const WIDTH = +(val('--width') || 80);
function format(f) {
  const issues = [];
  fs.readFileSync(path.join(dir, f), 'utf8').split('\n').forEach((l, i) => {
    if (l.length > WIDTH) issues.push(`line ${i + 1} is ${l.length} columns (max ${WIDTH})`);
    if (/\t/.test(l)) issues.push(`line ${i + 1} has a tab`);
    if (/\{[^{}]*;[^{}]*;[^{}]*\}/.test(l)) issues.push(`line ${i + 1} holds a whole block on one line`);
  });
  return issues;
}
function check(f) {
  const file = path.join(dir, f);
  if (/\.(c|m)?js$/.test(f)) { const r = run(process.execPath, ['--check', file]); return { ok: r.ok, tool: 'node --check', out: r.out }; }
  if (/\.json$/.test(f)) { try { JSON.parse(fs.readFileSync(file, 'utf8')); return { ok: true, tool: 'JSON.parse' }; } catch (e) { return { ok: false, tool: 'JSON.parse', out: e.message }; } }
  if (/\.sh$/.test(f)) { const r = run('bash', ['-n', file]); return { ok: r.ok, tool: 'bash -n', out: r.out }; }
  if (/\.conf$/.test(f)) return nginx(file);
  if (/^Caddyfile/.test(f)) return caddy(file);
  return null;
}

const files = fs.readdirSync(dir).filter(f => !f.startsWith('.') && fs.statSync(path.join(dir, f)).isFile()).sort();
const out = {}; let bad = 0, unchecked = 0;
for (const f of files) {
  out[f] = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\n$/, '').split('\n');
  if (/\.txt$/.test(f)) { console.log(`  text       ${f}`); continue; }
  const fmt = /\.txt$/.test(f) ? [] : format(f);
  if (fmt.length) { bad++; console.log(`  FORMAT     ${f}\n${fmt.map(l => '             ' + l).join('\n')}`); }
  const r = check(f);
  if (!r) { unchecked++; console.log(`  UNCHECKED  ${f} (no checker on this machine)`); continue; }
  if (r.ok) console.log(`  ok         ${f}  (${r.tool})`);
  else { bad++; console.log(`  FAIL       ${f}  (${r.tool})\n${(r.out || '').trim().split('\n').map(l => '             ' + l).join('\n')}`); }
}
fs.writeFileSync(path.join(projectDir(slug), 'code.js'), '/* generated by npm run check-code from code/, do not edit */\nwindow.CODE = ' + JSON.stringify(out, null, 1) + ';\n');
console.log(`check-code ${slug}: ${files.length} file(s), ${bad} failed, ${unchecked} unchecked → code.js`);
if (bad || (unchecked && !argv.includes('--allow-unchecked'))) process.exit(1);
