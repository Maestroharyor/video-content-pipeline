const fs = require('fs');
const si = require('simple-icons');

function mark(slug) {
  if (slug === 'braandly') {
    return fs.readFileSync('assets/braandly.svg', 'utf8').replace(/\n/g, '');
  }
  const key = 'si' + slug.charAt(0).toUpperCase() + slug.slice(1);
  const ic = si[key];
  if (!ic) throw new Error('missing icon ' + slug);
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#${ic.hex}" d="${ic.path}"/></svg>`;
}

let html = fs.readFileSync('head.html', 'utf8')
  + fs.readFileSync('sl_a.html', 'utf8')
  + fs.readFileSync('sl_b.html', 'utf8')
  + fs.readFileSync('sl_c.html', 'utf8');

html = html.replace(/\{\{LOGO:([a-z0-9]+)\}\}/g, (_, s) => mark(s));
fs.writeFileSync('deck.html', html);
console.log('built deck.html', html.length, 'bytes');
