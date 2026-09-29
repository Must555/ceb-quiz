// Mission CEB — application (écrans : connexion, accueil, quiz, résultat, réglages).
import { chargerDonnees, QuizSession, estJouable } from '../engine/index.js';
import * as store from './store.js';
import { niveau, serieActuelle, jourDe, DEFIS, BADGES, enregistrerSession } from './progression.js';
import { rendreSaisie, brancher, esc } from './question-ui.js';
import { STATUTS, carteNotions, faiblesses, revisionsDues, coachPret, poidsCoach, maitrise } from './coach.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const racine = document.documentElement;

const AVATARS = ['🦊', '🐺', '🐯', '🦁', '🐼', '🐨', '🐸', '🐙', '🦈', '🐲', '🦅', '🦄', '🤖', '👾', '🧑‍🚀', '🥷'];
const COULEURS = ['#ffcf99', '#a7f3d0', '#bfdbfe', '#f5d0fe', '#fecaca', '#fde68a'];
const MATIERES = [
  { id: 'fr', e: '📖', nom: 'Français', sous: 'Lire, grammaire, conjugaison' },
  { id: 'ma', e: '📐', nom: 'Maths', sous: 'Nombres, grandeurs, géométrie' },
  { id: 'hg', e: '🌍', nom: 'Histoire-Géo', sous: 'Repères, cartes, Belgique' },
  { id: 'sc', e: '🧪', nom: 'Sciences', sous: 'Vivant, matière, énergie' },
  { id: '', e: '🔀', nom: 'Mix', sous: 'Toutes les matières' },
];
const BRAVO = ['Bien joué !', 'Excellent !', 'Parfait !', 'Trop fort !', 'Exactement !', 'Bravo !', 'Yes !'];
const OUPS = ['Pas tout à fait…', 'Presque !', 'Oups !', 'Pas grave, on apprend !', 'Raté cette fois'];

let donnees = null;
let joueur = null;
const choix = { mode: 'entrainement', matiere: '', examen: null, examenChrono: false, livret: null, cible: null };
const cacheExamens = {};
async function examenCharge(id) { return (cacheExamens[id] ??= donnees.chargerExamen(id)); }
// Questions jouables à l'écran d'un examen, éventuellement pour un seul livret.
const jouables = (ex, livret = null) => ex.questions.filter((q) => q.numerisable !== false && estJouable(q) && (livret == null || q.livret === livret));
const NOM_MAT = { fr: 'Français', ma: 'Maths', hg: 'Histoire-géo', sc: 'Sciences' };
let partie = null; // { session, modeJeu, ui, timer, config }

// ============================================================ Démarrage
async function demarrer() {
  appliquerTheme(store.joueurActif()?.theme ?? 'neon');
  try {
    donnees = await chargerDonnees({ base: 'data/' });
    // Les vraies questions du CEB rejoignent aussi l'entraînement (avec leurs documents).
    donnees.banque.push(...await donnees.questionsExamens().catch(() => []));
  } catch (e) {
    document.body.innerHTML = `<p style="padding:24px">Impossible de charger les questions. Vérifie ta connexion et recharge la page.</p>`;
    throw e;
  }
  choix.examen = donnees.examens.findLast((e) => e.statut !== 'a_encoder')?.id ?? null;
  joueur = store.joueurActif();
  joueur ? afficherAccueil() : afficherConnexion();
}

function appliquerTheme(t) { racine.dataset.theme = t; }
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
  const cols = ['#c6ff3d', '#3dffb5', '#7c3aed', '#ffd23f', '#ff5c8a', '#4d7cff'];
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
const ava = (j, taille = 44) => `<span class="pastille-ava" style="width:${taille}px;height:${taille}px;font-size:${Math.round(taille * .56)}px;background:${j.couleur}">${j.avatar}</span>`;
const nomDomaine = (id) => donnees.catalogue.matieres.flatMap((m) => m.domaines).find((d) => d.id === id)?.nom ?? id;

// ============================================================ Connexion
function afficherConnexion(forcerCreation = false) {
  const joueurs = store.listeJoueurs();
  const el = $('#ecran-connexion');
  const creation = forcerCreation || joueurs.length === 0;
  const nouveau = { avatar: AVATARS[0], couleur: COULEURS[0], theme: racine.dataset.theme || 'neon' };

  el.innerHTML = `<div class="connexion"><div class="connexion-boite">
    <div class="marque"><span class="pastille">🚀</span><div>Mission CEB<small>RÉUSSIS TON CEB EN JOUANT</small></div></div>
    ${!creation ? `
      <section class="carte">
        <h1 style="margin-bottom:12px">Qui joue ? 👋</h1>
        <div class="joueurs">${joueurs.map((j) => `
          <button class="joueur-ligne" data-id="${j.id}">${ava(j, 48)}
            <div><b>${esc(j.pseudo)}</b><small>Niveau ${niveau(j.xp).n} · ${j.xp} XP</small></div><span class="fleche">›</span></button>`).join('')}
        </div>
        <p style="margin-top:14px"><button class="btn" id="nouveau-joueur" style="width:100%">➕ Nouveau joueur</button></p>
      </section>
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
        <div class="grille-avatars">${AVATARS.map((a, i) => `<button data-a="${a}" class="${i === 0 ? 'sel' : ''}" aria-label="Avatar ${a}">${a}</button>`).join('')}</div>
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
  $$('.grille-avatars button', el).forEach((b) => b.onclick = () => { $$('.grille-avatars button', el).forEach((x) => x.classList.toggle('sel', x === b)); nouveau.avatar = b.dataset.a; majApercu(); });
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
  return `<div class="ambiances">${[['neon', 'Néon'], ['pop', 'Pop'], ['sunset', 'Sunset']].map(([id, nom]) =>
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
      <div class="marque"><span class="pastille">🚀</span><div>Mission CEB<small>SAISON 2027</small></div></div>
      <nav class="nav">
        <button class="actif"><span>🏠</span>Accueil</button>
        <button data-aller="progres"><span>📊</span>Progrès</button>
        <a class="nav-lien" href="imprimer.html"><span>🖨️</span>Examen papier</a>
        <button class="bientot" data-bientot><span>🏅</span>Collection</button>
        <button data-aller="reglages"><span>🎨</span>Mon style</button>
        <button data-aller="joueurs"><span>🔁</span>Joueurs</button>
      </nav>
      <div class="carte niveau">
        <b>⚡ Niveau ${nv.n} · ${nv.titre}</b>
        <p>Encore ${nv.fin - joueur.xp} XP pour le niveau ${nv.n + 1}</p>
        <div class="barre"><i style="width:${nv.pct}%"></i></div>
      </div>
    </aside>
    <main class="main">
      <header class="top">
        <div class="salut"><h1>Salut ${esc(joueur.pseudo)} 👋</h1><p>${phrase}</p></div>
        <div class="stats">
          <div class="stat"><span class="i">⭐</span><div><b>${joueur.xp.toLocaleString('fr-BE')}</b><small>XP</small></div></div>
          <div class="stat"><span class="i">🔥</span><div><b>${serie}</b><small>jour${serie > 1 ? 's' : ''}</small></div></div>
          <div class="stat"><span class="i">🏅</span><div><b>${nbBadges}</b><small>badge${nbBadges > 1 ? 's' : ''}</small></div></div>
          <div class="stat"><span class="i">💎</span><div><b>${joueur.gemmes}</b><small>gemmes</small></div></div>
          <div class="stat stat-ava"><button data-aller="reglages" aria-label="Mon avatar">${ava(joueur, 42)}</button></div>
        </div>
      </header>

      <div class="col-gauche">
        <section class="carte hero">
          <div class="hero-visuel">${ava(joueur, 140).replace('pastille-ava', 'pastille-ava grand-ava')}<span class="niv-badge">NIV. ${nv.n}</span></div>
          <div>
            <small class="sur">Mission du jour</small>
            <h2>Objectif <span>CEB</span> 🎯</h2>
            <p>10 questions par jour, et le CEB n'aura plus de secret pour toi.</p>
            <div class="prog"><span>Aujourd'hui</span><div class="barre"><i style="width:${Math.min(100, jr.questions * 10)}%"></i></div><b>${Math.min(jr.questions, 10)}/10${jr.questions >= 10 ? ' ✔' : ''}</b></div>
          </div>
        </section>

        ${blocCoach()}

        <section class="carte">
          <h3 class="section-titre">🎮 Mode de jeu</h3>
          <div class="modes">
            <button class="mode m1" data-mode="entrainement"><span class="e">🎲</span><b>Entraînement</b><small>10 questions au hasard, jamais deux fois la même</small></button>
            <button class="mode m2" data-mode="defi" ${defiFait ? 'disabled' : ''}><span class="etiq">${defiFait ? 'Fait ✔' : '1× / jour'}</span><span class="e">🏆</span><b>Défi du jour</b><small>${defiFait ? 'Reviens demain pour un nouveau défi' : '10 questions de toutes les matières'}</small></button>
            <button class="mode m3" data-mode="examen" ${examensDispo.length ? '' : 'disabled'}><span class="e">📝</span><b>Examen blanc</b><small>Les vraies questions du CEB</small></button>
            <button class="mode m4" data-mode="chrono"><span class="etiq">3 min</span><span class="e">⏱️</span><b>Chrono</b><small>Un maximum de bonnes réponses</small></button>
          </div>
        </section>

        <section class="carte" id="bloc-matieres">
          <h3 class="section-titre">📚 Matière</h3>
          <div class="matieres">${MATIERES.map((m) => `
            <button class="matiere" data-mat="${m.id}"><span class="e">${m.e}</span><b>${m.nom}</b><small>${m.sous}</small><div class="mini"><i style="width:${pctMat(m.id)}%"></i></div></button>`).join('')}
          </div>
        </section>

        <section class="carte" id="bloc-examen" hidden>
          <h3 class="section-titre">📝 Quel examen ?</h3>
          <div class="options-examen" style="margin-bottom:12px">${donnees.examens.map((e) => `
            <button class="puce ex" data-ex="${e.id}" ${e.statut === 'a_encoder' ? 'disabled title="Bientôt disponible"' : ''}>${e.annee}${e.referentiel === 'tronc_commun' ? ' TC' : e.annee === 2026 ? ' SO' : ''}${e.statut === 'a_encoder' ? ' 🔒' : ''}</button>`).join('')}
          </div>
          <div class="options-examen">
            <button class="puce chr" data-chr="0">🧘 Sans chrono</button>
            <button class="puce chr" data-chr="1">⏱️ Chronométré</button>
          </div>
          <h3 class="section-titre" style="margin-top:16px">📚 Quel livret ?</h3>
          <div class="livrets" id="choix-livret"><p class="mute">Chargement…</p></div>
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
    <button class="actif"><span>🏠</span>Accueil</button>
    <button data-aller="progres"><span>📊</span>Progrès</button>
    <button data-aller="reglages"><span>🎨</span>Mon style</button>
    <button data-aller="joueurs"><span>🔁</span>Joueurs</button>
  </nav>`;
  montrer('ecran-accueil');

  const el = $('#ecran-accueil');
  const majChoix = () => {
    $$('.mode', el).forEach((b) => b.classList.toggle('sel', b.dataset.mode === choix.mode));
    $$('.matiere', el).forEach((b) => b.classList.toggle('sel', b.dataset.mat === choix.matiere));
    $$('.puce.ex', el).forEach((b) => b.classList.toggle('sel', b.dataset.ex === choix.examen));
    $$('.puce.chr', el).forEach((b) => b.classList.toggle('sel', (b.dataset.chr === '1') === choix.examenChrono));
    $('#bloc-examen', el).hidden = choix.mode !== 'examen';
    $('#bloc-matieres', el).hidden = choix.mode === 'examen' || choix.mode === 'defi';
    $('#lancer', el).textContent = { entrainement: 'Lancer la mission →', defi: 'Relever le défi 🏆', examen: 'Commencer l\'examen 📝', chrono: 'Top chrono ! ⏱️' }[choix.mode];
  };
  $$('.mode', el).forEach((b) => b.onclick = () => { choix.mode = b.dataset.mode; majChoix(); });
  $$('.matiere', el).forEach((b) => b.onclick = () => { choix.matiere = b.dataset.mat; majChoix(); });
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
  $$('.puce.chr', el).forEach((b) => b.onclick = () => { choix.examenChrono = b.dataset.chr === '1'; majChoix(); });
  $$('[data-aller="reglages"]', el).forEach((b) => b.onclick = afficherReglages);
  $$('[data-aller="joueurs"]', el).forEach((b) => b.onclick = () => { store.deconnecter(); afficherConnexion(); });
  $$('[data-bientot]', el).forEach((b) => b.onclick = () => toast('Arrive très bientôt ! 🛠️'));
  $$('[data-aller="progres"]', el).forEach((b) => b.onclick = afficherProgres);
  brancherCoach(el);
  $('#lancer', el).onclick = lancerPartie;
  majChoix();
}

// ============================================================ Partie
async function lancerPartie() {
  const modeJeu = choix.mode;
  let examen = null;
  const base = { banque: donnees.banque, modeles: donnees.modeles, historique: joueur.historique };
  let session;
  if (modeJeu === 'entrainement') {
    session = new QuizSession(base, { nbQuestions: 10, matieres: choix.matiere ? [choix.matiere] : null, poids: poidsCoach(joueur) });
  } else if (modeJeu === 'cible') {
    session = new QuizSession(base, { nbQuestions: 10, maxParModele: 5, poids: poidsCoach(joueur, { mode: 'cible', notion: choix.cible }) });
  } else if (modeJeu === 'chrono') {
    session = new QuizSession(base, { nbQuestions: 200, dureeSecondes: 180, matieres: choix.matiere ? [choix.matiere] : null, difficulteMax: 2 });
  } else if (modeJeu === 'defi') {
    // Même défi toute la journée pour ce joueur (graine = date + joueur), sans tenir compte de l'historique.
    session = new QuizSession({ ...base, historique: [] }, { nbQuestions: 10, seed: `${store.aujourdhui()}|${joueur.id}` });
  } else {
    examen = await examenCharge(choix.examen);
    session = new QuizSession({ examen }, { mode: 'examen', livrets: choix.livret ? [choix.livret] : null });
    if (choix.examenChrono) session.o.dureeSecondes = Math.max(120, session.o.nbQuestions * 90);
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
      <div class="puces-etat"><span class="serie-flamme" id="q-serie">🔥 0</span><span id="q-xp">⭐ 0 XP</span><span class="chrono" id="q-chrono" hidden></span></div>
      <section class="question" id="q-zone"></section>
    </div>
    <div class="pied-quiz" id="pied"><div class="retour" id="retour" hidden></div>
      <div class="in"><button class="btn" id="passer">Je ne sais pas</button><button class="btn btn-cta" id="valider" disabled>Valider</button></div></div>`;
  montrer('ecran-quiz');
  $('#quitter').onclick = () => terminerPartie(true);
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
}

function questionSuivante() {
  const q = partie.session.suivante();
  if (!q) return terminerPartie(false);
  partie.corrige = false;
  const docs = q.docsResolus ?? (q.documents ?? []).map((id) => partie.examen?.documents?.find((d) => d.id === id)).filter(Boolean);
  const origine = q.source === 'examen' ? `CEB ${q.annee ?? partie.examen?.annee}${q.referentiel === 'tronc_commun' ? ' (tronc commun)' : ''} · livret ${q.livret} · question ${q.numero}` : nomDomaine(q.domaine);
  $('#q-zone').innerHTML = `
    <p class="origine">${esc(origine)}</p>
    <h2>${esc(q.enonce)}</h2>
    ${docs.map((d, i) => `<button class="btn doc-btn" data-doc="${d.id}">📄 ${i === 0 ? 'Document' : 'Voir le document'} : ${esc(d.titre)}</button>
      <figure class="doc" id="doc-${d.id}" ${i === 0 ? '' : 'hidden'}><img src="${esc(d.fichier)}" alt="${esc(d.alt)}" loading="lazy"><figcaption>Portfolio, page ${d.page}</figcaption></figure>`).join('')}
    <div id="q-saisie">${rendreSaisie(q)}</div>`;
  $$('.doc-btn').forEach((b) => b.onclick = () => { const f = $(`#doc-${b.dataset.doc}`); f.hidden = !f.hidden; });
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
  const pied = $('#pied');
  pied.className = `pied-quiz ${ok ? 'juste' : ouverte ? 'ouvert' : 'faux'}`;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const titre = ok ? `${pick(BRAVO)} ${r.serie >= 3 ? `🔥 ${r.serie} d'affilée` : '✅'}` : passer ? 'Voici la réponse 👇' : ouverte ? '✍️ Compare avec la réponse modèle' : partielle ? `En partie juste (${r.detail})` : pick(OUPS);
  const montrerBonne = !ok && !['qcm', 'vrai_faux', 'qcm_multi', 'grille'].includes(q.type);
  $('#retour').innerHTML = `${r.xpGagne ? `<span class="xp-gagne">+${r.xpGagne} XP</span>` : ''}<b>${titre}</b>
    ${r.remarque && !ok && !passer && !ouverte ? `<p>${esc(r.remarque)}</p>` : ''}
    ${montrerBonne ? `<p class="bonne">${q.type === 'ouverte' ? 'Réponse modèle' : 'Réponse'} : ${esc(r.bonneReponse)}</p>` : ''}
    ${q.explication ? `<p>💡 ${esc(q.explication)}</p>` : ''}
    ${!ok && !ouverte && donnees.fiches[q.fiche] ? `<p><button class="btn btn-fiche" id="voir-regle">📘 Revoir la règle : ${esc(donnees.fiches[q.fiche].titre)}</button></p>` : ''}`;
  $('#retour').hidden = false;
  $('#voir-regle')?.addEventListener('click', () => ouvrirFiche(q.fiche));
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
    <div class="actions">
      <button class="btn btn-cta" id="rejouer">${partie.modeJeu === 'defi' ? 'Nouvelle mission' : partie.modeJeu === 'cible' ? 'Encore une mission ciblée' : 'Rejouer'} 🔁</button>
      <button class="btn" id="accueil">🏠 Accueil</button>
    </div>
  </div>`;
  montrer('ecran-resultat');
  if (pct >= 70 || res.nouveauxBadges.length || res.niveauApres > res.niveauAvant) setTimeout(() => confettis(), 200);
  $('#accueil').onclick = afficherAccueil;
  $('#rejouer').onclick = () => {
    if (partie.modeJeu === 'defi') choix.mode = 'entrainement';
    joueur = store.joueurActif();
    lancerPartie();
  };
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

function ouvrirFiche(id, { cta = null, onCta = null, titreHaut = 'Fiche Rappel' } = {}) {
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
    ${f.astuce ? `<div class="encart astuce"><b>💡 Astuce</b><p>${esc(f.astuce)}</p></div>` : ''}
    <div class="modal-actions">${cta ? `<button class="btn btn-cta" id="fiche-cta">${esc(cta)}</button>` : ''}<button class="btn" id="fiche-fermer">Fermer</button></div>
  </div>`;
  const fermer = () => { fond.remove(); document.removeEventListener('keydown', echap); };
  const echap = (e) => { if (e.key === 'Escape') fermer(); };
  document.addEventListener('keydown', echap);
  fond.addEventListener('click', (e) => { if (e.target === fond) fermer(); });
  document.body.append(fond);
  $('#fiche-fermer', fond).onclick = fermer;
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
      ${blocAmbiances(joueur.theme)}
    </section>
    <section class="carte">
      <div class="apercu-joueur" style="margin-bottom:14px">${ava(joueur, 64)}<div><b style="font-family:var(--titre);font-size:22px">${esc(joueur.pseudo)}</b><div class="mute">Niveau ${niveau(joueur.xp).n} · ${niveau(joueur.xp).titre}</div></div></div>
      <p class="etape-titre">Avatar</p>
      <div class="grille-avatars">${AVATARS.map((a) => `<button data-a="${a}" class="${a === joueur.avatar ? 'sel' : ''}">${a}</button>`).join('')}</div>
      <p class="etape-titre" style="margin-top:14px">Couleur de fond</p>
      <div class="couleurs">${COULEURS.map((c) => `<button data-c="${c}" class="${c === joueur.couleur ? 'sel' : ''}" style="background:${c}"></button>`).join('')}</div>
    </section>
    <section class="carte">
      <p class="etape-titre">🔑 Code de sauvegarde</p>
      <p class="mute" style="margin:0 0 10px;font-size:14px">Ta progression est gardée sur cet appareil. Pour la retrouver ailleurs, copie ce code et colle-le sur l'autre appareil (« J'ai un code de sauvegarde »).</p>
      <button class="btn" id="copier">📋 Copier mon code</button>
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
  $$('.grille-avatars button', el).forEach((b) => b.onclick = () => { $$('.grille-avatars button', el).forEach((x) => x.classList.toggle('sel', x === b)); joueur = store.modifier((j) => { j.avatar = b.dataset.a; }); rafraichirAva(); });
  $$('.couleurs button', el).forEach((b) => b.onclick = () => { $$('.couleurs button', el).forEach((x) => x.classList.toggle('sel', x === b)); joueur = store.modifier((j) => { j.couleur = b.dataset.c; }); rafraichirAva(); });
  $('#retour-accueil', el).onclick = afficherAccueil;
  $('#changer', el).onclick = () => { store.deconnecter(); afficherConnexion(); };
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

// Accès pour les tests automatiques uniquement (?debug dans l'adresse).
if (new URLSearchParams(location.search).has('debug')) window.__mission = { get partie() { return partie; } };

demarrer();
