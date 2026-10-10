defineSlide({ slug: '09-chart', template: 'chart', data: {
  eyebrow: 'Template · chart', accent: 'a', h1: 'Bars that grow,<br>a counter that ticks',
  chart: { title: 'Monthly compute, idle', unit: 'USD / month', bars: [{ l: 't3.medium', v: 30, c: 'o' }, { l: 't3.small', v: 15, c: 'o' }, { l: 'c5.large', v: 62, c: 'o' }, { l: 'g4dn.xlarge', v: 379, c: 'r' }], fmt: v => '$' + v },
  counter: { from: 0, to: 486, fmt: v => '$' + Math.round(v), cls: 'a' }, badges: [{ text: 'a month, idle', cls: 'n', x: 260 }], sub: 'Colour classes: o r a b g t v d.', foot: 'Footnote.' } });
