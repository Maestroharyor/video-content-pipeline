defineSlide({ slug: '39-storage-classes', template: 'code', data: {
  eyebrow: '02 · Costs', accent: 'r', h1: 'Cold videos,<br><em>cheaper</em>', file: 'lifecycle.tf',
  lines: [
    '<span class="f">rule</span> {',
    '  id     = <span class="s">"cold-videos"</span>',
    '  status = <span class="s">"Enabled"</span>',
    '  <span class="f">filter</span> { prefix = <span class="s">"raw/"</span> }',
    '  <span class="f">transition</span> {',
    '    days          = <span class="n">30</span>',
    '    storage_class = <span class="s">"STANDARD_IA"</span>',
    '  }',
    '  <span class="f">transition</span> {',
    '    days          = <span class="n">90</span>',
    '    storage_class = <span class="s">"GLACIER_IR"</span>',
    '  }',
    '}',
  ],
} });
