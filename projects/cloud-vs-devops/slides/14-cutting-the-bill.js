defineSlide({ slug: '14-cutting-the-bill', template: 'bench', data: {
  emoji: [{ e: 'scissors', x: 1215, y: 165, size: 120 }],
  eyebrow: 'Cloud engineer · Cost optimization', accent: 'r', h1: 'Find it, then <em>cut it</em>',
  windows: [
    { kind: 'console', hl: 1, console: { service: 'Billing and Cost Management', crumb: ['Billing and Cost Management', 'Cost Explorer'],
      nav: ['Home', { grp: 'Cost analysis' }, 'Cost Explorer', 'Budgets', 'Cost anomaly detection'], active: 2,
      title: 'Cost by service (last 30 days)', buttons: ['Group by: Service ▾'], primary: 'Download CSV',
      cols: [{ l: 'Service', w: 4 }, { l: 'Cost', w: 3 }, { l: 'vs last month', w: 3 }],
      rows: [['EC2-Instances', { mono: '$6,940.12' }, { html: '<b style="color:#D91515">+38%</b>' }], ['CloudFront', { mono: '$4,120.55' }, { html: '<b style="color:#D91515">+51%</b>' }],
        ['S3', { mono: '$2,310.08' }, { html: '<b style="color:#8D6605">+22%</b>' }], ['RDS', { mono: '$1,082.40' }, { html: '+4%' }]] } },
    { kind: 'term', cwd: '~/vidshare/infra', steps: [
      { cmd: ['aws compute-optimizer get-ec2-instance-recommendations', "--query 'instanceRecommendations[].[currentInstanceType,finding]'", '--output text'],
        out: ['m5.4xlarge    <span class="er">Overprovisioned</span>'] },
      { cmd: 'aws ec2 describe-volumes --filters Name=status,Values=available', out: ['<span class="nu">2</span> unattached volumes · <span class="nu">1,500 GiB</span> still billed'] }] },
    { kind: 'code', file: 'lifecycle.tf', lines: [
      '<span class="f">transition</span> {', '  days          = <span class="n">30</span>', '  storage_class = <span class="s">"STANDARD_IA"</span>', '}',
      '<span class="f">transition</span> {', '  days          = <span class="n">90</span>', '  storage_class = <span class="s">"GLACIER_IR"</span>', '}'] }],
  chips: [{ text: 'Cost', cls: 'r' }, { text: 'Performance', cls: 'b' }, { text: 'Reliability', cls: 'g' }],
} });
