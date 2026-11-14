const CACHE='nsns-shell-v3';
const ASSETS=['/','/index.html','/manifest.webmanifest','/icon.svg','/icon-192.png','/icon-512.png','/apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nsns-shell-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==self.location.origin)return;
 if(r.mode==='navigate'){
  // オンラインなら最新を表示し、その最新版でオフライン用の控えも上書きする
  e.respondWith(fetch(r).then(res=>{
    if(res&&res.ok){const copy=res.clone();e.waitUntil(caches.open(CACHE).then(c=>Promise.all([c.put('/index.html',copy.clone()),c.put('/',copy)])))}
    return res;
  }).catch(()=>caches.match('/index.html').then(c=>c||caches.match('/'))));
  return;
 }
 // アイコン等：控えがあれば即表示しつつ、裏で最新を取って控えを更新
 e.respondWith(caches.open(CACHE).then(c=>c.match(r).then(hit=>{
  const net=fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res}).catch(()=>hit);
  if(hit){e.waitUntil(net);return hit}
  return net;
 })));
});
