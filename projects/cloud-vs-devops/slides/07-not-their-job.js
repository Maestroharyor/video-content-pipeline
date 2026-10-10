defineSlide({ slug: '07-not-their-job', template: 'lanes', data: {
  emoji: [{ e: 'saxophone', x: 1560, y: 690, size: 130, tilt: 10 }],
  eyebrow: 'Software developer', accent: 'v', h1: '<em>Not</em> their job',
  left: { role: 'Cloud engineer', cls: 'b', pre: true, items: ['Managing servers', 'Cloud networks'], avatar: { src: passet('avatars/cloud-ok.svg'), name: 'Cloud' } },
  right: { role: 'DevOps engineer', cls: 'o', pre: true, items: ['Deployment pipelines'], avatar: { src: passet('avatars/devops-ok.svg'), name: 'DevOps' } },
  mid: { cls: 'v', label: 'Software developer', text: 'Makes the app work · knows the deployment basics', avatar: { src: passet('avatars/dev-ok.svg') },
    chips: [{ text: 'Managing servers', to: 'li1' }, { text: 'Cloud networks', to: 'li2' }, { text: 'Deployment pipelines', to: 'ri1' }] },
} });
