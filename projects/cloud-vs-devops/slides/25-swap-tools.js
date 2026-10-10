defineSlide({ slug: '25-swap-tools', template: 'lanes', data: {
  eyebrow: 'The overlap', accent: 't', h1: 'They <em>swap tools</em>',
  left: { role: 'Cloud engineer', cls: 'b', pre: true, items: [{ text: 'Deployment automation', icon: 'githubactions', brand: true }, { text: 'The whole cloud bill', tail: 'EC2 · S3 · CDN' }], avatar: { src: passet('avatars/cloud-ok.svg'), name: 'Cloud' } },
  right: { role: 'DevOps engineer', cls: 'o', pre: true, items: [{ text: 'Terraform or Pulumi', icon: 'terraform', brand: true }, { text: 'CI/CD costs', tail: 'runner minutes' }], avatar: { src: passet('avatars/devops-ok.svg'), name: 'DevOps' } },
  mid: { cls: 't', label: 'Both', chips: [{ text: 'Terraform', icon: 'terraform', brand: true, to: 'ri1' }, { text: 'deploy.yml', icon: 'githubactions', brand: true, to: 'li1' },
    { text: 'Docker', icon: 'docker', brand: true }, { text: 'Kubernetes', icon: 'kubernetes', brand: true }, { text: 'Logging' }, { text: 'Monitoring', icon: 'grafana', brand: true }, { text: 'Security' }] },
} });
