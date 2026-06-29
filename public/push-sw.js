// Web-push handlers, imported into the generated Workbox service worker
// (see vite.config.js → workbox.importScripts). Shows match notifications and
// focuses/opens the relevant match page when one is tapped.

self.addEventListener("push", (event) => {
  let data;
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "OctoScore", body: event.data && event.data.text() };
  }

  const title = data.title || "OctoScore";
  const options = {
    body: data.body || "",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: data.tag || "octoscore",
    renotify: true,
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus an open tab if we have one, navigating it to the target.
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      // Otherwise open a fresh window.
      if (self.clients.openWindow) return self.clients.openWindow(target);
      return undefined;
    })
  );
});
