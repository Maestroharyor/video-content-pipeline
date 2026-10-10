/* VPC diagram from data. Boxes are subnets/VPC outlines, nodes are icon+label, edges are drawn svg paths.
   vpcDiagram({ id, x, y, w, h,
     boxes: [{id:'vpc', cls:'vpcb', x,y,w,h, label:'VPC 10.0.0.0/16'}],
     nodes: [{id:'nat', x, y, icon:'nat-gateway', aws:true, label:'NAT gateway'}],   // x,y = centre of the icon tile
     edges: [{from:'ec2a', to:'nat', color:'#8B5CF6', via?: [x,y]}] })
   Element ids: `${id}-<boxId>`, `${id}-<nodeId>`, `${id}-e<i>` */
function vpcDiagram(o) {
  const boxes = (o.boxes || []).map(b => `<div class="box ${b.cls || ''}" id="${o.id}-${b.id}" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px"><b>${b.label || ''}</b></div>`).join('');
  const N = {}; (o.nodes || []).forEach(n => N[n.id] = n);
  const nodes = (o.nodes || []).map(n => {
    const src = n.brand ? ASSETS + 'logos/brands/' + n.icon + '.svg' : ASSETS + 'logos/aws/' + n.icon + '.svg';
    return `<div class="n${n.hot ? ' hot' : ''}" id="${o.id}-${n.id}" style="left:${n.x - 85}px;top:${n.y - 56}px"><div class="ic${n.aws ? ' sq' : ''}${n.dark ? ' dk' : ''}"><img src="${src}" alt="${n.label}"></div><span>${n.label}</span></div>`;
  }).join('');
  const edges = (o.edges || []).map((e, i) => {
    const a = N[e.from], b = N[e.to];
    const pts = [[a.x, a.y], ...(e.via || []), [b.x, b.y]];
    const d = pts.map((p, j) => (j ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
    return `<svg class="draw" id="${o.id}-e${i}" style="left:0;top:0;width:${o.w}px;height:${o.h}px" viewBox="0 0 ${o.w} ${o.h}"><path d="${d}" stroke="${e.color || '#8B5CF6'}" stroke-width="${e.width || 6}" stroke-dasharray="${e.dash || '16 14'}"/></svg>`;
  }).join('');
  const cloud = o.cloud ? `<div class="cloud" id="${o.id}-cloud" style="left:${o.cloud.x}px;top:${o.cloud.y}px"><svg viewBox="0 0 24 24"><use href="#i-globe"/></svg>${o.cloud.label}</div>` : '';
  return `<div class="vpc" id="${o.id}" style="left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px">${boxes}${edges}${nodes}${cloud}</div>`;
}
