defineSlide({ slug: '44-apply', template: 'term', data: {
  eyebrow: '02 · IaC', accent: 'b', h1: 'Build and<br><em>maintain</em>', cwd: '~/vidshare/infra',
  steps: [{ cmd: 'terraform plan', out: ['Plan: <span class="ok">9 to add</span>, 0 to change, 0 to destroy.'] },
    { cmd: 'terraform apply -auto-approve', out: ['<span class="ok">Apply complete! Resources: 9 added, 0 changed, 0 destroyed.</span>'] }],
} });
