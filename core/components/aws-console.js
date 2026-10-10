/* AWS Management Console mock (Cloudscape look). Pure function: spec -> HTML string.
   Rows get ids `${id}-r1..n`, status cells `${id}-r<i>-st`, checkboxes `${id}-r<i>-cb`, so slides can animate them.

   awsConsole({
     id, x, y,                         // element id + absolute position (px)
     service: 'EC2', crumb: ['EC2', 'Instances'],
     nav: ['Instances', ...], active: 0,
     title: 'Instances (4)', info: true,
     buttons: ['Connect', 'Instance state ▾'], primary: 'Launch instances', primaryBlue: false,
     cols: [{ l: 'Name', w: 2 }, { l: 'Instance state', w: 2 }],   // w = flex grow
     rows: [ ['ai-demo', 'i-0f3c…', { st: ['Running', 'ok'] }, 't3.medium'], ... ]  // string | {st:[text,type]} | {link} | {mono}
     body: '<div>…</div>'              // optional html used instead of the table
   })
*/
const AWS_LOGO = () => ASSETS + 'logos/aws/aws-logo-white.svg';

function awsCell(c, grow) {
  const style = `style="flex-grow:${grow || 1}"`;
  if (c && typeof c === 'object') {
    if (c.st) return `<span class="c" ${style}><span class="st ${c.st[1]}" id="${c.id || ''}"><svg viewBox="0 0 24 24"><use href="#${STATUS_ICON[c.st[1]]}"/></svg>${c.st[0]}</span></span>`;
    if (c.link) return `<span class="c link" ${style}>${c.link}</span>`;
    if (c.mono) return `<span class="c mono" ${style}>${c.mono}</span>`;
    if (c.html) return `<span class="c" ${style}>${c.html}</span>`;
  }
  return `<span class="c" ${style}>${c == null ? '' : c}</span>`;
}

function awsTable(id, spec) {
  const cols = spec.cols || [];
  const th = cols.map(c => `<span class="c" style="flex-grow:${c.w || 1}">${c.l}</span>`).join('');
  const rows = (spec.rows || []).map((r, ri) => {
    const cells = r.map((c, ci) => {
      if (c && typeof c === 'object' && c.st) c = Object.assign({ id: `${id}-r${ri + 1}-st` }, c);
      return awsCell(c, cols[ci] ? cols[ci].w || 1 : 1);
    }).join('');
    return `<div class="aws-tr" id="${id}-r${ri + 1}"><span class="cb" id="${id}-r${ri + 1}-cb"></span>${cells}</div>`;
  }).join('');
  return `<div class="aws-tbl"><div class="aws-th"><span class="cb" style="border-color:transparent;background:transparent"></span>${th}</div>${rows}</div>`;
}

function awsConsole(spec) {
  const id = spec.id;
  const crumb = (spec.crumb || []).map((c, i, a) => i === a.length - 1 ? `<b>${c}</b>` : `<span>${c}</span><i>›</i>`).join('');
  const nav = (spec.nav || []).map((n, i) => {
    const grp = typeof n === 'object';
    const label = grp ? n.grp : n;
    return `<a class="${i === spec.active ? 'on' : ''}${grp ? ' grp' : ''}">${label}</a>`;
  }).join('');
  const btns = (spec.buttons || []).map(b => {
    const dd = /▾$/.test(b); const dis = /^!/.test(b);
    return `<span class="aws-btn${dd ? ' dd' : ''}${dis ? ' dis' : ''}">${b.replace(/\s*▾$/, '').replace(/^!/, '')}</span>`;
  }).join('');
  const pri = spec.primary ? `<span class="aws-btn pri${spec.primaryBlue ? ' blue' : ''}" id="${id}-pri">${spec.primary}</span>` : '';
  const header = spec.title === false ? '' :
    `<div class="aws-ch"><b>${spec.title || ''}</b>${spec.info === false ? '' : '<i>Info</i>'}<div class="btns">${btns}${pri}</div></div>`;
  const body = spec.body != null ? spec.body : awsTable(id, spec);
  return `<div class="aws" id="${id}" style="left:${spec.x || 0}px;top:${spec.y || 0}px">
  <div class="aws-nav"><img class="logo" src="${AWS_LOGO()}" alt="AWS">
    <span class="svc"><svg viewBox="0 0 24 24"><use href="#i-grid"/></svg>Services</span>
    <span class="search"><svg viewBox="0 0 24 24"><use href="#i-search"/></svg>Search<kbd>[Option+S]</kbd></span>
    <span class="right"><svg viewBox="0 0 24 24"><use href="#i-bell"/></svg><svg viewBox="0 0 24 24"><use href="#i-help"/></svg><span class="dd">${spec.region || 'N. Virginia'}</span><span class="dd">${spec.account || 'dev-account'}</span></span>
  </div>
  <div class="aws-crumb">${crumb}</div>
  <div class="aws-wrap">
    <div class="aws-side"><div class="sh">${spec.service || ''}</div>${nav}</div>
    <div class="aws-body" id="${id}-body"><div class="aws-cont" id="${id}-cont">${header}${body}</div>${spec.extra || ''}</div>
  </div>
</div>`;
}

/* Cloudscape dropdown menu. items: ['Stop instance', {hl:'Terminate instance'}, '-', {dis:'Hibernate'}] */
function awsMenu(id, x, y, items) {
  const li = items.map(it => it === '-' ? '<hr>' : typeof it === 'string' ? `<span>${it}</span>` :
    it.hl ? `<span class="hl">${it.hl}</span>` : `<span class="dis">${it.dis}</span>`).join('');
  return `<div class="aws-menu" id="${id}" style="left:${x}px;top:${y}px">${li}</div>`;
}
/* Cloudscape modal (+ scrim) */
function awsModal(id, x, y, o) {
  return `<div class="aws-scrim" id="${id}-scrim"></div><div class="aws-modal" id="${id}" style="left:${x}px;top:${y}px">
  <div class="mh">${o.title}<svg viewBox="0 0 24 24"><use href="#i-x"/></svg></div>
  <div class="mb">${o.body || ''}${o.warn ? `<div class="warn"><svg viewBox="0 0 24 24"><use href="#i-warn"/></svg><span>${o.warn}</span></div>` : ''}${o.field ? `<div class="field">${o.field}</div>` : ''}</div>
  <div class="mf"><span class="aws-btn">Cancel</span><span class="aws-btn pri${o.blue ? ' blue' : ''}" id="${id}-ok">${o.ok}</span></div></div>`;
}
/* Cloudscape flashbar */
function awsFlash(id, x, y, text, blue) {
  return `<div class="aws-flash${blue ? ' blue' : ''}" id="${id}" style="left:${x}px;top:${y}px"><svg viewBox="0 0 24 24"><use href="#i-check"/></svg>${text}</div>`;
}
/* Billing > cost by service rows. rows: [{l:'Amazon EC2', v:'$0.00', c:'o', w:0.0}] with ids `${id}-f<i>` for the fill */
function awsBilling(id, rows, total) {
  const li = rows.map((r, i) => `<div class="br" id="${id}-r${i + 1}"><span class="bl">${r.l}</span><span class="bt"><i class="${r.c || ''}" id="${id}-f${i + 1}" style="width:${Math.round((r.w == null ? 1 : r.w) * 100)}%"></i></span><span class="bv" id="${id}-v${i + 1}">${r.v}</span></div>`).join('');
  return `<div class="aws-bill">${li}${total ? `<div class="tot" id="${id}-tot"><span>${total[0]}</span><span>${total[1]}</span></div>` : ''}</div>`;
}
