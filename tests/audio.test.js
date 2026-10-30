// Textes d'écoute enregistrés : chaque fichier annoncé existe, chaque texte d'écoute en a un.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

test('chaque texte d\'écoute a son fichier audio, et il existe', () => {
  for (const f of readdirSync('data/examens').filter((x) => /^ceb-.*\.json$/.test(x))) {
    const d = JSON.parse(readFileSync(`data/examens/${f}`, 'utf8'));
    const docs = Array.isArray(d.documents) ? d.documents : Object.values(d.documents ?? {});
    for (const doc of docs.filter((x) => x.segments?.length)) {
      assert.ok(doc.audio, `${f} / ${doc.id} : pas de fichier audio`);
      assert.ok(existsSync(doc.audio), `${f} / ${doc.id} : ${doc.audio} introuvable`);
    }
  }
});
