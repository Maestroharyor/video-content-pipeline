defineSlide({
  id: 's15', slug: '15-stop-and-clean-up', dur: 5,
  data: {
    eyebrow: 'The fix', accent: 'g', h1: 'Stop it,<br>then delete it',
    foot: 'A stopped RDS instance restarts itself after seven days.',
    console: { service: 'Amazon RDS', crumb: ['RDS', 'Databases'], nav: ['Dashboard', 'Databases', 'Query Editor', 'Performance insights', 'Snapshots', 'Automated backups', 'Reserved instances', 'Parameter groups'], active: 1,
      title: 'Databases (1)', buttons: ['Modify', 'Actions ▾'], primary: 'Create database', primaryBlue: true,
      cols: [{ l: 'DB identifier', w: 3 }, { l: 'Status', w: 3 }, { l: 'Engine', w: 3 }, { l: 'Size', w: 2 }],
      rows: [[{ link: 'dev-postgres' }, { st: ['Available', 'ok'] }, 'PostgreSQL', 'db.t3.micro']] },
    menu: [{ hl: 'Stop temporarily' }, 'Reboot', 'Take snapshot', 'Create read replica', '-', 'Delete'],
    modal: { title: 'Stop DB instance temporarily?', body: 'Are you sure you want to stop <b>dev-postgres</b> temporarily?', warn: 'The DB instance will automatically restart after 7 days. Delete it if you no longer need it.', ok: 'Stop temporarily', blue: true },
    states: [['Available', 'ok'], ['Stopping', 'prog'], ['Stopped', 'stop']],
    warn: 'Stopped for 7 days → AWS starts it again', ok: 'Snapshot it, then delete it',
    sub: 'Keep the snapshot. It costs cents. The running instance costs dollars.'
  },
  html: d => `${heading('s15-', d)}
  <div class="content"><div class="rel">
    ${awsConsole(Object.assign({ id: 's15-con', x: 0, y: 0 }, d.console))}
    ${awsMenu('s15-menu', 0, 0, d.menu)}
    ${pointer('s15-cur')}
    <div class="badge a" id="s15-warn" style="left:0;top:770px;font:600 30px Inter;padding:18px 26px">${d.warn}</div>
    <div class="rowbar g big" id="s15-ok" style="left:0;top:870px;width:960px"><span class="ico" style="display:grid;place-items:center;width:40px;height:40px"><svg viewBox="0 0 24 24" style="width:36px;height:36px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round"><use href="#i-check"/></svg></span>${d.ok}</div>
    <div class="sub" id="s15-sub" style="left:0;top:1000px;width:960px">${d.sub}</div>
  </div></div>`,
  setup: root => {
    const d = slideFor('s15').data;
    document.getElementById('s15-con').insertAdjacentHTML('beforeend', awsModal('s15-md', 200, 110, d.modal));
    const btn = root.querySelector('#s15-con .aws-btn.dd'); const r = btn.getBoundingClientRect(), s = root.getBoundingClientRect();
    const m = document.getElementById('s15-menu'); m.style.left = (r.left - s.left - GRID.cx) + 'px'; m.style.top = (r.bottom - s.top - GRID.cy + 6) + 'px';
    const item = m.querySelector('.hl'); item.classList.remove('hl');
    root._flow = { cur: 's15-cur', menu: 's15-menu', modal: 's15-md', btn, item, x0: 380, y0: 440,
      b: centerOf(root, btn), i: centerOf(root, item), ok: centerOf(root, document.getElementById('s15-md-ok')) };
  },
  frame: t => {
    const root = document.getElementById('s15'), d = slideFor('s15').data;
    up('s15-eb', seg(t, .02, .12)); h1In('s15-h1', seg(t, .04, .18));
    up('s15-con', seg(t, .04, .18), 60);
    up('s15-con-r1', seg(t, .12, .22), 16);
    cls('s15-con-r1-cb', 'on', t > .20); cls('s15-con-r1', 'sel', t > .20);
    const f = clickFlow(t, root._flow);
    const si = !f.confirmed ? 0 : t < .86 ? 1 : 2;
    status('s15-con-r1-st', d.states[si][0], d.states[si][1]);
    up('s15-warn', seg(t, .78, .88));
    sx('s15-ok', seg(t, .84, .94), -46);
    up('s15-sub', seg(t, .90, 1));
    up('s15-ft', seg(t, .90, 1));
  }
});
