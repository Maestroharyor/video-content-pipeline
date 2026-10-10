defineSlide({ slug: '23-devops-lane', template: 'lanes', data: {
  eyebrow: 'DevOps engineer · In short', accent: 'o', h1: 'The DevOps <em>lane</em>',
  left: { role: 'Cloud engineer', cls: 'b', pre: 'all', dim: true, items: [{ text: 'Secure', chk: true }, { text: 'Reliable', chk: true }, { text: 'Cost-effective', chk: true }], tools: ['EC2', 'S3', 'CloudFront', 'VPC', 'Cost Explorer', 'Terraform'] },
  right: { role: 'DevOps engineer', cls: 'o', items: [{ text: 'Reliable', chk: true }, { text: 'Repeatable', chk: true }, { text: 'Efficient', chk: true }],
    tools: ['GitHub Actions', 'Jenkins', 'Ansible', 'Docker', 'Rollbacks', 'Alerts'], avatar: { src: passet('avatars/devops-ok.svg'), name: 'DevOps' } },
} });
