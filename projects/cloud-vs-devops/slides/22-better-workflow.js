defineSlide({ slug: '22-better-workflow', template: 'talk', data: {
  eyebrow: 'DevOps engineer · Workflow', accent: 'o', h1: 'Less <em>toil</em> for developers',
  cast: [{ src: passet('avatars/dev-hand.svg'), name: 'Dev', cls: 'v' }, { src: passet('avatars/devops-ok.svg'), name: 'DevOps', cls: 'o' }],
  bubbles: [{ who: 1, text: 'Let me <em>automate</em> that.', x: 250, y: 30, w: 230, tail: 'd', cls: 'o' },
    { who: 0, text: 'More code, less <em>toil</em>!', x: 0, y: 30, w: 230, tail: 'd', cls: 'v' }],
  steps: { left: { lb: 'By hand, every update', items: ['ssh prod', 'git pull', 'npm run build', 'pm2 restart api'] }, right: { lb: 'Automated', text: 'git push' } },
} });
