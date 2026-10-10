# AI shoved into every app (reveal cut)
## Cue sheet

Voiceover runtime 2:22.92 (transcribed with whisper.cpp medium.en from the phone recording's audio track; mis-heard words fixed by hand). 18 slides on the timeline.
Motion is word-timed: each row's Beats column maps elements to the spoken words that trigger them
(graphic leads its word by 0.10s, ^ phrase anchors by 0.30s, ! marks the hero that pulses during the hold); rows without beats use the 5s fraction schedule.
Push transition 0.4s; holds are ambient only. Render spec: 1080x1920 (vertical), 30fps, h264 crf 16 + AAC, burned-in captions.
This project is the **reveal cut**: the deck is full frame and opaque, and inside a `PROJECT.revealSets` window it fades out
completely so the talking-head A-roll carries the line, then fades back (`npm run dual`, the model is dns-resolution).
It replaces `ai-in-every-app-overlay`, where a fitted card sat in the lower half of every frame for the whole runtime.
Outro carries the audio bed: pops 1.50/2.10/2.70/3.30s, shimmer 4.30-5.02s (beats are ignored on audio-bed slides).

| # | File | VO window | Template | Eyebrow | Headline | Visual / data | Accent | Interaction | Beats | Line it covers |
|---|------|-----------|----------|---------|----------|---------------|--------|-------------|-------|----------------|
| 01 | 01-pushing-ai-on-us | 0:00.10-0:06.36 | title | Don't you get tired? | Every app is <em>pushing AI</em> on us. | badge "Everywhere" + chips Editors · Desktops · Browsers · Notes | violet | badge pops on "every single", chips on "app" / "nowadays" / "is just" | em:^"pushing AI" badge:^"every single"! k*:"app","nowadays","is just" | "Don't you guys get tired…" |
| 02 | 02-agentic-desktop | 0:06.36-0:15.64 | logos | The other day | Windsurf is becoming an <em>agentic desktop</em>. | tiles Windsurf · Devin · Claude Code; note "Agentic desktop"; sub "The main aim: orchestrate and manage agents." | violet | Windsurf pops on its name, Devin on "main aim", Claude Code on the second "agentic desktop", sub on "orchestrate" | t1:"Windsurf"! em:"agentic desktop" t2:"main aim" t3:"agentic desktop"#2 note:"able" sub:"orchestrate" | "The other day I made a video…" |
| 03 | 03-same-direction | 0:15.64-0:23.80 | compare | Same direction | Editors are turning into <em>agent managers</em>. | left "Cursor and friends" qt "Orchestrate agents" (Cursor icon) ≠ right "Sometimes" qt "I just need a code editor." | violet | left lands on "Cursor", right lights up on "just need" | l:^"same direction" i1:"Cursor" neq:^"I'm seeing" em:"code editors" r:^"sometimes"! | "The same direction Cursor went in…" |
| 04 | 04-dont-want | 0:23.80-0:30.99 | list (rowbar) | Not what I'm after | I <em>don't want</em> this. | rows ✗ Manage agents · ✗ AI pushed into my face; badge "You've seen them too" | rose | rows land as named, badge pops on "you probably" | em:"don't want" r*:"manage agents","pushed"! badge:^"you probably" | "I don't want to manage agents…" |
| 05 | 05-zed | 0:30.99-0:38.52 | title | Why I switched | <em>Zed</em>. AI inside, not in your face. | hero Zed logo tile; badge "Integrated, not pushed"; chips AI integration · Nothing shoved | green | logo pops on "Zed", chips on "integration" / "don't push" | badge:^"code editors" hero:"Zed"! em:"Zed"+0.35 k*:"integration","don't push" | "It's probably why I prefer…" |
| 06 | 06-cursor-autocomplete | 0:38.52-0:48.12 | code | Cursor, back then | What I loved: <em>autocomplete</em>. | editor mock app.ts, 4 lines with a ghost suggestion; tile Cursor; ok "Tab to accept the suggestion" | blue | lines reveal on "writing my code", ghost line on "autocomplete", Tab pill pops on "tab" | t1:"Cursor" code:^"I prefer"! l1:"writing" l2:"my code" l3:"giving me" ok:"autocomplete" | "The main reason I loved Cursor…" |
| 07 | 07-not-what-im-after | 0:48.12-0:55.34 | statement | Cursor today | Not what I'm <em>after</em>. | label "Useful for some"; quote "Agent-first editing" struck out; badge "Stopped using it" | rose | strike lands on "not what", badge pops on "stopped" | q:^"useful"! strike:"not what" em:"after" badge:^"major" | "And while that might be useful…" |
| 08 | 08-where-the-hype-is | 0:55.34-1:05.00 | list (rowbar) | And I get it | Companies go where the <em>hype</em> is. | rows Go where the hype is · Adopt every latest feature · Never look like you're lagging or losing | violet | rows land on "companies" / "adopt" / "lagging" | r*:"companies","adopt","lagging"! em:"hype" | "And I get it, I understand…" |
| 09 | 09-users-vs-investors | 1:05.00-1:11.32 | compare | At this point | Users out. <em>Investors</em> in. | left "Users" qt "What we have to say" (struck) ≠ right "Investors" qt "Impressed" | rose | left strikes on "care", right lights up on "investors" | l:^"it seems" strike:"care" neq:^"They are" em:"now" r:^"impressing"! | "But at this point…" |
| 10 | 10-sprinkle-vs-shoved | 1:11.32-1:23.29 | cards | Some of it could work | A sprinkle helps. <em>Shoved in</em> is tiring. | card "A sprinkle" tag "Could work" row "Where it helps: a bit" · card "Shoved in" tag "Tiring" row "Apps that don't need it: all" | rose | cards land as named, "Tiring" tag pops on "tiring" | c1:^"some AI" c1t:"could really" c1b1:"sprinkle" c2:^"but even"! c2b1:"need AI" em:"shoved" c2t:^"Which" | "There are some AI features…" |
| 11 | 11-web3-boom | 1:23.29-1:30.92 | logos | This reminded me | The <em>Web3</em> boom. | tiles Ethereum · Bitcoin · Solana; note "A few years back. Same thing." | amber | tiles pop on "Web3" / "crypto" / "boom", note on "similar" | em:"few years" t*:"Web3","crypto","boom" note:^"We had"! | "And this really reminded me…" |
| 12 | 12-everyone-web3 | 1:30.92-1:37.80 | statement | Back then | Everyone was talking about <em>Web3</em>. | label "Every meeting"; quote "We're going to rebuild our apps in Web3."; badge "Integrate Web3" | amber | quote rises on "Oh yes", badge pops on "integrate" | em:"Web3" q:^"Oh yes"! badge:^"we're"#2 | "Everyone started talking about Web3." |
| 13 | 13-clients-came | 1:37.80-1:48.99 | list (rowbar) | Even people who shouldn't care | Clients came with <em>one request</em>. | rows Shouldn't even be concerned · Wanted to build an app · Contracted the job to me; badge "One more thing…" | amber | rows land on "should not" / "build" / "contract", badge pops on "one of the things" | em:"lot of people" r*:"should not","build","contract"! badge:^"one of the" | "And even people that should not…" |
| 14 | 14-the-brief | 1:48.99-1:56.12 | list (chk) | The brief | "Maestro, we <em>need</em> this." | checks Web3 integration · Connect to the blockchain · One of our main features | amber | checks tick on "integration" / "blockchain" / "main features" | em:"need" r1:"Web3" ck1:"integration" r2:^"connect" ck2:"blockchain" r3:^"this is"! ck3:"one of" | "Oh yes, Maestro, we need to also have…" |
| 15 | 15-unnecessary | 1:56.12-2:02.12 | compare | My honest reaction | Really <em>unnecessary</em>. Built it anyway. | left "What I felt" qt "This is really unnecessary." ≠ right "What I did" qt "I'm being paid. I built it." | amber | left on "look at this", right on "But yeah" | l:^"look at" em:"unnecessary" neq:^"But yeah" r:^"I'm being"! | "And I would look at this…" |
| 16 | 16-it-settled | 2:02.12-2:10.04 | statement | And then | It <em>settled</em>. | label "Web3 today"; quote "Integrations when they're really needed."; badge "Not because everyone's talking" | green | quote rises on "we do", badge pops on "not just" | em:"settled" q:^"we do"! badge:^"not just" | "And I love the fact…" |
| 17 | 17-let-it-settle | 2:10.04-2:21.00 | list (chk) | So yeah | Not going anywhere. Now let it <em>settle</em>. | checks Not going anywhere · Still innovative · Settled · Saturated · Out of our throats | green | checks tick on "anywhere" / "innovative" / "settled" / "saturated" / "longer" | r1:^"AI is" ck1:"anywhere" r2:^"still" ck2:"innovative" em:^"can't wait" r3:^"settled" ck3:"settled" r4:^"saturated" ck4:"saturated" r5:^"and no"! ck5:"longer" | "So yeah, I know AI…" |
| 18 | 18-outro | 2:21.00-2:22.92 | outro | That's the rant | Like and <em>follow</em> for more. | personal handles Instagram · X · LinkedIn · TikTok (@maestroharyor / ayomide-odewale) + braandly.bio/ayomideodewale box; audio bed | violet | tiles pop, bed plays | – | "Like and follow for more." |

## Beat map
`npm run timeline -- --project ai-in-every-app --check`: 18 slides · 86 beats resolved · 0 errors · 1 warning (14's last tick lands on "one of our main features",
which ends the line, so it settles 0.43s before the exit — intended). 18 (outro) carries the audio bed, so its handles keep the bed's fraction schedule.
The overlay variant shares the cue sheet and vo.json; its timeline.json is identical (147s, 18 slides).

## Notes for the edit
- Timeline: 18 slides, 147.0s total (142.9s of voice + the outro tail), every start anchored to a word in vo.json (no estimated windows).
- Source: the audio track of IMG_9183.MP4 (vertical talking-head phone recording), extracted to vo.wav (mono 16kHz). Whisper mis-hearings fixed by hand in
  vo.json + transcript.txt: "pushing AI on us", "Windsurf becoming an agentic desktop", "now after impressing their investors", "shoved into there", "which is tiring",
  "it later settled", "shoved down people's throats".
- Standalone deck (`ai-in-every-app`): renders/final/ai-in-every-app.mp4 (1080x1920, 30fps, h264 + AAC, burned-in captions) + .srt.
- This project (`ai-in-every-app-reveal`, slides/assets/vo/captions symlinked from `ai-in-every-app`, aroll.mp4 symlinked from the
  overlay project): no `PROJECT.overlay` and no `grid` override, so every slide keeps its full-frame layout. `npm run dual` writes
  master A (renders/final/ai-in-every-app-reveal.mp4, the deck alone) and one B per cut.
- Long holds (02, 10, 13, 17) keep a settled end pose on purpose; 06 holds the finished editor mock for ~1s.
- Two rows split one long sentence: 13 (1:37.80–1:48.99, the clients) and 14 (1:48.99–1:56.12, the brief itself, starting on "Oh yes, Maestro").

## Design notes
- Accent language: violet = the AI push (main, eyebrows, outro) · rose = the annoyance (04, 07, 09, 10) · green = Zed / "when it's really needed" (05, 16, 17) ·
  amber = the Web3 flashback (11–15) · blue = the editor mock (06).
- UI mocked: a code editor with a ghost autocomplete suggestion and a Tab pill (code template, 06). No console/phone/dashboard named in the script.
- Logos (simple-icons, fetched by `npm run assets`): windsurf, cursor, zedindustries, ethereum, bitcoin, solana + instagram/x/tiktok/braandly for the outro.
- Outro: personal brand from core/brand.js (Instagram/X/TikTok @maestroharyor, LinkedIn ayomide-odewale, braandly.bio box, pop + shimmer bed);
  eyebrow "That's the rant", headline "Like and follow for more." On the overlay variant the outro is `full: true`: it covers the footage with the deck background instead of sitting in a pinned block.
- 03 reads `window.PROJECT.overlay` to omit its icon row on the overlay variant only; this project sets no `overlay`, so the row is drawn.

## Reveal cuts
Two sets in `project.js → revealSets`, picked with `npm run dual -- --reveals <name>`; the name goes into the filename. Every edge is an
exact slide boundary from timeline.json, so the deck leaves as a slide ends and returns as the next one starts building — a return inside a
slide's 0.4s push-exit would show that slide swimming up out of the footage just before it is replaced. A reveal covers the whole slide it
spans, so those slides appear only in master A. `in: 0` on the opening window: there is no deck before 0s to fade out.

| Window | tight | loose | Slide | The line it gives back to the camera |
|---|---|---|---|---|
| 0:00.00-0:06.36 | ● | ● | 01 | "Don't you guys get tired…" — the hook, straight to camera |
| 0:23.80-0:30.99 | ● | ● | 04 | "I don't want to manage agents or get AI pushed into my face." |
| 0:48.12-0:55.34 | | ● | 07 | "that is not what I'm after… one of the major reasons I stopped using it" |
| 1:05.00-1:11.32 | | ● | 09 | "they don't really care what users have to say… impressing their investors" |
| 1:30.92-1:37.80 | ● | ● | 12 | "Oh yes, we're going to rebuild our apps in Web3" — the impression |
| 1:56.12-2:02.12 | ● | ● | 15 | "This is really unnecessary." / "I'm being paid for the money." |
| 2:10.04-2:21.00 | ● | ● | 17 | the closing thesis, before the outro card |
| **face on screen** | **~37s (25%)** | **~51s (35%)** | | ramps are 0.45s each side |

Longest unbroken deck stretch: 60.0s in `tight` (0:31–1:31), 18.3s in `loose` (1:37.80–1:56.12).
Captions stay burned in through a reveal: the ramp fades the whole deck frame, so `scripts/dual-render.js` re-adds the caption band
from its own alpha capture (`capsOnly`) on top of every non-`full` chunk.
The outro's pop + shimmer bed reaches these masters through `PROJECT.cta.sfx` at 141s — `npm run dual` never calls assembleMp4, so
slide `audio` beds would otherwise be dropped, and the footage (142.25s) runs out before the deck (147s) does.
