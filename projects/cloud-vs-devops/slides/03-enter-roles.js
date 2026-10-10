defineSlide({ slug: '03-enter-roles', template: 'lanes', data: {
  eyebrow: 'The roles', accent: 'b', h1: 'Enter <em>two engineers</em>',
  left: { role: 'Cloud engineer', was: '???', cls: 'b', pre: 'all', items: ['Servers', 'Infrastructure', 'Running in the cloud'], avatar: { src: passet('avatars/cloud-point.svg'), name: 'Cloud' } },
  right: { role: 'DevOps engineer', was: '???', cls: 'o', pre: 'all', items: ['Build', 'Test', 'Deploy updates'], avatar: { src: passet('avatars/devops-point.svg'), name: 'DevOps' } },
  mid: { cls: 't', label: 'Both work with', chips: [{ text: 'AWS', icon: 'aws-logo-dark' }, { text: 'Azure', src: passet('azure.svg') }, { text: 'Docker', icon: 'docker', brand: true },
    { text: 'Terraform', icon: 'terraform', brand: true }, { text: 'Kubernetes', icon: 'kubernetes', brand: true }, { text: '…and many more' }] },
} });
