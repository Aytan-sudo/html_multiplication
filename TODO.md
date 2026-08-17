# TODO - html_multiplication

## Version 2.0 &mdash; refonte mobile ✅ FAIT

### Jouabilite sur telephone
- [x] Bouton de validation (le pave numerique mobile n'a pas de touche Entree)
- [x] Clavier purement numerique (`inputmode="numeric"`) et filtrage des chiffres
- [x] Le clavier reste ouvert entre deux questions
- [x] Mise en page adaptative, `100dvh` au lieu de `100vh`
- [x] Diamants en grille de dix colonnes au lieu de 64 px fixes
- [x] Cibles tactiles de 44 px minimum, effets de survol reserves a la souris
- [x] Prise en compte des encoches (`env(safe-area-inset-*)`)
- [x] Mode paysage sur petit ecran
- [x] Bouton de son et bouton Quitter accessibles pendant la partie

### Application installable
- [x] `manifest.webmanifest`, icones 192 et 512
- [x] Service worker, jeu utilisable hors connexion
- [x] `theme-color` suivant la couleur de fond choisie

### Corrections
- [x] Scores perdus au-dela de ~20 parties (limite de 4 Ko des cookies)
- [x] Calcul du rang casse sur l'ecran de victoire
- [x] `calcNum_B` declaree implicitement en global
- [x] Logique de penalite dupliquee a deux endroits
- [x] `innerHTML +=` en boucle pour dessiner les diamants
- [x] Absence de retour visuel sur bonne et mauvaise reponse
- [x] `const Storage` masquait `window.Storage`, un global du navigateur
- [x] `.DS_Store` versionne

### Pedagogie
- [x] Tirage pondere par les erreurs passees, par joueur et par operation
- [x] Les operations triviales passent de 54 % a 20 % des questions
- [x] Statistiques par operation enregistrees (base pour une future page de stats)

### Poids et deploiement
- [x] Medias divises par trois, musique chargee au lancement de la partie
- [x] Confetti servi depuis le depot au lieu d'un CDN
- [x] Publication sur GitHub Pages
- [x] Archivage de la v1.7 dans `v1.7/`
- [x] Suite de tests sous Node + jsdom

---

## Version 2.1 &mdash; clavier virtuel et debordements ✅ FAIT

### Le clavier ne recouvre plus le jeu
- [x] Mesure de la zone visible via `window.visualViewport` (`js/viewport.js`)
- [x] `interactive-widget=resizes-content` pour Android
- [x] Quatre niveaux de compacite selon la hauteur disponible
- [x] Cadre de jeu en position fixe, cale sur `visualViewport.offsetTop` (iOS)
- [x] Barre du haut remise dans le flux : en `fixed`, elle derivait sur iOS
- [x] Le champ de saisie ne descend jamais sous 16 px (sinon Safari zoome)

### Debordements corriges
- [x] Bouton Quitter coupe sur petit ecran (`min-width: 0` manquant)
- [x] Icones trophee et config visibles pendant la partie : `display: flex`
      neutralisait l'attribut `hidden`
- [x] Prenoms des joueurs qui se chevauchaient dans la configuration
- [x] Flash de bonne reponse qui peignait la moitie de l'ecran

### Mise en page
- [x] Question centree verticalement au lieu d'un `space-between` qui etalait
      trois blocs sur toute la hauteur
- [x] Rangee de diamants dessinee en entier, emplacements a gagner en
      transparence : plus de sursaut a chaque bonne reponse
- [x] Mode paysage simplifie (la mise en colonnes repoussait la question
      dans un coin)

### Verification
- [x] Tests de mise en page mesures dans un vrai Chrome, neuf tailles d'ecran,
      clavier ferme et clavier ouvert, sur les deux comportements iOS/Android
- [x] Detection des elements rognes par `overflow: hidden`, invisibles pour
      un controle de `scrollWidth`
- [x] Detection des textes qui debordent de leur pastille et des pastilles
      qui se recouvrent

---

## Pistes pour la suite

### Page de statistiques
Les donnees sont deja collectees (`stats:<joueur>:<operation>` dans
`localStorage`, un compteur de reussites et d'echecs par operation). Il ne
manque que la page qui les affiche :
- table de multiplication coloree selon le taux de reussite
- operations les plus ratees, pour savoir quoi travailler
- progression dans le temps

### Mode entrainement libre
- Pas de timer, pas de perte de diamants, juste un compteur d'erreurs
- Pas d'enregistrement dans les meilleurs scores

### Mode deux joueurs
- Deux joueurs sur le meme ecran, chacun son timer et ses diamants
- Le premier a trente diamants gagne

### Idees plus legeres
- Bonus de serie : plusieurs bonnes reponses d'affilee rapportent davantage
- Choix de la plage du premier operande (aujourd'hui figee de 0 a 9)
- Export et import des scores, pour passer d'un appareil a l'autre
- Verifier les droits sur `assets/audio/theme.mp3` et le son d'erreur, le jeu
  etant desormais publie sur une page publique
