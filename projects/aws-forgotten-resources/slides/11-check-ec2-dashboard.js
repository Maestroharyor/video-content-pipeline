defineSlide({
  id: 's11', slug: '11-check-ec2-dashboard', dur: 5,
  data: {
    eyebrow: 'Before you leave', accent: 't', h1: 'Stop or terminate<br>what you don\'t use', h1size: 'sm',
    foot: 'Check the EC2 dashboard before you close the project.',
    console: { service: 'EC2', crumb: ['EC2', 'Instances'], nav: ['Dashboard', 'EC2 Global View', { grp: 'Instances' }, 'Instances', 'Instance Types', 'Launch Templates', { grp: 'Elastic Block Store' }, 'Volumes', 'Snapshots'], active: 3,
      title: 'Instances (4)', buttons: ['Instance state ▾'], primary: 'Launch instances',
      cols: [{ l: 'Name', w: 3 }, { l: 'Instance state', w: 3 }, { l: 'Type', w: 2 }, { l: 'Launch time', w: 3 }],
      rows: [['ai-demo-server', { st: ['Running', 'ok'] }, 't3.medium', '2026/08/02'], ['test-api-2', { st: ['Running', 'ok'] }, 't3.small', '2026/07/19'],
        ['load-test-old', { st: ['Stopped', 'stop'] }, 'c5.large', '2026/06/11'], ['jupyter-try', { st: ['Running', 'ok'] }, 'g4dn.xlarge', '2026/08/30']] },
    menu: ['Stop instance', { dis: 'Start instance' }, 'Reboot instance', { dis: 'Hibernate instance' }, '-', { hl: 'Terminate instance' }],
    modal: { title: 'Terminate instances?', body: 'You are about to terminate 3 instances: <b>test-api-2, load-test-old, jupyter-try</b>', warn: 'On an EBS-backed instance, the default action is for the root EBS volume to be deleted when the instance is terminated.', ok: 'Terminate' },
    doomed: [2, 3, 4], badge: ['3 running', '1 running'], keep: 'Keep the one you still use', sub: 'Terminate what is finished. Stop what you will come back to.'
  },
  html: d => `${heading('s11-', d)}
  <div class="content"><div class="rel">
    ${awsConsole(Object.assign({ id: 's11-con', x: 0, y: 0 }, d.console))}
    ${awsMenu('s11-menu', 0, 0, d.menu)}
    ${pointer('s11-cur')}
    <div class="badge t" id="s11-bd" style="left:0;top:770px;font-size:40px;padding:18px 28px"><span id="s11-n">${d.badge[0]}</span></div>
    <div class="badge n" id="s11-keep" style="left:400px;top:770px;font-size:26px;padding:22px 24px">${d.keep}</div>
    <div class="sub" id="s11-sub" style="left:0;top:890px;width:960px">${d.sub}</div>
  </div></div>`,
  setup: root => {
    const d = slideFor('s11').data;
    document.getElementById('s11-con').insertAdjacentHTML('beforeend', awsModal('s11-md', 200, 110, d.modal));
    const btn = root.querySelector('#s11-con .aws-btn.dd'); const r = btn.getBoundingClientRect(), s = root.getBoundingClientRect();
    const m = document.getElementById('s11-menu'); m.style.left = (r.left - s.left - GRID.cx) + 'px'; m.style.top = (r.bottom - s.top - GRID.cy + 6) + 'px';
    const item = m.querySelector('.hl'); item.classList.remove('hl');
    root._flow = { cur: 's11-cur', menu: 's11-menu', modal: 's11-md', btn, item, x0: 380, y0: 440,
      b: centerOf(root, btn), i: centerOf(root, item), ok: centerOf(root, document.getElementById('s11-md-ok')) };
  },
  frame: t => {
    const root = document.getElementById('s11'), d = slideFor('s11').data;
    up('s11-eb', seg(t, .02, .12)); h1In('s11-h1', seg(t, .04, .18));
    up('s11-con', seg(t, .04, .18), 60);
    [1, 2, 3, 4].forEach(i => up('s11-con-r' + i, seg(t, .08 + i * .03, .20 + i * .03), 16));
    const f = clickFlow(t, root._flow);
    d.doomed.forEach((i, k) => {
      const selected = t > .14 + k * .03 && !f.confirmed;
      const done = f.confirmed && t > .74 + k * .04;
      cls('s11-con-r' + i + '-cb', 'on', selected); cls('s11-con-r' + i, 'sel', selected);
      status('s11-con-r' + i + '-st', done ? 'Terminated' : (i === 3 ? 'Stopped' : 'Running'), done ? 'neg' : (i === 3 ? 'stop' : 'ok'));
      cls('s11-con-r' + i, 'dim', done);
    });
    txt('s11-n', t > .86 ? d.badge[1] : d.badge[0]);
    pp('s11-bd', seg(t, .80, .90), .8);
    up('s11-keep', seg(t, .84, .94));
    up('s11-sub', seg(t, .88, .98));
    up('s11-ft', seg(t, .90, 1));
  }
});
