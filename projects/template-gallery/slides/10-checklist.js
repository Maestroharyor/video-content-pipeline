defineSlide({ slug: '10-checklist', template: 'checklist', data: {
  eyebrow: 'Template · checklist', accent: 'g', h1: 'Rows that get<br>ticked in order',
  items: [{ icon: 'ec2', text: 'EC2 instances', sub: 'stop or terminate', tail: 'EC2 › Instances' }, { icon: 'ebs', text: 'EBS volumes', sub: 'delete leftovers', tail: 'EC2 › Volumes' }, { icon: 'rds', text: 'RDS databases', sub: 'snapshot, then delete', tail: 'RDS › Databases' }],
  chart: { title: 'Forecast after cleanup', unit: 'USD / month', bars: [{ l: 'Jul', v: 61 }, { l: 'Aug', v: 128 }, { l: 'Sep', v: 212, c: 'r' }, { l: 'Oct', v: 4, c: 'g' }], max: 260, fmt: v => '$' + v },
  badge: { text: 'Back to almost zero', cls: 'g' }, foot: 'Footnote.' } });
