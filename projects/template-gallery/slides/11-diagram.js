defineSlide({ slug: '11-diagram', template: 'diagram', dur: 4, data: {
  eyebrow: 'Template · diagram', accent: 'v', h1: 'Boxes, nodes and<br>drawn edges',
  vpc: { h: 860, boxes: [{ id: 'vpc', cls: 'vpcb', x: 0, y: 110, w: 960, h: 730, label: 'VPC 10.0.0.0/16' }, { id: 'pub', cls: 'pub', x: 40, y: 170, w: 880, h: 280, label: 'Public subnet' }, { id: 'priv', cls: 'priv', x: 40, y: 500, w: 880, h: 300, label: 'Private subnet' }],
    nodes: [{ id: 'igw', x: 250, y: 300, icon: 'internet-gateway', label: 'Internet gateway' }, { id: 'nat', x: 690, y: 300, icon: 'nat-gateway', label: 'NAT gateway', hot: true }, { id: 'a', x: 250, y: 640, icon: 'ec2-instance', label: 'app-server' }, { id: 'b', x: 690, y: 640, icon: 'ec2-instance', label: 'worker' }],
    edges: [{ from: 'a', to: 'nat', via: [[250, 560], [690, 560]], color: '#38BDF8' }, { from: 'b', to: 'nat', color: '#38BDF8' }, { from: 'nat', to: 'igw', color: '#8B5CF6' }], cloud: { x: 214, y: 10, label: 'Internet' } },
  dim: { els: ['igw', 'a', 'b', 'e0', 'e1', 'e2', 'cloud', 'pub', 'priv', 'vpc'], at: [.80, .92], to: .4 }, hot: 'nat', badge: { text: 'And then you forget it exists', cls: 'v' }, foot: 'Footnote.' } });
