defineSlide({ slug: '21-when-it-breaks', template: 'pipeline', data: {
  emoji: [{ e: 'fire', x: 1195, y: 150, size: 120 }, { e: 'grinning_face_with_sweat', x: 1330, y: 640, size: 120 }], shake: true,
  eyebrow: 'DevOps engineer · Rollback', accent: 'r', h1: 'When it <em>breaks</em>', run: { title: 'feat(comments): threaded replies', meta: '#413 · main · v1.4.0' },
  stages: [{ name: 'Install', meta: 'npm ci', pre: 'ok' }, { name: 'Test', meta: '148 passed', pre: 'ok' }, { name: 'Build', meta: 'docker build', pre: 'ok' },
    { name: 'Push', meta: 'to ECR', pre: 'ok' }, { name: 'Deploy', meta: 'to AWS', pre: 'run', st: 'fail' }],
  log: [{ s: 5, text: '<span class="dm">$</span> kubectl set image deploy/vidshare-api api=vidshare-api:1.4.0' },
    { s: 5, end: true, text: '<span class="er">error: readiness probe failed · 500 on /videos/:id/stream</span>' }],
  stamp: { text: 'Ships a bug' }, rollback: { text: 'Rolled back to v1.3.2', meta: 'automatic' },
  term: { x: 520, w: 680, cwd: '~/vidshare/ops', steps: [
    { cmd: 'kubectl rollout status deploy/vidshare-api', out: ['<span class="er">error: "vidshare-api" exceeded its progress deadline</span>'] },
    { cmd: 'kubectl rollout undo deploy/vidshare-api', out: ['deployment.apps/vidshare-api <span class="ok">rolled back</span>'] }] },
  pager: { title: 'HighErrorRate', body: 'vidshare-api · 5xx at 7.2% for 5 min' },
  chips: [{ text: 'Health checks', cls: 'g' }, { text: 'Monitoring', cls: 'g' }, { text: 'Alerts', cls: 'g' }],
  // vertical canvas (--variant vertical and the social cuts): positions for the 1080x1920 stage
  v: { emoji: [{ e: 'fire', x: 905, y: 110, size: 110 }, { e: 'grinning_face_with_sweat', x: 80, y: 1420, size: 120 }],
    stages: [{ name: 'Install', meta: 'npm ci', pre: 'ok' }, { name: 'Test', meta: '148 passed', pre: 'ok' }, { name: 'Build', meta: 'docker', pre: 'ok' },
      { name: 'Push', meta: 'to ECR', pre: 'ok' }, { name: 'Deploy', meta: 'to AWS', pre: 'run', st: 'fail' }],
    log: [{ s: 5, text: '<span class="dm">$</span> kubectl set image deploy/vidshare-api …:1.4.0' },
      { s: 5, end: true, text: '<span class="er">error: readiness probe failed · 500</span>' }],
    chips: null,   // the social cut ends before "health checks, monitoring, and alerting", so the row would land on no words
    run: { meta: 'v1.4.0' }, stamp: { text: 'Ships a bug', x: 460, y: -84 }, term: { x: 0, y: 620, w: 800 }, pager: { title: 'HighErrorRate', body: 'vidshare-api · 5xx at 7.2% for 5 min', x: 470, y: 640 } },
} });
