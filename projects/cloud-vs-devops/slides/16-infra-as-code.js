defineSlide({ slug: '16-infra-as-code', template: 'bench', data: {
  emoji: [{ e: 'weary_face', x: 1300, y: 165, size: 120 }, { e: 'high_voltage', x: 560, y: 730, size: 110 }],
  eyebrow: 'Cloud engineer · Infrastructure as code', accent: 'b', h1: 'Infrastructure <em>as code</em>',
  windows: [
    { kind: 'console', console: { service: 'EC2', crumb: ['EC2', 'Instances', 'Launch an instance'], nav: ['Dashboard', { grp: 'Instances' }, 'Instances', 'Launch templates'], active: 2,
      title: 'Launch an instance', buttons: ['Cancel'], primary: 'Launch instance', cols: [{ l: 'Step', w: 3 }, { l: 'Setting', w: 5 }],
      rows: [['1', 'Name and tags'], ['2', 'AMI · Instance type'], ['3', 'Key pair · Network'], ['4', 'Storage · Review']] } },
    { kind: 'code', file: 'main.tf', lines: [
      '<span class="k">resource</span> <span class="s">"aws_instance"</span> <span class="s">"api"</span> {', '  instance_type = <span class="s">"t3.large"</span>', '  count         = <span class="n">2</span>', '}',
      '<span class="k">resource</span> <span class="s">"aws_s3_bucket"</span> <span class="s">"videos"</span> {', '  bucket = <span class="s">"vidshare-videos"</span>', '}',
      '<span class="k">resource</span> <span class="s">"aws_cloudfront_distribution"</span> <span class="s">"cdn"</span> { <span class="c">…</span> }',
      '<span class="k">resource</span> <span class="s">"aws_db_instance"</span> <span class="s">"main"</span> { <span class="c">…</span> }'] },
    { kind: 'term', cwd: '~/vidshare/infra', steps: [
      { cmd: 'terraform plan', out: ['Plan: <span class="ok">9 to add</span>, 0 to change, 0 to destroy.'] },
      { cmd: 'terraform apply -auto-approve', out: ['<span class="ok">Apply complete! Resources: 9 added, 0 changed, 0 destroyed.</span>'] }] }],
  strike: 1, chips: [{ text: 'Terraform', cls: 'v' }, { text: 'Pulumi', cls: 'v' }],
} });
