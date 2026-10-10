defineSlide({ slug: '51-actions', template: 'code', data: {
  eyebrow: '03 · CI/CD', accent: 'o', h1: 'A CI/CD<br><em>pipeline</em>', file: '.github/workflows/deploy.yml',
  tiles: [{ icon: 'githubactions', label: 'GitHub Actions' }, { icon: 'jenkins', label: 'Jenkins' }],
  lines: [
    '<span class="f">on</span>:',
    '  <span class="f">push</span>: { branches: [<span class="s">main</span>] }',
    '<span class="f">jobs</span>:',
    '  <span class="f">ship</span>:',
    '    <span class="f">runs-on</span>: <span class="s">ubuntu-latest</span>',
    '    <span class="f">steps</span>:',
    '      - uses: <span class="s">actions/checkout@v4</span>',
    '      - run: <span class="s">npm ci &amp;&amp; npm run build</span>',
    '      - run: <span class="s">npm test</span>',
    '      - run: <span class="s">./scripts/deploy.sh</span>',
  ],
} });
