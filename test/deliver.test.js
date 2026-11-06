const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const D = require('../renderer/deliver');

/* a throwaway pair of checkouts: vid/projects/demo (+ nested social, -thumbs) and img/projects/demo */
function fixture() {
  const t = fs.mkdtempSync(path.join(os.tmpdir(), 'deliver-'));
  const R = { vid: path.join(t, 'vid'), img: path.join(t, 'img') };
  const put = (f, body = 'x') => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, body); };
  const v = p => path.join(R.vid, 'projects', p), i = p => path.join(R.img, 'projects', p);
  put(v('demo/project.js')); put(v('demo/social/project.js')); put(v('demo-thumbs/project.js'));
  for (const f of ['demo.mp4', 'demo.srt', 'demo-reveal.mp4', 'demo-preview.mp4', 'demo-reveal-preview-v4.mp4']) put(v('demo/renders/final/' + f));
  put(v('demo-thumbs/renders/demo-thumbnail.png')); put(v('demo-thumbs/renders/demo-thumbnail.jpg')); put(v('demo-thumbs/renders/sidebar.png'));
  const cut = 'demo/social/renders/social/best-of/';
  put(v(cut + 'demo-social-best-of.mp4')); put(v(cut + 'demo-social-best-of.srt'), '1\n00:00:00,000 --> 00:00:01,000\nHello there\n\n2\n00:00:01,000 --> 00:00:02,000\nworld\n');
  put(v(cut + 'demo-social-best-of-preview.mp4')); put(v(cut + 'deck.mp4')); put(v(cut + 'source.mp4'));
  put(v('demo/social/demo.json'), '{}'); put(v('demo/social/demo.md'), '# copy\nvideo body');
  put(i('demo/out/design/one--diagram--4x5.png')); put(i('demo/out/design/two--steps--4x5.png'));
  put(i('demo/out/carousel/01--deck-01--4x5.png')); put(i('demo/out/carousel/02--deck-02--4x5.png'));
  put(i('demo/out/contact-sheet.png'));
  put(i('demo/content.json'), JSON.stringify({ ideas: [{ id: 'one' }, { id: 'two' }, { id: 'deck-01', slide: 1 }, { id: 'deck-02', slide: 2 }] }));
  for (const id of ['one', 'deck-01']) {
    const asset = id === 'one' ? 'out/design/one--diagram--4x5.png' : 'out/carousel/01--deck-01--4x5.png';
    put(i(`demo/social/${id}.json`), JSON.stringify({ source: { asset: 'projects/demo/' + asset } }));
    put(i(`demo/social/${id}.md`), `# title\nbody of ${id}`);
  }
  return { t, R, v, i, put };
}

test('baseSlug folds nested and sibling projects into the video', () => {
  const { R, v } = fixture();
  assert.strictEqual(D.baseSlug(v('demo/social'), R), 'demo');
  assert.strictEqual(D.baseSlug(v('demo-thumbs'), R), 'demo');
  assert.strictEqual(D.baseSlug(v('demo'), R), 'demo');
  assert.strictEqual(D.baseSlug('demo/social', R), 'demo');
});

test('plan names every final flat and leaves previews, decks and sources out', () => {
  const { R } = fixture();
  const p = D.plan('demo', R), names = p.link.map(x => x.name).sort();
  assert.deepStrictEqual(names, ['posts/0-contact-sheet.png', 'posts/card-one.png', 'posts/card-two.png', 'posts/carousel-01-of-02.png',
    'posts/carousel-02-of-02.png', 'video/demo-copy-video.md', 'video/demo-master-face.mp4', 'video/demo-master.mp4', 'video/demo-master.srt',
    'video/demo-thumbnail.jpg', 'video/demo-vertical-best-of.mp4', 'video/demo-vertical-best-of.srt']);
  const tr = p.write.find(x => x.name === 'video/demo-vertical-best-of-transcript.txt');
  assert.strictEqual(tr.text, 'Hello there world\n');
  const posts = p.write.find(x => x.name === 'posts/demo-copy-posts.md').text;
  assert.ok(posts.indexOf('# POST 1: deck-01') < posts.indexOf('# POST 2: one'), 'carousel first');
  assert.match(posts, /Image: carousel-01-of-02\.png to carousel-02-of-02\.png \(2 slides\)/);
  assert.match(posts, /Image: card-one\.png/);
});

test('plan adds the ratio and layout only when they tell two files apart', () => {
  const { R, put, i } = fixture();
  put(i('demo/out/design/one--steps--1x1.png'));
  const names = D.plan('demo', R).link.map(x => x.name).filter(n => n.startsWith('posts/card-')).sort();
  assert.deepStrictEqual(names, ['posts/card-one-diagram-4x5.png', 'posts/card-one-steps-1x1.png', 'posts/card-two-4x5.png']);
});

test('apply hard-links, refreshes a re-rendered source and removes what is gone', () => {
  const { R, v } = fixture();
  const dest = D.destOf('demo', R);
  assert.strictEqual(dest, v('demo/deliver'));
  D.apply(dest, D.plan('demo', R));
  const master = v('demo/renders/final/demo.mp4');
  assert.strictEqual(fs.statSync(path.join(dest, 'video/demo-master.mp4')).ino, fs.statSync(master).ino);
  fs.rmSync(master); fs.writeFileSync(master, 'new render');                     // a re-render writes a new file
  fs.rmSync(v('demo/renders/final/demo-reveal.mp4'));
  D.apply(dest, D.plan('demo', R));
  assert.strictEqual(fs.readFileSync(path.join(dest, 'video/demo-master.mp4'), 'utf8'), 'new render');
  assert.ok(!fs.existsSync(path.join(dest, 'video/demo-master-face.mp4')));
});

test('a post whose asset path went stale still names its card', () => {
  const { R, i, put } = fixture();
  put(i('demo/social/one.json'), JSON.stringify({ source: { asset: 'projects/demo/out/design/one--statement--4x5.png' } }));
  assert.match(D.plan('demo', R).write.find(x => x.name === 'posts/demo-copy-posts.md').text, /Image: card-one\.png/);
});

test('a gather from the old flat layout clears the flat files', () => {
  const { R } = fixture();
  const dest = D.destOf('demo', R);
  fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(path.join(dest, 'card-one.png'), 'old');
  fs.writeFileSync(path.join(dest, '.manifest.json'), JSON.stringify(['card-one.png']));
  D.apply(dest, D.plan('demo', R));
  assert.ok(!fs.existsSync(path.join(dest, 'card-one.png')));
  assert.ok(fs.existsSync(path.join(dest, 'posts', 'card-one.png')));
});

test('an image project with no video delivers into its own folder', () => {
  const { R, i, put } = fixture();
  put(i('solo/out/design/a--statement--4x5.png'));
  assert.strictEqual(D.destOf('solo', R), i('solo/deliver'));
  assert.deepStrictEqual(D.plan('solo', R).link.map(x => x.name), ['posts/card-a.png']);
});

test('the newest thumbnail export wins, so a lossless PNG pick is not shadowed by an older JPG', () => {
  const { R, v } = fixture();
  const png = v('demo-thumbs/renders/demo-thumbnail.png'), jpg = v('demo-thumbs/renders/demo-thumbnail.jpg');
  const t0 = new Date('2026-10-01'), t1 = new Date('2026-10-02');
  fs.utimesSync(jpg, t0, t0); fs.utimesSync(png, t1, t1);
  assert.ok(D.plan('demo', R).link.some(x => x.name === 'video/demo-thumbnail.png' && x.src === png));
  fs.utimesSync(png, t0, t0);   // a tie: the JPG
  assert.ok(D.plan('demo', R).link.some(x => x.name === 'video/demo-thumbnail.jpg'));
});
