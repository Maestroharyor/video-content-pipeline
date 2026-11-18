# Design: directions, hooks, the kit

## Directions
Offer 2-3 that differ in idea, not in colour: e.g. the video's metaphor drawn (A), the two things being weighed side by side
(B), a prop from the video's world (C). Each needs:
- **one picture** that reads at 168 px (the sidebar): one object or one pair, not a scene;
- **2-4 huge words** (the hook), white KoHo with the key word in the theme accent;
- the brand's channel mark bottom-left (`TK.mark()`; exempt from the probe).

## Hooks
- Prefer a question or a tension the video resolves. **Never answer it on the thumbnail** (house rule): no ≠, no green/red
  "winner" labels, no struck-out word unless the user asks; OR or "/" between equal sides, equal light on both.
- Don't repeat the title: title and thumbnail are a pair (the title carries the search phrase, the thumbnail the hook).
- Two hooks per direction (`--var v=1|2`): one plain, one with an edge. Offer a bigger-type variant (`--var size=big`) when
  the hook is short enough to stack on two lines at ~180-200 px.

## The kit (projects/<slug>-thumbs/kit.js, window.TK)
`TK.C` comes from the video's theme CSS. The shared pieces: `ground` (key light, floor, pools of light under each group),
`title` (with `lh` to tighten a stacked hook), `tile` (a real logo or icon), `label`, `face`/`cut` (the white sticker edge),
`mark`. Grow the kit with the video's own props (see `projects/ai-can-clone-apps-thumbs/kit.js`: set flats, braces,
sandbags, tape, clapperboard). Pieces are pure functions returning HTML in 1920x1080 stage px.

## Layout rules that held up
- Equal groups, equal gaps: compute positions (`row()` in ai-can-clone-apps-thumbs/slides/02-tag.js), never eyeball them.
- Things stand on something: a floor line, a contact shadow; floating icons read as clip art.
- Real icons at their own shape; a dark frame around one side's icons makes them read smaller than the other side's.
- The face (when on) bleeds off the right edge, the text and picture take the left ~60%.
