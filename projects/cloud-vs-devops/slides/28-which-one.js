defineSlide({ slug: '28-which-one', template: 'lanes', data: {
  emoji: [{ e: 'thinking_face', x: 1290, y: 95, size: 120 }],
  eyebrow: 'Choosing', accent: 'g', h1: 'Which one is <em>for you</em>?',
  left: { role: 'Cloud engineering', who: '<b>$</b> if you enjoy', cls: 'b', pre: true, avatar: { src: passet('avatars/cloud-point.svg'), name: 'Cloud' },
    items: [{ text: 'Cloud platforms', chk: true }, { text: 'Designing networks', chk: true }, { text: 'Managing servers', chk: true }, { text: 'Configuring security', chk: true }, { text: 'Optimizing costs', chk: true }] },
  right: { role: 'DevOps engineering', who: '<b>$</b> if you enjoy', cls: 'o', pre: true, avatar: { src: passet('avatars/devops-point.svg'), name: 'DevOps' },
    items: [{ text: 'Automation', chk: true }, { text: 'CI/CD pipelines', chk: true }, { text: 'Docker deployments', chk: true }, { text: 'Improving delivery', chk: true }] },
} });
