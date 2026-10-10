defineSlide({ slug: '10-aws-compute-storage', template: 'map', data: {
  eyebrow: 'Cloud engineer · Building on AWS', accent: 'b', h1: 'Servers on <em>EC2</em>, videos in <em>S3</em>',
  slots: { users: 'e', cdn: 'e', ec2: 'F', db: 'e', s3: 'F' }, edges: { 1: 'pre', 4: 'pre', 5: 'pre', 6: 'pre' },
  cams: [{ x: 1080, y: 262, z: 1.3, ax: 1180 }, { x: 1080, y: 405, z: 1.05, ax: 1150 }],
  term: { x: 0, y: 300, w: 760, cwd: '~/vidshare/infra', steps: [
    { cmd: ['aws ec2 run-instances --image-id ami-0c7217cdde317cfec', '--instance-type t3.large --count 2'], out: ['<span class="ok">i-0f3c9a7e2b1d4c8a5</span>  pending', '<span class="ok">i-07b1e44c2d9a3f610</span>  pending'] },
    { cmd: 'aws s3 cp launch.mp4 s3://vidshare-videos/raw/', out: ['upload: ./launch.mp4 to s3://vidshare-videos/raw/launch.mp4'] }] },
  // vertical canvas (--variant vertical and the social cuts): positions for the 1080x1920 stage
  // (only EC2 and S3, the two parts the line names: the whole portrait map would sit under the terminal)
  v: { slots: { users: 'hide', cdn: 'hide', db: 'hide' }, term: { x: 0, y: 560, w: 800 },
    cams: [{ x: 295, y: 850, z: 1.5, ax: 480, ay: 200 }, { x: 295, y: 850, z: 1.35, ax: 480, ay: 220 }] },
} });
