defineSlide({ slug: '13-the-bill', template: 'meter', data: {
  emoji: [{ e: 'chart_increasing', x: 1180, y: 96, size: 120 }, { e: 'money_with_wings', x: 1700, y: 150, size: 130 }],
  eyebrow: 'Cloud engineer · Costs', accent: 'r', h1: 'Growth <em>costs</em>',
  stats: [{ label: 'Videos stored', from: 2, to: 48, fmt: v => Math.round(v) + ' TB' }, { label: 'Users served', from: 8, to: 410, fmt: v => Math.round(v) + 'k' },
    { label: 'Bandwidth / month', from: 30, to: 900, fmt: v => Math.round(v) + ' TB' }],
  chart: { title: 'Monthly AWS bill', unit: 'USD, illustrative', fmt: v => '$' + v.toFixed(1) + 'k',
    bars: [{ l: 'Jan', v: 3.2, c: 'b' }, { l: 'Feb', v: 4.1, c: 'b' }, { l: 'Mar', v: 5.6, c: 'b' }, { l: 'Apr', v: 7.9, c: 'a' }, { l: 'May', v: 11.2, c: 'a' }, { l: 'Jun', v: 14.8, c: 'r' }] },
  counter: { from: 3.2, to: 14.8, fmt: v => '$' + v.toFixed(1) + 'k a month', cls: 'r' },
  sub: 'The job: read every line of it, then optimize. (Illustrative numbers.)',
  // vertical canvas (--variant vertical and the social cuts): positions for the 1080x1920 stage
  v: { emoji: [{ e: 'chart_increasing', x: 610, y: 250, size: 120 }, { e: 'money_with_wings', x: 720, y: 1230, size: 130 }] },
} });
