defineSlide({ slug: '29-common-core', template: 'lanes', data: {
  emoji: [{ e: 'raising_hands', x: 1190, y: 165, size: 120 }],
  eyebrow: 'Choosing', accent: 'g', h1: 'Why not <em>both</em>?', divider: true,
  left: { role: 'Cloud engineer', cls: 'b', pre: true, avatar: { src: passet('avatars/cloud-waveLongArm.svg'), name: 'Cloud' } }, right: { role: 'DevOps engineer', cls: 'o', pre: true, avatar: { src: passet('avatars/devops-waveLongArm.svg'), name: 'DevOps' } },
  mid: { cls: 'g', label: 'Useful in both roles', chips: [{ text: 'Cloud infrastructure', icon: 'aws-logo-dark' }, { text: 'Linux', icon: 'linux', brand: true }, { text: 'Networking' },
    { text: 'Terraform', icon: 'terraform', brand: true }, { text: 'Docker', icon: 'docker', brand: true }, { text: 'CI/CD', icon: 'githubactions', brand: true }] },
  asks: ['Next: <em>platform engineering</em>', 'Next: <em>site reliability engineering</em>'],
} });
