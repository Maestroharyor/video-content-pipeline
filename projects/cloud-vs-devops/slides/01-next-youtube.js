defineSlide({ slug: '01-next-youtube', template: 'app', data: {
  emoji: [{ e: 'rocket', x: 1240, y: 96, size: 120 }, { e: 'thinking_face', x: 1560, y: 750, size: 120 }],
  eyebrow: 'The startup', accent: 'b', h1: 'The next <em>YouTube</em>', sketch: true,
  features: [{ label: 'Like', icon: 'like', n: '1.2k' }, { label: 'Comment', icon: 'comment', n: '86' }, { label: 'Follow', icon: 'bell' }, { label: 'Subscribe', cls: 'red' }],
  cast: [{ src: passet('avatars/dev-point.svg'), name: 'You', cls: 'v', size: 190 }],
  bubbles: [{ who: 0, text: 'Here\'s <em>the plan</em>.', x: 0, y: 40, w: 210, tail: 'd', cls: 'v' }],
  questions: ['Where does it <em>run</em>?', 'Who ships the <em>updates</em>?', 'Who pays for the <em>servers</em>?'],
  // vertical canvas (--variant vertical and the social cuts): positions for the 1080x1920 stage
  v: { emoji: [{ e: 'rocket', x: 760, y: 220, size: 120 }, { e: 'thinking_face', x: 900, y: 1330, size: 120 }],
    bubbles: [{ who: 0, text: 'Here\'s <em>the plan</em>.', x: 0, y: 505, w: 210, tail: 'd', cls: 'v' }] },
} });
