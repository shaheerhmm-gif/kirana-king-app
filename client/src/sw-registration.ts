// Service Worker Registration for Kirana King PWA

export function registerServiceWorker() {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('[SW] Service Worker registered:', registration);
                })
                .catch((error) => {
                    console.error('[SW] Service Worker registration failed:', error);
                });
        });
    }
}
