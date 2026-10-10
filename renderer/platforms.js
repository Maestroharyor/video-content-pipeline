/* Every network the pipeline writes copy for: its real ceiling, the length that actually performs
   there, and the shape that makes the text read like it was written for that feed.

   `shape` is prompt-craft, not documentation. The model reads it (npm run social -- --rules) before
   writing, and it is printed next to every block in social.md so whoever reviews the copy sees the
   rule it was held to. Keep it to one to three sentences and keep it concrete.

   `hashtags` is the maximum that network takes, not a target: going over is a gate, going under is fine.
   `cap` is the hard ceiling and the gate. `soft` is the target. `fold` is how much of the body is
   visible before the network cuts it with a "more" link, which is the only number that changes how
   the first sentence is written. */

const PLATFORMS = {
  youtube: {
    label: 'YouTube', default: true, tagStyle: 'tail', hashtags: 5, linkPolicy: 'body',
    fields: [
      { key: 'title', label: 'Title', cap: 100, soft: 60, fold: 60, hashtags: 0,
        shape: 'One line, payload inside the first 45 characters, because search results and mobile both truncate around 60. No clickbait punctuation, no block capitals, no emoji; the number and the noun carry it. Never repeat the channel name.' },
      { key: 'description', label: 'Description', cap: 5000, soft: 800, fold: 157,
        shape: 'A teaser, never a summary: two to four short lines that name the problem and why it matters, without the answer, the findings or the conclusion. If someone could skip the video after reading it, rewrite it. The first two lines are the only ones above the fold and they are what Google shows. Then chapters only if the user asked for them (never on a Short), then a links block: watch-next videos, the subscribe link and the socials. Then hashtags. A description without links is unfinished.' },
    ],
  },
  instagram: {
    label: 'Instagram', default: true, cap: 2200, soft: 850, fold: 125, hashtags: 5,
    tagStyle: 'separator', linkPolicy: 'bio', fields: [{ key: 'body', label: 'Caption' }],
    shape: 'Hook inside the first 125 characters, before the "... more" cut. Single-sentence paragraphs with a blank line between them, because Instagram renders line breaks and a wall of text gets skipped. No URL is clickable here, so name the bio link instead of pasting one. At most five hashtags, after a separator line at the end.',
  },
  tiktok: {
    label: 'TikTok', default: true, cap: 2200, soft: 500, fold: 70, hashtags: 5,
    tagStyle: 'tail', linkPolicy: 'none', fields: [{ key: 'body', label: 'Caption' }],
    shape: 'Four words to stop the scroll, then three or four short paragraphs with a blank line between them. Sentence case and ordinary punctuation, never all lower case. Conversational, contractions welcome, but it is written, not texted. Do not repeat what the voiceover already says. Hashtags on the last line. No links; they are not clickable.',
  },
  x: {
    label: 'X', default: true, cap: 280, soft: 265, fold: 280, hashtags: 2, weighted: true,
    tagStyle: 'tail', linkPolicy: 'optional', alternates: 1, fields: [{ key: 'body', label: 'Post' }],
    capNote: '280 on the free tier. Any URL counts as a flat 23 characters however long it is.',
    shape: 'One idea, one post; a thread only when the idea genuinely needs it. The specific claim or number goes in the first line and the proof follows it. A link costs a flat 23 characters whatever its length. At most two hashtags, on the last line. Supply one alternate that takes a different angle, not a reworded version of the same sentence.',
  },
  linkedin: {
    label: 'LinkedIn', default: true, cap: 3000, soft: 1800, fold: 140, hashtags: 5,
    tagStyle: 'tail', linkPolicy: 'comment', fields: [{ key: 'body', label: 'Post' }],
    shape: 'The first 140 characters are the entire preview, so put a complete and concrete statement there and then a blank line, because "see more" is where the reader decides. Short paragraphs, first person, one number or one named cost per paragraph. Close on a question that asks for their version of it, not for agreement. A URL in the body suppresses reach: name the resource and put the link in the first comment. Three hashtags at the very end.',
  },
  'whatsapp-status': {
    label: 'WhatsApp status', default: true, cap: 700, soft: 180, fold: 180, hashtags: 0,
    tagStyle: 'none', linkPolicy: 'none', fields: [{ key: 'body', label: 'Status' }],
    shape: 'One or two sentences, read in under three seconds over the image or the video. Write it the way you would text one person you know. No hashtags, no handles, no "follow": the only ask here is a reply.',
  },
  'whatsapp-telegram': {
    label: 'WhatsApp / Telegram post', default: true, cap: 1024, soft: 600, fold: 200, hashtags: 0,
    tagStyle: 'none', linkPolicy: 'body', fields: [{ key: 'body', label: 'Post' }],
    capNote: 'A media caption caps at 1024 on both, and these posts always carry the video or the image. A plain Telegram message allows 4096, which is not this case.',
    shape: 'A message, not a caption: one line greeting the group, then what the thing is and why it is worth their time, then the link alone on the last line. Telegram renders markdown links and WhatsApp does not, so use a bare URL.',
  },

  /* In the table, outside the default set. */
  facebook: {
    label: 'Facebook', default: false, cap: 63206, soft: 500, fold: 250, hashtags: 3,
    tagStyle: 'tail', linkPolicy: 'body', fields: [{ key: 'body', label: 'Post' }],
    capNote: '63,206 is the real ceiling. The 2200 that copy.js used is Instagram\'s number.',
    shape: 'Two or three sentences above the "...See more" fold at roughly 250 characters, for a wider and less technical audience than Instagram\'s. Never the Instagram body pasted again: if the two read identically, one of them should not be posted. One link previews well. Hashtags do almost nothing here, so use at most two.',
  },
  'youtube-community': {
    label: 'YouTube Community', default: false, cap: 1000, soft: 400, fold: 150, hashtags: 3,
    tagStyle: 'tail', linkPolicy: 'body', fields: [{ key: 'body', label: 'Post' }],
    capNote: '1000, not the 1200 that copy.js used.',
    shape: 'Written for people who already subscribed: what is new, and what to do with it. Poll-shaped when the content has a genuine either/or. One link to the video is expected.',
  },
};

const DEFAULTS = Object.keys(PLATFORMS).filter(k => PLATFORMS[k].default);
const ALT_CAP = 1000, ALT_SOFT = 100;        /* Instagram truncates alt text at 100 */

/* A single-field platform carries cap/soft/fold/shape on itself; youtube carries them per field.
   Everything downstream deals only with this flat list. */
function fieldsOf(key) {
  const P = PLATFORMS[key];
  if (!P) throw new Error('unknown platform ' + key + ' (have: ' + Object.keys(PLATFORMS).join(', ') + ')');
  return P.fields.map(f => ({
    key: f.key,
    label: f.label,
    cap: f.cap != null ? f.cap : P.cap,
    soft: f.soft != null ? f.soft : P.soft,
    fold: f.fold != null ? f.fold : P.fold,
    hashtags: f.hashtags != null ? f.hashtags : P.hashtags,
    shape: f.shape || P.shape,
    weighted: !!P.weighted,
  }));
}

/* Code points, so an emoji is one character and not two. X counts every URL as a flat 23 whatever
   its length, which is the difference between a post that sends and one that is refused. */
const URL_RE = /https?:\/\/\S+/g;
function count(text, weighted) {
  const s = String(text == null ? '' : text);
  return [...(weighted ? s.replace(URL_RE, 'x'.repeat(23)) : s)].length;
}
const hasUrl = text => /https?:\/\/\S+/.test(String(text || ''));   /* not URL_RE: it is global, and .test on a global regex is stateful */

/* Hashtags live in hashtags[] so the script can place and count them. Written with or without the
   hash, stripped to alphanumerics, deduped case-insensitively, order kept. The author's casing is
   kept: #SoftwareEngineering reads and searches better than #softwareengineering. */
function normTags(tags) {
  const seen = new Set();
  return (tags || []).map(t => String(t).replace(/^#/, '').replace(/[^A-Za-z0-9]/g, ''))
    .filter(t => t.length > 2 && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase())).map(t => '#' + t);
}
function appendTags(body, tags, style) {
  const t = normTags(tags);
  if (!t.length || style === 'none') return body;
  if (style === 'inline') return body.replace(/\s+$/, '') + '  ' + t.join(' ');
  if (style === 'separator') return body.replace(/\s+$/, '') + '\n\n—\n' + t.join(' ');
  return body.replace(/\s+$/, '') + '\n\n' + t.join(' ');          /* tail */
}

module.exports = { PLATFORMS, DEFAULTS, ALT_CAP, ALT_SOFT, fieldsOf, count, hasUrl, normTags, appendTags };
