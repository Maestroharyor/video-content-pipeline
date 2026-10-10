defineSlide({ slug: '20-pipeline-runs', template: 'pipeline', data: {
  emoji: [{ e: 'party_popper', x: 1600, y: 250, size: 130 }], burst: { x: 1590, y: 490 },
  eyebrow: 'DevOps engineer · CI/CD', accent: 'o', h1: 'Push, and it <em>ships</em>', run: { title: 'feat(comments): threaded replies', meta: '#412 · main · a41c9e2' },
  stages: [{ name: 'Install', meta: 'npm ci', st: 'ok' }, { name: 'Test', meta: '148 passed', st: 'ok' }, { name: 'Build', meta: 'docker build', st: 'ok' },
    { name: 'Push', meta: 'to ECR', st: 'ok' }, { name: 'Deploy', meta: 'to AWS', st: 'ok' }],
  log: [{ s: 1, text: '<span class="dm">$</span> npm ci            <span class="ok">added 812 packages in 14s</span>' },
    { s: 2, text: '<span class="dm">$</span> npm test          <span class="ok">Tests: 148 passed, 148 total</span>' },
    { s: 3, text: '<span class="dm">$</span> docker build -t vidshare-api:1.4.0 .' },
    { s: 4, text: '<span class="dm">$</span> docker push 1234.dkr.ecr.us-east-1.amazonaws.com/vidshare-api:1.4.0' },
    { s: 5, text: '<span class="dm">$</span> kubectl set image deploy/vidshare-api api=vidshare-api:1.4.0' },],
  peek: { file: 'Dockerfile', until: 's4', lines: ['<span class="k">FROM</span> node:22-alpine', '<span class="k">WORKDIR</span> /app', '<span class="k">COPY</span> package*.json ./',
    '<span class="k">RUN</span> npm ci --omit=dev', '<span class="k">COPY</span> . .', '<span class="k">CMD</span> [<span class="s">"node"</span>, <span class="s">"server.js"</span>]'] },
} });
