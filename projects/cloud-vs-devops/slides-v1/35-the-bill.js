defineSlide({ slug: '35-the-bill', template: 'chart', data: {
  eyebrow: '02 · Costs', accent: 'r', h1: 'The bill<br><em>climbs</em>',
  chart: { title: 'Monthly AWS bill', unit: 'USD, illustrative', fmt: v => '$' + v.toFixed(1) + 'k',
    bars: [{ l: 'Jan', v: 3.2, c: 'b' }, { l: 'Feb', v: 4.1, c: 'b' }, { l: 'Mar', v: 5.6, c: 'b' }, { l: 'Apr', v: 7.9, c: 'a' }, { l: 'May', v: 11.2, c: 'a' }, { l: 'Jun', v: 14.8, c: 'r' }] },
  counter: { from: 3.2, to: 14.8, fmt: v => '$' + v.toFixed(1) + 'k a month', cls: 'r' },
} });
