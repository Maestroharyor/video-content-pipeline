defineSlide({ slug: '18-devops-engineer', template: 'talk', data: {
  eyebrow: 'DevOps engineer', accent: 'o', h1: 'Meet the <em>DevOps engineer</em>',
  cast: [{ src: passet('avatars/devops-hand.svg'), name: 'DevOps', cls: 'o' }],
  bubbles: [{ who: 0, text: 'Code changes <em>all day</em>.', x: 0, y: 30, w: 250, tail: 'd', cls: 'o' },
    { who: 0, text: 'How do we ship it <em>safely</em>?', x: 0, y: 30, w: 250, tail: 'd', cls: 'o' },
    { who: 0, text: 'That\'s <em>my</em> job.', x: 0, y: 30, w: 250, tail: 'd', cls: 'o' }],
  flow: [{ n: 'Laptop', s: 'git commit', cls: 'n' }, { n: 'Tests', s: 'npm test', cls: 'g' }, { n: 'Staging', s: 'staging env', cls: 'a' }, { n: 'Production', s: 'vidshare.app', cls: 'r' }],
  commits: ['feat: threaded comments', 'feat: follow button', 'fix: resume uploads', 'feat: subscriptions tab'],
} });
