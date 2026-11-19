(function(){
'use strict';
const D=window.PF_DATA, CFG=window.PF_CONFIG||{};
let VIDS=Object.assign({},window.PF_VIDEOS||{});
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='pf_state_v1';
const DIAS_JS=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
const MESES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const NO_KG=new Set(['abdomen','flexiones','fondos-banco']);

/* ---------- fechas ---------- */
const iso=d=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*6e4);return z.toISOString().slice(0,10)};
const hoyISO=()=>iso(new Date());
function lunesISO(d){d=new Date(d||Date.now());const w=(d.getDay()+6)%7;d.setDate(d.getDate()-w);return iso(d)}
const fmt=s=>{const [y,m,d]=s.split('-');return d+'/'+m+'/'+y};

/* ---------- estado ---------- */
function nuevoPerfil(){return{semana:1,inicio:lunesISO(),checks:{},pesos:{},hechos:{},extras:{},hist:[],entrenos:[],ultimos:{}}}
let S;
try{S=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){S={}}
S.perfiles=S.perfiles||{}; S.nombre=S.nombre||'';
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
function P(r){r=r||S.rutina;if(!S.perfiles[r])S.perfiles[r]=nuevoPerfil();return S.perfiles[r]}
const rut=r=>D.rutinas[r||S.rutina];

/* ---------- calculos ---------- */
function totalSeries(r){let t=0;rut(r).dias.forEach(d=>d.ejercicios.forEach(e=>t+=e.series));return t}
function seriesHechas(r){return Object.keys(P(r).checks).filter(k=>P(r).checks[k]).length}
function diaPct(r,d){let t=0,h=0;const p=P(r);d.ejercicios.forEach((e,i)=>{for(let s=0;s<e.series;s++){t++;if(p.checks[d.id+'|'+i+'|'+s])h++}});return t?Math.round(h*100/t):0}
function semanaPct(r){const t=totalSeries(r);return t?Math.round(seriesHechas(r)*100/t):0}
function diasHechos(r){return Object.keys(P(r).hechos).length}
function racha(r){const h=P(r).hist;let n=0;for(let i=h.length-1;i>=0;i--){if(h[i].completa)n++;else break}return n}
function semanasCompletas(r){return P(r).hist.filter(x=>x.completa).length}
const MEDALLAS=[
 {id:'m0',ico:'🥉',t:'Primer entreno',d:'Completa tu primer día',f:p=>p.entrenos.length>=1},
 {id:'m1',ico:'🏅',t:'Semana 1',d:'1 semana completa',f:(p,r)=>semanasCompletas(r)>=1},
 {id:'m2',ico:'🥈',t:'Un mes',d:'4 semanas completas',f:(p,r)=>semanasCompletas(r)>=4},
 {id:'m3',ico:'🔥',t:'Racha x3',d:'3 semanas seguidas',f:(p,r)=>racha(r)>=3},
 {id:'m4',ico:'🥇',t:'Dos meses',d:'8 semanas completas',f:(p,r)=>semanasCompletas(r)>=8},
 {id:'m5',ico:'💪',t:'50 entrenos',d:'50 días entrenados',f:p=>p.entrenos.length>=50},
 {id:'m6',ico:'🏆',t:'Platino',d:'12 semanas completas',f:(p,r)=>semanasCompletas(r)>=12},
 {id:'m7',ico:'🌎',t:'Leyenda Planeta',d:'24 semanas completas',f:(p,r)=>semanasCompletas(r)>=24},
 {id:'m8',ico:'💎',t:'Diamante',d:'100 días entrenados',f:p=>p.entrenos.length>=100}];
const medallasGanadas=r=>MEDALLAS.filter(m=>m.f(P(r),r));

function hayActividad(p){return Object.keys(p.checks).length||Object.keys(p.hechos).length||Object.keys(p.extras).length}
function cerrarSemana(r,silent){
  const p=P(r),R=rut(r),dh=Object.keys(p.hechos).length;
  p.hist.push({semana:p.semana,inicio:p.inicio,dias:dh,total:R.dias.length,pct:semanaPct(r),completa:dh>=R.dias.length});
  p.semana++;p.inicio=lunesISO();p.checks={};p.pesos={};p.hechos={};p.extras={};save();
  if(!silent)toast('¡Semana '+(p.semana-1)+' guardada! Vamos por la semana '+p.semana+' 💪');
}
function autoSemana(){Object.keys(S.perfiles).forEach(r=>{const p=S.perfiles[r];if(!D.rutinas[r])return;if(p.inicio!==lunesISO()){if(hayActividad(p)){cerrarSemana(r,true);if(r===S.rutina)setTimeout(()=>toast('Nueva semana: ¡semana '+p.semana+'! 🔥'),600)}else{p.inicio=lunesISO();save()}}})}

/* ---------- video ---------- */
function vid(id){return VIDS[id]||{url:'https://www.youtube.com/results?search_query='+encodeURIComponent('como hacer '+id.replace(/-/g,' ')+' tecnica'),tipo:'busqueda'}}
function ytId(u){const m=String(u).match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/);return m?m[1]:null}

/* ---------- maquinas ---------- */
const MAQ=D.maquinas||[];
const ejMaq={};MAQ.forEach(m=>m.ejercicios.forEach(e=>{(ejMaq[e.video]=ejMaq[e.video]||[]).includes(m.codigo)||ejMaq[e.video].push(m.codigo)}));

/* ---------- vistas ---------- */
function show(v){['vHome','vRutina','vProgreso'].forEach(x=>$('#'+x).hidden=x!==v);$('#topbar').hidden=v==='vHome';window.scrollTo(0,0)}
function footer(){const g=D.gym;return '<b>'+esc(g.nombre)+'</b><br>'+esc(g.direccion)+' · '+esc(g.ciudad)+'<br>Cel: '+g.celulares.map(c=>'<a href="https://wa.me/57'+c.replace(/\D/g,'')+'">'+esc(c)+'</a>').join(' – ')}
let diaSel=null;

function home(){
  show('vHome');$('#inNombre').value=S.nombre;saludo();
  $('#maqList').innerHTML=MAQ.map(m=>'<button class="maq" data-maq="'+m.codigo+'" id="maq-card-'+m.codigo+'"><img loading="lazy" src="'+esc(m.foto)+'" alt="">'+(m.galeria&&m.galeria.length>1?'<i class="gcount">📷 '+m.galeria.length+'</i>':'')+'<span><b>'+m.codigo+'</b> · '+esc(m.nombre)+(m.incierto?' <em class="tagc">por confirmar</em>':'')+'</span></button>').join('');
  $('#homeMaquinas').hidden=!MAQ.length;
}
function saludo(){const n=S.nombre.trim();$('#saludo').textContent=n?('¡Hola, '+n+'! Elige tu rutina y a darle con toda 🔥'):'Tu nombre se guarda solo en este celular.'}

function abrirRutina(r,diaId){
  if(!D.rutinas[r])return home();
  S.rutina=r;save();P(r);autoSemana();
  $('#topTitle').textContent=rut(r).titulo+(S.nombre?' · '+S.nombre:'');
  const R=rut(r),hoy=DIAS_JS[new Date().getDay()];
  diaSel=diaId||(R.dias.find(d=>d.id===hoy&&!P().hechos[d.id])||R.dias.find(d=>!P().hechos[d.id])||R.dias[0]).id;
  $('#dailyList').innerHTML=D.todosLosDias.map(t=>'<li>'+esc(t)+'</li>').join('');
  show('vRutina');renderStats();renderTabs();renderDia();
}
function renderStats(){
  const r=S.rutina,p=P(),pct=semanaPct(r);
  $('#stSemana').textContent=p.semana;$('#stRacha').textContent=racha(r)+'🔥';
  $('#stDias').textContent=diasHechos(r)+'/'+rut().dias.length;$('#stMedallas').textContent=medallasGanadas(r).length;
  $('#barFill').style.width=pct+'%';
  $('#stTexto').textContent=pct+'% de la semana completado · semana del '+fmt(p.inicio);
}
function renderTabs(){
  $('#dayTabs').innerHTML=rut().dias.map(d=>'<button role="tab" class="tab'+(d.id===diaSel?' on':'')+(P().hechos[d.id]?' done':'')+'" data-dia="'+d.id+'">'+esc(d.nombre)+'</button>').join('');
}
function renderDia(){
  const d=rut().dias.find(x=>x.id===diaSel),p=P(),pct=diaPct(S.rutina,d);
  let h='<div class="dayhead"><div><h2>'+esc(d.nombre)+'</h2><p>'+esc(d.foco)+'</p></div><div class="pct" id="dayPct">'+pct+'%</div></div>';
  h+=step('cal','🔥 '+D.todosLosDias[0]);
  d.ejercicios.forEach((e,i)=>{
    const ej=D.ejercicios[e.id],v=vid(e.id),k=d.id+'|'+i;
    let done=true;for(let s=0;s<e.series;s++)if(!p.checks[k+'|'+s])done=false;
    h+='<article class="ex'+(done?' complete':'')+'" id="ej-'+e.id+'" data-ej="'+e.id+'">';
    h+='<div class="ex-top"><div class="ex-num">'+(i+1)+'</div><div><h3 class="ex-name" data-open="'+e.id+'">'+esc(e.nombre)+'</h3><p class="ex-task">'+esc(e.tarea)+'</p><p class="ex-mus">💪 '+esc(ej.principales)+(ej.secundarios&&ej.secundarios!=='—'?' · <span>'+esc(ej.secundarios)+'</span>':'')+'</p></div></div>';
    h+='<div class="ex-body"><div class="ex-actions"><a class="btn gold" href="'+esc(v.url)+'" target="_blank" rel="noopener">▶ Ver cómo se hace</a><button class="btn ghost" data-open="'+e.id+'">Ficha</button>'+
      (ejMaq[e.id]||[]).map(c=>'<button class="btn ghost" data-maq="'+c+'">📍 '+c+'</button>').join('')+'</div>';
    h+='<ul class="tips">'+ej.tips.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul><p class="err"><b>Error común:</b> '+esc(ej.error)+'</p>';
    h+='<div class="sets">';
    for(let s=0;s<e.series;s++){h+='<label class="set"><input type="checkbox" data-k="'+k+'|'+s+'"'+(p.checks[k+'|'+s]?' checked':'')+' aria-label="Serie '+(s+1)+'"><span>'+(e.series>1?'S'+(s+1):'Hecho')+'</span></label>'}
    if(!NO_KG.has(e.id))h+='<label class="kg"><input type="number" inputmode="decimal" min="0" step="0.5" placeholder="kg" data-kg="'+k+'" data-ejid="'+e.id+'" value="'+esc(p.pesos[k]||'')+'"><small>kg</small></label>';
    h+='</div>';
    if(!NO_KG.has(e.id)&&p.ultimos[e.id])h+='<p class="lastkg">Último peso registrado: <b>'+esc(p.ultimos[e.id])+' kg</b></p>';
    h+='</div></article>';
  });
  h+=step('cardio','🏃 '+D.todosLosDias[1]);
  const hecho=p.hechos[d.id];
  h+='<div class="daydone">'+(hecho?'<button class="btn ok block" id="btnDia">✓ Día completado ('+fmt(hecho)+') · desmarcar</button>':'<button class="btn gold block" id="btnDia">Marcar '+esc(d.nombre)+' como completado</button>')+'</div>';
  $('#dayView').innerHTML=h;
  $('#footRut').innerHTML=footer();
  function step(id,txt){const k=d.id+'|'+id;return '<div class="step"><label for="x-'+id+'">'+esc(txt)+'</label><label class="set"><input id="x-'+id+'" type="checkbox" data-x="'+k+'"'+(p.extras[k]?' checked':'')+'><span>✓</span></label></div>'}
}
function actualizarDia(){const d=rut().dias.find(x=>x.id===diaSel);$('#dayPct').textContent=diaPct(S.rutina,d)+'%';
  d.ejercicios.forEach((e,i)=>{let ok=true;for(let s=0;s<e.series;s++)if(!P().checks[d.id+'|'+i+'|'+s])ok=false;const el=$$('#dayView .ex')[i];el&&el.classList.toggle('complete',ok)});
  renderStats();
  if(diaPct(S.rutina,d)===100&&!P().hechos[d.id])toast('¡Todas las series listas! Marca el día como completado 🏆');
}
function marcarDia(){
  const p=P(),d=diaSel;
  if(p.hechos[d]){delete p.hechos[d]}else{const t=hoyISO();p.hechos[d]=t;if(!p.entrenos.includes(t))p.entrenos.push(t);
    const antes=medallasGanadas(S.rutina).length;
    const all=rut().dias.every(x=>p.hechos[x.id]);
    toast(all?'¡SEMANA COMPLETA! Eres una máquina 🏆🔥':'¡Día completado! '+(S.nombre?S.nombre+', ':'')+'sigue así 💪');
    const sig=rut().dias.find(x=>!p.hechos[x.id]); if(sig&&!all)diaSel=sig.id;}
  save();renderTabs();renderDia();renderStats();window.scrollTo({top:0,behavior:'smooth'});
}

/* ---------- progreso ---------- */
let calRef=new Date();calRef.setDate(1);
function progreso(){
  if(!S.rutina)return home();
  const r=S.rutina,p=P();show('vProgreso');
  $('#topTitle').textContent='Mi progreso';
  $('#pgNombre').textContent=(S.nombre?S.nombre+' · ':'')+rut().titulo;
  $('#pgSemana').textContent=p.semana;$('#pgRacha').textContent=racha(r)+' 🔥';$('#pgTotal').textContent=p.entrenos.length;
  renderCal();
  const g=new Set(medallasGanadas(r).map(m=>m.id));
  $('#medals').innerHTML=MEDALLAS.map(m=>'<div class="medal'+(g.has(m.id)?' got':'')+'"><div class="m">'+m.ico+'</div><b>'+esc(m.t)+'</b><small>'+esc(m.d)+'</small></div>').join('');
  const hs=p.hist.slice().reverse();
  $('#hist').innerHTML='<div class="hrow"><span>Semana '+p.semana+' (actual) · '+fmt(p.inicio)+'</span><b>'+diasHechos(r)+'/'+rut().dias.length+' días · '+semanaPct(r)+'%</b></div>'+
    (hs.length?hs.map(h=>'<div class="hrow"><span>'+(h.completa?'✅':'▫️')+' Semana '+h.semana+' · '+fmt(h.inicio)+'</span><b>'+h.dias+'/'+h.total+' días · '+h.pct+'%</b></div>').join(''):'<p class="small muted">Aún no hay semanas cerradas.</p>');
  $('#footRut').innerHTML=footer();
}
function renderCal(){
  const p=P(),y=calRef.getFullYear(),m=calRef.getMonth(),set=new Set(p.entrenos),hoy=hoyISO();
  $('#calMes').textContent=MESES[m]+' '+y;
  let h=['L','M','X','J','V','S','D'].map(x=>'<div class="dn">'+x+'</div>').join('');
  const first=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate();
  for(let i=0;i<first;i++)h+='<div></div>';
  for(let d=1;d<=n;d++){const s=iso(new Date(y,m,d));h+='<div class="d'+(set.has(s)?' on':'')+(s===hoy?' today':'')+'">'+d+'</div>'}
  $('#cal').innerHTML=h;
}

/* ---------- fichas ---------- */
function videoBlock(id){
  const v=vid(id),y=ytId(v.url);
  if(!y)return '<a class="btn gold block" href="'+esc(v.url)+'" target="_blank" rel="noopener">▶ Buscar video de cómo se hace</a>';
  return '<div class="vid" style="background-image:url(https://i.ytimg.com/vi/'+y+'/hqdefault.jpg)" data-yt="'+y+'"><button class="play" aria-label="Reproducir"><span>▶</span></button></div><a class="btn gold block" href="'+esc(v.url)+'" target="_blank" rel="noopener">▶ Ver en YouTube</a>';
}
function enRutinas(id){const out=[];Object.keys(D.rutinas).forEach(r=>D.rutinas[r].dias.forEach(d=>d.ejercicios.forEach(e=>{if(e.id===id)out.push({r,d,e})})));return out}
function fichaEj(id){
  const ej=D.ejercicios[id];if(!ej)return;
  const u=enRutinas(id);
  let h='<h2>'+esc(ej.nombre)+'</h2><p class="pat">'+esc(ej.patron)+'</p>'+videoBlock(id);
  h+='<div class="mus"><div><small>PRINCIPALES</small><b>'+esc(ej.principales)+'</b></div><div><small>SECUNDARIOS</small><b>'+esc(ej.secundarios)+'</b></div></div>';
  h+='<h3 class="h3">Cómo hacerlo</h3><ol class="tips">'+ej.tips.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol><p class="err"><b>Error común:</b> '+esc(ej.error)+'</p>';
  if((ejMaq[id]||[]).length)h+='<p>'+ejMaq[id].map(c=>'<button class="btn ghost" data-maq="'+c+'">📍 Máquina '+c+'</button>').join(' ')+'</p>';
  if(u.length)h+='<h3 class="h3">En las rutinas</h3><p class="in-rut">'+u.map(x=>'<a href="?r='+x.r+'#ej-'+id+'" data-go="'+x.r+'|'+x.d.id+'|'+id+'" style="color:var(--gold2)">'+esc(D.rutinas[x.r].titulo)+' · '+esc(x.d.nombre)+'</a>: '+esc(x.e.tarea)).join('<br>')+'</p>';
  openSheet(h);
}
function fichaMaq(code){
  code=String(code).toUpperCase();
  const m=MAQ.find(x=>x.codigo===code)||MAQ.find(x=>x.codigo===code+'A');if(!m)return;
  let h='<h2>'+esc(m.codigo)+' · '+esc(m.nombre)+'</h2><p class="pat">'+esc([m.marca,m.tipo].filter(Boolean).join(' · '))+'</p>';
  const gal=m.galeria&&m.galeria.length?m.galeria:[{src:m.foto}];
  h+='<div class="gal">'+gal.map((g,i)=>'<figure><img class="mphoto" loading="lazy" src="'+esc(g.src)+'" alt="Foto '+(i+1)+' de '+esc(m.codigo)+'"><figcaption>'+(i+1)+'/'+gal.length+(g.detalle?' · detalle':'')+(g.contexto?' · también aparece aquí':'')+'</figcaption></figure>').join('')+'</div>';
  if(gal.length>1)h+='<p class="small muted" style="margin:-4px 0 8px">Desliza para ver las '+gal.length+' fotos →</p>';
  if(m.incierto)h+='<p><em class="tagc">por confirmar</em> <span class="small" style="color:#ffcf6b">Identificación por confirmar con el entrenador en sala.</span></p>';
  h+='<p class="ex-mus" style="font-size:.9rem">💪 '+esc(m.musculos.join(', '))+'</p>';
  m.ejercicios.forEach(e=>{
    h+='<div class="card"><h3 class="h3">'+esc(e.nombre)+'</h3>'+videoBlock(e.video);
    h+='<p><b style="color:var(--gold)">Posición inicial:</b> '+esc(e.inicial)+'</p><p><b style="color:var(--gold)">Ejecución:</b> '+esc(e.ejecucion)+'</p>';
    h+='<p class="err"><b>Errores comunes:</b> '+esc(e.errores.join(' · '))+'</p><p class="small muted">🫁 '+esc(e.respiracion)+'</p>';
    const ss=Object.keys(e.series||{}).map(k=>'<b>'+esc(k)+':</b> '+esc(e.series[k])).join(' · ');if(ss)h+='<p class="small">'+ss+'</p>';
    if(D.ejercicios[e.video])h+='<button class="btn ghost" data-open="'+e.video+'">Ver ficha del ejercicio</button>';
    h+='</div>';
  });
  openSheet(h);
}
function openSheet(h){$('#sheetBody').innerHTML=h;$('#sheet').hidden=false;$('#sheetBg').hidden=false;$('#sheet').scrollTop=0}
function closeSheet(){$('#sheet').hidden=true;$('#sheetBg').hidden=true;$('#sheetBody').innerHTML='';if(/^#(ej|maq)-/.test(location.hash))history.replaceState(null,'',location.pathname+location.search)}

/* ---------- toast ---------- */
let tt;function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(tt);tt=setTimeout(()=>el.hidden=true,2800)}

/* ---------- compartir ---------- */
function baseURL(){return /^https?:/.test(location.protocol)&&!/^(localhost|127\.)/.test(location.hostname)?location.origin+location.pathname.replace(/index\.html$/,''):(CFG.BASE_URL||'')}
function compartir(){const u=baseURL()+'?r='+S.rutina;const t='💪 Mi '+rut().titulo+' de Planeta Fitness, con video de cada ejercicio: '+u;
  if(navigator.share)navigator.share({title:'Planeta Fitness',text:t}).catch(()=>{});else window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank')}

/* ---------- eventos ---------- */
document.addEventListener('click',ev=>{
  const t=ev.target.closest('[data-r],[data-dia],[data-open],[data-maq],[data-go],.play,#btnDia,#btnHome,#btnMenu,#sheetClose,#sheetBg,#calPrev,#calNext,#btnNuevaSemana,#btnResetSemana,#btnCambiarRutina,#btnCompartir');
  if(!t)return;
  if(t.dataset.go){ev.preventDefault();const [r,d,id]=t.dataset.go.split('|');closeSheet();abrirRutina(r,d);irA(id);return}
  if(t.dataset.r){abrirRutina(t.dataset.r);history.replaceState(null,'','?r='+t.dataset.r);return}
  if(t.dataset.dia){diaSel=t.dataset.dia;renderTabs();renderDia();return}
  if(t.dataset.open){fichaEj(t.dataset.open);return}
  if(t.dataset.maq){fichaMaq(t.dataset.maq);return}
  if(t.classList.contains('play')){const b=t.parentNode;b.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+b.dataset.yt+'?autoplay=1&rel=0&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Video"></iframe>';return}
  switch(t.id){
    case 'btnDia':marcarDia();break;
    case 'btnHome':if(!$('#vProgreso').hidden&&S.rutina)abrirRutina(S.rutina,diaSel);else{history.replaceState(null,'',location.pathname);home()}break;
    case 'btnMenu':progreso();break;
    case 'sheetClose':case 'sheetBg':closeSheet();break;
    case 'calPrev':calRef.setMonth(calRef.getMonth()-1);renderCal();break;
    case 'calNext':calRef.setMonth(calRef.getMonth()+1);renderCal();break;
    case 'btnNuevaSemana':if(confirm('¿Guardar esta semana en tu historial y empezar la semana '+(P().semana+1)+'?')){cerrarSemana(S.rutina);progreso()}break;
    case 'btnResetSemana':if(confirm('¿Borrar todas las marcas y pesos de esta semana?')){const p=P();p.checks={};p.pesos={};p.hechos={};p.extras={};save();toast('Semana reiniciada');progreso()}break;
    case 'btnCambiarRutina':history.replaceState(null,'',location.pathname);home();break;
    case 'btnCompartir':compartir();break;
  }
});
document.addEventListener('change',ev=>{
  const t=ev.target,p=S.rutina&&P();if(!p)return;
  if(t.dataset.k){if(t.checked)p.checks[t.dataset.k]=1;else delete p.checks[t.dataset.k];save();actualizarDia();if(t.checked&&navigator.vibrate)navigator.vibrate(15)}
  else if(t.dataset.x){if(t.checked)p.extras[t.dataset.x]=1;else delete p.extras[t.dataset.x];save()}
});
document.addEventListener('input',ev=>{const t=ev.target;
  if(t.id==='inNombre'){S.nombre=t.value.slice(0,40);save();saludo();return}
  if(t.dataset.kg&&S.rutina){const p=P(),v=t.value.trim();if(v){p.pesos[t.dataset.kg]=v;p.ultimos[t.dataset.ejid]=v}else delete p.pesos[t.dataset.kg];save()}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet()});

/* ---------- rutas / deep links ---------- */
function irA(id){setTimeout(()=>{const el=document.getElementById('ej-'+id);if(el){el.scrollIntoView({behavior:'smooth',block:'start'});el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),2500)}},120)}
function route(){
  const q=new URLSearchParams(location.search),r=q.get('r'),h=decodeURIComponent(location.hash||'');
  if(r&&D.rutinas[r]&&S.rutina!==r)S.rutina=r;
  if(h.startsWith('#ej-')){
    const id=h.slice(4);
    const rr=(r&&D.rutinas[r])?r:S.rutina;
    if(rr){const hoy=DIAS_JS[new Date().getDay()];const ds=rut(rr).dias.filter(d=>d.ejercicios.some(e=>e.id===id));
      if(ds.length){abrirRutina(rr,(ds.find(d=>d.id===hoy)||ds[0]).id);irA(id)}else abrirRutina(rr)}
    else home();
    fichaEj(id);return;
  }
  if(h.startsWith('#maq-')){if(S.rutina)abrirRutina(S.rutina);else home();fichaMaq(h.slice(5));return}
  if(h==='#progreso'&&S.rutina){abrirRutina(S.rutina);progreso();return}
  if(r&&D.rutinas[r]){abrirRutina(r);return}
  home();
}
window.addEventListener('hashchange',route);
$('#footHome').innerHTML=footer();
route();

fetch('videos.json',{cache:'no-cache'}).then(x=>x.json()).then(j=>{if(j&&j.videos){VIDS=Object.assign({},VIDS,j.videos);if(S.rutina&&!$('#vRutina').hidden)renderDia()}}).catch(()=>{});
if('serviceWorker' in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
window.PF_APP={state:()=>S};
})();
