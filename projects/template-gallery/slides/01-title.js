defineSlide({ slug: '01-title', template: 'title', data: {
  eyebrow: 'Template · title', accent: 'o', h1: 'A headline that<br><em>sets the hook</em>', sub: 'Hero logo, a counter badge and a chart are all optional.',
  foot: 'Footnote line at the bottom of the grid.', hero: { logo: 'aws-logo-dark' }, badge: { cls: 'o', counter: { from: 0, to: 212.4, fmt: money } },
  chart: { title: 'Month-to-date cost', unit: 'USD', bars: [{ l: 'Apr', v: 4 }, { l: 'May', v: 9 }, { l: 'Jun', v: 27 }, { l: 'Jul', v: 61 }, { l: 'Aug', v: 128, c: 'a' }, { l: 'Sep', v: 212, c: 'o' }], fmt: v => '$' + v } } });
