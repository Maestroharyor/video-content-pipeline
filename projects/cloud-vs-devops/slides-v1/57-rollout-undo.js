defineSlide({ slug: '57-rollout-undo', template: 'term', data: {
  eyebrow: '03 · Rollback', accent: 'r', h1: 'Roll back,<br><em>on its own</em>', cwd: '~/vidshare/ops',
  steps: [{ cmd: 'kubectl rollout status deploy/vidshare-api', out: ['<span class="er">error: deployment "vidshare-api" exceeded its progress deadline</span>'] },
    { cmd: 'kubectl rollout undo deploy/vidshare-api', out: ['deployment.apps/vidshare-api <span class="ok">rolled back</span>'] }],
} });
