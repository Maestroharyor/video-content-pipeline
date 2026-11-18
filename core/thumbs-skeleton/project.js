/* Project settings. Read by the deck (in the browser) and by the renderer (in Node).
   Candidate YouTube thumbnails for `__VIDEO__` ("__TITLE__"). Made by npm run thumb-new; the flow is /new-thumbnail
   (skills/new-thumbnail/SKILL.md). Every slide is a still: draft with ./render.sh, export with npm run thumb, check
   with npm run thumb-check. --var v=1|2 (the hook) · --var face=<cutout>|off (assets/faces) · KoHo only.
   Drawn in the video's own look (house rule: the ground comes from the video's theme). Held to research/findings.md. */
window.PROJECT = {
  slug: '__SLUG__',
  title: '__TITLE__ thumbnails',
  canvas: 'horizontal',
  resolution: '4k',
  fps: 60,
  dur: 1,
  hold: 0,
  captions: { on: false },
  bg: { drift: 0 },
  brand: {},
  thumbs: { font: 'koho' },
  assets: { aws: [], brands: [], urls: {} },
  // the hook is .pt-title; the ground, the channel mark and the face cutout (it bleeds off the edge by design) are exempt
  probe: { deep: ['.pt-title'], thumbSkip: ['.pt-mark', '.pt-ground', '.pt-face'] },
};
