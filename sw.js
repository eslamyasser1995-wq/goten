// Service worker: يخلّي التطبيق يفتح بسرعة ويشتغل كتطبيق على الآيفون
const V = "goten-v14";
const SHELL = ["./", "index.html", "styles.css", "config.js", "ui.js", "store.js", "customer.js", "manifest.webmanifest", "icon-192.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
// الشبكة أولاً (عشان التعديلات توصل فوراً)، والكاش احتياطي لو النت مقطوع
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(V).then((ca) => ca.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});

// إشعارات الطلبات
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: "Goten", body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "Goten", { body: d.body || "", icon: "icon-192.png", badge: "icon-192.png", data: { url: d.url || "admin.html" }, tag: d.tag, renotify: true }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "admin.html", self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => { for (const w of ws) { if (w.url.startsWith(url) && "focus" in w) return w.focus(); } return clients.openWindow(url); }));
});
