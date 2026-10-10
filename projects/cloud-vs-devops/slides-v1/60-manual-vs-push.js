defineSlide({ slug: '60-manual-vs-push', template: 'compare', data: {
  eyebrow: '03 · Workflow', accent: 'o', h1: 'Manual vs<br><em>git push</em>',
  left: { lb: 'By hand', qt: 'ssh prod → git pull → npm run build → pm2 restart' }, right: { lb: 'Automated', qt: 'git push', cls: 'o' },
  sep: '→', strike: 'left',
} });
