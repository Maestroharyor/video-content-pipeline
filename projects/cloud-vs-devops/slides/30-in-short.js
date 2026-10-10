defineSlide({ slug: '30-in-short', template: 'lanes', data: {
  eyebrow: 'Summary', accent: 't', h1: 'In <em>short</em>',
  left: { role: 'Cloud engineer', who: 'what it runs on', cls: 'b', pre: true, avatar: { src: passet('avatars/cloud-ok.svg'), name: 'Cloud' },
    items: [{ text: 'Provision resources', chk: true }, { text: 'Manage security', chk: true }, { text: 'Optimize performance', chk: true }, { text: 'Control cloud costs', chk: true }] },
  right: { role: 'DevOps engineer', who: 'how it ships', cls: 'o', pre: true, avatar: { src: passet('avatars/devops-ok.svg'), name: 'DevOps' },
    items: [{ text: 'Build and test', chk: true }, { text: 'Deploy', chk: true }, { text: 'Operate', chk: true }] },
  mid: { cls: 't', label: 'Overlap, but a different focus' },
} });
