defineSlide({ slug: '06-cursor-autocomplete', template: 'code', data: {
  eyebrow: 'Cursor, back then · not the agents', accent: 'b', h1: 'What I loved:<br><em>autocomplete</em>.', file: 'cart.ts',
  tiles: [{ icon: 'cursor', label: 'Cursor' }],
  lines: [
    '<span class="k">function</span> <span class="f">total</span>(cart) {',
    '  <span class="k">return</span> cart.items',
    '<span class="c">    .reduce((sum, i) => sum + i.price * i.qty, 0)</span>  <span class="p">⇥ Tab</span>'
  ],
  ok: 'Tab to accept the suggestion' } });
