// Couche de stockage unifiee.
//
// Historique : la v1.4 etait passee de localStorage aux cookies pour rester
// utilisable en ouvrant index.html directement (file://). Le probleme est qu'un
// cookie plafonne a ~4 Ko : au-dela d'une vingtaine de scores, l'ecriture
// echouait sans le moindre message et tout l'historique disparaissait.
//
// Le jeu est desormais servi en HTTPS, donc localStorage (5 Mo) redevient
// disponible. On le prend en priorite, on retombe sur les cookies uniquement
// quand il est inaccessible (file://, navigation privee tres stricte), et on
// migre au passage les donnees laissees par les anciennes versions.

const GameStorage = (function () {
    let hasLocalStorage = false;
    try {
        const probe = '__storage_probe__';
        localStorage.setItem(probe, '1');
        localStorage.removeItem(probe);
        hasLocalStorage = true;
    } catch (e) {
        hasLocalStorage = false;
    }

    function setCookie(name, value, days = 365) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
    }

    function getCookie(name) {
        const prefix = name + '=';
        for (const part of document.cookie.split(';')) {
            const c = part.trimStart();
            if (c.startsWith(prefix)) {
                return decodeURIComponent(c.slice(prefix.length));
            }
        }
        return null;
    }

    function deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    }

    function get(key) {
        if (!hasLocalStorage) {
            return getCookie(key);
        }
        const stored = localStorage.getItem(key);
        if (stored !== null) {
            return stored;
        }
        // Migration unique depuis un cookie laisse par la v1.4 a la v1.7.
        // On supprime ensuite le cookie : il partait avec chaque requete HTTP,
        // y compris celles des images et du son, ce qui gaspillait de la data.
        const legacy = getCookie(key);
        if (legacy !== null) {
            try {
                localStorage.setItem(key, legacy);
            } catch (e) {
                return legacy;
            }
            deleteCookie(key);
            return legacy;
        }
        return null;
    }

    function set(key, value) {
        if (!hasLocalStorage) {
            setCookie(key, value);
            return getCookie(key) !== null;
        }
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.error(`Sauvegarde impossible pour "${key}"`, e);
            return false;
        }
    }

    function remove(key) {
        if (hasLocalStorage) {
            localStorage.removeItem(key);
        }
        deleteCookie(key);
    }

    return {
        get,
        set,
        remove,
        getJSON(key, fallback) {
            const raw = get(key);
            if (!raw) return fallback;
            try {
                return JSON.parse(raw);
            } catch (e) {
                console.error(`Donnees illisibles pour "${key}", retour aux valeurs par defaut`, e);
                return fallback;
            }
        },
        setJSON(key, value) {
            return set(key, JSON.stringify(value));
        }
    };
})();
