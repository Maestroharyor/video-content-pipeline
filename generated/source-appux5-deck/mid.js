const p=require('puppeteer'),path=require('path'),fs=require('fs');
(async()=>{const b=await p.launch({headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--force-color-profile=srgb','--font-render-hinting=none']});
const g=await b.newPage();await g.setViewport({width:1080,height:1920});
await g.goto('file://'+path.resolve('deck.html'),{waitUntil:'networkidle0'});await g.evaluateHandle('document.fonts.ready');
const st=await g.$('#stage');fs.mkdirSync('mid',{recursive:true});
const jobs=process.argv.slice(2);
for(const j of jobs){const [id,t]=j.split(':');await g.evaluate((i,tt)=>window.setFrame(i,parseFloat(tt)),id,t);
await new Promise(r=>setTimeout(r,50));await st.screenshot({path:'mid/'+id+'_'+t.replace('.','')+'.png'});}
await b.close();})();
