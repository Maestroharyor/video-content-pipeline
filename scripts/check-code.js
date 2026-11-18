#!/usr/bin/env node
/* Every code example a video shows must be real and correct (user, 2026-11-11: "ensure all the code examples and snippets
   are correct"). A project keeps the complete files it shows in projects/<slug>/code/; this script checks each one with
   the real tool, then writes projects/<slug>/code.js (window.CODE[file] = [lines]) for the slides. Slides show those
   lines, or an excerpt with the file's own line numbers, never retyped code.
     npm run check-code -- --project <slug> [--allow-unchecked] [--width 80] [--capture] [--verbose]
   Checks by file type:
     *.js / *.cjs / *.mjs          node --check
     *.ts                          node's own TypeScript parser (module.stripTypeScriptTypes, swc), then node --check on the
                                   stripped module: the syntax, not the types (no tsc in this repo)
     *.json                        JSON.parse
     *.sh                          bash -n
     *.conf (nginx)                nginx -t on a scratch nginx.conf: events {} + http { <the file> }. Paths the file names under
                                   /etc/ssl and /var/log are rewritten into the scratch prefix, and a throwaway self-signed
                                   certificate is made for every ssl_certificate pair, so the check is the syntax and the
                                   directives, not this machine's files.
     Caddyfile                     caddy validate --adapter caddyfile (local caddy, else docker image caddy:2)
     *.sql                         RUN on a real Postgres, statement by statement (user, 2026-11-17: "every code example and
                                   facts must be correct"), not parsed. Each file gets its own fresh database: the declared
                                   extensions are created, the setup files run (tables + sample rows the video never shows),
                                   then every statement of the file, in one psql session (BEGIN/COMMIT, LISTEN/NOTIFY work).
                                   A statement with $1..$n runs as PREPARE vid_k(<types>) AS …; EXECUTE vid_k(<values>).
                                   The file passes only if every statement runs and every row expectation holds.
                                   Where it runs:
                                     no extension (or a contrib one like pg_trgm)  a scratch initdb cluster of the local
                                       Postgres (TCP 127.0.0.1, -k '', so no socket path), in a temp dir removed afterwards
                                     vector  docker pgvector/pgvector:0.8.7-pg18     (official image, pgvector's README)
                                     pgmq    docker ghcr.io/pgmq/pg18-pgmq:v1.13.1   (official image, pgmq's README)
                                     (no Docker: a scratch cluster of a local install whose extension dir already has
                                       every needed extension, newest first: Postgres.app versions, Homebrew opt dirs;
                                       Postgres.app ships pgvector. Real extension code, so it counts as checked)
                                     pg_cron no image: the local cluster with a stub cron schema carrying the README's exact
                                       signatures (cron.schedule(schedule text, command text) RETURNS bigint, and the named
                                       3-argument form); the stub runs the scheduled command once so its SQL is proven too
                                   Containers are started with --rm and stopped at exit. Without Docker, a pgmq file runs on
                                   the local cluster against a stub with pgmq 1.13.1's signatures (send/read/archive/create,
                                   pgmq.message_record) and a vector file is UNCHECKED. A stubbed file reports STUB, never ok,
                                   and like UNCHECKED fails the run unless --allow-unchecked.
                                   The sidecar code/_check.json says what each file needs, since every line of a shown file
                                   is on screen (files starting with _ are never shown, checked alone or put in code.js):
                                     { "setup": ["_setup.sql"],                       default setup for every .sql file
                                       "files": { "pgvector.sql": {
                                         "extensions": ["vector"],                  created before the setup
                                         "setup": ["_setup.sql", "_setup-vector.sql"],   replaces the default
                                         "params": [{ "type": "vector", "value": "[1,0,0]" }],   $1, $2… in order
                                         "expect": { "1": 2, "2": ">0" },           rows returned by statement N (1-based)
                                         "capture": { "1": "pgvector-out.txt" },    with --capture: statement N's real psql
                                                                                    output → code/<name> (never from a stub)
                                         "image": "…" } } }                          a different image for this file
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

function ts(file) {
  const strip = require('node:module').stripTypeScriptTypes;
  if (!strip) return null;
  let js;
  try { js = strip(fs.readFileSync(file, 'utf8')); } catch (e) { return { ok: false, tool: 'TypeScript parse', out: e.message }; }
  const tmp = path.join(os.tmpdir(), 'vid-ts-' + process.pid + '.mjs');
  fs.writeFileSync(tmp, js); const r = run(process.execPath, ['--check', tmp]); fs.rmSync(tmp, { force: true });
  return { ok: r.ok, tool: 'TypeScript parse + node --check', out: r.out };
}
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
/* ---------- SQL on a real Postgres ---------- */
const PG_IMAGES = { vector: 'pgvector/pgvector:0.8.7-pg18', pgmq: 'ghcr.io/pgmq/pg18-pgmq:v1.13.1' };
// Stubs carry the extension's own signatures (pg_cron README v1.6.8; pgmq-extension/sql/pgmq.sql v1.13.1), nothing more.
const STUBS = {
  pg_cron: `CREATE SCHEMA cron;
CREATE SEQUENCE cron.jobid_seq;
CREATE FUNCTION cron.schedule(schedule text, command text) RETURNS bigint
LANGUAGE plpgsql STRICT AS $f$
BEGIN
  IF schedule !~ '^\\s*\\S+\\s+\\S+\\s+\\S+\\s+\\S+\\s+\\S+\\s*$' AND schedule !~ '^\\s*[1-5]?[0-9] seconds?\\s*$' THEN
    RAISE EXCEPTION 'invalid schedule: %', schedule;
  END IF;
  EXECUTE command;
  RETURN nextval('cron.jobid_seq');
END $f$;
CREATE FUNCTION cron.schedule(job_name text, schedule text, command text) RETURNS bigint
LANGUAGE sql STRICT AS $f$ SELECT cron.schedule(schedule, command) $f$;`,
  pgmq: `CREATE SCHEMA pgmq;
CREATE TYPE pgmq.message_record AS (msg_id bigint, read_ct integer, enqueued_at timestamptz,
  last_read_at timestamptz, vt timestamptz, message jsonb, headers jsonb);
CREATE TABLE pgmq.meta (queue_name text PRIMARY KEY);
CREATE TABLE pgmq.q (queue_name text REFERENCES pgmq.meta, msg_id bigserial, read_ct integer DEFAULT 0,
  enqueued_at timestamptz DEFAULT now(), last_read_at timestamptz, vt timestamptz DEFAULT clock_timestamp(),
  message jsonb, headers jsonb);
CREATE TABLE pgmq.a (LIKE pgmq.q, archived_at timestamptz DEFAULT now());
CREATE FUNCTION pgmq.create(queue_name text) RETURNS void LANGUAGE sql AS
  $f$ INSERT INTO pgmq.meta VALUES (queue_name) ON CONFLICT DO NOTHING $f$;
CREATE FUNCTION pgmq.send(queue_name text, msg jsonb) RETURNS SETOF bigint LANGUAGE sql AS
  $f$ INSERT INTO pgmq.q (queue_name, message) VALUES (queue_name, msg) RETURNING msg_id $f$;
CREATE FUNCTION pgmq.read(queue_name text, vt integer, qty integer, conditional jsonb DEFAULT '{}')
RETURNS SETOF pgmq.message_record LANGUAGE sql AS $f$
  UPDATE pgmq.q SET read_ct = read_ct + 1, last_read_at = clock_timestamp(),
    vt = clock_timestamp() + make_interval(secs => read.vt)
  WHERE msg_id IN (SELECT msg_id FROM pgmq.q WHERE q.queue_name = read.queue_name AND q.vt <= clock_timestamp()
    AND q.message @> read.conditional ORDER BY msg_id LIMIT qty FOR UPDATE SKIP LOCKED)
  RETURNING msg_id, read_ct, enqueued_at, last_read_at, vt, message, headers $f$;
CREATE FUNCTION pgmq.archive(queue_name text, msg_id bigint) RETURNS boolean LANGUAGE sql AS $f$
  WITH m AS (DELETE FROM pgmq.q WHERE q.queue_name = archive.queue_name AND q.msg_id = archive.msg_id RETURNING *)
  , i AS (INSERT INTO pgmq.a SELECT *, now() FROM m RETURNING 1) SELECT count(*) > 0 FROM i $f$;
CREATE FUNCTION pgmq.archive(queue_name text, msg_ids bigint[]) RETURNS SETOF bigint LANGUAGE sql AS $f$
  WITH m AS (DELETE FROM pgmq.q WHERE q.queue_name = archive.queue_name AND q.msg_id = ANY (msg_ids) RETURNING *)
  , i AS (INSERT INTO pgmq.a SELECT *, now() FROM m RETURNING msg_id) SELECT msg_id FROM i $f$;
CREATE FUNCTION pgmq.delete(queue_name text, msg_id bigint) RETURNS boolean LANGUAGE sql AS $f$
  WITH m AS (DELETE FROM pgmq.q WHERE q.queue_name = delete.queue_name AND q.msg_id = delete.msg_id RETURNING 1)
  SELECT count(*) > 0 FROM m $f$;`
};
const sidecar = (() => {
  const f = path.join(dir, '_check.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
})();
const cleanups = [];
function cleanup() { while (cleanups.length) { try { cleanups.pop()(); } catch (e) { /* keep cleaning */ } } }
process.on('exit', cleanup);
['SIGINT', 'SIGTERM'].forEach(s => process.on(s, () => { cleanup(); process.exit(130); }));
let dockerState = null;
const dockerOk = () => dockerState === null ? (dockerState = has('docker') && run('docker', ['info']).ok) : dockerState;
const sleep = s => spawnSync('sleep', [String(s)]);

/* psql with stdout and stderr on one pipe, so an error lands right after the statement that raised it */
function psql(eng, db, args, input) {
  const a = [eng.psql || 'psql', '-X', '-h', '127.0.0.1', '-p', String(eng.port), '-U', 'postgres', '-d', db, '-v', 'ON_ERROR_STOP=1'].concat(args);
  const r = spawnSync('sh', ['-c', 'exec "$@" 2>&1', 'sh'].concat(a),
    { encoding: 'utf8', input, env: Object.assign({}, process.env, { PGTZ: 'UTC', PGCLIENTENCODING: 'UTF8' }) });
  return { ok: r.status === 0, out: r.stdout || '' };
}
function waitReady(eng, secs) {
  for (let i = 0; i < secs * 2; i++) { if (psql(eng, 'postgres', ['-c', 'SELECT 1']).ok) return true; sleep(0.5); }
  return false;
}
function serverVersion(eng) { return psql(eng, 'postgres', ['-At', '-c', 'SHOW server_version']).out.trim().split(' ')[0]; }

const engines = {};
/* bin = a Postgres install's bin directory (one that ships an extension the PATH install lacks), '' = the PATH one */
function localEngine(bin = '') {
  const key = 'local:' + bin, B = n => bin ? path.join(bin, n) : n;
  if (key in engines) return engines[key];
  engines[key] = null;
  if (!bin && (!has('initdb') || !has('pg_ctl') || !has('psql'))) return null;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vid-pg-'));
  cleanups.push(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const data = path.join(tmp, 'data');
  const init = run(B('initdb'), ['-D', data, '-U', 'postgres', '--auth=trust', '--no-sync', '-E', 'UTF8', '--locale=C']);
  if (!init.ok) throw new Error('initdb failed:\n' + init.out);
  for (let i = 0; i < 20; i++) {
    const port = 54000 + Math.floor(Math.random() * 6000);
    const r = run(B('pg_ctl'), ['-D', data, '-l', path.join(tmp, 'server.log'), '-w', '-t', '30', '-o',
      `-p ${port} -k '' -c listen_addresses=127.0.0.1 -c fsync=off`, 'start']);
    if (r.ok) {
      cleanups.push(() => run(B('pg_ctl'), ['-D', data, '-m', 'immediate', '-w', 'stop']));
      const eng = { port, real: true, psql: B('psql') };
      if (!waitReady(eng, 15)) throw new Error('local Postgres did not answer');
      eng.name = (bin ? bin.replace(/\/bin$/, '') + ', ' : 'local ') + 'Postgres ' + serverVersion(eng);
      return (engines[key] = eng);
    }
  }
  throw new Error('could not start a scratch Postgres cluster:\n' + fs.readFileSync(path.join(tmp, 'server.log'), 'utf8'));
}
/* no Docker: a local Postgres install that already ships every extension the file needs (Postgres.app bundles pgvector,
   Homebrew installs may carry others), newest first. Real extension code, so the run counts as checked. */
function installWith(exts) {
  const dirs = [];
  const add = root => { try { for (const d of fs.readdirSync(root)) { const b = path.join(root, d, 'bin'); if (fs.existsSync(path.join(b, 'pg_ctl'))) dirs.push(b); } } catch (e) { /* not installed */ } };
  add('/Applications/Postgres.app/Contents/Versions'); add('/opt/homebrew/opt'); add('/usr/local/opt');
  for (const b of dirs.sort().reverse()) {
    const share = run(path.join(b, 'pg_config'), ['--sharedir']).out.trim();
    if (share && exts.every(e => fs.existsSync(path.join(share, 'extension', e + '.control')))) return b;
  }
  return null;
}
function dockerEngine(image) {
  if (image in engines) return engines[image];
  engines[image] = null;
  if (!dockerOk()) return null;
  if (!run('docker', ['image', 'inspect', image]).ok) {
    console.log(`  (pulling ${image})`);
    const p = run('docker', ['pull', image]);
    if (!p.ok) throw new Error('docker pull ' + image + ' failed:\n' + p.out);
  }
  const r = run('docker', ['run', '-d', '--rm', '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', '-p', '127.0.0.1::5432', image]);
  if (!r.ok) throw new Error('docker run ' + image + ' failed:\n' + r.out);
  const id = r.out.trim().split('\n').pop();
  cleanups.push(() => run('docker', ['stop', '-t', '2', id]));
  const port = +run('docker', ['port', id, '5432/tcp']).out.trim().split('\n')[0].split(':').pop();
  // the image's entrypoint initialises on a socket-only server first, so a TCP answer means the real server is up
  const eng = { port, real: true };
  if (!waitReady(eng, 90)) throw new Error(image + ' did not answer on 127.0.0.1:' + port);
  eng.name = image + ' (Postgres ' + serverVersion(eng) + ')';
  return (engines[image] = eng);
}

/* comments, strings and dollar-quoted bodies blanked to spaces (same length), so ; and $n are found only in code */
function blankSql(src) {
  let out = '', i = 0;
  const blank = s => s.replace(/[^\n]/g, ' ');
  while (i < src.length) {
    const rest = src.slice(i);
    let end = -1;
    if (rest.startsWith('--')) { const e = src.indexOf('\n', i); end = e < 0 ? src.length : e; }
    else if (rest.startsWith('/*')) { const e = src.indexOf('*/', i + 2); end = e < 0 ? src.length : e + 2; }
    else if (src[i] === "'" || src[i] === '"') {
      let j = i + 1;
      while (j < src.length && !(src[j] === src[i] && src[j + 1] !== src[i])) j += src[j] === src[i] ? 2 : 1;
      end = Math.min(j + 1, src.length);
    } else {
      const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(rest);
      if (m && !/[A-Za-z0-9_]/.test(src[i - 1] || '')) {
        const e = src.indexOf(m[0], i + m[0].length); end = e < 0 ? src.length : e + m[0].length;
      }
    }
    if (end > i) { out += blank(src.slice(i, end)); i = end; } else { out += src[i]; i++; }
  }
  return out;
}
function splitSql(src) {
  const b = blankSql(src), stmts = [];
  let start = 0;
  for (let i = 0; i <= b.length; i++) {
    if (i < b.length && b[i] !== ';') continue;
    if (b.slice(start, i).trim()) stmts.push({ sql: src.slice(start, i).trim(), params: /\$\d+/.test(b.slice(start, i)) });
    start = i + 1;
  }
  return stmts;
}
const lit = v => "'" + String(v).replace(/'/g, "''") + "'";
function rowCount(seg) { const m = [...seg.matchAll(/^\((\d+) rows?\)$/gm)].pop(); return m ? +m[1] : null; }
function rowsMatch(n, want) {
  if (n === null) return false;
  const m = /^(>=|>|<=|<)?\s*(\d+)$/.exec(String(want).trim());
  if (!m) return false;
  return { '>': n > +m[2], '>=': n >= +m[2], '<': n < +m[2], '<=': n <= +m[2] }[m[1]] ?? n === +m[2];
}
const indent = s => s.trim().split('\n').map(l => '             ' + l).join('\n');

let dbSeq = 0;
function sql(f) {
  const spec = (sidecar.files || {})[f] || {};
  const exts = spec.extensions || [];
  const image = spec.image || (() => {
    const imgs = [...new Set(exts.filter(e => PG_IMAGES[e]).map(e => PG_IMAGES[e]))];
    return imgs.length === 1 && exts.every(e => PG_IMAGES[e] || !STUBS[e]) ? imgs[0] : null;
  })();
  const needsImage = exts.some(e => PG_IMAGES[e] || STUBS[e]);
  let eng = null, stubbed = [];
  if (needsImage && image) eng = dockerEngine(image);
  if (!eng && needsImage) {
    const real = exts.filter(e => PG_IMAGES[e] || STUBS[e]), bin = installWith(real);
    if (bin) eng = localEngine(bin);
  }
  if (!eng && needsImage) {
    const missing = exts.filter(e => (PG_IMAGES[e] || STUBS[e]) && !STUBS[e]);
    if (missing.length) {
      return { unchecked: `needs ${missing.join(', ')}: Docker is not reachable (docker info failed) and there is no stub` };
    }
    stubbed = exts.filter(e => STUBS[e]);
  }
  if (!eng) eng = localEngine();
  if (!eng) return { unchecked: 'no Postgres: neither Docker nor a local initdb/pg_ctl/psql' };
  const tool = stubbed.length ? `${eng.name}, STUB ${stubbed.join(' + ')}` : eng.name;

  const db = 'vid_check_' + (++dbSeq);
  const mk = psql(eng, 'postgres', ['-c', `CREATE DATABASE ${db}`]);
  if (!mk.ok) return { ok: false, tool, out: mk.out };
  // extensions first (real ones, or their stubs), then the setup the video never shows
  for (const e of exts) {
    const r = stubbed.includes(e) ? psql(eng, db, ['-q', '-f', '-'], STUBS[e])
      : psql(eng, db, ['-q', '-c', `CREATE EXTENSION IF NOT EXISTS ${e}`]);
    if (!r.ok) return { ok: false, tool, out: `extension ${e}:\n` + r.out };
  }
  for (const s of spec.setup || sidecar.setup || []) {
    const sf = path.join(dir, s);
    if (!fs.existsSync(sf)) return { ok: false, tool, out: `setup file ${s} is missing` };
    const r = psql(eng, db, ['-q', '-f', sf]);
    if (!r.ok) return { ok: false, tool, out: `setup ${s}:\n` + r.out };
  }

  const stmts = splitSql(fs.readFileSync(path.join(dir, f), 'utf8'));
  const params = spec.params || [];
  let script = '\\pset pager off\n';
  stmts.forEach((s, k) => {
    script += `\\echo '@@vid ${k + 1}'\n`;
    if (!s.params) { script += s.sql + ';\n'; return; }
    if (!params.length) throw new Error(`${f} statement ${k + 1} uses $n but _check.json gives no params`);
    script += `PREPARE vid_${k + 1}(${params.map(p => p.type).join(', ')}) AS\n${s.sql};\n` +
      `EXECUTE vid_${k + 1}(${params.map(p => lit(p.value)).join(', ')});\nDEALLOCATE vid_${k + 1};\n`;
  });
  script += "\\echo '@@vid end'\n";
  const r = psql(eng, db, ['-f', '-'], script);
  const segs = {}; let cur = null;
  r.out.split('\n').forEach(l => {
    const m = /^@@vid (\d+|end)$/.exec(l);
    if (m) { cur = m[1]; segs[cur] = []; return; }
    if (cur && !/^(PREPARE|DEALLOCATE)$/.test(l)) segs[cur].push(l.replace(/^psql:<stdin>:\d+: /, ''));
  });
  const seg = k => (segs[k] || []).join('\n').replace(/\s+$/, '');
  psql(eng, 'postgres', ['-q', '-c', `DROP DATABASE IF EXISTS ${db} WITH (FORCE)`]);
  if (!r.ok || !('end' in segs)) {
    const k = cur && cur !== 'end' ? +cur : null;
    const head = k ? `statement ${k} (${stmts[k - 1].sql.split('\n').find(l => !/^\s*--/.test(l))}…):\n` : '';
    return { ok: false, tool, out: head + (k ? seg(k) : r.out) };
  }
  const notes = [];
  for (const [k, want] of Object.entries(spec.expect || {})) {
    const n = rowCount(seg(k));
    if (!rowsMatch(n, want)) return { ok: false, tool, out: `statement ${k} returned ${n === null ? 'no rows' : n + ' row(s)'}, expected ${want}:\n${seg(k)}` };
    notes.push(`stmt ${k}: ${n} row(s)`);
  }
  if (argv.includes('--verbose')) stmts.forEach((s, k) => notes.push(`\n  [${k + 1}] ${s.sql}\n${seg(k + 1)}`));
  if (argv.includes('--capture') && !stubbed.length) {
    for (const [k, name] of Object.entries(spec.capture || {})) {
      fs.writeFileSync(path.join(dir, name), seg(k) + '\n');
      notes.push(`stmt ${k} → ${name}`);
    }
  }
  return { ok: true, stub: stubbed.length > 0, tool: tool + `, ${stmts.length} statement(s)` + (notes.length ? '; ' + notes.join(', ') : '') };
}

function check(f) {
  const file = path.join(dir, f);
  if (/\.(c|m)?js$/.test(f)) { const r = run(process.execPath, ['--check', file]); return { ok: r.ok, tool: 'node --check', out: r.out }; }
  if (/\.ts$/.test(f)) return ts(file);
  if (/\.json$/.test(f)) { try { JSON.parse(fs.readFileSync(file, 'utf8')); return { ok: true, tool: 'JSON.parse' }; } catch (e) { return { ok: false, tool: 'JSON.parse', out: e.message }; } }
  if (/\.sh$/.test(f)) { const r = run('bash', ['-n', file]); return { ok: r.ok, tool: 'bash -n', out: r.out }; }
  if (/\.conf$/.test(f)) return nginx(file);
  if (/^Caddyfile/.test(f)) return caddy(file);
  return null;
}

// shown files only: dot files, _ files (setup, the sidecar) and dangling links are not on screen
const isFile = f => { try { return fs.statSync(path.join(dir, f)).isFile(); } catch (e) { return false; } };
const listFiles = () => fs.readdirSync(dir).filter(f => !/^[._]/.test(f) && isFile(f)).sort();
let bad = 0, unchecked = 0, stubs = 0;
for (const f of listFiles()) {
  if (/\.txt$/.test(f)) { console.log(`  text       ${f}`); continue; }
  const fmt = format(f);
  if (fmt.length) { bad++; console.log(`  FORMAT     ${f}\n${fmt.map(l => '             ' + l).join('\n')}`); }
  let r;
  try { r = /\.sql$/.test(f) ? sql(f) : check(f); } catch (e) { r = { ok: false, tool: 'checker', out: e.message }; }
  if (!r || r.unchecked) { unchecked++; console.log(`  UNCHECKED  ${f} (${(r && r.unchecked) || 'no checker on this machine'})`); continue; }
  if (r.ok && r.stub) { stubs++; console.log(`  STUB       ${f}  (${r.tool})`); }
  else if (r.ok) console.log(`  ok         ${f}  (${r.tool})`);
  else { bad++; console.log(`  FAIL       ${f}  (${r.tool})\n${indent(r.out || '')}`); }
}
cleanup();
// read after the checks, so outputs captured by this run (--capture) are in code.js
const files = listFiles(), out = {};
files.forEach(f => { out[f] = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\n$/, '').split('\n'); });
fs.writeFileSync(path.join(projectDir(slug), 'code.js'), '/* generated by npm run check-code from code/, do not edit */\nwindow.CODE = ' + JSON.stringify(out, null, 1) + ';\n');
console.log(`check-code ${slug}: ${files.length} file(s), ${bad} failed, ${unchecked} unchecked, ${stubs} stub → code.js`);
if (bad || ((unchecked || stubs) && !argv.includes('--allow-unchecked'))) process.exit(1);
