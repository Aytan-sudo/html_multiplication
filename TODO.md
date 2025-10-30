# TODO - html_multiplication

## Bugs a corriger

### 1. ~~Selection joueur unique~~ ✅ FAIT (v1.4)
- [x] Modifier config.html pour permettre la selection d'un seul joueur (radio buttons au lieu de checkboxes)
- [x] Mettre Emilie par defaut
- [x] Adapter le texte du bouton "C'est parti, [nom du joueur] !"

### 2. ~~Timer disparait a la victoire~~ ✅ FAIT (v1.4)
- [x] Cacher le timer quand on affiche "VICTOIRE !"
- [x] Nettoyer l'affichage de fin de jeu

### 3. ~~Affichage du score sur l'ecran de victoire~~ ✅ FAIT (v1.4)
- [x] Afficher le temps realise au format high score (mm:ss)
- [x] Montrer le rang du joueur dans le classement
- [x] Afficher le mode de jeu (operation + difficulte)

### 4. ~~Apparition immediate de la nouvelle couleur de diamants~~ ✅ FAIT (v1.4)
- [x] Quand on passe a 10 diamants (changement de rangee), afficher immediatement 1 diamant de la nouvelle couleur
- [x] Eviter l'affichage vide entre deux rangees
- [x] La logique doit etre : 10e diamant jaune = 1er diamant rose qui apparait

### 5. ~~Taille de l'affichage des high scores~~ ✅ FAIT (v1.4)
- [x] Reduire la taille de la police dans la grille des scores
- [x] Ajuster l'espacement pour eviter les superpositions
- [x] Tester sur differentes tailles d'ecran

### 6. ~~Taille de l'interface de configuration~~ ✅ FAIT (v1.4)
- [x] Reduire legerement la taille de la police dans config.html
- [x] Ajuster les espacements pour un affichage plus compact

### 7. ~~Compatibilite file://~~ ✅ FAIT (v1.4)
- [x] Migration de localStorage vers cookies
- [x] Compatibilite avec ouverture locale sans serveur web

---

## Nouveaux bugs a corriger

### 8. Ecran de victoire casse
- [ ] Les confettis n'apparaissent plus (remplaces par l'ecran de score)
- [ ] Le timer continue de tourner et affiche un popup "temps ecoule"
- [ ] Les diamants violets s'affichent apres le timer
- [ ] SOLUTION : Garder les confettis + afficher le score + masquer le timer + pas de popup
- [ ] Ajouter un bouton "Retour a l'ecran titre" sur l'ecran de victoire

### 9. Tables par defaut dans config
- [ ] Les tables 0, 1 et 10 doivent etre cochees OUI par defaut
- [ ] Ne pas afficher ces tables dans l'interface (ou les griser/desactiver)
- [ ] L'utilisateur choisit uniquement les tables de 2 a 9

### 10. Bouton mute/unmute
- [ ] Ajouter un bouton en haut a gauche avec icone son (mute.png / unmute.png)
- [ ] Par defaut : unmute (son active)
- [ ] Au clic : toggle entre mute et unmute
- [ ] Quand mute : couper tous les sons (theme, victory, erreur)
- [ ] Revenir a unmute par defaut a chaque nouvelle partie

### 11. Choix de couleur de fond
- [ ] Ajouter une option dans config.html pour choisir la couleur de fond
- [ ] Proposer 4 couleurs :
  - Rose actuel (#f8c3d3)
  - Bleu clair (#b3d9ff)
  - Vert pastel (#c8e6c9)
  - Jaune clair (#fff9c4)
- [ ] Sauvegarder le choix dans la config (cookies)
- [ ] Appliquer la couleur sur toutes les pages (index, config, highscores)

## Ameliorations futures (a etudier)

### Proposition 1 : Mode entrainement libre
- Permettre de jouer sans timer pour s'entrainer tranquillement
- Pas de perte de diamants en cas d'erreur, juste un compteur d'erreurs
- Ideal pour les debutants ou pour reviser calmement
- Pas de sauvegarde dans les high scores

### Proposition 2 : Statistiques detaillees
- Page de stats montrant pour chaque joueur :
  - Nombre de parties jouees
  - Taux de reussite par table
  - Tables les plus difficiles (le plus d'erreurs)
  - Progression dans le temps (graphique)
  - Temps moyen par question
- Aide a identifier les tables a travailler en priorite

### Proposition 3 : Mode challenge a deux joueurs
- Deux joueurs jouent en meme temps sur le meme ecran
- Chacun a son propre timer et ses propres diamants
- Le premier a atteindre 30 diamants gagne
- Affichage cote a cote avec competition directe
- Option : meme questions pour les deux ou questions differentes
