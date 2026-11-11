/* The vertical social cuts of cloud-vs-devops, inside the video's own project. index.html (and renderer/project.js in
   Node) runs ../project.js first, so this starts from the video's settings, takes its `vertical` block (the 9:16 grid,
   vfit, 1080p30) and changes only what a cut needs. slides/ links the video's slides plus core/social's hook and end
   card; scripts/social-cut.js builds each cut's deck from ../cue-sheet.md on the cut's own words and rewrites
   timeline.json / vo.json / captions.json in THIS folder, never the video's.
     npm run social-cut -- --project cloud-vs-devops/social --plan | --cut best-of [--preview]
   Output: renders/social/<cut>/cloud-vs-devops-social-<cut>.mp4 */
window.PROJECT = Object.assign({}, window.PROJECT, window.PROJECT && window.PROJECT.vertical, {
  slug: 'cloud-vs-devops-social',
  title: 'Cloud Engineer vs DevOps Engineer (social cuts)',
  hold: 0,                      // the cut ends on its last word, not on a held frame
  captions: { on: true },       // burned into the text pass; the deck pass renders with --captions off
  resolution: '4k', fps: 60, crf: 10,   // 2160x3840 at 60fps (YouTube's top bitrate tier), crf 10 on every pass (the user's call, 2026-10-30)
  cta: null, splice: null,      // the audio (voice + effects) comes from the 4K master, spliced intro skipped by cuts.json
});
delete window.PROJECT.vertical;   // already applied; core/grid.js must not lay it over this file's settings again
if (typeof document !== 'undefined') document.getElementById('stage').classList.remove('layout-top');   // ../project.js adds it for 16:9
