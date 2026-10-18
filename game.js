'use strict';
const $=id=>document.getElementById(id),rand=(a,b)=>a+Math.random()*(b-a),cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const CH=[{id:'harry',nom:'Harry',vit:8,cap:'Turbo'},{id:'hermione',nom:'Hermione',vit:7,cap:'Bouclier'},{id:'elise',nom:'Elise',vit:9,cap:'Petrificus',back:true}];
const DIF=[{n:'Facile',sn:.8},{n:'Normal',sn:1},{n:'Difficile',sn:1.2}];
const GOAL=600,BOSS_T=16,XM=8,YMIN=1,YMAX=7;
const LV=[{n:'Lente',m:.7},{n:'Normale',m:1},{n:'Rapide',m:1.25},{n:'Foudre',m:1.5}];
let lvl=1,diff=1,state='menu',G=null,pz=0,bg=null;
const rbest=()=>{try{return JSON.parse(localStorage.getItem('q3d_race'))||{}}catch(e){return{}}};

/* ---------- Three.js ---------- */
const renderer=new THREE.WebGLRenderer({canvas:$('c'),antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
const scene=new THREE.Scene(),FOG=0x0a1420;
scene.background=new THREE.Color(FOG);scene.fog=new THREE.Fog(FOG,18,95);
const cam=new THREE.PerspectiveCamera(68,1,.1,400);
function resize(){renderer.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
scene.add(new THREE.AmbientLight(0x7080b0,.9));
const moon=new THREE.DirectionalLight(0xaac0ff,.8);moon.position.set(-10,30,10);scene.add(moon);
const TL=new THREE.TextureLoader();
const fx=TL.load('assets/foret.jpg');
const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(290,123),new THREE.MeshBasicMaterial({map:fx,fog:false}));scene.add(backdrop);
// sol
const gc=document.createElement('canvas');gc.width=gc.height=128;{const x=gc.getContext('2d');x.fillStyle='#14261a';x.fillRect(0,0,128,128);
 for(let i=0;i<220;i++){x.fillStyle=`rgba(${20+Math.random()*30|0},${50+Math.random()*50|0},${30+Math.random()*30|0},.5)`;x.beginPath();x.arc(Math.random()*128,Math.random()*128,Math.random()*9+2,0,7);x.fill()}}
const gt=new THREE.CanvasTexture(gc);gt.wrapS=gt.wrapT=THREE.RepeatWrapping;gt.repeat.set(30,75);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(120,300),new THREE.MeshLambertMaterial({map:gt}));ground.rotation.x=-Math.PI/2;scene.add(ground);
// arbres
const trunkG=new THREE.CylinderGeometry(.6,1.1,16,7),leafG=new THREE.SphereGeometry(5,8,6);
const trunkM=new THREE.MeshLambertMaterial({color:0x2a1f2e}),leafM=new THREE.MeshLambertMaterial({color:0x16301f});
const trees=[];
function placeTree(t,z){const s=Math.random()<.5?-1:1;t.position.set(s*(10+Math.random()*30),0,z);t.scale.setScalar(.8+Math.random()*.9)}
for(let i=0;i<80;i++){const t=new THREE.Group(),a=new THREE.Mesh(trunkG,trunkM);a.position.y=8;const b=new THREE.Mesh(leafG,leafM);b.position.y=17;b.scale.set(1,.7,1);t.add(a,b);scene.add(t);placeTree(t,-Math.random()*130);trees.push(t)}

/* ---------- Modèles ---------- */
const sphG=new THREE.SphereGeometry(1,12,10),legG=new THREE.CylinderGeometry(1,1,1,5),UP=new THREE.Vector3(0,1,0);
function seg(a,b,w,m){const d=b.clone().sub(a),me=new THREE.Mesh(legG,m);me.scale.set(w,d.length(),w);me.position.copy(a).add(b).multiplyScalar(.5);me.quaternion.setFromUnitVectors(UP,d.normalize());return me}

// branches décor : haut (voûte) et bas (racines)
const brM=new THREE.MeshLambertMaterial({color:0x3a2d3a}),decor=[];
function branch(len,w,twigs=.7){const g=new THREE.Group();let a=new THREE.Vector3(-len/2,0,0);
 for(let i=0;i<5;i++){const b=a.clone().add(new THREE.Vector3(len/5,rand(-.8,.8),rand(-1,1)));g.add(seg(a,b,w*(1-i*.12),brM));
  if(Math.random()<twigs){const t=b.clone().add(new THREE.Vector3(rand(-1.5,1.5),rand(-3,-1),rand(-1.5,1.5)));g.add(seg(b,t,w*.4,brM))}a=b}return g}
function placeDecor(d,z){d.position.z=z;if(d.userData.top){d.position.set(rand(-8,8),rand(14.5,18.5),z);d.rotation.y=rand(-.5,.5)}
 else{d.position.set((Math.random()<.5?-1:1)*rand(7,16),.3,z);d.rotation.y=rand(0,6.28)}}
for(let i=0;i<10;i++){const d=branch(rand(24,34),.5);d.userData.top=1;scene.add(d);placeDecor(d,-i*13);decor.push(d)}
for(let i=0;i<16;i++){const d=branch(rand(6,10),.35,.4);scene.add(d);placeDecor(d,-i*8-rand(0,6));decor.push(d)}
function spider(r,col=0x241f2e){
 const g=new THREE.Group(),m=new THREE.MeshLambertMaterial({color:col}),e=new THREE.MeshBasicMaterial({color:0xff2a2a});
 const body=new THREE.Mesh(sphG,m);body.scale.set(r*.9,r*.7,r*1.2);g.add(body);
 const head=new THREE.Mesh(sphG,m);head.scale.setScalar(r*.5);head.position.set(0,0,r*1.2);g.add(head);
 for(const s of[-1,1]){const eye=new THREE.Mesh(sphG,e);eye.scale.setScalar(r*.12);eye.position.set(s*r*.2,r*.1,r*1.65);g.add(eye)}
 for(const s of[-1,1])for(let i=0;i<4;i++){const a=(i-1.5)*.6,d=new THREE.Vector3(s*Math.cos(a),0,Math.sin(a));
  const k=d.clone().multiplyScalar(r*1.1).add(new THREE.Vector3(0,r*.9,0)),f=d.clone().multiplyScalar(r*2).add(new THREE.Vector3(0,-r*1.1,0));
  g.add(seg(new THREE.Vector3(d.x*r*.5,0,d.z*r*.5),k,r*.07,m),seg(k,f,r*.06,m))}
 return g}
function webMesh(r){
 const g=new THREE.Group(),pts=[];
 for(let i=0;i<8;i++){const a=i*Math.PI/4;pts.push(0,0,0,Math.cos(a)*r,Math.sin(a)*r,0)}
 for(let j=1;j<=3;j++)for(let i=0;i<8;i++){const a=i*Math.PI/4,b=a+Math.PI/4,rr=r*j/3;pts.push(Math.cos(a)*rr,Math.sin(a)*rr,0,Math.cos(b)*rr,Math.sin(b)*rr,0)}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
 g.add(new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xe8e8f5})));
 g.add(new THREE.Mesh(new THREE.CircleGeometry(r,16),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.08,side:THREE.DoubleSide})));
 return g}
const heartG=(()=>{const s=new THREE.Shape();s.moveTo(0,-.8);s.bezierCurveTo(-1.6,.4,-1,1.6,0,.6);s.bezierCurveTo(1,1.6,1.6,.4,0,-.8);
 const g=new THREE.ExtrudeGeometry(s,{depth:.4,bevelEnabled:false});g.translate(0,0,-.2);return g})();
const heartM=new THREE.MeshBasicMaterial({color:0xff4060});
const orbM=new THREE.MeshBasicMaterial({color:0x88ff44,fog:false});
const threadM=new THREE.MeshBasicMaterial({color:0xcfcfe0});
function gate(){
 const g=new THREE.Group(),c=document.createElement('canvas');c.width=256;c.height=32;const x=c.getContext('2d');
 for(let i=0;i<16;i++)for(let j=0;j<2;j++){x.fillStyle=(i+j)%2?'#fff':'#111';x.fillRect(i*16,j*16,16,16)}
 const t=new THREE.CanvasTexture(c),m=new THREE.MeshBasicMaterial({color:0xddddcc});
 for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(1,13,1),m);p.position.set(s*XM*1.2,6.5,0);g.add(p)}
 const b=new THREE.Mesh(new THREE.BoxGeometry(XM*2.4,2.4,.5),new THREE.MeshBasicMaterial({map:t}));b.position.y=12.5;g.add(b);
 const l=new THREE.PointLight(0xffffcc,2,60);l.position.set(0,6,3);g.add(l);return g}
// joueur
const texs={};for(const c of CH)texs[c.id]=TL.load('assets/'+c.id+'.png');
const pm=new THREE.MeshBasicMaterial({transparent:true,alphaTest:.05,side:THREE.DoubleSide,fog:false});
const pl=new THREE.Mesh(new THREE.PlaneGeometry(3.6,2.7),pm);scene.add(pl);
const shieldM=new THREE.Mesh(new THREE.SphereGeometry(1.9,16,12),new THREE.MeshBasicMaterial({color:0x78c8ff,transparent:true,opacity:.25}));shieldM.visible=false;scene.add(shieldM);
const boss=spider(2.1,0x17121a);boss.visible=false;scene.add(boss);
const bossLight=new THREE.PointLight(0xff2020,0,30);scene.add(bossLight);
let gateM=null;

/* ---------- Audio ---------- */
const AU={bg:new Audio('assets/musique_fond.mp3'),hit:new Audio('assets/collision.wav'),get:new Audio('assets/attrape.mp3')};
AU.bg.loop=true;AU.bg.volume=.4;
const snd=n=>{try{const a=AU[n].cloneNode();a.volume=.7;a.play()}catch(e){}};

/* ---------- Entrées ---------- */
const keys={};let joy={x:0,y:0};
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=1;
 if(k===' '){e.preventDefault();ability()}
 if(k==='p')togglePause();
 if(k==='r'&&state==='pause')toMenu()});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=0);
function readInput(){let x=(keys.arrowright||keys.d?1:0)-(keys.arrowleft||keys.q||keys.a?1:0),y=(keys.arrowup||keys.z||keys.w?1:0)-(keys.arrowdown||keys.s?1:0);
 x+=joy.x;y+=joy.y;const l=Math.hypot(x,y);return l>1?[x/l,y/l]:[x,y]}
const joyEl=$('joy'),knob=$('knob');
function joyMove(e){const r=joyEl.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),l=Math.hypot(dx,dy),m=Math.min(l,50),k=l?m/l:0;
 knob.style.left=30+dx*k+'px';knob.style.top=30+dy*k+'px';joy={x:dx*k/50,y:-dy*k/50}}
joyEl.addEventListener('pointerdown',e=>{joyEl.setPointerCapture(e.pointerId);joyMove(e)});
joyEl.addEventListener('pointermove',e=>{if(joyEl.hasPointerCapture(e.pointerId))joyMove(e)});
const joyEnd=()=>{joy={x:0,y:0};knob.style.left=knob.style.top='30px'};
joyEl.addEventListener('pointerup',joyEnd);joyEl.addEventListener('pointercancel',joyEnd);
$('pw').addEventListener('pointerdown',e=>{e.preventDefault();ability()});
$('ps').onclick=togglePause;
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='play')togglePause()});

/* ---------- Jeu ---------- */
function buildMenu(){
 $('chs').innerHTML='';CH.forEach(c=>{const b=document.createElement('button');b.className='card';b.innerHTML=`<img src="assets/${c.id}.png"><b>${c.nom}</b><i>${c.cap}</i>`;b.onclick=()=>start(c);$('chs').appendChild(b)});
 $('dfs').innerHTML='';DIF.forEach((d,i)=>{const b=document.createElement('button');b.className='dif'+(i===diff?' on':'');b.textContent=d.n;b.onclick=()=>{diff=i;buildMenu()};$('dfs').appendChild(b)});
 const r=rbest()['sp'+lvl];$('rec').textContent='Record ('+LV[lvl].n+') : '+(r?r.toFixed(1)+' s':'—');
 $('lvs').innerHTML='';LV.forEach((l,i)=>{const b=document.createElement('button');b.className='dif'+(i===lvl?' on':'');b.textContent='Vitesse '+(i+1)+' · '+l.n;b.onclick=()=>{lvl=i;buildMenu()};$('lvs').appendChild(b)})}
function toMenu(){state='menu';clearWorld();$('menu').classList.remove('hide');$('res').classList.add('hide');['hud','ps','pw','spd'].forEach(i=>$(i).classList.add('hide'));joyEl.classList.add('hide');buildMenu()}
function clearWorld(){if(G)for(const o of G.obs)scene.remove(o.m);if(gateM){scene.remove(gateM);gateM=null}boss.visible=false;bossLight.intensity=0;G=null}
function start(c){
 clearWorld();pz=0;try{AU.bg.play()}catch(e){}
 G={minL:lvl,ch:c,d:DIF[diff],cnt:3.99,el:0,dist:0,lives:3,pen:0,slow:0,web:0,spawn:1,phase:0,bw:0,bt:0,bz:null,fin:null,obs:[],endT:0,won:false,
  p:{x:0,y:3.5,ax:0,stun:0,inv:0,boost:0,shield:0,cd:0}};
 pm.map=texs[c.id];pm.needsUpdate=true;
 $('menu').classList.add('hide');$('res').classList.add('hide');['hud','ps'].forEach(i=>$(i).classList.remove('hide'));
 if(matchMedia('(pointer:coarse)').matches){$('pw').classList.remove('hide');joyEl.classList.remove('hide')}else if(!matchMedia('(pointer:fine)').matches)$('pw').classList.remove('hide');
 $('pwl').textContent=c.cap;$('sl').textContent=(lvl+1)+'/4';$('spd').classList.remove('hide');state='count'}
function togglePause(){if(state==='play'){state='pause';$('big').textContent='PAUSE'}else if(state==='pause'){state='play';$('big').textContent=''}}
function ability(){if(state!=='play')return;const p=G.p;if(p.cd>0)return;p.cd=6;const id=G.ch.id;
 if(id==='harry')p.boost=2;else if(id==='hermione')p.shield=3;
 else{p.cd=10;G.obs=G.obs.filter(o=>{if(o.t==='l')return true;scene.remove(o.m);return false})}}
function flash(){const f=$('fl');f.style.transition='none';f.style.opacity=.45;requestAnimationFrame(()=>{f.style.transition='opacity .5s';f.style.opacity=0})}
function crash(){const p=G.p;G.pen+=2;snd('hit');flash();p.inv=2;p.stun=.5;G.slow=1;if(--G.lives<=0)endGame(false)}
function endGame(w){
 G.won=w;G.tot=G.el+G.pen;G.endT=0;state='ending';
 try{const b=rbest();b.spd=Math.max(b.spd||0,G.dist|0);if(w){const k='sp'+G.minL;b[k]=Math.min(b[k]||1e9,G.tot)}localStorage.setItem('q3d_race',JSON.stringify(b))}catch(e){}}
function showResult(){
 state='res';const w=G.won;$('rt').textContent=w?"TU T'ES ÉCHAPPÉ !":'CAPTURÉ PAR LES ARAIGNÉES';$('rt').style.color=w?'#80ff78':'#ff5050';
 $('rd').textContent=(G.dist|0)+' m'+(w?` • ${G.tot.toFixed(1)} s`+(G.pen?` (dont ${G.pen} s de pénalités)`:''):'');
 const r=rbest()['sp'+G.minL];$('rr').textContent='Record ('+LV[G.minL].n+') : '+(r?r.toFixed(1)+' s':'—');$('res').classList.remove('hide')}
$('again').onclick=()=>start(G.ch);$('tomenu').onclick=toMenu;

function addObs(t,o){o.t=t;scene.add(o.m);G.obs.push(o)}
function spawn(){
 const q=Math.random(),z=pz-85;
 if(G.lives<3&&Math.random()<.22){const m=new THREE.Mesh(heartG,heartM);m.scale.setScalar(1.3);addObs('l',{m,x:rand(-6,6),y:rand(1.5,6.5),z,r:1.1})}
 else if(q<.14){addObs('w',{m:webMesh(2.4),x:rand(-6,6),y:rand(1.8,6),z,r:2.4})}
 else if(q<.3){}
 else if(q<.64){const m=new THREE.Group(),s=spider(.9);m.add(s);const th=new THREE.Mesh(legG,threadM);th.scale.set(.03,1,.03);m.add(th);
  const br=branch(7,.4,.5);br.rotation.y=rand(-.6,.6);m.add(br);addObs('h',{m,s,th,br,x:rand(-6.5,6.5),y0:rand(2.5,5.5),y:15.5,drop:0,z,r:1.2,ph:rand(0,6)})}
 else{const n=1+(Math.random()*2|0),x0=rand(-6,6),y0=rand(1.5,6);for(let i=0;i<n;i++)addObs('g',{m:spider(.8),x:cl(x0+rand(-2,2),-XM,XM),y:cl(y0+rand(-1,1),YMIN,YMAX),z:z-i*4,r:1.1,ph:rand(0,6)})}}
function spit(){const B=G.bz,p=G.p,T=.9,v=G.v,tx=p.x,ty=p.y,tz=pz-v*T,sx=B.x,sy=B.y,sz=pz-B.d;
 const m=new THREE.Mesh(sphG,orbM);m.scale.setScalar(.6);addObs('v',{m,x:sx,y:sy,z:sz,vx:(tx-sx)/T,vy:(ty-sy)/T,vz:(tz-sz)/T,r:.6})}

function update(dt){
 const p=G.p;
 if(state==='count'){G.cnt-=dt;if(G.cnt<=0){state='play';$('big').textContent=''}else $('big').textContent=G.cnt>.99?Math.ceil(G.cnt-.99):'GO !';return}
 if(state==='ending'){G.endT+=dt;pz-=9*dt;if(G.endT>=2.2)showResult();return}
 G.el+=dt;for(const f of['stun','inv','boost','shield','cd'])if(p[f]>0)p[f]-=dt;if(G.slow>0)G.slow-=dt;if(G.web>0)G.web-=dt;
 const[ax,ay]=readInput(),sp=G.ch.vit*1.05*Math.sqrt(LV[lvl].m)*(p.stun>0?.4:1)*(G.web>0?.55:1);
 p.x=cl(p.x+ax*sp*dt,-XM,XM);p.y=cl(p.y+ay*sp*dt,YMIN,YMAX);p.ax=ax;
 const v=Math.min(31,(420+G.el*6)*G.d.sn/40)*LV[lvl].m*(G.phase?1.1:1)*(p.boost>0?1.6:1)*(G.slow>0?.5:1)*(G.web>0?.6:1);G.v=v;
 pz-=v*dt;G.dist+=v*dt;
 if(G.phase===0&&G.dist>=GOAL){G.phase=1;G.bw=0;G.bt=0;G.lives=Math.min(3,G.lives+1);
  G.bz={ph:'idle',t:0,x:p.x*.6,y:4,d:85,nl:1.8,ns:1.2,sp:0};boss.visible=true}
 if(G.phase===1&&G.bw<2)G.bw+=dt;
 const warn=G.phase===1&&G.bw<2,fight=G.phase===1&&G.bw>=2;
 if(!warn&&!G.fin&&(G.spawn-=dt)<=0){G.spawn=1.3*Math.max(.4,1.15-G.el*.007)/G.d.sn/LV[lvl].m*(fight?1.3:1);spawn()}
 // obstacles
 for(const o of G.obs){
  if(o.t==='h'){if(o.z-pz>-45)o.drop=1;if(o.drop)o.y+=cl(o.y0+Math.sin(G.el*2.5+o.ph)*.8-o.y,-12*dt,12*dt);const L=17-o.y;o.th.scale.y=L;o.th.position.y=L/2;o.br.position.y=L;o.m.children[0].rotation.y=Math.sin(G.el+o.ph)*.4}
  else if(o.t==='g'){if(o.z<pz-8){o.z+=4.5*dt;o.x+=cl(p.x-o.x,-3*dt,3*dt);o.y+=cl(p.y-o.y,-3*dt,3*dt)}else o.z+=4.5*dt;o.m.rotation.z=Math.sin(G.el*14+o.ph)*.08}
  else if(o.t==='v'){o.x+=o.vx*dt;o.y+=o.vy*dt;o.z+=o.vz*dt}
  else if(o.t==='l'){o.m.rotation.y+=dt*2.5}
  o.m.position.set(o.x,o.t==='h'?o.y:o.y,o.z)}
 for(const o of G.obs.slice()){
  const dz=o.z-pz,dx=o.x-p.x,dy=o.y-p.y;
  if(o.z>pz+16||o.z<pz-130||(o.t==='v'&&o.z>pz+12)){scene.remove(o.m);G.obs.splice(G.obs.indexOf(o),1);continue}
  if(o.t==='l'){if(Math.abs(dz)<1.4&&Math.hypot(dx,dy)<o.r+1){G.lives=Math.min(3,G.lives+1);snd('get');scene.remove(o.m);G.obs.splice(G.obs.indexOf(o),1)}continue}
  if(o.t==='w'){if(Math.abs(dz)<1&&Math.hypot(dx,dy)<o.r+.4)G.web=.3;continue}
  if(p.inv>0||p.shield>0)continue;
  const hit=o.t==='v'?Math.hypot(dx,dy,dz)<o.r+1:Math.abs(dz)<1.3&&Math.hypot(dx,dy)<o.r+.9;
  if(hit){if(o.t==='v'){scene.remove(o.m);G.obs.splice(G.obs.indexOf(o),1)}crash();if(state!=='play')return;break}}
 // boss
 if(G.phase===1){const B=G.bz;
  if(warn){const e=Math.min(1,G.bw/2);B.d=85-57*(1-(1-e)*(1-e));B.x=p.x*.6;B.y=4}
  else{G.bt+=dt;B.t+=dt;const LF=3,IDLE=28;
   if(G.fin)B.d=Math.min(120,B.d+50*dt);
   else{
    if(B.ph==='idle'||B.ph==='back'){B.x+=cl(p.x*.8-B.x,-4*dt,4*dt);B.y+=cl(cl(p.y,2.5,6)-B.y,-3.5*dt,3.5*dt)}
    if(B.ph==='idle'){B.d=IDLE+Math.sin(G.el*2);B.nl-=dt;if(B.nl<=0){B.ph='tele';B.t=0}}
    else if(B.ph==='tele'){B.d=IDLE-B.t*2;if(B.t>=.9){B.ph='lunge';B.t=0}}
    else if(B.ph==='lunge'){const d0=IDLE-1.8;B.d=d0+(LF-d0)*Math.min(1,B.t/.3);
     if(p.inv<=0&&p.shield<=0&&Math.abs(p.x-B.x)<2.6&&Math.abs(p.y-B.y)<2.8&&B.d<6){crash();if(state!=='play')return}
     if(B.t>=.55){B.ph='back';B.t=0}}
    else{B.d=LF+(IDLE-LF)*Math.min(1,B.t/.8);if(B.t>=.8){B.ph='idle';B.nl=rand(2,3.2);B.t=0}}
    if(B.ph==='idle'||B.ph==='back'){if(B.sp>0){B.sp-=dt;if(B.sp<=0){spit();B.ns=rand(1.5,2.2)}}else if((B.ns-=dt)<=0)B.sp=.45}}
   if(G.bt>=BOSS_T-4.5&&!G.fin){G.fin={z:pz-v*4.5};gateM=gate();gateM.position.z=G.fin.z;scene.add(gateM)}}}
 if(G.fin&&pz<=G.fin.z){endGame(true);return}
}
function render(t){
 const p=G.p,warn=G&&G.phase===1&&G.bw<2;
 pl.position.set(p.x,p.y,pz);const bk=G.ch.back;pl.scale.set(bk?.75:1,1,1);pl.rotation.set(0,bk?-p.ax*.2:.7-p.ax*.35,-p.ax*(bk?.28:.18)+Math.sin(t*.008)*.03);
 pl.material.opacity=1;pl.visible=!(p.inv>0&&Math.sin(t*.06)>0);
 shieldM.visible=p.shield>0;shieldM.position.copy(pl.position);
 if(G.phase===1){const B=G.bz;boss.position.set(B.x,B.y,pz-B.d);boss.rotation.z=Math.sin(t*.004)*.04;boss.visible=B.d<110;
  bossLight.position.copy(boss.position);bossLight.position.z+=4;bossLight.intensity=B.ph==='tele'?2+Math.sin(t*.05)*1.5:.6;if(B.ph==='tele')boss.position.x+=Math.sin(t*.06)*.25}
 const sh=warn?.25:0,tx=p.x*.6+(sh?rand(-sh,sh):0),ty=p.y*.35+3+(sh?rand(-sh,sh):0);
 cam.position.set(tx,ty,pz+7.5);cam.lookAt(p.x*.4,p.y*.4+1.6,pz-20);
 cam.fov=70+(p.boost>0?10:0);cam.updateProjectionMatrix();
 backdrop.position.set(cam.position.x,30,cam.position.z-110);
 ground.position.set(0,0,Math.round((pz-80)/4)*4);
 for(const tr of trees)if(tr.position.z>pz+18)placeTree(tr,pz-125-Math.random()*10);
 for(const d of decor)if(d.position.z>pz+18)placeDecor(d,pz-125-Math.random()*10);
}
function hud(){
 const p=G.p,fight=G.phase===1&&G.bw>=2,warn=G.phase===1&&G.bw<2;
 $('d').textContent=(G.dist|0)+' m';$('t').textContent=(G.el+G.pen).toFixed(1)+' s';$('pn').textContent=G.pen?'Pénalités +'+G.pen+' s':'';
 $('lv').textContent='♥'.repeat(Math.max(0,G.lives));
 $('ms').textContent=LV[lvl].n+' • '+G.phase===0?`Araignée géante dans ${Math.max(0,GOAL-G.dist)|0} m`:G.fin?'Cours vers la sortie !':fight?`Survis ! ${Math.ceil(BOSS_T-G.bt)} s`:'';
 $('bf').style.width=(100*(G.phase===0?Math.min(1,G.dist/GOAL):fight?1-G.bt/BOSS_T:1))+'%';$('bf').style.background=G.phase===0?'#80ff78':'#ff5050';
 const pw=$('pw');pw.classList.toggle('cd',p.cd>0);$('pwl').textContent=p.cd>0?Math.ceil(p.cd):G.ch.cap;
 if(warn)$('big').textContent="L'ARAIGNÉE GÉANTE !";else if(state==='play'||state==='ending'){if($('big').textContent==="L'ARAIGNÉE GÉANTE !")$('big').textContent=''}}
let last=0;
function loop(t){requestAnimationFrame(loop);const dt=Math.min(.05,(t-last)/1000||0);last=t;
 if(G){if(state!=='pause'&&state!=='res')update(dt);if(G)hud();if(G)render(t)}
 else{cam.position.set(Math.sin(t*.0003)*3,5,10);cam.lookAt(0,4,-30);backdrop.position.set(cam.position.x,30,-100)}
 renderer.render(scene,cam)}
buildMenu();requestAnimationFrame(loop);

function setLvl(d){if(!G||state==='menu'||state==='res')return;lvl=cl(lvl+d,0,LV.length-1);G.minL=Math.min(G.minL,lvl);$('sl').textContent=(lvl+1)+'/4'}
$('sm').onclick=()=>setLvl(-1);$('sq').onclick=()=>setLvl(1);
addEventListener('keydown',e=>{if(e.key==='+'||e.key==='=')setLvl(1);if(e.key==='-'||e.key==='_')setLvl(-1)});
