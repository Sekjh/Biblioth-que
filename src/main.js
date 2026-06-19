import { initThemes, lookup, updateSousTheme, toggleLu, toggleDevlog, suggestTheme, generateFiche } from './ui.js';
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

// Cmd/Ctrl+Enter anywhere in the form sends to Notion
document.getElementById('form-section').addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    sendToNotion();
  }
});

// Classification
document.getElementById('f-theme').addEventListener('change', updateSousTheme);
document.getElementById('btn-suggest-theme').addEventListener('click', suggestTheme);

// Statut & lecture
document.getElementById('f-statut').addEventListener('change', toggleLu);

// Fiche de lecture
document.getElementById('btn-generate-fiche').addEventListener('click', generateFiche);
document.getElementById('btn-clear-fiche').addEventListener('click', () => {
  document.getElementById('f-fiche').value = '';
});

// Envoi Notion
document.getElementById('btn-send-notion').addEventListener('click', sendToNotion);

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
