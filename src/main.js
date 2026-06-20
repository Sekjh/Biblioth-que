import { initThemes, lookup, updateSousTheme, toggleLu, toggleDevlog, suggestTheme, generateFiche, toggleSourcePopover, getLastIsbn } from './ui.js';
import { sendToNotion, saveConfig, toggleConfig } from './notion.js';

// Populate year select (1980 → current year)
const sel = document.getElementById('f-datelu-annee');
const now = new Date().getFullYear();
for (let y = now; y >= 1980; y--) {
  const opt = document.createElement('option');
  opt.value = y; opt.textContent = y;
  sel.appendChild(opt);
}

initThemes();

// ISBN input
const isbnInput = document.getElementById('isbn-input');
const btnLookup = document.getElementById('btn-lookup');
isbnInput.addEventListener('input', function() {
  this.value = this.value.replace(/[^0-9Xx-]/g, '');
  const normalized = this.value.trim().replace(/[-\s]/g, '');
  btnLookup.disabled = normalized !== '' && normalized === getLastIsbn();
});
isbnInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') lookup(isbnInput.value.trim());
});
btnLookup.addEventListener('click', () => lookup(isbnInput.value.trim()));

// Cmd/Ctrl+Enter anywhere in the form sends to Notion
document.getElementById('form-section').addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    sendToNotion();
  }
});

// Retrait du badge quand l'utilisateur modifie un champ auto-rempli
for (const id of ['f-titre', 'f-auteur', 'f-editeur', 'f-collection-ed', 'f-dateed', 'f-pages']) {
  document.getElementById(id).addEventListener('input', function() { this.classList.remove('prefilled'); });
}
document.getElementById('f-fiche').addEventListener('input', function() { this.classList.remove('ai-filled'); });
document.getElementById('f-soustheme').addEventListener('change', function() { this.classList.remove('ai-filled'); });

// Classification
document.getElementById('f-theme').addEventListener('change', () => {
  updateSousTheme();
  document.getElementById('f-theme').classList.remove('ai-filled');
  document.getElementById('f-soustheme').classList.remove('ai-filled');
});
document.getElementById('btn-suggest-theme').addEventListener('click', suggestTheme);

// Statut & lecture
document.getElementById('f-statut').addEventListener('change', toggleLu);

// Fiche de lecture
document.getElementById('btn-generate-fiche').addEventListener('click', generateFiche);
document.getElementById('btn-clear-fiche').addEventListener('click', () => {
  const fiche = document.getElementById('f-fiche');
  fiche.value = '';
  fiche.classList.remove('ai-filled');
});

// Envoi Notion
document.getElementById('btn-send-notion').addEventListener('click', sendToNotion);

// Source popover
document.getElementById('source-badge').addEventListener('click', toggleSourcePopover);
document.addEventListener('click', e => {
  if (!e.target.closest('#source-badge') && !e.target.closest('#source-popover'))
    document.getElementById('source-popover').hidden = true;
});

// Barre de navigation bas de page
document.getElementById('btn-toggle-devlog').addEventListener('click', toggleDevlog);
document.getElementById('btn-toggle-config').addEventListener('click', toggleConfig);
document.getElementById('btn-close-devlog').addEventListener('click', toggleDevlog);

// Config panel
document.getElementById('btn-save-config').addEventListener('click', saveConfig);

// iOS Shortcuts — auto-lookup si ?isbn= dans l'URL
const params = new URLSearchParams(window.location.search);
const isbnParam = params.get('isbn');
if (isbnParam) {
  setTimeout(() => lookup(isbnParam.replace(/[^0-9Xx]/g, '')), 300);
}
