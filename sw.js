/* 街道ウォーキング v116 — 表示は「キャッシュ優先＋裏で更新」。
   ・HTML は前回の内容を即返してから、裏で新しい内容に更新（体感が速い）
   ・?fresh=1 を付けたときだけキャッシュを無視して取得
   ・インストール時に大きなファイルを先読みしない（初回の二重ダウンロードを防ぐ） */
var CACHE = 'kumanaku-v116';

self.addEventListener('install', function (e) { self.skipWaiting(); });

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== CACHE; })
                          .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (x) { return; }
  if (url.origin !== self.location.origin) return;

  var accept = req.headers.get('accept') || '';
  var isHTML = (req.mode === 'navigate') || (accept.indexOf('text/html') >= 0);

  if (isHTML) {
    var force = url.search.indexOf('fresh') >= 0;
    e.respondWith(caches.open(CACHE).then(function (c) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) { c.put('./index.html', res.clone()).catch(function () {}); }
        return res;
      }).catch(function () { return null; });
      if (force) { return net.then(function (r) { return r || c.match('./index.html').then(function (h) { return h || Response.error(); }); }); }
      return c.match('./index.html').then(function (hit) { return hit || net; });
    }));
    return;
  }

  e.respondWith(
    caches.open(CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          if (res && res.ok) { c.put(req, res.clone()).catch(function () {}); }
          return res;
        });
      });
    }).catch(function () { return fetch(req); })
  );
});
