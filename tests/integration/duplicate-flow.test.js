// @vitest-environment jsdom
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '../fixtures');

const dbFull         = JSON.parse(readFileSync(join(fixturesDir, 'notion-db-full.json'), 'utf8'));
const queryEmpty     = JSON.parse(readFileSync(join(fixturesDir, 'notion-query-empty.json'), 'utf8'));
const queryDuplicate = JSON.parse(readFileSync(join(fixturesDir, 'notion-query-duplicate.json'), 'utf8'));

import { sendToNotion, confirmSend } from '../../src/notion.js';

const TOKEN = 'ntn_testtoken';
const DBID  = 'abcdef1234567890abcdef1234567890';

const FORM_DOM = `
  <input id="f-titre" value="Le Capital" />
  <input id="f-auteur" value="Karl Marx" />
  <input id="f-nationalite" value="Allemand" />
  <input id="f-editeur" value="Éditions Sociales" />
  <input id="f-collection-ed" value="" />
  <input id="f-isbn" value="9782070360024" />
  <input id="f-datepub" value="1867" />
  <input id="f-dateed" value="1969" />
  <input id="f-pages" value="900" />
  <select id="f-theme"><option value="Histoire" selected>Histoire</option></select>
  <select id="f-soustheme"><option value="" selected></option></select>
  <select id="f-statut"><option value="Lu" selected>Lu</option></select>
  <select id="f-priorite"><option value="" selected></option></select>
  <select id="f-datelu-mois"><option value="Juin" selected>Juin</option></select>
  <select id="f-datelu-annee"><option value="2024" selected>2024</option></select>
  <select id="f-note"><option value="" selected></option></select>
  <select id="f-etat"><option value="" selected></option></select>
  <input type="checkbox" id="f-collection" />
  <textarea id="f-fiche"></textarea>
  <textarea id="f-citations"></textarea>
  <textarea id="f-comment"></textarea>
  <img id="cover-img" src="" style="display:none" />
  <p id="notion-status"></p>
`;

beforeEach(() => {
  document.body.innerHTML = FORM_DOM;
  localStorage.clear();
  localStorage.setItem('notion_token', TOKEN);
  localStorage.setItem('notion_dbid', DBID);
  localStorage.setItem('notion_proxy', 'https://proxy.test');
  vi.stubGlobal('fetch', vi.fn());
});

// ─── Pas de doublon → envoi direct ───────────────────────────────────────────

describe('Pas de doublon', () => {
  test("envoie directement quand l'ISBN n'existe pas encore", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => dbFull })        // syncDatabaseProps
      .mockResolvedValueOnce({ ok: true, json: async () => queryEmpty })    // checkDuplicate
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });         // doSend POST
    await sendToNotion();
    expect(document.getElementById('notion-status').textContent).toContain('Ajouté dans Notion');
  });
});

// ─── Doublon détecté ─────────────────────────────────────────────────────────

describe('Doublon détecté', () => {
  test('affiche le titre existant et les 3 boutons dans notion-status', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => dbFull })
      .mockResolvedValueOnce({ ok: true, json: async () => queryDuplicate });
    await sendToNotion();
    const status = document.getElementById('notion-status');
    expect(status.innerHTML).toContain('Le Capital');
    expect(status.textContent).toContain('Ajouter quand même');
    expect(status.textContent).toContain('Mettre à jour');
    expect(status.textContent).toContain('Annuler');
  });

  test("clic 'Annuler' → notion-status est vidé", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => dbFull })
      .mockResolvedValueOnce({ ok: true, json: async () => queryDuplicate });
    await sendToNotion();
    const btnAnnuler = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent === 'Annuler');
    expect(btnAnnuler).toBeTruthy();
    btnAnnuler.click();
    expect(document.getElementById('notion-status').textContent).toBe('');
  });

  test("le bouton 'Ajouter quand même' est présent dans le DOM", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => dbFull })
      .mockResolvedValueOnce({ ok: true, json: async () => queryDuplicate });
    await sendToNotion();
    const btnAdd = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent === 'Ajouter quand même');
    expect(btnAdd).toBeTruthy();
  });

  test("confirmSend() crée une page via POST /v1/pages", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => dbFull }) // syncDatabaseProps
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });  // doSend POST
    await confirmSend();
    const postCall = fetch.mock.calls.find(c => c[1]?.method === 'POST' && c[0].includes('/v1/pages'));
    expect(postCall).toBeTruthy();
    expect(document.getElementById('notion-status').textContent).toContain('Ajouté dans Notion');
  });
});

// ─── Pas de credentials configurés ───────────────────────────────────────────

describe('Credentials absents', () => {
  test("affiche un message de configuration quand le token est absent", async () => {
    localStorage.removeItem('notion_token');
    await sendToNotion();
    expect(document.getElementById('notion-status').textContent).toContain('Configure');
    expect(fetch).not.toHaveBeenCalled();
  });
});
