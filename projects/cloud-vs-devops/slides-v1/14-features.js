defineSlide({ slug: '14-features', template: 'code', data: {
  eyebrow: '01 · The developer', accent: 'v', h1: 'Features,<br><em>in code</em>', file: 'src/routes.ts',
  lines: [
    'router.<span class="f">post</span>(<span class="s">\'/auth/register\'</span>, auth.register)',
    'router.<span class="f">post</span>(<span class="s">\'/videos\'</span>, upload.single(<span class="s">\'file\'</span>), videos.create)',
    'router.<span class="f">get</span>(<span class="s">\'/videos/:id/stream\'</span>, videos.stream)',
    'router.<span class="f">post</span>(<span class="s">\'/videos/:id/comments\'</span>, comments.create)',
    'router.<span class="f">post</span>(<span class="s">\'/videos/:id/likes\'</span>, likes.toggle)',
    'router.<span class="f">post</span>(<span class="s">\'/users/:id/follow\'</span>, users.follow)',
    'router.<span class="f">post</span>(<span class="s">\'/channels/:id/subscribe\'</span>, channels.subscribe)',
  ],
} });
