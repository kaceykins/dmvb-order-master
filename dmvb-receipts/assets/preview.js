/* DMVb Receipts: side-by-side preview of Receipts + Order List Master */
(function(){
var $=function(s){return document.querySelector(s)},A=window.DMVBApi,M=window.DMVBMaster;
if(!$('#m_go')||!A||!M)return;
var rows=null,sup=null,urls={},docs={},os=null,msg=$('#m_msg');
function say(t,bad){msg.textContent=t||'';msg.style.color=bad?'#b32d2e':''}
function revoke(){Object.keys(urls).forEach(function(k){try{URL.revokeObjectURL(urls[k].split('#')[0])}catch(e){}});urls={};docs={}}
function sortOrders(o){var s=$('#m_sort').value;o.sort(function(a,b){return s=='id'?a.id.localeCompare(b.id,undefined,{numeric:true}):(a[s].toLowerCase()<b[s].toLowerCase()?-1:1)});return o}
function url(d){return d.output('bloburl')+'#view=FitH&toolbar=1'}
function build(){
 if(!rows&&!sup){say('Choose an orders CSV, a supplier CSV, or both.',1);return}
 try{
  say('Building…');revoke();
  var S=A.S,hasR=!!rows;
  os=hasR?sortOrders(A.parse(rows)):[];
  if(hasR){docs.r=A.pdf(os);urls.r=url(docs.r);$('#fr').src=urls.r;$('#nr').textContent=docs.r.getNumberOfPages()+' page(s)'}
  docs.m=M.build(os,sup,S,{});urls.m=url(docs.m);$('#fm').src=urls.m;$('#nm').textContent=docs.m.getNumberOfPages()+' page(s)';
  $('#pr').classList.toggle('hide',!hasR);
  $('#m_view').classList.remove('hide');
  $('#m_view').classList.toggle('one',!hasR);
  $('#bth').classList.toggle('hide',!hasR);
  ['rp','rd','rn','mp','md','mn','bp','bd'].forEach(function(i){$('#'+i).disabled=false});
  say(hasR?os.length+' orders'+(sup?' · supplier list included':' · no supplier CSV, so the master totals come from the orders'):'Supplier list only (the master\'s first page).');
 }catch(e){say('Could not build: '+(e.message||e),1)}
}
function combined(){
 if(!docs.c){var d=A.pdf(os);M.build(os,sup,A.S,{append:true},d);docs.c=d}
 return docs.c;
}
function printFrame(id){var f=$(id);try{f.contentWindow.focus();f.contentWindow.print()}catch(e){window.open(f.src,'_blank')}}
function printDoc(d){
 var u=d.output('bloburl'),f=document.createElement('iframe');
 f.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0';f.src=u;
 f.onload=function(){try{f.contentWindow.focus();f.contentWindow.print()}catch(e){window.open(u,'_blank')}};
 document.body.appendChild(f);setTimeout(function(){f.remove()},120000)}
function parseFile(f,cb){var fr=new FileReader();fr.onload=function(){var t=String(fr.result).replace(/^\uFEFF/,''),L=t.split(/\r?\n/),i=0;
 /* some exports start with a title line; start at the real header row */
 for(;i<L.length&&i<5;i++){if(/product/i.test(L[i])&&/(sku|order id|customer)/i.test(L[i]))break}
 if(i>=L.length||i>=5)i=0;
 Papa.parse(L.slice(i).join('\n'),{header:true,skipEmptyLines:true,complete:function(r){cb(r.data)}})};fr.readAsText(f)}
$('#m_csv').onchange=function(e){var f=e.target.files[0];if(!f){rows=null;if(sup)build();else $('#m_view').classList.add('hide');return}parseFile(f,function(r){rows=r;build()})};
$('#m_csv2').onchange=function(e){var f=e.target.files[0];if(!f){sup=null;if(rows)build();else $('#m_view').classList.add('hide');return}parseFile(f,function(r){try{sup=A.parseSupplier(r)}catch(x){sup=null;say(x.message,1);return}build()})};
$('#m_sort').onchange=function(){if(rows)build()};
$('#m_go').onclick=build;
$('#rp').onclick=function(){printFrame('#fr')};
$('#mp').onclick=function(){printFrame('#fm')};
$('#rd').onclick=function(){docs.r.save('receipts.pdf')};
$('#md').onclick=function(){docs.m.save('order-list-master.pdf')};
$('#rn').onclick=function(){window.open(urls.r,'_blank')};
$('#mn').onclick=function(){window.open(urls.m,'_blank')};
$('#bp').onclick=function(){try{printDoc(combined())}catch(e){say(e.message,1)}};
$('#bd').onclick=function(){try{combined().save('receipts-and-order-list-master.pdf')}catch(e){say(e.message,1)}};
})();
