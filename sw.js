// ============================================================
// THE GANG — SERVICE WORKER (handles push notifications)
// ============================================================

self.addEventListener("install", event => {
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(self.clients.claim());
});

// Fires when a push message arrives from the push service,
// even if no tab of this site is open.
self.addEventListener("push", event => {

    let payload = {
        title: "THE GANG",
        body: "You have a new notification.",
        url: "/"
    };

    if (event.data) {

        try {
            payload = event.data.json();
        } catch (error) {
            payload.body = event.data.text();
        }
    }

    const options = {
        body: payload.body,
        tag: payload.tag || "gang-notification",
        data: {
            url: payload.url || "/"
        }
    };

    event.waitUntil(
        self.registration.showNotification(
            payload.title || "THE GANG",
            options
        )
    );
});

// Fires when the user clicks the OS notification.
self.addEventListener("notificationclick", event => {

    event.notification.close();

    const targetUrl =
        (event.notification.data && event.notification.data.url) ||
        "/";

    event.waitUntil(
        self.clients
            .matchAll({
                type: "window",
                includeUncontrolled: true
            })
            .then(clientList => {

                for (const client of clientList) {

                    if (
                        "focus" in client
                    ) {
                        client.focus();
                        return;
                    }
                }

                if (self.clients.openWindow) {
                    return self.clients.openWindow(targetUrl);
                }
            })
    );
});