/* ArtimoManager – sw.js – verze v1.2 – created by Martin Hejhal
   Umožní spustit Vedoucího a Pomocníka i bez internetu (po prvním načtení s internetem).
   Nahrajte tento soubor vedle index.html (stejný soubor pro obě aplikace). Bez něj aplikace fungují jako dřív. */
const CACHE = "artimo-manager-v1";
const CDN = ["https://www.gstatic.com/firebasejs/", "https://cdn.jsdelivr.net/npm/"];

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = req.url;
  // knihovny mají verzi v adrese a nemění se: nejdřív paměť, pak síť
  if (CDN.some(p => url.startsWith(p))) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone());
      return res;
    }));
    return;
  }
  // stránka aplikace: nejdřív síť (nová verze se projeví hned), bez sítě poslední uložená
  if (req.mode === "navigate" && new URL(url).origin === self.location.origin) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const key = new URL(url).pathname;
      try {
        const res = await fetch(req, { cache: "no-store" });
        if (res && res.ok) c.put(key, res.clone());
        return res;
      } catch (err) {
        const hit = await c.match(key);
        if (hit) return hit;
        throw err;
      }
    }));
  }
  // vše ostatní (databáze, přihlášení) jde přímo do sítě
});
