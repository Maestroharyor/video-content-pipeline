defineSlide({
  id: 's10', slug: '10-user-data-script', dur: 5,
  data: {
    eyebrow: 'The fix', accent: 'g', h1: 'Put the setup in<br>a user-data script', h1size: 'sm',
    foot: 'Rebuild in a minute instead of babysitting a running instance.',
    tiles: [{ icon: 'ubuntu', label: 'Ubuntu' }, { icon: 'docker', label: 'Docker' }, { icon: 'python', label: 'Python' }, { icon: 'git', label: 'Git' }],
    file: 'user-data.sh',
    lines: ['<span class="c">#!/bin/bash</span>', '<span class="c"># runs once, on first boot of every new instance</span>', 'apt-get update -y', 'apt-get install -y docker.io python3-pip git', 'systemctl enable --now docker', 'git clone <span class="s">https://github.com/you/ai-demo</span> /srv/app', '<span class="k">cd</span> /srv/app && docker compose up -d'],
    note: 'Paste it under Advanced details → User data when you launch.', ok: 'Runs on every first boot'
  },
  html: d => `${heading('s10-', d)}
  <div class="content"><div class="rel">
    ${d.tiles.map((tl, i) => logoStack({ id: 's10-t' + (i + 1), x: 55 + i * 240, y: 0, icon: tl.icon, brand: true, label: tl.label, w: 180 })).join('')}
    <div class="code" id="s10-code" style="position:absolute;left:0;top:230px;width:960px">
      <div class="bar"><i></i><i></i><i></i><span>${d.file}</span></div>
      <pre>${d.lines.map((l, i) => `<span class="cl" id="s10-l${i + 1}">${l}</span>`).join('')}</pre>
    </div>
    <div class="rowbar g big" id="s10-ok" style="left:0;top:724px;width:960px"><span class="ico" style="display:grid;place-items:center;width:40px;height:40px"><svg viewBox="0 0 24 24" style="width:36px;height:36px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round"><use href="#i-check"/></svg></span>${d.ok}</div>
    <div class="badge t note" id="s10-note" style="left:0;top:856px;width:960px">${d.note}</div>
  </div></div>`,
  frame: t => {
    up('s10-eb', seg(t, .02, .12)); h1In('s10-h1', seg(t, .04, .18));
    [1, 2, 3, 4].forEach(i => pp('s10-t' + i, seg(t, .08 + i * .04, .20 + i * .04), .78));
    st('s10-code', { opacity: eo(seg(t, .26, .36)), transform: 'translateY(' + ((1 - eo(seg(t, .26, .36))) * 28) + 'px)' });
    code('s10-l', 7, t, .32, .74);
    sx('s10-ok', seg(t, .76, .86), -46);
    up('s10-note', seg(t, .84, .94));
    up('s10-ft', seg(t, .90, 1));
  }
});
