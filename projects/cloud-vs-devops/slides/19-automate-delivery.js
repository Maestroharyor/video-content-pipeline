defineSlide({ slug: '19-automate-delivery', template: 'bench', data: {
  eyebrow: 'DevOps engineer · Automation', accent: 'o', h1: 'Automate the <em>delivery</em>',
  cast: [{ src: passet('avatars/devops-ok.svg'), name: 'DevOps', cls: 'o' }],
  bubbles: [{ who: 0, text: 'Automate <em>the delivery</em>.', x: 0, y: 20, w: 220, tail: 'd', cls: 'o' }],
  windows: [
    { kind: 'code', file: '.github/workflows/deploy.yml', lines: [
      '<span class="f">on</span>:', '  <span class="f">push</span>: { branches: [<span class="s">main</span>] }', '<span class="f">jobs</span>:', '  <span class="f">ship</span>:',
      '    <span class="f">runs-on</span>: <span class="s">ubuntu-latest</span>', '    <span class="f">steps</span>:', '      - uses: <span class="s">actions/checkout@v4</span>',
      '      - run: <span class="s">npm ci &amp;&amp; npm run build</span>', '      - run: <span class="s">npm test</span>', '      - run: <span class="s">./scripts/deploy.sh</span>'] },
    { kind: 'term', cwd: '~/vidshare/ops', steps: [{ cmd: 'ansible-playbook -i inventories/prod site.yml', out: [
      'TASK [common : Configure servers]    <span class="wn">changed: [web-1]</span>', 'TASK [app : Install dependencies]    <span class="wn">changed: [web-1]</span>',
      'TASK [app : Prepare environment]     <span class="ok">ok: [web-1]</span>', 'PLAY RECAP  web-1  <span class="ok">ok=12</span>  <span class="wn">changed=3</span>  failed=0'] }] }],
  chips: [{ text: 'GitHub Actions', cls: 'o' }, { text: 'Jenkins', cls: 'o' }, { text: 'Ansible', cls: 'o' }],
  // vertical canvas (--variant vertical and the social cuts): positions for the 1080x1920 stage
  v: { bubbles: [{ who: 0, text: 'Automate <em>the delivery</em>.', x: 230, y: 610, w: 260, tail: 'l', cls: 'o' }] },
} });
