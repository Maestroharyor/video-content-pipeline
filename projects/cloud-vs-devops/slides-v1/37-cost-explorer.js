defineSlide({ slug: '37-cost-explorer', template: 'console', data: {
  eyebrow: '02 · Costs', accent: 'r', h1: 'Cost<br><em>Explorer</em>',
  console: { service: 'Billing and Cost Management', crumb: ['Billing and Cost Management', 'Cost Explorer'],
    nav: ['Home', { grp: 'Cost analysis' }, 'Cost Explorer', 'Budgets', 'Cost anomaly detection', { grp: 'Savings' }, 'Savings Plans'], active: 2,
    title: 'Cost by service (last 30 days)', buttons: ['Group by: Service ▾'], primary: 'Download CSV',
    cols: [{ l: 'Service', w: 4 }, { l: 'Cost', w: 3 }, { l: 'vs last month', w: 3 }],
    rows: [['EC2-Instances', { mono: '$6,940.12' }, { html: '<b style="color:#D91515">+38%</b>' }], ['CloudFront', { mono: '$4,120.55' }, { html: '<b style="color:#D91515">+51%</b>' }],
      ['S3', { mono: '$2,310.08' }, { html: '<b style="color:#8D6605">+22%</b>' }], ['RDS', { mono: '$1,082.40' }, { html: '+4%' }], ['Data Transfer', { mono: '$418.97' }, { html: '+9%' }]] },
  badges: [{ text: 'Forecast next month: $17.2k', cls: 'r' }], sub: 'Illustrative figures.',
} });
