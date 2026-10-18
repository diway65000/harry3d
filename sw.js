const C='quidditch3d-v5';
const F=['./','index.html','game.js','three.min.js','manifest.json',...['foret.jpg','harry.png','hermione.png','elise.png','musique_fond.mp3','attrape.mp3','collision.wav','icon-192.png','icon-512.png'].map(f=>'assets/'+f)];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(F.map(f=>c.add(f).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
// assets/ : cache d'abord. Code : réseau d'abord. Si tu changes une image/un son, incrémente C.
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
  const put=r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r};
  if(u.pathname.includes('/assets/')){e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(put)));return}
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(put).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
