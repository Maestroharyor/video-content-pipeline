defineSlide({
  id: 's04', slug: '04-ec2-spin-up', dur: 5,
  data: {
    eyebrow: '01 · Amazon EC2', accent: 'o', h1: 'You spin one up<br>for a quick test', h1size: 'sm',
    foot: 'Dev box, test server, or a demo of your AI project.',
    console: { service: 'EC2', crumb: ['EC2', 'Instances', 'Launch an instance'], nav: ['Dashboard', 'EC2 Global View', { grp: 'Instances' }, 'Instances', 'Instance Types', 'Launch Templates', { grp: 'Elastic Block Store' }, 'Volumes', 'Snapshots'], active: 3,
      title: 'Launch an instance', buttons: [], primary: 'Launch instance' },
    form: [['Name', 'ai-demo-server'], ['AMI', 'Ubuntu Server 24.04 LTS', 'ubuntu'], ['Instance type', 't3.medium · 2 vCPU · 4 GiB'], ['Key pair', 'dev-keypair'], ['Storage', '1 × 30 GiB gp3 root volume']],
    chips: [{ icon: 'docker', brand: true, text: 'Docker' }, { icon: 'python', brand: true, text: 'Python' }, { icon: 'ubuntu', brand: true, text: 'Ubuntu' }, { sym: 'i-ai', text: 'AI demo', cls: 'v' }],
    toast: 'Successfully initiated launch of instance (i-0f3c9a7e2b1d4c8a)'
  },
  html: d => {
    const form = `<div class="aws-form">${d.form.map((f, i) => `<div class="fr" id="s04-f${i + 1}"><span class="fl">${f[0]}</span><span class="fv dd">${f[2] ? `<img src="${logo(f[2], true)}" alt="">` : ''}${f[1]}</span></div>`).join('')}
      <div class="fh">Free tier eligible instance types are not enough for this model.</div></div>`;
    const c = Object.assign({ id: 's04-con', x: 0, y: 0, body: form }, d.console);
    return `${heading('s04-', d)}
    <div class="content"><div class="rel">
      ${awsConsole(c)}
      ${awsFlash('s04-toast', 226, 104, d.toast)}
      ${pointer('s04-cur')}
      ${d.chips.map((ch, i) => chip(Object.assign({ id: 's04-c' + (i + 1), x: i * 240, y: 790 }, ch))).join('')}
      <div class="sub" id="s04-sub" style="left:0;top:900px;width:960px">Three clicks and a t3.medium is running in us-east-1.</div>
    </div></div>`;
  },
  setup: (root) => {
    // move the primary button into a fixed spot so the pointer can find it
    const pri = document.getElementById('s04-con-pri');
    pri.style.cssText = 'position:absolute;right:18px;bottom:18px;z-index:5';
    document.getElementById('s04-con-body').appendChild(pri);
    const r = pri.getBoundingClientRect(), s = root.getBoundingClientRect();
    root.dataset.px = r.left + r.width / 2 - s.left - GRID.cx; root.dataset.py = r.top + r.height / 2 - s.top - GRID.cy;
  },
  frame: t => {
    const root = document.getElementById('s04');
    const px = +root.dataset.px, py = +root.dataset.py;
    up('s04-eb', seg(t, .02, .12)); h1In('s04-h1', seg(t, .04, .18));
    up('s04-con', seg(t, .06, .22), 60);
    [1, 2, 3, 4, 5].forEach(i => up('s04-f' + i, seg(t, .16 + i * .035, .30 + i * .035), 16));
    [1, 2, 3, 4].forEach(i => sx('s04-c' + i, seg(t, .34 + i * .05, .48 + i * .05), -40));
    cursor('s04-cur', seg(t, .50, .55), seg(t, .52, .66), 420, 330, px, py);
    ripple('s04-cur-rip', seg(t, .66, .76), px + 6, py + 6, 70);
    const pr = seg(t, .66, .70);
    st('s04-con-pri', { transform: 'scale(' + (1 - .06 * pulse(pr)) + ')', filter: 'brightness(' + (1 - .12 * pulse(pr)) + ')' });
    up('s04-toast', seg(t, .74, .84), 24);
    up('s04-sub', seg(t, .82, .92));
    up('s04-ft', seg(t, .88, .98));
  }
});
