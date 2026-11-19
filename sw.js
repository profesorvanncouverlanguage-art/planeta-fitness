const C='pf-v4';
const A=['./','index.html','styles.css','app.js','data.js','config.js','videos.json','logo.jpg','mark.png','icon-192.png','icon-512.png','manifest.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url); if(u.origin!==location.origin) return;
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone(); caches.open(C).then(c=>c.put(e.request,cp)); return r;}).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
