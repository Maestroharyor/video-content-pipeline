/* A pool of independent browsers (one Chrome per worker: headless Chrome only paints the foreground tab, so several
   pages of one browser serialise or deadlock on screenshots). worker(page, index) runs once per browser, concurrently. */
const os = require('os');
const { launchBrowser, openPage } = require('./browser');

const defaultJobs = () => Math.max(1, Math.min(4, Math.floor(os.cpus().length / 2)));

async function withPool(cfg, jobs, opts, worker) {
  const browsers = await Promise.all(Array.from({ length: jobs }, () => launchBrowser()));
  try {
    const pages = await Promise.all(browsers.map(b => openPage(b, cfg, opts)));
    const bad = pages.find(r => r.errors.length);
    if (bad) throw new Error(bad.errors.join('\n'));
    return await Promise.all(pages.map((r, i) => worker(r.page, i, r)));
  } finally { await Promise.all(browsers.map(b => b.close().catch(() => {}))); }
}
/* split N frames into `jobs` contiguous ranges [a, b) */
function frameRanges(N, jobs) {
  const out = [], per = Math.ceil(N / jobs);
  for (let a = 0; a < N; a += per) out.push([a, Math.min(N, a + per)]);
  return out;
}
module.exports = { withPool, frameRanges, defaultJobs };
