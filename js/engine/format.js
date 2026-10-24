// Mise en forme et normalisation des réponses (conventions belges / françaises).

// 1234.5 -> "1 234,5" (espace insécable fine pour les milliers)
export function formatNombre(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return String(n);
  const neg = n < 0;
  const [ent, dec] = Math.abs(n).toString().split('.');
  const entFmt = ent.length > 3 ? ent.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : ent;
  return (neg ? '−' : '') + entFmt + (dec ? ',' + dec : '');
}

// Montant en euros : 2 décimales dès qu'il y a des cents (2,70 ; 12 ; 1 234,05).
export function formatMontant(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return String(n);
  const c = Math.round(n * 100);
  if (c % 100 === 0) return formatNombre(c / 100);
  return formatNombre(Math.trunc(c / 100)) + ',' + String(Math.abs(c % 100)).padStart(2, '0');
}

// "1 234,50 €" -> 1234.5 ; renvoie NaN si ce n'est pas un nombre.
export function parseNombre(input) {
  if (typeof input === 'number') return input;
  if (input == null) return NaN;
  let s = String(input).trim()
    .replace(/[\s  ]/g, '')
    .replace(/[€%a-zA-Zµ²³]+$/u, '')
    .replace(/^−/, '-');
  // Accepte la virgule comme séparateur décimal ; refuse "1,2,3".
  if ((s.match(/[,.]/g) || []).length > 1) return NaN;
  s = s.replace(',', '.');
  if (!/^-?\d*\.?\d+$/.test(s)) return NaN;
  return parseFloat(s);
}

// Pour comparer des mots : minuscules, sans accents, sans ponctuation ni espaces superflus.
export function normaliserTexte(s, { accents = false } = {}) {
  let out = String(s ?? '').toLowerCase().trim();
  out = out.replace(/[’']/g, "'").replace(/\s+/g, ' ').replace(/[.!?;:]+$/, '');
  if (!accents) out = out.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return out;
}
