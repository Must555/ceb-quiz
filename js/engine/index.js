// Point d'entrée du moteur de quiz.
export { chargerDonnees } from './loader.js';
export { QuizSession, bonneReponseLisible, reponseEleveLisible, estJouable } from './session.js';
export { genererVariante, remplir } from './generator.js';
export { corriger, formesRectifiees } from './checker.js';
export { formatNombre, parseNombre, normaliserTexte } from './format.js';
export { createRng } from './random.js';
export { ExamenReel, livretsReels } from './examen-reel.js';
