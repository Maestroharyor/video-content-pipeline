defineSlide({
  id: 's14', slug: '14-rds-keeps-charging', dur: 5,
  data: {
    eyebrow: 'Still billing', accent: 'b', h1: 'RDS charges on<br>its own line', h1size: 'sm',
    foot: 'Instance hours plus storage, every day it sits there.',
    console: { service: 'Amazon RDS', crumb: ['RDS', 'Databases'], nav: ['Dashboard', 'Databases', 'Query Editor', 'Performance insights', 'Snapshots', 'Automated backups', 'Reserved instances', 'Parameter groups'], active: 1,
      title: 'Databases (2)', buttons: ['Modify', 'Actions ▾'], primary: 'Create database', primaryBlue: true,
      cols: [{ l: 'DB identifier', w: 3 }, { l: 'Status', w: 3 }, { l: 'Engine', w: 3 }, { l: 'Size', w: 2 }],
      rows: [[{ link: 'dev-postgres' }, { st: ['Available', 'ok'] }, 'PostgreSQL', 'db.t3.micro'], [{ link: 'demo-mysql' }, { st: ['Available', 'ok'] }, 'MySQL', 'db.t3.small']] },
    bill: [{ l: 'EC2 – Compute', v: '$0.00', c: 'o', w: 0.0 }, { l: 'EBS', v: '$2.40', c: 'g', w: 0.14 }, { l: 'RDS', v: '$14.60', c: 'p', w: 0.86 }],
    total: ['Month-to-date', '$17.00']
  },
  html: d => `${heading('s14-', d)}
  <div class="content"><div class="rel">
    ${awsConsole(Object.assign({ id: 's14-con', x: 0, y: 0 }, d.console))}
    <div class="aws" id="s14-bill" style="left:0;top:760px;height:300px;border-radius:22px">
      <div class="aws-crumb" style="height:52px;font-weight:700;color:var(--aws-ink)">Billing and Cost Management<i>›</i><b>Cost by service</b></div>
      <div class="aws-body" style="padding:10px 18px"><div class="aws-cont">${awsBilling('s14-b', d.bill, d.total)}</div></div>
    </div>
  </div></div>`,
  frame: t => {
    up('s14-eb', seg(t, .02, .14)); h1In('s14-h1', seg(t, .05, .22));
    up('s14-con', seg(t, .06, .22), 60);
    up('s14-con-r1', seg(t, .18, .30), 16); up('s14-con-r2', seg(t, .24, .36), 16);
    up('s14-bill', seg(t, .40, .54), 50);
    [1, 2, 3].forEach(i => { sx('s14-b-r' + i, seg(t, .48 + i * .06, .60 + i * .06), -30); fill('s14-b-f' + i, seg(t, .56 + i * .06, .74 + i * .06)); });
    const g = pulse(seg(t, .78, .94));
    st('s14-b-r3', { background: 'rgba(201,37,209,' + (g * .10) + ')', borderRadius: '8px' });
    up('s14-b-tot', seg(t, .82, .92));
    up('s14-ft', seg(t, .88, 1));
  }
});
