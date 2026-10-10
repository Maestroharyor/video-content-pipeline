defineSlide({ slug: '08-cloud-engineer', template: 'map', data: {
  eyebrow: 'Cloud engineer', accent: 'b', h1: 'What the app <em>needs</em>',
  slots: { users: 'E', cdn: 'E', ec2: 'E', db: 'E', s3: 'E' }, edges: { 1: 'beat', 4: 'beat', 5: 'beat', 6: 'beat' },
  badges: [{ at: 'ec2', text: 'Always up', cls: 'g' }, { at: 'db', text: 'No downtime', cls: 'g', dx: -40 }, { at: 'cdn', text: 'Scales with traffic', cls: 'b', dx: -120 }],
  cast: [{ src: passet('avatars/cloud-point.svg'), name: 'Cloud', cls: 'b', size: 170, x: 0, y: 430 }],
  bubbles: [{ who: 0, text: 'That\'s <em>my</em> job.', x: 200, y: 470, w: 230, tail: 'l' }],
} });
