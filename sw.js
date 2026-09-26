/* 街道ウォーキング Service Worker v125 */
var CACHE='kumanaku-v150';
var TILE='kumanaku-tiles-v150';
var TILE_CAP=260;
var CORE=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
var TILE_HOSTS=['cyberjapandata.gsi.go.jp','tile.openstreetmap.org','maps.gsi.go.jp'];

self.addEventListener('install', function(e){
  try{ self.skipWaiting(); }catch(_){}
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CORE).catch(function(){}); }).catch(function(){}));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ return (k===CACHE||k===TILE)?null:caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }).catch(function(){}));
});
function verOf(t){ try{ var m=/BTAG\s*=\s*['"](v[0-9]+)['"]/.exec(t); if(m) return m[1]; }catch(_){} return null; }
function isTile(u){ try{ return TILE_HOSTS.indexOf(new URL(u).hostname)>=0; }catch(_){ return false; } }
/* 古いタイルから削除（上限付き） */
function prune(c){
  return c.keys().then(function(ks){
    if(ks.length<=TILE_CAP) return;
    return Promise.all(ks.slice(0, ks.length-TILE_CAP).map(function(k){ return c.delete(k); }));
  }).catch(function(){});
}
self.addEventListener('fetch', function(e){
  var req=e.request;
  if(req.method!=='GET') return;
  var url; try{ url=new URL(req.url); }catch(_){ return; }

  /* --- 地図タイル: キャッシュ優先 + 上限付き --- */
  if(isTile(req.url)){
    e.respondWith(caches.open(TILE).then(function(c){
      return c.match(req).then(function(hit){
        if(hit){ if(url.search.indexOf('__noupd')<0){ fetch(req).then(function(r){ try{ if(r&&r.ok){ c.put(req,r.clone()); prune(c); } }catch(_){} }).catch(function(){}); } return hit; }
        return fetch(req).then(function(r){ try{ if(r&&r.ok){ c.put(req,r.clone()); prune(c); } }catch(_){} return r; })
          .catch(function(){ return new Response('',{status:504}); });
      });
    }));
    return;
  }
  if(url.origin!==location.origin) return;

  var fresh=false; try{ fresh=url.search.indexOf('fresh=1')>=0; }catch(_){}
  var isDoc = req.mode==='navigate' || /\.html?$/.test(url.pathname) || url.pathname.slice(-1)==='/';
  if(isDoc){
    e.respondWith(caches.open(CACHE).then(function(c){
      if(fresh){ try{ caches.keys().then(function(ks){ ks.forEach(function(k){ caches.delete(k); }); }); }catch(_){} }
      var base = fresh ? fetch(req,{cache:'no-store'}) : c.match(req).then(function(hit){ return hit||fetch(req,{cache:'no-store'}); });
      return base.then(function(res){
        if(!fresh){ try{ if(res&&res.ok) c.put(req,res.clone()); }catch(_){} }
        try{
          res.clone().text().then(function(cur){
            fetch(req,{cache:'no-store'}).then(function(r){ return r.text(); }).then(function(txt){
              var a=verOf(cur), b=verOf(txt);
              if(b&&a&&a!==b){
                c.put(req, new Response(txt,{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}})).catch(function(){});
                self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){
                  cs.forEach(function(cl){ try{ cl.postMessage({type:'km-update-ready',version:b}); }catch(_){} });
                }).catch(function(){});
              }
            }).catch(function(){});
          }).catch(function(){});
        }catch(_){}
        return res;
      }).catch(function(){ return c.match(req).then(function(h){ return h||c.match('./index.html').then(function(h2){ return h2||new Response('offline',{status:503}); }); }); });
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(function(c){
    return c.match(req).then(function(hit){
      if(hit){ fetch(req).then(function(r){ try{ if(r&&r.ok) c.put(req,r.clone()); }catch(_){} }).catch(function(){}); return hit; }
      return fetch(req).then(function(r){ try{ if(r&&r.ok) c.put(req,r.clone()); }catch(_){} return r; }).catch(function(){ return new Response('',{status:503}); });
    });
  }));
});
self.addEventListener('message', function(e){
  try{ var d=e.data||{};
    if(d.type==='km-skip-waiting') self.skipWaiting();
    if(d.type==='km-clear-cache'){ caches.keys().then(function(ks){ ks.forEach(function(k){ caches.delete(k); }); }); }
    if(d.type==='km-tile-stats'){ caches.open(TILE).then(function(c){ return c.keys().then(function(ks){
      self.clients.matchAll({type:'window'}).then(function(cs){ cs.forEach(function(cl){ try{ cl.postMessage({type:'km-tile-stats',count:ks.length}); }catch(_){} }); }); }); }); }
  }catch(_){}
});
