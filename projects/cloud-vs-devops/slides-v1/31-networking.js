defineSlide({ slug: '31-networking', template: 'diagram', data: {
  eyebrow: '02 · Networking', accent: 'b', h1: 'Wire the<br><em>network</em>',
  vpc: { h: 700,
    boxes: [{ id: 'vpc', cls: 'vpcb', x: 0, y: 20, w: 1100, h: 670, label: 'VPC 10.0.0.0/16' },
      { id: 'pub', cls: 'pub', x: 40, y: 90, w: 1020, h: 220, label: 'Public subnet 10.0.1.0/24' },
      { id: 'priv', cls: 'priv', x: 40, y: 360, w: 1020, h: 300, label: 'Private subnet 10.0.2.0/24' },
      { id: 'sg', cls: '', x: 120, y: 420, w: 860, h: 210, label: 'Security group' }],
    nodes: [{ id: 'alb', x: 550, y: 200, icon: 'elb', aws: true, label: 'Load balancer' },
      { id: 'ec2a', x: 400, y: 520, icon: 'ec2', aws: true, label: 'api-1' }, { id: 'ec2b', x: 700, y: 520, icon: 'ec2', aws: true, label: 'api-2' }],
    edges: [{ from: 'alb', to: 'ec2a', color: '#4CC2FF' }, { from: 'alb', to: 'ec2b', color: '#4CC2FF' }] },
  seq: [{ el: 'vpc', fx: 'fd', at: [.10, .20] }, { el: 'pub', fx: 'fd', at: [.20, .30] }, { el: 'priv', fx: 'fd', at: [.26, .36] },
    { el: 'alb', fx: 'pp', at: [.32, .42] }, { el: 'ec2a', fx: 'pp', at: [.38, .48] }, { el: 'ec2b', fx: 'pp', at: [.42, .52] },
    { el: 'e0', fx: 'draw', at: [.52, .62] }, { el: 'e1', fx: 'draw', at: [.56, .66] }, { el: 'sg', fx: 'fd', at: [.70, .80] }],
} });
