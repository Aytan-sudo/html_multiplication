# html_multiplication

Un jeu educatif pour reviser les tables de multiplication et d'addition.

**Version 2.6.4** &mdash; jouable en ligne, telephone compris :
**https://aytan-sudo.github.io/html_multiplication/**

Developpe pour mes enfants (Emilie, Louane, Arthur et Flora).

## Version 2.6.6 — Passeport 1.7.0

Module commun du passeport 1.7.0 : 2048 rejoint le thème Nombres, Snake ouvre le
thème Aventure, Motamorphose le thème Mots, et Dames, Diamants, Laser & Miroirs
et Untangle rejoignent le thème Logique. Rien ne change dans le jeu.

## Version 2.6.5

Trois manques releves en verifiant le jeu dans le simulateur iOS de Xcode.

- **Le viewport interdit le zoom tactile** (`user-scalable=no`), sur les trois
  pages.
- **`interactive-widget=resizes-content` passe dans `js/viewport.js`**, et n'est
  ajoute que hors WebKit. La cle sert a Android ; Safari ne la connait pas et
  ecrivait un avertissement dans la console a chaque chargement. Android garde
  son comportement, la console iOS est propre.
- **Les cibles tactiles restent a 44 px au niveau compact 1.** Un iPhone SE ne
  laisse que 549 px de haut dans Safari d'iOS 26 : le jeu y tombait en
  permanence a ce niveau, ou les boutons passaient a 40 px. Les niveaux
  suivants, qui ne durent que le temps d'une saisie au clavier, sont
  inchanges.

## Version 2.6.4 — Passeport 1.6.0

Module commun du passeport 1.6.0 : Polyominos et Mosaïcomino rejoignent le thème
Logique. Rien ne change dans le jeu. Le numéro de cache suit.

## Version 2.6.3 — Passeport 1.5.0

Module commun du passeport 1.5.0 : L’Architecte et Solitaire rejoignent le thème
Logique, et les jeux raccordés plus tard entrent d’office dans les profils. Rien
ne change dans le jeu. Le numéro de cache suit.

## Version 2.6.2 — Passeport 1.4.0

Module commun du passeport 1.4.0, qui raccorde Démineur et Slitherlink au thème
Logique. Rien ne change dans le jeu ; le numéro de cache suit.

## Version 2.6.1 — Passeport 1.3.0

Module commun du passeport 1.3.0 : les profils peuvent choisir un style sobre
et se passer d'objectif hebdomadaire. Rien ne change dans le jeu ; le numéro de
cache suit pour que les appareils reçoivent ce module.

## Version 2.6.0 — Une victoire, un tampon

Une partie gagnée donne le tampon Nombres, au même titre que dix calculs
essayés. Passeport commun 1.2.0.

## Version 2.5.2 — Passeport 1.1.0

Module commun du passeport 1.1.0, qui raccorde SUTOM au thème Mots. Rien ne
change dans le jeu ; le numéro de cache suit pour que les appareils reçoivent
ce module.

## Version 2.5.1 — Passeport plus robuste

Module commun du passeport 1.0.1 : une donnée abîmée n’empêche plus l’export ni
l’ouverture des autres profils, et le jeu continue de fonctionner quand le hub
raccorde de nouveaux jeux avant sa propre mise à jour. Le numéro de cache change
pour que les appareils reçoivent ce module.

## Version 2.5.0 — Le passeport commun

Lancer le jeu depuis le hub associe la configuration, les scores et les révisions
ciblées au passeport de l’enfant. Dix calculs réellement essayés au cours d’une
partie donnent le tampon Nombres, même avec des erreurs ; un délai expiré ne
compte pas. Le bandeau affiche le prénom et permet de revenir au passeport.
La configuration et les scores conservent ce profil entre les pages. Les
anciens joueurs restent disponibles en mode invité. Le hub peut copier ces
données et exporter les nouvelles données par profil. Les fichiers communs
fonctionnent hors ligne, et les mises à jour préservent les caches des voisins.

Pour utiliser le passeport sur l’écran d’accueil, privilégier l’installation
du hub et ouvrir les jeux depuis celui-ci, dans le même espace de stockage.

## Le jeu

Une operation s'affiche, il faut repondre avant la fin du timer. Chaque bonne
reponse ajoute un diamant, une erreur en fait perdre. Trois rangees de dix
diamants et c'est gagne.

- **Operations** : multiplication ou addition
- **Tables** : selection libre de 2 a 9, toutes cochees par defaut (0, 1 et 10
  toujours presentes)
- **Timer** : 15, 20 ou 30 secondes par question
- **Difficulte** : facile (on perd la rangee en cours) ou difficile (retour a zero)
- **Joueur** : anonyme par defaut ; on peut choisir un prenom dans la
  configuration (Emilie, Louane, Arthur, Flora, Papa, Maman) pour retrouver ses
  scores et son entrainement cible
- **Meilleurs scores** classes par temps, avec filtres

## Installation sur telephone

Ouvrir le lien ci-dessus, puis "Ajouter a l'ecran d'accueil". Le jeu se lance
alors en plein ecran comme une application, et fonctionne **hors connexion**
une fois la premiere partie chargee.

## Ce qui a change depuis la v1.7

### Jouable au doigt

La v1.7 ne validait la reponse que sur la touche Entree. Comme le pave
numerique des telephones n'en a pas, le jeu etait litteralement injouable sur
mobile. Il y a desormais un bouton de validation, le clavier reste ouvert entre
deux questions, et la mise en page suit la taille de l'ecran.

### Le clavier virtuel ne recouvre plus le jeu

`100dvh` tient compte des barres du navigateur mais pas du clavier. Sur iOS, ni
`window.innerHeight` ni `100dvh` ne bougent quand le clavier s'ouvre : la page
reste haute de tout l'ecran alors que la moitie basse est cachee, et le chrono
se retrouve dessous.

`js/viewport.js` mesure donc la zone reellement visible avec
`window.visualViewport` et l'expose en variable CSS. Le jeu occupe exactement
cette zone, et quatre niveaux de compacite retrecissent progressivement les
tailles au lieu de laisser quoi que ce soit deborder :

| Hauteur disponible | Ce qui change |
|---|---|
| plus de 640 px | tailles pleines |
| 520 a 640 px | police et icones reduites, cibles tactiles tenues a 44 px |
| 300 a 520 px | mode serre, la ligne de progression disparait |
| moins de 300 px | la rangee de diamants est masquee au profit de la question |

Le cas le plus dur, telephone couche avec le clavier ouvert, ne laisse que
190 px : tout y tient encore. Le niveau 1 est le cas ordinaire du petit
telephone — un iPhone SE offre 549 px dans Safari d'iOS 26, clavier ferme — et
garde donc ses cibles a 44 px ; les niveaux 2 et 3 ne durent que le temps d'une
saisie.

Sur Android, `interactive-widget=resizes-content` fait deja retrecir la
fenetre ; la cle est ajoutee par `js/viewport.js`, hors WebKit seulement, parce
que Safari ne la connait pas et l'ecrit en avertissement dans la console. La
mesure prend le relais partout ailleurs.

### Entrainement cible

Le tirage n'est plus uniforme. Le jeu retient les reponses de chaque joueur et
repose plus souvent les operations ratees :

| | v1.7 | v2.0 |
|---|---|---|
| Questions triviales (x0, x1, x10) | 54 % | 20 % |
| Frequence d'une operation toujours ratee | x1 | x3,5 |
| Frequence d'une operation maitrisee | x1 | x0,4 |

L'option se desactive dans la configuration pour revenir au tirage au hasard.

### Les scores ne disparaissent plus

La v1.4 etait passee de `localStorage` aux cookies pour pouvoir ouvrir le jeu
en `file://`. Or un cookie plafonne a 4 Ko : au-dela d'une vingtaine de
victoires, la sauvegarde echouait **sans aucun message** et tout l'historique
etait perdu. Le jeu etant maintenant servi en HTTPS, il utilise `localStorage`
(5 Mo) et reprend automatiquement les anciennes donnees. Les cookies restent en
repli si le stockage local est interdit.

### Trois fois plus leger

| | v1.7 | v2.0 |
|---|---|---|
| Musique de fond | 5,9 Mo | 1,4 Mo |
| Son de victoire | 672 Ko | 410 Ko |
| Son d'erreur | 83 Ko | 8 Ko |
| Images | 115 Ko (PNG) | 53 Ko (WebP) |

La musique n'est plus telechargee au chargement de la page mais au lancement de
la partie : consulter les scores ne coute plus 6 Mo de donnees mobiles. Le
confetti est servi depuis le depot au lieu d'un CDN externe.

### Corrections

- Le calcul du rang sur l'ecran de victoire comparait des dates reconstruites a
  la main et ne trouvait jamais rien ; il s'appuie desormais sur un identifiant
  unique par partie.
- La partie se met en pause quand on quitte l'onglet ou l'application, au lieu
  de laisser le chrono courir pendant un appel telephonique.
- Le timer vise une echeance absolue : il ne derive plus et resiste au bridage
  des navigateurs mobiles en arriere-plan.
- Bonne et mauvaise reponse declenchent un retour visuel, utile quand le son est
  coupe.
- Le bouton de son reste accessible pendant la partie, et le choix est conserve.
- La logique de penalite, dupliquee a deux endroits, est unifiee.
- Les noms de joueurs sont inseres en texte et jamais interpretes comme du HTML.

## Structure

```
html_multiplication/
├── index.html            # jeu
├── config.html           # configuration
├── highscores.html       # meilleurs scores
├── manifest.webmanifest  # installation sur l'ecran d'accueil
├── sw.js                 # service worker (mode hors ligne)
├── css/style.css
├── js/
│   ├── viewport.js       # mesure la zone visible, gere le clavier virtuel
│   ├── storage.js        # localStorage, avec repli cookies et migration
│   ├── config.js         # valeurs par defaut, chargement, validation
│   ├── questions.js      # tirage adaptatif des operations
│   ├── game.js           # moteur du jeu
│   ├── config-page.js
│   ├── highscores-page.js
│   ├── register-sw.js
│   └── vendor/confetti.min.js
├── assets/
│   ├── fonts/Daydream.ttf
│   ├── audio/            # theme.mp3, victory.mp3, error.mp3
│   └── img/              # diamants, icones, icones d'application
├── tests/                # jsdom, plus mesures de mise en page sous Chrome
└── v1.7/                 # version d'origine archivee
```

## Une contrainte a connaitre

`assets/fonts/Daydream.ttf` ne contient que 88 caracteres : **pas d'accents, et
pas de signe multiplie**. C'est pour cette raison que le texte du jeu s'ecrit
sans accents et que la multiplication utilise un `x` minuscule. Le texte qui doit
etre en francais correct (libelles de configuration, tableau des scores) est
rendu avec la police du systeme.

## Developpement

Le jeu n'a besoin d'aucun outil de construction. Pour le servir en local :

```bash
npm run serve      # http://localhost:8765
```

Le service worker exige un contexte securise : en `file://` ou en HTTP simple,
le mode hors ligne est inactif, mais le jeu fonctionne normalement.

Pour lancer les tests :

```bash
npm install
npm test                                 # 141 assertions sous jsdom
npx puppeteer browsers install chrome    # une seule fois
npm run test:layout                      # 457 mesures dans un vrai Chrome
npm run test:live                        # verifie le site publie
```

Le test de mise en page ouvre le jeu sur neuf tailles d'ecran, clavier ferme
puis clavier ouvert, et verifie qu'aucun element n'est rogne. Voir
`tests/README.md` pour ce que cette approche attrape et qu'un DOM sans calcul
de position laisse passer.

## Version archivee

La v1.7 reste consultable telle quelle dans `v1.7/`, avec ses propres fichiers
media, et en ligne sur
**https://aytan-sudo.github.io/html_multiplication/v1.7/**

A savoir : la v2 deplace les donnees des cookies vers `localStorage` et efface
les cookies au passage. L'archive repartira donc d'une configuration par defaut
et sans historique de scores.

## Historique des versions

### Version 2.4 (actuelle)

- Les configurations enregistrees par une version <= 2.1 passent a « toutes les
  tables ». Le nouveau defaut existait depuis la 2.2, mais la selection deja
  stockee (tables 2 a 5) le recouvrait a chaque chargement.
- Une selection differente de l'ancien defaut est un choix delibere : elle est
  conservee telle quelle.
- Les migrations sont desormais appliquees par palier, selon le numero de format
  d'origine, pour qu'une nouvelle migration ne rejoue pas les precedentes.

### Version 2.3

- Le numero de version est affiche en bas de la page de configuration. Il est
  lu depuis le code reellement charge : si le service worker sert encore un
  ancien cache, c'est l'ancien numero qui s'affiche, ce qui permet de voir d'un
  coup d'oeil si la mise a jour est bien arrivee sur l'appareil.

### Version 2.2

- Plus de joueur preselectionne : la partie est anonyme tant qu'aucun prenom
  n'est choisi dans la configuration. Le jeu saluait « Emilie » au demarrage et
  lui attribuait le score de qui prenait la tablette.
- Reinitialisation unique du prenom au premier lancement de la 2.2 : la valeur
  enregistree venait de l'ancien defaut, pas d'un choix. Le reste de la
  configuration (tables, timer, couleur) est conserve.
- Toutes les tables sont cochees par defaut
- L'ecran titre resume « toutes les tables » au lieu de les enumerer
- Le harnais de `test-picker.js` repare : il cherchait encore `Storage`, renomme
  `GameStorage` en v2, et le test plantait au demarrage

### Version 2.1

- Le clavier virtuel ne recouvre plus le jeu, sur iOS comme sur Android
- Quatre niveaux de compacite selon la hauteur reellement disponible
- Le bouton Quitter n'est plus coupe sur les petits ecrans
- Les icones trophee et configuration disparaissent bien pendant la partie
- Les prenoms des joueurs ne se chevauchent plus dans la configuration
- Rangee de diamants toujours dessinee en entier, emplacements a gagner en
  transparence : plus de sursaut de mise en page a chaque bonne reponse
- Question centree verticalement, retour visuel limite a la boite de question
- Tests de mise en page mesures dans un vrai navigateur

### Version 2.0

- Jeu utilisable sur telephone et tablette (bouton de validation, mise en page
  adaptative, cibles tactiles, gestion des encoches)
- Installable sur l'ecran d'accueil, fonctionne hors connexion
- Tirage adaptatif des questions selon les erreurs de chaque joueur
- Retour a `localStorage`, avec reprise des donnees des versions precedentes
- Medias divises par trois, musique chargee seulement au lancement de la partie
- Mise en pause automatique quand on quitte l'application
- Retour visuel sur bonne et mauvaise reponse
- Reecriture du moteur, suite de tests automatises
- Publication sur GitHub Pages

### Version 1.7

- Ajout des joueurs Papa et Maman
- Bouton "Toutes les tables"
- Indicateur des parties jouees avec toutes les tables
- Premieres regles responsive sur la page des scores

### Version 1.6

- Suppression des popups de confirmation

### Version 1.5

- Nettoyage du code, tables 0/1/10 masquees dans la configuration

### Version 1.4

- Migration de `localStorage` vers les cookies (compatibilite `file://`)
- Selection d'un seul joueur, ecran de victoire avec score et rang

### Version 1.3

- Systeme de meilleurs scores, son d'erreur, icones PNG

### Version 1.2

- Page de configuration, additions, modes de difficulte, timer configurable

### Version 1.1

- Corrections du timer et de l'affichage des diamants

### Version 1.0

- Version initiale : multiplications, diamants, timer, musique, confettis

## Auteur

Cree avec amour pour mes enfants.

## Licence

Projet personnel &mdash; usage libre.
