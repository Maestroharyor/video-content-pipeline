defineSlide({ slug: '06-developer', template: 'app', data: {
  eyebrow: 'Software developer', accent: 'v', h1: 'The developer <em>builds the app</em>', mode: 'wire',
  features: [{ label: 'Sign up' }, { label: 'Upload' }, { label: 'Play' }, { label: 'Comment' }, { label: 'Like' }, { label: 'Follow' }, { label: 'Subscribe', cls: 'red' }],
  code: { file: 'src/routes.ts', lines: [
    'router.<span class="f">post</span>(<span class="s">\'/auth/register\'</span>, auth.register)',
    'router.<span class="f">post</span>(<span class="s">\'/videos\'</span>, videos.upload)',
    'router.<span class="f">get</span>(<span class="s">\'/videos/:id/stream\'</span>, videos.stream)',
    'router.<span class="f">post</span>(<span class="s">\'/videos/:id/comments\'</span>, comments.add)',
    'router.<span class="f">post</span>(<span class="s">\'/videos/:id/likes\'</span>, likes.toggle)',
    'router.<span class="f">post</span>(<span class="s">\'/users/:id/follow\'</span>, users.follow)',
    'router.<span class="f">post</span>(<span class="s">\'/channels/:id/subscribe\'</span>, subs.add)'] },
  cast: [{ src: passet('avatars/dev-hand.svg'), name: 'Dev', cls: 'v', size: 190 }],
  bubbles: [{ who: 0, text: 'I build <em>the app itself</em>.', x: 0, y: 20, w: 200, tail: 'd', cls: 'v' }],
} });
