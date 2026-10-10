defineSlide({ slug: '28-ec2', template: 'term', data: {
  eyebrow: '02 · Compute', accent: 'b', h1: 'Servers on<br><em>EC2</em>', cwd: '~/vidshare/infra',
  steps: [{ cmd: ['aws ec2 run-instances --image-id ami-0c7217cdde317cfec', '--instance-type t3.large --count 2',
      "--query 'Instances[].[InstanceId,State.Name]' --output text"],
    out: ['i-0f3c9a7e2b1d4c8a5    <span class="wn">pending</span>', 'i-07b1e44c2d9a3f610    <span class="wn">pending</span>'] }],
  sub: 'Two virtual servers for the back end, provisioned from the CLI.',
} });
