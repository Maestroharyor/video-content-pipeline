defineSlide({ slug: '52-ansible', template: 'term', data: {
  eyebrow: '03 · Config', accent: 'o', h1: 'Servers,<br><em>configured</em>', cwd: '~/vidshare/ops',
  steps: [{ cmd: 'ansible-playbook -i inventories/prod site.yml', out: [
    'TASK [common : Configure servers]    <span class="wn">changed: [web-1]</span>',
    'TASK [app : Install dependencies]    <span class="wn">changed: [web-1]</span>',
    'TASK [app : Prepare environment]     <span class="ok">ok: [web-1]</span>',
    'PLAY RECAP  web-1  <span class="ok">ok=12</span>  <span class="wn">changed=3</span>  unreachable=0  failed=0'] }],
  badge: { text: 'Ansible', cls: 'o' },
} });
