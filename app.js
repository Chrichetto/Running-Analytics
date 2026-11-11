'use strict';

/** @typedef {{id:number,data:string,distanza:number,durata:number,dislivello:number,frequenzaCardiaca?:number}} Corsa */
/** @typedef {{distanzaTotale:number,durataCorse:number,passoMedio:number,corsaPiuLunga:Corsa|null,corsaPiuVeloce:Corsa|null,miglioramento:number|null}} Report */

const STORAGE_KEY = 'pace-studio-runs-v1';
const DEMO_RUNS = [
  { id:1, data:'2026-10-02', distanza:5, durata:1842, dislivello:42, frequenzaCardiaca:151 },
  { id:2, data:'2026-10-06', distanza:7, durata:2555, dislivello:68, frequenzaCardiaca:149 },
  { id:3, data:'2026-10-11', distanza:5, durata:1740, dislivello:35, frequenzaCardiaca:148 },
  { id:4, data:'2026-10-16', distanza:10, durata:3630, dislivello:91, frequenzaCardiaca:154 },
  { id:5, data:'2026-10-20', distanza:5, durata:1660, dislivello:46, frequenzaCardiaca:146 },
  { id:6, data:'2026-10-25', distanza:8, durata:2740, dislivello:59, frequenzaCardiaca:152 },
  { id:7, data:'2026-11-01', distanza:10, durata:3500, dislivello:75, frequenzaCardiaca:150 },
  { id:8, data:'2026-11-06', distanza:5, durata:1585, dislivello:31, frequenzaCardiaca:145 },
  { id:9, data:'2026-11-09', distanza:6.5, durata:2160, dislivello:55, frequenzaCardiaca:147 }
];

function loadRuns(){
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if(stored === null) return structuredClone(DEMO_RUNS);
    const parsed = JSON.parse(stored);
    if(!Array.isArray(parsed)) throw new Error('Formato non valido');
    return parsed.filter(isValidRun);
  } catch(error){ console.warn('Impossibile leggere le corse salvate',error); return structuredClone(DEMO_RUNS); }
}
function isValidRun(r){ return r && Number.isFinite(r.id) && /^\d{4}-\d{2}-\d{2}$/.test(r.data) && Number.isFinite(r.distanza) && r.distanza>0 && Number.isFinite(r.durata) && r.durata>0 && Number.isFinite(r.dislivello) && r.dislivello>=0 && (r.frequenzaCardiaca===undefined || Number.isFinite(r.frequenzaCardiaca)); }
let corse = loadRuns();
const el = id => document.getElementById(id);
const fmt = (n, digits=1) => new Intl.NumberFormat('it-IT',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(n);
const paceSeconds = corsa => corsa.durata / corsa.distanza;
function formatPace(seconds){ if(!Number.isFinite(seconds)||seconds<=0) return '—'; const rounded=Math.round(seconds); const minutes=Math.floor(rounded/60);return `${minutes}:${String(rounded%60).padStart(2,'0')}`; }
function formatDuration(seconds){ const m=Math.round(seconds/60); const h=Math.floor(m/60); return h?`${h}h ${String(m%60).padStart(2,'0')}m`:`${m}m`; }
function formatDate(iso){return new Date(iso+'T12:00:00').toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'});}

// Calcoli basati sulle funzioni TypeScript fornite: passo in secondi/km,
// conversione in mm:ss solo per la visualizzazione (evita errori di arrotondamento).
function distanzaTotale(corse){let distanza=0,durata=0;for(const corsa of corse){distanza+=corsa.distanza;durata+=corsa.durata;}return [distanza,durata,distanza>0?durata/distanza:0];}
function analizzaCorse(corse){const [distanza,durata,passo]=distanzaTotale(corse);return {distanzaTotale:distanza,durataTotale:durata,passoMedio:passo};}
function trovaCorsaPiuLunga(corse){return corse.reduce((best,c)=>!best||c.distanza>best.distanza?c:best,null);}
function trovaCorsaPiuVeloce(corse){return corse.reduce((best,c)=>!best||paceSeconds(c)<paceSeconds(best)?c:best,null);}
function arrotonda(n){return Math.round(n*100)/100;}
function confrontaCorse(corse,distanza){
  const uguali=corse.filter(c=>Math.abs(c.distanza-distanza)<1e-8).sort((a,b)=>a.data.localeCompare(b.data)||a.id-b.id);
  if(uguali.length<2) return null; // servono almeno due corse distinte
  const iniziale=paceSeconds(uguali[0]),finale=paceSeconds(uguali[uguali.length-1]);
  return arrotonda((iniziale-finale)/iniziale*100); // 0 è un risultato valido
}
function generaReport(corse,distanza){const a=analizzaCorse(corse);return {distanzaTotale:a.distanzaTotale,durataCorse:a.durataTotale,passoMedio:a.passoMedio,corsaPiuLunga:trovaCorsaPiuLunga(corse),corsaPiuVeloce:trovaCorsaPiuVeloce(corse),miglioramento:confrontaCorse(corse,distanza)};}

function saveRuns(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(corse));return true;}catch(e){console.error(e);alert('Non è stato possibile salvare i dati nel browser.');return false;}}
function renderComparisonOptions(){
  const select=el('comparisonDistance'); const previous=Number(select.value);
  const distances=[...new Set(corse.map(c=>c.distanza))].sort((a,b)=>a-b);
  select.replaceChildren();
  if(distances.length===0){const option=new Option('Nessuna corsa','');select.add(option);select.disabled=true;return;}
  select.disabled=false;
  for(const distance of distances){const option=new Option(`${fmt(distance,distance%1?1:0)} km`,String(distance));select.add(option);}
  select.value=distances.includes(previous)?String(previous):String(distances.find(d=>corse.filter(c=>c.distanza===d).length>=2)??distances[0]);
}
function renderMetrics(){
  const distance=Number(el('comparisonDistance').value);
  const report=generaReport(corse,distance);
  el('totalDistance').textContent=fmt(report.distanzaTotale);
  el('totalDuration').textContent=formatDuration(report.durataCorse);
  el('averagePace').textContent=report.distanzaTotale?formatPace(report.passoMedio):'—';
  el('improvement').textContent=report.miglioramento===null?'—':`${report.miglioramento>0?'+':''}${fmt(report.miglioramento,2)}`;
  el('improvementUnit').textContent=report.miglioramento===null?'':'%';
  el('improvementInfo').textContent=report.miglioramento===null?'Servono almeno 2 corse della stessa distanza':report.miglioramento>0?'Passo migliorato rispetto alla prima corsa':report.miglioramento<0?'Passo rallentato rispetto alla prima corsa':'Passo invariato rispetto alla prima corsa';
  el('longestDistance').textContent=report.corsaPiuLunga?`${fmt(report.corsaPiuLunga.distanza,report.corsaPiuLunga.distanza%1?1:0)} km`:'—';
  el('longestDate').textContent=report.corsaPiuLunga?formatDate(report.corsaPiuLunga.data):'Nessun dato';
  el('fastestPace').textContent=report.corsaPiuVeloce?`${formatPace(paceSeconds(report.corsaPiuVeloce))} /km`:'—';
  el('fastestDate').textContent=report.corsaPiuVeloce?formatDate(report.corsaPiuVeloce.data):'Nessun dato';
  const now=new Date();const currentMonth=corse.filter(c=>c.data.slice(0,7)===`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`).reduce((sum,c)=>sum+c.distanza,0);
  el('goalProgress').style.width=`${Math.min(currentMonth/50*100,100)}%`;
  el('goalText').textContent=`${fmt(currentMonth)} / 50 km completati`;
}
function renderTable(){
  const tbody=el('runsTable');tbody.replaceChildren();
  const ordered=[...corse].sort((a,b)=>b.data.localeCompare(a.data)||b.id-a.id);
  for(const run of ordered){
    const tr=document.createElement('tr');
    const cells=[formatDate(run.data),fmt(run.distanza,run.distanza%1?1:0)+' km',formatDuration(run.durata),formatPace(paceSeconds(run))+' /km',`${run.dislivello} m`,run.frequenzaCardiaca?`${run.frequenzaCardiaca} bpm`:'—'];
    for(let i=0;i<cells.length;i++){const td=document.createElement('td');if(i===1){const pill=document.createElement('span');pill.className='km-pill';pill.textContent=cells[i];td.append(pill);}else{td.textContent=cells[i];}tr.append(td);}
    const actions=document.createElement('td');const remove=document.createElement('button');remove.className='del-btn';remove.type='button';remove.textContent='×';remove.title='Elimina corsa';remove.setAttribute('aria-label',`Elimina corsa del ${formatDate(run.data)}`);remove.addEventListener('click',()=>{if(confirm(`Eliminare la corsa del ${formatDate(run.data)}?`)){corse=corse.filter(c=>c.id!==run.id);saveRuns();render();}});actions.append(remove);tr.append(actions);tbody.append(tr);
  }
  if(ordered.length===0){const row=document.createElement('tr');const td=document.createElement('td');td.colSpan=7;td.textContent='Nessuna attività. Aggiungi la tua prima corsa!';td.style.padding='25px';row.append(td);tbody.append(row);}
  el('runCount').textContent=String(corse.length);el('tableCount').textContent=`${corse.length} attività totali`;
}
function renderChart(){
  const svg=el('paceChart');svg.replaceChildren();const NS='http://www.w3.org/2000/svg';
  const add=(name,attrs,text)=>{const node=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs||{}))node.setAttribute(k,String(v));if(text!==undefined)node.textContent=text;svg.append(node);return node;};
  const ordered=[...corse].sort((a,b)=>a.data.localeCompare(b.data)||a.id-b.id);
  if(!ordered.length){add('text',{x:330,y:130,'text-anchor':'middle',fill:'#95a2b3','font-size':14},'Aggiungi una corsa per vedere il grafico');return;}
  const values=ordered.map(paceSeconds);const lo=Math.max(0,Math.min(...values)-18);const hi=Math.max(...values)+18;const xL=52,xR=642,yT=20,yB=220;
  const x=i=>ordered.length===1?(xL+xR)/2:xL+(xR-xL)*i/(ordered.length-1);
  const y=v=>yB-(v-lo)/(hi-lo)*(yB-yT);
  for(let i=0;i<5;i++){const v=lo+(hi-lo)*i/4;const yy=y(v);add('line',{x1:xL,y1:yy,x2:xR,y2:yy,stroke:'#35404d','stroke-dasharray':'4 6','stroke-width':1});add('text',{x:38,y:yy+4,'text-anchor':'end',fill:'#7e8b9b','font-size':11},formatPace(v));}
  const defs=document.createElementNS(NS,'defs');defs.innerHTML='<linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#d4f86b" stop-opacity=".24"/><stop offset="100%" stop-color="#d4f86b" stop-opacity="0"/></linearGradient>';svg.prepend(defs);
  const points=values.map((v,i)=>`${x(i)},${y(v)}`).join(' ');
  const area=`M ${x(0)} ${yB} L ${values.map((v,i)=>`${x(i)} ${y(v)}`).join(' L ')} L ${x(values.length-1)} ${yB} Z`;
  add('path',{d:area,fill:'url(#areaGradient)'});
  if(values.length>1)add('polyline',{points,fill:'none',stroke:'#d4f86b','stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'});
  values.forEach((v,i)=>{add('circle',{cx:x(i),cy:y(v),r:5,fill:'#d4f86b',stroke:'#1a222c','stroke-width':3});const marker=add('circle',{cx:x(i),cy:y(v),r:14,fill:'transparent',tabindex:0,role:'img','aria-label':`${formatDate(ordered[i].data)}, passo ${formatPace(v)} al chilometro`});const title=document.createElementNS(NS,'title');title.textContent=`${formatDate(ordered[i].data)} — ${formatPace(v)}/km`;marker.append(title);});
  const indices=[0,Math.floor((ordered.length-1)/2),ordered.length-1].filter((n,i,arr)=>arr.indexOf(n)===i);
  indices.forEach(i=>add('text',{x:x(i),y:250,'text-anchor':'middle',fill:'#8795a3','font-size':11},new Date(ordered[i].data+'T12:00:00').toLocaleDateString('it-IT',{day:'2-digit',month:'short'})));
}
function render(){renderComparisonOptions();renderMetrics();renderChart();renderTable();}

const dialog=el('runDialog');const form=el('runForm');
function openDialog(){form.reset();form.elements.data.value=new Date().toLocaleDateString('en-CA');form.elements.dislivello.value='0';el('formError').textContent='';dialog.showModal();}
function closeDialog(){dialog.close();}
el('addRunButton').addEventListener('click',openDialog);el('addRunSecondary').addEventListener('click',openDialog);el('closeDialog').addEventListener('click',closeDialog);el('cancelDialog').addEventListener('click',closeDialog);
dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog();});
form.addEventListener('submit',event=>{
  event.preventDefault();const data=new FormData(form);
  const distance=Number(data.get('distanza'));const durationMin=Number(data.get('durataMinuti'));
  const elevation=Number(data.get('dislivello'));const heart=data.get('frequenzaCardiaca');
  const date=String(data.get('data'));
  if(!date||!Number.isFinite(distance)||distance<=0||!Number.isFinite(durationMin)||durationMin<=0||!Number.isFinite(elevation)||elevation<0){el('formError').textContent='Controlla i valori inseriti.';return;}
  const run={id:Math.max(0,...corse.map(c=>c.id))+1,data:date,distanza:distance,durata:Math.round(durationMin*60),dislivello:elevation};
  if(heart!==''){const hr=Number(heart);if(!Number.isFinite(hr)||hr<30||hr>250){el('formError').textContent='La frequenza cardiaca deve essere tra 30 e 250 bpm.';return;}run.frequenzaCardiaca=hr;}
  corse.push(run);saveRuns();closeDialog();render();document.querySelector('#dashboard').scrollIntoView({behavior:'smooth'});
});
el('comparisonDistance').addEventListener('change',renderMetrics);
el('resetButton').addEventListener('click',()=>{if(confirm('Ripristinare le corse dimostrative? Le corse attuali verranno sostituite.')){corse=structuredClone(DEMO_RUNS);saveRuns();render();}});
el('today').textContent=new Date().toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'});

// Effetto prospettico 3D: il mouse inclina la scena e sposta l'immagine su un livello separato.
const hero=el('heroTilt');const art=hero.querySelector('.hero-art');
if(matchMedia('(hover:hover) and (prefers-reduced-motion:no-preference)').matches){
  hero.addEventListener('pointermove',event=>{
    const rect=hero.getBoundingClientRect();const dx=(event.clientX-rect.left)/rect.width-.5;const dy=(event.clientY-rect.top)/rect.height-.5;
    hero.style.transform=`perspective(1100px) rotateY(${dx*4}deg) rotateX(${-dy*3}deg)`;
    art.style.transform=`scale(1.09) translate(${dx*-12}px,${dy*-10}px)`;
  });
  hero.addEventListener('pointerleave',()=>{hero.style.transform='';art.style.transform='scale(1.025)';});
}
render();
