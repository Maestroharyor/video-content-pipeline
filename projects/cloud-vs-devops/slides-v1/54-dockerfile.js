defineSlide({ slug: '54-dockerfile', template: 'code', data: {
  eyebrow: '03 · Containers', accent: 'o', h1: 'Package it<br>in <em>Docker</em>', file: 'Dockerfile',
  tiles: [{ icon: 'docker', label: 'Docker' }],
  lines: [
    '<span class="k">FROM</span> node:22-alpine',
    '<span class="k">WORKDIR</span> /app',
    '<span class="k">COPY</span> package*.json ./',
    '<span class="k">RUN</span> npm ci --omit=dev',
    '<span class="k">COPY</span> . .',
    '<span class="k">CMD</span> [<span class="s">"node"</span>, <span class="s">"server.js"</span>]',
  ],
} });
