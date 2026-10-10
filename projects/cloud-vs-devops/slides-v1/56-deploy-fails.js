defineSlide({ slug: '56-deploy-fails', template: 'pipeline', data: {
  eyebrow: '03 · Rollback', accent: 'r', h1: 'When it<br><em>breaks</em>', run: { title: 'feat(comments): threaded replies', meta: '#413 · main · v1.4.0' },
  stages: [{ name: 'Install', meta: 'npm ci', pre: 'ok' }, { name: 'Test', meta: '148 passed', pre: 'ok' }, { name: 'Build', meta: 'docker build', pre: 'ok' },
    { name: 'Push', meta: 'to ECR', pre: 'ok' }, { name: 'Deploy', meta: 'to AWS', pre: 'run', st: 'fail' }],
  log: [{ s: 4, text: '<span class="dm">$</span> docker push 1234.dkr.ecr.us-east-1.amazonaws.com/vidshare-api:1.4.0' },
    { s: 5, text: '<span class="dm">$</span> kubectl set image deploy/vidshare-api api=vidshare-api:1.4.0' },
    { s: 5, end: true, text: '<span class="er">error: readiness probe failed · 500 on /videos/:id/stream</span>' }],
  badge: { text: 'v1.4.0 ships a bug', cls: 'r' }, rollback: { text: 'Rolled back to v1.3.2', meta: 'kubectl rollout undo' },
} });
