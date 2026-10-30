// Confort et accessibilité : taille et espacement du texte, lecture à voix haute, sons, zoom des documents.
// Les réglages sont propres à chaque joueur (`j.confort`) et s'appliquent sur <html> (data-taille, data-espace).

export const CONFORT_DEFAUT = { taille: 'normal', espace: 'normal', voix: false, sons: true };
export const TAILLES = [['normal', 'Normal'], ['grand', 'Grand'], ['tres-grand', 'Très grand']];
export const ESPACES = [['normal', 'Normal'], ['aere', 'Aéré']];

export const confortDe = (j) => ({ ...CONFORT_DEFAUT, ...(j?.confort ?? {}) });

export function appliquerConfort(j, racine = document.documentElement) {
  const c = confortDe(j);
  racine.dataset.taille = c.taille;
  racine.dataset.espace = c.espace;
  sons.actifs = c.sons;
}

// ---------------------------------------------------------------- lecture à voix haute
// Jamais pour les questions de lecture ou d'écoute : on y évalue justement la compréhension du texte lu.
export const peutLireAVoixHaute = (q) => !/^fr\.(lire|ecouter)/.test(q?.domaine ?? '');
export const voixDisponible = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

const LETTRES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// Texte prononcé pour une question : énoncé puis propositions, sans emoji ni blancs typographiques.
export function texteAVoix(q) {
  const propre = (s) => String(s ?? '')
    .replace(/\{\d+\}/g, ' blanc ')
    .replace(/_{2,}|…{2,}|\.{4,}/g, ' blanc ')
    .replace(/[\p{Extended_Pictographic}️]/gu, '')
    .replace(/\s+/g, ' ').trim();
  const morceaux = [propre(q.enonce)];
  if (q.type === 'trous' && q.texte) morceaux.push(propre(q.texte));
  if (q.type === 'qcm' || q.type === 'qcm_multi') q.choix.forEach((c, i) => morceaux.push(`${LETTRES[i]} : ${propre(c)}`));
  if (q.type === 'vrai_faux') morceaux.push('Vrai ou faux ?');
  if (q.type === 'ordre') morceaux.push(...q.elements.map(propre));
  if (q.type === 'grille') q.lignes.forEach((l, i) => morceaux.push(`${propre(l)} : ${(q.colonnesParLigne?.[i] ?? q.colonnes).map(propre).join(' ou ')} ?`));
  if (q.type === 'association') morceaux.push(...q.gauche.map(propre));
  return morceaux.filter(Boolean).join('. ').replace(/([.?!:])\./g, '$1');
}

// ---------------------------------------------------------------- lecture à voix haute
// La voix du navigateur avale le début des phrases et coupe les longs blocs (surtout les voix
// en ligne de Chrome). On lit donc phrase par phrase, chacune seulement quand la précédente est
// finie, avec une courte pause, et on préfère une voix française installée sur l'appareil.
const PAUSE_PHRASE = 250; // ms
const PAUSE_LECTEUR = 500; // ms, quand la personne qui parle change
const LONGUEUR_MAX = 180; // au-delà, on coupe aussi aux virgules et points-virgules

// Découpe un texte en phrases à lire (le texte n'est pas modifié, seulement découpé).
export function decouperPhrases(texte) {
  const phrases = String(texte ?? '').replace(/\s+/g, ' ').trim()
    .split(/(?<=[.!?…])\s+(?=[«"“(—–-]?\s*[A-ZÀ-ÖØ-Þ0-9«"“(—–-])/u)
    .map((x) => x.trim()).filter(Boolean)
    // pas de coupure après une abréviation ou une initiale (M. Dupont, av. J.-C., Saint-J. …)
    .reduce((acc, x) => {
      const prec = acc[acc.length - 1];
      if (prec && /(?:^|[\s(])(?:M|Mme|Mlle|Mr|Dr|St|Ste|av|apr|env|cf|ex|p|n°|etc|[A-ZÀ-Þ]|J\.-C)\.$/u.test(prec)) acc[acc.length - 1] = `${prec} ${x}`;
      else acc.push(x);
      return acc;
    }, []);
  const res = [];
  for (const ph of phrases) {
    if (ph.length <= LONGUEUR_MAX) { res.push(ph); continue; }
    let cour = '';
    for (const bout of ph.split(/(?<=[,;:])\s+/u)) {
      if (cour && (cour + ' ' + bout).length > LONGUEUR_MAX) { res.push(cour); cour = bout; }
      else cour = cour ? `${cour} ${bout}` : bout;
    }
    if (cour) res.push(cour);
  }
  return res;
}

// Voix françaises, les mieux adaptées d'abord : installées sur l'appareil, puis belges, puis françaises.
function voixFrancaises() {
  const v = speechSynthesis.getVoices().filter((x) => x.lang?.replace('_', '-').startsWith('fr'));
  const rang = (x) => (x.localService ? 0 : 10) + (x.lang === 'fr-BE' ? 0 : x.lang === 'fr-FR' ? 1 : 2);
  return v.sort((a, b) => rang(a) - rang(b));
}

let lecture = 0; // numéro de la lecture en cours : une lecture arrêtée ne fait plus rien
let attente = null;
let son = null; // fichier audio en cours (textes d'écoute enregistrés)
let quandArrete = null; // prévient le bouton de la lecture interrompue (il revient à « Écouter »)

// Lit une liste de morceaux [{ texte, lecteur }] l'un après l'autre.
function lireMorceaux(morceaux, { onFin, rate = 0.9 } = {}) {
  if (!voixDisponible()) return false;
  taire();
  const num = lecture;
  const voix = voixFrancaises();
  const phrases = morceaux.flatMap((m) => decouperPhrases(m.texte).map((texte) => ({ texte, lecteur: m.lecteur ?? 1 })));
  let i = 0;
  const finir = () => { if (num === lecture) { lecture++; quandArrete = null; onFin?.(); } };
  const suivante = () => {
    if (num !== lecture) return;
    if (i >= phrases.length) return finir();
    const ph = phrases[i++];
    const u = new SpeechSynthesisUtterance(ph.texte);
    const k = ph.lecteur - 1;
    const v = voix[k % Math.max(1, voix.length)] ?? null;
    if (v) u.voice = v;
    u.lang = v?.lang ?? 'fr-BE';
    u.rate = rate;
    if (k > 0 && voix.length < 2) u.pitch = 0.8;
    let fait = false;
    const apres = () => {
      if (fait || num !== lecture) return;
      fait = true;
      const pause = phrases[i] && phrases[i].lecteur !== ph.lecteur ? PAUSE_LECTEUR : PAUSE_PHRASE;
      attente = setTimeout(suivante, pause);
    };
    u.onend = apres;
    u.onerror = (e) => { if (e.error === 'interrupted' || e.error === 'canceled') return; apres(); };
    speechSynthesis.speak(u);
  };
  quandArrete = onFin ?? null;
  // Chrome avale parfois ce qui est lancé juste après un arrêt : on laisse un court instant.
  attente = setTimeout(suivante, 60);
  return true;
}

export function parler(texte, { onFin } = {}) {
  return lireMorceaux([{ texte }], { onFin, rate: 0.92 });
}
export function taire() {
  lecture++;
  clearTimeout(attente);
  if (son) { son.pause(); son = null; }
  if (voixDisponible()) speechSynthesis.cancel();
  const f = quandArrete; quandArrete = null; f?.();
}

// ---------------------------------------------------------------- livrets « Écouter »
// Le texte officiel est lu segment par segment. Deux lecteurs (interview) : deux voix françaises
// si l'appareil en a deux, sinon une hauteur différente.
export function lireSegments(segments, { onFin } = {}) {
  return lireMorceaux(segments.map((s) => ({ texte: s.texte, lecteur: s.lecteur })), { onFin });
}

// Texte d'écoute : le fichier audio enregistré s'il existe, sinon (ou s'il ne se charge pas,
// par exemple hors ligne) la voix du navigateur. onTemps(écoulé, durée) en secondes.
export const audioPossible = () => typeof Audio !== 'undefined';
export function lireEcoute(doc, { onFin, onTemps } = {}) {
  if (!doc.audio || !audioPossible()) return lireSegments(doc.segments, { onFin });
  taire();
  const num = lecture;
  const a = new Audio(doc.audio);
  son = a;
  quandArrete = onFin ?? null;
  const finir = () => { if (num === lecture) { lecture++; son = null; quandArrete = null; onFin?.(); } };
  const repli = () => {
    if (num !== lecture || son !== a) return;
    son = null; quandArrete = null; // la voix prend le relais : le bouton reste sur « Arrêter »
    if (!lireSegments(doc.segments, { onFin })) finir();
  };
  a.onended = finir;
  a.onerror = repli;
  a.ontimeupdate = () => { if (num === lecture) onTemps?.(a.currentTime, a.duration); };
  a.play().catch(repli);
  return true;
}

// Bouton « Écouter » : bascule lecture / arrêt.
export function brancherBoutonVoix(bouton, obtenirTexte) {
  if (!bouton) return;
  const etat = (lit) => { bouton.classList.toggle('lit', lit); bouton.setAttribute('aria-pressed', String(lit)); bouton.innerHTML = lit ? '⏹️ Arrêter' : '🔊 Écouter'; };
  bouton.onclick = () => {
    if (bouton.classList.contains('lit')) { taire(); return etat(false); }
    etat(true);
    if (!parler(obtenirTexte(), { onFin: () => etat(false) })) etat(false);
  };
}

// ---------------------------------------------------------------- sons (synthétisés, aucun fichier)
let ctx = null;
function note(freq, debut, duree, { type = 'sine', volume = 0.07 } = {}) {
  const t = ctx.currentTime + debut;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(volume, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + duree + 0.02);
}
function jouer(fn) {
  if (!sons.actifs) return;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    fn();
  } catch { /* pas de son : sans gravité */ }
}
export const sons = {
  actifs: true,
  juste: () => jouer(() => { note(660, 0, 0.14); note(880, 0.1, 0.22); }),
  faux: () => jouer(() => { note(247, 0, 0.22, { type: 'triangle', volume: 0.06 }); note(208, 0.12, 0.28, { type: 'triangle', volume: 0.05 }); }),
  fanfare: () => jouer(() => { [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.11, i === 3 ? 0.45 : 0.18, { volume: 0.06 })); }),
};

// ---------------------------------------------------------------- zoom des documents du portfolio
const NIVEAUX = [1, 1.5, 2, 3, 4];
export function ouvrirZoom(src, alt = '') {
  let i = 0;
  const fond = document.createElement('div');
  fond.className = 'zoom-fond';
  fond.setAttribute('role', 'dialog');
  fond.setAttribute('aria-modal', 'true');
  fond.setAttribute('aria-label', 'Document agrandi');
  fond.innerHTML = `<div class="zoom-outils">
      <button class="btn" data-z="-1" aria-label="Rétrécir">➖</button>
      <span class="zoom-niveau" aria-live="polite">100 %</span>
      <button class="btn" data-z="1" aria-label="Agrandir">➕</button>
      <button class="btn btn-cta" data-fermer aria-label="Fermer">✕ Fermer</button>
    </div>
    <div class="zoom-boite"><img alt=""></div>`;
  const img = fond.querySelector('img');
  img.src = src; img.alt = alt;
  const boite = fond.querySelector('.zoom-boite');
  const regler = (n, cx = 0.5, cy = 0.5) => {
    const avant = { x: boite.scrollLeft + boite.clientWidth * cx, y: boite.scrollTop + boite.clientHeight * cy, w: img.offsetWidth || 1 };
    i = Math.max(0, Math.min(NIVEAUX.length - 1, n));
    img.style.width = `${NIVEAUX[i] * 100}%`;
    const r = img.offsetWidth / avant.w; // garde le même point du document sous les yeux
    boite.scrollLeft = avant.x * r - boite.clientWidth * cx;
    boite.scrollTop = avant.y * r - boite.clientHeight * cy;
    fond.querySelector('.zoom-niveau').textContent = `${NIVEAUX[i] * 100} %`;
    fond.querySelector('[data-z="-1"]').disabled = i === 0;
    fond.querySelector('[data-z="1"]').disabled = i === NIVEAUX.length - 1;
  };
  fond.querySelectorAll('[data-z]').forEach((b) => b.onclick = () => regler(i + Number(b.dataset.z)));
  img.ondblclick = (e) => { const r = boite.getBoundingClientRect(); regler(i ? 0 : 2, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); };
  const fermer = () => { fond.remove(); document.removeEventListener('keydown', clavier); retour?.focus(); };
  const clavier = (e) => {
    if (e.key === 'Escape') fermer();
    if (e.key === '+' || e.key === '=') regler(i + 1);
    if (e.key === '-') regler(i - 1);
  };
  const retour = document.activeElement;
  fond.querySelector('[data-fermer]').onclick = fermer;
  document.addEventListener('keydown', clavier);
  document.body.append(fond);
  regler(0);
  fond.querySelector('[data-z="1"]').focus();
  return fermer;
}
