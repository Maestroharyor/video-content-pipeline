defineSlide({ slug: '43-terraform', template: 'code', data: {
  eyebrow: '02 · IaC', accent: 'b', h1: 'Infra<br>as <em>code</em>', file: 'main.tf',
  tiles: [{ icon: 'terraform', label: 'Terraform' }, { icon: 'pulumi', label: 'Pulumi' }],
  lines: [
    '<span class="k">resource</span> <span class="s">"aws_instance"</span> <span class="s">"api"</span> {',
    '  ami           = <span class="s">"ami-0c7217cdde317cfec"</span>',
    '  instance_type = <span class="s">"t3.large"</span>',
    '  count         = <span class="n">2</span>',
    '}',
    '<span class="k">resource</span> <span class="s">"aws_s3_bucket"</span> <span class="s">"videos"</span> {',
    '  bucket = <span class="s">"vidshare-videos"</span>',
    '}',
    '<span class="k">resource</span> <span class="s">"aws_cloudfront_distribution"</span> <span class="s">"cdn"</span> { <span class="c">…</span> }',
  ],
} });
