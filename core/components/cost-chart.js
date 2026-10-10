/* Dark cost bar chart. costChart({id, x, y, w, h, title, unit, bars:[{l:'Apr', v:12, c:'d'}], max, plotH})
   Bars get ids `${id}-b<i>` (scaleY from 0) and value labels `${id}-v<i>` (opacity 0). */
function costChart(o) {
  const max = o.max || Math.max(...o.bars.map(b => b.v)) * (o.headroom || 1.3);
  const plotH = o.plotH || 300;
  const cols = o.bars.map((b, i) => {
    const h = Math.max(6, Math.round(b.v / max * plotH));
    const val = b.label != null ? b.label : (o.fmt ? o.fmt(b.v) : '$' + b.v.toFixed(0));
    return `<div class="col"><em id="${o.id}-v${i}" style="bottom:${h}px">${val}</em><i class="${b.c || 'd'}" id="${o.id}-b${i}" style="height:${h}px"></i><b>${b.l}</b></div>`;
  }).join('');
  const gl = [0.25, 0.5, 0.75, 1].map(f => `<span class="gl" style="bottom:${Math.round(f * plotH)}px"></span>`).join('');
  return `<div class="cbar" id="${o.id}" style="left:${o.x || 0}px;top:${o.y || 0}px;width:${o.w || 960}px${o.h ? ';height:' + o.h + 'px' : ''}">
  <div class="ttl">${o.title || ''}${o.unit ? `<small>${o.unit}</small>` : ''}</div>
  <div class="plot" style="height:${plotH}px">${gl}${cols}</div><div class="lbls"></div></div>`;
}
