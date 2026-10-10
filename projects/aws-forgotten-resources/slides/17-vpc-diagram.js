defineSlide({
  id: 's17', slug: '17-vpc-diagram', dur: 5,
  data: {
    eyebrow: 'Where it lives', accent: 'v', h1: 'Private servers<br>need a way out', h1size: 'sm',
    foot: 'You created it so the private subnet could reach the internet. Then you moved on.',
    vpc: { id: 's17-v', x: 0, y: 0, w: 960, h: 1000,
      boxes: [{ id: 'vpc', cls: 'vpcb', x: 0, y: 130, w: 960, h: 840, label: 'VPC 10.0.0.0/16' },
        { id: 'pub', cls: 'pub', x: 40, y: 190, w: 880, h: 300, label: 'Public subnet' },
        { id: 'priv', cls: 'priv', x: 40, y: 560, w: 880, h: 360, label: 'Private subnet' }],
      nodes: [{ id: 'igw', x: 250, y: 330, icon: 'internet-gateway', label: 'Internet gateway' },
        { id: 'nat', x: 690, y: 330, icon: 'nat-gateway', label: 'NAT gateway', hot: true },
        { id: 'a', x: 250, y: 720, icon: 'ec2-instance', label: 'app-server' },
        { id: 'b', x: 690, y: 720, icon: 'ec2-instance', label: 'worker' }],
      edges: [{ from: 'a', to: 'nat', via: [[250, 620], [690, 620]], color: '#38BDF8' }, { from: 'b', to: 'nat', color: '#38BDF8' },
        { from: 'nat', to: 'igw', color: '#8B5CF6' }, { from: 'igw', to: 'igw', via: [[250, 200]], color: '#34D399' }],
      cloud: { x: 214, y: 20, label: 'Internet' } },
    sub: 'Outbound traffic from private instances is routed through the NAT gateway.'
  },
  html: d => `${heading('s17-', d)}
  <div class="content"><div class="rel">
    ${vpcDiagram(d.vpc)}
    <div class="badge v" id="s17-bd" style="left:0;top:1030px;font:600 30px Inter;padding:16px 26px">And then you completely forget it exists</div>
  </div></div>`,
  setup: root => {
    // the internet edge should run from the IGW up to the cloud label
    const e = document.querySelector('#s17-v-e3 path'); e.setAttribute('d', 'M250 300 L250 110');
  },
  frame: t => {
    up('s17-eb', seg(t, .02, .12)); h1In('s17-h1', seg(t, .04, .18));
    fd('s17-v-vpc', seg(t, .06, .16));
    up('s17-v-pub', seg(t, .14, .24), 20); up('s17-v-priv', seg(t, .18, .28), 20);
    fd('s17-v-cloud', seg(t, .10, .20));
    pp('s17-v-a', seg(t, .26, .36), .8); pp('s17-v-b', seg(t, .30, .40), .8);
    pp('s17-v-nat', seg(t, .38, .48), .8); pp('s17-v-igw', seg(t, .44, .54), .8);
    draw('s17-v-e0', seg(t, .50, .60)); draw('s17-v-e1', seg(t, .52, .62)); draw('s17-v-e2', seg(t, .60, .68)); draw('s17-v-e3', seg(t, .66, .74));
    // forget beat: everything except the NAT gateway dims
    const f = seg(t, .80, .92);
    ['s17-v-igw', 's17-v-a', 's17-v-b', 's17-v-e0', 's17-v-e1', 's17-v-e2', 's17-v-e3', 's17-v-cloud', 's17-v-pub', 's17-v-priv', 's17-v-vpc'].forEach(id => st(id, { opacity: 1 - .6 * f }));
    const g = pulse(seg(t, .84, 1));
    st('s17-v-nat', { transform: 'scale(' + (1 + .06 * g) + ')' });
    up('s17-bd', seg(t, .84, .94));
    up('s17-ft', seg(t, .90, 1));
  }
});
