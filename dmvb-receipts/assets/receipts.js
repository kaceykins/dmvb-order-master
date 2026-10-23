const $=s=>document.querySelector(s),DEF={qr:'https://dmvbeneficials.com/resources/release-tutorials/',h1:'Need help releasing your beneficials?',sq:'https://shop.dmvbeneficials.com/washingtondc/',ch:'DC Metro Chapter',h2:'Scan for step by step guides and video tutorials!',fk:'Nematodes',fn:'NEMATODES MAY NEED TO BE RETRIEVED FROM FRIDGE OR COOLER. KEEP REFRIGERATED.',ac:'#00d9ff',rd:'#e00000',logo:'',logoAR:1.962,
cl:"#fb64cb\n#00d9ff\n#9bfb34\n#6e05cb\n#000000\n#a7f2ff\n#ffceef\n#c7ff8b\n#cd92ff\n#c3c4c7",
ru:"item||\\s*-\\s*Tubes/Bottles/Containers||\nitem||\\s*\\(Whole and (Partial|Half)\\)||\nitem||\\s*-\\s*(Sachets|Cards|Bags)$||\nitem||Universal Release Boxes||Release Boxes\nsize||Hanging( mini)? sachet||Sachet\nsize|| in rice hulls||\nsize||^Box$||Universal\nloc||^PLNTR DC$||DC Dupont - PLNTR\nloc||^Rewild Shaw$||DC Shaw - Rewild\nloc||^Weber's Pet Supermarket - VA$||VA Fairfax - Weber's Pet Supermarket\nloc||\\s*-\\s*Residence$||\nloc||Weber's Pet Supermarket||Weber's Pet"};
const SAMPLE='Order ID,Pickup Location,Customer Name,Customer Email,Customer Order Note,Product,Type,Product Size,Quantity\n3390,VA Arlington - Residence,Courtney Winrow,,,Pirate Bugs - Tubes/Bottles/Containers (Whole and Partial),Bottle of 500 bugs,0.5,1\n3390,VA Arlington - Residence,Courtney Winrow,,,Cucumeris Mites - Sachets,"Hanging sachet of 1,000 mites",1,10\n3386,DC Dupont - PLNTR,Jeanne Arnson-Serotta,j@example.com,Early pickup please,Nematodes Sf - Bags,Bag of 50 million,1,1';
const WPD=window.DMVB||{};let S={...DEF,...(WPD.settings||{})},rows=null;
const hx=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16)),FB=['#e8590c','#1c7ed6','#2f9e44','#ae3ec9','#f08c00','#0ca678','#d6336c','#495057'];
function W(d,t,s,b,cs=.45){d.setCharSpace(0);d.setFont('helvetica',b?'bold':'normal');d.setFontSize(s);return d.getTextWidth(t)+cs*t.length}
function T(d,t,x,y,o={}){const s=o.s||11,cs=o.cs==null?.45:o.cs,w=W(d,t,s,o.b,cs);d.setTextColor(...(o.c||[0,0,0]));d.setCharSpace(cs);d.text(t,o.al=='r'?x-w:x,y);d.setCharSpace(0);return w}
function star(d,cx,cy,r,c){const p=[];for(let i=0;i<10;i++){const a=(-90+i*36)*Math.PI/180,q=i%2?r*.4:r;p.push([cx+q*Math.cos(a),cy+q*Math.sin(a)])}d.setFillColor(...c);d.lines(p.slice(1).map((v,i)=>[v[0]-p[i][0],v[1]-p[i][1]]),p[0][0],p[0][1],[1,1],'F',true)}
function pin(d,x,y,w,h,c){const cx=x+w/2,r=w/2,cy=y+r;d.setFillColor(...c);d.circle(cx,cy,r,'F');d.triangle(cx-r*.8,cy+r*.55,cx+r*.8,cy+r*.55,cx,y+h*.94,'F');d.setFillColor(255,255,255);d.circle(cx,cy,r*.6,'F');d.setFillColor(...c);d.circle(cx,cy,r*.4,'F')}
function cleaners(){const R=S.ru.split('\n').map(l=>l.split('||')).filter(a=>a.length==3).map(a=>{try{return[a[0].trim(),new RegExp(a[1],'g'),a[2]]}catch(e){return null}}).filter(Boolean);
 const ap=(k,t)=>R.filter(r=>r[0]==k).reduce((v,r)=>v.replace(r[1],r[2]),t).trim(),kk=t=>t.replace(/\b\d{1,3}(?:,\d{3})+\b|\b\d{4,}\b/g,m=>{const n=+m.replace(/,/g,'');return n>=1000&&n%100==0?(+(n/1000).toFixed(1))+'k':m});return{ap,kk}}
function parse(data){const{ap,kk}=cleaners();
 const hd=Object.keys(data[0]||{}),f=re=>hd.find(h=>re.test(h.trim())),K={id:f(/order\s*id/i),loc:f(/location/i),name:f(/customer\s*name/i),em:f(/email/i),note:f(/note/i),pr:f(/^product$/i),ty:f(/^type$/i),sz:f(/product\s*size|^size$/i),q:f(/^quantity|^qty/i),dt:f(/pickup\s*date|^date/i)};
 const miss=['id','loc','name','pr','sz','q'].filter(k=>!K[k]);if(miss.length)throw Error('Missing column(s): '+miss.join(', '));
 const m=new Map();for(const r of data){const id=(r[K.id]||'').trim();if(!id)continue;if(!m.has(id))m.set(id,{id,name:(r[K.name]||'').trim(),email:(r[K.em]||'').trim(),note:(r[K.note]||'').trim(),loc:ap('loc',(r[K.loc]||'').trim()),date:(K.dt?(r[K.dt]||''):'').trim(),items:[],fn:0});
 const o=m.get(id);let p=(r[K.pr]||'').trim(),t=(r[K.ty]||'').trim();const hm=p.match(/\s-\s*(Hexcell.*)$/i);if(hm&&!t){t=hm[1];p=p.replace(hm[0],'')}
 const st=S.fk&&p.toLowerCase().includes(S.fk.toLowerCase());if(st)o.fn=1;let q=(parseFloat(r[K.sz])||1)*(parseFloat(r[K.q])||1);const v=+q.toFixed(4);q=String(+q.toFixed(2));if(q.startsWith('0.'))q=q.slice(1);
 o.items.push({item:ap('item',kk(p)),size:ap('size',kk(t)),q,v,st})}
 return[...m.values()]}
function parseSupplier(data){const{ap,kk}=cleaners(),hd=Object.keys(data[0]||{}),f=re=>hd.find(h=>re.test(h.trim())),K={pr:f(/^product$/i),sku:f(/sku/i),ty:f(/^type$/i),c:f(/quantity\s*calc/i),oq:f(/order\s*quantity/i),ex:f(/^extra/i),tq:f(/total\s*qty/i),sz:f(/^product\s*size$/i)};
 const miss=['pr','c'].filter(k=>!K[k]);if(miss.length)throw Error('Supplier CSV is missing column(s): '+miss.join(', '));
 const m=new Map();for(const r of data){let p=(r[K.pr]||'').replace(/\s*\[Combined by Supplier SKU\]/i,'').trim(),t=(K.ty?(r[K.ty]||''):'').trim();if(!p)continue;
 const hm=p.match(/\s-\s*(Hexcell.*)$/i);if(hm){if(!t)t=hm[1];p=p.replace(hm[0],'')}
 if(K.tq){p=p.replace(/,\s*[\d.]+$/,'');const ci=p.indexOf(' - ');if(ci>0)p=p.slice(0,ci)}
 p=ap('item',kk(p));t=ap('size',kk(t));const k=p+'\u0001'+t;let sku=(K.sku?(r[K.sku]||''):'').trim();if(/^field_/i.test(sku))sku='custom';
 const e=m.get(k)||{item:p,size:t,skus:[],need:0,oq:0,ex:0};if(sku&&!e.skus.includes(sku))e.skus.push(sku);let nd=(+r[K.c])||0;if(K.tq&&!nd)nd=(+r[K.sz]||0)*(+r[K.tq]||0);e.need+=nd;e.oq+=(K.oq?(+r[K.oq]):0)||0;e.ex+=(K.ex?(+r[K.ex]):0)||0;m.set(k,e)}
 return[...m.values()].sort((a,b)=>a.item.toLowerCase()<b.item.toLowerCase()?-1:a.item.toLowerCase()>b.item.toLowerCase()?1:a.size<b.size?-1:a.size>b.size?1:0)}
function colors(os){const P=S.cl.match(/#[0-9a-f]{6}/gi)||FB,CM={};[...new Set(os.map(o=>o.loc))].sort((a,b)=>b.toLowerCase().localeCompare(a.toLowerCase())).forEach((l,i)=>CM[l]=P[i%P.length]);return CM}
function rec(d,x0,y0,o,CM,qr){const L=x0+21.6,R=x0+284.4,IW=262.8,top=y0+21.6,bot=y0+374.4,red=hx(S.rd);
 const ow=Math.max(W(d,'ORDER',12,1),W(d,'#'+o.id,12,1));let ns=18;while(W(d,o.name,ns,1)+ow+10>IW&&ns>9)ns-=.5;
 T(d,o.name,L,top+13.5,{s:ns,b:1});T(d,'ORDER',R,top+11,{s:12,b:1,al:'r'});T(d,'#'+o.id,R,top+24.8,{s:12,b:1,al:'r'});
 if(o.email)T(d,o.email,L,top+31.5,{s:12.5});
 let ls=14.5;const ih=1.3*14.5,iw=ih*.652;while(W(d,o.loc,ls,1)+iw+5>IW&&ls>8)ls-=.25;
 pin(d,L,top+57-ls*.36-ih/2,iw,ih,hx(CM[o.loc]));T(d,o.loc,L+iw+5,top+57,{s:ls,b:1});
 let sm=11,a,b,c;for(;sm>7;sm-=.25){a=Math.max(W(d,'ITEM',sm,1),...o.items.map(i=>W(d,i.item,sm)+(i.st?sm*.9+4:0)));b=Math.max(W(d,'SIZE',sm,1),...o.items.map(i=>W(d,i.size,sm)));c=Math.max(W(d,'QTY',sm,1),...o.items.map(i=>W(d,i.q,sm,1)));if(a+b+c+16.5<=IW)break}
 const ex=(IW-a-b-c-16.5)/2,xs=L+2+a+ex+5.5;let y=top+88;
 T(d,'ITEM',L+2,y,{s:sm,b:1});T(d,'SIZE',xs,y,{s:sm,b:1});T(d,'QTY',R-2,y,{s:sm,b:1,al:'r'});
 d.setDrawColor(...hx(S.ac));d.setLineWidth(.4);d.line(L,y+5.5,R,y+5.5);y+=21;
 for(const i of o.items){const w=T(d,i.item,L+2,y,{s:sm});if(i.st)star(d,L+2+w+4+sm*.45,y-sm*.36,sm*.45,red);T(d,i.size,xs,y,{s:sm});T(d,i.q,R-2,y,{s:sm,b:1,al:'r'});y+=sm*1.62}
 y+=2;if(o.note){const wn=T(d,'Note:',L,y,{s:10.5,b:1});d.setFont('helvetica','normal');d.setFontSize(10.5);d.setCharSpace(0);d.splitTextToSize(o.note,IW-wn-8).forEach((t,k)=>T(d,t,L+wn+4,y+k*12.5,{s:10.5}));y+=d.splitTextToSize(o.note,IW-wn-8).length*12.5+3}
 if(o.fn){const r=4,tx=S.fn.toUpperCase();d.setFont('helvetica','bold');d.setFontSize(9);d.setCharSpace(0);const ls2=d.splitTextToSize(tx,(IW-2*r-6)*.92);star(d,L+r,y-3.2,r,red);ls2.forEach((t,k)=>T(d,t,L+2*r+4,y+k*11,{s:9,b:1,c:red,cs:.3}))}
 const Q=57.6,P=6,BW=Q+2*P,BH=Q+2*P,qt=bot-BH;let z1=13,z2=10;while(W(d,S.h1,z1,1)>IW&&z1>7)z1-=.25;while(W(d,S.h2,z2)>IW&&z2>6)z2-=.25;T(d,S.h2,L,qt-14,{s:z2});T(d,S.h1,L,qt-14-z2-3.5,{s:z1,b:1});
 const box=(x,q,lab,top)=>{const n=q.getModuleCount(),cs=Q/n,cx=x+BW/2,ey=top?qt:qt+BH,w=W(d,lab,7,1,1.2)-1.2;d.setDrawColor(0,0,0);d.setLineWidth(.9);d.roundedRect(x,qt,BW,BH,3,3,'S');d.setFillColor(255,255,255);d.rect(cx-w/2-3.5,ey-4.5,w+7,9,'F');d.setFillColor(0,0,0);for(let r=0;r<n;r++)for(let k=0;k<n;k++)if(q.isDark(r,k))d.rect(x+P+k*cs,qt+P+r*cs,cs+.15,cs+.15,'F');T(d,lab,cx-w/2,ey+2.5,{s:7,b:1,cs:1.2})};
 box(L,qr,'HELP',1);const sq=qrcode(0,'M');sq.addData(S.sq||' ');sq.make();box(R-BW,sq,'SHOP',0);
 const ch=(S.ch||'').trim().toUpperCase(),lh=Q*.9,lw=S.logo?lh*S.logoAR:0,cap=7.5*.72,blk=(lw?lh+4:0)+(ch?cap:0),by=qt+(BH-blk)/2;
 if(lw)d.addImage(S.logo,'PNG',L+BW+(IW-2*BW-lw)/2,by,lw,lh);
 if(ch){const wl=W(d,ch,7.5,1,1.2)-1.2;T(d,ch,L+IW/2-wl/2-3,by+(lw?lh+4:0)+cap,{s:7.5,b:1,cs:1.2})}}
function pdf(os,doc){const{jsPDF}=window.jspdf,d=doc||new jsPDF({unit:'pt',format:'letter'}),CM=colors(os),qr=qrcode(0,'M');qr.addData(S.qr||' ');qr.make();
 os.forEach((o,i)=>{const k=i%4;if(!k&&i)d.addPage();if(!k){d.setDrawColor(0,0,0);d.setLineWidth(.75);d.line(7.2,396,18,396);d.line(594,396,604.8,396);d.line(306,7.2,306,18);d.line(306,774,306,784.8)}rec(d,(k%2)*306,k>1?396:0,o,CM,qr)});return d}
function save(d,name,msg,pv){try{if(pv)window.open(d.output('bloburl'),'_blank');else d.save(name);msg.textContent=pv?'Preview opened in a new tab.':'Created '+name}catch(e){msg.textContent='Could not create the PDF: '+(e.message||e)}}
function fill(){$('#qr').value=S.qr;$('#sq').value=S.sq;$('#ch').value=S.ch;$('#h1').value=S.h1;$('#h2').value=S.h2;$('#fk').value=S.fk;$('#fn').value=S.fn;$('#ac').value=S.ac;$('#rd').value=S.rd;$('#cl').value=S.cl;$('#ru').value=S.ru;$('#lp').src=S.logo||''}
function read(){S={...S,qr:$('#qr').value.trim(),sq:$('#sq').value.trim(),ch:$('#ch').value.trim(),h1:$('#h1').value,h2:$('#h2').value,fk:$('#fk').value.trim(),fn:$('#fn').value,ac:$('#ac').value,rd:$('#rd').value,cl:$('#cl').value,ru:$('#ru').value}}
if($('#sv')){$('#logo').onchange=e=>{const f=e.target.files[0];if(!f)return;const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,600/im.width),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);S.logo=c.toDataURL('image/png');S.logoAR=c.width/c.height;$('#lp').src=S.logo};im.src=fr.result};fr.readAsDataURL(f)};
$('#sv').onclick=async()=>{read();const m=$('#am');try{const f=new FormData();f.append('action','dmvb_save_design');f.append('_wpnonce',WPD.nonce);f.append('design',JSON.stringify(S));const r=await fetch(WPD.ajax,{method:'POST',body:f,credentials:'same-origin'}),j=await r.json();if(!j.success)throw Error(j.data||'save failed');m.textContent='Saved. Everyone using the plugin now gets this design.'}catch(e){m.textContent='Not saved: '+(e.message||e)}};
$('#ts').onclick=()=>{read();const r=Papa.parse(SAMPLE,{header:true,skipEmptyLines:true});const o=parse(r.data);$('#am').textContent='';save(pdf(o),'sample-receipts.pdf',$('#am'))};
$('#rs').onclick=()=>{S={...S,sq:DEF.sq,ch:DEF.ch,cl:DEF.cl,ru:DEF.ru,h1:DEF.h1,h2:DEF.h2,fn:DEF.fn,fk:DEF.fk,qr:DEF.qr};fill()};
fill()}
window.DMVBApi={parse,parseSupplier,pdf,colors,get S(){return S}};
