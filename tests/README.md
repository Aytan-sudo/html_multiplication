# Tests

Le jeu n'a besoin d'aucun outil pour tourner : c'est du HTML, du CSS et du
JavaScript servis tels quels. Les tests, eux, s'executent sous Node avec
[jsdom](https://github.com/jsdom/jsdom), qui simule un navigateur en memoire.

```bash
npm install   # une seule fois, installe jsdom
npm test
```

## Ce que couvre chaque fichier

| Fichier | Contenu |
|---|---|
| `test-game.js` | Une partie complete jouee dans jsdom : ecran titre, bonnes et mauvaises reponses, temps ecoule, pause quand on quitte l'onglet, changements de rangee, victoire, sauvegarde du score. |
| `test-pages.js` | Page de configuration (construction du formulaire, case "toutes les tables", validation, reinitialisation) et page des scores (tri, filtres, effacement, echappement des noms). |
| `test-migration.js` | Reprise des cookies laisses par la v1.7 vers localStorage, et repli sur les cookies quand le stockage local est interdit. |
| `test-picker.js` | Comportement statistique du tirage adaptatif sur 20 000 questions. |
| `test-live.js` | Verification du site reellement publie sur GitHub Pages : balises mobiles, manifeste, partie complete jouee sur les fichiers telecharges, poids du premier chargement, archive v1.7 toujours en ligne. Se lance a part avec `npm run test:live` (necessite une connexion). |

## Une particularite du harnais

Les scripts du jeu sont des `<script>` classiques, pas des modules. Leurs
declarations `const` de premier niveau vivent dans l'environnement lexical
global, et un `eval` indirect ne les y laisse pas : chaque appel a `window.eval`
cree puis jette sa propre portee. Les tests concatenent donc tous les scripts en
un seul `eval`, comme le ferait le navigateur, puis exposent ce dont ils ont
besoin via un objet `window.__t`.

Meme raison pour le `DOMContentLoaded` : jsdom emet le sien de facon asynchrone.
Sans attendre l'evenement `load` avant d'installer les scripts, le dispatch
manuel et celui de jsdom enregistrent les ecouteurs deux fois, et chaque clic
compte double.
