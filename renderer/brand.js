/* The one brand this repo has lives in core/brand.js as a browser file (window.BRAND). Evaluate it in
   a sandbox the way loadProject does with project.js, and normalise it to the shape the image
   pipeline's brands/<slug>/brand.json uses, so scripts/social.js is the same file in both repos.

   A project overrides any of it with a `social` block in project.js:
     social: { brand: 'lifetechfacts', name: 'LifeTech Facts', voice: '…', handles: […], links: {…} } */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ROOT } = require('./project');

const FALLBACK = {
  slug: 'personal',
  name: 'Ayomide Odewale',
  voice: 'First person, practical, opinionated. What I actually did and what it cost me. Calm, not hype-driven; technically credible without gatekeeping.',
};

function loadBrand(project = {}) {
  const sandbox = { window: { PROJECT: project } };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'core', 'brand.js'), 'utf8'), sandbox, { filename: 'brand.js' });
  const B = sandbox.window.BRAND || {};
  const S = project.social || {};
  const handles = (S.handles || B.handles || [])
    .map(h => ({ net: String(h.net || h.icon || '').toLowerCase(), handle: h.handle }))
    .filter(h => h.net && h.handle);
  return {
    slug: S.brand || FALLBACK.slug,
    name: S.name || FALLBACK.name,
    voice: S.voice || FALLBACK.voice,
    handles,
    links: Object.assign({ bio: (B.box || {}).url }, S.links),
    chrome: { footerTitle: S.footerTitle || 'Follow for more' },
    audio: B.audio || null,             // the outro's audio file name (scripts/sfx.js outroBed resolves it)
  };
}

module.exports = { loadBrand };
