# Asset sources

| File | Source | Notes |
|------|--------|-------|
| assets/fonts/Inter*.woff2 | https://rsms.me/inter/ | Inter / Inter Display 4.x (SIL OFL 1.1) |
| assets/fonts/JetBrainsMono-*.woff2 | https://www.jetbrains.com/lp/mono/ | JetBrains Mono (SIL OFL 1.1) |
| assets/fonts/OpenSans-Variable.ttf | https://github.com/googlefonts/opensans | Open Sans variable (SIL OFL 1.1). Used inside the AWS console mock (Cloudscape uses Open Sans; Amazon Ember is not redistributable). |
| assets/logos/brands/instagram.svg | https://simpleicons.org/?q=instagram | simple-icons npm package (outro handle tile) |
| assets/logos/brands/x.svg | https://simpleicons.org/?q=x | simple-icons npm package (outro handle tile) |
| assets/logos/brands/tiktok.svg | https://simpleicons.org/?q=tiktok | simple-icons npm package (outro handle tile) |
| assets/logos/brands/braandly.svg | https://braandly.bio | braandly mark (link-in-bio box in the outro) |
| (LinkedIn) | https://brand.linkedin.com/ | Not downloaded: simple-icons does not ship the LinkedIn mark. Rendered as an "in" text tile in #0A66C2. |
| assets/logos/lifetechfacts/*.svg, geometry.json, lf-logo.js | channel owner's Logo.png (5510 px, upscaled from ~380 px of real detail) | LifeTech Facts mark rebuilt as vectors: disc, orbit ring and balls are circles fitted to the PNG; the LT/F monogram is measured straight edges + one fitted cubic per corner (rms 0.07% of the mark). `lf-mark.svg` keeps the soft inner rim shadow, `lf-mark-flat.svg` omits it. Wordmark = outlines of Oswald Light ("LIFE", https://github.com/googlefonts/OswaldFont) + Anton ("TECHFACTS", https://github.com/google/fonts/tree/main/ofl/anton), both SIL OFL 1.1, the closest open match to the original wordmark; no font file is shipped. `lf-logo.js` (window.LF) embeds the same numbers for the intro slides. |
| assets/logos/lifetechfacts/build-sting.js | written for this repo | Builds each intro's lf-intro-sting.wav from its assets/sting.json: ffmpeg-synthesised ticks, blips, thumps and noise swells + assets/audio/pop.wav, shim.wav + the project's Mixkit whoosh. No downloaded audio of its own. |
| assets/audio/outro.wav, pop.wav, shim.wav | own recording | Outro audio bed (pops + shimmer) |
| assets/audio/outro-music-tropicorp.wav | https://freesound.org/people/code_box/sounds/561190/ ("Tropicorp Advertisement" by code_box, via Openverse) | CC0 1.0 public domain dedication, verified on the Freesound page 2026-10-02: commercial use allowed, no attribution required. First 9s of the HQ preview, loudnorm -11 LUFS / -1 dBTP (to match the uploaded shorts' endings), 0.4s fade in, 1.5s fade out. Outro music option: PROJECT.brand.audio = 'outro-music-tropicorp.wav' |
| assets/logos/aws/*.svg | https://aws.amazon.com/architecture/icons/ | AWS Architecture Icons, fetched on demand by projects that list them (project.js → assets.aws); see each project's SOURCES.md |
| assets/logos/brands/*.svg (others) | https://simpleicons.org | simple-icons marks fetched on demand by projects (project.js → assets.brands) |

AWS Architecture Icons are provided by Amazon Web Services under the terms on the icons page (use to depict AWS architecture; do not alter the marks).
Brand marks from simple-icons are trademarks of their respective owners.
| assets/fonts/KoHo-Bold.ttf, KoHo-SemiBold.ttf | https://github.com/google/fonts/tree/main/ofl/koho (Cadson Demak) | SIL OFL 1.1. Optional headline font for the LifeTech Facts thumbnails (`--var font=koho`, `lf-thumb.js`). |
| assets/fonts/Newsreader-Variable.woff2 | https://fonts.google.com/specimen/Newsreader (Production Type; gstatic latin subset, opsz 6-72, wght 500-800, fetched 2026-10-22) | SIL OFL 1.1. Serif headlines for the broadsheet look trial (projects/php2shell). |
| assets/logos/glyphs/windows.svg, csharp.svg | drawn for this repo | **Not brand marks.** simple-icons no longer ships the Microsoft Windows or C# logos, and a column reading icon-plus-label next to five that do looks broken. These are original generic glyphs, a framed four-pane window and a C beside a sharp sign, deliberately unlike the trademarks they stand in for. Reference them with `{ icon: 'windows', brand: 'glyphs' }`; `logo(name, folder)` takes any folder under assets/logos. |
| assets/fonts/Anton-Regular.woff2 | https://github.com/googlefonts/AntonFont (via `@fontsource/anton@5.3.0` on npm) | SIL OFL 1.1. The heavy condensed display cut for the stacked-type thumbnails; Inter Display Black is too wide to stack three words tall in a 1280x720 frame. Extracted from the package tarball; not added as a dependency. |
| assets/fonts/Caveat-Bold.woff2 | https://github.com/googlefonts/caveat (via `@fontsource/caveat@5.3.0` on npm) | SIL OFL 1.1. Marker hand for thumbnail annotations. |
| assets/fonts/PermanentMarker-Regular.woff2 | https://github.com/google/fonts/tree/main/apache/permanentmarker (via `@fontsource/permanent-marker@5.3.0` on npm) | Apache 2.0. The heavier marker hand; the two are A/B'd against each other on the annotated-object thumbnails. |

## Sound effects: Kenney UI packs (CC0)
- assets/audio/sfx/ki-*.wav: Kenney "Interface Sounds" 1.0 (100 files), CC0 1.0, https://kenney.nl/assets/interface-sounds,
  WAV conversion from https://github.com/Calinou/kenney-interface-sounds (lossless), downloaded 2026-10-11.
- assets/audio/sfx/ku-*.wav: Kenney "UI Audio" (50 files), CC0 1.0, https://kenney.nl/assets/ui-audio,
  WAV conversion from https://github.com/Calinou/kenney-ui-audio, downloaded 2026-10-11. Credit not required (Kenney.nl).
