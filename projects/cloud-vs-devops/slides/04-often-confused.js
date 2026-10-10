defineSlide({ slug: '04-often-confused', template: 'lanes', data: {
  emoji: [{ e: 'exploding_head', x: 1200, y: 170, size: 120 }],
  eyebrow: 'The problem', accent: 'b', h1: 'Often <em>confused</em>', mix: true,
  left: { role: 'Cloud engineer', cls: 'b', pre: true, avatar: { src: passet('avatars/cloud-hand.svg'), name: 'Cloud' } }, right: { role: 'DevOps engineer', cls: 'o', pre: true, avatar: { src: passet('avatars/devops-hand.svg'), name: 'DevOps' } },
  mid: { cls: 'v', label: 'Software developer', text: 'Expected to handle parts of both', avatar: { src: passet('avatars/dev-hand.svg') } },
  asks: ['What does each role <em>do</em>?', 'Where do they <em>overlap</em>?'],
  // vertical canvas (--variant vertical and the social cuts): positions for the 1080x1920 stage
  v: { emoji: [{ e: 'exploding_head', x: 700, y: 360, size: 120 }] },
} });
