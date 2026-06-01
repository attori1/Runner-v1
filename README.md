# ASTRO-RUN

> Endless runner spatial — HTML/CSS/JS pur, aucune dépendance.

Un astronaute fonce dans l'espace et doit esquiver rochers, lasers, satellites et mines. La vitesse augmente progressivement, le décor alterne entre nébuleuse et espace profond, et un classement des 5 meilleurs scores est sauvegardé localement.

## Contrôles

| Touche | Action |
|--------|--------|
| `Espace` / `↑` | Sauter |

## Power-ups

| Icône | Effet |
|-------|-------|
| ⭐️ Étoile cyan | Bouclier — absorbe un obstacle (5 s) |
| ⏱ Horloge jaune | Ralenti — divise la vitesse par deux (3 s) |

## Lancer le jeu

Ouvrir `index.html` dans n'importe quel navigateur moderne. Aucune installation, aucun serveur requis.

## Stack

- **Rendu** — API Canvas 2D HTML5
- **Graphismes** — sprites pixel art dessinés par le code
- **Persistance** — `localStorage` (meilleur score + classement)
- **Police** — Press Start 2P (Google Fonts)
