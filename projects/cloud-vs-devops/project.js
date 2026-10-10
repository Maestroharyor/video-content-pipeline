/* Project settings. Read by the deck (in the browser) and by the renderer (in Node). */
window.PROJECT = {
  slug: 'cloud-vs-devops',
  title: 'Cloud Engineer vs DevOps Engineer',
  canvas: 'horizontal',         // 1920x1080 CSS stage; 4k scales the capture, never the layout
  resolution: '4k',             // 3840x2160
  fps: 60,
  theme: 'lanes',               // core/styles/lanes.css (stage gets .theme-lanes): two swimlanes, sky = cloud, ember = DevOps
  dur: 5,                       // fallback motion seconds; every row is beat-timed off the voiceover
  hold: 1,
  maxSize: '4G',                // ~9 minutes of 4K60: a 2 GB budget would cap the bitrate near 30 Mbps
  // Captions off: YouTube draws its own caption box over the bottom of the frame. The .srt still ships.
  captions: { on: false },
  // Headlines here are two short phrases ("Servers on / EC2"); the strata deck's slightly wider, smaller column
  // keeps "The software / developer" on two lines.
  grid: { h1W: 660, h1Size: 68 },
  // Layout experiment (--var layout=top): heading centred across the top, content centred in a wide column under it.
  // core/grid.js applies PROJECT.grid before the stage class is set, so the geometry swap lives here.
  layout: (window.VARS && window.VARS.layout) || 'top',
  bg: { drift: 1 },
  drift: { min: 20, amt: .025 },   // slow push-in on scenes held 20s+ (core/components/fx.js)
  // Centre each slide's content block (and its heading) in the 84-870 safe band: most rows here are one pane or two
  // lanes, and top-anchored they left the lower half of the frame empty (core/registry.js, vcenter).
  vcenter: true,
  // LifeTech Facts, not the personal brand: the intro and end screen are the channel's, so the outro handles are too.
  // core/brand.js merges shallowly, so the handles are given in full here.
  brand: {
    accent: 'b',
    handles: [
      { icon: 'youtube', handle: '@lifetechfacts', net: 'YouTube' },
      { icon: 'instagram', handle: '@lifetechfacts', net: 'Instagram' },
      { icon: 'facebook', handle: '@lifetechfacts', net: 'Facebook' },
    ],
    box: null,
    outro: { eyebrow: 'Thanks for watching', h1: 'Like, share,<br><em>subscribe</em>' },
  },
  social: {
    brand: 'lifetechfacts',
    name: 'LifeTech Facts',
    voice: 'Tech insights for builders, founders and career-driven people. Accessible without being shallow, '
      + 'grounded, explains the why. Never tutorial-voice, never hype.',
    links: { bio: '' },
  },
  // The channel intro, cut in after the hook rather than in front of it: 25.51s is the end of the second question
  // ("…so everything can run smoothly?") and the start of s06, a slide boundary. 04 commit was picked because the
  // video is about shipping code: a git graph merging into the logo. The end screen is the matching plate.
  // No CTA overlay here: `cta` only carries the sound-effects track (projects/cloud-vs-devops/sfx.js builds it from the
  // timeline's beats). It starts at 0 and runs the whole deck; dual-render gives each side of the splice its slice.
  cta: { sfx: 'assets/sfx.wav', sfxAt: 0, gain: 0.7 },
  // npm run sfx: no whoosh into the map scenes that continue each other, ticks on the check-box lanes, a thump on the failed deploy
  sfx: { noRise: ['11', '12'], tick: ['17', '23', '28', '30'], thump: [{ slide: '21', beat: 's5' }] },
  splice: {
    at: 27.55,
    head: '~/Downloads/Localsend/Edited/Video Elements/LifeTech Facts intros and end screens/04-D-commit.mp4',
    tail: '~/Downloads/Localsend/Edited/Video Elements/LifeTech Facts intros and end screens/end-screen/04-D-commit-end-screen.mp4',
  },
  probe: {
    sel: ['.ln-lane', '.ln-item', '.ln-mid', '.ln-chip', '.tm-win', '.pl-st', '.pl-log', '.pl-rb'],
    deep: ['.ln-lane', '.tm-win', '.pl-log'],
    clip: ['.ln-item', '.ln-chip', '.pl-st .sn'],
  },
  assets: {
    aws: ['ec2', 's3', 'cloudfront', 'vpc', 'rds', 'cost-explorer', 'ec2-instance', 'elb', 'ecr', 'internet-gateway'],
    brands: ['youtube', 'googlecloud', 'digitalocean', 'docker', 'terraform', 'kubernetes', 'pulumi', 'githubactions',
      'jenkins', 'ansible', 'linux', 'github', 'prometheus', 'grafana', 'instagram', 'facebook'],
    urls: {},                   // azure.svg + oracle.svg are in assets/ already (official packs, see assets/SOURCES.md)
  },
  /* The same deck on the 9:16 canvas, for the social cuts (npm run assemble -- --project cloud-vs-devops --variant vertical
     → renders/vertical/final/cloud-vs-devops-vertical.mp4; the cuts themselves live in social/). Laid over the settings
     above; the templates switch to their vertical geometry on .canvas-vertical and slides carry data.v overrides. */
  vertical: {
    canvas: 'vertical', resolution: '1080p', fps: 30, maxSize: '2G', layout: null,
    // the social cut burns captions into 1600-1760, so every slide ends above safe.b 1560. Templates lay out in an 800px
    // column (cw) and core/registry.js scales the block up to the real 960 (vfit), so type reads at phone size
    grid: { h1Size: 80, h1W: 960, cy: 400, cw: 800, mapTop: 410, footY: 1470, safe: { l: 58, r: 1022, t: 96, b: 1560 } },
    vfit: { w: 960, max: 1.5, pad: .04 },   // pad: drift grows long scenes 2.5% about the centre
    vcenter: true,
    cta: null,                  // the cuts take their audio (voice + effects) from the master, not from this render
  },
};
// base (16:9) geometry only: a variant brings its own grid (window.VARIANT in the renderer, ?variant= in the preview)
const vcdVariant = window.VARIANT || (typeof location !== 'undefined' && new URLSearchParams(location.search).get('variant'));
if (window.PROJECT.layout === 'top' && !vcdVariant) {
  window.PROJECT.grid = { ebY: 70, h1Y: 108, h1W: 1800, h1Size: 64, cx: 190, cy: 230, cw: 1540, ch: 640 };
  window.PROJECT.vcenter = 'both';
  if (typeof document !== 'undefined') document.getElementById('stage').classList.add('layout-top');   // #stage precedes project.js; Node reads this file too
}
