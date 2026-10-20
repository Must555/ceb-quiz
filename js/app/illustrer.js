// Remplace à l'affichage les emojis restants par des icônes cohérentes avec le reste du site :
// pictogrammes Phosphor (signes d'interface, à la couleur du texte) ou icônes Fluent 3D (le reste).
// Un seul point d'entrée : un MutationObserver sur la page, qui traite tout ce qui s'affiche.
// Les champs de saisie, les listes déroulantes, le titre de la page et les impressions ne sont pas touchés.
import { FLUENT, PICTOS } from './emojis-dispo.js';

const EMO = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2})(?:️|‍\p{Extended_Pictographic}️?|[\u{1F3FB}-\u{1F3FF}])*/gu;
const IGNORER = 'option, select, textarea, input, script, style, title, svg, .pi, .emo, [data-emoji-brut]';

function remplacement(e) {
  if (PICTOS[e]) {
    const i = document.createElement('i');
    i.className = 'pi'; // Adresse absolue : une url() relative dans une variable CSS se résoudrait depuis css/app.css.
    i.style.setProperty('--pi', `url("${new URL(`assets/ui/pictos/${PICTOS[e]}.svg`, document.baseURI).href}")`);
    i.setAttribute('aria-hidden', 'true');
    return i;
  }
  if (FLUENT[e]) {
    const img = document.createElement('img');
    img.className = 'emo'; img.src = `assets/emoji/${FLUENT[e]}.webp`; img.alt = e; img.decoding = 'async'; img.draggable = false;
    img.onerror = () => img.replaceWith(document.createTextNode(e));
    return img;
  }
  return null;
}

function traiterTexte(t) {
  const s = t.nodeValue;
  EMO.lastIndex = 0;
  if (!EMO.test(s)) return;
  const p = t.parentElement;
  if (!p || p.closest(IGNORER)) return;
  EMO.lastIndex = 0;
  const frag = document.createDocumentFragment();
  let i = 0, m, change = false;
  while ((m = EMO.exec(s))) {
    const r = remplacement(m[0]);
    if (!r) continue;
    frag.append(s.slice(i, m.index), r);
    i = m.index + m[0].length; change = true;
  }
  if (!change) return;
  frag.append(s.slice(i));
  t.replaceWith(frag);
}

export function illustrer(racine) {
  if (racine.nodeType === Node.TEXT_NODE) return traiterTexte(racine);
  if (racine.nodeType !== Node.ELEMENT_NODE || racine.closest?.(IGNORER)) return;
  const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
  const liste = [];
  while (w.nextNode()) liste.push(w.currentNode);
  liste.forEach(traiterTexte);
}

export function observer(racine = document.body) {
  illustrer(racine);
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') traiterTexte(m.target);
      else m.addedNodes.forEach(illustrer);
    }
  }).observe(racine, { childList: true, subtree: true, characterData: true });
}
