// Avatars illustrés : chaque portrait existe, les anciens avatars (emoji) restent reconnus.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { AVATARS, avatarDe, emojiAvatar, cheminAvatar, imgAvatar } from '../js/app/avatars.js';

const ANCIENS = ['🦊', '🐺', '🐯', '🦁', '🐼', '🐨', '🐸', '🐙', '🦈', '🐲', '🦅', '🦄', '🤖', '👾', '🧑‍🚀', '🥷'];

test('18 avatars, identifiants uniques, chaque image existe', async () => {
  assert.equal(AVATARS.length, 18);
  assert.equal(new Set(AVATARS.map((a) => a.id)).size, 18);
  for (const a of AVATARS) await access(new URL('../' + cheminAvatar(a.id), import.meta.url));
});

test('les joueurs existants gardent leur avatar (l\'emoji devient le portrait)', () => {
  for (const e of ANCIENS) assert.ok(avatarDe(e).img, e);
  assert.equal(emojiAvatar('ninja-fille'), '🥷');
  assert.equal(imgAvatar('🙃'), '🙃', 'avatar inconnu : l\'emoji reste affiché');
  assert.match(imgAvatar('🐺'), /assets\/avatars\/02-loup\.webp/);
});

test('icônes illustrées : chaque fichier existe et reste léger', async () => {
  const { ICONES } = await import('../js/app/icones.js');
  const { stat } = await import('node:fs/promises');
  for (const n of ICONES) {
    const s = await stat(new URL(`../assets/ui/${n}.webp`, import.meta.url));
    assert.ok(s.size < 15000, `${n} : ${s.size} octets`);
  }
});
