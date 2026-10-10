# APP UX #5 — Cursor-based pagination
## Cue sheet

Voiceover runtime 1:50. Twenty slides, each 6.00s (5.00s motion + 1.00s static hold on the final frame).
Deck total 2:00, so there is roughly 10s of slack to absorb in the edit.

Render spec: 1080x1920, 20fps. MP4 at full resolution (h264, crf 19). GIF at 540x960.
Slide 20 carries an AAC audio bed: pops at 1.50s / 2.10s / 2.70s / 3.30s, shimmer sweep 4.30-5.02s.

| # | File | VO window | Line it covers |
|---|------|-----------|----------------|
| 01 | 01-title-cursor-pagination | 0:00-0:07 | "the number five way ... is by implementing what we call cursor-based pagination" |
| 02 | 02-never-load-everything | 0:07-0:17 | "you have a list of transactions or activity. You never load everything at once" |
| 03 | 03-backend-returns-cursor | 0:17-0:22 | "the results from your backend returns a cursor, which lets your app know the last point the user saw" |
| 04 | 04-cursor-beats-offset | 0:22-0:26 | "I prefer cursors over offsets for large or frequently changing datasets" |
| 05 | 05-unbounded-lists | 0:26-0:31 | "this applies anytime a list grows unbounded" |
| 06 | 06-example-fintech | 0:31-0:34 | "transaction history in a fintech app" |
| 07 | 07-example-social-feed | 0:34-0:36 | "activity feed or social feed in a social media app" |
| 08 | 08-example-saas-audit-log | 0:36-0:39 | "an audit log or activity timeline in a SaaS tool" |
| 09 | 09-example-notifications | 0:39-0:40 | "could even be your notification history" |
| 10 | 10-example-ecommerce-scroll | 0:40-0:46 | "infinite scroll product listings in an e-commerce app" |
| 11 | 11-other-pagination-types | 0:44-0:51 | "yes, I know there are other types of pagination which could also be helpful" |
| 12 | 12-not-infinite-scroll | 0:46-0:51 | "cursor-based pagination is not really the same as infinite scrolling" |
| 13 | 13-cursor-plus-infinite-scroll | 0:51-1:02 | "you can use cursor-based pagination from your backend to implement infinite scrolling on your frontend" |
| 14 | 14-stays-fast-any-depth | 1:02-1:07 | "your list always stays fast, no matter how much the user scrolls" |
| 15 | 15-query-jumps-straight-there | 1:07-1:17 | "the query is much more efficient because it jumps straight to the next page" |
| 16 | 16-no-skipped-or-duplicate-rows | 1:17-1:22 | "when new items arrive on top, you don't get skipped or duplicated rows" |
| 17 | 17-sql-keyset-pagination | 1:22-1:34 | "you could use keyset pagination in SQL ... where id is lesser than last seen id, limit 20" |
| 18 | 18-mongodb-id-cursor | 1:34-1:39 | "you could use ID-based cursor in MongoDB paired with infinite scroll" |
| 19 | 19-frontend-url-param | 1:39-1:45 | "let's say SvelteKit, React, you could pass the cursor as URL param into the load function" |
| 20 | 20-outro-follow | 1:45-1:50 | "follow for more" |

## Notes for the edit

Slides 11 and 12 overlap in the table because the "before you say anything" aside and the
"not the same as infinite scrolling" correction run together in the read. If the pacing feels
tight there, slide 11 can be trimmed to about 4s: its motion resolves by t=0.76.

Slides 06 through 10 are the fastest run in the script (roughly 2s each against a 6s clip).
Two options: cut into each clip mid-motion around t=0.45 where the list has already populated,
or hold 06 and 10 full and speed through 07, 08, 09.

## Design system

- Background #0A0E18, panels #111A2B, borders #23304A
- InterDisplay for headlines, Inter for body, JetBrains Mono for code and cursor tokens
- Locked grid: eyebrow y=132, headline y=206, content y=455, footnote y=1740
- Colour language for this part: teal = cursor / next page, violet = the cursor token itself,
  rose = offset problems, green = rows delivered correctly, amber = scanning, blue = dashboard UI
- Phone device 672x1221 with a pinned header and a real scrolling list region
- Dashboard 960x720, light mode, six-row viewport with a measured scroll distance
