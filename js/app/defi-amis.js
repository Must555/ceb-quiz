// Défi entre amis, sans serveur : le lien contient la graine du tirage, la matière et le score à battre.
// Même graine + mêmes données du site = mêmes 10 questions pour les deux enfants.
// Rien d'autre ne voyage dans le lien que le pseudo (inventé) et le score.

import { hashString } from '../engine/random.js';

export const NB_QUESTIONS_DEFI = 10;
const MATIERES_OK = ['', 'fr', 'ma', 'hg', 'sc'];

// Empreinte des données (questions et familles) : si le site a changé entre-temps, les questions peuvent différer.
export const empreinteDonnees = (banque, modeles) => hashString([...banque.map((q) => q.id), '|', ...modeles.map((m) => m.id)].join(',')).toString(36).slice(0, 6);

const b64 = (txt) => btoa(String.fromCharCode(...new TextEncoder().encode(txt))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deb64 = (code) => new TextDecoder().decode(Uint8Array.from(atob(code.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

export function nouvelleGraine(rng = Math.random) {
  const a = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => a[Math.floor(rng() * a.length)]).join('');
}

// { graine, matiere, pseudo, bonnes, total, secondes, empreinte } → code court pour l'URL.
export function encoderDefi(d) {
  return b64(JSON.stringify({ v: 1, s: d.graine, m: d.matiere ?? '', p: String(d.pseudo ?? '').slice(0, 16), b: d.bonnes, t: d.total, d: d.secondes, h: d.empreinte }));
}

// Renvoie le défi ou null si le code est abîmé.
export function decoderDefi(code) {
  try {
    const o = JSON.parse(deb64(String(code ?? '').trim()));
    if (o?.v !== 1 || !/^[a-z0-9]{6,12}$/.test(o.s) || !MATIERES_OK.includes(o.m ?? '')) return null;
    const entier = (x, max) => (Number.isInteger(x) && x >= 0 && x <= max ? x : null);
    const total = entier(o.t, 50), bonnes = entier(o.b, 50);
    if (total == null || bonnes == null || bonnes > total) return null;
    return { graine: o.s, matiere: o.m ?? '', pseudo: String(o.p ?? '').slice(0, 16) || 'Un ami', bonnes, total, secondes: entier(o.d, 36000) ?? null, empreinte: typeof o.h === 'string' ? o.h : null };
  } catch { return null; }
}

export const lienDefi = (d, base) => { const u = new URL(base); u.search = ''; u.hash = ''; u.searchParams.set('defi', encoderDefi(d)); return u.toString(); };

// Options de QuizSession pour un défi : identiques pour tous (pas de coach, pas d'historique, pas d'adaptatif).
export const optionsDefi = (d) => ({ nbQuestions: NB_QUESTIONS_DEFI, seed: `ami|${d.graine}`, matieres: d.matiere ? [d.matiere] : null });

// Qui gagne ? Plus de bonnes réponses, puis le plus rapide.
export function comparer(moi, lui) {
  if (moi.bonnes !== lui.bonnes) return moi.bonnes > lui.bonnes ? 'gagne' : 'perdu';
  if (moi.secondes != null && lui.secondes != null && moi.secondes !== lui.secondes) return moi.secondes < lui.secondes ? 'gagne' : 'perdu';
  return 'egalite';
}
