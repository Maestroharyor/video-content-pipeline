# Research: what the shelf already owns

## The scrape
`npm run yt-research -- --out projects/<slug>-thumbs/research --min-age 0 --queries "…" --channels "…"`

- **Queries (8-10)**: the searches a viewer of THIS video types: the story's names (product, company, person), the
  generic question ("is software dead"), the format words ("vibe coding clone app"). Pull them from the video title and the
  cue sheet's first rows. `--queries` is required: the script has no defaults.
- **Channels (6-8)**: the channels that cover this topic plus the nearest competitors, and `@lifetechfacts` (our own baseline).
  A handle that returns 0 cards is wrong: drop it.
- `--min-age 0` for news (the topic is days old); keep the default 21 for evergreen topics, or the winners are just new uploads.

Outputs in `research/`:
| File | What it is |
|---|---|
| `data.json` | every card: views/day, the channel median, `outlier` = views/day ÷ the channel's median (a CTR proxy, not CTR) |
| `top-480.png` / `-210.png` | the 60 biggest outliers on these channels (a thumbnail that out-pulled its own audience) |
| `control-480.png` / `-210.png` | the 60 smallest: same channels, the misses. A trait only matters if winners have it and misses don't |
| `topic.txt`, `topic/`, `topic-480.png` | the 24 biggest search results for the queries, any age: the shelf this video sits on |

## Reading it
Look at `topic-480.png` first, at full size and at 210 px:
1. **The formats the topic already owns** (e.g. logo → clone logo, doom words, shocked faces). Ours must not be a fourth copy.
2. **The angle nobody draws**: usually the video's own spine (its thesis or central metaphor).
3. **Faces**: on how many of the top 10, and what expression. Faceless winners win on proof (a real logo, a real page).
4. **Grounds**: the dominant colours. Pick a ground that stands apart (the video's theme usually does).
5. **Words**: how many, what register (questions, verdicts, numbers). A phrase the press already uses is a ready-made hook.
6. **Titles**: the search phrase in the first ~35 characters; the hook word in the thumbnail, not repeated from the title.

Then a WebSearch pass for the story's own phrasing (news headlines, forum titles), and a quick check that
best-practices.md still matches YouTube's help pages.

## findings.md sections
`# <video> thumbnails: what the niche is doing (<date>)` · the scrape (queries, channels, counts) · **The top of the topic**
(table: views/day, channel, what the thumbnail does) · **What it says** (the bullets above, each with evidence) · **The
candidates** (directions × hooks, each tied to a bullet) · later: **Revision N** (what the user changed and why).
