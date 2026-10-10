defineSlide({ slug: '38-rightsizing', template: 'term', data: {
  eyebrow: '02 · Costs', accent: 'r', h1: 'Too big,<br><em>unused</em>', cwd: '~/vidshare/infra',
  steps: [{ cmd: ['aws compute-optimizer get-ec2-instance-recommendations', "--query 'instanceRecommendations[].[currentInstanceType,finding]'", '--output text'],
      out: ['m5.4xlarge    <span class="er">Overprovisioned</span>', 'r5.2xlarge    <span class="er">Overprovisioned</span>'] },
    { cmd: ['aws ec2 describe-volumes --filters Name=status,Values=available', "--query 'Volumes[].[VolumeId,Size]' --output text"],
      out: ['vol-0a91c3e5f2b7d4e18    <span class="nu">500</span>', 'vol-06d2b8f4a1c9e7305    <span class="nu">1000</span>'] }],
} });
