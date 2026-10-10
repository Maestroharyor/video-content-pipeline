defineSlide({ slug: '29-s3', template: 'term', data: {
  eyebrow: '02 · Storage', accent: 'b', h1: 'Videos in<br><em>S3</em>', cwd: '~/vidshare',
  steps: [{ cmd: 'aws s3 mb s3://vidshare-videos', out: ['make_bucket: vidshare-videos'] },
    { cmd: 'aws s3 cp launch.mp4 s3://vidshare-videos/raw/', out: ['upload: ./launch.mp4 to s3://vidshare-videos/raw/launch.mp4'] }],
  sub: 'Large files go to object storage, not onto the application servers.',
} });
