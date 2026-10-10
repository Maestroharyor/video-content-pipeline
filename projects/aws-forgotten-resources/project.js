/* Project settings. Read by the deck (in the browser) and by the renderer (in Node). */
window.PROJECT = {
  slug: 'aws-forgotten-resources',
  title: 'AWS resources you forget to turn off',
  canvas: 'vertical',
  fps: 60,
  resolution: '2k',             // vertical: '2k' (1440x2560) | '1080p' (1080x1920); --res overrides for one render
  dur: 5,
  hold: 1,
  captions: { on: false },      // no voiceover recording in the repo → no burned-in captions
  bg: { drift: 1 },
  brand: {},
  assets: { aws: ['ec2', 'rds', 'ebs', 's3', 'vpc', 'cost-explorer', 'billing', 'nat-gateway', 'internet-gateway', 'ec2-instance', 'ebs-volume'],
            brands: ['docker', 'python', 'ubuntu', 'linux', 'git', 'nginx', 'postgresql', 'mysql'] },
};
