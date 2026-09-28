# CEB Quiz

Site d'entraînement au CEB (Certificat d'Études de Base, FWB) pour les élèves de 6e primaire.
HTML/CSS/JavaScript natif, sans dépendance ni étape de build. Publié automatiquement sur
Netlify (https://ceb-quiz-bruxelles.netlify.app) à chaque push sur `main`.

## Arborescence
- `index.html` : l'application Mission CEB (connexion par pseudo, accueil, quiz, résultat, réglages)
- `css/app.css` : styles, 3 ambiances au choix (Néon, Pop, Sunset)
- `js/app/` : application (`app.js` écrans, `store.js` sauvegarde locale, `progression.js` XP/niveaux/série/défis/badges, `coach.js` points faibles et révisions, `question-ui.js` affichage des 10 types)
- `data/fiches.json` : 35 fiches Rappel ; chaque question pointe vers sa fiche (champ `fiche`)
- `assets/` : pages de portfolio utilisées par les examens
- `maquettes/` : propositions de design ; `moteur.html` : page de test du moteur
- `data/` : catalogue, banque de questions, modèles générés, examens officiels 2015-2026
- `js/engine/` : moteur de quiz
- `tests/` : tests automatiques (`npm test`, Node 20+)

## Moteur (`js/engine/`)
| Fichier | Rôle |
|---|---|
| `session.js` | `QuizSession` : tirage, **anti-répétition**, chrono, score, séries, XP, résumé par domaine |
| `generator.js` | Transforme un modèle JSON en question concrète (variables, dérivées, contraintes) |
| `generateurs/` | Générateurs codés : conjugaison, repères de temps (périodes, siècles) |
| `checker.js` | Correction par type (10 types), crédit partiel, tolérance virgule/unités/accents |
| `expr.js` | Évaluateur d'expressions sûr (aucun `eval`) pour les modèles |
| `loader.js` | Chargement des données JSON |

### Anti-répétition (règle absolue)
Dans une session, une question ne revient jamais :
1. ids déjà posés (questions fixes et variantes générées : `idModèle#valeurs`) ;
2. énoncés normalisés déjà posés (même texte sous deux ids) ;
3. un modèle est limité à 3 variantes par session et jamais tiré deux fois de suite.
Entre les sessions, l'historique de l'enfant sert de préférence : d'abord ce qu'il n'a jamais vu.

### Exemple
```js
import { chargerDonnees, QuizSession } from './js/engine/index.js';
const donnees = await chargerDonnees();
const s = new QuizSession(donnees, { nbQuestions: 10, matieres: ['ma'], dureeSecondes: 600 });
const q = s.suivante();        // question
const r = s.repondre('64,8');  // { correct, score, xpGagne, bonneReponse, explication, ... }
s.resume();                    // bilan + idsVus à mémoriser dans l'historique
```

## Coach (lot A)
- Maîtrise par notion : moyenne pondérée des 12 dernières réponses (les récentes comptent plus).
  Statuts : à découvrir (< 3 réponses), à retravailler (< 60 %), en progrès (< 80 % ou < 6 réponses), maîtrisé.
- Révision espacée : question ratée → revient à J+1, puis J+3, puis J+7 si réussie (boîtes de Leitner).
- Mission ciblée : option `poids` de `QuizSession` (notions fragiles ×20, révisions dues ×5, difficulté adaptée).
  L'anti-répétition n'est jamais affectée par la pondération.
