defineSlide({ slug: '55-ship-image', template: 'pipeline', data: {
  eyebrow: '03 · CI/CD', accent: 'o', h1: 'Registry,<br>then <em>deploy</em>', run: { title: 'feat(comments): threaded replies', meta: '#412 · main · a41c9e2' },
  stages: [{ name: 'Install', meta: 'npm ci', pre: 'ok' }, { name: 'Test', meta: '148 passed', pre: 'ok' }, { name: 'Build', meta: 'docker build', pre: 'ok' },
    { name: 'Push', meta: 'to ECR', st: 'ok' }, { name: 'Deploy', meta: 'to AWS', st: 'ok' }],
  log: [{ s: 1, text: '<span class="dm">$</span> npm ci            <span class="ok">added 812 packages in 14s</span>' },
    { s: 2, text: '<span class="dm">$</span> npm test          <span class="ok">Tests: 148 passed, 148 total</span>' },
    { s: 3, text: '<span class="dm">$</span> docker build -t vidshare-api:1.4.0 .' },
    { s: 4, text: '<span class="dm">$</span> docker push 1234.dkr.ecr.us-east-1.amazonaws.com/vidshare-api:1.4.0' },
    { s: 5, text: '<span class="dm">$</span> kubectl set image deploy/vidshare-api api=vidshare-api:1.4.0' },],
} });
