import { THEMES } from './themes.js';
import { validateIsbn } from './isbn.js';
import { fetchBnF, fetchOpenLibrary, fetchGoogle, fetchCover } from './fetchers.js';
import { callClaude } from './claude.js';

export function setStatus(msg) {
  document.getElementById('status').textContent = msg;
}

export function setField(id, val) {
  const el = document.getElementById(id);
  el.value = val || '';
  el.classList.toggle('prefilled', !!(val && val.toString().trim()));
}

export function initThemes() {
  document.getElementById('f-theme').innerHTML = '<option value="">— Thème —</option>' +
    Object.keys(THEMES).map(t=>`<option value="${t}">${t}</option>`).join('');
  document.getElementById('f-soustheme').innerHTML = '<option value="">— Sous-thème —</option>';
}

export function updateSousTheme() {
  const t = document.getElementById('f-theme').value;
  const sel = document.getElementById('f-soustheme');
  if (!t) {
    sel.innerHTML = '<option value="">— Sous-thème —</option>';
    return;
  }
  sel.innerHTML = '<option value="">— Sous-thème —</option>' +
    THEMES[t].map(s=>`<option value="${s}">${s}</option>`).join('');
}

export function toggleLu() {
  const statut = document.getElementById('f-statut').value;
  const lu = statut === 'Lu' || statut === 'Étude';
  const avecPriorite = statut === 'À lire' || statut === 'En cours';
  document.getElementById('datelu-block').classList.toggle('hidden', !lu);
  document.getElementById('note-block').classList.toggle('hidden', !lu);
  document.getElementById('priorite-block').classList.toggle('hidden', !avecPriorite);
}

export function toggleDevlog() {
  const d = document.getElementById('devlog');
  d.style.display = d.style.display === 'none' ? 'block' : 'none';
}

export function detectCollection(b) {
  const COLLECTION_KEYWORDS = [
    'pléiade', 'pleiade',
    'bouquins', 'quarto',
    'bibliothèque de la pléiade',
    'folio classique', 'folio plus classique',
    'classiques garnier', 'classiques de poche',
    'the library of america',
    'everyman', "penguin classics deluxe",
    'bibliothèque de la pléiade',
  ];
  const COLLECTION_PUBLISHERS = [
    'gallimard', 'robert laffont', 'flammarion',
  ];
  const EDITION_KEYWORDS = [
    'édition originale', 'première édition', 'edition originale',
    'tirage limité', 'numéroté', 'numerote',
  ];

  const col = (b.collection || '').toLowerCase();
  const edit = (b.editeur || '').toLowerCase();
  const titre = (b.titre || '').toLowerCase();
  const date = parseInt(b.datepub || b.dateed || '9999');

  for (const kw of COLLECTION_KEYWORDS) {
    if (col.includes(kw) || titre.includes(kw)) {
      return { detected: true, reason: `collection "${b.collection || kw}"` };
    }
  }
  for (const kw of EDITION_KEYWORDS) {
    if (col.includes(kw) || titre.includes(kw)) {
      return { detected: true, reason: kw };
    }
  }
  if (date < 1900 && COLLECTION_PUBLISHERS.some(p => edit.includes(p))) {
    return { detected: true, reason: `édition ancienne (${date})` };
  }

  return { detected: false, reason: '' };
}

export function fillForm(b) {
  setField('f-titre', b.titre);
  setField('f-auteur', b.auteur);
  document.getElementById('f-nationalite').value = b.nationalite || '';
  document.getElementById('f-nationalite').classList.remove('prefilled');
  setField('f-editeur', b.editeur);
  setField('f-collection-ed', b.collection);
  setField('f-isbn', b.isbn);
  setField('f-dateed', b.dateed);
  document.getElementById('f-datepub').value = '';
  document.getElementById('f-datepub').classList.remove('prefilled');
  setField('f-pages', b.pages);
  document.getElementById('f-datelu-mois').value = '';
  document.getElementById('f-datelu-annee').value = '';
  document.getElementById('f-fiche').value = '';
  document.getElementById('f-fiche').classList.remove('ai-filled');
  document.getElementById('f-theme').classList.remove('ai-filled');
  document.getElementById('f-soustheme').classList.remove('ai-filled');
  document.getElementById('f-citations').value = '';
  document.getElementById('found-title').textContent = b.titre || (b.isbn ? 'ISBN : ' + b.isbn : '');
  document.getElementById('source-badge').textContent = b.source ? `Source : ${b.source}` : 'Saisie manuelle';
  const img = document.getElementById('cover-img');
  if (b.couverture) { img.src = b.couverture; img.style.display = 'block'; } else { img.style.display = 'none'; }

  const collectionHint = detectCollection(b);
  document.getElementById('f-collection').checked = collectionHint.detected;
  const hintEl = document.getElementById('collection-hint');
  hintEl.textContent = collectionHint.detected ? `✦ Coché automatiquement (${collectionHint.reason})` : '';

  document.getElementById('form-section').style.display = 'block';
  const outputSection = document.getElementById('output-section');
  if (outputSection) outputSection.style.display = 'none';
}

export async function lookup(isbnArg = '') {
  const raw = isbnArg.trim().replace(/[-\s]/g, '');
  if (!raw) return;
  if (!validateIsbn(raw)) {
    setStatus('⚠️ ISBN invalide — vérifie le numéro (chiffre de contrôle incorrect).');
    return;
  }
  setStatus('Recherche en cours…');
  document.getElementById('form-section').style.display = 'none';

  const engine = localStorage.getItem('search_engine') || 'bnf';
  let b = { isbn: raw, titre: '', auteur: '', editeur: '', collection: '', dateed: '', pages: '', couverture: '', source: '' };

  const all = [fetchBnF, fetchOpenLibrary, fetchGoogle];
  const preferred = { bnf: fetchBnF, openlibrary: fetchOpenLibrary, google: fetchGoogle };
  const first = preferred[engine] || fetchBnF;
  const rest = all.filter(f => f !== first);
  const fetchers = [first, ...rest];

  const sources = [];
  for (const fetcher of fetchers) {
    if (['titre', 'auteur', 'editeur', 'pages'].every(f => b[f])) break;
    const tmp = { isbn: raw, titre: '', auteur: '', editeur: '', collection: '', dateed: '', pages: '', couverture: '', source: '' };
    try { await fetcher(raw, tmp); } catch(e) {}
    let contributed = false;
    for (const key of ['titre', 'auteur', 'editeur', 'collection', 'dateed', 'pages', 'couverture']) {
      if (!b[key] && tmp[key]) { b[key] = tmp[key]; contributed = true; }
    }
    if (contributed && tmp.source) sources.push(tmp.source);
  }
  b.source = sources.join(' • ');

  setStatus(b.titre ? '' : 'ISBN introuvable — remplis manuellement.');

  if (!b.couverture) {
    const cover = await fetchCover(raw);
    if (cover) b.couverture = cover;
  }

  fillForm(b);
}

export async function suggestTheme() {
  const titre  = document.getElementById('f-titre').value.trim();
  const auteur = document.getElementById('f-auteur').value.trim();
  if (!titre && !auteur) {
    document.getElementById('theme-ai-status').textContent = '⚠️ Renseigne d\'abord le titre et/ou l\'auteur.';
    return;
  }
  const btn = document.getElementById('btn-suggest-theme');
  const status = document.getElementById('theme-ai-status');
  btn.disabled = true;
  status.textContent = '✦ Analyse en cours…';

  const sousThemes = Object.entries(THEMES).map(([t, ss]) => `${t} : ${ss.join(', ')}`).join('\n');
  const prompt = `Tu es un bibliothécaire expert. Pour le livre "${titre}" de ${auteur || 'auteur inconnu'}, choisis le thème et le sous-thème les plus appropriés parmi ces options exactes :

${sousThemes}

Réponds UNIQUEMENT avec ce format JSON, sans texte autour :
{"theme": "...", "sousTheme": "..."}`;

  try {
    const raw = await callClaude(prompt);
    const json = JSON.parse(raw.match(/\{.*\}/s)?.[0] || raw);
    const theme = json.theme || '';
    const sousTheme = json.sousTheme || '';

    if (theme && THEMES[theme]) {
      document.getElementById('f-theme').value = theme;
      updateSousTheme();
      if (sousTheme && THEMES[theme].includes(sousTheme)) {
        document.getElementById('f-soustheme').value = sousTheme;
      }
      document.getElementById('f-theme').classList.add('ai-filled');
      document.getElementById('f-soustheme').classList.add('ai-filled');
      status.textContent = `✓ Suggestion : ${theme}${sousTheme ? ' › ' + sousTheme : ''}`;
    } else {
      status.textContent = '⚠️ Suggestion hors liste — vérifie manuellement.';
    }
  } catch(e) {
    status.textContent = '🔴 ' + e.message;
  }
  btn.disabled = false;
}

export async function generateFiche() {
  const titre      = document.getElementById('f-titre').value.trim();
  const auteur     = document.getElementById('f-auteur').value.trim();
  const datepub    = document.getElementById('f-datepub').value.trim();
  const editeur    = document.getElementById('f-editeur').value.trim();
  const collection = document.getElementById('f-collection-ed').value.trim();
  if (!titre) {
    document.getElementById('fiche-ai-status').textContent = '⚠️ Renseigne d\'abord le titre.';
    return;
  }
  const btn = document.getElementById('btn-generate-fiche');
  const status = document.getElementById('fiche-ai-status');
  btn.disabled = true;
  status.textContent = '✦ Génération en cours…';

  const theme     = document.getElementById('f-theme').value.trim();
  const sousTheme = document.getElementById('f-soustheme').value.trim();
  const themeCtx  = [theme, sousTheme].filter(Boolean).join(' › ');

  const prompt = `Fiche de lecture pour "${titre}"${auteur ? ' de ' + auteur : ''}${datepub ? ' (' + datepub + ')' : ''}${editeur ? ' — éd. ' + editeur : ''}${collection ? ' (' + collection + ')' : ''}${themeCtx ? ' — ' + themeCtx : ''}.

Réponds en exactement 3 points courts, une ligne chacun, format :
• [propos ou intrigue centrale — une phrase]
• [idées, enjeux ou événements clés — une phrase]
• [ce qui rend ce livre singulier ou mémorable — une phrase]

Règles : pas de titre, pas d'introduction, pas de jugement stylistique. Adapte-toi au type d'œuvre (roman, essai, poésie, traité, etc.). En français.
Commence ta réponse par "#Générée automatiquement par IA" puis une ligne vide, puis les 3 points.`;

  try {
    const fiche = await callClaude(prompt, { model: 'claude-sonnet-4-6', maxTokens: 600 });
    const ficheEl = document.getElementById('f-fiche');
    ficheEl.value = fiche.trim();
    ficheEl.classList.add('ai-filled');
    status.textContent = '✓ Fiche générée — vérifie et modifie si nécessaire.';
  } catch(e) {
    status.textContent = '🔴 ' + e.message;
  }
  btn.disabled = false;
}
