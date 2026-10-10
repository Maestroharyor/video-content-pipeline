const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), os = require('os'), path = require('path');
const { spawnSync } = require('child_process');
const { PLATFORMS, DEFAULTS, fieldsOf, count, normTags } = require('../renderer/platforms');

const SCRIPT = path.join(__dirname, '..', 'scripts', 'social.js');

/* post.js parses copy.md with this literal. social.md keeps the same heading contract, so it is copied
   here verbatim: if the format ever drifts, it fails in this test and not silently at posting time. */
const BLOCK_RE = /^### (.+?)\s+·\s+(\d+)\/(\d+)(.*)\n(?:_.*_\n)?\n```\n([\s\S]*?)\n```/gm;

function run(doc, extra = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'social-'));
  const file = path.join(dir, (doc.id || 'fix') + '.json');
  fs.writeFileSync(file, JSON.stringify(doc, null, 2));
  const r = spawnSync('node', [SCRIPT, '--in', file, '--out', dir, ...extra], { encoding: 'utf8' });
  const md = path.join(dir, (doc.id || 'fix') + '.md');
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, md: fs.existsSync(md) ? fs.readFileSync(md, 'utf8') : null, dir };
}
const doc = (platforms, over = {}) => Object.assign({
  version: 1, id: 'fix', title: 'A test item', brand: 'personal',
  link: { url: 'https://example.com/x' },
  alt: [{ asset: 'a.png', text: 'A short, true sentence about the picture.' }],
  platforms,
}, over);

test('every heading count is the length of the text inside its own block', () => {
  const { status, md } = run(doc({
    youtube: { title: 'A title that fits', description: 'Two lines.\n\nAnd a second paragraph.', hashtags: ['aws', 'devops', 'cloud'] },
    instagram: { body: 'A caption with a break.\n\nAnd another line.', hashtags: ['aws', 'cloudcost'] },
    tiktok: { body: 'short and blunt', hashtags: ['aws', 'tech'] },
    linkedin: { body: 'A post that says something specific, then asks a question.' },
  }));
  assert.equal(status, 0, 'expected a clean run');
  let n = 0;
  for (const m of md.matchAll(BLOCK_RE)) {
    n++;
    const declared = +m[2], body = m[5];
    const weighted = /^X\b/m.test(m[1]);
    assert.equal(declared, count(body, weighted), m[1] + ': heading says ' + declared + ', block is ' + count(body));
  }
  assert.ok(n >= 6, 'expected a block per field plus alt text, got ' + n);
});

test('one character over the cap is a gate, one under is clean', () => {
  const under = run(doc({ x: { body: 'x'.repeat(280) } }));
  assert.equal(under.status, 0, 'exactly at the cap must pass');
  assert.ok(!/⚠ OVER/.test(under.md));

  const over = run(doc({ x: { body: 'x'.repeat(281) } }));
  assert.equal(over.status, 1, 'over the cap must exit 1');
  assert.equal(over.md, null, 'nothing may be written when it exits 1');
  assert.match(over.stderr, /x\.body is 281\/280/);
});

test('hashtags come from hashtags[], land where the network puts them, and are counted', () => {
  const { md, status } = run(doc({
    instagram: { body: 'A caption.', hashtags: ['#AWS', 'cloud cost', 'aws', 'DevOps'] },
    tiktok: { body: 'A caption.', hashtags: ['TechTok'] },
    linkedin: { body: 'A post.', hashtags: ['FinOps'] },
    x: { body: 'A post.', hashtags: ['AWS', 'Cloud'] },
  }));
  assert.equal(status, 0);
  /* Instagram and TikTok both label the field "Caption", so read each platform's own group. */
  const group = label => md.split(/^## /m).find(s => s.startsWith(label));
  const blockIn = label => [...group(label).matchAll(BLOCK_RE)].map(m => ({ body: m[5], len: +m[2] }))[0];

  const ig = blockIn('Instagram');
  assert.match(ig.body, /\n\n—\n#AWS #cloudcost #DevOps$/, 'instagram puts tags after a separator line');
  assert.ok(!/#AWS #aws/i.test(ig.body), 'duplicates and case variants collapse');
  assert.equal(ig.len, count(ig.body), 'the count includes the tags');
  assert.match(blockIn('TikTok').body, /A caption\.\n\n#TechTok$/, 'tiktok puts tags on their own last line');
  assert.match(blockIn('X').body, /#AWS #Cloud$/, 'X takes up to two');
  assert.ok(!/add \d+ more/.test(md), 'no placeholder text may ever reach the file');
});

test('more hashtags than the network takes is a gate, not a warning', () => {
  const ok = run(doc({ instagram: { body: 'A caption.', hashtags: ['One', 'Two', 'Three', 'Four', 'Five'] } }));
  assert.equal(ok.status, 0, 'five is the Instagram maximum');

  const over = run(doc({ instagram: { body: 'A caption.', hashtags: ['One', 'Two', 'Three', 'Four', 'Five', 'Six'] } }));
  assert.equal(over.status, 1);
  assert.match(over.stderr, /instagram has 6 hashtags; the maximum is 5/);
});

test('X counts a URL as 23 whatever its length, and an emoji as one', () => {
  const url = 'https://example.com/' + 'a'.repeat(70);
  assert.equal(count('a ' + url, true), 2 + 23);
  assert.equal(count('a ' + url), 2 + url.length, 'only X is weighted');
  assert.equal(count('hi 🙂'), 4, 'code points, not UTF-16 units');

  const { md } = run(doc({ x: { body: 'See it here: ' + url } }));
  const m = [...md.matchAll(BLOCK_RE)].find(x => x[1] === 'Post');
  assert.equal(+m[2], 13 + 23);
});

test('youtube renders two blocks under one platform heading', () => {
  const { md, status } = run(doc({ youtube: { title: 'A title', description: 'A description.', hashtags: ['aws'] } }));
  assert.equal(status, 0);
  const groups = md.split(/^## /m).filter(s => s.startsWith('YouTube'));
  assert.equal(groups.length, 1, 'one platform group');
  const fields = [...groups[0].matchAll(BLOCK_RE)].map(m => m[1]);
  assert.deepEqual(fields, ['Title', 'Description']);
});

test('timestamps in a YouTube description are flagged, because a Short has no chapter bar', () => {
  const prose = run(doc({ youtube: { title: 'A title', description: 'Prose only.\n\nAnd a second paragraph.' } }));
  assert.equal(prose.status, 0);
  assert.ok(!/timestamps/.test(prose.stdout), 'a clean description says nothing about timestamps');

  const chapters = run(doc({ youtube: { title: 'A title', description: 'Prose.\n\nChapters\n00:00 The start\n01:12 The middle' } }));
  assert.equal(chapters.status, 0, 'advisory, not a gate: they are fine when asked for');
  assert.match(chapters.stdout, /timestamps in the description/);
});

test('a YouTube description without links is flagged, because it is the one place a link is clickable', () => {
  const bare = run(doc({ youtube: { title: 'A title', description: 'A teaser.\n\nAnd a second line.' } }));
  assert.equal(bare.status, 0, 'advisory, not a gate');
  assert.match(bare.stdout, /no links/);

  const linked = run(doc({ youtube: { title: 'A title', description: 'A teaser.\n\nSubscribe: https://www.youtube.com/@example' } }));
  assert.equal(linked.status, 0);
  assert.ok(!/no links/.test(linked.stdout), 'a description with a URL says nothing about links');
});

test('the platform table is complete enough to write against', () => {
  assert.deepEqual(DEFAULTS, ['youtube', 'instagram', 'tiktok', 'x', 'linkedin', 'whatsapp-status', 'whatsapp-telegram'],
    'the default set is the eight blocks these two pipelines write');
  for (const [key, P] of Object.entries(PLATFORMS)) {
    assert.ok(P.label, key + ': needs a label');
    assert.ok(P.fields && P.fields.length, key + ': needs at least one field');
    assert.ok(['separator', 'inline', 'tail', 'none'].includes(P.tagStyle), key + ': unknown tagStyle ' + P.tagStyle);
    assert.ok(['body', 'bio', 'comment', 'none', 'optional'].includes(P.linkPolicy), key + ': unknown linkPolicy ' + P.linkPolicy);
    for (const f of fieldsOf(key)) {
      assert.ok(f.cap > 0, key + '.' + f.key + ': needs a cap');
      assert.ok(f.soft > 0 && f.soft < f.cap, key + '.' + f.key + ': target must sit below the cap');
      assert.ok(f.fold > 0 && f.fold <= f.cap, key + '.' + f.key + ': fold must be inside the cap');
      /* shape is the prompt. A one-liner is how a platform ends up half-added. */
      assert.ok(f.shape.length >= 100 && f.shape.length <= 600, key + '.' + f.key + ': shape is ' + f.shape.length + ' chars');
    }
    /* A title has nothing to say about links; a platform that says nothing anywhere is half-added. */
    assert.ok(fieldsOf(key).some(f => /link|hashtag|URL/i.test(f.shape)),
      key + ': no field says what happens to links or hashtags');
  }
  assert.deepEqual(normTags(['#AWS', 'aws', 'cloud cost', 'a']), ['#AWS', '#cloudcost'],
    'the author\'s casing is kept, duplicates collapse case-insensitively, junk is dropped');
});

test('--rules prints something writable, with no project needed', () => {
  const r = spawnSync('node', [SCRIPT, '--rules', '--platforms', 'x,whatsapp-telegram'], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /cap 280/);
  assert.match(r.stdout, /cap 1024/, 'a media caption caps at 1024 on both, not 4096');
  assert.ok(!/instagram/i.test(r.stdout), '--platforms selects');
});

test('an unknown platform or field is refused, not silently dropped', () => {
  const bad = spawnSync('node', [SCRIPT, '--rules', '--platforms', 'mastodon'], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /unknown platform mastodon/);

  const typo = run(doc({ youtube: { title: 'A title', descripton: 'typo' } }));
  assert.equal(typo.status, 1);
  assert.match(typo.stderr, /unknown field "descripton"/);
});

/* Repo-specific: this pipeline has one brand, read out of core/brand.js. */
test('the brand comes from core/brand.js, and project.js overrides it', () => {
  const { loadBrand } = require('../renderer/brand');
  const base = loadBrand({});
  assert.ok(base.handles.length, 'expected the outro handles');
  for (const h of base.handles) assert.ok(h.net && h.handle, 'every handle needs a net and a handle');
  assert.ok(base.links.bio, 'expected the link-in-bio url');
  assert.ok(base.voice, 'the copy needs a voice to obey');

  const over = loadBrand({ social: { brand: 'lifetechfacts', name: 'LifeTech Facts', voice: 'Accessible.', links: { bio: 'x.test' } } });
  assert.equal(over.slug, 'lifetechfacts');
  assert.equal(over.name, 'LifeTech Facts');
  assert.equal(over.links.bio, 'x.test');
});
