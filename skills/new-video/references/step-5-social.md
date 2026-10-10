# Step 5 — Social copy

Only when the user asked for it. The video is finished; this turns it into copy they can paste, one body per
network, checked against each network's real limit. Markdown only: nothing is posted from here.

```bash
npm run social -- --project <slug> --rules                     # the rules you are writing against
npm run social -- --project <slug> --init --platforms <list>   # an empty field per network
npm run social -- --project <slug>                             # render + check → social/<slug>.md
npm run social -- --project <slug> --check                     # validate only, write nothing
```

## What the script does and does not do

It supplies the rules, counts every block and fails anything over a platform's hard cap. **It writes no copy.**
You write every word into `social/<slug>.json`, one body per network, and `social/<slug>.md` is rendered from
it. Editing the markdown is pointless: the next run overwrites it.

Exit 1 on: over a hard cap, an unknown platform or field key, an empty field, malformed JSON. Nothing is
written when it exits 1.
Exit 0 with `warn` on: over the soft target, a link where the network does not want one, a hashtag count off
the guidance, a `#` inside a body, alt text missing or over 100.

## Writing it

**Read:** [social-writing.md](social-writing.md), and load the `brand-voice` skill.

The source is `transcript.txt` for what was actually said and `cue-sheet.md` for the structure, the dates and
the numbers that were already checked. Look at two or three posters to see what the viewer sees.

No timestamps or chapter list in the YouTube description unless the user asks, and never on a Short.

Write in this order: LinkedIn, Instagram, TikTok, X, WhatsApp, then the YouTube description. Longest first,
because the short ones are cuts of a real argument and never the other way round. The YouTube description is a
teaser, not the argument: the problem and the stakes, never the answer, then a links block (watch-next videos,
the subscribe link, the socials). Research the YouTube title before writing it (the social-copy skill, Step 3).
Hashtags go in `hashtags[]` only.

Fill in `link.url` with the published URL when there is one, or leave it empty and say so in the summary.

## Reading the Checks block

`ok` needs nothing. `warn` is advisory and each one is either fixed or explained to the user in one sentence.
`⚠ OVER` cannot ship: the block is over the network's hard cap and the run exited 1.

## Deliverables

- `projects/<slug>/social/<slug>.json` — the copy, editable, re-renders at any time
- `projects/<slug>/social/<slug>.md` — what the user reads and pastes

## Gate

`npm run social -- --project <slug>` exits 0 with zero `⚠ OVER`, and no two networks share a body.

## Summarise for the user

- Where the file is, and which networks it covers
- Anything above a soft target and why it stays
- Any number in the copy that could not be traced to the transcript
- Whether the link is real yet
