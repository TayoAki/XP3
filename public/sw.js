// Only the public application shell and its static assets are cached.
// Account APIs, member media, Google maps/photos and all mutations always use the network.
const CACHE='xp-journey-shell-2026-10-05-integrations';
const SHELL='/journey/';
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);const response=await fetch(SHELL,{cache:'reload'});if(!response.ok)throw Error('Shell unavailable');await cache.put(SHELL,response.clone());const html=await response.text();const assets=[...html.matchAll(/(?:src|href)="([^"\s]+)"/g)].map(m=>m[1]).filter(path=>path.startsWith('/journey/assets/'));await Promise.all(assets.map(path=>cache.add(path)));await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('xp-journey-shell-')&&name!==CACHE)await caches.delete(name);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'&&(url.pathname==='/journey'||url.pathname==='/journey/')){event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(SHELL,copy)).catch(()=>{}))}return response}).catch(async()=>{const cached=await caches.match(SHELL);return cached||Response.error()}));return;}
 if(url.pathname.startsWith('/journey/assets/'))event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(request,copy)).catch(()=>{}))}return response})));
});
