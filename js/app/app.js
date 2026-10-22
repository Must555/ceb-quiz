// Mission CEB — application (écrans : connexion, accueil, quiz, résultat, réglages).
import { chargerDonnees, QuizSession, estJouable, ExamenReel, bonneReponseLisible, reponseEleveLisible } from '../engine/index.js';
import * as store from './store.js';
import { niveau, serieActuelle, jourDe, DEFIS, BADGES, enregistrerSession } from './progression.js';
import { rendreSaisie, brancher, esc } from './question-ui.js';
import { STATUTS, carteNotions, faiblesses, revisionsDues, coachPret, poidsCoach, maitrise } from './coach.js';
import { appliquerConfort, confortDe, TAILLES, ESPACES, peutLireAVoixHaute, voixDisponible, texteAVoix, parler, taire, brancherBoutonVoix, lireSegments, sons, ouvrirZoom } from './confort.js';
import { filtrerFiches, paquet, noterCarte, cartesDues, carteDue, exercicesParNotion } from './cartes.js';
import { ADRESSE_SIGNALEMENT, messageSignalement, lienMailto } from './signaler.js';
import { nouvelleGraine, decoderDefi, lienDefi, optionsDefi, comparer, empreinteDonnees, NB_QUESTIONS_DEFI } from './defi-amis.js';
import { AVATARS, avatarDe, emojiAvatar, imgAvatar } from './avatars.js';
import { ic } from './icones.js';
import { observer as illustrerEmojis } from './illustrer.js';
import { CEB, LIMITES, hashPin, pinValide, verifierPin, etatTemps, bilanSemaine, indicateurCEB, planRevision, joursEntre, jourCourt, dateLongue } from './parents.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const racine = document.documentElement;

const COULEURS = ['#ffcf99', '#a7f3d0', '#bfdbfe', '#f5d0fe', '#fecaca', '#fde68a'];
const MATIERES = [
  { id: 'fr', e: ic('fr'), nom: 'Français', sous: 'Lire, grammaire, conjugaison' },
  { id: 'ma', e: ic('ma'), nom: 'Maths', sous: 'Nombres, grandeurs, géométrie' },
  { id: 'hg', e: ic('hg'), nom: 'Histoire-Géo', sous: 'Repères, cartes, Belgique' },
  { id: 'sc', e: ic('sc'), nom: 'Sciences', sous: 'Vivant, matière, énergie' },
  { id: '', e: '🔀', nom: 'Mix', sous: 'Toutes les matières' },
];
const BRAVO = ['Bien joué !', 'Excellent !', 'Parfait !', 'Trop fort !', 'Exactement !', 'Bravo !', 'Yes !'];
const OUPS = ['Pas tout à fait…', 'Presque !', 'Oups !', 'Pas grave, on apprend !', 'Raté cette fois'];

let donnees = null;
let joueur = null;
const choix = { mode: 'entrainement', matiere: '', source: 'melange', examen: null, examenMode: 'libre', livret: null, cible: null };
// D'où viennent les questions de l'entraînement : vrais CEB, questions nouvelles (générées) ou un mélange à parts égales.
const SOURCES = [['melange', '⚖️ Les deux'], ['ceb', '📜 Vrais CEB'], ['nouvelles', '✨ Nouvelles questions']];
function poidsSource(source, matiere) {
  if (source === 'ceb') return (c) => (c.source === 'examen' ? 1 : 0);
  if (source === 'nouvelles') return (c) => (c.source === 'examen' ? 0 : 1);
  // Mélange : autant de chances de tomber sur une vraie question du CEB que sur une nouvelle.
  const dans = (c) => !matiere || (c.matiere ?? c.domaine?.split('.')[0]) === matiere;
  const officielles = donnees.banque.filter((q) => q.source === 'examen' && dans(q)).length;
  const autres = donnees.banque.filter((q) => q.source !== 'examen' && dans(q)).length + 3 * donnees.modeles.filter(dans).length;
  const f = officielles ? autres / officielles : 1;
  return (c) => (c.source === 'examen' ? f : 1);
}
const cacheExamens = {};
async function examenCharge(id) { return (cacheExamens[id] ??= donnees.chargerExamen(id)); }
// Questions jouables à l'écran d'un examen, éventuellement pour un seul livret.
const jouables = (ex, livret = null) => ex.questions.filter((q) => q.numerisable !== false && estJouable(q) && (livret == null || q.livret === livret));
const NOM_MAT = { fr: 'Français', ma: 'Maths', hg: 'Histoire-géo', sc: 'Sciences' };
let ficheDemandee = null; // ?fiche=… : arrivée depuis une page fiche publique
let defiRecu = null; // défi reçu par lien (?defi=…), en attente d'être relevé
let partie = null; // { session, modeJeu, ui, timer, config }

// ============================================================ Démarrage
async function demarrer() {
  illustrerEmojis(); // emojis restants → icônes illustrées, partout où ils s'affichent
  appliquerTheme(store.joueurActif()?.theme ?? 'cahier');
  try {
    donnees = await chargerDonnees({ base: 'data/' });
    // Les vraies questions du CEB rejoignent aussi l'entraînement (avec leurs documents).
    donnees.banque.push(...await donnees.questionsExamens().catch(() => []));
  } catch (e) {
    document.body.innerHTML = `<p style="padding:24px">Impossible de charger les questions. Vérifie ta connexion et recharge la page.</p>`;
    throw e;
  }
  // Examen blanc proposé par défaut : le plus récent du tronc commun (le CEB 2027 porte sur ces référentiels).
  const dispo = donnees.examens.filter((e) => e.statut !== 'a_encoder');
  choix.examen = (dispo.findLast((e) => e.referentiel === 'tronc_commun') ?? dispo.at(-1))?.id ?? null;
  // Arrivée depuis une page fiche publique (missionceb.be/fiches/…) : la fiche s'ouvre à l'accueil.
  const ficheParam = new URL(location.href).searchParams.get('fiche');
  if (ficheParam && donnees.fiches[ficheParam]) { ficheDemandee = ficheParam; history.replaceState(null, '', location.pathname); }
  // Arrivée depuis une page « examen » ou « exercices » : le bon mode est déjà choisi à l'accueil.
  const params = new URL(location.href).searchParams;
  const exParam = params.get('examen'), matParam = params.get('matiere');
  if (exParam && donnees.examens.some((e) => e.id === exParam && e.statut !== 'a_encoder')) { choix.mode = 'examen'; choix.examen = exParam; choix.livret = null; history.replaceState(null, '', location.pathname); }
  if (matParam && MATIERES.some((m) => m.id === matParam)) { choix.mode = 'entrainement'; choix.matiere = matParam; history.replaceState(null, '', location.pathname); }
  // Défi entre amis reçu par lien : on le garde en mémoire et on nettoie l'adresse.
  const code = new URL(location.href).searchParams.get('defi');
  if (code) {
    defiRecu = decoderDefi(code);
    history.replaceState(null, '', location.pathname);
    if (!defiRecu) setTimeout(() => toast('Ce lien de défi est abîmé : demande à ton ami de te le renvoyer.'), 400);
  }
  joueur = store.joueurActif();
  // Documents du portfolio : un toucher les ouvre en grand (zoom).
  document.addEventListener('click', (e) => { const img = e.target.closest?.('.doc img'); if (img) ouvrirZoom(img.src, img.alt); });
  joueur ? afficherAccueil() : afficherConnexion();
  installerHorsLigne();
}

// Hors ligne : le service worker garde une copie du site. Quand une nouvelle version est publiée,
// elle se télécharge en arrière-plan et un bandeau propose de l'utiliser (jamais de rechargement imposé).
function installerHorsLigne() {
  if (!('serviceWorker' in navigator) || !(location.protocol === 'https:' || location.hostname === 'localhost')) return;
  // On recharge seulement quand l'enfant a demandé la mise à jour (pas à la toute première installation).
  let majDemandee = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (majDemandee) { majDemandee = false; location.reload(); } });
  const proposer = (sw) => {
    if (document.querySelector('.bandeau-maj')) return;
    const b = document.createElement('div');
    b.className = 'bandeau-maj'; b.setAttribute('role', 'status');
    b.innerHTML = '<span>✨ Une nouvelle version de Mission CEB est prête.</span><button class="btn btn-cta petit">Mettre à jour</button><button class="btn petit" aria-label="Plus tard">Plus tard</button>';
    const [maj, plusTard] = b.querySelectorAll('button');
    maj.onclick = () => { maj.disabled = true; majDemandee = true; sw.postMessage('MISE_A_JOUR'); };
    plusTard.onclick = () => b.remove();
    document.body.append(b);
  };
  navigator.serviceWorker.register('sw.js').then((reg) => {
    if (reg.waiting && navigator.serviceWorker.controller) proposer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      sw?.addEventListener('statechange', () => { if (sw.state === 'installed' && navigator.serviceWorker.controller) proposer(sw); });
    });
    // Vérifie s'il y a une mise à jour quand l'enfant revient sur l'onglet.
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => { /* pas de hors-ligne : le site marche quand même */ });
}

// Bouton « Écouter » (lecture à voix haute), si le joueur l'a activée. Jamais pour une question de lecture.
function boutonVoix(q) {
  if (!confortDe(joueur).voix || !voixDisponible()) return '';
  if (!peutLireAVoixHaute(q)) return '<p class="voix-off">🔇 Question de lecture : c\'est à toi de lire !</p>';
  return '<button class="btn petit btn-voix" id="btn-voix" aria-pressed="false">🔊 Écouter</button>';
}

// Anciennes ambiances (Néon, Pop, Sunset) → nouvelles ambiances « école ».
const AMBIANCES = [['cahier', 'Cahier'], ['tableau', 'Tableau'], ['lecture', 'Lecture']];
const ANCIENNES = { neon: 'tableau', pop: 'cahier', sunset: 'cahier', parchemin: 'lecture' };
const ambiance = (t) => (AMBIANCES.some(([id]) => id === t) ? t : ANCIENNES[t] ?? 'cahier');
function appliquerTheme(t) { racine.dataset.theme = ambiance(t); appliquerConfort(store.joueurActif()); }
function montrer(id) {
  $$('.ecran').forEach((e) => { e.hidden = e.id !== id; });
  window.scrollTo(0, 0);
}
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.append(t); setTimeout(() => t.remove(), 2700);
}
function confettis(n = 80) {
  const cols = ['#1f4e96', '#c2362c', '#e0a800', '#2f6b4f', '#8a2e3b', '#9cc4e8'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = cols[i % cols.length];
    c.style.animationDuration = 1.8 + Math.random() * 1.8 + 's';
    c.style.animationDelay = Math.random() * .4 + 's';
    document.body.append(c); setTimeout(() => c.remove(), 4200);
  }
}
// Portrait du joueur dans un rond ; la couleur choisie forme l'anneau autour.
const ava = (j, taille = 44) => `<span class="pastille-ava${avatarDe(j.avatar).img ? ' a-img' : ''}" style="width:${taille}px;height:${taille}px;font-size:${Math.round(taille * .56)}px;background:${j.couleur};--anneau:${j.couleur}">${imgAvatar(j.avatar)}</span>`;
const boutonAvatar = (a, sel) => `<button data-a="${a.id}" class="${sel ? 'sel' : ''}" aria-label="${a.nom}" title="${a.nom}" aria-pressed="${sel}">${imgAvatar(a.id)}</button>`;
const nomDomaine = (id) => donnees.catalogue.matieres.flatMap((m) => m.domaines).find((d) => d.id === id)?.nom ?? id;

// ============================================================ Connexion
function afficherConnexion(forcerCreation = false) {
  const joueurs = store.listeJoueurs();
  const el = $('#ecran-connexion');
  const creation = forcerCreation || joueurs.length === 0;
  const nouveau = { avatar: AVATARS[0].id, couleur: COULEURS[0], theme: ambiance(racine.dataset.theme) };

  el.innerHTML = `<div class="connexion"><div class="connexion-boite">
    <div class="marque"><span class="pastille"><img src="assets/icones/logo-128.png" alt="" width="64" height="64"></span><div>Mission CEB<small>RÉUSSIS TON CEB EN JOUANT</small></div></div>
    ${!creation ? `
      <section class="carte">
        <h1 style="margin-bottom:12px">Qui joue ? 👋</h1>
        <div class="joueurs">${joueurs.map((j) => `
          <button class="joueur-ligne" data-id="${j.id}">${ava(j, 48)}
            <div><b>${esc(j.pseudo)}</b><small>Niveau ${niveau(j.xp).n} · ${j.xp} XP</small></div><span class="fleche">›</span></button>`).join('')}
        </div>
        <p style="margin-top:14px"><button class="btn" id="nouveau-joueur" style="width:100%">➕ Nouveau joueur</button></p>
      </section>
      <button class="lien lien-parents" id="aller-parents">👪 Espace parents</button>
      <details class="carte"><summary style="cursor:pointer;font-weight:700">🔑 J'ai un code de sauvegarde</summary>
        <p class="mute" style="margin:8px 0">Colle le code copié sur un autre appareil pour retrouver ta progression.</p>
        <textarea id="code-import" class="champ" rows="3" style="font-size:13px"></textarea>
        <p class="erreur" id="err-import"></p>
        <button class="btn" id="importer">Importer</button>
      </details>` : `
      <section class="carte">
        <h1>Crée ton joueur</h1>
        <p class="mute" style="margin:4px 0 16px">Pas de compte, pas d'e-mail. Ta progression reste sur cet appareil.</p>
        <p class="etape-titre">1. Ton pseudo</p>
        <input class="champ" id="pseudo" maxlength="16" autocomplete="off" placeholder="ex. Lea_2014">
        <p class="mute" style="font-size:13px;margin:6px 0 0">Invente un pseudo : évite ton nom de famille.</p>
        <p class="erreur" id="err-pseudo"></p>
        <p class="etape-titre">2. Ton avatar</p>
        <div class="grille-avatars">${AVATARS.map((a, i) => boutonAvatar(a, i === 0)).join('')}</div>
        <p class="etape-titre" style="margin-top:14px">Couleur de fond</p>
        <div class="couleurs">${COULEURS.map((c, i) => `<button data-c="${c}" class="${i === 0 ? 'sel' : ''}" style="background:${c}" aria-label="Couleur ${i + 1}"></button>`).join('')}</div>
        <p class="etape-titre" style="margin-top:16px">3. Ton ambiance</p>
        ${blocAmbiances(nouveau.theme)}
      </section>
      <div class="apercu-joueur carte" id="apercu"></div>
      <button class="btn btn-cta" id="creer" style="width:100%;font-size:20px;padding:16px">C'est parti ! 🚀</button>
      ${joueurs.length ? '<button class="lien" id="retour-liste">← Retour à la liste des joueurs</button>' : ''}`}
  </div></div>`;
  montrer('ecran-connexion');

  if (!creation) {
    $$('.joueur-ligne', el).forEach((b) => b.onclick = () => { joueur = store.choisirJoueur(b.dataset.id); appliquerTheme(joueur.theme); afficherAccueil(); });
    $('#nouveau-joueur', el).onclick = () => afficherConnexion(true);
    $('#aller-parents', el).onclick = () => afficherParents(() => afficherConnexion());
    $('#importer', el).onclick = () => {
      try { joueur = store.importerJoueur($('#code-import', el).value); appliquerTheme(joueur.theme); toast(`Content de te revoir, ${joueur.pseudo} !`); afficherAccueil(); }
      catch { $('#err-import', el).textContent = 'Ce code ne fonctionne pas. Vérifie qu\'il est complet.'; }
    };
    return;
  }

  const majApercu = () => {
    const p = $('#pseudo', el).value.trim() || 'Ton pseudo';
    $('#apercu', el).innerHTML = `${ava({ avatar: nouveau.avatar, couleur: nouveau.couleur }, 56)}<div><b style="font-family:var(--titre);font-size:20px">${esc(p)}</b><div class="mute">Niveau 1 · Recrue</div></div>`;
  };
  $$('.grille-avatars button', el).forEach((b) => b.onclick = () => { $$('.grille-avatars button', el).forEach((x) => { x.classList.toggle('sel', x === b); x.setAttribute('aria-pressed', String(x === b)); }); nouveau.avatar = b.dataset.a; majApercu(); });
  $$('.couleurs button', el).forEach((b) => b.onclick = () => { $$('.couleurs button', el).forEach((x) => x.classList.toggle('sel', x === b)); nouveau.couleur = b.dataset.c; majApercu(); });
  brancherAmbiances(el, (t) => { nouveau.theme = t; });
  $('#pseudo', el).oninput = majApercu;
  $('#pseudo', el).onkeydown = (e) => { if (e.key === 'Enter') $('#creer', el).click(); };
  majApercu();
  $('#retour-liste', el)?.addEventListener('click', () => afficherConnexion(false));
  $('#creer', el).onclick = () => {
    const p = $('#pseudo', el).value.trim().replace(/\s+/g, ' ');
    const err = $('#err-pseudo', el);
    if (p.length < 2) return err.textContent = 'Ton pseudo doit avoir au moins 2 caractères.';
    if (!/^[\p{L}\p{N}_\- ]+$/u.test(p)) return err.textContent = 'Utilise seulement des lettres, des chiffres, _ ou -.';
    if (store.pseudoPris(p)) return err.textContent = 'Ce pseudo existe déjà sur cet appareil.';
    joueur = store.creerJoueur(p, nouveau.avatar, nouveau.couleur);
    store.modifier((j) => { j.theme = nouveau.theme; });
    if (!store.stockageDisponible()) toast('⚠️ Ce navigateur ne garde pas les données : ta progression sera perdue en fermant la page.');
    afficherAccueil();
    toast(`Bienvenue ${p} ! 🚀`);
  };
}

function blocAmbiances(actuel) {
  return `<div class="ambiances">${AMBIANCES.map(([id, nom]) =>
    `<button data-t="${id}" class="${actuel === id ? 'sel' : ''}"><span class="apercu ap-${id}"></span>${nom}</button>`).join('')}</div>`;
}
function brancherAmbiances(el, onChoix) {
  $$('.ambiances button', el).forEach((b) => b.onclick = () => {
    $$('.ambiances button', el).forEach((x) => x.classList.toggle('sel', x === b));
    appliquerTheme(b.dataset.t); onChoix(b.dataset.t);
  });
}

// ============================================================ Accueil
function afficherAccueil() {
  joueur = store.joueurActif();
  if (!joueur) return afficherConnexion();
  appliquerTheme(joueur.theme);
  const nv = niveau(joueur.xp);
  const serie = serieActuelle(joueur);
  const jr = jourDe(joueur);
  const joueAujourdhui = jr.questions > 0;
  const nbBadges = Object.keys(joueur.badges).length;
  const defiFait = !!jr.defiDuJourFait;
  if ((choix.mode === 'defi' && defiFait) || choix.mode === 'cible') choix.mode = 'entrainement';

  const phrase = serie > 0 && !joueAujourdhui ? `Joue aujourd'hui pour garder ta série de <b>${serie} jour${serie > 1 ? 's' : ''}</b> 🔥`
    : serie > 1 ? `Série de <b>${serie} jours</b>, continue comme ça !`
    : joueAujourdhui ? `Déjà <b>${jr.questions} question${jr.questions > 1 ? 's' : ''}</b> aujourd'hui, bien joué !`
    : 'C\'est parti pour ta mission du jour ?';

  const pctMat = (id) => {
    if (!id) return joueur.totalQuestions ? Math.round((joueur.totalBonnes / joueur.totalQuestions) * 100) : 0;
    const m = joueur.parMatiere[id]; return m?.posees ? Math.round((m.bonnes / m.posees) * 100) : 0;
  };
  const examensDispo = donnees.examens.filter((e) => e.statut !== 'a_encoder');

  $('#ecran-accueil').innerHTML = `<div class="app">
    <aside class="side">
      <div class="marque"><span class="pastille"><img src="assets/icones/logo-128.png" alt="" width="64" height="64"></span><div>Mission CEB<small>SAISON 2027</small></div></div>
      <nav class="nav">
        <button class="actif"><span>${ic('accueil')}</span>Accueil</button>
        <button data-aller="progres"><span>${ic('progres')}</span>Progrès</button>
        <button data-aller="fiches"><span>${ic('fiches')}</span>Fiches</button>
        <a class="nav-lien" href="imprimer.html"><span>${ic('papier')}</span>Examen papier</a>
        <button class="bientot" data-bientot><span>${ic('badges')}</span>Collection</button>
        <button data-aller="reglages"><span>${ic('style')}</span>Mon style</button>
        <button data-aller="joueurs"><span>🔁</span>Joueurs</button>
        <button data-aller="parents"><span>👪</span>Parents</button>
      </nav>
      <div class="carte niveau">
        <b>⚡ Niveau ${nv.n} · ${nv.titre}</b>
        <p>Encore ${nv.fin - joueur.xp} XP pour le niveau ${nv.n + 1}</p>
        <div class="barre"><i style="width:${nv.pct}%"></i></div>
      </div>
    </aside>
    <main class="main">
      <header class="top">
        <div class="salut"><h1>Salut ${esc(joueur.pseudo)} 👋</h1><p>${phrase}</p>${blocTemps()}</div>
        <div class="stats">
          <div class="stat"><span class="i">${ic('xp')}</span><div><b>${joueur.xp.toLocaleString('fr-BE')}</b><small>XP</small></div></div>
          <div class="stat"><span class="i">${ic('serie')}</span><div><b>${serie}</b><small>jour${serie > 1 ? 's' : ''}</small></div></div>
          <div class="stat"><span class="i">${ic('badges')}</span><div><b>${nbBadges}</b><small>badge${nbBadges > 1 ? 's' : ''}</small></div></div>
          <div class="stat"><span class="i">${ic('gemmes')}</span><div><b>${joueur.gemmes}</b><small>gemmes</small></div></div>
          <div class="stat stat-ava"><button data-aller="reglages" aria-label="Mon avatar">${ava(joueur, 42)}</button></div>
        </div>
      </header>

      <div class="col-gauche">
        ${blocDefiRecu()}
        <section class="carte hero">
          <div class="hero-visuel">${ava(joueur, 140).replace('pastille-ava', 'pastille-ava grand-ava')}<span class="niv-badge">NIV. ${nv.n}</span></div>
          <div>
            <small class="sur">Mission du jour</small>
            <h2>Objectif <span>CEB</span> 🎯</h2>
            <p>10 questions par jour, et le CEB n'aura plus de secret pour toi.</p>
            <div class="prog"><span>Aujourd'hui</span><div class="barre"><i style="width:${Math.min(100, jr.questions * 10)}%"></i></div><b>${Math.min(jr.questions, 10)}/10${jr.questions >= 10 ? ' ✔' : ''}</b></div>
          </div>
        </section>

        ${blocReprise()}
        ${blocCoach()}

        <section class="carte">
          <h3 class="section-titre">🎮 Mode de jeu</h3>
          <div class="modes">
            <button class="mode m1" data-mode="entrainement"><span class="e">${ic('entrainement')}</span><b>Entraînement</b><small>10 questions au hasard, jamais deux fois la même</small></button>
            <button class="mode m2" data-mode="defi" ${defiFait ? 'disabled' : ''}><span class="etiq">${defiFait ? 'Fait ✔' : '1× / jour'}</span><span class="e">${ic('defi')}</span><b>Défi du jour</b><small>${defiFait ? 'Reviens demain pour un nouveau défi' : '10 questions de toutes les matières'}</small></button>
            <button class="mode m3" data-mode="examen" ${examensDispo.length ? '' : 'disabled'}><span class="e">${ic('examen')}</span><b>Examen blanc</b><small>Les vraies questions du CEB</small></button>
            <button class="mode m4" data-mode="chrono"><span class="etiq">3 min</span><span class="e">${ic('chrono')}</span><b>Chrono</b><small>Un maximum de bonnes réponses</small></button>
            <button class="mode m5 mode-large" data-mode="amis"><span class="e">${ic('amis')}</span><span><b>Défi entre amis</b><small>Joue 10 questions, puis envoie le lien : ton ami aura exactement les mêmes</small></span></button>
          </div>
        </section>

        <section class="carte" id="bloc-matieres">
          <h3 class="section-titre">📚 Matière</h3>
          <div class="matieres">${MATIERES.map((m) => `
            <button class="matiere" data-mat="${m.id}"><span class="e">${m.e}</span><b>${m.nom}</b><small>${m.sous}</small><div class="mini"><i style="width:${pctMat(m.id)}%"></i></div></button>`).join('')}
          </div>
          <div class="sources" role="radiogroup" aria-labelledby="titre-sources"><span class="sources-titre" id="titre-sources">Questions :</span>${SOURCES.map(([id, nom]) => `<button class="puce src" role="radio" data-src="${id}">${nom}</button>`).join('')}</div>
        </section>

        <section class="carte" id="bloc-examen" hidden>
          <h3 class="section-titre">📝 Quel examen ?</h3>
          <div class="options-examen" style="margin-bottom:12px">${donnees.examens.map((e) => `
            <button class="puce ex" data-ex="${e.id}" ${e.statut === 'a_encoder' ? 'disabled title="Bientôt disponible"' : ''}>${e.annee}${e.referentiel === 'tronc_commun' ? ' TC' : e.annee === 2026 ? ' SO' : ''}${e.statut === 'a_encoder' ? ' 🔒' : ''}</button>`).join('')}
          </div>
          <div class="options-examen">
            <button class="puce chr" data-chr="libre">🧘 Sans chrono</button>
            <button class="puce chr" data-chr="chrono">⏱️ Chronométré</button>
            <button class="puce chr" data-chr="reel">🎯 Examen réel</button>
          </div>
          <div class="info-reel" id="info-reel" hidden>
            <p><b>Comme le jour du CEB.</b> Tu passes les livrets un par un, chacun avec son chrono. Aucune correction avant la fin : dans un livret, tu peux revenir sur tes réponses. Entre deux livrets, tu peux faire une pause et reprendre plus tard.</p>
          </div>
          <div id="bloc-livrets">
            <h3 class="section-titre" style="margin-top:16px">📚 Quel livret ?</h3>
            <div class="livrets" id="choix-livret"><p class="mute">Chargement…</p></div>
          </div>
          <p class="mute" style="font-size:13px;margin:10px 0 0">Les questions à faire sur papier (tracés, dessins) sont retirées ici. Pour t'entraîner sur papier, avec des tracés : <a href="imprimer.html">imprime un examen 🖨️</a>.</p>
        </section>

        <div class="go"><button class="btn btn-cta" id="lancer">Lancer la mission →</button></div>
      </div>

      <div class="col-droite">
        <section class="carte">
          <h3>🎁 Prochaine récompense</h3>
          <div class="coffre"><span>🎁</span><p>Niveau ${nv.n + 1} : <b>${niveau(nv.fin).titre}</b></p></div>
          <div class="barre"><i style="width:${nv.pct}%"></i></div>
          <p class="mute" style="margin:6px 0 0;font-size:13px">${nv.dans} / ${nv.pour} XP</p>
        </section>
        <section class="carte">
          <h3>⚡ Défis du jour</h3>
          ${DEFIS.map((d) => { const fait = jr.defis.includes(d.id); return `
            <div class="defi ${fait ? 'fait' : ''}"><span class="e">${fait ? '✅' : d.e}</span><span class="t">${d.titre}</span><span class="xp">+${d.xp} XP</span><div class="barre"><i style="width:${Math.round(d.prog(jr) * 100)}%"></i></div></div>`; }).join('')}
        </section>
        <section class="carte">
          <h3>🏅 Ma collection <span class="mute" style="font-weight:600;font-size:14px">${nbBadges} / ${BADGES.length}</span></h3>
          <div class="collection">${BADGES.slice(0, 8).map((b) => `<div class="${joueur.badges[b.id] ? 'obtenu' : 'lock'}" title="${esc(b.nom)} : ${esc(b.desc)}">${b.e}</div>`).join('')}</div>
        </section>
      </div>
    </main>
  </div>
  <nav class="navbas">
    <button class="actif"><span>${ic('accueil')}</span>Accueil</button>
    <button data-aller="progres"><span>${ic('progres')}</span>Progrès</button>
    <button data-aller="fiches"><span>${ic('fiches')}</span>Fiches</button>
    <button data-aller="reglages"><span>${ic('style')}</span>Mon style</button>
    <button data-aller="joueurs"><span>🔁</span>Joueurs</button>
  </nav>`;
  montrer('ecran-accueil');

  const el = $('#ecran-accueil');
  const majChoix = () => {
    $$('.mode', el).forEach((b) => b.classList.toggle('sel', b.dataset.mode === choix.mode));
    $$('.matiere', el).forEach((b) => b.classList.toggle('sel', b.dataset.mat === choix.matiere));
    $$('.puce.src', el).forEach((b) => { const ok = b.dataset.src === choix.source; b.classList.toggle('sel', ok); b.setAttribute('aria-checked', String(ok)); });
    $('.sources', el).hidden = choix.mode !== 'entrainement';
    $$('.puce.ex', el).forEach((b) => b.classList.toggle('sel', b.dataset.ex === choix.examen));
    $$('.puce.chr', el).forEach((b) => b.classList.toggle('sel', b.dataset.chr === choix.examenMode));
    $('#info-reel', el).hidden = choix.examenMode !== 'reel';
    $('#bloc-livrets', el).hidden = choix.examenMode === 'reel';
    $('#bloc-examen', el).hidden = choix.mode !== 'examen';
    $('#bloc-matieres', el).hidden = choix.mode === 'examen' || choix.mode === 'defi';
    $('#lancer', el).textContent = { entrainement: 'Lancer la mission →', defi: 'Relever le défi 🏆', examen: choix.examenMode === 'reel' ? 'Commencer l\'examen réel 🎯' : 'Commencer l\'examen 📝', chrono: 'Top chrono ! ⏱️', amis: 'Lancer le défi ⚔️' }[choix.mode];
  };
  $$('.mode', el).forEach((b) => b.onclick = () => { choix.mode = b.dataset.mode; majChoix(); });
  $$('.matiere', el).forEach((b) => b.onclick = () => { choix.matiere = b.dataset.mat; majChoix(); });
  $$('.puce.src', el).forEach((b) => b.onclick = () => { choix.source = b.dataset.src; majChoix(); });
  $$('.puce.ex', el).forEach((b) => b.onclick = () => { choix.examen = b.dataset.ex; choix.livret = null; majChoix(); majLivrets(); });
  async function majLivrets() {
    const zone = $('#choix-livret', el);
    if (!choix.examen || !zone) return;
    const id = choix.examen;
    const ex = await examenCharge(id);
    if (id !== choix.examen) return;
    const livrets = (ex.livrets ?? []).map((l) => ({ ...l, nb: jouables(ex, l.n).length })).filter((l) => l.nb > 0);
    const btn = (n, e, titre, sous, nb) => `<button class="livret${choix.livret === n ? ' sel' : ''}" data-l="${n ?? ''}"><span class="e">${e}</span><b>${titre}</b><small>${sous} · ${nb} question${nb > 1 ? 's' : ''}</small></button>`;
    zone.innerHTML = btn(null, '🗂️', 'Tout l\'examen', 'Tous les livrets', jouables(ex).length)
      + livrets.map((l) => btn(l.n, { fr: '📖', ma: '🔢', hg: '🌍', sc: '🔬' }[l.matiere] ?? '📄', `Livret ${l.n} · ${l.titre}`, /Éveil/.test(l.titre) ? 'Éveil' : NOM_MAT[l.matiere] ?? '', l.nb)).join('');
    $$('.livret', zone).forEach((b) => b.onclick = () => { choix.livret = b.dataset.l ? Number(b.dataset.l) : null; majLivrets(); });
  }
  majLivrets();
  $$('.puce.chr', el).forEach((b) => b.onclick = () => { choix.examenMode = b.dataset.chr; majChoix(); });
  brancherReprise(el);
  $('#relever-defi', el)?.addEventListener('click', () => lancerPartie({ defi: defiRecu }));
  $('#ignorer-defi', el)?.addEventListener('click', () => { defiRecu = null; afficherAccueil(); });
  $$('[data-aller="reglages"]', el).forEach((b) => b.onclick = afficherReglages);
  $$('[data-aller="joueurs"]', el).forEach((b) => b.onclick = () => { store.deconnecter(); afficherConnexion(); });
  $$('[data-bientot]', el).forEach((b) => b.onclick = () => toast('Arrive très bientôt ! 🛠️'));
  $$('[data-aller="progres"]', el).forEach((b) => b.onclick = afficherProgres);
  $$('[data-aller="fiches"]', el).forEach((b) => b.onclick = afficherFiches);
  $$('[data-aller="parents"]', el).forEach((b) => b.onclick = () => afficherParents(afficherAccueil));
  brancherCoach(el);
  $('#lancer', el).onclick = () => lancerPartie();
  if (ficheDemandee) { const id = ficheDemandee; ficheDemandee = null; setTimeout(() => ouvrirFicheBiblio(id), 50); }
  majChoix();
}

// ============================================================ Partie
// Limite de temps choisie par les parents : petit compteur à l'accueil, pause quand elle est atteinte.
function blocTemps() {
  const t = etatTemps(joueur, store.reglagesParents());
  if (t.limite == null) return '';
  return `<p class="temps-jour${t.atteint ? ' fini' : ''}">⏳ ${t.atteint ? 'Temps de jeu terminé pour aujourd\'hui' : `Encore ${t.restant} min de jeu aujourd'hui`}</p>`;
}

function afficherPause() {
  const t = etatTemps(joueur, store.reglagesParents());
  const fond = document.createElement('div');
  fond.className = 'modal-fond';
  fond.innerHTML = `<div class="modal carte pause" role="dialog" aria-modal="true" aria-labelledby="pause-titre">
    <div class="pause-e">🌙</div>
    <h2 id="pause-titre">C'est tout pour aujourd'hui !</h2>
    <p>Tu as joué <b>${t.minutes} minutes</b> : c'est la limite fixée avec tes parents. Ton cerveau a bien travaillé, reviens demain pour garder ta série 🔥</p>
    <p class="mute">Envie de continuer autrement ? Un examen ou une fiche sur papier, ça marche aussi 🖨️</p>
    <div class="modal-actions"><a class="btn" href="imprimer.html">🖨️ Papier</a><button class="btn" id="pause-parent">👪 Code parent</button><button class="btn btn-cta" id="pause-ok">D'accord</button></div>
  </div>`;
  document.body.append(fond);
  const fermer = () => fond.remove();
  $('#pause-ok', fond).onclick = fermer;
  $('#pause-parent', fond).onclick = () => { fermer(); afficherParents(afficherAccueil); };
  $('#pause-ok', fond).focus();
}

async function lancerPartie({ defi = null } = {}) {
  if (etatTemps(joueur, store.reglagesParents()).atteint) return afficherPause();
  const modeJeu = defi ? 'amis' : choix.mode;
  let examen = null;
  const base = { banque: donnees.banque, modeles: donnees.modeles, historique: joueur.historique };
  let session;
  if (modeJeu === 'entrainement') {
    const coach = poidsCoach(joueur), src = poidsSource(choix.source, choix.matiere);
    session = new QuizSession(base, { nbQuestions: 10, matieres: choix.matiere ? [choix.matiere] : null, poids: (c) => coach(c) * src(c), adaptatif: true });
  } else if (modeJeu === 'cible') {
    session = new QuizSession(base, { nbQuestions: 10, maxParModele: 5, poids: poidsCoach(joueur, { mode: 'cible', notion: choix.cible }), adaptatif: true, niveauDepart: 1 });
  } else if (modeJeu === 'chrono') {
    session = new QuizSession(base, { nbQuestions: 200, dureeSecondes: 180, matieres: choix.matiere ? [choix.matiere] : null, difficulteMax: 2 });
  } else if (modeJeu === 'defi') {
    // Même défi toute la journée pour ce joueur (graine = date + joueur), sans tenir compte de l'historique.
    session = new QuizSession({ ...base, historique: [] }, { nbQuestions: 10, seed: `${store.aujourdhui()}|${joueur.id}` });
  } else if (modeJeu === 'amis') {
    // Même graine + mêmes options = mêmes questions pour les deux amis (ni coach, ni historique).
    const d = defi ? { graine: defi.graine, matiere: defi.matiere, recu: defi } : { graine: nouvelleGraine(), matiere: choix.matiere, recu: null };
    if (defi) defiRecu = null;
    session = new QuizSession({ ...base, historique: [] }, optionsDefi(d));
    partie = { session, modeJeu, examen: null, fini: false, defi: d };
    afficherQuiz();
    return questionSuivante();
  } else if (choix.examenMode === 'reel') {
    return lancerExamenReel(choix.examen);
  } else {
    examen = await examenCharge(choix.examen);
    session = new QuizSession({ examen }, { mode: 'examen', livrets: choix.livret ? [choix.livret] : null });
    if (choix.examenMode === 'chrono') session.o.dureeSecondes = Math.max(120, session.o.nbQuestions * 90);
  }
  partie = { session, modeJeu, examen, fini: false };
  afficherQuiz();
  questionSuivante();
}

function afficherQuiz() {
  $('#ecran-quiz').innerHTML = `
    <div class="quiz">
      <div class="quiz-haut">
        <button class="fermer" id="quitter" aria-label="Quitter la mission">✕</button>
        <div class="barre"><i id="q-prog" style="width:0%"></i></div>
        <span class="compteur" id="q-compteur"></span>
      </div>
      <div class="puces-etat"><span class="serie-flamme" id="q-serie">🔥 0</span><span id="q-xp">⭐ 0 XP</span><span class="chrono" id="q-chrono" hidden></span><span id="q-niveau" hidden></span><button class="puce-son" id="q-son"></button></div>
      <section class="question" id="q-zone"></section>
    </div>
    <div class="pied-quiz" id="pied"><div class="retour" id="retour" hidden></div>
      <div class="in"><button class="btn" id="passer">Je ne sais pas</button><button class="btn btn-cta" id="valider" disabled>Valider</button></div></div>`;
  montrer('ecran-quiz');
  const majSon = () => { const on = confortDe(joueur).sons; const b = $('#q-son'); b.textContent = on ? '🔊' : '🔇'; b.setAttribute('aria-label', on ? 'Couper les sons' : 'Remettre les sons'); b.setAttribute('aria-pressed', String(!on)); };
  $('#q-son').onclick = () => { joueur = store.modifier((j) => { j.confort = { ...confortDe(j), sons: !confortDe(j).sons }; }); appliquerConfort(joueur); majSon(); };
  majSon();
  $('#quitter').onclick = () => { taire(); terminerPartie(true); };
  $('#passer').onclick = () => valider(true);
  $('#valider').onclick = () => (partie.corrige ? continuer() : valider(false));
  clearInterval(partie.timer);
  if (partie.session.o.dureeSecondes) {
    $('#q-chrono').hidden = false;
    partie.timer = setInterval(majChrono, 250);
    majChrono();
  }
}

function majChrono() {
  const t = partie.session.tempsRestant();
  if (t == null) return;
  const c = $('#q-chrono');
  c.textContent = `⏱️ ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  c.classList.toggle('urgent', t <= 15);
  if (t === 0 && !partie.fini) terminerPartie(false);
}

function majEtat() {
  const e = partie.session.etat();
  const chrono = partie.modeJeu === 'chrono';
  $('#q-prog').style.width = chrono ? `${Math.round((1 - (partie.session.tempsRestant() ?? 0) / 180) * 100)}%` : `${Math.round(((e.index - (partie.corrige ? 0 : 1)) / e.total) * 100)}%`;
  $('#q-compteur').textContent = chrono ? `${e.bonnes} ✔` : `${e.index} / ${e.total}`;
  $('#q-serie').textContent = `🔥 ${e.serie}`;
  $('#q-xp').textContent = `⭐ ${e.xp} XP`;
  const nv = $('#q-niveau');
  nv.hidden = e.niveau == null;
  if (e.niveau != null) { nv.textContent = `🎚️ Niveau ${e.niveau}`; nv.title = 'La difficulté s\'adapte : 3 bonnes réponses d\'affilée font monter, 2 erreurs d\'affilée font descendre.'; }
}


// Documents d'une question : images du portfolio, ou texte à écouter (livret « Écouter »).
// max : nombre d'écoutes permises (2 à l'examen, comme à l'épreuve ; illimité à l'entraînement).
function rendreDocs(docs) {
  return docs.map((d, i) => d.type === 'ecoute'
    ? `<div class="ecoute" data-doc="${d.id}"><p class="ecoute-titre">🎧 ${esc(d.titre)}</p>
        <button class="btn btn-cta ecoute-btn" data-doc="${d.id}">▶️ Écouter le texte</button>
        <p class="ecoute-info mute"></p></div>`
    : `<button class="btn doc-btn" data-doc="${d.id}">📄 ${i === 0 ? 'Document' : 'Voir le document'} : ${esc(d.titre)}</button>
      <figure class="doc" id="doc-${d.id}" ${i === 0 ? '' : 'hidden'}><img src="${esc(d.fichier)}" alt="${esc(d.alt)}" loading="lazy"><figcaption>Portfolio, page ${d.page} · 🔍 touche pour agrandir</figcaption></figure>`).join('');
}
function brancherDocs(docs, { compteur = null, max = Infinity } = {}) {
  $$('.doc-btn').forEach((b) => b.onclick = () => { const f = $(`#doc-${b.dataset.doc}`); f.hidden = !f.hidden; });
  $$('.ecoute-btn').forEach((b) => {
    const d = docs.find((x) => x.id === b.dataset.doc);
    const info = b.parentElement.querySelector('.ecoute-info');
    const deja = () => (compteur ? compteur[d.id] ?? 0 : 0);
    const maj = (lit = false) => {
      const reste = max - deja();
      b.textContent = lit ? '⏹️ Arrêter' : '▶️ Écouter le texte';
      b.disabled = !lit && reste <= 0;
      info.textContent = !voixDisponible() ? 'Ton appareil ne sait pas lire à voix haute : demande à un adulte de te lire le texte.'
        : max === Infinity ? 'Tu peux l\'écouter autant de fois que tu veux.'
        : reste > 0 ? `Écoutes restantes : ${reste} sur ${max} (comme à l'épreuve).` : 'Tu as utilisé tes deux écoutes.';
    };
    maj();
    b.onclick = () => {
      if (b.textContent.startsWith('⏹️')) { taire(); return maj(false); }
      if (compteur) compteur[d.id] = deja() + 1;
      if (!lireSegments(d.segments, { onFin: () => maj(false) })) return maj(false);
      maj(true);
    };
  });
}

function questionSuivante() {
  const q = partie.session.suivante();
  if (!q) return terminerPartie(false);
  partie.corrige = false;
  const docs = q.docsResolus ?? (q.documents ?? []).map((id) => partie.examen?.documents?.find((d) => d.id === id)).filter(Boolean);
  const origine = q.source === 'examen' ? `CEB ${q.annee ?? partie.examen?.annee}${q.referentiel === 'tronc_commun' ? ' (tronc commun)' : ''} · livret ${q.livret} · question ${q.numero}` : nomDomaine(q.domaine);
  $('#q-zone').innerHTML = `
    <p class="origine">${esc(origine)}</p>
    ${boutonVoix(q)}
    <h2>${esc(q.enonce)}</h2>
    ${q.figure && q.type !== 'trace' ? `<figure class="figure-q">${q.figure}</figure>` : ''}
    ${rendreDocs(docs)}
    <div id="q-saisie">${rendreSaisie(q)}</div>`;
  brancherDocs(docs);
  taire(); brancherBoutonVoix($('#btn-voix'), () => texteAVoix(q));
  const pied = $('#pied');
  pied.className = 'pied-quiz';
  $('#retour').hidden = true;
  $('#passer').hidden = false;
  const bv = $('#valider'); bv.textContent = 'Valider'; bv.disabled = true;
  partie.ui = brancher($('#q-saisie'), q, { onPret: (ok) => { bv.disabled = !ok; }, onValider: () => { if (!bv.disabled) bv.click(); } });
  majEtat();
}

function valider(passer) {
  if (partie.corrige || partie.fini) return;
  const q = partie.session.courante;
  const r = passer ? partie.session.passer() : partie.session.repondre(partie.ui.lire());
  partie.corrige = true;
  partie.ui.montrerCorrection();
  const ok = r.correct === true;
  const ouverte = r.correct === null && !passer;
  const partielle = !ok && r.score > 0;
  if (ok) sons.juste(); else if (r.correct === false && !passer) sons.faux();
  const pied = $('#pied');
  pied.className = `pied-quiz ${ok ? 'juste' : ouverte ? 'ouvert' : 'faux'}`;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const titre = ok ? `${pick(BRAVO)} ${r.serie >= 3 ? `🔥 ${r.serie} d'affilée` : '✅'}` : passer ? 'Voici la réponse 👇' : ouverte ? '✍️ Compare avec la réponse modèle' : partielle ? `En partie juste (${r.detail})` : pick(OUPS);
  const montrerBonne = !ok && !['qcm', 'vrai_faux', 'qcm_multi', 'grille'].includes(q.type);
  const donnee = passer ? null : reponseEleveLisible(q, partie.ui.lire());
  $('#retour').innerHTML = `${r.xpGagne ? `<span class="xp-gagne">+${r.xpGagne} XP</span>` : ''}<b>${titre}</b>
    ${r.remarque && !ok && !passer && !ouverte ? `<p>${esc(r.remarque)}</p>` : ''}
    ${montrerBonne ? `<p class="bonne">${q.type === 'ouverte' ? 'Réponse modèle' : 'Réponse'} : ${esc(r.bonneReponse)}</p>` : ''}
    ${q.explication ? `<p>${ic('astuce', 'ic-txt')} ${esc(q.explication)}</p>` : ''}
    ${!ok && !ouverte && donnees.fiches[q.fiche] ? `<p><button class="btn btn-fiche" id="voir-regle">📘 Revoir la règle : ${esc(donnees.fiches[q.fiche].titre)}</button></p>` : ''}
    ${r.niveau && r.niveau.apres !== r.niveau.avant ? `<p class="niveau-change">${r.niveau.apres > r.niveau.avant ? `🚀 Niveau ${r.niveau.apres} : tu es en forme, on corse un peu !` : `🌱 Niveau ${r.niveau.apres} : on reprend en douceur.`}</p>` : ''}
    <button class="lien lien-signaler" id="signaler">⚑ Signaler une erreur</button>`;
  $('#retour').hidden = false;
  $('#voir-regle')?.addEventListener('click', () => ouvrirFiche(q.fiche));
  $('#signaler').onclick = () => ouvrirSignalement({ q, reponseDonnee: donnee, bonneReponse: r.bonneReponse ?? bonneReponseLisible(q), page: `quiz (${partie.modeJeu})` });
  $('#passer').hidden = true;
  const bv = $('#valider');
  bv.disabled = false;
  bv.textContent = partie.session.etat().terminee ? 'Voir mon résultat 🏁' : 'Continuer →';
  bv.focus();
  if (ok && r.serie >= 2) { const f = $('#q-serie'); f.classList.add('pop'); setTimeout(() => f.classList.remove('pop'), 300); }
  majEtat();
}

function continuer() {
  if (partie.session.etat().terminee) return terminerPartie(false);
  questionSuivante();
}

function terminerPartie(abandon) {
  if (partie.fini) return;
  partie.fini = true;
  clearInterval(partie.timer);
  const resume = partie.session.resume();
  let res = null;
  joueur = store.modifier((j) => { res = enregistrerSession(j, resume, partie.modeJeu); });
  if (abandon && resume.questions === 0) return afficherAccueil();
  afficherResultat(resume, res);
}

// ============================================================ Résultat
function afficherResultat(resume, res) {
  const pct = resume.pourcentage;
  const [emoji, titre] = resume.questions === 0 ? ['⏱️', 'Temps écoulé !']
    : pct >= 90 ? ['🏆', 'Incroyable !'] : pct >= 70 ? ['🚀', 'Super mission !'] : pct >= 50 ? ['💪', 'Bien joué !'] : ['🌱', 'Continue, tu progresses !'];
  const recompenses = [];
  if (res.niveauApres > res.niveauAvant) recompenses.push({ e: '⚡', t: `Niveau ${res.niveauApres} atteint !`, s: `Tu es maintenant « ${niveau(joueur.xp).titre} »` });
  for (const d of res.defisGagnes) recompenses.push({ e: d.e, t: `Défi réussi : ${d.titre}`, s: `+${d.xp} XP · +${d.gemmes} 💎` });
  for (const b of res.nouveauxBadges) recompenses.push({ e: b.e, t: `Nouveau badge : ${b.nom}`, s: b.desc });
  if (res.serieAvancee && joueur.serie.jours > 1) recompenses.push({ e: '🔥', t: `Série de ${joueur.serie.jours} jours !`, s: 'Reviens demain pour la prolonger' });

  const domaines = Object.entries(resume.parDomaine);
  $('#ecran-resultat').innerHTML = `<div class="resultat">
    <div class="grand-emoji">${emoji}</div>
    <h1>${titre}</h1>
    ${resume.questions ? `<div><div class="score-grand">${resume.bonnes} / ${resume.questions}</div><p class="mute" style="margin:4px 0 0">${pct} % de bonnes réponses${resume.meilleureSerie >= 3 ? ` · meilleure série : ${resume.meilleureSerie} 🔥` : ''}</p></div>` : '<p class="mute">Tu n\'as répondu à aucune question.</p>'}
    <div class="gains">
      <div><b>+${res.xpSession + res.xpDefis}</b><small>XP</small></div>
      <div><b>+${res.gemmes}</b><small>💎 gemmes</small></div>
      <div><b>${serieActuelle(joueur)}</b><small>🔥 jour${serieActuelle(joueur) > 1 ? 's' : ''}</small></div>
    </div>
    ${recompenses.length ? `<div class="recompenses">${recompenses.map((r, i) => `
      <div class="recompense" style="animation-delay:${.2 + i * .15}s"><span class="e">${r.e}</span><div><b>${esc(r.t)}</b><small>${esc(r.s)}</small></div></div>`).join('')}</div>` : ''}
    ${domaines.length ? `<section class="carte par-domaine"><h3 style="margin-bottom:12px">Détail</h3>${domaines.map(([d, v]) => `
      <div class="ligne"><span>${esc(nomDomaine(d))}</span><b>${v.bonnes}/${v.posees}</b><div class="barre"><i style="width:${Math.round((v.bonnes / v.posees) * 100)}%"></i></div></div>`).join('')}</section>` : ''}
    ${partie.defi ? blocDefiResultat(resume) : ''}
    <div class="actions">
      <button class="btn btn-cta" id="rejouer">${partie.modeJeu === 'defi' ? 'Nouvelle mission' : partie.modeJeu === 'cible' ? 'Encore une mission ciblée' : partie.modeJeu === 'amis' ? 'Nouveau défi' : 'Rejouer'} 🔁</button>
      <button class="btn" id="accueil">🏠 Accueil</button>
    </div>
  </div>`;
  montrer('ecran-resultat');
  const gagneDefi = partie.defi?.recu && comparer({ bonnes: resume.bonnes, secondes: resume.dureeSecondes }, partie.defi.recu) === 'gagne';
  if (gagneDefi || pct >= 70 || res.nouveauxBadges.length || res.niveauApres > res.niveauAvant) { setTimeout(() => confettis(), 200); sons.fanfare(); }
  $('#accueil').onclick = afficherAccueil;
  if (partie.defi) brancherDefiResultat();
  $('#rejouer').onclick = () => {
    if (partie.modeJeu === 'defi') choix.mode = 'entrainement';
    if (partie.modeJeu === 'amis') choix.mode = 'amis';
    joueur = store.joueurActif();
    lancerPartie();
  };
}

// ============================================================ Défi entre amis
const NOM_MAT_DEFI = { '': 'toutes les matières', fr: 'français', ma: 'maths', hg: 'histoire-géo', sc: 'sciences' };
const duree = (s) => (s == null ? '' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
const empreinte = () => empreinteDonnees(donnees.banque, donnees.modeles);

function blocDefiRecu() {
  const d = defiRecu;
  if (!d) return '';
  return `<section class="carte defi-recu">
    <h3 class="section-titre">⚔️ ${esc(d.pseudo)} te défie !</h3>
    <p>${NB_QUESTIONS_DEFI} questions de <b>${NOM_MAT_DEFI[d.matiere]}</b>. Score à battre : <b>${d.bonnes} / ${d.total}</b>${d.secondes != null ? ` en ${duree(d.secondes)}` : ''}.</p>
    ${d.empreinte && d.empreinte !== empreinte() ? '<p class="mute" style="font-size:13px">Le site a changé depuis la création du défi : quelques questions peuvent être différentes.</p>' : ''}
    <div class="actions"><button class="btn btn-cta" id="relever-defi">Relever le défi ⚔️</button><button class="btn" id="ignorer-defi">Plus tard</button></div>
  </section>`;
}

function blocDefiResultat(resume) {
  const d = partie.defi;
  const moi = { bonnes: resume.bonnes, secondes: resume.dureeSecondes };
  const verdict = d.recu ? comparer(moi, d.recu) : null;
  const titre = { gagne: `🏆 Tu bats ${esc(d.recu?.pseudo)} !`, perdu: `💪 ${esc(d.recu?.pseudo)} gagne cette fois`, egalite: '🤝 Égalité parfaite !' }[verdict] ?? '⚔️ À ton ami de jouer !';
  partie.lienDefi = lienDefi({ graine: d.graine, matiere: d.matiere, pseudo: joueur.pseudo, bonnes: resume.bonnes, total: resume.questions, secondes: resume.dureeSecondes, empreinte: empreinte() }, location.href);
  return `<section class="carte defi-resultat">
    <h3>${titre}</h3>
    ${d.recu ? `<div class="duel"><div><b>Toi</b><span>${moi.bonnes} / ${resume.questions}</span><small>${duree(moi.secondes)}</small></div><div class="vs">VS</div><div><b>${esc(d.recu.pseudo)}</b><span>${d.recu.bonnes} / ${d.recu.total}</span><small>${duree(d.recu.secondes)}</small></div></div>` : ''}
    <p>${d.recu ? `Renvoie ton score à ${esc(d.recu.pseudo)}, ou défie un autre ami avec les mêmes questions :` : 'Envoie ce lien à un ami : il aura exactement les mêmes questions et verra ton score.'}</p>
    <div class="actions">${navigator.share ? '<button class="btn btn-cta" id="partager-defi">📤 Envoyer le défi</button>' : ''}<button class="btn" id="copier-defi">📋 Copier le lien</button></div>
    <p class="mute" style="font-size:13px;margin:8px 0 0">Le lien contient seulement ton pseudo et ton score. Envoie-le à des amis que tu connais.</p>
  </section>`;
}
function brancherDefiResultat() {
  const lien = partie.lienDefi;
  $('#partager-defi')?.addEventListener('click', () => navigator.share({ title: 'Mission CEB : défi !', text: `${joueur.pseudo} te défie sur Mission CEB ⚔️ Fais mieux que moi !`, url: lien }).catch(() => {}));
  $('#copier-defi').onclick = async () => {
    try { await navigator.clipboard.writeText(lien); toast('Lien copié ! Colle-le dans un message 📋'); }
    catch { $('#copier-defi').insertAdjacentHTML('afterend', `<textarea class="champ" readonly rows="3" style="margin-top:8px;font-size:12px">${esc(lien)}</textarea>`); }
  };
}

// ============================================================ Signaler une erreur
// Ouvre la messagerie avec un message pré-rempli (rien n'est envoyé sans l'enfant ou le parent).
function ouvrirSignalement(contexte) {
  const fond = document.createElement('div');
  fond.className = 'modal-fond';
  fond.innerHTML = `<div class="modal carte" role="dialog" aria-modal="true" aria-labelledby="sig-titre">
    <small class="sur">Aide-nous à corriger</small>
    <h2 id="sig-titre">⚑ Signaler une erreur</h2>
    <p>Tu penses qu'une réponse, une question ou une fiche est fausse ? Demande à un adulte de t'aider : un e-mail va s'ouvrir, prêt à envoyer à <b>${ADRESSE_SIGNALEMENT}</b>.</p>
    <label class="etape-titre" for="sig-texte">Qu'est-ce qui ne va pas ?</label>
    <textarea class="champ" id="sig-texte" rows="3" maxlength="500" placeholder="Ex. : la bonne réponse devrait être 24, car…"></textarea>
    <p class="mute" style="font-size:13px;margin:8px 0 0">Seuls la question et ton commentaire sont envoyés : jamais ton pseudo ni ta progression.</p>
    <div class="modal-actions"><button class="btn" data-sig="copier">📋 Copier le message</button><button class="btn" data-sig="annuler">Annuler</button><a class="btn btn-cta" data-sig="envoyer" href="#">✉️ Ouvrir ma messagerie</a></div>
    <p class="mute" id="sig-info" style="font-size:13px;margin:8px 0 0" aria-live="polite"></p>
  </div>`;
  document.body.append(fond);
  const message = () => messageSignalement({ ...contexte, commentaire: $('#sig-texte', fond).value });
  const fermer = () => { fond.remove(); document.removeEventListener('keydown', echap); };
  const echap = (e) => { if (e.key === 'Escape') fermer(); };
  document.addEventListener('keydown', echap);
  const envoyer = $('[data-sig="envoyer"]', fond);
  envoyer.onclick = () => { envoyer.href = lienMailto(message()); setTimeout(() => { $('#sig-info', fond).textContent = 'Si rien ne s\'ouvre, utilise « Copier le message » et colle-le dans un e-mail à ' + ADRESSE_SIGNALEMENT + '.'; }, 800); };
  $('[data-sig="annuler"]', fond).onclick = fermer;
  $('[data-sig="copier"]', fond).onclick = async () => {
    const m = message(); const texte = `À : ${ADRESSE_SIGNALEMENT}\nObjet : ${m.sujet}\n\n${m.corps}`;
    try { await navigator.clipboard.writeText(texte); $('#sig-info', fond).textContent = `Message copié ✔ Colle-le dans un e-mail à ${ADRESSE_SIGNALEMENT}.`; }
    catch { $('#sig-texte', fond).insertAdjacentHTML('afterend', `<textarea class="champ" readonly rows="6" style="margin-top:8px;font-size:12px">${esc(texte)}</textarea>`); }
  };
  $('#sig-texte', fond).focus();
}

// ============================================================ Examen réel
// Livret par livret, chrono par livret, aucune correction avant la fin, pause possible entre deux livrets.
// L'état est gardé dans le joueur (`examenReel`) à chaque réponse : fermer la page ne perd rien,
// mais le chrono d'un livret ouvert continue de tourner (comme en classe).
let reel = null; // { er, examen, timer, ui, sauvTimer }
const EMOJI_MAT = { fr: ic('fr'), ma: ic('ma'), hg: ic('hg'), sc: ic('sc') };
const minutes = (s) => `${Math.round(s / 60)} min`;
const pts = (x) => (Math.round(x * 10) / 10).toLocaleString('fr-BE');
const horlogeTxt = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
const nomExamen = (id) => { const e = donnees.examens.find((x) => x.id === id); return e ? `CEB ${e.annee}${e.referentiel === 'tronc_commun' ? ' tronc commun' : e.annee === 2026 ? ' socles' : ''}` : id; };

// Petite boîte de confirmation (renvoie une promesse : true = oui).
function confirmer(titre, texte, oui = 'Oui', non = 'Annuler') {
  return new Promise((ok) => {
    const fond = document.createElement('div');
    fond.className = 'modal-fond';
    fond.innerHTML = `<div class="modal carte" role="dialog" aria-modal="true" aria-labelledby="conf-titre">
      <h2 id="conf-titre">${titre}</h2><p>${texte}</p>
      <div class="modal-actions"><button class="btn" data-r="0">${non}</button><button class="btn btn-cta" data-r="1">${oui}</button></div></div>`;
    document.body.append(fond);
    $$('[data-r]', fond).forEach((b) => b.onclick = () => { fond.remove(); ok(b.dataset.r === '1'); });
    $('[data-r="1"]', fond).focus();
  });
}

function blocReprise() {
  const e = joueur.examenReel;
  if (!e) return '';
  const total = e.total ?? '?';
  const ouvert = e.debuts?.[e.ordre?.[e.courant]] != null && e.fins?.[e.ordre?.[e.courant]] == null;
  return `<section class="carte reprise-reel">
    <h3 class="section-titre">${ouvert ? '⏱️ Ton livret est en cours' : '⏸️ Ton examen réel t\'attend'}</h3>
    <p>${esc(nomExamen(e.examenId))} · livret ${Math.min(e.courant + 1, total)} sur ${total}${ouvert ? ' · le chrono tourne !' : ''}</p>
    <div class="actions"><button class="btn btn-cta" id="reprendre-reel">Reprendre ▶</button><button class="btn" id="abandon-reel">Abandonner</button></div>
  </section>`;
}
function brancherReprise(el) {
  $('#reprendre-reel', el)?.addEventListener('click', reprendreExamenReel);
  $('#abandon-reel', el)?.addEventListener('click', async () => {
    if (!await confirmer('Abandonner l\'examen ?', 'Tes réponses seront effacées et l\'examen ne sera pas corrigé.', 'Abandonner', 'Garder')) return;
    joueur = store.modifier((j) => { delete j.examenReel; });
    afficherAccueil();
  });
}

function sauverReel() {
  clearTimeout(reel.sauvTimer); reel.sauvTimer = null;
  const etat = { ...reel.er.toJSON(), total: reel.er.livrets.length, ordre: reel.er.livrets.map((l) => l.n) };
  joueur = store.modifier((j) => { j.examenReel = etat; });
}
const sauverBientot = () => { clearTimeout(reel.sauvTimer); reel.sauvTimer = setTimeout(sauverReel, 800); };

// Temps passé dans un livret fermé : compté le jour même pour l'espace parents.
function compterLivret(l) {
  const er = reel.er;
  const s = Math.max(0, Math.floor(((er.fins[l.n] ?? 0) - (er.debuts[l.n] ?? 0)) / 1000));
  joueur = store.modifier((j) => { const jr = (j.jours[store.aujourdhui()] ??= jourDe(j)); jr.secondes = (jr.secondes ?? 0) + s; });
}

async function lancerExamenReel(id) {
  if (joueur.examenReel) {
    const meme = joueur.examenReel.examenId === id;
    if (!await confirmer(meme ? 'Recommencer cet examen ?' : 'Un examen est déjà en cours',
      `Tu as un examen réel en cours (${esc(nomExamen(joueur.examenReel.examenId))}). Si tu en commences un nouveau, il sera effacé.`,
      'Commencer le nouveau', 'Garder l\'ancien')) return afficherAccueil();
  }
  const examen = await examenCharge(id);
  reel = { er: new ExamenReel(examen), examen };
  sauverReel();
  afficherEntracte();
}

async function reprendreExamenReel() {
  const e = joueur.examenReel;
  try {
    const examen = await examenCharge(e.examenId);
    reel = { er: ExamenReel.depuis(examen, e), examen };
  } catch {
    joueur = store.modifier((j) => { delete j.examenReel; });
    toast('Cet examen ne peut pas être repris. Recommence-le depuis l\'accueil.');
    return afficherAccueil();
  }
  // Un livret dont le temps s'est écoulé pendant l'absence est fermé à la reprise.
  const fermes = reel.er.livrets.filter((l) => reel.er.fins[l.n] != null && e.fins?.[l.n] == null);
  fermes.forEach(compterLivret);
  sauverReel();
  if (reel.er.livretOuvert()) return afficherLivret();
  afficherEntracte(fermes.length ? { tempsEcoule: fermes.at(-1) } : {});
}

// Écran entre deux livrets (et avant le premier).
function afficherEntracte({ rendu = null, tempsEcoule = null } = {}) {
  clearInterval(reel.timer);
  const er = reel.er;
  if (er.estTermine()) return finirExamenReel();
  const l = er.livret;
  const fini = rendu ?? tempsEcoule;
  const ligne = (x, i) => {
    const etat = i < er.courant ? 'fait' : i === er.courant ? 'suivant' : 'apres';
    const info = etat === 'fait' ? `${er.nbRepondues(x)} / ${x.questions.length} réponses` : `${x.questions.length} questions · ${minutes(x.dureeSecondes)}`;
    return `<li class="${etat}"><span class="e">${etat === 'fait' ? '✅' : etat === 'suivant' ? '▶️' : EMOJI_MAT[x.matiere] ?? '📄'}</span><div><b>Livret ${x.n} · ${esc(x.titre)}</b><small>${info}</small></div></li>`;
  };
  $('#ecran-quiz').innerHTML = `<div class="quiz entracte">
    <div class="quiz-haut"><button class="fermer" id="quitter" aria-label="Revenir à l'accueil">✕</button><h1>🎯 ${esc(nomExamen(reel.examen.id))}</h1></div>
    ${tempsEcoule ? `<section class="carte annonce temps"><b>⏰ Temps écoulé pour le livret ${tempsEcoule.n}</b><p>Comme au CEB, le livret est ramassé. Tes réponses sont gardées.</p></section>`
      : rendu ? `<section class="carte annonce"><b>✅ Livret ${rendu.n} rendu</b><p>Bravo ! Tu peux souffler un peu avant le suivant.</p></section>` : ''}
    <section class="carte">
      <small class="sur">${fini ? 'Livret suivant' : 'Premier livret'}</small>
      <h2>${EMOJI_MAT[l.matiere] ?? '📄'} Livret ${l.n} · ${esc(l.titre)}</h2>
      <p class="infos-livret"><span>📝 ${l.questions.length} questions</span><span>⏱️ ${minutes(l.dureeSecondes)}</span></p>
      ${l.part < 1 ? `<p class="mute">Au CEB, ce livret dure ${l.dureeOfficielle} min. Ici, les questions à faire sur papier sont retirées, donc tu as ${minutes(l.dureeSecondes)}.</p>` : ''}
      <ul class="regles">
        <li>Le chrono démarre quand tu ouvres le livret et ne s'arrête plus.</li>
        <li>Pas de correction maintenant : tu verras tout à la fin de l'examen.</li>
        <li>Tu peux revenir sur tes réponses tant que le livret est ouvert.</li>
      </ul>
    </section>
    <section class="carte"><h3 class="section-titre">🗂️ Tes livrets</h3><ol class="suivi-livrets">${er.livrets.map(ligne).join('')}</ol></section>
    <div class="actions">
      <button class="btn btn-cta" id="ouvrir-livret">Ouvrir le livret ${l.n} ⏱️</button>
      <button class="btn" id="pause-reel">⏸️ Reprendre plus tard</button>
    </div>
  </div>`;
  montrer('ecran-quiz');
  const auRevoir = () => { sauverReel(); toast('Ton examen est gardé : reprends-le depuis l\'accueil.'); afficherAccueil(); };
  $('#quitter').onclick = auRevoir;
  $('#pause-reel').onclick = auRevoir;
  $('#ouvrir-livret').onclick = () => {
    if (etatTemps(joueur, store.reglagesParents()).atteint) return afficherPause();
    er.ouvrirLivret();
    sauverReel();
    afficherLivret();
  };
}

// Livret en cours : questions, navigation libre, chrono.
function afficherLivret() {
  const er = reel.er;
  const l = er.livret;
  $('#ecran-quiz').innerHTML = `
    <div class="quiz livret-reel">
      <div class="quiz-haut">
        <button class="fermer" id="quitter" aria-label="Quitter le livret">✕</button>
        <div class="barre"><i id="r-prog"></i></div>
        <span class="chrono-reel" id="r-chrono" role="timer"></span>
      </div>
      <p class="origine-livret">Livret ${l.n} · ${esc(l.titre)}</p>
      <nav class="nav-q" id="r-nav" aria-label="Questions du livret">${l.questions.map((_, i) => `<button data-i="${i}" aria-label="Question ${i + 1}">${i + 1}</button>`).join('')}</nav>
      <section class="question" id="q-zone"></section>
    </div>
    <div class="pied-quiz" id="pied"><div class="in">
      <button class="btn" id="r-prec">← Précédente</button>
      <button class="btn btn-cta" id="r-suiv">Suivante →</button>
    </div></div>`;
  montrer('ecran-quiz');
  $$('#r-nav button').forEach((b) => b.onclick = () => allerQuestion(+b.dataset.i));
  $('#r-prec').onclick = () => allerQuestion(er.position - 1);
  $('#r-suiv').onclick = () => (er.position >= l.questions.length - 1 ? rendreLivretReel() : allerQuestion(er.position + 1));
  $('#quitter').onclick = async () => {
    if (!await confirmer('Quitter le livret ?', 'Tes réponses sont gardées, mais <b>le chrono continue de tourner</b>, comme en classe. Reviens vite le terminer depuis l\'accueil.', 'Quitter', 'Rester')) return;
    sauverReel(); clearInterval(reel.timer); afficherAccueil();
  };
  clearInterval(reel.timer);
  reel.timer = setInterval(tickReel, 500);
  tickReel();
  allerQuestion(er.position);
}

function tickReel() {
  const er = reel.er;
  const l = er.livret;
  if (er.fermerSiTempsEcoule()) { compterLivret(l); sauverReel(); return afficherEntracte({ tempsEcoule: l }); }
  const t = er.tempsRestant();
  const c = $('#r-chrono');
  if (!c) return;
  c.textContent = `⏱️ ${horlogeTxt(t)}`;
  c.classList.toggle('urgent', t <= 60);
  c.setAttribute('aria-label', `Temps restant : ${Math.ceil(t / 60)} minute${t > 60 ? 's' : ''}`);
}

function majNavReel() {
  const er = reel.er;
  const l = er.livret;
  $$('#r-nav button').forEach((b, i) => {
    b.classList.toggle('ok', er.aRepondu(l.questions[i]));
    b.classList.toggle('cur', i === er.position);
    b.toggleAttribute('aria-current', i === er.position);
  });
  $('#r-prog').style.width = `${Math.round((er.nbRepondues() / l.questions.length) * 100)}%`;
  $('#r-prec').disabled = er.position === 0;
  $('#r-suiv').textContent = er.position >= l.questions.length - 1 ? 'Rendre le livret ✔' : 'Suivante →';
}

function allerQuestion(i) {
  const er = reel.er;
  if (reel.sauvTimer) sauverReel();
  const q = er.aller(i);
  if (!q) return tickReel();
  const docs = (q.documents ?? []).map((id) => reel.examen.documents?.find((d) => d.id === id)).filter(Boolean);
  $('#q-zone').innerHTML = `
    <p class="origine">Question ${esc(q.numero)}</p>
    ${boutonVoix(q)}
    <h2>${esc(q.enonce)}</h2>
    ${q.figure && q.type !== 'trace' ? `<figure class="figure-q">${q.figure}</figure>` : ''}
    ${rendreDocs(docs)}
    <div id="q-saisie">${rendreSaisie(q).replace('puis compare-la avec la réponse modèle.', 'tu la compareras avec la réponse modèle à la fin.')}</div>`;
  reel.ecoutes = reel.ecoutes ?? {};
  brancherDocs(docs, { compteur: reel.ecoutes, max: 2 });
  taire(); brancherBoutonVoix($('#btn-voix'), () => texteAVoix(q));
  let ui = null; // reste nul pendant la remise des réponses déjà données
  const noter = () => { if (!ui) return; if (er.noter(q.id, ui.lire())) { sauverBientot(); majNavReel(); } else tickReel(); };
  const branche = brancher($('#q-saisie'), q, { onPret: noter, onValider: () => $('#r-suiv').click() });
  branche.restaurer(er.reponses[q.id]);
  ui = branche;
  majNavReel();
}

async function rendreLivretReel() {
  const er = reel.er;
  const l = er.livret;
  if (reel.sauvTimer) sauverReel();
  const reste = l.questions.length - er.nbRepondues();
  if (!await confirmer(`Rendre le livret ${l.n} ?`,
    `${reste ? `Il te reste <b>${reste} question${reste > 1 ? 's' : ''} sans réponse</b>. ` : 'Tu as répondu à toutes les questions. '}Une fois rendu, tu ne pourras plus le modifier.`,
    'Rendre le livret', 'Continuer')) return;
  if (!er.livretOuvert()) return tickReel();
  er.rendreLivret();
  compterLivret(l);
  sauverReel();
  afficherEntracte({ rendu: l });
}

function finirExamenReel() {
  clearInterval(reel.timer);
  const er = reel.er;
  const resume = er.resume();
  let res = null;
  joueur = store.modifier((j) => {
    // Statistiques sur les seules questions répondues. Le temps a déjà été compté livret par livret
    // (le bon jour) : on ne le recompte pas.
    const avant = j.sessions.length;
    res = enregistrerSession(j, { ...er.resumeStats(), dureeSecondes: 0 }, 'examen');
    const s = j.sessions.length > avant ? j.sessions.at(-1) : null; // rien d'enregistré si aucune réponse
    if (s?.reel) Object.assign(s, { dureeSecondes: resume.dureeSecondes, questions: resume.questions, bonnes: resume.bonnes, details: undefined });
    delete j.examenReel;
  });
  afficherBilanReel(resume, res);
}

function afficherBilanReel(resume, res) {
  const er = reel.er;
  const pct = resume.pourcentage;
  const [emoji, titre] = pct >= 80 ? ['🏆', 'Examen brillant !'] : pct >= 60 ? ['🎓', 'Examen réussi !'] : pct >= 50 ? ['💪', 'Pas loin du but !'] : ['🌱', 'Tu sais maintenant quoi travailler'];
  const mats = ['fr', 'ma', 'hg', 'sc'].filter((m) => resume.parMatiere[m]?.max);
  const barre = (p) => `<div class="barre seuil"><i style="width:${p}%"></i><span class="repere" style="left:${CEB.seuilMatiere}%"></span></div>`;
  const absents = (reel.examen.livrets ?? []).filter((l) => !er.livrets.some((x) => x.n === l.n)).map((l) => l.titre);
  const recompenses = [
    ...(res.niveauApres > res.niveauAvant ? [{ e: '⚡', t: `Niveau ${res.niveauApres} atteint !` }] : []),
    ...res.nouveauxBadges.map((b) => ({ e: b.e, t: `Nouveau badge : ${b.nom}` })),
  ];
  $('#ecran-resultat').innerHTML = `<div class="resultat bilan-reel">
    <div class="grand-emoji">${emoji}</div>
    <h1>${titre}</h1>
    <div><div class="score-grand">${pct} %</div><p class="mute" style="margin:4px 0 0">${pts(resume.points)} points sur ${resume.max} · ${resume.repondues} réponses sur ${resume.questions} · ${minutes(resume.dureeSecondes)}</p></div>
    <div class="gains">
      <div><b>+${res.xpSession + res.xpDefis}</b><small>XP</small></div>
      <div><b>+${res.gemmes}</b><small>💎 gemmes</small></div>
      <div><b>${resume.bonnes}</b><small>✔ bonnes</small></div>
    </div>
    ${recompenses.length ? `<div class="recompenses">${recompenses.map((r) => `<div class="recompense"><span class="e">${r.e}</span><div><b>${esc(r.t)}</b></div></div>`).join('')}</div>` : ''}
    <section class="carte par-domaine"><h3 style="margin-bottom:4px">Par matière</h3>
      <p class="mute" style="margin:0 0 12px;font-size:13px">Repère du CEB : au moins ${CEB.seuilMatiere} % dans chaque matière (le trait) et ${CEB.seuilMoyenne} % en moyenne. C'est indicatif : à l'écran, il manque les livrets sur papier.</p>
      ${mats.map((m) => { const v = resume.parMatiere[m]; return `
      <div class="ligne"><span>${EMOJI_MAT[m]} ${NOM_MAT[m]}</span><b>${v.pourcentage} % ${v.pourcentage >= CEB.seuilMatiere ? '✔' : '⚠️'}</b>${barre(v.pourcentage)}</div>`; }).join('')}
    </section>
    <section class="carte par-domaine"><h3 style="margin-bottom:12px">Par livret</h3>
      ${er.livrets.map((l) => { const v = resume.parLivret[l.n]; return `
      <div class="ligne"><span>Livret ${l.n} · ${esc(l.titre)}</span><b>${v?.max ? `${v.pourcentage} %` : '—'}</b><div class="barre"><i style="width:${v?.pourcentage ?? 0}%"></i></div></div>`; }).join('')}
      ${absents.length ? `<p class="mute" style="font-size:13px;margin:4px 0 0">Non proposés à l'écran : ${absents.map(esc).join(', ')}. Pour ceux-là, <a href="imprimer.html">imprime un examen 🖨️</a>.</p>` : ''}
      ${er.livrets.some((l) => l.dureeEstimee) ? '<p class="mute" style="font-size:12px;margin:6px 0 0">Durées des livrets établies d\'après le CEB 2026, à vérifier pour les autres années.</p>' : ''}
    </section>
    <div class="actions">
      <button class="btn btn-cta" id="voir-revue">🔍 Revoir mes réponses</button>
      <button class="btn" id="accueil">🏠 Accueil</button>
    </div>
  </div>`;
  montrer('ecran-resultat');
  if (pct >= 60) { setTimeout(() => confettis(), 200); sons.fanfare(); }
  $('#accueil').onclick = afficherAccueil;
  $('#voir-revue').onclick = () => afficherRevueReel(resume, res, true);
}

// Revue question par question, après la correction.
function afficherRevueReel(resume, res, erreursSeules) {
  const lignes = reel.er.correction();
  const garder = (r) => !erreursSeules || r.correct !== true;
  const nbErreurs = lignes.filter((r) => r.correct === false).length;
  const carte = (r) => {
    const q = r.q;
    const etat = r.correct === true ? 'juste' : r.correct === false ? (r.score > 0 ? 'partiel' : 'faux') : 'ouvert';
    const badge = { juste: '✔ Juste', partiel: `◐ En partie (${pts(r.score)}/${r.max})`, faux: r.repondu ? '✘ Faux' : '✘ Pas de réponse', ouvert: '✍️ À comparer' }[etat];
    const ta = reponseEleveLisible(q, r.reponse);
    const fiche = donnees.fiches[q.fiche];
    return `<article class="carte revue ${etat}">
      <p class="origine">Livret ${r.livret} · question ${esc(q.numero)} <span class="badge-revue">${badge}</span></p>
      <h3>${esc(q.enonce)}</h3>
      <p><b>Ta réponse :</b> <span class="pre">${ta == null ? '<i>aucune</i>' : esc(ta)}</span></p>
      ${etat !== 'juste' ? `<p class="bonne"><b>${q.type === 'ouverte' ? 'Réponse modèle' : 'Bonne réponse'} :</b> <span class="pre">${esc(bonneReponseLisible(q))}</span></p>` : ''}
      ${q.explication && etat !== 'juste' ? `<p>${ic('astuce', 'ic-txt')} ${esc(q.explication)}</p>` : ''}
      ${fiche && etat !== 'juste' ? `<button class="btn petit btn-fiche" data-f="${esc(q.fiche)}">📘 Revoir la règle : ${esc(fiche.titre)}</button>` : ''}
      <p><button class="lien lien-signaler" data-signaler="${esc(q.id)}">⚑ Signaler une erreur</button></p>
    </article>`;
  };
  const parLivret = reel.er.livrets.map((l) => {
    const items = lignes.filter((r) => r.livret === l.n && garder(r));
    return items.length ? `<h2 class="titre-livret">Livret ${l.n} · ${esc(l.titre)}</h2>${items.map(carte).join('')}` : '';
  }).join('');
  $('#ecran-resultat').innerHTML = `<div class="revue-reel">
    <div class="quiz-haut"><button class="fermer" id="retour-bilan" aria-label="Retour au bilan">←</button><h1>🔍 Mes réponses</h1></div>
    <div class="options-examen" role="radiogroup" aria-label="Questions affichées">
      <button class="puce${erreursSeules ? ' sel' : ''}" role="radio" aria-checked="${erreursSeules}" data-filtre="1">À revoir (${nbErreurs + lignes.filter((r) => r.correct === null).length})</button>
      <button class="puce${erreursSeules ? '' : ' sel'}" role="radio" aria-checked="${!erreursSeules}" data-filtre="0">Toutes (${lignes.length})</button>
    </div>
    ${parLivret || '<p class="carte">Aucune erreur : tout est juste ! 🏆</p>'}
    <div class="actions"><button class="btn" id="retour-bilan2">← Retour au bilan</button><button class="btn btn-cta" id="accueil">🏠 Accueil</button></div>
  </div>`;
  montrer('ecran-resultat');
  $$('[data-filtre]').forEach((b) => b.onclick = () => afficherRevueReel(resume, res, b.dataset.filtre === '1'));
  $$('.btn-fiche').forEach((b) => b.onclick = () => ouvrirFiche(b.dataset.f));
  $$('[data-signaler]').forEach((b) => b.onclick = () => {
    const r = lignes.find((x) => x.q.id === b.dataset.signaler);
    ouvrirSignalement({ q: r.q, reponseDonnee: reponseEleveLisible(r.q, r.reponse) ?? '(aucune)', bonneReponse: bonneReponseLisible(r.q), page: 'revue de l\'examen réel' });
  });
  $('#retour-bilan').onclick = $('#retour-bilan2').onclick = () => afficherBilanReel(resume, res);
  $('#accueil').onclick = afficherAccueil;
}

// ============================================================ Bibliothèque des fiches + cartes-mémoire
const filtreFiches = { matiere: '', texte: '', statut: '' };
let exParNotion = null;
const nbExercices = (id) => (exParNotion ??= exercicesParNotion(donnees.banque, donnees.modeles))[id] ?? 0;
// Fiche ouverte depuis la bibliothèque : « S'entraîner » seulement s'il existe des exercices sur la notion.
const ouvrirFicheBiblio = (id) => ouvrirFiche(id, {
  titreHaut: 'Ma fiche', papier: true,
  ...(nbExercices(id) ? { cta: '🎯 M\'entraîner sur cette notion', onCta: () => lancerCible(id, false) } : {}),
});

function afficherFiches() {
  const el = $('#ecran-fiches');
  const dues = cartesDues(joueur).filter((id) => donnees.fiches[id]);
  const STATS = [['', 'Toutes'], ['fragile', `${STATUTS.fragile.e} À retravailler`], ['progres', `${STATUTS.progres.e} En progrès`], ['maitrise', `${STATUTS.maitrise.e} Maîtrisées`], ['decouverte', `${STATUTS.decouverte.e} À découvrir`]];
  el.innerHTML = `<div class="progres biblio">
    <p><button class="btn" id="retour-accueil">← Accueil</button></p>
    <h1>📘 Mes fiches</h1>
    <p class="mute" style="margin:0">Toutes les règles à connaître pour le CEB, au même endroit. <a href="fiches/">Version web à partager</a></p>
    <section class="carte cartes-memoire">
      <div class="cm-tete"><span class="cm-e" aria-hidden="true">🃏</span><div>
        <h3>Cartes-mémoire</h3>
        <p class="mute">Lis le titre, retrouve la règle dans ta tête, puis retourne la carte. ${dues.length ? `<b>${dues.length} carte${dues.length > 1 ? 's' : ''} à revoir aujourd'hui.</b>` : 'Les cartes que tu ne savais pas reviennent les jours suivants.'}</p>
      </div></div>
      <div class="actions"><button class="btn btn-cta" id="cm-jour">🃏 Mes cartes du jour</button><button class="btn" id="cm-selection">Réviser cette sélection</button></div>
    </section>
    <section class="carte filtres-fiches">
      <label class="recherche"><span aria-hidden="true">🔎</span><input class="champ" id="f-texte" type="search" placeholder="Chercher une règle (ex. participe, aire, siècle…)" autocomplete="off" value="${esc(filtreFiches.texte)}" aria-label="Chercher une fiche"></label>
      <div class="options-examen" role="radiogroup" aria-label="Matière">${[...MATIERES].sort((a, b) => !!a.id - !!b.id).map((m) => `<button class="puce f-mat" role="radio" data-v="${m.id}">${m.id ? `${m.e} ${m.nom}` : 'Toutes'}</button>`).join('')}</div>
      <div class="options-examen" role="radiogroup" aria-label="Où j'en suis">${STATS.map(([id, nom]) => `<button class="puce f-st" role="radio" data-v="${id}">${nom}</button>`).join('')}</div>
    </section>
    <p class="mute" id="f-compte" aria-live="polite"></p>
    <div class="grille-fiches" id="f-liste"></div>
  </div>`;
  montrer('ecran-fiches');
  const liste = () => filtrerFiches(donnees.fiches, { ...filtreFiches, j: joueur });
  const maj = () => {
    $$('.f-mat', el).forEach((b) => { const ok = b.dataset.v === filtreFiches.matiere; b.classList.toggle('sel', ok); b.setAttribute('aria-checked', String(ok)); });
    $$('.f-st', el).forEach((b) => { const ok = b.dataset.v === filtreFiches.statut; b.classList.toggle('sel', ok); b.setAttribute('aria-checked', String(ok)); });
    const fs = liste();
    $('#f-compte', el).textContent = `${fs.length} fiche${fs.length > 1 ? 's' : ''}`;
    $('#f-liste', el).innerHTML = fs.length ? fs.map((f) => {
      const m = maitrise(joueur, f.id); const st = STATUTS[m.statut];
      return `<button class="fiche-tuile st-${m.statut}" data-f="${f.id}"><span class="e" aria-hidden="true">${f.e}</span>
        <span class="t"><b>${esc(f.titre)}</b><small>${NOM_MAT[f.matiere] ?? ''} · ${st.e} ${st.nom}${m.n ? ` · ${Math.round(m.m * 100)} %` : ''}${carteDue(joueur, f.id) ? ' · 🃏 à revoir' : ''}</small></span></button>`;
    }).join('') : '<p class="carte">Aucune fiche ne correspond. Essaie un autre mot 🔎</p>';
    $$('.fiche-tuile', el).forEach((b) => b.onclick = () => ouvrirFicheBiblio(b.dataset.f));
    $('#cm-selection', el).disabled = !fs.length;
  };
  $('#retour-accueil', el).onclick = afficherAccueil;
  $('#f-texte', el).oninput = (e) => { filtreFiches.texte = e.target.value; maj(); };
  $$('.f-mat', el).forEach((b) => b.onclick = () => { filtreFiches.matiere = b.dataset.v; maj(); });
  $$('.f-st', el).forEach((b) => b.onclick = () => { filtreFiches.statut = b.dataset.v; maj(); });
  $('#cm-jour', el).onclick = () => lancerCartes(null);
  $('#cm-selection', el).onclick = () => lancerCartes(liste().map((f) => f.id));
  maj();
}

let cartes = null; // { file, i, retourne, savait, revoir, debut }
function lancerCartes(ids) {
  if (etatTemps(joueur, store.reglagesParents()).atteint) return afficherPause();
  const file = paquet(joueur, donnees.fiches, { ids });
  if (!file.length) return toast('Aucune carte à réviser ici.');
  cartes = { file, i: 0, retourne: false, savait: 0, revoir: [], repasse: new Set(), debut: Date.now() };
  afficherCarte();
}

function afficherCarte() {
  const c = cartes;
  if (c.i >= c.file.length) return finirCartes();
  const f = donnees.fiches[c.file[c.i]];
  const voix = confortDe(joueur).voix && voixDisponible();
  $('#ecran-quiz').innerHTML = `<div class="quiz cartes-jeu">
    <div class="quiz-haut">
      <button class="fermer" id="quitter" aria-label="Arrêter les cartes">✕</button>
      <div class="barre"><i style="width:${Math.round((c.i / c.file.length) * 100)}%"></i></div>
      <span class="compteur">${c.i + 1} / ${c.file.length}</span>
    </div>
    <div class="carte-flip${c.retourne ? ' retournee' : ''}" id="carte">
      <section class="carte face recto" aria-hidden="${c.retourne}">
        <small class="sur">${NOM_MAT[f.matiere] ?? ''}${c.repasse.has(f.id) ? ' · deuxième passage' : ''}</small>
        <div class="cm-grand-e" aria-hidden="true">${f.e}</div>
        <h2>${esc(f.titre)}</h2>
        <p class="mute">Que dit la règle ? Pense à ta réponse (tu peux la dire à voix haute), puis retourne la carte.</p>
      </section>
      <section class="carte face verso" aria-hidden="${!c.retourne}">
        <small class="sur">${f.e} ${esc(f.titre)}</small>
        <ul class="regle">${f.regle.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
        <div class="encart"><b>Exemple</b><p>${esc(f.exemple)}</p></div>
        ${f.astuce ? `<div class="encart astuce"><b>${ic('astuce', 'ic-txt')} Astuce</b><p>${esc(f.astuce)}</p></div>` : ''}
        ${voix ? '<button class="btn petit btn-voix" id="btn-voix" aria-pressed="false">🔊 Écouter</button>' : ''}
      </section>
    </div>
  </div>
  <div class="pied-quiz"><div class="in">${c.retourne
    ? '<button class="btn" id="c-revoir">↺ À revoir</button><button class="btn btn-cta" id="c-savais">✔ Je savais</button>'
    : '<button class="btn btn-cta" id="c-retourner">🔄 Retourner la carte</button>'}</div></div>`;
  montrer('ecran-quiz');
  taire();
  brancherBoutonVoix($('#btn-voix'), () => [f.titre, ...f.regle, `Exemple : ${f.exemple}`, f.astuce ? `Astuce : ${f.astuce}` : ''].filter(Boolean).join('. '));
  const retourner = () => { c.retourne = true; afficherCarte(); $('#c-savais')?.focus(); };
  const repondre = (savait) => {
    joueur = store.modifier((j) => { noterCarte(j, f.id, savait); });
    if (savait) { c.savait++; sons.juste(); } else {
      if (!c.revoir.includes(f.id)) c.revoir.push(f.id);
      // Une carte ratée repasse une fois en fin de paquet.
      if (!c.repasse.has(f.id)) { c.repasse.add(f.id); c.file.push(f.id); }
    }
    c.i++; c.retourne = false; afficherCarte();
  };
  $('#carte').onclick = (e) => { if (!c.retourne && !e.target.closest('button')) retourner(); };
  $('#c-retourner')?.addEventListener('click', retourner);
  $('#c-savais')?.addEventListener('click', () => repondre(true));
  $('#c-revoir')?.addEventListener('click', () => repondre(false));
  $('#quitter').onclick = () => finirCartes();
  ($('#c-retourner') ?? $('#c-savais')).focus();
}

function finirCartes() {
  const c = cartes;
  taire();
  const vues = Math.min(c.i, c.file.length);
  // Temps de jeu (espace parents) et petite récompense : 1 XP par carte passée.
  joueur = store.modifier((j) => {
    const jr = (j.jours[store.aujourdhui()] ??= jourDe(j));
    jr.secondes = (jr.secondes ?? 0) + Math.round((Date.now() - c.debut) / 1000);
    j.xp += vues;
  });
  if (!vues) return afficherFiches();
  const encore = c.revoir.filter((id) => donnees.fiches[id]);
  $('#ecran-resultat').innerHTML = `<div class="resultat">
    <div class="grand-emoji">🃏</div>
    <h1>${encore.length ? 'Bien révisé !' : 'Tout su, bravo !'}</h1>
    <div class="gains">
      <div><b>${vues}</b><small>cartes</small></div>
      <div><b>${c.savait}</b><small>✔ je savais</small></div>
      <div><b>+${vues}</b><small>XP</small></div>
    </div>
    ${encore.length ? `<section class="carte par-domaine"><h3 style="margin-bottom:6px">↺ À revoir demain</h3>
      <p class="mute" style="margin:0 0 10px;font-size:14px">Ces cartes reviendront demain. Pour mieux les retenir, entraîne-toi sur des questions.</p>
      ${encore.map((id) => { const f = donnees.fiches[id]; return `<div class="ligne-revoir"><span>${f.e} ${esc(f.titre)}</span>${nbExercices(id) ? `<button class="btn petit" data-cible="${id}">🎯 S'entraîner</button>` : ''}</div>`; }).join('')}
    </section>` : ''}
    <div class="actions"><button class="btn btn-cta" id="vers-fiches">📘 Mes fiches</button><button class="btn" id="accueil">🏠 Accueil</button></div>
  </div>`;
  montrer('ecran-resultat');
  if (!encore.length && vues >= 5) { setTimeout(() => confettis(50), 200); sons.fanfare(); }
  $('#vers-fiches').onclick = afficherFiches;
  $('#accueil').onclick = afficherAccueil;
  $$('[data-cible]').forEach((b) => b.onclick = () => lancerCible(b.dataset.cible, true));
}

// ============================================================ Coach
function blocCoach() {
  const pret = coachPret(joueur);
  const dues = revisionsDues(joueur);
  const faibles = faiblesses(joueur, donnees.fiches);
  const nbReponses = Object.values(joueur.notions).reduce((s, n) => s + n.r.length, 0);
  let corps;
  if (!pret) {
    corps = `<p>Je t'observe encore un peu : réponds à <b>${10 - nbReponses} question${10 - nbReponses > 1 ? 's' : ''}</b> de plus et je te dirai exactement quoi travailler.</p>
      <div class="barre"><i style="width:${nbReponses * 10}%"></i></div>`;
  } else if (faibles.length) {
    corps = `<p>Voici ce qu'on va renforcer ensemble :</p>
      <div class="coach-liste">${faibles.map((x) => `
        <div class="coach-ligne"><span class="e">${x.fiche.e}</span>
          <div><b>${esc(x.fiche.titre)}</b><div class="barre"><i style="width:${Math.round(x.m * 100)}%"></i></div></div>
          <button class="btn petit voir-fiche" data-f="${x.fiche.id}" aria-label="Voir la fiche ${esc(x.fiche.titre)}">📘</button></div>`).join('')}
      </div>`;
  } else {
    corps = `<p>Aucun point faible repéré pour l'instant, bravo 💪 Continue à varier les matières.</p>`;
  }
  const bouton = pret && (faibles.length || dues.length)
    ? `<button class="btn btn-cta" id="mission-ciblee">🎯 Mission ciblée</button>${faibles.length ? '<a class="btn petit" href="imprimer.html?mode=fiche" title="Une fiche à imprimer sur tes points faibles">🖨️ Fiche papier</a>' : ''}` : '';
  return `<section class="carte coach">
    <div class="coach-tete"><span class="coach-ico">🧭</span><div><h3>Ton coach</h3>
      ${dues.length ? `<small class="mute">🔁 ${dues.length} question${dues.length > 1 ? 's' : ''} à revoir aujourd'hui</small>` : '<small class="mute">Il repère tes points faibles au fil des parties</small>'}</div></div>
    ${corps}${bouton ? `<div class="coach-actions">${bouton}<button class="lien" data-aller="progres">Voir toutes mes notions →</button></div>` : ''}
  </section>`;
}

function brancherCoach(el) {
  $$('.voir-fiche', el).forEach((b) => b.onclick = () => ouvrirFiche(b.dataset.f, {
    cta: '🎯 M\'entraîner sur cette notion', onCta: () => lancerCible(b.dataset.f, false),
  }));
  $('#mission-ciblee', el)?.addEventListener('click', () => lancerCible(null, true));
  $$('[data-aller="progres"]', el).forEach((b) => b.onclick = afficherProgres);
}

// Lance une mission ciblée : sur une notion précise, ou sur l'ensemble des faiblesses.
function lancerCible(notion, avecRappel) {
  const demarrer = () => { choix.mode = 'cible'; choix.cible = notion; lancerPartie(); };
  const rappel = notion ?? faiblesses(joueur, donnees.fiches, 1)[0]?.fiche.id;
  if (avecRappel && rappel && donnees.fiches[rappel]) {
    ouvrirFiche(rappel, { titreHaut: 'Petit rappel avant de commencer', cta: 'J\'ai compris, on y va ! 🎯', onCta: demarrer });
  } else demarrer();
}

function ouvrirFiche(id, { cta = null, onCta = null, titreHaut = 'Fiche Rappel', papier = false } = {}) {
  const f = donnees.fiches[id];
  if (!f) return;
  const m = maitrise(joueur, id);
  const fond = document.createElement('div');
  fond.className = 'modal-fond';
  fond.innerHTML = `<div class="modal carte" role="dialog" aria-modal="true" aria-labelledby="fiche-titre">
    <small class="sur">${esc(titreHaut)}</small>
    <h2 id="fiche-titre"><span>${f.e}</span> ${esc(f.titre)}</h2>
    ${m.n ? `<p class="mute" style="margin:0 0 10px">${STATUTS[m.statut].e} ${STATUTS[m.statut].nom} · ${Math.round(m.m * 100)} % sur tes ${m.n} dernière${m.n > 1 ? 's' : ''} réponse${m.n > 1 ? 's' : ''}</p>` : ''}
    <ul class="regle">${f.regle.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
    <div class="encart"><b>Exemple</b><p>${esc(f.exemple)}</p></div>
    ${f.astuce ? `<div class="encart astuce"><b>${ic('astuce', 'ic-txt')} Astuce</b><p>${esc(f.astuce)}</p></div>` : ''}
    <p style="margin:0"><button class="lien lien-signaler" id="fiche-signaler">⚑ Signaler une erreur dans cette fiche</button></p>
    <div class="modal-actions">${confortDe(joueur).voix && voixDisponible() ? '<button class="btn" id="fiche-voix" aria-pressed="false">🔊 Écouter</button>' : ''}${papier ? `<a class="btn" href="imprimer.html?mode=fiche&notions=${encodeURIComponent(id)}">🖨️ Fiche papier</a>` : ''}${cta ? `<button class="btn btn-cta" id="fiche-cta">${esc(cta)}</button>` : ''}<button class="btn" id="fiche-fermer">Fermer</button></div>
  </div>`;
  const fermer = () => { taire(); fond.remove(); document.removeEventListener('keydown', echap); };
  const echap = (e) => { if (e.key === 'Escape' && !document.querySelector('.zoom-fond')) fermer(); };
  document.addEventListener('keydown', echap);
  fond.addEventListener('click', (e) => { if (e.target === fond) fermer(); });
  document.body.append(fond);
  $('#fiche-fermer', fond).onclick = fermer;
  $('#fiche-signaler', fond).onclick = () => { fermer(); ouvrirSignalement({ fiche: f, page: 'fiche Rappel' }); };
  brancherBoutonVoix($('#fiche-voix', fond), () => [f.titre, ...f.regle, `Exemple : ${f.exemple}`, f.astuce ? `Astuce : ${f.astuce}` : ''].filter(Boolean).join('. '));
  $('#fiche-cta', fond)?.addEventListener('click', () => { fermer(); onCta?.(); });
  ($('#fiche-cta', fond) ?? $('#fiche-fermer', fond)).focus();
}

// ============================================================ Mes progrès
function afficherProgres() {
  const notions = carteNotions(joueur, donnees.fiches);
  const maitrisees = notions.filter((x) => x.statut === 'maitrise').length;
  const dues = revisionsDues(joueur).length;
  const pct = joueur.totalQuestions ? Math.round((joueur.totalBonnes / joueur.totalQuestions) * 100) : 0;
  const parMat = MATIERES.filter((m) => m.id).map((m) => ({ ...m, liste: notions.filter((x) => x.fiche.matiere === m.id)
    .sort((a, b) => STATUTS[a.statut].ordre - STATUTS[b.statut].ordre || a.m - b.m) }));

  $('#ecran-progres').innerHTML = `<div class="progres">
    <p><button class="btn" id="retour-accueil">← Accueil</button></p>
    <h1>📊 Mes progrès</h1>
    <div class="gains">
      <div><b>${joueur.totalQuestions}</b><small>questions</small></div>
      <div><b>${pct} %</b><small>de réussite</small></div>
      <div><b>${maitrisees}/${notions.length}</b><small>notions maîtrisées</small></div>
    </div>
    ${dues ? `<p class="carte" style="margin:0">🔁 <b>${dues} question${dues > 1 ? 's' : ''} à revoir aujourd'hui.</b> Le coach les glisse dans ta prochaine mission ciblée. <button class="btn btn-cta petit" id="p-cible">🎯 Mission ciblée</button></p>` : ''}
    <p class="legende">${Object.values(STATUTS).sort((a, b) => a.ordre - b.ordre).map((st) => `<span>${st.e} ${st.nom}</span>`).join('')}</p>
    ${parMat.map((m) => `<section class="carte">
      <h3 class="section-titre">${m.e} ${m.nom}</h3>
      <div class="notions">${m.liste.map((x) => `
        <div class="notion st-${x.statut}">
          <span class="e">${x.fiche.e}</span>
          <div class="nom"><b>${esc(x.fiche.titre)}</b><small>${STATUTS[x.statut].e} ${STATUTS[x.statut].nom}${x.n ? ` · ${Math.round(x.m * 100)} %` : ''}</small>
            <div class="barre"><i style="width:${x.n ? Math.round(x.m * 100) : 0}%"></i></div></div>
          <button class="btn petit" data-fiche="${x.fiche.id}" aria-label="Fiche">📘</button>
          <button class="btn petit" data-cible="${x.fiche.id}" aria-label="S'entraîner">🎯</button>
        </div>`).join('')}</div>
    </section>`).join('')}
  </div>`;
  montrer('ecran-progres');
  const el = $('#ecran-progres');
  $('#retour-accueil', el).onclick = afficherAccueil;
  $('#p-cible', el)?.addEventListener('click', () => lancerCible(null, true));
  $$('[data-fiche]', el).forEach((b) => b.onclick = () => ouvrirFiche(b.dataset.fiche, { cta: '🎯 M\'entraîner sur cette notion', onCta: () => lancerCible(b.dataset.fiche, false) }));
  $$('[data-cible]', el).forEach((b) => b.onclick = () => lancerCible(b.dataset.cible, true));
}

// ============================================================ Réglages
function afficherReglages() {
  const el = $('#ecran-reglages');
  el.innerHTML = `<div class="reglages">
    <p><button class="btn" id="retour-accueil">← Accueil</button></p>
    <h1>🎨 Mon style</h1>
    <section class="carte">
      <p class="etape-titre">Ambiance</p>
      ${blocAmbiances(ambiance(joueur.theme))}
    </section>
    <section class="carte">
      <div class="apercu-joueur" style="margin-bottom:14px">${ava(joueur, 64)}<div><b style="font-family:var(--titre);font-size:22px">${esc(joueur.pseudo)}</b><div class="mute">Niveau ${niveau(joueur.xp).n} · ${niveau(joueur.xp).titre}</div></div></div>
      <p class="etape-titre">Avatar</p>
      <div class="grille-avatars">${AVATARS.map((a) => boutonAvatar(a, a.id === joueur.avatar)).join('')}</div>
      <p class="etape-titre" style="margin-top:14px">Couleur de fond</p>
      <div class="couleurs">${COULEURS.map((c) => `<button data-c="${c}" class="${c === joueur.couleur ? 'sel' : ''}" style="background:${c}"></button>`).join('')}</div>
    </section>
    <section class="carte confort">
      <p class="etape-titre">👓 Confort de lecture</p>
      <div class="ligne-reglage"><span>Taille du texte</span><div class="options-examen" role="radiogroup" aria-label="Taille du texte">${TAILLES.map(([id, nom]) => `<button class="puce cf-taille" role="radio" data-v="${id}">${nom}</button>`).join('')}</div></div>
      <div class="ligne-reglage"><span>Espacement</span><div class="options-examen" role="radiogroup" aria-label="Espacement du texte">${ESPACES.map(([id, nom]) => `<button class="puce cf-espace" role="radio" data-v="${id}">${nom}</button>`).join('')}</div></div>
      <div class="ligne-reglage"><span>Lecture à voix haute</span><div class="options-examen">${voixDisponible()
        ? '<button class="puce cf-voix" role="switch" id="cf-voix"></button><button class="btn petit" id="cf-essai">🔊 Essayer</button>'
        : '<span class="mute">Pas disponible sur ce navigateur.</span>'}</div></div>
      <p class="mute" style="font-size:13px;margin:0 0 10px">Un bouton « Écouter » lit la question et les réponses. Il n'apparaît pas pour les questions de lecture : là, c'est toi qui lis !</p>
      <div class="ligne-reglage"><span>Sons</span><div class="options-examen"><button class="puce cf-sons" role="switch" id="cf-sons"></button></div></div>
      <div class="apercu-texte" aria-hidden="true"><b>Aperçu</b><p>Léa achète 3 cahiers à 2,50 € chacun. Combien paie-t-elle ?</p></div>
    </section>
    <section class="carte">
      <p class="etape-titre">🔑 Code de sauvegarde</p>
      <p class="mute" style="margin:0 0 10px;font-size:14px">Ta progression est gardée sur cet appareil. Pour la retrouver ailleurs, copie ce code et colle-le sur l'autre appareil (« J'ai un code de sauvegarde »).</p>
      <button class="btn" id="copier">📋 Copier mon code</button>
    </section>
    <section class="carte">
      <p class="etape-titre">👪 Pour les parents</p>
      <p class="mute" style="margin:0 0 10px;font-size:14px">Bilan de la semaine, points faibles, temps d'écran et plan de révision jusqu'au CEB. Protégé par un code.</p>
      <button class="btn" id="r-parents">👪 Espace parents</button>
    </section>
    <section class="carte">
      <p class="etape-titre">Joueur</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn" id="changer">🔁 Changer de joueur</button>
        <button class="btn danger" id="supprimer">🗑️ Supprimer ce joueur</button>
      </div>
      <p class="erreur" id="confirm-suppr"></p>
    </section>
  </div>`;
  montrer('ecran-reglages');
  brancherAmbiances(el, (t) => { joueur = store.modifier((j) => { j.theme = t; }); });
  const rafraichirAva = () => { $('.apercu-joueur .pastille-ava', el).outerHTML = ava(joueur, 64); };
  $$('.grille-avatars button', el).forEach((b) => b.onclick = () => { $$('.grille-avatars button', el).forEach((x) => { x.classList.toggle('sel', x === b); x.setAttribute('aria-pressed', String(x === b)); }); joueur = store.modifier((j) => { j.avatar = b.dataset.a; }); rafraichirAva(); });
  $$('.couleurs button', el).forEach((b) => b.onclick = () => { $$('.couleurs button', el).forEach((x) => x.classList.toggle('sel', x === b)); joueur = store.modifier((j) => { j.couleur = b.dataset.c; }); rafraichirAva(); });
  const majConfort = () => {
    const c = confortDe(joueur);
    $$('.cf-taille', el).forEach((b) => { b.classList.toggle('sel', b.dataset.v === c.taille); b.setAttribute('aria-checked', String(b.dataset.v === c.taille)); });
    $$('.cf-espace', el).forEach((b) => { b.classList.toggle('sel', b.dataset.v === c.espace); b.setAttribute('aria-checked', String(b.dataset.v === c.espace)); });
    for (const [id, on] of [['#cf-voix', c.voix], ['#cf-sons', c.sons]]) { const b = $(id, el); if (!b) continue; b.classList.toggle('sel', on); b.setAttribute('aria-checked', String(on)); b.textContent = on ? '✔ Activée' : 'Désactivée'; }
    const s = $('#cf-sons', el); s.textContent = c.sons ? '🔊 Activés' : '🔇 Coupés';
    if ($('#cf-essai', el)) $('#cf-essai', el).hidden = !c.voix;
    appliquerConfort(joueur);
  };
  const changer = (cle, v) => { joueur = store.modifier((j) => { j.confort = { ...confortDe(j), [cle]: v }; }); majConfort(); };
  $$('.cf-taille', el).forEach((b) => b.onclick = () => changer('taille', b.dataset.v));
  $$('.cf-espace', el).forEach((b) => b.onclick = () => changer('espace', b.dataset.v));
  $('#cf-voix', el)?.addEventListener('click', () => { changer('voix', !confortDe(joueur).voix); if (!confortDe(joueur).voix) taire(); });
  $('#cf-sons', el).onclick = () => { changer('sons', !confortDe(joueur).sons); sons.juste(); };
  $('#cf-essai', el)?.addEventListener('click', () => parler('Bonjour ! Je lis les questions à voix haute. Léa achète 3 cahiers à 2,50 euros chacun. Combien paie-t-elle ?'));
  majConfort();
  $('#retour-accueil', el).onclick = () => { taire(); afficherAccueil(); };
  $('#changer', el).onclick = () => { store.deconnecter(); afficherConnexion(); };
  $('#r-parents', el).onclick = () => afficherParents(afficherReglages);
  $('#copier', el).onclick = async () => {
    const code = store.exporterJoueur(joueur);
    try { await navigator.clipboard.writeText(code); toast('Code copié ! 📋'); }
    catch { $('#copier', el).insertAdjacentHTML('afterend', `<textarea readonly style="margin-top:10px">${esc(code)}</textarea>`); }
  };
  let confirme = false;
  $('#supprimer', el).onclick = () => {
    if (!confirme) { confirme = true; $('#confirm-suppr', el).textContent = 'Toute ta progression sera effacée. Clique encore une fois pour confirmer.'; return; }
    store.supprimerJoueur(joueur.id); joueur = null; afficherConnexion();
  };
}


// ============================================================ Espace parents (Lot D)
// Verrou léger : le code (4 chiffres, stocké haché) évite que l'enfant change ses propres réglages.
// Ce n'est pas un coffre-fort : tout reste dans ce navigateur, rien n'est envoyé.
let parentsOuvert = false;

function afficherParents(retour) {
  const el = $('#ecran-parents');
  const reglages = store.reglagesParents();
  const quitter = () => { parentsOuvert = false; retour(); };
  if (!parentsOuvert) return ecranPin(el, reglages, () => { parentsOuvert = true; afficherParents(retour); }, quitter);

  const joueurs = store.listeJoueurs();
  const id = afficherParents.enfant && joueurs.some((j) => j.id === afficherParents.enfant) ? afficherParents.enfant : (joueur?.id ?? joueurs[0]?.id);
  const enfant = id ? store.joueurParId(id) : null;
  const onglets = joueurs.map((j) => `<button class="puce${j.id === id ? ' sel' : ''}" data-enfant="${j.id}">${emojiAvatar(j.avatar)} ${esc(j.pseudo)}</button>`).join('');
  const jRestants = Math.max(0, joursEntre(store.aujourdhui(), CEB.debut));

  el.innerHTML = `<div class="parents">
    <div class="p-barre no-print"><button class="btn" id="p-retour">← Retour</button>
      <div class="p-actions">${enfant ? '<button class="btn" id="p-imprimer">🖨️ Imprimer le bilan</button>' : ''}<button class="btn" id="p-verrou">🔒 Fermer</button></div></div>
    <header class="p-tete">
      <h1>👪 Espace parents</h1>
      <p class="mute">Tout reste sur cet appareil : aucun compte, aucune donnée envoyée.</p>
      <p class="print-only">Bilan du ${esc(dateLongue(store.aujourdhui()))}</p>
    </header>
    <section class="carte p-rebours">
      <div><small class="sur">CEB ${CEB.annee}</small><b>${jRestants ? `J − ${jRestants}` : 'C\'est parti !'}</b></div>
      <p>${jRestants ? `Encore <b>${jRestants} jours</b> (environ ${Math.floor(jRestants / 7)} semaines) avant le lundi 21 juin ${CEB.annee}.` : 'Le CEB a commencé ou est terminé.'} Épreuves le matin : ${CEB.jours.map((d) => `${d.jour} (${d.matiere.toLowerCase()})`).join(', ')}.</p>
    </section>
    ${joueurs.length > 1 ? `<div class="p-enfants no-print" role="tablist" aria-label="Enfant">${onglets}</div>` : ''}
    ${enfant ? blocsEnfant(enfant, reglages) : '<section class="carte"><p>Aucun joueur sur cet appareil pour l\'instant. Le bilan apparaîtra dès que votre enfant aura créé son joueur et joué une première partie.</p></section>'}
    ${blocComprendre()}
    <section class="carte no-print">
      <h2>🔑 Code parent</h2>
      <p class="mute">Changez le code à 4 chiffres qui protège cet espace.</p>
      <div class="p-pin-ligne"><input class="champ" id="p-nouveau-pin" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="Nouveau code"><button class="btn" id="p-changer-pin">Changer</button></div>
      <p class="erreur" id="p-err-pin"></p>
    </section>
  </div>`;
  montrer('ecran-parents');

  $('#p-retour', el).onclick = quitter;
  $('#p-verrou', el).onclick = quitter;
  $('#p-imprimer', el)?.addEventListener('click', () => window.print());
  $$('[data-enfant]', el).forEach((b) => b.onclick = () => { afficherParents.enfant = b.dataset.enfant; afficherParents(retour); });
  $('#p-changer-pin', el).onclick = () => {
    const v = $('#p-nouveau-pin', el).value.trim();
    if (!pinValide(v)) { $('#p-err-pin', el).textContent = 'Le code doit contenir exactement 4 chiffres.'; return; }
    store.modifierParents((p) => { p.pinHash = hashPin(v); });
    $('#p-nouveau-pin', el).value = ''; $('#p-err-pin', el).textContent = '';
    toast('Nouveau code enregistré 🔑');
  };
  if (enfant) {
    $('#p-limite', el).onchange = (e) => {
      const v = e.target.value === '' ? null : Number(e.target.value);
      store.modifierParents((p) => { p.limites[enfant.id] = v; });
      afficherParents(retour);
    };
    $$('[data-bonus]', el).forEach((b) => b.onclick = () => {
      store.modifierParents((p) => {
        const jour = store.aujourdhui();
        const actuel = p.bonus[enfant.id]?.[jour] ?? 0;
        p.bonus[enfant.id] = { [jour]: b.dataset.bonus === 'illimite' ? 'illimite' : (actuel === 'illimite' ? 0 : actuel) + Number(b.dataset.bonus) };
      });
      toast('Temps ajouté pour aujourd\'hui ⏳');
      afficherParents(retour);
    });
    $('#p-plan-tout', el)?.addEventListener('click', (e) => { $('#p-plan-suite', el).hidden = false; e.target.remove(); });
  }
}

function ecranPin(el, reglages, ok, annuler) {
  const creation = !reglages.pinHash;
  el.innerHTML = `<div class="parents parents-pin"><section class="carte">
    <h1>👪 Espace parents</h1>
    ${creation ? `<p>Choisissez un <b>code à 4 chiffres</b> que votre enfant ne connaît pas. Il protège le bilan, la limite de temps d'écran et les réglages.</p>
      <label class="etape-titre" for="pin1">Code</label><input class="champ pin" id="pin1" type="password" inputmode="numeric" maxlength="4" autocomplete="off">
      <label class="etape-titre" for="pin2">Confirmez le code</label><input class="champ pin" id="pin2" type="password" inputmode="numeric" maxlength="4" autocomplete="off">`
      : `<p>Entrez le code parent.</p><input class="champ pin" id="pin1" type="password" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="Code parent">`}
    <p class="erreur" id="err-pin"></p>
    <div class="p-pin-actions"><button class="btn" id="pin-annuler">← Retour</button><button class="btn btn-cta" id="pin-ok">${creation ? 'Créer le code' : 'Entrer'}</button></div>
    <p class="mute p-note">C'est un verrou simple : il évite que l'enfant modifie ses propres réglages, mais tout reste enregistré dans ce navigateur. ${creation ? '' : 'Code oublié ? Supprimez les données du site dans le navigateur (la progression sera aussi effacée), ou utilisez d\'abord le code de sauvegarde de chaque joueur.'}</p>
  </section></div>`;
  montrer('ecran-parents');
  const valider = () => {
    const a = $('#pin1', el).value.trim();
    const err = $('#err-pin', el);
    if (creation) {
      const b = $('#pin2', el).value.trim();
      if (!pinValide(a)) return err.textContent = 'Le code doit contenir exactement 4 chiffres.';
      if (a !== b) return err.textContent = 'Les deux codes ne sont pas identiques.';
      store.modifierParents((p) => { p.pinHash = hashPin(a); });
      return ok();
    }
    if (!verifierPin(reglages, a)) { err.textContent = 'Code incorrect.'; $('#pin1', el).value = ''; return; }
    ok();
  };
  $('#pin-ok', el).onclick = valider;
  $('#pin-annuler', el).onclick = annuler;
  $$('.pin', el).forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') valider(); }));
  $('#pin1', el).focus();
}

const NOMS_MAT = { fr: 'Français', ma: 'Maths', hg: 'Histoire-géo', sc: 'Sciences' };

function blocsEnfant(j, reglages) {
  const b = bilanSemaine(j);
  const maxQ = Math.max(10, ...b.jours.map((x) => x.questions));
  const evol = b.questions - b.semainePrecedente;
  const faibles = faiblesses(j, donnees.fiches, 5);
  const ind = indicateurCEB(j);
  const plan = planRevision(j, donnees.fiches);
  const temps = etatTemps(j, reglages);
  const limite = reglages.limites?.[j.id] ?? null;
  const pct = (x) => (x.posees ? Math.round((x.bonnes / x.posees) * 100) : 0);
  const statutPlan = { fragile: '🟠', progres: '🟡', decouverte: '🆕' };
  const semaine = (s, i) => `<li><b>${i === 0 ? 'Cette semaine' : `Semaine du ${new Date(s.debut + 'T12:00:00').toLocaleDateString('fr-BE', { day: 'numeric', month: 'long' })}`}</b>
    <span>${s.notions.map((n) => `<span class="p-notion" title="${esc(STATUTS[n.statut]?.nom ?? '')}">${statutPlan[n.statut] ?? ''} ${esc(n.titre)}</span>`).join('')}
      <a class="p-fiche-sem no-print" href="imprimer.html?mode=fiche&joueur=${encodeURIComponent(j.id)}&notions=${s.notions.slice(0, 4).map((n) => n.id).join(',')}">🖨️ fiche</a></span></li>`;

  return `
  <h2 class="p-enfant-titre">${ava(j, 40)} ${esc(j.pseudo)}</h2>

  <section class="carte">
    <h2>📅 Les 7 derniers jours</h2>
    <div class="p-kpis">
      <div><b>${b.questions}</b><small>questions${b.semainePrecedente || b.questions ? ` · ${evol >= 0 ? '+' : '−'}${Math.abs(evol)} vs semaine d'avant` : ''}</small></div>
      <div><b>${b.questions ? b.pourcentage + ' %' : '—'}</b><small>de bonnes réponses</small></div>
      <div><b>${b.minutes} min</b><small>de jeu</small></div>
      <div><b>${b.joursActifs} / 7</b><small>jours actifs</small></div>
    </div>
    <div class="p-graph" role="img" aria-label="Questions par jour sur les 7 derniers jours : ${b.jours.map((x) => `${jourCourt(x.jour)} ${x.questions}`).join(', ')}">
      ${b.jours.map((x) => `<div class="p-col" title="${esc(dateLongue(x.jour))} : ${x.questions} questions, ${x.bonnes} bonnes${x.secondes ? `, ${Math.round(x.secondes / 60)} min` : ''}">
        <span class="p-val">${x.questions || ''}</span>
        <div class="p-barre-v"><i style="height:${Math.round((x.questions / maxQ) * 100)}%"></i></div>
        <small>${jourCourt(x.jour)}</small><small class="p-pct">${x.questions ? Math.round((x.bonnes / x.questions) * 100) + ' %' : ''}</small></div>`).join('')}
    </div>
    <p class="mute p-legende">Barres : questions répondues par jour. En dessous : pourcentage de bonnes réponses.</p>
    ${Object.keys(b.parMatiere).length ? `<table class="p-table"><thead><tr><th>Matière (cette semaine)</th><th>Questions</th><th>Réussite</th></tr></thead><tbody>
      ${Object.entries(b.parMatiere).map(([m, v]) => `<tr><td>${NOMS_MAT[m] ?? m}</td><td>${v.posees}</td><td>${pct(v)} %</td></tr>`).join('')}</tbody></table>` : ''}
    ${b.examens.length ? `<p>📝 Examen${b.examens.length > 1 ? 's' : ''} blanc${b.examens.length > 1 ? 's' : ''} cette semaine : ${b.examens.map((e) => `<b>${e.pourcentage} %</b> (${e.questions} questions)`).join(', ')}.</p>` : ''}
  </section>

  <section class="carte">
    <h2>🎯 Par rapport au CEB</h2>
    <p class="mute">Pour réussir le CEB ${CEB.annee}, il faut au moins <b>${CEB.seuilMatiere} % dans chaque matière</b> et <b>${CEB.seuilMoyenne} % de moyenne</b>. Voici le taux de bonnes réponses de ${esc(j.pseudo)} depuis le début (indicatif : ce n'est pas une note du CEB).</p>
    <div class="p-seuils">${ind.lignes.map((l) => `<div class="p-seuil">
      <span class="nom">${l.nom}</span>
      <div class="p-jauge" title="${l.pct ?? 0} %"><i style="width:${l.pct ?? 0}%"></i><span class="p-trait" style="left:${CEB.seuilMatiere}%"></span></div>
      <b>${l.pct == null ? '—' : l.pct + ' %'}</b>
      <span class="etat">${!l.assez ? `⏳ pas assez de questions (${l.posees})` : l.ok ? '✅ au-dessus de 50 %' : '⚠️ sous 50 %'}</span></div>`).join('')}</div>
    <p>${ind.complet ? `Moyenne : <b>${ind.moyenne} %</b> ${ind.ok ? '✅ au-dessus des seuils' : ind.moyenne >= CEB.seuilMoyenne ? '⚠️ une matière reste sous 50 %' : '⚠️ sous les 60 %'}` : 'La moyenne s\'affichera quand chaque matière aura au moins 20 questions.'}</p>
  </section>

  <section class="carte">
    <h2>🔎 Points faibles</h2>
    ${!coachPret(j) ? `<p>Pas encore assez de réponses pour repérer les points faibles (il en faut une dizaine).</p>`
      : faibles.length ? `<ul class="p-faibles">${faibles.map((x) => `<li><span>${x.fiche.e} ${esc(x.fiche.titre)}</span><div class="p-jauge"><i style="width:${Math.round(x.m * 100)}%"></i></div><b>${Math.round(x.m * 100)} %</b></li>`).join('')}</ul>
        <p class="no-print"><a class="btn btn-cta" href="imprimer.html?mode=fiche&joueur=${encodeURIComponent(j.id)}">🖨️ Imprimer une fiche sur ces points faibles</a></p>`
      : '<p>Aucun point faible repéré pour l\'instant 👏</p>'}
    <p class="mute">${plan.maitrisees} notion${plan.maitrisees > 1 ? 's' : ''} maîtrisée${plan.maitrisees > 1 ? 's' : ''} sur ${plan.total}.</p>
  </section>

  <section class="carte">
    <h2>🗓️ Plan de révision jusqu'au CEB</h2>
    ${plan.joursRestants ? `<p>${plan.aTravailler} notion${plan.aTravailler > 1 ? 's' : ''} à travailler, environ <b>${plan.parSemaine} par semaine</b>. Rythme conseillé : <b>${plan.questionsParJour} questions par jour</b>, 5 jours par semaine (les missions ciblées du coach visent d'abord les notions fragiles ; chaque semaine a aussi sa fiche à imprimer).</p>
    <ol class="p-plan">${plan.planning.slice(0, 4).map(semaine).join('')}</ol>
    ${plan.planning.length > 4 ? `<button class="lien no-print" id="p-plan-tout">Voir tout le plan (${plan.planning.length} semaines)</button><ol class="p-plan" id="p-plan-suite" start="5" hidden>${plan.planning.slice(4).map((s2, i) => semaine(s2, i + 4)).join('')}</ol>` : ''}
    ${plan.debutExamens ? `<p>🏁 À partir du <b>${new Date(plan.debutExamens + 'T12:00:00').toLocaleDateString('fr-BE', { day: 'numeric', month: 'long' })}</b> : un examen blanc complet par semaine (à l'écran ou sur papier), puis révision des erreurs.</p>` : ''}`
      : '<p>Le CEB est commencé ou passé : plus de plan à proposer.</p>'}
  </section>

  <section class="carte no-print">
    <h2>⏳ Temps d'écran</h2>
    <p>Aujourd'hui : <b>${temps.minutes} min</b> de jeu${temps.limite != null ? ` sur ${temps.limite} min autorisées` : ''}.</p>
    <label class="p-limite">Limite par jour pour ${esc(j.pseudo)}
      <select class="champ" id="p-limite">${LIMITES.map((m) => `<option value="${m ?? ''}" ${m === limite ? 'selected' : ''}>${m == null ? 'Pas de limite' : `${m} minutes`}</option>`).join('')}</select></label>
    <p class="mute">Quand la limite est atteinte, la partie en cours se termine normalement, puis le jeu propose une pause jusqu'au lendemain. Les examens papier restent possibles.</p>
    ${limite != null ? `<div class="p-bonus"><span>Aujourd'hui seulement :</span><button class="btn petit" data-bonus="15">+15 min</button><button class="btn petit" data-bonus="30">+30 min</button><button class="btn petit" data-bonus="illimite">Sans limite</button></div>` : ''}
  </section>`;
}

function blocComprendre() {
  return `<section class="carte p-comprendre">
    <h2>📘 Comprendre le CEB</h2>
    <details open><summary>C'est quoi, le CEB ?</summary>
      <p>Le <b>Certificat d'Études de Base</b> est l'épreuve externe commune que passent tous les élèves de 6e primaire en Fédération Wallonie-Bruxelles. Il clôture l'enseignement primaire. Les questions sont les mêmes pour toutes les écoles.</p></details>
    <details><summary>Quand et quelles matières ?</summary>
      <ul>${CEB.jours.map((d) => `<li><b>${d.jour} ${CEB.annee}</b> : ${d.matiere}</li>`).join('')}</ul>
      <p>Les épreuves ont lieu le matin. Depuis 2026, les élèves suivent les nouveaux référentiels du <b>tronc commun</b> : le CEB ${CEB.annee} évalue ces attendus.</p></details>
    <details><summary>Comment le réussir ?</summary>
      <p>Il faut au moins <b>50 % dans chaque matière</b> (français, mathématiques, sciences, formation historique et géographique) <b>et</b> au moins <b>60 % de moyenne</b> sur l'ensemble. Ce seuil a été relevé par un décret du 19 mars 2026. En cas d'échec à l'épreuve, le jury de l'école peut encore accorder le CEB en tenant compte du dossier de l'élève. Depuis la rentrée 2026, un élève sans CEB entre quand même en 1re secondaire, avec un accompagnement renforcé.</p></details>
    <details><summary>Comment Mission CEB aide votre enfant</summary>
      <ul>
        <li><b>Vraies questions</b> des CEB 2015 à 2026, en examen blanc ou mélangées à l'entraînement.</li>
        <li><b>Questions générées à l'infini</b>, sans jamais répéter une question dans une même partie.</li>
        <li><b>Coach</b> : il repère les notions fragiles, les fait revenir (révision espacée) et propose des missions ciblées.</li>
        <li><b>Papier</b> : examens blancs et fiches ciblées à imprimer, avec corrigé séparé et questions de tracé.</li>
      </ul>
      <p class="mute">Les réponses des examens officiels ont été établies par l'équipe Mission CEB (les corrigés officiels n'étaient pas disponibles) : en cas de doute, fiez-vous au corrigé de l'école. Une erreur ? Le lien « ⚑ Signaler une erreur » (après chaque réponse et dans les fiches) prépare un e-mail à <b>${ADRESSE_SIGNALEMENT}</b>.</p></details>
    <p class="mute p-sources">Sources : <a href="https://ligue-enseignement.be/education-enseignement/articles/breves/ceb-ce1d-et-cess-de-juin-2027-les-dates-et-infos-pratiques-des-epreuves" target="_blank" rel="noopener">Ligue de l'Enseignement</a> · <a href="https://exercices-ceb.be/ceb-2027" target="_blank" rel="noopener">exercices-ceb.be</a> · <a href="https://www.bruxelles-j.be/etudier-se-former/enseignement-secondaire/le-ceb-le-certificat-detude-de-base/" target="_blank" rel="noopener">Bruxelles-J</a> · <a href="https://www.enseignement.be" target="_blank" rel="noopener">enseignement.be</a></p>
  </section>`;
}

// Accès pour les tests automatiques uniquement (?debug dans l'adresse).
if (new URLSearchParams(location.search).has('debug')) window.__mission = { get partie() { return partie; } };

demarrer();
