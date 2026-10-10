defineSlide({ slug: '12-beyond-setup', template: 'map', xf: 'cut', data: {
  eyebrow: 'Cloud engineer · Beyond setup', accent: 'b', h1: 'Then keep it <em>running</em>',
  slots: { users: 'e', cdn: 'f', lb: 'f', ec2: 'f', db: 'F', s3: 'f' }, edges: { 1: 'pre', 2: 'pre', 3: 'pre', 4: 'pre', 5: 'pre', 6: 'pre' }, flow: [1, 2, 3, 6],
  boxes: { vpc: 'pre', pub: 'pre', priv: 'pre', sg: 'pre' },
  badges: [{ at: 'ec2', text: 'Security', cls: 'r', dx: -60, dy: -122 }, { at: 'lb', text: 'Availability', cls: 'g', dx: -80, dy: 90 },
    { at: 'db', text: 'Backups', cls: 'v', dx: -60, dy: 90 }, { at: 'cdn', text: 'Monitoring', cls: 'b', dx: -80, dy: -130 }],
  meter: { label: 'Cloud bill', from: 0, to: 4.2, fmt: v => '$' + v.toFixed(1) + 'k / mo', cls: 'r', x: 1230, y: 500 },
  cast: [{ src: passet('avatars/cloud-hand.svg'), name: 'Cloud', cls: 'b', size: 160, x: 0, y: 440 }],
  bubbles: [{ who: 0, text: 'What will it <em>cost</em> us?', x: 190, y: 470, w: 250, tail: 'l' }],
} });
