const VERSION='1.10.0';const C='shantells-closet-v13';const A=['./','./index.html','./apple-touch-icon.png','./manifest.webmanifest','./notify.js'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(A.map(u=>new Request(u,{cache:'reload'})))))});
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting();if(e.data==='VERSION'&&e.source)e.source.postMessage({version:VERSION})});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!e.request.url.startsWith(self.location.origin))return;
 if((e.request.url.indexOf('posh_feed.json')>=0||e.request.url.indexOf('notifications.json')>=0)){e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request,{ignoreSearch:true})));return}
 e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))});
