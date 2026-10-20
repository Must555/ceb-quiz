# Prépare les icônes illustrées qui remplacent les emojis restants (à relancer si de nouveaux emojis apparaissent).
#   python3 scripts/preparer-emojis.py <dossier du paquet npm @lobehub/fluent-emoji-3d> <dossier du paquet npm @phosphor-icons/core>
# - « Signes » d'interface (✕, 🔊, 📋…) → pictogrammes Phosphor (SVG, prennent la couleur du texte) : assets/ui/pictos/
# - Tous les autres emojis du site et des fiches → Fluent Emoji 3D (Microsoft, MIT), 72 px WebP : assets/emoji/
# - Écrit js/app/emojis-dispo.js (la liste de ce qui existe), lu par js/app/illustrer.js.
import sys, re, json, glob, os
from PIL import Image
FLUENT, PHOSPHOR = sys.argv[1], sys.argv[2]
RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIGNES = {'✕': 'x', '✖': 'x', '✘': 'x', '✔': 'check', '↺': 'arrow-counter-clockwise', '➕': 'plus', '➖': 'minus', '🔊': 'speaker-high', '🔇': 'speaker-slash',
  '⏹': 'stop', '⏸': 'pause', '📋': 'copy', '🔑': 'key', '⚑': 'flag', '🔍': 'magnifying-glass', '🔎': 'magnifying-glass', '🗑': 'trash', '📤': 'share-network',
  '✉': 'envelope-simple', '⚠': 'warning', '🔒': 'lock', '👇': 'arrow-down', '➡': 'arrow-right', '🎚': 'sliders-horizontal', '▶': 'play', '🔄': 'arrows-clockwise', '🔁': 'arrows-left-right'}
EMO = re.compile(r'(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2})(?:️|‍(?:\p{Extended_Pictographic})️?|[\U0001F3FB-\U0001F3FF])*'.replace(r'\p{Extended_Pictographic}', '[©®‼⁉™ℹ↔-↙↩↪⌚⌛⌨⏏⏩-⏳⏸-⏺Ⓜ▪▫▶◀◻-◾☀-➿⤴⤵⬅-⬇⬛⬜⭐⭕〰〽㊗㊙\U0001F000-\U0001FAFF]').replace(r'\p{Regional_Indicator}', '[\U0001F1E6-\U0001F1FF]'))
textes = ''.join(open(f, encoding='utf8').read() for f in glob.glob(f'{RACINE}/js/app/*.js') + glob.glob(f'{RACINE}/data/fiches*.json') + [f'{RACINE}/index.html'])
trouves = sorted(set(m.group(0) for m in EMO.finditer(textes)))
code = lambda e: '-'.join(f'{ord(c):x}' for c in e)
fluent, pictos, manquants = {}, {}, []
for e in trouves:
    base = e.replace('️', '')
    if base in SIGNES:
        n = SIGNES[base]; src = f'{PHOSPHOR}/assets/bold/{n}-bold.svg'
        open(f'{RACINE}/assets/ui/pictos/{n}.svg', 'w').write(open(src).read()); pictos[e] = n; continue
    for c in (code(e), code(base), code(base) + '-fe0f', code(e).replace('-fe0f', '')):
        p = f'{FLUENT}/assets/{c}.webp'
        if os.path.exists(p):
            im = Image.open(p).convert('RGBA'); im.thumbnail((72, 72), Image.LANCZOS)
            im.save(f'{RACINE}/assets/emoji/{code(base)}.webp', quality=82, method=6); fluent[e] = code(base); break
    else: manquants.append(e)
with open(f'{RACINE}/js/app/emojis-dispo.js', 'w', encoding='utf8') as f:
    f.write('// FICHIER GÉNÉRÉ par scripts/preparer-emojis.py : emoji → image (Fluent 3D) ou pictogramme (Phosphor).\n')
    f.write(f'export const FLUENT = {json.dumps(fluent, ensure_ascii=False, indent=1, sort_keys=True)};\n')
    f.write(f'export const PICTOS = {json.dumps(pictos, ensure_ascii=False, indent=1, sort_keys=True)};\n')
print(len(fluent), 'Fluent 3D ·', len(pictos), 'pictogrammes · manquants :', ''.join(manquants))
