// Affichage d'une question et lecture de la réponse de l'enfant, pour les 10 types.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LETTRES = 'ABCDEFGH';

// Renvoie le HTML de la zone de réponse.
export function rendreSaisie(q) {
  switch (q.type) {
    case 'qcm':
      return `<div class="choix">${q.choix.map((c, i) =>
        `<button class="rep" data-i="${i}"><span class="lettre">${LETTRES[i]}</span><span>${esc(c)}</span></button>`).join('')}</div>`;
    case 'vrai_faux':
      return `<div class="choix duo"><button class="rep" data-v="1"><span class="lettre">✔</span><span>Vrai</span></button><button class="rep" data-v="0"><span class="lettre">✘</span><span>Faux</span></button></div>`;
    case 'qcm_multi':
      return `<p class="consigne">Plusieurs réponses possibles</p><div class="choix">${q.choix.map((c, i) =>
        `<button class="rep multi" data-i="${i}"><span class="lettre">${LETTRES[i]}</span><span>${esc(c)}</span></button>`).join('')}</div>`;
    case 'numerique':
      return `<div class="saisie-ligne"><input class="champ" id="saisie" type="text" inputmode="decimal" autocomplete="off" placeholder="Ta réponse">${q.unite ? `<span class="unite">${esc(q.unite)}</span>` : ''}</div>`;
    case 'texte_court':
      return `<input class="champ" id="saisie" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Écris ta réponse">`;
    case 'trous': {
      let n = 0;
      return `<p class="texte-trous">${esc(q.texte).replace(/\{\d+\}/g, () => `<input class="champ trou" data-k="${n++}" type="text" autocomplete="off" spellcheck="false" aria-label="Case ${n}">`)}</p>`;
    }
    case 'grille':
      return `<div class="grille-rep">${q.lignes.map((l, i) => `
        <div class="grille-ligne"><p>${esc(l)}</p><div class="grille-opts">${q.colonnes.map((c, k) =>
          `<button class="opt" data-l="${i}" data-c="${k}">${esc(c)}</button>`).join('')}</div></div>`).join('')}</div>`;
    case 'ordre':
      return `<p class="consigne">Touche les éléments dans le bon ordre</p>
        <div class="ordre-rep">${q.elements.map((e, i) => `<button class="rep ordre" data-i="${i}"><span class="lettre"></span><span>${esc(e)}</span></button>`).join('')}</div>
        <button class="lien" id="ordre-reset" type="button">↺ Recommencer l'ordre</button>`;
    case 'association':
      return `<div class="asso">${q.gauche.map((g, i) => `
        <div class="asso-ligne"><p>${esc(g)}</p><select class="champ" data-i="${i}"><option value="">Choisir…</option>${q.droite.map((d, k) => `<option value="${k}">${esc(d)}</option>`).join('')}</select></div>`).join('')}</div>`;
    default:
      return '<p class="consigne">Ce type de question se fait sur papier.</p>';
  }
}

// Branche les interactions. `onPret(bool)` indique si une réponse est donnée ; `onValider()` pour la touche Entrée.
export function brancher(zone, q, { onPret, onValider }) {
  const etat = { reponse: null, ordre: [], grille: [] };
  const reps = [...zone.querySelectorAll('.rep')];

  if (q.type === 'qcm' || q.type === 'vrai_faux') {
    reps.forEach((b) => b.onclick = () => {
      reps.forEach((x) => x.classList.toggle('sel', x === b));
      etat.reponse = q.type === 'vrai_faux' ? b.dataset.v === '1' : +b.dataset.i;
      onPret(true);
    });
  }
  if (q.type === 'qcm_multi') {
    reps.forEach((b) => b.onclick = () => { b.classList.toggle('sel'); onPret(zone.querySelector('.rep.sel') != null); });
  }
  if (q.type === 'ordre') {
    const maj = () => {
      reps.forEach((b) => { const r = etat.ordre.indexOf(+b.dataset.i); b.classList.toggle('sel', r >= 0); b.querySelector('.lettre').textContent = r >= 0 ? r + 1 : ''; });
      onPret(etat.ordre.length === q.elements.length);
    };
    reps.forEach((b) => b.onclick = () => { const i = +b.dataset.i; if (!etat.ordre.includes(i)) etat.ordre.push(i); maj(); });
    zone.querySelector('#ordre-reset').onclick = () => { etat.ordre = []; maj(); };
  }
  if (q.type === 'grille') {
    const opts = [...zone.querySelectorAll('.opt')];
    opts.forEach((o) => o.onclick = () => {
      const l = +o.dataset.l;
      opts.filter((x) => +x.dataset.l === l).forEach((x) => x.classList.toggle('sel', x === o));
      etat.grille[l] = +o.dataset.c;
      onPret(q.lignes.every((_, i) => etat.grille[i] != null));
    });
  }
  const champs = [...zone.querySelectorAll('input.champ, select.champ')];
  champs.forEach((c) => {
    c.addEventListener('input', () => onPret(champs.every((x) => x.value.trim() !== '') || (q.type === 'association' && champs.some((x) => x.value !== ''))));
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); onValider(); } });
  });
  if (champs[0] && matchMedia('(pointer:fine)').matches) champs[0].focus();

  return {
    lire() {
      switch (q.type) {
        case 'qcm': case 'vrai_faux': return etat.reponse;
        case 'qcm_multi': return [...zone.querySelectorAll('.rep.sel')].map((b) => +b.dataset.i);
        case 'numerique': case 'texte_court': return zone.querySelector('#saisie').value;
        case 'trous': return [...zone.querySelectorAll('.trou')].map((x) => x.value);
        case 'grille': return q.lignes.map((_, i) => etat.grille[i] ?? null);
        case 'ordre': return etat.ordre;
        case 'association': return [...zone.querySelectorAll('select')].filter((s) => s.value !== '').map((s) => [+s.dataset.i, +s.value]);
        default: return null;
      }
    },
    // Après correction : colore les bonnes / mauvaises réponses et bloque la saisie.
    montrerCorrection() {
      zone.querySelectorAll('button, input, select').forEach((el) => { el.disabled = true; });
      if (q.type === 'qcm') reps.forEach((b) => b.classList.add(+b.dataset.i === q.reponse ? 'juste' : b.classList.contains('sel') ? 'faux' : 'eteint'));
      if (q.type === 'vrai_faux') reps.forEach((b) => b.classList.add((b.dataset.v === '1') === q.reponse ? 'juste' : b.classList.contains('sel') ? 'faux' : 'eteint'));
      if (q.type === 'qcm_multi') reps.forEach((b) => b.classList.add(q.reponse.includes(+b.dataset.i) ? 'juste' : b.classList.contains('sel') ? 'faux' : 'eteint'));
      if (q.type === 'grille') zone.querySelectorAll('.opt').forEach((o) => {
        const ok = q.reponse[+o.dataset.l] === +o.dataset.c;
        o.classList.add(ok ? 'juste' : o.classList.contains('sel') ? 'faux' : 'eteint');
      });
    },
  };
}
