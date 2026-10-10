defineSlide({ slug: '53-push-pipeline', template: 'pipeline', data: {
  eyebrow: '03 · CI/CD', accent: 'o', h1: 'Push, and<br>it <em>runs</em>', run: { title: 'feat(comments): threaded replies', meta: '#412 · main · a41c9e2' },
  stages: [{ name: 'Install', meta: 'npm ci', st: 'ok' }, { name: 'Test', meta: '148 passed', st: 'ok' }, { name: 'Build', meta: 'docker build', st: 'ok' },
    { name: 'Push', meta: 'to ECR' }, { name: 'Deploy', meta: 'to AWS' }],
  log: [{ s: 1, text: '<span class="dm">$</span> npm ci            <span class="ok">added 812 packages in 14s</span>' },
    { s: 2, text: '<span class="dm">$</span> npm test          <span class="ok">Tests: 148 passed, 148 total</span>' },
    { s: 3, text: '<span class="dm">$</span> docker build -t vidshare-api:1.4.0 .' },],
} });
