// Évaluateur d'expressions sûr (pas d'eval) pour les modèles de questions.
// Supporte : nombres, variables, + - * / %, parenthèses, comparaisons
// (== === != !== < <= > >=), && || !, et quelques fonctions : round, floor, ceil, abs, min, max.

const FUNCS = {
  round: (x, d = 0) => { const f = 10 ** d; return Math.round((x + Number.EPSILON) * f) / f; },
  floor: Math.floor,
  ceil: Math.ceil,
  abs: Math.abs,
  min: Math.min,
  max: Math.max,
};

function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      tokens.push({ t: 'num', v: parseFloat(src.slice(i, j)) });
      i = j; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      tokens.push({ t: 'id', v: src.slice(i, j) });
      i = j; continue;
    }
    const three = src.slice(i, i + 3);
    const two = src.slice(i, i + 2);
    if (three === '===' || three === '!==') { tokens.push({ t: 'op', v: three }); i += 3; continue; }
    if (['==', '!=', '<=', '>=', '&&', '||'].includes(two)) { tokens.push({ t: 'op', v: two }); i += 2; continue; }
    if ('+-*/%<>!(),'.includes(c)) { tokens.push({ t: 'op', v: c }); i++; continue; }
    throw new Error(`Caractère inattendu « ${c} » dans l'expression : ${src}`);
  }
  return tokens;
}

// Analyse descendante récursive, par ordre de priorité.
export function evaluate(src, vars = {}) {
  const tokens = tokenize(String(src));
  let p = 0;
  const peek = () => tokens[p];
  const eat = (v) => {
    const tok = tokens[p];
    if (!tok || (v && tok.v !== v)) throw new Error(`Attendu « ${v} » dans : ${src}`);
    p++; return tok;
  };

  const binary = (next, ops, apply) => () => {
    let left = next();
    while (peek() && peek().t === 'op' && ops.includes(peek().v)) {
      const op = eat().v;
      left = apply(op, left, next());
    }
    return left;
  };

  const primary = () => {
    const tok = peek();
    if (!tok) throw new Error(`Expression incomplète : ${src}`);
    if (tok.t === 'num') { p++; return tok.v; }
    if (tok.t === 'id') {
      p++;
      if (peek() && peek().v === '(') {
        const fn = FUNCS[tok.v];
        if (!fn) throw new Error(`Fonction inconnue : ${tok.v}`);
        eat('(');
        const args = [];
        if (peek().v !== ')') { args.push(or()); while (peek().v === ',') { eat(','); args.push(or()); } }
        eat(')');
        return fn(...args);
      }
      if (tok.v === 'true') return true;
      if (tok.v === 'false') return false;
      if (!(tok.v in vars)) throw new Error(`Variable inconnue : ${tok.v}`);
      return vars[tok.v];
    }
    if (tok.v === '(') { eat('('); const v = or(); eat(')'); return v; }
    throw new Error(`Symbole inattendu « ${tok.v} » dans : ${src}`);
  };

  const unary = () => {
    if (peek() && peek().v === '-') { eat('-'); return -unary(); }
    if (peek() && peek().v === '!') { eat('!'); return !unary(); }
    return primary();
  };

  const mul = binary(unary, ['*', '/', '%'], (op, a, b) => (op === '*' ? a * b : op === '/' ? a / b : a % b));
  const add = binary(mul, ['+', '-'], (op, a, b) => (op === '+' ? a + b : a - b));
  const cmp = binary(add, ['<', '<=', '>', '>='], (op, a, b) =>
    op === '<' ? a < b : op === '<=' ? a <= b : op === '>' ? a > b : a >= b);
  const eq = binary(cmp, ['==', '===', '!=', '!=='], (op, a, b) => (op[0] === '=' ? a === b : a !== b));
  const and = binary(eq, ['&&'], (_, a, b) => a && b);
  const or = binary(and, ['||'], (_, a, b) => a || b);

  const result = or();
  if (p !== tokens.length) throw new Error(`Fin d'expression inattendue : ${src}`);
  // Nettoie les erreurs d'arrondi flottant (0.1 + 0.2).
  return typeof result === 'number' ? Math.round(result * 1e9) / 1e9 : result;
}
