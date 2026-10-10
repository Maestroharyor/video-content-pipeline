defineSlide({ slug: '30-cloudfront', template: 'diagram', data: {
  eyebrow: '02 · Delivery', accent: 'b', h1: 'Closer to<br>the <em>viewer</em>',
  vpc: { h: 640,
    nodes: [{ id: 's3', x: 130, y: 320, icon: 's3', aws: true, label: 'S3 · origin' }, { id: 'cf', x: 480, y: 320, icon: 'cloudfront', aws: true, label: 'CloudFront' },
      { id: 'ed1', x: 900, y: 110, icon: 'cloudfront', aws: true, label: 'Edge · London' }, { id: 'ed2', x: 900, y: 320, icon: 'cloudfront', aws: true, label: 'Edge · Lagos' },
      { id: 'ed3', x: 900, y: 530, icon: 'cloudfront', aws: true, label: 'Edge · Tokyo' }],
    edges: [{ from: 's3', to: 'cf', color: '#4CC2FF' }, { from: 'cf', to: 'ed1', via: [[690, 320], [690, 110]], color: '#4CC2FF' },
      { from: 'cf', to: 'ed2', color: '#4CC2FF' }, { from: 'cf', to: 'ed3', via: [[690, 320], [690, 530]], color: '#4CC2FF' }] },
  seq: [{ el: 's3', fx: 'pp', at: [.10, .20] }, { el: 'cf', fx: 'pp', at: [.24, .34] }, { el: 'e0', fx: 'draw', at: [.30, .40] },
    { el: 'e1', fx: 'draw', at: [.44, .54] }, { el: 'ed1', fx: 'pp', at: [.50, .60] }, { el: 'e2', fx: 'draw', at: [.56, .66] },
    { el: 'ed2', fx: 'pp', at: [.62, .72] }, { el: 'e3', fx: 'draw', at: [.68, .78] }, { el: 'ed3', fx: 'pp', at: [.74, .84] }],
} });
