// Génère les fichiers audio des textes d'écoute (livret 1 « Écouter ») avec Microsoft Azure Speech.
// Lancé par GitHub Actions (.github/workflows/audio.yml) : la clé reste dans les secrets du dépôt.
//   AZURE_SPEECH_KEY, AZURE_SPEECH_REGION : secrets ; COMMANDE : scripts/audio/commande.json
// commande.json : { "mode": "essai" | "tout", "examens": [...facultatif], "voix": {...}, "vitesse": "-5%" }
// Le texte officiel n'est jamais modifié : un appel par segment, assemblés en un seul MP3.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';

const cle = process.env.AZURE_SPEECH_KEY;
const region = (process.env.AZURE_SPEECH_REGION ?? '').toLowerCase().replace(/[^a-z0-9]/g, ''); // « France Central » → francecentral
if (!cle || !region) { console.error('Secrets AZURE_SPEECH_KEY et AZURE_SPEECH_REGION manquants.'); process.exit(1); }
const commande = JSON.parse(await readFile('scripts/audio/commande.json', 'utf8'));
const VOIX = { 1: 'fr-BE-CharlineNeural', 2: 'fr-BE-GerardNeural', ...(commande.voix ?? {}) };
const vitesse = commande.vitesse ?? '-5%';
const pauseLecteur = commande.pauseLecteur ?? 600; // ms entre deux personnes
const essai = commande.mode === 'essai';

const echap = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
async function synthese(texte, voix) {
  const ssml = `<speak version="1.0" xml:lang="fr-BE"><voice name="${voix}"><prosody rate="${vitesse}">${echap(texte)}</prosody></voice></speak>`;
  for (let essaiN = 1; essaiN <= 4; essaiN++) {
    const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': cle, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'mission-ceb' },
      body: ssml,
    });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    console.error(`  ${voix} : HTTP ${r.status} ${await r.text().catch(() => '')} (essai ${essaiN})`);
    await new Promise((ok) => setTimeout(ok, 3000 * essaiN));
  }
  throw new Error('Synthèse impossible');
}
// Un silence MP3 de la même qualité : on synthétise une pause SSML une seule fois.
const silences = {};
async function silence(ms) {
  if (!silences[ms]) {
    const ssml = `<speak version="1.0" xml:lang="fr-BE"><voice name="${VOIX[1]}"><break time="${ms}ms"/></voice></speak>`;
    const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': cle, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'mission-ceb' }, body: ssml });
    silences[ms] = r.ok ? Buffer.from(await r.arrayBuffer()) : Buffer.alloc(0);
  }
  return silences[ms];
}

const fichiers = (await readdir('data/examens')).filter((f) => /^ceb-.*\.json$/.test(f)).sort();
const dejaFait = new Map(); // même texte (2026 socles / tronc commun) : un seul fichier
const sortie = essai ? 'audio-essais' : 'assets/audio';
await mkdir(sortie, { recursive: true });
const index = {};
for (const f of fichiers) {
  const ex = f.replace('.json', '');
  if (commande.examens && !commande.examens.includes(ex)) continue;
  const d = JSON.parse(await readFile(`data/examens/${f}`, 'utf8'));
  const docs = Array.isArray(d.documents) ? d.documents : Object.values(d.documents ?? {});
  for (const doc of docs.filter((x) => x.segments?.length)) {
    const cleTexte = doc.segments.map((s) => s.texte).join('|');
    if (dejaFait.has(cleTexte)) { index[`${ex}/${doc.id}`] = dejaFait.get(cleTexte); continue; }
    const segments = essai ? doc.segments.slice(0, 2) : doc.segments;
    console.log(`${ex} / ${doc.id} : ${segments.length} segments`);
    const morceaux = [];
    for (const [i, s] of segments.entries()) {
      if (i > 0) morceaux.push(await silence(segments[i - 1].lecteur !== s.lecteur ? pauseLecteur : 350));
      morceaux.push(await synthese(s.texte, VOIX[s.lecteur ?? 1] ?? VOIX[1]));
    }
    const nom = `${ex}-${doc.id}.mp3`;
    await writeFile(`${sortie}/${nom}`, Buffer.concat(morceaux));
    dejaFait.set(cleTexte, nom);
    index[`${ex}/${doc.id}`] = nom;
  }
}
await writeFile(`${sortie}/index.json`, JSON.stringify({ voix: VOIX, vitesse, fichiers: index }, null, 1) + '\n');
console.log('Terminé :', Object.keys(index).length, 'textes');
