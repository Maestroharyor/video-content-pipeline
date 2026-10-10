# Writing the copy

Canonical copy: `image-content-pipeline/skills/social-copy/references/writing-rules.md`.
The two pipeline skills carry a duplicate as `references/social-writing.md`; change this one and copy it over.

## 1. The job

`scripts/social.js` supplies the rules, counts every block and fails anything over a platform's hard cap.
It writes no copy at all. You write every word, into `social.json`, one body per network.

Nothing here is assembled from fields. If a block could have been produced by string concatenation from a
headline and a list of items, it is not finished. If two networks end up with the same body, one of them was
not written.

Load the `brand-voice` skill before you start. It is the reference for how this account sounds and what each
brand stands for, and it outranks anything in this file where the two disagree.

## 2. The bar

Same idea, six pieces of writing. This is a real set, abbreviated, with the lengths it actually hit.

**YouTube title** (56)

```
Monolith vs Microservices: It's an Org Chart Problem
```

**YouTube description** (~600). A teaser: the problem and the stakes, never the answer. Then links, then tags.

```
Monolith versus microservices gets argued as a tech debate. It isn't one, and the teams that pick wrong
usually find out from their Slack threads, not their dashboards.

Braandly is still a monolith. This is why.

Try Braandly with your team: https://braandly.com
Everything in one place: https://braandly.bio/ayomideodewale

#Microservices #Monolith #SoftwareArchitecture #SystemDesign #BuildInPublic
```

**LinkedIn** (~1800). Same idea, professional consequence, and it closes by asking for a decision rule.

```
Monolith versus microservices isn't really a technical decision. It's an organizational one wearing a
technical costume.

The case for microservices is real. Independent deploys so teams stop blocking each other. [...]

What the diagrams leave out is that complexity doesn't shrink when you split. It relocates. It comes out of
the codebase, where it lives in files you can open and refactor, and moves into contracts between teams,
release ordering, and on-call rotas. None of that lives anywhere you can edit.

Before you split, you should be able to name the team that owns each side, the thing that actually can't
scale, and the deploy that keeps getting blocked. If you can't name all three, the monolith is still buying
you runway.

#SoftwareArchitecture #Microservices #EngineeringLeadership #SystemDesign #BuildInPublic
```

**Instagram** (~800). The personal version. Shorter paragraphs, no link, five tags after the separator.

**TikTok** (~450). Opens on the sharpest line in the set, then three short paragraphs. Sentence case and
ordinary punctuation, never all lower case. It is written, not texted.

```
Microservices don't reduce complexity. They move it.

Out of your code, where you can actually refactor it, and into Slack threads between four teams arguing
about who deploys first. [...]

#Microservices #SoftwareEngineering #SystemDesign #TechTok #BuildInPublic
```

**X** (262, counted before sending), plus an alternate at 263 that takes the product angle instead of the
general one. Not a shortened version of the same sentence: a different entry point.

**WhatsApp status** (122). One thought, as you would text it.

```
Microservices don't reduce complexity. They move it out of your code and into Slack threads between teams.
New video is up.
```

Read that set again before writing. The lengths are not the point; the fact that no two of them open the same
way is the point.

## 3. Reading the source

Read the item before you write a word, and read it properly.

- **Video project**: `transcript.txt` for what was actually said, and `cue-sheet.md` for the structure, the
  dates and the numbers that were checked on the way in. Look at two or three posters to see what the viewer
  sees. Knowing the answers is how you avoid writing them into the YouTube description.
- **Image project**: `content.json` for the claim, the items and the callout. Look at the rendered PNGs.
  `copy.md`, if it exists, is a record of what was said before, not a draft to edit.
- **A loose file**: the transcript, or the image itself.

You are done reading when you can say, without looking again: what it claims, which numbers in it are real and
where they came from, and who it is for.

## 4. Openings

Four that work:

- **The reversal.** "Monolith versus microservices isn't a tech debate."
- **The number.** "I terminated the instance and the bill did not move."
- **The cost.** "That mistake cost me four months of NAT gateway charges."
- **The admission.** "Braandly is still a monolith, and I am not sorry about it."

Four that do not, ever:

- A rhetorical question. "Ever wondered why your bill is so high?"
- "In this video" or "In today's video".
- The headline restated as a sentence.
- A definition. Nobody stayed for "Microservices are an architectural pattern where...".

## 5. Different angle, not different length

Each network gets its own way in:

| Network | What it is |
|---|---|
| YouTube description | The problem and the stakes, never the answer, then the links |
| LinkedIn | The professional consequence, and a question that asks for their version |
| Instagram | The personal moment, in short paragraphs |
| TikTok | The one line that makes someone stay, then the shortest version of the argument |
| X | The sharpest claim in the set, standing alone |
| WhatsApp status | What you would text one person about it |
| WhatsApp / Telegram post | A message to a group: what it is, why it is worth their time, the link |

A useful check: cover the headings and read the blocks. If you cannot tell which is which, start again.

**No spoilers on YouTube.** The description sells the click; the video delivers the answer. Name the problem
and why it matters, never the finding, the twist or the conclusion. If someone could skip the video after
reading it, rewrite it. Two to four short lines, then the links block: watch-next videos, the subscribe link
(`https://www.youtube.com/@<handle>?sub_confirmation=1`) and the socials. `npm run social` warns when there is
no link.

**No timestamps or chapter lists.** Do not put them in a YouTube description unless the user asks for them,
and never on a Short: a vertical video has no chapter bar, so a list of times is noise in the one part of the
description anybody reads. Write the description as prose.

## 6. Hashtags

They go in `hashtags[]` and nowhere else. The script lower-cases them, strips punctuation, dedupes them and
places them the way the network expects.

- Source them from the topic, the brand and the technologies actually named. Never from item titles: they turn
  into slugs like `#nodockerignore` that nobody searches for.
- **CamelCase, as in the reference set**: `#SoftwareEngineering`, `#BuildInPublic`, `#TechTok`. Not
  `#softwareengineering`. The script keeps whatever casing you write, so write it properly.
- **The number in the table is a maximum, not a target.** Going over it fails the run. Five on YouTube,
  Instagram, TikTok and LinkedIn; two on X; none on WhatsApp. A wall of twenty looks like a bot account.
- **No placeholders.** Three real tags beat five with a TODO in them. The old `copy.md` shipped
  `— add 8 more in content.json → tags[]` in every real file, which is the exact failure to avoid.

## 7. Links and CTAs

The CTA sentence is copy, so you write it. The script only checks it against the platform's `linkPolicy`:

- `body`: put the URL in the text. YouTube, Facebook, WhatsApp/Telegram.
- `bio`: no URL is clickable, so name the bio link instead of pasting one. Instagram.
- `comment`: a URL in the body suppresses reach. Name the resource, put the link in the first comment. LinkedIn.
- `none`: no links. TikTok, WhatsApp status.
- `optional`: your call, and it costs 23 characters. X.

One destination per item. Handles are per network: use the one that belongs to the network you are writing for.

## 8. Alt text

One sentence: what is in the image and what it proves. Not the headline again. Instagram truncates at 100
characters, which the script warns about.

## 9. Voice

Pull `brand.voice` and obey it. Beyond that: sentence case, first person, concrete nouns, and numbers instead
of adjectives. Vary the sentence length. Short sentences carry weight.

Contractions are normal. "Isn't", "don't", "we're", "that's" is how the reference set reads, and writing
"it is not" everywhere makes the copy sound like a filing.

Never: "game-changer", "unlock", "leverage", "seamless", "robust", "in today's landscape", "let that sink in",
"dive in", or three-item lists where two would do. No em dashes.

## 10. Banned patterns

All three of these shipped in a real `copy.md`:

- The same body under three different headings.
- A blank gap where an idea had no items, left in the file.
- Placeholder text inside a block.

## 11. Before you hand it over

- Read each block aloud. The ones that sound like a press release get rewritten.
- Check every number against the source. A wrong figure in a caption outlives the post.
- Confirm nothing sits above its soft target without a reason you can say in one sentence.
- Run `npm run social` and read the Checks block yourself before showing it to anyone.
