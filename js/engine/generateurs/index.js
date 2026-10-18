// Registre des générateurs codés en JS (pour ce qui ne tient pas dans un simple modèle JSON).
import { genererConjugaison } from './conjugaison.js';
import { genererRepereTemps } from './histoire.js';
import { genererFaits } from './faits.js';
import { GENERATEURS as FR } from './gen-francais.js';
import { GENERATEURS as MA } from './gen-nombres.js';
import { GENERATEURS as HG } from './gen-histgeo.js';
import { GENERATEURS as SC } from './gen-sciences.js';
import { GENERATEURS as TC_FR } from './tc-fr.js';
import { GENERATEURS as TC_MA } from './tc-ma.js';
import { GENERATEURS as TC_HG } from './tc-hg.js';
import { GENERATEURS as TC_SC } from './tc-sc.js';

export const GENERATEURS = {
  conjugaison: genererConjugaison,
  repere_temps: genererRepereTemps,
  faits: genererFaits,
  ...FR, ...MA, ...HG, ...SC,
  ...TC_FR, ...TC_MA, ...TC_HG, ...TC_SC,
};
