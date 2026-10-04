/* 街道ウォーキング: repair 2026-10-04 */
'use strict';
const APP_PREFIX='kumanaku-';
const CACHE='kumanaku-own-20261004-6';
const TILE='kumanaku-tiles-v187';
const TILE_CAP=260;
const CORE=['./','./index.html','./kaido_data.json','./manifest.json','./icon-192.png','./icon-512.png'];
const TILE_HOSTS=['cyberjapandata.gsi.go.jp','tile.openstreetmap.org','maps.gsi.go.jp'];
const scopeURL=new URL(self.registration.scope);
function owned(k){return k.startsWith(APP_PREFIX);}
async function put(cache,req,res){if(res&&(res.ok||res.type==='opaque'))await cache.put(req,res.clone());}
async function prune(cache){const keys=await cache.keys();await Promise.all(keys.slice(0,Math.max(0,keys.length-TILE_CAP)).map(k=>cache.delete(k)));}
self.addEventListener('install',e=>{
 e.waitUntil((async()=>{const c=await caches.open(CACHE);await Promise.all(CORE.map(async path=>{
  const u=new URL(path,scopeURL).href;try{await put(c,u,await fetch(u,{cache:'reload'}));}catch(_){}
 }));await self.skipWaiting();})());
});
self.addEventListener('activate',e=>{
 e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>owned(k)&&k!==CACHE&&k!==TILE).map(k=>caches.delete(k)));await self.clients.claim();})());
});
self.addEventListener('fetch',e=>{
 const req=e.request;if(req.method!=='GET')return;const url=new URL(req.url);
 if(TILE_HOSTS.includes(url.hostname)){
  e.respondWith((async()=>{const c=await caches.open(TILE),hit=await c.match(req);if(hit)return hit;
   try{const r=await fetch(req);e.waitUntil(put(c,req,r).then(()=>prune(c)).catch(()=>{}));return r;}catch(_){return new Response('',{status:504});}
  })());return;
 }
 if(url.origin!==scopeURL.origin||!url.pathname.startsWith(scopeURL.pathname))return;
 const doc=req.mode==='navigate'||/\.html?$/.test(url.pathname)||url.pathname.endsWith('/');
 e.respondWith((async()=>{
  const c=await caches.open(CACHE);
  try{const r=await fetch(req,{cache:doc?'no-store':'default'});if(r.ok){e.waitUntil(put(c,req,r).catch(()=>{}));return r;}
   const hit=await c.match(req);return hit||r;
  }catch(_){const hit=await c.match(req);if(hit)return hit;
   if(doc){const home=await c.match(new URL('index.html',scopeURL).href);if(home)return home;}
   return new Response('オフラインです。オンラインで一度アプリを開いてください。',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }
 })());
});
self.addEventListener('message',e=>{
 const d=e.data||{};
 if(d.type==='km-skip-waiting')e.waitUntil(self.skipWaiting());
 if(d.type==='km-clear-cache')e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(owned).map(k=>caches.delete(k)))));
 if(d.type==='km-tile-stats')e.waitUntil((async()=>{const c=await caches.open(TILE),keys=await c.keys();const clients=await self.clients.matchAll({type:'window'});clients.forEach(cl=>cl.postMessage({type:'km-tile-stats',count:keys.length}));})());
});
