// Enregistrement du service worker.
//
// Il n'est disponible qu'en contexte securise : ouvrir index.html en file://
// ou servir la page en HTTP simple le rend inaccessible, et c'est normal. Le
// jeu fonctionne sans, on perd seulement le mode hors ligne.
if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(error => {
            console.warn('Mode hors ligne indisponible :', error.message);
        });
    });
}
