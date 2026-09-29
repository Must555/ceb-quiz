// Page « Examen papier » : tirage, aperçu et impression de l'examen puis du corrigé.
import { chargerDonnees, bonneReponseLisible } from '../engine/index.js';
import { FORMATS, FICHE, composerExamen, composerFiche, nouveauCode, lireCode } from '../engine/papier.js';
import * as store from './store.js';
import { faiblesses, maitrise, coachPret, STATUTS } from './coach.js';
import { esc } from './question-ui.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const LETTRES = 'ABCDEFGHIJ';
const case_ = '<span class="case" aria-hidden="true"></span>';

let donnees = null;
let examen = null;
let vue = 'examen';
let notionsChoisies = []; // fiche ciblée
const MATIERES = { fr: '📖 Français', ma: '📐 Mathématiques', hg: '🌍 Histoire-géo', sc: '🧪 Sciences' };

// ------------------------------------------------------------------ rendu d'une question (examen)
function zoneReponse(q) {
  switch (q.type) {
    case 'qcm':
      return `<ul class="choix">${q.choix.map((c, i) => `<li>${case_}<b>${LETTRES[i]}.</b> ${esc(c)}</li>`).join('')}</ul>`;
    case 'qcm_multi':
      return `<p class="consigne">Coche toutes les bonnes réponses.</p><ul class="choix">${q.choix.map((c, i) => `<li>${case_}<b>${LETTRES[i]}.</b> ${esc(c)}</li>`).join('')}</ul>`;
    case 'vrai_faux':
      return `<p class="choix-ligne">${case_} Vrai &nbsp;&nbsp;&nbsp; ${case_} Faux</p>`;
    case 'numerique':
      return `<p class="ligne-rep">Réponse : <span class="pointilles"></span>${q.unite ? ` ${esc(q.unite)}` : ''}</p>`;
    case 'texte_court':
      return '<p class="ligne-rep">Réponse : <span class="pointilles long"></span></p>';
    case 'trous':
      return `<p class="trous">${esc(q.texte ?? '').replace(/\{\d+\}/g, '<span class="trou"></span>')}</p>`;
    case 'grille':
      return `<table class="grille"><thead><tr><th></th>${q.colonnes.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
        <tbody>${q.lignes.map((l) => `<tr><td>${esc(l)}</td>${q.colonnes.map(() => `<td class="c">${case_}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    case 'ordre':
      return `<p class="consigne">Numérote de 1 à ${q.elements.length} dans le bon ordre.</p><ul class="choix">${q.elements.map((e) => `<li><span class="case num"></span>${esc(e)}</li>`).join('')}</ul>`;
    case 'association':
      return `<p class="consigne">Écris la lettre qui convient dans chaque case.</p><div class="asso">
        <ul>${q.gauche.map((g, i) => `<li>${i + 1}. ${esc(g)} <span class="case num"></span></li>`).join('')}</ul>
        <ul>${q.droite.map((d, k) => `<li><b>${LETTRES[k]}.</b> ${esc(d)}</li>`).join('')}</ul></div>`;
    case 'ouverte':
      return '<div class="lignes"><span></span><span></span><span></span></div>';
    case 'trace':
      return `<div class="figure">${q.figure}</div>`;
    default:
      return '<div class="lignes"><span></span><span></span></div>';
  }
}

const origine = (q) => (q.source === 'examen'
  ? `CEB ${q.annee}${q.referentiel === 'tronc_commun' ? ' (tronc commun)' : ''} · livret ${q.livret} · question ${q.numero}`
  : '');

function documents(q, avecDocs) {
  const docs = q.docsResolus ?? [];
  if (!docs.length) return '';
  if (!avecDocs) return `<p class="doc-ref">📄 Document : portfolio du CEB ${q.annee}, page ${docs.map((d) => d.page).join(', ')}.</p>`;
  return docs.map((d) => `<figure class="doc"><img src="${esc(d.fichier)}" alt="${esc(d.alt)}"><figcaption>Portfolio du CEB ${q.annee}, page ${d.page} — ${esc(d.titre)}</figcaption></figure>`).join('');
}

function questionExamen(q, avecDocs, docsDejaImprimes) {
  // Un document partagé par plusieurs questions n'est imprimé qu'une fois.
  const nouveaux = (q.docsResolus ?? []).filter((d) => !docsDejaImprimes.has(d.fichier));
  nouveaux.forEach((d) => docsDejaImprimes.add(d.fichier));
  const dejaVu = (q.docsResolus ?? []).length && !nouveaux.length;
  const blocDocs = dejaVu ? `<p class="doc-ref">📄 Utilise le document de la question précédente (portfolio, page ${q.docsResolus.map((d) => d.page).join(', ')}).</p>`
    : documents({ ...q, docsResolus: nouveaux }, avecDocs);
  return `<article class="question${q.type === 'trace' ? ' q-trace' : ''}${nouveaux.length && avecDocs ? ' avec-doc' : ''}">
    <header><span class="num">${q.numeroPapier}</span><p class="enonce">${esc(q.enonce)}</p><span class="bareme">… / ${q.pointsPapier}</span></header>
    ${origine(q) ? `<p class="origine">${esc(origine(q))}</p>` : ''}
    ${blocDocs}
    ${zoneReponse(q)}
  </article>`;
}

// ------------------------------------------------------------------ rendu du corrigé
function reponseCorrige(q) {
  if (q.type === 'trace') return `<p>${esc(q.reponseTexte)}</p><div class="figure solution">${q.solution}</div>`;
  if (q.type === 'qcm') return `<p><b>${LETTRES[q.reponse]}.</b> ${esc(q.choix[q.reponse])}</p>`;
  if (q.type === 'qcm_multi') return `<p>${q.reponse.map((i) => `<b>${LETTRES[i]}.</b> ${esc(q.choix[i])}`).join(' · ')}</p>`;
  if (q.type === 'association') return `<p>${q.reponse.map(([g, d]) => `${g + 1} → <b>${LETTRES[d]}</b>`).join(' · ')}</p>`;
  if (q.type === 'trous') return `<p>${q.reponse.map((r, i) => `(${i + 1}) <b>${esc([].concat(r)[0])}</b>`).join(' · ')}</p>`;
  if (q.type === 'ordre') return `<p>${q.reponse.map((i, k) => `${k + 1}. ${esc(q.elements[i])}`).join('<br>')}</p>`;
  if (q.type === 'ouverte') return `<p><i>Réponse modèle :</i> ${esc(q.reponseModele ?? '')}</p>`;
  const autres = q.type === 'texte_court' && [].concat(q.reponse).length > 1 ? ` <span class="mute">(aussi accepté : ${[].concat(q.reponse).slice(1, 4).map(esc).join(', ')})</span>` : '';
  return `<p class="pre"><b>${esc(bonneReponseLisible(q))}</b>${autres}</p>`;
}

function questionCorrige(q) {
  const fiche = donnees.fiches[q.fiche];
  return `<article class="question corrige">
    <header><span class="num">${q.numeroPapier}</span><p class="enonce court">${esc(q.enonce)}</p><span class="bareme">${q.pointsPapier} pt${q.pointsPapier > 1 ? 's' : ''}</span></header>
    ${reponseCorrige(q)}
    ${q.explication ? `<p class="explication">💡 ${esc(q.explication)}</p>` : ''}
    ${fiche ? `<p class="fiche">À revoir en cas d'erreur : « ${esc(fiche.titre)} »</p>` : ''}
  </article>`;
}

// ------------------------------------------------------------------ page
function entete(titre, sousTitre) {
  return `<div class="entete">
    <div class="marque"><span class="pastille">🚀</span><div><b>Mission CEB</b><small>${esc(titre)}</small></div></div>
    <div class="code-bloc"><small>Code</small><b>${examen.code}</b></div>
  </div>
  <p class="sous-titre">${sousTitre}</p>`;
}

function blocRappel(f) {
  return `<div class="rappel"><b>📘 Rappel</b>
    <ul>${f.regle.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
    ${f.exemple ? `<p><b>Exemple :</b> ${esc(f.exemple)}</p>` : ''}
    ${f.astuce ? `<p>💡 ${esc(f.astuce)}</p>` : ''}</div>`;
}

function rendre() {
  const avecDocs = $('#opt-docs').checked;
  const docsImprimes = new Set();
  const fiche = examen.format === 'T';
  const titres = examen.sections.map((s) => s.rappel?.titre).filter(Boolean);
  const htmlExamen = `<section class="feuille" data-vue="examen">
    ${entete(fiche ? 'Fiche ciblée — je m\'entraîne' : `${examen.nom} — examen blanc`,
      fiche ? `${titres.map(esc).join(' · ')} — ${examen.nbQuestions} exercices · ${examen.duree}`
        : `${examen.nbQuestions} questions · ${examen.duree} · total sur ${examen.total} points`)}
    <div class="identite"><span>Prénom : <i></i></span><span>Date : <i></i></span><span class="score">Score : <i></i> / ${examen.total}</span></div>
    <p class="consignes">${fiche ? 'Lis d\'abord le rappel de chaque notion, puis fais les exercices. Ils vont du plus facile au plus difficile.'
      : 'Lis bien chaque question. Tu peux utiliser une latte, une équerre et un compas. Pas de calculatrice, sauf si la question le permet.'}</p>
    ${examen.sections.map((s) => `<h2 class="section">${esc(s.titre)} <span>… / ${s.total}</span></h2>
      ${s.rappel ? blocRappel(s.rappel) : ''}
      ${s.questions.map((q) => questionExamen(q, avecDocs, docsImprimes)).join('')}`).join('')}
    <p class="fin">${fiche ? 'Bravo, fiche terminée ! Vérifie tes réponses avec le corrigé. 🎯' : 'Fin de l\'examen. Relis tes réponses ! 🚀'}</p>
  </section>`;
  const htmlCorrige = `<section class="feuille" data-vue="corrige">
    ${entete(`${fiche ? 'Fiche ciblée' : examen.nom} — corrigé`, `Corrigé ${fiche ? 'de la fiche' : 'de l\'examen'} ${examen.code} · total sur ${examen.total} points · les réponses aux questions de tracé sont dessinées en rouge (réduites).`)}
    <p class="consignes">Pour les questions à plusieurs cases (tableaux, textes à trous, ordre…), on peut donner une partie des points pour chaque case juste.</p>
    ${examen.sections.map((s) => `<h2 class="section">${esc(s.titre)} <span>${s.total} points</span></h2>
      ${s.questions.map(questionCorrige).join('')}`).join('')}
  </section>`;
  $('#apercu').innerHTML = htmlExamen + htmlCorrige;
  montrerVue();
  const q = examen.sections.flatMap((s) => s.questions);
  const nbTraces = q.filter((x) => x.type === 'trace').length;
  const nbOff = q.filter((x) => x.source === 'examen').length;
  $('#infos').textContent = `${examen.nbQuestions} ${fiche ? 'exercices' : 'questions'} dont ${nbOff} tiré${nbOff > 1 ? 's' : ''} des vrais CEB et ${nbTraces} tracé${nbTraces > 1 ? 's' : ''}.`;
  $('#code').value = examen.code;
  $$('#formats button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.f === examen.format)));
  $('#panneau-fiche').hidden = !fiche;
  $('#imprimer-examen').textContent = `🖨️ Imprimer ${fiche ? 'la fiche' : 'l\'examen'}`;
  $('.onglet[data-vue="examen"]').textContent = `Aperçu ${fiche ? 'de la fiche' : 'de l\'examen'}`;
  document.title = `${fiche ? 'Fiche' : 'Examen'} ${examen.code} — Mission CEB`;
}

// Pied de page imprimé sur chaque feuille (boîtes de marge @page) : code + numéro de page.
function majPied() {
  if (!examen) return;
  const style = $('#style-pied') ?? document.head.appendChild(Object.assign(document.createElement('style'), { id: 'style-pied' }));
  const t = `Mission CEB · ${examen.nom}${vue === 'corrige' ? ' · CORRIGÉ' : ''} · code ${examen.code}`.replace(/"/g, '');
  style.textContent = `@page { @bottom-left { content: "${t}"; font: 9pt Inter, sans-serif; color: #5b6070; }
    @bottom-right { content: "page " counter(page) " / " counter(pages); font: 9pt Inter, sans-serif; color: #5b6070; } }`;
}

function montrerVue() {
  majPied();
  $$('.feuille').forEach((f) => { f.hidden = f.dataset.vue !== vue; });
  $$('.onglet').forEach((o) => o.classList.toggle('actif', o.dataset.vue === vue));
  document.body.dataset.vue = vue;
}

function erreur(msg) {
  const err = $('#erreur');
  err.textContent = msg ?? '';
  err.hidden = !msg;
}

function charger(code) {
  const c = lireCode(code);
  if (!c) return erreur('Ce code n\'existe pas. Il ressemble à « C-7KQ4M » : une lettre, un tiret et 5 caractères.');
  const url = new URL(location.href);
  if (c[0] === 'T') {
    if (!notionsChoisies.length) {
      montrerPanneauFiche();
      return erreur('Coche au moins une notion pour créer la fiche.');
    }
    examen = composerFiche(donnees, c, notionsChoisies);
    url.searchParams.set('notions', examen.notions.join(','));
  } else {
    examen = composerExamen(donnees, c);
    url.searchParams.delete('notions');
  }
  erreur(null);
  url.searchParams.set('code', c);
  url.searchParams.delete('mode');
  url.searchParams.delete('joueur');
  history.replaceState(null, '', url);
  rendre();
  if (c[0] === 'T') majNotions();
}

// ------------------------------------------------------------------ fiche ciblée : choix des notions
let joueurFiche = null;

function montrerPanneauFiche() {
  $('#panneau-fiche').hidden = false;
  $$('#formats button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.f === 'T')));
  majNotions();
}

function preselection() {
  if (!joueurFiche) return [];
  return faiblesses(joueurFiche, donnees.fiches, 3).map((x) => x.fiche.id);
}

function majBilan() {
  const b = $('#pf-bilan');
  if (!joueurFiche) { b.innerHTML = 'Aucun joueur sur cet appareil : choisis toi-même les notions à travailler.'; return; }
  const faibles = faiblesses(joueurFiche, donnees.fiches, 4);
  if (!coachPret(joueurFiche)) b.innerHTML = `<b>${esc(joueurFiche.pseudo)}</b> n'a pas encore assez joué pour que le coach repère ses points faibles. Choisis les notions toi-même.`;
  else if (!faibles.length) b.innerHTML = `Aucun point faible repéré pour <b>${esc(joueurFiche.pseudo)}</b>, bravo ! Choisis les notions que tu veux revoir.`;
  else b.innerHTML = `Points faibles repérés pour <b>${esc(joueurFiche.pseudo)}</b> : ${faibles.map((x) => `${x.fiche.e} ${esc(x.fiche.titre)} (${Math.round(x.m * 100)} %)`).join(' · ')}.`;
}

function majNotions() {
  const zone = $('#pf-notions');
  const fiches = Object.values(donnees.fiches);
  const statut = (id) => {
    if (!joueurFiche) return '';
    const m = maitrise(joueurFiche, id);
    return m.n ? `<span class="statut" title="${STATUTS[m.statut].nom}">${STATUTS[m.statut].e} ${Math.round(m.m * 100)} %</span>` : '';
  };
  zone.innerHTML = Object.entries(MATIERES).map(([mat, nom]) => {
    const liste = fiches.filter((f) => f.matiere === mat).sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));
    return liste.length ? `<h3>${nom}</h3>${liste.map((f) => `<label><input type="checkbox" value="${f.id}" ${notionsChoisies.includes(f.id) ? 'checked' : ''}> ${f.e ?? ''} ${esc(f.titre)} ${statut(f.id)}</label>`).join('')}` : '';
  }).join('');
  const maj = () => {
    const plein = notionsChoisies.length >= FICHE.maxNotions;
    $$('input', zone).forEach((i) => { i.disabled = plein && !i.checked; i.parentElement.classList.toggle('off', i.disabled); });
    $('#pf-compte').textContent = notionsChoisies.length
      ? `Cochées (${notionsChoisies.length}/4) : ${notionsChoisies.map((n) => donnees.fiches[n].titre).join(' · ')}` : 'Aucune notion cochée';
  };
  $$('input', zone).forEach((i) => i.onchange = () => {
    notionsChoisies = i.checked ? [...notionsChoisies, i.value] : notionsChoisies.filter((n) => n !== i.value);
    maj();
  });
  maj();
  majBilan();
}

function initFiche(notionsUrl, idJoueur) {
  const joueurs = store.listeJoueurs();
  joueurFiche = (idJoueur && store.joueurParId(idJoueur)) || store.joueurActif() || joueurs[0] || null;
  const sel = $('#pf-joueur');
  if (joueurs.length) {
    $('#pf-joueur-bloc').hidden = false;
    sel.innerHTML = joueurs.map((j) => `<option value="${j.id}" ${j.id === joueurFiche?.id ? 'selected' : ''}>${esc(j.avatar)} ${esc(j.pseudo)}</option>`).join('');
    sel.onchange = () => {
      joueurFiche = joueurs.find((j) => j.id === sel.value) ?? null;
      notionsChoisies = preselection();
      majNotions();
    };
  }
  notionsChoisies = notionsUrl.length ? notionsUrl : preselection();
  $('#pf-creer').onclick = () => charger(nouveauCode('T'));
}

async function imprimer(v) {
  vue = v;
  montrerVue();
  // On attend que les images du portfolio soient chargées avant d'ouvrir l'impression.
  const imgs = $$(`.feuille[data-vue="${v}"] img`);
  await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
  window.print();
}

async function demarrer() {
  $('#formats').innerHTML = [...Object.entries(FORMATS), ['T', FICHE]].map(([f, x]) =>
    `<button role="radio" data-f="${f}" aria-checked="false"${f === 'T' ? ' class="f-fiche"' : ''}><b>${f === 'T' ? '🎯 ' : ''}${esc(x.nom)}</b><small>${esc(x.description)} · ${esc(x.duree)}</small></button>`).join('');
  try {
    donnees = await chargerDonnees({ base: 'data/' });
    donnees.banque.push(...await donnees.questionsExamens().catch(() => []));
  } catch (e) {
    $('#apercu').innerHTML = '<p class="chargement">Impossible de charger les questions. Vérifie ta connexion et recharge la page.</p>';
    throw e;
  }
  const params = new URL(location.href).searchParams;
  initFiche((params.get('notions') ?? '').split(',').filter((n) => donnees.fiches[n]), params.get('joueur'));
  $$('#formats button').forEach((b) => b.onclick = () => {
    if (b.dataset.f === 'T') {
      // On montre d'abord le choix des notions ; la fiche est créée avec « Créer la fiche ».
      montrerPanneauFiche();
      if (notionsChoisies.length && examen?.format !== 'T') charger(nouveauCode('T'));
    } else charger(nouveauCode(b.dataset.f));
  });
  $('#nouveau').onclick = () => charger(nouveauCode(examen?.format ?? 'C'));
  $('#form-code').onsubmit = (e) => { e.preventDefault(); charger($('#code').value); };
  $('#opt-docs').onchange = rendre;
  $$('.onglet').forEach((o) => o.onclick = () => { vue = o.dataset.vue; montrerVue(); });
  $('#imprimer-examen').onclick = () => imprimer('examen');
  $('#imprimer-corrige').onclick = () => imprimer('corrige');
  const code = lireCode(params.get('code'));
  if (code) charger(code);
  else if (params.get('mode') === 'fiche') {
    if (notionsChoisies.length) charger(nouveauCode('T'));
    else { charger(nouveauCode('C')); montrerPanneauFiche(); }
  } else charger(nouveauCode('C'));
}

demarrer();
