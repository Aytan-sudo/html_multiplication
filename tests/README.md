# Tests

Le jeu n'a besoin d'aucun outil pour tourner : c'est du HTML, du CSS et du
JavaScript servis tels quels. Les tests, eux, s'executent sous Node avec
[jsdom](https://github.com/jsdom/jsdom), qui simule un navigateur en memoire.

```bash
npm install   # une seule fois
npm test      # 141 assertions sous jsdom, sans reseau
```

Le test de mise en page a besoin d'un vrai moteur de rendu, parce qu'un
debordement ne se voit pas dans un DOM sans calcul de position :

```bash
npx puppeteer browsers install chrome   # une seule fois
npm run test:layout
```

Il ecrit aussi des captures dans `tests/shots/` (ignore par git), pratique pour
regarder ce que donne un changement de style sur chaque taille d'ecran.

## Pourquoi mesurer plutot que regarder le DOM

Trois bugs de cette version n'etaient visibles qu'en rendu reel :

- le bouton **Quitter** sortait du cadre sur un petit ecran. Comme le cadre est
  en `overflow: hidden`, il etait coupe et non defilable : `scrollWidth` restait
  parfaitement normal. D'ou le controle qui compare le rectangle de **chaque**
  element a celui du cadre.
- les icones trophee et configuration restaient affichees pendant la partie :
  `.topbar-right { display: flex }` neutralise l'attribut `hidden`. Dans jsdom,
  la propriete `.hidden` valait bien `true`, le test passait.
- les prenoms des joueurs se **chevauchaient** dans la configuration. Le
  document ne s'elargissait pas pour autant, d'ou le controle de recouvrement
  entre pastilles.

## Ce que couvre chaque fichier

| Fichier | Contenu |
|---|---|
| `test-game.js` | Une partie complete jouee dans jsdom : ecran titre, bonnes et mauvaises reponses, temps ecoule, pause quand on quitte l'onglet, changements de rangee, victoire, sauvegarde du score. |
| `test-pages.js` | Page de configuration (construction du formulaire, case "toutes les tables", validation, reinitialisation) et page des scores (tri, filtres, effacement, echappement des noms). |
| `test-migration.js` | Reprise des cookies laisses par la v1.7 vers localStorage, et repli sur les cookies quand le stockage local est interdit. |
| `test-picker.js` | Comportement statistique du tirage adaptatif sur 20 000 questions. |
| `test-layout.js` | Mise en page mesuree dans un vrai Chrome, sur neuf tailles d'ecran, clavier ferme puis clavier ouvert. Se lance a part avec `npm run test:layout`. |
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
