// Registre des générateurs codés en JS (pour ce qui ne tient pas dans un simple modèle JSON).
import { genererConjugaison } from './conjugaison.js';
import { genererRepereTemps } from './histoire.js';

export const GENERATEURS = {
  conjugaison: genererConjugaison,
  repere_temps: genererRepereTemps,
};
