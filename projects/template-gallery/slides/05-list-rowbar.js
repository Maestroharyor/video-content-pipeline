defineSlide({ slug: '05-list-rowbar', template: 'list', data: {
  eyebrow: 'Template · list (rowbar)', accent: 'b', h1: 'Compact rows with<br>a trailing value', style: 'rowbar',
  items: [{ icon: 'docker', brand: true, text: 'Docker', tail: 'container runtime' }, { icon: 'python', brand: true, text: 'Python', tail: '3.12', cls: 'b' }, { icon: 'postgresql', brand: true, text: 'PostgreSQL', tail: '16', cls: 'g' }, { icon: 'nginx', brand: true, text: 'NGINX', tail: 'reverse proxy' }],
  badge: { text: '4 services', cls: 'b' }, sub: 'Each item may carry a colour class and a tail.', foot: 'Footnote.',
  beats: { r1: .3, r2: .8, badge: 1.6 } } });   // numeric beats (slide-relative seconds) also work without a timeline
