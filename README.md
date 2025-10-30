# html_multiplication

Un jeu educatif pour reviser les tables de multiplication et d'addition !

**Version 1.3**

## Description

Site web interactif pour apprendre et s'entrainer aux tables de multiplication et d'addition. Developpe pour mes enfants (Emilie, Louane, Arthur et Flora).

## Fonctionnalites

### Jeu Principal
- **Operations** : Multiplication ou addition
- **Systeme de points** : 3 rangees de 10 diamants de couleurs differentes (jaune, rose, brillant)
- **Timer configurable** : 15, 20 ou 30 secondes par question
- **Musique de fond** et effets sonores (victoire et erreurs)
- **Animation de confettis** a la victoire
- **Interface coloree** avec police personnalisee

### Configuration du Jeu
- Choix du type d'operation (multiplication ou addition)
- Selection des tables a reviser (0 a 10)
- Deux modes de difficulte :
  - **Facile** : Perte des diamants de la rangee actuelle seulement
  - **Difficile** : Remise a zero complete
- Choix de la duree du timer
- Selection des joueurs (jusqu'a 4 joueurs)
- Sauvegarde automatique des preferences dans le navigateur

### High Scores
- Enregistrement automatique de toutes les victoires
- Affichage du temps total pour completer le jeu
- Classement du meilleur au moins bon
- Filtres par type d'operation et difficulte
- Top 3 mis en evidence (or, argent, bronze)
- Conservation des 50 meilleurs scores
- Details complets : date, joueur(s), temps, mode de jeu, tables utilisees

## Structure du Projet

```
html_multiplication/
├── index.html              # Page principale du jeu
├── config.html            # Page de configuration
├── highscores.html        # Page des high scores
├── style.css              # Styles pour toutes les pages
├── script.js              # Logique principale du jeu
├── config.js              # Gestion de la configuration
├── config-script.js       # Script de la page de configuration
├── highscores-script.js   # Script de la page des high scores
├── README.md              # Ce fichier
└── img/                   # Ressources multimedia
    ├── Daydream.ttf       # Police personnalisee
    ├── theme.mp3          # Musique de fond
    ├── victory.mp3        # Son de victoire
    ├── erreur.wav         # Son d'erreur
    ├── config.png         # Icone de configuration
    ├── trophee.png        # Icone des high scores
    ├── diamond_yellow.png # Diamant jaune (rangee 1)
    ├── diamond_pink.png   # Diamant rose (rangee 2)
    └── diamond_shine.png  # Diamant brillant (rangee 3)
```

## Technologies Utilisees

- **HTML5** : Structure des pages
- **CSS3** : Design et animations
- **JavaScript** (vanilla) : Logique du jeu
- **localStorage** : Sauvegarde des preferences et scores
- **canvas-confetti** : Animations de celebration

## Comment Utiliser

1. Ouvrir `index.html` dans un navigateur web
2. Cliquer sur l'icone de configuration (roue dentee) pour personnaliser le jeu
3. Choisir les parametres souhaites et cliquer sur "Sauvegarder et jouer"
4. Cliquer sur "C'est parti !" pour commencer
5. Repondre aux questions avant la fin du timer
6. Collecter 30 diamants pour gagner !
7. Consulter les high scores en cliquant sur l'icone trophee

## Regles du Jeu

- Repondre correctement ajoute 1 diamant
- Une mauvaise reponse ou un timer ecoule :
  - **Mode facile** : Perte des diamants de la rangee actuelle
  - **Mode difficile** : Perte de tous les diamants
- 10 diamants jaunes → passage aux diamants roses
- 10 diamants roses → passage aux diamants brillants
- 10 diamants brillants → VICTOIRE !

## Auteur

Cree avec amour pour mes enfants

## Historique des Versions

### Version 1.3 (Actuelle)
- Ajout du systeme de high scores avec classement
- Suivi du temps total de jeu
- Filtres par operation et difficulte dans les scores
- Son d'erreur lors de mauvaises reponses
- Remplacement des emojis par des icones PNG
- Fusion de tous les CSS en un seul fichier
- Amelioration de l'interface de configuration

### Version 1.2
- Ajout de la page de configuration
- Support des additions en plus des multiplications
- Deux modes de difficulte (facile/difficile)
- Timer configurable (15/20/30 secondes)
- Selection des joueurs (jusqu'a 4)
- Sauvegarde des preferences dans localStorage

### Version 1.1
- Correction des bugs du timer
- Correction de la logique d'affichage des diamants
- Ajout des balises HTML5 et meta tags
- Optimisation du code

### Version 1.0
- Version initiale du jeu
- Tables de multiplication uniquement
- Systeme de diamants (3 couleurs)
- Timer de 15 secondes
- Musique de fond et son de victoire
- Animation de confettis

## Auteur

Cree avec amour pour mes enfants

## Licence

Projet personnel - Usage libre
