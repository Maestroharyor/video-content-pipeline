defineSlide({ slug: '07-code', template: 'code', data: {
  eyebrow: 'Template · code', accent: 'g', h1: 'Code block with<br>line reveal', file: 'user-data.sh',
  tiles: [{ icon: 'ubuntu', label: 'Ubuntu' }, { icon: 'docker', label: 'Docker' }],
  lines: ['<span class="c">#!/bin/bash</span>', 'apt-get update -y', 'apt-get install -y docker.io git', 'git clone <span class="s">https://github.com/you/app</span> /srv/app', '<span class="k">cd</span> /srv/app && docker compose up -d'],
  ok: 'Runs on every first boot', note: 'Paste it under Advanced details → User data when you launch.', foot: 'Footnote.' } });
