defineSlide({ slug: '11-aws-delivery-network', template: 'map', xf: 'cut', data: {
  eyebrow: 'Cloud engineer · Building on AWS', accent: 'b', h1: 'Deliver it, <em>wire it</em>',
  slots: { users: 'e', cdn: 'F', lb: 'N', ec2: 'f', db: 'e', s3: 'f' }, edges: { 1: 'pre', 2: 'beat', 3: 'beat', 4: 'pre', 5: 'pre', 6: 'pre' }, flow: [1, 6],
  boxes: { vpc: 'beat', pub: 'beat', priv: 'beat', sg: 'beat' },
  badges: [{ at: 'users', text: 'Edges: London · Lagos · Tokyo', cls: 'b', dx: -90, dy: 90 }],
  cam0: { x: 1080, y: 405, z: 1.05, ax: 1150 }, cams: [{ x: 300, y: 330, z: 1.3, ax: 560 }, { x: 770, y: 320, z: 1, ax: 770 }],
  // vertical canvas (--variant vertical and the social cuts): positions for the 1080x1920 stage
  v: { cam0: { x: 300, y: 840, z: 1, ax: 480, ay: 260 }, cams: [{ x: 300, y: 330, z: 1.25, ax: 480, ay: 330 }, { x: 450, y: 640, z: .95, ax: 480, ay: 580 }] },
} });
