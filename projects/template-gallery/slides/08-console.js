defineSlide({ slug: '08-console', template: 'console', dur: 5, data: {
  eyebrow: 'Template · console', accent: 'a', h1: 'AWS console with<br>a click flow',
  console: { service: 'EC2', crumb: ['EC2', 'Instances'], nav: ['Dashboard', { grp: 'Instances' }, 'Instances', 'Instance Types', { grp: 'Elastic Block Store' }, 'Volumes'], active: 2,
    title: 'Instances (1)', buttons: ['Instance state ▾', 'Actions ▾'], primary: 'Launch instances',
    cols: [{ l: 'Name', w: 3 }, { l: 'Instance ID', w: 4 }, { l: 'Instance state', w: 3 }, { l: 'Type', w: 2 }],
    rows: [['demo-server', { mono: 'i-0f3c9a7e2b1d4c8a' }, { st: ['Running', 'ok'] }, 't3.medium']] },
  select: [1], menu: [{ hl: 'Stop instance' }, 'Start instance', 'Reboot instance', { dis: 'Hibernate instance' }, '-', 'Terminate instance'],
  modal: { title: 'Stop instance?', body: 'You are about to stop <b>i-0f3c9a7e2b1d4c8a (demo-server)</b>', warn: 'Attached EBS volumes continue to be billed while the instance is stopped.', ok: 'Stop' },
  flow: { x0: 300, y0: 420 }, states: [['Running', 'ok'], ['Stopping', 'prog'], ['Stopped', 'stop']],
  badges: [{ text: 'Stopped ≠ $0', cls: 'a', size: 40, pad: '18px 28px' }], sub: 'menu → item → confirmation modal → status change.', foot: 'Footnote.' } });
