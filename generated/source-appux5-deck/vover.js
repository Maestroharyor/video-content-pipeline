const p=require('puppeteer'),path=require('path');
(async()=>{const b=await p.launch({headless:'new',args:['--no-sandbox','--disable-dev-shm-usage']});
const g=await b.newPage();await g.setViewport({width:1080,height:1920});
await g.goto('file://'+path.resolve('deck.html'),{waitUntil:'networkidle0'});await g.evaluateHandle('document.fonts.ready');
const ids=await g.evaluate(()=>window.SLIDE_IDS);let bad=[];
for(const id of ids){
 const r=await g.evaluate(i=>{window.setFrame(i,1);const out=[];
  document.getElementById(i).querySelectorAll('.panel,.badge,.chip,.rowbar,.code,.card,.bbox,.trow,.dtr').forEach(e=>{
    if(e.closest('.vp')||e.closest('#n-scr'))return;               // legitimately clipped scrollers
    const cs=getComputedStyle(e); if(parseFloat(cs.opacity)<.05)return;
    if(e.scrollHeight>e.clientHeight+2) out.push('VOVER '+(e.id||e.className.toString().slice(0,24))+' '+e.scrollHeight+'>'+e.clientHeight);
    if(e.scrollWidth>e.clientWidth+2)  out.push('HOVER '+(e.id||e.className.toString().slice(0,24))+' '+e.scrollWidth+'>'+e.clientWidth);
  });return out;},id);
 r.forEach(x=>bad.push(id+'  '+x));}
await b.close();bad.forEach(x=>console.log(x));console.log('--- '+bad.length+' clipped elements');
})();
