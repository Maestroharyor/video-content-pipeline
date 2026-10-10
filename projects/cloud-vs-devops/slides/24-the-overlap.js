defineSlide({ slug: '24-the-overlap', template: 'lanes', data: {
  emoji: [{ e: 'eyes', x: 1260, y: 140, size: 120 }],
  eyebrow: 'The overlap', accent: 't', h1: 'Where they <em>overlap</em>', divider: true,
  left: { role: 'Cloud engineer', cls: 'b', pre: true, items: [{ text: 'EC2 instances', icon: 'ec2' }, { text: 'Networking', icon: 'vpc' }], avatar: { src: passet('avatars/cloud-point.svg'), name: 'Cloud' } },
  right: { role: 'DevOps engineer', cls: 'o', pre: true, items: [{ text: 'CI/CD pipeline', icon: 'githubactions', brand: true }, { text: 'Deploys the app' }], avatar: { src: passet('avatars/devops-point.svg'), name: 'DevOps' } },
  link: { from: 'ri2', to: 'li1' },
  mid: { cls: 't', label: 'Both work with', chips: [{ text: 'Terraform', icon: 'terraform', brand: true }, { text: 'Docker', icon: 'docker', brand: true },
    { text: 'Monitoring', icon: 'grafana', brand: true }, { text: 'Cloud platforms', icon: 'aws-logo-dark' }] },
  // vertical canvas (--variant vertical and the social cuts): positions for the 1080x1920 stage
  v: { emoji: [{ e: 'eyes', x: 800, y: 230, size: 120 }] },
} });
