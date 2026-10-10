/* Saved brand defaults (outro handles, link-in-bio box, audio bed). A project overrides any field via PROJECT.brand. */
window.BRAND = Object.assign({
  accent: 't',
  handles: [
    { icon: 'instagram', handle: '@maestroharyor', net: 'Instagram' },
    { icon: 'x', handle: '@maestroharyor', net: 'X' },
    { text: 'in', color: '#0A66C2', handle: 'ayomide-odewale', net: 'LinkedIn' },
    { icon: 'tiktok', handle: '@maestroharyor', net: 'TikTok' },
  ],
  box: { icon: 'braandly', title: 'Everything in one place', url: 'braandly.bio/ayomideodewale' },
  // resolved by the renderer: project dir → project assets → assets/audio. 'outro.wav' = the pop + shimmer bed;
  // 'outro-music-tropicorp.wav' = 9s of CC0 music (assets/SOURCES.md). With npm run dual, set PROJECT.sfx.outroBed too.
  audio: 'outro.wav',
  outro: { eyebrow: 'That\'s the list', h1: 'Follow for more.' },
}, (window.PROJECT && window.PROJECT.brand) || {});
