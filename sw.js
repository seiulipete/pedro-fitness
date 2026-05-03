const CACHE='pedrofit-v3';
const ASSETS=[
  '/pedro-fitness/',
  '/pedro-fitness/index.html',
  '/pedro-fitness/app.js',
  '/pedro-fitness/manifest.json',
  '/pedro-fitness/icon-192.png',
  '/pedro-fitness/icon-512.png',
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('/pedro-fitness/index.html'))));});
