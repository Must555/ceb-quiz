// Rendu du kit pour les écoles en PDF : affiche A4 et billets pour le journal de classe.
// Outil de développement (Playwright n'est pas une dépendance du site) :
//   npx playwright install chromium   (une fois)
//   node scripts/kit/rendre.mjs        (le site doit être servi à la racine, ex. python3 -m http.server 8765)
// Les PDF produits vont dans assets/kit/ et sont publiés tels quels.
import { chromium } from 'playwright';

const BASE = process.env.KIT_BASE || 'http://localhost:8765/';
const SORTIES = [
  ['scripts/kit/affiche.html', 'assets/kit/affiche-mission-ceb.pdf'],
  ['scripts/kit/billets.html', 'assets/kit/billets-journal-de-classe.pdf'],
];
const navigateur = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await navigateur.newPage();
for (const [source, sortie] of SORTIES) {
  await page.goto(BASE + source, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: sortie, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log('✓', sortie);
}
await navigateur.close();
